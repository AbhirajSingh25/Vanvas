"use client";

import React, { useState } from "react";
import {
  X, Shield, MapPin, Compass, Calendar, Heart, MessageCircle,
  AlertTriangle, ShieldAlert, Check, CheckCircle2, User, Sparkles,
  Footprints, Ban, Flag
} from "lucide-react";
import { SoloTravelerCard } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { TravelStamp } from "@/components/ui/TravelStamp";
import { api } from "@/lib/api";

interface TravelerDetailModalProps {
  traveler: SoloTravelerCard | null;
  isOpen: boolean;
  onClose: () => void;
  onConnectionUpdated?: (userId: string, newStatus: string) => void;
  destinationName?: string;
  trekSlug?: string;
}

export function TravelerDetailModal({
  traveler,
  isOpen,
  onClose,
  onConnectionUpdated,
  destinationName,
  trekSlug,
}: TravelerDetailModalProps) {
  const [connectMsg, setConnectMsg] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Safety states
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  if (!isOpen || !traveler) return null;

  const handleConnect = async () => {
    setIsSending(true);
    setActionError(null);
    try {
      await api.sendConnectionRequest({
        receiver_user_id: traveler.user_id,
        destination_id: undefined,
        trek_slug: trekSlug || traveler.trek_slug,
        message: connectMsg.trim() || undefined,
      });
      setActionSuccess("Connection request sent! You will be notified when they accept.");
      onConnectionUpdated?.(traveler.user_id, "PENDING_OUTGOING");
      setTimeout(() => {
        setActionSuccess(null);
        onClose();
      }, 2000);
    } catch (err: any) {
      setActionError(err.message || "Failed to send connection request.");
    } finally {
      setIsSending(false);
    }
  };

  const handleBlock = async () => {
    try {
      await api.blockTraveler({ blocked_user_id: traveler.user_id });
      setActionSuccess("Traveler has been blocked.");
      onConnectionUpdated?.(traveler.user_id, "BLOCKED");
      setTimeout(() => {
        setShowBlockConfirm(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setActionError(err.message || "Failed to block traveler.");
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      setActionError("Please describe the issue.");
      return;
    }
    setIsReporting(true);
    try {
      await api.reportTraveler({
        reported_user_id: traveler.user_id,
        reason: reportReason.trim(),
      });
      setActionSuccess("Report submitted. Our moderation team will investigate.");
      setShowReportModal(false);
      setTimeout(() => {
        setActionSuccess(null);
        onClose();
      }, 2000);
    } catch (err: any) {
      setActionError(err.message || "Failed to submit report.");
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A100D]/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FAF7F0] border border-[#D8CBB2] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#173B32] p-6 text-[#FAF4E8] relative flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              user={{
                full_name: traveler.full_name,
                avatar_url: traveler.avatar_url,
                avatar_type: traveler.avatar_type,
                avatar_preset: traveler.avatar_preset,
              }}
              size="xl"
              showBorder
              borderColor="border-[#B49252]"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-xl font-bold text-[#FAF4E8]">
                  {traveler.full_name}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#FAF4E8]/10 text-[#B49252] text-[10px] font-mono font-bold uppercase tracking-wider">
                  {traveler.travel_mode}
                </span>
              </div>
              <p className="text-xs text-[#8FA699] flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3 h-3 text-[#E05A2B]" />
                <span>{traveler.proximity_label}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#FAF4E8]/10 hover:bg-[#FAF4E8]/20 text-[#FAF4E8] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-[#20211D]">
          {/* Status Banners */}
          {actionSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}
          {actionError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Travel Style & Pace Badges */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-[#D8CBB2] rounded-2xl p-3 shadow-xs">
              <span className="text-[10px] uppercase tracking-wider text-[#20211D]/60 font-bold block">
                Travel Style
              </span>
              <span className="text-xs font-bold text-[#173B32] flex items-center gap-1 mt-0.5">
                <Compass className="w-3.5 h-3.5 text-[#B49252]" />
                {traveler.travel_style}
              </span>
            </div>

            <div className="bg-white border border-[#D8CBB2] rounded-2xl p-3 shadow-xs">
              <span className="text-[10px] uppercase tracking-wider text-[#20211D]/60 font-bold block">
                Trek Pace
              </span>
              <span className="text-xs font-bold text-[#173B32] flex items-center gap-1 mt-0.5">
                <Footprints className="w-3.5 h-3.5 text-[#E05A2B]" />
                {traveler.trek_pace}
              </span>
            </div>
          </div>

          {/* Overlap Details */}
          {traveler.overlap_dates_label && (
            <div className="bg-[#173B32]/5 border border-[#173B32]/15 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#B49252]" />
                <div>
                  <div className="text-[11px] font-bold text-[#173B32]">
                    Overlapping Dates
                  </div>
                  <div className="text-xs text-[#20211D]/80">
                    {traveler.overlap_dates_label}
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#B49252]/15 text-[#B49252] text-[10px] font-bold">
                {traveler.overlapping_days} Days
              </span>
            </div>
          )}

          {/* Bio */}
          {traveler.bio && (
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-[#20211D]/60 font-bold">
                Traveler Journal Note
              </span>
              <p className="text-xs text-[#20211D]/80 italic bg-white border border-[#D8CBB2] rounded-2xl p-3 leading-relaxed">
                &ldquo;{traveler.bio}&rdquo;
              </p>
            </div>
          )}

          {/* Interests */}
          {traveler.interests && traveler.interests.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider text-[#20211D]/60 font-bold">
                Shared Interests
              </span>
              <div className="flex flex-wrap gap-1.5">
                {traveler.interests.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-full bg-white border border-[#D8CBB2] text-[11px] font-medium text-[#173B32]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Privacy & Safety Guarantee */}
          <div className="p-3 rounded-2xl bg-[#E5D5BA]/30 border border-[#D8CBB2] text-[11px] text-[#20211D]/70 flex items-start gap-2">
            <Shield className="w-4 h-4 text-[#173B32] shrink-0 mt-0.5" />
            <span>
              VANVAS Circles protects traveler safety: exact GPS coordinates, phone numbers, and private contact info are never shared. Meetups occur only at verified public POIs.
            </span>
          </div>

          {/* Connect Input & Action */}
          {traveler.connection_status === "NONE" && (
            <div className="space-y-2 pt-2 border-t border-[#D8CBB2]/60">
              <label className="text-[11px] font-bold text-[#173B32] block">
                Introduce Yourself (Optional)
              </label>
              <textarea
                value={connectMsg}
                onChange={(e) => setConnectMsg(e.target.value)}
                placeholder="Hi! I'm also planning to explore the trails around these dates..."
                className="w-full text-xs p-3 rounded-xl border border-[#D8CBB2] bg-white focus:outline-none focus:ring-1 focus:ring-[#173B32] resize-none h-18"
              />
              <button
                onClick={handleConnect}
                disabled={isSending}
                className="w-full py-2.5 rounded-xl bg-[#E05A2B] hover:bg-[#C8491D] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-60"
              >
                {isSending ? "Sending Connection Request..." : "Send Connection Request"}
              </button>
            </div>
          )}

          {traveler.connection_status === "PENDING_OUTGOING" && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold text-center">
              Connection Request Pending Approval
            </div>
          )}

          {traveler.connection_status === "ACCEPTED" && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              Connected Traveler — Eligible for Circle Invitations
            </div>
          )}

          {/* Safety Options: Block & Report */}
          <div className="pt-3 border-t border-[#D8CBB2]/60 flex items-center justify-between text-xs">
            <button
              onClick={() => setShowBlockConfirm(true)}
              className="text-[#20211D]/60 hover:text-red-700 flex items-center gap-1 font-semibold cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5" />
              Block Traveler
            </button>
            <button
              onClick={() => setShowReportModal(true)}
              className="text-[#20211D]/60 hover:text-red-700 flex items-center gap-1 font-semibold cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5" />
              Report Traveler
            </button>
          </div>

          {/* Block Confirmation Drawer */}
          {showBlockConfirm && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 space-y-3 animate-fadeIn">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                Block {traveler.full_name}?
              </div>
              <p className="text-[11px] text-red-800">
                This traveler will no longer be visible in your matches, discovery lists, or circles.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleBlock}
                  className="px-3 py-1.5 rounded-lg bg-red-700 text-white font-bold text-xs cursor-pointer"
                >
                  Yes, Block
                </button>
                <button
                  onClick={() => setShowBlockConfirm(false)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-red-300 font-bold text-xs text-red-900 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Report Modal */}
          {showReportModal && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-2 animate-fadeIn">
              <div className="font-bold flex items-center gap-1.5">
                <Flag className="w-4 h-4 text-amber-700" />
                Report Safety Issue
              </div>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Please provide details of inappropriate behavior, harassment, or safety concern..."
                className="w-full text-xs p-2.5 rounded-xl border border-amber-300 bg-white focus:outline-none resize-none h-16"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 font-bold text-xs text-amber-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReport}
                  disabled={isReporting}
                  className="px-3 py-1.5 rounded-lg bg-amber-800 text-white font-bold text-xs cursor-pointer disabled:opacity-60"
                >
                  {isReporting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
