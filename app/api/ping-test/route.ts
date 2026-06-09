import { NextResponse } from "next/server";

export const runtime = "edge";

export async function HEAD() {
  return new Response(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function GET() {
  return new Response(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
