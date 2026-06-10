"use client";

import { useEffect, useRef } from "react";

interface SpeedGaugeProps {
  speed: number;
  maxSpeed?: number;
  phase?: string;
}

export function SpeedGauge({ speed, maxSpeed = 1000, phase }: SpeedGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Separate refs so the RAF loop never needs to be restarted on speed changes.
  // speedRef = target speed (written by React on each render)
  // displayRef = current animated value (mutated only inside the RAF loop)
  const speedRef = useRef(speed);
  const displayRef = useRef(0);
  const animRef = useRef<number>(0);
  const startedRef = useRef(false);

  // Keep speedRef in sync with the prop on every render without restarting the loop.
  speedRef.current = speed;

  // Boot the canvas + RAF loop exactly once.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || startedRef.current) return;
    startedRef.current = true;

    const ctx = canvas.getContext("2d")!;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = 320 * DPR;
    canvas.height = 200 * DPR;
    canvas.style.width = "320px";
    canvas.style.height = "200px";
    ctx.scale(DPR, DPR);

    const CX = 160, CY = 178, R = 134;
    const SA = Math.PI * 0.75;           // -225° → start bottom-left
    const EA = Math.PI * 2.25;           //  +45° → end bottom-right
    const SWEEP = EA - SA;               // 270° total sweep

    // ── arc color based on percentage ──────────────────────────────────────
    function arcColor(pct: number): [string, string] {
      if (pct < 0.15) return ["#ef4444", "#f97316"];
      if (pct < 0.40) return ["#f97316", "#3b82f6"];
      if (pct < 0.65) return ["#3b82f6", "#06b6d4"];
      return ["#06b6d4", "#10b981"];
    }

    // ── main draw ──────────────────────────────────────────────────────────
    function draw(v: number) {
      ctx.clearRect(0, 0, 320, 200);
      const pct = Math.min(Math.max(v / maxSpeed, 0), 1);
      const endA = SA + SWEEP * pct;

      // ── 1. background track ────────────────────────────────────────────
      ctx.beginPath();
      ctx.arc(CX, CY, R, SA, EA);
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 12;
      ctx.lineCap = "round";
      ctx.stroke();

      // ── 2. subtle inner ring ───────────────────────────────────────────
      ctx.beginPath();
      ctx.arc(CX, CY, R - 20, SA, EA);
      ctx.strokeStyle = "rgba(255,255,255,0.025)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // ── 3. tick marks ─────────────────────────────────────────────────
      const tickLabels = ["0", "100", "200", "400", "600", "800", "1G"];
      for (let i = 0; i <= 20; i++) {
        const a = SA + (SWEEP * i) / 20;
        const major = i % 4 === 0;
        const r1 = R - 16;
        const r2 = r1 - (major ? 11 : 5);
        ctx.beginPath();
        ctx.moveTo(CX + r1 * Math.cos(a), CY + r1 * Math.sin(a));
        ctx.lineTo(CX + r2 * Math.cos(a), CY + r2 * Math.sin(a));
        ctx.strokeStyle = major ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.10)";
        ctx.lineWidth = major ? 1.5 : 0.8;
        ctx.stroke();
        if (major) {
          const lr = R - 36;
          ctx.fillStyle = "rgba(255,255,255,0.22)";
          ctx.font = "9px 'DM Sans',sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(tickLabels[i / 4], CX + lr * Math.cos(a), CY + lr * Math.sin(a));
        }
      }

      // ── 4. glowing progress arc ───────────────────────────────────────
      if (pct > 0.003) {
        // Gradient runs along the chord from arc-start to arc-end
        const gx0 = CX + R * Math.cos(SA);
        const gy0 = CY + R * Math.sin(SA);
        const gx1 = CX + R * Math.cos(endA);
        const gy1 = CY + R * Math.sin(endA);
        const grad = ctx.createLinearGradient(gx0, gy0, gx1, gy1);
        const [c0, c1] = arcColor(pct);
        grad.addColorStop(0, c0);
        grad.addColorStop(1, c1);

        ctx.beginPath();
        ctx.arc(CX, CY, R, SA, endA);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 12;
        ctx.lineCap = "round";
        ctx.stroke();

        // ── 5. bright glow at the needle tip ──────────────────────────
        const tx = CX + R * Math.cos(endA);
        const ty = CY + R * Math.sin(endA);

        // Outer soft glow
        const outerGlow = ctx.createRadialGradient(tx, ty, 0, tx, ty, 22);
        outerGlow.addColorStop(0, pct > 0.5 ? "rgba(6,182,212,0.45)" : "rgba(59,130,246,0.45)");
        outerGlow.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(tx, ty, 22, 0, Math.PI * 2);
        ctx.fillStyle = outerGlow;
        ctx.fill();

        // Bright core dot
        const innerGlow = ctx.createRadialGradient(tx, ty, 0, tx, ty, 6);
        innerGlow.addColorStop(0, "rgba(255,255,255,0.95)");
        innerGlow.addColorStop(0.5, pct > 0.5 ? "rgba(6,182,212,0.8)" : "rgba(59,130,246,0.8)");
        innerGlow.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(tx, ty, 6, 0, Math.PI * 2);
        ctx.fillStyle = innerGlow;
        ctx.fill();

        // ── 6. needle ────────────────────────────────────────────────
        ctx.save();
        ctx.translate(CX, CY);
        ctx.rotate(endA);

        // Needle shadow for depth
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        // Needle body — longer, tapered via two draws
        ctx.beginPath();
        ctx.moveTo(-10, 1.2);
        ctx.lineTo(R - 18, 0.5);
        ctx.lineTo(R - 18, -0.5);
        ctx.lineTo(-10, -1.2);
        ctx.closePath();
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.fill();

        // Bright center line on needle
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(R - 20, 0);
        ctx.strokeStyle = "rgba(255,255,255,0.6)";
        ctx.lineWidth = 0.6;
        ctx.stroke();

        ctx.restore();
      }

      // ── 7. center hub ────────────────────────────────────────────────
      // Outer ring
      ctx.beginPath();
      ctx.arc(CX, CY, 10, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(30,35,55,1)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Inner highlight
      const hubGrad = ctx.createRadialGradient(CX - 2, CY - 2, 0, CX, CY, 9);
      hubGrad.addColorStop(0, "rgba(255,255,255,0.75)");
      hubGrad.addColorStop(0.5, "rgba(255,255,255,0.3)");
      hubGrad.addColorStop(1, "rgba(255,255,255,0.05)");
      ctx.beginPath();
      ctx.arc(CX, CY, 9, 0, Math.PI * 2);
      ctx.fillStyle = hubGrad;
      ctx.fill();
    }

    // ── RAF loop — runs forever, reads speedRef so never needs restart ──
    function loop() {
      const target = speedRef.current;
      const cur = displayRef.current;

      // Exponential easing: fast approach, smooth settle.
      // Factor 0.12 gives ~60ms to travel halfway — snappy but not jarring.
      const next = cur + (target - cur) * 0.12;

      // Snap to zero when very close to avoid infinite micro-animation.
      displayRef.current = Math.abs(next) < 0.05 ? 0 : next;

      draw(displayRef.current);
      animRef.current = requestAnimationFrame(loop);
    }

    loop();
    return () => cancelAnimationFrame(animRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← empty deps: loop starts once, reads speedRef by reference

  const displaySpeed =
    speed < 10 ? speed.toFixed(1) : Math.round(speed).toString();

  return (
    <div style={{ position: "relative", width: 320, height: 200, margin: "0 auto" }}>
      <canvas ref={canvasRef} />
      <div
        style={{
          position: "absolute",
          bottom: 14,
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 54,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-2px",
            background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {displaySpeed}
        </div>
        <div style={{ fontSize: 13, color: "rgba(240,244,255,0.3)", marginTop: 2 }}>
          {phase === "upload" ? "Mbps ↑" : "Mbps ↓"}
        </div>
      </div>
    </div>
  );
}
