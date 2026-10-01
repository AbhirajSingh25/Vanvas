"use client";

import React from "react";
import { ArrowRight, BedDouble, Star } from "lucide-react";
import { Hotel } from "@/types";

interface CompactStayCardProps {
  hotel: Hotel;
  onSelect?: (hotel: Hotel) => void;
}

export const CompactStayCard: React.FC<CompactStayCardProps> = ({ hotel, onSelect }) => {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect && onSelect(hotel)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (onSelect) onSelect(hotel);
        }
      }}
      className="group bg-[#FAF7F0] rounded-2xl border-2 border-[#E5D5BA] hover:border-[#173B32] p-3 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 text-left focus:outline-none min-h-[84px]"
    >
      <div className="w-12 h-12 rounded-xl bg-[#173B32] text-[#B49252] flex items-center justify-center shrink-0">
        <BedDouble className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5 text-[9.5px] font-mono font-bold text-[#7B4D36] uppercase tracking-wider">
          <span>{hotel.badge || "Stay"}</span>
          {hotel.rating && (
            <>
              <span>·</span>
              <span className="text-[#B49252] flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 fill-current" />
                {hotel.rating}
              </span>
            </>
          )}
        </div>

        <h4 className="font-serif font-black text-sm text-[#173B32] group-hover:text-[#B65E3C] transition-colors leading-tight truncate">
          {hotel.name}
        </h4>

        <div className="flex items-center gap-2 text-[11px]">
          <span className="font-mono font-bold text-[#B65E3C]">
            {hotel.price_per_night ? `₹${hotel.price_per_night.toLocaleString()}` : "₹2,500"} <span className="font-normal text-[10px] text-[#7B4D36]">/ night</span>
          </span>
          <span className="text-[10px] text-[#536B52] truncate">
            {hotel.address?.split(",")[0] || "Verified Sanctuary"}
          </span>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-1 text-[#B65E3C] group-hover:translate-x-0.5 transition-transform text-xs font-bold">
        <span>Details</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </div>
  );
};
