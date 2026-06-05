/**
 * Rank Math–style on-page SEO content analysis.
 *
 * Pure, dependency-free, and isomorphic (uses regex, not the DOM) so it can run
 * in the editor (client) and, if ever needed, on the server. Given a focus
 * keyword + the post's title/description/slug/content it returns a 0–100 score
 * and a list of individual checks, mirroring the tests Rank Math runs.
 */

/**
 * Persisted per-post SEO settings. Defined here (a client-safe, DB-free module)
 * rather than in lib/posts.ts so the editor UI can import it without pulling
 * the MongoDB driver into the browser bundle.
 */
export type PostSeo = {
  focusKeyword: string;
  title: string; // SEO title override (falls back to post title)
  description: string; // meta description override (falls back to excerpt)
  canonical: string;
  noindex: boolean;
  nofollow: boolean;
  ogTitle: string;
  ogDescription: string;
  ogImage: string | null;
  score: number; // last computed content score (0–100)
};

export const EMPTY_SEO: PostSeo = {
  focusKeyword: "",
  title: "",
  description: "",
  canonical: "",
  noindex: false,
  nofollow: false,
  ogTitle: "",
  ogDescription: "",
  ogImage: null,
  score: 0,
};

export type SeoStatus = "good" | "ok" | "bad";
export type SeoCategory = "basic" | "additional" | "title" | "readability";

export type SeoCheck = {
  id: string;
  label: string;
  status: SeoStatus;
  points: number; // earned
  max: number; // possible
  category: SeoCategory;
  hint: string;
};

export type SeoReport = {
  score: number; // 0–100
  rating: SeoStatus;
  checks: SeoCheck[];
  wordCount: number;
  keywordDensity: number; // percent
};

export type SeoInput = {
  focusKeyword: string;
  seoTitle: string; // effective <title> used for SEO
  metaDescription: string;
  slug: string;
  contentHtml: string;
  hasImage?: boolean; // featured image counts as an asset
};

/* ---------------- HTML helpers (regex-based, SSR-safe) ---------------- */

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getHeadings(html: string): string[] {
  const out: string[] = [];
  const re = /<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) out.push(stripHtml(m[1]));
  return out;
}

function getImageAlts(html: string): string[] {
  const out: string[] = [];
  const re = /<img\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const alt = /alt\s*=\s*["']([^"']*)["']/i.exec(m[0]);
    out.push(alt ? alt[1] : "");
  }
  return out;
}

function getLinks(html: string): { external: number; internal: number } {
  let external = 0;
  let internal = 0;
  const re = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const href = m[1].trim();
    if (/^https?:\/\//i.test(href)) external += 1;
    else if (href && !href.startsWith("#") && !href.startsWith("mailto:"))
      internal += 1;
  }
  return { external, internal };
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  const esc = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = haystack.match(new RegExp(esc, "gi"));
  return matches ? matches.length : 0;
}

const norm = (s: string) => s.toLowerCase().trim();

/* ---------------- The analysis ---------------- */

export function analyzeSeo(input: SeoInput): SeoReport {
  const kw = norm(input.focusKeyword);
  const hasKw = kw.length > 0;

  const titleText = norm(input.seoTitle);
  const descText = norm(input.metaDescription);
  const slugText = norm(input.slug);
  const plain = stripHtml(input.contentHtml);
  const plainLower = norm(plain);
  const words = plain ? plain.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const headings = getHeadings(input.contentHtml).map(norm);
  const alts = getImageAlts(input.contentHtml);
  const links = getLinks(input.contentHtml);

  const kwInContent = hasKw ? countOccurrences(plainLower, kw) : 0;
  const keywordDensity =
    hasKw && wordCount > 0 ? (kwInContent / wordCount) * 100 : 0;

  // First 10% of the content (min 100 chars) — for "keyword near the start".
  const introLen = Math.max(100, Math.floor(plainLower.length * 0.1));
  const intro = plainLower.slice(0, introLen);

  const checks: SeoCheck[] = [];
  const add = (
    id: string,
    label: string,
    category: SeoCategory,
    ok: boolean,
    max: number,
    hint: string,
    partial = false
  ) =>
    checks.push({
      id,
      label,
      category,
      max,
      points: ok ? max : partial ? Math.round(max / 2) : 0,
      status: ok ? "good" : partial ? "ok" : "bad",
      hint,
    });

  /* ---- Basic SEO ---- */
  add(
    "kw-title",
    "Focus keyword appears in the SEO title",
    "basic",
    hasKw && titleText.includes(kw),
    8,
    "Use your focus keyword in the SEO title."
  );
  add(
    "kw-meta",
    "Focus keyword appears in the meta description",
    "basic",
    hasKw && descText.includes(kw),
    6,
    "Add your focus keyword to the meta description."
  );
  add(
    "kw-url",
    "Focus keyword appears in the URL (slug)",
    "basic",
    hasKw && slugText.replace(/-/g, " ").includes(kw),
    5,
    "Include the focus keyword in the post slug."
  );
  add(
    "kw-intro",
    "Focus keyword appears at the beginning of the content",
    "basic",
    hasKw && intro.includes(kw),
    6,
    "Mention the focus keyword within the first paragraph."
  );
  add(
    "kw-content",
    "Focus keyword appears in the content",
    "basic",
    hasKw && kwInContent > 0,
    6,
    "Use the focus keyword somewhere in the body."
  );
  {
    const good = wordCount >= 600;
    const okLen = wordCount >= 300 && wordCount < 600;
    add(
      "length",
      `Content is ${wordCount} words long`,
      "basic",
      good,
      8,
      "Aim for at least 600 words of content.",
      okLen
    );
  }

  /* ---- Additional ---- */
  add(
    "kw-subheading",
    "Focus keyword appears in a subheading (H2–H4)",
    "additional",
    hasKw && headings.some((h) => h.includes(kw)),
    4,
    "Add the focus keyword to at least one subheading."
  );
  add(
    "kw-image-alt",
    "An image has the focus keyword in its alt text",
    "additional",
    hasKw && alts.some((a) => norm(a).includes(kw)),
    4,
    "Add an image whose alt text contains the focus keyword."
  );
  {
    const good = keywordDensity >= 0.5 && keywordDensity <= 2.5;
    const okDen =
      (keywordDensity > 0 && keywordDensity < 0.5) ||
      (keywordDensity > 2.5 && keywordDensity <= 3.5);
    add(
      "density",
      `Keyword density is ${keywordDensity.toFixed(2)}%`,
      "additional",
      good,
      5,
      "Keep keyword density between 0.5% and 2.5%.",
      okDen
    );
  }
  add(
    "url-length",
    "URL is short and readable",
    "additional",
    slugText.length > 0 && slugText.length <= 75,
    3,
    "Keep the slug under 75 characters."
  );
  add(
    "links-external",
    "Content contains an external link",
    "additional",
    links.external > 0,
    3,
    "Link out to a relevant authoritative source."
  );
  add(
    "links-internal",
    "Content contains an internal link",
    "additional",
    links.internal > 0,
    3,
    "Link to another page on this site."
  );
  add(
    "assets",
    "Content contains an image or other media",
    "additional",
    Boolean(input.hasImage) || alts.length > 0,
    4,
    "Add at least one image to the post."
  );

  /* ---- Title readability ---- */
  add(
    "kw-title-start",
    "Focus keyword near the beginning of the SEO title",
    "title",
    hasKw && titleText.indexOf(kw) >= 0 && titleText.indexOf(kw) <= 40,
    4,
    "Move the focus keyword toward the start of the title."
  );
  {
    const len = input.seoTitle.trim().length;
    const good = len >= 15 && len <= 60;
    add(
      "title-length",
      `SEO title length is ${len} characters`,
      "title",
      good,
      4,
      "Keep the SEO title between 15 and 60 characters.",
      len > 0 && (len < 15 || (len > 60 && len <= 70))
    );
  }
  add(
    "title-number",
    "SEO title contains a number",
    "title",
    /\d/.test(input.seoTitle),
    2,
    "Numbers in titles (years, lists) often improve click-through."
  );

  /* ---- Content readability ---- */
  {
    const len = input.metaDescription.trim().length;
    const good = len >= 120 && len <= 160;
    add(
      "meta-length",
      `Meta description length is ${len} characters`,
      "readability",
      good,
      4,
      "Write a meta description between 120 and 160 characters.",
      len > 0 && (len < 120 || (len > 160 && len <= 180))
    );
  }
  add(
    "has-subheadings",
    "Content is broken up with subheadings",
    "readability",
    headings.length > 0,
    3,
    "Use H2/H3 subheadings to structure the content."
  );

  const earned = checks.reduce((s, c) => s + c.points, 0);
  const total = checks.reduce((s, c) => s + c.max, 0);
  const score = total > 0 ? Math.round((earned / total) * 100) : 0;
  const rating: SeoStatus = score >= 81 ? "good" : score >= 51 ? "ok" : "bad";

  return { score, rating, checks, wordCount, keywordDensity };
}

export const SEO_CATEGORY_LABELS: Record<SeoCategory, string> = {
  basic: "Basic SEO",
  additional: "Additional",
  title: "Title Readability",
  readability: "Content Readability",
};
