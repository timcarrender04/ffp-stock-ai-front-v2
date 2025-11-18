"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function loginAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/";

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  try {
    const cookieStore = await cookies();

    // IMPORTANT: Use the same public URL as the browser/middleware so cookies share the SAME name/domain.
    // If we use SUPABASE_URL (internal Docker host), Supabase will create a different cookie
    // (e.g. sb-supabase_kong_supabase-ffp-auth-token) that middleware/browser won't see.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return { error: "Server configuration error" };
    }

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    });

    const { error: signInError, data } = await supabase.auth.signInWithPassword(
      {
        email,
        password,
      },
    );

    if (signInError) {
      return { error: signInError.message };
    }

    // Verify session was created before redirecting
    if (!data?.session) {
      return {
        error:
          "Login successful but session was not created. Please try again.",
      };
    }

    // Re-fetch session to ensure it's persisted in cookies
    const {
      data: { session: verifiedSession },
    } = await supabase.auth.getSession();

    if (!verifiedSession) {
      return {
        error: "Session verification failed. Please try again.",
      };
    }

    // Revalidate the path to ensure middleware sees the new session
    revalidatePath(redirectTo);
    revalidatePath("/");

    // Wait for cookie propagation and ensure cookies are committed
    // Increased delay to ensure cookies are fully set before redirect
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Redirect to the intended destination or home
    redirect(redirectTo);
  } catch (error) {
    // Re-throw Next.js redirect errors
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }

    // Log error for debugging (consider using a proper logging service in production)
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("Login error:", error);
    }

    return { error: "An unexpected error occurred. Please try again." };
  }
}
