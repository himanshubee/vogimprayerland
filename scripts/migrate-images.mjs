/**
 * Image migration to the S3-backed CDN (img.vogimprayerland.org).
 *
 * Steps (run in order):
 *   node scripts/migrate-images.mjs upload       # upload local + external images -> manifest
 *   node scripts/migrate-images.mjs rewrite-code # rewrite /images/... in src/*.tsx
 *   node scripts/migrate-images.mjs rewrite-db   # backup + rewrite URLs in MongoDB
 *
 * The upload step is resumable: a manifest (scripts/image-manifest.json) maps every
 * source path/URL to its CDN URL, and already-uploaded entries are skipped on re-run.
 * Per project decision, references point at the smaller auto-generated WebP variant.
 */
import { MongoClient } from "mongodb";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
  statSync,
} from "fs";
import { dirname, join, relative, extname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PUBLIC_DIR = join(ROOT, "public");
const IMAGES_DIR = join(PUBLIC_DIR, "images");
const MANIFEST = join(__dirname, "image-manifest.json");
const SRC_DIR = join(ROOT, "src");

// ---- env ----
function loadEnv() {
  for (const f of [".env.local", ".env.production"]) {
    const p = join(ROOT, f);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  }
}
loadEnv();

const UPLOAD_URL =
  process.env.S3_UPLOAD_URL || "https://s3upload.vogimprayerland.org/upload";
const API_KEY = process.env.S3_UPLOAD_KEY;
const URI = process.env.MONGODB_URI;
const DB = process.env.MONGODB_DB || "vogim";

const CONTENT_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

// ---- manifest ----
function loadManifest() {
  if (existsSync(MANIFEST)) return JSON.parse(readFileSync(MANIFEST, "utf8"));
  return { local: {}, external: {} };
}
function saveManifest(m) {
  writeFileSync(MANIFEST, JSON.stringify(m, null, 2));
}

// ---- upload one buffer ----
async function uploadBuffer(buf, filename) {
  const ext = extname(filename).toLowerCase();
  const type = CONTENT_TYPES[ext] || "application/octet-stream";
  const fd = new FormData();
  fd.append("file", new Blob([buf], { type }), filename);
  const res = await fetch(UPLOAD_URL, {
    method: "POST",
    headers: { "x-api-key": API_KEY },
    body: fd,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text.slice(0, 200)}`);
  const json = JSON.parse(text);
  // Prefer the auto-generated WebP variant; fall back to the original-format URL.
  const url = json.webpUrl || json.publicUrl;
  if (!url) throw new Error(`no url in response: ${text.slice(0, 200)}`);
  return {
    url,
    publicUrl: json.publicUrl,
    webpUrl: json.webpUrl || null,
    key: json.key,
    webpKey: json.webpKey || null,
  };
}

// simple concurrency pool
async function pool(items, size, worker) {
  let i = 0;
  let done = 0;
  const total = items.length;
  const runners = Array.from({ length: Math.min(size, total) }, async () => {
    while (i < total) {
      const idx = i++;
      await worker(items[idx], idx);
      done++;
      process.stdout.write(`\r  ${done}/${total}   `);
    }
  });
  await Promise.all(runners);
  process.stdout.write("\n");
}

// recursively list files
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

// ---- collect external (old-WordPress) image URLs from the DB ----
async function collectExternalUrls() {
  const client = await new MongoClient(URI).connect();
  const coll = client.db(DB).collection("posts");
  const docs = await coll
    .find({}, { projection: { content: 1, featuredImage: 1 } })
    .toArray();
  await client.close();
  const urls = new Set();
  const re =
    /https?:\/\/(?:www\.)?vogimprayerland\.org\/wp-content\/uploads\/[^"'\s)]+\.(?:png|jpe?g|gif|webp|svg)/gi;
  for (const d of docs) {
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(d.content || ""))) urls.add(m[0]);
    if (d.featuredImage && re.test(d.featuredImage)) {
      re.lastIndex = 0;
      let mm;
      while ((mm = re.exec(d.featuredImage))) urls.add(mm[0]);
    }
  }
  return [...urls];
}

async function cmdUpload() {
  if (!API_KEY) throw new Error("Missing S3_UPLOAD_KEY in env");
  const manifest = loadManifest();
  let saveCounter = 0;
  const checkpoint = () => {
    if (++saveCounter % 10 === 0) saveManifest(manifest);
  };

  // 1) local files under public/images
  const localFiles = walk(IMAGES_DIR);
  const pending = localFiles.filter((p) => {
    const rel = "/" + relative(PUBLIC_DIR, p).split("\\").join("/");
    return !manifest.local[rel];
  });
  console.log(
    `Local images: ${localFiles.length} total, ${pending.length} to upload, ${
      localFiles.length - pending.length
    } already done.`
  );
  let localFail = 0;
  await pool(pending, 6, async (p) => {
    const rel = "/" + relative(PUBLIC_DIR, p).split("\\").join("/");
    try {
      const buf = readFileSync(p);
      const r = await uploadBuffer(buf, basename(p));
      manifest.local[rel] = r;
      checkpoint();
    } catch (e) {
      localFail++;
      console.error(`\n  FAIL ${rel}: ${e.message}`);
    }
  });
  saveManifest(manifest);

  // 2) external old-WordPress images referenced in the DB
  let external = [];
  try {
    external = await collectExternalUrls();
  } catch (e) {
    console.error(`\n  Could not read DB for external URLs: ${e.message}`);
  }
  const extPending = external.filter((u) => !manifest.external[u]);
  console.log(
    `External (old WP) images: ${external.length} found, ${extPending.length} to upload.`
  );
  let extFail = 0;
  await pool(extPending, 6, async (u) => {
    try {
      const res = await fetch(u, { headers: { "User-Agent": "vogim-migrate" } });
      if (!res.ok) throw new Error(String(res.status));
      const buf = Buffer.from(await res.arrayBuffer());
      const name = basename(new URL(u).pathname);
      const r = await uploadBuffer(buf, name);
      manifest.external[u] = r;
      checkpoint();
    } catch (e) {
      extFail++;
      console.error(`\n  FAIL ${u}: ${e.message}`);
    }
  });
  saveManifest(manifest);

  console.log(
    `\n✓ Upload done. local ok ${
      Object.keys(manifest.local).length
    } (fail ${localFail}), external ok ${
      Object.keys(manifest.external).length
    } (fail ${extFail}).`
  );
  console.log(`  Manifest: ${MANIFEST}`);
}

// ---- rewrite source code ----
function srcFiles() {
  return walk(SRC_DIR).filter((p) => /\.(tsx?|jsx?|css)$/.test(p));
}

function cmdRewriteCode() {
  const manifest = loadManifest();
  const map = manifest.local;
  // Longest paths first so nested paths replace before any prefix collisions.
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  if (!keys.length) throw new Error("Manifest empty — run `upload` first.");

  let filesChanged = 0;
  let replacements = 0;
  const missing = new Set();
  const routePath = join(SRC_DIR, "app", "api", "upload", "route.ts");

  for (const file of srcFiles()) {
    if (file === routePath) continue; // route handled separately
    let txt = readFileSync(file, "utf8");
    const orig = txt;
    // Find every /images/... token and replace using the manifest.
    txt = txt.replace(/\/images\/[A-Za-z0-9._\-\/]+/g, (m) => {
      const hit = map[m];
      if (hit) {
        replacements++;
        return hit.url;
      }
      missing.add(m);
      return m;
    });
    if (txt !== orig) {
      writeFileSync(file, txt);
      filesChanged++;
      console.log(`  updated ${relative(ROOT, file)}`);
    }
  }
  console.log(`\n✓ Code rewrite: ${replacements} refs in ${filesChanged} files.`);
  if (missing.size) {
    console.log(`  ⚠ ${missing.size} /images/ refs had no manifest entry:`);
    [...missing].forEach((m) => console.log(`    ${m}`));
  }
}

// ---- rewrite MongoDB ----
async function cmdRewriteDb() {
  const manifest = loadManifest();
  const localKeys = Object.keys(manifest.local).sort(
    (a, b) => b.length - a.length
  );
  const extKeys = Object.keys(manifest.external).sort(
    (a, b) => b.length - a.length
  );
  if (!localKeys.length) throw new Error("Manifest empty — run `upload` first.");

  const client = await new MongoClient(URI).connect();
  const coll = client.db(DB).collection("posts");
  const docs = await coll.find({}).toArray();

  // backup originals
  const backup = docs.map((d) => ({
    _id: String(d._id),
    slug: d.slug,
    content: d.content ?? "",
    featuredImage: d.featuredImage ?? null,
  }));
  const backupPath = join(__dirname, `image-rewrite-backup-${docs.length}.json`);
  writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(`Backed up ${docs.length} docs -> ${relative(ROOT, backupPath)}`);

  function rewrite(str) {
    if (!str) return { out: str, n: 0 };
    let out = str;
    let n = 0;
    // external absolute URLs first (longest match), then local /images/ paths
    for (const k of extKeys) {
      if (out.includes(k)) {
        const url = manifest.external[k].url;
        const parts = out.split(k);
        n += parts.length - 1;
        out = parts.join(url);
      }
    }
    for (const k of localKeys) {
      if (out.includes(k)) {
        const url = manifest.local[k].url;
        const parts = out.split(k);
        n += parts.length - 1;
        out = parts.join(url);
      }
    }
    return { out, n };
  }

  let changed = 0;
  let totalRefs = 0;
  for (const d of docs) {
    const c = rewrite(d.content ?? "");
    const f = rewrite(d.featuredImage ?? "");
    if (c.n || f.n) {
      await coll.updateOne(
        { _id: d._id },
        { $set: { content: c.out, featuredImage: f.out || d.featuredImage } }
      );
      changed++;
      totalRefs += c.n + f.n;
    }
  }
  await client.close();
  console.log(`\n✓ DB rewrite: ${totalRefs} refs across ${changed} docs.`);
}

const cmd = process.argv[2];
const run = {
  upload: cmdUpload,
  "rewrite-code": async () => cmdRewriteCode(),
  "rewrite-db": cmdRewriteDb,
}[cmd];

if (!run) {
  console.error(
    "Usage: node scripts/migrate-images.mjs <upload|rewrite-code|rewrite-db>"
  );
  process.exit(1);
}
run().catch((e) => {
  console.error("\nFailed:", e);
  process.exit(1);
});
