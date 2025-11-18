import { NextRequest, NextResponse } from "next/server";

import { processTrades, Trade } from "@/lib/services/analytics";
import { getAlpacaOrders } from "@/lib/services/alpaca";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "paper";

    // Validate mode
    if (mode !== "paper" && mode !== "live") {
      return NextResponse.json(
        { error: "Mode must be 'paper' or 'live'" },
        { status: 400 },
      );
    }

    // Get authenticated user
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to view trading analytics." },
        { status: 401 },
      );
    }

    // Get orders directly from Alpaca using user's Vault credentials
    try {
      const orders = await getAlpacaOrders(user.id, mode as "paper" | "live", {
        status: "all",
        limit: 500,
      });

      // Convert AlpacaOrder format to Trade format
      const trades: Trade[] = orders.map((order) => ({
        id: order.id,
        symbol: order.symbol,
        side: order.side,
        quantity: order.qty ? parseFloat(order.qty) : 0,
        qty: order.qty ? parseFloat(order.qty) : undefined,
        filled_qty: order.filled_qty ? parseFloat(order.filled_qty) : undefined,
        order_type: order.order_type,
        status: order.status,
        limit_price: order.limit_price
          ? parseFloat(order.limit_price)
          : undefined,
        stop_price: order.stop_price ? parseFloat(order.stop_price) : undefined,
        avg_fill_price: order.filled_avg_price
          ? parseFloat(order.filled_avg_price)
          : undefined,
        submitted_at: order.submitted_at,
        filled_at: order.filled_at || null,
        created_at: order.created_at,
        updated_at: order.updated_at,
        client_order_id: order.client_order_id,
      }));

      const processedTrades = processTrades(trades);

      return NextResponse.json(processedTrades, {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Check if it's a credentials error
      if (
        errorMessage.includes("No Alpaca credentials found") ||
        errorMessage.includes("credentials") ||
        errorMessage.includes("vault secret")
      ) {
        return NextResponse.json(
          {
            error: "Alpaca credentials not configured",
            message:
              "Please configure your Alpaca API keys in the settings to view trading analytics.",
            hint: "Go to User Menu > Alpaca Integration to add your credentials",
          },
          { status: 403 },
        );
      }

      console.error("Error fetching trades from Alpaca:", error);

      return NextResponse.json(
        {
          error: "Failed to fetch trades",
          message: errorMessage,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    console.error("Error in trades route:", error);

    return NextResponse.json(
      { error: "Failed to fetch trades", message },
      { status: 500 },
    );
  }
}
