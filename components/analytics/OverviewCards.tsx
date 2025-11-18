"use client";

import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Icon } from "@iconify/react";

import { TradeMetrics, AccountInfo } from "@/lib/services/analytics";

interface OverviewCardsProps {
  metrics: TradeMetrics;
  account?: AccountInfo | null;
}

export function OverviewCards({ metrics, account }: OverviewCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const cards = [
    {
      title: "Total Trades",
      value: metrics.totalTrades.toString(),
      icon: "solar:chart-2-bold",
      color: "text-finance-green",
      bgColor: "bg-finance-green/10",
      borderColor: "border-finance-green-30",
    },
    {
      title: "Win Rate",
      value: formatPercent(metrics.winRate),
      icon: "solar:target-bold",
      color: metrics.winRate >= 50 ? "text-finance-green" : "text-orange-400",
      bgColor:
        metrics.winRate >= 50 ? "bg-finance-green/10" : "bg-orange-400/10",
      borderColor:
        metrics.winRate >= 50
          ? "border-finance-green-30"
          : "border-orange-400/30",
    },
    {
      title: "Total P&L",
      value: formatCurrency(metrics.totalPnL),
      icon: "solar:wallet-money-bold",
      color: metrics.totalPnL >= 0 ? "text-finance-green" : "text-red-400",
      bgColor: metrics.totalPnL >= 0 ? "bg-finance-green/10" : "bg-red-400/10",
      borderColor:
        metrics.totalPnL >= 0 ? "border-finance-green-30" : "border-red-400/30",
    },
    {
      title: "Profit Factor",
      value:
        metrics.profitFactor === Infinity
          ? "∞"
          : metrics.profitFactor.toFixed(2),
      icon: "solar:graph-up-bold",
      color: metrics.profitFactor >= 1 ? "text-finance-green" : "text-red-400",
      bgColor:
        metrics.profitFactor >= 1 ? "bg-finance-green/10" : "bg-red-400/10",
      borderColor:
        metrics.profitFactor >= 1
          ? "border-finance-green-30"
          : "border-red-400/30",
    },
    {
      title: "Avg Win",
      value: formatCurrency(metrics.averageWin),
      icon: "solar:arrow-up-bold",
      color: "text-finance-green",
      bgColor: "bg-finance-green/10",
      borderColor: "border-finance-green-30",
    },
    {
      title: "Avg Loss",
      value: formatCurrency(Math.abs(metrics.averageLoss)),
      icon: "solar:arrow-down-bold",
      color: "text-red-400",
      bgColor: "bg-red-400/10",
      borderColor: "border-red-400/30",
    },
  ];

  if (account) {
    cards.push(
      {
        title: "Portfolio Value",
        value: formatCurrency(account.portfolio_value),
        icon: "solar:wallet-bold",
        color: "text-finance-green",
        bgColor: "bg-finance-green/10",
        borderColor: "border-finance-green-30",
      },
      {
        title: "Buying Power",
        value: formatCurrency(account.buying_power),
        icon: "solar:credit-card-bold",
        color: "text-finance-green-60",
        bgColor: "bg-finance-green-60/10",
        borderColor: "border-finance-green-60/30",
      },
    );
  }

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card
          key={index}
          className={`border ${card.borderColor} bg-gradient-to-br from-finance-surface-70/90 via-finance-surface-80 to-finance-surface-60 p-4 sm:p-6 shadow-xl`}
        >
          <CardBody className="p-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.2em] text-finance-green-70 mb-2">
                  {card.title}
                </p>
                <p className={`text-xl sm:text-2xl font-bold ${card.color}`}>
                  {card.value}
                </p>
              </div>
              <div
                className={`rounded-xl ${card.bgColor} p-2 sm:p-3 border ${card.borderColor}`}
              >
                <Icon
                  className={`text-xl sm:text-2xl ${card.color}`}
                  icon={card.icon}
                />
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
