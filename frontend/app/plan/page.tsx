"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles, MapPin, Calendar, Wallet, Users, Compass, Check,
  ArrowRight, ArrowLeft, Search, Loader2, RefreshCw, AlertCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { Destination } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useDensity } from "@/context/DensityContext";
import confetti from "canvas-confetti";
import { TravelStamp } from "@/components/ui/TravelStamp";
import {
  CANONICAL_DESTINATIONS,
  CANONICAL_HINDI_NAMES,
} from "@/lib/canonicalDestinations";

function PlanWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawInitial = searchParams?.get("dest") || searchParams?.get("destination") || "manali";
  const initialDest = rawInitial.replace(/^(dyn|dest)-/, "").trim() || "manali";
  const hasExplicitDest = Boolean(searchParams?.get("dest") || searchParams?.get("destination"));
  const urlBudget = searchParams?.get("budget") || "";
  const urlDays = searchParams?.get("days") || "";
  const urlCompanion = searchParams?.get("companion") || "";
  const { user } = useAuth();
  const { isCompact } = useDensity();

  // Progressive Step State: 1 to 6, plus Step 7 (Review)
  const [currentStep, setCurrentStep] = useState<number>(() => (hasExplicitDest ? 2 : 1));

  // Destination Resolution State
  const [destinations, setDestinations] = useState<Destination[]>(CANONICAL_DESTINATIONS);
  const [loadingDestinations, setLoadingDestinations] = useState(true);
  const [selectedDestId, setSelectedDestId] = useState<string>(initialDest);
  const [selectedDestObject, setSelectedDestObject] = useState<Destination | any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  // Dates & Duration State
  const [dateSelectionType, setDateSelectionType] = useState<"this_weekend" | "next_week" | "next_month" | "custom">("this_weekend");
  const [startDate, setStartDate] = useState<string>(() => {
    const today = new Date();
    // Default to upcoming Saturday if weekend, or tomorrow
    const day = today.getDay();
    const daysUntilSat = (6 - day + 7) % 7 || 7;
    const sat = new Date();
    sat.setDate(today.getDate() + daysUntilSat);
    return sat.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    const addDays = urlDays ? Math.max(1, parseInt(urlDays, 10)) - 1 : 3;
    d.setDate(d.getDate() + (isNaN(addDays) ? 3 : addDays));
    return d.toISOString().split("T")[0];
  });
  const [daysCount, setDaysCount] = useState<number>(() => (urlDays ? parseInt(urlDays, 10) || 4 : 4));

  // Companions State
  const [companionType, setCompanionType] = useState<string>(() => {
    if (urlCompanion) {
      const match = ["Solo", "Couple", "Friends", "Family"].find(
        (c) => c.toLowerCase() === urlCompanion.toLowerCase()
      );
      if (match) return match;
    }
    return "Couple";
  });
  const [travellersCount, setTravellersCount] = useState<number>(() => {
    if (urlCompanion?.toLowerCase() === "solo" || urlCompanion?.toLowerCase() === "just me") return 1;
    if (urlCompanion?.toLowerCase() === "friends") return 3;
    if (urlCompanion?.toLowerCase() === "family") return 4;
    return 2;
  });

  // Vibe & Interests State (Multi-select)
  const [selectedVibes, setSelectedVibes] = useState<string[]>(["Nature", "Food", "Slow"]);

  // Travel Style & Budget Tier
  const [travelStyle, setTravelStyle] = useState<string>("Balanced");
  const [budgetEstimate, setBudgetEstimate] = useState<number>(25000);

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState("Drafting your itinerary...");

  // Calculate estimated budget when days, travellers, and style change
  useEffect(() => {
    const perDayPerPerson =
      travelStyle === "Budget" ? 2200 : travelStyle === "Comfort" ? 6500 : 3800;
    const est = daysCount * travellersCount * perDayPerPerson;
    setBudgetEstimate(urlBudget ? parseFloat(urlBudget) : est);
  }, [daysCount, travellersCount, travelStyle, urlBudget]);

  // Load initial destinations
  useEffect(() => {
    api.getDestinations(false)
      .then((data) => {
        const loaded = data && data.length > 0 ? data : CANONICAL_DESTINATIONS;
        setDestinations(loaded);
        const match = loaded.find(
          (d) =>
            d.id === initialDest ||
            d.slug.toLowerCase() === initialDest.toLowerCase() ||
            d.id === `dest-${initialDest.toLowerCase()}`
        );
        if (match) {
          setSelectedDestId(match.id);
          setSelectedDestObject(match);
        } else {
          api.resolveDestination(initialDest).then((res) => {
            if (res) {
              setSelectedDestId(res.id || res.slug);
              setSelectedDestObject(res);
            }
          }).catch(() => {});
        }
      })
      .catch(() => {
        setDestinations(CANONICAL_DESTINATIONS);
      })
      .finally(() => setLoadingDestinations(false));
  }, [initialDest]);

  // Debounced search for destination input
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    const abortController = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.searchDestinations(searchQuery, 6, abortController.signal);
        setSearchResults(res || []);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Destination search error:", err);
        }
      } finally {
        setIsSearching(false);
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [searchQuery]);

  // Handle single-select destination selection with AUTO-ADVANCE
  const handleSelectDestination = async (destItem: any, autoAdvance = true) => {
    setResolveError(null);
    setSearchQuery("");
    setSearchResults([]);
    setIsResolving(true);
    try {
      const rawQ =
        typeof destItem === "string"
          ? destItem
          : destItem.canonical_slug || destItem.name || destItem.slug;
      const q = String(rawQ).replace(/^(dyn|dest)-/, "").trim();
      const res = await api.resolveDestination(q);
      if (res) {
        setSelectedDestId(res.id || res.slug);
        setSelectedDestObject(res);
        if (autoAdvance) {
          // Micro-delay for visual acknowledgement
          setTimeout(() => setCurrentStep(2), 150);
        }
      } else {
        setResolveError(`Could not resolve '${q}'. Try another location.`);
      }
    } catch (err: any) {
      setResolveError(err.message || "Failed to resolve destination");
    } finally {
      setIsResolving(false);
    }
  };

  // Handle Dates selection with auto-advance for preset options
  const handleDatePresetSelect = (preset: "this_weekend" | "next_week" | "next_month") => {
    setDateSelectionType(preset);
    const today = new Date();
    const start = new Date();
    if (preset === "this_weekend") {
      const day = today.getDay();
      const daysUntilSat = (6 - day + 7) % 7 || 7;
      start.setDate(today.getDate() + daysUntilSat);
    } else if (preset === "next_week") {
      start.setDate(today.getDate() + 7);
    } else if (preset === "next_month") {
      start.setDate(today.getDate() + 30);
    }
    const end = new Date(start);
    end.setDate(start.getDate() + (daysCount - 1));

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
    setTimeout(() => setCurrentStep(3), 150);
  };

  // Handle Days count selection with AUTO-ADVANCE
  const handleDaysSelect = (days: number) => {
    setDaysCount(days);
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + (days - 1));
    setEndDate(end.toISOString().split("T")[0]);
    setTimeout(() => setCurrentStep(4), 150);
  };

  // Handle Companion selection with AUTO-ADVANCE
  const handleCompanionSelect = (type: string, count: number) => {
    setCompanionType(type);
    setTravellersCount(count);
    setTimeout(() => setCurrentStep(5), 150);
  };

  // Handle Vibe toggle (Multi-select)
  const handleVibeToggle = (vibe: string) => {
    if (selectedVibes.includes(vibe)) {
      if (selectedVibes.length > 1) {
        setSelectedVibes(selectedVibes.filter((v) => v !== vibe));
      }
    } else {
      setSelectedVibes([...selectedVibes, vibe]);
    }
  };

  // Handle Travel Style selection with AUTO-ADVANCE to Review
  const handleStyleSelect = (style: string) => {
    setTravelStyle(style);
    setTimeout(() => setCurrentStep(7), 150);
  };

  // Handle Generate Trip Execution
  const handleBuildTrip = async () => {
    setIsGenerating(true);
    const msgs = [
      "Clustering scenic stops & local trails...",
      "Matching verified stays & mountain dhabas...",
      "Calculating realistic day timing...",
      "Binding your personalized VANVAS journal...",
    ];
    let idx = 0;
    const timer = setInterval(() => {
      idx = (idx + 1) % msgs.length;
      setGenMessage(msgs[idx]);
    }, 700);

    setGenerationError(null);
    try {
      const targetSlug =
        selectedDestObject?.canonical_slug ||
        selectedDestObject?.slug ||
        selectedDestId;
      const cleanTarget = String(targetSlug).replace(/^(dyn|dest)-/, "").trim();
      const targetId =
        selectedDestObject?.id ||
        (selectedDestObject?.is_curated !== false
          ? `dest-${cleanTarget}`
          : `dyn-${cleanTarget}`);

      const trip = await api.createTrip({
        destination_id: targetId,
        start_date: startDate,
        end_date: endDate,
        budget: budgetEstimate,
        travellers_count: travellersCount,
        companion_type: companionType,
        travel_style: travelStyle,
        wake_up_preference: "Normal",
        activity_intensity: "Balanced",
        interests: selectedVibes,
        planning_mode: daysCount === 1 ? "one_day" : daysCount === 2 ? "weekend" : "multi_day",
      });

      clearInterval(timer);
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch {}
      router.push(`/trips/${trip.id}`);
    } catch (err: any) {
      clearInterval(timer);
      setIsGenerating(false);
      setGenerationError(err.message || "Failed to generate trip. Please try again.");
    }
  };

  const currentDestName = selectedDestObject?.name || selectedDestId.charAt(0).toUpperCase() + selectedDestId.slice(1);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#EFE5D2] flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="max-w-xl mx-auto w-full">
        {/* Loading Overlay */}
        {isGenerating && (
          <div className="fixed inset-0 z-50 bg-[#0F2924]/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-[#EFE5D2] animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-[#B65E3C] flex items-center justify-center shadow-2xl mb-4">
              <Sparkles className="w-7 h-7 text-[#FAF4E8] animate-spin" />
            </div>
            <h3 className="font-serif font-black text-2xl text-[#FAF4E8] mb-2">
              Building Your Trip to {currentDestName}
            </h3>
            <p className="text-xs sm:text-sm font-mono text-[#D8DED5] animate-pulse">
              {genMessage}
            </p>
          </div>
        )}

        {/* Card Container */}
        <div className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-3xl p-5 sm:p-8 shadow-xl relative overflow-hidden transition-all duration-300">
          {/* Top Progress & Navigation Header */}
          <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-4 mb-6">
            <div className="flex items-center gap-2">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                  className="p-1.5 rounded-xl hover:bg-[#EFE5D2] text-[#173B32] transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                  aria-label="Previous question"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              )}
              {currentStep === 1 && (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B65E3C]">
                  VANVAS PLANNER
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#173B32]">
                {currentStep <= 6 ? `0${currentStep} / 06` : "REVIEW"}
              </span>
              <div className="w-16 sm:w-24 bg-[#E5D5BA] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#173B32] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${(Math.min(currentStep, 6) / 6) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 01 / 06: WHERE ARE YOU GOING?                            */}
          {/* ======================================================== */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C] tracking-wider block">
                  QUESTION 01
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32] mt-1">
                  Where are you going?
                </h2>
                <p className="text-xs text-[#7B4D36] mt-0.5">
                  Pick a curated destination or search any town in India.
                </p>
              </div>

              {/* Quick Choice Buttons (Single tap -> Auto-advance) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { name: "Manali", slug: "manali" },
                  { name: "Goa", slug: "goa" },
                  { name: "Jaipur", slug: "jaipur" },
                  { name: "Udaipur", slug: "udaipur" },
                  { name: "Rishikesh", slug: "rishikesh" },
                  { name: "Spiti", slug: "spiti" },
                  { name: "Kasol", slug: "kasol" },
                  { name: "Varanasi", slug: "varanasi" },
                ].map((d) => {
                  const isSelected = selectedDestId.toLowerCase().includes(d.slug);
                  return (
                    <button
                      key={d.slug}
                      type="button"
                      onClick={() => handleSelectDestination(d)}
                      className={`p-3 rounded-2xl text-xs font-bold text-center transition-all cursor-pointer border-2 ${
                        isSelected
                          ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-md scale-102"
                          : "bg-white text-[#173B32] border-[#E5D5BA] hover:bg-[#EFE5D2] hover:border-[#173B32]"
                      }`}
                    >
                      {d.name}
                    </button>
                  );
                })}
              </div>

              {/* Search Bar with Autocomplete */}
              <div className="relative pt-2">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && searchQuery.trim()) {
                        e.preventDefault();
                        handleSelectDestination(searchQuery.trim());
                      }
                    }}
                    placeholder="Or search any destination: Munnar, Leh, Ooty..."
                    className="w-full pl-9 pr-9 py-2.5 bg-white border-2 border-[#E5D5BA] rounded-2xl text-xs font-medium text-[#20211D] placeholder:text-[#7B4D36]/60 focus:outline-none focus:border-[#173B32]"
                  />
                  <Search className="w-4 h-4 text-[#7B4D36] absolute left-3 pointer-events-none" />
                  {(isSearching || isResolving) && (
                    <Loader2 className="w-4 h-4 text-[#B65E3C] animate-spin absolute right-3 pointer-events-none" />
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border-2 border-[#E5D5BA] rounded-2xl shadow-xl overflow-hidden divide-y divide-[#E5D5BA] max-h-52 overflow-y-auto">
                    {searchResults.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectDestination(item)}
                        className="w-full text-left p-3 flex items-center justify-between hover:bg-[#EFE5D2] text-[#173B32] text-xs font-bold transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#B65E3C]" />
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
              </div>

              {resolveError && (
                <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                  {resolveError}
                </p>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* 02 / 06: WHEN ARE YOU GOING?                             */}
          {/* ======================================================== */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C] tracking-wider block">
                  QUESTION 02
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32] mt-1">
                  When are you going?
                </h2>
                <p className="text-xs text-[#7B4D36] mt-0.5">
                  Heading to <strong className="text-[#173B32]">{currentDestName}</strong>.
                </p>
              </div>

              {/* Quick Timing Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: "this_weekend", label: "This Weekend", desc: "Upcoming Sat–Sun" },
                  { id: "next_week", label: "Next Week", desc: "In 7 days" },
                  { id: "next_month", label: "Next Month", desc: "In ~30 days" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleDatePresetSelect(opt.id as any)}
                    className="p-4 rounded-2xl bg-white hover:bg-[#EFE5D2] border-2 border-[#E5D5BA] hover:border-[#173B32] text-left transition-all cursor-pointer shadow-xs"
                  >
                    <div className="font-serif font-bold text-sm text-[#173B32]">{opt.label}</div>
                    <div className="text-[10px] text-[#7B4D36] mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>

              {/* Custom Date Input */}
              <div className="pt-2 border-t border-[#E5D5BA]">
                <label className="block text-xs font-mono font-bold uppercase text-[#7B4D36] mb-1.5">
                  Or pick exact start date:
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={startDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      const s = new Date(e.target.value);
                      const end = new Date(s);
                      end.setDate(s.getDate() + (daysCount - 1));
                      setEndDate(end.toISOString().split("T")[0]);
                    }}
                    className="flex-1 p-2.5 bg-white border-2 border-[#E5D5BA] rounded-xl text-xs font-bold text-[#173B32] focus:outline-none focus:border-[#173B32]"
                  />
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-4 py-2.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] font-bold text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 03 / 06: HOW LONG?                                       */}
          {/* ======================================================== */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C] tracking-wider block">
                  QUESTION 03
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32] mt-1">
                  How many days?
                </h2>
                <p className="text-xs text-[#7B4D36] mt-0.5">
                  Select trip duration for {currentDestName}.
                </p>
              </div>

              {/* Days options (Single tap -> Auto-advance) */}
              <div className="grid grid-cols-5 gap-2">
                {[2, 3, 4, 5, 6].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleDaysSelect(d)}
                    className={`py-4 rounded-2xl font-serif font-black text-center transition-all cursor-pointer border-2 ${
                      daysCount === d
                        ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-md scale-102"
                        : "bg-white text-[#173B32] border-[#E5D5BA] hover:bg-[#EFE5D2] hover:border-[#173B32]"
                    }`}
                  >
                    <span className="text-xl block">{d === 6 ? "6+" : d}</span>
                    <span className="text-[10px] font-mono font-normal uppercase text-[#7B4D36]">
                      {d === 1 ? "Day" : "Days"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 04 / 06: WHO'S COMING?                                   */}
          {/* ======================================================== */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C] tracking-wider block">
                  QUESTION 04
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32] mt-1">
                  Who&apos;s coming?
                </h2>
                <p className="text-xs text-[#7B4D36] mt-0.5">
                  This helps tailor stays, pace &amp; split settings.
                </p>
              </div>

              {/* Companions (Single tap -> Auto-advance) */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { type: "Solo", label: "Just me", count: 1, desc: "Solo adventure & flexible pace" },
                  { type: "Couple", label: "Partner", count: 2, desc: "Scenic cafes & slow evenings" },
                  { type: "Friends", label: "Friends", count: 3, desc: "Adventure, dhabas & shared stays" },
                  { type: "Family", label: "Family", count: 4, desc: "Comfort, verified food & gentle timing" },
                ].map((c) => (
                  <button
                    key={c.type}
                    type="button"
                    onClick={() => handleCompanionSelect(c.type, c.count)}
                    className={`p-4 rounded-2xl text-left transition-all cursor-pointer border-2 ${
                      companionType === c.type
                        ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-md scale-102"
                        : "bg-white text-[#173B32] border-[#E5D5BA] hover:bg-[#EFE5D2] hover:border-[#173B32]"
                    }`}
                  >
                    <div className="font-serif font-bold text-base">{c.label}</div>
                    <div className="text-[10px] opacity-80 mt-0.5">{c.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 05 / 06: WHAT'S YOUR VIBE? (Multi-select)                */}
          {/* ======================================================== */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C] tracking-wider block">
                  QUESTION 05
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32] mt-1">
                  What&apos;s your vibe?
                </h2>
                <p className="text-xs text-[#7B4D36] mt-0.5">
                  Select all that you enjoy.
                </p>
              </div>

              {/* Vibe Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { name: "Nature", desc: "Pine woods & streams" },
                  { name: "Food", desc: "Authentic dhabas & local bites" },
                  { name: "Adventure", desc: "Hikes & viewpoints" },
                  { name: "Culture", desc: "Heritage & temples" },
                  { name: "Slow", desc: "Cafés & leisurely mornings" },
                  { name: "Nightlife", desc: "Evening scenes & vibes" },
                ].map((v) => {
                  const isSelected = selectedVibes.includes(v.name);
                  return (
                    <button
                      key={v.name}
                      type="button"
                      onClick={() => handleVibeToggle(v.name)}
                      className={`p-3 rounded-2xl text-left transition-all cursor-pointer border-2 ${
                        isSelected
                          ? "bg-[#B65E3C] text-[#EFE5D2] border-[#B65E3C] shadow-sm"
                          : "bg-white text-[#173B32] border-[#E5D5BA] hover:bg-[#EFE5D2]"
                      }`}
                    >
                      <div className="font-serif font-bold text-xs flex items-center justify-between">
                        <span>{v.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#FAF4E8]" />}
                      </div>
                      <div className="text-[10px] opacity-80 mt-0.5 line-clamp-1">{v.desc}</div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-[#E5D5BA] flex justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentStep(6)}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <span>Continue ({selectedVibes.length} selected)</span>
                  <ArrowRight className="w-4 h-4 text-[#B49252]" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 06 / 06: HOW DO YOU WANT TO TRAVEL?                      */}
          {/* ======================================================== */}
          {currentStep === 6 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C] tracking-wider block">
                  QUESTION 06
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32] mt-1">
                  How do you want to travel?
                </h2>
                <p className="text-xs text-[#7B4D36] mt-0.5">
                  Pick your comfort &amp; budget preference.
                </p>
              </div>

              {/* Travel Style options (Single tap -> Auto-advance to Review) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { style: "Budget", label: "Budget", desc: "Clean hostels, dhabas & shared rides", est: `~₹${(daysCount * travellersCount * 2200).toLocaleString()}` },
                  { style: "Balanced", label: "Balanced", desc: "Boutique stays, local cafes & cabs", est: `~₹${(daysCount * travellersCount * 3800).toLocaleString()}` },
                  { style: "Comfort", label: "Comfort", desc: "Heritage resorts, private cabs & fine dining", est: `~₹${(daysCount * travellersCount * 6500).toLocaleString()}` },
                ].map((s) => (
                  <button
                    key={s.style}
                    type="button"
                    onClick={() => handleStyleSelect(s.style)}
                    className={`p-4 rounded-2xl text-left transition-all cursor-pointer border-2 ${
                      travelStyle === s.style
                        ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-md scale-102"
                        : "bg-white text-[#173B32] border-[#E5D5BA] hover:bg-[#EFE5D2] hover:border-[#173B32]"
                    }`}
                  >
                    <div className="font-serif font-bold text-base">{s.label}</div>
                    <div className="text-[10px] opacity-80 mt-0.5">{s.desc}</div>
                    <div className="text-xs font-mono font-bold text-[#B49252] mt-2">{s.est} est.</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* REVIEW SUMMARY & BUILD TRIP                             */}
          {/* ======================================================== */}
          {currentStep === 7 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C] tracking-wider block">
                  JOURNEY SUMMARY
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32] mt-1">
                  Ready to explore {currentDestName}?
                </h2>
              </div>

              {/* Clean Ticket Card */}
              <div className="p-5 rounded-2xl bg-[#EFE5D2] border-2 border-[#173B32] space-y-3">
                <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-2">
                  <div>
                    <span className="text-[9px] font-mono uppercase text-[#7B4D36] font-bold">DESTINATION</span>
                    <h3 className="font-serif font-black text-2xl text-[#173B32]">{currentDestName}</h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                    {travelStyle} Tier
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[#7B4D36] block text-[10px]">DURATION</span>
                    <strong className="text-[#173B32]">{daysCount} Days</strong>
                  </div>
                  <div>
                    <span className="text-[#7B4D36] block text-[10px]">TRAVELLERS</span>
                    <strong className="text-[#173B32]">{travellersCount} ({companionType})</strong>
                  </div>
                  <div>
                    <span className="text-[#7B4D36] block text-[10px]">EST. BUDGET</span>
                    <strong className="text-[#173B32]">₹{(budgetEstimate / 1000).toFixed(0)}K</strong>
                  </div>
                </div>

                <div className="pt-1 text-[11px] text-[#7B4D36]">
                  <strong>Vibes:</strong> {selectedVibes.join(" • ")}
                </div>
              </div>

              {generationError && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2.5 shadow-sm">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <div className="flex-1">
                    <span>{generationError}</span>
                  </div>
                </div>
              )}

              {/* Build My Trip Button */}
              <button
                type="button"
                onClick={handleBuildTrip}
                disabled={isGenerating}
                className="w-full py-4 rounded-2xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-xl transition-all transform active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#B49252]" />
                <span>Build My Trip →</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="w-full text-center text-xs font-mono text-[#7B4D36] hover:text-[#173B32] underline"
              >
                Edit all preferences
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PlanTripPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#EFE5D2] flex items-center justify-center text-[#173B32]">
          <Loader2 className="w-8 h-8 animate-spin text-[#B65E3C]" />
        </div>
      }
    >
      <PlanWizard />
    </Suspense>
  );
}
