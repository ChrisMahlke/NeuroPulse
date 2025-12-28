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
  Brain,
  Sparkles,
  Code,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
  Zap,
  Database,
  Activity,
} from "lucide-react";
import { useThemeMode } from "@/theme/ThemeContext";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";

interface AIInsightsInfoModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AIInsightsInfoModal({
  open,
  onClose,
}: AIInsightsInfoModalProps) {
  const { mode } = useThemeMode();
  const theme = useTheme();
  const isLight = mode === "light";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: "1400px",
          maxWidth: "95vw",
          maxHeight: "92vh",
          borderRadius: 3,
          background: theme.palette.background.paper,
          border: "none",
          boxShadow: isLight
            ? "0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)"
            : "0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)",
          overflow: "hidden",
          m: 2,
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
          p: 4,
          pb: 3.5,
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
            <Brain size={26} color={theme.palette.primary.main} />
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
              Recommendation & Rationale Panel
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
              AI-generated explanations, hospital routing recommendations, and
              prioritized action items
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
            {/* Section Header */}
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
              {/* What This Panel Provides */}
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
                  What This Panel Provides
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
                  This panel synthesizes AI predictions into actionable medical
                  guidance:
                </Typography>
                <Stack spacing={2}>
                  {[
                    {
                      icon: Brain,
                      label: "AI Explanation",
                      desc: "Natural language summary of the AI's assessment and reasoning",
                    },
                    {
                      icon: MapPin,
                      label: "Hospital Routing",
                      desc: "Recommended destination with travel and treatment time estimates",
                    },
                    {
                      icon: CheckCircle,
                      label: "Recommended Actions",
                      desc: "Prioritized list of interventions and protocols",
                    },
                    {
                      icon: AlertCircle,
                      label: "Risk Factors",
                      desc: "Key clinical findings that influenced the AI's assessment",
                    },
                    {
                      icon: Clock,
                      label: "Time Windows",
                      desc: "Visual representation of remaining treatment opportunities",
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

              {/* Hospital Types */}
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
                  Understanding Hospital Types
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
                  The AI recommends different types of hospitals based on the
                  patient's needs:
                </Typography>
                <Stack spacing={2}>
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      background: alpha(
                        theme.palette.info.main,
                        isLight ? 0.06 : 0.1
                      ),
                      border: `1.5px solid ${alpha(
                        theme.palette.info.main,
                        isLight ? 0.2 : 0.25
                      )}`,
                      borderLeft: `4px solid ${theme.palette.info.main}`,
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        color: theme.palette.info.main,
                        fontWeight: 700,
                        fontSize: "0.9375rem",
                        mb: 1,
                      }}
                    >
                      Primary Stroke Center
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        lineHeight: 1.6,
                        fontSize: "0.875rem",
                      }}
                    >
                      Can provide IV tPA (thrombolysis) and basic stroke care.
                      Appropriate for most stroke cases, especially when time
                      windows are favorable. Typically has 24/7 neurology
                      coverage and CT scanning capabilities.
                    </Typography>
                  </Box>
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
                      borderLeft: `4px solid ${theme.palette.warning.main}`,
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        color: theme.palette.warning.main,
                        fontWeight: 700,
                        fontSize: "0.9375rem",
                        mb: 1,
                      }}
                    >
                      Comprehensive Stroke Center
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        lineHeight: 1.6,
                        fontSize: "0.875rem",
                      }}
                    >
                      Can provide all primary center services PLUS endovascular
                      therapy (EVT/mechanical thrombectomy). Required for LVO
                      cases that may need mechanical clot removal. Has
                      interventional neuroradiology capabilities and can perform
                      EVT 24/7. May be worth bypassing a primary center if
                      travel time is reasonable and LVO probability is high.
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Action Priority Levels */}
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
                  Action Priority Levels
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
                  Actions are prioritized to help medical professionals focus on
                  the most critical interventions first:
                </Typography>
                <Stack spacing={2}>
                  {[
                    {
                      color: theme.palette.error.main,
                      label: "CRITICAL (Red)",
                      desc: "Life-saving interventions that must be performed immediately: maintaining airway/breathing, managing severe hypotension, pre-notifying comprehensive centers for suspected LVO. These actions cannot be delayed.",
                    },
                    {
                      color: theme.palette.warning.main,
                      label: "HIGH (Orange)",
                      desc: "Important monitoring and preparation: continuous vital sign monitoring, pre-notification of receiving hospitals, ongoing neurological assessment. These actions optimize care but are less immediately life-threatening.",
                    },
                    {
                      color: theme.palette.info.main,
                      label: "NORMAL (Blue)",
                      desc: "Standard care protocols: documentation, glucose management, general monitoring. These are routine aspects of stroke care that should be performed as part of standard protocols.",
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
                        variant="body1"
                        sx={{
                          color: item.color,
                          fontWeight: 700,
                          fontSize: "0.9375rem",
                          mb: 1,
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
                  ))}
                </Stack>
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Making Routing Decisions */}
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
                    <MapPin size={18} color={theme.palette.warning.main} />
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
                      Making Routing Decisions
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: theme.palette.text.secondary,
                        lineHeight: 1.7,
                        fontSize: "0.9375rem",
                      }}
                    >
                      The routing recommendation balances multiple factors: LVO
                      probability (determines if comprehensive center is
                      needed), time since onset (affects treatment eligibility),
                      travel time (adds to total time to treatment), and
                      hospital capacity. The AI calculates whether bypassing a
                      closer primary center is justified to reach a
                      comprehensive center. Generally, if LVO probability is
                      high (≥40%) and time windows allow, bypassing may be
                      appropriate even if it adds 15-30 minutes of travel time,
                      because EVT can dramatically improve outcomes for LVO
                      patients.
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
            {/* Section Header */}
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
                      lineHeight: 1.7,
                      fontSize: "0.875rem",
                      mb: 1.5,
                    }}
                  >
                    <strong style={{ color: theme.palette.text.primary }}>
                      Data Flow:
                    </strong>{" "}
                    EMS vitals → Kafka topic (ems.vitals.raw) → Stream processor
                    → AI prediction → Kafka topic (ai.prediction.output) →
                    WebSocket → Dashboard update
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      lineHeight: 1.7,
                      fontSize: "0.875rem",
                    }}
                  >
                    All updates happen in real-time with sub-second latency,
                    enabling medical professionals to see AI insights as soon as
                    new data arrives.
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* AI Explanation Generation */}
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
                    <Brain size={18} color={theme.palette.primary.main} />
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
                    AI Explanation Generation
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
                  The AI explanation summary is generated by{" "}
                  <strong style={{ color: theme.palette.text.primary }}>
                    Google Cloud Gemini
                  </strong>{" "}
                  (gemini-1.5-flash model) using prediction results from{" "}
                  <strong style={{ color: theme.palette.text.primary }}>
                    Vertex AI
                  </strong>
                  . The LLM receives structured data including probabilities,
                  risk factors, vitals, and time windows, then generates a
                  natural language explanation that contextualizes the AI's
                  assessment for medical professionals.
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
                      lineHeight: 1.7,
                      fontSize: "0.875rem",
                    }}
                  >
                    <strong style={{ color: theme.palette.text.primary }}>
                      Hackathon Highlight:
                    </strong>{" "}
                    This demonstrates real-time AI inference using Google Cloud
                    Vertex AI and Gemini API, with explanations generated
                    on-demand as new predictions arrive through the Kafka
                    stream.
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Hospital Routing */}
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
                    <MapPin size={18} color={theme.palette.primary.main} />
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
                    Hospital Routing Visualization
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
                  The routing component displays the AI-recommended destination
                  hospital based on:
                </Typography>
                <Stack spacing={1.5} sx={{ mb: 2 }}>
                  {[
                    {
                      label: "Hospital Type",
                      desc: "PRIMARY_CENTER or COMPREHENSIVE_CENTER (determined by LVO probability)",
                    },
                    {
                      label: "Travel Time",
                      desc: "Estimated minutes from current location to recommended hospital",
                    },
                    {
                      label: "Door-to-Needle Time",
                      desc: "Expected time from hospital arrival to treatment initiation",
                    },
                    {
                      label: "Total Time",
                      desc: "Combined travel + door-to-needle time for complete treatment timeline",
                    },
                  ].map((item, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        pl: 2,
                        borderLeft: `2px solid ${alpha(
                          theme.palette.primary.main,
                          0.3
                        )}`,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.primary,
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          mb: 0.5,
                        }}
                      >
                        {item.label}:
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

              {/* Recommended Actions */}
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
                    <CheckCircle size={18} color={theme.palette.success.main} />
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
                    Recommended Actions Processing
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
                  The AI generates a prioritized list of recommended actions
                  based on the case assessment. Actions are automatically
                  categorized by priority (CRITICAL, HIGH, NORMAL) and displayed
                  with color-coded cards to help medical professionals quickly
                  identify the most urgent interventions needed.
                </Typography>
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Kafka Topics */}
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
                    Confluent Cloud Kafka Topics
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
                  This panel consumes data from the{" "}
                  <strong style={{ color: theme.palette.text.primary }}>
                    ai.prediction.output
                  </strong>{" "}
                  Kafka topic, which contains AI-generated predictions,
                  explanations, and recommendations. The stream processor
                  aggregates data from multiple sources:
                </Typography>
                <Stack spacing={1.5}>
                  {[
                    {
                      topic: "ems.vitals.raw",
                      desc: "Real-time vital signs from EMS devices",
                    },
                    {
                      topic: "ems.fast.exam",
                      desc: "FAST stroke screening exam results",
                    },
                    {
                      topic: "hospital.capacity",
                      desc: "Current hospital capacity and capabilities",
                    },
                    {
                      topic: "ai.prediction.output",
                      desc: "AI predictions with explanations and recommendations",
                    },
                  ].map((item, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 2,
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
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.warning.main,
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          mb: 0.5,
                          fontFamily: "monospace",
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

              {/* WebSocket Updates */}
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
                        theme.palette.info.main,
                        isLight ? 0.1 : 0.15
                      ),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Activity size={18} color={theme.palette.info.main} />
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
                    Real-Time WebSocket Updates
                  </Typography>
                </Stack>
                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.text.secondary,
                    lineHeight: 1.7,
                    fontSize: "0.9375rem",
                  }}
                >
                  The FastAPI backend maintains WebSocket connections to push
                  updates to the dashboard as soon as new predictions arrive
                  from Kafka. This enables true real-time updates without
                  polling, ensuring medical professionals see the latest AI
                  insights immediately.
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}
