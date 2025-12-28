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
import { X, Monitor, Code, Database } from "lucide-react";
import { useThemeMode } from "@/theme/ThemeContext";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";

interface LiveVitalsInfoModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LiveVitalsInfoModal({
  open,
  onClose,
}: LiveVitalsInfoModalProps) {
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
                  <Monitor size={26} color={theme.palette.primary.main} />
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
                  Vital Signs Explained
                </Typography>
                <Stack spacing={2}>
                  {[
                    {
                      label: "Heart Rate (HR)",
                      normal: "60-100 bpm",
                      desc: "Normal range is 60-100 bpm. Elevated rates may indicate stress, pain, or cardiovascular complications. Very high or very low rates can indicate serious problems.",
                    },
                    {
                      label: "Blood Pressure (BP)",
                      normal: "~120/80 mmHg",
                      desc: "Normal is approximately 120/80 mmHg. In stroke, both very high and very low BP can worsen brain injury. Monitoring frequency is typically frequent and tailored to the situation—more frequent when patients receive clot-busting medications, have unstable BP, or have hemorrhagic stroke. The exact timing is determined by the medical team based on clinical guidelines and patient-specific factors.",
                    },
                    {
                      label: "SpO₂ (Oxygen Saturation)",
                      normal: "95-100%",
                      desc: "Normal is 95-100%. Values below 94% indicate hypoxia and may require oxygen supplementation. Low oxygen can worsen brain injury in stroke patients.",
                    },
                    {
                      label: "GCS (Glasgow Coma Scale)",
                      normal: "15 = fully alert",
                      desc: "Ranges from 3 (deeply unconscious) to 15 (fully alert). Lower scores indicate more severe neurological impairment. A GCS below 13 suggests significant brain dysfunction and may affect treatment eligibility.",
                    },
                  ].map((item, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        background: alpha(
                          theme.palette.background.paper,
                          isLight ? 0.5 : 0.4
                        ),
                        border: `1px solid ${alpha(
                          theme.palette.text.secondary,
                          isLight ? 0.1 : 0.15
                        )}`,
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1.5}
                        alignItems="baseline"
                        sx={{ mb: 1 }}
                      >
                        <Typography
                          variant="body1"
                          sx={{
                            color: theme.palette.text.primary,
                            fontWeight: 600,
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
                            fontStyle: "italic",
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
                          fontSize: "0.875rem",
                        }}
                      >
                        {item.desc}
                      </Typography>
                    </Box>
                  ))}
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
                    Streaming data, Confluent Cloud, and real-time updates
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
                        theme.palette.info.main,
                        isLight ? 0.1 : 0.15
                      ),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Database size={18} color={theme.palette.info.main} />
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
                    Real-Time Streaming from Kafka
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
                  Vital signs stream continuously from the{" "}
                  <code>ems.vitals.raw</code> Kafka topic in{" "}
                  <strong style={{ color: theme.palette.text.primary }}>
                    Confluent Cloud
                  </strong>
                  . The stream processor consumes these events, updates
                  in-memory state, and includes the latest vitals in AI
                  prediction requests. The dashboard receives updates via
                  WebSocket approximately every second.
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
                    EMS devices → <code>ems.vitals.raw</code> topic → Stream
                    processor (stateful join) → AI prediction includes latest
                    vitals → <code>ai.prediction.output</code> topic → API
                    server → WebSocket → Dashboard (real-time display with
                    color-coded status).
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
                  provides managed Apache Kafka infrastructure, enabling
                  high-throughput, low-latency streaming of medical device data.
                  The system handles thousands of messages per second with
                  guaranteed delivery and ordering.
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
                    Demonstrates real-time event streaming with Confluent Cloud,
                    showing how Kafka enables continuous monitoring and
                    immediate response to critical changes in patient vital
                    signs.
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
