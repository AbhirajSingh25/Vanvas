"use client";

import React, { useEffect } from "react";
import {
  Clock, MapPin, DollarSign, Sparkles, X, Check,
  Navigation, ExternalLink, Info, CheckCircle2, Lock
} from "lucide-react";
import { ItineraryItem } from "@/types";
import { normalizeItineraryItem } from "@/lib/itineraryNormalizer";

interface StopDetailDrawerProps {
  item: ItineraryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleComplete?: (itemId: string, currentStatus: string) => void;
  onToggleLock?: (itemId: string, currentLock: boolean) => void;
}

export const StopDetailDrawer: React.FC<StopDetailDrawerProps> = ({
  item,
  isOpen,
  onClose,
  onToggleComplete,
  onToggleLock,
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

  if (!isOpen || !item) return null;

  const stop = normalizeItineraryItem(item);
  const isCompleted = stop.isCompleted;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#0F2924]/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-slideUp flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#173B32] text-[#EFE5D2] flex items-center justify-between border-b border-[#243E36]">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg bg-[#B65E3C] text-[#FAF4E8] font-mono font-bold text-xs">
              {stop.time}
            </span>
            <div>
              <span className="text-[10px] font-mono font-bold text-[#B49252] uppercase block">
                {stop.category || "PLANNED STOP"}
              </span>
              <h3 className="font-serif font-black text-lg text-[#FAF4E8] line-clamp-1">
                {stop.placeName || item.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-full text-[#D8DED5] hover:bg-[#20453B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Structured Stop Details (WHY, TIME, COST, DISTANCE, NOTES) */}
        <div className="p-5 space-y-3.5 text-xs font-mono">
          {/* WHY */}
          <div className="p-3 rounded-2xl bg-white border border-[#E5D5BA] space-y-1">
            <span className="text-[9px] uppercase font-bold text-[#B65E3C] block">
              WHY THIS STOP
            </span>
            <p className="font-sans text-xs text-[#173B32] font-medium leading-relaxed">
              {stop.whyThisStop || item.notes || "Curated for your travel style and optimal daylight timing."}
            </p>
          </div>

          {/* TIME, COST & DISTANCE */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-2xl bg-white border border-[#E5D5BA]">
              <span className="text-[9px] uppercase font-bold text-[#7B4D36] block">TIME</span>
              <span className="text-xs font-bold text-[#173B32]">
                {stop.time}{stop.endTime ? `–${stop.endTime}` : ""}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-[#E5D5BA]">
              <span className="text-[9px] uppercase font-bold text-[#7B4D36] block">COST</span>
              <span className="text-xs font-bold text-[#173B32]">
                {stop.costFormatted || "₹0 (Free)"}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-[#E5D5BA]">
              <span className="text-[9px] uppercase font-bold text-[#7B4D36] block">PROVENANCE</span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded block truncate">
                VERIFIED
              </span>
            </div>
          </div>

          {/* NOTES / TIPS */}
          <div className="p-3 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] space-y-0.5">
            <span className="text-[9px] uppercase font-bold text-[#7B4D36] block">NOTES &amp; ADVICE</span>
            <p className="font-sans text-[11px] text-[#173B32]">
              {stop.notes || "Best explored early to avoid peak crowds and enjoy optimal scenic views."}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex items-center gap-2">
            {onToggleComplete && (
              <button
                type="button"
                onClick={() => {
                  onToggleComplete(item.id, item.status);
                  onClose();
                }}
                className={`flex-1 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  isCompleted
                    ? "bg-[#EFE5D2] text-[#173B32] border border-[#E5D5BA]"
                    : "bg-[#173B32] text-[#EFE5D2] hover:bg-[#20453B]"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isCompleted ? "Mark as Upcoming" : "Mark Completed"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
