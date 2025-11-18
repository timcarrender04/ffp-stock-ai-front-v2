import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getAlpacaOrder,
  cancelAlpacaOrder,
  type TradingMode,
} from "@/lib/services/alpaca";
import { createServerAdminClient } from "@/lib/supabase/server-admin";

/**
 * GET /api/alpaca/orders/[id]
 * Get a specific order by ID
 * Query params: mode=paper|live (default: paper)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const mode = (searchParams.get("mode") || "paper") as TradingMode;

    if (mode !== "paper" && mode !== "live") {
      return NextResponse.json(
        { error: "Invalid mode. Must be 'paper' or 'live'" },
        { status: 400 },
      );
    }

    const order = await getAlpacaOrder(user.id, mode, id);

    // Save to database for tracking
    const adminClient = createServerAdminClient();

    await adminClient.from("user_trading.user_trading_orders").upsert(
      {
        user_id: user.id,
        alpaca_order_id: order.id,
        symbol: order.symbol,
        side: order.side,
        order_type: order.order_type,
        quantity: order.qty ? parseFloat(order.qty) : null,
        filled_quantity: order.filled_qty ? parseFloat(order.filled_qty) : 0,
        limit_price: order.limit_price ? parseFloat(order.limit_price) : null,
        stop_price: order.stop_price ? parseFloat(order.stop_price) : null,
        filled_avg_price: order.filled_avg_price
          ? parseFloat(order.filled_avg_price)
          : null,
        trail_percent: order.trail_percent
          ? parseFloat(order.trail_percent)
          : null,
        trail_price: order.trail_price ? parseFloat(order.trail_price) : null,
        status: order.status,
        trading_mode: mode,
        time_in_force: order.time_in_force,
        submitted_at: order.submitted_at,
        filled_at: order.filled_at,
        canceled_at: order.canceled_at,
        expired_at: order.expired_at,
      },
      {
        onConflict: "user_id,alpaca_order_id",
      },
    );

    return NextResponse.json(order);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/alpaca/orders/[id]
 * Cancel a specific order
 * Query params: mode=paper|live (default: paper)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const mode = (searchParams.get("mode") || "paper") as TradingMode;

    if (mode !== "paper" && mode !== "live") {
      return NextResponse.json(
        { error: "Invalid mode. Must be 'paper' or 'live'" },
        { status: 400 },
      );
    }

    await cancelAlpacaOrder(user.id, mode, id);

    // Update order in database
    const adminClient = createServerAdminClient();

    await adminClient
      .from("user_trading.user_trading_orders")
      .update({
        status: "canceled",
        canceled_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("alpaca_order_id", id)
      .eq("trading_mode", mode);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
