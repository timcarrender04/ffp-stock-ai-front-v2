import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get request body
    const body = await request.json();

    // AI Chat service - use internal Docker network URL
    const apiUrl = process.env.AI_CHAT_API_URL || "http://ai-agent-chat:8001";
    const url = `${apiUrl}/api/chat/message`;

    // Forward the request to the backend with user_id
    // Use longer timeout for LLM inference - can take several minutes
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes timeout
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...body,
        user_id: user?.id || body.user_id || "",
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");

      throw new Error(`Backend API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown upstream error";

    // eslint-disable-next-line no-console
    console.error("Error proxying message to AI chat:", error);

    return NextResponse.json(
      { error: "Failed to send message", message },
      { status: 500 },
    );
  }
}
