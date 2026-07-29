/**
 * Flutterwave V3 client (server-only).
 *
 * We use the **Standard / hosted** flow: the server creates a payment link with
 * the secret key and we redirect the donor to Flutterwave's checkout. No card
 * data ever touches this site, and the public key is never needed in the
 * browser. After payment Flutterwave sends the donor back to `redirect_url`
 * with `?status=&tx_ref=&transaction_id=`, which we then verify server-side.
 *
 * Docs: POST /v3/payments (create link), GET /v3/transactions/:id/verify.
 */

const API_BASE = "https://api.flutterwave.com/v3";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.vogimprayerland.org"
).replace(/\/$/, "");

const secretKey = () => process.env.FLW_SECRET_KEY?.trim() || "";

/** Gifts can only be taken on-site when the secret key is present. */
export function isFlutterwaveConfigured(): boolean {
  return secretKey().length > 0;
}

/** Flutterwave test keys are prefixed FLWSECK_TEST — surfaced in the UI. */
export function isTestMode(): boolean {
  return /_TEST/i.test(secretKey());
}

/* ------------------------------ Currencies ------------------------------ */

export type CurrencyCode = "NGN" | "USD" | "GBP" | "EUR" | "GHS" | "KES" | "ZAR";

export const CURRENCIES: Record<
  CurrencyCode,
  { symbol: string; label: string; min: number }
> = {
  NGN: { symbol: "₦", label: "Naira", min: 100 },
  USD: { symbol: "$", label: "US Dollar", min: 1 },
  GBP: { symbol: "£", label: "Pound", min: 1 },
  EUR: { symbol: "€", label: "Euro", min: 1 },
  GHS: { symbol: "₵", label: "Cedi", min: 1 },
  KES: { symbol: "KSh", label: "Shilling", min: 50 },
  ZAR: { symbol: "R", label: "Rand", min: 10 },
};

export const isCurrency = (v: string): v is CurrencyCode => v in CURRENCIES;

/* -------------------------------- Types --------------------------------- */

export type CreateLinkInput = {
  txRef: string;
  amount: number;
  currency: CurrencyCode;
  redirectUrl: string;
  customer: { email: string; name?: string; phonenumber?: string };
  /** Free-form data echoed back on verification and in the webhook. */
  meta?: Record<string, string>;
  title?: string;
  description?: string;
};

export type VerifiedTransaction = {
  id: number;
  txRef: string;
  flwRef: string;
  status: string;
  amount: number;
  chargedAmount: number;
  currency: string;
  paymentType: string;
  createdAt: string;
  customer: { email: string; name: string; phoneNumber: string };
  meta: Record<string, unknown>;
};

type FlwResponse<T> = { status?: string; message?: string; data?: T | null };

/**
 * A failed Flutterwave call. `retryable` separates "try again later" (network
 * blips, 5xx) from "this will never succeed" (bad key, malformed request) so
 * callers — the webhook especially — know whether a retry is worth anything.
 */
export class FlutterwaveError extends Error {
  readonly status: number;
  readonly retryable: boolean;
  constructor(message: string, status: number) {
    super(message);
    this.name = "FlutterwaveError";
    this.status = status;
    this.retryable = status === 0 || status >= 500 || status === 429;
  }
}

async function flwFetch<T>(
  path: string,
  init?: RequestInit
): Promise<FlwResponse<T>> {
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
    });
  } catch (err) {
    // Could not reach Flutterwave at all — always worth retrying.
    throw new FlutterwaveError(
      err instanceof Error ? err.message : "Could not reach Flutterwave",
      0
    );
  }

  const body = (await res.json().catch(() => ({}))) as FlwResponse<T>;
  if (!res.ok) {
    throw new FlutterwaveError(
      body?.message || `Flutterwave request failed (HTTP ${res.status})`,
      res.status
    );
  }
  return body;
}

/* ------------------------------ Operations ------------------------------ */

/** Create a hosted checkout link. Returns the URL to redirect the donor to. */
export async function createPaymentLink(input: CreateLinkInput): Promise<string> {
  const body = {
    tx_ref: input.txRef,
    // Flutterwave accepts a string or number; send a fixed-precision string.
    amount: input.amount.toFixed(2),
    currency: input.currency,
    redirect_url: input.redirectUrl,
    customer: {
      email: input.customer.email,
      name: input.customer.name || undefined,
      phonenumber: input.customer.phonenumber || undefined,
    },
    customizations: {
      title: input.title || "VOGIM Prayer Land",
      description: input.description || "Offering to the work of the ministry",
      logo: `${SITE_URL}/icon.png`,
    },
    meta: input.meta ?? {},
  };

  const res = await flwFetch<{ link?: string }>("/payments", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const link = res.data?.link;
  if (res.status !== "success" || !link) {
    throw new Error(res.message || "Flutterwave did not return a payment link.");
  }
  return link;
}

/** Verify a transaction by its Flutterwave id. Returns null if not found. */
export async function verifyTransaction(
  transactionId: string | number
): Promise<VerifiedTransaction | null> {
  const id = String(transactionId).replace(/[^\w-]/g, "");
  if (!id) return null;
  return verifyAt(`/transactions/${id}/verify`);
}

/**
 * Verify by *our* reference instead of Flutterwave's id — the only way to
 * reconcile a gift when both the redirect and the webhook were missed, since
 * in that case we never learn the transaction id.
 */
export async function verifyTransactionByReference(
  txRef: string
): Promise<VerifiedTransaction | null> {
  const ref = String(txRef).trim();
  if (!ref) return null;
  return verifyAt(
    `/transactions/verify_by_reference?tx_ref=${encodeURIComponent(ref)}`
  );
}

async function verifyAt(path: string): Promise<VerifiedTransaction | null> {
  type Raw = {
    id: number;
    tx_ref: string;
    flw_ref: string;
    status: string;
    amount: number;
    charged_amount: number;
    currency: string;
    payment_type: string;
    created_at: string;
    customer?: { email?: string; name?: string; phone_number?: string };
    meta?: Record<string, unknown> | null;
  };

  let res: FlwResponse<Raw>;
  try {
    res = await flwFetch<Raw>(path, { method: "GET" });
  } catch (err) {
    // Flutterwave answers an unknown transaction id or reference with HTTP 400
    // and a null body ("No transaction was found for this id") — that is a
    // definitive "doesn't exist", not an error worth retrying.
    if (err instanceof FlutterwaveError && err.status === 400) return null;
    throw err;
  }

  const d = res.data;
  if (!d) return null;

  return {
    id: d.id,
    txRef: d.tx_ref,
    flwRef: d.flw_ref,
    status: String(d.status || "").toLowerCase(),
    amount: Number(d.amount) || 0,
    chargedAmount: Number(d.charged_amount) || 0,
    currency: String(d.currency || "").toUpperCase(),
    paymentType: d.payment_type ?? "",
    createdAt: d.created_at ?? "",
    customer: {
      email: d.customer?.email ?? "",
      name: d.customer?.name ?? "",
      phoneNumber: d.customer?.phone_number ?? "",
    },
    meta: d.meta ?? {},
  };
}
