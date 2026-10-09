"use client";

import React from "react";
import { ArrowRight, Navigation, MapPin } from "lucide-react";
import { Place } from "@/types";

interface CompactNearbyItemProps {
  place: Place;
  onSelect?: (place: Place) => void;
}

export const CompactNearbyItem: React.FC<CompactNearbyItemProps> = ({ place, onSelect }) => {
  const getCategoryEmoji = (cat?: string) => {
    const c = (cat || "").toLowerCase();
    if (c.includes("caf")) return "☕";
    if (c.includes("temple") || c.includes("heritage") || c.includes("monument")) return "🛕";
    if (c.includes("food") || c.includes("restaurant") || c.includes("dhaba")) return "🍛";
    if (c.includes("view") || c.includes("nature") || c.includes("waterfall")) return "🌲";
    if (c.includes("bike") || c.includes("scooter") || c.includes("rent")) return "🛵";
    if (c.includes("stay") || c.includes("hotel") || c.includes("hostel")) return "🛏️";
    return "📍";
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect && onSelect(place)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (onSelect) onSelect(place);
        }
      }}
      className="group bg-[#FAF7F0] rounded-xl border border-[#E5D5BA] hover:border-[#173B32] p-3 shadow-2xs hover:shadow-xs interactive-card touch-press flex items-center justify-between gap-3 text-left cursor-pointer focus:outline-none"
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <span className="text-lg shrink-0">{getCategoryEmoji(place.category)}</span>
        <div className="min-w-0 flex-1">
          <h4 className="font-serif font-bold text-sm text-[#173B32] group-hover:text-[#B65E3C] transition-colors leading-tight truncate">
            {place.name}
          </h4>
          <div className="flex items-center gap-1.5 text-[10px] text-[#7B4D36] font-mono mt-0.5">
            {typeof place.distance_km === "number" && (
              <>
                <span className="text-[#536B52] font-semibold">{place.distance_km} km</span>
                <span>·</span>
              </>
            )}
            <span className="truncate uppercase">{place.category || "Landmark"}</span>
          </div>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-1 text-[#B65E3C] group-hover:translate-x-0.5 transition-transform text-xs font-bold">
        <span>Directions</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </div>
  );
};
