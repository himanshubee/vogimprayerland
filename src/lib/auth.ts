import { cookies } from "next/headers";
import { readToken, type Role, type Session } from "./auth-core";
import { isRevoked } from "./login-guard";

export * from "./auth-core";

export const ADMIN_COOKIE = "vogim_admin";

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  const session = readToken(token);
  if (!session || !token) return null;
  // Fail closed: if the revocation list cannot be read, the session is not trusted.
  return (await isRevoked(token).catch(() => true)) ? null : session;
}

/** Server-side check for use in admin pages / route handlers. Any signed-in staff role passes. */
export async function isAuthenticated(): Promise<boolean> {
  return (await getSession()) !== null;
}

/** Signed-in session holding one of the given roles, or null. */
export async function requireRole(...roles: Role[]): Promise<Session | null> {
  const session = await getSession();
  return session && roles.includes(session.role) ? session : null;
}
