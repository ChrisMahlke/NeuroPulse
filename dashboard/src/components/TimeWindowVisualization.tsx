"use client";

import { Box, Typography, LinearProgress, useTheme, Stack, Chip, IconButton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import TimerIcon from '@mui/icons-material/Timer';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import { useThemeMode } from '@/theme/ThemeContext';

interface TimeWindowVisualizationProps {
  minutesSinceOnset: number | null;
  timeWindowAssessment: string | null;
  onInfoClick?: () => void;
}

export function TimeWindowVisualization({ minutesSinceOnset, timeWindowAssessment, onInfoClick }: TimeWindowVisualizationProps) {
  if (minutesSinceOnset === null) return null;

  const theme = useTheme();
  const { mode } = useThemeMode();
  const isLight = mode === 'light';

  // Treatment windows
  const tpaWindow = 270; // 4.5 hours
  const evtWindow = 360; // 6 hours

  // Calculate time REMAINING (what matters most - countdown, not elapsed)
  const tpaTimeRemaining = Math.max(0, tpaWindow - minutesSinceOnset);
  const evtTimeRemaining = Math.max(0, evtWindow - minutesSinceOnset);
  
  // Calculate percentage of window used (for progress bars)
  const tpaProgress = Math.min((minutesSinceOnset / tpaWindow) * 100, 100);
  const evtProgress = Math.min((minutesSinceOnset / evtWindow) * 100, 100);

  // Status determination
  const isWithinTpaWindow = minutesSinceOnset <= tpaWindow;
  const isWithinEvtWindow = minutesSinceOnset <= evtWindow;
  const isTpaExpired = minutesSinceOnset > tpaWindow;
  const isEvtExpired = minutesSinceOnset > evtWindow;
  
  // Urgency calculation (0-100, where 100 is most urgent)
  const tpaUrgency = isWithinTpaWindow 
    ? Math.max(0, 100 - (tpaTimeRemaining / tpaWindow) * 100)
    : 100;

  // Format time for display - prioritize clarity
  const formatTimeRemaining = (mins: number) => {
    if (mins === 0) return '0m';
    if (mins < 60) return `${Math.round(mins)}m`;
    const hours = Math.floor(mins / 60);
    const minutes = Math.round(mins % 60);
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const formatTimeElapsed = (mins: number) => {
    if (mins < 60) return `${Math.round(mins)}m`;
    const hours = Math.floor(mins / 60);
    const minutes = Math.round(mins % 60);
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  // Determine primary status and color
  const getPrimaryStatus = () => {
    if (isTpaExpired && isEvtExpired) {
      return { 
        label: 'Critical', 
        color: theme.palette.error.main,
        icon: <ErrorIcon sx={{ fontSize: 18 }} />,
        bg: alpha(theme.palette.error.main, isLight ? 0.1 : 0.15)
      };
    }
    if (isTpaExpired && !isEvtExpired) {
      return { 
        label: 'tPA Expired', 
        color: theme.palette.warning.main,
        icon: <WarningIcon sx={{ fontSize: 18 }} />,
        bg: alpha(theme.palette.warning.main, isLight ? 0.1 : 0.15)
      };
    }
    if (tpaTimeRemaining < 60) {
      return { 
        label: 'Urgent', 
        color: theme.palette.error.main,
        icon: <WarningIcon sx={{ fontSize: 18 }} />,
        bg: alpha(theme.palette.error.main, isLight ? 0.08 : 0.12)
      };
    }
    return { 
      label: 'Optimal', 
      color: theme.palette.success.main,
      icon: <CheckCircleIcon sx={{ fontSize: 18 }} />,
      bg: alpha(theme.palette.success.main, isLight ? 0.08 : 0.12)
    };
  };

  const primaryStatus = getPrimaryStatus();

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 2,
        background: isLight 
          ? `linear-gradient(135deg, ${primaryStatus.bg} 0%, ${alpha(primaryStatus.color, 0.03)} 100%)`
          : `linear-gradient(135deg, ${primaryStatus.bg} 0%, ${alpha(primaryStatus.color, 0.08)} 100%)`,
        border: `1.5px solid ${alpha(primaryStatus.color, isLight ? 0.25 : 0.3)}`,
        boxShadow: isTpaExpired 
          ? `0 4px 12px ${alpha(theme.palette.error.main, isLight ? 0.15 : 0.25)}`
          : `0 2px 8px ${alpha(primaryStatus.color, isLight ? 0.1 : 0.15)}`,
        transition: 'all 0.3s ease',
      }}
    >
      {/* Header: Clear status and elapsed time */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${alpha(primaryStatus.color, 0.2)} 0%, ${alpha(primaryStatus.color, 0.1)} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1.5px solid ${alpha(primaryStatus.color, 0.3)}`,
            }}
          >
            <TimerIcon sx={{ fontSize: 22, color: primaryStatus.color }} />
          </Box>
          <Box>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'text.secondary', 
                  fontWeight: 700, 
                  fontSize: '0.65rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  display: 'block',
                }}
              >
                Time Since Onset
              </Typography>
              {onInfoClick && (
                <IconButton
                  size="small"
                  onClick={onInfoClick}
                  sx={{
                    width: 20,
                    height: 20,
                    p: 0.25,
                    color: 'text.secondary',
                    opacity: 0.7,
                    "&:hover": {
                      opacity: 1,
                      color: primaryStatus.color,
                    },
                  }}
                >
                  <InfoIcon sx={{ fontSize: 14 }} />
                </IconButton>
              )}
            </Stack>
            <Typography
              variant="h5"
              sx={{
                color: primaryStatus.color,
                fontWeight: 800,
                fontSize: '1.25rem',
                letterSpacing: '-0.02em',
                lineHeight: 1,
                fontFeatureSettings: '"tnum"',
              }}
            >
              {formatTimeElapsed(minutesSinceOnset)}
            </Typography>
          </Box>
        </Stack>
        
        {/* Status badge */}
        <Chip
          icon={primaryStatus.icon}
          label={primaryStatus.label}
          sx={{
            height: 32,
            px: 1,
            background: alpha(primaryStatus.color, isLight ? 0.12 : 0.18),
            border: `1px solid ${alpha(primaryStatus.color, 0.3)}`,
            color: primaryStatus.color,
            fontWeight: 700,
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            '& .MuiChip-icon': {
              color: primaryStatus.color,
            },
          }}
        />
      </Stack>

      {/* Primary Action: Countdown to tPA window closure */}
      <Box
        sx={{
          p: 2,
          borderRadius: 1.5,
          mb: 2,
          background: isWithinTpaWindow
            ? (tpaTimeRemaining < 60 
                ? alpha(theme.palette.error.main, isLight ? 0.1 : 0.15)
                : alpha(theme.palette.success.main, isLight ? 0.08 : 0.12))
            : alpha(theme.palette.error.main, isLight ? 0.1 : 0.15),
          border: `1.5px solid ${alpha(
            isWithinTpaWindow 
              ? (tpaTimeRemaining < 60 ? theme.palette.error.main : theme.palette.success.main)
              : theme.palette.error.main,
            isLight ? 0.3 : 0.35
          )}`,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Box>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary', 
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                display: 'block',
                mb: 0.5,
              }}
            >
              IV tPA Window
            </Typography>
            {isWithinTpaWindow ? (
              <Typography
                variant="h4"
                sx={{
                  color: tpaTimeRemaining < 60 ? theme.palette.error.main : theme.palette.success.main,
                  fontWeight: 800,
                  fontSize: '1.75rem',
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                  fontFeatureSettings: '"tnum"',
                }}
              >
                {formatTimeRemaining(tpaTimeRemaining)}
              </Typography>
            ) : (
              <Typography
                variant="h4"
                sx={{
                  color: theme.palette.error.main,
                  fontWeight: 800,
                  fontSize: '1.5rem',
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                }}
              >
                Window Closed
              </Typography>
            )}
          </Box>
          {isWithinTpaWindow && (
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${alpha(
                  tpaTimeRemaining < 60 ? theme.palette.error.main : theme.palette.success.main,
                  0.15
                )} 0%, ${alpha(
                  tpaTimeRemaining < 60 ? theme.palette.error.main : theme.palette.success.main,
                  0.08
                )} 100%)`,
                border: `2px solid ${alpha(
                  tpaTimeRemaining < 60 ? theme.palette.error.main : theme.palette.success.main,
                  0.3
                )}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {tpaTimeRemaining < 60 ? (
                <WarningIcon sx={{ fontSize: 28, color: theme.palette.error.main }} />
              ) : (
                <CheckCircleIcon sx={{ fontSize: 28, color: theme.palette.success.main }} />
              )}
            </Box>
          )}
        </Stack>
        
        {/* Progress bar showing window usage */}
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
              {isWithinTpaWindow ? 'Window closing' : 'Window expired'}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: isWithinTpaWindow 
                  ? (tpaTimeRemaining < 60 ? theme.palette.error.main : theme.palette.success.main)
                  : theme.palette.error.main,
                fontSize: '0.65rem',
                fontWeight: 700,
              }}
            >
              {Math.round(tpaProgress)}% used
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={Math.min(tpaProgress, 100)}
            sx={{
              height: 10,
              borderRadius: 1.5,
              backgroundColor: alpha('#64748B', 0.15),
              '& .MuiLinearProgress-bar': {
                backgroundColor: isWithinTpaWindow 
                  ? (tpaTimeRemaining < 60 
                      ? theme.palette.error.main
                      : tpaUrgency > 80 
                      ? `linear-gradient(90deg, ${theme.palette.warning.main} 0%, ${theme.palette.error.main} 100%)`
                      : theme.palette.success.main)
                  : theme.palette.error.main,
                borderRadius: 1.5,
                transition: 'background-color 0.3s',
              },
            }}
          />
        </Box>
      </Box>

      {/* Secondary: EVT Window */}
      <Box
        sx={{
          p: 1.5,
          borderRadius: 1.5,
          background: isWithinEvtWindow
            ? alpha(theme.palette.success.main, isLight ? 0.06 : 0.1)
            : alpha(theme.palette.warning.main, isLight ? 0.06 : 0.1),
          border: `1px solid ${alpha(
            isWithinEvtWindow ? theme.palette.success.main : theme.palette.warning.main,
            isLight ? 0.2 : 0.25
          )}`,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: isWithinEvtWindow ? theme.palette.success.main : theme.palette.warning.main,
                boxShadow: `0 0 6px ${alpha(
                  isWithinEvtWindow ? theme.palette.success.main : theme.palette.warning.main,
                  0.6
                )}`,
              }}
            />
            <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 700, fontSize: '0.8rem' }}>
              EVT Window
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
              (6-24h)
            </Typography>
          </Stack>
          {isWithinEvtWindow ? (
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.success.main,
                fontWeight: 800,
                fontSize: '0.85rem',
                fontFeatureSettings: '"tnum"',
              }}
            >
              {formatTimeRemaining(evtTimeRemaining)} left
            </Typography>
          ) : (
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.warning.main,
                fontWeight: 800,
                fontSize: '0.85rem',
              }}
            >
              Extended
            </Typography>
          )}
        </Stack>
        <LinearProgress
          variant="determinate"
          value={Math.min(evtProgress, 100)}
          sx={{
            height: 6,
            borderRadius: 1,
            backgroundColor: alpha('#64748B', 0.15),
            '& .MuiLinearProgress-bar': {
              backgroundColor: isWithinEvtWindow ? theme.palette.success.main : theme.palette.warning.main,
              borderRadius: 1,
            },
          }}
        />
      </Box>

      {timeWindowAssessment && (
        <Box
          sx={{
            mt: 2,
            pt: 1.5,
            borderTop: `1px solid ${alpha(theme.palette.text.secondary, isLight ? 0.15 : 0.2)}`,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '0.7rem',
              lineHeight: 1.5,
            }}
          >
            {timeWindowAssessment}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

