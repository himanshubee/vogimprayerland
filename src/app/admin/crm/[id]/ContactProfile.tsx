"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Trash2,
  Check,
  StickyNote,
  PhoneCall,
  Send,
  MessageCircle,
  FileText,
  ArrowRightLeft,
} from "lucide-react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import type { Contact, CrmEvent, EventType, Stage } from "@/lib/crm";

const EVENT_ICON: Record<EventType, typeof StickyNote> = {
  note: StickyNote,
  call: PhoneCall,
  email: Mail,
  whatsapp: MessageCircle,
  submission: FileText,
  stage: ArrowRightLeft,
  system: FileText,
};

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const inputCls =
  "w-full bg-white border border-midnight/15 px-3 py-2.5 text-sm outline-none focus:border-gold transition-colors";

export function ContactProfile({
  contact: initial,
  timeline: initialTimeline,
  stages,
}: {
  contact: Contact;
  timeline: CrmEvent[];
  stages: Stage[];
}) {
  const router = useRouter();
  const [c, setC] = useState(initial);
  const [timeline, setTimeline] = useState(initialTimeline);
  const [tab, setTab] = useState<"note" | "call" | "whatsapp" | "email">("note");
  const [text, setText] = useState("");
  const [subject, setSubject] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [tagInput, setTagInput] = useState("");

  async function patch(p: Partial<Contact>) {
    setC((prev) => ({ ...prev, ...p }));
    const res = await fetch(`/api/contacts/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    })
      .then((r) => r.json())
      .catch(() => null);
    if (res?.contact) {
      setC(res.contact);
      router.refresh();
    }
  }

  async function addTag() {
    const t = tagInput.trim();
    if (!t || c.tags.includes(t)) return setTagInput("");
    setTagInput("");
    await patch({ tags: [...c.tags, t] });
  }

  async function submit() {
    setBusy(true);
    setMsg(null);
    try {
      if (tab === "email") {
        const res = await fetch(`/api/contacts/${c.id}/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject, message: text }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Send failed");
        setTimeline((prev) => [data.event, ...prev]);
        setSubject("");
        setMsg({ kind: "ok", text: "Email sent." });
      } else {
        const res = await fetch(`/api/contacts/${c.id}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: tab, body: text }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed");
        setTimeline((prev) => [data.event, ...prev]);
        setMsg({ kind: "ok", text: "Saved." });
      }
      setText("");
      router.refresh();
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "Failed" });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this contact and its entire timeline?")) return;
    await fetch(`/api/contacts/${c.id}`, { method: "DELETE" }).catch(() => {});
    router.push("/admin/crm");
    router.refresh();
  }

  const waHref = c.phone ? `https://wa.me/${c.phone.replace(/[^\d]/g, "")}` : null;

  return (
    <div className="min-h-screen bg-ivory-dark text-ink">
      <header className="sticky top-0 z-20 bg-midnight text-white">
        <div className="mx-auto max-w-5xl px-5 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div>
              <p className="eyebrow text-gold leading-none">VOGIM Admin</p>
              <h1 className="font-display text-xl sm:text-2xl mt-1 leading-none">CRM</h1>
            </div>
            <AdminTabs />
          </div>
          <Link
            href="/admin/crm"
            className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase border border-white/25 text-white/80 px-3 py-2 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={14} /> All contacts
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 sm:px-6 py-6 sm:py-8 grid lg:grid-cols-[1fr_1.4fr] gap-6">
        {/* LEFT: details */}
        <div className="space-y-6">
          <section className="bg-white border border-midnight/10 p-5">
            <input
              value={c.name}
              onChange={(e) => setC({ ...c, name: e.target.value })}
              onBlur={(e) => patch({ name: e.target.value })}
              placeholder="Name"
              className="font-display text-2xl text-midnight w-full outline-none border-b border-transparent focus:border-gold pb-1"
            />

            <div className="mt-5 space-y-3">
              <label className="block">
                <span className="text-[10px] tracking-[0.22em] uppercase text-midnight/50">
                  Stage
                </span>
                <select
                  value={c.stage}
                  onChange={(e) => patch({ stage: e.target.value })}
                  className={`${inputCls} mt-1`}
                >
                  {stages.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>

              <Field
                icon={Mail}
                value={c.email}
                placeholder="Email"
                onSave={(v) => patch({ email: v })}
                onChange={(v) => setC({ ...c, email: v })}
              />
              <Field
                icon={Phone}
                value={c.phone}
                placeholder="Phone"
                onSave={(v) => patch({ phone: v })}
                onChange={(v) => setC({ ...c, phone: v })}
              />
              <Field
                icon={MapPin}
                value={c.country}
                placeholder="Country"
                onSave={(v) => patch({ country: v })}
                onChange={(v) => setC({ ...c, country: v })}
              />
            </div>

            {/* quick actions */}
            <div className="flex flex-wrap gap-2 mt-4">
              {c.email && (
                <a
                  href={`mailto:${c.email}`}
                  className="inline-flex items-center gap-1.5 text-xs border border-midnight/20 px-3 py-1.5 hover:border-gold transition-colors"
                >
                  <Mail size={13} /> Email
                </a>
              )}
              {waHref && (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs border border-midnight/20 px-3 py-1.5 hover:border-gold transition-colors"
                >
                  <MessageCircle size={13} /> WhatsApp
                </a>
              )}
            </div>

            {/* tags */}
            <div className="mt-5">
              <span className="text-[10px] tracking-[0.22em] uppercase text-midnight/50">
                Tags
              </span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {c.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 text-xs bg-gold/10 text-gold-deep border border-gold/30 px-2 py-0.5"
                  >
                    {t}
                    <button
                      onClick={() => patch({ tags: c.tags.filter((x) => x !== t) })}
                      className="hover:text-red-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTag()}
                onBlur={addTag}
                placeholder="Add tag + Enter"
                className={`${inputCls} mt-2 !py-2`}
              />
            </div>

            <div className="mt-5 pt-4 border-t border-midnight/10 text-xs text-midnight/45 space-y-1">
              <p>{c.submissionIds.length} linked request(s)</p>
              {c.intents.length > 0 && <p>Intents: {c.intents.join(", ")}</p>}
              <p>Added {fmtDateTime(c.createdAt)}</p>
            </div>

            <button
              onClick={remove}
              className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-red-700/70 hover:text-white hover:bg-red-700 border border-red-700/30 px-4 py-2.5 mt-5 transition-colors"
            >
              <Trash2 size={14} /> Delete contact
            </button>
          </section>
        </div>

        {/* RIGHT: activity */}
        <div className="space-y-6">
          {/* composer */}
          <section className="bg-white border border-midnight/10 p-5">
            <div className="flex gap-1 mb-3">
              {(
                [
                  ["note", "Note", StickyNote],
                  ["call", "Call", PhoneCall],
                  ["whatsapp", "WhatsApp", MessageCircle],
                  ["email", "Email", Mail],
                ] as const
              ).map(([k, label, Icon]) => (
                <button
                  key={k}
                  onClick={() => {
                    setTab(k);
                    setMsg(null);
                  }}
                  className={`inline-flex items-center gap-1.5 text-[11px] tracking-[0.12em] uppercase px-3 py-2 border transition-colors ${
                    tab === k
                      ? "bg-midnight text-gold border-midnight"
                      : "border-midnight/20 text-midnight/60 hover:border-midnight/40"
                  }`}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>

            {tab === "email" && (
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className={`${inputCls} mb-2`}
              />
            )}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={tab === "email" ? 5 : 3}
              placeholder={
                tab === "email"
                  ? "Write your email…"
                  : tab === "call"
                  ? "Log what was discussed on the call…"
                  : tab === "whatsapp"
                  ? "Log the WhatsApp conversation…"
                  : "Add a note…"
              }
              className={inputCls}
            />
            {tab === "email" && !c.email && (
              <p className="text-xs text-red-600 mt-2">
                This contact has no email address.
              </p>
            )}
            {msg && (
              <p
                className={`text-xs mt-2 ${
                  msg.kind === "ok" ? "text-green-700" : "text-red-600"
                }`}
              >
                {msg.text}
              </p>
            )}
            <div className="flex justify-end mt-3">
              <button
                onClick={submit}
                disabled={busy || !text.trim() || (tab === "email" && !c.email)}
                className="btn-gold !py-2 !px-4 !text-[11px] disabled:opacity-50"
              >
                {tab === "email" ? <Send size={14} /> : <Check size={14} />}
                {busy ? "Saving…" : tab === "email" ? "Send email" : "Add entry"}
              </button>
            </div>
          </section>

          {/* timeline */}
          <section>
            <h3 className="eyebrow text-gold-deep mb-3">Timeline</h3>
            {timeline.length === 0 ? (
              <p className="text-sm text-midnight/40 bg-white border border-dashed border-midnight/15 py-8 text-center">
                No activity yet.
              </p>
            ) : (
              <ol className="space-y-2">
                {timeline.map((e) => {
                  const Icon = EVENT_ICON[e.type] ?? FileText;
                  return (
                    <li
                      key={e.id}
                      className="bg-white border border-midnight/10 p-4 flex gap-3"
                    >
                      <div className="shrink-0 w-8 h-8 rounded-full bg-ivory border border-midnight/10 flex items-center justify-center text-midnight/50">
                        <Icon size={15} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] tracking-[0.2em] uppercase text-gold-deep">
                            {e.type}
                            {e.meta?.subject ? ` · ${e.meta.subject}` : ""}
                          </span>
                          <span className="text-[11px] text-midnight/40 shrink-0">
                            {fmtDateTime(e.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-midnight mt-1 whitespace-pre-wrap break-words">
                          {e.body}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  value,
  placeholder,
  onChange,
  onSave,
}: {
  icon: typeof Mail;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  onSave: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={15} className="text-midnight/40 shrink-0" />
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onSave(e.target.value)}
        className="flex-1 border-b border-midnight/15 focus:border-gold py-1.5 text-sm outline-none"
      />
    </div>
  );
}
