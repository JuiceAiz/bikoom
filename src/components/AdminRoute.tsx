import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { buttonClass, Spinner } from "./ui";
import { IconShield } from "./icons";

/**
 * Admin guard: anonymous visitors are sent to /signin with a `next`
 * link; signed-in customers who are not admins get a friendly
 * "no access" screen. The API enforces the same rule server-side.
 */
export function AdminRoute() {
  const { session, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <Spinner className="h-8 w-8 text-brand-600" />
      </div>
    );
  }

  if (!session) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/signin?next=${encodeURIComponent(next)}`} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-950 text-accent-400">
          <IconShield className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-ink-950">Admin access only</h1>
          <p className="mt-2 max-w-md text-sm text-ink-500">
            Your account is not enabled for the Bikoom dashboard. Sign in with an
            approved Google account, or ask Bikoom to enable yours.
          </p>
        </div>
        <Link to="/" className={buttonClass("primary")}>
          Back to the store
        </Link>
      </div>
    );
  }

  return <Outlet />;
}
