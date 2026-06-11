"use client";

import { useState } from "react";
import { PageShell } from "@/components/PageShell";

interface DetectionResult {
  ip: string;
  org: string;
  hostname: string;
  isVpn: boolean;
  isProxy: boolean;
  isDatacenter: boolean;
  isTor: boolean;
  confidence: "high" | "medium" | "low";
  reasons: string[];
}

const DATACENTER_KEYWORDS = [
  "amazon", "aws", "google", "microsoft", "azure", "digitalocean", "linode",
  "vultr", "cloudflare", "fastly", "akamai", "ovh", "hetzner", "leaseweb",
  "choopa", "zayo", "cogent", "hurricane electric", "he net", "quadranet",
  "psychz", "server", "hosting", "datacenter", "data center", "colocation",
  "as13335", "as15169", "as16509", "as8075",
];

const RESIDENTIAL_KEYWORDS = [
  "comcast", "xfinity", "verizon", "at&t", "spectrum", "cox", "charter",
  "centurylink", "lumen", "frontier", "windstream", "optimum", "cablevision",
  "time warner", "bright house", "mediacom", "wow!", "suddenlink",
  "orange", "sfr", "bouygues", "free", "bt ", "sky broadband", "virgin media",
  "vodafone", "deutsche telekom", "telecom italia", "telefonica",
  "rogers", "bell canada", "telus", "shaw",
];

function analyzeOrg(org: string, hostname: string): Omit<DetectionResult, "ip" | "org" | "hostname"> {
  const orgLower = (org + " " + hostname).toLowerCase();
  const reasons: string[] = [];
  let isVpn = false, isProxy = false, isDatacenter = false, isTor = false;

  // Tor exit node detection
  if (orgLower.includes("tor") || orgLower.includes("exit node") || orgLower.includes("torproject")) {
    isTor = true;
    reasons.push("ASN/hostname associated with Tor exit nodes");
  }

  // Known VPN provider names
  const vpnProviders = [
    "nordvpn", "expressvpn", "surfshark", "cyberghost", "protonvpn", "ipvanish",
    "pia", "private internet", "mullvad", "windscribe", "tunnelbear", "hidemyass",
    "vyprvpn", "strongvpn", "hotspot shield", "purevpn", "hide.me",
  ];
  if (vpnProviders.some(v => orgLower.includes(v))) {
    isVpn = true;
    reasons.push("ISP name matches known VPN provider");
  }

  // Datacenter / cloud hosting detection
  if (DATACENTER_KEYWORDS.some(k => orgLower.includes(k))) {
    isDatacenter = true;
    reasons.push("IP belongs to a datacenter or cloud hosting provider");
  }

  // Proxy keywords
  if (orgLower.includes("proxy") || orgLower.includes("anonymiz") || orgLower.includes("masked")) {
    isProxy = true;
    reasons.push("Hostname or org contains proxy-related keywords");
  }

  // Residential ISP → likely clean
  const isResidential = RESIDENTIAL_KEYWORDS.some(k => orgLower.includes(k));
  if (isResidential) {
    reasons.push("IP belongs to a residential ISP");
  }

  if (reasons.length === 0) {
    reasons.push("No strong signals detected — analysis inconclusive");
  }

  const flagCount = [isVpn, isProxy, isDatacenter, isTor].filter(Boolean).length;
  const confidence: "high" | "medium" | "low" =
    flagCount >= 2 ? "high" : flagCount === 1 ? "medium" : "low";

  return { isVpn, isProxy, isDatacenter, isTor, confidence, reasons };
}

export default function VpnDetectorPage() {
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const detect = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/ip-info");
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const analysis = analyzeOrg(data.org || "", data.hostname || "");
      setResult({
        ip: data.ip || "—",
        org: (data.org || "Unknown").replace(/^AS\d+\s+/, ""),
        hostname: data.hostname || "—",
        ...analysis,
      });
    } catch (e) {
      setError("Detection failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const flagged = result && (result.isVpn || result.isProxy || result.isDatacenter || result.isTor);
  const clean   = result && !flagged;

  return (
    <PageShell>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "64px 24px 96px" }}>
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "2.5px", fontWeight: 600, marginBottom: 14 }}>Tool</div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(32px,5vw,52px)", fontWeight: 800, letterSpacing: "-2px", lineHeight: 1.08, marginBottom: 12 }}>
            VPN Detector
          </h1>
          <p style={{ fontSize: 16, color: "rgba(240,244,255,0.55)", fontWeight: 300 }}>
            Detect whether your connection routes through a VPN, datacenter proxy, or Tor exit node.
          </p>
        </div>

        {/* CTA */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.13)", borderRadius: 22, padding: "36px 32px", marginBottom: 20, textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -1, left: "20%", right: "20%", height: 1, background: "linear-gradient(90deg,transparent,#3b82f6,#8b5cf6,transparent)" }} />
          <div style={{ fontSize: 13, color: "rgba(240,244,255,0.35)", marginBottom: 20 }}>
            This tool analyses your current IP address and ISP information to detect anonymisation layers.
          </div>
          <button
            onClick={detect}
            disabled={loading}
            style={{
              padding: "14px 36px", borderRadius: 12, fontSize: 15, fontWeight: 600,
              fontFamily: "'Syne', sans-serif",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1, transition: "transform .18s, box-shadow .18s",
            }}
            onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.02)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 36px rgba(59,130,246,0.35)"; }}}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}
          >
            {loading ? "Analysing…" : "🔍 Analyse My Connection"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", color: "#fca5a5", fontSize: 14, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div>
            {/* Verdict banner */}
            <div style={{
              borderRadius: 22, padding: "28px 28px", marginBottom: 16,
              background: flagged ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)",
              border: `1px solid ${flagged ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)"}`,
              display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
            }}>
              <div style={{ fontSize: 48 }}>{flagged ? "⚠️" : "✅"}</div>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 4, color: flagged ? "#fca5a5" : "#6ee7b7" }}>
                  {flagged ? "Anonymisation Detected" : "No VPN / Proxy Detected"}
                </div>
                <div style={{ fontSize: 14, color: "rgba(240,244,255,0.55)" }}>
                  Confidence: <span style={{ color: result.confidence === "high" ? "#ef4444" : result.confidence === "medium" ? "#f59e0b" : "#10b981", fontWeight: 600 }}>
                    {result.confidence.charAt(0).toUpperCase() + result.confidence.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* IP details */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 22, padding: "8px 24px", marginBottom: 16 }}>
              {[
                { label: "IP Address", val: result.ip },
                { label: "Organization / ISP", val: result.org },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: 12, color: "rgba(240,244,255,0.35)", textTransform: "uppercase", letterSpacing: ".7px" }}>{r.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#f0f4ff", maxWidth: "65%", textAlign: "right", wordBreak: "break-all" }}>{r.val}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0" }}>
                <span style={{ fontSize: 12, color: "rgba(240,244,255,0.35)", textTransform: "uppercase", letterSpacing: ".7px" }}>Connection Type</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: clean ? "#10b981" : "#fca5a5" }}>
                  {result.isTor ? "Tor Network" : result.isVpn ? "VPN" : result.isDatacenter ? "Datacenter / Hosting" : result.isProxy ? "Proxy" : "Residential / Direct"}
                </span>
              </div>
            </div>

            {/* Detection flags */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 16 }} className="flags-grid">
              {[
                { label: "VPN", detected: result.isVpn, icon: "🔒" },
                { label: "Proxy", detected: result.isProxy, icon: "🔀" },
                { label: "Datacenter IP", detected: result.isDatacenter, icon: "🖥️" },
                { label: "Tor Exit Node", detected: result.isTor, icon: "🧅" },
              ].map(f => (
                <div key={f.label} style={{ padding: "16px", borderRadius: 14, background: f.detected ? "rgba(239,68,68,0.07)" : "rgba(16,185,129,0.05)", border: `1px solid ${f.detected ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.15)"}`, display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 22 }}>{f.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f4ff" }}>{f.label}</div>
                    <div style={{ fontSize: 12, color: f.detected ? "#fca5a5" : "#6ee7b7", marginTop: 2 }}>
                      {f.detected ? "Detected" : "Not detected"}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reasons */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "18px 20px" }}>
              <div style={{ fontSize: 11, color: "rgba(240,244,255,0.3)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>Detection signals</div>
              {result.reasons.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(240,244,255,0.3)", marginTop: 6, flexShrink: 0 }} />
                  <div style={{ fontSize: 13, color: "rgba(240,244,255,0.55)", lineHeight: 1.6 }}>{r}</div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 12, color: "rgba(240,244,255,0.2)", textAlign: "center", marginTop: 20 }}>
              This is a heuristic analysis based on ISP and hostname data. It is not 100% accurate.
            </p>
          </div>
        )}
      </div>
      <style>{`@media(max-width:480px){.flags-grid{grid-template-columns:1fr!important;}}`}</style>
    </PageShell>
  );
}
