"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { FREQUENCIES, type AutoblogRun, type AutoblogSettings, type Frequency } from "@/lib/autoblog/settings-shared";

type Loaded = { settings: AutoblogSettings; runs: AutoblogRun[]; configured: boolean; builtInTopics: number };

const STATUS_STYLE: Record<AutoblogRun["status"], string> = {
  draft: "bg-gold/20 text-midnight",
  published: "bg-emerald-100 text-emerald-900",
  skipped: "bg-midnight/10 text-midnight/70",
  failed: "bg-red-100 text-red-900",
};

export function AutoblogManager({ initial }: { initial: Loaded }) {
  const [data, setData] = useState<Loaded>(initial);
  const [form, setForm] = useState<AutoblogSettings>(initial.settings);
  const [queueText, setQueueText] = useState(initial.settings.topicQueue.join("\n"));
  const [busy, setBusy] = useState<"save" | "run" | "improve" | null>(null);
  const [improveInput, setImproveInput] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/autoblog/").catch(() => null);
    const json = await res?.json().catch(() => null);
    if (!res?.ok || !json) {
      setMessage(json?.error || "Could not load the auto-blog settings.");
      return;
    }
    setData(json);
    setForm(json.settings);
    setQueueText(json.settings.topicQueue.join("\n"));
  }

  async function save() {
    setBusy("save");
    const res = await fetch("/api/admin/autoblog/", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, topicQueue: queueText.split("\n") }),
    }).catch(() => null);
    setMessage(res?.ok ? "Settings saved." : "Saving failed.");
    setBusy(null);
    if (res?.ok) await load();
  }

  async function runNow() {
    setBusy("run");
    setMessage("Writing the article and its image. This takes one to three minutes...");
    const res = await fetch("/api/admin/autoblog/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force: true }),
    }).catch(() => null);
    const json = await res?.json().catch(() => null);
    if (!res?.ok) setMessage(json?.error || "The run failed.");
    else if (!json.ran) setMessage(json.reason);
    else {
      const made = json.results.filter((r: { status: string }) => r.status !== "skipped").length;
      setMessage(made ? `Done: ${made} article${made > 1 ? "s" : ""} written. See the list below.` : "No article written: every topic tried was skipped. See the list below.");
    }
    setBusy(null);
    await load();
  }

  async function removeRuns(body: { removeRunIds: string[] } | { clearFailed: true }) {
    const res = await fetch("/api/admin/autoblog/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    const json = await res?.json().catch(() => null);
    setMessage(res?.ok ? `Removed ${json.removed} from the list.` : json?.error || "Could not remove.");
    await load();
  }

  async function improve(idOrUrl: string) {
    const id = idOrUrl.match(/[a-f0-9]{24}/i)?.[0];
    if (!id) {
      setMessage("Paste the post's admin link (…/admin/posts/<id>/) or its 24-character id.");
      return;
    }
    setBusy("improve");
    setMessage("Optimising: creating the image if missing, then checking and revising the SEO. This takes one to three minutes...");
    const res = await fetch("/api/admin/autoblog/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ improvePostId: id }),
    }).catch(() => null);
    const json = await res?.json().catch(() => null);
    if (!res?.ok) setMessage(json?.error || "Optimising failed.");
    else {
      const r = json.improved;
      setMessage(
        `SEO ${r.before}% → ${r.after}%. ${r.imageNote}.${r.failing.length ? ` Still to fix by hand: ${r.failing.join("; ")}.` : ""} Open the post to review it.`
      );
    }
    setBusy(null);
  }

  return (
    <Shell>
      {!data.configured && (
        <p className="border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          OPENROUTER_API_KEY is not set on the server, so nothing can be generated. Add it to .env.production.local and restart.
        </p>
      )}

      <section className="bg-white border border-midnight/10 p-6">
        <h2 className="font-display text-2xl">Schedule</h2>
        <p className="mt-2 text-sm text-slate">
          Each run writes an article and a featured image, using topics that the site has no article on yet. Before writing, it checks the live
          posts and skips anything the site already covers, so it never creates a competing duplicate.
        </p>

        <label className="mt-5 flex items-center gap-3 text-sm">
          <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} className="h-5 w-5" />
          <span>Generate articles automatically</span>
        </label>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="block text-xs uppercase tracking-[0.15em] text-slate">How often</span>
            <select
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value as Frequency })}
              className="mt-1 w-full min-h-11 border border-input bg-white px-3"
            >
              {Object.entries(FREQUENCIES).map(([key, f]) => (
                <option key={key} value={key}>{f.label}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="block text-xs uppercase tracking-[0.15em] text-slate">Articles per run</span>
            <select
              value={form.postsPerRun}
              onChange={(e) => setForm({ ...form, postsPerRun: Number(e.target.value) })}
              className="mt-1 w-full min-h-11 border border-input bg-white px-3"
            >
              {[1, 2, 3].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>

        <fieldset className="mt-6 border border-midnight/10 p-4">
          <legend className="px-1 text-xs uppercase tracking-[0.15em] text-slate">When an article is written</legend>
          <label className="flex items-start gap-3 text-sm">
            <input type="radio" name="publish" checked={!form.autoPublish} onChange={() => setForm({ ...form, autoPublish: false })} className="mt-1 h-4 w-4" />
            <span>
              <strong>Save as a draft for review</strong> (recommended). Read it in Posts, check the scripture and the facts, then publish.
            </span>
          </label>
          <label className="mt-3 flex items-start gap-3 text-sm">
            <input type="radio" name="publish" checked={form.autoPublish} onChange={() => setForm({ ...form, autoPublish: true })} className="mt-1 h-4 w-4" />
            <span>
              <strong>Publish immediately</strong>. Google&apos;s spam policies demote sites for unreviewed AI content at scale, and this site was
              demoted for that in December 2025. If you choose this, keep the frequency low and read each article after it goes live.
            </span>
          </label>
        </fieldset>

        <label className="mt-6 block text-sm">
          <span className="block text-xs uppercase tracking-[0.15em] text-slate">Your topics (one per line, written first)</span>
          <textarea
            value={queueText}
            onChange={(e) => setQueueText(e.target.value)}
            rows={5}
            placeholder={"Prayer for a sick child\nHow to pray for your pastor"}
            className="mt-1 w-full border border-input p-3"
          />
          <span className="mt-1 block text-xs text-slate">
            After these, it works through {data.builtInTopics} built-in topics chosen from gaps in Search Console.
          </span>
        </label>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={save} disabled={busy !== null} className="btn-gold disabled:opacity-40">
            {busy === "save" ? "Saving..." : "Save settings"}
          </button>
          <button onClick={runNow} disabled={busy !== null || !data.configured} className="btn-ghost disabled:opacity-40">
            {busy === "run" ? "Writing..." : "Write one now"}
          </button>
        </div>
        <p className="mt-3 text-xs text-slate">
          Last run: {form.lastRunAt ? new Date(form.lastRunAt).toLocaleString() : "never"}.
        </p>
      </section>

      <section className="bg-white border border-midnight/10 p-6">
        <h2 className="font-display text-2xl">Optimise an existing post</h2>
        <p className="mt-2 text-sm text-slate">
          Adds a featured image if the post has none, places it in the article with descriptive alt text, links the main Bible verse, and
          revises the wording until the SEO checks pass. Imported posts with their own images or videos get the image and link fixes only, so
          nothing of theirs is removed.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <input
            value={improveInput}
            onChange={(e) => setImproveInput(e.target.value)}
            placeholder="https://www.vogimprayerland.org/admin/posts/…"
            className="min-h-11 flex-1 min-w-[16rem] border border-input px-3 text-sm"
          />
          <button onClick={() => improve(improveInput)} disabled={busy !== null || !improveInput.trim()} className="btn-ghost disabled:opacity-40">
            {busy === "improve" ? "Optimising..." : "Optimise SEO + image"}
          </button>
        </div>
      </section>

      <p role="status" aria-live="polite" className="text-sm">{message}</p>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl">Recent runs</h2>
          {data.runs.some((r) => r.status === "failed") && (
            <button onClick={() => removeRuns({ clearFailed: true })} disabled={busy !== null} className="btn-ghost disabled:opacity-40">
              Clear failed runs
            </button>
          )}
        </div>
        <div className="mt-4 overflow-x-auto bg-white border border-midnight/10">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-[0.12em] text-slate">
              <tr><th className="p-3">When</th><th className="p-3">Result</th><th className="p-3">Article</th><th className="p-3">Detail</th></tr>
            </thead>
            <tbody>
              {data.runs.length === 0 ? (
                <tr><td colSpan={4} className="p-3 text-slate">No runs yet.</td></tr>
              ) : (
                data.runs.map((r) => (
                  <tr key={r.id} className="border-t border-midnight/10 align-top">
                    <td className="p-3 whitespace-nowrap">{new Date(r.at).toLocaleString()}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 text-xs ${STATUS_STYLE[r.status]}`}>{r.status}</span></td>
                    <td className="p-3">
                      {r.postId ? (
                        <Link href={`/admin/posts/${r.postId}`} className="text-maroon underline">{r.title}</Link>
                      ) : r.slug ? (
                        <>{r.title} <Link href={`/${r.slug}/`} className="text-maroon underline">(existing)</Link></>
                      ) : (
                        r.title
                      )}
                    </td>
                    <td className="p-3 text-xs">
                      {r.detail}
                      {r.postId && (
                        <button
                          onClick={() => improve(r.postId!)}
                          disabled={busy !== null}
                          className="mt-2 block text-maroon underline disabled:opacity-40"
                        >
                          Optimise SEO + image
                        </button>
                      )}
                      <button
                        onClick={() => removeRuns({ removeRunIds: [r.id] })}
                        disabled={busy !== null}
                        className="mt-2 block text-slate underline disabled:opacity-40"
                      >
                        Remove from list
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ivory-dark text-ink">
      <header className="sticky top-0 z-20 bg-midnight text-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-4 flex items-center gap-5">
          <div>
            <p className="eyebrow text-gold leading-none">VOGIM Admin</p>
            <h1 className="font-display text-xl sm:text-2xl mt-1 leading-none">Auto-blog</h1>
          </div>
          <AdminTabs />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 sm:px-6 py-8 space-y-10">{children}</main>
    </div>
  );
}
