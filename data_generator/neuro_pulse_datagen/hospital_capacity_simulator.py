"""
NeuroPulse - Hospital Capacity Simulator

This module generates synthetic hospital capacity and capability events for
stroke-receiving hospitals. These events are conceptually aligned with the
`hospital.capacity` Avro schema and provide real-time information about
hospital availability, capabilities, and expected processing delays.

Architecture Context:
    Hospital capacity data is critical for the AI routing algorithm, which
    recommends the optimal hospital destination based on:
    - Stroke center level (primary vs comprehensive)
    - Current capacity and crowding
    - Expected door-to-needle time (processing delay)
    - Ability to perform specific treatments (IV tPA, EVT)
    
    The stream processor uses this data to make routing recommendations that
    balance travel time, treatment capabilities, and hospital availability.

Medical Context:
    Stroke Center Levels:
        - PRIMARY: Can administer IV tPA (thrombolysis) within 4.5 hours of onset
        - COMPREHENSIVE: Can perform EVT (endovascular thrombectomy) for LVO
        - THROMBECTOMY_CAPABLE: Can perform EVT but may not have full comprehensive services
    
    Capacity Metrics:
        - ED crowding score: 0-100, higher = more crowded
        - Current stroke cases: Number of stroke patients currently in ED
        - Accepting acute stroke: Whether hospital is currently accepting new stroke cases
        - Door-to-needle time: Expected delay from arrival to treatment initiation
    
    Treatment Capabilities:
        - CT availability: Required for stroke imaging
        - CTA availability: Required for LVO detection
        - Mechanical thrombectomy: Required for LVO treatment (EVT)

Note: All data generated is synthetic and for demonstration purposes only.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Optional, List
import random


def _iso_utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


@dataclass
class HospitalCapacityEvent:
    """
    Data model for hospital capacity and capability information.
    
    This event represents a snapshot of a hospital's current state, including
    its stroke treatment capabilities, current capacity, and expected processing
    delays. This information is used by the AI routing algorithm to recommend
    optimal hospital destinations.
    
    Medical Context:
        - Stroke center level determines which treatments are available
        - ED crowding affects door-to-needle time (processing delay)
        - CT/CTA availability is required for stroke diagnosis and LVO detection
        - Mechanical thrombectomy capability is required for LVO treatment
    
    Attributes:
        hospital_id: Unique identifier for the hospital
        hospital_name: Human-readable hospital name
        updated_ts: ISO timestamp when capacity was last updated
        latitude: Hospital latitude (for distance calculations)
        longitude: Hospital longitude (for distance calculations)
        stroke_center_level: "PRIMARY", "COMPREHENSIVE", or "THROMBECTOMY_CAPABLE"
        has_ct_available: Whether CT scanner is currently available
        has_cta_available: Whether CTA (CT angiography) is currently available
        can_perform_mechanical_thrombectomy: Whether hospital can perform EVT
        ed_crowding_score: ED crowding score (0-100, higher = more crowded)
        current_stroke_cases_in_ed: Number of stroke patients currently in ED
        accepting_acute_stroke_now: Whether hospital is accepting new stroke cases
        estimated_additional_door_to_needle_minutes: Expected processing delay
        notes: Optional notes about capacity status or restrictions
    """
    hospital_id: str
    hospital_name: str
    updated_ts: str

    latitude: float
    longitude: float

    stroke_center_level: str
    has_ct_available: bool
    has_cta_available: bool
    can_perform_mechanical_thrombectomy: bool

    ed_crowding_score: Optional[int]
    current_stroke_cases_in_ed: Optional[int]

    accepting_acute_stroke_now: bool
    estimated_additional_door_to_needle_minutes: Optional[int]

    notes: Optional[str]


# Simple static config of hospitals for the demo
_HOSPITALS_CONFIG = [
    {
        "hospital_id": "HOSP-PRIMARY-01",
        "hospital_name": "Valley Primary Stroke Center",
        "latitude": 37.7800,
        "longitude": -122.4200,
        "stroke_center_level": "PRIMARY",
        "can_perform_mechanical_thrombectomy": False,
    },
    {
        "hospital_id": "HOSP-COMP-01",
        "hospital_name": "Metro Comprehensive Stroke Center",
        "latitude": 37.7650,
        "longitude": -122.4000,
        "stroke_center_level": "COMPREHENSIVE",
        "can_perform_mechanical_thrombectomy": True,
    },
    {
        "hospital_id": "HOSP-THROMB-01",
        "hospital_name": "Regional Thrombectomy-Capable Center",
        "latitude": 37.8000,
        "longitude": -122.4500,
        "stroke_center_level": "THROMBECTOMY_CAPABLE",
        "can_perform_mechanical_thrombectomy": True,
    },
]


def _random_crowding() -> tuple[Optional[int], Optional[int], bool, Optional[int], Optional[str]]:
    """
    Generate synthetic ED crowding metrics and related capacity information.
    
    This function simulates realistic ED capacity scenarios:
    - Low crowding: Fast processing, minimal delays
    - Moderate crowding: Some delays, still accepting patients
    - High crowding: Significant delays, may divert patients
    
    Medical Context:
        ED crowding directly affects door-to-needle time:
        - Low crowding (<40): Minimal delay (0-10 minutes)
        - Moderate crowding (40-70): Moderate delay (10-20 minutes)
        - High crowding (>70): Significant delay (20-40 minutes), may divert
        
        Crowding is a key factor in routing decisions, as longer delays
        can push patients outside treatment windows.
    
    Returns:
        tuple: (ed_crowding_score, current_stroke_cases, accepting, extra_dtn_minutes, notes)
        
    Note:
        The function correlates crowding with delays and acceptance status
        to create realistic capacity scenarios.
    """
    ed_crowding_score = random.randint(10, 95)  # 0–100, but we keep it 10–95
    current_stroke_cases = random.randint(0, 5)

    # More crowded EDs are more likely to have longer delays
    if ed_crowding_score < 40:
        accepting = True
        extra_dtntime = random.choice([0, 5, 10])
    elif ed_crowding_score < 70:
        accepting = True
        extra_dtntime = random.choice([10, 15, 20])
    else:
        # Very crowded: might still accept, but with big delays
        accepting = random.random() > 0.2  # 80% chance still accepting
        extra_dtntime = random.choice([20, 30, 40])

    notes = None
    if not accepting:
        notes = "Temporarily diverting acute stroke due to ED crowding."
    elif ed_crowding_score > 80:
        notes = "High ED load; expect longer door-to-needle times."

    return ed_crowding_score, current_stroke_cases, accepting, extra_dtntime, notes


def generate_hospital_capacity_events() -> List[HospitalCapacityEvent]:
    """
    Generate capacity snapshots for all configured hospitals.
    
    This function creates a current capacity snapshot for each hospital in
    the system, including their capabilities, current load, and availability.
    These snapshots are used by the AI routing algorithm to make destination
    recommendations.
    
    Architecture Context:
        The generated events represent the current state of all hospitals
        in the system. The stream processor uses this data to:
        - Determine which hospitals can perform specific treatments
        - Calculate expected door-to-needle times
        - Make routing recommendations based on capacity and capabilities
    
    Returns:
        List[HospitalCapacityEvent]: Capacity snapshots for all configured hospitals
        
    Note:
        Currently uses a static list of hospitals defined in _HOSPITALS_CONFIG.
        In production, this would query a real-time hospital capacity system.
    """

    events: List[HospitalCapacityEvent] = []
    now_ts = _iso_utc_now()

    for cfg in _HOSPITALS_CONFIG:
        ed_score, stroke_cases, accepting, extra_dtntime, notes = _random_crowding()

        # Randomly simulate CT/CTA downtime
        has_ct = random.random() > 0.05  # 95% up
        has_cta = has_ct and (random.random() > 0.1)

        evt = HospitalCapacityEvent(
            hospital_id=cfg["hospital_id"],
            hospital_name=cfg["hospital_name"],
            updated_ts=now_ts,
            latitude=cfg["latitude"],
            longitude=cfg["longitude"],
            stroke_center_level=cfg["stroke_center_level"],
            has_ct_available=has_ct,
            has_cta_available=has_cta,
            can_perform_mechanical_thrombectomy=cfg["can_perform_mechanical_thrombectomy"],
            ed_crowding_score=ed_score,
            current_stroke_cases_in_ed=stroke_cases,
            accepting_acute_stroke_now=accepting,
            estimated_additional_door_to_needle_minutes=extra_dtntime,
            notes=notes,
        )
        events.append(evt)

    return events


def demo_print_hospital_capacity() -> None:
    """
    Generate and print hospital capacity snapshots to stdout.
    
    This function is useful for quick testing and development. It generates
    capacity events for all configured hospitals and prints them as dictionaries.
    
    Use Case:
        Called when running the module directly for local testing and development.
    """
    events = generate_hospital_capacity_events()
    for evt in events:
        print(asdict(evt))


if __name__ == "__main__":
    demo_print_hospital_capacity()

