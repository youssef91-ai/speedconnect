import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const t0 = Date.now();
  let bytes = 0;

  try {
    const reader = request.body?.getReader();
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value?.byteLength ?? 0;
      }
    }
  } catch {
    // absorb read errors
  }

  const elapsed = (Date.now() - t0) / 1000;
  const mbps = elapsed > 0 ? (bytes * 8) / elapsed / 1e6 : 0;

  return NextResponse.json(
    { received: bytes, elapsed, mbps: Math.round(mbps * 100) / 100 },
    {
      headers: {
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_SITE_URL ?? "*",
      },
    }
  );
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_SITE_URL ?? "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
