"use client";

import { useState, useEffect, useCallback } from "react";
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
export async function probeBackendReachability(force = false): Promise<boolean> {
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
    // 2xx status or even 4xx/5xx confirms backend network path is reachable
    lastProbeResult = res.status < 500 || res.ok;
    return lastProbeResult;
  } catch (err: any) {
    lastProbeTime = Date.now();
    if (err?.name === "AbortError") {
      const hasNetwork = typeof navigator !== "undefined" ? navigator.onLine : true;
      lastProbeResult = hasNetwork;
      return hasNetwork;
    }
    // Network failure
    lastProbeResult = false;
    return false;
  }
}

// ---------------------------------------------------------------------------
// SINGLE SOURCE OF TRUTH: Global Singleton State & Event Normalization
// ---------------------------------------------------------------------------

let globalStatus: ConnectivityState = "UNKNOWN";
const subscribers = new Set<(status: ConnectivityState) => void>();
let globalReconnectTimer: any = null;
let isInitialized = false;
let capacitorListenerCleanup: (() => void) | null = null;

function notifySubscribers(nextStatus: ConnectivityState) {
  if (globalStatus === nextStatus) return; // Ignore duplicate state transitions
  globalStatus = nextStatus;
  subscribers.forEach((cb) => {
    try {
      cb(globalStatus);
    } catch {
      // Ignore subscriber errors
    }
  });
}

function transitionToReconnecting() {
  if (globalStatus === "RECONNECTING" || globalStatus === "ONLINE") {
    // If already online or already reconnecting, do not duplicate timer
    if (globalStatus === "ONLINE") return;
  }

  // Clear existing reconnect timer if any
  if (globalReconnectTimer) {
    clearTimeout(globalReconnectTimer);
    globalReconnectTimer = null;
  }

  notifySubscribers("RECONNECTING");

  // Verify backend path asynchronously
  probeBackendReachability(true).catch(() => {});

  // Exactly one 3.5s dismissal timer
  globalReconnectTimer = setTimeout(() => {
    globalReconnectTimer = null;
    notifySubscribers("ONLINE");
  }, 3500);
}

function transitionToOffline() {
  if (globalStatus === "OFFLINE") return; // OFFLINE -> OFFLINE ignored

  if (globalReconnectTimer) {
    clearTimeout(globalReconnectTimer);
    globalReconnectTimer = null;
  }

  notifySubscribers("OFFLINE");
}

async function handleNetworkChange(connected: boolean) {
  if (!connected) {
    // Double check reachability before alarming user
    const reachable = await probeBackendReachability(true);
    if (!reachable) {
      transitionToOffline();
    }
  } else {
    // When connected event fires, only transition if we were offline or checking
    if (globalStatus === "OFFLINE" || globalStatus === "UNKNOWN") {
      transitionToReconnecting();
    } else if (globalStatus === "RECONNECTING") {
      // Keep existing reconnecting timer without restarting
    } else {
      notifySubscribers("ONLINE");
    }
  }
}

function initGlobalConnectivity() {
  if (isInitialized || typeof window === "undefined") return;
  isInitialized = true;

  // 1. Initial State Resolution
  const resolveInitial = async () => {
    if (isCapacitorNative()) {
      try {
        const { Network } = await import("@capacitor/network");
        const nativeStatus = await Network.getStatus();
        if (!nativeStatus.connected) {
          transitionToOffline();
          return;
        }
        notifySubscribers("ONLINE");
        return;
      } catch {
        // Fallback to browser
      }
    }

    const browserOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
    if (!browserOnline) {
      const reachable = await probeBackendReachability(true);
      if (!reachable) {
        transitionToOffline();
        return;
      }
    }
    notifySubscribers("ONLINE");
  };

  resolveInitial();

  // 2. Capacitor Network Listener
  if (isCapacitorNative()) {
    import("@capacitor/network")
      .then(({ Network }) => {
        const handlePromise = Network.addListener("networkStatusChange", (netStatus) => {
          handleNetworkChange(Boolean(netStatus.connected));
        });
        capacitorListenerCleanup = () => {
          handlePromise.then((l) => l.remove()).catch(() => {});
        };
      })
      .catch(() => {});
  }

  // 3. Browser Standard Event Listeners
  const onBrowserOnline = () => handleNetworkChange(true);
  const onBrowserOffline = () => handleNetworkChange(false);

  window.addEventListener("online", onBrowserOnline);
  window.addEventListener("offline", onBrowserOffline);
}

export function useOnlineStatus() {
  const [status, setStatus] = useState<ConnectivityState>(globalStatus);

  useEffect(() => {
    initGlobalConnectivity();

    // Sync current status
    setStatus(globalStatus);

    const callback = (newStatus: ConnectivityState) => {
      setStatus(newStatus);
    };

    subscribers.add(callback);

    return () => {
      subscribers.delete(callback);
    };
  }, []);

  const checkReachability = useCallback(async (force = true) => {
    notifySubscribers("CHECKING");
    const reachable = await probeBackendReachability(force);
    if (reachable) {
      notifySubscribers("ONLINE");
    } else {
      transitionToOffline();
    }
    return reachable;
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
