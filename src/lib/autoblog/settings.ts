import { getDb } from "@/lib/mongodb";

import { FREQUENCIES, DEFAULT_AUTOBLOG, type AutoblogRun, type AutoblogSettings, type Frequency } from "./settings-shared";

export { FREQUENCIES, DEFAULT_AUTOBLOG, type AutoblogRun, type AutoblogSettings, type Frequency } from "./settings-shared";

const SETTINGS = "autoblog_settings";
const RUNS = "autoblog_runs";

export async function getAutoblogSettings(): Promise<AutoblogSettings> {
  const db = await getDb();
  const doc = await db.collection(SETTINGS).findOne({ _id: "settings" as never });
  return { ...DEFAULT_AUTOBLOG, ...(doc ? normalise(doc) : {}) };
}

function normalise(input: Record<string, unknown>): Partial<AutoblogSettings> {
  const out: Partial<AutoblogSettings> = {};
  if (typeof input.enabled === "boolean") out.enabled = input.enabled;
  if (typeof input.frequency === "string" && input.frequency in FREQUENCIES) out.frequency = input.frequency as Frequency;
  if (input.postsPerRun !== undefined) out.postsPerRun = Math.min(3, Math.max(1, Math.round(Number(input.postsPerRun) || 1)));
  if (typeof input.autoPublish === "boolean") out.autoPublish = input.autoPublish;
  if (Array.isArray(input.topicQueue))
    out.topicQueue = input.topicQueue.map((t) => String(t).trim().slice(0, 200)).filter(Boolean).slice(0, 100);
  if (typeof input.lastRunAt === "string" || input.lastRunAt === null) out.lastRunAt = input.lastRunAt as string | null;
  if (input.lastRunAt instanceof Date) out.lastRunAt = input.lastRunAt.toISOString();
  return out;
}

export async function saveAutoblogSettings(input: Record<string, unknown>): Promise<AutoblogSettings> {
  const { lastRunAt: _ignored, ...editable } = normalise(input);
  void _ignored;
  const db = await getDb();
  await db.collection(SETTINGS).updateOne({ _id: "settings" as never }, { $set: editable }, { upsert: true });
  return getAutoblogSettings();
}

export async function markRun(at: Date, consumedTopics: string[]) {
  const db = await getDb();
  await db
    .collection(SETTINGS)
    .updateOne(
      { _id: "settings" as never },
      { $set: { lastRunAt: at.toISOString() }, $pull: { topicQueue: { $in: consumedTopics } } as never },
      { upsert: true }
    );
}

/** Due when the configured interval has passed, with an hour's slack so a daily cron never drifts a day late. */
export function isDue(s: AutoblogSettings, now = new Date()): boolean {
  if (!s.enabled) return false;
  if (!s.lastRunAt) return true;
  const elapsed = now.getTime() - new Date(s.lastRunAt).getTime();
  return elapsed >= FREQUENCIES[s.frequency].days * 86_400_000 - 3_600_000;
}

export async function recordRun(run: Omit<AutoblogRun, "id">) {
  const db = await getDb();
  await db.collection(RUNS).insertOne({ ...run, at: new Date(run.at) });
}

export async function listRuns(limit = 30): Promise<AutoblogRun[]> {
  const db = await getDb();
  const docs = await db.collection(RUNS).find({ hidden: { $ne: true } }).sort({ at: -1 }).limit(limit).toArray();
  return docs.map((d) => ({
    id: String(d._id),
    at: new Date(d.at).toISOString(),
    topic: String(d.topic ?? ""),
    status: d.status,
    postId: d.postId ?? null,
    slug: d.slug ?? null,
    title: d.title ?? null,
    detail: String(d.detail ?? ""),
  }));
}

/**
 * Take runs off the admin list. A run that produced an article is only
 * hidden: its record is what stops that topic being written a second time.
 * Failed runs carry nothing worth keeping and are deleted.
 */
export async function removeRuns(ids: string[]): Promise<number> {
  const { ObjectId } = await import("mongodb");
  const oids = ids.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
  if (oids.length === 0) return 0;
  const db = await getDb();
  const runs = db.collection(RUNS);
  const deleted = await runs.deleteMany({ _id: { $in: oids }, status: "failed" });
  const hidden = await runs.updateMany({ _id: { $in: oids }, status: { $ne: "failed" } }, { $set: { hidden: true } });
  return deleted.deletedCount + hidden.modifiedCount;
}

/** Delete every failed run. */
export async function clearFailedRuns(): Promise<number> {
  const db = await getDb();
  return (await db.collection(RUNS).deleteMany({ status: "failed" })).deletedCount;
}

/** Built-in topic ids already written (or deliberately skipped), so none is attempted twice. */
export async function usedTopics(): Promise<Set<string>> {
  const db = await getDb();
  const ids = await db.collection(RUNS).distinct("topic", { status: { $in: ["draft", "published", "skipped"] } });
  return new Set(ids.map(String));
}
