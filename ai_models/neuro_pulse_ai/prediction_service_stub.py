"""
NeuroPulse - AI Prediction Service Stub

This module defines the *contract* (interface) between the streaming/feature
engineering layer and the AI layer (Vertex AI + Gemini). It provides both
the data models and a stub implementation for local testing and development.

Architecture Context:
    This module serves as the interface definition for the AI prediction service.
    The stream processor calls this service to get stroke/LVO probabilities and
    clinical recommendations. In production, this would call Vertex AI and Gemini,
    but for development and testing, it provides a stub implementation.
    
    The stub uses heuristic-based predictions that simulate AI model behavior,
    allowing the system to be tested without requiring Vertex AI or Gemini setup.

AI/Medical Context:
    The service accepts a feature vector (AiPredictionRequest) containing:
    - Clinical features: Vitals, FAST exam findings, demographics
    - Time features: Minutes since symptom onset (critical for treatment windows)
    - Routing context: Hospital distances, travel times, door-to-needle estimates
    
    It returns predictions (AiPredictionResponse) including:
    - Stroke probability: Likelihood of acute ischemic stroke (0.0-1.0)
    - LVO probability: Likelihood of Large Vessel Occlusion (0.0-1.0)
    - Risk category: LOW, MODERATE, HIGH, CRITICAL
    - Hospital routing recommendations
    - Natural language explanations and clinical actions

Stub Implementation:
    For now, it provides a local stub implementation that:
    - Accepts a feature vector similar to `AiPredictionInput`
    - Returns a synthetic `AiPredictionOutput`-like result using heuristics
    - Simulates Gemini explanations with templates

Future Enhancement:
    Later, this module can be replaced or extended to:
    - Call a real Vertex AI endpoint for stroke / LVO probability
    - Call Gemini for natural-language explanations and recommended actions
    - Integrate with production ML models and LLM services

Note: All predictions use synthetic data for demonstration purposes only.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
import uuid
import random


def _iso_utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


# --- Request / Response Models -------------------------------------------------


@dataclass
class AiPredictionRequest:
    """
    Feature vector model for AI prediction service input.
    
    This dataclass represents all the clinical and contextual features needed
    for stroke/LVO prediction. It combines data from multiple sources:
    - EMS vitals: Physiological measurements
    - FAST exam: Neurological assessment findings
    - Demographics: Age, sex (risk factors)
    - Time features: Minutes since symptom onset (critical for treatment windows)
    - Hospital routing: Distances, travel times, door-to-needle estimates
    
    This mirrors the spirit of `AiPredictionInput` Avro schema but doesn't require
    the full Avro integration. It is deliberately simple and Python-native for
    ease of use in the stream processing pipeline.
    
    Medical Context:
        The features included are based on validated stroke prediction models:
        - FAST score and findings: Strong predictors of stroke
        - Time since onset: Critical for treatment eligibility
        - Vitals: GCS, blood pressure inform severity
        - Hospital routing: Balances travel time vs. treatment capabilities
    """
    case_id: str
    patient_id: str
    ems_unit_id: str

    age_years: Optional[int] = None
    sex: Optional[str] = None  # "MALE", "FEMALE", "UNKNOWN"

    heart_rate_bpm: Optional[int] = None
    systolic_bp_mmHg: Optional[int] = None
    diastolic_bp_mmHg: Optional[int] = None
    respiratory_rate_bpm: Optional[int] = None
    spo2_pct: Optional[int] = None
    gcs_total: Optional[int] = None
    blood_glucose_mg_dL: Optional[int] = None

    face_droop_present: bool = False
    arm_weakness_any: bool = False
    speech_abnormal_any: bool = False
    fast_score: Optional[int] = None

    minutes_since_symptom_onset: Optional[int] = None
    minutes_since_last_known_well: Optional[int] = None

    distance_km_to_nearest_primary_center: Optional[float] = None
    distance_km_to_nearest_comprehensive_center: Optional[float] = None
    estimated_travel_min_to_primary_center: Optional[int] = None
    estimated_travel_min_to_comprehensive_center: Optional[int] = None

    primary_center_additional_door_to_needle_min: Optional[int] = None
    comprehensive_center_additional_door_to_needle_min: Optional[int] = None

    ems_suspected_stroke: bool = True
    ems_suspected_lvo: bool = False

    features_version: str = "v1"


@dataclass
class AiPredictionResponse:
    """
    Complete AI prediction response model.
    
    This dataclass represents the full output from the AI prediction service,
    including probabilities, risk categorization, routing recommendations,
    and natural language explanations. It contains all the information needed
    by the dashboard and clinical decision support systems.
    
    This is intentionally aligned with the `AiPredictionOutput` Avro schema,
    but kept Python-native for ease of use in the stream processing pipeline.
    
    Medical Context:
        The response includes:
        - Probabilities: Stroke and LVO likelihood from ML models
        - Risk category: Clinical interpretation of probabilities
        - Routing: AI-recommended hospital destination with rationale
        - Time windows: Treatment eligibility assessment
        - Risk factors: Key clinical findings driving the prediction
        - Explanations: Natural language summaries from LLM (Gemini)
        - Actions: Clinical recommendations for EMS/ED teams
    """
    prediction_id: str
    case_id: str
    patient_id: str
    prediction_ts: str

    model_name: str
    model_version: str

    stroke_probability: Optional[float]
    lvo_probability: Optional[float]
    risk_category: str  # "LOW", "MODERATE", "HIGH", "CRITICAL"

    recommended_destination_hospital_id: Optional[str]
    recommended_destination_type: Optional[str]
    estimated_travel_min_to_recommended: Optional[int]
    estimated_additional_door_to_needle_min_at_recommended: Optional[int]

    time_window_assessment: Optional[str]

    top_risk_factors: Optional[List[str]] = None

    llm_explanation_summary: Optional[str] = None
    llm_recommended_actions: Optional[str] = None
    llm_model_name: Optional[str] = None
    explanation_version: str = "v1"

    minutes_since_symptom_onset: Optional[int] = None  # Time since symptom onset (for treatment window display)

    current_vitals: Optional[Dict[str, Any]] = None  # Latest vital signs snapshot
    
    # Enhanced AI features
    prediction_confidence: Optional[float] = None  # Confidence score (0.0-1.0) for the prediction
    trend_indicators: Optional[Dict[str, Any]] = None  # Temporal trend features (rate of change, volatility, etc.)
    detected_anomalies: Optional[List[str]] = None  # Anomalies detected in vital signs
    feature_importance: Optional[Dict[str, float]] = None  # Feature importance scores for explainability

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


# --- Stub Logic ----------------------------------------------------------------


def _categorize_risk(stroke_prob: float, lvo_prob: float) -> str:
    """
    Map AI probabilities to clinical risk categories.
    
    This function translates continuous probability values (0.0-1.0) from the
    AI model into discrete risk categories that are easier for clinicians to
    interpret and act upon in time-critical situations.
    
    Medical Context:
        - CRITICAL: Very high stroke/LVO probability → Immediate action required
        - HIGH: Significant stroke risk → Urgent evaluation needed
        - MODERATE: Moderate stroke risk → Standard evaluation
        - LOW: Lower stroke risk → Continue monitoring
    
    Args:
        stroke_prob: Probability of acute ischemic stroke (0.0-1.0)
        lvo_prob: Probability of Large Vessel Occlusion (0.0-1.0)
        
    Returns:
        str: Risk category ("LOW", "MODERATE", "HIGH", "CRITICAL")
    """
    if stroke_prob >= 0.8 or lvo_prob >= 0.6:
        return "CRITICAL"
    if stroke_prob >= 0.6 or lvo_prob >= 0.4:
        return "HIGH"
    if stroke_prob >= 0.3:
        return "MODERATE"
    return "LOW"


def _mock_hospital_choice(req: AiPredictionRequest) -> tuple[Optional[str], Optional[str], Optional[int], Optional[int]]:
    """
    Simplified hospital routing logic for the stub implementation.
    
    This function implements basic routing heuristics that simulate the AI
    routing algorithm. In production, this would be replaced by more
    sophisticated logic that considers multiple factors.
    
    Medical Context:
        Routing decision logic:
        - If LVO suspected AND comprehensive center is within reasonable distance
          (≤15 min more than primary) → Route to comprehensive center
          (comprehensive centers can perform EVT for LVO)
        - Otherwise → Route to primary center (faster access to IV tPA)
        
        This balances:
        - Treatment capability: Comprehensive centers can do EVT
        - Travel time: Shorter travel = faster treatment initiation
        - Treatment windows: Time since onset affects which treatments are viable
    
    Args:
        req: Feature vector with LVO suspicion and travel time estimates
        
    Returns:
        tuple: (hospital_id, hospital_type, travel_minutes, door_to_needle_minutes)
        
    Note:
        For now, we do not query real hospital streams here; those would be
        injected by a higher-level orchestrator. This uses hardcoded hospital IDs.
    """
    # For the stub, we just pick IDs that match our synthetic hospitals.
    primary_id = "HOSP-PRIMARY-01"
    comprehensive_id = "HOSP-COMP-01"

    # Use basic heuristics on distances/travel time if available
    primary_travel = req.estimated_travel_min_to_primary_center
    comp_travel = req.estimated_travel_min_to_comprehensive_center

    if req.ems_suspected_lvo and comp_travel is not None:
        # Prefer comprehensive center if within a reasonable travel time
        if primary_travel is None or comp_travel <= primary_travel + 15:
            return comprehensive_id, "COMPREHENSIVE_CENTER", comp_travel, req.comprehensive_center_additional_door_to_needle_min

    # Default: primary center
    return primary_id, "PRIMARY_CENTER", primary_travel, req.primary_center_additional_door_to_needle_min


def _mock_time_window_assessment(req: AiPredictionRequest) -> Optional[str]:
    """
    Assess treatment time window eligibility based on symptom onset time.
    
    This function determines which treatments are viable based on time since
    symptom onset. Treatment windows are critical for stroke care:
    - IV tPA (thrombolysis): Typically only within 4.5 hours (270 minutes)
    - EVT (thrombectomy): May be considered up to 6-24 hours depending on imaging
    
    Medical Context:
        Time windows are strict for stroke treatment:
        - ≤270 minutes: Within standard IV tPA window
        - 270-360 minutes: Extended window, may consider EVT
        - >360 minutes: Outside standard windows, imaging-based decisions
    
    Args:
        req: Feature vector with minutes_since_symptom_onset
        
    Returns:
        str: Assessment of treatment window eligibility, or None if unknown
    """
    mins = req.minutes_since_symptom_onset
    if mins is None:
        return "Unknown onset time (consider imaging-based decision)."
    if mins <= 270:  # 4.5 hours - standard IV tPA window
        return "Within typical IV tPA window."
    if mins <= 360:  # 6 hours - extended window for EVT
        return "Within extended window for some EVT candidates."
    return "Outside standard IV tPA window; EVT may still be considered in select cases."


def _mock_top_risk_factors(req: AiPredictionRequest) -> List[str]:
    """
    Extract top risk factors from clinical features.
    
    This function identifies the key clinical findings that drive the stroke
    prediction. These risk factors are displayed to clinicians to help them
    understand which features influenced the AI's assessment.
    
    Medical Context:
        The risk factors are based on validated stroke indicators:
        - FAST findings: Face droop, arm weakness, speech abnormalities
        - Neurological status: Reduced GCS indicates more severe stroke
        - Vitals: Elevated blood pressure can be a risk factor
    
    Args:
        req: Feature vector with clinical findings
        
    Returns:
        List[str]: List of risk factor descriptions
        
    Note:
        If no clear risk factors are found, returns a generic message about
        subtle findings to indicate the prediction is based on less obvious signs.
    """
    factors: List[str] = []

    if req.face_droop_present:
        factors.append("Face droop")
    if req.arm_weakness_any:
        factors.append("Arm weakness")
    if req.speech_abnormal_any:
        factors.append("Speech abnormality")
    if req.gcs_total is not None and req.gcs_total < 15:
        factors.append(f"Reduced GCS ({req.gcs_total})")
    if req.systolic_bp_mmHg is not None and req.systolic_bp_mmHg > 180:
        factors.append(f"Elevated systolic BP ({req.systolic_bp_mmHg})")

    if not factors:
        factors.append("Subtle findings with possible stroke symptoms.")

    return factors


def _mock_llm_summary_and_actions(
    req: AiPredictionRequest,
    stroke_prob: float,
    lvo_prob: float,
    risk_category: str,
    dest_hosp_id: Optional[str],
    dest_type: Optional[str],
) -> tuple[str, str]:
    """
    Generate template-based clinical explanations (stub for Gemini).
    
    This function creates natural language explanations and clinical recommendations
    using templates. In production, this would be replaced by a call to Gemini LLM
    that generates contextually relevant explanations based on the specific case.
    
    Medical Context:
        The explanations include:
        - Summary: Brief explanation of risk assessment and key factors
        - Actions: Specific, time-critical interventions for EMS during transport
        
        Actions are tailored based on:
        - LVO probability: Different actions for suspected LVO
        - Hospital type: Comprehensive vs primary center routing
        - Time window: Longer time from onset requires different emphasis
    
    Args:
        req: Feature vector with clinical data
        stroke_prob: Stroke probability from AI model
        lvo_prob: LVO probability from AI model
        risk_category: Risk category (LOW, MODERATE, HIGH, CRITICAL)
        dest_hosp_id: Recommended hospital ID
        dest_type: Hospital type (PRIMARY_CENTER or COMPREHENSIVE_CENTER)
        
    Returns:
        tuple: (summary_string, recommended_actions_string)
        
    Note:
        For now, this is a handcrafted template that plays the role of Gemini.
        Later, it can be replaced with an actual Gemini call for more dynamic
        and contextually relevant explanations.
    """
    onset_str: str
    if req.minutes_since_symptom_onset is None:
        onset_str = "with unknown onset time"
    else:
        onset_str = f"with symptoms for approximately {req.minutes_since_symptom_onset} minutes"

    if dest_type == "COMPREHENSIVE_CENTER":
        dest_desc = "a comprehensive stroke center capable of EVT"
    else:
        dest_desc = "the nearest primary stroke center"

    summary = (
        f"NeuroPulse estimates a {stroke_prob:.0%} probability of acute ischemic stroke "
        f"and a {lvo_prob:.0%} probability of large vessel occlusion in a patient {onset_str}. "
        f"Overall risk is categorized as {risk_category}. "
        f"The system recommends routing to {dest_desc} (ID: {dest_hosp_id})."
    )

    actions = [
        "- Maintain airway, breathing, and circulation; avoid hypotension.",
        "- Keep SpO₂ ≥ 94% and manage blood glucose if severely abnormal.",
        "- Perform ongoing neurological reassessment during transport.",
    ]

    if dest_type == "COMPREHENSIVE_CENTER":
        actions.append("- Pre-notify the comprehensive stroke center about suspected LVO for possible EVT.")
    else:
        actions.append("- Pre-notify the primary stroke center for rapid imaging and thrombolysis evaluation.")

    if req.minutes_since_symptom_onset is not None and req.minutes_since_symptom_onset > 270:
        actions.append("- Given longer time from onset, emphasize rapid imaging and consider EVT eligibility based on advanced imaging.")

    return summary, "\n".join(actions)


def stub_predict(request: AiPredictionRequest) -> AiPredictionResponse:
    """
    Stub implementation of the AI prediction service.
    
    This function simulates the complete AI prediction pipeline using heuristics
    and clinical rules. It provides a working implementation for development and
    testing without requiring Vertex AI or Gemini setup.
    
    AI Pipeline Simulation:
        1. Calculate base probabilities from clinical features
        2. Apply heuristics based on FAST score, clinical signs, time windows
        3. Add small random variation for realism
        4. Categorize risk based on probabilities
        5. Choose hospital destination using routing logic
        6. Generate time window assessment
        7. Extract top risk factors
        8. Generate explanations and recommendations (stub for Gemini)
    
    Medical Context:
        The heuristics are based on validated clinical knowledge:
        - FAST score: Strong predictor of stroke (higher score = higher probability)
        - Clinical signs: Face droop, arm weakness, speech abnormalities
        - Time window: Shorter time since onset suggests higher treatable stroke probability
        - GCS: Lower GCS indicates more severe stroke, often associated with LVO
    
    Args:
        request: Feature vector with all clinical and contextual data
        
    Returns:
        AiPredictionResponse: Complete prediction with probabilities, routing, and explanations
        
    Note:
        In a real implementation, this function would:
        - Serialize the request features
        - Call a Vertex AI endpoint for stroke/LVO probabilities
        - Call Gemini for natural language explanations and recommendations
        
        For now, we use simple heuristics and randomness to simulate behavior.
    """

    # Very rough probability heuristics for demo purposes only
    base_stroke_prob = 0.2
    base_lvo_prob = 0.05

    if request.fast_score:
        base_stroke_prob += 0.2 * min(request.fast_score, 3)

    if request.arm_weakness_any:
        base_lvo_prob += 0.15

    if request.speech_abnormal_any:
        base_stroke_prob += 0.1

    if request.minutes_since_symptom_onset is not None and request.minutes_since_symptom_onset <= 270:
        base_stroke_prob += 0.1

    # Clamp within [0, 1] and add small random noise for variation
    stroke_prob = max(0.0, min(1.0, base_stroke_prob + random.uniform(-0.05, 0.05)))
    lvo_prob = max(0.0, min(1.0, base_lvo_prob + random.uniform(-0.03, 0.03)))

    risk_category = _categorize_risk(stroke_prob, lvo_prob)

    dest_hosp_id, dest_type, travel_min, extra_dtn = _mock_hospital_choice(request)
    time_window_assessment = _mock_time_window_assessment(request)
    top_risk_factors = _mock_top_risk_factors(request)
    summary, actions = _mock_llm_summary_and_actions(
        request, stroke_prob, lvo_prob, risk_category, dest_hosp_id, dest_type
    )

    return AiPredictionResponse(
        prediction_id=f"PRED-{uuid.uuid4().hex[:10].upper()}",
        case_id=request.case_id,
        patient_id=request.patient_id,
        prediction_ts=_iso_utc_now(),
        model_name="stroke_lvo_stub_model",
        model_version="v0.1-stub",
        stroke_probability=stroke_prob,
        lvo_probability=lvo_prob,
        risk_category=risk_category,
        recommended_destination_hospital_id=dest_hosp_id,
        recommended_destination_type=dest_type,
        estimated_travel_min_to_recommended=travel_min,
        estimated_additional_door_to_needle_min_at_recommended=extra_dtn,
        time_window_assessment=time_window_assessment,
        minutes_since_symptom_onset=request.minutes_since_symptom_onset,
        top_risk_factors=top_risk_factors,
        llm_explanation_summary=summary,
        llm_recommended_actions=actions,
        llm_model_name="gemini-1.5-pro-stub",
        explanation_version="v1",
    )


# Optional: quick local demo
if __name__ == "__main__":
    demo_req = AiPredictionRequest(
        case_id="CASE-DEMO-1234",
        patient_id="PAT-DEMO-5678",
        ems_unit_id="UNIT-01",
        age_years=68,
        sex="FEMALE",
        heart_rate_bpm=96,
        systolic_bp_mmHg=190,
        diastolic_bp_mmHg=100,
        spo2_pct=94,
        gcs_total=14,
        face_droop_present=True,
        arm_weakness_any=True,
        speech_abnormal_any=True,
        fast_score=3,
        minutes_since_symptom_onset=45,
        distance_km_to_nearest_primary_center=5.0,
        distance_km_to_nearest_comprehensive_center=12.0,
        estimated_travel_min_to_primary_center=8,
        estimated_travel_min_to_comprehensive_center=15,
        primary_center_additional_door_to_needle_min=20,
        comprehensive_center_additional_door_to_needle_min=10,
        ems_suspected_stroke=True,
        ems_suspected_lvo=True,
    )

    resp = stub_predict(demo_req)
    print(resp.to_dict())
