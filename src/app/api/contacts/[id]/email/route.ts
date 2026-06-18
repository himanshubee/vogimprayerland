import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getContact, addEvent } from "@/lib/crm";
import { sendEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

// POST — admin: email the contact and log it on their timeline.
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const contact = await getContact(id);
  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!contact.email) {
    return NextResponse.json({ error: "Contact has no email address" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const subject = String(body?.subject ?? "").trim();
  const message = String(body?.message ?? "").trim();
  if (!subject || !message) {
    return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
  }

  const result = await sendEmail({ to: contact.email, subject, text: message });
  if (!result.ok) {
    return NextResponse.json({ error: result.error || "Send failed" }, { status: 502 });
  }

  const event = await addEvent(id, "email", message, { subject, to: contact.email });
  return NextResponse.json({ ok: true, event });
}
