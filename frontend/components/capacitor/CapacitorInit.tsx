"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { isCapacitorNative, handleDismissTopmost, openExternalUrl } from "@/lib/capacitor";

export function CapacitorInit() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isCapacitorNative()) return;

    // 1. Initialize Status Bar with deep forest styling
    const configureStatusBar = async () => {
      try {
        const isDark = document.documentElement.classList.contains("dark");
        await StatusBar.setStyle({
          style: isDark ? Style.Dark : Style.Light,
        });
        await StatusBar.setBackgroundColor({
          color: "#102C26",
        });
        await StatusBar.setOverlaysWebView({
          overlay: false,
        });
      } catch {
        // Ignored if status bar is unavailable
      }
    };

    configureStatusBar();

    // 2. Hide Splash Screen cleanly once app shell is hydrated & ready
    const hideSplash = async () => {
      try {
        await SplashScreen.hide({ fadeOutDuration: 250 });
      } catch {
        // Ignored if splash screen is unavailable
      }
    };

    // Give the app shell a brief moment (180ms) to paint the first useful screen, then fade out native splash
    const splashTimer = setTimeout(hideSplash, 180);

    // Failsafe timeout: ensure native splash is NEVER permanently stuck
    const failsafeTimer = setTimeout(hideSplash, 9000);

    return () => {
      clearTimeout(splashTimer);
      clearTimeout(failsafeTimer);
    };
  }, []); // Run ONCE on application hydration, NOT on every pathname change

  useEffect(() => {
    if (!isCapacitorNative()) return;

    // 3. Android Hardware / Gesture Back Button Handling
    let backListenerHandle: { remove: () => void } | null = null;

    const setupBackNavigation = async () => {
      try {
        const handle = await App.addListener("backButton", ({ canGoBack }) => {
          // Priority 1: If any modal or drawer is open, dismiss it
          const dismissed = handleDismissTopmost();
          if (dismissed) {
            return;
          }

          // Priority 2: Contextual route unwinding
          const currentPath = window.location.pathname;

          if (currentPath.startsWith("/trips/") && currentPath !== "/trips") {
            router.push("/trips");
            return;
          }

          if (currentPath.startsWith("/explore/") && currentPath !== "/explore") {
            router.push("/explore");
            return;
          }

          if (currentPath.startsWith("/treks/") && currentPath !== "/treks") {
            router.push("/treks");
            return;
          }

          if (currentPath.startsWith("/join/") && currentPath !== "/join") {
            router.push("/join");
            return;
          }

          // Priority 3: Subpages go back or to home
          if (currentPath !== "/" && currentPath !== "") {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push("/");
            }
            return;
          }

          // Priority 4: At home root, standard Android exit behavior
          App.exitApp();
        });

        backListenerHandle = handle;
      } catch {
        // Non-Android platforms
      }
    };

    setupBackNavigation();

    // 4. Intercept external link clicks to use native In-App Browser
    const handleGlobalClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Check if it's an external absolute URL
      if (href.startsWith("http://") || href.startsWith("https://")) {
        try {
          const urlObj = new URL(href);
          const currentHost = window.location.hostname;
          const isSameApp =
            urlObj.hostname === currentHost ||
            urlObj.hostname === "vanvasai.vercel.app" ||
            urlObj.hostname === "vanvas-api.onrender.com" ||
            urlObj.hostname === "localhost" ||
            urlObj.hostname === "127.0.0.1";

          if (!isSameApp || target.getAttribute("target") === "_blank") {
            e.preventDefault();
            e.stopPropagation();
            openExternalUrl(href);
          }
        } catch {
          // Invalid URL, let standard browser handle it
        }
      }
    };

    document.addEventListener("click", handleGlobalClick, { capture: true });

    return () => {
      if (backListenerHandle) {
        backListenerHandle.remove();
      }
      document.removeEventListener("click", handleGlobalClick, { capture: true });
    };
  }, [router]);

  return null;
}
