import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ALLOWED = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

const UPLOAD_URL = process.env.S3_UPLOAD_URL || "https://s3upload.vogimprayerland.org/upload";
const API_KEY = process.env.S3_UPLOAD_KEY;

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!API_KEY) {
    return NextResponse.json({ error: "Upload service not configured" }, { status: 500 });
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

  // Forward to the S3-backed upload service; it compresses, makes a WebP
  // variant, and serves everything from img.vogimprayerland.org.
  const fd = new FormData();
  fd.append("file", file, file.name);

  let data: {
    publicUrl?: string;
    webpUrl?: string;
    error?: string;
  };
  try {
    const res = await fetch(UPLOAD_URL, {
      method: "POST",
      headers: { "x-api-key": API_KEY },
      body: fd,
    });
    data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error || "Upload failed" },
        { status: 502 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Upload service unreachable" }, { status: 502 });
  }

  // Prefer the smaller WebP variant; fall back to the original-format URL.
  const url = data.webpUrl || data.publicUrl;
  if (!url) {
    return NextResponse.json({ error: "Upload failed" }, { status: 502 });
  }

  // TinyMCE expects { location }; we also return url for the featured-image picker.
  return NextResponse.json({ location: url, url });
}
