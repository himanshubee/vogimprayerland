"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BookOpen,
  Check,
  FileText,
  ImagePlus,
  Loader2,
  Plus,
  Receipt,
  RefreshCw,
  Trash2,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { TinyEditor } from "@/components/admin/TinyEditor";
import { CURRENCIES, type CurrencyCode } from "@/lib/currencies";
import {
  DEFAULT_BASE_CURRENCY,
  PAYPAL_CURRENCIES,
  computePrices,
  formatPrice,
  type Book,
  type BookPrices,
} from "@/lib/books-shared";
import type { FxRates } from "@/lib/fx";

const controlCls =
  "bg-white border border-midnight/15 px-3 py-2 text-sm outline-none focus:border-gold transition-colors";
const inputCls = `w-full ${controlCls}`;
const labelCls =
  "block text-[11px] tracking-[0.2em] uppercase text-midnight/55 mb-1.5";

const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

const bytes = (n: number) =>
  n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`;

/** The editable shape — prices are strings so a half-typed number stays typed. */
type Draft = {
  id: string | null;
  title: string;
  subtitle: string;
  author: string;
  slug: string;
  category: string;
  pages: string;
  description: string;
  coverImage: string | null;
  status: "published" | "draft";
  featured: boolean;
  basePrice: string;
  baseCurrency: CurrencyCode;
  /** Blank = let the rate table decide this currency. */
  overrides: Record<string, string>;
};

function toDraft(book?: Book): Draft {
  const overrides: Record<string, string> = {};
  for (const code of CURRENCY_CODES) {
    const v = book?.priceOverrides?.[code];
    overrides[code] = v ? String(v) : "";
  }
  return {
    id: book?.id ?? null,
    title: book?.title ?? "",
    subtitle: book?.subtitle ?? "",
    author: book?.author ?? "",
    slug: book?.slug ?? "",
    category: book?.category ?? "",
    pages: book?.pages ? String(book.pages) : "",
    description: book?.description ?? "",
    coverImage: book?.coverImage ?? null,
    status: book?.status ?? "draft",
    featured: Boolean(book?.featured),
    basePrice: book?.basePrice ? String(book.basePrice) : "",
    baseCurrency: book?.baseCurrency ?? DEFAULT_BASE_CURRENCY,
    overrides,
  };
}

function toPayload(draft: Draft) {
  const priceOverrides: BookPrices = {};
  for (const [code, raw] of Object.entries(draft.overrides)) {
    const n = Number(raw);
    if (raw.trim() && Number.isFinite(n) && n > 0) {
      priceOverrides[code as CurrencyCode] = n;
    }
  }
  return {
    title: draft.title,
    subtitle: draft.subtitle,
    author: draft.author,
    slug: draft.slug,
    category: draft.category,
    pages: Number(draft.pages) || 0,
    description: draft.description,
    coverImage: draft.coverImage,
    status: draft.status,
    featured: draft.featured,
    basePrice: Number(draft.basePrice) || 0,
    baseCurrency: draft.baseCurrency,
    priceOverrides,
  };
}

export function BooksManager({
  initial,
  fx,
}: {
  initial: Book[];
  fx: FxRates | null;
}) {
  const router = useRouter();
  const [items, setItems] = useState<Book[]>(initial);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  function note(message: string) {
    setFlash(message);
    setTimeout(() => setFlash(null), 3200);
  }

  async function save() {
    if (!draft) return;
    if (!draft.title.trim()) {
      setError("A title is required.");
      return;
    }
    setBusy(true);
    setError(null);

    const editing = Boolean(draft.id);
    try {
      const res = await fetch(
        editing ? `/api/books/${draft.id}/` : "/api/books/",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toPayload(draft)),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not save the book");

      const book: Book = data.book;
      setItems((prev) =>
        editing ? prev.map((b) => (b.id === book.id ? book : b)) : [...prev, book]
      );
      // Stay in the editor after creating, so the PDF can be attached without
      // hunting for the new row — a book is not sellable until it has one.
      setDraft(toDraft(book));
      note(editing ? "Saved." : "Book created — now attach its PDF.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the book");
    } finally {
      setBusy(false);
    }
  }

  async function remove(book: Book) {
    if (
      !confirm(
        `Delete “${book.title}”? Its PDF is deleted too. Existing orders keep their record, but the file can no longer be downloaded.`
      )
    ) {
      return;
    }
    setItems((prev) => prev.filter((b) => b.id !== book.id));
    if (draft?.id === book.id) setDraft(null);
    await fetch(`/api/books/${book.id}/`, { method: "DELETE" }).catch(() => {});
    router.refresh();
  }

  async function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[index], next[j]] = [next[j], next[index]];
    setItems(next);
    await fetch("/api/books/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reorder", ids: next.map((b) => b.id) }),
    }).catch(() => {});
    router.refresh();
  }

  /* ------------------------------- Editor ------------------------------- */

  if (draft) {
    return (
      <Shell
        title={draft.id ? "Edit book" : "New book"}
        flash={flash}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDraft(null)}
              className="text-[11px] tracking-[0.18em] uppercase text-white/60 hover:text-gold px-3 py-2 transition-colors"
            >
              Back to list
            </button>
            <button
              onClick={save}
              disabled={busy}
              className="btn-gold !py-2 !px-4 !text-[11px] disabled:opacity-60"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Save
            </button>
          </div>
        }
      >
        {error && (
          <p
            role="alert"
            className="mb-6 border-l-2 border-midnight-soft bg-midnight-soft/5 px-4 py-3 text-sm text-midnight"
          >
            {error}
          </p>
        )}

        <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
          {/* MAIN */}
          <div className="space-y-6">
            <div className="bg-white border border-midnight/12 p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className={labelCls}>Title *</span>
                  <input
                    className={inputCls}
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    placeholder="Breaking Generational Curses"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelCls}>Subtitle</span>
                  <input
                    className={inputCls}
                    value={draft.subtitle}
                    onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
                    placeholder="A practical guide to lasting freedom"
                  />
                </label>
                <label className="block">
                  <span className={labelCls}>Author</span>
                  <input
                    className={inputCls}
                    value={draft.author}
                    onChange={(e) => setDraft({ ...draft, author: e.target.value })}
                    placeholder="Prophet Olaofe"
                  />
                </label>
                <label className="block">
                  <span className={labelCls}>Category</span>
                  <input
                    className={inputCls}
                    value={draft.category}
                    onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                    placeholder="Deliverance"
                  />
                </label>
                <label className="block">
                  <span className={labelCls}>Pages</span>
                  <input
                    type="number"
                    min={0}
                    className={inputCls}
                    value={draft.pages}
                    onChange={(e) => setDraft({ ...draft, pages: e.target.value })}
                    placeholder="128"
                  />
                </label>
                <label className="block">
                  <span className={labelCls}>URL slug</span>
                  <input
                    className={inputCls}
                    value={draft.slug}
                    onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                    placeholder="auto from the title"
                  />
                </label>
              </div>
            </div>

            <div className="bg-white border border-midnight/12 p-6">
              <span className={labelCls}>Description</span>
              <TinyEditor
                value={draft.description}
                onChange={(html) => setDraft({ ...draft, description: html })}
              />
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="space-y-6 lg:sticky lg:top-24">
            <PublishPanel draft={draft} setDraft={setDraft} />
            <CoverPanel draft={draft} setDraft={setDraft} />
            <PdfPanel
              bookId={draft.id}
              book={items.find((b) => b.id === draft.id)}
              onChange={(book) => {
                setItems((prev) => prev.map((b) => (b.id === book.id ? book : b)));
                note("PDF updated.");
                router.refresh();
              }}
            />
            <PricesPanel draft={draft} setDraft={setDraft} fx={fx} />
            <RatesPanel fx={fx} />
          </div>
        </div>
      </Shell>
    );
  }

  /* -------------------------------- List -------------------------------- */

  return (
    <Shell
      title="Books"
      flash={flash}
      action={
        <div className="flex items-center gap-2">
          <Link
            href="/admin/books/orders"
            className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase text-white/60 hover:text-gold px-3 py-2 transition-colors"
          >
            <Receipt size={14} /> Orders
          </Link>
          <button
            onClick={() => {
              setError(null);
              setDraft(toDraft());
            }}
            className="btn-gold !py-2 !px-4 !text-[11px]"
          >
            <Plus size={14} /> New book
          </button>
        </div>
      }
    >
      {items.length === 0 ? (
        <div className="bg-white border border-midnight/12 px-8 py-16 text-center">
          <BookOpen className="mx-auto text-gold-deep" size={32} />
          <h2 className="font-display text-2xl text-midnight mt-4">No books yet</h2>
          <p className="mt-3 text-sm text-midnight/60 max-w-sm mx-auto">
            Create a book, upload its cover and PDF, set one price — every other
            currency converts automatically — then publish it.
          </p>
          <button
            onClick={() => setDraft(toDraft())}
            className="btn-gold mt-7 !py-2.5 !px-5 !text-[11px]"
          >
            <Plus size={14} /> New book
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((book, i) => {
            const priced = Object.keys(book.prices).length > 0;
            const live = book.status === "published" && book.hasPdf && priced;
            return (
              <li
                key={book.id}
                className="bg-white border border-midnight/12 p-4 flex gap-4 items-start"
              >
                <div className="relative w-14 aspect-[3/4] shrink-0 bg-midnight/5">
                  {book.coverImage ? (
                    <Image
                      src={book.coverImage}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-midnight/25">
                      <BookOpen size={18} />
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg text-midnight leading-tight">
                      {book.title}
                    </h3>
                    <span
                      className={`text-[10px] tracking-[0.16em] uppercase px-2 py-0.5 border ${
                        live
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : "bg-midnight/5 text-midnight/50 border-midnight/20"
                      }`}
                    >
                      {live ? "Live" : book.status}
                    </span>
                  </div>

                  {book.subtitle && (
                    <p className="text-xs text-midnight/55 mt-1 truncate">
                      {book.subtitle}
                    </p>
                  )}

                  <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-midnight/55">
                    <span
                      className={`inline-flex items-center gap-1 ${
                        book.hasPdf ? "text-emerald-700" : "text-midnight-soft"
                      }`}
                    >
                      {book.hasPdf ? <FileText size={12} /> : <AlertTriangle size={12} />}
                      {book.hasPdf ? `PDF · ${bytes(book.pdfSize)}` : "No PDF"}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 ${
                        priced ? "" : "text-midnight-soft"
                      }`}
                    >
                      {priced
                        ? `${formatPrice(book.basePrice, book.baseCurrency)} ${book.baseCurrency}` +
                          (Object.keys(book.prices).length > 1
                            ? `  ·  +${Object.keys(book.prices).length - 1} converted`
                            : "")
                        : "No price set"}
                    </span>
                  </div>

                  {book.status === "published" && (!book.hasPdf || !priced) && (
                    <p className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] text-midnight-soft">
                      <AlertTriangle size={12} />
                      Hidden from the shop until it has {!book.hasPdf && "a PDF"}
                      {!book.hasPdf && !priced && " and "}
                      {!priced && "a price"}.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Move up"
                    className="p-1.5 text-midnight/40 hover:text-gold-deep disabled:opacity-25 transition-colors"
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === items.length - 1}
                    aria-label="Move down"
                    className="p-1.5 text-midnight/40 hover:text-gold-deep disabled:opacity-25 transition-colors"
                  >
                    <ArrowDown size={15} />
                  </button>
                  <button
                    onClick={() => {
                      setError(null);
                      setDraft(toDraft(book));
                    }}
                    className="ml-1 text-[11px] tracking-[0.16em] uppercase text-midnight/60 hover:text-gold-deep px-3 py-2 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(book)}
                    aria-label={`Delete ${book.title}`}
                    className="p-1.5 text-midnight/35 hover:text-midnight-soft transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Shell>
  );
}

/* ------------------------------- Sub-panels ------------------------------ */

function PublishPanel({
  draft,
  setDraft,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
}) {
  return (
    <div className="bg-white border border-midnight/12 p-5">
      <p className={labelCls}>Visibility</p>
      <div className="flex gap-2">
        {(["draft", "published"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setDraft({ ...draft, status: s })}
            aria-pressed={draft.status === s}
            className={`flex-1 px-3 py-2 border text-[11px] tracking-[0.16em] uppercase transition-colors ${
              draft.status === s
                ? "border-gold bg-gold text-midnight"
                : "border-midnight/20 text-midnight/60 hover:border-gold"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <label className="mt-4 flex items-center gap-2.5 text-sm text-midnight/70 cursor-pointer">
        <input
          type="checkbox"
          checked={draft.featured}
          onChange={(e) => setDraft({ ...draft, featured: e.target.checked })}
          className="accent-gold"
        />
        Feature this book
      </label>

      {draft.id && (
        <Link
          href={`/books/${draft.slug}/`}
          target="_blank"
          className="mt-4 block text-[11px] text-gold-deep hover:text-midnight transition-colors"
        >
          View on the site →
        </Link>
      )}
    </div>
  );
}

function CoverPanel({
  draft,
  setDraft,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      // Covers are public artwork, so they go to the same S3/CDN service as
      // every other image on the site — unlike the PDF, which never does.
      const res = await fetch("/api/upload/", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      setDraft({ ...draft, coverImage: data.url });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="bg-white border border-midnight/12 p-5">
      <p className={labelCls}>Cover image</p>

      {draft.coverImage ? (
        <div className="relative aspect-[3/4] w-full bg-midnight/5">
          <Image
            src={draft.coverImage}
            alt="Cover"
            fill
            sizes="300px"
            className="object-cover"
          />
          <button
            type="button"
            onClick={() => setDraft({ ...draft, coverImage: null })}
            aria-label="Remove cover"
            className="absolute top-2 right-2 bg-white/90 p-1.5 text-midnight/60 hover:text-midnight-soft transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="aspect-[3/4] w-full border border-dashed border-midnight/20 flex flex-col items-center justify-center gap-2 text-midnight/35">
          <ImagePlus size={26} />
          <span className="text-xs">No cover yet</span>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => upload(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="mt-3 w-full border border-midnight/20 px-3 py-2 text-[11px] tracking-[0.16em] uppercase text-midnight/70 hover:border-gold hover:text-gold-deep transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
      >
        {uploading ? (
          <>
            <Loader2 size={13} className="animate-spin" /> Uploading
          </>
        ) : (
          <>
            <ImagePlus size={13} /> {draft.coverImage ? "Replace" : "Upload"} cover
          </>
        )}
      </button>

      {error && <p className="mt-2 text-xs text-midnight-soft">{error}</p>}
      <p className="mt-2 text-[11px] text-midnight/40 leading-relaxed">
        Portrait works best (3:4). Shown on the shop grid and the book page.
      </p>
    </div>
  );
}

function PdfPanel({
  bookId,
  book,
  onChange,
}: {
  bookId: string | null;
  book: Book | undefined;
  onChange: (book: Book) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File | undefined) {
    if (!file || !bookId) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/books/${bookId}/pdf/`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      onChange(data.book);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removePdf() {
    if (!bookId) return;
    if (!confirm("Remove this PDF? The book comes off the shop until a new one is uploaded.")) {
      return;
    }
    const res = await fetch(`/api/books/${bookId}/pdf/`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.book) onChange(data.book);
  }

  return (
    <div className="bg-white border border-midnight/12 p-5">
      <p className={labelCls}>The book file</p>

      {!bookId ? (
        <p className="text-xs text-midnight/50 leading-relaxed">
          Save the book first — then its PDF can be attached here.
        </p>
      ) : (
        <>
          {book?.hasPdf ? (
            <div className="border border-emerald-300 bg-emerald-50 px-3 py-3">
              <p className="flex items-center gap-2 text-sm text-emerald-800">
                <FileText size={15} className="shrink-0" />
                <span className="truncate">{book.pdfFileName}</span>
              </p>
              <p className="mt-1 text-[11px] text-emerald-700/80">
                {bytes(book.pdfSize)} · stored privately
              </p>
              <button
                type="button"
                onClick={removePdf}
                className="mt-2.5 text-[11px] text-midnight/50 hover:text-midnight-soft transition-colors"
              >
                Remove PDF
              </button>
            </div>
          ) : (
            <p className="flex items-start gap-2 border border-dashed border-midnight-soft/40 bg-midnight-soft/5 px-3 py-3 text-xs text-midnight/70 leading-relaxed">
              <AlertTriangle size={14} className="text-midnight-soft shrink-0 mt-0.5" />
              No PDF attached. The book cannot appear in the shop until one is.
            </p>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,.pdf"
            hidden
            onChange={(e) => upload(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="mt-3 w-full border border-midnight/20 px-3 py-2 text-[11px] tracking-[0.16em] uppercase text-midnight/70 hover:border-gold hover:text-gold-deep transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Uploading
              </>
            ) : (
              <>
                <Upload size={13} /> {book?.hasPdf ? "Replace" : "Upload"} PDF
              </>
            )}
          </button>

          {error && <p className="mt-2 text-xs text-midnight-soft">{error}</p>}
          <p className="mt-2 text-[11px] text-midnight/40 leading-relaxed">
            Up to 64MB. The file is stored privately and only ever reaches a
            customer through a signed link tied to their paid order.
          </p>
        </>
      )}
    </div>
  );
}

function PricesPanel({
  draft,
  setDraft,
  fx,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  fx: FxRates | null;
}) {
  const [showOverrides, setShowOverrides] = useState(
    Object.values(draft.overrides).some((v) => v.trim())
  );

  const overrides: BookPrices = {};
  for (const [code, raw] of Object.entries(draft.overrides)) {
    const n = Number(raw);
    if (raw.trim() && n > 0) overrides[code as CurrencyCode] = n;
  }

  // Exactly the calculation the shop will run, so what the admin sees here is
  // what a shopper sees — no second implementation to drift out of step.
  const preview = computePrices(
    Number(draft.basePrice) || 0,
    draft.baseCurrency,
    fx?.rates ?? null,
    overrides
  );

  const hasBase = Number(draft.basePrice) > 0;
  const belowMinimum =
    hasBase && Number(draft.basePrice) < CURRENCIES[draft.baseCurrency].min;

  /** A pinned price the gateway would refuse — flagged before it reaches a shopper. */
  const underMin = (code: CurrencyCode) => {
    const raw = draft.overrides[code];
    const n = Number(raw);
    return Boolean(raw?.trim()) && n > 0 && n < CURRENCIES[code].min;
  };

  return (
    <div className="bg-white border border-midnight/12 p-5">
      <p className={labelCls}>Price</p>

      <div className="flex gap-2">
        <select
          value={draft.baseCurrency}
          onChange={(e) =>
            setDraft({ ...draft, baseCurrency: e.target.value as CurrencyCode })
          }
          aria-label="Base currency"
          className={`${controlCls} w-24 shrink-0`}
        >
          {CURRENCY_CODES.map((code) => (
            <option key={code} value={code}>
              {CURRENCIES[code].symbol} {code}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={0}
          step="0.01"
          aria-label={`Price in ${draft.baseCurrency}`}
          className={`${controlCls} flex-1 min-w-0 text-base`}
          value={draft.basePrice}
          onChange={(e) => setDraft({ ...draft, basePrice: e.target.value })}
          placeholder="4.99"
        />
      </div>

      {belowMinimum && (
        <p className="mt-2.5 flex items-start gap-1.5 text-[11px] text-midnight-soft leading-relaxed">
          <AlertTriangle size={12} className="shrink-0 mt-0.5" />
          The smallest amount the payment gateway will take in{" "}
          {draft.baseCurrency} is{" "}
          {formatPrice(CURRENCIES[draft.baseCurrency].min, draft.baseCurrency)}.
        </p>
      )}

      <p className="mt-2.5 flex items-start gap-1.5 text-[11px] text-midnight/45 leading-relaxed">
        <Wand2 size={12} className="text-gold-deep shrink-0 mt-0.5" />
        Type one price in USD. Every other currency &mdash; NGN included &mdash;
        is converted automatically at the day&rsquo;s exchange rate and rounded up
        to a tidy figure.
      </p>

      {/* WHAT THE SHOPPER WILL SEE */}
      {hasBase && (
        <div className="mt-5 border-t border-midnight/10 pt-4">
          <p className="text-[10px] tracking-[0.2em] uppercase text-midnight/45 mb-2.5">
            Shoppers will pay
          </p>

          {!fx && (
            <p className="mb-3 flex items-start gap-1.5 text-[11px] text-midnight-soft leading-relaxed">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" />
              No exchange rates available, so this book can only be sold in{" "}
              {draft.baseCurrency} until rates are fetched.
            </p>
          )}

          <ul className="space-y-1">
            {CURRENCY_CODES.map((code) => {
              const amount = preview[code];
              const isBase = code === draft.baseCurrency;
              const pinned = Boolean(overrides[code]);
              return (
                <li
                  key={code}
                  className="flex items-baseline justify-between gap-3 text-xs"
                >
                  <span className="text-midnight/50">
                    {code}
                    {PAYPAL_CURRENCIES.includes(code) && (
                      <span
                        title="PayPal can take this currency"
                        className="ml-1.5 text-[9px] tracking-wider uppercase text-gold-deep"
                      >
                        PP
                      </span>
                    )}
                    {isBase && (
                      <span className="ml-1.5 text-[9px] tracking-wider uppercase text-midnight/40">
                        base
                      </span>
                    )}
                    {pinned && !isBase && (
                      <span className="ml-1.5 text-[9px] tracking-wider uppercase text-midnight/40">
                        fixed
                      </span>
                    )}
                  </span>
                  <span
                    className={
                      amount
                        ? "text-midnight tabular-nums"
                        : "text-midnight/30 tabular-nums"
                    }
                  >
                    {amount ? formatPrice(amount, code) : "not sold"}
                  </span>
                </li>
              );
            })}
          </ul>

          <p className="mt-3 text-[10px] text-midnight/35 leading-relaxed">
            <span className="text-gold-deep">PP</span> marks the currencies
            PayPal accepts. The rest are still buyable by card, bank transfer or
            mobile money.
          </p>
        </div>
      )}

      {/* MANUAL PINS — the escape hatch, deliberately secondary */}
      <div className="mt-4 border-t border-midnight/10 pt-3">
        <button
          type="button"
          onClick={() => setShowOverrides((v) => !v)}
          className="text-[11px] text-gold-deep hover:text-midnight transition-colors"
        >
          {showOverrides ? "Hide" : "Set"} a fixed price for a currency
        </button>

        {showOverrides && (
          <>
            <p className="mt-2.5 text-[11px] text-midnight/45 leading-relaxed">
              Fill one in to stop that currency being converted. Leave blank to
              let it follow the base price.
            </p>
            <div className="mt-3 space-y-2">
              {CURRENCY_CODES.map((code) => {
                const isBase = code === draft.baseCurrency;
                return (
                  <div key={code}>
                    <label className="flex items-center gap-3">
                      <span className="w-16 shrink-0 text-xs text-midnight/70">
                        {CURRENCIES[code].symbol} {code}
                      </span>
                      {isBase ? (
                        // The base currency's price is the field at the top of
                        // this panel. Showing it here read-only keeps the list
                        // complete without creating two inputs that could
                        // disagree about what the book costs.
                        <span
                          className={`${controlCls} flex-1 min-w-0 flex items-center justify-between text-midnight/45`}
                        >
                          <span>{draft.basePrice || "—"}</span>
                          <span className="text-[9px] tracking-wider uppercase">
                            base price, set above
                          </span>
                        </span>
                      ) : (
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          aria-label={`Fixed price in ${code}`}
                          className={`${controlCls} flex-1 min-w-0`}
                          value={draft.overrides[code] ?? ""}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              overrides: {
                                ...draft.overrides,
                                [code]: e.target.value,
                              },
                            })
                          }
                          placeholder={
                            preview[code] ? `auto: ${preview[code]}` : "not sold"
                          }
                        />
                      )}
                    </label>
                    {!isBase && underMin(code) && (
                      <p className="mt-1 ml-[76px] flex items-start gap-1.5 text-[10px] text-midnight-soft leading-relaxed">
                        <AlertTriangle size={11} className="shrink-0 mt-0.5" />
                        Below the {formatPrice(CURRENCIES[code].min, code)} minimum
                        the gateway accepts — this order would be refused at
                        payment.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Rate freshness plus a manual refresh — every price on the site rides on this. */
function RatesPanel({ fx }: { fx: FxRates | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/books/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refresh-rates" }),
      });
      const data = await res.json();
      setMessage(res.ok ? "Rates updated." : data?.error || "Could not update rates.");
      if (res.ok) router.refresh();
    } catch {
      setMessage("Could not reach the rate service.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white border border-midnight/12 p-5">
      <p className={labelCls}>Exchange rates</p>

      {fx ? (
        <>
          <p className="text-xs text-midnight/65 leading-relaxed">
            Updated{" "}
            {new Date(fx.fetchedAt).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            <span className="text-midnight/40"> · {fx.source}</span>
          </p>
          {fx.stale && (
            <p className="mt-2 flex items-start gap-1.5 text-[11px] text-midnight-soft leading-relaxed">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" />
              These rates are over a day old — the rate service could not be
              reached. Prices are still being converted from them.
            </p>
          )}
        </>
      ) : (
        <p className="flex items-start gap-1.5 text-[11px] text-midnight-soft leading-relaxed">
          <AlertTriangle size={12} className="shrink-0 mt-0.5" />
          No rates available. Books are being sold in their base currency only.
        </p>
      )}

      <button
        type="button"
        onClick={refresh}
        disabled={busy}
        className="mt-3 w-full border border-midnight/20 px-3 py-2 text-[11px] tracking-[0.16em] uppercase text-midnight/70 hover:border-gold hover:text-gold-deep transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
      >
        <RefreshCw size={13} className={busy ? "animate-spin" : ""} />
        Update rates now
      </button>

      {message && <p className="mt-2 text-[11px] text-midnight/60">{message}</p>}

      <p className="mt-2.5 text-[10px] text-midnight/35 leading-relaxed">
        Refreshed automatically about twice a day. Rates are cached, so nothing
        is fetched while a shopper is browsing.
      </p>
    </div>
  );
}

/* -------------------------------- Chrome -------------------------------- */

function Shell({
  title,
  action,
  flash,
  children,
}: {
  title: string;
  action: React.ReactNode;
  flash: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ivory-dark text-ink">
      <header className="sticky top-0 z-20 bg-midnight text-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div>
              <p className="eyebrow text-gold leading-none">VOGIM Admin</p>
              <h1 className="font-display text-xl sm:text-2xl mt-1 leading-none">
                {title}
              </h1>
            </div>
            <AdminTabs />
          </div>
          {action}
        </div>
      </header>

      {flash && (
        <div className="bg-gold/15 border-b border-gold/40">
          <p className="mx-auto max-w-6xl px-5 sm:px-6 py-2.5 text-xs text-midnight">
            {flash}
          </p>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-5 sm:px-6 py-8">{children}</main>
    </div>
  );
}
