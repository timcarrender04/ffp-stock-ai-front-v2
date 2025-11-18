"use client";

import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

import { TradeMetrics } from "@/lib/services/analytics";

interface WinLossChartProps {
  metrics: TradeMetrics;
}

export function WinLossChart({ metrics }: WinLossChartProps) {
  const data = [
    {
      name: "Winning Trades",
      value: metrics.winningTrades,
      color: "#10b981", // finance-green
    },
    {
      name: "Losing Trades",
      value: metrics.losingTrades,
      color: "#f87171", // red-400
    },
  ];

  const renderLabel = (entry: {
    name: string;
    value: number;
    percent: number;
  }) => {
    return `${entry.name}: ${entry.value} (${(entry.percent * 100).toFixed(1)}%)`;
  };

  return (
    <Card className="border border-finance-green-25 bg-gradient-to-br from-finance-surface-70/90 via-finance-surface-80 to-finance-surface-60 p-4 sm:p-6 shadow-xl">
      <CardHeader className="p-0 pb-4">
        <div className="flex items-center justify-between w-full">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-white">
              Win/Loss Distribution
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              {metrics.totalTrades} total trades
            </p>
          </div>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        <div className="h-64 sm:h-80">
          <ResponsiveContainer height="100%" width="100%">
            <PieChart>
              <Pie
                cx="50%"
                cy="50%"
                data={data}
                dataKey="value"
                fill="#8884d8"
                label={renderLabel}
                labelLine={false}
                outerRadius={80}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  border: "1px solid #10b981",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Legend
                formatter={(value) => (
                  <span className="text-sm text-zinc-300">{value}</span>
                )}
                iconType="circle"
                wrapperStyle={{ color: "#fff" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-finance-green-30/60 bg-black/20 p-3">
            <p className="text-xs text-zinc-400 mb-1">Winning Trades</p>
            <p className="text-lg font-semibold text-finance-green">
              {metrics.winningTrades}
            </p>
          </div>
          <div className="rounded-lg border border-red-400/30 bg-black/20 p-3">
            <p className="text-xs text-zinc-400 mb-1">Losing Trades</p>
            <p className="text-lg font-semibold text-red-400">
              {metrics.losingTrades}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
