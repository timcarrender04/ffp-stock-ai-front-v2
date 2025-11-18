export interface Trade {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  quantity?: number;
  qty?: number;
  filled_qty?: number;
  order_type: string;
  status: string;
  limit_price?: number;
  stop_price?: number;
  avg_fill_price?: number;
  submitted_at: string;
  filled_at?: string | null;
  created_at: string;
  updated_at?: string;
  client_order_id?: string;
  commission?: number;
  pnl?: number;
  pnl_pct?: number;
}

export interface Position {
  symbol: string;
  qty: number;
  avg_entry_price: number;
  current_price?: number;
  market_value: number;
  cost_basis: number;
  unrealized_pl: number;
  unrealized_plpc: number;
  side: string;
}

export interface AccountInfo {
  buying_power: number;
  cash: number;
  portfolio_value: number;
  equity: number;
  daytrading_buying_power?: number;
  pattern_day_trader?: boolean;
  trading_blocked?: boolean;
}

export interface TradeMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
}

export interface ProcessedTrade extends Trade {
  isWin: boolean;
  pnlAmount: number;
  pnlPercent: number;
  entryPrice: number;
  exitPrice: number;
  tradeDate: Date | string; // Can be Date object or ISO string (after JSON serialization)
}

/**
 * Fetch all trades from Alpaca API
 */
export async function fetchTradeHistory(): Promise<Trade[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const response = await fetch(
      `${apiUrl}/api/alpaca/paper/orders?status=all&limit=500`,
      {
        next: { revalidate: 60 },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch trades: ${response.statusText}`);
    }

    const trades = await response.json();

    return trades || [];
  } catch (error) {
    console.error("Error fetching trade history:", error);

    return [];
  }
}

/**
 * Fetch current positions from Alpaca API
 */
export async function fetchPositions(): Promise<Position[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const response = await fetch(`${apiUrl}/api/alpaca/paper/positions`, {
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch positions: ${response.statusText}`);
    }

    const positions = await response.json();

    return positions || [];
  } catch (error) {
    console.error("Error fetching positions:", error);

    return [];
  }
}

/**
 * Fetch account information from Alpaca API
 */
export async function fetchAccountInfo(): Promise<AccountInfo | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const response = await fetch(`${apiUrl}/api/alpaca/account?mode=paper`, {
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch account: ${response.statusText}`);
    }

    const account = await response.json();

    return account;
  } catch (error) {
    console.error("Error fetching account info:", error);

    return null;
  }
}

/**
 * Process trades to calculate P&L and classify wins/losses
 */
export function processTrades(trades: Trade[]): ProcessedTrade[] {
  if (!trades || !Array.isArray(trades) || trades.length === 0) {
    return [];
  }

  // Group trades by symbol and match buy/sell pairs
  const symbolGroups = new Map<string, Trade[]>();

  trades.forEach((trade) => {
    if (!trade || !trade.symbol) return;
    if (!symbolGroups.has(trade.symbol)) {
      symbolGroups.set(trade.symbol, []);
    }
    symbolGroups.get(trade.symbol)!.push(trade);
  });

  const processed: ProcessedTrade[] = [];

  // For each symbol, match buy and sell orders
  symbolGroups.forEach((symbolTrades, symbol) => {
    const buys = symbolTrades.filter(
      (t) =>
        t &&
        t.side === "buy" &&
        (t.status === "filled" || t.status === "closed"),
    );
    const sells = symbolTrades.filter(
      (t) =>
        t &&
        t.side === "sell" &&
        (t.status === "filled" || t.status === "closed"),
    );

    // Match buys with sells (simple FIFO matching)
    let buyIndex = 0;
    let sellIndex = 0;

    while (buyIndex < buys.length && sellIndex < sells.length) {
      const buy = buys[buyIndex];
      const sell = sells[sellIndex];

      if (!buy || !sell) {
        buyIndex++;
        sellIndex++;
        continue;
      }

      const entryPrice = buy.avg_fill_price || buy.limit_price || 0;
      const exitPrice = sell.avg_fill_price || sell.limit_price || 0;
      const buyQty = buy.filled_qty || buy.qty || buy.quantity || 0;
      const sellQty = sell.filled_qty || sell.qty || sell.quantity || 0;
      const quantity = Math.min(buyQty, sellQty);

      if (entryPrice > 0 && exitPrice > 0 && quantity > 0) {
        const pnlAmount = (exitPrice - entryPrice) * quantity;
        const pnlPercent = ((exitPrice - entryPrice) / entryPrice) * 100;
        const isWin = pnlAmount > 0;

        const filledAt = sell.filled_at || sell.submitted_at || sell.created_at;
        const tradeDate = filledAt ? new Date(filledAt) : new Date();

        processed.push({
          ...buy,
          isWin,
          pnlAmount,
          pnlPercent,
          entryPrice,
          exitPrice,
          tradeDate,
        });

        // Update quantities
        if (buyQty > sellQty) {
          sellIndex++;
        } else if (sellQty > buyQty) {
          buyIndex++;
        } else {
          buyIndex++;
          sellIndex++;
        }
      } else {
        // Skip incomplete trades
        if (!entryPrice || entryPrice === 0) buyIndex++;
        if (!exitPrice || exitPrice === 0) sellIndex++;
        if (entryPrice > 0 && exitPrice > 0 && quantity === 0) {
          buyIndex++;
          sellIndex++;
        }
      }
    }
  });

  // Helper to convert tradeDate to Date for sorting
  const toDate = (date: Date | string): Date => {
    if (date instanceof Date) {
      return date;
    }
    if (typeof date === "string") {
      return new Date(date);
    }

    return new Date();
  };

  return processed.sort((a, b) => {
    const dateA = toDate(a.tradeDate);
    const dateB = toDate(b.tradeDate);

    return dateB.getTime() - dateA.getTime();
  });
}

/**
 * Calculate trading metrics from processed trades
 */
export function calculateMetrics(trades: ProcessedTrade[]): TradeMetrics {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalPnL: 0,
      averageWin: 0,
      averageLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      profitFactor: 0,
    };
  }

  const winningTrades = trades.filter((t) => t.isWin);
  const losingTrades = trades.filter((t) => !t.isWin);

  const totalPnL = trades.reduce((sum, t) => sum + t.pnlAmount, 0);
  const totalWins = winningTrades.reduce((sum, t) => sum + t.pnlAmount, 0);
  const totalLosses = Math.abs(
    losingTrades.reduce((sum, t) => sum + t.pnlAmount, 0),
  );

  const averageWin =
    winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
  const averageLoss =
    losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
  const largestWin =
    winningTrades.length > 0
      ? Math.max(...winningTrades.map((t) => t.pnlAmount))
      : 0;
  const largestLoss =
    losingTrades.length > 0
      ? Math.min(...losingTrades.map((t) => t.pnlAmount))
      : 0;
  const profitFactor =
    totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

  return {
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: (winningTrades.length / trades.length) * 100,
    totalPnL,
    averageWin,
    averageLoss,
    largestWin,
    largestLoss,
    profitFactor,
  };
}

/**
 * Group trades by symbol
 */
export function groupTradesBySymbol(
  trades: ProcessedTrade[],
): Map<string, ProcessedTrade[]> {
  const grouped = new Map<string, ProcessedTrade[]>();

  trades.forEach((trade) => {
    if (!grouped.has(trade.symbol)) {
      grouped.set(trade.symbol, []);
    }
    grouped.get(trade.symbol)!.push(trade);
  });

  return grouped;
}

/**
 * Normalize trade dates after JSON deserialization
 * Converts date strings back to Date objects
 */
export function normalizeTradeDates(
  trades: ProcessedTrade[],
): ProcessedTrade[] {
  return trades.map((trade) => ({
    ...trade,
    tradeDate:
      trade.tradeDate instanceof Date
        ? trade.tradeDate
        : typeof trade.tradeDate === "string"
          ? new Date(trade.tradeDate)
          : new Date(),
  }));
}

/**
 * Calculate cumulative P&L over time
 */
export function calculateCumulativePnL(
  trades: ProcessedTrade[],
): Array<{ date: Date; pnl: number; cumulative: number }> {
  // Normalize dates first
  const normalizedTrades = normalizeTradeDates(trades);

  // Helper to convert tradeDate to Date object
  const toDate = (date: Date | string): Date => {
    if (date instanceof Date) {
      return date;
    }
    if (typeof date === "string") {
      return new Date(date);
    }

    return new Date();
  };

  const sorted = [...normalizedTrades].sort((a, b) => {
    const dateA = toDate(a.tradeDate);
    const dateB = toDate(b.tradeDate);

    return dateA.getTime() - dateB.getTime();
  });

  let cumulative = 0;

  return sorted.map((trade) => {
    cumulative += trade.pnlAmount;

    return {
      date: toDate(trade.tradeDate),
      pnl: trade.pnlAmount,
      cumulative,
    };
  });
}
