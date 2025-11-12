"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";

import { UserMenu } from "@/components/UserMenu";

function TimeDisplay() {
  const [now, setNow] = React.useState<Date | null>(null);

  React.useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000 * 30);

    return () => clearInterval(id);
  }, []);

  // Don't render anything on the server to avoid hydration mismatch
  if (!now) {
    return (
      <span className="flex items-center gap-2">
        <Icon
          className="text-lg text-finance-green"
          icon="solar:clock-circle-outline"
        />
        --
      </span>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <Icon
        className="text-lg text-finance-green"
        icon="solar:clock-circle-outline"
      />
      {new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(now)}
    </span>
  );
}

export function Navbar() {
  const pathname = usePathname();

  if (pathname === "/login") {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-finance-green-20 bg-finance-black-80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-6 py-4">
        <Link className="flex items-center gap-3" href="/">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-finance-green-50 bg-finance-surface-80">
            <Icon
              className="text-2xl text-finance-green"
              icon="solar:chart-square-outline"
            />
          </span>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-white">
              FFP Stock AI
            </span>
            <span className="text-xs uppercase tracking-[0.2em] text-finance-green-70">
              Moonshot Intelligence
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-4 text-xs text-zinc-400">
          <span className="hidden items-center gap-2 sm:inline-flex">
            <Icon
              className="text-lg text-finance-green"
              icon="solar:shield-check-line-duotone"
            />
            Internal Access
          </span>
          <TimeDisplay />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
