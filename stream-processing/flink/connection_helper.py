"""
NeuroPulse - Flink Connection Helper

This module provides helper functions to extract Confluent Cloud connection
details for use in Flink SQL queries. It reads from the same configuration
files used by Kafka consumers/producers.

Architecture Context:
    Flink SQL queries need connection details (bootstrap servers, API key/secret)
    to connect to Confluent Cloud Kafka topics. This helper extracts those
    details from the existing confluent_config.ini files so you can easily
    paste them into Flink SQL queries.

Usage:
    Run this script to get connection strings ready to paste into Flink SQL:
    
    python3 stream-processing/flink/connection_helper.py
    
    This will output the connection details formatted for Flink SQL queries.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

# Import path depends on where script is run from
try:
    from neuro_pulse_streaming.kafka_consumer_helper import load_kafka_config
except ImportError:
    # Try alternative path
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from neuro_pulse_streaming.kafka_consumer_helper import load_kafka_config


def generate_flink_connection_strings():
    """
    Generate Flink SQL connection strings from Confluent Cloud configuration.
    
    Returns:
        dict: Connection details formatted for Flink SQL
    """
    try:
        # Load Kafka config (same as used by stream processor)
        # Try multiple possible paths
        config_paths = [
            "stream-processing/confluent_config.ini",
            "../confluent_config.ini",
            "confluent_config.ini",
        ]
        cfg = None
        for path in config_paths:
            try:
                cfg = load_kafka_config(path)
                break
            except FileNotFoundError:
                continue
        
        if cfg is None:
            raise FileNotFoundError("Could not find confluent_config.ini in any expected location")
        
        # Generate JAAS config string for Flink
        jaas_config = (
            f'org.apache.kafka.common.security.plain.PlainLoginModule '
            f'required username="{cfg.sasl_username}" password="{cfg.sasl_password}";'
        )
        
        return {
            "bootstrap_servers": cfg.bootstrap_servers,
            "api_key": cfg.sasl_username,
            "api_secret": cfg.sasl_password,
            "jaas_config": jaas_config,
        }
    except Exception as e:
        print(f"Error loading config: {e}")
        return None


def print_flink_connection_template():
    """
    Print Flink SQL connection template with placeholders filled in.
    """
    conn = generate_flink_connection_strings()
    
    if not conn:
        print("Could not load connection details. Check your confluent_config.ini file.")
        return
    
    print("=" * 80)
    print("Flink SQL Connection Details")
    print("=" * 80)
    print()
    print("Use these values in your Flink SQL queries:")
    print()
    print(f"Bootstrap Servers: {conn['bootstrap_servers']}")
    print(f"API Key: {conn['api_key']}")
    print(f"API Secret: {conn['api_secret']}")
    print()
    print("JAAS Config (for Flink SQL):")
    print(conn['jaas_config'])
    print()
    print("=" * 80)
    print("Example Flink Table Definition:")
    print("=" * 80)
    print()
    print(f"""CREATE TABLE ems_vitals_raw (
    case_id STRING,
    patient_id STRING,
    event_ts TIMESTAMP(3),
    heart_rate_bpm INT,
    -- ... other fields ...
    WATERMARK FOR event_ts AS event_ts - INTERVAL '5' SECOND
) WITH (
    'connector' = 'kafka',
    'topic' = 'ems.vitals.raw',
    'properties.bootstrap.servers' = '{conn['bootstrap_servers']}',
    'properties.security.protocol' = 'SASL_SSL',
    'properties.sasl.mechanism' = 'PLAIN',
    'properties.sasl.jaas.config' = '{conn['jaas_config']}',
    'format' = 'json',
    'scan.startup.mode' = 'latest-offset'
);""")
    print()
    print("=" * 80)


if __name__ == "__main__":
    print_flink_connection_template()

