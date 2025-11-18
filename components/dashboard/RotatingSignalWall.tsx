"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";
import { Spinner } from "@heroui/spinner";

const ROTATION_INTERVAL_MS = 1000 * 10; // 10 seconds per pane

type PaneKey = "top25" | "top50" | "top100" | "recommendations";

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
  risk_level: string | null;
  confidence_score: number | string | null;
  trending_status: string | null;
};

type TradingRecommendation = {
  id: number;
  symbol: string;
  recommendation_date: string | null;
  recommendation_type: string | null;
  entry_tier: string | null;
  recommended_action: string | null;
  enhanced_composite_score: number | null;
  social_composite_score: number | null;
  social_signal_strength: string | null;
  social_trend_direction: string | null;
  auto_trade: boolean | null;
  confidence: string | null;
  position_size: number | null;
  entry_price: number | null;
  stop_loss: number | null;
  target_price: number | null;
  reason: string | null;
  created_at: string | null;
};

type PaneConfig = {
  key: PaneKey;
  label: string;
  description: string;
  endpoint: string;
  kind: "tier" | "recommendation";
};

const PANES: PaneConfig[] = [
  {
    key: "top25",
    label: "Top 25",
    description: "Highest conviction Moonshot ideas (auto-refresh)",
    endpoint: "/api/top/25?limit=25",
    kind: "tier",
  },
  {
    key: "top50",
    label: "Top 50",
    description: "Broader momentum cohort for monitoring",
    endpoint: "/api/top/50?limit=50",
    kind: "tier",
  },
  {
    key: "top100",
    label: "Top 100",
    description: "Entire universe tracked by Moonshot scanner",
    endpoint: "/api/top/100?limit=100",
    kind: "tier",
  },
  {
    key: "recommendations",
    label: "Trading Recommendations",
    description: "Unified trade tickets ready for execution",
    endpoint: "/api/trading-recommendations?limit=25",
    kind: "recommendation",
  },
];

type PaneData = {
  top25: MoonshotTierEntry[];
  top50: MoonshotTierEntry[];
  top100: MoonshotTierEntry[];
  recommendations: TradingRecommendation[];
};

type PaneBooleanMap = Record<PaneKey, boolean>;

type PaneStringMap = Record<PaneKey, string | null>;

const INITIAL_DATA: PaneData = {
  top25: [],
  top50: [],
  top100: [],
  recommendations: [],
};

const INITIAL_BOOLEAN_MAP: PaneBooleanMap = {
  top25: false,
  top50: false,
  top100: false,
  recommendations: false,
};

const INITIAL_STRING_MAP: PaneStringMap = {
  top25: null,
  top50: null,
  top100: null,
  recommendations: null,
};

function formatPercent(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  const numeric = Number(value);

  if (Number.isNaN(numeric)) {
    return String(value);
  }

  return `${numeric >= 0 ? "+" : ""}${numeric.toFixed(2)}%`;
}

function formatNumber(value: number | string | null | undefined) {
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

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

function confidenceChip(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return (
      <Chip size="sm" variant="bordered">
        —
      </Chip>
    );
  }

  const numeric = Number(value);

  if (Number.isNaN(numeric)) {
    return (
      <Chip size="sm" variant="bordered">
        {String(value)}
      </Chip>
    );
  }

  const color =
    numeric >= 0.7 ? "success" : numeric >= 0.4 ? "warning" : "danger";

  return (
    <Chip color={color} size="sm" variant="flat">
      {Math.round(numeric * 100)}%
    </Chip>
  );
}

function getNextPane(current: PaneKey): PaneKey {
  const currentIndex = PANES.findIndex((pane) => pane.key === current);
  const nextIndex = (currentIndex + 1) % PANES.length;

  return PANES[nextIndex]?.key ?? current;
}

function getPreviousPane(current: PaneKey): PaneKey {
  const currentIndex = PANES.findIndex((pane) => pane.key === current);
  const previousIndex = (currentIndex - 1 + PANES.length) % PANES.length;

  return PANES[previousIndex]?.key ?? current;
}

export function RotatingSignalWall() {
  const [activePane, setActivePane] = React.useState<PaneKey>(
    PANES[0]?.key ?? "top25",
  );
  const [data, setData] = React.useState<PaneData>(INITIAL_DATA);
  const [loading, setLoading] =
    React.useState<PaneBooleanMap>(INITIAL_BOOLEAN_MAP);
  const [errors, setErrors] = React.useState<PaneStringMap>(INITIAL_STRING_MAP);
  const [lastUpdated, setLastUpdated] =
    React.useState<PaneStringMap>(INITIAL_STRING_MAP);
  const [elapsed, setElapsed] = React.useState<number>(0);

  const fetchPane = React.useCallback(
    async (pane: PaneKey, options: { force?: boolean } = {}) => {
      const { force = false } = options;

      if (!force && data[pane].length > 0) {
        return;
      }

      setErrors((prev) => ({ ...prev, [pane]: null }));
      setLoading((prev) => ({ ...prev, [pane]: true }));

      const config = PANES.find((item) => item.key === pane);

      if (!config) {
        setErrors((prev) => ({ ...prev, [pane]: "Unknown pane" }));
        setLoading((prev) => ({ ...prev, [pane]: false }));

        return;
      }

      try {
        const response = await fetch(config.endpoint);

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));

          throw new Error(
            body?.error || `Request failed with ${response.status}`,
          );
        }

        const json = await response.json();
        const payload = Array.isArray(json) ? json : json?.data || [];

        setData((prev) => ({
          ...prev,
          [pane]: payload,
        }));
        setLastUpdated((prev) => ({
          ...prev,
          [pane]: new Date().toISOString(),
        }));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";

        setErrors((prev) => ({ ...prev, [pane]: message }));
      } finally {
        setLoading((prev) => ({ ...prev, [pane]: false }));
      }
    },
    [data],
  );

  React.useEffect(() => {
    void fetchPane(activePane);
  }, [activePane, fetchPane]);

  React.useEffect(() => {
    setElapsed(0);

    const progressInterval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 500;

        return next >= ROTATION_INTERVAL_MS ? ROTATION_INTERVAL_MS : next;
      });
    }, 500);

    const rotationTimeout = setTimeout(() => {
      setActivePane((prev) => getNextPane(prev));
    }, ROTATION_INTERVAL_MS);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(rotationTimeout);
    };
  }, [activePane]);

  const handleNext = React.useCallback(() => {
    setActivePane((prev) => getNextPane(prev));
  }, []);

  const handlePrevious = React.useCallback(() => {
    setActivePane((prev) => getPreviousPane(prev));
  }, []);

  const handleRefresh = React.useCallback(() => {
    void fetchPane(activePane, { force: true });
    setElapsed(0);
  }, [activePane, fetchPane]);

  const activeConfig =
    PANES.find((pane) => pane.key === activePane) ?? PANES[0];
  const rows = data[activePane];
  const isLoading = loading[activePane];
  const error = errors[activePane];
  const lastUpdatedAt = lastUpdated[activePane];
  const progress = Math.min((elapsed / ROTATION_INTERVAL_MS) * 100, 100);

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-xs sm:text-sm uppercase tracking-[0.3em] text-finance-green-70">
            24/7 rotation
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white">
            Live Signal Wall
          </h1>
          <p className="max-w-2xl text-xs sm:text-sm text-zinc-300">
            Auto-cycles through Moonshot tiers and the unified trading
            recommendations feed. Refreshes every 10 seconds to keep the trading
            desk synced around the clock.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            className="border border-finance-green-40 bg-finance-surface text-white"
            startContent={
              <Icon className="text-lg" icon="solar:arrow-left-linear" />
            }
            variant="flat"
            onPress={handlePrevious}
          >
            Prev
          </Button>
          <Button
            className="border border-finance-green-40 bg-finance-surface text-white"
            endContent={
              <Icon className="text-lg" icon="solar:arrow-right-linear" />
            }
            variant="flat"
            onPress={handleNext}
          >
            Next
          </Button>
          <Button
            className="border border-finance-green-60 bg-finance-green text-black font-semibold"
            isLoading={isLoading}
            startContent={
              <Icon className="text-lg" icon="solar:refresh-outline" />
            }
            variant="flat"
            onPress={handleRefresh}
          >
            Refresh
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col">
            <h2 className="text-2xl font-semibold text-finance-green">
              {activeConfig?.label}
            </h2>
            <p className="text-sm text-zinc-300">{activeConfig?.description}</p>
          </div>
          <Progress
            aria-label="Rotation progress"
            className="min-w-[200px]"
            color="success"
            value={progress}
          />
        </div>

        <div className="rounded-3xl border border-finance-green-30 bg-finance-surface-80 p-4 sm:p-6 shadow-2xl backdrop-blur-xl overflow-x-auto">
          {isLoading && rows.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 text-zinc-300">
              <Spinner color="success" />
              <p>Fetching {activeConfig?.label}...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-8 text-red-200">
              <Icon className="text-3xl" icon="solar:danger-triangle-bold" />
              <p className="text-sm text-center max-w-sm">{error}</p>
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
              <Icon
                className="text-3xl"
                icon="solar:clipboard-remove-outline"
              />
              <p>No live records found. Waiting for the next scan.</p>
            </div>
          ) : activeConfig?.kind === "tier" ? (
            <TierTable rows={rows as MoonshotTierEntry[]} />
          ) : (
            <RecommendationTable rows={rows as TradingRecommendation[]} />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-2">
            <Icon
              className="text-base text-finance-green"
              icon="solar:clock-circle-outline"
            />
            Next rotation in{" "}
            {Math.max(0, Math.round((ROTATION_INTERVAL_MS - elapsed) / 1000))}s
          </span>
          {lastUpdatedAt ? (
            <span className="inline-flex items-center gap-2 font-mono">
              <Icon
                className="text-base text-finance-green"
                icon="solar:history-line-duotone"
              />
              Updated {formatDate(lastUpdatedAt)}
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}

type TierTableProps = {
  rows: MoonshotTierEntry[];
};

function TierTable({ rows }: TierTableProps) {
  const columns: { key: keyof MoonshotTierEntry; label: string }[] = [
    { key: "rank", label: "Rank" },
    { key: "symbol", label: "Symbol" },
    { key: "moonshot_score", label: "Score" },
    { key: "price", label: "Price" },
    { key: "price_change_pct", label: "Δ%" },
    { key: "volume", label: "Volume" },
    { key: "volume_ratio", label: "Vol Ratio" },
    { key: "ai_recommendation", label: "AI" },
    { key: "risk_level", label: "Risk" },
    { key: "confidence_score", label: "Confidence" },
  ];

  return (
    <div className="overflow-x-auto">
      <Table
        removeWrapper
        aria-label="Tier data"
        className="text-white min-w-[800px]"
      >
        <TableHeader columns={columns}>
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
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-2">
                          <span>{row.symbol}</span>
                          {row.trending_status ? (
                            <Chip color="success" size="sm" variant="flat">
                              {row.trending_status}
                            </Chip>
                          ) : null}
                        </div>
                      </TableCell>
                    );
                  case "moonshot_score":
                    return (
                      <TableCell>
                        {Number(row.moonshot_score ?? 0).toFixed(2)}
                      </TableCell>
                    );
                  case "price":
                    return (
                      <TableCell>
                        ${Number(row.price ?? 0).toFixed(2)}
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
                    return <TableCell>{formatNumber(row.volume)}</TableCell>;
                  case "volume_ratio":
                    return (
                      <TableCell>
                        {Number(row.volume_ratio ?? 0).toFixed(2)}x
                      </TableCell>
                    );
                  case "ai_recommendation":
                    return (
                      <TableCell>
                        <Chip color="success" size="sm" variant="flat">
                          {row.ai_recommendation ?? "—"}
                        </Chip>
                      </TableCell>
                    );
                  case "risk_level":
                    return (
                      <TableCell>
                        <Chip size="sm" variant="bordered">
                          {row.risk_level ?? "—"}
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
    </div>
  );
}

type RecommendationTableProps = {
  rows: TradingRecommendation[];
};

function RecommendationTable({ rows }: RecommendationTableProps) {
  const columns: {
    key: keyof TradingRecommendation | "signals";
    label: string;
  }[] = [
    { key: "symbol", label: "Symbol" },
    { key: "entry_tier", label: "Tier" },
    { key: "enhanced_composite_score", label: "Score" },
    { key: "recommended_action", label: "Action" },
    { key: "auto_trade", label: "Auto" },
    { key: "position_size", label: "Size" },
    { key: "entry_price", label: "Entry" },
    { key: "stop_loss", label: "Stop" },
    { key: "target_price", label: "Target" },
    { key: "signals", label: "Signals" },
  ];

  return (
    <div className="overflow-x-auto">
      <Table
        removeWrapper
        aria-label="Trading recommendations"
        className="text-white min-w-[800px]"
      >
        <TableHeader columns={columns}>
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
            <TableRow key={row.id}>
              {(columnKey) => {
                switch (columnKey) {
                  case "symbol":
                    return (
                      <TableCell className="font-semibold">
                        <div className="flex flex-col gap-1">
                          <span className="text-lg">{row.symbol}</span>
                          <span className="text-[10px] uppercase tracking-[0.25em] text-finance-green-70">
                            {row.recommendation_type ?? "—"}
                          </span>
                        </div>
                      </TableCell>
                    );
                  case "entry_tier":
                    return (
                      <TableCell>
                        <Chip
                          color={
                            row.entry_tier === "STRONG_BUY"
                              ? "success"
                              : row.entry_tier === "BUY"
                                ? "warning"
                                : "default"
                          }
                          size="sm"
                          variant="flat"
                        >
                          {row.entry_tier ?? "—"}
                        </Chip>
                      </TableCell>
                    );
                  case "enhanced_composite_score":
                    return (
                      <TableCell>
                        {typeof row.enhanced_composite_score === "number"
                          ? row.enhanced_composite_score.toFixed(2)
                          : "—"}
                      </TableCell>
                    );
                  case "recommended_action":
                    return (
                      <TableCell>
                        <Chip color="success" size="sm" variant="flat">
                          {row.recommended_action ?? "—"}
                        </Chip>
                      </TableCell>
                    );
                  case "auto_trade":
                    return (
                      <TableCell>
                        <Chip
                          color={row.auto_trade ? "success" : "default"}
                          size="sm"
                          variant="flat"
                        >
                          {row.auto_trade ? "Auto" : "Manual"}
                        </Chip>
                      </TableCell>
                    );
                  case "position_size":
                    return (
                      <TableCell>
                        {typeof row.position_size === "number"
                          ? `$${formatNumber(row.position_size)}`
                          : "—"}
                      </TableCell>
                    );
                  case "entry_price":
                    return (
                      <TableCell>
                        {typeof row.entry_price === "number"
                          ? `$${row.entry_price.toFixed(2)}`
                          : "—"}
                      </TableCell>
                    );
                  case "stop_loss":
                    return (
                      <TableCell>
                        {typeof row.stop_loss === "number"
                          ? `$${row.stop_loss.toFixed(2)}`
                          : "—"}
                      </TableCell>
                    );
                  case "target_price":
                    return (
                      <TableCell>
                        {typeof row.target_price === "number"
                          ? `$${row.target_price.toFixed(2)}`
                          : "—"}
                      </TableCell>
                    );
                  case "signals":
                    return (
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-300">
                          {row.social_signal_strength ? (
                            <Chip color="success" size="sm" variant="bordered">
                              {row.social_signal_strength}
                            </Chip>
                          ) : null}
                          {row.social_trend_direction ? (
                            <Chip size="sm" variant="bordered">
                              {row.social_trend_direction}
                            </Chip>
                          ) : null}
                          {typeof row.social_composite_score === "number" ? (
                            <Chip color="warning" size="sm" variant="flat">
                              Social {row.social_composite_score.toFixed(1)}
                            </Chip>
                          ) : null}
                        </div>
                        {row.reason ? (
                          <p className="mt-2 line-clamp-2 text-xs text-zinc-400">
                            {row.reason}
                          </p>
                        ) : null}
                      </TableCell>
                    );
                  default:
                    return (
                      <TableCell>
                        {String(
                          row[columnKey as keyof TradingRecommendation] ?? "—",
                        )}
                      </TableCell>
                    );
                }
              }}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
