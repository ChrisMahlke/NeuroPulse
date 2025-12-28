"""
NeuroPulse - API Server

FastAPI server that provides real-time AI predictions to the NeuroPulse dashboard.
This server acts as the bridge between the AI prediction pipeline and the web interface,
consuming predictions from the Kafka topic `ai.prediction.output` and serving them via
REST API and WebSocket connections.

Architecture Context:
    The NeuroPulse system processes acute ischemic stroke cases through the following pipeline:
    1. EMS data (vitals, FAST exams) → Kafka topics
    2. Stream processor → Feature engineering → Vertex AI (stroke/LVO probability)
    3. Gemini LLM → Natural language explanations and clinical recommendations
    4. Predictions published to `ai.prediction.output` Kafka topic
    5. This API server → Consumes predictions → Serves to dashboard in real-time

AI/Medical Context:
    - Stroke probability: AI model estimates likelihood of acute ischemic stroke (0-1)
    - LVO probability: AI model estimates likelihood of Large Vessel Occlusion (0-1)
    - Risk categories: LOW, MODERATE, HIGH, CRITICAL (derived from probabilities)
    - Hospital routing: AI recommends primary vs comprehensive stroke centers based on
      LVO probability, travel time, and treatment window constraints
    - Time windows: Critical for stroke treatment (IV tPA typically within 4.5 hours,
      EVT may be considered up to 6-24 hours depending on imaging)

Note: All data in this system is synthetic and for demonstration purposes only.
"""

from __future__ import annotations

import json
import asyncio
import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import threading
import time

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, validator
from confluent_kafka import Consumer, KafkaError

from .kafka_consumer_helper import create_kafka_consumer
from .metrics_collector import get_metrics_collector

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from ai_models.neuro_pulse_ai.prediction_service_stub import AiPredictionResponse


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] [%(name)s] [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Configuration from environment variables
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")
ENABLE_ADMIN_ENDPOINTS = os.getenv("ENABLE_ADMIN_ENDPOINTS", "true").lower() == "true"
PORT = int(os.getenv("PORT", "8000"))

# Initialize FastAPI application
app = FastAPI(title="NeuroPulse API", version="1.0.0")

# CORS middleware configuration
# Allows the Next.js dashboard (running on different port) to access this API
# In production, set ALLOWED_ORIGINS environment variable to specific domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)


# In-memory data stores
# These hold the latest predictions and case summaries for quick API access.
# In a production environment, consider using Redis or a database for persistence
# and to support horizontal scaling across multiple API server instances.
predictions_store: Dict[str, Dict[str, Any]] = {}  # Full prediction details by case_id
cases_store: Dict[str, Dict[str, Any]] = {}  # Case summaries for list views

# Streaming metrics for hackathon visibility - tracks Kafka message flow
streaming_metrics = {
    "kafka_connected": False,
    "messages_received": 0,
    "messages_per_second": 0.0,
    "last_message_time": None,
    "topics": {
        "ai.prediction.output": {
            "messages_received": 0,
            "last_message_time": None,
        }
    },
    "consumer_lag": None,  # Will be populated if available
    "uptime_seconds": 0,
    "start_time": datetime.now(timezone.utc),
}

# WebSocket connection management
# Tracks all active WebSocket connections for real-time push updates when new
# AI predictions arrive from Kafka. This enables the dashboard to update without polling.
active_connections: List[WebSocket] = []

# Event loop reference for cross-thread WebSocket broadcasting
# The Kafka consumer runs in a background thread, but WebSocket operations must
# execute on the main async event loop. This reference allows the consumer thread
# to schedule WebSocket broadcasts safely.
ws_event_loop: Optional[asyncio.AbstractEventLoop] = None


class CaseSummary(BaseModel):
    """
    Summary model for displaying cases in the dashboard list view.
    
    This lightweight model contains only the essential fields needed for the
    case list/card view, reducing payload size and improving dashboard performance.
    Full details are available via the /api/cases/{case_id} endpoint.
    """
    caseId: str  # Unique identifier for the stroke case
    patientId: str  # Patient identifier (anonymized in demo)
    displayName: str  # Human-readable patient identifier for UI
    riskCategory: str  # AI-determined risk: "LOW", "MODERATE", "HIGH", "CRITICAL"
    strokeProbability: float  # AI model output: probability of acute ischemic stroke (0.0-1.0)
    lvoProbability: float  # AI model output: probability of Large Vessel Occlusion (0.0-1.0)
    minutesSinceOnset: Optional[int]  # Time elapsed since symptom onset (critical for treatment windows)
    isActive: bool  # Whether this case is currently active in the system


class PredictionDetail(BaseModel):
    """
    Complete prediction detail model for the dashboard's case detail view.
    
    Contains all AI-generated predictions, recommendations, and explanations:
    - Stroke/LVO probabilities from Vertex AI models
    - Hospital routing recommendations (primary vs comprehensive stroke center)
    - Time window assessments (critical for treatment eligibility)
    - Risk factors identified by the AI
    - Natural language explanations from Gemini LLM
    - Clinical action recommendations from Gemini
    
    Medical Context:
        - Primary stroke centers: Can administer IV tPA (thrombolysis)
        - Comprehensive stroke centers: Can perform EVT (endovascular thrombectomy) for LVO
        - Door-to-needle time: Time from hospital arrival to treatment initiation
        - Treatment windows: IV tPA typically within 4.5 hours, EVT may extend to 6-24 hours
    """
    predictionId: str  # Unique identifier for this prediction instance
    caseId: str  # Case identifier this prediction belongs to
    patientId: str  # Patient identifier
    predictionTs: str  # ISO timestamp when prediction was generated
    strokeProbability: float  # Vertex AI model output: probability of stroke (0.0-1.0)
    lvoProbability: float  # Vertex AI model output: probability of LVO (0.0-1.0)
    riskCategory: str  # Derived category: "LOW", "MODERATE", "HIGH", "CRITICAL"
    
    # Hospital routing recommendations (AI-optimized based on LVO probability and travel time)
    recommendedDestinationHospitalId: Optional[str] = None  # Hospital ID for routing
    recommendedDestinationType: Optional[str] = None  # "PRIMARY_CENTER" or "COMPREHENSIVE_CENTER"
    estimatedTravelMinToRecommended: Optional[int] = None  # Estimated ambulance travel time
    estimatedAdditionalDoorToNeedleMinAtRecommended: Optional[int] = None  # Expected hospital processing delay
    
    # Clinical context and AI insights
    timeWindowAssessment: Optional[str] = None  # AI assessment of treatment window eligibility
    topRiskFactors: Optional[List[str]] = None  # Key clinical factors driving the prediction
    
    # LLM-generated explanations (from Google Gemini)
    llmExplanationSummary: Optional[str] = None  # Natural language summary of the prediction
    llmRecommendedActions: Optional[str] = None  # Clinical action items for EMS/ED teams
    
    currentVitals: Optional[Dict[str, Any]] = None  # Latest vital signs snapshot
    
    # Enhanced AI features
    predictionConfidence: Optional[float] = None  # Confidence score (0.0-1.0) for the prediction
    trendIndicators: Optional[Dict[str, Any]] = None  # Temporal trend features (rate of change, volatility, etc.)
    detectedAnomalies: Optional[List[str]] = None  # Anomalies detected in vital signs
    featureImportance: Optional[Dict[str, float]] = None  # Feature importance scores for explainability
    
    model_config = ConfigDict(
        # Include None values in JSON response to maintain API contract consistency
        # In Pydantic v2, None values are excluded by default in serialization
        # We keep the default behavior (exclude None) for cleaner API responses
    )


def _convert_prediction_to_case_summary(pred: Dict[str, Any]) -> CaseSummary:
    """
    Convert a full AI prediction dictionary to a lightweight case summary.
    
    This transformation extracts only the essential fields needed for the dashboard's
    case list view, reducing payload size and improving performance. The full prediction
    data remains available in predictions_store for detailed views.
    
    Args:
        pred: Full prediction dictionary from Kafka (matches AiPredictionResponse structure)
        
    Returns:
        CaseSummary: Lightweight model for list/card views
        
    Note:
        In a production system, patient display names would be derived from a
        demographics service or patient registry, not from patient IDs.
    """
    # Extract patient display name (would come from demographics in production)
    # For demo purposes, we use the last 4 characters of the patient ID
    patient_id = pred.get("patient_id", "UNKNOWN")
    display_name = f"Patient {patient_id[-4:]}"  # Simple display
    
    # Extract time since symptom onset (critical for treatment window assessment)
    # This value is calculated upstream in the stream processor based on EMS timestamps
    minutes_since_onset = None
    if "minutes_since_symptom_onset" in pred:
        # Convert to int (round float values) since CaseSummary expects Optional[int]
        val = pred["minutes_since_symptom_onset"]
        minutes_since_onset = int(round(val)) if val is not None else None
    
    return CaseSummary(
        caseId=pred["case_id"],
        patientId=pred["patient_id"],
        displayName=display_name,
        riskCategory=pred["risk_category"],
        strokeProbability=pred["stroke_probability"] or 0.0,
        lvoProbability=pred["lvo_probability"] or 0.0,
        minutesSinceOnset=minutes_since_onset,
        isActive=True,
    )


def _kafka_consumer_loop():
    """
    Background thread that consumes AI predictions from Kafka and updates the in-memory store.
    
    This function runs in a separate daemon thread to avoid blocking the FastAPI server.
    It continuously polls the `ai.prediction.output` Kafka topic for new predictions generated
    by the stream processor (which calls Vertex AI and Gemini).
    
    Data Flow:
        1. Stream processor → Vertex AI (stroke/LVO probabilities)
        2. Stream processor → Gemini (explanations and recommendations)
        3. Predictions published to Kafka topic `ai.prediction.output`
        4. This consumer → Updates in-memory stores → Broadcasts via WebSocket
    
    Error Handling:
        - Gracefully handles missing Kafka configuration (allows API to run without Kafka)
        - Continues processing on individual message errors
        - Handles partition EOF (end of partition) as a normal condition
    
    Thread Safety:
        - Updates to predictions_store and cases_store are thread-safe for reads
        - WebSocket broadcasts are scheduled on the main event loop via
          asyncio.run_coroutine_threadsafe() to avoid async/threading conflicts
    """
    try:
        # Initialize Kafka consumer using helper function
        # The helper handles configuration loading and consumer setup
        # IMPORTANT: API server should use a different consumer group than stream processor
        # to avoid offset conflicts. We'll override the group_id if needed.
        from .kafka_consumer_helper import load_kafka_config, KafkaConfig
        
        # Load config and override group_id for API server
        cfg = load_kafka_config("stream-processing/confluent_config.ini")
        api_cfg = KafkaConfig(
            bootstrap_servers=cfg.bootstrap_servers,
            sasl_username=cfg.sasl_username,
            sasl_password=cfg.sasl_password,
            security_protocol=cfg.security_protocol,
            sasl_mechanisms=cfg.sasl_mechanisms,
            client_id="NeuroPulseAPIServer",  # Unique client ID for API server
            group_id="neuropulse-api-server-group",  # Unique consumer group for API server
        )
        consumer = create_kafka_consumer(api_cfg)
        topic = "ai.prediction.output"  # Topic where stream processor publishes predictions
        consumer.subscribe([topic])
        
        # Update metrics to show Kafka is connected
        streaming_metrics["kafka_connected"] = True
        streaming_metrics["start_time"] = datetime.now(timezone.utc)

        logger.info(f"Subscribed to {topic}, waiting for predictions...")
        logger.info(f"Consumer group: {consumer._group_id if hasattr(consumer, '_group_id') else 'unknown'}")
        logger.info("Offset reset strategy: latest (will only read new messages)")
        
        # Track polling to detect if consumer is stuck
        poll_count = 0
        last_log_time = time.time()
        
        # Main consumption loop - runs until thread is terminated
        while True:
            # Poll for messages with 1 second timeout
            # Returns None if no message available (allows periodic checks for thread termination)
            msg = consumer.poll(timeout=1.0)
            poll_count += 1
            
            # Log every 10 seconds to show consumer is alive
            current_time = time.time()
            if current_time - last_log_time >= 10:
                logger.info(f"Consumer polling... (polled {poll_count} times, messages_received: {streaming_metrics['messages_received']})")
                last_log_time = current_time

            if msg is None:
                continue  # No message available, continue polling

            # Check for Kafka errors
            if msg.error():
                # Partition EOF is expected when reaching end of partition
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    continue
                else:
                    # Log other errors but continue processing
                    logger.error(f"Consumer error: {msg.error()}")
                    continue

            try:
                # Log that we received a message (for debugging)
                logger.debug(f"Received message from {msg.topic()} [partition {msg.partition()}] @ offset {msg.offset()}")

                # Record metrics for this message
                metrics_collector = get_metrics_collector()
                metrics_collector.record_message(
                    stream_name=msg.topic(),
                    kafka_timestamp_ms=msg.timestamp()[1] if msg.timestamp()[0] == 0 else None,
                    message_size_bytes=len(msg.value()) if msg.value() else 0
                )

                # Parse JSON message payload
                # Messages contain full AiPredictionResponse data from the stream processor
                data = json.loads(msg.value().decode("utf-8"))
                case_id = data.get("case_id")

                if not case_id:
                    logger.warning("Message missing case_id, skipping")
                    continue

                if case_id:
                    # Update streaming metrics
                    current_time = datetime.now(timezone.utc)
                    streaming_metrics["messages_received"] += 1
                    streaming_metrics["topics"]["ai.prediction.output"]["messages_received"] += 1
                    streaming_metrics["topics"]["ai.prediction.output"]["last_message_time"] = current_time.isoformat()
                    streaming_metrics["last_message_time"] = current_time.isoformat()
                    
                    # Calculate messages per second (simple rolling average)
                    uptime = (current_time - streaming_metrics["start_time"]).total_seconds()
                    if uptime > 0:
                        streaming_metrics["messages_per_second"] = streaming_metrics["messages_received"] / uptime
                    streaming_metrics["uptime_seconds"] = int(uptime)
                    
                    # Store full prediction data for detailed API responses
                    # This enables /api/cases/{case_id} to return complete prediction details
                    predictions_store[case_id] = data
                    
                    # Update cases store with lightweight summary for list views
                    # This enables /api/cases to return a list of case summaries efficiently
                    case_summary = _convert_prediction_to_case_summary(data)
                    cases_store[case_id] = case_summary.dict()

                    logger.info(f"Updated prediction for case {case_id}")
                    
                    # Broadcast update to all connected WebSocket clients
                    # Send both the lightweight summary (for list updates) and full detail (for vitals updates)
                    # This enables real-time dashboard updates without polling
                    # Note: This runs in a background thread, so we must schedule the coroutine
                    # on the main event loop to avoid async/threading conflicts
                    if ws_event_loop:
                        try:
                            # Convert full prediction to PredictionDetail format for the dashboard
                            # Use dict() directly instead of creating Pydantic model to avoid serialization issues
                            pred_detail_dict = {
                                "predictionId": data.get("prediction_id", ""),
                                "caseId": data.get("case_id", ""),
                                "patientId": data.get("patient_id", ""),
                                "predictionTs": data.get("prediction_ts", ""),
                                "strokeProbability": data.get("stroke_probability") or 0.0,
                                "lvoProbability": data.get("lvo_probability") or 0.0,
                                "riskCategory": data.get("risk_category", ""),
                                "recommendedDestinationHospitalId": data.get("recommended_destination_hospital_id"),
                                "recommendedDestinationType": data.get("recommended_destination_type"),
                                "estimatedTravelMinToRecommended": data.get("estimated_travel_min_to_recommended"),
                                "estimatedAdditionalDoorToNeedleMinAtRecommended": data.get("estimated_additional_door_to_needle_min_at_recommended"),
                                "timeWindowAssessment": data.get("time_window_assessment"),
                                "topRiskFactors": data.get("top_risk_factors"),
                                "llmExplanationSummary": data.get("llm_explanation_summary"),
                                "llmRecommendedActions": data.get("llm_recommended_actions"),
                                "currentVitals": data.get("current_vitals"),
                                "predictionConfidence": data.get("prediction_confidence"),
                                "trendIndicators": data.get("trend_indicators"),
                                "detectedAnomalies": data.get("detected_anomalies"),
                                "featureImportance": data.get("feature_importance"),
                            }
                            
                            # Always send the update - include detail if available
                            update_message = {
                                "type": "case_updated", 
                                "case": case_summary.dict()
                            }
                            # Only add detail if we successfully created it
                            if pred_detail_dict:
                                update_message["detail"] = pred_detail_dict
                            
                            asyncio.run_coroutine_threadsafe(
                                broadcast_update(update_message),
                                ws_event_loop
                            )
                        except Exception as e:
                            # Log error but don't crash - send update without detail
                            logger.error(f"Error creating detail for WebSocket broadcast: {e}", exc_info=True)
                            # Fallback: send update with just the case summary
                            try:
                                asyncio.run_coroutine_threadsafe(
                                    broadcast_update({
                                        "type": "case_updated",
                                        "case": case_summary.dict()
                                    }),
                                    ws_event_loop
                                )
                            except Exception as e2:
                                logger.error(f"Error broadcasting case update: {e2}", exc_info=True)
            except Exception as e:
                # Log parsing/processing errors but continue consuming
                # Prevents a single bad message from stopping the entire consumer
                logger.error(f"Error processing message: {e}", exc_info=True)
    
    except FileNotFoundError as e:
        # Gracefully handle missing Kafka configuration
        # Allows API server to run in development/testing without Confluent Cloud setup
        logger.warning(f"Kafka config not found. Running without Kafka consumer. Error: {e}")
        logger.warning("API will still work, but won't receive new predictions from Kafka.")
    except Exception as e:
        # Handle other initialization errors gracefully
        logger.error(f"Failed to start Kafka consumer: {e}", exc_info=True)
        logger.warning("API will still work, but won't receive new predictions from Kafka.")
    except KeyboardInterrupt:
        # Handle graceful shutdown
        logger.info("Kafka consumer shutting down...")
    finally:
        # Ensure consumer is properly closed
        try:
            consumer.close()
        except:
            pass  # Ignore errors during cleanup


# Start Kafka consumer in background thread
# The daemon flag ensures the thread terminates when the main process exits
# This allows the API server to start even if Kafka is unavailable (graceful degradation)
consumer_thread = threading.Thread(target=_kafka_consumer_loop, daemon=True)
consumer_thread.start()


@app.get("/")
async def root():
    """
    Root health check endpoint.
    
    Returns:
        dict: Basic service identification for health monitoring
    """
    return {"status": "ok", "service": "NeuroPulse API"}


@app.get("/api/cases", response_model=List[CaseSummary])
async def get_cases():
    """
    Get all active stroke cases with their AI-generated risk assessments.
    
    This endpoint returns a list of all cases currently in the system, each containing:
    - Stroke and LVO probabilities from Vertex AI models
    - Risk category (LOW, MODERATE, HIGH, CRITICAL)
    - Time since symptom onset (critical for treatment windows)
    - Basic patient identification
    
    Returns:
        List[CaseSummary]: List of case summaries for dashboard display
        
    Use Case:
        Called by the dashboard to populate the case list/card view. The lightweight
        CaseSummary model reduces payload size compared to full prediction details.
    """
    return list(cases_store.values())


@app.get("/api/cases/{case_id}", response_model=PredictionDetail)
async def get_case_detail(case_id: str):
    """
    Get detailed AI prediction and recommendations for a specific stroke case.
    
    This endpoint returns the complete prediction data including:
    - Full stroke/LVO probabilities from Vertex AI
    - Hospital routing recommendations (primary vs comprehensive center)
    - Time window assessments for treatment eligibility
    - Top risk factors identified by the AI
    - Natural language explanations from Gemini LLM
    - Clinical action recommendations from Gemini
    
    Medical Context:
        The routing recommendation considers:
        - LVO probability: Higher LVO probability → comprehensive center (can perform EVT)
        - Travel time: Balances urgency vs. capability
        - Treatment windows: IV tPA typically within 4.5 hours, EVT may extend to 6-24 hours
        - Door-to-needle time: Expected hospital processing delay
    
    Args:
        case_id: Unique identifier for the stroke case
        
    Returns:
        PredictionDetail: Complete prediction with all AI insights and recommendations
        
    Raises:
        HTTPException: 404 if case not found
        
    Use Case:
        Called by the dashboard when a user selects a case to view detailed information,
        including AI explanations and recommended clinical actions.
    """
    if case_id not in predictions_store:
        raise HTTPException(status_code=404, detail="Case not found")
    
    pred = predictions_store[case_id]
    
    # Transform stored prediction dict to Pydantic model for validation and serialization
    return PredictionDetail(
        predictionId=pred["prediction_id"],
        caseId=pred["case_id"],
        patientId=pred["patient_id"],
        predictionTs=pred["prediction_ts"],
        strokeProbability=pred["stroke_probability"] or 0.0,
        lvoProbability=pred["lvo_probability"] or 0.0,
        riskCategory=pred["risk_category"],
        recommendedDestinationHospitalId=pred.get("recommended_destination_hospital_id"),
        recommendedDestinationType=pred.get("recommended_destination_type"),
        estimatedTravelMinToRecommended=pred.get("estimated_travel_min_to_recommended"),
        estimatedAdditionalDoorToNeedleMinAtRecommended=pred.get("estimated_additional_door_to_needle_min_at_recommended"),
        timeWindowAssessment=pred.get("time_window_assessment"),
        topRiskFactors=pred.get("top_risk_factors"),
        llmExplanationSummary=pred.get("llm_explanation_summary"),
        llmRecommendedActions=pred.get("llm_recommended_actions"),
        currentVitals=pred.get("current_vitals"),
        predictionConfidence=pred.get("prediction_confidence"),
        trendIndicators=pred.get("trend_indicators"),
        detectedAnomalies=pred.get("detected_anomalies"),
        featureImportance=pred.get("feature_importance"),
    )


@app.get("/api/health")
async def health():
    """
    Comprehensive health check endpoint with system status.

    Returns status of the API server and its dependencies:
    - API server status
    - Kafka consumer thread status (indicates if receiving predictions)
    - Current case count
    - Circuit breaker states for AI services

    Returns:
        dict: Health status including Kafka consumer state, case count, and circuit breaker states

    Use Case:
        Used by monitoring systems and the dashboard to verify API availability
        and check if the Kafka consumer is actively receiving predictions.
    """
    from .circuit_breaker import get_vertex_ai_breaker, get_gemini_breaker

    return {
        "status": "ok",
        "kafka_consumer": "running" if consumer_thread.is_alive() else "stopped",
        "cases_count": len(cases_store),
        "circuit_breakers": {
            "vertex_ai": get_vertex_ai_breaker().get_state(),
            "gemini": get_gemini_breaker().get_state(),
        }
    }


@app.get("/api/streaming/metrics")
async def get_streaming_metrics():
    """
    Real-time streaming metrics endpoint for hackathon visibility.

    Returns comprehensive metrics about the Kafka streaming pipeline:
    - Confluent Cloud connection status
    - Message throughput (messages/second)
    - Total messages received
    - Per-topic statistics with latency percentiles (P50, P95, P99)
    - Consumer lag (if available)
    - System uptime
    - End-to-end latency metrics

    Returns:
        dict: Streaming metrics including Kafka status, throughput, latency percentiles, and topic statistics

    Use Case:
        Dashboard displays these metrics prominently to demonstrate Confluent streaming
        capabilities to hackathon judges. Shows real-time data flow, sub-second latency,
        and system health with production-grade observability.
    """
    # Get enhanced metrics from the metrics collector
    metrics_collector = get_metrics_collector()
    enhanced_metrics = metrics_collector.get_all_metrics()

    # Combine with existing streaming metrics for backward compatibility
    return {
        "kafka_connected": streaming_metrics["kafka_connected"],
        "messages_received": streaming_metrics["messages_received"],
        "messages_per_second": round(streaming_metrics["messages_per_second"], 2),
        "last_message_time": streaming_metrics["last_message_time"],
        "topics": streaming_metrics["topics"],
        "consumer_lag": streaming_metrics["consumer_lag"],
        "uptime_seconds": streaming_metrics["uptime_seconds"],
        "consumer_thread_alive": consumer_thread.is_alive() if consumer_thread else False,
        # Enhanced metrics with latency percentiles
        "enhanced": enhanced_metrics,
    }


async def broadcast_update(message: dict):
    """
    Broadcast a message to all connected WebSocket clients.
    
    This function is called when new AI predictions arrive from Kafka, enabling
    real-time push updates to the dashboard without requiring polling. The dashboard
    receives updates immediately when new predictions are generated.
    
    Error Handling:
        Automatically removes disconnected clients from the connection list to prevent
        memory leaks and ensure only active connections receive updates.
    
    Args:
        message: Dictionary containing the update message (typically {"type": "case_updated", "case": {...}})
        
    Use Case:
        Called by the Kafka consumer thread (via asyncio.run_coroutine_threadsafe) when
        a new prediction arrives, ensuring all dashboard clients see updates in real-time.
    """
    if not active_connections:
        return  # No clients connected, nothing to broadcast
    
    # Validate message can be serialized before sending
    try:
        import json
        json.dumps(message)  # Test serialization
    except (TypeError, ValueError) as e:
        logger.error(f"Message not JSON serializable: {e}")
        logger.error(f"Message keys: {list(message.keys())}")
        return  # Don't send invalid messages

    disconnected = []
    # Iterate through all active connections and send the update
    for connection in active_connections:
        try:
            await connection.send_json(message)
        except Exception as e:
            # Connection may have been closed by client
            logger.warning(f"Error sending to WebSocket client: {e}")
            disconnected.append(connection)
    
    # Clean up disconnected clients to prevent memory leaks
    for conn in disconnected:
        if conn in active_connections:
            active_connections.remove(conn)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time AI prediction updates.
    
    This endpoint maintains a persistent connection with the dashboard, enabling:
    - Real-time push updates when new predictions arrive (no polling needed)
    - Initial state synchronization when client connects
    - Keep-alive ping/pong mechanism
    
    Connection Lifecycle:
        1. Client connects → Accept connection → Add to active_connections
        2. Send initial state (all current cases) → Client displays current data
        3. Listen for new predictions → Broadcast via broadcast_update()
        4. Handle ping messages → Respond with pong (keep-alive)
        5. Client disconnects → Remove from active_connections
    
    Thread Safety:
        The ws_event_loop is captured on first connection to enable the Kafka consumer
        thread to schedule WebSocket broadcasts safely across thread boundaries.
    
    Args:
        websocket: WebSocket connection instance from FastAPI
        
    Use Case:
        The dashboard establishes a WebSocket connection on load to receive real-time
        updates as new stroke cases are processed and AI predictions are generated.
    """
    global ws_event_loop
    # Capture the event loop on first WebSocket connection
    # This enables the Kafka consumer thread to schedule broadcasts on the main event loop
    if ws_event_loop is None:
        try:
            ws_event_loop = asyncio.get_event_loop()
        except RuntimeError:
            # If no event loop exists, get the running one
            ws_event_loop = asyncio.get_running_loop()
    
    try:
        await websocket.accept()
        active_connections.append(websocket)
        logger.info(f"WebSocket client connected from {websocket.client.host if hasattr(websocket, 'client') else 'unknown'}. Total connections: {len(active_connections)}")

        # Send initial state to synchronize client with current data
        # This ensures the dashboard displays all existing cases immediately on connection
        try:
            cases_list = list(cases_store.values())
            logger.info(f"Sending initial state with {len(cases_list)} cases")
            initial_message = {
                "type": "initial_state",
                "cases": cases_list
            }
            await websocket.send_json(initial_message)
            logger.debug("Initial state sent successfully")
        except Exception as e:
            logger.error(f"Error sending initial state: {e}", exc_info=True)
            # Don't close connection, just log the error
        
        # Keep connection alive and handle incoming messages
        # The loop continues until the client disconnects or an error occurs
        while True:
            try:
                data = await websocket.receive_text()
                # Handle ping messages for connection keep-alive
                # This allows the client to verify the connection is still active
                if data == "ping":
                    await websocket.send_json({"type": "pong"})
            except Exception as e:
                # If there's an error receiving, break the loop and let the outer exception handler deal with it
                logger.error(f"Error receiving WebSocket message: {e}")
                raise
    except WebSocketDisconnect:
        # Client closed connection normally
        active_connections.remove(websocket)
        logger.info(f"WebSocket client disconnected. Total connections: {len(active_connections)}")
    except Exception as e:
        # Handle unexpected errors (network issues, etc.)
        logger.error(f"WebSocket error: {e}", exc_info=True)
        if websocket in active_connections:
            active_connections.remove(websocket)


if ENABLE_ADMIN_ENDPOINTS:
    @app.delete("/api/cases")
    async def clear_all_cases():
        """
        Clear all cases from the in-memory store (for development/testing).

        This endpoint removes all cases and predictions, useful for:
        - Resetting the system during development
        - Removing test data
        - Starting fresh

        Returns:
            dict: Status confirmation with count of cleared cases

        Note:
            This endpoint is disabled in production by default.
            Set ENABLE_ADMIN_ENDPOINTS=true to enable.
        """
        count = len(cases_store)
        cases_store.clear()
        predictions_store.clear()

        # Broadcast update to WebSocket clients
        if ws_event_loop:
            try:
                asyncio.run_coroutine_threadsafe(
                    broadcast_update({
                        "type": "initial_state",
                        "cases": []
                    }),
                    ws_event_loop
                )
            except Exception as e:
                logger.error(f"Error broadcasting clear: {e}")

        return {
            "status": "ok",
            "message": f"Cleared {count} cases",
            "cleared_count": count
        }


    @app.delete("/api/cases/{case_id}")
    async def delete_case(case_id: str):
        """
        Delete a specific case from the in-memory store.

        Args:
            case_id: The case ID to delete

        Returns:
            dict: Status confirmation

        Raises:
            HTTPException: 404 if case not found

        Note:
            This endpoint is disabled in production by default.
            Set ENABLE_ADMIN_ENDPOINTS=true to enable.
        """
        if case_id not in predictions_store:
            raise HTTPException(status_code=404, detail="Case not found")

        del predictions_store[case_id]
        if case_id in cases_store:
            del cases_store[case_id]

        # Broadcast update to WebSocket clients
        if ws_event_loop:
            try:
                asyncio.run_coroutine_threadsafe(
                    broadcast_update({
                        "type": "case_deleted",
                        "caseId": case_id
                    }),
                    ws_event_loop
                )
            except Exception as e:
                logger.error(f"Error broadcasting delete: {e}")

        return {
            "status": "ok",
            "message": f"Deleted case {case_id}",
            "case_id": case_id
        }


if ENABLE_ADMIN_ENDPOINTS:
    @app.post("/api/mock/predictions")
    async def inject_mock_prediction(prediction: dict):
        """
        Inject a mock prediction directly into the store (for local testing and development).

        This endpoint bypasses the Kafka pipeline and allows testing the API and dashboard
        without requiring:
        - Confluent Cloud setup
        - Running stream processor
        - Vertex AI / Gemini API access

        The injected prediction follows the same structure as predictions from Kafka,
        enabling end-to-end testing of the dashboard UI and API responses.

        Use Cases:
            - Local development without full infrastructure
            - Testing dashboard UI with specific prediction scenarios
            - Demonstrating the system without live data streams
            - Creating test cases with known prediction values

        Args:
            prediction: Dictionary matching AiPredictionResponse structure with fields like:
                - case_id (required)
                - patient_id
                - stroke_probability
                - lvo_probability
                - risk_category
                - recommended_destination_hospital_id
                - llm_explanation_summary
                - etc.

        Returns:
            dict: Status confirmation with case_id

        Raises:
            HTTPException: 400 if case_id is missing, 500 for other errors

        Note:
            This endpoint is disabled in production by default.
            Set ENABLE_ADMIN_ENDPOINTS=true to enable.
        """
        try:
            case_id = prediction.get("case_id")
            if not case_id:
                raise HTTPException(status_code=400, detail="Missing case_id")

            # Store full prediction data (same as Kafka consumer does)
            predictions_store[case_id] = prediction

            # Update cases store with summary (same as Kafka consumer does)
            case_summary = _convert_prediction_to_case_summary(prediction)
            cases_store[case_id] = case_summary.dict()

            # Prepare WebSocket update with full detail (for vitals updates)
            try:
                # Create detail dict for WebSocket broadcast
                pred_detail_dict = {
                    "predictionId": prediction.get("prediction_id", ""),
                    "caseId": prediction.get("case_id", ""),
                    "patientId": prediction.get("patient_id", ""),
                    "predictionTs": prediction.get("prediction_ts", ""),
                    "strokeProbability": prediction.get("stroke_probability") or 0.0,
                    "lvoProbability": prediction.get("lvo_probability") or 0.0,
                    "riskCategory": prediction.get("risk_category", ""),
                    "recommendedDestinationHospitalId": prediction.get("recommended_destination_hospital_id"),
                    "recommendedDestinationType": prediction.get("recommended_destination_type"),
                    "estimatedTravelMinToRecommended": prediction.get("estimated_travel_min_to_recommended"),
                    "estimatedAdditionalDoorToNeedleMinAtRecommended": prediction.get("estimated_additional_door_to_needle_min_at_recommended"),
                    "timeWindowAssessment": prediction.get("time_window_assessment"),
                    "topRiskFactors": prediction.get("top_risk_factors"),
                    "llmExplanationSummary": prediction.get("llm_explanation_summary"),
                    "llmRecommendedActions": prediction.get("llm_recommended_actions"),
                    "currentVitals": prediction.get("current_vitals"),
                    "predictionConfidence": prediction.get("prediction_confidence"),
                    "trendIndicators": prediction.get("trend_indicators"),
                    "detectedAnomalies": prediction.get("detected_anomalies"),
                    "featureImportance": prediction.get("feature_importance"),
                }

                update_message = {
                    "type": "case_updated",
                    "case": case_summary.dict(),
                    "detail": pred_detail_dict
                }
            except Exception as e:
                # Fallback to just case summary if detail creation fails
                logger.error(f"Error creating detail for mock prediction: {e}")
                update_message = {
                    "type": "case_updated",
                    "case": case_summary.dict()
                }

            # Broadcast update to WebSocket clients (same as Kafka consumer does)
            # This ensures the dashboard receives real-time updates even for mock data
            try:
                await broadcast_update(update_message)
            except Exception as e:
                logger.error(f"Error broadcasting mock prediction update: {e}")
                # Don't fail the request if WebSocket broadcast fails

            return {
                "status": "ok",
                "message": f"Mock prediction injected for case {case_id}",
                "case_id": case_id,
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error injecting prediction: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error injecting prediction: {str(e)}")


if __name__ == "__main__":
    """
    Entry point for running the API server directly (development mode).

    In production, the server is typically run via a process manager like:
    - uvicorn (command line)
    - gunicorn with uvicorn workers
    - Docker container with uvicorn
    - Cloud platform (Cloud Run, App Engine, etc.)

    Configuration:
    - PORT: Set via environment variable (default: 8000)
    - ALLOWED_ORIGINS: Comma-separated list of allowed CORS origins
    - ENABLE_ADMIN_ENDPOINTS: Enable admin endpoints (default: true for development)
    """
    import uvicorn
    logger.info(f"Starting NeuroPulse API server on port {PORT}")
    logger.info(f"Admin endpoints enabled: {ENABLE_ADMIN_ENDPOINTS}")
    logger.info(f"Allowed CORS origins: {ALLOWED_ORIGINS}")
    # Run on all interfaces (0.0.0.0) to allow external connections
    uvicorn.run(app, host="0.0.0.0", port=PORT)

