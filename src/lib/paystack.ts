import { createHmac, timingSafeEqual } from "crypto";
import type { CurrencyCode } from "@/lib/currencies";

/**
 * Paystack client (server-only).
 *
 * Same hosted-redirect shape as the other two gateways: the server initializes
 * a transaction with the secret key, the buyer finishes on Paystack's own
 * checkout, and we verify server-side before anything is marked paid. No card
 * data touches this site and the secret never reaches the browser.
 *
 * Two things differ from Flutterwave and are easy to get wrong:
 *
 *  1. Amounts are in the currency's SMALLEST unit — kobo, cents. ₦5,000 is
 *     sent as 500000. Sending 5000 would charge ₦50.
 *  2. Verification is keyed on *our* reference rather than a gateway id, which
 *     means a paid order can always be reconciled even if every callback is
 *     missed.
 *
 * Docs: POST /transaction/initialize, GET /transaction/verify/:reference.
 */

const API_BASE = "https://api.paystack.co";

/**
 * Give up on a request that never answers.
 *
 * Without this a gateway that accepts the connection and then stalls leaves the
 * fetch pending forever: the checkout request never returns, and nginx
 * eventually answers the buyer with its own 502 HTML page — which the browser
 * cannot parse, so they see a generic "could not start your order" with no clue
 * why. A bounded wait turns that into a real error message in seconds.
 */
const REQUEST_TIMEOUT_MS = 15_000;


const secretKey = () => process.env.PAYSTACK_SECRET_KEY?.trim() || "";

export function isPaystackConfigured(): boolean {
  return secretKey().length > 0;
}

/** Paystack test keys are prefixed sk_test_ — surfaced in the UI. */
export function isPaystackTestMode(): boolean {
  return /^sk_test_/i.test(secretKey());
}

/**
 * Currencies Paystack can settle. Notably it does NOT do GBP, EUR or AED — a
 * book priced only in those is Flutterwave's to take.
 *
 * A given merchant account is usually enabled for a subset of these (a
 * Nigerian account typically NGN, plus USD on request). Anything the account
 * isn't enabled for is refused at initialize with a clear message, which is
 * surfaced to the buyer rather than swallowed.
 */
export const PAYSTACK_CURRENCIES: CurrencyCode[] = [
  "NGN",
  "USD",
  "GHS",
  "ZAR",
  "KES",
];

export const isPaystackCurrency = (c: string): c is CurrencyCode =>
  (PAYSTACK_CURRENCIES as string[]).includes(c);

export class PaystackError extends Error {
  readonly status: number;
  readonly retryable: boolean;
  constructor(message: string, status: number) {
    super(message);
    this.name = "PaystackError";
    this.status = status;
    this.retryable = status === 0 || status >= 500 || status === 429;
  }
}

/* ------------------------------- Subunits ------------------------------- */

/**
 * Every currency Paystack supports here has two decimal places, so the
 * smallest unit is always amount × 100. Rounded, never truncated: 4.995 must
 * become 500 rather than 499.
 */
export const toSubunit = (amount: number): number =>
  Math.round((Number(amount) + Number.EPSILON) * 100);

export const fromSubunit = (subunit: number): number =>
  Math.round(Number(subunit)) / 100;

/* -------------------------------- Fetch --------------------------------- */

type PsResponse<T> = { status?: boolean; message?: string; data?: T | null };

async function psFetch<T>(
  path: string,
  init?: RequestInit
): Promise<PsResponse<T>> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${secretKey()}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "TimeoutError";
    throw new PaystackError(
      timedOut
        ? `Paystack did not respond within ${REQUEST_TIMEOUT_MS / 1000}s`
        : err instanceof Error
          ? err.message
          : "Could not reach Paystack",
      0
    );
  }

  const body = (await res.json().catch(() => ({}))) as PsResponse<T>;
  if (!res.ok) {
    throw new PaystackError(
      body?.message || `Paystack request failed (HTTP ${res.status})`,
      res.status
    );
  }
  return body;
}

/* ------------------------------ Operations ------------------------------ */

export type InitializeInput = {
  /** Our own reference — Paystack echoes it back and verification keys on it. */
  reference: string;
  amount: number;
  currency: CurrencyCode;
  email: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
};

/** Start a transaction. Returns the URL to redirect the buyer to. */
export async function initializeTransaction(
  input: InitializeInput
): Promise<string> {
  const res = await psFetch<{ authorization_url?: string }>(
    "/transaction/initialize",
    {
      method: "POST",
      body: JSON.stringify({
        reference: input.reference,
        // Kobo/cents, never the major unit — see toSubunit above.
        amount: toSubunit(input.amount),
        currency: input.currency,
        email: input.email,
        callback_url: input.callbackUrl,
        metadata: input.metadata ?? {},
      }),
    }
  );

  const url = res.data?.authorization_url;
  if (res.status !== true || !url) {
    throw new Error(res.message || "Paystack did not return a checkout link.");
  }
  return url;
}

export type VerifiedPaystackTransaction = {
  id: number;
  reference: string;
  /** "success" | "failed" | "abandoned" | … */
  status: string;
  /** Major units — already converted back out of kobo/cents. */
  amount: number;
  currency: string;
  channel: string;
  paidAt: string;
  gatewayResponse: string;
  customer: { email: string; name: string };
};

/**
 * Verify by our own reference. Returns null when Paystack has no such
 * transaction — which is the normal answer for a buyer who never paid.
 */
export async function verifyTransaction(
  reference: string
): Promise<VerifiedPaystackTransaction | null> {
  const ref = String(reference ?? "").trim();
  if (!ref) return null;

  type Raw = {
    id: number;
    reference: string;
    status: string;
    amount: number;
    currency: string;
    channel?: string;
    paid_at?: string | null;
    gateway_response?: string;
    customer?: { email?: string; first_name?: string; last_name?: string };
  };

  let res: PsResponse<Raw>;
  try {
    res = await psFetch<Raw>(
      `/transaction/verify/${encodeURIComponent(ref)}`,
      { method: "GET" }
    );
  } catch (err) {
    // Paystack answers an unknown reference with 404 (and sometimes 400) —
    // a definitive "doesn't exist", not an error worth retrying.
    if (
      err instanceof PaystackError &&
      (err.status === 404 || err.status === 400)
    ) {
      return null;
    }
    throw err;
  }

  const d = res.data;
  if (!d) return null;

  const first = d.customer?.first_name ?? "";
  const last = d.customer?.last_name ?? "";

  return {
    id: d.id,
    reference: d.reference,
    status: String(d.status || "").toLowerCase(),
    amount: fromSubunit(d.amount),
    currency: String(d.currency || "").toUpperCase(),
    channel: d.channel ?? "",
    paidAt: d.paid_at ?? "",
    gatewayResponse: d.gateway_response ?? "",
    customer: {
      email: d.customer?.email ?? "",
      name: `${first} ${last}`.trim(),
    },
  };
}

/* ------------------------------- Webhooks ------------------------------- */

/**
 * Paystack signs the webhook body with HMAC-SHA512 using the SECRET KEY and
 * sends it in `x-paystack-signature`. There is no separate webhook secret to
 * configure, but the signature must be computed over the EXACT raw bytes —
 * re-serializing the parsed JSON will not match.
 */
export function verifyPaystackWebhook(
  rawBody: string,
  signature: string | null
): boolean {
  const key = secretKey();
  if (!key || !signature) return false;

  const expected = createHmac("sha512", key).update(rawBody, "utf8").digest("hex");

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  // Constant time, so the response never leaks how much of a forged signature
  // was correct.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
