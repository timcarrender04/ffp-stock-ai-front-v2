"use client";

import React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";

import { ProcessedTrade } from "@/lib/services/analytics";

interface TradeHistoryTableProps {
  trades: ProcessedTrade[];
}

export function TradeHistoryTable({ trades }: TradeHistoryTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj);
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? "+" : "";

    return `${sign}${value.toFixed(2)}%`;
  };

  return (
    <Card className="border border-finance-green-25 bg-gradient-to-br from-finance-surface-70/90 via-finance-surface-80 to-finance-surface-60 p-4 sm:p-6 shadow-xl">
      <CardHeader className="p-0 pb-4">
        <div className="flex items-center justify-between w-full">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-white">
              Trade History
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              {trades.length} completed trades
            </p>
          </div>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        {trades.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-zinc-400">No trade history available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table
              aria-label="Trade history table"
              classNames={{
                wrapper: "min-h-[400px]",
                th: "bg-finance-surface-80 text-finance-green-60 border-b border-finance-green-30",
                td: "border-b border-finance-green-20/30",
              }}
            >
              <TableHeader>
                <TableColumn>SYMBOL</TableColumn>
                <TableColumn>SIDE</TableColumn>
                <TableColumn>QUANTITY</TableColumn>
                <TableColumn>ENTRY</TableColumn>
                <TableColumn>EXIT</TableColumn>
                <TableColumn>P&L</TableColumn>
                <TableColumn>P&L %</TableColumn>
                <TableColumn>DATE</TableColumn>
              </TableHeader>
              <TableBody>
                {trades.map((trade) => (
                  <TableRow
                    key={trade.id}
                    className={
                      trade.isWin
                        ? "bg-finance-green/5 hover:bg-finance-green/10"
                        : "bg-red-400/5 hover:bg-red-400/10"
                    }
                  >
                    <TableCell>
                      <span className="font-semibold text-white">
                        {trade.symbol}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={trade.side === "buy" ? "success" : "danger"}
                        size="sm"
                        variant="flat"
                      >
                        {trade.side.toUpperCase()}
                      </Chip>
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {trade.filled_qty || trade.quantity}
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {formatCurrency(trade.entryPrice)}
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {formatCurrency(trade.exitPrice)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          trade.isWin
                            ? "font-semibold text-finance-green"
                            : "font-semibold text-red-400"
                        }
                      >
                        {formatCurrency(trade.pnlAmount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          trade.isWin
                            ? "font-semibold text-finance-green"
                            : "font-semibold text-red-400"
                        }
                      >
                        {formatPercent(trade.pnlPercent)}
                      </span>
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm">
                      {formatDate(trade.tradeDate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
