#!/usr/bin/env node
/**
 * Bikoom Store — Apply schema.sql + seed.sql via Supabase Management API.
 * The Management API (api.supabase.com) accepts service-role token and can
 * execute arbitrary SQL on the project database.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// Parse .env manually
const envLines = readFileSync(path.join(root, ".env"), "utf8").split("\n");
const env = {};
for (const line of envLines) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const idx = t.indexOf("=");
  if (idx < 0) continue;
  env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
}

const PROJECT_REF = "elqsaigcplovujdgvdak";
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Bikoom Store — DB Setup via Supabase Management API");
console.log(`Project ref: ${PROJECT_REF}`);
console.log(`Key prefix:  ${SERVICE_ROLE_KEY?.slice(0, 20)}...`);

// Supabase Management API v1 — run SQL
const MGMT_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

async function runQuery(label, sql) {
  console.log(`\n──> ${label} (${sql.length} chars)`);
  const res = await fetch(MGMT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (res.ok) {
    console.log(`    ✓ Applied — ${res.status}`);
    return true;
  } else {
    console.error(`    ✗ Failed — ${res.status}: ${text.slice(0, 300)}`);
    return false;
  }
}

// Test with a simple query first
const testRes = await fetch(MGMT_URL, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: "select current_database(), version();" }),
});
const testText = await testRes.text();
console.log(`\nTest query: ${testRes.status} — ${testText.slice(0, 200)}`);

if (!testRes.ok) {
  console.log("\n⚠  Management API access failed.");
  console.log("The service role key may not have management API access.");
  console.log("You need to apply the SQL via the Supabase Dashboard SQL Editor.");
  console.log("\nHere is the direct link:");
  console.log(`https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`);
  console.log("\nCopy and run these files in order:");
  console.log("  1. supabase/schema.sql");
  console.log("  2. supabase/seed.sql");
  process.exit(0);
}

const schema = readFileSync(path.join(root, "supabase/schema.sql"), "utf8");
const seed = readFileSync(path.join(root, "supabase/seed.sql"), "utf8");

const ok1 = await runQuery("schema.sql", schema);
if (ok1) {
  await runQuery("seed.sql", seed);
}

console.log("\nDone.");
