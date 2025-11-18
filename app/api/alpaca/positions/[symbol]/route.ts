import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  closeAlpacaPosition,
  type TradingMode,
} from "@/lib/services/alpaca";

/**
 * DELETE /api/alpaca/positions/[symbol]
 * Close a specific position by symbol
 * Query params: mode=paper|live (default: paper)
 *               qty (optional, to close partial position)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
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

    const { symbol } = await params;
    const { searchParams } = new URL(request.url);
    const mode = (searchParams.get("mode") || "paper") as TradingMode;
    const qty = searchParams.get("qty");

    if (mode !== "paper" && mode !== "live") {
      return NextResponse.json(
        { error: "Invalid mode. Must be 'paper' or 'live'" },
        { status: 400 },
      );
    }

    // Close position (optionally with quantity)
    const order = await closeAlpacaPosition(
      user.id,
      mode,
      symbol.toUpperCase(),
      qty ? parseFloat(qty) : undefined,
    );

    return NextResponse.json({
      success: true,
      message: `Position ${symbol.toUpperCase()} closed successfully`,
      order,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

