"use client";

import React, { useState, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Navigation, Compass, AlertCircle, RefreshCw, ArrowLeft, MapPin } from "lucide-react";

interface RoutePlottingLoaderProps {
  origin: string;
  destination: string;
  vehicleType?: string;
  tripStyle?: string;
  error?: string | null;
  onRetry?: () => void;
  onDismissError?: () => void;
}

const PLOTTING_PHASES = [
  "Tracing highway geometry & mountain passes...",
  "Discovering roadside dhabas & vantage points...",
  "Synthesizing driving legs, tolls & fuel budget...",
];

export const RoutePlottingLoader: React.FC<RoutePlottingLoaderProps> = ({
  origin,
  destination,
  vehicleType = "SUV",
  tripStyle = "Balanced",
  error,
  onRetry,
  onDismissError,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    if (error) return;
    const interval = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % PLOTTING_PHASES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [error]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="route-plotting-loader"
      aria-label={`Plotting route from ${origin} to ${destination}`}
      className="fixed inset-0 z-50 bg-[#173B32]/92 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-in fade-in duration-200"
    >
      <div className="max-w-md w-full bg-[#FAF7F0] text-[#20211D] border-2 border-[#B49252] rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 relative overflow-hidden text-left">
        {/* Subtle Map Grid / Topographic Background */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#173B32_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Top Header Badge */}
        <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-3">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${error ? "bg-red-500" : "bg-emerald-500 animate-pulse"}`} />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7B4D36]">
              {error ? "ROUTE SURVEY FAILED" : "LIVE ROUTE PLOTTING"}
            </span>
          </div>
          <span className="text-[10px] font-mono font-semibold text-[#173B32] bg-[#EFE5D2] px-2 py-0.5 rounded-full">
            {vehicleType} · {tripStyle}
          </span>
        </div>

        {/* Selected Route Details */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#7B4D36]">
            <span>Corridor Survey:</span>
          </div>
          <h3 className="font-serif font-black text-xl sm:text-2xl text-[#173B32] leading-tight flex items-center gap-2">
            <span>{origin}</span>
            <span className="text-[#B65E3C] text-lg font-sans">→</span>
            <span>{destination}</span>
          </h3>
        </div>

        {error ? (
          /* Error & Recovery State */
          <div className="space-y-4 pt-1">
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-900 space-y-1.5">
              <div className="flex items-center gap-2 font-serif font-bold text-sm text-red-800">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Highway Route Calculation Error</span>
              </div>
              <p className="text-xs text-red-700 leading-relaxed font-sans">
                {error}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-white text-xs font-bold uppercase tracking-wider shadow-xs active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Calculation</span>
                </button>
              )}
              {onDismissError && (
                <button
                  type="button"
                  onClick={onDismissError}
                  className="w-full py-2.5 px-4 rounded-xl border border-[#D8CBB2] hover:bg-[#EFE5D2] text-[#173B32] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Origin/Destination</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Honest Progress State with Animated SVG Highway Line */
          <div className="space-y-4">
            {/* SVG Highway Drawing Canvas */}
            <div className="relative h-24 w-full bg-[#EFE5D2]/70 rounded-2xl border border-[#D8CBB2] p-3 flex items-center justify-center overflow-hidden">
              <svg
                viewBox="0 0 340 70"
                className="w-full h-full"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Background base path */}
                <path
                  d="M 20 45 C 90 10, 140 60, 210 25 C 260 0, 290 55, 320 25"
                  stroke="#D8CBB2"
                  strokeWidth="3"
                  strokeDasharray="4 4"
                />

                {/* Animated plotted highway line */}
                <motion.path
                  d="M 20 45 C 90 10, 140 60, 210 25 C 260 0, 290 55, 320 25"
                  stroke="#B65E3C"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  initial={shouldReduceMotion ? { pathLength: 1 } : { pathLength: 0.15 }}
                  animate={
                    shouldReduceMotion
                      ? { pathLength: 1 }
                      : { pathLength: [0.15, 1, 0.15] }
                  }
                  transition={{
                    duration: 3,
                    ease: "easeInOut",
                    repeat: Infinity,
                  }}
                />

                {/* Origin Marker */}
                <circle cx="20" cy="45" r="5" fill="#173B32" stroke="#FAF7F0" strokeWidth="2" />
                
                {/* Mid Waypoints */}
                <circle cx="160" cy="40" r="3.5" fill="#B49252" />
                <circle cx="240" cy="18" r="3.5" fill="#B49252" />

                {/* Destination Marker */}
                <circle cx="320" cy="25" r="5" fill="#B65E3C" stroke="#FAF7F0" strokeWidth="2" />
              </svg>

              {/* Waypoint Text Labels */}
              <div className="absolute bottom-1.5 inset-x-3 flex items-center justify-between text-[9px] font-mono font-bold text-[#7B4D36]">
                <span className="truncate max-w-[80px]">{origin}</span>
                <span className="text-[#B49252]">Highway Stops</span>
                <span className="truncate max-w-[80px] text-right">{destination}</span>
              </div>
            </div>

            {/* Indeterminate Phase Text */}
            <div className="text-center space-y-1">
              <p className="font-serif font-bold text-sm text-[#173B32] transition-opacity duration-300">
                {PLOTTING_PHASES[phaseIndex]}
              </p>
              <p className="text-[11px] font-mono text-[#7B4D36]">
                Fetching real OSRM coordinates &amp; highway intelligence
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
