import { MINISTRY, SITE_URL } from "@/lib/ministry";

export const dynamic = "force-dynamic";

/** RFC 9116. Served only once the owner names a security contact (L3); a Contact field is mandatory. */
export function GET() {
  const contact = MINISTRY.publishing.securityContact.trim();
  if (!contact) return new Response("Not found", { status: 404 });
  const expires = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
  const body = [
    `Contact: ${contact.includes(":") ? contact : `mailto:${contact}`}`,
    `Expires: ${expires}`,
    "Preferred-Languages: en",
    `Canonical: ${SITE_URL}/.well-known/security.txt`,
    `Policy: ${SITE_URL}/privacy-policy/`,
    "",
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
