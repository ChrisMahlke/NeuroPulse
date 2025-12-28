"""
NeuroPulse - Trend Analyzer

This module provides real-time trend analysis for vital signs, enabling the AI
to incorporate temporal patterns into predictions. This demonstrates advanced
feature engineering for "AI on data in motion."

Architecture Context:
    The trend analyzer processes historical vital sign data to extract temporal
    features that enhance AI predictions:
    - Rate of change: How quickly vitals are changing
    - Trend direction: Whether vitals are improving or deteriorating
    - Acceleration: Rate of change of the rate of change
    - Stability: How volatile vitals are over time
    
    These features are incorporated into the AI prediction request, allowing
    the model to consider not just current values but also how the patient's
    condition is evolving.

AI/Medical Context:
    Temporal features are critical for stroke assessment:
    - Rapid deterioration: Sudden worsening of GCS or vitals suggests severe stroke
    - Improving trends: May indicate transient ischemic attack (TIA) or recovery
    - Volatility: Unstable vitals can indicate complications or artifact
    - Time-weighted trends: Recent changes are more significant than older ones

Note: All data in this system is synthetic and for demonstration purposes only.
"""

from __future__ import annotations

from typing import Optional, Dict, List, Tuple
from dataclasses import dataclass
from datetime import datetime
import math


@dataclass
class VitalSnapshot:
    """Single vital sign measurement with timestamp."""
    timestamp: str  # ISO format timestamp
    heart_rate_bpm: Optional[int] = None
    systolic_bp_mmHg: Optional[int] = None
    diastolic_bp_mmHg: Optional[int] = None
    spo2_pct: Optional[int] = None
    gcs_total: Optional[int] = None


@dataclass
class TrendFeatures:
    """Temporal features extracted from vital sign history."""
    # Rate of change (per minute)
    hr_rate_of_change: Optional[float] = None  # bpm/min
    bp_rate_of_change: Optional[float] = None  # mmHg/min
    spo2_rate_of_change: Optional[float] = None  # %/min
    gcs_rate_of_change: Optional[float] = None  # points/min
    
    # Trend direction (-1 = worsening, 0 = stable, 1 = improving)
    hr_trend: Optional[int] = None
    bp_trend: Optional[int] = None
    spo2_trend: Optional[int] = None
    gcs_trend: Optional[int] = None
    
    # Volatility (coefficient of variation)
    hr_volatility: Optional[float] = None
    bp_volatility: Optional[float] = None
    spo2_volatility: Optional[float] = None
    
    # Time-weighted recent change (more weight on recent measurements)
    hr_recent_change: Optional[float] = None
    bp_recent_change: Optional[float] = None
    spo2_recent_change: Optional[float] = None
    gcs_recent_change: Optional[float] = None


class TrendAnalyzer:
    """
    Analyzes vital sign trends over time to extract temporal features.
    
    This class maintains a sliding window of vital sign measurements and
    calculates trend features that can be incorporated into AI predictions.
    """
    
    def __init__(self, max_history_size: int = 20):
        """
        Initialize the trend analyzer.
        
        Args:
            max_history_size: Maximum number of vital snapshots to keep in history
        """
        self.max_history_size = max_history_size
        self.vital_history: Dict[str, List[VitalSnapshot]] = {}  # case_id -> list of snapshots
    
    def add_vital_snapshot(self, case_id: str, snapshot: VitalSnapshot) -> None:
        """
        Add a new vital sign snapshot to the history for a case.
        
        Maintains a sliding window of the most recent measurements.
        
        Args:
            case_id: Case identifier
            snapshot: Vital sign measurement with timestamp
        """
        if case_id not in self.vital_history:
            self.vital_history[case_id] = []
        
        self.vital_history[case_id].append(snapshot)
        
        # Keep only the most recent measurements
        if len(self.vital_history[case_id]) > self.max_history_size:
            self.vital_history[case_id] = self.vital_history[case_id][-self.max_history_size:]
    
    def calculate_trends(self, case_id: str) -> TrendFeatures:
        """
        Calculate trend features from vital sign history.
        
        This method analyzes the historical vital signs for a case and extracts
        temporal features that indicate how the patient's condition is evolving.
        
        Medical Context:
            - Rate of change: Rapid changes suggest acute events or complications
            - Trend direction: Worsening trends (declining GCS, dropping SpO2) are concerning
            - Volatility: High volatility may indicate instability or artifact
            - Recent change: Weighted toward most recent measurements (more relevant)
        
        Args:
            case_id: Case identifier
            
        Returns:
            TrendFeatures: Extracted temporal features, or empty features if insufficient data
        """
        if case_id not in self.vital_history or len(self.vital_history[case_id]) < 2:
            return TrendFeatures()  # Need at least 2 points for trend analysis
        
        history = self.vital_history[case_id]
        
        # Extract time series for each vital
        hr_values = [(self._parse_timestamp(s.timestamp), s.heart_rate_bpm) 
                     for s in history if s.heart_rate_bpm is not None]
        bp_values = [(self._parse_timestamp(s.timestamp), s.systolic_bp_mmHg) 
                    for s in history if s.systolic_bp_mmHg is not None]
        spo2_values = [(self._parse_timestamp(s.timestamp), s.spo2_pct) 
                      for s in history if s.spo2_pct is not None]
        gcs_values = [(self._parse_timestamp(s.timestamp), s.gcs_total) 
                     for s in history if s.gcs_total is not None]
        
        features = TrendFeatures()
        
        # Calculate rate of change and trends
        if len(hr_values) >= 2:
            features.hr_rate_of_change, features.hr_trend = self._calculate_rate_and_trend(hr_values)
            features.hr_volatility = self._calculate_volatility([v[1] for v in hr_values])
            features.hr_recent_change = self._calculate_recent_change(hr_values)
        
        if len(bp_values) >= 2:
            features.bp_rate_of_change, features.bp_trend = self._calculate_rate_and_trend(bp_values)
            features.bp_volatility = self._calculate_volatility([v[1] for v in bp_values])
            features.bp_recent_change = self._calculate_recent_change(bp_values)
        
        if len(spo2_values) >= 2:
            features.spo2_rate_of_change, features.spo2_trend = self._calculate_rate_and_trend(spo2_values)
            features.spo2_volatility = self._calculate_volatility([v[1] for v in spo2_values])
            features.spo2_recent_change = self._calculate_recent_change(spo2_values)
        
        if len(gcs_values) >= 2:
            features.gcs_rate_of_change, features.gcs_trend = self._calculate_rate_and_trend(gcs_values)
            features.gcs_recent_change = self._calculate_recent_change(gcs_values)
        
        return features
    
    def _parse_timestamp(self, timestamp: str) -> float:
        """Parse ISO timestamp to seconds since epoch."""
        try:
            dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            return dt.timestamp()
        except:
            return 0.0
    
    def _calculate_rate_and_trend(self, values: List[Tuple[float, float]]) -> Tuple[Optional[float], Optional[int]]:
        """
        Calculate rate of change (per minute) and trend direction.
        
        Args:
            values: List of (timestamp, value) tuples
            
        Returns:
            Tuple of (rate_of_change_per_minute, trend_direction)
            trend_direction: -1 = worsening, 0 = stable, 1 = improving
        """
        if len(values) < 2:
            return None, None
        
        # Sort by timestamp
        values = sorted(values, key=lambda x: x[0])
        
        # Calculate rate of change from first to last
        time_diff_min = (values[-1][0] - values[0][0]) / 60.0
        if time_diff_min == 0:
            return None, None
        
        value_diff = values[-1][1] - values[0][1]
        rate = value_diff / time_diff_min
        
        # Determine trend direction
        if abs(rate) < 0.1:  # Very small change = stable
            trend = 0
        elif rate > 0:
            trend = 1  # Increasing (improving for most vitals)
        else:
            trend = -1  # Decreasing (worsening for most vitals)
        
        # For GCS and SpO2, higher is better, so reverse trend
        # (This is a simplification - we'd need to know which vital this is)
        # For now, we'll handle this in the calling code
        
        return rate, trend
    
    def _calculate_volatility(self, values: List[float]) -> Optional[float]:
        """
        Calculate coefficient of variation (volatility).
        
        Args:
            values: List of vital sign values
            
        Returns:
            Coefficient of variation (std dev / mean), or None if insufficient data
        """
        if len(values) < 2:
            return None
        
        mean = sum(values) / len(values)
        if mean == 0:
            return None
        
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        std_dev = math.sqrt(variance)
        
        return std_dev / mean if mean != 0 else None
    
    def _calculate_recent_change(self, values: List[Tuple[float, float]], window_minutes: float = 5.0) -> Optional[float]:
        """
        Calculate time-weighted recent change (more weight on recent measurements).
        
        Args:
            values: List of (timestamp, value) tuples
            window_minutes: Time window to consider for "recent" change
            
        Returns:
            Weighted change value, or None if insufficient data
        """
        if len(values) < 2:
            return None
        
        values = sorted(values, key=lambda x: x[0])
        latest_time = values[-1][0]
        
        # Filter to recent window
        recent_values = [(t, v) for t, v in values 
                        if (latest_time - t) / 60.0 <= window_minutes]
        
        if len(recent_values) < 2:
            return None
        
        # Calculate weighted average (exponential decay - more recent = more weight)
        total_weight = 0.0
        weighted_sum = 0.0
        
        for t, v in recent_values:
            age_minutes = (latest_time - t) / 60.0
            weight = math.exp(-age_minutes / 2.0)  # Exponential decay with 2-minute half-life
            weighted_sum += v * weight
            total_weight += weight
        
        if total_weight == 0:
            return None
        
        weighted_avg = weighted_sum / total_weight
        return weighted_avg - recent_values[0][1]  # Change from first to weighted average
    
    def detect_anomalies(self, case_id: str) -> List[str]:
        """
        Detect anomalous patterns in vital signs that might indicate complications.
        
        Medical Context:
            Anomalies can indicate:
            - Rapid deterioration: Sudden drops in GCS or SpO2
            - Extreme values: Very high/low vitals outside normal ranges
            - Instability: High volatility suggesting complications
            - Artifact: Unrealistic changes (e.g., BP jumping 50 mmHg instantly)
        
        Args:
            case_id: Case identifier
            
        Returns:
            List of anomaly descriptions, empty if no anomalies detected
        """
        if case_id not in self.vital_history or len(self.vital_history[case_id]) < 2:
            return []
        
        history = self.vital_history[case_id]
        anomalies = []
        
        # Check for rapid deterioration
        gcs_values = [s.gcs_total for s in history if s.gcs_total is not None]
        if len(gcs_values) >= 2:
            gcs_drop = gcs_values[0] - gcs_values[-1]
            if gcs_drop >= 2:  # Drop of 2+ points is significant
                anomalies.append(f"Rapid GCS deterioration: {gcs_values[0]} → {gcs_values[-1]}")
        
        spo2_values = [s.spo2_pct for s in history if s.spo2_pct is not None]
        if len(spo2_values) >= 2:
            spo2_drop = spo2_values[0] - spo2_values[-1]
            if spo2_drop >= 5:  # Drop of 5+ percentage points
                anomalies.append(f"Significant SpO2 decline: {spo2_values[0]}% → {spo2_values[-1]}%")
        
        # Check for extreme values
        hr_values = [s.heart_rate_bpm for s in history if s.heart_rate_bpm is not None]
        if hr_values:
            max_hr = max(hr_values)
            min_hr = min(hr_values)
            if max_hr > 150 or min_hr < 40:
                anomalies.append(f"Extreme heart rate: {min_hr}-{max_hr} bpm")
        
        # Check for unrealistic BP changes (possible artifact)
        bp_values = [s.systolic_bp_mmHg for s in history if s.systolic_bp_mmHg is not None]
        if len(bp_values) >= 2:
            bp_changes = [abs(bp_values[i] - bp_values[i-1]) for i in range(1, len(bp_values))]
            max_change = max(bp_changes) if bp_changes else 0
            if max_change > 50:  # Unrealistic jump
                anomalies.append(f"Unusual BP variation: {max_change} mmHg change detected")
        
        return anomalies

