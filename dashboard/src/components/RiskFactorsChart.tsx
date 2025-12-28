"use client";

import { Box, Typography, Chip, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import WarningIcon from '@mui/icons-material/Warning';
import { useThemeMode } from '@/theme/ThemeContext';

interface RiskFactorsChartProps {
  factors: string[];
}

export function RiskFactorsChart({ factors }: RiskFactorsChartProps) {
  if (!factors || factors.length === 0) return null;

  const theme = useTheme();
  const { mode } = useThemeMode();
  const isLight = mode === 'light';

  // Categorize factors by severity
  const criticalFactors = factors.filter(f => 
    f.toLowerCase().includes('elevated') || 
    f.toLowerCase().includes('reduced') ||
    f.toLowerCase().includes('critical')
  );
  const moderateFactors = factors.filter(f => 
    !criticalFactors.includes(f) && (
      f.toLowerCase().includes('weakness') ||
      f.toLowerCase().includes('droop') ||
      f.toLowerCase().includes('speech')
    )
  );
  const otherFactors = factors.filter(f => 
    !criticalFactors.includes(f) && !moderateFactors.includes(f)
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <WarningIcon sx={{ fontSize: 16, color: theme.palette.warning.main }} />
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.7rem' }}
        >
          KEY RISK FACTORS
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {criticalFactors.map((factor, idx) => (
          <Box
            key={idx}
            sx={{
              p: 1,
              borderRadius: 0.5,
              background: alpha(theme.palette.error.main, isLight ? 0.06 : 0.1),
              border: `1px solid ${alpha(theme.palette.error.main, isLight ? 0.2 : 0.25)}`,
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
            }}
          >
            <Box
              sx={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: theme.palette.error.main,
                flexShrink: 0,
              }}
            />
            <Typography
              variant="body2"
              sx={{ color: theme.palette.error.main, fontSize: '0.8rem', lineHeight: 1.4 }}
            >
              {factor}
            </Typography>
          </Box>
        ))}
        {moderateFactors.map((factor, idx) => (
          <Box
            key={idx}
            sx={{
              p: 1,
              borderRadius: 0.5,
              background: alpha(theme.palette.warning.main, isLight ? 0.06 : 0.1),
              border: `1px solid ${alpha(theme.palette.warning.main, isLight ? 0.2 : 0.25)}`,
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
            }}
          >
            <Box
              sx={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: theme.palette.warning.main,
                flexShrink: 0,
              }}
            />
            <Typography
              variant="body2"
              sx={{ color: theme.palette.warning.main, fontSize: '0.8rem', lineHeight: 1.4 }}
            >
              {factor}
            </Typography>
          </Box>
        ))}
        {otherFactors.map((factor, idx) => (
          <Box
            key={idx}
            sx={{
              p: 1,
              borderRadius: 0.5,
              background: alpha(theme.palette.info.main, isLight ? 0.06 : 0.1),
              border: `1px solid ${alpha(theme.palette.info.main, isLight ? 0.2 : 0.25)}`,
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
            }}
          >
            <Box
              sx={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: theme.palette.info.main,
                flexShrink: 0,
              }}
            />
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary, fontSize: '0.8rem', lineHeight: 1.4 }}
            >
              {factor}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

