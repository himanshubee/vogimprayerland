"use client";

import { useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Check,
  Upload,
  Loader2,
  RefreshCw,
  Search,
  ChevronDown,
  Eye,
  X,
} from "lucide-react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { SeoPanel } from "@/components/admin/SeoPanel";
import type { PageSchema, FieldDef } from "@/lib/page-content";
import type { PostSeo } from "@/lib/seo-analysis";

const inputCls =
  "w-full bg-white border border-midnight/15 px-3 py-2.5 text-sm outline-none focus:border-gold transition-colors";
const labelCls = "block text-[11px] tracking-[0.12em] uppercase text-midnight/55 mb-1.5";

function previewSrc(path: string, tick: number) {
  const base = path.endsWith("/") ? path : `${path}/`;
  return `${base}?cmsv=${tick}`;
}

export function PageEditor({
  schema,
  initial,
  initialSeo,
}: {
  schema: PageSchema;
  initial: Record<string, string>;
  initialSeo: PostSeo;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [seo, setSeo] = useState<PostSeo>(initialSeo);
  const [showSeo, setShowSeo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  // Live preview is opt-in (loads only when opened / refreshed).
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const [previewStale, setPreviewStale] = useState(false);
  const [tick, setTick] = useState(0);

  const firstGroup = schema.fields[0]?.group ?? "Content";
  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set([firstGroup])
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const groups = useMemo(() => {
    const map = new Map<string, FieldDef[]>();
    for (const f of schema.fields) {
      const g = f.group ?? "Content";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(f);
    }
    return Array.from(map.entries());
  }, [schema]);

  const save = useCallback(
    async (next: Record<string, string>, nextSeo: PostSeo) => {
      setSaveState("saving");
      setError(null);
      try {
        const res = await fetch(`/api/page-content/${schema.key}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ values: next, seo: nextSeo }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Save failed");
        setSaveState("saved");
        setPreviewStale(true); // preview (if open) now shows older content
        router.refresh();
      } catch (e) {
        setSaveState("idle");
        setError(e instanceof Error ? e.message : "Save failed");
      }
    },
    [schema.key, router]
  );

  function schedule(next: Record<string, string>, nextSeo: PostSeo) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(next, nextSeo), 800);
  }
  function set(key: string, val: string) {
    const next = { ...values, [key]: val };
    setValues(next);
    schedule(next, seo);
  }
  function patchSeo(patch: Partial<PostSeo>) {
    const nextSeo = { ...seo, ...patch };
    setSeo(nextSeo);
    schedule(values, nextSeo);
  }
  async function saveNow() {
    setBusy(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    await save(values, seo);
    setBusy(false);
  }

  function toggleSection(g: string) {
    setOpenSections((prev) => {
      const n = new Set(prev);
      if (n.has(g)) n.delete(g);
      else n.add(g);
      return n;
    });
  }
  function jumpToSection(g: string) {
    setOpenSections((prev) => new Set(prev).add(g));
    requestAnimationFrame(() =>
      sectionRefs.current[g]?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  }
  function openPreview() {
    setPreviewReady(false);
    setPreviewStale(false);
    setTick((t) => t + 1);
    setPreviewOpen(true);
  }
  function refreshPreview() {
    setPreviewReady(false);
    setPreviewStale(false);
    setTick((t) => t + 1);
  }

  return (
    <div className="h-screen flex flex-col bg-ivory-dark text-ink overflow-hidden">
      {/* TOP BAR */}
      <header className="shrink-0 z-20 bg-midnight text-white">
        <div className="px-5 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5 min-w-0">
            <div className="min-w-0">
              <p className="eyebrow text-gold leading-none">VOGIM Admin</p>
              <h1 className="font-display text-lg sm:text-xl mt-1 leading-none truncate">
                Editing: {schema.label}
              </h1>
            </div>
            <AdminTabs />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden md:inline text-[11px] text-white/45 tabular-nums">
              {saveState === "saving"
                ? "Saving…"
                : saveState === "saved"
                ? "Saved ✓ live"
                : "Autosaves"}
            </span>
            <button
              onClick={() => setShowSeo((v) => !v)}
              className={`inline-flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase border px-3 py-2 transition-colors ${
                showSeo ? "border-gold text-gold bg-white/10" : "border-white/25 text-white/80 hover:bg-white/10"
              }`}
            >
              <Search size={13} /> SEO
            </button>
            <button
              onClick={() => (previewOpen ? setPreviewOpen(false) : openPreview())}
              className={`inline-flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase border px-3 py-2 transition-colors ${
                previewOpen ? "border-gold text-gold bg-white/10" : "border-white/25 text-white/80 hover:bg-white/10"
              }`}
            >
              <Eye size={13} /> Live preview
            </button>
            <Link
              href="/admin/pages"
              className="hidden sm:inline-flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase border border-white/25 text-white/80 px-3 py-2 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={13} /> Pages
            </Link>
            <button
              onClick={saveNow}
              disabled={busy || saveState === "saving"}
              className="btn-gold !py-2 !px-4 !text-[11px] disabled:opacity-50"
            >
              {saveState === "saved" ? <Check size={14} /> : <Save size={14} />}
              {saveState === "saving" || busy ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </header>

      {showSeo && (
        <div className="shrink-0 max-h-[55vh] overflow-y-auto border-b border-midnight/10 bg-ivory-dark px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] tracking-[0.18em] uppercase text-midnight/55">
              Page URL (slug):{" "}
              <span className="text-midnight font-mono normal-case tracking-normal">
                {schema.path}
              </span>
            </p>
            <span className="text-[10px] text-midnight/40">
              Fixed route — use a Blog/Page entry for a custom slug
            </span>
          </div>
          <SeoPanel
            seo={seo}
            onChange={patchSeo}
            title={(values.heroTitle || schema.label || "")
              .replace(/_/g, "")
              .replace(/\n/g, " ")
              .replace(/\s+/g, " ")
              .trim()}
            slug={schema.path === "/" ? "" : schema.path.replace(/^\//, "")}
            excerpt={values.heroIntro || ""}
            content={Object.values(values).join("  ")}
            featuredImage={values.heroImage || seo.ogImage || null}
          />
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        {/* FIELDS */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* section quick-nav */}
          <div className="shrink-0 flex items-center gap-1.5 overflow-x-auto px-4 py-2.5 border-b border-midnight/10 bg-white/60">
            <span className="text-[10px] tracking-[0.18em] uppercase text-midnight/40 shrink-0 mr-1">
              Sections
            </span>
            {groups.map(([g]) => (
              <button
                key={g}
                onClick={() => jumpToSection(g)}
                className="shrink-0 text-[10px] tracking-[0.12em] uppercase px-2.5 py-1.5 border border-midnight/15 text-midnight/60 hover:border-gold hover:text-gold-deep transition-colors"
              >
                {g}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
            <div className={`mx-auto w-full ${previewOpen ? "max-w-2xl" : "max-w-3xl"}`}>
              {error && (
                <div className="border border-red-300 bg-red-50 text-red-700 text-sm px-4 py-3 mb-4">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                {groups.map(([group, fields]) => {
                  const isOpen = openSections.has(group);
                  return (
                    <section
                      key={group}
                      ref={(el) => {
                        sectionRefs.current[group] = el;
                      }}
                      className="bg-white border border-midnight/10 scroll-mt-2"
                    >
                      <button
                        onClick={() => toggleSection(group)}
                        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-ivory/40 transition-colors"
                      >
                        <span className="font-display text-lg text-midnight">{group}</span>
                        <span className="flex items-center gap-2">
                          <span className="text-[11px] text-midnight/35">
                            {fields.length} field{fields.length === 1 ? "" : "s"}
                          </span>
                          <ChevronDown
                            size={16}
                            className={`text-midnight/40 transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </span>
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 grid sm:grid-cols-2 gap-x-5 gap-y-4">
                          {fields.map((f) => (
                            <div
                              key={f.key}
                              className={
                                f.type === "textarea" || f.type === "image"
                                  ? "sm:col-span-2"
                                  : ""
                              }
                            >
                              <FieldInput
                                field={f}
                                value={values[f.key] ?? ""}
                                onChange={(v) => set(f.key, v)}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-3 mt-6 pb-10">
                <button
                  onClick={() =>
                    setOpenSections((prev) =>
                      prev.size === groups.length
                        ? new Set([firstGroup])
                        : new Set(groups.map(([g]) => g))
                    )
                  }
                  className="text-xs text-midnight/50 hover:text-midnight"
                >
                  {openSections.size === groups.length ? "Collapse all" : "Expand all"}
                </button>
                <button
                  onClick={saveNow}
                  disabled={busy || saveState === "saving"}
                  className="btn-gold disabled:opacity-50"
                >
                  {saveState === "saved" ? <Check size={16} /> : <Save size={16} />}
                  {saveState === "saving" || busy ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* LIVE PREVIEW (on demand) */}
        {previewOpen && (
          <aside className="hidden lg:flex w-[46%] max-w-[760px] shrink-0 flex-col border-l border-midnight/10 bg-midnight/5">
            <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-midnight/10 bg-white/70">
              <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase text-midnight/55">
                <Eye size={13} /> Preview {schema.path}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={refreshPreview}
                  className={`inline-flex items-center gap-1.5 text-[11px] ${
                    previewStale ? "text-gold-deep font-medium" : "text-midnight/55"
                  } hover:text-gold-deep`}
                >
                  <RefreshCw size={12} /> {previewStale ? "Refresh (new edits)" : "Refresh"}
                </button>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="text-midnight/45 hover:text-midnight"
                  aria-label="Close preview"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
            <div className="flex-1 relative">
              {!previewReady && (
                <div className="absolute inset-0 flex items-center justify-center text-midnight/40">
                  <Loader2 className="animate-spin" size={22} />
                </div>
              )}
              <iframe
                key={tick}
                src={previewSrc(schema.path, tick)}
                title="Live preview"
                onLoad={() => setPreviewReady(true)}
                className="w-full h-full border-0 bg-white"
              />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className={labelCls}>{field.label}</label>
      {field.type === "image" ? (
        <ImageField value={value} onChange={onChange} />
      ) : field.type === "textarea" ? (
        <textarea
          className={inputCls}
          rows={value.length > 120 ? 4 : 2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
      {field.hint && <p className="text-[11px] text-midnight/40 mt-1">{field.hint}</p>}
    </div>
  );
}

function ImageField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function upload(file: File) {
    setUploading(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      onChange(data.url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex gap-3 items-start">
      <div className="relative w-20 h-14 bg-midnight/5 border border-midnight/10 shrink-0 overflow-hidden">
        {value && (
          <Image src={value} alt="" fill className="object-cover" sizes="80px" unoptimized />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <input
          className={inputCls}
          value={value}
          placeholder="Image URL"
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 mt-2 text-xs text-gold-deep hover:underline disabled:opacity-50"
        >
          {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
          {uploading ? "Uploading…" : "Upload new"}
        </button>
        {err && <p className="text-[11px] text-red-600 mt-1">{err}</p>}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
      </div>
    </div>
  );
}
