"""
NeuroPulse - Vertex AI Service

This module provides integration with Google Cloud Vertex AI for stroke and LVO
(Large Vessel Occlusion) probability predictions.

Architecture Context:
    Vertex AI is Google Cloud's managed ML platform. In the NeuroPulse pipeline,
    this service receives feature vectors from the stream processor and returns
    probability scores that drive clinical decision-making:
    - Stroke probability: Likelihood of acute ischemic stroke (0.0-1.0)
    - LVO probability: Likelihood of Large Vessel Occlusion (0.0-1.0)
    
    These probabilities are then used to:
    - Categorize risk (LOW, MODERATE, HIGH, CRITICAL)
    - Recommend hospital routing (primary vs comprehensive center)
    - Generate clinical explanations via Gemini

AI/Medical Context:
    - Stroke Probability: ML model estimates likelihood of acute ischemic stroke
      based on clinical features (vitals, FAST exam, demographics, time windows)
    - LVO Probability: ML model estimates likelihood of Large Vessel Occlusion,
      which requires mechanical thrombectomy (only available at comprehensive centers)
    - Feature Engineering: Input features include vitals, neurological findings,
      time since symptom onset, and patient demographics
    
Fallback Strategy:
    If Vertex AI is not configured or unavailable, the service falls back to
    heuristic-based predictions using clinical rules. This ensures the system
    continues to function during development or if Vertex AI is unavailable.
    
    The heuristics are based on established clinical knowledge:
    - FAST score is a strong predictor
    - Time window affects treatment eligibility
    - Clinical signs (face droop, arm weakness, speech) indicate stroke risk

Note: All predictions use synthetic data for demonstration purposes only.
"""

from __future__ import annotations

from typing import Optional, Dict, Any
import os
import json
import logging

try:
    from google.cloud import aiplatform
    from google.cloud.aiplatform import prediction
    VERTEX_AI_AVAILABLE = True
except ImportError:
    VERTEX_AI_AVAILABLE = False

import sys
from pathlib import Path

# Add parent directories to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from ai_models.neuro_pulse_ai.prediction_service_stub import (
    AiPredictionRequest,
    AiPredictionResponse,
)

from .circuit_breaker import get_vertex_ai_breaker, CircuitBreakerOpenError

logger = logging.getLogger(__name__)

# Configuration from environment variables
# These are required for Vertex AI integration but have fallback heuristics if not set
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "")  # GCP project ID where Vertex AI models are deployed
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")  # GCP region for Vertex AI endpoint
ENDPOINT_ID = os.getenv("VERTEX_AI_ENDPOINT_ID", "")  # Optional: Vertex AI endpoint ID if model is deployed

# Heuristic prediction constants
# Base probabilities
BASE_STROKE_PROBABILITY = 0.2
BASE_LVO_PROBABILITY = 0.05

# FAST score thresholds and weights
FAST_SCORE_MAX = 3
FAST_SCORE_STROKE_WEIGHT = 0.2
FAST_SCORE_LVO_THRESHOLD = 2
FAST_SCORE_LVO_INCREMENT = 0.15

# Clinical signs weights
FACE_DROOP_STROKE_INCREMENT = 0.15
ARM_WEAKNESS_STROKE_INCREMENT = 0.12
ARM_WEAKNESS_LVO_INCREMENT = 0.12
SPEECH_ABNORMAL_STROKE_INCREMENT = 0.10

# Time window thresholds (in minutes)
TIME_WINDOW_IV_TPA = 270  # 4.5 hours
TIME_WINDOW_EXTENDED = 360  # 6 hours
TIME_WINDOW_IV_TPA_INCREMENT = 0.08
TIME_WINDOW_EXTENDED_INCREMENT = 0.05

# GCS (Glasgow Coma Scale) thresholds
GCS_NORMAL = 15
GCS_MODERATE_THRESHOLD = 13
GCS_REDUCED_STROKE_INCREMENT = 0.10
GCS_SEVERE_LVO_INCREMENT = 0.08

# Blood pressure thresholds
BP_ELEVATED_THRESHOLD = 180  # mmHg
BP_ELEVATED_STROKE_INCREMENT = 0.05


def _heuristic_predict(request: AiPredictionRequest) -> tuple[float, float]:
    """
    Fallback heuristic-based prediction when Vertex AI is not configured.
    
    This function implements clinical rules-based prediction using established
    medical knowledge about stroke risk factors. It provides reasonable estimates
    that can be used during development or if Vertex AI is unavailable.
    
    Medical Context:
        The heuristics are based on validated clinical tools and risk factors:
        - FAST score: Validated stroke screening tool (0-3 scale)
        - Clinical signs: Face droop, arm weakness, speech abnormalities are
          key indicators of stroke (especially LVO)
        - Time window: Shorter time since onset suggests higher stroke probability
          (within treatment windows)
        - GCS (Glasgow Coma Scale): Lower scores indicate more severe neurological
          impairment, often associated with LVO
        - Blood pressure: Elevated BP can be a risk factor but also a response to stroke
    
    Algorithm:
        Starts with base probabilities and adds contributions from clinical features.
        The weights are approximate and based on clinical knowledge, not ML training.
        
    Args:
        request: Feature vector with clinical data (vitals, FAST exam, vitals, etc.)
        
    Returns:
        tuple: (stroke_probability, lvo_probability) as floats between 0.0 and 1.0
        
    Note:
        In production, this would be replaced by a trained ML model deployed on Vertex AI.
        The heuristics serve as a fallback to ensure system availability.
    """
    # Base probabilities (background stroke risk)
    base_stroke_prob = BASE_STROKE_PROBABILITY
    base_lvo_prob = BASE_LVO_PROBABILITY

    # FAST score contribution (validated stroke screening tool)
    # Higher FAST score (0-3) indicates more stroke findings
    if request.fast_score:
        base_stroke_prob += FAST_SCORE_STROKE_WEIGHT * min(request.fast_score, FAST_SCORE_MAX) / float(FAST_SCORE_MAX)
        # FAST score >= 2 is associated with higher LVO probability
        if request.fast_score >= FAST_SCORE_LVO_THRESHOLD:
            base_lvo_prob += FAST_SCORE_LVO_INCREMENT

    # Clinical signs from FAST exam (strong predictors of stroke)
    if request.face_droop_present:
        base_stroke_prob += FACE_DROOP_STROKE_INCREMENT  # Facial asymmetry suggests stroke
    if request.arm_weakness_any:
        base_stroke_prob += ARM_WEAKNESS_STROKE_INCREMENT  # Motor weakness is a key stroke sign
        base_lvo_prob += ARM_WEAKNESS_LVO_INCREMENT  # Unilateral weakness often indicates LVO
    if request.speech_abnormal_any:
        base_stroke_prob += SPEECH_ABNORMAL_STROKE_INCREMENT  # Speech difficulty suggests stroke

    # Time window contribution (shorter time = higher probability of treatable stroke)
    if request.minutes_since_symptom_onset is not None:
        if request.minutes_since_symptom_onset <= TIME_WINDOW_IV_TPA:  # Within IV tPA window (4.5 hours)
            base_stroke_prob += TIME_WINDOW_IV_TPA_INCREMENT
        elif request.minutes_since_symptom_onset <= TIME_WINDOW_EXTENDED:  # Extended window (6 hours)
            base_stroke_prob += TIME_WINDOW_EXTENDED_INCREMENT

    # Vitals-based contributions
    # GCS (Glasgow Coma Scale): Lower scores indicate more severe neurological impairment
    if request.gcs_total is not None and request.gcs_total < GCS_NORMAL:
        base_stroke_prob += GCS_REDUCED_STROKE_INCREMENT
        if request.gcs_total < GCS_MODERATE_THRESHOLD:  # Severely reduced consciousness often indicates LVO
            base_lvo_prob += GCS_SEVERE_LVO_INCREMENT

    # Elevated blood pressure can be a risk factor (though also a response to stroke)
    if request.systolic_bp_mmHg is not None and request.systolic_bp_mmHg > BP_ELEVATED_THRESHOLD:
        base_stroke_prob += BP_ELEVATED_STROKE_INCREMENT

    # Clamp probabilities to valid range [0.0, 1.0]
    stroke_prob = max(0.0, min(1.0, base_stroke_prob))
    lvo_prob = max(0.0, min(1.0, base_lvo_prob))

    return stroke_prob, lvo_prob


def predict_with_vertex_ai(request: AiPredictionRequest) -> tuple[float, float]:
    """
    Predict stroke and LVO probabilities using Google Cloud Vertex AI.
    
    This is the main entry point for AI-based stroke risk prediction. It attempts
    to use a deployed Vertex AI model endpoint if available, otherwise falls
    back to heuristic-based predictions to ensure system availability.
    
    AI Pipeline:
        1. Check if Vertex AI is configured and available
        2. Transform feature vector to model input format
        3. Call Vertex AI endpoint for prediction
        4. Parse model response and extract probabilities
        5. Fall back to heuristics if Vertex AI fails
    
    Model Input:
        The feature vector includes:
        - Demographics: age, sex
        - Vitals: heart rate, blood pressure, SpO2, GCS, blood glucose
        - Neurological findings: face droop, arm weakness, speech abnormalities
        - FAST score: validated stroke screening score (0-3)
        - Time features: minutes since symptom onset, last known well
    
    Model Output:
        The model returns two probabilities:
        - stroke_probability: Likelihood of acute ischemic stroke (0.0-1.0)
        - lvo_probability: Likelihood of Large Vessel Occlusion (0.0-1.0)
    
    Args:
        request: Feature vector with clinical data ready for ML model
        
    Returns:
        tuple: (stroke_probability, lvo_probability) as floats between 0.0 and 1.0
        
    Error Handling:
        Gracefully falls back to heuristic predictions if:
        - Vertex AI is not configured
        - Endpoint is unavailable
        - API call fails
        - Response format is unexpected
        
    Note:
        The model input/output format may need adjustment based on your specific
        Vertex AI model deployment. This implementation supports common formats.
    """
    # If Vertex AI is not available or not configured, use heuristics
    # This ensures the system works during development or if Vertex AI is unavailable
    if not VERTEX_AI_AVAILABLE or not PROJECT_ID or not ENDPOINT_ID:
        logger.info("Vertex AI not configured, using heuristic predictions")
        return _heuristic_predict(request)

    # Get circuit breaker for Vertex AI calls
    breaker = get_vertex_ai_breaker()

    def _call_vertex_ai():
        """Internal function to call Vertex AI (wrapped by circuit breaker)"""
        # Initialize Vertex AI client with project and location
        aiplatform.init(project=PROJECT_ID, location=LOCATION)

        # Prepare feature vector for the model
        # Transform request object to dictionary format expected by Vertex AI
        # Missing values are filled with defaults (0 for numeric, False for boolean)
        features = {
            "age_years": request.age_years or 0,
            "heart_rate_bpm": request.heart_rate_bpm or 0,
            "systolic_bp_mmHg": request.systolic_bp_mmHg or 0,
            "diastolic_bp_mmHg": request.diastolic_bp_mmHg or 0,
            "respiratory_rate_bpm": request.respiratory_rate_bpm or 0,
            "spo2_pct": request.spo2_pct or 0,
            "gcs_total": request.gcs_total or 15,  # Default to normal GCS
            "blood_glucose_mg_dL": request.blood_glucose_mg_dL or 0,
            "face_droop_present": 1 if request.face_droop_present else 0,  # Boolean to binary
            "arm_weakness_any": 1 if request.arm_weakness_any else 0,
            "speech_abnormal_any": 1 if request.speech_abnormal_any else 0,
            "fast_score": request.fast_score or 0,
            "minutes_since_symptom_onset": request.minutes_since_symptom_onset or 0,
            "minutes_since_last_known_well": request.minutes_since_last_known_well or 0,
        }

        # Create endpoint reference (doesn't make API call yet)
        endpoint = aiplatform.Endpoint(ENDPOINT_ID)

        # Make prediction request to Vertex AI endpoint
        # Note: Adjust the instance format based on your model's expected input schema
        instances = [features]  # Vertex AI expects a list of instances
        response = endpoint.predict(instances=instances)

        # Extract predictions from response
        # Vertex AI responses can vary in format, so we handle multiple cases
        if response.predictions:
            pred = response.predictions[0]  # Get first (and typically only) prediction

            # Handle list format: [stroke_prob, lvo_prob]
            if isinstance(pred, list) and len(pred) >= 2:
                stroke_prob = float(pred[0])
                lvo_prob = float(pred[1])
            # Handle dictionary format: {"stroke_probability": 0.8, "lvo_probability": 0.3}
            elif isinstance(pred, dict):
                stroke_prob = float(pred.get("stroke_probability", 0.0))
                lvo_prob = float(pred.get("lvo_probability", 0.0))
            else:
                # Unexpected format, fall back to heuristics
                raise ValueError("Unexpected Vertex AI response format")

            # Clamp probabilities to valid range [0.0, 1.0]
            return max(0.0, min(1.0, stroke_prob)), max(0.0, min(1.0, lvo_prob))

        raise ValueError("No predictions in Vertex AI response")

    try:
        # Call Vertex AI with circuit breaker protection
        return breaker.call(_call_vertex_ai)

    except CircuitBreakerOpenError:
        # Circuit is open, fail fast with heuristics
        logger.warning("Vertex AI circuit breaker is OPEN, using heuristic predictions")
        return _heuristic_predict(request)

    except Exception as e:
        # Log error but don't crash - fall back to heuristics
        logger.error(f"Error calling Vertex AI endpoint: {e}", exc_info=True)
        logger.info("Falling back to heuristic prediction")
        return _heuristic_predict(request)

    # Final fallback (shouldn't reach here, but ensures function always returns)
    return _heuristic_predict(request)

