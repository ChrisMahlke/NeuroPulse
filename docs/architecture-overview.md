# NeuroPulse Architecture Overview

NeuroPulse is a real-time stroke triage and routing platform built on
**Confluent Cloud** and **Google Cloud**. It ingests synthetic EMS data,
enriches it with hospital capacity information, feeds it to AI models,
and surfaces real-time recommendations and explanations through a web
dashboard.

This document provides a high-level view of the main components and data
flows.

---

## 1. High-Level Goals

- Turn **data in motion** (EMS vitals, assessments, hospital status) into
  real-time, AI-driven stroke risk assessments and routing decisions.
- Demonstrate how **Confluent** (Kafka + stream processing) and
  **Google Cloud AI (Vertex AI + Gemini)** can be combined to solve a
  time-critical healthcare problem.
- Provide an **end-to-end reference**: from data generation → streaming →
  AI inference → dashboard visualization.

---

## 2. Core Components

NeuroPulse consists of the following major components:

1. **Synthetic Data Generators (EMS + Hospitals)**
2. **Streaming Ingestion (Confluent Cloud / Kafka)**
3. **Stream Processing & Feature Engineering**
4. **AI / ML Layer (Vertex AI + Gemini)**
5. **Storage & Analytics (BigQuery)**
6. **NeuroPulse Dashboard (Web UI on Google Cloud)**
7. **Observability & Monitoring (Future enhancement)**

---

## 3. Data Flows Overview

At a high level, the system processes these categories of data:

- **EMS Input Streams**

  - `ems.vitals.raw` – continuous vitals from the ambulance
  - `ems.fast.exam` – structured FAST stroke exam results
  - `ems.assessment.text` – EMS narrative text

- **Hospital State Streams**

  - `hospital.capacity` – real-time capacity & capability snapshots

- **AI Streams**
  - `ai.prediction.input` – feature vectors for AI models
  - `ai.prediction.output` – stroke/LVO risk predictions, routing recommendations, and explanations

Future streams (not required for MVP but planned):

- `hospital.workflow.events` – timeline milestones (CT started, CT completed, tPA given, etc.)

---

## 4. Component Details

### 4.1 Synthetic Data Generators

Located under `data_generator/`:

- **EMS Vitals Simulator**

  - Generates synthetic `EmsVitalsEvent` objects aligned with the `ems.vitals.raw` schema.
  - Can print events to stdout (for local testing) or publish JSON-serialized messages to Kafka.

- **EMS FAST Exam Simulator**

  - Generates structured FAST exam events aligned with `ems.fast.exam`.
  - Models face droop, arm weakness, speech difficulty, onset times, and notes.

- **Hospital Capacity Simulator**
  - Produces capacity snapshots for a small set of synthetic hospitals.
  - Includes location, stroke center type, CT/CTA availability, ED crowding, and door-to-needle delay estimates.

**Purpose:** Provide realistic, controllable data streams that behave like live telemetry without requiring real patient data.

---

### 4.2 Streaming Ingestion (Confluent Cloud / Kafka)

NeuroPulse uses **Confluent Cloud** as the managed Kafka backbone.

Expected topics:

- `ems.vitals.raw`
- `ems.fast.exam`
- `ems.assessment.text`
- `hospital.capacity`
- `ai.prediction.input`
- `ai.prediction.output`

**Producers:**

- Data generator modules act as Kafka producers, sending JSON messages initially.
- Later, Avro with Schema Registry can be introduced, using the schemas defined in `schemas/`.

**Benefits:**

- Decoupled producers and consumers.
- Replayable streams for demo and debugging.
- Realistic representation of how event-driven healthcare systems would operate.

---

### 4.3 Stream Processing & Feature Engineering

Stream processing implemented in Python (under `stream-processing/`):

Key responsibilities:

- **Windowing & aggregation**

  - Compute rolling vitals statistics over sliding windows.
  - Smooth noise and derive trends.

- **Joining streams**

  - Join EMS vitals + FAST exam + hospital capacity.
  - Assemble model-ready feature vectors for `ai.prediction.input`.

- **Routing context enrichment**
  - Attach estimated distances and travel times to primary vs comprehensive centers.
  - Incorporate door-to-needle delay estimates from `hospital.capacity`.

Output:

- `ai.prediction.input` – flattened feature vectors that Vertex AI can score.

---

### 4.4 AI / ML Layer (Vertex AI + Gemini)

This layer runs on Google Cloud and includes:

#### 4.4.1 Predictive Models (Vertex AI)

- **Stroke Probability Model**

  - Consumes `AiPredictionInput` feature vectors.
  - Outputs `stroke_probability` (0–1).

- **LVO (Large Vessel Occlusion) Probability Model**
  - Consumes similar features.
  - Outputs `lvo_probability` (0–1).

The models may be:

- Simple tabular models (e.g., boosted trees) for demonstration.
- Hosted on Vertex AI endpoints for real-time prediction.

#### 4.4.2 LLM Reasoning & Explanations (Gemini)

- Consumes:
  - Model outputs (probabilities, risk category)
  - Key feature values
  - High-level timing and hospital context
- Produces:
  - `llm_explanation_summary`
  - `llm_recommended_actions`

This output is written back to `ai.prediction.output` and drives the dashboard’s “AI Insights” panel.

---

### 4.5 Storage & Analytics (BigQuery)

Selected streams can be persisted to **BigQuery** for:

- Historical analysis of synthetic cases.
- Measuring simulated door-to-needle times and routing decisions.
- Powering secondary dashboards or metrics views.

Typical tables:

- `neuro_pulse_ems_vitals`
- `neuro_pulse_fast_exams`
- `neuro_pulse_ai_predictions`
- `neuro_pulse_hospital_capacity`

This layer is not strictly required for the MVP demo, but it anchors the “enterprise-ready” narrative.

---

### 4.6 NeuroPulse Dashboard (Web UI)

Located under `dashboard/` (to be implemented).

Responsibilities:

- Display **active cases** with risk categories and time since onset.
- Show a **timeline view** for the selected case.
- Present **live vitals** for the patient.
- Render AI outputs from `ai.prediction.output`, including:
  - Stroke/LVO probabilities
  - Recommended destination hospital
  - Rationale (e.g., EVT capability, less delay)
  - LLM-generated explanation and action plan
- Display key **hospital capacity** details and a simple map or visual representation.

The dashboard will be deployed on Google Cloud (e.g., Cloud Run) and may consume a lightweight API that reads from Kafka or a fast datastore.

---

### 4.7 Observability & Monitoring (Future Enhancement)

Although not part of the first MVP, NeuroPulse can be extended with:

- **Metrics and logs** from the data generators, stream processors, and AI services.
- Dashboards highlighting:
  - Event throughput
  - Latency from EMS event to AI prediction
  - Error rates in streaming or model calls

This strengthens the story of NeuroPulse as a production-minded platform.

---

## 5. Sequence of Events (End-to-End Story)

1. **EMS generators** publish vitals and FAST exam data to Kafka topics.
2. **Hospital capacity generator** publishes periodic capacity snapshots.
3. **Stream processing** joins and enriches these events, emitting feature vectors to `ai.prediction.input`.
4. **Vertex AI** consumes these feature vectors (via an inference service) and outputs risk scores and routing suggestions.
5. **Gemini** consumes the structured outputs and context to generate human-readable explanations and action plans.
6. The combined result is published to `ai.prediction.output`.
7. The **NeuroPulse dashboard** subscribes to `ai.prediction.output` (or a derived API) and displays real-time insights to the user.

---

## 6. MVP vs. Stretch Goals

### MVP (Hackathon-Ready)

- EMS + hospital synthetic streams into Confluent Cloud
- Basic stream processing to assemble AI inputs
- A simple Vertex AI scoring flow (even if partially mocked)
- LLM explanations using Gemini
- A single-page dashboard showing:
  - Active cases
  - Timeline
  - Vitals
  - AI recommendations & explanations

### Stretch Ideas

- Workflow events (`hospital.workflow.events`) and richer timelines
- Advanced metrics in BigQuery
- More sophisticated model training from synthetic datasets
- Integration with a proper Schema Registry and Avro serialization

---
