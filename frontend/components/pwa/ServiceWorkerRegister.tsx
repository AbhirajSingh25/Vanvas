"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV === "production") {
      let reg: ServiceWorkerRegistration | null = null;

      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible" && reg) {
          reg.update().catch(() => {});
        }
      };

      const registerSW = () => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .then((registration) => {
            reg = registration;
            console.log("[VANVAS PWA] Service worker registered with scope:", registration.scope);

            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                    console.log("[VANVAS PWA] New update installed.");
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.warn("[VANVAS PWA] Service worker registration failed:", error);
          });
      };

      if (document.readyState === "complete") {
        registerSW();
      } else {
        window.addEventListener("load", registerSW);
      }

      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        window.removeEventListener("load", registerSW);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    } else {
      // Development safety: Unregister any existing service worker to prevent stale dev caching
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().then(() => {
            console.log("[VANVAS DEV] Unregistered stale service worker for development safety");
          });
        }
      });
    }
  }, []);

  return null;
}
