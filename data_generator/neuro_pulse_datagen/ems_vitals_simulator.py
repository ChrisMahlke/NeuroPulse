"""
NeuroPulse - EMS Vitals Simulator

Generates synthetic EMS (Emergency Medical Services) vital sign events that
simulate real-time physiological data from ambulances. These events are
conceptually aligned with the `ems.vitals.raw` Avro schema and feed into the
NeuroPulse stream processing pipeline.

Architecture Context:
    This simulator is part of the data generation layer that creates synthetic
    data for the NeuroPulse demonstration. It generates continuous vital signs
    that would normally come from medical monitoring equipment in ambulances:
    - Heart rate, blood pressure, respiratory rate
    - Oxygen saturation (SpO2)
    - Glasgow Coma Scale (GCS) - neurological assessment
    - Blood glucose
    - Temperature
    
    These vitals are consumed by the stream processor, which uses them as
    features for AI stroke prediction models.

Medical Context:
    - Vital signs are continuously monitored during ambulance transport
    - GCS (Glasgow Coma Scale) is a key neurological assessment tool (3-15 scale)
    - Abnormal vitals can indicate stroke severity or complications
    - Artifacts (measurement errors) are occasionally simulated for realism

Two Modes:
    - Print mode: Outputs events to stdout for quick testing and development
    - Kafka mode: Sends JSON-serialized events to Confluent Cloud Kafka topics
    
    Kafka configuration is loaded via `kafka_producer_helper` using a local
    INI file (see `confluent_config.example.ini`).

Note: All data generated is synthetic and for demonstration purposes only.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Optional
import uuid
import random
import json
import argparse

from .kafka_producer_helper import create_kafka_producer, delivery_report


@dataclass
class EmsVitalsEvent:
    """
    Data model for EMS vital sign events from ambulance monitoring equipment.
    
    This represents a single snapshot of physiological measurements taken during
    ambulance transport. Multiple events are generated over time to simulate
    continuous monitoring.
    
    Medical Context:
        - Heart rate: Normal range ~60-100 bpm, can be elevated in stroke
        - Blood pressure: Systolic/diastolic, elevated BP common in stroke
        - Respiratory rate: Normal ~12-20 breaths/min
        - SpO2: Oxygen saturation, should be ≥94% in stroke patients
        - GCS (Glasgow Coma Scale): Neurological assessment (3-15), lower = more severe
        - Blood glucose: Important for stroke management (hypo/hyperglycemia)
        - Temperature: Can indicate infection or other complications
    
    Attributes:
        case_id: Unique identifier for the stroke case
        patient_id: Patient identifier (anonymized)
        ems_unit_id: Ambulance/EMS unit identifier
        event_ts: ISO timestamp when vitals were measured
        sequence_number: Sequence number for ordering events in time
        heart_rate_bpm: Heart rate in beats per minute
        systolic_bp_mmHg: Systolic blood pressure in mmHg
        diastolic_bp_mmHg: Diastolic blood pressure in mmHg
        respiratory_rate_bpm: Respiratory rate in breaths per minute
        spo2_pct: Oxygen saturation percentage
        temperature_c: Body temperature in Celsius
        gcs_total: Glasgow Coma Scale total score (3-15)
        blood_glucose_mg_dL: Blood glucose in mg/dL
        is_artifact_suspected: Whether measurement artifact is suspected
        source_device: Identifier for the monitoring device
    """
    case_id: str
    patient_id: str
    ems_unit_id: str
    event_ts: str
    sequence_number: int

    heart_rate_bpm: Optional[int]
    systolic_bp_mmHg: Optional[int]
    diastolic_bp_mmHg: Optional[int]
    respiratory_rate_bpm: Optional[int]
    spo2_pct: Optional[int]
    temperature_c: Optional[float]

    gcs_total: Optional[int]
    blood_glucose_mg_dL: Optional[int]
    ecg_rhythm: Optional[str]  # ECG rhythm: 'normal', 'sinus_tachycardia', 'sinus_bradycardia', 'atrial_fibrillation', 'ventricular_tachycardia'

    is_artifact_suspected: bool
    source_device: Optional[str]


def _iso_utc_now() -> str:
    """
    Generate ISO 8601 formatted UTC timestamp string.
    
    Returns:
        str: ISO timestamp in format "YYYY-MM-DDTHH:MM:SSZ"
    """
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def generate_random_ems_vitals_event(
    case_id: Optional[str] = None,
    patient_id: Optional[str] = None,
    ems_unit_id: Optional[str] = None,
    sequence_number: int = 0,
) -> EmsVitalsEvent:
    """
    Generate a single synthetic EMS vitals event with clinically plausible values.
    
    This function simulates vital signs that would be measured by monitoring
    equipment in an ambulance. The values are randomized within normal-to-abnormal
    ranges to create realistic variation for demonstration purposes.
    
    Medical Context:
        The generated values are intentionally varied to simulate different
        patient presentations:
        - Normal vitals: Most common scenario
        - Abnormal vitals: Simulate stroke complications or severity
        - GCS variation: Most patients have normal GCS (15), but some have
          reduced consciousness (14, 13) indicating more severe stroke
        - Artifacts: Occasionally simulate measurement errors for realism
    
    Args:
        case_id: Optional case identifier (generated if not provided)
        patient_id: Optional patient identifier (generated if not provided)
        ems_unit_id: Optional EMS unit identifier (generated if not provided)
        sequence_number: Sequence number for ordering events in time
        
    Returns:
        EmsVitalsEvent: Synthetic vital signs event with randomized values
        
    Note:
        This is intentionally simple for demonstration. In production, you might
        want more sophisticated distributions that correlate vitals with stroke
        severity or simulate temporal trends.
    """
    case_id = case_id or f"CASE-{uuid.uuid4().hex[:8].upper()}"
    patient_id = patient_id or f"PAT-{uuid.uuid4().hex[:8].upper()}"
    ems_unit_id = ems_unit_id or f"UNIT-{random.randint(1, 10):02d}"

    # Generate vitals within clinically plausible ranges
    # These ranges include both normal and abnormal values to simulate variety
    heart_rate = random.randint(55, 120)  # Normal: 60-100, but can be elevated in stroke
    systolic = random.randint(90, 200)  # Normal: <120, but often elevated in stroke
    diastolic = random.randint(50, 110)  # Normal: <80
    rr = random.randint(10, 28)  # Normal: 12-20 breaths/min
    spo2 = random.randint(88, 100)  # Normal: ≥94%, but can be lower
    temp_c = round(random.uniform(36.0, 38.5), 1)  # Normal: ~37°C

    # GCS: Mostly normal (15), occasionally reduced (14, 13) for more severe cases
    # This simulates that most stroke patients maintain consciousness
    gcs_total = random.choice([15, 15, 15, 14, 13])  # mostly normal, sometimes mildly reduced
    blood_glucose = random.randint(70, 220)  # Normal: 70-100 mg/dL, can be elevated

    # ECG Rhythm: Determine based on heart rate and random chance
    # Most common: normal sinus rhythm
    # Elevated HR: sinus tachycardia
    # Low HR: sinus bradycardia
    # Occasionally: atrial fibrillation (common in stroke patients)
    # Rarely: ventricular tachycardia (serious arrhythmia)
    if heart_rate > 100:
        ecg_rhythm = random.choice(['sinus_tachycardia', 'sinus_tachycardia', 'normal', 'atrial_fibrillation'])
    elif heart_rate < 60:
        ecg_rhythm = random.choice(['sinus_bradycardia', 'sinus_bradycardia', 'normal'])
    else:
        ecg_rhythm = random.choice(['normal', 'normal', 'normal', 'normal', 'atrial_fibrillation', 'sinus_tachycardia'])
    
    # Very rarely: ventricular tachycardia (serious)
    if random.random() < 0.02:  # 2% chance
        ecg_rhythm = 'ventricular_tachycardia'

    # Simulate occasional measurement artifacts (5% chance)
    # Real monitoring equipment sometimes has errors
    is_artifact = random.random() < 0.05  # 5% chance of suspected artifact

    return EmsVitalsEvent(
        case_id=case_id,
        patient_id=patient_id,
        ems_unit_id=ems_unit_id,
        event_ts=_iso_utc_now(),
        sequence_number=sequence_number,
        heart_rate_bpm=heart_rate,
        systolic_bp_mmHg=systolic,
        diastolic_bp_mmHg=diastolic,
        respiratory_rate_bpm=rr,
        spo2_pct=spo2,
        temperature_c=temp_c,
        gcs_total=gcs_total,
        blood_glucose_mg_dL=blood_glucose,
        ecg_rhythm=ecg_rhythm,
        is_artifact_suspected=is_artifact,
        source_device="DEMO_MONITOR_V1",
    )


def demo_print_events(num_events: int = 5) -> None:
    """
    Generate and print synthetic EMS vitals events to stdout.
    
    This function is useful for quick testing and development without requiring
    Kafka setup. It generates a sequence of vitals events for a single case
    and prints them as dictionaries.
    
    Args:
        num_events: Number of vitals events to generate (simulates continuous monitoring)
        
    Use Case:
        Called when running in "print" mode for local testing and development.
    """
    case_id = f"CASE-{uuid.uuid4().hex[:8].upper()}"
    patient_id = f"PAT-{uuid.uuid4().hex[:8].upper()}"
    ems_unit_id = "UNIT-01"

    for seq in range(num_events):
        event = generate_random_ems_vitals_event(
            case_id=case_id,
            patient_id=patient_id,
            ems_unit_id=ems_unit_id,
            sequence_number=seq,
        )
        print(asdict(event))


def send_events_to_kafka(topic: str, num_events: int = 5) -> None:
    """
    Generate synthetic EMS vitals events and send them to a Kafka topic.
    
    This function creates a sequence of vitals events for a single case and
    publishes them to Confluent Cloud Kafka. The events are JSON-serialized
    and sent to the specified topic, where they will be consumed by the
    stream processor for AI prediction.
    
    Architecture Context:
        This is part of the data generation pipeline that feeds the NeuroPulse
        system. Events published here are consumed by:
        - Stream processor: Joins vitals with FAST exams and hospital capacity
        - Feature engineering: Extracts features for AI models
        - AI prediction: Uses vitals as input features
    
    Args:
        topic: Kafka topic name (typically "ems.vitals.raw")
        num_events: Number of vitals events to generate and send
        
    Note:
        - Requires Confluent Cloud config in `confluent_config.ini`
        - Currently uses JSON serialization; Avro + Schema Registry can be added later
        - Flushes producer to ensure all messages are delivered before returning
    """
    producer = create_kafka_producer()

    case_id = f"CASE-{uuid.uuid4().hex[:8].upper()}"
    patient_id = f"PAT-{uuid.uuid4().hex[:8].upper()}"
    ems_unit_id = "UNIT-01"

    for seq in range(num_events):
        event = generate_random_ems_vitals_event(
            case_id=case_id,
            patient_id=patient_id,
            ems_unit_id=ems_unit_id,
            sequence_number=seq,
        )
        payload = json.dumps(asdict(event)).encode("utf-8")
        producer.produce(
            topic=topic,
            value=payload,
            callback=delivery_report,
        )

    # Flush to ensure all messages are delivered before exiting
    producer.flush()


def main() -> None:
    """
    Command-line interface entry point for the EMS vitals simulator.
    
    This function parses command-line arguments and runs the simulator in
    either print mode (for testing) or Kafka mode (for feeding the pipeline).
    
    Examples:
        # Just print 5 events (default)
        python ems_vitals_simulator.py

        # Print 10 events
        python ems_vitals_simulator.py --num-events 10

        # Send 10 events to Kafka topic 'ems.vitals.raw'
        python ems_vitals_simulator.py --mode kafka --topic ems.vitals.raw --num-events 10
    
    Use Cases:
        - Development: Use print mode to test event generation
        - Integration: Use Kafka mode to feed data into the stream processing pipeline
        - Demo: Generate synthetic data for demonstrations
    """
    parser = argparse.ArgumentParser(description="NeuroPulse EMS Vitals Simulator")
    parser.add_argument(
        "--mode",
        choices=["print", "kafka"],
        default="print",
        help="Output mode: print to stdout or send to Kafka.",
    )
    parser.add_argument(
        "--topic",
        type=str,
        default="ems.vitals.raw",
        help="Kafka topic name (used only when mode=kafka).",
    )
    parser.add_argument(
        "--num-events",
        type=int,
        default=5,
        help="Number of events to generate.",
    )
    args = parser.parse_args()

    if args.mode == "print":
        demo_print_events(num_events=args.num_events)
    else:
        print(f"[EMS VITALS] Sending {args.num_events} events to Kafka topic '{args.topic}'...")
        send_events_to_kafka(topic=args.topic, num_events=args.num_events)
        print("[EMS VITALS] Done.")


if __name__ == "__main__":
    main()
