"use client";

import { storageAdapter } from "./storage";

export type AnalyticsEventName =
  | "app_opened"
  | "startup_completed"
  | "login_success"
  | "trip_created"
  | "transport_selected"
  | "trip_opened"
  | "road_trip_opened"
  | "budget_editor_opened"
  | "budget_changed"
  | "expense_added"
  | "expense_deleted"
  | "ask_vanvas_query"
  | "ask_vanvas_action"
  | "place_viewed"
  | "place_saved"
  | "place_added_to_itinerary"
  | "replan_previewed"
  | "replan_applied"
  | "offline_entered"
  | "offline_exited"
  | "notification_permission_granted"
  | "notification_permission_denied"
  | "push_received"
  | "notification_opened"
  | "install_prompt_shown"
  | "pwa_installed"
  | "support_ticket_created"
  | "booking_search_started"
  | "booking_availability_checked"
  | "booking_price_revalidated"
  | "booking_checkout_opened"
  | "booking_payment_started"
  | "booking_payment_succeeded"
  | "booking_payment_failed"
  | "booking_created"
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_refund_started"
  | "booking_refund_completed"
  | "provider_handoff_started"
  | "provider_handoff_returned";

const SENSITIVE_PROPERTY_KEYS = [
  "password",
  "token",
  "access_token",
  "jwt",
  "secret",
  "authorization",
  "card",
  "cvv",
  "otp",
  "hashed_password",
];

export function sanitizeAnalyticsProperties(props?: Record<string, any>): Record<string, any> {
  if (!props) return {};
  const cleaned: Record<string, any> = {};

  for (const [key, val] of Object.entries(props)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_PROPERTY_KEYS.some((sensitive) => lowerKey.includes(sensitive));

    if (isSensitive) {
      continue;
    }

    if (typeof val === "string" && val.length > 300) {
      cleaned[key] = val.substring(0, 300) + "...";
    } else if (typeof val === "object" && val !== null) {
      // Shallow sanitize
      cleaned[key] = Array.isArray(val) ? val.length : "[Object]";
    } else {
      cleaned[key] = val;
    }
  }

  return cleaned;
}

export function getAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return true;
  const val = storageAdapter.getItem("vanvas_analytics_consent");
  return val !== "false"; // Default to true unless explicitly opted out
}

export function setAnalyticsConsent(granted: boolean): void {
  storageAdapter.setItem("vanvas_analytics_consent", granted ? "true" : "false");
}

export function trackEvent(name: AnalyticsEventName, properties?: Record<string, any>): void {
  if (!getAnalyticsConsent()) {
    return;
  }

  const sanitized = sanitizeAnalyticsProperties(properties);

  if (process.env.NODE_ENV !== "production") {
    // Development mode safe logger
    console.debug(`[VANVAS Analytics] ${name}:`, sanitized);
    return;
  }

  // In production, dispatch to Vercel Analytics / Custom Provider
  try {
    if (typeof window !== "undefined" && (window as any).va) {
      (window as any).va("event", { name, data: sanitized });
    }
  } catch {}
}
