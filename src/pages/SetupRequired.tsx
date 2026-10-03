import { brand } from "../brand";
import { Logo } from "../components/Logo";
import { Button, buttonClass } from "../components/ui";
import { IconAlert, IconCheck } from "../components/icons";
import type { HealthResponse } from "../../shared/types";

const STEPS = [
  "Copy .env.example to .env in the project root.",
  "Create a Supabase project, then fill SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY (plus the VITE_ copies for the browser).",
  "Run supabase/schema.sql and supabase/seed.sql in the Supabase SQL editor.",
  "Enable the Google provider in Supabase → Authentication → Providers, and add http://localhost:5173/auth/callback to Redirect URLs.",
  "Sign in with Google once, then run: select public.promote_admin('your-email@gmail.com');",
  "Restart the dev servers and sign in again.",
];

export default function SetupRequired({
  health,
  clientMissing,
  onRetry,
}: {
  health: HealthResponse | null;
  clientMissing: string[];
  onRetry: () => void;
}) {
  const missing = [...new Set([...(health?.missing ?? []), ...clientMissing])];

  return (
    <div className="min-h-screen bg-ink-950 px-4 py-10 text-ink-200">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between gap-4">
          <Logo tone="light" />
          <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-300 ring-1 ring-amber-400/30">
            Setup required
          </span>
        </div>

        <div className="mt-10 rounded-3xl bg-white p-8 text-ink-800 shadow-2xl sm:p-10">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <IconAlert className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-ink-950">
                Finish setting up {brand.name}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                The app is waiting for its Supabase credentials. It won't show
                demo data or run without them — add the values below and
                restart.
              </p>
            </div>
          </div>

          {missing.length > 0 ? (
            <div className="mt-6 rounded-2xl border border-ink-200 bg-ink-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-500">
                Missing environment variables
              </p>
              <ul className="mt-3 space-y-1.5">
                {missing.map((name) => (
                  <li
                    key={name}
                    className="flex items-center gap-2 font-mono text-sm text-red-600"
                  >
                    <span aria-hidden="true">✗</span> {name}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              Server variables look good — the browser is missing its VITE_
              Supabase keys. Add them to .env and restart Vite.
            </div>
          )}

          <ol className="mt-6 space-y-3">
            {STEPS.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm leading-relaxed">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <span className="text-ink-600">{step}</span>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button onClick={onRetry} className="shadow-sm">
              <IconCheck className="h-4 w-4" /> Re-check configuration
            </Button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={buttonClass("ghost", "md")}
            >
              Reload page
            </button>
          </div>

          <p className="mt-6 border-t border-ink-100 pt-4 text-xs text-ink-400">
            All required variables are documented in{" "}
            <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono">
              .env.example
            </code>
            . Never commit your real <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono">.env</code>.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-ink-500">
          {brand.name} · {brand.location}
        </p>
      </div>
    </div>
  );
}
