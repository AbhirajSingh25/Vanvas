"use client";

import { isCapacitorNative } from "./capacitor";
import { api } from "./api";
import { storageAdapter } from "./storage";
import { trackEvent } from "./analytics";
import { reportError } from "./monitoring";

export interface PushRegistrationResult {
  granted: boolean;
  token?: string;
  error?: string;
}

let isInitialized = false;

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  if (isCapacitorNative()) {
    try {
      const { PushNotifications } = await import("@capacitor/push-notifications");
      const permStatus = await PushNotifications.requestPermissions();
      const granted = permStatus.receive === "granted";
      if (granted) {
        trackEvent("notification_permission_granted");
        await PushNotifications.register();
      } else {
        trackEvent("notification_permission_denied");
      }
      return granted;
    } catch (err: any) {
      reportError(err, { feature_name: "push_permission_request" });
      return false;
    }
  }

  // Web Push fallback
  if ("Notification" in window) {
    try {
      const permission = await Notification.requestPermission();
      const granted = permission === "granted";
      if (granted) {
        trackEvent("notification_permission_granted");
      } else {
        trackEvent("notification_permission_denied");
      }
      return granted;
    } catch {
      return false;
    }
  }

  return false;
}

export async function initPushNotifications(onNavigate?: (path: string) => void): Promise<void> {
  if (isInitialized || typeof window === "undefined" || !isCapacitorNative()) {
    return;
  }

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");

    // Add registration listeners
    await PushNotifications.addListener("registration", async (token) => {
      const pushToken = token.value;
      storageAdapter.setItem("vanvas_push_token", pushToken);

      // Register device token with VANVAS backend if authenticated
      const savedToken = storageAdapter.getItem("vanvas_token");
      if (savedToken && pushToken) {
        try {
          await api.registerDeviceToken({
            push_token: pushToken,
            platform: "android",
            app_version: "0.1.0",
            permission_state: "granted",
          });
        } catch (err) {
          console.warn("[VANVAS Push] Device registration sync warning:", err);
        }
      }
    });

    await PushNotifications.addListener("registrationError", (err) => {
      reportError(err.error || "Push registration error", { feature_name: "push_registration_error" });
    });

    await PushNotifications.addListener("pushNotificationReceived", (notification) => {
      trackEvent("push_received", {
        title: notification.title,
        id: notification.id,
      });
    });

    await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const data = action.notification.data || {};
      trackEvent("notification_opened", {
        actionId: action.actionId,
        notificationId: action.notification.id,
      });

      const deepLink = data.deep_link || (data.trip_id ? `/trips/${data.trip_id}` : null);
      if (deepLink) {
        if (onNavigate) {
          onNavigate(deepLink);
        } else if (typeof window !== "undefined") {
          window.location.href = deepLink;
        }
      }
    });

    isInitialized = true;
  } catch (err: any) {
    reportError(err, { feature_name: "init_push_notifications" });
  }
}

export async function deactivatePushToken(): Promise<void> {
  const pushToken = storageAdapter.getItem("vanvas_push_token");
  if (!pushToken) return;

  try {
    await api.deactivateDeviceToken(pushToken);
  } catch {}
}
