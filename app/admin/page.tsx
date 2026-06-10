"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { blogPosts } from "@/lib/blog-data";

interface AdminStats {
  kpi: { totalTests: number; avgDownload: number; avgUpload: number; avgPing: number };
  timeSeries: Array<{ date: string; tests: number; avgDownload: number; avgUpload: number }>;
  recentTests: Array<{ id: string; ip: string; download: number; upload: number; ping: number; timestamp: string }>;
}

type Tab = "overview" | "posts" | "pages" | "seo";

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: "22px 20px" }}>
      <div style={{ fontSize: 11, color: "rgba(240,244,255,0.35)", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, letterSpacing: "-1.5px", color, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: "rgba(240,244,255,0.28)" }}>{sub}</div>
    </div>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin")
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "posts", label: "Blog Posts" },
    { id: "pages", label: "Pages" },
    { id: "seo", label: "SEO" },
  ];

  const filteredPosts = blogPosts.filter(
    (p) => !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())
  );

  const allPages = [
    { path: "/", title: "Home — Speed Test", status: "Published" },
    { path: "/about", title: "About", status: "Published" },
    { path: "/blog", title: "Blog Index", status: "Published" },
    { path: "/privacy", title: "Privacy Policy", status: "Published" },
    { path: "/terms", title: "Terms of Service", status: "Published" },
    { path: "/tools", title: "Tools Index", status: "Published" },
    { path: "/tools/my-ip", title: "What's My IP", status: "Published" },
    { path: "/tools/ping-test", title: "Ping Test", status: "Published" },
    { path: "/tools/dns-lookup", title: "DNS Lookup", status: "Published" },
    { path: "/tools/ip-lookup", title: "IP Intelligence", status: "Published" },
    { path: "/admin", title: "Admin Dashboard", status: "Protected" },
  ];

  return (
    <PageShell>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "48px 24px 96px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: "-1px", marginBottom: 4 }}>Admin Dashboard</h1>
            <p style={{ fontSize: 13, color: "rgba(240,244,255,0.35)" }}>SpeedConnect.ai management interface</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", padding: "6px 14px", borderRadius: 100 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", display: "inline-block", animation: "blink 2s infinite" }} />
            All systems operational
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 32, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 4, width: "fit-content" }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 500,
                cursor: "pointer", border: "none", transition: "all .2s",
                background: tab === t.id ? "rgba(59,130,246,0.15)" : "transparent",
                color: tab === t.id ? "#3b82f6" : "rgba(240,244,255,0.55)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <div>
            {loading ? (
              <div style={{ color: "rgba(240,244,255,0.28)", fontSize: 14, padding: "32px 0" }}>Loading statistics…</div>
            ) : stats ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }} className="kpi-grid">
                  <KpiCard label="Total Tests" value={stats.kpi.totalTests.toLocaleString()} sub="All time" color="#3b82f6" />
                  <KpiCard label="Avg Download" value={stats.kpi.avgDownload + " Mbps"} sub="Last 30 days" color="#06b6d4" />
                  <KpiCard label="Avg Upload" value={stats.kpi.avgUpload + " Mbps"} sub="Last 30 days" color="#8b5cf6" />
                  <KpiCard label="Avg Ping" value={stats.kpi.avgPing + "ms"} sub="Last 30 days" color="#10b981" />
                </div>

                {/* Sparkline chart */}
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: "24px", marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(240,244,255,0.55)", marginBottom: 16 }}>Daily tests — last 30 days</div>
                  <div style={{ height: 80, display: "flex", alignItems: "flex-end", gap: 3 }}>
                    {stats.timeSeries.map((d, i) => {
                      const max = Math.max(...stats.timeSeries.map((x) => x.tests));
                      const h = Math.max(4, (d.tests / max) * 72);
                      return (
                        <div
                          key={i}
                          title={`${d.date}: ${d.tests.toLocaleString()} tests`}
                          style={{ flex: 1, borderRadius: "3px 3px 0 0", height: h, background: "linear-gradient(180deg,#3b82f6,rgba(59,130,246,0.3))", transition: "height .3s", cursor: "default" }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Recent tests */}
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 13, fontWeight: 600, color: "rgba(240,244,255,0.55)" }}>Recent tests</div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ fontSize: 11, color: "rgba(240,244,255,0.28)", textTransform: "uppercase", letterSpacing: ".6px" }}>
                          {["IP", "Download", "Upload", "Ping", "Time"].map((h) => (
                            <td key={h} style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{h}</td>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentTests.map((t) => (
                          <tr key={t.id} style={{ fontSize: 13, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                            <td style={{ padding: "11px 16px", fontFamily: "monospace", color: "rgba(240,244,255,0.55)" }}>{t.ip}</td>
                            <td style={{ padding: "11px 16px", color: "#3b82f6", fontWeight: 600 }}>{t.download} Mbps</td>
                            <td style={{ padding: "11px 16px", color: "#8b5cf6", fontWeight: 600 }}>{t.upload} Mbps</td>
                            <td style={{ padding: "11px 16px", color: "#10b981" }}>{t.ping}ms</td>
                            <td style={{ padding: "11px 16px", color: "rgba(240,244,255,0.35)", fontSize: 12 }}>{new Date(t.timestamp).toLocaleTimeString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* POSTS TAB */}
        {tab === "posts" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Search posts…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0f4ff", fontSize: 14, outline: "none", minWidth: 200 }}
              />
              <div style={{ fontSize: 13, color: "rgba(240,244,255,0.35)" }}>{filteredPosts.length} posts</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, overflow: "hidden" }}>
              {filteredPosts.map((post, i) => (
                <div
                  key={post.slug}
                  style={{ padding: "16px 20px", borderBottom: i < filteredPosts.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}
                >
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>{post.title}</div>
                    <div style={{ fontSize: 12, color: "rgba(240,244,255,0.35)" }}>{post.category} · {post.readingTime} min · {post.date}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["Edit", "Preview", "Delete"].map((action) => (
                      <button
                        key={action}
                        style={{
                          padding: "5px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer",
                          background: action === "Delete" ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.05)",
                          border: `1px solid ${action === "Delete" ? "rgba(239,68,68,0.18)" : "rgba(255,255,255,0.08)"}`,
                          color: action === "Delete" ? "#f87171" : "rgba(240,244,255,0.55)", transition: "all .2s",
                        }}
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PAGES TAB */}
        {tab === "pages" && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, overflow: "hidden" }}>
            {allPages.map((page, i) => (
              <div
                key={page.path}
                style={{ padding: "14px 20px", borderBottom: i < allPages.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 3 }}>{page.title}</div>
                  <code style={{ fontSize: 12, color: "rgba(240,244,255,0.35)", fontFamily: "monospace" }}>{page.path}</code>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    padding: "3px 10px", borderRadius: 100, fontSize: 11,
                    background: page.status === "Published" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                    border: `1px solid ${page.status === "Published" ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}`,
                    color: page.status === "Published" ? "#10b981" : "#f59e0b",
                  }}>
                    {page.status}
                  </span>
                  <a href={page.path} target="_blank" rel="noopener" style={{ fontSize: 12, color: "#3b82f6", textDecoration: "none" }}>Open →</a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SEO TAB */}
        {tab === "seo" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {allPages.slice(0, 6).map((page) => (
              <div key={page.path} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <code style={{ fontSize: 13, color: "#3b82f6", fontFamily: "monospace" }}>{page.path}</code>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: "rgba(240,244,255,0.35)", marginBottom: 6 }}>META TITLE</div>
                  <input
                    defaultValue={`${page.title} — SpeedConnect.ai`}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0f4ff", fontSize: 13, outline: "none", fontFamily: "inherit" }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(240,244,255,0.35)", marginBottom: 6 }}>META DESCRIPTION</div>
                  <textarea
                    defaultValue={`Professional internet ${page.title.toLowerCase()} tool — SpeedConnect.ai`}
                    rows={2}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0f4ff", fontSize: 13, outline: "none", fontFamily: "inherit", resize: "vertical" }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        @media(max-width:768px){.kpi-grid{grid-template-columns:repeat(2,1fr)!important;}}
        @media(max-width:480px){.kpi-grid{grid-template-columns:1fr!important;}}
      `}</style>
    </PageShell>
  );
}
