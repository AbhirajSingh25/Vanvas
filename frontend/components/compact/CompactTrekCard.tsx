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
      className="group bg-[#15201A] rounded-2xl border border-[#2A3E33] hover:border-[#E05A2B] overflow-hidden shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between h-[180px] sm:h-[195px]"
    >
      <div className="relative h-20 sm:h-22 w-full overflow-hidden bg-[#0E1713]">
        <VanvasImage
          src={trek.heroImage}
          alt={trek.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#15201A] via-transparent to-black/30" />

        <div className="absolute top-1.5 left-2">
          <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold uppercase border ${diffColor}`}>
            {trek.difficulty}
          </span>
        </div>

        <div className="absolute bottom-1 right-2">
          <span className="text-[10px] font-mono font-bold text-[#E05A2B]">
            {trek.peakAltitudeFormatted}
          </span>
        </div>
      </div>

      <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between space-y-1">
        <div>
          <h4 className="font-serif font-black text-sm text-[#FAF4E8] group-hover:text-[#E05A2B] transition-colors leading-tight truncate">
            {trek.title}
          </h4>
          <p className="text-[10px] font-mono text-[#8FA699] truncate mt-0.5">
            {trek.region} · {trek.durationDays === 1 ? trek.durationHours : `${trek.durationDays} Days`}
          </p>
        </div>

        <div className="pt-1.5 border-t border-[#25372D] flex items-center justify-between text-[10px] font-mono">
          <span className="text-[#B49252]">₹{trek.approxBudgetPerPerson}</span>
          <span className="text-[#E05A2B] font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
            <span>Trail</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
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
