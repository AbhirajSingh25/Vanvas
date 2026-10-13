/**
 * VANVAS Unified Reference-Counted Scroll Lock Manager
 *
 * Prevents multiple modal overlays (e.g. PlaceModal + ChaloLauncherModal + Copilot)
 * from interfering with each other's scroll lock state, ensuring scroll is only
 * restored when all active overlays have closed or unmounted.
 */

let activeLocks = 0;
let previousOverflow = "";

export function acquireScrollLock(): void {
  if (typeof document === "undefined") return;
  if (activeLocks === 0) {
    const current = document.body.style.overflow;
    previousOverflow = current === "hidden" ? "" : current;
    document.body.style.overflow = "hidden";
  }
  activeLocks++;
  if (typeof window !== "undefined") {
    (window as any).__VANVAS_ACTIVE_LOCKS__ = activeLocks;
  }
}

export function releaseScrollLock(): void {
  if (typeof document === "undefined") return;
  activeLocks = Math.max(0, activeLocks - 1);
  if (activeLocks === 0) {
    document.body.style.overflow = (previousOverflow === "hidden" ? "" : previousOverflow) || "";
    previousOverflow = "";
  }
  if (typeof window !== "undefined") {
    (window as any).__VANVAS_ACTIVE_LOCKS__ = activeLocks;
  }
}

export function forceReleaseScrollLock(): void {
  if (typeof document === "undefined") return;
  activeLocks = 0;
  previousOverflow = "";
  document.body.style.overflow = "";
  if (typeof window !== "undefined") {
    (window as any).__VANVAS_ACTIVE_LOCKS__ = 0;
  }
}

export function getActiveLocks(): number {
  return activeLocks;
}
