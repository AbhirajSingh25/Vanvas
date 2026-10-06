"use client";

import React, { useEffect, useState } from "react";

export function StartupExperience() {
  const [shouldRender, setShouldRender] = useState(false);
  const [phase, setPhase] = useState(1);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Check if splash has already been shown in this browser session
    try {
      const alreadyShown = sessionStorage.getItem("vanvas_startup_shown");
      if (alreadyShown === "1") {
        return;
      }
    } catch {
      // If sessionStorage is unavailable (e.g. private mode restrictions), proceed with one-time view
    }

    setShouldRender(true);

    // Check for reduced motion preference
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setPhase(5);
      const timer = setTimeout(() => {
        setIsFadingOut(true);
        setTimeout(() => {
          setShouldRender(false);
          try {
            sessionStorage.setItem("vanvas_startup_shown", "1");
          } catch {}
        }, 250);
      }, 500);
      return () => clearTimeout(timer);
    }

    // Standard cinematic sequence (~2.1s total)
    const timers: NodeJS.Timeout[] = [];

    // Phase 2: Emblem Stroke Drawing (~250ms)
    timers.push(
      setTimeout(() => {
        setPhase(2);
      }, 250)
    );

    // Phase 3: Landscape & Sun Reveal + Light Shimmer (~750ms)
    timers.push(
      setTimeout(() => {
        setPhase(3);
      }, 750)
    );

    // Phase 4: VANVAS Wordmark & Signature Reveal (~1150ms)
    timers.push(
      setTimeout(() => {
        setPhase(4);
      }, 1150)
    );

    // Phase 5: Journey Route Progress State (~1550ms)
    timers.push(
      setTimeout(() => {
        setPhase(5);
      }, 1550)
    );

    // Phase 6: Graceful Cross-Dissolve Fade Out (~2050ms)
    timers.push(
      setTimeout(() => {
        setIsFadingOut(true);
      }, 2050)
    );

    // Cleanup & Unmount (~2350ms)
    timers.push(
      setTimeout(() => {
        setShouldRender(false);
        try {
          sessionStorage.setItem("vanvas_startup_shown", "1");
        } catch {}
      }, 2350)
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
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#102C26] text-[#FAF4E8] select-none touch-none overflow-hidden transition-opacity duration-300 ease-out ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* Subtle Atmospheric Mountain Gradient Glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 46%, rgba(180, 146, 82, 0.22) 0%, rgba(23, 59, 50, 0.4) 60%, transparent 100%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center max-w-sm w-full">
        {/* Phase 1: Antique Brass Expedition Star */}
        <div
          className={`text-[#B49252] text-xl mb-4 transition-all duration-500 ease-out ${
            phase >= 1
              ? "opacity-90 scale-100 drop-shadow-[0_0_8px_rgba(180,146,82,0.6)]"
              : "opacity-0 scale-50"
          }`}
        >
          ✦
        </div>

        {/* Phase 2 & 3: Expedition Emblem with SVG Path Animation */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 mb-5 flex items-center justify-center">
          <svg
            viewBox="0 0 54 54"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full transform transition-transform duration-700 ease-out"
            style={{
              transform: phase >= 2 ? "scale(1)" : "scale(0.92)",
            }}
          >
            {/* Outer Hexagonal Expedition Seal */}
            <polygon
              points="27,3 49,15 49,39 27,51 5,39 5,15"
              fill="#FAF4E8"
              fillOpacity={phase >= 3 ? 1 : 0.05}
              stroke="#B49252"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeDasharray="200"
              strokeDashoffset={phase >= 2 ? "0" : "200"}
              style={{
                transition:
                  "stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1), fill-opacity 0.4s ease-in",
              }}
            />

            {/* Inner Top Devanagari Shirorekha / Ridge Line */}
            <line
              x1="14"
              y1="15"
              x2="40"
              y2="15"
              stroke="#B65E3C"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeDasharray="30"
              strokeDashoffset={phase >= 2 ? "0" : "30"}
              style={{
                transition:
                  "stroke-dashoffset 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.1s",
              }}
            />

            {/* Winding Mountain Pass & Valley Trail Geometry (V mark) */}
            <path
              d="M17 17L27 37L37 17"
              stroke="#173B32"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="60"
              strokeDashoffset={phase >= 2 ? "0" : "60"}
              style={{
                transition:
                  "stroke-dashoffset 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.15s",
              }}
            />

            {/* Central Expedition River Path */}
            <path
              d="M27 22V43"
              stroke="#B49252"
              strokeWidth="2"
              strokeDasharray="2 3"
              strokeLinecap="round"
              opacity={phase >= 3 ? 1 : 0}
              style={{
                transition: "opacity 0.35s ease-out 0.25s",
              }}
            />

            {/* Dawn Horizon / Peak Sun */}
            <circle
              cx="27"
              cy="10"
              r="2.4"
              fill="#B65E3C"
              className="transition-all duration-500 ease-out"
              style={{
                opacity: phase >= 3 ? 1 : 0,
                transformOrigin: "27px 10px",
                transform: phase >= 3 ? "scale(1)" : "scale(0)",
                transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s",
              }}
            />
          </svg>

          {/* Phase 3: Warm Light Shimmer Sweep */}
          {phase >= 3 && (
            <div
              className="absolute inset-0 rounded-full pointer-events-none opacity-40 animate-pulse"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(180, 146, 82, 0.3) 0%, transparent 70%)",
              }}
            />
          )}
        </div>

        {/* Phase 4: Wordmark & Signature */}
        <div
          className={`flex flex-col items-center transition-all duration-500 ease-out ${
            phase >= 4
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2 pointer-events-none"
          }`}
        >
          <h1 className="font-serif font-black tracking-[0.24em] text-2xl sm:text-3xl text-[#FAF4E8] leading-none mb-2">
            VANVAS
          </h1>

          <div className="flex items-center gap-2 text-[#B49252] opacity-90">
            <span className="h-[1px] w-4 bg-[#B49252] opacity-60" />
            <span className="font-serif italic text-[10px] sm:text-[11px] tracking-[0.2em] uppercase font-medium">
              by The Sorted Club
            </span>
            <span className="h-[1px] w-4 bg-[#B49252] opacity-60" />
          </div>
        </div>

        {/* Phase 5: Subtle Travel Loading Indicator */}
        <div
          className={`flex flex-col items-center gap-2.5 mt-7 transition-all duration-400 ease-out ${
            phase >= 5
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-1 pointer-events-none"
          }`}
        >
          <span className="text-[11px] sm:text-xs tracking-wider text-[#FAF4E8]/80 font-sans font-medium">
            Charting your journey...
          </span>

          {/* Expedition Journey Line Progress */}
          <div className="relative w-36 h-[2px] bg-[#FAF4E8]/15 rounded-full overflow-hidden">
            <div
              className="absolute top-0 bottom-0 bg-gradient-to-r from-transparent via-[#B49252] to-[#FAF4E8] rounded-full"
              style={{
                width: "45%",
                animation: "vanvasRouteSweep 1.2s ease-in-out infinite",
              }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes vanvasRouteSweep {
          0% {
            left: -45%;
          }
          50% {
            left: 50%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </aside>
  );
}
