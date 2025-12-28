"use client";

import {
  Dialog,
  IconButton,
  Box,
  Typography,
  alpha,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  X,
  AlertCircle,
  Clock,
  Activity,
  Brain,
  Heart,
  TrendingUp,
  Zap,
  Thermometer,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useThemeMode } from "@/theme/ThemeContext";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";

interface MedicalTermsModalProps {
  open: boolean;
  onClose: () => void;
}

type TabType =
  | "stroke-types"
  | "screening"
  | "vitals"
  | "facilities"
  | "time"
  | "risk";

export default function MedicalTermsModal({
  open,
  onClose,
}: MedicalTermsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("stroke-types");
  const { mode } = useThemeMode();
  const theme = useTheme();
  const isLight = mode === "light";
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          width: isMobile ? "100%" : "920px",
          maxWidth: isMobile ? "100%" : "95vw",
          height: isMobile ? "100%" : "85vh",
          maxHeight: isMobile ? "100%" : "850px",
          borderRadius: isMobile ? 0 : 1,
          background: theme.palette.background.paper,
          border: isMobile
            ? "none"
            : `1px solid ${alpha(
                theme.palette.text.secondary,
                isLight ? 0.2 : 0.15
              )}`,
          boxShadow: isLight
            ? "0 8px 24px rgba(0, 0, 0, 0.12)"
            : "0 8px 24px rgba(0, 0, 0, 0.4)",
          overflow: "hidden",
          m: isMobile ? 0 : 2,
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
      <Box sx={{ display: "flex", height: "100%", overflow: "hidden" }}>
        {!isMobile && (
          <Box
            sx={{
              width: "280px",
              background: theme.palette.background.paper,
              borderRight: `1px solid ${alpha(
                theme.palette.text.secondary,
                isLight ? 0.2 : 0.15
              )}`,
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
            }}
          >
            <Box sx={{ p: 3, borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1,
                    background:
                      "radial-gradient(circle at 30% 20%, #38BDF8 0, #0EA5E9 35%, #0F172A 80%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 22px rgba(56, 189, 248, 0.6)",
                  }}
                >
                  <Brain size={18} strokeWidth={2.5} color="#ECFEFF" />
                </Box>
                <Typography
                  sx={{
                    fontSize: "17px",
                    fontWeight: 700,
                    color: theme.palette.text.primary,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Medical Guide
                </Typography>
              </Box>
              <Typography
                sx={{
                  fontSize: "13px",
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  lineHeight: 1.5,
                }}
              >
                Comprehensive stroke care reference
              </Typography>
            </Box>

            <Box sx={{ flex: 1, overflowY: "auto", py: 2 }}>
              <NavSection>
                <NavItem
                  icon={<AlertCircle size={16} />}
                  label="Stroke Types"
                  active={activeTab === "stroke-types"}
                  onClick={() => setActiveTab("stroke-types")}
                />
                <NavItem
                  icon={<Activity size={16} />}
                  label="Screening Tools"
                  active={activeTab === "screening"}
                  onClick={() => setActiveTab("screening")}
                />
                <NavItem
                  icon={<Heart size={16} />}
                  label="Vital Signs"
                  active={activeTab === "vitals"}
                  onClick={() => setActiveTab("vitals")}
                />
                <NavItem
                  icon={<Brain size={16} />}
                  label="Care Facilities"
                  active={activeTab === "facilities"}
                  onClick={() => setActiveTab("facilities")}
                />
                <NavItem
                  icon={<Clock size={16} />}
                  label="Time Windows"
                  active={activeTab === "time"}
                  onClick={() => setActiveTab("time")}
                />
                <NavItem
                  icon={<TrendingUp size={16} />}
                  label="Risk Assessment"
                  active={activeTab === "risk"}
                  onClick={() => setActiveTab("risk")}
                />
              </NavSection>
            </Box>

            <Box
              sx={{
                p: 3,
                borderTop: "1px solid rgba(148,163,184,0.2)",
                background: alpha(
                  theme.palette.background.paper,
                  isLight ? 0.5 : 0.4
                ),
              }}
            >
              <Box
                sx={{
                  p: 2,
                  borderRadius: "12px",
                  background:
                    "linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.2) 100%)",
                  border: "1px solid rgba(239,68,68,0.3)",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 0.5,
                  }}
                >
                  <Zap size={14} color="#EF4444" />
                  <Typography
                    sx={{ fontSize: "12px", fontWeight: 700, color: "#EF4444" }}
                  >
                    EMERGENCY
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontSize: "11px",
                    color: "#FCA5A5",
                    lineHeight: 1.5,
                    fontWeight: 500,
                  }}
                >
                  Time-sensitive protocols require immediate action
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: { xs: 2, sm: 4 },
              py: { xs: 2, sm: 3 },
              borderBottom: `1px solid ${alpha(
                theme.palette.text.secondary,
                isLight ? 0.2 : 0.15
              )}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: alpha(
                theme.palette.background.paper,
                isLight ? 0.7 : 0.6
              ),
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: theme.palette.text.primary,
                  letterSpacing: "-0.03em",
                  mb: 0.5,
                }}
              >
                {getTabTitle(activeTab)}
              </Typography>
              <Typography
                sx={{
                  fontSize: "13px",
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                }}
              >
                {getTabSubtitle(activeTab)}
              </Typography>
            </Box>

            <IconButton
              onClick={onClose}
              sx={{
                width: 36,
                height: 36,
                color: theme.palette.text.secondary,
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  color: theme.palette.text.primary,
                  background: "rgba(148,163,184,0.1)",
                  transform: "rotate(90deg)",
                },
              }}
            >
              <X size={18} strokeWidth={2.5} />
            </IconButton>
          </Box>

          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              px: { xs: 2, sm: 4 },
              py: { xs: 2, sm: 4 },
              "&::-webkit-scrollbar": {
                width: "6px",
              },
              "&::-webkit-scrollbar-track": {
                background: "transparent",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "rgba(148,163,184,0.3)",
                borderRadius: "3px",
                "&:hover": {
                  background: "rgba(148,163,184,0.5)",
                },
              },
            }}
          >
            {activeTab === "stroke-types" && (
              <>
                <StrokeTypesContent />
                <MedicalDisclaimer />
              </>
            )}
            {activeTab === "screening" && (
              <>
                <ScreeningContent />
                <MedicalDisclaimer />
              </>
            )}
            {activeTab === "vitals" && (
              <>
                <VitalsContent />
                <MedicalDisclaimer />
              </>
            )}
            {activeTab === "facilities" && (
              <>
                <FacilitiesContent />
                <MedicalDisclaimer />
              </>
            )}
            {activeTab === "time" && (
              <>
                <TimeWindowsContent />
                <MedicalDisclaimer />
              </>
            )}
            {activeTab === "risk" && (
              <>
                <RiskAssessmentContent />
                <MedicalDisclaimer />
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}

function getTabTitle(tab: TabType): string {
  const titles = {
    "stroke-types": "Stroke Types",
    screening: "FAST Screening",
    vitals: "Vital Signs",
    facilities: "Care Facilities",
    time: "Treatment Windows",
    risk: "Risk Assessment",
  };
  return titles[tab];
}

function getTabSubtitle(tab: TabType): string {
  const subtitles = {
    "stroke-types": "Understanding different stroke classifications",
    screening: "Quick assessment tools for stroke detection",
    vitals: "Patient monitoring parameters",
    facilities: "Where to take stroke patients",
    time: "Critical treatment deadlines",
    risk: "Severity and probability assessment",
  };
  return subtitles[tab];
}

function StrokeTypesContent() {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isLight = mode === "light";

  return (
    <>
      <QuickExplainer
        emoji="🧠"
        title="Think of it like..."
        text="A stroke is like a blocked pipe in your house. When water can't flow through, damage happens downstream. Same with blood to the brain."
      />

      <ContentSection
        badge="Critical"
        badgeColor="#dc2626"
        title="Acute Ischemic Stroke (AIS)"
        description="Blood flow blocked = brain cells dying. Like a traffic jam that stops delivery trucks from reaching their destination. Every minute counts!"
      />

      <ContentSection
        badge="High Severity"
        badgeColor="#ea580c"
        title="Large Vessel Occlusion (LVO)"
        description="The major highway is blocked, not just a side street. This is the worst-case scenario requiring immediate specialized intervention."
      />

      <Box
        sx={{
          mt: 3,
          p: 3,
          borderRadius: "14px",
          background: "rgba(245,158,11,0.15)",
          border: "1px solid rgba(245,158,11,0.3)",
        }}
      >
        <Typography
          sx={{ fontSize: "14px", fontWeight: 600, color: "#F59E0B", mb: 1 }}
        >
          💡 For Engineers
        </Typography>
        <Typography
          sx={{
            fontSize: "13px",
            color: theme.palette.text.secondary,
            lineHeight: 1.6,
          }}
        >
          Think of AIS as a network outage and LVO as your entire datacenter
          going down. Both need immediate response, but LVO requires the senior
          engineers.
        </Typography>
      </Box>
    </>
  );
}

function ScreeningContent() {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isLight = mode === "light";

  return (
    <>
      <QuickExplainer
        emoji="⚡"
        title="The FAST Test"
        text="A 30-second check anyone can do. Like running a quick health check on a server to see if something's wrong."
      />

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <MetricCard
            label="Face"
            value="Does one side droop?"
            color="#0ea5e9"
            letter="F"
          />
          <MetricCard
            label="Arm"
            value="Can they raise both arms?"
            color="#0ea5e9"
            letter="A"
          />
          <MetricCard
            label="Speech"
            value="Is speech slurred or strange?"
            color="#0ea5e9"
            letter="S"
          />
          <MetricCard
            label="Time"
            value="Call 911 immediately"
            color="#dc2626"
            letter="T"
            critical
          />
        </Box>
      </Box>

      <Box
        sx={{
          p: 3,
          borderRadius: "14px",
          background: "rgba(56,189,248,0.15)",
          border: "1px solid rgba(56,189,248,0.3)",
        }}
      >
        <Typography
          sx={{ fontSize: "14px", fontWeight: 600, color: "#38BDF8", mb: 1 }}
        >
          🎯 Remember This
        </Typography>
        <Typography
          sx={{
            fontSize: "13px",
            color: theme.palette.text.secondary,
            lineHeight: 1.6,
          }}
        >
          If ANY of these fail, call 911. Don't wait. Don't retry. Just like
          when production goes down - escalate immediately.
        </Typography>
      </Box>
    </>
  );
}

function VitalsContent() {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isLight = mode === "light";

  return (
    <>
      <QuickExplainer
        emoji="📊"
        title="Monitoring Metrics"
        text="Just like checking CPU, memory, and disk usage - but for humans. These numbers tell us if things are stable or getting worse."
      />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
        <VitalRow
          label="Heart Rate"
          abbr="HR"
          normal="60-100 bpm"
          description="Beats per minute. Too fast = stress/panic. Too slow = serious problem."
          color="#059669"
        />
        <VitalRow
          label="Blood Pressure"
          abbr="BP"
          normal="~120/80 mmHg"
          description="Force of blood against arteries. In stroke, both very high and very low BP can worsen brain injury, so monitoring frequency is tailored to the situation."
          color="#059669"
        />
        <VitalRow
          label="Oxygen Saturation"
          abbr="SpO2"
          normal="95-100%"
          description="Oxygen in blood. Low = brain not getting enough oxygen."
          color="#059669"
        />
        <VitalRow
          label="Glasgow Coma Scale"
          abbr="GCS"
          normal="15 = fully alert"
          description="Consciousness score. 15 = awake. 3 = unresponsive. Like uptime percentage."
          color="#059669"
        />
      </Box>

      <Box
        sx={{
          p: 3,
          borderRadius: "14px",
          background: "rgba(16,185,129,0.15)",
          border: "1px solid rgba(16,185,129,0.3)",
        }}
      >
        <Typography
          sx={{ fontSize: "14px", fontWeight: 600, color: "#10B981", mb: 1 }}
        >
          🔍 Developer Perspective
        </Typography>
        <Typography
          sx={{
            fontSize: "13px",
            color: theme.palette.text.secondary,
            lineHeight: 1.6,
          }}
        >
          These vitals are like your monitoring dashboard. Each metric matters.
          A spike in one could indicate a cascading failure.
        </Typography>
      </Box>

      <Box
        sx={{
          mt: 3,
          p: 3,
          borderRadius: "14px",
          background: "rgba(59,130,246,0.15)",
          border: "1px solid rgba(59,130,246,0.3)",
        }}
      >
        <Typography
          sx={{ fontSize: "14px", fontWeight: 600, color: "#3B82F6", mb: 1.5 }}
        >
          💉 Blood Pressure Monitoring in Stroke
        </Typography>
        <Typography
          sx={{
            fontSize: "13px",
            color: theme.palette.text.secondary,
            lineHeight: 1.7,
            mb: 1.5,
          }}
        >
          In suspected or confirmed stroke, blood pressure monitoring is
          typically <strong>frequent and tailored</strong> to the situation.
          Both very high and very low BP can worsen brain injury, so the medical
          team adjusts monitoring frequency based on:
        </Typography>
        <Box
          component="ul"
          sx={{
            pl: 2.5,
            mb: 1.5,
            color: theme.palette.text.secondary,
            fontSize: "13px",
            lineHeight: 1.7,
          }}
        >
          <li>Stroke type (ischemic vs hemorrhagic)</li>
          <li>Whether the patient is receiving clot-busting medications</li>
          <li>Current BP levels and stability</li>
          <li>Overall patient condition</li>
        </Box>
        <Typography
          sx={{
            fontSize: "13px",
            color: theme.palette.text.secondary,
            lineHeight: 1.7,
            fontStyle: "italic",
          }}
        >
          There is no single universal schedule for BP checks. The exact timing
          and frequency are determined by the medical team based on clinical
          guidelines and patient-specific factors.
        </Typography>
      </Box>
    </>
  );
}

function FacilitiesContent() {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isLight = mode === "light";

  return (
    <>
      <QuickExplainer
        emoji="🏥"
        title="Not All Hospitals Are Equal"
        text="Some hospitals can only do basic fixes. Others have the full toolkit. Like the difference between junior devs and the architects who built the system."
      />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
        <FacilityCard
          type="Primary Stroke Center"
          capability="IV Thrombolysis (tPA)"
          description="Can give clot-busting drugs through an IV. Think of it as running a script to fix the problem. Works for most cases."
          level="Standard"
        />
        <FacilityCard
          type="Comprehensive Stroke Center"
          capability="Mechanical Thrombectomy (EVT)"
          description="Can physically go in and remove the clot with special tools. Like having someone manually restart a stuck server. Required for worst cases."
          level="Advanced"
          advanced
        />
      </Box>

      <Box
        sx={{
          p: 3,
          borderRadius: "14px",
          background: "rgba(139,92,246,0.15)",
          border: "1px solid rgba(139,92,246,0.3)",
        }}
      >
        <Typography
          sx={{ fontSize: "14px", fontWeight: 600, color: "#8B5CF6", mb: 1.5 }}
        >
          🚁 When to Bypass
        </Typography>
        <Typography
          sx={{ fontSize: "13px", color: "#9CA3AF", lineHeight: 1.6, mb: 1.5 }}
        >
          If the patient has a suspected LVO (major blockage), sometimes it's
          worth the extra 15-20 minute drive to get to a Comprehensive center.
        </Typography>
        <Typography
          sx={{
            fontSize: "13px",
            color: theme.palette.text.secondary,
            lineHeight: 1.6,
          }}
        >
          Like choosing to deploy directly to the right environment instead of
          going through staging first when there's a critical outage.
        </Typography>
      </Box>
    </>
  );
}

function TimeWindowsContent() {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isLight = mode === "light";

  return (
    <>
      <QuickExplainer
        emoji="⏰"
        title="Deadlines Matter"
        text="Miss these windows and treatment options disappear. Like SLA violations - once you're past the deadline, consequences are severe."
      />

      <Box
        sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 3 }}
      >
        <TimeWindow
          title="IV tPA Window"
          time="4.5 hours"
          description="Drug that dissolves clots. After 4.5 hours, risk of bleeding is too high."
          color="#dc2626"
        />
        <TimeWindow
          title="EVT Window"
          time="6-24 hours"
          description="Physical clot removal. Longer window for certain cases, but faster is always better."
          color="#ea580c"
        />
      </Box>

      <Box
        sx={{
          p: 3,
          borderRadius: "14px",
          background: "rgba(239,68,68,0.15)",
          border: "1px solid rgba(239,68,68,0.3)",
        }}
      >
        <Typography
          sx={{ fontSize: "14px", fontWeight: 600, color: "#EF4444", mb: 1.5 }}
        >
          ⚠️ Why This Matters
        </Typography>
        <Typography
          sx={{ fontSize: "13px", color: "#9CA3AF", lineHeight: 1.6, mb: 1.5 }}
        >
          Every 15 minutes of delay = ~4% worse outcome. Brain cells are dying
          at a rate of 1.9 million per minute during a stroke.
        </Typography>
        <Typography
          sx={{
            fontSize: "13px",
            color: "#FCA5A5",
            lineHeight: 1.6,
            fontWeight: 600,
          }}
        >
          Time is brain. Like data loss during an outage - you can't get it
          back.
        </Typography>
      </Box>

      <Box
        sx={{
          mt: 3,
          p: 3,
          borderRadius: "14px",
          background: "rgba(245,158,11,0.15)",
          border: "1px solid rgba(245,158,11,0.3)",
        }}
      >
        <Typography
          sx={{ fontSize: "14px", fontWeight: 600, color: "#F59E0B", mb: 1 }}
        >
          🏃 Why Speed Matters
        </Typography>
        <Typography
          sx={{
            fontSize: "13px",
            color: theme.palette.text.secondary,
            lineHeight: 1.6,
          }}
        >
          In stroke care, time is critical. Medical teams typically aim to
          minimize delays at every step—from EMS pre-notification to hospital
          arrival to imaging and treatment. The exact protocols and timing
          targets vary by location and clinical guidelines, but the principle
          remains: faster treatment generally leads to better outcomes.
        </Typography>
      </Box>
    </>
  );
}

function RiskAssessmentContent() {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isLight = mode === "light";

  return (
    <>
      <QuickExplainer
        emoji="📈"
        title="Probability Scoring"
        text="Machine learning models help predict stroke likelihood. Low score = probably fine. High score = get moving NOW."
      />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 3 }}>
        <RiskLevel
          level="LOW"
          description="Probably not a stroke. Could be something else. Still worth checking out."
          color="#22c55e"
        />
        <RiskLevel
          level="MODERATE"
          description="Warning signs present. Needs evaluation at hospital, but not racing against the clock."
          color="#eab308"
        />
        <RiskLevel
          level="HIGH"
          description="Strong indicators of stroke. Move fast. This is your critical alert."
          color="#f97316"
        />
        <RiskLevel
          level="CRITICAL"
          description="All systems are screaming stroke. This is P0. Drop everything and go."
          color="#dc2626"
        />
      </Box>

      <Box
        sx={{
          p: 3,
          borderRadius: "14px",
          background: "rgba(56,189,248,0.15)",
          border: "1px solid rgba(56,189,248,0.3)",
        }}
      >
        <Typography
          sx={{ fontSize: "14px", fontWeight: 600, color: "#38BDF8", mb: 1.5 }}
        >
          🤖 How It Works
        </Typography>
        <Typography
          sx={{ fontSize: "13px", color: "#9CA3AF", lineHeight: 1.6, mb: 1.5 }}
        >
          AI models analyze symptoms, vitals, patient history, and CT scans.
          They output a probability score and severity classification.
        </Typography>
        <Typography
          sx={{
            fontSize: "13px",
            color: theme.palette.text.secondary,
            lineHeight: 1.6,
          }}
        >
          Think of it as your anomaly detection system flagging suspicious
          patterns. High confidence + high severity = immediate action.
        </Typography>
      </Box>

      <Box
        sx={{
          mt: 3,
          p: 3,
          borderRadius: "14px",
          background: "rgba(139,92,246,0.15)",
          border: "1px solid rgba(139,92,246,0.3)",
        }}
      >
        <Typography
          sx={{ fontSize: "14px", fontWeight: 600, color: "#8B5CF6", mb: 1 }}
        >
          💻 False Positives vs False Negatives
        </Typography>
        <Typography
          sx={{
            fontSize: "13px",
            color: theme.palette.text.secondary,
            lineHeight: 1.6,
          }}
        >
          Better to have false alarms than miss a real stroke. We optimize for
          recall over precision. Missing a stroke = catastrophic. False alarm =
          just wasted a trip.
        </Typography>
      </Box>
    </>
  );
}

function NavSection({ children }: { children: React.ReactNode }) {
  return <Box sx={{ px: 2 }}>{children}</Box>;
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isLight = mode === "light";

  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1.5,
        mb: 0.5,
        borderRadius: 1,
        cursor: "pointer",
        transition: "all 0.15s ease",
        background: active
          ? alpha(theme.palette.primary.main, isLight ? 0.1 : 0.15)
          : "transparent",
        border: active
          ? `1px solid ${alpha(
              theme.palette.primary.main,
              isLight ? 0.25 : 0.3
            )}`
          : "1px solid transparent",
        boxShadow: active
          ? `0 2px 8px ${alpha(
              theme.palette.primary.main,
              isLight ? 0.15 : 0.2
            )}`
          : "none",
        "&:hover": {
          background: alpha(theme.palette.primary.main, isLight ? 0.08 : 0.1),
          border: `1px solid ${alpha(
            theme.palette.primary.main,
            isLight ? 0.2 : 0.2
          )}`,
        },
      }}
    >
      <Box
        sx={{
          color: active
            ? theme.palette.primary.main
            : theme.palette.text.secondary,
          display: "flex",
        }}
      >
        {icon}
      </Box>
      <Typography
        sx={{
          fontSize: "13px",
          fontWeight: active ? 600 : 500,
          color: active
            ? theme.palette.text.primary
            : theme.palette.text.secondary,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function QuickExplainer({
  emoji,
  title,
  text,
}: {
  emoji: string;
  title: string;
  text: string;
}) {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isLight = mode === "light";

  return (
    <Box
      sx={{
        mb: 4,
        p: 3,
        borderRadius: 1,
        background: alpha(theme.palette.primary.main, isLight ? 0.05 : 0.08),
        border: `1px solid ${alpha(
          theme.palette.primary.main,
          isLight ? 0.25 : 0.3
        )}`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
        <Typography sx={{ fontSize: "24px" }}>{emoji}</Typography>
        <Typography
          sx={{
            fontSize: "15px",
            fontWeight: 700,
            color: theme.palette.primary.main,
          }}
        >
          {title}
        </Typography>
      </Box>
      <Typography
        sx={{
          fontSize: "14px",
          color: theme.palette.text.secondary,
          lineHeight: 1.7,
        }}
      >
        {text}
      </Typography>
    </Box>
  );
}

function ContentSection({
  badge,
  badgeColor,
  title,
  description,
}: {
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
}) {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Box
          sx={{
            px: 1.5,
            py: 0.5,
            borderRadius: "6px",
            background: alpha(badgeColor, 0.1),
            border: `1px solid ${alpha(badgeColor, 0.2)}`,
          }}
        >
          <Typography
            sx={{
              fontSize: "11px",
              fontWeight: 700,
              color: badgeColor,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {badge}
          </Typography>
        </Box>
      </Box>
      <Typography
        sx={{
          fontSize: "18px",
          fontWeight: 700,
          color: "#E5E7EB",
          mb: 1.5,
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </Typography>
      <Typography
        sx={{
          fontSize: "14px",
          color: "#9CA3AF",
          lineHeight: 1.7,
          fontWeight: 400,
        }}
      >
        {description}
      </Typography>
    </Box>
  );
}

function MetricCard({
  label,
  value,
  color,
  letter,
  critical,
}: {
  label: string;
  value: string;
  color: string;
  letter: string;
  critical?: boolean;
}) {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isLight = mode === "light";

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 1,
        background: alpha(theme.palette.background.paper, isLight ? 0.6 : 0.5),
        border: `1px solid ${alpha(color, isLight ? 0.25 : 0.3)}`,
        transition: "all 0.2s ease",
        "&:hover": {
          border: `1px solid ${alpha(color, isLight ? 0.4 : 0.5)}`,
          boxShadow: `0 4px 12px ${alpha(color, isLight ? 0.15 : 0.2)}`,
          background: alpha(
            theme.palette.background.paper,
            isLight ? 0.75 : 0.65
          ),
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Typography
          sx={{
            fontSize: "13px",
            fontWeight: 700,
            color: theme.palette.text.primary,
          }}
        >
          {label}
        </Typography>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: 0.5,
            background: critical
              ? theme.palette.error.main
              : alpha(color, isLight ? 0.1 : 0.15),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `1px solid ${
              critical
                ? theme.palette.error.dark
                : alpha(color, isLight ? 0.2 : 0.2)
            }`,
          }}
        >
          <Typography
            sx={{
              fontSize: "13px",
              fontWeight: 700,
              color: critical ? "#ffffff" : color,
            }}
          >
            {letter}
          </Typography>
        </Box>
      </Box>
      <Typography
        sx={{
          fontSize: "12px",
          color: theme.palette.text.secondary,
          lineHeight: 1.6,
          fontWeight: 500,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function VitalRow({
  label,
  abbr,
  normal,
  description,
  color,
}: {
  label: string;
  abbr: string;
  normal: string;
  description: string;
  color: string;
}) {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isLight = mode === "light";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2.5,
        p: 2.5,
        borderRadius: 1,
        background: alpha(theme.palette.background.paper, isLight ? 0.6 : 0.5),
        border: `1px solid ${alpha(color, isLight ? 0.25 : 0.3)}`,
        transition: "all 0.2s ease",
        "&:hover": {
          border: `1px solid ${alpha(color, isLight ? 0.4 : 0.5)}`,
          boxShadow: `0 2px 8px ${alpha(color, isLight ? 0.15 : 0.2)}`,
          background: alpha(
            theme.palette.background.paper,
            isLight ? 0.75 : 0.65
          ),
        },
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 1,
          background: alpha(color, 0.1),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1px solid ${alpha(color, 0.2)}`,
          flexShrink: 0,
        }}
      >
        <Typography sx={{ fontSize: "13px", fontWeight: 700, color: color }}>
          {abbr}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
          <Typography
            sx={{
              fontSize: "14px",
              fontWeight: 700,
              color: theme.palette.text.primary,
            }}
          >
            {label}
          </Typography>
          <Box
            sx={{
              px: 1,
              py: 0.25,
              borderRadius: "4px",
              background: alpha(color, 0.1),
            }}
          >
            <Typography
              sx={{ fontSize: "11px", fontWeight: 600, color: color }}
            >
              {normal}
            </Typography>
          </Box>
        </Box>
        <Typography
          sx={{
            fontSize: "12px",
            color: theme.palette.text.secondary,
            lineHeight: 1.5,
          }}
        >
          {description}
        </Typography>
      </Box>
    </Box>
  );
}

function FacilityCard({
  type,
  capability,
  description,
  level,
  advanced,
}: {
  type: string;
  capability: string;
  description: string;
  level: string;
  advanced?: boolean;
}) {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isLight = mode === "light";

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 1,
        background: alpha(theme.palette.background.paper, isLight ? 0.6 : 0.5),
        border: advanced
          ? `1px solid ${alpha(
              theme.palette.primary.main,
              isLight ? 0.3 : 0.4
            )}`
          : `1px solid ${alpha(
              theme.palette.text.secondary,
              isLight ? 0.15 : 0.15
            )}`,
        transition: "all 0.2s ease",
        position: "relative",
        overflow: "hidden",
        "&:hover": {
          boxShadow: advanced
            ? `0 8px 24px ${alpha(
                theme.palette.primary.main,
                isLight ? 0.2 : 0.3
              )}`
            : `0 4px 12px ${alpha(
                theme.palette.text.secondary,
                isLight ? 0.1 : 0.2
              )}`,
          background: alpha(
            theme.palette.background.paper,
            isLight ? 0.75 : 0.65
          ),
        },
      }}
    >
      {advanced && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            px: 2,
            py: 0.5,
            background:
              "linear-gradient(135deg, rgba(139,92,246,0.8) 0%, rgba(124,58,237,0.8) 100%)",
            borderBottomLeftRadius: "8px",
          }}
        >
          <Typography
            sx={{
              fontSize: "10px",
              fontWeight: 700,
              color: "#ffffff",
              textTransform: "uppercase",
            }}
          >
            {level}
          </Typography>
        </Box>
      )}
      {!advanced && (
        <Box
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            px: 1.5,
            py: 0.5,
            borderRadius: "6px",
            background: alpha("#64748b", 0.1),
          }}
        >
          <Typography
            sx={{
              fontSize: "10px",
              fontWeight: 600,
              color: "#64748b",
              textTransform: "uppercase",
            }}
          >
            {level}
          </Typography>
        </Box>
      )}
      <Typography
        sx={{
          fontSize: "15px",
          fontWeight: 700,
          color: theme.palette.text.primary,
          mb: 1,
          pr: 8,
        }}
      >
        {type}
      </Typography>
      <Box
        sx={{
          display: "inline-block",
          px: 1.5,
          py: 0.5,
          borderRadius: 0.5,
          background: alpha(theme.palette.primary.main, isLight ? 0.1 : 0.15),
          mb: 1.5,
        }}
      >
        <Typography
          sx={{
            fontSize: "12px",
            fontWeight: 600,
            color: theme.palette.primary.main,
          }}
        >
          {capability}
        </Typography>
      </Box>
      <Typography
        sx={{
          fontSize: "13px",
          color: theme.palette.text.secondary,
          lineHeight: 1.6,
        }}
      >
        {description}
      </Typography>
    </Box>
  );
}

function TimeWindow({
  title,
  time,
  description,
  color,
}: {
  title: string;
  time: string;
  description: string;
  color: string;
}) {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isLight = mode === "light";

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 1,
        background: alpha(theme.palette.background.paper, isLight ? 0.6 : 0.5),
        border: `1px solid ${alpha(color, isLight ? 0.25 : 0.3)}`,
        transition: "all 0.2s ease",
        "&:hover": {
          border: `1px solid ${alpha(color, isLight ? 0.4 : 0.5)}`,
          boxShadow: `0 4px 16px ${alpha(color, isLight ? 0.2 : 0.3)}`,
          background: alpha(
            theme.palette.background.paper,
            isLight ? 0.75 : 0.65
          ),
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
        <Clock size={16} color={color} strokeWidth={2.5} />
        <Typography
          sx={{
            fontSize: "14px",
            fontWeight: 700,
            color: theme.palette.text.primary,
          }}
        >
          {title}
        </Typography>
      </Box>
      <Typography
        sx={{
          fontSize: "28px",
          fontWeight: 700,
          color: color,
          mb: 1,
          letterSpacing: "-0.02em",
        }}
      >
        {time}
      </Typography>
      <Typography
        sx={{
          fontSize: "12px",
          color: theme.palette.text.secondary,
          lineHeight: 1.6,
        }}
      >
        {description}
      </Typography>
    </Box>
  );
}

function RiskLevel({
  level,
  description,
  color,
}: {
  level: string;
  description: string;
  color: string;
}) {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isLight = mode === "light";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        p: 2,
        borderRadius: 1,
        background: alpha(theme.palette.background.paper, isLight ? 0.6 : 0.5),
        border: `1px solid ${alpha(color, isLight ? 0.25 : 0.3)}`,
        transition: "all 0.2s ease",
        "&:hover": {
          border: `1px solid ${alpha(color, isLight ? 0.4 : 0.5)}`,
          boxShadow: `0 2px 8px ${alpha(color, isLight ? 0.2 : 0.3)}`,
          background: alpha(
            theme.palette.background.paper,
            isLight ? 0.75 : 0.65
          ),
        },
      }}
    >
      <Box
        sx={{
          minWidth: 100,
          px: 2,
          py: 1,
          borderRadius: 1,
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          sx={{ fontSize: "12px", fontWeight: 700, color: "#ffffff" }}
        >
          {level}
        </Typography>
      </Box>
      <Typography
        sx={{
          fontSize: "13px",
          color: theme.palette.text.secondary,
          lineHeight: 1.5,
          fontWeight: 500,
        }}
      >
        {description}
      </Typography>
    </Box>
  );
}
