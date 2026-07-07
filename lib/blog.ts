import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  excerpt: string;        // alias for description (backwards compat)
  category: string;
  date: string;
  author: string;
  image?: string;
  featured: boolean;
  readingTime: number;
  tags: string[];
  content: string;        // raw markdown body
}

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function readPost(filename: string): BlogPost {
  const filePath = path.join(BLOG_DIR, filename);
  const raw      = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug:        data.slug        ?? filename.replace(/\.md$/, ""),
    title:       data.title       ?? "Untitled",
    description: data.description ?? "",
    excerpt:     data.description ?? "",   // backwards compat with existing UI
    category:    data.category    ?? "general",
    date:        data.date        ? String(data.date) : "2026-01-01",
    author:      data.author      ?? "SpeedConnect Team",
    image:       data.image,
    featured:    Boolean(data.featured),
    readingTime: Number(data.readingTime ?? 5),
    tags:        Array.isArray(data.tags) ? data.tags : [],
    content,
  };
}

// ── All posts: featured first, then newest first ─────────────────────────────
export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"));

  const posts = files.map(readPost);

  return posts.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return  1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return getAllPosts().map((p) => p.slug);
}

// ── Unique categories derived from posts ────────────────────────────────────
export function getCategories(): Array<{ id: string; label: string }> {
  const posts   = getAllPosts();
  const seen    = new Set<string>();
  const result  = [{ id: "all", label: "All Posts" }];

  const labelMap: Record<string, string> = {
    guides:     "Guides",
    technology: "Technology",
    tips:       "Tips & Tricks",
    reviews:    "Reviews",
    news:       "News",
    general:    "General",
  };

  posts.forEach((p) => {
    if (!seen.has(p.category)) {
      seen.add(p.category);
      result.push({
        id:    p.category,
        label: labelMap[p.category] ?? p.category.charAt(0).toUpperCase() + p.category.slice(1),
      });
    }
  });

  return result;
}

// ── Related posts: same category, excluding self ─────────────────────────────
export function getRelatedPosts(slug: string, limit = 3): BlogPost[] {
  const all  = getAllPosts();
  const post = all.find((p) => p.slug === slug);
  if (!post) return [];
  return all
    .filter((p) => p.slug !== slug && p.category === post.category)
    .slice(0, limit);
}
