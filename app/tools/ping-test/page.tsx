"use client";

import { useState, useRef, useCallback } from "react";
import { PageShell } from "@/components/PageShell";

interface PingSample {
  seq: number;
  ms: number;
  ts: number;
}

const TARGETS = [
  { label: "Cloudflare", url: "https://1.1.1.1/cdn-cgi/trace" },
  { label: "Google", url: "https://www.google.com/generate_204" },
  { label: "Cloudflare CDN", url: "https://cloudflare.com/cdn-cgi/trace" },
];

export default function PingTestPage() {
  const [running, setRunning] = useState(false);
  const [samples, setSamples] = useState<PingSample[]>([]);
  const [target, setTarget] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const seqRef = useRef(0);

  const stats = (() => {
    if (!samples.length) return null;
    const vals = samples.map((s) => s.ms);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const jitter = vals.reduce((s, v) => s + Math.abs(v - avg), 0) / vals.length;
    return { avg: Math.round(avg), min: Math.round(min), max: Math.round(max), jitter: jitter.toFixed(1), count: vals.length };
  })();

  const start = useCallback(async () => {
    if (running) {
      abortRef.current?.abort();
      setRunning(false);
      return;
    }
    setRunning(true);
    setSamples([]);
    seqRef.current = 0;
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const url = TARGETS[target].url;
    while (!ctrl.signal.aborted) {
      const seq = ++seqRef.current;
      try {
        const t0 = performance.now();
        await fetch(url + "?_=" + Math.random(), { method: "HEAD", mode: "no-cors", cache: "no-store", signal: ctrl.signal });
        const ms = Math.round(performance.now() - t0);
        setSamples((prev) => [...prev.slice(-39), { seq, ms, ts: Date.now() }]);
      } catch {
        if (ctrl.signal.aborted) break;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    setRunning(false);
  }, [running, target]);

  const maxMs = samples.length ? Math.max(...samples.map((s) => s.ms), 1) : 1;

  return (
    <PageShell>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "64px 24px 96px" }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "2.5px", fontWeight: 600, marginBottom: 14 }}>Tool</div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(32px,5vw,52px)", fontWeight: 800, letterSpacing: "-2px", lineHeight: 1.08, marginBottom: 12 }}>
            Ping Test
          </h1>
          <p style={{ fontSize: 16, color: "rgba(240,244,255,0.55)", fontWeight: 300 }}>
            Measure real-time latency to global servers. Updates every second.
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8 }}>
            {TARGETS.map((t, i) => (
              <button
                key={t.label}
                onClick={() => { if (!running) setTarget(i); }}
                style={{
                  padding: "7px 16px", borderRadius: 100, fontSize: 13, cursor: running ? "not-allowed" : "pointer",
                  background: target === i ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${target === i ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.08)"}`,
                  color: target === i ? "#3b82f6" : "rgba(240,244,255,0.55)", transition: "all .2s",
                  opacity: running && target !== i ? 0.5 : 1,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            onClick={start}
            style={{
              padding: "10px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600,
              fontFamily: "'Syne', sans-serif", cursor: "pointer", border: "none",
              background: running ? "rgba(239,68,68,0.15)" : "linear-gradient(135deg,#3b82f6,#8b5cf6)",
              color: running ? "#f87171" : "#fff", transition: "transform .18s, box-shadow .18s",
            }}
          >
            {running ? "⏹ Stop" : "▶ Start Ping"}
          </button>
        </div>

        {/* Stats row */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }} className="ping-stats">
            {[
              { label: "Average", value: stats.avg + "ms", color: "#3b82f6" },
              { label: "Min", value: stats.min + "ms", color: "#10b981" },
              { label: "Max", value: stats.max + "ms", color: "#ef4444" },
              { label: "Jitter", value: stats.jitter + "ms", color: "#f59e0b" },
            ].map((s) => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "16px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "rgba(240,244,255,0.28)", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Live graph */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 22, padding: "24px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(240,244,255,0.55)" }}>
              {running ? (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block", animation: "blink 1.5s infinite" }} />
                  Live — {TARGETS[target].label}
                </span>
              ) : samples.length ? "Results" : "Press Start to begin"}
            </div>
            {stats && <div style={{ fontSize: 12, color: "rgba(240,244,255,0.28)" }}>{stats.count} samples</div>}
          </div>

          {samples.length === 0 ? (
            <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(240,244,255,0.2)", fontSize: 13 }}>
              No data yet
            </div>
          ) : (
            <div style={{ height: 120, display: "flex", alignItems: "flex-end", gap: 3 }}>
              {samples.map((s) => {
                const h = Math.max(4, (s.ms / maxMs) * 108);
                const color = s.ms < 50 ? "#10b981" : s.ms < 100 ? "#3b82f6" : s.ms < 200 ? "#f59e0b" : "#ef4444";
                return (
                  <div key={s.seq} title={`Seq ${s.seq}: ${s.ms}ms`} style={{ flex: 1, minWidth: 4, maxWidth: 16, borderRadius: "3px 3px 0 0", height: h, background: color, opacity: 0.8, transition: "height .2s", cursor: "default" }} />
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
            {[
              { color: "#10b981", label: "< 50ms Excellent" },
              { color: "#3b82f6", label: "50–100ms Good" },
              { color: "#f59e0b", label: "100–200ms Fair" },
              { color: "#ef4444", label: "> 200ms Poor" },
            ].map((l) => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(240,244,255,0.35)" }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />{l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Recent samples table */}
        {samples.length > 0 && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 22, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 12, color: "rgba(240,244,255,0.35)", display: "grid", gridTemplateColumns: "80px 1fr 1fr", gap: 16 }}>
              <span>SEQ</span><span>LATENCY</span><span>STATUS</span>
            </div>
            {[...samples].reverse().slice(0, 8).map((s) => (
              <div key={s.seq} style={{ padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "grid", gridTemplateColumns: "80px 1fr 1fr", gap: 16, fontSize: 13 }}>
                <span style={{ color: "rgba(240,244,255,0.28)" }}>#{s.seq}</span>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, color: s.ms < 50 ? "#10b981" : s.ms < 100 ? "#3b82f6" : s.ms < 200 ? "#f59e0b" : "#ef4444" }}>{s.ms}ms</span>
                <span style={{ fontSize: 11, color: "rgba(240,244,255,0.35)" }}>{s.ms < 50 ? "Excellent" : s.ms < 100 ? "Good" : s.ms < 200 ? "Fair" : "Poor"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        @media(max-width:560px){.ping-stats{grid-template-columns:repeat(2,1fr)!important;}}
      `}</style>
    </PageShell>
  );
}
