"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserPreferences } from "@/types";
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
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  updateProfile: (data: ProfileUpdatePayload) => Promise<User>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<UserPreferences>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_DEMO_USER: User = {
  id: "demo-traveller",
  email: "traveller@vanvas.com",
  full_name: "Aarav Sharma",
  role: "traveller",
  avatar_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150",
  created_at: new Date().toISOString(),
  preferences: {
    preferred_travel_style: "Balanced",
    wake_up_preference: "Normal",
    activity_intensity: "Balanced",
    dietary_preference: "All",
    interests: "Nature,Cafés,Adventure,Food,Hidden places",
    accommodation_preference: "Riverside & Forest Stays",
    transport_preference: "Volvo Bus",
    companion_style: "Solo",
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to load any local override
  const getInitialDemoUser = (): User => {
    if (typeof window !== "undefined") {
      try {
        const savedOverride = localStorage.getItem("vanvas_user_profile");
        if (savedOverride) {
          return JSON.parse(savedOverride);
        }
      } catch {
        // ignore JSON parse error
      }
    }
    return DEFAULT_DEMO_USER;
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("vanvas_token");
    if (savedToken) {
      setToken(savedToken);
      api.getMe()
        .then((u) => setUser(u))
        .catch(() => {
          setUser(getInitialDemoUser());
        })
        .finally(() => setIsLoading(false));
    } else {
      setUser(getInitialDemoUser());
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, pass);
      localStorage.setItem("vanvas_token", res.access_token);
      setToken(res.access_token);
      setUser(res.user);
    } catch {
      // Fallback for local demo preview
      const fallback = getInitialDemoUser();
      fallback.email = email;
      fallback.role = email.includes("admin") ? "admin" : "traveller";
      setUser(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, pass: string, name: string) => {
    setIsLoading(true);
    try {
      const res = await api.register(email, pass, name);
      localStorage.setItem("vanvas_token", res.access_token);
      setToken(res.access_token);
      setUser(res.user);
    } catch {
      const fallback = getInitialDemoUser();
      fallback.email = email;
      fallback.full_name = name;
      setUser(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("vanvas_token");
    localStorage.removeItem("vanvas_user_profile");
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data: ProfileUpdatePayload): Promise<User> => {
    const savedToken = typeof window !== "undefined" ? localStorage.getItem("vanvas_token") : null;
    if (savedToken) {
      try {
        const updated = await api.updateProfile(data);
        setUser(updated);
        localStorage.setItem("vanvas_user_profile", JSON.stringify(updated));
        return updated;
      } catch (err) {
        console.warn("Backend update failed, falling back to local persistence:", err);
      }
    }

    // Local fallback update
    const current = user || getInitialDemoUser();
    const currentPrefs = current.preferences || {};
    const updatedUser: User = {
      ...current,
      full_name: data.full_name ?? current.full_name,
      avatar_url: data.avatar_url ?? current.avatar_url,
      preferences: {
        ...currentPrefs,
        preferred_travel_style: data.preferred_travel_style ?? currentPrefs.preferred_travel_style ?? "Balanced",
        wake_up_preference: data.wake_up_preference ?? currentPrefs.wake_up_preference ?? "Normal",
        activity_intensity: data.activity_intensity ?? currentPrefs.activity_intensity ?? "Balanced",
        dietary_preference: data.dietary_preference ?? currentPrefs.dietary_preference ?? "All",
        interests: data.interests ?? currentPrefs.interests ?? "Nature,Cafés,Adventure,Food",
        accommodation_preference: data.accommodation_preference ?? currentPrefs.accommodation_preference ?? "Riverside & Forest Stays",
        transport_preference: data.transport_preference ?? currentPrefs.transport_preference ?? "Volvo Bus",
        companion_style: data.companion_style ?? currentPrefs.companion_style ?? "Solo",
      },
    };
    setUser(updatedUser);
    localStorage.setItem("vanvas_user_profile", JSON.stringify(updatedUser));
    return updatedUser;
  };

  const updatePreferences = async (preferences: Partial<UserPreferences>): Promise<UserPreferences> => {
    const res = await updateProfile(preferences);
    return res.preferences || {};
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      login,
      register,
      logout,
      setUser,
      updateProfile,
      updatePreferences
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
