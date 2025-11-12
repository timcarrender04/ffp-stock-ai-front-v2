"use client";

import type {
  MoonshotConsensus,
  MoonshotRecommendation,
  MoonshotTopEntry,
} from "@/lib/services/moonshot";

import Link from "next/link";
import { Icon } from "@iconify/react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";
import { Tooltip } from "@heroui/tooltip";

import {
  formatNumber,
  formatPercent,
  formatPercentRaw,
  formatRelativeTime,
} from "@/lib/utils/formatters";

type Props = {
  top: MoonshotTopEntry[];
  consensus: MoonshotConsensus[];
  recommendations: MoonshotRecommendation[];
};

export function MoonshotOverview({ top, consensus, recommendations }: Props) {
  const leader = top[0];
  const avgScore =
    top.length > 0
      ? top.reduce((sum, item) => sum + Number(item.moonshot_score ?? 0), 0) /
        top.length
      : null;
  const avgConfidence =
    top.length > 0
      ? top.reduce((sum, item) => sum + Number(item.confidence_score ?? 0), 0) /
        top.length
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border border-finance-green-25 bg-finance-surface-70/80 shadow-2xl backdrop-blur-xl lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-finance-green-70">
                Moonshot Stack
              </p>
              <h2 className="text-xl font-semibold text-white">
                Top Signals · Live Rank Ladder
              </h2>
            </div>
            <Button
              as={Link}
              className="border border-finance-green-40 bg-finance-green text-black font-semibold"
              endContent={<Icon icon="solar:arrow-right-up-line-duotone" />}
              href="/signal-wall"
              size="sm"
              variant="flat"
            >
              Signal Wall
            </Button>
          </CardHeader>
          <CardBody className="overflow-x-auto">
            <Table
              removeWrapper
              aria-label="Moonshot top signals"
              className="min-w-[520px] text-white"
            >
              <TableHeader>
                <TableColumn>Rank</TableColumn>
                <TableColumn>Symbol</TableColumn>
                <TableColumn>Score</TableColumn>
                <TableColumn>Δ 24h</TableColumn>
                <TableColumn>Vol Ratio</TableColumn>
                <TableColumn>AI Call</TableColumn>
                <TableColumn>Risk</TableColumn>
              </TableHeader>
              <TableBody
                emptyContent="Waiting for Moonshot data…"
                items={top || []}
              >
                {(row) => (
                  <TableRow
                    key={row.id || row.symbol || `row-${Math.random()}`}
                  >
                    <TableCell className="font-semibold text-finance-green">
                      #{row.rank}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{row.symbol}</span>
                        {row.trending_status ? (
                          <Chip size="sm" variant="flat">
                            {row.trending_status}
                          </Chip>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{formatNumber(row.moonshot_score)}</TableCell>
                    <TableCell
                      className={
                        Number(row.price_change_pct ?? 0) >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {formatPercentRaw(row.price_change_pct, 2)}
                    </TableCell>
                    <TableCell>
                      {row.volume_ratio != null
                        ? `${Number(row.volume_ratio).toFixed(2)}x`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={chipColor(row.ai_recommendation)}
                        variant="flat"
                      >
                        {row.ai_recommendation ?? "—"}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip variant="bordered">{row.risk_level ?? "—"}</Chip>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        <Card className="flex flex-col gap-4 border border-finance-green-25 bg-gradient-to-br from-finance-surface-70/90 via-finance-surface-80 to-finance-surface-60 p-6 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-finance-green-70">
                Live Snapshot
              </p>
              <h3 className="text-lg font-semibold text-white">Score Pulse</h3>
            </div>
            <Icon
              className="text-3xl text-finance-green-60"
              icon="solar:satellite-outline"
            />
          </div>
          <div className="rounded-2xl border border-finance-green-30/60 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-finance-green-70">
              Leaderboard
            </p>
            {leader ? (
              <div className="mt-2 flex flex-col gap-2">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-semibold text-finance-green">
                      {leader.symbol}
                    </span>
                    {leader.ai_recommendation ? (
                      <Chip size="sm" variant="flat">
                        {leader.ai_recommendation}
                      </Chip>
                    ) : null}
                  </div>
                  <span className="text-sm text-zinc-300">
                    {formatPercentRaw(leader.price_change_pct, 2)}
                  </span>
                </div>
                <p className="text-sm text-zinc-300">
                  Confidence {formatPercent(leader.confidence_score, 0)} ·{" "}
                  {leader.trending_status ?? "neutral momentum"}
                </p>
              </div>
            ) : (
              <p className="text-sm text-zinc-400">
                No active signals detected.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              icon="solar:radar-2-line-duotone"
              label="Avg Score (Top 6)"
              value={formatNumber(avgScore, { maximumFractionDigits: 2 })}
            />
            <MetricCard
              icon="solar:shield-check-linear"
              label="Avg Confidence"
              value={formatPercent(avgConfidence, 0)}
            />
            <MetricCard
              icon="solar:graph-up-linear"
              label="Bullish Actions"
              value={
                recommendations.filter((item) =>
                  item.recommended_action?.toLowerCase().includes("buy"),
                ).length || "0"
              }
            />
            <MetricCard
              icon="solar:danger-line-duotone"
              label="Action Threshold"
              value={recommendations[0]?.moonshot_action_threshold ?? "Medium"}
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="border border-finance-green-25 bg-finance-surface-70/80 shadow-2xl backdrop-blur-xl lg:col-span-3">
          <CardHeader className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-finance-green-70">
                Consensus
              </p>
              <h3 className="text-lg font-semibold text-white">
                Agent Alignment
              </h3>
            </div>
            <Tooltip content="Compiled from master trade decisions with AI and social agents">
              <Icon
                className="text-xl text-finance-green-70"
                icon="solar:question-circle-linear"
              />
            </Tooltip>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col gap-4">
              {consensus.length === 0 ? (
                <p className="text-sm text-zinc-400">No consensus snapshots.</p>
              ) : (
                consensus.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-finance-green-30/60 bg-black/15 p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-white">
                          {item.symbol}
                        </span>
                        {item.recommended_action ? (
                          <Chip
                            color={chipColor(item.recommended_action)}
                            size="sm"
                            variant="flat"
                          >
                            {item.recommended_action}
                          </Chip>
                        ) : null}
                      </div>
                      <p className="text-xs uppercase tracking-[0.2em] text-finance-green-60">
                        {formatRelativeTime(item.decision_timestamp)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-zinc-400">Consensus</p>
                        <p className="font-semibold text-finance-green">
                          {item.moonshot_consensus ?? "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-zinc-400">Confidence</p>
                        <p className="font-semibold text-white">
                          {formatPercent(item.moonshot_confidence, 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>
        <Card className="border border-finance-green-25 bg-finance-surface-70/80 shadow-2xl backdrop-blur-xl lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-finance-green-70">
                Latest Recommendations
              </p>
              <h3 className="text-lg font-semibold text-white">
                Execution Queue
              </h3>
            </div>
            <Icon
              className="text-xl text-finance-green-60"
              icon="solar:compass-linear"
            />
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            {recommendations.length === 0 ? (
              <p className="text-sm text-zinc-400">
                No trading recommendations yet.
              </p>
            ) : (
              recommendations.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-finance-green-30/60 bg-black/15 p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-white">
                        {item.symbol}
                      </span>
                      {item.recommended_action ? (
                        <Chip
                          color={chipColor(item.recommended_action)}
                          size="sm"
                          variant="flat"
                        >
                          {item.recommended_action}
                        </Chip>
                      ) : null}
                    </div>
                    <p className="text-xs uppercase tracking-[0.2em] text-finance-green-60">
                      {formatRelativeTime(item.recommendation_timestamp)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-300">
                      <span>
                        Composite {formatNumber(item.composite_score)}
                      </span>
                      <span>TA {formatNumber(item.ta_score)}</span>
                      <span>
                        News {formatNumber(item.news_sentiment_score)}
                      </span>
                      <span>Social {formatNumber(item.social_buzz_score)}</span>
                    </div>
                  </div>
                  <div className="text-right text-xs text-zinc-400">
                    <p>Score {formatNumber(item.moonshot_score)}</p>
                    <p>24h {formatPercentRaw(item.price_change_pct_24h, 1)}</p>
                    <p>Vol {formatNumber(item.volume_ratio)}</p>
                    <p>Confidence {formatPercent(item.confidence_level, 0)}</p>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function chipColor(value: string | null | undefined) {
  if (!value) return "default" as const;
  const normalized = value.toLowerCase();

  if (normalized.includes("buy") || normalized.includes("long")) {
    return "success" as const;
  }
  if (normalized.includes("sell") || normalized.includes("short")) {
    return "danger" as const;
  }
  if (normalized.includes("hold") || normalized.includes("neutral")) {
    return "warning" as const;
  }

  return "default" as const;
}

type MetricCardProps = {
  label: string;
  value: string | number;
  icon: string;
};

function MetricCard({ label, value, icon }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-finance-green-30/50 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.2em] text-finance-green-60">
          {label}
        </p>
        <Icon className="text-lg text-finance-green-60" icon={icon} />
      </div>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
