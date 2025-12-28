// src/hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from "react";
import { useAppDispatch } from "@/state/hooks";
import { upsertCase, setCases } from "@/state/casesSlice";
import { CaseSummary } from "@/state/casesSlice";
import { PredictionDetail } from "@/services/api";

// Global event emitter for case detail updates
const caseDetailUpdateListeners = new Map<string, Set<(detail: PredictionDetail) => void>>();

export function subscribeToCaseDetailUpdates(caseId: string, callback: (detail: PredictionDetail) => void) {
  if (!caseDetailUpdateListeners.has(caseId)) {
    caseDetailUpdateListeners.set(caseId, new Set());
  }
  caseDetailUpdateListeners.get(caseId)!.add(callback);
  
  return () => {
    const listeners = caseDetailUpdateListeners.get(caseId);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        caseDetailUpdateListeners.delete(caseId);
      }
    }
  };
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";
const WS_ENABLED = process.env.NEXT_PUBLIC_WS_ENABLED !== "false"; // Enable by default, can disable with env var

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;  // Increased attempts for better resilience

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!WS_ENABLED) {
      // WebSocket disabled via environment variable
      return;
    }
    
    // Don't create a new connection if one already exists
    if (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN)) {
      return;
    }

    // Clean up any existing closed connection
    if (wsRef.current && wsRef.current.readyState === WebSocket.CLOSED) {
      wsRef.current = null;
    }

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "initial_state") {
            // Set all cases from initial state
            dispatch(setCases(data.cases || []));
          } else if (data.type === "case_updated") {
            // Update or add a case
            dispatch(upsertCase(data.case as CaseSummary));
            
            // If full detail is included, notify listeners for that case
            if (data.detail) {
              const caseId = data.case?.caseId || data.detail?.caseId;
              if (caseId) {
                const listeners = caseDetailUpdateListeners.get(caseId);
                if (listeners) {
                  listeners.forEach(callback => callback(data.detail as PredictionDetail));
                }
              }
            }
          } else if (data.type === "pong") {
            // Heartbeat response
            // Could implement keepalive here
          }
        } catch (err) {
          // Silently handle parse errors - don't log to console
          // Invalid messages are ignored
        }
      };

      ws.onerror = (error) => {
        // WebSocket errors are often empty objects and handled by onclose
        // Don't set error here - let onclose handle reconnection logic
        setConnected(false);
        // Log error for debugging (only in development)
        if (process.env.NODE_ENV === 'development') {
          console.error('[WebSocket] Connection error:', error);
        }
      };

      ws.onclose = (event) => {
        setConnected(false);
        wsRef.current = null;

        // Log close event for debugging (only in development)
        if (process.env.NODE_ENV === 'development') {
          console.log('[WebSocket] Connection closed:', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
        }

        // Attempt to reconnect silently (unless it was a clean close)
        if (!event.wasClean && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          // Only set error after all reconnection attempts fail
          setError("WebSocket connection unavailable - using fallback polling");
        }
      };
    } catch (err) {
      // Silently handle connection errors - fallback to polling
      setError("WebSocket unavailable - using fallback");
      setConnected(false);
    }
  }, [dispatch]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((message: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
    }
  }, []);

  return { connected, error, send };
}

