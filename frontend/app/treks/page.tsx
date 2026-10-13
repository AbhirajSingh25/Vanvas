"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Mountain, Compass, MapPin, Footprints,
  ArrowRight, Filter, Sparkles, Navigation, Layers,
  ChevronRight, Calendar, AlertTriangle, ShieldCheck,
  CheckCircle2, Flame, RefreshCw, SlidersHorizontal, Eye
} from "lucide-react";
import { ALL_TREKS_LIST, TrekItem, TrekDifficulty, SceneryCategory } from "@/lib/trekContentModel";
import { VanvasImage } from "@/components/ui/VanvasImage";
import { TravelStamp } from "@/components/ui/TravelStamp";
import { CompactTrekCard } from "@/components/compact";
import { useDensity } from "@/context/DensityContext";

export default function TreksPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF4E8]" />}>
      <TreksInner />
    </Suspense>
  );
}

function TreksInner() {
  const { isCompact } = useDensity();
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
    <div className="min-h-screen bg-[#FAF4E8] text-[#20211D] pb-32">
      {/* 1. COMPACT EDITORIAL EXPEDITION DESK HEADER */}
      <section className="bg-[#173B32] text-[#EFE5D2] px-4 sm:px-6 lg:px-8 pt-8 pb-7 border-b-2 border-[#E5D5BA]/30 relative overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B49252]">
                EXPEDITION DESK • हिमालय अभियान
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-black text-[#FAF7F0] tracking-tight">
              Himalayan Treks &amp; Trails
            </h1>
            <p className="text-xs text-[#D8DED5]/80 font-sans mt-0.5">
              Real routes, verified elevation profiles, honest gear checklists, and mountain intelligence.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <TravelStamp label="HIMALAYAS" variant="terracotta" />
            <Link
              href="/plan?mode=trek"
              className="px-4 py-2 rounded-xl bg-[#B65E3C] hover:bg-[#9F4F30] text-[#FAF4E8] text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#B49252]" />
              <span>Plan a Trek</span>
            </Link>
          </div>
        </div>

        {/* Top Quick Answers Ribbon: Difficulty, Duration, Est. Budget, Prime Season */}
        <div className="max-w-6xl mx-auto mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
          <div className="p-2.5 rounded-2xl bg-[#0F2924] border border-[#B49252]/20">
            <span className="text-[10px] text-[#B49252] uppercase block font-bold">Difficulty</span>
            <span className="text-[#FAF7F0] font-bold">Easy to High Alpine</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-[#0F2924] border border-[#B49252]/20">
            <span className="text-[10px] text-[#B49252] uppercase block font-bold">Duration</span>
            <span className="text-[#FAF7F0] font-bold">1 Day – 6 Days</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-[#0F2924] border border-[#B49252]/20">
            <span className="text-[10px] text-[#B49252] uppercase block font-bold">Est. Budget</span>
            <span className="text-[#FAF7F0] font-bold">₹1,500 – ₹12,000</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-[#0F2924] border border-[#B49252]/20">
            <span className="text-[10px] text-[#B49252] uppercase block font-bold">Prime Season</span>
            <span className="text-[#FAF7F0] font-bold">Mar–Jun &amp; Sep–Dec</span>
          </div>
        </div>
      </section>

      {/* 2. SEARCH & EXPEDITION FILTERS CARD */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-3 relative z-20">
        <div className="bg-[#FAF7F0] p-5 sm:p-6 rounded-3xl border-2 border-[#E5D5BA] shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Compass className="w-4 h-4 text-[#B49252] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search trek name, mountain range, or region (e.g. Tungnath, Kedarkantha, Hampta)..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5D5BA] rounded-2xl text-xs font-semibold text-[#173B32] placeholder-[#7B4D36] focus:outline-none focus:border-[#173B32] transition-colors"
              />
            </div>

            {(selectedDifficulty !== "All" || selectedDuration !== "All" || selectedScenery !== "All" || searchQuery) && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-[#B65E3C] hover:underline flex items-center gap-1 font-mono font-bold cursor-pointer shrink-0"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-[#E5D5BA]">
            {/* Difficulty Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#7B4D36] font-bold">
                Difficulty Grade
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5D5BA] rounded-xl text-xs font-medium text-[#173B32] focus:outline-none focus:border-[#173B32]"
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy (Gentle gradient)</option>
                <option value="Moderate">Moderate (5-7 hrs switchbacks)</option>
                <option value="Challenging">Challenging (Steep snow/scree)</option>
                <option value="Alpine / Demanding">Alpine / Demanding (Technical)</option>
              </select>
            </div>

            {/* Duration Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#7B4D36] font-bold">
                Expedition Duration
              </label>
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5D5BA] rounded-xl text-xs font-medium text-[#173B32] focus:outline-none focus:border-[#173B32]"
              >
                <option value="All">All Durations</option>
                <option value="1 Day">1-Day Day Trek</option>
                <option value="Multi-day (2-4 Days)">Multi-Day (2 – 4 Days)</option>
                <option value="Long Expedition (5+ Days)">Long Expedition (5+ Days)</option>
              </select>
            </div>

            {/* Scenery Score Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#7B4D36] font-bold">
                Visual View Score
              </label>
              <select
                value={selectedScenery}
                onChange={(e) => setSelectedScenery(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5D5BA] rounded-xl text-xs font-medium text-[#173B32] focus:outline-none focus:border-[#173B32]"
              >
                <option value="All">All Scenery</option>
                <option value="PANORAMIC">Panoramic 360° View</option>
                <option value="HIGH">High Ridge &amp; Peak Views</option>
                <option value="MODERATE">Forest &amp; Meadow Clearings</option>
              </select>
            </div>

            {/* Approx Budget Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#7B4D36] font-bold">
                <span>Max Approx Budget</span>
                <span className="text-[#B65E3C]">₹{maxBudget}/person</span>
              </div>
              <input
                type="range"
                min={800}
                max={5000}
                step={200}
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number(e.target.value))}
                className="w-full accent-[#B65E3C] h-2 rounded-lg cursor-pointer mt-1"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. EXPEDITION CARDS GRID */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-4">
        <div className="flex items-center justify-between text-xs text-[#7B4D36] border-b border-[#E5D5BA] pb-3">
          <span className="font-mono">
            Displaying <strong className="text-[#173B32]">{filteredTreks.length}</strong> Verified Mountain Trails
          </span>
          <span className="text-[11px] font-mono text-[#B49252] font-bold">
            All routes backed by GPS waypoints
          </span>
        </div>

        {filteredTreks.length === 0 ? (
          <div className="py-16 text-center rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-3 max-w-xl mx-auto">
            <Mountain className="w-10 h-10 text-[#B49252] mx-auto opacity-75" />
            <h3 className="text-xl font-serif font-black text-[#173B32]">No matching treks found</h3>
            <p className="text-xs text-[#7B4D36] leading-relaxed max-w-md mx-auto">
              Try adjusting your budget slider or resetting the difficulty and duration parameters.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="px-5 py-2.5 rounded-xl bg-[#173B32] text-[#FAF4E8] text-xs font-bold uppercase tracking-wider"
            >
              Show All Treks
            </button>
          </div>
        ) : isCompact ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredTreks.map((trek) => (
              <CompactTrekCard key={trek.id} trek={trek} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTreks.map((trek) => {
              const diffBadgeClass =
                trek.difficulty === "Easy"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : trek.difficulty === "Moderate"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-rose-50 text-rose-800 border-rose-200";

              return (
                <Link
                  key={trek.id}
                  href={`/treks/${trek.slug}`}
                  className="group bg-[#FAF7F0] rounded-3xl border-2 border-[#E5D5BA] hover:border-[#173B32] overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  {/* Terrain Image */}
                  <div className="relative h-48 w-full overflow-hidden bg-[#EFE5D2]">
                    <VanvasImage
                      src={trek.heroImage}
                      alt={trek.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase border ${diffBadgeClass}`}>
                        {trek.difficulty}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-[#EFE5D2] text-[#173B32]">
                        {trek.viewScore} VIEW
                      </span>
                    </div>

                    {/* Altitude Risk Flag if applicable */}
                    {trek.altitudeRiskIndicator?.includes("AMS") && (
                      <div className="absolute top-3 right-3 bg-red-800 text-white px-2 py-0.5 rounded-md text-[9px] font-mono font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-300" />
                        <span>AMS RISK</span>
                      </div>
                    )}

                    {/* Bottom Altitude and Duration */}
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs">
                      <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg font-mono text-white font-bold flex items-center gap-1">
                        <Mountain className="w-3.5 h-3.5 text-[#B49252]" />
                        <span>{trek.peakAltitudeFormatted}</span>
                      </div>
                      <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg font-mono text-white">
                        {trek.durationDays === 1 ? trek.durationHours : `${trek.durationDays} Days`}
                      </div>
                    </div>
                  </div>

                  {/* Trek Details Content */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#7B4D36]">
                        <span>{trek.region}, {trek.state}</span>
                        <span className="font-devanagari text-xs text-[#B49252]">{trek.hindiTitle}</span>
                      </div>
                      <h3 className="font-serif font-bold text-lg text-[#173B32] group-hover:text-[#B65E3C] transition-colors leading-snug">
                        {trek.title}
                      </h3>
                      <p className="text-xs text-[#20211D]/80 line-clamp-2 pt-1 font-sans">
                        {trek.tagline || trek.expeditionOverview}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#E5D5BA] flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] font-mono text-[#7B4D36] block">Approx Budget</span>
                        <span className="font-serif font-bold text-sm text-[#173B32]">
                          ₹{trek.approxBudgetPerPerson.toLocaleString()} / person
                        </span>
                      </div>

                      <span className="px-3 py-1.5 rounded-xl bg-[#173B32] group-hover:bg-[#B65E3C] text-[#FAF4E8] text-xs font-bold uppercase transition-colors flex items-center gap-1">
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#B49252]" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
