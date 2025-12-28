// src/theme/muiTheme.ts
import { createTheme } from "@mui/material/styles";

export const muiTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0077B6", // deep clinical blue
      light: "#4DA3D4",
      dark: "#00507E",
    },
    secondary: {
      main: "#00B894", // teal/green accent
      light: "#4FD9BE",
      dark: "#008066",
    },
    background: {
      default: "#0B1020", // deep ink background (we'll use layered surfaces)
      paper: "#111827",
    },
    text: {
      primary: "#E5E7EB",
      secondary: "#9CA3AF",
    },
    error: {
      main: "#EF4444",
    },
    warning: {
      main: "#F59E0B",
    },
    success: {
      main: "#10B981",
    },
    info: {
      main: "#38BDF8",
    },
  },
  typography: {
    fontFamily:
      '"InterVariable", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: "-0.04em",
    },
    h2: {
      fontWeight: 600,
      letterSpacing: "-0.03em",
    },
    h3: {
      fontWeight: 600,
      letterSpacing: "-0.02em",
    },
    h4: {
      fontWeight: 500,
      letterSpacing: "-0.01em",
    },
    body1: {
      fontSize: "0.95rem",
      lineHeight: 1.6,
    },
    button: {
      textTransform: "none",
      fontWeight: 500,
      letterSpacing: 0,
    },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: 18,
          border: "1px solid rgba(148, 163, 184, 0.2)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          border: "1px solid rgba(148, 163, 184, 0.25)",
          boxShadow: "0 18px 45px rgba(15, 23, 42, 0.55)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background:
            "linear-gradient(90deg, #020617 0%, #020617 45%, #0B1120 100%)",
          boxShadow: "0 16px 40px rgba(15, 23, 42, 0.9)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: "1.2rem",
        },
      },
    },
  },
});
