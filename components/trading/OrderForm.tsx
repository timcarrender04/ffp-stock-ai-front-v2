"use client";

import type { TradingMode, CreateOrderRequest } from "@/lib/services/alpaca";

import React from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import { Icon } from "@iconify/react";

interface OrderFormProps {
  initialSymbol?: string;
  tradingMode: TradingMode;
  onOrderPlaced: () => void;
}

export function OrderForm({
  initialSymbol,
  tradingMode,
  onOrderPlaced,
}: OrderFormProps) {
  const [symbol, setSymbol] = React.useState(initialSymbol || "");
  const [side, setSide] = React.useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = React.useState<
    "market" | "limit" | "stop" | "stop_limit" | "trailing_stop"
  >("market");
  const [quantity, setQuantity] = React.useState("");
  const [notional, setNotional] = React.useState("");
  const [limitPrice, setLimitPrice] = React.useState("");
  const [stopPrice, setStopPrice] = React.useState("");
  const [trailPercent, setTrailPercent] = React.useState("");
  const [trailPrice, setTrailPrice] = React.useState("");
  const [timeInForce, setTimeInForce] = React.useState<"day" | "gtc">("day");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = React.useState<number | null>(null);
  const [priceTarget, setPriceTarget] = React.useState<number | null>(null);
  const [priceTargetPct, setPriceTargetPct] = React.useState<number | null>(null);
  const [priceTargetReasoning, setPriceTargetReasoning] = React.useState<string | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = React.useState(false);

  React.useEffect(() => {
    if (initialSymbol) {
      setSymbol(initialSymbol);
    }
  }, [initialSymbol]);

  // Fetch price and AI target when symbol changes
  React.useEffect(() => {
    const fetchPriceTarget = async () => {
      if (!symbol || symbol.trim().length === 0) {
        setCurrentPrice(null);
        setPriceTarget(null);
        setPriceTargetPct(null);
        setPriceTargetReasoning(null);
        return;
      }

      setIsLoadingPrice(true);
      try {
        const response = await fetch(`/api/alpaca/price-target/${symbol.trim().toUpperCase()}`);
        if (response.ok) {
          const data = await response.json();
          setCurrentPrice(data.current_price);
          setPriceTarget(data.price_target);
          setPriceTargetPct(data.price_target_pct);
          setPriceTargetReasoning(data.price_target_reasoning);
        } else {
          // If symbol not found, clear the values
          setCurrentPrice(null);
          setPriceTarget(null);
          setPriceTargetPct(null);
          setPriceTargetReasoning(null);
        }
      } catch (err) {
        console.error("Error fetching price target:", err);
        setCurrentPrice(null);
        setPriceTarget(null);
        setPriceTargetPct(null);
        setPriceTargetReasoning(null);
      } finally {
        setIsLoadingPrice(false);
      }
    };

    // Debounce the API call
    const timeoutId = setTimeout(() => {
      fetchPriceTarget();
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, orderType]);

  // Auto-fill limit price when price target is available and order type is limit
  React.useEffect(() => {
    if (priceTarget && orderType === "limit" && !limitPrice) {
      setLimitPrice(priceTarget.toFixed(2));
    }
  }, [priceTarget, orderType, limitPrice]);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    // Validation
    if (!symbol.trim()) {
      setError("Symbol is required");

      return;
    }

    if (!quantity && !notional) {
      setError("Either quantity or notional amount is required");

      return;
    }

    if (orderType === "limit" && !limitPrice) {
      setError("Limit price is required for limit orders");

      return;
    }

    if ((orderType === "stop" || orderType === "stop_limit") && !stopPrice) {
      setError("Stop price is required for stop orders");

      return;
    }

    if (orderType === "stop_limit" && !limitPrice) {
      setError("Limit price is required for stop limit orders");

      return;
    }

    if (orderType === "trailing_stop" && !trailPercent && !trailPrice) {
      setError(
        "Trail percent or trail price is required for trailing stop orders",
      );

      return;
    }

    setIsSubmitting(true);

    try {
      const orderRequest: CreateOrderRequest = {
        symbol: symbol.trim().toUpperCase(),
        side,
        type: orderType,
        time_in_force: timeInForce,
      };

      if (quantity) {
        orderRequest.qty = parseFloat(quantity);
      } else if (notional) {
        orderRequest.notional = parseFloat(notional);
      }

      if (limitPrice) {
        orderRequest.limit_price = parseFloat(limitPrice);
      }

      if (stopPrice) {
        orderRequest.stop_price = parseFloat(stopPrice);
      }

      if (trailPercent) {
        orderRequest.trail_percent = parseFloat(trailPercent);
      }

      if (trailPrice) {
        orderRequest.trail_price = parseFloat(trailPrice);
      }

      const response = await fetch(`/api/alpaca/orders?mode=${tradingMode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        throw new Error(errorData.error || "Failed to place order");
      }

      const order = await response.json();

      setSuccess(`Order placed successfully! Order ID: ${order.id}`);

      // Reset form
      setSymbol("");
      setQuantity("");
      setNotional("");
      setLimitPrice("");
      setStopPrice("");
      setTrailPercent("");
      setTrailPrice("");

      // Notify parent
      setTimeout(() => {
        onOrderPlaced();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3">
          <div className="flex items-center gap-2 text-red-300">
            <Icon className="text-lg" icon="solar:danger-triangle-bold" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-3">
          <div className="flex items-center gap-2 text-green-300">
            <Icon className="text-lg" icon="solar:check-circle-bold" />
            <p className="text-sm">{success}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Input
            classNames={{
              input: "text-white uppercase",
              label: "text-zinc-300",
            }}
            isDisabled={isSubmitting}
            label="Symbol"
            placeholder="e.g., AAPL"
            value={symbol}
            onValueChange={setSymbol}
            endContent={
              isLoadingPrice ? (
                <Spinner size="sm" color="success" />
              ) : null
            }
          />
          {currentPrice !== null && (
            <div className="flex items-center gap-2 text-xs text-zinc-400 px-2">
              <span>Current: ${currentPrice.toFixed(2)}</span>
              {priceTarget !== null && (
                <>
                  <span>•</span>
                  <span className="text-finance-green">
                    Target: ${priceTarget.toFixed(2)}
                    {priceTargetPct !== null && (
                      <span className="ml-1">
                        ({priceTargetPct > 0 ? "+" : ""}
                        {priceTargetPct.toFixed(1)}%)
                      </span>
                    )}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
        <Select
          classNames={{
            trigger: "text-white",
            label: "text-zinc-300",
          }}
          isDisabled={isSubmitting}
          label="Side"
          selectedKeys={[side]}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as "buy" | "sell";

            setSide(selected);
          }}
        >
          <SelectItem key="buy">Buy</SelectItem>
          <SelectItem key="sell">Sell</SelectItem>
        </Select>
      </div>

      {priceTargetReasoning && (
        <div className="rounded-lg border border-finance-green-30/50 bg-finance-green-10/30 p-3">
          <div className="flex items-start gap-2">
            <Icon
              className="mt-0.5 text-lg text-finance-green"
              icon="solar:lightbulb-bolt-bold"
            />
            <div className="flex-1">
              <p className="text-xs font-semibold text-finance-green mb-1">
                AI Price Target Analysis
              </p>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {priceTargetReasoning}
              </p>
            </div>
          </div>
        </div>
      )}

      <Select
        classNames={{
          trigger: "text-white",
          label: "text-zinc-300",
        }}
        isDisabled={isSubmitting}
        label="Order Type"
        selectedKeys={[orderType]}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as typeof orderType;

          setOrderType(selected);
        }}
      >
        <SelectItem key="market">Market</SelectItem>
        <SelectItem key="limit">Limit</SelectItem>
        <SelectItem key="stop">Stop</SelectItem>
        <SelectItem key="stop_limit">Stop Limit</SelectItem>
        <SelectItem key="trailing_stop">Trailing Stop</SelectItem>
      </Select>

      <div className="grid grid-cols-2 gap-3">
        <Input
          classNames={{
            input: "text-white",
            label: "text-zinc-300",
          }}
          isDisabled={isSubmitting || !!notional}
          label="Quantity"
          placeholder="Number of shares"
          type="number"
          value={quantity}
          onValueChange={setQuantity}
        />
        <Input
          classNames={{
            input: "text-white",
            label: "text-zinc-300",
          }}
          isDisabled={isSubmitting || !!quantity}
          label="Notional ($)"
          placeholder="Dollar amount"
          type="number"
          value={notional}
          onValueChange={setNotional}
        />
      </div>

      {orderType === "limit" || orderType === "stop_limit" ? (
        <Input
          classNames={{
            input: "text-white",
            label: "text-zinc-300",
          }}
          isDisabled={isSubmitting}
          label="Limit Price"
          placeholder="0.00"
          step="0.01"
          type="number"
          value={limitPrice}
          onValueChange={setLimitPrice}
        />
      ) : null}

      {orderType === "stop" || orderType === "stop_limit" ? (
        <Input
          classNames={{
            input: "text-white",
            label: "text-zinc-300",
          }}
          isDisabled={isSubmitting}
          label="Stop Price"
          placeholder="0.00"
          step="0.01"
          type="number"
          value={stopPrice}
          onValueChange={setStopPrice}
        />
      ) : null}

      {orderType === "trailing_stop" ? (
        <div className="grid grid-cols-2 gap-3">
          <Input
            classNames={{
              input: "text-white",
              label: "text-zinc-300",
            }}
            isDisabled={isSubmitting || !!trailPrice}
            label="Trail Percent (%)"
            placeholder="e.g., 2.5"
            step="0.01"
            type="number"
            value={trailPercent}
            onValueChange={setTrailPercent}
          />
          <Input
            classNames={{
              input: "text-white",
              label: "text-zinc-300",
            }}
            isDisabled={isSubmitting || !!trailPercent}
            label="Trail Price ($)"
            placeholder="0.00"
            step="0.01"
            type="number"
            value={trailPrice}
            onValueChange={setTrailPrice}
          />
        </div>
      ) : null}

      <Select
        classNames={{
          trigger: "text-white",
          label: "text-zinc-300",
        }}
        isDisabled={isSubmitting}
        label="Time in Force"
        selectedKeys={[timeInForce]}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as typeof timeInForce;

          setTimeInForce(selected);
        }}
      >
        <SelectItem key="day">Day</SelectItem>
        <SelectItem key="gtc">Good Till Canceled</SelectItem>
      </Select>

      <Button
        className="w-full bg-finance-green text-black font-semibold"
        color="success"
        isDisabled={isSubmitting}
        isLoading={isSubmitting}
        size="lg"
        onPress={handleSubmit}
      >
        {isSubmitting ? (
          <>
            <Spinner color="default" size="sm" />
            Placing Order...
          </>
        ) : tradingMode === "live" ? (
          <>
            <Icon className="text-lg" icon="solar:danger-triangle-bold" />
            Place Live Order
          </>
        ) : (
          <>
            <Icon className="text-lg" icon="solar:check-circle-bold" />
            Place Paper Order
          </>
        )}
      </Button>

      {tradingMode === "live" && (
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3">
          <div className="flex items-start gap-2">
            <Icon
              className="mt-0.5 text-lg text-yellow-400"
              icon="solar:danger-triangle-bold"
            />
            <p className="text-xs text-yellow-300">
              ⚠️ You are placing a LIVE order with real money. Please verify all
              details before submitting.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
