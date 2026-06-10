import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { blogPosts } from "@/lib/blog-data";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return { title: "Not Found" };
  return {
    title: `${post.title} — SpeedConnect.ai`,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, type: "article", publishedTime: post.date, authors: [post.author] },
  };
}

const articleContent: Record<string, string[]> = {
  "how-to-improve-internet-speed": [
    "A slow internet connection is one of the most frustrating experiences in modern life — especially when you're paying for a plan that promises much more. Before blaming your ISP, there are a dozen things you can try that cost nothing.",
    "**1. Restart your router and modem.** This sounds trivial, but routers accumulate memory leaks and stale NAT tables over weeks of uptime. A full power cycle (30 seconds unplugged) clears state and re-negotiates your connection to the ISP.",
    "**2. Check router placement.** Wi-Fi signal drops sharply with distance and walls. The 2.4 GHz band penetrates walls better but is slower; 5 GHz is faster but shorter range. Place your router centrally, elevated, away from microwaves and cordless phones.",
    "**3. Use an ethernet cable.** A direct wired connection bypasses all Wi-Fi variables. If your speed test via ethernet matches your plan speed, the issue is Wi-Fi. If it's still slow via cable, the problem is your ISP connection or router WAN port.",
    "**4. Update router firmware.** Manufacturers regularly release performance and security fixes. Log into your router admin panel (usually 192.168.1.1) and check for firmware updates.",
    "**5. Change Wi-Fi channels.** If your neighbours are on the same Wi-Fi channel, you'll experience interference. Use a Wi-Fi analyser app to find the least-congested channel and set your router manually.",
    "**6. Enable Quality of Service (QoS).** Most modern routers have QoS settings that let you prioritise traffic. Put streaming and video calls above downloads and background sync.",
    "**7. Close bandwidth-hungry background apps.** Cloud backup software (Dropbox, Google Drive, iCloud) and system updates often saturate upload bandwidth silently. Check Task Manager or Activity Monitor during a speed test.",
    "**8. Check for interference sources.** Baby monitors, smart home hubs, and older Bluetooth devices all compete on the 2.4 GHz spectrum. Switching devices to 5 GHz where possible reduces congestion.",
    "**9. Replace old networking hardware.** If your router is more than 5 years old, it likely predates Wi-Fi 5 (802.11ac) or Wi-Fi 6 (802.11ax). Older routers cap out at 150–300 Mbps regardless of your plan speed.",
    "**10. Consider a mesh network.** For large homes, a single router creates dead zones. A mesh system like Eero, Google Nest WiFi, or TP-Link Deco provides consistent coverage throughout.",
    "**11. Call your ISP with data.** Run three speed tests at different times of day and keep the results. ISPs respond better to customers who present hard data.",
    "**12. Check your coax or phone line.** For cable and DSL connections, corroded connectors, old splitters, and long cable runs degrade signal quality. A technician can measure line attenuation and replace aged infrastructure.",
  ],
  "fiber-internet-explained": [
    "Fiber optic internet is no longer a luxury — in most urban areas, it's available for roughly the same price as cable. But what makes it fundamentally different, and why does it matter?",
    "**The physics of fiber.** Traditional copper internet (DSL and cable) transmits data as electrical signals. Fiber optic cables transmit data as pulses of light through glass strands at roughly 200,000 km/s — about two-thirds the speed of light in vacuum.",
    "**Symmetrical speeds.** Cable internet is asymmetric by design: DOCSIS 3.1 can deliver 1 Gbps download but only 50–100 Mbps upload. Fiber is inherently symmetric — 1 Gbps download and 1 Gbps upload are equally achievable.",
    "**Distance doesn't matter.** DSL speed degrades sharply with distance from the telephone exchange. Fiber signals can travel tens of kilometres with no loss, so your speed is consistent regardless of where you live on the network.",
    "**Types of fiber deployment.** FTTH (Fiber to the Home) runs fiber directly to your premises — the gold standard. FTTC (Fiber to the Cabinet) runs fiber to a street cabinet and then copper for the last stretch.",
    "**Latency.** Fiber connections typically deliver ping times of 2–8ms to regional servers. Cable averages 10–30ms. DSL can range from 25–70ms.",
    "**Reliability.** Copper is susceptible to electrical interference and moisture ingress. Fiber is immune to electromagnetic interference, doesn't corrode, and has a longer service life.",
    "**Should you switch?** If fiber is available in your area at a comparable price, there is almost no reason not to switch. The benefits — especially symmetrical speeds and lower latency — are significant for any household with more than two people online simultaneously.",
  ],
  "best-wifi-tips-2025": [
    "Wi-Fi optimization is part science, part art. These 10 techniques are ordered by impact — start at the top and work down.",
    "**1. Upgrade to Wi-Fi 6 (802.11ax).** If your router is older, this single change can double throughput in congested environments. Wi-Fi 6 introduces OFDMA, BSS Coloring, and Target Wake Time.",
    "**2. Separate your 2.4 and 5 GHz networks.** Many routers combine them into a single SSID. Older devices migrate to 2.4 GHz and clog it. Create separate named networks and manually assign devices.",
    "**3. Manually set channel width.** 80 MHz channels offer higher throughput on 5 GHz but suffer more interference. In dense apartment buildings, 40 MHz is often more reliable.",
    "**4. Enable WPA3 security.** Beyond security benefits, WPA3 has subtle performance improvements in congested environments.",
    "**5. Use DFS channels on 5 GHz.** Most users cluster on channels 36–48. DFS channels (100–144) are radar-aware but much less congested.",
    "**6. Disable legacy device support.** Old 802.11b/g devices slow down the entire network. Set the minimum Wi-Fi standard to 802.11n or higher.",
    "**7. Use a wired backhaul for mesh nodes.** Wireless backhaul cuts available bandwidth for clients roughly in half.",
    "**8. Check for firmware updates monthly.** Router manufacturers push performance improvements in firmware, not just security patches.",
    "**9. Position antennas correctly.** One antenna perpendicular to the floor helps vertical signal propagation; one parallel helps horizontal range.",
    "**10. Replace the router provided by your ISP.** ISP-provided routers are typically commodity hardware. A mid-range consumer router from ASUS, TP-Link, or Netgear costing $100–200 will outperform most ISP equipment.",
  ],
  "understanding-ping-and-latency": [
    "Ping, latency, and jitter are often used interchangeably, but they measure slightly different things. Understanding the distinction helps you diagnose real problems.",
    "**Latency** is the time it takes for a data packet to travel from your device to a server and back. It's measured in milliseconds (ms). Latency is determined by physical distance, routing efficiency, and congestion along the path.",
    "**Ping** is both the tool used to measure latency and commonly used as a synonym for round-trip latency. When someone says 'my ping is 20ms,' they mean the round-trip time to a reference server is 20 milliseconds.",
    "**Jitter** is the variation in latency over time. If your ping is 20ms on one request and 45ms on the next, your jitter is 25ms. High jitter is often more disruptive than high average latency.",
    "**What causes high latency?** Geographic distance is the primary factor — data can only travel so fast. Beyond distance, poor routing, network congestion, and hardware bufferbloat all add latency.",
    "**Bufferbloat** deserves special attention. Many consumer routers have large buffers that absorb bursts by queuing packets. Under load, these queues fill up, adding 200–500ms of artificial latency.",
    "**What counts as good?** For general browsing: any latency under 100ms is fine. For video calls: under 80ms average with under 20ms jitter. For competitive gaming: under 30ms with under 5ms jitter.",
    "**Measuring accurately.** SpeedConnect measures ping using 8 HEAD requests and trims the top 10% of outlier samples before averaging, giving you a statistically robust baseline latency figure.",
  ],
  "best-isps-2025": [
    "We analysed over 50 million speed tests conducted through SpeedConnect.ai in 2025–2026 to rank internet service providers by their actual delivered performance — not advertised speeds.",
    "**Methodology.** Rankings are based on median delivered download speed, median upload speed, and median latency, weighted 50/30/20 respectively. Only ISPs with more than 50,000 test samples are included.",
    "**Tier 1 — Fiber providers consistently deliver.** In every market where fiber infrastructure has been deployed at scale, fiber ISPs dominate the rankings. Users on fiber plans consistently achieve 85–95% of their advertised speeds, compared to 60–75% for cable.",
    "**The upload gap widens.** The most dramatic finding is upload speed. Cable ISPs average 15–40 Mbps upload while fiber providers deliver 100 Mbps+ symmetrically. This gap affects remote workers most severely.",
    "**Peak-hour degradation.** Cable infrastructure is shared in neighbourhoods. Our data shows cable speeds dropping 25–45% between 7–10 PM on weeknights. Fiber connections show less than 10% peak-hour degradation.",
    "**Latency rankings.** For latency, fiber leads. But the more interesting finding is consistency: fiber connections show far lower standard deviation in ping times across the day.",
    "**The verdict.** If fiber is available in your area, it is almost universally the best choice. If you are on cable, the most impactful upgrade is moving to a plan with higher upload speeds.",
  ],
  "what-internet-speed-do-i-need": [
    "ISPs love to sell you the fastest plan available. In reality, most households need far less than they're paying for — but the specific use case matters enormously.",
    "**The basics first.** Internet plans are marketed in Mbps (megabits per second). Your file download speed in MB/s is 8x lower — a 100 Mbps plan downloads files at roughly 12 MB/s maximum.",
    "**Streaming video.** Netflix recommends 5 Mbps for HD, 25 Mbps for 4K Ultra HD. Multiply by the number of simultaneous streams. Most modern streaming services use adaptive bitrate — they scale down quality before buffering.",
    "**Video calls.** Zoom and Teams require 3–5 Mbps download and 3–5 Mbps upload per person for HD video. Crucially, upload speed and latency matter far more than download speed for call quality.",
    "**Online gaming.** Contrary to popular belief, gaming uses relatively little bandwidth — typically 1–10 Mbps per player. What matters is low ping (under 30ms) and low jitter (under 5ms).",
    "**Remote work.** Light remote work runs comfortably on 25 Mbps. For developers and designers who regularly transfer large files, 100 Mbps+ download with at least 20 Mbps upload is recommended.",
    "**Smart home and IoT.** Each smart device uses minimal bandwidth when operating normally. However, 4K security cameras can stream 8–25 Mbps continuously when recording to the cloud.",
    "**Our recommendation.** For a household of 2–4 people: 100–200 Mbps download, 20–50 Mbps upload. For power users or households of 4+: 500 Mbps or 1 Gbps with symmetric upload.",
  ],
};

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  const related = blogPosts.filter((p) => p.category === post.category && p.slug !== post.slug).slice(0, 2);
  const paragraphs = articleContent[slug] ?? [post.excerpt, "Full article content coming soon."];

  return (
    <PageShell>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "64px 24px 96px" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32, fontSize: 13, color: "rgba(240,244,255,0.35)" }}>
          <Link href="/" style={{ color: "rgba(240,244,255,0.35)", textDecoration: "none" }}>Home</Link>
          <span>›</span>
          <Link href="/blog" style={{ color: "rgba(240,244,255,0.35)", textDecoration: "none" }}>Blog</Link>
          <span>›</span>
          <span style={{ color: "rgba(240,244,255,0.55)" }}>{post.category}</span>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{
            display: "inline-block", padding: "3px 10px", borderRadius: 100,
            fontSize: 11, fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: ".6px",
            background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
            color: "#3b82f6", marginBottom: 16,
          }}>
            {post.category}
          </div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px,4vw,44px)", fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1.1, marginBottom: 20 }}>
            {post.title}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>
                {post.author.split(" ").map((w: string) => w[0]).join("")}
              </div>
              <span style={{ fontSize: 14, color: "rgba(240,244,255,0.55)" }}>{post.author}</span>
            </div>
            <span style={{ fontSize: 13, color: "rgba(240,244,255,0.28)" }}>
              {new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </span>
            <span style={{ fontSize: 13, color: "rgba(240,244,255,0.28)" }}>{post.readingTime} min read</span>
          </div>
        </div>

        {/* Article body */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 22, padding: "36px 32px", marginBottom: 32 }}>
          {paragraphs.map((para: string, i: number) => {
            const parts = para.split(/\*\*(.+?)\*\*/g);
            return (
              <p key={i} style={{ fontSize: 15, color: "rgba(240,244,255,0.65)", lineHeight: 1.85, marginBottom: i < paragraphs.length - 1 ? 20 : 0 }}>
                {parts.map((part: string, j: number) =>
                  j % 2 === 1
                    ? <strong key={j} style={{ color: "#f0f4ff", fontWeight: 600 }}>{part}</strong>
                    : part
                )}
              </p>
            );
          })}
        </div>

        {/* Related posts */}
        {related.length > 0 && (
          <div>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 16, letterSpacing: "-0.3px" }}>
              Related articles
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }} className="related-grid">
              {related.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div
                    className="hover-lift"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "20px 18px" }}
                  >
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, lineHeight: 1.4, marginBottom: 8, color: "#f0f4ff" }}>{p.title}</div>
                    <div style={{ fontSize: 12, color: "rgba(240,244,255,0.28)" }}>{p.readingTime} min read</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 40, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <Link href="/blog" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: "#3b82f6", textDecoration: "none", fontWeight: 500 }}>
            ← Back to Blog
          </Link>
        </div>
      </div>
      <style>{`@media(max-width:480px){.related-grid{grid-template-columns:1fr!important;}}`}</style>
    </PageShell>
  );
}
