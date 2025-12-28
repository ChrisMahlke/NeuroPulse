"use client";

import React from 'react';
import { Box, Typography, useTheme, Stack, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';
import WarningIcon from '@mui/icons-material/Warning';
import { useThemeMode } from '@/theme/ThemeContext';

interface VitalCardProps {
  label: string;
  value: string | number;
  unit: string;
  color: string;
  trend?: 'up' | 'down' | 'stable';
  normalRange?: string;
  isBloodPressure?: boolean; // Flag to enable BP-specific logic
  vitalType?: 'heartRate' | 'spo2' | 'gcs' | 'bp'; // Type of vital for range checking
}

export function VitalCard({ label, value, unit, color, trend, normalRange, isBloodPressure, vitalType }: VitalCardProps) {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isLight = mode === 'light';
  
  const TrendIcon = trend === 'up' ? TrendingUpIcon : trend === 'down' ? TrendingDownIcon : RemoveIcon;
  const trendColor = trend === 'up' 
    ? theme.palette.error.main 
    : trend === 'down' 
    ? theme.palette.success.main 
    : theme.palette.text.secondary;

  // Determine if value is in normal range (simple heuristic)
  const isNormal = trend === 'stable' || !trend;

  // Vital-specific color logic
  let vitalColor = color;
  let vitalStatus: 'normal' | 'high' | 'low' | 'very-high' | 'very-low' = 'normal';
  
  // Blood Pressure logic
  if (isBloodPressure && typeof value === 'string' && value.includes('/')) {
    const parts = value.split('/');
    const systolicStr = parts[0]?.trim();
    const diastolicStr = parts[1]?.trim();
    
    // Parse values, handling cases where one might be '--' or invalid
    const systolic = parseInt(systolicStr);
    const diastolic = parseInt(diastolicStr);
    
    if (!isNaN(systolic) && !isNaN(diastolic)) {
      // BP classification based on AHA guidelines
      if (systolic >= 180 || diastolic >= 120) {
        vitalStatus = 'very-high';
        vitalColor = theme.palette.error.main; // Red
      } else if (systolic >= 140 || diastolic >= 90) {
        vitalStatus = 'high';
        vitalColor = theme.palette.error.main; // Red for high BP (more serious than warning)
      } else if (systolic < 90 || diastolic < 60) {
        vitalStatus = 'very-low';
        vitalColor = theme.palette.error.main; // Red
      } else if (systolic < 100 || diastolic < 65) {
        vitalStatus = 'low';
        vitalColor = theme.palette.info.main; // Blue
      } else {
        vitalStatus = 'normal';
        vitalColor = theme.palette.success.main; // Green
      }
    }
  }
  // Heart Rate logic (normal: 60-100 bpm)
  else if (vitalType === 'heartRate' && typeof value === 'number') {
    if (value >= 120) {
      vitalStatus = 'very-high';
      vitalColor = theme.palette.error.main; // Red
    } else if (value > 100) {
      vitalStatus = 'high';
      vitalColor = theme.palette.warning.main; // Orange
    } else if (value < 50) {
      vitalStatus = 'very-low';
      vitalColor = theme.palette.error.main; // Red
    } else if (value < 60) {
      vitalStatus = 'low';
      vitalColor = theme.palette.warning.main; // Orange
    } else {
      vitalStatus = 'normal';
      vitalColor = theme.palette.success.main; // Green
    }
  }
  // SpO2 logic (normal: 95-100%)
  else if (vitalType === 'spo2' && typeof value === 'number') {
    if (value < 90) {
      vitalStatus = 'very-low';
      vitalColor = theme.palette.error.main; // Red
    } else if (value < 94) {
      vitalStatus = 'low';
      vitalColor = theme.palette.warning.main; // Orange
    } else {
      vitalStatus = 'normal';
      vitalColor = theme.palette.success.main; // Green
    }
  }
  // GCS logic (normal: 15, concerning: <13)
  else if (vitalType === 'gcs' && typeof value === 'number') {
    if (value <= 8) {
      vitalStatus = 'very-low';
      vitalColor = theme.palette.error.main; // Red
    } else if (value < 13) {
      vitalStatus = 'low';
      vitalColor = theme.palette.warning.main; // Orange
    } else if (value < 15) {
      vitalStatus = 'normal'; // Slightly reduced but not critical
      vitalColor = theme.palette.info.main; // Blue
    } else {
      vitalStatus = 'normal';
      vitalColor = theme.palette.success.main; // Green
    }
  }

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 1.5,
        background: isLight
          ? `linear-gradient(135deg, ${alpha(vitalColor, 0.06)} 0%, ${alpha(vitalColor, 0.02)} 100%)`
          : `linear-gradient(135deg, ${alpha(vitalColor, 0.12)} 0%, ${alpha(vitalColor, 0.06)} 100%)`,
        border: `1.5px solid ${alpha(vitalColor, isLight ? 0.2 : 0.25)}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${vitalColor} 0%, ${alpha(vitalColor, 0.6)} 100%)`,
        },
        '&:hover': {
          border: `1.5px solid ${alpha(vitalColor, isLight ? 0.35 : 0.4)}`,
          boxShadow: `0 4px 16px ${alpha(vitalColor, isLight ? 0.15 : 0.25)}`,
          transform: 'translateY(-2px)',
          background: isLight
            ? `linear-gradient(135deg, ${alpha(vitalColor, 0.1)} 0%, ${alpha(vitalColor, 0.04)} 100%)`
            : `linear-gradient(135deg, ${alpha(vitalColor, 0.18)} 0%, ${alpha(vitalColor, 0.1)} 100%)`,
        },
      }}
    >
      {/* Header with label and status */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography
          variant="caption"
          sx={{ 
            color: theme.palette.text.secondary, 
            fontSize: '0.65rem', 
            fontWeight: 700, 
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Typography>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          {trend && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: alpha(trendColor, isLight ? 0.15 : 0.2),
                border: `1px solid ${alpha(trendColor, 0.3)}`,
              }}
            >
              <TrendIcon
                sx={{
                  fontSize: 12,
                  color: trendColor,
                }}
              />
            </Box>
          )}
        </Stack>
      </Stack>

      {/* Value display */}
      <Stack direction="row" alignItems="baseline" spacing={0.75} sx={{ mb: 0.75 }}>
        <Typography
          variant="h5"
          sx={{
            color: vitalColor,
            fontWeight: 800,
            lineHeight: 1,
            fontSize: '1.4rem',
            letterSpacing: '-0.02em',
            fontFeatureSettings: '"tnum"',
          }}
        >
          {value}
        </Typography>
        <Typography
          variant="caption"
          sx={{ 
            color: theme.palette.text.secondary, 
            fontSize: '0.7rem',
            fontWeight: 600,
            opacity: 0.8,
          }}
        >
          {unit}
        </Typography>
      </Stack>

      {/* Normal range indicator and BP countdown timer */}
      <Box
        sx={{
          pt: 0.75,
          borderTop: `1px solid ${alpha(theme.palette.text.secondary, isLight ? 0.15 : 0.2)}`,
        }}
      >
        {normalRange && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mb: 0,
            }}
          >
            <Box
              sx={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: alpha(vitalStatus === 'normal' ? theme.palette.success.main : vitalColor, 0.6),
              }}
            />
            <Typography
              variant="caption"
              sx={{ 
                color: theme.palette.text.secondary, 
                fontSize: '0.6rem', 
                fontWeight: 500,
                opacity: 0.75,
              }}
            >
              {vitalStatus !== 'normal' 
                ? `${vitalStatus === 'high' || vitalStatus === 'very-high' ? 'High' : 'Low'}${isBloodPressure ? ' BP' : vitalType === 'heartRate' ? ' HR' : vitalType === 'spo2' ? ' SpO₂' : vitalType === 'gcs' ? ' GCS' : ''}`
                : `Normal: ${normalRange}`}
            </Typography>
          </Box>
        )}
        
      </Box>
    </Box>
  );
}

