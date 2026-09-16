"use client";

import React, { useState, useEffect } from "react";
import { Clock, Sparkles, X, MapPin, Check, ArrowRight } from "lucide-react";
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
  const [result, setResult] = useState<{ headline: string; summary: string; items: any[] } | null>(null);

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

  const hourOptions = [
    { label: "1 घंटा • 1 Hr", value: 1 },
    { label: "2 घंटे • 2 Hrs", value: 2 },
    { label: "3 घंटे • 3 Hrs", value: 3 },
    { label: "4 घंटे • 4 Hrs", value: 4 },
  ];

  const handleGenerate = async (hours = selectedHours) => {
    setLoading(true);
    try {
      const res = await api.getQuickPlan(resolvedTripId, hours);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
            <div className="w-10 h-10 rounded-xl bg-[#B49252] text-[#0F2924] flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-black text-lg">I Have X Hours Free</h3>
              <p className="text-xs text-[#D8DED5]/80 font-mono">Spontaneous micro plan for your current valley window</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-full text-[#D8DED5] hover:bg-[#173B32]">
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
                  handleGenerate(opt.value);
                }}
                className={`py-2.5 rounded-xl font-bold text-xs transition-all border-2 ${
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
            <div className="py-12 flex flex-col items-center justify-center space-y-2 text-[#7B4D36]">
              <div className="w-7 h-7 border-2 border-[#B65E3C] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-serif italic">Curating nearby pine spots for {selectedHours} hours...</span>
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA]">
                <h4 className="font-serif font-bold text-base text-[#173B32]">{result.headline}</h4>
                <p className="text-xs text-[#7B4D36] mt-1 font-light leading-relaxed">{result.summary}</p>
              </div>

              <div className="space-y-2.5">
                {result.items.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[#FAF7F0] border-2 border-[#E5D5BA] flex items-start gap-3.5 shadow-2xs">
                    <div className="px-2.5 py-1 rounded-lg bg-[#173B32] text-[#EFE5D2] text-xs font-mono font-bold">
                      {item.start_time}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between font-serif font-bold text-[#173B32]">
                        <span>{item.title}</span>
                        <span className="text-xs font-mono text-[#7B4D36]">{item.duration_mins}m</span>
                      </div>
                      <p className="text-xs text-[#20211D]/80 mt-1 font-light">{item.notes}</p>
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
          <button onClick={onClose} className="text-xs font-bold text-[#7B4D36] hover:text-[#173B32] uppercase">
            Close
          </button>
          <button
            onClick={() => handleGenerate()}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
          >
            Regenerate Plan
          </button>
        </div>
      </div>
    </div>
  );
};
