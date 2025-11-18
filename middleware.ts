import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

const AUTH_PATH = "/login";
const SIGNUP_PATH = "/signup";

function isPublicPath(pathname: string) {
  return (
    pathname === AUTH_PATH ||
    pathname === SIGNUP_PATH ||
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

  const pathname = req.nextUrl.pathname;

  // Get session first (needed for login page redirect)
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  // If authenticated and on login or signup page, redirect to home or redirectTo
  if (session && (pathname === AUTH_PATH || pathname === SIGNUP_PATH)) {
    const redirectTo = req.nextUrl.searchParams.get("redirectTo") || "/";
    // Ensure redirectTo is a valid path (prevent open redirects)
    const safeRedirectTo = redirectTo.startsWith("/") ? redirectTo : "/";
    // Use absolute URL for redirect
    const baseUrl = new URL(req.url);
    const redirectUrl = new URL(safeRedirectTo, baseUrl.origin);

    redirectUrl.search = ""; // Clear query params

    // eslint-disable-next-line no-console
    console.log(
      `[Middleware] Authenticated user on ${pathname} page, redirecting to: ${redirectUrl.toString()}`,
    );

    return NextResponse.redirect(redirectUrl);
  }

  // Skip auth check for public paths (but only if not authenticated)
  if (isPublicPath(pathname)) {
    return response;
  }

  // If no session and not on login page, redirect to login
  if (!session) {
    const redirectUrl = req.nextUrl.clone();

    redirectUrl.pathname = AUTH_PATH;
    redirectUrl.searchParams.set("redirectTo", pathname);

    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
