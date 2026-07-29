"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Clock,
  Download,
  LogOut,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import type { DonationStatus, DonationView } from "@/lib/donations";

const TABS: (DonationStatus | "all")[] = [
  "all",
  "successful",
  "pending",
  "failed",
  "cancelled",
];

const STATUS_STYLE: Record<DonationStatus, string> = {
  successful: "bg-emerald-50 text-emerald-700 border-emerald-300",
  pending: "bg-gold/10 text-gold-deep border-gold/50",
  failed: "bg-midnight-soft/5 text-midnight-soft border-midnight-soft/40",
  cancelled: "bg-midnight/5 text-midnight/45 border-midnight/20",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DonationsClient({
  initial,
  testMode,
}: {
  initial: DonationView[];
  testMode: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [tab, setTab] = useState<DonationStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [open, setOpen] = useState<DonationView | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const d of items) c[d.status] = (c[d.status] ?? 0) + 1;
    return c;
  }, [items]);

  /** Money actually received, kept per-currency — a mixed-currency total lies. */
  const totals = useMemo(() => {
    const by = new Map<string, { amount: number; count: number; label: string }>();
    for (const d of items) {
      if (d.status !== "successful") continue;
      const cur = by.get(d.currency) ?? {
        amount: 0,
        count: 0,
        label: d.amountLabel.replace(/[\d.,]/g, ""),
      };
      cur.amount += d.amount;
      cur.count += 1;
      by.set(d.currency, cur);
    }
    return Array.from(by.entries()).sort((a, b) => b[1].amount - a[1].amount);
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((d) => {
      if (tab !== "all" && d.status !== tab) return false;
      if (!q) return true;
      return [d.name, d.email, d.phone, d.fund, d.ref, d.flwRef, String(d.flwId ?? "")]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [items, tab, query]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  async function reconcile() {
    setBusy(true);
    setFlash(null);
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reconcile" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Reconcile failed.");
      if (data.items) setItems(data.items);
      const r = data.report ?? {};
      setFlash(
        r.checked === 0
          ? "No pending gifts old enough to check."
          : `Checked ${r.checked} pending · ${r.settled} confirmed as paid · ${r.stillPending} never paid${r.errors ? ` · ${r.errors} errored` : ""}.`
      );
    } catch (err) {
      setFlash(err instanceof Error ? err.message : "Reconcile failed.");
    } finally {
      setBusy(false);
    }
  }

  function exportCsv() {
    const headers = [
      "date",
      "paid at",
      "status",
      "amount",
      "currency",
      "fund",
      "name",
      "email",
      "phone",
      "country",
      "method",
      "reference",
      "flutterwave id",
      "flutterwave ref",
      "note",
    ];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = filtered.map((d) =>
      [
        fmtDate(d.createdAt),
        d.paidAt ? fmtDate(d.paidAt) : "",
        d.status,
        d.amount,
        d.currency,
        d.fund,
        d.name,
        d.email,
        d.phone,
        d.country,
        d.paymentType,
        d.ref,
        d.flwId ?? "",
        d.flwRef,
        d.note,
      ]
        .map(esc)
        .join(",")
    );
    const csv = [headers.map(esc).join(","), ...rows].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `vogim-giving-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
                Giving
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
        {testMode && (
          <p className="mb-5 border border-dashed border-gold/60 bg-gold/5 px-4 py-3 text-xs text-midnight/75">
            <strong className="text-midnight">Test mode.</strong> These are
            Flutterwave sandbox transactions — no real money has moved. Swap
            FLW_SECRET_KEY for the live key to take real gifts.
          </p>
        )}

        {/* TOTALS */}
        <div className="grid gap-px bg-midnight/15 sm:grid-cols-3 mb-6">
          {totals.length === 0 ? (
            <div className="bg-ivory p-5 sm:col-span-3">
              <p className="eyebrow text-midnight/50">Received</p>
              <p className="font-display text-2xl text-midnight mt-1">
                Nothing yet
              </p>
            </div>
          ) : (
            totals.map(([currency, t]) => (
              <div key={currency} className="bg-ivory p-5">
                <p className="eyebrow text-midnight/50">Received · {currency}</p>
                <p className="font-display text-3xl text-midnight mt-1 tabular-nums">
                  {t.label}
                  {t.amount.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-midnight/50 mt-1">
                  {t.count} {t.count === 1 ? "gift" : "gifts"}
                </p>
              </div>
            ))
          )}
        </div>

        {/* CONTROLS */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {TABS.map((t) => {
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
              placeholder="Name, email, reference…"
              className="w-full border border-midnight/20 bg-ivory pl-9 pr-3 py-2 text-sm outline-none focus:border-gold"
            />
          </div>

          <button
            onClick={reconcile}
            disabled={busy}
            title="Re-check every pending gift against Flutterwave"
            className="inline-flex items-center justify-center gap-2 text-[11px] tracking-[0.2em] uppercase border border-midnight/25 text-midnight/70 px-3 py-2 hover:border-gold hover:text-midnight transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={busy ? "animate-spin" : ""} />
            {busy ? "Checking…" : "Reconcile"}
          </button>
        </div>

        {flash && (
          <p className="mb-4 border-l-2 border-gold bg-gold/5 px-4 py-3 text-sm text-midnight/80">
            {flash}
          </p>
        )}

        {/* TABLE */}
        <div className="border border-midnight/15 bg-ivory overflow-x-auto">
          <table className="w-full text-sm min-w-[46rem]">
            <thead>
              <tr className="text-left text-[10px] tracking-[0.2em] uppercase text-midnight/50 border-b border-midnight/15">
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Donor</th>
                <th className="p-3 font-medium text-right">Amount</th>
                <th className="p-3 font-medium">Fund</th>
                <th className="p-3 font-medium">Method</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-midnight/50">
                    No gifts to show.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr
                    key={d.ref}
                    onClick={() => setOpen(d)}
                    className="border-b border-midnight/10 last:border-b-0 hover:bg-gold/5 cursor-pointer"
                  >
                    <td className="p-3 whitespace-nowrap text-midnight/70 text-xs">
                      {fmtDate(d.paidAt || d.createdAt)}
                    </td>
                    <td className="p-3">
                      <span className="block text-midnight">{d.name || "—"}</span>
                      <span className="block text-xs text-midnight/50">
                        {d.email}
                      </span>
                    </td>
                    <td className="p-3 text-right font-display text-lg text-midnight whitespace-nowrap tabular-nums">
                      {d.amountLabel}
                      <span className="ml-1 text-[10px] text-midnight/45">
                        {d.currency}
                      </span>
                    </td>
                    <td className="p-3 text-midnight/70 text-xs">{d.fund}</td>
                    <td className="p-3 text-midnight/60 text-xs capitalize">
                      {d.paymentType || "—"}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 border ${STATUS_STYLE[d.status]}`}
                      >
                        {d.status === "successful" && <Check size={11} />}
                        {d.status === "pending" && <Clock size={11} />}
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-midnight/45">
          Showing {filtered.length} of {items.length}. A gift stays{" "}
          <em>pending</em> until Flutterwave confirms it — “Reconcile” re-checks
          every pending gift older than 15 minutes, for the rare case where the
          donor paid but the confirmation never reached us.
        </p>
      </div>

      {/* DETAIL DRAWER */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-midnight/50 backdrop-blur-sm flex justify-end"
          onClick={() => setOpen(null)}
        >
          <div
            className="w-full max-w-md bg-ivory h-full overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-midnight text-white p-5 sticky top-0 flex items-start justify-between">
              <div>
                <p className="eyebrow text-gold">Gift</p>
                <p className="font-display text-3xl mt-1">
                  {open.amountLabel}{" "}
                  <span className="text-sm text-white/50">{open.currency}</span>
                </p>
              </div>
              <button
                onClick={() => setOpen(null)}
                className="text-white/70 hover:text-gold"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <dl className="p-5 space-y-3 text-sm">
              {(
                [
                  ["Status", open.status],
                  ["Donor", open.name],
                  ["Email", open.email],
                  ["Phone", open.phone],
                  ["Location", open.country],
                  ["Fund", open.fund],
                  ["Note", open.note],
                  ["Started", fmtDate(open.createdAt)],
                  ["Paid", open.paidAt ? fmtDate(open.paidAt) : ""],
                  ["Method", open.paymentType],
                  ["Confirmed via", open.settledVia],
                  ["Charged", open.chargedAmount ? String(open.chargedAmount) : ""],
                  ["Our reference", open.ref],
                  ["Flutterwave ID", open.flwId ? String(open.flwId) : ""],
                  ["Flutterwave ref", open.flwRef],
                  ["Problem", open.failureReason],
                ] as [string, string][]
              )
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div
                    key={k}
                    className="grid grid-cols-[9rem_1fr] gap-3 border-b border-midnight/10 pb-3 last:border-b-0"
                  >
                    <dt className="text-[10px] tracking-[0.2em] uppercase text-midnight/50 pt-0.5">
                      {k}
                    </dt>
                    <dd className="text-midnight break-all">{v}</dd>
                  </div>
                ))}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
