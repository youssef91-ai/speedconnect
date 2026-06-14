// Minimal ping endpoint — Edge runtime for lowest latency.
// Returns 204 with no body. Keep-alive is handled by the runtime.
export const runtime = "edge";

const HEADERS = {
  "Cache-Control": "no-store, no-cache",
  "Access-Control-Allow-Origin": "*",
  "Connection": "keep-alive",
} as const;

export function HEAD() {
  return new Response(null, { status: 204, headers: HEADERS });
}

export function GET() {
  return new Response(null, { status: 204, headers: HEADERS });
}
