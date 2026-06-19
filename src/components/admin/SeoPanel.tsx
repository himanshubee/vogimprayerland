"use client";

import { useMemo, useState, useRef } from "react";
import {
  Search,
  ChevronDown,
  Check,
  X,
  Minus,
  Globe,
  Settings2,
  ImagePlus,
  Loader2,
} from "lucide-react";
import {
  analyzeSeo,
  SEO_CATEGORY_LABELS,
  type SeoCategory,
  type SeoStatus,
  type PostSeo,
} from "@/lib/seo-analysis";

const SITE = "https://www.vogimprayerland.org";

const STATUS_COLOR: Record<SeoStatus, string> = {
  good: "#1a9d5a",
  ok: "#e0a106",
  bad: "#c0392b",
};

function ScoreGauge({ score, rating }: { score: number; rating: SeoStatus }) {
  const color = STATUS_COLOR[rating];
  const r = 26;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, score)) / 100) * c;
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#e8e3d8" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-bold leading-none" style={{ color }}>
          {score}
        </span>
        <span className="text-[8px] tracking-wide text-midnight/40">/100</span>
      </div>
    </div>
  );
}

function CountBar({ value, min, max }: { value: number; min: number; max: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const color =
    value === 0 ? "#cbd0c2" : value < min || value > max ? "#e0a106" : "#1a9d5a";
  return (
    <div className="mt-1 h-1 w-full bg-midnight/10">
      <div className="h-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

const STATUS_ICON: Record<SeoStatus, React.ReactNode> = {
  good: <Check size={11} strokeWidth={3} />,
  ok: <Minus size={11} strokeWidth={3} />,
  bad: <X size={11} strokeWidth={3} />,
};

export type SeoPanelProps = {
  seo: PostSeo;
  onChange: (patch: Partial<PostSeo>) => void;
  // Live post fields used for analysis + snippet fallbacks.
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string | null;
};

export function SeoPanel({
  seo,
  onChange,
  title,
  slug,
  excerpt,
  content,
  featuredImage,
}: SeoPanelProps) {
  const [advanced, setAdvanced] = useState(false);
  const [ogUploading, setOgUploading] = useState(false);
  const ogFileRef = useRef<HTMLInputElement>(null);

  const effTitle = (seo.title || `${title} — VOGIM Prayer Land`).trim();
  const effDesc = (seo.description || excerpt).trim();

  const report = useMemo(
    () =>
      analyzeSeo({
        focusKeyword: seo.focusKeyword,
        seoTitle: seo.title || title,
        metaDescription: effDesc,
        slug,
        contentHtml: content,
        hasImage: Boolean(featuredImage),
      }),
    [seo.focusKeyword, seo.title, title, effDesc, slug, content, featuredImage]
  );

  const grouped = useMemo(() => {
    const g: Record<SeoCategory, typeof report.checks> = {
      basic: [],
      additional: [],
      title: [],
      readability: [],
    };
    for (const c of report.checks) g[c.category].push(c);
    return g;
  }, [report]);

  async function uploadOg(file: File) {
    setOgUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) onChange({ ogImage: data.url });
    } finally {
      setOgUploading(false);
    }
  }

  const titleLen = effTitle.length;
  const descLen = effDesc.length;

  return (
    <div className="bg-white border border-midnight/10">
      {/* header */}
      <div className="flex items-center gap-4 border-b border-midnight/10 px-5 py-4">
        <ScoreGauge score={report.score} rating={report.rating} />
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-display text-lg text-midnight">
            <Search size={16} className="text-gold-deep" /> SEO Analysis
          </p>
          <p className="text-xs text-midnight/55">
            {report.checks.filter((c) => c.status === "good").length}/
            {report.checks.length} tests passing · {report.wordCount} words ·{" "}
            {report.keywordDensity.toFixed(2)}% density
          </p>
        </div>
        <span
          className="ml-auto shrink-0 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white"
          style={{ background: STATUS_COLOR[report.rating] }}
        >
          {report.rating === "good"
            ? "Good"
            : report.rating === "ok"
            ? "Needs work"
            : "Poor"}
        </span>
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-2">
        {/* LEFT: editable snippet + keyword */}
        <div className="space-y-4">
          <div>
            <label className="text-[10px] tracking-[0.22em] uppercase text-midnight/50">
              Focus keyword
            </label>
            <input
              value={seo.focusKeyword}
              onChange={(e) => onChange({ focusKeyword: e.target.value })}
              placeholder="e.g. deliverance prayer"
              className="mt-1.5 w-full bg-ivory-dark border border-midnight/15 px-3 py-2 text-sm outline-none focus:border-gold transition-colors"
            />
            <p className="mt-1 text-[10px] text-midnight/40">
              The main term you want this page to rank for.
            </p>
          </div>

          <div>
            <label className="text-[10px] tracking-[0.22em] uppercase text-midnight/50">
              Meta keywords
            </label>
            <input
              value={seo.keywords}
              onChange={(e) => onChange({ keywords: e.target.value })}
              placeholder="deliverance, healing, prayer, Lagos"
              className="mt-1.5 w-full bg-ivory-dark border border-midnight/15 px-3 py-2 text-sm outline-none focus:border-gold transition-colors"
            />
            <p className="mt-1 text-[10px] text-midnight/40">
              Comma-separated, emitted as the page&apos;s meta keywords tag.
            </p>
          </div>

          {/* Google snippet preview */}
          <div className="border border-midnight/10 bg-ivory-dark/40 p-3.5">
            <p className="mb-2 text-[10px] tracking-[0.22em] uppercase text-midnight/40">
              Google preview
            </p>
            <div className="flex items-center gap-1 text-xs text-[#5f6368]">
              <Globe size={11} /> {SITE.replace("https://", "")}/{slug || "post-slug"}
            </div>
            <p className="mt-0.5 truncate text-[#1a0dab] text-[17px] leading-snug">
              {effTitle || "Your SEO title preview"}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-[#4d5156]">
              {effDesc ||
                "Your meta description preview will appear here. Write a compelling summary using your focus keyword."}
            </p>
          </div>

          {/* SEO title */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-[10px] tracking-[0.22em] uppercase text-midnight/50">
                SEO title
              </label>
              <span
                className="text-[10px]"
                style={{ color: titleLen > 60 ? STATUS_COLOR.bad : "#9aa093" }}
              >
                {titleLen}/60
              </span>
            </div>
            <input
              value={seo.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder={`${title || "Post title"} — VOGIM Prayer Land`}
              className="mt-1.5 w-full bg-ivory-dark border border-midnight/15 px-3 py-2 text-sm outline-none focus:border-gold transition-colors"
            />
            <CountBar value={titleLen} min={15} max={60} />
          </div>

          {/* Meta description */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-[10px] tracking-[0.22em] uppercase text-midnight/50">
                Meta description
              </label>
              <span
                className="text-[10px]"
                style={{ color: descLen > 160 ? STATUS_COLOR.bad : "#9aa093" }}
              >
                {descLen}/160
              </span>
            </div>
            <textarea
              value={seo.description}
              onChange={(e) => onChange({ description: e.target.value })}
              rows={3}
              placeholder={excerpt || "Compelling summary with your focus keyword…"}
              className="mt-1.5 w-full resize-none bg-ivory-dark border border-midnight/15 px-3 py-2 text-sm outline-none focus:border-gold transition-colors"
            />
            <CountBar value={descLen} min={120} max={160} />
          </div>
        </div>

        {/* RIGHT: checklist */}
        <div className="space-y-4">
          {(Object.keys(grouped) as SeoCategory[]).map((cat) =>
            grouped[cat].length ? (
              <div key={cat}>
                <p className="mb-2 text-[10px] tracking-[0.22em] uppercase text-midnight/45">
                  {SEO_CATEGORY_LABELS[cat]}
                </p>
                <ul className="space-y-1.5">
                  {grouped[cat].map((c) => (
                    <li
                      key={c.id}
                      className="flex items-start gap-2.5 text-[13px] leading-snug"
                      title={c.hint}
                    >
                      <span
                        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white"
                        style={{ background: STATUS_COLOR[c.status] }}
                      >
                        {STATUS_ICON[c.status]}
                      </span>
                      <span
                        className={
                          c.status === "good" ? "text-midnight/80" : "text-midnight/70"
                        }
                      >
                        {c.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
          )}
        </div>
      </div>

      {/* Advanced */}
      <div className="border-t border-midnight/10">
        <button
          type="button"
          onClick={() => setAdvanced((v) => !v)}
          className="flex w-full items-center gap-2 px-5 py-3 text-[11px] tracking-[0.2em] uppercase text-midnight/60 hover:text-midnight transition-colors"
        >
          <Settings2 size={14} /> Advanced
          <ChevronDown
            size={15}
            className={`ml-auto transition-transform ${advanced ? "rotate-180" : ""}`}
          />
        </button>

        {advanced && (
          <div className="grid gap-5 px-5 pb-5 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] tracking-[0.22em] uppercase text-midnight/50">
                  Canonical URL
                </label>
                <input
                  value={seo.canonical}
                  onChange={(e) => onChange({ canonical: e.target.value })}
                  placeholder={`${SITE}/${slug || "post-slug"}`}
                  className="mt-1.5 w-full bg-ivory-dark border border-midnight/15 px-3 py-2 text-xs font-mono outline-none focus:border-gold transition-colors"
                />
              </div>

              <div className="flex gap-5">
                <label className="flex items-center gap-2 text-sm text-midnight/75">
                  <input
                    type="checkbox"
                    checked={seo.noindex}
                    onChange={(e) => onChange({ noindex: e.target.checked })}
                    className="accent-gold-deep"
                  />
                  No&#8203;index
                </label>
                <label className="flex items-center gap-2 text-sm text-midnight/75">
                  <input
                    type="checkbox"
                    checked={seo.nofollow}
                    onChange={(e) => onChange({ nofollow: e.target.checked })}
                    className="accent-gold-deep"
                  />
                  No&#8203;follow
                </label>
              </div>
              <p className="text-[10px] text-midnight/40">
                No-index hides this page from search engines. No-follow tells them not
                to follow its links.
              </p>
            </div>

            {/* Open Graph / social */}
            <div className="space-y-4">
              <p className="text-[10px] tracking-[0.22em] uppercase text-midnight/45">
                Social (Open Graph)
              </p>
              <input
                value={seo.ogTitle}
                onChange={(e) => onChange({ ogTitle: e.target.value })}
                placeholder="Social title (defaults to SEO title)"
                className="w-full bg-ivory-dark border border-midnight/15 px-3 py-2 text-sm outline-none focus:border-gold transition-colors"
              />
              <textarea
                value={seo.ogDescription}
                onChange={(e) => onChange({ ogDescription: e.target.value })}
                rows={2}
                placeholder="Social description (defaults to meta description)"
                className="w-full resize-none bg-ivory-dark border border-midnight/15 px-3 py-2 text-sm outline-none focus:border-gold transition-colors"
              />
              <div className="flex items-center gap-3">
                {seo.ogImage || featuredImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={seo.ogImage || featuredImage || ""}
                    alt=""
                    className="h-14 w-24 border border-midnight/10 object-cover"
                  />
                ) : null}
                <button
                  type="button"
                  onClick={() => ogFileRef.current?.click()}
                  disabled={ogUploading}
                  className="inline-flex items-center gap-1.5 border border-midnight/20 px-3 py-2 text-[11px] uppercase tracking-[0.15em] text-midnight/65 hover:border-gold hover:text-gold-deep transition-colors disabled:opacity-50"
                >
                  {ogUploading ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <ImagePlus size={13} />
                  )}
                  {seo.ogImage ? "Replace" : "Social image"}
                </button>
                {seo.ogImage && (
                  <button
                    type="button"
                    onClick={() => onChange({ ogImage: null })}
                    className="text-[11px] uppercase tracking-[0.15em] text-midnight/45 hover:text-midnight-soft"
                  >
                    Remove
                  </button>
                )}
                <input
                  ref={ogFileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadOg(f);
                    e.target.value = "";
                  }}
                />
              </div>
              <p className="text-[10px] text-midnight/40">
                Shown when the post is shared on Facebook, WhatsApp, X, etc. Falls back
                to the featured image.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
