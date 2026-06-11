import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Network Tools — SpeedConnect.ai",
  description: "Professional network diagnostic tools — IP lookup, ping test, DNS lookup, and more.",
};

const tools = [
  { href: "/tools/my-ip", icon: "🌐", name: "What's My IP", description: "Instantly reveal your public IPv4 and IPv6 addresses along with your geolocation, ISP, and ASN.", tags: ["IP", "Geolocation", "ISP"] },
  { href: "/tools/ping-test", icon: "📡", name: "Ping Test", description: "Measure real-time latency to global servers. Spot packet loss, routing anomalies, and network instability.", tags: ["Latency", "Jitter", "Ping"] },
  { href: "/tools/dns-lookup", icon: "🔍", name: "DNS Lookup", description: "Query A, AAAA, MX, CNAME, TXT, and NS records. Verify propagation and debug DNS misconfigurations.", tags: ["DNS", "Records", "Propagation"] },
  { href: "/tools/ip-lookup",      icon: "🗺️", name: "IP Intelligence",  description: "Deep-dive any IP address — geolocation, ASN, organization, threat intel, and reverse DNS.", tags: ["IP", "WHOIS", "ASN"] },
  { href: "/tools/vpn-detector",   icon: "🛡️", name: "VPN Detector",      description: "Detect whether your connection routes through a VPN, datacenter proxy, or Tor exit node.", tags: ["VPN", "Proxy", "Tor"] },
  { href: "/tools/speed-history",  icon: "📈", name: "Speed History",      description: "View and export all your past speed test results. Track trends over time.", tags: ["History", "Export", "Charts"] },
];

export default function ToolsPage() {
  return (
    <PageShell>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "64px 24px 96px" }}>
        <div style={{ marginBottom: 56, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "2.5px", fontWeight: 600, marginBottom: 14 }}>Tools</div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(36px,5vw,60px)", fontWeight: 800, letterSpacing: "-2px", lineHeight: 1.08, marginBottom: 16 }}>
            Network diagnostic tools
          </h1>
          <p style={{ fontSize: 17, color: "rgba(240,244,255,0.55)", maxWidth: 480, margin: "0 auto", fontWeight: 300 }}>
            Professional-grade tools for understanding, diagnosing, and monitoring your network connection.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }} className="tools-index-grid">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} style={{ textDecoration: "none", color: "inherit" }}>
              <div
                className="hover-lift"
                style={{
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 22, padding: "32px 28px", cursor: "pointer",
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 20 }}>{tool.icon}</div>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", marginBottom: 10 }}>
                  {tool.name}
                </h2>
                <p style={{ fontSize: 14, color: "rgba(240,244,255,0.55)", lineHeight: 1.65, marginBottom: 20 }}>
                  {tool.description}
                </p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, marginBottom: 20 }}>
                  {tool.tags.map((tag) => (
                    <span key={tag} style={{ padding: "3px 10px", borderRadius: 100, fontSize: 11, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(240,244,255,0.4)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#3b82f6", fontWeight: 500 }}>
                  Open tool →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <style>{`@media(max-width:640px){.tools-index-grid{grid-template-columns:1fr!important;}}`}</style>
    </PageShell>
  );
}
