"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Mountain, Footprints } from "lucide-react";
import { TrekItem } from "@/lib/trekContentModel";
import { VanvasImage } from "@/components/ui/VanvasImage";

interface CompactTrekCardProps {
  trek: TrekItem;
}

export const CompactTrekCard: React.FC<CompactTrekCardProps> = ({ trek }) => {
  const diffColor =
    trek.difficulty === "Easy"
      ? "text-emerald-400 border-emerald-800 bg-emerald-950/70"
      : trek.difficulty === "Moderate"
      ? "text-amber-400 border-amber-800 bg-amber-950/70"
      : "text-red-400 border-red-800 bg-red-950/70";

  return (
    <Link
      href={`/treks/${trek.slug}`}
      data-testid="compact-trek-card"
      className="group bg-[#15201A] rounded-2xl border border-[#2A3E33] hover:border-[#E05A2B] p-2.5 sm:p-3 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between gap-3 text-left min-h-[82px] sm:min-h-[88px] relative overflow-hidden"
    >
      {/* Smaller, clear thumbnail aligned on the left */}
      <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-[#0E1713] shrink-0 border border-[#25372D]">
        <VanvasImage
          src={trek.heroImage}
          alt={trek.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        <span className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold text-[#E05A2B]">
          {trek.peakAltitudeFormatted}
        </span>
      </div>

      {/* Trek title and metadata aligned on the right */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-[#8FA699] uppercase tracking-wider">
          <span className={`px-1 py-0.2 rounded text-[8px] font-mono border ${diffColor}`}>
            {trek.difficulty}
          </span>
          <span className="truncate">{trek.region}</span>
        </div>

        <h4 className="font-serif font-black text-sm text-[#FAF4E8] group-hover:text-[#E05A2B] transition-colors leading-tight truncate">
          {trek.title}
        </h4>

        <div className="flex items-center gap-2 text-[10px] font-mono text-[#B49252]">
          <span>₹{trek.approxBudgetPerPerson}</span>
          <span>·</span>
          <span className="text-[#8FA699]">{trek.durationDays === 1 ? trek.durationHours : `${trek.durationDays} Days`}</span>
        </div>
      </div>

      {/* Trailing arrow */}
      <div className="shrink-0 self-center">
        <span className="w-7 h-7 rounded-lg bg-[#25372D] group-hover:bg-[#E05A2B] text-[#FAF4E8] transition-colors flex items-center justify-center">
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  );
};

export const CompactTrekStrip: React.FC<{
  elevation?: string;
  distance?: string;
  time?: string;
  difficulty?: string;
}> = ({
  elevation = "4,000m",
  distance = "5.2 km",
  time = "3h 45m",
  difficulty = "MODERATE",
}) => {
  return (
    <div className="grid grid-cols-4 gap-2 bg-[#0E1713] p-3 rounded-2xl border border-[#25372D] text-center">
      <div>
        <div className="text-xs sm:text-sm font-mono font-black text-[#E05A2B]">{elevation}</div>
        <div className="text-[8.5px] font-mono text-[#8FA699] uppercase tracking-wider mt-0.5">Elevation</div>
      </div>
      <div className="border-l border-[#25372D]">
        <div className="text-xs sm:text-sm font-mono font-black text-[#FAF4E8]">{distance}</div>
        <div className="text-[8.5px] font-mono text-[#8FA699] uppercase tracking-wider mt-0.5">Distance</div>
      </div>
      <div className="border-l border-[#25372D]">
        <div className="text-xs sm:text-sm font-mono font-black text-[#FAF4E8]">{time}</div>
        <div className="text-[8.5px] font-mono text-[#8FA699] uppercase tracking-wider mt-0.5">Time</div>
      </div>
      <div className="border-l border-[#25372D]">
        <div className="text-xs sm:text-sm font-mono font-black text-[#B49252]">{difficulty}</div>
        <div className="text-[8.5px] font-mono text-[#8FA699] uppercase tracking-wider mt-0.5">Difficulty</div>
      </div>
    </div>
  );
};
