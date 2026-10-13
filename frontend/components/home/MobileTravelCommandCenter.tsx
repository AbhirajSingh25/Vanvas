"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass, MapPin, Sparkles, ArrowRight, Calendar,
  Route, Mountain, ChevronRight, Bookmark, CloudSun,
  Shield, Navigation, LocateFixed
} from "lucide-react";
import { DestinationSearchBar } from "@/components/search/DestinationSearchBar";
import { TravelStamp } from "@/components/ui/TravelStamp";
import { DestinationArtwork } from "@/components/brand/DestinationArtwork";
import { useAskVanvas } from "@/context/AskVanvasContext";
import { useAuth } from "@/context/AuthContext";
import { Destination, TripSummary, Place } from "@/types";
import { CANONICAL_DESTINATIONS } from "@/lib/canonicalDestinations";
import { api } from "@/lib/api";

interface MobileTravelCommandCenterProps {
  destinations?: Destination[];
  activeTrip?: TripSummary | null;
}

export const MobileTravelCommandCenter: React.FC<MobileTravelCommandCenterProps> = ({
  destinations = CANONICAL_DESTINATIONS,
  activeTrip,
}) => {
  const { user } = useAuth();
  const { openAskVanvas } = useAskVanvas();
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);

  useEffect(() => {
    if (user) {
      api.getSavedPlaces().then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setSavedPlaces(res.slice(0, 5));
        }
      }).catch(() => {});
    }
  }, [user]);

  const firstName = user?.full_name ? user.full_name.split(" ")[0] : null;

  return (
    <div className="xl:hidden w-full bg-[#EFE5D2] text-[#20211D] px-4 py-5 space-y-6 pb-24">
      {/* 1. GREETING & COMMAND BAR */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#B65E3C] animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7B4D36]">
              COMMAND CENTER • यात्रा नियंत्रण
            </span>
          </div>
          <TravelStamp label="HIMALAYAS" variant="forest" />
        </div>

        <h1 className="font-serif text-2xl font-black text-[#173B32] tracking-tight">
          {firstName ? `नमस्ते, ${firstName}` : "नमस्ते, यात्री"}
        </h1>
        <p className="text-xs text-[#20211D]/75 font-sans leading-relaxed">
          Where does your heart want to wander today?
        </p>
      </div>

      {/* 2. PRIMARY SEARCH BAR */}
      <div className="bg-[#FAF7F0] p-1.5 rounded-2xl border-2 border-[#D8CBB2] shadow-sm">
        <DestinationSearchBar />
      </div>

      {/* 3. ACTIVE TRIP COCKPIT (IF TRAVELING) */}
      {activeTrip && (
        <div className="bg-[#173B32] text-[#EFE5D2] p-4.5 rounded-3xl border border-[#B49252]/40 shadow-xl space-y-3 relative overflow-hidden animate-vanvas-sheet">
          <div className="flex items-center justify-between border-b border-[#E5D5BA]/20 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B49252]">
                ACTIVE EXPEDITION
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#EFE5D2]/80">
              {activeTrip.start_date} → {activeTrip.end_date}
            </span>
          </div>

          <div>
            <h3 className="font-serif font-black text-xl text-[#FAF7F0] leading-snug">
              {activeTrip.title}
            </h3>
            <p className="text-xs text-[#D8DED5]/80 font-mono mt-0.5">
              {activeTrip.destination_name} • {activeTrip.num_days} Days
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Link
              href={`/trips/${activeTrip.id}`}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#FAF7F0] text-[#173B32] text-xs font-bold text-center tracking-wide hover:bg-[#EFE5D2] active:scale-98 transition-all shadow-xs"
            >
              Open Itinerary Cockpit
            </Link>
            <button
              type="button"
              onClick={() => openAskVanvas({ tripId: activeTrip.id }, "What should we do next right now?")}
              className="py-2.5 px-3.5 rounded-xl bg-[#B65E3C] text-[#FAF7F0] text-xs font-bold tracking-wide active:scale-98 transition-all flex items-center gap-1 shadow-xs"
              aria-label="Replan or Ask Copilot"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FAF7F0]" />
              <span>Ask Copilot</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. PRIMARY ACTION CARD: PLAN AN EXPEDITION */}
      <div className="bg-gradient-to-br from-[#FAF7F0] to-[#EAE0CD] p-5 rounded-3xl border-2 border-[#D8CBB2] shadow-md space-y-3 relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-[#B65E3C] uppercase tracking-wider">
              SPONTANEOUS TRAVEL
            </span>
            <h2 className="font-serif font-black text-xl text-[#173B32]">
              Plan a New Journey
            </h2>
            <p className="text-xs text-[#20211D]/75 leading-relaxed">
              Adaptive 3-to-14-day trail itineraries with verified stays, mountain dhabas, and riverside spots.
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#B65E3C]/10 border border-[#B65E3C]/20 flex items-center justify-center shrink-0">
            <Compass className="w-6 h-6 text-[#B65E3C]" />
          </div>
        </div>

        <Link
          href="/plan"
          className="w-full py-3 px-4 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#FAF7F0] text-xs font-bold uppercase tracking-wider shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <span>Start Trip Wizard</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 5. TACTILE QUICK ACTIONS GRID */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-sm text-[#173B32]">
            Travel Toolset
          </h3>
          <span className="text-[10px] font-devanagari text-[#7B4D36]">त्वरित कार्य</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/explore"
            className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#D8CBB2] hover:border-[#173B32] shadow-xs active:scale-97 transition-all flex items-center gap-3 touch-manipulation"
          >
            <div className="w-9 h-9 rounded-xl bg-[#173B32]/10 flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5 text-[#173B32]" />
            </div>
            <div className="min-w-0">
              <div className="font-serif font-bold text-xs text-[#173B32] truncate">Explore</div>
              <div className="text-[10px] text-[#7B4D36] truncate">26 Sanctuaries</div>
            </div>
          </Link>

          <Link
            href="/nearby"
            className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#D8CBB2] hover:border-[#173B32] shadow-xs active:scale-97 transition-all flex items-center gap-3 touch-manipulation"
          >
            <div className="w-9 h-9 rounded-xl bg-[#B65E3C]/10 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-[#B65E3C]" />
            </div>
            <div className="min-w-0">
              <div className="font-serif font-bold text-xs text-[#173B32] truncate">Nearby Radar</div>
              <div className="text-[10px] text-[#7B4D36] truncate">Cafés & Stays</div>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => openAskVanvas()}
            className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#D8CBB2] hover:border-[#173B32] shadow-xs active:scale-97 transition-all flex items-center gap-3 text-left cursor-pointer touch-manipulation"
          >
            <div className="w-9 h-9 rounded-xl bg-[#B49252]/15 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#B49252]" />
            </div>
            <div className="min-w-0">
              <div className="font-serif font-bold text-xs text-[#173B32] truncate">Ask VANVAS</div>
              <div className="text-[10px] text-[#7B4D36] truncate">Mountain AI</div>
            </div>
          </button>

          <Link
            href="/road-trip"
            className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#D8CBB2] hover:border-[#173B32] shadow-xs active:scale-97 transition-all flex items-center gap-3 touch-manipulation"
          >
            <div className="w-9 h-9 rounded-xl bg-[#173B32]/10 flex items-center justify-center shrink-0">
              <Route className="w-5 h-5 text-[#173B32]" />
            </div>
            <div className="min-w-0">
              <div className="font-serif font-bold text-xs text-[#173B32] truncate">Road Trip</div>
              <div className="text-[10px] text-[#7B4D36] truncate">Passes & Stops</div>
            </div>
          </Link>
        </div>
      </div>

      {/* 6. CURATED DESTINATION HORIZONS (COMPACT CAROUSEL) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-base text-[#173B32]">
              Curated Sanctuaries
            </h3>
            <p className="text-[11px] text-[#7B4D36] font-mono">
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

        {/* Horizontal Carousel */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 touch-manipulation">
          {destinations.slice(0, 8).map((dest) => (
            <Link
              key={dest.slug}
              href={`/explore/${dest.slug}`}
              className="shrink-0 w-52 rounded-2xl bg-[#FAF7F0] border border-[#D8CBB2] overflow-hidden shadow-xs hover:shadow-md active:scale-98 transition-all flex flex-col group touch-manipulation"
            >
              <div className="relative h-28 w-full bg-[#173B32] overflow-hidden">
                <DestinationArtwork
                  slug={dest.slug}
                  aspectRatio="wide"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[#FAF7F0] text-[9px] font-mono font-bold backdrop-blur-xs">
                  {dest.state}
                </span>
              </div>
              <div className="p-3 space-y-1">
                <h4 className="font-serif font-bold text-sm text-[#173B32] group-hover:text-[#B65E3C] transition-colors truncate">
                  {dest.name}
                </h4>
                <p className="text-[11px] text-[#20211D]/70 font-sans line-clamp-1 leading-snug">
                  {dest.tagline || dest.description || "Himalayan sanctuary"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 7. SAVED PLACES PREVIEW (IF AVAILABLE) */}
      {savedPlaces.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-[#D8CBB2]/60">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-sm text-[#173B32] flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-[#B65E3C]" />
              <span>Saved Places</span>
            </h3>
            <Link
              href="/trips?tab=saved"
              className="text-[11px] font-bold text-[#B65E3C] flex items-center gap-0.5"
            >
              <span>View All ({savedPlaces.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
            {savedPlaces.map((p) => (
              <Link
                key={p.id}
                href={`/explore/${destinations.find((d) => d.id === p.destination_id)?.slug || "manali"}?place=${encodeURIComponent(p.id)}`}
                className="shrink-0 w-44 p-2.5 rounded-xl bg-[#FAF7F0] border border-[#D8CBB2] space-y-1 active:scale-98 transition-all"
              >
                <div className="font-serif font-bold text-xs text-[#173B32] truncate">
                  {p.name}
                </div>
                <div className="text-[10px] text-[#7B4D36] truncate">
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
