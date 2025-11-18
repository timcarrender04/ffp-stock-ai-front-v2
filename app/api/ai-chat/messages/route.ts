import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "50";

    // AI Chat service runs on port 8001
    const apiUrl = process.env.AI_CHAT_API_URL || "http://localhost:8001";
    const response = await fetch(`${apiUrl}/api/chat/messages?limit=${limit}`);

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown upstream error";

    return NextResponse.json(
      { error: "Failed to fetch chat messages", message },
      { status: 500 },
    );
  }
}
