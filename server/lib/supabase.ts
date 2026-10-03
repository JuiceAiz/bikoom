import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config, missingEnv } from "../config.js";

let client: SupabaseClient | null = null;

/**
 * Service-role client. Bypasses RLS — server-only, never ship this key to
 * the browser. Throws if the environment is not configured yet.
 */
export function getSupabase(): SupabaseClient {
  const missing = missingEnv();
  if (missing.length > 0) {
    throw new Error(`Server not configured. Missing: ${missing.join(", ")}`);
  }
  if (!client) {
    client = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return client;
}
