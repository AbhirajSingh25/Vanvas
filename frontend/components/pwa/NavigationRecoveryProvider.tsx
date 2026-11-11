"use client";

import React, { useEffect, useRef, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { RefreshCw, X, AlertTriangle, Activity } from "lucide-react";
import {
  attemptChunkErrorRecovery,
  clearChunkRecoveryBannerAndReload,
  ClickedTargetTelemetry,
  getNavigationDiagnostics,
  isChunkLoadError,
  NavigationDiagnosticsState,
  recordNavigationTelemetry,
  resetChunkRecoveryGuardOnStableHydration,
  subscribeNavigationDiagnostics,
  updateNavigationDiagnostics,
} from "@/lib/navigationRecovery";
import { getActiveLocks, reconcileOrphanedScrollLocks } from "@/lib/scrollLock";

const WATCHDOG_TIMEOUT_MS = 2200;

interface RouteTrackerProps {
  onRouteChanged: (fullRoute: string) => void;
}

const RouteAndDebugTracker: React.FC<RouteTrackerProps> = ({ onRouteChanged }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchStr = searchParams ? searchParams.toString() : "";
  const fullRoute = searchStr ? `${pathname}?${searchStr}` : pathname || "/";
  const isDebugMode =
    searchParams?.get("debugNavigation") === "1" ||
    searchParams?.get("debugNavigation") === "true";

  const [diag, setDiag] = useState<NavigationDiagnosticsState>(() =>
    getNavigationDiagnostics()
  );

  useEffect(() => {
    updateNavigationDiagnostics({
      route: fullRoute,
      activeScrollLocks: getActiveLocks(),
    });
    onRouteChanged(fullRoute);

    // Reconcile genuinely orphaned locks after modal exit transitions finish
    const lockCheckTimer = setTimeout(() => {
      if (reconcileOrphanedScrollLocks()) {
        updateNavigationDiagnostics({
          activeScrollLocks: getActiveLocks(),
          lastRecoveryAction: "reconciled-orphaned-scroll-lock",
        });
      }
    }, 450);

    return () => clearTimeout(lockCheckTimer);
  }, [fullRoute, onRouteChanged]);

  useEffect(() => {
    if (!isDebugMode) return;
    setDiag(getNavigationDiagnostics());
    return subscribeNavigationDiagnostics(() => {
      setDiag(getNavigationDiagnostics());
    });
  }, [isDebugMode]);

  if (!isDebugMode) return null;

  return (
    <aside
      data-testid="vanvas-nav-diagnostics"
      aria-label="Navigation Runtime Diagnostics"
      className="fixed top-16 right-3 z-[9998] w-[310px] max-w-[calc(100vw-24px)] rounded-2xl bg-[#102C26]/95 text-[#FAF7F0] border border-[#B49252]/60 shadow-2xl p-3 text-[11px] font-mono backdrop-blur-md space-y-2"
    >
      <div className="flex items-center justify-between border-b border-[#B49252]/30 pb-1.5">
        <div className="flex items-center gap-1.5 font-bold text-[#B49252]">
          <Activity className="w-3.5 h-3.5" />
          <span>NAV DIAGNOSTICS</span>
        </div>
        <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] uppercase">
          {diag.navState}
        </span>
      </div>

      <div className="space-y-1 text-[10px] leading-snug break-all">
        <div><span className="text-[#B49252]">route:</span> {diag.route}</div>
        <div><span className="text-[#B49252]">build:</span> {diag.buildId}</div>
        <div><span className="text-[#B49252]">swCtrl:</span> {diag.controllerState}</div>
        <div>
          <span className="text-[#B49252]">workers:</span> active={diag.activeWorkerState || "none"} · wait={diag.waitingWorkerState || "none"}
        </div>
        <div>
          <span className="text-[#B49252]">cacheVer:</span> {diag.cacheVersion} · swReload={String(diag.reloadedOnControllerChange)}
        </div>
        <div><span className="text-[#B49252]">scrollLocks:</span> {diag.activeScrollLocks}</div>
        {diag.lastClickedTarget && (
          <div>
            <span className="text-[#B49252]">lastClick:</span> {diag.lastClickedTarget.targetPathname} (fb={String(diag.lastClickedTarget.fallbackNavigationUsed)})
          </div>
        )}
        {diag.lastRecoveryAction && (
          <div><span className="text-[#B49252]">lastRecovery:</span> {diag.lastRecoveryAction}</div>
        )}
        {diag.lastNavError && (
          <div className="text-rose-300"><span className="font-bold">navErr:</span> {diag.lastNavError}</div>
        )}
        {diag.lastChunkError && (
          <div className="text-amber-300"><span className="font-bold">chunkErr:</span> {diag.lastChunkError.message}</div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[#B49252]/30">
        <button
          type="button"
          data-testid="diag-recheck-sw"
          onClick={() => (window as any).__VANVAS_SW_CONTROL__?.recheck?.()}
          className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] cursor-pointer"
        >
          Recheck SW
        </button>
        <button
          type="button"
          data-testid="diag-update-sw"
          onClick={() => (window as any).__VANVAS_SW_CONTROL__?.requestUpdate?.()}
          className="px-2 py-1 rounded bg-[#B49252]/30 hover:bg-[#B49252]/50 text-[10px] cursor-pointer"
        >
          Update SW
        </button>
        <button
          type="button"
          data-testid="diag-reload-page"
          onClick={() => clearChunkRecoveryBannerAndReload()}
          className="px-2 py-1 rounded bg-[#B65E3C] hover:bg-[#9E4D2E] text-[10px] font-bold cursor-pointer"
        >
          Reload Safe
        </button>
      </div>
    </aside>
  );
};

export const NavigationRecoveryProvider: React.FC = () => {
  const [diagState, setDiagState] = useState<NavigationDiagnosticsState>(() =>
    getNavigationDiagnostics()
  );

  const pendingWatchdogRef = useRef<{
    timer: ReturnType<typeof setTimeout>;
    targetHref: string;
    targetKey: string;
    entry: ClickedTargetTelemetry;
  } | null>(null);

  const cancelPendingWatchdog = (completed: boolean) => {
    const pending = pendingWatchdogRef.current;
    if (!pending) return;
    clearTimeout(pending.timer);
    pendingWatchdogRef.current = null;
    if (completed) {
      recordNavigationTelemetry({
        ...pending.entry,
        nextNavigationCompleted: true,
      });
      updateNavigationDiagnostics({ navState: "idle" });
    }
  };

  const handleRouteChanged = useRef((fullRoute: string) => {
    const pending = pendingWatchdogRef.current;
    if (pending) {
      const currentKey =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : fullRoute;
      if (currentKey === pending.targetKey || fullRoute === pending.targetKey) {
        cancelPendingWatchdog(true);
      }
    }
  }).current;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const unsubscribe = subscribeNavigationDiagnostics(() => {
      setDiagState(getNavigationDiagnostics());
    });

    // Stability window: once runtime stays mounted & healthy for 6s, reset chunk recovery guard
    const stabilityTimer = setTimeout(() => {
      resetChunkRecoveryGuardOnStableHydration();
    }, 6000);

    // 1. Global Chunk Error Listeners (Capture resource failures + JS errors + unhandled rejections)
    const handleResourceOrRuntimeError = (event: Event) => {
      const target = event.target as (HTMLElement & { src?: string; href?: string }) | null;
      if (target && (target.tagName === "SCRIPT" || target.tagName === "LINK")) {
        const assetUrl = target.src || target.href || "";
        if (isChunkLoadError("Chunk resource failed to load", assetUrl)) {
          attemptChunkErrorRecovery({
            message: `Failed to load static chunk (${target.tagName.toLowerCase()})`,
            asset: assetUrl,
          });
        }
        return;
      }

      const errEvent = event as ErrorEvent;
      const msg = errEvent.message || errEvent.error?.message || "";
      const filename = errEvent.filename || "";
      if (isChunkLoadError(msg, filename)) {
        attemptChunkErrorRecovery({ message: msg, asset: filename });
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg =
        reason instanceof Error
          ? `${reason.name}: ${reason.message}`
          : typeof reason === "string"
          ? reason
          : String(reason?.message || "");
      if (isChunkLoadError(msg)) {
        attemptChunkErrorRecovery({ message: msg });
      }
    };

    // 2. Scroll-lock telemetry sync
    const handleScrollLockChange = () => {
      updateNavigationDiagnostics({ activeScrollLocks: getActiveLocks() });
    };

    // 3. Same-origin internal route watchdog
    const handleDocumentClickCapture = (e: MouseEvent) => {
      if (
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      const targetEl = e.target as Element | null;
      const anchor = targetEl?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;

      if (
        anchor.hasAttribute("download") ||
        (anchor.getAttribute("target") && anchor.getAttribute("target") !== "_self") ||
        anchor.getAttribute("aria-disabled") === "true" ||
        anchor.getAttribute("data-disabled") === "true"
      ) {
        return;
      }

      const rawHref = (anchor.getAttribute("href") || "").trim();
      if (
        !rawHref ||
        rawHref.startsWith("#") ||
        rawHref.startsWith("mailto:") ||
        rawHref.startsWith("tel:") ||
        rawHref.startsWith("javascript:")
      ) {
        return;
      }

      let resolvedTarget: URL;
      try {
        resolvedTarget = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (resolvedTarget.origin !== window.location.origin) {
        return;
      }

      const sourcePathname = window.location.pathname + window.location.search;
      const targetKey = resolvedTarget.pathname + resolvedTarget.search;

      // Ignore hash-only navigation on the same pathname+search
      if (targetKey === sourcePathname) {
        return;
      }

      // Cancel any older unresolved watchdog before tracking the latest click
      cancelPendingWatchdog(false);

      const testId = anchor.getAttribute("data-testid") || undefined;
      const entry: ClickedTargetTelemetry = {
        sourcePathname,
        targetPathname: targetKey,
        targetHref: resolvedTarget.href,
        tag: anchor.tagName,
        testId,
        clickReceived: true,
        nextNavigationCompleted: false,
        fallbackNavigationUsed: false,
        at: Date.now(),
      };

      recordNavigationTelemetry(entry);
      updateNavigationDiagnostics({ navState: "navigating", lastNavError: null });

      const timer = setTimeout(() => {
        const currentKey = window.location.pathname + window.location.search;
        if (currentKey === targetKey) {
          cancelPendingWatchdog(true);
          return;
        }

        // Next.js client navigation did not commit within watchdog window; recover safely
        pendingWatchdogRef.current = null;
        recordNavigationTelemetry({
          ...entry,
          nextNavigationCompleted: false,
          fallbackNavigationUsed: true,
        });
        updateNavigationDiagnostics({
          navState: "recovered",
          lastRecoveryAction: `watchdog-hard-nav:${targetKey}`,
        });
        window.location.assign(resolvedTarget.href);
      }, WATCHDOG_TIMEOUT_MS);

      pendingWatchdogRef.current = {
        timer,
        targetHref: resolvedTarget.href,
        targetKey,
        entry,
      };
    };

    const handlePopStateOrNavComplete = () => {
      const pending = pendingWatchdogRef.current;
      if (!pending) return;
      const currentKey = window.location.pathname + window.location.search;
      if (currentKey === pending.targetKey) {
        cancelPendingWatchdog(true);
      }
    };

    window.addEventListener("error", handleResourceOrRuntimeError, true);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("vanvas:scroll-lock-change", handleScrollLockChange);
    window.addEventListener("popstate", handlePopStateOrNavComplete);
    document.addEventListener("click", handleDocumentClickCapture, true);
    (window as any).__VANVAS_RECOVERY_READY__ = true;

    return () => {
      (window as any).__VANVAS_RECOVERY_READY__ = false;
      clearTimeout(stabilityTimer);
      cancelPendingWatchdog(false);
      unsubscribe();
      window.removeEventListener("error", handleResourceOrRuntimeError, true);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("vanvas:scroll-lock-change", handleScrollLockChange);
      window.removeEventListener("popstate", handlePopStateOrNavComplete);
      document.removeEventListener("click", handleDocumentClickCapture, true);
    };
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <RouteAndDebugTracker onRouteChanged={handleRouteChanged} />
      </Suspense>

      {diagState.chunkRecoveryFailed && (
        <div
          role="alertdialog"
          aria-modal="false"
          data-testid="vanvas-chunk-recovery-banner"
          className="fixed bottom-20 xl:bottom-6 left-4 right-4 xl:left-auto xl:right-6 xl:max-w-md z-[9999] rounded-2xl bg-[#173B32] text-[#FAF4E8] border-2 border-[#B49252] shadow-2xl p-4 flex items-center justify-between gap-3"
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <AlertTriangle className="w-5 h-5 text-[#B49252] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h4 className="font-serif font-bold text-sm text-[#FAF4E8]">
                App Update Needed
              </h4>
              <p className="text-[11px] text-[#D8DED5]/90 mt-0.5 leading-snug">
                A new version of VANVAS is available and one resource could not load automatically.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              data-testid="chunk-recovery-reload-btn"
              onClick={() => clearChunkRecoveryBannerAndReload()}
              className="px-3 py-1.5 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#FAF4E8] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload Application</span>
            </button>
            <button
              type="button"
              aria-label="Dismiss update message"
              onClick={() => updateNavigationDiagnostics({ chunkRecoveryFailed: false })}
              className="p-1.5 rounded-lg text-[#D8DED5] hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

