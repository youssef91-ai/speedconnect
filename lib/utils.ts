import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSpeed(mbps: number): string {
  if (mbps >= 1000) return (mbps / 1000).toFixed(2) + " Gbps";
  if (mbps >= 100) return mbps.toFixed(0) + " Mbps";
  if (mbps >= 10) return mbps.toFixed(1) + " Mbps";
  return mbps.toFixed(2) + " Mbps";
}

export interface QualityResult {
  label: "Excellent" | "Good" | "Average" | "Poor";
  score: number;
  color: string;
  bg: string;
  borderColor: string;
  description: string;
}

export function getConnectionQuality(
  dl: number,
  ul: number,
  ping: number,
  jitter: number
): QualityResult {
  let score = 0;

  // Download (40 pts)
  if (dl >= 100) score += 40;
  else if (dl >= 50) score += 30;
  else if (dl >= 25) score += 20;
  else if (dl >= 10) score += 12;
  else score += 4;

  // Upload (30 pts)
  if (ul >= 50) score += 30;
  else if (ul >= 20) score += 22;
  else if (ul >= 10) score += 14;
  else if (ul >= 5) score += 8;
  else score += 2;

  // Ping (20 pts)
  if (ping <= 15) score += 20;
  else if (ping <= 40) score += 16;
  else if (ping <= 80) score += 11;
  else if (ping <= 150) score += 6;
  else score += 1;

  // Jitter (10 pts)
  if (jitter <= 3) score += 10;
  else if (jitter <= 8) score += 7;
  else if (jitter <= 15) score += 4;
  else score += 1;

  if (score >= 85)
    return {
      label: "Excellent",
      score,
      color: "#10b981",
      bg: "rgba(16,185,129,0.12)",
      borderColor: "rgba(16,185,129,0.28)",
      description:
        "Your connection is exceptional. Suitable for anything — 4K gaming, live streaming, and professional remote work at the highest quality.",
    };

  if (score >= 65)
    return {
      label: "Good",
      score,
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.12)",
      borderColor: "rgba(59,130,246,0.28)",
      description:
        "A solid connection for most use cases. Video calls, HD streaming, and online gaming all perform well with minimal issues.",
    };

  if (score >= 45)
    return {
      label: "Average",
      score,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.12)",
      borderColor: "rgba(245,158,11,0.28)",
      description:
        "Adequate for standard use, but you may notice buffering in 4K or lag spikes in competitive gaming. Consider upgrading your plan.",
    };

  return {
    label: "Poor",
    score,
    color: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
    borderColor: "rgba(239,68,68,0.28)",
    description:
      "Your connection is struggling. Basic browsing and SD video should work, but expect issues with video calls, gaming, and file transfers.",
  };
}

export interface UseCase {
  emoji: string;
  label: string;
  ok: boolean;
  detail: string;
}

export function getUseCases(dl: number, ul: number, ping: number, jitter: number): UseCase[] {
  return [
    {
      emoji: "🎬",
      label: "4K Streaming",
      ok: dl >= 25,
      detail: "Needs 25+ Mbps",
    },
    {
      emoji: "🎮",
      label: "Online Gaming",
      ok: ping <= 50 && jitter <= 15,
      detail: "Needs <50ms ping",
    },
    {
      emoji: "📹",
      label: "Video Calls",
      ok: dl >= 10 && ul >= 3 && ping <= 150,
      detail: "Needs 10/3 Mbps",
    },
    {
      emoji: "☁️",
      label: "Cloud Backup",
      ok: ul >= 10,
      detail: "Needs 10+ Mbps up",
    },
    {
      emoji: "📡",
      label: "Smart Home",
      ok: dl >= 5,
      detail: "Needs 5+ Mbps",
    },
    {
      emoji: "💼",
      label: "Remote Work",
      ok: dl >= 25 && ul >= 10 && ping <= 100,
      detail: "Needs 25/10 Mbps",
    },
  ];
}
