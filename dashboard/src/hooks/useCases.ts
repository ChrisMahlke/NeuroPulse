// src/hooks/useCases.ts
import { useEffect, useCallback, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { setCases, setCasesLoading } from "@/state/casesSlice";
import { fetchCases, fetchCaseDetail, PredictionDetail } from "@/services/api";
import { subscribeToCaseDetailUpdates } from "@/hooks/useWebSocket";

const POLL_INTERVAL_MS = 2000; // Poll every 2 seconds

export function useCases() {
  const dispatch = useAppDispatch();
  const cases = useAppSelector((state) => state.cases.items);
  const isLoading = useAppSelector((state) => state.cases.isLoading);
  const [error, setError] = useState<string | null>(null);

  const loadCases = useCallback(async () => {
    // Only fetch on client-side
    if (typeof window === "undefined") return;
    
    try {
      setError(null);
      dispatch(setCasesLoading(true));
      const fetchedCases = await fetchCases();
      dispatch(setCases(fetchedCases));
    } catch (error) {
      // Store error for UI display, don't log to console
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to load cases. Please check your connection.");
      }
      // Keep existing cases on error
    } finally {
      dispatch(setCasesLoading(false));
    }
  }, [dispatch]);

  // Initial load (only on client)
  useEffect(() => {
    loadCases();
  }, [loadCases]);

  // Poll for updates (only on client) - but WebSocket will handle real-time updates
  // Keep polling as fallback if WebSocket is not connected
  useEffect(() => {
    const interval = setInterval(() => {
      // Only poll if WebSocket might not be working
      // WebSocket will update via Redux directly
      loadCases();
    }, POLL_INTERVAL_MS * 5); // Slower polling since WebSocket handles real-time

    return () => clearInterval(interval);
  }, [loadCases]);

  return { cases, isLoading, error, refresh: loadCases };
}

export function useCaseDetail(caseId: string | null) {
  const [detail, setDetail] = useState<PredictionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch on client-side
    if (typeof window === "undefined") {
      return;
    }

    if (!caseId) {
      setDetail(null);
      setError(null);
      return;
    }

    // Store caseId in const so TypeScript knows it's not null
    const currentCaseId = caseId;
    let cancelled = false;

    async function loadDetail() {
      setLoading(true);
      setError(null);
      try {
        const fetched = await fetchCaseDetail(currentCaseId);
        if (!cancelled) {
          setDetail(fetched);
        }
      } catch (error) {
        // Store error for UI display, don't log to console
        if (!cancelled) {
          setDetail(null);
          if (error instanceof Error) {
            setError(error.message);
          } else {
            setError("Failed to load case details. Please check your connection.");
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDetail();

    // Subscribe to WebSocket updates for this case
    const unsubscribe = subscribeToCaseDetailUpdates(currentCaseId, (updatedDetail) => {
      if (!cancelled) {
        setDetail(updatedDetail);
      }
    });

    // Poll for updates (slower, as fallback)
    const interval = setInterval(() => {
      loadDetail();
    }, POLL_INTERVAL_MS * 3); // Slower polling since WebSocket handles real-time

    return () => {
      cancelled = true;
      unsubscribe();
      clearInterval(interval);
    };
  }, [caseId]);

  return { detail, loading, error };
}

