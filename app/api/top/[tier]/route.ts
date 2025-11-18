import { type SupabaseClient, createClient } from "@supabase/supabase-js";
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

  // Server-side: prefer internal Docker network URL, fallback to public URL
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Supabase configuration missing" },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const { searchParams } = new URL(request.url);
  const limit = Number.parseInt(searchParams.get("limit") ?? "25", 10);
  const scanDate = searchParams.get("scan_date");
  const columns = searchParams.get("select") || DEFAULT_COLUMNS.join(",");

  try {
    const resolvedScanDate =
      scanDate ?? (await getLatestScanDateForTable(supabase, table));

    let query = supabase
      .schema(SCHEMA_PROFILE)
      .from(table)
      .select(columns)
      .order("rank", { ascending: true })
      .limit(Number.isNaN(limit) ? 25 : limit);

    if (resolvedScanDate) {
      query = query.eq("scan_date", resolvedScanDate);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch tier data", message: error.message },
        { status: 502 },
      );
    }

    return NextResponse.json(data ?? [], { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown upstream error";

    return NextResponse.json(
      { error: "Failed to fetch tier data", message },
      { status: 502 },
    );
  }
}

async function getLatestScanDateForTable(
  supabase: SupabaseClient,
  table: string,
) {
  const { data, error } = await supabase
    .schema(SCHEMA_PROFILE)
    .from(table)
    .select("scan_date")
    .not("scan_date", "is", null)
    .order("scan_date", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data?.scan_date ?? null;
}
