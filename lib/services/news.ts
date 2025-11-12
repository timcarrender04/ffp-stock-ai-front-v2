import type { SupabaseClient } from "@supabase/supabase-js";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type NewsEvent = {
  id: number;
  source: string;
  event_type: string;
  symbol: string | null;
  title: string | null;
  summary: string | null;
  movement: string | null;
  confidence: number | null;
  occurred_at: string;
  article_id: number | null;
  earning_id: number | null;
  created_at: string | null;
  ts: string;
};

export type NewsArticle = {
  id: number;
  source: string;
  source_id: string;
  headline: string;
  summary: string | null;
  url: string | null;
  image_url: string | null;
  category: string | null;
  published_at: string;
  primary_symbol: string | null;
  movement: string | null;
  confidence: number | null;
  created_at: string | null;
};

export type NewsQueueItem = {
  id: number;
  symbol: string;
  queue_status: string;
  priority: number | null;
  trigger_reason: string;
  trigger_data: Record<string, unknown> | null;
  research_data: Record<string, unknown> | null;
  processing_started_at: string | null;
  processing_completed_at: string | null;
  processing_duration: string | null;
  ai_analysis_result: Record<string, unknown> | null;
  confidence_score: number | null;
  error_count: number | null;
  last_error: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const EVENT_FIELDS = [
  "id",
  "source",
  "event_type",
  "symbol",
  "title",
  "summary",
  "movement",
  "confidence",
  "occurred_at",
  "article_id",
  "earning_id",
  "created_at",
  "ts",
];

const ARTICLE_FIELDS = [
  "id",
  "source",
  "source_id",
  "headline",
  "summary",
  "url",
  "image_url",
  "category",
  "published_at",
  "primary_symbol",
  "movement",
  "confidence",
  "created_at",
];

const QUEUE_FIELDS = [
  "id",
  "symbol",
  "queue_status",
  "priority",
  "trigger_reason",
  "trigger_data",
  "research_data",
  "processing_started_at",
  "processing_completed_at",
  "processing_duration",
  "ai_analysis_result",
  "confidence_score",
  "error_count",
  "last_error",
  "created_at",
  "updated_at",
];

export async function fetchLatestNewsEvents(limit = 8): Promise<NewsEvent[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .schema("news")
    .from("news_events")
    .select(EVENT_FIELDS.join(","))
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (error) {
    // eslint-disable-next-line no-console
    console.error(
      "[news-service] fetchLatestNewsEvents ERROR:",
      error.message || error,
    );

    return [];
  }

  // Ensure data is an array before casting
  const result = Array.isArray(data) ? data : [];

  return result as unknown as NewsEvent[];
}

export async function fetchLatestNewsArticles(
  limit = 6,
): Promise<NewsArticle[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .schema("news")
    .from("articles")
    .select(ARTICLE_FIELDS.join(","))
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    // eslint-disable-next-line no-console
    console.error(
      "[news-service] fetchLatestNewsArticles ERROR:",
      error.message || error,
    );

    return [];
  }

  // Ensure data is an array before casting
  const result = Array.isArray(data) ? data : [];

  return result as unknown as NewsArticle[];
}

export async function fetchNewsQueue(limit = 6): Promise<NewsQueueItem[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .schema("news")
    .from("ai_processing_queue")
    .select(QUEUE_FIELDS.join(","))
    .order("priority", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    // eslint-disable-next-line no-console
    console.error(
      "[news-service] fetchNewsQueue ERROR:",
      error.message || error,
    );

    return [];
  }

  // Ensure data is an array before casting
  const result = Array.isArray(data) ? data : [];

  return result as unknown as NewsQueueItem[];
}

async function getSupabase(): Promise<SupabaseClient> {
  return createServerSupabaseClient();
}
