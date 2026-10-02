"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Compass, MapPin, Sparkles, ArrowRight, Clock,
  Wallet, Users, Navigation, Check, ChevronRight,
  Sun, ShieldCheck, Heart, Footprints
} from "lucide-react";
import { MistOverlay } from "@/components/mist/MistOverlay";
import { Logo } from "@/components/brand/Logo";
import { TravelStamp } from "@/components/ui/TravelStamp";
import { DestinationArtwork } from "@/components/brand/DestinationArtwork";
import { DestinationSearchBar } from "@/components/search/DestinationSearchBar";
import { api } from "@/lib/api";
import { Destination, TripSummary } from "@/types";
import { CANONICAL_DESTINATIONS, CANONICAL_HINDI_NAMES } from "@/lib/canonicalDestinations";
import { useAuth } from "@/context/AuthContext";
import { useDensity } from "@/context/DensityContext";

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isCompact } = useDensity();
  const [destinations, setDestinations] = useState<Destination[]>(CANONICAL_DESTINATIONS);
  const [userTrips, setUserTrips] = useState<TripSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getDestinations(false).catch(() => CANONICAL_DESTINATIONS),
      user ? api.getTrips().catch(() => []) : Promise.resolve([]),
    ])
      .then(([dList, tList]) => {
        if (dList && dList.length > 0) setDestinations(dList);
        if (tList) setUserTrips(tList);
      })
      .finally(() => setLoading(false));
  }, [user]);

  // Active / Most recent trip
  const activeTrip = userTrips.length > 0 ? userTrips[0] : null;

  return (
    <div className="relative min-h-screen bg-[#EFE5D2] pb-24 sm:pb-16 text-[#20211D]">
      {/* ======================================================== */}
      {/* SECTION 1: PERSONAL & CONTEXT-AWARE HERO                 */}
      {/* ======================================================== */}
      <section className="relative bg-[#173B32] text-[#EFE5D2] px-4 sm:px-6 lg:px-8 py-10 sm:py-16 overflow-hidden border-b-2 border-[#E5D5BA]">
        {/* Subtle Background & Mist */}
        <div className="absolute inset-0 opacity-40 scale-105 transform pointer-events-none">
          <DestinationArtwork slug="manali" aspectRatio="hero" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#173B32]/90 via-[#173B32]/80 to-[#173B32]" />
        <MistOverlay />

        <div className="relative z-20 max-w-4xl mx-auto text-center space-y-4 sm:space-y-6">
          {/* Active Trip Banner if User is Traveling / Has Saved Trip */}
          {activeTrip ? (
            <div className="bg-[#FAF7F0] text-[#173B32] p-4 sm:p-5 rounded-3xl border-2 border-[#B49252] shadow-2xl text-left max-w-xl mx-auto space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B65E3C]">
                    ACTIVE JOURNEY
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#7B4D36]">
                  {activeTrip.start_date} → {activeTrip.end_date}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl sm:text-2xl font-serif font-black text-[#173B32]">
                    {activeTrip.title}
                  </h3>
                  <p className="text-xs text-[#7B4D36] font-mono mt-0.5">
                    {activeTrip.num_days} Days • {activeTrip.companion_type} • ₹{activeTrip.budget_total.toLocaleString()}
                  </p>
                </div>

                <Link
                  href={`/trips/${activeTrip.id}`}
                  className="px-4 py-2.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] text-xs font-bold uppercase tracking-wider shadow-md flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#B49252]" />
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Devanagari Greeting & Value Prop */}
              <div className="space-y-1 sm:space-y-2">
                <span className="font-devanagari text-lg sm:text-2xl text-[#B49252] font-bold tracking-wider block">
                  {user ? `नमस्ते ${user.full_name.split(" ")[0]} • चलो निकलते हैं` : "चलो निकलते हैं"}
                </span>
                <h1 className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-[#FAF4E8]">
                  Travel should feel <span className="italic text-[#B49252] font-normal">spontaneous</span>.
                  <br />
                  The planning shouldn&apos;t.
                </h1>
              </div>

              {/* Live Search Bar */}
              <div className="max-w-xl mx-auto pt-2">
                <DestinationSearchBar
                  placeholder="Search destination: Manali, Rishikesh, Goa, Spiti, Jaipur..."
                  className="shadow-xl"
                />
              </div>
            </>
          )}
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 2: WHAT ARE YOU IN THE MOOD FOR? (4 PRIMARY ACTIONS) */}
      {/* ======================================================== */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-4">
        <div className="text-center sm:text-left">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B65E3C] block">
            CHOOSE YOUR EXPEDITION
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-black text-[#173B32]">
            What are you in the mood for?
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Action 1: Explore */}
          <Link
            href="/explore"
            className="p-4 sm:p-5 rounded-3xl bg-[#FAF7F0] hover:bg-white border-2 border-[#E5D5BA] hover:border-[#173B32] transition-all flex flex-col justify-between group cursor-pointer shadow-xs min-h-[140px]"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#173B32] text-[#EFE5D2] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5 text-[#B49252]" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#173B32]">
                Explore
              </h3>
              <p className="text-[11px] text-[#7B4D36] mt-0.5">
                Discover Indian hill stations, coasts &amp; heritage.
              </p>
            </div>
          </Link>

          {/* Action 2: Plan a Trip */}
          <Link
            href="/plan"
            className="p-4 sm:p-5 rounded-3xl bg-[#FAF7F0] hover:bg-white border-2 border-[#E5D5BA] hover:border-[#B65E3C] transition-all flex flex-col justify-between group cursor-pointer shadow-xs min-h-[140px]"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#B65E3C] text-[#EFE5D2] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-[#FAF4E8]" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#173B32]">
                Plan a Trip
              </h3>
              <p className="text-[11px] text-[#7B4D36] mt-0.5">
                Answer one question at a time. Zero clutter.
              </p>
            </div>
          </Link>

          {/* Action 3: Road Trip */}
          <Link
            href="/road-trip"
            className="p-4 sm:p-5 rounded-3xl bg-[#FAF7F0] hover:bg-white border-2 border-[#E5D5BA] hover:border-[#173B32] transition-all flex flex-col justify-between group cursor-pointer shadow-xs min-h-[140px]"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#173B32] text-[#EFE5D2] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Navigation className="w-5 h-5 text-[#B49252]" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#173B32]">
                Road Trip
              </h3>
              <p className="text-[11px] text-[#7B4D36] mt-0.5">
                Live highway routing, dhabas &amp; stops.
              </p>
            </div>
          </Link>

          {/* Action 4: Day Escape */}
          <Link
            href="/one-day"
            className="p-4 sm:p-5 rounded-3xl bg-[#FAF7F0] hover:bg-white border-2 border-[#E5D5BA] hover:border-[#8C6D37] transition-all flex flex-col justify-between group cursor-pointer shadow-xs min-h-[140px]"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#8C6D37] text-[#EFE5D2] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5 text-[#FAF4E8]" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#173B32]">
                Day Escape
              </h3>
              <p className="text-[11px] text-[#7B4D36] mt-0.5">
                Go in the morning. Return tonight with zero rush.
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 3: WANDER HERE (COMPACT DESTINATION GRID)        */}
      {/* ======================================================== */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-3">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B65E3C] block">
              FEATURED SANCTUARIES
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-black text-[#173B32]">
              Wander Here
            </h2>
          </div>
          <Link
            href="/explore"
            className="text-xs font-mono font-bold text-[#B65E3C] hover:underline flex items-center gap-1"
          >
            <span>All Destinations</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {destinations.slice(0, 8).map((dest) => (
            <Link
              key={dest.id}
              href={`/explore/${dest.slug}`}
              className="p-3.5 rounded-2xl bg-[#FAF7F0] hover:bg-white border-2 border-[#E5D5BA] hover:border-[#173B32] transition-all flex flex-col justify-between group shadow-2xs min-h-[100px]"
            >
              <div>
                <span className="text-[9px] font-mono uppercase text-[#7B4D36] block">
                  {dest.state || "SANCTUARY"}
                </span>
                <h4 className="font-serif font-bold text-sm text-[#173B32] group-hover:text-[#B65E3C] transition-colors">
                  {dest.name}
                </h4>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-[#7B4D36] pt-1.5 border-t border-[#E5D5BA]">
                <span>{CANONICAL_HINDI_NAMES[dest.slug] || ""}</span>
                <span className="text-[#B65E3C] font-bold">Explore →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 4: NEARBY UTILITY PROMPT                         */}
      {/* ======================================================== */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#EFE5D2] flex items-center justify-center text-[#173B32] shrink-0">
              <MapPin className="w-5 h-5 text-[#B65E3C]" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#173B32]">
                Where are you right now?
              </h3>
              <p className="text-xs text-[#7B4D36]">
                Find verified cafes, viewpoints &amp; stays within 50 km of your current location.
              </p>
            </div>
          </div>

          <Link
            href="/nearby"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] text-xs font-bold uppercase tracking-wider shadow-md shrink-0 text-center"
          >
            Explore Nearby
          </Link>
        </div>
      </section>
    </div>
  );
}
