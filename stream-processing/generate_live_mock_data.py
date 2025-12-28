"""
NeuroPulse – Live Mock Data Generator

This utility script continuously generates **synthetic stroke prediction events** with
changing vital signs and sends them to the NeuroPulse API. It is designed for:

- **Local development** – exercise the FastAPI server and dashboard without Kafka
  or the full stream processor.
- **Demo scenarios** – simulate several EMS stroke cases that evolve over time,
  so the dashboard shows live updates to stroke risk, vitals, and routing.

Project / AI context:
- In production, AI predictions are produced by the stream processor and Vertex AI,
  then written to the `ai.prediction.output` Kafka topic and consumed by
  `api_server.py`.
- This script **bypasses Kafka entirely** and instead calls the
  `POST /api/mock/predictions` endpoint on the API server to inject synthetic
  `AiPredictionOutput`-like payloads directly into the in‑memory stores.
- The generated payloads include:
  - Stroke / LVO probabilities and a derived risk category.
  - Recommended destination hospital (primary vs comprehensive stroke center).
  - Time‑since‑onset and treatment window assessment.
  - A Gemini‑style natural language explanation and recommended actions.
  - A `current_vitals` block so the dashboard can visualize how the patient’s
    condition appears to change over time.

All data produced here is **synthetic** and for **demo / testing only** – it is not
a real medical device and must not be used for clinical decisions.
"""

import json
import requests
import time
from datetime import datetime, timezone, timedelta
import random
import uuid
import threading

API_BASE_URL = "http://localhost:8000"


def generate_mock_prediction_with_vitals(
    case_id: str = None,
    patient_id: str = None,
    base_stroke_prob: float = None,
    base_lvo_prob: float = None,
    minutes_since_onset: int = None,
    iteration: int = 0,
    case_data: dict = None
) -> dict:
    """
    Generate a single synthetic AI prediction event with evolving vitals.

    This mirrors the structure of `AiPredictionOutput` used elsewhere in the
    system so that the FastAPI server and dashboard can treat these events the
    same way as real model output coming from Kafka.

    Args:
        case_id: Stable case identifier (e.g., one EMS incident). If not
            provided, a new synthetic ID is generated.
        patient_id: Stable synthetic patient identifier. Generated if omitted.
        base_stroke_prob: Baseline stroke probability used as a starting point
            for this case.
        base_lvo_prob: Baseline large‑vessel occlusion probability.
        minutes_since_onset: Time since symptom onset; incremented on each
            iteration to simulate a progressing case.
        iteration: Zero‑based iteration counter used to drive small trends in
            vitals over time.

    Returns:
        A dictionary compatible with the API server’s mock prediction schema,
        including probabilities, risk categorization, routing, explanation text,
        and a `current_vitals` section.
    """
    case_id = case_id or f"CASE-{uuid.uuid4().hex[:8].upper()}"
    patient_id = patient_id or f"PAT-{uuid.uuid4().hex[:8].upper()}"
    
    # Base probabilities (if not provided, generate random).
    # These represent what Vertex AI might output for stroke / LVO risk.
    if base_stroke_prob is None:
        base_stroke_prob = random.uniform(0.3, 0.95)
    if base_lvo_prob is None:
        base_lvo_prob = random.uniform(0.1, 0.7)
    
    # Use initial vitals if provided (from scenario), otherwise generate random
    if case_data and case_data.get('initial_hr'):
        base_hr = case_data['initial_hr']
    else:
        base_hr = 75 + random.randint(-10, 10)
    
    if case_data and case_data.get('initial_bp'):
        base_systolic = case_data['initial_bp']
    else:
        base_systolic = 140 + random.randint(-20, 30)
    
    if case_data and case_data.get('initial_spo2'):
        base_spo2 = case_data['initial_spo2']
    else:
        base_spo2 = 96 + random.randint(-3, 2)
    
    if case_data and case_data.get('initial_gcs'):
        base_gcs = case_data['initial_gcs']
    else:
        base_gcs = 15
    
    # Simulate vitals changing over time (slight variations).
    # Heart rate may trend upward with physiological stress.
    # Vary vitals more noticeably for real-time monitoring (updates every second)
    # Heart rate: varies ±3-8 bpm per second (realistic for continuous monitoring)
    hr_variation = int(5 * (iteration % 10) / 10)  # Slight increase over iterations
    heart_rate = base_hr + hr_variation + random.randint(-4, 6)  # More variation for visibility
    
    # Blood pressure: Only update every 10-15 minutes (realistic for manual cuff readings)
    # Use stored BP values if not enough time has passed
    import time
    current_time = time.time()
    last_bp_time = case_data.get("last_bp_reading_time") if case_data else None
    last_bp = case_data.get("last_bp_values") if case_data else None
    
    bp_interval_min = 10  # Minimum 10 minutes between BP readings
    bp_interval_max = 15  # Maximum 15 minutes between BP readings
    
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
        # Generate new BP reading (realistic variation for manual cuff measurement)
        bp_variation = random.randint(-8, 8)
        systolic = max(100, min(200, base_systolic + bp_variation))
        if case_data:
            case_data["last_bp_reading_time"] = current_time
            case_data["last_bp_values"] = systolic
    else:
        # Reuse last BP values (realistic - BP doesn't change every second)
        if last_bp:
            systolic = last_bp
        else:
            # Fallback if no previous reading
            systolic = base_systolic
            if case_data:
                case_data["last_bp_reading_time"] = current_time
                case_data["last_bp_values"] = systolic
    
    # SpO2: varies ±1-2% per second (realistic for pulse oximetry)
    spo2 = base_spo2 + random.randint(-2, 2)  # Slightly more variation
    
    # GCS may decrease for more severe / worsening cases.
    if base_stroke_prob > 0.7:
        gcs = max(12, base_gcs - int(iteration / 8))  # Gradually decrease
    else:
        gcs = base_gcs
    
    # Adjust probabilities based on vitals changes.
    stroke_prob = base_stroke_prob
    lvo_prob = base_lvo_prob
    
    # If vitals worsen, nudge up the model probabilities to create a
    # clinically-plausible relationship between vitals and risk.
    if heart_rate > 100 or systolic > 180 or spo2 < 94:
        stroke_prob = min(1.0, stroke_prob + 0.05)
        lvo_prob = min(1.0, lvo_prob + 0.03)
    
    stroke_prob = round(stroke_prob, 2)
    lvo_prob = round(lvo_prob, 2)
    
    # Determine risk category
    if stroke_prob >= 0.8 or lvo_prob >= 0.6:
        risk_category = "CRITICAL"
    elif stroke_prob >= 0.6 or lvo_prob >= 0.4:
        risk_category = "HIGH"
    elif stroke_prob >= 0.3:
        risk_category = "MODERATE"
    else:
        risk_category = "LOW"
    
    # Minutes since onset (increment over time) to reflect a ticking treatment
    # window. With 1-second updates, increment by ~0.017 minutes (1 second) per update
    if minutes_since_onset is None:
        minutes_since_onset = random.randint(15, 60)
    else:
        # Increment by 1 second worth of time (0.017 minutes) for realistic progression
        minutes_since_onset = round(minutes_since_onset + (1.0 / 60.0), 2)
    
    # Hospital recommendation: choose between primary vs comprehensive stroke
    # center to exercise dashboard routing visualizations.
    hospitals = [
        ("HOSP-PRIMARY-01", "PRIMARY_CENTER", 8, 20),
        ("HOSP-COMP-01", "COMPREHENSIVE_CENTER", 15, 10),
    ]
    hospital_id, hospital_type, travel_min, extra_dtn = random.choice(hospitals)
    
    # Time window assessment provides high‑level treatment window context.
    if minutes_since_onset <= 270:
        time_window = "Within typical IV tPA window."
    elif minutes_since_onset <= 360:
        time_window = "Within extended window for some EVT candidates."
    else:
        time_window = "Outside standard IV tPA window; EVT may still be considered."
    
    # Risk factors (include current vitals) to drive UI explanations.
    risk_factors = []
    if random.random() > 0.3:
        risk_factors.append("Face droop")
    if random.random() > 0.3:
        risk_factors.append("Arm weakness")
    if random.random() > 0.3:
        risk_factors.append("Speech abnormality")
    if gcs < 15:
        risk_factors.append(f"Reduced GCS ({gcs})")
    if systolic > 180:
        risk_factors.append(f"Elevated systolic BP ({systolic})")
    if heart_rate > 100:
        risk_factors.append(f"Elevated heart rate ({heart_rate} bpm)")
    
    if not risk_factors:
        risk_factors.append("Subtle findings with possible stroke symptoms")
    
    # Generate a short, LLM‑style explanation summarizing the AI’s reasoning,
    # referencing both probabilities and current vitals.
    onset_str = f"{minutes_since_onset} minutes" if minutes_since_onset < 60 else f"{minutes_since_onset // 60} hours"
    
    summary = (
        f"NeuroPulse estimates a {int(stroke_prob * 100)}% probability of acute ischemic stroke "
        f"and a {int(lvo_prob * 100)}% probability of large vessel occlusion. "
        f"Current vitals: HR {heart_rate} bpm, BP {systolic}/{systolic-40} mmHg, "
        f"SpO2 {spo2}%, GCS {gcs}. "
        f"Symptoms present for {onset_str}. "
        f"Risk category: {risk_category}. "
        f"Recommended: {hospital_type.lower().replace('_', ' ')} ({hospital_id})."
    )
    
    actions = [
        "- Maintain airway, breathing, and circulation; avoid hypotension.",
        f"- Monitor vitals closely (current HR: {heart_rate} bpm, BP: {systolic}/{systolic-40} mmHg).",
        "- Keep SpO₂ ≥ 94% and manage blood glucose if severely abnormal.",
        "- Perform ongoing neurological reassessment during transport.",
    ]
    
    if hospital_type == "COMPREHENSIVE_CENTER":
        actions.append("- Pre-notify the comprehensive stroke center about suspected LVO for possible EVT.")
    else:
        actions.append("- Pre-notify the primary stroke center for rapid imaging and thrombolysis evaluation.")
    
    if minutes_since_onset > 270:
        actions.append("- Given longer time from onset, emphasize rapid imaging and consider EVT eligibility.")
    
    return {
        "prediction_id": f"PRED-{uuid.uuid4().hex[:10].upper()}",
        "case_id": case_id,
        "patient_id": patient_id,
        "prediction_ts": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "model_name": "vertex_ai_stroke_model",
        "model_version": "v1.0",
        "stroke_probability": stroke_prob,
        "lvo_probability": lvo_prob,
        "risk_category": risk_category,
        "recommended_destination_hospital_id": hospital_id,
        "recommended_destination_type": hospital_type,
        "estimated_travel_min_to_recommended": travel_min,
        "estimated_additional_door_to_needle_min_at_recommended": extra_dtn,
        "time_window_assessment": time_window,
        "top_risk_factors": risk_factors,
        "llm_explanation_summary": summary,
        "llm_recommended_actions": "\n".join(actions),
        "llm_model_name": "gemini-1.5-flash",
        "explanation_version": "v1",
        "minutes_since_symptom_onset": minutes_since_onset,
    # Attach current vitals to the payload so the dashboard can visualize
    # trends on each update.
        "current_vitals": {
            "heart_rate_bpm": heart_rate,
            "systolic_bp_mmHg": systolic,
            "diastolic_bp_mmHg": systolic - 40,
            "spo2_pct": spo2,
            "gcs_total": gcs,
            "ecg_rhythm": "normal" if heart_rate >= 60 and heart_rate <= 100 else ("sinus_tachycardia" if heart_rate > 100 else "sinus_bradycardia"),
        }
    }


def send_mock_prediction(prediction: dict) -> bool:
    """Send a mock prediction to the API server via POST endpoint."""
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/mock/predictions",
            json=prediction,
            headers={"Content-Type": "application/json"},
            timeout=10  # Increased timeout for high-frequency updates
        )
        if response.status_code != 200:
            print(f"[LIVE] API returned {response.status_code}: {response.text[:200]}")
            return False
        return True
    except requests.exceptions.Timeout:
        print(f"[LIVE] Request timeout - API server may be overloaded")
        return False
    except requests.exceptions.ConnectionError as e:
        print(f"[LIVE] Connection error: {e}")
        return False
    except requests.exceptions.RequestException as e:
        print(f"[LIVE] Request failed: {e}")
        return False
    except Exception as e:
        print(f"[LIVE] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False


class LiveDataGenerator:
    """Continuously generates and sends mock data with changing vitals."""
    
    # Predefined scenarios to showcase different use cases
    # Risk categories: CRITICAL (stroke>=0.8 OR lvo>=0.6), HIGH (stroke>=0.6 OR lvo>=0.4), MODERATE (stroke>=0.3), LOW (stroke<0.3)
    SCENARIOS = [
        {
            "name": "Critical LVO - Urgent",
            "description": "High LVO probability, early in window - CRITICAL risk",
            "base_stroke_prob": 0.9,
            "base_lvo_prob": 0.78,
            "minutes_since_onset": 80,
            "initial_hr": 95,
            "initial_bp": 180,
            "initial_spo2": 92,
            "initial_gcs": 12,
        },
        {
            "name": "High Risk - Severe Symptoms",
            "description": "High stroke risk with severe symptoms - HIGH risk",
            "base_stroke_prob": 0.75,
            "base_lvo_prob": 0.35,
            "minutes_since_onset": 120,
            "initial_hr": 88,
            "initial_bp": 170,
            "initial_spo2": 94,
            "initial_gcs": 13,
        },
        {
            "name": "Moderate Stroke - Optimal Window",
            "description": "Moderate stroke risk, well within tPA window - MODERATE risk",
            "base_stroke_prob": 0.55,
            "base_lvo_prob": 0.25,
            "minutes_since_onset": 155,
            "initial_hr": 82,
            "initial_bp": 150,
            "initial_spo2": 96,
            "initial_gcs": 14,
        },
        {
            "name": "Low Risk - Monitoring",
            "description": "Lower risk case requiring ongoing assessment - LOW risk",
            "base_stroke_prob": 0.28,
            "base_lvo_prob": 0.05,
            "minutes_since_onset": 125,
            "initial_hr": 75,
            "initial_bp": 130,
            "initial_spo2": 98,
            "initial_gcs": 15,
        },
        {
            "name": "High Risk - Time Critical",
            "description": "High stroke risk, approaching tPA window closure - HIGH risk",
            "base_stroke_prob": 0.65,
            "base_lvo_prob": 0.45,
            "minutes_since_onset": 275,
            "initial_hr": 90,
            "initial_bp": 165,
            "initial_spo2": 94,
            "initial_gcs": 13,
        },
        {
            "name": "Critical - Early High LVO",
            "description": "Early presentation with very high LVO probability - CRITICAL risk",
            "base_stroke_prob": 0.85,
            "base_lvo_prob": 0.75,
            "minutes_since_onset": 60,
            "initial_hr": 92,
            "initial_bp": 175,
            "initial_spo2": 93,
            "initial_gcs": 12,
        },
    ]
    
    def __init__(self, num_cases: int = 6, update_interval: float = 3.0):
        self.num_cases = min(num_cases, len(self.SCENARIOS))  # Use available scenarios
        self.update_interval = update_interval
        self.running = False
        self.cases = {}
        self.thread = None
    
    def start(self):
        """Start generating live data."""
        if self.running:
            return
        
        self.running = True
        # Initialize cases with predefined scenarios
        for i in range(self.num_cases):
            scenario = self.SCENARIOS[i % len(self.SCENARIOS)]
            # Create unique case IDs - use scenario index and case number
            scenario_idx = i % len(self.SCENARIOS)
            case_id = f"CASE-SCEN-{scenario_idx+1:02d}-{i+1:02d}"
            patient_id = f"PAT-{i+1:03d}"
            self.cases[case_id] = {
                "patient_id": patient_id,
                "scenario_name": scenario["name"],
                "base_stroke_prob": scenario["base_stroke_prob"],
                "base_lvo_prob": scenario["base_lvo_prob"],
                "minutes_since_onset": scenario["minutes_since_onset"],
                "initial_hr": scenario["initial_hr"],
                "initial_bp": scenario["initial_bp"],
                "initial_spo2": scenario["initial_spo2"],
                "initial_gcs": scenario["initial_gcs"],
                "iteration": 0,
                "last_bp_reading_time": None,  # Track when BP was last measured
                "last_bp_values": None,  # Store last BP values to reuse
            }
        
        self.thread = threading.Thread(target=self._generate_loop, daemon=True)
        self.thread.start()
        print(f"✓ Started live data generator for {self.num_cases} diverse scenarios")
        print(f"  Updates every {self.update_interval} seconds")
        print(f"  Scenarios: {', '.join([s['name'] for s in self.SCENARIOS[:self.num_cases]])}")
    
    def stop(self):
        """Stop generating live data."""
        self.running = False
        if self.thread:
            self.thread.join(timeout=1)
        print("✓ Stopped live data generator")
    
    def _generate_loop(self):
        """Main loop that generates and sends updates."""
        while self.running:
            for case_id, case_data in self.cases.items():
                try:
                    prediction = generate_mock_prediction_with_vitals(
                        case_id=case_id,
                        patient_id=case_data["patient_id"],
                        base_stroke_prob=case_data["base_stroke_prob"],
                        base_lvo_prob=case_data["base_lvo_prob"],
                        minutes_since_onset=case_data["minutes_since_onset"],
                        iteration=case_data["iteration"],
                        case_data=case_data  # Pass full case data for initial vitals
                    )
                    
                    if send_mock_prediction(prediction):
                        case_data["iteration"] += 1
                        case_data["minutes_since_onset"] = prediction["minutes_since_symptom_onset"]
                        # Only print success for first few iterations to reduce console spam
                        if case_data["iteration"] <= 3 or case_data["iteration"] % 10 == 0:
                            print(f"[LIVE] Updated {case_id} - Stroke: {int(prediction['stroke_probability']*100)}%, "
                                  f"HR: {prediction['current_vitals']['heart_rate_bpm']} bpm")
                    else:
                        # Error already printed by send_mock_prediction
                        pass
                except Exception as e:
                    print(f"[LIVE] Error generating prediction for {case_id}: {e}")
                    import traceback
                    traceback.print_exc()
            
            time.sleep(self.update_interval)


def main():
    """Main entry point."""
    print("="*60)
    print("NeuroPulse Live Mock Data Generator")
    print("="*60)
    print("\nThis will continuously generate mock data with changing vitals.")
    print("Press Ctrl+C to stop.\n")
    
    # Check if API is running
    try:
        response = requests.get(f"{API_BASE_URL}/api/health", timeout=2)
        if response.status_code != 200:
            print("✗ API server returned an error")
            return
        print("✓ API server is running")
    except requests.exceptions.RequestException:
        print("✗ Cannot connect to API server. Make sure it's running on port 8000")
        return
    
    # Start live generator with diverse scenarios
    # Update every 1 second for real-time vitals monitoring (like real medical devices)
    generator = LiveDataGenerator(num_cases=6, update_interval=1.0)
    generator.start()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\nStopping live data generator...")
        generator.stop()
        print("Done.")


if __name__ == "__main__":
    main()

