"use client";

import React, { useState } from "react";
import {
  Users, Crown, UserMinus, LogOut, ShieldAlert, Sparkles,
  Plus, Check, AlertCircle, RefreshCw
} from "lucide-react";
import { TripMemberItem } from "@/types";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface TripMembersSectionProps {
  tripId: string;
  members: TripMemberItem[];
  onMembersUpdated: () => void;
  onOpenInviteModal: () => void;
  className?: string;
}

export const TripMembersSection: React.FC<TripMembersSectionProps> = ({
  tripId,
  members,
  onMembersUpdated,
  onOpenInviteModal,
  className = "",
}) => {
  const { user } = useAuth();
  const router = useRouter();

  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<TripMemberItem | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Check if current user is owner
  const currentMember = members.find((m) => m.user_id === user?.id || (user?.email && m.full_name === user?.full_name));
  const isOwner = currentMember?.role === "owner" || members.find((m) => m.role === "owner")?.user_id === user?.id;

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await api.removeTripMember(tripId, memberToRemove.user_id);
      setMemberToRemove(null);
      onMembersUpdated();
    } catch (err: any) {
      setActionError(err.message || "Failed to remove member.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmLeave = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await api.leaveTrip(tripId);
      setShowLeaveConfirm(false);
      router.push("/trips");
    } catch (err: any) {
      setActionError(err.message || "Failed to leave trip.");
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Active explorer";
    try {
      const d = new Date(dateStr);
      return `Joined ${d.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`;
    } catch {
      return "Active explorer";
    }
  };

  return (
    <div className={`p-6 sm:p-7 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E5D5BA]/60">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#B65E3C] font-bold uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>Expedition Fellowship</span>
          </div>
          <h3 className="text-xl font-serif font-bold text-[#173B32] mt-0.5 flex items-center gap-2">
            <span>Trip Members &amp; Co-Travelers</span>
            <span className="text-xs font-sans font-bold px-2 py-0.5 rounded-full bg-[#173B32] text-[#EFE5D2]">
              {members.length}
            </span>
          </h3>
        </div>

        <button
          type="button"
          onClick={onOpenInviteModal}
          className="px-4 py-2 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-[#B49252]" />
          <span>Invite Friends</span>
        </button>
      </div>

      {actionError && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Members List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {members.map((member) => {
          const isMemberOwner = member.role === "owner";
          const isCurrentUser = member.user_id === user?.id || (user?.email && member.full_name === user?.full_name);

          return (
            <div
              key={member.id || member.user_id}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                isMemberOwner
                  ? "bg-white border-[#173B32]/30 shadow-xs ring-1 ring-[#173B32]/10"
                  : "bg-white/70 hover:bg-white border-[#D8CBB2]"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-serif font-bold text-sm shrink-0 ${
                  isMemberOwner
                    ? "bg-[#173B32] text-[#EFE5D2]"
                    : "bg-[#B65E3C] text-[#EFE5D2]"
                }`}>
                  {member.full_name ? member.full_name.charAt(0).toUpperCase() : "T"}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-[#173B32] truncate">
                      {member.full_name}
                    </span>
                    {isCurrentUser && (
                      <span className="text-[10px] text-[#B49252] font-semibold">(You)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#20211D]/60 mt-0.5">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider ${
                      isMemberOwner
                        ? "bg-[#173B32]/10 text-[#173B32]"
                        : "bg-[#B49252]/15 text-[#B49252]"
                    }`}>
                      {isMemberOwner && <Crown className="w-2.5 h-2.5" />}
                      {member.role}
                    </span>
                    <span>•</span>
                    <span className="truncate">{formatDate(member.joined_at)}</span>
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div>
                {isOwner && !isMemberOwner && (
                  <button
                    type="button"
                    onClick={() => setMemberToRemove(member)}
                    className="p-2 rounded-xl text-red-600/70 hover:text-red-700 hover:bg-red-50 transition-colors"
                    title={`Remove ${member.full_name} from expedition`}
                    aria-label={`Remove ${member.full_name}`}
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                )}

                {!isOwner && isCurrentUser && (
                  <button
                    type="button"
                    onClick={() => setShowLeaveConfirm(true)}
                    className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-[11px] font-bold flex items-center gap-1 transition-colors"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Leave</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Remove Member Confirmation Modal */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 bg-[#173B32]/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#FAF4E8] rounded-2xl p-6 max-w-sm w-full border border-[#D8CBB2] shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-red-100 text-red-700">
                <UserMinus className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-base text-[#173B32]">
                  Remove {memberToRemove.full_name}?
                </h4>
                <p className="text-xs text-[#20211D]/75 mt-1 leading-relaxed">
                  They will lose access to this trip’s itinerary, voting, and travel ledger.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl border border-[#D8CBB2] text-xs font-semibold text-[#20211D] hover:bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-[#EFE5D2] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Remove Member</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Trip Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 bg-[#173B32]/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#FAF4E8] rounded-2xl p-6 max-w-sm w-full border border-[#D8CBB2] shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-red-100 text-red-700">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-base text-[#173B32]">
                  Leave this Expedition?
                </h4>
                <p className="text-xs text-[#20211D]/75 mt-1 leading-relaxed">
                  You will be removed from the member list and voting consensus for this trip.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(false)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl border border-[#D8CBB2] text-xs font-semibold text-[#20211D] hover:bg-white"
              >
                Stay
              </button>
              <button
                type="button"
                onClick={handleConfirmLeave}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-[#EFE5D2] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Leave Expedition</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
