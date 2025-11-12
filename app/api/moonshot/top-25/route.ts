import { NextResponse } from "next/server";

const SCHEMA_PROFILE = "moonshot";
const TABLE_NAME = "top_25";

const DEFAULT_COLUMNS = [
  "id",
  "rank",
  "symbol",
  "scan_date",
  "moonshot_score",
  "volume_ratio",
  "price_change_pct",
  "price",
  "volume",
  "volume_quality",
  "social_buzz_score",
  "chatter_velocity",
  "sentiment_alignment",
  "social_confidence",
  "ai_consensus",
  "trending_status",
  "stocktwits_confidence",
  "reddit_mention_count",
  "action_required",
  "entry_points",
  "target_price",
  "stop_loss",
  "risk_level",
  "timeframe",
  "total_points",
  "weighted_score",
  "confidence_score",
  "created_at",
  "updated_at",
];

export async function GET(request: Request) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const kongUrl =
    process.env.SUPABASE_KONG_URL ||
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !kongUrl) {
    return NextResponse.json(
      { error: "Supabase configuration missing" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit") ?? "25";
  const scanDate = searchParams.get("scan_date");
  const columns = searchParams.get("select") || DEFAULT_COLUMNS.join(",");

  const url = new URL(`${kongUrl.replace(/\/$/, "")}/rest/v1/${TABLE_NAME}`);

  url.searchParams.set("select", columns);
  url.searchParams.set("order", "rank.asc");
  url.searchParams.set("limit", limit);

  // Headers for Supabase REST API
  const headers: Record<string, string> = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    "Accept-Profile": SCHEMA_PROFILE,
    "Content-Profile": SCHEMA_PROFILE,
  };

  if (scanDate) {
    url.searchParams.set("scan_date", `eq.${scanDate}`);
  } else {
    // Get today's data by default
    const today = new Date().toISOString().slice(0, 10);

    url.searchParams.set("scan_date", `eq.${today}`);
  }

  try {
    const res = await fetch(url.toString(), {
      headers,
      next: { revalidate: 10 }, // Cache for 10 seconds
    });

    const text = await res.text();
    const contentType = res.headers.get("content-type") || "application/json";

    if (!res.ok) {
      return NextResponse.json(
        {
          error: `Upstream error ${res.status}`,
          body: safeParse(text),
        },
        { status: res.status },
      );
    }

    return new NextResponse(text, {
      status: res.status,
      headers: { "content-type": contentType },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown upstream error";

    return NextResponse.json(
      { error: "Failed to fetch moonshot top 25 data", message },
      { status: 502 },
    );
  }
}

function safeParse(payload: string) {
  try {
    return JSON.parse(payload);
  } catch {
    return payload;
  }
}

