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

function usePowerHour() {
  const [isPowerHour, setIsPowerHour] = React.useState(false);

  React.useEffect(() => {
    const checkPowerHour = () => {
      const now = new Date();
      const etTimeString = now.toLocaleString("en-US", {
        timeZone: "America/New_York",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      const [hours, minutes] = etTimeString.split(":").map(Number);
      const currentMinutes = hours * 60 + minutes;

      const powerHourStart = 15 * 60;
      const powerHourEnd = 16 * 60;

      const isInPowerHour =
        currentMinutes >= powerHourStart && currentMinutes < powerHourEnd;

      setIsPowerHour(isInPowerHour);
    };

    checkPowerHour();
    const interval = setInterval(checkPowerHour, 60000);

    return () => clearInterval(interval);
  }, []);

  return isPowerHour;
}

export function Navbar() {
  const pathname = usePathname();
  const isPowerHour = usePowerHour();

  if (pathname === "/login") {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full max-w-full border-b border-finance-green-20 bg-finance-black-80 backdrop-blur-xl overflow-x-hidden">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 w-full max-w-full">
        <Link
          className="flex items-center gap-2 sm:gap-3 active:opacity-70 transition-opacity min-h-[44px] sm:min-h-0"
          href="/"
        >
          <span className="inline-flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-2xl border border-finance-green-50 bg-finance-surface-80">
            <Icon
              className="text-xl sm:text-2xl text-finance-green"
              icon="solar:chart-square-outline"
            />
          </span>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-semibold text-white">
              FFP Stock AI
            </span>
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-finance-green-70">
              Moonshot Intelligence
            </span>
          </div>
        </Link>

        {/* Power Hour Banner */}
        {isPowerHour && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden sm:block">
            <div className="bg-orange-600 text-white px-3 py-1.5 sm:px-6 sm:py-2 rounded-lg shadow-2xl border-2 border-orange-400 animate-pulse">
              <h1 className="text-xl sm:text-3xl font-black tracking-wider text-center whitespace-nowrap">
                🕐 POWER HOUR 🚀
              </h1>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-4 text-xs text-zinc-400">
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
