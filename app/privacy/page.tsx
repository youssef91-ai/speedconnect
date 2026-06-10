import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Privacy Policy — SpeedConnect.ai",
  description: "SpeedConnect.ai privacy policy. How we collect, use, and protect your data.",
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 32 }}>
    <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: "-0.5px", marginBottom: 12, color: "#f0f4ff" }}>
      {title}
    </h2>
    <div style={{ fontSize: 15, color: "rgba(240,244,255,0.55)", lineHeight: 1.8 }}>{children}</div>
  </div>
);

export default function PrivacyPage() {
  return (
    <PageShell>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "64px 24px 96px" }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "2.5px", fontWeight: 600, marginBottom: 14 }}>
            Legal
          </div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(32px,5vw,52px)", fontWeight: 800, letterSpacing: "-2px", lineHeight: 1.08, marginBottom: 16 }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: 14, color: "rgba(240,244,255,0.35)" }}>Last updated: June 1, 2026</p>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 22, padding: "36px 32px" }}>
          <Section title="Overview">
            <p>SpeedConnect.ai (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your privacy. This policy explains what data we collect when you use our speed test and network tools, how we use it, and your rights regarding that data.</p>
          </Section>

          <Section title="Data we collect">
            <p style={{ marginBottom: 12 }}>When you run a speed test, we collect:</p>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li><strong style={{ color: "#f0f4ff" }}>Test results</strong> — download speed, upload speed, ping, and jitter values.</li>
              <li><strong style={{ color: "#f0f4ff" }}>Approximate location</strong> — country and city level, derived from your IP address at the time of the test.</li>
              <li><strong style={{ color: "#f0f4ff" }}>ISP information</strong> — your internet service provider name and ASN, derived from your IP.</li>
              <li><strong style={{ color: "#f0f4ff" }}>Device type</strong> — browser and operating system, used for statistical breakdowns only.</li>
            </ul>
            <p style={{ marginTop: 12 }}>We do <strong style={{ color: "#f0f4ff" }}>not</strong> collect your name, email, or any personally identifiable information unless you create an account.</p>
          </Section>

          <Section title="How we use data">
            <p style={{ marginBottom: 12 }}>Test result data is used to:</p>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>Power our global speed maps and ISP ranking tables</li>
              <li>Improve the accuracy and infrastructure of our test servers</li>
              <li>Generate anonymised aggregate statistics (never individual-level data)</li>
            </ul>
            <p style={{ marginTop: 12 }}>Your IP address is used transiently for geolocation and is <strong style={{ color: "#f0f4ff" }}>never stored</strong> linked to your test results in any retrievable form.</p>
          </Section>

          <Section title="Third-party services">
            <p style={{ marginBottom: 12 }}>We use the following third-party services:</p>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li><strong style={{ color: "#f0f4ff" }}>ipinfo.io</strong> — IP geolocation via HTTPS. Subject to their privacy policy.</li>
              <li><strong style={{ color: "#f0f4ff" }}>Cloudflare</strong> — CDN and download test endpoints. Cloudflare may log request metadata per their policy.</li>
              <li><strong style={{ color: "#f0f4ff" }}>Vercel</strong> — Hosting infrastructure. Vercel logs may contain IP addresses for a limited period per their policy.</li>
            </ul>
          </Section>

          <Section title="Cookies">
            <p>We use only a single session cookie (<code style={{ background: "rgba(255,255,255,0.07)", padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>admin_token</code>) for admin authentication. No advertising cookies, tracking pixels, or third-party analytics cookies are used.</p>
          </Section>

          <Section title="Your rights (GDPR)">
            <p style={{ marginBottom: 12 }}>If you are in the European Economic Area, you have the right to:</p>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>Access the data we hold about you</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Data portability</li>
            </ul>
            <p style={{ marginTop: 12 }}>Because test results are stored without any link to your IP or identity, fulfilling individual access/deletion requests is technically not possible for historical results. All new test data can be opted out of by disabling anonymous analytics in your browser settings.</p>
          </Section>

          <Section title="Contact">
            <p>Questions about this policy? Email <span style={{ color: "#3b82f6" }}>privacy@speedconnect.ai</span></p>
          </Section>
        </div>
      </div>
    </PageShell>
  );
}
