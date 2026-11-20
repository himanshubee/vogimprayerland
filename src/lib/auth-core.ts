// Framework-free auth logic, kept apart from next/headers so tests can run it under plain Node.
import { createHmac, scryptSync, timingSafeEqual } from "crypto";

const SESSION_MS = 12 * 60 * 60 * 1000;

const PASSWORD = process.env.ADMIN_PASSWORD || "";
// No built-in fallback secret: without ADMIN_SECRET or ADMIN_PASSWORD, nobody can sign in.
const SECRET = process.env.ADMIN_SECRET || PASSWORD;

export type Role = "intercessor" | "pastor" | "finance" | "admin";
export type Session = { username: string; role: Role; exp: number };

type StaffUser = { username: string; role: Role; passwordHash: string; totpSecret?: string };

const ROLES: Role[] = ["intercessor", "pastor", "finance", "admin"];

/** Staff accounts come from ADMIN_USERS (JSON array). Generate entries with
 *  `node scripts/staff-user.mjs <username> <role>`. Without it, the legacy
 *  single ADMIN_PASSWORD signs in as one shared admin with no MFA. */
function staffUsers(): StaffUser[] {
  try {
    const parsed = JSON.parse(process.env.ADMIN_USERS || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((u) => u && typeof u.username === "string" && ROLES.includes(u.role) && typeof u.passwordHash === "string");
  } catch {
    return [];
  }
}

/** Usernames and roles only, for assigning requests. */
export function staffDirectory() {
  return staffUsers().map(({ username, role }) => ({ username, role }));
}

export function usesSharedLogin() {
  return staffUsers().length === 0;
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Hash format: scrypt$<salt hex>$<hash hex>. */
function verifyHash(input: string, stored: string) {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const derived = scryptSync(input, Buffer.from(salt, "hex"), 64).toString("hex");
  return safeEqual(derived, hash);
}

function base32Decode(input: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const char of input.replace(/=+$/, "").toUpperCase()) {
    const value = alphabet.indexOf(char);
    if (value < 0) continue;
    bits += value.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

/** RFC 6238 TOTP, 30-second steps, 6 digits, one step of clock drift either way.
 *  Returns the matching time step so the caller can refuse a code that was already used. */
export function matchTotpStep(secret: string, code: string, now = Date.now()): number | null {
  if (!/^\d{6}$/.test(code)) return null;
  const key = base32Decode(secret);
  const step = Math.floor(now / 30000);
  for (const offset of [-1, 0, 1]) {
    const counter = Buffer.alloc(8);
    counter.writeBigUInt64BE(BigInt(step + offset));
    const digest = createHmac("sha1", key).update(counter).digest();
    const pos = digest[digest.length - 1] & 0xf;
    const value = (digest.readUInt32BE(pos) & 0x7fffffff) % 1_000_000;
    if (safeEqual(String(value).padStart(6, "0"), code)) return step + offset;
  }
  return null;
}

export function verifyTotp(secret: string, code: string, now = Date.now()) {
  return matchTotpStep(secret, code, now) !== null;
}

export type LoginResult = { ok: true; session: Session; totpStep?: number } | { ok: false; error: string; needsCode?: boolean };

export function login(username: string, password: string, code: string): LoginResult {
  if (!SECRET) return { ok: false, error: "Admin login is not configured on the server." };
  const users = staffUsers();
  if (users.length === 0) {
    if (!PASSWORD) return { ok: false, error: "Admin login is not configured on the server." };
    if (!safeEqual(password, PASSWORD)) return { ok: false, error: "Incorrect sign-in details." };
    return { ok: true, session: { username: "admin", role: "admin", exp: Date.now() + SESSION_MS } };
  }
  const user = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
  if (!user || !verifyHash(password, user.passwordHash)) return { ok: false, error: "Incorrect sign-in details." };
  if (user.totpSecret) {
    if (!code) return { ok: false, error: "Enter the 6-digit code from your authenticator app.", needsCode: true };
    const totpStep = matchTotpStep(user.totpSecret, code.replace(/\s/g, ""));
    if (totpStep === null) return { ok: false, error: "That code did not match. Try the newest code.", needsCode: true };
    return { ok: true, session: { username: user.username, role: user.role, exp: Date.now() + SESSION_MS }, totpStep };
  }
  return { ok: true, session: { username: user.username, role: user.role, exp: Date.now() + SESSION_MS } };
}

function sign(payload: string) {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function createToken(session: Session) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readToken(token: string | undefined): Session | null {
  if (!token || !SECRET) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(sign(payload), signature)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    if (!ROLES.includes(session.role) || typeof session.exp !== "number" || session.exp < Date.now()) return null;
    // A removed account, or one whose role changed, loses its session straight away.
    const users = staffUsers();
    if (users.length && !users.some((u) => u.username === session.username && u.role === session.role)) return null;
    if (!users.length && session.username !== "admin") return null;
    return session;
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = SESSION_MS / 1000;

/** Which request types a role may read. Finance sees refund requests only. */
export function canReadIntent(role: Role, intent: string) {
  if (role === "admin" || role === "pastor") return true;
  if (role === "finance") return intent === "Refund Request";
  return intent !== "Refund Request" && intent !== "Privacy Request" && intent !== "Complaint";
}
