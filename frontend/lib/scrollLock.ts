/**
 * VANVAS Unified Reference-Counted Scroll Lock Manager
 *
 * Prevents multiple modal overlays (e.g. PlaceModal + ChaloLauncherModal + Copilot)
 * from interfering with each other's scroll lock state, ensuring scroll is only
 * restored when all active overlays have closed or unmounted.
 */

let activeLocks = 0;
let previousOverflow = "";
const namedLocks = new Set<string>();

function syncGlobalLockState(): void {
  if (typeof window !== "undefined") {
    (window as any).__VANVAS_ACTIVE_LOCKS__ = activeLocks;
    window.dispatchEvent(
      new CustomEvent("vanvas:scroll-lock-change", { detail: { activeLocks } })
    );
  }
}

export function acquireScrollLock(lockId?: string): void {
  if (typeof document === "undefined") return;
  if (lockId) {
    if (namedLocks.has(lockId)) {
      return;
    }
    namedLocks.add(lockId);
  }
  if (activeLocks === 0) {
    const current = document.body.style.overflow;
    previousOverflow = current === "hidden" ? "" : current;
    document.body.style.overflow = "hidden";
  }
  activeLocks++;
  syncGlobalLockState();
}

export function releaseScrollLock(lockId?: string): void {
  if (typeof document === "undefined") return;
  if (lockId) {
    if (!namedLocks.has(lockId)) {
      return;
    }
    namedLocks.delete(lockId);
  }
  activeLocks = Math.max(0, activeLocks - 1);
  if (activeLocks === 0) {
    document.body.style.overflow = (previousOverflow === "hidden" ? "" : previousOverflow) || "";
    previousOverflow = "";
  }
  syncGlobalLockState();
}

export function forceReleaseScrollLock(): void {
  if (typeof document === "undefined") return;
  namedLocks.clear();
  activeLocks = 0;
  previousOverflow = "";
  document.body.style.overflow = "";
  syncGlobalLockState();
}

/**
 * Safely cleans up an orphaned scroll lock ONLY when no modal/dialog element
 * exists in the DOM (e.g. after a route change unmounted a modal unexpectedly).
 */
export function reconcileOrphanedScrollLocks(): boolean {
  if (typeof document === "undefined") return false;
  if (activeLocks === 0 && document.body.style.overflow !== "hidden") {
    return false;
  }
  const openDialogs = document.querySelectorAll('[aria-modal="true"], [role="dialog"]');
  if (openDialogs.length === 0) {
    forceReleaseScrollLock();
    return true;
  }
  return false;
}

export function getActiveLocks(): number {
  return activeLocks;
}
