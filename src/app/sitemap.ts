import type { MetadataRoute } from "next";
import { getAllPublishedSlugs } from "@/lib/posts";
import { PAGE_SCHEMAS, getPageModifiedMap } from "@/lib/page-content";

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

  // Map each static path to its CMS page key (if any) so the sitemap reflects
  // the real last-edited time of editable marketing pages.
  const pathToKey = new Map(
    PAGE_SCHEMAS.map((s) => [s.path === "/" ? "" : s.path.replace(/^\//, ""), s.key])
  );
  const modifiedMap = await getPageModifiedMap();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => {
    const key = pathToKey.get(p);
    const mod = key && modifiedMap[key] ? new Date(modifiedMap[key]) : now;
    return {
      url: `${SITE_URL}/${p ? `${p}/` : ""}`,
      lastModified: mod,
      changeFrequency: p === "" || p === "blog" ? "daily" : "monthly",
      priority: p === "" ? 1 : 0.7,
    };
  });

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
