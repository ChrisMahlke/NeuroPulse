"""
NeuroPulse Stream Processing

Real-time stream processing service that:
- Consumes from Confluent Kafka topics (EMS vitals, FAST exams, hospital capacity)
- Joins streams and builds feature vectors
- Calls Vertex AI for stroke/LVO predictions
- Calls Gemini for explanations
- Publishes predictions back to Kafka
"""

