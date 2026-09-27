"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  mounted: boolean;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "vanvas_theme";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyThemeToDOM(resolved: ResolvedTheme) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
    root.classList.remove("light");
    root.setAttribute("data-theme", "dark");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    root.classList.add("light");
    root.setAttribute("data-theme", "light");
    root.style.colorScheme = "light";
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [mounted, setMounted] = useState(false);

  // Initialize theme on client mount
  useEffect(() => {
    setMounted(true);
    const stored = (localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null);
    let initialTheme: ThemeMode = "light";
    if (stored === "light" || stored === "dark" || stored === "system") {
      initialTheme = stored;
    } else if (user?.preferences?.theme === "light" || user?.preferences?.theme === "dark" || user?.preferences?.theme === "system") {
      initialTheme = user.preferences.theme as ThemeMode;
    } else {
      initialTheme = "light";
    }

    setThemeState(initialTheme);
    const resolved: ResolvedTheme = initialTheme === "system" ? getSystemTheme() : (initialTheme === "dark" ? "dark" : "light");
    setResolvedTheme(resolved);
    applyThemeToDOM(resolved);
  }, []);

  // Sync with authenticated user preferences when user object updates (e.g. fresh login)
  useEffect(() => {
    if (user?.preferences?.theme) {
      const userTheme = user.preferences.theme as ThemeMode;
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      // If user has an explicit saved preference on account and no local session choice was stored, sync it
      if ((userTheme === "light" || userTheme === "dark" || userTheme === "system") && !stored) {
        setThemeState(userTheme);
        const resolved: ResolvedTheme = userTheme === "system" ? getSystemTheme() : (userTheme === "dark" ? "dark" : "light");
        setResolvedTheme(resolved);
        applyThemeToDOM(resolved);
        localStorage.setItem(THEME_STORAGE_KEY, userTheme);
      }
    }
  }, [user?.preferences?.theme]);

  // Handle setting a new theme mode
  const setTheme = useCallback((newTheme: ThemeMode) => {
    const validTheme: ThemeMode = (newTheme === "light" || newTheme === "dark" || newTheme === "system") ? newTheme : "light";
    setThemeState(validTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem(THEME_STORAGE_KEY, validTheme);
    }
    const resolved: ResolvedTheme = validTheme === "system" ? getSystemTheme() : (validTheme === "dark" ? "dark" : "light");
    setResolvedTheme(resolved);
    applyThemeToDOM(resolved);
  }, []);

  // Listen to OS prefers-color-scheme changes ONLY when in explicit system mode
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        const resolved: ResolvedTheme = e.matches ? "dark" : "light";
        setResolvedTheme(resolved);
        applyThemeToDOM(resolved);
      }
    };

    mediaQuery.addEventListener("change", handleMediaChange);
    return () => mediaQuery.removeEventListener("change", handleMediaChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, mounted, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
