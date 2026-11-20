import { getDb } from "@/lib/mongodb";

export type AuditAction = "login" | "login_failed" | "logout" | "open" | "status" | "assign" | "flag" | "export" | "delete" | "retention";

/** Records who did what to which record. Never stores request content. */
export async function audit(session: { username: string; role: string }, action: AuditAction, target: { type: string; id?: string; detail?: string }) {
  const db = await getDb();
  await db.collection("audit_log").insertOne({
    at: new Date(),
    username: session.username,
    role: session.role,
    action,
    targetType: target.type,
    targetId: target.id ?? null,
    detail: target.detail ?? null,
  });
}
