import { brand } from "../config";

/** Items included in an order message. */
export interface MessageItem {
  name: string;
  quantity: number;
  price: number | string | null;
  showPrice: boolean;
}

function money(value: number | string | null): string {
  const n = Number(value ?? 0);
  return `₦${n.toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Convert a local phone number to international WhatsApp digits.
 * Handles Nigerian formats: 0803… → 234803…, +234 803… → 234803…
 */
export function waNumberFromPhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `234${digits.slice(1)}`;
  return digits;
}

/** Build a wa.me deep link for the store's WhatsApp number. */
export function waLink(text: string, number: string = brand.whatsappNumber): string {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/** Pre-filled order message — mirrors the web app's copy exactly. */
export function buildOrderMessage(input: {
  customerName: string;
  customerPhone: string;
  location?: string;
  notes?: string;
  items: MessageItem[];
}): string {
  const lines: string[] = [
    `Hello ${brand.shortName}! I'd like to place an order request from your website.`,
    "",
    `My name: ${input.customerName}`,
    `My phone: ${input.customerPhone}`,
  ];
  if (input.location) lines.push(`Delivery location: ${input.location}`);
  lines.push("", "Items:");
  input.items.forEach((item, index) => {
    const price =
      item.showPrice && item.price !== null && item.price !== undefined
        ? ` — ${money(item.price)} each`
        : " — price to be confirmed";
    lines.push(`${index + 1}. ${item.quantity} × ${item.name}${price}`);
  });

  const pricedTotal = input.items.reduce((sum, item) => {
    if (!item.showPrice || item.price === null || item.price === undefined) {
      return sum;
    }
    return sum + Number(item.price) * item.quantity;
  }, 0);
  if (pricedTotal > 0) {
    lines.push("", `Displayed total: ${money(pricedTotal)}`);
  }
  if (input.items.some((item) => !item.showPrice || item.price === null)) {
    lines.push(
      "Please confirm the final price for every item, including those without a displayed price.",
    );
  } else {
    lines.push("Please confirm final prices and availability for these items.");
  }
  if (input.location) {
    lines.push(
      `Also confirm the delivery cost to ${input.location} — I understand it is discussed directly.`,
    );
  }
  if (input.notes) lines.push("", `Notes: ${input.notes}`);
  lines.push("", "Thank you!");
  return lines.join("\n");
}

/** Pre-filled delivery / waybill request message. */
export function buildDeliveryMessage(input: {
  name: string;
  phone: string;
  location: string;
  productInfo: string;
  notes?: string;
}): string {
  const lines = [
    `Hello ${brand.shortName}! I'd like to request delivery / waybill for my order.`,
    "",
    `Name: ${input.name}`,
    `Phone / WhatsApp: ${input.phone}`,
    `Delivery location: ${input.location}`,
    `Product / order: ${input.productInfo}`,
  ];
  if (input.notes) lines.push(`Notes: ${input.notes}`);
  lines.push("", "Please confirm the delivery cost and timeline. Thank you!");
  return lines.join("\n");
}

/** Generic "chat with us" opener for CTA buttons. */
export function buildGeneralMessage(context?: string): string {
  const base = `Hello ${brand.shortName}! I found your website and I'd like to ask about your products/services.`;
  return context ? `${base}\n\n${context}` : base;
}

/** Deep link to chat about a specific product. */
export function productChatLink(productName: string): string {
  return waLink(
    `Hello ${brand.shortName}! I'm interested in "${productName}". Is it available? Please send me the current price and delivery options.`,
  );
}
