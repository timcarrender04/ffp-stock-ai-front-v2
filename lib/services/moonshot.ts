import type { SupabaseClient } from "@supabase/supabase-js";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type MoonshotTopEntry = {
  id: number;
  rank: number;
  symbol: string;
  scan_date: string | null;
  moonshot_score: number | null;
  price: number | null;
  price_change_pct: number | null;
  volume: number | null;
  volume_ratio: number | null;
  ai_recommendation: string | null;
  risk_level: string | null;
  confidence_score: number | null;
  sentiment_alignment: number | null;
  trending_status: string | null;
  ai_quality_score: number | null;
};

export type MoonshotRecommendation = {
  id: number;
  symbol: string;
  recommendation_timestamp: string;
  moonshot_rank: number | null;
  moonshot_score: number | null;
  total_points: number | null;
  moonshot_consensus_level: string | null;
  moonshot_action_threshold: string | null;
  ta_score: number | null;
  news_sentiment_score: number | null;
  social_buzz_score: number | null;
  composite_score: number | null;
  recommended_action: string | null;
  decision_strength: string | null;
  trade_decision: boolean | null;
  time_horizon: string | null;
  confidence_level: number | null;
  risk_level: string | null;
  price_change_pct_24h: number | null;
  volume_ratio: number | null;
  created_at: string | null;
};

export type MoonshotConsensus = {
  id: number;
  symbol: string;
  decision_timestamp: string;
  moonshot_rank: number | null;
  moonshot_total_points: number | null;
  moonshot_confidence: number | null;
  moonshot_consensus: string | null;
  trade_decision: boolean | null;
  decision_strength: string | null;
  recommended_action: string | null;
  timeframe: string | null;
  risk_reward_ratio: number | null;
  position_size_pct: number | null;
};

const TOP_FIELDS = [
  "id",
  "rank",
  "symbol",
  "scan_date",
  "moonshot_score",
  "price",
  "price_change_pct",
  "volume",
  "volume_ratio",
  "ai_recommendation",
  "risk_level",
  "confidence_score",
  "sentiment_alignment",
  "trending_status",
  "ai_quality_score",
];

const RECOMMENDATION_FIELDS = [
  "id",
  "symbol",
  "recommendation_timestamp",
  "moonshot_rank",
  "moonshot_score",
  "total_points",
  "moonshot_consensus_level",
  "moonshot_action_threshold",
  "ta_score",
  "news_sentiment_score",
  "social_buzz_score",
  "composite_score",
  "recommended_action",
  "decision_strength",
  "trade_decision",
  "time_horizon",
  "confidence_level",
  "risk_level",
  "price_change_pct_24h",
  "volume_ratio",
  "created_at",
];

const CONSENSUS_FIELDS = [
  "id",
  "symbol",
  "decision_timestamp",
  "moonshot_rank",
  "moonshot_total_points",
  "moonshot_confidence",
  "moonshot_consensus",
  "trade_decision",
  "decision_strength",
  "recommended_action",
  "timeframe",
  "risk_reward_ratio",
  "position_size_pct",
];

export async function fetchMoonshotTop(limit = 6): Promise<MoonshotTopEntry[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .schema("moonshot")
    .from("top_25")
    .select(TOP_FIELDS.join(","))
    .order("rank", { ascending: true })
    .limit(limit);

  if (error) {
    // eslint-disable-next-line no-console
    console.error(
      "[moonshot-service] fetchMoonshotTop ERROR:",
      error.message || error,
    );

    return [];
  }

  // Ensure data is an array before casting
  const result = Array.isArray(data) ? data : [];

  return result as unknown as MoonshotTopEntry[];
}

export async function fetchMoonshotRecommendations(
  limit = 6,
): Promise<MoonshotRecommendation[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .schema("moonshot")
    .from("trading_recommendations")
    .select(RECOMMENDATION_FIELDS.join(","))
    .order("recommendation_timestamp", { ascending: false })
    .limit(limit);

  if (error) {
    // eslint-disable-next-line no-console
    console.error(
      "[moonshot-service] fetchMoonshotRecommendations ERROR:",
      error.message || error,
    );

    return [];
  }

  // Ensure data is an array before casting
  const result = Array.isArray(data) ? data : [];

  return result as unknown as MoonshotRecommendation[];
}

export async function fetchMoonshotConsensus(
  limit = 6,
): Promise<MoonshotConsensus[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .schema("moonshot")
    .from("master_trade_decisions")
    .select(CONSENSUS_FIELDS.join(","))
    .order("decision_timestamp", { ascending: false })
    .limit(limit);

  if (error) {
    // eslint-disable-next-line no-console
    console.error(
      "[moonshot-service] fetchMoonshotConsensus ERROR:",
      error.message || error,
    );

    return [];
  }

  // Ensure data is an array before casting
  const result = Array.isArray(data) ? data : [];

  return result as unknown as MoonshotConsensus[];
}

async function getSupabase(): Promise<SupabaseClient> {
  return createServerSupabaseClient();
}
