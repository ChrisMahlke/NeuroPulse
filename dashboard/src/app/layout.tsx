/**
 * Root layout for the NeuroPulse dashboard application.
 *
 * This component wraps every page in the Next.js app, wires up global styles,
 * and initializes shared providers (Redux store, theme, etc.) via `Providers`.
 * From the project perspective, this is the top-level shell for the AI-driven
 * stroke triage UI that renders the real-time dashboard fed by the backend API.
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NeuroPulse",
  description:
    "Real-time stroke triage and routing powered by data in motion and AI.",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
};

/**
 * Root layout for all routes in the app directory.
 *
 * - Applies the Inter font across the dashboard.
 * - Ensures the HTML/body elements occupy full height for the full-screen layout.
 * - Wraps children in `Providers` so the NeuroPulse dashboard can access
 *   Redux state and theming, which are driven by real-time AI predictions
 *   from the backend.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        style={{
          margin: 0,
          padding: 0,
          minHeight: "100vh",
        }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
