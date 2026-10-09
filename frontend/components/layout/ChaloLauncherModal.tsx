"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Compass,
  Navigation,
  Clock,
  Sparkles,
  X,
  ArrowRight,
  MapPin,
  Calendar,
  MessageSquare,
  ShieldCheck
} from "lucide-react";
import { TravelStamp } from "@/components/ui/TravelStamp";

interface ChaloLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAskVanvas?: () => void;
}

export const ChaloLauncherModal: React.FC<ChaloLauncherModalProps> = ({
  isOpen,
  onClose,
  onOpenAskVanvas,
}) => {
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLaunch = (href: string) => {
    onClose();
    router.push(href);
  };

  const handleAsk = () => {
    onClose();
    if (onOpenAskVanvas) {
      onOpenAskVanvas();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Chalo Action Center"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#0F2924]/75 backdrop-blur-sm animate-vanvas-fade"
      onClick={onClose}
    >
      <div
        className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-vanvas-sheet sm:animate-vanvas-scale flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden flex items-center justify-center pt-2 pb-0 bg-[#173B32]">
          <div className="w-10 h-1 rounded-full bg-[#E5D5BA]/50" />
        </div>

        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#173B32] text-[#EFE5D2] flex items-center justify-between border-b border-[#243E36]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TravelStamp label="चलो" variant="terracotta" />
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#B49252] uppercase">
                ACTION CENTER
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-black text-[#FAF4E8]">
              What are you planning?
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-full text-[#D8DED5] hover:bg-[#20453B] interactive-btn cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Options */}
        <div className="p-5 sm:p-6 space-y-3 bg-[#FAF7F0]">
          {/* Action 1: Plan a Trip */}
          <button
            type="button"
            onClick={() => handleLaunch("/plan")}
            className="w-full p-4 rounded-2xl bg-white hover:bg-[#EFE5D2] border-2 border-[#E5D5BA] hover:border-[#173B32] text-left interactive-card flex items-center justify-between group cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#173B32] text-[#EFE5D2] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-[#B49252]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-base text-[#173B32]">
                    Plan a Trip
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E5D5BA] text-[#173B32] font-semibold">
                    Step-by-Step
                  </span>
                </div>
                <p className="text-xs text-[#7B4D36] mt-0.5">
                  Answer one question at a time. Get a balanced itinerary.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#7B4D36] group-hover:text-[#173B32] group-hover:translate-x-1 transition-all shrink-0" />
          </button>

          {/* Action 2: Road Trip */}
          <button
            type="button"
            onClick={() => handleLaunch("/road-trip")}
            className="w-full p-4 rounded-2xl bg-white hover:bg-[#EFE5D2] border-2 border-[#E5D5BA] hover:border-[#B65E3C] text-left interactive-card flex items-center justify-between group cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#B65E3C] text-[#EFE5D2] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Navigation className="w-5 h-5 text-[#FAF4E8]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-base text-[#173B32]">
                    Road Trip
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E5D5BA] text-[#B65E3C] font-semibold">
                    Live Route
                  </span>
                </div>
                <p className="text-xs text-[#7B4D36] mt-0.5">
                  Plan highway legs, along-the-way stops, fuel &amp; stays.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#7B4D36] group-hover:text-[#B65E3C] group-hover:translate-x-1 transition-all shrink-0" />
          </button>

          {/* Action 3: Day Escape */}
          <button
            type="button"
            onClick={() => handleLaunch("/one-day")}
            className="w-full p-4 rounded-2xl bg-white hover:bg-[#EFE5D2] border-2 border-[#E5D5BA] hover:border-[#8C6D37] text-left interactive-card flex items-center justify-between group cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#8C6D37] text-[#EFE5D2] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Clock className="w-5 h-5 text-[#FAF4E8]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-base text-[#173B32]">
                    Day Escape
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E5D5BA] text-[#8C6D37] font-semibold">
                    1 Day
                  </span>
                </div>
                <p className="text-xs text-[#7B4D36] mt-0.5">
                  Dawn-to-dusk getaway. Return tonight with zero rush.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#7B4D36] group-hover:text-[#8C6D37] group-hover:translate-x-1 transition-all shrink-0" />
          </button>

          {/* Action 4: My Bookings & Vouchers */}
          <button
            type="button"
            onClick={() => handleLaunch("/bookings")}
            className="w-full p-4 rounded-2xl bg-white hover:bg-[#EFE5D2] border-2 border-[#E5D5BA] hover:border-[#173B32] text-left interactive-card flex items-center justify-between group cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#173B32] text-[#EFE5D2] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5 text-[#B49252]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-base text-[#173B32]">
                    My Bookings
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E5D5BA] text-[#173B32] font-semibold">
                    Vouchers
                  </span>
                </div>
                <p className="text-xs text-[#7B4D36] mt-0.5">
                  View confirmed reservations, tickets &amp; cancellations.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#7B4D36] group-hover:text-[#173B32] group-hover:translate-x-1 transition-all shrink-0" />
          </button>

          {/* Secondary Action: Ask VANVAS */}
          <div className="pt-2 border-t border-[#E5D5BA]">
            <button
              type="button"
              onClick={handleAsk}
              className="w-full py-3 px-4 rounded-xl bg-[#EFE5D2] hover:bg-[#E5D5BA] text-[#173B32] font-semibold text-xs interactive-btn flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#B65E3C]" />
              <span>Have a specific travel question? Ask VANVAS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
