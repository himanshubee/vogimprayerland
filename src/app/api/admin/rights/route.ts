import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireRole, type Session } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** The email travels in the POST body, never the URL, so it stays out of access and CDN logs. */
async function readBody(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  return { email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null, action: String(body.action || "") };
}

const escape = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function POST(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { email, action } = await readBody(req);
  if (!email) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (action === "export") return exportData(session, email);
  if (action === "erase") return erase(session, email);
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

/** Refund requests store the address in "contact" rather than "email". */
const personFilter = (match: object) => ({ $or: [{ "fields.email": match }, { "fields.contact": match }] });

/** Everything held about one email address, for an access or portability request. */
async function exportData(session: Session, email: string) {
  const db = await getDb();
  const match = { $regex: `^${escape(email)}$`, $options: "i" };
  const [submissions, contacts, donations, orders] = await Promise.all([
    db.collection("submissions").find(personFilter(match)).toArray(),
    db.collection("contacts").find({ email }).toArray(),
    db.collection("donations").find({ email: match }).toArray(),
    db.collection("book_orders").find({ email: match }).toArray(),
  ]);
  const contactIds = contacts.map((c) => String(c._id));
  const events = contactIds.length ? await db.collection("crm_events").find({ contactId: { $in: contactIds } }).toArray() : [];

  await audit(session, "export", { type: "rights-request", detail: `records=${submissions.length + contacts.length + donations.length + orders.length}` });
  return new NextResponse(JSON.stringify({ exportedAt: new Date().toISOString(), email, submissions, contacts, crmEvents: events, donations, bookOrders: orders }, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="data-export.json"` },
  });
}

/** Erasure: removes requests and CRM records. Giving and order records are kept for the
 *  accounting period the privacy policy states, so they are reported, not deleted. */
async function erase(session: Session, email: string) {
  const db = await getDb();
  const match = { $regex: `^${escape(email)}$`, $options: "i" };
  const contacts = await db.collection("contacts").find({ email }).project({ _id: 1 }).toArray();
  const contactIds = contacts.map((c) => String(c._id));
  const [subs, cons, events, donationsKept, ordersKept] = await Promise.all([
    db.collection("submissions").deleteMany(personFilter(match)),
    db.collection("contacts").deleteMany({ email }),
    contactIds.length ? db.collection("crm_events").deleteMany({ contactId: { $in: contactIds } }) : Promise.resolve({ deletedCount: 0 }),
    db.collection("donations").countDocuments({ email: match }),
    db.collection("book_orders").countDocuments({ email: match }),
  ]);
  const result = {
    requestsDeleted: subs.deletedCount,
    contactsDeleted: cons.deletedCount,
    timelineEntriesDeleted: events.deletedCount,
    givingRecordsKept: donationsKept,
    ordersKept,
  };
  await audit(session, "delete", { type: "rights-request", detail: JSON.stringify(result) });
  return NextResponse.json({ ok: true, ...result });
}
