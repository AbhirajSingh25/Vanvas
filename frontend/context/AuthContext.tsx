"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, UserPreferences, PasswordChangePayload, UserDataExport, RegistrationResult } from "@/types";
import { api } from "@/lib/api";
import { storageAdapter } from "@/lib/storage";
import { trackEvent } from "@/lib/analytics";
import { deactivatePushToken } from "@/lib/pushNotifications";

interface ProfileUpdatePayload {
  full_name?: string;
  avatar_url?: string;
  preferred_travel_style?: string;
  wake_up_preference?: string;
  activity_intensity?: string;
  dietary_preference?: string;
  interests?: string;
  accommodation_preference?: string;
  transport_preference?: string;
  companion_style?: string;
  language?: string;
  region?: string;
  currency?: string;
  theme?: string;
  layout_density?: "original" | "compact";
  location_mode?: string;
  notify_trip_reminders?: boolean;
  notify_trip_changes?: boolean;
  notify_booking_updates?: boolean;
  notify_suggestions?: boolean;
  notify_copilot_updates?: boolean;
  notify_announcements?: boolean;
  ai_copilot_enabled?: boolean;
  ai_personalized_recommendations?: boolean;
  ai_use_travel_preferences?: boolean;
  ai_use_trip_context?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  emailVerified: boolean;
  login: (email: string, pass: string) => Promise<User>;
  register: (email: string, pass: string, name: string) => Promise<RegistrationResult>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
  setUser: (user: User | null) => void;
  updateProfile: (data: ProfileUpdatePayload) => Promise<User>;
  uploadAvatar: (file: File) => Promise<{ avatar_url: string; message: string }>;
  selectAvatarPreset: (preset: string) => Promise<{ avatar_url: string; avatar_preset: string; message: string }>;
  deleteAvatar: () => Promise<{ message: string }>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<UserPreferences>;
  changePassword: (payload: PasswordChangePayload) => Promise<{ message: string }>;
  deleteAccount: (password?: string, confirmation?: string) => Promise<{ message: string }>;
  exportData: () => Promise<UserDataExport>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    const savedToken = storageAdapter.getItem("vanvas_token");
    if (!savedToken) {
      setUser(null);
      setToken(null);
      return null;
    }
    try {
      const u = await api.getMe();
      setUser(u);
      setToken(savedToken);
      storageAdapter.setItem("vanvas_user_profile", JSON.stringify(u));
      return u;
    } catch (err: any) {
      // If offline or network connection error, retain existing session and profile
      const isNetworkError =
        (typeof navigator !== "undefined" && !navigator.onLine) ||
        err?.message?.includes("Failed to fetch") ||
        err?.message?.includes("Unable to connect");

      if (isNetworkError) {
        const cachedProfile = storageAdapter.getItem("vanvas_user_profile");
        if (cachedProfile) {
          try {
            const parsed = JSON.parse(cachedProfile);
            setUser(parsed);
            setToken(savedToken);
            return parsed;
          } catch {}
        }
        return user;
      }

      // Explicit authentication failure (e.g. 401 / expired token)
      storageAdapter.removeItem("vanvas_token");
      storageAdapter.removeItem("vanvas_user_profile");
      setUser(null);
      setToken(null);
      return null;
    }
  }, [user]);

  useEffect(() => {
    const savedToken = storageAdapter.getItem("vanvas_token");
    const cachedProfile = storageAdapter.getItem("vanvas_user_profile");

    if (savedToken) {
      setToken(savedToken);
      if (cachedProfile) {
        try {
          setUser(JSON.parse(cachedProfile));
        } catch {}
      }

      api.getMe()
        .then((u) => {
          setUser(u);
          storageAdapter.setItem("vanvas_user_profile", JSON.stringify(u));
        })
        .catch((err: any) => {
          const isNetworkError =
            (typeof navigator !== "undefined" && !navigator.onLine) ||
            err?.message?.includes("Failed to fetch") ||
            err?.message?.includes("Unable to connect");

          if (!isNetworkError) {
            storageAdapter.removeItem("vanvas_token");
            storageAdapter.removeItem("vanvas_user_profile");
            setToken(null);
            setUser(null);
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      setUser(null);
      setToken(null);
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.login(email.trim().toLowerCase(), pass);
      storageAdapter.setItem("vanvas_token", res.access_token);
      storageAdapter.setItem("vanvas_user_profile", JSON.stringify(res.user));
      setToken(res.access_token);
      setUser(res.user);

      trackEvent("login_success");

      // Check if a device push token was registered previously
      const pushToken = storageAdapter.getItem("vanvas_push_token");
      if (pushToken) {
        api.registerDeviceToken({
          push_token: pushToken,
          platform: "android",
          app_version: "0.1.0",
          permission_state: "granted",
        }).catch(() => {});
      }

      return res.user;
    } catch (err: any) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, pass: string, name: string): Promise<RegistrationResult> => {
    setIsLoading(true);
    try {
      const res = await api.register(email.trim().toLowerCase(), pass, name.trim());
      return res;
    } catch (err: any) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    deactivatePushToken().catch(() => {});
    storageAdapter.removeItem("vanvas_token");
    storageAdapter.removeItem("vanvas_user_profile");

    // Attempt graceful backend session cleanup
    api.logoutSession().catch(() => {});
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data: ProfileUpdatePayload): Promise<User> => {
    const updated = await api.updateProfile(data);
    setUser(updated);
    return updated;
  };

  const uploadAvatar = async (file: File): Promise<{ avatar_url: string; message: string }> => {
    const res = await api.uploadProfileAvatar(file);
    if (user) {
      setUser({
        ...user,
        avatar_url: res.avatar_url,
        avatar_type: "uploaded",
        avatar_preset: undefined,
      });
    }
    return res;
  };

  const selectAvatarPreset = async (preset: string): Promise<{ avatar_url: string; avatar_preset: string; message: string }> => {
    const res = await api.selectAvatarPreset(preset);
    if (user) {
      setUser({
        ...user,
        avatar_url: res.avatar_url,
        avatar_type: "preset",
        avatar_preset: res.avatar_preset,
      });
    }
    return res;
  };

  const deleteAvatar = async (): Promise<{ message: string }> => {
    const res = await api.deleteProfileAvatar();
    if (user) {
      setUser({
        ...user,
        avatar_url: undefined,
        avatar_type: "preset",
        avatar_preset: "himalayan-explorer",
      });
    }
    return res;
  };

  const updatePreferences = async (preferences: Partial<UserPreferences>): Promise<UserPreferences> => {
    const updatedPrefs = await api.updatePreferences(preferences);
    if (user) {
      setUser({
        ...user,
        preferences: updatedPrefs,
      });
    }
    return updatedPrefs;
  };

  const changePassword = async (payload: PasswordChangePayload): Promise<{ message: string }> => {
    return api.changePassword(payload);
  };

  const deleteAccount = async (password?: string, confirmation?: string): Promise<{ message: string }> => {
    const res = await api.deleteAccount({ password, confirmation });
    logout();
    return res;
  };

  const exportData = async (): Promise<UserDataExport> => {
    return api.exportUserData();
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      isAuthenticated: !!user,
      emailVerified: !!user?.email_verified_at,
      login,
      register,
      logout,
      refreshUser,
      setUser,
      updateProfile,
      uploadAvatar,
      selectAvatarPreset,
      deleteAvatar,
      updatePreferences,
      changePassword,
      deleteAccount,
      exportData,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
