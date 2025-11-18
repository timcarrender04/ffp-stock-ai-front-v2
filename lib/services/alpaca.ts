/**
 * Alpaca API Client Wrapper
 *
 * Provides functions to interact with Alpaca Trading API using user's stored credentials.
 * Supports both paper and live trading modes.
 *
 * All functions retrieve API keys from Supabase Vault server-side.
 */

import { getVaultSecret } from "@/lib/supabase/vault";
import { createServerAdminClient } from "@/lib/supabase/server-admin";

export type TradingMode = "paper" | "live";

export interface AlpacaAccount {
  account_number: string;
  status: string;
  currency: string;
  buying_power: string;
  cash: string;
  portfolio_value: string;
  pattern_day_trader: boolean;
  trading_blocked: boolean;
  transfers_blocked: boolean;
  account_blocked: boolean;
  created_at: string;
  trade_suspended_by_user: boolean;
  multiplier: string;
  shorting_enabled: boolean;
  equity: string;
  last_equity: string;
  long_market_value: string;
  short_market_value: string;
  initial_margin: string;
  maintenance_margin: string;
  daytrading_buying_power: string;
  regt_buying_power: string;
}

export interface AlpacaPosition {
  asset_id: string;
  symbol: string;
  exchange: string;
  asset_class: string;
  qty: string;
  side: "long" | "short";
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  unrealized_intraday_pl: string;
  unrealized_intraday_plpc: string;
  current_price: string;
  lastday_price: string;
  change_today: string;
}

export interface AlpacaOrder {
  id: string;
  client_order_id: string;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  filled_at: string | null;
  expired_at: string | null;
  canceled_at: string | null;
  failed_at: string | null;
  replaced_at: string | null;
  replaced_by: string | null;
  replaces: string | null;
  asset_id: string;
  symbol: string;
  asset_class: string;
  notional: string | null;
  qty: string | null;
  filled_qty: string;
  filled_avg_price: string | null;
  order_class: string;
  order_type: "market" | "limit" | "stop" | "stop_limit" | "trailing_stop";
  type: string;
  side: "buy" | "sell";
  time_in_force: "day" | "gtc" | "opg" | "cls" | "ioc" | "fok";
  limit_price: string | null;
  stop_price: string | null;
  status: string;
  extended_hours: boolean;
  legs: AlpacaOrder[] | null;
  trail_percent: string | null;
  trail_price: string | null;
  hwm: string | null;
}

export interface CreateOrderRequest {
  symbol: string;
  qty?: number;
  notional?: number;
  side: "buy" | "sell";
  type: "market" | "limit" | "stop" | "stop_limit" | "trailing_stop";
  time_in_force?: "day" | "gtc" | "opg" | "cls" | "ioc" | "fok";
  limit_price?: number;
  stop_price?: number;
  trail_percent?: number;
  trail_price?: number;
  extended_hours?: boolean;
}

/**
 * Get Alpaca API base URL based on trading mode
 */
function getAlpacaBaseUrl(mode: TradingMode): string {
  if (mode === "paper") {
    return "https://paper-api.alpaca.markets";
  }

  return "https://api.alpaca.markets";
}

/**
 * Get user's Alpaca API credentials from Vault
 */
async function getAlpacaCredentials(
  userId: string,
  mode: TradingMode,
): Promise<{ apiKey: string; apiSecret: string }> {
  const adminClient = createServerAdminClient("user_trading");

  // Get credentials from database
  const { data: credentials, error } = await adminClient
    .from("user_alpaca_credentials")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !credentials) {
    throw new Error(
      `No Alpaca credentials found for ${mode} trading. Please configure your API keys in settings.`,
    );
  }

  // Get the appropriate secret IDs based on mode
  const apiKeySecretId =
    mode === "paper"
      ? credentials.paper_api_key_secret_id
      : credentials.live_api_key_secret_id;
  const apiSecretSecretId =
    mode === "paper"
      ? credentials.paper_api_secret_secret_id
      : credentials.live_api_secret_secret_id;

  if (!apiKeySecretId || !apiSecretSecretId) {
    throw new Error(
      `No Alpaca credentials found for ${mode} trading. Please configure your API keys in settings.`,
    );
  }

  // Retrieve secrets from Vault
  const [apiKey, apiSecret] = await Promise.all([
    getVaultSecret(apiKeySecretId),
    getVaultSecret(apiSecretSecretId),
  ]);

  return { apiKey, apiSecret };
}

/**
 * Make an authenticated request to Alpaca API
 */
async function alpacaRequest<T>(
  userId: string,
  mode: TradingMode,
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const { apiKey, apiSecret } = await getAlpacaCredentials(userId, mode);
  const baseUrl = getAlpacaBaseUrl(mode);
  const url = `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "APCA-API-KEY-ID": apiKey,
      "APCA-API-SECRET-KEY": apiSecret,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    let errorMessage = `Alpaca API error: ${response.status} ${response.statusText}`;

    try {
      const errorJson = JSON.parse(errorText);

      errorMessage = errorJson.message || errorMessage;
    } catch {
      if (errorText) {
        errorMessage = `${errorMessage} - ${errorText}`;
      }
    }

    throw new Error(errorMessage);
  }

  // Handle empty responses (common for DELETE requests)
  const contentType = response.headers.get("content-type");
  const contentLength = response.headers.get("content-length");

  // If no content-type or not JSON, return empty object
  if (!contentType || !contentType.includes("application/json")) {
    return {} as T;
  }

  // If content-length is 0, return empty object
  if (contentLength === "0") {
    return {} as T;
  }

  // Read response text and handle empty body gracefully
  const text = await response.text();

  // If body is empty, return empty object
  if (!text || text.trim() === "") {
    return {} as T;
  }

  // Try to parse JSON
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    // If JSON parsing fails, it might be an empty body with wrong content-type
    // Return empty object for DELETE requests or other cases where empty is expected
    if (error instanceof SyntaxError) {
      return {} as T;
    }
    throw error;
  }
}

/**
 * Get account information
 * Tries to use user-specific credentials from Vault first,
 * falls back to backend API if credentials not found
 */
export async function getAlpacaAccount(
  userId: string,
  mode: TradingMode,
): Promise<AlpacaAccount> {
  try {
    // Try to get user-specific credentials from Vault
    const { apiKey, apiSecret } = await getAlpacaCredentials(userId, mode);
    const baseUrl = getAlpacaBaseUrl(mode);
    const url = `${baseUrl}/v2/account`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "APCA-API-KEY-ID": apiKey,
        "APCA-API-SECRET-KEY": apiSecret,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorMessage = `Alpaca API error: ${response.status} ${response.statusText}`;

      try {
        const errorJson = JSON.parse(errorText);

        errorMessage = errorJson.message || errorMessage;
      } catch {
        if (errorText) {
          errorMessage = `${errorMessage} - ${errorText}`;
        }
      }

      throw new Error(errorMessage);
    }

    return response.json() as Promise<AlpacaAccount>;
  } catch (error) {
    // If user credentials not found or any credential-related error, fall back to backend API
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isCredentialError =
      errorMessage.includes("No Alpaca credentials found") ||
      errorMessage.includes("credentials") ||
      errorMessage.includes("vault secret") ||
      errorMessage.includes("Failed to retrieve");

    if (isCredentialError) {
      // Fallback to backend API which uses global credentials
      try {
        // For server-side, try multiple URL options
        const apiUrl =
          process.env.API_URL || // Server-side env var
          process.env.NEXT_PUBLIC_API_URL || // Public env var (available on server too)
          (typeof window === "undefined"
            ? "http://host.docker.internal:8000"
            : "http://localhost:8000"); // Docker fallback
        const url = `${apiUrl}/api/alpaca/account?mode=${mode}`;

        console.log(`[getAlpacaAccount] Falling back to backend API: ${url}`);

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          let backendErrorMessage = `Backend API error: ${response.status} ${response.statusText}`;

          try {
            const errorJson = JSON.parse(errorText);

            backendErrorMessage =
              errorJson.detail || errorJson.error || backendErrorMessage;
          } catch {
            if (errorText) {
              backendErrorMessage = `${backendErrorMessage} - ${errorText}`;
            }
          }

          throw new Error(backendErrorMessage);
        }

        return response.json() as Promise<AlpacaAccount>;
      } catch (fallbackError) {
        // If fallback also fails, throw the original error with context
        throw new Error(
          `Failed to get account with user credentials: ${errorMessage}. ` +
            `Fallback to backend API also failed: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`,
        );
      }
    }

    // Re-throw other errors (non-credential related)
    throw error;
  }
}

/**
 * Get all positions
 */
export async function getAlpacaPositions(
  userId: string,
  mode: TradingMode,
): Promise<AlpacaPosition[]> {
  return alpacaRequest<AlpacaPosition[]>(userId, mode, "/v2/positions");
}

/**
 * Get a specific position by symbol
 */
export async function getAlpacaPosition(
  userId: string,
  mode: TradingMode,
  symbol: string,
): Promise<AlpacaPosition> {
  return alpacaRequest<AlpacaPosition>(userId, mode, `/v2/positions/${symbol}`);
}

/**
 * Get all orders
 */
export async function getAlpacaOrders(
  userId: string,
  mode: TradingMode,
  options?: {
    status?: "open" | "closed" | "all";
    limit?: number;
    after?: string;
    until?: string;
    direction?: "asc" | "desc";
    nested?: boolean;
  },
): Promise<AlpacaOrder[]> {
  const params = new URLSearchParams();

  if (options?.status) params.set("status", options.status);
  if (options?.limit) params.set("limit", options.limit.toString());
  if (options?.after) params.set("after", options.after);
  if (options?.until) params.set("until", options.until);
  if (options?.direction) params.set("direction", options.direction);
  if (options?.nested !== undefined)
    params.set("nested", options.nested.toString());

  const queryString = params.toString();
  const endpoint = `/v2/orders${queryString ? `?${queryString}` : ""}`;

  return alpacaRequest<AlpacaOrder[]>(userId, mode, endpoint);
}

/**
 * Get a specific order by ID
 */
export async function getAlpacaOrder(
  userId: string,
  mode: TradingMode,
  orderId: string,
): Promise<AlpacaOrder> {
  return alpacaRequest<AlpacaOrder>(userId, mode, `/v2/orders/${orderId}`);
}

/**
 * Create a new order
 */
export async function createAlpacaOrder(
  userId: string,
  mode: TradingMode,
  order: CreateOrderRequest,
): Promise<AlpacaOrder> {
  return alpacaRequest<AlpacaOrder>(userId, mode, "/v2/orders", {
    method: "POST",
    body: JSON.stringify(order),
  });
}

/**
 * Cancel an order
 */
export async function cancelAlpacaOrder(
  userId: string,
  mode: TradingMode,
  orderId: string,
): Promise<void> {
  await alpacaRequest<void>(userId, mode, `/v2/orders/${orderId}`, {
    method: "DELETE",
  });
}

/**
 * Cancel all orders
 */
export async function cancelAllAlpacaOrders(
  userId: string,
  mode: TradingMode,
): Promise<void> {
  await alpacaRequest<void>(userId, mode, "/v2/orders", {
    method: "DELETE",
  });
}

/**
 * Close a position
 */
export async function closeAlpacaPosition(
  userId: string,
  mode: TradingMode,
  symbol: string,
  qty?: number,
): Promise<AlpacaOrder> {
  const params = qty ? `?qty=${qty}` : "";

  return alpacaRequest<AlpacaOrder>(
    userId,
    mode,
    `/v2/positions/${symbol}${params}`,
    {
      method: "DELETE",
    },
  );
}

/**
 * Close all positions
 */
export async function closeAllAlpacaPositions(
  userId: string,
  mode: TradingMode,
): Promise<AlpacaOrder[]> {
  return alpacaRequest<AlpacaOrder[]>(userId, mode, "/v2/positions", {
    method: "DELETE",
  });
}
