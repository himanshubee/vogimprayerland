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
  Monitor,
  RefreshCw,
} from "lucide-react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import type { PageSchema, FieldDef } from "@/lib/page-content";

const inputCls =
  "w-full bg-white border border-midnight/15 px-3 py-2.5 text-sm outline-none focus:border-gold transition-colors";
const labelCls = "block text-[11px] tracking-[0.12em] uppercase text-midnight/55 mb-1.5";

// Path → iframe URL (keep the trailing slash the site uses, add a cache-buster).
function previewSrc(path: string, tick: number) {
  const base = path.endsWith("/") ? path : `${path}/`;
  return `${base}?cmsv=${tick}`;
}

export function PageEditor({
  schema,
  initial,
}: {
  schema: PageSchema;
  initial: Record<string, string>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(1);
  const [previewReady, setPreviewReady] = useState(false);

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

  // Save edits straight to the live page, then reload the preview to show them.
  const save = useCallback(
    async (next: Record<string, string>) => {
      setSaveState("saving");
      setError(null);
      try {
        const res = await fetch(`/api/page-content/${schema.key}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ values: next }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Save failed");
        setSaveState("saved");
        setTick((t) => t + 1); // reload preview with the saved content
        router.refresh();
      } catch (e) {
        setSaveState("idle");
        setError(e instanceof Error ? e.message : "Save failed");
      }
    },
    [schema.key, router]
  );

  function set(key: string, val: string) {
    const next = { ...values, [key]: val };
    setValues(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(next), 800);
  }

  async function saveNow() {
    setBusy(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    await save(values);
    setBusy(false);
  }

  function scrollToGroup(g: string) {
    sectionRefs.current[g]?.scrollIntoView({ behavior: "smooth", block: "start" });
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
                ? "Saved ✓ — live on the site"
                : "Edits save automatically"}
            </span>
            <Link
              href="/admin/pages"
              className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.2em] uppercase border border-white/25 text-white/80 px-3 py-2 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={13} /> Pages
            </Link>
            <button
              onClick={saveNow}
              disabled={busy || saveState === "saving"}
              className="btn-gold !py-2 !px-4 !text-[11px] disabled:opacity-50"
            >
              {saveState === "saved" ? <Check size={14} /> : <Save size={14} />}
              {saveState === "saving" || busy ? "Saving…" : "Save now"}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* LEFT: fields */}
        <div className="w-full lg:w-[440px] xl:w-[480px] shrink-0 flex flex-col border-r border-midnight/10 bg-ivory-dark">
          {/* section nav */}
          <div className="shrink-0 flex gap-1.5 overflow-x-auto px-4 py-2.5 border-b border-midnight/10 bg-white/60">
            {groups.map(([g]) => (
              <button
                key={g}
                onClick={() => scrollToGroup(g)}
                className="shrink-0 text-[10px] tracking-[0.14em] uppercase px-2.5 py-1.5 border border-midnight/15 text-midnight/60 hover:border-gold hover:text-gold-deep transition-colors"
              >
                {g}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
            {error && (
              <div className="border border-red-300 bg-red-50 text-red-700 text-sm px-4 py-3">
                {error}
              </div>
            )}
            {groups.map(([group, fields]) => (
              <section
                key={group}
                ref={(el) => {
                  sectionRefs.current[group] = el;
                }}
                className="bg-white border border-midnight/10 p-4 scroll-mt-2"
              >
                <h2 className="font-display text-lg text-midnight mb-4">{group}</h2>
                <div className="space-y-3.5">
                  {fields.map((f) => (
                    <FieldInput
                      key={f.key}
                      field={f}
                      value={values[f.key] ?? ""}
                      onChange={(v) => set(f.key, v)}
                    />
                  ))}
                </div>
              </section>
            ))}
            <div className="pb-8">
              <button
                onClick={saveNow}
                disabled={busy || saveState === "saving"}
                className="btn-gold w-full justify-center disabled:opacity-50"
              >
                {saveState === "saved" ? <Check size={16} /> : <Save size={16} />}
                {saveState === "saving" || busy ? "Saving…" : "Save now"}
              </button>
              <p className="text-center text-[11px] text-midnight/45 mt-2">
                Changes save automatically as you type and go live on the page.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: live preview */}
        <div className="hidden lg:flex flex-1 flex-col bg-midnight/5 min-w-0">
          <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-midnight/10 bg-white/60">
            <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase text-midnight/55">
              <Monitor size={13} /> Live preview {schema.path}
            </span>
            <button
              onClick={() => setTick((t) => t + 1)}
              className="inline-flex items-center gap-1.5 text-[11px] text-midnight/55 hover:text-gold-deep"
            >
              <RefreshCw size={12} /> Refresh
            </button>
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
        </div>
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
