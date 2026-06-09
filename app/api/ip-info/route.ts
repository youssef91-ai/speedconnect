import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown";

  try {
    // Use ipinfo.io with HTTPS — set IPINFO_TOKEN env var in production
    const token = process.env.IPINFO_TOKEN;
    const url = token
      ? `https://ipinfo.io/${ip}?token=${token}`
      : `https://ipinfo.io/${ip}/json`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();

    return NextResponse.json(
      {
        ip: data.ip ?? ip,
        city: data.city ?? "",
        region: data.region ?? "",
        country: data.country ?? "",
        org: data.org ?? "",
        timezone: data.timezone ?? "",
        loc: data.loc ?? "",
      },
      {
        headers: {
          "Cache-Control": "private, max-age=3600",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { ip, city: "", region: "", country: "", org: "", timezone: "", loc: "" },
      { headers: { "Cache-Control": "private, max-age=60" } }
    );
  }
}
