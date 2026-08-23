import { createHmac, timingSafeEqual } from "crypto";

/**
 * Signed, expiring download tokens.
 *
 * The PDF a customer bought is never given a public URL. Instead the receipt
 * page mints a token that names one book inside one paid order and expires;
 * /api/shop/download verifies the signature, re-checks that the order really is
 * paid, and only then streams the file. A token that is edited — a different
 * book id, a later expiry — fails the signature check, so a customer cannot
 * widen their own access.
 *
 * The secret is ADMIN_SECRET (falling back to ADMIN_PASSWORD, as lib/auth does),
 * which means rotating the admin credentials also invalidates every outstanding
 * link. That is the correct trade: links are cheap to re-issue from
 * /books/library, and a leaked secret must not stay useful.
 */

const SECRET =
  process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "change-me";

/** How long a freshly minted link stays valid. */
export const TOKEN_TTL_DAYS = 7;
const TTL_MS = TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

export type TokenPayload = { orderId: string; bookId: string; exp: number };

const b64url = (input: Buffer | string): string =>
  Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const fromB64url = (input: string): Buffer =>
  Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/"), "base64");

function sign(body: string): string {
  return b64url(createHmac("sha256", SECRET).update(body).digest());
}

/** `<base64url(payload)>.<base64url(hmac)>` — safe in a URL query string. */
export function createDownloadToken(
  orderId: string,
  bookId: string,
  ttlMs: number = TTL_MS
): string {
  const payload: TokenPayload = {
    orderId,
    bookId,
    exp: Date.now() + ttlMs,
  };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export type TokenResult =
  | { ok: true; payload: TokenPayload }
  | { ok: false; reason: "malformed" | "invalid" | "expired" };

export function verifyDownloadToken(token: string): TokenResult {
  const raw = String(token ?? "").trim();
  const dot = raw.lastIndexOf(".");
  if (dot <= 0 || dot === raw.length - 1) return { ok: false, reason: "malformed" };

  const body = raw.slice(0, dot);
  const provided = raw.slice(dot + 1);

  // Compare the signatures, not the payloads — and in constant time, so the
  // response time never leaks how much of a forged signature was correct.
  const expected = sign(body);
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "invalid" };
  }

  let payload: TokenPayload;
  try {
    payload = JSON.parse(fromB64url(body).toString("utf8")) as TokenPayload;
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (
    typeof payload?.orderId !== "string" ||
    typeof payload?.bookId !== "string" ||
    typeof payload?.exp !== "number"
  ) {
    return { ok: false, reason: "malformed" };
  }

  if (Date.now() > payload.exp) return { ok: false, reason: "expired" };

  return { ok: true, payload };
}

/** The full URL handed to a customer for one book of one order. */
export function downloadUrl(
  siteUrl: string,
  orderId: string,
  bookId: string
): string {
  const token = createDownloadToken(orderId, bookId);
  // Trailing slash: next.config sets trailingSlash, so the slash-less path
  // answers with a 308 that would drop the query string on some clients.
  return `${siteUrl.replace(/\/$/, "")}/api/shop/download/?token=${encodeURIComponent(token)}`;
}
