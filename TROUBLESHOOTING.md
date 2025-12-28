# Troubleshooting Guide

Quick fixes for common issues.

## Table of Contents

- [Dashboard Shows "Failed to fetch"](#dashboard-shows-failed-to-fetch)
- [No Cases in Dashboard](#no-cases-in-dashboard)
- [Streaming Metrics Show 0](#streaming-metrics-show-0)
- [WebSocket Connection Failed](#websocket-connection-failed)
- [Kafka Config Not Found](#kafka-config-not-found)
- [Stream Processor Not Processing](#stream-processor-not-processing)
- [Still Having Issues?](#still-having-issues)

---

## Dashboard Shows "Failed to fetch"

**Problem:** Dashboard can't connect to API server.

**Solution:**
1. Check API server is running: `curl http://localhost:8000/api/health`
2. If not running: `python3 -m stream-processing.neuro_pulse_streaming.api_server`
3. Check browser console for CORS errors

---

## No Cases in Dashboard

**Problem:** Dashboard shows 0 cases.

**Solution:**
1. Check stream processor is running (Terminal 1)
2. Check data generator is running (Terminal 3)
3. Check stream processor logs for "Published prediction"
4. Check API server logs for "Received message from ai.prediction.output"

---

## Streaming Metrics Show 0

**Problem:** Confluent Cloud Streaming Status (in About modal) shows `messages_received: 0`.

**Possible Causes:**
1. **Using wrong data generator** - Make sure you're using `generate_live_kafka_data.py` (not `generate_live_mock_data.py`)
2. **Consumer offset** - Consumer might be reading from "latest" and missing messages
3. **Stream processor not publishing** - Check stream processor logs

**Solution:**
- Restart all services
- Make sure data generator is running **while** API server consumer is active
- Check Confluent Cloud console - do you see messages?
- To view metrics: Click the **About** button (ℹ️ icon) in the dashboard and scroll to "Confluent Cloud Streaming Status"

---

## WebSocket Connection Failed

**Problem:** Browser console shows WebSocket errors.

**Solution:**
- Dashboard still works with REST API polling (updates every 10 seconds)
- Check API server is running on port 8000
- Check firewall isn't blocking WebSocket connections

---

## Kafka Config Not Found

**Problem:** Error: "Kafka config file not found"

**Solution:**
1. Copy example configs:
   ```bash
   cp data_generator/confluent_config.example.ini data_generator/confluent_config.ini
   cp stream-processing/confluent_config.example.ini stream-processing/confluent_config.ini
   ```
2. Edit both files with your Confluent Cloud credentials
3. Make sure file paths are correct

---

## Stream Processor Not Processing

**Problem:** Stream processor running but no "Processing case" messages.

**Possible Causes:**
- No matching case IDs (vitals and FAST exam need same `case_id`)
- Missing hospital capacity data
- Consumer reading from "latest" offset

**Solution:**
- Send test data while stream processor is running
- Check logs for "Received vitals" and "Received FAST exam"
- Make sure case IDs match

---

## Still Having Issues?

1. **Check all services are running:**
   - Stream processor (Terminal 1)
   - API server (Terminal 2)
   - Data generator (Terminal 3)

2. **Check logs:**
   - Each service prints helpful error messages
   - Look for red error text

3. **Restart everything:**
   - Stop all services (Ctrl+C)
   - Start in order: Stream processor → API server → Data generator

4. **See [GETTING_STARTED.md](GETTING_STARTED.md)** for complete setup guide
