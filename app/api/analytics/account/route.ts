import { NextRequest, NextResponse } from "next/server";

import { AccountInfo } from "@/lib/services/analytics";
import { getAlpacaAccount } from "@/lib/services/alpaca";
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
        { error: "Unauthorized. Please sign in to view account information." },
        { status: 401 },
      );
    }

    // Get account directly from Alpaca using user's Vault credentials
    try {
      const alpacaAccount = await getAlpacaAccount(
        user.id,
        mode as "paper" | "live",
      );

      // Convert AlpacaAccount format to AccountInfo format
      const account: AccountInfo = {
        buying_power: parseFloat(alpacaAccount.buying_power),
        cash: parseFloat(alpacaAccount.cash),
        portfolio_value: parseFloat(alpacaAccount.portfolio_value),
        equity: parseFloat(alpacaAccount.equity),
        daytrading_buying_power: alpacaAccount.daytrading_buying_power
          ? parseFloat(alpacaAccount.daytrading_buying_power)
          : undefined,
        pattern_day_trader: alpacaAccount.pattern_day_trader,
        trading_blocked: alpacaAccount.trading_blocked,
      };

      return NextResponse.json(account, {
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
              "Please configure your Alpaca API keys in the settings to view account information.",
            hint: "Go to User Menu > Alpaca Integration to add your credentials",
          },
          { status: 403 },
        );
      }

      console.error("Error fetching account from Alpaca:", error);

      return NextResponse.json(
        {
          error: "Failed to fetch account",
          message: errorMessage,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    console.error("Error in account route:", error);

    return NextResponse.json(
      { error: "Failed to fetch account", message },
      { status: 500 },
    );
  }
}
