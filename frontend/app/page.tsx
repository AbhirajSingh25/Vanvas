"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass, MapPin, Sparkles, ArrowRight, Clock,
  Wallet, Users, Navigation, Sun, Check, ExternalLink,
  Mountain, Footprints, ChevronRight
} from "lucide-react";
import { MistOverlay } from "@/components/mist/MistOverlay";
import { TravelStamp } from "@/components/ui/TravelStamp";
import { JournalNote } from "@/components/ui/JournalNote";
import { DevanagariHeading } from "@/components/ui/DevanagariHeading";
import { DestinationArtwork } from "@/components/brand/DestinationArtwork";
import { DestinationSearchBar } from "@/components/search/DestinationSearchBar";
import { DensitySwitcher } from "@/components/ui/DensitySwitcher";
import { CompactTravelModeCard, CompactDestinationCard } from "@/components/compact";
import { api } from "@/lib/api";
import { Destination, TripSummary } from "@/types";
import { CANONICAL_DESTINATIONS, CANONICAL_HINDI_NAMES, getCanonicalHindiName } from "@/lib/canonicalDestinations";
import { CANONICAL_EXPEDITION_MODES } from "@/lib/expeditionModes";
import { useAuth } from "@/context/AuthContext";
import { useDensity } from "@/context/DensityContext";

export default function HomePage() {
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
        if (dList && Array.isArray(dList) && dList.length > 0) {
          setDestinations(dList);
        } else {
          setDestinations(CANONICAL_DESTINATIONS);
        }
        if (tList && Array.isArray(tList)) {
          setUserTrips(tList);
        }
      })
      .catch(() => {
        setDestinations(CANONICAL_DESTINATIONS);
      })
      .finally(() => setLoading(false));
  }, [user]);

  // Active / Most recent trip
  const activeTrip = userTrips.length > 0 ? userTrips[0] : null;

  const featuredManali = destinations.find((d) => d.slug === "manali") || destinations[0];
  const remainingDestinations = destinations.filter((d) => d.slug !== featuredManali?.slug);

  return (
    <div className="relative overflow-hidden bg-[#EFE5D2] text-[#20211D]">
      {/* ======================================================== */}
      {/* SECTION 1: LAYERED HERO WITH HIMALAYAN ARTWORK           */}
      {/* ======================================================== */}
      <section className={`relative bg-[#173B32] text-[#EFE5D2] px-4 sm:px-6 lg:px-8 overflow-hidden border-b-2 border-[#E5D5BA] ${
        isCompact ? "py-10 sm:py-14" : "min-h-[88vh] flex items-center justify-center py-16 sm:py-24"
      }`}>
        {/* Layer 1: Illustrated Mountain Artwork Canvas */}
        <div className="absolute inset-0 opacity-55 scale-105 transform pointer-events-none">
          <DestinationArtwork slug="manali" aspectRatio="hero" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#173B32]/85 via-[#173B32]/70 to-[#173B32] pointer-events-none" />

        {/* Ambient Mist Drift Animation */}
        <MistOverlay />

        {/* Layer 2: Hero Editorial Content Panel */}
        <div className="relative z-20 max-w-5xl mx-auto text-center space-y-6 sm:space-y-8 w-full">
          {/* Active Trip Banner if User is Traveling / Has Saved Trip */}
          {activeTrip && (
            <div className="bg-[#FAF7F0] text-[#173B32] p-4 sm:p-5 rounded-3xl border-2 border-[#B49252] shadow-2xl text-left max-w-xl mx-auto space-y-3 animate-vanvas-scale mb-4">
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
                  className="px-4 py-2.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] text-xs font-bold uppercase tracking-wider shadow-md interactive-btn flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#B49252]" />
                </Link>
              </div>
            </div>
          )}

          {/* Expedition Stamp & Route Header */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <TravelStamp label="VANVAS EXPEDITION" sublabel="DELHI → MANALI" elevation="2050M" variant="mustard" />
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono tracking-widest text-[#D8DED5]/80 uppercase">
              <span>[ 32°14&apos;N, 77°11&apos;E ]</span>
              <span>•</span>
              <span>EST. 2026</span>
            </div>
          </div>

          {/* Hindi Devanagari Lead + English Headline */}
          <div className="space-y-2">
            <span className="font-devanagari text-2xl sm:text-4xl text-[#B49252] font-bold tracking-widest block animate-float">
              {user ? `नमस्ते ${user.full_name.split(" ")[0]} • चलो निकलते हैं` : "चलो निकलते हैं।"}
            </span>
            <h1 className={`font-serif font-black tracking-tight text-[#FAF4E8] ${
              isCompact
                ? "text-3xl sm:text-5xl leading-tight"
                : "text-4xl sm:text-6xl md:text-7xl leading-[1.08]"
            }`}>
              Travel should feel <span className="text-[#B49252] italic font-normal">spontaneous</span>.
              <br />
              The planning shouldn&apos;t.
            </h1>
          </div>

          {/* Supporting Copy */}
          <p className={`max-w-2xl mx-auto text-[#D8DED5]/90 leading-relaxed font-light ${
            isCompact ? "text-xs sm:text-sm" : "text-sm sm:text-lg"
          }`}>
            An expedition journal and travel operating layer for people who plan badly, arrive at weird hours,
            and want to experience the mountains freely.
          </p>

          {/* Live Global & Indian Sanctuary Search Bar */}
          <div className="max-w-2xl mx-auto pt-2">
            <DestinationSearchBar
              placeholder="Search destination: Manali, Rishikesh, Goa, Spiti, Jaipur, Bali..."
              className="shadow-2xl"
            />
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/plan"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] text-sm font-bold tracking-wider uppercase shadow-xl hover:shadow-2xl interactive-btn flex items-center justify-center gap-2.5 border border-[#7B4D36]/30"
            >
              <Sparkles className="w-4 h-4 text-[#B49252]" />
              <span>PLAN MY TRIP</span>
              <span className="font-devanagari text-xs opacity-75 lowercase">(योजना बनाएं)</span>
            </Link>

            <Link
              href="/explore"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#EFE5D2]/15 hover:bg-[#EFE5D2]/25 backdrop-blur-md border border-[#D8DED5]/30 text-[#EFE5D2] text-sm font-bold tracking-wider uppercase interactive-btn transition-all flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>EXPLORE DESTINATIONS</span>
            </Link>
          </div>

          {/* Editorial Route Annotation Pin - Robust & responsive across 375, 390, 430 mobile viewports */}
          <div className="pt-4 max-w-full px-3 sm:px-4 flex justify-center">
            <div className="text-[11px] sm:text-xs font-mono tracking-wider sm:tracking-widest text-[#B49252] uppercase bg-[#0F2924]/85 px-4 py-2 sm:px-5 sm:py-1.5 rounded-2xl sm:rounded-full border border-[#B49252]/40 text-center max-w-[340px] xs:max-w-sm sm:max-w-md shadow-inner backdrop-blur-xs leading-relaxed">
              <span>Leave Delhi at night.</span>{" "}
              <span className="text-[#EFE5D2]/90">Wake up somewhere in the pines.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 1B: CHOOSE YOUR WAY TO TRAVEL                    */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#D8CBB2] pb-6">
          <DevanagariHeading
            devanagari="अपनी यात्रा चुनें"
            english="Choose Your Way to Travel"
            subtitle="Five dedicated visual environments built for different travel mentalities."
          />

          {/* Density / View Switcher directly on Home */}
          <div className="self-start sm:self-auto shrink-0">
            <DensitySwitcher />
          </div>
        </div>

        {isCompact ? (
          /* COMPACT EXPEDITION CARDS (Canonical single source of truth) */
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3">
            {CANONICAL_EXPEDITION_MODES.map((mode) => (
              <CompactTravelModeCard
                key={mode.id}
                href={mode.href}
                layer={mode.layerNumber}
                title={mode.compactTitle}
                subtitle={mode.subtitle}
                icon={mode.icon}
                badgeColor={`${mode.badgeBg} ${mode.badgeText}`}
                accentColor={mode.theme === "dark" ? "text-[#ECEAE4]" : "text-[#173B32]"}
              />
            ))}
          </div>
        ) : (
          /* ORIGINAL IMMERSIVE EXPEDITION CARDS (Canonical single source of truth) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {CANONICAL_EXPEDITION_MODES.map((mode) => {
              const Icon = mode.icon;
              const isDark = mode.theme === "dark";
              return (
                <Link
                  key={mode.id}
                  href={mode.href}
                  className={`group ${mode.cardBg} ${mode.cardBgDark} rounded-3xl p-7 border-2 ${mode.borderColor} ${mode.hoverBorderColor} shadow-sm hover:shadow-xl interactive-card transition-all flex flex-col justify-between space-y-6 animate-vanvas-slide-up ${mode.staggerClass} no-underline`}
                >
                  <div className="space-y-4">
                    <div className={`w-12 h-12 rounded-2xl ${mode.badgeBg} ${mode.badgeText} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5">
                      <span className={`text-[10px] font-mono uppercase tracking-widest ${isDark ? "text-[#B49252]" : "text-[#7B4D36]"} font-bold`}>
                        {mode.layer}
                      </span>
                      <h3 className={`text-2xl font-serif font-black ${isDark ? "text-white" : "text-[#173B32]"} group-hover:text-[#B65E3C] transition-colors`}>
                        {mode.title}
                      </h3>
                    </div>
                    <p className={`text-xs ${isDark ? "text-[#A6BAAE]" : "text-[#7B4D36]"} font-serif leading-relaxed`}>
                      {mode.description}
                    </p>
                  </div>
                  <div className={`pt-4 border-t ${isDark ? "border-[#25372D]" : "border-[#E5D5BA]"} flex items-center justify-between text-xs font-bold ${isDark ? "text-[#E05A2B]" : "text-[#173B32]"}`}>
                    <span>{mode.ctaText}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* SECTION 2: WHERE WILL YOU WANDER?                        */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#D8CBB2] pb-6">
          <DevanagariHeading
            devanagari="कहाँ चलें?"
            english="Where will you wander?"
            subtitle="Curated Indian sanctuaries &amp; heritage routes presented as vintage illustrated travel posters."
          />
          <Link
            href="/explore"
            className="text-xs font-bold uppercase tracking-widest text-[#B65E3C] hover:text-[#9E4D2E] flex items-center gap-1.5 transition-colors self-start md:self-auto"
          >
            <span>EXPLORE ALL SANCTUARIES (सभी तीर्थ व अभयारण्य खोजें) →</span>
          </Link>
        </div>

        {isCompact ? (
          /* COMPACT CATALOGUE TILES */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
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
          /* ORIGINAL IMMERSIVE ASYMMETRICAL MAGAZINE GRID */
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Large Featured Hero Card: Manali */}
              {featuredManali && (
                <Link
                  href={`/explore/${featuredManali.slug}`}
                  className="lg:col-span-7 group journal-card rounded-3xl overflow-hidden shadow-md hover:shadow-2xl interactive-card transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Illustrated Artwork Poster */}
                  <div className="relative h-80 sm:h-96 w-full overflow-hidden">
                    <DestinationArtwork
                      slug={featuredManali.slug}
                      aspectRatio="wide"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    
                    {/* Vintage Poster Header Badges */}
                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                      <TravelStamp
                        label={featuredManali.region || "HIMACHAL VALLEY"}
                        elevation={`${featuredManali.altitude_meters || 2050}M`}
                        variant="forest"
                      />
                      <span className="px-3 py-1 rounded-full bg-[#173B32]/90 backdrop-blur-md text-[#EFE5D2] text-[10px] font-mono font-bold uppercase">
                        FEATURED EXPEDITION
                      </span>
                    </div>

                    {/* Devanagari Overlay Watermark */}
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <div className="flex items-baseline gap-3">
                        <h3 className="text-3xl sm:text-5xl font-serif font-black">{featuredManali.name}</h3>
                        <span className="font-devanagari text-2xl sm:text-3xl text-[#B49252] font-bold">
                          {CANONICAL_HINDI_NAMES[featuredManali.slug] || featuredManali.hindi_name || getCanonicalHindiName(featuredManali.slug) || "मनाली"}
                        </span>
                      </div>
                      <p className="text-xs text-[#D8DED5] mt-1 italic font-serif">
                        &ldquo;{featuredManali.tagline || "Where cedar scent meets glacier mist and the highway to Ladakh begins."}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Journal Notes Strip */}
                  <div className="p-6 bg-[#FAF4E8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-[#D8CBB2]">
                    <p className="text-xs text-[#7B4D36] max-w-md leading-relaxed font-serif">
                      {featuredManali.description || "Gateway to high Himalayan passes, ancient wooden temples, hot sulphur springs, and apple-scented valley loops."}
                    </p>
                    <span className="px-4 py-2 rounded-xl bg-[#173B32] text-[#EFE5D2] text-xs font-bold uppercase tracking-wider group-hover:bg-[#B65E3C] transition-colors shrink-0 flex items-center gap-1 shadow-sm">
                      <span>Open Journal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              )}

              {/* Right Column Smaller Curated Cards */}
              <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {remainingDestinations.slice(0, 4).map((dest, idx) => (
                  <Link
                    key={dest.id || dest.slug}
                    href={`/explore/${dest.slug}`}
                    className={`group journal-card rounded-3xl overflow-hidden shadow-xs hover:shadow-xl interactive-card transition-all duration-300 flex flex-col justify-between animate-vanvas-slide-up stagger-${Math.min(idx + 1, 4)}`}
                  >
                    {/* Artwork */}
                    <div className="relative h-44 w-full overflow-hidden">
                      <DestinationArtwork
                        slug={dest.slug}
                        aspectRatio="square"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      <div className="absolute top-2.5 left-2.5">
                        <span className="px-2 py-0.5 rounded-md bg-[#173B32]/90 text-[#EFE5D2] text-[9px] font-mono font-bold uppercase">
                          {dest.region || dest.state || "SANCTUARY"}
                        </span>
                      </div>

                      <div className="absolute bottom-2.5 left-3 right-3 text-white">
                        <div className="flex items-baseline justify-between">
                          <h4 className="font-serif font-black text-xl">{dest.name}</h4>
                          <span className="font-devanagari text-sm text-[#B49252] font-semibold">
                            {CANONICAL_HINDI_NAMES[dest.slug] || dest.hindi_name || getCanonicalHindiName(dest.slug)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Tagline */}
                    <div className="p-3.5 bg-[#FAF4E8] space-y-1 border-t border-[#D8CBB2]">
                      <p className="text-[11px] text-[#7B4D36] line-clamp-2 italic leading-relaxed font-serif">
                        &ldquo;{dest.tagline || dest.description || "Curated mountain sanctuary."}&rdquo;
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-[#D8CBB2]/60 text-[10px] font-mono text-[#173B32]">
                        <span>{dest.altitude_meters ? `${dest.altitude_meters}M ELEV` : "COASTAL"}</span>
                        <span className="text-[#B65E3C] font-bold group-hover:translate-x-0.5 transition-transform">
                          VIEW →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Additional Editorial Grid for More Destinations */}
            {remainingDestinations.length > 4 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {remainingDestinations.slice(4, 7).map((dest, idx) => (
                  <Link
                    key={dest.id || dest.slug}
                    href={`/explore/${dest.slug}`}
                    className={`group bg-[#FAF7F0] rounded-3xl border-2 border-[#E5D5BA] hover:border-[#173B32] shadow-xs hover:shadow-xl interactive-card flex flex-col justify-between p-4 animate-vanvas-slide-up stagger-${Math.min(idx + 1, 4)}`}
                  >
                    <div className="h-64 w-full rounded-2xl overflow-hidden border border-[#E5D5BA] relative">
                      <DestinationArtwork
                        slug={dest.slug}
                        aspectRatio="wide"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-md bg-[#173B32]/90 text-[#EFE5D2] text-[9px] font-mono font-bold uppercase tracking-wider">
                          {dest.state || dest.region || "SANCTUARY"}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 pt-5 space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B4D36]">
                            {dest.altitude_meters ? `${dest.altitude_meters}m Altitude` : "Coastal Sanctuary"}
                          </span>
                          {dest.hindi_name && (
                            <span className="font-devanagari text-xs text-[#B49252] font-semibold">
                              {dest.hindi_name}
                            </span>
                          )}
                        </div>

                        <h3 className="text-2xl font-serif font-black text-[#173B32] group-hover:text-[#B65E3C] transition-colors mt-0.5">
                          {dest.name}
                        </h3>
                        <p className="text-xs text-[#7B4D36] italic font-serif mt-1">
                          &ldquo;{dest.tagline}&rdquo;
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#E5D5BA] flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#536B52]">
                          {dest.places_count || 12} Verified Places
                        </span>
                        <span className="text-[#B65E3C] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                          <span>Explore</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* SECTION 3: REAL TRAVEL MOMENTS & SCENARIOS                */}
      {/* ======================================================== */}
      <section className="bg-[#173B32] text-[#EFE5D2] py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#EFE5D2_1px,transparent_0)] bg-[size:16px_16px]" />

        <div className="max-w-7xl mx-auto space-y-16 relative z-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="font-devanagari text-lg text-[#B49252] font-bold tracking-widest block">
              सफ़र के असली पल
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black text-[#FAF4E8]">
              Made for the way you actually travel.
            </h2>
            <p className="text-sm text-[#D8DED5]/80 font-light">
              No generic dashboards. Real scenarios resolved on the spot.
            </p>
          </div>

          {/* 3 Story-Driven Scenario Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Scenario 1: Early Bus Stand Arrival */}
            <div className="p-6 sm:p-7 rounded-3xl bg-[#0F2924] border border-[#D8DED5]/20 shadow-xl space-y-5 flex flex-col justify-between interactive-card">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <TravelStamp label="08:17 AM ARRIVAL" sublabel="MANALI BUS STAND" variant="terracotta" />
                  <span className="text-xs text-[#B49252] font-mono font-bold">I&apos;M HERE</span>
                </div>
                <h3 className="text-xl font-serif font-bold text-[#FAF4E8]">
                  Arrived 3 hours before hotel check-in?
                </h3>
                <p className="text-xs text-[#D8DED5]/75 leading-relaxed">
                  Instead of dragging 15kg backpacks across Mall Road waiting for 11:00 AM, VANVAS creates an immediate bridge:
                </p>

                {/* Timeline snippet */}
                <div className="space-y-2 pt-2 border-t border-white/10 text-xs font-mono">
                  <div className="flex items-center gap-2 text-[#B49252]">
                    <span>08:30</span>
                    <span>Hot ginger tea &amp; Siddu nearby</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#EFE5D2]">
                    <span>09:30</span>
                    <span>Drop heavy bags at hotel desk</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#D8DED5]/70">
                    <span>10:15</span>
                    <span>Leisurely stroll in Old Manali</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-[#B49252] italic">
                &ldquo;Your room is ready when you return from lunch.&rdquo;
              </div>
            </div>

            {/* Scenario 2: Sudden Mountain Rain */}
            <div className="p-6 sm:p-7 rounded-3xl bg-[#0F2924] border border-[#D8DED5]/20 shadow-xl space-y-5 flex flex-col justify-between interactive-card">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <TravelStamp label="WEATHER SHIFT" sublabel="ALPINE RAIN" variant="indigo" />
                  <span className="text-xs text-blue-300 font-mono font-bold">REPLANNER</span>
                </div>
                <h3 className="text-xl font-serif font-bold text-[#FAF4E8]">
                  Sudden rain ruined your mountain hike?
                </h3>
                <p className="text-xs text-[#D8DED5]/75 leading-relaxed">
                  One tap on <em>&ldquo;It&rsquo;s Raining&rdquo;</em> transforms your outdoor trek into warm wooden indoor sanctuaries:
                </p>

                <div className="space-y-2 pt-2 border-t border-white/10 text-xs font-mono">
                  <div className="flex items-center gap-2 text-rose-300 line-through">
                    <span>✕ Jogini Waterfall Ridge Trail</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-300">
                    <span>✓ Drifters&rsquo; Wooden Book Café</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-300">
                    <span>✓ Tibetan Art &amp; Monastery Hall</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-emerald-300 italic">
                &ldquo;Completed stops remain safe. Only wet stops get swapped.&rdquo;
              </div>
            </div>

            {/* Scenario 3: Private Group Travel Harmony */}
            <div className="p-6 sm:p-7 rounded-3xl bg-[#0F2924] border border-[#D8DED5]/20 shadow-xl space-y-5 flex flex-col justify-between interactive-card">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <TravelStamp label="4 TRAVELLERS" sublabel="GROUP HARMONY" variant="mustard" />
                  <span className="text-xs text-[#B49252] font-mono font-bold">PRIVATE VOTE</span>
                </div>
                <h3 className="text-xl font-serif font-bold text-[#FAF4E8]">
                  Friends can&rsquo;t agree on where to go?
                </h3>
                <p className="text-xs text-[#D8DED5]/75 leading-relaxed">
                  Share an invite link. Everyone votes privately with NO, LIKE, or LOVE without awkward peer pressure:
                </p>

                <div className="space-y-2 pt-2 border-t border-white/10 text-xs font-mono">
                  <div className="flex items-center justify-between text-[#B49252]">
                    <span>Café 1947 Riverside</span>
                    <span className="font-bold">92% Match (4/4 Love)</span>
                  </div>
                  <div className="flex items-center justify-between text-[#EFE5D2]">
                    <span>Solang Paragliding</span>
                    <span>75% Match (3/4 Like)</span>
                  </div>
                  <div className="flex items-center justify-between text-[#D8DED5]/60">
                    <span>Shopping Bazaar</span>
                    <span>30% Match (Passed)</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-[#B49252] italic">
                &ldquo;Votes stay private. The itinerary picks true group consensus.&rdquo;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 4: TRAVEL JOURNAL SNIPPETS & ROUTE NOTES         */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-12">
        <DevanagariHeading
          devanagari="डायरी के पन्नों से"
          english="From the Mountain Journal"
          subtitle="Real field notes, chai stops, and winding roads across India."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <JournalNote
            note="Never take the first taxi outside the bus stand. Walk 300 meters past the bridge; the chai is hotter and the scooters are half the price."
            author="Manali Field Log • Sept 2026"
            location="Old Manali Bridge"
            tapeColor="mustard"
          />

          <JournalNote
            note="If you reach Triveni Ghat by 5:45 PM, sit on the second stone step from the water. The brass lamps reflect right into your eyes as the bells begin."
            author="Rishikesh Field Log • Oct 2026"
            location="Triveni Ghat"
            tapeColor="terracotta"
          />

          <JournalNote
            note="When in Parvati Valley, ignore your watch. The apple crumble at Moon Dance is ready when the pine scent outside turns sweet."
            author="Kasol Field Log • Sept 2026"
            location="Parvati Valley"
            tapeColor="parchment"
          />
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 5: FINAL EVOCATIVE INVITATION                    */}
      {/* ======================================================== */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="p-8 sm:p-14 rounded-3xl bg-[#173B32] text-[#EFE5D2] shadow-2xl relative overflow-hidden space-y-6 journal-card-dark">
          <div className="relative z-10 space-y-4">
            <span className="font-devanagari text-2xl text-[#B49252] font-bold tracking-widest block">
              जहाँ मन करे, निकल पड़ो।
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif font-black text-[#FAF4E8]">
              Go somewhere. We&rsquo;ll figure out the rest.
            </h2>
            <p className="text-sm text-[#D8DED5]/90 max-w-lg mx-auto font-light leading-relaxed">
              Tell VANVAS your destination and days. In 30 seconds, your stays, arrival schedule, and valley stops are organized.
            </p>
            <div className="pt-4">
              <Link
                href="/plan"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] font-bold text-sm tracking-wider uppercase shadow-xl transition-all transform active:scale-95 border border-[#7B4D36]/30 interactive-btn"
              >
                <Sparkles className="w-4 h-4 text-[#B49252]" />
                <span>Start My Journey Plan</span>
                <span className="font-devanagari text-xs opacity-80">(शुरू करें)</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
