"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";

interface IpData {
  ip: string;
  city: string;
  region: string;
  country: string;
  org: string;
  timezone: string;
  loc: string;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <span style={{ fontSize: 13, color: "rgba(240,244,255,0.35)", textTransform: "uppercase", letterSpacing: ".7px" }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 500, color: "#f0f4ff", textAlign: "right", maxWidth: "60%" }}>{value || "—"}</span>
    </div>
  );
}

export default function MyIpPage() {
  const [data, setData] = useState<IpData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/ip-info")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const copy = () => {
    if (data?.ip) {
      navigator.clipboard.writeText(data.ip);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <PageShell>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "64px 24px 96px" }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "2.5px", fontWeight: 600, marginBottom: 14 }}>
            Tool
          </div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(32px,5vw,52px)", fontWeight: 800, letterSpacing: "-2px", lineHeight: 1.08, marginBottom: 12 }}>
            What&apos;s My IP Address?
          </h1>
          <p style={{ fontSize: 16, color: "rgba(240,244,255,0.55)", fontWeight: 300 }}>
            Your public IP address and network information, detected automatically.
          </p>
        </div>

        {/* Big IP display */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.13)",
            borderRadius: 22, padding: "40px 32px", marginBottom: 20, textAlign: "center",
            position: "relative", overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", top: -1, left: "20%", right: "20%", height: 1, background: "linear-gradient(90deg,transparent,#3b82f6,#8b5cf6,transparent)" }} />
          <div style={{ fontSize: 11, color: "rgba(240,244,255,0.28)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>
            Your public IP address
          </div>
          {loading ? (
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 42, fontWeight: 800, letterSpacing: "-1px", color: "rgba(240,244,255,0.2)" }}>
              Detecting…
            </div>
          ) : (
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px,5vw,48px)", fontWeight: 800, letterSpacing: "-1px", background: "linear-gradient(135deg,#3b82f6,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 16 }}>
              {data?.ip ?? "Unavailable"}
            </div>
          )}
          <button
            onClick={copy}
            disabled={!data?.ip}
            style={{
              padding: "8px 20px", borderRadius: 100,
              background: copied ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.1)"}`,
              color: copied ? "#10b981" : "rgba(240,244,255,0.55)", fontSize: 13,
              cursor: "pointer", transition: "all .2s",
            }}
          >
            {copied ? "✓ Copied!" : "Copy IP"}
          </button>
        </div>

        {/* Details card */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 22, padding: "8px 24px" }}>
          {loading ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: "rgba(240,244,255,0.28)", fontSize: 14 }}>
              Loading network information…
            </div>
          ) : data ? (
            <>
              <InfoRow label="City" value={data.city} />
              <InfoRow label="Region" value={data.region} />
              <InfoRow label="Country" value={data.country} />
              <InfoRow label="ISP / Organization" value={data.org} />
              <InfoRow label="Timezone" value={data.timezone} />
              <InfoRow label="Coordinates" value={data.loc} />
            </>
          ) : (
            <div style={{ padding: "32px 0", textAlign: "center", color: "rgba(240,244,255,0.35)", fontSize: 14 }}>
              Unable to retrieve network information. Check your connection.
            </div>
          )}
        </div>

        <p style={{ fontSize: 12, color: "rgba(240,244,255,0.2)", textAlign: "center", marginTop: 20 }}>
          Your IP is not stored or logged. This information is fetched in real time and displayed only to you.
        </p>
      </div>
    </PageShell>
  );
}
