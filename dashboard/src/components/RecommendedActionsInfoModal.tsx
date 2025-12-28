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
import { X, CheckCircle, Code, Zap } from "lucide-react";
import { useThemeMode } from "@/theme/ThemeContext";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";

interface RecommendedActionsInfoModalProps {
  open: boolean;
  onClose: () => void;
}

export default function RecommendedActionsInfoModal({
  open,
  onClose,
}: RecommendedActionsInfoModalProps) {
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

      <Box sx={{ display: "flex", height: "100%", overflow: "hidden" }}>
        {/* Left Column - Medical Context */}
        <Box
          sx={{
            width: { xs: "100%", md: "50%" },
            minWidth: { md: "50%" },
            maxWidth: { md: "50%" },
            overflowY: "auto",
            overflowX: "hidden",
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.primary.main,
              isLight ? 0.04 : 0.08
            )} 0%, ${alpha(
              theme.palette.primary.main,
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
            <Box
              sx={{
                mb: 4,
                pb: 3,
                borderBottom: `2px solid ${alpha(
                  theme.palette.primary.main,
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
                      theme.palette.primary.main,
                      isLight ? 0.18 : 0.28
                    )} 0%, ${alpha(
                      theme.palette.primary.main,
                      isLight ? 0.12 : 0.22
                    )} 100%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: `0 4px 12px ${alpha(
                      theme.palette.primary.main,
                      isLight ? 0.2 : 0.3
                    )}`,
                  }}
                >
                  <CheckCircle size={26} color={theme.palette.primary.main} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="h4"
                    sx={{
                      color: theme.palette.primary.main,
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
                    }}
                  >
                    Medical context and clinical significance
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Stack spacing={3.5}>
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
                  How Actions Are Generated
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.text.secondary,
                    lineHeight: 1.7,
                    fontSize: "0.9375rem",
                    mb: 2,
                  }}
                >
                  Recommended actions are generated by Google Cloud Gemini based
                  on the AI's risk assessment, patient condition, and treatment
                  windows. The LLM analyzes the prediction results and generates
                  a prioritized list of interventions tailored to the specific
                  case.
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
                      lineHeight: 1.6,
                      fontSize: "0.875rem",
                    }}
                  >
                    Actions are automatically prioritized based on clinical
                    urgency, with critical life-saving interventions appearing
                    first, followed by important monitoring tasks, and then
                    standard care protocols.
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 2 }}>
                <MedicalDisclaimer />
              </Box>
            </Stack>
          </Box>
        </Box>

        {/* Right Column - Technical Details */}
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
                    }}
                  >
                    Streaming data, Confluent Cloud, Vertex AI, and Gemini
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Stack spacing={3.5}>
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
                    Action Generation Pipeline
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
                  Recommended actions are generated by{" "}
                  <strong style={{ color: theme.palette.text.primary }}>
                    Google Cloud Gemini
                  </strong>{" "}
                  (gemini-1.5-flash) as part of the AI explanation generation
                  process. The LLM receives the same structured prediction data
                  and generates both the explanation summary and a prioritized
                  list of recommended actions.
                </Typography>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    background: alpha(
                      theme.palette.info.main,
                      isLight ? 0.08 : 0.12
                    ),
                    border: `1.5px solid ${alpha(
                      theme.palette.info.main,
                      isLight ? 0.2 : 0.25
                    )}`,
                    borderLeft: `4px solid ${theme.palette.info.main}`,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      lineHeight: 1.6,
                      fontSize: "0.875rem",
                    }}
                  >
                    <strong style={{ color: theme.palette.text.primary }}>
                      Data Flow:
                    </strong>{" "}
                    Vertex AI generates prediction → Stream processor formats
                    data → Gemini API receives prompt with prediction results →
                    LLM generates explanation + recommended actions → Results
                    published to <code>ai.prediction.output</code> topic →
                    Dashboard parses and displays actions with priority-based
                    color coding.
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 1 }} />

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
                    Confluent Cloud & Apache Kafka
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
                  <strong style={{ color: theme.palette.text.primary }}>
                    Confluent Cloud
                  </strong>{" "}
                  streams the complete AI prediction results including
                  recommended actions through the{" "}
                  <code>ai.prediction.output</code> topic. The dashboard
                  receives these actions in real-time and automatically
                  categorizes them by priority based on keywords and content
                  analysis.
                </Typography>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    background: alpha(
                      theme.palette.success.main,
                      isLight ? 0.08 : 0.12
                    ),
                    border: `1.5px solid ${alpha(
                      theme.palette.success.main,
                      isLight ? 0.2 : 0.25
                    )}`,
                    borderLeft: `4px solid ${theme.palette.success.main}`,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      lineHeight: 1.6,
                      fontSize: "0.875rem",
                    }}
                  >
                    <strong style={{ color: theme.palette.text.primary }}>
                      Hackathon Highlight:
                    </strong>{" "}
                    Demonstrates real-time AI-generated action recommendations
                    streamed through Confluent Cloud, showing how LLM-generated
                    clinical guidance can be delivered instantly to medical
                    professionals via Kafka topics.
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}
