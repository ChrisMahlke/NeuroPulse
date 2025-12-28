"use client";

import React from 'react';
import { AreaChart, Area, LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Box, Stack, Typography, useTheme, alpha, Paper } from '@mui/material';
import { useThemeMode } from '@/theme/ThemeContext';

interface VitalsDataPoint {
  time: string;
  heartRate: number;
  systolicBP: number;
  spo2: number;
  gcs: number;
}

interface VitalsChartProps {
  data: VitalsDataPoint[];
  height?: number;
}

// Enhanced sparkline with area fill
function MiniSparkline({ 
  data, 
  color, 
  height = 40,
  isDashed = false,
  label,
  unit,
  latestValue
}: { 
  data: number[]; 
  color: string; 
  height?: number;
  isDashed?: boolean;
  label: string;
  unit: string;
  latestValue: number;
}) {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isLight = mode === 'light';
  
  if (data.length < 2) return null;
  
  const chartData = data.map((value, idx) => ({ 
    value, 
    idx,
    time: idx 
  }));
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  // Calculate trend
  const trend = data.length >= 2 
    ? data[data.length - 1] > data[data.length - 2] 
      ? 'up' 
      : data[data.length - 1] < data[data.length - 2] 
      ? 'down' 
      : 'stable'
    : 'stable';
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      return (
        <Paper
          elevation={4}
          sx={{
            p: 1,
            borderRadius: 1,
            background: isLight ? '#fff' : theme.palette.background.paper,
            border: `1px solid ${alpha(color, 0.3)}`,
            boxShadow: `0 4px 12px ${alpha(color, 0.2)}`,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontSize: '0.65rem',
              fontWeight: 600,
              display: 'block',
              mb: 0.25,
            }}
          >
            {label}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: color,
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            {payload[0].value} {unit}
          </Typography>
        </Paper>
      );
    }
    return null;
  };
  
  return (
    <Box sx={{ position: 'relative', width: '100%', height }}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart 
          data={chartData} 
          margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
        >
          <defs>
            <linearGradient id={`gradient-${label.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#gradient-${label.replace(/\s+/g, '-')})`}
            dot={false}
            isAnimationActive={true}
            animationDuration={800}
            strokeDasharray={isDashed ? "4 4" : "0"}
          />
          <Tooltip content={<CustomTooltip />} />
        </AreaChart>
      </ResponsiveContainer>
      
      {/* Trend indicator */}
      <Box
        sx={{
          position: 'absolute',
          top: 2,
          right: 2,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: alpha(color, isLight ? 0.15 : 0.2),
          border: `1.5px solid ${alpha(color, 0.4)}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            width: 0,
            height: 0,
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderBottom: trend === 'up' 
              ? `6px solid ${color}`
              : trend === 'down'
              ? `6px solid ${alpha(color, 0.5)}`
              : 'none',
            borderTop: trend === 'down'
              ? `6px solid ${color}`
              : trend === 'up'
              ? `6px solid ${alpha(color, 0.5)}`
              : 'none',
            transform: trend === 'stable' ? 'none' : trend === 'down' ? 'rotate(180deg)' : 'none',
            ...(trend === 'stable' && {
              width: 6,
              height: 2,
              border: 'none',
              background: alpha(color, 0.6),
              borderRadius: 1,
            }),
          }}
        />
      </Box>
    </Box>
  );
}

export function VitalsChart({ data }: VitalsChartProps) {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isLight = mode === 'light';
  
  // Get last 10 data points
  const recentData = React.useMemo(() => data.slice(-10), [data]);
  
  if (recentData.length < 2) {
    return null;
  }

  // Extract values for each metric
  const heartRateValues = recentData.map(d => d.heartRate);
  const systolicBPValues = recentData.map(d => d.systolicBP);
  const spo2Values = recentData.map(d => d.spo2);
  const gcsValues = recentData.map(d => d.gcs);

  const getLatest = (values: number[]) => values[values.length - 1] || 0;
  
  const getStatusColor = (value: number, normalMin: number, normalMax: number, color: string) => {
    if (value < normalMin || value > normalMax) {
      return theme.palette.error.main;
    }
    return color;
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Stack spacing={1.75}>
        {/* Heart Rate */}
        <Box 
          sx={{ 
            p: 1.25,
            borderRadius: 1.5,
            background: alpha(theme.palette.info.main, isLight ? 0.04 : 0.08),
            border: `1px solid ${alpha(theme.palette.info.main, isLight ? 0.15 : 0.2)}`,
            transition: 'all 0.2s',
            '&:hover': {
              border: `1px solid ${alpha(theme.palette.info.main, isLight ? 0.25 : 0.3)}`,
              background: alpha(theme.palette.info.main, isLight ? 0.06 : 0.12),
            },
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary', 
                fontSize: '0.7rem', 
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Heart Rate
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: getStatusColor(getLatest(heartRateValues), 60, 100, theme.palette.info.main),
                fontSize: '0.85rem', 
                fontWeight: 800,
                fontFeatureSettings: '"tnum"',
              }}
            >
              {getLatest(heartRateValues)} <span style={{ opacity: 0.7, fontWeight: 500 }}>bpm</span>
            </Typography>
          </Stack>
          <Box sx={{ height: 40 }}>
            <MiniSparkline 
              data={heartRateValues} 
              color={theme.palette.info.main}
              label="Heart Rate"
              unit="bpm"
              latestValue={getLatest(heartRateValues)}
            />
          </Box>
        </Box>

        {/* Systolic BP */}
        <Box 
          sx={{ 
            p: 1.25,
            borderRadius: 1.5,
            background: alpha(theme.palette.success.main, isLight ? 0.04 : 0.08),
            border: `1px solid ${alpha(theme.palette.success.main, isLight ? 0.15 : 0.2)}`,
            transition: 'all 0.2s',
            '&:hover': {
              border: `1px solid ${alpha(theme.palette.success.main, isLight ? 0.25 : 0.3)}`,
              background: alpha(theme.palette.success.main, isLight ? 0.06 : 0.12),
            },
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary', 
                fontSize: '0.7rem', 
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Systolic BP
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: getStatusColor(getLatest(systolicBPValues), 90, 140, theme.palette.success.main),
                fontSize: '0.85rem', 
                fontWeight: 800,
                fontFeatureSettings: '"tnum"',
              }}
            >
              {getLatest(systolicBPValues)} <span style={{ opacity: 0.7, fontWeight: 500 }}>mmHg</span>
            </Typography>
          </Stack>
          <Box sx={{ height: 40 }}>
            <MiniSparkline 
              data={systolicBPValues} 
              color={theme.palette.success.main}
              label="Systolic BP"
              unit="mmHg"
              latestValue={getLatest(systolicBPValues)}
            />
          </Box>
        </Box>

        {/* SpO₂ */}
        <Box 
          sx={{ 
            p: 1.25,
            borderRadius: 1.5,
            background: alpha(theme.palette.warning.main, isLight ? 0.04 : 0.08),
            border: `1px solid ${alpha(theme.palette.warning.main, isLight ? 0.15 : 0.2)}`,
            transition: 'all 0.2s',
            '&:hover': {
              border: `1px solid ${alpha(theme.palette.warning.main, isLight ? 0.25 : 0.3)}`,
              background: alpha(theme.palette.warning.main, isLight ? 0.06 : 0.12),
            },
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary', 
                fontSize: '0.7rem', 
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              SpO₂
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: getStatusColor(getLatest(spo2Values), 94, 100, theme.palette.warning.main),
                fontSize: '0.85rem', 
                fontWeight: 800,
                fontFeatureSettings: '"tnum"',
              }}
            >
              {getLatest(spo2Values)} <span style={{ opacity: 0.7, fontWeight: 500 }}>%</span>
            </Typography>
          </Stack>
          <Box sx={{ height: 40 }}>
            <MiniSparkline 
              data={spo2Values} 
              color={theme.palette.warning.main}
              label="SpO₂"
              unit="%"
              latestValue={getLatest(spo2Values)}
            />
          </Box>
        </Box>

        {/* GCS */}
        <Box 
          sx={{ 
            p: 1.25,
            borderRadius: 1.5,
            background: alpha(theme.palette.primary.main, isLight ? 0.04 : 0.08),
            border: `1px solid ${alpha(theme.palette.primary.main, isLight ? 0.15 : 0.2)}`,
            transition: 'all 0.2s',
            '&:hover': {
              border: `1px solid ${alpha(theme.palette.primary.main, isLight ? 0.25 : 0.3)}`,
              background: alpha(theme.palette.primary.main, isLight ? 0.06 : 0.12),
            },
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary', 
                fontSize: '0.7rem', 
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              GCS
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: getStatusColor(getLatest(gcsValues), 13, 15, theme.palette.primary.main),
                fontSize: '0.85rem', 
                fontWeight: 800,
                fontFeatureSettings: '"tnum"',
              }}
            >
              {getLatest(gcsValues)} <span style={{ opacity: 0.7, fontWeight: 500 }}>/15</span>
            </Typography>
          </Stack>
          <Box sx={{ height: 40 }}>
            <MiniSparkline 
              data={gcsValues} 
              color={theme.palette.primary.main}
              isDashed
              label="GCS"
              unit="/15"
              latestValue={getLatest(gcsValues)}
            />
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}

