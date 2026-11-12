"use client";

import React, { useState } from "react";
import { User } from "@/types";
import { api } from "@/lib/api";
import {
  Copy,
  Check,
  QrCode,
  RefreshCw,
  Shield,
  ShieldCheck,
  Share2,
  UserCheck,
  UserX,
  Camera,
  Edit3,
  Settings,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Avatar } from "@/components/ui/Avatar";
import { VanvasAdaptiveModal } from "@/components/ui/VanvasAdaptiveModal";

interface VanvasIdentityCardProps {
  user: User | null;
  onUserUpdated?: () => Promise<void> | void;
  onEditProfile?: () => void;
  onChangePhoto?: () => void;
  onOpenSettings?: () => void;
  onSignOut?: () => void;
  compact?: boolean;
}

function formatMemberSince(createdAt?: string | null): string | null {
  if (!createdAt) return null;
  try {
    const d = new Date(createdAt);
    if (isNaN(d.getTime())) return null;
    return `Member since ${d.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
  } catch {
    return null;
  }
}

export function VanvasIdentityCard({
  user,
  onUserUpdated,
  onEditProfile,
  onChangePhoto,
  onOpenSettings,
  onSignOut,
  compact = false,
}: VanvasIdentityCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateSuccess, setRegenerateSuccess] = useState<string | null>(null);
  const [privacyUpdating, setPrivacyUpdating] = useState(false);
  const [privacyError, setPrivacyError] = useState<string | null>(null);
  const [optimisticPrivacy, setOptimisticPrivacy] = useState<boolean | null>(null);
  const privacyAllowed = optimisticPrivacy ?? (user?.preferences?.allow_friend_requests_via_id ?? true);

  const vanvasId = user?.vanvas_id?.trim() || null;
  const isVerified = Boolean(user?.email_verified_at || user?.is_verified);
  const isAdmin = user?.role === "admin";
  const memberSince = formatMemberSince(user?.created_at);

  const styleParts = [
    user?.preferences?.preferred_travel_style,
    user?.preferences?.companion_style,
  ].filter((v): v is string => Boolean(v && v.trim()));
  const travelStyleLabel =
    styleParts.length > 0 ? styleParts.join(" · ") : "Travel style not set yet";

  const qrUrl = vanvasId
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
        `https://vanvasai.vercel.app/friends?add=${vanvasId}`
      )}`
    : null;

  const handleCopy = async () => {
    if (!vanvasId) return;
    try {
      await navigator.clipboard.writeText(vanvasId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleShare = async () => {
    if (!vanvasId) return;
    const shareText = `Add me on VANVAS! My Traveler ID is ${vanvasId}.`;
    const shareUrl = `https://vanvasai.vercel.app/friends?add=${vanvasId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "VANVAS Traveler ID",
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // Ignore abort
      }
    } else {
      await handleCopy();
    }
  };

  const handleTogglePrivacy = async () => {
    if (privacyUpdating) return;
    const nextVal = !privacyAllowed;
    setPrivacyError(null);
    setPrivacyUpdating(true);
    setOptimisticPrivacy(nextVal);
    try {
      await api.updatePreferences({ allow_friend_requests_via_id: nextVal });
      if (onUserUpdated) await onUserUpdated();
    } catch (err: unknown) {
      setPrivacyError(err instanceof Error ? err.message : "Could not update privacy setting.");
    } finally {
      setOptimisticPrivacy(null);
      setPrivacyUpdating(false);
    }
  };

  const handleRegenerateConfirm = async () => {
    if (regenerating) return;
    setRegenerating(true);
    setRegenerateSuccess(null);
    try {
      const res = await api.regenerateMyVanvasId();
      if (onUserUpdated) await onUserUpdated();
      setShowRegenerateConfirm(false);
      setRegenerateSuccess(res?.vanvas_id ? `Updated to ${res.vanvas_id}` : "VANVAS ID regenerated");
      setTimeout(() => setRegenerateSuccess(null), 4000);
    } catch (err: unknown) {
      setPrivacyError(err instanceof Error ? err.message : "Failed to regenerate VANVAS ID.");
    } finally {
      setRegenerating(false);
    }
  };

  const showActionBar = Boolean(onEditProfile || onChangePhoto || onOpenSettings || onSignOut);

  return (
    <>
      <motion.section
        data-testid="traveler-passport-card"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#173B32] via-[#1C473C] to-[#112B24] text-[#FAF7F0] shadow-xl border border-[#B49252]/40 ${
          compact ? "p-4 sm:p-5" : "p-5 sm:p-7"
        }`}
      >
        {/* Subtle decorative background accents (pointer-events-none) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#B49252]/10 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-[#B65E3C]/12 blur-2xl"
        />

        <div className="relative z-10 space-y-5">
          {/* 1. Dedicated Top Header Row (zero badge overlap) */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#FAF7F0]/12">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#E5D5BA]/80">
              VANVAS Identity Passport
            </span>
            <span
              data-testid="passport-official-badge"
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#E5D5BA] bg-[#B49252]/15 border border-[#B49252]/40 px-2.5 py-1 rounded-full shrink-0"
            >
              <Shield className="w-3 h-3 text-[#B49252]" />
              <span>Official Traveler Passport</span>
            </span>
          </div>

          {/* 2. Traveler Identity Row */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative shrink-0">
              <div className="rounded-full p-0.5 ring-2 ring-[#B49252]/60 bg-[#112B24]">
                <Avatar user={user} size={compact ? "lg" : "xl"} />
              </div>
              {onChangePhoto && (
                <button
                  type="button"
                  onClick={onChangePhoto}
                  aria-label="Change profile photo"
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#B65E3C] hover:bg-[#9E4D2E] text-white border-2 border-[#173B32] flex items-center justify-center shadow-sm transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif font-bold text-xl sm:text-2xl text-[#FAF7F0] tracking-tight truncate">
                  {user?.full_name || "Traveler"}
                </h1>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#B49252]/25 text-[#F6E2B3] border border-[#B49252]/45">
                    <ShieldCheck className="w-3 h-3" />
                    Admin
                  </span>
                ) : isVerified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FAF7F0]/12 text-[#E5D5BA] border border-[#B49252]/40">
                    <ShieldCheck className="w-3 h-3 text-[#B49252]" />
                    Verified Traveler
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-[#FAF7F0]/10 text-[#E5D5BA]/80 border border-[#FAF7F0]/20">
                    Registered Account
                  </span>
                )}
              </div>

              {user?.email && (
                <p className="text-xs sm:text-sm text-[#E5D5BA]/85 truncate">{user.email}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-[#E5D5BA]/80 pt-0.5">
                <span className={styleParts.length > 0 ? "text-[#FAF7F0]/90 font-medium" : "italic text-[#E5D5BA]/65"}>
                  {travelStyleLabel}
                </span>
                {memberSince && (
                  <>
                    <span aria-hidden="true" className="text-[#B49252]">·</span>
                    <span>{memberSince}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 3. VANVAS ID & Quick Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#112B24]/85 border border-[#B49252]/30">
            <div className="min-w-0">
              <span className="text-[10px] uppercase tracking-wider text-[#E5D5BA]/75 block mb-0.5">
                Unique VANVAS ID
              </span>
              <span
                data-testid="passport-vanvas-id"
                className="font-mono font-bold text-lg sm:text-xl tracking-wider text-[#F6E2B3] block truncate"
              >
                {vanvasId || "Assigning VANVAS ID…"}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!vanvasId}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF7F0]/10 hover:bg-[#FAF7F0]/20 disabled:opacity-40 text-xs font-medium text-[#FAF7F0] transition-colors cursor-pointer"
                title="Copy VANVAS ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#E5D5BA]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                disabled={!vanvasId}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#B49252]/25 hover:bg-[#B49252]/40 disabled:opacity-40 text-xs font-medium text-[#F6E2B3] border border-[#B49252]/45 transition-colors cursor-pointer"
                title="Show QR Code"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                disabled={!vanvasId}
                className="p-2 rounded-xl bg-[#FAF7F0]/10 hover:bg-[#FAF7F0]/20 disabled:opacity-40 text-[#FAF7F0] transition-colors cursor-pointer"
                title="Share VANVAS ID"
                aria-label="Share VANVAS ID"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 4. Friend Request Privacy Switch + Regenerate ID */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={privacyAllowed}
                aria-label="Allow friend requests via VANVAS ID"
                data-testid="passport-privacy-switch"
                disabled={privacyUpdating}
                onClick={handleTogglePrivacy}
                className="inline-flex items-center gap-2.5 text-left group cursor-pointer disabled:opacity-60"
              >
                <span
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
                    privacyAllowed
                      ? "bg-[#B65E3C] border-[#D9825E]"
                      : "bg-[#112B24] border-[#E5D5BA]/30"
                  }`}
                >
                  <motion.span
                    layout={!prefersReducedMotion}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 500, damping: 32 }
                    }
                    className={`inline-block h-4 w-4 rounded-full bg-[#FAF7F0] shadow-xs ${
                      privacyAllowed ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#EFE5D2]">
                  {privacyAllowed ? (
                    <UserCheck className="w-3.5 h-3.5 text-[#E5D5BA]" />
                  ) : (
                    <UserX className="w-3.5 h-3.5 text-[#E5D5BA]/65" />
                  )}
                  <span>
                    {privacyAllowed ? "Friend Requests: Allowed" : "Friend Requests: Restricted"}
                  </span>
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowRegenerateConfirm(true)}
              disabled={regenerating || !vanvasId}
              data-testid="passport-regenerate-btn"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#E5D5BA]/80 hover:text-[#FAF7F0] disabled:opacity-40 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? "animate-spin" : ""}`} />
              <span>Regenerate ID</span>
            </button>
          </div>

          {privacyError && (
            <p className="text-xs text-[#F3B098] bg-[#B65E3C]/20 border border-[#B65E3C]/40 rounded-xl px-3 py-2">
              {privacyError}
            </p>
          )}

          {regenerateSuccess && (
            <p className="text-xs text-[#F6E2B3] bg-[#B49252]/20 border border-[#B49252]/40 rounded-xl px-3 py-2">
              {regenerateSuccess}
            </p>
          )}
        </div>
      </motion.section>

      {/* 5. Clean Grouped Action Bar Directly Beneath Passport */}
      {showActionBar && (
        <div
          data-testid="passport-action-bar"
          className="mt-3 flex flex-wrap items-center gap-2"
        >
          {onEditProfile && (
            <button
              type="button"
              onClick={onEditProfile}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FAF7F0] hover:bg-[#EFE5D2] text-[#173B32] border border-[#D8CBB2] text-xs font-bold transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          )}
          {onChangePhoto && (
            <button
              type="button"
              onClick={onChangePhoto}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FAF7F0] hover:bg-[#EFE5D2] text-[#173B32] border border-[#D8CBB2] text-xs font-bold transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Profile Photo</span>
            </button>
          )}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FAF7F0] hover:bg-[#EFE5D2] text-[#173B32] border border-[#D8CBB2] text-xs font-bold transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          )}
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FAF7F0] hover:bg-red-50 text-red-700 border border-[#D8CBB2] hover:border-red-200 text-xs font-bold transition-colors cursor-pointer ml-auto"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      )}

      {/* QR Code Modal */}
      <VanvasAdaptiveModal
        isOpen={showQrModal && Boolean(vanvasId)}
        onClose={() => setShowQrModal(false)}
        title="Share VANVAS Passport"
        subtitle="Friends can scan this QR or enter your VANVAS ID"
        maxWidth="max-w-sm"
      >
        <div className="text-center space-y-4">
          {qrUrl && (
            <div className="bg-white p-4 rounded-2xl inline-block border border-[#D8CBB2] shadow-xs">
              <img
                src={qrUrl}
                alt={`QR Code for ${vanvasId}`}
                className="w-48 h-48 mx-auto rounded-lg"
              />
            </div>
          )}
          <div className="font-mono font-bold text-lg text-[#173B32] tracking-wider bg-[#EFE5D2]/60 py-2.5 px-4 rounded-xl border border-[#D8CBB2]">
            {vanvasId}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 py-2.5 rounded-xl bg-[#173B32] hover:bg-[#1E4A3F] text-[#FAF7F0] text-sm font-semibold transition-colors cursor-pointer"
            >
              {copied ? "Copied ID!" : "Copy ID"}
            </button>
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="px-4 py-2.5 rounded-xl bg-[#EFE5D2] hover:bg-[#D8CBB2] text-[#173B32] text-sm font-medium transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </VanvasAdaptiveModal>

      {/* Regenerate VANVAS ID Confirmation Modal */}
      <VanvasAdaptiveModal
        isOpen={showRegenerateConfirm}
        onClose={() => !regenerating && setShowRegenerateConfirm(false)}
        title="Regenerate VANVAS ID?"
        subtitle="Your previous ID and QR code will stop working immediately"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#B49252]/12 border border-[#B49252]/35 text-xs text-[#173B32]">
            <AlertTriangle className="w-4 h-4 text-[#B65E3C] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Generating a new VANVAS ID replaces <strong className="font-mono">{vanvasId}</strong>. Existing friends stay connected, but anyone using your old ID or printed QR code will no longer find you.
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowRegenerateConfirm(false)}
              disabled={regenerating}
              className="px-4 py-2 rounded-xl bg-[#EFE5D2] hover:bg-[#D8CBB2] text-[#173B32] text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRegenerateConfirm}
              disabled={regenerating}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] disabled:opacity-60 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? "animate-spin" : ""}`} />
              <span>{regenerating ? "Regenerating…" : "Yes, Regenerate ID"}</span>
            </button>
          </div>
        </div>
      </VanvasAdaptiveModal>
    </>
  );
}
