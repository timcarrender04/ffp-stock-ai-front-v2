import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    kongUrl: process.env.SUPABASE_KONG_URL,
    supabaseUrlAlt: process.env.SUPABASE_URL,
  });
}
