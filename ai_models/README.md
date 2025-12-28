# AI Models

This directory contains the AI prediction service interfaces and data models for NeuroPulse.

## Table of Contents

- [Purpose](#purpose)
- [Components](#components)
  - [`neuro_pulse_ai/prediction_service_stub.py`](#neuro_pulse_aiprediction_service_stubpy)
  - [`neuro_pulse_ai/case_orchestrator_demo.py`](#neuro_pulse_aicase_orchestrator_demopy)
- [Architecture Context](#architecture-context)
- [Data Flow](#data-flow)
- [Usage](#usage)
- [Configuration](#configuration)
- [Important Notes](#important-notes)

---

## Purpose

This module defines the **contract** (interface) between the stream processing layer and the AI services (Google Cloud Vertex AI + Gemini). It provides data models and a stub implementation for local testing and development.

## Components

### `neuro_pulse_ai/prediction_service_stub.py`

**Main AI prediction service interface and stub implementation.**

- **Data Models:**
  - `AiPredictionRequest` - Input feature vector containing vitals, FAST exam results, time features, and routing context
  - `AiPredictionResponse` - Output containing stroke/LVO probabilities, risk categories, routing recommendations, and AI explanations

- **Stub Implementation:**
  - Provides heuristic-based predictions for local development
  - Simulates AI model behavior without requiring Vertex AI or Gemini setup
  - Uses clinical heuristics to generate realistic stroke/LVO probabilities
  - Generates template-based explanations similar to Gemini output

- **Production Integration:**
  - Designed to be replaced with real Vertex AI calls for stroke/LVO probability predictions
  - Can be extended to call Gemini API for natural language explanations
  - Maintains the same interface, allowing seamless transition from stub to production

### `neuro_pulse_ai/case_orchestrator_demo.py`

**Demo script for testing the prediction service.**

- Standalone script for testing the AI prediction interface
- Useful for validating data models and stub behavior
- Can be used to test feature engineering logic

## Architecture Context

```
Stream Processor
    ↓
AiPredictionRequest (feature vector)
    ↓
prediction_service_stub.py
    ↓
AiPredictionResponse (predictions + explanations)
    ↓
Published to ai.prediction.output Kafka topic
```

## Data Flow

1. **Stream Processor** collects vitals, FAST exams, and hospital data
2. **Feature Engineering** creates `AiPredictionRequest` with:
   - Clinical features (vitals, FAST exam findings)
   - Time features (minutes since symptom onset)
   - Routing context (hospital distances, travel times)
3. **Prediction Service** (stub or Vertex AI) returns:
   - Stroke probability (0.0-1.0)
   - LVO probability (0.0-1.0)
   - Risk category (LOW, MODERATE, HIGH, CRITICAL)
   - Hospital routing recommendations
   - Natural language explanations
4. **Response** is published to Kafka and displayed in dashboard

## Usage

The prediction service is called by the stream processor in `stream-processing/neuro_pulse_streaming/stream_processor.py`:

```python
from ai_models.neuro_pulse_ai.prediction_service_stub import (
    AiPredictionRequest,
    AiPredictionResponse,
    predict_with_stub
)

# Create request from stream data
request = AiPredictionRequest(...)

# Get prediction
response = predict_with_stub(request)
```

## Configuration

The stub implementation works out of the box. For production Vertex AI integration:

- Set `GOOGLE_CLOUD_PROJECT` environment variable
- Set `GOOGLE_CLOUD_LOCATION` environment variable
- Configure Vertex AI model endpoint in `vertex_ai_service.py`

## Important Notes

- **All predictions use synthetic data** - For demonstration only, not for clinical use
- **Stub implementation** - Uses heuristics, not real ML models
- **Production ready interface** - Designed to be easily replaced with real AI services
- **Medical disclaimer** - All outputs are educational and not medical advice

