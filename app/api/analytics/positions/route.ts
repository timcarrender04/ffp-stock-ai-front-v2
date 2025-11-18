import { NextRequest, NextResponse } from "next/server";

import { Position } from "@/lib/services/analytics";
import { getAlpacaPositions } from "@/lib/services/alpaca";
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
        { error: "Unauthorized. Please sign in to view positions." },
        { status: 401 },
      );
    }

    // Get positions directly from Alpaca using user's Vault credentials
    try {
      const alpacaPositions = await getAlpacaPositions(
        user.id,
        mode as "paper" | "live",
      );

      // Convert AlpacaPosition format to Position format
      const positions: Position[] = alpacaPositions.map((pos) => ({
        symbol: pos.symbol,
        qty: parseFloat(pos.qty),
        avg_entry_price: parseFloat(pos.cost_basis) / parseFloat(pos.qty),
        current_price: pos.current_price
          ? parseFloat(pos.current_price)
          : undefined,
        market_value: parseFloat(pos.market_value),
        cost_basis: parseFloat(pos.cost_basis),
        unrealized_pl: parseFloat(pos.unrealized_pl),
        unrealized_plpc: parseFloat(pos.unrealized_plpc),
        side: pos.side,
      }));

      return NextResponse.json(positions || [], {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
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
              "Please configure your Alpaca API keys in the settings to view positions.",
            hint: "Go to User Menu > Alpaca Integration to add your credentials",
          },
          { status: 403 },
        );
      }

      console.error("Error fetching positions from Alpaca:", error);

      return NextResponse.json(
        {
          error: "Failed to fetch positions",
          message: errorMessage,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    console.error("Error in positions route:", error);

    return NextResponse.json(
      { error: "Failed to fetch positions", message },
      { status: 500 },
    );
  }
}
