"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ImagePlus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Images,
  Loader2,
  Download,
} from "lucide-react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import type { MediaItem } from "@/lib/media";

const inputCls =
  "w-full bg-white border border-midnight/15 px-2.5 py-1.5 text-sm outline-none focus:border-gold transition-colors";

/** Read an image's natural dimensions before upload (for correct aspect ratio). */
function readDims(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth || 1600, height: img.naturalHeight || 1000 });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 1600, height: 1000 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

export function MediaManager({ initial }: { initial: MediaItem[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<MediaItem[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const dims = await readDims(file);
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch("/api/upload", { method: "POST", body: fd });
        const upData = await up.json();
        if (!up.ok) throw new Error(upData?.error || "Upload failed");

        const res = await fetch("/api/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            src: upData.url,
            title: file.name.replace(/\.[^.]+$/, "").slice(0, 80),
            width: dims.width,
            height: dims.height,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Could not save");
        setItems((prev) => [...prev, data.item]);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function seed() {
    setBusy(true);
    const res = await fetch("/api/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "seed" }),
    }).catch(() => null);
    if (res) {
      const list = await fetch("/api/media").then((r) => r.json()).catch(() => null);
      if (list?.items) setItems(list.items);
    }
    setBusy(false);
    router.refresh();
  }

  function patchLocal(id: string, p: Partial<MediaItem>) {
    setItems((prev) => prev.map((m) => (m.id === id ? { ...m, ...p } : m)));
  }

  async function saveField(id: string, field: keyof MediaItem, value: string) {
    await fetch(`/api/media/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    }).catch(() => {});
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this image?")) return;
    setItems((prev) => prev.filter((m) => m.id !== id));
    await fetch(`/api/media/${id}`, { method: "DELETE" }).catch(() => {});
    router.refresh();
  }

  async function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
    await fetch("/api/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reorder", ids: next.map((m) => m.id) }),
    }).catch(() => {});
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-ivory-dark text-ink">
      <header className="sticky top-0 z-20 bg-midnight text-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div>
              <p className="eyebrow text-gold leading-none">VOGIM Admin</p>
              <h1 className="font-display text-xl sm:text-2xl mt-1 leading-none">Media</h1>
            </div>
            <AdminTabs />
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="btn-gold !py-2 !px-4 !text-[11px] disabled:opacity-50"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
            {uploading ? "Uploading…" : "Upload images"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => onFiles(e.target.files)}
          />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 sm:px-6 py-6 sm:py-8">
        {error && (
          <div className="border border-red-300 bg-red-50 text-red-700 text-sm px-4 py-3 mb-5">
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <div className="border border-dashed border-midnight/20 bg-white py-20 text-center">
            <Images className="mx-auto text-midnight/30" size={32} />
            <p className="mt-4 text-midnight/60 font-display text-xl">No media yet.</p>
            <p className="text-midnight/40 text-sm mt-1">
              Upload images, or import the original starter gallery.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => fileRef.current?.click()}
                className="btn-gold !py-2 !px-4 !text-[11px]"
              >
                <ImagePlus size={14} /> Upload images
              </button>
              <button
                onClick={seed}
                disabled={busy}
                className="inline-flex items-center gap-1.5 text-sm text-gold-deep hover:underline disabled:opacity-50"
              >
                <Download size={14} /> Import starter gallery
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-midnight/50 mb-4">
              {items.length} image{items.length === 1 ? "" : "s"} · shown on{" "}
              <span className="text-midnight">/gallery</span> and{" "}
              <span className="text-midnight">/media</span>. Order here is the display order.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((m, i) => (
                <div key={m.id} className="bg-white border border-midnight/10">
                  <div className="relative aspect-[4/3] bg-midnight/5 overflow-hidden">
                    {m.src && (
                      <Image
                        src={m.src}
                        alt={m.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        className="w-7 h-7 bg-midnight/70 text-white flex items-center justify-center hover:bg-midnight disabled:opacity-30"
                        aria-label="Move up"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        onClick={() => move(i, 1)}
                        disabled={i === items.length - 1}
                        className="w-7 h-7 bg-midnight/70 text-white flex items-center justify-center hover:bg-midnight disabled:opacity-30"
                        aria-label="Move down"
                      >
                        <ArrowDown size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <input
                      className={inputCls}
                      value={m.title}
                      placeholder="Title"
                      onChange={(e) => patchLocal(m.id, { title: e.target.value })}
                      onBlur={(e) => saveField(m.id, "title", e.target.value)}
                    />
                    <input
                      className={inputCls}
                      value={m.caption}
                      placeholder="Caption"
                      onChange={(e) => patchLocal(m.id, { caption: e.target.value })}
                      onBlur={(e) => saveField(m.id, "caption", e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        className={inputCls}
                        value={m.category}
                        placeholder="Category"
                        onChange={(e) => patchLocal(m.id, { category: e.target.value })}
                        onBlur={(e) => saveField(m.id, "category", e.target.value)}
                      />
                      <button
                        onClick={() => remove(m.id)}
                        className="shrink-0 p-2 text-midnight/40 hover:text-red-600 transition-colors"
                        aria-label="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
