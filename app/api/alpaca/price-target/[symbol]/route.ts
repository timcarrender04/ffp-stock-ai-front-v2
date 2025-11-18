import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * GET /api/alpaca/price-target/[symbol]
 * Get current price and AI-suggested price target for a symbol
 * This proxies to the backend API service
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
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

    const symbol = params.symbol?.toUpperCase().trim();

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol is required" },
        { status: 400 }
      );
    }

    // Get backend API URL from environment
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // Proxy request to backend
    const backendUrl = `${apiUrl}/api/alpaca/price-target/${symbol}`;

    try {
      const response = await fetch(backendUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Don't cache price data - it changes frequently
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
          { error: errorData.detail || "Failed to fetch price target" },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (fetchError) {
      console.error("Error fetching price target from backend:", fetchError);
      return NextResponse.json(
        {
          error: "Failed to connect to backend service",
          message:
            fetchError instanceof Error
              ? fetchError.message
              : "Unknown error",
        },
        { status: 502 }
      );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

