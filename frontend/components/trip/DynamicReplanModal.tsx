"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Clock, BedDouble, CloudRain, Wallet, Flame, Sun, X, RefreshCw, Layers } from "lucide-react";
import { api } from "@/lib/api";
import { ActionPreviewResponse, Trip } from "@/types";

interface DynamicReplanModalProps {
  tripId: string;
  dayNumber?: number;
  isOpen: boolean;
  onClose: () => void;
  onPreviewGenerated: (preview: ActionPreviewResponse) => void;
  trip?: Trip;
}

export const DynamicReplanModal: React.FC<DynamicReplanModalProps> = ({
  tripId,
  dayNumber = 1,
  isOpen,
  onClose,
  onPreviewGenerated,
  trip,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const actions = [
    {
      id: "RUNNING_LATE",
      action_type: "RUNNING_LATE",
      title: "देरी हो गई • I'm Running Late",
      desc: "Automatically shift upcoming stops forward, compress durations, and preserve confirmed stays.",
      icon: Clock,
      color: "bg-[#B49252]/20 text-[#7B4D36] border-[#B49252]/40",
      params: { delay_minutes: 120 }
    },
    {
      id: "MAKE_TODAY_EASIER",
      action_type: "MAKE_TODAY_EASIER",
      title: "थक गए • Make Today Easier",
      desc: "Swap strenuous mountain hikes with cosy riverside tea spots, scenic viewpoints, and early rest.",
      icon: BedDouble,
      color: "bg-[#273D52]/20 text-[#273D52] border-[#273D52]/40",
      params: {}
    },
    {
      id: "ADJUST_FOR_WEATHER",
      action_type: "ADJUST_FOR_WEATHER",
      title: "बारिश हो रही है • Adjust for Weather",
      desc: "Replace open-air viewpoints and exposed treks with sheltered book cafés, monasteries & galleries.",
      icon: CloudRain,
      color: "bg-[#536B52]/20 text-[#173B32] border-[#536B52]/40",
      params: {}
    },
    {
      id: "MAKE_TODAY_CHEAPER",
      action_type: "MAKE_TODAY_CHEAPER",
      title: "बजट कम है • Make Today Cheaper",
      desc: "Trim expenses by swapping ticketed spots with scenic free nature trails and authentic local dhabas.",
      icon: Wallet,
      color: "bg-[#B65E3C]/20 text-[#B65E3C] border-[#B65E3C]/40",
      params: {}
    },
    {
      id: "MAKE_TODAY_MORE_ACTIVE",
      action_type: "MAKE_TODAY_MORE_ACTIVE",
      title: "रोमांच चाहिए • Make More Active",
      desc: "Inject adrenaline stops like paragliding, river crossings, or panoramic high ridge trails.",
      icon: Flame,
      color: "bg-orange-100 text-orange-900 border-orange-300",
      params: {}
    },
    {
      id: "REPLAN_DAY",
      action_type: "REPLAN_DAY",
      title: "दिन पुनर्संतुलित करें • Rebalance Day Plan",
      desc: "Re-optimize travel transitions and refresh time allocations for smooth mountain flow.",
      icon: Sun,
      color: "bg-[#EFE5D2] text-[#7B4D36] border-[#E5D5BA]",
      params: {}
    },
  ];

  const handleSelect = async (actionItem: typeof actions[0]) => {
    setSelectedAction(actionItem.id);
    setLoading(true);
    setError(null);
    try {
      const preview = await api.previewTripAction(resolvedTripId, {
        action_type: actionItem.action_type,
        target_day_number: dayNumber,
        parameters: actionItem.params
      });
      onPreviewGenerated(preview);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to calculate adaptation preview.");
    } finally {
      setLoading(false);
      setSelectedAction(null);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2924]/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#0F2924] text-[#EFE5D2] flex items-center justify-between border-b border-[#243E36]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#B65E3C] flex items-center justify-center text-[#EFE5D2] shadow-sm">
              <Sparkles className="w-5 h-5 text-[#B49252]" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B49252]">
                DYNAMIC TRAVEL INTELLIGENCE · DAY {dayNumber}
              </span>
              <h3 className="font-serif font-black text-lg text-[#FAF4E8]">Adapt Trip to Reality</h3>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-full text-[#D8DED5] hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Grid */}
        <div className="p-5 sm:p-6 space-y-3 overflow-y-auto flex-1">
          <p className="text-xs text-[#5A534A] leading-relaxed mb-1">
            Choose an adaptation context. VANVAS will calculate the consequences and present a clear preview before modifying your itinerary:
          </p>

          {actions.map((act) => {
            const Icon = act.icon;
            const isCurrentLoading = loading && selectedAction === act.id;

            return (
              <button
                key={act.id}
                disabled={loading}
                onClick={() => handleSelect(act)}
                className="w-full text-left p-4 rounded-2xl bg-[#EFE5D2] border-2 border-[#E5D5BA] hover:border-[#173B32] hover:shadow-md transition-all flex items-start gap-4 group disabled:opacity-50 cursor-pointer"
              >
                <div className={`p-3 rounded-xl border ${act.color} group-hover:scale-105 transition-transform shrink-0 mt-0.5`}>
                  {isCurrentLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif font-bold text-sm text-[#173B32]">{act.title}</h4>
                    <span className="text-xs text-[#7B4D36] group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                  <p className="text-xs text-[#5A534A] mt-1 leading-relaxed">{act.desc}</p>
                </div>
              </button>
            );
          })}

          {error && (
            <div className="p-3 rounded-xl bg-red-100 border border-red-300 text-red-900 text-xs font-mono">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-[#FAF7F0] border-t border-[#E5D5BA] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#E5D5BA] hover:bg-[#EFE5D2] text-[#7B4D36] text-xs font-mono font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
