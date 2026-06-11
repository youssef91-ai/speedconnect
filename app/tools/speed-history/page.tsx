"use client";

import { useState, useEffect } from "react";
import { PageShell } from "@/components/PageShell";

interface TestRecord {
  id: string;
  download: number;
  upload: number;
  ping: number;
  jitter: number;
  timestamp: number;
}

const STORAGE_KEY = "sc_speed_history";

function loadHistory(): TestRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function fmt(n: number) { return n < 10 ? n.toFixed(1) : Math.round(n).toString(); }
function fmtDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " " +
         d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function SpeedHistoryPage() {
  const [records, setRecords] = useState<TestRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setRecords(loadHistory());
    setLoaded(true);
  }, []);

  const clearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
    setRecords([]);
  };

  const exportCsv = () => {
    const header = "Date,Download (Mbps),Upload (Mbps),Ping (ms),Jitter (ms)";
    const rows = records.map(r =>
      `"${fmtDate(r.timestamp)}",${fmt(r.download)},${fmt(r.upload)},${r.ping},${r.jitter}`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "speedconnect-history.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const avgDl   = records.length ? records.reduce((s, r) => s + r.download, 0) / records.length : 0;
  const avgUl   = records.length ? records.reduce((s, r) => s + r.upload,   0) / records.length : 0;
  const avgPing = records.length ? records.reduce((s, r) => s + r.ping,     0) / records.length : 0;
  const maxDl   = records.length ? Math.max(...records.map(r => r.download)) : 0;

  // Mini chart bar heights
  const recentBars = records.slice(-20);
  const barMax = maxDl || 1;

  return (
    <PageShell>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "64px 24px 96px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 48 }}>
          <div>
            <div style={{ fontSize: 11, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "2.5px", fontWeight: 600, marginBottom: 14 }}>Tool</div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, letterSpacing: "-2px", lineHeight: 1.08, marginBottom: 8 }}>
              Speed History
            </h1>
            <p style={{ fontSize: 15, color: "rgba(240,244,255,0.55)", fontWeight: 300 }}>
              Your past speed test results, stored locally in your browser.
            </p>
          </div>
          {records.length > 0 && (
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={exportCsv}
                style={{ padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)", color: "#3b82f6", transition: "all .2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(59,130,246,0.2)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(59,130,246,0.12)"; }}
              >
                ↓ Export CSV
              </button>
              <button
                onClick={clearHistory}
                style={{ padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", transition: "all .2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.15)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)"; }}
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {!loaded ? (
          <div style={{ textAlign: "center", color: "rgba(240,244,255,0.28)", padding: "48px 0" }}>Loading…</div>
        ) : records.length === 0 ? (
          /* Empty state */
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 22, padding: "64px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 10 }}>No tests recorded yet</div>
            <p style={{ fontSize: 14, color: "rgba(240,244,255,0.4)", marginBottom: 28, maxWidth: 380, margin: "0 auto 28px" }}>
              Run a speed test on the homepage and your results will appear here automatically.
            </p>
            <a
              href="/"
              style={{ display: "inline-block", padding: "12px 28px", borderRadius: 12, background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 14, textDecoration: "none" }}
            >
              ⚡ Run Speed Test
            </a>
          </div>
        ) : (
          <div>
            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }} className="history-stats">
              {[
                { label: "Avg Download", val: fmt(avgDl) + " Mbps", color: "#3b82f6" },
                { label: "Avg Upload",   val: fmt(avgUl) + " Mbps", color: "#8b5cf6" },
                { label: "Avg Ping",     val: Math.round(avgPing) + " ms", color: "#10b981" },
                { label: "Tests Run",    val: records.length.toString(), color: "rgba(240,244,255,0.7)" },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "18px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "rgba(240,244,255,0.28)", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* Mini sparkline chart */}
            {recentBars.length > 1 && (
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 22, padding: "20px 24px", marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(240,244,255,0.55)" }}>Download trend — last {recentBars.length} tests</div>
                  <div style={{ display: "flex", gap: 14 }}>
                    {[{ color: "#3b82f6", label: "Download" }, { color: "#8b5cf6", label: "Upload" }].map(l => (
                      <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(240,244,255,0.35)" }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />{l.label}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ height: 72, display: "flex", alignItems: "flex-end", gap: 4 }}>
                  {recentBars.map((r, i) => {
                    const dlH = Math.max(4, (r.download / barMax) * 64);
                    const ulH = Math.max(4, (r.upload   / barMax) * 64);
                    return (
                      <div key={r.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }} title={`${fmtDate(r.timestamp)}: ↓${fmt(r.download)} ↑${fmt(r.upload)}`}>
                        <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 64 }}>
                          <div style={{ width: 10, borderRadius: "3px 3px 0 0", height: dlH, background: "linear-gradient(180deg,#3b82f6,rgba(59,130,246,0.3))" }} />
                          <div style={{ width: 10, borderRadius: "3px 3px 0 0", height: ulH, background: "linear-gradient(180deg,#8b5cf6,rgba(139,92,246,0.3))" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Full table */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 22, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                      {["Date & Time", "Download", "Upload", "Ping", "Jitter"].map(h => (
                        <td key={h} style={{ padding: "12px 18px", fontSize: 10, color: "rgba(240,244,255,0.28)", textTransform: "uppercase", letterSpacing: ".7px", fontWeight: 600 }}>{h}</td>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...records].reverse().map((r, i) => (
                      <tr key={r.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.008)" }}>
                        <td style={{ padding: "12px 18px", fontSize: 13, color: "rgba(240,244,255,0.45)" }}>{fmtDate(r.timestamp)}</td>
                        <td style={{ padding: "12px 18px", fontSize: 14, fontWeight: 600, color: "#3b82f6" }}>{fmt(r.download)} <span style={{ fontSize: 11, color: "rgba(240,244,255,0.28)", fontWeight: 400 }}>Mbps</span></td>
                        <td style={{ padding: "12px 18px", fontSize: 14, fontWeight: 600, color: "#8b5cf6" }}>{fmt(r.upload)} <span style={{ fontSize: 11, color: "rgba(240,244,255,0.28)", fontWeight: 400 }}>Mbps</span></td>
                        <td style={{ padding: "12px 18px", fontSize: 14, fontWeight: 600, color: "#10b981" }}>{r.ping} <span style={{ fontSize: 11, color: "rgba(240,244,255,0.28)", fontWeight: 400 }}>ms</span></td>
                        <td style={{ padding: "12px 18px", fontSize: 13, color: "rgba(240,244,255,0.55)" }}>{r.jitter} <span style={{ fontSize: 11, color: "rgba(240,244,255,0.28)" }}>ms</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p style={{ fontSize: 12, color: "rgba(240,244,255,0.2)", textAlign: "center", marginTop: 20 }}>
              All data is stored locally in your browser. Nothing is sent to our servers.
            </p>
          </div>
        )}
      </div>
      <style>{`@media(max-width:640px){.history-stats{grid-template-columns:repeat(2,1fr)!important;}}`}</style>
    </PageShell>
  );
}
