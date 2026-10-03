import { config, emailProvider } from "../config.js";
import type {
  DeliveryRequest,
  OrderRequest,
  OrderRequestItem,
} from "../../shared/types.js";

export interface SendResult {
  sent: boolean;
  provider?: "resend" | "mailgun" | "none";
  reason?: string;
}

function money(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return `₦${n.toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Send a transactional email via Resend or Mailgun HTTP API.
 * If credentials are not supplied, the email is cleanly skipped and logged.
 */
export async function sendEmail(options: {
  to: string[];
  subject: string;
  text: string;
}): Promise<SendResult> {
  const recipients = options.to.map((r) => r.trim()).filter(Boolean);
  if (recipients.length === 0) {
    return { sent: false, provider: "none", reason: "no recipient configured (CONTACT_EMAIL)" };
  }

  const provider = emailProvider();
  if (provider === "none") {
    console.log(`[email] skipped (neither Resend nor Mailgun configured): "${options.subject}"`);
    return { sent: false, provider: "none", reason: "no email provider configured" };
  }

  // 1. Resend provider
  if (provider === "resend") {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: config.resendFrom || "Bikoom Store <onboarding@resend.dev>",
          to: recipients,
          subject: options.subject,
          text: options.text,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Resend responded ${res.status}: ${body}`);
      }
      console.log(`[email:resend] sent successfully: "${options.subject}"`);
      return { sent: true, provider: "resend" };
    } catch (err) {
      console.error("[email:resend] send failed:", err);
      return { sent: false, provider: "resend", reason: "resend send failed" };
    }
  }

  // 2. Mailgun provider
  try {
    const host =
      config.mailgunRegion === "eu"
        ? "https://api.eu.mailgun.net"
        : "https://api.mailgun.net";
    const form = new FormData();
    form.set("from", config.mailgunFrom);
    form.set("to", recipients.join(", "));
    form.set("subject", options.subject);
    form.set("text", options.text);

    const res = await fetch(`${host}/v3/${config.mailgunDomain}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(
          `api:${config.mailgunApiKey}`,
        ).toString("base64")}`,
      },
      body: form,
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Mailgun responded ${res.status}: ${body}`);
    }
    console.log(`[email:mailgun] sent successfully: "${options.subject}"`);
    return { sent: true, provider: "mailgun" };
  } catch (err) {
    console.error("[email:mailgun] send failed:", err);
    return { sent: false, provider: "mailgun", reason: "mailgun send failed" };
  }
}

function orderText(order: OrderRequest, items: OrderRequestItem[]): string {
  const lines = [
    "New order request from the Bikoom Store website.",
    "",
    `Customer: ${order.customer_name}`,
    `Phone / WhatsApp: ${order.customer_phone}`,
    `Location: ${order.customer_location || "—"}`,
    "",
    "Items:",
    ...items.map((item) => {
      const unit =
        item.show_price && item.unit_price != null
          ? ` @ ${money(item.unit_price)}`
          : " (price to be quoted)";
      return `  • ${item.quantity} × ${item.product_name}${unit}`;
    }),
  ];
  if (order.displayed_total != null) {
    lines.push("", `Displayed total: ${money(order.displayed_total)}`);
  }
  if (order.notes) {
    lines.push("", `Notes: ${order.notes}`);
  }
  lines.push(
    "",
    `Received: ${new Date(order.created_at).toLocaleString("en-NG", {
      timeZone: "Africa/Lagos",
    })} (WAT)`,
    `Request ID: ${order.id}`,
    "",
    "Reply on WhatsApp to confirm pricing, availability and delivery.",
  );
  return lines.join("\n");
}

export async function notifyNewOrder(
  order: OrderRequest,
  items: OrderRequestItem[],
): Promise<SendResult> {
  return sendEmail({
    to: [config.contactEmail],
    subject: `New order request — ${order.customer_name} (${items.length} item${
      items.length === 1 ? "" : "s"
    })`,
    text: orderText(order, items),
  });
}

export async function notifyNewDelivery(
  req: DeliveryRequest,
): Promise<SendResult> {
  return sendEmail({
    to: [config.contactEmail],
    subject: `New delivery / waybill request — ${req.name}`,
    text: [
      "New delivery / waybill request from the Bikoom Store website.",
      "",
      `Name: ${req.name}`,
      `Phone / WhatsApp: ${req.phone}`,
      `Delivery location: ${req.location}`,
      `Product / order info: ${req.product_info}`,
      req.notes ? `Notes: ${req.notes}` : "Notes: —",
      "",
      `Received: ${new Date(req.created_at).toLocaleString("en-NG", {
        timeZone: "Africa/Lagos",
      })} (WAT)`,
      `Request ID: ${req.id}`,
      "",
      "Delivery cost is discussed directly with the customer — no fixed prices.",
    ].join("\n"),
  });
}
