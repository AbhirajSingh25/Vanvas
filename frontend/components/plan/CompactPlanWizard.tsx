"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles, MapPin, Calendar, Wallet, Users, Compass, Check,
  ArrowRight, ArrowLeft, Search, Loader2, Navigation,
  Bus, Train, Plane, Car, CarTaxiFront, ExternalLink,
  ChevronDown, ChevronUp, Lock, User as UserIcon, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Destination, TransportOption, User } from "@/types";
import { VanvasImage } from "@/components/ui/VanvasImage";
import { resolveDestinationAsset } from "@/lib/visualIntelligence";
import { wizardStepVariants } from "@/lib/motion";
import { getCanonicalHindiName } from "@/lib/canonicalDestinations";

const POPULAR_ORIGIN_HUBS = [
  { name: "Delhi NCR", slug: "delhi", label: "Delhi" },
  { name: "Chandigarh", slug: "chandigarh", label: "Chandigarh" },
  { name: "Mumbai", slug: "mumbai", label: "Mumbai" },
  { name: "Bengaluru", slug: "bengaluru", label: "Bengaluru" },
  { name: "Jaipur", slug: "jaipur", label: "Jaipur" },
  { name: "Dehradun", slug: "dehradun", label: "Dehradun" },
];

const POPULAR_COMPACT_DESTINATIONS = [
  { name: "Manali", slug: "manali" },
  { name: "Rishikesh", slug: "rishikesh" },
  { name: "Goa", slug: "goa" },
  { name: "Jaipur", slug: "jaipur" },
  { name: "Udaipur", slug: "udaipur" },
  { name: "Kasol", slug: "kasol" },
  { name: "Spiti", slug: "spiti" },
  { name: "Varanasi", slug: "varanasi" },
];

export const COMPACT_PHASE_META = [
  { phase: 1, name: "Journey", label: "Route", title: "Where are you heading?" },
  { phase: 2, name: "Timing", label: "Dates", title: "When are you travelling?" },
  { phase: 3, name: "People & Budget", label: "Group", title: "Who is travelling & budget?" },
  { phase: 4, name: "Transport", label: "Transport", title: "How do you want to travel?" },
  { phase: 5, name: "Review", label: "Review", title: "Ready for your expedition?" },
];

interface CompactPlanWizardProps {
  originCity: string;
  setOriginCity: (city: string) => void;
  originSearch: string;
  setOriginSearch: (val: string) => void;
  handleSelectOrigin: (city: string) => void;
  handleRequestGPS: () => void;
  isLocatingGPS: boolean;
  gpsError: string | null;
  destinations: Destination[];
  selectedDestId: string;
  selectedDestObject: Destination | any | null;
  handleSelectDestination: (destItem: any, autoAdvance?: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: any[];
  isSearching: boolean;
  isResolving: boolean;
  resolveError: string | null;
  startDate: string;
  setStartDate: (d: string) => void;
  endDate: string;
  setEndDate: (d: string) => void;
  daysCount: number;
  handleDatePresetSelect: (preset: "this_weekend" | "next_week" | "next_month") => void;
  handleDaysSelect: (days: number) => void;
  companionType: string;
  travellersCount: number;
  setTravellersCount: (n: number) => void;
  handleCompanionSelect: (type: string, count: number) => void;
  travelStyle: string;
  handleStyleSelect: (style: string) => void;
  budgetEstimate: number;
  selectedTransportMode: string;
  handleTransportSelect: (mode: string) => void;
  selectedTransportOption: TransportOption | null;
  setSelectedTransportOption: (opt: TransportOption | null) => void;
  transportOptions: TransportOption[];
  loadingTransport: boolean;
  currentStep: number;
  goToStep: (stepNumber: number, direction?: "next" | "prev") => void;
  handleBack: () => void;
  stepDirection: "next" | "prev";
  handleBuildTrip: () => void;
  isGenerating: boolean;
  generationError: string | null;
  user: User | null;
  authMode: "login" | "register";
  setAuthMode: (mode: "login" | "register") => void;
  authEmail: string;
  setAuthEmail: (e: string) => void;
  authPassword: string;
  setAuthPassword: (p: string) => void;
  authFullName: string;
  setAuthFullName: (n: string) => void;
  authError: string | null;
  authSubmitting: boolean;
  handleInlineAuth: (e: React.FormEvent) => void;
  currentOriginName: string;
  currentDestName: string;
  openAskVanvas: (override?: any) => void;
}

export const CompactPlanWizard: React.FC<CompactPlanWizardProps> = ({
  originCity,
  setOriginCity,
  originSearch,
  setOriginSearch,
  handleSelectOrigin,
  handleRequestGPS,
  isLocatingGPS,
  gpsError,
  destinations,
  selectedDestId,
  selectedDestObject,
  handleSelectDestination,
  searchQuery,
  setSearchQuery,
  searchResults,
  isSearching,
  isResolving,
  resolveError,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  daysCount,
  handleDatePresetSelect,
  handleDaysSelect,
  companionType,
  travellersCount,
  setTravellersCount,
  handleCompanionSelect,
  travelStyle,
  handleStyleSelect,
  budgetEstimate,
  selectedTransportMode,
  handleTransportSelect,
  selectedTransportOption,
  setSelectedTransportOption,
  transportOptions,
  loadingTransport,
  currentStep,
  goToStep,
  stepDirection,
  handleBuildTrip,
  isGenerating,
  generationError,
  user,
  authMode,
  setAuthMode,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authFullName,
  setAuthFullName,
  authError,
  authSubmitting,
  handleInlineAuth,
  currentOriginName,
  currentDestName,
  openAskVanvas,
}) => {
  // Map 7-step wizard step to 5 compact phases
  const compactPhase =
    currentStep <= 2 ? 1 : currentStep === 3 ? 2 : currentStep <= 5 ? 3 : currentStep === 6 ? 4 : 5;

  const [expandedOptionId, setExpandedOptionId] = useState<string | null>(null);

  const goToCompactPhase = (phase: number, dir: "next" | "prev" = "next") => {
    const targetStep = phase === 1 ? 1 : phase === 2 ? 3 : phase === 3 ? 4 : phase === 4 ? 6 : 7;
    goToStep(targetStep, dir);
  };

  const handleCompactBack = () => {
    if (compactPhase === 5) goToCompactPhase(4, "prev");
    else if (compactPhase === 4) goToCompactPhase(3, "prev");
    else if (compactPhase === 3) goToCompactPhase(2, "prev");
    else if (compactPhase === 2) goToCompactPhase(1, "prev");
  };

  const destVisual = resolveDestinationAsset(selectedDestObject?.slug || selectedDestId);

  return (
    <div className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-3xl shadow-xl relative overflow-hidden transition-all duration-300 p-4 sm:p-6">
      {/* Top 5-Phase Stepper & Navigation Header */}
      <div className="border-b border-[#E5D5BA] pb-3.5 mb-5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {compactPhase > 1 ? (
              <button
                type="button"
                onClick={handleCompactBack}
                className="py-1 px-2.5 rounded-xl hover:bg-[#EFE5D2] text-[#173B32] cursor-pointer flex items-center gap-1.5 text-xs font-bold transition-colors interactive-btn"
                aria-label="Previous phase"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B65E3C] bg-[#FAF4E8] px-2 py-0.5 rounded border border-[#E5D5BA]">
                EXPEDITION PLANNER
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#173B32]">
              Phase 0{compactPhase} / 05 • {COMPACT_PHASE_META[compactPhase - 1]?.name}
            </span>
          </div>
        </div>

        {/* 5-Phase Progress Stepper */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
          {COMPACT_PHASE_META.map((p) => {
            const isCompleted = p.phase < compactPhase;
            const isCurrent = p.phase === compactPhase;
            return (
              <div key={p.phase} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full h-1.5 rounded-full transition-all duration-300 ${
                    isCompleted
                      ? "bg-[#173B32]"
                      : isCurrent
                      ? "bg-[#B65E3C]"
                      : "bg-[#E5D5BA]"
                  }`}
                />
                <span
                  className={`text-[9px] font-mono hidden sm:inline-block transition-colors ${
                    isCurrent
                      ? "text-[#B65E3C] font-bold"
                      : isCompleted
                      ? "text-[#173B32] font-medium"
                      : "text-[#7B4D36]/40"
                  }`}
                >
                  {p.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* PHASE 1: JOURNEY (FROM & TO ROUTE COMPOSITION)           */}
      {/* ======================================================== */}
      {compactPhase === 1 && (
        <div className={`space-y-4 ${stepDirection === "prev" ? "animate-vanvas-slide-right" : "animate-vanvas-slide-left"}`}>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C] tracking-wider block">
              PHASE 01 · CORRIDOR ROUTE
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-black text-[#173B32] mt-0.5">
              Where are you heading?
            </h2>
            <p className="text-xs text-[#7B4D36] mt-0.5 font-light">
              Set your departure hub and sanctuary destination in a route view.
            </p>
          </div>

          {/* Route-Style Card (Origin & Destination Connected by Route Line) */}
          <div className="p-4 rounded-2xl bg-white border-2 border-[#E5D5BA] space-y-4 shadow-2xs relative">
            {/* Origin Row */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#173B32] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#173B32] inline-block shrink-0" />
                  <span>From (Departure City)</span>
                </label>
                <button
                  type="button"
                  onClick={handleRequestGPS}
                  disabled={isLocatingGPS}
                  className="text-[10px] font-mono font-bold text-[#B65E3C] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {isLocatingGPS ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
                  <span>Use My Location</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={originSearch || originCity}
                  onChange={(e) => {
                    setOriginSearch(e.target.value);
                    setOriginCity(e.target.value);
                  }}
                  placeholder="e.g. Delhi NCR, Chandigarh, Mumbai, Jaipur..."
                  className="w-full p-2.5 bg-[#FAF7F0] border border-[#E5D5BA] focus:border-[#173B32] rounded-xl text-xs font-bold text-[#173B32] focus:outline-none"
                />
              </div>

              {gpsError && (
                <p className="text-[10px] text-amber-800 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                  {gpsError}
                </p>
              )}

              {/* Quick Origin Hubs */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                {POPULAR_ORIGIN_HUBS.map((hub) => {
                  const isSelected = originCity.toLowerCase() === hub.label.toLowerCase();
                  return (
                    <button
                      key={hub.slug}
                      type="button"
                      onClick={() => handleSelectOrigin(hub.label)}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold shrink-0 transition-colors cursor-pointer border ${
                        isSelected
                          ? "bg-[#173B32] text-[#FAF4E8] border-[#173B32]"
                          : "bg-[#FAF7F0] text-[#173B32] border-[#E5D5BA] hover:bg-[#EFE5D2]"
                      }`}
                    >
                      {hub.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Connecting Route Line Divider */}
            <div className="relative flex items-center justify-center my-1">
              <div className="absolute inset-x-6 h-[1px] bg-gradient-to-r from-[#173B32]/30 via-[#B49252] to-[#B65E3C]/30" />
              <div className="relative bg-white px-2 text-[10px] font-mono text-[#7B4D36] flex items-center gap-1 z-10">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B49252]" />
                <span>EXPEDITION CORRIDOR</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#B49252]" />
              </div>
            </div>

            {/* Destination Row */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B65E3C] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B65E3C] inline-block shrink-0" />
                <span>To (Sanctuary Destination)</span>
              </label>

              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search destination: Manali, Rishikesh, Goa, Jaipur, Leh..."
                  className="w-full pl-8 pr-8 py-2.5 bg-[#FAF7F0] border border-[#E5D5BA] focus:border-[#173B32] rounded-xl text-xs font-bold text-[#173B32] focus:outline-none"
                />
                <Search className="w-3.5 h-3.5 text-[#7B4D36] absolute left-2.5 top-3 pointer-events-none" />
                {(isSearching || isResolving) && (
                  <Loader2 className="w-3.5 h-3.5 text-[#B65E3C] animate-spin absolute right-2.5 top-3 pointer-events-none" />
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {searchResults.length > 0 && (
                <div className="border border-[#E5D5BA] bg-white rounded-xl shadow-lg divide-y divide-[#E5D5BA] max-h-48 overflow-y-auto animate-fadeIn">
                  {searchResults.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectDestination(item, false)}
                      className="w-full text-left p-2.5 flex items-center justify-between hover:bg-[#FAF7F0] text-xs font-bold text-[#173B32] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-[#B65E3C] shrink-0" />
                        <span>{item.name}</span>
                        <span className="text-[10px] text-[#7B4D36] font-normal">
                          {[item.state, item.country].filter(Boolean).join(", ")}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#B65E3C]">Select →</span>
                    </button>
                  ))}
                </div>
              )}

              {resolveError && (
                <p className="text-[10px] text-rose-700 bg-rose-50 p-1.5 rounded-lg border border-rose-200">
                  {resolveError}
                </p>
              )}

              {/* Contextual Destination Artwork Card if Selected */}
              {selectedDestObject && (
                <div className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#173B32]/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#E5D5BA] shrink-0 border border-[#E5D5BA]">
                      <VanvasImage
                        src={destVisual.primarySrc}
                        fallbackSrc={destVisual.fallbackSrc}
                        alt={selectedDestObject.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-serif font-black text-sm text-[#173B32] truncate">
                          {selectedDestObject.name}
                        </h4>
                        {(selectedDestObject.hindi_name || getCanonicalHindiName(selectedDestObject.slug)) && (
                          <span className="text-xs font-serif text-[#B65E3C]">
                            ({selectedDestObject.hindi_name || getCanonicalHindiName(selectedDestObject.slug)})
                          </span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-[#7B4D36] truncate">
                        {selectedDestObject.state ? `${selectedDestObject.state}, India` : "Sanctuary Corridor"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold uppercase shrink-0">
                    Active
                  </span>
                </div>
              )}

              {/* Quick Destination Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                {POPULAR_COMPACT_DESTINATIONS.map((d) => {
                  const isSelected = selectedDestId.toLowerCase().includes(d.slug);
                  return (
                    <button
                      key={d.slug}
                      type="button"
                      onClick={() => handleSelectDestination(d, false)}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold shrink-0 transition-colors cursor-pointer border ${
                        isSelected
                          ? "bg-[#173B32] text-[#FAF4E8] border-[#173B32]"
                          : "bg-[#FAF7F0] text-[#173B32] border-[#E5D5BA] hover:bg-[#EFE5D2]"
                      }`}
                    >
                      {d.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => goToCompactPhase(2, "next")}
            disabled={!originCity || (!selectedDestObject && !selectedDestId)}
            className="w-full py-3.5 rounded-2xl bg-[#173B32] hover:bg-[#20453B] disabled:opacity-50 text-[#FAF4E8] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all mt-4"
          >
            <span>Continue to Timing</span>
            <ArrowRight className="w-4 h-4 text-[#B49252]" />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* PHASE 2: TIMING (DATES & DURATION)                       */}
      {/* ======================================================== */}
      {compactPhase === 2 && (
        <div className={`space-y-4 ${stepDirection === "prev" ? "animate-vanvas-slide-right" : "animate-vanvas-slide-left"}`}>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C] tracking-wider block">
              PHASE 02 · EXPEDITION TIMING
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-black text-[#173B32] mt-0.5">
              When are you travelling?
            </h2>
            <p className="text-xs text-[#7B4D36] mt-0.5 font-light">
              Departing to <strong className="text-[#173B32]">{currentDestName}</strong>. Select start date and length of stay.
            </p>
          </div>

          {/* Presets Row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "this_weekend", label: "This Weekend" },
              { id: "next_week", label: "Next Week" },
              { id: "next_month", label: "Next Month" },
            ].map((p: any) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleDatePresetSelect(p.id)}
                className="p-2.5 rounded-xl bg-white hover:bg-[#FAF7F0] border border-[#E5D5BA] text-xs font-bold text-[#173B32] text-center transition-colors cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Date Range Inputs */}
          <div className="p-4 rounded-2xl bg-white border-2 border-[#E5D5BA] space-y-3 shadow-2xs">
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-[10px] text-[#7B4D36] uppercase font-bold block">
                  START DATE
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setStartDate(newStart);
                    if (newStart > endDate) {
                      setEndDate(newStart);
                    }
                  }}
                  className="w-full p-2 bg-[#FAF7F0] border border-[#E5D5BA] rounded-xl text-xs font-bold text-[#173B32] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#7B4D36] uppercase font-bold block">
                  END DATE
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => {
                    const newEnd = e.target.value;
                    setEndDate(newEnd);
                    const diffDays = Math.max(1, Math.round((new Date(newEnd).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1);
                    handleDaysSelect(diffDays);
                  }}
                  className="w-full p-2 bg-[#FAF7F0] border border-[#E5D5BA] rounded-xl text-xs font-bold text-[#173B32] focus:outline-none"
                />
              </div>
            </div>

            {/* Plain Duration Summary */}
            <div className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] flex items-center justify-between text-xs font-mono">
              <span className="text-[#7B4D36]">Calculated Duration:</span>
              <strong className="text-[#173B32] text-sm font-bold">
                {daysCount} Days ({daysCount - 1} Nights)
              </strong>
            </div>

            {/* Quick Duration Pills */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-mono font-bold uppercase text-[#7B4D36] block">
                Quick Duration Selector:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                {[2, 3, 4, 5, 7, 10].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleDaysSelect(d)}
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-bold shrink-0 transition-colors cursor-pointer border ${
                      daysCount === d
                        ? "bg-[#173B32] text-[#FAF4E8] border-[#173B32]"
                        : "bg-[#FAF7F0] text-[#173B32] border-[#E5D5BA] hover:bg-[#EFE5D2]"
                    }`}
                  >
                    {d} Days
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => goToCompactPhase(3, "next")}
            className="w-full py-3.5 rounded-2xl bg-[#173B32] hover:bg-[#20453B] text-[#FAF4E8] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all mt-4"
          >
            <span>Continue to People &amp; Budget</span>
            <ArrowRight className="w-4 h-4 text-[#B49252]" />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* PHASE 3: PEOPLE & BUDGET                                 */}
      {/* ======================================================== */}
      {compactPhase === 3 && (
        <div className={`space-y-4 ${stepDirection === "prev" ? "animate-vanvas-slide-right" : "animate-vanvas-slide-left"}`}>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C] tracking-wider block">
              PHASE 03 · TRAVELLERS &amp; BUDGET
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-black text-[#173B32] mt-0.5">
              Who is travelling &amp; budget?
            </h2>
            <p className="text-xs text-[#7B4D36] mt-0.5 font-light">
              Set group size, companion type, and travel comfort tier.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border-2 border-[#E5D5BA] space-y-4 shadow-2xs">
            {/* Travellers Counter & Companion Selection */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase text-[#7B4D36] block">
                Number of Travellers &amp; Companion:
              </span>
              <div className="flex items-center justify-between gap-3 bg-[#FAF7F0] p-2 rounded-xl border border-[#E5D5BA]">
                <span className="text-xs font-bold text-[#173B32] pl-2 font-mono">
                  {travellersCount} {travellersCount > 1 ? "Travellers" : "Traveller"}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.max(1, travellersCount - 1);
                      setTravellersCount(next);
                      if (next === 1) handleCompanionSelect("Solo", 1);
                    }}
                    className="w-8 h-8 rounded-lg bg-white border border-[#E5D5BA] text-sm font-bold text-[#173B32] flex items-center justify-center hover:bg-[#EFE5D2] cursor-pointer"
                  >
                    –
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.min(10, travellersCount + 1);
                      setTravellersCount(next);
                    }}
                    className="w-8 h-8 rounded-lg bg-white border border-[#E5D5BA] text-sm font-bold text-[#173B32] flex items-center justify-center hover:bg-[#EFE5D2] cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Companion Pills */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { type: "Solo", count: 1 },
                  { type: "Couple", count: 2 },
                  { type: "Friends", count: 3 },
                  { type: "Family", count: 4 },
                ].map((c) => {
                  const isSelected = companionType.toLowerCase() === c.type.toLowerCase();
                  return (
                    <button
                      key={c.type}
                      type="button"
                      onClick={() => handleCompanionSelect(c.type, c.count)}
                      className={`py-2 px-1.5 rounded-xl text-[11px] font-bold text-center transition-colors cursor-pointer border ${
                        isSelected
                          ? "bg-[#173B32] text-[#FAF4E8] border-[#173B32]"
                          : "bg-[#FAF7F0] text-[#173B32] border-[#E5D5BA] hover:bg-[#EFE5D2]"
                      }`}
                    >
                      {c.type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Travel Comfort & Budget Tiers */}
            <div className="space-y-2 pt-2 border-t border-[#E5D5BA]">
              <span className="text-[10px] font-mono font-bold uppercase text-[#7B4D36] block">
                Travel Style &amp; Daily Budget Tier:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { style: "Budget", rate: "~₹2.2K / day", desc: "Hostels & walks" },
                  { style: "Balanced", rate: "~₹3.8K / day", desc: "Cozy stays & food" },
                  { style: "Comfort", rate: "~₹6.5K / day", desc: "Boutique retreats" },
                ].map((s) => {
                  const isSelected = travelStyle.toLowerCase() === s.style.toLowerCase();
                  return (
                    <button
                      key={s.style}
                      type="button"
                      onClick={() => handleStyleSelect(s.style)}
                      className={`p-2.5 rounded-xl text-left transition-colors cursor-pointer border ${
                        isSelected
                          ? "bg-[#173B32] text-[#FAF4E8] border-[#173B32] shadow-xs"
                          : "bg-[#FAF7F0] text-[#173B32] border-[#E5D5BA] hover:bg-[#EFE5D2]"
                      }`}
                    >
                      <span className="font-serif font-black text-xs block">{s.style}</span>
                      <span className="text-[10px] font-mono opacity-80 block">{s.rate}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Total Budget Plain Display */}
            <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#B49252]/40 space-y-1 text-xs font-mono">
              <div className="flex items-center justify-between text-[#173B32]">
                <span>Total Estimated Trip Budget:</span>
                <strong className="text-sm font-black text-[#B65E3C]">
                  ₹{budgetEstimate.toLocaleString()}
                </strong>
              </div>
              <div className="text-[10px] text-[#7B4D36] flex items-center justify-between">
                <span>Basis: {daysCount} Days · {travellersCount} {travellersCount > 1 ? "Travellers" : "Traveller"}</span>
                <span>Est. not a fixed quote</span>
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => goToCompactPhase(4, "next")}
            className="w-full py-3.5 rounded-2xl bg-[#173B32] hover:bg-[#20453B] text-[#FAF4E8] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all mt-4"
          >
            <span>Continue to Transport</span>
            <ArrowRight className="w-4 h-4 text-[#B49252]" />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* PHASE 4: TRANSPORT SELECTION                             */}
      {/* ======================================================== */}
      {compactPhase === 4 && (
        <div className={`space-y-4 ${stepDirection === "prev" ? "animate-vanvas-slide-right" : "animate-vanvas-slide-left"}`}>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C] tracking-wider block">
              PHASE 04 · TRAVEL CONNECTION
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-black text-[#173B32] mt-0.5">
              How do you want to travel?
            </h2>
            <p className="text-xs text-[#7B4D36] mt-0.5 font-light">
              Corridor from <strong className="text-[#173B32]">{originCity}</strong> to <strong className="text-[#173B32]">{currentDestName}</strong>.
            </p>
          </div>

          {/* Transport Modes Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { mode: "Bus", label: "BUS", icon: Bus, desc: "Volvo / Sleeper" },
              { mode: "Train", label: "TRAIN", icon: Train, desc: "Express / VB" },
              { mode: "Flight", label: "FLIGHT", icon: Plane, desc: "Airport link" },
              { mode: "Road Trip", label: "ROAD TRIP", icon: Car, desc: "Self-drive" },
              { mode: "Cab", label: "CAB / TAXI", icon: CarTaxiFront, desc: "Door-to-door" },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = selectedTransportMode.toLowerCase().replace(" ", "") === m.mode.toLowerCase().replace(" ", "");
              return (
                <button
                  key={m.mode}
                  type="button"
                  onClick={() => handleTransportSelect(m.mode)}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#173B32] text-[#FAF4E8] border-[#173B32] shadow-xs"
                      : "bg-white text-[#173B32] border-[#E5D5BA] hover:bg-[#FAF7F0]"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-[#B49252]" : "text-[#B65E3C]"}`} />
                    <span className="font-serif font-bold text-xs">{m.label}</span>
                  </div>
                  <div className="text-[10px] opacity-75 mt-0.5">{m.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Curated Options Cards List */}
          {selectedTransportMode.toLowerCase().includes("road") ? (
            <div className="p-3.5 bg-white border border-[#173B32]/30 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif font-black text-[#173B32]">
                  🚗 SELF-DRIVE DEPARTURE WINDOW
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  RECOMMENDED
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-[#173B32]">
                <div className="bg-[#FAF7F0] p-2 rounded-xl border border-[#E5D5BA]">
                  <span className="text-[10px] text-[#7B4D36] block">WINDOW</span>
                  <strong>05:30 – 06:30 AM</strong>
                </div>
                <div className="bg-[#FAF7F0] p-2 rounded-xl border border-[#E5D5BA]">
                  <span className="text-[10px] text-[#7B4D36] block">DRIVE TIME</span>
                  <strong>~11.5 – 12.5 hrs</strong>
                </div>
              </div>
            </div>
          ) : loadingTransport ? (
            <div className="p-4 bg-white border border-[#E5D5BA] rounded-2xl flex items-center justify-center gap-2 text-xs text-[#7B4D36]">
              <Loader2 className="w-4 h-4 animate-spin text-[#B65E3C]" />
              <span>Fetching route options for {selectedTransportMode}...</span>
            </div>
          ) : transportOptions.length > 0 ? (
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase text-[#7B4D36] block">
                Available Connections:
              </span>
              <div className="divide-y divide-[#E5D5BA] bg-white border border-[#E5D5BA] rounded-2xl overflow-hidden shadow-xs">
                {transportOptions.slice(0, 3).map((opt) => {
                  const isOptionSelected = selectedTransportOption?.id === opt.id;
                  const isExpanded = expandedOptionId === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedTransportOption(opt)}
                      className={`p-3 space-y-1.5 text-xs cursor-pointer transition-colors ${
                        isOptionSelected ? "bg-[#173B32]/5 border-l-4 border-l-[#173B32]" : "hover:bg-[#FAF7F0]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isOptionSelected ? "border-[#173B32] bg-[#173B32]" : "border-[#B65E3C]"
                          }`}>
                            {isOptionSelected && <span className="w-1.5 h-1.5 bg-[#FAF4E8] rounded-full" />}
                          </div>
                          <span className="font-bold text-[#173B32]">{opt.operator_name}</span>
                          <span className="text-[8.5px] font-mono px-1 py-0.2 rounded bg-[#173B32] text-[#FAF4E8] uppercase font-bold">
                            {opt.data_state || "CURATED"}
                          </span>
                        </div>
                        <span className="font-mono font-black text-sm text-[#173B32]">
                          ₹{opt.price.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#7B4D36] font-mono pl-5">
                        <span>{opt.departure_time} → {opt.arrival_time} (~{opt.duration_hours}h)</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedOptionId(isExpanded ? null : opt.id);
                          }}
                          className="text-[#B65E3C] font-bold underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>{isExpanded ? "Less" : "Details"}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>

                      {/* Disclosure for secondary schedule/route facts */}
                      {isExpanded && (
                        <div className="text-[10px] text-[#7B4D36] bg-[#FAF7F0] p-2 rounded-xl border border-[#E5D5BA] ml-5 space-y-1 animate-fadeIn">
                          <div><strong>Boarding:</strong> {opt.departure_location}</div>
                          <div><strong>Drop:</strong> {opt.arrival_location}</div>
                          {opt.disclaimer && <div className="italic">ⓘ {opt.disclaimer}</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              Direct schedules unavailable. Route guidance and travel time buffers will be applied.
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => goToCompactPhase(5, "next")}
            className="w-full py-3.5 rounded-2xl bg-[#173B32] hover:bg-[#20453B] text-[#FAF4E8] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all mt-4"
          >
            <span>Continue to Review</span>
            <ArrowRight className="w-4 h-4 text-[#B49252]" />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* PHASE 5: COMPACT REVIEW                                  */}
      {/* ======================================================== */}
      {compactPhase === 5 && (
        <div className={`space-y-4 ${stepDirection === "prev" ? "animate-vanvas-slide-right" : "animate-vanvas-slide-left"}`}>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C] tracking-wider block">
              PHASE 05 · JOURNEY REVIEW
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-black text-[#173B32] mt-0.5">
              Ready to travel to {currentDestName}?
            </h2>
            <p className="text-xs text-[#7B4D36] mt-0.5 font-light">
              Review your corridor ticket before generating your expedition.
            </p>
          </div>

          {/* Compact Route Ticket Card */}
          <div className="p-4 rounded-2xl bg-[#FAF7F0] border-2 border-[#173B32] space-y-3 shadow-md relative">
            {/* Route Identity & Destination Artwork */}
            <div className="flex items-center justify-between gap-3 border-b border-[#E5D5BA] pb-3">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[9px] font-mono uppercase text-[#7B4D36] font-bold tracking-wider">
                  CORRIDOR TICKET
                </span>
                <h3 className="font-serif font-black text-lg text-[#173B32] truncate">
                  {currentOriginName} → {currentDestName}
                </h3>
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-bold uppercase inline-block">
                  {selectedTransportMode}
                </span>
              </div>

              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#E5D5BA] border border-[#173B32]/30 shrink-0 shadow-xs">
                <VanvasImage
                  src={destVisual.primarySrc}
                  fallbackSrc={destVisual.fallbackSrc}
                  alt={currentDestName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Journey Summary Grid */}
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="bg-white p-2 rounded-xl border border-[#E5D5BA]">
                <span className="text-[#7B4D36] block text-[9px]">DURATION</span>
                <strong className="text-[#173B32]">{daysCount} Days</strong>
              </div>
              <div className="bg-white p-2 rounded-xl border border-[#E5D5BA]">
                <span className="text-[#7B4D36] block text-[9px]">TRAVELLERS</span>
                <strong className="text-[#173B32]">{travellersCount} ({companionType})</strong>
              </div>
              <div className="bg-white p-2 rounded-xl border border-[#E5D5BA]">
                <span className="text-[#7B4D36] block text-[9px]">EST. BUDGET</span>
                <strong className="text-[#173B32]">₹{(budgetEstimate / 1000).toFixed(0)}K</strong>
              </div>
            </div>

            {/* Transport details line */}
            <div className="p-2.5 rounded-xl bg-white border border-[#E5D5BA] flex items-center justify-between text-xs font-mono">
              <span className="text-[#7B4D36] truncate">
                {selectedTransportOption?.operator_name || (
                  selectedTransportMode.toLowerCase().includes("road")
                    ? "Self-Drive Highway Route"
                    : `${selectedTransportMode} Transit`
                )}
              </span>
              <span className="font-bold text-[#173B32] shrink-0">
                {selectedTransportOption ? `₹${selectedTransportOption.price.toLocaleString()} / seat` : "Calculated Route"}
              </span>
            </div>

            <div className="text-[10px] text-[#7B4D36] font-mono pt-0.5">
              Dates: {startDate} → {endDate}
            </div>
          </div>

          {/* Guest Authentication Check */}
          {!user && (
            <div className="p-3.5 rounded-2xl bg-white border-2 border-[#B49252] space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#B65E3C]" />
                  <span className="font-serif font-bold text-xs text-[#173B32]">
                    {authMode === "login" ? "Sign in to save trip" : "Create account to save trip"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === "login" ? "register" : "login");
                  }}
                  className="text-[11px] font-mono font-bold text-[#B65E3C] underline cursor-pointer"
                >
                  {authMode === "login" ? "Sign up" : "Sign in"}
                </button>
              </div>

              <form onSubmit={handleInlineAuth} className="space-y-2">
                {authMode === "register" && (
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={authFullName}
                    onChange={(e) => setAuthFullName(e.target.value)}
                    required
                    className="w-full p-2 bg-[#FAF7F0] border border-[#E5D5BA] rounded-xl text-xs font-medium text-[#173B32] focus:outline-none"
                  />
                )}
                <input
                  type="email"
                  placeholder="Email Address"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                  className="w-full p-2 bg-[#FAF7F0] border border-[#E5D5BA] rounded-xl text-xs font-medium text-[#173B32] focus:outline-none"
                />
                <input
                  type="password"
                  placeholder="Password (min 6 chars)"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                  className="w-full p-2 bg-[#FAF7F0] border border-[#E5D5BA] rounded-xl text-xs font-medium text-[#173B32] focus:outline-none"
                />

                {authError && (
                  <p className="text-[11px] text-rose-700 bg-rose-50 p-1.5 rounded-lg border border-rose-200">
                    {authError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full py-2 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#FAF4E8] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {authSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#B49252]" /> : <UserIcon className="w-3.5 h-3.5 text-[#B49252]" />}
                  <span>{authMode === "login" ? "Sign In & Continue" : "Create Account & Continue"}</span>
                </button>
              </form>
            </div>
          )}

          {generationError && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2 shadow-xs">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{generationError}</span>
            </div>
          )}

          {/* Actions Stack: Primary Full-Width Build + Aligned 2-Column Secondary Row */}
          <div className="pt-2 space-y-2.5">
            {/* Primary Action: Build My Trip */}
            <button
              type="button"
              id="vanvas-build-my-trip-btn"
              onClick={handleBuildTrip}
              disabled={isGenerating || !user}
              className="w-full py-4 rounded-2xl bg-[#B65E3C] hover:bg-[#9E4D2E] disabled:opacity-50 text-[#FAF4E8] font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-xl cursor-pointer transition-all interactive-btn"
            >
              <Sparkles className="w-4 h-4 text-[#B49252]" />
              <span>
                {!user
                  ? "Sign In Above to Build Trip"
                  : selectedTransportMode.toLowerCase().includes("road")
                  ? "Launch Map Road Trip →"
                  : "Build My Trip →"}
              </span>
            </button>

            {/* Secondary Action Row: Exactly 2 equal aligned columns at 360px+ */}
            <div className="grid grid-cols-2 gap-3 pt-0.5">
              <button
                type="button"
                onClick={() => goToCompactPhase(1, "prev")}
                className="h-11 sm:h-12 px-3 rounded-xl bg-[#FAF7F0] hover:bg-[#EFE5D2] border border-[#E5D5BA] text-[#173B32] font-semibold text-xs tracking-wide flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#7B4D36] shrink-0" />
                <span className="truncate">Edit</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  openAskVanvas({
                    type: "plan",
                    currentLocation: currentOriginName,
                    destinationName: currentDestName,
                    destinationSlug: selectedDestObject?.slug || selectedDestId,
                    title: `PLANNING · ${currentDestName.toUpperCase()}`,
                    subtitle: `${currentOriginName} → ${currentDestName} · ${daysCount} Days`,
                  });
                }}
                className="h-11 sm:h-12 px-3 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#FAF4E8] font-semibold text-xs tracking-wide flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#B49252] shrink-0" />
                <span className="truncate">Ask VANVAS</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
