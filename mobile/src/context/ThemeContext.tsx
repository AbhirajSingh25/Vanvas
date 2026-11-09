import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import { theme, getSemanticColors, ThemeColors } from "../theme";
import { secureStorage } from "../services/storage";

export type ThemeMode = "system" | "light" | "dark";
export type LayoutDensity = "standard" | "compact";

interface ThemeContextValue {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  isDark: boolean;
  density: LayoutDensity;
  setDensity: (density: LayoutDensity) => Promise<void>;
  toggleDensity: () => Promise<void>;
  colors: ThemeColors;
  spacing: typeof theme.spacing;
  radius: typeof theme.radius;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [density, setDensityState] = useState<LayoutDensity>("standard");

  useEffect(() => {
    async function restorePreferences() {
      try {
        const savedMode = await secureStorage.getThemeMode();
        if (savedMode) setThemeModeState(savedMode);

        const savedDensity = await secureStorage.getLayoutDensity();
        if (savedDensity) setDensityState(savedDensity);
      } catch {
        // ignore
      }
    }
    restorePreferences();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await secureStorage.setThemeMode(mode);
  };

  const setDensity = async (d: LayoutDensity) => {
    setDensityState(d);
    await secureStorage.setLayoutDensity(d);
  };

  const toggleDensity = async () => {
    const next = density === "standard" ? "compact" : "standard";
    await setDensity(next);
  };

  const isDark = themeMode === "system" ? systemScheme === "dark" : themeMode === "dark";
  const colors = getSemanticColors(isDark);

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        isDark,
        density,
        setDensity,
        toggleDensity,
        colors,
        spacing: theme.spacing,
        radius: theme.radius,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
