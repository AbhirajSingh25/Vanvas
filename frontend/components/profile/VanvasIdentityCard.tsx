"use client";

import React, { useState } from "react";
import Link from "next/link";
import { User } from "@/types";
import { api } from "@/lib/api";
import {
  Copy, Check, Share2, QrCode, Shield, RefreshCw, Users, Lock, Unlock, ExternalLink
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { motion, AnimatePresence } from "motion/react";

interface VanvasIdentityCardProps {
  user: User | null;
  onUserUpdated?: (updated: Partial<User>) => void;
}

export function VanvasIdentityCard({ user, onUserUpdated }: VanvasIdentityCardProps) {
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [privacyUpdating, setPrivacyUpdating] = useState(false);
  const [privacyAllowed, setPrivacyAllowed] = useState(
    user?.preferences?.allow_friend_requests_via_id ?? true
  );

  const vanvasId = user?.vanvas_id || "VNV-VANV-ASAI";
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/friends?add=${vanvasId}`
    : `https://vanvasai.vercel.app/friends?add=${vanvasId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(vanvasId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error("Failed to copy VANVAS ID:", err);
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${user?.full_name}'s VANVAS Traveler Passport`,
          text: `Add me on VANVAS with my traveler ID: ${vanvasId}`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to copy if user dismissed or unsupported
      }
    }
    handleCopy();
  };

  const handleTogglePrivacy = async () => {
    const nextVal = !privacyAllowed;
    setPrivacyAllowed(nextVal);
    setPrivacyUpdating(true);
    try {
      await api.updatePreferences({ allow_friend_requests_via_id: nextVal });
      if (onUserUpdated && user) {
        onUserUpdated({
          preferences: { ...user.preferences, allow_friend_requests_via_id: nextVal }
        });
      }
    } catch (err) {
      console.error("Failed to update friend discovery privacy:", err);
      setPrivacyAllowed(!nextVal); // rollback
    } finally {
      setPrivacyUpdating(false);
    }
  };

  const handleRegenerateId = async () => {
    if (!window.confirm("Regenerate your VANVAS ID? Old shared links with your current ID will no longer work.")) {
      return;
    }
    setRegenerating(true);
    try {
      const res = await api.regenerateMyVanvasId();
      if (onUserUpdated && user) {
        onUserUpdated({ vanvas_id: res.vanvas_id });
      }
    } catch (err) {
      console.error("Failed to regenerate VANVAS ID:", err);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-br from-[#173B32] to-[#0F2922] text-[#FAF7F0] border-2 border-[#B49252]/40 rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden">
        {/* Subtle decorative gold topography watermark */}
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full border-8 border-[#B49252]/10 pointer-events-none" />
        <div className="absolute top-3 right-5 text-[10px] font-bold uppercase tracking-widest text-[#B49252] border border-[#B49252]/30 px-2 py-0.5 rounded-full">
          Official Traveler Passport
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          {/* Identity Section */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar user={user} size="xl" showBorder borderColor="border-[#B49252]" />
              <div className="absolute -bottom-1 -right-1 bg-[#B49252] text-[#173B32] p-1 rounded-full shadow-xs">
                <Shield className="w-3 h-3 stroke-[2.5]" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {user?.full_name}
                </h3>
              </div>
              <p className="text-xs text-[#E5D5BA] font-medium mt-0.5">
                {user?.preferences?.preferred_travel_style || "Explorer"} · {user?.preferences?.companion_style || "Solo Traveler"}
              </p>

              {/* VANVAS ID Chip */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <div className="inline-flex items-center gap-2 bg-black/30 border border-[#B49252]/50 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-mono font-bold tracking-wider text-[#FAF4E8]">
                  <span>{vanvasId}</span>
                  <button
                    onClick={handleCopy}
                    className="text-[#B49252] hover:text-white transition-colors p-1 rounded active:scale-90"
                    title="Copy VANVAS ID"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <button
                  onClick={() => setShowQrModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#B49252]/20 hover:bg-[#B49252]/30 text-xs font-semibold text-[#E5D5BA] transition-colors active:scale-95 border border-[#B49252]/30"
                  title="Show QR Code"
                >
                  <QrCode className="w-3.5 h-3.5 text-[#B49252]" />
                  <span>QR</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#B49252]/20 hover:bg-[#B49252]/30 text-xs font-semibold text-[#E5D5BA] transition-colors active:scale-95 border border-[#B49252]/30"
                  title="Share ID"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#B49252]" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Hub Actions */}
          <div className="flex flex-col sm:flex-row md:flex-col items-stretch md:items-end gap-3 w-full md:w-auto">
            <Link
              href="/friends"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-white text-xs font-bold transition-all shadow-md active:scale-97 text-center"
            >
              <Users className="w-4 h-4" />
              <span>Friends & Connections</span>
            </Link>

            <Link
              href="/circles"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all border border-white/20 active:scale-97 text-center"
            >
              <span>Crew Circles (मण्डली)</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#B49252]" />
            </Link>
          </div>
        </div>

        {/* Bottom Bar: Privacy Control & Regenerate Option */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#E5D5BA]">
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleTogglePrivacy}
              disabled={privacyUpdating}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                privacyAllowed
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                  : "bg-amber-950/40 border-amber-500/40 text-amber-300"
              }`}
            >
              {privacyAllowed ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              <span>{privacyAllowed ? "Friend requests allowed via ID" : "ID discovery disabled"}</span>
            </button>
            <span className="text-[11px] text-[#E5D5BA]/60 hidden sm:inline">
              Control who can find you by your ID
            </span>
          </div>

          <button
            onClick={handleRegenerateId}
            disabled={regenerating}
            className="flex items-center gap-1 text-[11px] text-[#B49252] hover:text-[#FAF4E8] transition-colors disabled:opacity-50"
            title="Generate a new random VANVAS ID"
          >
            <RefreshCw className={`w-3 h-3 ${regenerating ? "animate-spin" : ""}`} />
            <span>Regenerate ID</span>
          </button>
        </div>
      </div>

      {/* QR Code Resolution Modal */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#FAF7F0] border-2 border-[#D8CBB2] rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl relative"
            >
              <h4 className="font-serif text-xl font-bold text-[#173B32]">
                Your Traveler QR Code
              </h4>
              <p className="text-xs text-[#20211D]/70 mt-1">
                Let fellow travelers scan your code to connect directly on VANVAS
              </p>

              {/* High-Contrast Deterministic SVG QR Mockup with Embedded ID */}
              <div className="my-6 p-4 bg-white border border-[#D8CBB2] rounded-2xl flex flex-col items-center justify-center shadow-inner">
                <div className="w-48 h-48 bg-[#173B32] p-3 rounded-xl flex flex-col items-center justify-between text-[#FAF7F0]">
                  <div className="flex justify-between w-full">
                    <div className="w-8 h-8 border-4 border-[#B49252] rounded" />
                    <div className="w-8 h-8 border-4 border-[#B49252] rounded" />
                  </div>
                  <div className="flex flex-col items-center">
                    <QrCode className="w-16 h-16 text-[#FAF4E8]" />
                    <span className="text-[10px] font-mono font-bold tracking-widest text-[#B49252] mt-1">
                      {vanvasId}
                    </span>
                  </div>
                  <div className="flex justify-between w-full">
                    <div className="w-8 h-8 border-4 border-[#B49252] rounded" />
                    <div className="w-4 h-4 bg-[#B49252] rounded-full self-center" />
                  </div>
                </div>
              </div>

              <div className="font-mono text-sm font-bold text-[#173B32] bg-[#FAF4E8] py-2 px-3 rounded-xl border border-[#D8CBB2]">
                {vanvasId}
              </div>

              <div className="flex gap-2.5 mt-5">
                <button
                  onClick={handleCopy}
                  className="flex-1 py-2.5 rounded-xl bg-[#173B32] text-white text-xs font-bold hover:bg-[#20453B] transition-colors"
                >
                  {copied ? "Copied!" : "Copy Link"}
                </button>
                <button
                  onClick={() => setShowQrModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-200 text-gray-800 text-xs font-bold hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

