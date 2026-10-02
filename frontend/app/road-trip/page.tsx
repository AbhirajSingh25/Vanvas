"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Navigation, Compass, Fuel, Clock, MapPin, Users,
  Sparkles, ArrowRight, BedDouble, Coffee, Check,
  ShieldCheck, AlertCircle, Share2, Plus, Calendar,
  ChevronDown, ChevronUp, Mountain, Car
} from "lucide-react";
import { api } from "@/lib/api";
import {
  RoadTripPlanRequest, RoadTripPlanResponse, RoadTripCorridor,
  RoadTripStop, RoadTripDay
} from "@/types";
import { DevanagariHeading } from "@/components/ui/DevanagariHeading";
import { TravelStamp } from "@/components/ui/TravelStamp";
import { useDensity } from "@/context/DensityContext";

export default function RoadTripPage() {
  const router = useRouter();
  const { isCompact } = useDensity();

  // Planning Form State
  const [origin, setOrigin] = useState("Delhi");
  const [destination, setDestination] = useState("Goa");
  const [travellersCount, setTravellersCount] = useState<number>(4);
  const [vehicleType, setVehicleType] = useState<string>("Car");
  const [tripStyle, setTripStyle] = useState<string>("Balanced");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [customBudget, setCustomBudget] = useState<string>("");
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>(["scenic", "food_focus"]);
  
  // Results & UI State
  const [corridors, setCorridors] = useState<RoadTripCorridor[]>([]);
  const [plan, setPlan] = useState<RoadTripPlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedDayTab, setSelectedDayTab] = useState<number>(1);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  useEffect(() => {
    api.getRoadTripCorridors()
      .then(setCorridors)
      .catch(() => {});
  }, []);

  const handleGeneratePlan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!origin.trim() || !destination.trim() || loading) return;

    setLoading(true);
    try {
      const resp = await api.planRoadTrip({
        origin: origin.trim(),
        destination: destination.trim(),
        travellers_count: travellersCount,
        vehicle_type: vehicleType,
        trip_style: tripStyle,
        start_date: startDate,
        budget_inr: customBudget ? parseFloat(customBudget) : undefined,
        preferences: selectedPrefs
      });
      setPlan(resp);
      setSelectedDayTab(1);
    } catch (err: any) {
      alert("Could not plan road trip. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCorridor = (corridor: RoadTripCorridor) => {
    setOrigin(corridor.origin);
    setDestination(corridor.destination);
    setLoading(true);
    api.planRoadTrip({
      origin: corridor.origin,
      destination: corridor.destination,
      travellers_count: travellersCount,
      vehicle_type: vehicleType,
      trip_style: tripStyle,
      start_date: startDate,
      preferences: selectedPrefs
    }).then((resp) => {
      setPlan(resp);
      setSelectedDayTab(1);
    }).finally(() => setLoading(false));
  };

  const handleSaveToMyTrips = async () => {
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
        preferences: selectedPrefs
      });
      setNotificationMsg(`Road trip saved! Opening ${savedTrip.title}...`);
      setTimeout(() => {
        router.push(`/trips/${savedTrip.id}`);
      }, 1200);
    } catch (err: any) {
      alert(err?.message || "Please login or register to save this road trip.");
      setSaving(false);
    }
  };

  const togglePref = (pref: string) => {
    if (selectedPrefs.includes(pref)) {
      setSelectedPrefs(selectedPrefs.filter((p) => p !== pref));
    } else {
      setSelectedPrefs([...selectedPrefs, pref]);
    }
  };

  return (
    <div className="min-h-screen bg-[#EFE5D2] pb-32">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-[#173B32] text-[#EFE5D2] px-6 py-3 rounded-2xl shadow-2xl text-xs font-semibold border-2 border-[#B49252] flex items-center gap-2 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-[#B49252]" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <section className="bg-[#173B32] text-[#EFE5D2] px-4 sm:px-6 lg:px-8 py-12 sm:py-16 border-b-2 border-[#E5D5BA]">
        <div className="max-w-7xl mx-auto space-y-4 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <TravelStamp label="VANVAS ROAD TRIP MODE" variant="terracotta" />
            <span className="text-xs font-mono text-[#B49252] tracking-wider uppercase">
              [ HIGHWAY CORRIDOR &amp; PROXIMITY STOPS ENGINE ]
            </span>
          </div>

          <div className="space-y-1">
            <span className="font-devanagari text-xl sm:text-2xl text-[#B49252] font-bold block">
              सड़क का सफ़र • Plan the road between two places
            </span>
            <h1 className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-[#FAF4E8]">
              Road Trip Expedition Cockpit
            </h1>
          </div>

          <p className="max-w-2xl text-xs sm:text-sm text-[#D8DED5]/90 font-light leading-relaxed">
            VANVAS plans the journey itself: highway routes, verified dhaba breakfasts, fort detours,
            transparent fuel consumption, overnight stays, and group split.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Curated Highway Corridors Pills */}
        {corridors.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7B4D36]">
              Popular Indian Highway Corridors:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {corridors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelectCorridor(c)}
                  className="p-3.5 rounded-2xl bg-[#FAF7F0] hover:bg-white border-2 border-[#E5D5BA] hover:border-[#173B32] text-left transition-all flex flex-col justify-between space-y-2 cursor-pointer shadow-2xs group"
                >
                  <div>
                    <span className="text-[9px] font-mono font-bold text-[#B65E3C] uppercase block">
                      {c.origin} → {c.destination}
                    </span>
                    <h4 className="font-serif font-bold text-sm text-[#173B32] group-hover:text-[#B65E3C] transition-colors">
                      {c.title}
                    </h4>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#7B4D36] pt-1 border-t border-[#E5D5BA]">
                    <span>{c.distance_km} km · {c.days_suggested} days</span>
                    <span className="text-[#B65E3C] font-bold">Plan →</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Interactive Road Trip Planner Form Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-xs space-y-6">
          <form onSubmit={handleGeneratePlan} className="space-y-5">
            {/* Origin & Destination Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10.5px] font-mono font-bold uppercase text-[#7B4D36] mb-1">
                  Starting Point (Origin)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#B65E3C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="e.g. Delhi, Bangalore, Mumbai, Chandigarh"
                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-[#E5D5BA] rounded-2xl text-sm font-bold text-[#173B32] focus:outline-none focus:border-[#173B32]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-mono font-bold uppercase text-[#7B4D36] mb-1">
                  Final Destination
                </label>
                <div className="relative">
                  <Navigation className="w-4 h-4 text-[#173B32] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Goa, Manali, Udaipur, Rishikesh, Spiti"
                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-[#E5D5BA] rounded-2xl text-sm font-bold text-[#173B32] focus:outline-none focus:border-[#173B32]"
                  />
                </div>
              </div>
            </div>

            {/* Travellers, Vehicle & Trip Style Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#E5D5BA]">
              {/* Travellers */}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-[#7B4D36] mb-1">
                  Travellers
                </label>
                <div className="grid grid-cols-5 gap-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setTravellersCount(num)}
                      className={`py-2 rounded-xl text-center font-bold text-xs transition-colors cursor-pointer border ${
                        travellersCount === num
                          ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32]"
                          : "bg-white text-[#7B4D36] border-[#E5D5BA] hover:bg-[#EFE5D2]"
                      }`}
                    >
                      {num === 5 ? "5+" : num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-[#7B4D36] mb-1">
                  Vehicle
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {["Car", "Bike", "SUV", "Rental"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVehicleType(v)}
                      className={`py-2 rounded-xl text-center font-bold text-xs transition-colors cursor-pointer border ${
                        vehicleType === v
                          ? "bg-[#B65E3C] text-[#EFE5D2] border-[#B65E3C]"
                          : "bg-white text-[#7B4D36] border-[#E5D5BA] hover:bg-[#EFE5D2]"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trip Style */}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-[#7B4D36] mb-1">
                  Driving Style
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {["Fast", "Balanced", "Explore"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setTripStyle(st)}
                      className={`py-2 rounded-xl text-center font-bold text-xs transition-colors cursor-pointer border ${
                        tripStyle === st
                          ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32]"
                          : "bg-white text-[#7B4D36] border-[#E5D5BA] hover:bg-[#EFE5D2]"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dates & Route Preferences */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E5D5BA]">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-[#7B4D36] mb-1">
                  Departure Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E5D5BA] text-xs font-mono font-bold text-[#173B32]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-[#7B4D36] mb-1">
                  Route Focus / Preferences
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "scenic", label: "Scenic Roads" },
                    { id: "food_focus", label: "Highway Dhabas" },
                    { id: "avoid_tolls", label: "Avoid Tolls" },
                    { id: "less_driving", label: "Shorter Daily Legs" },
                    { id: "adventure", label: "Ghats & Passes" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePref(p.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        selectedPrefs.includes(p.id)
                          ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32]"
                          : "bg-white text-[#7B4D36] border-[#E5D5BA] hover:bg-[#EFE5D2]"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Calculate Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Navigation className="w-4 h-4 text-[#B49252]" />
                <span>{loading ? "Calculating Highway Route & Detours..." : "Calculate Road Route & Discover Stops"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Plan Results Section */}
        {plan && (
          <div className="space-y-8 animate-fadeIn">
            {/* Expedition Summary Header Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#173B32] text-[#EFE5D2] shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10.5px] font-mono text-[#B49252] font-bold uppercase tracking-wider block">
                    {plan.corridor_name}
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-serif font-black text-[#FAF4E8] mt-1">
                    {plan.origin} → {plan.destination}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveToMyTrips}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-colors"
                  >
                    <Check className="w-4 h-4 text-[#B49252]" />
                    <span>{saving ? "Saving..." : "Save to My Trips & Open Ledger"}</span>
                  </button>
                </div>
              </div>

              {/* Road Metrics: Total km · Drive Time · Days · Travellers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10">
                  <span className="text-[9.5px] text-[#D8DED5]/70 uppercase block">Road Distance</span>
                  <strong className="text-base text-[#B49252] font-bold">{plan.total_distance_km.toLocaleString()} km</strong>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10">
                  <span className="text-[9.5px] text-[#D8DED5]/70 uppercase block">Total Drive Time</span>
                  <strong className="text-base text-[#FAF4E8] font-bold">{plan.total_driving_time_hours} Hours</strong>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10">
                  <span className="text-[9.5px] text-[#D8DED5]/70 uppercase block">Expedition Length</span>
                  <strong className="text-base text-[#FAF4E8] font-bold">{plan.num_days} Days ({plan.vehicle_type})</strong>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10">
                  <span className="text-[9.5px] text-[#D8DED5]/70 uppercase block">Cost Per Person</span>
                  <strong className="text-base text-emerald-300 font-bold">₹{Math.round(plan.budget_estimate.per_person_estimated).toLocaleString()}</strong>
                </div>
              </div>
            </div>

            {/* Fuel Calculator & Transparent Road Trip Budget Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fuel & Vehicle Consumption */}
              <div className="p-6 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-black text-lg text-[#173B32] flex items-center gap-2">
                    <Fuel className="w-5 h-5 text-[#B65E3C]" />
                    <span>Estimated Fuel Consumption</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-[#173B32] text-[#EFE5D2] text-[9px] font-mono font-bold uppercase">
                    ESTIMATED
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#E5D5BA] space-y-2">
                  <div className="text-2xl font-mono font-bold text-[#173B32]">
                    ₹{plan.fuel_breakdown.estimated_fuel_cost_inr.toLocaleString()}
                  </div>
                  <p className="text-xs text-[#7B4D36] font-mono leading-relaxed">
                    {plan.fuel_breakdown.calculation_text}
                  </p>
                </div>

                <div className="text-[11px] text-[#7B4D36] leading-relaxed font-light">
                  Calculation based on realistic Indian highway speeds, elevation shifts, and current fuel averages.
                </div>
              </div>

              {/* Complete Trip Budget Breakdown */}
              <div className="p-6 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-black text-lg text-[#173B32] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#B49252]" />
                    <span>Road Trip Budget Breakdown</span>
                  </h3>
                  <span className="font-mono font-bold text-sm text-[#173B32]">
                    Total: ₹{plan.budget_estimate.total_estimated.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E5D5BA]">
                    <span>Fuel (Estimated)</span>
                    <strong>₹{plan.budget_estimate.fuel_estimated.toLocaleString()}</strong>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E5D5BA]">
                    <span>Tolls &amp; Highway Fastag</span>
                    <strong>₹{plan.budget_estimate.tolls_estimated.toLocaleString()}</strong>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E5D5BA]">
                    <span>Overnight Stays ({plan.num_days - 1} nights)</span>
                    <strong>₹{plan.budget_estimate.stay_estimated.toLocaleString()}</strong>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E5D5BA]">
                    <span>Food &amp; Highway Dhabas</span>
                    <strong>₹{plan.budget_estimate.food_estimated.toLocaleString()}</strong>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E5D5BA]">
                    <span>Activities &amp; Sightseeing</span>
                    <strong>₹{plan.budget_estimate.activities_estimated.toLocaleString()}</strong>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#EFE5D2] text-xs font-bold text-[#173B32] flex items-center justify-between font-mono">
                  <span>{plan.budget_estimate.travellers_count} Travellers</span>
                  <span className="text-[#B65E3C]">₹{plan.budget_estimate.per_person_estimated.toLocaleString()} / person</span>
                </div>
              </div>
            </div>

            {/* Day-by-Day Road Timeline */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#D8CBB2] pb-3">
                <DevanagariHeading
                  devanagari="दिन-ब-दिन सड़क योजना"
                  english="Day-by-Day Road Timeline"
                  subtitle="Sequenced driving legs, curated stop detours, and overnight halts."
                />
              </div>

              {/* Day Selector Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                {plan.days.map((d) => (
                  <button
                    key={d.day_number}
                    type="button"
                    onClick={() => setSelectedDayTab(d.day_number)}
                    className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      selectedDayTab === d.day_number
                        ? "bg-[#173B32] text-[#EFE5D2] shadow-md border-2 border-[#173B32]"
                        : "bg-[#FAF7F0] text-[#7B4D36] border-2 border-[#E5D5BA] hover:bg-[#EFE5D2]"
                    }`}
                  >
                    <span className="font-serif block text-sm">Day {d.day_number}</span>
                    <span className="text-[10px] font-mono opacity-80">{d.title}</span>
                  </button>
                ))}
              </div>

              {/* Selected Day Content */}
              {(() => {
                const currentDay = plan.days.find((d) => d.day_number === selectedDayTab) || plan.days[0];
                if (!currentDay) return null;

                return (
                  <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-xs space-y-6 animate-fadeIn">
                    {/* Day Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5D5BA] pb-4">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C]">
                          DAY {currentDay.day_number} • {currentDay.theme}
                        </span>
                        <h3 className="text-2xl font-serif font-black text-[#173B32] mt-0.5">
                          {currentDay.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-mono font-bold text-[#173B32]">
                        <span className="px-3 py-1.5 rounded-xl bg-white border border-[#E5D5BA]">
                          {currentDay.driving_distance_km} km drive
                        </span>
                        <span className="px-3 py-1.5 rounded-xl bg-white border border-[#E5D5BA]">
                          ~{currentDay.driving_time_hours} hrs wheel time
                        </span>
                      </div>
                    </div>

                    {/* Timeline stops */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-mono font-bold uppercase text-[#7B4D36]">
                        Daily Road Timeline:
                      </span>
                      {currentDay.timeline.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-white border border-[#E5D5BA] flex items-start gap-3.5 hover:border-[#173B32]/40 transition-colors"
                        >
                          <span className="px-2.5 py-1 rounded bg-[#173B32] text-[#EFE5D2] text-xs font-bold font-mono shrink-0">
                            {item.start_time}
                          </span>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-serif font-bold text-sm text-[#173B32]">{item.title}</h4>
                              <span className="px-2 py-0.2 rounded bg-[#EFE5D2] text-[#7B4D36] text-[9px] font-mono font-bold uppercase">
                                {item.category}
                              </span>
                            </div>
                            <p className="text-xs text-[#20211D]/80 leading-relaxed font-light">{item.notes}</p>
                            {item.reason_for_recommendation && (
                              <div className="text-[10.5px] font-mono text-[#B65E3C]">
                                ★ {item.reason_for_recommendation}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Curated Food Along Day's Route */}
                    {currentDay.food_options && currentDay.food_options.length > 0 && (
                      <div className="space-y-3 pt-3 border-t border-[#E5D5BA]">
                        <span className="text-[10px] font-mono font-bold uppercase text-[#7B4D36] flex items-center gap-1.5">
                          <Coffee className="w-3.5 h-3.5 text-[#B65E3C]" />
                          <span>Curated Highway Food &amp; Dhabas for this Day:</span>
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {currentDay.food_options.map((f, fIdx) => (
                            <div key={fIdx} className="p-3.5 rounded-2xl bg-white border border-[#E5D5BA] space-y-1">
                              <div className="flex items-center justify-between text-xs font-bold text-[#173B32]">
                                <span className="truncate">{f.name}</span>
                                <span className="font-mono text-[#B65E3C] text-[11px]">{f.price}</span>
                              </div>
                              <p className="text-[11px] text-[#7B4D36] line-clamp-2">{f.specialty || f.type}</p>
                              <div className="text-[9.5px] text-[#7B4D36] font-mono">Hours: {f.timing}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Overnight Stays for this Day */}
                    {currentDay.stay_options && currentDay.stay_options.length > 0 && (
                      <div className="space-y-3 pt-3 border-t border-[#E5D5BA]">
                        <span className="text-[10px] font-mono font-bold uppercase text-[#7B4D36] flex items-center gap-1.5">
                          <BedDouble className="w-3.5 h-3.5 text-[#B65E3C]" />
                          <span>Overnight Halt Stay Options ({currentDay.destination}):</span>
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {currentDay.stay_options.map((st, sIdx) => (
                            <div key={sIdx} className="p-4 rounded-2xl bg-white border border-[#E5D5BA] flex items-center justify-between gap-3">
                              <div>
                                <span className="text-[9px] font-mono text-[#B65E3C] uppercase font-bold">{st.badge}</span>
                                <h5 className="font-serif font-bold text-sm text-[#173B32]">{st.name}</h5>
                                <p className="text-[11px] text-[#7B4D36]">{st.address}</p>
                              </div>
                              <div className="text-right shrink-0 font-mono font-bold text-xs text-[#173B32]">
                                ₹{st.price_per_night?.toLocaleString()}/night
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Proximity Stops / "Local Along The Way" */}
            {plan.recommended_stops && plan.recommended_stops.length > 0 && (
              <div className="space-y-4">
                <DevanagariHeading
                  devanagari="रास्ते में क्या मिलेगा?"
                  english="Local Along the Way (Worthwhile Detours)"
                  subtitle="Things you would miss if you only rushed from origin to destination."
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {plan.recommended_stops.map((stop) => (
                    <div
                      key={stop.id}
                      className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-2xs space-y-3 flex flex-col justify-between hover:border-[#173B32]/50 transition-all"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded bg-[#173B32] text-[#EFE5D2] text-[9.5px] font-mono font-bold uppercase">
                            {stop.type}
                          </span>
                          <span className="text-xs font-mono font-bold text-[#B65E3C]">
                            +{stop.distance_off_route_km} km detour
                          </span>
                        </div>

                        <h4 className="font-serif font-black text-base text-[#173B32]">
                          {stop.name}
                        </h4>

                        <p className="text-xs text-[#20211D]/80 leading-relaxed font-light">
                          {stop.why_stop}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#E5D5BA] flex items-center justify-between text-[11px] font-mono text-[#7B4D36]">
                        <span>Time: {stop.time_needed_mins}m</span>
                        <span className="text-[#173B32] font-bold">
                          {stop.cost_label || (stop.approx_cost > 0 ? `₹${stop.approx_cost}` : "Free")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
