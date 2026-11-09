import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "vanvas_auth_token";
const USER_KEY = "vanvas_auth_user";
const THEME_MODE_KEY = "vanvas_theme_mode";
const DENSITY_KEY = "vanvas_layout_density";

// In-memory fallback for web or when SecureStore is unavailable
const memoryFallback: Record<string, string> = {};

export const secureStorage = {
  async setToken(token: string): Promise<void> {
    if (Platform.OS === "web") {
      memoryFallback[TOKEN_KEY] = token;
      return;
    }
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token, {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
      });
    } catch {
      memoryFallback[TOKEN_KEY] = token;
    }
  },

  async getToken(): Promise<string | null> {
    if (Platform.OS === "web") {
      return memoryFallback[TOKEN_KEY] || null;
    }
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      return token || memoryFallback[TOKEN_KEY] || null;
    } catch {
      return memoryFallback[TOKEN_KEY] || null;
    }
  },

  async removeToken(): Promise<void> {
    delete memoryFallback[TOKEN_KEY];
    if (Platform.OS !== "web") {
      try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      } catch {
        // ignore
      }
    }
  },

  async setUserData(userData: any): Promise<void> {
    const val = JSON.stringify(userData);
    if (Platform.OS === "web") {
      memoryFallback[USER_KEY] = val;
      return;
    }
    try {
      await SecureStore.setItemAsync(USER_KEY, val, {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
      });
    } catch {
      memoryFallback[USER_KEY] = val;
    }
  },

  async getUserData<T>(): Promise<T | null> {
    let raw: string | null = null;
    if (Platform.OS === "web") {
      raw = memoryFallback[USER_KEY] || null;
    } else {
      try {
        raw = await SecureStore.getItemAsync(USER_KEY);
      } catch {
        raw = memoryFallback[USER_KEY] || null;
      }
    }
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async clearSession(): Promise<void> {
    await this.removeToken();
    delete memoryFallback[USER_KEY];
    if (Platform.OS !== "web") {
      try {
        await SecureStore.deleteItemAsync(USER_KEY);
      } catch {
        // ignore
      }
    }
  },

  async setThemeMode(mode: "system" | "light" | "dark"): Promise<void> {
    if (Platform.OS === "web") {
      memoryFallback[THEME_MODE_KEY] = mode;
      return;
    }
    try {
      await SecureStore.setItemAsync(THEME_MODE_KEY, mode);
    } catch {
      memoryFallback[THEME_MODE_KEY] = mode;
    }
  },

  async getThemeMode(): Promise<"system" | "light" | "dark" | null> {
    if (Platform.OS === "web") {
      return (memoryFallback[THEME_MODE_KEY] as any) || null;
    }
    try {
      const mode = await SecureStore.getItemAsync(THEME_MODE_KEY);
      return (mode as any) || null;
    } catch {
      return (memoryFallback[THEME_MODE_KEY] as any) || null;
    }
  },

  async setLayoutDensity(density: "standard" | "compact"): Promise<void> {
    if (Platform.OS === "web") {
      memoryFallback[DENSITY_KEY] = density;
      return;
    }
    try {
      await SecureStore.setItemAsync(DENSITY_KEY, density);
    } catch {
      memoryFallback[DENSITY_KEY] = density;
    }
  },

  async getLayoutDensity(): Promise<"standard" | "compact" | null> {
    if (Platform.OS === "web") {
      return (memoryFallback[DENSITY_KEY] as any) || null;
    }
    try {
      const d = await SecureStore.getItemAsync(DENSITY_KEY);
      return (d as any) || null;
    } catch {
      return (memoryFallback[DENSITY_KEY] as any) || null;
    }
  },
};
