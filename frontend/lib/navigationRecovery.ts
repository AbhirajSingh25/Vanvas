/**
 * VANVAS Runtime Navigation Diagnostics, Chunk Error Recovery & Route Watchdog
 *
 * Strictly zero PII, zero tokens, zero private travel data.
 */

export type ControllerState = "controlled" | "uncontrolled" | "unsupported" | "error";
export type NavigationStatus = "idle" | "navigating" | "recovered" | "error";

export interface ClickedTargetTelemetry {
  sourcePathname: string;
  targetPathname: string;
  targetHref: string;
  tag: string;
  testId?: string;
  clickReceived: boolean;
  nextNavigationCompleted: boolean;
  fallbackNavigationUsed: boolean;
  at: number;
}

export interface ChunkErrorRecord {
  message: string;
  asset?: string;
  route: string;
  at: number;
}

export interface NavigationDiagnosticsState {
  route: string;
  buildId: string;
  controllerState: ControllerState;
  activeWorkerState: string | null;
  waitingWorkerState: string | null;
  cacheVersion: string;
  reloadedOnControllerChange: boolean;
  navState: NavigationStatus;
  activeScrollLocks: number;
  lastClickedTarget: ClickedTargetTelemetry | null;
  lastNavError: string | null;
  lastChunkError: ChunkErrorRecord | null;
  lastRecoveryAction: string | null;
  chunkRecoveryFailed: boolean;
  telemetryHistory: ClickedTargetTelemetry[];
}

const CHUNK_RECOVERY_STORAGE_KEY = "vanvas_chunk_recovery_v1";
const SW_RELOAD_TELEMETRY_KEY = "vanvas_sw_controller_reload_at";
const CHUNK_GUARD_WINDOW_MS = 20000;

type Listener = () => void;
const listeners = new Set<Listener>();

function detectBuildId(): string {
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_BUILD_ID) {
    return process.env.NEXT_PUBLIC_BUILD_ID;
  }
  if (typeof document !== "undefined") {
    const chunkScript = document.querySelector<HTMLScriptElement>(
      'script[src*="/_next/static/"]'
    );
    if (chunkScript?.src) {
      const parts = chunkScript.src.split("/");
      const file = parts[parts.length - 1]?.replace(/\?.*$/, "");
      if (file) return file.slice(0, 24);
    }
  }
  return "vanvas-web-runtime";
}

function readReloadTelemetry(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = sessionStorage.getItem(SW_RELOAD_TELEMETRY_KEY);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    return !Number.isNaN(ts) && Date.now() - ts < 60000;
  } catch {
    return false;
  }
}

let state: NavigationDiagnosticsState = {
  route: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/",
  buildId: "vanvas-web-runtime",
  controllerState:
    typeof navigator !== "undefined" && "serviceWorker" in navigator
      ? navigator.serviceWorker.controller
        ? "controlled"
        : "uncontrolled"
      : "unsupported",
  activeWorkerState: null,
  waitingWorkerState: null,
  cacheVersion: "unknown",
  reloadedOnControllerChange: false,
  navState: "idle",
  activeScrollLocks: 0,
  lastClickedTarget: null,
  lastNavError: null,
  lastChunkError: null,
  lastRecoveryAction: null,
  chunkRecoveryFailed: false,
  telemetryHistory: [],
};

let initialized = false;
function ensureInitialized(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  state = {
    ...state,
    route: window.location.pathname + window.location.search,
    buildId: detectBuildId(),
    controllerState:
      "serviceWorker" in navigator
        ? navigator.serviceWorker.controller
          ? "controlled"
          : "uncontrolled"
        : "unsupported",
    reloadedOnControllerChange: readReloadTelemetry(),
    activeScrollLocks:
      typeof (window as any).__VANVAS_ACTIVE_LOCKS__ === "number"
        ? (window as any).__VANVAS_ACTIVE_LOCKS__
        : 0,
  };
  exposeGlobalDiagnostics();
}

function exposeGlobalDiagnostics(): void {
  if (typeof window === "undefined") return;
  (window as any).__VANVAS_NAV_DIAGNOSTICS__ = state;
  (window as any).__VANVAS_NAV_TELEMETRY__ = state.telemetryHistory;
}

export function getNavigationDiagnostics(): NavigationDiagnosticsState {
  ensureInitialized();
  return state;
}

export function updateNavigationDiagnostics(
  patch: Partial<NavigationDiagnosticsState>
): void {
  ensureInitialized();
  state = { ...state, ...patch };
  exposeGlobalDiagnostics();
  listeners.forEach((cb) => {
    try {
      cb();
    } catch {}
  });
}

export function subscribeNavigationDiagnostics(cb: Listener): () => void {
  ensureInitialized();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function isDiagnosticTelemetryEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (process.env.NODE_ENV !== "production") return true;
    const params = new URLSearchParams(window.location.search);
    return (
      params.get("debugNavigation") === "1" ||
      params.get("debugNavigation") === "true" ||
      localStorage.getItem("vanvas_nav_debug") === "1"
    );
  } catch {
    return false;
  }
}

export function markControllerTransitionReloadTelemetry(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SW_RELOAD_TELEMETRY_KEY, String(Date.now()));
  } catch {}
  updateNavigationDiagnostics({
    reloadedOnControllerChange: true,
    lastRecoveryAction: "sw-controller-change-reload",
  });
}

/**
 * Classifies runtime errors to catch genuine Next.js / Webpack / Turbopack chunk mismatches
 * while strictly ignoring normal API HTTP errors, cancellations, or app validation bugs.
 */
export function isChunkLoadError(message?: string, assetUrl?: string): boolean {
  const msg = String(message || "");
  const asset = String(assetUrl || "");

  if (
    asset.includes("/api/") ||
    asset.includes("onrender.com") ||
    msg.includes("AbortError") ||
    msg.includes("Unable to connect to VANVAS servers")
  ) {
    return false;
  }

  if (
    asset.includes("/_next/static/") &&
    (/\.(js|mjs|css)(\?|$)/i.test(asset) || asset.includes("/chunks/"))
  ) {
    return true;
  }

  return (
    /ChunkLoadError/i.test(msg) ||
    /Loading chunk [\w-]+ failed/i.test(msg) ||
    /Loading CSS chunk [\w-]+ failed/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg)
  );
}

interface StoredChunkGuard {
  signature: string;
  timestamp: number;
  attempts: number;
}

export function attemptChunkErrorRecovery(details: {
  message: string;
  asset?: string;
}): "reloading" | "repeated-failure" {
  if (typeof window === "undefined") return "repeated-failure";

  const currentRoute = window.location.pathname + window.location.search;
  const record: ChunkErrorRecord = {
    message: details.message.slice(0, 240),
    asset: details.asset,
    route: currentRoute,
    at: Date.now(),
  };

  const signature = `${currentRoute}::${details.asset || details.message.slice(0, 80)}`;
  let guard: StoredChunkGuard | null = null;
  try {
    const raw = sessionStorage.getItem(CHUNK_RECOVERY_STORAGE_KEY);
    if (raw) {
      guard = JSON.parse(raw) as StoredChunkGuard;
    }
  } catch {
    guard = null;
  }

  const withinWindow =
    guard &&
    guard.signature === signature &&
    Date.now() - guard.timestamp < CHUNK_GUARD_WINDOW_MS;

  if (withinWindow && guard!.attempts >= 1) {
    updateNavigationDiagnostics({
      navState: "error",
      lastChunkError: record,
      lastNavError: details.message,
      lastRecoveryAction: "chunk-recovery-halted-repeated-failure",
      chunkRecoveryFailed: true,
    });
    return "repeated-failure";
  }

  const nextGuard: StoredChunkGuard = {
    signature,
    timestamp: Date.now(),
    attempts: (withinWindow ? guard!.attempts : 0) + 1,
  };
  try {
    sessionStorage.setItem(CHUNK_RECOVERY_STORAGE_KEY, JSON.stringify(nextGuard));
  } catch {}

  updateNavigationDiagnostics({
    navState: "recovered",
    lastChunkError: record,
    lastNavError: details.message,
    lastRecoveryAction: "chunk-error-reload",
    chunkRecoveryFailed: false,
  });

  window.location.reload();
  return "reloading";
}

export function resetChunkRecoveryGuardOnStableHydration(): void {
  if (typeof window === "undefined") return;
  try {
    if (!state.chunkRecoveryFailed) {
      sessionStorage.removeItem(CHUNK_RECOVERY_STORAGE_KEY);
    }
  } catch {}
}

export function clearChunkRecoveryBannerAndReload(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CHUNK_RECOVERY_STORAGE_KEY);
  } catch {}
  updateNavigationDiagnostics({
    chunkRecoveryFailed: false,
    lastRecoveryAction: "manual-reload",
  });
  window.location.reload();
}

export function recordNavigationTelemetry(entry: ClickedTargetTelemetry): void {
  ensureInitialized();
  const nextHistory = [entry, ...state.telemetryHistory].slice(0, 20);
  updateNavigationDiagnostics({
    lastClickedTarget: entry,
    telemetryHistory: nextHistory,
  });
  if (isDiagnosticTelemetryEnabled()) {
    console.debug("[VANVAS NavWatchdog]", entry);
  }
}

