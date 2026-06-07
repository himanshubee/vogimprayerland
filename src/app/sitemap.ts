import type { MetadataRoute } from "next";
import { getAllPublishedSlugs } from "@/lib/posts";

export const revalidate = 3600;

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.vogimprayerland.org"
).replace(/\/$/, "");

// Static routes that live outside the database.
const STATIC_PATHS = [
  "",
  "about",
  "online-deliverance",
  "marital-settlement",
  "dream-interpretation",
  "healing-request",
  "prayer-request",
  "deliverance-request",
  "blog",
  "zoom",
  "media",
  "gallery",
  "give",
  "partnership",
  "contact",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: `${SITE_URL}/${p ? `${p}/` : ""}`,
    lastModified: now,
    changeFrequency: p === "" || p === "blog" ? "daily" : "monthly",
    priority: p === "" ? 1 : 0.7,
  }));

  let postEntries: MetadataRoute.Sitemap = [];
  try {
    const slugs = await getAllPublishedSlugs();
    postEntries = slugs.map((s) => ({
      url: `${SITE_URL}/${s.slug}/`,
      lastModified: new Date(s.modified),
      changeFrequency: "weekly",
      priority: s.type === "page" ? 0.6 : 0.8,
    }));
  } catch {
    // DB unreachable at build time — ship the static sitemap only.
  }

  return [...staticEntries, ...postEntries];
}
