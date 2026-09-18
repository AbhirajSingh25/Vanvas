"use client";

import React, { useEffect } from "react";
import { Star, Clock, MapPin, Sparkles, ExternalLink, Bookmark, X, PlusCircle, Compass, Phone } from "lucide-react";
import { Place } from "@/types";
import { TravelStamp } from "@/components/ui/TravelStamp";
import { VanvasImage } from "@/components/ui/VanvasImage";
import { resolvePlaceArtwork } from "@/lib/placeVisualResolver";

interface PlaceModalProps {
  place: Place | null;
  destinationName?: string;
  isOpen: boolean;
  onClose: () => void;
  onAddToTrip?: (place: Place) => void;
}

export const PlaceModal: React.FC<PlaceModalProps> = ({ place, destinationName = "", isOpen, onClose, onAddToTrip }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !place) return null;

  const safeCategory = typeof place.category === "string" && place.category ? place.category : "Place";
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#0F2924]/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-[#EFE5D2] border-2 border-[#E5D5BA] rounded-t-3xl sm:rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-scaleUp flex flex-col max-h-[90vh] sm:max-h-[88vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Artwork */}
        <div className="relative h-60 sm:h-64 w-full bg-[#173B32] overflow-hidden">
          <VanvasImage
            src={visualRes.imageUrl}
            fallbackSrc={visualRes.fallbackUrl}
            alt={destinationName ? `${place.name} in ${destinationName}` : place.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F2924]/90 via-[#0F2924]/30 to-transparent pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close Modal"
            className="absolute top-4 right-4 p-2 rounded-full bg-[#0F2924]/70 text-[#EFE5D2] hover:bg-[#B65E3C] transition-all border border-white/20"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badges & Title */}
          <div className="absolute bottom-4 left-5 right-5 text-[#EFE5D2]">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#173B32] text-[#EFE5D2] text-[10px] font-bold uppercase tracking-wider border border-[#536B52]">
                {safeCategory}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider ${
                  isLive
                    ? "bg-emerald-600 text-white border border-emerald-400/40"
                    : visualRes.tier === "exact_place"
                    ? "bg-[#B49252] text-[#0F2924] border border-[#B49252]"
                    : visualRes.tier === "destination_category"
                    ? "bg-[#173B32] text-[#FAF4E8] border border-[#536B52]"
                    : "bg-[#7B4D36] text-[#FAF4E8] border border-[#7B4D36]"
                }`}
              >
                {visualRes.badgeLabel}
              </span>
              {place.is_must_visit && (
                <span className="px-2.5 py-0.5 rounded-md bg-[#B65E3C] text-[#EFE5D2] text-[10px] font-black uppercase tracking-wider">
                  Must Visit
                </span>
              )}
              {place.is_hidden_gem && (
                <span className="px-2.5 py-0.5 rounded-md bg-[#B49252] text-[#0F2924] text-[10px] font-black uppercase tracking-wider">
                  Hidden Gem
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-black">{place.name}</h2>
          </div>
        </div>

        {/* Content Body: Journal Page */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Quick stats strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-[#E5D5BA]/60 border border-[#E5D5BA] text-xs">
            {place.rating !== undefined && place.rating !== null ? (
              <div className="flex items-center gap-1.5 font-bold text-[#173B32]">
                <Star className="w-4 h-4 text-[#B49252] fill-current" />
                <span>{place.rating} / 5.0</span>
                {place.review_count !== undefined && place.review_count !== null && (
                  <span className="text-[#7B4D36] font-normal">({place.review_count} reviews)</span>
                )}
              </div>
            ) : (
              <div className="text-[#7B4D36] italic text-xs">
                {isLive ? "Live Open POI" : "Curated Sanctuary Landmark"}
              </div>
            )}

            {place.opening_time && (
              <div className="flex items-center gap-1 text-[#7B4D36]">
                <Clock className="w-3.5 h-3.5 text-[#B65E3C]" />
                <span>{place.opening_time} {place.closing_time ? `- ${place.closing_time}` : ""}</span>
              </div>
            )}

            {typeof place.distance_km === "number" && (
              <div className="flex items-center gap-1 text-[#173B32] font-mono">
                <MapPin className="w-3.5 h-3.5 text-[#B65E3C]" />
                <span>{place.distance_km} km away</span>
              </div>
            )}

            {place.price_level && (
              <div className="font-bold text-[#173B32] font-mono">
                {place.price_level} {(place.approx_cost ?? 0) > 0 ? `• ₹${place.approx_cost}` : ""}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-xs uppercase tracking-widest text-[#7B4D36]">
              स्थान परिचय • Field Notes
            </h4>
            <p className="text-[#20211D]/85 leading-relaxed text-sm font-light">
              {place.description || "Authentic destination landmark."}
            </p>
            {visualRes.visualDescription && (
              <p className="text-xs text-[#536B52] italic pt-1 border-t border-[#E5D5BA]/50">
                Visual Identity: {visualRes.visualDescription}
              </p>
            )}
          </div>

          {/* VANVAS Note */}
          {place.why_vanvas_recommends && (
            <div className="p-4 rounded-2xl bg-[#FAF7F0] border-l-4 border-l-[#B65E3C] border border-[#E5D5BA] space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-1.5 font-bold text-xs text-[#B65E3C] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#B49252]" />
                <span>VANVAS Explorer Note</span>
              </div>
              <p className="text-xs text-[#173B32] leading-relaxed italic font-serif">
                &ldquo;{place.why_vanvas_recommends}&rdquo;
              </p>
            </div>
          )}

          {/* Address, Phone, Website & Tags */}
          <div className="space-y-2.5 pt-2 border-t border-[#E5D5BA] text-xs text-[#536B52]">
            {place.address && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#B65E3C] shrink-0 mt-0.5" />
                <span className="text-[#20211D]/80">{place.address}</span>
              </div>
            )}
            {place.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#B65E3C]" />
                <span className="font-bold text-[#7B4D36]">Phone:</span>
                <a href={`tel:${place.phone}`} className="text-[#173B32] underline hover:text-[#B65E3C]">
                  {place.phone}
                </a>
              </div>
            )}
            {place.website && (
              <div className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 text-[#B65E3C]" />
                <span className="font-bold text-[#7B4D36]">Website:</span>
                <a
                  href={place.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#173B32] underline hover:text-[#B65E3C] flex items-center gap-1"
                >
                  <span>Visit Official Website</span>
                </a>
              </div>
            )}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(place.tags || "").split(",").filter(Boolean).map((tag, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-md bg-[#FAF7F0] border border-[#E5D5BA] text-[11px] text-[#173B32] font-mono">
                  #{tag.trim()}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E5D5BA] bg-[#E5D5BA]/40 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="text-xs font-bold text-[#7B4D36] hover:text-[#173B32] uppercase tracking-wider px-2"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            {onAddToTrip && (
              <button
                onClick={() => {
                  onAddToTrip(place);
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#B49252]" />
                <span>Add to Journey</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
