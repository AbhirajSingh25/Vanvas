"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV === "production") {
      // Register service worker in production
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .then((registration) => {
            console.log("[VANVAS PWA] Service worker registered with scope:", registration.scope);
          })
          .catch((error) => {
            console.warn("[VANVAS PWA] Service worker registration failed:", error);
          });
      });
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
