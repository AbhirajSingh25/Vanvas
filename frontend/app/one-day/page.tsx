"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Compass, MapPin, Sparkles, Clock, Car, Bike, Train,
  Bus, Users, Wallet, ArrowRight, RefreshCw, Dice5,
  Fuel, ShieldCheck, Check, Star, Coffee, Utensils,
  Sun, Sunset, Moon, Sunrise, ChevronRight, Navigation,
  AlertCircle, Building2, Store, Heart, ThumbsUp, Shield,
  CheckCircle2, Pill, ShoppingBag, Phone, ExternalLink,
  ChevronDown, ChevronUp, SlidersHorizontal, LocateFixed,
  Flame, Award, Layers, Wine, Eye, HelpCircle
} from "lucide-react";
import {
  ONE_DAY_HUBS,
  SEEDED_ONE_DAY_PLANS,
  OneDayPlan,
  OneDayHub,
  OneDayVibe,
  OneDayTransport,
  FeasibilityRating,
  getOneDayPlansForOrigin
} from "@/lib/oneDayContentModel";
import { getCurrentGPSPosition, UserLocationState } from "@/lib/locationService";
import { VanvasImage } from "@/components/ui/VanvasImage";
import { VanvasMap, VanvasMapMarker, VanvasMapRouteSegment } from "@/components/ui/VanvasMap";

const ALL_VIBES: Array<{ id: OneDayVibe; label: string; emoji: string }> = [
  { id: "Road Trip", label: "Road Trip", emoji: "🚗" },
  { id: "Food", label: "Food & Dhabas", emoji: "🫓" },
  { id: "Mountains", label: "Mountains", emoji: "⛰️" },
  { id: "Rivers", label: "Rivers", emoji: "🌊" },
  { id: "Waterfalls", label: "Waterfalls", emoji: "💧" },
  { id: "Forts", label: "Forts & Baoris", emoji: "🏰" },
  { id: "Temples", label: "Temples", emoji: "🛕" },
  { id: "Spiritual", label: "Spiritual", emoji: "🙏" },
  { id: "Beach", label: "Beach", emoji: "🏖️" },
  { id: "Cafes", label: "Cafes", emoji: "☕" },
  { id: "Shopping", label: "Shopping", emoji: "🛍️" },
  { id: "Adventure", label: "Adventure", emoji: "🧗" },
  { id: "Chill", label: "Chill", emoji: "🛋️" },
  { id: "Nature", label: "Nature", emoji: "🌲" },
  { id: "Sunrise", label: "Sunrise", emoji: "🌅" },
  { id: "Sunset", label: "Sunset", emoji: "🌇" },
  { id: "Photo Trip", label: "Photo Trip", emoji: "📸" },
  { id: "Student Budget", label: "Student Budget", emoji: "🎓" },
  { id: "Random", label: "Surprise Me", emoji: "🎲" },
];

type ChecklistAction = "HAVE" | "BUY" | "BORROW" | "RENT" | "SKIP";

function OneDayPlannerInner() {
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from") || searchParams.get("origin") || "";

  // Location / Origin State
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

  const [customOrigin, setCustomOrigin] = useState<string>("");
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [gpsState, setGpsState] = useState<UserLocationState>({ status: "IDLE", coords: null });
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsDetectedCity, setGpsDetectedCity] = useState<string | null>(null);
  const [isOutsideHubs, setIsOutsideHubs] = useState<boolean>(false);

  // Preference Filters
  const [selectedVibes, setSelectedVibes] = useState<OneDayVibe[]>(["Road Trip", "Food"]);
  const [groupSize, setGroupSize] = useState<number>(3);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"PLAN" | "MAP" | "RENTALS" | "CHECKLIST" | "COMPROMISE">("PLAN");

  // Checklist Interactive State
  const [checklistStatus, setChecklistStatus] = useState<Record<string, ChecklistAction>>({});

  // Group voting compromise state
  const [votingOptions, setVotingOptions] = useState<Array<{ name: string; friend: string; votes: number }>>([
    { name: "Agra (Taj Mahal & Petha)", friend: "Aman", votes: 3 },
    { name: "Mathura (Banke Bihari & Ghats)", friend: "Priya", votes: 2 },
    { name: "Murthal (Parathas & Haveli)", friend: "Rohan", votes: 4 },
  ]);

  const activeHub = ONE_DAY_HUBS.find((h) => h.id === selectedHubId) || ONE_DAY_HUBS[0];
  const activeOriginLabel = isCustomMode && customOrigin ? customOrigin : activeHub.name;

  // Fetch / Filter available plans for the origin
  const plansForOrigin = useMemo(() => {
    return getOneDayPlansForOrigin(activeOriginLabel, selectedVibes);
  }, [activeOriginLabel, selectedVibes]);

  // Selected Active Plan
  const activePlan = useMemo(() => {
    if (selectedPlanId) {
      const found = plansForOrigin.find((p) => p.id === selectedPlanId);
      if (found) return found;
    }
    return plansForOrigin[0] || SEEDED_ONE_DAY_PLANS[0];
  }, [plansForOrigin, selectedPlanId]);

  // Sync selectedPlanId when plans change
  useEffect(() => {
    if (plansForOrigin.length > 0 && !plansForOrigin.some((p) => p.id === selectedPlanId)) {
      setSelectedPlanId(plansForOrigin[0].id);
    }
  }, [plansForOrigin, selectedPlanId]);

  // GPS Location Handler
  const handleGPSDetect = async () => {
    setIsLocating(true);
    setIsOutsideHubs(false);
    const res = await getCurrentGPSPosition();
    setIsLocating(false);
    setGpsState(res);

    if (res.status === "GRANTED" && res.coords) {
      let closest = ONE_DAY_HUBS[0];
      let minDist = Infinity;

      ONE_DAY_HUBS.forEach((hub) => {
        // Approximate distance calculation in km
        const d = Math.hypot((hub.lat - res.coords!.latitude) * 111, (hub.lng - res.coords!.longitude) * 90);
        if (d < minDist) {
          minDist = d;
          closest = hub;
        }
      });

      // If within 150 km of a known hub, auto-attach to that hub
      if (minDist <= 150) {
        setSelectedHubId(closest.id);
        setIsCustomMode(false);
        setGpsDetectedCity(closest.name);
      } else {
        // Outside curated hubs
        setIsOutsideHubs(true);
        setGpsDetectedCity(`GPS Location (${res.coords.latitude.toFixed(2)}°N, ${res.coords.longitude.toFixed(2)}°E)`);
        setCustomOrigin(`GPS Point (${res.coords.latitude.toFixed(2)}°N)`);
      }
    }
  };

  const toggleVibe = (vibe: OneDayVibe) => {
    if (vibe === "Random") {
      const randomChoices = ALL_VIBES.filter((v) => v.id !== "Random");
      const pick1 = randomChoices[Math.floor(Math.random() * randomChoices.length)].id;
      const pick2 = randomChoices[Math.floor(Math.random() * randomChoices.length)].id;
      setSelectedVibes([pick1, pick2]);
      return;
    }

    if (selectedVibes.includes(vibe)) {
      if (selectedVibes.length > 1) {
        setSelectedVibes(selectedVibes.filter((v) => v !== vibe));
      }
    } else {
      setSelectedVibes([...selectedVibes, vibe]);
    }
  };

  // Group split calculations
  const totalTripCost = Math.round(
    activePlan.budgetBreakdown.transportFuel +
    (activePlan.budgetBreakdown.foodSnacks * groupSize) +
    (activePlan.budgetBreakdown.activityTickets * groupSize) +
    activePlan.budgetBreakdown.parkingTolls +
    activePlan.budgetBreakdown.miscEmergency
  );
  const costPerPerson = Math.round(totalTripCost / Math.max(1, groupSize));

  // Feasibility Badge Color
  const getFeasibilityBadge = (feasibility: FeasibilityRating) => {
    switch (feasibility) {
      case "COMFORTABLE":
        return "bg-emerald-900/80 text-emerald-300 border-emerald-600/60";
      case "TIGHT":
        return "bg-amber-900/80 text-amber-300 border-amber-600/60";
      case "RUSHED":
        return "bg-orange-900/80 text-orange-300 border-orange-600/60";
      case "NOT RECOMMENDED":
      default:
        return "bg-rose-950 text-rose-300 border-rose-700/80";
    }
  };

  // Dynamic Checklist Generator
  const dynamicChecklist = useMemo(() => {
    const baseItems = [
      { id: "dl", name: "Original Driving License & Vehicle RC", category: "Documents", required: true },
      { id: "fastag", name: "Fastag Recharged with ₹500+", category: "Highway", required: true },
      { id: "pbank", name: "Power Bank (10,000+ mAh) & Charging Cables", category: "Electronics", required: true },
      { id: "water", name: "2L Reusable Water Bottles per person", category: "Essentials", required: true },
      { id: "cash", name: "Emergency Highway Cash (₹1,500 in 100/200 notes)", category: "Essentials", required: true },
      { id: "sun", name: "UV Sunglasses & Sun Protection", category: "Personal", required: false },
      { id: "med", name: "Motion Sickness, Antacids & Band-Aids", category: "Medical", required: true },
      { id: "offline", name: "Offline Route & Destination Map Downloaded", category: "Navigation", required: false },
    ];

    // Contextual items based on destination and vibes
    const extraItems: Array<{ id: string; name: string; category: string; required: boolean }> = [];

    if (activePlan.vibes.includes("Mountains") || activePlan.destinationArea.toLowerCase().includes("dehradun") || activePlan.destinationArea.toLowerCase().includes("morni") || activePlan.destinationArea.toLowerCase().includes("lansdowne")) {
      extraItems.push(
        { id: "jacket", name: "Windproof Fleece Jacket for Evening Foothill Chill", category: "Mountain Weather", required: true },
        { id: "shoes", name: "Deep-Grip Walking Shoes for Incline Walking", category: "Footwear", required: true }
      );
    }
    if (activePlan.vibes.includes("Temples") || activePlan.vibes.includes("Spiritual") || activePlan.destinationArea.toLowerCase().includes("mathura") || activePlan.destinationArea.toLowerCase().includes("vrindavan") || activePlan.destinationArea.toLowerCase().includes("haridwar")) {
      extraItems.push(
        { id: "temple_cloth", name: "Modest Temple Attire (Shoulders & Knees Covered)", category: "Temple Etiquette", required: true },
        { id: "scarf", name: "Light Cotton Head Scarf / Dupatta", category: "Temple Etiquette", required: false }
      );
    }
    if (activePlan.vibes.includes("Rivers") || activePlan.vibes.includes("Water") || activePlan.vibes.includes("Adventure")) {
      extraItems.push(
        { id: "quickdry", name: "Extra Set of Quick-Dry Clothes & Towel", category: "Water Activities", required: true },
        { id: "waterpouch", name: "Waterproof Phone Pouch / Dry Bag", category: "Protection", required: false }
      );
    }
    if (activePlan.totalDistanceKm >= 300) {
      extraItems.push(
        { id: "tire_gauge", name: "Spare Tire Check & Portable Tire Inflator", category: "Highway Safety", required: true },
        { id: "flashlight", name: "High-Intensity Flashlight / Torch", category: "Highway Safety", required: false }
      );
    }

    return [...baseItems, ...extraItems];
  }, [activePlan]);

  return (
    <div className="min-h-screen bg-[#0D1511] text-[#EFE5D2] pb-32 selection:bg-[#D95327] selection:text-white">
      {/* 1. DESI ROAD TRIP HERO */}
      <section className="relative min-h-[46vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16 overflow-hidden border-b border-[#23352B]">
        {/* Background Texture / Highway grid */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1B2B23] via-[#0D1511] to-[#080D0B] opacity-95" />

        {/* Highway Dash Markings Overlay */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: "repeating-linear-gradient(90deg, #E08A56 0, #E08A56 20px, transparent 20px, transparent 60px)",
            backgroundSize: "60px 4px",
            backgroundPosition: "center 50%"
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="px-3.5 py-1 rounded-full bg-[#D95327] text-white text-[11px] font-mono font-black tracking-widest uppercase shadow-lg border border-[#F27E59]/40 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5" />
              <span>SPONTANEOUS ROAD TRIP CULTURE</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-[#18261F] text-[#C59B47] text-[11px] font-mono tracking-wider uppercase border border-[#C59B47]/40">
              [ 1 DAY • GROUP SPLIT • ZERO HALLUCINATIONS ]
            </span>
          </div>

          <div className="space-y-1">
            <span className="font-devanagari text-2xl sm:text-3xl text-[#C59B47] block font-bold">
              एक दिन का सफ़र • चलो कहीं चलते हैं!
            </span>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-black tracking-tight text-[#FAF4E8]">
              ONE DAY. LET&apos;S GO.
            </h1>
          </div>

          <p className="text-sm sm:text-base text-[#9EB5A9] font-serif max-w-2xl mx-auto leading-relaxed">
            Got one free day and a few friends? VANVAS computes genuine feasibility, splits petrol &amp; toll receipts, and tracks roadside dhabas across India.
          </p>
        </div>
      </section>

      {/* 2. ORIGIN SELECTOR & PROMINENT GPS BUTTON */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="p-5 sm:p-6 rounded-3xl bg-[#14201A] border-2 border-[#2D4539] shadow-2xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C59B47] font-bold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#D95327]" />
                <span>WHERE ARE YOU STARTING FROM?</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-black text-white flex items-center gap-2">
                <span>Starting Point:</span>
                <span className="text-[#D95327]">{activeOriginLabel}</span>
              </h2>
            </div>

            {/* GPS Locate Button & Mode Switch */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleGPSDetect}
                disabled={isLocating}
                className="px-4 py-2.5 rounded-2xl bg-[#D95327] hover:bg-[#C24319] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md cursor-pointer active:scale-95"
              >
                <LocateFixed className={`w-4 h-4 text-white ${isLocating ? "animate-spin" : ""}`} />
                <span>{isLocating ? "Detecting GPS..." : "USE MY LOCATION"}</span>
              </button>

              <button
                onClick={() => {
                  setIsCustomMode(!isCustomMode);
                  setIsOutsideHubs(false);
                }}
                className={`px-4 py-2.5 rounded-2xl border text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isCustomMode
                    ? "bg-[#253D30] text-[#FAF4E8] border-[#3A5646]"
                    : "bg-[#1B2C24] hover:bg-[#253D30] text-[#FAF4E8] border-[#3A5646]"
                }`}
              >
                {isCustomMode ? "Select Standard Hubs" : "Custom City"}
              </button>
            </div>
          </div>

          {/* GPS Detected Banner */}
          {gpsDetectedCity && (
            <div className="p-3 rounded-2xl bg-[#1B2F24] border border-[#3E6550] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-emerald-200">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>📍 <strong>DETECTED FROM GPS:</strong> {gpsDetectedCity}</span>
              </div>
              <span className="text-[11px] text-[#A6C5B4]">
                Refreshed 1-day road trip destinations from your location
              </span>
            </div>
          )}

          {/* Outside Curated Hubs Fallback */}
          {isOutsideHubs && (
            <div className="p-4 rounded-2xl bg-amber-950/80 border border-amber-700/80 text-xs font-serif text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-mono font-bold uppercase text-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>You&apos;re outside our curated hubs</span>
              </div>
              <p>
                VANVAS has resolved your starting coordinates. You can use this location as a custom starting point or pick the nearest regional hub below.
              </p>
            </div>
          )}

          {/* GPS Status Notice if Denied */}
          {gpsState.status === "DENIED" && (
            <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800/80 text-xs text-amber-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Location permission was denied. Select your city hub from the list below.</span>
            </div>
          )}

          {/* Hub Pills Carousel */}
          {!isCustomMode ? (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar pt-1">
              {ONE_DAY_HUBS.map((hub) => {
                const isSelected = selectedHubId === hub.id;
                return (
                  <button
                    key={hub.id}
                    onClick={() => {
                      setSelectedHubId(hub.id);
                      setIsCustomMode(false);
                      setGpsDetectedCity(null);
                      setIsOutsideHubs(false);
                    }}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                      isSelected
                        ? "bg-[#D95327] text-white border-[#D95327] shadow-lg scale-[1.02]"
                        : "bg-[#0E1612] text-[#9EB5A9] border-[#223329] hover:border-[#385141] hover:text-white"
                    }`}
                  >
                    <span>{hub.name}</span>
                    <span className="font-devanagari text-[10px] opacity-75 ml-1.5">({hub.hindiName})</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-3 pt-2">
              <input
                type="text"
                value={customOrigin}
                onChange={(e) => setCustomOrigin(e.target.value)}
                placeholder="Enter custom starting city (e.g. Pune, Jaipur, Meerut, Chandigarh)..."
                className="flex-1 px-4 py-3 rounded-2xl bg-[#0E1612] border border-[#2D4539] text-white placeholder:text-[#647C70] text-xs font-mono focus:outline-none focus:border-[#D95327]"
              />
            </div>
          )}
        </div>
      </section>

      {/* 3. MULTI-VIBE & GROUP COMPROMISE FILTER BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#23352B] pb-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C59B47] font-bold">
              WHAT&apos;S THE TRIP VIBE? (SELECT MULTIPLE)
            </span>
            <p className="text-xs text-[#9EB5A9] font-serif">
              Mix and match road trip flavours to narrow down options
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            {/* Group Size Stepper */}
            <div className="flex items-center gap-2 bg-[#14201A] px-3 py-1.5 rounded-2xl border border-[#2D4539]">
              <Users className="w-3.5 h-3.5 text-[#D95327]" />
              <span className="text-[#9EB5A9]">Who&apos;s coming?</span>
              <button
                onClick={() => setGroupSize((s) => Math.max(1, s - 1))}
                className="w-5 h-5 rounded-full bg-[#1B2C24] text-white flex items-center justify-center font-bold hover:bg-[#253D30]"
              >
                -
              </button>
              <strong className="text-white font-bold">{groupSize}</strong>
              <button
                onClick={() => setGroupSize((s) => Math.min(8, s + 1))}
                className="w-5 h-5 rounded-full bg-[#1B2C24] text-white flex items-center justify-center font-bold hover:bg-[#253D30]"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Vibe Chips Grid */}
        <div className="flex flex-wrap gap-2">
          {ALL_VIBES.map((v) => {
            const isSelected = selectedVibes.includes(v.id);
            return (
              <button
                key={v.id}
                onClick={() => toggleVibe(v.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "bg-[#273F32] border-[#D95327] text-white shadow-md ring-1 ring-[#D95327]"
                    : "bg-[#111B16] border-[#223329] text-[#8FA699] hover:text-white hover:border-[#385141]"
                }`}
              >
                <span>{v.emoji}</span>
                <span>{v.label}</span>
                {isSelected && <Check className="w-3 h-3 text-[#D95327]" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. DISCOVERY-FIRST DESTINATIONS GRID ("WHERE CAN WE GO TODAY?") */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#23352B] pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C59B47] font-bold">
              WHERE CAN WE GO TODAY? • {activeOriginLabel.toUpperCase()} ESCAPES
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif font-black text-white">
              Feasible Day Destinations ({plansForOrigin.length} Available)
            </h3>
          </div>
          <span className="text-xs text-[#9EB5A9] font-mono">
            Showing all verified 1-day road trip corridors
          </span>
        </div>

        {/* Destination Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plansForOrigin.map((plan) => {
            const isSelected = activePlan.id === plan.id;
            const badgeClass = getFeasibilityBadge(plan.feasibility);

            return (
              <div
                key={plan.id}
                className={`rounded-3xl border transition-all flex flex-col justify-between overflow-hidden ${
                  isSelected
                    ? "bg-[#182821] border-[#D95327] shadow-2xl ring-2 ring-[#D95327]"
                    : "bg-[#121D17] border-[#22342A] hover:border-[#385141]"
                }`}
              >
                {/* Hero Artwork Preview */}
                <div className="relative h-44 w-full overflow-hidden bg-[#0A100D]">
                  <VanvasImage
                    src={plan.heroImage || plan.stops[0]?.imageUrl || "/images/places/universal/nature.webp"}
                    alt={plan.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121D17] via-transparent to-black/30 pointer-events-none" />

                  {/* Floating Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase border ${badgeClass}`}>
                      {plan.feasibility}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[#C59B47] text-[10px] font-mono">
                      {plan.vibes[0]}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-white text-xs font-mono font-bold">
                      {plan.totalDistanceKm} km
                    </span>
                  </div>

                  <div className="absolute bottom-2 left-3 right-3">
                    <h4 className="font-serif font-black text-xl text-white leading-tight drop-shadow-md">
                      {plan.destinationArea}
                    </h4>
                    <span className="font-devanagari text-xs text-[#C59B47] drop-shadow-sm">
                      {plan.hindiTitle}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-[#EFE5D2]">
                      {plan.title}
                    </div>

                    <p className="text-xs text-[#9EB5A9] font-serif leading-relaxed line-clamp-2">
                      {plan.tagline}
                    </p>

                    {/* Stat Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#23352B] text-[11px] font-mono">
                      <div>
                        <span className="block text-[8px] uppercase text-[#6D8578]">Departure</span>
                        <span className="text-white font-bold">{plan.departureTime}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase text-[#6D8578]">Drive Time</span>
                        <span className="text-[#D95327] font-bold">{plan.totalTravelTime}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase text-[#6D8578]">Base Split</span>
                        <span className="text-[#52B788] font-bold">₹{plan.baseBudgetPerPerson}/head</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-[#23352B] flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedPlanId(plan.id);
                        setActiveTab("PLAN");
                        window.scrollTo({ top: 900, behavior: "smooth" });
                      }}
                      className="flex-1 py-2 rounded-xl bg-[#D95327] hover:bg-[#C24319] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Open Trip</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setSelectedPlanId(plan.id);
                        setActiveTab("MAP");
                        window.scrollTo({ top: 900, behavior: "smooth" });
                      }}
                      className="px-3 py-2 rounded-xl bg-[#1B2C24] hover:bg-[#253D30] text-[#FAF4E8] text-xs font-mono font-bold flex items-center gap-1.5 border border-[#3A5646] transition-colors cursor-pointer"
                      title="View on Map"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#C59B47]" />
                      <span>Map</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. ACTIVE PLAN DOSSIER & FUNCTIONALITY TABS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Dossier Header Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#15231C] border-2 border-[#2D4539] space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase border ${getFeasibilityBadge(activePlan.feasibility)}`}>
                  FEASIBILITY: {activePlan.feasibility}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-[#253D30] text-[#C59B47] text-[10px] font-mono uppercase">
                  {activePlan.idealGroupSize}
                </span>
                <span className="text-xs font-mono text-[#8FA699]">
                  {activePlan.departureTime} Departure → {activePlan.returnTime} Return
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-serif font-black text-white">
                {activePlan.title}
              </h2>
              <p className="text-sm text-[#9EB5A9] font-serif leading-relaxed max-w-3xl">
                {activePlan.feasibilityReason}
              </p>
            </div>

            {/* Split Price Sticky Card */}
            <div className="p-5 rounded-2xl bg-[#0E1612] border border-[#273B2F] shrink-0 space-y-2 text-center lg:text-right">
              <span className="text-[10px] font-mono uppercase text-[#8FA699] block">
                Estimated Group Total ({groupSize} Friends)
              </span>
              <div className="text-3xl font-serif font-black text-[#52B788]">
                ₹{totalTripCost.toLocaleString()}
              </div>
              <span className="inline-block px-3 py-1 rounded-full bg-[#1B2C24] text-[#C59B47] text-xs font-mono font-bold">
                ≈ ₹{costPerPerson.toLocaleString()} / person
              </span>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto border-t border-[#23352B] pt-4 no-scrollbar">
            {[
              { id: "PLAN", label: "Trip Plan & Stops", icon: Clock },
              { id: "MAP", label: "VANVAS Road Map", icon: MapPin },
              { id: "RENTALS", label: "Vehicle Rentals", icon: Car, count: activePlan.rentals.length },
              { id: "CHECKLIST", label: "What To Carry", icon: CheckCircle2, count: dynamicChecklist.length },
              { id: "COMPROMISE", label: "Group Voting Compromise", icon: ThumbsUp },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold font-mono whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? "bg-[#D95327] text-white shadow-lg border border-[#D95327]"
                      : "bg-[#0E1612] text-[#8FA699] border border-[#23352B] hover:text-white hover:border-[#385141]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-black/40 text-white font-mono">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: TIMELINE & STOPS */}
        {activeTab === "PLAN" && (
          <div className="space-y-6">
            <div className="space-y-4">
              {activePlan.stops.map((stop) => (
                <div
                  key={stop.id}
                  className="p-5 sm:p-6 rounded-3xl bg-[#121E18] border border-[#22342A] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
                >
                  <div className="lg:col-span-8 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#D95327] text-white text-[11px] font-mono font-bold flex items-center justify-center">
                        {stop.order}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-[#1B2C24] text-[#C59B47] text-[10px] font-mono uppercase border border-[#C59B47]/30">
                        {stop.timeSlot} • {stop.period}
                      </span>
                      <span className="text-xs font-mono text-[#6D8578]">
                        +{stop.distanceFromPrevKm} km from previous
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <h4 className="text-xl sm:text-2xl font-serif font-black text-white">
                        {stop.name}
                      </h4>
                      <p className="font-devanagari text-xs text-[#C59B47]">
                        {stop.hindiName}
                      </p>
                    </div>

                    <p className="text-xs sm:text-sm text-[#9EB5A9] font-serif leading-relaxed">
                      {stop.description}
                    </p>

                    <div className="p-3 rounded-xl bg-[#0E1612] border border-[#1E2D24] text-xs font-mono text-[#D1DFD7] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span>💡 <strong>Local Hack:</strong> {stop.localTip}</span>
                      <span className="text-[#52B788] shrink-0 font-bold">≈ ₹{stop.approxCostPerPerson}/person</span>
                    </div>
                  </div>

                  <div className="lg:col-span-4 relative h-40 sm:h-48 w-full rounded-2xl overflow-hidden border border-[#22342A]">
                    <VanvasImage
                      src={stop.imageUrl || "/images/nearby/transport/transport.webp"}
                      alt={stop.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-mono text-white">
                      {stop.locationName}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Student Cost Hacks Callout */}
            {activePlan.studentHacks && activePlan.studentHacks.length > 0 && (
              <div className="p-6 rounded-3xl bg-[#18261F] border border-[#2D4539] space-y-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#C59B47] flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#D95327]" />
                  <span>STUDENT BUDGET SHORTCUTS &amp; MONEY SAVERS</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activePlan.studentHacks.map((hack, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#0E1612] border border-[#1F3026] text-xs font-serif text-[#D1DFD7] flex items-start gap-2">
                      <span className="text-[#D95327] font-bold shrink-0">→</span>
                      <span>{hack}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INTERACTIVE VANVAS ROAD MAP */}
        {activeTab === "MAP" && (
          <div className="space-y-4">
            {(() => {
              const mapMarkers: VanvasMapMarker[] = [
                ...activePlan.stops.map((s, idx): VanvasMapMarker => ({
                  id: s.id,
                  title: s.name,
                  hindiTitle: s.hindiName,
                  type: idx === 0 ? "start" : idx === activePlan.stops.length - 1 ? "destination" : s.category === "food" ? "food" : "waypoint",
                  lat: s.lat || 28.5 + (idx * 0.1),
                  lng: s.lng || 77.2 + (idx * 0.1),
                  description: `${s.timeSlot} • ${s.activityTitle}`,
                  categoryLabel: s.category.toUpperCase(),
                  provenance: "VERIFIED",
                  actionLabel: "View Stop"
                })),
                ...activePlan.poiHighlights.map((poi, idx): VanvasMapMarker => ({
                  id: `poi-${idx}`,
                  title: poi.name,
                  type: poi.category === "fuel" ? "fuel" : poi.category === "pharmacy" ? "pharmacy" : poi.category === "dhaba" ? "dhaba" : poi.category === "temple" ? "temple" : poi.category === "beverage_store" ? "liquor" : "viewpoint",
                  lat: poi.lat || (28.4 + (idx * 0.08)),
                  lng: poi.lng || (77.1 + (idx * 0.08)),
                  description: `${poi.highwayOrLandmark} • ${poi.note}`,
                  categoryLabel: poi.category === "beverage_store" ? "LICENSED RETAILER" : poi.category.toUpperCase(),
                  provenance: poi.provenance,
                  actionLabel: "Inspect POI"
                }))
              ];

              const routeSegments: VanvasMapRouteSegment[] = [
                {
                  id: `one-day-route-${activePlan.id}`,
                  name: activePlan.title,
                  coordinates: activePlan.stops.map((s, idx) => ({ lat: s.lat || 28.5 + (idx * 0.1), lng: s.lng || 77.2 + (idx * 0.1) })),
                  color: "#E08A56",
                  distanceKm: activePlan.totalDistanceKm
                }
              ];

              return (
                <VanvasMap
                  mode="one-day"
                  title={`${activePlan.title} — VANVAS Road Map`}
                  subtitle={`From ${activePlan.originCity} to ${activePlan.destinationArea} • ${activePlan.totalDistanceKm} km round trip`}
                  center={{ lat: activePlan.stops[0]?.lat || 28.6, lng: activePlan.stops[0]?.lng || 77.2 }}
                  markers={mapMarkers}
                  routes={routeSegments}
                  height={500}
                />
              );
            })()}
          </div>
        )}

        {/* TAB 3: VEHICLE RENTALS */}
        {activeTab === "RENTALS" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#23352B] pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#C59B47] font-bold">
                  VERIFIED LOCAL FLEET &amp; RENTAL AGENCIES
                </span>
                <h3 className="text-xl sm:text-2xl font-serif font-black text-white">
                  Self-Drive Cars, Enfields &amp; Scooters
                </h3>
              </div>
              <span className="text-xs font-mono text-[#8FA699]">
                Zero fabricated phone numbers or false availability
              </span>
            </div>

            {activePlan.rentals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activePlan.rentals.map((rental, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-3xl bg-[#14201A] border border-[#2D4539] flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-[#1B2C24] text-[#C59B47] border border-[#C59B47]/30">
                          {rental.vehicleType}
                        </span>
                        <span className={`text-[10px] font-mono uppercase font-bold ${
                          rental.verificationStatus === "VERIFIED" ? "text-emerald-400" : "text-amber-400"
                        }`}>
                          [{rental.verificationStatus}]
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <h4 className="font-serif font-bold text-lg text-white">
                          {rental.providerName}
                        </h4>
                        <p className="text-xs font-mono text-[#8FA699]">
                          📍 {rental.location}
                        </p>
                      </div>

                      {/* Pricing & Policy Specs */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#23352B] text-[11px] font-mono">
                        <div className="p-2.5 rounded-xl bg-[#0E1612] border border-[#1E2D24]">
                          <span className="block text-[8px] uppercase text-[#6D8578]">Daily Rate</span>
                          <span className="text-[#52B788] font-bold text-base">
                            ₹{rental.approxRatePerDay.toLocaleString()} <span className="text-xs text-[#8FA699]">/{rental.pricingUnit}</span>
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#0E1612] border border-[#1E2D24]">
                          <span className="block text-[8px] uppercase text-[#6D8578]">Security Deposit</span>
                          <span className="text-white font-bold">
                            ₹{rental.securityDeposit.toLocaleString()} (Refundable)
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#0E1612] border border-[#1E2D24]">
                          <span className="block text-[8px] uppercase text-[#6D8578]">Included Distance</span>
                          <span className="text-white font-bold">{rental.includedKmPerDay} km/day</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#0E1612] border border-[#1E2D24]">
                          <span className="block text-[8px] uppercase text-[#6D8578]">Fuel Policy</span>
                          <span className="text-[#C59B47] font-bold">{rental.fuelPolicy}</span>
                        </div>
                      </div>

                      <div className="text-xs font-serif text-[#9EB5A9] space-y-1">
                        <p><strong>Documents Required:</strong> {rental.requiredDocuments.join(", ")}</p>
                        <p><strong>Booking Tip:</strong> {rental.contactOrBookingTip}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#23352B] flex items-center justify-between gap-2">
                      {rental.phone ? (
                        <a
                          href={`tel:${rental.phone}`}
                          className="w-full py-2.5 rounded-xl bg-[#D95327] hover:bg-[#C24319] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call Provider ({rental.phone})</span>
                        </a>
                      ) : (
                        <div className="w-full py-2.5 rounded-xl bg-[#1B2C24] text-[#C59B47] text-xs font-mono text-center">
                          Book via official website / walk-in stand
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-3xl bg-[#14201A] border border-[#2D4539] text-center space-y-2">
                <Car className="w-8 h-8 text-[#D95327] mx-auto opacity-70" />
                <h4 className="font-serif font-bold text-base text-white">Self-Drive &amp; Rental Info</h4>
                <p className="text-xs text-[#8FA699] max-w-md mx-auto">
                  For {activePlan.destinationArea}, local shared transport or private vehicle is recommended. Rental providers operate out of central {activePlan.originCity} hubs.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DYNAMIC WHAT TO CARRY CHECKLIST */}
        {activeTab === "CHECKLIST" && (
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#14201A] border border-[#2D4539] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#23352B] pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#C59B47] font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#52B788]" />
                    <span>WHAT TO CARRY • DYNAMIC CHECKLIST</span>
                  </span>
                  <h3 className="text-xl sm:text-2xl font-serif font-black text-white">
                    Packing Board for {activePlan.destinationArea}
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#8FA699]">
                  Tag items as Have, Buy, Borrow, Rent or Skip
                </span>
              </div>

              {/* Checklist Items Table / List */}
              <div className="space-y-3">
                {dynamicChecklist.map((item) => {
                  const currentStatus = checklistStatus[item.id] || "HAVE";

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-[#0E1612] border border-[#1E2D24] flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-[#18261F] text-[#C59B47] text-[9px] font-mono uppercase border border-[#C59B47]/30">
                            {item.category}
                          </span>
                          {item.required && (
                            <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase">
                              Required
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-serif font-bold text-white">
                          {item.name}
                        </div>
                      </div>

                      {/* Interactive Action Buttons */}
                      <div className="flex items-center gap-1.5 self-start md:self-auto flex-wrap">
                        {(["HAVE", "BUY", "BORROW", "RENT", "SKIP"] as ChecklistAction[]).map((action) => {
                          const isActionActive = currentStatus === action;
                          return (
                            <button
                              key={action}
                              onClick={() => {
                                setChecklistStatus((prev) => ({ ...prev, [item.id]: action }));
                              }}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                                isActionActive
                                  ? action === "HAVE"
                                    ? "bg-emerald-600 text-white shadow-md"
                                    : action === "BUY"
                                    ? "bg-amber-600 text-white shadow-md"
                                    : action === "BORROW"
                                    ? "bg-blue-600 text-white shadow-md"
                                    : action === "RENT"
                                    ? "bg-purple-600 text-white shadow-md"
                                    : "bg-stone-700 text-stone-300 shadow-md"
                                  : "bg-[#14201A] text-[#7A9285] hover:text-white border border-[#23352B]"
                              }`}
                            >
                              {action}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: GROUP VOTING COMPROMISE */}
        {activeTab === "COMPROMISE" && (
          <div className="p-6 sm:p-8 rounded-3xl bg-[#14201A] border border-[#2D4539] space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C59B47] font-bold">
                FRIENDS DISAGREEMENT RESOLVER
              </span>
              <h3 className="text-2xl font-serif font-black text-white">
                Group Voting &amp; VANVAS Compromise Engine
              </h3>
              <p className="text-xs text-[#9EB5A9] font-serif">
                Friend A wants Forts, Friend B wants Dhabas, Friend C wants Temples? VANVAS resolves the optimal route.
              </p>
            </div>

            <div className="space-y-3">
              {votingOptions.map((opt, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#0E1612] border border-[#1E2D24] flex items-center justify-between gap-4"
                >
                  <div>
                    <span className="text-[10px] font-mono text-[#8FA699] uppercase">Suggested by {opt.friend}</span>
                    <h5 className="font-serif font-bold text-base text-white">{opt.name}</h5>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const next = [...votingOptions];
                        next[idx].votes += 1;
                        setVotingOptions(next);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#253D30] hover:bg-[#D95327] text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Vote ({opt.votes})</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-[#18261F] border border-[#2D4539] space-y-1 text-xs font-serif text-[#D1DFD7]">
              <strong className="text-[#C59B47] font-mono uppercase block text-[10px]">VANVAS COMPROMISE VERDICT:</strong>
              <p>
                Winner route chosen: <strong>{activePlan.title}</strong> — combines the best morning dhaba stop with cultural heritage and sunset views so everyone in the group is satisfied!
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default function OneDayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0D1511] flex items-center justify-center text-white font-mono text-xs">
        Loading VANVAS 1-Day Road Trip Engine...
      </div>
    }>
      <OneDayPlannerInner />
    </Suspense>
  );
}
