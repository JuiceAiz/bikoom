#!/usr/bin/env node
// ============================================================
// Bikoom Store — run supabase/*.sql against a live database.
//
//   node scripts/run-sql.mjs "postgresql://postgres:pass@host:6543/postgres"
//   DATABASE_URL="postgresql://…" node scripts/run-sql.mjs
//   node scripts/run-sql.mjs "$URL" supabase/schema.sql supabase/seed.sql
//
// Defaults to supabase/schema.sql then supabase/seed.sql.
// Each file runs inside its own transaction, so a failure rolls
// that file back cleanly. Safe to re-run: the files are idempotent.
// ============================================================

import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Client } = pg;

const args = process.argv.slice(2);
const url = args[0] || process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
const files =
  args.slice(1).length > 0 ? args.slice(1) : ["supabase/schema.sql", "supabase/seed.sql"];

if (!url) {
  console.error("Missing connection URL.");
  console.error('Usage: node scripts/run-sql.mjs "<postgres-url>" [file.sql ...]');
  process.exit(1);
}

let host = "";
try {
  host = new URL(url).hostname;
} catch {
  console.error("The connection URL could not be parsed.");
  process.exit(1);
}
const isLocal = /localhost|127\.0\.0\.1/.test(host);

const client = new Client({
  connectionString: url,
  // Supabase pooler/direct connections require TLS; the pooler's
  // certificate chain isn't in every local CA store, so don't verify.
  ssl: isLocal ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 15_000,
});

console.log(`Connecting to ${host} …`);
await client.connect();

let failed = false;
for (const file of files) {
  const sql = readFileSync(path.resolve(file), "utf8");
  console.log(`\n==> ${file}`);
  try {
    await client.query("begin");
    await client.query(sql); // multi-statement, parsed server-side
    await client.query("commit");
    console.log("    ✓ applied");
  } catch (err) {
    failed = true;
    console.error(`    ✗ ${err.message}`);
    if (err.position) console.error(`      at position ${err.position}`);
    await client.query("rollback").catch(() => {});
  }
}

await client.end();
if (failed) {
  console.error("\nOne or more files failed — fix and re-run (files are idempotent).");
  process.exit(1);
}
console.log("\nAll files applied successfully.");
