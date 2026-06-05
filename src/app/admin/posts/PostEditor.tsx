"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Save,
  Trash2,
  ArrowLeft,
  ExternalLink,
  ImagePlus,
  X,
  Loader2,
} from "lucide-react";
import { TinyEditor } from "@/components/admin/TinyEditor";
import type { Post } from "@/lib/posts";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function PostEditor({ post }: { post?: Post }) {
  const router = useRouter();
  const editing = Boolean(post);

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post?.slug));
  const [content, setContent] = useState(post?.content ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [categories, setCategories] = useState((post?.categories ?? []).join(", "));
  const [status, setStatus] = useState<"publish" | "draft">(
    post?.status ?? "draft"
  );
  const [featuredImage, setFeaturedImage] = useState<string | null>(
    post?.featuredImage ?? null
  );

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function onTitle(v: string) {
    setTitle(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  async function uploadFeatured(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setFeaturedImage(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save(publishOverride?: "publish" | "draft") {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    const payload = {
      title,
      slug,
      content,
      excerpt,
      status: publishOverride ?? status,
      categories: categories
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      featuredImage,
      type: post?.type ?? "post",
    };
    try {
      const res = await fetch(
        editing ? `/api/posts/${post!.id}` : "/api/posts",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      if (publishOverride) setStatus(publishOverride);

      if (!editing && data.post?.id) {
        router.replace(`/admin/posts/${data.post.id}`);
        router.refresh();
      } else {
        if (data.post?.slug) setSlug(data.post.slug);
        setNotice("Saved.");
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!editing) return;
    if (!confirm("Delete this post permanently?")) return;
    setSaving(true);
    await fetch(`/api/posts/${post!.id}`, { method: "DELETE" }).catch(() => {});
    router.replace("/admin/posts");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-ivory-dark text-ink">
      {/* top bar */}
      <header className="sticky top-0 z-20 bg-midnight text-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <Link
            href="/admin/posts"
            className="inline-flex items-center gap-2 text-white/70 hover:text-gold text-sm transition-colors"
          >
            <ArrowLeft size={16} /> Posts
          </Link>
          <div className="flex items-center gap-2">
            {editing && status === "publish" && (
              <Link
                href={`/${slug}/`}
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase border border-white/25 text-white/80 px-3 py-2 hover:bg-white/10 transition-colors"
              >
                <ExternalLink size={13} /> View
              </Link>
            )}
            <button
              onClick={() => save("draft")}
              disabled={saving}
              className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase border border-gold/40 text-gold px-3 py-2 hover:bg-gold/10 transition-colors disabled:opacity-50"
            >
              Save draft
            </button>
            <button
              onClick={() => save("publish")}
              disabled={saving}
              className="btn-gold !py-2 !px-4 !text-[11px]"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              {status === "publish" ? "Update" : "Publish"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 sm:px-6 py-6 sm:py-8 grid lg:grid-cols-[1fr_300px] gap-6">
        {/* MAIN */}
        <div className="space-y-4 min-w-0">
          {error && (
            <p className="border-l-2 border-midnight-soft bg-midnight-soft/5 px-4 py-3 text-sm text-midnight">
              {error}
            </p>
          )}
          {notice && (
            <p className="border-l-2 border-green-600 bg-green-600/5 px-4 py-3 text-sm text-green-700">
              {notice}
            </p>
          )}

          <input
            value={title}
            onChange={(e) => onTitle(e.target.value)}
            placeholder="Add title"
            className="w-full bg-white border border-midnight/15 px-4 py-4 font-display text-2xl text-midnight outline-none focus:border-gold transition-colors"
          />

          <div className="flex items-center gap-2 text-sm text-midnight/60">
            <span className="text-midnight/40">/</span>
            <input
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              placeholder="post-slug"
              className="flex-1 bg-white border border-midnight/15 px-3 py-2 outline-none focus:border-gold transition-colors font-mono text-xs"
            />
            <span className="text-midnight/40 text-xs">/</span>
          </div>

          <TinyEditor value={content} onChange={setContent} />
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-5">
          {/* status */}
          <div className="bg-white border border-midnight/10 p-4">
            <p className="text-[10px] tracking-[0.25em] uppercase text-midnight/50 mb-3">
              Status
            </p>
            <div className="flex gap-2">
              {(["draft", "publish"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`flex-1 text-[11px] tracking-[0.15em] uppercase py-2 border transition-colors ${
                    status === s
                      ? "bg-midnight text-gold border-midnight"
                      : "border-midnight/20 text-midnight/60 hover:border-midnight/40"
                  }`}
                >
                  {s === "publish" ? "Published" : "Draft"}
                </button>
              ))}
            </div>
          </div>

          {/* featured image */}
          <div className="bg-white border border-midnight/10 p-4">
            <p className="text-[10px] tracking-[0.25em] uppercase text-midnight/50 mb-3">
              Featured image
            </p>
            {featuredImage ? (
              <div className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featuredImage}
                  alt="Featured"
                  className="w-full aspect-[16/10] object-cover border border-midnight/10"
                />
                <button
                  onClick={() => setFeaturedImage(null)}
                  className="absolute top-2 right-2 bg-midnight/80 text-white w-7 h-7 flex items-center justify-center hover:bg-midnight-soft transition-colors"
                  aria-label="Remove image"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full aspect-[16/10] border border-dashed border-midnight/25 flex flex-col items-center justify-center text-midnight/50 hover:border-gold hover:text-gold-deep transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    <ImagePlus size={22} />
                    <span className="text-xs mt-2">Upload image</span>
                  </>
                )}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadFeatured(f);
                e.target.value = "";
              }}
            />
          </div>

          {/* categories */}
          <div className="bg-white border border-midnight/10 p-4">
            <p className="text-[10px] tracking-[0.25em] uppercase text-midnight/50 mb-3">
              Categories
            </p>
            <input
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
              placeholder="Deliverance, Prayer Points"
              className="w-full bg-ivory-dark border border-midnight/15 px-3 py-2 text-sm outline-none focus:border-gold transition-colors"
            />
            <p className="text-[10px] text-midnight/40 mt-2">Comma-separated.</p>
          </div>

          {/* excerpt */}
          <div className="bg-white border border-midnight/10 p-4">
            <p className="text-[10px] tracking-[0.25em] uppercase text-midnight/50 mb-3">
              Excerpt
            </p>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={4}
              placeholder="Short summary shown in listings…"
              className="w-full bg-ivory-dark border border-midnight/15 px-3 py-2 text-sm outline-none focus:border-gold transition-colors resize-none"
            />
          </div>

          {/* delete */}
          {editing && (
            <button
              onClick={remove}
              disabled={saving}
              className="inline-flex items-center gap-2 text-xs tracking-[0.18em] uppercase text-midnight-soft hover:text-white hover:bg-midnight-soft border border-midnight-soft/40 px-4 py-2.5 transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} /> Delete post
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
