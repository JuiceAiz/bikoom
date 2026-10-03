import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { brand } from "../brand";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { initials } from "../lib/format";
import { Logo, Wordmark } from "./Logo";
import {
  IconCart,
  IconClose,
  IconLogOut,
  IconMenu,
  IconShield,
  IconStore,
} from "./icons";
import { buttonClass, cn } from "./ui";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/delivery", label: "Delivery" },
  { to: "/contact", label: "Contact" },
];

export function Navbar() {
  const { count } = useCart();
  const { session, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const displayName = profile?.full_name || profile?.email || "Account";
  const signInHref = `/signin?next=${encodeURIComponent(
    `${location.pathname}${location.search}`,
  )}`;

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    navigate("/", { replace: true });
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "rounded-lg px-3 py-2 text-sm font-semibold transition",
      isActive ? "text-brand-700" : "text-ink-600 hover:text-ink-950",
    );

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-white/90 backdrop-blur transition",
        scrolled ? "border-ink-200 shadow-sm" : "border-transparent",
      )}
    >
      <div className="page-container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label={brand.name}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={navClass} end={link.to === "/"}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/cart"
            className="relative rounded-xl p-2.5 text-ink-700 transition hover:bg-ink-100"
            aria-label={`Order request (${count} items)`}
          >
            <IconCart className="h-5 w-5" />
            {count > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">
                {count > 99 ? "99+" : count}
              </span>
            ) : null}
          </Link>          {/* Desktop account: signed-in menu, or a Sign in link */}
          {session ? (
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-xl border border-ink-200 py-1.5 pl-1.5 pr-3 text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
                aria-expanded={menuOpen}
                aria-label="Account menu"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
                  {initials(displayName)}
                </span>
                <span className="max-w-28 truncate">{displayName}</span>
              </button>
              {menuOpen ? (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-ink-200 bg-white py-1.5 shadow-xl">
                    <div className="border-b border-ink-100 px-4 pb-2 pt-1.5">
                      <p className="truncate text-sm font-bold text-ink-900">{displayName}</p>
                      {profile?.email ? (
                        <p className="truncate text-xs text-ink-500">{profile.email}</p>
                      ) : null}
                    </div>
                    {isAdmin ? (
                      <Link
                        to="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
                      >
                        <IconShield className="h-4 w-4" /> Admin dashboard
                      </Link>
                    ) : null}
                    <Link
                      to="/cart"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
                    >
                      <IconStore className="h-4 w-4" /> My order request
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      <IconLogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <Link
              to={signInHref}
              className="hidden items-center gap-1.5 rounded-xl border border-ink-200 px-3 py-2 text-sm font-semibold text-ink-700 transition hover:bg-ink-50 md:inline-flex"
            >
              Sign in
            </Link>
          )}

          <Link to="/cart" className={buttonClass("primary", "sm", "hidden sm:inline-flex")}>
            Order request
            {count > 0 ? ` (${count})` : ""}
          </Link>

          <button
            type="button"
            className="rounded-xl p-2.5 text-ink-700 transition hover:bg-ink-100 md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <IconMenu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-0 flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
              <Wordmark />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-2 text-ink-500 hover:bg-ink-100"
              >
                <IconClose className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-4" aria-label="Mobile">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "rounded-xl px-4 py-3 text-base font-semibold transition",
                      isActive
                        ? "bg-brand-50 text-brand-700"
                        : "text-ink-700 hover:bg-ink-50",
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <NavLink
                to="/cart"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3 text-base font-semibold text-ink-700 hover:bg-ink-50"
              >
                Order request ({count})
              </NavLink>
            </nav>
            <div className="mt-auto border-t border-ink-100 p-4">
              {isAdmin ? (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="mb-2 flex items-center gap-2 rounded-xl bg-ink-950 px-4 py-3 text-sm font-semibold text-white"
                >
                  <IconShield className="h-4 w-4" /> Admin dashboard
                </Link>
              ) : null}
              {session ? (
                <div className="flex items-center justify-between gap-2 rounded-xl bg-ink-50 px-4 py-3">
                  <span className="truncate text-sm font-semibold text-ink-700">
                    {displayName}
                  </span>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="text-sm font-bold text-red-600"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <Link
                  to={signInHref}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white"
                >
                  Sign in with Google
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
