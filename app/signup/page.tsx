"use client";

import React, { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Form } from "@heroui/form";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Checkbox } from "@heroui/checkbox";
import { Icon } from "@iconify/react";

import { signupAction } from "./actions";

import { useAuth } from "@/lib/supabase/auth-context";

function AlertDisclaimer() {
  return (
    <div className="relative w-full max-w-xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 animate-pulse rounded-2xl bg-gradient-to-r from-red-600/40 via-transparent to-red-600/40 blur-3xl"
      />
      <div className="relative flex gap-3 rounded-2xl border border-red-500/70 bg-gradient-to-r from-red-900/90 via-red-800/80 to-red-900/90 px-5 py-4 text-sm leading-relaxed text-red-50 shadow-[0_0_35px_rgba(248,113,113,0.55)]">
        <span aria-label="Alert" className="text-2xl" role="img">
          🚨
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-200">
            Alert: Educational Use Only
          </p>
          <p className="mt-2 text-sm text-red-50/90">
            FFP Stock AI is a research tool to support your own decision making.
            Nothing shown here is financial advice, we do not manage your risk,
            and you accept full responsibility for every trade and any losses.
          </p>
        </div>
      </div>
    </div>
  );
}

function SignupForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { session, isLoading: authLoading } = useAuth();
  const [isVisible, setIsVisible] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [enablePaperTrading, setEnablePaperTrading] = React.useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && session) {
      const redirectTo = searchParams.get("redirectTo") || "/";

      router.replace(redirectTo);
    }
  }, [session, authLoading, router, searchParams]);

  const toggleVisibility = () => setIsVisible((prev) => !prev);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Prevent form submission if already authenticated
    if (session) {
      const redirectTo = searchParams.get("redirectTo") || "/";

      router.replace(redirectTo);

      return;
    }

    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);

    formData.set("redirectTo", searchParams.get("redirectTo") || "/");
    formData.set("enablePaperTrading", enablePaperTrading ? "true" : "false");

    try {
      const result = await signupAction(formData);

      // If result exists and has an error, show it
      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      }
      // If no result/undefined (redirect was called), the server action will redirect
      // and the page will automatically redirect. Don't do anything here.
    } catch (err) {
      // Handle any unexpected errors
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again.";

      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-finance-green-30 bg-finance-surface-60 backdrop-blur-lg shadow-2xl flex w-full max-w-sm flex-col gap-5 px-8 pt-8 pb-10 text-white">
      <div>
        <p className="text-left text-3xl font-semibold tracking-tight text-finance-green">
          Create Account
        </p>
        <p className="mt-1 text-sm text-zinc-300">
          Sign up to access Moonshot dashboards.
        </p>
      </div>
      <Form
        className="flex flex-col gap-4"
        validationBehavior="native"
        onSubmit={handleSubmit}
      >
        <Input
          isRequired
          classNames={{
            inputWrapper:
              "bg-transparent border-finance-green-40 hover:border-finance-green focus:border-finance-green",
            label: "text-zinc-200",
            input: "text-white",
          }}
          label="Email"
          labelPlacement="outside"
          name="email"
          placeholder="trader@ffpstock.ai"
          radius="sm"
          type="email"
          variant="bordered"
        />
        <Input
          isRequired
          classNames={{
            inputWrapper:
              "bg-transparent border-finance-green-40 hover:border-finance-green focus:border-finance-green",
            label: "text-zinc-200",
            input: "text-white",
          }}
          label="Full Name"
          labelPlacement="outside"
          name="fullName"
          placeholder="John Doe"
          radius="sm"
          type="text"
          variant="bordered"
        />
        <Input
          isRequired
          classNames={{
            inputWrapper:
              "bg-transparent border-finance-green-40 hover:border-finance-green focus:border-finance-green",
            label: "text-zinc-200",
            input: "text-white",
          }}
          endContent={
            <button
              className="text-finance-green-80 hover:text-finance-green"
              type="button"
              onClick={toggleVisibility}
            >
              {isVisible ? (
                <Icon
                  aria-hidden="true"
                  className="text-2xl"
                  icon="solar:eye-closed-linear"
                />
              ) : (
                <Icon
                  aria-hidden="true"
                  className="text-2xl"
                  icon="solar:eye-bold"
                />
              )}
            </button>
          }
          label="Password"
          labelPlacement="outside"
          name="password"
          placeholder="Enter your password"
          radius="sm"
          type={isVisible ? "text" : "password"}
          variant="bordered"
        />
        <Input
          isRequired
          classNames={{
            inputWrapper:
              "bg-transparent border-finance-green-40 hover:border-finance-green focus:border-finance-green",
            label: "text-zinc-200",
            input: "text-white",
          }}
          endContent={
            <button
              className="text-finance-green-80 hover:text-finance-green"
              type="button"
              onClick={toggleVisibility}
            >
              {isVisible ? (
                <Icon
                  aria-hidden="true"
                  className="text-2xl"
                  icon="solar:eye-closed-linear"
                />
              ) : (
                <Icon
                  aria-hidden="true"
                  className="text-2xl"
                  icon="solar:eye-bold"
                />
              )}
            </button>
          }
          label="Confirm Password"
          labelPlacement="outside"
          name="confirmPassword"
          placeholder="Confirm your password"
          radius="sm"
          type={isVisible ? "text" : "password"}
          variant="bordered"
        />
        <div className="flex flex-col gap-2 px-1">
          <Checkbox
            classNames={{
              label: "text-zinc-300 text-sm",
            }}
            isSelected={enablePaperTrading}
            size="sm"
            onValueChange={setEnablePaperTrading}
          >
            Enable Paper Trading Account
          </Checkbox>
          <p className="text-xs text-zinc-400 px-6">
            Create a paper trading account to practice trading strategies with
            virtual money.
          </p>
        </div>
        {error ? (
          <p className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}
        <Button
          className="w-full bg-finance-green text-black font-semibold"
          color="success"
          isLoading={isLoading}
          spinnerPlacement="end"
          type="submit"
        >
          Sign Up
        </Button>
        <p className="text-center text-sm text-zinc-400">
          Already have an account?{" "}
          <Link
            className="text-finance-green hover:text-finance-green-80 underline"
            href="/login"
          >
            Log in
          </Link>
        </p>
      </Form>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-finance-black via-black to-finance-slate px-4">
      <div className="flex w-full max-w-4xl flex-col items-center gap-8">
        <AlertDisclaimer />
        <Suspense fallback={<div className="text-white">Loading...</div>}>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}
