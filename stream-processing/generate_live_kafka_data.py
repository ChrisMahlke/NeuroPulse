"""
NeuroPulse – Live Kafka Data Generator (Production/Hackathon)

This script continuously generates synthetic EMS data and sends it to Confluent Cloud Kafka topics.
This is the PRODUCTION/HACKATHON version that uses the full streaming pipeline.

Unlike `generate_live_mock_data.py` (which bypasses Kafka), this script:
- Sends vitals to `ems.vitals.raw` topic continuously
- Sends FAST exams to `ems.fast.exam` topic
- Sends hospital capacity to `hospital.capacity` topic
- Goes through the full stream processor → AI → Kafka pipeline
- Shows real Kafka metrics in the dashboard

Use this for:
- ✅ Hackathon demonstrations
- ✅ Production deployments
- ✅ Confluent Cloud demos
- ✅ Showing real streaming architecture

Do NOT use for:
- ❌ Quick local testing (use generate_live_mock_data.py instead)
"""

import time
import random
import uuid
from datetime import datetime, timezone
from typing import Dict, Any
import threading

import sys
from pathlib import Path
import os

# Add parent directory to path for imports
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from dataclasses import asdict
from datetime import datetime, timezone
from data_generator.neuro_pulse_datagen.ems_vitals_simulator import (
    EmsVitalsEvent,
)
from data_generator.neuro_pulse_datagen.ems_fast_exam_simulator import (
    generate_random_fast_exam_event,
)
from data_generator.neuro_pulse_datagen.hospital_capacity_simulator import (
    generate_hospital_capacity_events,
)
from data_generator.neuro_pulse_datagen.kafka_producer_helper import (
    create_kafka_producer,
    load_kafka_config,
    KafkaConfig,
    delivery_report,
)
import json


class LiveKafkaDataGenerator:
    """
    Continuously generates and sends EMS data to Kafka topics.
    
    This simulates real-time EMS data streams that would come from ambulances
    and hospital systems. Data flows through the full NeuroPulse pipeline:
    Kafka → Stream Processor → AI → Dashboard
    """
    
    # Predefined patient scenarios for diverse demo cases
    # Risk categories based on: CRITICAL (stroke>=0.8 OR lvo>=0.6), HIGH (stroke>=0.6 OR lvo>=0.4), MODERATE (stroke>=0.3), LOW (stroke<0.3)
    SCENARIOS = [
        {
            "name": "Critical LVO - Urgent",
            "base_stroke_prob": 0.9,
            "base_lvo_prob": 0.78,
            "minutes_since_onset": 80,
            "initial_hr": 95,
            "initial_bp": (180, 110),
            "initial_spo2": 92,
            "initial_gcs": 12,
            "fast_face_droop": True,
            "fast_arm_weakness": True,
            "fast_speech_abnormal": True,
            # Risk: CRITICAL (stroke >= 0.8)
        },
        {
            "name": "High Risk - Severe Symptoms",
            "base_stroke_prob": 0.75,
            "base_lvo_prob": 0.35,
            "minutes_since_onset": 120,
            "initial_hr": 88,
            "initial_bp": (170, 105),
            "initial_spo2": 94,
            "initial_gcs": 13,
            "fast_face_droop": True,
            "fast_arm_weakness": True,
            "fast_speech_abnormal": True,
            # Risk: HIGH (stroke >= 0.6, but < 0.8 and lvo < 0.6)
        },
        {
            "name": "Moderate Stroke - Optimal Window",
            "base_stroke_prob": 0.55,
            "base_lvo_prob": 0.25,
            "minutes_since_onset": 155,
            "initial_hr": 82,
            "initial_bp": (150, 95),
            "initial_spo2": 96,
            "initial_gcs": 14,
            "fast_face_droop": True,
            "fast_arm_weakness": False,
            "fast_speech_abnormal": False,
            # Risk: MODERATE (0.3 <= stroke < 0.6)
        },
        {
            "name": "Low Risk - Monitoring",
            "base_stroke_prob": 0.28,
            "base_lvo_prob": 0.05,
            "minutes_since_onset": 125,
            "initial_hr": 75,
            "initial_bp": (130, 85),
            "initial_spo2": 98,
            "initial_gcs": 15,
            "fast_face_droop": False,
            "fast_arm_weakness": False,
            "fast_speech_abnormal": False,
            # Risk: LOW (stroke < 0.3)
        },
        {
            "name": "High Risk - Time Critical",
            "base_stroke_prob": 0.65,
            "base_lvo_prob": 0.45,
            "minutes_since_onset": 275,
            "initial_hr": 90,
            "initial_bp": (165, 100),
            "initial_spo2": 94,
            "initial_gcs": 13,
            "fast_face_droop": True,
            "fast_arm_weakness": True,
            "fast_speech_abnormal": True,
            # Risk: HIGH (stroke >= 0.6, lvo >= 0.4)
        },
        {
            "name": "Critical - Early High LVO",
            "base_stroke_prob": 0.85,
            "base_lvo_prob": 0.75,
            "minutes_since_onset": 60,
            "initial_hr": 92,
            "initial_bp": (175, 108),
            "initial_spo2": 93,
            "initial_gcs": 12,
            "fast_face_droop": True,
            "fast_arm_weakness": True,
            "fast_speech_abnormal": True,
            # Risk: CRITICAL (stroke >= 0.8 AND lvo >= 0.6)
        },
    ]
    
    def __init__(self, num_cases: int = 6, update_interval: float = 1.0):
        """
        Initialize the live Kafka data generator.
        
        Args:
            num_cases: Number of patient cases to simulate (max 6 scenarios)
            update_interval: Seconds between vitals updates (1.0 = every second)
        """
        self.num_cases = min(num_cases, len(self.SCENARIOS))
        self.update_interval = update_interval
        self.running = False
        self.cases: Dict[str, Dict[str, Any]] = {}
        self.thread = None
        self.producer = None
        self.sequence_numbers: Dict[str, int] = {}
    
    def start(self):
        """Start generating and sending live data to Kafka."""
        if self.running:
            return
        
        # Create Kafka producer
        # Try to load config from multiple possible locations
        try:
            # First try: data_generator/confluent_config.ini (relative to project root)
            data_gen_config = project_root / "data_generator" / "confluent_config.ini"
            # Second try: stream-processing/confluent_config.ini (where script is)
            stream_config = Path(__file__).parent / "confluent_config.ini"
            
            if data_gen_config.exists():
                config_path = str(data_gen_config)
            elif stream_config.exists():
                config_path = str(stream_config)
            else:
                raise FileNotFoundError(
                    f"Kafka config not found. Expected one of:\n"
                    f"  - {data_gen_config}\n"
                    f"  - {stream_config}"
                )
            
            # Load config and create producer
            kafka_config = load_kafka_config(config_path)
            # Override client_id for this generator
            from dataclasses import replace
            kafka_config = replace(kafka_config, client_id="NeuroPulseLiveKafkaGenerator")
            
            # Create producer with the loaded config
            self.producer = create_kafka_producer(kafka_config)
            print("✓ Connected to Confluent Cloud Kafka")
        except Exception as e:
            print(f"✗ Failed to connect to Kafka: {e}")
            print("  Make sure confluent_config.ini is configured correctly")
            print(f"  Looked for config in:")
            print(f"    - {project_root / 'data_generator' / 'confluent_config.ini'}")
            print(f"    - {Path(__file__).parent / 'confluent_config.ini'}")
            return
        
        self.running = True
        
        # Initialize cases with predefined scenarios
        for i in range(self.num_cases):
            scenario = self.SCENARIOS[i % len(self.SCENARIOS)]
            scenario_idx = i % len(self.SCENARIOS)
            case_id = f"CASE-SCEN-{scenario_idx+1:02d}-{i+1:02d}"
            patient_id = f"PAT-{i+1:03d}"
            
            self.cases[case_id] = {
                "patient_id": patient_id,
                "scenario_name": scenario["name"],
                "scenario": scenario,
                "ems_unit_id": f"UNIT-{i+1:02d}",
                "iteration": 0,
                "fast_exam_sent": False,  # Track if FAST exam has been sent
                "last_fast_exam_time": None,  # Track when FAST exam was last sent
            }
            self.sequence_numbers[case_id] = 0
        
        # Send initial FAST exams and hospital capacity
        self._send_initial_data()
        
        # Start continuous vitals generation
        self.thread = threading.Thread(target=self._generate_loop, daemon=True)
        self.thread.start()
        
        print(f"✓ Started live Kafka data generator for {self.num_cases} diverse scenarios")
        print(f"  Updates every {self.update_interval} seconds")
        print(f"  Topics: ems.vitals.raw, ems.fast.exam, hospital.capacity")
        print(f"  Scenarios: {', '.join([s['name'] for s in self.SCENARIOS[:self.num_cases]])}")
    
    def _send_initial_data(self):
        """Send initial FAST exams and hospital capacity data."""
        # Send FAST exam for each case (triggers prediction)
        # Note: generate_random_fast_exam_event doesn't accept face_droop/arm_weakness parameters
        # It generates random findings. For production, you'd want to customize this.
        current_time = time.time()
        for case_id, case_data in self.cases.items():
            fast_exam = generate_random_fast_exam_event(
                case_id=case_id,
                patient_id=case_data["patient_id"],
                ems_unit_id=case_data["ems_unit_id"],
            )
            payload = json.dumps(asdict(fast_exam)).encode("utf-8")
            self.producer.produce(
                topic="ems.fast.exam",
                value=payload,
                callback=delivery_report,
            )
            case_data["fast_exam_sent"] = True
            case_data["last_fast_exam_time"] = current_time
        
        # Send hospital capacity events (one per hospital, shared across all cases)
        capacity_events = generate_hospital_capacity_events()
        for capacity in capacity_events:
            payload = json.dumps(asdict(capacity)).encode("utf-8")
            self.producer.produce(
                topic="hospital.capacity",
                value=payload,
                callback=delivery_report,
            )
        
        self.producer.flush()
        print(f"✓ Sent initial FAST exams and hospital capacity to Kafka")
    
    def _generate_loop(self):
        """Main loop that continuously generates and sends vitals to Kafka.
        
        Note: Blood pressure is updated every 10-15 minutes (realistic for manual cuff readings),
        while other vitals (HR, SpO2, GCS) update more frequently to simulate continuous monitoring.
        
        FAST exams are re-sent every 30 seconds to ensure stream processor can catch them
        even if it starts after the initial data is sent.
        """
        while self.running:
            current_time = time.time()
            bp_interval_min = 10  # Minimum 10 minutes between BP readings
            bp_interval_max = 15  # Maximum 15 minutes between BP readings
            fast_exam_resend_interval = 30  # Re-send FAST exams every 30 seconds (ensures stream processor catches them)
            
            for case_id, case_data in self.cases.items():
                try:
                    scenario = case_data["scenario"]
                    seq = self.sequence_numbers[case_id]
                    
                    # Generate vitals with variation around baseline
                    base_hr = scenario["initial_hr"]
                    base_bp = scenario["initial_bp"]
                    base_spo2 = scenario["initial_spo2"]
                    base_gcs = scenario["initial_gcs"]
                    
                    # Add variation to simulate real-time changes
                    hr_variation = random.randint(-6, 6)
                    heart_rate = max(60, min(120, base_hr + hr_variation))
                    
                    spo2 = max(85, min(100, base_spo2 + random.randint(-2, 2)))
                    gcs = max(3, min(15, base_gcs + random.randint(-1, 1)))
                    
                    # Blood pressure: Only update every 10-15 minutes (realistic for manual cuff readings)
                    # Use stored BP values if not enough time has passed
                    last_bp_time = case_data.get("last_bp_reading_time")
                    last_bp = case_data.get("last_bp_values")
                    
                    should_update_bp = False
                    if last_bp_time is None:
                        # First reading - always take BP
                        should_update_bp = True
                    else:
                        elapsed_minutes = (current_time - last_bp_time) / 60.0
                        # Randomize interval between 10-15 minutes for realism
                        required_interval = random.uniform(bp_interval_min, bp_interval_max)
                        if elapsed_minutes >= required_interval:
                            should_update_bp = True
                    
                    if should_update_bp:
                        # Generate new BP reading
                        bp_variation_systolic = random.randint(-10, 10)
                        bp_variation_diastolic = random.randint(-6, 6)
                        systolic = max(100, min(200, base_bp[0] + bp_variation_systolic))
                        diastolic = max(60, min(120, base_bp[1] + bp_variation_diastolic))
                        case_data["last_bp_reading_time"] = current_time
                        case_data["last_bp_values"] = (systolic, diastolic)
                    else:
                        # Reuse last BP values (realistic - BP doesn't change every second)
                        if last_bp:
                            systolic, diastolic = last_bp
                        else:
                            # Fallback if no previous reading
                            systolic = base_bp[0]
                            diastolic = base_bp[1]
                            case_data["last_bp_reading_time"] = current_time
                            case_data["last_bp_values"] = (systolic, diastolic)
                    
                    # Determine ECG rhythm based on heart rate
                    if heart_rate > 100:
                        ecg_rhythm = random.choice(['sinus_tachycardia', 'sinus_tachycardia', 'normal', 'atrial_fibrillation'])
                    elif heart_rate < 60:
                        ecg_rhythm = random.choice(['sinus_bradycardia', 'sinus_bradycardia', 'normal'])
                    else:
                        ecg_rhythm = random.choice(['normal', 'normal', 'normal', 'atrial_fibrillation'])
                    
                    # Generate vitals event with our custom values
                    # We create the event directly since generate_random_ems_vitals_event
                    # doesn't accept vitals as parameters
                    event_ts = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
                    vitals = EmsVitalsEvent(
                        case_id=case_id,
                        patient_id=case_data["patient_id"],
                        ems_unit_id=case_data["ems_unit_id"],
                        event_ts=event_ts,
                        sequence_number=seq,
                        heart_rate_bpm=heart_rate,
                        systolic_bp_mmHg=systolic,
                        diastolic_bp_mmHg=diastolic,
                        respiratory_rate_bpm=random.randint(12, 20),  # Normal range
                        spo2_pct=spo2,
                        temperature_c=round(random.uniform(36.0, 38.5), 1),  # Normal range
                        gcs_total=gcs,
                        blood_glucose_mg_dL=random.randint(70, 220),  # Normal to elevated
                        ecg_rhythm=ecg_rhythm,
                        is_artifact_suspected=False,
                        source_device="DEMO_MONITOR_V1",
                    )
                    
                    # Send to Kafka
                    payload = json.dumps(asdict(vitals)).encode("utf-8")
                    self.producer.produce(
                        topic="ems.vitals.raw",
                        value=payload,
                        callback=delivery_report,
                    )
                    
                    self.sequence_numbers[case_id] = seq + 1
                    case_data["iteration"] += 1
                    
                    # Log periodically to reduce console spam
                    bp_status = "NEW" if should_update_bp else "REUSED"
                    if case_data["iteration"] <= 3 or case_data["iteration"] % 10 == 0:
                        print(f"[KAFKA] Sent vitals for {case_id} - HR: {heart_rate} bpm, BP: {systolic}/{diastolic} ({bp_status})")
                    
                    # Re-send FAST exam periodically to ensure stream processor catches it
                    # This handles the case where stream processor starts after initial FAST exams are sent
                    last_fast_time = case_data.get("last_fast_exam_time")
                    should_resend_fast = False
                    if last_fast_time is None:
                        # First time - send FAST exam
                        should_resend_fast = True
                    else:
                        elapsed_seconds = current_time - last_fast_time
                        if elapsed_seconds >= fast_exam_resend_interval:
                            should_resend_fast = True
                    
                    if should_resend_fast:
                        try:
                            fast_exam = generate_random_fast_exam_event(
                                case_id=case_id,
                                patient_id=case_data["patient_id"],
                                ems_unit_id=case_data["ems_unit_id"],
                            )
                            payload = json.dumps(asdict(fast_exam)).encode("utf-8")
                            self.producer.produce(
                                topic="ems.fast.exam",
                                value=payload,
                                callback=delivery_report,
                            )
                            case_data["last_fast_exam_time"] = current_time
                            if not case_data.get("fast_exam_sent"):
                                print(f"[KAFKA] Sent FAST exam for {case_id}")
                                case_data["fast_exam_sent"] = True
                        except Exception as e:
                            print(f"[KAFKA] Error sending FAST exam for {case_id}: {e}")
                    
                except Exception as e:
                    print(f"[KAFKA] Error generating vitals for {case_id}: {e}")
                    import traceback
                    traceback.print_exc()
            
            # Flush producer periodically to ensure delivery
            self.producer.flush()
            time.sleep(self.update_interval)
    
    def stop(self):
        """Stop generating live data."""
        self.running = False
        if self.thread:
            self.thread.join(timeout=2)
        if self.producer:
            self.producer.flush()
            self.producer = None
        print("✓ Stopped live Kafka data generator")


def main():
    """Main entry point."""
    print("=" * 60)
    print("NeuroPulse Live Kafka Data Generator (Production/Hackathon)")
    print("=" * 60)
    print("\nThis continuously sends data to Confluent Cloud Kafka topics.")
    print("Data flows through: Kafka → Stream Processor → AI → Dashboard")
    print("Press Ctrl+C to stop.\n")
    
    # Start live generator
    generator = LiveKafkaDataGenerator(num_cases=6, update_interval=1.0)
    generator.start()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\nStopping live Kafka data generator...")
        generator.stop()
        print("Done.")


if __name__ == "__main__":
    main()

