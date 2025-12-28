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
import { X, MapPin, Code, Navigation } from "lucide-react";
import { useThemeMode } from "@/theme/ThemeContext";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";

interface DestinationInfoModalProps {
  open: boolean;
  onClose: () => void;
}

export default function DestinationInfoModal({
  open,
  onClose,
}: DestinationInfoModalProps) {
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
                  <MapPin size={26} color={theme.palette.primary.main} />
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
                  Time Metrics Explained
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
                      Travel Time
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        lineHeight: 1.6,
                        fontSize: "0.875rem",
                      }}
                    >
                      Estimated time from current location to the recommended
                      hospital. This is calculated based on real-time traffic
                      and distance data.
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
                      Door-to-Needle Time
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        lineHeight: 1.6,
                        fontSize: "0.875rem",
                      }}
                    >
                      Additional time needed at the hospital from arrival to
                      treatment initiation. This includes triage, imaging, and
                      preparation time.
                    </Typography>
                  </Box>
                  <Box
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
                      Total Time
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        lineHeight: 1.6,
                        fontSize: "0.875rem",
                      }}
                    >
                      Combined travel time plus door-to-needle time. This
                      represents the total time from now until treatment can
                      begin.
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
                    Streaming data, Confluent Cloud, and routing algorithms
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
                    <Navigation size={18} color={theme.palette.primary.main} />
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
                    Hospital Routing Algorithm
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
                  The AI routing algorithm considers multiple factors: stroke
                  probability, LVO probability, time since onset, hospital
                  capabilities, current capacity, and travel time. It optimizes
                  for the best patient outcome by balancing treatment
                  availability, time windows, and hospital resources.
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
                    AI prediction includes{" "}
                    <code>recommended_destination_hospital_id</code> → Stream
                    processor queries hospital capacity from{" "}
                    <code>hospital.capacity</code> topic → Calculates travel
                    time and door-to-needle estimates → Results published to{" "}
                    <code>ai.prediction.output</code> → Dashboard displays
                    routing visualization.
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
                  enables real-time hospital capacity updates and routing
                  decisions. The <code>hospital.capacity</code> topic streams
                  current hospital status, allowing the system to make dynamic
                  routing recommendations based on real-time availability.
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
                    Demonstrates real-time multi-stream processing with
                    Confluent Cloud, showing how Kafka enables dynamic hospital
                    routing based on live capacity data and AI predictions.
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
