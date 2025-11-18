import { Metadata } from "next";

import { PreMarketSnapshot } from "@/components/dashboard/PreMarketSnapshot";
import { RotatingSignalWall } from "@/components/dashboard/RotatingSignalWall";

export const metadata: Metadata = {
  title: "Signal Wall",
  description:
    "Auto-rotating dashboard cycling through Moonshot top tiers and trading recommendations.",
};

export default function SignalWallPage() {
  return (
    <div className="flex flex-col gap-8">
      <PreMarketSnapshot />
      <RotatingSignalWall />
    </div>
  );
}
