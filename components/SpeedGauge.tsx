"use client";

import { useEffect, useRef, useState } from "react";

// ─── Custom piecewise scale ───────────────────────────────────────────────────
// Maps speed → [0, 1] so that:
//   0    → 0.000  (bottom-left,  150°)
//   5    → 0.083  (lower-left)
//   10   → 0.167  (mid-left)
//   50   → 0.333  (upper-left)
//   100  → 0.500  (exact top-center, 270°)
//   250  → 0.667  (upper-right)
//   500  → 0.833  (mid-right)
//   750  → 0.917  (lower-right)
//   1000 → 1.000  (bottom-right, 390°)
//
// Between each pair the mapping is a smooth log-interpolated curve
// so the needle moves naturally, not linearly.

const BREAKPOINTS: Array<[number, number]> = [
  [0,     0.000],
  [5,     0.110],
  [10,    0.200],
  [50,    0.360],
  [100,   0.500],
  [250,   0.640],
  [500,   0.800],
  [750,   0.890],
  [1000,  1.000],
];

function toPct(speed: number): number {
  const v = Math.min(Math.max(speed, 0), 1000);
  // Find surrounding breakpoints
  for (let i = 0; i < BREAKPOINTS.length - 1; i++) {
    const [v0, p0] = BREAKPOINTS[i];
    const [v1, p1] = BREAKPOINTS[i + 1];
    if (v <= v1) {
      // Smooth log interpolation within each segment
      const range = v1 - v0;
      if (range === 0) return p0;
      // Use log curve within segment for natural feel (t^0.7 gives slight log curve)
      const t = (v - v0) / range;
      const curved = Math.pow(t, 0.75); // slight ease-in per segment
      return p0 + (p1 - p0) * curved;
    }
  }
  return 1;
}

// ─── SVG geometry ─────────────────────────────────────────────────────────────
const VW  = 420;   // viewBox width  — wider for better label room
const VH  = 330;   // viewBox height — extra room for speed number
const CX  = 210;   // pivot x (center)
const CY  = 200;   // pivot y
const R   = 162;   // arc radius
const AW  = 31;    // arc stroke-width (+20%)
const SA  = 150;   // start angle° — 0 Mbps, bottom-left
const EA  = 390;   // end   angle° — 1000 Mbps, bottom-right (=30°)
const SWD = 240;   // total sweep°

const NEEDLE_LEN = Math.round(R * 0.94);  // ~152px
const HUB_R      = 7;
const LABEL_R    = R - AW - 10;           // inside thicker arc

const LABELS: number[] = [0, 5, 10, 50, 100, 250, 500, 750, 1000];

// Minor ticks: 4 per major interval
const MINOR_TICKS: number[] = [];
for (let i = 0; i < LABELS.length - 1; i++) {
  const p0 = toPct(LABELS[i]);
  const p1 = toPct(LABELS[i + 1]);
  for (let j = 1; j <= 4; j++) {
    MINOR_TICKS.push(p0 + (p1 - p0) * (j / 5));
  }
}

function polar(r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function speedToAngle(v: number): number {
  return SA + SWD * toPct(v);
}

function arcPath(r: number, fromDeg: number, toDeg: number): string {
  const s = polar(r, fromDeg);
  const e = polar(r, toDeg);
  const sweep = ((toDeg - fromDeg) + 360) % 360;
  const large = sweep > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)},${s.y.toFixed(2)} A ${r},${r} 0 ${large},1 ${e.x.toFixed(2)},${e.y.toFixed(2)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────
interface SpeedGaugeProps {
  speed: number;
  phase?: string;
}

export function SpeedGauge({ speed, phase }: SpeedGaugeProps) {
  const angleRef   = useRef(SA);
  const velRef     = useRef(0);
  const loopRef    = useRef<number>(0);
  const needleRef  = useRef<SVGLineElement>(null);
  const arcRef     = useRef<SVGPathElement>(null);
  const glowRef    = useRef<SVGPathElement>(null);
  const tipRef     = useRef<SVGCircleElement>(null);
  const speedRef   = useRef(speed);
  const [display, setDisplay] = useState("0.0");
  const lastNumRef = useRef(0);

  speedRef.current = speed;

  useEffect(() => {
    const KS = 0.13, DAMP = 0.78;
    let lastTs = 0;

    function updateDOM(angleDeg: number, spd: number) {
      const rad = (angleDeg * Math.PI) / 180;
      const tx  = CX + NEEDLE_LEN * Math.cos(rad);
      const ty  = CY + NEEDLE_LEN * Math.sin(rad);

      needleRef.current?.setAttribute("x2", tx.toFixed(2));
      needleRef.current?.setAttribute("y2", ty.toFixed(2));

      // Arc driven by exact needle angle — always ends at needle tip
      const endA = angleDeg;
      const path = arcPath(R, SA, endA);
      arcRef.current?.setAttribute("d", path);
      glowRef.current?.setAttribute("d", path);

      tipRef.current?.setAttribute("cx", tx.toFixed(2));
      tipRef.current?.setAttribute("cy", ty.toFixed(2));
      tipRef.current?.setAttribute("opacity", spd > 0.5 ? "1" : "0");
    }

    function loop(ts: number) {
      const dt  = Math.min((ts - lastTs) / 16.667, 3);
      lastTs = ts;

      const target = SA + SWD * toPct(speedRef.current);
      const cur    = angleRef.current;
      const vel    = velRef.current;
      const delta  = target - cur;
      const newVel = (vel + delta * KS * dt) * Math.pow(DAMP, dt);

      if (Math.abs(delta) < 0.05 && Math.abs(newVel) < 0.05) {
        angleRef.current = target;
        velRef.current   = 0;
      } else {
        angleRef.current = cur + newVel * dt;
        velRef.current   = newVel;
      }

      updateDOM(angleRef.current, speedRef.current);

      if (ts - lastNumRef.current > 50) {
        lastNumRef.current = ts;
        const v = speedRef.current;
        setDisplay(v < 10 ? v.toFixed(1) : Math.round(v).toString());
      }

      loopRef.current = requestAnimationFrame(loop);
    }

    loopRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(loopRef.current);
  }, []);

  const initRad = (SA * Math.PI) / 180;
  const initTx  = CX + NEEDLE_LEN * Math.cos(initRad);
  const initTy  = CY + NEEDLE_LEN * Math.sin(initRad);
  const initArc = arcPath(R, SA, SA + 0.3);

  const arcStart = polar(R, SA);
  const arcEnd   = polar(R, EA);

  return (
    <div style={{ width: "100%", maxWidth: 460, margin: "0 auto", position: "relative" }}>
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }}
        aria-label="Speed gauge"
      >
        <defs>
          <linearGradient id="arcGrad" gradientUnits="userSpaceOnUse"
            x1={arcStart.x} y1={arcStart.y}
            x2={arcEnd.x}   y2={arcEnd.y}
          >
            <stop offset="0%"   stopColor="#00e5ff" />
            <stop offset="25%"  stopColor="#2196f3" />
            <stop offset="55%"  stopColor="#651fff" />
            <stop offset="100%" stopColor="#d500f9" />
          </linearGradient>

          <filter id="arcGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="tipGlow" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="trackShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="rgba(0,0,0,0.6)" />
          </filter>

          <radialGradient id="hubGrad" cx="38%" cy="35%" r="65%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.88)" />
            <stop offset="45%"  stopColor="rgba(180,200,255,0.42)" />
            <stop offset="100%" stopColor="rgba(20,25,60,0.12)" />
          </radialGradient>
        </defs>

        {/* 1. Track shadow */}
        <path
          d={arcPath(R, SA, EA)}
          fill="none" stroke="rgba(0,0,0,0.45)"
          strokeWidth={AW + 16} strokeLinecap="butt"
          filter="url(#trackShadow)"
        />

        {/* 2. Background track */}
        <path
          d={arcPath(R, SA, EA)}
          fill="none" stroke="rgba(255,255,255,0.065)"
          strokeWidth={AW} strokeLinecap="butt"
        />

        {/* 3. Minor ticks — outside arc */}
        {MINOR_TICKS.map((p, i) => {
          const deg = SA + SWD * p;
          const r1  = R + AW * 0.55;
          const r2  = r1 - R * 0.034;
          const p1  = polar(r1, deg);
          const p2  = polar(r2, deg);
          return (
            <line key={i}
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke="rgba(255,255,255,0.19)" strokeWidth="0.85"
            />
          );
        })}

        {/* 4. Major ticks — outside arc */}
        {LABELS.map(v => {
          const deg = speedToAngle(v);
          const r1  = R + AW * 0.55;
          const r2  = r1 - R * 0.072;
          const p1  = polar(r1, deg);
          const p2  = polar(r2, deg);
          return (
            <line key={v}
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke="rgba(255,255,255,0.58)" strokeWidth="1.6"
            />
          );
        })}

        {/* 5. Labels INSIDE arc */}
        {LABELS.map(v => {
          const deg = speedToAngle(v);
          const pos = polar(LABEL_R, deg);
          return (
            <text key={v}
              x={pos.x} y={pos.y} dy="0.35em"
              textAnchor="middle"
              fill="rgba(255,255,255,0.75)"
              fontSize="11"
              fontWeight="600"
              fontFamily="'DM Sans',sans-serif"
            >
              {v}
            </text>
          );
        })}

        {/* 6. Glow arc */}
        <path
          ref={glowRef}
          d={initArc}
          fill="none" stroke="url(#arcGrad)"
          strokeWidth={AW + 10} strokeLinecap="butt"
          opacity="0.3" filter="url(#arcGlow)"
        />

        {/* 7. Active arc */}
        <path
          ref={arcRef}
          d={initArc}
          fill="none" stroke="url(#arcGrad)"
          strokeWidth={AW} strokeLinecap="butt"
        />

        {/* 8. Needle */}
        <line
          ref={needleRef}
          x1={CX} y1={CY}
          x2={initTx} y2={initTy}
          stroke="rgba(255,255,255,0.95)"
          strokeWidth="2.4" strokeLinecap="round"
          style={{ filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.75))" }}
        />

        {/* 9. Tip dot */}
        <circle
          ref={tipRef}
          cx={initTx} cy={initTy} r="5"
          fill="rgba(255,255,255,0.92)"
          filter="url(#tipGlow)"
          opacity="0"
        />

        {/* 10. Hub */}
        <circle cx={CX} cy={CY} r={HUB_R + 4}
          fill="rgba(0,0,0,0.45)"
          style={{ filter: "blur(3px)" }}
        />
        <circle cx={CX} cy={CY} r={HUB_R + 2}
          fill="#080b1a"
          stroke="rgba(255,255,255,0.15)" strokeWidth="1.2"
        />
        <circle cx={CX} cy={CY} r={HUB_R}
          fill="url(#hubGrad)"
        />

        {/* 11. Unit label */}
        <text
          x={CX} y={CY + 80}
          textAnchor="middle" dy="0.35em"
          fill="rgba(240,244,255,0.28)"
          fontSize="11" letterSpacing="1"
          fontFamily="'DM Sans',sans-serif"
        >
          {phase === "upload" ? "Mbps ↑" : "Mbps ↓"}
        </text>
      </svg>

      {/* Speed number overlay */}
      <div style={{
        position: "absolute",
        left: "50%",
        top: `${(CY + 40) / VH * 100}%`,
        transform: "translate(-50%, -50%)",
        textAlign: "center",
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}>
        <span style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: "clamp(34px, 9vw, 52px)",
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: "-2px",
          background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          display: "block",
        }}>
          {display}
        </span>
      </div>
    </div>
  );
}
