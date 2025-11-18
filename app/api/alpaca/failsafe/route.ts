import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  closeAllAlpacaPositions,
  cancelAllAlpacaOrders,
  getAlpacaAccount,
  type TradingMode,
} from "@/lib/services/alpaca";
import { createServerAdminClient } from "@/lib/supabase/server-admin";

/**
 * POST /api/alpaca/failsafe
 * Emergency fail-safe: Close all positions and cancel all orders
 * Query params: mode=paper|live (default: paper)
 * 
 * This is a safety mechanism to immediately:
 * 1. Cancel all pending/open orders
 * 2. Close all open positions
 * 3. Log the action for audit purposes
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

    const results = {
      orders_canceled: 0,
      positions_closed: 0,
      errors: [] as string[],
    };

    // Step 1: Cancel all orders
    try {
      await cancelAllAlpacaOrders(user.id, mode);
      
      // Update orders in database to canceled status
      const adminClient = createServerAdminClient();
      const { count } = await adminClient
        .from("user_trading.user_trading_orders")
        .update({
          status: "canceled",
          canceled_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("trading_mode", mode)
        .in("status", ["new", "accepted", "pending_new", "pending_replace"]);

      results.orders_canceled = count || 0;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      results.errors.push(`Failed to cancel orders: ${errorMsg}`);
    }

    // Step 2: Close all positions
    try {
      const closedPositions = await closeAllAlpacaPositions(user.id, mode);
      results.positions_closed = Array.isArray(closedPositions)
        ? closedPositions.length
        : 1;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      results.errors.push(`Failed to close positions: ${errorMsg}`);
    }

    // Step 3: Log the fail-safe action to database
    try {
      const adminClient = createServerAdminClient();
      await adminClient.from("user_trading.user_failsafe_logs").insert({
        user_id: user.id,
        trading_mode: mode,
        orders_canceled: results.orders_canceled,
        positions_closed: results.positions_closed,
        errors: results.errors.length > 0 ? results.errors : null,
        triggered_at: new Date().toISOString(),
        triggered_by: "user",
      });
    } catch (error) {
      // Non-critical - log error but don't fail the request
      console.error("Failed to log failsafe action:", error);
    }

    // Return success even if there were some errors (partial success)
    return NextResponse.json({
      success: true,
      message: "Fail-safe executed",
      results,
      warnings:
        results.errors.length > 0
          ? "Some operations may have failed. Please verify manually."
          : undefined,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/alpaca/failsafe/status
 * Check if fail-safe should be triggered automatically based on account status
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

    // Get account status
    const account = await getAlpacaAccount(user.id, mode);

    // Check conditions that might trigger fail-safe
    const shouldTriggerFailsafe =
      account.trading_blocked ||
      account.account_blocked ||
      account.transfers_blocked;

    const warnings = [];
    if (account.trading_blocked) {
      warnings.push("Trading is blocked");
    }
    if (account.account_blocked) {
      warnings.push("Account is blocked");
    }
    if (account.transfers_blocked) {
      warnings.push("Transfers are blocked");
    }

    return NextResponse.json({
      should_trigger_failsafe: shouldTriggerFailsafe,
      warnings,
      account_status: {
        trading_blocked: account.trading_blocked,
        account_blocked: account.account_blocked,
        transfers_blocked: account.transfers_blocked,
        status: account.status,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

