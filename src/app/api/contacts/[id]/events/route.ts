import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { addEvent, type EventType } from "@/lib/crm";

export const dynamic = "force-dynamic";

const MANUAL_TYPES: EventType[] = ["note", "call", "whatsapp"];

// POST — admin: add a manual timeline entry (note / call / whatsapp log).
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const type = body?.type as EventType;
  const text = String(body?.body ?? "").trim();

  if (!MANUAL_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
  }
  if (!text) {
    return NextResponse.json({ error: "Empty entry" }, { status: 400 });
  }

  const event = await addEvent(id, type, text);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, event });
}
