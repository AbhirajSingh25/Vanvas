"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isCapacitorNative } from "@/lib/capacitor";
import { popPendingDeepLink, setupDeepLinkListener } from "@/lib/deepLinking";
import { initPushNotifications } from "@/lib/pushNotifications";
import { trackEvent } from "@/lib/analytics";
import { useAuth } from "@/context/AuthContext";

export function AppLifecycleHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    trackEvent("app_opened", { route: pathname });

    // Deep link and push listeners
    const cleanupDeepLinks = setupDeepLinkListener((path) => {
      if (isAuthenticated || !path.startsWith("/trips/")) {
        router.push(path);
      } else {
        // If unauthenticated and navigating to a private trip, save and prompt login
        router.push(`/login?redirect=${encodeURIComponent(path)}`);
      }
    });

    initPushNotifications((path) => {
      router.push(path);
    });

    // Check if there was any pending deep link that can now be navigated to
    if (isAuthenticated) {
      const pending = popPendingDeepLink();
      if (pending && pending !== pathname) {
        router.push(pending);
      }
    }

    // App state listener for foreground resume
    let cleanupAppState: (() => void) | undefined;
    if (isCapacitorNative()) {
      import("@capacitor/app").then(({ App }) => {
        App.addListener("appStateChange", (state) => {
          if (state.isActive) {
            // App resumed from background
            const pending = popPendingDeepLink();
            if (pending && pending !== window.location.pathname) {
              router.push(pending);
            }
          }
        }).then((handle) => {
          cleanupAppState = () => handle.remove();
        });
      });
    }

    return () => {
      cleanupDeepLinks.then((unsub) => unsub());
      if (cleanupAppState) cleanupAppState();
    };
  }, [isAuthenticated, pathname, router]);

  return null;
}
