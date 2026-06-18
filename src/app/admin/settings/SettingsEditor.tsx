"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Check, Save, GripVertical } from "lucide-react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import type { SiteSettings, NavLink } from "@/lib/settings";

const inputCls =
  "w-full bg-white border border-midnight/15 px-3 py-2.5 text-sm outline-none focus:border-gold transition-colors";
const labelCls =
  "block text-[10px] tracking-[0.22em] uppercase text-midnight/50 mb-1.5";

type Link = { label: string; href: string };

function FooterCol({
  title,
  links,
  onTitle,
  onLinks,
}: {
  title: string;
  links: Link[];
  onTitle: (v: string) => void;
  onLinks: (v: Link[]) => void;
}) {
  return (
    <div className="space-y-2">
      <input
        className={inputCls}
        value={title}
        placeholder="Column title"
        onChange={(e) => onTitle(e.target.value)}
      />
      {links.map((l, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            className={`${inputCls} !py-2`}
            value={l.label}
            placeholder="Label"
            onChange={(e) =>
              onLinks(links.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)))
            }
          />
          <input
            className={`${inputCls} !py-2`}
            value={l.href}
            placeholder="/path"
            onChange={(e) =>
              onLinks(links.map((x, idx) => (idx === i ? { ...x, href: e.target.value } : x)))
            }
          />
          <button
            onClick={() => onLinks(links.filter((_, idx) => idx !== i))}
            className="p-1.5 text-midnight/40 hover:text-red-600"
            aria-label="Remove link"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        onClick={() => onLinks([...links, { label: "", href: "" }])}
        className="inline-flex items-center gap-1.5 text-xs text-gold-deep hover:underline"
      >
        <Plus size={12} /> Add link
      </button>
    </div>
  );
}

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-midnight/10 p-5 sm:p-6">
      <h2 className="font-display text-xl text-midnight">{title}</h2>
      {desc && <p className="text-sm text-midnight/55 mt-1">{desc}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

export function SettingsEditor({ initial }: { initial: SiteSettings }) {
  const router = useRouter();
  const [s, setS] = useState<SiteSettings>(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function patch(p: Partial<SiteSettings>) {
    setS((prev) => ({ ...prev, ...p }));
    setSaved(false);
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Save failed");
      setS(data.settings);
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  /* ---- Navigation helpers ---- */
  function updateNav(next: NavLink[]) {
    patch({ nav: next });
  }
  function setLink(i: number, p: Partial<NavLink>) {
    updateNav(s.nav.map((l, idx) => (idx === i ? { ...l, ...p } : l)));
  }
  function moveLink(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= s.nav.length) return;
    const next = [...s.nav];
    [next[i], next[j]] = [next[j], next[i]];
    updateNav(next);
  }
  function setChild(li: number, ci: number, p: { label?: string; href?: string }) {
    setLink(li, {
      children: (s.nav[li].children ?? []).map((c, idx) =>
        idx === ci ? { ...c, ...p } : c
      ),
    });
  }

  return (
    <div className="min-h-screen bg-ivory-dark text-ink">
      {/* TOP BAR */}
      <header className="sticky top-0 z-20 bg-midnight text-white">
        <div className="mx-auto max-w-4xl px-5 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div>
              <p className="eyebrow text-gold leading-none">VOGIM Admin</p>
              <h1 className="font-display text-xl sm:text-2xl mt-1 leading-none">
                Site Settings
              </h1>
            </div>
            <AdminTabs />
          </div>
          <button
            onClick={save}
            disabled={busy}
            className="btn-gold !py-2 !px-4 !text-[11px] disabled:opacity-50"
          >
            {saved ? <Check size={14} /> : <Save size={14} />}
            {busy ? "Saving…" : saved ? "Saved" : "Save changes"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 sm:px-6 py-6 sm:py-8 space-y-6">
        {error && (
          <div className="border border-red-300 bg-red-50 text-red-700 text-sm px-4 py-3">
            {error}
          </div>
        )}

        {/* CONTACT */}
        <Section title="Contact details" desc="Shown in the footer and on the contact page.">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Email</label>
              <input
                className={inputCls}
                value={s.email}
                onChange={(e) => patch({ email: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input
                className={inputCls}
                value={s.phone}
                onChange={(e) => patch({ phone: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>WhatsApp number (digits only)</label>
            <input
              className={inputCls}
              value={s.whatsapp}
              placeholder="2348150743998"
              onChange={(e) => patch({ whatsapp: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Address (one line per row)</label>
            <textarea
              className={inputCls}
              rows={3}
              value={s.address.join("\n")}
              onChange={(e) =>
                patch({ address: e.target.value.split("\n").map((l) => l.trim()) })
              }
            />
          </div>
        </Section>

        {/* SOCIAL */}
        <Section title="Social links" desc="Full URLs. Leave blank to hide an icon.">
          <div className="grid sm:grid-cols-2 gap-4">
            {(["facebook", "youtube", "instagram", "whatsapp"] as const).map((k) => (
              <div key={k}>
                <label className={`${labelCls} capitalize`}>{k}</label>
                <input
                  className={inputCls}
                  value={s.social[k]}
                  placeholder="https://…"
                  onChange={(e) =>
                    patch({ social: { ...s.social, [k]: e.target.value } })
                  }
                />
              </div>
            ))}
          </div>
        </Section>

        {/* ANNOUNCEMENT */}
        <Section title="Announcement bar" desc="The thin strip above the navbar (desktop).">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={s.announcement.enabled}
              onChange={(e) =>
                patch({ announcement: { ...s.announcement, enabled: e.target.checked } })
              }
            />
            Show announcement bar
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Left text</label>
              <input
                className={inputCls}
                value={s.announcement.left}
                onChange={(e) =>
                  patch({ announcement: { ...s.announcement, left: e.target.value } })
                }
              />
            </div>
            <div>
              <label className={labelCls}>Right text</label>
              <input
                className={inputCls}
                value={s.announcement.right}
                onChange={(e) =>
                  patch({ announcement: { ...s.announcement, right: e.target.value } })
                }
              />
            </div>
          </div>
        </Section>

        {/* FOOTER */}
        <Section title="Footer">
          <div>
            <label className={labelCls}>Scripture quote</label>
            <textarea
              className={inputCls}
              rows={3}
              value={s.footerQuote}
              onChange={(e) => patch({ footerQuote: e.target.value })}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Quote reference</label>
              <input
                className={inputCls}
                value={s.footerQuoteRef}
                onChange={(e) => patch({ footerQuoteRef: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Tagline</label>
              <input
                className={inputCls}
                value={s.footerTagline}
                onChange={(e) => patch({ footerTagline: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Copyright name</label>
            <input
              className={inputCls}
              value={s.copyrightName}
              onChange={(e) => patch({ copyrightName: e.target.value })}
            />
          </div>
        </Section>

        {/* FOOTER LINKS */}
        <Section title="Footer link columns" desc="The two link lists shown in the footer.">
          <FooterCol
            title={s.footerCol1Title}
            links={s.footerCol1}
            onTitle={(v) => patch({ footerCol1Title: v })}
            onLinks={(v) => patch({ footerCol1: v })}
          />
          <div className="border-t border-midnight/10 !mt-5 pt-5">
            <FooterCol
              title={s.footerCol2Title}
              links={s.footerCol2}
              onTitle={(v) => patch({ footerCol2Title: v })}
              onLinks={(v) => patch({ footerCol2: v })}
            />
          </div>
        </Section>

        {/* SERVICE TIMES */}
        <Section title="Service times" desc="The schedule strip on the contact page.">
          {s.serviceTimes.map((t, i) => (
            <div key={i} className="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
              <div>
                <label className={labelCls}>Title</label>
                <input
                  className={inputCls}
                  value={t.title}
                  onChange={(e) =>
                    patch({
                      serviceTimes: s.serviceTimes.map((x, idx) =>
                        idx === i ? { ...x, title: e.target.value } : x
                      ),
                    })
                  }
                />
              </div>
              <div>
                <label className={labelCls}>When</label>
                <input
                  className={inputCls}
                  value={t.when}
                  onChange={(e) =>
                    patch({
                      serviceTimes: s.serviceTimes.map((x, idx) =>
                        idx === i ? { ...x, when: e.target.value } : x
                      ),
                    })
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Mode</label>
                <input
                  className={inputCls}
                  value={t.mode}
                  onChange={(e) =>
                    patch({
                      serviceTimes: s.serviceTimes.map((x, idx) =>
                        idx === i ? { ...x, mode: e.target.value } : x
                      ),
                    })
                  }
                />
              </div>
              <button
                onClick={() =>
                  patch({ serviceTimes: s.serviceTimes.filter((_, idx) => idx !== i) })
                }
                className="p-2.5 text-midnight/40 hover:text-red-600 transition-colors"
                aria-label="Remove"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              patch({
                serviceTimes: [...s.serviceTimes, { title: "", when: "", mode: "" }],
              })
            }
            className="inline-flex items-center gap-1.5 text-sm text-gold-deep hover:underline"
          >
            <Plus size={14} /> Add service time
          </button>
        </Section>

        {/* NAVIGATION */}
        <Section
          title="Navigation menu"
          desc="Top-level links and their dropdown items. Links point to paths like /about."
        >
          {s.nav.map((link, i) => (
            <div key={i} className="border border-midnight/10 p-4 bg-ivory/40">
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <button
                    onClick={() => moveLink(i, -1)}
                    disabled={i === 0}
                    className="text-midnight/30 hover:text-midnight disabled:opacity-20"
                    aria-label="Move up"
                  >
                    <GripVertical size={14} />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 flex-1">
                  <input
                    className={inputCls}
                    value={link.label}
                    placeholder="Label"
                    onChange={(e) => setLink(i, { label: e.target.value })}
                  />
                  <input
                    className={inputCls}
                    value={link.href}
                    placeholder="/path"
                    onChange={(e) => setLink(i, { href: e.target.value })}
                  />
                </div>
                <button
                  onClick={() => updateNav(s.nav.filter((_, idx) => idx !== i))}
                  className="p-2 text-midnight/40 hover:text-red-600 transition-colors"
                  aria-label="Remove link"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* children */}
              <div className="mt-3 pl-6 space-y-2">
                {(link.children ?? []).map((c, ci) => (
                  <div key={ci} className="flex items-center gap-2">
                    <span className="text-midnight/30 text-xs">—</span>
                    <input
                      className={`${inputCls} !py-2`}
                      value={c.label}
                      placeholder="Sub-label"
                      onChange={(e) => setChild(i, ci, { label: e.target.value })}
                    />
                    <input
                      className={`${inputCls} !py-2`}
                      value={c.href}
                      placeholder="/path"
                      onChange={(e) => setChild(i, ci, { href: e.target.value })}
                    />
                    <button
                      onClick={() =>
                        setLink(i, {
                          children: (link.children ?? []).filter(
                            (_, idx) => idx !== ci
                          ),
                        })
                      }
                      className="p-1.5 text-midnight/40 hover:text-red-600"
                      aria-label="Remove sub-link"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() =>
                    setLink(i, {
                      children: [...(link.children ?? []), { label: "", href: "" }],
                    })
                  }
                  className="inline-flex items-center gap-1.5 text-xs text-gold-deep hover:underline"
                >
                  <Plus size={12} /> Add dropdown item
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() => updateNav([...s.nav, { label: "", href: "" }])}
            className="inline-flex items-center gap-1.5 text-sm text-gold-deep hover:underline"
          >
            <Plus size={14} /> Add menu link
          </button>
        </Section>

        <div className="flex justify-end pb-12">
          <button
            onClick={save}
            disabled={busy}
            className="btn-gold disabled:opacity-50"
          >
            {saved ? <Check size={16} /> : <Save size={16} />}
            {busy ? "Saving…" : saved ? "Saved" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
