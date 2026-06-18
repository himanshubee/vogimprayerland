import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export type MediaItem = {
  id: string;
  title: string;
  caption: string;
  src: string;
  category: string;
  width: number;
  height: number;
  order: number;
};

const COLLECTION = "media";

type MediaDoc = {
  _id: ObjectId;
  title?: string;
  caption?: string;
  src?: string;
  category?: string;
  width?: number;
  height?: number;
  order?: number;
  createdAt?: Date;
};

/** Starter gallery — the images that were previously hardcoded. Used as a
 *  fallback when the media collection is empty so the public pages keep
 *  working, and as the seed for "Import starter images" in the admin. */
export const DEFAULT_MEDIA: Omit<MediaItem, "id">[] = [
  { title: "Prophetic Service", caption: "The Word goes forth, the altar burns.", src: "https://img.vogimprayerland.org/1780648526061-slider3.webp", category: "Services", width: 1920, height: 1000, order: 0 },
  { title: "Worship Night", caption: "Hearts lifted, heaven opened.", src: "https://img.vogimprayerland.org/1780648526009-slider2.webp", category: "Worship", width: 1920, height: 1000, order: 1 },
  { title: "Children at the Altar", caption: "The next generation, hands lifted high.", src: "https://img.vogimprayerland.org/1780648525318-slider1.jpg", category: "Services", width: 1920, height: 1000, order: 2 },
  { title: "Sunset Vigil", caption: "All-night prayer until the breakthrough.", src: "https://img.vogimprayerland.org/1780648526688-worship.jpg", category: "Worship", width: 1600, height: 970, order: 3 },
  { title: "Marital Settlement", caption: "Homes rebuilt by the power of God.", src: "https://img.vogimprayerland.org/1780648524880-marital-large.jpg", category: "Family", width: 1024, height: 606, order: 4 },
  { title: "Online Deliverance", caption: "Captives set free across nations.", src: "https://img.vogimprayerland.org/1780648546756-deliverance.webp", category: "Deliverance", width: 1024, height: 1024, order: 5 },
  { title: "Family Restored", caption: "What God has joined together.", src: "https://img.vogimprayerland.org/1780648527627-marital.webp", category: "Family", width: 768, height: 512, order: 6 },
  { title: "The Anointing Flows", caption: "Prophet Olaofe ministering by the Spirit.", src: "https://img.vogimprayerland.org/1780648525156-prophet.webp", category: "Services", width: 2400, height: 1658, order: 7 },
  { title: "Sunday Gathering", caption: "Where the saints come together.", src: "https://img.vogimprayerland.org/1780648525834-main-height.jpg", category: "Services", width: 1778, height: 1000, order: 8 },
];

const str = (v: unknown, max = 500) => String(v ?? "").slice(0, max).trim();
const num = (v: unknown, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback;
};

function serialize(d: MediaDoc, i: number): MediaItem {
  return {
    id: String(d._id),
    title: d.title ?? "",
    caption: d.caption ?? "",
    src: d.src ?? "",
    category: d.category ?? "Services",
    width: d.width ?? 1600,
    height: d.height ?? 1000,
    order: d.order ?? i,
  };
}

/** Public: gallery items, ordered. Falls back to the starter set when empty. */
export async function listMedia(): Promise<MediaItem[]> {
  try {
    const db = await getDb();
    const docs = await db
      .collection<MediaDoc>(COLLECTION)
      .find({})
      .sort({ order: 1, createdAt: 1 })
      .limit(500)
      .toArray();
    if (!docs.length) {
      return DEFAULT_MEDIA.map((m, i) => ({ ...m, id: `default-${i}` }));
    }
    return docs.map(serialize);
  } catch {
    return DEFAULT_MEDIA.map((m, i) => ({ ...m, id: `default-${i}` }));
  }
}

/** Admin: real DB rows only (no fallback) so we know when to offer seeding. */
export async function getMediaAdmin(): Promise<MediaItem[]> {
  const db = await getDb();
  const docs = await db
    .collection<MediaDoc>(COLLECTION)
    .find({})
    .sort({ order: 1, createdAt: 1 })
    .limit(500)
    .toArray();
  return docs.map(serialize);
}

export type MediaInput = {
  title?: string;
  caption?: string;
  src: string;
  category?: string;
  width?: number;
  height?: number;
};

export async function createMedia(input: MediaInput): Promise<MediaItem> {
  const db = await getDb();
  const count = await db.collection(COLLECTION).countDocuments();
  const doc = {
    _id: new ObjectId(),
    title: str(input.title, 160),
    caption: str(input.caption, 400),
    src: str(input.src, 600),
    category: str(input.category, 60) || "Services",
    width: num(input.width, 1600),
    height: num(input.height, 1000),
    order: count,
    createdAt: new Date(),
  };
  await db.collection(COLLECTION).insertOne(doc);
  return serialize(doc, count);
}

export async function updateMedia(
  id: string,
  input: Partial<MediaInput>
): Promise<MediaItem | null> {
  if (!ObjectId.isValid(id)) return null;
  const set: Record<string, unknown> = {};
  if (input.title !== undefined) set.title = str(input.title, 160);
  if (input.caption !== undefined) set.caption = str(input.caption, 400);
  if (input.category !== undefined) set.category = str(input.category, 60) || "Services";
  if (input.src !== undefined) set.src = str(input.src, 600);
  if (input.width !== undefined) set.width = num(input.width, 1600);
  if (input.height !== undefined) set.height = num(input.height, 1000);

  const db = await getDb();
  await db.collection(COLLECTION).updateOne({ _id: new ObjectId(id) }, { $set: set });
  const doc = await db.collection<MediaDoc>(COLLECTION).findOne({ _id: new ObjectId(id) });
  return doc ? serialize(doc, doc.order ?? 0) : null;
}

export async function deleteMedia(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const db = await getDb();
  const res = await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
  return res.deletedCount === 1;
}

/** Persist a new ordering from an array of ids. */
export async function reorderMedia(ids: string[]): Promise<void> {
  const db = await getDb();
  const valid = ids.filter((id) => ObjectId.isValid(id));
  await Promise.all(
    valid.map((id, i) =>
      db.collection(COLLECTION).updateOne({ _id: new ObjectId(id) }, { $set: { order: i } })
    )
  );
}

/** Insert the starter gallery. No-op if media already exist. */
export async function seedMedia(): Promise<number> {
  const db = await getDb();
  const count = await db.collection(COLLECTION).countDocuments();
  if (count > 0) return 0;
  const now = new Date();
  const docs = DEFAULT_MEDIA.map((m) => ({ _id: new ObjectId(), ...m, createdAt: now }));
  await db.collection(COLLECTION).insertMany(docs);
  return docs.length;
}
