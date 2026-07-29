import { randomUUID } from "crypto";
import { getDb } from "@/lib/mongodb";
import { linkSubmissionToContact } from "@/lib/crm";
import { sendSubmissionEmail } from "@/lib/mailer";
import {
  CURRENCIES,
  verifyTransaction,
  type CurrencyCode,
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
  settledVia?: "redirect" | "webhook";
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
  via: "redirect" | "webhook"
): Promise<SettleResult> {
  const tx = await verifyTransaction(transactionId);
  if (!tx) {
    return {
      outcome: "not_found",
      donation: null,
      reason: "Flutterwave has no record of that transaction.",
    };
  }

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

/** Recent gifts, newest first — for the admin dashboard. */
export async function listDonations(limit = 200): Promise<DonationDoc[]> {
  const db = await getDb();
  return db
    .collection<DonationDoc>(COLLECTION)
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}
