import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getAllPostsAdmin, createPost, type PostInput } from "@/lib/posts";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const posts = await getAllPostsAdmin();
    return NextResponse.json({ posts });
  } catch (err) {
    console.error("[posts] list error:", err);
    return NextResponse.json({ error: "Could not load posts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: PostInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.title || !body.title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  try {
    const post = await createPost(body);
    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    console.error("[posts] create error:", err);
    return NextResponse.json({ error: "Could not create post" }, { status: 500 });
  }
}
