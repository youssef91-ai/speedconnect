"use client";

import { useEffect, useRef } from "react";

interface SpeedGaugeProps {
  speed: number;
  maxSpeed?: number;
  phase?: string;
}

export function SpeedGauge({ speed, maxSpeed = 1000, phase }: SpeedGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentRef = useRef(0);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = 320 * DPR;
    canvas.height = 200 * DPR;
    canvas.style.width = "320px";
    canvas.style.height = "200px";
    ctx.scale(DPR, DPR);

    const CX = 160, CY = 178, R = 138;
    const SA = Math.PI * 0.75, EA = Math.PI * 2.25;
    const SWEEP = EA - SA;

    function draw(v: number) {
      ctx.clearRect(0, 0, 320, 200);
      const pct = Math.min(v / maxSpeed, 1);

      // Background arc
      ctx.beginPath();
      ctx.arc(CX, CY, R, SA, EA);
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 14;
      ctx.lineCap = "round";
      ctx.stroke();

      // Inner glow ring
      ctx.beginPath();
      ctx.arc(CX, CY, R - 18, SA, EA);
      ctx.strokeStyle = "rgba(255,255,255,0.02)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Tick marks
      const tickLabels = [0, 100, 200, 400, 600, 800, "1G"];
      for (let i = 0; i <= 20; i++) {
        const a = SA + (SWEEP * i) / 20;
        const major = i % 4 === 0;
        const r1 = R - 20, r2 = r1 - (major ? 12 : 6);
        ctx.beginPath();
        ctx.moveTo(CX + r1 * Math.cos(a), CY + r1 * Math.sin(a));
        ctx.lineTo(CX + r2 * Math.cos(a), CY + r2 * Math.sin(a));
        ctx.strokeStyle = major ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.09)";
        ctx.lineWidth = major ? 1.5 : 0.8;
        ctx.stroke();
        if (major) {
          const lr = R - 38;
          ctx.fillStyle = "rgba(255,255,255,0.22)";
          ctx.font = "9px 'DM Sans', sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            String(tickLabels[i / 4]),
            CX + lr * Math.cos(a),
            CY + lr * Math.sin(a)
          );
        }
      }

      if (pct > 0.005) {
        // Colored arc
        const endA = SA + SWEEP * pct;
        const grad = ctx.createLinearGradient(
          CX + R * Math.cos(SA), CY + R * Math.sin(SA),
          CX + R * Math.cos(endA), CY + R * Math.sin(endA)
        );
        if (pct < 0.2) {
          grad.addColorStop(0, "#ef4444");
          grad.addColorStop(1, "#f97316");
        } else if (pct < 0.45) {
          grad.addColorStop(0, "#f97316");
          grad.addColorStop(1, "#3b82f6");
        } else if (pct < 0.7) {
          grad.addColorStop(0, "#3b82f6");
          grad.addColorStop(1, "#06b6d4");
        } else {
          grad.addColorStop(0, "#06b6d4");
          grad.addColorStop(1, "#10b981");
        }

        ctx.beginPath();
        ctx.arc(CX, CY, R, SA, endA);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 14;
        ctx.lineCap = "round";
        ctx.stroke();

        // Tip glow
        const tx = CX + R * Math.cos(endA);
        const ty = CY + R * Math.sin(endA);
        const glowGrad = ctx.createRadialGradient(tx, ty, 0, tx, ty, 16);
        glowGrad.addColorStop(0, pct > 0.5 ? "rgba(6,182,212,0.5)" : "rgba(59,130,246,0.5)");
        glowGrad.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(tx, ty, 16, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();

        // Needle
        ctx.save();
        ctx.translate(CX, CY);
        ctx.rotate(endA);
        ctx.beginPath();
        ctx.moveTo(-7, 0);
        ctx.lineTo(R - 22, 0);
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.restore();
      }

      // Center hub
      const hubGrad = ctx.createRadialGradient(CX, CY, 0, CX, CY, 8);
      hubGrad.addColorStop(0, "rgba(255,255,255,0.8)");
      hubGrad.addColorStop(1, "rgba(255,255,255,0.2)");
      ctx.beginPath();
      ctx.arc(CX, CY, 7, 0, Math.PI * 2);
      ctx.fillStyle = hubGrad;
      ctx.fill();
    }

    function animate() {
      currentRef.current += (speed - currentRef.current) * 0.09;
      draw(currentRef.current);
      animRef.current = requestAnimationFrame(animate);
    }

    cancelAnimationFrame(animRef.current);
    animate();
    return () => cancelAnimationFrame(animRef.current);
  }, [speed, maxSpeed]);

  const displaySpeed = speed < 10 ? speed.toFixed(1) : Math.round(speed).toString();

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
