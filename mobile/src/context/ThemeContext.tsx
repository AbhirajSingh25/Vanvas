import React, { createContext, useContext, useState } from "react";
import { useColorScheme } from "react-native";
import { theme } from "../theme";

interface ThemeContextValue {
  isDark: boolean;
  density: "standard" | "compact";
  toggleDensity: () => void;
  colors: typeof theme.colors;
  spacing: typeof theme.spacing;
  radius: typeof theme.radius;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [isDark] = useState<boolean>(systemScheme === "dark");
  const [density, setDensity] = useState<"standard" | "compact">("standard");

  const toggleDensity = () => {
    setDensity((prev) => (prev === "standard" ? "compact" : "standard"));
  };

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        density,
        toggleDensity,
        colors: theme.colors,
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
