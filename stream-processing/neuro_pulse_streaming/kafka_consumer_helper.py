"""
NeuroPulse - Kafka Consumer Helper (Confluent Cloud)

This module provides helper functions to create Confluent Kafka Consumers
that connect to Confluent Cloud and read configuration from a local INI file.

Architecture Context:
    The NeuroPulse system uses Confluent Cloud (managed Kafka) as the central
    data streaming platform. All components (data generators, stream processor,
    API server) connect to Confluent Cloud to publish and consume events.
    
    This helper module abstracts the complexity of Kafka configuration and
    authentication, providing a simple interface for creating consumers that
    can read from multiple topics in the NeuroPulse pipeline.

Configuration:
    Kafka credentials are stored in a local INI file (confluent_config.ini)
    that contains Confluent Cloud connection details:
    - Bootstrap servers (Confluent Cloud endpoint)
    - SASL authentication credentials
    - Security protocol and mechanisms
    
    This approach allows different components to share the same configuration
    while keeping credentials out of code.

Use Cases:
    - Stream processor: Consumes from ems.vitals.raw, ems.fast.exam, hospital.capacity
    - API server: Consumes from ai.prediction.output
    
Note: In production, consider using environment variables or a secrets manager
      instead of local INI files for better security.
"""

from __future__ import annotations

import configparser
import os
from dataclasses import dataclass
from typing import Any, Dict, Optional

from confluent_kafka import Consumer


# Configuration section name in INI file
CONFIG_SECTION = "confluent"


@dataclass
class KafkaConfig:
    """
    Configuration dataclass for Confluent Kafka connection settings.
    
    This dataclass encapsulates all the configuration needed to connect to
    Confluent Cloud, including authentication credentials and consumer group settings.
    
    Attributes:
        bootstrap_servers: Comma-separated list of Confluent Cloud broker endpoints
        sasl_username: SASL username (API key) for Confluent Cloud authentication
        sasl_password: SASL password (API secret) for Confluent Cloud authentication
        security_protocol: Security protocol (default: "SASL_SSL" for Confluent Cloud)
        sasl_mechanisms: SASL mechanism (default: "PLAIN" for Confluent Cloud)
        client_id: Unique identifier for this Kafka client (used for monitoring)
        group_id: Consumer group ID (enables load balancing and offset management)
    """
    bootstrap_servers: str  # Confluent Cloud broker endpoints
    sasl_username: str  # API key for authentication
    sasl_password: str  # API secret for authentication
    security_protocol: str = "SASL_SSL"  # Required for Confluent Cloud
    sasl_mechanisms: str = "PLAIN"  # Confluent Cloud uses PLAIN SASL
    client_id: str = "NeuroPulseStreamProcessor"  # Client identifier for monitoring
    group_id: str = "neuropulse-stream-processor-group"  # Consumer group for offset management


def load_kafka_config(
    path: str = "stream-processing/confluent_config.ini",
) -> KafkaConfig:
    """
    Load Kafka configuration from environment variables or a local INI file.
    
    This function first checks for environment variables (for Cloud Run deployment),
    then falls back to reading from an INI file (for local development).
    
    Environment variables (checked first):
        KAFKA_BOOTSTRAP_SERVERS
        KAFKA_SASL_USERNAME
        KAFKA_SASL_PASSWORD
        KAFKA_CLIENT_ID (optional)
        KAFKA_GROUP_ID (optional)
    
    Args:
        path: Path to the INI configuration file (relative or absolute)
        
    Returns:
        KafkaConfig: Configuration dataclass with all connection settings
        
    Raises:
        ValueError: If neither environment variables nor config file provide required values
        
    Example INI file structure:
        [confluent]
        bootstrap.servers = pkc-xxxxx.us-east-1.aws.confluent.cloud:9092
        sasl.username = YOUR_API_KEY
        sasl.password = YOUR_API_SECRET
        security.protocol = SASL_SSL
        sasl.mechanisms = PLAIN
        
    Note:
        Environment variables take precedence over config file for deployment flexibility.
    """
    # First, try environment variables (for Cloud Run)
    bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "")
    sasl_username = os.getenv("KAFKA_SASL_USERNAME", "")
    sasl_password = os.getenv("KAFKA_SASL_PASSWORD", "")
    client_id = os.getenv("KAFKA_CLIENT_ID", "NeuroPulseAPI")
    group_id = os.getenv("KAFKA_GROUP_ID", "neuropulse-api-server-group")
    
    # If environment variables are set, use them
    if bootstrap_servers and sasl_username and sasl_password:
        return KafkaConfig(
            bootstrap_servers=bootstrap_servers,
            sasl_username=sasl_username,
            sasl_password=sasl_password,
            security_protocol="SASL_SSL",
            sasl_mechanisms="PLAIN",
            client_id=client_id,
            group_id=group_id,
        )
    
    # Fall back to INI file (for local development)
    parser = configparser.ConfigParser()
    read_files = parser.read(path)

    if not read_files:
        raise FileNotFoundError(
            f"Kafka config file not found at '{path}' and environment variables not set. "
            f"Either set KAFKA_BOOTSTRAP_SERVERS, KAFKA_SASL_USERNAME, KAFKA_SASL_PASSWORD "
            f"or copy 'data_generator/confluent_config.example.ini' to this location."
        )

    if CONFIG_SECTION not in parser:
        raise ValueError(f"Config section [{CONFIG_SECTION}] not found in '{path}'.")

    section = parser[CONFIG_SECTION]

    # Extract configuration values with sensible defaults
    return KafkaConfig(
        bootstrap_servers=section.get("bootstrap.servers", ""),
        sasl_username=section.get("sasl.username", ""),
        sasl_password=section.get("sasl.password", ""),
        security_protocol=section.get("security.protocol", "SASL_SSL"),
        sasl_mechanisms=section.get("sasl.mechanisms", "PLAIN"),
        client_id=section.get("client.id", "NeuroPulseStreamProcessor"),
        group_id=section.get("group.id", "neuropulse-stream-processor-group"),
    )


def create_kafka_consumer(cfg: Optional[KafkaConfig] = None) -> Consumer:
    """
    Create a Confluent Kafka Consumer configured for Confluent Cloud.
    
    This function creates a Kafka consumer that can read from topics in Confluent Cloud.
    The consumer is configured with:
    - SASL/SSL authentication for Confluent Cloud
    - Consumer group for offset management and load balancing
    - Auto-commit enabled for automatic offset tracking
    - "earliest" offset reset to read from the beginning if no offset exists
    
    Args:
        cfg: Optional KafkaConfig object. If None, loads configuration from default INI file.
        
    Returns:
        Consumer: Configured Confluent Kafka Consumer instance
        
    Consumer Group Behavior:
        - Multiple consumers with the same group_id share topic partitions (load balancing)
        - Each consumer group maintains its own offset, allowing multiple applications
          to consume from the same topics independently
        - Offsets are automatically committed to enable resuming after restarts
        
    Offset Reset Strategy:
        - "earliest": If no offset exists, start from the beginning of the topic
        - This ensures new consumers don't miss historical messages
        - In production, you might want "latest" for real-time-only processing
        
    Use Cases:
        - Stream processor: Consumes from ems.vitals.raw, ems.fast.exam, hospital.capacity
        - API server: Consumes from ai.prediction.output
    """
    if cfg is None:
        cfg = load_kafka_config()

    # Build consumer configuration dictionary
    # These settings are required for Confluent Cloud connection
    conf: Dict[str, Any] = {
        "bootstrap.servers": cfg.bootstrap_servers,  # Confluent Cloud broker endpoints
        "security.protocol": cfg.security_protocol,  # SASL_SSL for encrypted connection
        "sasl.mechanisms": cfg.sasl_mechanisms,  # PLAIN for API key authentication
        "sasl.username": cfg.sasl_username,  # Confluent Cloud API key
        "sasl.password": cfg.sasl_password,  # Confluent Cloud API secret
        "client.id": cfg.client_id,  # Unique identifier for monitoring
        "group.id": cfg.group_id,  # Consumer group for offset management
        "auto.offset.reset": "latest",  # Start from latest messages (real-time processing)
        "enable.auto.commit": True,  # Automatically commit offsets after processing
    }

    return Consumer(conf)

