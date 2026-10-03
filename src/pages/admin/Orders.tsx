import { useCallback, useEffect, useMemo, useState } from "react";
import type { OrderRequest, RequestStatus } from "../../../shared/types";
import { REQUEST_STATUSES } from "../../../shared/types";
import { api } from "../../lib/api";
import { formatDate, formatNaira } from "../../lib/format";
import { waNumberFromPhone, waLink } from "../../lib/whatsapp";
import { IconWhatsApp } from "../../components/icons";
import {
  Badge,
  EmptyState,
  ErrorState,
  Select,
  Spinner,
  cn,
} from "../../components/ui";

type LoadState = "loading" | "ready" | "error";

const STATUS_TONE = { new: "blue", contacted: "amber", closed: "green" } as const;

const STATUS_LABELS: Record<RequestStatus, string> = {
  new: "New",
  contacted: "Contacted",
  closed: "Closed",
};

export function AdminOrders() {
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [filter, setFilter] = useState<"all" | RequestStatus>("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoadState("loading");
    api
      .admin.orders()
      .then((data) => {
        setOrders(data);
        setLoadState("ready");
      })
      .catch((err: unknown) => {
        console.error("[admin/orders]", err);
        setLoadState("error");
      });
  }, []);

  useEffect(load, [load]);

  const visible = useMemo(
    () =>
      filter === "all" ? orders : orders.filter((order) => order.status === filter),
    [orders, filter],
  );

  const changeStatus = async (order: OrderRequest, status: RequestStatus) => {
    setUpdating(order.id);
    try {
      const updated = await api.admin.updateOrderStatus(order.id, status);
      setOrders((prev) =>
        prev.map((item) => (item.id === order.id ? { ...item, ...updated } : item)),
      );
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Could not update the status.",
      );
    } finally {
      setUpdating(null);
    }
  };

  if (loadState === "loading") {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8 text-brand-600" />
      </div>
    );
  }
  if (loadState === "error") {
    return <ErrorState message="Could not load order requests." onRetry={load} />;
  }

  const counts = {
    all: orders.length,
    new: orders.filter((o) => o.status === "new").length,
    contacted: orders.filter((o) => o.status === "contacted").length,
    closed: orders.filter((o) => o.status === "closed").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {(["all", ...REQUEST_STATUSES] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-bold transition",
              filter === key
                ? "bg-ink-950 text-white"
                : "bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50",
            )}
          >
            {key === "all" ? "All" : STATUS_LABELS[key]} ({counts[key]})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="No order requests yet"
          description="When customers send their cart from the website, requests land here (and arrive by e-mail via Mailgun)."
        />
      ) : (
        <ul className="space-y-4">
          {visible.map((order) => (
            <li key={order.id} className="rounded-2xl border border-ink-200/70 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
                <div>
                  <p className="font-bold text-ink-950">{order.customer_name}</p>
                  <p className="text-xs text-ink-500">
                    {formatDate(order.created_at)} ·{" "}
                    {order.customer_location || "No location given"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={STATUS_TONE[order.status]}>
                    {STATUS_LABELS[order.status]}
                  </Badge>
                  <Select
                    value={order.status}
                    onChange={(e) => changeStatus(order, e.target.value as RequestStatus)}
                    disabled={updating === order.id}
                    aria-label="Change status"
                    className="w-32 py-1.5 text-xs"
                  >
                    {REQUEST_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid gap-5 px-5 py-4 md:grid-cols-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
                    Items
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {(order.items ?? []).map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="text-ink-700">
                          <strong className="text-ink-900">{item.quantity}×</strong>{" "}
                          {item.product_name}
                        </span>
                        <span className="shrink-0 text-xs font-semibold text-ink-500">
                          {item.show_price && item.unit_price != null
                            ? formatNaira(Number(item.unit_price) * item.quantity)
                            : "on chat"}
                        </span>
                      </li>
                    ))}
                    {(order.items ?? []).length === 0 ? (
                      <li className="text-xs text-ink-400">No items recorded.</li>
                    ) : null}
                  </ul>
                  {order.displayed_total != null ? (
                    <p className="mt-3 border-t border-ink-100 pt-2 text-sm font-bold text-ink-950">
                      Displayed total: {formatNaira(order.displayed_total)}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
                      Contact
                    </p>
                    <p className="mt-1 text-sm font-semibold text-ink-800">
                      {order.customer_phone}
                    </p>
                    {order.notes ? (
                      <p className="mt-2 rounded-xl bg-ink-50 px-3 py-2 text-sm text-ink-600">
                        {order.notes}
                      </p>
                    ) : null}
                  </div>
                  <a
                    href={waLink(
                      `Hello ${order.customer_name}, this is Bikoom Store replying to your order request from the website. Let's confirm your items, final prices and delivery.`,
                      waNumberFromPhone(order.customer_phone),
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-whatsapp px-4 py-2 text-sm font-bold text-white transition hover:bg-whatsapp-dark"
                  >
                    <IconWhatsApp className="h-4 w-4" /> Reply on WhatsApp
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
