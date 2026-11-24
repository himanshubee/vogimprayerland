import type { Post } from "@/lib/posts";
import { EMPTY_SEO } from "@/lib/seo-analysis";
import * as powerOfDarkness from "./power-of-darkness";
import * as spiritualHusband from "./spiritual-husband";
import * as spiritSpouse from "./spirit-spouse";

/**
 * Articles rewritten in code, served at their original URLs.
 *
 * Two kinds:
 *
 * - RESTORED: ranked on the old WordPress site, were lost in the June 2026
 *   import, and have no row in MongoDB. Served only as a fallback: if a
 *   published post with the same slug is created in the admin, the database
 *   copy wins.
 * - REPLACED: a thin or damaged imported post that still has a database row.
 *   The rewrite here takes precedence, so edits to that row in the admin do
 *   not show. To hand one back to the CMS, paste this content into the post in
 *   the admin and delete the entry here.
 */
type Source = {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  date?: string;
};

const REWRITTEN_ON = "2026-11-24T00:00:00.000Z";

const toPost = (s: Source, categories: string[]): Post => ({
  id: `restored:${s.slug}`,
  wpId: null,
  type: "post",
  slug: s.slug,
  title: s.title,
  content: s.content.trim(),
  excerpt: s.excerpt,
  status: "publish",
  categories,
  featuredImage: s.featuredImage ?? null,
  seo: { ...EMPTY_SEO, title: s.seoTitle, description: s.description },
  date: s.date ?? REWRITTEN_ON,
  modified: REWRITTEN_ON,
});

const RESTORED: Post[] = [
  toPost(powerOfDarkness, ["Deliverance"]),
  toPost(spiritualHusband, ["Deliverance"]),
];

const REPLACED: Post[] = [toPost(spiritSpouse, ["Deliverance"])];

/** Restored articles have no database row, so the sitemap lists them itself. */
export const RESTORED_POSTS = RESTORED;

const RESTORED_BY_SLUG = new Map(RESTORED.map((p) => [p.slug, p]));
const REPLACED_BY_SLUG = new Map(REPLACED.map((p) => [p.slug, p]));

/** A rewrite that must be served instead of the database row. */
export function getReplacedPost(slug: string): Post | null {
  return REPLACED_BY_SLUG.get(slug) ?? null;
}

/** A rewrite served only when the database has nothing at this slug. */
export function getRestoredPost(slug: string): Post | null {
  return RESTORED_BY_SLUG.get(slug) ?? null;
}

/** Every rewritten article, for related-article suggestions. */
export function listRewrittenPosts(): Post[] {
  return [...RESTORED, ...REPLACED];
}
