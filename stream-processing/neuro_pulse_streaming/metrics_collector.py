"""
NeuroPulse - Streaming Metrics Collector

This module provides real-time metrics collection for streaming performance monitoring.
Tracks messages per second, latency percentiles, and throughput for each Kafka topic.

Used to demonstrate real-time streaming performance in the dashboard and prove
sub-second latency claims for the hackathon submission.
"""

import time
import logging
from collections import deque
from typing import Dict, Any, Optional
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class StreamMetrics:
    """Metrics for a single Kafka stream/topic"""
    
    stream_name: str
    message_timestamps: deque = field(default_factory=lambda: deque(maxlen=1000))
    latencies_ms: deque = field(default_factory=lambda: deque(maxlen=1000))
    start_time: float = field(default_factory=time.time)
    total_messages: int = 0
    total_bytes: int = 0
    
    def record_message(self, kafka_timestamp_ms: Optional[int] = None, message_size_bytes: int = 0):
        """
        Record a message received from Kafka.
        
        Args:
            kafka_timestamp_ms: Kafka message timestamp in milliseconds (optional)
            message_size_bytes: Size of the message in bytes
        """
        now = time.time()
        self.message_timestamps.append(now)
        self.total_messages += 1
        self.total_bytes += message_size_bytes
        
        # Calculate end-to-end latency if Kafka timestamp available
        if kafka_timestamp_ms:
            latency_ms = (now * 1000) - kafka_timestamp_ms
            self.latencies_ms.append(latency_ms)
    
    def get_metrics(self) -> Dict[str, Any]:
        """
        Calculate current metrics for this stream.
        
        Returns:
            Dictionary with current metrics including:
            - messages_per_second: Current throughput
            - total_messages: Total messages processed
            - uptime_seconds: Time since metrics started
            - latency_p50_ms: Median latency
            - latency_p95_ms: 95th percentile latency
            - latency_p99_ms: 99th percentile latency
            - throughput_kbps: Throughput in kilobytes per second
        """
        now = time.time()
        
        # Messages in last second
        recent = [t for t in self.message_timestamps if now - t < 1.0]
        messages_per_second = len(recent)
        
        # Latency percentiles
        sorted_latencies = sorted(self.latencies_ms)
        p50 = sorted_latencies[len(sorted_latencies)//2] if sorted_latencies else 0
        p95 = sorted_latencies[int(len(sorted_latencies)*0.95)] if sorted_latencies else 0
        p99 = sorted_latencies[int(len(sorted_latencies)*0.99)] if sorted_latencies else 0
        
        # Throughput in KB/s
        uptime = max(1, now - self.start_time)  # Avoid division by zero
        throughput_kbps = (self.total_bytes / 1024) / uptime
        
        return {
            'stream_name': self.stream_name,
            'messages_per_second': messages_per_second,
            'total_messages': self.total_messages,
            'uptime_seconds': int(uptime),
            'latency_p50_ms': round(p50, 2),
            'latency_p95_ms': round(p95, 2),
            'latency_p99_ms': round(p99, 2),
            'latency_avg_ms': round(sum(self.latencies_ms) / len(self.latencies_ms), 2) if self.latencies_ms else 0,
            'throughput_kbps': round(throughput_kbps, 2),
            'has_latency_data': len(self.latencies_ms) > 0
        }


class MetricsCollector:
    """
    Centralized metrics collector for all Kafka streams.
    
    Tracks metrics for multiple topics and provides aggregated statistics.
    """
    
    def __init__(self):
        self.streams: Dict[str, StreamMetrics] = {}
        self.start_time = time.time()
        logger.info("Metrics collector initialized")
    
    def get_or_create_stream(self, stream_name: str) -> StreamMetrics:
        """Get or create metrics for a stream"""
        if stream_name not in self.streams:
            self.streams[stream_name] = StreamMetrics(stream_name=stream_name)
            logger.info(f"Created metrics tracker for stream: {stream_name}")
        return self.streams[stream_name]
    
    def record_message(self, stream_name: str, kafka_timestamp_ms: Optional[int] = None, 
                      message_size_bytes: int = 0):
        """Record a message for a specific stream"""
        stream = self.get_or_create_stream(stream_name)
        stream.record_message(kafka_timestamp_ms, message_size_bytes)
    
    def get_all_metrics(self) -> Dict[str, Any]:
        """
        Get metrics for all streams plus aggregated statistics.
        
        Returns:
            Dictionary with per-stream metrics and overall statistics
        """
        stream_metrics = {
            name: stream.get_metrics() 
            for name, stream in self.streams.items()
        }
        
        # Calculate aggregate metrics
        total_messages = sum(s.total_messages for s in self.streams.values())
        total_throughput = sum(m['messages_per_second'] for m in stream_metrics.values())
        
        # Overall latency (weighted average across all streams with latency data)
        all_latencies = []
        for stream in self.streams.values():
            all_latencies.extend(stream.latencies_ms)
        
        sorted_all = sorted(all_latencies)
        overall_p50 = sorted_all[len(sorted_all)//2] if sorted_all else 0
        overall_p95 = sorted_all[int(len(sorted_all)*0.95)] if sorted_all else 0
        overall_p99 = sorted_all[int(len(sorted_all)*0.99)] if sorted_all else 0
        
        return {
            'streams': stream_metrics,
            'aggregate': {
                'total_messages': total_messages,
                'total_messages_per_second': total_throughput,
                'uptime_seconds': int(time.time() - self.start_time),
                'overall_latency_p50_ms': round(overall_p50, 2),
                'overall_latency_p95_ms': round(overall_p95, 2),
                'overall_latency_p99_ms': round(overall_p99, 2),
                'active_streams': len(self.streams)
            }
        }


# Global metrics collector instance
_metrics_collector: Optional[MetricsCollector] = None


def get_metrics_collector() -> MetricsCollector:
    """Get the global metrics collector instance"""
    global _metrics_collector
    if _metrics_collector is None:
        _metrics_collector = MetricsCollector()
    return _metrics_collector

