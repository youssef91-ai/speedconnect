import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "About — SpeedConnect.ai",
  description: "Learn about SpeedConnect.ai — the most accurate internet speed test, built with real multi-stream measurement technology.",
};

export default function AboutPage() {
  return (
    <PageShell>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "64px 24px 96px" }}>
        {/* Header */}
        <div style={{ marginBottom: 56 }}>
          <div
            style={{
              fontSize: 11, color: "#3b82f6", textTransform: "uppercase",
              letterSpacing: "2.5px", fontWeight: 600, marginBottom: 14,
            }}
          >
            About
          </div>
          <h1
            style={{
              fontFamily: "'Syne', sans-serif", fontSize: "clamp(36px,5vw,60px)",
              fontWeight: 800, letterSpacing: "-2px", lineHeight: 1.08, marginBottom: 20,
            }}
          >
            Built for accuracy,<br />not approximations
          </h1>
          <p style={{ fontSize: 18, color: "rgba(240,244,255,0.55)", lineHeight: 1.7, fontWeight: 300 }}>
            SpeedConnect.ai was created because every existing speed test was either inaccurate,
            ugly, or plastered with ads. We fixed all three.
          </p>
        </div>

        {/* Story */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 22, padding: "36px 32px", marginBottom: 24,
          }}
        >
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 16, letterSpacing: "-0.5px" }}>
            The problem with other speed tests
          </h2>
          <p style={{ color: "rgba(240,244,255,0.55)", lineHeight: 1.8, marginBottom: 14 }}>
            Most speed tests use a single TCP connection to measure your download speed. On modern
            high-speed connections (100 Mbps+), a single connection rarely saturates your link —
            it measures the performance of one thread, not your actual bandwidth.
          </p>
          <p style={{ color: "rgba(240,244,255,0.55)", lineHeight: 1.8 }}>
            SpeedConnect uses 4 parallel download streams and 3 parallel upload streams, matching
            how real applications actually use your connection — browsers open multiple connections,
            streaming services buffer ahead, and backup software runs concurrent transfers.
          </p>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 22, padding: "36px 32px", marginBottom: 24,
          }}
        >
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 16, letterSpacing: "-0.5px" }}>
            Our measurement methodology
          </h2>
          {[
            { title: "Ping & Jitter", body: "8 sequential HEAD requests to low-latency endpoints. The top 10% of outliers are trimmed before averaging, giving you a statistically robust latency figure. Jitter is calculated as the average absolute deviation from the mean." },
            { title: "Download speed", body: "4 parallel HTTP/2 streams, each fetching large binary payloads from Cloudflare's global network for 10 seconds. A 300 ms sliding window calculates live throughput updates. The final result is total bytes × 8 ÷ total time." },
            { title: "Upload speed", body: "3 parallel workers each POST pre-generated 2 MB payloads for 8 seconds. A 400 ms sliding window tracks live throughput. The same byte-accounting formula produces the final Mbps figure." },
          ].map((item) => (
            <div key={item.title} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontWeight: 600, marginBottom: 6, color: "#f0f4ff" }}>{item.title}</div>
              <p style={{ fontSize: 14, color: "rgba(240,244,255,0.55)", lineHeight: 1.7 }}>{item.body}</p>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24,
          }}
        >
          {[
            { n: "12M+", l: "Tests run" },
            { n: "185", l: "Countries" },
            { n: "99.97%", l: "Uptime" },
          ].map((s) => (
            <div
              key={s.l}
              style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16, padding: "24px 16px", textAlign: "center",
              }}
            >
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 36, fontWeight: 800, letterSpacing: "-1.5px", marginBottom: 4, background: "linear-gradient(135deg,#3b82f6,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                {s.n}
              </div>
              <div style={{ fontSize: 13, color: "rgba(240,244,255,0.35)" }}>{s.l}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 22, padding: "36px 32px",
          }}
        >
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 16, letterSpacing: "-0.5px" }}>
            Privacy & data
          </h2>
          <p style={{ color: "rgba(240,244,255,0.55)", lineHeight: 1.8, marginBottom: 14 }}>
            Speed test results are stored anonymously in aggregate to power our global speed maps
            and ISP rankings. Your IP address is never linked to your test results in any
            public-facing data.
          </p>
          <p style={{ color: "rgba(240,244,255,0.55)", lineHeight: 1.8 }}>
            Geolocation is fetched at test time and displayed to you — it is not logged against
            your results. We do not serve ads, sell data, or use your results for any purpose
            beyond aggregate network intelligence.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
