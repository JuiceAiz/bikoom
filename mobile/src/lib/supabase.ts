// URL polyfill is required by supabase-js in React Native.
import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from "../config";

/**
 * Sessions are stored in AsyncStorage on purpose: expo-secure-store caps
 * values at 2KB and Supabase session payloads regularly exceed that,
 * which silently breaks auth. AsyncStorage is the approach recommended
 * by Supabase's own React Native guide for this reason.
 */
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
});

export function requireSupabase(): SupabaseClient {
  if (!supabaseConfigured) {
    throw new Error(
      "Supabase is not configured (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY).",
    );
  }
  return supabase;
}
