"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Inbox,
  ExternalLink,
  Pencil,
  Calendar,
  Layers,
} from "lucide-react";
import type { Post } from "@/lib/posts";
import { AdminTabs } from "@/components/admin/AdminTabs";

const PER_PAGE = 40;
const TABS = ["all", "publish", "draft"] as const;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function PostsList({ initial }: { initial: Post[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const counts = useMemo(() => {
    const c = { all: initial.length, publish: 0, draft: 0 } as Record<
      string,
      number
    >;
    for (const p of initial) c[p.status] = (c[p.status] || 0) + 1;
    return c;
  }, [initial]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initial.filter((p) => {
      if (tab !== "all" && p.status !== tab) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.categories.join(" ").toLowerCase().includes(q)
      );
    });
  }, [initial, tab, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const shown = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  return (
    <div className="min-h-screen bg-ivory-dark text-ink">
      {/* TOP BAR */}
      <header className="sticky top-0 z-20 bg-midnight text-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div>
              <p className="eyebrow text-gold leading-none">VOGIM Admin</p>
              <h1 className="font-display text-xl sm:text-2xl mt-1 leading-none">
                Posts
              </h1>
            </div>
            <AdminTabs />
          </div>
          <Link href="/admin/posts/new" className="btn-gold !py-2 !px-4 !text-[11px]">
            <Plus size={14} /> New post
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 sm:px-6 py-6 sm:py-8">
        {/* CONTROLS */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="flex gap-2">
            {TABS.map((t) => {
              const on = t === tab;
              return (
                <button
                  key={t}
                  onClick={() => {
                    setTab(t);
                    setPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 text-[11px] tracking-[0.15em] uppercase px-3 py-2 border transition-colors ${
                    on
                      ? "bg-midnight text-gold border-midnight"
                      : "border-midnight/20 text-midnight/60 hover:border-midnight/40"
                  }`}
                >
                  {t === "publish" ? "Published" : t}
                  <span className="text-[9px] tabular-nums opacity-70">
                    {counts[t] || 0}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="relative sm:ml-auto sm:w-72">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-midnight/40"
            />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search posts…"
              className="w-full bg-white border border-midnight/15 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-gold transition-colors"
            />
          </div>
        </div>

        {/* LIST */}
        {shown.length === 0 ? (
          <div className="border border-dashed border-midnight/20 bg-white py-20 text-center">
            <Inbox className="mx-auto text-midnight/30" size={32} />
            <p className="mt-4 text-midnight/60 font-display text-xl">
              No posts found.
            </p>
            <Link
              href="/admin/posts/new"
              className="inline-flex items-center gap-1.5 mt-4 text-sm text-gold-deep hover:underline"
            >
              <Plus size={14} /> Create your first post
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-midnight/10 divide-y divide-midnight/8">
            {shown.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 p-3.5 hover:bg-ivory-dark/60 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] tracking-[0.2em] uppercase px-1.5 py-0.5 border ${
                        p.status === "publish"
                          ? "bg-green-600/10 text-green-700 border-green-600/30"
                          : "bg-gold/10 text-gold-deep border-gold/40"
                      }`}
                    >
                      {p.status === "publish" ? "Live" : "Draft"}
                    </span>
                    {p.type === "page" && (
                      <span className="text-[9px] tracking-[0.2em] uppercase text-midnight/40 inline-flex items-center gap-1">
                        <Layers size={10} /> page
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/admin/posts/${p.id}`}
                    className="block font-display text-lg text-midnight truncate mt-0.5 group-hover:text-midnight-soft transition-colors"
                  >
                    {p.title}
                  </Link>
                  <p className="text-xs text-midnight/45 truncate flex items-center gap-3 mt-0.5">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={11} /> {fmtDate(p.date)}
                    </span>
                    <span className="font-mono truncate">/{p.slug}/</span>
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {p.status === "publish" && (
                    <Link
                      href={`/${p.slug}/`}
                      target="_blank"
                      className="p-2 text-midnight/40 hover:text-gold-deep transition-colors"
                      aria-label="View"
                    >
                      <ExternalLink size={15} />
                    </Link>
                  )}
                  <button
                    onClick={() => router.push(`/admin/posts/${p.id}`)}
                    className="p-2 text-midnight/40 hover:text-midnight transition-colors"
                    aria-label="Edit"
                  >
                    <Pencil size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              disabled={current <= 1}
              onClick={() => setPage(current - 1)}
              className="text-[11px] tracking-[0.18em] uppercase border border-midnight/20 px-4 py-2 text-midnight/70 hover:border-midnight/40 disabled:opacity-40 transition-colors"
            >
              Prev
            </button>
            <span className="text-sm text-midnight/60 tabular-nums">
              {current} / {totalPages}
            </span>
            <button
              disabled={current >= totalPages}
              onClick={() => setPage(current + 1)}
              className="text-[11px] tracking-[0.18em] uppercase border border-midnight/20 px-4 py-2 text-midnight/70 hover:border-midnight/40 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
