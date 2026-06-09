import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/api/speed-test/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "https://speedconnect.ai" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
        ],
      },
    ];
  },
};

export default nextConfig;
