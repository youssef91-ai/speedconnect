"use client";

import { useEffect, useRef } from "react";

interface SpeedGaugeProps {
  speed: number;
  maxSpeed?: number;
  phase?: string;
}

// ── Log-scale constants (derived analytically) ─────────────────────────────
// We need: pct(500) = 0.5 exactly when MAX = 5000
// Solving log(1+500/k) / log(1+5000/k) = 0.5  =>  k = 62.5
const LOG_K   = 62.5;
const LOG_MAX = 5000;                          // gauge always covers 0..5000 Mbps
const LOG_DENOM = Math.log(1 + LOG_MAX / LOG_K); // log(81) ≈ 4.394

function speedToPct(v: number): number {
  const clamped = Math.min(Math.max(v, 0), LOG_MAX);
  return Math.log(1 + clamped / LOG_K) / LOG_DENOM;
}

function hexToRgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function SpeedGauge({ speed, phase }: SpeedGaugeProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const speedRef   = useRef(speed);
  const displayRef = useRef(0);
  const velRef     = useRef(0);
  const loopRef    = useRef<number>(0);
  const bootedRef  = useRef(false);

  speedRef.current = speed;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || bootedRef.current) return;
    bootedRef.current = true;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    // Responsive: size to container width on first boot
    const containerW = Math.min(canvas.parentElement?.clientWidth ?? 420, 480);
    const W = containerW;
    const H = Math.round(W * 0.62);  // ~half-circle + label room

    canvas.width  = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width  = `${W}px`;
    canvas.style.height = `${H}px`;

    const ctx = canvas.getContext("2d")!;
    ctx.scale(DPR, DPR);

    // ── Geometry ────────────────────────────────────────────────────────
    const CX     = W / 2;
    const CY     = H - Math.round(H * 0.18);   // pivot above bottom
    const R      = Math.round(W * 0.43);        // arc radius scales with width

    // 500 Mbps at exact top-center: that's angle = -π/2 (pointing straight up).
    // Total sweep = 240°.  Half-sweep = 120°.
    // So: SA = -π/2 - 120° = -π/2 - 2π/3
    //         = -π(1/2 + 2/3) = -π(7/6)
    const HALF_SWEEP = (Math.PI * 2) / 3;      // 120° each side
    const SA = -(Math.PI / 2) - HALF_SWEEP;     // start bottom-left
    const EA =  (Math.PI / 2) + HALF_SWEEP;     // end  bottom-right
    const SWEEP = EA - SA;                       // 240° total

    function speedToAngle(v: number): number {
      return SA + SWEEP * speedToPct(v);
    }

    // ── Color for arc position ───────────────────────────────────────────
    // Matches reference: cyan (left) → blue (mid) → violet/purple (right)
    function arcGradient(startA: number, endA: number) {
      const x0 = CX + R * Math.cos(startA), y0 = CY + R * Math.sin(startA);
      const x1 = CX + R * Math.cos(endA),   y1 = CY + R * Math.sin(endA);
      const g   = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0,    "#00e5ff");   // cyan
      g.addColorStop(0.30, "#2979ff");   // blue
      g.addColorStop(0.65, "#651fff");   // deep violet
      g.addColorStop(1,    "#d500f9");   // magenta/purple
      return g;
    }

    // ── Tick mark positions ──────────────────────────────────────────────
    const MAJOR_MARKS = [
      { v: 0,    label: "0"    },
      { v: 5,    label: "5"    },
      { v: 10,   label: "10"   },
      { v: 50,   label: "50"   },
      { v: 100,  label: "100"  },
      { v: 200,  label: "200"  },
      { v: 250,  label: "250"  },
      { v: 500,  label: "500"  },
      { v: 750,  label: "750"  },
      { v: 1000, label: "1000" },
      { v: 2500, label: "2500" },
      { v: 3000, label: "3000" },
      { v: 4000, label: "4000" },
      { v: 5000, label: "5000" },
    ];

    // Minor tick: evenly spaced in log-pct space between each pair of majors
    function buildMinorTicks(): number[] {
      const minors: number[] = [];
      for (let i = 0; i < MAJOR_MARKS.length - 1; i++) {
        const p0 = speedToPct(MAJOR_MARKS[i].v);
        const p1 = speedToPct(MAJOR_MARKS[i + 1].v);
        const steps = 4;  // 3 minor ticks between each pair of majors
        for (let j = 1; j < steps; j++) {
          minors.push(p0 + (p1 - p0) * (j / steps));
        }
      }
      return minors;
    }
    const MINOR_TICKS = buildMinorTicks();

    // Font size scales with gauge radius
    const labelFS   = Math.max(9, Math.round(R * 0.075));
    const labelR    = R - Math.round(R * 0.22);  // inside the arc

    // ── Draw ─────────────────────────────────────────────────────────────
    function draw(v: number) {
      ctx.clearRect(0, 0, W, H);

      const pct  = speedToPct(v);
      const endA = SA + SWEEP * pct;

      const ARC_W = Math.round(R * 0.115);  // arc thickness proportional to radius

      // ── 1. Outer shadow ring ──────────────────────────────────────────
      ctx.beginPath();
      ctx.arc(CX, CY, R + ARC_W * 0.6, SA, EA);
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth   = ARC_W + 10;
      ctx.lineCap     = "butt";
      ctx.stroke();

      // ── 2. Background track ───────────────────────────────────────────
      ctx.beginPath();
      ctx.arc(CX, CY, R, SA, EA);
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth   = ARC_W;
      ctx.lineCap     = "butt";
      ctx.stroke();

      // ── 3. Minor tick marks ───────────────────────────────────────────
      MINOR_TICKS.forEach(p => {
        const a  = SA + SWEEP * p;
        const r1 = R + ARC_W * 0.55;
        const r2 = R + ARC_W * 0.55 - Math.round(R * 0.04);
        ctx.beginPath();
        ctx.moveTo(CX + r1 * Math.cos(a), CY + r1 * Math.sin(a));
        ctx.lineTo(CX + r2 * Math.cos(a), CY + r2 * Math.sin(a));
        ctx.strokeStyle = "rgba(255,255,255,0.18)";
        ctx.lineWidth   = 0.9;
        ctx.stroke();
      });

      // ── 4. Major tick marks ───────────────────────────────────────────
      MAJOR_MARKS.forEach(m => {
        const a  = speedToAngle(m.v);
        const r1 = R + ARC_W * 0.55;
        const r2 = R + ARC_W * 0.55 - Math.round(R * 0.07);
        ctx.beginPath();
        ctx.moveTo(CX + r1 * Math.cos(a), CY + r1 * Math.sin(a));
        ctx.lineTo(CX + r2 * Math.cos(a), CY + r2 * Math.sin(a));
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.lineWidth   = 1.5;
        ctx.stroke();
      });

      // ── 5. Labels INSIDE the arc ─────────────────────────────────────
      MAJOR_MARKS.forEach(m => {
        const a  = speedToAngle(m.v);
        const lx = CX + labelR * Math.cos(a);
        const ly = CY + labelR * Math.sin(a);
        ctx.fillStyle    = "rgba(255,255,255,0.7)";
        ctx.font         = `600 ${labelFS}px 'DM Sans',sans-serif`;
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(m.label, lx, ly);
      });

      // ── 6. Glowing progress arc ───────────────────────────────────────
      if (pct > 0.002) {
        const grad = arcGradient(SA, endA);

        // Outer glow (wider, low alpha — intensity scales with speed)
        const glowAlpha = 0.18 + pct * 0.22;
        ctx.beginPath();
        ctx.arc(CX, CY, R, SA, endA);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = ARC_W + Math.round(R * 0.1);
        ctx.lineCap     = "butt";
        ctx.globalAlpha = glowAlpha;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Main bright arc
        ctx.beginPath();
        ctx.arc(CX, CY, R, SA, endA);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = ARC_W;
        ctx.lineCap     = "butt";
        ctx.stroke();

        // ── 7. Tip glow dot ───────────────────────────────────────────
        const tx = CX + R * Math.cos(endA);
        const ty = CY + R * Math.sin(endA);

        // Pick tip color from gradient position
        const tipFrac = pct;
        let tipHex: string;
        if (tipFrac < 0.30)      tipHex = "#2979ff";
        else if (tipFrac < 0.65) tipHex = "#651fff";
        else                     tipHex = "#d500f9";

        const bloom = ctx.createRadialGradient(tx, ty, 0, tx, ty, ARC_W * 2.2);
        bloom.addColorStop(0,   hexToRgba(tipHex, 0.65));
        bloom.addColorStop(0.4, hexToRgba(tipHex, 0.25));
        bloom.addColorStop(1,   "transparent");
        ctx.beginPath();
        ctx.arc(tx, ty, ARC_W * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = bloom;
        ctx.fill();

        const core = ctx.createRadialGradient(tx, ty, 0, tx, ty, ARC_W * 0.55);
        core.addColorStop(0,   "rgba(255,255,255,1)");
        core.addColorStop(0.5, hexToRgba(tipHex, 0.9));
        core.addColorStop(1,   "transparent");
        ctx.beginPath();
        ctx.arc(tx, ty, ARC_W * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = core;
        ctx.fill();
      }

      // ── 8. Needle ─────────────────────────────────────────────────────
      const needleLen = R - ARC_W * 0.3;  // almost reaches the arc
      const needleW   = Math.max(1.8, R * 0.014);

      ctx.save();
      ctx.translate(CX, CY);
      ctx.rotate(endA);

      // Drop shadow
      ctx.shadowColor   = "rgba(0,0,0,0.7)";
      ctx.shadowBlur    = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 3;

      // Tapered needle body
      ctx.beginPath();
      ctx.moveTo(-Math.round(R * 0.085),  needleW * 1.1);
      ctx.lineTo(needleLen,               needleW * 0.35);
      ctx.lineTo(needleLen,              -needleW * 0.35);
      ctx.lineTo(-Math.round(R * 0.085), -needleW * 1.1);
      ctx.closePath();
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fill();

      // Specular highlight stripe along the needle
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(-Math.round(R * 0.07), 0);
      ctx.lineTo(needleLen - 4,          0);
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth   = needleW * 0.4;
      ctx.stroke();

      ctx.restore();

      // ── 9. Hub ────────────────────────────────────────────────────────
      const hubR = Math.round(R * 0.085);

      ctx.beginPath();
      ctx.arc(CX, CY, hubR + 2, 0, Math.PI * 2);
      ctx.fillStyle = "#080c1a";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth   = 1.5;
      ctx.stroke();

      const hubGrad = ctx.createRadialGradient(
        CX - hubR * 0.3, CY - hubR * 0.3, 0,
        CX, CY, hubR
      );
      hubGrad.addColorStop(0,   "rgba(255,255,255,0.75)");
      hubGrad.addColorStop(0.4, "rgba(200,210,255,0.35)");
      hubGrad.addColorStop(1,   "rgba(50,60,120,0.15)");
      ctx.beginPath();
      ctx.arc(CX, CY, hubR, 0, Math.PI * 2);
      ctx.fillStyle = hubGrad;
      ctx.fill();
    }

    // ── Spring-physics RAF loop ───────────────────────────────────────────
    const STIFFNESS = 0.16;
    const DAMPING   = 0.74;
    const MIN_D     = 0.01;

    function loop() {
      const target = speedRef.current;
      const cur    = displayRef.current;
      const vel    = velRef.current;
      const delta  = target - cur;
      const newVel = (vel + delta * STIFFNESS) * DAMPING;
      const settled = Math.abs(delta) < MIN_D && Math.abs(newVel) < MIN_D;
      displayRef.current = settled ? target : cur + newVel;
      velRef.current     = settled ? 0 : newVel;
      draw(displayRef.current);
      loopRef.current = requestAnimationFrame(loop);
    }

    loop();
    return () => cancelAnimationFrame(loopRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displaySpeed = speed < 10 ? speed.toFixed(1) : Math.round(speed).toString();

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 480,
        margin: "0 auto",
        aspectRatio: "1 / 0.62",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
      {/* Speed readout — centered, sits below midpoint of canvas */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "12%",
          transform: "translateX(-50%)",
          textAlign: "center",
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(36px, 11vw, 58px)",
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
            color: "rgba(240,244,255,0.35)",
            marginTop: 4,
            letterSpacing: "0.5px",
          }}
        >
          {phase === "upload" ? "Mbps ↑" : "Mbps ↓"}
        </div>
      </div>
    </div>
  );
}
