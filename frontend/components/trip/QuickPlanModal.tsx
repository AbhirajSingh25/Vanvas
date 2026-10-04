"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Clock, Sparkles, X, MapPin, Check, ArrowRight, RefreshCw, AlertCircle, Plus, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { ActionPreviewResponse, Trip } from "@/types";

interface QuickPlanModalProps {
  tripId: string;
  dayNumber?: number;
  isOpen: boolean;
  onClose: () => void;
  trip?: any;
  onApplied?: (updatedTrip: Trip, message: string) => void;
}

export const QuickPlanModal: React.FC<QuickPlanModalProps> = ({
  tripId,
  dayNumber = 1,
  isOpen,
  onClose,
  trip,
  onApplied,
}) => {
  const [selectedHours, setSelectedHours] = useState<number>(3);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [variation, setVariation] = useState<number>(0);
  const [preview, setPreview] = useState<ActionPreviewResponse | null>(null);

  const resolvedTripId = trip?.id || tripId;

  const hourOptions = [
    { label: "1 घंटा • 1 Hr", value: 1 },
    { label: "2 घंटे • 2 Hrs", value: 2 },
    { label: "3 घंटे • 3 Hrs", value: 3 },
    { label: "4 घंटे • 4 Hrs", value: 4 },
  ];

  const handleGenerate = useCallback(async (hours = selectedHours, nextVariation = 0) => {
    if (!resolvedTripId) return;
    setLoading(true);
    setError(null);
    try {
      const prev = await api.previewTripAction(resolvedTripId, {
        action_type: "SHORT_PLAN",
        target_day_number: dayNumber,
        parameters: {
          hours_available: hours,
          variation: nextVariation,
          mode: "replace"
        }
      });
      setPreview(prev);
      setVariation(nextVariation);
    } catch (err: any) {
      console.error("QuickPlan fetch failed:", err);
      setError(err?.message || "Failed to generate micro-plan. Please check connection.");
    } finally {
      setLoading(false);
    }
  }, [resolvedTripId, dayNumber, selectedHours]);

  useEffect(() => {
    if (isOpen && !preview && !loading && resolvedTripId) {
      handleGenerate(selectedHours, 0);
    }
  }, [isOpen, preview, loading, resolvedTripId, selectedHours, handleGenerate]);

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

  const handleApplyAction = async (mode: "replace" | "append") => {
    if (!preview || !resolvedTripId) return;
    setApplying(true);
    setError(null);
    try {
      const payload = {
        ...preview.payload_for_apply,
        mode
      };
      const res = await api.applyTripAction(resolvedTripId, {
        action_type: "SHORT_PLAN",
        target_day_number: dayNumber,
        reason: `${selectedHours}-Hour Micro Plan (${mode === 'append' ? 'Added' : 'Replaced'})`,
        payload_for_apply: payload,
        parameters: payload
      });
      if (res && res.success) {
        if (onApplied) onApplied(res.trip, res.message);
        onClose();
      } else {
        setError(res?.message || "Could not apply micro-plan.");
      }
    } catch (err: any) {
      console.error("Failed to apply plan:", err);
      setError(err?.message || "Failed to persist micro-plan.");
    } finally {
      setApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2924]/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#0F2924] text-[#EFE5D2] flex items-center justify-between border-b border-[#243E36]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#B49252] text-[#0F2924] flex items-center justify-center font-bold shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-black text-lg text-[#FAF4E8]">I Have {selectedHours} Hours Free</h3>
                {variation > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#B49252]/20 text-[#B49252] border border-[#B49252]/40 text-[10px] font-mono uppercase tracking-wider">
                    Option #{variation + 1}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#D8DED5]/80 font-mono">Day {dayNumber} · Compact spontaneous timeline</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-full text-[#D8DED5] hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hour Selector Buttons */}
        <div className="p-4 sm:p-5 border-b border-[#E5D5BA] bg-[#EFE5D2]">
          <label className="text-xs font-mono font-bold text-[#173B32] uppercase tracking-wider block mb-2">
            SELECT TIME WINDOW:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {hourOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setSelectedHours(opt.value);
                  handleGenerate(opt.value, 0);
                }}
                disabled={loading || applying}
                className={`py-2.5 rounded-xl font-bold text-xs transition-all border-2 disabled:opacity-50 cursor-pointer ${
                  selectedHours === opt.value
                    ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-sm"
                    : "bg-[#FAF7F0] text-[#20211D] border-[#E5D5BA] hover:bg-[#E5D5BA]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content & Generated Plan */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-sm">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-[#7B4D36]">
              <RefreshCw className="w-8 h-8 text-[#B65E3C] animate-spin" />
              <span className="text-xs font-serif italic text-center">
                {variation > 0 ? "Regenerating alternate curated stops..." : `Curating nearby stops for ${selectedHours} hours...`}
              </span>
            </div>
          ) : error ? (
            <div className="py-6 px-4 text-center space-y-3 bg-[#FAF7F0] border border-red-200 rounded-2xl">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
              <p className="text-xs text-red-800 font-medium">{error}</p>
              <button
                onClick={() => handleGenerate(selectedHours, variation)}
                className="px-4 py-2 rounded-xl bg-[#173B32] text-[#EFE5D2] text-xs font-bold hover:bg-[#243E36] transition-all cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : preview ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] shadow-2xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-base text-[#173B32]">{preview.headline}</h4>
                </div>
                <p className="text-xs text-[#5A534A] mt-1">{preview.summary}</p>
              </div>

              {/* Timeline Items */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7B4D36]">
                    PROPOSED TIMELINE ({preview.proposed_items.length} STOPS)
                  </span>
                  <button
                    onClick={() => handleGenerate(selectedHours, variation + 1)}
                    disabled={loading || applying}
                    className="text-[10px] font-mono font-bold text-[#B65E3C] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Shuffle Alternative</span>
                  </button>
                </div>

                {preview.proposed_items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-white border border-[#E5D5BA] flex items-start gap-3 shadow-2xs"
                  >
                    <div className="px-2.5 py-1 rounded-xl bg-[#173B32] text-[#FAF4E8] text-xs font-mono font-bold shrink-0 mt-0.5">
                      {item.start_time}
                    </div>
                    <div className="flex-1 truncate">
                      <div className="font-serif font-bold text-sm text-[#2D2A26] truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-[#7B4D36] truncate mt-0.5">
                        {item.category} · {item.duration_mins} mins {item.estimated_cost ? `· ₹${item.estimated_cost}` : "· Free"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Action Buttons */}
        <div className="p-4 sm:p-5 bg-[#FAF7F0] border-t border-[#E5D5BA] flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl border border-[#E5D5BA] hover:bg-[#EFE5D2] text-[#7B4D36] text-xs font-mono font-bold cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleApplyAction("append")}
              disabled={applying || !preview}
              className="flex-1 sm:flex-initial py-2.5 px-4 rounded-2xl border-2 border-[#173B32] text-[#173B32] hover:bg-[#173B32]/10 font-mono font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              Add to Today
            </button>
            <button
              onClick={() => handleApplyAction("replace")}
              disabled={applying || !preview}
              className="flex-1 sm:flex-initial py-2.5 px-5 rounded-2xl bg-[#173B32] hover:bg-[#0F2924] text-[#FAF4E8] font-serif font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {applying ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#B49252]" />
              ) : (
                <Check className="w-3.5 h-3.5 text-[#B49252]" />
              )}
              <span>Replace Today&apos;s Plan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
