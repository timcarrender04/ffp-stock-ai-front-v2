"use client";

import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import { ProcessedTrade } from "@/lib/services/analytics";

interface LossDistributionChartProps {
  trades: ProcessedTrade[];
}

export function LossDistributionChart({ trades }: LossDistributionChartProps) {
  // Get losing trades and sort by loss amount
  const losingTrades = trades
    .filter((t) => !t.isWin)
    .sort((a, b) => a.pnlAmount - b.pnlAmount)
    .slice(0, 20); // Show top 20 losses

  const data = losingTrades.map((trade, index) => ({
    name: trade.symbol,
    loss: Math.abs(trade.pnlAmount),
    pnl: trade.pnlAmount,
    index: index + 1,
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="border border-finance-green-25 bg-gradient-to-br from-finance-surface-70/90 via-finance-surface-80 to-finance-surface-60 p-4 sm:p-6 shadow-xl">
      <CardHeader className="p-0 pb-4">
        <div className="flex items-center justify-between w-full">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-white">
              Loss Distribution
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Top {losingTrades.length} losing trades
            </p>
          </div>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        {data.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-zinc-400">No losing trades to display</p>
          </div>
        ) : (
          <div className="h-64 sm:h-80">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
                <XAxis
                  angle={-45}
                  dataKey="name"
                  height={80}
                  textAnchor="end"
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  tickFormatter={formatCurrency}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "1px solid #f87171",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="loss" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.pnl < -100 ? "#dc2626" : "#f87171"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
