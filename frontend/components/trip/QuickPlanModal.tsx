"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Clock, Sparkles, X, MapPin, Check, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

interface QuickPlanModalProps {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
  trip?: any;
}

export const QuickPlanModal: React.FC<QuickPlanModalProps> = ({ tripId, isOpen, onClose, trip }) => {
  const [selectedHours, setSelectedHours] = useState<number>(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [variation, setVariation] = useState<number>(0);
  const [result, setResult] = useState<{ headline: string; summary: string; items: any[] } | null>(null);

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
      const res = await api.getQuickPlan(resolvedTripId, hours, undefined, undefined, nextVariation);
      setResult(res);
      setVariation(nextVariation);
    } catch (err: any) {
      console.error("QuickPlan fetch failed:", err);
      setError(err?.message || "Failed to generate micro-plan. Please check network connection.");
    } finally {
      setLoading(false);
    }
  }, [resolvedTripId, selectedHours]);

  // Auto-fetch on open if no result yet
  useEffect(() => {
    if (isOpen && !result && !loading && resolvedTripId) {
      handleGenerate(selectedHours, 0);
    }
  }, [isOpen, result, loading, resolvedTripId, selectedHours, handleGenerate]);

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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2924]/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-[#0F2924] text-[#EFE5D2] flex items-center justify-between border-b border-[#243E36]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B49252] text-[#0F2924] flex items-center justify-center font-bold shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-black text-lg">I Have X Hours Free</h3>
                {variation > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#B49252]/20 text-[#B49252] border border-[#B49252]/40 text-[10px] font-mono uppercase tracking-wider">
                    Plan #{variation + 1}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#D8DED5]/80 font-mono">Spontaneous micro-itinerary for your free window</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-full text-[#D8DED5] hover:bg-[#173B32] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hour Selector Buttons */}
        <div className="p-5 border-b border-[#E5D5BA] bg-[#EFE5D2]">
          <label className="text-xs font-bold text-[#173B32] uppercase tracking-wider block mb-2.5">
            Select Your Free Window (खाली समय):
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {hourOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setSelectedHours(opt.value);
                  handleGenerate(opt.value, 0);
                }}
                disabled={loading}
                className={`py-2.5 rounded-xl font-bold text-xs transition-all border-2 disabled:opacity-50 ${
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
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-sm">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-[#7B4D36]">
              <RefreshCw className="w-8 h-8 text-[#B65E3C] animate-spin" />
              <span className="text-xs font-serif italic text-center">
                {variation > 0 ? "Regenerating fresh pine stops..." : `Curating nearby stops for ${selectedHours} hours...`}
              </span>
            </div>
          ) : error ? (
            <div className="py-8 px-4 text-center space-y-3 bg-[#FAF7F0] border border-red-200 rounded-2xl">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
              <p className="text-xs text-red-800 font-medium">{error}</p>
              <button
                onClick={() => handleGenerate(selectedHours, variation)}
                className="px-4 py-2 rounded-xl bg-[#173B32] text-[#EFE5D2] text-xs font-bold hover:bg-[#243E36] transition-all"
              >
                Retry
              </button>
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] shadow-2xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-base text-[#173B32]">{result.headline}</h4>
                  {variation > 0 && (
                    <span className="text-[10px] font-mono font-bold text-[#173B32] bg-[#FAF7F0] px-2 py-0.5 rounded-md border border-[#E5D5BA]">
                      ✓ Alternate Route
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#7B4D36] mt-1 font-light leading-relaxed">{result.summary}</p>
              </div>

              <div className="space-y-2.5">
                {result.items.map((item, idx) => (
                  <div key={item.id || idx} className="p-4 rounded-2xl bg-[#FAF7F0] border-2 border-[#E5D5BA] flex items-start gap-3.5 shadow-2xs">
                    <div className="px-2.5 py-1 rounded-lg bg-[#173B32] text-[#EFE5D2] text-xs font-mono font-bold shrink-0">
                      {item.start_time}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between font-serif font-bold text-[#173B32] gap-2">
                        <span className="truncate">{item.title}</span>
                        <span className="text-xs font-mono text-[#7B4D36] shrink-0">{item.duration_mins}m</span>
                      </div>
                      {item.notes && (
                        <p className="text-xs text-[#20211D]/80 mt-1 font-light line-clamp-2">{item.notes}</p>
                      )}
                      {item.reason_for_recommendation && (
                        <p className="text-[10px] font-mono text-[#7B4D36]/80 mt-1 italic">
                          ✦ {item.reason_for_recommendation}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-xs font-serif italic text-[#7B4D36]">
              Select any duration above to generate an immediate micro-plan without altering your master trip.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E5D5BA] bg-[#EFE5D2] flex items-center justify-between">
          <button onClick={onClose} className="text-xs font-bold text-[#7B4D36] hover:text-[#173B32] uppercase tracking-wider">
            Close
          </button>
          <button
            onClick={() => handleGenerate(selectedHours, variation + 1)}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] text-xs font-bold uppercase tracking-wider shadow-sm transition-all disabled:opacity-60"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Regenerating...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate Plan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

