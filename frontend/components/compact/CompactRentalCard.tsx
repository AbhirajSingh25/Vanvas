"use client";

import React, { useState } from "react";
import { ArrowRight, Bike } from "lucide-react";
import { RentalOption } from "@/types";
import { RentalDetailDrawer } from "@/components/trip/RentalDetailDrawer";

interface CompactRentalCardProps {
  rental: RentalOption;
  onSelect?: (rental: RentalOption) => void;
  destinationName?: string;
}

export const CompactRentalCard: React.FC<CompactRentalCardProps> = ({
  rental,
  onSelect,
  destinationName = "",
}) => {
  const [internalDrawerOpen, setInternalDrawerOpen] = useState(false);

  const handleClick = () => {
    if (onSelect) {
      onSelect(rental);
    } else {
      setInternalDrawerOpen(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={`View rental details for ${rental.vehicle_name}`}
        className="w-full group bg-[#FAF7F0] rounded-2xl border-2 border-[#E5D5BA] hover:border-[#173B32] p-3 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#173B32] min-h-[84px] active:scale-[0.99]"
      >
        <div className="w-12 h-12 rounded-xl bg-[#B65E3C] text-[#FAF7F0] flex items-center justify-center shrink-0">
          <Bike className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="text-[9.5px] font-mono font-bold text-[#7B4D36] uppercase tracking-wider truncate">
            {rental.vehicle_type || "Rental"} · {rental.provider_name || "Verified Garage"}
          </div>

          <h4 className="font-serif font-black text-sm text-[#173B32] group-hover:text-[#B65E3C] transition-colors leading-tight truncate">
            {rental.vehicle_name}
          </h4>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="font-mono font-bold text-[#173B32]">
              {rental.price_per_day ? (
                <>
                  ₹{rental.price_per_day.toLocaleString()} <span className="font-normal text-[10px] text-[#7B4D36]">/ day</span>
                </>
              ) : (
                <span className="font-sans font-medium text-[10.5px] text-[#7B4D36]">Price not available</span>
              )}
            </span>
            <span className="text-[10px] text-[#536B52] truncate">
              {rental.location || "Pickup point ready"}
            </span>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1 text-[#B65E3C] group-hover:translate-x-0.5 transition-transform text-xs font-bold">
          <span>Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </button>

      {/* Built-in fallback drawer if parent does not provide onSelect handler */}
      {!onSelect && (
        <RentalDetailDrawer
          rental={rental}
          isOpen={internalDrawerOpen}
          onClose={() => setInternalDrawerOpen(false)}
          destinationName={destinationName}
        />
      )}
    </>
  );
};
