import { createHash } from "crypto";

/**
 * care_refresh_v1 release stage, set with CARE_REFRESH_V1:
 *   off   - everything uses the previous behaviour (rollback)
 *   staff - signed-in staff only
 *   10|50|100 - staff plus that percentage of visitors, bucketed by a stable id
 * Unset means off, so a deploy without the variable rolls back automatically.
 */
export function careRefreshStage(): "off" | "staff" | number {
  const raw = (process.env.CARE_REFRESH_V1 || "off").trim().toLowerCase();
  if (raw === "staff") return "staff";
  const pct = Number(raw);
  return Number.isFinite(pct) && pct > 0 ? Math.min(100, pct) : "off";
}

export function careRefreshOn({ staff = false, bucketId = "" }: { staff?: boolean; bucketId?: string } = {}) {
  const stage = careRefreshStage();
  if (stage === "off") return false;
  if (staff) return true;
  if (stage === "staff" || !bucketId) return false;
  const bucket = parseInt(createHash("sha256").update(`care_refresh_v1:${bucketId}`).digest("hex").slice(0, 8), 16) % 100;
  return bucket < stage;
}
