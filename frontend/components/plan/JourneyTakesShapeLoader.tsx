"use client";

import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Navigation, AlertCircle, RefreshCw, ArrowLeft, Compass, MapPin } from "lucide-react";
import { VanvasImage } from "@/components/ui/VanvasImage";
import { resolveDestinationAsset } from "@/lib/visualIntelligence";

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
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  const visualAsset = resolveDestinationAsset(destination || destinationName);

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full rounded-3xl bg-[#FAF7F0] border-2 border-[#173B32] shadow-2xl overflow-hidden text-[#173B32] relative transition-all duration-300 animate-fadeIn"
    >
      {error ? (
        /* Clear, Restrained Error State */
        <div className="p-6 sm:p-10 space-y-6 text-center bg-[#FAF7F0]">
          <div className="w-14 h-14 rounded-full bg-[#B65E3C]/15 border-2 border-[#B65E3C]/30 mx-auto flex items-center justify-center text-[#B65E3C]">
            <AlertCircle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B65E3C] bg-[#FAF4E8] px-2.5 py-1 rounded-full border border-[#E5D5BA]">
              EXPEDITION NOTICE
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-black text-[#173B32]">
              Expedition Could Not Be Built
            </h3>
            <p className="text-xs sm:text-sm text-[#7B4D36] max-w-md mx-auto leading-relaxed">
              {error}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#FAF4E8] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Expedition</span>
              </button>
            )}
            {onEditJourney && (
              <button
                type="button"
                onClick={onEditJourney}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#FAF7F0] hover:bg-[#EFE5D2] border border-[#E5D5BA] text-[#173B32] font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-[#7B4D36]" />
                <span>Edit Preferences</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Dedicated Journey in Motion Canvas */
        <div className="flex flex-col">
          {/* Top Stamp Bar */}
          <div className="p-4 sm:p-5 bg-[#FAF7F0] border-b border-[#E5D5BA] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#B49252]" />
              <span className="text-[11px] font-bold tracking-widest uppercase text-[#173B32] font-mono">
                JOURNEY IN MOTION
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-[#7B4D36] bg-[#EFE5D2] px-2.5 py-0.5 rounded-full">
              {daysCount} Days · {transportMode}
            </span>
          </div>

          {/* Visual Anchors Header: Origin -> Destination */}
          <div className="p-5 sm:p-6 bg-[#FAF7F0] border-b border-[#E5D5BA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Origin Anchor */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7B4D36] flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#173B32]" />
                <span>Origin Hub</span>
              </span>
              <p className="font-serif text-lg sm:text-xl font-bold text-[#173B32]">
                {origin || "Starting Point"}
              </p>
            </div>

            {/* Connecting Route Arrow */}
            <div className="hidden sm:flex items-center gap-2 text-[#B49252]">
              <div className="w-12 h-0.5 bg-gradient-to-r from-[#173B32] via-[#B49252] to-[#B65E3C]" />
              <Navigation className="w-4 h-4 rotate-90 shrink-0" />
              <div className="w-12 h-0.5 bg-gradient-to-r from-[#B49252] via-[#B65E3C] to-[#173B32]" />
            </div>

            {/* Destination Anchor with Contextual Artwork */}
            <div className="flex items-center gap-3 self-end sm:self-auto text-right">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B65E3C]">
                  Sanctuary Destination
                </span>
                <p className="font-serif text-lg sm:text-2xl font-black text-[#173B32]">
                  {destinationName || destination}
                </p>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-[#E5D5BA] border border-[#173B32]/30 shrink-0 shadow-xs">
                <VanvasImage
                  src={visualAsset.primarySrc}
                  fallbackSrc={visualAsset.fallbackSrc}
                  alt={destinationName || destination}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Forest-Green Route Surface with Fine Topographic Map Contours */}
          <div className="p-6 sm:p-8 bg-[#0F2924] text-[#EFE5D2] relative overflow-hidden space-y-6">
            {/* Topographic Contour Background */}
            <div aria-hidden="true" className="absolute inset-0 pointer-events-none opacity-15">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="contour-pattern" width="100" height="100" patternUnits="userSpaceOnUse">
                    <path
                      d="M0 20 Q 25 5, 50 20 T 100 20 M0 50 Q 25 35, 50 50 T 100 50 M0 80 Q 25 65, 50 80 T 100 80"
                      fill="none"
                      stroke="#FAF4E8"
                      strokeWidth="0.7"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#contour-pattern)" />
              </svg>
            </div>

            {/* SVG Animated Route Line Canvas */}
            <div className="relative py-2">
              <svg
                viewBox="0 0 400 130"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-32 sm:h-36 overflow-visible"
              >
                {/* Elevation Baseline Grid */}
                <path
                  d="M20 65 H380 M100 15 V115 M200 15 V115 M300 15 V115"
                  stroke="#243E36"
                  strokeWidth="0.8"
                  strokeDasharray="2 4"
                />

                {/* Base Route Track */}
                <path
                  d="M 30 85 C 90 25, 150 110, 220 50 S 310 95, 370 40"
                  stroke="#243E36"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Animated Route Line Drawing */}
                <motion.path
                  d="M 30 85 C 90 25, 150 110, 220 50 S 310 95, 370 40"
                  stroke="url(#explorer-route-gradient)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  initial={shouldReduceMotion ? { pathLength: 1 } : { pathLength: 0.15 }}
                  animate={{ pathLength: [0.15, 1, 0.95, 1] }}
                  transition={{
                    duration: 3.5,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                />

                {/* Traveling Route Marker */}
                {!shouldReduceMotion && (
                  <motion.circle
                    r="5"
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
                      offsetPath: "path('M 30 85 C 90 25, 150 110, 220 50 S 310 95, 370 40')",
                    }}
                  />
                )}

                {/* Waypoint 1: Plains Exit Corridor */}
                <motion.g
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                >
                  <circle cx="120" cy="65" r="3.5" fill="#B49252" />
                  <text x="120" y="82" fill="#D8DED5" fontSize="8.5" textAnchor="middle" opacity="0.85" fontFamily="monospace">
                    Corridor Exit
                  </text>
                </motion.g>

                {/* Waypoint 2: Valley Ingress */}
                <motion.g
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                >
                  <circle cx="220" cy="50" r="3.5" fill="#B49252" />
                  <text x="220" y="38" fill="#D8DED5" fontSize="8.5" textAnchor="middle" opacity="0.85" fontFamily="monospace">
                    Valley Ingress
                  </text>
                </motion.g>

                {/* Waypoint 3: Mountain Ascent */}
                <motion.g
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2, duration: 0.4 }}
                >
                  <circle cx="305" cy="76" r="3.5" fill="#B49252" />
                  <text x="305" y="94" fill="#D8DED5" fontSize="8.5" textAnchor="middle" opacity="0.85" fontFamily="monospace">
                    Ascent &amp; Stays
                  </text>
                </motion.g>

                {/* Origin Anchor Node */}
                <circle cx="30" cy="85" r="7" fill="#173B32" stroke="#FAF4E8" strokeWidth="2" />
                <circle cx="30" cy="85" r="2.5" fill="#FAF4E8" />

                {/* Destination Sanctuary Node */}
                <circle cx="370" cy="40" r="8" fill="#B65E3C" stroke="#FAF4E8" strokeWidth="2.5" />
                <circle cx="370" cy="40" r="3" fill="#FAF4E8" />

                {/* Gradient Definition */}
                <defs>
                  <linearGradient id="explorer-route-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#B49252" />
                    <stop offset="50%" stopColor="#FAF4E8" />
                    <stop offset="100%" stopColor="#B65E3C" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Supporting Lifecycle Status */}
            <div className="pt-3 border-t border-[#243E36] text-center space-y-1">
              <h4 className="font-serif text-base sm:text-lg font-bold text-[#FAF4E8]">
                {isSlow
                  ? `Assembling mountain stays & local timing for ${destinationName || destination}...`
                  : `Mapping expedition corridor to ${destinationName || destination}...`}
              </h4>
              <p className="text-xs text-[#D8DED5]/70 max-w-sm mx-auto font-light">
                {isSlow
                  ? "Verifying trail connections, altitude acclimation windows, and route checkpoints."
                  : "Curating verified trails, authentic mountain stays, and arrival logistics."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
