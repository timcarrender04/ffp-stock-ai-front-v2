"use client";

import type {
  DailyScalpOrder,
  DailyScalpPerformance,
  DailyScalpPosition,
} from "@/lib/services/dailyScalp";

import { Icon } from "@iconify/react";
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

import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatPercent,
} from "@/lib/utils/formatters";

type Props = {
  performance: DailyScalpPerformance[];
  positions: DailyScalpPosition[];
  orders: DailyScalpOrder[];
};

export function DailyScalpPanel({ performance, positions, orders }: Props) {
  const today = performance[0];
  const pnlTrend = performance.slice(0, 4);

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="border border-finance-green-25 bg-finance-surface-70/80 shadow-2xl backdrop-blur-xl lg:col-span-3">
        <CardHeader className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-finance-green-70">
              Daily Scalp
            </p>
            <h3 className="text-lg font-semibold text-white">
              Performance Radar
            </h3>
          </div>
          <Icon
            className="text-2xl text-finance-green"
            icon="solar:pulse-line-duotone"
          />
        </CardHeader>
        <CardBody>
          <div className="grid gap-4 lg:grid-cols-3">
            <MetricBlock
              accent={Number(today?.net_pnl ?? 0) >= 0 ? "success" : "danger"}
              helper={`Gross ${formatCurrency(today?.gross_pnl)}`}
              label="Net PnL (Today)"
              value={formatCurrency(today?.net_pnl)}
            />
            <MetricBlock
              accent="success"
              helper={`${formatNumber(today?.winning_trades, { maximumFractionDigits: 0 })} winners / ${formatNumber(today?.total_trades, { maximumFractionDigits: 0 })} trades`}
              label="Win Rate"
              value={formatPercent(today?.win_rate, 0)}
            />
            <MetricBlock
              accent="warning"
              helper={`Avg win ${formatCurrency(today?.avg_win)} · Avg loss ${formatCurrency(today?.avg_loss)}`}
              label="Profit Factor"
              value={formatNumber(today?.profit_factor, {
                maximumFractionDigits: 2,
              })}
            />
          </div>
          <div className="mt-6 rounded-2xl border border-finance-green-30/60 bg-black/15 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-finance-green-70">
              Recent Trend
            </p>
            <Table
              removeWrapper
              aria-label="Daily scalp performance trend"
              className="mt-3 min-w-[420px]"
            >
              <TableHeader>
                <TableColumn>Date</TableColumn>
                <TableColumn>Trades</TableColumn>
                <TableColumn>Net PnL</TableColumn>
                <TableColumn>Win Rate</TableColumn>
                <TableColumn>Sharpe</TableColumn>
              </TableHeader>
              <TableBody
                emptyContent="Waiting for scalp data."
                items={pnlTrend}
              >
                {(row) => (
                  <TableRow key={row.trade_date}>
                    <TableCell>{row.trade_date}</TableCell>
                    <TableCell>
                      {formatNumber(row.total_trades, {
                        maximumFractionDigits: 0,
                      })}
                    </TableCell>
                    <TableCell
                      className={
                        Number(row.net_pnl ?? 0) >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {formatCurrency(row.net_pnl)}
                    </TableCell>
                    <TableCell>{formatPercent(row.win_rate, 0)}</TableCell>
                    <TableCell>
                      {formatNumber(row.sharpe_ratio, {
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardBody>
      </Card>

      <div className="flex flex-col gap-6 lg:col-span-2">
        <Card className="border border-finance-green-25 bg-finance-surface-70/80 shadow-2xl backdrop-blur-xl">
          <CardHeader className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-finance-green-70">
                Active Positions
              </p>
              <h3 className="text-lg font-semibold text-white">Live Trades</h3>
            </div>
            <Icon
              className="text-xl text-finance-green-60"
              icon="solar:target-line-duotone"
            />
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            {positions.length === 0 ? (
              <p className="text-sm text-zinc-400">No open positions.</p>
            ) : (
              positions.map((position) => (
                <div
                  key={position.id}
                  className="flex flex-col gap-2 rounded-2xl border border-finance-green-30/60 bg-black/15 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-white">
                        {position.symbol}
                      </span>
                      <Chip
                        color={
                          position.side.toLowerCase() === "long"
                            ? "success"
                            : "danger"
                        }
                        size="sm"
                        variant="flat"
                      >
                        {position.side}
                      </Chip>
                    </div>
                    <p className="text-xs text-zinc-400">
                      {formatDateTime(position.entry_timestamp)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-zinc-300">
                    <p>
                      Size:{" "}
                      <span className="font-semibold">{position.quantity}</span>
                    </p>
                    <p>Entry: {formatCurrency(position.avg_entry_price)}</p>
                    <p>Current: {formatCurrency(position.current_price)}</p>
                    <p>
                      PnL:{" "}
                      <span
                        className={
                          Number(position.unrealized_pnl ?? 0) >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {formatCurrency(position.unrealized_pnl)}
                      </span>
                    </p>
                    <p>Stop: {formatCurrency(position.stop_loss_price)}</p>
                    <p>Target: {formatCurrency(position.take_profit_price)}</p>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card className="border border-finance-green-25 bg-finance-surface-70/80 shadow-2xl backdrop-blur-xl">
          <CardHeader className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-finance-green-70">
                Execution Queue
              </p>
              <h3 className="text-lg font-semibold text-white">
                Pending Orders
              </h3>
            </div>
            <Icon
              className="text-xl text-finance-green-60"
              icon="solar:clipboard-list-linear"
            />
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            {orders.length === 0 ? (
              <p className="text-sm text-zinc-400">No queued orders.</p>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-finance-green-30/60 bg-black/15 p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-white">
                        {order.symbol}
                      </span>
                      <Chip size="sm" variant="flat">
                        {order.order_type}
                      </Chip>
                      <Chip
                        color={
                          order.side.toLowerCase() === "buy"
                            ? "success"
                            : "danger"
                        }
                        size="sm"
                        variant="flat"
                      >
                        {order.side}
                      </Chip>
                    </div>
                    <p className="text-xs uppercase tracking-[0.2em] text-finance-green-60">
                      {order.timeframe_source ?? "n/a"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-300">
                      <span>Entry {formatCurrency(order.entry_price)}</span>
                      <span>Stop {formatCurrency(order.stop_loss_price)}</span>
                      <span>
                        Target {formatCurrency(order.take_profit_price)}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-400">
                    <p>
                      RR{" "}
                      {formatNumber(order.risk_reward_ratio, {
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p>Confidence {formatPercent(order.confidence_score, 0)}</p>
                    <p>{formatDateTime(order.created_at)}</p>
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

type MetricBlockProps = {
  label: string;
  value: string;
  accent: "success" | "danger" | "warning";
  helper: string;
};

function MetricBlock({ label, value, accent, helper }: MetricBlockProps) {
  const accentColor =
    accent === "success"
      ? "text-green-400"
      : accent === "danger"
        ? "text-red-400"
        : "text-yellow-400";

  return (
    <div className="rounded-2xl border border-finance-green-30/60 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-finance-green-60">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold ${accentColor}`}>{value}</p>
      <p className="mt-1 text-xs text-zinc-400">{helper}</p>
    </div>
  );
}
