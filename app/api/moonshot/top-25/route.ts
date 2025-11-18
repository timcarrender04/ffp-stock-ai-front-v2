import { NextResponse } from "next/server";

import {
  isTradingHours,
  sendMoonshotNotifications,
} from "@/lib/utils/discord-notifications";

const SCHEMA_PROFILE = "moonshot";

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
  "ai_quality_score",
  "ai_pattern_type",
  "ai_recommendation",
  "created_at",
  "updated_at",
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
  const scanDate = searchParams.get("scan_date");
  const columns = searchParams.get("select") || DEFAULT_COLUMNS.join(",");

  // NOTE: Currently only top_25 table is populated by the backend scanner
  // TODO: Update backend to populate top_50 and top_100 tables separately
  // For now, we use top_25 table for all tiers and rely on rank filtering
  const tableName = "top_25";

  const url = new URL(
    `${postgrestUrl.replace(/\/$/, "")}/rest/v1/${tableName}`,
  );

  url.searchParams.set("select", columns);
  url.searchParams.set("order", "rank.asc");

  // Filter by rank to get the appropriate tier
  const tierLimit = parseInt(limit);

  if (!isNaN(tierLimit)) {
    url.searchParams.set("rank", `lte.${tierLimit}`);
  }
  url.searchParams.set("limit", limit);

  // Headers for PostgREST - specify the moonshot schema
  const headers: Record<string, string> = {
    "Accept-Profile": SCHEMA_PROFILE,
    "Content-Profile": SCHEMA_PROFILE,
    "Content-Type": "application/json",
    Prefer: "return=representation",
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

    // Check for pending Discord notifications (non-blocking)
    checkAndSendNotifications(postgrestUrl).catch((err) => {
      // Log error but don't block the response
      console.error("Error processing Discord notifications:", err);
    });

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

/**
 * Check for pending notifications and send Discord webhooks
 * This runs asynchronously and doesn't block the API response
 */
async function checkAndSendNotifications(postgrestUrl: string): Promise<void> {
  const webhookUrl = process.env.DISCORD_MOONSHOT_WEBHOOK_URL;

  // Skip if webhook URL is not configured
  if (!webhookUrl) {
    return;
  }

  // Only process during trading hours
  if (!isTradingHours()) {
    return;
  }

  try {
    // Query for pending notifications
    const today = new Date().toISOString().slice(0, 10);
    const notificationsUrl = new URL(
      `${postgrestUrl.replace(/\/$/, "")}/rest/v1/notified_symbols`,
    );

    notificationsUrl.searchParams.set("select", "*");
    notificationsUrl.searchParams.set("notified_date", `eq.${today}`);
    notificationsUrl.searchParams.set("webhook_sent", "eq.false");
    notificationsUrl.searchParams.set("order", "notified_at.asc");

    const headers: Record<string, string> = {
      "Accept-Profile": SCHEMA_PROFILE,
      "Content-Profile": SCHEMA_PROFILE,
      "Content-Type": "application/json",
    };

    const notificationsRes = await fetch(notificationsUrl.toString(), {
      headers,
    });

    if (!notificationsRes.ok) {
      console.error(
        `Failed to fetch pending notifications: ${notificationsRes.status}`,
      );

      return;
    }

    const pendingNotifications = await notificationsRes.json();

    if (
      !Array.isArray(pendingNotifications) ||
      pendingNotifications.length === 0
    ) {
      return;
    }

    // Prepare symbol data for notifications
    const symbolsToNotify = pendingNotifications.map((notif: any) => ({
      symbol: notif.symbol,
      rank: notif.rank || 0,
      moonshot_score: notif.moonshot_score,
      price_change_pct: notif.price_change_pct,
      volume_ratio: notif.volume_ratio,
      confidence_score: notif.confidence_score,
    }));

    // Send notifications
    const successCount = await sendMoonshotNotifications(
      webhookUrl,
      symbolsToNotify,
    );

    if (successCount > 0) {
      // Update webhook_sent flag for successfully notified symbols
      const notifiedSymbols = symbolsToNotify
        .slice(0, successCount)
        .map((s: any) => s.symbol);

      for (const symbol of notifiedSymbols) {
        const updateUrl = new URL(
          `${postgrestUrl.replace(/\/$/, "")}/rest/v1/notified_symbols`,
        );

        // PostgREST filter syntax: symbol=eq.SYMBOL&notified_date=eq.DATE
        updateUrl.searchParams.set("symbol", `eq.${symbol}`);
        updateUrl.searchParams.set("notified_date", `eq.${today}`);

        const updateRes = await fetch(updateUrl.toString(), {
          method: "PATCH",
          headers: {
            ...headers,
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            webhook_sent: true,
            webhook_sent_at: new Date().toISOString(),
          }),
        });

        if (!updateRes.ok) {
          console.error(
            `Failed to update notification status for ${symbol}: ${updateRes.status}`,
          );
        }
      }

      console.log(
        `Successfully sent ${successCount} Discord notification(s) for new Moonshot symbols`,
      );
    }
  } catch (error) {
    // Log error but don't throw - we don't want to break the API response
    console.error("Error in notification processing:", error);
  }
}

function safeParse(payload: string) {
  try {
    return JSON.parse(payload);
  } catch {
    return payload;
  }
}
