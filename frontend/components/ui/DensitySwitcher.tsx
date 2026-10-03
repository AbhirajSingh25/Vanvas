"use client";

import React from "react";
import { useDensity } from "@/context/DensityContext";

interface DensitySwitcherProps {
  className?: string;
  showLabel?: boolean;
}

export function DensitySwitcher({
  className = "",
  showLabel = true,
}: DensitySwitcherProps) {
  const { density, setDensity, isCompact } = useDensity();

  return (
    <div
      role="group"
      aria-label="Layout view density"
      className={`inline-flex items-center gap-1 bg-[#FAF7F0] p-1 rounded-xl border border-[#D8CBB2] shadow-2xs ${className}`}
    >
      {showLabel && (
        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#7B4D36] px-2 select-none">
          VIEW
        </span>
      )}

      <button
        type="button"
        id="density-btn-original"
        onClick={() => setDensity("original")}
        aria-label="Switch to Original Mode"
        aria-pressed={!isCompact}
        className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-serif font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#B49252] focus-visible:outline-none select-none ${
          !isCompact
            ? "bg-[#173B32] text-[#FAF4E8] shadow-xs"
            : "text-[#7B4D36] hover:text-[#173B32] hover:bg-[#EFE5D2]/70"
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full transition-colors ${
            !isCompact ? "bg-[#B49252]" : "border border-[#7B4D36]/60 bg-transparent"
          }`}
          aria-hidden="true"
        />
        <span>Original</span>
      </button>

      <button
        type="button"
        id="density-btn-compact"
        onClick={() => setDensity("compact")}
        aria-label="Switch to Compact Mode"
        aria-pressed={isCompact}
        className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-serif font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#B49252] focus-visible:outline-none select-none ${
          isCompact
            ? "bg-[#173B32] text-[#FAF4E8] shadow-xs"
            : "text-[#7B4D36] hover:text-[#173B32] hover:bg-[#EFE5D2]/70"
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full transition-colors ${
            isCompact ? "bg-[#B49252]" : "border border-[#7B4D36]/60 bg-transparent"
          }`}
          aria-hidden="true"
        />
        <span>Compact</span>
      </button>
    </div>
  );
}
