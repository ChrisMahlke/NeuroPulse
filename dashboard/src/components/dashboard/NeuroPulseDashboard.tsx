"use client";

import {
  AppBar,
  Box,
  Chip,
  Container,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
  Paper,
  Tooltip,
  alpha,
  useTheme,
  Drawer,
  useMediaQuery,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import BoltIcon from "@mui/icons-material/Bolt";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import MapIcon from "@mui/icons-material/Map";
import TimelineIcon from "@mui/icons-material/Timeline";
import InfoIcon from "@mui/icons-material/Info";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import SettingsIcon from "@mui/icons-material/Settings";
import MenuIcon from "@mui/icons-material/Menu";
import PsychologyIcon from "@mui/icons-material/Psychology";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import FavoriteIcon from "@mui/icons-material/Favorite";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import EmergencyIcon from "@mui/icons-material/Emergency";
import PersonIcon from "@mui/icons-material/Person";

import React from "react";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { RiskCategory, selectCase } from "@/state/casesSlice";
import { useCases, useCaseDetail } from "@/hooks/useCases";
import { useWebSocket } from "@/hooks/useWebSocket";
import MedicalTermsModal from "@/components/MedicalTermsModal";
import ActiveCasesInfoModal from "@/components/ActiveCasesInfoModal";
import AIRiskAssessmentInfoModal from "@/components/AIRiskAssessmentInfoModal";
import LiveVitalsInfoModal from "@/components/LiveVitalsInfoModal";
import TimeSinceOnsetInfoModal from "@/components/TimeSinceOnsetInfoModal";
import DestinationInfoModal from "@/components/DestinationInfoModal";
import AIExplanationInfoModal from "@/components/AIExplanationInfoModal";
import RecommendedActionsInfoModal from "@/components/RecommendedActionsInfoModal";
import AIInsightsInfoModal from "@/components/AIInsightsInfoModal";
import SettingsModal from "@/components/SettingsModal";
import { DataFlowOverlay } from "@/components/DataFlowOverlay";
import { useThemeMode } from "@/theme/ThemeContext";
import { ProbabilityGauge } from "@/components/ProbabilityGauge";
import { VitalCard } from "@/components/VitalCard";
import { RiskFactorsChart } from "@/components/RiskFactorsChart";
import { TimeWindowVisualization } from "@/components/TimeWindowVisualization";
import { HospitalRoutingVisualization } from "@/components/HospitalRoutingVisualization";
import { ActionCard } from "@/components/ActionCard";
import { AIExplanationVisualizer } from "@/components/AIExplanationVisualizer";

const riskColorMap: Record<
  RiskCategory,
  "default" | "success" | "warning" | "error" | "info"
> = {
  LOW: "success",
  MODERATE: "warning",
  HIGH: "error",
  CRITICAL: "error",
};

const riskLabelMap: Record<RiskCategory, string> = {
  LOW: "Low",
  MODERATE: "Moderate",
  HIGH: "High",
  CRITICAL: "Critical",
};

function formatMinutesSinceOnset(mins: number | null): string {
  if (mins == null) return "Onset: unknown";
  if (mins < 60) return `Onset: ${mins} min ago`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  if (rem === 0) return `Onset: ${hours}h ago`;
  return `Onset: ${hours}h ${rem}m ago`;
}

function formatProbability(p: number): string {
  return `${Math.round(p * 100)}%`;
}

export function NeuroPulseDashboard() {
  const dispatch = useAppDispatch();
  const { cases, isLoading, error: casesError } = useCases();
  const selectedCaseId = useAppSelector((state) => state.cases.selectedCaseId);
  const { detail: caseDetail, error: detailError } =
    useCaseDetail(selectedCaseId);
  const { connected: wsConnected } = useWebSocket();
  const { mode } = useThemeMode();

  const theme = useTheme();
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [medicalInfoOpen, setMedicalInfoOpen] = React.useState(false);
  const [activeCasesInfoOpen, setActiveCasesInfoOpen] = React.useState(false);
  const [aiRiskAssessmentInfoOpen, setAiRiskAssessmentInfoOpen] =
    React.useState(false);
  const [liveVitalsInfoOpen, setLiveVitalsInfoOpen] = React.useState(false);
  const [timeSinceOnsetInfoOpen, setTimeSinceOnsetInfoOpen] =
    React.useState(false);
  const [destinationInfoOpen, setDestinationInfoOpen] = React.useState(false);
  const [aiExplanationInfoOpen, setAiExplanationInfoOpen] =
    React.useState(false);
  const [recommendedActionsInfoOpen, setRecommendedActionsInfoOpen] =
    React.useState(false);

  // Mobile panel navigation
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobilePanel, setMobilePanel] = React.useState<
    "active" | "selected" | "insights"
  >("active");
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);
  const [aiInsightsInfoOpen, setAiInsightsInfoOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [dataFlowOpen, setDataFlowOpen] = React.useState(false);

  // Check API health on mount
  React.useEffect(() => {
    import("@/services/api").then(({ checkHealth }) => {
      checkHealth().catch((error) => {
        setApiError(
          error instanceof Error
            ? error.message
            : "Cannot connect to API server. Make sure it's running on port 8000."
        );
      });
    });
  }, []);

  const selectedCase =
    cases.find((c) => c.caseId === selectedCaseId) ?? cases[0] ?? null;

  // Combine all errors
  const displayError = apiError || casesError || detailError;

  const isLight = mode === "light";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: theme.palette.background.default,
      }}
    >
      {/* Top AppBar */}
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ px: 3 }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{ flexGrow: 1 }}
          >
            {/* Mobile Hamburger Menu */}
            {isMobile && (
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={() => setMobileDrawerOpen(true)}
                sx={{ mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1,
                background: theme.palette.primary.main,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: isLight
                  ? "0 0 16px rgba(0, 119, 182, 0.4)"
                  : "0 0 22px rgba(56, 189, 248, 0.6)",
              }}
            >
              <BoltIcon
                sx={{
                  fontSize: 18,
                  color: isLight ? "#FFFFFF" : "#ECFEFF",
                }}
              />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, letterSpacing: "-0.03em" }}
              >
                NeuroPulse
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  display: { xs: "none", sm: "block" },
                }}
              >
                Real-time stroke triage & routing
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ display: { xs: "none", sm: "flex" } }}
            >
              <Chip
                icon={<RadioButtonCheckedIcon sx={{ fontSize: 14 }} />}
                label={
                  wsConnected
                    ? `Live: ${cases.length} cases`
                    : isLoading
                    ? "Loading..."
                    : `Streaming: ${cases.length} cases`
                }
                size="small"
                color={
                  wsConnected
                    ? "success"
                    : cases.length > 0
                    ? "info"
                    : "default"
                }
                variant="outlined"
                sx={{ borderRadius: 1 }}
              />
              {wsConnected && (
                <Tooltip title="4 active data streams: EMS Vitals, FAST Exams, Hospital Capacity, AI Predictions">
                  <Chip
                    label="4 streams"
                    size="small"
                    color="success"
                    variant="filled"
                    sx={{ borderRadius: 1, fontSize: "0.7rem" }}
                  />
                </Tooltip>
              )}
            </Stack>
            {/* Mobile: Show simplified status */}
            {isMobile && (
              <Chip
                icon={<RadioButtonCheckedIcon sx={{ fontSize: 14 }} />}
                label={
                  wsConnected
                    ? `${cases.length} cases`
                    : isLoading
                    ? "..."
                    : `${cases.length}`
                }
                size="small"
                color={
                  wsConnected
                    ? "success"
                    : cases.length > 0
                    ? "info"
                    : "default"
                }
                variant="outlined"
                sx={{ borderRadius: 1 }}
              />
            )}
            <Tooltip title="Medical Terms Explained">
              <IconButton
                size="small"
                edge="end"
                sx={{ color: "text.secondary" }}
                onClick={() => setMedicalInfoOpen(true)}
              >
                <HelpOutlineIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Data Flow & Streaming Architecture">
              <IconButton
                size="small"
                edge="end"
                sx={{ color: "text.secondary" }}
                onClick={() => setDataFlowOpen(true)}
              >
                <BoltIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton
                size="small"
                edge="end"
                sx={{ color: "text.secondary" }}
                onClick={() => setSettingsOpen(true)}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Main content */}
      <Container
        maxWidth="xl"
        sx={{
          flexGrow: 1,
          py: { xs: 1, sm: 1.5 },
          px: { xs: 1, sm: 2 },
          height: "calc(100vh - 64px)", // Full height minus AppBar
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {displayError && (
          <Box
            sx={{
              mb: 2,
              p: 2,
              borderRadius: 2,
              bgcolor: "error.dark",
              color: "error.contrastText",
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
              Connection Error
            </Typography>
            <Typography variant="body2">{displayError}</Typography>
            <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
              To fix: Run the API server with:{" "}
              <code>
                python -m stream-processing.neuro_pulse_streaming.api_server
              </code>
            </Typography>
          </Box>
        )}

        {/* Mobile Panel Switcher */}
        {isMobile && (
          <Box sx={{ mb: 2, display: { xs: "flex", md: "none" }, gap: 1 }}>
            <Chip
              icon={<PersonIcon sx={{ fontSize: 16 }} />}
              label="Active Cases"
              onClick={() => setMobilePanel("active")}
              color={mobilePanel === "active" ? "primary" : "default"}
              variant={mobilePanel === "active" ? "filled" : "outlined"}
              sx={{
                flex: 1,
                fontWeight: mobilePanel === "active" ? 700 : 500,
                transition: "all 0.2s ease",
                height: 40,
                fontSize: "0.875rem",
              }}
            />
            <Chip
              icon={<MonitorHeartIcon sx={{ fontSize: 16 }} />}
              label="Selected Case"
              onClick={() => setMobilePanel("selected")}
              color={mobilePanel === "selected" ? "primary" : "default"}
              variant={mobilePanel === "selected" ? "filled" : "outlined"}
              sx={{
                flex: 1,
                fontWeight: mobilePanel === "selected" ? 700 : 500,
                transition: "all 0.2s ease",
                height: 40,
                fontSize: "0.875rem",
              }}
            />
            <Chip
              icon={<PsychologyIcon sx={{ fontSize: 16 }} />}
              label="AI Insights"
              onClick={() => setMobilePanel("insights")}
              color={mobilePanel === "insights" ? "primary" : "default"}
              variant={mobilePanel === "insights" ? "filled" : "outlined"}
              sx={{
                flex: 1,
                fontWeight: mobilePanel === "insights" ? 700 : 500,
                transition: "all 0.2s ease",
                height: 40,
                fontSize: "0.875rem",
              }}
            />
          </Box>
        )}

        <Grid
          container
          spacing={{ xs: 1.5, sm: 2.5 }}
          sx={{ flexGrow: 1, height: "100%" }}
        >
          {/* Left: Active Cases */}
          <Grid
            size={{ xs: 12, md: 2.8 }}
            sx={{
              display: {
                xs: mobilePanel === "active" ? "block" : "none",
                md: "block",
              },
            }}
          >
            <Paper
              sx={{
                height: "100%",
                maxHeight: {
                  xs: "calc(100vh - 180px)",
                  md: "calc(100vh - 100px)",
                },
                p: { xs: 1, sm: 1.5 },
                display: "flex",
                flexDirection: "column",
                gap: 1,
                background: isLight
                  ? theme.palette.background.paper
                  : theme.palette.background.paper,
              }}
            >
              <Stack
                direction="row"
                alignItems="flex-start"
                justifyContent="space-between"
                sx={{ mb: 0.5 }}
              >
                <Stack spacing={0.3} sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography
                      variant="subtitle2"
                      sx={{ color: "text.secondary" }}
                    >
                      ACTIVE CASES
                    </Typography>
                    <Tooltip title="Learn more about this panel">
                      <IconButton
                        size="small"
                        onClick={() => setActiveCasesInfoOpen(true)}
                        sx={{
                          width: 20,
                          height: 20,
                          color: "text.secondary",
                          opacity: 0.7,
                          "&:hover": {
                            opacity: 1,
                            color: "primary.light",
                          },
                        }}
                      >
                        <InfoIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                  <Typography
                    variant="h6"
                    sx={{ letterSpacing: "-0.02em", whiteSpace: "nowrap" }}
                  >
                    Incoming EMS
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "0.75rem",
                      lineHeight: 1.4,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Real-time stroke case monitoring
                  </Typography>
                </Stack>
                <Chip
                  size="small"
                  label={`${cases.length} live`}
                  color={cases.length > 0 ? "success" : "default"}
                  variant="outlined"
                  sx={{ borderRadius: 1, ml: 1 }}
                />
              </Stack>

              <Divider sx={{ my: 1, borderColor: "rgba(148,163,184,0.3)" }} />

              <Box
                sx={{
                  flexGrow: 1,
                  overflowY: "auto",
                  pr: 0.5,
                  minHeight: 0, // Allow flexbox to shrink
                }}
              >
                <List disablePadding>
                  {cases.map((c) => {
                    const selected = c.caseId === selectedCaseId;
                    return (
                      <ListItemButton
                        key={c.caseId}
                        selected={selected}
                        onClick={() => dispatch(selectCase(c.caseId))}
                        sx={{
                          borderRadius: 0.75,
                          mb: 0.75,
                          alignItems: "flex-start",
                          px: { xs: 1, sm: 1.25 },
                          py: { xs: 1.25, sm: 1 },
                          minHeight: { xs: 56, sm: "auto" },
                          "&.Mui-selected": {
                            background: isLight
                              ? alpha(theme.palette.primary.main, 0.08)
                              : alpha(theme.palette.primary.main, 0.15),
                            border: `1px solid ${alpha(
                              theme.palette.primary.main,
                              isLight ? 0.2 : 0.3
                            )}`,
                          },
                          "&:hover": {
                            background: isLight
                              ? alpha(theme.palette.primary.main, 0.05)
                              : alpha(theme.palette.primary.main, 0.1),
                          },
                        }}
                      >
                        <ListItemText
                          primary={
                            <Stack
                              direction="row"
                              alignItems="center"
                              justifyContent="space-between"
                            >
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={0.75}
                              >
                                <PersonIcon
                                  sx={{
                                    fontSize: 18,
                                    color: "text.secondary",
                                    opacity: 0.7,
                                  }}
                                />
                                <Typography
                                  variant="subtitle1"
                                  sx={{ fontWeight: 500 }}
                                >
                                  {c.displayName}
                                </Typography>
                              </Stack>
                              <Chip
                                label={riskLabelMap[c.riskCategory]}
                                size="small"
                                color={riskColorMap[c.riskCategory]}
                                variant={selected ? "filled" : "outlined"}
                                sx={{ borderRadius: 1 }}
                              />
                            </Stack>
                          }
                          secondary={
                            <Box sx={{ mt: 0.5 }}>
                              <Typography
                                variant="body2"
                                sx={{ color: "text.secondary" }}
                              >
                                Stroke: {formatProbability(c.strokeProbability)}{" "}
                                · LVO: {formatProbability(c.lvoProbability)}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: "text.secondary" }}
                              >
                                {formatMinutesSinceOnset(c.minutesSinceOnset)}
                              </Typography>
                            </Box>
                          }
                          secondaryTypographyProps={{ component: "div" }}
                        />
                      </ListItemButton>
                    );
                  })}

                  {cases.length === 0 && (
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", mt: 2 }}
                    >
                      No active cases yet. Waiting for EMS streams…
                    </Typography>
                  )}
                </List>
              </Box>
            </Paper>
          </Grid>

          {/* Center: Selected Case Overview */}
          <Grid
            size={{ xs: 12, md: 4.4 }}
            sx={{
              display: {
                xs: mobilePanel === "selected" ? "block" : "none",
                md: "block",
              },
            }}
          >
            <Paper
              sx={{
                height: "100%",
                maxHeight: {
                  xs: "calc(100vh - 180px)",
                  md: "calc(100vh - 100px)",
                },
                p: { xs: 1, sm: 1.5 },
                display: "flex",
                flexDirection: "column",
                gap: 1,
                background: theme.palette.background.paper,
                overflowY: "auto",
                minHeight: 0,
              }}
            >
              <Stack
                direction="row"
                alignItems="flex-start"
                justifyContent="space-between"
                sx={{ mb: 0.5 }}
              >
                <Stack spacing={0.3} sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography
                      variant="subtitle2"
                      sx={{ color: "text.secondary" }}
                    >
                      SELECTED CASE
                    </Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {selectedCase && (
                      <PersonIcon
                        sx={{
                          fontSize: 20,
                          color: "text.secondary",
                          opacity: 0.7,
                        }}
                      />
                    )}
                    <Typography variant="h6" sx={{ letterSpacing: "-0.02em" }}>
                      {selectedCase
                        ? `${selectedCase.displayName} · ${selectedCase.caseId}`
                        : "No case selected"}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "0.75rem",
                      lineHeight: 1.4,
                    }}
                  >
                    Real-time vitals, risk assessment, and treatment windows
                  </Typography>
                </Stack>

                <Chip
                  icon={<TimelineIcon sx={{ fontSize: 16 }} />}
                  label="Timeline view"
                  size="small"
                  variant="outlined"
                  sx={{ borderRadius: 1, ml: 1 }}
                />
              </Stack>

              <Divider sx={{ my: 1, borderColor: "rgba(148,163,184,0.3)" }} />

              {selectedCase ? (
                <Stack spacing={1.25}>
                  {/* Risk Assessment and Live Vitals - Side by Side */}
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    sx={{ width: "100%" }}
                  >
                    {/* Risk Probability Gauges */}
                    <Box
                      sx={{
                        flex: { xs: 1, sm: 0.5 },
                        p: 2,
                        borderRadius: 2,
                        border: isLight
                          ? "1.5px solid rgba(148,163,184,0.25)"
                          : "1.5px solid rgba(148,163,184,0.3)",
                        background: isLight
                          ? "linear-gradient(135deg, #FFFFFF 0%, rgba(241,245,249,0.8) 100%)"
                          : `linear-gradient(135deg, ${
                              theme.palette.background.paper
                            } 0%, ${alpha(
                              theme.palette.background.paper,
                              0.8
                            )} 100%)`,
                        boxShadow: isLight
                          ? "0 2px 8px rgba(0, 0, 0, 0.04)"
                          : "0 2px 8px rgba(0, 0, 0, 0.2)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="center"
                        spacing={0.5}
                        sx={{ mb: 1.5, width: "100%" }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            display: "block",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            textAlign: "center",
                          }}
                        >
                          AI Risk Assessment
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => setAiRiskAssessmentInfoOpen(true)}
                          sx={{
                            width: 20,
                            height: 20,
                            p: 0.25,
                            color: "text.secondary",
                            opacity: 0.7,
                            "&:hover": {
                              opacity: 1,
                              color: "primary.main",
                            },
                          }}
                        >
                          <InfoIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Stack>
                      <Stack
                        direction="column"
                        spacing={2}
                        alignItems="center"
                        sx={{ width: "100%" }}
                      >
                        <Box sx={{ textAlign: "center" }}>
                          <ProbabilityGauge
                            value={selectedCase.strokeProbability}
                            label="Stroke Risk"
                            color={theme.palette.error.main}
                          />
                        </Box>
                        <Box sx={{ textAlign: "center" }}>
                          <ProbabilityGauge
                            value={selectedCase.lvoProbability}
                            label="LVO Risk"
                            color={theme.palette.warning.main}
                          />
                        </Box>
                      </Stack>
                    </Box>

                    {/* Live Vitals Display */}
                    {caseDetail?.currentVitals &&
                    ((caseDetail.currentVitals.heart_rate_bpm !== null &&
                      caseDetail.currentVitals.heart_rate_bpm !== undefined) ||
                      (caseDetail.currentVitals.systolic_bp_mmHg !== null &&
                        caseDetail.currentVitals.systolic_bp_mmHg !==
                          undefined)) ? (
                      <Box
                        sx={{
                          flex: { xs: 1, sm: 1.5 },
                          p: 2,
                          borderRadius: 2,
                          border: isLight
                            ? "1.5px solid rgba(56,189,248,0.3)"
                            : "1.5px solid rgba(56,189,248,0.25)",
                          background: isLight
                            ? "linear-gradient(135deg, #FFFFFF 0%, rgba(241,245,249,0.8) 100%)"
                            : `linear-gradient(135deg, ${
                                theme.palette.background.paper
                              } 0%, ${alpha(
                                theme.palette.background.paper,
                                0.8
                              )} 100%)`,
                          boxShadow: isLight
                            ? "0 2px 8px rgba(0, 0, 0, 0.04)"
                            : "0 2px 8px rgba(0, 0, 0, 0.2)",
                        }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1.5}
                          sx={{ mb: 2 }}
                        >
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: 1.5,
                              background: alpha(
                                theme.palette.info.main,
                                isLight ? 0.1 : 0.15
                              ),
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: `1px solid ${alpha(
                                theme.palette.info.main,
                                0.2
                              )}`,
                            }}
                          >
                            <MonitorHeartIcon
                              sx={{
                                fontSize: 18,
                                color: theme.palette.info.main,
                              }}
                            />
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              fontWeight: 700,
                              fontSize: "0.7rem",
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              flex: 1,
                            }}
                          >
                            Live Vitals
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => setLiveVitalsInfoOpen(true)}
                            sx={{
                              width: 20,
                              height: 20,
                              p: 0.25,
                              color: "text.secondary",
                              opacity: 0.7,
                              "&:hover": {
                                opacity: 1,
                                color: "info.main",
                              },
                            }}
                          >
                            <InfoIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                          <Chip
                            label="Streaming"
                            size="small"
                            color="success"
                            sx={{
                              height: 20,
                              fontSize: "0.65rem",
                              fontWeight: 600,
                              "& .MuiChip-label": { px: 1 },
                              boxShadow: `0 0 8px ${alpha(
                                theme.palette.success.main,
                                0.3
                              )}`,
                            }}
                          />
                        </Stack>

                        {/* Current Vitals Cards */}
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: {
                              xs: "repeat(2, 1fr)",
                              sm: "repeat(2, 1fr)",
                            },
                            gap: 1.5,
                            mb: 2,
                          }}
                        >
                          <VitalCard
                            label="Heart Rate"
                            value={
                              caseDetail.currentVitals?.heart_rate_bpm ?? 0
                            }
                            unit="bpm"
                            color={theme.palette.info.main}
                            normalRange="60-100 bpm"
                            vitalType="heartRate"
                          />
                          <VitalCard
                            label="Blood Pressure"
                            value={
                              caseDetail.currentVitals?.systolic_bp_mmHg
                                ? `${
                                    caseDetail.currentVitals.systolic_bp_mmHg
                                  }/${
                                    caseDetail.currentVitals
                                      .diastolic_bp_mmHg ?? "--"
                                  }`
                                : "--"
                            }
                            unit="mmHg"
                            color={theme.palette.success.main}
                            normalRange="~120/80 mmHg"
                            isBloodPressure={true}
                            vitalType="bp"
                          />
                          <VitalCard
                            label="SpO₂"
                            value={caseDetail.currentVitals?.spo2_pct ?? 0}
                            unit="%"
                            color={theme.palette.warning.main}
                            normalRange="95-100%"
                            vitalType="spo2"
                          />
                          <VitalCard
                            label="GCS"
                            value={caseDetail.currentVitals?.gcs_total ?? 15}
                            unit="/15"
                            color={theme.palette.primary.main}
                            normalRange="15 = fully alert"
                            vitalType="gcs"
                          />
                        </Box>

                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            mt: 1,
                            display: "block",
                            fontSize: "0.65rem",
                          }}
                        >
                          <code>ems.vitals.raw</code> • Real-time streaming
                          (~1s)
                        </Typography>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          flex: { xs: 1, sm: 1.5 },
                          p: 1.75,
                          borderRadius: 1,
                          border: isLight
                            ? "1px dashed rgba(148,163,184,0.4)"
                            : "1px dashed rgba(148,163,184,0.35)",
                          background: isLight
                            ? "#FFFFFF"
                            : theme.palette.background.paper,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary" }}
                        >
                          LIVE VITALS
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ mt: 0.5, color: "text.secondary" }}
                        >
                          Waiting for vitals data from{" "}
                          <code>ems.vitals.raw</code> stream...
                        </Typography>
                      </Box>
                    )}
                  </Stack>

                  {/* Time Window Visualization - Full Width Below */}
                  <Box sx={{ width: "100%" }}>
                    <TimeWindowVisualization
                      minutesSinceOnset={selectedCase.minutesSinceOnset}
                      timeWindowAssessment={
                        caseDetail?.timeWindowAssessment || null
                      }
                      onInfoClick={() => setTimeSinceOnsetInfoOpen(true)}
                    />
                  </Box>
                </Stack>
              ) : (
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mt: 2 }}
                >
                  No active cases. When EMS data is streaming, the selected
                  patient&apos;s timeline and vitals will appear here.
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Right: AI Insights & Map placeholder */}
          <Grid
            size={{ xs: 12, md: 4.8 }}
            sx={{
              display: {
                xs: mobilePanel === "insights" ? "block" : "none",
                md: "block",
              },
            }}
          >
            <Paper
              sx={{
                height: "100%",
                maxHeight: {
                  xs: "calc(100vh - 180px)",
                  md: "calc(100vh - 100px)",
                },
                p: { xs: 1, sm: 1.5 },
                display: "flex",
                flexDirection: "column",
                gap: 1,
                background: theme.palette.background.paper,
                overflowY: "auto",
                minHeight: 0,
              }}
            >
              <Stack
                direction="row"
                alignItems="flex-start"
                justifyContent="space-between"
                sx={{ mb: 0.5 }}
              >
                <Stack spacing={0.3} sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ color: "text.secondary" }}
                  >
                    AI INSIGHTS
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ letterSpacing: "-0.02em", whiteSpace: "nowrap" }}
                  >
                    Recommendation & rationale
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "0.75rem",
                      lineHeight: 1.4,
                      whiteSpace: "nowrap",
                    }}
                  >
                    AI explanations, routing recommendations, and action items
                  </Typography>
                </Stack>

                <Chip
                  icon={<MapIcon sx={{ fontSize: 16 }} />}
                  label="Hospital routing"
                  size="small"
                  variant="outlined"
                  sx={{ borderRadius: 1, ml: 1 }}
                />
              </Stack>

              <Divider sx={{ my: 1, borderColor: "rgba(148,163,184,0.3)" }} />

              <HospitalRoutingVisualization
                hospitalId={
                  caseDetail?.recommendedDestinationHospitalId || null
                }
                hospitalType={caseDetail?.recommendedDestinationType || null}
                travelMinutes={
                  caseDetail?.estimatedTravelMinToRecommended || null
                }
                doorToNeedleMinutes={
                  caseDetail?.estimatedAdditionalDoorToNeedleMinAtRecommended ||
                  null
                }
                onInfoClick={() => setDestinationInfoOpen(true)}
              />

              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  border: "1px solid rgba(148,163,184,0.4)",
                  background: theme.palette.background.paper,
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.25,
                  overflowY: "auto",
                  minHeight: 0,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <PsychologyIcon
                    sx={{ fontSize: 18, color: "primary.light" }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontWeight: 600,
                      fontSize: "0.7rem",
                    }}
                  >
                    AI EXPLANATION & RECOMMENDATIONS
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => setAiExplanationInfoOpen(true)}
                    sx={{
                      width: 20,
                      height: 20,
                      p: 0.25,
                      color: "text.secondary",
                      opacity: 0.7,
                      "&:hover": {
                        opacity: 1,
                        color: "primary.main",
                      },
                    }}
                  >
                    <InfoIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Stack>

                {caseDetail?.llmExplanationSummary ? (
                  <>
                    {/* AI Explanation with Visualized Data */}
                    <AIExplanationVisualizer
                      explanationText={caseDetail.llmExplanationSummary}
                    />

                    {/* Recommended Actions with Icons */}
                    {caseDetail.llmRecommendedActions && (
                      <Box>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                          sx={{ mb: 1 }}
                        >
                          <CheckCircleIcon
                            sx={{ fontSize: 16, color: "success.light" }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              fontWeight: 600,
                              fontSize: "0.7rem",
                            }}
                          >
                            RECOMMENDED ACTIONS
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => setRecommendedActionsInfoOpen(true)}
                            sx={{
                              width: 20,
                              height: 20,
                              p: 0.25,
                              color: "text.secondary",
                              opacity: 0.7,
                              "&:hover": {
                                opacity: 1,
                                color: "success.main",
                              },
                            }}
                          >
                            <InfoIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Stack>
                        <Stack spacing={1}>
                          {caseDetail.llmRecommendedActions
                            .split("\n")
                            .map((action, idx) => {
                              if (!action.trim() || action.trim() === "-")
                                return null;

                              // Extract action text (remove leading "- ")
                              const actionText = action
                                .replace(/^-\s*/, "")
                                .trim();
                              if (!actionText) return null;

                              // Determine icon, color, and priority based on action content
                              let icon = <CheckCircleIcon />;
                              let iconColor = theme.palette.success.main;
                              let priority: "critical" | "high" | "normal" =
                                "normal";

                              if (
                                actionText.toLowerCase().includes("maintain") ||
                                actionText.toLowerCase().includes("airway")
                              ) {
                                icon = <FavoriteIcon />;
                                iconColor = theme.palette.error.main;
                                priority = "critical";
                              } else if (
                                actionText.toLowerCase().includes("monitor") ||
                                actionText.toLowerCase().includes("vitals")
                              ) {
                                icon = <MonitorHeartIcon />;
                                iconColor = theme.palette.info.main;
                                priority = "high";
                              } else if (
                                actionText
                                  .toLowerCase()
                                  .includes("pre-notify") ||
                                actionText.toLowerCase().includes("notify")
                              ) {
                                icon = <EmergencyIcon />;
                                iconColor = theme.palette.warning.main;
                                priority = "critical";
                              } else if (
                                actionText.toLowerCase().includes("time") ||
                                actionText.toLowerCase().includes("window")
                              ) {
                                icon = <AccessTimeIcon />;
                                iconColor = theme.palette.warning.main;
                                priority = "high";
                              } else if (
                                actionText
                                  .toLowerCase()
                                  .includes("comprehensive") ||
                                actionText.toLowerCase().includes("primary") ||
                                actionText.toLowerCase().includes("hospital")
                              ) {
                                icon = <LocalHospitalIcon />;
                                iconColor = theme.palette.primary.main;
                                priority = "high";
                              } else if (
                                actionText.toLowerCase().includes("imaging") ||
                                actionText.toLowerCase().includes("evt")
                              ) {
                                icon = <TrendingUpIcon />;
                                iconColor = theme.palette.info.main;
                                priority = "high";
                              }

                              return (
                                <ActionCard
                                  key={idx}
                                  icon={icon}
                                  text={actionText}
                                  priority={priority}
                                  color={iconColor}
                                />
                              );
                            })}
                        </Stack>
                      </Box>
                    )}

                    {/* Risk Factors Visualization */}
                    {caseDetail.topRiskFactors &&
                      caseDetail.topRiskFactors.length > 0 && (
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 1,
                            border: isLight
                              ? "1px solid rgba(148,163,184,0.3)"
                              : "1px solid rgba(148,163,184,0.3)",
                            background: isLight
                              ? "rgba(241,245,249,0.8)"
                              : "rgba(15,23,42,0.6)",
                          }}
                        >
                          <RiskFactorsChart
                            factors={caseDetail.topRiskFactors}
                          />
                        </Box>
                      )}
                  </>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      py: 4,
                      color: "text.secondary",
                    }}
                  >
                    <PsychologyIcon
                      sx={{ fontSize: 48, mb: 1, opacity: 0.5 }}
                    />
                    <Typography variant="body2">
                      Waiting for AI explanation...
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Medical Terms Modal */}
      <MedicalTermsModal
        open={medicalInfoOpen}
        onClose={() => setMedicalInfoOpen(false)}
      />

      {/* Active Cases Info Modal */}
      <ActiveCasesInfoModal
        open={activeCasesInfoOpen}
        onClose={() => setActiveCasesInfoOpen(false)}
      />

      {/* AI Risk Assessment Info Modal */}
      <AIRiskAssessmentInfoModal
        open={aiRiskAssessmentInfoOpen}
        onClose={() => setAiRiskAssessmentInfoOpen(false)}
      />

      {/* Live Vitals Info Modal */}
      <LiveVitalsInfoModal
        open={liveVitalsInfoOpen}
        onClose={() => setLiveVitalsInfoOpen(false)}
      />

      {/* Time Since Onset Info Modal */}
      <TimeSinceOnsetInfoModal
        open={timeSinceOnsetInfoOpen}
        onClose={() => setTimeSinceOnsetInfoOpen(false)}
      />

      {/* Destination Info Modal */}
      <DestinationInfoModal
        open={destinationInfoOpen}
        onClose={() => setDestinationInfoOpen(false)}
      />

      {/* AI Explanation Info Modal */}
      <AIExplanationInfoModal
        open={aiExplanationInfoOpen}
        onClose={() => setAiExplanationInfoOpen(false)}
      />

      {/* Recommended Actions Info Modal */}
      <RecommendedActionsInfoModal
        open={recommendedActionsInfoOpen}
        onClose={() => setRecommendedActionsInfoOpen(false)}
      />

      {/* AI Insights Info Modal */}
      <AIInsightsInfoModal
        open={aiInsightsInfoOpen}
        onClose={() => setAiInsightsInfoOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Data Flow Overlay */}
      <DataFlowOverlay
        open={dataFlowOpen}
        onClose={() => setDataFlowOpen(false)}
        casesCount={cases.length}
      />

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            background: theme.palette.background.paper,
            borderRight: `1px solid ${alpha(
              theme.palette.divider,
              isLight ? 0.08 : 0.12
            )}`,
          },
        }}
      >
        <Box
          sx={{
            p: 2,
            borderBottom: `1px solid ${alpha(
              theme.palette.divider,
              isLight ? 0.08 : 0.12
            )}`,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                background: theme.palette.primary.main,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: isLight
                  ? "0 0 16px rgba(0, 119, 182, 0.4)"
                  : "0 0 22px rgba(56, 189, 248, 0.6)",
              }}
            >
              <BoltIcon
                sx={{
                  fontSize: 18,
                  color: isLight ? "#FFFFFF" : "#ECFEFF",
                }}
              />
            </Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, letterSpacing: "-0.03em" }}
            >
              NeuroPulse
            </Typography>
          </Stack>
        </Box>
        <List sx={{ pt: 2 }}>
          <ListItemButton
            selected={mobilePanel === "active"}
            onClick={() => {
              setMobilePanel("active");
              setMobileDrawerOpen(false);
            }}
            sx={{
              mx: 1,
              mb: 0.5,
              borderRadius: 1,
              "&.Mui-selected": {
                backgroundColor: alpha(
                  theme.palette.primary.main,
                  isLight ? 0.12 : 0.2
                ),
                "&:hover": {
                  backgroundColor: alpha(
                    theme.palette.primary.main,
                    isLight ? 0.16 : 0.24
                  ),
                },
              },
            }}
          >
            <PersonIcon
              sx={{
                mr: 2,
                fontSize: 20,
                color:
                  mobilePanel === "active"
                    ? theme.palette.primary.main
                    : "text.secondary",
              }}
            />
            <ListItemText
              primary="Active Cases"
              primaryTypographyProps={{
                fontWeight: mobilePanel === "active" ? 700 : 500,
                color:
                  mobilePanel === "active" ? "primary.main" : "text.primary",
              }}
              secondary="Incoming EMS cases"
              secondaryTypographyProps={{ variant: "caption" }}
            />
          </ListItemButton>
          <ListItemButton
            selected={mobilePanel === "selected"}
            onClick={() => {
              setMobilePanel("selected");
              setMobileDrawerOpen(false);
            }}
            sx={{
              mx: 1,
              mb: 0.5,
              borderRadius: 1,
              "&.Mui-selected": {
                backgroundColor: alpha(
                  theme.palette.primary.main,
                  isLight ? 0.12 : 0.2
                ),
                "&:hover": {
                  backgroundColor: alpha(
                    theme.palette.primary.main,
                    isLight ? 0.16 : 0.24
                  ),
                },
              },
            }}
          >
            <MonitorHeartIcon
              sx={{
                mr: 2,
                fontSize: 20,
                color:
                  mobilePanel === "selected"
                    ? theme.palette.primary.main
                    : "text.secondary",
              }}
            />
            <ListItemText
              primary="Selected Case"
              primaryTypographyProps={{
                fontWeight: mobilePanel === "selected" ? 700 : 500,
                color:
                  mobilePanel === "selected" ? "primary.main" : "text.primary",
              }}
              secondary="Patient details & vitals"
              secondaryTypographyProps={{ variant: "caption" }}
            />
          </ListItemButton>
          <ListItemButton
            selected={mobilePanel === "insights"}
            onClick={() => {
              setMobilePanel("insights");
              setMobileDrawerOpen(false);
            }}
            sx={{
              mx: 1,
              mb: 0.5,
              borderRadius: 1,
              "&.Mui-selected": {
                backgroundColor: alpha(
                  theme.palette.primary.main,
                  isLight ? 0.12 : 0.2
                ),
                "&:hover": {
                  backgroundColor: alpha(
                    theme.palette.primary.main,
                    isLight ? 0.16 : 0.24
                  ),
                },
              },
            }}
          >
            <PsychologyIcon
              sx={{
                mr: 2,
                fontSize: 20,
                color:
                  mobilePanel === "insights"
                    ? theme.palette.primary.main
                    : "text.secondary",
              }}
            />
            <ListItemText
              primary="AI Insights"
              primaryTypographyProps={{
                fontWeight: mobilePanel === "insights" ? 700 : 500,
                color:
                  mobilePanel === "insights" ? "primary.main" : "text.primary",
              }}
              secondary="Recommendations & routing"
              secondaryTypographyProps={{ variant: "caption" }}
            />
          </ListItemButton>
        </List>
        <Divider sx={{ my: 1 }} />
        <List>
          <ListItemButton
            onClick={() => {
              setMedicalInfoOpen(true);
              setMobileDrawerOpen(false);
            }}
            sx={{ mx: 1, mb: 0.5, borderRadius: 1 }}
          >
            <HelpOutlineIcon
              sx={{ mr: 2, fontSize: 20, color: "text.secondary" }}
            />
            <ListItemText
              primary="Medical Terms"
              secondary="Reference guide"
              secondaryTypographyProps={{ variant: "caption" }}
            />
          </ListItemButton>
          <ListItemButton
            onClick={() => {
              setDataFlowOpen(true);
              setMobileDrawerOpen(false);
            }}
            sx={{ mx: 1, mb: 0.5, borderRadius: 1 }}
          >
            <BoltIcon sx={{ mr: 2, fontSize: 20, color: "text.secondary" }} />
            <ListItemText
              primary="Data Flow"
              secondary="Streaming architecture"
              secondaryTypographyProps={{ variant: "caption" }}
            />
          </ListItemButton>
          <ListItemButton
            onClick={() => {
              setSettingsOpen(true);
              setMobileDrawerOpen(false);
            }}
            sx={{ mx: 1, mb: 0.5, borderRadius: 1 }}
          >
            <SettingsIcon
              sx={{ mr: 2, fontSize: 20, color: "text.secondary" }}
            />
            <ListItemText
              primary="Settings"
              secondary="Preferences"
              secondaryTypographyProps={{ variant: "caption" }}
            />
          </ListItemButton>
        </List>
      </Drawer>
    </Box>
  );
}
