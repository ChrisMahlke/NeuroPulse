"""
NeuroPulse - Circuit Breaker Pattern

Implements circuit breaker pattern for AI service calls to prevent cascading failures
and provide graceful degradation when external services (Vertex AI, Gemini) are unavailable.

Circuit Breaker States:
    - CLOSED: Normal operation, requests pass through
    - OPEN: Too many failures, requests fail fast without calling service
    - HALF_OPEN: Testing if service recovered, limited requests allowed

This is a production-ready pattern that demonstrates resilience engineering
for the hackathon submission.
"""

import time
import logging
from enum import Enum
from typing import Callable, Any, Optional
from dataclasses import dataclass
from functools import wraps

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    """Circuit breaker states"""
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failing, reject requests
    HALF_OPEN = "half_open"  # Testing recovery


@dataclass
class CircuitBreakerConfig:
    """Configuration for circuit breaker"""
    failure_threshold: int = 5  # Number of failures before opening
    success_threshold: int = 2  # Number of successes to close from half-open
    timeout: float = 60.0  # Seconds to wait before trying again (open → half-open)
    
    
class CircuitBreaker:
    """
    Circuit breaker for protecting against cascading failures.
    
    Usage:
        breaker = CircuitBreaker(name="vertex_ai")
        
        @breaker.call
        def call_vertex_ai():
            return vertex_ai_client.predict(...)
    """
    
    def __init__(self, name: str, config: Optional[CircuitBreakerConfig] = None):
        self.name = name
        self.config = config or CircuitBreakerConfig()
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: Optional[float] = None
        
        logger.info(f"Circuit breaker '{name}' initialized (threshold: {self.config.failure_threshold})")
    
    def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute function with circuit breaker protection.
        
        Args:
            func: Function to call
            *args, **kwargs: Arguments to pass to function
            
        Returns:
            Function result if successful
            
        Raises:
            CircuitBreakerOpenError: If circuit is open
            Exception: Original exception from function if circuit allows call
        """
        # Check if circuit is open
        if self.state == CircuitState.OPEN:
            if self._should_attempt_reset():
                logger.info(f"Circuit breaker '{self.name}': Attempting reset (OPEN → HALF_OPEN)")
                self.state = CircuitState.HALF_OPEN
                self.success_count = 0
            else:
                # Circuit still open, fail fast
                raise CircuitBreakerOpenError(
                    f"Circuit breaker '{self.name}' is OPEN. "
                    f"Service unavailable. Using fallback."
                )
        
        # Attempt to call function
        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
            
        except Exception as e:
            self._on_failure()
            raise
    
    def _on_success(self):
        """Handle successful call"""
        if self.state == CircuitState.HALF_OPEN:
            self.success_count += 1
            logger.debug(f"Circuit breaker '{self.name}': Success in HALF_OPEN "
                        f"({self.success_count}/{self.config.success_threshold})")
            
            if self.success_count >= self.config.success_threshold:
                logger.info(f"Circuit breaker '{self.name}': Closing (HALF_OPEN → CLOSED)")
                self.state = CircuitState.CLOSED
                self.failure_count = 0
                self.success_count = 0
        else:
            # Reset failure count on success in CLOSED state
            self.failure_count = 0
    
    def _on_failure(self):
        """Handle failed call"""
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.state == CircuitState.HALF_OPEN:
            # Any failure in HALF_OPEN immediately opens circuit
            logger.warning(f"Circuit breaker '{self.name}': Failure in HALF_OPEN, reopening")
            self.state = CircuitState.OPEN
            self.success_count = 0
            
        elif self.failure_count >= self.config.failure_threshold:
            # Too many failures, open circuit
            logger.error(
                f"Circuit breaker '{self.name}': Opening circuit "
                f"({self.failure_count} failures >= {self.config.failure_threshold} threshold)"
            )
            self.state = CircuitState.OPEN
    
    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to attempt reset"""
        if self.last_failure_time is None:
            return True
        
        elapsed = time.time() - self.last_failure_time
        return elapsed >= self.config.timeout
    
    def get_state(self) -> dict:
        """Get current circuit breaker state for monitoring"""
        return {
            "name": self.name,
            "state": self.state.value,
            "failure_count": self.failure_count,
            "success_count": self.success_count,
            "last_failure_time": self.last_failure_time,
        }


class CircuitBreakerOpenError(Exception):
    """Raised when circuit breaker is open"""
    pass


# Global circuit breakers for AI services
_vertex_ai_breaker: Optional[CircuitBreaker] = None
_gemini_breaker: Optional[CircuitBreaker] = None


def get_vertex_ai_breaker() -> CircuitBreaker:
    """Get or create Vertex AI circuit breaker"""
    global _vertex_ai_breaker
    if _vertex_ai_breaker is None:
        _vertex_ai_breaker = CircuitBreaker(
            name="vertex_ai",
            config=CircuitBreakerConfig(
                failure_threshold=3,  # Open after 3 failures
                success_threshold=2,  # Close after 2 successes
                timeout=30.0  # Try again after 30 seconds
            )
        )
    return _vertex_ai_breaker


def get_gemini_breaker() -> CircuitBreaker:
    """Get or create Gemini circuit breaker"""
    global _gemini_breaker
    if _gemini_breaker is None:
        _gemini_breaker = CircuitBreaker(
            name="gemini",
            config=CircuitBreakerConfig(
                failure_threshold=3,
                success_threshold=2,
                timeout=30.0
            )
        )
    return _gemini_breaker

