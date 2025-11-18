"use client";

import { useState, useCallback, useMemo, type ReactElement } from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Popover, PopoverContent, PopoverTrigger } from "@heroui/popover";
import { Spinner } from "@heroui/spinner";
import { Icon } from "@iconify/react";

import {
  fetchLatestOhlc,
  fetchTechnicalSnapshot,
  type SymbolOhlcEntry,
  type TechnicalSnapshot,
} from "@/lib/services/symbolSpotlight";
import { formatPrice, formatPercent } from "@/lib/services/symbolAnalysis";
import { formatNumber } from "@/lib/utils/formatters";

type SymbolQuickViewPopoverProps = {
  symbol: string;
  timeframe?: string;
  children: ReactElement;
  onAddToChat?: () => void;
};

export function SymbolQuickViewPopover({
  symbol,
  timeframe = "1M",
  children,
  onAddToChat,
}: SymbolQuickViewPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ohlc, setOhlc] = useState<SymbolOhlcEntry | null>(null);
  const [technicals, setTechnicals] = useState<TechnicalSnapshot | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [ohlcResponse, technicalResponse] = await Promise.all([
        fetchLatestOhlc(symbol, timeframe),
        fetchTechnicalSnapshot(symbol, timeframe),
      ]);

      setOhlc(ohlcResponse);
      setTechnicals(technicalResponse);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load symbol details",
      );
    } finally {
      setIsLoading(false);
    }
  }, [symbol, timeframe]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);

      if (open && !ohlc && !technicals && !isLoading) {
        void loadData();
      }
    },
    [isLoading, loadData, ohlc, technicals],
  );

  const lastUpdated = ohlc?.timestamp || technicals?.timestamp || null;

  const priceDelta = useMemo(() => {
    if (!ohlc?.open || !ohlc?.close) return null;

    const change = ohlc.close - ohlc.open;
    const pct =
      ohlc.open !== 0 ? ((ohlc.close - ohlc.open) / ohlc.open) * 100 : null;

    return {
      change,
      pct,
      isUp: change >= 0,
    };
  }, [ohlc?.close, ohlc?.open]);

  const rsi = technicals?.rsi ?? null;
  const macd = technicals?.macd ?? null;
  const macdSignal = technicals?.macd_signal ?? null;
  const adx = technicals?.adx ?? null;
  const atr = technicals?.atr ?? null;
  const vwap =
    typeof technicals?.vwap === "number" ? (technicals.vwap as number) : null;
  const mfi =
    typeof technicals?.mfi === "number" ? (technicals.mfi as number) : null;
  const emaTrend =
    technicals?.ema_9 && technicals?.ema_21
      ? technicals.ema_9 > technicals.ema_21
        ? "bullish"
        : "bearish"
      : null;

  const openTradingView = useCallback(() => {
    const normalizedSymbol =
      symbol.includes(":") || symbol.includes("/")
        ? symbol
        : `NASDAQ:${symbol}`;

    const params = new URLSearchParams({
      symbol: normalizedSymbol,
      interval: "30",
    });

    window.open(
      `https://www.tradingview.com/chart/?${params.toString()}`,
      "_blank",
      "noopener,noreferrer",
    );
  }, [symbol]);

  const openNewsSearch = useCallback(() => {
    const query = `${symbol} stock news`;

    window.open(
      `https://www.google.com/search?${new URLSearchParams({ q: query }).toString()}`,
      "_blank",
      "noopener,noreferrer",
    );
  }, [symbol]);

  const renderContent = () => {
    if (isLoading && !ohlc && !technicals) {
      return (
        <div className="flex h-40 items-center justify-center">
          <Spinner color="success" size="sm" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-red-300">{error}</p>
          <Button
            className="w-full bg-finance-green text-black"
            size="sm"
            variant="flat"
            onPress={() => loadData()}
          >
            Retry
          </Button>
        </div>
      );
    }

    if (!ohlc && !technicals) {
      return (
        <div className="text-center text-sm text-zinc-400">
          No live data yet for {symbol.toUpperCase()}.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <header className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-finance-green-60">
              Symbol
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold text-white">
                {symbol.toUpperCase()}
              </span>
              {priceDelta ? (
                <Chip
                  className="text-xs"
                  color={priceDelta.isUp ? "success" : "danger"}
                  size="sm"
                  variant="flat"
                >
                  {priceDelta.isUp ? "+" : "-"}
                  {Math.abs(priceDelta.change).toFixed(2)}
                </Chip>
              ) : null}
            </div>
            {lastUpdated ? (
              <p className="text-xs text-zinc-400">
                Updated {formatTimestamp(lastUpdated)}
              </p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button
              isIconOnly
              className="border border-white/10 text-white"
              size="sm"
              variant="light"
              onPress={() => loadData()}
            >
              <Icon className="text-lg" icon="solar:refresh-outline" />
            </Button>
          </div>
        </header>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.3em] text-finance-green-60">
              OHLC ({ohlc?.timeframe ?? timeframe})
            </p>
            <span
              className={`text-sm font-semibold ${
                priceDelta?.isUp ? "text-green-400" : "text-red-400"
              }`}
            >
              {priceDelta?.pct != null ? formatPercent(priceDelta.pct) : "—"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <Metric label="Open" value={formatPrice(ohlc?.open ?? null)} />
            <Metric label="High" value={formatPrice(ohlc?.high ?? null)} />
            <Metric label="Low" value={formatPrice(ohlc?.low ?? null)} />
            <Metric label="Close" value={formatPrice(ohlc?.close ?? null)} />
            <Metric
              label="Volume"
              value={
                ohlc?.volume != null ? `${formatNumber(ohlc.volume)}` : "—"
              }
            />
            <Metric
              label="VWAP"
              value={vwap != null ? formatPrice(vwap) : "—"}
            />
          </div>
        </section>

        <section className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-finance-green-60">
            TA Basics
          </p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <Metric
              label="RSI 14"
              value={rsi != null ? rsi.toFixed(1) : "—"}
              valueClass={getRsiColorClass(rsi)}
            />
            <Metric
              label="MACD"
              value={
                macd != null && macdSignal != null
                  ? `${macd.toFixed(2)} vs ${macdSignal.toFixed(2)}`
                  : "—"
              }
            />
            <Metric
              label="Trend"
              value={emaTrend ? emaTrend.toUpperCase() : "—"}
              valueClass={
                emaTrend === "bullish"
                  ? "text-green-400"
                  : emaTrend === "bearish"
                    ? "text-red-400"
                    : undefined
              }
            />
            <Metric label="ADX" value={adx != null ? adx.toFixed(1) : "—"} />
            <Metric label="ATR" value={atr != null ? atr.toFixed(2) : "—"} />
            <Metric
              label="Money Flow"
              value={mfi != null ? mfi.toFixed(1) : "—"}
            />
          </div>
        </section>

        <footer className="flex flex-wrap gap-2">
          <Button
            className="flex-1 border border-white/10 text-white"
            size="sm"
            variant="light"
            onPress={openTradingView}
          >
            <Icon className="mr-1 text-base" icon="mdi:chart-line" />
            TradingView
          </Button>
          <Button
            className="flex-1 border border-white/10 text-white"
            size="sm"
            variant="light"
            onPress={openNewsSearch}
          >
            <Icon className="mr-1 text-base" icon="mdi:newspaper-variant" />
            News
          </Button>
          {onAddToChat ? (
            <Button
              className="flex-1 bg-finance-green text-black font-semibold"
              size="sm"
              variant="flat"
              onPress={onAddToChat}
            >
              Push to AI Chat
            </Button>
          ) : null}
        </footer>
      </div>
    );
  };

  return (
    <Popover isOpen={isOpen} placement="bottom" onOpenChange={handleOpenChange}>
      <PopoverTrigger>{children}</PopoverTrigger>
      <PopoverContent className="w-80 max-w-sm border border-finance-green-30 bg-finance-surface-80 p-4 text-white">
        {renderContent()}
      </PopoverContent>
    </Popover>
  );
}

type MetricProps = {
  label: string;
  value: string;
  valueClass?: string;
};

function Metric({ label, value, valueClass }: MetricProps) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">
        {label}
      </p>
      <p className={`text-sm font-semibold text-white ${valueClass ?? ""}`}>
        {value}
      </p>
    </div>
  );
}

function getRsiColorClass(rsi: number | null) {
  if (rsi == null) return undefined;
  if (rsi < 30) return "text-green-400";
  if (rsi > 70) return "text-red-400";

  return "text-yellow-300";
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "just now";
  }

  return date.toLocaleString();
}
