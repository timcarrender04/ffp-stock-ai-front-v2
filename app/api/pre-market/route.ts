import { NextResponse } from "next/server";

const DEFAULT_COLUMNS = [
  "symbol",
  "total_score",
  "recommendation",
  "confidence",
  "summary",
  "news_sentiment",
  "news_score",
  "gap_pct",
  "gap_type",
  "catalyst_type",
  "risk_factors",
  "entry_points",
  "spy_gap_pct",
  "qqq_gap_pct",
  "market_sentiment",
  "analysis_date",
  "analyzed_at",
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
  const limit = searchParams.get("limit") ?? "20";
  const analysisDate =
    searchParams.get("analysis_date") ?? new Date().toISOString().slice(0, 10);
  const columns = searchParams.get("select") ?? DEFAULT_COLUMNS.join(",");
  const minScore = searchParams.get("min_score");

  const url = new URL(
    `${kongUrl.replace(/\/$/, "")}/rest/v1/moonshot.pre_market_analysis`,
  );

  url.searchParams.set("select", columns);
  url.searchParams.set("order", "total_score.desc");
  url.searchParams.set("analysis_date", `eq.${analysisDate}`);
  url.searchParams.set("limit", limit);

  if (minScore) {
    url.searchParams.set("total_score", `gte.${minScore}`);
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
      { error: "Failed to fetch pre-market analysis", message },
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
