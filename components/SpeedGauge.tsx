"use client";

import { useEffect, useRef, useState } from "react";

// ─── Scale: k=12.5 gives pct(100)=0.5 exactly when MAX=1000 ────────────────
const K     = 12.5;
const MAX   = 1000;
const DENOM = Math.log(1 + MAX / K);

function toPct(v: number): number {
  return Math.log(1 + Math.min(Math.max(v, 0), MAX) / K) / DENOM;
}

// ─── SVG geometry ────────────────────────────────────────────────────────────
const VW  = 400;  // viewBox width
const VH  = 300;  // viewBox height
const CX  = 200;  // pivot x
const CY  = 195;  // pivot y
const R   = 158;  // arc radius
const AW  = 26;   // arc stroke-width
const SA  = 150;  // start angle (deg): 0 Mbps — lower-left
const EA  = 390;  // end   angle (deg): 1000 Mbps — lower-right (=30°)
const SWD = 240;  // sweep in degrees

const NEEDLE_LEN = Math.round(R * 0.90);  // 142px
const HUB_R      = 10;
const LABEL_R    = R - AW - 10;          // 122px — clearly inside arc

// Labels: 9 marks, all gaps ≥13.7° (verified)
const LABELS = [0, 5, 10, 50, 100, 250, 500, 750, 1000] as const;

// Minor ticks: 4 between each pair of major labels
const MINOR_TICKS: number[] = [];
for (let i = 0; i < LABELS.length - 1; i++) {
  const p0 = toPct(LABELS[i]);
  const p1 = toPct(LABELS[i + 1]);
  for (let j = 1; j <= 4; j++) MINOR_TICKS.push(p0 + (p1 - p0) * (j / 5));
}

function polar(r: number, deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function speedToAngle(v: number): number {
  return SA + SWD * toPct(v);
}

// Build SVG arc path (always draws clockwise from SA)
function arcPath(r: number, fromDeg: number, toDeg: number): string {
  const start = polar(r, fromDeg);
  const end   = polar(r, toDeg);
  const sweep = ((toDeg - fromDeg) + 360) % 360;
  const large = sweep > 180 ? 1 : 0;
  return `M ${start.x.toFixed(3)},${start.y.toFixed(3)} A ${r},${r} 0 ${large},1 ${end.x.toFixed(3)},${end.y.toFixed(3)}`;
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface SpeedGaugeProps {
  speed: number;
  phase?: string;
}

export function SpeedGauge({ speed, phase }: SpeedGaugeProps) {
  // Animated angle — updated by RAF spring, written to SVG element directly
  const angleRef    = useRef(SA);   // current animated angle
  const velRef      = useRef(0);
  const loopRef     = useRef<number>(0);
  const needleRef   = useRef<SVGLineElement>(null);
  const arcRef      = useRef<SVGPathElement>(null);
  const glowRef     = useRef<SVGPathElement>(null);
  const tipRef      = useRef<SVGCircleElement>(null);
  const speedRef    = useRef(speed);

  // Displayed speed number — updated via RAF at ~20fps to avoid excessive React renders
  const [display, setDisplay] = useState("0.0");
  const lastNumUpdateRef = useRef(0);

  speedRef.current = speed;

  useEffect(() => {
    const K_SPRING  = 0.13;
    const DAMPING   = 0.78;
    let lastTs      = 0;

    function updateDOM(angleDeg: number, rawSpeed: number) {
      // Needle: rotate around (CX, CY)
      const rad = (angleDeg * Math.PI) / 180;
      const tx  = CX + NEEDLE_LEN * Math.cos(rad);
      const ty  = CY + NEEDLE_LEN * Math.sin(rad);
      if (needleRef.current) {
        needleRef.current.setAttribute("x2", tx.toFixed(2));
        needleRef.current.setAttribute("y2", ty.toFixed(2));
      }

      // Progress arc — clamped so it never exceeds EA
      const clampedAngle = Math.min(Math.max(angleDeg, SA), EA);
      const endAngle     = clampedAngle <= SA + 0.3 ? SA + 0.3 : clampedAngle;
      const path         = arcPath(R, SA, endAngle);
      if (arcRef.current)  arcRef.current.setAttribute("d", path);
      if (glowRef.current) glowRef.current.setAttribute("d", path);

      // Tip glow dot
      if (tipRef.current) {
        tipRef.current.setAttribute("cx", tx.toFixed(2));
        tipRef.current.setAttribute("cy", ty.toFixed(2));
        tipRef.current.setAttribute("opacity", rawSpeed > 0.5 ? "1" : "0");
      }
    }

    function loop(ts: number) {
      const dt = Math.min((ts - lastTs) / 16.667, 3);
      lastTs   = ts;

      const targetAngle = SA + SWD * toPct(speedRef.current);
      const cur         = angleRef.current;
      const vel         = velRef.current;
      const delta       = targetAngle - cur;
      const newVel      = (vel + delta * K_SPRING * dt) * Math.pow(DAMPING, dt);

      if (Math.abs(delta) < 0.05 && Math.abs(newVel) < 0.05) {
        angleRef.current = targetAngle;
        velRef.current   = 0;
      } else {
        angleRef.current = cur + newVel * dt;
        velRef.current   = newVel;
      }

      updateDOM(angleRef.current, speedRef.current);

      // Update React state (speed number) at ~20fps to avoid jank
      if (ts - lastNumUpdateRef.current > 50) {
        lastNumUpdateRef.current = ts;
        const v = speedRef.current;
        setDisplay(v < 10 ? v.toFixed(1) : Math.round(v).toString());
      }

      loopRef.current = requestAnimationFrame(loop);
    }

    loopRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(loopRef.current);
  }, []);

  // Initial needle position for SSR
  const initRad = (SA * Math.PI) / 180;
  const initTx  = CX + NEEDLE_LEN * Math.cos(initRad);
  const initTy  = CY + NEEDLE_LEN * Math.sin(initRad);
  const initArc = arcPath(R, SA, SA + 0.3);

  // Font size for labels — scales mildly for mobile
  const labelFS = 11;

  return (
    <div style={{ width: "100%", maxWidth: 460, margin: "0 auto", position: "relative" }}>
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }}
        aria-label="Speed gauge"
      >
        <defs>
          {/* Gradient for the progress arc */}
          <linearGradient id="arcGrad" gradientUnits="userSpaceOnUse"
            x1={polar(R, SA).x} y1={polar(R, SA).y}
            x2={polar(R, EA).x} y2={polar(R, EA).y}
          >
            <stop offset="0%"   stopColor="#00e5ff" />
            <stop offset="28%"  stopColor="#2196f3" />
            <stop offset="58%"  stopColor="#651fff" />
            <stop offset="100%" stopColor="#d500f9" />
          </linearGradient>

          {/* Glow filter for active arc */}
          <filter id="arcGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soft glow for tip dot */}
          <filter id="tipGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Needle gradient: bright white to translucent */}
          <linearGradient id="needleGrad" gradientUnits="userSpaceOnUse"
            x1={CX} y1={CY} x2={initTx} y2={initTy}
          >
            <stop offset="0%"   stopColor="rgba(255,255,255,0.25)" />
            <stop offset="40%"  stopColor="rgba(255,255,255,0.92)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.75)" />
          </linearGradient>

          {/* Hub gradient */}
          <radialGradient id="hubGrad" cx="38%" cy="35%" r="65%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.85)" />
            <stop offset="45%"  stopColor="rgba(180,200,255,0.4)" />
            <stop offset="100%" stopColor="rgba(20,25,60,0.15)" />
          </radialGradient>

          {/* Shadow behind track */}
          <filter id="trackShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="rgba(0,0,0,0.55)" />
          </filter>
        </defs>

        {/* ── 1. Track shadow ─────────────────────────────────────── */}
        <path
          d={arcPath(R, SA, EA)}
          fill="none"
          stroke="rgba(0,0,0,0.4)"
          strokeWidth={AW + 14}
          strokeLinecap="butt"
          filter="url(#trackShadow)"
        />

        {/* ── 2. Background track ─────────────────────────────────── */}
        <path
          d={arcPath(R, SA, EA)}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={AW}
          strokeLinecap="butt"
        />

        {/* ── 3. Minor tick marks (outside arc) ───────────────────── */}
        {MINOR_TICKS.map((p, i) => {
          const deg  = SA + SWD * p;
          const r1   = R + AW * 0.58;
          const r2   = r1 - R * 0.036;
          const p1   = polar(r1, deg);
          const p2   = polar(r2, deg);
          return (
            <line key={i}
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke="rgba(255,255,255,0.18)" strokeWidth="0.9"
            />
          );
        })}

        {/* ── 4. Major tick marks (outside arc) ───────────────────── */}
        {LABELS.map(v => {
          const deg  = speedToAngle(v);
          const r1   = R + AW * 0.58;
          const r2   = r1 - R * 0.075;
          const p1   = polar(r1, deg);
          const p2   = polar(r2, deg);
          return (
            <line key={v}
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke="rgba(255,255,255,0.55)" strokeWidth="1.6"
            />
          );
        })}

        {/* ── 5. Scale labels INSIDE arc ──────────────────────────── */}
        {LABELS.map(v => {
          const deg  = speedToAngle(v);
          const pos  = polar(LABEL_R, deg);
          return (
            <text key={v}
              x={pos.x} y={pos.y}
              dy="0.35em"
              textAnchor="middle"
              fill="rgba(255,255,255,0.72)"
              fontSize={labelFS}
              fontWeight="600"
              fontFamily="'DM Sans',sans-serif"
            >
              {v}
            </text>
          );
        })}

        {/* ── 6. Glow arc (wide, soft, behind main arc) ───────────── */}
        <path
          ref={glowRef}
          d={initArc}
          fill="none"
          stroke="url(#arcGrad)"
          strokeWidth={AW + 10}
          strokeLinecap="butt"
          opacity="0.28"
          filter="url(#arcGlow)"
        />

        {/* ── 7. Active progress arc ──────────────────────────────── */}
        <path
          ref={arcRef}
          d={initArc}
          fill="none"
          stroke="url(#arcGrad)"
          strokeWidth={AW}
          strokeLinecap="butt"
        />

        {/* ── 8. Needle ────────────────────────────────────────────── */}
        {/* Back tail (short, behind hub) */}
        <line
          x1={CX} y1={CY}
          x2={CX + R * 0.12 * Math.cos((SA + 180) * Math.PI / 180)}
          y2={CY + R * 0.12 * Math.sin((SA + 180) * Math.PI / 180)}
          stroke="rgba(255,255,255,0.3)" strokeWidth="3" strokeLinecap="round"
        />
        {/* Main needle — DOM-updated by RAF */}
        <line
          ref={needleRef}
          x1={CX} y1={CY}
          x2={initTx} y2={initTy}
          stroke="rgba(255,255,255,0.94)"
          strokeWidth="2.2"
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.7))" }}
        />

        {/* ── 9. Tip glow dot ─────────────────────────────────────── */}
        <circle
          ref={tipRef}
          cx={initTx} cy={initTy} r="5"
          fill="rgba(255,255,255,0.9)"
          filter="url(#tipGlow)"
          opacity="0"
        />

        {/* ── 10. Hub ─────────────────────────────────────────────── */}
        {/* Outer shadow ring */}
        <circle cx={CX} cy={CY} r={HUB_R + 4}
          fill="rgba(0,0,0,0.5)"
          style={{ filter: "blur(3px)" }}
        />
        {/* Dark base */}
        <circle cx={CX} cy={CY} r={HUB_R + 2}
          fill="#080b1a"
          stroke="rgba(255,255,255,0.14)" strokeWidth="1.2"
        />
        {/* Glossy dome */}
        <circle cx={CX} cy={CY} r={HUB_R}
          fill="url(#hubGrad)"
        />

        {/* ── 11. Speed readout ────────────────────────────────────── */}
        <text
          x={CX} y={CY + R * 0.38}
          textAnchor="middle" dy="0.35em"
          fill="rgba(240,244,255,0.28)"
          fontSize="11"
          fontFamily="'DM Sans',sans-serif"
          letterSpacing="1"
        >
          {phase === "upload" ? "Mbps ↑" : "Mbps ↓"}
        </text>
      </svg>

      {/* Speed number — React-controlled, overlaid on SVG */}
      <div style={{
        position:  "absolute",
        left:      "50%",
        top:       `${(CY + R * 0.22) / VH * 100}%`,
        transform: "translate(-50%, -50%)",
        textAlign: "center",
        pointerEvents: "none",
        whiteSpace:    "nowrap",
      }}>
        <span style={{
          fontFamily:    "'Syne', sans-serif",
          fontSize:      "clamp(34px, 9vw, 52px)",
          fontWeight:    800,
          lineHeight:    1,
          letterSpacing: "-2px",
          background:    "linear-gradient(135deg, #3b82f6, #06b6d4)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor:  "transparent",
          backgroundClip: "text",
          display: "block",
        }}>
          {display}
        </span>
      </div>
    </div>
  );
}
