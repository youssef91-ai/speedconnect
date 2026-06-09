import { NextRequest, NextResponse } from "next/server";
import { blogPosts } from "@/lib/blog-data";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const slug = searchParams.get("slug");

  if (slug) {
    const post = blogPosts.find((p) => p.slug === slug);
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(post);
  }

  const posts = category && category !== "all"
    ? blogPosts.filter((p) => p.category === category)
    : blogPosts;

  return NextResponse.json({ posts, total: posts.length });
}
