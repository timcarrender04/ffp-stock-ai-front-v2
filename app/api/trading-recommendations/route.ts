import { NextResponse } from "next/server";

const DEFAULT_COLUMNS = [
  "id",
  "symbol",
  "recommendation_date",
  "recommendation_type",
  "entry_tier",
  "recommended_action",
  "enhanced_composite_score",
  "social_composite_score",
  "social_signal_strength",
  "social_trend_direction",
  "auto_trade",
  "confidence",
  "position_size",
  "entry_price",
  "stop_loss",
  "target_price",
  "reason",
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
  const recommendationDate =
    searchParams.get("recommendation_date") ||
    new Date().toISOString().slice(0, 10);
  const columns = searchParams.get("select") || DEFAULT_COLUMNS.join(",");
  const type = searchParams.get("type");

  const url = new URL(
    `${kongUrl.replace(/\/$/, "")}/rest/v1/moonshot.trading_recommendations`,
  );

  url.searchParams.set("select", columns);
  url.searchParams.set("order", "enhanced_composite_score.desc");
  url.searchParams.set("limit", limit);
  url.searchParams.set("recommendation_date", `eq.${recommendationDate}`);
  url.searchParams.set("execution_status", "neq.closed");

  if (type) {
    url.searchParams.set("recommendation_type", `eq.${type}`);
  }

  try {
    const res = await fetch(url.toString(), {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      next: { revalidate: 30 },
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
      { error: "Failed to fetch trading recommendations", message },
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
