"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing Supabase browser credentials");
  }

  return createBrowserClient(url, anonKey, {
    // Completely disable Realtime to prevent WebSocket connection errors
    // We use the AI Chat WebSocket service instead for real-time messaging
    // Note: Supabase client may still initialize Realtime, but we won't use it
    global: {
      headers: {
        "X-Client-Info": "ffp-stock-ai-frontend",
      },
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });
}
