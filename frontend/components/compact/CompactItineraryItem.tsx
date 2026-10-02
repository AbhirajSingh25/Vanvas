"use client";

import React, { useState } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Lock, Unlock, Navigation, Sparkles } from "lucide-react";
import { ItineraryItem } from "@/types";
import { normalizeItineraryItem } from "@/lib/itineraryNormalizer";

interface CompactItineraryItemProps {
  item: ItineraryItem;
  onToggleStatus?: (itemId: string, currentStatus: string) => void;
  onToggleLock?: (itemId: string, currentLock: boolean) => void;
  onOpenDetails?: (item: ItineraryItem) => void;
}

export const CompactItineraryItem: React.FC<CompactItineraryItemProps> = ({
  item,
  onToggleStatus,
  onToggleLock,
}) => {
  const [expanded, setExpanded] = useState(false);
  const stop = normalizeItineraryItem(item);

  return (
    <div
      className={`rounded-2xl border transition-all ${
        stop.isCompleted
          ? "bg-[#E5D5BA]/40 border-[#E5D5BA] opacity-75"
          : "bg-[#FAF7F0] border-[#E5D5BA] hover:border-[#173B32] shadow-2xs"
      }`}
    >
      {/* Main Scannable Row: TIME -> PLACE -> SHORT PURPOSE */}
      <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
        {/* Checkbox & Time */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onToggleStatus && onToggleStatus(stop.id, stop.isCompleted ? "completed" : "upcoming")}
            className="text-[#173B32] hover:text-[#B65E3C] transition-colors cursor-pointer"
            aria-label={stop.isCompleted ? "Mark uncompleted" : "Mark completed"}
          >
            {stop.isCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 fill-emerald-100" />
            ) : (
              <Circle className="w-4 h-4 text-[#7B4D36]" />
            )}
          </button>
          <span className="font-mono font-bold text-xs sm:text-sm text-[#173B32]">
            {stop.time}
          </span>
        </div>

        {/* Place & 1 Short Purpose Line */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-serif font-black text-xs sm:text-sm text-[#173B32] truncate">
              {stop.placeName}
            </span>
            <span className="px-1.5 py-0.2 rounded bg-[#173B32]/10 text-[#173B32] text-[8.5px] font-mono font-bold uppercase shrink-0">
              {stop.category}
            </span>
          </div>
          <p className="text-[11px] text-[#7B4D36] truncate mt-0.5 font-medium">
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
