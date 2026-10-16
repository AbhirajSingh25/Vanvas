"use client";

import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { MapPin, Navigation, AlertCircle, RefreshCw, ArrowLeft, Compass } from "lucide-react";

interface JourneyTakesShapeLoaderProps {
  origin: string;
  destination: string;
  destinationName: string;
  transportMode?: string;
  daysCount?: number;
  error?: string | null;
  onRetry?: () => void;
  onEditJourney?: () => void;
}

export const JourneyTakesShapeLoader: React.FC<JourneyTakesShapeLoaderProps> = ({
  origin,
  destination,
  destinationName,
  transportMode = "Bus",
  daysCount = 4,
  error,
  onRetry,
  onEditJourney,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSlow(true);
    }, 7000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#EFE5D2]/90 backdrop-blur-md transition-all duration-300"
    >
      <div className="w-full max-w-lg rounded-2xl bg-[#0F2924] border border-[#31483D] shadow-2xl overflow-hidden text-[#EFE5D2] relative">
        {/* Subtle Topographic Background Pattern */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#FAF4E8_1px,transparent_1px)] [background-size:20px_20px]"
        />

        {error ? (
          /* Error State with Recovery Actions */
          <div className="p-6 sm:p-8 space-y-6 relative z-10 text-center">
            <div className="w-14 h-14 rounded-full bg-[#B65E3C]/20 border border-[#B65E3C]/40 mx-auto flex items-center justify-center text-[#B65E3C]">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#FAF4E8]">
                Expedition Could Not Be Built
              </h3>
              <p className="text-sm text-[#D8DED5]/80 max-w-md mx-auto leading-relaxed">
                {error}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#FAF4E8] font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry Expedition</span>
                </button>
              )}
              {onEditJourney && (
                <button
                  type="button"
                  onClick={onEditJourney}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#D8DED5] border border-[#31483D] font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Edit Preferences</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Active "The Journey Takes Shape" Route Animation */
          <div className="p-6 sm:p-8 space-y-6 relative z-10">
            {/* Header Stamp */}
            <div className="flex items-center justify-between border-b border-[#243E36] pb-4">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#B49252] animate-spin-slow" />
                <span className="text-[11px] font-bold tracking-widest uppercase text-[#B49252] font-mono">
                  VANVAS EXPEDITION ENGINE
                </span>
              </div>
              <span className="text-[11px] text-[#D8DED5]/70 font-mono">
                {daysCount} Days • {transportMode}
              </span>
            </div>

            {/* Origin -> Destination Banner */}
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#D8DED5]/60">
                  Starting Point
                </span>
                <p className="font-serif text-lg sm:text-xl font-bold text-[#FAF4E8] truncate max-w-[140px] sm:max-w-[180px]">
                  {origin}
                </p>
              </div>

              <div className="flex-1 flex items-center justify-center px-2">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-[#31483D] via-[#B49252]/50 to-[#31483D]" />
                <Navigation className="w-4 h-4 text-[#B49252] mx-2 rotate-90 shrink-0" />
                <div className="h-[1px] flex-1 bg-gradient-to-r from-[#31483D] via-[#B49252]/50 to-[#31483D]" />
              </div>

              <div className="space-y-0.5 text-right">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#D8DED5]/60">
                  Sanctuary Destination
                </span>
                <p className="font-serif text-lg sm:text-xl font-bold text-[#FAF4E8] truncate max-w-[140px] sm:max-w-[180px]">
                  {destinationName || destination}
                </p>
              </div>
            </div>

            {/* SVG Progressive Route Canvas */}
            <div className="relative py-4 px-2">
              <svg
                viewBox="0 0 360 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-28 sm:h-32 overflow-visible"
              >
                {/* Background Grid Lines */}
                <path
                  d="M10 60 H350 M60 10 V110 M180 10 V110 M300 10 V110"
                  stroke="#243E36"
                  strokeWidth="0.8"
                  strokeDasharray="2 4"
                />

                {/* Illustrated Route Arc (Curved mountain road) */}
                <path
                  d="M 30 75 C 100 20, 140 105, 210 45 S 290 85, 330 35"
                  stroke="#243E36"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Progressive Route Drawing */}
                <motion.path
                  d="M 30 75 C 100 20, 140 105, 210 45 S 290 85, 330 35"
                  stroke="url(#route-gradient)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  initial={shouldReduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
                  animate={{ pathLength: [0.1, 1, 0.95, 1] }}
                  transition={{
                    duration: 3.2,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                />

                {/* Moving Expedition Marker Dot */}
                {!shouldReduceMotion && (
                  <motion.circle
                    r="4.5"
                    fill="#B65E3C"
                    stroke="#FAF4E8"
                    strokeWidth="2"
                    initial={{ offsetDistance: "0%" }}
                    animate={{ offsetDistance: "100%" }}
                    transition={{
                      duration: 4,
                      ease: "easeInOut",
                      repeat: Infinity,
                    }}
                    style={{
                      offsetPath: "path('M 30 75 C 100 20, 140 105, 210 45 S 290 85, 330 35')",
                    }}
                  />
                )}

                {/* Waypoint 1: Foothill Transit Hub */}
                <circle cx="120" cy="58" r="3" fill="#B49252" />
                <text x="120" y="74" fill="#D8DED5" fontSize="8" textAnchor="middle" opacity="0.75" fontFamily="monospace">
                  Foothills
                </text>

                {/* Waypoint 2: Mountain Ridge Pass */}
                <circle cx="210" cy="45" r="3" fill="#B49252" />
                <text x="210" y="34" fill="#D8DED5" fontSize="8" textAnchor="middle" opacity="0.75" fontFamily="monospace">
                  Pass &amp; View
                </text>

                {/* Waypoint 3: Sanctuary Valley */}
                <circle cx="280" cy="68" r="3" fill="#B49252" />
                <text x="280" y="84" fill="#D8DED5" fontSize="8" textAnchor="middle" opacity="0.75" fontFamily="monospace">
                  Valley Ingress
                </text>

                {/* Origin Marker */}
                <circle cx="30" cy="75" r="6" fill="#173B32" stroke="#FAF4E8" strokeWidth="2" />
                <circle cx="30" cy="75" r="2.5" fill="#FAF4E8" />

                {/* Destination Marker */}
                <circle cx="330" cy="35" r="7" fill="#B65E3C" stroke="#FAF4E8" strokeWidth="2" />
                <circle cx="330" cy="35" r="3" fill="#FAF4E8" />

                {/* Gradient Definition */}
                <defs>
                  <linearGradient id="route-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#B49252" />
                    <stop offset="50%" stopColor="#FAF4E8" />
                    <stop offset="100%" stopColor="#B65E3C" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Status Footer */}
            <div className="space-y-1.5 text-center pt-1 border-t border-[#243E36]">
              <h4 className="font-serif text-base sm:text-lg font-bold text-[#FAF4E8]">
                {isSlow
                  ? "Finalizing trails & authentic mountain stays..."
                  : `Preparing your journey to ${destinationName || destination}...`}
              </h4>
              <p className="text-xs text-[#D8DED5]/70 max-w-sm mx-auto">
                {isSlow
                  ? "Assembling route distances, timing windows, and verified places."
                  : "Curating verified trails, mountain stays, and arrival logistics."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
