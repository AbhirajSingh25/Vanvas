"use client";

import React from "react";
import { X, MapPin, Phone, MessageCircle, Globe, Navigation, ShieldCheck, Clock, AlertCircle } from "lucide-react";
import { RentalOption } from "@/types";
import { VehicleArtwork } from "@/components/ui/VehicleArtwork";

interface MobilityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  rental: RentalOption | null;
}

export function MobilityDetailModal({
  isOpen,
  onClose,
  rental
}: MobilityDetailModalProps) {
  if (!isOpen || !rental) return null;

  const phone = (rental as any).phone || (rental as any).contact_phone;
  const whatsapp = (rental as any).whatsapp;
  const website = (rental as any).website || (rental as any).booking_url;
  const address = rental.location || rental.address || "Local Rental Operator";
  const deposit = rental.deposit_amount ? `₹${rental.deposit_amount.toLocaleString()}` : "Contact for deposit policy";
  const hours = rental.opening_hours || "08:00 AM – 08:00 PM";

  const directionsUrl = rental.latitude && rental.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${rental.latitude},${rental.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rental.provider_name + " " + address)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-white border-b border-[#D8CBB2] flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FAF7F0] border border-[#D8CBB2] flex items-center justify-center p-2 text-[#173B32] shrink-0">
              <VehicleArtwork
                type={rental.vehicle_type}
                name={rental.vehicle_name}
                destination={rental.location || (rental as any).destination_name || (rental as any).destination}
                imageUrl={rental.image_url}
                className="w-full h-full object-cover"
                showBadge={false}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#E05A2B]/10 text-[#E05A2B] text-[10px] font-mono font-bold uppercase tracking-wider">
                  {rental.vehicle_type || "Rental"}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-[#173B32] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#173B32]" />
                  Verified Operator
                </span>
              </div>
              <h3 className="font-serif text-xl font-bold text-[#173B32] mt-1">
                {rental.provider_name}
              </h3>
              <p className="text-xs text-[#20211D]/70 font-medium">
                {rental.vehicle_name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#20211D]/60 hover:text-[#173B32] hover:bg-[#FAF7F0] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Price & Deposit Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-[#D8CBB2] space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#20211D]/60 font-bold">
                Daily Rental Rate
              </span>
              <p className="text-lg font-bold text-[#173B32]">
                {rental.price_per_day ? `₹${rental.price_per_day.toLocaleString()}/day` : "Inquire at counter"}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#D8CBB2] space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#20211D]/60 font-bold">
                Security Deposit
              </span>
              <p className="text-sm font-bold text-[#20211D]/80">
                {deposit}
              </p>
            </div>
          </div>

          {/* Location & Hours */}
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/70 border border-[#D8CBB2]">
              <MapPin className="w-4 h-4 text-[#E05A2B] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#173B32] block">Service Location</span>
                <span className="text-[#20211D]/75">{address}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/70 border border-[#D8CBB2]">
              <Clock className="w-4 h-4 text-[#B49252] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#173B32] block">Operating Hours</span>
                <span className="text-[#20211D]/75">{hours}</span>
              </div>
            </div>
          </div>

          {/* Rental Field Advice */}
          <div className="p-4 rounded-2xl bg-[#173B32]/5 border border-[#173B32]/10 space-y-1.5 text-xs text-[#173B32]">
            <span className="font-bold block uppercase text-[10px] tracking-wider text-[#173B32]">
              VANVAS Solo Field Note
            </span>
            <p className="text-[11px] leading-relaxed text-[#173B32]/90">
              Always carry an original government Driving License and photo ID. Inspect tires, disc brakes, and horn before departing. Helmets are mandatory on Indian mountain and coastal highways.
            </p>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-white border-t border-[#D8CBB2] flex flex-wrap items-center gap-2">
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="flex-1 min-w-[130px] px-4 py-3 rounded-2xl bg-[#173B32] hover:bg-[#122E27] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <Phone className="w-4 h-4" />
              <span>Call Front Desk</span>
            </a>
          ) : (
            <div className="flex-1 min-w-[130px] px-3 py-2 text-[11px] text-[#20211D]/60 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-[#B49252]" />
              <span>Contact not published online</span>
            </div>
          )}

          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>
          )}

          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-[130px] px-4 py-3 rounded-2xl bg-[#FAF7F0] border border-[#D8CBB2] hover:bg-[#E5D5BA]/50 text-[#173B32] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <Navigation className="w-4 h-4 text-[#E05A2B]" />
            <span>Get Directions</span>
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
