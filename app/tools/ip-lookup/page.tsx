"use client";

import { useState } from "react";
import { PageShell } from "@/components/PageShell";

interface IpLookupResult {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  org?: string;
  timezone?: string;
  loc?: string;
  postal?: string;
  hostname?: string;
  error?: string;
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ fontSize: 12, color: "rgba(240,244,255,0.35)", textTransform: "uppercase", letterSpacing: ".7px" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500, color: "#f0f4ff", textAlign: "right", maxWidth: "65%", wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}

export default function IpLookupPage() {
  const [ip, setIp] = useState("");
  const [result, setResult] = useState<IpLookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const lookup = async () => {
    const val = ip.trim();
    if (!val) { setError("Please enter an IP address."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch(`/api/ip-lookup?ip=${encodeURIComponent(val)}`);
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult(data);
    } catch {
      setError("Request failed. Check your connection.");
    } finally { setLoading(false); }
  };

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === "Enter") lookup(); };

  const examples = ["1.1.1.1", "8.8.8.8", "208.67.222.222", "185.199.108.153"];

  return (
    <PageShell>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "64px 24px 96px" }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "2.5px", fontWeight: 600, marginBottom: 14 }}>Tool</div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(32px,5vw,52px)", fontWeight: 800, letterSpacing: "-2px", lineHeight: 1.08, marginBottom: 12 }}>
            IP Intelligence
          </h1>
          <p style={{ fontSize: 16, color: "rgba(240,244,255,0.55)", fontWeight: 300 }}>
            Look up geolocation, ASN, ISP, and network information for any IP address.
          </p>
        </div>

        {/* Input */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 22, padding: "28px 24px", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              type="text"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Enter IP address (e.g. 1.1.1.1)"
              style={{
                flex: 1, minWidth: 220, padding: "12px 16px", borderRadius: 12,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#f0f4ff", fontSize: 15, outline: "none", fontFamily: "monospace",
              }}
            />
            <button
              onClick={lookup}
              disabled={loading}
              style={{
                padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600,
                fontFamily: "'Syne', sans-serif", cursor: loading ? "not-allowed" : "pointer",
                background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", color: "#fff", border: "none",
                opacity: loading ? 0.7 : 1, transition: "opacity .2s",
              }}
            >
              {loading ? "Looking up…" : "Lookup"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 14 }}>
            <span style={{ fontSize: 11, color: "rgba(240,244,255,0.28)", alignSelf: "center" }}>Examples:</span>
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => setIp(ex)}
                style={{
                  padding: "3px 10px", borderRadius: 8, fontSize: 12, cursor: "pointer",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(240,244,255,0.5)", fontFamily: "monospace", transition: "all .2s",
                }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", color: "#fca5a5", fontSize: 14, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div>
            {/* IP hero */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.13)", borderRadius: 22, padding: "32px 24px", marginBottom: 16, textAlign: "center", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -1, left: "20%", right: "20%", height: 1, background: "linear-gradient(90deg,transparent,#3b82f6,#8b5cf6,transparent)" }} />
              <div style={{ fontSize: 11, color: "rgba(240,244,255,0.28)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>IP Address</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(24px,4vw,40px)", fontWeight: 800, letterSpacing: "-1px", background: "linear-gradient(135deg,#3b82f6,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 8 }}>
                {result.ip}
              </div>
              {result.city && result.country && (
                <div style={{ fontSize: 15, color: "rgba(240,244,255,0.55)" }}>
                  {result.city}, {result.region ? result.region + ", " : ""}{result.country}
                </div>
              )}
            </div>

            {/* Details */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 22, padding: "8px 24px" }}>
              <Row label="Hostname" value={result.hostname} />
              <Row label="Organization / ISP" value={result.org} />
              <Row label="Country" value={result.country} />
              <Row label="Region" value={result.region} />
              <Row label="City" value={result.city} />
              <Row label="Postal Code" value={result.postal} />
              <Row label="Coordinates" value={result.loc} />
              <Row label="Timezone" value={result.timezone} />
            </div>

            {/* Map link */}
            {result.loc && (
              <div style={{ marginTop: 16, textAlign: "center" }}>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${result.loc.split(",")[0]}&mlon=${result.loc.split(",")[1]}&zoom=10`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 13, color: "#3b82f6", textDecoration: "none" }}
                >
                  View on map →
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
