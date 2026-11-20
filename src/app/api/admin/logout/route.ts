import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, readToken } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { revokeToken } from "@/lib/login-guard";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  const session = readToken(token);
  if (token && session) {
    await revokeToken(token, session.exp).catch(() => {});
    audit(session, "logout", { type: "session" }).catch(() => {});
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
