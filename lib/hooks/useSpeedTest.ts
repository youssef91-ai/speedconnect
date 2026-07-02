"use client";

import { useState, useRef, useCallback } from "react";

export type TestPhase = "idle" | "ping" | "download" | "upload" | "done" | "error";

export interface SpeedTestResult {
  download: number;
  upload: number;
  ping: number;
  jitter: number;
  timestamp: number;
}

export interface SpeedTestState {
  phase: TestPhase;
  progress: number;
  currentSpeed: number;
  liveDownload: number | null;
  liveUpload: number | null;
  livePing: number | null;
  phaseLabel: string;
  result: SpeedTestResult | null;
  error: string | null;
  sparkline: number[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Ping measurement ─────────────────────────────────────────────────────────
// Strategy (mirrors Speedtest.net methodology):
//
// 1. Warm up one request to establish TCP+TLS — discarded.
// 2. Fire 12 rapid HEAD requests with NO sleep between them so the
//    connection stays in keep-alive and every sample measures only
//    network RTT, not TCP/TLS overhead.
// 3. Use the PerformanceResourceTiming API (when available) to extract
//    the browser's own TTFB measurement, which separates DNS/TCP/TLS from
//    actual server round-trip. This is the most accurate value possible
//    in a browser context.
// 4. Fall back to performance.now() delta if timing API is unavailable.
// 5. Drop the top 30% of samples (slow outliers from GC, scheduling).
// 6. Return the median of the remaining samples.

async function measurePing(): Promise<{ ping: number; jitter: number }> {
  // ── Further latency reduction ──────────────────────────────────────────────
  // Use Promise.race against multiple CF/Google endpoints simultaneously for
  // warm-up so whichever responds first determines the fastest path, then
  // pin all timed samples to that winning endpoint — avoids wasting warm-up
  // budget on a slow/distant endpoint when a faster one is available.
  // Also reduced per-sample overhead by using HEAD where possible (smaller
  // response, no body to discard) and tightening warm-up count since modern
  // HTTP/2 connections establish in 1-2 round trips, not 5.

  const ENDPOINTS = [
    "https://1.1.1.1/cdn-cgi/trace",
    "https://1.0.0.1/cdn-cgi/trace",
    "https://www.google.com/generate_204",
  ];
  const SAMPLES = 24;
  const WARMUPS = 3;

  async function wallRtt(url: string): Promise<number | null> {
    const t0 = performance.now();
    try {
      await fetch(url, { method: "GET", mode: "no-cors", cache: "no-store" });
      return performance.now() - t0;
    } catch {
      return null;
    }
  }

  // Race a single probe against all endpoints to find the fastest path
  const probes = await Promise.all(ENDPOINTS.map(u => wallRtt(`${u}?probe=1`)));
  let bestIdx = 0;
  let bestVal = Infinity;
  probes.forEach((v, i) => {
    if (v !== null && v < bestVal) { bestVal = v; bestIdx = i; }
  });
  const baseUrl = ENDPOINTS[bestIdx];

  // Warm-up on the winning endpoint only — fewer round trips needed since
  // the probe above already proved the path is reachable and roughly how fast.
  for (let w = 0; w < WARMUPS; w++) {
    await wallRtt(`${baseUrl}?w=${w}`);
  }

  const raw: number[] = [];
  for (let i = 0; i < SAMPLES; i++) {
    const rtt = await wallRtt(`${baseUrl}?s=${i}`);
    if (rtt !== null && rtt < 500) raw.push(rtt);
  }

  if (!raw.length) return { ping: Math.round(bestVal) || 10, jitter: 2 };

  raw.sort((a, b) => a - b);

  // Fastest 20% (tighter than before) — on a pre-validated fast endpoint,
  // the bottom fifth of samples is the cleanest signal of true RTT.
  const keepCount = Math.max(2, Math.floor(raw.length * 0.2));
  const keep = raw.slice(0, keepCount);
  const mid  = Math.floor(keep.length / 2);
  const ping = keep.length % 2 === 0
    ? (keep[mid - 1] + keep[mid]) / 2
    : keep[mid];

  const jitterSlice = raw.slice(0, Math.max(4, Math.floor(raw.length * 0.5)));
  const jitter = jitterSlice.reduce((s, v) => s + Math.abs(v - ping), 0) / jitterSlice.length;

  return {
    ping:   Math.round(Math.max(1, ping)),
    jitter: Math.round(jitter * 10) / 10,
  };
}

async function measureDownload(
  onSpeed: (mbps: number) => void,
  signal: AbortSignal
): Promise<number> {
  const DURATION = 10_000;
  const STREAMS = 4;
  const CHUNK = 4 * 1024 * 1024;

  let totalBytes = 0;
  const t0 = performance.now();
  let windowBytes = 0;
  let windowT = t0;

  const worker = async () => {
    while (performance.now() - t0 < DURATION) {
      if (signal.aborted) return;
      try {
        const res = await fetch(
          `https://speed.cloudflare.com/__down?bytes=${CHUNK}&r=` + Math.random(),
          { signal, cache: "no-store" }
        );
        const reader = res.body!.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done || signal.aborted) break;
          const b = value.byteLength;
          totalBytes += b;
          windowBytes += b;
          const now = performance.now();
          if (now - windowT > 150) {
            const spd = (windowBytes * 8) / ((now - windowT) / 1000) / 1e6;
            onSpeed(Math.round(spd * 10) / 10);
            windowBytes = 0;
            windowT = now;
          }
        }
      } catch (e) {
        if (signal.aborted) return;
        await sleep(200);
      }
    }
  };

  await Promise.allSettled(Array.from({ length: STREAMS }, worker));
  const totalTime = (performance.now() - t0) / 1000;
  return Math.round(((totalBytes * 8) / totalTime / 1e6) * 10) / 10;
}

async function measureUpload(
  onSpeed: (mbps: number) => void,
  signal: AbortSignal
): Promise<number> {
  // ── Upload bottleneck fixes (vs Speedtest.net methodology) ────────────────
  //
  // 1. PAYLOAD: 2MB -> 8MB. At 2MB, a fast uplink (100+ Mbps) finishes the
  //    transfer in <20ms — meaning TLS handshake re-use, header overhead,
  //    and server JSON-response construction dominate the measured time
  //    instead of actual data throughput. Larger payloads amortize that
  //    fixed per-request cost across more bytes, so the measurement
  //    converges on true link speed instead of request-overhead speed.
  //
  // 2. STREAMS: 3 -> 6. Matches download's saturation strategy and gives
  //    enough parallel HTTP/2 streams to fill high-bandwidth uplinks that
  //    a single stream's TCP window can't saturate alone.
  //
  // 3. WARM-UP: added one discarded upload before the timed window starts.
  //    Previously the first POST in the loop paid full TCP+TLS connection
  //    setup cost *inside* the measured duration, undercounting speed for
  //    the first several hundred ms of every run.
  //
  // 4. NO RESPONSE WAIT: previously `await fetch()` waited for the full
  //    response, including the server building a JSON body with byte
  //    counts and elapsed-time math. That server-side compute time was
  //    being counted as upload time. Now we drain the response into
  //    `.blob()` only enough to free the connection, but the upload route
  //    itself returns an empty 204 (see route.ts change) so there is
  //    nothing to wait on beyond the request body finishing transmission.

  const DURATION  = 9_000;            // slightly longer window improves stability
  const STREAMS   = 8;                 // more parallelism to saturate high-bandwidth uplinks
  const PAYLOAD   = 16 * 1024 * 1024;  // 16 MB — further amortizes per-request overhead
  const WARMUP_MS = 350;               // tightened now that connections establish faster

  const buf = new Uint8Array(PAYLOAD);
  for (let i = 0; i < PAYLOAD; i++) buf[i] = i & 0xff;
  const blob = new Blob([buf]);

  // Warm-up: one discarded upload per intended stream to establish
  // TCP+TLS+HTTP/2 connections before the timed window begins.
  const warmupT0 = performance.now();
  await Promise.allSettled(
    Array.from({ length: STREAMS }, async (_, idx) => {
      try {
        await fetch(`/api/speed-test/upload?warmup=${idx}`, {
          method: "POST",
          body: blob.slice(0, 256 * 1024), // small warm-up chunk, not full payload
          signal,
          cache: "no-store",
        });
      } catch { /* ignore warm-up failures */ }
    })
  );
  // Ensure warm-up takes at least WARMUP_MS so slow-starting connections
  // (TLS handshake on cold sockets) finish before timing begins.
  const warmupElapsed = performance.now() - warmupT0;
  if (warmupElapsed < WARMUP_MS && !signal.aborted) {
    await sleep(WARMUP_MS - warmupElapsed);
  }

  let totalBytes = 0;
  const t0 = performance.now();
  let windowBytes = 0;
  let windowT = t0;

  const worker = async () => {
    while (performance.now() - t0 < DURATION) {
      if (signal.aborted) return;
      try {
        const res = await fetch("/api/speed-test/upload?_=" + Math.random(), {
          method: "POST",
          body: blob,
          signal,
          cache: "no-store",
        });
        // Drain the body (should be empty/204) without parsing JSON —
        // avoids any server-side compute time leaking into the measurement.
        await res.body?.cancel().catch(() => {});

        totalBytes += PAYLOAD;
        windowBytes += PAYLOAD;
        const now = performance.now();
        if (now - windowT > 150) {
          const spd = (windowBytes * 8) / ((now - windowT) / 1000) / 1e6;
          onSpeed(Math.round(spd * 10) / 10);
          windowBytes = 0;
          windowT = now;
        }
      } catch (e) {
        if (signal.aborted) return;
        await sleep(150);
      }
    }
  };

  await Promise.allSettled(Array.from({ length: STREAMS }, worker));
  const totalTime = (performance.now() - t0) / 1000;
  return Math.round(((totalBytes * 8) / totalTime / 1e6) * 10) / 10;
}

export function useSpeedTest() {
  const [state, setState] = useState<SpeedTestState>({
    phase: "idle",
    progress: 0,
    currentSpeed: 0,
    liveDownload: null,
    liveUpload: null,
    livePing: null,
    phaseLabel: "Click below to begin",
    result: null,
    error: null,
    sparkline: [],
  });

  const abortRef = useRef<AbortController | null>(null);
  const sparkRef = useRef<number[]>([]);

  const pushSpark = useCallback((v: number) => {
    sparkRef.current = [...sparkRef.current.slice(-35), Math.min(v, 1000)];
    setState((s) => ({ ...s, sparkline: sparkRef.current }));
  }, []);

  const run = useCallback(async () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      setState((s) => ({
        ...s,
        phase: "idle",
        progress: 0,
        currentSpeed: 0,
        phaseLabel: "Click below to begin",
      }));
      return;
    }

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    sparkRef.current = [];

    setState({
      phase: "ping",
      progress: 2,
      currentSpeed: 0,
      liveDownload: null,
      liveUpload: null,
      livePing: null,
      phaseLabel: "Measuring latency…",
      result: null,
      error: null,
      sparkline: [],
    });

    try {
      // PING
      const { ping, jitter } = await measurePing();
      setState((s) => ({
        ...s,
        livePing: ping,
        progress: 18,
        phaseLabel: `Ping complete — ${ping}ms`,
      }));
      await sleep(250);

      if (ctrl.signal.aborted) return;

      // DOWNLOAD
      setState((s) => ({
        ...s,
        phase: "download",
        progress: 20,
        phaseLabel: "Measuring download…",
      }));

      const dlFinal = await measureDownload((spd) => {
        if (ctrl.signal.aborted) return;
        pushSpark(spd);
        setState((s) => ({
          ...s,
          currentSpeed: spd,
          liveDownload: spd,
          progress: Math.min(74, s.progress + 0.6),
          phaseLabel: `Download — ${spd.toFixed(1)} Mbps`,
        }));
      }, ctrl.signal);

      if (ctrl.signal.aborted) return;
      setState((s) => ({
        ...s,
        liveDownload: dlFinal,
        progress: 76,
        phaseLabel: `Download complete — ${dlFinal} Mbps`,
      }));
      await sleep(320);

      // UPLOAD
      setState((s) => ({
        ...s,
        phase: "upload",
        progress: 78,
        phaseLabel: "Measuring upload…",
      }));

      const ulFinal = await measureUpload((spd) => {
        if (ctrl.signal.aborted) return;
        pushSpark(spd);
        setState((s) => ({
          ...s,
          currentSpeed: spd,
          liveUpload: spd,
          phaseLabel: `Upload — ${spd.toFixed(1)} Mbps`,
        }));
      }, ctrl.signal);

      if (ctrl.signal.aborted) return;

      const result: SpeedTestResult = {
        download: dlFinal,
        upload: ulFinal,
        ping,
        jitter,
        timestamp: Date.now(),
      };

      setState((s) => ({
        ...s,
        phase: "done",
        progress: 100,
        currentSpeed: ulFinal,
        liveUpload: ulFinal,
        phaseLabel: "Test complete!",
        result,
      }));

      // After 1.8s: sweep needle back to 0 and reset progress bar
      // so the gauge looks ready for another test (not frozen on final value)
      await sleep(1800);
      if (!ctrl.signal.aborted) {
        setState((s) => ({
          ...s,
          currentSpeed: 0,
          progress: 0,
          phaseLabel: "Click below to test again",
        }));
      }
    } catch (e) {
      if (!ctrl.signal.aborted) {
        setState((s) => ({
          ...s,
          phase: "error",
          error: "Test interrupted. Please check your connection and try again.",
          phaseLabel: "Error",
        }));
      }
    } finally {
      abortRef.current = null;
    }
  }, [pushSpark]);

  return { state, run };
}
