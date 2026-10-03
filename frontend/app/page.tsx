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
import { DensitySwitcher } from "@/components/ui/DensitySwitcher";
import { CompactTravelModeCard, CompactDestinationCard } from "@/components/compact";
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
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#E5D5BA] pb-3">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B65E3C] block">
              CHOOSE YOUR EXPEDITION
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-black text-[#173B32]">
              What are you in the mood for?
            </h2>
          </div>

          {/* Density / View Switcher directly on Home */}
          <div className="self-start sm:self-auto">
            <DensitySwitcher />
          </div>
        </div>

        {isCompact ? (
          /* COMPACT EXPEDITION CARDS */
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            <CompactTravelModeCard
              href="/explore"
              layer="EXPLORE"
              title="Explore Sanctuaries"
              subtitle="Hill stations, coasts & heritage"
              icon={Compass}
            />
            <CompactTravelModeCard
              href="/plan"
              layer="CHALO"
              title="Plan a Trip"
              subtitle="Guided step-by-step itinerary"
              icon={Sparkles}
              badgeColor="bg-[#B65E3C] text-[#FAF4E8]"
              accentColor="text-[#B65E3C]"
            />
            <CompactTravelModeCard
              href="/road-trip"
              layer="HIGHWAYS"
              title="Road Trip"
              subtitle="Live routing & dhabas"
              icon={Navigation}
            />
            <CompactTravelModeCard
              href="/one-day"
              layer="MICROTIP"
              title="Day Escape"
              subtitle="Morning departure, evening return"
              icon={Clock}
              badgeColor="bg-[#8C6D37] text-[#FAF4E8]"
              accentColor="text-[#8C6D37]"
            />
          </div>
        ) : (
          /* ORIGINAL IMMERSIVE EXPEDITION CARDS */
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Action 1: Explore */}
            <Link
              href="/explore"
              className="p-4 sm:p-5 rounded-3xl bg-[#FAF7F0] hover:bg-white border-2 border-[#E5D5BA] hover:border-[#173B32] interactive-card flex flex-col justify-between group cursor-pointer shadow-xs min-h-[140px] animate-vanvas-slide-up stagger-1"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#173B32] text-[#EFE5D2] flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                <Compass className="w-5 h-5 text-[#B49252]" />
              </div>
              <div className="mt-3">
                <h3 className="font-serif font-bold text-base text-[#173B32]">
                  Explore
                </h3>
                <p className="text-[11px] text-[#7B4D36] mt-0.5 leading-relaxed">
                  Discover Indian hill stations, coasts &amp; heritage.
                </p>
              </div>
            </Link>

            {/* Action 2: Plan a Trip */}
            <Link
              href="/plan"
              className="p-4 sm:p-5 rounded-3xl bg-[#FAF7F0] hover:bg-white border-2 border-[#E5D5BA] hover:border-[#B65E3C] interactive-card flex flex-col justify-between group cursor-pointer shadow-xs min-h-[140px] animate-vanvas-slide-up stagger-2"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#B65E3C] text-[#EFE5D2] flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                <Sparkles className="w-5 h-5 text-[#FAF4E8]" />
              </div>
              <div className="mt-3">
                <h3 className="font-serif font-bold text-base text-[#173B32]">
                  Plan a Trip
                </h3>
                <p className="text-[11px] text-[#7B4D36] mt-0.5 leading-relaxed">
                  Answer one question at a time. Zero clutter.
                </p>
              </div>
            </Link>

            {/* Action 3: Road Trip */}
            <Link
              href="/road-trip"
              className="p-4 sm:p-5 rounded-3xl bg-[#FAF7F0] hover:bg-white border-2 border-[#E5D5BA] hover:border-[#173B32] interactive-card flex flex-col justify-between group cursor-pointer shadow-xs min-h-[140px] animate-vanvas-slide-up stagger-3"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#173B32] text-[#EFE5D2] flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                <Navigation className="w-5 h-5 text-[#B49252]" />
              </div>
              <div className="mt-3">
                <h3 className="font-serif font-bold text-base text-[#173B32]">
                  Road Trip
                </h3>
                <p className="text-[11px] text-[#7B4D36] mt-0.5 leading-relaxed">
                  Live highway routing, dhabas &amp; stops.
                </p>
              </div>
            </Link>

            {/* Action 4: Day Escape */}
            <Link
              href="/one-day"
              className="p-4 sm:p-5 rounded-3xl bg-[#FAF7F0] hover:bg-white border-2 border-[#E5D5BA] hover:border-[#8C6D37] interactive-card flex flex-col justify-between group cursor-pointer shadow-xs min-h-[140px] animate-vanvas-slide-up stagger-4"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#8C6D37] text-[#EFE5D2] flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                <Clock className="w-5 h-5 text-[#FAF4E8]" />
              </div>
              <div className="mt-3">
                <h3 className="font-serif font-bold text-base text-[#173B32]">
                  Day Escape
                </h3>
                <p className="text-[11px] text-[#7B4D36] mt-0.5 leading-relaxed">
                  Go in the morning. Return tonight with zero rush.
                </p>
              </div>
            </Link>
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* SECTION 3: WANDER HERE (SANCTUARY CARDS)                  */}
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
            className="text-xs font-mono font-bold text-[#B65E3C] hover:underline flex items-center gap-1 transition-transform hover:translate-x-0.5"
          >
            <span>All Destinations</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isCompact ? (
          /* COMPACT CATALOGUE TILES */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {destinations.slice(0, 8).map((dest, idx) => (
              <div key={dest.id || dest.slug} className={`animate-vanvas-slide-up stagger-${Math.min(idx + 1, 8)}`}>
                <CompactDestinationCard
                  destination={dest}
                  daysEstimate={dest.slug === "manali" ? 4 : dest.slug === "rishikesh" ? 3 : 3}
                />
              </div>
            ))}
          </div>
        ) : (
          /* ORIGINAL IMMERSIVE POSTER TILES */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {destinations.slice(0, 8).map((dest, idx) => (
              <Link
                key={dest.id || dest.slug}
                href={`/explore/${dest.slug}`}
                className={`group bg-[#FAF7F0] hover:bg-white rounded-2xl border-2 border-[#E5D5BA] hover:border-[#173B32] overflow-hidden shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between h-[210px] sm:h-[225px] relative animate-vanvas-slide-up stagger-${Math.min(idx + 1, 8)}`}
              >
                {/* Artwork Header */}
                <div className="relative h-24 sm:h-28 w-full overflow-hidden bg-[#173B32]">
                  <DestinationArtwork
                    slug={dest.slug}
                    aspectRatio="square"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-95"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F2924]/80 via-transparent to-black/20" />
                  
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#173B32]/90 backdrop-blur-xs text-[#EFE5D2] text-[9px] font-mono font-bold uppercase tracking-wider">
                      {dest.state || "SANCTUARY"}
                    </span>
                  </div>

                  <div className="absolute bottom-1.5 right-2.5">
                    <span className="font-devanagari text-xs text-[#B49252] font-semibold">
                      {CANONICAL_HINDI_NAMES[dest.slug] || dest.hindi_name || ""}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-1">
                  <div>
                    <h4 className="font-serif font-black text-sm sm:text-base text-[#173B32] group-hover:text-[#B65E3C] transition-colors leading-tight truncate">
                      {dest.name}
                    </h4>
                    <p className="text-[10px] font-mono text-[#7B4D36] tracking-tight mt-0.5">
                      {dest.altitude_meters ? `${dest.altitude_meters}m elevation` : dest.region || "India"}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#E5D5BA] flex items-center justify-between text-[11px]">
                    <span className="text-[#536B52] font-semibold">
                      {dest.places_count || 10}+ places
                    </span>
                    <span className="text-[#B65E3C] font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      <span>Explore</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* SECTION 4: NEARBY UTILITY PROMPT                         */}
      {/* ======================================================== */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className={`p-4 sm:p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] interactive-card flex flex-col sm:flex-row items-center justify-between gap-4 ${isCompact ? "py-3 sm:py-4" : ""}`}>
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
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] interactive-btn text-[#EFE5D2] text-xs font-bold uppercase tracking-wider shadow-md shrink-0 text-center"
          >
            Explore Nearby
          </Link>
        </div>
      </section>
    </div>
  );
}
