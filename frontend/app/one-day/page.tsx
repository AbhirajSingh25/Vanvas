"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Compass, MapPin, Sparkles, Clock, Car, Bike, Train,
  Bus, Users, Wallet, ArrowRight, RefreshCw, Dice5,
  Fuel, ShieldCheck, Check, Star, Coffee, Utensils,
  Sun, Sunset, Moon, Sunrise, ChevronRight, Navigation,
  AlertCircle, Building2, Store, Heart, ThumbsUp
} from "lucide-react";
import {
  ONE_DAY_HUBS,
  SEEDED_ONE_DAY_PLANS,
  OneDayPlan,
  OneDayHub,
  OneDayVibe,
  OneDayTransport,
  findOneDayPlansByOrigin
} from "@/lib/oneDayContentModel";
import { VanvasImage } from "@/components/ui/VanvasImage";

const VIBES: Array<{ id: OneDayVibe; label: string; hindi: string; emoji: string }> = [
  { id: "Road Trip", label: "Road Trip", hindi: "सफ़र", emoji: "🚗" },
  { id: "Food", label: "Food & Dhabas", hindi: "ढाबा", emoji: "🫓" },
  { id: "Mountains", label: "Mountain Mist", hindi: "पहाड़", emoji: "⛰️" },
  { id: "Water", label: "Rivers & Waterfalls", hindi: "झरने", emoji: "🌊" },
  { id: "History", label: "Forts & Stepwells", hindi: "इतिहास", emoji: "🏰" },
  { id: "Chill", label: "Chill & Cafes", hindi: "सुकून", emoji: "☕" },
  { id: "Adventure", label: "Hikes & Trails", hindi: "रोमांच", emoji: "🥾" },
  { id: "Random", label: "Surprise Us", hindi: "कुछ भी", emoji: "🎲" },
];

const TRANSPORTS: Array<{ id: OneDayTransport; label: string; icon: React.ElementType }> = [
  { id: "Any", label: "Any Mode", icon: Navigation },
  { id: "Car", label: "Car / Self-Drive", icon: Car },
  { id: "Bike", label: "Motorcycle / Scooter", icon: Bike },
  { id: "Train", label: "Local Train", icon: Train },
  { id: "Bus", label: "Express Bus", icon: Bus },
];

function OneDayInner() {
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from") || searchParams.get("origin") || "";

  // Core Generator State
  const [selectedHubId, setSelectedHubId] = useState<string>(() => {
    if (fromParam) {
      const match = ONE_DAY_HUBS.find((h) =>
        h.id === fromParam.toLowerCase() ||
        h.aliases.some((a) => a.includes(fromParam.toLowerCase()) || fromParam.toLowerCase().includes(a))
      );
      if (match) return match.id;
    }
    return "delhi";
  });

  const [customCity, setCustomCity] = useState<string>("");
  const [isCustomCity, setIsCustomCity] = useState<boolean>(false);
  const [selectedVibe, setSelectedVibe] = useState<OneDayVibe>("Road Trip");
  const [selectedTransport, setSelectedTransport] = useState<OneDayTransport>("Car");
  const [groupSize, setGroupSize] = useState<number>(3);
  const [budgetCap, setBudgetCap] = useState<number>(1500);
  const [activeTab, setActiveTab] = useState<"TIMELINE" | "MAP" | "BUDGET" | "RENTALS">("TIMELINE");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  // Group voting compromise state
  const [groupVotes, setGroupVotes] = useState<Record<string, number>>({
    Mountains: 2,
    Food: 3,
    "Road Trip": 3,
    Water: 1,
    Chill: 2
  });

  const activeHub = ONE_DAY_HUBS.find((h) => h.id === selectedHubId) || ONE_DAY_HUBS[0];
  const originQuery = isCustomCity && customCity ? customCity : activeHub.name;

  // Filter or match plans
  const availablePlans = useMemo(() => {
    return findOneDayPlansByOrigin(originQuery, selectedVibe, budgetCap);
  }, [originQuery, selectedVibe, budgetCap]);

  // Set default selected plan
  useEffect(() => {
    if (availablePlans.length > 0 && (!selectedPlanId || !availablePlans.some((p) => p.id === selectedPlanId))) {
      setSelectedPlanId(availablePlans[0].id);
    }
  }, [availablePlans, selectedPlanId]);

  const currentPlan = availablePlans.find((p) => p.id === selectedPlanId) || availablePlans[0] || SEEDED_ONE_DAY_PLANS[0];

  // Randomizer "Surprise Us"
  const handleRandomize = () => {
    const randomVibes: OneDayVibe[] = ["Mountains", "Food", "Road Trip", "Water", "History", "Chill", "Adventure"];
    const randomVibe = randomVibes[Math.floor(Math.random() * randomVibes.length)];
    const randomHub = ONE_DAY_HUBS[Math.floor(Math.random() * ONE_DAY_HUBS.length)];
    const randomBudgets = [800, 1200, 1500, 2000];
    const randomBudget = randomBudgets[Math.floor(Math.random() * randomBudgets.length)];

    setSelectedHubId(randomHub.id);
    setIsCustomCity(false);
    setSelectedVibe(randomVibe);
    setBudgetCap(randomBudget);
  };

  // Group vote handler
  const handleVote = (vibe: string) => {
    setGroupVotes((prev) => ({
      ...prev,
      [vibe]: (prev[vibe] || 0) + 1
    }));
  };

  // Live Budget Breakdown Calculations
  const calculatedFuel = currentPlan.budgetBreakdown.transportFuel;
  const calculatedFood = currentPlan.budgetBreakdown.foodSnacks;
  const calculatedActivities = currentPlan.budgetBreakdown.activityTickets;
  const calculatedTolls = currentPlan.budgetBreakdown.parkingTolls;
  const calculatedMisc = currentPlan.budgetBreakdown.miscEmergency;

  const calculatedPerPerson = calculatedFuel + calculatedFood + calculatedActivities + calculatedTolls + calculatedMisc;
  const calculatedGroupTotal = calculatedPerPerson * groupSize;

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#173B32] pb-28 selection:bg-[#B65E3C] selection:text-white">
      {/* 1. DESI ROAD TRIP HERO */}
      <section className="relative bg-[#173B32] text-[#EFE5D2] px-4 sm:px-6 lg:px-8 py-16 overflow-hidden border-b-4 border-[#B65E3C]">
        {/* Road trip graphic lines */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#B49252 1.5px, transparent 1.5px)`,
            backgroundSize: "24px 24px"
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto space-y-6 text-center">
          {/* Top Pill */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="px-3.5 py-1 rounded-full bg-[#B65E3C] text-[#FAF7F0] text-[11px] font-mono font-bold uppercase tracking-widest shadow-md flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SPONTANEOUS ESCAPE GENERATOR</span>
            </span>
            <span className="px-3.5 py-1 rounded-full bg-[#0F2924] text-[#B49252] text-[11px] font-mono font-bold uppercase border border-[#B49252]/40">
              [ 1 DAY • ZERO HESITATION ]
            </span>
          </div>

          <div className="space-y-1">
            <span className="font-devanagari text-2xl sm:text-3xl text-[#B49252] font-bold block">
              एक दिन। चलो चलें!
            </span>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-black tracking-tight text-[#FAF4E8]">
              ONE DAY. LET&apos;S GO.
            </h1>
          </div>

          <p className="text-sm sm:text-base text-[#D8DED5] max-w-xl mx-auto font-serif italic leading-relaxed">
            &ldquo;We have one Saturday morning, ₹1,200, a car or a bike, and 3 friends. Tell us where you are, pick your vibe, and we will build the exact route.&rdquo;
          </p>

          {/* Surprise Us Randomizer Button */}
          <div className="pt-2">
            <button
              onClick={handleRandomize}
              className="px-6 py-3 rounded-2xl bg-[#B49252] hover:bg-[#C8A462] text-[#0F2924] font-mono font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 mx-auto cursor-pointer active:scale-95 transition-transform"
            >
              <Dice5 className="w-4 h-4" />
              <span>Surprise Us (Randomize Adventure)</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. SPONTANEOUS TRIP CONTROLS (TICKET STUB / ROADSIDE BOARD SYSTEM) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="bg-[#FAF4E8] rounded-3xl border-2 border-[#D8CBB2] p-6 shadow-xl space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Origin Hub Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#7B4D36] font-bold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#B65E3C]" />
                <span>Starting From (Origin)</span>
              </label>
              {!isCustomCity ? (
                <div className="space-y-1">
                  <select
                    value={selectedHubId}
                    onChange={(e) => setSelectedHubId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-xl text-xs font-bold text-[#173B32] focus:outline-none focus:border-[#B65E3C]"
                  >
                    {ONE_DAY_HUBS.map((hub) => (
                      <option key={hub.id} value={hub.id}>
                        {hub.name} ({hub.hindiName})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setIsCustomCity(true)}
                    className="text-[10px] text-[#B65E3C] hover:underline font-mono"
                  >
                    + Enter custom town/city
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    placeholder="Type custom origin (e.g. Pune, Bhopal)..."
                    className="w-full px-3.5 py-2 bg-[#FAF7F0] border-2 border-[#B65E3C] rounded-xl text-xs font-bold text-[#173B32] focus:outline-none"
                  />
                  <button
                    onClick={() => setIsCustomCity(false)}
                    className="text-[10px] text-[#7B4D36] hover:underline font-mono"
                  >
                    ← Pick from Indian Hubs
                  </button>
                </div>
              )}
            </div>

            {/* People / Group Size Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#7B4D36] font-bold flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#B65E3C]" />
                <span>Group Size (Split Cost)</span>
              </label>
              <div className="flex items-center gap-1.5 bg-[#FAF7F0] p-1 border-2 border-[#E5D5BA] rounded-xl">
                {[1, 2, 3, 4, 6].map((num) => (
                  <button
                    key={num}
                    onClick={() => setGroupSize(num)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      groupSize === num
                        ? "bg-[#173B32] text-[#EFE5D2] shadow-xs"
                        : "text-[#7B4D36] hover:bg-[#E5D5BA]"
                    }`}
                  >
                    {num} {num === 1 ? "Solo" : "Ppl"}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget Per Person Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#7B4D36] font-bold">
                <span className="flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5 text-[#B65E3C]" />
                  <span>Max Budget / Person</span>
                </span>
                <span className="text-[#B65E3C]">₹{budgetCap}</span>
              </div>
              <input
                type="range"
                min={500}
                max={3500}
                step={250}
                value={budgetCap}
                onChange={(e) => setBudgetCap(Number(e.target.value))}
                className="w-full accent-[#B65E3C] bg-[#E5D5BA] h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-[#7B4D36]/70">
                <span>₹500 (Student)</span>
                <span>₹1,500</span>
                <span>₹3,500+ (Premium)</span>
              </div>
            </div>

            {/* Transport Preference */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#7B4D36] font-bold flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-[#B65E3C]" />
                <span>Primary Transport</span>
              </label>
              <select
                value={selectedTransport}
                onChange={(e) => setSelectedTransport(e.target.value as OneDayTransport)}
                className="w-full px-3.5 py-2.5 bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-xl text-xs font-bold text-[#173B32] focus:outline-none focus:border-[#B65E3C]"
              >
                {TRANSPORTS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vibe Selection Chips */}
          <div className="space-y-2 pt-2 border-t border-[#E5D5BA]">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#7B4D36] font-bold block">
              Trip Vibe & Energy
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {VIBES.map((v) => {
                const isActive = selectedVibe === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVibe(v.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#B65E3C] text-white shadow-md border border-[#B65E3C]"
                        : "bg-[#FAF7F0] text-[#173B32] border border-[#E5D5BA] hover:bg-[#E5D5BA]"
                    }`}
                  >
                    <span>{v.emoji}</span>
                    <span>{v.label}</span>
                    <span className={`text-[10px] ${isActive ? "text-[#FAF7F0]/90" : "text-[#7B4D36]"}`}>
                      ({v.hindi})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 3. GENERATED PLANS STREAM & SELECTION TRAY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5D5BA] pb-4">
          <div>
            <span className="text-[11px] font-mono uppercase text-[#B65E3C] font-bold tracking-widest">
              GENERATED ROAD TRIP BOARDS
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32]">
              Choose Your 1-Day Itinerary
            </h2>
          </div>
          <span className="text-xs font-mono text-[#7B4D36]">
            Starting from <strong className="text-[#173B32]">{originQuery}</strong>
          </span>
        </div>

        {/* Plan Cards Switcher */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availablePlans.map((plan, idx) => {
            const isSelected = plan.id === selectedPlanId;
            return (
              <div
                key={plan.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedPlanId(plan.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedPlanId(plan.id); }}
                className={`p-5 rounded-3xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-xl scale-[1.01]"
                    : "bg-[#FAF4E8] text-[#173B32] border-[#E5D5BA] hover:border-[#B65E3C]"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase ${
                      isSelected ? "bg-[#B49252] text-[#0F2924]" : "bg-[#E5D5BA] text-[#7B4D36]"
                    }`}>
                      PLAN 0{idx + 1}
                    </span>
                    <span className={`text-[11px] font-mono ${isSelected ? "text-[#D8DED5]" : "text-[#7B4D36]"}`}>
                      {plan.departureTime} – {plan.returnTime}
                    </span>
                  </div>

                  <h3 className="font-serif font-black text-lg leading-snug">
                    {plan.title}
                  </h3>

                  <p className={`text-xs font-serif italic ${isSelected ? "text-[#D8DED5]" : "text-[#7B4D36]"}`}>
                    &ldquo;{plan.tagline}&rdquo;
                  </p>
                </div>

                <div className={`pt-3 border-t text-xs font-mono flex items-center justify-between ${
                  isSelected ? "border-[#254F44]" : "border-[#E5D5BA]"
                }`}>
                  <div>
                    <span className="block text-[9px] uppercase opacity-70">Estimated Cost</span>
                    <span className={`font-bold ${isSelected ? "text-[#B49252]" : "text-[#B65E3C]"}`}>
                      ₹{plan.baseBudgetPerPerson} / person
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase opacity-70">Total Distance</span>
                    <span>{plan.totalDistanceKm} km</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. ACTIVE ROAD TRIP BOARD (TIMELINE / MAP / BUDGET / RENTALS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
        <div className="bg-[#FAF4E8] rounded-3xl border-2 border-[#D8CBB2] p-6 shadow-md space-y-6">
          {/* Header & View Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5D5BA] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#B65E3C] text-white text-[10px] font-mono font-bold uppercase">
                  ACTIVE ROAD TRIP
                </span>
                <span className="text-xs font-mono text-[#7B4D36]">
                  {currentPlan.originCity} → {currentPlan.destinationArea}
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32] mt-1">
                {currentPlan.title}
              </h3>
            </div>

            {/* View Switcher Tabs */}
            <div className="flex items-center gap-1.5 bg-[#FAF7F0] p-1.5 border border-[#E5D5BA] rounded-2xl">
              {(["TIMELINE", "MAP", "BUDGET", "RENTALS"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    activeTab === tab
                      ? "bg-[#173B32] text-[#FAF7F0] shadow-xs"
                      : "text-[#7B4D36] hover:bg-[#E5D5BA]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* VIEW A: TIMELINE ITINERARY */}
          {activeTab === "TIMELINE" && (
            <div className="space-y-6">
              <div className="relative pl-6 sm:pl-8 border-l-2 border-[#B65E3C]/40 space-y-8">
                {currentPlan.stops.map((stop, idx) => {
                  const PeriodIcon =
                    stop.period === "DAWN" ? Sunrise : stop.period === "SUNSET" ? Sunset : stop.period === "NIGHT" ? Moon : Sun;

                  return (
                    <div key={stop.id} className="relative space-y-2">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[33px] sm:-left-[41px] top-1 w-6 h-6 rounded-full bg-[#173B32] text-[#FAF7F0] border-2 border-[#FAF4E8] flex items-center justify-center font-mono text-[10px] font-bold shadow-xs">
                        {idx + 1}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <PeriodIcon className="w-4 h-4 text-[#B65E3C]" />
                          <span className="text-xs font-mono font-bold text-[#B65E3C] uppercase tracking-wider">
                            {stop.timeSlot}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-[#7B4D36]">
                          {stop.locationName} ({stop.distanceFromPrevKm} km from prev)
                        </span>
                      </div>

                      <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#E5D5BA] space-y-2">
                        <h4 className="font-serif font-black text-lg text-[#173B32]">
                          {stop.activityTitle}
                        </h4>
                        <p className="text-xs text-[#7B4D36] font-serif leading-relaxed">
                          {stop.description}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E5D5BA] text-[11px] font-mono text-[#173B32]">
                          <span className="text-[#7B4D36]">
                            Tip: <strong className="font-serif text-[#173B32]">{stop.localTip}</strong>
                          </span>
                          <span className="text-[#B65E3C] font-bold">
                            Approx ₹{stop.approxCostPerPerson} / person
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW B: ROAD-TRIP MAP BOARD */}
          {activeTab === "MAP" && (
            <div className="space-y-6">
              <div className="bg-[#173B32] text-[#EFE5D2] p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#B49252] uppercase">
                    Interactive Road-Trip Route Board
                  </span>
                  <span className="text-xs font-mono text-[#D8DED5]">
                    {currentPlan.totalDistanceKm} km total loop
                  </span>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono py-4">
                  <div className="bg-[#0F2924] p-3 rounded-xl border border-[#2F473A] text-center w-full md:w-auto">
                    <span className="block text-[9px] uppercase text-[#8FA699]">START</span>
                    <span className="text-[#FAF4E8] font-bold">{currentPlan.originCity}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#B49252] hidden md:block" />
                  {currentPlan.stops.slice(1, 4).map((s) => (
                    <React.Fragment key={s.id}>
                      <div className="bg-[#0F2924] p-3 rounded-xl border border-[#2F473A] text-center w-full md:w-auto">
                        <span className="block text-[9px] uppercase text-[#8FA699]">{s.category}</span>
                        <span className="text-[#FAF4E8] font-bold truncate max-w-[140px] block">{s.name}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#B49252] hidden md:block" />
                    </React.Fragment>
                  ))}
                  <div className="bg-[#0F2924] p-3 rounded-xl border border-[#2F473A] text-center w-full md:w-auto">
                    <span className="block text-[9px] uppercase text-[#8FA699]">RETURN</span>
                    <span className="text-[#FAF4E8] font-bold">{currentPlan.originCity}</span>
                  </div>
                </div>
              </div>

              {/* Convenience POI Layers along Highway */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#173B32]">
                  Convenience & Highway POI Layers
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {currentPlan.poiHighlights.map((poi, idx) => (
                    <div key={idx} className="bg-[#FAF7F0] p-3.5 rounded-xl border border-[#E5D5BA] space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-[#E5D5BA] text-[#7B4D36]">
                          {poi.category.replace("_", " ")}
                        </span>
                        <span className="text-[10px] font-mono text-[#7B4D36]">{poi.location}</span>
                      </div>
                      <h5 className="font-bold text-[#173B32]">{poi.name}</h5>
                      <p className="text-[11px] text-[#7B4D36] font-serif">{poi.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW C: LIVE BUDGET CALCULATOR */}
          {activeTab === "BUDGET" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-3 text-xs font-mono">
                  <h4 className="font-bold uppercase tracking-wider text-[#173B32]">
                    Expense Itemization (Group of {groupSize})
                  </h4>

                  <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#E5D5BA] space-y-2.5">
                    <div className="flex items-center justify-between py-1.5 border-b border-[#E5D5BA]">
                      <span>Vehicle Fuel & Highway Tolls (Split by {groupSize})</span>
                      <span className="font-bold text-[#173B32]">₹{calculatedFuel + calculatedTolls} / person</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-[#E5D5BA]">
                      <span>Food, Highway Dhabas & Chai Stalls</span>
                      <span className="font-bold text-[#173B32]">₹{calculatedFood} / person</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-[#E5D5BA]">
                      <span>Activities, Stepwell Entry & Parking</span>
                      <span className="font-bold text-[#173B32]">₹{calculatedActivities} / person</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span>Emergency Buffer (Cold drinks & miscellaneous)</span>
                      <span className="font-bold text-[#173B32]">₹{calculatedMisc} / person</span>
                    </div>
                  </div>

                  {/* Student Hacks */}
                  <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#E5D5BA] space-y-2">
                    <span className="text-[10px] font-mono uppercase text-[#B65E3C] font-bold">
                      Student Money Saving Hacks
                    </span>
                    <ul className="space-y-1">
                      {currentPlan.studentHacks.map((hack, i) => (
                        <li key={i} className="text-xs text-[#7B4D36] font-serif flex items-start gap-2">
                          <span className="text-[#B65E3C]">•</span>
                          <span>{hack}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Total Counter Box */}
                <div className="lg:col-span-4 bg-[#173B32] text-[#FAF7F0] p-6 rounded-3xl text-center flex flex-col justify-between space-y-6">
                  <div className="space-y-2">
                    <span className="text-xs font-mono uppercase tracking-widest text-[#B49252]">
                      Total Group Cost ({groupSize} Friends)
                    </span>
                    <div className="text-4xl sm:text-5xl font-mono font-black text-[#EFE5D2]">
                      ₹{calculatedGroupTotal}
                    </div>
                    <span className="text-xs font-mono text-[#B49252] block">
                      (₹{calculatedPerPerson} / person)
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: currentPlan.title,
                          text: `Let's do this 1-day road trip! ₹${calculatedPerPerson} per person.`,
                          url: window.location.href,
                        }).catch(() => {});
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        alert("Road trip link copied to clipboard!");
                      }
                    }}
                    className="w-full py-3 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Share Plan with Group
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW D: CAR / BIKE RENTALS DISCOVERY */}
          {activeTab === "RENTALS" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#173B32]">
                  Verified Vehicle Rentals around {currentPlan.originCity}
                </h4>
                <span className="text-xs font-mono text-[#7B4D36]">
                  Live Provider Estimates
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentPlan.rentals.map((rental, idx) => (
                  <div key={idx} className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#E5D5BA] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#173B32] text-[#EFE5D2]">
                        {rental.vehicleType}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#B65E3C]">
                        ₹{rental.approxRatePerDay} / day
                      </span>
                    </div>

                    <h5 className="font-serif font-black text-base text-[#173B32]">{rental.providerName}</h5>
                    <p className="text-xs text-[#7B4D36] font-serif">{rental.contactOrBookingTip}</p>

                    <div className="pt-2 border-t border-[#E5D5BA] flex items-center justify-between text-[11px] font-mono text-[#7B4D36]">
                      <span>Location: {rental.location}</span>
                      <span>{rental.helmetIncluded ? "✓ Helmet Included" : "Bring Own Helmet"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. GROUP MODE COMPROMISE VOTING UI */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-[#FAF4E8] rounded-3xl border-2 border-[#D8CBB2] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5D5BA] pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#B65E3C] font-bold">
                FRIEND GROUP COMPROMISE ENGINE
              </span>
              <h3 className="text-xl font-serif font-black text-[#173B32]">
                Group Preference Voting
              </h3>
            </div>
            <span className="text-xs text-[#7B4D36] font-mono">
              Someone wants food, someone wants mountains? Vote to find balance.
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(groupVotes).map(([vibe, count]) => (
              <button
                key={vibe}
                onClick={() => handleVote(vibe)}
                className="bg-[#FAF7F0] p-3 rounded-2xl border border-[#E5D5BA] hover:border-[#B65E3C] text-center space-y-1 transition-all cursor-pointer group active:scale-95"
              >
                <span className="block text-xs font-bold text-[#173B32]">{vibe}</span>
                <div className="flex items-center justify-center gap-1 text-xs font-mono font-bold text-[#B65E3C]">
                  <ThumbsUp className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                  <span>{count} Votes</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function OneDayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F0] flex flex-col items-center justify-center text-[#173B32] gap-3">
          <Sparkles className="w-10 h-10 text-[#B65E3C] animate-pulse" />
          <span className="text-xs font-serif italic text-[#7B4D36]">
            Gathering Spontaneous One-Day Indian Escapes...
          </span>
        </div>
      }
    >
      <OneDayInner />
    </Suspense>
  );
}
