import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const { session_id } = body;

    // AI Chat service runs on port 8001
    const apiUrl = process.env.AI_CHAT_API_URL || "http://localhost:8001";
    const response = await fetch(`${apiUrl}/api/chat/clear`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user?.id || undefined,
        session_id: session_id || undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      throw new Error(
        errorData.detail || `Backend API error: ${response.status}`,
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown upstream error";

    return NextResponse.json(
      { error: "Failed to clear chat", message },
      { status: 500 },
    );
  }
}
