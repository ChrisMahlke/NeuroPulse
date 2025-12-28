# NeuroPulse Application Description

## What NeuroPulse Does

NeuroPulse is a **real-time AI-powered stroke triage and hospital routing system** that processes streaming emergency medical data to make critical routing decisions while patients are still in transit. The system ingests continuous vital signs, neurological exam results, and hospital capacity data through Confluent Cloud Kafka, applies Google Cloud AI (Vertex AI and Gemini) to predict stroke severity and recommend optimal hospital destinations, and surfaces these insights in a real-time dashboard that updates every second.

### Core Functionality

**Real-Time Data Processing:**
- Ingests streaming EMS vital signs (heart rate, blood pressure, SpO2, Glasgow Coma Scale, blood glucose) from Kafka topics
- Receives FAST (Face, Arm, Speech, Time) stroke screening exam results
- Monitors hospital capacity and capability data in real-time
- Joins multiple independent data streams to create complete patient context

**AI-Powered Predictions:**
- Uses Google Cloud Vertex AI to predict stroke probability (0.0-1.0) and Large Vessel Occlusion (LVO) probability
- Predictions update adaptively as new vital signs arrive—demonstrating true "AI on data in motion"
- Categorizes risk levels (LOW, MODERATE, HIGH, CRITICAL) based on clinical thresholds
- Calculates prediction confidence scores based on data completeness and quality

**Intelligent Routing:**
- Recommends optimal hospital destinations based on:
  - Predicted stroke severity (primary vs. comprehensive stroke center)
  - Hospital capabilities (thrombectomy availability, stroke team readiness)
  - Real-time capacity (bed availability, wait times)
  - Estimated door-to-needle times
- Updates routing recommendations dynamically as patient condition or hospital capacity changes

**Explainable AI:**
- Uses Google Gemini to generate natural language explanations of predictions
- Provides clinical reasoning for risk categorizations
- Offers actionable recommendations for EMS and dispatch centers
- Explanations update continuously as predictions evolve

**Real-Time Visualization:**
- Web-based dashboard showing all active stroke cases
- Live updates via WebSocket (sub-second latency)
- Visual indicators for risk levels, prediction confidence, and routing recommendations
- Historical vital sign trends and prediction evolution over time

### Technical Architecture

**Data Flow:**
```
[EMS Devices] → [Confluent Kafka] → [Stream Processor] → [Vertex AI + Gemini] → [Dashboard]
     ↓                ↓                    ↓                      ↓                  ↓
  Vitals         Real-time          Multi-stream          AI Predictions    Live Updates
  FAST Exam      Streaming          Joins                 Explanations       Every Second
  Hospital       Topics             Feature Engineering   Recommendations
```

**Key Technologies:**
- **Confluent Cloud Kafka**: Real-time data streaming platform
- **Google Cloud Vertex AI**: ML model for stroke/LVO probability prediction
- **Google Gemini**: Large language model for natural language explanations
- **Python**: Stream processing and API server
- **Next.js/TypeScript**: Real-time web dashboard
- **WebSocket**: Real-time bidirectional communication

## Intended Users

### Primary Users

**1. Emergency Medical Services (EMS) Personnel**
- **Paramedics and EMTs** in the field collecting vital signs and performing FAST exams
- **EMS Supervisors** monitoring multiple active cases and coordinating resources
- **Use Case**: Receive real-time stroke risk assessments and routing recommendations while patient is in transit, enabling informed decisions about hospital destination before arrival

**2. Emergency Dispatch Centers**
- **Dispatch Coordinators** managing ambulance routing and hospital assignments
- **Medical Directors** overseeing triage protocols and routing decisions
- **Use Case**: Access real-time dashboard showing all active stroke cases, predicted severity, and recommended destinations to optimize routing decisions across multiple concurrent emergencies

**3. Hospital Emergency Departments**
- **ED Physicians** preparing for incoming stroke patients
- **Stroke Coordinators** managing stroke team activation and resource allocation
- **Use Case**: Receive advance notification of incoming high-risk stroke patients, predicted severity, and estimated arrival times to activate appropriate resources (stroke team, imaging, interventional radiology) before patient arrival

### Secondary Users

**4. Healthcare System Administrators**
- **Quality Improvement Teams** analyzing stroke care outcomes and routing efficiency
- **Administrators** monitoring system performance and resource utilization
- **Use Case**: Review historical data, identify patterns in routing decisions, and optimize stroke care protocols

**5. Clinical Researchers**
- **Stroke Researchers** studying real-time prediction accuracy and clinical outcomes
- **Data Scientists** analyzing streaming data patterns and model performance
- **Use Case**: Access anonymized streaming data and prediction results to improve stroke triage algorithms and validate AI model performance

### User Workflows

**EMS Paramedic Workflow:**
1. Patient presents with potential stroke symptoms
2. Paramedic performs FAST exam and collects vital signs
3. Data streams to NeuroPulse via Kafka
4. System generates real-time stroke probability prediction
5. Paramedic receives routing recommendation on mobile device or radio
6. Ambulance proceeds to recommended hospital based on AI-driven guidance

**Dispatch Center Workflow:**
1. Multiple stroke cases active simultaneously
2. Dispatcher views real-time dashboard showing all cases
3. System displays predicted severity, recommended destinations, and hospital capacity
4. Dispatcher makes informed routing decisions, potentially rerouting based on changing conditions
5. System updates continuously as new data arrives

**Hospital ED Workflow:**
1. Hospital receives advance notification of incoming high-risk stroke patient
2. ED physician reviews predicted stroke probability and LVO risk
3. Stroke team activated based on predicted severity
4. Appropriate resources (imaging, interventional radiology) prepared before arrival
5. Patient arrives with team ready, reducing door-to-needle time

## Problem Statement

**The Critical Challenge:**
Every minute of stroke delay kills approximately 1.9 million brain cells. For large vessel occlusions, every 15-minute delay reduces the probability of functional independence by roughly 10%. Current emergency stroke care relies on static protocols and delayed communication, resulting in:
- Patients routed to hospitals without necessary capabilities (e.g., thrombectomy)
- Delayed activation of stroke teams and resources
- Suboptimal routing decisions based on incomplete or outdated information
- Time lost during transport and hospital preparation

**How NeuroPulse Solves It:**
- **Real-time intelligence**: Makes predictions as data streams in, not after the fact
- **Adaptive decision-making**: Predictions and recommendations update continuously as patient condition evolves
- **Multi-stream context**: Joins vitals, exams, and hospital data to create complete picture
- **Sub-second latency**: From vital sign to AI prediction to dashboard update in <2 seconds
- **Explainable recommendations**: AI provides clinical reasoning, not just predictions

## Key Differentiators

1. **AI on Data in Motion**: Predictions happen in real-time as events occur, not on historical batches
2. **Adaptive Intelligence**: Each new vital sign triggers recalculation—predictions evolve with the patient
3. **Multi-Stream Integration**: Joins independent Kafka streams to create comprehensive context
4. **Explainable AI**: Natural language explanations help clinicians understand and trust AI recommendations
5. **Production-Ready Architecture**: Built on enterprise platforms (Confluent Cloud, Google Cloud) with proper error handling, fallbacks, and scalability

## Use Cases

**Use Case 1: High-Risk Stroke Detection**
- Patient presents with FAST score of 3 and declining GCS
- System immediately predicts HIGH stroke probability and CRITICAL LVO risk
- Recommends routing directly to comprehensive stroke center (bypassing primary center)
- Saves 15-30 minutes of transport time, potentially preserving functional independence

**Use Case 2: Dynamic Routing Adjustment**
- Patient initially shows MODERATE risk, routed to primary stroke center
- En route, GCS drops and SpO2 declines
- System updates prediction to HIGH risk, detects LVO probability increase
- Dispatch reroutes to comprehensive center before arrival at primary center
- Prevents unnecessary stop and transfer, saving critical time

**Use Case 3: Resource Optimization**
- Multiple stroke cases active simultaneously
- System shows predicted severity and hospital capacity for each
- Dispatch optimizes routing to balance patient needs with hospital capacity
- Ensures high-risk patients go to comprehensive centers while moderate-risk patients use primary centers efficiently

## Technical Context

**For Developers/Engineers:**
- Built with Python for stream processing, FastAPI for REST/WebSocket API
- Uses Confluent Cloud Kafka for real-time data streaming
- Integrates Google Cloud Vertex AI for ML predictions and Gemini for explanations
- Frontend built with Next.js, TypeScript, React, Material-UI
- Real-time updates via WebSocket with sub-second latency
- Designed for scalability and production deployment

**For Healthcare Professionals:**
- All data is synthetic—for demonstration and development only
- Not intended for clinical use without proper validation and regulatory approval
- Designed to augment, not replace, clinical judgment
- Emphasizes explainability and transparency in AI recommendations

---

**Note**: This application is designed for the Confluent Challenge Hackathon to demonstrate real-time data streaming and AI integration. It showcases how modern streaming platforms and AI services can transform emergency healthcare decision-making.

