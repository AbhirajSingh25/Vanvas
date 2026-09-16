"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Clock, BedDouble, CloudRain, Wallet, Flame, Sun, X, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { Trip } from "@/types";
import { TravelStamp } from "@/components/ui/TravelStamp";

interface DynamicReplanModalProps {
  tripId: string;
  dayNumber?: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedTrip: Trip, message: string) => void;
  trip?: Trip;
  onReplanSuccess?: (updatedTrip: Trip, message: string) => void;
}

export const DynamicReplanModal: React.FC<DynamicReplanModalProps> = ({
  tripId,
  dayNumber = 1,
  isOpen,
  onClose,
  onSuccess,
  trip,
  onReplanSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

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

  if (!isOpen) return null;

  const resolvedTripId = trip?.id || tripId;
  const callback = onReplanSuccess || onSuccess;

  const actions = [
    {
      id: "late",
      title: "देरी हो गई • I'm Late",
      desc: "Automatically shift upcoming stops forward and compress schedule without missing sunset.",
      icon: Clock,
      color: "bg-[#B49252]/20 text-[#7B4D36] border-[#B49252]/40",
    },
    {
      id: "tired",
      title: "थक गए • I'm Tired",
      desc: "Swap strenuous mountain hikes with cosy riverside tea spots and early check-in rest.",
      icon: BedDouble,
      color: "bg-[#273D52]/20 text-[#273D52] border-[#273D52]/40",
    },
    {
      id: "rain",
      title: "बारिश हो रही है • It's Raining",
      desc: "Replace open-air viewpoints with indoor book cafés, monasteries, art houses & hot siddu.",
      icon: CloudRain,
      color: "bg-[#536B52]/20 text-[#173B32] border-[#536B52]/40",
    },
    {
      id: "less_money",
      title: "बजट कम है • Less Money",
      desc: "Trim expenses by swapping ticketed spots with scenic nature trails and local dhabas.",
      icon: Wallet,
      color: "bg-[#B65E3C]/20 text-[#B65E3C] border-[#B65E3C]/40",
    },
    {
      id: "more_adventure",
      title: "रोमांच चाहिए • More Adventure",
      desc: "Inject adrenaline stops like tandem paragliding, river rafting, or high ridge trails.",
      icon: Flame,
      color: "bg-orange-100 text-orange-900 border-orange-300",
    },
    {
      id: "relax",
      title: "सुकून चाहिए • Pure Relaxation",
      desc: "Slow down the pace to 2 leisurely stops with plenty of journaling and valley gazing time.",
      icon: Sun,
      color: "bg-[#EFE5D2] text-[#7B4D36] border-[#E5D5BA]",
    },
  ];

  const handleApply = async (actionId: string) => {
    setSelectedAction(actionId);
    setLoading(true);
    try {
      const res = await api.replanTrip(resolvedTripId, actionId, dayNumber);
      if (callback) callback(res.trip, res.message);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setSelectedAction(null);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2924]/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-[#0F2924] text-[#EFE5D2] flex items-center justify-between border-b border-[#243E36]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B65E3C] flex items-center justify-center text-[#EFE5D2] shadow-sm">
              <Sparkles className="w-5 h-5 text-[#B49252]" />
            </div>
            <div>
              <h3 className="font-serif font-black text-lg">Dynamic Trail Replanner</h3>
              <p className="text-xs text-[#D8DED5]/80 font-mono">Day {dayNumber} • Real-time valley adaptation</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-full text-[#D8DED5] hover:bg-[#173B32]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Grid */}
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {actions.map((act) => {
            const Icon = act.icon;
            const isCurrentLoading = loading && selectedAction === act.id;

            return (
              <button
                key={act.id}
                disabled={loading}
                onClick={() => handleApply(act.id)}
                className="w-full text-left p-4 rounded-2xl bg-[#EFE5D2] border-2 border-[#E5D5BA] hover:border-[#173B32] hover:shadow-md transition-all flex items-start gap-4 group disabled:opacity-50"
              >
                <div className={`p-3 rounded-xl border ${act.color} group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif font-bold text-base text-[#173B32] group-hover:text-[#B65E3C] transition-colors">
                      {act.title}
                    </h4>
                    {isCurrentLoading && <RefreshCw className="w-4 h-4 text-[#B65E3C] animate-spin" />}
                  </div>
                  <p className="text-xs text-[#20211D]/80 mt-1 leading-relaxed font-light">{act.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E5D5BA] bg-[#EFE5D2] flex items-center justify-between text-xs text-[#7B4D36]">
          <span className="italic font-serif">Locked items remain protected. Only upcoming stops shift.</span>
          <button onClick={onClose} className="text-xs font-bold text-[#173B32] uppercase hover:underline">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
