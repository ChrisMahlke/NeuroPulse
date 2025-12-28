"use client";

import { Box, Typography, Stack, Chip, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import PsychologyIcon from '@mui/icons-material/Psychology';
import { useThemeMode } from '@/theme/ThemeContext';

interface AIExplanationVisualizerProps {
  explanationText: string;
}

export function AIExplanationVisualizer({ explanationText }: AIExplanationVisualizerProps) {
  if (!explanationText) return null;

  const theme = useTheme();
  const { mode } = useThemeMode();
  const isLight = mode === 'light';

  // Extract key metrics (excluding stroke/LVO probabilities which are shown in SELECTED CASE panel)
  const riskCategoryMatch = explanationText.match(/Risk category:\s*(\w+)/i);
  const hospitalMatch = explanationText.match(/Recommended:\s*([^\.]+)/i);

  // Clean up explanation text (remove vitals details since they're shown in the LIVE VITALS section)
  let cleanExplanation = explanationText
    .replace(/Current vitals:[^\.]+\./i, '')
    .replace(/HR\s+\d+\s+bpm[,\s]*/gi, '')
    .replace(/BP\s+\d+\/\d+\s+mmHg[,\s]*/gi, '')
    .replace(/SpO2\s+\d+%[,\s]*/gi, '')
    .replace(/SpO₂\s+\d+%[,\s]*/gi, '')
    .replace(/GCS\s+\d+[,\s]*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <Box>
      {/* AI Summary with Key Metrics */}
      <Box
        sx={{
          p: 1.5,
          borderRadius: 1,
          background: alpha(theme.palette.info.main, isLight ? 0.05 : 0.08),
          border: `1px solid ${alpha(theme.palette.info.main, isLight ? 0.15 : 0.2)}`,
          mb: 1.5,
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ mb: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: alpha('#38BDF8', isLight ? 0.15 : 0.2),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 0 15px ${alpha('#38BDF8', isLight ? 0.2 : 0.3)}`,
            }}
          >
            <PsychologyIcon sx={{ fontSize: 20, color: theme.palette.info.main }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="body2"
              sx={{
                lineHeight: 1.6,
                color: theme.palette.text.primary,
                fontSize: '0.85rem',
              }}
            >
              {cleanExplanation}
            </Typography>
          </Box>
        </Stack>

        {/* Key Metrics Chips - Only show non-duplicate information */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.5 }}>
          {riskCategoryMatch && (
            <Chip
              label={riskCategoryMatch[1]}
              size="small"
              sx={{
                background: alpha(theme.palette.info.main, isLight ? 0.1 : 0.15),
                color: theme.palette.info.main,
                border: `1px solid ${alpha(theme.palette.info.main, isLight ? 0.2 : 0.3)}`,
                fontWeight: 600,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
              }}
            />
          )}
          {hospitalMatch && (
            <Chip
              label={hospitalMatch[1].trim()}
              size="small"
              sx={{
                background: alpha(theme.palette.primary.main, isLight ? 0.1 : 0.15),
                color: theme.palette.primary.main,
                border: `1px solid ${alpha(theme.palette.primary.main, isLight ? 0.2 : 0.3)}`,
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}

