"use client";

import { Box, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { AlertCircle } from 'lucide-react';
import { useThemeMode } from '@/theme/ThemeContext';

export function MedicalDisclaimer() {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isLight = mode === 'light';

  return (
    <Box
      sx={{
        mt: 3,
        p: 2.5,
        borderRadius: 1.5,
        background: alpha(theme.palette.warning.main, isLight ? 0.08 : 0.12),
        border: `1.5px solid ${alpha(theme.palette.warning.main, isLight ? 0.25 : 0.3)}`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <AlertCircle size={18} color={theme.palette.warning.main} style={{ marginTop: 2, flexShrink: 0 }} />
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{
              color: theme.palette.warning.main,
              fontWeight: 700,
              mb: 0.75,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Educational Information Only
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              lineHeight: 1.6,
              fontSize: '0.8rem',
              mb: 1,
            }}
          >
            This information is for general education only and is not medical advice. In an emergency, call your local emergency number and follow the instructions of licensed healthcare professionals.
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              lineHeight: 1.5,
              fontSize: '0.7rem',
              opacity: 0.8,
            }}
          >
            Medical protocols and monitoring frequencies vary by location, patient condition, and clinical guidelines. Always follow local medical protocols and consult with licensed healthcare professionals for patient care decisions.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

