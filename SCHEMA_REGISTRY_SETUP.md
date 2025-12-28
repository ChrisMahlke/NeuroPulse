# Schema Registry & Flink AI Setup Guide

This guide walks through setting up Schema Registry and Flink AI integration for NeuroPulse - the **critical differentiator** for winning the Confluent Challenge Hackathon.

## Why This Matters for the Hackathon

**Schema Registry + Flink AI = WINNING COMBINATION**

- ✅ **Advanced Platform Usage**: Most entries won't use Flink AI
- ✅ **True "AI on Data in Motion"**: AI inference happens IN the stream processing layer
- ✅ **Production-Ready Architecture**: Schema governance + platform-native AI
- ✅ **Confluent + Google Cloud Integration**: Shows both platforms working together
- ✅ **Judges Will Notice**: Demonstrates deep understanding of Confluent Cloud capabilities

## Prerequisites

1. **Confluent Cloud Account** with:
   - Kafka cluster running
   - Schema Registry enabled
   - Flink compute pool created
   
2. **Google Cloud Project** with:
   - Vertex AI API enabled
   - Service account with Vertex AI permissions
   
3. **Environment Variables**:
   ```bash
   # Confluent Cloud
   export SCHEMA_REGISTRY_URL="https://your-sr-endpoint.confluent.cloud"
   export SCHEMA_REGISTRY_API_KEY="your-sr-api-key"
   export SCHEMA_REGISTRY_API_SECRET="your-sr-api-secret"
   
   # Google Cloud (for Flink AI)
   export GOOGLE_CLOUD_PROJECT="your-gcp-project-id"
   export GOOGLE_CLOUD_LOCATION="us-central1"
   export GEMINI_API_KEY="your-gemini-api-key"
   ```

## Step 1: Register Schemas with Schema Registry

Schema Registry is **required** for Flink to read from Kafka topics.

### 1.1 Get Schema Registry Credentials

1. Go to Confluent Cloud Console
2. Navigate to your environment → **Schema Registry**
3. Click **"API credentials"** → Create new API key
4. Save the API key and secret

### 1.2 Set Environment Variables

```bash
export SCHEMA_REGISTRY_URL="https://psrc-xxxxx.us-east-2.aws.confluent.cloud"
export SCHEMA_REGISTRY_API_KEY="YOUR_KEY_HERE"
export SCHEMA_REGISTRY_API_SECRET="YOUR_SECRET_HERE"
```

### 1.3 Install Dependencies

```bash
pip install requests
```

### 1.4 Register All Schemas

```bash
python3 schemas/register_schemas.py
```

Expected output:
```
✅ Registered schema for subject 'ems.vitals.raw-value' (ID: 100001)
✅ Registered schema for subject 'ems.fast.exam-value' (ID: 100002)
✅ Registered schema for subject 'hospital.capacity-value' (ID: 100003)
✅ Registered schema for subject 'ai.prediction.output-value' (ID: 100004)
```

### 1.5 Verify Registration

Go to Confluent Cloud Console → Schema Registry → Subjects to see your registered schemas.

## Step 2: Configure Flink SQL Workspace

### 2.1 Create Flink Compute Pool

1. Go to Confluent Cloud Console
2. Navigate to **Flink** → **Compute Pools**
3. Create a new compute pool (or use existing)
4. Note the compute pool name

### 2.2 Open Flink SQL Workspace

1. Click **"SQL Workspace"**
2. Select your Kafka cluster
3. Select your compute pool

## Step 3: Create Flink Tables

Run the queries from `stream-processing/flink/setup_queries.sql`:

```sql
-- Create table for EMS vitals (reads from Kafka with Schema Registry)
CREATE TABLE `ems.vitals.raw` (
    case_id STRING,
    patient_id STRING,
    event_ts STRING,
    heart_rate_bpm DOUBLE,
    systolic_bp_mmHg DOUBLE,
    gcs_total DOUBLE,
    -- ... other fields
    event_ts_parsed AS CAST(event_ts AS TIMESTAMP(3)),
    WATERMARK FOR event_ts_parsed AS event_ts_parsed - INTERVAL '5' SECOND
) WITH (
    'connector' = 'confluent',
    'scan.startup.mode' = 'latest-offset'
);
```

The `'connector' = 'confluent'` automatically uses Schema Registry!

## Step 4: Set Up Flink AI Integration

### 4.1 Register Vertex AI Model in Flink

```sql
CREATE MODEL vertex_ai_stroke_predictor
WITH (
  'provider' = 'vertex-ai',
  'project' = 'your-gcp-project-id',
  'location' = 'us-central1',
  'endpoint' = 'your-vertex-ai-endpoint-id',
  'input.columns' = 'heart_rate_bpm,systolic_bp_mmHg,gcs_total,fast_score',
  'output.columns' = 'stroke_probability,lvo_probability'
);
```

### 4.2 Create AI Prediction Query

```sql
-- Real-time AI predictions IN Flink
INSERT INTO `ai.predictions.flink`
SELECT
    v.case_id,
    v.patient_id,
    predictions.stroke_probability,
    predictions.lvo_probability,
    CURRENT_TIMESTAMP as prediction_ts
FROM `ems.vitals.raw` v
INNER JOIN `ems.fast.exam` f
  ON v.case_id = f.case_id
  AND v.event_ts_parsed BETWEEN f.exam_ts - INTERVAL '30' SECOND 
                             AND f.exam_ts + INTERVAL '30' SECOND
CROSS JOIN LATERAL TABLE(
  ML_PREDICT(
    vertex_ai_stroke_predictor,
    v.heart_rate_bpm,
    v.systolic_bp_mmHg,
    v.gcs_total,
    f.fast_score
  )
) AS predictions;
```

This is **THE GAME CHANGER** - AI inference happening directly in Flink SQL!

## Step 5: Update Python Processors (Optional)

With Flink AI handling predictions, the Python processor can focus on:
- Adding Gemini explanations
- Hospital routing logic
- Publishing to dashboard

## Verification

### Check Schema Registry
```bash
curl -u "$SCHEMA_REGISTRY_API_KEY:$SCHEMA_REGISTRY_API_SECRET" \
  "$SCHEMA_REGISTRY_URL/subjects"
```

### Check Flink Tables
```sql
SHOW TABLES;
```

### Check Flink Models
```sql
SHOW MODELS;
```

### View Live Data
```sql
SELECT * FROM `ems.vitals.raw` LIMIT 10;
```

## Troubleshooting

**Schema not found**: Make sure schemas are registered with correct subject names (topic-value)

**Flink can't read topic**: Verify Schema Registry credentials are configured in Flink

**Vertex AI errors**: Check GCP project ID, location, and endpoint ID

## Next Steps

1. ✅ Register schemas (this guide)
2. ✅ Create Flink tables
3. ✅ Set up Flink AI model
4. ✅ Deploy streaming query
5. 📹 Record demo video showing Flink AI in action
6. 🏆 Submit winning hackathon entry!


