import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User } from "@vanvas/shared";
import { secureStorage } from "../services/storage";
import { nativeApi } from "../services/api";
import { offlineDb } from "../services/db";

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
    // 1. Capture user ID before clearing state
    const userIdToPurge = user?.id;

    // 2. Perform authenticated backend deletion request
    // If backend rejects (e.g. incorrect password, validation error, server error),
    // this call throws, and local auth state / storage remains untouched.
    const res = await nativeApi.deleteAccount(password);

    // 3. Backend confirmed deletion. The account is erased on the server.
    // Ensure SecureStore session and React authentication state are torn down.
    try {
      await secureStorage.clearSession();
    } finally {
      setToken(null);
      setUser(null);
    }

    // 4. Purge user-owned private SQLite data
    if (userIdToPurge) {
      try {
        await offlineDb.purgeUserAccountData(userIdToPurge);
      } catch (localErr) {
        // Record non-sensitive local cleanup error.
        // Server deletion has already succeeded and user is logged out,
        // so we must never falsely present this as a server failure.
        console.warn("[AuthContext] Local account cache cleanup error:", localErr);
      }
    }
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
