import { Router } from "express";
import type { Response } from "express";
import { getSupabase } from "../lib/supabase.js";
import { notifyNewDelivery } from "../lib/mailgun.js";
import { optionalAuth, type AuthedRequest } from "../middleware/auth.js";
import type { DeliveryPayload } from "../../shared/types.js";

export const deliveryRouter = Router();

/**
 * POST /api/delivery — store a delivery / waybill request and notify the
 * admin by e-mail. No live tracking, no fixed prices: cost is discussed
 * directly on WhatsApp. Sign-in is optional (guests welcome).
 */
deliveryRouter.post(
  "/",
  optionalAuth,
  async (req: AuthedRequest, res: Response) => {
    try {
      const supabase = getSupabase();
      const body = (req.body ?? {}) as Record<string, unknown>;

      const payload: DeliveryPayload = {
        name: typeof body.name === "string" ? body.name.trim() : "",
        phone: typeof body.phone === "string" ? body.phone.trim() : "",
        location:
          typeof body.location === "string" ? body.location.trim() : "",
        productInfo:
          typeof body.productInfo === "string" ? body.productInfo.trim() : "",
        notes: typeof body.notes === "string" ? body.notes.trim() : "",
      };

      if (payload.name.length < 2) {
        res.status(400).json({ error: "Please provide your name." });
        return;
      }
      if (payload.phone.replace(/[^\d+]/g, "").length < 7) {
        res
          .status(400)
          .json({ error: "Please provide a valid phone / WhatsApp number." });
        return;
      }
      if (payload.location.length < 2) {
        res
          .status(400)
          .json({ error: "Please tell us where the item should be delivered." });
        return;
      }
      if (payload.productInfo.length < 2) {
        res
          .status(400)
          .json({ error: "Please describe the product or order." });
        return;
      }

      const { data: record, error } = await supabase
        .from("delivery_requests")
        .insert({
          user_id: req.userId ?? null,
          name: payload.name,
          phone: payload.phone,
          location: payload.location,
          product_info: payload.productInfo,
          notes: payload.notes || null,
        })
        .select()
        .single();

      if (error || !record) {
        console.error("[delivery] insert failed:", error);
        res
          .status(500)
          .json({ error: "Could not save your delivery request." });
        return;
      }

      await notifyNewDelivery(record);

      res.status(201).json({ ok: true, id: record.id });
    } catch (err) {
      console.error("[delivery] unexpected error:", err);
      res.status(500).json({ error: "Something went wrong. Please try again." });
    }
  },
);
