"use client";

import { useEffect, useRef } from "react";

// ─── Log-scale math ────────────────────────────────────────────────────────
// k=62.5 is the unique constant where speedToPct(500)=0.5 exactly when MAX=5000.
// Derived: solve log(1+500/k)/log(1+5000/k)=0.5 → k=62.5
const LOG_K    = 62.5;
const LOG_MAX  = 5000;
const LOG_DENOM = Math.log(1 + LOG_MAX / LOG_K);

function speedToPct(v: number): number {
  return Math.log(1 + Math.min(Math.max(v, 0), LOG_MAX) / LOG_K) / LOG_DENOM;
}

function hexToRgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// ─── Geometry constants ───────────────────────────────────────────────────
// Canvas angles: 0=east, π/2=south, π=west, 3π/2=north (clockwise)
// We want: 0 Mbps at lower-left (150°), 500 at top (270°), 5000 at lower-right (390°=30°)
// Total sweep = 240°
const SA    = (5 * Math.PI) / 6;        // 150° – lower-left  (start)
const EA    = (13 * Math.PI) / 6;       // 390° – lower-right (end)
const SWEEP = EA - SA;                   // 4π/3 = 240°

function speedToAngle(v: number): number {
  return SA + SWEEP * speedToPct(v);
}

// Label set matching Speedtest.net: spaced to avoid overlap at all sizes.
// 0/5/10 are bottom-left (spread horizontally → no vertical overlap).
// 200/250/3000/4000 removed to prevent crowding.
const LABEL_MARKS = [
  { v: 0,    label: "0"    },
  { v: 10,   label: "10"   },
  { v: 50,   label: "50"   },
  { v: 100,  label: "100"  },
  { v: 250,  label: "250"  },
  { v: 500,  label: "500"  },
  { v: 750,  label: "750"  },
  { v: 1000, label: "1000" },
  { v: 2500, label: "2500" },
  { v: 5000, label: "5000" },
];

// Minor ticks: 4 evenly-spaced (in log-pct) between each pair of label marks
function buildMinorTicks(): number[] {
  const out: number[] = [];
  for (let i = 0; i < LABEL_MARKS.length - 1; i++) {
    const p0 = speedToPct(LABEL_MARKS[i].v);
    const p1 = speedToPct(LABEL_MARKS[i + 1].v);
    for (let j = 1; j <= 4; j++) {
      out.push(p0 + (p1 - p0) * (j / 5));
    }
  }
  return out;
}
const MINOR_TICKS = buildMinorTicks();

// ─── Arc gradient stops (cyan→blue→violet→purple) ─────────────────────────
const GRAD_STOPS: Array<[number, string]> = [
  [0,    "#00e5ff"],
  [0.25, "#2196f3"],
  [0.55, "#651fff"],
  [1,    "#d500f9"],
];

function makeArcGrad(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  fromA: number, toA: number
): CanvasGradient {
  // Use a linear gradient along the chord for consistent colour distribution
  const x0 = cx + r * Math.cos(fromA), y0 = cy + r * Math.sin(fromA);
  const x1 = cx + r * Math.cos(toA),   y1 = cy + r * Math.sin(toA);
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  GRAD_STOPS.forEach(([stop, color]) => g.addColorStop(stop, color));
  return g;
}

// ─── Component ────────────────────────────────────────────────────────────
interface SpeedGaugeProps {
  speed: number;
  phase?: string;
}

export function SpeedGauge({ speed, phase }: SpeedGaugeProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const speedRef   = useRef(speed);
  // Animated display value
  const dispRef    = useRef(0);
  // Spring state
  const velRef     = useRef(0);
  const loopRef    = useRef<number>(0);
  const bootedRef  = useRef(false);

  // Always keep target in sync — no re-renders of the loop
  speedRef.current = speed;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || bootedRef.current) return;
    bootedRef.current = true;

    // ── Sizing: fills container, capped at 460px, aspect 1:0.65 ─────────
    const DPR  = Math.min(window.devicePixelRatio || 1, 2);
    const W    = Math.min(canvas.parentElement?.clientWidth ?? 420, 460);
    const H    = Math.round(W * 0.65);
    canvas.width        = W * DPR;
    canvas.height       = H * DPR;
    canvas.style.width  = W + "px";
    canvas.style.height = H + "px";

    const ctx = canvas.getContext("2d")!;
    ctx.scale(DPR, DPR);

    // ── Geometry ─────────────────────────────────────────────────────────
    const CX   = W / 2;
    // Pivot point: 68% down the canvas gives good room above for arc + labels
    const CY   = Math.round(H * 0.72);
    const R    = Math.round(W * 0.42);        // arc radius

    // Arc thickness proportional to radius (mimics STN's thick ring)
    const ARC_W = Math.max(14, Math.round(R * 0.118));

    // Label radius: just inside the arc
    const LABEL_R = R - ARC_W * 0.5 - Math.round(R * 0.13);

    // Tick outer edge: just outside the arc
    const TICK_OUTER = R + ARC_W * 0.55;

    // Font size scales with gauge
    const FS_LABEL = Math.max(9, Math.round(R * 0.073));

    // ── Draw function ─────────────────────────────────────────────────────
    function draw(v: number) {
      ctx.clearRect(0, 0, W, H);

      const pct  = speedToPct(v);
      const endA = speedToAngle(v);

      // ── 1. Shadow ring behind arc ────────────────────────────────────
      ctx.save();
      ctx.beginPath();
      ctx.arc(CX, CY, R, SA, EA);
      ctx.strokeStyle = "rgba(0,0,0,0.45)";
      ctx.lineWidth   = ARC_W + 12;
      ctx.lineCap     = "butt";
      ctx.filter      = "blur(6px)";
      ctx.stroke();
      ctx.restore();

      // ── 2. Background track ──────────────────────────────────────────
      ctx.beginPath();
      ctx.arc(CX, CY, R, SA, EA);
      ctx.strokeStyle = "rgba(255,255,255,0.055)";
      ctx.lineWidth   = ARC_W;
      ctx.lineCap     = "butt";
      ctx.stroke();

      // ── 3. Minor ticks ───────────────────────────────────────────────
      MINOR_TICKS.forEach(p => {
        const a  = SA + SWEEP * p;
        const r1 = TICK_OUTER;
        const r2 = r1 - Math.round(R * 0.038);
        ctx.beginPath();
        ctx.moveTo(CX + r1 * Math.cos(a), CY + r1 * Math.sin(a));
        ctx.lineTo(CX + r2 * Math.cos(a), CY + r2 * Math.sin(a));
        ctx.strokeStyle = "rgba(255,255,255,0.16)";
        ctx.lineWidth   = 0.8;
        ctx.stroke();
      });

      // ── 4. Major ticks ───────────────────────────────────────────────
      LABEL_MARKS.forEach(m => {
        const a  = speedToAngle(m.v);
        const r1 = TICK_OUTER;
        const r2 = r1 - Math.round(R * 0.07);
        ctx.beginPath();
        ctx.moveTo(CX + r1 * Math.cos(a), CY + r1 * Math.sin(a));
        ctx.lineTo(CX + r2 * Math.cos(a), CY + r2 * Math.sin(a));
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.lineWidth   = 1.5;
        ctx.stroke();
      });

      // ── 5. Labels (inside arc) ───────────────────────────────────────
      ctx.font          = `600 ${FS_LABEL}px 'DM Sans',sans-serif`;
      ctx.textAlign     = "center";
      ctx.textBaseline  = "middle";
      LABEL_MARKS.forEach(m => {
        const a  = speedToAngle(m.v);
        const lx = CX + LABEL_R * Math.cos(a);
        const ly = CY + LABEL_R * Math.sin(a);
        ctx.fillStyle = "rgba(255,255,255,0.72)";
        ctx.fillText(m.label, lx, ly);
      });

      // ── 6. Glowing progress arc ──────────────────────────────────────
      if (pct > 0.003) {
        const grad = makeArcGrad(ctx, CX, CY, R, SA, endA);

        // Diffuse glow underneath (wider, semi-transparent)
        // Intensity grows with speed for realism
        const glowAlpha = 0.15 + pct * 0.25;
        ctx.save();
        ctx.shadowColor = pct < 0.5 ? "#00bcd4" : "#9c27b0";
        ctx.shadowBlur  = Math.round(ARC_W * (0.8 + pct * 1.4));
        ctx.beginPath();
        ctx.arc(CX, CY, R, SA, endA);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = ARC_W + Math.round(R * 0.06);
        ctx.lineCap     = "butt";
        ctx.globalAlpha = glowAlpha;
        ctx.stroke();
        ctx.restore();

        // Crisp bright arc on top
        ctx.beginPath();
        ctx.arc(CX, CY, R, SA, endA);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = ARC_W;
        ctx.lineCap     = "butt";
        ctx.stroke();

        // ── 7. Tip glow ─────────────────────────────────────────────
        const tx = CX + R * Math.cos(endA);
        const ty = CY + R * Math.sin(endA);
        const tipColor = pct < 0.3 ? "#2196f3" : pct < 0.6 ? "#651fff" : "#d500f9";
        const glowR = ARC_W * 2.0;

        // Outer bloom
        const bloom = ctx.createRadialGradient(tx, ty, 0, tx, ty, glowR);
        bloom.addColorStop(0,   hexToRgba(tipColor, 0.65));
        bloom.addColorStop(0.5, hexToRgba(tipColor, 0.22));
        bloom.addColorStop(1,   "transparent");
        ctx.beginPath();
        ctx.arc(tx, ty, glowR, 0, Math.PI * 2);
        ctx.fillStyle = bloom;
        ctx.fill();

        // Bright core dot
        const coreR = ARC_W * 0.52;
        const core = ctx.createRadialGradient(tx, ty, 0, tx, ty, coreR);
        core.addColorStop(0,   "rgba(255,255,255,1)");
        core.addColorStop(0.4, hexToRgba(tipColor, 0.9));
        core.addColorStop(1,   "transparent");
        ctx.beginPath();
        ctx.arc(tx, ty, coreR, 0, Math.PI * 2);
        ctx.fillStyle = core;
        ctx.fill();
      }

      // ── 8. Needle ────────────────────────────────────────────────────
      const needleLen = R - ARC_W * 0.22;   // almost reaches arc
      const baseW     = Math.max(2, R * 0.016);

      ctx.save();
      ctx.translate(CX, CY);
      ctx.rotate(endA);

      // Shadow
      ctx.shadowColor   = "rgba(0,0,0,0.75)";
      ctx.shadowBlur    = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 3;

      // Tapered body (wide at pivot, thin at tip)
      ctx.beginPath();
      ctx.moveTo(-R * 0.09,  baseW * 1.15);
      ctx.lineTo(needleLen,  baseW * 0.30);
      ctx.lineTo(needleLen, -baseW * 0.30);
      ctx.lineTo(-R * 0.09, -baseW * 1.15);
      ctx.closePath();
      ctx.fillStyle = "rgba(255,255,255,0.96)";
      ctx.fill();

      // Specular highlight along needle
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(-R * 0.07, 0);
      ctx.lineTo(needleLen - 5, 0);
      ctx.strokeStyle = "rgba(255,255,255,0.42)";
      ctx.lineWidth   = baseW * 0.35;
      ctx.stroke();

      ctx.restore();

      // ── 9. Hub ───────────────────────────────────────────────────────
      const hubR = Math.max(10, Math.round(R * 0.088));

      // Dark base
      ctx.beginPath();
      ctx.arc(CX, CY, hubR + 2, 0, Math.PI * 2);
      ctx.fillStyle   = "#08091a";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.lineWidth   = 1.5;
      ctx.stroke();

      // Radial highlight
      const hub = ctx.createRadialGradient(
        CX - hubR * 0.3, CY - hubR * 0.3, 0,
        CX, CY, hubR
      );
      hub.addColorStop(0,   "rgba(255,255,255,0.78)");
      hub.addColorStop(0.4, "rgba(180,200,255,0.35)");
      hub.addColorStop(1,   "rgba(40,50,100,0.10)");
      ctx.beginPath();
      ctx.arc(CX, CY, hubR, 0, Math.PI * 2);
      ctx.fillStyle = hub;
      ctx.fill();
    }

    // ── Spring-physics RAF loop ───────────────────────────────────────────
    // Tuned for Speedtest.net feel:
    //   - Fast response (high stiffness)
    //   - Slight natural overshoot at high accelerations
    //   - Smooth settle without oscillation
    //
    // Spring model: v += (target - pos) * K;  v *= D;  pos += v
    // K = stiffness (higher = snappier)
    // D = damping  (lower = more oscillation; >1 = unstable)

    const K = 0.14;   // stiffness — tuned for fast response
    const D = 0.76;   // damping   — slight overshoot at fast changes
    const SNAP = 0.015; // snap-to-target threshold (Mbps)

    let lastT = 0;

    function loop(ts: number) {
      // Delta-time normalisation so physics is frame-rate independent
      // Cap dt at 50ms to avoid jumps after tab switch
      const dt  = Math.min((ts - lastT) / 16.67, 3.0); // relative to 60fps
      lastT = ts;

      const target = speedRef.current;
      const cur    = dispRef.current;
      const vel    = velRef.current;

      const delta  = target - cur;
      const newVel = (vel + delta * K * dt) * Math.pow(D, dt);
      const next   = cur + newVel * dt;

      // Settle check
      if (Math.abs(delta) < SNAP && Math.abs(newVel) < SNAP) {
        dispRef.current = target;
        velRef.current  = 0;
      } else {
        dispRef.current = next;
        velRef.current  = newVel;
      }

      draw(dispRef.current);
      loopRef.current = requestAnimationFrame(loop);
    }

    loopRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(loopRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // boot exactly once — speedRef is read by reference inside the loop

  // Numeric readout: always reflects current speed prop (React-controlled)
  const displaySpeed = speed < 10 ? speed.toFixed(1) : Math.round(speed).toString();

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 460,
        margin: "0 auto",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "auto" }}
      />
      {/* Speed readout — positioned below center of canvas */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          // 72% CY relative to canvas height * canvas height
          // expressed as percentage of the div (which equals canvas height)
          top: "55%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(34px, 10vw, 56px)",
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-2.5px",
            background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {displaySpeed}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "rgba(240,244,255,0.32)",
            marginTop: 4,
            letterSpacing: "0.4px",
          }}
        >
          {phase === "upload" ? "Mbps ↑" : "Mbps ↓"}
        </div>
      </div>
    </div>
  );
}
