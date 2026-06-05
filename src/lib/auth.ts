import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "vogim_admin";

const PASSWORD = process.env.ADMIN_PASSWORD || "";
const SECRET = process.env.ADMIN_SECRET || PASSWORD || "change-me";

/** Token the cookie should hold when authenticated. Tied to the password+secret,
 *  so it can't be forged and is invalidated if the password changes. */
export function expectedToken(): string {
  return createHmac("sha256", SECRET).update(`admin:${PASSWORD}`).digest("hex");
}

export function verifyPassword(input: string): boolean {
  if (!PASSWORD) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(PASSWORD);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifyToken(token: string | undefined): boolean {
  if (!token || !PASSWORD) return false;
  const expected = expectedToken();
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Server-side check for use in admin pages / route handlers. */
export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(ADMIN_COOKIE)?.value);
}
