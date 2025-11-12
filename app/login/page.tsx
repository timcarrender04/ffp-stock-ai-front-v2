"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Form } from "@heroui/form";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Checkbox } from "@heroui/checkbox";
import { Icon } from "@iconify/react";

import { loginAction } from "./actions";

function LoginForm() {
  const searchParams = useSearchParams();
  const [isVisible, setIsVisible] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const toggleVisibility = () => setIsVisible((prev) => !prev);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);

    formData.set("redirectTo", searchParams.get("redirectTo") || "/");

    try {
      const result = await loginAction(formData);

      // If result exists and has an error, show it
      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      }
      // If no result (redirect was called), the page will redirect automatically
    } catch {
      // Handle any unexpected errors
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-finance-green-30 bg-finance-surface-60 backdrop-blur-lg shadow-2xl flex w-full max-w-sm flex-col gap-5 px-8 pt-8 pb-10 text-white">
      <div>
        <p className="text-left text-3xl font-semibold tracking-tight text-finance-green">
          Welcome Back
        </p>
        <p className="mt-1 text-sm text-zinc-300">
          Internal access for Moonshot dashboards.
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
        <div className="flex items-center justify-between px-1">
          <Checkbox
            classNames={{
              label: "text-zinc-300",
            }}
            name="remember"
            size="sm"
          >
            Remember me
          </Checkbox>
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
          Log In
        </Button>
      </Form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-finance-black via-black to-finance-slate">
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
