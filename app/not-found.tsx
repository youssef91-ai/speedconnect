import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "24px",
        background: "#04060f",
        color: "#f0f4ff",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 120,
          fontWeight: 800,
          letterSpacing: "-4px",
          lineHeight: 1,
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          marginBottom: 24,
        }}
      >
        404
      </div>
      <h1
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 28,
          fontWeight: 700,
          marginBottom: 12,
          letterSpacing: "-1px",
        }}
      >
        Page not found
      </h1>
      <p style={{ color: "rgba(240,244,255,0.55)", marginBottom: 32, maxWidth: 360 }}>
        The page you were looking for doesn't exist or has been moved.
      </p>
      <Link
        href="/"
        style={{
          padding: "12px 28px",
          borderRadius: 12,
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
          color: "#fff",
          textDecoration: "none",
          fontFamily: "'Syne', sans-serif",
          fontWeight: 600,
          fontSize: 15,
        }}
      >
        ← Back to Speed Test
      </Link>
    </div>
  );
}
