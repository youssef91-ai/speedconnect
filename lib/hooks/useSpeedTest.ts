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
  // ── Speedtest.net methodology analysis ────────────────────────────────────
  //
  // Speedtest.net uses WebSockets to a co-located server and measures the
  // round-trip of a small "ping" message. Server processing is <0.1ms.
  // They report the MINIMUM of 4 samples, not the median — minimum eliminates
  // queuing delay and OS scheduler jitter, giving the fastest observed RTT
  // which best represents pure propagation delay.
  //
  // We cannot use WebSockets to a CDN server without CORS. We use same-origin
  // HEAD requests to /api/ping-test (204, no body) + PerformanceResourceTiming.
  //
  // Key insight: use MINIMUM of samples (after discarding obvious outliers),
  // not median. The minimum across 20 samples represents the best-case RTT
  // on a warm connection — closest to pure propagation delay.
  //
  // navigator.connection.rtt provides a browser-native RTT rounded to 25ms.
  // We use it to sanity-check our result and correct severe inflation.

  const ENDPOINT = "/api/ping-test";
  const TOTAL    = 20;
  const WARMUPS  = 4;  // more warm-ups: ensure HTTP/2 stream is fully established

  // Native browser RTT (Chrome/Edge only, 25ms resolution)
  const nativeRtt: number | null = (() => {
    try {
      const conn = (navigator as Navigator & { connection?: { rtt?: number } }).connection;
      const r = conn?.rtt;
      return typeof r === "number" && r > 0 ? r : null;
    } catch { return null; }
  })();

  try { performance.clearResourceTimings?.(); } catch { /* ok */ }

  // Warm-up: fully establish HTTP/2 connection and prime the stream
  for (let w = 0; w < WARMUPS; w++) {
    try { await fetch(`${ENDPOINT}?w=${w}`, { method: "HEAD", cache: "no-store" }); }
    catch { /* ok */ }
  }

  const samples: number[] = [];

  for (let i = 0; i < TOTAL; i++) {
    const url     = `${ENDPOINT}?p=${i}`;
    const fullUrl = `${location.origin}${url}`;
    try { await fetch(url, { method: "HEAD", cache: "no-store" }); }
    catch { /* ok — check timing entry anyway */ }

    const entries = performance.getEntriesByName(fullUrl, "resource") as PerformanceResourceTiming[];
    const e = entries[entries.length - 1];
    if (e?.requestStart > 0 && e?.responseStart > e.requestStart) {
      samples.push(e.responseStart - e.requestStart);
    }
  }

  if (!samples.length) return { ping: nativeRtt ?? 10, jitter: 2 };

  samples.sort((a, b) => a - b);

  // Drop top 50% — keep only the fastest half.
  // The fastest samples most closely reflect pure propagation delay;
  // slower samples include OS scheduling jitter, GC pauses, queue spikes.
  // This is closer to Speedtest.net's minimum-based approach.
  const keep = samples.slice(0, Math.ceil(samples.length * 0.5));

  // Use the median of the FAST half (not the minimum) to avoid lucky outliers
  const mid  = Math.floor(keep.length / 2);
  const fastMedian = keep.length % 2 === 0
    ? (keep[mid - 1] + keep[mid]) / 2
    : keep[mid];

  // Jitter across all kept samples
  const jitter = keep.reduce((s, v) => s + Math.abs(v - fastMedian), 0) / keep.length;

  // Sanity check with native RTT if available
  let finalPing = fastMedian;
  if (nativeRtt !== null && nativeRtt > 0) {
    if (finalPing > nativeRtt + 10) {
      // We're reading higher than native — native is more accurate, blend toward it
      finalPing = nativeRtt * 0.7 + finalPing * 0.3;
    }
  }

  return {
    ping:   Math.round(Math.max(1, finalPing)),
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
  const DURATION = 8_000;
  const STREAMS = 3;
  const PAYLOAD = 2 * 1024 * 1024;

  const buf = new Uint8Array(PAYLOAD);
  for (let i = 0; i < PAYLOAD; i++) buf[i] = i & 0xff;
  const blob = new Blob([buf]);

  let totalBytes = 0;
  const t0 = performance.now();
  let windowBytes = 0;
  let windowT = t0;

  const worker = async () => {
    while (performance.now() - t0 < DURATION) {
      if (signal.aborted) return;
      try {
        await fetch("/api/speed-test/upload?_=" + Math.random(), {
          method: "POST",
          body: blob,
          signal,
          cache: "no-store",
        });
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
        await sleep(300);
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
