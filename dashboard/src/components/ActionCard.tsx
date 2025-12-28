"use client";

import { Box, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ReactNode } from 'react';
import { useThemeMode } from '@/theme/ThemeContext';

interface ActionCardProps {
  icon: ReactNode;
  text: string;
  priority: 'critical' | 'high' | 'normal';
  color: string;
}

export function ActionCard({ icon, text, priority, color }: ActionCardProps) {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isLight = mode === 'light';

  const priorityStyles = {
    critical: {
      background: alpha(theme.palette.error.main, isLight ? 0.06 : 0.1),
      border: alpha(theme.palette.error.main, isLight ? 0.2 : 0.25),
      textColor: theme.palette.error.main,
    },
    high: {
      background: alpha(theme.palette.warning.main, isLight ? 0.06 : 0.1),
      border: alpha(theme.palette.warning.main, isLight ? 0.2 : 0.25),
      textColor: theme.palette.warning.main,
    },
    normal: {
      background: alpha(theme.palette.background.paper, isLight ? 0.5 : 0.4),
      border: alpha(theme.palette.text.secondary, isLight ? 0.15 : 0.2),
      textColor: theme.palette.text.secondary,
    },
  };

  const style = priorityStyles[priority];

  return (
    <Box
      sx={{
        p: 1.25,
        borderRadius: 0.75,
        background: style.background,
        border: `1px solid ${style.border}`,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.25,
        transition: 'all 0.2s',
        position: 'relative',
        '&:hover': {
          border: `1px solid ${alpha(theme.palette.text.secondary, isLight ? 0.25 : 0.3)}`,
          background: priority === 'normal' ? alpha(theme.palette.background.paper, isLight ? 0.85 : 0.8) : style.background,
          transform: 'translateX(2px)',
        },
        '&::before': priority === 'critical' ? {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: theme.palette.error.main,
          borderRadius: '0.75px 0 0 0.75px',
        } : {},
      }}
    >
      <Box
        sx={{
          color: theme.palette.text.secondary,
          mt: 0.15,
          flexShrink: 0,
          '& svg': {
            fontSize: 16,
          },
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="body2"
        sx={{
          flex: 1,
          lineHeight: 1.5,
          color: style.textColor,
          fontSize: '0.8rem',
        }}
      >
        {text}
      </Typography>
    </Box>
  );
}

