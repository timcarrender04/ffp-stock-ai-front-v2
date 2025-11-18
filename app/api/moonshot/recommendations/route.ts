import { NextResponse } from "next/server";

const SCHEMA_PROFILE = "moonshot";
const TABLE_NAME = "trading_recommendations";

const DEFAULT_COLUMNS = [
  "id",
  "symbol",
  "recommendation_timestamp",
  "moonshot_rank",
  "source_tier",
  "current_price",
  "recommended_action",
  "composite_score",
  "confidence_level",
  "trade_decision",
  "decision_strength",
  "primary_signal",
  "supporting_signals",
  "warning_flags",
  "entry_price_optimal",
  "stop_loss_price",
  "target_1_price",
  "target_2_price",
  "target_3_price",
  "risk_reward_ratio",
  "timeframe",
  "execution_status",
  "created_at",
];

export async function GET(request: Request) {
  // Use direct PostgREST URL (localhost:54321 for local dev, kong:8000 for Docker)
  // This bypasses Kong's JWT validation which causes issues with mismatched keys
  const postgrestUrl =
    process.env.POSTGREST_URL ||
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!postgrestUrl) {
    return NextResponse.json(
      { error: "PostgREST configuration missing" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit") ?? "25";
  const columns = searchParams.get("select") || DEFAULT_COLUMNS.join(",");

  const url = new URL(
    `${postgrestUrl.replace(/\/$/, "")}/rest/v1/${TABLE_NAME}`,
  );

  url.searchParams.set("select", columns);
  url.searchParams.set("order", "composite_score.desc");
  url.searchParams.set("limit", limit);
  url.searchParams.set("execution_status", "neq.closed");
  url.searchParams.set("trade_decision", "eq.true");

  // Headers for PostgREST - specify the moonshot schema
  const headers: Record<string, string> = {
    "Accept-Profile": SCHEMA_PROFILE,
    "Content-Profile": SCHEMA_PROFILE,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  try {
    const res = await fetch(url.toString(), {
      headers,
      next: { revalidate: 10 },
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
      { error: "Failed to fetch moonshot recommendations", message },
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
