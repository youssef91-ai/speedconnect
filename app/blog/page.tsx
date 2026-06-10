import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { blogPosts, categories } from "@/lib/blog-data";

export const metadata: Metadata = {
  title: "Blog — SpeedConnect.ai",
  description: "Guides, tips, and deep-dives on internet speed, networking, and broadband technology.",
};

export default function BlogPage() {
  return (
    <PageShell>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "64px 24px 96px" }}>
        <div style={{ marginBottom: 56, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "2.5px", fontWeight: 600, marginBottom: 14 }}>
            Blog
          </div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(36px,5vw,60px)", fontWeight: 800, letterSpacing: "-2px", lineHeight: 1.08, marginBottom: 16 }}>
            Network knowledge hub
          </h1>
          <p style={{ fontSize: 17, color: "rgba(240,244,255,0.55)", maxWidth: 480, margin: "0 auto", fontWeight: 300 }}>
            Guides, deep-dives, and practical tips on internet speed, networking, and broadband technology.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 48 }}>
          {categories.map((c) => (
            <div
              key={c.id}
              style={{
                padding: "6px 16px", borderRadius: 100, fontSize: 13,
                background: c.id === "all" ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${c.id === "all" ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.08)"}`,
                color: c.id === "all" ? "#3b82f6" : "rgba(240,244,255,0.55)",
              }}
            >
              {c.label}
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }} className="blog-grid">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              style={{ textDecoration: "none", color: "inherit", display: "block" }}
            >
              <article
                className="hover-lift"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 22,
                  padding: "28px 24px",
                  height: "100%",
                  cursor: "pointer",
                }}
              >
                <div style={{
                  display: "inline-block", padding: "3px 10px", borderRadius: 100,
                  fontSize: 11, fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: ".6px",
                  background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
                  color: "#3b82f6", marginBottom: 14,
                }}>
                  {post.category}
                </div>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, lineHeight: 1.35, marginBottom: 10, letterSpacing: "-0.3px", color: "#f0f4ff" }}>
                  {post.title}
                </h2>
                <p style={{ fontSize: 13, color: "rgba(240,244,255,0.5)", lineHeight: 1.65, marginBottom: 20 }}>
                  {post.excerpt}
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 12, color: "rgba(240,244,255,0.28)" }}>
                    {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(240,244,255,0.28)" }}>
                    {post.readingTime} min read
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
      <style>{`
        @media(max-width:768px){.blog-grid{grid-template-columns:repeat(2,1fr)!important;}}
        @media(max-width:480px){.blog-grid{grid-template-columns:1fr!important;}}
      `}</style>
    </PageShell>
  );
}
