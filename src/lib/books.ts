import { ObjectId, GridFSBucket, type Db } from "mongodb";
import { Readable } from "stream";
import { getDb } from "@/lib/mongodb";
import {
  cleanPrices,
  computePrices,
  roundMoney,
  isSellable,
  slugifyBook,
  DEFAULT_BASE_CURRENCY,
  type Book,
  type BookPrices,
  type BookStatus,
} from "@/lib/books-shared";
import { getRates } from "@/lib/fx";
import { CURRENCIES, type CurrencyCode } from "@/lib/currencies";

/**
 * The bookshop catalogue — database layer (server only).
 *
 * A book is a cover image (served from the CDN like every other image on the
 * site) plus a PDF that must never be publicly reachable — it is the thing
 * being sold. The PDF therefore lives in GridFS, inside the same MongoDB the
 * rest of the site already uses, and only ever leaves through
 * /api/shop/download with a signed token proving a paid order (see
 * lib/book-tokens.ts).
 *
 * A book carries exactly one price — `basePrice` in `baseCurrency`. Every other
 * currency is converted from it at the day's cached rate (see lib/fx.ts) and
 * rounded up, so there is only ever one number per book to keep correct.
 *
 * Types and pure helpers live in lib/books-shared.ts, which the shop's client
 * components import — this module pulls in the MongoDB driver and must never
 * reach a browser bundle. Everything shared is re-exported below so server code
 * can import it from either place.
 */

export * from "@/lib/books-shared";

const COLLECTION = "books";
const PDF_BUCKET = "book_pdfs";

/* ------------------------------ Utilities ------------------------------ */

const str = (v: unknown, max = 500) => String(v ?? "").slice(0, max).trim();

const toISO = (v: Date | string | undefined) =>
  (v instanceof Date ? v : new Date(v ?? 0)).toISOString();

type BookDoc = {
  _id: ObjectId;
  slug: string;
  title?: string;
  subtitle?: string;
  author?: string;
  description?: string;
  coverImage?: string | null;
  basePrice?: number;
  baseCurrency?: CurrencyCode;
  /** Both written by older versions. Migrated on read, cleared on next save. */
  priceOverrides?: BookPrices;
  prices?: BookPrices;
  pages?: number;
  category?: string;
  status?: BookStatus;
  featured?: boolean;
  order?: number;
  pdfFileId?: ObjectId | null;
  pdfFileName?: string;
  pdfSize?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * Recover the base price for a book written by an earlier version.
 *
 * Two older shapes exist. Books from before automatic pricing carry a
 * hand-typed price per currency in `prices`; books from the brief
 * manual-override era additionally carry `priceOverrides`. Neither is honoured
 * any more — a book is one base price and everything else converts — so both
 * are only mined for a sensible base figure and then ignored. They are cleared
 * from the document the next time the book is saved.
 */
function pricingOf(d: BookDoc): {
  basePrice: number;
  baseCurrency: CurrencyCode;
} {
  const baseCurrency =
    d.baseCurrency && d.baseCurrency in CURRENCIES
      ? d.baseCurrency
      : DEFAULT_BASE_CURRENCY;

  if (Number(d.basePrice) > 0) {
    return { basePrice: Number(d.basePrice), baseCurrency };
  }

  // No base price yet — take one from whatever the old shape recorded, so an
  // existing book keeps a sensible figure instead of falling off the shop.
  const legacy = { ...cleanPrices(d.prices), ...cleanPrices(d.priceOverrides) };
  const codes = Object.keys(legacy) as CurrencyCode[];
  if (!codes.length) return { basePrice: 0, baseCurrency };

  const legacyBase = legacy[baseCurrency] ? baseCurrency : codes[0];
  return { basePrice: legacy[legacyBase] as number, baseCurrency: legacyBase };
}

function serialize(d: BookDoc, rates: Record<string, number> | null): Book {
  const { basePrice, baseCurrency } = pricingOf(d);
  return {
    id: String(d._id),
    slug: d.slug,
    title: d.title ?? "(untitled)",
    subtitle: d.subtitle ?? "",
    author: d.author ?? "",
    description: d.description ?? "",
    coverImage: d.coverImage ?? null,
    basePrice,
    baseCurrency,
    prices: computePrices(basePrice, baseCurrency, rates),
    pages: d.pages ?? 0,
    category: d.category ?? "",
    status: d.status ?? "draft",
    featured: Boolean(d.featured),
    order: d.order ?? 0,
    hasPdf: Boolean(d.pdfFileId),
    pdfFileName: d.pdfFileName ?? "",
    pdfSize: d.pdfSize ?? 0,
    createdAt: toISO(d.createdAt),
    updatedAt: toISO(d.updatedAt),
  };
}

/* -------------------------------- Reads -------------------------------- */

/** Public: the shop listing. Drafts and PDF-less books are never included. */
export async function listPublishedBooks(): Promise<Book[]> {
  try {
    const db = await getDb();
    const docs = await db
      .collection<BookDoc>(COLLECTION)
      .find({ status: "published", pdfFileId: { $ne: null } })
      .sort({ order: 1, createdAt: -1 })
      .limit(300)
      .toArray();
    // One rate lookup for the whole listing, so every card on the page is
    // priced from the same table.
    const rates = await getRates();
    return docs.map((d) => serialize(d, rates?.rates ?? null)).filter(isSellable);
  } catch (err) {
    // A shop that 500s is worse than a shop that is briefly empty.
    console.error("[books] list failed:", err);
    return [];
  }
}

export async function getBookBySlug(slug: string): Promise<Book | null> {
  const db = await getDb();
  const doc = await db.collection<BookDoc>(COLLECTION).findOne({ slug });
  if (!doc) return null;
  const rates = await getRates();
  const book = serialize(doc, rates?.rates ?? null);
  return isSellable(book) ? book : null;
}

/** Admin: everything, drafts included. */
export async function listBooksAdmin(): Promise<Book[]> {
  const db = await getDb();
  const docs = await db
    .collection<BookDoc>(COLLECTION)
    .find({})
    .sort({ order: 1, createdAt: -1 })
    .limit(500)
    .toArray();
  const rates = await getRates();
  return docs.map((d) => serialize(d, rates?.rates ?? null));
}

export async function getBookById(id: string): Promise<Book | null> {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const doc = await db
    .collection<BookDoc>(COLLECTION)
    .findOne({ _id: new ObjectId(id) });
  if (!doc) return null;
  const rates = await getRates();
  return serialize(doc, rates?.rates ?? null);
}

/**
 * Look up several books at once for cart pricing. Returned as a map so the
 * checkout can price each line without an N+1 of round trips.
 */
export async function getSellableBooksByIds(
  ids: string[]
): Promise<Map<string, Book>> {
  const objectIds = ids.filter(ObjectId.isValid).map((id) => new ObjectId(id));
  const map = new Map<string, Book>();
  if (!objectIds.length) return map;

  const db = await getDb();
  const docs = await db
    .collection<BookDoc>(COLLECTION)
    .find({ _id: { $in: objectIds }, status: "published" })
    .toArray();

  // The same cached table the shop rendered from, so the price a shopper saw
  // is the price the order is created at.
  const rates = await getRates();
  for (const doc of docs) {
    const book = serialize(doc, rates?.rates ?? null);
    if (isSellable(book)) map.set(book.id, book);
  }
  return map;
}

/* -------------------------------- Writes ------------------------------- */

export type BookInput = {
  slug?: string;
  title: string;
  subtitle?: string;
  author?: string;
  description?: string;
  coverImage?: string | null;
  /** The one figure the ministry types; every other currency is derived. */
  basePrice?: number;
  baseCurrency?: string;
  pages?: number;
  category?: string;
  status?: BookStatus;
  featured?: boolean;
};

/** Ensure the slug is unique (append -2, -3, … if taken) — same rule as posts. */
async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const db = await getDb();
  const coll = db.collection<BookDoc>(COLLECTION);
  let slug = base || "book";
  let n = 1;
  for (;;) {
    const existing = await coll.findOne({ slug });
    if (!existing || (excludeId && String(existing._id) === excludeId)) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

function normalize(input: BookInput) {
  return {
    title: str(input.title, 200) || "(untitled)",
    subtitle: str(input.subtitle, 300),
    author: str(input.author, 200),
    description: String(input.description ?? "").slice(0, 40_000),
    coverImage: input.coverImage ? str(input.coverImage, 600) : null,
    basePrice: Math.max(0, roundMoney(Number(input.basePrice) || 0)),
    baseCurrency:
      input.baseCurrency && input.baseCurrency.toUpperCase() in CURRENCIES
        ? (input.baseCurrency.toUpperCase() as CurrencyCode)
        : DEFAULT_BASE_CURRENCY,
    // Clear both legacy price shapes: once a book is saved through this path
    // the base price is the single source of truth and every other currency is
    // converted from it.
    priceOverrides: {},
    prices: {},
    pages: Math.max(0, Math.min(10_000, Math.round(Number(input.pages) || 0))),
    category: str(input.category, 80),
    status: input.status === "published" ? ("published" as const) : ("draft" as const),
    featured: Boolean(input.featured),
  };
}

export async function createBook(input: BookInput): Promise<Book> {
  const db = await getDb();
  const now = new Date();
  const slug = await uniqueSlug(slugifyBook(input.slug || input.title));
  const order = await db.collection(COLLECTION).countDocuments();

  const doc: BookDoc = {
    _id: new ObjectId(),
    slug,
    ...normalize(input),
    order,
    pdfFileId: null,
    pdfFileName: "",
    pdfSize: 0,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection<BookDoc>(COLLECTION).insertOne(doc);
  const rates = await getRates();
  return serialize(doc, rates?.rates ?? null);
}

export async function updateBook(
  id: string,
  input: BookInput
): Promise<Book | null> {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const slug = await uniqueSlug(slugifyBook(input.slug || input.title), id);

  await db.collection<BookDoc>(COLLECTION).updateOne(
    { _id: new ObjectId(id) },
    { $set: { slug, ...normalize(input), updatedAt: new Date() } }
  );
  return getBookById(id);
}

/** Deletes the row *and* its PDF — an orphaned GridFS file is dead weight. */
export async function deleteBook(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const db = await getDb();
  const _id = new ObjectId(id);

  const doc = await db.collection<BookDoc>(COLLECTION).findOne({ _id });
  if (!doc) return false;

  if (doc.pdfFileId) await removePdfFile(db, doc.pdfFileId);
  const res = await db.collection(COLLECTION).deleteOne({ _id });
  return res.deletedCount === 1;
}

/** Persist a new ordering from an array of ids. */
export async function reorderBooks(ids: string[]): Promise<void> {
  const db = await getDb();
  await Promise.all(
    ids
      .filter(ObjectId.isValid)
      .map((id, i) =>
        db.collection(COLLECTION).updateOne({ _id: new ObjectId(id) }, { $set: { order: i } })
      )
  );
}

/* ------------------------------- The PDF ------------------------------- */

function bucket(db: Db): GridFSBucket {
  return new GridFSBucket(db, { bucketName: PDF_BUCKET });
}

/** Best-effort delete — a missing file must not abort the caller. */
async function removePdfFile(db: Db, fileId: ObjectId): Promise<void> {
  try {
    await bucket(db).delete(fileId);
  } catch (err) {
    console.error("[books] could not delete PDF", String(fileId), err);
  }
}

/**
 * Store (or replace) a book's PDF. The previous file is deleted only after the
 * new one is safely written and the row points at it, so a failed upload can
 * never leave a book with no deliverable file.
 */
export async function savePdf(
  bookId: string,
  file: { buffer: Buffer; filename: string; contentType: string }
): Promise<Book | null> {
  if (!ObjectId.isValid(bookId)) return null;
  const db = await getDb();
  const _id = new ObjectId(bookId);

  const existing = await db.collection<BookDoc>(COLLECTION).findOne({ _id });
  if (!existing) return null;

  const filename = str(file.filename, 200) || "book.pdf";
  const fileId = await new Promise<ObjectId>((resolve, reject) => {
    const upload = bucket(db).openUploadStream(filename, {
      // The driver dropped the top-level `contentType` field in v7, so it now
      // rides along in metadata and is read back from there in openPdf.
      metadata: {
        bookId: String(_id),
        contentType: file.contentType || "application/pdf",
      },
    });
    Readable.from(file.buffer)
      .pipe(upload)
      .on("error", reject)
      .on("finish", () => resolve(upload.id as ObjectId));
  });

  await db.collection<BookDoc>(COLLECTION).updateOne(
    { _id },
    {
      $set: {
        pdfFileId: fileId,
        pdfFileName: filename,
        pdfSize: file.buffer.length,
        updatedAt: new Date(),
      },
    }
  );

  if (existing.pdfFileId) await removePdfFile(db, existing.pdfFileId);
  return getBookById(bookId);
}

export async function deletePdf(bookId: string): Promise<Book | null> {
  if (!ObjectId.isValid(bookId)) return null;
  const db = await getDb();
  const _id = new ObjectId(bookId);

  const existing = await db.collection<BookDoc>(COLLECTION).findOne({ _id });
  if (!existing) return null;
  if (existing.pdfFileId) await removePdfFile(db, existing.pdfFileId);

  await db.collection<BookDoc>(COLLECTION).updateOne(
    { _id },
    {
      $set: { pdfFileId: null, pdfFileName: "", pdfSize: 0, updatedAt: new Date() },
    }
  );
  return getBookById(bookId);
}

export type PdfStream = {
  stream: Readable;
  filename: string;
  contentType: string;
  length: number;
};

/**
 * Open the stored PDF for streaming. Callers MUST have already proved the
 * request is entitled to it — nothing in here checks payment.
 */
export async function openPdf(bookId: string): Promise<PdfStream | null> {
  if (!ObjectId.isValid(bookId)) return null;
  const db = await getDb();

  const doc = await db
    .collection<BookDoc>(COLLECTION)
    .findOne({ _id: new ObjectId(bookId) });
  if (!doc?.pdfFileId) return null;

  const files = await bucket(db).find({ _id: doc.pdfFileId }).limit(1).toArray();
  const meta = files[0];
  if (!meta) return null;

  return {
    stream: bucket(db).openDownloadStream(doc.pdfFileId),
    filename: doc.pdfFileName || `${doc.slug || "book"}.pdf`,
    contentType: String(meta.metadata?.contentType || "application/pdf"),
    length: meta.length ?? doc.pdfSize ?? 0,
  };
}
