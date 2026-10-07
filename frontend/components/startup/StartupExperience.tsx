"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

let hasShownStartupGlobal = false;

export function StartupExperience() {
  const [shouldRender, setShouldRender] = useState(false);
  const [phase, setPhase] = useState(1);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // 1. Cold Start Check: Run exactly once per app session / hard launch
    if (hasShownStartupGlobal) {
      return;
    }
    try {
      const alreadyShown = sessionStorage.getItem("vanvas_startup_shown");
      if (alreadyShown === "1") {
        hasShownStartupGlobal = true;
        return;
      }
    } catch {
      // In private browsing or restricted environments, proceed with in-memory lock
    }

    hasShownStartupGlobal = true;
    setShouldRender(true);

    // 2. Seamless Native Splash Handoff: Hide Capacitor native splash once web startup mounts
    if (typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform?.()) {
      import("@capacitor/splash-screen")
        .then(({ SplashScreen }) => {
          SplashScreen.hide({ fadeOutDuration: 120 }).catch(() => {});
        })
        .catch(() => {});
    }

    // 3. Accessibility: Respect prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setPhase(6);
      const timer = setTimeout(() => {
        setIsFadingOut(true);
        setTimeout(() => {
          setShouldRender(false);
          try {
            sessionStorage.setItem("vanvas_startup_shown", "1");
          } catch {}
        }, 150);
      }, 350);
      return () => clearTimeout(timer);
    }

    // 4. Exact 7-Phase Cinematic Sequence (~2.1s total, hard bound < 2.5s)
    const timers: NodeJS.Timeout[] = [];

    // Phase 2: Emblem Reveal (200ms -> 650ms)
    timers.push(
      setTimeout(() => {
        setPhase(2);
      }, 200)
    );

    // Phase 3: Light Pass Highlight Sweep (650ms -> 850ms)
    timers.push(
      setTimeout(() => {
        setPhase(3);
      }, 650)
    );

    // Phase 4: Wordmark Reveal (850ms -> 1150ms)
    timers.push(
      setTimeout(() => {
        setPhase(4);
      }, 850)
    );

    // Phase 5: Expedition Line Draw (1150ms -> 1450ms)
    timers.push(
      setTimeout(() => {
        setPhase(5);
      }, 1150)
    );

    // Phase 6: Micro Status (1450ms -> 1750ms)
    timers.push(
      setTimeout(() => {
        setPhase(6);
      }, 1450)
    );

    // Phase 7: App Transition Cross-Dissolve (1750ms -> 2100ms)
    timers.push(
      setTimeout(() => {
        setIsFadingOut(true);
      }, 1750)
    );

    // Final Cleanup & Unmount (~2100ms)
    timers.push(
      setTimeout(() => {
        setShouldRender(false);
        try {
          sessionStorage.setItem("vanvas_startup_shown", "1");
        } catch {}
      }, 2100)
    );

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  if (!shouldRender) {
    return null;
  }

  return (
    <aside
      aria-label="VANVAS Startup Experience"
      aria-hidden={isFadingOut ? "true" : "false"}
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#102C26] text-[#FAF4E8] select-none touch-none overflow-hidden transition-opacity duration-350 ease-out ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* Restrained brass ambient glow associated with the emblem */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          background:
            "radial-gradient(circle at 50% 45%, rgba(180, 146, 82, 0.22) 0%, rgba(16, 44, 38, 0) 65%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center max-w-sm w-full">
        {/* Phase 1: Antique Brass Initial Ember Point (0ms -> 200ms) */}
        <div
          className={`absolute transition-all duration-300 ease-out pointer-events-none ${
            phase === 1
              ? "opacity-100 scale-100 drop-shadow-[0_0_8px_rgba(180,146,82,0.9)]"
              : "opacity-0 scale-125"
          }`}
          style={{
            top: "calc(50% - 48px)",
          }}
        >
          <div className="w-2 h-2 rounded-full bg-[#B49252] shadow-[0_0_10px_#B49252]" />
        </div>

        {/* Phase 2 & 3: Approved Master Emblem Reveal + Single Subtle Light Sweep */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 mb-5 flex items-center justify-center">
          <div
            className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-2xl"
            style={{
              opacity: phase >= 2 ? 1 : 0,
              transform: phase >= 2 ? "scale(1)" : "scale(0.94)",
              filter: phase >= 2 ? "blur(0px)" : "blur(4px)",
              transition:
                "opacity 450ms cubic-bezier(0.16, 1, 0.3, 1), transform 450ms cubic-bezier(0.16, 1, 0.3, 1), filter 450ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <Image
              src="/brand/vanvas-emblem-master.png"
              alt="VANVAS Emblem"
              width={112}
              height={112}
              priority
              className="w-full h-full object-contain select-none pointer-events-none"
            />

            {/* Phase 3: Single Subtle Antique-Brass Highlight Sweep */}
            {phase >= 3 && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(115deg, transparent 35%, rgba(180, 146, 82, 0.28) 48%, rgba(250, 244, 232, 0.55) 52%, rgba(180, 146, 82, 0.28) 56%, transparent 68%)",
                  animation: "vanvasSingleSheen 200ms ease-out forwards",
                  mixBlendMode: "screen",
                }}
              />
            )}
          </div>
        </div>

        {/* Phase 4: Wordmark & Signature Reveal (850ms -> 1150ms) */}
        <div
          className="flex flex-col items-center"
          style={{
            opacity: phase >= 4 ? 1 : 0,
            transform: phase >= 4 ? "translateY(0px)" : "translateY(8px)",
            transition:
              "opacity 300ms cubic-bezier(0.16, 1, 0.3, 1), transform 300ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <h1 className="font-serif font-black tracking-[0.24em] text-2xl sm:text-3xl text-[#FAF4E8] leading-none mb-2">
            VANVAS
          </h1>

          <div className="flex items-center gap-2 text-[#B49252]">
            <span className="h-[1px] w-3.5 bg-[#B49252]/60" />
            <span className="font-serif italic text-[10px] sm:text-[11px] tracking-[0.22em] uppercase font-semibold text-[#B49252]/90">
              BY THE SORTED CLUB
            </span>
            <span className="h-[1px] w-3.5 bg-[#B49252]/60" />
          </div>
        </div>

        {/* Phase 5: Expedition Route Line Progress (1150ms -> 1450ms) */}
        <div className="relative w-32 sm:w-36 h-[1.5px] bg-[#FAF4E8]/15 rounded-full overflow-hidden mt-6 mb-3">
          <div
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#B49252] via-[#FAF4E8] to-[#B49252] rounded-full"
            style={{
              width: phase >= 5 ? "100%" : "0%",
              transition: "width 300ms cubic-bezier(0.25, 1, 0.5, 1)",
            }}
          />
        </div>

        {/* Phase 6: Restrained Micro Status (1450ms -> 1750ms) */}
        <div
          style={{
            opacity: phase >= 6 ? 0.85 : 0,
            transform: phase >= 6 ? "translateY(0px)" : "translateY(4px)",
            transition: "opacity 300ms ease-out, transform 300ms ease-out",
          }}
        >
          <span className="text-[11px] sm:text-xs tracking-wider text-[#FAF4E8]/85 font-sans font-medium">
            Charting your journey...
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes vanvasSingleSheen {
          0% {
            transform: translateX(-120%) skewX(-15deg);
            opacity: 0;
          }
          30% {
            opacity: 0.75;
          }
          70% {
            opacity: 0.75;
          }
          100% {
            transform: translateX(120%) skewX(-15deg);
            opacity: 0;
          }
        }
      `}</style>
    </aside>
  );
}
