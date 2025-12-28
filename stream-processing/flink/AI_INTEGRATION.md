# Flink AI Integration - Winning Strategy

This guide shows how to use **Confluent Cloud Flink's built-in AI functions** to call Vertex AI directly from Flink SQL, demonstrating true "AI on data in motion."

## Why This Wins the Hackathon

**Current Approach (Good):**
- Python consumes Kafka → Calls Vertex AI → Publishes predictions

**Flink AI Approach (WINNING):**
- Flink SQL reads Kafka → Calls Vertex AI via ML_PREDICT → Publishes predictions
- **AI inference happens IN the stream processing layer**
- Demonstrates advanced Confluent platform capabilities
- Shows "AI on data in motion" at the platform level

## Architecture

```
ems.vitals.raw → Flink Table → ML_PREDICT(Vertex AI) → ai.prediction.output
```

Instead of:
```
ems.vitals.raw → Python Processor → Vertex AI → ai.prediction.output
```

## Prerequisites

1. **Vertex AI Endpoint** (or use heuristics for demo)
2. **GCP Project ID** and credentials
3. **Flink Compute Pool** (already created)
4. **Confluent Cloud Flink** with AI functions enabled

## Step 1: Create Vertex AI Model in Flink

According to [Confluent Cloud AI documentation](https://docs.confluent.io/cloud/current/ai/overview.html), you can register Vertex AI models using CREATE MODEL:

```sql
CREATE MODEL vertex_ai_stroke_model
WITH (
  'model.type' = 'vertex_ai',
  'vertex_ai.project_id' = 'YOUR_GCP_PROJECT_ID',
  'vertex_ai.location' = 'us-central1',
  'vertex_ai.endpoint_id' = 'YOUR_ENDPOINT_ID'
);
```

**Note:** If you don't have a Vertex AI endpoint deployed, you can:
- Use the heuristic-based predictions (already implemented in Python)
- Or deploy a simple Vertex AI model for demo purposes

## Step 2: Create Feature Engineering View

Transform raw vitals into feature vectors for the model:

```sql
CREATE VIEW stroke_features AS
SELECT
    case_id,
    patient_id,
    event_ts,
    -- Vitals features
    CAST(heart_rate_bpm AS DOUBLE) AS heart_rate_bpm,
    CAST(systolic_bp_mmHg AS DOUBLE) AS systolic_bp_mmHg,
    CAST(spo2_pct AS DOUBLE) AS spo2_pct,
    CAST(gcs_total AS DOUBLE) AS gcs_total,
    -- Add more features as needed
    CAST(sequence_number AS BIGINT) AS sequence_number
FROM `ems.vitals.raw`
WHERE heart_rate_bpm IS NOT NULL;
```

## Step 3: Call Vertex AI from Flink SQL

Use ML_PREDICT to call Vertex AI on streaming data:

```sql
CREATE TABLE `ai.prediction.output` (
    case_id STRING,
    patient_id STRING,
    event_ts TIMESTAMP(3),
    stroke_probability DOUBLE,
    lvo_probability DOUBLE,
    prediction_ts TIMESTAMP(3)
) WITH (
    'connector' = 'confluent'
);

INSERT INTO `ai.prediction.output`
SELECT
    f.case_id,
    f.patient_id,
    CAST(f.event_ts AS TIMESTAMP(3)) AS event_ts,
    ML_PREDICT(vertex_ai_stroke_model, 
        ARRAY[
            f.heart_rate_bpm,
            f.systolic_bp_mmHg,
            f.spo2_pct,
            f.gcs_total
        ]
    ) AS predictions,
    CURRENT_TIMESTAMP AS prediction_ts
FROM stroke_features f;
```

## Step 4: Update Python Processor

The Python processor can now consume pre-computed predictions from Flink:

```python
# Consume from ai.prediction.output (Flink-generated)
# Add Gemini explanations
# Publish to dashboard
```

## Benefits for Hackathon

1. **Advanced Platform Usage**: Demonstrates Flink AI functions (not just basic Kafka)
2. **True "AI on Data in Motion"**: AI inference in stream processing layer
3. **Confluent + Google Cloud Integration**: Shows both platforms working together
4. **Production-Ready Architecture**: Platform-native AI inference
5. **Differentiator**: Most entries won't use Flink AI functions

## Implementation Notes

- **If Vertex AI endpoint not available**: Use heuristics in Flink UDF or keep Python fallback
- **Schema Registry**: May still need Avro schemas for `confluent` connector
- **Alternative**: Use Flink's REST connector to call Vertex AI API directly

## Next Steps

1. Test CREATE MODEL with your GCP credentials
2. Implement ML_PREDICT query
3. Verify predictions are generated
4. Update Python processor to consume Flink predictions
5. Update hackathon submission

This approach showcases the most advanced Confluent platform capabilities!

