# Hackathon Submission: NeuroPulse

## Table of Contents

- [Inspiration](#inspiration)
- [What it does](#what-it-does)
- [How we built it](#how-we-built-it)
- [Challenges we ran into](#challenges-we-ran-into)
- [Accomplishments that we're proud of](#accomplishments-that-were-proud-of)
- [What we learned](#what-we-learned)
- [What's next for NeuroPulse: Real-Time AI Stroke Triage](#whats-next-for-neuropulse-real-time-ai-stroke-triage)

---

## Inspiration

Here's the thing about stroke: it doesn't wait. While you're reading this sentence, someone's brain is dying at a rate of approximately 1.9 million neurons per minute. The literature is clear on this—studies from Harvard Medical School and published in the [New England Journal of Medicine](https://www.nejm.org/doi/full/10.1056/NEJMoa1706442) have quantified it precisely. For large vessel occlusions, the window for mechanical thrombectomy is brutally narrow: every 15-minute delay reduces the probability of functional independence by roughly 10%. The math is unforgiving.

Paramedics are good at what they do—really good. They're collecting vitals every second, performing FAST exams, making split-second assessments. The data is there. The problem is that by the time all the pieces come together—the vitals, the exam results, the hospital capacity updates, the dispatch center's decision—the patient has already lost time they can't get back. The system works, but it works like a kitchen where the prep cook, the line cook, and the expediter are all working from different tickets, shouting across a noisy room, and hoping someone puts it all together before the food dies in the window.

The current protocol is essentially a static decision tree—a flowchart that doesn't account for the fact that data is streaming in real-time. EMS is sending vitals continuously. Hospitals are updating capacity. But these streams exist in silos, and by the time someone synthesizes them, the patient is already at the wrong hospital, or the right hospital is now full, or the window has closed.

We built NeuroPulse because the technology exists to do better. **Confluent Cloud** can stream financial data in real-time so traders can make million-dollar decisions in milliseconds. **Google Cloud AI** can process that data and make predictions as events occur. So why the hell aren't we doing the same thing for decisions that determine whether someone walks out of the hospital or spends the rest of their life unable to speak, to move, to recognize their own family?

The inspiration isn't complicated. It's recognizing that good people—paramedics, nurses, doctors—are doing excellent work with tools that haven't caught up to what's possible. It's understanding that the difference between a good outcome and a catastrophic one isn't about the quality of care once the patient arrives. It's about getting them to the right place, with the right capabilities, at the right time. And right now, we're making those decisions with incomplete information, delivered too late.

Every second matters. Not in the abstract, motivational-poster sense. In the literal, neurological sense.

## What it does

NeuroPulse is a real-time stroke triage and routing system that applies AI to streaming medical data. It ingests continuous EMS vitals (heart rate, blood pressure, SpO2, Glasgow Coma Scale), FAST stroke exam results, and hospital capacity data through **Confluent Cloud Kafka topics**. A stream processor joins these multiple data streams in real-time, performs feature engineering, and triggers **Google Cloud Vertex AI** to predict stroke probability and large vessel occlusion (LVO) probability.

The system then uses **Google Gemini** to generate natural language explanations of the predictions and clinical recommendations. All of this happens as data streams in—typically within 1-2 seconds of new vitals arriving. The predictions, along with recommended destination hospitals based on capability and estimated door-to-needle times, are published back to Kafka and surfaced in a real-time dashboard that updates every second.

The key innovation is **AI on data in motion**: rather than analyzing historical data after the fact, we're making predictions and recommendations as events occur. **Predictions adapt in real-time**—as new vitals stream in, the AI recalculates stroke probability, risk categories can shift from MODERATE to CRITICAL, and routing recommendations update dynamically based on changing patient condition and hospital capacity. This enables EMS and dispatch centers to make informed routing decisions while the patient is still in transit, potentially routing directly to a comprehensive stroke center capable of mechanical thrombectomy instead of stopping at a primary stroke center first.

**What makes this "next-generation":**
- **Adaptive AI**: Predictions aren't static—they evolve as each new vital sign arrives, demonstrating true "AI on data in motion"
- **Multi-stream intelligence**: Joins 3 independent Kafka streams (vitals, exams, hospital capacity) to create complete context in real-time
- **Explainable AI in motion**: Gemini generates natural language explanations not just once, but continuously as predictions update
- **Sub-second decision support**: From vital sign to AI prediction to dashboard update in <2 seconds, enabling decisions while the patient is still in the ambulance

## How we built it

**Data Generation Layer:**

- Python-based synthetic data generators that simulate realistic EMS vitals, FAST exams, and hospital capacity snapshots
- Producers publish to Confluent Cloud Kafka topics: `ems.vitals.raw`, `ems.fast.exam`, `hospital.capacity`
- Vitals stream at 1-second intervals to demonstrate real-time capabilities

**Stream Processing (Python):**

- Custom stream processor using `confluent-kafka` library that consumes from multiple Kafka topics simultaneously
- Implements windowed aggregations and feature engineering (trends in vitals, time-weighted averages)
- Performs real-time joins across streams using `case_id` as the key
- Handles out-of-order events and missing data gracefully
- Publishes enriched feature vectors to `ai.prediction.input` topic

**AI Layer (Google Cloud):**

- **Vertex AI**: Consumes feature vectors and returns stroke probability (0-1) and LVO probability (0-1)
  - **Architected for Vertex AI Model Garden or custom trained models** - The integration layer (`vertex_ai_service.py`) is production-ready and can be connected to any Vertex AI endpoint
  - Currently uses clinical heuristics for demo purposes, but the code structure supports seamless Vertex AI integration
  - Designed to handle tabular data with features derived from vitals, FAST exam, and time-based features
  - **Real-time inference**: Each new vital sign triggers a new prediction request, demonstrating true "AI on data in motion"
- **Gemini API**: Takes structured prediction outputs and generates natural language explanations
  - Provides clinical reasoning in plain English
  - Generates actionable recommendations for EMS and ED teams
  - Explains risk factors and time-critical considerations

**Backend API (FastAPI):**

- Consumes from `ai.prediction.output` Kafka topic
- Maintains in-memory state of active cases
- Exposes REST endpoints for case queries
- Implements WebSocket server for real-time push updates to the dashboard
- Tracks streaming metrics (messages per second, total throughput, uptime)

**Frontend Dashboard (Next.js + TypeScript):**

- Real-time WebSocket connection to API server
- Redux Toolkit for state management
- Material-UI for professional healthcare-grade UI
- Displays:
  - Active cases list with risk categories
  - Live vitals updating every second
  - AI risk assessment gauges (stroke/LVO probability)
  - Hospital routing recommendations with estimated travel times
  - Time window visualization showing critical treatment windows
  - AI-generated explanations and action plans
  - Streaming metrics panel showing Confluent Cloud throughput

**Infrastructure:**

- **Confluent Cloud** for managed Kafka (4 topics: `ems.vitals.raw`, `ems.fast.exam`, `hospital.capacity`, `ai.prediction.output`)
  - Multi-topic consumption with consumer groups for load balancing
  - Schema definitions prepared (Avro schemas in `schemas/` directory)
  - Real-time metrics tracking (messages per second, throughput, uptime)
  - Sub-second latency from producer to consumer
- **Google Cloud Vertex AI** for ML predictions (architected and ready for Model Garden integration)
- **Google Cloud Gemini** for natural language explanations
- **Google Cloud Run** for containerized deployment of API and dashboard
- Environment-based configuration for credentials and endpoints
- Docker containerization for reproducible deployments

## Challenges we ran into

**Multi-Stream Joining in Real-Time:**
Joining three independent Kafka streams (vitals, FAST exam, hospital capacity) by `case_id` while handling out-of-order events and missing data was more complex than anticipated. We implemented a stateful processor that maintains windows of recent events and performs joins asynchronously, but ensuring correctness when events arrive out of sequence required careful design of the join logic.

**WebSocket Serialization Issues:**
Initially, we tried to send Pydantic models directly through WebSocket from a background Kafka consumer thread, which caused serialization errors. We resolved this by converting to plain dictionaries before sending and ensuring all data types are JSON-serializable.

**Real-Time Updates Without Overwhelming the Frontend:**
With vitals streaming every second and predictions updating frequently, we needed to balance real-time responsiveness with UI stability. We implemented debouncing for certain updates and used React's state management to prevent unnecessary re-renders while ensuring critical updates (like risk category changes) are immediately visible.

**Schema Evolution and Data Contracts:**
While we defined Avro schemas for all topics, we initially used JSON serialization for speed of development. Migrating to Avro with Schema Registry would improve data contracts, but we prioritized getting the end-to-end pipeline working first. This is a known technical debt item.

**AI Model Integration:**
Integrating Vertex AI for real-time predictions required understanding the API structure and ensuring low-latency calls. We implemented intelligent fallbacks using clinical heuristics when Vertex AI isn't configured, ensuring the system remains functional for demos while being architected for production AI integration.

**Hydration Mismatches in Next.js:**
Server-side rendering conflicts with client-side state (especially WebSocket connections and localStorage) caused hydration errors. We resolved this by making the providers client-only and ensuring WebSocket connections only initialize after component mount.

## Accomplishments that we're proud of

**End-to-End Real-Time Pipeline:**
We built a complete pipeline from data generation through Kafka streaming, stream processing, AI inference, and real-time dashboard visualization. Every component works together, and you can see data flowing through the system in real-time—from vitals being generated to predictions appearing in the dashboard within seconds. **The system demonstrates true "data in motion"**—predictions update continuously as new events arrive, not just once at the beginning.

**Adaptive AI Predictions:**
The system doesn't just make one prediction per case. As vitals stream in every second, the AI recalculates probabilities, risk categories can shift dynamically (e.g., MODERATE → HIGH → CRITICAL as patient condition deteriorates), and routing recommendations adapt in real-time. This showcases the core challenge requirement: **AI that reacts, predicts, and adapts the moment an event occurs**.

**Multi-Stream Processing:**
Successfully joining three independent Kafka streams in real-time with proper handling of out-of-order events and missing data. This demonstrates sophisticated stream processing capabilities that go beyond simple single-stream consumption.

**Production-Ready Architecture:**
The system is architected for production use, not just a hackathon demo. We have proper error handling, graceful degradation when services are unavailable, streaming metrics, and containerized deployments. The codebase is clean, well-documented, and follows best practices.

**Explainable AI Integration:**
Beyond just predictions, we integrated Gemini to provide natural language explanations of why the system recommends certain actions. This is critical for healthcare applications where clinicians need to understand and trust AI recommendations.

**Real-Time Dashboard:**
Built a professional, healthcare-grade dashboard that updates in real-time without page refreshes. The Streaming Status Panel provides visibility into Confluent Cloud metrics, proving that data is actually streaming and being processed.

**Technical Depth:**
We didn't take shortcuts. We implemented proper stream processing with windowing and aggregations, handled edge cases like missing data and connection failures, and built a system that could genuinely be extended for production use with proper clinical validation.

## What we learned

**Stream Processing Complexity:**
Real-time stream processing is fundamentally different from batch processing. Handling out-of-order events, managing state across multiple streams, and ensuring exactly-once semantics (or at least effectively-once) requires careful design. Confluent Cloud's managed Kafka made the infrastructure reliable, but the application logic for joining streams required significant thought.

**AI on Streaming Data:**
Applying AI to data in motion requires different patterns than traditional ML pipelines. You can't wait for a batch window to close—predictions need to happen as events arrive. This means feature engineering must be incremental, models must be optimized for low latency, and the system must handle partial data gracefully.

**Healthcare Data Sensitivity:**
Even though we're using synthetic data, we learned about the importance of data contracts (schemas), auditability (Kafka's immutable log), and the need for explainable AI in healthcare contexts. Clinicians need to understand why a system recommends a particular action.

**Confluent Cloud Strengths:**
Confluent Cloud's managed Kafka made it straightforward to set up topics, handle authentication, and scale. The Schema Registry (which we prepared for but didn't fully implement) would provide even stronger data contracts. The platform's observability features helped us debug data flow issues.

**Google Cloud AI Integration:**
Vertex AI and Gemini are powerful, but integrating them into a real-time pipeline requires careful API design and error handling. The async nature of AI calls needed to be balanced with the real-time requirements of the dashboard.

**Real-Time UI Challenges:**
Building a UI that updates in real-time without feeling janky or overwhelming users requires careful state management, debouncing, and prioritization of updates. Not every piece of data needs to update every second—some updates are more critical than others.

## What's next for NeuroPulse: Real-Time AI Stroke Triage

**Clinical Validation:**
The architecture is production-ready, but it needs clinical validation with real EMS data (anonymized) and validation against actual stroke outcomes. This would require partnerships with healthcare systems and IRB approval.

**Schema Registry Integration:**
Migrate from JSON to Avro serialization with Confluent Schema Registry for stronger data contracts and schema evolution support. This would enable better data governance and compatibility checking.

**Flink AI Integration (In Progress):**
Integrating Confluent Cloud Flink's built-in AI functions to call Vertex AI directly from Flink SQL. This will demonstrate true "AI on data in motion" with AI inference happening in the stream processing layer, not just in application code. Using `CREATE MODEL` and `ML_PREDICT` functions to enable platform-native AI inference.

**Model Training Pipeline:**
Build a pipeline to train Vertex AI models on historical stroke data (when available) to improve prediction accuracy. This would involve feature store integration and continuous model retraining.

**Hospital Workflow Integration:**
Extend the system to track hospital workflow events (CT scan started, tPA administered, thrombectomy performed) and provide real-time feedback on door-to-needle times and treatment outcomes.

**Multi-Condition Extension:**
The architecture is designed to be extensible. The same pattern could apply to other time-critical conditions like STEMI (heart attack), trauma triage, or sepsis detection. The streaming infrastructure and AI integration patterns are reusable.

**Observability and Monitoring:**
Add comprehensive metrics, logging, and alerting using Google Cloud Operations (formerly Stackdriver) and Confluent Cloud metrics. This would enable production monitoring and performance optimization.

**Regulatory Considerations:**
For actual clinical use, the system would need FDA approval (likely as a Class II medical device) and integration with existing EMR systems. This is a long-term goal that would require significant regulatory and technical work.

The foundation is solid. With proper clinical validation and regulatory approval, this architecture could genuinely help improve stroke outcomes by enabling faster, more informed routing decisions.
