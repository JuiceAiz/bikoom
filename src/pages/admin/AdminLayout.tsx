import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { brand } from "../../brand";
import { useAuth } from "../../context/AuthContext";
import { initials } from "../../lib/format";
import { LogoMark } from "../../components/Logo";
import {
  IconExternal,
  IconFileText,
  IconGrid,
  IconImage,
  IconLogOut,
  IconMenu,
  IconPackage,
  IconTag,
  IconTruck,
  IconClose,
} from "../../components/icons";
import { cn } from "../../components/ui";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: <IconGrid className="h-5 w-5" />, end: true },
  { to: "/admin/orders", label: "Order requests", icon: <IconFileText className="h-5 w-5" /> },
  { to: "/admin/deliveries", label: "Delivery requests", icon: <IconTruck className="h-5 w-5" /> },
  { to: "/admin/products", label: "Products", icon: <IconPackage className="h-5 w-5" /> },
  { to: "/admin/categories", label: "Categories", icon: <IconTag className="h-5 w-5" /> },
  { to: "/admin/banners", label: "Banners", icon: <IconImage className="h-5 w-5" /> },
];

const TITLES: Array<[string, string]> = [
  ["/admin/orders", "Order requests"],
  ["/admin/deliveries", "Delivery requests"],
  ["/admin/products/new", "Add product"],
  ["/admin/products", "Products"],
  ["/admin/categories", "Categories"],
  ["/admin/banners", "Homepage banners"],
  ["/admin", "Dashboard"],
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const name = profile?.full_name || profile?.email || "Admin";

  const handleSignOut = async () => {
    await signOut();
    navigate("/signin", { replace: true });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <LogoMark className="h-9 w-9" />
        <div>
          <p className="font-display text-sm font-extrabold text-white">
            {brand.shortName}
            <span className="text-brand-400"> Store</span>
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
            Admin dashboard
          </p>
        </div>
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3" aria-label="Admin">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition",
                isActive
                  ? "bg-brand-600 text-white shadow-sm shadow-brand-900/40"
                  : "text-ink-400 hover:bg-white/5 hover:text-white",
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 px-1 pb-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
            {initials(name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{name}</p>
            <p className="truncate text-xs text-ink-500">Administrator</p>
          </div>
        </div>
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-ink-400 transition hover:text-white"
        >
          <IconExternal className="h-4 w-4" /> View store
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-semibold text-ink-400 transition hover:text-red-400"
        >
          <IconLogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );
}

export function AdminLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const title =
    TITLES.find(([prefix]) => location.pathname.startsWith(prefix))?.[1] ??
    "Dashboard";

  return (
    <div className="min-h-screen bg-ink-100">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-ink-950 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-ink-950 shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 rounded-lg p-2 text-ink-400 hover:bg-white/10 hover:text-white"
            >
              <IconClose className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-ink-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="rounded-lg p-2 text-ink-600 hover:bg-ink-100 lg:hidden"
            >
              <IconMenu className="h-5 w-5" />
            </button>
            <h1 className="font-display text-lg font-extrabold text-ink-950">{title}</h1>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-bold text-ink-700 transition hover:bg-ink-50"
          >
            <IconExternal className="h-3.5 w-3.5" /> View store
          </Link>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
