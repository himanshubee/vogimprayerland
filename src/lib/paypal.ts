/**
 * PayPal Orders v2 client (server-only).
 *
 * Same shape as lib/flutterwave.ts on purpose: the server creates the order,
 * the buyer is redirected to PayPal to approve it, and we capture it when they
 * come back. No card data touches this site and the secret never reaches the
 * browser.
 *
 * We deliberately do NOT use the PayPal JS SDK. The redirect flow needs no
 * third-party script on the page (nothing to add to the CSP, nothing to slow
 * the shop down) and it settles through exactly the same "create pending row →
 * verify → settle" path the giving flow already uses.
 *
 * Docs: POST /v2/checkout/orders, POST /v2/checkout/orders/{id}/capture.
 */

const LIVE = "https://api-m.paypal.com";
const SANDBOX = "https://api-m.sandbox.paypal.com";

const clientId = () => process.env.PAYPAL_CLIENT_ID?.trim() || "";
const clientSecret = () => process.env.PAYPAL_SECRET?.trim() || "";

/** Anything other than an explicit "live" is treated as sandbox — an
 *  unset variable must never silently take real money. */
export function isPaypalSandbox(): boolean {
  return (process.env.PAYPAL_ENV?.trim().toLowerCase() || "sandbox") !== "live";
}

const apiBase = () => (isPaypalSandbox() ? SANDBOX : LIVE);

export function isPaypalConfigured(): boolean {
  return clientId().length > 0 && clientSecret().length > 0;
}

export class PaypalError extends Error {
  readonly status: number;
  readonly retryable: boolean;
  constructor(message: string, status: number) {
    super(message);
    this.name = "PaypalError";
    this.status = status;
    this.retryable = status === 0 || status >= 500 || status === 429;
  }
}

/* ------------------------------ Access token ---------------------------- */

let cachedToken: { value: string; expiresAt: number } | null = null;

/**
 * OAuth2 client-credentials token, cached until shortly before it expires.
 * PayPal tokens last ~9 hours; re-fetching one per request would add a full
 * round trip to every checkout.
 */
async function accessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;

  const basic = Buffer.from(`${clientId()}:${clientSecret()}`).toString("base64");
  let res: Response;
  try {
    res = await fetch(`${apiBase()}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    });
  } catch (err) {
    throw new PaypalError(
      err instanceof Error ? err.message : "Could not reach PayPal",
      0
    );
  }

  const body = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error_description?: string;
  };

  if (!res.ok || !body.access_token) {
    cachedToken = null;
    throw new PaypalError(
      body.error_description || `PayPal auth failed (HTTP ${res.status})`,
      res.status
    );
  }

  // Refresh a minute early so an in-flight request never uses a token that
  // expires mid-call.
  const ttl = Math.max(60, (body.expires_in ?? 32400) - 60);
  cachedToken = { value: body.access_token, expiresAt: Date.now() + ttl * 1000 };
  return cachedToken.value;
}

async function ppFetch<T>(
  path: string,
  init?: RequestInit & { requestId?: string }
): Promise<T> {
  const token = await accessToken();
  let res: Response;
  try {
    res = await fetch(`${apiBase()}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        // Makes retries safe: PayPal returns the original result instead of
        // creating/capturing a second time.
        ...(init?.requestId ? { "PayPal-Request-Id": init.requestId } : {}),
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch (err) {
    throw new PaypalError(
      err instanceof Error ? err.message : "Could not reach PayPal",
      0
    );
  }

  const body = (await res.json().catch(() => ({}))) as T & {
    message?: string;
    name?: string;
    details?: { description?: string; issue?: string }[];
  };

  if (!res.ok) {
    const detail = body?.details?.[0];
    throw new PaypalError(
      detail?.description || body?.message || `PayPal request failed (HTTP ${res.status})`,
      res.status
    );
  }
  return body;
}

/* -------------------------------- Types --------------------------------- */

export type PaypalLineItem = {
  name: string;
  quantity: number;
  unitAmount: number;
};

export type CreateOrderInput = {
  /** Our own reference — comes back on the captured order as invoice_id. */
  reference: string;
  currency: string;
  total: number;
  items: PaypalLineItem[];
  returnUrl: string;
  cancelUrl: string;
  brandName?: string;
};

export type CreatedOrder = { id: string; approveUrl: string };

export type CapturedOrder = {
  id: string;
  status: string;
  captureId: string;
  reference: string;
  amount: number;
  currency: string;
  payer: { email: string; name: string };
};

type OrderResponse = {
  id?: string;
  status?: string;
  links?: { href?: string; rel?: string; method?: string }[];
  purchase_units?: {
    invoice_id?: string;
    custom_id?: string;
    amount?: { value?: string; currency_code?: string };
    payments?: {
      captures?: {
        id?: string;
        status?: string;
        amount?: { value?: string; currency_code?: string };
      }[];
    };
  }[];
  payer?: {
    email_address?: string;
    name?: { given_name?: string; surname?: string };
  };
};

const money = (n: number) => (Math.round(n * 100) / 100).toFixed(2);

/* ------------------------------ Operations ------------------------------ */

/**
 * Create an order and return the URL to send the buyer to.
 *
 * The item breakdown is sent so the buyer sees the actual book titles on
 * PayPal's page rather than an unexplained total.
 */
export async function createPaypalOrder(
  input: CreateOrderInput
): Promise<CreatedOrder> {
  const currency = input.currency.toUpperCase();
  const itemTotal = input.items.reduce(
    (sum, i) => sum + i.unitAmount * i.quantity,
    0
  );

  // PayPal rejects the order outright if the breakdown doesn't add up to the
  // total, so only send it when it reconciles to the cent.
  const breakdownMatches = money(itemTotal) === money(input.total);

  const body = {
    intent: "CAPTURE",
    purchase_units: [
      {
        invoice_id: input.reference,
        custom_id: input.reference,
        description: "Books from VOGIM Prayer Land",
        amount: {
          currency_code: currency,
          value: money(input.total),
          ...(breakdownMatches
            ? {
                breakdown: {
                  item_total: { currency_code: currency, value: money(itemTotal) },
                },
              }
            : {}),
        },
        ...(breakdownMatches
          ? {
              items: input.items.map((i) => ({
                name: i.name.slice(0, 127),
                quantity: String(i.quantity),
                unit_amount: {
                  currency_code: currency,
                  value: money(i.unitAmount),
                },
                category: "DIGITAL_GOODS",
              })),
            }
          : {}),
      },
    ],
    payment_source: {
      paypal: {
        experience_context: {
          brand_name: input.brandName || "VOGIM Prayer Land",
          // Let PayPal decide whether to open on the login form or the guest
          // card form — forcing LOGIN turns away buyers without an account.
          landing_page: "NO_PREFERENCE",
          // "Pay Now" rather than "Continue": there is no shipping step after
          // this, so a second confirmation screen would only lose people.
          user_action: "PAY_NOW",
          // Digital goods — no address to collect.
          shipping_preference: "NO_SHIPPING",
          return_url: input.returnUrl,
          cancel_url: input.cancelUrl,
        },
      },
    },
  };

  const res = await ppFetch<OrderResponse>("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify(body),
    requestId: input.reference,
  });

  const id = res.id;
  // v2 with payment_source returns the redirect as "payer-action"; older
  // responses call it "approve". Accept either so a PayPal API change doesn't
  // dead-end the buyer.
  const approveUrl = res.links?.find(
    (l) => l.rel === "payer-action" || l.rel === "approve"
  )?.href;

  if (!id || !approveUrl) {
    throw new Error("PayPal did not return an approval link.");
  }
  return { id, approveUrl };
}

/**
 * Capture an approved order. Returns null when PayPal has no such order.
 *
 * Capturing twice is not an error: PayPal answers a repeat capture with
 * ORDER_ALREADY_CAPTURED, which we resolve by reading the existing capture
 * back off the order — that keeps the redirect and the webhook from fighting.
 */
export async function capturePaypalOrder(
  orderId: string
): Promise<CapturedOrder | null> {
  const id = String(orderId).replace(/[^\w-]/g, "");
  if (!id) return null;

  try {
    const res = await ppFetch<OrderResponse>(
      `/v2/checkout/orders/${id}/capture`,
      { method: "POST", body: "{}", requestId: `capture-${id}` }
    );
    return toCaptured(res);
  } catch (err) {
    if (err instanceof PaypalError) {
      // Already captured, or a 4xx that a retry cannot fix — fall back to
      // reading the order's current state.
      if (err.status === 404) return null;
      if (!err.retryable) {
        const existing = await getPaypalOrder(id);
        if (existing?.captureId) return existing;
        if (err.status === 404 || err.status === 422) return null;
      }
    }
    throw err;
  }
}

/** Read an order back without capturing — used to resolve a double capture. */
export async function getPaypalOrder(
  orderId: string
): Promise<CapturedOrder | null> {
  const id = String(orderId).replace(/[^\w-]/g, "");
  if (!id) return null;
  try {
    const res = await ppFetch<OrderResponse>(`/v2/checkout/orders/${id}`, {
      method: "GET",
    });
    return toCaptured(res);
  } catch (err) {
    if (err instanceof PaypalError && err.status === 404) return null;
    throw err;
  }
}

function toCaptured(res: OrderResponse): CapturedOrder | null {
  if (!res.id) return null;
  const unit = res.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];

  // Trust the capture's own amount over the order's when both exist — that is
  // the money that actually moved.
  const amount = Number(capture?.amount?.value ?? unit?.amount?.value ?? 0);
  const currency = String(
    capture?.amount?.currency_code ?? unit?.amount?.currency_code ?? ""
  ).toUpperCase();

  const given = res.payer?.name?.given_name ?? "";
  const surname = res.payer?.name?.surname ?? "";

  return {
    id: res.id,
    // COMPLETED on the capture is the definitive success signal; the order's
    // own status can still read APPROVED at that moment.
    status: String(capture?.status ?? res.status ?? "").toUpperCase(),
    captureId: capture?.id ?? "",
    reference: unit?.invoice_id ?? unit?.custom_id ?? "",
    amount: Number.isFinite(amount) ? amount : 0,
    currency,
    payer: {
      email: res.payer?.email_address ?? "",
      name: `${given} ${surname}`.trim(),
    },
  };
}

/* ------------------------------- Webhooks ------------------------------- */

/**
 * Ask PayPal whether a webhook really came from PayPal. Unlike Flutterwave's
 * shared secret, the signature is verified by an API call against the
 * transmission headers.
 */
export async function verifyPaypalWebhook(
  headers: Headers,
  rawBody: string
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim();
  if (!webhookId) return false;

  const required = {
    transmission_id: headers.get("paypal-transmission-id"),
    transmission_time: headers.get("paypal-transmission-time"),
    cert_url: headers.get("paypal-cert-url"),
    auth_algo: headers.get("paypal-auth-algo"),
    transmission_sig: headers.get("paypal-transmission-sig"),
  };
  if (Object.values(required).some((v) => !v)) return false;

  try {
    const res = await ppFetch<{ verification_status?: string }>(
      "/v1/notifications/verify-webhook-signature",
      {
        method: "POST",
        body: JSON.stringify({
          ...required,
          webhook_id: webhookId,
          // Must be the parsed body, re-serialized by PayPal's own rules — the
          // API takes it as a JSON value, not a string.
          webhook_event: JSON.parse(rawBody),
        }),
      }
    );
    return res.verification_status === "SUCCESS";
  } catch (err) {
    console.error("[paypal] webhook verification failed:", err);
    return false;
  }
}
