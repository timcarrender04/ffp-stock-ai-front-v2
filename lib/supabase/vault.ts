/**
 * Supabase Vault Helper Functions
 *
 * These functions help manage secrets in Supabase Vault for storing
 * Alpaca API keys securely. Vault secrets are encrypted at rest and
 * can only be accessed server-side with proper authentication.
 */

import { createClient } from "@supabase/supabase-js";

/**
 * Create a Supabase client with service role key for server-side operations
 * This is needed to access Vault secrets which require elevated permissions
 */
function createServiceRoleClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase service role credentials. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Create a secret in Supabase Vault
 * @param secretValue The secret value to store (e.g., API key)
 * @param description Optional description for the secret
 * @returns The UUID of the created secret
 */
export async function createVaultSecret(
  secretValue: string,
  description?: string,
): Promise<string> {
  const supabase = createServiceRoleClient();

  // Generate a unique name for the secret
  // Vault requires unique names, so we append a timestamp to make it unique
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const secretName = description
    ? `${description.replace(/[^a-zA-Z0-9_]/g, "_").substring(0, 30)}_${timestamp}_${randomSuffix}`
    : `alpaca_${timestamp}_${randomSuffix}`;

  // Use the RPC wrapper function we created in the database
  const { data, error } = await supabase.rpc("vault_create_secret", {
    new_secret: secretValue,
    new_name: secretName,
    new_description: description || null,
  });

  if (error) {
    throw new Error(
      `Failed to create vault secret. Please ensure Supabase Vault extension is enabled. Error: ${error.message}`,
    );
  }

  if (!data) {
    throw new Error("Failed to create vault secret: No data returned");
  }

  // The RPC function returns a UUID directly
  if (typeof data === "string") {
    return data;
  }

  // If it's returned as an object with id property
  if (data && typeof data === "object" && "id" in data) {
    return data.id as string;
  }

  throw new Error("Unexpected data format from vault_create_secret");
}

/**
 * Retrieve a decrypted secret from Supabase Vault
 * @param secretId The UUID of the secret to retrieve
 * @returns The decrypted secret value
 */
export async function getVaultSecret(secretId: string): Promise<string> {
  const supabase = createServiceRoleClient();

  // Use the RPC wrapper function we created in the database
  const { data, error } = await supabase.rpc("vault_get_secret", {
    secret_id: secretId,
  });

  if (error) {
    throw new Error(
      `Failed to retrieve vault secret: ${error.message}. Please ensure the secret exists and you have proper permissions.`,
    );
  }

  if (!data || typeof data !== "string") {
    throw new Error("Secret not found or could not be decrypted");
  }

  return data;
}

/**
 * Delete a secret from Supabase Vault
 * @param secretId The UUID of the secret to delete
 */
export async function deleteVaultSecret(secretId: string): Promise<void> {
  const supabase = createServiceRoleClient();

  // Use the RPC wrapper function we created in the database
  const { error } = await supabase.rpc("vault_delete_secret", {
    secret_id: secretId,
  });

  if (error) {
    throw new Error(`Failed to delete vault secret: ${error.message}`);
  }
}

/**
 * Update a secret in Supabase Vault
 * Note: Vault doesn't support direct updates, so we delete and recreate
 * @param secretId The UUID of the existing secret
 * @param newSecretValue The new secret value
 * @param description Optional description
 * @returns The UUID of the new secret (may be different from the old one)
 */
export async function updateVaultSecret(
  secretId: string,
  newSecretValue: string,
  description?: string,
): Promise<string> {
  // Delete the old secret
  await deleteVaultSecret(secretId);

  // Create a new secret
  return createVaultSecret(newSecretValue, description);
}
