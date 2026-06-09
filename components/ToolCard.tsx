"use client";

interface ToolCardProps {
  icon: string;
  name: string;
  description: string;
  href?: string;
}

export function ToolCard({ icon, name, description, href = "#" }: ToolCardProps) {
  return (
    <a
      href={href}
      style={{
        display: "block",
        padding: "28px 24px",
        borderRadius: 22,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        textDecoration: "none",
        color: "inherit",
        position: "relative",
        overflow: "hidden",
        transition: "all .25s",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.borderColor = "rgba(255,255,255,0.13)";
        el.style.transform = "translateY(-3px)";
        el.style.boxShadow = "0 16px 40px rgba(0,0,0,0.3)";
        const before = el.querySelector(".tc-hover-bg") as HTMLElement;
        if (before) before.style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.borderColor = "rgba(255,255,255,0.07)";
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "none";
        const before = el.querySelector(".tc-hover-bg") as HTMLElement;
        if (before) before.style.opacity = "0";
      }}
    >
      <div
        className="tc-hover-bg"
        style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at 50% 0%, rgba(59,130,246,0.08), transparent 65%)",
          opacity: 0, transition: "opacity .3s", pointerEvents: "none",
        }}
      />
      <div
        style={{
          width: 48, height: 48, borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, marginBottom: 18,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 17, fontWeight: 700, marginBottom: 7, color: "#f0f4ff",
        }}
      >
        {name}
      </div>
      <div style={{ fontSize: 13, color: "rgba(240,244,255,0.55)", lineHeight: 1.6 }}>
        {description}
      </div>
      <div
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          fontSize: 12, color: "#3b82f6", marginTop: 14, fontWeight: 500, opacity: 0.8,
        }}
      >
        Open tool →
      </div>
    </a>
  );
}
