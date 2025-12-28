"use client";

import {
  Dialog,
  IconButton,
  Box,
  Typography,
  alpha,
  Divider,
  useTheme,
  Stack,
  useMediaQuery,
} from "@mui/material";
import {
  X,
  Database,
  Activity,
  Zap,
  Brain,
  Code,
  Heart,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useThemeMode } from "@/theme/ThemeContext";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";

interface ActiveCasesInfoModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ActiveCasesInfoModal({
  open,
  onClose,
}: ActiveCasesInfoModalProps) {
  const { mode } = useThemeMode();
  const theme = useTheme();
  const isLight = mode === "light";
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          width: isMobile ? "100%" : "1400px",
          maxWidth: isMobile ? "100%" : "95vw",
          maxHeight: isMobile ? "100%" : "92vh",
          borderRadius: isMobile ? 0 : 3,
          background: theme.palette.background.paper,
          border: "none",
          boxShadow: isLight
            ? "0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)"
            : "0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)",
          overflow: "hidden",
          m: isMobile ? 0 : 2,
        },
      }}
      sx={{
        "& .MuiBackdrop-root": {
          backgroundColor: isLight
            ? "rgba(0, 0, 0, 0.5)"
            : "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(8px)",
        },
      }}
    >
      {/* Close Button */}
      <IconButton
        onClick={onClose}
        sx={{
          position: "absolute",
          top: 20,
          right: 20,
          zIndex: 10,
          width: 36,
          height: 36,
          color: theme.palette.text.secondary,
          background: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: "blur(10px)",
          border: `1px solid ${alpha(theme.palette.text.secondary, 0.1)}`,
          "&:hover": {
            background: alpha(theme.palette.background.paper, 0.95),
            color: theme.palette.text.primary,
            transform: "scale(1.05)",
          },
          transition: "all 0.2s ease",
        }}
      >
        <X size={18} strokeWidth={2.5} />
      </IconButton>

      {/* Header */}
      <Box
        sx={{
          p: { xs: 2, sm: 4 },
          pb: { xs: 2, sm: 3.5 },
          borderBottom: `1px solid ${alpha(
            theme.palette.divider,
            isLight ? 0.08 : 0.12
          )}`,
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            isLight ? 0.03 : 0.06
          )} 0%, transparent 100%)`,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2.5}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2.5,
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                isLight ? 0.12 : 0.2
              )} 0%, ${alpha(
                theme.palette.primary.main,
                isLight ? 0.08 : 0.15
              )} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 4px 12px ${alpha(
                theme.palette.primary.main,
                isLight ? 0.15 : 0.2
              )}`,
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
                fontSize: "1.875rem",
                letterSpacing: "-0.025em",
                mb: 0.5,
                lineHeight: 1.2,
              }}
            >
              Active Cases Panel
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: "1rem",
                fontWeight: 400,
                lineHeight: 1.5,
              }}
            >
              Real-time monitoring of incoming EMS stroke cases with AI-powered
              risk assessment
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Side-by-Side Content - Two Column Layout */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          height: "calc(92vh - 200px)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Left Column - Panel Explanation */}
        <Box
          sx={{
            width: { xs: "100%", md: "50%" },
            minWidth: { md: "50%" },
            maxWidth: { md: "50%" },
            overflowY: "auto",
            overflowX: "hidden",
            borderRight: {
              md: `3px solid ${alpha(
                theme.palette.info.main,
                isLight ? 0.2 : 0.3
              )}`,
            },
            borderBottom: {
              xs: `3px solid ${alpha(
                theme.palette.info.main,
                isLight ? 0.2 : 0.3
              )}`,
              md: "none",
            },
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.info.main,
              isLight ? 0.04 : 0.08
            )} 0%, ${alpha(
              theme.palette.info.main,
              isLight ? 0.01 : 0.02
            )} 100%)`,
            position: "relative",
            "&::after": {
              content: '""',
              position: "absolute",
              top: 0,
              right: 0,
              width: "1px",
              height: "100%",
              background: `linear-gradient(180deg, transparent 0%, ${alpha(
                theme.palette.info.main,
                isLight ? 0.15 : 0.25
              )} 50%, transparent 100%)`,
              display: { xs: "none", md: "block" },
            },
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              background: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              background: alpha(
                theme.palette.text.secondary,
                isLight ? 0.2 : 0.3
              ),
              borderRadius: "4px",
              "&:hover": {
                background: alpha(
                  theme.palette.text.secondary,
                  isLight ? 0.35 : 0.45
                ),
              },
            },
          }}
        >
          <Box sx={{ p: 4.5, height: "100%" }}>
            {/* Section Header with Clear Label */}
            <Box
              sx={{
                mb: 4,
                pb: 3,
                borderBottom: `2px solid ${alpha(
                  theme.palette.info.main,
                  isLight ? 0.15 : 0.25
                )}`,
              }}
            >
              <Stack direction="row" alignItems="flex-start" spacing={2.5}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.info.main,
                      isLight ? 0.18 : 0.28
                    )} 0%, ${alpha(
                      theme.palette.info.main,
                      isLight ? 0.12 : 0.22
                    )} 100%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: `0 4px 12px ${alpha(
                      theme.palette.info.main,
                      isLight ? 0.2 : 0.3
                    )}`,
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
                      fontSize: "1.625rem",
                      letterSpacing: "-0.02em",
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
                      fontSize: "1rem",
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
              {/* What You See */}
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: theme.palette.text.primary,
                    fontWeight: 600,
                    fontSize: "1.0625rem",
                    mb: 2,
                    letterSpacing: "-0.01em",
                  }}
                >
                  What You See in This Panel
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.text.secondary,
                    lineHeight: 1.7,
                    fontSize: "0.9375rem",
                    mb: 2.5,
                  }}
                >
                  Each case card represents a patient who may be having a
                  stroke. Here's what each element means:
                </Typography>
                <Stack spacing={2}>
                  {[
                    {
                      icon: Heart,
                      label: "Patient Name",
                      desc: "An identifier for the patient (typically derived from patient ID)",
                    },
                    {
                      icon: AlertCircle,
                      label: "Risk Category",
                      desc: "A colored chip (CRITICAL, HIGH, MODERATE, LOW) showing how urgent the case is",
                    },
                    {
                      icon: Activity,
                      label: "Stroke Probability",
                      desc: "How likely it is this is a stroke, shown as a percentage (0-100%)",
                    },
                    {
                      icon: Zap,
                      label: "LVO Probability",
                      desc: "How likely it's a severe type of stroke needing specialized treatment",
                    },
                    {
                      icon: Clock,
                      label: "Time Since Onset",
                      desc: "How long since symptoms started — critical for treatment decisions",
                    },
                  ].map((item, idx) => (
                    <Stack
                      key={idx}
                      direction="row"
                      spacing={2}
                      alignItems="flex-start"
                    >
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: 2,
                          background: alpha(
                            theme.palette.primary.main,
                            isLight ? 0.08 : 0.12
                          ),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          mt: 0.25,
                        }}
                      >
                        <item.icon
                          size={18}
                          color={theme.palette.primary.main}
                        />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="body1"
                          sx={{
                            color: theme.palette.text.primary,
                            fontWeight: 600,
                            fontSize: "0.9375rem",
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
                            fontSize: "0.875rem",
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

              {/* Risk Categories */}
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: theme.palette.text.primary,
                    fontWeight: 600,
                    fontSize: "1.0625rem",
                    mb: 2,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Understanding Risk Categories
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.text.secondary,
                    lineHeight: 1.7,
                    fontSize: "0.9375rem",
                    mb: 2.5,
                  }}
                >
                  The colored chip tells you how urgent the case is and what
                  level of care is needed:
                </Typography>
                <Stack spacing={2}>
                  {[
                    {
                      color: theme.palette.error.main,
                      label: "CRITICAL",
                      subtitle: "Most Urgent",
                      threshold: "Stroke ≥80% OR Severe stroke ≥60%",
                      desc: "Needs immediate transport to a specialized hospital. Every minute counts.",
                    },
                    {
                      color: theme.palette.warning.main,
                      label: "HIGH",
                      subtitle: "Very Urgent",
                      threshold: "Stroke ≥60% OR Severe stroke ≥40%",
                      desc: "May need a specialized hospital depending on timing and other factors.",
                    },
                    {
                      color: theme.palette.info.main,
                      label: "MODERATE",
                      subtitle: "Urgent",
                      threshold: "Stroke ≥30%",
                      desc: "Still needs prompt evaluation and treatment at a stroke center.",
                    },
                    {
                      color: theme.palette.success.main,
                      label: "LOW",
                      subtitle: "Less Urgent",
                      threshold: "Stroke <30%",
                      desc: "Still needs evaluation, but may be less severe or a different condition.",
                    },
                  ].map((item, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        background: alpha(item.color, isLight ? 0.06 : 0.1),
                        border: `1.5px solid ${alpha(
                          item.color,
                          isLight ? 0.2 : 0.25
                        )}`,
                        borderLeft: `4px solid ${item.color}`,
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1.5}
                        sx={{ mb: 1 }}
                      >
                        <Typography
                          variant="body1"
                          sx={{
                            color: item.color,
                            fontWeight: 700,
                            fontSize: "0.9375rem",
                          }}
                        >
                          {item.label}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.text.secondary,
                            fontSize: "0.8125rem",
                          }}
                        >
                          {item.subtitle}
                        </Typography>
                      </Stack>
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontSize: "0.8125rem",
                          fontWeight: 500,
                          mb: 1,
                        }}
                      >
                        {item.threshold}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                          lineHeight: 1.6,
                          fontSize: "0.875rem",
                        }}
                      >
                        {item.desc}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Time Matters */}
              <Box>
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="flex-start"
                  sx={{ mb: 2 }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      background: alpha(
                        theme.palette.warning.main,
                        isLight ? 0.12 : 0.2
                      ),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
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
                        fontSize: "1.0625rem",
                        mb: 1,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      Why Time Matters
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: theme.palette.text.secondary,
                        lineHeight: 1.7,
                        fontSize: "0.9375rem",
                      }}
                    >
                      The "Time Since Onset" shows how long it's been since
                      symptoms started. This is critical because stroke
                      treatments work much better when given quickly. Standard
                      treatments are most effective within 4.5 hours, while
                      advanced treatments can work up to 6-24 hours in some
                      cases. The AI uses this timing, along with risk
                      probabilities, to recommend which hospital the patient
                      should go to.
                    </Typography>
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
            width: { xs: "100%", md: "50%" },
            minWidth: { md: "50%" },
            maxWidth: { md: "50%" },
            overflowY: "auto",
            overflowX: "hidden",
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.warning.main,
              isLight ? 0.04 : 0.08
            )} 0%, ${alpha(
              theme.palette.warning.main,
              isLight ? 0.01 : 0.02
            )} 100%)`,
            position: "relative",
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              background: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              background: alpha(
                theme.palette.text.secondary,
                isLight ? 0.2 : 0.3
              ),
              borderRadius: "4px",
              "&:hover": {
                background: alpha(
                  theme.palette.text.secondary,
                  isLight ? 0.35 : 0.45
                ),
              },
            },
          }}
        >
          <Box sx={{ p: 4.5, height: "100%" }}>
            {/* Section Header with Clear Label */}
            <Box
              sx={{
                mb: 4,
                pb: 3,
                borderBottom: `2px solid ${alpha(
                  theme.palette.warning.main,
                  isLight ? 0.15 : 0.25
                )}`,
              }}
            >
              <Stack direction="row" alignItems="flex-start" spacing={2.5}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.warning.main,
                      isLight ? 0.18 : 0.28
                    )} 0%, ${alpha(
                      theme.palette.warning.main,
                      isLight ? 0.12 : 0.22
                    )} 100%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: `0 4px 12px ${alpha(
                      theme.palette.warning.main,
                      isLight ? 0.2 : 0.3
                    )}`,
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
                      fontSize: "1.625rem",
                      letterSpacing: "-0.02em",
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
                      fontSize: "1rem",
                      lineHeight: 1.5,
                      fontWeight: 400,
                    }}
                  >
                    For judges: How the system works behind the scenes
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Stack spacing={3.5}>
              {/* Streaming Architecture Overview */}
              <Box>
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      background: alpha(
                        theme.palette.primary.main,
                        isLight ? 0.1 : 0.15
                      ),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Zap size={18} color={theme.palette.primary.main} />
                  </Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: theme.palette.text.primary,
                      fontWeight: 600,
                      fontSize: "1.0625rem",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Real-Time Streaming Architecture
                  </Typography>
                </Stack>
                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.text.secondary,
                    lineHeight: 1.7,
                    fontSize: "0.9375rem",
                    mb: 2,
                  }}
                >
                  This panel demonstrates a complete real-time streaming data
                  pipeline powered by{" "}
                  <strong style={{ color: theme.palette.text.primary }}>
                    Confluent Cloud
                  </strong>{" "}
                  and{" "}
                  <strong style={{ color: theme.palette.text.primary }}>
                    Apache Kafka
                  </strong>
                  . Data flows continuously from EMS devices through Kafka
                  topics, gets processed by AI models, and updates this
                  dashboard in real-time.
                </Typography>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    background: alpha(
                      theme.palette.primary.main,
                      isLight ? 0.06 : 0.1
                    ),
                    border: `1.5px solid ${alpha(
                      theme.palette.primary.main,
                      isLight ? 0.2 : 0.25
                    )}`,
                    borderLeft: `4px solid ${theme.palette.primary.main}`,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      mb: 1.5,
                    }}
                  >
                    <strong style={{ color: theme.palette.text.primary }}>
                      Data Flow:
                    </strong>
                  </Typography>
                  <Stack spacing={1.5}>
                    {[
                      "EMS Devices → Kafka Topics (ems.vitals.raw, ems.fast.exam)",
                      "Stream Processor → AI Predictions → Kafka (ai.prediction.output)",
                      "FastAPI Backend → Consumes from Kafka → WebSocket to Dashboard",
                      "Dashboard → Real-time updates via WebSocket (~1 second latency)",
                    ].map((step, idx) => (
                      <Stack
                        key={idx}
                        direction="row"
                        spacing={1.5}
                        alignItems="flex-start"
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.primary.main,
                            fontWeight: 700,
                            fontSize: "0.75rem",
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
                            fontSize: "0.875rem",
                            fontFamily: "monospace",
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

              {/* Confluent Cloud & Kafka Topics */}
              <Box>
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      background: alpha(
                        theme.palette.warning.main,
                        isLight ? 0.1 : 0.15
                      ),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Database size={18} color={theme.palette.warning.main} />
                  </Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: theme.palette.text.primary,
                      fontWeight: 600,
                      fontSize: "1.0625rem",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Confluent Cloud & Kafka Topics
                  </Typography>
                </Stack>
                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.text.secondary,
                    lineHeight: 1.7,
                    fontSize: "0.9375rem",
                    mb: 2,
                  }}
                >
                  The system uses{" "}
                  <strong style={{ color: theme.palette.text.primary }}>
                    Confluent Cloud
                  </strong>{" "}
                  as the managed Apache Kafka platform, with four key topics
                  handling different data streams:
                </Typography>
                <Stack spacing={2}>
                  {[
                    {
                      topic: "ems.vitals.raw",
                      desc: "Continuous stream of patient vital signs (heart rate, BP, SpO₂, GCS) from ambulance monitoring equipment. Updates every 1-3 seconds.",
                      color: theme.palette.info.main,
                    },
                    {
                      topic: "ems.fast.exam",
                      desc: "FAST stroke exam results (face droop, arm weakness, speech difficulty) that trigger AI prediction pipeline.",
                      color: theme.palette.warning.main,
                    },
                    {
                      topic: "hospital.capacity",
                      desc: "Real-time hospital capacity and capabilities (stroke center level, CT availability, current ED crowding).",
                      color: theme.palette.success.main,
                    },
                    {
                      topic: "ai.prediction.output",
                      desc: "AI-generated stroke predictions with probabilities, risk categories, and hospital routing recommendations.",
                      color: theme.palette.primary.main,
                    },
                  ].map((item, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        background: alpha(item.color, isLight ? 0.06 : 0.1),
                        border: `1.5px solid ${alpha(
                          item.color,
                          isLight ? 0.2 : 0.25
                        )}`,
                        borderLeft: `4px solid ${item.color}`,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: item.color,
                          fontWeight: 700,
                          fontSize: "0.875rem",
                          fontFamily: "monospace",
                          mb: 1,
                        }}
                      >
                        {item.topic}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontSize: "0.875rem",
                          lineHeight: 1.6,
                        }}
                      >
                        {item.desc}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Stream Processing */}
              <Box>
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      background: alpha(
                        theme.palette.success.main,
                        isLight ? 0.1 : 0.15
                      ),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Activity size={18} color={theme.palette.success.main} />
                  </Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: theme.palette.text.primary,
                      fontWeight: 600,
                      fontSize: "1.0625rem",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Stream Processing & State Management
                  </Typography>
                </Stack>
                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.text.secondary,
                    lineHeight: 1.7,
                    fontSize: "0.9375rem",
                    mb: 1.5,
                  }}
                >
                  The stream processor consumes from multiple Kafka topics and
                  maintains in-memory state per case, joining:
                </Typography>
                <Box
                  component="ul"
                  sx={{ pl: 2.5, mb: 1.5, color: theme.palette.text.secondary }}
                >
                  <li style={{ marginBottom: "0.75rem" }}>
                    <strong style={{ color: theme.palette.text.primary }}>
                      Vitals events
                    </strong>{" "}
                    (continuous updates)
                  </li>
                  <li style={{ marginBottom: "0.75rem" }}>
                    <strong style={{ color: theme.palette.text.primary }}>
                      FAST exam
                    </strong>{" "}
                    (typically one per case)
                  </li>
                  <li>
                    <strong style={{ color: theme.palette.text.primary }}>
                      Hospital capacity
                    </strong>{" "}
                    (shared across cases)
                  </li>
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.text.secondary,
                    lineHeight: 1.7,
                    fontSize: "0.9375rem",
                  }}
                >
                  When sufficient data is available, it triggers AI prediction
                  generation using Google Cloud Vertex AI, then publishes
                  enriched predictions back to Kafka. This demonstrates a{" "}
                  <strong style={{ color: theme.palette.text.primary }}>
                    stateful stream processing
                  </strong>{" "}
                  pattern where events are joined by case_id across different
                  topics.
                </Typography>
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Real-Time Dashboard Updates */}
              <Box>
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      background: alpha(
                        theme.palette.primary.main,
                        isLight ? 0.1 : 0.15
                      ),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Zap size={18} color={theme.palette.primary.main} />
                  </Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: theme.palette.text.primary,
                      fontWeight: 600,
                      fontSize: "1.0625rem",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Real-Time Dashboard Updates
                  </Typography>
                </Stack>
                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.text.secondary,
                    lineHeight: 1.7,
                    fontSize: "0.9375rem",
                    mb: 1.5,
                  }}
                >
                  The FastAPI backend consumes from the{" "}
                  <Box
                    component="code"
                    sx={{
                      color: theme.palette.primary.main,
                      background: alpha(
                        theme.palette.primary.main,
                        isLight ? 0.1 : 0.15
                      ),
                      padding: "2px 6px",
                      borderRadius: 1,
                      fontSize: "0.875rem",
                      fontFamily: "monospace",
                      fontWeight: 500,
                    }}
                  >
                    ai.prediction.output
                  </Box>{" "}
                  topic and maintains an in-memory store of active cases.
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.text.secondary,
                    lineHeight: 1.7,
                    fontSize: "0.9375rem",
                  }}
                >
                  This panel updates in real-time via{" "}
                  <strong style={{ color: theme.palette.text.primary }}>
                    WebSocket connections
                  </strong>
                  —when new predictions arrive from Kafka, they're immediately
                  pushed to all connected dashboard clients without requiring
                  page refreshes. The "live" counter and case list reflect the
                  current state of the Kafka stream.
                </Typography>
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Hackathon Highlights */}
              <Box>
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      background: alpha(
                        theme.palette.warning.main,
                        isLight ? 0.1 : 0.15
                      ),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Code size={18} color={theme.palette.warning.main} />
                  </Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: theme.palette.text.primary,
                      fontWeight: 600,
                      fontSize: "1.0625rem",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Hackathon Technical Highlights
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    background: alpha(
                      theme.palette.warning.main,
                      isLight ? 0.06 : 0.1
                    ),
                    border: `1.5px solid ${alpha(
                      theme.palette.warning.main,
                      isLight ? 0.2 : 0.25
                    )}`,
                  }}
                >
                  <Stack spacing={1.5}>
                    {[
                      "✅ Real-time streaming with Confluent Cloud (managed Apache Kafka)",
                      "✅ Multi-topic event streaming (4 Kafka topics)",
                      "✅ Stateful stream processing with event joining",
                      "✅ Low-latency updates (~1 second from Kafka to dashboard)",
                      "✅ WebSocket for real-time client synchronization",
                      "✅ Schema evolution support (JSON messages with inferred schemas)",
                      "✅ Horizontal scalability (multiple consumers can process streams)",
                    ].map((item, idx) => (
                      <Stack
                        key={idx}
                        direction="row"
                        spacing={1.5}
                        alignItems="flex-start"
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.warning.main,
                            fontSize: "0.875rem",
                            mt: 0.25,
                          }}
                        >
                          {item.split("✅ ")[0]}✅
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.text.secondary,
                            fontSize: "0.875rem",
                            lineHeight: 1.6,
                          }}
                        >
                          {item.split("✅ ")[1]}
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
