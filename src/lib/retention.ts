import { getDb } from "@/lib/mongodb";

const REQUEST_MS = 5 * 365 * 24 * 60 * 60 * 1000;
const ENQUIRY_MS = 2 * 365 * 24 * 60 * 60 * 1000;

export async function runRetention() {
  const db = await getDb();
  const now = new Date();
  const requestCutoff = new Date(now.getTime() - REQUEST_MS);
  const enquiryCutoff = new Date(now.getTime() - ENQUIRY_MS);
  const collection = db.collection("submissions");
  const requestResult = await collection.updateMany(
    { createdAt: { $lt: requestCutoff }, intent: { $ne: "General Enquiry" }, anonymisedAt: { $exists: false } },
    { $set: { fields: {}, status: "archived", anonymisedAt: now } }
  );
  const enquiryResult = await collection.updateMany(
    { createdAt: { $lt: enquiryCutoff }, intent: "General Enquiry", anonymisedAt: { $exists: false } },
    { $set: { fields: {}, status: "archived", anonymisedAt: now } }
  );
  // CRM copies follow the same clock: contacts with no activity for 5 years go, with their timelines.
  const staleContacts = await db.collection("contacts").find({ lastActivityAt: { $lt: requestCutoff } }).project({ _id: 1 }).toArray();
  const staleIds = staleContacts.map((c) => String(c._id));
  if (staleIds.length) {
    await db.collection("crm_events").deleteMany({ contactId: { $in: staleIds } });
    await db.collection("contacts").deleteMany({ _id: { $in: staleContacts.map((c) => c._id) } });
  }
  // Older timeline entries copied request text; reduce them to the request type.
  const scrubbed = await db.collection("crm_events").updateMany(
    { type: "submission", body: { $not: /: received$/ } },
    [{ $set: { body: { $concat: [{ $ifNull: ["$meta.intent", "Request"] }, ": received"] } } }]
  );
  const run = {
    runAt: now,
    requestsAnonymised: requestResult.modifiedCount,
    enquiriesAnonymised: enquiryResult.modifiedCount,
    contactsDeleted: staleIds.length,
    timelineEntriesScrubbed: scrubbed.modifiedCount,
  };
  await db.collection("retention_runs").insertOne(run);
  return run;
}
