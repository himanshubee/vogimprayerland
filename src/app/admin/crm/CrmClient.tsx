"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Users,
  LayoutGrid,
  List,
  RefreshCw,
  Settings2,
  Plus,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Clock,
  Check,
} from "lucide-react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import type { Contact, Stage } from "@/lib/crm";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StageBadge({ stage, stages }: { stage: string; stages: Stage[] }) {
  const s = stages.find((x) => x.key === stage);
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase px-2 py-0.5 border"
      style={{ borderColor: `${s?.color ?? "#94a3b8"}66`, color: s?.color ?? "#64748b" }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: s?.color ?? "#94a3b8" }}
      />
      {s?.label ?? stage}
    </span>
  );
}

export function CrmClient({
  initial,
  stages: initialStages,
}: {
  initial: Contact[];
  stages: Stage[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [stages, setStages] = useState(initialStages);
  const [view, setView] = useState<"list" | "board">("list");
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [syncing, setSyncing] = useState(false);
  const [showStages, setShowStages] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((c) => {
      if (stageFilter !== "all" && c.stage !== stageFilter) return false;
      if (!q) return true;
      return [c.name, c.email, c.phone, c.country, c.intents.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [items, query, stageFilter]);

  async function sync() {
    setSyncing(true);
    await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync" }),
    }).catch(() => {});
    const res = await fetch("/api/contacts").then((r) => r.json()).catch(() => null);
    if (res?.items) setItems(res.items);
    setSyncing(false);
    router.refresh();
  }

  async function moveStage(id: string, stage: string) {
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, stage } : c)));
    await fetch(`/api/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    }).catch(() => {});
  }

  return (
    <div className="min-h-screen bg-ivory-dark text-ink">
      <header className="sticky top-0 z-20 bg-midnight text-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div>
              <p className="eyebrow text-gold leading-none">VOGIM Admin</p>
              <h1 className="font-display text-xl sm:text-2xl mt-1 leading-none">CRM</h1>
            </div>
            <AdminTabs />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStages((v) => !v)}
              className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase border border-white/25 text-white/80 px-3 py-2 hover:bg-white/10 transition-colors"
            >
              <Settings2 size={14} /> Stages
            </button>
            <button
              onClick={sync}
              disabled={syncing}
              className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase border border-gold/40 text-gold px-3 py-2 hover:bg-gold hover:text-midnight transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing…" : "Sync"}
            </button>
          </div>
        </div>
      </header>

      {showStages && (
        <StagesEditor
          stages={stages}
          onClose={() => setShowStages(false)}
          onSaved={(next) => {
            setStages(next);
            setShowStages(false);
          }}
        />
      )}

      <div className="mx-auto max-w-6xl px-5 sm:px-6 py-6 sm:py-8">
        {/* CONTROLS */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="flex border border-midnight/20">
            <button
              onClick={() => setView("list")}
              className={`inline-flex items-center gap-1.5 text-[11px] tracking-[0.15em] uppercase px-3 py-2 transition-colors ${
                view === "list" ? "bg-midnight text-gold" : "text-midnight/60"
              }`}
            >
              <List size={14} /> List
            </button>
            <button
              onClick={() => setView("board")}
              className={`inline-flex items-center gap-1.5 text-[11px] tracking-[0.15em] uppercase px-3 py-2 transition-colors ${
                view === "board" ? "bg-midnight text-gold" : "text-midnight/60"
              }`}
            >
              <LayoutGrid size={14} /> Board
            </button>
          </div>

          {view === "list" && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {["all", ...stages.map((s) => s.key)].map((k) => {
                const on = k === stageFilter;
                const label = k === "all" ? "All" : stages.find((s) => s.key === k)?.label ?? k;
                return (
                  <button
                    key={k}
                    onClick={() => setStageFilter(k)}
                    className={`shrink-0 text-[11px] tracking-[0.15em] uppercase px-3 py-2 border transition-colors ${
                      on
                        ? "bg-midnight text-gold border-midnight"
                        : "border-midnight/20 text-midnight/60 hover:border-midnight/40"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="relative sm:ml-auto sm:w-64">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-midnight/40"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search contacts…"
              className="w-full bg-white border border-midnight/15 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-gold transition-colors"
            />
          </div>
        </div>

        {items.length === 0 ? (
          <div className="border border-dashed border-midnight/20 bg-white py-20 text-center">
            <Users className="mx-auto text-midnight/30" size={32} />
            <p className="mt-4 text-midnight/60 font-display text-xl">No contacts yet.</p>
            <p className="text-midnight/40 text-sm mt-1">
              Click <strong>Sync</strong> to build contacts from existing submissions.
            </p>
          </div>
        ) : view === "list" ? (
          <div className="bg-white border border-midnight/10 divide-y divide-midnight/8">
            {filtered.map((c) => (
              <Link
                key={c.id}
                href={`/admin/crm/${c.id}`}
                className="flex items-center gap-4 p-4 hover:bg-ivory/60 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display text-lg text-midnight truncate">
                      {c.name || "Anonymous"}
                    </span>
                    <StageBadge stage={c.stage} stages={stages} />
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-midnight/55 flex-wrap">
                    {c.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail size={12} /> {c.email}
                      </span>
                    )}
                    {c.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone size={12} /> {c.phone}
                      </span>
                    )}
                    {c.country && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} /> {c.country}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] text-midnight/40 inline-flex items-center gap-1">
                    <Clock size={12} /> {fmtDate(c.lastActivityAt)}
                  </p>
                  <p className="text-[11px] text-gold-deep mt-1">
                    {c.submissionIds.length} request
                    {c.submissionIds.length === 1 ? "" : "s"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* BOARD */
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((s) => {
              const col = filtered.filter((c) => c.stage === s.key);
              return (
                <div key={s.key} className="w-72 shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-[11px] tracking-[0.18em] uppercase font-medium"
                      style={{ color: s.color }}
                    >
                      {s.label}
                    </span>
                    <span className="text-[11px] text-midnight/40">{col.length}</span>
                  </div>
                  <div className="space-y-2">
                    {col.map((c) => (
                      <div
                        key={c.id}
                        className="bg-white border border-midnight/10 p-3"
                        style={{ borderLeft: `3px solid ${s.color}` }}
                      >
                        <Link
                          href={`/admin/crm/${c.id}`}
                          className="font-display text-midnight hover:text-gold-deep transition-colors block truncate"
                        >
                          {c.name || "Anonymous"}
                        </Link>
                        {c.email && (
                          <p className="text-xs text-midnight/50 truncate mt-0.5">
                            {c.email}
                          </p>
                        )}
                        <select
                          value={c.stage}
                          onChange={(e) => moveStage(c.id, e.target.value)}
                          className="mt-2 w-full text-[11px] border border-midnight/15 bg-ivory/50 px-2 py-1 outline-none focus:border-gold"
                        >
                          {stages.map((st) => (
                            <option key={st.key} value={st.key}>
                              {st.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                    {col.length === 0 && (
                      <div className="border border-dashed border-midnight/15 py-6 text-center text-xs text-midnight/30">
                        Empty
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* --------------------------- Stages editor --------------------------- */

function StagesEditor({
  stages,
  onClose,
  onSaved,
}: {
  stages: Stage[];
  onClose: () => void;
  onSaved: (s: Stage[]) => void;
}) {
  const [list, setList] = useState<Stage[]>(stages);
  const [busy, setBusy] = useState(false);

  function set(i: number, p: Partial<Stage>) {
    setList((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...p } : s)));
  }

  async function save() {
    setBusy(true);
    const res = await fetch("/api/crm/stages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stages: list }),
    })
      .then((r) => r.json())
      .catch(() => null);
    setBusy(false);
    if (res?.stages) onSaved(res.stages);
  }

  return (
    <div className="border-b border-midnight/10 bg-white">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-midnight">Pipeline stages</h3>
          <button onClick={onClose} className="text-sm text-midnight/50 hover:text-midnight">
            Close
          </button>
        </div>
        <div className="space-y-2">
          {list.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="color"
                value={s.color}
                onChange={(e) => set(i, { color: e.target.value })}
                className="h-9 w-10 border border-midnight/15 bg-white"
              />
              <input
                value={s.label}
                onChange={(e) => set(i, { label: e.target.value })}
                placeholder="Stage name"
                className="flex-1 border border-midnight/15 px-3 py-2 text-sm outline-none focus:border-gold"
              />
              <button
                onClick={() => setList((prev) => prev.filter((_, idx) => idx !== i))}
                className="p-2 text-midnight/40 hover:text-red-600"
                aria-label="Remove stage"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() =>
              setList((prev) => [...prev, { key: "", label: "", color: "#94a3b8" }])
            }
            className="inline-flex items-center gap-1.5 text-sm text-gold-deep hover:underline"
          >
            <Plus size={14} /> Add stage
          </button>
          <button onClick={save} disabled={busy} className="btn-gold !py-2 !px-4 !text-[11px]">
            <Check size={14} /> {busy ? "Saving…" : "Save stages"}
          </button>
        </div>
      </div>
    </div>
  );
}
