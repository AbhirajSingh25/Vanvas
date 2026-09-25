"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import {
  Mountain, Compass, MapPin, Footprints, ShieldAlert,
  ArrowRight, Sparkles, Navigation, Layers, ChevronRight,
  Calendar, AlertTriangle, ShieldCheck, CheckCircle2, Flame,
  RefreshCw, Check, Droplets, Utensils, Home, Info, Phone,
  ChevronDown, ChevronUp, Clock, AlertCircle, Shield, ShoppingBag,
  Users, DollarSign, Crosshair, ArrowLeft
} from "lucide-react";
import { getTrekBySlug, TrekItem, TrekRouteOption, TrekWaypoint, TrekGearItem } from "@/lib/trekContentModel";
import { VanvasImage } from "@/components/ui/VanvasImage";
import { VanvasMap, VanvasMapMarker, VanvasMapRouteSegment } from "@/components/ui/VanvasMap";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function TrekDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const trek = getTrekBySlug(slug);

  const [selectedRouteId, setSelectedRouteId] = useState<string>(
    trek?.routes[0]?.id || ""
  );
  const [selectedWaypointId, setSelectedWaypointId] = useState<string>(
    trek?.waypoints[0]?.id || ""
  );
  const [gearMode, setGearMode] = useState<"STUDENT" | "BUDGET" | "STANDARD" | "PREMIUM">("STUDENT");
  const [gearActions, setGearActions] = useState<Record<string, "buy" | "rent" | "borrow" | "skip">>({});
  const [groupSize, setGroupSize] = useState<number>(2);
  const [isGroupBudget, setIsGroupBudget] = useState<boolean>(false);
  const [isTrailModeActive, setIsTrailModeActive] = useState<boolean>(false);
  const [trailWaypointIndex, setTrailWaypointIndex] = useState<number>(0);

  if (!trek) {
    return (
      <div className="min-h-screen bg-[#111A16] flex flex-col items-center justify-center text-[#EFE5D2] gap-4 px-4 text-center">
        <Mountain className="w-12 h-12 text-[#E05A2B]" />
        <h2 className="text-2xl font-serif font-black text-[#FAF4E8]">
          Trek Not Found in Expedition Registry
        </h2>
        <p className="text-xs text-[#8FA699] max-w-md leading-relaxed">
          Could not locate the requested trail slug &ldquo;{slug}&rdquo;. Discover all verified Himalayan expeditions below.
        </p>
        <Link
          href="/treks"
          className="px-5 py-2.5 rounded-xl bg-[#E05A2B] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#C8491D] transition-colors"
        >
          Return to All Treks
        </Link>
      </div>
    );
  }

  const activeRoute = trek.routes.find((r) => r.id === selectedRouteId) || trek.routes[0];
  const activeWaypoint = trek.waypoints.find((w) => w.id === selectedWaypointId) || trek.waypoints[0];
  const currentTrailWaypoint = trek.waypoints[trailWaypointIndex] || trek.waypoints[0];
  const nextTrailWaypoint = trek.waypoints[trailWaypointIndex + 1] || null;

  // Gear calculations
  const calculateGearCost = () => {
    let total = 0;
    trek.gearChecklist.forEach((item) => {
      const action = gearActions[item.id] || (item.canSkip && gearMode === "STUDENT" ? "skip" : item.canBorrow ? "borrow" : "rent");
      if (action === "buy") total += item.buyApproxCost;
      if (action === "rent") total += item.rentApproxCostPerDay * trek.durationDays;
    });
    return total;
  };

  // Budget calculations
  const basePerPerson =
    trek.budget.baseTransportCost +
    trek.budget.foodPerDayCost * trek.durationDays +
    trek.budget.campStayCostPerNight * Math.max(1, trek.durationDays - 1) +
    trek.budget.permitCost +
    trek.budget.gearRentalEstimate +
    trek.budget.emergencyBuffer;

  const totalPerPerson = basePerPerson + (groupSize > 1 ? trek.budget.guideOptionalCostPerDay / groupSize : trek.budget.guideOptionalCostPerDay);
  const displayTotal = isGroupBudget ? Math.round(totalPerPerson * groupSize) : Math.round(totalPerPerson);

  const diffColor =
    trek.difficulty === "Easy"
      ? "bg-emerald-950 text-emerald-300 border-emerald-700/60"
      : trek.difficulty === "Moderate"
      ? "bg-amber-950 text-amber-300 border-amber-700/60"
      : "bg-red-950 text-red-300 border-red-700/60";

  return (
    <div className="min-h-screen bg-[#0F1713] text-[#EFE5D2] pb-32 selection:bg-[#E05A2B] selection:text-white">
      {/* ON-THE-TRAIL MODE OVERLAY */}
      {isTrailModeActive && (
        <div className="fixed inset-0 z-50 bg-[#0A100D]/98 text-[#EFE5D2] flex flex-col justify-between p-4 sm:p-6 overflow-y-auto">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-[#2A3E33] pb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-mono font-black text-emerald-400 uppercase tracking-widest">
                LIVE TRAIL MODE ACTIVE
              </span>
            </div>
            <button
              onClick={() => setIsTrailModeActive(false)}
              className="px-4 py-1.5 rounded-lg bg-[#1E2E25] hover:bg-[#2B4034] text-xs font-mono font-bold text-[#EFE5D2] border border-[#3B5446] cursor-pointer"
            >
              Exit Trail Mode [✕]
            </button>
          </div>

          {/* Main Navigation Cockpit */}
          <div className="max-w-3xl mx-auto w-full my-auto py-8 space-y-6">
            <div className="text-center space-y-1">
              <span className="text-xs font-mono text-[#B49252] uppercase tracking-wider">
                Current Waypoint ({trailWaypointIndex + 1} of {trek.waypoints.length})
              </span>
              <h2 className="text-3xl sm:text-5xl font-serif font-black text-white">
                {currentTrailWaypoint.name}
              </h2>
              <span className="font-devanagari text-lg text-[#B49252]">
                {currentTrailWaypoint.hindiName}
              </span>
            </div>

            {/* Altitude & Topographic Data Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#15221B] p-4 rounded-xl border border-[#2B4034] text-center">
                <span className="block text-[10px] font-mono text-[#6D8578] uppercase">Elevation</span>
                <span className="text-xl sm:text-2xl font-mono font-black text-[#FAF4E8]">
                  {currentTrailWaypoint.elevationFormatted}
                </span>
              </div>
              <div className="bg-[#15221B] p-4 rounded-xl border border-[#2B4034] text-center">
                <span className="block text-[10px] font-mono text-[#6D8578] uppercase">Trail Distance</span>
                <span className="text-xl sm:text-2xl font-mono font-black text-[#E05A2B]">
                  {currentTrailWaypoint.distanceFromStartKm} km
                </span>
              </div>
              <div className="bg-[#15221B] p-4 rounded-xl border border-[#2B4034] text-center">
                <span className="block text-[10px] font-mono text-[#6D8578] uppercase">Water Point</span>
                <span className={`text-sm font-mono font-bold ${currentTrailWaypoint.waterAvailable ? "text-emerald-400" : "text-amber-400"}`}>
                  {currentTrailWaypoint.waterAvailable ? "✓ Spring Active" : "✕ Carry Water"}
                </span>
              </div>
              <div className="bg-[#15221B] p-4 rounded-xl border border-[#2B4034] text-center">
                <span className="block text-[10px] font-mono text-[#6D8578] uppercase">Food & Shelter</span>
                <span className={`text-sm font-mono font-bold ${currentTrailWaypoint.foodAvailable ? "text-emerald-400" : "text-[#8FA699]"}`}>
                  {currentTrailWaypoint.foodAvailable ? "✓ Dhaba / Camp" : "Wilderness Only"}
                </span>
              </div>
            </div>

            {/* Field Notes & Safety Directive */}
            <div className="bg-[#1A2A22] p-5 rounded-2xl border border-[#395344] space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-[#B49252] uppercase font-bold">
                <Info className="w-4 h-4 text-[#E05A2B]" />
                <span>Immediate Trail Directives</span>
              </div>
              <p className="text-xs sm:text-sm text-[#D8E4DC] leading-relaxed font-serif">
                {currentTrailWaypoint.fieldNotes}
              </p>
            </div>

            {/* Next Waypoint Preview */}
            {nextTrailWaypoint ? (
              <div className="bg-[#131C17] p-4 rounded-xl border border-[#25372C] flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-[#8FA699] uppercase">Next Target Ahead</span>
                  <h4 className="text-sm font-bold text-white">{nextTrailWaypoint.name}</h4>
                  <span className="text-xs font-mono text-[#B49252]">
                    {nextTrailWaypoint.elevationFormatted} • est. {nextTrailWaypoint.timeFromPrev}
                  </span>
                </div>
                <button
                  onClick={() => setTrailWaypointIndex((prev) => Math.min(trek.waypoints.length - 1, prev + 1))}
                  className="px-5 py-2.5 rounded-xl bg-[#E05A2B] hover:bg-[#C8491D] text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
                >
                  <span>Reach Next WP</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="bg-emerald-950/80 border border-emerald-600/50 p-4 rounded-xl text-center space-y-1">
                <h4 className="text-emerald-200 font-bold font-serif text-lg">
                  Summit / Destination Reached!
                </h4>
                <p className="text-xs text-emerald-300/80 font-mono">
                  Take in the panorama, stay hydrated, and begin safe descent before afternoon weather changes.
                </p>
              </div>
            )}
          </div>

          {/* Bottom Trail Control Strip */}
          <div className="max-w-3xl mx-auto w-full flex items-center justify-between gap-3 border-t border-[#2A3E33] pt-4">
            <button
              disabled={trailWaypointIndex === 0}
              onClick={() => setTrailWaypointIndex((prev) => Math.max(0, prev - 1))}
              className="px-4 py-2 rounded-xl bg-[#15201A] border border-[#2B4034] text-xs font-mono text-[#FAF4E8] disabled:opacity-40 cursor-pointer"
            >
              ← Previous Waypoint
            </button>

            <span className="text-xs font-mono text-[#8FA699]">
              GPS Altitude Checkpoint {trailWaypointIndex + 1}/{trek.waypoints.length}
            </span>

            <button
              disabled={trailWaypointIndex >= trek.waypoints.length - 1}
              onClick={() => setTrailWaypointIndex((prev) => Math.min(trek.waypoints.length - 1, prev + 1))}
              className="px-4 py-2 rounded-xl bg-[#15201A] border border-[#2B4034] text-xs font-mono text-[#FAF4E8] disabled:opacity-40 cursor-pointer"
            >
              Next Waypoint →
            </button>
          </div>
        </div>
      )}

      {/* 1. EXPEDITION TOP HEADER & BREADCRUMB */}
      <div className="sticky top-20 z-30 bg-[#0E1612]/95 backdrop-blur-md border-b border-[#24352D] py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-mono">
            <Link href="/treks" className="text-[#8FA699] hover:text-[#E05A2B] flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Treks</span>
            </Link>
            <span className="text-[#3A5043]">/</span>
            <span className="text-[#FAF4E8] font-semibold truncate">{trek.title}</span>
          </div>

          {/* Trail Mode Trigger */}
          <button
            onClick={() => setIsTrailModeActive(true)}
            className="px-3.5 py-1.5 rounded-full bg-[#E05A2B] hover:bg-[#C8491D] text-white text-[11px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Launch Trail Mode</span>
          </button>
        </div>
      </div>

      {/* 2. EXPEDITION HERO SECTION */}
      <section className="relative h-[60vh] min-h-[440px] max-h-[540px] bg-[#0A100D] flex items-end px-4 sm:px-6 lg:px-8 pb-10 overflow-hidden border-b border-[#2A3E33]">
        <div className="absolute inset-0 z-0">
          <VanvasImage
            src={trek.heroImage}
            alt={trek.title}
            priority={true}
            className="w-full h-full object-cover opacity-80 scale-102 transition-transform duration-1000"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1713] via-[#0F1713]/60 to-black/35 pointer-events-none z-1" />

        <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase border ${diffColor}`}>
                {trek.difficulty}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-[#B49252] text-[#0A100D] text-[10px] font-black uppercase tracking-wider">
                {trek.viewScore} VIEW
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-[#1D2E25] text-[#A6C0B2] text-[10px] font-mono border border-[#344D3F]">
                {trek.mountainRange}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-2xl sm:text-3xl font-serif text-[#B49252] font-semibold block">
                {trek.hindiTitle}
              </span>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-black tracking-tight text-[#FAF4E8]">
                {trek.title}
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-[#D1DFD7] font-serif italic max-w-2xl leading-relaxed">
              &ldquo;{trek.tagline}&rdquo;
            </p>
          </div>

          {/* Quick Altitude Badge & Context Link */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="bg-[#15221B]/90 backdrop-blur-md p-3.5 rounded-2xl border border-[#2F473A] text-right space-y-0.5">
              <span className="text-[10px] font-mono text-[#8FA699] uppercase block">Summit Altitude</span>
              <span className="text-2xl sm:text-3xl font-mono font-black text-[#E05A2B]">
                {trek.peakAltitudeFormatted}
              </span>
              <span className="text-[10px] font-mono text-[#B49252] block">
                Base: {trek.baseCamp}
              </span>
            </div>

            {trek.destinationSlug && (
              <Link
                href={`/explore/${trek.destinationSlug}`}
                className="px-4 py-3.5 rounded-2xl bg-[#1A2A22] hover:bg-[#25392F] text-[#FAF4E8] text-xs font-bold font-mono border border-[#344D3F] flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Region Hub ({trek.destinationSlug})</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#B49252]" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 3. EXPEDITION FACT STRIP */}
      <section className="bg-[#15201A] border-b border-[#24352D] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
            <div className="p-2.5 rounded-xl bg-[#0D1511] border border-[#203027]">
              <span className="text-[9px] font-mono uppercase text-[#6D8578] block">Total Distance</span>
              <span className="text-sm font-mono font-bold text-[#FAF4E8]">{trek.totalDistanceKm} km round trip</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0D1511] border border-[#203027]">
              <span className="text-[9px] font-mono uppercase text-[#6D8578] block">Trail Duration</span>
              <span className="text-sm font-mono font-bold text-[#FAF4E8]">{trek.durationDays === 1 ? trek.durationHours : `${trek.durationDays} Days`}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0D1511] border border-[#203027]">
              <span className="text-[9px] font-mono uppercase text-[#6D8578] block">Best Season</span>
              <span className="text-xs font-mono font-semibold text-[#FAF4E8] truncate block" title={trek.bestSeason}>{trek.bestSeason}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0D1511] border border-[#203027]">
              <span className="text-[9px] font-mono uppercase text-[#6D8578] block">Altitude Safety</span>
              <span className="text-xs font-mono font-bold text-[#B49252] truncate block">{trek.altitudeRiskIndicator}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0D1511] border border-[#203027]">
              <span className="text-[9px] font-mono uppercase text-[#6D8578] block">Approx Budget</span>
              <span className="text-sm font-mono font-bold text-[#E05A2B]">₹{trek.approxBudgetPerPerson} / person</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0D1511] border border-[#203027]">
              <span className="text-[9px] font-mono uppercase text-[#6D8578] block">Trail Options</span>
              <span className="text-sm font-mono font-bold text-white">{trek.routes.length} Verified Route{trek.routes.length > 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. EXPEDITION ROUTE COMPARISON (A key VANVAS differentiator) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="border-b border-[#2A3E33] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#B49252]">
              TRAIL FORKS & APPROACH COMPARISON
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#FAF4E8]">
              Compare Ascent Routes
            </h2>
          </div>
          <span className="text-xs text-[#8FA699] font-mono">
            Understand distance, exposure, crowd density & scenery scores
          </span>
        </div>

        {/* Route Select Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trek.routes.map((route) => {
            const isSelected = selectedRouteId === route.id;
            return (
              <div
                key={route.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedRouteId(route.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedRouteId(route.id); }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer text-left space-y-3 ${
                  isSelected
                    ? "bg-[#18261F] border-[#E05A2B] shadow-xl ring-1 ring-[#E05A2B]"
                    : "bg-[#121B16] border-[#25372C] hover:border-[#385141]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? "bg-[#E05A2B]" : "bg-[#486654]"}`} />
                    <h3 className="font-serif font-bold text-lg text-white">{route.name}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-[#B49252] text-[#0A100D] font-mono text-[10px] font-black">
                    {route.sceneryScore} SCENERY
                  </span>
                </div>

                <p className="text-xs text-[#9BB1A4] font-serif leading-relaxed">
                  {route.summary}
                </p>

                {/* Route Stat Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#24352D] text-[11px] font-mono">
                  <div>
                    <span className="block text-[9px] uppercase text-[#6D8578]">Distance</span>
                    <span className="text-[#FAF4E8] font-bold">{route.distanceKm} km</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase text-[#6D8578]">Elevation Gain</span>
                    <span className="text-[#E05A2B] font-bold">+{route.elevationGainMeters} m</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase text-[#6D8578]">Estimated Time</span>
                    <span className="text-[#FAF4E8]">{route.estimatedTime}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase text-[#6D8578]">Technical Grade</span>
                    <span className="text-[#B49252]">{route.technicalExposure}</span>
                  </div>
                </div>

                <div className="bg-[#0D1511] p-2.5 rounded-xl border border-[#1E2D24] text-[11px] flex items-center justify-between text-[#8FA699] font-mono">
                  <span>Recommended for: <strong className="text-[#D1DFD7] font-serif">{route.recommendedFor}</strong></span>
                  <span>Water Points: <strong className="text-emerald-400">{route.waterPointsCount}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. TOPOGRAPHIC EXPEDITION MAP & WAYPOINT VISUALIZER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="border-b border-[#2A3E33] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#B49252]">
              TOPOGRAPHIC TRAIL LOG & ELEVATION PROFILE
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#FAF4E8]">
              Expedition Route & Waypoints
            </h2>
          </div>
          <span className="text-xs text-[#8FA699] font-mono">
            Tap any waypoint along the trail to inspect water, terrain, and field notes
          </span>
        </div>

        {/* Topographic Trail Map */}
        {(() => {
          const mapMarkers: VanvasMapMarker[] = trek.waypoints.map((wp): VanvasMapMarker => ({
            id: wp.id,
            title: wp.name,
            hindiTitle: wp.hindiName,
            type: wp.isSummit ? "summit" : wp.isBaseCamp ? "start" : wp.waterAvailable ? "water" : "waypoint",
            lat: wp.latitude,
            lng: wp.longitude,
            elevationMeters: wp.elevationMeters,
            description: wp.fieldNotes,
            categoryLabel: wp.terrainType,
            provenance: "VERIFIED",
            actionLabel: "Inspect Waypoint"
          }));

          const routeSegments: VanvasMapRouteSegment[] = [
            {
              id: `route-${trek.id}`,
              name: trek.title,
              coordinates: trek.waypoints.map((wp) => ({ lat: wp.latitude, lng: wp.longitude, alt: wp.elevationMeters })),
              color: "#E05A2B",
              elevationGain: trek.routes[0]?.elevationGainMeters || 1000,
              distanceKm: trek.totalDistanceKm
            }
          ];

          return (
            <VanvasMap
              mode="trek"
              title={`${trek.title} Topographic Trail`}
              subtitle={`${trek.mountainRange} • Peak: ${trek.peakAltitudeFormatted} • ${trek.totalDistanceKm} km total`}
              center={{ lat: trek.waypoints[0]?.latitude || 30.48, lng: trek.waypoints[0]?.longitude || 79.2 }}
              markers={mapMarkers}
              routes={routeSegments}
              selectedMarkerId={selectedWaypointId}
              onSelectMarker={(m) => {
                if (m) setSelectedWaypointId(m.id);
              }}
              height={440}
            />
          );
        })()}

        {/* Interactive Waypoint Ribbon / Stepper */}
        <div className="bg-[#14201A] p-4 sm:p-6 rounded-3xl border border-[#2A3E33] space-y-6">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
            {trek.waypoints.map((wp, idx) => {
              const isSelected = wp.id === selectedWaypointId;
              return (
                <button
                  key={wp.id}
                  onClick={() => setSelectedWaypointId(wp.id)}
                  className={`px-4 py-3 rounded-2xl text-left shrink-0 transition-all border cursor-pointer ${
                    isSelected
                      ? "bg-[#1E2E25] border-[#E05A2B] shadow-lg ring-1 ring-[#E05A2B]"
                      : "bg-[#0E1713] border-[#223329] hover:border-[#324B3C]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold ${
                      wp.isSummit ? "bg-[#E05A2B] text-white" : isSelected ? "bg-[#B49252] text-[#0A100D]" : "bg-[#25372C] text-[#8FA699]"
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-white whitespace-nowrap">{wp.name}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[10px] font-mono text-[#8FA699]">
                    <span className="text-[#E05A2B] font-bold">{wp.elevationFormatted}</span>
                    <span>•</span>
                    <span>{wp.distanceFromStartKm} km</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Waypoint Field Note Inspector */}
          <div className="bg-[#0E1612] p-5 sm:p-6 rounded-2xl border border-[#273B2F] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#1A2E24] text-[#B49252] text-[10px] font-mono uppercase border border-[#B49252]/40">
                  {activeWaypoint.isSummit ? "SUMMIT PINNACLE" : activeWaypoint.isBaseCamp ? "BASE ROADHEAD" : "MID-TRAIL WAYPOINT"}
                </span>
                <span className="text-xs font-mono text-[#6D8578]">
                  [ {activeWaypoint.latitude.toFixed(4)}°N, {activeWaypoint.longitude.toFixed(4)}°E ]
                </span>
              </div>

              <div className="space-y-0.5">
                <h3 className="text-2xl sm:text-3xl font-serif font-black text-[#FAF4E8]">
                  {activeWaypoint.name}
                </h3>
                <span className="font-devanagari text-sm text-[#B49252]">
                  {activeWaypoint.hindiName}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#B3C4B9] font-serif leading-relaxed">
                {activeWaypoint.fieldNotes}
              </p>

              {/* Waypoint Facility Indicators */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-[11px] font-mono">
                <div className="bg-[#14201A] p-2.5 rounded-xl border border-[#203026]">
                  <span className="block text-[9px] uppercase text-[#6D8578]">Elevation</span>
                  <span className="text-[#FAF4E8] font-bold">{activeWaypoint.elevationFormatted}</span>
                </div>
                <div className="bg-[#14201A] p-2.5 rounded-xl border border-[#203026]">
                  <span className="block text-[9px] uppercase text-[#6D8578]">Distance from Start</span>
                  <span className="text-[#E05A2B] font-bold">{activeWaypoint.distanceFromStartKm} km</span>
                </div>
                <div className="bg-[#14201A] p-2.5 rounded-xl border border-[#203026]">
                  <span className="block text-[9px] uppercase text-[#6D8578]">Distance to Next</span>
                  <span className="text-[#B49252] font-bold">{activeWaypoint.distanceToNext || "Summit Reach"}</span>
                </div>
                <div className="bg-[#14201A] p-2.5 rounded-xl border border-[#203026]">
                  <span className="block text-[9px] uppercase text-[#6D8578]">Ascent Time</span>
                  <span className="text-[#FAF4E8]">{activeWaypoint.timeFromPrev}</span>
                </div>
                <div className="bg-[#14201A] p-2.5 rounded-xl border border-[#203026]">
                  <span className="block text-[9px] uppercase text-[#6D8578]">Water Spring</span>
                  <span className={activeWaypoint.waterAvailable ? "text-emerald-400 font-bold" : "text-amber-400"}>
                    {activeWaypoint.waterAvailable ? "✓ Spring Active" : "✕ Carry Water"}
                  </span>
                </div>
                <div className="bg-[#14201A] p-2.5 rounded-xl border border-[#203026]">
                  <span className="block text-[9px] uppercase text-[#6D8578]">Food & Stalls</span>
                  <span className={activeWaypoint.foodAvailable ? "text-emerald-400 font-bold" : "text-[#6D8578]"}>
                    {activeWaypoint.foodAvailable ? "✓ Chai / Maggi" : "✕ Self-Contained"}
                  </span>
                </div>
                <div className="bg-[#14201A] p-2.5 rounded-xl border border-[#203026]">
                  <span className="block text-[9px] uppercase text-[#6D8578]">Shelter / Camps</span>
                  <span className={activeWaypoint.shelterAvailable ? "text-emerald-400 font-bold" : "text-[#6D8578]"}>
                    {activeWaypoint.shelterAvailable ? "✓ Alpine Shelter" : "✕ Open Ridge"}
                  </span>
                </div>
                <div className="bg-[#14201A] p-2.5 rounded-xl border border-[#203026]">
                  <span className="block text-[9px] uppercase text-[#6D8578]">Mobile Signal</span>
                  <span className="text-[#A6BAAE] font-bold">{activeWaypoint.signalNote || "No Signal"}</span>
                </div>
                <div className="bg-[#14201A] p-2.5 rounded-xl border border-[#203026]">
                  <span className="block text-[9px] uppercase text-[#6D8578]">Terrain Difficulty</span>
                  <span className="text-[#E05A2B] font-bold">{activeWaypoint.difficulty || activeWaypoint.terrainType}</span>
                </div>
              </div>
            </div>

            {/* Waypoint Image / Visual representation */}
            <div className="lg:col-span-5 relative h-48 sm:h-56 w-full rounded-2xl overflow-hidden border border-[#2A3E33]">
              <VanvasImage
                src={activeWaypoint.imageUrl || trek.heroImage}
                alt={activeWaypoint.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-[#0A100D]/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-mono text-[#EFE5D2]">
                {activeWaypoint.terrainType}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. VISUAL DIFFICULTY BREAKDOWN */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="border-b border-[#2A3E33] pb-4">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#B49252]">
            PHYSIOLOGICAL & TECHNICAL DEMANDS
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#FAF4E8]">
            Why is this rated {trek.difficulty}?
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Visual Meters */}
          <div className="lg:col-span-6 bg-[#14201A] p-5 sm:p-6 rounded-3xl border border-[#2A3E33] space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#FAF4E8]">
              Trail Demand Ratings (1 – 10 Scale)
            </h3>

            {[
              { label: "Cardiovascular & Fitness Demand", val: trek.difficultyFactors.fitnessDemand, desc: "Endurance needed for ascent" },
              { label: "Altitude & AMS Vulnerability", val: trek.difficultyFactors.altitudeRisk, desc: "Risk above 3,000m threshold" },
              { label: "Trail Steepness & Gradient", val: trek.difficultyFactors.steepnessGrade, desc: "Continuous vertical incline" },
              { label: "Terrain Technicality & Footing", val: trek.difficultyFactors.terrainTechnicality, desc: "Loose scree, boulders or ice" },
              { label: "Ridge Exposure Risk", val: trek.difficultyFactors.exposureRisk, desc: "Narrow drop-offs & wind exposure" },
              { label: "Weather Volatility & Drop", val: trek.difficultyFactors.weatherVolatility, desc: "Sudden temperature or rain changes" },
            ].map((meter) => (
              <div key={meter.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#D1DFD7]">{meter.label}</span>
                  <span className="font-bold text-[#E05A2B]">{meter.val} / 10</span>
                </div>
                <div className="w-full h-2 bg-[#0E1612] rounded-full overflow-hidden border border-[#223328]">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 via-[#B49252] to-[#E05A2B] rounded-full transition-all duration-700"
                    style={{ width: `${meter.val * 10}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#6D8578] font-mono">{meter.desc}</span>
              </div>
            ))}
          </div>

          {/* Field Guide Reasoning */}
          <div className="lg:col-span-6 bg-[#14201A] p-5 sm:p-6 rounded-3xl border border-[#2A3E33] space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#FAF4E8]">
                Expedition Medical & Terrain Notes
              </h3>
              <ul className="space-y-2.5">
                {trek.difficultyFactors.explanation.map((exp, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#B3C4B9] font-serif leading-relaxed">
                    <span className="w-4 h-4 rounded-full bg-[#E05A2B]/20 text-[#E05A2B] flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{exp}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#0E1612] p-4 rounded-2xl border border-[#273B2F] space-y-1">
              <span className="text-[10px] font-mono text-[#B49252] uppercase font-bold">
                Acclimatization Protocol
              </span>
              <p className="text-xs text-[#8FA699] font-serif">
                Drink at least 3 litres of water daily on the trail. If feeling dizziness or persistent headache, descend 300m immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. INTERACTIVE GEAR PLANNER (Student / Budget / Standard / Premium) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="border-b border-[#2A3E33] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#B49252]">
              RUGGED PACKING & RENTAL SYSTEM
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#FAF4E8]">
              Gear Planner & Cost Optimizer
            </h2>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-[#14201A] p-1.5 rounded-xl border border-[#2A3E33]">
            {(["STUDENT", "BUDGET", "STANDARD", "PREMIUM"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setGearMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  gearMode === mode
                    ? "bg-[#E05A2B] text-white shadow-md"
                    : "text-[#8FA699] hover:text-white"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Gear Checklist Cards */}
        <div className="space-y-3">
          {trek.gearChecklist.map((item) => {
            const currentAction =
              gearActions[item.id] ||
              (item.canSkip && gearMode === "STUDENT" ? "skip" : item.canBorrow ? "borrow" : "rent");

            return (
              <div
                key={item.id}
                className="bg-[#14201A] p-4 rounded-2xl border border-[#2A3E33] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                      item.priority === "ESSENTIAL" ? "bg-red-950 text-red-300 border border-red-700/60" : "bg-blue-950 text-blue-300 border border-blue-700/60"
                    }`}>
                      {item.priority}
                    </span>
                    <h4 className="font-serif font-bold text-sm text-white">{item.name}</h4>
                  </div>
                  {gearMode === "STUDENT" && (
                    <p className="text-xs text-[#B49252] font-serif">
                      Student Hack: {item.studentAlternative}
                    </p>
                  )}
                  {item.condition && (
                    <span className="text-[10px] text-[#8FA699] font-mono block">
                      Condition: {item.condition}
                    </span>
                  )}
                </div>

                {/* Buy / Rent / Borrow / Skip Selector */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setGearActions({ ...gearActions, [item.id]: "buy" })}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase cursor-pointer border ${
                      currentAction === "buy" ? "bg-[#B49252] text-[#0A100D] border-[#B49252]" : "bg-[#0E1612] text-[#8FA699] border-[#223328]"
                    }`}
                  >
                    Buy (₹{item.buyApproxCost})
                  </button>
                  <button
                    onClick={() => setGearActions({ ...gearActions, [item.id]: "rent" })}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase cursor-pointer border ${
                      currentAction === "rent" ? "bg-[#E05A2B] text-white border-[#E05A2B]" : "bg-[#0E1612] text-[#8FA699] border-[#223328]"
                    }`}
                  >
                    Rent (₹{item.rentApproxCostPerDay * trek.durationDays})
                  </button>
                  {item.canBorrow && (
                    <button
                      onClick={() => setGearActions({ ...gearActions, [item.id]: "borrow" })}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase cursor-pointer border ${
                        currentAction === "borrow" ? "bg-emerald-700 text-white border-emerald-600" : "bg-[#0E1612] text-[#8FA699] border-[#223328]"
                      }`}
                    >
                      Borrow (₹0)
                    </button>
                  )}
                  {item.canSkip && (
                    <button
                      onClick={() => setGearActions({ ...gearActions, [item.id]: "skip" })}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase cursor-pointer border ${
                        currentAction === "skip" ? "bg-neutral-700 text-white border-neutral-500" : "bg-[#0E1612] text-[#8FA699] border-[#223328]"
                      }`}
                    >
                      Skip (₹0)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. TRANSPARENT BUDGET CALCULATOR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="border-b border-[#2A3E33] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#B49252]">
              COST TRANSPARENCY & EXPENSE ESTIMATOR
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#FAF4E8]">
              Trek Budget Calculator
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Group Size Selector */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-[#8FA699]">Group:</span>
              {[1, 2, 3, 4, 6].map((size) => (
                <button
                  key={size}
                  onClick={() => setGroupSize(size)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    groupSize === size
                      ? "bg-[#E05A2B] text-white"
                      : "bg-[#14201A] text-[#8FA699] border border-[#24352D]"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>

            {/* Total vs Per Person Toggle */}
            <button
              onClick={() => setIsGroupBudget(!isGroupBudget)}
              className="px-3 py-1.5 rounded-lg bg-[#14201A] border border-[#2A3E33] text-xs font-mono text-[#FAF4E8] cursor-pointer"
            >
              {isGroupBudget ? "Showing: Group Total" : "Showing: Per Person"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-[#14201A] p-5 sm:p-6 rounded-3xl border border-[#2A3E33] space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#FAF4E8]">
              Transparent Line-Item Breakdown
            </h3>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between py-1.5 border-b border-[#203027]">
                <span className="text-[#D1DFD7]">Approach Transport (Shared Sumo / Bus)</span>
                <span className="text-[#FAF4E8] font-bold">₹{trek.budget.baseTransportCost}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#203027]">
                <span className="text-[#D1DFD7]">Trail Meals & Hydration ({trek.durationDays} Days @ ₹{trek.budget.foodPerDayCost}/day)</span>
                <span className="text-[#FAF4E8] font-bold">₹{trek.budget.foodPerDayCost * trek.durationDays}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#203027]">
                <span className="text-[#D1DFD7]">Alpine Campsite / Meadow Stay ({Math.max(1, trek.durationDays - 1)} Nights)</span>
                <span className="text-[#FAF4E8] font-bold">₹{trek.budget.campStayCostPerNight * Math.max(1, trek.durationDays - 1)}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#203027]">
                <span className="text-[#D1DFD7]">Forest Department Permits & Eco Fees</span>
                <span className="text-[#FAF4E8] font-bold">₹{trek.budget.permitCost}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#203027]">
                <span className="text-[#D1DFD7]">Optional Local Guide (₹{trek.budget.guideOptionalCostPerDay} split across {groupSize})</span>
                <span className="text-[#FAF4E8] font-bold">₹{Math.round(trek.budget.guideOptionalCostPerDay / groupSize)}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#203027]">
                <span className="text-[#D1DFD7]">Gear Rental Buffer</span>
                <span className="text-[#FAF4E8] font-bold">₹{trek.budget.gearRentalEstimate}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[#D1DFD7]">Emergency Buffer (Cash for mules/ponies)</span>
                <span className="text-[#FAF4E8] font-bold">₹{trek.budget.emergencyBuffer}</span>
              </div>
            </div>

            {/* Student Cost Hacks */}
            <div className="pt-3 border-t border-[#203027] space-y-2">
              <span className="text-[10px] font-mono uppercase text-[#B49252] font-bold">
                Student & Backpacker Hacks
              </span>
              <ul className="space-y-1.5">
                {trek.budget.studentHacks.map((hack, i) => (
                  <li key={i} className="text-xs text-[#9BB1A4] font-serif flex items-start gap-2">
                    <span className="text-[#B49252]">•</span>
                    <span>{hack}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Grand Total Summary Box */}
          <div className="lg:col-span-4 bg-[#18261F] p-6 rounded-3xl border border-[#344D3F] flex flex-col justify-between space-y-6 text-center">
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-widest text-[#B49252]">
                {isGroupBudget ? `Group of ${groupSize} Total` : "Per Person Estimate"}
              </span>
              <div className="text-4xl sm:text-5xl font-mono font-black text-[#E05A2B]">
                ₹{displayTotal}
              </div>
              <span className="text-[11px] font-mono text-[#8FA699] block">
                Includes transport, meals, camping & permits
              </span>
            </div>

            <button
              onClick={() => setIsTrailModeActive(true)}
              className="w-full py-3.5 bg-[#E05A2B] hover:bg-[#C8491D] text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Footprints className="w-4 h-4" />
              <span>Launch Trail Cockpit</span>
            </button>
          </div>
        </div>
      </section>

      {/* 9. PRACTICAL FIELD INTELLIGENCE & SAFETY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="border-b border-[#2A3E33] pb-4">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#B49252]">
            GROUND LOGISTICS & SURVIVAL PROTOCOLS
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#FAF4E8]">
            Field Intelligence
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-[#14201A] p-5 rounded-2xl border border-[#24352D] space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#FAF4E8]">
              <Calendar className="w-4 h-4 text-[#B49252]" />
              <span>Seasonality & Winter Access</span>
            </div>
            <p className="text-xs text-[#9BB1A4] font-serif leading-relaxed">
              {trek.fieldIntelligence.idealSeasonMonths}
            </p>
            <p className="text-xs text-[#6D8578] font-serif">
              Winter: {trek.fieldIntelligence.winterAccess}
            </p>
          </div>

          <div className="bg-[#14201A] p-5 rounded-2xl border border-[#24352D] space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#FAF4E8]">
              <Phone className="w-4 h-4 text-[#B49252]" />
              <span>Cellular & Emergency Network</span>
            </div>
            <p className="text-xs text-[#9BB1A4] font-serif leading-relaxed">
              {trek.fieldIntelligence.mobileNetwork}
            </p>
            <p className="text-xs text-[#E05A2B] font-mono">
              Nearest Hospital: {trek.fieldIntelligence.nearestHospital}
            </p>
          </div>

          <div className="bg-[#14201A] p-5 rounded-2xl border border-[#24352D] space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#FAF4E8]">
              <Shield className="w-4 h-4 text-[#B49252]" />
              <span>Permits & Last Motorable Point</span>
            </div>
            <p className="text-xs text-[#9BB1A4] font-serif leading-relaxed">
              {trek.fieldIntelligence.permitsRequired}
            </p>
            <p className="text-xs text-[#FAF4E8] font-mono">
              Roadhead: {trek.fieldIntelligence.lastMotorablePoint}
            </p>
          </div>
        </div>

        {/* Trail Etiquette Strip */}
        <div className="bg-[#121B16] p-5 rounded-2xl border border-[#25372C] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-mono font-bold uppercase text-[#FAF4E8]">
              Leave-No-Trace Alpine Code
            </h4>
            <p className="text-xs text-[#8FA699] font-serif">
              Pack out all non-biodegradable trash. Keep high mountain springs uncontaminated.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-[#1D2E25] text-emerald-300 font-mono text-[10px] border border-emerald-700/40">
              ✓ Verified Expedition
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
