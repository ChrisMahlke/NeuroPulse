# NeuroPulse Demo Storyboard

This document outlines the 2–3 minute demo flow for NeuroPulse, tying
together Confluent streams, Google Cloud AI, and the NeuroPulse dashboard.

---

## 1. Opening (10–20 seconds) — Problem + Vision

- Brief problem statement:
  - "In acute ischemic stroke, every minute of delay kills brain tissue."
  - Prehospital routing is often based on static protocols, not real-time data.
- Vision:
  - NeuroPulse uses **data in motion** plus **AI** to help EMS route patients
    to the right stroke center in real-time.

---

## 2. Data in Motion (30–45 seconds) — Confluent + Synthetic Streams

- Show terminal or simple script:
  - `ems_vitals_simulator` and `ems_fast_exam_simulator` running.
  - Explain:
    - Synthetic EMS vitals and FAST exam streams → `ems.vitals.raw`, `ems.fast.exam`.
    - Hospital capacity simulator → `hospital.capacity`.
- Explain:
  - These streams model an EMS environment:
    - Continuous vitals
    - Structured stroke exam
    - Real-time hospital status

---

## 3. Stream Processing + AI (45–60 seconds) — From Events to Intelligence

- Explain conceptually (with simple diagram or slide):
  - Confluent streams → feature engineering → `ai.prediction.input`.
  - Vertex AI model → stroke/LVO risk.
  - Gemini (LLM) → explanations and recommended actions.
- Tie it to code:
  - Mention `AiPredictionRequest` / `AiPredictionResponse` in `prediction_service_stub.py`.
  - Mention the `case_orchestrator_demo` as a local end-to-end prototype.

---

## 4. Case Walkthrough (45–60 seconds) — One Synthetic Patient

- Use the orchestrator output as narrative:

  - Run: `python3 -m ai_models.neuro_pulse_ai.case_orchestrator_demo`.
  - Highlight:
    - Latest vitals (e.g., high BP, mild hypoxia).
    - FAST exam: face droop, arm weakness, speech difficulty.
    - Hospital capacity snapshot: primary vs comprehensive center, ED crowding, extra door-to-needle.
  - Show AI output:
    - Stroke probability, LVO probability, risk category.
    - Recommended hospital and rationale.
    - AI-generated summary + action plan.

- Connect this to the dashboard design:
  - "This is exactly what the dashboard will show in real-time."

---

## 5. Dashboard (30–45 seconds) — Visualizing the Decision

- Show a simple web UI (MVP) with:

  - Left: active case list (including the synthetic case).
  - Center: timeline + vitals for the selected case.
  - Right: AI insights:
    - Risk scores
    - Recommended hospital
    - Explanation & actions

- Emphasize:
  - Real-time updates from Confluent streams.
  - AI-driven recommendations, not just static rules.

---

## 6. Closing (15–20 seconds) — Impact + Extensibility

- Impact:
  - Faster, smarter stroke routing could save brain and lives.
  - Works with synthetic data now, but architecture is ready for real feeds.
- Extensibility:
  - Same pattern can be applied to other time-critical conditions:
    - STEMI
    - Trauma
    - Sepsis

---
