"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { Spinner } from "@heroui/spinner";
import { User } from "@heroui/user";

import { createClient } from "@/lib/supabase/client";
import { AlpacaSettingsModal } from "@/components/trading/AlpacaSettingsModal";

type SessionUser = {
  email: string;
  avatarUrl?: string;
  fullName?: string;
};

export function UserMenu() {
  const supabase = React.useMemo(() => createClient(), []);
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAlpacaSettingsOpen, setIsAlpacaSettingsOpen] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      setIsLoading(true);
      const { data } = await supabase.auth.getSession();

      if (!isMounted) return;
      const sessionUser = data.session?.user;

      setUser(
        sessionUser
          ? {
              email: sessionUser.email ?? "Unknown user",
              avatarUrl:
                (sessionUser.user_metadata?.avatar_url as string | undefined) ??
                undefined,
              fullName:
                ((sessionUser.user_metadata?.full_name ||
                  sessionUser.user_metadata?.name) as string | undefined) ??
                undefined,
            }
          : null,
      );
      setIsLoading(false);
    };

    void hydrate();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const sessionUser = session?.user;

        setUser(
          sessionUser
            ? {
                email: sessionUser.email ?? "Unknown user",
                avatarUrl:
                  (sessionUser.user_metadata?.avatar_url as
                    | string
                    | undefined) ?? undefined,
                fullName:
                  ((sessionUser.user_metadata?.full_name ||
                    sessionUser.user_metadata?.name) as string | undefined) ??
                  undefined,
              }
            : null,
        );
      },
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = React.useCallback(async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }, [supabase]);

  const handleAlpacaClick = React.useCallback(() => {
    setIsAlpacaSettingsOpen(true);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-finance-green-30/60 bg-black/40">
        <Spinner color="success" size="sm" />
      </div>
    );
  }

  if (!user) {
    return (
      <button
        className="inline-flex items-center gap-2 rounded-2xl border border-finance-green-40 bg-finance-green/10 px-3 py-2 text-xs uppercase tracking-[0.2em] text-finance-green"
        onClick={() => (window.location.href = "/login")}
      >
        <Icon className="text-sm" icon="solar:login-2-line-duotone" />
        Sign In
      </button>
    );
  }

  const initials = user.fullName
    ? user.fullName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user.email.slice(0, 2).toUpperCase();

  return (
    <>
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <button className="rounded-2xl border border-finance-green-30 bg-black/30 px-2 py-1 text-left transition hover:border-finance-green-60">
            <User
              avatarProps={{
                src: user.avatarUrl,
                name: initials,
                className: "border border-finance-green-60 bg-finance-surface",
              }}
              className="max-w-[200px] text-left text-white"
              description={user.email}
              name={user.fullName ?? user.email}
            />
          </button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="User menu"
          className="min-w-[220px]"
          variant="flat"
        >
          <DropdownItem key="email" isReadOnly className="cursor-default">
            <div className="flex flex-col gap-1 text-xs">
              <span className="text-zinc-400">Signed in as</span>
              <span className="font-semibold text-white">{user.email}</span>
            </div>
          </DropdownItem>
          <DropdownItem
            key="alpaca"
            className="text-sm"
            onPress={handleAlpacaClick}
          >
            <div className="flex items-center gap-2">
              <Icon className="text-base" icon="solar:chart-2-bold" />
              Alpaca Integration
            </div>
          </DropdownItem>
          <DropdownItem
            key="analytics"
            as={Link}
            className="text-sm"
            href="/analytics"
          >
            <div className="flex items-center gap-2">
              <Icon className="text-base" icon="solar:graph-up-bold" />
              Trading Analytics
            </div>
          </DropdownItem>
          <DropdownItem
            key="logout"
            className="text-sm"
            color="danger"
            onPress={handleSignOut}
          >
            <div className="flex items-center gap-2">
              <Icon className="text-base" icon="solar:logout-2-line-duotone" />
              Sign out
            </div>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
      <AlpacaSettingsModal
        isOpen={isAlpacaSettingsOpen}
        onClose={() => setIsAlpacaSettingsOpen(false)}
      />
    </>
  );
}
