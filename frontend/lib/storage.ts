"use client";

import { isCapacitorNative } from "./capacitor";

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

// In-memory fallback for SSR or restricted storage environments
const memoryStorage = new Map<string, string>();

class PlatformStorageAdapter implements StorageAdapter {
  private isAvailable(): boolean {
    if (typeof window === "undefined") return false;
    try {
      const testKey = "__vanvas_storage_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  getItem(key: string): string | null {
    if (this.isAvailable()) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return memoryStorage.get(key) ?? null;
      }
    }
    return memoryStorage.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.isAvailable()) {
      try {
        window.localStorage.setItem(key, value);
      } catch (err) {
        console.warn("[VANVAS Storage] localStorage write failed, using memory fallback", err);
      }
    }
    memoryStorage.set(key, value);
  }

  removeItem(key: string): void {
    if (this.isAvailable()) {
      try {
        window.localStorage.removeItem(key);
      } catch {}
    }
    memoryStorage.delete(key);
  }

  clear(): void {
    if (this.isAvailable()) {
      try {
        window.localStorage.clear();
      } catch {}
    }
    memoryStorage.clear();
  }
}

export const storageAdapter: StorageAdapter = new PlatformStorageAdapter();
