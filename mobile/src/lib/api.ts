import { API_URL, supabaseConfigured } from "../config";
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
} from "../../../shared/types";
import { supabase } from "./supabase";

const JSON_HEADERS = { "Content-Type": "application/json" };

async function authHeaders(): Promise<Record<string, string>> {
  if (!supabaseConfigured) return {};
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
  const res = await fetch(`${API_URL}${path}`, {
    method: init.method ?? "GET",
    headers,
    body:
      init.formData ??
      (init.body !== undefined ? JSON.stringify(init.body) : undefined),
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

/**
 * Express API client — mirrors src/lib/api.ts so every admin operation
 * goes through the same validation/auth as the website.
 */
export const api = {
  health: (): Promise<HealthResponse> =>
    fetch(`${API_URL}/api/health`).then((r) => r.json() as Promise<HealthResponse>),

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

    upload: async (
      uri: string,
      fileName: string,
      mimeType: string,
      bucket: "products" | "banners",
    ): Promise<string> => {
      const formData = new FormData();
      formData.set("file", { uri, name: fileName, type: mimeType } as unknown as Blob);
      formData.set("bucket", bucket);
      const { url } = await request<{ url: string }>("/api/admin/upload", {
        method: "POST",
        formData,
      });
      return url;
    },
  },
};
