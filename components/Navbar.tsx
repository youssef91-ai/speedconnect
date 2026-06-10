"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 200,
        padding: "14px 0",
        background: scrolled ? "rgba(4,6,15,0.92)" : "rgba(4,6,15,0.75)",
        backdropFilter: "blur(24px) saturate(1.8)",
        borderBottom: `1px solid ${scrolled ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.07)"}`,
        transition: "all .3s",
      }}
    >
      <div
        style={{
          maxWidth: 1160, margin: "0 auto", padding: "0 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex", alignItems: "center", gap: 10,
            fontFamily: "'Syne', sans-serif", fontSize: 19, fontWeight: 700,
            color: "#f0f4ff", textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 30, height: 30, borderRadius: 8,
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0,
            }}
          >
            S
          </div>
          SpeedConnect<span style={{ color: "#3b82f6" }}>.ai</span>
        </Link>

        {/* Links — hidden on mobile */}
        <ul
          style={{
            display: "flex", gap: 28, listStyle: "none",
          }}
          className="nav-links-desktop"
        >
          {[
            { label: "Features", href: "/#features" },
            { label: "Tools", href: "/tools" },
            { label: "Blog", href: "/blog" },
            { label: "FAQ", href: "/#faq" },
          ].map(({ label, href }) => (
            <li key={label}>
              <a
                href={href}
                style={{
                  color: "rgba(240,244,255,0.55)", fontSize: 14,
                  textDecoration: "none", transition: "color .2s",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color = "#f0f4ff")}
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(240,244,255,0.55)")}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={() => {
            if (pathname === "/") {
              // Already on homepage — scroll the card into view then start the test.
              const el = document.getElementById("speed-test");
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
              }
              // Fire the test regardless — if already running this is a no-op via the hook's toggle.
              window.__speedTestRun?.();
            } else {
              // On another page — navigate home, then scroll + start after DOM loads.
              router.push("/");
              let attempts = 0;
              const poll = setInterval(() => {
                const el = document.getElementById("speed-test");
                if (el) {
                  clearInterval(poll);
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                  // Small delay so the scroll animation begins before the test UI changes.
                  setTimeout(() => window.__speedTestRun?.(), 400);
                } else if (++attempts > 40) {
                  clearInterval(poll);
                }
              }, 100);
            }
          }}
          style={{
            padding: "8px 18px", borderRadius: 100,
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            color: "#fff", fontSize: 13, fontWeight: 500,
            textDecoration: "none", border: "none", cursor: "pointer",
            transition: "opacity .2s, transform .2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = "0.88";
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = "1";
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          }}
        >
          Run Test ↗
        </button>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .nav-links-desktop { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
