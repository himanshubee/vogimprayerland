import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

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
  date?: Date | string;
  modified?: Date | string;
};

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
    title: d.title ?? "(untitled)",
    content: d.content ?? "",
    excerpt: d.excerpt ?? "",
    status: d.status ?? "draft",
    categories: d.categories ?? [],
    featuredImage: d.featuredImage ?? null,
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

/** Public: a single published post/page by slug. */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const db = await getDb();
  const doc = await db
    .collection<PostDoc>(COLLECTION)
    .findOne({ slug, status: "publish" });
  return doc ? serialize(doc) : null;
}

/** Public: published posts, newest first, with optional pagination. */
export async function getPublishedPosts(opts?: {
  type?: PostType;
  limit?: number;
  skip?: number;
  category?: string;
}): Promise<Post[]> {
  const db = await getDb();
  const query: Record<string, unknown> = { status: "publish" };
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
  return db.collection(COLLECTION).countDocuments({ status: "publish", type });
}

/** All published slugs (for generateStaticParams). */
export async function getAllPublishedSlugs(): Promise<
  { slug: string; type: PostType }[]
> {
  const db = await getDb();
  const docs = await db
    .collection<PostDoc>(COLLECTION)
    .find({ status: "publish" }, { projection: { slug: 1, type: 1 } })
    .toArray();
  return docs.map((d) => ({ slug: d.slug, type: d.type ?? "post" }));
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
  date?: string;
};

/** Ensure slug is unique (append -2, -3, … if taken). */
async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const db = await getDb();
  const coll = db.collection<PostDoc>(COLLECTION);
  let slug = base || "post";
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
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
