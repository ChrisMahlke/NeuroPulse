# Getting Started with NeuroPulse

This guide will help you get NeuroPulse running locally in 10 minutes.

## Table of Contents

- [Getting Started with NeuroPulse](#getting-started-with-neuropulse)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Step 1: Clone \& Install](#step-1-clone--install)
  - [Step 2: Configure Confluent Cloud](#step-2-configure-confluent-cloud)
    - [2.1 Create Confluent Cloud Account](#21-create-confluent-cloud-account)
    - [2.2 Create Kafka Topics](#22-create-kafka-topics)
    - [2.3 Get API Credentials](#23-get-api-credentials)
    - [2.4 Configure Local Files](#24-configure-local-files)
  - [Step 3: (Optional) Configure Google Cloud AI](#step-3-optional-configure-google-cloud-ai)
  - [Step 4: Start Services](#step-4-start-services)
    - [Terminal 1: Stream Processor](#terminal-1-stream-processor)
    - [Terminal 2: API Server](#terminal-2-api-server)
    - [Terminal 3: Data Generator (Hackathon Mode)](#terminal-3-data-generator-hackathon-mode)
  - [Step 5: Start Dashboard](#step-5-start-dashboard)
  - [✅ Verify It's Working](#-verify-its-working)
    - [Check Dashboard](#check-dashboard)
    - [Check Terminal Logs](#check-terminal-logs)
  - [🎯 Two Data Generation Modes](#-two-data-generation-modes)
    - [Hackathon Mode (Use This!)](#hackathon-mode-use-this)
    - [Development Mode (Quick Testing)](#development-mode-quick-testing)
  - [🐛 Troubleshooting](#-troubleshooting)
    - ["Kafka config not found"](#kafka-config-not-found)
    - ["No messages received" in dashboard](#no-messages-received-in-dashboard)
    - ["WebSocket connection failed"](#websocket-connection-failed)
    - [Dashboard shows 0 cases](#dashboard-shows-0-cases)
  - [📖 Next Steps](#-next-steps)
  - [💡 Tips](#-tips)

---

## Prerequisites

- Python 3.9+
- Node.js 18+
- Confluent Cloud account (free trial: use code `CONFLUENTDEV1`)
- (Optional) Google Cloud account for Vertex AI + Gemini

---

## Step 1: Clone & Install

```bash
# Install Python dependencies
pip install -r data_generator/requirements.txt
pip install -r stream-processing/requirements.txt

# Install dashboard dependencies
cd dashboard
npm install
cd ..
```

---

## Step 2: Configure Confluent Cloud

### 2.1 Create Confluent Cloud Account

1. Go to https://confluent.cloud
2. Sign up (use code `CONFLUENTDEV1` for free trial)
3. Create a cluster (Basic cluster is fine)

### 2.2 Create Kafka Topics

Create these 4 topics in Confluent Cloud:

- `ems.vitals.raw`
- `ems.fast.exam`
- `hospital.capacity`
- `ai.prediction.output`

### 2.3 Get API Credentials

1. In Confluent Cloud, go to **API Keys**
2. Create a new API key
3. Copy the **Bootstrap Servers**, **API Key**, and **API Secret**

### 2.4 Configure Local Files

```bash
# Copy example configs
cp data_generator/confluent_config.example.ini data_generator/confluent_config.ini
cp stream-processing/confluent_config.example.ini stream-processing/confluent_config.ini

# Edit both files and add your credentials:
# [confluent]
# bootstrap.servers = pkc-xxxxx.us-east-1.aws.confluent.cloud:9092
# sasl.username = YOUR_API_KEY
# sasl.password = YOUR_API_SECRET
```

---

## Step 3: (Optional) Configure Google Cloud AI

If you want real AI predictions (not just fallbacks):

```bash
export GEMINI_API_KEY="your-gemini-api-key"
export GOOGLE_CLOUD_PROJECT="your-gcp-project-id"
export GOOGLE_CLOUD_LOCATION="us-central1"
```

**Note:** The system works without these - it uses intelligent fallbacks.

---

## Step 4: Start Services

Open **3 terminal windows**:

### Terminal 1: Stream Processor

```bash
cd stream-processing
python3 -m neuro_pulse_streaming.stream_processor
```

You should see:

```
[PROCESSOR] Subscribed to topics: ['ems.vitals.raw', 'ems.fast.exam', 'hospital.capacity']
[PROCESSOR] Starting stream processing loop...
```

### Terminal 2: API Server

```bash
cd stream-processing
python3 -m neuro_pulse_streaming.api_server
```

You should see:

```
[API] Subscribed to ai.prediction.output, waiting for predictions...
INFO: Uvicorn running on http://0.0.0.0:8000
```

### Terminal 3: Data Generator (Hackathon Mode)

```bash
cd stream-processing
python3 generate_live_kafka_data.py
```

You should see:

```
✓ Connected to Confluent Cloud Kafka
✓ Sent initial FAST exams and hospital capacity to Kafka
✓ Started live Kafka data generator for 6 diverse scenarios
```

---

## Step 5: Start Dashboard

Open a **4th terminal**:

```bash
cd dashboard
npm run dev
```

Open http://localhost:3000 in your browser.

---

## ✅ Verify It's Working

### Check Dashboard

- **Streaming Status Panel** (top of page) should show:

  - 🟢 LIVE status
  - `messages_received > 0`
  - `messages_per_second > 0`

- **Active Cases Panel** (left) should show 6 cases

- **Selected Case Panel** (center) should show:
  - Live vitals updating every second
  - Stroke/LVO risk probabilities
  - AI explanations

### Check Terminal Logs

**Stream Processor** should show:

```
[PROCESSOR] Received vitals for case CASE-SCEN-01-01
[PROCESSOR] Published prediction PRED-XXXXX to ai.prediction.output
```

**API Server** should show:

```
[API] Received message from ai.prediction.output [partition 0] @ offset X
[API] Updated prediction for case CASE-SCEN-01-01
```

**Data Generator** should show:

```
[KAFKA] Sent vitals for CASE-SCEN-01-01 - HR: 95 bpm, BP: 180/110
```

---

## 🎯 Two Data Generation Modes

### Hackathon Mode (Use This!)

**File:** `stream-processing/generate_live_kafka_data.py`

- ✅ Uses Confluent Cloud Kafka
- ✅ Shows real streaming metrics
- ✅ Full pipeline demonstration
- ✅ **Use this for hackathon demo**

### Development Mode (Quick Testing)

**File:** `stream-processing/generate_live_mock_data.py`

- ✅ Faster (bypasses Kafka)
- ✅ No Confluent setup needed
- ❌ Metrics show 0 (no Kafka)
- ❌ **Don't use for hackathon**

---

## 🐛 Troubleshooting

### "Kafka config not found"

- Make sure you created `confluent_config.ini` files
- Check file paths are correct

### "No messages received" in dashboard

- Make sure stream processor is running
- Make sure data generator is running
- Check Confluent Cloud console - do you see messages?

### "WebSocket connection failed"

- Make sure API server is running on port 8000
- Dashboard will still work with REST API polling

### Dashboard shows 0 cases

- Check stream processor logs - is it processing cases?
- Check API server logs - is it receiving predictions?
- Try restarting all services

---

## 📖 Next Steps

- **For Hackathon**: See [HACKATHON_SUBMISSION.md](HACKATHON_SUBMISSION.md)
- **For Architecture**: See [docs/architecture-overview.md](docs/architecture-overview.md)
- **For Troubleshooting**: See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## 💡 Tips

1. **Start services in order**: Stream processor → API server → Data generator
2. **Watch the logs**: They tell you exactly what's happening
3. **Check Confluent Cloud console**: See messages flowing in real-time
4. **Use hackathon mode**: `generate_live_kafka_data.py` shows real metrics
