"use client";

import React, { useState } from "react";
import { Star, Clock, Bookmark, MapPin, Sparkles, Compass, ArrowRight } from "lucide-react";
import { Place } from "@/types";
import { api } from "@/lib/api";
import { VanvasImage } from "@/components/ui/VanvasImage";
import { resolvePlaceArtwork } from "@/lib/placeVisualResolver";

interface PlaceCardProps {
  place: Place;
  destinationName?: string;
  onSelect?: (place: Place) => void;
  onBookmarkChange?: (placeId: string, isSaved: boolean) => void;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({ place, destinationName = "", onSelect, onBookmarkChange }) => {
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
      className="group bg-[#FAF7F0] rounded-2xl border border-[#E5D5BA] hover:border-[#173B32]/50 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col relative focus:outline-none focus:ring-2 focus:ring-[#173B32]/30"
    >
      {/* Image Container */}
      <div className="relative h-52 w-full overflow-hidden bg-[#E5D5BA]">
        <VanvasImage
          src={visualRes.imageUrl}
          fallbackSrc={visualRes.fallbackUrl}
          alt={destinationName ? `${place.name} in ${destinationName}` : place.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />

        {/* Crisp Bottom Vignette for Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F2924]/80 via-transparent to-black/15 pointer-events-none" />

        {/* Category Stamp & Source Badge */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
          <span className="px-2.5 py-0.5 rounded-md bg-[#173B32]/90 backdrop-blur-md text-[#EFE5D2] text-[10px] font-bold tracking-wider uppercase border border-[#536B52]/40">
            {safeCategory}
          </span>
          <span
            className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider ${
              isLive
                ? "bg-emerald-600/90 text-white border border-emerald-400/40"
                : visualRes.tier === "exact_place"
                ? "bg-[#B49252]/90 text-[#0F2924] border border-[#B49252]"
                : "bg-[#7B4D36]/90 text-[#FAF4E8] border border-[#7B4D36]"
            }`}
          >
            {visualRes.badgeLabel}
          </span>
          {place.is_hidden_gem && (
            <span className="px-2 py-0.5 rounded-md bg-[#B49252] text-[#0F2924] text-[10px] font-black uppercase tracking-wider shadow-sm">
              Hidden Gem
            </span>
          )}
        </div>

        {/* Bookmark Action */}
        <button
          onClick={handleToggleSave}
          disabled={saving}
          aria-label="Save Place"
          className="absolute top-3 right-3 p-2 rounded-full bg-[#EFE5D2]/90 backdrop-blur-md text-[#173B32] hover:text-[#B65E3C] hover:scale-110 shadow-sm transition-all"
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? "fill-[#B65E3C] text-[#B65E3C]" : ""}`} />
        </button>

        {/* Bottom Image Overlay: Honest Rating, Distance & Price */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[#EFE5D2] text-xs font-semibold">
          {place.rating !== undefined && place.rating !== null ? (
            <div className="flex items-center gap-1.5 bg-[#0F2924]/70 px-2.5 py-1 rounded-md backdrop-blur-xs border border-white/10">
              <Star className="w-3.5 h-3.5 text-[#B49252] fill-current" />
              <span className="font-bold">{place.rating}</span>
              {place.review_count !== undefined && place.review_count !== null && (
                <span className="text-[#D8DED5]/70 text-[10px]">({place.review_count})</span>
              )}
            </div>
          ) : (
            <div className="bg-[#0F2924]/70 px-2.5 py-1 rounded-md backdrop-blur-xs border border-white/10 text-[11px] text-[#D8DED5]/80">
              {isLive ? "Live POI" : "Curated Sanctuary"}
            </div>
          )}

          <div className="flex items-center gap-1.5">
            {typeof place.distance_km === "number" && (
              <span className="bg-[#0F2924]/70 px-2 py-1 rounded-md backdrop-blur-xs text-[#FAF4E8] font-mono text-[10px] border border-white/10 flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5 text-[#B49252]" />
                <span>{place.distance_km} km</span>
              </span>
            )}
            {place.price_level && (
              <span className="bg-[#0F2924]/70 px-2.5 py-1 rounded-md backdrop-blur-xs text-[#EFE5D2] font-mono text-[11px] border border-white/10">
                {place.price_level} {(place.approx_cost ?? 0) > 0 ? `• ₹${place.approx_cost}` : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3.5">
        <div>
          <h3 className="font-serif font-black text-lg text-[#173B32] group-hover:text-[#B65E3C] transition-colors leading-snug">
            {place.name}
          </h3>
          <p className="text-xs text-[#20211D]/75 mt-1.5 line-clamp-2 leading-relaxed font-light">
            {place.description || "Authentic destination landmark."}
          </p>
        </div>

        {/* VANVAS Journal Note */}
        {place.why_vanvas_recommends && (
          <div className="p-3 rounded-xl bg-[#EFE5D2]/70 border border-[#E5D5BA] text-[11px] text-[#7B4D36] space-y-1">
            <div className="flex items-center gap-1 font-bold text-[#B65E3C] text-[10px] uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-[#B49252]" />
              <span>VANVAS Travel Note</span>
            </div>
            <p className="italic leading-relaxed text-[#20211D]/85 line-clamp-2">
              &ldquo;{place.why_vanvas_recommends}&rdquo;
            </p>
          </div>
        )}

        {/* Footer Meta */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E5D5BA] text-[11px] text-[#536B52]">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#B65E3C]" />
            <span>{place.opening_time ? `${place.opening_time} - ${place.closing_time || "Close"}` : "Hours not listed"}</span>
          </div>

          <span className="text-[#B65E3C] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            <span>Explore</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};
