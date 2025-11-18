import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getAlpacaPositions,
  getAlpacaPosition,
  type TradingMode,
} from "@/lib/services/alpaca";

/**
 * GET /api/alpaca/positions
 * Get all positions or a specific position
 * Query params:
 *   - mode=paper|live (default: paper)
 *   - symbol (optional, to get a specific position)
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
    const symbol = searchParams.get("symbol");

    if (mode !== "paper" && mode !== "live") {
      return NextResponse.json(
        { error: "Invalid mode. Must be 'paper' or 'live'" },
        { status: 400 },
      );
    }

    if (symbol) {
      // Get specific position
      const position = await getAlpacaPosition(
        user.id,
        mode,
        symbol.toUpperCase(),
      );

      return NextResponse.json(position);
    }

    // Get all positions
    const positions = await getAlpacaPositions(user.id, mode);

    return NextResponse.json(positions);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
