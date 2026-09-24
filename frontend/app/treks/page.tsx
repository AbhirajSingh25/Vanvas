"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Mountain, Compass, MapPin, Footprints, ShieldAlert,
  ArrowRight, Filter, Sparkles, Navigation, Layers,
  ChevronRight, Calendar, AlertTriangle, ShieldCheck,
  CheckCircle2, Flame, RefreshCw, SlidersHorizontal, Eye
} from "lucide-react";
import { ALL_TREKS_LIST, TrekItem, TrekDifficulty, SceneryCategory } from "@/lib/trekContentModel";
import { VanvasImage } from "@/components/ui/VanvasImage";
import { TravelStamp } from "@/components/ui/TravelStamp";

function TreksInner() {
  const searchParams = useSearchParams();
  const destQuery = searchParams.get("destination") || searchParams.get("dest") || "";

  const [searchQuery, setSearchQuery] = useState(destQuery);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");
  const [selectedDuration, setSelectedDuration] = useState<string>("All");
  const [selectedSeason, setSelectedSeason] = useState<string>("All");
  const [selectedScenery, setSelectedScenery] = useState<string>("All");
  const [maxBudget, setMaxBudget] = useState<number>(5000);

  const filteredTreks = useMemo(() => {
    return ALL_TREKS_LIST.filter((trek) => {
      // Search query (name, region, state, mountain range)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesText =
          trek.title.toLowerCase().includes(q) ||
          trek.region.toLowerCase().includes(q) ||
          trek.state.toLowerCase().includes(q) ||
          trek.mountainRange.toLowerCase().includes(q) ||
          (trek.destinationSlug && trek.destinationSlug.toLowerCase().includes(q));
        if (!matchesText) return false;
      }

      // Difficulty
      if (selectedDifficulty !== "All" && trek.difficulty !== selectedDifficulty) {
        return false;
      }

      // Duration
      if (selectedDuration === "1 Day" && trek.durationDays !== 1) return false;
      if (selectedDuration === "Multi-day (2-4 Days)" && (trek.durationDays < 2 || trek.durationDays > 4)) return false;
      if (selectedDuration === "Long Expedition (5+ Days)" && trek.durationDays < 5) return false;

      // Scenery
      if (selectedScenery !== "All" && trek.viewScore !== selectedScenery) {
        return false;
      }

      // Budget
      if (trek.approxBudgetPerPerson > maxBudget) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedDifficulty, selectedDuration, selectedSeason, selectedScenery, maxBudget]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedDifficulty("All");
    setSelectedDuration("All");
    setSelectedSeason("All");
    setSelectedScenery("All");
    setMaxBudget(5000);
  };

  return (
    <div className="min-h-screen bg-[#111A16] text-[#EFE5D2] pb-28 selection:bg-[#E05A2B] selection:text-white">
      {/* 1. EXPEDITION FIELD HERO */}
      <section className="relative min-h-[65vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20 overflow-hidden border-b border-[#2C3E35]">
        {/* Topographic Contour Texture & Mountain Backdrop */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1C2C24] via-[#111A16] to-[#0A100D] opacity-95" />
        
        {/* Subtle Topo Grid Background Lines */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#B49252 1px, transparent 1px), linear-gradient(to right, #24352D 1px, transparent 1px), linear-gradient(to bottom, #24352D 1px, transparent 1px)`,
            backgroundSize: "40px 40px, 80px 80px, 80px 80px"
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-6">
          {/* Header Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="px-3.5 py-1 rounded-full bg-[#E05A2B] text-white text-[11px] font-mono font-black tracking-widest uppercase shadow-lg border border-[#FF7D52]/40 flex items-center gap-1.5">
              <Footprints className="w-3.5 h-3.5" />
              <span>TREK EXPEDITION DESK</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-[#1A2E24] text-[#B49252] text-[11px] font-mono tracking-wider uppercase border border-[#B49252]/40">
              [ 2,680M – 4,329M ALTITUDE RANGE ]
            </span>
          </div>

          <div className="space-y-2">
            <span className="font-devanagari text-2xl sm:text-3xl text-[#B49252] font-bold tracking-widest block">
              पर्वत आरोहण • हिमालय पदयात्रा
            </span>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-black tracking-tight text-[#FAF4E8] leading-tight">
              WHERE DO YOU WANT TO CLIMB?
            </h1>
          </div>

          <p className="text-sm sm:text-base text-[#B3C4B9] max-w-2xl mx-auto font-serif italic leading-relaxed">
            &ldquo;From your very first rhododendron forest trail to serious high-altitude Himalayan summits. Real routes, verified elevation profiles, honest gear checklists, and field intelligence.&rdquo;
          </p>

          {/* Quick Search & Expedition Filter Bar */}
          <div className="pt-4 max-w-3xl mx-auto">
            <div className="bg-[#18261F] p-3 sm:p-4 rounded-2xl border border-[#344D40] shadow-2xl flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Compass className="w-5 h-5 text-[#B49252] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search trek name, mountain range, or region (e.g. Tungnath, Kedarkantha)..."
                  className="w-full pl-11 pr-4 py-3 bg-[#0E1713] border border-[#2B4034] rounded-xl text-xs sm:text-sm text-[#FAF4E8] placeholder-[#6D8578] focus:outline-none focus:border-[#E05A2B] transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {}}
                  className="w-full sm:w-auto px-6 py-3 bg-[#E05A2B] hover:bg-[#C8491D] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Mountain className="w-4 h-4" />
                  <span>Find Trails ({filteredTreks.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. EXPEDITION CONTROLS & FILTER SYSTEM */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-[#16221C] rounded-2xl border border-[#2A3E33] p-4 sm:p-6 mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A3E33] pb-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#E05A2B]" />
              <h2 className="text-sm font-bold tracking-wider uppercase text-[#FAF4E8]">
                Expedition Parameters & Filters
              </h2>
            </div>
            
            {(selectedDifficulty !== "All" || selectedDuration !== "All" || selectedScenery !== "All" || searchQuery) && (
              <button
                onClick={resetFilters}
                className="text-xs text-[#E05A2B] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset all parameters</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Difficulty Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#8FA699]">
                Difficulty Grade
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0E1713] border border-[#2B4034] rounded-xl text-xs text-[#FAF4E8] focus:outline-none focus:border-[#E05A2B]"
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy (Gentle gradient, baseline fitness)</option>
                <option value="Moderate">Moderate (Alpine switchbacks, 5-7 hrs)</option>
                <option value="Challenging">Challenging (Steep snow/scree, multi-day)</option>
                <option value="Alpine / Demanding">Alpine / Demanding (Technical, high altitude)</option>
              </select>
            </div>

            {/* Duration Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#8FA699]">
                Expedition Duration
              </label>
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0E1713] border border-[#2B4034] rounded-xl text-xs text-[#FAF4E8] focus:outline-none focus:border-[#E05A2B]"
              >
                <option value="All">All Durations</option>
                <option value="1 Day">1-Day Day Trek (Summit & Return)</option>
                <option value="Multi-day (2-4 Days)">Multi-Day (2 – 4 Days Alpine Camp)</option>
                <option value="Long Expedition (5+ Days)">Long Expedition (5+ Days)</option>
              </select>
            </div>

            {/* Scenery Score Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#8FA699]">
                Visual View Score
              </label>
              <select
                value={selectedScenery}
                onChange={(e) => setSelectedScenery(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0E1713] border border-[#2B4034] rounded-xl text-xs text-[#FAF4E8] focus:outline-none focus:border-[#E05A2B]"
              >
                <option value="All">All Scenery Categories</option>
                <option value="PANORAMIC">Panoramic 360° (Great Himalayan Ranges)</option>
                <option value="HIGH">High Ridge (Direct cliff & peak views)</option>
                <option value="MODERATE">Moderate (Forest clearings & meadows)</option>
              </select>
            </div>

            {/* Approx Budget Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#8FA699]">
                <span>Approx Budget Max</span>
                <span className="text-[#B49252] font-bold">₹{maxBudget} / person</span>
              </div>
              <input
                type="range"
                min={800}
                max={5000}
                step={200}
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number(e.target.value))}
                className="w-full accent-[#E05A2B] bg-[#0E1713] h-2 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 3. FEATURED EXPEDITION CARDS GRID */}
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-[#8FA699] border-b border-[#2A3E33] pb-3">
            <span className="font-mono">
              Displaying <strong className="text-[#FAF4E8]">{filteredTreks.length}</strong> Himalayan & Sahyadri Trails
            </span>
            <span className="text-[11px] font-mono text-[#B49252]">
              All data verified with topographic coordinates
            </span>
          </div>

          {filteredTreks.length === 0 ? (
            <div className="py-20 text-center rounded-3xl bg-[#16221C] border border-[#2A3E33] space-y-4 max-w-xl mx-auto">
              <Mountain className="w-12 h-12 text-[#E05A2B] mx-auto opacity-75" />
              <div className="space-y-1">
                <h3 className="text-xl font-serif font-black text-[#FAF4E8]">No matching treks found</h3>
                <p className="text-xs text-[#8FA699] leading-relaxed max-w-md mx-auto">
                  Try adjusting your budget slider or clearing the difficulty and duration filters.
                </p>
              </div>
              <button
                onClick={resetFilters}
                className="px-5 py-2.5 rounded-xl bg-[#E05A2B] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#C8491D] transition-colors"
              >
                Show All Treks
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTreks.map((trek) => {
                const diffColor =
                  trek.difficulty === "Easy"
                    ? "bg-emerald-950 text-emerald-300 border-emerald-700/60"
                    : trek.difficulty === "Moderate"
                    ? "bg-amber-950 text-amber-300 border-amber-700/60"
                    : "bg-red-950 text-red-300 border-red-700/60";

                const sceneryBadgeColor =
                  trek.viewScore === "PANORAMIC"
                    ? "bg-[#B49252] text-[#0A100D] font-black"
                    : "bg-[#25392F] text-[#EFE5D2] font-semibold";

                return (
                  <Link
                    key={trek.id}
                    href={`/treks/${trek.slug}`}
                    className="group bg-[#15201A] rounded-2xl border border-[#2A3E33] hover:border-[#E05A2B] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
                  >
                    {/* Visual Terrain Image & Elevation Stamps */}
                    <div className="relative h-56 w-full overflow-hidden bg-[#0E1713]">
                      <VanvasImage
                        src={trek.heroImage}
                        alt={trek.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-85"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#15201A] via-transparent to-black/30 pointer-events-none" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase border ${diffColor}`}>
                          {trek.difficulty}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider ${sceneryBadgeColor}`}>
                          {trek.viewScore} VIEW
                        </span>
                      </div>

                      {/* Altitude Risk Flag if applicable */}
                      {trek.altitudeRiskIndicator.includes("AMS") && (
                        <div className="absolute top-3 right-3 bg-red-900/90 text-red-200 border border-red-500/50 px-2 py-0.5 rounded-md text-[9px] font-mono font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                          <span>AMS RISK</span>
                        </div>
                      )}

                      {/* Bottom Image Stats */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                        <div className="bg-[#0A100D]/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 font-mono text-[#FAF4E8] font-bold flex items-center gap-1.5">
                          <Mountain className="w-3.5 h-3.5 text-[#E05A2B]" />
                          <span>{trek.peakAltitudeFormatted}</span>
                        </div>
                        <div className="bg-[#0A100D]/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 font-mono text-[#FAF4E8]">
                          {trek.durationDays === 1 ? trek.durationHours : `${trek.durationDays} Days`}
                        </div>
                      </div>
                    </div>

                    {/* Content Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] text-[#B49252] font-mono uppercase tracking-wider">
                          <MapPin className="w-3 h-3 text-[#E05A2B]" />
                          <span>{trek.region}, {trek.state}</span>
                        </div>

                        <h3 className="text-xl font-serif font-black text-[#FAF4E8] group-hover:text-[#E05A2B] transition-colors leading-snug">
                          {trek.title}
                        </h3>

                        <p className="text-xs text-[#9BB1A4] line-clamp-2 leading-relaxed font-serif">
                          {trek.expeditionOverview}
                        </p>
                      </div>

                      {/* Fact Strip & Budget */}
                      <div className="pt-3 border-t border-[#25372D] space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-[#8FA699]">
                          <div className="bg-[#0D1612] p-2 rounded-lg border border-[#1E2D25]">
                            <span className="block text-[9px] uppercase text-[#6D8578]">Base Camp</span>
                            <span className="text-[#FAF4E8] font-semibold truncate block">{trek.baseCamp}</span>
                          </div>
                          <div className="bg-[#0D1612] p-2 rounded-lg border border-[#1E2D25]">
                            <span className="block text-[9px] uppercase text-[#6D8578]">Approx Budget</span>
                            <span className="text-[#B49252] font-bold">₹{trek.approxBudgetPerPerson} / person</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-[11px] text-[#8FA699] font-mono">
                            {trek.routes.length} Route Option{trek.routes.length > 1 ? "s" : ""}
                          </span>
                          <span className="text-[#E05A2B] font-bold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            <span>Open Field Journal</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function TreksPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#111A16] flex flex-col items-center justify-center text-[#EFE5D2] gap-3">
          <Mountain className="w-10 h-10 text-[#E05A2B] animate-pulse" />
          <span className="text-xs font-mono text-[#B49252]">
            Loading Himalayan Expedition Operating Layer...
          </span>
        </div>
      }
    >
      <TreksInner />
    </Suspense>
  );
}
