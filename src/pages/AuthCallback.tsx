import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Logo } from "../components/Logo";
import { Button, Spinner } from "../components/ui";
import { supabase } from "../lib/supabaseClient";

/**
 * Lands here after Google OAuth redirects back.
 * Exchanges the PKCE code for a session, then continues to `next`.
 */
export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const next = searchParams.get("next") || "/";
    const code = searchParams.get("code");
    const oauthError = searchParams.get("error_description");

    (async () => {
      if (!supabase) {
        setError("Supabase is not configured yet.");
        return;
      }
      if (oauthError) {
        setError(oauthError);
        return;
      }
      try {
        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setError(exchangeError.message);
            return;
          }
        }
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          window.location.assign(next.startsWith("/") ? next : "/");
        } else {
          setError("Your session could not be created. Please try again.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sign-in failed.");
      }
    })();
  }, [searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-5">
      <Logo />
      {error ? (
        <div className="mt-8 max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-bold text-ink-900">Sign-in problem</h1>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <Link to="/signin">
            <Button className="mt-5">Back to sign-in</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 flex flex-col items-center gap-3 text-ink-500">
          <Spinner className="h-8 w-8 text-brand-600" />
          <p className="text-sm font-medium">Completing sign-in…</p>
        </div>
      )}
    </div>
  );
}
