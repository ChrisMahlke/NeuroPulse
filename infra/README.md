# Infrastructure

This directory contains infrastructure-as-code and deployment configuration files for NeuroPulse.

## Table of Contents

- [Purpose](#purpose)
- [Files](#files)
  - [Cloud Build Configuration](#cloud-build-configuration)
  - [Dockerfiles](#dockerfiles)
- [Deployment Architecture](#deployment-architecture)
- [Deployment Options](#deployment-options)
  - [Option 1: Google Cloud Run (Recommended)](#option-1-google-cloud-run-recommended)
  - [Option 2: Kubernetes](#option-2-kubernetes)
  - [Option 3: Local Development](#option-3-local-development)
- [Environment Variables](#environment-variables)
  - [Required for Production](#required-for-production)
- [Security Considerations](#security-considerations)
- [Monitoring and Logging](#monitoring-and-logging)
- [Cost Optimization](#cost-optimization)
- [Related Documentation](#related-documentation)

---

## Purpose

Infrastructure configuration for deploying NeuroPulse to cloud platforms, primarily Google Cloud Platform.

## Files

### Cloud Build Configuration

**`cloudbuild.yaml`** (in project root)
- Google Cloud Build configuration for API server
- Builds Docker image and deploys to Cloud Run
- Handles environment variables and secrets

**`cloudbuild-dashboard.yaml`** (in project root)
- Google Cloud Build configuration for dashboard
- Builds Next.js application and deploys to Cloud Run
- Handles static asset optimization

### Dockerfiles

**`Dockerfile.api`** (in project root)
- Docker image for API server and stream processor
- Based on Python 3.9 slim
- Includes all Python dependencies

**`stream-processing/Dockerfile`**
- Alternative Dockerfile for stream processing services
- Used for containerized deployments

**`dashboard/Dockerfile`**
- Docker image for Next.js dashboard
- Multi-stage build for optimization
- Includes Node.js dependencies

## Deployment Architecture

```
┌─────────────────┐
│  Confluent Cloud│  Managed Kafka (external)
│   Kafka Topics  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Google Cloud Run│  Stream Processor (container)
│  (Stream Proc)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Google Cloud Run│  API Server (container)
│  (API Server)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Google Cloud Run│  Dashboard (container)
│  (Dashboard)    │
└─────────────────┘
```

## Deployment Options

### Option 1: Google Cloud Run (Recommended)

**Pros:**
- Serverless, pay-per-use
- Auto-scaling
- Easy deployment
- Built-in HTTPS

**Steps:**
1. Build Docker images using Cloud Build
2. Deploy to Cloud Run with environment variables
3. Configure Confluent Cloud credentials as secrets

### Option 2: Kubernetes

**Pros:**
- More control
- Better for high-scale deployments
- Can run on-premises

**Steps:**
1. Create Kubernetes manifests
2. Deploy to GKE or other Kubernetes cluster
3. Configure secrets and config maps

### Option 3: Local Development

**Pros:**
- Fast iteration
- No cloud costs
- Easy debugging

**Steps:**
1. Run services locally (see [GETTING_STARTED.md](../GETTING_STARTED.md))
2. Use local Kafka or Confluent Cloud
3. Connect dashboard to local API server

## Environment Variables

### Required for Production

```bash
# Confluent Cloud
KAFKA_BOOTSTRAP_SERVERS=pkc-xxxxx.region.cloud:9092
KAFKA_SASL_USERNAME=your-api-key
KAFKA_SASL_PASSWORD=your-api-secret

# Google Cloud AI (Optional)
GEMINI_API_KEY=your-gemini-key
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
```

## Security Considerations

1. **Secrets Management:**
   - Use Google Secret Manager for API keys
   - Never commit credentials to git
   - Use environment variables in Cloud Run

2. **Network Security:**
   - Cloud Run services are private by default
   - Configure CORS for dashboard API access
   - Use VPC connector if needed for private resources

3. **Authentication:**
   - Confluent Cloud uses SASL/SSL authentication
   - Google Cloud services use service accounts

## Monitoring and Logging

- **Cloud Run Logs:** View in Google Cloud Console
- **Confluent Cloud Metrics:** View in Confluent Cloud dashboard
- **Application Metrics:** Exposed via `/api/health` endpoint

## Cost Optimization

- **Cloud Run:** Scales to zero when idle (no charges)
- **Confluent Cloud:** Basic cluster is sufficient for hackathon
- **Vertex AI:** Pay per prediction (can use stub for development)

## Related Documentation

- See [GETTING_STARTED.md](../GETTING_STARTED.md) for local setup
- See [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) for deployment issues
- See [Google Cloud Run docs](https://cloud.google.com/run/docs) for deployment details

