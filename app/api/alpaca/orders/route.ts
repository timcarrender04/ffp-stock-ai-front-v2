import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getAlpacaOrders,
  getAlpacaOrder,
  createAlpacaOrder,
  cancelAllAlpacaOrders,
  type TradingMode,
  type CreateOrderRequest,
} from "@/lib/services/alpaca";
import { createServerAdminClient } from "@/lib/supabase/server-admin";

/**
 * GET /api/alpaca/orders
 * Get all orders or a specific order
 * Query params:
 *   - mode=paper|live (default: paper)
 *   - status=open|closed|all (default: all)
 *   - limit (optional)
 *   - order_id (optional, to get a specific order)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mode = (searchParams.get("mode") || "paper") as TradingMode;
    const orderId = searchParams.get("order_id");
    const status = searchParams.get("status") as
      | "open"
      | "closed"
      | "all"
      | null;
    const limit = searchParams.get("limit");

    if (mode !== "paper" && mode !== "live") {
      return NextResponse.json(
        { error: "Invalid mode. Must be 'paper' or 'live'" },
        { status: 400 },
      );
    }

    if (orderId) {
      // Get specific order
      const order = await getAlpacaOrder(user.id, mode, orderId);

      // Also save to database for tracking
      await saveOrderToDatabase(user.id, order, mode);

      return NextResponse.json(order);
    }

    // Get all orders
    const orders = await getAlpacaOrders(user.id, mode, {
      status: status || "all",
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    // Save orders to database for tracking
    for (const order of orders) {
      await saveOrderToDatabase(user.id, order, mode);
    }

    return NextResponse.json(orders);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/alpaca/orders
 * Create a new order
 * Body: CreateOrderRequest
 * Query params: mode=paper|live (default: paper)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mode = (searchParams.get("mode") || "paper") as TradingMode;

    if (mode !== "paper" && mode !== "live") {
      return NextResponse.json(
        { error: "Invalid mode. Must be 'paper' or 'live'" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const orderRequest = body as CreateOrderRequest;

    // Validate required fields
    if (!orderRequest.symbol || !orderRequest.side || !orderRequest.type) {
      return NextResponse.json(
        { error: "Missing required fields: symbol, side, type" },
        { status: 400 },
      );
    }

    // Validate quantity or notional
    if (!orderRequest.qty && !orderRequest.notional) {
      return NextResponse.json(
        { error: "Either qty or notional must be provided" },
        { status: 400 },
      );
    }

    // Create order via Alpaca API
    const order = await createAlpacaOrder(user.id, mode, orderRequest);

    // Save to database for tracking
    await saveOrderToDatabase(user.id, order, mode);

    return NextResponse.json(order);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/alpaca/orders
 * Cancel all orders
 * Query params: mode=paper|live (default: paper)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mode = (searchParams.get("mode") || "paper") as TradingMode;

    if (mode !== "paper" && mode !== "live") {
      return NextResponse.json(
        { error: "Invalid mode. Must be 'paper' or 'live'" },
        { status: 400 },
      );
    }

    await cancelAllAlpacaOrders(user.id, mode);

    // Update orders in database to canceled status
    const adminClient = createServerAdminClient();

    await adminClient
      .from("user_trading.user_trading_orders")
      .update({
        status: "canceled",
        canceled_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("trading_mode", mode)
      .in("status", ["new", "accepted", "pending_new", "pending_replace"]);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Helper function to save order to database
 */
async function saveOrderToDatabase(
  userId: string,
  order: any,
  mode: TradingMode,
) {
  const adminClient = createServerAdminClient();

  await adminClient.from("user_trading.user_trading_orders").upsert(
    {
      user_id: userId,
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
}
