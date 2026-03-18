# NeuroPulse

> Real-time AI-powered stroke triage and hospital routing system built on Confluent Cloud Kafka and Google Cloud AI

[![Confluent Cloud](https://img.shields.io/badge/Confluent-Cloud-blue)](https://confluent.cloud)
[![Google Cloud](https://img.shields.io/badge/Google-Cloud%20AI-orange)](https://cloud.google.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python-3.11+-green)](https://python.org)

## Overview

NeuroPulse is a **production-ready streaming data pipeline** that demonstrates real-time event processing, multi-stream joins, and AI inference at scale. Every minute of stroke delay kills 1.9 million brain cells—this system uses streaming data to make intelligent routing decisions as events happen.

### Key Features

- 🔄 **Real-time Stream Processing** - Multi-topic Kafka joins with sub-second latency
- 🤖 **AI Inference Pipeline** - Vertex AI predictions on streaming data with circuit breaker pattern
- 📊 **Live Metrics Dashboard** - WebSocket-powered UI with sparkline visualizations
- 🏥 **Intelligent Routing** - Dynamic hospital selection based on capacity and capabilities
- 📱 **Mobile-Responsive** - Production-ready UI optimized for all devices
- 🛡️ **Resilient Architecture** - Graceful degradation, error handling, and fallback strategies

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌──────────────┐
│ EMS Devices │────▶│ Confluent Cloud  │────▶│ Stream Processor│────▶│ Vertex AI    │
│ (Simulated) │     │ Kafka Topics     │     │ Multi-stream    │     │ + Gemini     │
└─────────────┘     │ • ems.vitals.raw │     │ Joins + Enrich  │     └──────────────┘
                    │ • ems.fast.exam  │     └─────────────────┘            │
                    │ • hospital.cap   │              │                     │
                    │ • ai.prediction  │              ▼                     ▼
                    └──────────────────┘     ┌─────────────────────────────────┐
                                             │ FastAPI + WebSocket Server      │
                                             └─────────────────────────────────┘
                                                          │
                                                          ▼
                                             ┌─────────────────────────────────┐
                                             │ Next.js Dashboard (Real-time)   │
                                             └─────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Confluent Cloud account with Kafka cluster
- (Optional) Google Cloud project with Vertex AI enabled

### Setup

**1. Configure Confluent Cloud**

```bash
cp data_generator/confluent_config.example.ini data_generator/confluent_config.ini
cp stream-processing/confluent_config.example.ini stream-processing/confluent_config.ini
# Edit both files with your Confluent Cloud credentials
```

Create Kafka topics: `ems.vitals.raw`, `ems.fast.exam`, `hospital.capacity`, `ai.prediction.output`

**2. Install Dependencies**

```bash
# Python dependencies
cd stream-processing
pip install -r requirements.txt

# Node.js dependencies
cd dashboard
npm install
```

**3. Start Services**

```bash
# Terminal 1: Stream Processor
cd stream-processing
python3 -m neuro_pulse_streaming.stream_processor

# Terminal 2: API Server
cd stream-processing
python3 -m neuro_pulse_streaming.api_server

# Terminal 3: Data Generator
cd stream-processing
python3 generate_live_kafka_data.py

# Terminal 4: Dashboard
cd dashboard
npm run dev
```

Open **http://localhost:3000** to view the dashboard.

📖 **Detailed setup guide:** [GETTING_STARTED.md](GETTING_STARTED.md)

## Technical Highlights

### Stream Processing

- **Multi-stream joins** across 3 Kafka topics with temporal alignment
- **Feature engineering** from raw vitals (NIHSS score calculation, trend analysis)
- **Stateful processing** with case tracking and deduplication
- **Avro serialization** with Schema Registry integration

### AI Integration

- **Vertex AI** for stroke/LVO probability predictions
- **Gemini** for natural language clinical explanations
- **Circuit breaker pattern** for resilient AI service calls
- **Graceful degradation** with heuristic fallbacks

### Real-time Dashboard

- **WebSocket streaming** for sub-second UI updates
- **Sparkline visualizations** for throughput and latency metrics
- **Mobile-responsive design** with Material-UI components
- **Live metrics** showing P50/P95/P99 latency percentiles

### Production Patterns

- Structured logging with correlation IDs
- Configurable timeouts and retry logic
- Health check endpoints
- Performance benchmarking tools
- Comprehensive error handling

## Project Structure

```plaintext
NeuroPulse/
├── data_generator/              # Kafka producers (EMS data simulation)
├── stream-processing/           # Core streaming application
│   ├── neuro_pulse_streaming/
│   │   ├── stream_processor.py  # Multi-stream join logic
│   │   ├── api_server.py        # FastAPI + WebSocket server
│   │   ├── vertex_ai_service.py # AI prediction service
│   │   ├── gemini_service.py    # NLP explanation service
│   │   ├── circuit_breaker.py   # Resilience pattern
│   │   └── metrics_collector.py # Performance tracking
│   ├── generate_live_kafka_data.py  # Live data generator
│   └── benchmark_performance.py     # Performance testing
├── dashboard/                   # Next.js 16 web application
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── hooks/               # Custom hooks (WebSocket, etc.)
│   │   └── services/            # API client
├── schemas/                     # Avro schemas + registration
└── docs/                        # Architecture documentation
```

## Configuration

### Environment Variables

```bash
# Google Cloud AI (Optional - uses fallbacks if not set)
export GEMINI_API_KEY="your-api-key"
export GOOGLE_CLOUD_PROJECT="your-project-id"

# API Server (Optional - defaults shown)
export API_PORT=8000
export API_HOST=0.0.0.0
```

### Confluent Cloud

Edit `confluent_config.ini` files:

```ini
[kafka]
bootstrap.servers=pkc-xxxxx.us-east-1.aws.confluent.cloud:9092
security.protocol=SASL_SSL
sasl.mechanisms=PLAIN
sasl.username=YOUR_API_KEY
sasl.password=YOUR_API_SECRET
```

## Performance

- **Throughput**: 100+ messages/second per topic
- **Latency**: P95 < 500ms end-to-end (Kafka → AI → Dashboard)
- **AI Inference**: ~200-300ms per prediction (Vertex AI)
- **WebSocket Updates**: Real-time (< 100ms UI refresh)

Run benchmarks: `python3 benchmark_performance.py`

## Documentation

| Document                                                       | Description                           |
| -------------------------------------------------------------- | ------------------------------------- |
| [GETTING_STARTED.md](GETTING_STARTED.md)                       | Complete setup and deployment guide   |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md)                       | Common issues and solutions           |
| [REUSABLE_PATTERNS.md](REUSABLE_PATTERNS.md)                   | Reusable code patterns and components |
| [docs/architecture-overview.md](docs/architecture-overview.md) | System architecture deep-dive         |

## Development

**Mock Mode** (bypasses Kafka for faster iteration):

```bash
cd stream-processing
python3 generate_live_mock_data.py
```

**Production Mode** (uses Confluent Cloud):

```bash 
cd stream-processing
python3 generate_live_kafka_data.py
```

## License

MIT License - See [LICENSE](LICENSE)

## Disclaimer

⚠️ **All data is synthetic and for demonstration purposes only.** This system is not intended for clinical use.
