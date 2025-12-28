FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY neuro_pulse_streaming/ ./neuro_pulse_streaming/
# Note: ai_models and data_generator will be copied from parent directory during build

# Note: Confluent config will be provided via environment variables
# or mounted as a secret in Cloud Run

# Set Python path
ENV PYTHONPATH=/app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/api/health')" || exit 1

# Run API server
CMD ["python", "-m", "neuro_pulse_streaming.api_server"]

