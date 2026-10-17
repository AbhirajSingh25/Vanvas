"use client";

import React, { useEffect } from "react";
import {
  BedDouble, MapPin, Clock, Star, ExternalLink, X, Navigation,
  ShieldCheck, CheckCircle2, Sparkles, AlertCircle
} from "lucide-react";
import { Hotel } from "@/types";
import { resolveHotelArtwork } from "@/lib/placeVisualResolver";
import { VanvasImage } from "@/components/ui/VanvasImage";

interface StayDetailDrawerProps {
  hotel: Hotel | null;
  isOpen: boolean;
  onClose: () => void;
  destinationName?: string;
}

export const StayDetailDrawer: React.FC<StayDetailDrawerProps> = ({
  hotel,
  isOpen,
  onClose,
  destinationName = "",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !hotel) return null;

  const visual = resolveHotelArtwork({
    propertyName: hotel.name,
    destinationName: destinationName || hotel.address || "",
    hotelStyle: hotel.badge,
    existingImageUrl: hotel.image_url,
  });

  const mapsQuery = encodeURIComponent(`${hotel.name}, ${hotel.address || destinationName || ""}`);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  const isBooked = hotel.badge?.toLowerCase().includes("booked") || false;
  const statusLabel = isBooked ? "BOOKED SANCTUARY" : hotel.badge || "CURATED STAY OPTION";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="stay-drawer-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#0F2924]/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-slideUp flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Visual Hero Image */}
        <div className="relative h-44 sm:h-52 w-full bg-[#173B32] overflow-hidden">
          <VanvasImage
            src={visual.imageUrl}
            fallbackSrc={visual.fallbackUrl}
            alt={hotel.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Status badge & Name */}
          <div className="absolute bottom-3.5 left-4 right-4 text-white space-y-1">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase tracking-wider ${
                isBooked ? "bg-emerald-700 text-white" : "bg-[#B65E3C] text-[#FAF4E8]"
              }`}>
                {statusLabel}
              </span>
              {hotel.rating && (
                <span className="flex items-center gap-0.5 text-xs font-mono font-bold text-amber-300 bg-black/40 px-2 py-0.5 rounded border border-white/10">
                  <Star className="w-3 h-3 fill-current" />
                  {hotel.rating}
                </span>
              )}
            </div>
            <h3 id="stay-drawer-title" className="font-serif font-black text-xl text-[#FAF4E8] truncate">
              {hotel.name}
            </h3>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto font-mono text-xs text-[#173B32]">
          {/* Address & Directions */}
          <div className="p-3 rounded-2xl bg-white border border-[#E5D5BA] flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#B65E3C] shrink-0 mt-0.5" />
              <div>
                <span className="text-[9px] uppercase font-bold text-[#7B4D36] block">LOCATION</span>
                <p className="font-sans text-xs text-[#173B32] font-medium leading-relaxed">
                  {hotel.address || `${destinationName || "Mountain valley location"}`}
                </p>
              </div>
            </div>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-[#EFE5D2] hover:bg-[#E5D5BA] text-[#173B32] text-xs font-bold font-mono flex items-center gap-1 shrink-0 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-[#B65E3C]" />
              <span>Map</span>
            </a>
          </div>

          {/* Check-in, Check-out & Pricing */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-white border border-[#E5D5BA]">
              <span className="text-[9px] uppercase font-bold text-[#7B4D36] block">TIMING</span>
              <div className="font-sans text-xs font-bold text-[#173B32] mt-0.5">
                In: {hotel.check_in_time || "12:00 PM"}
              </div>
              <div className="text-[10px] text-[#7B4D36]">
                Out: {hotel.check_out_time || "11:00 AM"}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-[#E5D5BA]">
              <span className="text-[9px] uppercase font-bold text-[#7B4D36] block">RATE BASIS</span>
              <div className="text-sm font-bold text-[#B65E3C] mt-0.5">
                {hotel.price_per_night ? `₹${hotel.price_per_night.toLocaleString()}` : "Price not available"}
              </div>
              <div className="text-[10px] text-[#7B4D36]">
                {hotel.price_per_night ? "per night · indicative" : "Verify with property"}
              </div>
            </div>
          </div>

          {/* Amenities */}
          {hotel.amenities && (
            <div className="p-3 rounded-2xl bg-[#EFE5D2]/70 border border-[#E5D5BA] space-y-1">
              <span className="text-[9px] uppercase font-bold text-[#7B4D36] block">AMENITIES &amp; FACILITIES</span>
              <p className="font-sans text-xs text-[#173B32] leading-relaxed">
                {hotel.amenities}
              </p>
            </div>
          )}

          {/* Booking / Guidance State */}
          <div className="pt-2 flex flex-col gap-2">
            {hotel.booking_url ? (
              <a
                href={hotel.booking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl bg-[#173B32] hover:bg-[#20453B] text-[#FAF4E8] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <span>View on Booking Provider</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#B49252]" />
              </a>
            ) : (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl bg-[#173B32] hover:bg-[#20453B] text-[#FAF4E8] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5 text-[#B49252]" />
                <span>Get Directions in Google Maps</span>
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-transparent hover:bg-[#EFE5D2] text-[#7B4D36] text-xs font-bold transition-colors cursor-pointer"
            >
              Return to Trip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
