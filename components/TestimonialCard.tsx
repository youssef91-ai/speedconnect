"use client";

interface TestimonialCardProps {
  quote: string;
  name: string;
  role: string;
  initials: string;
  avatarGradient: string;
  stars?: number;
}

export function TestimonialCard({
  quote, name, role, initials, avatarGradient, stars = 5,
}: TestimonialCardProps) {
  return (
    <div
      style={{
        padding: "28px 24px",
        borderRadius: 22,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        transition: "border-color .25s",
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.13)")}
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)")}
    >
      <div style={{ color: "#f59e0b", fontSize: 13, marginBottom: 14, letterSpacing: 3 }}>
        {"★".repeat(stars)}
      </div>
      <p
        style={{
          fontSize: 14, color: "rgba(240,244,255,0.55)",
          lineHeight: 1.75, marginBottom: 20, fontStyle: "italic",
        }}
      >
        "{quote}"
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 38, height: 38, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0,
            background: avatarGradient,
          }}
        >
          {initials}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#f0f4ff" }}>{name}</div>
          <div style={{ fontSize: 11, color: "rgba(240,244,255,0.28)" }}>{role}</div>
        </div>
      </div>
    </div>
  );
}
