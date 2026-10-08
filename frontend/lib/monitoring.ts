"use client";

import { isNativeAndroid, isCapacitorNative } from "./capacitor";

export interface ErrorContext {
  app_version?: string;
  platform?: "android" | "ios" | "pwa" | "web";
  route?: string;
  environment?: string;
  provider?: string;
  feature_name?: string;
  correlation_id?: string;
  extra?: Record<string, any>;
}

const SENSITIVE_PATTERNS = [
  /bearer\s+[a-zA-Z0-9_\-\.]+/gi,
  /password["':\s]+[^\s,"']+/gi,
  /token["':\s]+[^\s,"']+/gi,
  /secret["':\s]+[^\s,"']+/gi,
  /key["':\s]+[a-zA-Z0-9_\-]{16,}/gi,
];

export function sanitizeErrorMessage(message: string): string {
  if (!message) return "";
  let sanitized = message;
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[REDACTED_SECRET]");
  }
  return sanitized;
}

export function getPlatformIdentifier(): "android" | "ios" | "pwa" | "web" {
  if (isNativeAndroid()) return "android";
  if (isCapacitorNative()) return "ios";
  if (typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches) {
    return "pwa";
  }
  return "web";
}

export function getBaseErrorContext(): ErrorContext {
  return {
    app_version: "0.1.0",
    platform: getPlatformIdentifier(),
    route: typeof window !== "undefined" ? window.location.pathname : "/",
    environment: process.env.NODE_ENV || "production",
    correlation_id: `diag_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`,
  };
}

export function reportError(error: Error | string, context?: Partial<ErrorContext>): void {
  const baseContext = getBaseErrorContext();
  const mergedContext: ErrorContext = {
    ...baseContext,
    ...context,
  };

  const rawMessage = typeof error === "string" ? error : error?.message || "Unknown error";
  const safeMessage = sanitizeErrorMessage(rawMessage);

  if (process.env.NODE_ENV !== "production") {
    console.error("[VANVAS Monitoring] Exception:", safeMessage, mergedContext);
    return;
  }

  // If Sentry is loaded / configured via environment, dispatch to Sentry
  if (typeof window !== "undefined" && (window as any).Sentry) {
    try {
      (window as any).Sentry.withScope((scope: any) => {
        scope.setTag("app_version", mergedContext.app_version);
        scope.setTag("platform", mergedContext.platform);
        if (mergedContext.provider) scope.setTag("provider", mergedContext.provider);
        if (mergedContext.feature_name) scope.setTag("feature_name", mergedContext.feature_name);
        if (mergedContext.correlation_id) scope.setTag("correlation_id", mergedContext.correlation_id);
        (window as any).Sentry.captureException(typeof error === "string" ? new Error(safeMessage) : error);
      });
    } catch {}
  }
}
