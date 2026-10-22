/**
 * Brand configuration — single place to rebrand the store.
 * Mirrors the web app's src/brand.ts so both stay in sync.
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
  contactEmail: "hello@bikoomstore.com",
} as const;

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
