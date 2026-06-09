import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const size = Math.min(parseInt(searchParams.get("size") ?? "10000000", 10), 20_000_000);

  const chunk = new Uint8Array(65536);
  for (let i = 0; i < chunk.length; i++) chunk[i] = i & 0xff;

  const stream = new ReadableStream({
    async start(controller) {
      let sent = 0;
      while (sent < size) {
        const remaining = size - sent;
        const toSend = remaining >= chunk.length ? chunk : chunk.slice(0, remaining);
        controller.enqueue(toSend);
        sent += toSend.length;
        await new Promise((r) => setTimeout(r, 0));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(size),
      "Cache-Control": "no-store, no-cache",
      "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_SITE_URL ?? "*",
    },
  });
}
