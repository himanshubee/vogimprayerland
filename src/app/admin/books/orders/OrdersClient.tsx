"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Clock, Mail, PackageCheck, RefreshCw, Search, Truck, X } from "lucide-react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import type { Fulfilment, OrderStatus, OrderView } from "@/lib/book-orders";
import { gatewayLabel } from "@/lib/gateways";
import { variantLabel } from "@/lib/merch-shared";

type Tab = OrderStatus | "all" | "to-ship";

const TABS: Tab[] = ["all", "to-ship", "paid", "pending", "failed", "cancelled"];

const TAB_LABEL: Record<Tab, string> = {
  all: "all",
  "to-ship": "to ship",
  paid: "paid",
  pending: "pending",
  failed: "failed",
  cancelled: "cancelled",
};

const STATUS_STYLE: Record<OrderStatus, string> = {
  paid: "bg-emerald-50 text-emerald-700 border-emerald-300",
  pending: "bg-gold/10 text-gold-deep border-gold/50",
  failed: "bg-midnight-soft/5 text-midnight-soft border-midnight-soft/40",
  cancelled: "bg-midnight/5 text-midnight/45 border-midnight/20",
};

const FULFILMENT_STYLE: Record<Fulfilment, string> = {
  unfulfilled: "bg-gold/10 text-gold-deep border-gold/50",
  shipped: "bg-sky-50 text-sky-700 border-sky-300",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-300",
};

const toShip = (o: OrderView) => o.status === "paid" && o.hasMerch && o.fulfilment === "unfulfilled";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function itemLine(i: OrderView["items"][number]) {
  const variant = i.kind === "merch" ? variantLabel(i.variant) : "";
  const base = variant ? `${i.title} (${variant})` : i.title;
  return i.quantity > 1 ? `${base} ×${i.quantity}` : base;
}

export function OrdersClient({
  initial,
  sandboxGateways,
}: {
  initial: OrderView[];
  /** Display names of configured gateways currently in sandbox mode. */
  sandboxGateways: string[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [open, setOpen] = useState<OrderView | null>(null);

  function note(message: string) {
    setFlash(message);
    setTimeout(() => setFlash(null), 4000);
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length, "to-ship": items.filter(toShip).length };
    for (const o of items) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [items]);

  /** Revenue kept per currency — a mixed-currency total would be a lie. */
  const totals = useMemo(() => {
    const by = new Map<string, { amount: number; count: number }>();
    for (const o of items) {
      if (o.status !== "paid") continue;
      const cur = by.get(o.currency) ?? { amount: 0, count: 0 };
      cur.amount += o.total;
      cur.count += 1;
      by.set(o.currency, cur);
    }
    return [...by.entries()].sort((a, b) => b[1].amount - a[1].amount);
  }, [items]);

  const sold = useMemo(() => {
    let books = 0;
    let goods = 0;
    for (const o of items) {
      if (o.status !== "paid") continue;
      for (const i of o.items) {
        if (i.kind === "merch") goods += i.quantity;
        else books += i.quantity;
      }
    }
    return { books, goods };
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((o) => {
      if (tab === "to-ship" ? !toShip(o) : tab !== "all" && o.status !== tab) return false;
      if (!q) return true;
      return [
        o.name,
        o.email,
        o.phone,
        o.ref,
        o.gatewayRef,
        o.shipping?.city ?? "",
        ...o.items.map(itemLine),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [items, tab, query]);

  async function refresh() {
    setBusy(true);
    const data = await fetch("/api/book-orders/")
      .then((r) => r.json())
      .catch(() => null);
    if (data?.items) {
      setItems(data.items);
      if (open) setOpen(data.items.find((o: OrderView) => o.ref === open.ref) ?? null);
    }
    setBusy(false);
  }

  async function reconcile() {
    setBusy(true);
    try {
      const res = await fetch("/api/book-orders/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reconcile" }),
      });
      const data = await res.json();
      if (data?.report) {
        const r = data.report;
        note(
          `Checked ${r.checked} pending order${r.checked === 1 ? "" : "s"} — ${r.settled} settled, ${r.stillPending} never paid, ${r.errors} error${r.errors === 1 ? "" : "s"}.`
        );
      }
      await refresh();
      router.refresh();
    } catch {
      note("The sweep could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  async function resend(order: OrderView) {
    setBusy(true);
    try {
      const res = await fetch("/api/book-orders/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend", ref: order.ref }),
      });
      const data = await res.json();
      note(data.message || data.error || "Could not send that email.");
    } finally {
      setBusy(false);
    }
  }

  async function fulfil(order: OrderView, fulfilment: Fulfilment) {
    setBusy(true);
    try {
      const res = await fetch("/api/book-orders/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fulfil", ref: order.ref, fulfilment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not update the order.");
      const next = { ...order, fulfilment };
      setItems((prev) => prev.map((o) => (o.ref === order.ref ? next : o)));
      setOpen((o) => (o && o.ref === order.ref ? next : o));
      note(
        fulfilment === "shipped"
          ? "Marked as shipped."
          : fulfilment === "delivered"
            ? "Marked as delivered."
            : "Back in the to-ship list."
      );
    } catch (e) {
      note(e instanceof Error ? e.message : "Could not update the order.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-ivory-dark text-ink">
      <header className="sticky top-0 z-20 bg-midnight text-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div>
              <p className="eyebrow text-gold leading-none">VOGIM Admin</p>
              <h1 className="font-display text-xl sm:text-2xl mt-1 leading-none">Orders</h1>
            </div>
            <AdminTabs />
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/books"
              className="text-[11px] tracking-[0.18em] uppercase text-white/60 hover:text-gold px-3 py-2 transition-colors"
            >
              Books
            </Link>
            <Link
              href="/admin/store"
              className="text-[11px] tracking-[0.18em] uppercase text-white/60 hover:text-gold px-3 py-2 transition-colors"
            >
              Store
            </Link>
            <button
              onClick={reconcile}
              disabled={busy}
              title="Ask every gateway about the orders still pending, and settle any that were actually paid"
              className="btn-gold !py-2 !px-4 !text-[11px] disabled:opacity-60"
            >
              <RefreshCw size={14} className={busy ? "animate-spin" : ""} />
              Reconcile
            </button>
          </div>
        </div>
      </header>

      {flash && (
        <div className="bg-gold/15 border-b border-gold/40">
          <p className="mx-auto max-w-6xl px-5 sm:px-6 py-2.5 text-xs text-midnight">{flash}</p>
        </div>
      )}

      {sandboxGateways.length > 0 && (
        <div className="bg-midnight-soft/10 border-b border-midnight-soft/30">
          <p className="mx-auto max-w-6xl px-5 sm:px-6 py-2.5 text-xs text-midnight">
            <strong>Test mode.</strong> {sandboxGateways.join(" and ")}{" "}
            {sandboxGateways.length === 1 ? "is" : "are"} running against a sandbox — those
            are not real transactions.
          </p>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-5 sm:px-6 py-8">
        {/* TOTALS */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {totals.length === 0 ? (
            <div className="bg-white border border-midnight/12 p-5">
              <p className="text-[11px] tracking-[0.2em] uppercase text-midnight/45">Received</p>
              <p className="font-display text-3xl text-midnight/30 mt-1.5">—</p>
            </div>
          ) : (
            totals.map(([currency, t]) => (
              <div key={currency} className="bg-white border border-midnight/12 p-5">
                <p className="text-[11px] tracking-[0.2em] uppercase text-midnight/45">
                  {currency} received
                </p>
                <p className="font-display text-3xl text-midnight mt-1.5 tabular-nums">
                  {t.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-midnight/45 mt-1">
                  {t.count} order{t.count === 1 ? "" : "s"}
                </p>
              </div>
            ))
          )}
          <div className="bg-white border border-midnight/12 p-5">
            <p className="text-[11px] tracking-[0.2em] uppercase text-midnight/45">Sold</p>
            <p className="font-display text-3xl text-midnight mt-1.5 tabular-nums">
              {sold.books + sold.goods}
            </p>
            <p className="text-xs text-midnight/45 mt-1">
              {sold.books} book{sold.books === 1 ? "" : "s"} · {sold.goods} garment
              {sold.goods === 1 ? "" : "s"}
            </p>
          </div>
          <div className="bg-white border border-midnight/12 p-5">
            <p className="text-[11px] tracking-[0.2em] uppercase text-midnight/45">To ship</p>
            <p className="font-display text-3xl text-midnight mt-1.5 tabular-nums">
              {counts["to-ship"] || 0}
            </p>
            <p className="text-xs text-midnight/45 mt-1">paid, not yet dispatched</p>
          </div>
        </div>

        {/* FILTERS */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex flex-wrap gap-1">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 border text-[11px] tracking-[0.16em] uppercase transition-colors ${
                  tab === t
                    ? "border-gold bg-gold text-midnight"
                    : "border-midnight/15 text-midnight/55 hover:border-gold"
                }`}
              >
                {TAB_LABEL[t]} {counts[t] ? `(${counts[t]})` : ""}
              </button>
            ))}
          </div>

          <label className="relative ml-auto">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-midnight/35"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, item, reference…"
              className="w-64 bg-white border border-midnight/15 pl-9 pr-3 py-2 text-sm outline-none focus:border-gold transition-colors"
            />
          </label>
        </div>

        {/* TABLE */}
        {filtered.length === 0 ? (
          <div className="bg-white border border-midnight/12 px-8 py-16 text-center">
            <Clock className="mx-auto text-midnight/25" size={30} />
            <p className="mt-4 text-sm text-midnight/55">
              {items.length === 0 ? "No orders yet." : "No orders match that filter."}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-midnight/12 overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="border-b border-midnight/12 text-left">
                  {["Customer", "Items", "Total", "Method", "Status", "When", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-[10px] tracking-[0.2em] uppercase text-midnight/45 font-medium"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr
                    key={o.ref}
                    className="border-b border-midnight/8 last:border-0 hover:bg-ivory-dark/60 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-midnight">{o.name || "—"}</p>
                      <p className="text-xs text-midnight/45">{o.email}</p>
                    </td>
                    <td className="px-4 py-3 max-w-[240px]">
                      <p className="text-midnight/80 text-xs leading-relaxed">
                        {o.items.map(itemLine).join(", ") || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-midnight tabular-nums">{o.totalLabel}</span>
                      <span className="text-xs text-midnight/40 ml-1">{o.currency}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-midnight/60 whitespace-nowrap">
                      {o.paymentType || gatewayLabel(o.provider)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 border text-[10px] tracking-[0.14em] uppercase ${STATUS_STYLE[o.status]}`}
                      >
                        {o.status}
                      </span>
                      {o.hasMerch && o.status === "paid" && o.fulfilment && (
                        <span
                          className={`ml-1.5 inline-block px-2 py-0.5 border text-[10px] tracking-[0.14em] uppercase ${FULFILMENT_STYLE[o.fulfilment]}`}
                        >
                          {o.fulfilment === "unfulfilled" ? "to ship" : o.fulfilment}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-midnight/50 whitespace-nowrap">
                      {fmtDate(o.paidAt ?? o.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setOpen(o)}
                        className="text-[11px] tracking-[0.14em] uppercase text-gold-deep hover:text-midnight transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* DETAIL DRAWER */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-maroon/80 backdrop-blur-sm p-0 sm:p-6"
          onClick={() => setOpen(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-lg bg-white max-h-[92vh] overflow-y-auto shadow-2xl"
          >
            <div className="sticky top-0 bg-midnight text-white px-6 py-4 flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow text-gold leading-none">Order</p>
                <p className="font-display text-2xl mt-1.5 leading-none">
                  {open.totalLabel} <span className="text-sm text-white/50">{open.currency}</span>
                </p>
              </div>
              <button
                onClick={() => setOpen(null)}
                aria-label="Close"
                className="text-white/60 hover:text-gold transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5">
              <ul className="divide-y divide-midnight/10 border-b border-midnight/10 mb-4">
                {open.items.map((i, idx) => (
                  <li key={idx} className="flex justify-between gap-4 py-2.5 text-sm">
                    <span className="text-midnight">
                      {i.title}
                      {i.kind === "merch" && i.variant && (
                        <span className="block text-[11px] tracking-[0.16em] uppercase text-midnight/50">
                          {variantLabel(i.variant)}
                        </span>
                      )}
                      {i.quantity > 1 && <span className="text-midnight/45"> × {i.quantity}</span>}
                    </span>
                    <span className="text-midnight/60 tabular-nums shrink-0">
                      {i.unitPrice * i.quantity}
                    </span>
                  </li>
                ))}
                {open.shippingFee > 0 && (
                  <li className="flex justify-between gap-4 py-2.5 text-sm">
                    <span className="text-midnight">Delivery</span>
                    <span className="text-midnight/60 tabular-nums shrink-0">{open.shippingFee}</span>
                  </li>
                )}
              </ul>

              {/* FULFILMENT — the reason a physical order is opened at all. */}
              {open.hasMerch && open.status === "paid" && (
                <div className="mb-5 border border-gold/50 bg-gold/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] tracking-[0.2em] uppercase text-midnight/60">
                      Dispatch
                    </p>
                    <span
                      className={`inline-block px-2 py-0.5 border text-[10px] tracking-[0.14em] uppercase ${FULFILMENT_STYLE[open.fulfilment || "unfulfilled"]}`}
                    >
                      {open.fulfilment === "unfulfilled" || !open.fulfilment ? "to ship" : open.fulfilment}
                    </span>
                  </div>

                  {open.shipping && (
                    <address className="not-italic mt-3 text-sm text-midnight/80 leading-relaxed">
                      {[
                        open.shipping.name,
                        open.shipping.line1,
                        open.shipping.line2,
                        [open.shipping.city, open.shipping.state].filter(Boolean).join(", "),
                        [open.shipping.postcode, open.shipping.country].filter(Boolean).join(" "),
                        open.shipping.phone,
                      ]
                        .filter(Boolean)
                        .map((line, i) => (
                          <span key={i} className="block">
                            {line}
                          </span>
                        ))}
                    </address>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {open.fulfilment !== "shipped" && open.fulfilment !== "delivered" && (
                      <button
                        onClick={() => fulfil(open, "shipped")}
                        disabled={busy}
                        className="btn-gold !py-2 !px-4 !text-[11px] disabled:opacity-60"
                      >
                        <Truck size={13} /> Mark shipped
                      </button>
                    )}
                    {open.fulfilment !== "delivered" && (
                      <button
                        onClick={() => fulfil(open, "delivered")}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 border border-midnight/25 px-4 py-2 text-[11px] tracking-[0.16em] uppercase text-midnight/70 hover:border-gold hover:text-gold-deep transition-colors disabled:opacity-60"
                      >
                        <PackageCheck size={13} /> Mark delivered
                      </button>
                    )}
                    {open.fulfilment && open.fulfilment !== "unfulfilled" && (
                      <button
                        onClick={() => fulfil(open, "unfulfilled")}
                        disabled={busy}
                        className="text-[11px] text-midnight/45 hover:text-midnight-soft px-2 transition-colors disabled:opacity-60"
                      >
                        Undo
                      </button>
                    )}
                  </div>
                </div>
              )}

              <dl className="divide-y divide-midnight/10 text-sm">
                {[
                  ["Name", open.name],
                  ["Email", open.email],
                  ["Phone", open.phone],
                  ["Location", open.country],
                  ["Reference", open.ref],
                  ["Gateway ref", open.gatewayRef],
                  ["Paid with", gatewayLabel(open.provider)],
                  ["Method", open.paymentType],
                  ["Settled via", open.settledVia],
                  ["Status", open.status],
                  ["Downloads", open.items.some((i) => i.kind !== "merch") ? String(open.downloadCount) : ""],
                  ["Receipt emailed", open.deliveryEmailSent ? "Yes" : "No"],
                  ["Created", fmtDate(open.createdAt)],
                  ["Paid", open.paidAt ? fmtDate(open.paidAt) : "—"],
                  ["Problem", open.failureReason],
                ]
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-6 py-2.5">
                      <dt className="text-[11px] tracking-[0.18em] uppercase text-midnight/45 shrink-0">
                        {k}
                      </dt>
                      <dd className="text-midnight/85 text-right break-all">{v}</dd>
                    </div>
                  ))}
              </dl>

              {open.status === "paid" && (
                <>
                  <button
                    onClick={() => resend(open)}
                    disabled={busy}
                    className="btn-gold mt-6 w-full justify-center !py-2.5 !text-[11px] disabled:opacity-60"
                  >
                    <Mail size={14} /> Re-send order email
                  </button>
                  <p className="mt-2.5 flex items-start gap-2 text-[11px] text-midnight/45 leading-relaxed">
                    <Check size={12} className="text-gold-deep shrink-0 mt-0.5" />
                    Sends the receipt — with fresh download links for any books — to{" "}
                    {open.email}. Needs SMTP configured on the server.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
