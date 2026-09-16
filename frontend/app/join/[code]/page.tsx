"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Compass, MapPin, Calendar, Users, Sparkles, Check,
  AlertCircle, ArrowRight, ShieldCheck, RefreshCw, LogIn
} from "lucide-react";
import { api } from "@/lib/api";
import { TripInvitePreview } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { TravelStamp } from "@/components/ui/TravelStamp";
import { DestinationArtwork } from "@/components/brand/DestinationArtwork";

export default function JoinTripPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const { user, login, register } = useAuth();

  const [preview, setPreview] = useState<TripInvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinedSuccess, setJoinedSuccess] = useState(false);

  // Inline quick login/name prompt if user not logged in
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [showAuthForm, setShowAuthForm] = useState(false);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    setError(null);
    api.getInvitePreview(code)
      .then((data) => {
        setPreview(data);
      })
      .catch((err) => {
        setError(err.message || "Invalid or expired expedition invite code.");
      })
      .finally(() => setLoading(false));
  }, [code]);

  const handleJoin = async () => {
    if (!preview) return;

    // If user not authenticated, show quick name prompt or authenticate
    if (!user) {
      setShowAuthForm(true);
      return;
    }

    setJoining(true);
    setError(null);

    try {
      const res = await api.joinTripByCode(code);
      setJoinedSuccess(true);
      setTimeout(() => {
        router.push(`/trips/${res.trip_id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to join trip. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  const handleQuickAuthAndJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setError("Please enter your name to join the expedition.");
      return;
    }

    setJoining(true);
    setError(null);

    try {
      const email = guestEmail.trim() || `traveler_${Date.now()}@vanvas.app`;
      await register(email, "vanvas123", guestName.trim());
      const res = await api.joinTripByCode(code);
      setJoinedSuccess(true);
      setTimeout(() => {
        router.push(`/trips/${res.trip_id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to authenticate and join.");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EFE5D2] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-[#B65E3C] border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-serif italic text-[#7B4D36]">
          Resolving expedition invite details...
        </span>
      </div>
    );
  }

  // Error State: Invalid or expired invite code
  if (error && !preview) {
    return (
      <div className="min-h-screen bg-[#EFE5D2] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#FAF4E8] rounded-3xl p-8 border-2 border-[#D8CBB2] shadow-2xl text-center space-y-5 animate-fadeIn">
          <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#B65E3C]">
              EXPEDITION INVITE ERROR
            </span>
            <h1 className="text-2xl font-serif font-bold text-[#173B32]">
              Invalid or Expired Invite
            </h1>
            <p className="text-xs text-[#20211D]/75 leading-relaxed pt-1">
              {error}
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/explore"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#173B32] text-[#EFE5D2] text-xs font-bold uppercase tracking-wider hover:bg-[#20453B] transition-colors"
            >
              <Compass className="w-4 h-4 text-[#B49252]" />
              <span>Explore Himalayan Destinations</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!preview) return null;

  const isAlreadyMember = preview.is_member || (user && preview.is_member);

  return (
    <div className="min-h-screen bg-[#EFE5D2] flex items-center justify-center p-4 py-12">
      <div className="max-w-lg w-full bg-[#FAF4E8] rounded-3xl border-2 border-[#D8CBB2] shadow-2xl overflow-hidden animate-slideUp">
        {/* Destination Header Banner */}
        <div className="relative h-44 bg-[#173B32] overflow-hidden flex items-end p-6">
          <DestinationArtwork
            slug={preview.destination_slug || "manali"}
            destination={preview.destination_name}
            aspectRatio="wide"
            className="absolute inset-0 opacity-40 mix-blend-luminosity scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F2924] via-[#0F2924]/60 to-transparent" />

          <div className="relative z-10 w-full flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[#B49252] font-bold">
                <Sparkles className="w-3 h-3" />
                <span>EXPEDITION INVITATION</span>
              </div>
              <h2 className="text-2xl font-serif font-black text-[#EFE5D2]">
                {preview.destination_name}
              </h2>
              <p className="text-xs text-[#EFE5D2]/80 font-mono">
                {preview.state}, {preview.region}
              </p>
            </div>

            <TravelStamp label={`${preview.num_days} DAYS`} variant="mustard" />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 space-y-6">
          {/* Trip Details Card */}
          <div className="space-y-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#B65E3C]">
                EXPEDITION TITLE
              </span>
              <h1 className="text-2xl font-serif font-bold text-[#173B32]">
                {preview.title}
              </h1>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-white border border-[#D8CBB2] text-xs">
                <span className="text-[10px] uppercase font-bold text-[#20211D]/60 block">
                  Organized By
                </span>
                <span className="font-serif font-bold text-[#173B32] text-sm truncate block mt-0.5">
                  {preview.owner_name}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#D8CBB2] text-xs">
                <span className="text-[10px] uppercase font-bold text-[#20211D]/60 block">
                  Current Travelers
                </span>
                <span className="font-mono font-bold text-[#173B32] text-sm block mt-0.5">
                  {preview.members_count} member{preview.members_count === 1 ? "" : "s"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#D8CBB2] text-xs col-span-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#20211D]/60 block">
                    Travel Window
                  </span>
                  <span className="font-mono font-semibold text-[#173B32] block mt-0.5">
                    {preview.start_date} to {preview.end_date}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#20211D]/60 block">
                    Expedition Style
                  </span>
                  <span className="font-medium text-[#B65E3C]">
                    {preview.travel_style} · {preview.companion_type}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-3.5 rounded-2xl bg-[#173B32]/5 border border-[#173B32]/15 flex items-start gap-2.5 text-xs text-[#173B32]">
            <ShieldCheck className="w-4 h-4 text-[#B49252] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Joining gives you full access to view the sequenced itinerary, add items to the checklist, and participate in private group activity voting.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {joinedSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Joined expedition successfully! Redirecting to trip hub...</span>
            </div>
          )}

          {/* Unauthenticated Quick Name Form */}
          {showAuthForm && !user && (
            <form onSubmit={handleQuickAuthAndJoin} className="p-4 rounded-2xl bg-[#EFE5D2] border border-[#D8CBB2] space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#173B32]">
                <LogIn className="w-4 h-4 text-[#B65E3C]" />
                <span>Tell us your name to join</span>
              </div>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Your Display Name (e.g. Maya Negi)"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CBB2] bg-white text-xs text-[#20211D] focus:outline-none focus:ring-2 focus:ring-[#173B32]/30"
              />
              <button
                type="submit"
                disabled={joining}
                className="w-full py-2.5 rounded-xl bg-[#173B32] text-[#EFE5D2] font-bold text-xs uppercase tracking-wider hover:bg-[#20453B] transition-colors flex items-center justify-center gap-2"
              >
                {joining ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Continue &amp; Join</span>
              </button>
            </form>
          )}

          {/* Primary Action Button */}
          <div className="pt-2">
            {isAlreadyMember ? (
              <div className="space-y-3 text-center">
                <div className="p-3 rounded-xl bg-[#173B32]/10 border border-[#173B32]/20 text-[#173B32] text-xs font-semibold flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>You’re already part of this expedition.</span>
                </div>
                <Link
                  href={`/trips/${preview.trip_id}`}
                  className="w-full py-3.5 rounded-2xl bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <span>Go to Expedition Dashboard</span>
                  <ArrowRight className="w-4 h-4 text-[#B49252]" />
                </Link>
              </div>
            ) : !showAuthForm ? (
              <button
                type="button"
                onClick={handleJoin}
                disabled={joining || joinedSuccess}
                className="w-full py-3.5 rounded-2xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl border border-[#7B4D36]/20 disabled:opacity-50"
              >
                {joining ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Joining Expedition...</span>
                  </>
                ) : (
                  <>
                    <span>Join This Expedition</span>
                    <span className="font-devanagari text-xs lowercase opacity-80">(साथ चलो)</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
