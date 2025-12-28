"use client";

import { Dialog, IconButton, Box, Typography, alpha, Divider, useTheme, Stack } from '@mui/material';
import { X, Activity, Zap, Brain, Code, Heart, TrendingUp, Clock, Database, Monitor } from 'lucide-react';
import { useThemeMode } from '@/theme/ThemeContext';
import { MedicalDisclaimer } from '@/components/MedicalDisclaimer';

interface SelectedCaseInfoModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SelectedCaseInfoModal({ open, onClose }: SelectedCaseInfoModalProps) {
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
      {/* Close Button */}
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

      {/* Header */}
      <Box
        sx={{
          p: 4,
          pb: 3.5,
          borderBottom: `1px solid ${alpha(theme.palette.divider, isLight ? 0.08 : 0.12)}`,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, isLight ? 0.03 : 0.06)} 0%, transparent 100%)`,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2.5}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2.5,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, isLight ? 0.12 : 0.2)} 0%, ${alpha(theme.palette.primary.main, isLight ? 0.08 : 0.15)} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, isLight ? 0.15 : 0.2)}`,
            }}
          >
            <Activity size={26} color={theme.palette.primary.main} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="h4" 
              sx={{ 
                color: theme.palette.text.primary, 
                fontWeight: 700,
                fontSize: '1.875rem',
                letterSpacing: '-0.025em',
                mb: 0.5,
                lineHeight: 1.2,
              }}
            >
              Selected Case Panel
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: theme.palette.text.secondary, 
                fontSize: '1rem',
                fontWeight: 400,
                lineHeight: 1.5,
              }}
            >
              Detailed view of the selected stroke case with real-time vitals, risk assessment, and AI predictions
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Side-by-Side Content - Two Column Layout */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          height: 'calc(92vh - 200px)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Left Column - Panel Explanation */}
        <Box
          sx={{
            width: { xs: '100%', md: '50%' },
            minWidth: { md: '50%' },
            maxWidth: { md: '50%' },
            overflowY: 'auto',
            overflowX: 'hidden',
            borderRight: { 
              md: `3px solid ${alpha(theme.palette.info.main, isLight ? 0.2 : 0.3)}` 
            },
            borderBottom: { 
              xs: `3px solid ${alpha(theme.palette.info.main, isLight ? 0.2 : 0.3)}`, 
              md: 'none' 
            },
            background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, isLight ? 0.04 : 0.08)} 0%, ${alpha(theme.palette.info.main, isLight ? 0.01 : 0.02)} 100%)`,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              width: '1px',
              height: '100%',
              background: `linear-gradient(180deg, transparent 0%, ${alpha(theme.palette.info.main, isLight ? 0.15 : 0.25)} 50%, transparent 100%)`,
              display: { xs: 'none', md: 'block' },
            },
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: alpha(theme.palette.text.secondary, isLight ? 0.2 : 0.3),
              borderRadius: '4px',
              '&:hover': {
                background: alpha(theme.palette.text.secondary, isLight ? 0.35 : 0.45),
              },
            },
          }}
        >
          <Box sx={{ p: 4.5, height: '100%' }}>
            {/* Section Header */}
            <Box
              sx={{
                mb: 4,
                pb: 3,
                borderBottom: `2px solid ${alpha(theme.palette.info.main, isLight ? 0.15 : 0.25)}`,
              }}
            >
              <Stack direction="row" alignItems="flex-start" spacing={2.5}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, isLight ? 0.18 : 0.28)} 0%, ${alpha(theme.palette.info.main, isLight ? 0.12 : 0.22)} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, isLight ? 0.2 : 0.3)}`,
                  }}
                >
                  <Brain size={26} color={theme.palette.info.main} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      color: theme.palette.info.main, 
                      fontWeight: 700,
                      fontSize: '1.625rem',
                      letterSpacing: '-0.02em',
                      mb: 0.75,
                      lineHeight: 1.2,
                    }}
                  >
                    Understanding the Panel
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      fontSize: '1rem',
                      lineHeight: 1.5,
                      fontWeight: 400,
                    }}
                  >
                    Plain language explanation of what you're seeing
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Stack spacing={3.5}>
              {/* What This Panel Shows */}
              <Box>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    color: theme.palette.text.primary, 
                    fontWeight: 600,
                    fontSize: '1.0625rem',
                    mb: 2,
                    letterSpacing: '-0.01em',
                  }}
                >
                  What This Panel Shows
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: theme.palette.text.secondary, 
                    lineHeight: 1.7,
                    fontSize: '0.9375rem',
                    mb: 2,
                  }}
                >
                  This panel provides a comprehensive view of a single stroke case, displaying:
                </Typography>
                <Stack spacing={2}>
                  {[
                    { icon: Heart, label: 'Risk Assessment', desc: 'AI-calculated probabilities for stroke and large vessel occlusion' },
                    { icon: Monitor, label: 'Live Vitals', desc: 'Real-time monitoring of heart rate, blood pressure, oxygen saturation, and neurological status' },
                    { icon: Clock, label: 'Time Windows', desc: 'Critical treatment windows for IV tPA and endovascular therapy' },
                    { icon: TrendingUp, label: 'Vital Trends', desc: 'Historical patterns showing how patient condition is changing over time' },
                  ].map((item, idx) => (
                    <Stack key={idx} direction="row" spacing={2} alignItems="flex-start">
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: 2,
                          background: alpha(theme.palette.primary.main, isLight ? 0.08 : 0.12),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          mt: 0.25,
                        }}
                      >
                        <item.icon size={18} color={theme.palette.primary.main} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            color: theme.palette.text.primary, 
                            fontWeight: 600,
                            fontSize: '0.9375rem',
                            mb: 0.5,
                          }}
                        >
                          {item.label}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: theme.palette.text.secondary,
                            lineHeight: 1.6,
                            fontSize: '0.875rem',
                          }}
                        >
                          {item.desc}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Understanding Probability Gauges */}
              <Box>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    color: theme.palette.text.primary, 
                    fontWeight: 600,
                    fontSize: '1.0625rem',
                    mb: 2,
                    letterSpacing: '-0.01em',
                  }}
                >
                  Understanding Probability Gauges
                </Typography>
                <Stack spacing={2.5}>
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      background: alpha(theme.palette.error.main, isLight ? 0.06 : 0.1),
                      border: `1.5px solid ${alpha(theme.palette.error.main, isLight ? 0.2 : 0.25)}`,
                      borderLeft: `4px solid ${theme.palette.error.main}`,
                    }}
                  >
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: theme.palette.error.main,
                        fontWeight: 700,
                        fontSize: '0.9375rem',
                        mb: 1,
                      }}
                    >
                      Stroke Probability
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.secondary,
                        lineHeight: 1.6,
                        fontSize: '0.875rem',
                      }}
                    >
                      The AI model's confidence (0-100%) that this patient is experiencing an acute ischemic stroke. Higher values indicate stronger evidence based on vital signs, FAST exam findings, and clinical presentation. Values above 60% are considered high suspicion, while values above 80% are critical.
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      background: alpha(theme.palette.warning.main, isLight ? 0.06 : 0.1),
                      border: `1.5px solid ${alpha(theme.palette.warning.main, isLight ? 0.2 : 0.25)}`,
                      borderLeft: `4px solid ${theme.palette.warning.main}`,
                    }}
                  >
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: theme.palette.warning.main,
                        fontWeight: 700,
                        fontSize: '0.9375rem',
                        mb: 1,
                      }}
                    >
                      LVO Probability
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.secondary,
                        lineHeight: 1.6,
                        fontSize: '0.875rem',
                      }}
                    >
                      The likelihood (0-100%) that a large vessel occlusion is present. LVO strokes are more severe and require specialized endovascular treatment available only at comprehensive stroke centers. Values above 40% suggest bypassing primary centers may be justified, while values above 60% are critical.
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Vital Signs Explained */}
              <Box>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    color: theme.palette.text.primary, 
                    fontWeight: 600,
                    fontSize: '1.0625rem',
                    mb: 2,
                    letterSpacing: '-0.01em',
                  }}
                >
                  Vital Signs Explained
                </Typography>
                <Stack spacing={2}>
                  {[
                    { 
                      label: 'Heart Rate (HR)', 
                      normal: '60-100 bpm',
                      desc: 'Normal range is 60-100 bpm. Elevated rates may indicate stress, pain, or cardiovascular complications. Very high or very low rates can indicate serious problems.',
                    },
                    { 
                      label: 'Blood Pressure (BP)', 
                      normal: '~120/80 mmHg',
                      desc: 'Normal is approximately 120/80 mmHg. In stroke, both very high and very low BP can worsen brain injury. Monitoring frequency is typically frequent and tailored to the situation—more frequent when patients receive clot-busting medications, have unstable BP, or have hemorrhagic stroke. The exact timing is determined by the medical team based on clinical guidelines and patient-specific factors.',
                    },
                    { 
                      label: 'SpO₂ (Oxygen Saturation)', 
                      normal: '95-100%',
                      desc: 'Normal is 95-100%. Values below 94% indicate hypoxia and may require oxygen supplementation. Low oxygen can worsen brain injury in stroke patients.',
                    },
                    { 
                      label: 'GCS (Glasgow Coma Scale)', 
                      normal: '15 = fully alert',
                      desc: 'Ranges from 3 (deeply unconscious) to 15 (fully alert). Lower scores indicate more severe neurological impairment. A GCS below 13 suggests significant brain dysfunction and may affect treatment eligibility.',
                    },
                  ].map((item, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        background: alpha(theme.palette.background.paper, isLight ? 0.5 : 0.4),
                        border: `1px solid ${alpha(theme.palette.text.secondary, isLight ? 0.1 : 0.15)}`,
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="baseline" sx={{ mb: 1 }}>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            color: theme.palette.text.primary,
                            fontWeight: 600,
                            fontSize: '0.9375rem',
                          }}
                        >
                          {item.label}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: theme.palette.text.secondary,
                            fontSize: '0.8125rem',
                            fontStyle: 'italic',
                          }}
                        >
                          Normal: {item.normal}
                        </Typography>
                      </Stack>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: theme.palette.text.secondary,
                          lineHeight: 1.6,
                          fontSize: '0.875rem',
                        }}
                      >
                        {item.desc}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Treatment Time Windows */}
              <Box>
                <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      background: alpha(theme.palette.warning.main, isLight ? 0.12 : 0.2),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Clock size={18} color={theme.palette.warning.main} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        color: theme.palette.text.primary, 
                        fontWeight: 600,
                        fontSize: '1.0625rem',
                        mb: 1,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      Treatment Time Windows
                    </Typography>
                    <Stack spacing={2}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          background: alpha(theme.palette.primary.main, isLight ? 0.06 : 0.1),
                          border: `1.5px solid ${alpha(theme.palette.primary.main, isLight ? 0.2 : 0.25)}`,
                          borderLeft: `4px solid ${theme.palette.primary.main}`,
                        }}
                      >
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            color: theme.palette.primary.main,
                            fontWeight: 700,
                            fontSize: '0.9375rem',
                            mb: 1,
                          }}
                        >
                          IV tPA Window (4.5 hours)
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: theme.palette.text.secondary,
                            lineHeight: 1.6,
                            fontSize: '0.875rem',
                          }}
                        >
                          Intravenous tissue plasminogen activator is a clot-busting medication most effective when given within 4.5 hours of symptom onset. After this window, the risk of bleeding complications often outweighs potential benefits.
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          background: alpha(theme.palette.info.main, isLight ? 0.06 : 0.1),
                          border: `1.5px solid ${alpha(theme.palette.info.main, isLight ? 0.2 : 0.25)}`,
                          borderLeft: `4px solid ${theme.palette.info.main}`,
                        }}
                      >
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            color: theme.palette.info.main,
                            fontWeight: 700,
                            fontSize: '0.9375rem',
                            mb: 1,
                          }}
                        >
                          EVT Window (6-24 hours)
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: theme.palette.text.secondary,
                            lineHeight: 1.6,
                            fontSize: '0.875rem',
                          }}
                        >
                          Endovascular therapy (mechanical thrombectomy) can be performed in select patients up to 6-24 hours after symptom onset, depending on imaging findings and patient characteristics. This extended window is why comprehensive stroke centers are critical for LVO cases.
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Stack>
              </Box>

              <Box sx={{ mt: 2 }}>
                <MedicalDisclaimer />
              </Box>
            </Stack>
          </Box>
        </Box>

        {/* Right Column - Technical Details for Judges */}
        <Box
          sx={{
            width: { xs: '100%', md: '50%' },
            minWidth: { md: '50%' },
            maxWidth: { md: '50%' },
            overflowY: 'auto',
            overflowX: 'hidden',
            background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, isLight ? 0.04 : 0.08)} 0%, ${alpha(theme.palette.warning.main, isLight ? 0.01 : 0.02)} 100%)`,
            position: 'relative',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: alpha(theme.palette.text.secondary, isLight ? 0.2 : 0.3),
              borderRadius: '4px',
              '&:hover': {
                background: alpha(theme.palette.text.secondary, isLight ? 0.35 : 0.45),
              },
            },
          }}
        >
          <Box sx={{ p: 4.5, height: '100%' }}>
            {/* Section Header */}
            <Box
              sx={{
                mb: 4,
                pb: 3,
                borderBottom: `2px solid ${alpha(theme.palette.warning.main, isLight ? 0.15 : 0.25)}`,
              }}
            >
              <Stack direction="row" alignItems="flex-start" spacing={2.5}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, isLight ? 0.18 : 0.28)} 0%, ${alpha(theme.palette.warning.main, isLight ? 0.12 : 0.22)} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, isLight ? 0.2 : 0.3)}`,
                  }}
                >
                  <Code size={26} color={theme.palette.warning.main} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      color: theme.palette.warning.main, 
                      fontWeight: 700,
                      fontSize: '1.625rem',
                      letterSpacing: '-0.02em',
                      mb: 0.75,
                      lineHeight: 1.2,
                    }}
                  >
                    Technical Architecture
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      fontSize: '1rem',
                      lineHeight: 1.5,
                      fontWeight: 400,
                    }}
                  >
                    For judges: Streaming data architecture and real-time processing
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Stack spacing={3.5}>
              {/* Real-Time Data Flow */}
              <Box>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      background: alpha(theme.palette.primary.main, isLight ? 0.1 : 0.15),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Zap size={18} color={theme.palette.primary.main} />
                  </Box>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      color: theme.palette.text.primary, 
                      fontWeight: 600,
                      fontSize: '1.0625rem',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Real-Time Data Flow
                  </Typography>
                </Stack>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: theme.palette.text.secondary, 
                    lineHeight: 1.7,
                    fontSize: '0.9375rem',
                    mb: 2,
                  }}
                >
                  This panel demonstrates real-time streaming from <strong style={{ color: theme.palette.text.primary }}>Confluent Cloud</strong> (Apache Kafka). When a case is selected, data flows through the pipeline:
                </Typography>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    background: alpha(theme.palette.primary.main, isLight ? 0.06 : 0.1),
                    border: `1.5px solid ${alpha(theme.palette.primary.main, isLight ? 0.2 : 0.25)}`,
                    borderLeft: `4px solid ${theme.palette.primary.main}`,
                  }}
                >
                  <Stack spacing={1.5}>
                    {[
                      'Kafka Topic (ems.vitals.raw) → Stream Processor → AI Prediction',
                      'AI Prediction → Kafka Topic (ai.prediction.output)',
                      'FastAPI Backend → Consumes from Kafka → Updates in-memory store',
                      'WebSocket → Pushes updates to dashboard (~1 second latency)',
                      'Dashboard → Displays real-time vitals, probabilities, and trends',
                    ].map((step, idx) => (
                      <Stack key={idx} direction="row" spacing={1.5} alignItems="flex-start">
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: theme.palette.primary.main,
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            minWidth: 20,
                            mt: 0.25,
                          }}
                        >
                          {idx + 1}.
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: theme.palette.text.secondary,
                            fontSize: '0.875rem',
                            fontFamily: 'monospace',
                            lineHeight: 1.6,
                          }}
                        >
                          {step}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Live Vitals Streaming */}
              <Box>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      background: alpha(theme.palette.success.main, isLight ? 0.1 : 0.15),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Monitor size={18} color={theme.palette.success.main} />
                  </Box>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      color: theme.palette.text.primary, 
                      fontWeight: 600,
                      fontSize: '1.0625rem',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Live Vitals Streaming from Kafka
                  </Typography>
                </Stack>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: theme.palette.text.secondary, 
                    lineHeight: 1.7,
                    fontSize: '0.9375rem',
                    mb: 1.5,
                  }}
                >
                  Vitals are continuously streamed from the{' '}
                  <Box
                    component="code"
                    sx={{
                      color: theme.palette.info.main,
                      background: alpha(theme.palette.info.main, isLight ? 0.1 : 0.15),
                      padding: '2px 6px',
                      borderRadius: 1,
                      fontSize: '0.875rem',
                      fontFamily: 'monospace',
                      fontWeight: 500,
                    }}
                  >
                    ems.vitals.raw
                  </Box>{' '}
                  Kafka topic. Each vital sign update is a separate Kafka message, demonstrating high-frequency event streaming.
                </Typography>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    background: alpha(theme.palette.background.paper, isLight ? 0.5 : 0.4),
                    border: `1px solid ${alpha(theme.palette.text.secondary, isLight ? 0.1 : 0.15)}`,
                    mt: 1.5,
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      mb: 1.5,
                    }}
                  >
                    <strong style={{ color: theme.palette.text.primary }}>Vital Signs Streamed:</strong>
                  </Typography>
                  <Stack spacing={1}>
                    {[
                      { name: 'Heart Rate', topic: 'ems.vitals.raw', update: '~1 second' },
                      { name: 'Blood Pressure', topic: 'ems.vitals.raw', update: '~10-15 minutes' },
                      { name: 'SpO₂', topic: 'ems.vitals.raw', update: '~1 second' },
                      { name: 'GCS', topic: 'ems.vitals.raw', update: '~1 second' },
                    ].map((item, idx) => (
                      <Stack key={idx} direction="row" spacing={2} alignItems="baseline">
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: theme.palette.text.primary,
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            minWidth: 120,
                          }}
                        >
                          {item.name}:
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: theme.palette.text.secondary,
                            fontSize: '0.875rem',
                            fontFamily: 'monospace',
                          }}
                        >
                          {item.topic}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: theme.palette.text.secondary,
                            fontSize: '0.8125rem',
                            ml: 'auto',
                            opacity: 0.7,
                          }}
                        >
                          ({item.update})
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: theme.palette.text.secondary, 
                    lineHeight: 1.7,
                    fontSize: '0.9375rem',
                    mt: 1.5,
                  }}
                >
                  The system maintains a rolling history of the last 20 vital readings to power the trend chart. Updates occur via WebSocket connections, ensuring sub-second latency from Kafka to dashboard.
                </Typography>
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Probability Gauges - AI Integration */}
              <Box>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      background: alpha(theme.palette.error.main, isLight ? 0.1 : 0.15),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Heart size={18} color={theme.palette.error.main} />
                  </Box>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      color: theme.palette.text.primary, 
                      fontWeight: 600,
                      fontSize: '1.0625rem',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    AI Predictions via Vertex AI
                  </Typography>
                </Stack>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: theme.palette.text.secondary, 
                    lineHeight: 1.7,
                    fontSize: '0.9375rem',
                    mb: 1.5,
                  }}
                >
                  The circular probability gauges display values calculated by <strong style={{ color: theme.palette.text.primary }}>Google Cloud Vertex AI</strong> models. These predictions are generated by the stream processor when it receives sufficient data from multiple Kafka topics.
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: theme.palette.text.secondary, 
                    lineHeight: 1.7,
                    fontSize: '0.9375rem',
                    mb: 2,
                  }}
                >
                  The stream processor:
                </Typography>
                <Box component="ul" sx={{ pl: 2.5, mb: 2, color: theme.palette.text.secondary }}>
                  <li style={{ marginBottom: '0.75rem' }}>
                    Consumes vitals from <Box component="code" sx={{ fontFamily: 'monospace', fontSize: '0.875rem', color: theme.palette.info.main }}>ems.vitals.raw</Box>
                  </li>
                  <li style={{ marginBottom: '0.75rem' }}>
                    Joins with FAST exam from <Box component="code" sx={{ fontFamily: 'monospace', fontSize: '0.875rem', color: theme.palette.info.main }}>ems.fast.exam</Box>
                  </li>
                  <li style={{ marginBottom: '0.75rem' }}>
                    Calls Vertex AI for stroke/LVO probabilities
                  </li>
                  <li>
                    Publishes predictions to <Box component="code" sx={{ fontFamily: 'monospace', fontSize: '0.875rem', color: theme.palette.primary.main }}>ai.prediction.output</Box>
                  </li>
                </Box>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: theme.palette.text.secondary, 
                    lineHeight: 1.7,
                    fontSize: '0.9375rem',
                  }}
                >
                  The gauges update in real-time as new predictions arrive via WebSocket, demonstrating the complete streaming pipeline from Kafka → AI → Dashboard.
                </Typography>
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Time Window Calculations */}
              <Box>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      background: alpha(theme.palette.warning.main, isLight ? 0.1 : 0.15),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Clock size={18} color={theme.palette.warning.main} />
                  </Box>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      color: theme.palette.text.primary, 
                      fontWeight: 600,
                      fontSize: '1.0625rem',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Real-Time Time Window Calculations
                  </Typography>
                </Stack>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: theme.palette.text.secondary, 
                    lineHeight: 1.7,
                    fontSize: '0.9375rem',
                    mb: 1.5,
                  }}
                >
                  The time window component calculates elapsed time and remaining windows in real-time. The <strong style={{ color: theme.palette.text.primary }}>symptom_onset_ts</strong> timestamp comes from the FAST exam event in Kafka, demonstrating how temporal data flows through the streaming pipeline.
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: theme.palette.text.secondary, 
                    lineHeight: 1.7,
                    fontSize: '0.9375rem',
                  }}
                >
                  Progress bars and countdown timers update every second via WebSocket, providing visual urgency indicators. The calculations happen client-side for low latency, but the source data (symptom onset time) originates from the Kafka stream.
                </Typography>
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* WebSocket Real-Time Updates */}
              <Box>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      background: alpha(theme.palette.primary.main, isLight ? 0.1 : 0.15),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Zap size={18} color={theme.palette.primary.main} />
                  </Box>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      color: theme.palette.text.primary, 
                      fontWeight: 600,
                      fontSize: '1.0625rem',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    WebSocket Real-Time Synchronization
                  </Typography>
                </Stack>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: theme.palette.text.secondary, 
                    lineHeight: 1.7,
                    fontSize: '0.9375rem',
                    mb: 1.5,
                  }}
                >
                  All data in this panel updates automatically via <strong style={{ color: theme.palette.text.primary }}>WebSocket connections</strong>. The FastAPI backend maintains WebSocket connections to all connected dashboard clients and pushes updates whenever:
                </Typography>
                <Box component="ul" sx={{ pl: 2.5, mb: 1.5, color: theme.palette.text.secondary }}>
                  <li style={{ marginBottom: '0.75rem' }}>
                    New predictions arrive from the <Box component="code" sx={{ fontFamily: 'monospace', fontSize: '0.875rem', color: theme.palette.primary.main }}>ai.prediction.output</Box> Kafka topic
                  </li>
                  <li style={{ marginBottom: '0.75rem' }}>
                    Vitals are updated from the <Box component="code" sx={{ fontFamily: 'monospace', fontSize: '0.875rem', color: theme.palette.info.main }}>ems.vitals.raw</Box> stream
                  </li>
                  <li>
                    Case details change (risk category, probabilities, etc.)
                  </li>
                </Box>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: theme.palette.text.secondary, 
                    lineHeight: 1.7,
                    fontSize: '0.9375rem',
                  }}
                >
                  This demonstrates a complete real-time architecture: <strong style={{ color: theme.palette.text.primary }}>Kafka → Stream Processor → AI → Kafka → FastAPI → WebSocket → Dashboard</strong>, with end-to-end latency of approximately 1-2 seconds.
                </Typography>
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Hackathon Streaming Highlights */}
              <Box>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      background: alpha(theme.palette.warning.main, isLight ? 0.1 : 0.15),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Database size={18} color={theme.palette.warning.main} />
                  </Box>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      color: theme.palette.text.primary, 
                      fontWeight: 600,
                      fontSize: '1.0625rem',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Hackathon Streaming Features
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    background: alpha(theme.palette.warning.main, isLight ? 0.06 : 0.1),
                    border: `1.5px solid ${alpha(theme.palette.warning.main, isLight ? 0.2 : 0.25)}`,
                  }}
                >
                  <Stack spacing={1.5}>
                    {[
                      '✅ Real-time vital signs streaming (~1 second updates)',
                      '✅ Multi-topic Kafka consumption (vitals, exams, predictions)',
                      '✅ Stateful stream processing with event joining',
                      '✅ AI predictions published back to Kafka',
                      '✅ WebSocket for sub-second dashboard updates',
                      '✅ End-to-end latency: ~1-2 seconds (Kafka → Dashboard)',
                      '✅ Confluent Cloud managed Kafka infrastructure',
                    ].map((item, idx) => (
                      <Stack key={idx} direction="row" spacing={1.5} alignItems="flex-start">
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: theme.palette.warning.main,
                            fontSize: '0.875rem',
                            mt: 0.25,
                          }}
                        >
                          {item.split('✅ ')[0]}✅
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: theme.palette.text.secondary,
                            fontSize: '0.875rem',
                            lineHeight: 1.6,
                          }}
                        >
                          {item.split('✅ ')[1]}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}
