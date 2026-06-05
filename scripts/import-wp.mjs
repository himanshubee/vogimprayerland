/**
 * One-shot importer: pulls all posts, pages, categories and images from the
 * old WordPress site into MongoDB, downloading images locally and rewriting
 * their URLs so the new site is self-contained.
 *
 * Run:  node scripts/import-wp.mjs
 */
import { MongoClient } from "mongodb";
import { readFileSync, mkdirSync, existsSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ---- load env (.env.local preferred, then .env.production) ----
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

const WP = "https://www.vogimprayerland.org/wp-json/wp/v2";
const URI = process.env.MONGODB_URI;
const DB = process.env.MONGODB_DB || "vogim";
const PUBLIC_DIR = join(ROOT, "public");
const IMG_SUBDIR = "images/wp";

if (!URI) {
  console.error("Missing MONGODB_URI in .env.local");
  process.exit(1);
}

const decode = (s = "") =>
  s
    .replace(/&#8217;|&#039;|&#39;/g, "’")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8230;/g, "…")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const stripTags = (s = "") => decode(s.replace(/<[^>]+>/g, "")).trim();

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": "vogim-import" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

// fetch every page of a WP collection
async function getAll(path, fields) {
  const out = [];
  let page = 1;
  for (;;) {
    const url = `${WP}/${path}?per_page=100&page=${page}${
      fields ? `&_fields=${fields}` : ""
    }`;
    const res = await fetch(url, { headers: { "User-Agent": "vogim-import" } });
    if (res.status === 400) break; // past last page
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    const batch = await res.json();
    if (!batch.length) break;
    out.push(...batch);
    const total = Number(res.headers.get("x-wp-totalpages") || "1");
    process.stdout.write(`\r  ${path}: page ${page}/${total} (${out.length})   `);
    if (page >= total) break;
    page += 1;
  }
  process.stdout.write("\n");
  return out;
}

// ---- image handling ----
const IMG_RE =
  /https?:\/\/(?:www\.)?vogimprayerland\.org\/wp-content\/uploads\/([^"')\s]+\.(?:png|jpe?g|gif|webp|svg))/gi;
const downloaded = new Map(); // remoteUrl -> localPath
let imgOk = 0;
let imgFail = 0;

async function downloadImage(remoteUrl, relPath) {
  if (downloaded.has(remoteUrl)) return downloaded.get(remoteUrl);
  const local = `/${IMG_SUBDIR}/${relPath}`;
  const dest = join(PUBLIC_DIR, IMG_SUBDIR, relPath);
  if (existsSync(dest)) {
    downloaded.set(remoteUrl, local);
    imgOk += 1;
    return local;
  }
  try {
    const res = await fetch(remoteUrl, { headers: { "User-Agent": "vogim-import" } });
    if (!res.ok) throw new Error(String(res.status));
    const buf = Buffer.from(await res.arrayBuffer());
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, buf);
    downloaded.set(remoteUrl, local);
    imgOk += 1;
    return local;
  } catch (e) {
    imgFail += 1;
    return null; // leave original URL as fallback
  }
}

// strip srcset/sizes (avoid pulling dozens of resized variants), then
// download every uploads image referenced and rewrite its src to local.
async function processContent(html) {
  let out = (html || "")
    .replace(/\s+srcset="[^"]*"/gi, "")
    .replace(/\s+sizes="[^"]*"/gi, "");

  const urls = new Set();
  let m;
  IMG_RE.lastIndex = 0;
  while ((m = IMG_RE.exec(out))) urls.add(m[0]);

  for (const remote of urls) {
    const rel = remote.match(/\/wp-content\/uploads\/(.+)$/)[1];
    const local = await downloadImage(remote, rel);
    if (local) out = out.split(remote).join(local);
  }
  return out;
}

async function main() {
  console.log("→ Connecting to MongoDB…");
  const client = await new MongoClient(URI).connect();
  const coll = client.db(DB).collection("posts");
  await coll.createIndex({ slug: 1 }, { unique: true });
  await coll.createIndex({ wpId: 1 });
  await coll.createIndex({ status: 1, type: 1, date: -1 });

  console.log("→ Fetching categories…");
  const cats = await getAll("categories", "id,name");
  const catMap = new Map(cats.map((c) => [c.id, decode(c.name)]));

  let total = 0;
  for (const type of ["posts", "pages"]) {
    console.log(`→ Fetching ${type}…`);
    const items = await getAll(
      type,
      "id,date,modified,slug,status,type,title,excerpt,content,categories,featured_media"
    );
    console.log(`→ Importing ${items.length} ${type} (downloading images)…`);

    let i = 0;
    for (const it of items) {
      i += 1;
      const content = await processContent(it.content?.rendered || "");

      // featured image
      let featuredImage = null;
      if (it.featured_media) {
        try {
          const media = await getJson(
            `${WP}/media/${it.featured_media}?_fields=source_url`
          );
          if (media?.source_url) {
            const mm = media.source_url.match(/\/wp-content\/uploads\/(.+)$/);
            if (mm) featuredImage = await downloadImage(media.source_url, mm[1]);
          }
        } catch {
          /* ignore */
        }
      }

      const doc = {
        wpId: it.id,
        type: it.type === "page" ? "page" : "post",
        slug: it.slug,
        title: stripTags(it.title?.rendered || "") || "(untitled)",
        content,
        excerpt: stripTags(it.excerpt?.rendered || "").slice(0, 500),
        status: it.status === "publish" ? "publish" : "draft",
        categories: (it.categories || [])
          .map((id) => catMap.get(id))
          .filter(Boolean),
        featuredImage,
        date: new Date(it.date),
        modified: new Date(it.modified || it.date),
      };

      await coll.updateOne(
        { wpId: doc.wpId },
        { $set: doc },
        { upsert: true }
      );
      total += 1;
      process.stdout.write(
        `\r  ${type}: ${i}/${items.length}  | images ok ${imgOk} fail ${imgFail}   `
      );
    }
    process.stdout.write("\n");
  }

  await client.close();
  console.log(
    `\n✓ Done. Imported ${total} items. Images downloaded: ${imgOk}, failed: ${imgFail}.`
  );
}

main().catch((e) => {
  console.error("\nImport failed:", e);
  process.exit(1);
});
