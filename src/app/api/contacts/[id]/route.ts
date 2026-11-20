import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getContact, getTimeline, updateContact, deleteContact } from "@/lib/crm";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await requireRole("pastor", "admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const contact = await getContact(id);
  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await audit(session, "open", { type: "contact", id });
  const timeline = await getTimeline(id);
  return NextResponse.json({ contact, timeline });
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await requireRole("pastor", "admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const contact = await updateContact(id, body);
  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await audit(session, "status", { type: "contact", id, detail: `fields=${Object.keys(body).join(",").slice(0, 120)}` });
  return NextResponse.json({ ok: true, contact });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await requireRole("pastor", "admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const ok = await deleteContact(id);
  if (ok) await audit(session, "delete", { type: "contact", id });
  return NextResponse.json({ ok });
}
