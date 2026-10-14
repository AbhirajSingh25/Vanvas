"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { Destination } from "@/types";
import { DestinationArtwork } from "@/components/brand/DestinationArtwork";
import { getCanonicalHindiName } from "@/lib/canonicalDestinations";

interface CompactDestinationCardProps {
  destination: Destination;
  daysEstimate?: number | string;
}

export const CompactDestinationCard: React.FC<CompactDestinationCardProps> = ({
  destination,
  daysEstimate = 4,
}) => {
  const hindi =
    destination.hindi_name ||
    getCanonicalHindiName(destination.slug || destination.name) ||
    "सफ़र";

  const alt = destination.altitude_meters
    ? `${destination.altitude_meters}m`
    : destination.region?.includes("Coast")
    ? "Sea level"
    : destination.state || "India";

  return (
    <Link
      href={`/explore/${destination.slug}`}
      data-testid="compact-destination-card"
      className="group bg-[#FAF7F0] rounded-2xl border-2 border-[#E5D5BA] hover:border-[#173B32] p-2.5 sm:p-3 shadow-2xs hover:shadow-md interactive-card touch-press flex items-center justify-between gap-3 text-left min-h-[82px] sm:min-h-[88px] relative overflow-hidden transition-all"
    >
      {/* Smaller, clear thumbnail aligned on the left */}
      <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-[#173B32] shrink-0 border border-[#E5D5BA]">
        <DestinationArtwork
          slug={destination.slug}
          aspectRatio="square"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-95"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        {destination.altitude_meters ? (
          <span className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold text-[#FAF7F0]">
            {destination.altitude_meters}m
          </span>
        ) : null}
      </div>

      {/* Destination name and useful metadata aligned on the right */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5 text-[9.5px] font-mono font-bold text-[#7B4D36] uppercase tracking-wider">
          <span className="truncate">{destination.region || destination.state}</span>
          <span className="text-[#B49252] font-devanagari font-semibold">· {hindi}</span>
        </div>

        <h4 className="font-serif font-black text-sm sm:text-base text-[#173B32] group-hover:text-[#B65E3C] transition-colors leading-tight truncate">
          {destination.name}
        </h4>

        <div className="flex items-center gap-2 text-[10px] font-mono text-[#536B52]">
          <span>{destination.places_count || 10}+ places</span>
          <span>·</span>
          <span>{daysEstimate} days</span>
        </div>
      </div>

      {/* Trailing arrow */}
      <div className="shrink-0 self-center">
        <span className="w-7 h-7 rounded-lg bg-[#173B32]/10 group-hover:bg-[#B65E3C] text-[#173B32] group-hover:text-[#FAF7F0] transition-colors flex items-center justify-center">
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  );
};
