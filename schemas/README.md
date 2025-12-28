# Schemas

This directory contains **Avro schemas** that define the data structure for all Kafka topics used by NeuroPulse.

## Table of Contents

- [Purpose](#purpose)
- [Schema Files](#schema-files)
  - [EMS Data Schemas (`ems/`)](#ems-data-schemas-ems)
  - [Hospital Data Schemas (`hospital/`)](#hospital-data-schemas-hospital)
  - [AI Prediction Schemas (`ai/`)](#ai-prediction-schemas-ai)
- [Schema Registry Integration](#schema-registry-integration)
- [Usage](#usage)
  - [Viewing Schemas](#viewing-schemas)
  - [Schema Evolution](#schema-evolution)
- [File Structure](#file-structure)
- [Related Documentation](#related-documentation)

---

## Purpose

Schemas provide:
- **Data contracts** - Ensures producers and consumers agree on data structure
- **Type safety** - Validates data types and required fields
- **Schema evolution** - Allows safe changes to data structure over time
- **Documentation** - Self-documenting data formats

## Schema Files

### EMS Data Schemas (`ems/`)

#### `ems_vitals_raw.avsc`
**Raw EMS vital signs for suspected stroke patients.**

Contains:
- Heart rate, blood pressure, SpO2, temperature
- Glasgow Coma Scale (GCS)
- Blood glucose
- Event timestamp and sequence number
- Case and patient identifiers

**Kafka Topic:** `ems.vitals.raw`

#### `ems_fast_exam.avsc`
**Structured FAST exam and stroke assessment data from EMS.**

Contains:
- FAST exam findings (Face, Arm, Speech, Time)
- FAST score (0-3)
- Suspected stroke side (left/right)
- Symptom onset time
- Last known well time
- Pre-stroke disability score

**Kafka Topic:** `ems.fast.exam`

#### `ems_assessment_text.avsc`
**Free-text EMS narrative for suspected stroke cases.**

Contains:
- Narrative text from paramedics
- Clinical observations
- Patient history notes

**Kafka Topic:** (Currently not used, reserved for future use)

### Hospital Data Schemas (`hospital/`)

#### `hospital_capacity.avsc`
**Real-time capacity and capability information for stroke-receiving hospitals.**

Contains:
- Hospital ID, name, location (lat/long)
- Stroke center level (PRIMARY, COMPREHENSIVE)
- Current capacity status
- Available capabilities (CT, CTA, thrombectomy)
- Estimated door-to-needle times
- Current ED crowding score

**Kafka Topic:** `hospital.capacity`

### AI Prediction Schemas (`ai/`)

#### `ai_prediction_input.avsc`
**Feature-enriched model input for real-time stroke/LVO risk prediction.**

Contains:
- Aggregated vitals (trends, averages)
- FAST exam features
- Time-based features (minutes since onset)
- Hospital routing context
- Derived clinical features

**Kafka Topic:** (Internal - used by stream processor, not published)

#### `ai_prediction_output.avsc`
**Stroke/LVO risk predictions, routing recommendations, and AI explanations.**

Contains:
- Stroke probability (0.0-1.0)
- LVO probability (0.0-1.0)
- Risk category (LOW, MODERATE, HIGH, CRITICAL)
- Recommended destination hospital
- Travel time estimates
- AI-generated explanations
- Recommended clinical actions
- Current vitals snapshot

**Kafka Topic:** `ai.prediction.output`

## Schema Registry Integration

**Current Status:** Schemas are defined but JSON serialization is used (not Avro).

**Future Enhancement:** 
- Integrate with Confluent Schema Registry
- Use Avro serialization for stronger data contracts
- Enable schema evolution and compatibility checking

## Usage

### Viewing Schemas

Schemas are in Avro JSON format. You can:
- View them in any text editor
- Validate them using Avro tools
- Import them into Confluent Schema Registry

### Schema Evolution

When updating schemas:
1. Maintain backward compatibility when possible
2. Add new fields as optional
3. Document breaking changes
4. Update both producer and consumer code

## File Structure

```
schemas/
├── ems/
│   ├── ems_vitals_raw.avsc
│   ├── ems_fast_exam.avsc
│   └── ems_assessment_text.avsc
├── hospital/
│   └── hospital_capacity.avsc
└── ai/
    ├── ai_prediction_input.avsc
    └── ai_prediction_output.avsc
```

## Related Documentation

- See `data_generator/` for producers that create data matching these schemas
- See `stream-processing/` for consumers that read data matching these schemas
- See [Confluent Schema Registry docs](https://docs.confluent.io/cloud/current/sr/index.html) for production schema management
