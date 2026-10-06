import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import type { Request, Response, NextFunction } from "express";
import { config, emailConfigured, emailProvider, isConfigured, mailgunConfigured, missingEnv } from "./config.js";
import { ordersRouter } from "./routes/orders.js";
import { deliveryRouter } from "./routes/delivery.js";
import { adminRouter } from "./routes/admin.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ------------------------------------------------------------
// Health / configuration check (used by the frontend to show the
// "setup required" screen when credentials are still missing).
// ------------------------------------------------------------
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    store: "Bikoom Stores",
    configured: isConfigured(),
    missing: missingEnv(),
    mailgunConfigured: mailgunConfigured(),
    emailConfigured: emailConfigured(),
    emailProvider: emailProvider(),
    adminEmails: config.adminEmails,
  });
});

// ------------------------------------------------------------
// Deep-link hop for the mobile app's Google sign-in.
//
// Supabase Auth rejects any redirect whose host is a non-loopback IP
// address *before* consulting the Redirect URLs allow list, and Expo Go
// always sends exp://<LAN-IP>:8081/... — so the browser used to fall back
// to the Site URL (the website) and never returned to the app. The app
// therefore redirects here instead (this host always matches the Site URL)
// and we hand the auth code back to the app's own deep link.
// ------------------------------------------------------------
const APP_DEEP_LINK = /^(?:bikoom|exp|exps):\/\//;
const FORWARDED_AUTH_PARAMS = [
  "code",
  "error",
  "error_code",
  "error_description",
  "access_token",
  "refresh_token",
  "token_type",
  "expires_in",
  "expires_at",
  "provider_token",
  "provider_refresh_token",
] as const;

const htmlEscape = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

app.get("/api/mobile-auth", (req: Request, res: Response) => {
  res.setHeader("Cache-Control", "no-store");
  res.type("html");

  const next = typeof req.query.next === "string" ? req.query.next : "";
  if (!APP_DEEP_LINK.test(next)) {
    res
      .status(400)
      .send(
        '<!doctype html><meta charset="utf-8"><title>Bikoom Stores</title>' +
          "<p>Invalid app link. Close this tab and try signing in again.</p>",
      );
    return;
  }

  const forwarded = new URLSearchParams();
  for (const key of FORWARDED_AUTH_PARAMS) {
    const value = req.query[key];
    if (typeof value === "string" && value) forwarded.set(key, value);
  }
  const query = forwarded.toString();
  const target = query ? `${next}?${query}` : next;

  // Meta refresh + JS cover automatic return; the link is the manual
  // fallback for browsers that block unattended custom-scheme launches.
  res.status(200).send(
    `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
      `<meta name="viewport" content="width=device-width, initial-scale=1">` +
      `<meta http-equiv="refresh" content="0;url=${htmlEscape(target)}">` +
      `<title>Bikoom Stores</title></head><body style="font-family:system-ui,sans-serif;padding:24px;color:#0B1220">` +
      `<p>Returning you to the Bikoom Stores app&hellip;</p>` +
      `<p><a href="${htmlEscape(target)}">Tap here if nothing happens.</a></p>` +
      `<script>location.replace(${JSON.stringify(target)});</script>` +
      `</body></html>`,
  );
});

app.use("/api/orders", ordersRouter);
app.use("/api/delivery", deliveryRouter);
app.use("/api/admin", adminRouter);

app.use("/api", (_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// ------------------------------------------------------------
// Production: serve the built SPA (npm run build → npm start)
// ------------------------------------------------------------
const distDir = path.join(rootDir, "dist");
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(path.join(distDir, "index.html"));
  });
}

// Central error handler (multer errors, JSON parse errors, etc.)
app.use(
  (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[server error]", err);
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    }
  },
);

// On Vercel the app is exported as serverless functions (see api/) and
// must not call listen(); locally we start the HTTP server as usual.
if (!process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(`\n  Bikoom Stores API listening on http://localhost:${config.port}`);
    if (!isConfigured()) {
      console.warn(
        `  ⚠ Not configured — missing env vars: ${missingEnv().join(", ")}`,
      );
      console.warn("  Copy .env.example to .env and fill in your Supabase keys.");
    }
    if (emailConfigured()) {
      console.log(`  ✓ Transactional email provider: ${emailProvider()}`);
    } else {
      console.log("  ℹ Email not configured (Resend / Mailgun) — notification e-mails are skipped.");
    }
  });
}

export { app };
export default app;
