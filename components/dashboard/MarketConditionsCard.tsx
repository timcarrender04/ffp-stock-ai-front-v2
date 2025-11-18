"use client";

import type {
  MarketBreadth,
  MarketCondition,
  MarketSentiment,
} from "@/lib/services/market";

import { Icon } from "@iconify/react";
import { Card, CardBody, CardHeader } from "@heroui/card";
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

import {
  formatCompactNumber,
  formatDateTime,
  formatNumber,
  formatPercentSmart,
} from "@/lib/utils/formatters";

type Props = {
  condition: MarketCondition | null;
  breadth: MarketBreadth[];
  sentiment: MarketSentiment[];
};

export function MarketConditionsCard({ condition, breadth, sentiment }: Props) {
  const latestSentiment = sentiment[0] ?? null;
  const trend = condition?.market_trend ?? "Unknown";

  return (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
      <Card className="border border-finance-green-25 bg-gradient-to-br from-finance-surface-70/90 via-finance-surface-80 to-finance-surface-60 p-4 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-finance-green-70">
              Market Pulse
            </p>
            <h3 className="text-base sm:text-lg font-semibold text-white">
              Conditions Overview
            </h3>
          </div>
          <Icon
            className="text-2xl sm:text-3xl text-finance-green-60"
            icon="solar:global-linear"
          />
        </div>
        <div className="mt-4 sm:mt-6 grid gap-3 sm:gap-4">
          <div className="rounded-2xl border border-finance-green-30/60 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-finance-green-60">
              Trend Profile
            </p>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Chip
                  color={
                    trend.toLowerCase().includes("bull")
                      ? "success"
                      : trend.toLowerCase().includes("bear")
                        ? "danger"
                        : "warning"
                  }
                  variant="flat"
                >
                  {trend}
                </Chip>
                <span className="text-sm text-zinc-300">
                  Strength {formatPercentSmart(condition?.trend_strength, 0)}
                </span>
              </div>
              <span suppressHydrationWarning className="text-xs text-zinc-400">
                {formatDateTime(condition?.updated_at ?? condition?.created_at)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Metric
              icon="solar:shield-up-linear"
              label="VIX Level"
              value={formatNumber(condition?.vix_level, {
                maximumFractionDigits: 2,
              })}
            />
            <Metric
              icon="solar:activity-line-duotone"
              label="Volatility Percentile"
              value={formatPercentSmart(condition?.volatility_percentile, 0)}
            />
            <Metric
              icon="solar:diagram-up-line-duotone"
              label="Put/Call Ratio"
              value={formatNumber(condition?.put_call_ratio, {
                maximumFractionDigits: 2,
              })}
            />
            <Metric
              icon="solar:emoji-funny-linear"
              label="Fear & Greed"
              value={formatNumber(condition?.fear_greed_index)}
            />
          </div>

          <div className="rounded-2xl border border-finance-green-30/60 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-finance-green-60">
              ETF Correlation
            </p>
            <div className="mt-3 flex flex-col gap-3">
              <CorrelationBar
                label="S&P 500"
                value={condition?.spy_correlation}
              />
              <CorrelationBar
                label="NASDAQ 100"
                value={condition?.qqq_correlation}
              />
              <CorrelationBar
                label="Russell 2000"
                value={condition?.iwm_correlation}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="border border-finance-green-25 bg-finance-surface-70/80 shadow-2xl backdrop-blur-xl">
        <CardHeader className="flex items-center justify-between p-3 sm:p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-finance-green-70">
              Market Breadth
            </p>
            <h3 className="text-base sm:text-lg font-semibold text-white">
              Advance / Decline
            </h3>
          </div>
          <Icon
            className="text-xl sm:text-2xl text-finance-green"
            icon="solar:graph-up-line-duotone"
          />
        </CardHeader>
        <CardBody className="p-3 sm:p-4">
          <div className="overflow-x-auto">
            <Table
              removeWrapper
              aria-label="Market breadth table"
              className="min-w-[360px]"
            >
              <TableHeader>
                <TableColumn>Date</TableColumn>
                <TableColumn>Adv</TableColumn>
                <TableColumn>Dec</TableColumn>
                <TableColumn>Up Vol</TableColumn>
                <TableColumn>Down Vol</TableColumn>
              </TableHeader>
              <TableBody
                emptyContent="No breadth data"
                items={breadth.slice(0, 5)}
              >
                {(row) => (
                  <TableRow key={row.date}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>
                      {formatCompactNumber(row.advancing_issues)}
                    </TableCell>
                    <TableCell>
                      {formatCompactNumber(row.declining_issues)}
                    </TableCell>
                    <TableCell>{formatCompactNumber(row.up_volume)}</TableCell>
                    <TableCell>
                      {formatCompactNumber(row.down_volume)}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardBody>
      </Card>

      <Card className="border border-finance-green-25 bg-finance-surface-70/80 shadow-2xl backdrop-blur-xl">
        <CardHeader className="flex items-center justify-between p-3 sm:p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-finance-green-70">
              Sentiment Deck
            </p>
            <h3 className="text-base sm:text-lg font-semibold text-white">
              Crowd Temperature
            </h3>
          </div>
          <Icon
            className="text-xl sm:text-2xl text-finance-green"
            icon="solar:emoji-funny-square-line-duotone"
          />
        </CardHeader>
        <CardBody className="flex flex-col gap-3 sm:gap-4 p-3 sm:p-4">
          {latestSentiment ? (
            <>
              <div className="rounded-2xl border border-finance-green-30/60 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-finance-green-60">
                  Sentiment Score
                </p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {formatNumber(latestSentiment.sentiment_score, {
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-zinc-400">
                  Bull-Bear Spread{" "}
                  {formatPercentSmart(latestSentiment.bull_minus_bear, 1)}
                </p>
              </div>
              <div className="rounded-2xl border border-finance-green-30/60 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-finance-green-60">
                  Recent Trend
                </p>
                <div className="mt-2 overflow-x-auto">
                  <Table
                    removeWrapper
                    aria-label="Market sentiment trend"
                    className="min-w-[260px]"
                  >
                    <TableHeader>
                      <TableColumn>Date</TableColumn>
                      <TableColumn>Score</TableColumn>
                      <TableColumn>Crowd</TableColumn>
                    </TableHeader>
                    <TableBody items={sentiment.slice(0, 5)}>
                      {(row) => (
                        <TableRow key={row.date}>
                          <TableCell>{row.date}</TableCell>
                          <TableCell>
                            {formatNumber(row.sentiment_score, {
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell>
                            {formatPercentSmart(row.crowd_sentiment, 0)}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-zinc-400">
              No sentiment data available.
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

type MetricProps = {
  label: string;
  value: string;
  icon: string;
};

function Metric({ label, value, icon }: MetricProps) {
  return (
    <div className="rounded-2xl border border-finance-green-30/60 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-finance-green-60">
        {label}
      </p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-2xl font-semibold text-white">{value}</span>
        <Icon className="text-lg text-finance-green-60" icon={icon} />
      </div>
    </div>
  );
}

type CorrelationBarProps = {
  label: string;
  value: number | null | undefined;
};

function CorrelationBar({ label, value }: CorrelationBarProps) {
  const numeric = typeof value === "number" ? value : null;
  const percent =
    numeric !== null ? Math.max(0, Math.min(100, numeric * 100)) : null;

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-zinc-300">
        <span>{label}</span>
        <span>{percent !== null ? `${percent.toFixed(0)}%` : "—"}</span>
      </div>
      <Progress
        isStriped
        aria-label={`${label} correlation`}
        className="mt-1"
        color="success"
        value={percent ?? 0}
      />
    </div>
  );
}
