"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Navigation, Compass, Fuel, Clock, MapPin, Users,
  Sparkles, ArrowRight, ArrowLeft, BedDouble, Coffee, Check,
  ShieldCheck, AlertCircle, Share2, Plus, Calendar,
  ChevronDown, ChevronUp, Mountain, Car, Utensils,
  Landmark, Trees, Waves, Eye, ShoppingBag, Loader2,
  RefreshCw, DollarSign
} from "lucide-react";
import { api } from "@/lib/api";
import {
  RoadTripPlanResponse, RoadTripCorridor, RoadTripStop, RoadTripLeg, RoadTripDay
} from "@/types";
import { TravelStamp } from "@/components/ui/TravelStamp";
import { useDensity } from "@/context/DensityContext";

function RoadTripCockpit() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isCompact } = useDensity();

  // Progressive Step State: 1 to 7, plus Review (8) & Result View
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [origin, setOrigin] = useState<string>("Delhi");
  const [destination, setDestination] = useState<string>("Goa");
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
  const [vehicleType, setVehicleType] = useState<string>("Car");
  const [tripStyle, setTripStyle] = useState<string>("Balanced");
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>(["Food", "Nature", "Scenic Roads"]);

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
  const [showAllStops, setShowAllStops] = useState(false);

  // Load popular corridors
  useEffect(() => {
    api.getRoadTripCorridors()
      .then(setCorridors)
      .catch(() => {});
  }, []);

  // Step 1: Origin selection (Auto-advance)
  const handleSelectOrigin = (city: string) => {
    setOrigin(city);
    setTimeout(() => setCurrentStep(2), 150);
  };

  // Step 2: Destination selection (Auto-advance)
  const handleSelectDestination = (city: string) => {
    setDestination(city);
    setTimeout(() => setCurrentStep(3), 150);
  };

  // Step 3: Timing (Auto-advance)
  const handleSelectTiming = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    setStartDate(d.toISOString().split("T")[0]);
    setTimeout(() => setCurrentStep(4), 150);
  };

  // Step 4: Companions (Auto-advance)
  const handleSelectCompanions = (type: string, count: number) => {
    setCompanionType(type);
    setTravellersCount(count);
    setTimeout(() => setCurrentStep(5), 150);
  };

  // Step 5: Vehicle (Auto-advance)
  const handleSelectVehicle = (vehicle: string) => {
    setVehicleType(vehicle);
    setTimeout(() => setCurrentStep(6), 150);
  };

  // Step 6: Trip Pace (Auto-advance)
  const handleSelectPace = (pace: string) => {
    setTripStyle(pace);
    setTimeout(() => setCurrentStep(7), 150);
  };

  // Step 7: Priorities toggle
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
        alert(err.message || "Failed to calculate corridor route.");
      })
      .finally(() => setLoading(false));
  };

  // Execute Road Trip Plan
  const handleBuildRoadTrip = async () => {
    setLoading(true);
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
      alert(err.message || "Failed to calculate road route. Please verify your locations.");
    } finally {
      setLoading(false);
    }
  };

  // Save Road Trip
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
      alert(err?.message || "Please log in to save this road trip to your journeys.");
      setSaving(false);
    }
  };

  const getStopIcon = (category?: string, type?: string) => {
    const key = (category || type || "").toLowerCase();
    if (key.includes("food") || key.includes("dhaba")) return <Utensils className="w-3.5 h-3.5 text-[#B65E3C]" />;
    if (key.includes("cafe")) return <Coffee className="w-3.5 h-3.5 text-[#B49252]" />;
    if (key.includes("fort") || key.includes("heritage") || key.includes("monument")) return <Landmark className="w-3.5 h-3.5 text-[#8C6D37]" />;
    if (key.includes("lake") || key.includes("waterfall")) return <Waves className="w-3.5 h-3.5 text-[#2A9D8F]" />;
    if (key.includes("viewpoint")) return <Eye className="w-3.5 h-3.5 text-[#52B788]" />;
    if (key.includes("nature")) return <Trees className="w-3.5 h-3.5 text-[#2D6A4F]" />;
    if (key.includes("fuel")) return <Fuel className="w-3.5 h-3.5 text-[#E63946]" />;
    return <Compass className="w-3.5 h-3.5 text-[#173B32]" />;
  };

  return (
    <div className="min-h-screen bg-[#EFE5D2] pb-32">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-[#173B32] text-[#EFE5D2] px-6 py-3 rounded-2xl shadow-2xl text-xs font-semibold border-2 border-[#B49252] flex items-center gap-2 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-[#B49252]" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW A: ROAD TRIP RESULTS & HIGHWAY COCKPIT VIEW         */}
      {/* ======================================================== */}
      {plan ? (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn">
          {/* Top Bar with Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-3xl p-5 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C]">
                  {plan.corridor_name || "HIGHWAY CORRIDOR"}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                    plan.is_live_route
                      ? "bg-emerald-800 text-emerald-100"
                      : "bg-[#7B4D36] text-[#EFE5D2]"
                  }`}
                >
                  {plan.is_live_route ? "LIVE ROUTE (OSRM)" : "ESTIMATED ROUTE"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32] mt-0.5">
                {plan.origin} → {plan.destination}
              </h1>
              <p className="text-xs font-mono text-[#7B4D36] mt-0.5">
                {plan.total_distance_km} km • {Math.floor(plan.total_driving_time_hours)}h {Math.round((plan.total_driving_time_hours % 1) * 60)}m driving • {plan.days.length} Days • {plan.vehicle_type}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPlan(null)}
                className="px-4 py-2.5 rounded-xl bg-white border border-[#E5D5BA] hover:bg-[#EFE5D2] text-[#173B32] font-bold text-xs cursor-pointer"
              >
                Replan
              </button>
              <button
                type="button"
                onClick={handleSaveTrip}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#B49252]" />
                <span>{saving ? "Saving..." : "Save Trip"}</span>
              </button>
            </div>
          </div>

          {/* Day Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {plan.days.map((day) => (
              <button
                key={day.day_number}
                type="button"
                onClick={() => setSelectedDayTab(day.day_number)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                  selectedDayTab === day.day_number
                    ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-sm"
                    : "bg-[#FAF7F0] text-[#7B4D36] border-[#E5D5BA] hover:bg-white"
                }`}
              >
                Day {day.day_number}: {day.origin} → {day.destination} ({day.driving_distance_km} km)
              </button>
            ))}
          </div>

          {/* Active Day Content */}
          {(() => {
            const currentDay = plan.days.find((d) => d.day_number === selectedDayTab) || plan.days[0];
            if (!currentDay) return null;

            const stopsToShow = showAllStops ? currentDay.stops : currentDay.stops.slice(0, 3);

            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Route Timeline & Along-The-Way Stops */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Highway Leg Header */}
                  <div className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-3xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C]">
                          DAY {currentDay.day_number} HIGHWAY LEG
                        </span>
                        <h2 className="font-serif font-black text-xl text-[#173B32]">
                          {currentDay.title}
                        </h2>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-[#173B32]">
                          {currentDay.driving_distance_km} km
                        </span>
                        <span className="text-[10px] font-mono text-[#7B4D36] block">
                          ~{currentDay.driving_time_hours.toFixed(1)}h road time
                        </span>
                      </div>
                    </div>

                    {/* Along The Way Stops (1-3 recommended with Detour info) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-serif font-bold text-sm text-[#173B32] flex items-center gap-1.5">
                          <Compass className="w-4 h-4 text-[#B65E3C]" />
                          <span>Along the Way • Recommended Stops</span>
                        </h3>
                        {currentDay.stops.length > 3 && (
                          <button
                            type="button"
                            onClick={() => setShowAllStops(!showAllStops)}
                            className="text-xs font-mono font-bold text-[#B65E3C] hover:underline cursor-pointer"
                          >
                            {showAllStops ? "Show less" : `View all (${currentDay.stops.length})`}
                          </button>
                        )}
                      </div>

                      <div className="space-y-2.5">
                        {stopsToShow.map((stop) => (
                          <div
                            key={stop.id}
                            className="p-3.5 rounded-2xl bg-white border border-[#E5D5BA] hover:border-[#173B32] transition-colors flex items-start justify-between gap-3 shadow-2xs"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-xl bg-[#EFE5D2] flex items-center justify-center shrink-0 mt-0.5">
                                {getStopIcon(stop.category, stop.type)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-serif font-bold text-sm text-[#173B32]">
                                    {stop.name}
                                  </h4>
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#EFE5D2] text-[#7B4D36] uppercase font-bold">
                                    {stop.type}
                                  </span>
                                </div>
                                <p className="text-xs text-[#7B4D36] mt-0.5 line-clamp-2">
                                  {stop.why_stop}
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 block">
                                {stop.detour_km ? `+${stop.detour_km} km detour` : `${stop.time_needed_mins}m stop`}
                              </span>
                              <span className="text-[9px] font-mono text-[#7B4D36] mt-1 block">
                                {stop.approx_cost > 0 ? `₹${stop.approx_cost}` : "Free entry"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Food & Dhabas Along This Leg */}
                    {currentDay.food_options && currentDay.food_options.length > 0 && (
                      <div className="space-y-3 pt-3 border-t border-[#E5D5BA]">
                        <h3 className="font-serif font-bold text-sm text-[#173B32] flex items-center gap-1.5">
                          <Utensils className="w-4 h-4 text-[#B65E3C]" />
                          <span>Highway Food &amp; Dhabas</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {currentDay.food_options.slice(0, 2).map((food, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-2xl bg-white border border-[#E5D5BA] space-y-1 text-xs"
                            >
                              <div className="flex items-center justify-between font-serif font-bold text-[#173B32]">
                                <span>{food.name}</span>
                                <span className="text-[10px] font-mono text-[#B65E3C]">{food.price || "₹250/p"}</span>
                              </div>
                              <p className="text-[11px] text-[#7B4D36]">{food.why || food.specialty || food.type}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Col: Overnight Stays & Trip Budget */}
                <div className="space-y-6">
                  {/* Overnight Stays */}
                  <div className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-3xl p-5 space-y-3">
                    <h3 className="font-serif font-bold text-sm text-[#173B32] flex items-center gap-1.5">
                      <BedDouble className="w-4 h-4 text-[#B65E3C]" />
                      <span>Overnight Halt: {currentDay.destination}</span>
                    </h3>

                    {currentDay.stay_options && currentDay.stay_options.length > 0 ? (
                      <div className="space-y-2">
                        {currentDay.stay_options.slice(0, 2).map((hotel, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-2xl bg-white border border-[#E5D5BA] space-y-1 text-xs"
                          >
                            <div className="flex items-center justify-between font-serif font-bold text-[#173B32]">
                              <span>{hotel.name}</span>
                              <span className="font-mono text-[#B65E3C]">₹{hotel.price_per_night}/night</span>
                            </div>
                            <p className="text-[10px] text-[#7B4D36]">{hotel.address || hotel.badge || "Verified sanctuary stay"}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#7B4D36]">No verified stay required for this daytime segment.</p>
                    )}
                  </div>

                  {/* Budget Breakdown */}
                  <div className="bg-[#173B32] text-[#EFE5D2] rounded-3xl p-5 space-y-3 border-2 border-[#243E36]">
                    <div className="flex items-center justify-between border-b border-[#243E36] pb-2">
                      <span className="text-[10px] font-mono font-bold uppercase text-[#B49252]">
                        TRIP BUDGET
                      </span>
                      <span className="text-xs font-mono font-bold text-[#FAF4E8]">
                        ₹{plan.budget_estimate.total_estimated.toLocaleString()} TOTAL
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs font-mono">
                      <div className="flex items-center justify-between text-[#D8DED5]">
                        <span>Fuel Estimate</span>
                        <span>₹{plan.fuel_breakdown.estimated_fuel_cost_inr.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-[#D8DED5]">
                        <span>Highway Tolls</span>
                        <span>₹{plan.budget_estimate.tolls_estimated.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-[#D8DED5]">
                        <span>Stays &amp; Halts</span>
                        <span>₹{plan.budget_estimate.stay_estimated.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-[#D8DED5]">
                        <span>Food &amp; Dhabas</span>
                        <span>₹{plan.budget_estimate.food_estimated.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-[#D8DED5]">
                        <span>Activities &amp; Parking</span>
                        <span>₹{(plan.budget_estimate.activities_estimated + (plan.budget_estimate.parking_other_estimated || 0)).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#243E36] flex items-center justify-between">
                      <span className="text-xs text-[#D8DED5]">Cost Per Person:</span>
                      <strong className="text-base font-mono font-black text-[#B49252]">
                        ₹{plan.budget_estimate.per_person_estimated.toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        /* ======================================================== */
        /* VIEW B: PROGRESSIVE 1-QUESTION-AT-A-TIME FLOW            */
        /* ======================================================== */
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Loading Indicator */}
          {loading && (
            <div className="fixed inset-0 z-50 bg-[#0F2924]/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-[#EFE5D2] animate-fadeIn">
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

            {/* ======================================================== */}
            {/* 01 / 07: WHERE ARE YOU STARTING?                         */}
            {/* ======================================================== */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-fadeIn">
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

            {/* ======================================================== */}
            {/* 02 / 07: WHERE ARE YOU GOING?                            */}
            {/* ======================================================== */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-fadeIn">
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

            {/* ======================================================== */}
            {/* 03 / 07: WHEN?                                           */}
            {/* ======================================================== */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-fadeIn">
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

            {/* ======================================================== */}
            {/* 04 / 07: WHO'S COMING?                                   */}
            {/* ======================================================== */}
            {currentStep === 4 && (
              <div className="space-y-5 animate-fadeIn">
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

            {/* ======================================================== */}
            {/* 05 / 07: WHAT ARE YOU DRIVING?                           */}
            {/* ======================================================== */}
            {currentStep === 5 && (
              <div className="space-y-5 animate-fadeIn">
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

            {/* ======================================================== */}
            {/* 06 / 07: WHAT KIND OF ROAD TRIP?                         */}
            {/* ======================================================== */}
            {currentStep === 6 && (
              <div className="space-y-5 animate-fadeIn">
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

            {/* ======================================================== */}
            {/* 07 / 07: WHAT MATTERS MOST? (Multi-select)               */}
            {/* ======================================================== */}
            {currentStep === 7 && (
              <div className="space-y-5 animate-fadeIn">
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

            {/* ======================================================== */}
            {/* STEP 8: ROAD TRIP REVIEW                                 */}
            {/* ======================================================== */}
            {currentStep === 8 && (
              <div className="space-y-6 animate-fadeIn">
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

                <button
                  type="button"
                  onClick={handleBuildRoadTrip}
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-xl transition-all transform active:scale-95 cursor-pointer"
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
