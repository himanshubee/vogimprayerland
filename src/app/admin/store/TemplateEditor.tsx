"use client";

import { useRef, useState } from "react";
import { Camera, Check, ImagePlus, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { PhotoMockup } from "@/components/shop/PhotoMockup";
import { DEFAULT_QUAD, type Quad } from "@/lib/quad";
import {
  CATEGORIES,
  CATEGORY_KEYS,
  COLORS,
  colorByKey,
  defaultShowDesign,
  photoViews,
  templateCount,
  viewLabel,
  type MerchCategory,
  type MerchTemplates,
  type MerchView,
  type MockupTemplate,
} from "@/lib/merch-shared";

const labelCls = "block text-[11px] tracking-[0.2em] uppercase text-midnight/55 mb-1.5";

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

/** A stand-in print, so the corners can be placed against something. */
const SAMPLE_DESIGN =
  "data:image/svg+xml;base64," +
  btoa(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect x="6" y="6" width="288" height="288" fill="none" stroke="#7A0E1A" stroke-width="6" stroke-dasharray="14 10"/><circle cx="150" cy="118" r="70" fill="#D4A437"/><path d="M150 66 v104 M118 100 h64" stroke="#7A0E1A" stroke-width="16" stroke-linecap="round"/><text x="150" y="238" font-family="Georgia,serif" font-size="46" font-weight="bold" text-anchor="middle" fill="#7A0E1A">DESIGN</text><text x="150" y="270" font-family="Arial,sans-serif" font-size="18" letter-spacing="5" text-anchor="middle" fill="#7A0E1A">PRINT AREA</text></svg>`
  );

type Sizes = { width: number; height: number };

/** The photo's natural size, needed for its aspect ratio. */
function measure(url: string): Promise<Sizes> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || 1000, height: img.naturalHeight || 1200 });
    img.onerror = () => resolve({ width: 1000, height: 1200 });
    img.src = url;
  });
}

export function TemplateEditor({
  initial,
  onSaved,
}: {
  initial: MerchTemplates;
  onSaved: (templates: MerchTemplates) => void;
}) {
  const [templates, setTemplates] = useState<MerchTemplates>(initial);
  const [saved, setSaved] = useState<MerchTemplates>(initial);
  const [category, setCategory] = useState<MerchCategory>("tshirt");
  const [testColor, setTestColor] = useState("white");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const dirty = JSON.stringify(templates) !== JSON.stringify(saved);

  function setTemplate(view: MerchView, template: MockupTemplate | null) {
    setTemplates((prev) => {
      const next = { ...prev, [category]: { ...prev[category] } };
      if (template) next[category][view] = template;
      else delete next[category][view];
      return next;
    });
  }

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/store/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "templates", templates }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data?.error || "Could not save the photos");
      setTemplates(data.templates);
      setSaved(data.templates);
      onSaved(data.templates);
      setMessage("Photos saved — the store now uses them.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save the photos");
    } finally {
      setBusy(false);
    }
  }

  const views = photoViews(category);
  const swatch = colorByKey(testColor);

  return (
    <div className="bg-white border border-midnight/12 p-5 sm:p-6 mt-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className={labelCls}>Photo mockups</p>
          <p className="text-xs text-midnight/55 leading-relaxed max-w-xl">
            Upload a photograph of a plain <strong>white</strong> garment for each
            angle, with the background removed (a transparent PNG). Then drag the four
            corners onto the print area. The store recolours the photo for every
            fabric colour and lays each design into that area. Angles without a photo
            keep the drawn mockup.
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={busy || !dirty}
          className="btn-gold !py-2 !px-4 !text-[11px] disabled:opacity-50"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Save photos
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <div className="flex gap-1">
          {CATEGORY_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              aria-pressed={category === key}
              className={`px-3 py-1.5 border text-[11px] tracking-[0.16em] uppercase transition-colors ${
                category === key
                  ? "border-gold bg-gold text-midnight"
                  : "border-midnight/20 text-midnight/60 hover:border-gold"
              }`}
            >
              {CATEGORIES[key].plural}{" "}
              <span className="opacity-60">
                {templateCount(templates, key)}/{photoViews(key).length}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[10px] tracking-[0.2em] uppercase text-midnight/45 mr-1">
            Preview in
          </span>
          {COLORS.map((c) => (
            <button
              key={c.key}
              type="button"
              title={c.label}
              aria-label={`Preview in ${c.label}`}
              aria-pressed={testColor === c.key}
              onClick={() => setTestColor(c.key)}
              className={`h-5 w-5 rounded-full border-2 ${
                testColor === c.key ? "border-gold" : "border-midnight/15"
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </div>

      <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {views.map((view) => (
          <ViewSlot
            key={`${category}-${view}`}
            view={view}
            label={viewLabel(category, view)}
            template={templates[category][view] ?? null}
            color={swatch.hex}
            align={category === "tshirt" ? "top" : "center"}
            onChange={(t) => setTemplate(view, t)}
          />
        ))}
      </div>

      {message && <p className="mt-3 text-xs text-midnight/60">{message}</p>}
      <p className="mt-3 text-[11px] text-midnight/40 leading-relaxed">
        Tip: photograph the garment flat or on a form, evenly lit, and remove the
        background before uploading. The same photo set serves every design and
        colour, so it only has to be done once.
      </p>
    </div>
  );
}

/* --------------------------------- One angle -------------------------------- */

function ViewSlot({
  view,
  label,
  template,
  color,
  align,
  onChange,
}: {
  view: MerchView;
  label: string;
  template: MockupTemplate | null;
  color: string;
  align: "top" | "center";
  onChange: (t: MockupTemplate | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);

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
      // The original file, not the compressed variant: the transparent
      // background is what makes the recolouring work.
      const photo: string = data.originalUrl || data.url;
      const size = await measure(photo);
      onChange({
        photo,
        ...size,
        quad: template?.quad ?? DEFAULT_QUAD,
        showDesign: template?.showDesign ?? defaultShowDesign(view),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  /** Move one corner to where the pointer is, in percent of the photo. */
  function moveCorner(index: number, clientX: number, clientY: number) {
    const stage = stageRef.current;
    if (!stage || !template) return;
    const r = stage.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - r.top) / r.height) * 100));
    const quad = template.quad.map((pt, i) =>
      i === index ? [Math.round(x * 10) / 10, Math.round(y * 10) / 10] : pt
    ) as Quad;
    onChange({ ...template, quad });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`${labelCls} !mb-0`}>{label}</span>
        {template && (
          <button
            type="button"
            onClick={() => onChange({ ...template, quad: DEFAULT_QUAD })}
            title="Reset the print area"
            className="text-[10px] tracking-[0.14em] uppercase text-midnight/45 hover:text-gold-deep inline-flex items-center gap-1"
          >
            <RotateCcw size={10} /> Reset
          </button>
        )}
      </div>

      {template ? (
        // The stage has the photo's exact aspect ratio, so percent positions on
        // it are percent positions on the photo.
        <div
          ref={stageRef}
          className="relative w-full bg-ivory-dark border border-midnight/10 select-none touch-none"
          style={{ aspectRatio: `${template.width} / ${template.height}` }}
          onPointerMove={(e) => {
            if (dragging !== null) moveCorner(dragging, e.clientX, e.clientY);
          }}
          onPointerUp={() => setDragging(null)}
          onPointerCancel={() => setDragging(null)}
        >
          <PhotoMockup
            template={template}
            color={color}
            design={SAMPLE_DESIGN}
            align={align}
            showDesign={template.showDesign}
            className="absolute inset-0 h-full w-full"
          />

          {/* The print area and its corner handles. */}
          {template.showDesign && (
          <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon
              points={template.quad.map(([x, y]) => `${x},${y}`).join(" ")}
              fill="rgba(212,164,55,0.08)"
              stroke="#D4A437"
              strokeWidth="0.6"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          )}
          {template.showDesign && template.quad.map(([x, y], i) => (
            <button
              key={i}
              type="button"
              aria-label={`${["Top-left", "Top-right", "Bottom-right", "Bottom-left"][i]} corner`}
              onPointerDown={(e) => {
                e.preventDefault();
                (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
                setDragging(i);
              }}
              onPointerMove={(e) => {
                if (dragging === i) moveCorner(i, e.clientX, e.clientY);
              }}
              onPointerUp={() => setDragging(null)}
              className={`absolute h-4 w-4 -ml-2 -mt-2 rounded-full border-2 border-white bg-gold shadow cursor-grab ${
                dragging === i ? "scale-125 cursor-grabbing" : ""
              }`}
              style={{ left: `${x}%`, top: `${y}%` }}
            />
          ))}
        </div>
      ) : (
        <div className="aspect-[5/6] w-full border border-dashed border-midnight/20 flex flex-col items-center justify-center gap-2 text-midnight/35">
          <Camera size={24} />
          <span className="text-xs">No photo — drawn mockup used</span>
        </div>
      )}

      {template && (
        <label className="mt-2 flex items-center gap-2 text-xs text-midnight/70 cursor-pointer">
          <input
            type="checkbox"
            checked={template.showDesign}
            onChange={(e) => onChange({ ...template, showDesign: e.target.checked })}
            className="accent-gold"
          />
          Print the design on this angle
        </label>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/webp"
        hidden
        onChange={(e) => upload(e.target.files?.[0])}
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex-1 border border-midnight/20 px-3 py-2 text-[11px] tracking-[0.16em] uppercase text-midnight/70 hover:border-gold hover:text-gold-deep transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 size={13} className="animate-spin" /> Uploading
            </>
          ) : (
            <>
              <ImagePlus size={13} /> {template ? "Replace" : "Upload"} photo
            </>
          )}
        </button>
        {template && (
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={`Remove ${label} photo`}
            className="border border-midnight/20 px-2.5 text-midnight/45 hover:text-midnight-soft hover:border-midnight-soft/40 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-midnight-soft">{error}</p>}
    </div>
  );
}
