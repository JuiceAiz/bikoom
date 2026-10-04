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
