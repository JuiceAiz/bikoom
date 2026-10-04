/**
 * Brand configuration — single place to rebrand the store.
 * Colors live in src/index.css (@theme).
 */

const envWhatsApp = (import.meta.env.VITE_WHATSAPP_NUMBER ?? "").trim();

/** Placeholder number from .env.example — replace via VITE_WHATSAPP_NUMBER. */
export const PLACEHOLDER_WHATSAPP = "2348000000000";

export const brand = {
  name: "Bikoom Stores",
  shortName: "Bikoom",
  tagline: "Office equipment & more — new and A1 London used, from Ogoja to your door.",
  description:
    "Bikoom Stores is a small business in Ogoja, Cross River State, Nigeria, selling new and A1 London-used office equipment — laptops, phones, furniture, printers and Starlink kits — plus services like photocopying, printing and device setup.",
  location: "Ogoja, Cross River State, Nigeria",
  regionLabel: "Ogoja & across Cross River State",
  hours: "Monday – Saturday, 8am – 6pm (WAT)",
  /** International format, digits only, no +. */
  whatsappNumber: envWhatsApp || PLACEHOLDER_WHATSAPP,
  contactEmail: (import.meta.env.VITE_CONTACT_EMAIL ?? "").trim() ||
    "hello@bikoomstore.com",
  /** Photocopying/printing is an in-person Ogoja-only service. */
  ogojaOnlyServices: ["Photocopying", "Printing", "Spiral binding & lamination"],
} as const;

export const usesPlaceholderWhatsApp =
  brand.whatsappNumber === PLACEHOLDER_WHATSAPP;
