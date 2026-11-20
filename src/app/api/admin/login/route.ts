import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, SESSION_MAX_AGE, createToken, login } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/client-ip";
import { claimTotpStep, clearFailures, isLockedOut, recordFailure } from "@/lib/login-guard";

export const dynamic = "force-dynamic";

const LOCKED = "Too many failed attempts. Wait 15 minutes and try again.";

export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const username = String(body.username || "").trim().slice(0, 80) || "admin";
  const ip = clientIp(req);
  try {
    if (await isLockedOut(username, ip)) return NextResponse.json({ error: LOCKED }, { status: 429 });
  } catch {
    return NextResponse.json({ error: "Sign-in is unavailable. Try again shortly." }, { status: 503 });
  }

  const result = login(username, String(body.password || ""), String(body.code || ""));
  const replayed = result.ok && result.totpStep !== undefined && !(await claimTotpStep(result.session.username, result.totpStep).catch(() => false));
  if (!result.ok || replayed) {
    // A missing code is a prompt, not a failed attempt.
    const promptOnly = !result.ok && result.needsCode && !body.code;
    if (!promptOnly) {
      await recordFailure(username, ip).catch(() => {});
      audit({ username, role: "unknown" }, "login_failed", { type: "session" }).catch(() => {});
    }
    const error = replayed ? "That code was already used. Wait for the next code." : result.ok ? "" : result.error;
    return NextResponse.json({ error, needsCode: replayed || (!result.ok && (result.needsCode ?? false)) }, { status: 401 });
  }

  await clearFailures(username, ip).catch(() => {});
  audit(result.session, "login", { type: "session" }).catch(() => {});
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, createToken(result.session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
