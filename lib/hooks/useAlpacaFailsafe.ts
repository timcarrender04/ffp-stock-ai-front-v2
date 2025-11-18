/**
 * Hook to monitor Alpaca account status and optionally trigger fail-safe
 * 
 * This hook can be used to automatically monitor account status and trigger
 * fail-safe if account becomes blocked or trading is disabled.
 */

import { useEffect, useState, useCallback } from "react";
import type { TradingMode } from "@/lib/services/alpaca";

interface FailsafeStatus {
  should_trigger_failsafe: boolean;
  warnings: string[];
  account_status: {
    trading_blocked: boolean;
    account_blocked: boolean;
    transfers_blocked: boolean;
    status: string;
  };
}

interface UseAlpacaFailsafeOptions {
  mode: TradingMode;
  enabled?: boolean; // Enable automatic monitoring
  autoTrigger?: boolean; // Automatically trigger fail-safe if conditions met
  checkInterval?: number; // Check interval in milliseconds (default: 60 seconds)
  onStatusChange?: (status: FailsafeStatus) => void;
  onAutoTrigger?: () => void;
}

export function useAlpacaFailsafe({
  mode,
  enabled = false,
  autoTrigger = false,
  checkInterval = 60000, // 1 minute
  onStatusChange,
  onAutoTrigger,
}: UseAlpacaFailsafeOptions) {
  const [status, setStatus] = useState<FailsafeStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/alpaca/failsafe/status?mode=${mode}`);

      if (!response.ok) {
        throw new Error("Failed to check fail-safe status");
      }

      const data = await response.json();
      setStatus(data);
      onStatusChange?.(data);

      // Auto-trigger if conditions met and autoTrigger is enabled
      if (data.should_trigger_failsafe && autoTrigger) {
        try {
          const triggerResponse = await fetch(`/api/alpaca/failsafe?mode=${mode}`, {
            method: "POST",
          });

          if (triggerResponse.ok) {
            onAutoTrigger?.();
          }
        } catch (triggerError) {
          console.error("Failed to auto-trigger fail-safe:", triggerError);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [mode, enabled, autoTrigger, onStatusChange, onAutoTrigger]);

  useEffect(() => {
    if (!enabled) return;

    // Initial check
    checkStatus();

    // Set up interval
    const interval = setInterval(checkStatus, checkInterval);

    return () => clearInterval(interval);
  }, [enabled, checkInterval, checkStatus]);

  const triggerFailsafe = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/alpaca/failsafe?mode=${mode}`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to execute fail-safe");
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [mode]);

  return {
    status,
    isLoading,
    error,
    checkStatus,
    triggerFailsafe,
  };
}

