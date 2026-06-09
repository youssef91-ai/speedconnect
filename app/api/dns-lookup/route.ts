import { NextRequest, NextResponse } from "next/server";
import dns from "dns/promises";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");
  const type = (searchParams.get("type") ?? "A").toUpperCase();

  if (!domain) {
    return NextResponse.json({ error: "Missing domain parameter" }, { status: 400 });
  }

  try {
    let records: unknown;

    switch (type) {
      case "A":
        records = await dns.resolve4(domain);
        break;
      case "AAAA":
        records = await dns.resolve6(domain);
        break;
      case "MX":
        records = await dns.resolveMx(domain);
        break;
      case "TXT":
        records = await dns.resolveTxt(domain);
        break;
      case "CNAME":
        records = await dns.resolveCname(domain);
        break;
      case "NS":
        records = await dns.resolveNs(domain);
        break;
      case "PTR":
        records = await dns.resolvePtr(domain);
        break;
      default:
        return NextResponse.json({ error: `Unsupported record type: ${type}` }, { status: 400 });
    }

    return NextResponse.json({ domain, type, records });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "DNS lookup failed";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
