/**
 * Application entry page for the NeuroPulse dashboard.
 *
 * This page is responsible for rendering the main real-time stroke triage
 * experience, which is implemented in `NeuroPulseDashboard`. It disables
 * server-side rendering for the dashboard to avoid hydration issues with
 * client-only features such as WebSocket connections to the backend API.
 *
 * Project context:
 * - Consumes live AI predictions and case updates via the API/WebSocket layer
 *   exposed by the backend (`api_server.py`).
 * - Presents the primary user interface for viewing stroke probability, LVO
 *   risk, routing recommendations, and AI-generated explanations.
 */
"use client";

import dynamic from "next/dynamic";

// Disable SSR for the dashboard to avoid hydration issues and ensure that
// real-time hooks (e.g., WebSocket connections and browser-only APIs) behave
// predictably in this AI-driven visualization.
const NeuroPulseDashboard = dynamic(
  () => import("@/components/dashboard/NeuroPulseDashboard").then((mod) => ({ default: mod.NeuroPulseDashboard })),
  {
    ssr: false,
    loading: () => (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        backgroundColor: "#0F172A",
        color: "#ECFEFF"
      }}>
        <div>Loading NeuroPulse...</div>
      </div>
    ),
  }
);

/**
 * Top-level page component that mounts the NeuroPulse dashboard.
 *
 * By delegating to `NeuroPulseDashboard`, this file stays focused on routing
 * concerns while the dashboard component encapsulates the AI/UX logic for
 * displaying active stroke cases and predictions.
 */
export default function HomePage() {
  return <NeuroPulseDashboard />;
}
