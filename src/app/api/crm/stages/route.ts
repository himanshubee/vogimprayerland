import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getStages, updateStages } from "@/lib/crm";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ stages: await getStages() });
}

export async function PUT(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  try {
    const stages = await updateStages(body.stages);
    return NextResponse.json({ ok: true, stages });
  } catch (err) {
    console.error("[crm] stages save error:", err);
    return NextResponse.json({ error: "Could not save stages" }, { status: 500 });
  }
}
