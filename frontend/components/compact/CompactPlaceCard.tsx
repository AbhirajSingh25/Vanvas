"use client";

import React, { useState } from "react";
import { ArrowRight, Bookmark, MapPin, Star } from "lucide-react";
import { Place } from "@/types";
import { api } from "@/lib/api";
import { VanvasImage } from "@/components/ui/VanvasImage";
import { resolvePlaceArtwork } from "@/lib/placeVisualResolver";

interface CompactPlaceCardProps {
  place: Place;
  destinationName?: string;
  onSelect?: (place: Place) => void;
  onBookmarkChange?: (placeId: string, isSaved: boolean) => void;
}

export const CompactPlaceCard: React.FC<CompactPlaceCardProps> = ({
  place,
  destinationName = "",
  onSelect,
  onBookmarkChange,
}) => {
  const [isSaved, setIsSaved] = useState(place.is_saved || false);
  const [saving, setSaving] = useState(false);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (saving) return;
    setSaving(true);
    try {
      const res = await api.toggleSavePlace(place.id);
      setIsSaved(res.saved);
      if (onBookmarkChange) onBookmarkChange(place.id, res.saved);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const safeCategory = typeof place.category === "string" && place.category ? place.category : "Place";
  const visualRes = resolvePlaceArtwork(
    place.name,
    destinationName,
    safeCategory,
    place.image_url,
    place.is_live,
    place.source
  );

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
      className="group bg-[#FAF7F0] rounded-2xl border-2 border-[#E5D5BA] hover:border-[#173B32] p-3 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 text-left focus:outline-none focus:ring-2 focus:ring-[#173B32]/30 min-h-[88px]"
    >
      {/* Small Left Thumbnail */}
      <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-[#E5D5BA] shrink-0 border border-[#E5D5BA]">
        <VanvasImage
          src={visualRes.imageUrl}
          fallbackSrc={visualRes.fallbackUrl}
          alt={place.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {place.rating && (
          <div className="absolute bottom-0 inset-x-0 bg-[#0F2924]/85 text-[#B49252] text-[8.5px] font-bold font-mono px-1 py-0.5 text-center flex items-center justify-center gap-0.5">
            <Star className="w-2.5 h-2.5 fill-current" />
            <span>{place.rating}</span>
          </div>
        )}
      </div>

      {/* Middle Text Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5 text-[9.5px] font-mono font-bold text-[#7B4D36] uppercase tracking-wider">
          <span className="truncate">{safeCategory}</span>
          {typeof place.distance_km === "number" && (
            <>
              <span>·</span>
              <span className="text-[#536B52] whitespace-nowrap">{place.distance_km} km</span>
            </>
          )}
        </div>

        <h4 className="font-serif font-black text-sm sm:text-base text-[#173B32] group-hover:text-[#B65E3C] transition-colors leading-tight truncate">
          {place.name}
        </h4>

        <p className="text-[11px] text-[#20211D]/75 line-clamp-1 font-light leading-snug">
          {place.why_vanvas_recommends || place.description || "Authentic landmark."}
        </p>
      </div>

      {/* Right Actions */}
      <div className="flex flex-col items-end justify-between self-stretch shrink-0">
        <button
          type="button"
          onClick={handleToggleSave}
          disabled={saving}
          aria-label="Save Place"
          className="p-1 rounded-full text-[#7B4D36] hover:text-[#B65E3C] transition-colors"
        >
          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-[#B65E3C] text-[#B65E3C]" : ""}`} />
        </button>

        <span className="text-[#B65E3C] font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 text-xs">
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
