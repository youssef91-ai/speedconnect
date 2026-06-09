import { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blog-data";

const BASE = "https://speedconnect.ai";

export default function sitemap(): MetadataRoute.Sitemap {
  const static_routes = [
    { url: BASE, changeFrequency: "daily" as const, priority: 1 },
    { url: `${BASE}/about`, changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${BASE}/terms`, changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${BASE}/blog`, changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${BASE}/tools`, changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${BASE}/tools/my-ip`, changeFrequency: "weekly" as const, priority: 0.6 },
    { url: `${BASE}/tools/ping-test`, changeFrequency: "weekly" as const, priority: 0.6 },
    { url: `${BASE}/tools/dns-lookup`, changeFrequency: "weekly" as const, priority: 0.6 },
    { url: `${BASE}/tools/ip-lookup`, changeFrequency: "weekly" as const, priority: 0.6 },
  ];

  const blog_routes = blogPosts.map((post) => ({
    url: `${BASE}/blog/${post.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
    lastModified: new Date(post.date),
  }));

  return [...static_routes, ...blog_routes];
}
