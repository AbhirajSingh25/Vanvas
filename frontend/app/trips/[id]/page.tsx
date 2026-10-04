"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Sparkles, Navigation, Clock, CloudRain, Wallet, Users, Compass,
  MapPin, CheckCircle2, Circle, Lock, Unlock, Plus, Trash2,
  ExternalLink, Share2, MessageSquare, Coffee, BedDouble, Bike,
  CheckSquare, ArrowRight, ShieldCheck, Sun, Info, Heart, Printer,
  Bus, Train, Plane, Car, CarTaxiFront, History, FastForward,
  AlertTriangle, RefreshCw, X
} from "lucide-react";
import { api } from "@/lib/api";
import {
  Trip, BudgetSummary, GroupSummary, ChecklistItem,
  ArrivalOptimizerResponse, StructuredWeather, ActionPreviewResponse,
  ItineraryItem
} from "@/types";
import { VanvasWeatherCard } from "@/components/weather";
import { ImHereDrawer } from "@/components/trip/ImHereDrawer";
import { DynamicReplanModal } from "@/components/trip/DynamicReplanModal";
import { QuickPlanModal } from "@/components/trip/QuickPlanModal";
import { ActionPreviewModal } from "@/components/trip/ActionPreviewModal";
import { RunningLateModal } from "@/components/trip/RunningLateModal";
import { MissedActivityModal } from "@/components/trip/MissedActivityModal";
import { AddPlaceModal } from "@/components/trip/AddPlaceModal";
import { TripRevisionsModal } from "@/components/trip/TripRevisionsModal";
import { ExpenseModal } from "@/components/trip/ExpenseModal";
import { VotingCard } from "@/components/trip/VotingCard";
import { ArrivalOptimizerCard } from "@/components/trip/ArrivalOptimizerCard";
import { PlaceModal } from "@/components/places/PlaceModal";
import { TravelStamp } from "@/components/ui/TravelStamp";
import { VehicleArtwork } from "@/components/ui/VehicleArtwork";
import { TripInviteModal } from "@/components/trip/TripInviteModal";
import { TripMembersSection } from "@/components/trip/TripMembersSection";
import { TravelingSoloSection } from "@/components/solo/TravelingSoloSection";
import { useDensity } from "@/context/DensityContext";
import { useAskVanvas } from "@/context/AskVanvasContext";
import { TravelModeCockpit } from "@/components/trip/TravelModeCockpit";
import { OfflineTripPackDrawer } from "@/components/trip/OfflineTripPackDrawer";
import { CompactItineraryItem, CompactStayCard, CompactRentalCard } from "@/components/compact";
import { VanvasSplitView } from "@/components/trip/VanvasSplitView";

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tripId } = use(params);
  const { isCompact } = useDensity();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripWeather, setTripWeather] = useState<StructuredWeather | null>(null);
  const [budgetData, setBudgetData] = useState<BudgetSummary | null>(null);
  const [groupData, setGroupData] = useState<GroupSummary | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [arrivalData, setArrivalData] = useState<ArrivalOptimizerResponse | null>(null);
  const [offlinePackOpen, setOfflinePackOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Active Tab: 'overview' | 'itinerary' | 'stays_rentals' | 'food' | 'budget' | 'group' | 'checklist'
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (typeof window !== "undefined") {
      const tabsElement = document.getElementById("trip-tabs-navigation");
      if (tabsElement) {
        const navOffset = tabsElement.getBoundingClientRect().top + window.scrollY - 80;
        if (window.scrollY > navOffset) {
          window.scrollTo({ top: navOffset, behavior: "smooth" });
        }
      }
    }
  };

  // Ask VANVAS Unified Copilot
  const { openAskVanvas, setTravelContext, registerTripRefreshCallback } = useAskVanvas();

  // Modals
  const [imHereOpen, setImHereOpen] = useState(false);
  const [replanOpen, setReplanOpen] = useState(false);
  const [quickPlanOpen, setQuickPlanOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [actionPreview, setActionPreview] = useState<ActionPreviewResponse | null>(null);
  const [lateModalOpen, setLateModalOpen] = useState(false);
  const [missedItem, setMissedItem] = useState<ItineraryItem | null>(null);
  const [addPlaceOpen, setAddPlaceOpen] = useState(false);
  const [revisionsOpen, setRevisionsOpen] = useState(false);
  const [newChecklistInput, setNewChecklistInput] = useState("");
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const handleActionApplied = (updatedTrip: Trip, message: string) => {
    setTrip(updatedTrip);
    setNotificationMsg(message);
    setTimeout(() => setNotificationMsg(null), 5000);
    loadTripData();
  };

  const handleSwapItem = async (item: ItineraryItem) => {
    try {
      const prev = await api.previewTripAction(tripId, {
        action_type: "SWAP_ACTIVITY",
        target_day_number: selectedDayNumber,
        target_item_id: item.id
      });
      setActionPreview(prev);
    } catch (err: any) {
      console.error("Failed to preview swap:", err);
    }
  };

  const handleRemoveItem = async (item: ItineraryItem) => {
    try {
      const prev = await api.previewTripAction(tripId, {
        action_type: "REMOVE_ACTIVITY",
        target_day_number: selectedDayNumber,
        target_item_id: item.id
      });
      setActionPreview(prev);
    } catch (err: any) {
      console.error("Failed to preview remove:", err);
    }
  };

  const parsedTransport = React.useMemo(() => {
    if (!trip) return null;
    if (trip.transport_details_json) {
      try {
        return typeof trip.transport_details_json === "string"
          ? JSON.parse(trip.transport_details_json)
          : trip.transport_details_json;
      } catch {
        return null;
      }
    }
    return null;
  }, [trip]);

  const loadTripData = async () => {
    try {
      const t = await api.getTrip(tripId);
      setTrip(t);
      if (t.itineraries && t.itineraries.length > 0) {
        setSelectedDayNumber(t.itineraries[0].day_number);
      }

      // Sync Trip Context to Ask VANVAS with active day
      setTravelContext({
        type: "trip",
        tripId: t.id,
        trip: t,
        destinationName: t.destination?.name,
        destinationSlug: t.destination?.slug,
        activeDayNumber: t.itineraries && t.itineraries.length > 0 ? t.itineraries[0].day_number : 1,
        title: `ASK VANVAS · ${t.title?.toUpperCase() || "YOUR TRIP"}`,
        subtitle: `Trip · ${t.num_days || 4} days · Active itinerary`,
      });

      // Fetch supplementary data
      api.getBudget(tripId).then(setBudgetData).catch(() => {});
      api.getGroupDetails(tripId).then(setGroupData).catch(() => {});
      api.getChecklist(tripId).then(setChecklist).catch(() => {});
      api.optimizeArrival(t.destination_id, "Delhi", t.start_date).then(setArrivalData).catch(() => {});
      if (t.destination?.slug || t.destination_id) {
        api.getDestinationWeather(t.destination?.slug || t.destination_id).then(setTripWeather).catch(() => {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTripData();
  }, [tripId]);

  // Sync selectedDayNumber to Ask VANVAS context whenever it changes
  useEffect(() => {
    if (trip) {
      setTravelContext({
        type: "trip",
        tripId: trip.id,
        trip: trip,
        destinationName: trip.destination?.name,
        destinationSlug: trip.destination?.slug,
        activeDayNumber: selectedDayNumber || 1,
        title: `ASK VANVAS · ${trip.title?.toUpperCase() || "YOUR TRIP"}`,
        subtitle: `Trip · Day ${selectedDayNumber || 1} of ${trip.num_days || 4} · Active itinerary`,
      });
    }
  }, [selectedDayNumber, trip?.id, setTravelContext]);

  // Register real-time trip refresh callback when Ask VANVAS mutates itinerary
  useEffect(() => {
    return registerTripRefreshCallback(() => {
      loadTripData();
    });
  }, [registerTripRefreshCallback]);

  const handleToggleItemStatus = async (itemId: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "upcoming" : "completed";
    try {
      await api.updateItineraryItem(tripId, itemId, newStatus);
      if (trip) {
        const updatedIts = trip.itineraries.map((day) => ({
          ...day,
          items: day.items.map((it) => (it.id === itemId ? { ...it, status: newStatus } : it)),
        }));
        setTrip({ ...trip, itineraries: updatedIts });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleLock = async (itemId: string, currentLock: boolean) => {
    try {
      await api.updateItineraryItem(tripId, itemId, undefined, !currentLock);
      if (trip) {
        const updatedIts = trip.itineraries.map((day) => ({
          ...day,
          items: day.items.map((it) => (it.id === itemId ? { ...it, is_locked: !currentLock } : it)),
        }));
        setTrip({ ...trip, itineraries: updatedIts });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChecklistToggle = async (itemId: string, isChecked: boolean) => {
    try {
      await api.toggleChecklistItem(tripId, itemId, !isChecked);
      setChecklist((prev) => prev.map((c) => (c.id === itemId ? { ...c, is_checked: !isChecked } : c)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistInput.trim()) return;
    try {
      const item = await api.addChecklistItem(tripId, "Custom", newChecklistInput.trim());
      setChecklist((prev) => [...prev, item]);
      setNewChecklistInput("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopilotTriggerAction = async (actionType: string, payload?: any) => {
    if (actionType === "view_quick_plan") {
      setQuickPlanOpen(true);
    } else if (actionType === "replan" || actionType === "dynamic_replan") {
      setReplanOpen(true);
    } else if (actionType === "im_here") {
      setImHereOpen(true);
    } else if (actionType === "expense" || actionType === "log_expense") {
      setExpenseModalOpen(true);
    } else if (actionType === "invite" || actionType === "share_trip") {
      setInviteModalOpen(true);
    } else if (actionType === "refresh_itinerary" || actionType === "add_place_to_itinerary") {
      await loadTripData();
      setNotificationMsg("Itinerary updated with new stop.");
      setTimeout(() => setNotificationMsg(null), 4000);
    } else if (actionType === "switch_tab" && payload?.tab) {
      handleTabChange(payload.tab);
    }
  };

  const handleReplanSuccess = (updatedTrip: Trip, msg: string) => {
    setTrip(updatedTrip);
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 6000);
  };

  const handleCopyInvite = () => {
    if (typeof window !== "undefined" && trip) {
      navigator.clipboard.writeText(`${window.location.origin}/trips/${trip.id}?join=${trip.invite_code}`);
      setNotificationMsg("Invite link copied to clipboard! Share with friends to vote privately.");
      setTimeout(() => setNotificationMsg(null), 4000);
    }
  };

  if (loading || !trip) {
    return (
      <div className="min-h-screen bg-[#EFE5D2] flex flex-col items-center justify-center text-[#173B32] gap-3">
        <div className="w-10 h-10 border-3 border-[#B65E3C] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-serif italic text-[#7B4D36]">Opening expedition operating hub...</span>
      </div>
    );
  }

  const currentDayItinerary = trip.itineraries.find((it) => it.day_number === selectedDayNumber) || trip.itineraries[0];
  const remainingBudget = Math.max(0, (trip.budget_total || 10000) - (trip.budget_spent || 0));

  return (
    <div className="min-h-screen bg-[#EFE5D2] pb-28">
      {/* Toast Notification Banner */}
      {notificationMsg && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-[#173B32] text-[#EFE5D2] px-6 py-3 rounded-2xl shadow-2xl text-xs font-semibold border-2 border-[#B49252] flex items-center gap-2 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-[#B49252]" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Hero / Header Section (Compact Field Guide vs Original Immersive Banner) */}
      {isCompact ? (
        <section className="bg-[#FAF7F0] border-b-2 border-[#E5D5BA] px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* Top Identity & Badges */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#173B32] text-[#EFE5D2] text-[9.5px] font-mono font-bold uppercase tracking-wider">
                    FIELD PLAN
                  </span>
                  <span className="text-xs font-mono text-[#7B4D36]">
                    {trip.destination?.state || "Himachal Pradesh"}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-[#173B32]">
                  {trip.destination?.name?.toUpperCase() || "MANALI"}
                </h1>
              </div>

              {/* Compact Summary Chips: DATES · TRAVELLERS · BUDGET · STYLE */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="px-3 py-1.5 rounded-xl bg-[#EFE5D2] border border-[#E5D5BA] text-[#173B32] font-bold">
                  {trip.start_date && trip.end_date ? `${trip.start_date.slice(5)} → ${trip.end_date.slice(5)}` : "12–16 OCT"}
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-[#EFE5D2] border border-[#E5D5BA] text-[#173B32] font-bold">
                  {trip.num_days} DAYS · {trip.travellers_count || 2} TRAVELLERS
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-[#173B32] text-[#B49252] font-bold">
                  ₹{Math.round((trip.budget_total || 25000) / 1000)}K EST.
                </span>
                <span className="px-2.5 py-1.5 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] text-[#7B4D36] font-bold uppercase">
                  {trip.travel_style || "BACKPACKER"}
                </span>
              </div>
            </div>

            {/* Interests Chips (Emojis) */}
            {(() => {
              const parsedInterests = Array.isArray(trip.interests)
                ? trip.interests
                : typeof trip.interests === "string"
                ? (trip.interests as string).split(",").map((s) => s.trim()).filter(Boolean)
                : [];
              if (parsedInterests.length === 0) return null;
              return (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#7B4D36] mr-1">Interests:</span>
                  {parsedInterests.map((interest: string, idx: number) => {
                    const getEmoji = (txt: string) => {
                      const l = txt.toLowerCase();
                      if (l.includes("mountain") || l.includes("trek")) return "🏔️";
                      if (l.includes("caf") || l.includes("coffee")) return "☕";
                      if (l.includes("photo")) return "📷";
                      if (l.includes("food") || l.includes("eat")) return "🍜";
                      if (l.includes("nature") || l.includes("forest")) return "🌲";
                      if (l.includes("cultur") || l.includes("temple")) return "🛕";
                      return "✨";
                    };
                    return (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg bg-white border border-[#E5D5BA] text-xs font-medium text-[#173B32] flex items-center gap-1"
                      >
                        <span>{getEmoji(interest)}</span>
                        <span>{interest}</span>
                      </span>
                    );
                  })}
                </div>
              );
            })()}

            {/* Compact Summary Row: STAYS · GETTING AROUND · WEATHER */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#E5D5BA] text-xs font-mono">
              <button
                type="button"
                onClick={() => handleTabChange("stays_rentals")}
                className="p-2.5 rounded-xl bg-[#EFE5D2] hover:bg-[#E5D5BA] border border-[#E5D5BA] text-left flex items-center justify-between cursor-pointer transition-colors"
              >
                <div>
                  <span className="text-[9px] uppercase text-[#7B4D36] block font-bold">STAYS</span>
                  <span className="font-bold text-[#173B32] truncate max-w-[120px] sm:max-w-none block">{trip.hotel ? trip.hotel.name : "5 options"}</span>
                </div>
                <BedDouble className="w-4 h-4 text-[#B65E3C] shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("stays_rentals")}
                className="p-2.5 rounded-xl bg-[#EFE5D2] hover:bg-[#E5D5BA] border border-[#E5D5BA] text-left flex items-center justify-between cursor-pointer transition-colors"
              >
                <div>
                  <span className="text-[9px] uppercase text-[#7B4D36] block font-bold">GETTING AROUND</span>
                  <span className="font-bold text-[#173B32] truncate max-w-[120px] sm:max-w-none block">{trip.rental ? trip.rental.vehicle_name : "4 rentals"}</span>
                </div>
                <Bike className="w-4 h-4 text-[#B65E3C] shrink-0" />
              </button>

              <div className="p-2.5 rounded-xl bg-[#EFE5D2] border border-[#E5D5BA] text-left flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase text-[#7B4D36] block font-bold">WEATHER</span>
                  <span className="font-bold text-[#173B32]">
                    {tripWeather && tripWeather.temperature !== null
                      ? `${Math.round(tripWeather.temperature)}°C`
                      : (trip.destination?.weather_type || "Live feed")}
                  </span>
                </div>
                <Sun className="w-4 h-4 text-amber-600 shrink-0" />
              </div>

              <div className="p-2.5 rounded-xl bg-[#EFE5D2] border border-[#E5D5BA] text-left flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase text-[#7B4D36] block font-bold">PROGRESS</span>
                  <span className="font-bold text-[#173B32]">
                    {trip.itineraries.reduce((acc, d) => acc + d.items.filter(i => i.status === "completed").length, 0)} / {trip.itineraries.reduce((acc, d) => acc + d.items.length, 0)} stops
                  </span>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              </div>
            </div>

            {/* Compact Actions Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E5D5BA]">
              <button
                onClick={() => setImHereOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Navigation className="w-3.5 h-3.5 text-[#B49252]" />
                <span>I&rsquo;m Here</span>
              </button>

              <button
                onClick={() => setReplanOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#EFE5D2] border border-[#E5D5BA] text-xs font-bold text-[#173B32] flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#B65E3C]" />
                <span>Replan / Adjust</span>
              </button>

              <button
                onClick={() => setInviteModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#EFE5D2] border border-[#E5D5BA] text-xs font-bold text-[#173B32] flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-[#B49252]" />
                <span>Share</span>
              </button>

              <button
                onClick={() => setOfflinePackOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#EFE5D2] border border-[#E5D5BA] text-xs font-bold text-[#173B32] flex items-center gap-1.5 cursor-pointer"
                title="Download or Print Offline Trip Pack"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Offline Pack</span>
              </button>

              <Link
                href={`/trips/${trip.id}/journal`}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#EFE5D2] border border-[#E5D5BA] text-xs font-bold text-[#173B32] flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-[#B49252]" />
                <span>Journal</span>
              </Link>

              <button
                onClick={() => openAskVanvas()}
                className="px-3.5 py-2 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] font-bold text-xs flex items-center gap-1.5 ml-auto cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#B49252]" />
                <span>Ask VANVAS</span>
              </button>
            </div>
          </div>
        </section>
      ) : (
        /* Hero Header Banner (Original Mode) */
        <section className="relative bg-[#0F2924] text-[#EFE5D2] px-4 sm:px-6 lg:px-8 pt-10 pb-14 overflow-hidden">
          {trip.destination?.hero_image && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity"
              style={{ backgroundImage: `url(${trip.destination.hero_image})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F2924]/90 via-[#0F2924]/80 to-[#0F2924]" />

          <div className="relative z-10 max-w-7xl mx-auto space-y-6">
            {/* Top Info Strip */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs">
                <TravelStamp label={`${trip.companion_type} JOURNEY`} variant="terracotta" />
                <TravelStamp label={`${trip.travel_style} STYLE`} variant="forest" />
                <TravelStamp label={`${trip.num_days} DAYS`} variant="mustard" />
              </div>

              <div className="flex items-center gap-2">
                {/* Offline Pack */}
                <button
                  onClick={() => setOfflinePackOpen(true)}
                  className="px-4 py-1.5 rounded-xl bg-emerald-900/40 hover:bg-emerald-800/50 border border-emerald-500/40 text-xs text-emerald-200 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Offline Trip Pack & Safe Pass"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Offline Pack</span>
                </button>

                {/* Print / Export Journal Link */}
                <Link
                  href={`/trips/${trip.id}/journal`}
                  className="px-4 py-1.5 rounded-xl bg-[#B49252]/20 hover:bg-[#B49252]/30 border border-[#B49252]/40 text-xs text-[#EFE5D2] font-semibold flex items-center gap-1.5 transition-colors"
                  title="Print or Export Travel Journal"
                >
                  <Printer className="w-3.5 h-3.5 text-[#B49252]" />
                  <span>Travel Journal</span>
                </Link>

                {/* Invite Button */}
                <button
                  onClick={() => setInviteModalOpen(true)}
                  className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs text-[#EFE5D2] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#B49252]" />
                  <span>Invite Friends ({trip.invite_code})</span>
                </button>
              </div>
            </div>

            {/* Title & Dates */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <span className="text-sm font-serif text-[#B49252] block">तुम्हारी यात्रा • Active Expedition</span>
                <h1 className="text-3xl sm:text-6xl font-serif font-black tracking-tight text-[#EFE5D2]">
                  {trip.destination?.name || "Himalayan"} Trail Hub
                </h1>
                <p className="text-xs text-[#D8DED5] mt-1.5 flex items-center gap-2 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-[#B65E3C]" />
                  <span>{trip.destination?.state}, {trip.destination?.region}</span>
                  <span>•</span>
                  <span>{trip.start_date} to {trip.end_date}</span>
                </p>
              </div>

              {/* Budget Gauge */}
              <div className="flex items-center gap-5 bg-black/40 backdrop-blur-md px-6 py-3.5 rounded-2xl border border-white/10">
                <div>
                  <div className="text-[10px] text-[#D8DED5]/70 uppercase font-bold tracking-wider">Remaining Budget</div>
                  <div className="text-2xl font-mono font-bold text-[#B49252]">₹{Math.round(remainingBudget).toLocaleString()}</div>
                </div>
                <div className="h-9 w-[1px] bg-white/20" />
                <div>
                  <div className="text-[10px] text-[#D8DED5]/70 uppercase font-bold tracking-wider">Spent</div>
                  <div className="text-sm font-mono font-bold text-[#EFE5D2]">₹{Math.round(trip.budget_spent || 0).toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Prominent Action Floating Triggers */}
            <div className="pt-2 flex flex-wrap gap-3">
              {/* I'M HERE Main Trigger */}
              <button
                onClick={() => setImHereOpen(true)}
                className="px-6 py-3 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] font-bold text-xs uppercase tracking-wider shadow-xl transition-all transform active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Navigation className="w-4 h-4 text-[#B49252] animate-pulse" />
                <span>I&rsquo;M HERE ARRIVAL MODE</span>
              </button>

              {/* Quick Plan Trigger */}
              <button
                onClick={() => setQuickPlanOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-[#EFE5D2] font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Clock className="w-4 h-4 text-[#B49252]" />
                <span>Plan Next 3 Hours</span>
              </button>

              {/* Dynamic Replan Trigger */}
              <button
                onClick={() => setReplanOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-[#EFE5D2] font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CloudRain className="w-4 h-4 text-emerald-300" />
                <span>Late / Raining / Tired?</span>
              </button>

              {/* Print / Export Journal Trigger */}
              <Link
                href={`/trips/${trip.id}/journal`}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-[#EFE5D2] font-semibold text-xs transition-all flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-[#B49252]" />
                <span>Export Journal</span>
              </Link>

              {/* AI Copilot Trigger */}
              <button
                onClick={() => openAskVanvas()}
                className="px-5 py-2.5 rounded-xl bg-[#B49252] hover:bg-[#9E7D3F] text-[#0F2924] font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ml-auto cursor-pointer shadow-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ask VANVAS</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Main Navigation Tabs */}
      <div id="trip-tabs-navigation" className="sticky top-20 z-30 bg-[#FAF7F0] border-b-2 border-[#E5D5BA] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-none">
          {[
            { id: "overview", label: "Overview", icon: Compass },
            { id: "itinerary", label: "Itinerary", icon: Clock },
            { id: "stays_rentals", label: "Stay & Rentals", icon: BedDouble },
            { id: "food", label: "Food Along Route", icon: Coffee },
            { id: "budget", label: "Budget & Split", icon: Wallet },
            { id: "group", label: "Group & Voting", icon: Users },
            { id: "circles", label: "Solo Circles", icon: Users },
            { id: "checklist", label: "Checklist", icon: CheckSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-[#173B32] text-[#EFE5D2] shadow-xs"
                    : "text-[#20211D]/80 hover:text-[#173B32] hover:bg-[#E5D5BA]/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Panels */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Travel Mode Cockpit (5 Core Questions: Where am I? What's next? How do I get there? Cost? Weather?) */}
            <TravelModeCockpit
              trip={trip}
              weather={tripWeather}
              budget={budgetData}
              currentDayNumber={selectedDayNumber || 1}
              onOpenExpenseModal={() => setExpenseModalOpen(true)}
              onOpenReplanModal={() => setReplanOpen(true)}
              onOpenImHereModal={() => setImHereOpen(true)}
              onOpenQuickPlanModal={() => setQuickPlanOpen(true)}
              onOpenLateModal={() => setLateModalOpen(true)}
              onOpenRevisionsModal={() => setRevisionsOpen(true)}
              onToggleItemStatus={handleToggleItemStatus}
              onOpenAskVanvas={() => openAskVanvas()}
            />

            {/* Travel Leg Card */}
            {(trip.transport_mode || parsedTransport) && (
              <div className="p-4 sm:p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#E5D5BA]/70 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#B65E3C] text-[#FAF4E8] text-[9px] font-mono font-bold tracking-wider uppercase">
                      TRAVEL LEG
                    </span>
                    <h3 className="font-serif font-black text-sm sm:text-base text-[#173B32]">
                      {trip.origin_city || "Starting City"} → {trip.destination?.name || "Destination"}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 uppercase">
                    {trip.transport_mode?.replace("_", " ") || "TRANSPORT"}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-[#173B32]">
                  <div className="space-y-0.5">
                    <div className="font-bold flex items-center gap-1.5">
                      {trip.transport_mode?.toLowerCase().includes("bus") && <Bus className="w-3.5 h-3.5 text-[#B65E3C]" />}
                      {trip.transport_mode?.toLowerCase().includes("train") && <Train className="w-3.5 h-3.5 text-[#B65E3C]" />}
                      {trip.transport_mode?.toLowerCase().includes("flight") && <Plane className="w-3.5 h-3.5 text-[#B65E3C]" />}
                      {trip.transport_mode?.toLowerCase().includes("road") && <Car className="w-3.5 h-3.5 text-[#B65E3C]" />}
                      {trip.transport_mode?.toLowerCase().includes("cab") && <CarTaxiFront className="w-3.5 h-3.5 text-[#B65E3C]" />}
                      <span>{parsedTransport?.operator_name || (trip.transport_mode?.toLowerCase().includes("road") ? "Self-Drive Expressway" : "Curated Transit")}</span>
                      <span className="text-[9px] bg-[#173B32] text-[#EFE5D2] px-1.5 py-0.5 rounded font-bold uppercase">
                        {parsedTransport?.data_state || "CURATED"}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#7B4D36]">
                      {parsedTransport?.departure_location && parsedTransport?.arrival_location
                        ? `${parsedTransport.departure_location} → ${parsedTransport.arrival_location}`
                        : trip.transport_mode?.toLowerCase().includes("road")
                        ? "05:30 Early Departure Window recommended for mountain daylight"
                        : "Direct corridor transit"}
                    </div>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <div className="font-mono font-bold text-[#173B32]">
                      {parsedTransport?.departure_time && parsedTransport?.arrival_time
                        ? `${parsedTransport.departure_time} → ${parsedTransport.arrival_time} (~${parsedTransport.duration_hours}h)`
                        : trip.transport_mode?.toLowerCase().includes("road")
                        ? "05:30 → ~17:30 (~11.5h)"
                        : "Scheduled Departure"}
                    </div>
                    <div className="text-[9px] text-[#7B4D36]">
                      {parsedTransport?.price ? `₹${parsedTransport.price.toLocaleString()} / traveller · VERIFY WITH OPERATOR` : "ESTIMATED ROUTE"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Arrival Optimizer Card */}
            {arrivalData && <ArrivalOptimizerCard data={arrivalData} />}

            {/* Today's Highlight Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Active Day Highlight */}
              <div className="md:col-span-2 p-5 sm:p-6 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-xs space-y-3.5">
                <div className="flex items-center justify-between border-b border-[#E5D5BA]/70 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#173B32] text-[#EFE5D2] text-[10px] font-mono font-bold tracking-wider uppercase">
                      TODAY
                    </span>
                    <h3 className="font-serif font-black text-lg text-[#173B32]">
                      DAY {String(selectedDayNumber || 1).padStart(2, "0")}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleTabChange("itinerary")}
                    className="text-xs font-mono font-bold text-[#B65E3C] hover:text-[#9E4D2E] uppercase tracking-wider cursor-pointer"
                  >
                    VIEW FULL DAY →
                  </button>
                </div>

                {isCompact ? (
                  <div className="space-y-2">
                    {currentDayItinerary?.items.slice(0, 4).map((item) => (
                      <CompactItineraryItem
                        key={item.id}
                        item={item}
                        onToggleStatus={handleToggleItemStatus}
                        onToggleLock={handleToggleLock}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentDayItinerary?.items.slice(0, 3).map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] flex items-start gap-3.5"
                      >
                        <span className="px-2.5 py-1 rounded bg-[#173B32] text-[#EFE5D2] text-xs font-bold font-mono">
                          {item.start_time}
                        </span>
                        <div className="flex-1">
                          <div className="font-serif font-bold text-base text-[#173B32]">{item.title}</div>
                          <p className="text-xs text-[#20211D]/75 mt-0.5 font-light">{item.notes}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Weather & Stay Card */}
              <div className="space-y-4">
                {/* Destination Weather Live Card */}
                {trip.destination && (
                  <VanvasWeatherCard
                    destinationName={trip.destination.name}
                    structuredWeather={tripWeather}
                    isCompact={isCompact}
                  />
                )}

                {/* Stay Card */}
                {trip.hotel && (
                  isCompact ? (
                    <CompactStayCard
                      hotel={trip.hotel}
                      onSelect={() => handleTabChange("stays_rentals")}
                    />
                  ) : (
                    <div className="p-6 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B4D36]">
                          आशियाना • Booked Stay
                        </span>
                        <span className="text-xs font-bold text-[#B65E3C]">{trip.hotel.badge}</span>
                      </div>
                      <h4 className="font-serif font-bold text-lg text-[#173B32]">{trip.hotel.name}</h4>
                      <p className="text-xs text-[#7B4D36]">{trip.hotel.address}</p>
                      <div className="p-3 rounded-xl bg-[#EFE5D2] text-xs font-medium text-[#173B32] flex items-center justify-between font-mono">
                        <span>Check-in: {trip.hotel.check_in_time}</span>
                        <span>{trip.hotel.price_per_night ? `₹${trip.hotel.price_per_night}/night` : "Check availability"}</span>
                      </div>
                    </div>
                  )
                )}

                {/* Scooter Rental Card */}
                {trip.rental && (
                  isCompact ? (
                    <CompactRentalCard
                      rental={trip.rental}
                      onSelect={() => handleTabChange("stays_rentals")}
                    />
                  ) : (
                    <div className="p-6 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B4D36]">
                          सवारी • Active Scooter
                        </span>
                        <span className="text-xs font-bold text-emerald-800">Ready for pickup</span>
                      </div>
                      <h4 className="font-serif font-bold text-lg text-[#173B32]">{trip.rental.vehicle_name}</h4>
                      <p className="text-xs text-[#7B4D36]">Provider: {trip.rental.provider_name}</p>
                      <div className="p-3 rounded-xl bg-[#EFE5D2] text-xs font-medium text-[#173B32] flex items-center justify-between font-mono">
                        <span>{trip.rental.location}</span>
                        <span>{trip.rental.price_per_day ? `₹${trip.rental.price_per_day}/day` : "Price on enquiry"}</span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Trip Fellowship / Members Section */}
            <TripMembersSection
              tripId={trip.id}
              members={groupData?.members || []}
              onMembersUpdated={loadTripData}
              onOpenInviteModal={() => setInviteModalOpen(true)}
            />
          </div>
        )}

        {/* ITINERARY TAB */}
        {activeTab === "itinerary" && (
          <div className="space-y-6 animate-vanvas-fade">
            {/* Day Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {trip.itineraries.map((it) => (
                <button
                  key={it.id}
                  onClick={() => setSelectedDayNumber(it.day_number)}
                  className={`px-6 py-3 rounded-2xl text-xs font-bold tracking-wide interactive-pill cursor-pointer ${
                    selectedDayNumber === it.day_number
                      ? "bg-[#173B32] text-[#EFE5D2] shadow-md scale-102 border-2 border-[#173B32]"
                      : "bg-[#FAF7F0] text-[#20211D] border-2 border-[#E5D5BA] hover:bg-[#EFE5D2]"
                  }`}
                >
                  <span className="font-serif">Day {it.day_number}</span>
                  <span className="block text-[10px] opacity-75 font-mono">{it.date}</span>
                </button>
              ))}
            </div>

            {/* Day Theme Header */}
            {currentDayItinerary && (
              <div className="p-6 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-vanvas-slide-up">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#B65E3C]">
                    THEME: {currentDayItinerary.theme}
                  </span>
                  <h3 className="text-2xl font-serif font-black text-[#173B32] mt-0.5">
                    {currentDayItinerary.title}
                  </h3>
                </div>
                <button
                  onClick={() => setReplanOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#EFE5D2] border border-[#E5D5BA] hover:border-[#173B32] interactive-btn text-xs font-bold text-[#173B32] flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#B65E3C]" />
                  <span>Adjust Stops</span>
                </button>
              </div>
            )}

            {/* Quick Intelligence Actions Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setAddPlaceOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-[#173B32] hover:bg-[#0F2924] text-[#FAF4E8] text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-[#B49252]" />
                <span>+ Add Place</span>
              </button>

              <button
                onClick={() => setQuickPlanOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-[#FAF7F0] hover:bg-[#EFE5D2] border border-[#E5D5BA] text-[#173B32] text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Clock className="w-3.5 h-3.5 text-[#B65E3C]" />
                <span>I Have X Hours</span>
              </button>

              <button
                onClick={() => setLateModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-[#FAF7F0] hover:bg-[#EFE5D2] border border-[#E5D5BA] text-[#173B32] text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FastForward className="w-3.5 h-3.5 text-amber-600" />
                <span>Running Late</span>
              </button>

              <button
                onClick={() => setReplanOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-[#FAF7F0] hover:bg-[#EFE5D2] border border-[#E5D5BA] text-[#173B32] text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#B49252]" />
                <span>Replan Day</span>
              </button>

              <button
                onClick={() => setRevisionsOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-[#FAF7F0] hover:bg-[#EFE5D2] border border-[#E5D5BA] text-[#7B4D36] text-xs font-mono font-bold flex items-center gap-1.5 ml-auto cursor-pointer shadow-xs"
              >
                <History className="w-3.5 h-3.5 text-[#B49252]" />
                <span>Revisions {trip.revisions && trip.revisions.length > 0 ? `(v${trip.revisions.length + 1})` : "(v1)"}</span>
              </button>
            </div>

            {/* Timeline Items */}
            {isCompact ? (
              <div className="space-y-2.5">
                {currentDayItinerary?.items.map((item, idx) => (
                  <div key={`${selectedDayNumber}-${item.id}`} className={`animate-vanvas-slide-up stagger-${Math.min(idx + 1, 8)}`}>
                    <CompactItineraryItem
                      item={item}
                      onToggleStatus={handleToggleItemStatus}
                      onToggleLock={handleToggleLock}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {currentDayItinerary?.items.map((item, idx) => {
                  const isCompleted = item.status === "completed" || item.status === "COMPLETED";
                  const isSkipped = item.status === "skipped" || item.status === "SKIPPED";
                  const isMissed = item.status === "missed" || item.status === "MISSED";

                return (
                  <div
                    key={`${selectedDayNumber}-${item.id}`}
                    className={`p-6 rounded-3xl border-2 transition-all flex flex-col sm:flex-row items-start gap-4 animate-vanvas-slide-up stagger-${Math.min(idx + 1, 8)} ${
                      isCompleted
                        ? "bg-[#E5D5BA]/40 border-[#E5D5BA] opacity-75"
                        : isMissed
                        ? "bg-red-50/70 border-red-200"
                        : isSkipped
                        ? "bg-stone-100 border-stone-200 line-through opacity-50"
                        : "bg-[#FAF7F0] border-[#E5D5BA] shadow-xs hover:border-[#173B32]/50 interactive-card"
                    }`}
                  >
                    {/* Status & Timing */}
                    <div className="flex sm:flex-col items-center justify-between sm:justify-start gap-2 w-full sm:w-28 shrink-0">
                      <button
                        onClick={() => handleToggleItemStatus(item.id, item.status)}
                        className="flex items-center gap-1.5 text-xs font-bold text-[#173B32] hover:text-[#B65E3C] cursor-pointer"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-700 fill-emerald-100" />
                        ) : (
                          <Circle className="w-5 h-5 text-[#7B4D36]" />
                        )}
                        <span className="sm:hidden">{isCompleted ? "Done" : "Mark Done"}</span>
                      </button>

                      <div className="text-right sm:text-left">
                        <div className="font-mono font-bold text-sm text-[#173B32]">{item.start_time}</div>
                        <div className="text-[11px] text-[#7B4D36] font-mono">{item.end_time} ({item.duration_mins}m)</div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-2 w-full">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            isMissed ? "bg-red-800 text-white" : "bg-[#173B32] text-[#EFE5D2]"
                          }`}>
                            {isMissed ? "MISSED" : item.category}
                          </span>
                          <h4 className={`font-serif font-bold text-lg text-[#173B32] ${isCompleted ? "line-through opacity-70" : ""}`}>
                            {item.title}
                          </h4>
                        </div>

                        {/* Lock Button */}
                        <button
                          onClick={() => handleToggleLock(item.id, item.is_locked)}
                          title={item.is_locked ? "Locked: Protected from dynamic replanning" : "Flexible"}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            item.is_locked
                              ? "bg-amber-100 text-amber-900 border-amber-300"
                              : "bg-[#EFE5D2] text-[#7B4D36] border-[#E5D5BA] hover:bg-[#E5D5BA]"
                          }`}
                        >
                          {item.is_locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <p className="text-xs text-[#20211D]/80 leading-relaxed font-light">{item.notes}</p>

                      {/* Travel info & Item Actions */}
                      <div className="pt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#E5D5BA]/60 text-[11px] font-mono">
                        <div className="flex flex-wrap items-center gap-3 text-[#7B4D36]">
                          {item.distance_from_prev_km > 0 && (
                            <span className="flex items-center gap-1">
                              <Navigation className="w-3 h-3 text-[#173B32]" />
                              <span>{item.distance_from_prev_km} km ({item.travel_time_from_prev_mins}m transit)</span>
                            </span>
                          )}
                          {item.estimated_cost > 0 && (
                            <span className="font-semibold text-[#173B32]">
                              Est. ₹{item.estimated_cost}
                            </span>
                          )}
                          {item.reason_for_recommendation && (
                            <span className="text-[#B65E3C] italic font-serif">
                              ★ {item.reason_for_recommendation}
                            </span>
                          )}
                        </div>

                        {/* Quick Mutation Actions */}
                        <div className="flex items-center gap-1.5 ml-auto">
                          <button
                            onClick={() => setMissedItem(item)}
                            className="px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-bold cursor-pointer"
                            title="Mark as missed and choose resolution"
                          >
                            Missed
                          </button>
                          <button
                            onClick={() => handleSwapItem(item)}
                            className="px-2 py-0.5 rounded-lg bg-[#EFE5D2] hover:bg-[#E5D5BA] border border-[#E5D5BA] text-[#173B32] text-[10px] font-bold cursor-pointer"
                            title="Swap with nearby alternative"
                          >
                            Swap
                          </button>
                          <button
                            onClick={() => handleRemoveItem(item)}
                            className="p-1 rounded-lg hover:bg-red-50 text-red-600 cursor-pointer"
                            title="Remove stop"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add Stop Button */}
              <div className="pt-2 flex justify-center">
                <button
                  onClick={() => setAddPlaceOpen(true)}
                  className="px-5 py-3 rounded-2xl bg-[#EFE5D2] hover:bg-[#E5D5BA] border-2 border-dashed border-[#B49252]/60 text-[#173B32] font-mono font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4 text-[#B65E3C]" />
                  <span>+ Add Stop to Day {selectedDayNumber}</span>
                </button>
              </div>
            </div>
            )}
          </div>
        )}

        {/* STAYS & RENTALS & TRANSIT TAB */}
        {activeTab === "stays_rentals" && (
          isCompact ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn">
              {/* Transit Card (Compact) */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-[#7B4D36]">Primary Transit</span>
                <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E5D5BA] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-sm text-[#173B32] uppercase">
                      {trip.transport_mode || "Bus"} Transit
                    </span>
                    <span className="text-[10px] font-mono text-[#B65E3C]">{trip.origin_city || "Delhi"} → {trip.destination?.name}</span>
                  </div>
                  {trip.transport_mode === "road_trip" ? (
                    <Link
                      href={`/road-trip?origin=${encodeURIComponent(trip.origin_city || "Delhi")}&dest=${encodeURIComponent(trip.destination?.slug || "manali")}&tripId=${trip.id}`}
                      className="block text-center py-2 rounded-xl bg-[#173B32] text-[#EFE5D2] text-xs font-bold font-mono"
                    >
                      Open Road Trip Cockpit →
                    </Link>
                  ) : (
                    <p className="text-xs text-[#7B4D36]">
                      Direct valley transit scheduled from {trip.origin_city || "Delhi"}.
                    </p>
                  )}
                </div>
              </div>

              {trip.hotel ? (
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#7B4D36]">Booked Stay</span>
                  <CompactStayCard hotel={trip.hotel} />
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-[#7B4D36] bg-[#FAF7F0] rounded-2xl border border-[#E5D5BA]">No hotel attached yet.</div>
              )}

              {trip.rental ? (
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#7B4D36]">Scooter / Vehicle</span>
                  <CompactRentalCard rental={trip.rental} />
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-[#7B4D36] bg-[#FAF7F0] rounded-2xl border border-[#E5D5BA]">No rental attached.</div>
              )}
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn">
              {/* Primary Transit Card */}
              <div className="p-6 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5D5BA] pb-3">
                  <div className="flex items-center gap-2.5">
                    {trip.transport_mode === "road_trip" ? (
                      <Car className="w-5 h-5 text-[#B65E3C]" />
                    ) : trip.transport_mode === "train" ? (
                      <Train className="w-5 h-5 text-[#B65E3C]" />
                    ) : trip.transport_mode === "flight" ? (
                      <Plane className="w-5 h-5 text-[#B65E3C]" />
                    ) : trip.transport_mode === "cab" ? (
                      <CarTaxiFront className="w-5 h-5 text-[#B65E3C]" />
                    ) : (
                      <Bus className="w-5 h-5 text-[#B65E3C]" />
                    )}
                    <h3 className="font-serif font-bold text-lg text-[#173B32]">
                      Selected Primary Transit: <span className="uppercase">{trip.transport_mode || "Bus"}</span>
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#B49252]">
                    Route: {trip.origin_city || "Delhi"} → {trip.destination?.name || "Manali"}
                  </span>
                </div>

                {(() => {
                  let tDetails: any = null;
                  try {
                    if (trip.transport_details_json) {
                      tDetails = JSON.parse(trip.transport_details_json);
                    }
                  } catch {}

                  if (trip.transport_mode === "road_trip") {
                    return (
                      <div className="p-5 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] space-y-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-serif font-bold text-base text-[#173B32]">
                                {tDetails?.operator_name || "Self-Drive Highway & Mountain Corridor"}
                              </h4>
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#173B32] text-[#EFE5D2] uppercase font-bold">
                                {tDetails?.data_state || "ESTIMATED"}
                              </span>
                            </div>
                            <p className="text-xs text-[#7B4D36] mt-0.5">
                              {tDetails?.departure_location || trip.origin_city || "Origin"} → {tDetails?.arrival_location || trip.destination?.name || "Destination"} • Est. {tDetails?.duration_hours ? `${tDetails.duration_hours}h driving` : "Interactive Route"}
                            </p>
                            {tDetails?.price && (
                              <p className="text-xs font-mono font-bold text-[#173B32] mt-1">
                                Est. Fuel &amp; Tolls: ₹{tDetails.price.toLocaleString()}
                              </p>
                            )}
                          </div>
                          <Link
                            href={`/road-trip?origin=${encodeURIComponent(trip.origin_city || "Delhi")}&dest=${encodeURIComponent(trip.destination?.slug || "manali")}&tripId=${trip.id}`}
                            className="px-5 py-2.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs shrink-0"
                          >
                            <span>Open Road Trip Cockpit →</span>
                          </Link>
                        </div>
                        {tDetails?.disclaimer && (
                          <p className="text-[10px] text-[#7B4D36] italic bg-[#FAF7F0] p-2 rounded-xl border border-[#E5D5BA]/60">
                            ⓘ {tDetails.disclaimer}
                          </p>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div className="p-5 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-serif font-bold text-base text-[#173B32]">
                              {tDetails?.operator_name || `${(trip.transport_mode || "Bus").toUpperCase()} Transit Option`}
                            </h4>
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#173B32] text-[#EFE5D2] uppercase font-bold">
                              {tDetails?.data_state || "CURATED"}
                            </span>
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#B49252]/20 text-[#85611B] font-bold">
                              INDICATIVE
                            </span>
                          </div>
                          <p className="text-xs text-[#7B4D36]">
                            {tDetails?.departure_location || trip.origin_city || "Origin"} → {tDetails?.arrival_location || trip.destination?.name || "Destination"}
                          </p>
                          {tDetails?.departure_time && (
                            <p className="text-xs font-mono font-bold text-[#B65E3C]">
                              {tDetails.departure_time} → {tDetails.arrival_time} ({tDetails.duration_hours}h) • ₹{tDetails.price?.toLocaleString()}
                            </p>
                          )}
                        </div>

                        {tDetails?.booking_url ? (
                          <a
                            href={tDetails.booking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs shrink-0"
                          >
                            <span>{tDetails.booking_label || "Open Operator Site"}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-xs font-mono text-[#7B4D36] bg-[#FAF7F0] px-3 py-1.5 rounded-xl border border-[#E5D5BA]">
                            {tDetails?.booking_label || "Indicative Route"}
                          </span>
                        )}
                      </div>

                      {tDetails?.disclaimer && (
                        <p className="text-[10px] text-[#7B4D36] italic bg-[#FAF7F0] p-2 rounded-xl border border-[#E5D5BA]/60">
                          ⓘ {tDetails.disclaimer}
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hotel Section */}
                <div className="p-6 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif font-bold text-lg text-[#173B32] flex items-center gap-2">
                      <BedDouble className="w-5 h-5 text-[#B65E3C]" />
                    <span>Your Stay / Hotel</span>
                  </h3>
                  <span className="text-xs text-[#7B4D36]">Official check-in ready</span>
                </div>

                {trip.hotel ? (
                  <div className="space-y-3">
                    <img
                      src={trip.hotel.image_url || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600"}
                      alt={trip.hotel.name}
                      className="w-full h-48 rounded-2xl object-cover border border-[#E5D5BA]"
                    />
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif font-bold text-base text-[#173B32]">{trip.hotel.name}</h4>
                      <span className="text-sm font-mono font-bold text-[#B65E3C]">
                        {trip.hotel.price_per_night ? `₹${trip.hotel.price_per_night} / night` : "Check availability"}
                      </span>
                    </div>
                    <p className="text-xs text-[#7B4D36]">{trip.hotel.address}</p>
                    <div className="p-3 rounded-xl bg-[#EFE5D2] border border-[#E5D5BA] text-xs space-y-1">
                      <div className="font-semibold text-[#173B32]">Amenities: {trip.hotel.amenities}</div>
                      <div className="text-[#7B4D36]">Check-in: {trip.hotel.check_in_time} • Check-out: {trip.hotel.check_out_time}</div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-[#7B4D36]">No hotel attached yet.</div>
                )}
              </div>

              {/* Scooter Mobility Section */}
              <div className="p-6 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-lg text-[#173B32] flex items-center gap-2">
                    <Bike className="w-5 h-5 text-[#B65E3C]" />
                    <span>Valley Scooter Rentals</span>
                  </h3>
                  <span className="text-xs text-[#7B4D36]">Hill-tuned</span>
                </div>

                {trip.rental ? (
                  <div className="space-y-3">
                    <div className="w-full h-48 rounded-2xl overflow-hidden border border-[#E5D5BA] relative">
                      <VehicleArtwork
                        type={trip.rental.vehicle_type}
                        name={trip.rental.vehicle_name}
                        imageUrl={trip.rental.image_url}
                        alt={trip.rental.vehicle_name}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif font-bold text-base text-[#173B32]">{trip.rental.vehicle_name}</h4>
                      <span className="text-sm font-mono font-bold text-[#173B32]">
                        {trip.rental.price_per_day ? `₹${trip.rental.price_per_day} / day` : "Price on enquiry"}
                      </span>
                    </div>
                    <p className="text-xs text-[#7B4D36]">Provider: {trip.rental.provider_name} • Deposit: ₹{trip.rental.deposit_amount}</p>
                    <div className="p-3 rounded-xl bg-[#EFE5D2] border border-[#E5D5BA] text-xs space-y-1">
                      <div className="font-semibold text-[#173B32]">Pickup: {trip.rental.location}</div>
                      <div className="text-[#7B4D36]">Operating Hours: {trip.rental.opening_hours}</div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-[#7B4D36]">No rental attached.</div>
                )}
              </div>
            </div>
          </div>
          )
        )}

        {/* FOOD TAB */}
        {activeTab === "food" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-2">
              <h3 className="font-serif font-bold text-xl text-[#173B32] flex items-center gap-2">
                <Coffee className="w-5 h-5 text-[#B65E3C]" />
                <span>Curated Food &amp; Riverside Cafés Near Your Route</span>
              </h3>
              <p className="text-xs text-[#7B4D36] leading-relaxed">
                VANVAS selects food stops strictly along your daily path to prevent exhausting 40-minute detours.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: "Café 1947", desc: "Old Manali riverside stone café with wood-fired pizza and acoustic water sounds.", cost: "₹450", cat: "Riverside Café", time: "12:00 - 23:00" },
                { name: "Chhotu Dhaba (Authentic Siddu)", desc: "Fresh steamed Himachali siddu drenched in desi ghee and spicy walnut chutney.", cost: "₹120", cat: "Local Himalayan", time: "09:00 - 20:00" },
                { name: "Lazy Dog Lounge", desc: "Riverside terrace serving fresh trout with butter garlic and ginger herbal teas.", cost: "₹500", cat: "Lounge & Trout", time: "11:00 - 23:00" },
                { name: "Drifters' Café & Inn", desc: "Warm wooden café with board games, cinnamon French toast, and handcrafted espresso.", cost: "₹350", cat: "Artisan Bakery", time: "08:30 - 22:30" },
              ].map((f, idx) => (
                <div key={idx} className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#173B32] text-[#EFE5D2] text-[10px] font-bold uppercase">
                      {f.cat}
                    </span>
                    <span className="font-mono font-bold text-sm text-[#B65E3C]">{f.cost}</span>
                  </div>
                  <h4 className="font-serif font-bold text-base text-[#173B32]">{f.name}</h4>
                  <p className="text-xs text-[#20211D]/75 leading-relaxed font-light">{f.desc}</p>
                  <div className="pt-2 border-t border-[#E5D5BA] text-[11px] text-[#7B4D36]">
                    Hours: {f.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BUDGET & SPLIT TAB */}
        {activeTab === "budget" && (
          <div className="space-y-6 animate-fadeIn">
            <VanvasSplitView
              trip={trip}
              members={groupData?.members || []}
              onExpenseMutated={loadTripData}
              onOpenAddExpenseModal={() => setExpenseModalOpen(true)}
            />
          </div>
        )}

        {/* GROUP TAB */}
        {activeTab === "group" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Fellowship Members Section */}
            <TripMembersSection
              tripId={trip.id}
              members={groupData?.members || []}
              onMembersUpdated={loadTripData}
              onOpenInviteModal={() => setInviteModalOpen(true)}
            />

            <div className="p-6 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#B65E3C] font-bold uppercase tracking-wider">
                  <Users className="w-4 h-4" />
                  <span>Private Consensus Engine</span>
                </div>
                <h3 className="text-2xl font-serif font-black text-[#173B32] mt-0.5">
                  Group Travel &amp; Private Voting
                </h3>
                <p className="text-xs text-[#7B4D36] mt-1">
                  Individual votes stay 100% private. VANVAS calculates group harmony without peer pressure.
                </p>
              </div>

              <button
                onClick={() => setInviteModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-[#B49252]" />
                <span>Invite Members</span>
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#7B4D36]">
                Vote on Candidate Activities for this Trip:
              </h4>

              {[
                { id: "v-1", name: "Café 1947 Riverside Evening", cat: "Café", cost: 450, score: 92, img: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400" },
                { id: "v-2", name: "Jogini Waterfall Hike", cat: "Nature", cost: 0, score: 85, img: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=400" },
                { id: "v-3", name: "Solang Valley Tandem Paragliding", cat: "Adventure", cost: 1800, score: 70, img: "https://images.unsplash.com/photo-1527004013197-933c4bb611b3?w=400" },
                { id: "v-4", name: "Old Manali Wood Carving Alley", cat: "Culture", cost: 0, score: 78, img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400" },
              ].map((item) => (
                <VotingCard
                  key={item.id}
                  tripId={trip.id}
                  placeId={item.id}
                  placeName={item.name}
                  category={item.cat}
                  approxCost={item.cost}
                  imageUrl={item.img}
                  compatibilityScore={item.score}
                />
              ))}
            </div>
          </div>
        )}

        {/* CHECKLIST TAB */}
        {activeTab === "checklist" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-xs space-y-4">
              <div>
                <h3 className="font-serif font-black text-2xl text-[#173B32] flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-[#B65E3C]" />
                  <span>Himalayan Expedition Packing Checklist</span>
                </h3>
                <p className="text-xs text-[#7B4D36] mt-0.5">
                  Tailored suggestions for high altitude conditions, cold evenings &amp; trail walks.
                </p>
              </div>

              {/* Add Custom Item */}
              <form onSubmit={handleAddChecklist} className="flex gap-2">
                <input
                  type="text"
                  value={newChecklistInput}
                  onChange={(e) => setNewChecklistInput(e.target.value)}
                  placeholder="Add item (e.g. Polaroid camera, wool socks)..."
                  className="flex-1 px-4 py-2.5 bg-white border-2 border-[#E5D5BA] rounded-xl text-xs text-[#20211D] focus:outline-none focus:border-[#173B32]"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Add Item
                </button>
              </form>

              {/* Checklist Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {checklist.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleChecklistToggle(c.id, c.is_checked)}
                    className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 cursor-pointer transition-all ${
                      c.is_checked
                        ? "bg-[#E5D5BA]/40 border-[#E5D5BA] text-[#7B4D36] line-through"
                        : "bg-white border-[#E5D5BA] text-[#20211D] hover:border-[#173B32]/50"
                    }`}
                  >
                    {c.is_checked ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 fill-emerald-100" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#7B4D36]" />
                    )}
                    <span className="text-xs font-medium flex-1">{c.item_name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#EFE5D2] text-[#7B4D36] font-mono">
                      {c.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SOLO CIRCLES TAB */}
        {activeTab === "circles" && (
          <div className="space-y-6 animate-fadeIn">
            <TravelingSoloSection
              destinationId={trip.destination_id}
              destinationName={trip.destination?.name || "Mountain Destination"}
              startDate={trip.start_date}
              endDate={trip.end_date}
              tripId={trip.id}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      <ImHereDrawer
        tripId={trip.id}
        isOpen={imHereOpen}
        onClose={() => setImHereOpen(false)}
        destinationId={trip.destination_id}
      />

      <DynamicReplanModal
        tripId={trip.id}
        dayNumber={selectedDayNumber}
        isOpen={replanOpen}
        onClose={() => setReplanOpen(false)}
        trip={trip}
        onPreviewGenerated={(p) => setActionPreview(p)}
      />

      <QuickPlanModal
        tripId={trip.id}
        dayNumber={selectedDayNumber}
        isOpen={quickPlanOpen}
        onClose={() => setQuickPlanOpen(false)}
        trip={trip}
        onApplied={handleActionApplied}
      />

      <ActionPreviewModal
        tripId={trip.id}
        isOpen={Boolean(actionPreview)}
        preview={actionPreview}
        onClose={() => setActionPreview(null)}
        onApplied={handleActionApplied}
      />

      <RunningLateModal
        tripId={trip.id}
        dayNumber={selectedDayNumber}
        isOpen={lateModalOpen}
        onClose={() => setLateModalOpen(false)}
        onPreviewGenerated={(p) => setActionPreview(p)}
      />

      <MissedActivityModal
        tripId={trip.id}
        dayNumber={selectedDayNumber}
        item={missedItem}
        isOpen={Boolean(missedItem)}
        onClose={() => setMissedItem(null)}
        onPreviewGenerated={(p) => setActionPreview(p)}
      />

      <AddPlaceModal
        tripId={trip.id}
        destinationId={trip.destination_id}
        dayNumber={selectedDayNumber}
        isOpen={addPlaceOpen}
        onClose={() => setAddPlaceOpen(false)}
        onPreviewGenerated={(p) => setActionPreview(p)}
      />

      <TripRevisionsModal
        tripId={trip.id}
        isOpen={revisionsOpen}
        onClose={() => setRevisionsOpen(false)}
      />

      <ExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        tripId={trip.id}
        onExpenseAdded={loadTripData}
      />

      <TripInviteModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        tripId={trip.id}
        tripTitle={trip.title || `${trip.destination?.name || "Himalayan"} Expedition`}
        destinationName={trip.destination?.name || "Himalayan Destination"}
        destinationSlug={trip.destination?.slug || "manali"}
        startDate={trip.start_date}
        endDate={trip.end_date}
        numDays={trip.num_days}
        inviteCode={trip.invite_code}
      />

      <OfflineTripPackDrawer
        trip={trip}
        checklist={checklist}
        isOpen={offlinePackOpen}
        onClose={() => setOfflinePackOpen(false)}
      />

      {notificationMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#173B32] border-2 border-[#B49252] text-[#FAF4E8] shadow-2xl flex items-center gap-3 animate-slideUp font-mono text-xs max-w-md">
          <Sparkles className="w-5 h-5 text-[#B49252] shrink-0" />
          <span className="flex-1">{notificationMsg}</span>
          <button onClick={() => setNotificationMsg(null)} className="text-[#D8DED5] hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
