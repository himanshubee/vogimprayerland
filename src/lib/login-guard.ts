import { createHash } from "crypto";
import { getDb } from "@/lib/mongodb";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;

const key = (...parts: string[]) => createHash("sha256").update(parts.join("|")).digest("hex");

type GuardDoc = { _id: string; fails: number; expiresAt: Date };

/** Five failed sign-ins for one username from one address locks that pair for 15 minutes. */
export async function isLockedOut(username: string, ip: string) {
  const db = await getDb();
  const doc = await db.collection<GuardDoc>("login_guard").findOne({ _id: key(username.toLowerCase(), ip) });
  return Boolean(doc && doc.fails >= MAX_FAILS && doc.expiresAt > new Date());
}

export async function recordFailure(username: string, ip: string) {
  const db = await getDb();
  const collection = db.collection<GuardDoc>("login_guard");
  await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch(() => {});
  await collection.updateOne(
    { _id: key(username.toLowerCase(), ip) },
    { $inc: { fails: 1 }, $set: { expiresAt: new Date(Date.now() + WINDOW_MS) } },
    { upsert: true }
  );
}

export async function clearFailures(username: string, ip: string) {
  const db = await getDb();
  await db.collection<GuardDoc>("login_guard").deleteOne({ _id: key(username.toLowerCase(), ip) });
}

/** A TOTP code works once. Returns false if this user already used this time step. */
export async function claimTotpStep(username: string, step: number) {
  const db = await getDb();
  const collection = db.collection<{ _id: string; expiresAt: Date }>("totp_used");
  await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch(() => {});
  try {
    await collection.insertOne({ _id: `${username}:${step}`, expiresAt: new Date(Date.now() + 5 * 60 * 1000) });
    return true;
  } catch {
    return false;
  }
}

/** Signed-out tokens are refused until they would have expired anyway. */
export async function revokeToken(token: string, exp: number) {
  const db = await getDb();
  const collection = db.collection<{ _id: string; expiresAt: Date }>("revoked_sessions");
  await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch(() => {});
  await collection.updateOne({ _id: key(token) }, { $set: { expiresAt: new Date(exp) } }, { upsert: true });
}

export async function isRevoked(token: string) {
  const db = await getDb();
  return (await db.collection<{ _id: string }>("revoked_sessions").countDocuments({ _id: key(token) }, { limit: 1 })) > 0;
}
