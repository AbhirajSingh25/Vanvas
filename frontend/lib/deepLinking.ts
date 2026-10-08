"use client";

import { isCapacitorNative } from "./capacitor";
import { storageAdapter } from "./storage";
import { trackEvent } from "./analytics";

export function parseDeepLinkUrl(rawUrl: string): string | null {
  if (!rawUrl) return null;

  try {
    // Handle custom scheme: vanvas://trips/123 -> /trips/123
    if (rawUrl.startsWith("vanvas://")) {
      const path = rawUrl.replace("vanvas://", "/");
      return path.startsWith("/") ? path : `/${path}`;
    }

    // Handle universal URL: https://vanvasai.vercel.app/trips/123 -> /trips/123
    const parsed = new URL(rawUrl);
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    // If it's already a relative path
    if (rawUrl.startsWith("/")) {
      return rawUrl;
    }
    return null;
  }
}

export function savePendingDeepLink(path: string): void {
  if (!path) return;
  storageAdapter.setItem("vanvas_pending_deep_link", path);
}

export function popPendingDeepLink(): string | null {
  const pending = storageAdapter.getItem("vanvas_pending_deep_link");
  if (pending) {
    storageAdapter.removeItem("vanvas_pending_deep_link");
    return pending;
  }
  return null;
}

export async function setupDeepLinkListener(onNavigate: (path: string) => void): Promise<() => void> {
  if (typeof window === "undefined" || !isCapacitorNative()) {
    return () => {};
  }

  try {
    const { App } = await import("@capacitor/app");
    const listener = await App.addListener("appUrlOpen", (data) => {
      const path = parseDeepLinkUrl(data.url);
      if (path) {
        trackEvent("notification_opened", { url: path });
        onNavigate(path);
      }
    });

    return () => {
      listener.remove();
    };
  } catch {
    return () => {};
  }
}
