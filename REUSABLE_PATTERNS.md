# Reusable Patterns & Components

This document identifies reusable patterns, code components, and architectural concepts from NeuroPulse that can be applied to other projects, domains, or teams.

## Table of Contents

- [Overview](#overview)
- [🎯 AI & Confluent-Specific Reusable Components](#-ai--confluent-specific-reusable-components)
  - [Confluent Cloud Integration](#confluent-cloud-integration)
  - [Google Cloud AI Integration](#google-cloud-ai-integration)
  - [Combined: Confluent + AI Integration](#combined-confluent--ai-integration)
- [1. Reusable Code Components](#1-reusable-code-components)
  - [1.1 Kafka Consumer/Producer Helpers](#11-kafka-consumerproducer-helpers)
  - [1.2 Multi-Stream Joining Pattern](#12-multi-stream-joining-pattern)
  - [1.3 Real-Time AI Inference Pattern](#13-real-time-ai-inference-pattern)
  - [1.4 WebSocket + REST API Hybrid Pattern](#14-websocket--rest-api-hybrid-pattern)
  - [1.5 Real-Time Dashboard State Management](#15-real-time-dashboard-state-management)
- [2. Reusable Architectural Patterns](#2-reusable-architectural-patterns)
  - [2.1 Real-Time AI on Streaming Data](#21-real-time-ai-on-streaming-data)
  - [2.2 Multi-Source Data Fusion](#22-multi-source-data-fusion)
  - [2.3 Explainable AI in Real-Time](#23-explainable-ai-in-real-time)
  - [2.4 Time-Critical Decision Support](#24-time-critical-decision-support)
- [3. Reusable Concepts & Ideas](#3-reusable-concepts--ideas)
  - [3.1 Stateful Stream Processing](#31-stateful-stream-processing)
  - [3.2 Graceful Degradation](#32-graceful-degradation)
  - [3.3 Feature Engineering on Streams](#33-feature-engineering-on-streams)
  - [3.4 Real-Time Metrics & Observability](#34-real-time-metrics--observability)
- [4. Domain-Agnostic Adaptations](#4-domain-agnostic-adaptations)
  - [4.1 From Stroke Triage to Other Domains](#41-from-stroke-triage-to-other-domains)
- [5. Code Extraction Guide](#5-code-extraction-guide)
  - [5.1 Extracting Kafka Helpers](#51-extracting-kafka-helpers)
  - [5.2 Extracting Stream Joiner](#52-extracting-stream-joiner)
  - [5.3 Extracting WebSocket Pattern](#53-extracting-websocket-pattern)
- [6. Implementation Examples](#6-implementation-examples)
  - [6.1 Using Kafka Helpers in Another Project](#61-using-kafka-helpers-in-another-project)
  - [6.2 Using Multi-Stream Joiner](#62-using-multi-stream-joiner)
  - [6.3 Using WebSocket Pattern](#63-using-websocket-pattern)
- [7. Contributing Reusable Components](#7-contributing-reusable-components)
- [8. Summary](#8-summary)
- [9. Next Steps](#9-next-steps)

---

## Overview

While NeuroPulse is specific to stroke triage, many of its patterns, components, and architectural decisions are **domain-agnostic** and can be reused for:

- Other time-critical decision support systems
- Real-time multi-source data fusion
- Emergency response coordination
- Any system requiring real-time AI inference on streaming data
- Real-time dashboards with WebSocket + REST API hybrid

---

## 🎯 AI & Confluent-Specific Reusable Components

This section highlights the **most valuable reusable components** specifically related to **Confluent Cloud Kafka** and **Google Cloud AI** (Vertex AI + Gemini) integration.

### Confluent Cloud Integration

#### ✅ Reusable: Confluent Cloud Kafka Helpers

**Files:**
- `stream-processing/neuro_pulse_streaming/kafka_consumer_helper.py`
- `data_generator/neuro_pulse_datagen/kafka_producer_helper.py`

**What You Get:**
- **Production-ready Confluent Cloud connection** - Handles SASL/SSL authentication
- **Environment variable support** - Works in Cloud Run, Kubernetes, local dev
- **INI file configuration** - Easy local development setup
- **Consumer group management** - Proper offset tracking and load balancing
- **Error handling** - Graceful connection failures and retries

**Extract & Reuse:**
```python
# Copy these files to your project
# They work with ANY Confluent Cloud Kafka cluster
from kafka_consumer_helper import load_kafka_config, create_kafka_consumer

# Works with environment variables (Cloud) or INI files (local)
config = load_kafka_config()  # Auto-detects env vars or INI file
consumer = create_kafka_consumer(config, topics=["your-topic"])
```

**Use Cases:**
- Any application consuming from Confluent Cloud
- Multi-topic consumers
- Stream processing applications
- Real-time data pipelines

---

#### ✅ Reusable: Multi-Stream Joining with Confluent Kafka

**File:** `stream-processing/neuro_pulse_streaming/stream_processor.py`

**What You Get:**
- **Pattern for joining multiple Kafka topics** by a common key
- **In-memory state management** for stream joins
- **Out-of-order event handling** - Critical for real-world Kafka streams
- **Missing data handling** - Waits for sufficient data before processing

**Core Pattern:**
```python
class MultiStreamJoiner:
    def __init__(self):
        # State stores keyed by join key (e.g., case_id, user_id, order_id)
        self.stream1_state = {}  # Topic 1 events
        self.stream2_state = {}  # Topic 2 events
        self.stream3_state = {}  # Topic 3 events
    
    def process_kafka_message(self, topic, message):
        join_key = message['key']  # Extract join key
        
        # Update state for this stream
        if topic == 'topic1':
            self.stream1_state[join_key] = message
        
        # Check if we have all required data
        if self._has_complete_data(join_key):
            self._process_complete_record(join_key)
```

**Why This is Valuable:**
- Confluent Kafka streams arrive asynchronously
- Events can arrive out of order
- You need to combine data from multiple topics
- This pattern handles all of that

**Use Cases:**
- Combining user events from multiple sources
- Enriching transactions with customer data
- Correlating IoT sensor data
- Building complete context from partial updates

---

### Google Cloud AI Integration

#### ✅ Reusable: Vertex AI Integration Pattern

**File:** `stream-processing/neuro_pulse_streaming/vertex_ai_service.py`

**What You Get:**
- **Production-ready Vertex AI client** - Handles authentication, initialization
- **Feature vector transformation** - Converts domain objects to ML model input
- **Graceful fallback** - Works without Vertex AI (uses heuristics)
- **Error handling** - Handles API failures, timeouts, format mismatches

**Core Pattern:**
```python
def predict_with_vertex_ai(feature_vector):
    """
    Reusable pattern for calling Vertex AI from stream processing.
    """
    # 1. Check if Vertex AI is configured
    if not VERTEX_AI_AVAILABLE:
        return fallback_predictions(feature_vector)
    
    # 2. Initialize Vertex AI client
    aiplatform.init(project=PROJECT_ID, location=LOCATION)
    
    # 3. Transform feature vector to model format
    model_input = transform_features(feature_vector)
    
    # 4. Call Vertex AI endpoint
    endpoint = aiplatform.Endpoint(ENDPOINT_ID)
    response = endpoint.predict(instances=[model_input])
    
    # 5. Extract predictions
    return parse_predictions(response)
```

**Why This is Valuable:**
- Works in stream processing context (not batch)
- Handles real-time inference
- Graceful degradation (system works without AI)
- Production-ready error handling

**Use Cases:**
- Real-time fraud detection
- Predictive maintenance
- Anomaly detection
- Any ML inference on streaming data

**Extract & Reuse:**
- Copy `vertex_ai_service.py` to your project
- Replace domain-specific feature transformation
- Keep the Vertex AI client pattern
- Adapt fallback logic to your domain

---

#### ✅ Reusable: Gemini LLM Integration Pattern

**File:** `stream-processing/neuro_pulse_streaming/gemini_service.py`

**What You Get:**
- **Gemini API client** - Handles authentication and API calls
- **Prompt engineering pattern** - Structured prompts for explainable AI
- **Response parsing** - Extracts explanations and recommendations
- **Fallback templates** - Works without Gemini API

**Core Pattern:**
```python
def generate_explanation_with_gemini(prediction_data):
    """
    Reusable pattern for generating AI explanations with Gemini.
    """
    # 1. Build structured prompt
    prompt = f"""
    Based on the following prediction:
    - Probability: {prediction_data['probability']}
    - Features: {prediction_data['features']}
    
    Generate:
    1. A clear explanation of why this prediction was made
    2. Key factors that influenced the prediction
    3. Recommended actions
    """
    
    # 2. Call Gemini API
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content(prompt)
    
    # 3. Parse and clean response
    explanation = clean_gemini_response(response.text)
    
    return explanation
```

**Why This is Valuable:**
- **Explainable AI** - Makes ML predictions understandable
- **Natural language** - Converts probabilities to actionable text
- **Real-time** - Works in streaming context
- **Production-ready** - Handles API failures gracefully

**Use Cases:**
- Explaining fraud detection decisions
- Describing anomaly detection findings
- Generating recommendations from predictions
- Any system needing AI transparency

**Extract & Reuse:**
- Copy `gemini_service.py` to your project
- Adapt prompt templates to your domain
- Keep the API client and error handling
- Customize response parsing

---

#### ✅ Reusable: Real-Time AI Pipeline Pattern

**File:** `stream-processing/neuro_pulse_streaming/stream_processor.py`

**What You Get:**
- **Complete pattern** for: Kafka → Feature Engineering → Vertex AI → Gemini → Kafka
- **Stateful stream processing** - Maintains context across events
- **Feature engineering on streams** - Real-time feature calculation
- **AI orchestration** - Coordinates ML + LLM calls

**Architecture Pattern:**
```
Confluent Kafka Topics
    ↓
Stream Processor (joins streams)
    ↓
Feature Engineering (real-time)
    ↓
Vertex AI (ML predictions)
    ↓
Gemini (explanations)
    ↓
Publish to Kafka
```

**Why This is Valuable:**
- **End-to-end pattern** - Not just individual components
- **Production-tested** - Handles real-world issues
- **Scalable** - Works with high-throughput streams
- **Real-time** - Sub-second latency

**Use Cases:**
- Real-time fraud detection with explanations
- Predictive maintenance with recommendations
- Anomaly detection with context
- Any ML + LLM pipeline on streaming data

**Extract & Reuse:**
- Study the `_process_case()` method
- Adapt feature engineering to your domain
- Replace Vertex AI model with your model
- Customize Gemini prompts for your use case

---

### Combined: Confluent + AI Integration

#### ✅ Reusable: Complete Streaming AI Pipeline

**What You Get:**
- **Confluent Cloud** for data streaming
- **Vertex AI** for ML predictions
- **Gemini** for explanations
- **All integrated** in a production-ready pattern

**Key Files:**
1. `kafka_consumer_helper.py` - Confluent connection
2. `stream_processor.py` - Multi-stream joining
3. `vertex_ai_service.py` - ML inference
4. `gemini_service.py` - LLM explanations

**Why This is Unique:**
- Most examples show Kafka OR AI, not both together
- This shows **real-time AI on streaming data**
- Production patterns, not just demos
- Handles edge cases (out-of-order, missing data, API failures)

**Extract & Reuse:**
1. Copy the helper modules
2. Adapt domain logic (replace stroke-specific code)
3. Keep the integration patterns
4. Use your own Confluent topics and Vertex AI models

---

## 1. Reusable Code Components

### 1.1 Kafka Consumer/Producer Helpers

**Location:** `stream-processing/neuro_pulse_streaming/kafka_consumer_helper.py`  
**Location:** `data_generator/neuro_pulse_datagen/kafka_producer_helper.py`

**What's Reusable:**

- Configuration loading from INI files or environment variables
- Confluent Cloud authentication setup
- Consumer/Producer creation with error handling
- Consumer group management

**How to Reuse:**

```python
# Generic pattern - works for any Kafka application
from kafka_consumer_helper import load_kafka_config, create_kafka_consumer

config = load_kafka_config("path/to/config.ini")
consumer = create_kafka_consumer(config, topics=["topic1", "topic2"])
```

**Use Cases:**

- Any application consuming from Confluent Cloud Kafka
- Multi-topic consumers
- Applications needing environment-based configuration

**Key Features:**

- ✅ Environment variable support (Cloud deployments)
- ✅ INI file support (local development)
- ✅ Graceful error handling
- ✅ Consumer group management

---

### 1.2 Multi-Stream Joining Pattern

**Location:** `stream-processing/neuro_pulse_streaming/stream_processor.py`

**What's Reusable:**

- Pattern for joining multiple Kafka streams by a common key
- In-memory state management for stream joins
- Handling out-of-order events
- Waiting for sufficient data before processing

**Core Pattern:**

```python
class MultiStreamJoiner:
    def __init__(self):
        self.stream1_state = {}  # Keyed by join_key
        self.stream2_state = {}  # Keyed by join_key
        self.stream3_state = {}  # Keyed by join_key
    
    def process_event(self, topic, event):
        join_key = event['key']
        
        # Update state for this stream
        if topic == 'stream1':
            self.stream1_state[join_key] = event
        elif topic == 'stream2':
            self.stream2_state[join_key] = event
        
        # Check if we have all required data
        if self._has_complete_data(join_key):
            self._process_complete_record(join_key)
    
    def _has_complete_data(self, key):
        return (key in self.stream1_state and 
                key in self.stream2_state)
```

**Use Cases:**

- Combining data from multiple sources (IoT devices, APIs, databases)
- Real-time data enrichment
- Event correlation across streams
- Building complete context from partial updates

**Key Features:**

- ✅ Handles out-of-order events
- ✅ Manages missing data gracefully
- ✅ Stateful stream processing
- ✅ Configurable join conditions

---

### 1.3 Real-Time AI Inference Pattern

**Location:** `stream-processing/neuro_pulse_streaming/stream_processor.py`  
**Location:** `ai_models/neuro_pulse_ai/prediction_service_stub.py`

**What's Reusable:**

- Pattern for calling AI services (Vertex AI, Gemini) from stream processing
- Feature engineering on streaming data
- Stub/fallback pattern for development
- Request/Response data models

**Core Pattern:**

```python
# 1. Build feature vector from stream events
def build_feature_vector(events):
    return {
        'feature1': events['vitals']['value'],
        'feature2': calculate_trend(events['vitals']),
        'time_feature': minutes_since(events['timestamp'])
    }

# 2. Call AI service
prediction = ai_service.predict(feature_vector)

# 3. Generate explanation
explanation = llm_service.explain(prediction)

# 4. Publish enriched result
publish_to_kafka({
    'prediction': prediction,
    'explanation': explanation
})
```

**Use Cases:**

- Real-time fraud detection
- Predictive maintenance
- Anomaly detection
- Real-time recommendation systems
- Any ML inference on streaming data

**Key Features:**

- ✅ Async AI calls
- ✅ Graceful fallbacks
- ✅ Feature engineering pipeline
- ✅ Explainable AI integration

---

### 1.4 WebSocket + REST API Hybrid Pattern

**Location:** `stream-processing/neuro_pulse_streaming/api_server.py`  
**Location:** `dashboard/src/hooks/useWebSocket.ts`

**What's Reusable:**

- Pattern for real-time dashboards with WebSocket + REST fallback
- Automatic reconnection logic
- State synchronization between WebSocket and REST
- Graceful degradation

**Core Pattern:**

```python
# Backend: FastAPI with WebSocket
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    # Send initial state
    await websocket.send_json({"type": "initial_state", "data": ...})
    # Push updates as they arrive
    while True:
        update = await kafka_consumer.get_message()
        await websocket.send_json({"type": "update", "data": update})
```

```typescript
// Frontend: React hook with fallback
function useWebSocket() {
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      // Fallback to REST API polling
      startPolling();
    };
  }, []);
  
  // Fallback polling if WebSocket fails
  useEffect(() => {
    if (!connected) {
      const interval = setInterval(fetchData, 10000);
      return () => clearInterval(interval);
    }
  }, [connected]);
}
```

**Use Cases:**

- Real-time monitoring dashboards
- Live data visualization
- Collaborative applications
- Any app needing real-time updates

**Key Features:**

- ✅ Automatic reconnection
- ✅ REST API fallback
- ✅ State synchronization
- ✅ Graceful degradation

---

### 1.5 Real-Time Dashboard State Management

**Location:** `dashboard/src/state/casesSlice.ts`  
**Location:** `dashboard/src/hooks/useCases.ts`

**What's Reusable:**

- Redux Toolkit pattern for real-time data
- Optimistic updates
- WebSocket integration with state management
- Case/entity selection pattern

**Core Pattern:**

```typescript
// Redux slice for real-time entities
const entitiesSlice = createSlice({
  name: 'entities',
  initialState: {
    entities: {},
    selectedId: null,
  },
  reducers: {
    upsertEntity: (state, action) => {
      state.entities[action.payload.id] = action.payload;
    },
    selectEntity: (state, action) => {
      state.selectedId = action.payload;
    },
  },
});

// Hook that syncs WebSocket with Redux
function useRealtimeEntities() {
  const dispatch = useAppDispatch();
  const { connected } = useWebSocket();
  
  useEffect(() => {
    if (connected) {
      // WebSocket updates Redux automatically
    } else {
      // Fallback to polling
      const interval = setInterval(() => {
        fetchEntities().then(entities => {
          entities.forEach(e => dispatch(upsertEntity(e)));
        });
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [connected]);
}
```

**Use Cases:**

- Real-time entity management
- Live data dashboards
- Collaborative editing
- Any app with real-time state updates

---

## 2. Reusable Architectural Patterns

### 2.1 Real-Time AI on Streaming Data

**Pattern:** Kafka → Stream Processor → AI Services → Dashboard

**Description:**

- Consume from multiple Kafka topics
- Join streams by key
- Perform feature engineering
- Call AI services (ML + LLM)
- Publish enriched results
- Serve to real-time dashboard

**Applicable Domains:**

- Fraud detection (transaction streams)
- Predictive maintenance (sensor data)
- Anomaly detection (log streams)
- Real-time recommendations (user behavior)
- Emergency response (multi-source alerts)

**Key Benefits:**

- Low latency (sub-second)
- Scalable (Kafka handles high throughput)
- Decoupled (services communicate via Kafka)
- Real-time (not batch)

---

### 2.2 Multi-Source Data Fusion

**Pattern:** Combine data from multiple independent streams

**Description:**

- Multiple producers publish to different topics
- Stream processor joins by common key
- Builds complete context from partial updates
- Handles out-of-order and missing data

**Applicable Domains:**

- IoT sensor fusion
- Multi-system event correlation
- Real-time data enrichment
- Emergency coordination (EMS + hospitals + dispatch)

**Key Benefits:**

- Handles asynchronous data sources
- Resilient to missing data
- Real-time context building
- Flexible join logic

---

### 2.3 Explainable AI in Real-Time

**Pattern:** ML predictions + LLM explanations

**Description:**

- ML model provides predictions (probabilities, classifications)
- LLM generates natural language explanations
- Both happen in real-time as data streams

**Applicable Domains:**

- Healthcare decision support
- Financial risk assessment
- Security threat analysis
- Any domain requiring AI transparency

**Key Benefits:**

- Builds trust in AI decisions
- Helps users understand reasoning
- Actionable recommendations
- Real-time explanations

---

### 2.4 Time-Critical Decision Support

**Pattern:** Real-time processing with time windows

**Description:**

- Calculate time-based features (elapsed time, time remaining)
- Apply time-sensitive business rules
- Visualize time windows in UI
- Make decisions based on time constraints

**Applicable Domains:**

- Emergency response
- Supply chain optimization
- Financial trading
- SLA monitoring
- Any time-sensitive decision making

**Key Benefits:**

- Time-aware decisions
- Visual time pressure indicators
- Optimized for time-critical scenarios

---

## 3. Reusable Concepts & Ideas

### 3.1 Stateful Stream Processing

**Concept:** Maintain in-memory state while processing streams

**Why It's Useful:**

- Enables windowed aggregations
- Allows stream joins
- Supports stateful transformations
- Handles out-of-order events

**When to Use:**

- Need to correlate events across time
- Building complete context from partial updates
- Windowed calculations (averages, trends)
- Event pattern detection

---

### 3.2 Graceful Degradation

**Concept:** System works even when optional services are unavailable

**Examples from NeuroPulse:**

- Works without Vertex AI (uses heuristics)
- Works without Gemini (uses templates)
- Works without WebSocket (uses REST polling)

**Why It's Useful:**

- Development doesn't require all services
- Production resilience
- Easier testing
- Lower operational complexity

**When to Use:**

- External service dependencies
- Optional features
- Development vs production environments
- High availability requirements

---

### 3.3 Feature Engineering on Streams

**Concept:** Transform raw events into ML-ready features in real-time

**Examples:**

- Calculate trends (increasing/decreasing)
- Time-based features (minutes since event)
- Aggregations (rolling averages)
- Derived features (ratios, differences)

**Why It's Useful:**

- Real-time ML inference
- No batch processing delays
- Incremental feature updates
- Context-aware features

**When to Use:**

- Real-time ML predictions
- Streaming analytics
- Anomaly detection
- Time-series analysis

---

### 3.4 Real-Time Metrics & Observability

**Concept:** Track streaming pipeline health in real-time

**Examples from NeuroPulse:**

- Messages per second
- Consumer lag
- Uptime
- Topic-level metrics

**Why It's Useful:**

- Monitor pipeline health
- Debug issues quickly
- Performance optimization
- Capacity planning

**When to Use:**

- Production monitoring
- Performance tuning
- Debugging streaming issues
- SLA compliance

---

## 4. Domain-Agnostic Adaptations

### 4.1 From Stroke Triage to Other Domains

**Fraud Detection:**

- Streams: Transactions, user behavior, risk signals
- Join by: User ID, transaction ID
- AI: Fraud probability, risk score
- Output: Fraud alerts, blocking recommendations

**Predictive Maintenance:**

- Streams: Sensor data, maintenance logs, equipment status
- Join by: Equipment ID
- AI: Failure probability, maintenance recommendations
- Output: Maintenance alerts, scheduling recommendations

**Supply Chain Optimization:**

- Streams: Orders, inventory, shipping, demand forecasts
- Join by: Product ID, order ID
- AI: Demand prediction, routing optimization
- Output: Inventory alerts, routing recommendations

**Emergency Response (General):**

- Streams: Alerts, resource status, location data
- Join by: Incident ID
- AI: Severity assessment, resource allocation
- Output: Dispatch recommendations, resource routing

---

## 5. Code Extraction Guide

### 5.1 Extracting Kafka Helpers

**Files to Extract:**

- `kafka_consumer_helper.py`
- `kafka_producer_helper.py`

**What to Change:**

- Remove NeuroPulse-specific naming
- Make config paths configurable
- Add support for other Kafka providers (not just Confluent)

**Result:** Generic Kafka helper library

---

### 5.2 Extracting Stream Joiner

**Files to Extract:**

- Stream joining logic from `stream_processor.py`
- State management pattern

**What to Change:**

- Make join key configurable
- Make stream sources configurable
- Extract to separate class/module

**Result:** Reusable multi-stream joiner library

---

### 5.3 Extracting WebSocket Pattern

**Files to Extract:**

- `api_server.py` WebSocket implementation
- `useWebSocket.ts` React hook

**What to Change:**

- Make message types configurable
- Generic state update pattern
- Configurable reconnection logic

**Result:** Reusable WebSocket + REST hybrid library

---

## 6. Implementation Examples

### 6.1 Using Kafka Helpers in Another Project

```python
# In your project
from kafka_helpers import load_kafka_config, create_kafka_consumer

# Configure for your Kafka cluster
config = load_kafka_config("my_kafka_config.ini")

# Create consumer for your topics
consumer = create_kafka_consumer(
    config, 
    topics=["my-topic-1", "my-topic-2"],
    group_id="my-consumer-group"
)

# Use in your stream processor
while True:
    msg = consumer.poll(timeout=1.0)
    if msg:
        process_message(msg)
```

### 6.2 Using Multi-Stream Joiner

```python
# In your project
from stream_joiner import MultiStreamJoiner

joiner = MultiStreamJoiner(
    join_key="user_id",
    required_streams=["transactions", "user_profile"],
    optional_streams=["risk_signals"]
)

# Process events from different topics
joiner.process_event("transactions", transaction_event)
joiner.process_event("user_profile", profile_event)

# Get complete joined record when ready
if joiner.is_complete("user_123"):
    complete_record = joiner.get_joined_record("user_123")
    process_fraud_detection(complete_record)
```

### 6.3 Using WebSocket Pattern

```typescript
// In your React app
import { useWebSocket } from '@your-org/realtime-hooks';

function MyDashboard() {
  const { connected, data } = useWebSocket({
    url: 'ws://api.example.com/ws',
    fallbackUrl: 'http://api.example.com/api/data',
    onMessage: (msg) => {
      // Handle real-time updates
    }
  });
  
  return <div>{connected ? 'Live' : 'Polling'}</div>;
}
```

---

## 7. Contributing Reusable Components

If you extract and generalize components from NeuroPulse:

1. **Document the extraction** - What was changed, what's generic
2. **Create examples** - Show usage in different domains
3. **Add tests** - Ensure it works outside NeuroPulse context
4. **Consider open source** - Share with the community

---

## 8. Summary

**Highly Reusable:**

- ✅ Kafka consumer/producer helpers
- ✅ Multi-stream joining pattern
- ✅ WebSocket + REST hybrid pattern
- ✅ Real-time state management
- ✅ Graceful degradation patterns

**Moderately Reusable (with adaptation):**

- ⚠️ Stream processor architecture (domain-specific logic)
- ⚠️ AI service integration (specific to Vertex AI + Gemini)
- ⚠️ Feature engineering (domain-specific features)

**Domain-Specific (but concepts reusable):**

- 📝 Stroke triage logic (but pattern applies to other triage)
- 📝 Medical terminology (but explainable AI pattern is reusable)
- 📝 Hospital routing (but optimization pattern is reusable)

---

## 9. Next Steps

1. **Identify your use case** - Which pattern applies?
2. **Extract relevant code** - Copy and adapt components
3. **Generalize** - Remove domain-specific logic
4. **Test** - Ensure it works in your context
5. **Document** - Help others reuse it

---

**Remember:** The architecture and patterns are more valuable than the domain-specific implementation. The concepts of real-time streaming, multi-source fusion, and AI inference apply far beyond healthcare.
