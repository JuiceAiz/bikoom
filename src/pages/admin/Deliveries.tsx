import { useCallback, useEffect, useMemo, useState } from "react";
import type { DeliveryRequest, RequestStatus } from "../../../shared/types";
import { REQUEST_STATUSES } from "../../../shared/types";
import { api } from "../../lib/api";
import { formatDate } from "../../lib/format";
import { waLink, waNumberFromPhone } from "../../lib/whatsapp";
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

export function AdminDeliveries() {
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [filter, setFilter] = useState<"all" | RequestStatus>("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoadState("loading");
    api
      .admin.deliveries()
      .then((data) => {
        setRequests(data);
        setLoadState("ready");
      })
      .catch((err: unknown) => {
        console.error("[admin/deliveries]", err);
        setLoadState("error");
      });
  }, []);

  useEffect(load, [load]);

  const visible = useMemo(
    () =>
      filter === "all"
        ? requests
        : requests.filter((request) => request.status === filter),
    [requests, filter],
  );

  const changeStatus = async (
    request: DeliveryRequest,
    status: RequestStatus,
  ) => {
    setUpdating(request.id);
    try {
      const updated = await api.admin.updateDeliveryStatus(request.id, status);
      setRequests((prev) =>
        prev.map((item) => (item.id === request.id ? { ...item, ...updated } : item)),
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
    return <ErrorState message="Could not load delivery requests." onRetry={load} />;
  }

  const counts = {
    all: requests.length,
    new: requests.filter((r) => r.status === "new").length,
    contacted: requests.filter((r) => r.status === "contacted").length,
    closed: requests.filter((r) => r.status === "closed").length,
  };

  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-sm text-ink-500">
        Waybill and delivery requests from customers. Costs are always quoted
        directly — discuss and agree on WhatsApp, then mark the request
        contacted or closed.
      </p>

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
          title="No delivery requests yet"
          description="Customers outside Ogoja send waybill requests here."
        />
      ) : (
        <ul className="space-y-4">
          {visible.map((request) => (
            <li
              key={request.id}
              className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-ink-950">
                    {request.name}{" "}
                    <span className="ml-2 text-sm font-medium text-ink-500">
                      → {request.location}
                    </span>
                  </p>
                  <p className="text-xs text-ink-500">
                    {formatDate(request.created_at)} · {request.phone}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={STATUS_TONE[request.status]}>
                    {STATUS_LABELS[request.status]}
                  </Badge>
                  <Select
                    value={request.status}
                    onChange={(e) =>
                      changeStatus(request, e.target.value as RequestStatus)
                    }
                    disabled={updating === request.id}
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

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-ink-50 px-4 py-3 text-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
                    Product / order
                  </p>
                  <p className="mt-1 text-ink-700">{request.product_info}</p>
                </div>
                <div className="rounded-xl bg-ink-50 px-4 py-3 text-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
                    Notes
                  </p>
                  <p className="mt-1 text-ink-700">{request.notes || "—"}</p>
                </div>
              </div>

              <a
                href={waLink(
                  `Hello ${request.name}, this is Bikoom Stores about your delivery/waybill request to ${request.location}. Let's confirm the details and delivery cost.`,
                  waNumberFromPhone(request.phone),
                )}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-whatsapp px-4 py-2 text-sm font-bold text-white transition hover:bg-whatsapp-dark"
              >
                <IconWhatsApp className="h-4 w-4" /> Reply on WhatsApp
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
