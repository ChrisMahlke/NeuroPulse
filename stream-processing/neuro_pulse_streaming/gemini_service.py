"""
NeuroPulse - Gemini Service

This module provides integration with Google Cloud Gemini (LLM) for generating
natural-language explanations and clinical recommendations based on AI predictions.

Architecture Context:
    After Vertex AI generates stroke/LVO probabilities, Gemini is called to create
    human-readable explanations that help clinicians understand:
    - Why the AI made specific predictions
    - What clinical factors drove the risk assessment
    - Recommended actions for EMS and ED teams
    
    This LLM-powered explanation layer makes the AI system more interpretable and
    actionable for healthcare providers who need to understand and trust AI recommendations.

AI/Medical Context:
    - Clinical Decision Support: Gemini generates explanations that translate ML
      probabilities into clinical language that EMS/ED teams can act on
    - Actionable Recommendations: Provides specific, time-critical actions for
      patient care during transport and upon arrival
    - Interpretability: Helps clinicians understand which factors (FAST findings,
      vitals, time windows) influenced the AI's assessment
    
    The explanations are structured to be:
    - Concise: Quick to read in time-critical situations
    - Clinically relevant: Focused on actionable interventions
    - Context-aware: Considers time windows, hospital routing, and risk factors

Fallback Strategy:
    If Gemini is unavailable, the service falls back to template-based explanations
    that still provide useful clinical guidance, ensuring system availability.

Note: All explanations use synthetic data for demonstration purposes only.
"""

from __future__ import annotations

from typing import Optional
import os
import logging

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

import sys
from pathlib import Path

# Add parent directories to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from ai_models.neuro_pulse_ai.prediction_service_stub import (
    AiPredictionRequest,
)

from .circuit_breaker import get_gemini_breaker, CircuitBreakerOpenError

logger = logging.getLogger(__name__)


# Configuration from environment variables
# These are required for Gemini integration but have fallback templates if not set
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")  # Google Gemini API key
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")  # Use flash model for faster responses in real-time scenarios


def _format_clinical_summary(request: AiPredictionRequest, stroke_prob: float, lvo_prob: float, risk_category: str) -> str:
    """
    Format a clinical summary string from patient data for Gemini prompt.
    
    This function transforms structured clinical data into a human-readable
    summary that Gemini can use to generate explanations. The summary includes
    key clinical findings that are relevant for stroke assessment.
    
    Args:
        request: Feature vector with clinical data
        stroke_prob: Stroke probability from Vertex AI (0.0-1.0)
        lvo_prob: LVO probability from Vertex AI (0.0-1.0)
        risk_category: Risk category (LOW, MODERATE, HIGH, CRITICAL)
        
    Returns:
        str: Formatted clinical summary string for LLM prompt
        
    Use Case:
        This summary is included in the prompt to Gemini so it can generate
        contextually relevant explanations based on the actual patient data.
    """
    vitals = []
    if request.heart_rate_bpm:
        vitals.append(f"HR: {request.heart_rate_bpm} bpm")
    if request.systolic_bp_mmHg and request.diastolic_bp_mmHg:
        vitals.append(f"BP: {request.systolic_bp_mmHg}/{request.diastolic_bp_mmHg} mmHg")
    if request.spo2_pct:
        vitals.append(f"SpO2: {request.spo2_pct}%")
    if request.gcs_total:
        vitals.append(f"GCS: {request.gcs_total}")
    
    vitals_str = ", ".join(vitals) if vitals else "Limited vitals available"

    fast_findings = []
    if request.face_droop_present:
        fast_findings.append("face droop")
    if request.arm_weakness_any:
        fast_findings.append("arm weakness")
    if request.speech_abnormal_any:
        fast_findings.append("speech difficulty")
    
    fast_str = ", ".join(fast_findings) if fast_findings else "no FAST findings"
    fast_score_str = f"FAST score: {request.fast_score}" if request.fast_score else "FAST score: not available"

    onset_str = "unknown"
    if request.minutes_since_symptom_onset is not None:
        if request.minutes_since_symptom_onset < 60:
            onset_str = f"{request.minutes_since_symptom_onset} minutes"
        else:
            hours = request.minutes_since_symptom_onset // 60
            mins = request.minutes_since_symptom_onset % 60
            onset_str = f"{hours}h {mins}m" if mins > 0 else f"{hours}h"

    return f"""Patient: {request.patient_id}, Case: {request.case_id}
Vitals: {vitals_str}
FAST exam: {fast_str} ({fast_score_str})
Time since symptom onset: {onset_str}
Stroke probability: {stroke_prob:.0%}
LVO probability: {lvo_prob:.0%}
Risk category: {risk_category}"""


def _generate_gemini_prompt(request: AiPredictionRequest, stroke_prob: float, lvo_prob: float, risk_category: str, recommended_hospital: Optional[str] = None) -> str:
    """
    Generate a structured prompt for Gemini to create clinical explanations.
    
    This function creates a prompt that instructs Gemini to act as a clinical
    decision support assistant and generate:
    1. A concise summary explaining the stroke risk assessment
    2. Recommended actions for EMS during transport
    
    The prompt includes patient data, AI predictions, and routing recommendations
    to enable contextually relevant explanations.
    
    Prompt Engineering:
        - Role: Positions Gemini as a clinical decision support assistant
        - Context: Provides patient data and AI predictions
        - Format: Requests structured JSON output for easy parsing
        - Tone: Emphasizes conciseness and clinical relevance
    
    Args:
        request: Feature vector with clinical data
        stroke_prob: Stroke probability from Vertex AI
        lvo_prob: LVO probability from Vertex AI
        risk_category: Risk category (LOW, MODERATE, HIGH, CRITICAL)
        recommended_hospital: Optional hospital ID for routing context
        
    Returns:
        str: Complete prompt string for Gemini API
    """
    clinical_summary = _format_clinical_summary(request, stroke_prob, lvo_prob, risk_category)
    
    prompt = f"""You are a clinical decision support assistant for emergency stroke care. Based on the following patient data, provide:

1. A concise 2-3 sentence summary explaining the stroke risk assessment
2. Recommended actions for EMS during transport

Patient Data:
{clinical_summary}

"""
    
    if recommended_hospital:
        prompt += f"Recommended destination: {recommended_hospital}\n\n"
    
    prompt += """Provide your response in the following JSON format:
{
  "summary": "Brief explanation of the risk assessment and key factors",
  "recommended_actions": [
    "Action 1 for EMS",
    "Action 2 for EMS",
    "Action 3 for EMS"
  ]
}

Be concise, clinically relevant, and focus on time-critical interventions."""

    return prompt


def generate_explanation_with_gemini(
    request: AiPredictionRequest,
    stroke_prob: float,
    lvo_prob: float,
    risk_category: str,
    recommended_hospital: Optional[str] = None,
) -> tuple[str, str]:
    """
    Generate natural language explanation and clinical recommendations using Gemini LLM.
    
    This is the main entry point for LLM-powered clinical explanations. It calls
    Google Gemini to generate human-readable explanations that help clinicians
    understand the AI's predictions and recommended actions.
    
    AI Pipeline:
        1. Format clinical summary from patient data
        2. Generate structured prompt for Gemini
        3. Call Gemini API with prompt
        4. Parse JSON response to extract summary and actions
        5. Fall back to template-based explanation if Gemini fails
    
    Output Format:
        - summary: 2-3 sentence explanation of the risk assessment and key factors
        - recommended_actions: List of actionable items for EMS during transport
    
    Medical Context:
        The explanations are designed to be:
        - Time-critical: Quick to read and act on
        - Actionable: Specific interventions for EMS teams
        - Interpretable: Explains which factors drove the AI assessment
        
    Args:
        request: Feature vector with clinical data
        stroke_prob: Stroke probability from Vertex AI (0.0-1.0)
        lvo_prob: LVO probability from Vertex AI (0.0-1.0)
        risk_category: Risk category (LOW, MODERATE, HIGH, CRITICAL)
        recommended_hospital: Optional hospital ID for routing context
        
    Returns:
        tuple: (summary_string, recommended_actions_string)
        
    Error Handling:
        Gracefully falls back to template-based explanations if:
        - Gemini API key is not configured
        - API call fails
        - Response parsing fails
        
    Note:
        The function attempts to parse JSON from Gemini's response, but also
        handles free-form text responses for robustness.
    """
    # If Gemini is not available, use fallback
    if not GEMINI_AVAILABLE or not GEMINI_API_KEY:
        logger.info("Gemini not configured, using template-based explanations")
        return _generate_fallback_explanation(request, stroke_prob, lvo_prob, risk_category, recommended_hospital)

    # Get circuit breaker for Gemini calls
    breaker = get_gemini_breaker()

    def _call_gemini():
        """Internal function to call Gemini (wrapped by circuit breaker)"""
        # Configure Gemini
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(GEMINI_MODEL)

        # Generate prompt
        prompt = _generate_gemini_prompt(request, stroke_prob, lvo_prob, risk_category, recommended_hospital)

        # Call Gemini
        response = model.generate_content(prompt)

        # Parse response
        response_text = response.text.strip()

        # Try to extract JSON from response
        import json
        import re

        # Look for JSON in the response
        json_match = re.search(r'\{[^}]+\}', response_text, re.DOTALL)
        if json_match:
            try:
                parsed = json.loads(json_match.group(0))
                summary = parsed.get("summary", response_text)
                actions = parsed.get("recommended_actions", [])
                actions_str = "\n".join(f"- {action}" for action in actions) if isinstance(actions, list) else str(actions)
                return summary, actions_str
            except json.JSONDecodeError:
                pass

        # If JSON parsing failed, try to extract summary and actions from text
        lines = response_text.split("\n")
        summary = lines[0] if lines else response_text[:200]
        actions = "\n".join(lines[1:]) if len(lines) > 1 else "See summary above."

        return summary, actions

    try:
        # Call Gemini with circuit breaker protection
        return breaker.call(_call_gemini)

    except CircuitBreakerOpenError:
        # Circuit is open, fail fast with template
        logger.warning("Gemini circuit breaker is OPEN, using template-based explanations")
        return _generate_fallback_explanation(request, stroke_prob, lvo_prob, risk_category, recommended_hospital)

    except Exception as e:
        logger.error(f"Error calling Gemini API: {e}", exc_info=True)
        logger.info("Falling back to template-based explanation")
        return _generate_fallback_explanation(request, stroke_prob, lvo_prob, risk_category, recommended_hospital)


def _generate_fallback_explanation(
    request: AiPredictionRequest,
    stroke_prob: float,
    lvo_prob: float,
    risk_category: str,
    recommended_hospital: Optional[str] = None,
) -> tuple[str, str]:
    """
    Generate template-based explanation when Gemini is not available.
    
    This function provides a fallback mechanism that generates clinically
    relevant explanations using templates and clinical rules. This ensures
    the system continues to provide useful guidance even if Gemini is
    unavailable or not configured.
    
    The fallback explanations:
    - Include key clinical information (probabilities, risk category)
    - Provide standard clinical actions for stroke care
    - Consider LVO probability for routing recommendations
    - Account for time windows for treatment eligibility
    
    Args:
        request: Feature vector with clinical data
        stroke_prob: Stroke probability from Vertex AI
        lvo_prob: LVO probability from Vertex AI
        risk_category: Risk category (LOW, MODERATE, HIGH, CRITICAL)
        recommended_hospital: Optional hospital ID for routing context
        
    Returns:
        tuple: (summary_string, recommended_actions_string)
        
    Use Case:
        Called when Gemini API is unavailable, ensuring system continues to
        function and provide clinical guidance.
    """
    onset_str = "unknown onset time"
    if request.minutes_since_symptom_onset is not None:
        if request.minutes_since_symptom_onset < 60:
            onset_str = f"{request.minutes_since_symptom_onset} minutes"
        else:
            hours = request.minutes_since_symptom_onset // 60
            onset_str = f"{hours} hours"

    summary = (
        f"NeuroPulse estimates a {stroke_prob:.0%} probability of acute ischemic stroke "
        f"and a {lvo_prob:.0%} probability of large vessel occlusion in a patient "
        f"with symptoms for approximately {onset_str}. "
        f"Overall risk is categorized as {risk_category}."
    )

    if recommended_hospital:
        summary += f" The system recommends routing to {recommended_hospital}."

    actions = [
        "- Maintain airway, breathing, and circulation; avoid hypotension.",
        "- Keep SpO₂ ≥ 94% and manage blood glucose if severely abnormal.",
        "- Perform ongoing neurological reassessment during transport.",
    ]

    if request.ems_suspected_lvo or lvo_prob >= 0.4:
        actions.append("- Pre-notify comprehensive stroke center about suspected LVO for possible EVT.")
    else:
        actions.append("- Pre-notify primary stroke center for rapid imaging and thrombolysis evaluation.")

    if request.minutes_since_symptom_onset is not None and request.minutes_since_symptom_onset > 270:
        actions.append("- Given longer time from onset, emphasize rapid imaging and consider EVT eligibility.")

    return summary, "\n".join(actions)

