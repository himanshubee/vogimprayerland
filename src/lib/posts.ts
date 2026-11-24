import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { EMPTY_SEO, type PostSeo } from "@/lib/seo-analysis";
import { getReplacedPost, getRestoredPost, listRewrittenPosts } from "@/lib/restored-posts";
import { cleanPostContent } from "@/lib/clean-content";
import { REDIRECTED_SLUGS } from "@/lib/legacy-redirects";

export type { PostSeo } from "@/lib/seo-analysis";
export { EMPTY_SEO } from "@/lib/seo-analysis";

export type PostStatus = "publish" | "draft";
export type PostType = "post" | "page";

export type Post = {
  id: string;
  wpId: number | null;
  type: PostType;
  slug: string;
  title: string;
  content: string; // HTML
  excerpt: string;
  status: PostStatus;
  categories: string[];
  featuredImage: string | null;
  seo: PostSeo;
  date: string; // ISO
  modified: string; // ISO
};

const COLLECTION = "posts";

type PostDoc = {
  _id: ObjectId;
  wpId?: number | null;
  type?: PostType;
  slug: string;
  title?: string;
  content?: string;
  excerpt?: string;
  status?: PostStatus;
  categories?: string[];
  featuredImage?: string | null;
  seo?: Partial<PostSeo>;
  date?: Date | string;
  modified?: Date | string;
};

const publicCopy = (value: string) => value.replace(/Prophet Olaofe Emmanuel/g, "Prophet Olaofe Oladele");

function serializeSeo(s?: Partial<PostSeo>): PostSeo {
  const seo = { ...EMPTY_SEO, ...(s ?? {}) };
  return {
    ...seo,
    title: publicCopy(seo.title),
    description: publicCopy(seo.description),
    ogTitle: publicCopy(seo.ogTitle),
    ogDescription: publicCopy(seo.ogDescription),
  };
}

/** Normalize an incoming SEO payload into a complete, typed object. */
function cleanSeo(s?: Partial<PostSeo> | null): PostSeo {
  if (!s) return { ...EMPTY_SEO };
  const str = (v: unknown, max = 300) =>
    String(v ?? "").slice(0, max).trim();
  return {
    focusKeyword: str(s.focusKeyword, 120),
    keywords: str(s.keywords, 300),
    title: str(s.title, 160),
    description: str(s.description, 320),
    canonical: str(s.canonical, 500),
    noindex: Boolean(s.noindex),
    nofollow: Boolean(s.nofollow),
    ogTitle: str(s.ogTitle, 160),
    ogDescription: str(s.ogDescription, 320),
    ogImage: s.ogImage ? str(s.ogImage, 500) : null,
    score: Math.max(0, Math.min(100, Math.round(Number(s.score) || 0))),
  };
}

function toISO(v: Date | string | undefined): string {
  if (!v) return new Date(0).toISOString();
  return (v instanceof Date ? v : new Date(v)).toISOString();
}

function serialize(d: PostDoc): Post {
  return {
    id: String(d._id),
    wpId: d.wpId ?? null,
    type: d.type ?? "post",
    slug: d.slug,
    title: publicCopy(d.title ?? "(untitled)"),
    content: cleanPostContent(publicCopy(d.content ?? "")),
    excerpt: publicCopy(d.excerpt ?? ""),
    status: d.status ?? "draft",
    categories: d.categories ?? [],
    featuredImage: d.featuredImage ?? null,
    seo: serializeSeo(d.seo),
    date: toISO(d.date),
    modified: toISO(d.modified),
  };
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/**
 * Public: a single published post/page by slug. Falls back to the articles
 * rewritten in code after the WordPress import lost them.
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const replaced = getReplacedPost(slug);
  if (replaced) return replaced;
  try {
    const db = await getDb();
    const doc = await db
      .collection<PostDoc>(COLLECTION)
      .findOne({ slug, status: "publish" });
    if (doc) return serialize(doc);
  } catch {
    // fall through to the restored copy
  }
  return getRestoredPost(slug);
}

/** Public: published posts, newest first, with optional pagination. */
export async function getPublishedPosts(opts?: {
  type?: PostType;
  limit?: number;
  skip?: number;
  category?: string;
}): Promise<Post[]> {
  const db = await getDb();
  // Posts whose URL now 301s elsewhere must not be listed: a listing link to
  // a redirect wastes the crawl and shows readers a page they never reach.
  const query: Record<string, unknown> = { status: "publish", slug: { $nin: [...REDIRECTED_SLUGS] } };
  query.type = opts?.type ?? "post";
  if (opts?.category) query.categories = opts.category;

  const docs = await db
    .collection<PostDoc>(COLLECTION)
    .find(query)
    .sort({ date: -1 })
    .skip(opts?.skip ?? 0)
    .limit(opts?.limit ?? 24)
    .toArray();
  return docs.map(serialize);
}

export async function countPublishedPosts(type: PostType = "post"): Promise<number> {
  const db = await getDb();
  return db
    .collection(COLLECTION)
    .countDocuments({ status: "publish", type, slug: { $nin: [...REDIRECTED_SLUGS] } });
}

/** All published slugs with last-modified (for sitemap / static params). */
export async function getAllPublishedSlugs(): Promise<
  { slug: string; type: PostType; modified: string }[]
> {
  const db = await getDb();
  const docs = await db
    .collection<PostDoc>(COLLECTION)
    .find(
      { status: "publish" },
      { projection: { slug: 1, type: 1, modified: 1, date: 1 } }
    )
    .toArray();
  return docs.map((d) => ({
    slug: d.slug,
    type: d.type ?? "post",
    modified: toISO(d.modified ?? d.date),
  }));
}

export type RelatedPost = Pick<Post, "slug" | "title" | "featuredImage" | "excerpt">;

// Words that say nothing about what an article is about.
const STOP = new Set(
  "a an and are at be by for from how in is it its of on or the to what when why with you your my me i we our this that do does can who prayer prayers points point powerful bible verse verses meaning 2025 2026 vs".split(" ")
);
export const subjectTerms = (s: string) =>
  new Set(s.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/[\s-]+/).filter((w) => w.length > 2 && !STOP.has(w)));

/** Every published article that can be linked to: database rows plus the rewrites. */
async function listLinkablePosts(): Promise<RelatedPost[]> {
  let candidates: RelatedPost[] = [];
  try {
    const db = await getDb();
    const docs = await db
      .collection<PostDoc>(COLLECTION)
      .find(
        { status: "publish", type: "post", slug: { $nin: [...REDIRECTED_SLUGS] } },
        { projection: { slug: 1, title: 1, featuredImage: 1, excerpt: 1 } }
      )
      .toArray();
    candidates = docs.map((d) => ({
      slug: d.slug,
      title: publicCopy(d.title ?? ""),
      featuredImage: d.featuredImage ?? null,
      excerpt: publicCopy(d.excerpt ?? ""),
    }));
  } catch {
    // Database unreachable: fall back to the rewritten articles alone.
  }
  for (const r of listRewrittenPosts()) {
    if (!candidates.some((c) => c.slug === r.slug)) candidates.push(r);
  }
  return candidates;
}

export type SimilarPost = RelatedPost & {
  /** Ranking score: shared words, damped for long titles. */
  score: number;
  /** Share of the query's subject words this article's title and slug contain (0-1). */
  coverage: number;
};

/**
 * Published articles on the same subject as `text`, most similar first,
 * judged by shared title and slug words. Used for the related-articles block,
 * for choosing internal links, and for refusing to write an article the site
 * already has.
 */
export async function findSimilarPosts(
  text: string,
  opts: { exclude?: string[]; limit?: number } = {}
): Promise<SimilarPost[]> {
  const exclude = new Set(opts.exclude ?? []);
  const mine = subjectTerms(text);
  if (mine.size === 0) return [];
  return (await listLinkablePosts())
    .filter((c) => !exclude.has(c.slug))
    .map((c) => {
      const theirs = subjectTerms(`${c.title} ${c.slug}`);
      let shared = 0;
      for (const w of theirs) if (mine.has(w)) shared++;
      return { ...c, score: shared / Math.sqrt(theirs.size || 1), coverage: shared / mine.size };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug))
    .slice(0, opts.limit ?? 10);
}

/**
 * Up to `limit` articles on the same subject, for the "Related articles"
 * block. Most posts were imported with no category and no internal links;
 * this gives every article crawlable links to its neighbours.
 */
export async function getRelatedPosts(post: Pick<Post, "slug" | "title">, limit = 4): Promise<RelatedPost[]> {
  const similar = await findSimilarPosts(`${post.title} ${post.slug}`, { exclude: [post.slug], limit });
  return similar.map(({ slug, title, featuredImage, excerpt }) => ({ slug, title, featuredImage, excerpt }));
}

export async function getDistinctCategories(): Promise<string[]> {
  const db = await getDb();
  const cats = await db
    .collection(COLLECTION)
    .distinct("categories", { status: "publish" });
  return (cats as string[]).filter(Boolean).sort();
}

/* ---------------- Admin ---------------- */

export async function getAllPostsAdmin(): Promise<Post[]> {
  const db = await getDb();
  const docs = await db
    .collection<PostDoc>(COLLECTION)
    .find({})
    .sort({ date: -1 })
    .limit(1000)
    .toArray();
  return docs.map(serialize);
}

export async function getPostById(id: string): Promise<Post | null> {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const doc = await db
    .collection<PostDoc>(COLLECTION)
    .findOne({ _id: new ObjectId(id) });
  return doc ? serialize(doc) : null;
}

export type PostInput = {
  type?: PostType;
  slug?: string;
  title: string;
  content?: string;
  excerpt?: string;
  status?: PostStatus;
  categories?: string[];
  featuredImage?: string | null;
  seo?: Partial<PostSeo> | null;
  date?: string;
};

/** Ensure slug is unique (append -2, -3, … if taken). */
async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const db = await getDb();
  const coll = db.collection<PostDoc>(COLLECTION);
  let slug = base || "post";
  let n = 1;
  for (;;) {
    const existing = await coll.findOne({ slug });
    if (!existing || (excludeId && String(existing._id) === excludeId)) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

export async function createPost(input: PostInput): Promise<Post> {
  const db = await getDb();
  const now = new Date();
  const base = slugify(input.slug || input.title);
  const slug = await uniqueSlug(base);

  const doc = {
    wpId: null,
    type: input.type ?? "post",
    slug,
    title: input.title.trim() || "(untitled)",
    content: input.content ?? "",
    excerpt: input.excerpt ?? "",
    status: input.status ?? "draft",
    categories: input.categories ?? [],
    featuredImage: input.featuredImage ?? null,
    seo: cleanSeo(input.seo),
    date: input.date ? new Date(input.date) : now,
    modified: now,
  };
  const res = await db.collection(COLLECTION).insertOne(doc);
  return serialize({ _id: res.insertedId, ...doc });
}

export async function updatePost(
  id: string,
  input: PostInput
): Promise<Post | null> {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const base = slugify(input.slug || input.title);
  const slug = await uniqueSlug(base, id);

  const update = {
    type: input.type ?? "post",
    slug,
    title: input.title.trim() || "(untitled)",
    content: input.content ?? "",
    excerpt: input.excerpt ?? "",
    status: input.status ?? "draft",
    categories: input.categories ?? [],
    featuredImage: input.featuredImage ?? null,
    seo: cleanSeo(input.seo),
    ...(input.date ? { date: new Date(input.date) } : {}),
    modified: new Date(),
  };
  await db
    .collection(COLLECTION)
    .updateOne({ _id: new ObjectId(id) }, { $set: update });
  return getPostById(id);
}

export async function deletePost(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const db = await getDb();
  const res = await db
    .collection(COLLECTION)
    .deleteOne({ _id: new ObjectId(id) });
  return res.deletedCount === 1;
}
