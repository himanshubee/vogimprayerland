import { ObjectId, type Db } from "mongodb";
import { getDb } from "@/lib/mongodb";

/* ----------------------------- Types ----------------------------- */

export type Stage = { key: string; label: string; color: string };

export const DEFAULT_STAGES: Stage[] = [
  { key: "new", label: "New", color: "#D4A437" },
  { key: "contacted", label: "Contacted", color: "#3B82F6" },
  { key: "praying", label: "Praying", color: "#8B5CF6" },
  { key: "followup", label: "Follow-up", color: "#F59E0B" },
  { key: "closed", label: "Closed", color: "#16A34A" },
];

export type EventType =
  | "note"
  | "call"
  | "email"
  | "whatsapp"
  | "stage"
  | "submission"
  | "system";

export type CrmEvent = {
  id: string;
  contactId: string;
  type: EventType;
  body: string;
  meta: Record<string, string>;
  createdAt: string;
};

export type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  stage: string;
  tags: string[];
  submissionIds: string[];
  intents: string[];
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
};

const CONTACTS = "contacts";
const EVENTS = "crm_events";
const SETTINGS = "settings";
const CRM_CONFIG_ID = "crm";

/* --------------------------- Utilities --------------------------- */

const digits = (v: unknown) => String(v ?? "").replace(/[^\d]/g, "");
const lower = (v: unknown) => String(v ?? "").trim().toLowerCase();
const str = (v: unknown, max = 500) => String(v ?? "").slice(0, max).trim();
const toISO = (v: Date | string | undefined) =>
  (v instanceof Date ? v : new Date(v ?? 0)).toISOString();

type ContactDoc = {
  _id: ObjectId;
  name?: string;
  email?: string;
  phone?: string;
  country?: string;
  stage?: string;
  tags?: string[];
  submissionIds?: string[];
  intents?: string[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
  lastActivityAt?: Date | string;
};

function serialize(d: ContactDoc): Contact {
  return {
    id: String(d._id),
    name: d.name ?? "",
    email: d.email ?? "",
    phone: d.phone ?? "",
    country: d.country ?? "",
    stage: d.stage ?? "new",
    tags: d.tags ?? [],
    submissionIds: d.submissionIds ?? [],
    intents: d.intents ?? [],
    createdAt: toISO(d.createdAt),
    updatedAt: toISO(d.updatedAt),
    lastActivityAt: toISO(d.lastActivityAt ?? d.updatedAt ?? d.createdAt),
  };
}

/* ------------------------- Pipeline stages ------------------------ */

type CrmConfigDoc = { _id: string; stages?: Stage[] };

export async function getStages(): Promise<Stage[]> {
  try {
    const db = await getDb();
    const doc = await db
      .collection<CrmConfigDoc>(SETTINGS)
      .findOne({ _id: CRM_CONFIG_ID });
    return doc?.stages?.length ? doc.stages : DEFAULT_STAGES;
  } catch {
    return DEFAULT_STAGES;
  }
}

export async function updateStages(input: unknown): Promise<Stage[]> {
  const stages: Stage[] = (Array.isArray(input) ? input : [])
    .map((s) => {
      const o = (s ?? {}) as Record<string, unknown>;
      const label = str(o.label, 60);
      const key = str(o.key, 40).toLowerCase().replace(/[^a-z0-9]+/g, "-") || lower(label).replace(/[^a-z0-9]+/g, "-");
      return { key, label, color: str(o.color, 20) || "#94a3b8" };
    })
    .filter((s) => s.key && s.label)
    .slice(0, 12);
  const final = stages.length ? stages : DEFAULT_STAGES;
  const db = await getDb();
  await db
    .collection<CrmConfigDoc>(SETTINGS)
    .updateOne({ _id: CRM_CONFIG_ID }, { $set: { stages: final } }, { upsert: true });
  return final;
}

/* ---------------------------- Events ----------------------------- */

export async function getTimeline(contactId: string): Promise<CrmEvent[]> {
  if (!ObjectId.isValid(contactId)) return [];
  const db = await getDb();
  const docs = await db
    .collection(EVENTS)
    .find({ contactId })
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray();
  return docs.map((d) => ({
    id: String(d._id),
    contactId: d.contactId,
    type: (d.type ?? "note") as EventType,
    body: d.body ?? "",
    meta: d.meta ?? {},
    createdAt: toISO(d.createdAt),
  }));
}

async function logEvent(
  db: Db,
  contactId: string,
  type: EventType,
  body: string,
  meta: Record<string, string> = {},
  when: Date = new Date()
) {
  await db.collection(EVENTS).insertOne({ contactId, type, body, meta, createdAt: when });
  await db
    .collection(CONTACTS)
    .updateOne(
      { _id: new ObjectId(contactId) },
      { $set: { lastActivityAt: when, updatedAt: new Date() } }
    );
}

/** Public: add a manual timeline entry (note / call / whatsapp log). */
export async function addEvent(
  contactId: string,
  type: EventType,
  body: string,
  meta: Record<string, string> = {}
): Promise<CrmEvent | null> {
  if (!ObjectId.isValid(contactId)) return null;
  const db = await getDb();
  const when = new Date();
  const doc = { contactId, type, body: str(body, 5000), meta, createdAt: when };
  const res = await db.collection(EVENTS).insertOne(doc);
  await db
    .collection(CONTACTS)
    .updateOne(
      { _id: new ObjectId(contactId) },
      { $set: { lastActivityAt: when, updatedAt: new Date() } }
    );
  return {
    id: String(res.insertedId),
    contactId,
    type,
    body: doc.body,
    meta,
    createdAt: toISO(when),
  };
}

/* --------------------------- Contacts ---------------------------- */

export async function listContacts(): Promise<Contact[]> {
  const db = await getDb();
  const docs = await db
    .collection<ContactDoc>(CONTACTS)
    .find({})
    .sort({ lastActivityAt: -1 })
    .limit(1000)
    .toArray();
  return docs.map(serialize);
}

export async function getContact(id: string): Promise<Contact | null> {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const doc = await db.collection<ContactDoc>(CONTACTS).findOne({ _id: new ObjectId(id) });
  return doc ? serialize(doc) : null;
}

type ContactPatch = {
  name?: string;
  email?: string;
  phone?: string;
  country?: string;
  stage?: string;
  tags?: string[];
};

export async function updateContact(
  id: string,
  patch: ContactPatch
): Promise<Contact | null> {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const existing = await db
    .collection<ContactDoc>(CONTACTS)
    .findOne({ _id: new ObjectId(id) });
  if (!existing) return null;

  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.name !== undefined) set.name = str(patch.name, 200);
  if (patch.email !== undefined) set.email = lower(patch.email).slice(0, 200);
  if (patch.phone !== undefined) set.phone = str(patch.phone, 60);
  if (patch.country !== undefined) set.country = str(patch.country, 120);
  if (Array.isArray(patch.tags))
    set.tags = patch.tags.map((t) => str(t, 40)).filter(Boolean).slice(0, 20);

  const stageChanged =
    patch.stage !== undefined && patch.stage !== existing.stage;
  if (patch.stage !== undefined) set.stage = str(patch.stage, 40);

  await db.collection(CONTACTS).updateOne({ _id: new ObjectId(id) }, { $set: set });

  if (stageChanged) {
    await logEvent(db, id, "stage", `Stage changed to “${set.stage}”.`, {
      from: existing.stage ?? "new",
      to: String(set.stage),
    });
  }

  return getContact(id);
}

export async function deleteContact(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const db = await getDb();
  await db.collection(EVENTS).deleteMany({ contactId: id });
  const res = await db.collection(CONTACTS).deleteOne({ _id: new ObjectId(id) });
  return res.deletedCount === 1;
}

/* ------------------- Submission → Contact linking ------------------ */

export type SubmissionLike = {
  id: string;
  intent: string;
  fields: Record<string, string>;
  createdAt: Date;
};

/**
 * Find-or-create the contact for a submission (deduped by email, then phone),
 * link the submission, and drop a "submission" event on the timeline.
 * Best-effort and idempotent w.r.t. the submission id.
 */
export async function linkSubmissionToContact(
  sub: SubmissionLike,
  dbArg?: Db
): Promise<string | null> {
  const db = dbArg ?? (await getDb());
  const contacts = db.collection<ContactDoc>(CONTACTS);

  const email = lower(sub.fields.email);
  const phone = digits(sub.fields.phone);
  const name = str(sub.fields.name, 200);
  const country = str(sub.fields.country, 120);

  // Already linked? Don't double-process.
  const linked = await contacts.findOne({ submissionIds: sub.id });
  if (linked) return String(linked._id);

  // Dedup match.
  const or: Record<string, unknown>[] = [];
  if (email) or.push({ email });
  if (phone) or.push({ phone });
  const existing = or.length ? await contacts.findOne({ $or: or }) : null;

  const preview =
    str(sub.fields.request || sub.fields.message || sub.fields.subject || "", 140) ||
    sub.intent;

  if (existing) {
    const id = String(existing._id);
    await contacts.updateOne(
      { _id: existing._id },
      {
        $set: {
          name: existing.name || name,
          email: existing.email || email,
          phone: existing.phone || phone,
          country: existing.country || country,
          lastActivityAt: sub.createdAt,
          updatedAt: new Date(),
        },
        $addToSet: { submissionIds: sub.id, intents: sub.intent },
      }
    );
    await db
      .collection(EVENTS)
      .insertOne({
        contactId: id,
        type: "submission",
        body: `${sub.intent}: ${preview}`,
        meta: { submissionId: sub.id, intent: sub.intent },
        createdAt: sub.createdAt,
      });
    return id;
  }

  // New contact.
  const now = new Date();
  const res = await contacts.insertOne({
    _id: new ObjectId(),
    name,
    email,
    phone,
    country,
    stage: "new",
    tags: [],
    submissionIds: [sub.id],
    intents: [sub.intent],
    createdAt: sub.createdAt,
    updatedAt: now,
    lastActivityAt: sub.createdAt,
  });
  const id = String(res.insertedId);
  await db.collection(EVENTS).insertOne({
    contactId: id,
    type: "submission",
    body: `${sub.intent}: ${preview}`,
    meta: { submissionId: sub.id, intent: sub.intent },
    createdAt: sub.createdAt,
  });
  return id;
}

/** Rebuild contacts from every existing submission. Idempotent. */
export async function syncContactsFromSubmissions(): Promise<{
  processed: number;
  linked: number;
}> {
  const db = await getDb();
  const subs = await db
    .collection("submissions")
    .find({})
    .sort({ createdAt: 1 })
    .limit(5000)
    .toArray();

  let linked = 0;
  for (const s of subs) {
    const id = await linkSubmissionToContact(
      {
        id: String(s._id),
        intent: s.intent ?? "Request",
        fields: s.fields ?? {},
        createdAt: s.createdAt instanceof Date ? s.createdAt : new Date(s.createdAt),
      },
      db
    );
    if (id) linked += 1;
  }
  return { processed: subs.length, linked };
}
