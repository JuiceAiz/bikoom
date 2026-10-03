import { Router } from "express";
import type { Request, Response } from "express";
import multer from "multer";
import { getSupabase } from "../lib/supabase.js";
import { requireAdmin, type AuthedRequest } from "../middleware/auth.js";
import { slugify } from "../../shared/util.js";
import { REQUEST_STATUSES, type RequestStatus } from "../../shared/types.js";

export const adminRouter = Router();

// Every route below requires a signed-in administrator.
adminRouter.use(requireAdmin);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(png|jpe?g|webp|gif|avif|svg\+xml)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (max 5MB)."));
    }
  },
});

const MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

function fail(res: Response, status: number, message: string): void {
  res.status(status).json({ error: message });
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function asBool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function asNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

// ------------------------------------------------------------
// Dashboard stats
// ------------------------------------------------------------
adminRouter.get("/stats", async (_req: AuthedRequest, res: Response) => {
  try {
    const supabase = getSupabase();
    const count = (table: string) =>
      supabase.from(table).select("id", { count: "exact", head: true });

    const [products, categories, orders, deliveries, outOfStock, recentOrders] =
      await Promise.all([
        count("products"),
        count("categories"),
        count("order_requests"),
        count("delivery_requests"),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("is_available", false),
        supabase
          .from("order_requests")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
    res.json({
      products: products.count ?? 0,
      categories: categories.count ?? 0,
      orders: orders.count ?? 0,
      deliveries: deliveries.count ?? 0,
      outOfStock: outOfStock.count ?? 0,
      recentOrders: recentOrders.data ?? [],
    });
  } catch (err) {
    console.error("[admin/stats]", err);
    fail(res, 500, "Could not load dashboard stats.");
  }
});

// ------------------------------------------------------------
// Products
// ------------------------------------------------------------
adminRouter.get("/products", async (_req: AuthedRequest, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(id, name, slug)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    console.error("[admin/products]", err);
    fail(res, 500, "Could not load products.");
  }
});

function productBody(body: Record<string, unknown>) {
  const name = asString(body.name);
  const showPrice = asBool(body.showPrice, true);
  const price = asNumberOrNull(body.price);
  return {
    name,
    slug: asString(body.slug) || slugify(name),
    description: asString(body.description),
    category_id:
      typeof body.categoryId === "string" && body.categoryId
        ? body.categoryId
        : null,
    price: showPrice ? price : null,
    show_price: showPrice,
    is_available: asBool(body.isAvailable, true),
    is_featured: asBool(body.isFeatured, false),
    image_url: asString(body.imageUrl) || null,
    images: Array.isArray(body.images)
      ? (body.images as unknown[]).filter(
          (u): u is string => typeof u === "string" && u.length > 0,
        )
      : [],
  };
}

adminRouter.post("/products", async (req: AuthedRequest, res: Response) => {
  try {
    const supabase = getSupabase();
    const row = productBody((req.body ?? {}) as Record<string, unknown>);
    if (row.name.length < 2) return fail(res, 400, "Product name is required.");
    if (!row.slug) return fail(res, 400, "Product slug is required.");
    if (row.show_price && row.price === null)
      return fail(res, 400, "Enter a price, or turn off Show Price.");

    const { data, error } = await supabase
      .from("products")
      .insert(row)
      .select()
      .single();
    if (error) {
      if (error.code === "23505")
        return fail(res, 409, "A product with this slug already exists.");
      throw error;
    }
    res.status(201).json(data);
  } catch (err) {
    console.error("[admin/products:post]", err);
    fail(res, 500, "Could not create the product.");
  }
});

adminRouter.put("/products/:id", async (req: AuthedRequest, res: Response) => {
  try {
    const supabase = getSupabase();
    const row = productBody((req.body ?? {}) as Record<string, unknown>);
    if (row.name.length < 2) return fail(res, 400, "Product name is required.");
    if (row.show_price && row.price === null)
      return fail(res, 400, "Enter a price, or turn off Show Price.");

    const { data, error } = await supabase
      .from("products")
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error || !data) {
      if (error?.code === "23505")
        return fail(res, 409, "A product with this slug already exists.");
      return fail(res, 404, "Product not found.");
    }
    res.json(data);
  } catch (err) {
    console.error("[admin/products:put]", err);
    fail(res, 500, "Could not update the product.");
  }
});

adminRouter.delete(
  "/products/:id",
  async (req: AuthedRequest, res: Response) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", req.params.id);
      if (error) throw error;
      res.json({ ok: true });
    } catch (err) {
      console.error("[admin/products:delete]", err);
      fail(res, 500, "Could not delete the product.");
    }
  },
);

// ------------------------------------------------------------
// Categories
// ------------------------------------------------------------
adminRouter.get("/categories", async (_req: AuthedRequest, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    console.error("[admin/categories]", err);
    fail(res, 500, "Could not load categories.");
  }
});

adminRouter.post("/categories", async (req: AuthedRequest, res: Response) => {
  try {
    const supabase = getSupabase();
    const body = (req.body ?? {}) as Record<string, unknown>;
    const name = asString(body.name);
    if (name.length < 2) return fail(res, 400, "Category name is required.");
    const slug = asString(body.slug) || slugify(name);
    const { data, error } = await supabase
      .from("categories")
      .insert({
        name,
        slug,
        description: asString(body.description) || null,
        sort_order: Number(body.sortOrder) || 0,
      })
      .select()
      .single();
    if (error) {
      if (error.code === "23505")
        return fail(res, 409, "A category with this slug already exists.");
      throw error;
    }
    res.status(201).json(data);
  } catch (err) {
    console.error("[admin/categories:post]", err);
    fail(res, 500, "Could not create the category.");
  }
});

adminRouter.put("/categories/:id", async (req: AuthedRequest, res: Response) => {
  try {
    const supabase = getSupabase();
    const body = (req.body ?? {}) as Record<string, unknown>;
    const name = asString(body.name);
    if (name.length < 2) return fail(res, 400, "Category name is required.");
    const { data, error } = await supabase
      .from("categories")
      .update({
        name,
        slug: asString(body.slug) || slugify(name),
        description: asString(body.description) || null,
        sort_order: Number(body.sortOrder) || 0,
      })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error || !data) {
      if (error?.code === "23505")
        return fail(res, 409, "A category with this slug already exists.");
      return fail(res, 404, "Category not found.");
    }
    res.json(data);
  } catch (err) {
    console.error("[admin/categories:put]", err);
    fail(res, 500, "Could not update the category.");
  }
});

adminRouter.delete(
  "/categories/:id",
  async (req: AuthedRequest, res: Response) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", req.params.id);
      if (error) throw error;
      res.json({ ok: true });
    } catch (err) {
      console.error("[admin/categories:delete]", err);
      fail(res, 500, "Could not delete the category.");
    }
  },
);

// ------------------------------------------------------------
// Banners
// ------------------------------------------------------------
adminRouter.get("/banners", async (_req: AuthedRequest, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    console.error("[admin/banners]", err);
    fail(res, 500, "Could not load banners.");
  }
});

adminRouter.post("/banners", async (req: AuthedRequest, res: Response) => {
  try {
    const supabase = getSupabase();
    const body = (req.body ?? {}) as Record<string, unknown>;
    const title = asString(body.title);
    if (title.length < 2) return fail(res, 400, "Banner title is required.");
    const { data, error } = await supabase
      .from("banners")
      .insert({
        title,
        subtitle: asString(body.subtitle) || null,
        image_url: asString(body.imageUrl) || null,
        link_url: asString(body.linkUrl) || null,
        is_active: asBool(body.isActive, true),
        sort_order: Number(body.sortOrder) || 0,
      })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error("[admin/banners:post]", err);
    fail(res, 500, "Could not create the banner.");
  }
});

adminRouter.put("/banners/:id", async (req: AuthedRequest, res: Response) => {
  try {
    const supabase = getSupabase();
    const body = (req.body ?? {}) as Record<string, unknown>;
    const title = asString(body.title);
    if (title.length < 2) return fail(res, 400, "Banner title is required.");
    const { data, error } = await supabase
      .from("banners")
      .update({
        title,
        subtitle: asString(body.subtitle) || null,
        image_url: asString(body.imageUrl) || null,
        link_url: asString(body.linkUrl) || null,
        is_active: asBool(body.isActive, true),
        sort_order: Number(body.sortOrder) || 0,
      })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error || !data) return fail(res, 404, "Banner not found.");
    res.json(data);
  } catch (err) {
    console.error("[admin/banners:put]", err);
    fail(res, 500, "Could not update the banner.");
  }
});

adminRouter.delete("/banners/:id", async (req: AuthedRequest, res: Response) => {
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("banners")
      .delete()
      .eq("id", req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error("[admin/banners:delete]", err);
    fail(res, 500, "Could not delete the banner.");
  }
});

// ------------------------------------------------------------
// Order & delivery requests
// ------------------------------------------------------------
adminRouter.get("/orders", async (_req: AuthedRequest, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data: orders, error } = await supabase
      .from("order_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;

    const ids = (orders ?? []).map((o) => o.id);
    let itemsByOrder: Record<string, unknown[]> = {};
    if (ids.length > 0) {
      const { data: items } = await supabase
        .from("order_request_items")
        .select("*")
        .in("order_request_id", ids);
      itemsByOrder = (items ?? []).reduce<Record<string, unknown[]>>(
        (acc, item) => {
          (acc[item.order_request_id] ??= []).push(item);
          return acc;
        },
        {},
      );
    }
    res.json(
      (orders ?? []).map((order) => ({
        ...order,
        items: itemsByOrder[order.id] ?? [],
      })),
    );
  } catch (err) {
    console.error("[admin/orders]", err);
    fail(res, 500, "Could not load order requests.");
  }
});

adminRouter.get("/deliveries", async (_req: AuthedRequest, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("delivery_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    console.error("[admin/deliveries]", err);
    fail(res, 500, "Could not load delivery requests.");
  }
});

function statusFromBody(body: Record<string, unknown>): RequestStatus | null {
  const status = asString(body.status);
  return (REQUEST_STATUSES as string[]).includes(status)
    ? (status as RequestStatus)
    : null;
}

adminRouter.patch("/orders/:id", async (req: AuthedRequest, res: Response) => {
  try {
    const status = statusFromBody((req.body ?? {}) as Record<string, unknown>);
    if (!status) return fail(res, 400, "Invalid status.");
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("order_requests")
      .update({ status })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error || !data) return fail(res, 404, "Order request not found.");
    res.json(data);
  } catch (err) {
    console.error("[admin/orders:patch]", err);
    fail(res, 500, "Could not update the request.");
  }
});

adminRouter.patch(
  "/deliveries/:id",
  async (req: AuthedRequest, res: Response) => {
    try {
      const status = statusFromBody(
        (req.body ?? {}) as Record<string, unknown>,
      );
      if (!status) return fail(res, 400, "Invalid status.");
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("delivery_requests")
        .update({ status })
        .eq("id", req.params.id)
        .select()
        .single();
      if (error || !data) return fail(res, 404, "Delivery request not found.");
      res.json(data);
    } catch (err) {
      console.error("[admin/deliveries:patch]", err);
      fail(res, 500, "Could not update the request.");
    }
  },
);

// ------------------------------------------------------------
// Image upload → Supabase Storage (public bucket)
// ------------------------------------------------------------
adminRouter.post(
  "/upload",
  (req: Request, res: Response, next) => {
    upload.single("file")(req, res, (err: unknown) => {
      if (err) {
        const message =
          err instanceof Error ? err.message : "Upload failed.";
        fail(res, 400, message);
        return;
      }
      next();
    });
  },
  async (req: AuthedRequest, res: Response) => {
    try {
      const file = req.file;
      if (!file) return fail(res, 400, "No file received.");
      const bucketRaw = asString((req.body ?? {}).bucket, "products");
      const bucket = bucketRaw === "banners" ? "banners" : "products";
      const ext = MIME_EXT[file.mimetype] ?? "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const supabase = getSupabase();
      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });
      if (error) {
        console.error("[admin/upload]", error);
        return fail(res, 500, `Upload failed: ${error.message}`);
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(path);
      res.status(201).json({ url: publicUrl });
    } catch (err) {
      console.error("[admin/upload]", err);
      fail(res, 500, "Upload failed.");
    }
  },
);
