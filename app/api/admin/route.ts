import { NextResponse } from "next/server";

// Demo data — replace with real DB queries in production
export async function GET() {
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return {
      date: d.toISOString().split("T")[0],
      tests: Math.floor(Math.random() * 12000) + 8000,
      avgDownload: Math.round((Math.random() * 200 + 50) * 10) / 10,
      avgUpload: Math.round((Math.random() * 80 + 20) * 10) / 10,
      avgPing: Math.floor(Math.random() * 40) + 10,
    };
  });

  return NextResponse.json({
    kpi: {
      totalTests: 12_418_293,
      avgDownload: 187.4,
      avgUpload: 62.1,
      avgPing: 24,
    },
    timeSeries: days,
    recentTests: Array.from({ length: 10 }, (_, i) => ({
      id: `test_${Date.now() - i * 60000}`,
      ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      download: Math.round((Math.random() * 400 + 50) * 10) / 10,
      upload: Math.round((Math.random() * 100 + 10) * 10) / 10,
      ping: Math.floor(Math.random() * 60) + 5,
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
    })),
  });
}
