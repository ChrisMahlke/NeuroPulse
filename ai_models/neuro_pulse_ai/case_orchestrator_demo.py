"""
NeuroPulse - Case Orchestrator Demo

This script simulates a single suspected stroke case end-to-end, demonstrating
the complete NeuroPulse pipeline from data generation through AI prediction
to clinical recommendations.

Architecture Context:
    This demo orchestrates the entire NeuroPulse workflow locally:
    1. Generates a sequence of EMS vitals events (simulates continuous monitoring)
    2. Generates a FAST exam (triggers AI prediction)
    3. Generates a snapshot of hospital capacity (for routing decisions)
    4. Assembles a feature vector (AiPredictionRequest) from all data
    5. Calls the AI prediction stub (stub_predict) to get predictions
    6. Prints a human-readable summary of the recommendation
    
    This runs completely locally (no Kafka, no Vertex AI calls) and is meant
    as a narrative, end-to-end demo of the NeuroPulse flow. It's useful for:
    - Understanding the complete pipeline
    - Testing the prediction logic
    - Demonstrating the system to stakeholders
    - Development and debugging

Medical Context:
    The demo simulates a realistic stroke case scenario:
    - Multiple vitals measurements over time (continuous monitoring)
    - FAST exam with neurological findings
    - Hospital capacity snapshot (affects routing)
    - AI prediction with stroke/LVO probabilities
    - Clinical recommendations for EMS/ED teams

Use Case:
    Run this script to see a complete example of how NeuroPulse processes
    a stroke case and generates AI-driven recommendations.

Note: All data is synthetic and for demonstration purposes only.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional
import uuid

from data_generator.neuro_pulse_datagen.ems_vitals_simulator import (
    EmsVitalsEvent,
    generate_random_ems_vitals_event,
)
from data_generator.neuro_pulse_datagen.ems_fast_exam_simulator import (
    EmsFastExamEvent,
    generate_random_fast_exam_event,
)
from data_generator.neuro_pulse_datagen.hospital_capacity_simulator import (
    HospitalCapacityEvent,
    generate_hospital_capacity_events,
)

from .prediction_service_stub import (
    AiPredictionRequest,
    AiPredictionResponse,
    stub_predict,
)


def _parse_iso(ts: Optional[str]) -> Optional[datetime]:
    """
    Parse an ISO 8601 timestamp string to a datetime object.
    
    Handles both "Z" suffix (UTC) and "+00:00" timezone formats.
    
    Args:
        ts: ISO timestamp string (e.g., "2024-01-01T12:00:00Z")
        
    Returns:
        datetime: Parsed datetime object, or None if parsing fails
    """
    if ts is None:
        return None
    try:
        # Expected format: something like 2025-11-18T10:15:30Z
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
    """
    start_dt = _parse_iso(start)
    end_dt = _parse_iso(end)
    if not start_dt or not end_dt:
        return None
    delta = end_dt - start_dt
    return int(delta.total_seconds() // 60)


def simulate_case_vitals(
    case_id: str,
    patient_id: str,
    ems_unit_id: str,
    num_events: int = 5,
) -> List[EmsVitalsEvent]:
    """
    Simulate a sequence of EMS vitals events for a single stroke case.
    
    This function generates multiple vitals measurements over time, simulating
    continuous monitoring during ambulance transport. The sequence represents
    how vitals would be measured and transmitted during the journey to the hospital.
    
    Args:
        case_id: Unique identifier for the stroke case
        patient_id: Patient identifier
        ems_unit_id: EMS unit identifier
        num_events: Number of vitals events to generate (default: 5)
        
    Returns:
        List[EmsVitalsEvent]: Sequence of vitals events with increasing sequence numbers
        
    Use Case:
        Simulates the continuous stream of vitals that would come from monitoring
        equipment in the ambulance, which the stream processor would consume in real-time.
    """
    events: List[EmsVitalsEvent] = []
    for seq in range(num_events):
        evt = generate_random_ems_vitals_event(
            case_id=case_id,
            patient_id=patient_id,
            ems_unit_id=ems_unit_id,
            sequence_number=seq,
        )
        events.append(evt)
    return events


def simulate_case_fast_exam(
    case_id: str,
    patient_id: str,
    ems_unit_id: str,
) -> EmsFastExamEvent:
    """
    Simulate a FAST exam event for the stroke case.
    
    The FAST exam is typically performed once per case and triggers the
    AI prediction pipeline. It contains critical neurological assessment
    findings and symptom onset timing.
    
    Args:
        case_id: Unique identifier for the stroke case
        patient_id: Patient identifier
        ems_unit_id: EMS unit identifier
        
    Returns:
        EmsFastExamEvent: Complete FAST exam with findings and timestamps
        
    Use Case:
        Simulates the FAST exam that would be performed by EMS and would
        trigger the stream processor to generate an AI prediction.
    """
    return generate_random_fast_exam_event(
        case_id=case_id,
        patient_id=patient_id,
        ems_unit_id=ems_unit_id,
    )


def pick_capacity_snapshot() -> List[HospitalCapacityEvent]:
    """
    Get a current snapshot of hospital capacity for all configured hospitals.
    
    This function generates capacity events for all hospitals in the system,
    representing their current state, capabilities, and availability. This
    snapshot is used by the AI routing algorithm to make destination recommendations.
    
    Returns:
        List[HospitalCapacityEvent]: Capacity snapshots for all hospitals
        
    Use Case:
        Simulates the real-time hospital capacity data that would be consumed
        by the stream processor to inform routing decisions.
    """
    return generate_hospital_capacity_events()


def build_ai_request_from_case(
    vitals_events: List[EmsVitalsEvent],
    fast_exam: EmsFastExamEvent,
    capacity_events: List[HospitalCapacityEvent],
) -> AiPredictionRequest:
    """
    Build an AI prediction request (feature vector) from case data.
    
    This function performs feature engineering by combining data from multiple
    sources (vitals, FAST exam, hospital capacity) into a single feature vector
    that can be sent to the AI prediction service.
    
    Feature Engineering:
        - Uses the latest vitals event as the "current" state
        - Calculates minutes since symptom onset from FAST exam timestamps
        - Maps FAST findings to boolean/categorical features
        - Incorporates hospital capacity and routing context
        - Hardcodes travel times and distances (simplified for demo)
    
    Medical Context:
        The feature vector includes:
        - Clinical features: Vitals, FAST findings, demographics
        - Time features: Minutes since onset (critical for treatment windows)
        - Routing context: Hospital distances, travel times, door-to-needle estimates
    
    Args:
        vitals_events: Sequence of vitals events (uses latest as current state)
        fast_exam: FAST stroke exam results
        capacity_events: Current hospital capacity snapshots
        
    Returns:
        AiPredictionRequest: Complete feature vector ready for AI prediction
        
    Note:
        For this demo, travel times and distances are hardcoded. In production,
        these would be calculated from GPS coordinates using routing APIs.
    """

    if not vitals_events:
        raise ValueError("No vitals events provided")

    latest_vitals = vitals_events[-1]

    # Compute minutes since onset (if known)
    now_iso = latest_vitals.event_ts
    minutes_since_onset = _minutes_between(fast_exam.symptom_onset_ts, now_iso)
    minutes_since_lkw = _minutes_between(fast_exam.last_known_well_ts, now_iso)

    # Map FAST enum-ish strings to booleans
    face_droop_present = fast_exam.face_droop == "PRESENT"
    arm_weakness_any = fast_exam.arm_weakness in ("LEFT", "RIGHT", "BILATERAL")
    speech_abnormal_any = fast_exam.speech_difficulty in ("DYSARTHRIA", "APHASIA_SUSPECTED")

    # For the demo, we will:
    # - Assume we have one primary center and one comprehensive center from capacity
    primary = next((c for c in capacity_events if c.stroke_center_level == "PRIMARY"), None)
    comp = next((c for c in capacity_events if c.stroke_center_level == "COMPREHENSIVE"), None)

    # Very simple, hardcoded approximations for travel times (for demo purposes)
    estimated_travel_min_to_primary = 8
    estimated_travel_min_to_comprehensive = 15

    primary_extra_dtn = primary.estimated_additional_door_to_needle_minutes if primary else None
    comp_extra_dtn = comp.estimated_additional_door_to_needle_minutes if comp else None

    # For now, we skip real distance calculation and just set approximate distances
    distance_km_to_primary = 5.0
    distance_km_to_comprehensive = 12.0

    # Age/sex are not in the vitals schema yet; we simulate them here
    # (In a fuller version, this would come from a separate demographic stream.)
    age_years = 68
    sex = "FEMALE"

    return AiPredictionRequest(
        case_id=latest_vitals.case_id,
        patient_id=latest_vitals.patient_id,
        ems_unit_id=latest_vitals.ems_unit_id,
        age_years=age_years,
        sex=sex,
        heart_rate_bpm=latest_vitals.heart_rate_bpm,
        systolic_bp_mmHg=latest_vitals.systolic_bp_mmHg,
        diastolic_bp_mmHg=latest_vitals.diastolic_bp_mmHg,
        respiratory_rate_bpm=latest_vitals.respiratory_rate_bpm,
        spo2_pct=latest_vitals.spo2_pct,
        gcs_total=latest_vitals.gcs_total,
        blood_glucose_mg_dL=latest_vitals.blood_glucose_mg_dL,
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


def print_case_summary(
    vitals_events: List[EmsVitalsEvent],
    fast_exam: EmsFastExamEvent,
    capacity_events: List[HospitalCapacityEvent],
    prediction: AiPredictionResponse,
) -> None:
    """
    Print a human-readable summary of the simulated case and AI recommendation.
    
    This function formats and displays all the key information about the case,
    including vitals, FAST exam findings, hospital capacity, and AI predictions.
    It provides a comprehensive view of how NeuroPulse processes a stroke case.
    
    Output Sections:
        - Case identification: Case ID, patient ID, EMS unit
        - Latest vitals: Current physiological measurements
        - FAST exam: Neurological assessment findings
        - Hospital capacity: Current state of all hospitals
        - AI prediction: Stroke/LVO probabilities and risk category
        - Recommended destination: Hospital routing recommendation
        - Time window assessment: Treatment eligibility
        - Risk factors: Key clinical findings
        - AI explanations: Natural language summaries and recommendations
    
    Args:
        vitals_events: Sequence of vitals events
        fast_exam: FAST stroke exam results
        capacity_events: Hospital capacity snapshots
        prediction: AI prediction response with all recommendations
        
    Use Case:
        Called at the end of the demo to display the complete case summary
        and AI recommendations in a readable format.
    """
    latest_vitals = vitals_events[-1]

    print("=" * 80)
    print("NeuroPulse - Case Orchestrator Demo")
    print("=" * 80)
    print(f"Case ID:    {latest_vitals.case_id}")
    print(f"Patient ID: {latest_vitals.patient_id}")
    print(f"EMS Unit:   {latest_vitals.ems_unit_id}")
    print()

    print("Latest Vitals:")
    print(f"  HR:        {latest_vitals.heart_rate_bpm} bpm")
    print(f"  BP:        {latest_vitals.systolic_bp_mmHg}/{latest_vitals.diastolic_bp_mmHg} mmHg")
    print(f"  RR:        {latest_vitals.respiratory_rate_bpm} breaths/min")
    print(f"  SpO2:      {latest_vitals.spo2_pct}%")
    print(f"  GCS:       {latest_vitals.gcs_total}")
    print(f"  Glucose:   {latest_vitals.blood_glucose_mg_dL} mg/dL")
    print()

    print("FAST Exam:")
    print(f"  Face droop:       {fast_exam.face_droop}")
    print(f"  Arm weakness:     {fast_exam.arm_weakness}")
    print(f"  Speech difficulty:{fast_exam.speech_difficulty}")
    print(f"  FAST score:       {fast_exam.fast_score}")
    print(f"  Symptom onset:    {fast_exam.symptom_onset_ts}")
    print(f"  Last known well:  {fast_exam.last_known_well_ts}")
    print(f"  EMS suspected stroke: {fast_exam.ems_suspected_stroke}")
    print()

    print("Hospital Capacity Snapshot (summary):")
    for hosp in capacity_events:
        print(
            f"  - {hosp.hospital_name} "
            f"({hosp.stroke_center_level}), "
            f"ED crowding: {hosp.ed_crowding_score}, "
            f"accepting: {hosp.accepting_acute_stroke_now}, "
            f"extra D2N: {hosp.estimated_additional_door_to_needle_minutes} min"
        )
    print()

    print("AI Prediction:")
    print(f"  Stroke probability: {prediction.stroke_probability:.0%}")
    print(f"  LVO probability:    {prediction.lvo_probability:.0%}")
    print(f"  Risk category:      {prediction.risk_category}")
    print()

    print("Recommended Destination:")
    print(f"  Hospital ID:        {prediction.recommended_destination_hospital_id}")
    print(f"  Type:               {prediction.recommended_destination_type}")
    print(f"  Travel time (min):  {prediction.estimated_travel_min_to_recommended}")
    print(
        f"  Extra door-to-needle (min): "
        f"{prediction.estimated_additional_door_to_needle_min_at_recommended}"
    )
    print()

    print("Time Window Assessment:")
    print(f"  {prediction.time_window_assessment}")
    print()

    print("Top Risk Factors:")
    if prediction.top_risk_factors:
        for f in prediction.top_risk_factors:
            print(f"  - {f}")
    else:
        print("  (none listed)")
    print()

    print("AI Explanation Summary:")
    print(f"  {prediction.llm_explanation_summary}")
    print()

    print("AI Recommended Actions:")
    print(prediction.llm_recommended_actions or "(none)")
    print("=" * 80)


def main() -> None:
    """
    Main entry point for the case orchestrator demo.
    
    This function orchestrates the complete NeuroPulse pipeline for a single
    stroke case, demonstrating the end-to-end flow from data generation through
    AI prediction to clinical recommendations.
    
    Pipeline Flow:
        1. Generate case identifiers
        2. Simulate EMS vitals events (continuous monitoring)
        3. Simulate FAST exam (triggers prediction)
        4. Get hospital capacity snapshot (for routing)
        5. Build feature vector from all data
        6. Call AI prediction service (stub)
        7. Print comprehensive case summary
    
    Use Case:
        Run this script to see a complete example of how NeuroPulse processes
        a stroke case and generates AI-driven recommendations. Useful for:
        - Understanding the system architecture
        - Testing prediction logic
        - Demonstrating capabilities to stakeholders
        - Development and debugging
    """
    case_id = f"CASE-{uuid.uuid4().hex[:8].upper()}"
    patient_id = f"PAT-{uuid.uuid4().hex[:8].upper()}"
    ems_unit_id = "UNIT-DEMO-01"

    vitals_events = simulate_case_vitals(
        case_id=case_id,
        patient_id=patient_id,
        ems_unit_id=ems_unit_id,
        num_events=5,
    )

    fast_exam = simulate_case_fast_exam(
        case_id=case_id,
        patient_id=patient_id,
        ems_unit_id=ems_unit_id,
    )

    capacity_events = pick_capacity_snapshot()

    ai_request = build_ai_request_from_case(
        vitals_events=vitals_events,
        fast_exam=fast_exam,
        capacity_events=capacity_events,
    )

    prediction = stub_predict(ai_request)

    print_case_summary(
        vitals_events=vitals_events,
        fast_exam=fast_exam,
        capacity_events=capacity_events,
        prediction=prediction,
    )


if __name__ == "__main__":
    main()
