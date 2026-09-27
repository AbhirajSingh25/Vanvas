"use client";

import React from "react";
import { X, MapPin, Phone, Globe, Navigation, ShieldCheck, BedDouble, Star, Clock, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { Hotel } from "@/types";
import { VanvasImage } from "@/components/ui/VanvasImage";

interface StayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotel: Hotel | null;
}

export function StayDetailModal({
  isOpen,
  onClose,
  hotel
}: StayDetailModalProps) {
  if (!isOpen || !hotel) return null;

  const phone = (hotel as any).phone || (hotel as any).contact_phone;
  const website = (hotel as any).website || (hotel as any).official_url;
  const bookingUrl = hotel.booking_url;
  const isValidBooking = bookingUrl && !bookingUrl.includes("booking.vanvas.com") && !bookingUrl.includes("example.com") && bookingUrl.startsWith("http");

  const amenitiesList = hotel.amenities ? hotel.amenities.split(",").map(a => a.trim()).filter(Boolean) : [];
  const directionsUrl = hotel.latitude && hotel.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${hotel.latitude},${hotel.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.name + " " + hotel.address)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Hero Image / Header */}
        <div className="relative h-48 sm:h-56 bg-[#173B32] overflow-hidden shrink-0">
          <VanvasImage
            src={hotel.image_url || "/images/places/universal/stay.webp"}
            alt={hotel.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#E05A2B] text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                {hotel.hotel_style || "Sanctuary"}
              </span>
              {hotel.rating && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold">
                  <Star className="w-3 h-3 text-[#B49252] fill-[#B49252]" />
                  {hotel.rating.toFixed(1)}
                </span>
              )}
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold leading-tight">
              {hotel.name}
            </h3>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Price & Badge */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-[#D8CBB2]">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#20211D]/60 font-bold block">
                Estimated Rate
              </span>
              <p className="text-xl font-bold text-[#173B32]">
                ₹{hotel.price_per_night ? hotel.price_per_night.toLocaleString() : "—"}{" "}
                <span className="text-xs font-normal text-[#20211D]/60">/ night</span>
              </p>
            </div>
            {hotel.badge && (
              <span className="px-3 py-1 rounded-full bg-[#173B32]/10 text-[#173B32] text-xs font-bold">
                {hotel.badge}
              </span>
            )}
          </div>

          {/* Location & Times */}
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/70 border border-[#D8CBB2]">
              <MapPin className="w-4 h-4 text-[#E05A2B] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#173B32] block">Address</span>
                <span className="text-[#20211D]/75">{hotel.address}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/70 border border-[#D8CBB2]">
                <Clock className="w-4 h-4 text-[#B49252] shrink-0" />
                <div>
                  <span className="text-[10px] text-[#20211D]/60 uppercase font-mono block">Check-In</span>
                  <span className="font-bold text-[#173B32]">{hotel.check_in_time || "12:00 PM"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/70 border border-[#D8CBB2]">
                <Clock className="w-4 h-4 text-[#B49252] shrink-0" />
                <div>
                  <span className="text-[10px] text-[#20211D]/60 uppercase font-mono block">Check-Out</span>
                  <span className="font-bold text-[#173B32]">{hotel.check_out_time || "11:00 AM"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Amenities */}
          {amenitiesList.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#173B32] uppercase tracking-wider block">
                Sanctuary Amenities
              </span>
              <div className="flex flex-wrap gap-1.5">
                {amenitiesList.map((amenity, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-xl bg-white border border-[#D8CBB2] text-[11px] text-[#20211D]/80 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3 h-3 text-[#173B32]" />
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Solo Travel Note */}
          <div className="p-4 rounded-2xl bg-[#173B32]/5 border border-[#173B32]/10 space-y-1.5 text-xs text-[#173B32]">
            <span className="font-bold block uppercase text-[10px] tracking-wider">
              Solo Traveler Note
            </span>
            <p className="text-[11px] leading-relaxed text-[#173B32]/90">
              Verified for quietude, reliable hot water, and welcoming common areas. Ideal for reading, creative work, and relaxing after mountain or coastal days.
            </p>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-white border-t border-[#D8CBB2] flex flex-wrap items-center gap-2">
          {isValidBooking ? (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[140px] px-4 py-3 rounded-2xl bg-[#E05A2B] hover:bg-[#C8491D] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
            >
              <span>Check Availability</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          ) : phone ? (
            <a
              href={`tel:${phone}`}
              className="flex-1 min-w-[140px] px-4 py-3 rounded-2xl bg-[#173B32] hover:bg-[#122E27] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
            >
              <Phone className="w-4 h-4" />
              <span>Call Front Desk</span>
            </a>
          ) : (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[140px] px-4 py-3 rounded-2xl bg-[#173B32] hover:bg-[#122E27] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
            >
              <Navigation className="w-4 h-4" />
              <span>Contact via Maps</span>
            </a>
          )}

          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-3 rounded-2xl bg-[#FAF7F0] border border-[#D8CBB2] hover:bg-[#E5D5BA]/50 text-[#173B32] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <Navigation className="w-4 h-4 text-[#E05A2B]" />
            <span>Directions</span>
          </a>

          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-2xl bg-[#FAF7F0] border border-[#D8CBB2] hover:bg-[#E5D5BA]/50 text-[#173B32] text-xs font-bold transition-colors cursor-pointer"
              title="Visit Official Website"
            >
              <Globe className="w-4 h-4" />
            </a>
          )}
        </div>

      </div>
    </div>
  );
}
