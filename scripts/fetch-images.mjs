#!/usr/bin/env node
/**
 * Bikoom Store — give every product & banner a real photo.
 *
 * For each item we search Wikimedia Commons (royalty-free, no API key),
 * pick a sensible photo, download a 1100px thumbnail, upload it into the
 * public Supabase Storage bucket (`products` / `banners`) and point the
 * row's image_url at the public URL.
 *
 *   node scripts/fetch-images.mjs            # fill rows where image_url is null
 *   node scripts/fetch-images.mjs --force    # redo every row
 *   node scripts/fetch-images.mjs products   # only products
 *   node scripts/fetch-images.mjs banners    # only banners
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const env = {};
for (const line of readFileSync(path.join(root, ".env"), "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i < 0) continue;
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

const SB = env.SUPABASE_URL.replace(/\/$/, "");
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const UA = "BikoomStoreSetup/1.0 (storefront image seeding)";

const args = process.argv.slice(2);
const force = args.includes("--force");
const only = args.find((a) => a === "products" || a === "banners") ?? "all";

/** Commons search queries per product slug — first hit that passes filters wins. */
const QUERIES = {
  "hp-elitebook-840-g8": ["HP EliteBook 840", "HP EliteBook"],
  "lenovo-thinkpad-x1-carbon-gen-9": ["Lenovo ThinkPad X1 Carbon Ultrabook", "Lenovo ThinkPad X1 Carbon"],
  "dell-latitude-5420": ["Dell Latitude 5420 laptop", "Dell Latitude laptop", "Dell Latitude"],
  "apple-macbook-air-m1-2020": ["MacBook Air M1", "MacBook Air"],
  "hp-probook-450-g8": ["HP ProBook 450", "HP ProBook"],
  "toshiba-satellite-c660": ["Toshiba Satellite", "Toshiba laptop"],
  "samsung-galaxy-a15": ["Samsung Galaxy A15 20240529", "Samsung Galaxy A15", "Samsung Galaxy phone"],
  "iphone-13-128gb": ["iPhone 13", "iPhone 13 Pro"],
  "samsung-galaxy-s23": ["SAMSUNG Galaxy S23 SERIES", "Back of the Samsung Galaxy S23", "Samsung Galaxy S23"],
  "infinix-note-30": ["Infinix Note", "Infinix smartphone"],
  "tecno-spark-20": ["Tecno Spark 20", "Tecno Spark"],
  "itel-a70": ["Itel A70", "Itel A50 front", "Itel phone"],
  "starlink-standard-kit": ["Starlink Dish 20250111", "Starlink dish", "Starlink antenna"],
  "starlink-installation-service": ["Starlink Dish 20250111", "Starlink dish", "Starlink installation"],
  "starlink-mounting-pole": ["Antenna mast", "Satellite dish mount", "Starlink Dish 20250111"],
  "tp-link-archer-c6": ["TP-Link router", "wireless router", "Wi-Fi router"],
  "1000va-ups": ["Uninterruptible power supply", "UPS battery"],
  "cctv-4channel-2camera-kit": ["security camera DVR", "CCTV camera kit", "surveillance camera"],
  "4-seater-fabric-sofa-set": ["Sofa", "modern sofa living room", "couch furniture"],
  "3-seater-dining-table-set": ["dining table set", "wooden dining table"],
  "ergonomic-mesh-office-chair": ["mesh office chair", "ergonomic office chair", "office chair"],
  "executive-office-desk": ["Office desk", "computer desk office", "writing desk"],
  "tv-console-centre-table": ["TV stand", "television stand", "media console furniture"],
  "photocopying-a4-per-page": ["Photocopier", "Sharp MX-7500 photocopier", "copy machine office"],
  "spiral-binding-lamination": ["Spiral bond book", "Coil binding", "spiral binding"],
  "laptop-servicing-virus-removal": ["Electronic technician at work", "laptop repair"],
  "wifi-setup-service": ["wireless router setup", "Wi-Fi router", "network switch"],
};

const BANNER_QUERIES = {
  "Laptops & Phones in Ogoja": ["laptop smartphone desk", "laptop computer desk"],
  "Starlink Installation, Done Right": ["Starlink dish", "Starlink antenna"],
  "Photocopying & Printing — Ogoja Only": ["photocopier office", "office printer"],
};

const BAD = /logo|icon|vector|diagram|map|chart|screenshot|wordmark|seal|poster|drawing|sketch|patent|cover art|flag|coat of arms|LCCN|zoo|garden|prize/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function jget(url) {
  // Commons rate-limits bursts with HTTP 429 — back off and retry.
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.ok) return res.json();
    if (res.status === 429 && attempt < 4) {
      await sleep(attempt * 2000);
      continue;
    }
    return null;
  }
  return null;
}

async function searchFiles(q) {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srlimit=14&format=json&srsearch=" +
    encodeURIComponent(q);
  const j = await jget(url);
  return (j?.query?.search ?? []).map((s) => s.title);
}

async function fileInfo(title) {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url%7Cmime&iiurlwidth=1100&format=json&titles=" +
    encodeURIComponent(title);
  const j = await jget(url);
  const page = Object.values(j?.query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0];
  if (!info?.thumburl || !/^image\/(jpeg|png)$/.test(info.mime)) return null;
  return { thumb: info.thumburl.split("?")[0], mime: info.mime };
}

async function pickImage(queries) {
  for (const q of queries) {
    const titles = await searchFiles(q);
    for (const title of titles) {
      if (!/\.(jpe?g|png)$/i.test(title)) continue;
      if (BAD.test(title)) continue;
      const info = await fileInfo(title);
      if (info) return { title, ...info };
    }
    await sleep(400);
  }
  return null;
}

async function download(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`download ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function upload(bucket, objectPath, bytes, mime) {
  const res = await fetch(`${SB}/storage/v1/object/${bucket}/${objectPath}`, {
    method: "POST",
    headers: { ...H, "Content-Type": mime, "x-upsert": "true" },
    body: bytes,
  });
  if (!res.ok) throw new Error(`upload ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

async function setRow(table, match, image_url) {
  const res = await fetch(`${SB}/rest/v1/${table}?${match}`, {
    method: "PATCH",
    headers: { ...H, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ image_url }),
  });
  if (!res.ok) throw new Error(`update ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

async function getRows(table, select, order) {
  const res = await fetch(`${SB}/rest/v1/${table}?select=${select}&order=${order}`, { headers: H });
  const rows = await res.json();
  if (!Array.isArray(rows)) throw new Error(`${table}: ${JSON.stringify(rows).slice(0, 200)}`);
  return rows;
}

async function main() {
  const done = [];
  const failed = [];

  if (only === "all" || only === "products") {
    const products = await getRows("products", "slug,name,image_url", "slug");
    const todo = products.filter((p) => force || !p.image_url);
    console.log(`Products: ${todo.length}/${products.length} to fill\n`);

    for (const p of todo) {
      const queries = QUERIES[p.slug] ?? [p.name.replace(/\(.*?\)/g, "").trim()];
      const pick = await pickImage(queries);
      if (!pick) {
        failed.push(`${p.slug} (no commons image)`);
        console.log(`  ✗ ${p.slug} — no usable image`);
        continue;
      }
      try {
        const bytes = await download(pick.thumb);
        const ext = pick.mime === "image/png" ? "png" : "jpg";
        const objectPath = `${p.slug}.${ext}`;
        await upload("products", objectPath, bytes, pick.mime);
        const publicUrl = `${SB}/storage/v1/object/public/products/${objectPath}`;
        await setRow("products", `slug=eq.${encodeURIComponent(p.slug)}`, publicUrl);
        done.push(`${p.slug} ← ${pick.title}`);
        console.log(`  ✓ ${p.slug}  ←  ${pick.title}`);
      } catch (err) {
        failed.push(`${p.slug} (${err.message})`);
        console.log(`  ✗ ${p.slug} — ${err.message}`);
      }
      await sleep(500);
    }
  }

  if (only === "all" || only === "banners") {
    const banners = await getRows("banners", "id,title,image_url", "sort_order");
    const todo = banners.filter((b) => force || !b.image_url);
    console.log(`\nBanners: ${todo.length}/${banners.length} to fill`);

    for (const b of todo) {
      const queries = BANNER_QUERIES[b.title] ?? [b.title];
      const pick = await pickImage(queries);
      if (!pick) {
        failed.push(`banner ${b.title} (no commons image)`);
        console.log(`  ✗ banner "${b.title}" — no usable image`);
        continue;
      }
      try {
        const bytes = await download(pick.thumb);
        const ext = pick.mime === "image/png" ? "png" : "jpg";
        const objectPath = `${b.id}.${ext}`;
        await upload("banners", objectPath, bytes, pick.mime);
        const publicUrl = `${SB}/storage/v1/object/public/banners/${objectPath}`;
        await setRow("banners", `id=eq.${b.id}`, publicUrl);
        done.push(`banner "${b.title}" ← ${pick.title}`);
        console.log(`  ✓ banner "${b.title}"  ←  ${pick.title}`);
      } catch (err) {
        failed.push(`banner ${b.title} (${err.message})`);
        console.log(`  ✗ banner "${b.title}" — ${err.message}`);
      }
      await sleep(500);
    }
  }

  console.log(`\nDone: ${done.length} set, ${failed.length} failed.`);
  if (failed.length) console.log(failed.map((f) => "  - " + f).join("\n"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
