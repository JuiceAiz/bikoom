import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type AdminStats } from "../../lib/api";
import { formatDate, formatNaira } from "../../lib/format";
import { useRealtimeRefresh } from "../../lib/realtime";
import {
  Badge,
  Button,
  ErrorState,
  Spinner,
  buttonClass,
} from "../../components/ui";
import {
  IconFileText,
  IconPackage,
  IconPlus,
  IconTag,
  IconTruck,
} from "../../components/icons";

type LoadState = "loading" | "ready" | "error";

const STATUS_TONE = {
  new: "blue",
  contacted: "amber",
  closed: "green",
} as const;

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");

  const load = useCallback((silent = false) => {
    if (!silent) setLoadState("loading");
    api
      .admin.stats()
      .then((data) => {
        setStats(data);
        setLoadState("ready");
      })
      .catch((err: unknown) => {
        console.error("[admin/dashboard]", err);
        setLoadState("error");
      });
  }, []);

  useEffect(load, [load]);

  useRealtimeRefresh(
    ["products", "categories", "order_requests", "delivery_requests"],
    load,
  );

  if (loadState === "loading") {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8 text-brand-600" />
      </div>
    );
  }
  if (loadState === "error" || !stats) {
    return <ErrorState message="Could not load the dashboard." onRetry={load} />;
  }

  const cards = [
    { label: "Products", value: stats.products, to: "/admin/products", icon: <IconPackage className="h-5 w-5" /> },
    { label: "Categories", value: stats.categories, to: "/admin/categories", icon: <IconTag className="h-5 w-5" /> },
    { label: "Order requests", value: stats.orders, to: "/admin/orders", icon: <IconFileText className="h-5 w-5" /> },
    { label: "Delivery requests", value: stats.deliveries, to: "/admin/deliveries", icon: <IconTruck className="h-5 w-5" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-ink-950">Overview</h2>
          <p className="mt-1 text-sm text-ink-500">
            Everything happening in your store at a glance.
          </p>
        </div>
        <Link to="/admin/products/new" className={buttonClass("primary", "md")}>
          <IconPlus className="h-4 w-4" /> Add product
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="group rounded-2xl border border-ink-200/70 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              {card.icon}
            </span>
            <p className="mt-4 font-display text-3xl font-extrabold text-ink-950">
              {card.value}
            </p>
            <p className="mt-1 text-sm font-semibold text-ink-500 group-hover:text-brand-700">
              {card.label}
            </p>
          </Link>
        ))}
      </div>

      {stats.outOfStock > 0 ? (
        <Link
          to="/admin/products"
          className="flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 transition hover:bg-amber-100"
        >
          <span className="text-sm font-semibold text-amber-800">
            {stats.outOfStock} product{stats.outOfStock === 1 ? " is" : "s are"}{" "}
            marked out of stock
          </span>
          <span className="text-xs font-bold text-amber-700">Review →</span>
        </Link>
      ) : null}

      <section className="rounded-2xl border border-ink-200/70 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <h3 className="font-bold text-ink-950">Recent order requests</h3>
          <Link to="/admin/orders" className="text-xs font-bold text-brand-700 hover:text-brand-800">
            View all →
          </Link>
        </div>
        {stats.recentOrders.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-ink-500">
            No order requests yet. They'll appear here as customers send their
            carts.
          </p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {stats.recentOrders.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div>
                  <p className="text-sm font-bold text-ink-900">
                    {order.customer_name}
                  </p>
                  <p className="text-xs text-ink-500">
                    {formatDate(order.created_at)} ·{" "}
                    {order.displayed_total != null
                      ? formatNaira(order.displayed_total)
                      : "price on chat"}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[order.status] ?? "gray"}>
                  {order.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => window.open("/", "_self")}>
          Preview store
        </Button>
        <Link to="/admin/banners" className={buttonClass("outline", "md")}>
          Manage homepage banners
        </Link>
      </div>
    </div>
  );
}
