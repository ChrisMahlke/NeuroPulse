/**
 * Shared React providers for the NeuroPulse dashboard.
 *
 * This module centralizes all application-level context providers, including:
 * - Redux store (`state/store.ts`) for managing active cases, AI predictions,
 *   and UI state.
 * - Theme context (`theme/ThemeContext.tsx`) for controlling the dashboard’s
 *   look and feel across light/dark or custom clinical themes.
 *
 * Project context:
 * - Every page in the `app` directory is wrapped with `Providers` via
 *   `layout.tsx`, ensuring that components rendering AI-derived stroke data
 *   have access to global state and theming.
 */
"use client";

import { ReactNode, useEffect, useState } from "react";
import { Provider as ReduxProvider } from "react-redux";

import { store } from "@/state/store";
import { ThemeContextProvider } from "@/theme/ThemeContext";

/**
 * Props for the `Providers` component.
 *
 * `children` represents the portion of the NeuroPulse UI (e.g., the main
 * dashboard) that should have access to global state and theming.
 */
type ProvidersProps = {
  children: ReactNode;
};

/**
 * Wrap the NeuroPulse application with all shared providers.
 *
 * By nesting the Redux provider and theme context here, we keep `layout.tsx`
 * lightweight while ensuring consistent configuration for the entire AI
 * dashboard experience.
 *
 * This component only renders on the client to prevent hydration mismatches
 * with client-only features like Redux and theme context.
 */
export default function Providers({ children }: ProvidersProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by only rendering providers on client
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ReduxProvider store={store}>
      <ThemeContextProvider>{children}</ThemeContextProvider>
    </ReduxProvider>
  );
}
