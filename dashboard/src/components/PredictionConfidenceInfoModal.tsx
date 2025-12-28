"use client";

import { Dialog, IconButton, Box, Typography, alpha, useTheme, Stack, Divider } from '@mui/material';
import { X } from 'lucide-react';
import { useThemeMode } from '@/theme/ThemeContext';
import { MedicalDisclaimer } from '@/components/MedicalDisclaimer';

interface PredictionConfidenceInfoModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PredictionConfidenceInfoModal({ open, onClose }: PredictionConfidenceInfoModalProps) {
  const { mode } = useThemeMode();
  const theme = useTheme();
  const isLight = mode === 'light';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: '1400px',
          maxWidth: '95vw',
          maxHeight: '92vh',
          borderRadius: 3,
          background: theme.palette.background.paper,
          border: 'none',
          boxShadow: isLight
            ? '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)'
            : '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
          m: 2,
        },
      }}
      sx={{
        '& .MuiBackdrop-root': {
          backgroundColor: isLight ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
        },
      }}
    >
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 10,
          width: 36,
          height: 36,
          color: theme.palette.text.secondary,
          background: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.text.secondary, 0.1)}`,
          '&:hover': {
            background: alpha(theme.palette.background.paper, 0.95),
            color: theme.palette.text.primary,
            transform: 'scale(1.05)',
          },
          transition: 'all 0.2s ease',
        }}
      >
        <X size={18} strokeWidth={2.5} />
      </IconButton>

      <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        {/* Left Column: Medical Context */}
        <Box
          sx={{
            width: '50%',
            p: 4,
            overflowY: 'auto',
            background: isLight ? '#FFFFFF' : theme.palette.background.paper,
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontSize: '28px',
              fontWeight: 700,
              color: theme.palette.text.primary,
              mb: 1,
              letterSpacing: '-0.02em',
            }}
          >
            Understanding Prediction Confidence
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: '16px',
              color: theme.palette.text.secondary,
              mb: 4,
              lineHeight: 1.7,
            }}
          >
            The prediction confidence score indicates how reliable the AI's assessment is based on the quality and completeness of available data.
          </Typography>

          <Stack spacing={3}>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  mb: 1.5,
                }}
              >
                What Confidence Means
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '15px',
                  color: theme.palette.text.secondary,
                  lineHeight: 1.8,
                  mb: 2,
                }}
              >
                The confidence score (0-100%) reflects:
              </Typography>
              <Stack spacing={1.5}>
                {[
                  {
                    title: 'Data Completeness',
                    desc: 'How much clinical information is available (vitals, FAST exam, time windows)',
                  },
                  {
                    title: 'Data Quality',
                    desc: 'Whether measurements are within expected ranges and consistent',
                  },
                  {
                    title: 'Trend Stability',
                    desc: 'How stable vital signs are over time (volatile readings reduce confidence)',
                  },
                  {
                    title: 'Feature Reliability',
                    desc: 'Whether key clinical findings (FAST score, GCS) are present and valid',
                  },
                ].map((item, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      background: alpha(theme.palette.primary.main, isLight ? 0.04 : 0.08),
                      border: `1px solid ${alpha(theme.palette.primary.main, isLight ? 0.1 : 0.15)}`,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                        mb: 0.5,
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '14px',
                        color: theme.palette.text.secondary,
                        lineHeight: 1.6,
                      }}
                    >
                      {item.desc}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  mb: 1.5,
                }}
              >
                Interpreting Confidence Levels
              </Typography>
              <Stack spacing={1.5}>
                {[
                  {
                    level: 'High (70-100%)',
                    desc: 'Strong confidence - comprehensive data available, stable trends, clear clinical findings',
                    color: theme.palette.success.main,
                  },
                  {
                    level: 'Moderate (50-69%)',
                    desc: 'Reasonable confidence - adequate data but some gaps or minor inconsistencies',
                    color: theme.palette.warning.main,
                  },
                  {
                    level: 'Low (<50%)',
                    desc: 'Lower confidence - limited data, unstable trends, or missing key information',
                    color: theme.palette.error.main,
                  },
                ].map((item, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      background: alpha(item.color, isLight ? 0.06 : 0.1),
                      border: `1px solid ${alpha(item.color, isLight ? 0.15 : 0.2)}`,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: item.color,
                        mb: 0.5,
                      }}
                    >
                      {item.level}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '14px',
                        color: theme.palette.text.secondary,
                        lineHeight: 1.6,
                      }}
                    >
                      {item.desc}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>

            <MedicalDisclaimer />
          </Stack>
        </Box>

        {/* Right Column: Technical Details */}
        <Box
          sx={{
            width: '50%',
            p: 4,
            overflowY: 'auto',
            background: isLight ? '#F8FAFC' : alpha(theme.palette.background.paper, 0.5),
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontSize: '28px',
              fontWeight: 700,
              color: theme.palette.text.primary,
              mb: 1,
              letterSpacing: '-0.02em',
            }}
          >
            Technical Implementation
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: '16px',
              color: theme.palette.text.secondary,
              mb: 4,
              lineHeight: 1.7,
            }}
          >
            How confidence scoring works in the NeuroPulse AI pipeline.
          </Typography>

          <Stack spacing={3}>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  mb: 1.5,
                }}
              >
                Confidence Calculation Algorithm
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '15px',
                  color: theme.palette.text.secondary,
                  lineHeight: 1.8,
                  mb: 2,
                }}
              >
                The confidence score is calculated using a weighted formula:
              </Typography>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  background: alpha(theme.palette.info.main, isLight ? 0.06 : 0.1),
                  border: `1px solid ${alpha(theme.palette.info.main, isLight ? 0.15 : 0.2)}`,
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  color: theme.palette.text.primary,
                  lineHeight: 1.8,
                }}
              >
                confidence = base_score (0.5)<br />
                + data_completeness × 0.3<br />
                + trend_stability × 0.2<br />
                + feature_quality × 0.3<br />
                - anomaly_penalties × 0.2
              </Box>
            </Box>

            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  mb: 1.5,
                }}
              >
                Real-Time Confidence Updates
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '15px',
                  color: theme.palette.text.secondary,
                  lineHeight: 1.8,
                  mb: 2,
                }}
              >
                Confidence scores are recalculated in real-time as new data arrives:
              </Typography>
              <Stack spacing={1.5}>
                {[
                  {
                    step: '1. Stream Processing',
                    desc: 'As vitals arrive via Kafka, the stream processor tracks data completeness and quality',
                  },
                  {
                    step: '2. Trend Analysis',
                    desc: 'Temporal features (volatility, rate of change) are calculated from vital sign history',
                  },
                  {
                    step: '3. Confidence Scoring',
                    desc: 'Weighted algorithm combines completeness, stability, and quality metrics',
                  },
                  {
                    step: '4. Real-Time Updates',
                    desc: 'Confidence score updates automatically as predictions are regenerated with new data',
                  },
                ].map((item, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      background: alpha(theme.palette.primary.main, isLight ? 0.04 : 0.08),
                      border: `1px solid ${alpha(theme.palette.primary.main, isLight ? 0.1 : 0.15)}`,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: theme.palette.primary.main,
                        mb: 0.5,
                      }}
                    >
                      {item.step}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '14px',
                        color: theme.palette.text.secondary,
                        lineHeight: 1.6,
                      }}
                    >
                      {item.desc}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  mb: 1.5,
                }}
              >
                Confluent & Streaming Architecture
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '15px',
                  color: theme.palette.text.secondary,
                  lineHeight: 1.8,
                  mb: 2,
                }}
              >
                Confidence scoring demonstrates "AI on data in motion":
              </Typography>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  background: alpha(theme.palette.warning.main, isLight ? 0.06 : 0.1),
                  border: `1px solid ${alpha(theme.palette.warning.main, isLight ? 0.15 : 0.2)}`,
                }}
              >
                <Stack spacing={1.5}>
                  {[
                    'Confidence is calculated in the stream processor as data flows through Kafka',
                    'Each new prediction includes an updated confidence score based on latest data',
                    'The dashboard receives confidence updates via WebSocket in real-time',
                    'This enables clinicians to assess prediction reliability as conditions change',
                  ].map((item, idx) => (
                    <Typography
                      key={idx}
                      variant="body2"
                      sx={{
                        fontSize: '14px',
                        color: theme.palette.text.secondary,
                        lineHeight: 1.7,
                        pl: 1.5,
                        position: 'relative',
                        '&::before': {
                          content: '"•"',
                          position: 'absolute',
                          left: 0,
                          color: theme.palette.warning.main,
                          fontWeight: 700,
                        },
                      }}
                    >
                      {item}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            </Box>
          </Stack>
        </Box>
      </Box>
    </Dialog>
  );
}

