"use client";

import type { TradingMode } from "@/lib/services/alpaca";

import React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
} from "@heroui/drawer";
import { Button } from "@heroui/button";
import { Tabs, Tab } from "@heroui/tabs";
import { Chip } from "@heroui/chip";
import { Icon } from "@iconify/react";
import { Spinner } from "@heroui/spinner";

import { OrderForm } from "./OrderForm";
import { ActiveOrdersList } from "./ActiveOrdersList";
import { ClosedOrdersList } from "./ClosedOrdersList";

import { useAlert } from "@/lib/contexts/AlertContext";

interface AlpacaTradingModuleProps {
  isOpen: boolean;
  onClose: () => void;
  initialSymbol?: string;
}

export function AlpacaTradingModule({
  isOpen,
  onClose,
  initialSymbol,
}: AlpacaTradingModuleProps) {
  const { confirm, alert } = useAlert();
  const [tradingMode, setTradingMode] = React.useState<TradingMode>("paper");
  const [activeTab, setActiveTab] = React.useState("order");
  const [isLoadingAccount, setIsLoadingAccount] = React.useState(false);
  const [account, setAccount] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Load account info when drawer opens
  React.useEffect(() => {
    if (isOpen) {
      loadAccount();
    }
  }, [isOpen, tradingMode]);

  const loadAccount = async () => {
    setIsLoadingAccount(true);
    setError(null);

    try {
      const response = await fetch(`/api/alpaca/account?mode=${tradingMode}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        throw new Error(
          errorData.error || "Failed to load account information",
        );
      }

      const accountData = await response.json();

      setAccount(accountData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load account");
    } finally {
      setIsLoadingAccount(false);
    }
  };

  const handleModeToggle = async (mode: TradingMode) => {
    if (mode === "live") {
      const confirmed = await confirm(
        "⚠️ WARNING: You are switching to LIVE TRADING mode. This will use real money. Are you sure?",
        {
          title: "Switch to Live Trading",
          variant: "error",
        },
      );

      if (!confirmed) {
        return;
      }
    }
    setTradingMode(mode);
  };

  const handleFailsafe = async () => {
    const confirmed = await confirm(
      `⚠️ EMERGENCY FAIL-SAFE ⚠️\n\nThis will:\n• Cancel ALL pending orders\n• Close ALL open positions\n\nMode: ${tradingMode.toUpperCase()}\n\nThis action cannot be undone. Are you absolutely sure?`,
      {
        title: "Execute Fail-Safe",
        variant: "error",
        confirmText: "Yes, Execute Fail-Safe",
        cancelText: "Cancel",
      },
    );

    if (!confirmed) {
      return;
    }

    // Double confirmation for live trading
    if (tradingMode === "live") {
      const doubleConfirmed = await confirm(
        "🚨 FINAL CONFIRMATION 🚨\n\nYou are about to close ALL LIVE positions and cancel ALL LIVE orders.\n\nThis will execute with REAL MONEY.\n\nType 'CONFIRM' to proceed:",
        {
          title: "Final Confirmation Required",
          variant: "error",
          confirmText: "CONFIRM",
          cancelText: "Cancel",
        },
      );

      if (!doubleConfirmed) {
        return;
      }
    }

    try {
      setIsLoadingAccount(true);
      setError(null);

      const response = await fetch(
        `/api/alpaca/failsafe?mode=${tradingMode}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Failed to execute fail-safe",
        );
      }

      const result = await response.json();

      // Show success message
      if (result.results.errors.length > 0) {
        setError(
          `Fail-safe executed with warnings: ${result.results.errors.join(", ")}`,
        );
      } else {
        setError(null);
      }

      // Reload account and refresh UI
      await loadAccount();

      // Show success notification
      await alert(
        `Fail-Safe Executed:\n• ${result.results.orders_canceled} orders canceled\n• ${result.results.positions_closed} positions closed${result.warnings ? `\n\n⚠️ ${result.warnings}` : ""}`,
        {
          title: "Fail-Safe Complete",
          variant: result.results.errors.length > 0 ? "warning" : "success",
        },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute fail-safe");
    } finally {
      setIsLoadingAccount(false);
    }
  };

  return (
    <Drawer
      classNames={{
        base: "bg-finance-surface-70",
        header: "border-b border-finance-green-30",
      }}
      isOpen={isOpen}
      placement="right"
      size="lg"
      onClose={onClose}
    >
      <DrawerContent className="bg-finance-surface-70 text-white">
        <DrawerHeader className="flex flex-col gap-2 border-b border-finance-green-30 pb-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Icon
                className="text-2xl text-finance-green"
                icon="solar:chart-2-bold"
              />
              <h2 className="text-xl font-semibold">Alpaca Trading</h2>
            </div>
            <Button
              isIconOnly
              className="text-zinc-300"
              variant="light"
              onPress={onClose}
            >
              <Icon className="text-xl" icon="solar:close-circle-bold" />
            </Button>
          </div>

          {/* Trading Mode Selector */}
          <div className="flex items-center gap-2 w-full flex-wrap">
            <div className="flex items-center gap-2">
              <Button
                className={
                  tradingMode === "paper"
                    ? "bg-finance-green text-black font-semibold"
                    : "text-zinc-300"
                }
                color={tradingMode === "paper" ? "success" : "default"}
                size="sm"
                variant={tradingMode === "paper" ? "solid" : "flat"}
                onPress={() => handleModeToggle("paper")}
              >
                <Icon className="text-base" icon="solar:document-text-bold" />
                Paper Trading
              </Button>
              <Button
                className={
                  tradingMode === "live"
                    ? "bg-red-600 text-white font-semibold"
                    : "text-zinc-300"
                }
                color={tradingMode === "live" ? "danger" : "default"}
                size="sm"
                variant={tradingMode === "live" ? "solid" : "flat"}
                onPress={() => handleModeToggle("live")}
              >
                <Icon className="text-base" icon="solar:danger-triangle-bold" />
                Live Trading
              </Button>
              {tradingMode === "live" && (
                <Chip
                  className="text-xs"
                  color="danger"
                  size="sm"
                  variant="flat"
                >
                  REAL MONEY
                </Chip>
              )}
            </div>
            {/* Fail-Safe Button */}
            <Button
              className="ml-auto bg-red-600 text-white font-semibold"
              color="danger"
              size="sm"
              variant="solid"
              onPress={() => handleFailsafe()}
            >
              <Icon className="text-base" icon="solar:shield-cross-bold" />
              Fail-Safe
            </Button>
          </div>

          {/* Account Info */}
          {isLoadingAccount ? (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Spinner color="success" size="sm" />
              <span>Loading account...</span>
            </div>
          ) : error ? (
            <div className="text-sm text-red-400">{error}</div>
          ) : account ? (
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-zinc-400">Buying Power</p>
                <p className="text-white font-semibold">
                  ${parseFloat(account.buying_power || "0").toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-zinc-400">Cash</p>
                <p className="text-white font-semibold">
                  ${parseFloat(account.cash || "0").toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-zinc-400">Portfolio Value</p>
                <p className="text-white font-semibold">
                  ${parseFloat(account.portfolio_value || "0").toLocaleString()}
                </p>
              </div>
            </div>
          ) : null}
        </DrawerHeader>

        <DrawerBody className="p-0">
          <Tabs
            classNames={{
              base: "w-full",
              tabList: "border-b border-finance-green-30",
              tab: "text-zinc-300 data-[selected=true]:text-finance-green",
              panel: "p-4",
            }}
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
          >
            <Tab key="order" title="Place Order">
              <OrderForm
                initialSymbol={initialSymbol}
                tradingMode={tradingMode}
                onOrderPlaced={() => {
                  setActiveTab("active");
                  loadAccount();
                }}
              />
            </Tab>
            <Tab key="active" title="Active Orders">
              <ActiveOrdersList
                tradingMode={tradingMode}
                onRefresh={loadAccount}
              />
            </Tab>
            <Tab key="closed" title="Closed Orders">
              <ClosedOrdersList tradingMode={tradingMode} />
            </Tab>
            <Tab key="positions" title="Positions">
              <PositionsList
                tradingMode={tradingMode}
                onRefresh={loadAccount}
              />
            </Tab>
          </Tabs>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

// Simple Positions List Component
function PositionsList({
  tradingMode,
  onRefresh,
}: {
  tradingMode: TradingMode;
  onRefresh: () => void;
}) {
  const { confirm, alert } = useAlert();
  const [positions, setPositions] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [closingSymbol, setClosingSymbol] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadPositions();
  }, [tradingMode]);

  const loadPositions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/alpaca/positions?mode=${tradingMode}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        throw new Error(errorData.error || "Failed to load positions");
      }

      const data = await response.json();

      setPositions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load positions");
    } finally {
      setIsLoading(false);
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
        <Button
          className="mt-4"
          size="sm"
          variant="flat"
          onPress={loadPositions}
        >
          Retry
        </Button>
      </div>
    );
  }

  const handleClosePosition = async (symbol: string, qty: string) => {
    const confirmed = await confirm(
      `Close position ${symbol}?\n\nQuantity: ${qty}\nMode: ${tradingMode.toUpperCase()}\n\nThis will execute a market order to close the position.`,
      {
        title: "Close Position",
        variant: tradingMode === "live" ? "error" : "warning",
        confirmText: "Close Position",
        cancelText: "Cancel",
      },
    );

    if (!confirmed) {
      return;
    }

    // Double confirmation for live trading
    if (tradingMode === "live") {
      const doubleConfirmed = await confirm(
        `🚨 FINAL CONFIRMATION 🚨\n\nYou are about to close ${symbol} in LIVE TRADING mode.\n\nThis will execute with REAL MONEY.\n\nConfirm to proceed:`,
        {
          title: "Final Confirmation Required",
          variant: "error",
          confirmText: "CONFIRM",
          cancelText: "Cancel",
        },
      );

      if (!doubleConfirmed) {
        return;
      }
    }

    setClosingSymbol(symbol);

    try {
      const response = await fetch(
        `/api/alpaca/positions/${symbol}?mode=${tradingMode}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to close position");
      }

      const result = await response.json();

      // Reload positions and account
      await loadPositions();
      onRefresh();

      // Show success message
      await alert(
        `Position ${symbol} closed successfully.\n\nOrder ID: ${result.order?.id || "N/A"}`,
        {
          title: "Position Closed",
          variant: "success",
        },
      );
    } catch (err) {
      await alert(
        err instanceof Error ? err.message : "Failed to close position",
        {
          title: "Error",
          variant: "error",
        },
      );
    } finally {
      setClosingSymbol(null);
    }
  };

  if (positions.length === 0) {
    return (
      <div className="text-center text-zinc-400 py-8">
        <Icon className="text-4xl mx-auto mb-2" icon="solar:box-bold" />
        <p>No open positions</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {positions.map((position) => (
        <div
          key={position.symbol}
          className="rounded-lg border border-finance-green-20 bg-finance-surface-60 p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-lg">
                {position.symbol}
              </span>
              <Chip
                color={position.side === "long" ? "success" : "danger"}
                size="sm"
                variant="flat"
              >
                {position.side.toUpperCase()}
              </Chip>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-400">Unrealized P&L</p>
              <p
                className={`font-semibold ${
                  parseFloat(position.unrealized_pl || "0") >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                ${parseFloat(position.unrealized_pl || "0").toFixed(2)} (
                {(parseFloat(position.unrealized_plpc || "0") * 100).toFixed(2)}
                %)
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div>
              <p className="text-zinc-400">Quantity</p>
              <p className="text-white">{position.qty}</p>
            </div>
            <div>
              <p className="text-zinc-400">Avg Entry</p>
              <p className="text-white">
                ${parseFloat(position.cost_basis || "0").toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-zinc-400">Current Price</p>
              <p className="text-white">
                ${parseFloat(position.current_price || "0").toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-zinc-400">Market Value</p>
              <p className="text-white">
                ${parseFloat(position.market_value || "0").toFixed(2)}
              </p>
            </div>
          </div>
          {/* Close Position Button */}
          <Button
            className="w-full"
            color="danger"
            isDisabled={closingSymbol === position.symbol}
            size="sm"
            variant="flat"
            onPress={() => handleClosePosition(position.symbol, position.qty)}
          >
            {closingSymbol === position.symbol ? (
              <>
                <Spinner color="danger" size="sm" />
                Closing...
              </>
            ) : (
              <>
                <Icon className="text-base" icon="solar:close-circle-bold" />
                Close Position
              </>
            )}
          </Button>
        </div>
      ))}
      <Button
        className="w-full mt-4"
        size="sm"
        variant="flat"
        onPress={loadPositions}
      >
        <Icon className="text-base" icon="solar:refresh-bold" />
        Refresh
      </Button>
    </div>
  );
}
