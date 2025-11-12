import { NextResponse } from "next/server";

const ALLOWED_TIERS = new Map<string, string>([
  ["25", "top_25"],
  ["50", "top_50"],
  ["100", "top_100"],
]);

const SCHEMA_PROFILE = "moonshot";

const DEFAULT_COLUMNS = [
  "symbol",
  "scan_date",
  "rank",
  "moonshot_score",
  "volume_ratio",
  "price_change_pct",
  "price",
  "volume",
  "volume_quality",
  "ai_recommendation",
  "ai_quality_score",
  "total_points",
  "weighted_score",
  "social_buzz_score",
  "sentiment_alignment",
  "trending_status",
];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tier: string }> },
) {
  const { tier } = await params;
  const table = ALLOWED_TIERS.get(tier);

  if (!table) {
    return NextResponse.json(
      { error: "Tier must be 25, 50, or 100" },
      { status: 400 },
    );
  }

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

  const url = new URL(`${kongUrl.replace(/\/$/, "")}/rest/v1/${table}`);

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
  }

  try {
    const res = await fetch(url.toString(), {
      headers,
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
      { error: "Failed to fetch tier data", message },
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
