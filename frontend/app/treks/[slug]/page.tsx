"use client";

import React, { useState, useEffect, use, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Mountain, Compass, MapPin, Footprints, ShieldAlert,
  ArrowRight, Sparkles, Navigation, Layers, ChevronRight,
  Calendar, AlertTriangle, ShieldCheck, CheckCircle2, Flame,
  RefreshCw, Check, Droplets, Utensils, Home, Info, Phone,
  ChevronDown, ChevronUp, Clock, AlertCircle, Shield, ShoppingBag,
  Users, DollarSign, Crosshair, ArrowLeft, X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getTrekBySlug, TrekItem, TrekRouteOption, TrekWaypoint, TrekGearItem } from "@/lib/trekContentModel";
import { VanvasImage } from "@/components/ui/VanvasImage";
import { VanvasMap, VanvasMapMarker, VanvasMapRouteSegment } from "@/components/ui/VanvasMap";
import { TravelingSoloSection } from "@/components/solo/TravelingSoloSection";
import { TravelStamp } from "@/components/ui/TravelStamp";
import { VanvasTabBar, TabItem } from "@/components/ui/VanvasTabBar";
import { VanvasAdaptiveModal } from "@/components/ui/VanvasAdaptiveModal";
import { useAskVanvas } from "@/context/AskVanvasContext";
import { routeScreenVariants } from "@/lib/motion";

interface PageProps {
  params: Promise<{ slug: string }>;
}

type TrekTabType = "overview" | "route" | "conditions" | "gear" | "budget";

export default function TrekDetailPage(props: PageProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF4E8]" />}>
      <TrekDetailContent {...props} />
    </Suspense>
  );
}

function TrekDetailContent({ params }: PageProps) {
  const { slug } = use(params);
  const searchParams = useSearchParams();
  const trek = getTrekBySlug(slug);
  const { openAskVanvas } = useAskVanvas();

  const [activeTrekTab, setActiveTrekTab] = useState<TrekTabType>("overview");
  const [selectedRouteId, setSelectedRouteId] = useState<string>(trek?.routes[0]?.id || "");
  const [selectedWaypointId, setSelectedWaypointId] = useState<string>(trek?.waypoints[0]?.id || "");
  const [gearMode, setGearMode] = useState<"STUDENT" | "BUDGET" | "STANDARD" | "PREMIUM">("STUDENT");
  const [gearActions, setGearActions] = useState<Record<string, "buy" | "rent" | "borrow" | "skip">>({});
  const [groupSize, setGroupSize] = useState<number>(2);
  const [isGroupBudget, setIsGroupBudget] = useState<boolean>(false);
  const [selectedWaypointForModal, setSelectedWaypointForModal] = useState<TrekWaypoint | null>(null);

  const [isTrailModeActive, setIsTrailModeActive] = useState<boolean>(() => {
    const mode = searchParams?.get("mode");
    const trail = searchParams?.get("trail");
    return mode === "trail" || trail === "1" || trail === "true";
  });
  const [trailWaypointIndex, setTrailWaypointIndex] = useState<number>(0);

  // Sync Trail Mode from URL query parameter
  useEffect(() => {
    const mode = searchParams?.get("mode");
    const trail = searchParams?.get("trail");
    if (mode === "trail" || trail === "1" || trail === "true") {
      setIsTrailModeActive(true);
    }
  }, [searchParams]);

  if (!trek) {
    return (
      <div className="min-h-screen bg-[#FAF4E8] flex flex-col items-center justify-center text-[#20211D] gap-4 px-4 text-center">
        <Mountain className="w-12 h-12 text-[#B65E3C]" />
        <h2 className="text-2xl font-serif font-black text-[#173B32]">
          Trek Not Found in Expedition Registry
        </h2>
        <p className="text-xs text-[#7B4D36] max-w-md leading-relaxed">
          Could not locate the trail slug &ldquo;{slug}&rdquo;. Explore all verified Himalayan expeditions below.
        </p>
        <Link
          href="/treks"
          className="px-5 py-2.5 rounded-xl bg-[#173B32] text-[#FAF4E8] text-xs font-bold uppercase tracking-wider hover:bg-[#20453B] transition-colors"
        >
          Return to All Treks
        </Link>
      </div>
    );
  }

  const activeRoute = trek.routes.find((r) => r.id === selectedRouteId) || trek.routes[0];
  const activeWaypoint = trek.waypoints.find((w) => w.id === selectedWaypointId) || trek.waypoints[0];
  const currentTrailWaypoint = trek.waypoints[trailWaypointIndex] || trek.waypoints[0];

  // Gear cost calculation
  const calculateGearCost = () => {
    let total = 0;
    trek.gearChecklist.forEach((item) => {
      const action = gearActions[item.id] || (item.canSkip && gearMode === "STUDENT" ? "skip" : item.canBorrow ? "borrow" : "rent");
      if (action === "buy") total += item.buyApproxCost;
      if (action === "rent") total += item.rentApproxCostPerDay * trek.durationDays;
    });
    return total;
  };

  // Budget calculation
  const perPersonBaseBudget = trek.approxBudgetPerPerson;
  const gearCost = calculateGearCost();
  const perPersonTotal = perPersonBaseBudget + gearCost;
  const groupTotal = perPersonTotal * groupSize;
  const displayTotal = isGroupBudget ? groupTotal : perPersonTotal;

  const diffBadgeClass =
    trek.difficulty === "Easy"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : trek.difficulty === "Moderate"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-rose-50 text-rose-800 border-rose-200";

  return (
    <div className="min-h-screen bg-[#FAF4E8] text-[#20211D] pb-32">
      {/* FULL-SCREEN ON-THE-TRAIL MODE OVERLAY */}
      {isTrailModeActive && (
        <div className="fixed inset-0 z-50 bg-[#0E2019] text-[#FAF4E8] flex flex-col h-full overflow-hidden">
          {/* Top Sticky Header */}
          <div className="shrink-0 bg-[#0A1813] border-b border-[#2A3E33] px-4 py-3 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-widest">
                TRAIL COCKPIT • {trek.title}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsTrailModeActive(false)}
              className="px-3 py-1 rounded-lg bg-[#1E2E25] hover:bg-[#2B4034] text-xs font-mono font-bold text-[#EFE5D2] border border-[#3B5446] cursor-pointer"
            >
              Exit [✕]
            </button>
          </div>

          {/* Scrollable Trail Cockpit Center */}
          <div className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl mx-auto w-full space-y-6">
            {/* Waypoint Progress Ribbon */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
              {trek.waypoints.map((wp, idx) => {
                const isCurrent = idx === trailWaypointIndex;
                const isPassed = idx < trailWaypointIndex;
                return (
                  <button
                    key={wp.id}
                    type="button"
                    onClick={() => setTrailWaypointIndex(idx)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono ${
                      isCurrent
                        ? "bg-[#B65E3C] text-white border-[#B65E3C] font-bold shadow-md"
                        : isPassed
                        ? "bg-[#1E2E25] text-emerald-300 border-[#2A3E33]"
                        : "bg-[#121B16] text-[#8FA699] border-[#1F2D24]"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      isCurrent ? "bg-white text-[#B65E3C] font-black" : isPassed ? "bg-emerald-800 text-white" : "bg-[#25372C] text-[#8FA699]"
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="truncate max-w-[100px]">{wp.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Current Waypoint Heading */}
            <div className="text-center space-y-1">
              <span className="text-xs font-mono text-[#B49252] uppercase tracking-wider font-bold">
                Waypoint {trailWaypointIndex + 1} of {trek.waypoints.length}
              </span>
              <h2 className="text-2xl sm:text-4xl font-serif font-black text-white">
                {currentTrailWaypoint.name}
              </h2>
              <span className="font-devanagari text-base text-[#B49252] block">
                {currentTrailWaypoint.hindiName}
              </span>
            </div>

            {/* Altitude & Topographic Data Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-[#15221B] p-3.5 rounded-xl border border-[#2B4034] text-center">
                <span className="block text-[10px] font-mono text-[#8FA699] uppercase">Elevation</span>
                <span className="text-lg sm:text-2xl font-mono font-black text-[#FAF4E8]">
                  {currentTrailWaypoint.elevationFormatted}
                </span>
              </div>
              <div className="bg-[#15221B] p-3.5 rounded-xl border border-[#2B4034] text-center">
                <span className="block text-[10px] font-mono text-[#8FA699] uppercase">Trail Distance</span>
                <span className="text-lg sm:text-2xl font-mono font-black text-[#B65E3C]">
                  {currentTrailWaypoint.distanceFromStartKm} km
                </span>
              </div>
              <div className="bg-[#15221B] p-3.5 rounded-xl border border-[#2B4034] text-center">
                <span className="block text-[10px] font-mono text-[#8FA699] uppercase">Water Point</span>
                <span className={`text-xs sm:text-sm font-mono font-bold block mt-1 ${currentTrailWaypoint.waterAvailable ? "text-emerald-400" : "text-amber-400"}`}>
                  {currentTrailWaypoint.waterAvailable ? "✓ Spring Active" : "✕ Carry Water"}
                </span>
              </div>
              <div className="bg-[#15221B] p-3.5 rounded-xl border border-[#2B4034] text-center">
                <span className="block text-[10px] font-mono text-[#8FA699] uppercase">Food &amp; Shelter</span>
                <span className={`text-xs sm:text-sm font-mono font-bold block mt-1 ${currentTrailWaypoint.foodAvailable ? "text-emerald-400" : "text-[#8FA699]"}`}>
                  {currentTrailWaypoint.foodAvailable ? "✓ Dhaba / Camp" : "Wilderness Only"}
                </span>
              </div>
            </div>

            {/* Field Notes & Directives */}
            <div className="bg-[#15221B] p-4 sm:p-5 rounded-2xl border border-[#2B4034] space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-[#B49252] uppercase font-bold">
                <Info className="w-4 h-4 text-[#B65E3C]" />
                <span>Immediate Trail Directives</span>
              </div>
              <p className="text-xs sm:text-sm text-[#D8E4DC] leading-relaxed font-sans">
                {currentTrailWaypoint.fieldNotes}
              </p>
            </div>
          </div>

          {/* Bottom Fixed Trail Control Strip */}
          <div className="shrink-0 bg-[#0A1813] border-t border-[#2A3E33] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
            <div className="max-w-3xl mx-auto w-full flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={trailWaypointIndex === 0}
                onClick={() => setTrailWaypointIndex((prev) => Math.max(0, prev - 1))}
                className="px-3.5 py-2 rounded-xl bg-[#15201A] border border-[#2B4034] text-xs font-mono text-[#FAF4E8] disabled:opacity-30 cursor-pointer hover:bg-[#1E2E25]"
              >
                ← Prev WP
              </button>

              <span className="text-xs font-mono text-[#8FA699] text-center truncate">
                WP {trailWaypointIndex + 1}/{trek.waypoints.length} • {currentTrailWaypoint.name}
              </span>

              <button
                type="button"
                disabled={trailWaypointIndex >= trek.waypoints.length - 1}
                onClick={() => setTrailWaypointIndex((prev) => Math.min(trek.waypoints.length - 1, prev + 1))}
                className="px-3.5 py-2 rounded-xl bg-[#15201A] border border-[#2B4034] text-xs font-mono text-[#FAF4E8] disabled:opacity-30 cursor-pointer hover:bg-[#1E2E25]"
              >
                Next WP →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. DESKTOP BREADCRUMB (HIDDEN ON MOBILE TO PREVENT DUPLICATE TITLE BARS) */}
      <div className="hidden xl:block bg-[#FAF7F0]/95 border-b border-[#E5D5BA] py-2.5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-mono">
            <Link href="/treks" className="text-[#7B4D36] hover:text-[#173B32] flex items-center gap-1 font-bold">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Treks</span>
            </Link>
            <span className="text-[#E5D5BA]">/</span>
            <span className="text-[#173B32] font-bold truncate">{trek.title}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openAskVanvas({ destinationName: trek.title, title: `ASK VANVAS · ${trek.title.toUpperCase()}` }, `Tell me safety tips, gear essentials, and route advice for ${trek.title}`)}
              className="px-3 py-1.5 rounded-xl bg-[#EFE5D2] hover:bg-[#E5D5BA] text-[#173B32] text-xs font-mono border border-[#E5D5BA] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#B49252]" />
              <span>Ask VANVAS</span>
            </button>

            <button
              type="button"
              onClick={() => setIsTrailModeActive(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#B65E3C] hover:bg-[#9F4F30] text-white text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Trail Mode</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. PARCHMENT-LED TREK HERO */}
      <section className="bg-[#FAF7F0] border-b-2 border-[#E5D5BA] text-[#20211D] px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B65E3C]">
                  {trek.mountainRange} • {trek.region}
                </span>
                <span className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold uppercase border ${diffBadgeClass}`}>
                  {trek.difficulty}
                </span>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-black text-[#173B32] tracking-tight leading-tight">
                {trek.title} <span className="font-devanagari text-base sm:text-lg text-[#B49252] font-normal">({trek.hindiTitle})</span>
              </h1>

              <p className="text-xs sm:text-sm text-[#7B4D36] leading-relaxed">
                {trek.tagline || trek.expeditionOverview}
              </p>
            </div>

            {/* Actions: Plan Trek & Trail Mode (Strictly within viewport) */}
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
              <Link
                href={`/plan?dest=${trek.slug}&mode=trek`}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#FAF4E8] text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#B49252]" />
                <span>Plan This Trek</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsTrailModeActive(true)}
                className="px-4 py-2.5 rounded-xl bg-[#B65E3C] hover:bg-[#9F4F30] text-white text-xs font-mono font-bold tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-98"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Trail Mode</span>
              </button>

              <button
                type="button"
                onClick={() => openAskVanvas({ destinationName: trek.title, title: `ASK VANVAS · ${trek.title.toUpperCase()}` }, `Tell me safety tips, gear essentials, and route advice for ${trek.title}`)}
                className="p-2.5 rounded-xl bg-[#EFE5D2] hover:bg-[#E5D5BA] text-[#173B32] border border-[#E5D5BA] flex items-center justify-center cursor-pointer transition-colors"
                title="Ask VANVAS AI"
                aria-label="Ask VANVAS AI"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#B49252]" />
              </button>
            </div>
          </div>

          {/* Quick Scannable Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono pt-2 border-t border-[#E5D5BA]">
            <div className="p-2 rounded-xl bg-white border border-[#E5D5BA]">
              <span className="text-[9px] uppercase text-[#7B4D36] block">Distance</span>
              <span className="text-[#173B32] font-bold">{trek.totalDistanceKm} km round trip</span>
            </div>
            <div className="p-2 rounded-xl bg-white border border-[#E5D5BA]">
              <span className="text-[9px] uppercase text-[#7B4D36] block">Duration</span>
              <span className="text-[#173B32] font-bold">{trek.durationDays === 1 ? trek.durationHours : `${trek.durationDays} Days`}</span>
            </div>
            <div className="p-2 rounded-xl bg-white border border-[#E5D5BA]">
              <span className="text-[9px] uppercase text-[#7B4D36] block">Summit Altitude</span>
              <span className="text-[#173B32] font-bold">{trek.peakAltitudeFormatted}</span>
            </div>
            <div className="p-2 rounded-xl bg-white border border-[#E5D5BA]">
              <span className="text-[9px] uppercase text-[#7B4D36] block">Est. Budget</span>
              <span className="text-[#B65E3C] font-bold">₹{trek.approxBudgetPerPerson}/person</span>
            </div>
          </div>

          {/* Essential Safety Warnings Callout */}
          {trek.altitudeRiskIndicator?.includes("AMS") && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-mono flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="truncate sm:whitespace-normal">
                  <strong>HIGH ALTITUDE ACCLIMATIZATION REQUIRED:</strong> Trail ascends above 3,500m threshold. Do not rush elevation gain.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTrekTab("conditions")}
                className="underline text-amber-800 font-bold shrink-0 cursor-pointer text-[11px]"
              >
                Safety →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 3. COMPACT HORIZONTAL TAB BAR NAVIGATION */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-5">
        <VanvasTabBar<TrekTabType>
          tabs={[
            { id: "overview", label: "Overview", shortLabel: "About", icon: Mountain },
            { id: "route", label: "Route", icon: MapPin },
            { id: "conditions", label: "Safety", icon: Shield },
            { id: "gear", label: "Gear", icon: ShoppingBag },
            { id: "budget", label: "Budget", icon: DollarSign },
          ]}
          activeTab={activeTrekTab}
          onTabChange={setActiveTrekTab}
          layoutId="trekActiveTabPill"
          variant="parchment"
          className="max-w-2xl"
        />

        {/* 5. TAB PANELS */}
        <div className="mt-6">
          <AnimatePresence mode="wait">
            {/* TAB 1: OVERVIEW */}
            {activeTrekTab === "overview" && (
              <motion.div
                key="tab-trek-overview"
                variants={routeScreenVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                {/* Visual Terrain Image & Quick Context */}
                <div className="relative h-64 sm:h-80 w-full rounded-3xl overflow-hidden border-2 border-[#E5D5BA]">
                  <VanvasImage
                    src={trek.heroImage}
                    alt={trek.title}
                    priority={true}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs font-mono">
                    <span className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl">
                      🏔️ {trek.mountainRange} • Base: {trek.baseCamp}
                    </span>
                    <span className="bg-[#B65E3C] px-3 py-1.5 rounded-xl font-bold">
                      {trek.viewScore} SCENERY SCORE
                    </span>
                  </div>
                </div>

                {/* Ascent Route Comparison */}
                <div className="p-6 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#B65E3C] font-bold">
                        VERIFIED APPROACH TRAILS
                      </span>
                      <h3 className="font-serif font-bold text-xl text-[#173B32]">
                        Ascent Trail Options
                      </h3>
                    </div>
                    <span className="text-xs text-[#7B4D36] font-mono">
                      {trek.routes.length} Verified Option{trek.routes.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {trek.routes.map((route) => {
                      const isSelected = selectedRouteId === route.id;
                      return (
                        <div
                          key={route.id}
                          onClick={() => setSelectedRouteId(route.id)}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2.5 ${
                            isSelected
                              ? "bg-white border-[#173B32] shadow-sm"
                              : "bg-[#FAF7F0] border-[#E5D5BA] hover:bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-serif font-bold text-base text-[#173B32]">
                              {route.name}
                            </h4>
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#173B32]/10 text-[#173B32] font-bold">
                              {route.sceneryScore}
                            </span>
                          </div>

                          <p className="text-xs text-[#7B4D36] leading-relaxed">
                            {route.summary}
                          </p>

                          <div className="pt-2 border-t border-[#E5D5BA]/60 flex items-center justify-between text-xs font-mono text-[#173B32]">
                            <span>{route.distanceKm} km • {route.estimatedTime}</span>
                            <span className="text-[#B65E3C] font-bold">+{route.elevationGainMeters}m</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Fellowship & Circles */}
                <div className="p-6 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#B65E3C] font-bold uppercase tracking-wider">
                    <Users className="w-4 h-4" />
                    <span>Trek Circles • Fellow Trekkers</span>
                  </div>
                  <h3 className="font-serif font-bold text-xl text-[#173B32]">
                    Find Companions for {trek.title}
                  </h3>
                  <p className="text-xs text-[#7B4D36] leading-relaxed font-sans max-w-xl">
                    Connect with other solo adventurers planning this trail on compatible dates. Safety in numbers.
                  </p>
                  <div className="pt-2">
                    <TravelingSoloSection
                      destinationId={trek.id}
                      destinationName={trek.title}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 2: ROUTE & MAP */}
            {activeTrekTab === "route" && (
              <motion.div
                key="tab-trek-route"
                variants={routeScreenVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                {/* Leaflet Topographic Map */}
                <div className="p-4 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-lg text-[#173B32]">
                        Topographic Trail Map
                      </h3>
                      <p className="text-xs text-[#7B4D36]">
                        {trek.mountainRange} • Peak: {trek.peakAltitudeFormatted} • {trek.totalDistanceKm} km
                      </p>
                    </div>
                  </div>

                  <div className="h-80 sm:h-96 rounded-2xl overflow-hidden border border-[#E5D5BA]">
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
                          color: "#B65E3C",
                          elevationGain: trek.routes[0]?.elevationGainMeters || 1000,
                          distanceKm: trek.totalDistanceKm
                        }
                      ];

                      return (
                        <VanvasMap
                          mode="trek"
                          title={`${trek.title} Topographic Trail`}
                          center={{ lat: trek.waypoints[0]?.latitude || 30.48, lng: trek.waypoints[0]?.longitude || 79.2 }}
                          markers={mapMarkers}
                          routes={routeSegments}
                          selectedMarkerId={selectedWaypointId}
                          onSelectMarker={(m) => {
                            if (m) setSelectedWaypointId(m.id);
                          }}
                          height={380}
                        />
                      );
                    })()}
                  </div>
                </div>

                {/* Waypoints Sequence List */}
                <div className="p-6 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#B65E3C] font-bold">
                        ELEVATION PROFILE &amp; STAGES
                      </span>
                      <h3 className="font-serif font-bold text-xl text-[#173B32]">
                        Waypoints along the Trail
                      </h3>
                    </div>
                    <span className="text-xs text-[#7B4D36] font-mono">
                      {trek.waypoints.length} waypoints
                    </span>
                  </div>

                  <div className="space-y-3">
                    {trek.waypoints.map((wp, idx) => (
                      <div
                        key={wp.id}
                        onClick={() => setSelectedWaypointForModal(wp)}
                        className="p-4 rounded-2xl bg-white border border-[#E5D5BA] hover:border-[#173B32] transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                            wp.isSummit ? "bg-[#B65E3C] text-white" : "bg-[#173B32] text-white"
                          }`}>
                            {idx + 1}
                          </span>
                          <div>
                            <h4 className="font-serif font-bold text-sm text-[#173B32] group-hover:text-[#B65E3C] transition-colors">
                              {wp.name} <span className="text-xs text-[#7B4D36] font-devanagari font-normal">({wp.hindiName})</span>
                            </h4>
                            <span className="text-[11px] text-[#7B4D36]">
                              {wp.terrainType} • {wp.timeFromPrev}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-mono text-[#173B32]">
                          <span className="font-bold">{wp.elevationFormatted}</span>
                          <span className={wp.waterAvailable ? "text-emerald-700 font-bold" : "text-amber-700"}>
                            {wp.waterAvailable ? "💧 Water OK" : "⚠️ Carry Water"}
                          </span>
                          <span className="text-[#B65E3C] group-hover:translate-x-0.5 transition-transform">Details →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 3: CONDITIONS & SAFETY */}
            {activeTrekTab === "conditions" && (
              <motion.div
                key="tab-trek-conditions"
                variants={routeScreenVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                {/* Urgent Safety Guidelines Card */}
                <div className="p-6 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-4">
                  <div className="flex items-center gap-2 border-b border-[#E5D5BA] pb-3">
                    <Shield className="w-5 h-5 text-[#B65E3C]" />
                    <h3 className="font-serif font-bold text-xl text-[#173B32]">
                      Trail Safety &amp; Medical Directives
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-white border border-[#E5D5BA] space-y-1">
                      <span className="text-[10px] font-mono text-[#B65E3C] uppercase font-bold">Altitude Risk</span>
                      <h4 className="font-serif font-bold text-sm text-[#173B32]">{trek.altitudeRiskIndicator}</h4>
                      <p className="text-xs text-[#7B4D36]">
                        Drink 3-4 liters of water daily. If headache or nausea occurs, descend 300m immediately.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#E5D5BA] space-y-1">
                      <span className="text-[10px] font-mono text-[#B65E3C] uppercase font-bold">Mobile Network</span>
                      <h4 className="font-serif font-bold text-sm text-[#173B32]">{trek.fieldIntelligence.mobileNetwork}</h4>
                      <p className="text-xs text-[#7B4D36]">
                        Download offline maps before leaving roadhead.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#E5D5BA] space-y-1">
                      <span className="text-[10px] font-mono text-[#B65E3C] uppercase font-bold">Nearest Medical Aid</span>
                      <h4 className="font-serif font-bold text-sm text-[#173B32]">{trek.fieldIntelligence.nearestHospital}</h4>
                      <p className="text-xs text-[#7B4D36]">
                        Last motorable roadhead: {trek.fieldIntelligence.lastMotorablePoint}.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] space-y-1">
                    <span className="text-[10px] font-mono uppercase text-[#B65E3C] font-bold">
                      Permits &amp; Environmental Regulation
                    </span>
                    <p className="text-xs text-[#173B32] leading-relaxed">
                      {trek.fieldIntelligence.permitsRequired}
                    </p>
                  </div>
                </div>

                {/* Season & Weather Breakdown */}
                <div className="p-6 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-3">
                  <h3 className="font-serif font-bold text-lg text-[#173B32]">
                    Seasonality &amp; Access Windows
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#20211D]">
                    <div className="p-3.5 rounded-2xl bg-white border border-[#E5D5BA]">
                      <strong className="block text-[#173B32] mb-1">Prime Trekking Season:</strong>
                      {trek.fieldIntelligence.idealSeasonMonths}
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white border border-[#E5D5BA]">
                      <strong className="block text-[#173B32] mb-1">Winter Access &amp; Snow:</strong>
                      {trek.fieldIntelligence.winterAccess}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 4: GEAR & PREP */}
            {activeTrekTab === "gear" && (
              <motion.div
                key="tab-trek-gear"
                variants={routeScreenVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div className="p-6 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5D5BA] pb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#B65E3C] font-bold">
                        PACKING &amp; RENTALS
                      </span>
                      <h3 className="font-serif font-bold text-xl text-[#173B32]">
                        Gear Planner &amp; Optimizer
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 bg-[#EFE5D2] p-1 rounded-xl border border-[#E5D5BA]">
                      {(["STUDENT", "BUDGET", "STANDARD", "PREMIUM"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setGearMode(mode)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase transition-all cursor-pointer ${
                            gearMode === mode
                              ? "bg-[#173B32] text-[#FAF4E8]"
                              : "text-[#7B4D36] hover:text-[#173B32]"
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {trek.gearChecklist.map((item) => {
                      const currentAction =
                        gearActions[item.id] ||
                        (item.canSkip && gearMode === "STUDENT" ? "skip" : item.canBorrow ? "borrow" : "rent");

                      return (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-2xl bg-white border border-[#E5D5BA] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                                item.priority === "ESSENTIAL" ? "bg-rose-50 text-rose-800 border border-rose-200" : "bg-blue-50 text-blue-800 border border-blue-200"
                              }`}>
                                {item.priority}
                              </span>
                              <h4 className="font-serif font-bold text-sm text-[#173B32]">{item.name}</h4>
                            </div>
                            {gearMode === "STUDENT" && item.studentAlternative && (
                              <p className="text-xs text-[#B49252] font-sans">
                                Hack: {item.studentAlternative}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 text-xs font-mono">
                            <button
                              type="button"
                              onClick={() => setGearActions({ ...gearActions, [item.id]: "buy" })}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border cursor-pointer ${
                                currentAction === "buy" ? "bg-[#173B32] text-[#FAF4E8] border-[#173B32]" : "bg-[#FAF7F0] text-[#7B4D36] border-[#E5D5BA]"
                              }`}
                            >
                              Buy (₹{item.buyApproxCost})
                            </button>
                            <button
                              type="button"
                              onClick={() => setGearActions({ ...gearActions, [item.id]: "rent" })}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border cursor-pointer ${
                                currentAction === "rent" ? "bg-[#B65E3C] text-white border-[#B65E3C]" : "bg-[#FAF7F0] text-[#7B4D36] border-[#E5D5BA]"
                              }`}
                            >
                              Rent (₹{item.rentApproxCostPerDay * trek.durationDays})
                            </button>
                            {item.canBorrow && (
                              <button
                                type="button"
                                onClick={() => setGearActions({ ...gearActions, [item.id]: "borrow" })}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border cursor-pointer ${
                                  currentAction === "borrow" ? "bg-emerald-700 text-white border-emerald-700" : "bg-[#FAF7F0] text-[#7B4D36] border-[#E5D5BA]"
                                }`}
                              >
                                Borrow (₹0)
                              </button>
                            )}
                            {item.canSkip && (
                              <button
                                type="button"
                                onClick={() => setGearActions({ ...gearActions, [item.id]: "skip" })}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border cursor-pointer ${
                                  currentAction === "skip" ? "bg-stone-600 text-white border-stone-600" : "bg-[#FAF7F0] text-[#7B4D36] border-[#E5D5BA]"
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
                </div>
              </motion.div>
            )}

            {/* TAB 5: BUDGET */}
            {activeTrekTab === "budget" && (
              <motion.div
                key="tab-trek-budget"
                variants={routeScreenVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div className="p-6 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5D5BA] pb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#B65E3C] font-bold">
                        COST TRANSPARENCY
                      </span>
                      <h3 className="font-serif font-bold text-xl text-[#173B32]">
                        Trek Budget Calculator
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs font-mono">
                        <span className="text-[#7B4D36]">Group:</span>
                        {[1, 2, 3, 4, 6].map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setGroupSize(size)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              groupSize === size
                                ? "bg-[#173B32] text-white"
                                : "bg-white text-[#173B32] border border-[#E5D5BA]"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsGroupBudget(!isGroupBudget)}
                        className="px-3 py-1.5 rounded-xl bg-[#EFE5D2] border border-[#E5D5BA] text-xs font-mono font-bold text-[#173B32] cursor-pointer"
                      >
                        {isGroupBudget ? "Group Total" : "Per Person"}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-white border border-[#E5D5BA] text-center">
                      <span className="text-[10px] font-mono text-[#7B4D36] uppercase block">Base Expedition Cost</span>
                      <span className="text-xl font-serif font-black text-[#173B32]">
                        ₹{perPersonBaseBudget.toLocaleString()} / person
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#E5D5BA] text-center">
                      <span className="text-[10px] font-mono text-[#7B4D36] uppercase block">Gear Buffer</span>
                      <span className="text-xl font-serif font-black text-[#173B32]">
                        ₹{gearCost.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#E5D5BA] text-center">
                      <span className="text-[10px] font-mono text-[#7B4D36] uppercase block">
                        {isGroupBudget ? `Group of ${groupSize} Total` : "Total Per Person"}
                      </span>
                      <span className="text-xl font-serif font-black text-[#B65E3C]">
                        ≈ ₹{displayTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] text-xs font-mono text-[#7B4D36] space-y-1">
                    <div className="flex justify-between">
                      <span>Shared Sumo / Local Bus:</span>
                      <strong>₹{trek.budget.baseTransportCost}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Food &amp; Trail Rations:</span>
                      <strong>₹{trek.budget.foodPerDayCost * trek.durationDays}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Permits &amp; Eco Fees:</span>
                      <strong>₹{trek.budget.permitCost}</strong>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* WAYPOINT DETAIL MODAL */}
      <VanvasAdaptiveModal
        isOpen={Boolean(selectedWaypointForModal)}
        onClose={() => setSelectedWaypointForModal(null)}
        title={selectedWaypointForModal?.name}
        subtitle={selectedWaypointForModal ? `${selectedWaypointForModal.elevationFormatted} • ${selectedWaypointForModal.terrainType}` : undefined}
      >
        {selectedWaypointForModal && (
          <div className="space-y-4">
            <div className="relative h-44 rounded-2xl overflow-hidden border border-[#E5D5BA]">
              <VanvasImage
                src={selectedWaypointForModal.imageUrl || trek.heroImage}
                alt={selectedWaypointForModal.name}
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-xs text-[#20211D]/90 leading-relaxed font-sans">
              {selectedWaypointForModal.fieldNotes}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-[#EFE5D2] border border-[#E5D5BA]">
                <span className="block text-[10px] text-[#7B4D36]">Water Status</span>
                <span className={selectedWaypointForModal.waterAvailable ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>
                  {selectedWaypointForModal.waterAvailable ? "Active Spring" : "No Water Source"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#EFE5D2] border border-[#E5D5BA]">
                <span className="block text-[10px] text-[#7B4D36]">Ascent Time</span>
                <span className="font-bold text-[#173B32]">
                  {selectedWaypointForModal.timeFromPrev}
                </span>
              </div>
            </div>
          </div>
        )}
      </VanvasAdaptiveModal>
    </div>
  );
}
