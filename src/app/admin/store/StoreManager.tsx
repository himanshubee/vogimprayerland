"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Loader2,
  Plus,
  Receipt,
  Shirt,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { TinyEditor } from "@/components/admin/TinyEditor";
import { Mockup } from "@/components/shop/Mockup";
import { TemplateEditor } from "./TemplateEditor";
import { CURRENCIES, type CurrencyCode } from "@/lib/currencies";
import { DEFAULT_BASE_CURRENCY, computePrices, formatPrice } from "@/lib/books-shared";
import {
  CATEGORIES,
  CATEGORY_KEYS,
  COLORS,
  colorByKey,
  viewLabel,
  visibleViews,
  effectiveMoney,
  type MerchCategory,
  type MerchItem,
  type MerchPricing,
  type MerchTemplates,
} from "@/lib/merch-shared";
import type { FxRates } from "@/lib/fx";

const controlCls =
  "bg-white border border-midnight/15 px-3 py-2 text-sm outline-none focus:border-gold transition-colors";
const inputCls = `w-full ${controlCls}`;
const labelCls = "block text-[11px] tracking-[0.2em] uppercase text-midnight/55 mb-1.5";

const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

/** Parse a JSON reply, or explain a non-JSON one (a 500 page, a proxy error). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function readJson(res: Response): Promise<Record<string, any>> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return {
      error: `The server answered ${res.status} ${res.statusText || ""}`.trim() +
        (text ? ` — ${text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 120)}` : "") +
        ". If this is the dev server, restart it (Ctrl+C, then npm run dev).",
    };
  }
}

/** The editable shape — the price is a string so a half-typed number stays typed. */
type Draft = {
  id: string | null;
  title: string;
  slug: string;
  category: MerchCategory;
  description: string;
  design: string | null;
  colors: string[];
  defaultColor: string;
  printOffsetY: number;
  printScale: number;
  status: "published" | "draft";
  featured: boolean;
  /** "" = use the category price. */
  basePrice: string;
  baseCurrency: CurrencyCode;
};

function toDraft(item?: MerchItem): Draft {
  return {
    id: item?.id ?? null,
    title: item?.title ?? "",
    slug: item?.slug ?? "",
    category: item?.category ?? "tshirt",
    description: item?.description ?? "",
    design: item?.design ?? null,
    colors: item?.colors ?? COLORS.map((c) => c.key),
    defaultColor: item?.defaultColor ?? COLORS[0].key,
    // Optional chaining on purpose: an item echoed back by the API before the
    // server picked up this field would otherwise blank the editor.
    printOffsetY: item?.print?.offsetY ?? 0,
    printScale: item?.print?.scale ?? 1,
    status: item?.status ?? "draft",
    featured: Boolean(item?.featured),
    basePrice: item?.basePrice ? String(item.basePrice) : "",
    baseCurrency: item?.baseCurrency ?? DEFAULT_BASE_CURRENCY,
  };
}

function toPayload(draft: Draft) {
  return {
    title: draft.title,
    slug: draft.slug,
    category: draft.category,
    description: draft.description,
    design: draft.design,
    colors: draft.colors,
    defaultColor: draft.defaultColor,
    printOffsetY: draft.printOffsetY,
    printScale: draft.printScale,
    status: draft.status,
    featured: draft.featured,
    basePrice: Number(draft.basePrice) || null,
    baseCurrency: draft.baseCurrency,
  };
}

export function StoreManager({
  initial,
  pricing: initialPricing,
  templates: initialTemplates,
  fx,
}: {
  initial: MerchItem[];
  pricing: MerchPricing;
  templates: MerchTemplates;
  fx: FxRates | null;
}) {
  const router = useRouter();
  const [items, setItems] = useState<MerchItem[]>(initial);
  const [pricing, setPricing] = useState<MerchPricing>(initialPricing);
  const [templates, setTemplates] = useState<MerchTemplates>(initialTemplates);
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
    if (!draft.colors.length) {
      setError("Choose at least one colour.");
      return;
    }
    setBusy(true);
    setError(null);

    const editing = Boolean(draft.id);
    try {
      const res = await fetch(editing ? `/api/store/${draft.id}/` : "/api/store/", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(draft)),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data?.error || "Could not save the design");

      const item: MerchItem = data.item;
      setItems((prev) =>
        editing ? prev.map((m) => (m.id === item.id ? item : m)) : [...prev, item]
      );
      setDraft(toDraft(item));
      note(editing ? "Saved." : "Design created.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the design");
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: MerchItem) {
    if (
      !confirm(
        `Delete “${item.title}”? Existing orders keep their record; the design simply leaves the store.`
      )
    ) {
      return;
    }
    setItems((prev) => prev.filter((m) => m.id !== item.id));
    if (draft?.id === item.id) setDraft(null);
    await fetch(`/api/store/${item.id}/`, { method: "DELETE" }).catch(() => {});
    router.refresh();
  }

  async function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[index], next[j]] = [next[j], next[index]];
    setItems(next);
    await fetch("/api/store/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reorder", ids: next.map((m) => m.id) }),
    }).catch(() => {});
    router.refresh();
  }

  /* ------------------------------- Editor ------------------------------- */

  if (draft) {
    return (
      <Shell
        title={draft.id ? "Edit design" : "New design"}
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

        <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
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
                    placeholder="Fire on the Altar"
                  />
                </label>
                <div className="block">
                  <span className={labelCls}>Goes on</span>
                  <div className="flex gap-2">
                    {CATEGORY_KEYS.map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setDraft({ ...draft, category: key })}
                        aria-pressed={draft.category === key}
                        className={`flex-1 px-3 py-2 border text-[11px] tracking-[0.16em] uppercase transition-colors ${
                          draft.category === key
                            ? "border-gold bg-gold text-midnight"
                            : "border-midnight/20 text-midnight/60 hover:border-gold"
                        }`}
                      >
                        {CATEGORIES[key].label}
                      </button>
                    ))}
                  </div>
                </div>
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

            {/* LIVE PREVIEW — exactly what the shop will draw. */}
            <div className="bg-white border border-midnight/12 p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <span className={`${labelCls} !mb-0`}>How it will look</span>
                <span className="text-[11px] text-midnight/45">
                  {colorByKey(draft.defaultColor).label} · every angle
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {visibleViews(draft.category, templates[draft.category]).map((view) => (
                  <div key={view} className="text-center">
                    <div className="relative aspect-[5/6] bg-ivory-dark border border-midnight/10">
                      <Mockup
                        templates={templates[draft.category]}
                        category={draft.category}
                        view={view}
                        color={colorByKey(draft.defaultColor).hex}
                        design={draft.design}
                        print={{ offsetY: draft.printOffsetY, scale: draft.printScale }}
                        className="absolute inset-0 h-full w-full"
                      />
                    </div>
                    <p className="mt-1.5 text-[10px] tracking-[0.16em] uppercase text-midnight/50">
                      {viewLabel(draft.category, view)}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-midnight/40 leading-relaxed">
                Shoppers pick any colour below and see all five angles in it. The print
                sits on the {draft.category === "cap" ? "front panel" : "chest"}.
                {Object.keys(templates[draft.category]).length === 0 &&
                  " Upload photos in “Photo mockups” on the store list to replace the drawing with real photographs."}
              </p>
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
            <DesignPanel draft={draft} setDraft={setDraft} />
            <PrintPanel draft={draft} setDraft={setDraft} />
            <ColorsPanel draft={draft} setDraft={setDraft} />
            <PricePanel draft={draft} setDraft={setDraft} pricing={pricing} fx={fx} />
          </div>
        </div>
      </Shell>
    );
  }

  /* -------------------------------- List -------------------------------- */

  return (
    <Shell
      title="Store"
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
            <Plus size={14} /> New design
          </button>
        </div>
      }
    >
      <PricingPanel
        pricing={pricing}
        fx={fx}
        onSaved={(p) => {
          setPricing(p);
          note("Prices saved — every design in each category now uses them.");
          router.refresh();
        }}
      />

      <TemplateEditor
        initial={templates}
        onSaved={(t) => {
          setTemplates(t);
          router.refresh();
        }}
      />

      {items.length === 0 ? (
        <div className="bg-white border border-midnight/12 px-8 py-16 text-center mt-6">
          <Shirt className="mx-auto text-gold-deep" size={32} />
          <h2 className="font-display text-2xl text-midnight mt-4">No designs yet</h2>
          <p className="mt-3 text-sm text-midnight/60 max-w-sm mx-auto">
            Upload a design, say whether it goes on a T-shirt or a cap, choose the colours
            it comes in, and publish. The site draws the garment from every angle.
          </p>
          <button
            onClick={() => setDraft(toDraft())}
            className="btn-gold mt-7 !py-2.5 !px-5 !text-[11px]"
          >
            <Plus size={14} /> New design
          </button>
        </div>
      ) : (
        <ul className="space-y-3 mt-6">
          {items.map((item, i) => {
            const priced = Object.keys(item.prices).length > 0;
            const live = item.status === "published" && Boolean(item.design) && priced;
            const info = CATEGORIES[item.category];
            return (
              <li
                key={item.id}
                className="bg-white border border-midnight/12 p-4 flex gap-4 items-start"
              >
                <div className="relative w-16 aspect-[5/6] shrink-0 bg-ivory-dark">
                  <Mockup
                    templates={templates[item.category]}
                    category={item.category}
                    view="front"
                    color={colorByKey(item.defaultColor).hex}
                    design={item.design}
                    print={item.print}
                    quality="lite"
                    className="absolute inset-0 h-full w-full"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg text-midnight leading-tight">
                      {item.title}
                    </h3>
                    <span className="text-[10px] tracking-[0.16em] uppercase px-2 py-0.5 border border-midnight/20 text-midnight/60">
                      {info.label}
                    </span>
                    <span
                      className={`text-[10px] tracking-[0.16em] uppercase px-2 py-0.5 border ${
                        live
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : "bg-midnight/5 text-midnight/50 border-midnight/20"
                      }`}
                    >
                      {live ? "Live" : item.status}
                    </span>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-midnight/55">
                    <span className={item.design ? "" : "text-midnight-soft inline-flex items-center gap-1"}>
                      {item.design ? (
                        `${item.colors.length} colour${item.colors.length === 1 ? "" : "s"}`
                      ) : (
                        <>
                          <AlertTriangle size={12} /> No design uploaded
                        </>
                      )}
                    </span>
                    <span>
                      {formatPrice(item.effectivePrice, item.effectiveCurrency)}{" "}
                      {item.effectiveCurrency}
                      <span className="text-midnight/40">
                        {" "}
                        · {item.basePrice ? "custom" : `${info.label} price`}
                      </span>
                    </span>
                  </div>

                  {item.status === "published" && !item.design && (
                    <p className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] text-midnight-soft">
                      <AlertTriangle size={12} />
                      Hidden from the store until a design is uploaded.
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
                      setDraft(toDraft(item));
                    }}
                    className="ml-1 text-[11px] tracking-[0.16em] uppercase text-midnight/60 hover:text-gold-deep px-3 py-2 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(item)}
                    aria-label={`Delete ${item.title}`}
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

function PublishPanel({ draft, setDraft }: { draft: Draft; setDraft: (d: Draft) => void }) {
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
        Feature this design
      </label>

      {draft.id && (
        <Link
          href={`/store/${draft.slug}/`}
          target="_blank"
          className="mt-4 block text-[11px] text-gold-deep hover:text-midnight transition-colors"
        >
          View on the site →
        </Link>
      )}
    </div>
  );
}

function DesignPanel({ draft, setDraft }: { draft: Draft; setDraft: (d: Draft) => void }) {
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
      const res = await fetch("/api/upload/", { method: "POST", body: fd });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      // The original file, not the compressed variant: a PNG's transparency
      // is the whole point of a print-ready design.
      setDraft({ ...draft, design: data.originalUrl || data.url });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="bg-white border border-midnight/12 p-5">
      <p className={labelCls}>The design</p>

      {draft.design ? (
        <div
          className="relative aspect-square w-full border border-midnight/10"
          // A checkerboard, so transparency reads as transparency.
          style={{
            backgroundImage:
              "linear-gradient(45deg,#eee 25%,transparent 25%),linear-gradient(-45deg,#eee 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#eee 75%),linear-gradient(-45deg,transparent 75%,#eee 75%)",
            backgroundSize: "16px 16px",
            backgroundPosition: "0 0,0 8px,8px -8px,-8px 0",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={draft.design}
            alt="Design"
            className="absolute inset-0 h-full w-full object-contain p-3"
          />
          <button
            type="button"
            onClick={() => setDraft({ ...draft, design: null })}
            aria-label="Remove design"
            className="absolute top-2 right-2 bg-white/90 p-1.5 text-midnight/60 hover:text-midnight-soft transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="aspect-square w-full border border-dashed border-midnight/20 flex flex-col items-center justify-center gap-2 text-midnight/35">
          <ImagePlus size={26} />
          <span className="text-xs">No design yet</span>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/svg+xml,image/webp,image/jpeg"
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
            <ImagePlus size={13} /> {draft.design ? "Replace" : "Upload"} design
          </>
        )}
      </button>

      {error && <p className="mt-2 text-xs text-midnight-soft">{error}</p>}
      <p className="mt-2 text-[11px] text-midnight/40 leading-relaxed">
        A PNG or SVG with a transparent background works best — the fabric shows
        through around it. Up to 8MB.
      </p>
    </div>
  );
}

/** Where the design sits: nudged up or down, and how large. */
function PrintPanel({ draft, setDraft }: { draft: Draft; setDraft: (d: Draft) => void }) {
  const nudge = (delta: number) =>
    setDraft({ ...draft, printOffsetY: Math.max(-60, Math.min(60, draft.printOffsetY + delta)) });
  const changed = draft.printOffsetY !== 0 || draft.printScale !== 1;
  return (
    <div className="bg-white border border-midnight/12 p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className={`${labelCls} !mb-0`}>Print position</p>
        {changed && (
          <button
            type="button"
            onClick={() => setDraft({ ...draft, printOffsetY: 0, printScale: 1 })}
            className="text-[11px] text-gold-deep hover:text-midnight transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => nudge(-5)}
          aria-label="Move the print up"
          className="border border-midnight/20 p-2 text-midnight/70 hover:border-gold hover:text-gold-deep transition-colors"
        >
          <ChevronUp size={14} />
        </button>
        <input
          type="range"
          min={-60}
          max={60}
          step={1}
          value={draft.printOffsetY}
          onChange={(e) => setDraft({ ...draft, printOffsetY: Number(e.target.value) })}
          aria-label="Vertical position"
          className="flex-1 accent-gold"
        />
        <button
          type="button"
          onClick={() => nudge(5)}
          aria-label="Move the print down"
          className="border border-midnight/20 p-2 text-midnight/70 hover:border-gold hover:text-gold-deep transition-colors"
        >
          <ChevronDown size={14} />
        </button>
      </div>
      <p className="mt-1.5 text-[11px] text-midnight/45">
        {draft.printOffsetY === 0
          ? "Sitting at its usual height"
          : `${Math.abs(draft.printOffsetY)}% ${draft.printOffsetY < 0 ? "higher" : "lower"} than usual`}
      </p>

      <label className="block mt-4">
        <span className={labelCls}>Size</span>
        <input
          type="range"
          min={30}
          max={130}
          step={5}
          value={Math.round(draft.printScale * 100)}
          onChange={(e) => setDraft({ ...draft, printScale: Number(e.target.value) / 100 })}
          aria-label="Print size"
          className="w-full accent-gold"
        />
        <span className="block mt-1 text-[11px] text-midnight/45">
          {Math.round(draft.printScale * 100)}% of the print area
        </span>
      </label>

      <p className="mt-3 text-[11px] text-midnight/40 leading-relaxed">
        Applies to every angle and colour of this design. The preview above follows it live.
      </p>
    </div>
  );
}

function ColorsPanel({ draft, setDraft }: { draft: Draft; setDraft: (d: Draft) => void }) {
  function toggle(key: string) {
    const on = draft.colors.includes(key);
    const colors = on ? draft.colors.filter((c) => c !== key) : [...draft.colors, key];
    // Keep the palette's order so the shop lists colours consistently.
    const ordered = COLORS.map((c) => c.key).filter((k) => colors.includes(k));
    const defaultColor = ordered.includes(draft.defaultColor) ? draft.defaultColor : ordered[0] ?? "";
    setDraft({ ...draft, colors: ordered, defaultColor });
  }

  return (
    <div className="bg-white border border-midnight/12 p-5">
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className={`${labelCls} !mb-0`}>Colours offered</p>
        <button
          type="button"
          onClick={() =>
            setDraft({
              ...draft,
              colors:
                draft.colors.length === COLORS.length ? [] : COLORS.map((c) => c.key),
            })
          }
          className="text-[11px] text-gold-deep hover:text-midnight transition-colors"
        >
          {draft.colors.length === COLORS.length ? "None" : "All"}
        </button>
      </div>

      <ul className="grid grid-cols-2 gap-1.5">
        {COLORS.map((c) => {
          const on = draft.colors.includes(c.key);
          return (
            <li key={c.key}>
              <button
                type="button"
                onClick={() => toggle(c.key)}
                aria-pressed={on}
                className={`w-full flex items-center gap-2 px-2 py-1.5 border text-xs transition-colors ${
                  on ? "border-gold bg-gold/10 text-midnight" : "border-midnight/12 text-midnight/50"
                }`}
              >
                <span
                  className="h-4 w-4 rounded-full border border-midnight/20 shrink-0"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="truncate">{c.label}</span>
                {on && <Check size={12} className="ml-auto text-gold-deep shrink-0" />}
              </button>
            </li>
          );
        })}
      </ul>

      <label className="block mt-4">
        <span className={labelCls}>Shown first</span>
        <select
          className={inputCls}
          value={draft.defaultColor}
          onChange={(e) => setDraft({ ...draft, defaultColor: e.target.value })}
        >
          {draft.colors.map((k) => (
            <option key={k} value={k}>
              {colorByKey(k).label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function PricePanel({
  draft,
  setDraft,
  pricing,
  fx,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  pricing: MerchPricing;
  fx: FxRates | null;
}) {
  const categoryMoney = pricing[draft.category];
  const custom = Number(draft.basePrice) > 0;
  const money = effectiveMoney(
    { category: draft.category, basePrice: custom ? Number(draft.basePrice) : null, baseCurrency: draft.baseCurrency },
    pricing
  );
  // Exactly the calculation the shop will run, so what the admin sees here is
  // what a shopper sees — no second implementation to drift out of step.
  const preview = computePrices(money.basePrice, money.baseCurrency, fx?.rates ?? null);
  const belowMinimum = custom && Number(draft.basePrice) < CURRENCIES[draft.baseCurrency].min;

  return (
    <div className="bg-white border border-midnight/12 p-5">
      <p className={labelCls}>Price</p>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setDraft({ ...draft, basePrice: "" })}
          aria-pressed={!custom}
          className={`w-full text-left px-3 py-2.5 border transition-colors ${
            !custom ? "border-gold bg-gold/10" : "border-midnight/15 hover:border-gold"
          }`}
        >
          <span className="block text-xs text-midnight">
            {CATEGORIES[draft.category].label} price
          </span>
          <span className="block font-display text-lg text-midnight">
            {formatPrice(categoryMoney.basePrice, categoryMoney.baseCurrency)}{" "}
            <span className="text-xs text-midnight/45">{categoryMoney.baseCurrency}</span>
          </span>
        </button>

        <div
          className={`px-3 py-2.5 border transition-colors ${
            custom ? "border-gold bg-gold/10" : "border-midnight/15"
          }`}
        >
          <span className="block text-xs text-midnight mb-1.5">Custom price for this design</span>
          <div className="flex gap-2">
            <select
              value={draft.baseCurrency}
              onChange={(e) => setDraft({ ...draft, baseCurrency: e.target.value as CurrencyCode })}
              aria-label="Currency"
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
              aria-label="Custom price"
              className={`${controlCls} flex-1 min-w-0`}
              value={draft.basePrice}
              onChange={(e) => setDraft({ ...draft, basePrice: e.target.value })}
              placeholder="leave blank to use the category price"
            />
          </div>
        </div>
      </div>

      {belowMinimum && (
        <p className="mt-2.5 flex items-start gap-1.5 text-[11px] text-midnight-soft leading-relaxed">
          <AlertTriangle size={12} className="shrink-0 mt-0.5" />
          The smallest amount the payment gateway will take in {draft.baseCurrency} is{" "}
          {formatPrice(CURRENCIES[draft.baseCurrency].min, draft.baseCurrency)}.
        </p>
      )}

      <p className="mt-2.5 flex items-start gap-1.5 text-[11px] text-midnight/45 leading-relaxed">
        <Wand2 size={12} className="text-gold-deep shrink-0 mt-0.5" />
        Every other currency is worked out from this at today&rsquo;s rate and rounded
        up to a tidy figure.
      </p>

      <div className="mt-5 border-t border-midnight/10 pt-4">
        <p className="text-[10px] tracking-[0.2em] uppercase text-midnight/45 mb-2.5">
          Shoppers will pay
        </p>
        {!fx && (
          <p className="mb-3 flex items-start gap-1.5 text-[11px] text-midnight-soft leading-relaxed">
            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
            No exchange rates available, so this can only be sold in {money.baseCurrency}{" "}
            until rates are fetched.
          </p>
        )}
        <ul className="space-y-1">
          {CURRENCY_CODES.map((code) => {
            const amount = preview[code];
            return (
              <li key={code} className="flex items-baseline justify-between gap-3 text-xs">
                <span className="text-midnight/50">
                  {code}
                  {code === money.baseCurrency && (
                    <span className="ml-1.5 text-[9px] tracking-wider uppercase text-midnight/40">
                      base
                    </span>
                  )}
                </span>
                <span className={amount ? "text-midnight tabular-nums" : "text-midnight/30 tabular-nums"}>
                  {amount ? formatPrice(amount, code) : "not sold"}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** Store-wide prices: one per category, plus delivery. */
function PricingPanel({
  pricing,
  fx,
  onSaved,
}: {
  pricing: MerchPricing;
  fx: FxRates | null;
  onSaved: (p: MerchPricing) => void;
}) {
  const [draft, setDraft] = useState<{
    tshirt: { basePrice: string; baseCurrency: CurrencyCode };
    cap: { basePrice: string; baseCurrency: CurrencyCode };
    shipping: { basePrice: string; baseCurrency: CurrencyCode };
  }>({
    tshirt: { basePrice: String(pricing.tshirt.basePrice), baseCurrency: pricing.tshirt.baseCurrency },
    cap: { basePrice: String(pricing.cap.basePrice), baseCurrency: pricing.cap.baseCurrency },
    shipping: {
      basePrice: pricing.shipping.basePrice ? String(pricing.shipping.basePrice) : "",
      baseCurrency: pricing.shipping.baseCurrency,
    },
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const dirty =
    Number(draft.tshirt.basePrice) !== pricing.tshirt.basePrice ||
    draft.tshirt.baseCurrency !== pricing.tshirt.baseCurrency ||
    Number(draft.cap.basePrice) !== pricing.cap.basePrice ||
    draft.cap.baseCurrency !== pricing.cap.baseCurrency ||
    (Number(draft.shipping.basePrice) || 0) !== pricing.shipping.basePrice ||
    draft.shipping.baseCurrency !== pricing.shipping.baseCurrency;

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/store/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pricing",
          pricing: {
            tshirt: { basePrice: Number(draft.tshirt.basePrice) || 0, baseCurrency: draft.tshirt.baseCurrency },
            cap: { basePrice: Number(draft.cap.basePrice) || 0, baseCurrency: draft.cap.baseCurrency },
            shipping: {
              basePrice: Number(draft.shipping.basePrice) || 0,
              baseCurrency: draft.shipping.baseCurrency,
            },
          },
        }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data?.error || "Could not save prices");
      onSaved(data.pricing);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save prices");
    } finally {
      setBusy(false);
    }
  }

  const rows: { key: "tshirt" | "cap" | "shipping"; label: string; hint: string }[] = [
    { key: "tshirt", label: "T-shirt", hint: "every T-shirt design" },
    { key: "cap", label: "Cap", hint: "every cap design" },
    { key: "shipping", label: "Delivery", hint: "once per order · blank = free" },
  ];

  return (
    <div className="bg-white border border-midnight/12 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className={labelCls}>Store prices</p>
          <p className="text-xs text-midnight/55 leading-relaxed max-w-md">
            Set one price per category and every design in it follows — a design can
            still carry its own price in its editor. Other currencies convert at{" "}
            {fx ? "today's" : "the last known"} rate.
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={busy || !dirty}
          className="btn-gold !py-2 !px-4 !text-[11px] disabled:opacity-50"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Save prices
        </button>
      </div>

      <div className="mt-5 grid sm:grid-cols-3 gap-4">
        {rows.map((row) => (
          <div key={row.key}>
            <span className={labelCls}>
              {row.label}{" "}
              <span className="normal-case tracking-normal text-midnight/40">· {row.hint}</span>
            </span>
            <div className="flex gap-2">
              <select
                value={draft[row.key].baseCurrency}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    [row.key]: { ...draft[row.key], baseCurrency: e.target.value as CurrencyCode },
                  })
                }
                aria-label={`${row.label} currency`}
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
                aria-label={`${row.label} price`}
                className={`${controlCls} flex-1 min-w-0`}
                value={draft[row.key].basePrice}
                onChange={(e) =>
                  setDraft({ ...draft, [row.key]: { ...draft[row.key], basePrice: e.target.value } })
                }
                placeholder={row.key === "shipping" ? "0" : "25"}
              />
            </div>
          </div>
        ))}
      </div>

      {message && <p className="mt-3 text-xs text-midnight-soft">{message}</p>}
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
              <h1 className="font-display text-xl sm:text-2xl mt-1 leading-none">{title}</h1>
            </div>
            <AdminTabs />
          </div>
          {action}
        </div>
      </header>

      {flash && (
        <div className="bg-gold/15 border-b border-gold/40">
          <p className="mx-auto max-w-6xl px-5 sm:px-6 py-2.5 text-xs text-midnight">{flash}</p>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-5 sm:px-6 py-8">{children}</main>
    </div>
  );
}
