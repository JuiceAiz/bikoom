export type RequestStatus = "new" | "contacted" | "closed";

export const REQUEST_STATUSES: RequestStatus[] = ["new", "contacted", "closed"];

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string;
  price: number | string | null;
  show_price: boolean;
  is_available: boolean;
  is_featured: boolean;
  image_url: string | null;
  images: string[];
  created_at: string;
  updated_at: string;
  /** Joined category info (when requested via select) */
  category?: Pick<Category, "id" | "name" | "slug"> | null;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface OrderRequest {
  id: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_location: string | null;
  notes: string | null;
  displayed_total: number | string | null;
  status: RequestStatus;
  created_at: string;
  items?: OrderRequestItem[];
}

export interface OrderRequestItem {
  id: string;
  order_request_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number | string | null;
  show_price: boolean;
  quantity: number;
}

export interface DeliveryRequest {
  id: string;
  user_id: string | null;
  name: string;
  phone: string;
  location: string;
  product_info: string;
  notes: string | null;
  status: RequestStatus;
  created_at: string;
}

/** Payload the client posts to POST /api/orders */
export interface OrderPayload {
  customerName: string;
  customerPhone: string;
  customerLocation?: string;
  notes?: string;
  items: Array<{
    productId?: string | null;
    productName: string;
    quantity: number;
    unitPrice: number | null;
    showPrice: boolean;
  }>;
}

/** Payload the client posts to POST /api/delivery */
export interface DeliveryPayload {
  name: string;
  phone: string;
  location: string;
  productInfo: string;
  notes?: string;
}

export interface HealthResponse {
  ok: boolean;
  store: string;
  configured: boolean;
  missing: string[];
  mailgunConfigured: boolean;
  /** Google e-mails pre-approved as admins via ADMIN_EMAILS. */
  adminEmails?: string[];
}
