"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { api } from "@/lib/api";

export type DensityMode = "original" | "compact";

interface DensityContextType {
  density: DensityMode;
  isCompact: boolean;
  mounted: boolean;
  setDensity: (density: DensityMode) => void;
}

const DensityContext = createContext<DensityContextType | undefined>(undefined);

const DENSITY_STORAGE_KEY = "vanvas_density";

function applyDensityToDOM(mode: DensityMode) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-density", mode);
  if (mode === "compact") {
    root.classList.add("density-compact");
    root.classList.remove("density-original");
  } else {
    root.classList.add("density-original");
    root.classList.remove("density-compact");
  }
}

export function DensityProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [density, setDensityState] = useState<DensityMode>("original");
  const [mounted, setMounted] = useState(false);

  // Initialize density on client mount
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(DENSITY_STORAGE_KEY) as DensityMode | null;
    let initial: DensityMode = "original";
    if (stored === "original" || stored === "compact") {
      initial = stored;
    } else if (user?.preferences?.layout_density === "compact" || user?.preferences?.layout_density === "original") {
      initial = user.preferences.layout_density as DensityMode;
    }

    setDensityState(initial);
    applyDensityToDOM(initial);
  }, []);

  // Sync with authenticated user preferences when user logs in or profile changes
  useEffect(() => {
    if (user?.preferences?.layout_density) {
      const userPref = user.preferences.layout_density as DensityMode;
      const stored = localStorage.getItem(DENSITY_STORAGE_KEY) as DensityMode | null;
      if ((userPref === "original" || userPref === "compact") && !stored) {
        setDensityState(userPref);
        applyDensityToDOM(userPref);
        localStorage.setItem(DENSITY_STORAGE_KEY, userPref);
      }
    }
  }, [user?.preferences?.layout_density]);

  // Handle switching layout density
  const setDensity = useCallback((newDensity: DensityMode) => {
    const validMode: DensityMode = newDensity === "compact" ? "compact" : "original";
    setDensityState(validMode);
    if (typeof window !== "undefined") {
      localStorage.setItem(DENSITY_STORAGE_KEY, validMode);
    }
    applyDensityToDOM(validMode);

    // If authenticated, persist to backend in background
    const token = typeof window !== "undefined" ? localStorage.getItem("vanvas_token") : null;
    if (token) {
      api.updatePreferences({ layout_density: validMode }).catch((err) => {
        console.warn("Background density sync failed:", err);
      });
    }
  }, []);

  return (
    <DensityContext.Provider
      value={{
        density,
        isCompact: density === "compact",
        mounted,
        setDensity,
      }}
    >
      {children}
    </DensityContext.Provider>
  );
}

export function useDensity() {
  const context = useContext(DensityContext);
  if (!context) {
    throw new Error("useDensity must be used within a DensityProvider");
  }
  return context;
}
