"use client";

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  active?: boolean;
  onClick?: () => void;
}

export function FeatureCard({ icon, title, description, active, onClick }: FeatureCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        gap: 16,
        padding: "22px 20px",
        borderRadius: 22,
        cursor: "pointer",
        border: `1px solid ${active ? "rgba(255,255,255,0.13)" : "transparent"}`,
        background: active ? "rgba(255,255,255,0.06)" : "transparent",
        transition: "all .25s",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)";
          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLDivElement).style.background = "transparent";
          (e.currentTarget as HTMLDivElement).style.borderColor = "transparent";
        }
      }}
    >
      <div
        style={{
          width: 42, height: 42, flexShrink: 0, borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 16, fontWeight: 700, marginBottom: 4, color: "#f0f4ff",
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 13, color: "rgba(240,244,255,0.55)", lineHeight: 1.6 }}>
          {description}
        </div>
      </div>
    </div>
  );
}
