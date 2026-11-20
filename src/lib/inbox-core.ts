// Framework-free inbox logic, testable under plain Node.
import type { Document } from "mongodb";

export const REPLY_TARGET_MS = 24 * 60 * 60 * 1000;

export type InboxSummary = {
  id: string;
  intent: string;
  status: string;
  createdAt: string;
  firstRepliedAt: string | null;
  assignedTo: string | null;
  urgent: boolean;
  displayName: string;
};

const iso = (v: unknown) => (v ? (v instanceof Date ? v : new Date(v as string)).toISOString() : null);

/** List rows carry no request text, contact details or health information. */
export function toSummary(doc: Document): InboxSummary {
  const name = String(doc.fields?.name || "").trim();
  return {
    id: String(doc._id),
    intent: doc.intent ?? "Request",
    status: doc.status === "done" ? "closed" : doc.status ?? "new",
    createdAt: iso(doc.createdAt) ?? new Date(0).toISOString(),
    firstRepliedAt: iso(doc.firstRepliedAt),
    assignedTo: doc.assignedTo ?? null,
    urgent: Boolean(doc.urgent),
    displayName: name ? name.split(/\s+/)[0] : "Anonymous",
  };
}

/** Share of the last seven days' requests answered within 24 hours (V8). Requests still inside their first 24 hours are left out. */
export function replyStats(items: InboxSummary[], now = Date.now()) {
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  let due = 0;
  let onTime = 0;
  for (const item of items) {
    const created = Date.parse(item.createdAt);
    if (created < weekAgo) continue;
    const replied = item.firstRepliedAt ? Date.parse(item.firstRepliedAt) : null;
    if (!replied && now - created < REPLY_TARGET_MS) continue;
    due += 1;
    if (replied && replied - created <= REPLY_TARGET_MS) onTime += 1;
  }
  return { due, onTime };
}
