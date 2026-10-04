"use client";

import React, { useState } from "react";
import { Clock, AlertCircle, Sparkles, X, ArrowRight, RefreshCw } from "lucide-react";
import { ActionPreviewResponse, Trip } from "@/types";
import { api } from "@/lib/api";

interface RunningLateModalProps {
  tripId: string;
  dayNumber?: number;
  isOpen: boolean;
  onClose: () => void;
  onPreviewGenerated: (preview: ActionPreviewResponse) => void;
}

export const RunningLateModal: React.FC<RunningLateModalProps> = ({
  tripId,
  dayNumber = 1,
  isOpen,
  onClose,
  onPreviewGenerated,
}) => {
  const [delayMinutes, setDelayMinutes] = useState<number>(120);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const presets = [
    { label: "30 mins", value: 30, desc: "Slight traffic or mountain chai delay" },
    { label: "1 hour", value: 60, desc: "Moderate delay or late checkout" },
    { label: "2 hours", value: 120, desc: "Significant transit delay" },
    { label: "3 hours", value: 180, desc: "Major delay / late arrival" },
  ];

  const handleGeneratePreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const preview = await api.previewTripAction(tripId, {
        action_type: "RUNNING_LATE",
        target_day_number: dayNumber,
        parameters: { delay_minutes: delayMinutes }
      });
      onPreviewGenerated(preview);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to calculate late schedule preview.");
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
        className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#0F2924] text-[#EFE5D2] border-b border-[#243E36] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                TIME ADAPTATION · DAY {dayNumber}
              </span>
              <h3 className="font-serif font-black text-lg text-[#FAF4E8]">
                I&apos;m Running Late
              </h3>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-full text-[#D8DED5] hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Delay Presets */}
        <div className="p-5 sm:p-6 space-y-4">
          <p className="text-xs text-[#5A534A] leading-relaxed">
            How late will you arrive? VANVAS will recalculate time slots, preserve confirmed bookings, and compress non-critical stops without rushing.
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            {presets.map((p) => {
              const isSelected = delayMinutes === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setDelayMinutes(p.value)}
                  className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#173B32] border-[#B49252] text-[#FAF4E8] shadow-md"
                      : "bg-[#EFE5D2] border-[#E5D5BA] text-[#2D2A26] hover:border-[#173B32]/40"
                  }`}
                >
                  <div className="font-serif font-black text-base">{p.label}</div>
                  <div className={`text-[10px] mt-0.5 line-clamp-1 ${isSelected ? "text-[#D8DED5]" : "text-[#7B4D36]"}`}>
                    {p.desc}
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
            <span>Preview Adjusted Plan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
