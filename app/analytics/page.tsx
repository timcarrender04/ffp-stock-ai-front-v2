"use client";

import React, { useEffect, useState } from "react";
import { Spinner } from "@heroui/spinner";
import { Select, SelectItem } from "@heroui/select";
import { Icon } from "@iconify/react";

import {
  ProcessedTrade,
  TradeMetrics,
  AccountInfo,
  calculateMetrics,
  normalizeTradeDates,
} from "@/lib/services/analytics";
import { OverviewCards } from "@/components/analytics/OverviewCards";
import { WinLossChart } from "@/components/analytics/WinLossChart";
import { LossDistributionChart } from "@/components/analytics/LossDistributionChart";
import { PNLChart } from "@/components/analytics/PNLChart";
import { TradeHistoryTable } from "@/components/analytics/TradeHistoryTable";
import { AITradingProfile } from "@/components/analytics/AITradingProfile";

export default function AnalyticsPage() {
  const [trades, setTrades] = useState<ProcessedTrade[]>([]);
  const [metrics, setMetrics] = useState<TradeMetrics | null>(null);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tradingMode, setTradingMode] = useState<"paper" | "live">("paper");

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch trades and account in parallel from API routes with mode parameter
        const [tradesResponse, accountResponse] = await Promise.all([
          fetch(`/api/analytics/trades?mode=${tradingMode}`),
          fetch(`/api/analytics/account?mode=${tradingMode}`),
        ]);

        if (!tradesResponse.ok) {
          let errorMessage = `Failed to fetch trades: ${tradesResponse.statusText}`;

          try {
            const errorData = await tradesResponse.json();

            errorMessage =
              errorData.message ||
              errorData.error ||
              errorData.details ||
              errorMessage;
            if (errorData.hint) {
              errorMessage += ` (${errorData.hint})`;
            }
          } catch {
            // Use default error message
          }
          throw new Error(errorMessage);
        }

        const processedTradesRaw: ProcessedTrade[] =
          await tradesResponse.json();
        // Normalize dates after JSON deserialization (dates become strings)
        const processedTrades = normalizeTradeDates(processedTradesRaw);
        const calculatedMetrics = calculateMetrics(processedTrades);

        let accountData: AccountInfo | null = null;

        if (accountResponse.ok) {
          accountData = await accountResponse.json();
        }

        setTrades(processedTrades);
        setMetrics(calculatedMetrics);
        setAccount(accountData);
      } catch (err) {
        console.error("Error loading analytics data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load analytics data",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();

    // Refresh data every 5 minutes
    const interval = setInterval(
      () => {
        void loadData();
      },
      5 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [tradingMode]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner color="primary" size="lg" />
          <p className="text-zinc-400">Loading trading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isAlpacaNotConfigured =
      error.includes("Alpaca credentials not configured") ||
      error.includes("Alpaca client not initialized") ||
      error.includes("not configured") ||
      error.includes("No Alpaca credentials found");

    return (
      <div className="min-h-screen bg-finance-black p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="flex flex-col items-center gap-4 max-w-2xl text-center">
              {isAlpacaNotConfigured ? (
                <>
                  <div className="rounded-full bg-orange-400/20 p-4 border border-orange-400/30">
                    <Icon
                      className="text-5xl text-orange-400"
                      icon="solar:settings-bold"
                    />
                  </div>
                  <h2 className="text-2xl font-semibold text-white">
                    Alpaca Trading Not Configured
                  </h2>
                  <p className="text-zinc-400 text-lg">
                    The backend Alpaca client needs to be configured before you
                    can view trading analytics.
                  </p>
                </>
              ) : (
                <>
                  <Icon
                    className="text-5xl text-red-400"
                    icon="solar:danger-triangle-bold"
                  />
                  <h2 className="text-2xl font-semibold text-white">
                    Error Loading Analytics
                  </h2>
                  <p className="text-zinc-400">{error}</p>
                </>
              )}
            </div>

            {isAlpacaNotConfigured ? (
              <div className="w-full max-w-2xl rounded-lg border border-orange-400/30 bg-orange-400/10 p-6 text-left">
                <p className="text-base text-orange-300 mb-4 font-semibold">
                  Configuration Required:
                </p>
                <div className="space-y-3">
                  <div className="bg-black/20 rounded-lg p-4 border border-orange-400/20">
                    <p className="text-sm text-orange-200 mb-2 font-semibold">
                      1. Configure Alpaca API Credentials
                    </p>
                    <p className="text-xs text-orange-200/80 mb-3">
                      Your Alpaca API keys are stored securely in Supabase
                      Vault. To add them:
                    </p>
                    <ol className="text-xs text-orange-200/80 space-y-2 list-decimal list-inside mb-3">
                      <li>Click on your user menu (top right)</li>
                      <li>Select &quot;Alpaca Integration&quot;</li>
                      <li>Enter your Paper Trading API Key and Secret</li>
                      <li>Click &quot;Save Credentials&quot;</li>
                    </ol>
                    <p className="text-xs text-orange-200/60">
                      Your credentials are encrypted and stored securely in
                      Supabase Vault. They are never exposed to the frontend.
                    </p>
                  </div>

                  <div className="bg-black/20 rounded-lg p-4 border border-orange-400/20">
                    <p className="text-sm text-orange-200 mb-2 font-semibold">
                      2. Get Your Alpaca API Keys
                    </p>
                    <p className="text-xs text-orange-200/80 mb-2">
                      If you don&apos;t have API keys yet, get them from:
                    </p>
                    <ul className="text-xs text-orange-200/80 space-y-1 list-disc list-inside">
                      <li>
                        <a
                          className="text-finance-green hover:underline"
                          href="https://app.alpaca.markets/paper/dashboard/overview"
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          Paper Trading Dashboard
                        </a>{" "}
                        (for paper trading)
                      </li>
                      <li>
                        <a
                          className="text-finance-green hover:underline"
                          href="https://app.alpaca.markets/dashboard/overview"
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          Live Trading Dashboard
                        </a>{" "}
                        (for live trading)
                      </li>
                    </ul>
                  </div>

                  <div className="bg-black/20 rounded-lg p-4 border border-orange-400/20">
                    <p className="text-sm text-orange-200 mb-2 font-semibold">
                      3. Test Your Connection
                    </p>
                    <p className="text-xs text-orange-200/80">
                      After saving your credentials, use the &quot;Test
                      Connection&quot; button in the Alpaca Integration settings
                      to verify everything works.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-2xl rounded-lg border border-red-400/30 bg-red-400/10 p-6 text-left">
                <p className="text-sm text-zinc-300 mb-2 font-semibold">
                  Troubleshooting:
                </p>
                <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
                  <li>Ensure the backend API is running on port 8000</li>
                  <li>Check that Alpaca API credentials are configured</li>
                  <li>
                    Verify the trading mode ({tradingMode}) is properly set up
                  </li>
                  <li>Check browser console for detailed error messages</li>
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              <button
                className="px-6 py-3 rounded-lg bg-finance-green/20 border border-finance-green-30 text-finance-green hover:bg-finance-green/30 transition-colors font-semibold"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
              {isAlpacaNotConfigured && (
                <>
                  <button
                    className="px-6 py-3 rounded-lg bg-finance-green/20 border border-finance-green-30 text-finance-green hover:bg-finance-green/30 transition-colors font-semibold"
                    onClick={() => {
                      // Open Alpaca Settings modal - we'll need to trigger it via a custom event
                      // For now, just show a message
                      alert(
                        "Please use the User Menu (top right) > Alpaca Integration to configure your credentials",
                      );
                    }}
                  >
                    Configure Credentials
                  </button>
                  <button
                    className="px-6 py-3 rounded-lg bg-zinc-700/50 border border-zinc-600 text-zinc-300 hover:bg-zinc-700 transition-colors"
                    onClick={() => (window.location.href = "/")}
                  >
                    Go to Dashboard
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Icon
            className="text-4xl text-zinc-400"
            icon="solar:chart-2-line-duotone"
          />
          <p className="text-zinc-400">No trading data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-finance-black p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <Icon
                className="text-3xl sm:text-4xl text-finance-green"
                icon="solar:chart-2-bold"
              />
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Trading Analytics
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Icon
                className="text-lg text-finance-green-60"
                icon="solar:settings-bold"
              />
              <Select
                aria-label="Trading mode selector"
                className="min-w-[140px]"
                classNames={{
                  trigger: "bg-finance-surface-80 border-finance-green-30",
                  value: "text-white",
                }}
                selectedKeys={[tradingMode]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;

                  if (selected === "paper" || selected === "live") {
                    setTradingMode(selected);
                  }
                }}
              >
                <SelectItem key="paper">
                  <div className="flex items-center gap-2">
                    <Icon
                      className="text-base"
                      icon="solar:document-text-bold"
                    />
                    Paper Trading
                  </div>
                </SelectItem>
                <SelectItem key="live">
                  <div className="flex items-center gap-2">
                    <Icon className="text-base" icon="solar:fire-bold" />
                    Live Trading
                  </div>
                </SelectItem>
              </Select>
            </div>
          </div>
          <p className="text-sm sm:text-base text-zinc-400">
            Comprehensive analysis of your trading performance with AI-powered
            insights
            {tradingMode === "paper" && (
              <span className="ml-2 text-finance-green-60">
                (Paper Trading Mode)
              </span>
            )}
            {tradingMode === "live" && (
              <span className="ml-2 text-red-400">(Live Trading Mode)</span>
            )}
          </p>
        </div>

        {/* Overview Cards */}
        <div className="mb-6 sm:mb-8">
          <OverviewCards account={account} metrics={metrics} />
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 sm:gap-8 mb-6 sm:mb-8 lg:grid-cols-2">
          <WinLossChart metrics={metrics} />
          <LossDistributionChart trades={trades} />
        </div>

        {/* P&L Chart - Full Width */}
        <div className="mb-6 sm:mb-8">
          <PNLChart trades={trades} />
        </div>

        {/* AI Trading Profile */}
        <div className="mb-6 sm:mb-8">
          <AITradingProfile metrics={metrics} trades={trades} />
        </div>

        {/* Trade History Table */}
        <div className="mb-6 sm:mb-8">
          <TradeHistoryTable trades={trades} />
        </div>
      </div>
    </div>
  );
}
