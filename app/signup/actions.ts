"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function signupAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const fullName = (formData.get("fullName") as string)?.trim();
  const enablePaperTrading = formData.get("enablePaperTrading") === "true";
  const redirectTo = (formData.get("redirectTo") as string) || "/";

  // Validation
  if (!email || !password || !confirmPassword || !fullName) {
    return { error: "Please fill in all required fields." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  try {
    const cookieStore = await cookies();

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

    // Sign up the user
    const { error: signUpError, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          name: fullName,
          enable_paper_trading: enablePaperTrading,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || ""}${redirectTo}`,
      },
    });

    if (signUpError) {
      return { error: signUpError.message };
    }

    // Verify session was created
    if (!data?.session && !data?.user) {
      return {
        error:
          "Signup successful but session was not created. Please check your email to verify your account.",
      };
    }

    // If paper trading is enabled and we have a session, create the account
    if (enablePaperTrading && data?.session && data?.user) {
      try {
        // Get the access token for API calls
        const accessToken = data.session.access_token;

        // Call the backend API to create paper trading account
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await fetch(`${apiUrl}/api/paper-trading/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            email: email,
            name: fullName,
          }),
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ detail: "Unknown error" }));

          console.error("Failed to create paper trading account:", errorData);
          // Don't fail the signup if paper trading account creation fails
          // The user can create it later
        } else {
          const accountData = await response.json();

          console.log("Paper trading account created:", accountData);
        }
      } catch (error) {
        console.error("Error creating paper trading account:", error);
        // Don't fail the signup if paper trading account creation fails
      }
    }

    // Re-fetch session to ensure it's persisted in cookies
    const {
      data: { session: verifiedSession },
    } = await supabase.auth.getSession();

    if (!verifiedSession && !data?.user) {
      return {
        error:
          "Signup successful but please check your email to verify your account before logging in.",
      };
    }

    // Revalidate the path to ensure middleware sees the new session
    revalidatePath(redirectTo);
    revalidatePath("/");

    // Wait for cookie propagation
    await new Promise((resolve) => setTimeout(resolve, 300));

    // If we have a session, redirect to the intended destination
    if (verifiedSession || data?.session) {
      redirect(redirectTo);
    } else {
      // If email confirmation is required, redirect to a success page
      redirect("/signup?success=true&verify=true");
    }
  } catch (error) {
    // Re-throw Next.js redirect errors
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }

    // Log error for debugging
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("Signup error:", error);
    }

    return { error: "An unexpected error occurred. Please try again." };
  }
}
