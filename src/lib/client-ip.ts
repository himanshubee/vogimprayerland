import type { NextRequest } from "next/server";

/** Cloudflare sets cf-connecting-ip itself; a visitor cannot spoof it the way they can the first
 *  X-Forwarded-For entry. Fall back to the proxy's own header, then the last forwarded hop. */
export function clientIp(req: NextRequest) {
  const forwarded = (req.headers.get("x-forwarded-for") || "").split(",").map((v) => v.trim()).filter(Boolean);
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || forwarded[forwarded.length - 1] || "unknown";
}
