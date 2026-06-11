"use client";

export function Footer() {
  const colStyle: React.CSSProperties = {};

  const cols = [
    {
      heading: "Tools",
      links: [
        { label: "Speed Test", href: "/" },
        { label: "All Tools", href: "/tools" },
        { label: "What's My IP", href: "/tools/my-ip" },
        { label: "Ping Test", href: "/tools/ping-test" },
        { label: "DNS Lookup", href: "/tools/dns-lookup" },
        { label: "IP Lookup", href: "/tools/ip-lookup" },
        { label: "VPN Detector", href: "/tools/vpn-detector" },
        { label: "Speed History", href: "/tools/speed-history" },
      ],
    },
    {
      heading: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Blog", href: "/blog" },
        { label: "Careers", href: "#" },
        { label: "Press Kit", href: "#" },
        { label: "API", href: "#" },
      ],
    },
    {
      heading: "Legal",
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Cookie Settings", href: "#" },
        { label: "GDPR", href: "#" },
        { label: "Security", href: "#" },
      ],
    },
  ];

  return (
    <footer style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "60px 0 36px" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: 48,
            marginBottom: 48,
          }}
          className="footer-grid"
        >
          {/* Brand */}
          <div>
            <div
              style={{
                display: "flex", alignItems: "center", gap: 10,
                fontFamily: "'Syne', sans-serif", fontSize: 19, fontWeight: 700, color: "#f0f4ff",
              }}
            >
              <div
                style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800, color: "#fff",
                }}
              >
                S
              </div>
              SpeedConnect<span style={{ color: "#3b82f6" }}>.ai</span>
            </div>
            <p
              style={{
                fontSize: 13, color: "rgba(240,244,255,0.28)",
                marginTop: 12, maxWidth: 220, lineHeight: 1.7,
              }}
            >
              The most accurate internet speed test. Real measurements from real connections,
              displayed beautifully.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              {["𝕏", "in", "▶", "gh"].map((s) => (
                <div
                  key={s}
                  style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, cursor: "pointer",
                    color: "rgba(240,244,255,0.55)",
                    transition: "background .2s, border-color .2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.09)";
                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.13)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.06)";
                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.heading}>
              <div
                style={{
                  fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 600,
                  marginBottom: 14, color: "rgba(240,244,255,0.55)",
                }}
              >
                {col.heading}
              </div>
              <ul style={{ listStyle: "none" }}>
                {col.links.map((link) => (
                  <li key={link.label} style={{ marginBottom: 8 }}>
                    <a
                      href={link.href}
                      style={{
                        fontSize: 13, color: "rgba(240,244,255,0.28)",
                        textDecoration: "none", transition: "color .2s",
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(240,244,255,0.55)")}
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(240,244,255,0.28)")}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            paddingTop: 28,
            borderTop: "1px solid rgba(255,255,255,0.07)",
            flexWrap: "wrap", gap: 12,
          }}
        >
          <div style={{ fontSize: 12, color: "rgba(240,244,255,0.28)" }}>
            © 2026 SpeedConnect.ai — All rights reserved
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#10b981" }}>
            <span
              style={{
                width: 5, height: 5, borderRadius: "50%", background: "#10b981",
                display: "inline-block", animation: "blink 2.5s infinite",
              }}
            />
            All systems operational
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {["Status", "Changelog", "Support"].map((l) => (
              <a
                key={l}
                href="#"
                style={{
                  fontSize: 12, color: "rgba(240,244,255,0.28)",
                  textDecoration: "none", transition: "color .2s",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(240,244,255,0.55)")}
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(240,244,255,0.28)")}
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
        }
        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}
