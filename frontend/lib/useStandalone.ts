"use client";

import { useState, useEffect } from "react";

export interface StandaloneState {
  isStandalone: boolean;
  isIos: boolean;
  isIosStandalone: boolean;
}

export function useStandalone(): StandaloneState {
  const [state, setState] = useState<StandaloneState>({
    isStandalone: false,
    isIos: false,
    isIosStandalone: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent) ||
      (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);

    const isIosStandalone = (window.navigator as any).standalone === true;
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const isCapacitorNative = Boolean((window as any)?.Capacitor?.isNativePlatform?.());
    let isForced = false;
    try {
      const sp = new URLSearchParams(window.location.search);
      const m = sp.get("mode") || sp.get("app");
      if (m === "app" || m === "standalone" || m === "true" || m === "1") {
        isForced = true;
      } else if (localStorage.getItem("vanvas_force_runtime_mode") === "standalone") {
        isForced = true;
      }
    } catch {}

    const isStandalone = mediaQuery.matches || isIosStandalone || isCapacitorNative || isForced;

    setState({
      isStandalone,
      isIos,
      isIosStandalone,
    });

    const handler = (e: MediaQueryListEvent) => {
      setState((prev) => ({
        ...prev,
        isStandalone: e.matches || ((window.navigator as any).standalone === true) || isCapacitorNative || isForced,
      }));
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    } else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(handler);
      return () => (mediaQuery as any).removeListener(handler);
    }
  }, []);

  return state;
}
