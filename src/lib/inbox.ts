import { ObjectId, type Document, type Filter } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { canReadIntent, type Role, type Session } from "@/lib/auth";
import { toSummary } from "@/lib/inbox-core";

export * from "@/lib/inbox-core";

export const WORKFLOW = ["new", "read", "in_prayer", "session_scheduled", "follow_up", "closed"] as const;
export type WorkflowStatus = (typeof WORKFLOW)[number];
/** Statuses the previous dashboard wrote; still accepted so a rollback keeps working. */
export const LEGACY_STATUSES = ["new", "read", "done", "archived"] as const;

/** Mongo filter for the requests a session may see. Intercessors see only what is assigned to them. */
export function visibleFilter(session: Session): Filter<Document> {
  const base: Filter<Document> = { anonymisedAt: { $exists: false } };
  if (session.role === "finance") return { ...base, intent: "Refund Request" };
  if (session.role === "intercessor") {
    return { ...base, assignedTo: session.username, intent: { $nin: ["Refund Request", "Privacy Request", "Complaint"] } };
  }
  return base;
}

export function canSee(session: Session, doc: Document) {
  if (!canReadIntent(session.role, doc.intent)) return false;
  if (session.role === "intercessor") return doc.assignedTo === session.username;
  return true;
}

export async function listInbox(session: Session) {
  const db = await getDb();
  const docs = await db.collection("submissions").find(visibleFilter(session)).sort({ createdAt: -1 }).limit(500).toArray();
  return docs.map(toSummary);
}

export async function findVisible(session: Session, id: string) {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const doc = await db.collection("submissions").findOne({ _id: new ObjectId(id) });
  return doc && !doc.anonymisedAt && canSee(session, doc) ? doc : null;
}

export function rolesThatAssign(role: Role) {
  return role === "pastor" || role === "admin";
}
