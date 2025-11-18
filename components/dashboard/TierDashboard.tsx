"use client";

import React from "react";
import { Tabs, Tab } from "@heroui/tabs";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { Tooltip } from "@heroui/tooltip";
import { Icon } from "@iconify/react";

import { SymbolAnalysisModal } from "./SymbolAnalysisModal";

type MoonshotTierEntry = {
  id: number;
  rank: number;
  symbol: string;
  scan_date: string;
  moonshot_score: number | string | null;
  volume_ratio: number | string | null;
  price_change_pct: number | string | null;
  price: number | string | null;
  volume: number | string | null;
  ai_recommendation: string | null;
  ai_quality_score: number | string | null;
  sentiment_alignment: number | string | null;
  confidence_score: number | string | null;
  trending_status: string | null;
  risk_level: string | null;
  timeframe: string | null;
};

type TierKey = "25" | "50" | "100";

const TIERS: { key: TierKey; label: string }[] = [
  { key: "100", label: "Top 100" },
  { key: "50", label: "Top 50" },
  { key: "25", label: "Top 25" },
];

const COLUMNS: { key: keyof MoonshotTierEntry | "actions"; label: string }[] = [
  { key: "rank", label: "Rank" },
  { key: "symbol", label: "Symbol" },
  { key: "moonshot_score", label: "Score" },
  { key: "price", label: "Price" },
  { key: "price_change_pct", label: "Δ%" },
  { key: "volume", label: "Volume" },
  { key: "volume_ratio", label: "Vol Ratio" },
  { key: "ai_recommendation", label: "AI Call" },
  { key: "risk_level", label: "Risk" },
  { key: "confidence_score", label: "Confidence" },
];

function recommendationColor(value: string | null) {
  if (!value) return "default";
  const normalized = value.toUpperCase();

  if (normalized.includes("BUY")) return "success";
  if (normalized.includes("SELL")) return "danger";
  if (normalized.includes("HOLD")) return "warning";

  return "default";
}

function parseScanDate(value: string | null) {
  if (!value) return null;
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatNumber(value: MoonshotTierEntry[keyof MoonshotTierEntry]) {
  if (value === null || value === undefined) {
    return "—";
  }

  const numeric = Number(value);

  if (Number.isNaN(numeric)) {
    return String(value);
  }

  if (numeric >= 1_000_000_000) {
    return `${(numeric / 1_000_000_000).toFixed(1)}B`;
  }
  if (numeric >= 1_000_000) {
    return `${(numeric / 1_000_000).toFixed(1)}M`;
  }
  if (numeric >= 1_000) {
    return `${(numeric / 1_000).toFixed(1)}K`;
  }

  return numeric.toLocaleString();
}

function formatPercent(value: MoonshotTierEntry[keyof MoonshotTierEntry]) {
  if (value === null || value === undefined) {
    return "—";
  }

  const numeric = Number(value);

  if (Number.isNaN(numeric)) {
    return String(value);
  }

  const formatted = `${numeric >= 0 ? "+" : ""}${numeric.toFixed(2)}%`;

  return formatted;
}

function confidenceChip(value: MoonshotTierEntry[keyof MoonshotTierEntry]) {
  if (value === null || value === undefined) {
    return <Chip variant="bordered">—</Chip>;
  }

  const numeric = Number(value);

  if (Number.isNaN(numeric)) {
    return <Chip variant="bordered">{String(value)}</Chip>;
  }

  const color =
    numeric >= 0.7 ? "success" : numeric >= 0.4 ? "warning" : "danger";

  return (
    <Chip color={color} variant="flat">
      {(numeric * 100).toFixed(0)}%
    </Chip>
  );
}

export function TierDashboard() {
  const [activeTier, setActiveTier] = React.useState<TierKey>("100");
  const dataRef = React.useRef<Record<TierKey, MoonshotTierEntry[]>>({
    "25": [],
    "50": [],
    "100": [],
  });
  const [data, setData] = React.useState<Record<TierKey, MoonshotTierEntry[]>>(
    dataRef.current,
  );
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = React.useState<string | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

  const fetchTier = React.useCallback(
    async (tier: TierKey, options?: { force?: boolean }) => {
      setError(null);
      const hasExisting = dataRef.current[tier]?.length > 0;

      if (options?.force && hasExisting) {
        setIsLoading(false);
        setIsRefreshing(true);
      } else {
        setIsLoading(!hasExisting);
        setIsRefreshing(hasExisting);
      }

      try {
        const res = await fetch(`/api/top/${tier}?limit=${tier}`);

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));

          throw new Error(body?.error || `Request failed with ${res.status}`);
        }

        const json = (await res.json()) as any;
        const payload = Array.isArray(json) ? json : json?.data || [];
        const next = { ...dataRef.current, [tier]: payload };

        dataRef.current = next;
        setData(next);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";

        setError(message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    void fetchTier(activeTier);
  }, [activeTier, fetchTier]);

  const handleRefresh = () => {
    void fetchTier(activeTier, { force: true });
  };

  const handleSymbolClick = (symbol: string) => {
    setSelectedSymbol(symbol);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedSymbol(null);
  };

  const rows = data[activeTier];
  const lastScan = parseScanDate(rows[0]?.scan_date ?? null);

  return (
    <div className="flex h-full w-full flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-finance-green">
            Moonshot Tier Monitor
          </h1>
          <p className="text-sm text-zinc-300">
            Review algorithmic rankings across Top 25, Top 50, and Top 100.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            className="bg-finance-surface text-white border border-finance-green-40"
            isLoading={isRefreshing}
            startContent={
              <Icon className="text-lg" icon="solar:refresh-outline" />
            }
            variant="flat"
            onPress={handleRefresh}
          >
            Refresh
          </Button>
        </div>
      </div>

      <Tabs
        aria-label="Moonshot tiers"
        classNames={{
          tabList: "bg-finance-surface-60 border border-finance-green-40",
          tab: "data-[selected=true]:bg-finance-green data-[selected=true]:text-black",
        }}
        selectedKey={activeTier}
        variant="solid"
        onSelectionChange={(key) => setActiveTier(key as TierKey)}
      >
        {TIERS.map((tier) => (
          <Tab key={tier.key} title={tier.label} />
        ))}
      </Tabs>

      <div className="rounded-3xl border border-finance-green-25 bg-finance-surface-70 backdrop-blur-xl p-6 shadow-2xl">
        {isLoading ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 text-zinc-300">
            <Spinner color="success" />
            <p>Loading {TIERS.find((t) => t.key === activeTier)?.label}...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-8 text-red-200">
            <Icon className="text-3xl" icon="solar:danger-triangle-bold" />
            <p className="text-sm">{error}</p>
            <Button
              className="bg-finance-green text-black font-semibold"
              variant="flat"
              onPress={handleRefresh}
            >
              Try Again
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-zinc-300">
            <Icon className="text-3xl" icon="solar:clipboard-remove-outline" />
            <p>No records found for this tier.</p>
          </div>
        ) : (
          <Table
            removeWrapper
            aria-label="Moonshot tier table"
            className="text-white"
          >
            <TableHeader columns={COLUMNS}>
              {(column) => (
                <TableColumn
                  key={column.key}
                  className="text-xs uppercase tracking-wide text-zinc-400"
                >
                  {column.label}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody items={rows}>
              {(row) => (
                <TableRow key={`${row.symbol}-${row.rank}`}>
                  {(columnKey) => {
                    switch (columnKey) {
                      case "rank":
                        return (
                          <TableCell className="font-semibold text-finance-green">
                            {row.rank}
                          </TableCell>
                        );
                      case "symbol":
                        return (
                          <TableCell className="font-semibold text-white">
                            <div className="flex items-center gap-2">
                              <button
                                className="cursor-pointer font-semibold text-white transition-colors hover:text-finance-green hover:underline"
                                type="button"
                                onClick={() => handleSymbolClick(row.symbol)}
                              >
                                {row.symbol}
                              </button>
                              {row.trending_status ? (
                                <Chip size="sm" variant="flat">
                                  {row.trending_status}
                                </Chip>
                              ) : null}
                            </div>
                          </TableCell>
                        );
                      case "moonshot_score":
                        return (
                          <TableCell>
                            {row.moonshot_score != null
                              ? Number(row.moonshot_score).toFixed(2)
                              : "—"}
                          </TableCell>
                        );
                      case "price":
                        return (
                          <TableCell>
                            {row.price != null
                              ? `$${Number(row.price).toFixed(2)}`
                              : "—"}
                          </TableCell>
                        );
                      case "price_change_pct":
                        return (
                          <TableCell
                            className={
                              Number(row.price_change_pct ?? 0) >= 0
                                ? "text-green-400"
                                : "text-red-400"
                            }
                          >
                            {formatPercent(row.price_change_pct)}
                          </TableCell>
                        );
                      case "volume":
                        return (
                          <TableCell>{formatNumber(row.volume)}</TableCell>
                        );
                      case "volume_ratio":
                        return (
                          <TableCell>
                            {row.volume_ratio != null
                              ? `${Number(row.volume_ratio).toFixed(2)}x`
                              : "—"}
                          </TableCell>
                        );
                      case "ai_recommendation":
                        return (
                          <TableCell>
                            <Chip
                              color={recommendationColor(row.ai_recommendation)}
                              variant="flat"
                            >
                              {row.ai_recommendation || "—"}
                            </Chip>
                          </TableCell>
                        );
                      case "risk_level":
                        return (
                          <TableCell>
                            <Chip variant="bordered">
                              {row.risk_level || "—"}
                            </Chip>
                          </TableCell>
                        );
                      case "confidence_score":
                        return (
                          <TableCell>
                            {confidenceChip(row.confidence_score)}
                          </TableCell>
                        );
                      default:
                        return (
                          <TableCell>
                            {String(
                              row[columnKey as keyof MoonshotTierEntry] ?? "—",
                            )}
                          </TableCell>
                        );
                    }
                  }}
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {lastScan ? (
        <div className="flex items-center justify-end text-xs text-zinc-400">
          Last scan:{" "}
          <Tooltip content="Scan timestamp pulled from moonshot schema">
            <span className="ml-1 font-mono text-zinc-300">
              {lastScan.toLocaleString()}
            </span>
          </Tooltip>
        </div>
      ) : null}

      <SymbolAnalysisModal
        isOpen={isModalOpen}
        symbol={selectedSymbol}
        onClose={handleModalClose}
      />
    </div>
  );
}
