import type { MetadataRoute } from "next";
import { getAllPublishedSlugs } from "@/lib/posts";
import { listPublishedBooks } from "@/lib/books";
import { PAGE_SCHEMAS, getPageModifiedMap } from "@/lib/page-content";
import { LEGAL_DOCS } from "@/lib/legal";

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
  "books",
  "war-against-marine-kingdom",
  "zoom",
  "media",
  "gallery",
  "give",
  "partnership",
  "contact",
  ...LEGAL_DOCS.map((d) => d.slug),
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Map each static path to its CMS page key (if any) so the sitemap reflects
  // the real last-edited time of editable marketing pages.
  const pathToKey = new Map(
    PAGE_SCHEMAS.map((s) => [s.path === "/" ? "" : s.path.replace(/^\//, ""), s.key])
  );
  const modifiedMap = await getPageModifiedMap();

  const legalPaths = new Set(LEGAL_DOCS.map((d) => d.slug));

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => {
    const key = pathToKey.get(p);
    const mod = key && modifiedMap[key] ? new Date(modifiedMap[key]) : undefined;
    const isLegal = legalPaths.has(p);
    return {
      url: `${SITE_URL}/${p ? `${p}/` : ""}`,
      // Only claim a date we actually know. Stamping every static page with
      // "now" on each deploy is a lie Google learns to ignore, and it takes
      // the real dates on the articles down with it.
      lastModified: mod,
      changeFrequency: isLegal
        ? "yearly"
        : p === "" || p === "blog"
          ? "daily"
          : "monthly",
      priority: p === "" ? 1 : isLegal ? 0.3 : 0.7,
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

  // Book pages. listPublishedBooks swallows its own errors and returns [], so
  // an unreachable DB costs the shop entries but never the whole sitemap.
  const bookEntries: MetadataRoute.Sitemap = (await listPublishedBooks()).map((b) => ({
    url: `${SITE_URL}/books/${b.slug}/`,
    lastModified: new Date(b.updatedAt),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Several WordPress "pages" were imported as posts under slugs that are also
  // hand-built routes here — /prayer-request/, /gallery/, /blog/ and friends.
  // The hand-built route is what actually serves, so the post row is a second
  // copy of a URL already listed. First entry wins.
  const seen = new Set<string>();
  return [...staticEntries, ...postEntries, ...bookEntries].filter((e) => {
    if (seen.has(e.url)) return false;
    seen.add(e.url);
    return true;
  });
}
