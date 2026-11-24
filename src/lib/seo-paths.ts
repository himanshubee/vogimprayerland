// No imports on purpose: tests load this file directly with Node.

/**
 * Paths robots.txt keeps every crawler out of. The sitemap reads the same
 * list, because a sitemap URL that robots.txt blocks is a Search Console
 * error ("Submitted URL blocked by robots.txt").
 */
export const ROBOTS_DISALLOW = ["/admin/", "/api/", "/checkout/", "/cart/", "/faq/search/", "/give/thank-you/", "/checkout/thank-you/"];

/**
 * Top-level routes built in code under src/app/(site)/. A post in the
 * database with one of these slugs never serves (the route wins), so the
 * sitemap must not list it: the WordPress import left posts called "cart",
 * "checkout" and "testimonies", and the sitemap was advertising noindex
 * pages through them. Whether the route itself is listed is decided by
 * STATIC_PATHS in sitemap.ts. A test fails if this list and the folders
 * disagree, so a new page cannot be forgotten here.
 */
export const HAND_BUILT_ROUTES = [
  "about", "accessibility", "author", "blog", "books", "cart", "checkout", "complaints", "contact",
  "cookie-policy", "deliverance-request", "dream-interpretation", "faq", "gallery", "give", "glossary",
  "healing", "healing-request", "how-requests-work", "leaders", "marital-settlement", "media", "notice",
  "online-deliverance", "outreach", "partnership", "prayer-request", "privacy-policy", "privacy-requests",
  "refund-policy", "safeguarding", "services", "store", "terms-and-conditions", "testimonies", "visit",
  "war-against-marine-kingdom", "what-we-believe", "where-gifts-go", "zoom",
];

/** Is this site path (e.g. "/cart/") blocked by robots.txt? */
export function robotsBlocked(path: string): boolean {
  const p = path.endsWith("/") ? path : `${path}/`;
  return ROBOTS_DISALLOW.some((d) => p.startsWith(d));
}
