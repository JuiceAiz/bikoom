import type { Session, User } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { SITE_URL, supabaseConfigured } from "../config";
import { api } from "../lib/api";
import { supabase } from "../lib/supabase";

// Required for iOS: completes the auth session when the app is brought back to foreground.
WebBrowser.maybeCompleteAuthSession();

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Parse tokens/code out of the OAuth redirect URL (PKCE or implicit). */
function parseRedirect(url: string): {
  code?: string;
  access?: string;
  refresh?: string;
  error?: string;
} {
  const hash = url.split("#")[1] ?? "";
  const query = url.split("?")[1]?.split("#")[0] ?? "";
  const params = new URLSearchParams(query + (hash ? `&${hash}` : ""));
  const oauthError = params.get("error_description") ?? params.get("error");
  return {
    code: params.get("code") ?? undefined,
    access: params.get("access_token") ?? undefined,
    refresh: params.get("refresh_token") ?? undefined,
    error: oauthError ?? undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(supabaseConfigured);
  const [adminEmails, setAdminEmails] = useState<string[]>([]);

  const loadProfile = useCallback(async (user: User) => {
    if (!supabaseConfigured) return;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      setProfile((data as Profile | null) ?? null);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) return;
    let cancelled = false;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        setSession(data.session);
        if (data.session?.user) void loadProfile(data.session.user);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        void loadProfile(newSession.user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  // Learn which e-mails are pre-approved as admins (same as the website).
  useEffect(() => {
    let cancelled = false;
    api
      .health()
      .then((h) => {
        if (!cancelled && Array.isArray(h.adminEmails)) {
          setAdminEmails(h.adminEmails);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<string | null> => {
    if (!supabaseConfigured) return "Supabase is not configured yet.";

    // Warm up the browser (improves speed on Android).
    await WebBrowser.warmUpAsync();

    // Deep link back into the app (exp://... in Expo Go, bikoom:// in builds).
    const deepLink = Linking.createURL("auth/callback");

    // Supabase silently rejects any redirect whose host is a non-loopback
    // IP address — which is exactly what Expo Go sends (exp://192.168.x.x)
    // — before it ever checks the Redirect URLs allow list, so the browser
    // used to land on the website. Going through the site's /api/mobile-auth
    // hop (always allowed: same host as the Site URL) hands the auth code
    // back to the app instead.
    const redirectTo = `${SITE_URL}/api/mobile-auth?next=${encodeURIComponent(deepLink)}`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true },
    });

    if (error) {
      await WebBrowser.coolDownAsync();
      return error.message;
    }

    if (!data?.url) {
      await WebBrowser.coolDownAsync();
      return (
        "Google sign-in is not enabled. Please enable Google as an OAuth provider in your Supabase dashboard " +
        "(Authentication → Providers → Google) and add your Google Client ID & Secret."
      );
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, deepLink);

    await WebBrowser.coolDownAsync();

    if (result.type === "cancel" || result.type === "dismiss") {
      return null; // user cancelled — not an error, don't show message
    }
    if (result.type !== "success" || !result.url) {
      return "Sign-in was cancelled or failed. Please try again.";
    }

    const { code, access, refresh, error: oauthError } = parseRedirect(result.url);
    if (oauthError && !code && !access) {
      return oauthError;
    }
    if (code) {
      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);
      return exchangeError ? exchangeError.message : null;
    }
    if (access && refresh) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: access,
        refresh_token: refresh,
      });
      return sessionError ? sessionError.message : null;
    }
    return "Could not read the sign-in response. Please try again.";
  }, []);

  const signOut = useCallback(async () => {
    if (!supabaseConfigured) return;
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  const email = (session?.user.email ?? "").toLowerCase();
  const isAdmin = Boolean(profile?.is_admin) || adminEmails.includes(email);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      isAdmin,
      signInWithGoogle,
      signOut,
    }),
    [session, profile, loading, isAdmin, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
