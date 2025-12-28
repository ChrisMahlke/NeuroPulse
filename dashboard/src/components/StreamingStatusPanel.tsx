"use client";

import {
  Box,
  Paper,
  Typography,
  Stack,
  useTheme,
  alpha,
  LinearProgress,
  Tooltip,
  Divider,
  IconButton,
  Collapse,
  Chip,
} from "@mui/material";
import {
  Cloud,
  Activity,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Radio,
  ChevronRight,
  ChevronLeft,
  BarChart3,
  Database,
  Gauge,
} from "lucide-react";
import { useThemeMode } from "@/theme/ThemeContext";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

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
  consumer_lag: number | null;
  uptime_seconds: number;
  consumer_thread_alive: boolean;
  enhanced?: {
    streams: {
      [key: string]: {
        stream_name: string;
        messages_per_second: number;
        total_messages: number;
        uptime_seconds: number;
        latency_p50_ms: number;
        latency_p95_ms: number;
        latency_p99_ms: number;
        latency_avg_ms: number;
        throughput_kbps: number;
        has_latency_data: boolean;
      };
    };
    aggregate: {
      total_messages: number;
      total_messages_per_second: number;
      uptime_seconds: number;
      overall_latency_p50_ms: number;
      overall_latency_p95_ms: number;
      overall_latency_p99_ms: number;
      active_streams: number;
    };
  };
}

interface LatencyDataPoint {
  timestamp: string;
  p50: number;
  p95: number;
  p99: number;
}

interface ThroughputDataPoint {
  value: number;
}

export function StreamingStatusPanel() {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isLight = mode === "light";
  const [metrics, setMetrics] = useState<StreamingMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [latencyHistory, setLatencyHistory] = useState<LatencyDataPoint[]>([]);
  const [throughputHistory, setThroughputHistory] = useState<
    ThroughputDataPoint[]
  >([]);
  const [isOpen, setIsOpen] = useState(true); // Panel visibility state

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/streaming/metrics"
        );
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);

          // Track throughput history for sparkline
          if (data.messages_per_second !== undefined) {
            setThroughputHistory((prev) => {
              const newPoint: ThroughputDataPoint = {
                value: data.messages_per_second,
              };
              // Keep last 20 data points for sparkline
              const updated = [...prev, newPoint];
              return updated.slice(-20);
            });
          }

          // Track latency history for the graph
          if (
            data.enhanced?.aggregate?.overall_latency_p50_ms !== undefined &&
            data.enhanced.aggregate.overall_latency_p50_ms > 0
          ) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString("en-US", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });

            setLatencyHistory((prev) => {
              const newPoint: LatencyDataPoint = {
                timestamp: timeStr,
                p50: data.enhanced.aggregate.overall_latency_p50_ms,
                p95: data.enhanced.aggregate.overall_latency_p95_ms,
                p99: data.enhanced.aggregate.overall_latency_p99_ms,
              };

              // Keep last 30 data points (1 minute of history at 2s intervals)
              const updated = [...prev, newPoint];
              return updated.slice(-30);
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch streaming metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const formatLastMessage = (timeStr: string | null): string => {
    if (!timeStr) return "Never";
    try {
      const time = new Date(timeStr);
      const now = new Date();
      const diffMs = now.getTime() - time.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      if (diffSecs < 5) return "Just now";
      if (diffSecs < 60) return `${diffSecs}s`;
      const diffMins = Math.floor(diffSecs / 60);
      return `${diffMins}m`;
    } catch {
      return "?";
    }
  };

  const isActive =
    metrics?.kafka_connected &&
    metrics?.consumer_thread_alive &&
    (metrics?.messages_received ?? 0) > 0;
  const statusColor = isActive
    ? theme.palette.success.main
    : theme.palette.warning.main;

  return (
    <>
      {/* Toggle Button - Always visible */}
      <Tooltip
        title={isOpen ? "Hide Metrics" : "Show Metrics"}
        placement="left"
      >
        <IconButton
          onClick={() => setIsOpen(!isOpen)}
          sx={{
            position: "fixed",
            right: 16,
            top: 80,
            zIndex: 1001,
            width: 36,
            height: 36,
            background: isLight
              ? alpha(theme.palette.primary.main, 0.1)
              : alpha(theme.palette.primary.main, 0.2),
            backdropFilter: "blur(10px)",
            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
            "&:hover": {
              background: alpha(theme.palette.primary.main, 0.3),
            },
            transition: "all 0.3s ease",
          }}
        >
          {isOpen ? (
            <ChevronRight size={20} color={theme.palette.primary.main} />
          ) : (
            <ChevronLeft size={20} color={theme.palette.primary.main} />
          )}
        </IconButton>
      </Tooltip>

      {/* Panel */}
      <Collapse in={isOpen} orientation="horizontal">
        <Paper
          elevation={0}
          sx={{
            position: { xs: "relative", md: "fixed" },
            right: { xs: "auto", md: 60 },
            top: { xs: "auto", md: 80 },
            width: { xs: "100%", md: 320 },
            maxHeight: { xs: "none", md: "calc(100vh - 100px)" },
            overflowY: "auto",
            overflowX: "hidden",
            zIndex: 1000,
            mb: { xs: 2, md: 0 },
            background: isLight
              ? alpha(theme.palette.background.paper, 0.95)
              : alpha(theme.palette.background.paper, 0.98),
            backdropFilter: "blur(10px)",
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            borderRadius: 2,
            boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`,
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: alpha(theme.palette.text.secondary, 0.2),
              borderRadius: "3px",
            },
          }}
        >
          {/* Header - Compact */}
          <Box
            sx={{
              p: 1.5,
              pb: 1,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.info.main,
                0.05
              )} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 0.5 }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: statusColor,
                  boxShadow: `0 0 8px ${alpha(statusColor, 0.6)}`,
                  animation: isActive
                    ? "pulse 2s ease-in-out infinite"
                    : "none",
                  "@keyframes pulse": {
                    "0%, 100%": { opacity: 1 },
                    "50%": { opacity: 0.5 },
                  },
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: theme.palette.text.secondary,
                }}
              >
                Streaming
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Cloud size={14} color={theme.palette.text.secondary} />
              <Typography
                variant="caption"
                sx={{
                  fontSize: "0.65rem",
                  color: theme.palette.text.secondary,
                }}
              >
                Confluent Cloud
              </Typography>
            </Stack>
          </Box>

          {loading || !metrics ? (
            <Box sx={{ p: 2 }}>
              <LinearProgress sx={{ height: 2, borderRadius: 1 }} />
            </Box>
          ) : (
            <Box sx={{ p: 1.5 }}>
              {/* Status Indicator */}
              <Tooltip
                title={isActive ? "Streaming active" : "Streaming idle"}
                arrow
              >
                <Box
                  sx={{
                    mb: 1.5,
                    p: 1,
                    borderRadius: 1,
                    background: alpha(statusColor, isLight ? 0.1 : 0.15),
                    border: `1px solid ${alpha(statusColor, 0.3)}`,
                    textAlign: "center",
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="center"
                    spacing={0.5}
                  >
                    {isActive ? (
                      <Radio
                        size={12}
                        color={theme.palette.success.main}
                        style={{ fill: theme.palette.success.main }}
                      />
                    ) : (
                      <XCircle size={12} color={theme.palette.warning.main} />
                    )}
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.7rem",
                        color: statusColor,
                      }}
                    >
                      {isActive ? "LIVE" : "IDLE"}
                    </Typography>
                  </Stack>
                </Box>
              </Tooltip>

              {/* Key Metrics - Vertical Stack */}
              <Stack spacing={1.5}>
                {/* Messages/sec - Most Important with Sparkline */}
                <Tooltip
                  title="Messages per second throughput with trend"
                  arrow
                >
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      background: alpha(
                        theme.palette.info.main,
                        isLight ? 0.08 : 0.12
                      ),
                      border: `1px solid ${alpha(
                        theme.palette.info.main,
                        0.2
                      )}`,
                      transition: "all 0.2s",
                      "&:hover": {
                        background: alpha(
                          theme.palette.info.main,
                          isLight ? 0.12 : 0.18
                        ),
                        transform: "translateX(2px)",
                      },
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                      <TrendingUp size={14} color={theme.palette.info.main} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            fontSize: "0.65rem",
                            color: theme.palette.text.secondary,
                            mb: 0.25,
                          }}
                        >
                          Throughput
                        </Typography>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.5}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              fontSize: "0.85rem",
                              color: theme.palette.info.main,
                              lineHeight: 1.2,
                            }}
                          >
                            {metrics.messages_per_second.toFixed(1)}/s
                          </Typography>
                          {throughputHistory.length >= 2 ? (
                            <Box sx={{ width: 50, height: 20, ml: 0.5 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                  data={throughputHistory}
                                  margin={{
                                    top: 0,
                                    right: 0,
                                    left: 0,
                                    bottom: 0,
                                  }}
                                >
                                  <defs>
                                    <linearGradient
                                      id="sparklineGradient"
                                      x1="0"
                                      y1="0"
                                      x2="0"
                                      y2="1"
                                    >
                                      <stop
                                        offset="5%"
                                        stopColor={theme.palette.info.main}
                                        stopOpacity={0.5}
                                      />
                                      <stop
                                        offset="95%"
                                        stopColor={theme.palette.info.main}
                                        stopOpacity={0.1}
                                      />
                                    </linearGradient>
                                  </defs>
                                  <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke={theme.palette.info.main}
                                    strokeWidth={2}
                                    fill="url(#sparklineGradient)"
                                    dot={false}
                                    isAnimationActive={false}
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            </Box>
                          ) : (
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: "0.6rem",
                                color: alpha(theme.palette.text.secondary, 0.5),
                                fontStyle: "italic",
                              }}
                            >
                              ({throughputHistory.length}/2)
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    </Stack>
                  </Box>
                </Tooltip>

                {/* Last Message Time */}
                <Tooltip title="Time since last message received" arrow>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      background: alpha(
                        theme.palette.success.main,
                        isLight ? 0.08 : 0.12
                      ),
                      border: `1px solid ${alpha(
                        theme.palette.success.main,
                        0.2
                      )}`,
                      transition: "all 0.2s",
                      "&:hover": {
                        background: alpha(
                          theme.palette.success.main,
                          isLight ? 0.12 : 0.18
                        ),
                        transform: "translateX(2px)",
                      },
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                      <Clock size={14} color={theme.palette.success.main} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            fontSize: "0.65rem",
                            color: theme.palette.text.secondary,
                            mb: 0.25,
                          }}
                        >
                          Last Message
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            color: theme.palette.success.main,
                            lineHeight: 1.2,
                          }}
                        >
                          {formatLastMessage(metrics.last_message_time)} ago
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Tooltip>

                {/* Uptime */}
                <Tooltip title="System uptime" arrow>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      background: alpha(
                        theme.palette.warning.main,
                        isLight ? 0.08 : 0.12
                      ),
                      border: `1px solid ${alpha(
                        theme.palette.warning.main,
                        0.2
                      )}`,
                      transition: "all 0.2s",
                      "&:hover": {
                        background: alpha(
                          theme.palette.warning.main,
                          isLight ? 0.12 : 0.18
                        ),
                        transform: "translateX(2px)",
                      },
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                      <Clock size={14} color={theme.palette.warning.main} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            fontSize: "0.65rem",
                            color: theme.palette.text.secondary,
                            mb: 0.25,
                          }}
                        >
                          Uptime
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            color: theme.palette.warning.main,
                            lineHeight: 1.2,
                          }}
                        >
                          {formatUptime(metrics.uptime_seconds)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Tooltip>

                {/* Total Messages Processed */}
                <Tooltip title="Total messages processed since startup" arrow>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      background: alpha(
                        theme.palette.primary.main,
                        isLight ? 0.08 : 0.12
                      ),
                      border: `1px solid ${alpha(
                        theme.palette.primary.main,
                        0.2
                      )}`,
                      transition: "all 0.2s",
                      "&:hover": {
                        background: alpha(
                          theme.palette.primary.main,
                          isLight ? 0.12 : 0.18
                        ),
                        transform: "translateX(2px)",
                      },
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                      <Activity size={14} color={theme.palette.primary.main} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            fontSize: "0.65rem",
                            color: theme.palette.text.secondary,
                            mb: 0.25,
                          }}
                        >
                          Total Processed
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            color: theme.palette.primary.main,
                            lineHeight: 1.2,
                          }}
                        >
                          {metrics.messages_received.toLocaleString()}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Tooltip>

                {/* Data Throughput (KB/s) */}
                {metrics.enhanced?.streams &&
                  Object.values(metrics.enhanced.streams)[0]
                    ?.throughput_kbps !== undefined && (
                    <Tooltip
                      title="Data throughput in kilobytes per second"
                      arrow
                    >
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 1,
                          background: alpha(
                            theme.palette.info.main,
                            isLight ? 0.08 : 0.12
                          ),
                          border: `1px solid ${alpha(
                            theme.palette.info.main,
                            0.2
                          )}`,
                          transition: "all 0.2s",
                          "&:hover": {
                            background: alpha(
                              theme.palette.info.main,
                              isLight ? 0.12 : 0.18
                            ),
                            transform: "translateX(2px)",
                          },
                        }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.75}
                        >
                          <Database size={14} color={theme.palette.info.main} />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                display: "block",
                                fontSize: "0.65rem",
                                color: theme.palette.text.secondary,
                                mb: 0.25,
                              }}
                            >
                              Data Rate
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 700,
                                fontSize: "0.85rem",
                                color: theme.palette.info.main,
                                lineHeight: 1.2,
                              }}
                            >
                              {Object.values(
                                metrics.enhanced.streams
                              )[0].throughput_kbps.toFixed(2)}{" "}
                              KB/s
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    </Tooltip>
                  )}

                <Divider sx={{ my: 1 }} />

                {/* Latency Metrics - Show if available */}
                {metrics.enhanced?.aggregate?.overall_latency_p50_ms !==
                  undefined &&
                  metrics.enhanced.aggregate.overall_latency_p50_ms > 0 && (
                    <>
                      <Tooltip
                        title="End-to-end latency percentiles (P50/P95/P99)"
                        arrow
                      >
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 1,
                            background: alpha(
                              theme.palette.success.main,
                              isLight ? 0.08 : 0.12
                            ),
                            border: `1px solid ${alpha(
                              theme.palette.success.main,
                              0.2
                            )}`,
                            transition: "all 0.2s",
                            "&:hover": {
                              background: alpha(
                                theme.palette.success.main,
                                isLight ? 0.12 : 0.18
                              ),
                              transform: "translateX(2px)",
                            },
                          }}
                        >
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.75}
                          >
                            <Zap size={14} color={theme.palette.success.main} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  display: "block",
                                  fontSize: "0.65rem",
                                  color: theme.palette.text.secondary,
                                  mb: 0.25,
                                }}
                              >
                                Latency (P50/P95/P99)
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: "0.75rem",
                                  color: theme.palette.success.main,
                                  lineHeight: 1.2,
                                }}
                              >
                                {metrics.enhanced.aggregate.overall_latency_p50_ms.toFixed(
                                  0
                                )}
                                ms /{" "}
                                {metrics.enhanced.aggregate.overall_latency_p95_ms.toFixed(
                                  0
                                )}
                                ms /{" "}
                                {metrics.enhanced.aggregate.overall_latency_p99_ms.toFixed(
                                  0
                                )}
                                ms
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      </Tooltip>

                      {/* Real-Time Latency Graph */}
                      {latencyHistory.length > 1 && (
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 1,
                            background: alpha(
                              theme.palette.background.paper,
                              isLight ? 0.5 : 0.3
                            ),
                            border: `1px solid ${alpha(
                              theme.palette.success.main,
                              0.2
                            )}`,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              fontSize: "0.65rem",
                              color: theme.palette.text.secondary,
                              mb: 1,
                              fontWeight: 600,
                            }}
                          >
                            📊 Live Latency Trend (Last 60s)
                          </Typography>
                          <ResponsiveContainer width="100%" height={120}>
                            <AreaChart
                              data={latencyHistory}
                              margin={{
                                top: 5,
                                right: 5,
                                left: -20,
                                bottom: 5,
                              }}
                            >
                              <defs>
                                <linearGradient
                                  id="colorP50"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="5%"
                                    stopColor={theme.palette.success.main}
                                    stopOpacity={0.3}
                                  />
                                  <stop
                                    offset="95%"
                                    stopColor={theme.palette.success.main}
                                    stopOpacity={0}
                                  />
                                </linearGradient>
                                <linearGradient
                                  id="colorP95"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="5%"
                                    stopColor={theme.palette.warning.main}
                                    stopOpacity={0.3}
                                  />
                                  <stop
                                    offset="95%"
                                    stopColor={theme.palette.warning.main}
                                    stopOpacity={0}
                                  />
                                </linearGradient>
                                <linearGradient
                                  id="colorP99"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="5%"
                                    stopColor={theme.palette.error.main}
                                    stopOpacity={0.3}
                                  />
                                  <stop
                                    offset="95%"
                                    stopColor={theme.palette.error.main}
                                    stopOpacity={0}
                                  />
                                </linearGradient>
                              </defs>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke={alpha(
                                  theme.palette.text.secondary,
                                  0.1
                                )}
                                vertical={false}
                              />
                              <XAxis
                                dataKey="timestamp"
                                tick={{
                                  fontSize: 8,
                                  fill: theme.palette.text.secondary,
                                }}
                                tickLine={false}
                                axisLine={false}
                                interval="preserveStartEnd"
                                tickFormatter={(value) => {
                                  // Show only seconds
                                  const parts = value.split(":");
                                  return parts[2] + "s";
                                }}
                              />
                              <YAxis
                                tick={{
                                  fontSize: 9,
                                  fill: theme.palette.text.secondary,
                                }}
                                tickLine={false}
                                axisLine={false}
                                domain={[0, "auto"]}
                                label={{
                                  value: "ms",
                                  angle: -90,
                                  position: "insideLeft",
                                  style: {
                                    fontSize: 9,
                                    fill: theme.palette.text.secondary,
                                  },
                                }}
                              />
                              <RechartsTooltip
                                contentStyle={{
                                  backgroundColor: alpha(
                                    theme.palette.background.paper,
                                    0.95
                                  ),
                                  border: `1px solid ${alpha(
                                    theme.palette.text.secondary,
                                    0.2
                                  )}`,
                                  borderRadius: 4,
                                  fontSize: 10,
                                }}
                                labelStyle={{ fontSize: 9, fontWeight: 600 }}
                                formatter={(value: number) => [
                                  `${value.toFixed(0)}ms`,
                                  "",
                                ]}
                              />
                              <Area
                                type="monotone"
                                dataKey="p50"
                                stroke={theme.palette.success.main}
                                strokeWidth={2}
                                fill="url(#colorP50)"
                                name="P50"
                                dot={false}
                              />
                              <Area
                                type="monotone"
                                dataKey="p95"
                                stroke={theme.palette.warning.main}
                                strokeWidth={1.5}
                                fill="url(#colorP95)"
                                name="P95"
                                dot={false}
                              />
                              <Area
                                type="monotone"
                                dataKey="p99"
                                stroke={theme.palette.error.main}
                                strokeWidth={1}
                                fill="url(#colorP99)"
                                name="P99"
                                dot={false}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="center"
                            sx={{ mt: 0.5 }}
                          >
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={0.3}
                            >
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  background: theme.palette.success.main,
                                }}
                              />
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: "0.6rem",
                                  color: theme.palette.text.secondary,
                                }}
                              >
                                P50
                              </Typography>
                            </Stack>
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={0.3}
                            >
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  background: theme.palette.warning.main,
                                }}
                              />
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: "0.6rem",
                                  color: theme.palette.text.secondary,
                                }}
                              >
                                P95
                              </Typography>
                            </Stack>
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={0.3}
                            >
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  background: theme.palette.error.main,
                                }}
                              />
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: "0.6rem",
                                  color: theme.palette.text.secondary,
                                }}
                              >
                                P99
                              </Typography>
                            </Stack>
                          </Stack>
                        </Box>
                      )}
                    </>
                  )}
              </Stack>
            </Box>
          )}
        </Paper>
      </Collapse>
    </>
  );
}
