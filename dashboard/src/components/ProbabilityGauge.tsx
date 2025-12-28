"use client";

import { Box, Typography, CircularProgress, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useThemeMode } from '@/theme/ThemeContext';

interface ProbabilityGaugeProps {
  value: number; // 0-1
  label: string;
  color: string;
  size?: number;
}

export function ProbabilityGauge({ value, label, color, size = 80 }: ProbabilityGaugeProps) {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isLight = mode === 'light';
  const percentage = Math.round(value * 100);
  
  // Determine risk level for gradient
  const getRiskLevel = (val: number) => {
    if (val >= 0.8) return 'critical';
    if (val >= 0.6) return 'high';
    if (val >= 0.3) return 'moderate';
    return 'low';
  };
  
  const riskLevel = getRiskLevel(value);
  
  // Create gradient color based on risk
  const getGradientColor = () => {
    if (riskLevel === 'critical') return `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.7)} 100%)`;
    if (riskLevel === 'high') return `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.8)} 100%)`;
    return color;
  };

  return (
    <Box 
      sx={{ 
        position: 'relative', 
        display: 'inline-flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        p: 1,
      }}
    >
      <Box 
        sx={{ 
          position: 'relative', 
          display: 'inline-flex',
          filter: riskLevel === 'critical' ? 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.3))' : 'none',
          transition: 'filter 0.3s ease',
        }}
      >
        {/* Background track */}
        <CircularProgress
          variant="determinate"
          value={100}
          size={size}
          thickness={3}
          sx={{
            color: alpha(theme.palette.text.secondary, isLight ? 0.08 : 0.12),
            position: 'absolute',
          }}
        />
        
        {/* Main progress with gradient effect */}
        <CircularProgress
          variant="determinate"
          value={percentage}
          size={size}
          thickness={3}
          sx={{
            position: 'relative',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
              stroke: riskLevel === 'critical' || riskLevel === 'high' 
                ? `url(#gradient-${label.replace(/\s+/g, '-')})`
                : color,
              transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            },
          }}
        />
        
        {/* Gradient definition for critical/high risk */}
        {(riskLevel === 'critical' || riskLevel === 'high') && (
          <svg width={0} height={0} style={{ position: 'absolute' }}>
            <defs>
              <linearGradient id={`gradient-${label.replace(/\s+/g, '-')}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity={1} />
                <stop offset="100%" stopColor={alpha(color, 0.6)} stopOpacity={1} />
              </linearGradient>
            </defs>
          </svg>
        )}
        
        {/* Center content */}
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 0.25,
          }}
        >
          <Typography
            variant="h5"
            component="div"
            sx={{
              color: color,
              fontWeight: 800,
              lineHeight: 1,
              fontSize: '1.15rem',
              letterSpacing: '-0.02em',
              fontFeatureSettings: '"tnum"',
            }}
          >
            {percentage}
          </Typography>
          <Typography
            variant="caption"
            component="div"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '0.7rem',
              fontWeight: 600,
              opacity: 0.7,
              lineHeight: 1,
            }}
          >
            %
          </Typography>
        </Box>
      </Box>
      
      {/* Label with risk indicator */}
      <Box sx={{ mt: 1, textAlign: 'center' }}>
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.primary,
            fontWeight: 700,
            textAlign: 'center',
            fontSize: '0.65rem',
            letterSpacing: '0.02em',
            display: 'block',
          }}
        >
          {label}
        </Typography>
        <Box
          sx={{
            mt: 0.4,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.4,
            px: 0.75,
            py: 0.2,
            borderRadius: 0.75,
            background: alpha(color, isLight ? 0.1 : 0.15),
            border: `1px solid ${alpha(color, isLight ? 0.2 : 0.25)}`,
          }}
        >
          <Box
            sx={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: color,
              boxShadow: riskLevel === 'critical' ? `0 0 4px ${alpha(color, 0.6)}` : 'none',
              animation: riskLevel === 'critical' ? 'pulse 2s ease-in-out infinite' : 'none',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.5 },
              },
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: color,
              fontWeight: 600,
              fontSize: '0.55rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {riskLevel}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

