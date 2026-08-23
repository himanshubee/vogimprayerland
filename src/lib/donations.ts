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
import { verifyTransaction as verifyPaystack } from "@/lib/paystack";
import { capturePaypalOrder } from "@/lib/paypal";
import { gatewayLabel, type Provider } from "@/lib/gateways";

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

export type { Provider } from "@/lib/gateways";

/** Which callback settled the gift. "reconcile" = an admin sweep caught it. */
export type SettledVia = "redirect" | "webhook" | "reconcile";

export type DonationDoc = {
  _id: string; // tx_ref — our own reference, unique per attempt
  status: DonationStatus;
  /** Which gateway the gift was taken through. Absent on pre-multi-gateway
   *  rows, which were all Flutterwave. */
  provider?: Provider;
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
  /** The gateway's side of the record, filled in on settlement. */
  flwId?: number;
  flwRef?: string;
  paystackId?: number;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  chargedAmount?: number;
  paymentType?: string;
  settledVia?: SettledVia;
  failureReason?: string;
  ip?: string | null;
  userAgent?: string | null;
};

export type NewDonation = {
  provider: Provider;
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
    provider: input.provider,
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

/**
 * Settle a gift against whatever the gateway reported, once the two agree.
 *
 * Gateway-neutral on purpose: each gateway's client is asked its own way, then
 * hands the same four facts here — status, amount, currency, and the fields to
 * record. A gift is only ever marked successful when the *verified*
 * transaction matches what we stored before checkout, so a tampered redirect
 * URL cannot fake one.
 */
async function settleAgainst(
  ref: string,
  verified: {
    status: string;
    amount: number;
    currency: string;
    label: string;
    fields: Partial<DonationDoc>;
  },
  via: SettledVia
): Promise<SettleResult> {
  const db = await getDb();
  const donations = db.collection<DonationDoc>(COLLECTION);
  const existing = await donations.findOne({ _id: ref });

  if (!existing) {
    return {
      outcome: "not_found",
      donation: null,
      reason: `No local record for reference ${ref}.`,
    };
  }

  // Idempotency — the redirect and the webhook both settle the same gift.
  if (existing.status === "successful") {
    return { outcome: "already_settled", donation: existing };
  }

  const now = new Date();
  const ok = verified.status === "successful";

  if (!ok) {
    const cancelled = /cancel|void|abandon/i.test(verified.status);
    await donations.updateOne(
      { _id: ref },
      {
        $set: {
          status: cancelled ? "cancelled" : "failed",
          updatedAt: now,
          settledVia: via,
          failureReason: `${verified.label} reported status “${verified.status}”.`,
          ...verified.fields,
        },
      }
    );
    return {
      outcome: "failed",
      donation: await donations.findOne({ _id: ref }),
      reason: `The payment was not completed (${verified.status}).`,
    };
  }

  // Successful — but only honour it if it matches what we asked for.
  if (verified.currency && verified.currency !== existing.currency) {
    const reason = `Currency mismatch: expected ${existing.currency}, received ${verified.currency}.`;
    await donations.updateOne(
      { _id: ref },
      { $set: { updatedAt: now, ...verified.fields, failureReason: reason } }
    );
    return { outcome: "mismatch", donation: existing, reason };
  }

  if (verified.amount + 0.001 < existing.amount) {
    const reason = `Amount mismatch: expected ${existing.amount}, received ${verified.amount}.`;
    await donations.updateOne(
      { _id: ref },
      { $set: { updatedAt: now, ...verified.fields, failureReason: reason } }
    );
    return { outcome: "mismatch", donation: existing, reason };
  }

  await donations.updateOne(
    { _id: ref },
    {
      $set: {
        status: "successful",
        updatedAt: now,
        paidAt: now,
        settledVia: via,
        ...verified.fields,
      },
      $unset: { failureReason: "" },
    }
  );

  const donation = (await donations.findOne({ _id: ref })) as DonationDoc;

  // Post-settlement side effects must never break the donor's confirmation.
  await notifyAndLink(donation).catch((err) =>
    console.error("[donations] post-settle hook failed:", err)
  );

  return { outcome: "successful", donation };
}

async function settleVerified(
  tx: VerifiedTransaction,
  via: SettledVia
): Promise<SettleResult> {
  return settleAgainst(
    tx.txRef,
    {
      status: tx.status,
      amount: tx.amount,
      currency: tx.currency,
      label: "Flutterwave",
      fields: {
        flwId: tx.id,
        flwRef: tx.flwRef,
        chargedAmount: tx.chargedAmount,
        paymentType: tx.paymentType,
      },
    },
    via
  );
}

/* ---- Paystack ---- */

/** Settle by *our* reference, which is what Paystack verification keys on. */
export async function settlePaystackDonation(
  ref: string,
  via: SettledVia
): Promise<SettleResult> {
  const tx = await verifyPaystack(ref);
  if (!tx) {
    return {
      outcome: "not_found",
      donation: null,
      reason: "Paystack has no transaction for that reference.",
    };
  }
  return settleAgainst(
    tx.reference,
    {
      // Paystack says "success"; the shared settler speaks "successful".
      status: tx.status === "success" ? "successful" : tx.status,
      amount: tx.amount,
      currency: tx.currency,
      label: "Paystack",
      fields: {
        paystackId: tx.id,
        chargedAmount: tx.amount,
        paymentType: tx.channel || "paystack",
      },
    },
    via
  );
}

/* ---- PayPal ---- */

/**
 * Capture the PayPal order and settle ours. `ref` is our own reference when we
 * have it; PayPal also echoes it back as invoice_id, which is the fallback
 * when the donor returns without it in the query string.
 */
export async function settlePaypalDonation(
  paypalOrderId: string,
  via: SettledVia,
  ref?: string
): Promise<SettleResult> {
  const captured = await capturePaypalOrder(paypalOrderId);
  if (!captured) {
    return {
      outcome: "not_found",
      donation: null,
      reason: "PayPal has no record of that order.",
    };
  }

  const reference = ref || captured.reference;
  if (!reference) {
    return {
      outcome: "not_found",
      donation: null,
      reason: `No reference on PayPal order ${paypalOrderId}.`,
    };
  }

  return settleAgainst(
    reference,
    {
      status: captured.status === "COMPLETED" ? "successful" : captured.status,
      amount: captured.amount,
      currency: captured.currency,
      label: "PayPal",
      fields: {
        paypalOrderId: captured.id,
        paypalCaptureId: captured.captureId,
        chargedAmount: captured.amount,
        paymentType: "paypal",
      },
    },
    via
  );
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
    "paid with": gatewayLabel(d.provider ?? "flutterwave"),
    "gateway reference": String(d.flwId ?? d.paystackId ?? d.paypalCaptureId ?? ""),
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
  provider: Provider;
  providerLabel: string;
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
  /** Whichever gateway reference exists, for searching in the admin. */
  gatewayRef: string;
  chargedAmount: number | null;
  paymentType: string;
  settledVia: string;
  failureReason: string;
};

const iso = (d: Date | string | undefined) =>
  d ? (d instanceof Date ? d : new Date(d)).toISOString() : null;

function view(d: DonationDoc): DonationView {
  const provider: Provider = d.provider ?? "flutterwave";
  return {
    ref: d._id,
    status: d.status,
    provider,
    providerLabel: gatewayLabel(provider),
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
    gatewayRef:
      d.paypalCaptureId ||
      d.flwRef ||
      (d.paystackId ? String(d.paystackId) : "") ||
      d.paypalOrderId ||
      "",
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
      const provider: Provider = d.provider ?? "flutterwave";
      const result =
        provider === "paystack"
          ? await settlePaystackDonation(d._id, "reconcile")
          : provider === "paypal"
            ? d.paypalOrderId
              ? await settlePaypalDonation(d.paypalOrderId, "reconcile", d._id)
              : ({
                  outcome: "not_found",
                  donation: null,
                  reason: "No PayPal order id.",
                } as SettleResult)
            : await settleDonationByReference(d._id, "reconcile");
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
