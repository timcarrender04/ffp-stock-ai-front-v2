import { Metadata } from "next";

import { RotatingSignalWall } from "@/components/dashboard/RotatingSignalWall";

export const metadata: Metadata = {
  title: "Signal Wall",
  description:
    "Auto-rotating dashboard cycling through Moonshot top tiers and trading recommendations.",
};

export default function SignalWallPage() {
  return <RotatingSignalWall />;
}
