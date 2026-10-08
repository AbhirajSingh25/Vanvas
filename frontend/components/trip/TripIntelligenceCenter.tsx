"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, CloudRain, Clock, AlertTriangle, CheckCircle2, 
  RefreshCw, ChevronRight, ShieldCheck, DollarSign, Compass,
  MapPin, Eye, ExternalLink, X
} from "lucide-react";
import { TripIntelligenceSummary, TravelInsight, ReplanProposal, Trip } from "@/types";
import { api } from "@/lib/api";
import { ReplanProposalModal } from "./ReplanProposalModal";

interface TripIntelligenceCenterProps {
  tripId: string;
  onTripUpdated?: (updatedTrip?: Trip) => void;
}

export const TripIntelligenceCenter: React.FC<TripIntelligenceCenterProps> = ({
  tripId,
  onTripUpdated
}) => {
  const [summary, setSummary] = useState<TripIntelligenceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<ReplanProposal | null>(null);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);

  const fetchSummary = async (forceRefresh = false) => {
    try {
      setLoading(true);
      if (forceRefresh) {
        const data = await api.evaluateTripIntelligence(tripId, { force_refresh: true });
        setSummary(data);
      } else {
        const data = await api.getTripIntelligence(tripId);
        setSummary(data);
      }
    } catch (err) {
      console.error("Failed to load trip intelligence:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tripId) {
      fetchSummary();
    }
  }, [tripId]);

  const handleDismiss = async (insightId: string) => {
    try {
      await api.dismissInsight(tripId, insightId);
      fetchSummary();
    } catch (err) {
      console.error("Failed to dismiss insight:", err);
    }
  };

  const handleOpenProposal = (insight: TravelInsight) => {
    if (insight.proposals && insight.proposals.length > 0) {
      setSelectedProposal(insight.proposals[0]);
      setIsProposalModalOpen(true);
    }
  };

  if (!summary && loading) {
    return (
      <div className="p-6 rounded-2xl bg-stone-900/60 border border-stone-800/80 animate-pulse flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-800" />
          <div className="space-y-2">
            <div className="w-48 h-4 rounded bg-stone-800" />
            <div className="w-32 h-3 rounded bg-stone-800/60" />
          </div>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const hasActiveIssues = summary.active_insights && summary.active_insights.length > 0;

  return (
    <div className="space-y-4">
      {/* Live Trip Status Cockpit Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        hasActiveIssues
          ? "bg-gradient-to-r from-stone-900 via-amber-950/20 to-stone-900 border-amber-500/30 shadow-lg shadow-amber-950/10"
          : "bg-stone-900/80 border-stone-800/80 shadow-md"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 sm:mt-0 ${
              hasActiveIssues 
                ? "bg-amber-500/10 border border-amber-500/20 text-amber-400" 
                : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
            }`}>
              {hasActiveIssues ? (
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono uppercase tracking-wider font-semibold text-stone-400">
                  Live Operations
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider font-semibold uppercase ${
                  summary.freshness === "LIVE"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-stone-800 text-stone-400 border border-stone-700"
                }`}>
                  {summary.freshness}
                </span>
                <span className="text-[11px] text-stone-500 font-mono">
                  Cadence: {summary.cadence_mode}
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-serif font-bold text-stone-100 mt-0.5">
                {summary.live_status_headline}
              </h4>
            </div>
          </div>

          <button
            onClick={() => fetchSummary(true)}
            disabled={loading}
            className="self-start sm:self-center px-3.5 py-2 rounded-xl text-xs font-medium text-stone-300 hover:text-stone-100 bg-stone-800/80 hover:bg-stone-700/80 border border-stone-700/60 transition flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
            <span>{loading ? "Verifying..." : "Verify Status"}</span>
          </button>
        </div>
      </div>

      {/* Active Insights & Actionable Field Notes */}
      {hasActiveIssues && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-mono uppercase tracking-wider font-semibold text-stone-400 flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Active Field Intelligence ({summary.active_insights.length})</span>
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {summary.active_insights.map((insight) => {
              const hasProposal = insight.proposals && insight.proposals.length > 0;
              return (
                <div
                  key={insight.id}
                  className="p-4 sm:p-5 rounded-2xl bg-stone-900 border border-stone-800/90 hover:border-stone-700 transition space-y-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase ${
                        insight.category === "WEATHER" 
                          ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                          : insight.category === "TRANSPORT"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {insight.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold ${
                        insight.severity === "HIGH" || insight.severity === "CRITICAL"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-stone-800 text-stone-400"
                      }`}>
                        {insight.severity} SEVERITY
                      </span>
                    </div>

                    <button
                      onClick={() => handleDismiss(insight.id)}
                      className="p-1 rounded-lg text-stone-500 hover:text-stone-300 hover:bg-stone-800 transition"
                      title="Dismiss insight"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <h5 className="text-sm sm:text-base font-serif font-bold text-stone-100">
                      {insight.title}
                    </h5>
                    <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-sans">
                      {insight.explanation}
                    </p>
                  </div>

                  {/* Recommendation & Action Bar */}
                  <div className="pt-2 border-t border-stone-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-stone-400 font-sans italic">
                      💡 {insight.recommendation}
                    </div>

                    {hasProposal && (
                      <button
                        onClick={() => handleOpenProposal(insight)}
                        className="self-end sm:self-center px-4 py-2 rounded-xl text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 transition flex items-center gap-1.5 shadow-md shadow-amber-950/20"
                      >
                        <span>Review Plan</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Replan Proposal Modal */}
      {selectedProposal && (
        <ReplanProposalModal
          proposal={selectedProposal}
          tripId={tripId}
          isOpen={isProposalModalOpen}
          onClose={() => {
            setIsProposalModalOpen(false);
            setSelectedProposal(null);
          }}
          onApplied={(updatedTrip) => {
            setIsProposalModalOpen(false);
            setSelectedProposal(null);
            fetchSummary();
            if (onTripUpdated) {
              onTripUpdated(updatedTrip);
            }
          }}
        />
      )}
    </div>
  );
};
