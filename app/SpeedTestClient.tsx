"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { SpeedGauge } from "@/components/SpeedGauge";
import { ResultCard } from "@/components/ResultCard";
import { ToolCard } from "@/components/ToolCard";
import { FeatureCard } from "@/components/FeatureCard";
import { TestimonialCard } from "@/components/TestimonialCard";
import { FaqSection } from "@/components/FaqSection";
import { useSpeedTest } from "@/lib/hooks/useSpeedTest";
import { getConnectionQuality, getUseCases } from "@/lib/utils";

// ─── BACKGROUND ──────────────────────────────────────────────────────────────
function Background() {
  return (
    <>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        {[
          { w: 700, h: 700, color: "#3b82f6", top: -220, left: -160, delay: 0 },
          { w: 550, h: 550, color: "#8b5cf6", top: "25%", right: -180, delay: -6 },
          { w: 450, h: 450, color: "#06b6d4", bottom: "15%", left: "15%", delay: -11 },
          { w: 380, h: 380, color: "#10b981", bottom: -80, right: "5%", delay: -3 },
        ].map((o, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: o.w, height: o.h,
              borderRadius: "50%",
              filter: "blur(110px)",
              opacity: 0.15,
              background: `radial-gradient(circle, ${o.color}, transparent 70%)`,
              top: o.top as any,
              left: o.left as any,
              right: o.right as any,
              bottom: o.bottom as any,
              animation: `drift 18s ease-in-out ${o.delay}s infinite`,
            }}
          />
        ))}
      </div>
      <div
        style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <style>{`@keyframes drift{0%,100%{transform:translate(0,0) scale(1)}30%{transform:translate(35px,-50px) scale(1.06)}65%{transform:translate(-25px,30px) scale(0.94)}}`}</style>
    </>
  );
}

// ─── PHASE TRACK ─────────────────────────────────────────────────────────────
function PhaseTrack({ phase }: { phase: string }) {
  const steps = [
    { id: "ping", label: "Ping", num: 1 },
    { id: "download", label: "Download", num: 2 },
    { id: "upload", label: "Upload", num: 3 },
  ];
  const doneMap: Record<string, string[]> = {
    download: ["ping"],
    upload: ["ping", "download"],
    done: ["ping", "download", "upload"],
  };
  const done = doneMap[phase] ?? [];

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 20 }}>
      {steps.map((step, i) => {
        const isActive = phase === step.id;
        const isDone = done.includes(step.id);
        return (
          <div key={step.id} style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 16px", borderRadius: 100,
                fontSize: 12, fontWeight: 500,
                color: isDone ? "#10b981" : isActive ? "#3b82f6" : "rgba(240,244,255,0.28)",
                background: isDone
                  ? "rgba(16,185,129,0.08)"
                  : isActive
                  ? "rgba(59,130,246,0.1)"
                  : "transparent",
                border: `1px solid ${
                  isDone
                    ? "rgba(16,185,129,0.2)"
                    : isActive
                    ? "rgba(59,130,246,0.25)"
                    : "transparent"
                }`,
                transition: "all .3s",
              }}
            >
              <div
                style={{
                  width: 18, height: 18, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700,
                  background: isDone ? "#10b981" : isActive ? "#3b82f6" : "transparent",
                  border: `1px solid ${isDone ? "#10b981" : isActive ? "#3b82f6" : "rgba(255,255,255,0.13)"}`,
                  color: isDone || isActive ? "#fff" : "rgba(240,244,255,0.28)",
                  transition: "all .3s",
                }}
              >
                {isDone ? "✓" : step.num}
              </div>
              <span>{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 24, height: 1, background: "rgba(255,255,255,0.07)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── SPARKLINE ───────────────────────────────────────────────────────────────
function Sparkline({ data }: { data: number[] }) {
  if (!data.length) return <div style={{ height: 36, marginBottom: 12 }} />;
  const max = Math.max(...data, 1);
  return (
    <div
      style={{
        display: "flex", gap: 2, alignItems: "flex-end",
        height: 36, marginBottom: 12, opacity: 0.7,
      }}
    >
      {data.map((v, i) => {
        const h = Math.max(2, (v / max) * 34);
        const alpha = 0.3 + 0.7 * (i / data.length);
        return (
          <div
            key={i}
            style={{
              flex: 1, borderRadius: "2px 2px 0 0",
              background: "linear-gradient(180deg, #3b82f6, rgba(59,130,246,0.25))",
              height: h, minHeight: 2, opacity: alpha, transition: "height .2s",
            }}
          />
        );
      })}
    </div>
  );
}

// ─── LIVE METRICS ROW ────────────────────────────────────────────────────────
function LiveMetrics({
  ping, download, upload, activePhase,
}: {
  ping: number | null; download: number | null; upload: number | null; activePhase: string;
}) {
  const cells = [
    { id: "ping", label: "Ping", value: ping, unit: "ms", lit: activePhase === "ping" || (ping !== null && activePhase !== "idle") },
    { id: "dl", label: "Download", value: download, unit: "Mbps", lit: activePhase === "download" },
    { id: "ul", label: "Upload", value: upload, unit: "Mbps", lit: activePhase === "upload" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
      {cells.map((c) => (
        <div
          key={c.id}
          style={{
            background: c.lit ? "rgba(59,130,246,0.05)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${c.lit ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.07)"}`,
            borderRadius: 14, padding: "14px 10px", textAlign: "center",
            transition: "border-color .3s, background .3s",
          }}
        >
          <div style={{ fontSize: 10, color: "rgba(240,244,255,0.28)", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 6 }}>
            {c.label}
          </div>
          <div
            style={{
              fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700,
              color: "#f0f4ff", minHeight: 28,
            }}
          >
            {c.value !== null
              ? c.id === "ping"
                ? Math.round(c.value)
                : c.value.toFixed(1)
              : "—"}
          </div>
          <div style={{ fontSize: 10, color: "rgba(240,244,255,0.28)" }}>{c.unit}</div>
        </div>
      ))}
    </div>
  );
}

// ─── HISTORY CHART ───────────────────────────────────────────────────────────
function HistoryChart({ history }: { history: Array<{ dl: number; ul: number; ts: number }> }) {
  if (!history.length) return null;
  const max = Math.max(...history.flatMap((t) => [t.dl, t.ul]), 1);
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 22, padding: "20px 22px", marginBottom: 24,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(240,244,255,0.55)" }}>Test History</div>
        <div style={{ display: "flex", gap: 14 }}>
          {[{ color: "#3b82f6", label: "Download" }, { color: "#8b5cf6", label: "Upload" }].map((l) => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(240,244,255,0.28)" }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: 72, display: "flex", alignItems: "flex-end", gap: 4 }}>
        {history.map((t, i) => {
          const dlH = Math.max(4, (t.dl / max) * 64);
          const ulH = Math.max(4, (t.ul / max) * 64);
          const time = new Date(t.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 64 }}>
                <div style={{ width: 10, borderRadius: "3px 3px 0 0", height: dlH, background: "linear-gradient(180deg,#3b82f6,rgba(59,130,246,0.3))" }} />
                <div style={{ width: 10, borderRadius: "3px 3px 0 0", height: ulH, background: "linear-gradient(180deg,#8b5cf6,rgba(139,92,246,0.3))" }} />
              </div>
              <div style={{ fontSize: 9, color: "rgba(240,244,255,0.28)", marginTop: 6 }}>{time}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── RESULTS DASHBOARD ───────────────────────────────────────────────────────
function ResultsDashboard({
  result, history,
}: {
  result: NonNullable<ReturnType<typeof useSpeedTest>["state"]["result"]>;
  history: Array<{ dl: number; ul: number; ts: number }>;
}) {
  const [ipInfo, setIpInfo] = useState<{ ip: string; loc: string; isp: string } | null>(null);
  const quality = getConnectionQuality(result.download, result.upload, result.ping, result.jitter);
  const useCases = getUseCases(result.download, result.upload, result.ping, result.jitter);

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((d) =>
        setIpInfo({
          ip: d.ip || "—",
          loc: d.city ? `${d.city}, ${d.country_code}` : "—",
          isp: (d.org || "—").replace(/^AS\d+\s+/, "").slice(0, 20),
        })
      )
      .catch(() => setIpInfo({ ip: "Private", loc: "—", isp: "—" }));
  }, []);

  return (
    <div style={{ width: "100%", maxWidth: 660, marginTop: 48 }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11, color: "#10b981",
            background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)",
            padding: "3px 10px", borderRadius: 100, marginBottom: 10,
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
          Test complete
        </div>
        <h2
          style={{
            fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800,
            letterSpacing: "-1px", marginBottom: 6, color: "#f0f4ff",
          }}
        >
          Your Speed Results
        </h2>
        <p style={{ fontSize: 13, color: "rgba(240,244,255,0.28)" }}>
          Tested {new Date(result.timestamp).toLocaleTimeString()} ·{" "}
          {new Date(result.timestamp).toLocaleDateString()}
        </p>
      </div>

      {/* Connection Banner */}
      {ipInfo && (
        <div
          style={{
            display: "grid", gridTemplateColumns: "repeat(4,1fr)",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 22, overflow: "hidden", marginBottom: 18,
          }}
          className="conn-banner"
        >
          {[
            { label: "IP Address", val: ipInfo.ip },
            { label: "Location", val: ipInfo.loc },
            { label: "Provider", val: ipInfo.isp },
            { label: "Protocol", val: "HTTPS/2" },
          ].map((c, i) => (
            <div
              key={c.label}
              style={{
                padding: "14px 16px", textAlign: "center",
                borderRight: i < 3 ? "1px solid rgba(255,255,255,0.07)" : "none",
              }}
            >
              <div style={{ fontSize: 10, color: "rgba(240,244,255,0.28)", textTransform: "uppercase", letterSpacing: ".7px", marginBottom: 5 }}>
                {c.label}
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#f0f4ff" }}>{c.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Result Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, marginBottom: 14 }} className="res-grid">
        <ResultCard type="download" value={result.download} animating />
        <ResultCard type="upload" value={result.upload} animating />
        <ResultCard type="ping" value={result.ping} animating />
        <ResultCard type="jitter" value={result.jitter} animating />
      </div>

      {/* Quality Panel */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 22, padding: "28px 24px", marginBottom: 14,
        }}
      >
        <div
          style={{
            display: "flex", alignItems: "flex-start", justifyContent: "space-between",
            marginBottom: 20, gap: 12, flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: 10, color: "rgba(240,244,255,0.28)", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 6 }}>
              Quality Score
            </div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif", fontSize: 44, fontWeight: 800,
                letterSpacing: "-2px", color: quality.color,
              }}
            >
              {quality.score}/100
            </div>
          </div>
          <div
            style={{
              padding: "8px 18px", borderRadius: 100,
              fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700,
              background: quality.bg, border: `1px solid ${quality.borderColor}`,
              color: quality.color, alignSelf: "flex-start",
            }}
          >
            {quality.label}
          </div>
        </div>
        <div style={{ fontSize: 13, color: "rgba(240,244,255,0.55)", marginBottom: 20 }}>
          {quality.description}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {useCases.map((u) => (
            <div
              key={u.label}
              style={{
                background: u.ok ? "rgba(16,185,129,0.05)" : "rgba(239,68,68,0.04)",
                border: `1px solid ${u.ok ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.2)"}`,
                borderRadius: 14, padding: "14px 10px", textAlign: "center",
                transition: "border-color .3s",
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 6 }}>{u.emoji}</div>
              <div style={{ fontSize: 11, color: "rgba(240,244,255,0.55)" }}>{u.label}</div>
              <div
                style={{
                  fontSize: 10, marginTop: 4, fontWeight: 500,
                  color: u.ok ? "#10b981" : "#f87171",
                }}
              >
                {u.ok ? "✓ Supported" : "✗ Limited"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <HistoryChart history={history} />

      {/* Re-test button */}
      <button
        style={{
          display: "block", maxWidth: 280, width: "100%",
          margin: "0 auto 12px", padding: 17, borderRadius: 14,
          background: "linear-gradient(135deg, #3b82f6, #2563eb 50%, #8b5cf6)",
          color: "#fff", fontSize: 16, fontWeight: 600,
          fontFamily: "'Syne', sans-serif", border: "none", cursor: "pointer",
          transition: "transform .18s, box-shadow .18s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.01)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 36px rgba(59,130,246,0.38)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
        }}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        ↺ Test Again
      </button>

      <style>{`
        @media(max-width:560px){.conn-banner{grid-template-columns:repeat(2,1fr)!important;}}
        @media(max-width:480px){.res-grid{grid-template-columns:1fr!important;}}
      `}</style>
    </div>
  );
}

// ─── STATS BAND ──────────────────────────────────────────────────────────────
function StatsBand() {
  const [count, setCount] = useState("12.4M");
  useEffect(() => {
    let n = 12_400_000;
    const id = setInterval(() => {
      n += Math.floor(Math.random() * 4) + 1;
      setCount((n / 1e6).toFixed(1) + "M");
    }, 1800);
    return () => clearInterval(id);
  }, []);

  const stats = [
    { n: count, l: "Tests run today" },
    { n: "185+", l: "Countries covered" },
    { n: "99.97%", l: "Uptime guarantee" },
    { n: "<3s", l: "Avg test time" },
  ];

  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "44px 0", margin: "80px 0" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)" }} className="stats-grid">
        {stats.map((s, i) => (
          <div
            key={i}
            style={{
              textAlign: "center", padding: "16px 12px",
              borderRight: i < 3 ? "1px solid rgba(255,255,255,0.07)" : "none",
            }}
          >
            <div
              style={{
                fontFamily: "'Syne', sans-serif", fontSize: 40, fontWeight: 800,
                letterSpacing: "-1.5px", marginBottom: 4,
                background: "linear-gradient(135deg, #f0f4ff, rgba(240,244,255,0.55))",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}
            >
              {s.n}
            </div>
            <div style={{ fontSize: 13, color: "rgba(240,244,255,0.28)" }}>{s.l}</div>
          </div>
        ))}
      </div>
      <style>{`@media(max-width:640px){.stats-grid{grid-template-columns:repeat(2,1fr)!important;}}`}</style>
    </div>
  );
}

// ─── FEATURES SECTION ────────────────────────────────────────────────────────
function FeaturesSection() {
  const [active, setActive] = useState(0);
  const vizRef = useRef<number>(0);

  const features = [
    {
      icon: "⚡",
      title: "4-Stream Download",
      description:
        "Four parallel HTTP/2 streams saturate your connection simultaneously, eliminating single-connection bottlenecks for accurate real-world throughput.",
    },
    {
      icon: "📡",
      title: "Precision Ping & Jitter",
      description:
        "Eight sequential HEAD requests with outlier trimming (top 10% removed) give you statistically clean latency and jitter figures.",
    },
    {
      icon: "↑",
      title: "3-Stream Upload",
      description:
        "Pre-generated 2 MB payloads sent across 3 workers for 8 seconds. Sliding 400 ms window tracks instant throughput changes live.",
    },
    {
      icon: "📊",
      title: "Quality Scoring",
      description:
        "Weighted algorithm across all four metrics gives you a 0–100 score with a use-case breakdown for streaming, gaming, and work.",
    },
  ];

  // Animated viz for each feature
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamDataRef = useRef<number[][]>([[60, 55, 70, 52], [0]]);

  useEffect(() => {
    cancelAnimationFrame(vizRef.current);

    if (active === 0 || active === 2) {
      // Stream bar animation
      const colors =
        active === 0
          ? ["#3b82f6", "#06b6d4", "#8b5cf6", "#10b981"]
          : ["#8b5cf6", "#f43f5e", "#f59e0b"];
      const count = active === 0 ? 4 : 3;
      let frame = 0;
      const animate = () => {
        frame++;
        const vals = Array.from({ length: count }, (_, i) =>
          Math.max(5, Math.min(95, 40 + Math.sin(frame * 0.04 + i) * 28 + Math.random() * 10))
        );
        vals.forEach((v, i) => {
          const bar = document.getElementById(`feat-bar-${i}`);
          const val = document.getElementById(`feat-val-${i}`);
          if (bar) bar.style.width = v + "%";
          if (val) val.textContent = (v * (active === 0 ? 10 : 6)).toFixed(0) + " Mbps";
        });
        const tot = document.getElementById("feat-total");
        if (tot)
          tot.textContent =
            vals.reduce((a, b) => a + b, 0).toFixed(0) +
            (active === 0 ? " Mbps combined" : " Mbps upload");
        vizRef.current = requestAnimationFrame(animate);
      };
      animate();
    } else if (active === 1) {
      // Ping sine wave
      const samples: number[] = Array.from({ length: 20 }, () => 20 + Math.random() * 15);
      const animate = () => {
        samples.shift();
        samples.push(18 + Math.random() * 18);
        const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
        const jit = samples.reduce((s, v) => s + Math.abs(v - avg), 0) / samples.length;
        const pingEl = document.getElementById("feat-ping-big");
        const jitEl = document.getElementById("feat-jit-big");
        const svgEl = document.getElementById("feat-ping-svg");
        if (pingEl) pingEl.textContent = avg.toFixed(0) + "ms";
        if (jitEl)
          jitEl.textContent = `Jitter: ${jit.toFixed(1)}ms — ${jit < 5 ? "Very stable" : jit < 12 ? "Stable" : "Moderate"}`;
        if (svgEl) {
          const min = Math.min(...samples), max = Math.max(...samples) + 2;
          const pts = samples
            .map((p, i) => {
              const x = i * (260 / 19);
              const y = 74 - ((p - min) / (max - min)) * 66;
              return `${x},${y}`;
            })
            .join(" ");
          svgEl.innerHTML = `<defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#10b981" stop-opacity=".7"/><stop offset="100%" stop-color="#06b6d4"/></linearGradient></defs>
            <polyline points="${pts}" fill="none" stroke="url(#pg)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
            ${samples
              .map((p, i) => {
                const x = i * (260 / 19);
                const y = 74 - ((p - min) / (max - min)) * 66;
                return `<circle cx="${x}" cy="${y}" r="${i === samples.length - 1 ? 3 : 1.5}" fill="#10b981" opacity="${i === samples.length - 1 ? 1 : 0.4}"/>`;
              })
              .join("")}`;
        }
        vizRef.current = requestAnimationFrame(animate);
      };
      animate();
    }

    return () => cancelAnimationFrame(vizRef.current);
  }, [active]);

  const vizContent = () => {
    if (active === 0 || active === 2) {
      const count = active === 0 ? 4 : 3;
      const colors =
        active === 0
          ? ["#3b82f6", "#06b6d4", "#8b5cf6", "#10b981"]
          : ["#8b5cf6", "#f43f5e", "#f59e0b"];
      const labels = active === 0
        ? ["Stream 1", "Stream 2", "Stream 3", "Stream 4"]
        : ["Worker 1", "Worker 2", "Worker 3"];

      return (
        <div style={{ width: "100%" }}>
          {Array.from({ length: count }, (_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "rgba(240,244,255,0.35)", width: 60, textAlign: "right", flexShrink: 0 }}>
                {labels[i]}
              </div>
              <div style={{ flex: 1, height: 8, borderRadius: 100, background: "rgba(255,255,255,0.06)", overflow: "hidden", position: "relative" }}>
                <div
                  id={`feat-bar-${i}`}
                  style={{
                    height: "100%", borderRadius: 100,
                    background: colors[i], width: "0%", transition: "width .35s",
                  }}
                />
              </div>
              <div id={`feat-val-${i}`} style={{ fontSize: 11, color: "rgba(240,244,255,0.55)", width: 64, textAlign: "right", flexShrink: 0 }}>
                0 Mbps
              </div>
            </div>
          ))}
          <div
            style={{
              marginTop: 20, padding: 16,
              background: "rgba(59,130,246,0.06)",
              border: "1px solid rgba(59,130,246,0.15)",
              borderRadius: 12, textAlign: "center",
            }}
          >
            <div style={{ fontSize: 10, color: "rgba(240,244,255,0.28)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
              Aggregate
            </div>
            <div
              id="feat-total"
              style={{
                fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800,
                background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}
            >
              0 Mbps combined
            </div>
          </div>
        </div>
      );
    }

    if (active === 1) {
      return (
        <div style={{ width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 10, color: "rgba(240,244,255,0.28)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              Live Latency
            </div>
            <div
              id="feat-ping-big"
              style={{
                fontFamily: "'Syne', sans-serif", fontSize: 48, fontWeight: 800,
                color: "#10b981", lineHeight: 1,
              }}
            >
              24ms
            </div>
            <div id="feat-jit-big" style={{ fontSize: 13, color: "rgba(240,244,255,0.4)", marginTop: 4 }}>
              Jitter: 2.1ms — Very stable
            </div>
          </div>
          <svg
            id="feat-ping-svg"
            viewBox="0 0 260 80"
            style={{ width: "100%", height: 80 }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(240,244,255,0.25)", marginTop: 6 }}>
            <span>8 samples</span>
            <span>Outlier-trimmed avg</span>
          </div>
        </div>
      );
    }

    // active === 3: quality scoring static view
    return (
      <div style={{ width: "100%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {[
            { lbl: "Download", color: "#3b82f6", pct: 87, val: "87 Mbps" },
            { lbl: "Upload", color: "#8b5cf6", pct: 72, val: "36 Mbps" },
            { lbl: "Ping", color: "#10b981", pct: 91, val: "12ms" },
            { lbl: "Jitter", color: "#f59e0b", pct: 94, val: "1.8ms" },
          ].map((m) => (
            <div
              key={m.lbl}
              style={{
                padding: 14, background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: "rgba(240,244,255,0.4)", textTransform: "uppercase", letterSpacing: ".8px" }}>
                  {m.lbl}
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, color: m.color }}>{m.val}</span>
              </div>
              <div style={{ height: 4, borderRadius: 100, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 100, background: m.color, width: m.pct + "%" }} />
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            padding: 20,
            background: "rgba(59,130,246,0.07)",
            border: "1px solid rgba(59,130,246,0.18)",
            borderRadius: 16, textAlign: "center",
          }}
        >
          <div style={{ fontSize: 11, color: "rgba(240,244,255,0.35)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
            Quality Score
          </div>
          <div
            style={{
              fontFamily: "'Syne', sans-serif", fontSize: 52, fontWeight: 800,
              lineHeight: 1,
              background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}
          >
            91
          </div>
          <div style={{ fontSize: 13, color: "rgba(240,244,255,0.4)", marginTop: 4 }}>
            Excellent · Gigabit-class connection
          </div>
        </div>
      </div>
    );
  };

  return (
    <section id="features" style={{ padding: "96px 0" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
        <div className="section-eyebrow">How it works</div>
        <h2 className="section-title">Built for accuracy,<br />not approximations</h2>
        <p className="section-subtitle">Every measurement uses production-grade methodology trusted by network engineers worldwide.</p>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}
          className="features-layout"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {features.map((f, i) => (
              <FeatureCard
                key={i}
                icon={f.icon}
                title={f.title}
                description={f.description}
                active={active === i}
                onClick={() => setActive(i)}
              />
            ))}
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.13)",
              borderRadius: 32,
              padding: 32,
              minHeight: 380,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute", top: -1, left: "20%", right: "20%", height: 1,
                background: "linear-gradient(90deg, transparent, #3b82f6, #06b6d4, transparent)",
              }}
            />
            {vizContent()}
          </div>
        </div>
      </div>
      <style>{`@media(max-width:768px){.features-layout{grid-template-columns:1fr!important;}}`}</style>
    </section>
  );
}

// ─── TOOLS SECTION ───────────────────────────────────────────────────────────
function ToolsSection() {
  const tools = [
    { icon: "🌐", name: "What's My IP", description: "Reveal your public IPv4 and IPv6 addresses, precise geolocation, ASN, and ISP details in one click.", href: "/tools/my-ip" },
    { icon: "📡", name: "Ping Test", description: "Measure real-time latency to global servers. Spot packet loss, routing anomalies, and instability live.", href: "/tools/ping-test" },
    { icon: "🔍", name: "DNS Lookup", description: "Query A, AAAA, MX, CNAME, TXT and NS records. Verify propagation and debug DNS misconfigurations.", href: "/tools/dns-lookup" },
    { icon: "🗺️", name: "IP Intelligence", description: "Deep-dive any IP — geolocation, ASN, threat intel, VPN/proxy detection, and reverse DNS in one view.", href: "/tools/ip-lookup" },
    { icon: "🛡️", name: "VPN Detector", description: "Detect whether your connection routes through a VPN, datacenter proxy, or Tor exit node with our heuristic engine.", href: "#" },
    { icon: "📈", name: "Speed History", description: "Track your speeds over days and weeks. Export CSV data or share annotated charts with your ISP support.", href: "#" },
  ];

  return (
    <section id="tools" style={{ padding: "0 0 96px" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
        <div className="section-eyebrow">Network Tools</div>
        <h2 className="section-title">Everything to diagnose<br />your connection</h2>
        <p className="section-subtitle">Professional-grade tools built for engineers and everyday users alike.</p>

        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}
          className="tools-grid"
        >
          {tools.map((t) => (
            <ToolCard key={t.name} {...t} />
          ))}
        </div>
      </div>
      <style>{`
        @media(max-width:768px){.tools-grid{grid-template-columns:repeat(2,1fr)!important;}}
        @media(max-width:480px){.tools-grid{grid-template-columns:1fr!important;}}
      `}</style>
    </section>
  );
}

// ─── TRUST BAND ──────────────────────────────────────────────────────────────
function TrustBand() {
  const logos = ["Cloudflare", "Vercel", "Stripe", "Linear", "Notion", "Figma"];
  return (
    <div
      style={{
        borderTop: "1px solid rgba(255,255,255,0.07)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "56px 0",
      }}
    >
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
        <div
          style={{
            fontSize: 11, color: "rgba(240,244,255,0.28)",
            textAlign: "center", textTransform: "uppercase",
            letterSpacing: "1.5px", marginBottom: 28,
          }}
        >
          Trusted by teams at
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 40, flexWrap: "wrap" }}>
          {logos.map((l) => (
            <div
              key={l}
              style={{
                fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700,
                color: "rgba(240,244,255,0.18)", letterSpacing: "-.3px",
                transition: "color .3s", cursor: "default",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLDivElement).style.color = "rgba(240,244,255,0.45)")}
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLDivElement).style.color = "rgba(240,244,255,0.18)")}
            >
              {l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────
function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        "The multi-stream methodology gives results that actually match real-world performance. No competitor comes close to this level of accuracy.",
      name: "Alex Kim",
      role: "Network Engineer · Cloudflare",
      initials: "AK",
      avatarGradient: "linear-gradient(135deg, #3b82f6, #06b6d4)",
    },
    {
      quote:
        "I test my connection every morning before client calls. The jitter measurement is invaluable — it predicts exactly how my video calls will perform.",
      name: "Sarah R.",
      role: "Freelance Video Producer",
      initials: "SR",
      avatarGradient: "linear-gradient(135deg, #10b981, #14b8a6)",
    },
    {
      quote:
        "Finally a speed test that doesn't feel like it's from 2012. Beautiful UI, accurate results, and it actually helps diagnose issues.",
      name: "Marcus T.",
      role: "IT Manager · Fortune 500",
      initials: "MT",
      avatarGradient: "linear-gradient(135deg, #f59e0b, #f43f5e)",
    },
  ];

  return (
    <section id="reviews" style={{ padding: "0 0 96px" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
        <div className="section-eyebrow">Reviews</div>
        <h2 className="section-title">Trusted by 12M+ users</h2>
        <p className="section-subtitle">From network engineers to remote workers — everyone relies on SpeedConnect.</p>

        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}
          className="testi-grid"
        >
          {testimonials.map((t) => (
            <TestimonialCard key={t.name} {...t} />
          ))}
        </div>
      </div>
      <style>{`@media(max-width:768px){.testi-grid{grid-template-columns:1fr!important;}}`}</style>
    </section>
  );
}

// ─── CTA BANNER ──────────────────────────────────────────────────────────────
function CtaBanner() {
  return (
    <div style={{ maxWidth: 1160, margin: "0 auto 80px", padding: "0 24px" }}>
      <div
        style={{
          padding: "56px 48px",
          borderRadius: 32,
          background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.12))",
          border: "1px solid rgba(59,130,246,0.2)",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.15), transparent 60%)",
            pointerEvents: "none",
          }}
        />
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(26px,4vw,44px)",
            fontWeight: 800, letterSpacing: "-1.5px",
            marginBottom: 14, color: "#f0f4ff",
          }}
        >
          Know your true speed<br />in under 30 seconds
        </h2>
        <p style={{ color: "rgba(240,244,255,0.55)", fontSize: 16, marginBottom: 32, maxWidth: 400, margin: "0 auto 32px" }}>
          Free, accurate, and no account required. Just click and go.
        </p>
        <a
          href="#hero"
          style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "16px 36px", borderRadius: 14,
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            color: "#fff", fontSize: 16, fontWeight: 600,
            fontFamily: "'Syne', sans-serif",
            textDecoration: "none", border: "none", cursor: "pointer",
            transition: "transform .2s, box-shadow .2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.03)";
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 16px 40px rgba(59,130,246,0.4)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)";
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
          }}
        >
          ⚡ Start Speed Test
        </a>
      </div>
    </div>
  );
}

// ─── HERO / SPEED CARD ───────────────────────────────────────────────────────
export function SpeedTestClient() {
  const { state, run } = useSpeedTest();
  const [history, setHistory] = useState<Array<{ dl: number; ul: number; ts: number }>>([]);
  const revealRef = useRef<HTMLDivElement[]>([]);

  // Push to history when done
  useEffect(() => {
    if (state.phase === "done" && state.result) {
      setHistory((h) => [
        ...h,
        { dl: state.result!.download, ul: state.result!.upload, ts: state.result!.timestamp },
      ]);
    }
  }, [state.phase, state.result]);

  // Scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) (e.target as HTMLElement).classList.add("in"); }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealRef.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const isTesting = ["ping", "download", "upload"].includes(state.phase);
  const btnLabel = isTesting ? "⏹ Stop Test" : "⚡ Run Speed Test";

  return (
    <>
      <Background />

      {/* ── HERO ── */}
      <section
        id="hero"
        style={{
          minHeight: "100vh",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "100px 16px 60px", textAlign: "center",
          position: "relative", zIndex: 1,
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "5px 14px 5px 8px",
            background: "rgba(59,130,246,0.1)",
            border: "1px solid rgba(59,130,246,0.22)",
            borderRadius: 100, fontSize: 12, color: "#93c5fd", marginBottom: 26,
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#3b82f6", display: "inline-block", animation: "blink 2s infinite" }} />
          Real measurements — 4 parallel streams
        </div>

        {/* Headline */}
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(40px,6.5vw,80px)",
            fontWeight: 800, lineHeight: 1.04,
            letterSpacing: "-2.5px", marginBottom: 18, maxWidth: 860, color: "#f0f4ff",
          }}
        >
          Your Internet,{" "}
          <em
            style={{
              fontStyle: "normal",
              background: "linear-gradient(115deg, #3b82f6 0%, #06b6d4 45%, #8b5cf6 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}
          >
            Measured Precisely
          </em>
        </h1>
        <p
          style={{
            fontSize: "clamp(15px,2vw,18px)", color: "rgba(240,244,255,0.55)",
            maxWidth: 480, margin: "0 auto 44px", fontWeight: 300,
          }}
        >
          Multi-stream speed analysis with live ping, jitter, download &amp; upload. No fake data. No guesswork.
        </p>

        {/* ── SPEED CARD ── */}
        <div
          style={{
            width: "100%", maxWidth: 660,
            background: "rgba(255,255,255,0.028)",
            backdropFilter: "blur(48px) saturate(1.4)",
            border: "1px solid rgba(255,255,255,0.13)",
            borderRadius: 32,
            padding: "44px 36px 36px",
            boxShadow: "0 0 0 1px rgba(255,255,255,.025), 0 48px 96px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.055)",
            position: "relative", overflow: "hidden",
          }}
        >
          {/* Top shimmer line */}
          <div
            style={{
              position: "absolute", top: -1, left: "15%", right: "15%", height: 1,
              background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.7), rgba(139,92,246,0.7), transparent)",
            }}
          />

          {/* Status */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20 }}>
            <div
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "4px 12px", borderRadius: 100,
                fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".6px",
                border: "1px solid",
                color: state.phase === "done" ? "#6ee7b7" : isTesting ? "#93c5fd" : "#6ee7b7",
                borderColor: state.phase === "done"
                  ? "rgba(110,231,183,.3)"
                  : isTesting ? "rgba(147,197,253,.3)" : "rgba(110,231,183,.22)",
                background: state.phase === "done"
                  ? "rgba(110,231,183,.1)"
                  : isTesting ? "rgba(147,197,253,.08)" : "rgba(110,231,183,.07)",
                transition: "all .3s",
              }}
            >
              <span
                style={{
                  width: 5, height: 5, borderRadius: "50%", background: "currentColor",
                  display: "inline-block", animation: "blink 1.8s infinite",
                }}
              />
              {state.phase === "done" ? "Complete" : isTesting ? "Testing…" : "Ready"}
            </div>
          </div>

          {/* Gauge */}
          <SpeedGauge speed={state.currentSpeed} phase={state.phase} />

          {/* Phase track */}
          <PhaseTrack phase={state.phase} />

          {/* Sparkline */}
          <Sparkline data={state.sparkline} />

          {/* Live metrics */}
          <LiveMetrics
            ping={state.livePing}
            download={state.liveDownload}
            upload={state.liveUpload}
            activePhase={state.phase}
          />

          {/* Progress bar */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "rgba(240,244,255,0.28)" }}>{state.phaseLabel}</span>
              <span style={{ fontSize: 11, color: "rgba(240,244,255,0.28)" }}>{Math.round(state.progress)}%</span>
            </div>
            <div style={{ height: 3, borderRadius: 100, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%", borderRadius: 100, width: state.progress + "%",
                  background: "linear-gradient(90deg, #3b82f6, #06b6d4, #8b5cf6)",
                  transition: "width .5s ease", position: "relative",
                }}
              >
                {state.progress > 2 && (
                  <div
                    style={{
                      position: "absolute", right: -1, top: -2,
                      width: 7, height: 7, borderRadius: "50%",
                      background: "#fff", boxShadow: "0 0 8px #3b82f6",
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Error */}
          {state.error && (
            <div
              style={{
                color: "#fca5a5", fontSize: 13, padding: "10px 14px",
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)",
                borderRadius: 10, marginBottom: 14, textAlign: "center",
              }}
            >
              {state.error}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={run}
            disabled={false}
            style={{
              width: "100%", padding: 17, borderRadius: 14,
              background: "linear-gradient(135deg, #3b82f6, #2563eb 50%, #8b5cf6)",
              color: "#fff", fontSize: 16, fontWeight: 600,
              fontFamily: "'Syne', sans-serif", border: "none", cursor: "pointer",
              transition: "transform .18s, box-shadow .18s",
              position: "relative", overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.008)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 36px rgba(59,130,246,0.38)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
            }}
          >
            {btnLabel}
          </button>

          <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: "rgba(240,244,255,0.28)", letterSpacing: ".3px" }}>
            Runs entirely in your browser · No download required
          </div>
        </div>

        {/* Results */}
        {state.result && (
          <ResultsDashboard result={state.result} history={history} />
        )}
      </section>

      {/* ── BELOW-FOLD ── */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
          <StatsBand />
        </div>

        <FeaturesSection />
        <ToolsSection />
        <TrustBand />
        <TestimonialsSection />
        <CtaBanner />
        <FaqSection />
      </div>
    </>
  );
}
