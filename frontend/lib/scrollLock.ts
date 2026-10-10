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
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  activeLocks++;
}

export function releaseScrollLock(): void {
  if (typeof document === "undefined") return;
  activeLocks = Math.max(0, activeLocks - 1);
  if (activeLocks === 0) {
    document.body.style.overflow = previousOverflow || "";
  }
}
