"use client";

import type { MoonshotTopEntry } from "@/lib/services/moonshot";

import { useMemo, useState } from "react";
import { Chip } from "@heroui/chip";
import { Icon } from "@iconify/react";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";

import { SymbolQuickViewPopover } from "../symbols/SymbolQuickViewPopover";

import { AlpacaTradingModule } from "@/components/trading/AlpacaTradingModule";
import { useChat } from "@/lib/ai-chat/ChatProvider";
import { formatNumber, formatPercentRaw } from "@/lib/utils/formatters";

type Props = {
  top: MoonshotTopEntry[];
};

export function Top25MoonshotTable({ top }: Props) {
  const { addSymbolToWatch, openChat, sendMessage } = useChat();
  const [isTradingModuleOpen, setIsTradingModuleOpen] = useState(false);
  const [tradingSymbol, setTradingSymbol] = useState<string | undefined>();

  // Ensure top is always an array
  const tableItems = Array.isArray(top) ? top : [];
  const leader = tableItems[0];

  const handleTradeClick = (symbol: string) => {
    setTradingSymbol(symbol);
    setIsTradingModuleOpen(true);
  };

  const avgScore = useMemo(() => {
    if (tableItems.length === 0) return null;
    const total = tableItems.reduce(
      (sum, item) => sum + Number(item.moonshot_score ?? 0),
      0,
    );

    return total / tableItems.length;
  }, [tableItems]);

  const avgConfidence = useMemo(() => {
    if (tableItems.length === 0) return null;
    const total = tableItems.reduce(
      (sum, item) => sum + Number(item.confidence_score ?? 0),
      0,
    );

    return total / tableItems.length;
  }, [tableItems]);

  const lastScanLabel = useMemo(() => {
    const timestamp = tableItems[0]?.created_at ?? tableItems[0]?.scan_date;

    return formatScanTimestamp(timestamp);
  }, [tableItems]);

  const handleSymbolSelect = (symbol: string) => {
    const normalized = symbol.trim().toUpperCase();

    addSymbolToWatch(normalized);
    openChat();

    // Prompt the agents to explain the pick
    setTimeout(() => {
      sendMessage(
        `Team, $${normalized} just got flagged from the Moonshot board. Give me the quick rundown on why it's here and what setup you're seeing.`,
      );
    }, 0);
  };

  const openYahooFinance = (symbol: string) => {
    // Extract just the symbol without exchange prefix if present
    const normalizedSymbol = symbol
      .replace(/^[A-Z]+:/, "") // Remove exchange prefix like "NASDAQ:"
      .replace(/\/.*$/, "") // Remove any suffix after /
      .toUpperCase();

    window.open(
      `https://finance.yahoo.com/chart/${normalizedSymbol}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const openNewsSearch = (symbol: string) => {
    const query = `${symbol} stock news`;

    window.open(
      `https://www.google.com/search?${new URLSearchParams({ q: query }).toString()}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className="rounded-3xl border border-finance-green-20 bg-finance-surface-70/80 shadow-2xl backdrop-blur-xl w-full max-w-full overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-white/5 p-4 sm:p-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-finance-green-70">
            Moonshot Top 25
          </p>
          <h2 className="text-xl sm:text-2xl font-semibold text-white">
            Highest conviction radar
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            <span className="hidden sm:inline">
              Tap any symbol to open the quick view, then push it into the AI
              chat for instant TA + risk context.
            </span>
            <span className="sm:hidden">
              Tap symbol to view details or add to chat.
            </span>
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:flex sm:flex-wrap sm:gap-4 text-sm text-zinc-300">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-finance-green-60">
              Avg Score
            </p>
            <p className="text-lg sm:text-xl font-semibold text-white">
              {avgScore ? Number(avgScore).toFixed(2) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-finance-green-60">
              Avg Confidence
            </p>
            <p className="text-lg sm:text-xl font-semibold text-white">
              {avgConfidence
                ? `${Math.round(Number(avgConfidence) * 100)}%`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-finance-green-60">
              Last Scan
            </p>
            <p className="text-xs text-zinc-400">{lastScanLabel}</p>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden max-h-[640px] overflow-y-auto w-full max-w-full overflow-x-hidden">
        {tableItems.length === 0 ? (
          <div className="p-6 text-center text-zinc-400">
            <p>Waiting for Moonshot data…</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 p-4 w-full max-w-full">
            {tableItems.map((row) => (
              <div
                key={`${row.symbol}-${row.rank}`}
                className="rounded-2xl border border-finance-green-20/50 bg-finance-surface-60/50 p-4 active:opacity-80 transition-opacity w-full max-w-full box-border"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-finance-green/20 flex items-center justify-center">
                      <span className="text-sm font-semibold text-finance-green">
                        #{row.rank}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <SymbolQuickViewPopover
                        symbol={row.symbol}
                        onAddToChat={() => handleSymbolSelect(row.symbol)}
                      >
                        <button
                          className="flex items-center gap-2 text-left font-semibold text-white transition-colors active:opacity-70 w-full"
                          type="button"
                        >
                          <span className="text-lg">{row.symbol}</span>
                          {row.trending_status ? (
                            <Chip className="text-xs" size="sm" variant="flat">
                              {row.trending_status}
                            </Chip>
                          ) : null}
                        </button>
                      </SymbolQuickViewPopover>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      aria-label="Open Yahoo Finance chart"
                      className="flex items-center justify-center rounded-full border border-white/10 p-2.5 text-white transition hover:border-finance-green-50 hover:text-finance-green-40 active:opacity-70 min-w-[44px] min-h-[44px]"
                      type="button"
                      onClick={() => openYahooFinance(row.symbol)}
                    >
                      <Icon className="text-xl" icon="mdi:chart-line" />
                    </button>
                    <button
                      aria-label="Search Google News"
                      className="flex items-center justify-center rounded-full border border-white/10 p-2.5 text-white transition hover:border-finance-green-50 hover:text-finance-green-40 active:opacity-70 min-w-[44px] min-h-[44px]"
                      type="button"
                      onClick={() => openNewsSearch(row.symbol)}
                    >
                      <Icon
                        className="text-xl"
                        icon="mdi:newspaper-variant-multiple-outline"
                      />
                    </button>
                    <button
                      aria-label="Trade this symbol"
                      className="flex items-center justify-center rounded-full border border-finance-green-30 bg-finance-green/10 p-2.5 text-finance-green transition hover:border-finance-green-50 hover:bg-finance-green/20 active:opacity-70 min-w-[44px] min-h-[44px]"
                      type="button"
                      onClick={() => handleTradeClick(row.symbol)}
                    >
                      <Icon className="text-xl" icon="solar:chart-2-bold" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/5">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-finance-green-60 mb-1">
                      Score
                    </p>
                    <p className="text-base font-semibold text-white">
                      {formatNumber(row.moonshot_score)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-finance-green-60 mb-1">
                      Δ 24h
                    </p>
                    <p
                      className={`text-base font-semibold ${
                        Number(row.price_change_pct ?? 0) >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {formatPercentRaw(row.price_change_pct, 2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-finance-green-60 mb-1">
                      Vol Ratio
                    </p>
                    <p className="text-base font-semibold text-white">
                      {row.volume_ratio != null
                        ? `${Number(row.volume_ratio).toFixed(2)}x`
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block relative max-h-[640px] overflow-x-auto overflow-y-auto">
        <Table
          removeWrapper
          aria-label="Moonshot top 25 table"
          className="min-w-full text-white min-w-[600px]"
        >
          <TableHeader className="sticky top-0 z-10 bg-finance-surface-70/95 backdrop-blur-sm">
            <TableColumn className="text-xs sm:text-sm">Rank</TableColumn>
            <TableColumn className="text-xs sm:text-sm">Symbol</TableColumn>
            <TableColumn className="text-xs sm:text-sm">Score</TableColumn>
            <TableColumn className="text-xs sm:text-sm">Δ 24h</TableColumn>
            <TableColumn className="text-xs sm:text-sm">Vol Ratio</TableColumn>
          </TableHeader>
          <TableBody
            emptyContent="Waiting for Moonshot data…"
            items={tableItems}
          >
            {(row) => (
              <TableRow
                key={`${row.symbol}-${row.rank}`}
                className="hover:bg-finance-surface-60/50"
              >
                <TableCell className="font-semibold text-finance-green py-3 sm:py-4">
                  #{row.rank}
                </TableCell>
                <TableCell className="py-3 sm:py-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <SymbolQuickViewPopover
                      symbol={row.symbol}
                      onAddToChat={() => handleSymbolSelect(row.symbol)}
                    >
                      <button
                        className="flex items-center gap-1.5 sm:gap-2 text-left font-semibold text-white transition-colors hover:text-finance-green active:opacity-70"
                        type="button"
                      >
                        <span className="text-sm sm:text-base">
                          {row.symbol}
                        </span>
                        {row.trending_status ? (
                          <Chip
                            className="text-[10px] sm:text-xs"
                            size="sm"
                            variant="flat"
                          >
                            {row.trending_status}
                          </Chip>
                        ) : null}
                        <Icon
                          className="text-sm sm:text-base text-finance-green-60"
                          icon="solar:users-group-two-rounded-bold"
                        />
                      </button>
                    </SymbolQuickViewPopover>
                    <button
                      aria-label="Open Yahoo Finance chart"
                      className="flex items-center justify-center rounded-full border border-white/10 p-1 text-white transition hover:border-finance-green-50 hover:text-finance-green-40 active:opacity-70"
                      type="button"
                      onClick={() => openYahooFinance(row.symbol)}
                    >
                      <Icon className="text-lg" icon="mdi:chart-line" />
                    </button>
                    <button
                      aria-label="Search Google News"
                      className="flex items-center justify-center rounded-full border border-white/10 p-1 text-white transition hover:border-finance-green-50 hover:text-finance-green-40 active:opacity-70"
                      type="button"
                      onClick={() => openNewsSearch(row.symbol)}
                    >
                      <Icon
                        className="text-lg"
                        icon="mdi:newspaper-variant-multiple-outline"
                      />
                    </button>
                    <button
                      aria-label="Trade this symbol"
                      className="flex items-center justify-center rounded-full border border-finance-green-30 bg-finance-green/10 p-1 text-finance-green transition hover:border-finance-green-50 hover:bg-finance-green/20 active:opacity-70"
                      type="button"
                      onClick={() => handleTradeClick(row.symbol)}
                    >
                      <Icon className="text-lg" icon="solar:chart-2-bold" />
                    </button>
                  </div>
                </TableCell>
                <TableCell className="py-3 sm:py-4 text-sm sm:text-base">
                  {formatNumber(row.moonshot_score)}
                </TableCell>
                <TableCell
                  className={`py-3 sm:py-4 text-sm sm:text-base ${
                    Number(row.price_change_pct ?? 0) >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {formatPercentRaw(row.price_change_pct, 2)}
                </TableCell>
                <TableCell className="py-3 sm:py-4 text-sm sm:text-base">
                  {row.volume_ratio != null
                    ? `${Number(row.volume_ratio).toFixed(2)}x`
                    : "—"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {leader ? (
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4 border-t border-white/5 p-4 sm:p-6 text-xs sm:text-sm text-zinc-300">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.35em] text-finance-green-60">
              Live Leader
            </p>
            <span className="text-base sm:text-lg lg:text-xl font-semibold text-white">
              {leader.symbol}
            </span>
            {leader.ai_recommendation ? (
              <Chip className="text-[10px] sm:text-xs" size="sm" variant="flat">
                {leader.ai_recommendation}
              </Chip>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-6">
            <span className="whitespace-nowrap">
              Score{" "}
              <strong className="text-white">
                {formatNumber(leader.moonshot_score)}
              </strong>
            </span>
            <span className="whitespace-nowrap">
              24h {formatPercentRaw(leader.price_change_pct, 2)}
            </span>
            <span className="whitespace-nowrap">
              Confidence{" "}
              {leader.confidence_score
                ? `${Math.round(Number(leader.confidence_score) * 100)}%`
                : "—"}
            </span>
          </div>
        </div>
      ) : null}

      <AlpacaTradingModule
        initialSymbol={tradingSymbol}
        isOpen={isTradingModuleOpen}
        onClose={() => {
          setIsTradingModuleOpen(false);
          setTradingSymbol(undefined);
        }}
      />
    </div>
  );
}

const scanDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  timeZoneName: "short",
});

function formatScanTimestamp(timestamp: string | null | undefined) {
  if (!timestamp) {
    return "Pending next scan";
  }

  const date = parseMoonshotTimestamp(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Pending next scan";
  }

  return scanDateFormatter.format(date);
}

function parseMoonshotTimestamp(value: string) {
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split("-").map(Number);

    if (
      [year, month, day].some(
        (segment) => Number.isNaN(segment) || segment === undefined,
      )
    ) {
      return new Date(NaN);
    }

    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  }

  const hasTimeZone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed);
  const normalized = hasTimeZone
    ? trimmed
    : `${trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T")}Z`;

  return new Date(normalized);
}
