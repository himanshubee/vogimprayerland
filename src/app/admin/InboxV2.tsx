"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, LogOut, Trash2, Inbox, X, Clock, Flag, CheckCircle2 } from "lucide-react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import type { InboxSummary } from "@/lib/inbox-core";
import type { Role } from "@/lib/auth-core";

const WORKFLOW = ["new", "read", "in_prayer", "session_scheduled", "follow_up", "closed"] as const;
const LABELS: Record<string, string> = {
  new: "New",
  read: "Read",
  in_prayer: "In prayer",
  session_scheduled: "Session scheduled",
  follow_up: "Follow-up",
  closed: "Closed",
  archived: "Archived",
};
const AGE_FILTERS = [
  ["all", "Any age"],
  ["under12", "Under 12 hours"],
  ["near", "12–24 hours, no reply"],
  ["over", "Over 24 hours, no reply"],
] as const;
const DAY = 24 * 60 * 60 * 1000;

type Detail = { id: string; intent: string; fields: Record<string, string> };
type Staff = { username: string; role: Role };

function age(ms: number) {
  const h = Math.floor(ms / 3_600_000);
  return h < 1 ? `${Math.max(1, Math.floor(ms / 60_000))} min` : h < 48 ? `${h} h` : `${Math.floor(h / 24)} days`;
}

export function InboxV2({
  initial,
  role,
  username,
  staff,
  stats,
  sharedLogin,
}: {
  initial: InboxSummary[];
  role: Role;
  username: string;
  staff: Staff[];
  stats: { due: number; onTime: number };
  sharedLogin: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [status, setStatus] = useState<string>("open");
  const [type, setType] = useState("all");
  const [ageFilter, setAgeFilter] = useState<(typeof AGE_FILTERS)[number][0]>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<InboxSummary | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const canAssign = role === "pastor" || role === "admin";
  const canDelete = role === "pastor" || role === "admin";

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const types = useMemo(() => Array.from(new Set(items.map((i) => i.intent))).sort(), [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((s) => {
      if (status === "open" ? s.status === "closed" || s.status === "archived" : status !== "all" && s.status !== status) return false;
      if (type !== "all" && s.intent !== type) return false;
      const waited = now - Date.parse(s.createdAt);
      if (ageFilter === "under12" && waited >= DAY / 2) return false;
      if (ageFilter === "near" && (s.firstRepliedAt || waited < DAY / 2 || waited >= DAY)) return false;
      if (ageFilter === "over" && (s.firstRepliedAt || waited < DAY)) return false;
      return !q || `${s.displayName} ${s.intent} ${s.assignedTo ?? ""}`.toLowerCase().includes(q);
    });
  }, [items, status, type, ageFilter, query, now]);

  async function patch(id: string, body: Record<string, unknown>, local: Partial<InboxSummary>) {
    setError(null);
    const res = await fetch(`/api/submissions/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    if (!res?.ok) {
      const data = await res?.json().catch(() => ({}));
      setError(data?.error || "That change was not saved. Try again.");
      return;
    }
    setItems((prev) => prev.map((s) => (s.id === id ? { ...s, ...local } : s)));
    setSelected((s) => (s && s.id === id ? { ...s, ...local } : s));
  }

  async function open(s: InboxSummary) {
    setSelected(s);
    setDetail(null);
    setError(null);
    const res = await fetch(`/api/submissions/${s.id}/`).catch(() => null);
    if (!res?.ok) {
      setError("This request could not be opened.");
      return;
    }
    setDetail(await res.json());
    if (s.status === "new") patch(s.id, { status: "read" }, { status: "read" });
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this request permanently? This is recorded in the audit log.")) return;
    const res = await fetch(`/api/submissions/${id}/`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) {
      setError("The request was not deleted.");
      return;
    }
    setItems((prev) => prev.filter((s) => s.id !== id));
    setSelected(null);
  }

  async function logout() {
    await fetch("/api/admin/logout/", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  const pct = stats.due ? Math.round((stats.onTime / stats.due) * 100) : null;

  return (
    <div className="min-h-screen bg-ivory-dark text-ink">
      <header className="sticky top-0 z-20 bg-midnight text-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div>
              <p className="eyebrow text-gold leading-none">VOGIM Admin · {username} ({role})</p>
              <h1 className="font-display text-xl sm:text-2xl mt-1 leading-none">Request inbox</h1>
            </div>
            {role === "admin" && <AdminTabs />}
          </div>
          <button onClick={logout} className="inline-flex min-h-11 items-center gap-2 text-[11px] tracking-[0.2em] uppercase border border-white/25 text-white/80 px-3 py-2 hover:bg-white/10">
            <LogOut size={14} aria-hidden="true" /> Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 sm:px-6 py-6 sm:py-8">
        {sharedLogin && (
          <p className="mb-5 border-l-4 border-coral bg-white px-4 py-3 text-sm">
            This inbox is using the shared admin password. Create individual staff accounts with MFA (ADMIN_USERS) before more people use it.
          </p>
        )}

        <section aria-label="Reply measure" className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="bg-white border border-midnight/10 p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-slate">Replied within 24 hours, last 7 days</p>
            <p className="mt-1 font-display text-3xl">{pct === null ? "No requests due" : `${pct}%`}</p>
            <p className="text-sm text-slate">{stats.onTime} of {stats.due} requests</p>
          </div>
          <div className="bg-white border border-midnight/10 p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-slate">Waiting over 24 hours</p>
            <p className="mt-1 font-display text-3xl">{items.filter((s) => !s.firstRepliedAt && now - Date.parse(s.createdAt) >= DAY && s.status !== "closed").length}</p>
          </div>
          <div className="bg-white border border-midnight/10 p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-slate">Flagged urgent</p>
            <p className="mt-1 font-display text-3xl">{items.filter((s) => s.urgent && s.status !== "closed").length}</p>
          </div>
        </section>

        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          <label className="text-sm">
            <span className="block text-xs uppercase tracking-[0.15em] text-slate">Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full min-h-11 border border-input bg-white px-2">
              <option value="open">All open</option>
              <option value="all">Everything</option>
              {WORKFLOW.map((w) => <option key={w} value={w}>{LABELS[w]}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="block text-xs uppercase tracking-[0.15em] text-slate">Type</span>
            <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 w-full min-h-11 border border-input bg-white px-2">
              <option value="all">All types</option>
              {types.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="block text-xs uppercase tracking-[0.15em] text-slate">Age</span>
            <select value={ageFilter} onChange={(e) => setAgeFilter(e.target.value as typeof ageFilter)} className="mt-1 w-full min-h-11 border border-input bg-white px-2">
              {AGE_FILTERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="text-sm relative">
            <span className="block text-xs uppercase tracking-[0.15em] text-slate">Search names and types</span>
            <Search size={15} aria-hidden="true" className="absolute left-3 bottom-3.5 text-midnight/40" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="mt-1 w-full min-h-11 border border-input bg-white pl-9 pr-3" />
          </label>
        </div>

        <p role="status" aria-live="polite" className="mb-3 text-sm text-coral">{error}</p>

        {filtered.length === 0 ? (
          <div className="border border-dashed border-midnight/20 bg-white py-20 text-center">
            <Inbox className="mx-auto text-midnight/30" size={32} aria-hidden="true" />
            <p className="mt-4 font-display text-xl">No requests match these filters.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((s) => {
              const waited = now - Date.parse(s.createdAt);
              const late = !s.firstRepliedAt && waited >= DAY;
              const near = !s.firstRepliedAt && !late && waited >= DAY * 0.75;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => open(s)}
                    className={`w-full text-left bg-white border p-4 flex items-start gap-4 hover:border-gold/60 ${late ? "border-coral" : near ? "border-gold" : "border-midnight/10"}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap text-[11px] uppercase tracking-[0.15em]">
                        <span className="border border-midnight/20 px-2 py-0.5">{LABELS[s.status] ?? s.status}</span>
                        <span className="text-gold-deep">{s.intent}</span>
                        {s.urgent && <span className="inline-flex items-center gap-1 text-coral"><Flag size={12} aria-hidden="true" /> Urgent</span>}
                        {s.assignedTo && <span className="text-slate">Assigned: {s.assignedTo}</span>}
                      </div>
                      <p className="font-display text-lg mt-1.5 truncate">{s.displayName}</p>
                    </div>
                    <span className={`text-xs whitespace-nowrap flex items-center gap-1 ${late ? "text-coral font-semibold" : near ? "text-gold-deep font-semibold" : "text-slate"}`}>
                      {s.firstRepliedAt ? <CheckCircle2 size={13} aria-hidden="true" /> : <Clock size={13} aria-hidden="true" />}
                      {s.firstRepliedAt ? "Replied" : `${age(waited)} waiting`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      {selected && (
        <div className="fixed inset-0 z-30 bg-midnight/50 flex justify-end" onClick={() => setSelected(null)}>
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={`${selected.intent} from ${selected.displayName}`}
            className="w-full max-w-md bg-ivory h-full overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.key === "Escape" && setSelected(null)}
          >
            <div className="bg-midnight text-white p-5 sticky top-0 flex items-start justify-between">
              <div>
                <p className="eyebrow text-gold">{selected.intent}</p>
                <h2 className="font-display text-2xl mt-1">{detail?.fields.name || selected.displayName}</h2>
                <p className="text-white/70 text-xs mt-1">Received {new Date(selected.createdAt).toLocaleString()}</p>
              </div>
              <button autoFocus onClick={() => setSelected(null)} className="min-h-11 min-w-11 text-white/80 hover:text-gold" aria-label="Close">
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {!detail ? (
                <p className="text-slate">Opening…</p>
              ) : (
                <dl className="divide-y divide-midnight/10 border border-midnight/10 bg-white">
                  {Object.entries(detail.fields).map(([k, v]) => (
                    <div key={k} className="px-4 py-3">
                      <dt className="text-[10px] tracking-[0.25em] uppercase text-gold-deep">{k}</dt>
                      <dd className="text-sm mt-1 whitespace-pre-wrap break-words">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}

              <label className="block text-sm">
                <span className="block text-xs uppercase tracking-[0.15em] text-slate">Status</span>
                <select
                  value={selected.status}
                  onChange={(e) => patch(selected.id, { status: e.target.value }, { status: e.target.value })}
                  className="mt-1 w-full min-h-11 border border-input bg-white px-2"
                >
                  {WORKFLOW.map((w) => <option key={w} value={w}>{LABELS[w]}</option>)}
                </select>
              </label>

              {canAssign && (
                <label className="block text-sm">
                  <span className="block text-xs uppercase tracking-[0.15em] text-slate">Assigned to</span>
                  <select
                    value={selected.assignedTo ?? ""}
                    onChange={(e) => patch(selected.id, { assignedTo: e.target.value || null }, { assignedTo: e.target.value || null })}
                    className="mt-1 w-full min-h-11 border border-input bg-white px-2"
                  >
                    <option value="">Nobody</option>
                    {staff.filter((p) => p.role === "intercessor" || p.role === "pastor").map((p) => (
                      <option key={p.username} value={p.username}>{p.username} ({p.role})</option>
                    ))}
                  </select>
                </label>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  disabled={Boolean(selected.firstRepliedAt)}
                  onClick={() => patch(selected.id, { replied: true }, { firstRepliedAt: new Date().toISOString() })}
                  className="btn-gold disabled:opacity-40"
                >
                  {selected.firstRepliedAt ? "Reply recorded" : "Mark first reply sent"}
                </button>
                <button onClick={() => patch(selected.id, { urgent: !selected.urgent }, { urgent: !selected.urgent })} className="btn-ghost">
                  <Flag size={14} aria-hidden="true" /> {selected.urgent ? "Remove urgent flag" : "Flag for same-day follow-up"}
                </button>
              </div>
              <p className="text-xs text-slate">Flag a request only after a person has read it and judged it urgent. Follow the safeguarding policy.</p>

              {canDelete && (
                <button onClick={() => remove(selected.id)} className="inline-flex min-h-11 items-center gap-2 text-xs uppercase tracking-[0.2em] border border-coral/50 text-coral px-4 py-2.5 hover:bg-coral hover:text-white">
                  <Trash2 size={14} aria-hidden="true" /> Delete request
                </button>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
