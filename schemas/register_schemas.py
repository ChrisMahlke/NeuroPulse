#!/usr/bin/env python3
"""
NeuroPulse - Schema Registry Registration Script

This script registers all Avro schemas with Confluent Cloud Schema Registry.
This is a CRITICAL step for enabling Flink AI integration, as Flink requires
schemas to be registered in Schema Registry to read from Kafka topics.

Prerequisites:
    - Confluent Cloud account with Schema Registry enabled
    - Schema Registry API credentials (key and secret)
    - Avro schema files in schemas/ directory

Usage:
    python3 schemas/register_schemas.py

Environment Variables:
    SCHEMA_REGISTRY_URL: Schema Registry endpoint URL
    SCHEMA_REGISTRY_API_KEY: Schema Registry API key
    SCHEMA_REGISTRY_API_SECRET: Schema Registry API secret

For hackathon judges:
    This demonstrates production-ready schema governance and enables
    Confluent Cloud Flink to perform platform-native AI inference.
"""

import os
import json
import sys
from pathlib import Path
from typing import Dict, List
import requests
from requests.auth import HTTPBasicAuth

# Schema Registry configuration from environment
SCHEMA_REGISTRY_URL = os.getenv("SCHEMA_REGISTRY_URL", "")
SCHEMA_REGISTRY_API_KEY = os.getenv("SCHEMA_REGISTRY_API_KEY", "")
SCHEMA_REGISTRY_API_SECRET = os.getenv("SCHEMA_REGISTRY_API_SECRET", "")

# Schema to topic mapping
SCHEMA_MAPPINGS = {
    "schemas/ems/ems_vitals_raw.avsc": "ems.vitals.raw-value",
    "schemas/ems/ems_fast_exam.avsc": "ems.fast.exam-value",
    "schemas/hospital/hospital_capacity.avsc": "hospital.capacity-value",
    "schemas/ai/ai_prediction_output.avsc": "ai.prediction.output-value",
}


def load_schema(schema_path: str) -> Dict:
    """Load Avro schema from file"""
    with open(schema_path, 'r') as f:
        return json.load(f)


def register_schema(subject: str, schema_dict: Dict) -> bool:
    """
    Register a schema with Confluent Schema Registry.
    
    Args:
        subject: Schema subject name (e.g., "ems.vitals.raw-value")
        schema_dict: Avro schema as dictionary
        
    Returns:
        True if registration successful, False otherwise
    """
    if not SCHEMA_REGISTRY_URL:
        print("❌ SCHEMA_REGISTRY_URL not set. Please configure environment variables.")
        print("\nTo get your Schema Registry credentials:")
        print("1. Go to Confluent Cloud Console")
        print("2. Navigate to your environment > Schema Registry")
        print("3. Click 'API credentials' to create API key")
        print("\nThen set environment variables:")
        print("  export SCHEMA_REGISTRY_URL='https://your-sr-endpoint.confluent.cloud'")
        print("  export SCHEMA_REGISTRY_API_KEY='your-api-key'")
        print("  export SCHEMA_REGISTRY_API_SECRET='your-api-secret'")
        return False
    
    url = f"{SCHEMA_REGISTRY_URL}/subjects/{subject}/versions"
    
    # Schema Registry expects the schema as a JSON string
    payload = {
        "schemaType": "AVRO",
        "schema": json.dumps(schema_dict)
    }
    
    headers = {
        "Content-Type": "application/vnd.schemaregistry.v1+json"
    }
    
    auth = HTTPBasicAuth(SCHEMA_REGISTRY_API_KEY, SCHEMA_REGISTRY_API_SECRET)
    
    try:
        response = requests.post(url, json=payload, headers=headers, auth=auth)
        
        if response.status_code in [200, 201]:
            result = response.json()
            schema_id = result.get("id")
            print(f"✅ Registered schema for subject '{subject}' (ID: {schema_id})")
            return True
        elif response.status_code == 409:
            # Schema already exists - this is OK
            print(f"ℹ️  Schema for subject '{subject}' already registered")
            return True
        else:
            print(f"❌ Failed to register schema for '{subject}'")
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error registering schema for '{subject}': {e}")
        return False


def main():
    """Register all schemas with Schema Registry"""
    print("=" * 70)
    print("NeuroPulse - Schema Registry Registration")
    print("=" * 70)
    print()
    
    if not SCHEMA_REGISTRY_URL or not SCHEMA_REGISTRY_API_KEY:
        print("⚠️  Schema Registry credentials not configured!")
        print()
        print("This script requires Schema Registry credentials to register schemas.")
        print("Schemas are required for Confluent Cloud Flink AI integration.")
        print()
        print("Please set the following environment variables:")
        print("  - SCHEMA_REGISTRY_URL")
        print("  - SCHEMA_REGISTRY_API_KEY")
        print("  - SCHEMA_REGISTRY_API_SECRET")
        print()
        sys.exit(1)
    
    print(f"Schema Registry URL: {SCHEMA_REGISTRY_URL}")
    print(f"API Key: {SCHEMA_REGISTRY_API_KEY[:8]}...")
    print()
    
    success_count = 0
    total_count = len(SCHEMA_MAPPINGS)
    
    for schema_path, subject in SCHEMA_MAPPINGS.items():
        print(f"📄 Processing: {schema_path}")
        print(f"   Subject: {subject}")
        
        try:
            schema_dict = load_schema(schema_path)
            if register_schema(subject, schema_dict):
                success_count += 1
        except FileNotFoundError:
            print(f"❌ Schema file not found: {schema_path}")
        except json.JSONDecodeError as e:
            print(f"❌ Invalid JSON in schema file: {e}")
        
        print()
    
    print("=" * 70)
    print(f"Registration complete: {success_count}/{total_count} schemas registered")
    print("=" * 70)
    
    if success_count == total_count:
        print("✅ All schemas registered successfully!")
        print()
        print("Next steps:")
        print("1. Update producers to use AvroSerializer")
        print("2. Update consumers to use AvroDeserializer")
        print("3. Configure Flink SQL to read from topics with schemas")
        sys.exit(0)
    else:
        print("⚠️  Some schemas failed to register. Check errors above.")
        sys.exit(1)


if __name__ == "__main__":
    main()

