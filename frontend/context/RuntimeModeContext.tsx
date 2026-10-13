"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { detectRuntimeEnvironment, RuntimeEnvironment, RuntimeMode } from "@/lib/runtimeMode";

interface RuntimeModeContextType extends RuntimeEnvironment {
  forceMode: (mode: RuntimeMode | null) => void;
}

const defaultContext: RuntimeModeContextType = {
  isStandaloneApp: false,
  isMobileBrowser: false,
  isDesktopWebsite: true,
  isIOS: false,
  isAndroid: false,
  hasTouch: false,
  runtimeMode: "desktop_web",
  forceMode: () => {},
};

const RuntimeModeContext = createContext<RuntimeModeContextType>(defaultContext);

export const RuntimeModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [env, setEnv] = useState<RuntimeEnvironment>(() => {
    if (typeof window !== "undefined") {
      return detectRuntimeEnvironment();
    }
    return defaultContext;
  });

  useEffect(() => {
    const updateEnv = () => {
      const current = detectRuntimeEnvironment();
      setEnv(current);

      // Set data attributes on documentElement for styling hooks
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-runtime-mode", current.runtimeMode);
        if (current.isStandaloneApp) {
          document.documentElement.classList.add("mode-standalone");
          document.documentElement.classList.remove("mode-browser");
        } else {
          document.documentElement.classList.add("mode-browser");
          document.documentElement.classList.remove("mode-standalone");
        }
      }
    };

    updateEnv();

    // Listen to display-mode changes
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handler = () => updateEnv();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handler);
    } else {
      mediaQuery.addListener(handler);
    }

    window.addEventListener("resize", updateEnv);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handler);
      } else {
        mediaQuery.removeListener(handler);
      }
      window.removeEventListener("resize", updateEnv);
    };
  }, []);

  const forceMode = (mode: RuntimeMode | null) => {
    if (typeof window !== "undefined") {
      if (mode) {
        localStorage.setItem("vanvas_force_runtime_mode", mode);
      } else {
        localStorage.removeItem("vanvas_force_runtime_mode");
      }
      setEnv(detectRuntimeEnvironment());
    }
  };

  return (
    <RuntimeModeContext.Provider value={{ ...env, forceMode }}>
      {children}
    </RuntimeModeContext.Provider>
  );
};

export const useRuntimeMode = () => useContext(RuntimeModeContext);
