"use client";

import React, { useState } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Lock, Unlock, Navigation, Sparkles } from "lucide-react";
import { ItineraryItem } from "@/types";
import { normalizeItineraryItem } from "@/lib/itineraryNormalizer";
import { VanvasImage } from "@/components/ui/VanvasImage";
import { resolvePlaceArtwork } from "@/lib/placeVisualResolver";

interface CompactItineraryItemProps {
  item: ItineraryItem;
  destinationName?: string;
  onToggleStatus?: (itemId: string, currentStatus: string) => void;
  onToggleLock?: (itemId: string, currentLock: boolean) => void;
  onOpenDetails?: (item: ItineraryItem) => void;
}

export const CompactItineraryItem: React.FC<CompactItineraryItemProps> = ({
  item,
  destinationName = "",
  onToggleStatus,
  onToggleLock,
}) => {
  const [expanded, setExpanded] = useState(false);
  const stop = normalizeItineraryItem(item);

  const visualRes = resolvePlaceArtwork(
    stop.placeName,
    destinationName,
    stop.category,
    item.image_url,
    false,
    undefined
  );

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${
        stop.isCompleted
          ? "bg-[#E5D5BA]/40 border-[#E5D5BA] opacity-80"
          : "bg-[#FAF7F0] border-[#E5D5BA] hover:border-[#173B32] shadow-2xs"
      }`}
    >
      {/* Main Scannable Row: TIME PILL -> THUMBNAIL -> PLACE -> SHORT PURPOSE */}
      <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
        {/* Checkbox & Time & Small Thumbnail */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            id={`toggle-item-status-${stop.id}`}
            data-testid="toggle-item-status-btn"
            onClick={() => onToggleStatus && onToggleStatus(stop.id, stop.isCompleted ? "completed" : "upcoming")}
            className="text-[#173B32] hover:text-[#B65E3C] transition-all cursor-pointer p-0.5"
            aria-label={stop.isCompleted ? "Mark uncompleted" : "Mark completed"}
          >
            {stop.isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-700 fill-emerald-100" />
            ) : (
              <Circle className="w-5 h-5 text-[#7B4D36] hover:scale-110 transition-transform duration-150" />
            )}
          </button>

          {/* Contextual Visual Thumbnail */}
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-[#E5D5BA] shrink-0 border border-[#E5D5BA]">
            <VanvasImage
              src={visualRes.imageUrl}
              fallbackSrc={visualRes.fallbackUrl}
              alt={stop.placeName}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Place & Time & 1 Short Purpose Line */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono font-bold text-[11px] sm:text-xs text-[#173B32] bg-[#FAF4E8] px-1.5 py-0.2 rounded border border-[#E5D5BA]">
              {stop.time}
            </span>
            <span className="px-1.5 py-0.2 rounded bg-[#173B32]/10 text-[#173B32] text-[8.5px] font-mono font-bold uppercase shrink-0">
              {stop.category}
            </span>
            {stop.travelTimeMins > 0 && (
              <span className="text-[9.5px] font-mono text-[#7B4D36]/80 hidden sm:inline">
                {stop.travelTimeMins}m transit
              </span>
            )}
          </div>

          <h4 className={`font-serif font-black text-xs sm:text-sm text-[#173B32] truncate transition-colors ${
            stop.isCompleted ? "line-through opacity-70" : ""
          }`}>
            {stop.placeName}
          </h4>

          <p className="text-[11px] text-[#7B4D36] truncate font-medium">
            {stop.shortPurpose}
          </p>
        </div>

        {/* Action / Lock / Expand Trigger */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onToggleLock && (
            <button
              type="button"
              onClick={() => onToggleLock(stop.id, stop.isLocked)}
              className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                stop.isLocked ? "text-amber-700" : "text-[#7B4D36]/60 hover:text-[#7B4D36]"
              }`}
              title={stop.isLocked ? "Stop is locked (protected from replanning)" : "Lock stop"}
            >
              {stop.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="px-2 py-1 rounded-lg bg-[#EFE5D2] hover:bg-[#E5D5BA] text-[#173B32] transition-colors text-[10.5px] font-bold flex items-center gap-1 cursor-pointer"
            aria-expanded={expanded}
          >
            <span>{expanded ? "Less" : "Details"}</span>
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3 text-[#B65E3C]" />}
          </button>
        </div>
      </div>

      {/* Progressively Disclosed Structured UI (Compact 2-column metadata row) */}
      {expanded && (
        <div className="px-3.5 pb-3.5 pt-2 border-t border-[#E5D5BA]/80 space-y-2.5 text-xs animate-fadeIn bg-white/40 rounded-b-2xl">
          {stop.whyThisStop && (
            <div className="space-y-0.5">
              <span className="text-[9.5px] font-mono font-bold text-[#B65E3C] uppercase tracking-wider block">
                WHY
              </span>
              <p className="text-[#20211D]/90 text-xs font-serif leading-relaxed">
                {stop.whyThisStop}
              </p>
            </div>
          )}

          {/* Compact 2-column metadata row */}
          <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
            <div className="bg-[#FAF7F0] p-2 rounded-xl border border-[#E5D5BA] flex items-center justify-between">
              <span className="text-[#7B4D36]">
                {stop.time}{stop.endTime ? `–${stop.endTime}` : ` (${stop.durationMins}m)`}
              </span>
              <span className="text-[#173B32] font-bold">{stop.costFormatted}</span>
            </div>
            <div className="bg-[#FAF7F0] p-2 rounded-xl border border-[#E5D5BA] flex items-center justify-between">
              <span className="text-[#7B4D36]">
                {stop.travelTimeMins > 0 ? `${stop.travelTimeMins} min` : "Walking / on-site"}
              </span>
              <span className="text-[#173B32] font-bold">{stop.distanceFormatted}</span>
            </div>
          </div>

          {stop.notes && stop.notes !== stop.whyThisStop && (
            <div className="space-y-0.5 pt-1 border-t border-[#E5D5BA]/40">
              <span className="text-[9.5px] font-mono font-bold text-[#7B4D36] uppercase tracking-wider block">
                NOTES
              </span>
              <p className="text-[#20211D]/80 text-xs leading-relaxed font-light">
                {stop.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
