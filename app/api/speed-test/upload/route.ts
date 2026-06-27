export const runtime = "edge";

// ── Minimal upload sink ──────────────────────────────────────────────────────
// Previous version parsed the body, counted bytes, computed elapsed time,
// and returned a JSON payload with those stats. All of that server-side
// compute happened *after* the client's upload finished transmitting but
// *before* the client's fetch() promise resolved — meaning JSON construction
// time was being counted as part of the measured upload duration.
//
// Speedtest.net's upload endpoint does the same thing this does: accept
// bytes, respond as fast as possible with no payload. The client times its
// own write throughput; the server doesn't need to report anything back.
export async function POST(request: Request) {
  // Drain the body so the connection is properly released, but discard
  // it immediately — no byte counting, no JSON construction.
  try {
    await request.body?.cancel();
  } catch {
    // ignore — body may already be consumed by the edge runtime
  }

  return new Response(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
