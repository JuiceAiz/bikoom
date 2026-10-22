/**
 * Brand configuration — single place to rebrand the store.
 * Colors live in src/index.css (@theme).
 */

/** Store WhatsApp number in international format, digits only. */
export const WHATSAPP_NUMBER = "2348066481513";

export const brand = {
  name: "Bikoom Hubs",
  shortName: "Bikoom",
  tagline: "Office Equipments & More",
  heroSubtitle:
    "New and A1 London-used office equipment, honest prices. Every order is confirmed with you on WhatsApp.",
  description:
    "Bikoom Hubs sells new and A1 London-used office equipment — laptops, phones, furniture, printers and Starlink kits — plus services like photocopying, printing and device setup.",
  hours: "Monday – Saturday, 8am – 6pm (WAT)",
  whatsappNumber: WHATSAPP_NUMBER,
  contactEmail: (import.meta.env.VITE_CONTACT_EMAIL ?? "").trim() ||
    "hello@bikoomstore.com",
} as const;
