export const runtime = "edge";

export async function POST(request: Request) {
  // Drain the full request body so the browser's ReadableStream gets proper
  // backpressure and the connection closes cleanly when the stream ends.
  // request.body?.cancel() causes a mid-stream RST which can abort the fetch.
  try {
    if (request.body) {
      const reader = request.body.getReader();
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done } = await reader.read();
        if (done) break;
        // discard chunk — we only care about draining
      }
    }
  } catch {
    // client closed stream — normal at end of timed upload
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
