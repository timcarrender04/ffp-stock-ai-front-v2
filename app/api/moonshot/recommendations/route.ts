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
  const columns = searchParams.get("select") || DEFAULT_COLUMNS.join(",");

  const url = new URL(`${kongUrl.replace(/\/$/, "")}/rest/v1/${TABLE_NAME}`);

  url.searchParams.set("select", columns);
  url.searchParams.set("order", "composite_score.desc");
  url.searchParams.set("limit", limit);
  url.searchParams.set("execution_status", "neq.closed");
  url.searchParams.set("trade_decision", "eq.true");

  // Headers for Supabase REST API
  const headers: Record<string, string> = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    "Accept-Profile": SCHEMA_PROFILE,
    "Content-Profile": SCHEMA_PROFILE,
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
