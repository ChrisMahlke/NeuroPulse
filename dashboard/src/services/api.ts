// src/services/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_TIMEOUT = 10000; // 10 seconds

/**
 * Helper function to create a fetch request with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = API_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timeout - API server not responding");
    }
    throw error;
  }
}

export interface CaseSummary {
  caseId: string;
  patientId: string;
  displayName: string;
  riskCategory: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  strokeProbability: number;
  lvoProbability: number;
  minutesSinceOnset: number | null;
  isActive: boolean;
}

export interface PredictionDetail {
  predictionId: string;
  caseId: string;
  patientId: string;
  predictionTs: string;
  strokeProbability: number;
  lvoProbability: number;
  riskCategory: string;
  recommendedDestinationHospitalId: string | null;
  recommendedDestinationType: string | null;
  estimatedTravelMinToRecommended: number | null;
  estimatedAdditionalDoorToNeedleMinAtRecommended: number | null;
  timeWindowAssessment: string | null;
  topRiskFactors: string[] | null;
  llmExplanationSummary: string | null;
  llmRecommendedActions: string | null;
  currentVitals?: {
    heart_rate_bpm?: number;
    systolic_bp_mmHg?: number;
    diastolic_bp_mmHg?: number;
    spo2_pct?: number;
    gcs_total?: number;
    ecg_rhythm?:
      | "normal"
      | "sinus_tachycardia"
      | "sinus_bradycardia"
      | "atrial_fibrillation"
      | "ventricular_tachycardia";
    event_ts?: string; // Timestamp of when vitals were taken
  } | null;

  // Enhanced AI features
  predictionConfidence?: number | null; // Confidence score (0.0-1.0) for the prediction
  trendIndicators?: {
    hr_rate_of_change?: number | null;
    bp_rate_of_change?: number | null;
    spo2_rate_of_change?: number | null;
    gcs_rate_of_change?: number | null;
    hr_trend?: number | null; // -1 = worsening, 0 = stable, 1 = improving
    bp_trend?: number | null;
    spo2_trend?: number | null;
    gcs_trend?: number | null;
    hr_volatility?: number | null;
    bp_volatility?: number | null;
    spo2_volatility?: number | null;
  } | null;
  detectedAnomalies?: string[] | null; // Anomalies detected in vital signs
  featureImportance?: Record<string, number> | null; // Feature importance scores for explainability
}

export async function fetchCases(): Promise<CaseSummary[]> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/cases`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(
        `API server returned an error: ${response.status} ${response.statusText}`
      );
    }
    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(
        `Cannot connect to API server at ${API_BASE_URL}. Make sure the API server is running.`
      );
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred while fetching cases.");
  }
}

export async function fetchCaseDetail(
  caseId: string
): Promise<PredictionDetail> {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/api/cases/${caseId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Case ${caseId} not found.`);
      }
      throw new Error(
        `API server returned an error: ${response.status} ${response.statusText}`
      );
    }
    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(
        `Cannot connect to API server at ${API_BASE_URL}. Make sure the API server is running.`
      );
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      "An unexpected error occurred while fetching case details."
    );
  }
}

export async function checkHealth(): Promise<{
  status: string;
  kafka_consumer: string;
  cases_count: number;
}> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(
        `Health check failed: ${response.status} ${response.statusText}`
      );
    }
    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(
        `Cannot connect to API server at ${API_BASE_URL}. Make sure the API server is running.`
      );
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred during health check.");
  }
}
