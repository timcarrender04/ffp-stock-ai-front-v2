"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";

import { SymbolAnalysisModal } from "./SymbolAnalysisModal";

type PreMarketEntry = {
  symbol: string;
  total_score: number | null;
  recommendation: string | null;
  confidence: string | null;
  summary: string | null;
  news_sentiment: string | null;
  news_score: number | null;
  gap_pct: number | null;
  gap_type: string | null;
  catalyst_type: string | null;
  risk_factors: string[] | null;
  entry_points: Record<string, number> | null;
  spy_gap_pct: number | null;
  qqq_gap_pct: number | null;
  market_sentiment: string | null;
  analysis_date: string | null;
  analyzed_at: string | null;
};

const ENDPOINT = "/api/pre-market?limit=20&min_score=6";

export function PreMarketSnapshot() {
  const [entries, setEntries] = React.useState<PreMarketEntry[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [modalSymbol, setModalSymbol] = React.useState<string | null>(null);
  const [analysisDate, setAnalysisDate] = React.useState<string | null>(null);
  const [copyState, setCopyState] = React.useState<"idle" | "copied" | "error">(
    "idle",
  );

  React.useEffect(() => {
    const controller = new AbortController();

    async function loadPreMarket() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(ENDPOINT, { signal: controller.signal });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));

          throw new Error(
            body?.error || `Request failed with ${response.status}`,
          );
        }

        const json = await response.json();
        const payload = Array.isArray(json)
          ? (json as PreMarketEntry[])
          : Array.isArray((json as { data?: unknown }).data)
            ? (json as { data: PreMarketEntry[] }).data
            : [];

        setEntries(payload);
        setAnalysisDate(payload?.[0]?.analysis_date ?? null);
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load pre-market data",
          );
        }
      } finally {
        setLoading(false);
      }
    }

    void loadPreMarket();

    return () => controller.abort();
  }, []);

  const handleCopy = React.useCallback(async () => {
    if (
      !entries.length ||
      typeof navigator === "undefined" ||
      !navigator.clipboard
    ) {
      return;
    }

    const top = entries.slice(0, 5);
    const headlineDate = analysisDate ?? new Date().toISOString().slice(0, 10);
    const first = entries[0];

    const metaParts: string[] = [];

    if (first?.market_sentiment) {
      metaParts.push(`Sentiment: ${capitalize(first.market_sentiment)}`);
    }
    if (typeof first?.spy_gap_pct === "number") {
      metaParts.push(`SPY ${formatPercent(first.spy_gap_pct)}`);
    }
    if (typeof first?.qqq_gap_pct === "number") {
      metaParts.push(`QQQ ${formatPercent(first.qqq_gap_pct)}`);
    }

    const lines = top.map((entry, index) => {
      const summary = entry.summary ? ` - ${entry.summary}` : "";
      const action = entry.recommendation ?? "WATCH";
      const gap =
        typeof entry.gap_pct === "number" ? formatPercent(entry.gap_pct) : "—";

      return `${index + 1}. ${entry.symbol} (${action}, gap ${gap})${summary}`;
    });

    const text = [
      `Pre-Market Rundown (${headlineDate})`,
      metaParts.join(" • "),
      "",
      ...lines,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2500);
    } catch {
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 2500);
    }
  }, [analysisDate, entries]);

  const first = entries[0];

  return (
    <Card className="border border-finance-green-30 bg-finance-surface-80/90 text-white">
      <CardHeader className="flex flex-col gap-3 border-b border-finance-green-30/50 p-4 sm:p-6 pb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <Icon
            className="text-xl sm:text-2xl text-finance-green"
            icon="solar:sunrise-line-duotone"
          />
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-[0.3em] text-finance-green-70">
              Pre-market briefing
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold">
              Morning Snapshot
            </h2>
            {analysisDate ? (
              <span className="text-xs text-zinc-400">Run {analysisDate}</span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {copyState === "copied" ? (
            <Chip color="success" size="sm" variant="flat">
              Copied!
            </Chip>
          ) : copyState === "error" ? (
            <Chip color="danger" size="sm" variant="flat">
              Copy failed
            </Chip>
          ) : null}
          <Button
            className="border border-finance-green-40 bg-finance-surface px-4 text-sm font-semibold text-white"
            isDisabled={!entries.length}
            startContent={<Icon className="text-lg" icon="solar:copy-bold" />}
            variant="flat"
            onPress={handleCopy}
          >
            Copy Morning Rundown
          </Button>
        </div>
      </CardHeader>
      <CardBody className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-zinc-300">
            <Spinner color="success" />
            <p>Syncing latest AI run…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-6 text-red-200">
            <Icon className="text-3xl" icon="solar:danger-triangle-bold" />
            <p className="text-sm text-center">{error}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-zinc-300">
            <Icon className="text-3xl" icon="solar:clock-circle-outline" />
            <p>No pre-market highlights yet. Check back after the next scan.</p>
          </div>
        ) : (
          <React.Fragment>
            <div className="grid gap-3 sm:gap-4 grid-cols-2">
              <HighlightStat
                icon="solar:chart-square-line-duotone"
                label="Market Sentiment"
                value={
                  first?.market_sentiment
                    ? capitalize(first.market_sentiment)
                    : "Neutral"
                }
              />
              <HighlightStat
                icon="solar:statistic-up-line-duotone"
                label="SPY Gap"
                value={formatPercent(first?.spy_gap_pct)}
              />
              <HighlightStat
                icon="solar:statistic-down-line-duotone"
                label="QQQ Gap"
                value={formatPercent(first?.qqq_gap_pct)}
              />
              <HighlightStat
                icon="solar:bookmark-square-minimalistic-line-duotone"
                label="Records"
                value={`${entries.length} tickers`}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {entries.slice(0, 9).map((entry) => (
                <article
                  key={`${entry.symbol}-${entry.analyzed_at ?? "na"}`}
                  className="rounded-2xl border border-finance-green-20 bg-finance-surface-70/80 p-3 sm:p-4 shadow-lg backdrop-blur"
                >
                  <header className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <button
                        className="text-left text-xl font-semibold text-white transition hover:text-finance-green focus:outline-none focus:ring-1 focus:ring-finance-green"
                        type="button"
                        onClick={() => setModalSymbol(entry.symbol)}
                      >
                        {entry.symbol}
                      </button>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                        {entry.recommendation ? (
                          <Chip color="success" size="sm" variant="flat">
                            {entry.recommendation}
                          </Chip>
                        ) : null}
                        {entry.confidence ? (
                          <Chip size="sm" variant="bordered">
                            {entry.confidence}
                          </Chip>
                        ) : null}
                        {entry.catalyst_type ? (
                          <Chip size="sm" variant="bordered">
                            {entry.catalyst_type}
                          </Chip>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-finance-green">
                        Score{" "}
                        {typeof entry.total_score === "number"
                          ? entry.total_score.toFixed(1)
                          : "—"}
                      </div>
                      <div className="text-xs text-zinc-400">
                        Gap {formatPercent(entry.gap_pct)}
                      </div>
                    </div>
                  </header>
                  {entry.summary ? (
                    <p className="text-sm leading-5 text-zinc-200">
                      {entry.summary}
                    </p>
                  ) : (
                    <p className="text-sm text-zinc-400">
                      No summary available.
                    </p>
                  )}
                  {entry.risk_factors && entry.risk_factors.length > 0 ? (
                    <ul className="mt-3 space-y-1 text-xs text-zinc-400">
                      {entry.risk_factors.slice(0, 3).map((risk) => (
                        <li key={risk} className="flex items-center gap-2">
                          <Icon
                            className="text-base text-yellow-400"
                            icon="solar:danger-line-duotone"
                          />
                          {risk}
                        </li>
                      ))}
                      {entry.risk_factors.length > 3 ? (
                        <li className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                          +{entry.risk_factors.length - 3} more
                        </li>
                      ) : null}
                    </ul>
                  ) : null}
                  <footer className="mt-4 flex items-center justify-between">
                    <Button
                      className="border border-finance-green-40 bg-finance-surface text-white"
                      size="sm"
                      variant="flat"
                      onPress={() => setModalSymbol(entry.symbol)}
                    >
                      View Analysis
                    </Button>
                    {entry.entry_points ? (
                      <div className="text-right text-xs text-zinc-400">
                        {entry.entry_points?.aggressive !== undefined ? (
                          <p>
                            Entry {formatPrice(entry.entry_points?.aggressive)}
                          </p>
                        ) : null}
                        {entry.entry_points?.stop_loss !== undefined ? (
                          <p>
                            Stop {formatPrice(entry.entry_points?.stop_loss)}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </footer>
                </article>
              ))}
            </div>
          </React.Fragment>
        )}
      </CardBody>

      <SymbolAnalysisModal
        isOpen={Boolean(modalSymbol)}
        symbol={modalSymbol}
        onClose={() => setModalSymbol(null)}
      />
    </Card>
  );
}

function formatPercent(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  const numeric = typeof value === "string" ? Number(value) : value;

  if (!Number.isFinite(numeric)) {
    return "—";
  }

  const sign = numeric >= 0 ? "+" : "";

  return `${sign}${numeric.toFixed(2)}%`;
}

function formatPrice(value: number | string | undefined) {
  if (value === undefined || value === null) {
    return "—";
  }

  const numeric = typeof value === "string" ? Number(value) : value;

  if (!Number.isFinite(numeric)) {
    return "—";
  }

  return `$${numeric.toFixed(2)}`;
}

function capitalize(value: string) {
  if (!value) {
    return "";
  }

  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

type HighlightStatProps = {
  icon: string;
  label: string;
  value: string;
};

function HighlightStat({ icon, label, value }: HighlightStatProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-finance-green-20 bg-finance-surface-70/70 p-3">
      <Icon className="text-2xl text-finance-green" icon={icon} />
      <div className="flex flex-col">
        <span className="text-xs uppercase tracking-[0.25em] text-finance-green-70">
          {label}
        </span>
        <span className="text-lg font-semibold text-white">{value}</span>
      </div>
    </div>
  );
}
