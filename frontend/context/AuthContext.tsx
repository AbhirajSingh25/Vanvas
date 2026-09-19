"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, UserPreferences, PasswordChangePayload, UserDataExport } from "@/types";
import { api } from "@/lib/api";

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
  login: (email: string, pass: string) => Promise<User>;
  register: (email: string, pass: string, name: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
  setUser: (user: User | null) => void;
  updateProfile: (data: ProfileUpdatePayload) => Promise<User>;
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
    const savedToken = typeof window !== "undefined" ? localStorage.getItem("vanvas_token") : null;
    if (!savedToken) {
      setUser(null);
      setToken(null);
      return null;
    }
    try {
      const u = await api.getMe();
      setUser(u);
      setToken(savedToken);
      return u;
    } catch {
      if (typeof window !== "undefined") {
        localStorage.removeItem("vanvas_token");
      }
      setUser(null);
      setToken(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem("vanvas_token");
    if (savedToken) {
      setToken(savedToken);
      api.getMe()
        .then((u) => {
          setUser(u);
        })
        .catch(() => {
          localStorage.removeItem("vanvas_token");
          setToken(null);
          setUser(null);
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
      localStorage.setItem("vanvas_token", res.access_token);
      setToken(res.access_token);
      setUser(res.user);
      return res.user;
    } catch (err: any) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, pass: string, name: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.register(email.trim().toLowerCase(), pass, name.trim());
      localStorage.setItem("vanvas_token", res.access_token);
      setToken(res.access_token);
      setUser(res.user);
      return res.user;
    } catch (err: any) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("vanvas_token");
      localStorage.removeItem("vanvas_user_profile");
    }
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
      login,
      register,
      logout,
      refreshUser,
      setUser,
      updateProfile,
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
