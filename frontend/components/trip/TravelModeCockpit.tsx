"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Compass, Navigation, Clock, Sun, Wallet, Plus, Sparkles,
  MapPin, AlertTriangle, ShieldCheck, Phone, CheckCircle2,
  BookOpen, ArrowRight, ExternalLink, Coffee, BedDouble, Bike,
  Droplets, Wind, Share2, Layers
} from "lucide-react";
import { Trip, ItineraryItem, StructuredWeather, BudgetSummary } from "@/types";

interface TravelModeCockpitProps {
  trip: Trip;
  weather?: StructuredWeather | null;
  budget?: BudgetSummary | null;
  currentDayNumber: number;
  onOpenExpenseModal: () => void;
  onOpenReplanModal: () => void;
  onOpenImHereModal: () => void;
  onToggleItemStatus: (itemId: string, currentStatus: string) => void;
  onOpenAskVanvas: () => void;
}

export const TravelModeCockpit: React.FC<TravelModeCockpitProps> = ({
  trip,
  weather,
  budget,
  currentDayNumber,
  onOpenExpenseModal,
  onOpenReplanModal,
  onOpenImHereModal,
  onToggleItemStatus,
  onOpenAskVanvas,
}) => {
  const [activeLocationOverride, setActiveLocationOverride] = useState<string | null>(null);

  const dayItinerary = trip.itineraries.find((it) => it.day_number === currentDayNumber) || trip.itineraries[0];
  const items = dayItinerary?.items || [];
  
  // Find current and next item
  const upcomingItems = items.filter((i) => i.status !== "completed");
  const completedItems = items.filter((i) => i.status === "completed");
  const nextItem = upcomingItems[0] || items[items.length - 1] || null;
  const currentItem = completedItems.length > 0 && upcomingItems.length > 0 
    ? completedItems[completedItems.length - 1] 
    : items[0] || null;

  const destName = trip.destination?.name || "Valley";
  const stateName = trip.destination?.state || "India";
  const whereAmI = activeLocationOverride || currentItem?.title || `${destName} Basecamp`;

  const todaySpend = budget?.total_spent || trip.budget_spent || 0;
  const tempC = weather?.temperature !== null && weather?.temperature !== undefined 
    ? Math.round(weather.temperature) 
    : 22;
  const condition = weather?.condition || trip.destination?.weather_type || "Pleasant";

  // Navigation URL for next item
  const navUrl = nextItem 
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${nextItem.title}, ${destName}`)}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destName)}`;

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 1. TOP LIVE STATUS BAR (Sticky feel, high information density, calm aesthetics) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#173B32] text-[#EFE5D2] border-2 border-[#B49252] shadow-xl relative overflow-hidden">
        {/* Subtle Ambient Vignette */}
        <div className="absolute top-0 right-0 w-64 h-32 bg-gradient-to-l from-[#B49252]/15 to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-3">
          {/* Badge & Active Day */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#B49252]">
                TRAVEL MODE ACTIVE · DAY {String(currentDayNumber).padStart(2, "0")}
              </span>
            </div>

            <button
              onClick={onOpenReplanModal}
              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-[10px] font-mono font-bold text-[#EFE5D2] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Sparkles className="w-3 h-3 text-[#B49252]" />
              <span>Adjust / Replan</span>
            </button>
          </div>

          {/* 5 Core Questions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
            {/* Q1: WHERE AM I? */}
            <div className="md:col-span-4 p-3 rounded-2xl bg-black/30 border border-white/10 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-mono uppercase text-[#B49252] font-bold block">
                  WHERE AM I?
                </span>
                <div className="font-serif font-black text-lg text-[#FAF4E8] truncate mt-0.5" title={whereAmI}>
                  {whereAmI}
                </div>
                <span className="text-[10px] font-mono text-[#D8DED5]/80">
                  {destName}, {stateName}
                </span>
              </div>
              <button
                onClick={onOpenImHereModal}
                className="mt-2 text-[10px] font-mono font-bold text-[#B49252] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <MapPin className="w-3 h-3" />
                <span>Update / Set Stop →</span>
              </button>
            </div>

            {/* Q2: WHAT'S NEXT? & HOW DO I GET THERE? */}
            <div className="md:col-span-5 p-3 rounded-2xl bg-black/30 border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono uppercase text-[#B49252] font-bold">
                    WHAT&apos;S NEXT?
                  </span>
                  {nextItem && (
                    <span className="text-[10px] font-mono font-bold text-amber-300">
                      {nextItem.start_time}
                    </span>
                  )}
                </div>
                <div className="font-serif font-black text-lg text-[#FAF4E8] truncate mt-0.5">
                  {nextItem?.title || "End of Scheduled Day"}
                </div>
                <p className="text-[10px] text-[#D8DED5]/80 line-clamp-1 mt-0.5">
                  {nextItem?.notes || "Take a relaxed evening walk or unwind at your stay."}
                </p>
              </div>

              {nextItem && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                  <a
                    href={navUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 px-3 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-white text-xs font-bold font-mono text-center flex items-center justify-center gap-1 shadow-xs transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Navigate Now</span>
                  </a>
                  <button
                    onClick={() => onToggleItemStatus(nextItem.id, nextItem.status)}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-[#FAF4E8] text-xs font-mono cursor-pointer"
                    title="Mark Done"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </button>
                </div>
              )}
            </div>

            {/* Q3: WHAT DOES IT COST? & Q4: WEATHER */}
            <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-1 gap-2">
              {/* Cost snippet */}
              <div className="p-2.5 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[8.5px] font-mono uppercase text-[#B49252] font-bold block">
                    SPEND TODAY
                  </span>
                  <span className="font-mono font-black text-base text-[#FAF4E8]">
                    ₹{todaySpend.toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={onOpenExpenseModal}
                  className="w-7 h-7 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-white flex items-center justify-center cursor-pointer shadow-xs"
                  title="Add Expense"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Weather snippet */}
              <div className="p-2.5 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[8.5px] font-mono uppercase text-[#B49252] font-bold block">
                    WEATHER
                  </span>
                  <span className="font-mono font-bold text-xs text-[#FAF4E8]">
                    {tempC}°C · {condition}
                  </span>
                </div>
                <Sun className="w-5 h-5 text-amber-400 shrink-0" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TODAY'S HORIZONTAL ITINERARY RAIL (Quick tap, swipe, checklist status) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#173B32]">
            Today&apos;s Timeline ({items.length} Stops)
          </span>
          <span className="text-[10px] font-mono text-[#7B4D36]">
            {completedItems.length}/{items.length} Completed
          </span>
        </div>

        <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-none">
          {items.map((it, idx) => {
            const isDone = it.status === "completed";
            const isNext = nextItem?.id === it.id;
            return (
              <div
                key={it.id || idx}
                className={`min-w-[240px] max-w-[280px] shrink-0 p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-2 ${
                  isNext
                    ? "bg-[#FAF7F0] border-[#173B32] shadow-md ring-2 ring-[#173B32]/20"
                    : isDone
                    ? "bg-[#EAE4D7] border-[#D5C9B3] opacity-75"
                    : "bg-[#FAF7F0] border-[#E5D5BA]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#173B32] text-[#EFE5D2]">
                      {it.start_time}
                    </span>
                    <button
                      onClick={() => onToggleItemStatus(it.id, it.status)}
                      className={`cursor-pointer transition-colors ${isDone ? "text-emerald-700" : "text-[#7B4D36] hover:text-emerald-700"}`}
                      title={isDone ? "Mark upcoming" : "Mark completed"}
                    >
                      <CheckCircle2 className={`w-4 h-4 ${isDone ? "fill-emerald-200" : ""}`} />
                    </button>
                  </div>

                  <h4 className={`font-serif font-bold text-sm text-[#173B32] line-clamp-1 ${isDone ? "line-through opacity-70" : ""}`}>
                    {it.title}
                  </h4>
                  <p className="text-[10px] text-[#20211D]/70 line-clamp-2 mt-0.5">
                    {it.notes || "Exploration checkpoint."}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E5D5BA] text-[10px] font-mono">
                  <span className="text-[#7B4D36]">
                    {it.duration_mins || 60}m duration
                  </span>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${it.title}, ${destName}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#B65E3C] hover:underline flex items-center gap-0.5 font-bold"
                  >
                    <span>Maps</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. CONTEXTUAL TRAVEL ACTIONS & SAFETY RAIL */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        <Link
          href={`/trips/${trip.id}/journal`}
          className="p-3 rounded-2xl bg-[#FAF7F0] hover:bg-[#EFE5D2] border border-[#E5D5BA] flex items-center gap-2.5 transition-colors shadow-xs"
        >
          <div className="w-8 h-8 rounded-xl bg-[#173B32] text-[#EFE5D2] flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-[#B49252]" />
          </div>
          <div className="truncate">
            <span className="text-[9px] font-mono uppercase text-[#7B4D36] block font-bold">JOURNAL</span>
            <span className="text-xs font-bold text-[#173B32] block truncate">+ Add Memory</span>
          </div>
        </Link>

        <button
          onClick={onOpenExpenseModal}
          className="p-3 rounded-2xl bg-[#FAF7F0] hover:bg-[#EFE5D2] border border-[#E5D5BA] flex items-center gap-2.5 text-left transition-colors cursor-pointer shadow-xs"
        >
          <div className="w-8 h-8 rounded-xl bg-[#173B32] text-[#EFE5D2] flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4 text-[#B49252]" />
          </div>
          <div className="truncate">
            <span className="text-[9px] font-mono uppercase text-[#7B4D36] block font-bold">EXPENSES</span>
            <span className="text-xs font-bold text-[#173B32] block truncate">+ Log Expense</span>
          </div>
        </button>

        <a
          href="tel:112"
          className="p-3 rounded-2xl bg-[#FAF7F0] hover:bg-rose-50 border border-[#E5D5BA] flex items-center gap-2.5 transition-colors shadow-xs"
          title="Emergency Police & Rescue 112"
        >
          <div className="w-8 h-8 rounded-xl bg-rose-800 text-white flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4 text-rose-200" />
          </div>
          <div className="truncate">
            <span className="text-[9px] font-mono uppercase text-rose-800 block font-bold">SAFETY · SOS</span>
            <span className="text-xs font-bold text-rose-900 block truncate">Call 112 / Help</span>
          </div>
        </a>

        <button
          onClick={onOpenAskVanvas}
          className="p-3 rounded-2xl bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] flex items-center gap-2.5 text-left transition-colors cursor-pointer shadow-xs"
        >
          <div className="w-8 h-8 rounded-xl bg-[#B49252] text-[#173B32] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="truncate">
            <span className="text-[9px] font-mono uppercase text-[#B49252] block font-bold">COPILOT</span>
            <span className="text-xs font-bold text-[#FAF4E8] block truncate">Ask VANVAS</span>
          </div>
        </button>
      </div>
    </div>
  );
};
