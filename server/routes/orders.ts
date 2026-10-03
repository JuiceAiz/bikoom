import { Router } from "express";
import type { Response } from "express";
import { getSupabase } from "../lib/supabase.js";
import { notifyNewOrder } from "../lib/mailgun.js";
import { optionalAuth, type AuthedRequest } from "../middleware/auth.js";
import type { OrderPayload } from "../../shared/types.js";

export const ordersRouter = Router();

function badRequest(res: Response, message: string): void {
  res.status(400).json({ error: message });
}

function parseItems(
  raw: unknown,
): OrderPayload["items"] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 100) return null;
  const items: OrderPayload["items"] = [];
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) return null;
    const e = entry as Record<string, unknown>;
    const productName =
      typeof e.productName === "string" ? e.productName.trim() : "";
    const quantity = Number(e.quantity);
    if (!productName) return null;
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 999) return null;

    let unitPrice: number | null = null;
    if (e.unitPrice !== null && e.unitPrice !== undefined && e.unitPrice !== "") {
      const n = Number(e.unitPrice);
      if (!Number.isFinite(n) || n < 0) return null;
      unitPrice = n;
    }
    items.push({
      productId:
        typeof e.productId === "string" && e.productId.length > 0
          ? e.productId
          : null,
      productName,
      quantity: Math.floor(quantity),
      unitPrice,
      showPrice: e.showPrice !== false,
    });
  }
  return items;
}

/**
 * POST /api/orders — store an order request and e-mail the admin via Mailgun.
 * The customer still continues to WhatsApp; this is the durable record.
 * Sign-in is optional: guests can order too (user_id stays null).
 */
ordersRouter.post("/", optionalAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const supabase = getSupabase();
    const body = (req.body ?? {}) as Record<string, unknown>;

    const customerName =
      typeof body.customerName === "string" ? body.customerName.trim() : "";
    const customerPhone =
      typeof body.customerPhone === "string" ? body.customerPhone.trim() : "";
    const customerLocation =
      typeof body.customerLocation === "string"
        ? body.customerLocation.trim()
        : "";
    const notes = typeof body.notes === "string" ? body.notes.trim() : "";

    if (customerName.length < 2) {
      badRequest(res, "Please provide your name.");
      return;
    }
    if (customerPhone.replace(/[^\d+]/g, "").length < 7) {
      badRequest(res, "Please provide a valid phone / WhatsApp number.");
      return;
    }
    const items = parseItems(body.items);
    if (!items) {
      badRequest(res, "Your cart is empty or invalid. Please try again.");
      return;
    }

    const displayedTotal = items.reduce((sum, item) => {
      if (!item.showPrice || item.unitPrice === null) return sum;
      return sum + item.unitPrice * item.quantity;
    }, 0);

    const { data: order, error: orderError } = await supabase
      .from("order_requests")
      .insert({
        user_id: req.userId ?? null,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_location: customerLocation || null,
        notes: notes || null,
        displayed_total: displayedTotal > 0 ? displayedTotal : null,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("[orders] insert failed:", orderError);
      res.status(500).json({ error: "Could not save your order request." });
      return;
    }

    const { error: itemsError } = await supabase
      .from("order_request_items")
      .insert(
        items.map((item) => ({
          order_request_id: order.id,
          product_id: item.productId ?? null,
          product_name: item.productName,
          unit_price: item.unitPrice,
          show_price: item.showPrice,
          quantity: item.quantity,
        })),
      );
    if (itemsError) {
      console.error("[orders] items insert failed:", itemsError);
      res.status(500).json({ error: "Could not save your order items." });
      return;
    }

    const orderItems = items.map((item, index) => ({
      id: `${order.id}-${index}`,
      order_request_id: order.id,
      product_id: item.productId ?? null,
      product_name: item.productName,
      unit_price: item.unitPrice,
      show_price: item.showPrice,
      quantity: item.quantity,
    }));
    await notifyNewOrder(order, orderItems);

    res.status(201).json({ ok: true, id: order.id });
  } catch (err) {
    console.error("[orders] unexpected error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});
