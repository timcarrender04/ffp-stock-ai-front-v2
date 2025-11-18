"use client";

import { useEffect, useState } from "react";

/**
 * PowerHourOverlay component
 * Displays a bright orange overlay with 50% opacity during power hour (3-4 PM ET)
 */
export function PowerHourOverlay() {
  const [isPowerHour, setIsPowerHour] = useState(false);

  useEffect(() => {
    const checkPowerHour = () => {
      // Get current time in Eastern Time (ET)
      const now = new Date();
      const etTimeString = now.toLocaleString("en-US", {
        timeZone: "America/New_York",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      const [hours, minutes] = etTimeString.split(":").map(Number);
      const currentMinutes = hours * 60 + minutes;

      // Power hour is 3:00 PM (15:00) to 4:00 PM (16:00) ET
      const powerHourStart = 15 * 60; // 3:00 PM = 900 minutes
      const powerHourEnd = 16 * 60; // 4:00 PM = 960 minutes

      const isInPowerHour =
        currentMinutes >= powerHourStart && currentMinutes < powerHourEnd;

      setIsPowerHour(isInPowerHour);
    };

    // Check immediately
    checkPowerHour();

    // Check every minute
    const interval = setInterval(checkPowerHour, 60000);

    return () => clearInterval(interval);
  }, []);

  if (!isPowerHour) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10"
      style={{
        backgroundColor: "rgba(255, 140, 0, 0.5)", // Bright orange with 50% opacity
      }}
    />
  );
}
