"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Navigation, Compass, Fuel, Clock, MapPin, Users,
  Sparkles, ArrowRight, ArrowLeft, BedDouble, Coffee, Check,
  ShieldCheck, AlertCircle, Share2, Plus, Calendar,
  ChevronDown, ChevronUp, Mountain, Car, Utensils,
  Landmark, Trees, Waves, Eye, ShoppingBag, Loader2,
  RefreshCw, DollarSign, X, ExternalLink, Navigation2,
  ChevronRight, ArrowUpRight, Flame, ShieldAlert, Sparkle,
  Layers, Filter, Info, Phone
} from "lucide-react";
import { api } from "@/lib/api";
import {
  RoadTripPlanResponse, RoadTripCorridor, RoadTripStop, RoadTripLeg, RoadTripDay
} from "@/types";
import { TravelStamp } from "@/components/ui/TravelStamp";
import { useDensity } from "@/context/DensityContext";
import { useAskVanvas } from "@/context/AskVanvasContext";

// Dynamic import of Leaflet-based RoadTripMap to ensure client-side rendering
const RoadTripMap = dynamic(() => import("@/components/map/RoadTripMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[380px] bg-[#173B32] rounded-3xl flex flex-col items-center justify-center text-[#EFE5D2] gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-[#B49252]" />
      <span className="text-xs font-mono tracking-wider uppercase text-[#D8DED5]">Loading Route Map...</span>
    </div>
  ),
});

function RoadTripCockpit() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isCompact } = useDensity();
  const { openAskVanvas, setTravelContext } = useAskVanvas();

  // Progressive Step State: 1 to 7, plus Review (8) & Result View
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [origin, setOrigin] = useState<string>("Delhi");
  const [destination, setDestination] = useState<string>("Manali");
  const [startDate, setStartDate] = useState<string>(() => {
    const today = new Date();
    const day = today.getDay();
    const daysUntilSat = (6 - day + 7) % 7 || 7;
    const sat = new Date();
    sat.setDate(today.getDate() + daysUntilSat);
    return sat.toISOString().split("T")[0];
  });
  const [travellersCount, setTravellersCount] = useState<number>(4);
  const [companionType, setCompanionType] = useState<string>("Friends");
  const [vehicleType, setVehicleType] = useState<string>("SUV");
  const [tripStyle, setTripStyle] = useState<string>("Balanced");
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([
    "Food",
    "Nature",
    "Scenic Roads",
  ]);

  // Custom search inputs
  const [originSearch, setOriginSearch] = useState("");
  const [destSearch, setDestSearch] = useState("");

  // Results state
  const [corridors, setCorridors] = useState<RoadTripCorridor[]>([]);
  const [plan, setPlan] = useState<RoadTripPlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedDayTab, setSelectedDayTab] = useState<number>(1);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<string | null>(null);

  // Map & Checkpoint Interactive state
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("all");
  const [selectedStop, setSelectedStop] = useState<RoadTripStop | null>(null);
  const [addedStopIds, setAddedStopIds] = useState<Set<string>>(new Set());
  const [showBudgetBreakdown, setShowBudgetBreakdown] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Load popular corridors on mount and handle query params
  useEffect(() => {
    api.getRoadTripCorridors()
      .then(setCorridors)
      .catch(() => {});

    const urlOrigin = searchParams?.get("origin");
    const urlDest = searchParams?.get("dest") || searchParams?.get("destination");
    if (urlOrigin && urlDest) {
      setOrigin(urlOrigin);
      setDestination(urlDest);
      setLoading(true);
      api.planRoadTrip({
        origin: urlOrigin,
        destination: urlDest,
        travellers_count: 4,
        vehicle_type: "SUV",
        trip_style: "Balanced",
        start_date: startDate,
        preferences: ["Food", "Nature", "Scenic Roads"],
      })
        .then((resp) => {
          setPlan(resp);
          setSelectedDayTab(1);
        })
        .catch((err) => {
          setErrorState(err.message || "Failed to calculate road trip route.");
        })
        .finally(() => setLoading(false));
    }
  }, [searchParams]);

  // Sync Road Trip context to Ask VANVAS
  useEffect(() => {
    setTravelContext({
      type: "road_trip",
      title: `ASK VANVAS · ${origin.toUpperCase()} → ${destination.toUpperCase()}`,
      subtitle: plan
        ? `Road Trip · ${plan.total_distance_km} km · ${plan.total_driving_time_hours} hrs · ${plan.recommended_stops?.length || 0} stops`
        : `Road Trip Route · ${origin} to ${destination}`,
      roadTripData: {
        origin,
        destination,
        distanceKm: plan?.total_distance_km,
        durationHours: plan?.total_driving_time_hours,
        stops: plan?.recommended_stops,
      },
    });
  }, [origin, destination, plan, setTravelContext]);

  // Initialize added stops when plan loads
  useEffect(() => {
    if (plan?.recommended_stops) {
      // By default, first 2 stops of each day are marked as added
      const initialAdded = new Set<string>();
      plan.days.forEach((day) => {
        day.stops.slice(0, 2).forEach((s) => initialAdded.add(s.id));
      });
      setAddedStopIds(initialAdded);
    }
  }, [plan]);

  // Step Handlers
  const handleSelectOrigin = (city: string) => {
    setOrigin(city);
    setTimeout(() => setCurrentStep(2), 150);
  };

  const handleSelectDestination = (city: string) => {
    setDestination(city);
    setTimeout(() => setCurrentStep(3), 150);
  };

  const handleSelectTiming = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    setStartDate(d.toISOString().split("T")[0]);
    setTimeout(() => setCurrentStep(4), 150);
  };

  const handleSelectCompanions = (type: string, count: number) => {
    setCompanionType(type);
    setTravellersCount(count);
    setTimeout(() => setCurrentStep(5), 150);
  };

  const handleSelectVehicle = (vehicle: string) => {
    setVehicleType(vehicle);
    setTimeout(() => setCurrentStep(6), 150);
  };

  const handleSelectPace = (pace: string) => {
    setTripStyle(pace);
    setTimeout(() => setCurrentStep(7), 150);
  };

  const handleTogglePriority = (p: string) => {
    if (selectedPriorities.includes(p)) {
      if (selectedPriorities.length > 1) {
        setSelectedPriorities(selectedPriorities.filter((item) => item !== p));
      }
    } else {
      setSelectedPriorities([...selectedPriorities, p]);
    }
  };

  // Select pre-curated corridor directly
  const handleSelectCorridor = (c: RoadTripCorridor) => {
    setOrigin(c.origin);
    setDestination(c.destination);
    setLoading(true);
    setErrorState(null);
    api.planRoadTrip({
      origin: c.origin,
      destination: c.destination,
      travellers_count: travellersCount,
      vehicle_type: vehicleType,
      trip_style: tripStyle,
      start_date: startDate,
      preferences: selectedPriorities,
    })
      .then((resp) => {
        setPlan(resp);
        setSelectedDayTab(1);
      })
      .catch((err) => {
        setErrorState(err.message || "Failed to calculate corridor route.");
      })
      .finally(() => setLoading(false));
  };

  // Execute Road Trip Plan
  const handleBuildRoadTrip = async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const resp = await api.planRoadTrip({
        origin: origin.trim(),
        destination: destination.trim(),
        travellers_count: travellersCount,
        vehicle_type: vehicleType,
        trip_style: tripStyle,
        start_date: startDate,
        preferences: selectedPriorities,
      });
      setPlan(resp);
      setSelectedDayTab(1);
    } catch (err: any) {
      const errMsg = err?.message || "Route temporarily unavailable.";
      setErrorState(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Save Road Trip to database
  const handleSaveTrip = async () => {
    if (!plan || saving) return;
    setSaving(true);
    try {
      const savedTrip = await api.saveRoadTrip({
        origin: plan.origin,
        destination: plan.destination,
        travellers_count: travellersCount,
        vehicle_type: vehicleType,
        trip_style: tripStyle,
        start_date: plan.start_date,
        budget_inr: plan.budget_estimate.total_estimated,
        preferences: selectedPriorities,
      });
      setNotificationMsg(`Road trip saved! Opening ${savedTrip.title}...`);
      setTimeout(() => {
        router.push(`/trips/${savedTrip.id}`);
      }, 1000);
    } catch (err: any) {
      setNotificationMsg(err?.message || "Please log in to save this road trip to your journeys.");
      setTimeout(() => setNotificationMsg(null), 4000);
      setSaving(false);
    }
  };

  // Toggle stop added state
  const handleToggleStop = (stop: RoadTripStop, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAddedStopIds((prev) => {
      const next = new Set(prev);
      if (next.has(stop.id)) {
        next.delete(stop.id);
        setNotificationMsg(`Removed ${stop.name} from Day ${selectedDayTab}`);
      } else {
        next.add(stop.id);
        setNotificationMsg(`✓ Added ${stop.name} to Day ${selectedDayTab}`);
      }
      return next;
    });
    setTimeout(() => setNotificationMsg(null), 2500);
  };

  // Helper: icon resolver
  const getStopCategoryIcon = (category?: string, type?: string) => {
    const key = (category || type || "").toLowerCase();
    if (key.includes("food") || key.includes("dhaba")) return <Utensils className="w-3.5 h-3.5 text-[#B65E3C]" />;
    if (key.includes("cafe")) return <Coffee className="w-3.5 h-3.5 text-[#B49252]" />;
    if (key.includes("fort") || key.includes("heritage") || key.includes("monument")) return <Landmark className="w-3.5 h-3.5 text-[#8C6D37]" />;
    if (key.includes("lake") || key.includes("waterfall")) return <Waves className="w-3.5 h-3.5 text-[#2A9D8F]" />;
    if (key.includes("viewpoint")) return <Eye className="w-3.5 h-3.5 text-[#52B788]" />;
    if (key.includes("nature")) return <Trees className="w-3.5 h-3.5 text-[#2D6A4F]" />;
    if (key.includes("fuel")) return <Fuel className="w-3.5 h-3.5 text-[#E63946]" />;
    if (key.includes("stay") || key.includes("hotel")) return <BedDouble className="w-3.5 h-3.5 text-[#1D3557]" />;
    return <Compass className="w-3.5 h-3.5 text-[#173B32]" />;
  };

  // Active Day object
  const currentDay = useMemo(() => {
    if (!plan) return null;
    return plan.days.find((d) => d.day_number === selectedDayTab) || plan.days[0];
  }, [plan, selectedDayTab]);

  // Filtered stops for the active day
  const activeDayStops = useMemo(() => {
    if (!currentDay) return [];
    if (activeCategoryFilter === "all") return currentDay.stops;
    return currentDay.stops.filter((s) => {
      const cat = (s.category || s.type || "").toLowerCase();
      if (activeCategoryFilter === "food") return cat.includes("food") || cat.includes("dhaba") || cat.includes("cafe");
      if (activeCategoryFilter === "fuel") return cat.includes("fuel") || cat.includes("petrol");
      if (activeCategoryFilter === "stay") return cat.includes("stay") || cat.includes("hotel") || cat.includes("camp");
      if (activeCategoryFilter === "explore") return cat.includes("heritage") || cat.includes("fort") || cat.includes("view") || cat.includes("nature");
      if (activeCategoryFilter === "activities") return cat.includes("activity") || cat.includes("adventure") || cat.includes("trek");
      return true;
    });
  }, [currentDay, activeCategoryFilter]);

  // Suggestion: Next Best Action stop (highest recommended stop not yet added, or first stop)
  const nextBestStop = useMemo(() => {
    if (!currentDay || currentDay.stops.length === 0) return null;
    const unadded = currentDay.stops.find((s) => !addedStopIds.has(s.id));
    return unadded || currentDay.stops[0];
  }, [currentDay, addedStopIds]);

  // Halts data for map
  const mapHalts = useMemo(() => {
    if (!plan) return [];
    return plan.days.slice(0, -1).map((d) => {
      const lastStop = d.stops[d.stops.length - 1];
      return {
        name: d.destination,
        lat: lastStop ? lastStop.lat : 0,
        lng: lastStop ? lastStop.lng : 0,
        day: d.day_number,
      };
    }).filter((h) => h.lat !== 0 && h.lng !== 0);
  }, [plan]);

  // Origin & destination coordinates for map
  const mapOrigin = useMemo(() => {
    if (!plan || plan.route_geometry.length === 0) return { name: origin, lat: 28.6139, lng: 77.2090 };
    return { name: plan.origin, lat: plan.route_geometry[0][0], lng: plan.route_geometry[0][1] };
  }, [plan, origin]);

  const mapDestination = useMemo(() => {
    if (!plan || plan.route_geometry.length === 0) return { name: destination, lat: 32.2432, lng: 77.1892 };
    const lastPt = plan.route_geometry[plan.route_geometry.length - 1];
    return { name: plan.destination, lat: lastPt[0], lng: lastPt[1] };
  }, [plan, destination]);

  // Active leg geometry (slice from overall route or day geometry)
  const activeLegGeometry = useMemo(() => {
    if (!plan || !currentDay) return undefined;
    if (currentDay.geometry && currentDay.geometry.length > 0) return currentDay.geometry;
    if (plan.route_geometry.length > 0) {
      const totalPoints = plan.route_geometry.length;
      const numDays = Math.max(1, plan.days.length);
      const startIdx = Math.floor(((selectedDayTab - 1) / numDays) * totalPoints);
      const endIdx = Math.floor((selectedDayTab / numDays) * totalPoints);
      return plan.route_geometry.slice(startIdx, Math.min(totalPoints, endIdx + 1));
    }
    return undefined;
  }, [plan, currentDay, selectedDayTab]);

  // Dynamic budget calculation based on added stops and traveller count
  const calculatedBudget = useMemo(() => {
    if (!plan) return { total: 0, perPerson: 0, fuel: 0, stay: 0, food: 0, activities: 0, tolls: 0 };
    const fuel = plan.fuel_breakdown.estimated_fuel_cost_inr || 0;
    const tolls = plan.budget_estimate.tolls_estimated || 0;
    const stay = plan.budget_estimate.stay_estimated || 0;
    const food = plan.budget_estimate.food_estimated || 0;
    
    // Add extra cost for custom added stops
    let extraActivitiesCost = 0;
    if (plan.recommended_stops) {
      plan.recommended_stops.forEach((s) => {
        if (addedStopIds.has(s.id) && s.approx_cost) {
          extraActivitiesCost += s.approx_cost * travellersCount;
        }
      });
    }
    const activities = (plan.budget_estimate.activities_estimated || 0) + extraActivitiesCost;
    const total = fuel + tolls + stay + food + activities;
    const perPerson = Math.round(total / Math.max(1, travellersCount));
    return { total, perPerson, fuel, stay, food, activities, tolls };
  }, [plan, addedStopIds, travellersCount]);

  // Category counts
  const categoryCounts = useMemo(() => {
    if (!currentDay) return { all: 0, food: 0, fuel: 0, stay: 0, explore: 0, activities: 0 };
    const counts = { all: currentDay.stops.length, food: 0, fuel: 0, stay: 0, explore: 0, activities: 0 };
    currentDay.stops.forEach((s) => {
      const cat = (s.category || s.type || "").toLowerCase();
      if (cat.includes("food") || cat.includes("dhaba") || cat.includes("cafe")) counts.food++;
      if (cat.includes("fuel") || cat.includes("petrol")) counts.fuel++;
      if (cat.includes("stay") || cat.includes("hotel") || cat.includes("camp")) counts.stay++;
      if (cat.includes("heritage") || cat.includes("fort") || cat.includes("view") || cat.includes("nature")) counts.explore++;
      if (cat.includes("activity") || cat.includes("adventure") || cat.includes("trek")) counts.activities++;
    });
    return counts;
  }, [currentDay]);

  return (
    <div className="min-h-screen bg-[#EFE5D2] text-[#20211D] pb-24 selection:bg-[#B65E3C] selection:text-[#FAF4E8]">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-[#173B32] text-[#EFE5D2] px-5 py-2.5 rounded-2xl shadow-2xl text-xs font-semibold border-2 border-[#B49252] flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-4 h-4 text-[#B49252]" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW A: INTERACTIVE VISUAL ROAD TRIP COCKPIT             */}
      {/* ======================================================== */}
      {plan ? (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* 1. COMPACT JOURNEY HEADER */}
          <header className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-3xl p-4 sm:p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-[#B65E3C] bg-[#B65E3C]/10 px-2.5 py-0.5 rounded-md border border-[#B65E3C]/30">
                  {plan.corridor_name || "HIGHWAY CORRIDOR"}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase bg-emerald-800 text-emerald-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>OSRM Verified Route</span>
                </span>
                <span className="text-[10px] font-mono text-[#7B4D36] font-semibold">
                  • {plan.vehicle_type} • {plan.trip_style}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black text-[#173B32] tracking-tight">
                {plan.origin.toUpperCase()} <span className="text-[#B65E3C]">→</span> {plan.destination.toUpperCase()}
              </h1>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono font-bold text-[#7B4D36]">
                <span className="text-[#173B32] font-black">{plan.total_distance_km} KM</span>
                <span>•</span>
                <span>{Math.floor(plan.total_driving_time_hours)}h {Math.round((plan.total_driving_time_hours % 1) * 60)}m driving</span>
                <span>•</span>
                <span>{plan.days.length} DAYS</span>
                <span>•</span>
                <span>{travellersCount} TRAVELLERS</span>
              </div>
            </div>

            {/* Primary Actions & Toolbar */}
            <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
              <button
                type="button"
                onClick={() => setPlan(null)}
                className="px-4 py-2.5 rounded-xl bg-white border-2 border-[#E5D5BA] hover:bg-[#EFE5D2] hover:border-[#173B32] text-[#173B32] font-bold text-xs cursor-pointer transition-colors shadow-2xs"
              >
                Replan
              </button>

              <button
                type="button"
                onClick={handleSaveTrip}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#FAF4E8] font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer flex items-center gap-1.5 transition-all transform active:scale-98"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#B49252]" />
                <span>{saving ? "Saving..." : "Save Trip"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `${plan.origin} to ${plan.destination} Road Trip`,
                      text: `${plan.total_distance_km} km Road Trip on VANVAS`,
                      url: window.location.href,
                    }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    setNotificationMsg("Route link copied to clipboard!");
                    setTimeout(() => setNotificationMsg(null), 2500);
                  }
                }}
                className="p-2.5 rounded-xl bg-white border-2 border-[#E5D5BA] hover:bg-[#EFE5D2] text-[#173B32] cursor-pointer shadow-2xs"
                title="Share Route"
              >
                <Share2 className="w-4 h-4 text-[#7B4D36]" />
              </button>
            </div>
          </header>

          {/* 2. MAP-FIRST MAIN GRID LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT 7 COLS: LARGE INTERACTIVE MAP & CHECKPOINTS RAIL */}
            <div className="lg:col-span-7 space-y-4">
              {/* Primary Visual Element: Interactive Map */}
              <div className="w-full h-[380px] sm:h-[460px] lg:h-[500px] relative rounded-3xl overflow-hidden shadow-xl border-2 border-[#E5D5BA]">
                <RoadTripMap
                  routeGeometry={plan.route_geometry}
                  activeLegGeometry={activeLegGeometry}
                  origin={mapOrigin}
                  destination={mapDestination}
                  halts={mapHalts}
                  stops={plan.recommended_stops}
                  addedStopIds={addedStopIds}
                  selectedStopId={selectedStop?.id || null}
                  onSelectStop={(poi) => {
                    if (poi?.rawStop) {
                      setSelectedStop(poi.rawStop);
                    } else if (poi) {
                      const found = plan.recommended_stops.find((s) => s.id === poi.id);
                      if (found) setSelectedStop(found);
                    }
                  }}
                  selectedDay={selectedDayTab}
                  activeCategoryFilter={activeCategoryFilter}
                  height="100%"
                />
              </div>

              {/* Stop Category Filter Chips */}
              <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
                <div className="flex items-center gap-1.5 shrink-0">
                  {[
                    { id: "all", label: "All Stops", count: categoryCounts.all },
                    { id: "food", label: "Food & Dhabas", count: categoryCounts.food },
                    { id: "fuel", label: "Fuel", count: categoryCounts.fuel },
                    { id: "stay", label: "Stays", count: categoryCounts.stay },
                    { id: "explore", label: "Heritage & Views", count: categoryCounts.explore },
                    { id: "activities", label: "Activities", count: categoryCounts.activities },
                  ].map((chip) => {
                    const isActive = activeCategoryFilter === chip.id;
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => setActiveCategoryFilter(chip.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
                          isActive
                            ? "bg-[#173B32] text-[#FAF4E8] border-[#173B32] shadow-sm scale-102"
                            : "bg-[#FAF7F0] text-[#7B4D36] border-[#E5D5BA] hover:bg-white hover:border-[#173B32]"
                        }`}
                      >
                        <span>{chip.label}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                            isActive ? "bg-[#B49252] text-[#173B32]" : "bg-[#E5D5BA] text-[#173B32]"
                          }`}
                        >
                          {chip.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Checkpoints Strip / Horizontal Carousel */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-black text-sm text-[#173B32] flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-[#B65E3C]" />
                    <span>Along Day {selectedDayTab} Route ({activeDayStops.length} Checkpoints)</span>
                  </h3>
                  <span className="text-[10px] font-mono text-[#7B4D36]">
                    Tap card to preview marker on map
                  </span>
                </div>

                {activeDayStops.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                    {activeDayStops.map((stop) => {
                      const isAdded = addedStopIds.has(stop.id);
                      const isSelected = selectedStop?.id === stop.id;

                      return (
                        <div
                          key={stop.id}
                          onClick={() => setSelectedStop(stop)}
                          className={`p-3.5 rounded-2xl transition-all cursor-pointer border-2 flex flex-col justify-between gap-2 shadow-2xs ${
                            isSelected
                              ? "bg-[#FAF7F0] border-[#B65E3C] shadow-md ring-2 ring-[#B65E3C]/20"
                              : isAdded
                              ? "bg-white border-emerald-300 hover:border-[#173B32]"
                              : "bg-white border-[#E5D5BA] hover:border-[#173B32]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-[#EFE5D2] flex items-center justify-center shrink-0 mt-0.5">
                                {getStopCategoryIcon(stop.category, stop.type)}
                              </div>
                              <div>
                                <h4 className="font-serif font-bold text-xs text-[#173B32] line-clamp-1">
                                  {stop.name}
                                </h4>
                                <span className="text-[9px] font-mono uppercase text-[#7B4D36] block">
                                  {stop.type} {stop.detour_km ? `• +${stop.detour_km} km detour` : `• ${stop.time_needed_mins}m halt`}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => handleToggleStop(stop, e)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase cursor-pointer transition-all shrink-0 ${
                                isAdded
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200"
                                  : "bg-[#173B32] text-[#FAF4E8] hover:bg-[#20453B]"
                              }`}
                            >
                              {isAdded ? "✓ Added" : "+ Add"}
                            </button>
                          </div>

                          <p className="text-[11px] text-[#7B4D36] line-clamp-1 italic">
                            {stop.why_stop}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-[#FAF7F0] border-2 border-[#E5D5BA] text-center text-xs text-[#7B4D36] font-mono">
                    No stops in this category for Day {selectedDayTab}.
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT 5 COLS: JOURNEY PROGRESS, DAY SWITCHER, LEG SUMMARY & BUDGET */}
            <div className="lg:col-span-5 space-y-4">
              {/* A. Current Position & Journey Progress Indicator */}
              <div className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-3xl p-4 sm:p-5 space-y-3 shadow-md">
                <div className="flex items-center justify-between text-xs font-mono font-bold">
                  <span className="text-[#173B32]">{plan.origin.toUpperCase()}</span>
                  <span className="text-[#B65E3C] px-2 py-0.5 rounded-full bg-[#B65E3C]/10 border border-[#B65E3C]/20">
                    DAY {selectedDayTab} OF {plan.days.length}
                  </span>
                  <span className="text-[#173B32]">{plan.destination.toUpperCase()}</span>
                </div>

                {/* Progress Bar with Stops Nodes */}
                <div className="relative w-full h-3 bg-[#E5D5BA] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-[#173B32] via-[#B65E3C] to-[#B49252] transition-all duration-500 rounded-full"
                    style={{
                      width: `${(selectedDayTab / plan.days.length) * 100}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-[#7B4D36]">
                  <span>Leg {selectedDayTab}: {currentDay?.driving_distance_km} km</span>
                  <span>~{currentDay?.driving_time_hours.toFixed(1)}h road time</span>
                </div>
              </div>

              {/* B. Clean Journey Day Switcher */}
              <div className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-3xl p-4 sm:p-5 space-y-3 shadow-md">
                <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C]">
                    JOURNEY TIMELINE
                  </span>
                  <span className="text-[10px] font-mono text-[#7B4D36]">
                    Select day to focus map
                  </span>
                </div>

                <div className="space-y-2">
                  {plan.days.map((day) => {
                    const isSelected = selectedDayTab === day.day_number;
                    return (
                      <button
                        key={day.day_number}
                        type="button"
                        onClick={() => {
                          setSelectedDayTab(day.day_number);
                          setSelectedStop(null);
                        }}
                        className={`w-full p-3 rounded-2xl text-left transition-all cursor-pointer border-2 flex items-center justify-between ${
                          isSelected
                            ? "bg-[#173B32] text-[#FAF4E8] border-[#173B32] shadow-md scale-101"
                            : "bg-white text-[#173B32] border-[#E5D5BA] hover:bg-[#EFE5D2]"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                                isSelected ? "bg-[#B49252] text-[#173B32]" : "bg-[#EFE5D2] text-[#7B4D36]"
                              }`}
                            >
                              DAY {day.day_number}
                            </span>
                            <span className="font-serif font-bold text-xs sm:text-sm line-clamp-1">
                              {day.origin} → {day.destination}
                            </span>
                          </div>
                          <p className={`text-[10px] font-mono ${isSelected ? "text-[#D8DED5]" : "text-[#7B4D36]"}`}>
                            {day.driving_distance_km} km • ~{day.driving_time_hours.toFixed(1)}h drive • {day.stops.length} stops
                          </p>
                        </div>

                        <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? "text-[#B49252]" : "text-[#7B4D36]"}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* C. "Next Best Action" Contextual Suggestion Banner */}
              {nextBestStop && (
                <div className="bg-linear-to-r from-[#FAF7F0] to-[#EFE5D2] border-2 border-[#B49252]/60 rounded-3xl p-4 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#B49252]" />
                      <span>RECOMMENDED STOP</span>
                    </span>
                    <span className="text-[9px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                      {nextBestStop.detour_km ? `+${nextBestStop.detour_km} km` : "On route"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-serif font-black text-sm text-[#173B32]">
                        {nextBestStop.name}
                      </h4>
                      <p className="text-[11px] text-[#7B4D36] line-clamp-1">
                        {nextBestStop.why_stop}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleStop(nextBestStop)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase cursor-pointer transition-all shrink-0 ${
                        addedStopIds.has(nextBestStop.id)
                          ? "bg-emerald-800 text-emerald-100"
                          : "bg-[#B65E3C] hover:bg-[#9E4D2E] text-white shadow-xs"
                      }`}
                    >
                      {addedStopIds.has(nextBestStop.id) ? "✓ Added" : "+ Add Stop"}
                    </button>
                  </div>
                </div>
              )}

              {/* D. Route Warnings / Highway Rest Advice */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-2.5 text-xs font-mono">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-[11px] uppercase tracking-wider text-amber-900">
                    HIGHWAY ADVISORY
                  </strong>
                  <span className="text-[11px] text-amber-800">
                    Day {selectedDayTab} covers {currentDay?.driving_distance_km} km. Fuel up before mountain ascents &amp; plan a dhaba break every 2.5 hours.
                  </span>
                </div>
              </div>

              {/* E. Visual Trip Budget with Dynamic Travellers Split */}
              <div className="bg-[#173B32] text-[#EFE5D2] rounded-3xl p-5 space-y-4 border-2 border-[#243E36] shadow-xl">
                <div className="flex items-center justify-between border-b border-[#243E36] pb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-[#B49252]">
                      TRIP BUDGET
                    </span>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-xl sm:text-2xl font-serif font-black text-[#FAF4E8]">
                        ₹{calculatedBudget.perPerson.toLocaleString()}
                      </h3>
                      <span className="text-xs font-mono text-[#D8DED5]">/ person</span>
                    </div>
                  </div>

                  {/* Dynamic Travellers Counter */}
                  <div className="text-right">
                    <span className="text-[9px] font-mono uppercase text-[#D8DED5] block">
                      TRAVELLERS
                    </span>
                    <div className="flex items-center gap-2 mt-0.5 bg-[#0F2924] px-2.5 py-1 rounded-xl border border-[#243E36]">
                      <button
                        type="button"
                        onClick={() => setTravellersCount((prev) => Math.max(1, prev - 1))}
                        className="text-xs font-bold text-[#FAF4E8] hover:text-[#B49252] cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-xs font-mono font-bold text-[#B49252]">
                        {travellersCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => setTravellersCount((prev) => Math.min(12, prev + 1))}
                        className="text-xs font-bold text-[#FAF4E8] hover:text-[#B49252] cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Proportional Multi-Color Budget Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-2.5 bg-[#0F2924] rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${(calculatedBudget.fuel / calculatedBudget.total) * 100}%` }}
                      className="bg-amber-500 h-full"
                      title={`Fuel: ₹${calculatedBudget.fuel}`}
                    />
                    <div
                      style={{ width: `${(calculatedBudget.stay / calculatedBudget.total) * 100}%` }}
                      className="bg-indigo-400 h-full"
                      title={`Stays: ₹${calculatedBudget.stay}`}
                    />
                    <div
                      style={{ width: `${(calculatedBudget.food / calculatedBudget.total) * 100}%` }}
                      className="bg-[#B65E3C] h-full"
                      title={`Food: ₹${calculatedBudget.food}`}
                    />
                    <div
                      style={{ width: `${(calculatedBudget.activities / calculatedBudget.total) * 100}%` }}
                      className="bg-emerald-400 h-full"
                      title={`Activities: ₹${calculatedBudget.activities}`}
                    />
                    <div
                      style={{ width: `${(calculatedBudget.tolls / calculatedBudget.total) * 100}%` }}
                      className="bg-teal-400 h-full"
                      title={`Tolls: ₹${calculatedBudget.tolls}`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-[#D8DED5]">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Fuel
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-indigo-400" /> Stays
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#B65E3C]" /> Food
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" /> Activities
                    </span>
                  </div>
                </div>

                {/* Expandable Breakdown Accordion */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowBudgetBreakdown(!showBudgetBreakdown)}
                    className="w-full py-1.5 flex items-center justify-between text-xs font-mono text-[#B49252] hover:underline cursor-pointer"
                  >
                    <span>{showBudgetBreakdown ? "Hide itemized breakdown" : "View itemized breakdown"}</span>
                    {showBudgetBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showBudgetBreakdown && (
                    <div className="space-y-1.5 pt-2 border-t border-[#243E36] text-xs font-mono text-[#D8DED5] animate-in fade-in duration-200">
                      <div className="flex justify-between">
                        <span>Fuel Estimate ({plan.fuel_breakdown.assumed_mileage_kpl} km/l)</span>
                        <span>₹{calculatedBudget.fuel.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Overnight Stays ({plan.days.length} Nights)</span>
                        <span>₹{calculatedBudget.stay.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Highway Food &amp; Dhabas</span>
                        <span>₹{calculatedBudget.food.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Activities &amp; Parking</span>
                        <span>₹{calculatedBudget.activities.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fastag Tolls</span>
                        <span>₹{calculatedBudget.tolls.toLocaleString()}</span>
                      </div>
                      <div className="pt-2 border-t border-[#243E36] flex justify-between font-bold text-[#FAF4E8]">
                        <span>Total Trip Cost</span>
                        <span>₹{calculatedBudget.total.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 3. INTERACTIVE STOP DETAIL MODAL / DRAWER (WHEN A MARKER IS CLICKED) */}
          {selectedStop && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
              <div className="w-full max-w-lg bg-[#FAF7F0] border-2 border-[#173B32] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-start justify-between gap-3 border-b border-[#E5D5BA] pb-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-[#EFE5D2] text-[#7B4D36] text-[9px] font-mono uppercase font-bold">
                        {selectedStop.type}
                      </span>
                      {selectedStop.detour_km ? (
                        <span className="text-[9px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                          +{selectedStop.detour_km} km detour
                        </span>
                      ) : null}
                    </div>
                    <h3 className="font-serif font-black text-xl text-[#173B32]">
                      {selectedStop.name}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedStop(null)}
                    className="w-8 h-8 rounded-full bg-[#EFE5D2] hover:bg-[#E5D5BA] text-[#173B32] flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-[#7B4D36] font-serif leading-relaxed">
                  {selectedStop.why_stop}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono p-3 bg-white rounded-2xl border border-[#E5D5BA]">
                  <div>
                    <span className="text-[10px] text-[#7B4D36] block">STOP DURATION</span>
                    <strong className="text-[#173B32]">~{selectedStop.time_needed_mins} mins</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7B4D36] block">ENTRY / EXPENSE</span>
                    <strong className="text-[#173B32]">
                      {selectedStop.approx_cost > 0 ? `₹${selectedStop.approx_cost}` : "Free"}
                    </strong>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStop(selectedStop)}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 transition-colors ${
                      addedStopIds.has(selectedStop.id)
                        ? "bg-emerald-800 hover:bg-emerald-900 text-white"
                        : "bg-[#B65E3C] hover:bg-[#9E4D2E] text-white"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{addedStopIds.has(selectedStop.id) ? "In Itinerary (Remove)" : "Add to Day Trip"}</span>
                  </button>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedStop.lat},${selectedStop.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-4 rounded-xl bg-white border-2 border-[#E5D5BA] hover:bg-[#EFE5D2] text-[#173B32] text-xs font-mono font-bold uppercase flex items-center gap-1.5"
                  >
                    <Navigation2 className="w-3.5 h-3.5 text-[#B65E3C]" />
                    <span>Directions</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      openAskVanvas(undefined, `Tell me more about ${selectedStop.name} on the road trip from ${plan.origin} to ${plan.destination}`);
                      setSelectedStop(null);
                    }}
                    className="py-3 px-3 rounded-xl bg-white border-2 border-[#E5D5BA] hover:bg-[#EFE5D2] text-[#B49252]"
                    title="Ask VANVAS"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ======================================================== */
        /* VIEW B: PROGRESSIVE 1-QUESTION-AT-A-TIME FLOW            */
        /* ======================================================== */
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Loading Indicator */}
          {loading && (
            <div className="fixed inset-0 z-50 bg-[#0F2924]/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-[#EFE5D2] animate-in fade-in duration-200">
              <div className="w-14 h-14 rounded-2xl bg-[#B65E3C] flex items-center justify-center shadow-2xl mb-4">
                <Navigation className="w-7 h-7 text-[#FAF4E8] animate-spin" />
              </div>
              <h3 className="font-serif font-black text-2xl text-[#FAF4E8] mb-2">
                Plotting Highway Corridor: {origin} → {destination}
              </h3>
              <p className="text-xs sm:text-sm font-mono text-[#D8DED5] animate-pulse">
                Fetching real OSRM road geometry, highway stops &amp; fuel stops...
              </p>
            </div>
          )}

          {/* Popular Corridors Quick Access */}
          {currentStep === 1 && corridors.length > 0 && (
            <div className="mb-5 space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7B4D36]">
                Popular Road Corridors:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {corridors.slice(0, 4).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCorridor(c)}
                    className="p-3 rounded-2xl bg-white hover:bg-[#FAF7F0] border-2 border-[#E5D5BA] hover:border-[#B65E3C] text-left transition-all cursor-pointer shadow-2xs"
                  >
                    <span className="text-[9px] font-mono font-bold text-[#B65E3C] uppercase block">
                      {c.origin} → {c.destination}
                    </span>
                    <h4 className="font-serif font-bold text-xs text-[#173B32]">
                      {c.title}
                    </h4>
                  </button>
                ))}
              </div>
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
                    ROAD TRIP EXPEDITION
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#173B32]">
                  {currentStep <= 7 ? `0${currentStep} / 07` : "REVIEW"}
                </span>
                <div className="w-16 sm:w-24 bg-[#E5D5BA] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#173B32] h-full transition-all duration-300 rounded-full"
                    style={{ width: `${(Math.min(currentStep, 7) / 7) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Step 1: Origin */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C] tracking-wider block">
                    ROAD TRIP • 01 / 07
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32] mt-1">
                    Where are you starting?
                  </h2>
                  <p className="text-xs text-[#7B4D36] mt-0.5">
                    Select your departure city or hub.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {["Delhi", "Mumbai", "Bengaluru", "Chandigarh", "Jaipur", "Pune"].map((city) => {
                    const isSelected = origin.toLowerCase() === city.toLowerCase();
                    return (
                      <button
                        key={city}
                        type="button"
                        onClick={() => handleSelectOrigin(city)}
                        className={`p-3.5 rounded-2xl text-xs font-bold text-center transition-all cursor-pointer border-2 ${
                          isSelected
                            ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-md scale-102"
                            : "bg-white text-[#173B32] border-[#E5D5BA] hover:bg-[#EFE5D2] hover:border-[#173B32]"
                        }`}
                      >
                        {city}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1 flex gap-2">
                  <input
                    type="text"
                    value={originSearch}
                    onChange={(e) => setOriginSearch(e.target.value)}
                    placeholder="Or enter other starting city..."
                    className="flex-1 px-3 py-2 bg-white border-2 border-[#E5D5BA] rounded-xl text-xs font-medium text-[#20211D] focus:outline-none focus:border-[#173B32]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (originSearch.trim()) handleSelectOrigin(originSearch.trim());
                    }}
                    className="px-4 py-2 bg-[#173B32] text-[#EFE5D2] font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Select
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Destination */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C] tracking-wider block">
                    ROAD TRIP • 02 / 07
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32] mt-1">
                    Where are you heading?
                  </h2>
                  <p className="text-xs text-[#7B4D36] mt-0.5">
                    Starting from <strong className="text-[#173B32]">{origin}</strong>.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {["Manali", "Goa", "Udaipur", "Spiti", "Agra", "Jaipur"].map((city) => {
                    const isSelected = destination.toLowerCase() === city.toLowerCase();
                    return (
                      <button
                        key={city}
                        type="button"
                        onClick={() => handleSelectDestination(city)}
                        className={`p-3.5 rounded-2xl text-xs font-bold text-center transition-all cursor-pointer border-2 ${
                          isSelected
                            ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-md scale-102"
                            : "bg-white text-[#173B32] border-[#E5D5BA] hover:bg-[#EFE5D2] hover:border-[#173B32]"
                        }`}
                      >
                        {city}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1 flex gap-2">
                  <input
                    type="text"
                    value={destSearch}
                    onChange={(e) => setDestSearch(e.target.value)}
                    placeholder="Or enter destination city..."
                    className="flex-1 px-3 py-2 bg-white border-2 border-[#E5D5BA] rounded-xl text-xs font-medium text-[#20211D] focus:outline-none focus:border-[#173B32]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (destSearch.trim()) handleSelectDestination(destSearch.trim());
                    }}
                    className="px-4 py-2 bg-[#173B32] text-[#EFE5D2] font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Select
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Departure Timing */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C] tracking-wider block">
                    ROAD TRIP • 03 / 07
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32] mt-1">
                    When is departure?
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { days: 2, label: "This Weekend", desc: "Start upcoming weekend" },
                    { days: 7, label: "Next Week", desc: "In 7 days" },
                    { days: 20, label: "Next Month", desc: "In ~3 weeks" },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => handleSelectTiming(opt.days)}
                      className="p-4 rounded-2xl bg-white hover:bg-[#EFE5D2] border-2 border-[#E5D5BA] hover:border-[#173B32] text-left transition-all cursor-pointer shadow-xs"
                    >
                      <div className="font-serif font-bold text-sm text-[#173B32]">{opt.label}</div>
                      <div className="text-[10px] text-[#7B4D36] mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#E5D5BA]">
                  <label className="block text-xs font-mono font-bold uppercase text-[#7B4D36] mb-1.5">
                    Or pick exact date:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={startDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="flex-1 p-2.5 bg-white border-2 border-[#E5D5BA] rounded-xl text-xs font-bold text-[#173B32] focus:outline-none focus:border-[#173B32]"
                    />
                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="px-4 py-2.5 rounded-xl bg-[#173B32] text-[#EFE5D2] font-bold text-xs uppercase cursor-pointer"
                    >
                      Continue →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Companions */}
            {currentStep === 4 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C] tracking-wider block">
                    ROAD TRIP • 04 / 07
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32] mt-1">
                    Who&apos;s on board?
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { type: "Solo", label: "Solo Ride", count: 1, desc: "Fast pacing & freedom" },
                    { type: "Couple", label: "Partner", count: 2, desc: "Scenic routes & slow dhabas" },
                    { type: "Friends", label: "Friends Squad", count: 4, desc: "Shared fuel & adventure" },
                    { type: "Family", label: "Family Road Trip", count: 4, desc: "Comfortable halts & safe hours" },
                  ].map((c) => (
                    <button
                      key={c.type}
                      type="button"
                      onClick={() => handleSelectCompanions(c.type, c.count)}
                      className={`p-4 rounded-2xl text-left transition-all cursor-pointer border-2 ${
                        companionType === c.type
                          ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-md scale-102"
                          : "bg-white text-[#173B32] border-[#E5D5BA] hover:bg-[#EFE5D2]"
                      }`}
                    >
                      <div className="font-serif font-bold text-base">{c.label}</div>
                      <div className="text-[10px] opacity-80 mt-0.5">{c.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Vehicle */}
            {currentStep === 5 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C] tracking-wider block">
                    ROAD TRIP • 05 / 07
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32] mt-1">
                    What are you driving?
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: "Car", label: "Personal Car / Sedan", desc: "Petrol / Diesel / EV (~15 km/l)" },
                    { id: "SUV", label: "SUV / 4x4", desc: "High clearance for ghats (~12 km/l)" },
                    { id: "Bike", label: "Motorcycle / Touring Bike", desc: "Single/pillion touring (~32 km/l)" },
                    { id: "Rental", label: "Self-Drive Rental", desc: "Zoomcar / Revv / Myles" },
                  ].map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleSelectVehicle(v.id)}
                      className={`p-4 rounded-2xl text-left transition-all cursor-pointer border-2 ${
                        vehicleType === v.id
                          ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-md scale-102"
                          : "bg-white text-[#173B32] border-[#E5D5BA] hover:bg-[#EFE5D2]"
                      }`}
                    >
                      <div className="font-serif font-bold text-base">{v.label}</div>
                      <div className="text-[10px] opacity-80 mt-0.5">{v.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 6: Trip Pace */}
            {currentStep === 6 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C] tracking-wider block">
                    ROAD TRIP • 06 / 07
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32] mt-1">
                    What kind of road trip?
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: "Fast", label: "Fast & Direct", desc: "Expressways, minimal detours & quick halts" },
                    { id: "Balanced", label: "Balanced Journey", desc: "Optimal mix of scenic bypasses & dhabas" },
                    { id: "Explore", label: "Deep Exploration", desc: "Heritage stepwells, forts & rural detours" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPace(p.id)}
                      className={`p-4 rounded-2xl text-left transition-all cursor-pointer border-2 ${
                        tripStyle === p.id
                          ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-md scale-102"
                          : "bg-white text-[#173B32] border-[#E5D5BA] hover:bg-[#EFE5D2]"
                      }`}
                    >
                      <div className="font-serif font-bold text-base">{p.label}</div>
                      <div className="text-[10px] opacity-80 mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 7: Priorities */}
            {currentStep === 7 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C] tracking-wider block">
                    ROAD TRIP • 07 / 07
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32] mt-1">
                    What matters most?
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { name: "Food", desc: "Iconic dhabas & chai" },
                    { name: "Nature", desc: "Rivers, waterfalls & ridges" },
                    { name: "Heritage", desc: "Forts & ancient architecture" },
                    { name: "Scenic Roads", desc: "Panoramic passes & views" },
                    { name: "Nightlife", desc: "Evening hubs & halts" },
                    { name: "Local Culture", desc: "Bazaars & handicrafts" },
                  ].map((p) => {
                    const isSelected = selectedPriorities.includes(p.name);
                    return (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => handleTogglePriority(p.name)}
                        className={`p-3 rounded-2xl text-left transition-all cursor-pointer border-2 ${
                          isSelected
                            ? "bg-[#B65E3C] text-[#EFE5D2] border-[#B65E3C] shadow-sm"
                            : "bg-white text-[#173B32] border-[#E5D5BA] hover:bg-[#EFE5D2]"
                        }`}
                      >
                        <div className="font-serif font-bold text-xs flex items-center justify-between">
                          <span>{p.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#FAF4E8]" />}
                        </div>
                        <div className="text-[10px] opacity-80 mt-0.5 line-clamp-1">{p.desc}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-[#E5D5BA] flex justify-end">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(8)}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <span>Review Corridor →</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 8: Review & Build */}
            {currentStep === 8 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C] tracking-wider block">
                    ROAD TRIP REVIEW
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32] mt-1">
                    Ready to hit the road?
                  </h2>
                </div>

                <div className="p-5 rounded-2xl bg-[#EFE5D2] border-2 border-[#173B32] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-2">
                    <div>
                      <span className="text-[9px] font-mono uppercase text-[#7B4D36] font-bold">ROUTE CORRIDOR</span>
                      <h3 className="font-serif font-black text-2xl text-[#173B32]">
                        {origin} → {destination}
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                      {vehicleType} • {tripStyle}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-[#7B4D36] block text-[10px]">DEPARTURE</span>
                      <strong className="text-[#173B32]">{startDate}</strong>
                    </div>
                    <div>
                      <span className="text-[#7B4D36] block text-[10px]">TRAVELLERS</span>
                      <strong className="text-[#173B32]">{travellersCount} ({companionType})</strong>
                    </div>
                    <div>
                      <span className="text-[#7B4D36] block text-[10px]">VEHICLE</span>
                      <strong className="text-[#173B32]">{vehicleType}</strong>
                    </div>
                  </div>

                  <div className="pt-1 text-[11px] text-[#7B4D36]">
                    <strong>Priorities:</strong> {selectedPriorities.join(" • ")}
                  </div>
                </div>

                {errorState && (
                  <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-800">
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>ROUTE TEMPORARILY UNAVAILABLE</span>
                    </div>
                    <p className="text-xs font-mono text-amber-800">{errorState}</p>
                    <button
                      type="button"
                      onClick={handleBuildRoadTrip}
                      disabled={loading}
                      className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-amber-50 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                      <span>Retry</span>
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleBuildRoadTrip}
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#FAF4E8] font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-xl transition-all transform active:scale-98 cursor-pointer"
                >
                  <Navigation className="w-4 h-4 text-[#FAF4E8]" />
                  <span>Build Road Trip →</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RoadTripPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#EFE5D2] flex items-center justify-center text-[#173B32]">
          <Loader2 className="w-8 h-8 animate-spin text-[#B65E3C]" />
        </div>
      }
    >
      <RoadTripCockpit />
    </Suspense>
  );
}
