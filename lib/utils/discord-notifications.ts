/**
 * Discord Notification Utilities
 * Handles Discord webhook notifications for new Moonshot symbols
 */

interface MoonshotSymbolData {
  symbol: string;
  rank: number;
  moonshot_score: number | null;
  price_change_pct: number | null;
  volume_ratio: number | null;
  confidence_score: number | null;
}

/**
 * Check if current time is within trading hours (9 AM - 5 PM EST/EDT)
 * @returns true if current time is between 9:00 AM and 5:00 PM EST/EDT
 */
export function isTradingHours(): boolean {
  // Get current time in America/New_York timezone (handles EST/EDT automatically)
  const now = new Date();
  const estTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" }),
  );

  const hours = estTime.getHours();
  const minutes = estTime.getMinutes();
  const currentTimeMinutes = hours * 60 + minutes;

  // Trading hours: 9:00 AM (540 minutes) to 5:00 PM (1020 minutes)
  const tradingStartMinutes = 9 * 60; // 9:00 AM
  const tradingEndMinutes = 17 * 60; // 5:00 PM

  return (
    currentTimeMinutes >= tradingStartMinutes &&
    currentTimeMinutes < tradingEndMinutes
  );
}

/**
 * Format a number as percentage with sign
 */
function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "N/A";
  const sign = value >= 0 ? "+" : "";

  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Format a number with 2 decimal places
 */
function formatDecimal(value: number | null | undefined): string {
  if (value === null || value === undefined) return "N/A";

  return value.toFixed(2);
}

/**
 * Send Discord webhook notification for a new Moonshot symbol
 * @param webhookUrl Discord webhook URL
 * @param symbolData Symbol data to include in notification
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function sendMoonshotNotification(
  webhookUrl: string,
  symbolData: MoonshotSymbolData,
): Promise<boolean> {
  try {
    // Create Discord embed
    const embed = {
      title: `🚀 New Symbol Added to Top 25: $${symbolData.symbol}`,
      description: `A new symbol has been added to the Moonshot Top 25 during trading hours.`,
      color: 0x00ff00, // Green color
      fields: [
        {
          name: "📊 Rank",
          value: `#${symbolData.rank}`,
          inline: true,
        },
        {
          name: "⭐ Moonshot Score",
          value: formatDecimal(symbolData.moonshot_score),
          inline: true,
        },
        {
          name: "📈 24h Price Change",
          value: formatPercent(symbolData.price_change_pct),
          inline: true,
        },
        {
          name: "📊 Volume Ratio",
          value: formatDecimal(symbolData.volume_ratio),
          inline: true,
        },
        {
          name: "🎯 Confidence Score",
          value: symbolData.confidence_score
            ? `${(Number(symbolData.confidence_score) * 100).toFixed(1)}%`
            : "N/A",
          inline: true,
        },
        {
          name: "⏰ Detected At",
          value: new Date().toLocaleString("en-US", {
            timeZone: "America/New_York",
            dateStyle: "short",
            timeStyle: "short",
          }),
          inline: true,
        },
      ],
      footer: {
        text: "FFP Stock AI - Moonshot Scanner",
      },
      timestamp: new Date().toISOString(),
    };

    const payload = {
      embeds: [embed],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        `Discord webhook failed: ${response.status} ${response.statusText}`,
        errorText,
      );

      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending Discord notification:", error);

    return false;
  }
}

/**
 * Send multiple Discord notifications for new symbols
 * @param webhookUrl Discord webhook URL
 * @param symbols Array of symbol data to notify
 * @returns Promise that resolves to number of successful notifications
 */
export async function sendMoonshotNotifications(
  webhookUrl: string,
  symbols: MoonshotSymbolData[],
): Promise<number> {
  let successCount = 0;

  // Send notifications sequentially to avoid rate limiting
  for (const symbol of symbols) {
    const success = await sendMoonshotNotification(webhookUrl, symbol);

    if (success) {
      successCount++;
      // Small delay between notifications to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return successCount;
}
