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
import { X, Clock, Code, Zap } from "lucide-react";
import { useThemeMode } from "@/theme/ThemeContext";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";

interface TimeSinceOnsetInfoModalProps {
  open: boolean;
  onClose: () => void;
}

export default function TimeSinceOnsetInfoModal({
  open,
  onClose,
}: TimeSinceOnsetInfoModalProps) {
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
                  <Clock size={26} color={theme.palette.primary.main} />
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
                        mb: 2,
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
                  Treatment Time Windows
                </Typography>
                <Stack spacing={2}>
                  <Box
                    sx={{
                      p: 2,
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
                      variant="body1"
                      sx={{
                        color: theme.palette.primary.main,
                        fontWeight: 700,
                        fontSize: "0.9375rem",
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
                        fontSize: "0.875rem",
                      }}
                    >
                      Intravenous tissue plasminogen activator is a clot-busting
                      medication most effective when given within 4.5 hours of
                      symptom onset. After this window, the risk of bleeding
                      complications often outweighs potential benefits.
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 2,
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
                      EVT Window (6-24 hours)
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        lineHeight: 1.6,
                        fontSize: "0.875rem",
                      }}
                    >
                      Endovascular therapy (mechanical thrombectomy) can be
                      performed in select patients up to 6-24 hours after
                      symptom onset, depending on imaging findings and patient
                      characteristics. This extended window is why comprehensive
                      stroke centers are critical for LVO cases.
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
                    Streaming data, Confluent Cloud, and time-critical
                    processing
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
                        theme.palette.warning.main,
                        isLight ? 0.1 : 0.15
                      ),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Zap size={18} color={theme.palette.warning.main} />
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
                    Time-Critical Stream Processing
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
                  The time since symptom onset is extracted from FAST exam
                  events in the <code>ems.fast.exam</code> Kafka topic. The
                  stream processor calculates elapsed time in real-time and
                  includes it in AI prediction requests. This time-sensitive
                  data directly influences hospital routing decisions and
                  treatment eligibility.
                </Typography>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    background: alpha(
                      theme.palette.warning.main,
                      isLight ? 0.08 : 0.12
                    ),
                    border: `1.5px solid ${alpha(
                      theme.palette.warning.main,
                      isLight ? 0.2 : 0.25
                    )}`,
                    borderLeft: `4px solid ${theme.palette.warning.main}`,
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
                    FAST exam → <code>ems.fast.exam</code> topic → Stream
                    processor extracts <code>symptom_onset_ts</code> →
                    Calculates <code>minutes_since_symptom_onset</code> →
                    Included in AI prediction request → Vertex AI uses timing
                    for risk assessment → Results published to{" "}
                    <code>ai.prediction.output</code> → Dashboard displays
                    countdown and treatment windows.
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
                        theme.palette.info.main,
                        isLight ? 0.1 : 0.15
                      ),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Code size={18} color={theme.palette.info.main} />
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
                  enables real-time event processing where every second counts.
                  The system processes time-sensitive medical data with
                  sub-second latency, ensuring that critical timing information
                  flows immediately from EMS to AI models to clinical decision
                  support.
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
                    Demonstrates time-critical event streaming with Confluent
                    Cloud, showing how Kafka enables real-time processing of
                    time-sensitive medical data where delays can impact patient
                    outcomes.
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
