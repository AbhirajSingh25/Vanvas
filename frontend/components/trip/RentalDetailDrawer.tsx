"use client";

import React, { useEffect } from "react";
import {
  Bike, MapPin, Clock, ExternalLink, X, Navigation,
  ShieldCheck, AlertCircle, Info, Fuel
} from "lucide-react";
import { RentalOption } from "@/types";

interface RentalDetailDrawerProps {
  rental: RentalOption | null;
  isOpen: boolean;
  onClose: () => void;
  destinationName?: string;
}

export const RentalDetailDrawer: React.FC<RentalDetailDrawerProps> = ({
  rental,
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

  if (!isOpen || !rental) return null;

  const mapsQuery = encodeURIComponent(`${rental.provider_name || rental.vehicle_name}, ${rental.location || destinationName || ""}`);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rental-drawer-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#0F2924]/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-slideUp flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Header */}
        <div className="p-4 sm:p-5 bg-[#173B32] text-[#FAF4E8] flex items-center justify-between border-b border-[#243E36]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B65E3C] text-[#FAF4E8] flex items-center justify-center shrink-0">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9.5px] font-mono font-bold text-[#B49252] uppercase block tracking-wider">
                {rental.vehicle_type || "MOBILITY"} · {rental.provider_name || "VERIFIED GARAGE"}
              </span>
              <h3 id="rental-drawer-title" className="font-serif font-black text-lg text-[#FAF4E8] truncate">
                {rental.vehicle_name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close rental details"
            className="p-1.5 rounded-full text-[#D8DED5] hover:bg-[#20453B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto font-mono text-xs text-[#173B32]">
          {/* Status & Pricing Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-white border border-[#E5D5BA]">
              <span className="text-[9px] uppercase font-bold text-[#7B4D36] block">DAILY RATE BASIS</span>
              <div className="text-sm font-bold text-[#173B32] mt-0.5">
                {rental.price_per_day ? `₹${rental.price_per_day.toLocaleString()}` : "Price not available"}
              </div>
              <div className="text-[10px] text-[#7B4D36]">
                {rental.price_per_day ? "/ day · estimated rate" : "Quote on inquiry"}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-[#E5D5BA]">
              <span className="text-[9px] uppercase font-bold text-[#7B4D36] block">SECURITY DEPOSIT</span>
              <div className="text-sm font-bold text-[#173B32] mt-0.5">
                ₹1,000 – ₹2,000
              </div>
              <div className="text-[10px] text-[#7B4D36]">
                Original ID + refundable
              </div>
            </div>
          </div>

          {/* Pickup Location */}
          <div className="p-3 rounded-2xl bg-white border border-[#E5D5BA] flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#B65E3C] shrink-0 mt-0.5" />
              <div>
                <span className="text-[9px] uppercase font-bold text-[#7B4D36] block">PICKUP POINT</span>
                <p className="font-sans text-xs text-[#173B32] font-medium leading-relaxed">
                  {rental.location || `${destinationName || "Mountain valley rental hub"}`}
                </p>
                <span className="text-[10px] text-[#7B4D36]">Provider: {rental.provider_name || "Authorized valley partner"}</span>
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

          {/* Verification / Requirements Checklist */}
          <div className="p-3 rounded-2xl bg-[#EFE5D2]/70 border border-[#E5D5BA] space-y-1.5">
            <span className="text-[9px] uppercase font-bold text-[#7B4D36] block">REQUIREMENTS FOR PICKUP</span>
            <ul className="space-y-1 text-[11px] font-sans text-[#173B32]">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Valid Driving License (2-wheeler)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Government Photo ID (Aadhaar / Passport)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Helmets provided by garage</span>
              </li>
            </ul>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col gap-2">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-2xl bg-[#173B32] hover:bg-[#20453B] text-[#FAF4E8] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5 text-[#B49252]" />
              <span>Find Rental Garage on Map</span>
            </a>

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
