import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { getAllPosts, getPostBySlug, getRelatedPosts, getAllSlugs } from "@/lib/blog";

interface Props { params: Promise<{ slug: string }>; }

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Not Found" };
  return {
    title: `${post.title} — SpeedConnect.ai`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      ...(post.image ? { images: [post.image] } : {}),
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.description },
  };
}

function renderMarkdown(md: string) {
  // Split into paragraphs and render basic markdown inline styles
  return md.split(/\n\n+/).map((block, i) => {
    const trimmed = block.trim();
    if (!trimmed) return null;

    // Heading
    if (trimmed.startsWith("# "))  return <h1 key={i} style={{ fontFamily:"'Syne',sans-serif", fontSize:"clamp(22px,3vw,30px)", fontWeight:800, letterSpacing:"-0.5px", margin:"32px 0 12px", color:"#f0f4ff" }}>{trimmed.slice(2)}</h1>;
    if (trimmed.startsWith("## ")) return <h2 key={i} style={{ fontFamily:"'Syne',sans-serif", fontSize:"clamp(18px,2.5vw,24px)", fontWeight:700, letterSpacing:"-0.3px", margin:"28px 0 10px", color:"#f0f4ff" }}>{trimmed.slice(3)}</h2>;
    if (trimmed.startsWith("### ")) return <h3 key={i} style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:700, margin:"24px 0 8px", color:"#f0f4ff" }}>{trimmed.slice(4)}</h3>;

    // Parse inline bold (**text**) in paragraph text
    const parts = trimmed.split(/\*\*(.+?)\*\*/g);
    return (
      <p key={i} style={{ fontSize:15, color:"rgba(240,244,255,0.68)", lineHeight:1.88, marginBottom:18 }}>
        {parts.map((part, j) =>
          j % 2 === 1
            ? <strong key={j} style={{ color:"#f0f4ff", fontWeight:600 }}>{part}</strong>
            : part
        )}
      </p>
    );
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post    = getPostBySlug(slug);
  if (!post) notFound();

  const related = getRelatedPosts(slug, 2);

  // Article structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    author: { "@type": "Person", name: post.author },
    datePublished: post.date,
    publisher: { "@type": "Organization", name: "SpeedConnect.ai" },
  };

  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "64px 24px 96px" }}>
        {/* Breadcrumb */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:32, fontSize:13, color:"rgba(240,244,255,0.35)" }}>
          <Link href="/" style={{ color:"rgba(240,244,255,0.35)", textDecoration:"none" }}>Home</Link>
          <span>›</span>
          <Link href="/blog" style={{ color:"rgba(240,244,255,0.35)", textDecoration:"none" }}>Blog</Link>
          <span>›</span>
          <span style={{ color:"rgba(240,244,255,0.55)" }}>{post.category}</span>
        </div>

        {/* Header */}
        <div style={{ marginBottom:40 }}>
          <div style={{ display:"inline-block", padding:"3px 10px", borderRadius:100, fontSize:11, fontWeight:500, textTransform:"uppercase", letterSpacing:".6px", background:"rgba(59,130,246,0.1)", border:"1px solid rgba(59,130,246,0.2)", color:"#3b82f6", marginBottom:16 }}>
            {post.category}
          </div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"clamp(28px,4vw,44px)", fontWeight:800, letterSpacing:"-1.5px", lineHeight:1.1, marginBottom:20 }}>
            {post.title}
          </h1>
          <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff" }}>
                {post.author.split(" ").map((w: string) => w[0]).join("")}
              </div>
              <span style={{ fontSize:14, color:"rgba(240,244,255,0.55)" }}>{post.author}</span>
            </div>
            <span style={{ fontSize:13, color:"rgba(240,244,255,0.28)" }}>
              {new Date(post.date).toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" })}
            </span>
            <span style={{ fontSize:13, color:"rgba(240,244,255,0.28)" }}>{post.readingTime} min read</span>
          </div>
          {post.tags.length > 0 && (
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:16 }}>
              {post.tags.map((tag: string) => (
                <span key={tag} style={{ padding:"2px 8px", borderRadius:100, fontSize:11, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(240,244,255,0.45)" }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Article body rendered from Markdown */}
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:22, padding:"36px 32px", marginBottom:32 }}>
          {renderMarkdown(post.content)}
        </div>

        {/* Related posts */}
        {related.length > 0 && (
          <div>
            <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:700, marginBottom:16, letterSpacing:"-0.3px" }}>Related articles</h3>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14 }} className="related-grid">
              {related.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`} style={{ textDecoration:"none", color:"inherit" }}>
                  <div className="hover-lift" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"20px 18px" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:600, lineHeight:1.4, marginBottom:8, color:"#f0f4ff" }}>{p.title}</div>
                    <div style={{ fontSize:12, color:"rgba(240,244,255,0.28)" }}>{p.readingTime} min read</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop:40, paddingTop:32, borderTop:"1px solid rgba(255,255,255,0.07)" }}>
          <Link href="/blog" style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:14, color:"#3b82f6", textDecoration:"none", fontWeight:500 }}>
            ← Back to Blog
          </Link>
        </div>
      </div>
      <style>{`@media(max-width:480px){.related-grid{grid-template-columns:1fr!important;}}`}</style>
    </PageShell>
  );
}
