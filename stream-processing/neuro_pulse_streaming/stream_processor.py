"""
NeuroPulse - Stream Processor

Main stream processing service that orchestrates the AI prediction pipeline for acute stroke cases.

This is the core component that transforms raw EMS data into actionable AI-driven clinical intelligence.
It performs real-time stream processing, feature engineering, and coordinates calls to Vertex AI
and Gemini to generate stroke risk predictions and clinical recommendations.

Architecture Context:
    The stream processor sits at the heart of the NeuroPulse pipeline:
    1. Consumes from Kafka topics (ems.vitals.raw, ems.fast.exam, hospital.capacity)
    2. Joins multiple streams by case_id to build complete patient context
    3. Performs feature engineering (time calculations, clinical feature extraction)
    4. Calls Vertex AI for stroke/LVO probability predictions
    5. Calls Gemini LLM for natural language explanations and clinical recommendations
    6. Publishes enriched predictions to ai.prediction.output topic
    7. API server consumes predictions and serves to dashboard

AI/Medical Context:
    - Feature Engineering: Combines vitals, FAST exam findings, and hospital capacity data
      into a feature vector suitable for ML model inference
    - Time Windows: Calculates minutes since symptom onset (critical for treatment eligibility)
    - Hospital Routing: Considers LVO probability, travel time, and hospital capabilities
      to recommend optimal destination (primary vs comprehensive stroke center)
    - Risk Categorization: Maps AI probabilities to clinical risk categories (LOW, MODERATE, HIGH, CRITICAL)
    - Clinical Decision Support: Gemini generates explanations that help EMS/ED teams
      understand the AI's reasoning and recommended actions

Data Flow:
    EMS Vitals → FAST Exam → Hospital Capacity → Feature Vector → Vertex AI → Gemini → Prediction Output

Note: All data in this system is synthetic and for demonstration purposes only.
"""

from __future__ import annotations

import json
import time
from collections import defaultdict
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
import uuid

from confluent_kafka import Consumer, Producer, KafkaError

from .kafka_consumer_helper import create_kafka_consumer, load_kafka_config
from .vertex_ai_service import predict_with_vertex_ai
from .gemini_service import generate_explanation_with_gemini
from .trend_analyzer import TrendAnalyzer, VitalSnapshot
from .metrics_collector import get_metrics_collector

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from ai_models.neuro_pulse_ai.prediction_service_stub import (
    AiPredictionRequest,
    AiPredictionResponse,
)
from data_generator.neuro_pulse_datagen.ems_vitals_simulator import EmsVitalsEvent
from data_generator.neuro_pulse_datagen.ems_fast_exam_simulator import EmsFastExamEvent
from data_generator.neuro_pulse_datagen.hospital_capacity_simulator import HospitalCapacityEvent


def _iso_utc_now() -> str:
    """
    Generate ISO 8601 formatted UTC timestamp string.
    
    Returns:
        str: ISO timestamp in format "YYYY-MM-DDTHH:MM:SSZ"
        
    Use Case:
        Used for prediction timestamps to ensure consistent timezone handling
        across the distributed system (Kafka, API server, dashboard).
    """
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _parse_iso(ts: Optional[str]) -> Optional[datetime]:
    """
    Parse an ISO 8601 timestamp string to a datetime object.
    
    Handles both "Z" suffix (UTC) and "+00:00" timezone formats.
    
    Args:
        ts: ISO timestamp string (e.g., "2024-01-01T12:00:00Z")
        
    Returns:
        datetime: Parsed datetime object, or None if parsing fails
        
    Use Case:
        Used to parse timestamps from Kafka messages for time-based calculations
        (e.g., minutes since symptom onset, which is critical for treatment windows).
    """
    if ts is None:
        return None
    try:
        if ts.endswith("Z"):
            ts = ts.replace("Z", "+00:00")
        return datetime.fromisoformat(ts)
    except Exception:
        return None


def _minutes_between(start: Optional[str], end: Optional[str]) -> Optional[int]:
    """
    Calculate the number of minutes between two ISO timestamp strings.
    
    This is critical for stroke treatment decisions, as treatment eligibility
    depends heavily on time since symptom onset:
    - IV tPA (thrombolysis): Typically within 4.5 hours (270 minutes)
    - EVT (thrombectomy): May be considered up to 6-24 hours depending on imaging
    
    Args:
        start: ISO timestamp string for start time (e.g., symptom onset)
        end: ISO timestamp string for end time (e.g., current time)
        
    Returns:
        int: Number of minutes between timestamps, or None if calculation fails
        
    Use Case:
        Calculates minutes since symptom onset from FAST exam data, which is
        a key feature for the AI prediction models.
    """
    start_dt = _parse_iso(start)
    end_dt = _parse_iso(end)
    if not start_dt or not end_dt:
        return None
    delta = end_dt - start_dt
    return int(delta.total_seconds() // 60)


class StreamProcessor:
    """
    Main stream processor that orchestrates the AI prediction pipeline.
    
    This class consumes real-time data streams from Kafka, joins them by case_id,
    performs feature engineering, calls Vertex AI and Gemini for predictions and
    explanations, and publishes the results back to Kafka.
    
    Stream Processing Pattern:
        The processor maintains in-memory state for each case, accumulating data
        from multiple Kafka topics until it has sufficient information to generate
        a prediction. This follows a "stateful stream processing" pattern where
        events are joined by case_id across different topics.
    
    State Management:
        - latest_vitals: Most recent vital signs per case (continuously updated)
        - latest_fast_exam: FAST stroke exam results per case (typically one per case)
        - latest_capacity: Current hospital capacity and capabilities (shared across cases)
        - processed_cases: Tracks which cases have already generated predictions (prevents duplicates)
    
    AI Pipeline:
        1. Receive events from Kafka (vitals, FAST exam, hospital capacity)
        2. Update in-memory state
        3. When sufficient data available → Build feature vector
        4. Call Vertex AI → Get stroke/LVO probabilities
        5. Call Gemini → Get natural language explanations
        6. Publish enriched prediction to ai.prediction.output topic
    """

    def __init__(self):
        """
        Initialize the stream processor with Kafka consumers and producers.
        
        Sets up connections to Confluent Cloud Kafka and initializes in-memory
        state stores for stream joining and feature engineering.
        """
        # Create Kafka consumer for reading from input topics
        self.consumer = create_kafka_consumer()
        cfg = load_kafka_config()
        
        # Create producer for publishing predictions to output topic
        # This enables the API server to consume predictions and serve them to the dashboard
        from data_generator.neuro_pulse_datagen.kafka_producer_helper import create_kafka_producer
        self.producer = create_kafka_producer()
        
        # State: latest events per case
        # These dictionaries enable stream joining by case_id across different topics
        self.latest_vitals: Dict[str, EmsVitalsEvent] = {}  # Most recent vitals per case
        self.latest_fast_exam: Dict[str, EmsFastExamEvent] = {}  # FAST exam results per case
        self.latest_capacity: List[HospitalCapacityEvent] = []  # Hospital capacity (shared across cases)
        
        # Track processed cases to avoid duplicate predictions
        # Once a case has been processed and prediction published, we don't reprocess it
        # (in production, you might want to reprocess on significant updates)
        self.processed_cases: set[str] = set()
        
        # Trend analyzer for temporal feature engineering
        self.trend_analyzer = TrendAnalyzer(max_history_size=20)

    def _parse_vitals_event(self, msg_value: bytes) -> Optional[EmsVitalsEvent]:
        """
        Parse an EMS vitals event from a Kafka message.
        
        Consumes from ems.vitals.raw topic for real-time vital signs.
        
        Vitals events contain continuous physiological measurements from the ambulance,
        including heart rate, blood pressure, SpO2, GCS (Glasgow Coma Scale), and blood glucose.
        These are key features for the AI stroke prediction models.
        
        Args:
            msg_value: Raw bytes from Kafka message (JSON-encoded)
            
        Returns:
            EmsVitalsEvent: Parsed event object, or None if parsing fails
            
        Error Handling:
            Logs errors but continues processing to avoid stopping the entire pipeline
            due to a single malformed message.
        """
        try:
            data = json.loads(msg_value.decode("utf-8"))
            return EmsVitalsEvent(**data)
        except Exception as e:
            print(f"[ERROR] Failed to parse vitals event: {e}")
            return None

    def _parse_fast_exam_event(self, msg_value: bytes) -> Optional[EmsFastExamEvent]:
        """
        Parse a FAST (Face, Arms, Speech, Time) stroke exam event from a Kafka message.
        
        The FAST exam is a critical neurological assessment performed by EMS:
        - Face droop: Asymmetry in facial movement
        - Arm weakness: Unilateral or bilateral weakness
        - Speech difficulty: Dysarthria or suspected aphasia
        - Time: Symptom onset time (critical for treatment windows)
        
        The FAST score (0-3) indicates the number of positive findings and is a strong
        predictor of stroke. This exam triggers the AI prediction pipeline.
        
        Args:
            msg_value: Raw bytes from Kafka message (JSON-encoded)
            
        Returns:
            EmsFastExamEvent: Parsed event object, or None if parsing fails
        """
        try:
            data = json.loads(msg_value.decode("utf-8"))
            return EmsFastExamEvent(**data)
        except Exception as e:
            print(f"[ERROR] Failed to parse FAST exam event: {e}")
            return None

    def _parse_capacity_event(self, msg_value: bytes) -> Optional[HospitalCapacityEvent]:
        """
        Parse a hospital capacity event from a Kafka message.
        
        Hospital capacity events contain real-time information about:
        - Stroke center level (PRIMARY vs COMPREHENSIVE)
        - Current capacity and availability
        - Estimated door-to-needle time (processing delay at hospital)
        
        This information is used by the AI routing algorithm to recommend the optimal
        hospital destination based on LVO probability and treatment capabilities.
        
        Args:
            msg_value: Raw bytes from Kafka message (JSON-encoded)
            
        Returns:
            HospitalCapacityEvent: Parsed event object, or None if parsing fails
        """
        try:
            data = json.loads(msg_value.decode("utf-8"))
            return HospitalCapacityEvent(**data)
        except Exception as e:
            print(f"[ERROR] Failed to parse capacity event: {e}")
            return None

    def _build_prediction_request(
        self,
        vitals: EmsVitalsEvent,
        fast_exam: Optional[EmsFastExamEvent],
        capacity_events: List[HospitalCapacityEvent],
    ) -> Optional[AiPredictionRequest]:
        """
        Build an AI prediction request (feature vector) from available stream events.
        
        This method performs feature engineering by:
        1. Extracting clinical features from vitals and FAST exam
        2. Calculating time-based features (minutes since symptom onset)
        3. Mapping FAST findings to boolean/categorical features
        4. Incorporating hospital capacity and routing context
        
        The resulting feature vector is sent to Vertex AI for stroke/LVO probability prediction.
        
        Medical Context:
            - Time since onset: Critical for treatment window eligibility
            - FAST findings: Strong predictors of stroke (face droop, arm weakness, speech)
            - Vitals: GCS, blood pressure, heart rate inform severity assessment
            - Hospital routing: Primary centers can give IV tPA; comprehensive centers can perform EVT
        
        Args:
            vitals: Latest vital signs for the case
            fast_exam: FAST stroke exam results (required for prediction)
            capacity_events: Current hospital capacity and capabilities
            
        Returns:
            AiPredictionRequest: Feature vector ready for AI model, or None if insufficient data
            
        Note:
            In production, demographics would come from a patient registry, and distances
            would be calculated from GPS coordinates using routing APIs.
        """
        if not fast_exam:
            return None  # Need at least FAST exam for prediction

        # Compute time since symptom onset (critical for treatment windows)
        # IV tPA is typically only given within 4.5 hours (270 minutes) of onset
        now_iso = vitals.event_ts
        minutes_since_onset = _minutes_between(fast_exam.symptom_onset_ts, now_iso)
        minutes_since_lkw = _minutes_between(fast_exam.last_known_well_ts, now_iso)

        # Map FAST exam findings to boolean features for ML model
        # These are key clinical indicators of stroke:
        face_droop_present = fast_exam.face_droop == "PRESENT"  # Facial asymmetry
        arm_weakness_any = fast_exam.arm_weakness in ("LEFT", "RIGHT", "BILATERAL")  # Motor weakness
        speech_abnormal_any = fast_exam.speech_difficulty in ("DYSARTHRIA", "APHASIA_SUSPECTED")  # Speech impairment

        # Find hospitals by stroke center level
        # PRIMARY centers: Can administer IV tPA (thrombolysis)
        # COMPREHENSIVE centers: Can perform EVT (endovascular thrombectomy) for LVO
        primary = next((c for c in capacity_events if c.stroke_center_level == "PRIMARY"), None)
        comp = next((c for c in capacity_events if c.stroke_center_level == "COMPREHENSIVE"), None)

        # Simple distance estimates (in real system, would calculate from GPS coordinates)
        # These inform the routing recommendation algorithm
        estimated_travel_min_to_primary = 8
        estimated_travel_min_to_comprehensive = 15
        distance_km_to_primary = 5.0
        distance_km_to_comprehensive = 12.0

        # Extract door-to-needle time estimates from hospital capacity data
        # This represents expected processing delay at the hospital before treatment can begin
        primary_extra_dtn = primary.estimated_additional_door_to_needle_minutes if primary else None
        comp_extra_dtn = comp.estimated_additional_door_to_needle_minutes if comp else None

        # Default demographics (would come from separate patient registry stream in production)
        # Age and sex are risk factors that influence stroke probability
        age_years = 68
        sex = "FEMALE"

        return AiPredictionRequest(
            case_id=vitals.case_id,
            patient_id=vitals.patient_id,
            ems_unit_id=vitals.ems_unit_id,
            age_years=age_years,
            sex=sex,
            heart_rate_bpm=vitals.heart_rate_bpm,
            systolic_bp_mmHg=vitals.systolic_bp_mmHg,
            diastolic_bp_mmHg=vitals.diastolic_bp_mmHg,
            respiratory_rate_bpm=vitals.respiratory_rate_bpm,
            spo2_pct=vitals.spo2_pct,
            gcs_total=vitals.gcs_total,
            blood_glucose_mg_dL=vitals.blood_glucose_mg_dL,
            face_droop_present=face_droop_present,
            arm_weakness_any=arm_weakness_any,
            speech_abnormal_any=speech_abnormal_any,
            fast_score=fast_exam.fast_score,
            minutes_since_symptom_onset=minutes_since_onset,
            minutes_since_last_known_well=minutes_since_lkw,
            distance_km_to_nearest_primary_center=distance_km_to_primary,
            distance_km_to_nearest_comprehensive_center=distance_km_to_comprehensive,
            estimated_travel_min_to_primary_center=estimated_travel_min_to_primary,
            estimated_travel_min_to_comprehensive_center=estimated_travel_min_to_comprehensive,
            primary_center_additional_door_to_needle_min=primary_extra_dtn,
            comprehensive_center_additional_door_to_needle_min=comp_extra_dtn,
            ems_suspected_stroke=fast_exam.ems_suspected_stroke,
            ems_suspected_lvo=bool(fast_exam.fast_score and fast_exam.fast_score >= 2),
            features_version="v1",
        )

    def _categorize_risk(self, stroke_prob: float, lvo_prob: float) -> str:
        """
        Categorize stroke risk into clinical risk categories based on AI probabilities.
        
        This mapping translates continuous probability values (0.0-1.0) from the Vertex AI
        model into discrete risk categories that are easier for clinicians to interpret
        and act upon in time-critical situations.
        
        Medical Context:
            - CRITICAL: Very high stroke/LVO probability → Immediate comprehensive center routing
            - HIGH: Significant stroke risk → Urgent primary center routing
            - MODERATE: Moderate stroke risk → Standard evaluation
            - LOW: Lower stroke risk → Continue monitoring
        
        Args:
            stroke_prob: Probability of acute ischemic stroke (0.0-1.0) from Vertex AI
            lvo_prob: Probability of Large Vessel Occlusion (0.0-1.0) from Vertex AI
            
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

    def _choose_hospital(
        self, request: AiPredictionRequest, capacity_events: List[HospitalCapacityEvent]
    ) -> tuple[Optional[str], Optional[str], Optional[int], Optional[int]]:
        """
        Choose the recommended hospital destination based on LVO probability and routing constraints.
        
        This implements the AI-driven routing algorithm that balances:
        - LVO probability: Higher LVO probability → comprehensive center (can perform EVT)
        - Travel time: Shorter travel time → faster treatment initiation
        - Treatment window: Time since onset affects which treatments are viable
        
        Medical Context:
            - Primary stroke centers: Can administer IV tPA (thrombolysis) within 4.5 hours
            - Comprehensive stroke centers: Can perform EVT (thrombectomy) for LVO up to 6-24 hours
            - LVO (Large Vessel Occlusion): Requires mechanical thrombectomy, only available at comprehensive centers
            - Routing decision: If LVO is likely, route to comprehensive center even if slightly farther
        
        Algorithm:
            1. If LVO suspected AND comprehensive center is within reasonable distance (≤15 min more than primary)
               → Route to comprehensive center
            2. Otherwise → Route to primary center (faster access to IV tPA)
        
        Args:
            request: AI prediction request with LVO suspicion and travel time estimates
            capacity_events: Current hospital capacity and capabilities
            
        Returns:
            tuple: (hospital_id, hospital_type, travel_minutes, door_to_needle_minutes)
                   Returns (None, None, None, None) if no suitable hospital found
        """
        # Find hospitals by stroke center level
        primary = next((c for c in capacity_events if c.stroke_center_level == "PRIMARY"), None)
        comp = next((c for c in capacity_events if c.stroke_center_level == "COMPREHENSIVE"), None)

        primary_id = primary.hospital_id if primary else None
        comp_id = comp.hospital_id if comp else None

        primary_travel = request.estimated_travel_min_to_primary_center
        comp_travel = request.estimated_travel_min_to_comprehensive_center

        # If LVO suspected and comprehensive center is reasonable, choose it
        # LVO requires EVT (thrombectomy), which is only available at comprehensive centers
        # We accept up to 15 minutes additional travel time to reach comprehensive center
        if request.ems_suspected_lvo and comp_id and comp_travel:
            if primary_travel is None or comp_travel <= primary_travel + 15:
                return (
                    comp_id,
                    "COMPREHENSIVE_CENTER",
                    comp_travel,
                    request.comprehensive_center_additional_door_to_needle_min,
                )

        # Default: primary center (faster access to IV tPA for non-LVO strokes)
        if primary_id:
            return (
                primary_id,
                "PRIMARY_CENTER",
                primary_travel,
                request.primary_center_additional_door_to_needle_min,
            )

        return None, None, None, None

    def _calculate_prediction_confidence(
        self, 
        request: AiPredictionRequest, 
        trend_features, 
        vitals, 
        fast_exam
    ) -> float:
        """
        Calculate prediction confidence score based on data quality and completeness.
        
        Confidence factors:
        - Data completeness: More complete data = higher confidence
        - Trend stability: Stable trends = higher confidence
        - Feature quality: Valid vitals and FAST exam = higher confidence
        
        Args:
            request: AI prediction request
            trend_features: Trend analysis results
            vitals: Latest vital signs
            fast_exam: FAST exam results
            
        Returns:
            float: Confidence score between 0.0 and 1.0
        """
        confidence = 0.5  # Base confidence
        
        # Data completeness (0.3 weight)
        completeness_score = 0.0
        if request.heart_rate_bpm is not None:
            completeness_score += 0.1
        if request.systolic_bp_mmHg is not None:
            completeness_score += 0.1
        if request.spo2_pct is not None:
            completeness_score += 0.1
        if request.gcs_total is not None:
            completeness_score += 0.1
        if request.fast_score is not None:
            completeness_score += 0.1
        if request.minutes_since_symptom_onset is not None:
            completeness_score += 0.1
        
        confidence += completeness_score * 0.3
        
        # Trend stability (0.2 weight)
        if trend_features:
            stability_score = 1.0
            if trend_features.hr_volatility and trend_features.hr_volatility > 0.2:
                stability_score -= 0.1
            if trend_features.bp_volatility and trend_features.bp_volatility > 0.15:
                stability_score -= 0.1
            if trend_features.spo2_volatility and trend_features.spo2_volatility > 0.1:
                stability_score -= 0.1
            stability_score = max(0.0, stability_score)
            confidence += stability_score * 0.2
        
        # Feature quality (0.3 weight)
        quality_score = 0.0
        if request.fast_score and request.fast_score >= 2:
            quality_score += 0.15  # Strong FAST findings
        if request.gcs_total and 13 <= request.gcs_total <= 15:
            quality_score += 0.1  # Valid GCS range
        if request.minutes_since_symptom_onset and request.minutes_since_symptom_onset <= 360:
            quality_score += 0.05  # Within treatment window
        
        confidence += quality_score * 0.3
        
        # Anomaly penalty (0.2 weight)
        anomaly_penalty = 0.0
        if trend_features and hasattr(trend_features, 'gcs_trend') and trend_features.gcs_trend == -1:
            anomaly_penalty += 0.1  # Deteriorating GCS reduces confidence slightly
        
        confidence -= anomaly_penalty * 0.2
        
        return max(0.0, min(1.0, confidence))
    
    def _calculate_feature_importance(
        self, 
        request: AiPredictionRequest, 
        stroke_prob: float, 
        lvo_prob: float
    ) -> Dict[str, float]:
        """
        Calculate feature importance scores for explainability.
        
        This provides insight into which features are driving the AI predictions,
        enabling better interpretability and trust in the system.
        
        Args:
            request: AI prediction request with features
            stroke_prob: Stroke probability
            lvo_prob: LVO probability
            
        Returns:
            Dict mapping feature names to importance scores (0.0-1.0)
        """
        importance = {}
        
        # FAST score is a strong predictor
        if request.fast_score:
            importance["fast_score"] = min(1.0, request.fast_score / 3.0)
        
        # Clinical signs are important
        if request.face_droop_present:
            importance["face_droop"] = 0.8
        if request.arm_weakness_any:
            importance["arm_weakness"] = 0.85
        if request.speech_abnormal_any:
            importance["speech_abnormality"] = 0.75
        
        # GCS is important for severity
        if request.gcs_total is not None:
            if request.gcs_total < 13:
                importance["gcs_total"] = 0.9
            elif request.gcs_total < 15:
                importance["gcs_total"] = 0.6
        
        # Time window is critical
        if request.minutes_since_symptom_onset is not None:
            if request.minutes_since_symptom_onset <= 270:
                importance["time_window"] = 0.9
            elif request.minutes_since_symptom_onset <= 360:
                importance["time_window"] = 0.7
            else:
                importance["time_window"] = 0.4
        
        # Blood pressure can be a factor
        if request.systolic_bp_mmHg is not None:
            if request.systolic_bp_mmHg > 180:
                importance["systolic_bp"] = 0.5
            elif request.systolic_bp_mmHg < 100:
                importance["systolic_bp"] = 0.4
        
        # Normalize importance scores
        if importance:
            max_importance = max(importance.values())
            if max_importance > 0:
                importance = {k: v / max_importance for k, v in importance.items()}
        
        return importance

    def _process_case(self, case_id: str) -> None:
        """
        Process a stroke case: generate AI prediction if all required data is available.
        
        This is the main orchestration method that:
        1. Validates we have sufficient data (vitals + FAST exam)
        2. Builds feature vector from stream events
        3. Calls Vertex AI for stroke/LVO probability predictions
        4. Calls Gemini for natural language explanations
        5. Determines hospital routing recommendation
        6. Publishes enriched prediction to Kafka
        
        The method ensures each case is only processed once to avoid duplicate predictions.
        In production, you might want to reprocess on significant updates (e.g., new vitals).
        
        Args:
            case_id: Unique identifier for the stroke case
            
        Pipeline Flow:
            Stream Events → Feature Engineering → Vertex AI → Gemini → Prediction Output
        """
        if case_id in self.processed_cases:
            return  # Already processed this case (prevents duplicate predictions)
        
        # Retrieve latest events for this case from in-memory state
        vitals = self.latest_vitals.get(case_id)
        fast_exam = self.latest_fast_exam.get(case_id)

        if not vitals:
            print(f"[DEBUG] Case {case_id}: Missing vitals")
            return  # Don't have all required data yet (wait for more events)
        if not fast_exam:
            print(f"[DEBUG] Case {case_id}: Missing FAST exam")
            return  # Don't have all required data yet (wait for more events)

        # Build feature vector from available events
        # This combines vitals, FAST exam findings, and hospital capacity into ML-ready features
        request = self._build_prediction_request(vitals, fast_exam, self.latest_capacity)
        if not request:
            print(f"[DEBUG] Case {case_id}: Failed to build prediction request (missing hospital capacity?)")
            return

        print(f"[PROCESSOR] Processing case {case_id}...")

        # Step 1: Calculate trend features and anomalies for enhanced AI predictions
        # This demonstrates "AI on data in motion" by incorporating temporal patterns
        trend_features = self.trend_analyzer.calculate_trends(case_id)
        anomalies = self.trend_analyzer.detect_anomalies(case_id)
        
        # Step 2: Get stroke and LVO probability predictions from Vertex AI
        # These are the core AI outputs that drive clinical decision-making
        stroke_prob, lvo_prob = predict_with_vertex_ai(request)
        
        # Enhance predictions based on trend analysis
        # Rapid deterioration increases stroke/LVO probability
        if trend_features.gcs_trend == -1 and trend_features.gcs_rate_of_change:
            # GCS declining (worsening) - increase stroke probability
            if trend_features.gcs_rate_of_change < -0.1:  # Significant decline
                stroke_prob = min(1.0, stroke_prob + 0.05)
                lvo_prob = min(1.0, lvo_prob + 0.03)
        if trend_features.spo2_trend == -1 and trend_features.spo2_rate_of_change:
            # SpO2 declining - increase stroke probability
            if trend_features.spo2_rate_of_change < -0.5:  # Significant decline
                stroke_prob = min(1.0, stroke_prob + 0.03)
        
        risk_category = self._categorize_risk(stroke_prob, lvo_prob)
        
        # Step 3: Calculate prediction confidence
        # Confidence is based on data quality, trend stability, and feature completeness
        confidence = self._calculate_prediction_confidence(request, trend_features, vitals, fast_exam)
        
        # Step 4: Calculate feature importance for explainability
        feature_importance = self._calculate_feature_importance(request, stroke_prob, lvo_prob)

        # Step 5: Choose optimal hospital destination based on LVO probability and routing constraints
        # This implements the AI-driven routing algorithm
        dest_hosp_id, dest_type, travel_min, extra_dtn = self._choose_hospital(request, self.latest_capacity)

        # Step 6: Get natural language explanation and clinical recommendations from Gemini
        # This helps clinicians understand the AI's reasoning and recommended actions
        summary, actions = generate_explanation_with_gemini(
            request, stroke_prob, lvo_prob, risk_category, dest_hosp_id
        )

        # Step 7: Extract top risk factors from clinical features
        # These are the key clinical findings that drive the prediction
        risk_factors = []
        if request.face_droop_present:
            risk_factors.append("Face droop")
        if request.arm_weakness_any:
            risk_factors.append("Arm weakness")
        if request.speech_abnormal_any:
            risk_factors.append("Speech abnormality")
        if request.gcs_total is not None and request.gcs_total < 15:
            risk_factors.append(f"Reduced GCS ({request.gcs_total})")
        if request.systolic_bp_mmHg is not None and request.systolic_bp_mmHg > 180:
            risk_factors.append(f"Elevated systolic BP ({request.systolic_bp_mmHg})")
        
        # Add trend-based risk factors
        if trend_features.gcs_trend == -1:
            risk_factors.append("Deteriorating GCS trend")
        if trend_features.spo2_trend == -1:
            risk_factors.append("Declining SpO2 trend")
        if anomalies:
            risk_factors.extend([f"Anomaly: {a}" for a in anomalies[:2]])  # Limit to 2 most critical

        # Step 8: Assess treatment time window eligibility
        # This is critical for determining which treatments are viable
        mins = request.minutes_since_symptom_onset
        if mins is None:
            time_window = "Unknown onset time (consider imaging-based decision)."
        elif mins <= 270:  # 4.5 hours - standard IV tPA window
            time_window = "Within typical IV tPA window."
        elif mins <= 360:  # 6 hours - extended window for some EVT candidates
            time_window = "Within extended window for some EVT candidates."
        else:
            time_window = "Outside standard IV tPA window; EVT may still be considered."

        # Step 9: Convert vitals to dictionary format for inclusion in prediction
        # This provides the dashboard with the latest vital signs for display
        from dataclasses import asdict
        current_vitals_dict = None
        if vitals:
            try:
                current_vitals_dict = asdict(vitals)
            except Exception as e:
                print(f"[WARNING] Failed to serialize vitals for case {case_id}: {e}")
        
        # Step 10: Prepare trend indicators dictionary
        trend_indicators_dict = None
        if trend_features:
            trend_indicators_dict = {
                "hr_rate_of_change": trend_features.hr_rate_of_change,
                "bp_rate_of_change": trend_features.bp_rate_of_change,
                "spo2_rate_of_change": trend_features.spo2_rate_of_change,
                "gcs_rate_of_change": trend_features.gcs_rate_of_change,
                "hr_trend": trend_features.hr_trend,
                "bp_trend": trend_features.bp_trend,
                "spo2_trend": trend_features.spo2_trend,
                "gcs_trend": trend_features.gcs_trend,
                "hr_volatility": trend_features.hr_volatility,
                "bp_volatility": trend_features.bp_volatility,
                "spo2_volatility": trend_features.spo2_volatility,
            }
        
        # Step 11: Create enriched prediction response with all AI outputs
        prediction = AiPredictionResponse(
            prediction_id=f"PRED-{uuid.uuid4().hex[:10].upper()}",
            case_id=case_id,
            patient_id=request.patient_id,
            prediction_ts=_iso_utc_now(),
            model_name="vertex_ai_stroke_model",
            model_version="v1.0",
            stroke_probability=stroke_prob,
            lvo_probability=lvo_prob,
            risk_category=risk_category,
            recommended_destination_hospital_id=dest_hosp_id,
            recommended_destination_type=dest_type,
            estimated_travel_min_to_recommended=travel_min,
            estimated_additional_door_to_needle_min_at_recommended=extra_dtn,
            time_window_assessment=time_window,
            minutes_since_symptom_onset=request.minutes_since_symptom_onset,
            top_risk_factors=risk_factors if risk_factors else None,
            llm_explanation_summary=summary,
            llm_recommended_actions=actions,
            llm_model_name="gemini-1.5-flash",
            explanation_version="v1",
            current_vitals=current_vitals_dict,
            prediction_confidence=confidence,
            trend_indicators=trend_indicators_dict,
            detected_anomalies=anomalies if anomalies else None,
            feature_importance=feature_importance,
        )

        # Step 12: Publish prediction to Kafka for API server to consume
        self._publish_prediction(prediction)
        
        # Mark case as processed to avoid duplicate predictions
        self.processed_cases.add(case_id)

    def _publish_prediction(self, prediction: AiPredictionResponse) -> None:
        """
        Publish AI prediction to the ai.prediction.output Kafka topic.
        
        This method serializes the enriched prediction (with Vertex AI probabilities,
        Gemini explanations, and routing recommendations) and publishes it to Kafka.
        The API server consumes from this topic and serves predictions to the dashboard.
        
        Args:
            prediction: Complete AI prediction response with all enriched data
            
        Error Handling:
            Logs errors but doesn't raise exceptions to avoid stopping the processing loop
            due to Kafka publishing issues.
        """
        topic = "ai.prediction.output"
        
        try:
            # Serialize prediction to JSON and encode as UTF-8 bytes
            message = json.dumps(prediction.to_dict()).encode("utf-8")
            self.producer.produce(
                topic,
                value=message,
                callback=self._delivery_report,  # Async delivery confirmation
            )
            # Poll to trigger delivery callbacks (non-blocking)
            self.producer.poll(0)
            print(f"[PROCESSOR] Published prediction {prediction.prediction_id} to {topic}")
        except Exception as e:
            print(f"[ERROR] Failed to publish prediction: {e}")

    def _delivery_report(self, err, msg) -> None:
        """
        Callback function for Kafka message delivery confirmation.
        
        This is called asynchronously by the Kafka producer when a message is
        successfully delivered or fails. Used for monitoring and debugging.
        
        Args:
            err: Error object if delivery failed, None if successful
            msg: Message object with topic, partition, and offset information
        """
        if err is not None:
            print(f"[KAFKA] Delivery failed: {err}")
        else:
            print(f"[KAFKA] Delivered to {msg.topic()} [{msg.partition()}] @ {msg.offset()}")

    def run(self) -> None:
        """
        Main stream processing loop that consumes from Kafka and orchestrates AI predictions.
        
        This is the event loop that:
        1. Subscribes to multiple Kafka topics (vitals, FAST exam, hospital capacity)
        2. Continuously polls for new messages
        3. Parses and stores events in in-memory state
        4. Triggers case processing when sufficient data is available
        5. Handles errors gracefully to maintain continuous operation
        
        Stream Processing Pattern:
            The processor maintains state across multiple topics, joining events by case_id.
            When a new event arrives, it updates the state and checks if the case has
            enough data to generate a prediction. This enables real-time processing as
            data streams in from multiple sources.
        
        Topics Consumed:
            - ems.vitals.raw: Raw vital signs from ambulances
            - ems.fast.exam: FAST stroke exam results (triggers prediction)
            - hospital.capacity: Real-time hospital capacity and capabilities
        
        Error Handling:
            - Continues processing on individual message errors
            - Handles partition EOF (end of partition) as normal
            - Gracefully shuts down on KeyboardInterrupt
        """
        topics = ["ems.vitals.raw", "ems.fast.exam", "hospital.capacity"]
        self.consumer.subscribe(topics)

        print(f"[PROCESSOR] Subscribed to topics: {topics}")
        print("[PROCESSOR] Starting stream processing loop...")
        print("[PROCESSOR] Waiting for messages (consumer will read from latest offset)...")

        try:
            while True:
                msg = self.consumer.poll(timeout=1.0)
                
                if msg is None:
                    continue

                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        continue
                    else:
                        print(f"[ERROR] Consumer error: {msg.error()}")
                        continue

                # Record metrics for this message
                topic = msg.topic()
                metrics_collector = get_metrics_collector()
                metrics_collector.record_message(
                    stream_name=topic,
                    kafka_timestamp_ms=msg.timestamp()[1] if msg.timestamp()[0] == 0 else None,
                    message_size_bytes=len(msg.value()) if msg.value() else 0
                )

                case_id = None

                # Parse message based on topic
                if topic == "ems.vitals.raw":
                    vitals = self._parse_vitals_event(msg.value())
                    if vitals:
                        case_id = vitals.case_id
                        # Check if this is an update to an existing case
                        is_update = case_id in self.processed_cases
                        self.latest_vitals[vitals.case_id] = vitals
                        print(f"[PROCESSOR] Received vitals for case {case_id}" + (" (update)" if is_update else ""))
                        
                        # If case was already processed, reprocess with new vitals to update prediction
                        if is_update:
                            # Remove from processed set to allow reprocessing
                            self.processed_cases.discard(case_id)
                            self._process_case(case_id)
                        else:
                            # New case, try to process if we have all data
                            self._process_case(case_id)

                elif topic == "ems.fast.exam":
                    fast_exam = self._parse_fast_exam_event(msg.value())
                    if fast_exam:
                        self.latest_fast_exam[fast_exam.case_id] = fast_exam
                        case_id = fast_exam.case_id
                        print(f"[PROCESSOR] Received FAST exam for case {case_id}")
                        # Try to process case now that we have FAST exam
                        if case_id in self.latest_vitals:
                            self._process_case(case_id)

                elif topic == "hospital.capacity":
                    capacity = self._parse_capacity_event(msg.value())
                    if capacity:
                        # Update or add to capacity list
                        self.latest_capacity = [
                            c for c in self.latest_capacity if c.hospital_id != capacity.hospital_id
                        ]
                        self.latest_capacity.append(capacity)
                        print(f"[PROCESSOR] Updated capacity for {capacity.hospital_id}")

                # Try to process case if we have new data (only for new cases, vitals updates handled above)
                if case_id and topic != "ems.vitals.raw":
                    self._process_case(case_id)

        except KeyboardInterrupt:
            print("\n[PROCESSOR] Shutting down...")
        finally:
            self.consumer.close()
            self.producer.flush()


def main():
    """
    Entry point for the stream processor service.
    
    Initializes the StreamProcessor and starts the main event loop.
    This function is called when running the module directly (e.g., for local development).
    
    In production, this would typically be run as a service or containerized application.
    """
    processor = StreamProcessor()
    processor.run()


if __name__ == "__main__":
    main()

