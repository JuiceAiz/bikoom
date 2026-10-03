import { requireSupabase, supabase } from "./supabaseClient";
import type {
  Banner,
  Category,
  DeliveryPayload,
  DeliveryRequest,
  HealthResponse,
  OrderPayload,
  OrderRequest,
  Product,
  RequestStatus,
} from "../../shared/types";

const JSON_HEADERS = { "Content-Type": "application/json" };

async function authHeaders(): Promise<Record<string, string>> {
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  path: string,
  init: { method?: string; body?: unknown; formData?: FormData } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    ...(await authHeaders()),
    ...(init.body !== undefined ? JSON_HEADERS : {}),
  };
  const res = await fetch(path, {
    method: init.method ?? "GET",
    headers,
    body: init.formData ?? (init.body !== undefined ? JSON.stringify(init.body) : undefined),
  });
  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }
  if (!res.ok) {
    const message =
      (json as { error?: string } | null)?.error ?? `Request failed (${res.status})`;
    throw new Error(message);
  }
  return json as T;
}

export interface AdminStats {
  products: number;
  categories: number;
  orders: number;
  deliveries: number;
  outOfStock: number;
  recentOrders: OrderRequest[];
}

export interface OrderPayloadInput extends OrderPayload {}
export interface DeliveryPayloadInput extends DeliveryPayload {}

export const api = {
  health: () => fetch("/api/health").then((r) => r.json() as Promise<HealthResponse>),

  // Customer actions (sign-in optional — a session, when present, just
  // links the request to the customer's account)
  postOrder: (payload: OrderPayload) =>
    request<{ ok: true; id: string }>("/api/orders", {
      method: "POST",
      body: payload,
    }),
  postDelivery: (payload: DeliveryPayload) =>
    request<{ ok: true; id: string }>("/api/delivery", {
      method: "POST",
      body: payload,
    }),

  // Admin (require an admin session)
  admin: {
    stats: () => request<AdminStats>("/api/admin/stats"),
    products: () => request<Product[]>("/api/admin/products"),
    createProduct: (body: unknown) =>
      request<Product>("/api/admin/products", { method: "POST", body }),
    updateProduct: (id: string, body: unknown) =>
      request<Product>(`/api/admin/products/${id}`, { method: "PUT", body }),
    deleteProduct: (id: string) =>
      request<{ ok: true }>(`/api/admin/products/${id}`, { method: "DELETE" }),

    categories: () => request<Category[]>("/api/admin/categories"),
    createCategory: (body: unknown) =>
      request<Category>("/api/admin/categories", { method: "POST", body }),
    updateCategory: (id: string, body: unknown) =>
      request<Category>(`/api/admin/categories/${id}`, { method: "PUT", body }),
    deleteCategory: (id: string) =>
      request<{ ok: true }>(`/api/admin/categories/${id}`, { method: "DELETE" }),

    banners: () => request<Banner[]>("/api/admin/banners"),
    createBanner: (body: unknown) =>
      request<Banner>("/api/admin/banners", { method: "POST", body }),
    updateBanner: (id: string, body: unknown) =>
      request<Banner>(`/api/admin/banners/${id}`, { method: "PUT", body }),
    deleteBanner: (id: string) =>
      request<{ ok: true }>(`/api/admin/banners/${id}`, { method: "DELETE" }),

    orders: () => request<OrderRequest[]>("/api/admin/orders"),
    deliveries: () => request<DeliveryRequest[]>("/api/admin/deliveries"),
    updateOrderStatus: (id: string, status: RequestStatus) =>
      request<OrderRequest>(`/api/admin/orders/${id}`, {
        method: "PATCH",
        body: { status },
      }),
    updateDeliveryStatus: (id: string, status: RequestStatus) =>
      request<DeliveryRequest>(`/api/admin/deliveries/${id}`, {
        method: "PATCH",
        body: { status },
      }),

    upload: async (file: File, bucket: "products" | "banners"): Promise<string> => {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("bucket", bucket);
      const { url } = await request<{ url: string }>("/api/admin/upload", {
        method: "POST",
        formData,
      });
      return url;
    },
  },
};

/** Helper for pages that need the session token (kept for completeness). */
export async function accessToken(): Promise<string | undefined> {
  const client = requireSupabase();
  const { data } = await client.auth.getSession();
  return data.session?.access_token;
}
