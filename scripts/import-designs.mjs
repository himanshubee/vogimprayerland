#!/usr/bin/env node
/**
 * Bulk-load store designs from a folder of transparent PNGs.
 *
 *   node scripts/import-designs.mjs <folder> [--dry] [--draft] [--only=tshirt|cap]
 *
 * Every *.png in the folder is uploaded once to the image service and then
 * listed twice — as a T-shirt and as a cap — with the title taken from the
 * file name ("the-balm-of-gilead.png" → "The Balm of Gilead"). Designs whose
 * slug already exists are skipped, so the script can be re-run safely after
 * adding files to the folder. Prices follow the category defaults set in
 * /admin/store; every fabric colour is offered.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import { MongoClient, ObjectId } from "mongodb";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
loadEnvConfig(ROOT);

const args = process.argv.slice(2);
const folder = args.find((a) => !a.startsWith("--"));
const dry = args.includes("--dry");
const draft = args.includes("--draft");
const only = (args.find((a) => a.startsWith("--only=")) ?? "").split("=")[1];

if (!folder) {
  console.error("Usage: node scripts/import-designs.mjs <folder> [--dry] [--draft] [--only=tshirt|cap]");
  process.exit(1);
}

const UPLOAD_URL = process.env.S3_UPLOAD_URL || "https://s3upload.vogimprayerland.org/upload";
const API_KEY = process.env.S3_UPLOAD_KEY;
if (!API_KEY) {
  console.error("S3_UPLOAD_KEY is not set — the designs cannot be uploaded.");
  process.exit(1);
}

// Mirrors COLORS in src/lib/merch-shared.ts — keys are what the shop stores.
const COLOR_KEYS = ["black", "maroon", "gold", "navy", "royal", "forest", "red", "heather", "sand"];
const CATEGORIES = only ? [only] : ["tshirt", "cap"];

const SMALL = new Set(["a", "an", "and", "the", "of", "in", "to", "for", "on", "at", "by", "from", "into", "upon", "under"]);
function titleFrom(file) {
  const words = path.basename(file, path.extname(file)).toLowerCase().split(/[-_\s]+/).filter(Boolean);
  return words
    .map((w, i) => (i > 0 && SMALL.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}
const slugFrom = (file) =>
  path.basename(file, path.extname(file)).toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 110);

async function upload(filePath) {
  const buf = await readFile(filePath);
  const fd = new FormData();
  fd.append("file", new Blob([buf], { type: "image/png" }), path.basename(filePath));
  const res = await fetch(UPLOAD_URL, { method: "POST", headers: { "x-api-key": API_KEY }, body: fd });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`upload service answered ${res.status}: ${text.slice(0, 120)}`);
  }
  if (!res.ok) throw new Error(data?.error || `upload failed (${res.status})`);
  // The original file, not the WebP variant — the transparency must survive.
  const url = data.publicUrl || data.webpUrl;
  if (!url) throw new Error("upload service returned no URL");
  return url;
}

const files = (await readdir(folder))
  .filter((f) => /\.png$/i.test(f))
  .sort()
  .map((f) => path.join(folder, f));

if (!files.length) {
  console.error(`No .png files in ${folder}`);
  process.exit(1);
}

const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
await client.connect();
const db = client.db(process.env.MONGODB_DB || "vogim");
const merch = db.collection("merch");

const existing = new Set((await merch.find({}).project({ slug: 1 }).toArray()).map((d) => d.slug));
let order = await merch.countDocuments();
const summary = { uploaded: 0, created: 0, skipped: 0, failed: 0 };

for (const file of files) {
  const base = slugFrom(file);
  const title = titleFrom(file);
  const wanted = CATEGORIES.map((c) => ({ category: c, slug: c === "cap" ? `${base}-cap` : base })).filter(
    (w) => !existing.has(w.slug)
  );
  if (!wanted.length) {
    console.log(`skip     ${title} — already listed`);
    summary.skipped += 1;
    continue;
  }

  if (dry) {
    console.log(`would    ${title}  →  ${wanted.map((w) => `${w.category}:${w.slug}`).join(", ")}`);
    continue;
  }

  let url;
  try {
    url = await upload(file);
    summary.uploaded += 1;
  } catch (err) {
    console.error(`FAILED   ${title} — ${err.message}`);
    summary.failed += 1;
    continue;
  }

  const now = new Date();
  for (const { category, slug } of wanted) {
    await merch.insertOne({
      _id: new ObjectId(),
      slug,
      title,
      category,
      description: "",
      design: url,
      colors: COLOR_KEYS,
      defaultColor: "black",
      printOffsetY: 0,
      printScale: 1,
      basePrice: null,
      baseCurrency: "USD",
      status: draft ? "draft" : "published",
      featured: false,
      order: order++,
      createdAt: now,
      updatedAt: now,
    });
    existing.add(slug);
    summary.created += 1;
  }
  console.log(`listed   ${title}  →  ${wanted.map((w) => w.category).join(" + ")}`);
}

await client.close();
console.log(
  dry
    ? `\nDry run over ${files.length} files — nothing uploaded or listed.`
    : `\n${summary.uploaded} uploaded, ${summary.created} listings created, ${summary.skipped} skipped, ${summary.failed} failed.`
);
