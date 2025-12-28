"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, Theme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within ThemeContextProvider');
  }
  return context;
}

const createAppTheme = (mode: ThemeMode): Theme => {
  const isLight = mode === 'light';
  
  return createTheme({
    palette: {
      mode,
      primary: {
        main: isLight ? '#0077B6' : '#38BDF8',
        light: isLight ? '#4DA3D4' : '#7DD3FC',
        dark: isLight ? '#00507E' : '#0EA5E9',
      },
      secondary: {
        main: isLight ? '#00B894' : '#10B981',
        light: isLight ? '#4FD9BE' : '#34D399',
        dark: isLight ? '#008066' : '#059669',
      },
      background: {
        default: isLight ? '#F8FAFC' : '#0B1020',
        paper: isLight ? '#FFFFFF' : '#111827',
      },
      text: {
        primary: isLight ? '#1E293B' : '#E5E7EB',
        secondary: isLight ? '#64748B' : '#9CA3AF',
      },
      error: {
        main: '#EF4444',
      },
      warning: {
        main: '#F59E0B',
      },
      success: {
        main: '#10B981',
      },
      info: {
        main: '#38BDF8',
      },
    },
    typography: {
      fontFamily:
        '"InterVariable", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      h1: {
        fontWeight: 700,
        letterSpacing: '-0.04em',
      },
      h2: {
        fontWeight: 600,
        letterSpacing: '-0.03em',
      },
      h3: {
        fontWeight: 600,
        letterSpacing: '-0.02em',
      },
      h4: {
        fontWeight: 500,
        letterSpacing: '-0.01em',
      },
      body1: {
        fontSize: '0.95rem',
        lineHeight: 1.6,
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
        letterSpacing: 0,
      },
    },
    shape: {
      borderRadius: 6,
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: 6,
            border: isLight 
              ? '1px solid rgba(148, 163, 184, 0.3)' 
              : '1px solid rgba(148, 163, 184, 0.2)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            border: isLight
              ? '1px solid rgba(148, 163, 184, 0.3)'
              : '1px solid rgba(148, 163, 184, 0.25)',
            boxShadow: isLight
              ? '0 4px 12px rgba(0, 0, 0, 0.1)'
              : '0 18px 45px rgba(15, 23, 42, 0.55)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: isLight
              ? 'linear-gradient(90deg, #FFFFFF 0%, #F8FAFC 45%, #F1F5F9 100%)'
              : 'linear-gradient(90deg, #020617 0%, #020617 45%, #0B1120 100%)',
            boxShadow: isLight
              ? '0 2px 8px rgba(0, 0, 0, 0.1)'
              : '0 16px 40px rgba(15, 23, 42, 0.9)',
            color: isLight ? '#1E293B' : '#E5E7EB',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            paddingInline: '1.2rem',
          },
        },
      },
    },
  });
};

interface ThemeContextProviderProps {
  children: ReactNode;
}

export function ThemeContextProvider({ children }: ThemeContextProviderProps) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load theme from localStorage on mount (client-side only)
    if (typeof window !== 'undefined') {
    const savedMode = localStorage.getItem('themeMode') as ThemeMode;
    if (savedMode === 'light' || savedMode === 'dark') {
      setMode(savedMode);
      }
    }
  }, []);

  const toggleTheme = () => {
    setMode((prev) => {
      const newMode = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newMode);
      return newMode;
    });
  };

  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  const theme = createAppTheme(mode);

  // Prevent hydration mismatch by only rendering MUI providers after mount
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, setTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

