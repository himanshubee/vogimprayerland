import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { isAuthenticated } from "@/lib/auth";
import { slugify } from "@/lib/posts";

export const dynamic = "force-dynamic";

const ALLOWED = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 8MB)" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const now = new Date();
  const dir = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;

  const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "image";
  // unique-ish suffix from size + minutes/seconds to avoid clobbering
  const suffix = `${file.size.toString(36)}${now.getTime().toString(36).slice(-4)}`;
  const filename = `${base}-${suffix}.${EXT[file.type]}`;

  const destDir = join(process.cwd(), "public", "images", "uploads", dir);
  await mkdir(destDir, { recursive: true });
  await writeFile(join(destDir, filename), buf);

  const location = `/images/uploads/${dir}/${filename}`;
  // TinyMCE expects { location }; we also return url for the featured-image picker.
  return NextResponse.json({ location, url: location });
}
