import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

const AUTH_PATH = "/login";

function isPublicPath(pathname: string) {
  return (
    pathname === AUTH_PATH ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/public")
  );
}

export async function middleware(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    // eslint-disable-next-line no-console
    console.warn(
      "Supabase middleware disabled: missing environment variables.",
    );

    return NextResponse.next();
  }

  let supabaseClient;
  let response;

  try {
    const client = createSupabaseMiddlewareClient(req);

    supabaseClient = client.supabase;
    response = client.response;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to create Supabase middleware client:", error);

    return NextResponse.next();
  }
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  const pathname = req.nextUrl.pathname;

  if (!session && !isPublicPath(pathname)) {
    const redirectUrl = req.nextUrl.clone();

    redirectUrl.pathname = AUTH_PATH;
    redirectUrl.searchParams.set("redirectTo", pathname);

    return NextResponse.redirect(redirectUrl);
  }

  if (session && pathname === AUTH_PATH) {
    const redirectUrl = req.nextUrl.clone();

    redirectUrl.pathname = "/";
    redirectUrl.searchParams.delete("redirectTo");

    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
