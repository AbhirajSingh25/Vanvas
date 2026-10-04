"use client";

import React, { useState } from "react";
import {
  Sparkles, Clock, AlertTriangle, ArrowRight, CheckCircle2,
  X, ShieldAlert, ArrowUpRight, TrendingDown, TrendingUp,
  CloudRain, Wallet, MapPin, RefreshCw, Check
} from "lucide-react";
import { ActionPreviewResponse, ActionApplyResponse, Trip } from "@/types";
import { api } from "@/lib/api";

interface ActionPreviewModalProps {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
  preview: ActionPreviewResponse | null;
  onApplied: (updatedTrip: Trip, message: string) => void;
}

export const ActionPreviewModal: React.FC<ActionPreviewModalProps> = ({
  tripId,
  isOpen,
  onClose,
  preview,
  onApplied,
}) => {
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !preview) return null;

  const handleApply = async () => {
    setApplying(true);
    setError(null);
    try {
      const res = await api.applyTripAction(tripId, {
        action_type: preview.action_type,
        target_day_number: preview.target_day_number,
        reason: preview.headline,
        payload_for_apply: preview.payload_for_apply,
        parameters: preview.payload_for_apply
      });
      if (res && res.success) {
        onApplied(res.trip, res.message);
        onClose();
      } else {
        setError(res?.message || "Could not apply itinerary adaptation.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to mutate itinerary. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  const { impact } = preview;
  const timeSign = impact.time_impact_mins > 0 ? "+" : "";
  const costSign = impact.cost_impact_inr > 0 ? "+" : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2924]/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-scaleUp flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#0F2924] text-[#EFE5D2] border-b border-[#243E36] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#B65E3C] flex items-center justify-center text-[#EFE5D2] shadow-sm">
              <Sparkles className="w-5 h-5 text-[#B49252]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B49252]">
                  PLAN PREVIEW · DAY {preview.target_day_number}
                </span>
              </div>
              <h3 className="font-serif font-black text-lg sm:text-xl text-[#FAF4E8]">
                {preview.headline}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-full text-[#D8DED5] hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Rationale Banner */}
          <div className="p-3.5 rounded-2xl bg-[#EFE5D2]/80 border border-[#E5D5BA] text-xs text-[#2D2A26]">
            <p className="font-medium leading-relaxed">{preview.summary}</p>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-2 gap-3">
            {impact.time_impact_mins !== 0 && (
              <div className="p-3 rounded-2xl bg-white border border-[#E5D5BA] flex items-center gap-3 shadow-xs">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#7B4D36] block font-bold">
                    Schedule Shift
                  </span>
                  <span className="text-sm font-bold font-mono text-[#173B32]">
                    {timeSign}{impact.time_impact_mins} mins
                  </span>
                </div>
              </div>
            )}

            {impact.cost_impact_inr !== 0 && (
              <div className="p-3 rounded-2xl bg-white border border-[#E5D5BA] flex items-center gap-3 shadow-xs">
                <div className={`p-2 rounded-xl border ${impact.cost_impact_inr < 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#7B4D36] block font-bold">
                    Cost Impact
                  </span>
                  <span className="text-sm font-bold font-mono text-[#173B32]">
                    {costSign}₹{Math.abs(impact.cost_impact_inr).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Environmental / Safety Notes */}
          {(impact.weather_note || impact.safety_note || impact.budget_note) && (
            <div className="space-y-2">
              {impact.weather_note && (
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs flex items-start gap-2">
                  <CloudRain className="w-4 h-4 shrink-0 mt-0.5 text-sky-700" />
                  <div>
                    <span className="font-bold">Weather Provenance:</span> {impact.weather_note}
                  </div>
                </div>
              )}
              {impact.safety_note && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                  <div>
                    <span className="font-bold">Safety Advisory:</span> {impact.safety_note}
                  </div>
                </div>
              )}
              {impact.budget_note && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2">
                  <Wallet className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700" />
                  <div>
                    <span className="font-bold">Budget Calculation:</span> {impact.budget_note}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Change Breakdown List */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#7B4D36]">
              CONSEQUENCE BREAKDOWN
            </h4>

            {/* Removed */}
            {impact.items_removed && impact.items_removed.length > 0 && (
              <div className="p-3 rounded-2xl bg-red-50/70 border border-red-200 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-red-800 block">
                  REMOVED FROM SCHEDULE ({impact.items_removed.length})
                </span>
                {impact.items_removed.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs text-red-900">
                    <span className="line-through">{item.title}</span>
                    <span className="font-mono text-[10px] text-red-700">{item.time}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Moved */}
            {impact.items_moved && impact.items_moved.length > 0 && (
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-amber-800 block">
                  RESCHEDULED TIMINGS ({impact.items_moved.length})
                </span>
                {impact.items_moved.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs text-amber-900">
                    <span className="font-medium">{item.title}</span>
                    <div className="flex items-center gap-1.5 font-mono text-[10px]">
                      <span className="text-amber-600 line-through">{item.old_time}</span>
                      <span>→</span>
                      <span className="font-bold text-amber-900">{item.new_time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Added */}
            {impact.items_added && impact.items_added.length > 0 && (
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-emerald-800 block">
                  ADDED TO SCHEDULE ({impact.items_added.length})
                </span>
                {impact.items_added.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs text-emerald-900">
                    <span className="font-medium">{item.title}</span>
                    <div className="flex items-center gap-2 font-mono text-[10px] text-emerald-700">
                      <span>{item.time}</span>
                      {item.cost !== undefined && item.cost > 0 && (
                        <span className="font-bold">₹{item.cost}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Kept */}
            {impact.items_kept && impact.items_kept.length > 0 && (
              <div className="p-3 rounded-2xl bg-stone-100/80 border border-stone-200 space-y-1.5">
                <span className="text-[10px] font-mono font-bold uppercase text-stone-600 block">
                  PRESERVED UNCHANGED ({impact.items_kept.length})
                </span>
                <div className="text-xs text-stone-700 truncate">
                  {impact.items_kept.map(k => k.title).join(" · ")}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-100 border border-red-300 text-red-900 text-xs font-mono">
              {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-[#FAF7F0] border-t border-[#E5D5BA] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            disabled={applying}
            className="px-4 py-2.5 rounded-2xl border border-[#E5D5BA] hover:bg-[#EFE5D2] text-[#7B4D36] text-xs font-mono font-bold transition-colors cursor-pointer"
          >
            Cancel / Keep Current
          </button>

          <button
            onClick={handleApply}
            disabled={applying}
            className="flex-1 py-3 px-5 rounded-2xl bg-[#173B32] hover:bg-[#0F2924] text-[#FAF4E8] font-serif font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {applying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#B49252]" />
                <span>Applying Changes & Persisting...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-[#B49252]" />
                <span>Accept & Apply Replan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
