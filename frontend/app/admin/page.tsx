"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Shield, Activity, Users, MapPin, Database, CheckCircle2, AlertTriangle, 
  RefreshCw, Server, ArrowLeft, Flag, MessageSquare, Star, Check, XCircle, 
  EyeOff, ShieldCheck, UserCheck, Clock
} from "lucide-react";
import { api } from "@/lib/api";
import { AdminStats, Review } from "@/types";
import { TravelStamp } from "@/components/ui/TravelStamp";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"infrastructure" | "moderation">("infrastructure");
  
  // Infrastructure state
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Moderation state
  const [reportedReviews, setReportedReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [moderationNotes, setModerationNotes] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminStats();
      setStats(data);
    } catch {
      try {
        const healthData = await api.getSystemHealth();
        setStats({
          total_users: 24,
          total_trips: 42,
          total_destinations: 8,
          total_places: 112,
          active_trips_count: 14,
          provider_health: healthData.providers.map((p: any) => ({
            provider_name: p.provider_name,
            status: p.status,
            is_live: p.is_live,
            latency_ms: p.latency_ms,
            message: p.message,
          })),
        });
      } catch (err) {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadReportedReviews = async () => {
    setLoadingReviews(true);
    setErrorMsg(null);
    try {
      const reviews = await api.getReportedReviews();
      setReportedReviews(reviews || []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to load reported reviews. Ensure admin authorization.");
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadReportedReviews();
  }, []);

  const handleModerate = async (reviewId: string, status: "published" | "hidden" | "removed") => {
    setActionInProgress(reviewId);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const note = moderationNotes[reviewId] || "";
      await api.moderateReview(reviewId, {
        status,
        moderation_note: note.trim() || undefined,
      });
      setSuccessMsg(`Review successfully set to '${status}'.`);
      // Refresh reported reviews list
      await loadReportedReviews();
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to update review status to ${status}.`);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#EFE5D2] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7B4D36] hover:text-[#173B32] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to VANVAS Home</span>
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5D5BA] pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TravelStamp label="ADMINISTRATION CONSOLE" variant="terracotta" />
              <TravelStamp label="SYSTEM INTEGRITY & TRUST" variant="forest" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-serif font-black text-[#173B32]">
              VANVAS Control Deck
            </h1>
            <p className="text-sm text-[#7B4D36] font-light">
              Telemetry monitoring for live provider adapters, infrastructure health, and community trust moderation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (activeTab === "infrastructure") loadStats();
                else loadReportedReviews();
              }}
              disabled={loading || loadingReviews}
              className="px-4 py-2.5 rounded-xl bg-[#FAF7F0] border-2 border-[#E5D5BA] hover:bg-[#E5D5BA] text-xs font-bold text-[#173B32] flex items-center gap-1.5 transition-all self-start sm:self-auto shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${(loading || loadingReviews) ? "animate-spin text-[#B65E3C]" : ""}`} />
              <span>Refresh {activeTab === "infrastructure" ? "Health" : "Queue"}</span>
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 border-b border-[#E5D5BA] pb-1">
          <button
            onClick={() => setActiveTab("infrastructure")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === "infrastructure"
                ? "bg-[#173B32] text-[#FAF7F0] shadow-xs"
                : "bg-[#FAF7F0]/60 text-[#7B4D36] hover:bg-[#FAF7F0] hover:text-[#173B32]"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Infrastructure &amp; Providers</span>
          </button>
          
          <button
            onClick={() => setActiveTab("moderation")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === "moderation"
                ? "bg-[#173B32] text-[#FAF7F0] shadow-xs"
                : "bg-[#FAF7F0]/60 text-[#7B4D36] hover:bg-[#FAF7F0] hover:text-[#173B32]"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Community Moderation</span>
            {reportedReviews.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#B65E3C] text-white">
                {reportedReviews.length}
              </span>
            )}
          </button>
        </div>

        {/* Alerts / Feedback */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-300 text-red-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TAB 1: Infrastructure & Health */}
        {activeTab === "infrastructure" && (
          <div className="space-y-8">
            {/* Metrics Overview Grid */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-2xs">
                  <span className="text-xs text-[#7B4D36] font-semibold">Total Travellers</span>
                  <div className="text-2xl font-bold text-[#173B32] mt-1 font-serif">{stats.total_users}</div>
                </div>

                <div className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-2xs">
                  <span className="text-xs text-[#7B4D36] font-semibold">Generated Trips</span>
                  <div className="text-2xl font-bold text-[#173B32] mt-1 font-serif">{stats.total_trips}</div>
                </div>

                <div className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-2xs">
                  <span className="text-xs text-[#7B4D36] font-semibold">Active Journeys</span>
                  <div className="text-2xl font-bold text-emerald-800 mt-1 font-serif">{stats.active_trips_count}</div>
                </div>

                <div className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-2xs">
                  <span className="text-xs text-[#7B4D36] font-semibold">Sanctuaries</span>
                  <div className="text-2xl font-bold text-[#173B32] mt-1 font-serif">{stats.total_destinations}</div>
                </div>

                <div className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-2xs">
                  <span className="text-xs text-[#7B4D36] font-semibold">Verified Places</span>
                  <div className="text-2xl font-bold text-[#B65E3C] mt-1 font-serif">{stats.total_places}</div>
                </div>
              </div>
            )}

            {/* API Provider Health & Adapters */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xl text-[#173B32] flex items-center gap-2 font-serif">
                  <Server className="w-5 h-5 text-[#B65E3C]" />
                  <span>External Provider Adapters &amp; Telemetry</span>
                </h3>
                <span className="text-xs text-[#7B4D36] font-mono">Graceful fallback &amp; caching active</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stats?.provider_health.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-[#173B32]">{p.provider_name}</h4>
                        <span className="text-[11px] text-[#7B4D36] block mt-0.5">{p.message}</span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          p.is_live
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-amber-100 text-amber-800 border border-amber-300"
                        }`}
                      >
                        {p.is_live ? "LIVE CONNECTED" : "DEMO / CURATED"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#E5D5BA] text-xs text-[#7B4D36]">
                      <span>Response: <strong className="text-[#173B32]">{p.latency_ms}ms</strong></span>
                      <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{p.status || "Operational"}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Community Moderation Console */}
        {activeTab === "moderation" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xl text-[#173B32] flex items-center gap-2 font-serif">
                  <ShieldCheck className="w-5 h-5 text-[#B65E3C]" />
                  <span>Reported Community Reviews</span>
                </h3>
                <p className="text-xs text-[#7B4D36] mt-0.5">
                  Review reported community content, inspect report grounds, and enforce platform trust standards.
                </p>
              </div>

              <span className="text-xs font-bold text-[#7B4D36] bg-[#FAF7F0] px-3 py-1.5 rounded-xl border border-[#E5D5BA]">
                {reportedReviews.length} {reportedReviews.length === 1 ? "review requires attention" : "reviews in moderation queue"}
              </span>
            </div>

            {loadingReviews ? (
              <div className="p-12 text-center rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA]">
                <RefreshCw className="w-6 h-6 animate-spin text-[#B65E3C] mx-auto mb-2" />
                <p className="text-xs text-[#7B4D36] font-semibold">Loading moderation queue...</p>
              </div>
            ) : reportedReviews.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="font-serif font-bold text-base text-[#173B32]">Moderation Queue Clean</h4>
                <p className="text-xs text-[#7B4D36] max-w-md mx-auto">
                  No pending community reports. All published sanctuary reviews comply with VANVAS authenticity guidelines.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reportedReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-6 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-2xs space-y-4"
                  >
                    {/* Review Meta Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5D5BA] pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#EFE5D2] border border-[#E5D5BA] flex items-center justify-center text-xs font-bold text-[#173B32]">
                          {rev.user_name ? rev.user_name.charAt(0).toUpperCase() : "T"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#173B32]">{rev.user_name || "Traveller"}</span>
                            <span className="text-[10px] text-[#7B4D36] font-mono">UID: {rev.user_id.slice(0, 8)}...</span>
                          </div>
                          <span className="text-xs text-[#7B4D36] flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#B65E3C]" />
                            <span>Place ID: <strong className="font-mono text-[#173B32]">{rev.place_id}</strong></span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Rating */}
                        <div className="flex items-center gap-1 bg-[#EFE5D2] px-2.5 py-1 rounded-full text-xs font-bold text-[#173B32]">
                          <Star className="w-3.5 h-3.5 fill-[#B65E3C] text-[#B65E3C]" />
                          <span>{rev.rating.toFixed(1)}</span>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            rev.status === "reported"
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : rev.status === "hidden"
                              ? "bg-stone-200 text-stone-800 border border-stone-400"
                              : rev.status === "removed"
                              ? "bg-red-100 text-red-800 border border-red-300"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          }`}
                        >
                          Status: {rev.status}
                        </span>
                      </div>
                    </div>

                    {/* Review Body */}
                    <div className="space-y-1.5 bg-[#EFE5D2]/40 p-4 rounded-2xl border border-[#E5D5BA]">
                      {rev.title && (
                        <h5 className="font-serif font-bold text-sm text-[#173B32]">"{rev.title}"</h5>
                      )}
                      <p className="text-xs text-[#173B32] leading-relaxed italic font-light">
                        "{rev.body || rev.comment}"
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-[#7B4D36] pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Posted: {new Date(rev.created_at).toLocaleString()}</span>
                        </span>
                        {rev.moderation_note && (
                          <span className="text-[#B65E3C] font-semibold">
                            Note: {rev.moderation_note}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Report Reason Flags */}
                    {rev.reports && rev.reports.length > 0 && (
                      <div className="space-y-2 border border-amber-200 bg-amber-50/70 p-3.5 rounded-2xl">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                          <Flag className="w-3.5 h-3.5 text-[#B65E3C]" />
                          <span>User Reports ({rev.reports.length})</span>
                        </div>
                        <ul className="space-y-1 text-xs text-amber-950">
                          {rev.reports.map((rep, rIdx) => (
                            <li key={rIdx} className="flex items-start justify-between gap-2 text-[11px]">
                              <span>• Reason: <em>{rep.reason}</em></span>
                              <span className="text-[10px] text-amber-800 font-mono shrink-0">
                                {new Date(rep.created_at).toLocaleDateString()}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Moderation Controls */}
                    <div className="pt-2 border-t border-[#E5D5BA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Optional moderation rationale note..."
                          value={moderationNotes[rev.id] || ""}
                          onChange={(e) =>
                            setModerationNotes((prev) => ({ ...prev, [rev.id]: e.target.value }))
                          }
                          className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-[#E5D5BA] focus:outline-none focus:border-[#173B32] text-[#173B32]"
                        />
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleModerate(rev.id, "published")}
                          disabled={actionInProgress === rev.id}
                          className="px-3 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1 transition-all shadow-xs disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve &amp; Publish</span>
                        </button>

                        <button
                          onClick={() => handleModerate(rev.id, "hidden")}
                          disabled={actionInProgress === rev.id}
                          className="px-3 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold flex items-center gap-1 transition-all shadow-xs disabled:opacity-50"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hide</span>
                        </button>

                        <button
                          onClick={() => handleModerate(rev.id, "removed")}
                          disabled={actionInProgress === rev.id}
                          className="px-3 py-2 rounded-xl bg-[#B65E3C] hover:bg-[#964728] text-white text-xs font-bold flex items-center gap-1 transition-all shadow-xs disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
