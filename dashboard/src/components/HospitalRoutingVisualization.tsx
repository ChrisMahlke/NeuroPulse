"use client";

import { Box, Typography, Stack, useTheme, IconButton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import NavigationIcon from '@mui/icons-material/Navigation';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import { useThemeMode } from '@/theme/ThemeContext';

interface HospitalRoutingVisualizationProps {
  hospitalId: string | null;
  hospitalType: string | null;
  travelMinutes: number | null;
  doorToNeedleMinutes: number | null;
  onInfoClick?: () => void;
}

export function HospitalRoutingVisualization({
  hospitalId,
  hospitalType,
  travelMinutes,
  doorToNeedleMinutes,
  onInfoClick,
}: HospitalRoutingVisualizationProps) {
  if (!hospitalId) return null;

  const theme = useTheme();
  const { mode } = useThemeMode();
  const isLight = mode === 'light';

  const isComprehensive = hospitalType === 'COMPREHENSIVE_CENTER';
  const totalTime = travelMinutes && doorToNeedleMinutes ? travelMinutes + doorToNeedleMinutes : null;

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 1,
        background: isComprehensive
          ? alpha(theme.palette.primary.main, isLight ? 0.06 : 0.1)
          : alpha(theme.palette.info.main, isLight ? 0.06 : 0.1),
        border: `1px solid ${isComprehensive ? alpha(theme.palette.primary.main, isLight ? 0.2 : 0.25) : alpha(theme.palette.info.main, isLight ? 0.2 : 0.25)}`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <LocalHospitalIcon
          sx={{
            fontSize: 20,
            color: isComprehensive ? theme.palette.primary.main : theme.palette.info.main,
          }}
        />
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.7rem' }}>
          DESTINATION
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
                color: isComprehensive ? theme.palette.primary.main : theme.palette.info.main,
              },
            }}
          >
            <InfoIcon sx={{ fontSize: 14 }} />
          </IconButton>
        )}
        {isComprehensive && (
          <Box
            sx={{
              ml: 'auto',
              px: 1,
              py: 0.25,
              borderRadius: 0.5,
              background: alpha(theme.palette.primary.main, isLight ? 0.1 : 0.15),
              border: `1px solid ${alpha(theme.palette.primary.main, isLight ? 0.25 : 0.3)}`,
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: theme.palette.primary.main, fontWeight: 700, fontSize: '0.65rem' }}
            >
              ADVANCED
            </Typography>
          </Box>
        )}
      </Box>

      {/* Horizontal row: Hospital card + Time cards */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: 1,
          alignItems: 'stretch',
        }}
      >
        {/* Hospital Name/Type Card */}
        <Box
          sx={{
            flex: '0 0 auto',
            minWidth: '140px',
            p: 1.25,
            borderRadius: 0.75,
            background: alpha(theme.palette.background.paper, isLight ? 0.7 : 0.6),
            border: `1px solid ${alpha(isComprehensive ? theme.palette.primary.main : theme.palette.info.main, isLight ? 0.15 : 0.2)}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: isComprehensive ? theme.palette.primary.main : theme.palette.info.main,
              fontWeight: 700,
              mb: 0.25,
              fontSize: '1.1rem',
            }}
          >
            {hospitalId}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '0.8rem',
              textTransform: 'capitalize',
            }}
          >
            {hospitalType?.toLowerCase().replace('_', ' ')}
          </Typography>
        </Box>

        {/* Time Cards - Horizontal row */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            gap: 1,
            flex: 1,
            justifyContent: 'flex-end',
          }}
        >
          {travelMinutes !== null && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 1,
                borderRadius: 0.75,
                background: alpha(theme.palette.background.paper, isLight ? 0.5 : 0.4),
                textAlign: 'center',
                minWidth: '70px',
              }}
            >
              <NavigationIcon sx={{ fontSize: 16, color: theme.palette.info.main, mb: 0.5 }} />
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.65rem', mb: 0.25 }}>
                Travel
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.85rem' }}>
                {travelMinutes} min
              </Typography>
            </Box>
          )}

          {doorToNeedleMinutes !== null && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 1,
                borderRadius: 0.75,
                background: alpha(theme.palette.background.paper, isLight ? 0.5 : 0.4),
                textAlign: 'center',
                minWidth: '70px',
              }}
            >
              <AccessTimeIcon sx={{ fontSize: 16, color: theme.palette.success.main, mb: 0.5 }} />
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.65rem', mb: 0.25 }}>
                Door-to-Needle
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.85rem' }}>
                {doorToNeedleMinutes} min
              </Typography>
            </Box>
          )}

          {totalTime !== null && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 1,
                borderRadius: 0.75,
                background: alpha(theme.palette.success.main, isLight ? 0.06 : 0.1),
                border: `1px solid ${alpha(theme.palette.success.main, isLight ? 0.2 : 0.25)}`,
                textAlign: 'center',
                minWidth: '70px',
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 16, color: theme.palette.success.main, mb: 0.5 }} />
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.65rem', mb: 0.25 }}>
                Total Time
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.success.main, fontWeight: 700, fontSize: '0.9rem' }}>
                {totalTime} min
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

