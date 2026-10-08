"use client";

import { api } from "./api";

export const APP_VERSION = "0.1.0";
export const APP_VERSION_CODE = 1;
export const APP_PACKAGE_NAME = "ai.vanvas.app";

export interface VersionInfo {
  latest_version: string;
  min_supported_version: string;
  force_update: boolean;
  release_notes: string;
  store_url_android: string;
  update_available: boolean;
}

export async function checkAppUpdate(): Promise<VersionInfo | null> {
  try {
    const res = await api.getAppVersion();
    const updateAvailable = res.latest_version !== APP_VERSION;
    return {
      latest_version: res.latest_version,
      min_supported_version: res.min_supported_version,
      force_update: res.force_update,
      release_notes: res.release_notes,
      store_url_android: res.store_url_android,
      update_available: updateAvailable,
    };
  } catch {
    return null;
  }
}
