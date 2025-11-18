"use client";

import type { TradingMode } from "@/lib/services/alpaca";

import React from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Icon } from "@iconify/react";

interface ClosedOrdersListProps {
  tradingMode: TradingMode;
}

export function ClosedOrdersList({ tradingMode }: ClosedOrdersListProps) {
  const [orders, setOrders] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadOrders();
  }, [tradingMode]);

  const loadOrders = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/alpaca/orders?mode=${tradingMode}&status=closed&limit=50`,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        throw new Error(errorData.error || "Failed to load orders");
      }

      const data = await response.json();

      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePL = (order: any) => {
    if (!order.filled_avg_price || !order.filled_qty) {
      return null;
    }

    // This is a simplified P&L calculation
    // In reality, you'd need to track entry prices and compare with current prices
    const filledQty = parseFloat(order.filled_qty);
    const avgPrice = parseFloat(order.filled_avg_price);
    const value = filledQty * avgPrice;

    return {
      value,
      qty: filledQty,
      avgPrice,
    };
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "filled":
        return "success";
      case "partially_filled":
        return "warning";
      case "canceled":
      case "rejected":
        return "danger";
      default:
        return "default";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner color="success" size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-400 py-8">
        <p>{error}</p>
        <Button className="mt-4" size="sm" variant="flat" onPress={loadOrders}>
          Retry
        </Button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center text-zinc-400 py-8">
        <Icon className="text-4xl mx-auto mb-2" icon="solar:archive-bold" />
        <p>No closed orders</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const pl = calculatePL(order);

        return (
          <div
            key={order.id}
            className="rounded-lg border border-finance-green-20 bg-finance-surface-60 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-lg">
                  {order.symbol}
                </span>
                <Chip
                  color={order.side === "buy" ? "success" : "danger"}
                  size="sm"
                  variant="flat"
                >
                  {order.side.toUpperCase()}
                </Chip>
                <Chip
                  color={getStatusColor(order.status)}
                  size="sm"
                  variant="flat"
                >
                  {order.status}
                </Chip>
              </div>
              {pl && (
                <div className="text-right">
                  <p className="text-xs text-zinc-400">Filled Value</p>
                  <p className="text-white font-semibold">
                    ${pl.value.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-zinc-400">Type</p>
                <p className="text-white">{order.order_type}</p>
              </div>
              <div>
                <p className="text-zinc-400">Quantity</p>
                <p className="text-white">
                  {order.filled_qty || "0"} / {order.qty || "N/A"}
                </p>
              </div>
              {order.limit_price && (
                <div>
                  <p className="text-zinc-400">Limit Price</p>
                  <p className="text-white">
                    ${parseFloat(order.limit_price).toFixed(2)}
                  </p>
                </div>
              )}
              {order.filled_avg_price && (
                <div>
                  <p className="text-zinc-400">Avg Fill Price</p>
                  <p className="text-white">
                    ${parseFloat(order.filled_avg_price).toFixed(2)}
                  </p>
                </div>
              )}
              {order.filled_at && (
                <div>
                  <p className="text-zinc-400">Filled At</p>
                  <p className="text-white">
                    {new Date(order.filled_at).toLocaleString()}
                  </p>
                </div>
              )}
              {order.canceled_at && (
                <div>
                  <p className="text-zinc-400">Canceled At</p>
                  <p className="text-white">
                    {new Date(order.canceled_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            {order.submitted_at && (
              <p className="text-xs text-zinc-500 mt-2">
                Submitted: {new Date(order.submitted_at).toLocaleString()}
              </p>
            )}
          </div>
        );
      })}
      <Button
        className="w-full mt-4"
        isDisabled={isLoading}
        size="sm"
        variant="flat"
        onPress={loadOrders}
      >
        <Icon className="text-base" icon="solar:refresh-bold" />
        Refresh
      </Button>
    </div>
  );
}
