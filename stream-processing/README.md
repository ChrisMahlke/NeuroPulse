# Stream Processing Service

This directory contains the **stream processing service** that consumes from Confluent Kafka topics, processes events, calls Google Cloud AI services, and publishes predictions.

## Table of Contents

- [Purpose](#purpose)
- [Components](#components)
  - [Core Services](#core-services)
  - [AI Integration Services](#ai-integration-services)
  - [Helper Modules](#helper-modules)
  - [Data Generation Scripts](#data-generation-scripts)
- [Setup](#setup)
  - [1. Install Dependencies](#1-install-dependencies)
  - [2. Configure Confluent Cloud](#2-configure-confluent-cloud)
  - [3. (Optional) Configure Google Cloud AI](#3-optional-configure-google-cloud-ai)
- [Running](#running)
  - [Terminal 1: Stream Processor](#terminal-1-stream-processor)
  - [Terminal 2: API Server](#terminal-2-api-server)
  - [Terminal 3: Data Generator (Hackathon Mode)](#terminal-3-data-generator-hackathon-mode)
- [Architecture](#architecture)
- [Data Flow](#data-flow)
- [Key Features](#key-features)
- [Troubleshooting](#troubleshooting)
- [Related Documentation](#related-documentation)

---

## Purpose

The stream processing layer is the core of NeuroPulse. It:
- Consumes real-time data from multiple Kafka topics
- Joins streams by case ID to create complete patient context
- Performs feature engineering and aggregation
- Calls AI services (Vertex AI + Gemini) for predictions
- Publishes enriched predictions back to Kafka
- Serves data to the dashboard via REST API and WebSocket

## Components

### Core Services

#### `neuro_pulse_streaming/stream_processor.py`
**Main stream processing service.**

- Consumes from 3 Kafka topics simultaneously:
  - `ems.vitals.raw` - Real-time vital signs
  - `ems.fast.exam` - FAST stroke screening exams
  - `hospital.capacity` - Hospital capacity updates
- **Multi-stream joining** - Joins events by `case_id` to create complete context
- **Feature engineering** - Builds feature vectors with:
  - Aggregated vitals (trends, averages)
  - Time-based features (minutes since symptom onset)
  - Clinical features from FAST exam
  - Hospital routing context
- **AI integration** - Calls Vertex AI and Gemini services
- **Publishes predictions** to `ai.prediction.output` topic

**Key Features:**
- Handles out-of-order events
- Manages missing data gracefully
- Maintains state for windowed aggregations
- Real-time processing (sub-second latency)

#### `neuro_pulse_streaming/api_server.py`
**FastAPI server for dashboard integration.**

- Consumes from `ai.prediction.output` Kafka topic
- Maintains in-memory state of active cases
- **REST API endpoints** for case queries
- **WebSocket server** for real-time push updates
- Tracks streaming metrics (messages/sec, throughput, uptime)

**API Endpoints:**
- `GET /` - Health check
- `GET /api/health` - Detailed health status with Kafka metrics
- `GET /api/cases` - List all active cases
- `GET /api/cases/{case_id}` - Get detailed case information
- `WS /ws` - WebSocket connection for real-time updates

### AI Integration Services

#### `neuro_pulse_streaming/vertex_ai_service.py`
**Google Cloud Vertex AI integration.**

- Calls Vertex AI for stroke/LVO probability predictions
- Falls back to heuristic-based predictions if not configured
- Supports custom model endpoints
- Handles API errors gracefully

#### `neuro_pulse_streaming/gemini_service.py`
**Google Gemini API integration.**

- Generates natural language explanations of AI predictions
- Provides clinical recommendations and action plans
- Falls back to template-based explanations if not configured
- Cleans and formats output for dashboard display

### Helper Modules

#### `neuro_pulse_streaming/kafka_consumer_helper.py`
**Helper for creating Confluent Kafka consumers.**

- Loads configuration from `confluent_config.ini` or environment variables
- Creates authenticated Kafka consumers
- Handles connection errors gracefully
- Supports consumer group management

### Data Generation Scripts

#### `generate_live_kafka_data.py` ⭐ **Use This for Hackathon**
**Live data generator that publishes to Confluent Cloud Kafka.**

- Generates 6 diverse stroke scenarios
- Publishes to all 3 input topics
- Updates vitals every 1 second
- Shows real streaming metrics
- **Demonstrates full pipeline with Confluent Cloud**

#### `generate_live_mock_data.py`
**Development data generator (bypasses Kafka).**

- Faster for local development
- Sends data directly to API server
- No Confluent setup needed
- **Don't use for hackathon** (metrics show 0)

#### `generate_mock_data.py`
**One-time mock data generator.**

- Generates initial test data
- Useful for testing without live generation

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Confluent Cloud

```bash
cp confluent_config.example.ini confluent_config.ini
# Edit with your Confluent Cloud credentials
```

Or set environment variables:
```bash
export KAFKA_BOOTSTRAP_SERVERS="pkc-xxxxx.region.cloud:9092"
export KAFKA_SASL_USERNAME="your-api-key"
export KAFKA_SASL_PASSWORD="your-api-secret"
```

### 3. (Optional) Configure Google Cloud AI

```bash
export GEMINI_API_KEY="your-gemini-key"
export GOOGLE_CLOUD_PROJECT="your-project-id"
export GOOGLE_CLOUD_LOCATION="us-central1"
```

**Note:** System works without these - uses intelligent fallbacks.

## Running

### Terminal 1: Stream Processor

```bash
python3 -m stream-processing.neuro_pulse_streaming.stream_processor
```

**Expected output:**
```
[PROCESSOR] Subscribed to topics: ['ems.vitals.raw', 'ems.fast.exam', 'hospital.capacity']
[PROCESSOR] Starting stream processing loop...
[PROCESSOR] Received vitals for case CASE-SCEN-01-01
[PROCESSOR] Published prediction PRED-XXXXX to ai.prediction.output
```

### Terminal 2: API Server

```bash
python3 -m stream-processing.neuro_pulse_streaming.api_server
```

**Expected output:**
```
[API] Subscribed to ai.prediction.output, waiting for predictions...
INFO: Uvicorn running on http://0.0.0.0:8000
[API] Received message from ai.prediction.output
```

### Terminal 3: Data Generator (Hackathon Mode)

```bash
cd stream-processing
python3 generate_live_kafka_data.py
```

**Expected output:**
```
✓ Connected to Confluent Cloud Kafka
✓ Sent initial FAST exams and hospital capacity to Kafka
✓ Started live Kafka data generator for 6 diverse scenarios
```

## Architecture

```
┌─────────────────────┐
│  Confluent Cloud    │
│  Kafka Topics       │
│  - ems.vitals.raw   │
│  - ems.fast.exam    │
│  - hospital.capacity│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Stream Processor    │  ← Joins streams, feature engineering
│ (stream_processor)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Vertex AI + Gemini  │  ← AI predictions & explanations
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ ai.prediction.output│
│    Kafka Topic      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   API Server        │  ← REST API + WebSocket
│  (api_server)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    Dashboard        │  ← Real-time UI
└─────────────────────┘
```

## Data Flow

1. **Data Generation** → Publishes to Kafka topics
2. **Stream Processor** → Consumes from 3 topics, joins by `case_id`
3. **Feature Engineering** → Builds feature vectors
4. **AI Services** → Vertex AI (predictions) + Gemini (explanations)
5. **Publish** → Writes to `ai.prediction.output` topic
6. **API Server** → Consumes predictions, serves to dashboard
7. **Dashboard** → Displays via WebSocket (real-time) or REST API (polling)

## Key Features

- **Multi-stream joining** - Combines vitals, exams, and hospital data
- **Real-time processing** - Sub-second latency from data to prediction
- **Out-of-order handling** - Manages events arriving out of sequence
- **Graceful degradation** - Works without Vertex AI/Gemini (uses fallbacks)
- **WebSocket support** - Real-time push updates to dashboard
- **Streaming metrics** - Tracks throughput, lag, and performance

## Troubleshooting

See [../TROUBLESHOOTING.md](../TROUBLESHOOTING.md) for common issues.

**Common issues:**
- "No messages received" → Check data generator is running
- "Missing FAST exam" → Ensure case IDs match
- "WebSocket failed" → Dashboard falls back to REST API polling

## Related Documentation

- **Data Generators:** See `../data_generator/` for producers
- **Schemas:** See `../schemas/` for data structure definitions
- **AI Models:** See `../ai_models/` for prediction interfaces
- **Dashboard:** See `../dashboard/` for frontend

