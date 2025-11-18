"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { AuthProvider } from "@/lib/supabase/auth-context";
import { ChatProvider } from "@/lib/ai-chat/ChatProvider";
import { AlertProvider } from "@/lib/contexts/AlertContext";

// Configure Iconify to handle API errors gracefully
import "@/lib/iconify-config";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <AuthProvider>
      <HeroUIProvider navigate={router.push}>
        <NextThemesProvider {...themeProps}>
          <AlertProvider>
            <ChatProvider>{children}</ChatProvider>
          </AlertProvider>
        </NextThemesProvider>
      </HeroUIProvider>
    </AuthProvider>
  );
}
