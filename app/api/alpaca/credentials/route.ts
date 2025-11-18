import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServerAdminClient } from "@/lib/supabase/server-admin";
import {
  createVaultSecret,
  deleteVaultSecret,
  updateVaultSecret,
} from "@/lib/supabase/vault";

/**
 * GET /api/alpaca/credentials
 * Retrieve user's Alpaca credentials (without exposing the actual keys)
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get credentials from database (contains Vault secret IDs, not actual keys)
    // Create a client with user_trading schema as default
    const supabaseWithSchema = await createServerSupabaseClient();
    const { data: credentials, error: dbError } = await supabaseWithSchema
      .schema("user_trading")
      .from("user_alpaca_credentials")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (dbError && dbError.code !== "PGRST116") {
      // PGRST116 = no rows returned
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 },
      );
    }

    if (!credentials) {
      return NextResponse.json({
        paper_connected: false,
        live_connected: false,
      });
    }

    // Return connection status without exposing keys
    return NextResponse.json({
      paper_connected: credentials.paper_account_connected || false,
      live_connected: credentials.live_account_connected || false,
      paper_account_id: credentials.paper_account_id || null,
      live_account_id: credentials.live_account_id || null,
      has_paper_keys:
        !!credentials.paper_api_key_secret_id &&
        !!credentials.paper_api_secret_secret_id,
      has_live_keys:
        !!credentials.live_api_key_secret_id &&
        !!credentials.live_api_secret_secret_id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/alpaca/credentials
 * Save or update user's Alpaca credentials
 * Body: { paper_api_key?, paper_api_secret?, live_api_key?, live_api_secret? }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      paper_api_key,
      paper_api_secret,
      live_api_key,
      live_api_secret,
      update_account_id,
      mode,
      account_number,
    } = body;

    // Handle account ID update only (from test connection)
    if (update_account_id && mode && account_number) {
      const adminClient = createServerAdminClient("user_trading");
      const updateField =
        mode === "paper" ? "paper_account_id" : "live_account_id";
      const connectedField =
        mode === "paper" ? "paper_account_connected" : "live_account_connected";

      await adminClient.from("user_alpaca_credentials").upsert(
        {
          user_id: user.id,
          [updateField]: account_number,
          [connectedField]: true,
        },
        {
          onConflict: "user_id",
        },
      );

      return NextResponse.json({
        success: true,
        [`${mode}_connected`]: true,
        [`${mode}_account_id`]: account_number,
      });
    }

    // Validate that at least one set of credentials is provided
    if (
      !paper_api_key &&
      !paper_api_secret &&
      !live_api_key &&
      !live_api_secret
    ) {
      return NextResponse.json(
        { error: "At least one API key/secret pair must be provided" },
        { status: 400 },
      );
    }

    // Validate pairs are complete
    if (
      (paper_api_key && !paper_api_secret) ||
      (paper_api_secret && !paper_api_key)
    ) {
      return NextResponse.json(
        { error: "Paper trading requires both API key and secret" },
        { status: 400 },
      );
    }

    if (
      (live_api_key && !live_api_secret) ||
      (live_api_secret && !live_api_key)
    ) {
      return NextResponse.json(
        { error: "Live trading requires both API key and secret" },
        { status: 400 },
      );
    }

    // Get existing credentials using admin client
    const adminClient = createServerAdminClient("user_trading");
    const { data: existingCredentialsData, error: fetchError } =
      await adminClient
        .from("user_alpaca_credentials")
        .select("*")
        .eq("user_id", user.id)
        .single();

    const existingCredentials =
      fetchError && fetchError.code !== "PGRST116"
        ? null
        : existingCredentialsData;

    const updates: {
      paper_api_key_secret_id?: string;
      paper_api_secret_secret_id?: string;
      live_api_key_secret_id?: string;
      live_api_secret_secret_id?: string;
    } = {};

    // Handle paper trading credentials
    if (paper_api_key && paper_api_secret) {
      if (existingCredentials?.paper_api_key_secret_id) {
        // Update existing secrets
        updates.paper_api_key_secret_id = await updateVaultSecret(
          existingCredentials.paper_api_key_secret_id,
          paper_api_key,
          "Alpaca Paper Trading API Key",
        );
        updates.paper_api_secret_secret_id = await updateVaultSecret(
          existingCredentials.paper_api_secret_secret_id,
          paper_api_secret,
          "Alpaca Paper Trading API Secret",
        );
      } else {
        // Create new secrets
        updates.paper_api_key_secret_id = await createVaultSecret(
          paper_api_key,
          "Alpaca Paper Trading API Key",
        );
        updates.paper_api_secret_secret_id = await createVaultSecret(
          paper_api_secret,
          "Alpaca Paper Trading API Secret",
        );
      }
    }

    // Handle live trading credentials
    if (live_api_key && live_api_secret) {
      if (existingCredentials?.live_api_key_secret_id) {
        // Update existing secrets
        updates.live_api_key_secret_id = await updateVaultSecret(
          existingCredentials.live_api_key_secret_id,
          live_api_key,
          "Alpaca Live Trading API Key",
        );
        updates.live_api_secret_secret_id = await updateVaultSecret(
          existingCredentials.live_api_secret_secret_id,
          live_api_secret,
          "Alpaca Live Trading API Secret",
        );
      } else {
        // Create new secrets
        updates.live_api_key_secret_id = await createVaultSecret(
          live_api_key,
          "Alpaca Live Trading API Key",
        );
        updates.live_api_secret_secret_id = await createVaultSecret(
          live_api_secret,
          "Alpaca Live Trading API Secret",
        );
      }
    }

    // Upsert credentials record using admin client (properly handles conflicts)
    const { data: credentials, error: upsertError } = await adminClient
      .from("user_alpaca_credentials")
      .upsert(
        {
          user_id: user.id,
          ...updates,
        },
        {
          onConflict: "user_id",
        },
      )
      .select()
      .single();

    if (upsertError) {
      console.error("Error upserting credentials:", upsertError);

      return NextResponse.json(
        {
          error: `Failed to save credentials: ${upsertError.message}`,
          details: upsertError,
        },
        { status: 500 },
      );
    }

    if (!credentials) {
      return NextResponse.json(
        { error: "Failed to save credentials: No data returned" },
        { status: 500 },
      );
    }

    // Try to verify connections and get account IDs
    let paperAccountId: string | null = credentials.paper_account_id || null;
    let liveAccountId: string | null = credentials.live_account_id || null;

    // If we just saved paper credentials, try to verify them
    if (updates.paper_api_key_secret_id && !paperAccountId) {
      try {
        const { getAlpacaAccount } = await import("@/lib/services/alpaca");
        const account = await getAlpacaAccount(user.id, "paper");

        paperAccountId = account.account_number || null;

        // Update account ID in database using admin client
        await adminClient
          .from("user_alpaca_credentials")
          .update({
            paper_account_id: paperAccountId,
            paper_account_connected: true,
          })
          .eq("user_id", user.id);
      } catch (err) {
        // Verification failed, but credentials are saved
        // eslint-disable-next-line no-console
        console.error("Failed to verify paper account:", err);
      }
    }

    // If we just saved live credentials, try to verify them
    if (updates.live_api_key_secret_id && !liveAccountId) {
      try {
        const { getAlpacaAccount } = await import("@/lib/services/alpaca");
        const account = await getAlpacaAccount(user.id, "live");

        liveAccountId = account.account_number || null;

        // Update account ID in database using admin client
        await adminClient
          .from("user_alpaca_credentials")
          .update({
            live_account_id: liveAccountId,
            live_account_connected: true,
          })
          .eq("user_id", user.id);
      } catch (err) {
        // Verification failed, but credentials are saved
        // eslint-disable-next-line no-console
        console.error("Failed to verify live account:", err);
      }
    }

    return NextResponse.json({
      success: true,
      paper_connected:
        !!updates.paper_api_key_secret_id ||
        !!credentials.paper_api_key_secret_id,
      live_connected:
        !!updates.live_api_key_secret_id ||
        !!credentials.live_api_key_secret_id,
      paper_account_id: paperAccountId,
      live_account_id: liveAccountId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/alpaca/credentials
 * Remove user's Alpaca credentials
 * Query params: mode=paper|live (optional, removes all if not specified)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode"); // 'paper' or 'live'

    const adminClient = createServerAdminClient("user_trading");

    // Get existing credentials
    const { data: existingCredentials } = await adminClient
      .from("user_alpaca_credentials")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!existingCredentials) {
      return NextResponse.json({
        success: true,
        message: "No credentials found",
      });
    }

    const updates: {
      paper_api_key_secret_id?: null;
      paper_api_secret_secret_id?: null;
      live_api_key_secret_id?: null;
      live_api_secret_secret_id?: null;
      paper_account_connected?: boolean;
      live_account_connected?: boolean;
    } = {};

    // Delete paper trading credentials
    if (!mode || mode === "paper") {
      if (existingCredentials.paper_api_key_secret_id) {
        await deleteVaultSecret(existingCredentials.paper_api_key_secret_id);
      }
      if (existingCredentials.paper_api_secret_secret_id) {
        await deleteVaultSecret(existingCredentials.paper_api_secret_secret_id);
      }
      updates.paper_api_key_secret_id = null;
      updates.paper_api_secret_secret_id = null;
      updates.paper_account_connected = false;
    }

    // Delete live trading credentials
    if (!mode || mode === "live") {
      if (existingCredentials.live_api_key_secret_id) {
        await deleteVaultSecret(existingCredentials.live_api_key_secret_id);
      }
      if (existingCredentials.live_api_secret_secret_id) {
        await deleteVaultSecret(existingCredentials.live_api_secret_secret_id);
      }
      updates.live_api_key_secret_id = null;
      updates.live_api_secret_secret_id = null;
      updates.live_account_connected = false;
    }

    // Update credentials record
    await adminClient
      .from("user_alpaca_credentials")
      .update(updates)
      .eq("user_id", user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
