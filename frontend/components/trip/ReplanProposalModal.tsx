"use client";

import React, { useState } from "react";
import { 
  X, Check, AlertTriangle, ArrowRight, ShieldCheck, Clock, 
  Sparkles, DollarSign, Calendar, MapPin 
} from "lucide-react";
import { ReplanProposal, Trip } from "@/types";
import { api } from "@/lib/api";

interface ReplanProposalModalProps {
  proposal: ReplanProposal;
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
  onApplied: (updatedTrip?: Trip) => void;
}

export const ReplanProposalModal: React.FC<ReplanProposalModalProps> = ({
  proposal,
  tripId,
  isOpen,
  onClose,
  onApplied
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDecision = async (decision: "APPROVE" | "REJECT") => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.decideProposal(tripId, proposal.id, decision);
      if (decision === "APPROVE") {
        onApplied(res.trip);
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to process decision. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const bookingImpact = proposal.booking_impact || {};
  const budgetImpact = proposal.budget_impact || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-900/80">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-serif font-bold text-stone-100">
                  Adaptive Replan Proposal
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Level 2 Reversible
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Deterministic itinerary adjustment tailored to live trip reality
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Trigger & Reason Card */}
          <div className="p-4 rounded-xl bg-stone-950/50 border border-stone-800/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>Why VANVAS Recommends This</span>
            </div>
            <p className="text-sm text-stone-200 leading-relaxed font-sans">
              {proposal.reason}
            </p>
          </div>

          {/* Schedule Diff Comparison */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-stone-400 font-semibold">
              Schedule Comparison
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Original Schedule */}
              <div className="p-4 rounded-xl bg-stone-950/30 border border-stone-800/60 space-y-3">
                <div className="text-xs font-mono text-stone-400 font-medium flex items-center justify-between">
                  <span>ORIGINAL PLAN</span>
                  <span className="text-[10px] text-stone-500">Day View</span>
                </div>
                <div className="space-y-2">
                  {proposal.original_schedule && proposal.original_schedule.length > 0 ? (
                    proposal.original_schedule.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="p-2.5 rounded-lg bg-stone-900/60 border border-stone-800/40 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-medium text-stone-300">
                          <span className="truncate">{item.title}</span>
                          <span className="font-mono text-stone-400 text-[11px] shrink-0 ml-2">
                            {item.start_time} - {item.end_time}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-stone-500 italic">No schedule changes recorded</p>
                  )}
                </div>
              </div>

              {/* Proposed Schedule */}
              <div className="p-4 rounded-xl bg-emerald-950/10 border border-emerald-800/30 space-y-3">
                <div className="text-xs font-mono text-emerald-400 font-medium flex items-center justify-between">
                  <span>PROPOSED REVISION</span>
                  <span className="text-[10px] text-emerald-500 font-semibold">Optimized</span>
                </div>
                <div className="space-y-2">
                  {proposal.proposed_schedule && proposal.proposed_schedule.length > 0 ? (
                    proposal.proposed_schedule.map((item, idx) => {
                      const isShifted = proposal.original_schedule?.some(
                        (orig) => orig.title === item.title && (orig.start_time !== item.start_time || orig.end_time !== item.end_time)
                      );
                      return (
                        <div 
                          key={idx} 
                          className={`p-2.5 rounded-lg text-xs space-y-1 ${
                            isShifted 
                              ? "bg-amber-500/10 border border-amber-500/30 text-amber-200" 
                              : "bg-stone-900/60 border border-stone-800/40 text-stone-300"
                          }`}
                        >
                          <div className="flex items-center justify-between font-medium">
                            <span className="truncate">{item.title}</span>
                            <span className="font-mono text-[11px] shrink-0 ml-2 font-semibold">
                              {item.start_time} - {item.end_time}
                            </span>
                          </div>
                          {item.notes && (
                            <p className="text-[11px] text-stone-400">{item.notes}</p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-stone-500 italic">No schedule changes</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Booking & Budget Integrity Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-stone-950/40 border border-stone-800/60 flex items-start gap-3">
              <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <div>
                <h5 className="text-xs font-semibold text-stone-200">Paid Booking Protection</h5>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  {bookingImpact.note || bookingImpact.action_recommendation || "Confirmed bookings and paid reservations remain 100% secure."}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-950/40 border border-stone-800/60 flex items-start gap-3">
              <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
                <DollarSign className="w-4 h-4" />
              </span>
              <div>
                <h5 className="text-xs font-semibold text-stone-200">Budget Impact</h5>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  {budgetImpact.projected_savings_inr 
                    ? `Projected recovery: ₹${budgetImpact.projected_savings_inr.toLocaleString()} without compromising safety.` 
                    : "Zero extra charges or hidden cancellation penalties."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-stone-800 bg-stone-900/90 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleDecision("REJECT")}
            className="px-4 py-2.5 rounded-xl text-xs font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition disabled:opacity-50"
          >
            Keep Current Plan
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDecision("APPROVE")}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 transition flex items-center gap-2 shadow-lg shadow-amber-950/30 disabled:opacity-50"
            >
              {loading ? (
                <span>Applying Plan...</span>
              ) : (
                <>
                  <span>Apply New Plan</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
