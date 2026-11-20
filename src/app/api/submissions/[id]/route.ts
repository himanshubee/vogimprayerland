import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getSession, staffDirectory } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { LEGACY_STATUSES, WORKFLOW, findVisible, rolesThatAssign } from "@/lib/inbox";

export const dynamic = "force-dynamic";

const COLLECTION = "submissions";
const STATUSES: readonly string[] = [...new Set([...WORKFLOW, ...LEGACY_STATUSES])];

type Ctx = { params: Promise<{ id: string }> };

/** Opens one request. Every open is written to the audit log. */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const doc = await findVisible(session, id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await audit(session, "open", { type: "submission", id });
  return NextResponse.json({ id, intent: doc.intent, fields: doc.fields ?? {}, notes: doc.notes ?? "" });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  if (!(await findVisible(session, id))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: { status?: string; assignedTo?: string | null; urgent?: boolean; replied?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const set: Record<string, unknown> = {};
  const unset: Record<string, ""> = {};
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    set.status = body.status;
  }
  if (body.urgent !== undefined) set.urgent = Boolean(body.urgent);
  if (body.assignedTo !== undefined) {
    if (!rolesThatAssign(session.role)) return NextResponse.json({ error: "Only a pastor or admin can assign requests." }, { status: 403 });
    if (body.assignedTo === null || body.assignedTo === "") unset.assignedTo = "";
    else if (staffDirectory().some((s) => s.username === body.assignedTo)) set.assignedTo = body.assignedTo;
    else return NextResponse.json({ error: "Unknown staff member" }, { status: 400 });
  }
  if (!body.replied && !Object.keys(set).length && !Object.keys(unset).length) return NextResponse.json({ error: "Nothing to change" }, { status: 400 });

  const db = await getDb();
  const _id = new ObjectId(id);
  if (Object.keys(set).length || Object.keys(unset).length) {
    await db.collection(COLLECTION).updateOne({ _id }, { ...(Object.keys(set).length ? { $set: set } : {}), ...(Object.keys(unset).length ? { $unset: unset } : {}) });
  }
  // The first reply time is set once and never moved, so the 24-hour measure stays honest.
  if (body.replied) await db.collection(COLLECTION).updateOne({ _id, firstRepliedAt: { $exists: false } }, { $set: { firstRepliedAt: new Date() } });

  const action = body.assignedTo !== undefined ? "assign" : body.urgent !== undefined ? "flag" : "status";
  const detail = [body.status && `status=${body.status}`, body.replied && "replied", body.urgent !== undefined && `urgent=${body.urgent}`, body.assignedTo !== undefined && `assignedTo=${body.assignedTo || "none"}`].filter(Boolean).join(" ");
  await audit(session, action, { type: "submission", id, detail });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin" && session.role !== "pastor") return NextResponse.json({ error: "Only a pastor or admin can delete requests." }, { status: 403 });

  const { id } = await ctx.params;
  if (!(await findVisible(session, id))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const db = await getDb();
  await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
  // Remove the CRM's record of this request too, so deleting means deleting.
  await db.collection("crm_events").deleteMany({ "meta.submissionId": id });
  await db.collection("contacts").updateMany({ submissionIds: id }, { $pull: { submissionIds: id } } as never);
  await audit(session, "delete", { type: "submission", id });
  return NextResponse.json({ ok: true });
}
