import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ip = searchParams.get("ip");

  if (!ip) {
    return NextResponse.json({ error: "Missing ip parameter" }, { status: 400 });
  }

  try {
    const token = process.env.IPINFO_TOKEN;
    const url = token
      ? `https://ipinfo.io/${ip}?token=${token}`
      : `https://ipinfo.io/${ip}/json`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message ?? "Lookup failed" }, { status: 422 });
    }

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  } catch {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
