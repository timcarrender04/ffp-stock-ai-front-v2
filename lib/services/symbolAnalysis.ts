/**
 * Symbol Analysis Service
 * Handles API calls for AI-powered symbol analysis
 */

export interface TimeframeAnalysis {
  timeframe: string;
  price: number;
  trend: "bullish" | "bearish" | "neutral";
  momentum: "bullish" | "bearish" | "neutral";
  rsi: number;
  rsi_condition: "oversold" | "overbought" | "neutral_bullish" | "neutral";
  macd: number;
  macd_signal: number;
  macd_histogram: number;
  bb_upper: number;
  bb_middle: number;
  bb_lower: number;
  bb_position: "upper" | "middle" | "lower";
  atr: number;
  adx: number;
  ema_9: number;
  ema_21: number;
  volume_ratio: number;
  signal_strength: number;
}

export interface Consensus {
  action: "BUY" | "SELL" | "HOLD";
  confidence: number;
  bullish_timeframes: number;
  bearish_timeframes: number;
  neutral_timeframes: number;
  avg_signal_strength: number;
  alignment: "strong" | "moderate" | "weak";
}

export interface Strategy {
  action: "BUY" | "SELL" | "HOLD";
  entry_price: number | null;
  stop_loss: number | null;
  take_profit_1: number | null;
  take_profit_2: number | null;
  take_profit_3: number | null;
  risk_reward_ratio: number | null;
  position_size_pct: number;
  atr_used?: number;
  reasoning: string;
}

export interface SymbolAnalysis {
  symbol: string;
  timestamp: string;
  current_price: number;
  price_change_pct: number;
  volume: number;
  timeframe_analyses: Record<string, TimeframeAnalysis>;
  consensus: Consensus;
  strategy: Strategy;
  summary_text: string;
  audio_url: string | null;
  error?: string;
}

export interface FetchSymbolAnalysisOptions {
  timeframes?: string[];
  refresh?: boolean;
  includeAudio?: boolean;
}

/**
 * Fetch comprehensive AI-powered analysis for a symbol
 */
export async function fetchSymbolAnalysis(
  symbol: string,
  options: FetchSymbolAnalysisOptions = {},
): Promise<SymbolAnalysis> {
  const {
    timeframes = ["5m", "15m", "30m"],
    refresh = false,
    includeAudio = true,
  } = options;

  // Build query parameters
  const params = new URLSearchParams({
    timeframes: timeframes.join(","),
    refresh: refresh.toString(),
    include_audio: includeAudio.toString(),
  });

  // Make API call to backend
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const response = await fetch(
    `${apiUrl}/api/moonshot/symbol-analysis/${symbol.toUpperCase()}?${params}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: refresh ? "no-store" : "default",
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "Failed to fetch analysis",
    }));

    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  const data = await response.json();

  return data as SymbolAnalysis;
}

/**
 * Refresh analysis cache for a symbol
 */
export async function refreshSymbolAnalysis(
  symbol: string,
  options: FetchSymbolAnalysisOptions = {},
): Promise<SymbolAnalysis> {
  return fetchSymbolAnalysis(symbol, { ...options, refresh: true });
}

/**
 * Format price for display
 */
export function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return "—";

  return `$${price.toFixed(2)}`;
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number | null): string {
  if (value === null || value === undefined) return "—";

  const sign = value >= 0 ? "+" : "";

  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Get color class based on action
 */
export function getActionColor(
  action: "BUY" | "SELL" | "HOLD",
): "success" | "danger" | "warning" {
  switch (action) {
    case "BUY":
      return "success";
    case "SELL":
      return "danger";
    case "HOLD":
      return "warning";
    default:
      return "warning";
  }
}

/**
 * Get color class based on trend
 */
export function getTrendColor(
  trend: "bullish" | "bearish" | "neutral",
): "success" | "danger" | "default" {
  switch (trend) {
    case "bullish":
      return "success";
    case "bearish":
      return "danger";
    case "neutral":
      return "default";
    default:
      return "default";
  }
}

/**
 * Get RSI color based on value
 */
export function getRSIColor(
  rsi: number,
): "success" | "danger" | "warning" | "default" {
  if (rsi < 30) return "success"; // Oversold - potential buy
  if (rsi > 70) return "danger"; // Overbought - potential sell
  if (rsi >= 40 && rsi <= 60) return "warning"; // Neutral zone

  return "default";
}

/**
 * Get confidence color based on value
 */
export function getConfidenceColor(
  confidence: number,
): "success" | "warning" | "danger" {
  if (confidence >= 0.7) return "success";
  if (confidence >= 0.5) return "warning";

  return "danger";
}

/**
 * Format volume for display
 */
export function formatVolume(volume: number): string {
  if (volume >= 1_000_000_000) {
    return `${(volume / 1_000_000_000).toFixed(2)}B`;
  }
  if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(2)}M`;
  }
  if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(2)}K`;
  }

  return volume.toLocaleString();
}
