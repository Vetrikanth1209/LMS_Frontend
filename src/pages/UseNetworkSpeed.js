// hooks/useNetworkSpeed.js
//
// Drop-in replacement for react-internet-speed-meter.
// Downloads a test image on every `pingInterval` ms, computes Mbps,
// and calls your callbacks — exactly like the library did, but with
// full control and no external dependency or popup alerts.
//
// Usage:
//   const { speed, status } = useNetworkSpeed({
//     imageUrl: "...",
//     downloadSize: 117438,      // bytes — must match actual file size
//     pingInterval: 4000,        // ms between tests
//     threshold: 2.5,            // Mbps threshold
//     thresholdUnit: "megabyte", // "byte" | "kilobyte" | "megabyte"
//     onSpeedUpdate: (mbps) => {},
//     onNetworkDown: (mbps) => {},
//   });

import { useState, useEffect, useRef, useCallback } from "react";

// Convert the raw measured Mbps value based on the thresholdUnit the caller wants
const toUnit = (mbps, unit) => {
  switch (unit) {
    case "byte":      return mbps * 125000;        // Mbps → bytes/s
    case "kilobyte":  return mbps * 125;            // Mbps → KB/s
    case "megabyte":  return mbps;                  // already Mbps ≈ MB/s loosely
    default:          return mbps;
  }
};

const useNetworkSpeed = ({
  imageUrl,
  downloadSize,         // bytes (integer) — exact file size
  pingInterval = 4000,  // ms
  threshold = 2.5,      // unit-relative threshold
  thresholdUnit = "megabyte",
  onSpeedUpdate,        // (speed) => void
  onNetworkDown,        // (speed) => void
  onError,              // (errMsg) => void
  enabled = true,       // set false to pause monitoring
}) => {
  const [speed, setSpeed] = useState(null);    // raw Mbps
  const [status, setStatus] = useState("idle"); // "idle" | "testing" | "ok" | "slow" | "error"
  const timerRef = useRef(null);
  const activeRef = useRef(false);

  const runTest = useCallback(async () => {
    if (activeRef.current) return; // prevent overlapping tests
    activeRef.current = true;
    setStatus("testing");

    try {
      // Cache-bust so the browser always downloads fresh
      const cacheBust = `?cb=${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const url = `${imageUrl}${cacheBust}`;

      const startMs = performance.now();
      const response = await fetch(url, {
        cache: "no-store",
        mode: "cors",
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      // Read the full body so timing includes transfer, not just headers
      const buffer = await response.arrayBuffer();
      const endMs = performance.now();

      // Use the actual bytes received (more accurate than the declared size)
      const bytes = buffer.byteLength || downloadSize;
      const durationSec = (endMs - startMs) / 1000;
      const mbps = parseFloat(((bytes * 8) / durationSec / 1_000_000).toFixed(2));

      setSpeed(mbps);

      const converted = toUnit(mbps, thresholdUnit);

      if (converted < threshold) {
        setStatus("slow");
        onNetworkDown?.(converted);
      } else {
        setStatus("ok");
      }

      onSpeedUpdate?.(converted);
    } catch (err) {
      setStatus("error");
      onError?.(err.message || "Speed test failed");
    } finally {
      activeRef.current = false;
    }
  }, [imageUrl, downloadSize, threshold, thresholdUnit, onSpeedUpdate, onNetworkDown, onError]);

  useEffect(() => {
    if (!enabled) {
      clearInterval(timerRef.current);
      setStatus("idle");
      return;
    }

    // Run immediately on mount / when enabled flips true
    runTest();

    // Then repeat every pingInterval
    timerRef.current = setInterval(runTest, pingInterval);

    return () => clearInterval(timerRef.current);
  }, [enabled, pingInterval, runTest]);

  return { speed, status }; // speed = raw Mbps always
};

export default useNetworkSpeed;