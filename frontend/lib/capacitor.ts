"use client";

import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { Browser } from "@capacitor/browser";

export const isNativeAndroid = (): boolean => {
  return typeof window !== "undefined" && Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
};

export const isCapacitorNative = (): boolean => {
  return typeof window !== "undefined" && Capacitor.isNativePlatform();
};

// Modal and drawer dismissal handler stack
type BackHandler = () => boolean; // return true if handled
const backHandlers: BackHandler[] = [];

export function registerBackHandler(handler: BackHandler): () => void {
  backHandlers.push(handler);
  return () => {
    const idx = backHandlers.indexOf(handler);
    if (idx !== -1) {
      backHandlers.splice(idx, 1);
    }
  };
}

export function handleDismissTopmost(): boolean {
  for (let i = backHandlers.length - 1; i >= 0; i--) {
    const handler = backHandlers[i];
    try {
      if (handler()) {
        return true;
      }
    } catch {
      // Continue to next handler if error
    }
  }

  // Check DOM for open dialogs or elements marked with modal/drawer data attributes
  if (typeof document !== "undefined") {
    const openModals = document.querySelectorAll<HTMLElement>('[data-vanvas-modal="open"], dialog[open], [role="dialog"][data-state="open"]');
    if (openModals.length > 0) {
      const topModal = openModals[openModals.length - 1];
      const closeBtn = topModal.querySelector<HTMLElement>('button[aria-label="Close"], button[data-action="close"], .close-button, button.vanvas-modal-close');
      if (closeBtn) {
        closeBtn.click();
        return true;
      }
    }
  }

  return false;
}

export async function openExternalUrl(url: string): Promise<void> {
  if (!url) return;
  if (isCapacitorNative()) {
    try {
      await Browser.open({
        url,
        windowName: "_blank",
        presentationStyle: "popover",
        toolbarColor: "#173B32",
      });
      return;
    } catch {
      // Fallback
    }
  }
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
