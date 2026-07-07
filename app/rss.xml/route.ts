import { getAllPosts } from "@/lib/blog";

const SITE = "https://speedconnect.ai";

export const dynamic = "force-dynamic";

export async function GET() {
  const posts = getAllPosts();

  const items = posts.map((p) => `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${SITE}/blog/${p.slug}</link>
      <guid isPermaLink="true">${SITE}/blog/${p.slug}</guid>
      <description><![CDATA[${p.description}]]></description>
      <author>${p.author}</author>
      <category>${p.category}</category>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
    </item>`).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>SpeedConnect.ai Blog</title>
    <link>${SITE}/blog</link>
    <description>Internet speed test tips, guides, and network insights.</description>
    <language>en-us</language>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
