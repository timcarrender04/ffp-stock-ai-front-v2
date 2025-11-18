/**
 * Server-side Supabase Admin Client
 *
 * Creates a Supabase client with service role key for server-side operations
 * that require elevated permissions (e.g., accessing Vault secrets, bypassing RLS)
 */

import { createClient } from "@supabase/supabase-js";

/**
 * Create a Supabase client with service role key
 * This client has full database access and can bypass RLS policies
 * Use only in server-side code (API routes, server components)
 */
export function createServerAdminClient(schema?: string) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase service role credentials. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.",
    );
  }

  const options: any = {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  };

  // If a schema is specified, set it as the default schema for this client
  if (schema) {
    options.db = {
      schema: schema,
    };
  }

  return createClient(url, serviceRoleKey, options);
}
