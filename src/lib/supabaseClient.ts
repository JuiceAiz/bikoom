import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = (import.meta.env.VITE_SUPABASE_URL ?? "").trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();

export const supabaseConfigured = Boolean(url && anonKey);

export const missingClientEnv: string[] = [];
if (!url) missingClientEnv.push("VITE_SUPABASE_URL");
if (!anonKey) missingClientEnv.push("VITE_SUPABASE_ANON_KEY");

/**
 * Browser client (anon key + RLS). The code exchange for the Google
 * redirect happens explicitly in /auth/callback.
 */
export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        flowType: "pkce",
        detectSessionInUrl: false,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error("Supabase is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");
  }
  return supabase;
}
