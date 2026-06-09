"use client";

import { useEffect, useRef } from "react";

interface ResultCardProps {
  type: "download" | "upload" | "ping" | "jitter";
  value: number;
  animating?: boolean;
}

const CONFIG = {
  download: {
    icon: "↓",
    label: "Download",
    unit: "Mbps",
    color: "#3b82f6",
    gradient: "linear-gradient(90deg, #3b82f6, #06b6d4)",
    barMax: 1000,
    getTrend: (v: number) =>
      v >= 100 ? "Gigabit class" : v >= 50 ? "Excellent" : v >= 25 ? "Good" : "Needs improvement",
  },
  upload: {
    icon: "↑",
    label: "Upload",
    unit: "Mbps",
    color: "#8b5cf6",
    gradient: "linear-gradient(90deg, #8b5cf6, #f43f5e)",
    barMax: 500,
    getTrend: (v: number) =>
      v >= 50 ? "Excellent" : v >= 20 ? "Good" : v >= 5 ? "Adequate" : "Slow",
  },
  ping: {
    icon: "◎",
    label: "Latency",
    unit: "ms",
    color: "#10b981",
    gradient: "linear-gradient(90deg, #10b981, #14b8a6)",
    barMax: 300,
    inverse: true,
    getTrend: (v: number) =>
      v <= 20 ? "Excellent" : v <= 50 ? "Good" : v <= 100 ? "Fair" : "High latency",
  },
  jitter: {
    icon: "≈",
    label: "Jitter",
    unit: "ms",
    color: "#f59e0b",
    gradient: "linear-gradient(90deg, #f59e0b, #f97316)",
    barMax: 60,
    inverse: true,
    getTrend: (v: number) =>
      v <= 5 ? "Very stable" : v <= 15 ? "Stable" : v <= 25 ? "Moderate" : "Unstable",
  },
};

export function ResultCard({ type, value, animating }: ResultCardProps) {
  const config = CONFIG[type];
  const displayRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!animating || value === 0) return;
    const el = displayRef.current;
    const bar = barRef.current;
    if (!el || !bar) return;

    const from = 0;
    const to = value;
    const duration = type === "download" || type === "upload" ? 1200 : 800;
    const t0 = performance.now();

    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const ease = 1 - Math.pow(1 - p, 3);
      const cur = from + (to - from) * ease;
      el.textContent =
        type === "download" || type === "upload" ? cur.toFixed(1) : Math.round(cur).toString();
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    // Bar width
    setTimeout(() => {
      const cfg = config as typeof config & { inverse?: boolean };
      const pct = cfg.inverse
        ? Math.max(4, 100 - (value / config.barMax) * 100)
        : Math.min(100, (value / config.barMax) * 100);
      bar.style.width = pct + "%";
    }, 80);
  }, [animating, value, type, config]);

  const displayVal =
    type === "download" || type === "upload" ? value.toFixed(1) : Math.round(value).toString();

  return (
    <div
      style={{
        padding: "24px 22px",
        borderRadius: 22,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        position: "relative",
        overflow: "hidden",
        transition: "border-color .25s, transform .25s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.13)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0, height: 2,
          background: config.gradient,
          borderRadius: "100px 100px 0 0",
        }}
      />

      <div style={{ fontSize: 18, marginBottom: 10, opacity: 0.6 }}>{config.icon}</div>
      <div
        style={{
          fontSize: 10, color: "rgba(240,244,255,0.28)",
          textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4,
        }}
      >
        {config.label}
      </div>
      <div
        ref={displayRef}
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 38,
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: "-1.5px",
          color: config.color,
        }}
      >
        {displayVal}
      </div>
      <div style={{ fontSize: 13, color: "rgba(240,244,255,0.55)", marginTop: 3 }}>
        {config.unit}
      </div>
      <div
        style={{
          fontSize: 11, color: "rgba(240,244,255,0.28)", marginTop: 6,
        }}
      >
        {config.getTrend(value)}
      </div>
      <div
        style={{
          height: 3, borderRadius: 100,
          background: "rgba(255,255,255,0.06)", marginTop: 14, overflow: "hidden",
        }}
      >
        <div
          ref={barRef}
          style={{
            height: "100%", borderRadius: 100, width: "0%",
            background: config.gradient,
            transition: "width 1.6s cubic-bezier(.22,1,.36,1)",
          }}
        />
      </div>
    </div>
  );
}
