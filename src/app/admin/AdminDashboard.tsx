"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LogOut,
  Trash2,
  Download,
  Inbox,
  X,
  Mail,
  Phone,
  MapPin,
  Clock,
} from "lucide-react";
import { AdminTabs } from "@/components/admin/AdminTabs";

export type SubmissionStatus = "new" | "read" | "done" | "archived";

export type Submission = {
  id: string;
  intent: string;
  fields: Record<string, string>;
  status: SubmissionStatus;
  createdAt: string;
  ip: string | null;
};

const STATUS_TABS: ("all" | SubmissionStatus)[] = [
  "all",
  "new",
  "read",
  "done",
  "archived",
];

const STATUS_STYLES: Record<SubmissionStatus, string> = {
  new: "bg-gold/15 text-gold-deep border-gold/40",
  read: "bg-midnight/5 text-midnight/70 border-midnight/20",
  done: "bg-green-600/10 text-green-700 border-green-600/30",
  archived: "bg-midnight/5 text-midnight/40 border-midnight/15",
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminDashboard({ initial }: { initial: Submission[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Submission[]>(initial);
  const [tab, setTab] = useState<"all" | SubmissionStatus>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Submission | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const s of items) c[s.status] = (c[s.status] || 0) + 1;
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((s) => {
      if (tab !== "all" && s.status !== tab) return false;
      if (!q) return true;
      const hay = [s.intent, ...Object.values(s.fields)].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [items, tab, query]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  async function setStatus(id: string, status: SubmissionStatus) {
    setBusy(id);
    setItems((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    setSelected((s) => (s && s.id === id ? { ...s, status } : s));
    await fetch(`/api/submissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => {});
    setBusy(null);
  }

  async function remove(id: string) {
    if (!confirm("Delete this submission permanently?")) return;
    setBusy(id);
    await fetch(`/api/submissions/${id}`, { method: "DELETE" }).catch(() => {});
    setItems((prev) => prev.filter((s) => s.id !== id));
    setSelected((s) => (s && s.id === id ? null : s));
    setBusy(null);
  }

  function exportCsv() {
    const cols = new Set<string>();
    filtered.forEach((s) => Object.keys(s.fields).forEach((k) => cols.add(k)));
    const headers = ["date", "intent", "status", ...Array.from(cols)];
    const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
    const rows = filtered.map((s) =>
      [
        fmtDate(s.createdAt),
        s.intent,
        s.status,
        ...Array.from(cols).map((c) => s.fields[c] ?? ""),
      ]
        .map(esc)
        .join(",")
    );
    const csv = [headers.map(esc).join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vogim-submissions.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function openAndMarkRead(s: Submission) {
    setSelected(s);
    if (s.status === "new") setStatus(s.id, "read");
  }

  return (
    <div className="min-h-screen bg-ivory-dark text-ink">
      {/* TOP BAR */}
      <header className="sticky top-0 z-20 bg-midnight text-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div>
              <p className="eyebrow text-gold leading-none">VOGIM Admin</p>
              <h1 className="font-display text-xl sm:text-2xl mt-1 leading-none">
                Submissions
              </h1>
            </div>
            <AdminTabs />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              className="hidden sm:inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase border border-gold/40 text-gold px-3 py-2 hover:bg-gold hover:text-midnight transition-colors"
            >
              <Download size={14} /> CSV
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase border border-white/25 text-white/80 px-3 py-2 hover:bg-white/10 transition-colors"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 sm:px-6 py-6 sm:py-8">
        {/* CONTROLS */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {STATUS_TABS.map((t) => {
              const on = t === tab;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`shrink-0 inline-flex items-center gap-1.5 text-[11px] tracking-[0.15em] uppercase px-3 py-2 border transition-colors ${
                    on
                      ? "bg-midnight text-gold border-midnight"
                      : "border-midnight/20 text-midnight/60 hover:border-midnight/40"
                  }`}
                >
                  {t}
                  <span className="text-[9px] tabular-nums opacity-70">
                    {counts[t] || 0}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="relative sm:ml-auto sm:w-64">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-midnight/40"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search submissions…"
              className="w-full bg-white border border-midnight/15 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-gold transition-colors"
            />
          </div>
        </div>

        {/* LIST */}
        {filtered.length === 0 ? (
          <div className="border border-dashed border-midnight/20 bg-white py-20 text-center">
            <Inbox className="mx-auto text-midnight/30" size={32} />
            <p className="mt-4 text-midnight/60 font-display text-xl">
              No submissions {tab !== "all" ? `in “${tab}”` : "yet"}.
            </p>
            <p className="text-midnight/40 text-sm mt-1">
              New prayer &amp; request forms will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => openAndMarkRead(s)}
                className="w-full text-left bg-white border border-midnight/10 hover:border-gold/50 transition-colors p-4 flex items-start gap-4 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] tracking-[0.2em] uppercase border px-2 py-0.5 ${
                        STATUS_STYLES[s.status]
                      }`}
                    >
                      {s.status}
                    </span>
                    <span className="text-[11px] tracking-[0.2em] uppercase text-gold-deep">
                      {s.intent}
                    </span>
                  </div>
                  <p className="font-display text-lg text-midnight mt-1.5 truncate">
                    {s.fields.name || "Anonymous"}
                  </p>
                  <p className="text-sm text-midnight/60 truncate mt-0.5">
                    {s.fields.request ||
                      s.fields.message ||
                      s.fields.email ||
                      "—"}
                  </p>
                </div>
                <span className="text-[11px] text-midnight/40 whitespace-nowrap shrink-0 flex items-center gap-1">
                  <Clock size={12} />
                  {fmtDate(s.createdAt)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* DETAIL DRAWER */}
      {selected && (
        <div
          className="fixed inset-0 z-30 bg-midnight/50 backdrop-blur-sm flex justify-end"
          onClick={() => setSelected(null)}
        >
          <aside
            className="w-full max-w-md bg-ivory h-full overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-midnight text-white p-5 sticky top-0 flex items-start justify-between">
              <div>
                <p className="eyebrow text-gold">{selected.intent}</p>
                <h2 className="font-display text-2xl mt-1">
                  {selected.fields.name || "Anonymous"}
                </h2>
                <p className="text-white/50 text-xs mt-1 flex items-center gap-1">
                  <Clock size={12} /> {fmtDate(selected.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-white/60 hover:text-gold transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* quick contact */}
              <div className="flex flex-wrap gap-2">
                {selected.fields.email && (
                  <a
                    href={`mailto:${selected.fields.email}`}
                    className="inline-flex items-center gap-1.5 text-xs border border-midnight/20 px-3 py-1.5 hover:border-gold transition-colors"
                  >
                    <Mail size={13} /> {selected.fields.email}
                  </a>
                )}
                {selected.fields.phone && (
                  <a
                    href={`tel:${selected.fields.phone}`}
                    className="inline-flex items-center gap-1.5 text-xs border border-midnight/20 px-3 py-1.5 hover:border-gold transition-colors"
                  >
                    <Phone size={13} /> {selected.fields.phone}
                  </a>
                )}
                {selected.fields.country && (
                  <span className="inline-flex items-center gap-1.5 text-xs border border-midnight/20 px-3 py-1.5">
                    <MapPin size={13} /> {selected.fields.country}
                  </span>
                )}
              </div>

              {/* all fields */}
              <dl className="divide-y divide-midnight/10 border border-midnight/10 bg-white">
                {Object.entries(selected.fields).map(([k, v]) => (
                  <div key={k} className="px-4 py-3">
                    <dt className="text-[10px] tracking-[0.25em] uppercase text-gold-deep">
                      {k}
                    </dt>
                    <dd className="text-sm text-midnight mt-1 whitespace-pre-wrap break-words">
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>

              {/* status controls */}
              <div>
                <p className="text-[10px] tracking-[0.25em] uppercase text-midnight/50 mb-2">
                  Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {(["new", "read", "done", "archived"] as SubmissionStatus[]).map(
                    (st) => (
                      <button
                        key={st}
                        disabled={busy === selected.id}
                        onClick={() => setStatus(selected.id, st)}
                        className={`text-[11px] tracking-[0.15em] uppercase px-3 py-1.5 border transition-colors disabled:opacity-50 ${
                          selected.status === st
                            ? "bg-midnight text-gold border-midnight"
                            : "border-midnight/20 text-midnight/60 hover:border-midnight/40"
                        }`}
                      >
                        {st}
                      </button>
                    )
                  )}
                </div>
              </div>

              <button
                onClick={() => remove(selected.id)}
                disabled={busy === selected.id}
                className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-midnight-soft hover:text-white hover:bg-midnight-soft border border-midnight-soft/40 px-4 py-2.5 transition-colors disabled:opacity-50"
              >
                <Trash2 size={14} /> Delete submission
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
