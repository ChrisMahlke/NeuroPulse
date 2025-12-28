-- ============================================================================
-- NeuroPulse Flink SQL Setup Queries
-- ============================================================================
-- This file contains all Flink SQL queries needed to set up advanced stream
-- processing for NeuroPulse using Confluent Cloud for Apache Flink.
--
-- Prerequisites:
-- 1. Confluent Cloud account with Flink enabled
-- 2. Topics created: ems.vitals.raw, ems.fast.exam, hospital.capacity
-- 3. Access to Flink SQL editor (Confluent Cloud web UI)
--
-- IMPORTANT: Replace placeholders in the queries below:
--   - YOUR_BOOTSTRAP_SERVERS: Your Confluent Cloud Kafka bootstrap servers
--   - YOUR_API_KEY: Your Confluent Cloud API key
--   - YOUR_API_SECRET: Your Confluent Cloud API secret
--
-- To get these values, run:
--   python3 stream-processing/flink/connection_helper.py
--
-- Or check your confluent_config.ini file
--
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop Existing Objects (for re-running setup)
-- ============================================================================

DROP TABLE IF EXISTS `ems.vitals.enriched`;
DROP VIEW IF EXISTS spo2_anomaly_detection;
DROP VIEW IF EXISTS gcs_anomaly_detection;
DROP VIEW IF EXISTS vitals_trends;
DROP VIEW IF EXISTS vitals_windowed_30s;
DROP TABLE IF EXISTS `hospital.capacity`;
DROP TABLE IF EXISTS `ems.fast.exam`;
DROP TABLE IF EXISTS `ems.vitals.raw`;

-- ============================================================================
-- STEP 2: Create Flink Tables from Kafka Topics
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1: EMS Vitals Raw Table
-- Reads from ems.vitals.raw topic
-- ----------------------------------------------------------------------------
CREATE TABLE `ems.vitals.raw` (
    case_id STRING,
    patient_id STRING,
    ems_unit_id STRING,
    event_ts STRING,
    sequence_number DOUBLE,
    heart_rate_bpm DOUBLE,
    systolic_bp_mmHg DOUBLE,
    diastolic_bp_mmHg DOUBLE,
    respiratory_rate_bpm DOUBLE,
    spo2_pct DOUBLE,
    temperature_c DOUBLE,
    gcs_total DOUBLE,
    blood_glucose_mg_dL DOUBLE,
    is_artifact_suspected BOOLEAN,
    source_device STRING,
    event_ts_parsed AS CAST(event_ts AS TIMESTAMP(3)),
    WATERMARK FOR event_ts_parsed AS event_ts_parsed - INTERVAL '5' SECOND
) WITH (
    'connector' = 'confluent',
    'scan.startup.mode' = 'latest-offset'
);

-- ----------------------------------------------------------------------------
-- 2.2: EMS FAST Exam Table
-- Reads from ems.fast.exam topic
-- ----------------------------------------------------------------------------
CREATE TABLE `ems.fast.exam` (
    case_id STRING,
    patient_id STRING,
    ems_unit_id STRING,
    exam_ts TIMESTAMP(3),
    face_droop STRING,
    arm_weakness STRING,
    speech_difficulty STRING,
    fast_score INT,
    ems_suspected_stroke BOOLEAN,
    suspected_stroke_side STRING,
    symptom_onset_ts TIMESTAMP(3),
    last_known_well_ts TIMESTAMP(3),
    prestroke_disability DOUBLE,
    notes STRING,
    WATERMARK FOR exam_ts AS exam_ts - INTERVAL '5' SECOND
) WITH (
    'connector' = 'confluent',
    'scan.startup.mode' = 'latest-offset'
);

-- ----------------------------------------------------------------------------
-- 2.3: Hospital Capacity Table
-- Reads from hospital.capacity topic
-- ----------------------------------------------------------------------------
CREATE TABLE `hospital.capacity` (
    hospital_id STRING,
    hospital_name STRING,
    latitude DOUBLE,
    longitude DOUBLE,
    stroke_center_level STRING,
    accepting_acute_stroke_now BOOLEAN,
    can_perform_mechanical_thrombectomy BOOLEAN,
    has_ct_available BOOLEAN,
    has_cta_available BOOLEAN,
    current_stroke_cases_in_ed INT,
    ed_crowding_score INT,
    estimated_additional_door_to_needle_minutes INT,
    updated_ts TIMESTAMP(3),
    notes STRING,
    WATERMARK FOR updated_ts AS updated_ts - INTERVAL '5' SECOND
) WITH (
    'connector' = 'confluent',
    'scan.startup.mode' = 'latest-offset'
);

-- ============================================================================
-- STEP 3: Windowed Aggregations
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3.1: 30-Second Tumbling Window Aggregations
-- Calculates rolling averages, min, max for vital signs
-- ----------------------------------------------------------------------------
CREATE VIEW vitals_windowed_30s AS
SELECT
    case_id,
    TUMBLE_START(event_ts_parsed, INTERVAL '30' SECOND) AS window_start,
    TUMBLE_END(event_ts_parsed, INTERVAL '30' SECOND) AS window_end,
    COUNT(*) AS reading_count,
    AVG(CAST(heart_rate_bpm AS DOUBLE)) AS avg_heart_rate,
    MIN(heart_rate_bpm) AS min_heart_rate,
    MAX(heart_rate_bpm) AS max_heart_rate,
    AVG(CAST(spo2_pct AS DOUBLE)) AS avg_spo2,
    MIN(spo2_pct) AS min_spo2,
    MAX(spo2_pct) AS max_spo2,
    AVG(CAST(gcs_total AS DOUBLE)) AS avg_gcs,
    MIN(gcs_total) AS min_gcs,
    MAX(gcs_total) AS max_gcs,
    AVG(CAST(systolic_bp_mmHg AS DOUBLE)) AS avg_systolic_bp,
    MIN(systolic_bp_mmHg) AS min_systolic_bp,
    MAX(systolic_bp_mmHg) AS max_systolic_bp
FROM `ems.vitals.raw`
WHERE heart_rate_bpm IS NOT NULL
  OR spo2_pct IS NOT NULL
  OR gcs_total IS NOT NULL
  OR systolic_bp_mmHg IS NOT NULL
GROUP BY case_id, TUMBLE(event_ts_parsed, INTERVAL '30' SECOND);

-- ----------------------------------------------------------------------------
-- 3.2: Trend Analysis with Hopping Windows
-- Calculates rate of change for trend detection
-- ----------------------------------------------------------------------------
CREATE VIEW vitals_trends AS
SELECT
    case_id,
    HOP_START(event_ts_parsed, INTERVAL '10' SECOND, INTERVAL '60' SECOND) AS window_start,
    HOP_END(event_ts_parsed, INTERVAL '10' SECOND, INTERVAL '60' SECOND) AS window_end,
    AVG(CAST(heart_rate_bpm AS DOUBLE)) AS current_hr,
    AVG(CAST(spo2_pct AS DOUBLE)) AS current_spo2,
    AVG(CAST(gcs_total AS DOUBLE)) AS current_gcs,
    AVG(CAST(systolic_bp_mmHg AS DOUBLE)) AS current_systolic_bp
FROM `ems.vitals.raw`
WHERE heart_rate_bpm IS NOT NULL
  OR spo2_pct IS NOT NULL
  OR gcs_total IS NOT NULL
  OR systolic_bp_mmHg IS NOT NULL
GROUP BY case_id, HOP(event_ts_parsed, INTERVAL '10' SECOND, INTERVAL '60' SECOND);

-- ============================================================================
-- STEP 4: Anomaly Detection Views
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 4.1: GCS Deterioration Detection
-- Detects rapid drops in Glasgow Coma Scale (2+ points)
-- ----------------------------------------------------------------------------
CREATE VIEW gcs_anomaly_detection AS
SELECT
    case_id,
    patient_id,
    event_ts,
    gcs_total AS current_gcs,
    LAG(gcs_total, 1) OVER (
        PARTITION BY case_id 
        ORDER BY event_ts_parsed
    ) AS previous_gcs,
    gcs_total - LAG(gcs_total, 1) OVER (
        PARTITION BY case_id 
        ORDER BY event_ts_parsed
    ) AS gcs_change,
    CASE
        WHEN gcs_total IS NOT NULL 
         AND LAG(gcs_total, 1) OVER (
             PARTITION BY case_id 
             ORDER BY event_ts_parsed
         ) IS NOT NULL
         AND (gcs_total - LAG(gcs_total, 1) OVER (
             PARTITION BY case_id 
             ORDER BY event_ts_parsed
         )) <= -2
        THEN 'RAPID_GCS_DETERIORATION'
        ELSE NULL
    END AS anomaly_type
FROM `ems.vitals.raw`
WHERE gcs_total IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 4.2: SpO2 Decline Detection
-- Detects significant drops in oxygen saturation (5+ percentage points)
-- ----------------------------------------------------------------------------
CREATE VIEW spo2_anomaly_detection AS
SELECT
    case_id,
    patient_id,
    event_ts,
    spo2_pct AS current_spo2,
    LAG(spo2_pct, 1) OVER (
        PARTITION BY case_id 
        ORDER BY event_ts_parsed
    ) AS previous_spo2,
    spo2_pct - LAG(spo2_pct, 1) OVER (
        PARTITION BY case_id 
        ORDER BY event_ts_parsed
    ) AS spo2_change,
    CASE
        WHEN spo2_pct IS NOT NULL 
         AND LAG(spo2_pct, 1) OVER (
             PARTITION BY case_id 
             ORDER BY event_ts_parsed
         ) IS NOT NULL
         AND (spo2_pct - LAG(spo2_pct, 1) OVER (
             PARTITION BY case_id 
             ORDER BY event_ts_parsed
         )) <= -5
        THEN 'SIGNIFICANT_SPO2_DECLINE'
        ELSE NULL
    END AS anomaly_type
FROM `ems.vitals.raw`
WHERE spo2_pct IS NOT NULL;

-- ============================================================================
-- STEP 5: Enriched Output Table and Query
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 5.1: Create Enriched Vitals Output Table
-- Publishes to ems.vitals.enriched topic
-- ----------------------------------------------------------------------------
CREATE TABLE `ems.vitals.enriched` (
    case_id STRING,
    patient_id STRING,
    ems_unit_id STRING,
    event_ts TIMESTAMP(3),
    sequence_number BIGINT,
    -- Raw vital signs
    heart_rate_bpm INT,
    systolic_bp_mmHg INT,
    diastolic_bp_mmHg INT,
    respiratory_rate_bpm INT,
    spo2_pct INT,
    gcs_total INT,
    temperature_c DOUBLE,
    blood_glucose_mg_dL INT,
    is_artifact_suspected BOOLEAN,
    source_device STRING,
    -- Windowed aggregations
    avg_heart_rate DOUBLE,
    avg_spo2 DOUBLE,
    avg_gcs DOUBLE,
    min_gcs INT,
    max_gcs INT,
    avg_systolic_bp DOUBLE,
    -- Trend indicators
    gcs_rate_of_change DOUBLE,
    spo2_rate_of_change DOUBLE,
    hr_rate_of_change DOUBLE,
    bp_rate_of_change DOUBLE,
    -- Detected anomalies
    detected_anomaly STRING,
    gcs_change INT,
    spo2_change INT
) WITH (
    'connector' = 'confluent'
);

-- ----------------------------------------------------------------------------
-- 5.2: Enrichment Query
-- Combines raw vitals with windowed aggregations, trends, and anomalies
-- ----------------------------------------------------------------------------
INSERT INTO `ems.vitals.enriched`
SELECT
    v.case_id,
    v.patient_id,
    v.ems_unit_id,
    CAST(v.event_ts AS TIMESTAMP(3)) AS event_ts,
    CAST(v.sequence_number AS BIGINT) AS sequence_number,
    -- Raw vital signs
    CAST(v.heart_rate_bpm AS INT) AS heart_rate_bpm,
    CAST(v.systolic_bp_mmHg AS INT) AS systolic_bp_mmHg,
    CAST(v.diastolic_bp_mmHg AS INT) AS diastolic_bp_mmHg,
    CAST(v.respiratory_rate_bpm AS INT) AS respiratory_rate_bpm,
    CAST(v.spo2_pct AS INT) AS spo2_pct,
    CAST(v.gcs_total AS INT) AS gcs_total,
    v.temperature_c,
    CAST(v.blood_glucose_mg_dL AS INT) AS blood_glucose_mg_dL,
    v.is_artifact_suspected,
    v.source_device,
    -- Windowed aggregations (calculated in Python for now - Flink JOINs produce updates)
    CAST(NULL AS DOUBLE) AS avg_heart_rate,
    CAST(NULL AS DOUBLE) AS avg_spo2,
    CAST(NULL AS DOUBLE) AS avg_gcs,
    CAST(NULL AS INT) AS min_gcs,
    CAST(NULL AS INT) AS max_gcs,
    CAST(NULL AS DOUBLE) AS avg_systolic_bp,
    -- Trend indicators (calculated in Python)
    CAST(NULL AS DOUBLE) AS gcs_rate_of_change,
    CAST(NULL AS DOUBLE) AS spo2_rate_of_change,
    CAST(NULL AS DOUBLE) AS hr_rate_of_change,
    CAST(NULL AS DOUBLE) AS bp_rate_of_change,
    -- Detected anomalies (calculated in Python)
    CAST(NULL AS STRING) AS detected_anomaly,
    CAST(NULL AS INT) AS gcs_change,
    CAST(NULL AS INT) AS spo2_change
FROM `ems.vitals.raw` v;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check that tables were created:
-- SHOW TABLES;

-- Check that views were created:
-- SHOW VIEWS;

-- View live enriched data:
-- SELECT * FROM `ems.vitals.enriched`;

-- View windowed aggregations:
-- SELECT * FROM vitals_windowed_30s;

-- View anomaly detections:
-- SELECT * FROM gcs_anomaly_detection WHERE anomaly_type IS NOT NULL;
-- SELECT * FROM spo2_anomaly_detection WHERE anomaly_type IS NOT NULL;

