import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, UserPreferences } from "@vanvas/shared";
import { secureStorage } from "../services/storage";
import { nativeApi } from "../services/api";
import { offlineDb } from "../services/db";
import { executeAccountDeletionTeardown } from "../services/authTeardown";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<{ message: string; email: string }>;
  verifyEmail: (email: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  uploadAvatar: (fileUri: string) => Promise<string>;
  deleteAvatar: () => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<UserPreferences>;
  regenerateVanvasId: () => Promise<string>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session on app launch
  useEffect(() => {
    async function restoreSession() {
      try {
        const storedToken = await secureStorage.getToken();
        const storedUser = await secureStorage.getUserData<User>();

        if (storedToken) {
          setToken(storedToken);
          if (storedUser) setUser(storedUser);

          // Refresh user profile in background
          try {
            const freshUser = await nativeApi.getMe();
            setUser(freshUser);
          } catch {
            // Keep stored cached user if server is sleeping
          }
        }
      } catch {
        // Safe session fallback
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await nativeApi.login(email, password);
    setToken(res.access_token);
    setUser(res.user);
  }, []);

  const register = useCallback(async (email: string, password: string, fullName: string) => {
    return await nativeApi.register(email, password, fullName);
  }, []);

  const verifyEmail = useCallback(async (email: string, otp: string) => {
    const res = await nativeApi.verifyEmail(email, otp);
    if (res.access_token && res.user) {
      setToken(res.access_token);
      setUser(res.user);
    }
  }, []);

  const logout = useCallback(async () => {
    await nativeApi.logout();
    setToken(null);
    setUser(null);
  }, []);

  const deleteAccount = useCallback(async (password: string) => {
    const userIdToPurge = user?.id;
    await executeAccountDeletionTeardown(userIdToPurge, password, { setToken, setUser });
  }, [user]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    await nativeApi.changePassword(currentPassword, newPassword, confirmPassword);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const fresh = await nativeApi.getMe();
      setUser(fresh);
    } catch {
      // ignore
    }
  }, []);

  const uploadAvatar = useCallback(async (fileUri: string) => {
    const res = await nativeApi.uploadAvatar(fileUri);
    await refreshProfile();
    return res.avatar_url;
  }, [refreshProfile]);

  const deleteAvatar = useCallback(async () => {
    await nativeApi.deleteAvatar();
    await refreshProfile();
  }, [refreshProfile]);

  const updatePreferences = useCallback(async (preferences: Partial<UserPreferences>) => {
    const updatedPrefs = await nativeApi.updatePreferences(preferences);
    setUser((prev) =>
      prev
        ? {
            ...prev,
            preferences: { ...(prev.preferences || {}), ...updatedPrefs },
          }
        : prev
    );
    return updatedPrefs;
  }, []);

  const regenerateVanvasId = useCallback(async () => {
    const res = await nativeApi.regenerateMyVanvasId();
    await refreshProfile();
    return res.vanvas_id;
  }, [refreshProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        verifyEmail,
        logout,
        deleteAccount,
        changePassword,
        refreshProfile,
        uploadAvatar,
        deleteAvatar,
        updatePreferences,
        regenerateVanvasId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
