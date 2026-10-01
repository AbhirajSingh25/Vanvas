"use client";

import React, { useState } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Navigation, Lock, Unlock, ArrowRight } from "lucide-react";
import { ItineraryItem } from "@/types";

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
  onOpenDetails,
}) => {
  const [expanded, setExpanded] = useState(false);
  const isCompleted = item.status === "completed";

  return (
    <div
      className={`rounded-2xl border transition-all ${
        isCompleted
          ? "bg-[#E5D5BA]/40 border-[#E5D5BA] opacity-75"
          : "bg-[#FAF7F0] border-[#E5D5BA] hover:border-[#173B32] shadow-2xs"
      }`}
    >
      {/* Main Scannable Row */}
      <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
        {/* Checkbox & Time */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onToggleStatus && onToggleStatus(item.id, item.status)}
            className="text-[#173B32] hover:text-[#B65E3C] transition-colors cursor-pointer"
            aria-label={isCompleted ? "Mark uncompleted" : "Mark completed"}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 fill-emerald-100" />
            ) : (
              <Circle className="w-4 h-4 text-[#7B4D36]" />
            )}
          </button>
          <span className="font-mono font-bold text-xs sm:text-sm text-[#173B32]">
            {item.start_time}
          </span>
        </div>

        {/* Place & Short Purpose */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-serif font-black text-xs sm:text-sm text-[#173B32] truncate">
              {item.title}
            </span>
            <span className="px-1.5 py-0.2 rounded bg-[#173B32]/10 text-[#173B32] text-[8.5px] font-mono font-bold uppercase shrink-0">
              {item.category}
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-[#7B4D36] truncate mt-0.5">
            {item.reason_for_recommendation || item.notes || "Exploration stop."}
          </p>
        </div>

        {/* Action / Expand Trigger */}
        <div className="flex items-center gap-1 shrink-0">
          {onToggleLock && (
            <button
              type="button"
              onClick={() => onToggleLock(item.id, item.is_locked)}
              className={`p-1 rounded text-xs transition-colors ${
                item.is_locked ? "text-amber-700" : "text-[#7B4D36]/60 hover:text-[#7B4D36]"
              }`}
              title={item.is_locked ? "Stop is locked" : "Lock stop"}
            >
              {item.is_locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </button>
          )}

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded text-[#7B4D36] hover:text-[#173B32] transition-colors text-xs flex items-center gap-0.5 font-bold cursor-pointer"
            aria-expanded={expanded}
          >
            <span className="text-[10px] hidden sm:inline">{expanded ? "Less" : "Info"}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Progressively Disclosed Structured UI (WHAT, WHY, WHEN, COST, DISTANCE) */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-[#E5D5BA]/60 space-y-2 text-[11px] animate-fadeIn">
          {item.notes && (
            <p className="text-[#20211D]/80 leading-relaxed font-light italic">
              &ldquo;{item.notes}&rdquo;
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono pt-1">
            <div className="bg-[#EFE5D2] p-2 rounded-xl border border-[#E5D5BA]">
              <span className="text-[#7B4D36] uppercase block text-[8.5px]">When</span>
              <span className="text-[#173B32] font-bold">{item.start_time}–{item.end_time}</span>
            </div>
            <div className="bg-[#EFE5D2] p-2 rounded-xl border border-[#E5D5BA]">
              <span className="text-[#7B4D36] uppercase block text-[8.5px]">Cost</span>
              <span className="text-[#173B32] font-bold">
                {item.estimated_cost > 0 ? `₹${item.estimated_cost}` : "Free / Included"}
              </span>
            </div>
            <div className="bg-[#EFE5D2] p-2 rounded-xl border border-[#E5D5BA]">
              <span className="text-[#7B4D36] uppercase block text-[8.5px]">Distance</span>
              <span className="text-[#173B32] font-bold">
                {item.distance_from_prev_km > 0 ? `${item.distance_from_prev_km} km` : "Nearby"}
              </span>
            </div>
            <div className="bg-[#EFE5D2] p-2 rounded-xl border border-[#E5D5BA]">
              <span className="text-[#7B4D36] uppercase block text-[8.5px]">Duration</span>
              <span className="text-[#173B32] font-bold">{item.duration_mins} mins</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
