"""
NeuroPulse - EMS FAST Exam Simulator

Generates synthetic FAST (Face, Arms, Speech, Time) stroke exam events for
suspected stroke cases. These events are conceptually aligned with the
`ems.fast.exam` Avro schema and are critical triggers for the AI prediction pipeline.

Architecture Context:
    The FAST exam is a key neurological assessment performed by EMS that triggers
    the AI prediction pipeline. When a FAST exam event is received, the stream
    processor combines it with vitals and hospital capacity data to generate
    stroke risk predictions.
    
    This simulator generates realistic FAST exam findings that simulate different
    stroke presentations, from subtle findings to clear stroke signs.

Medical Context:
    The FAST exam is a validated stroke screening tool used by EMS:
    - Face: Check for facial droop/asymmetry
    - Arms: Check for arm weakness (unilateral or bilateral)
    - Speech: Check for speech difficulty (dysarthria or aphasia)
    - Time: Document symptom onset time (critical for treatment windows)
    
    FAST Score:
        - 0: No positive findings
        - 1-3: Number of positive findings (higher = more likely stroke)
        - FAST score ≥2 is associated with higher stroke/LVO probability
    
    Symptom Onset Time:
        - Critical for treatment eligibility (IV tPA typically within 4.5 hours)
        - Sometimes unknown (wake-up stroke or unwitnessed onset)
        - Last known well time: When patient was last seen normal

Two Modes:
    - Print mode: Outputs events to stdout for quick testing
    - Kafka mode: Sends JSON-serialized events to Confluent Cloud Kafka topics
    
    Kafka configuration is loaded via `kafka_producer_helper` using a local
    INI file (see `confluent_config.example.ini`).

Note: All data generated is synthetic and for demonstration purposes only.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid
import random
import json
import argparse

from .kafka_producer_helper import create_kafka_producer, delivery_report


def _iso_utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


@dataclass
class EmsFastExamEvent:
    """
    Data model for EMS FAST stroke exam results.
    
    The FAST exam is a critical neurological assessment that triggers the AI
    prediction pipeline. It documents key stroke signs and symptom timing,
    which are essential features for stroke risk prediction.
    
    Medical Context:
        - Face droop: Facial asymmetry suggests stroke (especially unilateral)
        - Arm weakness: Unilateral weakness is a strong stroke indicator
        - Speech difficulty: Dysarthria (slurred speech) or aphasia (language
          impairment) suggests stroke
        - FAST score: Count of positive findings (0-3), higher = more likely stroke
        - Symptom onset: Critical for treatment window eligibility
        - Last known well: When patient was last seen normal (helps establish onset)
    
    Attributes:
        case_id: Unique identifier for the stroke case
        patient_id: Patient identifier (anonymized)
        ems_unit_id: Ambulance/EMS unit identifier
        exam_ts: ISO timestamp when FAST exam was performed
        face_droop: "ABSENT", "PRESENT", or "UNKNOWN"
        arm_weakness: "ABSENT", "LEFT", "RIGHT", "BILATERAL", or "UNKNOWN"
        speech_difficulty: "ABSENT", "DYSARTHRIA", "APHASIA_SUSPECTED", or "UNKNOWN"
        symptom_onset_ts: ISO timestamp of symptom onset (may be None if unknown)
        last_known_well_ts: ISO timestamp when patient was last seen normal
        prestroke_disability: Modified Rankin Scale (0-6) before stroke
        suspected_stroke_side: "LEFT" or "RIGHT" based on arm weakness (contralateral)
        fast_score: Count of positive findings (0-3), None if no findings
        ems_suspected_stroke: Whether EMS suspects stroke based on exam
        notes: Optional clinical notes (medications, history, etc.)
    """
    case_id: str
    patient_id: str
    ems_unit_id: str
    exam_ts: str

    face_droop: str
    arm_weakness: str
    speech_difficulty: str

    symptom_onset_ts: Optional[str]
    last_known_well_ts: Optional[str]

    prestroke_disability: Optional[int]
    suspected_stroke_side: Optional[str]
    fast_score: Optional[int]

    ems_suspected_stroke: bool
    notes: Optional[str]


def _random_onset_times() -> tuple[Optional[str], Optional[str]]:
    """
    Generate synthetic symptom onset and last-known-well timestamps.
    
    This function simulates the real-world scenario where symptom onset time
    may or may not be known. Unknown onset times are common in:
    - Wake-up strokes (patient wakes with symptoms)
    - Unwitnessed strokes (no one saw when symptoms started)
    
    Medical Context:
        Symptom onset time is critical for treatment eligibility:
        - IV tPA: Typically only given within 4.5 hours (270 minutes) of onset
        - EVT: May be considered up to 6-24 hours depending on imaging
        - Unknown onset: Requires imaging-based decision making
    
    Returns:
        tuple: (onset_timestamp, last_known_well_timestamp)
               Either or both may be None if unknown
        
    Note:
        - 20% chance of unknown onset (simulates wake-up/unwitnessed strokes)
        - Otherwise, onset is simulated 10-120 minutes before current time
        - Last known well is typically same as onset or slightly earlier
    """
    now = datetime.now(timezone.utc)

    # 20% chance we don't know either time (wake-up stroke / unknown)
    if random.random() < 0.2:
        return None, None

    # Otherwise, simulate onset 10–120 minutes before now
    onset_delta_min = random.randint(10, 120)
    onset_ts = (now - timedelta(minutes=onset_delta_min)).isoformat().replace("+00:00", "Z")

    # Last known well is either same as onset or a bit earlier
    if random.random() < 0.5:
        lkw_delta_min = onset_delta_min + random.randint(0, 30)
    else:
        lkw_delta_min = onset_delta_min

    last_known_well_ts = (now - timedelta(minutes=lkw_delta_min)).isoformat().replace("+00:00", "Z")

    return onset_ts, last_known_well_ts


def _random_fast_components() -> tuple[str, str, str, Optional[int], Optional[str]]:
    """
    Generate random FAST exam components with clinically realistic distributions.
    
    This function simulates the three main components of the FAST exam (Face,
    Arms, Speech) and derives the FAST score and suspected stroke side.
    
    Medical Context:
        The distributions are weighted to reflect real-world patterns:
        - Most patients: No findings (60% for face/speech, 50% for arms)
        - Some patients: Positive findings indicating stroke
        - Unilateral arm weakness: Strong indicator of stroke (contralateral side)
        - FAST score: Count of positive findings (0-3)
    
    Returns:
        tuple: (face_droop, arm_weakness, speech_difficulty, fast_score, suspected_side)
        
    Note:
        The suspected stroke side is derived from arm weakness:
        - Left arm weakness → Right brain stroke (contralateral)
        - Right arm weakness → Left brain stroke (contralateral)
    """
    # Face droop: mostly absent, but sometimes present
    face = random.choices(
        population=["ABSENT", "PRESENT", "UNKNOWN"],
        weights=[0.6, 0.3, 0.1],
        k=1,
    )[0]

    # Arm weakness: none, left, right, bilateral
    arm = random.choices(
        population=["ABSENT", "LEFT", "RIGHT", "BILATERAL", "UNKNOWN"],
        weights=[0.5, 0.2, 0.2, 0.05, 0.05],
        k=1,
    )[0]

    # Speech difficulty
    speech = random.choices(
        population=["ABSENT", "DYSARTHRIA", "APHASIA_SUSPECTED", "UNKNOWN"],
        weights=[0.6, 0.2, 0.15, 0.05],
        k=1,
    )[0]

    # Simple FAST score: count the number of "positive" components
    positives = 0
    if face == "PRESENT":
        positives += 1
    if arm in ("LEFT", "RIGHT", "BILATERAL"):
        positives += 1
    if speech in ("DYSARTHRIA", "APHASIA_SUSPECTED"):
        positives += 1
    fast_score = positives if positives > 0 else None

    # Simple suspected side heuristic (very rough, purely for demo):
    suspected_side: Optional[str]
    if arm == "LEFT":
        suspected_side = "RIGHT"
    elif arm == "RIGHT":
        suspected_side = "LEFT"
    else:
        suspected_side = None

    return face, arm, speech, fast_score, suspected_side


def generate_random_fast_exam_event(
    case_id: Optional[str] = None,
    patient_id: Optional[str] = None,
    ems_unit_id: Optional[str] = None,
) -> EmsFastExamEvent:
    """
    Generate a single synthetic FAST exam event for a suspected stroke patient.
    
    This function creates a complete FAST exam event with all components,
    timestamps, and derived values. The exam findings are randomized using
    clinically realistic distributions to simulate different stroke presentations.
    
    Medical Context:
        The generated exam simulates various stroke scenarios:
        - Clear stroke signs: Multiple positive FAST findings
        - Subtle findings: Few or no positive findings
        - Unknown onset: Simulates wake-up or unwitnessed strokes
        - Pre-stroke disability: Modified Rankin Scale (0-6) before stroke
    
    Args:
        case_id: Optional case identifier (generated if not provided)
        patient_id: Optional patient identifier (generated if not provided)
        ems_unit_id: Optional EMS unit identifier (generated if not provided)
        
    Returns:
        EmsFastExamEvent: Complete FAST exam with all findings and timestamps
        
    Use Case:
        Called by the simulator to generate events that trigger the AI prediction
        pipeline in the stream processor.
    """

    case_id = case_id or f"CASE-{uuid.uuid4().hex[:8].upper()}"
    patient_id = patient_id or f"PAT-{uuid.uuid4().hex[:8].upper()}"
    ems_unit_id = ems_unit_id or f"UNIT-{random.randint(1, 10):02d}"

    exam_ts = _iso_utc_now()
    onset_ts, last_known_well_ts = _random_onset_times()
    face, arm, speech, fast_score, suspected_side = _random_fast_components()

    prestroke_disability = random.choice([0, 0, 0, 1, 2, 3])  # mostly independent

    suspected_stroke = fast_score is not None or random.random() < 0.1

    notes_options = [
        None,
        "On anticoagulant therapy.",
        "Possible seizure at onset.",
        "Witnessed sudden onset.",
        "History of prior stroke.",
    ]
    notes = random.choice(notes_options)

    return EmsFastExamEvent(
        case_id=case_id,
        patient_id=patient_id,
        ems_unit_id=ems_unit_id,
        exam_ts=exam_ts,
        face_droop=face,
        arm_weakness=arm,
        speech_difficulty=speech,
        symptom_onset_ts=onset_ts,
        last_known_well_ts=last_known_well_ts,
        prestroke_disability=prestroke_disability,
        suspected_stroke_side=suspected_side,
        fast_score=fast_score,
        ems_suspected_stroke=suspected_stroke,
        notes=notes,
    )


def demo_print_fast_exams(num_events: int = 3) -> None:
    """
    Generate and print synthetic FAST exam events to stdout.
    
    This function is useful for quick testing and development without requiring
    Kafka setup. It generates FAST exam events for a single case and prints
    them as dictionaries.
    
    Args:
        num_events: Number of FAST exam events to generate
        
    Use Case:
        Called when running in "print" mode for local testing and development.
    """
    case_id = f"CASE-{uuid.uuid4().hex[:8].upper()}"
    patient_id = f"PAT-{uuid.uuid4().hex[:8].upper()}"
    ems_unit_id = "UNIT-FAST-01"

    for _ in range(num_events):
        evt = generate_random_fast_exam_event(
            case_id=case_id,
            patient_id=patient_id,
            ems_unit_id=ems_unit_id,
        )
        print(asdict(evt))


def send_fast_exams_to_kafka(topic: str, num_events: int = 3) -> None:
    """
    Generate synthetic FAST exam events and send them to a Kafka topic.
    
    This function creates FAST exam events and publishes them to Confluent Cloud
    Kafka. These events are critical triggers for the AI prediction pipeline,
    as the stream processor uses FAST exam data to generate stroke risk predictions.
    
    Architecture Context:
        FAST exam events published here are consumed by:
        - Stream processor: Joins with vitals and hospital capacity
        - Feature engineering: FAST findings are key features for AI models
        - AI prediction: FAST score and findings strongly influence stroke/LVO probability
    
    Args:
        topic: Kafka topic name (typically "ems.fast.exam")
        num_events: Number of FAST exam events to generate and send
        
    Note:
        - Requires Confluent Cloud config in `confluent_config.ini`
        - Currently uses JSON serialization; Avro + Schema Registry can be added later
        - Flushes producer to ensure all messages are delivered before returning
    """
    producer = create_kafka_producer()

    case_id = f"CASE-{uuid.uuid4().hex[:8].upper()}"
    patient_id = f"PAT-{uuid.uuid4().hex[:8].upper()}"
    ems_unit_id = "UNIT-FAST-01"

    for _ in range(num_events):
        evt = generate_random_fast_exam_event(
            case_id=case_id,
            patient_id=patient_id,
            ems_unit_id=ems_unit_id,
        )
        payload = json.dumps(asdict(evt)).encode("utf-8")
        producer.produce(
            topic=topic,
            value=payload,
            callback=delivery_report,
        )

    producer.flush()


def main() -> None:
    """
    Command-line interface entry point for the EMS FAST exam simulator.
    
    This function parses command-line arguments and runs the simulator in
    either print mode (for testing) or Kafka mode (for feeding the pipeline).
    
    Examples:
        # Just print 3 FAST exam events (default)
        python -m data_generator.neuro_pulse_datagen.ems_fast_exam_simulator

        # Print 10 events
        python -m data_generator.neuro_pulse_datagen.ems_fast_exam_simulator --num-events 10

        # Send 10 events to Kafka topic 'ems.fast.exam'
        python -m data_generator.neuro_pulse_datagen.ems_fast_exam_simulator --mode kafka --topic ems.fast.exam --num-events 10
    
    Use Cases:
        - Development: Use print mode to test event generation
        - Integration: Use Kafka mode to feed data into the stream processing pipeline
        - Demo: Generate synthetic FAST exams for demonstrations
    """
    parser = argparse.ArgumentParser(description="NeuroPulse EMS FAST Exam Simulator")
    parser.add_argument(
        "--mode",
        choices=["print", "kafka"],
        default="print",
        help="Output mode: print to stdout or send to Kafka.",
    )
    parser.add_argument(
        "--topic",
        type=str,
        default="ems.fast.exam",
        help="Kafka topic name (used only when mode=kafka).",
    )
    parser.add_argument(
        "--num-events",
        type=int,
        default=3,
        help="Number of events to generate.",
    )
    args = parser.parse_args()

    if args.mode == "print":
        demo_print_fast_exams(num_events=args.num_events)
    else:
        print(f"[EMS FAST] Sending {args.num_events} FAST exam events to Kafka topic '{args.topic}'...")
        send_fast_exams_to_kafka(topic=args.topic, num_events=args.num_events)
        print("[EMS FAST] Done.")


if __name__ == "__main__":
    main()
