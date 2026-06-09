import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpeedConnect.ai — Internet Speed Test",
  description:
    "The most accurate internet speed test. Real multi-stream download, upload, ping and jitter measurements. Trusted by 12M+ users worldwide.",
  keywords: ["speed test", "internet speed", "bandwidth test", "ping test", "network speed"],
  openGraph: {
    title: "SpeedConnect.ai — Internet Speed Test",
    description: "Real measurements. Beautiful results. No fake data.",
    url: "https://speedconnect.ai",
    siteName: "SpeedConnect.ai",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SpeedConnect.ai — Internet Speed Test",
    description: "Real measurements. Beautiful results. No fake data.",
  },
  metadataBase: new URL("https://speedconnect.ai"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "SpeedConnect.ai",
              description: "Internet speed test with real multi-stream measurements",
              url: "https://speedconnect.ai",
              applicationCategory: "UtilitiesApplication",
              operatingSystem: "Any",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            }),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
