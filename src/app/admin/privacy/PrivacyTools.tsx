"use client";

import { useState } from "react";
import { AdminTabs } from "@/components/admin/AdminTabs";

type LogEntry = { id: string; at: string; username: string; role: string; action: string; target: string; detail: string };
type Run = { id: string; at: string; requests: number; enquiries: number };

export function PrivacyTools({ log, runs }: { log: LogEntry[]; runs: Run[] }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const post = (action: "export" | "erase") =>
    fetch("/api/admin/rights/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, email: email.trim() }),
    }).catch(() => null);

  async function exportData() {
    setBusy(true);
    const res = await post("export");
    if (res?.ok) {
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = "data-export.json";
      a.click();
      URL.revokeObjectURL(url);
      setMessage("Export downloaded.");
    } else {
      const data = await res?.json().catch(() => ({}));
      setMessage(data?.error || "The export failed.");
    }
    setBusy(false);
  }

  async function erase() {
    if (!window.confirm(`Delete every request and CRM record for ${email}? Giving and order records are kept for the accounting period.`)) return;
    setBusy(true);
    const res = await post("erase");
    const data = await res?.json().catch(() => ({}));
    setMessage(res?.ok ? `Deleted ${data.requestsDeleted} requests and ${data.contactsDeleted} contacts. Kept ${data.givingRecordsKept} giving records and ${data.ordersKept} orders.` : data?.error || "Nothing was deleted.");
    setBusy(false);
  }

  async function runRetention() {
    setBusy(true);
    const res = await fetch("/api/admin/retention/", { method: "POST" }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    setMessage(res?.ok ? `Retention run complete: ${data.requestsAnonymised} requests and ${data.enquiriesAnonymised} enquiries anonymised.` : "The retention run failed.");
    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-ivory-dark text-ink">
      <header className="sticky top-0 z-20 bg-midnight text-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-4 flex items-center gap-5">
          <div>
            <p className="eyebrow text-gold leading-none">VOGIM Admin</p>
            <h1 className="font-display text-xl sm:text-2xl mt-1 leading-none">Privacy and audit</h1>
          </div>
          <AdminTabs />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 sm:px-6 py-8 space-y-10">
        <section className="bg-white border border-midnight/10 p-6">
          <h2 className="font-display text-2xl">Data rights request</h2>
          <p className="mt-2 text-sm text-slate">Confirm the person&apos;s identity first. Every export and deletion is written to the audit log.</p>
          <label className="mt-4 block text-sm">
            <span className="block text-xs uppercase tracking-[0.15em] text-slate">Email address</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full max-w-md min-h-11 border border-input px-3" />
          </label>
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={exportData} disabled={!email.trim() || busy} className="btn-gold disabled:opacity-40">Export their data</button>
            <button onClick={erase} disabled={!email.trim() || busy} className="btn-ghost disabled:opacity-40">Delete their requests</button>
          </div>
        </section>

        <section className="bg-white border border-midnight/10 p-6">
          <h2 className="font-display text-2xl">Retention runs</h2>
          <p className="mt-2 text-sm text-slate">Requests are anonymised 5 years after receipt and enquiries after 2 years. Schedule a daily POST to /api/admin/retention/; you can also run it here.</p>
          <button onClick={runRetention} disabled={busy} className="btn-ghost mt-4 disabled:opacity-40">Run retention now</button>
          <ul className="mt-4 text-sm space-y-1">
            {runs.length === 0 ? <li className="text-slate">No runs recorded yet.</li> : runs.map((r) => (
              <li key={r.id}>{new Date(r.at).toLocaleString()}: {r.requests} requests, {r.enquiries} enquiries anonymised</li>
            ))}
          </ul>
        </section>

        <p role="status" aria-live="polite" className="text-sm">{message}</p>

        <section>
          <h2 className="font-display text-2xl">Audit log (latest 200)</h2>
          <div className="mt-4 overflow-x-auto bg-white border border-midnight/10">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-[0.12em] text-slate">
                <tr><th className="p-3">When</th><th className="p-3">Who</th><th className="p-3">Action</th><th className="p-3">Record</th><th className="p-3">Detail</th></tr>
              </thead>
              <tbody>
                {log.map((e) => (
                  <tr key={e.id} className="border-t border-midnight/10">
                    <td className="p-3 whitespace-nowrap">{new Date(e.at).toLocaleString()}</td>
                    <td className="p-3">{e.username} ({e.role})</td>
                    <td className="p-3">{e.action}</td>
                    <td className="p-3 font-mono text-xs">{e.target}</td>
                    <td className="p-3 text-xs">{e.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
