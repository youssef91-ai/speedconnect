"use client";

import { useState } from "react";
import { PageShell } from "@/components/PageShell";

const RECORD_TYPES = ["A", "AAAA", "MX", "TXT", "CNAME", "NS", "PTR"];

interface DnsResult {
  domain: string;
  type: string;
  records: unknown[];
  error?: string;
}

function formatRecord(record: unknown): string {
  if (typeof record === "string") return record;
  if (Array.isArray(record)) return record.join(" ");
  if (typeof record === "object" && record !== null) return JSON.stringify(record);
  return String(record);
}

export default function DnsLookupPage() {
  const [domain, setDomain] = useState("");
  const [type, setType] = useState("A");
  const [result, setResult] = useState<DnsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const lookup = async () => {
    const d = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!d) { setError("Please enter a domain name."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch(`/api/dns-lookup?domain=${encodeURIComponent(d)}&type=${type}`);
      const data = await res.json();
      if (data.error) { setError(data.error); } else { setResult(data); }
    } catch {
      setError("Request failed. Check your connection.");
    } finally { setLoading(false); }
  };

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === "Enter") lookup(); };

  return (
    <PageShell>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "64px 24px 96px" }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "2.5px", fontWeight: 600, marginBottom: 14 }}>Tool</div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(32px,5vw,52px)", fontWeight: 800, letterSpacing: "-2px", lineHeight: 1.08, marginBottom: 12 }}>
            DNS Lookup
          </h1>
          <p style={{ fontSize: 16, color: "rgba(240,244,255,0.55)", fontWeight: 300 }}>
            Query DNS records for any domain. Verify propagation and troubleshoot misconfigurations.
          </p>
        </div>

        {/* Input */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 22, padding: "28px 24px", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={handleKey}
              placeholder="example.com"
              style={{
                flex: 1, minWidth: 200, padding: "12px 16px", borderRadius: 12,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#f0f4ff", fontSize: 15, outline: "none", fontFamily: "inherit",
              }}
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{
                padding: "12px 16px", borderRadius: 12,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#f0f4ff", fontSize: 14, cursor: "pointer", outline: "none",
              }}
            >
              {RECORD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
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

          {/* Type pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 16 }}>
            {RECORD_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                style={{
                  padding: "4px 12px", borderRadius: 100, fontSize: 12, cursor: "pointer",
                  background: type === t ? "rgba(59,130,246,0.12)" : "transparent",
                  border: `1px solid ${type === t ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.08)"}`,
                  color: type === t ? "#3b82f6" : "rgba(240,244,255,0.4)", transition: "all .2s",
                }}
              >
                {t}
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
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 22, overflow: "hidden" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>{result.domain}</span>
                <span style={{ marginLeft: 10, padding: "2px 10px", borderRadius: 100, fontSize: 11, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#3b82f6" }}>{result.type}</span>
              </div>
              <span style={{ fontSize: 12, color: "rgba(240,244,255,0.28)" }}>{result.records.length} record{result.records.length !== 1 ? "s" : ""}</span>
            </div>
            {result.records.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "rgba(240,244,255,0.28)", fontSize: 14 }}>
                No {result.type} records found for {result.domain}
              </div>
            ) : (
              result.records.map((rec, i) => (
                <div key={i} style={{ padding: "14px 24px", borderBottom: i < result.records.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", flexShrink: 0 }} />
                  <code style={{ fontFamily: "monospace", fontSize: 14, color: "#f0f4ff", wordBreak: "break-all" }}>
                    {formatRecord(rec)}
                  </code>
                </div>
              ))
            )}
          </div>
        )}

        {/* Quick lookups */}
        <div style={{ marginTop: 32 }}>
          <div style={{ fontSize: 12, color: "rgba(240,244,255,0.28)", marginBottom: 12 }}>Quick examples</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { d: "google.com", t: "A" }, { d: "github.com", t: "MX" },
              { d: "cloudflare.com", t: "NS" }, { d: "example.com", t: "TXT" },
            ].map((ex) => (
              <button
                key={ex.d + ex.t}
                onClick={() => { setDomain(ex.d); setType(ex.t); }}
                style={{
                  padding: "5px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(240,244,255,0.5)", transition: "all .2s",
                }}
              >
                {ex.d} {ex.t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
