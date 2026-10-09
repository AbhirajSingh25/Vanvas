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
      className="group bg-[#FAF7F0] rounded-2xl border-2 border-[#E5D5BA] hover:border-[#173B32] overflow-hidden shadow-2xs hover:shadow-lg interactive-card touch-press flex flex-col justify-between h-[180px] sm:h-[195px] relative"
    >
      {/* Compact Image Strip (not dominating the card) */}
      <div className="relative h-20 sm:h-22 w-full overflow-hidden bg-[#173B32]">
        <DestinationArtwork
          slug={destination.slug}
          aspectRatio="square"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F2924]/80 via-transparent to-black/20" />

        {/* Region / State Tag */}
        <div className="absolute top-1.5 left-2">
          <span className="px-1.5 py-0.5 rounded bg-[#173B32]/90 backdrop-blur-xs text-[#EFE5D2] text-[8.5px] font-mono font-bold uppercase tracking-wider">
            {destination.region || destination.state}
          </span>
        </div>

        {/* Hindi Subtitle inside image bottom */}
        <div className="absolute bottom-1 right-2">
          <span className="font-devanagari text-[11px] text-[#B49252] font-semibold opacity-95">
            {hindi}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between space-y-1">
        <div>
          <div className="flex items-baseline justify-between gap-1">
            <h4 className="font-serif font-black text-sm sm:text-base text-[#173B32] group-hover:text-[#B65E3C] transition-colors leading-tight truncate">
              {destination.name}
            </h4>
          </div>
          <p className="text-[10px] font-mono text-[#7B4D36] tracking-tight mt-0.5">
            {alt} · {daysEstimate} days
          </p>
        </div>

        <div className="pt-1.5 border-t border-[#E5D5BA] flex items-center justify-between text-[10px]">
          <span className="text-[#536B52] font-semibold">
            {destination.places_count || 10}+ places
          </span>
          <span className="text-[#B65E3C] font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
            <span>View</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
};
