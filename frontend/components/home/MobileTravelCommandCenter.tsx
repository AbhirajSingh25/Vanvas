"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Compass, MapPin, Sparkles, ArrowRight, Clock,
  Route, Mountain, ChevronRight, Bookmark, Users,
  CheckCircle2
} from "lucide-react";
import { DestinationSearchBar } from "@/components/search/DestinationSearchBar";
import { DestinationArtwork } from "@/components/brand/DestinationArtwork";
import { SpotlightCarousel } from "@/components/ui/SpotlightCarousel";
import { useDensity } from "@/context/DensityContext";
import { useAskVanvas } from "@/context/AskVanvasContext";
import { useAuth } from "@/context/AuthContext";
import { Destination, TripSummary, Place } from "@/types";
import { CANONICAL_DESTINATIONS } from "@/lib/canonicalDestinations";
import { api } from "@/lib/api";

import { SUPPORTED_QUICK_ESCAPES } from "@/lib/oneDayContentModel";
import { TravelDesk } from "@/components/home/TravelDesk";

interface MobileTravelCommandCenterProps {
  destinations?: (Destination | (typeof CANONICAL_DESTINATIONS)[number])[];
  activeTrip?: TripSummary | null;
}

export const MobileTravelCommandCenter: React.FC<MobileTravelCommandCenterProps> = ({
  destinations = CANONICAL_DESTINATIONS,
  activeTrip,
}) => {
  const { user } = useAuth();
  const { isCompact } = useDensity();
  const { openAskVanvas } = useAskVanvas();
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);

  useEffect(() => {
    if (user) {
      api.getSavedPlaces().then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setSavedPlaces(res.slice(0, 6));
        }
      }).catch(() => {});
    }
  }, [user]);

  const firstName = user?.full_name ? user.full_name.split(" ")[0] : null;

  // Real destinations with verified one-day round-trip plans
  const quickEscapes = useMemo(() => {
    return SUPPORTED_QUICK_ESCAPES.slice(0, 6);
  }, []);

  // 5 Canonical Functional Travel Modes
  const TRAVEL_MODES = [
    {
      id: "road-trip",
      title: "Road Trip",
      description: "Passes & Corridors",
      href: "/road-trip",
      icon: Route,
      badgeBg: "bg-[#173B32]/10 text-[#173B32]",
    },
    {
      id: "one-day",
      title: "Day Escape",
      description: "3h to Full Day",
      href: "/one-day",
      icon: Clock,
      badgeBg: "bg-[#B65E3C]/10 text-[#B65E3C]",
    },
    {
      id: "solo",
      title: "Solo Travel",
      description: "Safe & Community",
      href: "/solo",
      icon: Users,
      badgeBg: "bg-[#7B4D36]/15 text-[#7B4D36]",
    },
    {
      id: "treks",
      title: "Himalayan Treks",
      description: "Verified Trails",
      href: "/treks",
      icon: Mountain,
      badgeBg: "bg-[#173B32]/10 text-[#173B32]",
    },
    {
      id: "nearby",
      title: "Nearby Radar",
      description: "Live Cafés & Dhabas",
      href: "/nearby",
      icon: MapPin,
      badgeBg: "bg-[#B49252]/15 text-[#B49252]",
      isWide: true,
    },
  ];

  return (
    <div
      data-testid="mobile-command-center"
      className={`xl:hidden w-full bg-[#EFE5D2] text-[#20211D] overflow-hidden transition-all duration-200 ${
        isCompact ? "px-3.5 py-2.5 space-y-3 pb-3" : "px-4 py-3.5 space-y-4 pb-4"
      }`}
    >
      {/* 1. GREETING */}
      <div className="pt-0.5">
        <h1
          className={`font-serif font-black text-[#173B32] tracking-tight truncate transition-all ${
            isCompact ? "text-xl" : "text-2xl"
          }`}
        >
          {firstName ? `नमस्ते, ${firstName}` : "नमस्ते, यात्री"}
        </h1>
        <p
          className={`text-[#7B4D36] font-medium leading-tight transition-all ${
            isCompact ? "text-[11px]" : "text-xs"
          }`}
        >
          Where does your journey lead today?
        </p>
      </div>

      {/* 2. COMPACT SEARCH BAR */}
      <div
        className={`bg-[#FAF7F0] border-2 border-[#D8CBB2] shadow-2xs transition-all ${
          isCompact ? "p-1 rounded-xl" : "p-1.5 rounded-2xl"
        }`}
      >
        <DestinationSearchBar />
      </div>

      {/* 3. PRIMARY & SECONDARY ACTIONS */}
      <div className={`grid grid-cols-2 ${isCompact ? "gap-2" : "gap-2.5"}`}>
        <Link
          href="/plan"
          className={`rounded-2xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#FAF4E8] shadow-xs active:scale-98 transition-all flex flex-col justify-between group touch-manipulation ${
            isCompact ? "p-2.5 min-h-[72px]" : "p-3.5 min-h-[88px]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`font-mono uppercase font-bold text-[#FAF4E8]/80 ${
                isCompact ? "text-[9px]" : "text-[10px]"
              }`}
            >
              WIZARD
            </span>
            <ArrowRight
              className={`text-[#FAF4E8] group-hover:translate-x-0.5 transition-transform ${
                isCompact ? "w-3.5 h-3.5" : "w-4 h-4"
              }`}
            />
          </div>
          <div>
            <span
              className={`font-serif font-black block leading-tight ${
                isCompact ? "text-xs" : "text-sm"
              }`}
            >
              Plan My Trip
            </span>
            <span
              className={`text-[#FAF4E8]/80 font-devanagari block leading-none ${
                isCompact ? "text-[9px] mt-0.5" : "text-[10px] mt-0.5"
              }`}
            >
              योजना बनाएं
            </span>
          </div>
        </Link>

        <Link
          href="/explore"
          className={`rounded-2xl bg-[#FAF7F0] border-2 border-[#D8CBB2] hover:border-[#173B32] shadow-2xs active:scale-98 transition-all flex flex-col justify-between group touch-manipulation ${
            isCompact ? "p-2.5 min-h-[72px]" : "p-3.5 min-h-[88px]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`font-mono uppercase font-bold text-[#7B4D36] ${
                isCompact ? "text-[9px]" : "text-[10px]"
              }`}
            >
              SANCTUARIES
            </span>
            <Compass
              className={`text-[#173B32] group-hover:rotate-12 transition-transform ${
                isCompact ? "w-3.5 h-3.5" : "w-4 h-4"
              }`}
            />
          </div>
          <div>
            <span
              className={`font-serif font-bold text-[#173B32] block leading-tight ${
                isCompact ? "text-xs" : "text-sm"
              }`}
            >
              Explore Destinations
            </span>
            <span
              className={`text-[#7B4D36] font-devanagari block leading-none ${
                isCompact ? "text-[9px] mt-0.5" : "text-[10px] mt-0.5"
              }`}
            >
              गंतव्य खोजें
            </span>
          </div>
        </Link>
      </div>

      {/* 4. ACTIVE TRIP COCKPIT (CONTEXTUAL: ONLY WHEN REAL TRIP EXISTS) */}
      {activeTrip && (
        <div
          className={`bg-[#173B32] text-[#EFE5D2] rounded-2xl border border-[#B49252]/40 shadow-lg relative overflow-hidden animate-vanvas-sheet transition-all ${
            isCompact ? "p-3 space-y-2" : "p-4 space-y-3"
          }`}
        >
          <div className="flex items-center justify-between border-b border-[#E5D5BA]/20 pb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-[#B49252]">
                ACTIVE EXPEDITION
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-mono text-[#EFE5D2]/80">
              {activeTrip.start_date} → {activeTrip.end_date}
            </span>
          </div>

          <div>
            <h3
              className={`font-serif font-black text-[#FAF7F0] leading-snug truncate ${
                isCompact ? "text-base" : "text-lg"
              }`}
            >
              {activeTrip.title}
            </h3>
            <p className="text-[11px] text-[#D8DED5]/80 font-mono mt-0.5 truncate">
              {activeTrip.destination_name} • {activeTrip.num_days} Days
            </p>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <Link
              href={`/trips/${activeTrip.id}`}
              className="flex-1 py-1.5 px-3 rounded-xl bg-[#FAF7F0] text-[#173B32] text-xs font-bold text-center tracking-wide hover:bg-[#EFE5D2] active:scale-98 transition-all shadow-xs"
            >
              Open Itinerary
            </Link>
            <button
              type="button"
              onClick={() =>
                openAskVanvas(
                  { tripId: activeTrip.id },
                  "What should we do next right now?"
                )
              }
              className="py-1.5 px-3 rounded-xl bg-[#B65E3C] text-[#FAF7F0] text-xs font-bold tracking-wide active:scale-98 transition-all flex items-center gap-1 shadow-xs cursor-pointer"
              aria-label="Replan or Ask Copilot"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FAF7F0]" />
              <span>Copilot</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. FIVE SCANNABLE TRAVEL MODES (INCLUDING SOLO TRAVEL) */}
      <div className={isCompact ? "space-y-1.5" : "space-y-2"}>
        <div className="flex items-center justify-between">
          <h3
            className={`font-serif font-bold text-[#173B32] ${
              isCompact ? "text-xs" : "text-sm"
            }`}
          >
            Choose Travel Mode
          </h3>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#7B4D36]">
            {TRAVEL_MODES.length} MODES
          </span>
        </div>

        <div className={`grid grid-cols-2 ${isCompact ? "gap-1.5" : "gap-2"}`}>
          {/* Modes 1-4: Road Trip, Day Escape, Solo Travel, Himalayan Treks */}
          {TRAVEL_MODES.slice(0, 4).map((mode) => {
            const Icon = mode.icon;
            return (
              <Link
                key={mode.id}
                href={mode.href}
                className={`rounded-2xl bg-[#FAF7F0] border border-[#D8CBB2] hover:border-[#173B32] shadow-2xs active:scale-98 transition-all flex items-center touch-manipulation group ${
                  isCompact ? "p-2 gap-2" : "p-2.5 sm:p-3 gap-2.5"
                }`}
              >
                <div
                  className={`rounded-xl flex items-center justify-center shrink-0 ${mode.badgeBg} ${
                    isCompact ? "w-7 h-7" : "w-8 h-8"
                  }`}
                >
                  <Icon className={isCompact ? "w-3.5 h-3.5" : "w-4 h-4"} />
                </div>
                <div className="min-w-0">
                  <div
                    className={`font-serif font-bold text-[#173B32] truncate group-hover:text-[#B65E3C] transition-colors ${
                      isCompact ? "text-[11px]" : "text-xs"
                    }`}
                  >
                    {mode.title}
                  </div>
                  <div
                    className={`text-[#7B4D36] truncate ${
                      isCompact ? "text-[9.5px]" : "text-[10px]"
                    }`}
                  >
                    {mode.description}
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Mode 5: Nearby Radar — Balanced horizontal card with live pulse indicator */}
          {(() => {
            const nearbyMode = TRAVEL_MODES[4];
            const Icon = nearbyMode.icon;
            return (
              <Link
                key={nearbyMode.id}
                href={nearbyMode.href}
                className={`col-span-2 rounded-2xl bg-[#FAF7F0] border border-[#D8CBB2] hover:border-[#173B32] shadow-2xs active:scale-98 transition-all flex items-center justify-between touch-manipulation group ${
                  isCompact ? "p-2 gap-2" : "p-2.5 sm:p-3 gap-2.5"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`rounded-xl flex items-center justify-center shrink-0 ${nearbyMode.badgeBg} ${
                      isCompact ? "w-7 h-7" : "w-8 h-8"
                    }`}
                  >
                    <Icon className={isCompact ? "w-3.5 h-3.5" : "w-4 h-4"} />
                  </div>
                  <div className="min-w-0">
                    <div
                      className={`font-serif font-bold text-[#173B32] truncate group-hover:text-[#B65E3C] transition-colors ${
                        isCompact ? "text-[11px]" : "text-xs"
                      }`}
                    >
                      {nearbyMode.title}
                    </div>
                    <div
                      className={`text-[#7B4D36] truncate ${
                        isCompact ? "text-[9.5px]" : "text-[10px]"
                      }`}
                    >
                      Cafés, dhabas & vantage points around you
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 text-[#B49252]">
                  <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#B49252]/15 text-[9px] font-mono font-bold uppercase tracking-wider text-[#7B4D36]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B49252] animate-ping" />
                    <span>Live</span>
                  </span>
                  <ChevronRight
                    className={`text-[#7B4D36] group-hover:translate-x-0.5 transition-transform ${
                      isCompact ? "w-3.5 h-3.5" : "w-4 h-4"
                    }`}
                  />
                </div>
              </Link>
            );
          })()}
        </div>
      </div>

      {/* 6. CURATED DESTINATION SANCTUARIES (HORIZONTAL CAROUSEL WITH PARTIAL NEXT-CARD REVEAL) */}
      <div className={isCompact ? "space-y-1.5" : "space-y-2"}>
        <div className="flex items-center justify-between">
          <div>
            <h3
              className={`font-serif font-bold text-[#173B32] ${
                isCompact ? "text-sm" : "text-base"
              }`}
            >
              Curated Sanctuaries
            </h3>
            <p
              className={`text-[#7B4D36] font-mono ${
                isCompact ? "text-[10px]" : "text-[11px]"
              }`}
            >
              Iconic valleys, high passes & pine forests
            </p>
          </div>
          <Link
            href="/explore"
            className="text-[11px] font-bold text-[#B65E3C] hover:text-[#9E4D2E] flex items-center gap-0.5"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Spotlight Carousel with Original (Vertical Editorial) and Compact (Horizontal Row) density variants */}
        <SpotlightCarousel
          items={destinations.slice(0, 8)}
          keyExtractor={(dest) => dest.slug}
          ariaLabel="Curated Sanctuaries Carousel"
          itemClassName={isCompact ? "w-64" : "w-64 sm:w-72"}
          renderItem={(dest, { isActive }) =>
            isCompact ? (
              /* COMPACT VARIANT: Small clear left thumbnail + right metadata */
              <Link
                href={`/explore/${dest.slug}`}
                data-testid={`spotlight-card-${dest.slug}`}
                className={`block rounded-2xl bg-[#FAF7F0] border p-2.5 shadow-2xs hover:shadow-md active:scale-98 transition-all flex items-center gap-3 group touch-manipulation min-h-[82px] ${
                  isActive
                    ? "border-[#173B32] shadow-md ring-1 ring-[#173B32]/25 bg-white"
                    : "border-[#D8CBB2]"
                }`}
              >
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#173B32] shrink-0 border border-[#D8CBB2]">
                  <DestinationArtwork
                    slug={dest.slug}
                    aspectRatio="square"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  {dest.altitude_meters ? (
                    <span className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold text-[#FAF7F0]">
                      {dest.altitude_meters}m
                    </span>
                  ) : null}
                </div>

                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-[9.5px] font-mono text-[#7B4D36]">
                    <span className="font-bold text-[#173B32] truncate">{dest.state || "Sanctuary"}</span>
                    {dest.hindi_name && (
                      <span className="font-devanagari text-[#B49252] font-semibold shrink-0">
                        · {dest.hindi_name}
                      </span>
                    )}
                  </div>
                  <h4 className="font-serif font-black text-sm text-[#173B32] group-hover:text-[#B65E3C] transition-colors truncate">
                    {dest.name}
                  </h4>
                  <p className="text-[10px] text-[#20211D]/70 font-sans truncate">
                    {dest.tagline || dest.description || "Himalayan sanctuary"}
                  </p>
                </div>
              </Link>
            ) : (
              /* ORIGINAL VARIANT: Large editorial photograph + roomier card */
              <Link
                href={`/explore/${dest.slug}`}
                data-testid={`spotlight-card-${dest.slug}`}
                className={`block rounded-3xl bg-[#FAF7F0] border overflow-hidden shadow-2xs hover:shadow-md active:scale-98 transition-all flex flex-col group touch-manipulation ${
                  isActive
                    ? "border-[#173B32] shadow-lg ring-2 ring-[#173B32]/20"
                    : "border-[#D8CBB2]"
                }`}
              >
                <div className="relative w-full h-34 sm:h-38 bg-[#173B32] overflow-hidden">
                  <DestinationArtwork
                    slug={dest.slug}
                    aspectRatio="wide"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                    {dest.state && (
                      <span className="px-2 py-0.5 rounded bg-black/60 text-[#FAF7F0] text-[9px] font-mono font-bold backdrop-blur-xs">
                        {dest.state}
                      </span>
                    )}
                  </div>
                  {dest.altitude_meters ? (
                    <span className="absolute bottom-2 right-2.5 text-[9.5px] font-mono font-semibold text-[#EFE5D2]/95 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-xs">
                      {dest.altitude_meters}m
                    </span>
                  ) : null}
                </div>

                <div className="p-3 sm:p-3.5 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-serif font-black text-base text-[#173B32] group-hover:text-[#B65E3C] transition-colors truncate">
                      {dest.name}
                    </h4>
                    {dest.hindi_name && (
                      <span className="font-devanagari text-xs text-[#B49252] shrink-0 font-medium">
                        {dest.hindi_name}
                      </span>
                    )}
                  </div>
                  <p className="text-[#20211D]/75 font-sans text-xs line-clamp-2 leading-snug">
                    {dest.tagline || dest.description || "Himalayan sanctuary"}
                  </p>
                </div>
              </Link>
            )
          }
        />
      </div>

      {/* 7. QUICK ESCAPES (ONLY WHEN REAL DATA AVAILABLE) */}
      {quickEscapes.length > 0 && (
        <div className={isCompact ? "space-y-1.5 pt-0.5" : "space-y-2 pt-1"}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#B65E3C]" />
              <h3
                className={`font-serif font-bold text-[#173B32] ${
                  isCompact ? "text-xs" : "text-sm"
                }`}
              >
                Quick Escapes
              </h3>
            </div>
            <Link
              href="/one-day"
              className="text-[11px] font-bold text-[#B65E3C] hover:text-[#9E4D2E] flex items-center gap-0.5"
            >
              <span>Day Trips</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-3.5 sm:-mx-4 px-3.5 sm:px-4 snap-x snap-mandatory touch-manipulation">
            {quickEscapes.map((escape) => (
              <Link
                key={`quick-${escape.slug}`}
                href={`/one-day?planId=${escape.planId}&destination=${escape.slug}&origin=${escape.hubId}`}
                className={`shrink-0 rounded-xl bg-[#FAF7F0] border border-[#D8CBB2] hover:border-[#173B32] active:scale-98 transition-all flex items-center gap-2.5 snap-start touch-manipulation ${
                  isCompact ? "w-48 p-2" : "w-56 p-2.5"
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-[#173B32] overflow-hidden shrink-0 relative">
                  <DestinationArtwork
                    slug={escape.slug}
                    aspectRatio="square"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div
                    className={`font-serif font-bold text-[#173B32] truncate ${
                      isCompact ? "text-[11px]" : "text-xs"
                    }`}
                  >
                    {escape.name}
                  </div>
                  <div className="text-[9.5px] text-[#7B4D36] font-mono truncate">
                    {escape.tagline || escape.state}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 8. USEFUL APP-NATIVE TRAVEL DESK / FIELD KIT */}
      <TravelDesk activeTrip={activeTrip} isCompact={isCompact} />

      {/* 9. SAVED PLACES (CONTEXTUAL: ONLY WHEN REAL SAVED PLACES EXIST) */}
      {savedPlaces.length > 0 && (
        <div
          className={
            isCompact
              ? "space-y-1.5 pt-1 border-t border-[#D8CBB2]/60"
              : "space-y-2 pt-2 border-t border-[#D8CBB2]/60"
          }
        >
          <div className="flex items-center justify-between">
            <h3
              className={`font-serif font-bold text-[#173B32] flex items-center gap-1.5 ${
                isCompact ? "text-xs" : "text-sm"
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-[#B65E3C]" />
              <span>Saved Places</span>
            </h3>
            <Link
              href="/profile?tab=saved"
              className="text-[11px] font-bold text-[#B65E3C] flex items-center gap-0.5"
            >
              <span>View All ({savedPlaces.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-3.5 sm:-mx-4 px-3.5 sm:px-4 pb-1 snap-x touch-manipulation">
            {savedPlaces.map((p) => (
              <Link
                key={p.id}
                href={`/explore/${
                  destinations.find((d) => d.id === p.destination_id)?.slug || "manali"
                }?place=${encodeURIComponent(p.id)}`}
                className={`shrink-0 rounded-xl bg-[#FAF7F0] border border-[#D8CBB2] space-y-0.5 active:scale-98 transition-all snap-start touch-manipulation ${
                  isCompact ? "w-36 p-2" : "w-44 p-2.5"
                }`}
              >
                <div
                  className={`font-serif font-bold text-[#173B32] truncate ${
                    isCompact ? "text-[11px]" : "text-xs"
                  }`}
                >
                  {p.name}
                </div>
                <div className="text-[9.5px] text-[#7B4D36] truncate">
                  {p.category || "Sanctuary"}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

