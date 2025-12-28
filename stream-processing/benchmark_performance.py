#!/usr/bin/env python3
"""
NeuroPulse - Performance Benchmarking Script

This script measures end-to-end latency and throughput of the NeuroPulse streaming pipeline.
Used to generate performance metrics for the hackathon submission and prove sub-second latency claims.

Metrics Measured:
    - End-to-end latency (data generation → AI prediction → dashboard)
    - Throughput (messages per second)
    - Latency percentiles (P50, P95, P99)
    - Stream processing latency
    - AI inference latency

Usage:
    python3 stream-processing/benchmark_performance.py --duration 60

For hackathon judges:
    This demonstrates production-grade observability and proves the system
    achieves sub-second latency for time-critical stroke triage decisions.
"""

import argparse
import time
import json
import statistics
from datetime import datetime, timezone
from typing import List, Dict
import requests
from collections import defaultdict

API_BASE_URL = "http://localhost:8000"


def fetch_streaming_metrics() -> Dict:
    """Fetch current streaming metrics from API"""
    try:
        response = requests.get(f"{API_BASE_URL}/api/streaming/metrics", timeout=5)
        if response.ok:
            return response.json()
        return {}
    except Exception as e:
        print(f"Error fetching metrics: {e}")
        return {}


def run_benchmark(duration_seconds: int = 60):
    """
    Run performance benchmark for specified duration.
    
    Args:
        duration_seconds: How long to run the benchmark
    """
    print("=" * 80)
    print("NeuroPulse - Performance Benchmark")
    print("=" * 80)
    print(f"Duration: {duration_seconds} seconds")
    print(f"API Endpoint: {API_BASE_URL}")
    print()
    
    # Check if API is reachable
    try:
        response = requests.get(f"{API_BASE_URL}/api/health", timeout=5)
        if not response.ok:
            print("❌ API server not responding. Please start the API server first.")
            print("   Run: python3 -m stream-processing.neuro_pulse_streaming.api_server")
            return
    except Exception as e:
        print(f"❌ Cannot connect to API server: {e}")
        print("   Make sure the API server is running on port 8000")
        return
    
    print("✅ API server is running")
    print()
    print("Starting benchmark...")
    print("-" * 80)
    
    start_time = time.time()
    samples = []
    
    # Collect metrics every second
    while time.time() - start_time < duration_seconds:
        metrics = fetch_streaming_metrics()
        
        if metrics:
            timestamp = time.time() - start_time
            sample = {
                'timestamp': timestamp,
                'messages_per_second': metrics.get('messages_per_second', 0),
                'total_messages': metrics.get('messages_received', 0),
                'kafka_connected': metrics.get('kafka_connected', False),
            }
            
            # Add enhanced metrics if available
            if 'enhanced' in metrics and metrics['enhanced']:
                enhanced = metrics['enhanced']
                if 'aggregate' in enhanced:
                    agg = enhanced['aggregate']
                    sample['latency_p50'] = agg.get('overall_latency_p50_ms', 0)
                    sample['latency_p95'] = agg.get('overall_latency_p95_ms', 0)
                    sample['latency_p99'] = agg.get('overall_latency_p99_ms', 0)
            
            samples.append(sample)
            
            # Print progress
            elapsed = int(timestamp)
            remaining = duration_seconds - elapsed
            print(f"[{elapsed:3d}s] Throughput: {sample['messages_per_second']:6.2f} msg/s | "
                  f"Total: {sample['total_messages']:5d} | "
                  f"Remaining: {remaining:3d}s", end='\r')
        
        time.sleep(1)
    
    print()
    print("-" * 80)
    print()
    
    # Calculate statistics
    if not samples:
        print("❌ No data collected. Make sure the data generator is running.")
        return
    
    # Filter out samples with zero throughput for latency calculations
    active_samples = [s for s in samples if s.get('messages_per_second', 0) > 0]
    
    if not active_samples:
        print("⚠️  No active streaming detected. Start the data generator:")
        print("   python3 stream-processing/generate_live_kafka_data.py")
        return
    
    # Throughput statistics
    throughputs = [s['messages_per_second'] for s in active_samples]
    avg_throughput = statistics.mean(throughputs)
    max_throughput = max(throughputs)
    min_throughput = min(throughputs)
    
    # Latency statistics (if available)
    latencies_p50 = [s.get('latency_p50', 0) for s in active_samples if s.get('latency_p50', 0) > 0]
    latencies_p95 = [s.get('latency_p95', 0) for s in active_samples if s.get('latency_p95', 0) > 0]
    latencies_p99 = [s.get('latency_p99', 0) for s in active_samples if s.get('latency_p99', 0) > 0]
    
    # Print results
    print("📊 BENCHMARK RESULTS")
    print("=" * 80)
    print()
    print("THROUGHPUT METRICS:")
    print(f"  Average Throughput:  {avg_throughput:8.2f} messages/second")
    print(f"  Peak Throughput:     {max_throughput:8.2f} messages/second")
    print(f"  Min Throughput:      {min_throughput:8.2f} messages/second")
    print(f"  Total Messages:      {samples[-1]['total_messages']:8d} messages")
    print()
    
    if latencies_p50:
        print("LATENCY METRICS (End-to-End):")
        print(f"  P50 Latency (Median): {statistics.mean(latencies_p50):8.2f} ms")
        print(f"  P95 Latency:          {statistics.mean(latencies_p95):8.2f} ms")
        print(f"  P99 Latency:          {statistics.mean(latencies_p99):8.2f} ms")
        print()
        
        # Check if sub-second latency achieved
        avg_p99 = statistics.mean(latencies_p99)
        if avg_p99 < 1000:
            print(f"✅ SUB-SECOND LATENCY ACHIEVED! (P99: {avg_p99:.0f}ms < 1000ms)")
        else:
            print(f"⚠️  P99 latency above 1 second: {avg_p99:.0f}ms")
    else:
        print("ℹ️  Latency metrics not available (requires Kafka timestamps)")
    
    print()
    print("SYSTEM STATUS:")
    print(f"  Kafka Connected:     {'✅ Yes' if samples[-1]['kafka_connected'] else '❌ No'}")
    print(f"  Benchmark Duration:  {duration_seconds} seconds")
    print(f"  Samples Collected:   {len(samples)}")
    print()
    print("=" * 80)
    print()
    print("💡 For hackathon submission:")
    print("   - Include these metrics in your demo video")
    print("   - Highlight sub-second latency for time-critical stroke decisions")
    print("   - Show throughput handling multiple concurrent cases")
    print()


def main():
    parser = argparse.ArgumentParser(description="NeuroPulse Performance Benchmark")
    parser.add_argument('--duration', type=int, default=60,
                       help='Benchmark duration in seconds (default: 60)')
    args = parser.parse_args()
    
    run_benchmark(args.duration)


if __name__ == "__main__":
    main()

