"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Compass, MapPin, Sparkles, Clock, Car, Bike, Train,
  Users, Wallet, ArrowRight, RefreshCw, Fuel, ShieldCheck,
  Check, Star, Coffee, Utensils, Sun, Sunset, Moon, Sunrise,
  ChevronRight, Navigation, AlertCircle, Phone, ExternalLink,
  LocateFixed, Flame, Layers, CheckSquare, X, ArrowUpRight,
  Info, SlidersHorizontal, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  ONE_DAY_HUBS,
  SEEDED_ONE_DAY_PLANS,
  OneDayPlan,
  OneDayStop,
  OneDayHub,
  OneDayVibe,
  FeasibilityRating,
  getOneDayPlansForOrigin
} from "@/lib/oneDayContentModel";
import { getCurrentGPSPosition, UserLocationState } from "@/lib/locationService";
import { VanvasImage } from "@/components/ui/VanvasImage";
import { VanvasMap, VanvasMapMarker, VanvasMapRouteSegment } from "@/components/ui/VanvasMap";
import { TravelStamp } from "@/components/ui/TravelStamp";
import { VanvasTabBar, TabItem } from "@/components/ui/VanvasTabBar";
import { VanvasAdaptiveModal } from "@/components/ui/VanvasAdaptiveModal";
import { useDensity } from "@/context/DensityContext";
import { routeScreenVariants, tabIndicatorTransition } from "@/lib/motion";

const DAY_ESCAPE_STYLES: Array<{
  id: string;
  name: string;
  hindiName: string;
  vibes: OneDayVibe[];
  icon: string;
}> = [
  {
    id: "ALL",
    name: "All Day Escapes",
    hindiName: "सभी सफ़र",
    vibes: [],
    icon: "🗺️",
  },
  {
    id: "QUICK_ESCAPE",
    name: "Quick Escape",
    hindiName: "आरामदेह",
    vibes: ["Road Trip", "Chill", "Nature"],
    icon: "🚗",
  },
  {
    id: "FOOD_TRAIL",
    name: "Food Trail",
    hindiName: "खान-पान",
    vibes: ["Food", "Cafes", "Road Trip"],
    icon: "🫓",
  },
  {
    id: "NATURE_DAY",
    name: "Nature & Views",
    hindiName: "प्रकृति",
    vibes: ["Nature", "Mountains", "Waterfalls", "Rivers", "Sunset"],
    icon: "🌲",
  },
  {
    id: "CULTURE_DAY",
    name: "Culture & Forts",
    hindiName: "विरासत",
    vibes: ["Forts", "History", "Temples", "Spiritual", "Shopping"],
    icon: "🏰",
  },
  {
    id: "ADVENTURE_DAY",
    name: "Adventure",
    hindiName: "रोमांच",
    vibes: ["Adventure", "Mountains", "Rivers"],
    icon: "🧗",
  },
  {
    id: "ROMANTIC_LEISURE",
    name: "Leisure & Cafes",
    hindiName: "शांत भ्रमण",
    vibes: ["Chill", "Sunset", "Cafes", "Nature"],
    icon: "☕",
  },
];

type DayDurationOption = "3h" | "6h" | "full_day";

type OneDayTabType = "itinerary" | "route" | "budget" | "checklist" | "rentals";

function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 390; // default 6:30 AM
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function formatMinutesToTime(totalMins: number): string {
  let normalized = Math.round(totalMins) % 1440;
  if (normalized < 0) normalized += 1440;
  let hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const period = hours >= 12 ? "PM" : "AM";
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  const minsPadded = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}:${minsPadded} ${period}`;
}

export default function OneDayEscapePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF4E8]" />}>
      <OneDayEscapeContent />
    </Suspense>
  );
}

function OneDayEscapeContent() {
  const { isCompact } = useDensity();
  const searchParams = useSearchParams();
  const router = useRouter();

  const fromParam = searchParams.get("from") || searchParams.get("origin") || "";
  const destParam = searchParams.get("dest") || searchParams.get("destination") || "";
  const vibeParam = searchParams.get("vibe") || searchParams.get("style") || "";

  // 1. Where am I going / starting?
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

  // 2. How much time do I have?
  const [selectedDuration, setSelectedDuration] = useState<DayDurationOption>("full_day");

  // 3. What kind of experience do I want?
  const [selectedStyleId, setSelectedStyleId] = useState<string>(() => {
    if (vibeParam) {
      const match = DAY_ESCAPE_STYLES.find((s) => s.id.toLowerCase() === vibeParam.toLowerCase());
      if (match) return match.id;
    }
    return "ALL";
  });

  // Active Plan & Tab State
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<OneDayTabType>("itinerary");
  const [groupSize, setGroupSize] = useState<number>(3);

  // Dynamic Departure / Return Controls
  const [departureTime, setDepartureTime] = useState<string>("06:30 AM");
  const [returnDeadline, setReturnDeadline] = useState<string>("09:30 PM");

  // Secondary Detail Modals
  const [selectedStopForModal, setSelectedStopForModal] = useState<OneDayStop | null>(null);
  const [isTimingModalOpen, setIsTimingModalOpen] = useState(false);
  const [isPlanningLoading, setIsPlanningLoading] = useState(false);
  const [planSuccessNotice, setPlanSuccessNotice] = useState<string | null>(null);

  // Checklist interactive states
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const activeHub = ONE_DAY_HUBS.find((h) => h.id === selectedHubId) || ONE_DAY_HUBS[0];
  const activeOriginLabel = isCustomMode && customOrigin ? customOrigin : activeHub.name;
  const activeStyle = DAY_ESCAPE_STYLES.find((s) => s.id === selectedStyleId) || DAY_ESCAPE_STYLES[0];

  // Plans available for this origin and style
  const plansForOrigin = useMemo(() => {
    const basePlans = getOneDayPlansForOrigin(activeOriginLabel, activeStyle.vibes);
    let filtered = basePlans;

    if (selectedStyleId !== "ALL") {
      filtered = filtered.filter((p) => {
        if (p.tripStyle && p.tripStyle.toLowerCase().replace(/[^a-z]/g, "") === selectedStyleId.toLowerCase().replace(/[^a-z]/g, "")) {
          return true;
        }
        return activeStyle.vibes.some((v) => p.vibes.includes(v));
      });
    }

    // Apply duration filter
    if (selectedDuration === "3h") {
      const shortPlans = filtered.filter((p) => p.totalDistanceKm <= 140 || p.stops.length <= 4);
      if (shortPlans.length > 0) return shortPlans;
    } else if (selectedDuration === "6h") {
      const halfDayPlans = filtered.filter((p) => p.totalDistanceKm <= 260);
      if (halfDayPlans.length > 0) return halfDayPlans;
    }

    return filtered.length > 0 ? filtered : basePlans;
  }, [activeOriginLabel, selectedStyleId, activeStyle, selectedDuration]);

  // Active Plan Resolution
  const activePlan = useMemo(() => {
    if (destParam) {
      const matchDest = plansForOrigin.find((p) =>
        p.destinationArea.toLowerCase().includes(destParam.toLowerCase()) ||
        p.title.toLowerCase().includes(destParam.toLowerCase())
      );
      if (matchDest) return matchDest;
    }
    if (selectedPlanId) {
      const found = plansForOrigin.find((p) => p.id === selectedPlanId);
      if (found) return found;
    }
    return plansForOrigin[0] || SEEDED_ONE_DAY_PLANS[0];
  }, [plansForOrigin, selectedPlanId, destParam]);

  // Sync selectedPlanId when plans change
  useEffect(() => {
    if (plansForOrigin.length > 0 && !plansForOrigin.some((p) => p.id === selectedPlanId)) {
      setSelectedPlanId(plansForOrigin[0].id);
    }
  }, [plansForOrigin, selectedPlanId]);

  // Sync departure / return times
  useEffect(() => {
    if (activePlan) {
      setDepartureTime(activePlan.departureTime || "06:30 AM");
      setReturnDeadline(activePlan.returnTime || "09:30 PM");
    }
  }, [activePlan?.id]);

  // Timeline recalculation
  const adaptedStops = useMemo(() => {
    const startMins = parseTimeToMinutes(departureTime);
    let currentMins = startMins;

    return activePlan.stops.map((stop, idx) => {
      const travelMins = idx === 0 ? Math.max(30, Math.round(stop.distanceFromPrevKm * 1.3)) : Math.max(15, Math.round(stop.distanceFromPrevKm * 1.2));
      const arrivalMins = currentMins + travelMins;

      let durationMins = 60;
      if (stop.estimatedDuration.includes("Hours") || stop.estimatedDuration.includes("Hour")) {
        const h = parseFloat(stop.estimatedDuration) || 1.5;
        durationMins = Math.round(h * 60);
      } else if (stop.estimatedDuration.includes("Mins")) {
        durationMins = parseInt(stop.estimatedDuration, 10) || 45;
      }

      const departureMins = arrivalMins + durationMins;
      currentMins = departureMins;

      const timeSlotStr = `${formatMinutesToTime(arrivalMins)} – ${formatMinutesToTime(departureMins)}`;
      let period: OneDayStop["period"] = "MORNING";
      if (arrivalMins < 420) period = "DAWN";
      else if (arrivalMins < 720) period = "MORNING";
      else if (arrivalMins < 870) period = "MIDDAY";
      else if (arrivalMins < 1050) period = "AFTERNOON";
      else if (arrivalMins < 1200) period = "SUNSET";
      else period = "NIGHT";

      return {
        ...stop,
        timeSlot: timeSlotStr,
        period,
        calculatedArrival: formatMinutesToTime(arrivalMins),
        calculatedDeparture: formatMinutesToTime(departureMins),
      };
    });
  }, [activePlan, departureTime]);

  // Return home time & feasibility
  const calculatedReturnHomeMins = useMemo(() => {
    if (adaptedStops.length === 0) return parseTimeToMinutes(departureTime) + 480;
    const lastStop = adaptedStops[adaptedStops.length - 1];
    const lastStopDepartMins = parseTimeToMinutes(lastStop.calculatedDeparture);
    const returnDriveMins = Math.max(45, Math.round((activePlan.totalDistanceKm * 0.45) * 1.2));
    return lastStopDepartMins + returnDriveMins;
  }, [adaptedStops, activePlan.totalDistanceKm, departureTime]);

  const calculatedReturnHomeTime = useMemo(() => {
    return formatMinutesToTime(calculatedReturnHomeMins);
  }, [calculatedReturnHomeMins]);

  const calculatedFeasibility = useMemo<{ rating: FeasibilityRating; reason: string }>(() => {
    const deadlineMins = parseTimeToMinutes(returnDeadline);
    const diff = deadlineMins - calculatedReturnHomeMins;
    if (diff >= 60) {
      return {
        rating: "COMFORTABLE",
        reason: `Estimated return at ${calculatedReturnHomeTime} leaves a relaxed ${Math.round(diff)} min buffer.`,
      };
    } else if (diff >= 0) {
      return {
        rating: "TIGHT",
        reason: `Estimated return at ${calculatedReturnHomeTime} is within ${Math.round(diff)} mins of deadline.`,
      };
    } else {
      return {
        rating: "RUSHED",
        reason: `Estimated return at ${calculatedReturnHomeTime} exceeds deadline by ${Math.abs(Math.round(diff))} mins.`,
      };
    }
  }, [calculatedReturnHomeMins, returnDeadline, calculatedReturnHomeTime]);

  // Budget calculations
  const totalTripCost = useMemo(() => {
    const { transportFuel, foodSnacks, activityTickets, parkingTolls, miscEmergency } = activePlan.budgetBreakdown;
    const totalVehicleCosts = transportFuel + parkingTolls;
    const totalIndividualCosts = (foodSnacks + activityTickets + miscEmergency) * groupSize;
    return Math.round(totalVehicleCosts + totalIndividualCosts);
  }, [activePlan, groupSize]);

  const costPerPerson = useMemo(() => {
    return Math.round(totalTripCost / Math.max(1, groupSize));
  }, [totalTripCost, groupSize]);

  // GPS Locate
  const handleGPSDetect = async () => {
    setIsLocating(true);
    const res = await getCurrentGPSPosition();
    setIsLocating(false);
    setGpsState(res);

    if (res.status === "GRANTED" && res.coords) {
      let closest = ONE_DAY_HUBS[0];
      let minDist = Infinity;
      ONE_DAY_HUBS.forEach((hub) => {
        const d = Math.hypot((hub.lat - res.coords!.latitude) * 111, (hub.lng - res.coords!.longitude) * 90);
        if (d < minDist) {
          minDist = d;
          closest = hub;
        }
      });
      if (minDist <= 150) {
        setSelectedHubId(closest.id);
        setIsCustomMode(false);
        setGpsDetectedCity(closest.name);
      }
    }
  };

  // Google Maps navigation link
  const handleGetDirections = () => {
    const destinationCoord = activePlan.stops[activePlan.stops.length - 1] || activePlan.stops[0];
    const originQuery = activeOriginLabel;
    const destQuery = destinationCoord.lat && destinationCoord.lng
      ? `${destinationCoord.lat},${destinationCoord.lng}`
      : encodeURIComponent(`${activePlan.destinationArea}, India`);
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originQuery)}&destination=${destQuery}&travelmode=driving`;
    window.open(mapsUrl, "_blank", "noopener,noreferrer");
  };

  // Handoff to full planner
  const handlePlanThisTrip = () => {
    setIsPlanningLoading(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("vanvas_prefill_destination", activePlan.destinationArea);
      localStorage.setItem("vanvas_prefill_origin", activeOriginLabel);
      localStorage.setItem("vanvas_prefill_oneday", JSON.stringify(activePlan));
    }
    setTimeout(() => {
      setIsPlanningLoading(false);
      router.push(`/plan?dest=${encodeURIComponent(activePlan.destinationArea)}&mode=one-day`);
    }, 250);
  };

  const handleUpdatePlan = () => {
    setPlanSuccessNotice(`Itinerary updated for ${activePlan.destinationArea} (${selectedDuration === "3h" ? "3 Hours" : selectedDuration === "6h" ? "6 Hours" : "Full Day"})`);
    setTimeout(() => setPlanSuccessNotice(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#FAF4E8] text-[#20211D] pb-32">
      {/* 1. COMPACT EDITORIAL DAY ESCAPE HEADER */}
      <section className="bg-[#173B32] text-[#EFE5D2] px-4 sm:px-6 lg:px-8 pt-8 pb-7 border-b-2 border-[#E5D5BA]/30 relative overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B49252]">
                DAY ESCAPE COCKPIT • एक दिवसीय सफ़र
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-black text-[#FAF7F0] tracking-tight">
              Day Escape: {activePlan.destinationArea}
            </h1>
            <p className="text-xs text-[#D8DED5]/80 font-sans mt-0.5">
              Leave in the morning. Return tonight. Pure spontaneous discovery.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <TravelStamp label={activePlan.destinationArea.toUpperCase()} variant="terracotta" />
            <button
              type="button"
              onClick={handlePlanThisTrip}
              disabled={isPlanningLoading}
              className="px-4 py-2 rounded-xl bg-[#B65E3C] hover:bg-[#9F4F30] text-[#FAF4E8] text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#B49252]" />
              <span>{isPlanningLoading ? "Loading..." : "Plan in Vanvas"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. COMPACT 3-QUESTION PLANNING EXPERIENCE */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-3 relative z-20">
        <div className="bg-[#FAF7F0] p-5 sm:p-6 rounded-3xl border-2 border-[#E5D5BA] shadow-md space-y-5">
          {/* QUESTION 1: WHERE AM I GOING / STARTING? */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#B65E3C] font-bold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>1. Where are you starting &amp; heading?</span>
              </label>
              <button
                type="button"
                onClick={handleGPSDetect}
                disabled={isLocating}
                className="text-[10px] font-mono font-bold text-[#173B32] hover:text-[#B65E3C] flex items-center gap-1 cursor-pointer"
              >
                <LocateFixed className={`w-3 h-3 ${isLocating ? "animate-spin" : ""}`} />
                <span>{isLocating ? "Locating..." : "Use GPS"}</span>
              </button>
            </div>

            {/* Starting Hubs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {ONE_DAY_HUBS.map((hub) => {
                const isSelected = selectedHubId === hub.id && !isCustomMode;
                return (
                  <button
                    key={hub.id}
                    type="button"
                    onClick={() => {
                      setSelectedHubId(hub.id);
                      setIsCustomMode(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                      isSelected
                        ? "bg-[#173B32] text-[#FAF4E8] border-[#173B32] shadow-xs"
                        : "bg-[#EFE5D2]/50 text-[#173B32] border-[#E5D5BA] hover:bg-[#EFE5D2]"
                    }`}
                  >
                    {hub.name}
                  </button>
                );
              })}
            </div>

            {/* Available Destination Corridors for this Origin */}
            {plansForOrigin.length > 0 && (
              <div className="pt-1 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                <span className="text-[10px] font-mono text-[#7B4D36] shrink-0 font-bold uppercase">
                  Corridors:
                </span>
                {plansForOrigin.map((p) => {
                  const isSelected = activePlan.id === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlanId(p.id)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                        isSelected
                          ? "bg-[#B65E3C] text-[#FAF4E8] border-[#B65E3C] font-bold shadow-xs"
                          : "bg-white text-[#173B32] border-[#E5D5BA] hover:border-[#173B32]"
                      }`}
                    >
                      {p.destinationArea} ({p.totalDistanceKm} km)
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#E5D5BA]">
            {/* QUESTION 2: HOW MUCH TIME DO I HAVE? */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#B65E3C] font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>2. How much time do you have?</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "3h" as DayDurationOption, label: "3 Hours", desc: "Quick Escape" },
                  { id: "6h" as DayDurationOption, label: "6 Hours", desc: "Half Day" },
                  { id: "full_day" as DayDurationOption, label: "Full Day", desc: "Dawn to Dusk" },
                ].map((dur) => {
                  const isSelected = selectedDuration === dur.id;
                  return (
                    <button
                      key={dur.id}
                      type="button"
                      onClick={() => setSelectedDuration(dur.id)}
                      className={`p-2.5 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#173B32] text-[#FAF4E8] border-[#173B32] shadow-xs"
                          : "bg-white text-[#173B32] border-[#E5D5BA] hover:bg-[#EFE5D2]/40"
                      }`}
                    >
                      <span className="block font-serif font-bold text-xs">{dur.label}</span>
                      <span className={`block text-[10px] font-mono ${isSelected ? "text-[#B49252]" : "text-[#7B4D36]"}`}>
                        {dur.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* QUESTION 3: WHAT KIND OF EXPERIENCE DO I WANT? */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#B65E3C] font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>3. Preferred Experience Style</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DAY_ESCAPE_STYLES.map((st) => {
                  const isSelected = selectedStyleId === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSelectedStyleId(st.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? "bg-[#173B32] text-[#FAF4E8] border-[#173B32] shadow-xs"
                          : "bg-white text-[#173B32] border-[#E5D5BA] hover:bg-[#EFE5D2]/50"
                      }`}
                    >
                      <span>{st.icon}</span>
                      <span>{st.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* PRIMARY ACTION BUTTON */}
          <div className="pt-2 border-t border-[#E5D5BA] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-[#7B4D36]">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>
                {activePlan.title} • {activePlan.totalDistanceKm} km round trip
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsTimingModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-[#EFE5D2] hover:bg-[#E5D5BA] text-[#173B32] border border-[#E5D5BA] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#B65E3C]" />
                <span>Adjust Timings</span>
              </button>

              <button
                type="button"
                onClick={handleUpdatePlan}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#FAF4E8] text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Update Itinerary</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#B49252]" />
              </button>
            </div>
          </div>

          {planSuccessNotice && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{planSuccessNotice}</span>
            </div>
          )}
        </div>
      </section>

      {/* 3. REUSABLE HORIZONTAL TAB NAVIGATION */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5D5BA] pb-3 mb-6">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B65E3C]">
              ACTIVE CORRIDOR COCKPIT
            </span>
            <h2 className="font-serif font-black text-xl text-[#173B32]">
              {activePlan.originCity} → {activePlan.destinationArea}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
              calculatedFeasibility.rating === "COMFORTABLE"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : calculatedFeasibility.rating === "TIGHT"
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}>
              {calculatedFeasibility.rating} TIMING
            </span>

            <button
              type="button"
              onClick={handleGetDirections}
              className="px-3 py-1 rounded-full bg-[#EFE5D2] hover:bg-[#E5D5BA] text-[#173B32] border border-[#E5D5BA] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <Navigation className="w-3 h-3 text-[#B65E3C]" />
              <span>Directions</span>
            </button>
          </div>
        </div>

        <VanvasTabBar<OneDayTabType>
          tabs={[
            { id: "itinerary", label: "Itinerary", icon: Clock, count: adaptedStops.length },
            { id: "route", label: "Route & Map", icon: MapPin },
            { id: "budget", label: "Budget", icon: Wallet },
            { id: "checklist", label: "Checklist", icon: CheckSquare },
            { id: "rentals", label: "Rentals", icon: Car, count: activePlan.rentals.length },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          layoutId="oneDayTabActivePill"
          variant="parchment"
          className="max-w-2xl"
        />

        {/* 4. ANIMATED TAB PANELS */}
        <div className="mt-6">
          <AnimatePresence mode="wait">
            {/* TAB 1: ITINERARY */}
            {activeTab === "itinerary" && (
              <motion.div
                key="tab-itinerary"
                variants={routeScreenVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-4"
              >
                <div className="p-4 rounded-2xl bg-[#EFE5D2]/50 border border-[#E5D5BA] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-mono text-[#7B4D36]">
                    <Clock className="w-4 h-4 text-[#B65E3C]" />
                    <span>Departure: <strong>{departureTime}</strong> • Estimated Return: <strong>{calculatedReturnHomeTime}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsTimingModalOpen(true)}
                    className="text-[#173B32] font-bold underline hover:text-[#B65E3C] cursor-pointer"
                  >
                    Edit
                  </button>
                </div>

                <div className="space-y-3">
                  {adaptedStops.map((stop, idx) => (
                    <div
                      key={stop.id}
                      onClick={() => setSelectedStopForModal(stop)}
                      className="p-4 sm:p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] hover:border-[#173B32] transition-all cursor-pointer shadow-xs space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#173B32] text-[#FAF4E8] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-mono font-bold text-[#B65E3C]">
                            {stop.timeSlot}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#173B32]/10 text-[#173B32]">
                          {stop.category}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <h4 className="font-serif font-bold text-base text-[#173B32] group-hover:text-[#B65E3C] transition-colors">
                            {stop.name} <span className="text-xs text-[#7B4D36] font-devanagari font-normal">({stop.hindiName})</span>
                          </h4>
                          <p className="text-xs text-[#7B4D36]">
                            {stop.activityTitle} • {stop.estimatedDuration}
                          </p>
                        </div>

                        <div className="text-xs font-mono text-[#173B32] flex items-center gap-1 sm:text-right">
                          <span>{stop.distanceFromPrevKm > 0 ? `+${stop.distanceFromPrevKm} km` : "Start"}</span>
                          <span className="text-[#B65E3C] group-hover:translate-x-0.5 transition-transform">Details →</span>
                        </div>
                      </div>

                      <p className="text-xs text-[#20211D]/80 line-clamp-2 pt-1 border-t border-[#E5D5BA]/60">
                        {stop.description}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* TAB 2: ROUTE & MAP */}
            {activeTab === "route" && (
              <motion.div
                key="tab-route"
                variants={routeScreenVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-4"
              >
                <div className="p-4 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] overflow-hidden space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-serif font-bold text-base text-[#173B32]">
                        Highway Corridors &amp; Stops
                      </h4>
                      <p className="text-xs text-[#7B4D36]">
                        {activePlan.stops.length} verified waypoints along the route
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGetDirections}
                      className="px-4 py-2 rounded-xl bg-[#173B32] text-[#FAF4E8] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5 text-[#B49252]" />
                      <span>Open in Maps</span>
                    </button>
                  </div>

                  <div className="h-80 sm:h-96 rounded-2xl overflow-hidden border border-[#E5D5BA]">
                    <VanvasMap
                      markers={activePlan.stops
                        .filter((s) => s.lat && s.lng)
                        .map((s, idx): VanvasMapMarker => ({
                          id: s.id,
                          lat: s.lat!,
                          lng: s.lng!,
                          title: s.name,
                          hindiTitle: s.hindiName,
                          type: idx === 0 ? "start" : idx === activePlan.stops.length - 1 ? "summit" : "waypoint",
                          description: s.activityTitle,
                        }))}
                      center={{ lat: activePlan.stops[0]?.lat || 28.6139, lng: activePlan.stops[0]?.lng || 77.2090 }}
                      height={380}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 3: BUDGET */}
            {activeTab === "budget" && (
              <motion.div
                key="tab-budget"
                variants={routeScreenVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-4"
              >
                <div className="p-6 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#B65E3C] font-bold">
                        TRANSPARENT LEDGER
                      </span>
                      <h3 className="font-serif font-bold text-xl text-[#173B32]">
                        Day Trip Cost Breakdown
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 bg-[#EFE5D2] px-3 py-1.5 rounded-xl border border-[#E5D5BA]">
                      <Users className="w-3.5 h-3.5 text-[#B65E3C]" />
                      <span className="text-xs font-bold text-[#173B32]">{groupSize} Persons</span>
                      <button
                        type="button"
                        onClick={() => setGroupSize((p) => Math.max(1, p - 1))}
                        className="w-5 h-5 rounded bg-white text-xs font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => setGroupSize((p) => Math.min(8, p + 1))}
                        className="w-5 h-5 rounded bg-white text-xs font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-2xl bg-white border border-[#E5D5BA]">
                      <span className="block text-[10px] font-mono text-[#7B4D36] uppercase">Fuel &amp; Tolls</span>
                      <span className="font-serif font-bold text-base text-[#173B32]">
                        ₹{(activePlan.budgetBreakdown.transportFuel + activePlan.budgetBreakdown.parkingTolls).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-white border border-[#E5D5BA]">
                      <span className="block text-[10px] font-mono text-[#7B4D36] uppercase">Meals &amp; Dhabas</span>
                      <span className="font-serif font-bold text-base text-[#173B32]">
                        ₹{(activePlan.budgetBreakdown.foodSnacks * groupSize).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-white border border-[#E5D5BA]">
                      <span className="block text-[10px] font-mono text-[#7B4D36] uppercase">Tickets / Activity</span>
                      <span className="font-serif font-bold text-base text-[#173B32]">
                        ₹{(activePlan.budgetBreakdown.activityTickets * groupSize).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-white border border-[#E5D5BA]">
                      <span className="block text-[10px] font-mono text-[#7B4D36] uppercase">Per Person Split</span>
                      <span className="font-serif font-bold text-base text-[#B65E3C]">
                        ≈ ₹{costPerPerson.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 4: CHECKLIST */}
            {activeTab === "checklist" && (
              <motion.div
                key="tab-checklist"
                variants={routeScreenVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-4"
              >
                <div className="p-6 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#B65E3C] font-bold">
                        HIGHWAY PREPARATION
                      </span>
                      <h3 className="font-serif font-bold text-xl text-[#173B32]">
                        Essential Day Pack Checklist
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-[#7B4D36]">
                      {Object.values(checkedItems).filter(Boolean).length} / 8 ready
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { id: "dl", label: "Driving License & Vehicle RC" },
                      { id: "fastag", label: "Fastag Recharged (₹500+)" },
                      { id: "pbank", label: "Power Bank & Phone Charging Cable" },
                      { id: "water", label: "2L Water Bottle per person" },
                      { id: "cash", label: "Highway Cash (₹1,500 in 100/200s)" },
                      { id: "med", label: "Antacids, Band-Aids & Motion Relief" },
                      { id: "offline", label: "Offline Maps Pre-Downloaded" },
                      { id: "sun", label: "UV Sunglasses & Sun Protection" },
                    ].map((item) => {
                      const isChecked = Boolean(checkedItems[item.id]);
                      return (
                        <div
                          key={item.id}
                          onClick={() => setCheckedItems((p) => ({ ...p, [item.id]: !p[item.id] }))}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isChecked
                              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                              : "bg-white border-[#E5D5BA] text-[#173B32] hover:bg-[#FAF7F0]"
                          }`}
                        >
                          <span className="text-xs font-semibold">{item.label}</span>
                          <span className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                            isChecked ? "bg-emerald-600 border-emerald-600 text-white" : "border-[#E5D5BA]"
                          }`}>
                            {isChecked && <Check className="w-3.5 h-3.5" />}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 5: RENTALS */}
            {activeTab === "rentals" && (
              <motion.div
                key="tab-rentals"
                variants={routeScreenVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif font-bold text-lg text-[#173B32]">
                      Self-Drive &amp; Rental Options for {activePlan.originCity}
                    </h3>
                    <span className="text-xs font-mono text-[#7B4D36]">
                      {activePlan.rentals.length} options
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {activePlan.rentals.map((r, rIdx) => (
                      <div
                        key={`${r.providerName}-${rIdx}`}
                        className="p-4 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] hover:border-[#173B32] transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-[#173B32]/10 text-[#173B32]">
                            {r.vehicleType}
                          </span>
                          <span className="text-xs font-mono font-bold text-[#B65E3C]">
                            ₹{r.approxRatePerDay} / day
                          </span>
                        </div>
                        <h4 className="font-serif font-bold text-base text-[#173B32]">
                          {r.providerName}
                        </h4>
                        <p className="text-xs text-[#7B4D36]">
                          {r.location} • Deposit: ₹{r.securityDeposit}
                        </p>
                        <div className="pt-1 flex items-center justify-between text-xs font-bold text-[#173B32]">
                          <span>{r.verificationStatus}</span>
                          {r.phone && (
                            <a
                              href={`tel:${r.phone}`}
                              className="text-[#B65E3C] hover:underline flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Call</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* STOP DETAIL MODAL (ADAPTIVE POPUP / BOTTOM SHEET) */}
      <VanvasAdaptiveModal
        isOpen={Boolean(selectedStopForModal)}
        onClose={() => setSelectedStopForModal(null)}
        title={selectedStopForModal?.name}
        subtitle={selectedStopForModal ? `${selectedStopForModal.timeSlot} • ${selectedStopForModal.category.toUpperCase()}` : undefined}
      >
        {selectedStopForModal && (
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#B65E3C] font-bold">
                ACTIVITY &amp; DURATION
              </span>
              <h4 className="font-serif font-bold text-lg text-[#173B32]">
                {selectedStopForModal.activityTitle} ({selectedStopForModal.estimatedDuration})
              </h4>
            </div>

            <p className="text-xs text-[#20211D]/90 leading-relaxed font-sans">
              {selectedStopForModal.description}
            </p>

            {selectedStopForModal.localTip && (
              <div className="p-3.5 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#B65E3C] font-bold flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>Local Insider Tip</span>
                </span>
                <p className="text-xs text-[#173B32] font-medium leading-normal">
                  {selectedStopForModal.localTip}
                </p>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between text-xs font-mono border-t border-[#E5D5BA]">
              <span className="text-[#7B4D36]">
                Approx Cost: ₹{selectedStopForModal.approxCostPerPerson}/person
              </span>
              {selectedStopForModal.phone && (
                <a
                  href={`tel:${selectedStopForModal.phone}`}
                  className="px-3 py-1.5 rounded-xl bg-[#173B32] text-[#FAF4E8] font-bold flex items-center gap-1"
                >
                  <Phone className="w-3 h-3 text-[#B49252]" />
                  <span>Call Spot</span>
                </a>
              )}
            </div>
          </div>
        )}
      </VanvasAdaptiveModal>

      {/* ADJUST TIMING MODAL (ADAPTIVE POPUP / BOTTOM SHEET) */}
      <VanvasAdaptiveModal
        isOpen={isTimingModalOpen}
        onClose={() => setIsTimingModalOpen(false)}
        title="Adjust Departure & Return"
        subtitle="Timeline dynamically re-computes arrival windows and buffers"
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#173B32] block">
              Departure Time (Morning)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["05:30 AM", "06:30 AM", "07:30 AM", "08:30 AM"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDepartureTime(t)}
                  className={`py-2 px-3 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                    departureTime === t
                      ? "bg-[#173B32] text-[#FAF4E8] border-[#173B32]"
                      : "bg-[#FAF7F0] text-[#173B32] border-[#E5D5BA] hover:bg-[#EFE5D2]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#173B32] block">
              Return Home Deadline (Evening)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["08:00 PM", "09:30 PM", "10:30 PM", "11:30 PM"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setReturnDeadline(t)}
                  className={`py-2 px-3 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                    returnDeadline === t
                      ? "bg-[#173B32] text-[#FAF4E8] border-[#173B32]"
                      : "bg-[#FAF7F0] text-[#173B32] border-[#E5D5BA] hover:bg-[#EFE5D2]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] text-xs font-mono text-[#7B4D36]">
            {calculatedFeasibility.reason}
          </div>

          <button
            type="button"
            onClick={() => setIsTimingModalOpen(false)}
            className="w-full py-2.5 rounded-xl bg-[#173B32] text-[#FAF4E8] text-xs font-bold uppercase tracking-wider"
          >
            Apply &amp; Done
          </button>
        </div>
      </VanvasAdaptiveModal>
    </div>
  );
}
