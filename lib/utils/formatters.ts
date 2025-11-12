type NumericInput = number | string | null | undefined;

function toNumber(value: NumericInput): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    return Number.isNaN(value) ? null : value;
  }
  const parsed = Number(value);

  return Number.isNaN(parsed) ? null : parsed;
}

export function formatNumber(
  value: NumericInput,
  options: Intl.NumberFormatOptions = {},
): string {
  const numeric = toNumber(value);

  if (numeric === null) return "—";

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    ...options,
  }).format(numeric);
}

export function formatCompactNumber(value: NumericInput): string {
  const numeric = toNumber(value);

  if (numeric === null) return "—";

  if (Math.abs(numeric) >= 1_000_000_000) {
    return `${(numeric / 1_000_000_000).toFixed(1)}B`;
  }
  if (Math.abs(numeric) >= 1_000_000) {
    return `${(numeric / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(numeric) >= 1_000) {
    return `${(numeric / 1_000).toFixed(1)}K`;
  }

  return formatNumber(numeric, { maximumFractionDigits: 0 });
}

export function formatCurrency(
  value: NumericInput,
  options: Intl.NumberFormatOptions = {},
): string {
  const numeric = toNumber(value);

  if (numeric === null) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Math.abs(numeric) >= 100 ? 0 : 2,
    ...options,
  }).format(numeric);
}

export function formatPercent(value: NumericInput, digits = 1): string {
  const numeric = toNumber(value);

  if (numeric === null) return "—";
  const rounded = numeric * 100;
  const formatted = rounded.toFixed(digits);

  return `${rounded >= 0 ? "+" : ""}${formatted}%`;
}

export function formatPercentRaw(value: NumericInput, digits = 1): string {
  const numeric = toNumber(value);

  if (numeric === null) return "—";
  const formatted = numeric.toFixed(digits);

  return `${numeric >= 0 ? "+" : ""}${formatted}%`;
}

export function formatPercentSmart(value: NumericInput, digits = 1): string {
  const numeric = toNumber(value);

  if (numeric === null) return "—";
  if (Math.abs(numeric) <= 1) {
    return formatPercent(numeric, digits);
  }

  return formatPercentRaw(numeric, digits);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatRelativeTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);

  if (Math.abs(minutes) < 1) return "just now";
  if (Math.abs(minutes) < 60) {
    const abs = Math.abs(minutes);

    return `${abs}m ${minutes >= 0 ? "ago" : "from now"}`;
  }
  const hours = Math.round(minutes / 60);

  if (Math.abs(hours) < 24) {
    const abs = Math.abs(hours);

    return `${abs}h ${hours >= 0 ? "ago" : "from now"}`;
  }
  const days = Math.round(hours / 24);
  const abs = Math.abs(days);

  return `${abs}d ${days >= 0 ? "ago" : "from now"}`;
}
