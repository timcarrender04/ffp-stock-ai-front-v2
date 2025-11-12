import type { SupabaseClient } from "@supabase/supabase-js";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type DailyScalpPerformance = {
  id: number;
  trade_date: string;
  total_trades: number | null;
  winning_trades: number | null;
  losing_trades: number | null;
  gross_pnl: number | null;
  net_pnl: number | null;
  win_rate: number | null;
  avg_win: number | null;
  avg_loss: number | null;
  profit_factor: number | null;
  max_drawdown: number | null;
  sharpe_ratio: number | null;
  calculated_at: string | null;
};

export type DailyScalpPosition = {
  id: number;
  symbol: string;
  quantity: number;
  side: string;
  avg_entry_price: number;
  entry_timestamp: string;
  current_price: number | null;
  unrealized_pnl: number | null;
  stop_loss_price: number | null;
  take_profit_price: number | null;
  exit_price: number | null;
  exit_timestamp: string | null;
  realized_pnl: number | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type DailyScalpOrder = {
  id: number;
  symbol: string;
  order_type: string;
  side: string;
  quantity: number;
  entry_price: number | null;
  entry_timestamp: string | null;
  stop_loss_price: number | null;
  take_profit_price: number | null;
  risk_reward_ratio: number | null;
  confidence_score: number | null;
  status: string | null;
  executed_at: string | null;
  execution_price: number | null;
  timeframe_source: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const PERFORMANCE_FIELDS = [
  "id",
  "trade_date",
  "total_trades",
  "winning_trades",
  "losing_trades",
  "gross_pnl",
  "net_pnl",
  "win_rate",
  "avg_win",
  "avg_loss",
  "profit_factor",
  "max_drawdown",
  "sharpe_ratio",
  "calculated_at",
];

const POSITION_FIELDS = [
  "id",
  "symbol",
  "quantity",
  "side",
  "avg_entry_price",
  "entry_timestamp",
  "current_price",
  "unrealized_pnl",
  "stop_loss_price",
  "take_profit_price",
  "exit_price",
  "exit_timestamp",
  "realized_pnl",
  "status",
  "created_at",
  "updated_at",
];

const ORDER_FIELDS = [
  "id",
  "symbol",
  "order_type",
  "side",
  "quantity",
  "entry_price",
  "entry_timestamp",
  "stop_loss_price",
  "take_profit_price",
  "risk_reward_ratio",
  "confidence_score",
  "status",
  "executed_at",
  "execution_price",
  "timeframe_source",
  "created_at",
  "updated_at",
];

export async function fetchDailyScalpPerformance(
  limit = 7,
): Promise<DailyScalpPerformance[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .schema("daily_scalp")
    .from("performance_metrics")
    .select(PERFORMANCE_FIELDS.join(","))
    .order("trade_date", { ascending: false })
    .limit(limit);

  if (error) {
    // eslint-disable-next-line no-console
    console.error(
      "[daily-scalp-service] fetchDailyScalpPerformance ERROR:",
      error.message || error,
    );

    return [];
  }

  // Ensure data is an array before casting
  const result = Array.isArray(data) ? data : [];

  return result as unknown as DailyScalpPerformance[];
}

export async function fetchActiveDailyScalpPositions(
  limit = 6,
): Promise<DailyScalpPosition[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .schema("daily_scalp")
    .from("positions")
    .select(POSITION_FIELDS.join(","))
    .eq("status", "open")
    .order("entry_timestamp", { ascending: false })
    .limit(limit);

  if (error) {
    // eslint-disable-next-line no-console
    console.error(
      "[daily-scalp-service] fetchActiveDailyScalpPositions ERROR:",
      error.message || error,
    );

    return [];
  }

  // Ensure data is an array before casting
  const result = Array.isArray(data) ? data : [];

  return result as unknown as DailyScalpPosition[];
}

export async function fetchUpcomingDailyScalpOrders(
  limit = 6,
): Promise<DailyScalpOrder[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .schema("daily_scalp")
    .from("orders_to_execute")
    .select(ORDER_FIELDS.join(","))
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    // eslint-disable-next-line no-console
    console.error(
      "[daily-scalp-service] fetchUpcomingDailyScalpOrders ERROR:",
      error.message || error,
    );

    return [];
  }

  // Ensure data is an array before casting
  const result = Array.isArray(data) ? data : [];

  return result as unknown as DailyScalpOrder[];
}

async function getSupabase(): Promise<SupabaseClient> {
  return createServerSupabaseClient();
}
