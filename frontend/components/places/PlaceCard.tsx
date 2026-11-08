"use client";

import React, { useState } from "react";
import { Star, Clock, Bookmark, MapPin, Sparkles, ArrowRight } from "lucide-react";
import { Place } from "@/types";
import { api } from "@/lib/api";
import { VanvasImage } from "@/components/ui/VanvasImage";
import { resolvePlaceArtwork } from "@/lib/placeVisualResolver";
import { useDensity } from "@/context/DensityContext";

interface PlaceCardProps {
  place: Place;
  destinationName?: string;
  onSelect?: (place: Place) => void;
  onBookmarkChange?: (placeId: string, isSaved: boolean) => void;
  onPlanPlace?: (place: Place) => void;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  destinationName = "",
  onSelect,
  onBookmarkChange,
  onPlanPlace,
}) => {
  const { isCompact } = useDensity();
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
  
  // Resolve place artwork and source classification
  const visualRes = resolvePlaceArtwork(
    place.name,
    destinationName,
    safeCategory,
    place.image_url,
    place.is_live,
    place.source
  );

  const isLive = place.is_live || place.source === "google_places" || place.source === "openstreetmap";

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
      className={`group bg-[#FAF7F0] dark:bg-[#1C2E27] rounded-2xl border border-[#E5D5BA] dark:border-[#2C3B34] hover:border-[#173B32]/60 dark:hover:border-[#B49252]/60 overflow-hidden shadow-xs hover:shadow-xl interactive-card touch-press cursor-pointer flex flex-col justify-between h-full relative focus:outline-none focus:ring-2 focus:ring-[#173B32]/30 min-w-0 w-full ${
        isCompact ? "card-compact" : ""
      }`}
    >
      {/* Image Container - Standardized Aspect Ratio */}
      <div className={`relative w-full overflow-hidden bg-[#E5D5BA] dark:bg-[#2C3B34] shrink-0 ${isCompact ? "aspect-[16/9]" : "aspect-[16/10]"}`}>
        <VanvasImage
          src={visualRes.imageUrl}
          fallbackSrc={visualRes.fallbackUrl}
          alt={destinationName ? `${place.name} in ${destinationName}` : place.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />

        {/* Crisp Bottom Vignette for Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F2924]/80 via-transparent to-black/15 pointer-events-none" />

        {/* Category Stamp & Source Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          {place.is_hidden_gem ? (
            <span className="px-2.5 py-0.5 rounded-md bg-[#B49252] text-[#0F2924] text-[10px] font-black uppercase tracking-wider shadow-xs">
              Hidden Gem
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-md bg-[#173B32]/90 backdrop-blur-md text-[#EFE5D2] text-[10px] font-bold tracking-wider uppercase border border-[#536B52]/40">
              {safeCategory}
            </span>
          )}
          {visualRes.badgeLabel === "EXACT PLACE PHOTO" ? (
            <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-700/90 text-emerald-100 border border-emerald-400 shadow-xs">
              Verified Photo
            </span>
          ) : visualRes.badgeLabel === "LIVE PLACE PHOTO" ? (
            <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider bg-teal-800/90 text-teal-100 border border-teal-500 shadow-xs">
              Live Photo
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider bg-[#B49252]/90 text-[#0F2924] border border-[#B49252] shadow-xs">
              Editorial Art
            </span>
          )}
        </div>

        {/* Bookmark Action */}
        <button
          onClick={handleToggleSave}
          disabled={saving}
          aria-label="Save Place"
          className="absolute top-3 right-3 p-2 rounded-full bg-[#EFE5D2]/90 backdrop-blur-md text-[#173B32] hover:text-[#B65E3C] hover:scale-110 interactive-btn shadow-xs transition-all"
        >
          <Bookmark className={`w-4 h-4 transition-transform ${isSaved ? "fill-[#B65E3C] text-[#B65E3C] animate-check-pop" : ""}`} />
        </button>

        {/* Bottom Image Overlay: Honest Rating, Distance & Price */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[#EFE5D2] text-xs font-semibold">
          {place.rating !== undefined && place.rating !== null ? (
            <div className="flex items-center gap-1.5 bg-[#0F2924]/75 px-2.5 py-1 rounded-md backdrop-blur-xs border border-white/10">
              <Star className="w-3.5 h-3.5 text-[#B49252] fill-current" />
              <span className="font-bold">{place.rating}</span>
              {place.review_count !== undefined && place.review_count !== null && (
                <span className="text-[#D8DED5]/70 text-[10px]">({place.review_count})</span>
              )}
            </div>
          ) : (
            <div className="bg-[#0F2924]/75 px-2.5 py-1 rounded-md backdrop-blur-xs border border-white/10 text-[11px] text-[#D8DED5]/80">
              {isLive ? "Live POI" : "Curated Sanctuary"}
            </div>
          )}

          <div className="flex items-center gap-1.5">
            {typeof place.distance_km === "number" && (
              <span className="bg-[#0F2924]/75 px-2.5 py-1 rounded-md backdrop-blur-xs text-[#FAF4E8] font-mono text-[10px] border border-white/10 flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5 text-[#B49252]" />
                <span>{place.distance_km} km</span>
              </span>
            )}
            {place.price_level && (
              <span className="bg-[#0F2924]/75 px-2.5 py-1 rounded-md backdrop-blur-xs text-[#EFE5D2] font-mono text-[11px] border border-white/10">
                {place.price_level} {(place.approx_cost ?? 0) > 0 ? `• ₹${place.approx_cost}` : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className={`flex-1 flex flex-col justify-between min-w-0 w-full ${isCompact ? "p-3 sm:p-3.5 space-y-2.5" : "p-4 sm:p-5 space-y-3"}`}>
        <div className="min-w-0 w-full space-y-1">
          <h3 className={`font-serif text-[#173B32] dark:text-[#FAF7F0] group-hover:text-[#B65E3C] transition-colors leading-tight truncate min-w-0 ${
            isCompact ? "text-base font-bold h-5" : "text-base sm:text-lg font-black h-6"
          }`}>
            {place.name}
          </h3>
          <p className={`text-[#20211D]/75 dark:text-[#D8DED5]/75 leading-relaxed font-light min-w-0 line-clamp-2 ${
            isCompact ? "text-[11px] h-8" : "text-xs h-9"
          }`}>
            {place.description || "Authentic destination landmark."}
          </p>
        </div>

        {/* Standardized Travel Note / Field Dispatch Slot (Uniform height prevents any card blowout or shrinking) */}
        <div className={`rounded-xl border flex flex-col justify-center overflow-hidden shrink-0 ${
          isCompact
            ? "h-[46px] p-2 bg-[#EFE5D2]/50 dark:bg-[#172520]/60 border-[#E5D5BA]/70 dark:border-[#2C3B34]"
            : "h-[58px] p-2.5 bg-[#EFE5D2]/70 dark:bg-[#172520]/80 border-[#E5D5BA] dark:border-[#2C3B34]"
        }`}>
          {place.why_vanvas_recommends ? (
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1 font-bold text-[#B65E3C] dark:text-[#E28C68] text-[10px] uppercase tracking-wider shrink-0">
                <Sparkles className="w-3 h-3 text-[#B49252]" />
                <span className="truncate">VANVAS Travel Note</span>
              </div>
              <p className="italic leading-snug text-[#20211D]/85 dark:text-[#FAF7F0]/85 line-clamp-1 text-[11px]">
                &ldquo;{place.why_vanvas_recommends}&rdquo;
              </p>
            </div>
          ) : (safeCategory.toLowerCase().includes("food") || safeCategory.toLowerCase().includes("caf") || safeCategory.toLowerCase().includes("restaurant")) ? (
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider shrink-0">
                <span className="truncate">📜 Dining Dispatch</span>
                <span className="text-[9px] font-mono text-[#536B52] dark:text-[#A8B5A0]">{place.data_state || "VERIFIED"}</span>
              </div>
              <p className="leading-snug text-[#20211D]/80 dark:text-[#D8DED5]/80 line-clamp-1 text-[11px]">
                {place.menu_available && place.menu_url ? "Official menu & seasonal specials available" : "Curated regional culinary & tea stop"}
              </p>
            </div>
          ) : (
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1 font-bold text-[#536B52] dark:text-[#A8B5A0] text-[10px] uppercase tracking-wider shrink-0">
                <MapPin className="w-3 h-3 text-[#B49252]" />
                <span className="truncate">Field Dispatch</span>
              </div>
              <p className="italic leading-snug text-[#20211D]/80 dark:text-[#D8DED5]/80 line-clamp-1 text-[11px]">
                Curated Himalayan landmark in {destinationName || "the region"}
              </p>
            </div>
          )}
        </div>

        {/* Footer Meta: Strictly Pinned to Bottom */}
        <div className={`mt-auto flex items-center justify-between border-t border-[#E5D5BA] dark:border-[#2C3B34] text-[#536B52] dark:text-[#A8B5A0] shrink-0 ${
          isCompact ? "pt-2 text-[10px]" : "pt-2.5 text-[11px]"
        }`}>
          <div className="flex items-center gap-1.5 truncate mr-2">
            <Clock className={`w-3.5 h-3.5 shrink-0 ${place.is_open_now === true ? "text-emerald-600 dark:text-emerald-400" : place.is_open_now === false ? "text-[#7B4D36] dark:text-[#E28C68]" : "text-[#B65E3C] dark:text-[#E28C68]"}`} />
            {place.is_open_now === true ? (
              <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                Open Now
              </span>
            ) : place.is_open_now === false ? (
              <span className="font-semibold text-[#7B4D36] dark:text-[#E28C68]">
                Closed Now
              </span>
            ) : (
              <span className="text-[#536B52] dark:text-[#A8B5A0] truncate">
                {place.opening_time ? `${place.opening_time} - ${place.closing_time || "Close"}` : "Hours on arrival"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onPlanPlace) {
                  onPlanPlace(place);
                } else {
                  const targetDest = destinationName || place.destination_id || "";
                  window.location.href = `/plan?destination=${encodeURIComponent(targetDest)}&place=${encodeURIComponent(place.name)}`;
                }
              }}
              className="px-2.5 py-1 rounded-md bg-[#173B32] hover:bg-[#173B32]/90 text-[#EFE5D2] font-semibold text-[11px] flex items-center gap-1 transition-colors shadow-2xs"
              title={`Plan a trip visiting ${place.name}`}
            >
              <span>Plan</span>
            </button>
            <span className="text-[#B65E3C] dark:text-[#E28C68] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-xs">
              <span>Explore</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
