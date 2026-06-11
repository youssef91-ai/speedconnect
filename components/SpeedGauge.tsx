"use client";

import { useEffect, useRef } from "react";

// ─── Logarithmic scale ───────────────────────────────────────────────────────
// k=62.5 is derived so that speedToPct(500)=0.5 exactly when MAX=5000.
// Proof: log(1+500/62.5)/log(1+5000/62.5) = log(9)/log(81) = log(9)/(2·log(9)) = 0.5 ✓
const LOG_K     = 62.5;
const LOG_MAX   = 5000;
const LOG_DENOM = Math.log(1 + LOG_MAX / LOG_K); // log(81)

function speedToPct(v: number): number {
  return Math.log(1 + Math.min(Math.max(v, 0), LOG_MAX) / LOG_K) / LOG_DENOM;
}

// ─── Geometry (fixed, verified) ──────────────────────────────────────────────
// Canvas angles: 0=east, π/2=south, π=west, 3π/2=north (clockwise)
// 0 Mbps  → 150° (lower-left)   = 5π/6
// 500 Mbps → 270° (top-center)  = 3π/2  [exactly half-sweep]
// 5000 Mbps → 390° (lower-right) = 13π/6
const SA    = (5 * Math.PI) / 6;   // 150° — start
const EA    = (13 * Math.PI) / 6;  // 390° — end
const SWEEP = EA - SA;              // 4π/3 = 240°

function speedToAngle(v: number): number {
  return SA + SWEEP * speedToPct(v);
}

// ─── Labels: spaced so no two are closer than ~8° (verified at R=175) ────────
const LABEL_MARKS: Array<{ v: number; label: string }> = [
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

// Minor ticks: 4 per interval in log-pct space
function buildMinorTicks(): number[] {
  const out: number[] = [];
  for (let i = 0; i < LABEL_MARKS.length - 1; i++) {
    const p0 = speedToPct(LABEL_MARKS[i].v);
    const p1 = speedToPct(LABEL_MARKS[i + 1].v);
    for (let j = 1; j <= 4; j++) out.push(p0 + (p1 - p0) * (j / 5));
  }
  return out;
}
const MINOR_TICKS = buildMinorTicks();

// ─── Gradient stops (cyan → blue → violet → magenta) ────────────────────────
const GRAD_STOPS: Array<[number, string]> = [
  [0,    "#00e5ff"],
  [0.28, "#2196f3"],
  [0.56, "#651fff"],
  [1,    "#d500f9"],
];

function hexToRgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// ─── Component ───────────────────────────────────────────────────────────────
interface SpeedGaugeProps {
  speed: number;
  phase?: string;
}

export function SpeedGauge({ speed, phase }: SpeedGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const speedRef  = useRef(speed);   // written by React, read by RAF
  const dispRef   = useRef(0);       // current animated value
  const velRef    = useRef(0);       // spring velocity
  const loopRef   = useRef<number>(0);
  const bootedRef = useRef(false);

  speedRef.current = speed;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || bootedRef.current) return;
    bootedRef.current = true;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    // ── Sizing ──────────────────────────────────────────────────────────────
    // W capped at 460px. H derived so arc endpoints have ≥11px bottom margin.
    const W   = Math.min(canvas.parentElement?.clientWidth ?? 420, 460);
    const R   = Math.round(W * 0.38);                        // arc radius
    const AW  = Math.max(16, Math.round(R * 0.132));         // arc thickness
    const CX  = W / 2;
    const CY  = R + 40;                                      // pivot: 40px below arc top
    // Arc endpoints are at sin(30°)=0.5 below CY
    const H   = Math.ceil(CY + R * 0.5 + AW + 22);          // +22px bottom padding

    canvas.width        = W * DPR;
    canvas.height       = H * DPR;
    canvas.style.width  = W + "px";
    canvas.style.height = H + "px";

    const ctx = canvas.getContext("2d")!;
    ctx.scale(DPR, DPR);

    // ── Derived radii ────────────────────────────────────────────────────────
    const LABEL_R     = R - AW - 8;                          // labels sit inside arc
    const TICK_OUT    = R + Math.round(AW * 0.55);           // tick outer edge
    const TICK_MAJ_IN = TICK_OUT - Math.round(R * 0.072);   // major tick inner
    const TICK_MIN_IN = TICK_OUT - Math.round(R * 0.038);   // minor tick inner
    const HUB_R       = Math.max(9, Math.round(R * 0.072));
    const NEEDLE_LEN  = R - Math.round(AW * 0.18);
    const NEEDLE_W    = Math.max(1.8, R * 0.015);
    const FS          = Math.max(9, Math.round(R * 0.074));  // label font size

    // ── Draw ─────────────────────────────────────────────────────────────────
    function draw(v: number) {
      ctx.clearRect(0, 0, W, H);

      const pct  = speedToPct(v);
      const endA = speedToAngle(v);

      // 1. Dark shadow ring (gives depth behind the track)
      ctx.save();
      ctx.filter = "blur(5px)";
      ctx.beginPath();
      ctx.arc(CX, CY, R, SA, EA);
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth   = AW + 14;
      ctx.lineCap     = "butt";
      ctx.stroke();
      ctx.restore();

      // 2. Background track
      ctx.beginPath();
      ctx.arc(CX, CY, R, SA, EA);
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth   = AW;
      ctx.lineCap     = "butt";
      ctx.stroke();

      // 3. Minor ticks (outside arc)
      MINOR_TICKS.forEach(p => {
        const a = SA + SWEEP * p;
        ctx.beginPath();
        ctx.moveTo(CX + TICK_OUT    * Math.cos(a), CY + TICK_OUT    * Math.sin(a));
        ctx.lineTo(CX + TICK_MIN_IN * Math.cos(a), CY + TICK_MIN_IN * Math.sin(a));
        ctx.strokeStyle = "rgba(255,255,255,0.17)";
        ctx.lineWidth   = 0.9;
        ctx.stroke();
      });

      // 4. Major ticks (outside arc)
      LABEL_MARKS.forEach(({ v: mv }) => {
        const a = speedToAngle(mv);
        ctx.beginPath();
        ctx.moveTo(CX + TICK_OUT    * Math.cos(a), CY + TICK_OUT    * Math.sin(a));
        ctx.lineTo(CX + TICK_MAJ_IN * Math.cos(a), CY + TICK_MAJ_IN * Math.sin(a));
        ctx.strokeStyle = "rgba(255,255,255,0.52)";
        ctx.lineWidth   = 1.5;
        ctx.stroke();
      });

      // 5. Labels INSIDE the arc (between arc inner edge and hub)
      ctx.font         = `600 ${FS}px 'DM Sans',sans-serif`;
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      LABEL_MARKS.forEach(({ v: mv, label }) => {
        const a  = speedToAngle(mv);
        const lx = CX + LABEL_R * Math.cos(a);
        const ly = CY + LABEL_R * Math.sin(a);
        ctx.fillStyle = "rgba(255,255,255,0.72)";
        ctx.fillText(label, lx, ly);
      });

      // 6. Glowing progress arc
      if (pct > 0.003) {
        // Gradient: chord from arc-start to needle-tip
        const gx0 = CX + R * Math.cos(SA),   gy0 = CY + R * Math.sin(SA);
        const gx1 = CX + R * Math.cos(endA),  gy1 = CY + R * Math.sin(endA);
        const grad = ctx.createLinearGradient(gx0, gy0, gx1, gy1);
        // Clamp stop positions for short arcs so gradient always ends at correct colour
        const pctClamped = Math.max(pct, 0.01);
        GRAD_STOPS.forEach(([stop, color]) => {
          grad.addColorStop(Math.min(stop / pctClamped, 1), color);
        });

        // Outer soft glow (grows with speed)
        ctx.save();
        ctx.shadowColor = pct < 0.5 ? "#00bcd4" : "#9c27b0";
        ctx.shadowBlur  = Math.round(AW * (0.9 + pct * 1.6));
        ctx.beginPath();
        ctx.arc(CX, CY, R, SA, endA);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = AW + Math.round(R * 0.055);
        ctx.lineCap     = "butt";
        ctx.globalAlpha = 0.18 + pct * 0.24;
        ctx.stroke();
        ctx.restore();

        // Crisp bright arc
        ctx.beginPath();
        ctx.arc(CX, CY, R, SA, endA);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = AW;
        ctx.lineCap     = "butt";
        ctx.stroke();

        // Tip glow dot at needle end
        const tx = CX + R * Math.cos(endA);
        const ty = CY + R * Math.sin(endA);
        const tipColor = pct < 0.3 ? "#2196f3" : pct < 0.62 ? "#651fff" : "#d500f9";

        const bloom = ctx.createRadialGradient(tx, ty, 0, tx, ty, AW * 2.0);
        bloom.addColorStop(0,   hexToRgba(tipColor, 0.7));
        bloom.addColorStop(0.5, hexToRgba(tipColor, 0.22));
        bloom.addColorStop(1,   "transparent");
        ctx.beginPath();
        ctx.arc(tx, ty, AW * 2.0, 0, Math.PI * 2);
        ctx.fillStyle = bloom;
        ctx.fill();

        const core = ctx.createRadialGradient(tx, ty, 0, tx, ty, AW * 0.5);
        core.addColorStop(0,   "rgba(255,255,255,1)");
        core.addColorStop(0.5, hexToRgba(tipColor, 0.9));
        core.addColorStop(1,   "transparent");
        ctx.beginPath();
        ctx.arc(tx, ty, AW * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = core;
        ctx.fill();
      }

      // 7. Needle
      ctx.save();
      ctx.translate(CX, CY);
      ctx.rotate(endA);

      ctx.shadowColor   = "rgba(0,0,0,0.8)";
      ctx.shadowBlur    = 10;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 2;

      // Tapered body
      ctx.beginPath();
      ctx.moveTo(-R * 0.088,  NEEDLE_W * 1.2);
      ctx.lineTo(NEEDLE_LEN,  NEEDLE_W * 0.28);
      ctx.lineTo(NEEDLE_LEN, -NEEDLE_W * 0.28);
      ctx.lineTo(-R * 0.088, -NEEDLE_W * 1.2);
      ctx.closePath();
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fill();

      // Specular stripe
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(-R * 0.07, 0);
      ctx.lineTo(NEEDLE_LEN - 5, 0);
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth   = NEEDLE_W * 0.32;
      ctx.stroke();

      ctx.restore();

      // 8. Hub
      // Dark base plate
      ctx.beginPath();
      ctx.arc(CX, CY, HUB_R + 2, 0, Math.PI * 2);
      ctx.fillStyle   = "#080a18";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.13)";
      ctx.lineWidth   = 1.5;
      ctx.stroke();

      // Shiny dome highlight
      const hub = ctx.createRadialGradient(
        CX - HUB_R * 0.28, CY - HUB_R * 0.28, 0,
        CX, CY, HUB_R
      );
      hub.addColorStop(0,   "rgba(255,255,255,0.82)");
      hub.addColorStop(0.38,"rgba(200,215,255,0.38)");
      hub.addColorStop(1,   "rgba(30,40,90,0.10)");
      ctx.beginPath();
      ctx.arc(CX, CY, HUB_R, 0, Math.PI * 2);
      ctx.fillStyle = hub;
      ctx.fill();
    }

    // ── Spring-physics RAF loop ───────────────────────────────────────────────
    // Frame-rate independent: normalise dt against 60fps baseline.
    // K=0.13 stiffness, D=0.78 damping → fast response, slight natural overshoot.
    const K = 0.13;
    const D = 0.78;
    let lastTs = 0;

    function loop(ts: number) {
      const dt  = Math.min((ts - lastTs) / 16.667, 3); // cap at 3× a 60fps frame
      lastTs = ts;

      const target = speedRef.current;
      const cur    = dispRef.current;
      const vel    = velRef.current;

      const delta  = target - cur;
      const newVel = (vel + delta * K * dt) * Math.pow(D, dt);

      if (Math.abs(delta) < 0.02 && Math.abs(newVel) < 0.02) {
        dispRef.current = target;
        velRef.current  = 0;
      } else {
        dispRef.current = cur + newVel * dt;
        velRef.current  = newVel;
      }

      draw(dispRef.current);
      loopRef.current = requestAnimationFrame(loop);
    }

    loopRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(loopRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // empty deps — speedRef read by reference inside loop

  const display = speed < 10 ? speed.toFixed(1) : Math.round(speed).toString();

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 460, margin: "0 auto" }}>
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "auto" }}
      />
      {/*
        Readout overlay: positioned at the optical centre of the canvas.
        CY / H ≈ (R+40) / (R*1.5+AW+62) ≈ 52–55% down, so 50% top aligns
        the number just above the hub.
      */}
      <div
        style={{
          position:  "absolute",
          left:      "50%",
          top:       "52%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            fontFamily:  "'Syne', sans-serif",
            fontSize:    "clamp(32px, 9.5vw, 54px)",
            fontWeight:  800,
            lineHeight:  1,
            letterSpacing: "-2px",
            background:  "linear-gradient(135deg, #3b82f6, #06b6d4)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor:  "transparent",
            backgroundClip: "text",
          }}
        >
          {display}
        </div>
        <div style={{ fontSize: 13, color: "rgba(240,244,255,0.32)", marginTop: 5, letterSpacing: "0.4px" }}>
          {phase === "upload" ? "Mbps ↑" : "Mbps ↓"}
        </div>
      </div>
    </div>
  );
}
