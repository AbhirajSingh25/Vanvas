/**
 * Runtime Mode Detection for VANVAS
 * 
 * Accurately distinguishes:
 * 1. Installed App Mode (PWA standalone, iOS standalone, Capacitor native)
 * 2. Mobile Browser Mode (Responsive website viewed on mobile browser / Safari)
 * 3. Desktop Website Mode (Full editorial website viewed on desktop / laptop)
 */

export type RuntimeMode = "standalone" | "mobile_web" | "desktop_web";

export interface RuntimeEnvironment {
  isStandaloneApp: boolean;
  isMobileBrowser: boolean;
  isDesktopWebsite: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  hasTouch: boolean;
  runtimeMode: RuntimeMode;
}

export function detectRuntimeEnvironment(): RuntimeEnvironment {
  if (typeof window === "undefined") {
    return {
      isStandaloneApp: false,
      isMobileBrowser: false,
      isDesktopWebsite: true,
      isIOS: false,
      isAndroid: false,
      hasTouch: false,
      runtimeMode: "desktop_web",
    };
  }

  // 1. Standalone App Detection
  const isMediaStandalone = window.matchMedia && window.matchMedia("(display-mode: standalone)").matches;
  const isNavigatorStandalone = Boolean((window.navigator as any)?.standalone);
  const isCapacitorNative = Boolean((window as any)?.Capacitor?.isNativePlatform?.());

  // Allow manual toggle via URL query or localStorage for testing / demonstration (e.g., ?mode=app or ?app=true)
  let isForcedApp = false;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get("mode");
    const appParam = urlParams.get("app");
    if (modeParam === "app" || modeParam === "standalone" || appParam === "true" || appParam === "1") {
      isForcedApp = true;
    } else if (localStorage.getItem("vanvas_force_runtime_mode") === "standalone") {
      isForcedApp = true;
    }
  } catch {}

  const isStandaloneApp = isMediaStandalone || isNavigatorStandalone || isCapacitorNative || isForcedApp;

  // 2. OS & Device heuristics
  const ua = window.navigator.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const hasTouch = "ontouchstart" in window || (navigator.maxTouchPoints || 0) > 0;
  const isNarrowScreen = window.innerWidth < 1024;

  const isMobileBrowser = !isStandaloneApp && (isIOS || isAndroid || (hasTouch && isNarrowScreen));
  const isDesktopWebsite = !isStandaloneApp && !isMobileBrowser;

  const runtimeMode: RuntimeMode = isStandaloneApp
    ? "standalone"
    : isMobileBrowser
    ? "mobile_web"
    : "desktop_web";

  return {
    isStandaloneApp,
    isMobileBrowser,
    isDesktopWebsite,
    isIOS,
    isAndroid,
    hasTouch,
    runtimeMode,
  };
}
