"use client";

import React, { useState, useMemo, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Compass, MapPin, Sparkles, Clock, Car, Bike, Train,
  Bus, Users, Wallet, ArrowRight, RefreshCw, Dice5,
  Fuel, ShieldCheck, Check, Star, Coffee, Utensils,
  Sun, Sunset, Moon, Sunrise, ChevronRight, Navigation,
  AlertCircle, Building2, Store, Heart, ThumbsUp, Shield,
  CheckCircle2, Pill, ShoppingBag, Phone, ExternalLink,
  ChevronDown, ChevronUp, SlidersHorizontal, LocateFixed,
  Flame, Award, Layers, Wine, Eye, HelpCircle, Navigation2,
  Calendar, Share2, Ticket, CheckSquare, X, ArrowUpRight
} from "lucide-react";
import {
  ONE_DAY_HUBS,
  SEEDED_ONE_DAY_PLANS,
  OneDayPlan,
  OneDayStop,
  OneDayHub,
  OneDayVibe,
  OneDayTransport,
  FeasibilityRating,
  getOneDayPlansForOrigin
} from "@/lib/oneDayContentModel";
import { getCurrentGPSPosition, UserLocationState } from "@/lib/locationService";
import { VanvasImage } from "@/components/ui/VanvasImage";
import { VanvasMap, VanvasMapMarker, VanvasMapRouteSegment } from "@/components/ui/VanvasMap";

const DAY_ESCAPE_STYLES: Array<{
  id: string;
  name: string;
  hindiName: string;
  tagline: string;
  vibes: OneDayVibe[];
  icon: string;
}> = [
  {
    id: "ALL",
    name: "All Day Escapes",
    hindiName: "सभी एक-दिवसीय सफ़र",
    tagline: "Explore all curated road trip corridors and day itineraries.",
    vibes: [],
    icon: "🗺️",
  },
  {
    id: "QUICK_ESCAPE",
    name: "Quick Escape",
    hindiName: "आरामदेह त्वरित सफ़र",
    tagline: "Minimal travel, fewer stops, relaxed pace and quick scenic breeze.",
    vibes: ["Road Trip", "Chill", "Nature"],
    icon: "🚗",
  },
  {
    id: "FOOD_TRAIL",
    name: "Food Trail",
    hindiName: "ढाबा व खान-पान यात्रा",
    tagline: "Dawn breakfast, iconic highway dhabas, local snacks and evening chai.",
    vibes: ["Food", "Cafes", "Road Trip"],
    icon: "🫓",
  },
  {
    id: "NATURE_DAY",
    name: "Nature Day",
    hindiName: "प्रकृति व जलप्रपात",
    tagline: "High viewpoints, pine forests, waterfalls and panoramic sunsets.",
    vibes: ["Nature", "Mountains", "Waterfalls", "Rivers", "Sunset"],
    icon: "🌲",
  },
  {
    id: "CULTURE_DAY",
    name: "Culture & Heritage",
    hindiName: "विरासत, बावड़ी व मंदिर",
    tagline: "Ancient forts, stepwells, sacred river ghats and vibrant craft bazaars.",
    vibes: ["Forts", "History", "Temples", "Spiritual", "Shopping"],
    icon: "🏰",
  },
  {
    id: "ADVENTURE_DAY",
    name: "Adventure Day",
    hindiName: "रोमांच व आउटडोर ट्रेल्स",
    tagline: "Short ridge hikes, mountain curves, river crossings and active sports.",
    vibes: ["Adventure", "Mountains", "Rivers"],
    icon: "🧗",
  },
  {
    id: "ROMANTIC_LEISURE",
    name: "Romantic / Leisure",
    hindiName: "शांत व सुरम्य भ्रमण",
    tagline: "Tranquil hillside cafes, scenic viewpoints, golden sunsets and slow pacing.",
    vibes: ["Chill", "Sunset", "Cafes", "Nature"],
    icon: "☕",
  },
];

type ChecklistAction = "HAVE" | "BUY" | "BORROW" | "RENT" | "SKIP";

function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 360; // default 6:00 AM
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

function OneDayPlannerInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from") || searchParams.get("origin") || "";
  const dossierRef = useRef<HTMLDivElement>(null);

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

  // Style / Filter State
  const [selectedStyleId, setSelectedStyleId] = useState<string>("ALL");
  const [groupSize, setGroupSize] = useState<number>(3);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"PLAN" | "MAP" | "RENTALS" | "CHECKLIST" | "COMPROMISE">("PLAN");
  const [rentalVehicleTypeFilter, setRentalVehicleTypeFilter] = useState<"ALL" | "BIKE" | "SCOOTER">("ALL");

  // Dynamic Timeline Customization State
  const [departureTime, setDepartureTime] = useState<string>("06:30 AM");
  const [returnDeadline, setReturnDeadline] = useState<string>("09:30 PM");

  // Modal / Plan Handoff State
  const [tripModalOpen, setTripModalOpen] = useState(false);
  const [isPlanningLoading, setIsPlanningLoading] = useState(false);

  // Interactive Checklist State
  const [checklistStatus, setChecklistStatus] = useState<Record<string, ChecklistAction>>({});

  // Group voting compromise state
  const [votingOptions, setVotingOptions] = useState<Array<{ name: string; friend: string; votes: number }>>([
    { name: "Murthal Paratha & Haveli Ride", friend: "Aman", votes: 4 },
    { name: "Neemrana Fort-Palace Day Run", friend: "Priya", votes: 3 },
    { name: "Mathura & Vrindavan Heritage", friend: "Rohan", votes: 2 },
  ]);

  const activeHub = ONE_DAY_HUBS.find((h) => h.id === selectedHubId) || ONE_DAY_HUBS[0];
  const activeOriginLabel = isCustomMode && customOrigin ? customOrigin : activeHub.name;

  // Selected Style
  const activeStyle = DAY_ESCAPE_STYLES.find((s) => s.id === selectedStyleId) || DAY_ESCAPE_STYLES[0];

  // Fetch / Filter available plans for the origin
  const plansForOrigin = useMemo(() => {
    const basePlans = getOneDayPlansForOrigin(activeOriginLabel, activeStyle.vibes);
    if (selectedStyleId === "ALL") return basePlans;
    return basePlans.filter((p) => {
      if (p.tripStyle && p.tripStyle.toLowerCase().replace(/[^a-z]/g, "") === selectedStyleId.toLowerCase().replace(/[^a-z]/g, "")) {
        return true;
      }
      return activeStyle.vibes.some((v) => p.vibes.includes(v));
    });
  }, [activeOriginLabel, selectedStyleId, activeStyle]);

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

  // Sync initial departure and return times from active plan
  useEffect(() => {
    if (activePlan) {
      setDepartureTime(activePlan.departureTime || "06:30 AM");
      setReturnDeadline(activePlan.returnTime || "09:30 PM");
    }
  }, [activePlan.id]);

  // Dynamic Timeline Recalculation Engine
  const adaptedStops = useMemo(() => {
    const startMins = parseTimeToMinutes(departureTime);
    let currentMins = startMins;

    return activePlan.stops.map((stop, idx) => {
      // Calculate travel time to this stop
      const travelMins = idx === 0 ? Math.max(30, Math.round(stop.distanceFromPrevKm * 1.3)) : Math.max(15, Math.round(stop.distanceFromPrevKm * 1.2));
      const arrivalMins = currentMins + travelMins;
      
      // Stop duration in minutes
      let durationMins = 60;
      if (stop.estimatedDuration.includes("Hours") || stop.estimatedDuration.includes("Hour")) {
        const h = parseFloat(stop.estimatedDuration) || 1.5;
        durationMins = Math.round(h * 60);
      } else if (stop.estimatedDuration.includes("Mins")) {
        durationMins = parseInt(stop.estimatedDuration, 10) || 45;
      }

      const departureMins = arrivalMins + durationMins;
      currentMins = departureMins;

      // Period resolution
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

  // Final Estimated Return Home Time
  const calculatedReturnHomeMins = useMemo(() => {
    if (adaptedStops.length === 0) return parseTimeToMinutes(departureTime) + 480;
    const lastStop = adaptedStops[adaptedStops.length - 1];
    const lastStopDepartMins = parseTimeToMinutes(lastStop.calculatedDeparture);
    // Return drive home based on half total distance
    const returnDriveMins = Math.max(45, Math.round((activePlan.totalDistanceKm * 0.45) * 1.2));
    return lastStopDepartMins + returnDriveMins;
  }, [adaptedStops, activePlan.totalDistanceKm, departureTime]);

  const calculatedReturnHomeTime = useMemo(() => {
    return formatMinutesToTime(calculatedReturnHomeMins);
  }, [calculatedReturnHomeMins]);

  // Dynamic Feasibility Computation
  const calculatedFeasibility = useMemo<{ rating: FeasibilityRating; reason: string }>(() => {
    const deadlineMins = parseTimeToMinutes(returnDeadline);
    const diff = deadlineMins - calculatedReturnHomeMins;
    if (diff >= 60) {
      return {
        rating: "COMFORTABLE",
        reason: `Estimated return at ${calculatedReturnHomeTime} leaves a comfortable ${Math.round(diff)} minute buffer before your ${returnDeadline} deadline.`,
      };
    } else if (diff >= 0) {
      return {
        rating: "TIGHT",
        reason: `Estimated return at ${calculatedReturnHomeTime} is within ${Math.round(diff)} mins of your ${returnDeadline} deadline. Maintain steady driving pace.`,
      };
    } else {
      return {
        rating: "RUSHED",
        reason: `Estimated return at ${calculatedReturnHomeTime} exceeds your ${returnDeadline} deadline by ${Math.abs(Math.round(diff))} mins. Consider departing earlier or trimming a stop.`,
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

  // GPS Location Handler
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
      } else {
        setGpsDetectedCity(`GPS Location (${res.coords.latitude.toFixed(2)}°N, ${res.coords.longitude.toFixed(2)}°E)`);
      }
    }
  };

  const getFeasibilityBadge = (rating: FeasibilityRating) => {
    switch (rating) {
      case "COMFORTABLE":
        return "bg-emerald-950 text-emerald-300 border-emerald-700/60";
      case "TIGHT":
        return "bg-amber-950 text-amber-300 border-amber-700/60";
      case "RUSHED":
      case "NOT RECOMMENDED":
        return "bg-red-950 text-red-300 border-red-700/60";
      default:
        return "bg-stone-900 text-stone-300 border-stone-700";
    }
  };

  const handleGetDirections = (plan: OneDayPlan) => {
    const destinationCoord = plan.stops[plan.stops.length - 1] || plan.stops[0];
    let originQuery = activeOriginLabel;
    if (gpsState.status === "GRANTED" && gpsState.coords) {
      originQuery = `${gpsState.coords.latitude},${gpsState.coords.longitude}`;
    }

    const destQuery = destinationCoord.lat && destinationCoord.lng
      ? `${destinationCoord.lat},${destinationCoord.lng}`
      : encodeURIComponent(`${plan.destinationArea}, India`);

    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originQuery)}&destination=${destQuery}&travelmode=driving`;
    window.open(mapsUrl, "_blank", "noopener,noreferrer");
  };

  const handlePlanThisTrip = (plan: OneDayPlan) => {
    setIsPlanningLoading(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("vanvas_prefill_destination", plan.destinationArea);
      localStorage.setItem("vanvas_prefill_origin", activeOriginLabel);
      localStorage.setItem("vanvas_prefill_oneday", JSON.stringify(plan));
    }
    setTimeout(() => {
      setIsPlanningLoading(false);
      router.push(`/plan?dest=${encodeURIComponent(plan.destinationArea)}&mode=one-day`);
    }, 300);
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

    const extraItems: Array<{ id: string; name: string; category: string; required: boolean }> = [];

    if (activePlan.vibes.includes("Mountains") || activePlan.destinationArea.toLowerCase().includes("dehradun") || activePlan.destinationArea.toLowerCase().includes("mussoorie") || activePlan.destinationArea.toLowerCase().includes("kasauli")) {
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
    if (activePlan.totalDistanceKm >= 250) {
      extraItems.push(
        { id: "tire_gauge", name: "Spare Tire Pressure Check & Valve Cap", category: "Highway Safety", required: true },
        { id: "flashlight", name: "High-Intensity Flashlight / Torch", category: "Highway Safety", required: false }
      );
    }

    return [...baseItems, ...extraItems];
  }, [activePlan]);

  // Filtered Rentals by Bike vs Scooter
  const filteredRentals = useMemo(() => {
    if (rentalVehicleTypeFilter === "ALL") return activePlan.rentals;
    if (rentalVehicleTypeFilter === "BIKE") {
      return activePlan.rentals.filter((r) =>
        r.vehicleType.toLowerCase().includes("royal") ||
        r.vehicleType.toLowerCase().includes("cruiser") ||
        r.vehicleType.toLowerCase().includes("bike") ||
        r.vehicleType.toLowerCase().includes("hatchback") ||
        r.vehicleType.toLowerCase().includes("suv")
      );
    }
    return activePlan.rentals.filter((r) =>
      r.vehicleType.toLowerCase().includes("scooter") ||
      r.vehicleType.toLowerCase().includes("activa") ||
      r.vehicleType.toLowerCase().includes("jupiter")
    );
  }, [activePlan.rentals, rentalVehicleTypeFilter]);

  return (
    <div className="min-h-screen bg-[#0C1410] text-[#EFE5D2] pb-[max(5rem,env(safe-area-inset-bottom,0px))] selection:bg-[#D95327] selection:text-white">
      {/* 1. TOP EDITORIAL DAY ESCAPE PASS HEADER */}
      <section className="relative min-h-[48vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16 overflow-hidden border-b-2 border-[#2D4539] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1B2B23] via-[#0E1713] to-[#070D0A]">
        {/* Road Atlas Grid Pattern */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#C59B47 1px, transparent 1px), radial-gradient(#D95327 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            backgroundPosition: "0 0, 16px 16px",
          }}
        />

        {/* Vintage Highway Day-Pass Stamp */}
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-5">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="px-4 py-1.5 rounded-full bg-[#D95327] text-white text-[11px] font-mono font-black tracking-widest uppercase shadow-xl border border-[#F27E59]/40 flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#FAF4E8]" />
              <span>DAY ESCAPE COCKPIT</span>
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-[#18261F] text-[#C59B47] text-[11px] font-mono font-bold tracking-wider uppercase border border-[#C59B47]/40 shadow-md">
              [ LEAVE IN MORNING • RETURN TONIGHT ]
            </span>
          </div>

          <div className="space-y-2">
            <span className="font-devanagari text-2xl sm:text-4xl text-[#C59B47] block font-bold drop-shadow-md">
              एक दिन का सफ़र • चलो कहीं चलते हैं!
            </span>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-black tracking-tight text-[#FAF4E8] drop-shadow-xl">
              DAY ESCAPE MODE
            </h1>
          </div>

          <p className="text-sm sm:text-base text-[#9EB5A9] font-serif max-w-2xl mx-auto leading-relaxed pt-1">
            &ldquo;Leave in the morning. Come back tonight. Everything between those two points is handled.&rdquo;
          </p>

          {/* Stamped Route Passport Annotation */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] font-mono">
            <span className="px-3 py-1 rounded-lg bg-[#14201A] border border-[#2D4539] text-[#A6C5B4]">
              🛣️ {activePlan.originCity} → {activePlan.destinationArea}
            </span>
            <span className="px-3 py-1 rounded-lg bg-[#14201A] border border-[#2D4539] text-[#C59B47]">
              ⏱️ {activePlan.totalTravelTime}
            </span>
            <span className="px-3 py-1 rounded-lg bg-[#14201A] border border-[#2D4539] text-[#52B788]">
              💰 ≈ ₹{costPerPerson}/person split
            </span>
          </div>
        </div>
      </section>

      {/* 2. ORIGIN SELECTOR & GPS ROAD LOG */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="p-6 sm:p-7 rounded-3xl bg-[#14201A] border-2 border-[#2D4539] shadow-2xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C59B47] font-bold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#D95327]" />
                <span>EXPEDITION DEPARTURE ORIGIN</span>
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
                <span>{isLocating ? "Detecting GPS..." : "USE MY GPS LOCATION"}</span>
              </button>

              <button
                onClick={() => setIsCustomMode(!isCustomMode)}
                className={`px-4 py-2.5 rounded-2xl border text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isCustomMode
                    ? "bg-[#253D30] text-[#FAF4E8] border-[#3A5646]"
                    : "bg-[#1B2C24] hover:bg-[#253D30] text-[#FAF4E8] border-[#3A5646]"
                }`}
              >
                {isCustomMode ? "Standard Hubs" : "Custom City"}
              </button>
            </div>
          </div>

          {/* GPS Detected Banner */}
          {gpsDetectedCity && (
            <div className="p-3.5 rounded-2xl bg-[#1B2F24] border border-[#3E6550] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-emerald-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span>📍 <strong>GPS POSITION ATTACHED:</strong> {gpsDetectedCity}</span>
              </div>
              <span className="text-[11px] text-[#A6C5B4]">
                Auto-computed shortest road corridors from your position
              </span>
            </div>
          )}

          {/* Hub Pills */}
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

      {/* 3. TRIP STYLES (SECTION 5 MODES) & GROUP COMPANION FILTER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#23352B] pb-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C59B47] font-bold">
              DAY TRIP STYLES &amp; MODES
            </span>
            <p className="text-xs text-[#9EB5A9] font-serif">
              Select your travel mood: Quick Escape, Food Trail, Nature Day, Culture &amp; Heritage, Adventure, or Leisure
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            {/* Group Size Stepper */}
            <div className="flex items-center gap-2 bg-[#14201A] px-3.5 py-1.5 rounded-2xl border border-[#2D4539]">
              <Users className="w-3.5 h-3.5 text-[#D95327]" />
              <span className="text-[#9EB5A9]">Travellers:</span>
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

        {/* Style Selector Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
          {DAY_ESCAPE_STYLES.map((style) => {
            const isSelected = selectedStyleId === style.id;
            return (
              <button
                key={style.id}
                onClick={() => setSelectedStyleId(style.id)}
                className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between cursor-pointer space-y-1.5 ${
                  isSelected
                    ? "bg-[#273F32] border-[#D95327] text-white shadow-lg ring-1 ring-[#D95327]"
                    : "bg-[#111B16] border-[#223329] text-[#8FA699] hover:text-white hover:border-[#385141]"
                }`}
              >
                <div className="text-xl">{style.icon}</div>
                <div className="space-y-0.5">
                  <div className="text-xs font-bold leading-snug">{style.name}</div>
                  <div className="text-[10px] font-devanagari text-[#C59B47] opacity-85">{style.hindiName}</div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. DESTINATION CORRIDORS CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#23352B] pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C59B47] font-bold">
              VERIFIED ONE-DAY CORRIDORS • FROM {activeOriginLabel.toUpperCase()}
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif font-black text-white">
              {plansForOrigin.length} Day Escapes Available
            </h3>
          </div>
          <span className="text-xs text-[#9EB5A9] font-mono">
            Real landmarks, verified timings &amp; honest empty states
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
                className={`rounded-3xl border transition-all flex flex-col justify-between overflow-hidden relative ${
                  isSelected
                    ? "bg-[#16251E] border-[#D95327] shadow-2xl ring-2 ring-[#D95327]"
                    : "bg-[#121D17] border-[#22342A] hover:border-[#385141]"
                }`}
              >
                {/* Hero Artwork Preview */}
                <div className="relative h-48 w-full overflow-hidden bg-[#0A100D]">
                  <VanvasImage
                    src={plan.heroImage || plan.stops[0]?.imageUrl || "/artworks/fallback_valley.jpg"}
                    alt={plan.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121D17] via-transparent to-black/40 pointer-events-none" />

                  {/* Stamped Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-black uppercase border ${badgeClass}`}>
                      {plan.feasibility}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[#C59B47] text-[10px] font-mono font-bold">
                      {plan.vibes[0]}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[#FAF4E8] text-xs font-mono font-bold border border-[#2D4539]">
                      {plan.totalDistanceKm} km
                    </span>
                  </div>

                  {/* Destination Spine Badge */}
                  <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between gap-2">
                    <div>
                      <h4 className="font-serif font-black text-2xl text-white leading-tight drop-shadow-lg">
                        {plan.destinationArea}
                      </h4>
                      <span className="font-devanagari text-xs text-[#C59B47] drop-shadow-md">
                        {plan.hindiTitle}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-[#FAF4E8] line-clamp-1">
                      {plan.title}
                    </div>

                    <p className="text-xs text-[#9EB5A9] font-serif leading-relaxed line-clamp-2">
                      {plan.tagline}
                    </p>

                    {/* Metrics Spine */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#23352B] text-[11px] font-mono">
                      <div className="p-2 rounded-xl bg-[#0E1612] border border-[#1E2D24]">
                        <span className="block text-[8px] uppercase text-[#6D8578]">Leave / Return</span>
                        <span className="text-white font-bold">{plan.departureTime.split(" ")[0]} → {plan.returnTime.split(" ")[0]}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#0E1612] border border-[#1E2D24]">
                        <span className="block text-[8px] uppercase text-[#6D8578]">Drive Time</span>
                        <span className="text-[#D95327] font-bold">{plan.totalTravelTime.split(" ")[0]} hrs</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#0E1612] border border-[#1E2D24]">
                        <span className="block text-[8px] uppercase text-[#6D8578]">Per Person</span>
                        <span className="text-[#52B788] font-bold">₹{plan.baseBudgetPerPerson}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-[#23352B] flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedPlanId(plan.id);
                          setTripModalOpen(true);
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-[#D95327] hover:bg-[#C24319] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>OPEN DAY PASS</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedPlanId(plan.id);
                          setActiveTab("PLAN");
                          dossierRef.current?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="px-3.5 py-2.5 rounded-xl bg-[#1B2C24] hover:bg-[#253D30] text-[#FAF4E8] text-xs font-mono font-bold flex items-center gap-1.5 border border-[#3A5646] transition-colors cursor-pointer"
                        title="View Itinerary Cockpit"
                      >
                        <Clock className="w-3.5 h-3.5 text-[#C59B47]" />
                        <span>TIMELINE</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleGetDirections(plan)}
                        className="flex-1 py-2 rounded-xl bg-[#14201A] hover:bg-[#1E3027] text-[#52B788] text-xs font-mono font-bold uppercase flex items-center justify-center gap-1.5 border border-[#2D4539] transition-colors cursor-pointer"
                      >
                        <Navigation2 className="w-3 h-3 text-[#52B788]" />
                        <span>DIRECTIONS</span>
                      </button>

                      <button
                        onClick={() => handlePlanThisTrip(plan)}
                        disabled={isPlanningLoading}
                        className="flex-1 py-2 rounded-xl bg-[#1B2C24] hover:bg-[#253D30] text-[#C59B47] text-xs font-mono font-bold uppercase flex items-center justify-center gap-1.5 border border-[#C59B47]/40 transition-colors cursor-pointer"
                      >
                        <Calendar className="w-3 h-3 text-[#C59B47]" />
                        <span>PLAN TRIP</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. ACTIVE DAY ESCAPE COCKPIT & JOURNEY SPINE */}
      <section ref={dossierRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Editorial Cockpit Header Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#15231C] border-2 border-[#2D4539] space-y-6 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase border ${getFeasibilityBadge(calculatedFeasibility.rating)}`}>
                  FEASIBILITY: {calculatedFeasibility.rating}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-[#253D30] text-[#C59B47] text-[10px] font-mono uppercase font-bold">
                  {activePlan.idealGroupSize}
                </span>
                <span className="text-xs font-mono text-[#8FA699]">
                  {activePlan.totalDistanceKm} km round trip • {activePlan.totalTravelTime}
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-serif font-black text-white">
                {activePlan.title}
              </h2>
              <p className="text-sm text-[#9EB5A9] font-serif leading-relaxed max-w-3xl">
                {calculatedFeasibility.reason}
              </p>

              {/* Time Control Strip */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-[#0E1612] px-3.5 py-2 rounded-2xl border border-[#22342A] text-xs font-mono">
                  <Sunrise className="w-4 h-4 text-[#D95327]" />
                  <span className="text-[#8FA699]">Departure:</span>
                  <select
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    aria-label="Departure Time"
                    className="bg-transparent text-white font-bold cursor-pointer focus:outline-none"
                  >
                    {["05:00 AM", "05:30 AM", "06:00 AM", "06:30 AM", "07:00 AM", "07:30 AM", "08:00 AM", "08:30 AM", "09:00 AM"].map((t) => (
                      <option key={t} value={t} className="bg-[#121E18] text-white">{t}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-[#0E1612] px-3.5 py-2 rounded-2xl border border-[#22342A] text-xs font-mono">
                  <Moon className="w-4 h-4 text-[#C59B47]" />
                  <span className="text-[#8FA699]">Return Deadline:</span>
                  <select
                    value={returnDeadline}
                    onChange={(e) => setReturnDeadline(e.target.value)}
                    aria-label="Return Deadline"
                    className="bg-transparent text-white font-bold cursor-pointer focus:outline-none"
                  >
                    {["07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM", "09:00 PM", "09:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM"].map((t) => (
                      <option key={t} value={t} className="bg-[#121E18] text-white">{t}</option>
                    ))}
                  </select>
                </div>

                <div className="px-3.5 py-2 rounded-2xl bg-[#1B2C24] text-[#52B788] text-xs font-mono font-bold border border-[#3A5646]">
                  Arrival Home: ≈ {calculatedReturnHomeTime}
                </div>
              </div>
            </div>

            {/* Split Price Box */}
            <div className="p-5 rounded-2xl bg-[#0E1612] border border-[#273B2F] shrink-0 space-y-2 text-center lg:text-right">
              <span className="text-[10px] font-mono uppercase text-[#8FA699] block">
                Total Split ({groupSize} Travellers)
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
              { id: "PLAN", label: "Day Journey Spine", icon: Clock },
              { id: "MAP", label: "Interactive Route Map", icon: MapPin },
              { id: "RENTALS", label: "Bike & Scooter Rentals", icon: Car, count: activePlan.rentals.length },
              { id: "CHECKLIST", label: "Expedition Checklist", icon: CheckCircle2, count: dynamicChecklist.length },
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

        {/* TAB 1: CHRONOLOGICAL JOURNEY SPINE (ADAPTIVE TIMELINE) */}
        {activeTab === "PLAN" && (
          <div className="space-y-6">
            {/* Timeline Spine */}
            <div className="relative pl-6 sm:pl-8 border-l-2 border-[#2D4539] space-y-6 ml-3 sm:ml-4">
              {/* DEPARTURE MILESTONE */}
              <div className="relative">
                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full bg-[#173B32] border-2 border-[#52B788] flex items-center justify-center text-xs">
                  🚀
                </div>
                <div className="p-4 rounded-2xl bg-[#0E1612] border border-[#1E2D24] flex items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <strong className="text-white">{departureTime}</strong>
                    <span className="text-[#8FA699]">• Depart from {activeOriginLabel}</span>
                  </div>
                  <span className="text-[#52B788] font-bold">START DAY ESCAPE</span>
                </div>
              </div>

              {/* INTERMEDIATE STOPS */}
              {adaptedStops.map((stop, idx) => (
                <div key={stop.id} className="relative">
                  <div className="absolute -left-[31px] sm:-left-[39px] top-4 w-6 h-6 rounded-full bg-[#D95327] text-white text-[11px] font-mono font-bold flex items-center justify-center shadow-md">
                    {idx + 1}
                  </div>

                  <div className="p-5 sm:p-6 rounded-3xl bg-[#121E18] border border-[#22342A] grid grid-cols-1 lg:grid-cols-12 gap-6 items-start shadow-lg">
                    <div className="lg:col-span-8 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-[#1B2C24] text-[#C59B47] text-[10px] font-mono uppercase font-bold border border-[#C59B47]/30">
                          {stop.timeSlot}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#14201A] text-[#A6C5B4] text-[10px] font-mono uppercase border border-[#22342A]">
                          {stop.category}
                        </span>
                        <span className="text-xs font-mono text-[#6D8578]">
                          +{stop.distanceFromPrevKm} km • {stop.estimatedDuration}
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

                      {/* Stop Metadata & Menu Status */}
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono pt-1">
                        {stop.menuUrl ? (
                          <a
                            href={stop.menuUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 font-bold flex items-center gap-1 hover:bg-emerald-900"
                          >
                            <span>📜 View Official Menu</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : stop.category === "food" || stop.category === "cafe" ? (
                          <span className="px-2.5 py-1 rounded-lg bg-[#14201A] text-[#8FA699] border border-[#22342A] text-[11px] italic">
                            Menu not published online
                          </span>
                        ) : null}

                        {stop.phone ? (
                          <a
                            href={`tel:${stop.phone}`}
                            className="px-2.5 py-1 rounded-lg bg-[#14201A] text-[#C59B47] border border-[#22342A] font-bold flex items-center gap-1 hover:text-white"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{stop.phone}</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-[#6D8578] font-mono">
                            Phone unavailable
                          </span>
                        )}

                        <span className="text-[#52B788] font-bold ml-auto">
                          ≈ ₹{stop.approxCostPerPerson}/person
                        </span>
                      </div>

                      {/* Explorer Local Hack Note */}
                      <div className="p-3 rounded-xl bg-[#0E1612] border border-[#1E2D24] text-xs font-mono text-[#D1DFD7] flex items-start gap-2">
                        <span className="text-[#D95327] font-bold shrink-0">💡</span>
                        <span><strong>Explorer Note:</strong> {stop.localTip}</span>
                      </div>

                      {/* Direction CTA */}
                      <div className="pt-2 flex items-center gap-2">
                        <a
                          href={stop.lat && stop.lng ? `https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-1.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#FAF4E8] text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm"
                        >
                          <MapPin className="w-3.5 h-3.5 text-[#B49252]" />
                          <span>Get Directions</span>
                        </a>
                      </div>
                    </div>

                    <div className="lg:col-span-4 relative h-40 sm:h-48 w-full rounded-2xl overflow-hidden border border-[#22342A]">
                      <VanvasImage
                        src={stop.imageUrl || activePlan.heroImage || "/artworks/fallback_valley.jpg"}
                        alt={stop.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-mono text-white">
                        {stop.locationName}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* SUNSET RETURN MARKER MILESTONE */}
              <div className="relative">
                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full bg-[#B65E3C] border-2 border-[#F27E59] flex items-center justify-center text-xs">
                  🌇
                </div>
                <div className="p-5 rounded-3xl bg-gradient-to-r from-[#2A1C12] via-[#1B140F] to-[#0E1612] border-2 border-[#D95327]/60 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#D95327] text-white text-[10px] font-bold uppercase">
                      SUNSET RETURN MARKER
                    </span>
                    <span className="text-[#C59B47] font-bold">GOLDEN HOUR DEPARTURE</span>
                  </div>
                  <h4 className="text-base font-serif font-bold text-white">
                    Sunset Observation &amp; Begin Safe Drive Home
                  </h4>
                  <p className="text-[#D8DED5]/90 font-serif leading-relaxed">
                    Capture the last golden light across the hills / highway, enjoy evening kulhad chai, and begin the drive back before dark to meet your deadline.
                  </p>
                </div>
              </div>

              {/* SAFE RETURN HOME MILESTONE */}
              <div className="relative">
                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full bg-[#173B32] border-2 border-[#52B788] flex items-center justify-center text-xs">
                  🏡
                </div>
                <div className="p-4 rounded-2xl bg-[#0E1612] border border-[#1E2D24] flex items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <strong className="text-white">{calculatedReturnHomeTime}</strong>
                    <span className="text-[#8FA699]">• Safe Arrival Home in {activeOriginLabel}</span>
                  </div>
                  <span className="text-emerald-400 font-bold">MISSION COMPLETE</span>
                </div>
              </div>
            </div>

            {/* Student Budget Hacks */}
            {activePlan.studentHacks && activePlan.studentHacks.length > 0 && (
              <div className="p-6 rounded-3xl bg-[#18261F] border border-[#2D4539] space-y-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#C59B47] flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#D95327]" />
                  <span>EXPEDITION MONEY SAVERS &amp; LOCAL SHORTCUTS</span>
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

        {/* TAB 2: INTERACTIVE ROUTE MAP */}
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
                  type: poi.category === "fuel" ? "fuel" : poi.category === "pharmacy" ? "pharmacy" : poi.category === "dhaba" ? "dhaba" : poi.category === "temple" ? "temple" : "viewpoint",
                  lat: poi.lat || (28.4 + (idx * 0.08)),
                  lng: poi.lng || (77.1 + (idx * 0.08)),
                  description: `${poi.highwayOrLandmark} • ${poi.note}`,
                  categoryLabel: poi.category.toUpperCase(),
                  provenance: poi.provenance,
                  actionLabel: "Inspect POI"
                }))
              ];

              const routeSegments: VanvasMapRouteSegment[] = [
                {
                  id: `one-day-route-${activePlan.id}`,
                  name: activePlan.title,
                  coordinates: activePlan.stops.map((s, idx) => ({ lat: s.lat || 28.5 + (idx * 0.1), lng: s.lng || 77.2 + (idx * 0.1) })),
                  color: "#D95327",
                  distanceKm: activePlan.totalDistanceKm
                }
              ];

              return (
                <VanvasMap
                  mode="one-day"
                  title={`${activePlan.title} — Route Cockpit`}
                  subtitle={`From ${activePlan.originCity} to ${activePlan.destinationArea} • ${activePlan.totalDistanceKm} km round trip`}
                  center={{ lat: activePlan.stops[0]?.lat || 28.6, lng: activePlan.stops[0]?.lng || 77.2 }}
                  markers={mapMarkers}
                  routes={routeSegments}
                  height={540}
                />
              );
            })()}
          </div>
        )}

        {/* TAB 3: VEHICLE RENTALS (SEPARATED BIKE VS SCOOTER) */}
        {activeTab === "RENTALS" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#23352B] pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#C59B47] font-bold">
                  VERIFIED MOBILITY OPERATORS
                </span>
                <h3 className="text-xl sm:text-2xl font-serif font-black text-white">
                  Bike &amp; Scooter Rental Discovery
                </h3>
              </div>

              {/* Bike vs Scooter Toggle */}
              <div className="flex items-center gap-1.5 bg-[#0E1612] p-1 rounded-2xl border border-[#23352B] text-xs font-mono">
                <button
                  onClick={() => setRentalVehicleTypeFilter("ALL")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    rentalVehicleTypeFilter === "ALL" ? "bg-[#D95327] text-white" : "text-[#8FA699] hover:text-white"
                  }`}
                >
                  All Fleet
                </button>
                <button
                  onClick={() => setRentalVehicleTypeFilter("BIKE")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    rentalVehicleTypeFilter === "BIKE" ? "bg-[#D95327] text-white" : "text-[#8FA699] hover:text-white"
                  }`}
                >
                  🏍️ Bike Rental
                </button>
                <button
                  onClick={() => setRentalVehicleTypeFilter("SCOOTER")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    rentalVehicleTypeFilter === "SCOOTER" ? "bg-[#D95327] text-white" : "text-[#8FA699] hover:text-white"
                  }`}
                >
                  🛵 Scooter Rental
                </button>
              </div>
            </div>

            {filteredRentals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredRentals.map((rental, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-3xl bg-[#14201A] border border-[#2D4539] flex flex-col justify-between space-y-4 shadow-md"
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

                      {/* Pricing Specs */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#23352B] text-[11px] font-mono">
                        <div className="p-2.5 rounded-xl bg-[#0E1612] border border-[#1E2D24]">
                          <span className="block text-[8px] uppercase text-[#6D8578]">Daily Rate</span>
                          <span className="text-[#52B788] font-bold text-base">
                            {rental.approxRatePerDay ? `₹${rental.approxRatePerDay.toLocaleString()} / ${rental.pricingUnit}` : "Price on enquiry"}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#0E1612] border border-[#1E2D24]">
                          <span className="block text-[8px] uppercase text-[#6D8578]">Security Deposit</span>
                          <span className="text-white font-bold">
                            {rental.securityDeposit ? `₹${rental.securityDeposit.toLocaleString()} (Refundable)` : "Deposit on enquiry"}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs font-serif text-[#9EB5A9] space-y-1 pt-1">
                        <p><strong>Required Docs:</strong> {rental.requiredDocuments.join(", ")}</p>
                        <p><strong>Booking Tip:</strong> {rental.contactOrBookingTip}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#23352B] flex flex-wrap items-center gap-2">
                      {rental.phone ? (
                        <a
                          href={`tel:${rental.phone}`}
                          className="flex-1 py-2.5 rounded-xl bg-[#D95327] hover:bg-[#C24319] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call ({rental.phone})</span>
                        </a>
                      ) : (
                        <div className="flex-1 py-2.5 rounded-xl bg-[#1B2C24] text-[#C59B47] text-xs font-mono text-center">
                          Phone unavailable
                        </div>
                      )}

                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rental.providerName + " " + rental.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-[#1B2C24] hover:bg-[#253D30] text-[#FAF4E8] text-xs font-mono font-bold flex items-center gap-1.5 border border-[#3A5646]"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#C59B47]" />
                        <span>Directions</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-3xl bg-[#14201A] border border-[#2D4539] text-center space-y-2">
                <Bike className="w-8 h-8 text-[#D95327] mx-auto opacity-70" />
                <h4 className="font-serif font-bold text-base text-white">No verified rentals found nearby</h4>
                <p className="text-xs text-[#8FA699] max-w-md mx-auto">
                  No verified {rentalVehicleTypeFilter === "BIKE" ? "bike" : rentalVehicleTypeFilter === "SCOOTER" ? "scooter" : ""} rental operators registered in this immediate corridor. Private vehicle or standard highway transit recommended.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: WHAT TO CARRY CHECKLIST */}
        {activeTab === "CHECKLIST" && (
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#14201A] border border-[#2D4539] space-y-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#23352B] pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#C59B47] font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#52B788]" />
                    <span>EXPEDITION FIELD CHECKLIST</span>
                  </span>
                  <h3 className="text-xl sm:text-2xl font-serif font-black text-white">
                    Packing Board for {activePlan.destinationArea}
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#8FA699]">
                  Tag items as Have, Buy, Borrow, Rent or Skip
                </span>
              </div>

              {/* Checklist Items Table */}
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

        {/* TAB 5: GROUP COMPROMISE */}
        {activeTab === "COMPROMISE" && (
          <div className="p-6 sm:p-8 rounded-3xl bg-[#14201A] border border-[#2D4539] space-y-6 shadow-2xl">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C59B47] font-bold">
                FRIENDS DISAGREEMENT RESOLVER
              </span>
              <h3 className="text-2xl font-serif font-black text-white">
                Group Voting &amp; VANVAS Compromise Engine
              </h3>
              <p className="text-xs text-[#9EB5A9] font-serif">
                Friend A wants Forts, Friend B wants Dhabas, Friend C wants Nature? VANVAS computes the optimal compromise.
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
                Winner route chosen: <strong>{activePlan.title}</strong> — balances highway dhaba stops with scenic highlights and sunset timing so everyone in the group is satisfied!
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 6. FULL OPEN TRIP MODAL DIALOG */}
      {tripModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#121E18] border-2 border-[#D95327] shadow-2xl p-6 sm:p-8 space-y-6 text-[#EFE5D2]">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#23352B] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#D95327] text-white text-[10px] font-mono font-bold uppercase">
                    DAY ESCAPE PASS
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-[#1B2C24] text-[#C59B47] text-[10px] font-mono uppercase border border-[#C59B47]/40">
                    {activePlan.totalDistanceKm} KM ROUND TRIP
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-serif font-black text-white">
                  {activePlan.title}
                </h3>
                <p className="font-devanagari text-sm text-[#C59B47]">
                  {activePlan.hindiTitle}
                </p>
              </div>

              <button
                onClick={() => setTripModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#1A2C23] hover:bg-[#253D30] text-[#9EB5A9] hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-2xl bg-[#0E1612] border border-[#1E2D24]">
                <span className="block text-[9px] uppercase text-[#6D8578]">Origin → Destination</span>
                <span className="text-white font-bold">{activePlan.originCity} → {activePlan.destinationArea}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0E1612] border border-[#1E2D24]">
                <span className="block text-[9px] uppercase text-[#6D8578]">Timeline</span>
                <span className="text-white font-bold">{departureTime} – {returnDeadline}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0E1612] border border-[#1E2D24]">
                <span className="block text-[9px] uppercase text-[#6D8578]">Driving Time</span>
                <span className="text-[#D95327] font-bold">{activePlan.totalTravelTime}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0E1612] border border-[#1E2D24]">
                <span className="block text-[9px] uppercase text-[#6D8578]">Cost Split</span>
                <span className="text-[#52B788] font-bold">₹{costPerPerson}/person ({groupSize} friends)</span>
              </div>
            </div>

            {/* Stops Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase text-[#C59B47] font-bold tracking-wider">
                Full Road Stop Schedule ({adaptedStops.length} Milestones)
              </h4>
              <div className="space-y-3">
                {adaptedStops.map((stop) => (
                  <div key={stop.id} className="p-4 rounded-2xl bg-[#0E1612] border border-[#1E2D24] flex items-start gap-4">
                    <span className="w-6 h-6 rounded-full bg-[#D95327] text-white text-[11px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {stop.order}
                    </span>
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="text-sm font-serif text-white">{stop.name}</strong>
                        <span className="text-xs font-mono text-[#C59B47]">{stop.timeSlot}</span>
                      </div>
                      <p className="text-xs text-[#9EB5A9] font-serif">{stop.description}</p>
                      <div className="text-[11px] font-mono text-[#52B788]">
                        💡 {stop.localTip}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-[#23352B] flex flex-wrap items-center justify-end gap-3">
              <button
                onClick={() => handleGetDirections(activePlan)}
                className="px-4 py-2.5 rounded-xl bg-[#14201A] hover:bg-[#1E3027] text-[#52B788] text-xs font-mono font-bold uppercase flex items-center gap-1.5 border border-[#2D4539] transition-colors cursor-pointer"
              >
                <Navigation2 className="w-3.5 h-3.5" />
                <span>Get GPS Directions</span>
              </button>

              <button
                onClick={() => {
                  setTripModalOpen(false);
                  handlePlanThisTrip(activePlan);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#D95327] hover:bg-[#C24319] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Customize in Trip Planner</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OneDayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0C1410] flex items-center justify-center text-white font-mono text-xs">
        Loading Day Escape Cockpit...
      </div>
    }>
      <OneDayPlannerInner />
    </Suspense>
  );
}
