const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

export type SymbolOhlcEntry = {
  symbol: string;
  timeframe: string;
  timestamp: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
};

export type TechnicalSnapshot = {
  symbol: string;
  timeframe: string;
  timestamp: string;
  rsi?: number | null;
  macd?: number | null;
  macd_signal?: number | null;
  macd_histogram?: number | null;
  ema_9?: number | null;
  ema_21?: number | null;
  sma_20?: number | null;
  sma_50?: number | null;
  adx?: number | null;
  plus_di?: number | null;
  minus_di?: number | null;
  atr?: number | null;
  mfi?: number | null;
  vwap?: number | null;
  volume_sma?: number | null;
  pivot_point?: number | null;
  support_1?: number | null;
  resistance_1?: number | null;
  [key: string]: string | number | null | undefined;
};

function buildApiUrl(path: string, params?: Record<string, string>) {
  const searchParams = params ? new URLSearchParams(params) : null;

  return `${API_BASE}${path}${searchParams ? `?${searchParams.toString()}` : ""}`;
}

export async function fetchLatestOhlc(
  symbol: string,
  timeframe = "1M",
): Promise<SymbolOhlcEntry | null> {
  const url = buildApiUrl(`/api/ohlc/${symbol.toUpperCase()}`, {
    timeframe,
    limit: "1",
  });
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    const message = await response
      .json()
      .catch(() => ({ detail: "Failed to fetch OHLC data" }));

    throw new Error(message.detail ?? "Failed to fetch OHLC data");
  }

  const data = await response.json();

  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const entry = data[0];

  return {
    symbol: entry.symbol ?? symbol.toUpperCase(),
    timeframe: entry.timeframe ?? timeframe,
    timestamp: entry.timestamp ?? entry.ts ?? new Date().toISOString(),
    open: normalizeNumber(entry.open ?? entry.o),
    high: normalizeNumber(entry.high ?? entry.h),
    low: normalizeNumber(entry.low ?? entry.l),
    close: normalizeNumber(entry.close ?? entry.c),
    volume: normalizeNumber(entry.volume ?? entry.v),
  };
}

export async function fetchTechnicalSnapshot(
  symbol: string,
  timeframe = "1M",
): Promise<TechnicalSnapshot | null> {
  const url = buildApiUrl(`/api/indicators/${symbol.toUpperCase()}`, {
    timeframe,
  });
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    const message = await response
      .json()
      .catch(() => ({ detail: "Failed to fetch technical indicators" }));

    throw new Error(message.detail ?? "Failed to fetch technical indicators");
  }

  const data = await response.json();

  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  return {
    symbol: data.symbol ?? symbol.toUpperCase(),
    timeframe: data.timeframe ?? timeframe,
    timestamp: data.timestamp ?? data.ts ?? new Date().toISOString(),
    ...data,
  };
}

function normalizeNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}
