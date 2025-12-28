"use client";

import {
  Dialog,
  IconButton,
  Box,
  Typography,
  Divider,
  Switch,
  FormControlLabel,
  alpha,
  useTheme,
} from "@mui/material";
import {
  X,
  Settings,
  Palette,
  Bell,
  Shield,
  Monitor,
  Globe,
} from "lucide-react";
import { useThemeMode } from "@/theme/ThemeContext";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { mode, toggleTheme, setTheme } = useThemeMode();
  const theme = useTheme();
  const isLight = mode === "light";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: "420px",
          maxWidth: "95vw",
          borderRadius: 1,
          background: theme.palette.background.paper,
          border: `1px solid ${alpha(
            theme.palette.text.secondary,
            isLight ? 0.2 : 0.15
          )}`,
          boxShadow: isLight
            ? "0 8px 24px rgba(0, 0, 0, 0.12)"
            : "0 8px 24px rgba(0, 0, 0, 0.4)",
          overflow: "hidden",
          m: 2,
        },
      }}
      sx={{
        "& .MuiBackdrop-root": {
          backgroundColor: isLight
            ? "rgba(0, 0, 0, 0.5)"
            : "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(8px)",
        },
      }}
    >
      {/* Close Button */}
      <IconButton
        onClick={onClose}
        sx={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 10,
          width: 32,
          height: 32,
          color: theme.palette.text.secondary,
          background: alpha(theme.palette.text.secondary, 0.1),
          "&:hover": {
            background: alpha(theme.palette.text.secondary, 0.2),
            color: theme.palette.text.primary,
          },
          transition: "all 0.2s",
        }}
      >
        <X size={18} strokeWidth={2.5} />
      </IconButton>

      {/* Header */}
      <Box
        sx={{
          p: 3,
          pb: 2,
          borderBottom: `1px solid ${alpha(
            theme.palette.text.secondary,
            isLight ? 0.2 : 0.15
          )}`,
          background: alpha(theme.palette.primary.main, isLight ? 0.05 : 0.08),
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              background: alpha(
                theme.palette.primary.main,
                isLight ? 0.1 : 0.15
              ),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Settings size={20} color={theme.palette.primary.main} />
          </Box>
          <Typography
            variant="h5"
            sx={{ color: theme.palette.text.primary, fontWeight: 700 }}
          >
            Settings
          </Typography>
        </Box>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary, pl: 6.5 }}
        >
          Configure application preferences and appearance
        </Typography>
      </Box>

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 3,
          py: 3,
          maxHeight: "calc(85vh - 200px)",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: alpha(
              theme.palette.text.secondary,
              isLight ? 0.3 : 0.25
            ),
            borderRadius: "3px",
            "&:hover": {
              background: alpha(
                theme.palette.text.secondary,
                isLight ? 0.5 : 0.4
              ),
            },
          },
        }}
      >
        {/* Appearance Section */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <Palette size={18} color={theme.palette.primary.main} />
            <Typography
              variant="subtitle1"
              sx={{ color: theme.palette.text.primary, fontWeight: 600 }}
            >
              Appearance
            </Typography>
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              background: alpha(
                theme.palette.background.paper,
                isLight ? 0.5 : 0.4
              ),
              border: `1px solid ${alpha(
                theme.palette.text.secondary,
                isLight ? 0.15 : 0.15
              )}`,
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={mode === "dark"}
                  onChange={toggleTheme}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: theme.palette.primary.main,
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: theme.palette.primary.main,
                    },
                  }}
                />
              }
              label={
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.primary, fontWeight: 500 }}
                  >
                    Dark Mode
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: "0.75rem",
                    }}
                  >
                    Switch between light and dark theme
                  </Typography>
                </Box>
              }
              sx={{ m: 0 }}
            />
          </Box>
        </Box>

        <Divider
          sx={{
            my: 2,
            borderColor: alpha(
              theme.palette.text.secondary,
              isLight ? 0.2 : 0.15
            ),
          }}
        />

        {/* Notifications Section */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <Bell size={18} color={theme.palette.primary.main} />
            <Typography
              variant="subtitle1"
              sx={{ color: theme.palette.text.primary, fontWeight: 600 }}
            >
              Notifications
            </Typography>
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              background: alpha(
                theme.palette.background.paper,
                isLight ? 0.5 : 0.4
              ),
              border: `1px solid ${alpha(
                theme.palette.text.secondary,
                isLight ? 0.15 : 0.15
              )}`,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  defaultChecked
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: theme.palette.primary.main,
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: theme.palette.primary.main,
                    },
                  }}
                />
              }
              label={
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.primary, fontWeight: 500 }}
                  >
                    Case Alerts
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: "0.75rem",
                    }}
                  >
                    Receive notifications for new high-risk cases
                  </Typography>
                </Box>
              }
              sx={{ m: 0 }}
            />

            <FormControlLabel
              control={
                <Switch
                  defaultChecked
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: theme.palette.primary.main,
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: theme.palette.primary.main,
                    },
                  }}
                />
              }
              label={
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.primary, fontWeight: 500 }}
                  >
                    System Updates
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: "0.75rem",
                    }}
                  >
                    Notifications for system status and maintenance
                  </Typography>
                </Box>
              }
              sx={{ m: 0 }}
            />
          </Box>
        </Box>

        <Divider
          sx={{
            my: 2,
            borderColor: alpha(
              theme.palette.text.secondary,
              isLight ? 0.2 : 0.15
            ),
          }}
        />

        {/* Display Section */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <Monitor size={18} color={theme.palette.primary.main} />
            <Typography
              variant="subtitle1"
              sx={{ color: theme.palette.text.primary, fontWeight: 600 }}
            >
              Display
            </Typography>
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              background: alpha(
                theme.palette.background.paper,
                isLight ? 0.5 : 0.4
              ),
              border: `1px solid ${alpha(
                theme.palette.text.secondary,
                isLight ? 0.15 : 0.15
              )}`,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  defaultChecked
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: theme.palette.primary.main,
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: theme.palette.primary.main,
                    },
                  }}
                />
              }
              label={
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.primary, fontWeight: 500 }}
                  >
                    Compact View
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: "0.75rem",
                    }}
                  >
                    Reduce spacing for more information density
                  </Typography>
                </Box>
              }
              sx={{ m: 0 }}
            />

            <FormControlLabel
              control={
                <Switch
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: theme.palette.primary.main,
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: theme.palette.primary.main,
                    },
                  }}
                />
              }
              label={
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.primary, fontWeight: 500 }}
                  >
                    Auto-refresh
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: "0.75rem",
                    }}
                  >
                    Automatically refresh case data (WebSocket handles this)
                  </Typography>
                </Box>
              }
              sx={{ m: 0 }}
            />
          </Box>
        </Box>

        <Divider
          sx={{
            my: 2,
            borderColor: alpha(
              theme.palette.text.secondary,
              isLight ? 0.2 : 0.15
            ),
          }}
        />

        {/* Privacy & Security Section */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <Shield size={18} color={theme.palette.primary.main} />
            <Typography
              variant="subtitle1"
              sx={{ color: theme.palette.text.primary, fontWeight: 600 }}
            >
              Privacy & Security
            </Typography>
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              background: alpha(
                theme.palette.background.paper,
                isLight ? 0.5 : 0.4
              ),
              border: `1px solid ${alpha(
                theme.palette.text.secondary,
                isLight ? 0.15 : 0.15
              )}`,
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  defaultChecked
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: theme.palette.primary.main,
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: theme.palette.primary.main,
                    },
                  }}
                />
              }
              label={
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.primary, fontWeight: 500 }}
                  >
                    Data Encryption
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: "0.75rem",
                    }}
                  >
                    Encrypt patient data in transit and at rest
                  </Typography>
                </Box>
              }
              sx={{ m: 0 }}
            />
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}
