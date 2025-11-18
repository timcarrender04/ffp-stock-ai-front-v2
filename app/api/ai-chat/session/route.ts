import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    // Get user session to pass user_id
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // AI Chat service runs on port 8001
    const apiUrl = process.env.AI_CHAT_API_URL || "http://localhost:8001";
    const url = new URL(`${apiUrl}/api/chat/session`);

    if (user?.id) {
      url.searchParams.set("user_id", user.id);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown upstream error";

    return NextResponse.json(
      { error: "Failed to fetch chat session", message },
      { status: 500 },
    );
  }
}
