"use client";

import React, { useState, useEffect } from "react";
import {
  X, Check, Copy, Share2, Sparkles, MapPin, Calendar,
  Users, ShieldCheck, ArrowRight, ExternalLink
} from "lucide-react";
import { TravelStamp } from "@/components/ui/TravelStamp";
import { DestinationArtwork } from "@/components/brand/DestinationArtwork";

interface TripInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  tripTitle: string;
  destinationName: string;
  destinationSlug?: string;
  startDate: string;
  endDate: string;
  numDays: number;
  inviteCode: string;
}

export const TripInviteModal: React.FC<TripInviteModalProps> = ({
  isOpen,
  onClose,
  tripId,
  tripTitle,
  destinationName,
  destinationSlug = "manali",
  startDate,
  endDate,
  numDays,
  inviteCode,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined" && !!navigator.share) {
      setCanShare(true);
    }
  }, []);

  // Keyboard Escape listener
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

  const origin = typeof window !== "undefined" ? window.location.origin : "https://vanvas.app";
  const inviteUrl = `${origin}/join/${inviteCode}`;

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleCopyCode = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Join my VANVAS expedition to ${destinationName}!`,
          text: `Join ${tripTitle} in ${destinationName} (${startDate} - ${endDate}) on VANVAS. Vote on activities privately and build our mountain journey together!`,
          url: inviteUrl,
        });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#173B32]/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
    >
      <div
        className="relative w-full max-w-lg bg-[#FAF4E8] rounded-3xl shadow-2xl border-2 border-[#D8CBB2] overflow-hidden flex flex-col animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Editorial Top Passport Header */}
        <div className="bg-[#173B32] text-[#EFE5D2] px-6 py-5 relative overflow-hidden flex items-center justify-between border-b border-[#D8CBB2]">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#B49252] font-bold">
              <Users className="w-3.5 h-3.5" />
              <span>EXPEDITION COLLABORATION</span>
            </div>
            <h2 id="invite-modal-title" className="text-xl font-serif font-bold text-[#EFE5D2] mt-0.5">
              Invite Friends to the Journey
            </h2>
            <span className="font-devanagari text-xs text-[#B49252] opacity-90">
              (सफ़र के साथी जोड़ें)
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#EFE5D2]/70 hover:text-[#EFE5D2] hover:bg-white/10 transition-colors z-20"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Trip Summary Card */}
          <div className="p-4 rounded-2xl bg-white/80 border border-[#D8CBB2] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#B65E3C]">
                TARGET EXPEDITION
              </span>
              <div className="flex items-center gap-1.5">
                <TravelStamp label={`${numDays} DAYS`} variant="forest" />
              </div>
            </div>

            <h3 className="font-serif font-bold text-lg text-[#173B32] leading-tight">
              {tripTitle}
            </h3>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#20211D]/75 font-mono">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#B65E3C]" />
                <span>{destinationName}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#B49252]" />
                <span>{startDate} to {endDate}</span>
              </span>
            </div>
          </div>

          {/* Invite Code Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#173B32] flex items-center justify-between">
              <span>EXPEDITION INVITE CODE</span>
              <span className="text-[11px] text-[#20211D]/60 font-mono">CODE-ONLY ACCESS</span>
            </label>

            <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#EFE5D2] border border-[#D8CBB2]">
              <span className="flex-1 font-mono font-bold text-xl sm:text-2xl text-[#173B32] tracking-widest text-center">
                {inviteCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  copiedCode
                    ? "bg-[#173B32] text-[#EFE5D2]"
                    : "bg-white text-[#173B32] hover:bg-[#FAF4E8] border border-[#D8CBB2]"
                }`}
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#B49252]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Direct Shareable Link */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#173B32]">
              SHAREABLE INVITE LINK
            </label>

            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white border border-[#D8CBB2]">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="flex-1 text-xs text-[#20211D] font-mono bg-transparent outline-none truncate px-2"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
                  copiedLink
                    ? "bg-[#173B32] text-[#EFE5D2]"
                    : "bg-[#FAF4E8] text-[#173B32] hover:bg-[#E5D5BA]/60 border border-[#D8CBB2]"
                }`}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#B49252]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Privacy & Voting Note */}
          <div className="p-3.5 rounded-2xl bg-[#173B32]/5 border border-[#173B32]/15 flex items-start gap-2.5 text-xs text-[#173B32]">
            <ShieldCheck className="w-4 h-4 text-[#B49252] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Invited members gain access to view the itinerary, add packing items, and cast private votes on dining &amp; trails.
            </p>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="px-6 py-4 bg-[#FAF4E8] border-t border-[#D8CBB2] flex flex-wrap items-center justify-between gap-3">
          {canShare ? (
            <button
              type="button"
              onClick={handleNativeShare}
              className="px-5 py-2.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5 text-[#B49252]" />
              <span>Share Trip</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-5 py-2.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm"
            >
              <Copy className="w-3.5 h-3.5 text-[#B49252]" />
              <span>Copy Invite Link</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] text-xs font-bold uppercase tracking-wider transition-all shadow-md ml-auto"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
