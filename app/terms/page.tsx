import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Terms of Service — SpeedConnect.ai",
  description: "SpeedConnect.ai terms of service and acceptable use policy.",
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 32 }}>
    <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: "-0.5px", marginBottom: 12, color: "#f0f4ff" }}>
      {title}
    </h2>
    <div style={{ fontSize: 15, color: "rgba(240,244,255,0.55)", lineHeight: 1.8 }}>{children}</div>
  </div>
);

export default function TermsPage() {
  return (
    <PageShell>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "64px 24px 96px" }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "2.5px", fontWeight: 600, marginBottom: 14 }}>
            Legal
          </div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(32px,5vw,52px)", fontWeight: 800, letterSpacing: "-2px", lineHeight: 1.08, marginBottom: 16 }}>
            Terms of Service
          </h1>
          <p style={{ fontSize: 14, color: "rgba(240,244,255,0.35)" }}>Last updated: June 1, 2026</p>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 22, padding: "36px 32px" }}>
          <Section title="Acceptance of terms">
            <p>By accessing or using SpeedConnect.ai (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.</p>
          </Section>

          <Section title="Description of service">
            <p>SpeedConnect.ai provides internet speed testing and network diagnostic tools. The Service is provided free of charge for personal and professional use. We reserve the right to modify, suspend, or discontinue the Service at any time without notice.</p>
          </Section>

          <Section title="Acceptable use">
            <p style={{ marginBottom: 12 }}>You agree not to:</p>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>Use automated scripts, bots, or programs to repeatedly run speed tests in a manner that would constitute abuse of our infrastructure</li>
              <li>Attempt to reverse-engineer, disassemble, or decompile any part of the Service</li>
              <li>Use the Service in any way that could damage, disable, overburden, or impair our servers</li>
              <li>Attempt to gain unauthorized access to any part of the Service or related systems</li>
              <li>Use the Service for any unlawful purpose or in violation of any applicable law</li>
            </ul>
          </Section>

          <Section title="Bandwidth usage">
            <p>Each speed test consumes approximately 200 MB–2 GB of data transfer, depending on your connection speed. You are responsible for any data charges incurred through your internet service provider. We are not liable for any charges resulting from use of the Service.</p>
          </Section>

          <Section title="Accuracy disclaimer">
            <p>Speed test results are measurements of your connection&apos;s performance to our test servers at a specific point in time. Results may vary based on network conditions, server load, geographic distance, and other factors. SpeedConnect.ai makes no warranty that results accurately reflect your maximum possible connection speed or represent a guarantee of service from your ISP.</p>
          </Section>

          <Section title="Intellectual property">
            <p>All content, trademarks, and technology on SpeedConnect.ai are the property of SpeedConnect.ai or its licensors. You may not reproduce, distribute, or create derivative works without express written permission.</p>
          </Section>

          <Section title="Limitation of liability">
            <p>To the maximum extent permitted by applicable law, SpeedConnect.ai shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the Service, including but not limited to loss of data, loss of revenue, or loss of business opportunities.</p>
          </Section>

          <Section title="Governing law">
            <p>These Terms shall be governed by and construed in accordance with applicable law, without regard to conflict of law principles.</p>
          </Section>

          <Section title="Changes to terms">
            <p>We reserve the right to update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms. The &quot;last updated&quot; date at the top of this page indicates when changes were last made.</p>
          </Section>

          <Section title="Contact">
            <p>Questions about these Terms? Email <span style={{ color: "#3b82f6" }}>legal@speedconnect.ai</span></p>
          </Section>
        </div>
      </div>
    </PageShell>
  );
}
