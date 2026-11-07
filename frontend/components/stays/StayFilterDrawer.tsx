"use client";

import React, { useEffect } from "react";
import { X, SlidersHorizontal, Users, Building2, Check, RotateCcw } from "lucide-react";

interface StayFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTravellerProfile: string;
  onTravellerProfileChange: (profile: string) => void;
  selectedStayType: string;
  onStayTypeChange: (type: string) => void;
  travellerProfiles: string[];
  accommodationTypes: string[];
  totalStaysCount?: number;
  filteredCount?: number;
  onResetFilters?: () => void;
}

export const StayFilterDrawer: React.FC<StayFilterDrawerProps> = ({
  isOpen,
  onClose,
  selectedTravellerProfile,
  onTravellerProfileChange,
  selectedStayType,
  onStayTypeChange,
  travellerProfiles,
  accommodationTypes,
  totalStaysCount,
  filteredCount,
  onResetFilters,
}) => {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const hasActiveFilters = selectedTravellerProfile !== "All" || selectedStayType !== "All";

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      {/* Drawer content (bottom sheet on mobile, modal on desktop) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stay-filter-title"
        className="relative z-10 w-full sm:max-w-lg bg-[#FAF7F0] dark:bg-[#15231F] rounded-t-3xl sm:rounded-3xl border-t-2 sm:border-2 border-[#E5D5BA] dark:border-[#2C3B34] shadow-2xl p-6 space-y-6 max-h-[85vh] overflow-y-auto"
      >
        {/* Grab Handle for Mobile */}
        <div className="w-12 h-1.5 bg-[#E5D5BA] dark:bg-[#2C3B34] rounded-full mx-auto sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5D5BA] dark:border-[#2C3B34] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#EFE5D2] dark:bg-[#1C2E27] text-[#173B32] dark:text-[#B49252]">
              <SlidersHorizontal className="w-5 h-5 text-[#B65E3C]" />
            </div>
            <div>
              <h3 id="stay-filter-title" className="font-serif font-black text-xl text-[#173B32] dark:text-[#FAF7F0]">
                Filter Stays &amp; Sanctuaries
              </h3>
              <p className="text-xs text-[#7B4D36] dark:text-[#C5A898] font-sans">
                {filteredCount !== undefined ? `Showing ${filteredCount} of ${totalStaysCount || filteredCount} properties` : "Customise by traveller & style"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[#7B4D36] dark:text-[#C5A898] transition-colors cursor-pointer"
            aria-label="Close filters"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Section 1: Traveller Profile */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[#7B4D36] dark:text-[#C5A898]">
            <span className="font-bold flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-[#173B32] dark:text-[#FAF7F0]">
              <Users className="w-4 h-4 text-[#B65E3C]" />
              <span>Traveller Profile</span>
            </span>
            <span className="text-[11px] font-mono text-[#B49252] font-semibold">
              {selectedTravellerProfile}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {travellerProfiles.map((profile) => {
              const isActive = selectedTravellerProfile === profile;
              return (
                <button
                  key={profile}
                  type="button"
                  onClick={() => onTravellerProfileChange(profile)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all flex items-center justify-between gap-1 cursor-pointer ${
                    isActive
                      ? "bg-[#173B32] text-[#EFE5D2] dark:bg-[#B49252] dark:text-[#0F2924] shadow-xs"
                      : "bg-[#EFE5D2]/70 dark:bg-[#1C2E27] text-[#7B4D36] dark:text-[#EAE6DF] hover:bg-[#EFE5D2] dark:hover:bg-[#253D34] border border-[#E5D5BA]/70 dark:border-[#2C3B34]"
                  }`}
                >
                  <span className="truncate">{profile}</span>
                  {isActive && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Section 2: Accommodation Style */}
        <div className="space-y-3 pt-3 border-t border-[#E5D5BA]/60 dark:border-[#2C3B34]">
          <div className="flex items-center justify-between text-xs text-[#7B4D36] dark:text-[#C5A898]">
            <span className="font-bold flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-[#173B32] dark:text-[#FAF7F0]">
              <Building2 className="w-4 h-4 text-[#B65E3C]" />
              <span>Accommodation Style</span>
            </span>
            <span className="text-[11px] font-mono text-[#B65E3C] font-semibold">
              {selectedStayType}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {accommodationTypes.map((type) => {
              const isActive = selectedStayType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onStayTypeChange(type)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all flex items-center justify-between gap-1 cursor-pointer ${
                    isActive
                      ? "bg-[#B65E3C] text-white dark:bg-[#E28C68] dark:text-[#111A16] shadow-xs"
                      : "bg-[#EFE5D2]/70 dark:bg-[#1C2E27] text-[#7B4D36] dark:text-[#EAE6DF] hover:bg-[#EFE5D2] dark:hover:bg-[#253D34] border border-[#E5D5BA]/70 dark:border-[#2C3B34]"
                  }`}
                >
                  <span className="truncate">{type}</span>
                  {isActive && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#E5D5BA] dark:border-[#2C3B34]">
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-4 py-2.5 rounded-xl border border-[#E5D5BA] dark:border-[#2C3B34] text-[#7B4D36] dark:text-[#C5A898] hover:bg-black/5 dark:hover:bg-white/5 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          ) : (
            <span className="text-xs font-mono text-[#7B4D36]/60 dark:text-[#C5A898]/60">Default filters</span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex-1 max-w-[200px] px-6 py-2.5 rounded-xl bg-[#173B32] dark:bg-[#B49252] text-[#EFE5D2] dark:text-[#0F2924] font-bold text-xs uppercase tracking-wider text-center cursor-pointer shadow-md active:scale-98 transition-all"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

