import { randomUUID } from "crypto";
import { getDb } from "@/lib/mongodb";
import { linkSubmissionToContact } from "@/lib/crm";
import { sendSubmissionEmail } from "@/lib/mailer";
import {
  CURRENCIES,
  verifyTransaction,
  verifyTransactionByReference,
  type CurrencyCode,
  type VerifiedTransaction,
} from "@/lib/flutterwave";

/**
 * Donation records for gifts taken through Flutterwave.
 *
 * A row is written as `pending` *before* the donor leaves for checkout, so a
 * gift can never arrive without a local record to reconcile it against. It is
 * settled by whichever of the two callbacks arrives first — the browser
 * redirect to /give/thank-you or the server-to-server webhook — and settling is
 * idempotent, so both running is harmless.
 */

const COLLECTION = "donations";

export type DonationStatus = "pending" | "successful" | "failed" | "cancelled";

/** Which callback settled the gift. "reconcile" = an admin sweep caught it. */
export type SettledVia = "redirect" | "webhook" | "reconcile";

export type DonationDoc = {
  _id: string; // tx_ref — our own reference, unique per attempt
  status: DonationStatus;
  amount: number;
  currency: CurrencyCode;
  fund: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  note: string;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  /** Flutterwave's side of the record, filled in on settlement. */
  flwId?: number;
  flwRef?: string;
  chargedAmount?: number;
  paymentType?: string;
  settledVia?: SettledVia;
  failureReason?: string;
  ip?: string | null;
  userAgent?: string | null;
};

export type NewDonation = {
  amount: number;
  currency: CurrencyCode;
  fund: string;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  note?: string;
  ip?: string | null;
  userAgent?: string | null;
};

/** `VOGIM-<random>` — a fresh reference for every attempt, as Flutterwave requires. */
export function newTxRef(): string {
  return `VOGIM-${randomUUID()}`;
}

export function formatAmount(amount: number, currency: string): string {
  const symbol = CURRENCIES[currency as CurrencyCode]?.symbol ?? "";
  const n = amount.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${n}`;
}

/* ------------------------------- Writes -------------------------------- */

export async function createPendingDonation(
  txRef: string,
  input: NewDonation
): Promise<void> {
  const now = new Date();
  const db = await getDb();
  await db.collection<DonationDoc>(COLLECTION).insertOne({
    _id: txRef,
    status: "pending",
    amount: input.amount,
    currency: input.currency,
    fund: input.fund,
    name: input.name,
    email: input.email,
    phone: input.phone ?? "",
    country: input.country ?? "",
    note: input.note ?? "",
    createdAt: now,
    updatedAt: now,
    ip: input.ip ?? null,
    userAgent: input.userAgent ?? null,
  });
}

export async function getDonation(txRef: string): Promise<DonationDoc | null> {
  const db = await getDb();
  return db.collection<DonationDoc>(COLLECTION).findOne({ _id: txRef });
}

export type SettleResult =
  | { outcome: "successful"; donation: DonationDoc }
  | { outcome: "already_settled"; donation: DonationDoc }
  | { outcome: "failed"; donation: DonationDoc | null; reason: string }
  | { outcome: "mismatch"; donation: DonationDoc | null; reason: string }
  | { outcome: "not_found"; donation: null; reason: string };

/**
 * Verify a transaction with Flutterwave and settle the local record.
 *
 * The gift is only ever marked successful when the *verified* transaction says
 * so — the amount, currency, and reference are all re-checked against what we
 * stored before checkout, so a tampered redirect URL cannot fake a donation.
 */
export async function settleDonation(
  transactionId: string | number,
  via: SettledVia
): Promise<SettleResult> {
  const tx = await verifyTransaction(transactionId);
  if (!tx) {
    return {
      outcome: "not_found",
      donation: null,
      reason: "Flutterwave has no record of that transaction.",
    };
  }
  return settleVerified(tx, via);
}

/**
 * Settle using *our* reference. Used by the admin reconcile sweep, for gifts
 * where the donor paid but neither the redirect nor the webhook ever reached
 * us — in that case we never learned Flutterwave's transaction id.
 */
export async function settleDonationByReference(
  txRef: string,
  via: SettledVia
): Promise<SettleResult> {
  const tx = await verifyTransactionByReference(txRef);
  if (!tx) {
    return {
      outcome: "not_found",
      donation: null,
      reason: "Flutterwave has no transaction for that reference.",
    };
  }
  return settleVerified(tx, via);
}

async function settleVerified(
  tx: VerifiedTransaction,
  via: SettledVia
): Promise<SettleResult> {
  const db = await getDb();
  const donations = db.collection<DonationDoc>(COLLECTION);
  const existing = await donations.findOne({ _id: tx.txRef });

  if (!existing) {
    return {
      outcome: "not_found",
      donation: null,
      reason: `No local record for reference ${tx.txRef}.`,
    };
  }

  // Idempotency — the redirect and the webhook both settle the same gift.
  if (existing.status === "successful") {
    return { outcome: "already_settled", donation: existing };
  }

  const now = new Date();

  if (tx.status !== "successful") {
    await donations.updateOne(
      { _id: tx.txRef },
      {
        $set: {
          status: tx.status === "cancelled" ? "cancelled" : "failed",
          updatedAt: now,
          flwId: tx.id,
          flwRef: tx.flwRef,
          settledVia: via,
          failureReason: `Flutterwave reported status “${tx.status}”.`,
        },
      }
    );
    return {
      outcome: "failed",
      donation: await donations.findOne({ _id: tx.txRef }),
      reason: `The payment was not completed (${tx.status}).`,
    };
  }

  // Successful at Flutterwave — but only honour it if it matches what we asked for.
  if (tx.currency !== existing.currency) {
    const reason = `Currency mismatch: expected ${existing.currency}, received ${tx.currency}.`;
    await donations.updateOne(
      { _id: tx.txRef },
      { $set: { updatedAt: now, flwId: tx.id, flwRef: tx.flwRef, failureReason: reason } }
    );
    return { outcome: "mismatch", donation: existing, reason };
  }

  if (tx.amount + 0.001 < existing.amount) {
    const reason = `Amount mismatch: expected ${existing.amount}, received ${tx.amount}.`;
    await donations.updateOne(
      { _id: tx.txRef },
      { $set: { updatedAt: now, flwId: tx.id, flwRef: tx.flwRef, failureReason: reason } }
    );
    return { outcome: "mismatch", donation: existing, reason };
  }

  await donations.updateOne(
    { _id: tx.txRef },
    {
      $set: {
        status: "successful",
        updatedAt: now,
        paidAt: now,
        flwId: tx.id,
        flwRef: tx.flwRef,
        chargedAmount: tx.chargedAmount,
        paymentType: tx.paymentType,
        settledVia: via,
      },
      $unset: { failureReason: "" },
    }
  );

  const donation = (await donations.findOne({ _id: tx.txRef })) as DonationDoc;

  // Post-settlement side effects must never break the donor's confirmation.
  await notifyAndLink(donation).catch((err) =>
    console.error("[donations] post-settle hook failed:", err)
  );

  return { outcome: "successful", donation };
}

/** CRM contact + timeline entry, and an email to the ministry inbox. */
async function notifyAndLink(d: DonationDoc) {
  const pretty = formatAmount(d.amount, d.currency);
  const fields: Record<string, string> = {
    name: d.name,
    email: d.email,
    phone: d.phone,
    country: d.country,
    amount: `${pretty} ${d.currency}`,
    fund: d.fund,
    reference: d._id,
    "flutterwave id": String(d.flwId ?? ""),
    "payment method": d.paymentType ?? "",
    message: `Gift of ${pretty} — ${d.fund}`,
  };
  if (d.note) fields.note = d.note;

  await Promise.allSettled([
    sendSubmissionEmail({ intent: "Donation", fields }),
    linkSubmissionToContact({
      id: d._id,
      intent: "Donation",
      fields,
      createdAt: d.paidAt ?? d.createdAt,
    }),
  ]);
}

/* -------------------------------- Reads -------------------------------- */

/** Plain-JSON shape handed to the admin client component. */
export type DonationView = {
  ref: string;
  status: DonationStatus;
  amount: number;
  currency: string;
  amountLabel: string;
  fund: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  note: string;
  createdAt: string;
  paidAt: string | null;
  flwId: number | null;
  flwRef: string;
  chargedAmount: number | null;
  paymentType: string;
  settledVia: string;
  failureReason: string;
};

const iso = (d: Date | string | undefined) =>
  d ? (d instanceof Date ? d : new Date(d)).toISOString() : null;

function view(d: DonationDoc): DonationView {
  return {
    ref: d._id,
    status: d.status,
    amount: d.amount,
    currency: d.currency,
    amountLabel: formatAmount(d.amount, d.currency),
    fund: d.fund ?? "",
    name: d.name ?? "",
    email: d.email ?? "",
    phone: d.phone ?? "",
    country: d.country ?? "",
    note: d.note ?? "",
    createdAt: iso(d.createdAt) ?? new Date(0).toISOString(),
    paidAt: iso(d.paidAt),
    flwId: d.flwId ?? null,
    flwRef: d.flwRef ?? "",
    chargedAmount: d.chargedAmount ?? null,
    paymentType: d.paymentType ?? "",
    settledVia: d.settledVia ?? "",
    failureReason: d.failureReason ?? "",
  };
}

/** Recent gifts, newest first — for the admin dashboard. */
export async function listDonations(limit = 500): Promise<DonationView[]> {
  const db = await getDb();
  const docs = await db
    .collection<DonationDoc>(COLLECTION)
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  return docs.map(view);
}

/* ----------------------------- Reconciling ----------------------------- */

export type ReconcileReport = {
  checked: number;
  settled: number;
  stillPending: number;
  errors: number;
};

/**
 * Ask Flutterwave about every gift still sitting `pending`, and settle any that
 * actually went through. This is the safety net for the case where the donor
 * paid but neither callback reached us — a closed tab plus a missed webhook.
 *
 * Gifts younger than `minAgeMinutes` are skipped: the donor may still be on the
 * checkout page, and an unpaid reference simply doesn't exist at Flutterwave yet.
 */
export async function reconcilePendingDonations(
  minAgeMinutes = 15,
  limit = 200
): Promise<ReconcileReport> {
  const db = await getDb();
  const cutoff = new Date(Date.now() - minAgeMinutes * 60_000);
  const pending = await db
    .collection<DonationDoc>(COLLECTION)
    .find({ status: "pending", createdAt: { $lte: cutoff } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  const report: ReconcileReport = {
    checked: pending.length,
    settled: 0,
    stillPending: 0,
    errors: 0,
  };

  for (const d of pending) {
    try {
      const result = await settleDonationByReference(d._id, "reconcile");
      if (result.outcome === "successful" || result.outcome === "already_settled") {
        report.settled += 1;
      } else if (result.outcome === "not_found") {
        // No transaction at Flutterwave — the donor never paid. Leave it
        // pending rather than inventing a "failed" that never happened.
        report.stillPending += 1;
      }
    } catch (err) {
      report.errors += 1;
      console.error(`[donations] reconcile failed for ${d._id}:`, err);
    }
  }

  return report;
}
