import "dotenv/config";

const env = process.env;

function str(value: string | undefined): string {
  return (value ?? "").trim();
}

export const config = {
  port: Number(env.PORT ?? "3001") || 3001,

  // Supabase
  supabaseUrl: str(env.SUPABASE_URL || env.VITE_SUPABASE_URL),
  supabaseAnonKey: str(env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY),
  supabaseServiceRoleKey: str(env.SUPABASE_SERVICE_ROLE_KEY),

  // Mailgun
  mailgunApiKey: str(env.MAILGUN_API_KEY),
  mailgunDomain: str(env.MAILGUN_DOMAIN),
  mailgunFrom: str(env.MAILGUN_FROM),
  mailgunRegion: str(env.MAILGUN_REGION).toLowerCase() === "eu" ? "eu" : "us",

  // Resend
  resendApiKey: str(env.RESEND_API_KEY),
  resendFrom: str(env.RESEND_FROM || "Bikoom Store <onboarding@resend.dev>"),

  // Store operations
  contactEmail: str(env.CONTACT_EMAIL),
  adminEmails: str(env.ADMIN_EMAILS)
    .split(",")
    .map((email) => email.toLowerCase())
    .filter(Boolean),
  whatsappNumber: str(env.WHATSAPP_NUMBER || env.VITE_WHATSAPP_NUMBER),
};

/** Env vars the server cannot run without. */
export function missingEnv(): string[] {
  const missing: string[] = [];
  if (!config.supabaseUrl) missing.push("SUPABASE_URL");
  if (!config.supabaseAnonKey) missing.push("SUPABASE_ANON_KEY");
  if (!config.supabaseServiceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  return missing;
}

export function isConfigured(): boolean {
  return missingEnv().length === 0;
}

export function mailgunConfigured(): boolean {
  return Boolean(
    config.mailgunApiKey && config.mailgunDomain && config.mailgunFrom,
  );
}

export function resendConfigured(): boolean {
  return Boolean(config.resendApiKey);
}

export function emailConfigured(): boolean {
  return resendConfigured() || mailgunConfigured();
}

export function emailProvider(): "resend" | "mailgun" | "none" {
  if (resendConfigured()) return "resend";
  if (mailgunConfigured()) return "mailgun";
  return "none";
}
