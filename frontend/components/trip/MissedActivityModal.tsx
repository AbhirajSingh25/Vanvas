"use client";

import React, { useState } from "react";
import { AlertTriangle, CalendarPlus, RefreshCw, Trash2, X, Sparkles, ArrowRight } from "lucide-react";
import { ActionPreviewResponse, ItineraryItem, Trip } from "@/types";
import { api } from "@/lib/api";

interface MissedActivityModalProps {
  tripId: string;
  dayNumber?: number;
  item: ItineraryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onPreviewGenerated: (preview: ActionPreviewResponse) => void;
}

export const MissedActivityModal: React.FC<MissedActivityModalProps> = ({
  tripId,
  dayNumber = 1,
  item,
  isOpen,
  onClose,
  onPreviewGenerated,
}) => {
  const [resolutionChoice, setResolutionChoice] = useState<"move_tomorrow" | "replace" | "remove">("replace");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const options = [
    {
      id: "replace" as const,
      title: "Find Nearby Alternative",
      desc: "Swap with a quick, high-proximity café or scenic viewpoint that fits into the remaining schedule.",
      icon: Sparkles,
      color: "bg-emerald-50 text-emerald-900 border-emerald-300",
    },
    {
      id: "move_tomorrow" as const,
      title: "Move to Tomorrow",
      desc: "Shift this activity to tomorrow's itinerary buffer slot without overburdening the day.",
      icon: CalendarPlus,
      color: "bg-amber-50 text-amber-900 border-amber-300",
    },
    {
      id: "remove" as const,
      title: "Remove from Trip",
      desc: "Remove this activity completely and close schedule time gaps.",
      icon: Trash2,
      color: "bg-red-50 text-red-900 border-red-300",
    },
  ];

  const handleGeneratePreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const preview = await api.previewTripAction(tripId, {
        action_type: "MISSED_ACTIVITY",
        target_day_number: dayNumber,
        target_item_id: item.id,
        parameters: {
          target_item_id: item.id,
          target_place_id: item.place_id,
          target_item_title: item.title,
          resolution_choice: resolutionChoice
        }
      });
      onPreviewGenerated(preview);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to calculate missed activity resolution.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2924]/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#0F2924] text-[#EFE5D2] border-b border-[#243E36] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#B65E3C] flex items-center justify-center text-white shadow-sm">
              <AlertTriangle className="w-5 h-5 text-[#B49252]" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B49252]">
                MISSED STOP · DAY {dayNumber}
              </span>
              <h3 className="font-serif font-black text-lg text-[#FAF4E8] truncate max-w-xs sm:max-w-sm">
                Missed: {item.title}
              </h3>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-full text-[#D8DED5] hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="p-5 sm:p-6 space-y-3.5">
          <p className="text-xs text-[#5A534A] leading-relaxed">
            Missed your scheduled stop at <span className="font-bold text-[#173B32]">{item.title}</span> ({item.start_time} - {item.end_time})? Choose how VANVAS should adapt your itinerary:
          </p>

          <div className="space-y-2.5">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isSelected = resolutionChoice === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setResolutionChoice(opt.id)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                    isSelected
                      ? "bg-[#173B32] border-[#B49252] text-[#FAF4E8] shadow-md"
                      : "bg-[#EFE5D2] border-[#E5D5BA] text-[#2D2A26] hover:border-[#173B32]/40"
                  }`}
                >
                  <div className={`p-2.5 rounded-xl border ${opt.color} shrink-0 mt-0.5`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-serif font-black text-sm">{opt.title}</div>
                    <div className={`text-xs mt-1 leading-relaxed ${isSelected ? "text-[#D8DED5]" : "text-[#7B4D36]"}`}>
                      {opt.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-100 border border-red-300 text-red-900 text-xs font-mono">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-[#FAF7F0] border-t border-[#E5D5BA] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl border border-[#E5D5BA] hover:bg-[#EFE5D2] text-[#7B4D36] text-xs font-mono font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleGeneratePreview}
            disabled={loading}
            className="flex-1 py-3 px-5 rounded-2xl bg-[#173B32] hover:bg-[#0F2924] text-[#FAF4E8] font-serif font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-[#B49252]" />
            ) : (
              <Sparkles className="w-4 h-4 text-[#B49252]" />
            )}
            <span>Preview Resolution Plan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
