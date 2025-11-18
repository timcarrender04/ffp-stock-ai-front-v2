"use client";

import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

import {
  calculateCumulativePnL,
  ProcessedTrade,
} from "@/lib/services/analytics";

interface PNLChartProps {
  trades: ProcessedTrade[];
}

export function PNLChart({ trades }: PNLChartProps) {
  const cumulativeData = calculateCumulativePnL(trades);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);

    if (isNaN(dateObj.getTime())) {
      return "Invalid Date";
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(dateObj);
  };

  return (
    <Card className="border border-finance-green-25 bg-gradient-to-br from-finance-surface-70/90 via-finance-surface-80 to-finance-surface-60 p-4 sm:p-6 shadow-xl">
      <CardHeader className="p-0 pb-4">
        <div className="flex items-center justify-between w-full">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-white">
              Cumulative P&L Over Time
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              {trades.length} trades tracked
            </p>
          </div>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        {cumulativeData.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-zinc-400">No trade data to display</p>
          </div>
        ) : (
          <div className="h-64 sm:h-80">
            <ResponsiveContainer height="100%" width="100%">
              <LineChart
                data={cumulativeData.map((d) => ({
                  ...d,
                  dateStr: formatDate(d.date),
                }))}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
                <XAxis
                  angle={-45}
                  dataKey="dateStr"
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
                    border: "1px solid #10b981",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <ReferenceLine stroke="#6b7280" strokeDasharray="2 2" y={0} />
                <Line
                  activeDot={{ r: 6 }}
                  dataKey="cumulative"
                  dot={{ fill: "#10b981", r: 4 }}
                  stroke="#10b981"
                  strokeWidth={2}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
