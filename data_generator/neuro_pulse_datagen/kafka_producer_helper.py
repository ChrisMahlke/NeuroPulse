"""
NeuroPulse - Kafka Producer Helper (Confluent Cloud)

This module provides a helper function to create Confluent Kafka Producers
that connect to Confluent Cloud and read configuration from a local INI file.

Architecture Context:
    The NeuroPulse system uses Confluent Cloud (managed Kafka) as the central
    data streaming platform. All data generators (EMS vitals, FAST exams,
    hospital capacity) use this helper to publish events to Kafka topics.
    
    This helper abstracts the complexity of Kafka configuration and
    authentication, providing a simple interface for creating producers that
    can publish to multiple topics in the NeuroPulse pipeline.

Configuration:
    Kafka credentials are stored in a local INI file (confluent_config.ini)
    that contains Confluent Cloud connection details:
    - Bootstrap servers (Confluent Cloud endpoint)
    - SASL authentication credentials
    - Security protocol and mechanisms
    
    This approach allows different components to share the same configuration
    while keeping credentials out of code.

Usage:
    This module does NOT produce any specific events by itself. Other modules
    (e.g., EMS generators) import this to create producers and send messages.
    
    Example:
        from kafka_producer_helper import create_kafka_producer, delivery_report
        producer = create_kafka_producer()
        producer.produce(topic="ems.vitals.raw", value=payload, callback=delivery_report)
        producer.flush()

Note: In production, consider using environment variables or a secrets manager
      instead of local INI files for better security.
"""

from __future__ import annotations

import configparser
from dataclasses import dataclass
from typing import Any, Dict, Optional

from confluent_kafka import Producer


CONFIG_SECTION = "confluent"


@dataclass
class KafkaConfig:
    """
    Configuration dataclass for Confluent Kafka Producer connection settings.
    
    This dataclass encapsulates all the configuration needed to connect to
    Confluent Cloud, including authentication credentials and client settings.
    
    Attributes:
        bootstrap_servers: Comma-separated list of Confluent Cloud broker endpoints
        sasl_username: SASL username (API key) for Confluent Cloud authentication
        sasl_password: SASL password (API secret) for Confluent Cloud authentication
        security_protocol: Security protocol (default: "SASL_SSL" for Confluent Cloud)
        sasl_mechanisms: SASL mechanism (default: "PLAIN" for Confluent Cloud)
        client_id: Unique identifier for this Kafka client (used for monitoring)
    """
    bootstrap_servers: str  # Confluent Cloud broker endpoints
    sasl_username: str  # API key for authentication
    sasl_password: str  # API secret for authentication
    security_protocol: str = "SASL_SSL"  # Required for Confluent Cloud
    sasl_mechanisms: str = "PLAIN"  # Confluent Cloud uses PLAIN SASL
    client_id: str = "NeuroPulseDataGenerator"  # Client identifier for monitoring


def load_kafka_config(
    path: str = "data_generator/confluent_config.ini",
) -> KafkaConfig:
    """
    Load Kafka configuration from a local INI file.
    
    This function reads Confluent Cloud connection credentials from an INI file
    and returns a KafkaConfig dataclass. The INI file should contain a [confluent]
    section with the required connection parameters.
    
    Args:
        path: Path to the INI configuration file (relative or absolute)
        
    Returns:
        KafkaConfig: Configuration dataclass with all connection settings
        
    Raises:
        FileNotFoundError: If the configuration file doesn't exist
        ValueError: If the [confluent] section is missing from the INI file
        
    Example INI file structure:
        [confluent]
        bootstrap.servers = pkc-xxxxx.us-east-1.aws.confluent.cloud:9092
        sasl.username = YOUR_API_KEY
        sasl.password = YOUR_API_SECRET
        security.protocol = SASL_SSL
        sasl.mechanisms = PLAIN
        
    Note:
        The repository includes `confluent_config.example.ini` as a template.
        You should copy it to `confluent_config.ini` and fill in your real values.
    """
    parser = configparser.ConfigParser()
    read_files = parser.read(path)

    if not read_files:
        raise FileNotFoundError(
            f"Kafka config file not found at '{path}'. "
            f"Copy 'confluent_config.example.ini' and fill in your Confluent Cloud credentials."
        )

    if CONFIG_SECTION not in parser:
        raise ValueError(f"Config section [{CONFIG_SECTION}] not found in '{path}'.")

    section = parser[CONFIG_SECTION]

    return KafkaConfig(
        bootstrap_servers=section.get("bootstrap.servers", ""),
        sasl_username=section.get("sasl.username", ""),
        sasl_password=section.get("sasl.password", ""),
        security_protocol=section.get("security.protocol", "SASL_SSL"),
        sasl_mechanisms=section.get("sasl.mechanisms", "PLAIN"),
        client_id=section.get("client.id", "NeuroPulseDataGenerator"),
    )


def create_kafka_producer(cfg: Optional[KafkaConfig] = None) -> Producer:
    """
    Create a Confluent Kafka Producer configured for Confluent Cloud.
    
    This function creates a Kafka producer that can publish messages to topics
    in Confluent Cloud. The producer is configured with SASL/SSL authentication
    and is ready to use for publishing events to Kafka topics.
    
    Args:
        cfg: Optional KafkaConfig object. If None, loads configuration from default INI file.
        
    Returns:
        Producer: Configured Confluent Kafka Producer instance
        
    Usage:
        # Load config and create producer
        cfg = load_kafka_config()
        producer = create_kafka_producer(cfg)
        
        # Or use default config path
        producer = create_kafka_producer()
        
        # Publish a message
        producer.produce(topic="ems.vitals.raw", value=payload, callback=delivery_report)
        producer.flush()  # Ensure message is sent
        
    Note:
        Remember to call producer.flush() after producing messages to ensure
        they are delivered before the program exits.
    """
    if cfg is None:
        cfg = load_kafka_config()

    conf: Dict[str, Any] = {
        "bootstrap.servers": cfg.bootstrap_servers,
        "security.protocol": cfg.security_protocol,
        "sasl.mechanisms": cfg.sasl_mechanisms,
        "sasl.username": cfg.sasl_username,
        "sasl.password": cfg.sasl_password,
        "client.id": cfg.client_id,
    }

    return Producer(conf)


def delivery_report(err, msg) -> None:
    """
    Callback function for Kafka message delivery confirmation.
    
    This is called asynchronously by the Kafka producer when a message is
    successfully delivered or fails. Used for monitoring and debugging
    message delivery status.
    
    Args:
        err: Error object if delivery failed, None if successful
        msg: Message object with topic, partition, and offset information
        
    Use Case:
        Pass this as the callback parameter when calling producer.produce():
        
        producer.produce(
            topic="ems.vitals.raw",
            value=payload,
            callback=delivery_report
        )
        
    Note:
        For now, we just print success or error to stdout. In production,
        you might want to log to a monitoring system or metrics service.
    """
    if err is not None:
        print(f"[KAFKA] Delivery failed: {err}")
    else:
        print(
            f"[KAFKA] Delivered message to {msg.topic()} [{msg.partition()}] at offset {msg.offset()}"
        )
