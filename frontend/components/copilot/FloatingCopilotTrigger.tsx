"use client";

import React from "react";
import { Sparkles, Compass } from "lucide-react";

interface FloatingCopilotTriggerProps {
  onClick: () => void;
  isOpen?: boolean;
}

export const FloatingCopilotTrigger: React.FC<FloatingCopilotTriggerProps> = ({
  onClick,
  isOpen = false,
}) => {
  if (isOpen) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Ask VANVAS AI Companion"
      className="md:hidden fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] right-4 z-50 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#B49252] focus:ring-offset-2 focus:ring-offset-[#EFE5D2] transition-all duration-300 transform active:scale-90"
    >
      {/* Outer Antiqued Travel Seal */}
      <div className="relative flex items-center gap-2 pl-3.5 pr-4 py-2.5 rounded-full bg-[#173B32] text-[#FAF7F0] border-2 border-[#B49252]/70 shadow-2xl backdrop-blur-md transition-all duration-300 group-hover:bg-[#20453B] group-hover:border-[#B49252] group-hover:shadow-[0_8px_25px_rgba(23,59,50,0.4)]">
        {/* Compass Spark Artifact Icon */}
        <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-[#B65E3C] text-[#FAF7F0] shadow-inner border border-[#D8CBB2]/30 shrink-0 group-hover:rotate-12 transition-transform duration-300">
          <Sparkles className="w-3.5 h-3.5 text-[#B49252]" />
        </div>

        {/* Editorial Text + Devanagari Seal */}
        <div className="flex flex-col text-left leading-none">
          <div className="flex items-center gap-1.5">
            <span className="font-serif font-bold text-xs tracking-tight text-[#FAF7F0]">
              Ask VANVAS
            </span>
            <span className="text-[9px] font-devanagari font-bold px-1.5 py-0.5 rounded-md bg-[#B49252]/25 text-[#B49252] border border-[#B49252]/40">
              पूछें
            </span>
          </div>
          <span className="text-[8px] font-mono text-[#D8DED5]/70 mt-0.5 tracking-wider uppercase">
            Mountain AI
          </span>
        </div>

        {/* Subtle Brass Ring Ambient Pulse (respects prefers-reduced-motion) */}
        <div className="absolute -inset-0.5 rounded-full border border-[#B49252]/30 opacity-70 pointer-events-none group-hover:opacity-100 transition-opacity motion-safe:animate-pulse" />
      </div>
    </button>
  );
};
