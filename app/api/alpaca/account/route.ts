import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAlpacaAccount, type TradingMode } from "@/lib/services/alpaca";

/**
 * GET /api/alpaca/account
 * Get Alpaca account information
 * Query params: mode=paper|live (default: paper)
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

    if (mode !== "paper" && mode !== "live") {
      return NextResponse.json(
        { error: "Invalid mode. Must be 'paper' or 'live'" },
        { status: 400 },
      );
    }

    const account = await getAlpacaAccount(user.id, mode);

    return NextResponse.json(account);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Log error for debugging
    console.error("Error in /api/alpaca/account:", error);

    // Return more detailed error information
    return NextResponse.json(
      {
        error: message,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
