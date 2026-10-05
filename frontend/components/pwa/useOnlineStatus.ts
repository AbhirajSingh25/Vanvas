"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { isCapacitorNative } from "@/lib/capacitor";

export type ConnectivityState = "UNKNOWN" | "CHECKING" | "ONLINE" | "OFFLINE" | "RECONNECTING";

// Minimal interval between active health probes to avoid aggressive network pinging
const PROBE_THROTTLE_MS = 15000;
// Short, safe timeout for reachability check
const PROBE_TIMEOUT_MS = 3500;

let lastProbeTime = 0;
let lastProbeResult = true;

/**
 * Perform a lightweight, safe reachability check against the canonical VANVAS backend.
 * Uses /health or /api/v1/health with an abort controller timeout.
 */
async function probeBackendReachability(force = false): Promise<boolean> {
  const now = Date.now();
  if (!force && now - lastProbeTime < PROBE_THROTTLE_MS) {
    return lastProbeResult;
  }

  // If the browser strictly declares offline, no need to probe
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    lastProbeTime = now;
    lastProbeResult = false;
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

    // Determine safe health check URL
    let healthUrl = "/api/v1/health";
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local");
      if (!isLocalhost && process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.startsWith("https://")) {
        const rawApi = process.env.NEXT_PUBLIC_API_URL.trim().replace(/\/+$/, "");
        healthUrl = rawApi.endsWith("/api/v1") ? `${rawApi}/health` : `${rawApi}/api/v1/health`;
      }
    }

    const res = await fetch(healthUrl, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    clearTimeout(timeoutId);
    lastProbeTime = Date.now();
    // 2xx status or even 4xx/5xx confirms backend network path is reachable (distinguishes network vs server error)
    lastProbeResult = res.status < 500 || res.ok;
    return lastProbeResult;
  } catch (err: any) {
    lastProbeTime = Date.now();
    // If it was an abort due to slow backend / cold start on Render, but navigator is online,
    // do NOT falsely mark whole device offline if we have basic network
    if (err?.name === "AbortError") {
      const hasNetwork = typeof navigator !== "undefined" ? navigator.onLine : true;
      lastProbeResult = hasNetwork;
      return hasNetwork;
    }
    // Network failure (no connection / DNS resolution failure)
    lastProbeResult = false;
    return false;
  }
}

export function useOnlineStatus() {
  // Initial state: UNKNOWN to prevent false offline banner during hydration / cold start
  const [status, setStatus] = useState<ConnectivityState>("UNKNOWN");
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  const checkReachability = useCallback(async (force = true) => {
    setStatus((prev) => (prev === "UNKNOWN" ? "CHECKING" : prev));
    const reachable = await probeBackendReachability(force);
    setStatus(reachable ? "ONLINE" : "OFFLINE");
    return reachable;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let isMounted = true;

    // 1. Initial State Resolution
    const initConnectivity = async () => {
      // If Capacitor native is active, prioritize Capacitor Network plugin
      if (isCapacitorNative()) {
        try {
          const { Network } = await import("@capacitor/network");
          const nativeStatus = await Network.getStatus();
          if (!isMounted) return;

          if (!nativeStatus.connected) {
            setStatus("OFFLINE");
            return;
          }
          // Native reports connected -> verify backend reachability
          const reachable = await probeBackendReachability(false);
          if (isMounted) {
            setStatus(reachable ? "ONLINE" : "ONLINE"); // Do not falsely mark offline during cold start if connected
          }
          return;
        } catch {
          // Fallback to web browser detection
        }
      }

      // Web/PWA detection
      const browserOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
      if (!browserOnline) {
        // Quick verify
        const reachable = await probeBackendReachability(true);
        if (isMounted) {
          setStatus(reachable ? "ONLINE" : "OFFLINE");
        }
      } else {
        if (isMounted) {
          setStatus("ONLINE");
        }
      }
    };

    initConnectivity();

    // 2. Capacitor Network Listeners (if native)
    let capacitorListenerRemove: (() => void) | null = null;
    if (isCapacitorNative()) {
      import("@capacitor/network")
        .then(({ Network }) => {
          const handle = Network.addListener("networkStatusChange", async (netStatus) => {
            if (!isMounted) return;
            if (!netStatus.connected) {
              if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
              setStatus("OFFLINE");
            } else {
              // Transitioning back online
              setStatus("RECONNECTING");
              await probeBackendReachability(true);
              if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
              reconnectTimerRef.current = setTimeout(() => {
                if (isMounted) setStatus("ONLINE");
              }, 3500);
            }
          });
          capacitorListenerRemove = () => {
            handle.then((l) => l.remove());
          };
        })
        .catch(() => {});
    }

    // 3. Web Standard Event Listeners
    const handleBrowserOnline = async () => {
      if (!isMounted) return;
      setStatus("RECONNECTING");
      await probeBackendReachability(true);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => {
        if (isMounted) setStatus("ONLINE");
      }, 3500);
    };

    const handleBrowserOffline = async () => {
      if (!isMounted) return;
      // Double check before alarming the user
      const reachable = await probeBackendReachability(true);
      if (isMounted) {
        if (!reachable) {
          if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
          setStatus("OFFLINE");
        }
      }
    };

    window.addEventListener("online", handleBrowserOnline);
    window.addEventListener("offline", handleBrowserOffline);

    return () => {
      isMounted = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      window.removeEventListener("online", handleBrowserOnline);
      window.removeEventListener("offline", handleBrowserOffline);
      if (capacitorListenerRemove) capacitorListenerRemove();
    };
  }, []);

  const isOnline = status === "ONLINE" || status === "RECONNECTING" || status === "UNKNOWN" || status === "CHECKING";
  const isOffline = status === "OFFLINE";
  const wasOffline = status === "RECONNECTING";

  return {
    status,
    isOnline,
    isOffline,
    wasOffline,
    isChecking: status === "CHECKING" || status === "UNKNOWN",
    checkReachability,
  };
}
