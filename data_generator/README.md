# Data Generator

This module contains **synthetic data generators** that simulate EMS vitals, FAST exams, and hospital capacity data for NeuroPulse.

## Table of Contents

- [Purpose](#purpose)
- [Components](#components)
  - [`neuro_pulse_datagen/ems_vitals_simulator.py`](#neuro_pulse_datagenems_vitals_simulatorpy)
  - [`neuro_pulse_datagen/ems_fast_exam_simulator.py`](#neuro_pulse_datagenems_fast_exam_simulatorpy)
  - [`neuro_pulse_datagen/hospital_capacity_simulator.py`](#neuro_pulse_datagenhospital_capacity_simulatorpy)
  - [`neuro_pulse_datagen/kafka_producer_helper.py`](#neuro_pulse_datagenkafka_producer_helperpy)
- [Configuration](#configuration)
  - [Setup Confluent Cloud Connection](#setup-confluent-cloud-connection)
- [Usage](#usage)
  - [For Hackathon (Recommended)](#for-hackathon-recommended)
  - [Direct Usage](#direct-usage)
- [Data Scenarios](#data-scenarios)
- [Important Notes](#important-notes)
- [Related Files](#related-files)

---

## Purpose

Generates realistic synthetic data to demonstrate the real-time streaming pipeline without requiring actual EMS devices or hospital systems. All data is synthetic and for demonstration purposes only.

## Components

### `neuro_pulse_datagen/ems_vitals_simulator.py`

**Generates synthetic EMS vital sign events.**

- Creates realistic vital signs (heart rate, blood pressure, SpO2, GCS, etc.)
- Simulates trends and variations over time
- Generates events matching the `ems.vitals.raw` schema
- Publishes to Confluent Cloud Kafka topic: `ems.vitals.raw`

**Key Features:**
- Realistic value ranges based on stroke scenarios
- Time-based trends (e.g., BP changes over time)
- Artifact detection flags
- Sequence numbers for ordering

### `neuro_pulse_datagen/ems_fast_exam_simulator.py`

**Generates synthetic FAST exam events.**

- Creates FAST (Face, Arm, Speech, Time) exam results
- Generates stroke assessment data
- Includes symptom onset times and last known well times
- Publishes to Confluent Cloud Kafka topic: `ems.fast.exam`

**Key Features:**
- FAST score calculation (0-3)
- Suspected stroke side (left/right)
- Pre-stroke disability scores
- Realistic timing for symptom onset

### `neuro_pulse_datagen/hospital_capacity_simulator.py`

**Generates synthetic hospital capacity and capability events.**

- Creates hospital capacity snapshots
- Includes stroke center levels (PRIMARY, COMPREHENSIVE)
- Generates capability information (CT, CTA, thrombectomy)
- Publishes to Confluent Cloud Kafka topic: `hospital.capacity`

**Key Features:**
- Hospital locations (latitude/longitude)
- Current capacity status
- Door-to-needle time estimates
- ED crowding scores

### `neuro_pulse_datagen/kafka_producer_helper.py`

**Helper module for creating Confluent Kafka Producers.**

- Loads configuration from `confluent_config.ini`
- Creates authenticated Kafka producers
- Handles connection errors gracefully
- Supports both local config files and environment variables

**Configuration:**
- Reads from `confluent_config.ini` file
- Falls back to environment variables for Cloud deployments
- Supports SASL/SSL authentication for Confluent Cloud

## Configuration

### Setup Confluent Cloud Connection

1. Copy the example config:
   ```bash
   cp confluent_config.example.ini confluent_config.ini
   ```

2. Edit `confluent_config.ini` with your Confluent Cloud credentials:
   ```ini
   [confluent]
   bootstrap.servers = pkc-xxxxx.region.cloud:9092
   sasl.username = YOUR_API_KEY
   sasl.password = YOUR_API_SECRET
   security.protocol = SASL_SSL
   sasl.mechanisms = PLAIN
   ```

## Usage

### For Hackathon (Recommended)

Use the live Kafka data generator in `stream-processing/`:
```bash
cd ../stream-processing
python3 generate_live_kafka_data.py
```

This script:
- Uses the generators in this module
- Publishes to Confluent Cloud Kafka
- Generates 6 diverse stroke scenarios
- Updates vitals every 1 second
- Shows real streaming metrics

### Direct Usage

You can also use the generators directly:

```python
from neuro_pulse_datagen.ems_vitals_simulator import generate_random_ems_vitals_event
from neuro_pulse_datagen.kafka_producer_helper import load_kafka_config, create_producer

# Load config
config = load_kafka_config()

# Create producer
producer = create_producer(config)

# Generate and send event
vitals = generate_random_ems_vitals_event(
    case_id="CASE-001",
    patient_id="PAT-001"
)
producer.produce("ems.vitals.raw", vitals.to_dict())
producer.flush()
```

## Data Scenarios

The generators create realistic scenarios including:
- **Critical LVO cases** - High stroke probability, severe symptoms
- **Moderate stroke cases** - Moderate probability, typical symptoms
- **Low risk cases** - Lower probability, mild symptoms
- **Time-critical cases** - Near treatment window expiration
- **Early presentation** - Recent symptom onset

## Important Notes

- **All data is synthetic** - Generated for demonstration only
- **Not for clinical use** - Do not use with real patients
- **Realistic but not real** - Values are simulated, not from actual patients
- **Educational purpose** - Demonstrates streaming architecture and AI integration

## Related Files

- **Schemas:** See `../schemas/ems/` for data structure definitions
- **Stream Processing:** See `../stream-processing/` for consumers
- **Configuration:** See `confluent_config.example.ini` for config template

