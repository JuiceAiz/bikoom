import { useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { brand } from "../brand";
import { Logo } from "../components/Logo";
import { Button, Spinner } from "../components/ui";
import { IconAlert, IconCheck, IconMapPin, IconWhatsApp } from "../components/icons";
import { useAuth } from "../context/AuthContext";

function GoogleG({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

const PERKS = [
  { icon: <IconWhatsApp className="h-4 w-4" />, text: "Send order requests straight to Bikoom's WhatsApp" },
  { icon: <IconMapPin className="h-4 w-4" />, text: "Based in Ogoja — delivery arranged for other states" },
  { icon: <IconCheck className="h-4 w-4" />, text: "Browse laptops, phones, furniture, Starlink & services" },
];

export default function SignIn() {
  const { session, loading, signInWithGoogle } = useAuth();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && session) return <Navigate to={next} replace />;

  const handleSignIn = async () => {
    setSubmitting(true);
    setError(null);
    const signInError = await signInWithGoogle(next);
    if (signInError) {
      setError(signInError);
      setSubmitting(false);
    }
    // On success the browser is redirected to Google.
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-ink-950 p-10 lg:flex lg:flex-col">
        <div
          className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-600/25 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-accent-500/15 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative">
          <Logo tone="light" />
        </div>
        <div className="relative mt-auto max-w-md">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-400">
            Welcome to
          </p>
          <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight text-white">
            {brand.tagline}
          </h1>
          <ul className="mt-8 space-y-4">
            {PERKS.map((perk) => (
              <li key={perk.text} className="flex items-start gap-3 text-sm text-ink-300">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand-300">
                  {perk.icon}
                </span>
                {perk.text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative mt-10 text-xs text-ink-500">
          {brand.name} · {brand.location}
        </p>
      </div>

      {/* Sign-in panel */}
      <div className="flex items-center justify-center bg-cream px-5 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <div className="rounded-3xl border border-ink-200/70 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-extrabold text-ink-950">
              Sign in with Google
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              Browsing is open to everyone — no account needed to view the
              shop. Sign in when you're ready: it saves your details for next
              time and links your order requests to your account. You'll
              confirm prices with Bikoom on WhatsApp either way.
            </p>

            {error ? (
              <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <Button
              onClick={handleSignIn}
              disabled={submitting}
              variant="outline"
              size="lg"
              className="mt-6 w-full gap-3 bg-white"
            >
              {submitting ? (
                <Spinner className="h-5 w-5 text-ink-500" />
              ) : (
                <GoogleG />
              )}
              Continue with Google
            </Button>

            <p className="mt-4 text-center text-xs text-ink-400">
              You'll be returned here after signing in.
            </p>

            <Link
              to={next}
              className="mt-4 block text-center text-sm font-bold text-brand-700 hover:text-brand-800"
            >
              ← Back to the store — keep browsing
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 text-center text-[11px] font-semibold text-ink-500">
            <div className="rounded-xl bg-white p-3 ring-1 ring-ink-200/70">
              Ogoja
              <span className="mt-0.5 block font-normal text-ink-400">based</span>
            </div>
            <div className="rounded-xl bg-white p-3 ring-1 ring-ink-200/70">
              WhatsApp
              <span className="mt-0.5 block font-normal text-ink-400">orders</span>
            </div>
            <div className="rounded-xl bg-white p-3 ring-1 ring-ink-200/70">
              Delivery
              <span className="mt-0.5 block font-normal text-ink-400">on request</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
