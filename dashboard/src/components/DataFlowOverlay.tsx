"use client";

import {
  Dialog,
  Box,
  Typography,
  Stack,
  Chip,
  IconButton,
  useTheme,
  alpha,
  Divider,
  Grid,
} from "@mui/material";
import { X, Circle, ArrowRight, Database, Brain, Zap, Activity, TrendingUp, Clock, Layers, Cloud } from "lucide-react";
import { useThemeMode } from "@/theme/ThemeContext";
import { useWebSocket } from "@/hooks/useWebSocket";

interface DataFlowOverlayProps {
  open: boolean;
  onClose: () => void;
  casesCount: number;
}

export function DataFlowOverlay({ open, onClose, casesCount }: DataFlowOverlayProps) {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isLight = mode === "light";
  const { connected: wsConnected } = useWebSocket();

  const streams = [
    {
      name: "EMS Vitals",
      topic: "ems.vitals.raw",
      icon: <Activity size={18} />,
      color: theme.palette.info.main,
      description: "Continuous heart rate, BP, SpO₂, GCS updates",
      frequency: "Every 5-10 seconds",
      status: "active",
    },
    {
      name: "FAST Exam",
      topic: "ems.fast.exam",
      icon: <Brain size={18} />,
      color: theme.palette.warning.main,
      description: "Face droop, arm weakness, speech assessment",
      frequency: "Once per case",
      status: "active",
    },
    {
      name: "Hospital Capacity",
      topic: "hospital.capacity",
      icon: <Database size={18} />,
      color: theme.palette.success.main,
      description: "Real-time hospital status & capabilities",
      frequency: "Every 1-2 minutes",
      status: "active",
    },
    {
      name: "AI Predictions",
      topic: "ai.prediction.output",
      icon: <Zap size={18} />,
      color: theme.palette.primary.main,
      description: "Stroke/LVO probabilities, routing, explanations",
      frequency: "Real-time as processed",
      status: wsConnected ? "active" : "inactive",
    },
  ];

  const panelConnections = [
    {
      panel: "ACTIVE CASES",
      data: ["Case summaries", "Risk categories", "Time since onset"],
      sources: ["ai.prediction.output"],
      color: theme.palette.info.main,
    },
    {
      panel: "SELECTED CASE",
      data: ["Live vitals", "Risk probabilities", "Time windows", "Vital trends"],
      sources: ["ems.vitals.raw", "ai.prediction.output"],
      color: theme.palette.primary.main,
    },
    {
      panel: "AI INSIGHTS",
      data: ["AI explanations", "Hospital routing", "Recommended actions", "Risk factors"],
      sources: ["ai.prediction.output", "hospital.capacity"],
      color: theme.palette.warning.main,
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 1,
          background: theme.palette.background.paper,
          border: `1px solid ${alpha(theme.palette.text.secondary, isLight ? 0.2 : 0.15)}`,
          maxHeight: "90vh",
        },
      }}
      sx={{
        "& .MuiBackdrop-root": {
          backgroundColor: isLight ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(4px)",
        },
      }}
    >
      <Box sx={{ position: "relative", p: 3 }}>
        {/* Close Button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            color: theme.palette.text.secondary,
            "&:hover": {
              background: alpha(theme.palette.text.secondary, isLight ? 0.1 : 0.15),
            },
          }}
        >
          <X size={20} />
        </IconButton>

        {/* Header */}
        <Box sx={{ mb: 3, pr: 6 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 1,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary?.main || theme.palette.primary.dark} 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              <Zap size={24} color="#ffffff" fill="#ffffff" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.text.primary, mb: 0.5 }}>
                Real-Time Streaming Architecture
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: "0.9rem" }}>
                Confluent Cloud • Google Cloud AI • Multi-Stream Processing • Sub-Second Latency
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Key Metrics Banner */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                background: alpha(theme.palette.info.main, isLight ? 0.08 : 0.12),
                border: `1px solid ${alpha(theme.palette.info.main, isLight ? 0.2 : 0.3)}`,
                textAlign: "center",
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5} sx={{ mb: 0.5 }}>
                <Activity size={16} color={theme.palette.info.main} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                  4
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: "0.7rem" }}>
                Active Streams
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                background: alpha(theme.palette.success.main, isLight ? 0.08 : 0.12),
                border: `1px solid ${alpha(theme.palette.success.main, isLight ? 0.2 : 0.3)}`,
                textAlign: "center",
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5} sx={{ mb: 0.5 }}>
                <Clock size={16} color={theme.palette.success.main} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                  &lt;1s
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: "0.7rem" }}>
                Latency
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                background: alpha(theme.palette.warning.main, isLight ? 0.08 : 0.12),
                border: `1px solid ${alpha(theme.palette.warning.main, isLight ? 0.2 : 0.3)}`,
                textAlign: "center",
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5} sx={{ mb: 0.5 }}>
                <Layers size={16} color={theme.palette.warning.main} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                  3
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: "0.7rem" }}>
                Stream Joins
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                background: alpha(theme.palette.primary.main, isLight ? 0.08 : 0.12),
                border: `1px solid ${alpha(theme.palette.primary.main, isLight ? 0.2 : 0.3)}`,
                textAlign: "center",
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5} sx={{ mb: 0.5 }}>
                <Brain size={16} color={theme.palette.primary.main} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                  2
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: "0.7rem" }}>
                AI Models
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Technology Stack */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: theme.palette.text.primary }}>
            🏆 Hackathon Technology Stack
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              icon={<Cloud size={16} />}
              label="Confluent Cloud"
              sx={{
                borderRadius: 1,
                fontWeight: 600,
                background: alpha(theme.palette.info.main, isLight ? 0.1 : 0.15),
                color: theme.palette.info.main,
                border: `1px solid ${alpha(theme.palette.info.main, isLight ? 0.3 : 0.4)}`,
              }}
            />
            <Chip
              icon={<Brain size={16} />}
              label="Vertex AI"
              sx={{
                borderRadius: 1,
                fontWeight: 600,
                background: alpha(theme.palette.primary.main, isLight ? 0.1 : 0.15),
                color: theme.palette.primary.main,
                border: `1px solid ${alpha(theme.palette.primary.main, isLight ? 0.3 : 0.4)}`,
              }}
            />
            <Chip
              icon={<Zap size={16} />}
              label="Gemini AI"
              sx={{
                borderRadius: 1,
                fontWeight: 600,
                background: alpha(theme.palette.warning.main, isLight ? 0.1 : 0.15),
                color: theme.palette.warning.main,
                border: `1px solid ${alpha(theme.palette.warning.main, isLight ? 0.3 : 0.4)}`,
              }}
            />
            <Chip
              icon={<TrendingUp size={16} />}
              label="Stream Processing"
              sx={{
                borderRadius: 1,
                fontWeight: 600,
                background: alpha(theme.palette.success.main, isLight ? 0.1 : 0.15),
                color: theme.palette.success.main,
                border: `1px solid ${alpha(theme.palette.success.main, isLight ? 0.3 : 0.4)}`,
              }}
            />
            <Chip
              icon={<Database size={16} />}
              label="WebSocket"
              sx={{
                borderRadius: 1,
                fontWeight: 600,
                background: alpha(theme.palette.secondary?.main || theme.palette.primary.main, isLight ? 0.1 : 0.15),
                color: theme.palette.secondary?.main || theme.palette.primary.main,
                border: `1px solid ${alpha(theme.palette.secondary?.main || theme.palette.primary.main, isLight ? 0.3 : 0.4)}`,
              }}
            />
          </Stack>
        </Box>

        {/* Connection Status */}
        <Box
          sx={{
            p: 2,
            borderRadius: 1,
            background: wsConnected
              ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, isLight ? 0.15 : 0.2)} 0%, ${alpha(theme.palette.success.main, isLight ? 0.08 : 0.12)} 100%)`
              : alpha(theme.palette.warning.main, isLight ? 0.1 : 0.15),
            border: `2px solid ${alpha(wsConnected ? theme.palette.success.main : theme.palette.warning.main, isLight ? 0.3 : 0.4)}`,
            mb: 3,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Circle
              size={18}
              fill={wsConnected ? theme.palette.success.main : theme.palette.warning.main}
              color={wsConnected ? theme.palette.success.main : theme.palette.warning.main}
            />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
              {wsConnected ? "🟢 Live Streaming Active" : "🟡 Streaming Paused"}
            </Typography>
            <Chip
              label={`${casesCount} active cases`}
              size="small"
              sx={{
                borderRadius: 1,
                ml: "auto",
                fontWeight: 600,
                background: wsConnected
                  ? alpha(theme.palette.success.main, isLight ? 0.2 : 0.25)
                  : alpha(theme.palette.warning.main, isLight ? 0.2 : 0.25),
                color: wsConnected ? theme.palette.success.main : theme.palette.warning.main,
                border: `1px solid ${alpha(wsConnected ? theme.palette.success.main : theme.palette.warning.main, isLight ? 0.3 : 0.4)}`,
              }}
            />
          </Stack>
        </Box>

        {/* Streaming Data Sources */}
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Database size={20} color={theme.palette.info.main} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
              4 Active Kafka Data Streams
            </Typography>
          </Stack>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
              gap: 1.5,
            }}
          >
            {streams.map((stream, idx) => (
              <Box
                key={idx}
                sx={{
                  p: 2,
                  borderRadius: 1,
                  background: alpha(stream.color, isLight ? 0.05 : 0.08),
                  border: `1px solid ${alpha(stream.color, isLight ? 0.2 : 0.3)}`,
                  transition: "all 0.2s",
                  "&:hover": {
                    border: `1px solid ${alpha(stream.color, isLight ? 0.3 : 0.4)}`,
                    background: alpha(stream.color, isLight ? 0.08 : 0.12),
                  },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 0.75,
                      background: alpha(stream.color, isLight ? 0.15 : 0.2),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: stream.color,
                    }}
                  >
                    {stream.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                      {stream.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: "0.7rem" }}>
                      {stream.topic}
                    </Typography>
                  </Box>
                  <Chip
                    label={stream.status === "active" ? "● Live" : "○ Idle"}
                    size="small"
                    sx={{
                      borderRadius: 1,
                      fontSize: "0.65rem",
                      height: 20,
                      background: stream.status === "active" ? alpha(stream.color, isLight ? 0.15 : 0.2) : alpha(theme.palette.text.secondary, isLight ? 0.1 : 0.15),
                      color: stream.status === "active" ? stream.color : theme.palette.text.secondary,
                      border: `1px solid ${alpha(stream.status === "active" ? stream.color : theme.palette.text.secondary, isLight ? 0.2 : 0.3)}`,
                    }}
                  />
                </Stack>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: "0.8rem", mb: 0.5 }}>
                  {stream.description}
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: "0.7rem" }}>
                  Frequency: {stream.frequency}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Data Flow Pipeline - Visual Flow */}
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <TrendingUp size={20} color={theme.palette.primary.main} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
              End-to-End Data Flow Pipeline
            </Typography>
          </Stack>
          <Box
            sx={{
              p: 3,
              borderRadius: 1,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, isLight ? 0.05 : 0.08)} 0%, ${alpha(theme.palette.background.paper, isLight ? 0.3 : 0.2)} 100%)`,
              border: `2px solid ${alpha(theme.palette.primary.main, isLight ? 0.2 : 0.3)}`,
              position: "relative",
            }}
          >
            <Stack spacing={2.5}>
              {/* Step 1 */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  background: alpha(theme.palette.info.main, isLight ? 0.1 : 0.15),
                  border: `2px solid ${alpha(theme.palette.info.main, isLight ? 0.3 : 0.4)}`,
                  position: "relative",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "1rem",
                      boxShadow: `0 4px 8px ${alpha(theme.palette.info.main, 0.3)}`,
                    }}
                  >
                    1
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                      <Cloud size={18} color={theme.palette.info.main} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                        Confluent Cloud Kafka Topics
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: "0.85rem", pl: 3.5 }}>
                      <strong>ems.vitals.raw</strong> • <strong>ems.fast.exam</strong> • <strong>hospital.capacity</strong>
                      <br />
                      Real-time data ingestion from EMS, FAST exams, and hospital systems
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "center", my: -1 }}>
                <ArrowRight size={24} color={theme.palette.primary.main} style={{ transform: "rotate(90deg)" }} />
              </Box>

              {/* Step 2 */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  background: alpha(theme.palette.warning.main, isLight ? 0.1 : 0.15),
                  border: `2px solid ${alpha(theme.palette.warning.main, isLight ? 0.3 : 0.4)}`,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "1rem",
                      boxShadow: `0 4px 8px ${alpha(theme.palette.warning.main, 0.3)}`,
                    }}
                  >
                    2
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                      <Layers size={18} color={theme.palette.warning.main} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                        Stream Processing & Multi-Stream Joins
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: "0.85rem", pl: 3.5 }}>
                      Joins 3+ streams in real-time • Feature extraction • Windowed aggregations • Builds AI-ready feature vectors
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "center", my: -1 }}>
                <ArrowRight size={24} color={theme.palette.primary.main} style={{ transform: "rotate(90deg)" }} />
              </Box>

              {/* Step 3 */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  background: alpha(theme.palette.error.main, isLight ? 0.1 : 0.15),
                  border: `2px solid ${alpha(theme.palette.error.main, isLight ? 0.3 : 0.4)}`,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "1rem",
                      boxShadow: `0 4px 8px ${alpha(theme.palette.error.main, 0.3)}`,
                    }}
                  >
                    3
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                      <Brain size={18} color={theme.palette.error.main} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                        Google Cloud AI Inference
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: "0.85rem", pl: 3.5 }}>
                      <strong>Vertex AI:</strong> Stroke/LVO probability predictions • <strong>Gemini:</strong> Natural language explanations & recommendations
                      <br />
                      <strong>AI on data in motion</strong> - predictions generated in real-time as events occur
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "center", my: -1 }}>
                <ArrowRight size={24} color={theme.palette.primary.main} style={{ transform: "rotate(90deg)" }} />
              </Box>

              {/* Step 4 */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  background: alpha(theme.palette.success.main, isLight ? 0.1 : 0.15),
                  border: `2px solid ${alpha(theme.palette.success.main, isLight ? 0.3 : 0.4)}`,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "1rem",
                      boxShadow: `0 4px 8px ${alpha(theme.palette.success.main, 0.3)}`,
                    }}
                  >
                    4
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                      <Zap size={18} color={theme.palette.success.main} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                        Real-Time Dashboard via WebSocket
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: "0.85rem", pl: 3.5 }}>
                      Predictions published to <strong>ai.prediction.output</strong> topic • FastAPI server consumes & broadcasts via WebSocket
                      <br />
                      Dashboard updates <strong>instantly</strong> without page refresh • All 3 panels update in real-time
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </Box>
        </Box>

        {/* Panel Data Connections */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Activity size={20} color={theme.palette.primary.main} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
              Real-Time Panel Data Connections
            </Typography>
          </Stack>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              gap: 1.5,
            }}
          >
            {panelConnections.map((panel, idx) => (
              <Box
                key={idx}
                sx={{
                  p: 2,
                  borderRadius: 1,
                  background: alpha(panel.color, isLight ? 0.05 : 0.08),
                  border: `1px solid ${alpha(panel.color, isLight ? 0.2 : 0.3)}`,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: panel.color }}>
                  {panel.panel}
                </Typography>
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: "0.7rem", fontWeight: 600 }}>
                    Data Sources:
                  </Typography>
                  <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                    {panel.sources.map((source, sIdx) => (
                      <Chip
                        key={sIdx}
                        label={source}
                        size="small"
                        sx={{
                          borderRadius: 0.5,
                          fontSize: "0.65rem",
                          height: 20,
                          background: alpha(panel.color, isLight ? 0.1 : 0.15),
                          color: panel.color,
                          border: `1px solid ${alpha(panel.color, isLight ? 0.2 : 0.3)}`,
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
                <Divider sx={{ my: 1, borderColor: alpha(theme.palette.text.secondary, isLight ? 0.15 : 0.1) }} />
                <Box>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: "0.7rem", fontWeight: 600 }}>
                    Displays:
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, mt: 0.5, mb: 0 }}>
                    {panel.data.map((item, dIdx) => (
                      <li key={dIdx}>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: "0.7rem" }}>
                          {item}
                        </Typography>
                      </li>
                    ))}
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Hackathon Highlights */}
        <Box
          sx={{
            p: 2.5,
            borderRadius: 1,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, isLight ? 0.12 : 0.18)} 0%, ${alpha(theme.palette.info.main, isLight ? 0.08 : 0.12)} 100%)`,
            border: `2px solid ${alpha(theme.palette.primary.main, isLight ? 0.3 : 0.4)}`,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                background: alpha(theme.palette.warning.main, isLight ? 0.2 : 0.25),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Zap size={18} color={theme.palette.warning.main} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
              🏆 Key Features for Hackathon Judges
            </Typography>
          </Stack>
          <Box component="ul" sx={{ pl: 3, m: 0 }}>
            <li>
              <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontSize: "0.85rem", mb: 1, fontWeight: 600 }}>
                <strong>Real-Time Streaming:</strong> Confluent Cloud Kafka handles 4+ concurrent data streams with sub-second latency
              </Typography>
            </li>
            <li>
              <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontSize: "0.85rem", mb: 1, fontWeight: 600 }}>
                <strong>Multi-Stream Joins:</strong> Stream processor joins EMS vitals, FAST exams, and hospital capacity in real-time
              </Typography>
            </li>
            <li>
              <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontSize: "0.85rem", mb: 1, fontWeight: 600 }}>
                <strong>AI on Data in Motion:</strong> Vertex AI and Gemini process streaming data to generate predictions and explanations as events occur
              </Typography>
            </li>
            <li>
              <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontSize: "0.85rem", mb: 1, fontWeight: 600 }}>
                <strong>Instant Visualization:</strong> WebSocket enables real-time dashboard updates without page refresh - all panels update simultaneously
              </Typography>
            </li>
            <li>
              <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontSize: "0.85rem", fontWeight: 600 }}>
                <strong>End-to-End Pipeline:</strong> Data flows from generation → Kafka → processing → AI → dashboard in &lt;1 second
              </Typography>
            </li>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}

