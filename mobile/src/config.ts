/**
 * Brand configuration — single place to rebrand the store.
 * Mirrors the web app's src/brand.ts so both stay in sync.
 */

const envWhatsApp = (process.env.EXPO_PUBLIC_WHATSAPP_NUMBER ?? "").trim();

/** Placeholder number — replace via EXPO_PUBLIC_WHATSAPP_NUMBER. */
export const PLACEHOLDER_WHATSAPP = "2348000000000";

export const brand = {
  name: "Bikoom Stores",
  shortName: "Bikoom",
  tagline:
    "Office equipment & more — new and A1 London used, from Ogoja to your door.",
  description:
    "Bikoom Stores is a small business in Ogoja, Cross River State, Nigeria, selling new and A1 London-used office equipment — laptops, phones, furniture, printers and Starlink kits — plus services like photocopying, printing and device setup.",
  location: "Ogoja, Cross River State, Nigeria",
  regionLabel: "Ogoja & across Cross River State",
  hours: "Monday – Saturday, 8am – 6pm (WAT)",
  /** International format, digits only, no +. */
  whatsappNumber: envWhatsApp || PLACEHOLDER_WHATSAPP,
  contactEmail: "hello@bikoomstore.com",
  ogojaOnlyServices: ["Photocopying", "Printing", "Spiral binding & lamination"],
} as const;

export const usesPlaceholderWhatsApp =
  brand.whatsappNumber === PLACEHOLDER_WHATSAPP;

/** Express API base (orders, deliveries, admin). */
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? "https://bikoom.vercel.app"
).replace(/\/+$/, "");

/**
 * Public site origin. The Google sign-in flow returns here first
 * (/api/mobile-auth) and hops back into the app, because Supabase
 * rejects Expo Go's exp://<LAN-IP> redirect URLs outright.
 */
export const SITE_URL = (
  process.env.EXPO_PUBLIC_SITE_URL ?? "https://bikoom.vercel.app"
).replace(/\/+$/, "");

export const SUPABASE_URL = (
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? ""
).trim();
export const SUPABASE_ANON_KEY = (
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ""
).trim();

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
