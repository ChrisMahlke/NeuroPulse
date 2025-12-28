"use client";

import { Box, Typography, Stack, Chip, LinearProgress, useTheme, alpha, IconButton } from '@mui/material';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, BarChart3, Shield } from 'lucide-react';
import InfoIcon from '@mui/icons-material/Info';
import { useThemeMode } from '@/theme/ThemeContext';
import { PredictionDetail } from '@/services/api';

interface AIEnhancementsPanelProps {
  caseDetail: PredictionDetail | null;
  onConfidenceInfoClick?: () => void;
}

export function AIEnhancementsPanel({ caseDetail, onConfidenceInfoClick }: AIEnhancementsPanelProps) {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isLight = mode === 'light';

  if (!caseDetail) return null;

  const confidence = caseDetail.predictionConfidence;
  const trends = caseDetail.trendIndicators;
  const anomalies = caseDetail.detectedAnomalies;
  const featureImportance = caseDetail.featureImportance;

  return (
    <Stack spacing={1.5}>
      {/* Prediction Confidence */}
      {confidence !== null && confidence !== undefined && (
        <Box
          sx={{
            p: 1.5,
            borderRadius: 1,
            background: isLight 
              ? alpha(theme.palette.background.paper, 0.8)
              : alpha(theme.palette.background.paper, 0.6),
            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontWeight: 600,
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                flex: 1,
              }}
            >
              Prediction Confidence
            </Typography>
            {onConfidenceInfoClick && (
              <IconButton
                size="small"
                onClick={onConfidenceInfoClick}
                sx={{
                  width: 20,
                  height: 20,
                  p: 0.25,
                  color: "text.secondary",
                  opacity: 0.7,
                  "&:hover": {
                    opacity: 1,
                    color: "primary.main",
                  },
                }}
              >
                <InfoIcon sx={{ fontSize: 14 }} />
              </IconButton>
            )}
            <Chip
              label={`${Math.round(confidence * 100)}%`}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                fontWeight: 600,
                bgcolor: alpha(theme.palette.text.secondary, isLight ? 0.08 : 0.12),
                color: 'text.secondary',
              }}
            />
          </Stack>
          <LinearProgress
            variant="determinate"
            value={confidence * 100}
            sx={{
              height: 4,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.divider, 0.3),
              '& .MuiLinearProgress-bar': {
                bgcolor: theme.palette.text.secondary,
              },
            }}
          />
        </Box>
      )}

      {/* Trend Indicators */}
      {trends && (
        <Box
          sx={{
            p: 1.5,
            borderRadius: 1,
            background: isLight 
              ? alpha(theme.palette.background.paper, 0.8)
              : alpha(theme.palette.background.paper, 0.6),
            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              mb: 1.5,
              display: 'block',
            }}
          >
            Vital Sign Trends
          </Typography>
          <Stack spacing={1}>
            {trends.gcs_trend !== null && trends.gcs_trend !== undefined && (
              <TrendIndicator
                label="GCS"
                trend={trends.gcs_trend}
                rateOfChange={trends.gcs_rate_of_change}
                theme={theme}
                isLight={isLight}
              />
            )}
            {trends.spo2_trend !== null && trends.spo2_trend !== undefined && (
              <TrendIndicator
                label="SpO₂"
                trend={trends.spo2_trend}
                rateOfChange={trends.spo2_rate_of_change}
                theme={theme}
                isLight={isLight}
              />
            )}
            {trends.hr_trend !== null && trends.hr_trend !== undefined && (
              <TrendIndicator
                label="Heart Rate"
                trend={trends.hr_trend}
                rateOfChange={trends.hr_rate_of_change}
                theme={theme}
                isLight={isLight}
              />
            )}
            {trends.bp_trend !== null && trends.bp_trend !== undefined && (
              <TrendIndicator
                label="Blood Pressure"
                trend={trends.bp_trend}
                rateOfChange={trends.bp_rate_of_change}
                theme={theme}
                isLight={isLight}
              />
            )}
          </Stack>
        </Box>
      )}

      {/* Detected Anomalies */}
      {anomalies && anomalies.length > 0 && (
        <Box
          sx={{
            p: 1.5,
            borderRadius: 1,
            background: isLight 
              ? alpha(theme.palette.background.paper, 0.8)
              : alpha(theme.palette.background.paper, 0.6),
            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              mb: 1,
              display: 'block',
            }}
          >
            Detected Anomalies
          </Typography>
          <Stack spacing={0.75}>
            {anomalies.map((anomaly, idx) => (
              <Typography
                key={idx}
                variant="caption"
                sx={{
                  color: 'text.primary',
                  fontSize: '0.75rem',
                  lineHeight: 1.5,
                  pl: 1.5,
                }}
              >
                • {anomaly}
              </Typography>
            ))}
          </Stack>
        </Box>
      )}

      {/* Feature Importance */}
      {featureImportance && Object.keys(featureImportance).length > 0 && (
        <Box
          sx={{
            p: 1.5,
            borderRadius: 1,
            background: isLight 
              ? alpha(theme.palette.background.paper, 0.8)
              : alpha(theme.palette.background.paper, 0.6),
            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              mb: 1.5,
              display: 'block',
            }}
          >
            Feature Importance
          </Typography>
          <Stack spacing={1}>
            {Object.entries(featureImportance)
              .sort(([, a], [, b]) => (b || 0) - (a || 0))
              .slice(0, 5)
              .map(([feature, importance]) => (
                <Box key={feature}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.primary',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        textTransform: 'capitalize',
                      }}
                    >
                      {feature.replace(/_/g, ' ')}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                      }}
                    >
                      {Math.round((importance || 0) * 100)}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={(importance || 0) * 100}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.divider, 0.3),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: theme.palette.text.secondary,
                      },
                    }}
                  />
                </Box>
              ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}

function TrendIndicator({
  label,
  trend,
  rateOfChange,
  theme,
  isLight,
}: {
  label: string;
  trend: number;
  rateOfChange: number | null | undefined;
  theme: any;
  isLight: boolean;
}) {
  const getTrendIcon = () => {
    if (trend > 0) return <TrendingUp size={14} color={theme.palette.text.secondary} />;
    if (trend < 0) return <TrendingDown size={14} color={theme.palette.text.secondary} />;
    return <Minus size={14} color={theme.palette.text.secondary} />;
  };

  const getTrendLabel = () => {
    if (trend > 0) return 'Improving';
    if (trend < 0) return 'Worsening';
    return 'Stable';
  };

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      {getTrendIcon()}
      <Typography
        variant="caption"
        sx={{
          color: 'text.primary',
          fontSize: '0.75rem',
          fontWeight: 500,
          minWidth: 100,
        }}
      >
        {label}:
      </Typography>
      <Chip
        label={getTrendLabel()}
        size="small"
        sx={{
          height: 18,
          fontSize: '0.65rem',
          fontWeight: 600,
          bgcolor: alpha(theme.palette.text.secondary, isLight ? 0.08 : 0.12),
          color: 'text.secondary',
        }}
      />
      {rateOfChange !== null && rateOfChange !== undefined && (
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontSize: '0.7rem',
            ml: 'auto',
          }}
        >
          {rateOfChange > 0 ? '+' : ''}
          {rateOfChange.toFixed(2)}/min
        </Typography>
      )}
    </Stack>
  );
}

