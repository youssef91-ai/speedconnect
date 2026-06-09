"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "How does SpeedConnect measure speed accurately?",
    a: "SpeedConnect runs 4 parallel download streams and 3 parallel upload streams for 10 and 8 seconds respectively. This saturates your connection the same way real-world usage does. Single-stream tests underreport by 30–60% on fast connections. Ping is measured via 8 sequential HEAD requests with the top 10% of outliers trimmed before averaging.",
  },
  {
    q: "Why does my result differ from my ISP's advertised speed?",
    a: "ISPs advertise maximum theoretical speeds under ideal conditions. Real-world speeds depend on your Wi-Fi signal quality, router hardware, network congestion at the local node, the distance to our test server, and how many devices share your connection. Ethernet cable connections typically return 10–30% higher speeds than Wi-Fi.",
  },
  {
    q: "What is jitter and why does it matter?",
    a: "Jitter is the variation in ping latency over time — measured as the average absolute deviation from the mean. A connection with 20ms average ping but 15ms jitter will feel worse for gaming and video calls than a 35ms/2ms connection. High jitter (above 20ms) causes choppy calls, rubber-banding in games, and VoIP degradation even when average ping looks acceptable.",
  },
  {
    q: "How much data does a full test use?",
    a: "A typical full test uses 200–600 MB depending on your connection speed. Faster connections transfer more data in the same measurement window. On a 1 Gbps connection, a full test may consume 1–2 GB. Keep this in mind on metered mobile connections — you can stop any test early by clicking the button again.",
  },
  {
    q: "Is my data stored or shared with third parties?",
    a: "Test results are stored anonymously to power global speed maps and ISP rankings. Your IP is never linked to your results in any public data. Geolocation lookups use your IP transiently and are not logged against your results. We never sell personal data.",
  },
  {
    q: "What's a good score for gaming vs. streaming vs. remote work?",
    a: "Gaming needs low ping (under 30ms) and low jitter (under 10ms) — raw speed matters less. 4K streaming needs at least 25 Mbps download per stream but ping is irrelevant. Remote work needs balanced upload (10+ Mbps) and stable ping under 100ms. Our quality dashboard shows you exactly which use cases your connection supports.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section
      id="faq"
      style={{ padding: "96px 0 80px" }}
    >
      <div
        style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}
      >
        <div className="section-eyebrow">FAQ</div>
        <h2 className="section-title">Common questions</h2>

        <div style={{ maxWidth: 700, margin: "48px auto 0" }}>
          {FAQS.map((item, i) => (
            <div
              key={i}
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 0",
                  background: "none",
                  border: "none",
                  color: open === i ? "#3b82f6" : "#f0f4ff",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: "pointer",
                  textAlign: "left",
                  gap: 16,
                  transition: "color .2s",
                }}
              >
                <span>{item.q}</span>
                <span
                  style={{
                    fontSize: 22,
                    color: open === i ? "#3b82f6" : "rgba(240,244,255,0.28)",
                    flexShrink: 0,
                    transform: open === i ? "rotate(45deg)" : "none",
                    transition: "transform .28s, color .2s",
                    display: "inline-block",
                  }}
                >
                  +
                </span>
              </button>
              <div
                style={{
                  fontSize: 14,
                  color: "rgba(240,244,255,0.55)",
                  lineHeight: 1.8,
                  maxHeight: open === i ? 240 : 0,
                  overflow: "hidden",
                  transition: "max-height .32s ease, padding .28s",
                  paddingBottom: open === i ? 20 : 0,
                }}
              >
                {item.a}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
