"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/";

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
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
      },
    );

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return { error: signInError.message };
    }

    // Redirect to the intended destination
    // The middleware will handle the redirect properly
    redirect(redirectTo);
  } catch (error) {
    // Log error for debugging (consider using a proper logging service in production)
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("Login error:", error);
    }

    return { error: "An unexpected error occurred. Please try again." };
  }
}
