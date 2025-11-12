import type { SupabaseClient } from "@supabase/supabase-js";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type MarketCondition = {
  date: string;
  spy_correlation: number | null;
  qqq_correlation: number | null;
  iwm_correlation: number | null;
  volatility_percentile: number | null;
  vix_level: number | null;
  sector_performance: Record<string, number> | null;
  sector_rotation: Record<string, string> | null;
  advancing_stocks: number | null;
  declining_stocks: number | null;
  new_highs: number | null;
  new_lows: number | null;
  market_trend: string | null;
  trend_strength: number | null;
  put_call_ratio: number | null;
  fear_greed_index: number | null;
  created_at: string | null;
  updated_at: string | null;
};

export type MarketBreadth = {
  date: string;
  advancing_issues: number | null;
  declining_issues: number | null;
  unchanged_issues: number | null;
  up_volume: number | null;
  down_volume: number | null;
  adv_dec_line: number | null;
  adv_dec_volume: number | null;
};

export type MarketSentiment = {
  date: string;
  sentiment_score: number | null;
  bull_minus_bear: number | null;
  crowd_sentiment: number | null;
};

const CONDITION_FIELDS = [
  "date",
  "spy_correlation",
  "qqq_correlation",
  "iwm_correlation",
  "volatility_percentile",
  "vix_level",
  "sector_performance",
  "sector_rotation",
  "advancing_stocks",
  "declining_stocks",
  "new_highs",
  "new_lows",
  "market_trend",
  "trend_strength",
  "put_call_ratio",
  "fear_greed_index",
  "created_at",
  "updated_at",
];

const BREADTH_FIELDS = [
  "date",
  "advancing_issues",
  "declining_issues",
  "unchanged_issues",
  "up_volume",
  "down_volume",
  "adv_dec_line",
  "adv_dec_volume",
];

const SENTIMENT_FIELDS = [
  "date",
  "sentiment_score",
  "bull_minus_bear",
  "crowd_sentiment",
];

export async function fetchLatestMarketCondition(): Promise<MarketCondition | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .schema("market")
    .from("conditions")
    .select(CONDITION_FIELDS.join(","))
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    // eslint-disable-next-line no-console
    console.error(
      "[market-service] fetchLatestMarketCondition ERROR:",
      error.message || error,
    );

    return null;
  }

  return (data ?? null) as MarketCondition | null;
}

export async function fetchMarketBreadth(limit = 10): Promise<MarketBreadth[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .schema("market")
    .from("daily_breadth")
    .select(BREADTH_FIELDS.join(","))
    .order("date", { ascending: false })
    .limit(limit);

  if (error) {
    // eslint-disable-next-line no-console
    console.error(
      "[market-service] fetchMarketBreadth ERROR:",
      error.message || error,
    );

    return [];
  }

  // Ensure data is an array before casting
  const result = Array.isArray(data) ? data : [];

  return result as unknown as MarketBreadth[];
}

export async function fetchMarketSentiment(
  limit = 10,
): Promise<MarketSentiment[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .schema("market")
    .from("daily_sentiment")
    .select(SENTIMENT_FIELDS.join(","))
    .order("date", { ascending: false })
    .limit(limit);

  if (error) {
    // eslint-disable-next-line no-console
    console.error(
      "[market-service] fetchMarketSentiment ERROR:",
      error.message || error,
    );

    return [];
  }

  // Ensure data is an array before casting
  const result = Array.isArray(data) ? data : [];

  return result as unknown as MarketSentiment[];
}

async function getSupabase(): Promise<SupabaseClient> {
  return createServerSupabaseClient();
}
