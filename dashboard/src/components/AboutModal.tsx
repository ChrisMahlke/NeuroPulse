"use client";

import { Dialog, IconButton, Box, Typography, Button, alpha, useTheme, Stack, Chip, LinearProgress } from '@mui/material';
import { X, Database, Brain, Sparkles, Cpu, Code, Activity, CheckCircle2, Zap, Cloud, TrendingUp, Clock } from 'lucide-react';
import { useThemeMode } from '@/theme/ThemeContext';
import React, { useEffect, useState } from 'react';

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

interface StreamingMetrics {
  kafka_connected: boolean;
  messages_received: number;
  messages_per_second: number;
  last_message_time: string | null;
  topics: {
    "ai.prediction.output": {
      messages_received: number;
      last_message_time: string | null;
    };
  };
  uptime_seconds: number;
  consumer_thread_alive: boolean;
}

export default function AboutModal({ open, onClose }: AboutModalProps) {
  const { mode } = useThemeMode();
  const theme = useTheme();
  const isLight = mode === 'light';
  const [streamingMetrics, setStreamingMetrics] = useState<StreamingMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    
    const fetchMetrics = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/streaming/metrics");
        if (response.ok) {
          const data = await response.json();
          setStreamingMetrics(data);
        }
      } catch (error) {
        console.error("Failed to fetch streaming metrics:", error);
      } finally {
        setMetricsLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 2000);
    return () => clearInterval(interval);
  }, [open]);

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    if (mins > 0) return `${mins}m`;
    return `${seconds}s`;
  };

  const isStreamingActive = streamingMetrics?.kafka_connected && streamingMetrics?.consumer_thread_alive && (streamingMetrics?.messages_received ?? 0) > 0;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: '900px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          borderRadius: 1,
          background: theme.palette.background.paper,
          border: `1px solid ${alpha(theme.palette.text.secondary, isLight ? 0.2 : 0.15)}`,
          boxShadow: isLight
            ? '0 8px 24px rgba(0, 0, 0, 0.12)'
            : '0 8px 24px rgba(0, 0, 0, 0.4)',
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
          top: 16,
          right: 16,
          zIndex: 10,
          width: 40,
          height: 40,
          color: theme.palette.text.secondary,
          background: alpha(theme.palette.text.secondary, 0.1),
          '&:hover': {
            background: alpha(theme.palette.text.secondary, 0.2),
            color: theme.palette.text.primary,
            transform: 'scale(1.05)',
          },
          transition: 'all 0.2s',
        }}
      >
        <X size={20} strokeWidth={2.5} />
      </IconButton>

      {/* Scrollable Content */}
      <Box sx={{ overflowY: 'auto', maxHeight: '90vh' }}>
        {/* Hero Section */}
        <Box
          sx={{
            px: { xs: 4, sm: 6, md: 8 },
            pt: 6,
            pb: 4,
            background: alpha(theme.palette.primary.main, isLight ? 0.05 : 0.08),
            borderBottom: `1px solid ${alpha(theme.palette.text.secondary, isLight ? 0.2 : 0.15)}`,
          }}
        >
          <Box sx={{ maxWidth: '800px' }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                background: alpha(theme.palette.primary.main, isLight ? 0.1 : 0.15),
                color: theme.palette.primary.main,
                px: 2,
                py: 0.75,
                borderRadius: '999px',
                fontSize: '14px',
                fontWeight: 600,
                mb: 3,
                border: `1px solid ${alpha(theme.palette.primary.main, isLight ? 0.25 : 0.3)}`,
              }}
            >
              <Activity size={16} />
              <span>Confluent Challenge - AI Partner Catalyst Hackathon</span>
            </Box>

            <Typography
              sx={{
                fontSize: { xs: '36px', sm: '48px', md: '56px' },
                fontWeight: 700,
                color: theme.palette.text.primary,
                mb: 2,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
              }}
            >
              NeuroPulse
            </Typography>

            <Typography
              sx={{
                fontSize: { xs: '18px', sm: '22px' },
                color: theme.palette.text.secondary,
                fontWeight: 500,
                mb: 3,
                lineHeight: 1.5,
              }}
            >
              Real-time AI orchestration for acute ischemic stroke triage and routing
            </Typography>

            <Typography
              sx={{
                fontSize: { xs: '14px', sm: '16px' },
                color: theme.palette.text.secondary,
                lineHeight: 1.6,
                maxWidth: '600px',
              }}
            >
              An intelligent platform that demonstrates how real-time data streaming and AI can transform
              time-critical healthcare decisions when every second counts.
            </Typography>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ px: { xs: 4, sm: 6, md: 8 }, py: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* How It Works - Visual Flow */}
          <Box>
            <Typography
              sx={{
                fontSize: '28px',
                fontWeight: 700,
                color: theme.palette.text.primary,
                mb: 4,
                letterSpacing: '-0.02em',
              }}
            >
              How It Works
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <FlowStep
                number={1}
                title="Data Streaming"
                description="EMS data including vital signs, FAST exam results, and hospital capacity flows through Confluent Cloud Kafka topics in real-time"
                icon={<Database size={20} />}
                color="#3B82F6"
              />
              <FlowStep
                number={2}
                title="Stream Processing"
                description="Multiple data streams are joined and processed to build comprehensive feature vectors that trigger AI predictions"
                icon={<Zap size={20} />}
                color="#14B8A6"
              />
              <FlowStep
                number={3}
                title="AI Predictions"
                description="Vertex AI models assess stroke and LVO probabilities while Gemini generates clear, human-readable clinical explanations"
                icon={<Brain size={20} />}
                color="#06B6D4"
              />
              <FlowStep
                number={4}
                title="Real-Time Dashboard"
                description="Predictions stream instantly to clinicians via WebSocket, enabling immediate decision-making without any page refresh"
                icon={<Activity size={20} />}
                color="#10B981"
              />
            </Box>
          </Box>

          {/* Technology Stack */}
          <Box>
            <Typography
              sx={{
                fontSize: '28px',
                fontWeight: 700,
                color: theme.palette.text.primary,
                mb: 1,
                letterSpacing: '-0.02em',
              }}
            >
              Technology Stack
            </Typography>
            <Typography
              sx={{
                fontSize: '16px',
                color: theme.palette.text.secondary,
                mb: 4,
              }}
            >
              Built with industry-leading tools for reliability and performance
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
              }}
            >
              <TechCard
                icon={<Database size={20} />}
                title="Confluent Cloud"
                description="Apache Kafka for real-time data streaming"
              />
              <TechCard
                icon={<Brain size={20} />}
                title="Google Cloud Vertex AI"
                description="ML predictions for stroke and LVO probability"
              />
              <TechCard
                icon={<Sparkles size={20} />}
                title="Google Gemini"
                description="Natural language clinical explanations"
              />
              <TechCard
                icon={<Cpu size={20} />}
                title="FastAPI"
                description="WebSocket backend for real-time updates"
              />
              <TechCard
                icon={<Code size={20} />}
                title="Next.js"
                description="Modern React dashboard with live connections"
              />
            </Box>
          </Box>

          {/* Hackathon Connection */}
          <Box>
            <Typography
              sx={{
                fontSize: '28px',
                fontWeight: 700,
                color: theme.palette.text.primary,
                mb: 1,
                letterSpacing: '-0.02em',
              }}
            >
              Hackathon Challenge: Real-Time AI on Data in Motion
            </Typography>
            <Typography
              sx={{
                fontSize: '16px',
                color: theme.palette.text.secondary,
                mb: 4,
              }}
            >
              This project demonstrates the Confluent Challenge: applying advanced AI/ML models to real-time data streams
            </Typography>
            <Box
              sx={{
                background: alpha(theme.palette.primary.main, isLight ? 0.08 : 0.12),
                borderRadius: 2,
                p: 3,
                border: `1.5px solid ${alpha(theme.palette.primary.main, isLight ? 0.25 : 0.3)}`,
                mb: 4,
              }}
            >
              <Typography
                sx={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: theme.palette.text.primary,
                  mb: 2,
                }}
              >
                How NeuroPulse Fulfills the Challenge
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box
                    sx={{
                      flexShrink: 0,
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      background: '#FF6B35',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '14px',
                    }}
                  >
                    1
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5 }}>
                      Confluent Cloud Streaming
                    </Typography>
                    <Typography sx={{ color: theme.palette.text.secondary, fontSize: '14px', lineHeight: 1.6 }}>
                      Real-time EMS data (vitals, FAST exams, hospital capacity) flows through Confluent Cloud Kafka topics with sub-second latency
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box
                    sx={{
                      flexShrink: 0,
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      background: theme.palette.primary.main,
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '14px',
                    }}
                  >
                    2
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5 }}>
                      Google Cloud Vertex AI Predictions
                    </Typography>
                    <Typography sx={{ color: theme.palette.text.secondary, fontSize: '14px', lineHeight: 1.6 }}>
                      ML models analyze streaming data to generate stroke and LVO probability predictions in real-time as events arrive
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box
                    sx={{
                      flexShrink: 0,
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      background: '#9333EA',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '14px',
                    }}
                  >
                    3
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5 }}>
                      Google Gemini Explanations
                    </Typography>
                    <Typography sx={{ color: theme.palette.text.secondary, fontSize: '14px', lineHeight: 1.6 }}>
                      LLM generates natural language clinical explanations and actionable recommendations based on AI predictions
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box
                    sx={{
                      flexShrink: 0,
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      background: '#10B981',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '14px',
                    }}
                  >
                    4
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5 }}>
                      Real-Time Dashboard Visualization
                    </Typography>
                    <Typography sx={{ color: theme.palette.text.secondary, fontSize: '14px', lineHeight: 1.6 }}>
                      Predictions stream instantly to clinicians via WebSocket, enabling immediate decision-making without page refresh
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Key Capabilities */}
          <Box>
            <Typography
              sx={{
                fontSize: '28px',
                fontWeight: 700,
                color: theme.palette.text.primary,
                mb: 1,
                letterSpacing: '-0.02em',
              }}
            >
              Key Capabilities
            </Typography>
            <Typography
              sx={{
                fontSize: '16px',
                color: theme.palette.text.secondary,
                mb: 4,
              }}
            >
              Designed to support rapid, informed clinical decision-making
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
              }}
            >
              <Capability text="Real-time streaming with instant updates" />
              <Capability text="AI-powered stroke risk assessment" />
              <Capability text="Intelligent hospital routing recommendations" />
              <Capability text="Natural language clinical explanations" />
              <Capability text="Live vitals monitoring dashboard" />
              <Capability text="Zero-latency WebSocket architecture" />
            </Box>
          </Box>

          {/* Streaming Status */}
          <Box>
            <Typography
              sx={{
                fontSize: '28px',
                fontWeight: 700,
                color: theme.palette.text.primary,
                mb: 1,
                letterSpacing: '-0.02em',
              }}
            >
              Confluent Cloud Streaming Status
            </Typography>
            <Typography
              sx={{
                fontSize: '16px',
                color: theme.palette.text.secondary,
                mb: 3,
              }}
            >
              Real-time metrics from the Kafka streaming pipeline
            </Typography>
            {metricsLoading ? (
              <Box sx={{ p: 3, borderRadius: 2, background: alpha(theme.palette.background.paper, isLight ? 0.6 : 0.4) }}>
                <LinearProgress />
              </Box>
            ) : streamingMetrics ? (
              <Box
                sx={{
                  background: alpha(theme.palette.background.paper, isLight ? 0.6 : 0.4),
                  borderRadius: 2,
                  p: 3,
                  border: `1px solid ${alpha(isStreamingActive ? theme.palette.success.main : theme.palette.warning.main, 0.3)}`,
                }}
              >
                <Stack spacing={2}>
                  {/* Status Header */}
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Cloud size={20} color={isStreamingActive ? theme.palette.success.main : theme.palette.warning.main} />
                      <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                        Streaming Status
                      </Typography>
                    </Stack>
                    <Chip
                      icon={isStreamingActive ? <CheckCircle2 size={16} /> : <X size={16} />}
                      label={isStreamingActive ? "🟢 LIVE" : "🟡 IDLE"}
                      sx={{
                        fontWeight: 700,
                        background: alpha(isStreamingActive ? theme.palette.success.main : theme.palette.warning.main, isLight ? 0.15 : 0.2),
                        color: isStreamingActive ? theme.palette.success.main : theme.palette.warning.main,
                      }}
                    />
                  </Stack>

                  {/* Metrics Grid */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: 2,
                    }}
                  >
                    <MetricBox
                      icon={<TrendingUp size={18} />}
                      label="Throughput"
                      value={`${streamingMetrics.messages_per_second.toFixed(2)} msg/s`}
                      color={theme.palette.info.main}
                    />
                    <MetricBox
                      icon={<Activity size={18} />}
                      label="Total Messages"
                      value={streamingMetrics.messages_received.toLocaleString()}
                      color={theme.palette.primary.main}
                    />
                    <MetricBox
                      icon={<Clock size={18} />}
                      label="Uptime"
                      value={formatUptime(streamingMetrics.uptime_seconds)}
                      color={theme.palette.warning.main}
                    />
                    <MetricBox
                      icon={<Cloud size={18} />}
                      label="Kafka Status"
                      value={streamingMetrics.kafka_connected ? "Connected" : "Disconnected"}
                      color={streamingMetrics.kafka_connected ? theme.palette.success.main : theme.palette.error.main}
                    />
                  </Box>

                  {/* Topic Info */}
                  <Box
                    sx={{
                      pt: 2,
                      borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <Zap size={16} color={theme.palette.primary.main} />
                      <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
                        ai.prediction.output
                      </Typography>
                      <Chip
                        label={`${streamingMetrics.topics["ai.prediction.output"].messages_received} messages`}
                        size="small"
                        sx={{
                          fontSize: "0.65rem",
                          height: 20,
                          ml: "auto",
                        }}
                      />
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            ) : (
              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  background: alpha(theme.palette.background.paper, isLight ? 0.6 : 0.4),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, textAlign: "center" }}>
                  Streaming metrics unavailable
                </Typography>
              </Box>
            )}
          </Box>

          {/* Disclaimer */}
          <Box
            sx={{
              background: 'rgba(245,158,11,0.15)',
              borderLeft: '4px solid #F59E0B',
              borderRadius: '12px',
              p: 3,
            }}
          >
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box
                sx={{
                  flexShrink: 0,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'rgba(245,158,11,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mt: 0.5,
                }}
              >
                <Typography sx={{ color: '#F59E0B', fontSize: '14px', fontWeight: 700 }}>
                  !
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontWeight: 600,
                    color: '#F59E0B',
                    mb: 0.5,
                    fontSize: '15px',
                  }}
                >
                  Demonstration System
                </Typography>
                <Typography
                  sx={{
                    color: '#FCD34D',
                    fontSize: '13px',
                    lineHeight: 1.6,
                  }}
                >
                  This platform uses synthetic data and is designed for demonstration purposes only.
                  It is not a clinical device and must not be used for actual patient care decisions.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            px: { xs: 4, sm: 6, md: 8 },
            py: 4,
            background: alpha(theme.palette.background.paper, isLight ? 0.5 : 0.4),
            borderTop: '1px solid rgba(148,163,184,0.2)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Button
            onClick={onClose}
            sx={{
              px: 4,
              py: 1.5,
              background: alpha(theme.palette.background.paper, isLight ? 0.7 : 0.6),
              color: theme.palette.text.primary,
              fontWeight: 500,
              borderRadius: '12px',
              border: '1px solid rgba(148,163,184,0.3)',
              '&:hover': {
                background: theme.palette.background.paper,
                borderColor: 'rgba(56,189,248,0.5)',
                transform: 'scale(1.02)',
              },
              transition: 'all 0.2s',
            }}
          >
            Close
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}

function FlowStep({
  number,
  title,
  description,
  icon,
  color,
}: {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}) {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isLight = mode === 'light';
  
  return (
    <Box sx={{ position: 'relative' }}>
      <Box sx={{ display: 'flex', gap: 2.5 }}>
        {/* Number Badge */}
        <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1,
              background: color,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '18px',
              boxShadow: `0 4px 12px ${alpha(color, 0.4)}`,
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.1)',
              },
            }}
          >
            {number}
          </Box>
          {number < 4 && (
            <Box
              sx={{
                width: '2px',
                height: '100%',
                background: alpha(theme.palette.text.secondary, isLight ? 0.2 : 0.15),
                mt: 1.5,
              }}
            />
          )}
        </Box>

        {/* Content Card */}
        <Box sx={{ flex: 1, pb: number < 4 ? 0 : 3 }}>
          <Box
            sx={{
              background: alpha(theme.palette.background.paper, isLight ? 0.6 : 0.5),
              borderRadius: 1,
              p: 3,
              border: `1px solid ${alpha(color, 0.3)}`,
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: alpha(color, 0.5),
                boxShadow: `0 4px 12px ${alpha(color, 0.2)}`,
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1 }}>
              <Box sx={{ color: color, mt: 0.5 }}>{icon}</Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  color: theme.palette.text.primary,
                  fontSize: '18px',
                }}
              >
                {title}
              </Typography>
            </Box>
            <Typography
              sx={{
                color: theme.palette.text.secondary,
                lineHeight: 1.6,
                ml: 5,
                fontSize: '14px',
              }}
            >
              {description}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function TechCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isLight = mode === 'light';
  
  return (
    <Box
      sx={{
        background: alpha(theme.palette.background.paper, isLight ? 0.6 : 0.5),
        borderRadius: 1,
        p: 3,
        border: `1px solid ${alpha(theme.palette.text.secondary, isLight ? 0.15 : 0.15)}`,
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: alpha(theme.palette.primary.main, isLight ? 0.4 : 0.4),
          boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, isLight ? 0.15 : 0.2)}`,
          transform: 'translateY(-2px)',
          background: alpha(theme.palette.background.paper, isLight ? 0.75 : 0.65),
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Box
          sx={{
            flexShrink: 0,
            width: 44,
            height: 44,
            borderRadius: 1,
            background: alpha(theme.palette.primary.main, isLight ? 0.1 : 0.15),
            color: theme.palette.primary.main,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            '&:hover': {
              background: theme.palette.primary.main,
              color: isLight ? '#ffffff' : '#ffffff',
            },
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 700,
              color: theme.palette.text.primary,
              mb: 1,
              fontSize: '16px',
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '14px',
              lineHeight: 1.6,
            }}
          >
            {description}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function MetricBox({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isLight = mode === 'light';

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 1,
        background: alpha(color, isLight ? 0.08 : 0.12),
        border: `1px solid ${alpha(color, 0.2)}`,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
        <Box sx={{ color }}>{icon}</Box>
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: "0.7rem" }}>
          {label}
        </Typography>
      </Stack>
      <Typography variant="h6" sx={{ fontWeight: 700, color, fontSize: "1rem" }}>
        {value}
      </Typography>
    </Box>
  );
}

function Capability({ text }: { text: string }) {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isLight = mode === 'light';
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
      <Box
        sx={{
          flexShrink: 0,
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: alpha(theme.palette.primary.main, isLight ? 0.1 : 0.15),
          color: theme.palette.primary.main,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mt: 0.5,
          transition: 'all 0.2s',
          '&:hover': {
            background: theme.palette.primary.main,
            color: '#ffffff',
          },
        }}
      >
        <CheckCircle2 size={16} />
      </Box>
      <Typography
        sx={{
          color: theme.palette.text.secondary,
          lineHeight: 1.6,
          fontSize: '14px',
        }}
      >
        {text}
      </Typography>
    </Box>
  );
}

