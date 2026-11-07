"use client";

import React from "react";
import { Utensils, MapPin, IndianRupee } from "lucide-react";
import { CulinaryExperience, Place } from "@/types";

interface FoodCompactCardProps {
  dish?: CulinaryExperience;
  diningSpot?: Place;
  onSelect?: () => void;
}

export const FoodCompactCard: React.FC<FoodCompactCardProps> = ({ dish, diningSpot, onSelect }) => {
  if (dish) {
    const isVeg = dish.dietary.toLowerCase().includes("veg");
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (onSelect) onSelect();
          }
        }}
        className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F0] dark:bg-[#15231F] border-2 border-[#E5D5BA] dark:border-[#2C3B34] hover:border-[#173B32] dark:hover:border-[#B49252] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 h-full cursor-pointer text-left min-w-0 w-full"
      >
        <div className="space-y-2 min-w-0 w-full">
          <div className="flex items-start justify-between gap-2 min-w-0">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B65E3C] dark:text-[#E28C68] block truncate">
                {dish.category}
              </span>
              <h4 className="font-serif font-black text-base text-[#173B32] dark:text-[#FAF7F0] leading-snug truncate">
                {dish.dish_name}
              </h4>
              {dish.hindi_name && (
                <span className="font-devanagari text-xs text-[#B49252] font-semibold block truncate">
                  {dish.hindi_name}
                </span>
              )}
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 ${
                isVeg
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                  : "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
              }`}
            >
              {dish.dietary}
            </span>
          </div>

          <p className="text-xs text-[#20211D]/85 dark:text-[#FAF7F0]/80 font-serif leading-relaxed line-clamp-2">
            {dish.flavor_profile}
          </p>

          {dish.origin_story && (
            <p className="text-[11px] text-[#7B4D36] dark:text-[#C5A898] font-serif italic line-clamp-1">
              &quot;{dish.origin_story}&quot;
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-[#E5D5BA]/80 dark:border-[#2C3B34] flex items-center justify-between text-xs font-mono">
          <span className="text-[#7B4D36] dark:text-[#C5A898] text-[11px]">Benchmark:</span>
          <span className="font-bold text-[#B65E3C] dark:text-[#E28C68]">~₹{dish.typical_price_inr}</span>
        </div>
      </div>
    );
  }

  if (diningSpot) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (onSelect) onSelect();
          }
        }}
        className="p-4 rounded-2xl bg-[#FAF7F0] dark:bg-[#15231F] border-2 border-[#E5D5BA] dark:border-[#2C3B34] hover:border-[#173B32] dark:hover:border-[#B49252] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-2 h-full cursor-pointer text-left min-w-0 w-full"
      >
        <div className="space-y-1.5 min-w-0 w-full">
          <div className="flex items-center justify-between min-w-0">
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-[#EFE5D2] dark:bg-[#253D34] text-[#7B4D36] dark:text-[#C5A898] truncate">
              {diningSpot.category || "Dining Spot"}
            </span>
            {diningSpot.rating && (
              <span className="text-[10px] font-mono font-bold text-[#B49252] shrink-0">
                ★ {diningSpot.rating}
              </span>
            )}
          </div>
          <h4 className="font-serif font-bold text-sm text-[#173B32] dark:text-[#FAF7F0] truncate min-w-0">
            {diningSpot.name}
          </h4>
          <p className="text-[11px] text-[#7B4D36] dark:text-[#C5A898] line-clamp-2 leading-snug min-w-0">
            {diningSpot.description || "Authentic regional dining experience."}
          </p>
        </div>

        <div className="pt-1.5 border-t border-[#E5D5BA]/60 dark:border-[#2C3B34] flex items-center justify-between text-[11px] font-mono text-[#7B4D36] dark:text-[#C5A898]">
          <span className="flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 text-[#B65E3C]" />
            <span>{diningSpot.address?.split(",")[0] || "Local Hub"}</span>
          </span>
          <span className="text-[#B65E3C] dark:text-[#E28C68] font-bold">Details →</span>
        </div>
      </div>
    );
  }

  return null;
};

