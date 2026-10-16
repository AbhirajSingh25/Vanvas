"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Navigation, Clock, Hotel, Compass, Bike, X,
  CheckCircle, ArrowRight, MapPin, AlertCircle, Sun, Loader2,
  CloudRain, RotateCcw, Car, Wallet, ChevronDown, ChevronUp,
  RefreshCw, AlertTriangle, Sparkles, Check, MoreHorizontal
} from "lucide-react";
import { api } from "@/lib/api";
import { ImHereResponse, ItineraryItem } from "@/types";
import { TravelStamp } from "@/components/ui/TravelStamp";
import { useAskVanvas } from "@/context/AskVanvasContext";
import { useDensity } from "@/context/DensityContext";
import { VanvasImage } from "@/components/ui/VanvasImage";
import { resolvePlaceArtwork } from "@/lib/placeVisualResolver";
import { acquireScrollLock, releaseScrollLock } from "@/lib/scrollLock";

interface ImHereDrawerProps {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
  destinationId?: string;
  destinationName?: string;
  destinationSlug?: string;
}

interface ProblemOption {
  id: string;
  label: string;
  icon: string;
  immediateAdvice: string;
  queryText: string;
}

const COMMON_PROBLEMS: ProblemOption[] = [
  {
    id: "cab_cancelled",
    label: "Cab Cancelled / No Ride",
    icon: "🚕",
    immediateAdvice: "Head to the official prepaid union counter outside Gate 1. Fixed rates apply without surge pricing.",
    queryText: "My cab was cancelled at the arrival hub. How can I get reliable transport to my stay right now?"
  },
  {
    id: "hotel_unavailable",
    label: "Hotel Not Ready / Issue",
    icon: "🏨",
    immediateAdvice: "Ask the front desk for luggage cloakroom storage so you can relax at a nearby café while they prepare your room.",
    queryText: "My hotel room is not ready yet. Where can I drop my bags or relax nearby in the meantime?"
  },
  {
    id: "heavy_rain",
    label: "Bad Weather / Heavy Rain",
    icon: "🌧️",
    immediateAdvice: "Switch outdoor walks to cozy indoor heritage cafes and covered bazaars. Keep waterproof gear accessible.",
    queryText: "It is raining heavily. Recommend indoor cafes or covered cultural spots nearby to wait out the rain."
  },
  {
    id: "need_essentials",
    label: "Need Food, Pharmacy or ATM",
    icon: "💊",
    immediateAdvice: "Local medical stores and main market ATMs are typically clustered along the central Mall Road / Station Road.",
    queryText: "I urgently need a pharmacy, ATM, and quick warm food near my arrival location."
  },
  {
    id: "feeling_exhausted",
    label: "Exhausted / Need Rest",
    icon: "😴",
    immediateAdvice: "Postpone intense sightseeing. We recommend taking an unhurried 90-minute nap or quiet tea break first.",
    queryText: "I am feeling exhausted after the journey. Reorganize my arrival afternoon for maximum rest and low physical effort."
  },
  {
    id: "lost_luggage",
    label: "Luggage Delayed / Missing",
    icon: "🧳",
    immediateAdvice: "File a Property Irregularity Report (PIR) with your transit operator before leaving the terminal.",
    queryText: "My luggage was delayed or misplaced during transit. What steps should I take and where can I buy essential clothes/toiletries nearby?"
  }
];

export const ImHereDrawer: React.FC<ImHereDrawerProps> = ({
  tripId,
  isOpen,
  onClose,
  destinationName = "Destination",
  destinationSlug
}) => {
  const { openAskVanvas } = useAskVanvas();
  const { isCompact } = useDensity();

  // Primary data state
  const [data, setData] = useState<ImHereResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Time & Location context
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "detecting" | "granted" | "denied" | "unavailable">("idle");
  const [hoursAvailable, setHoursAvailable] = useState<number>(3);
  const [delayMinutes, setDelayMinutes] = useState<number>(0);
  const [arrivalTimestamp, setArrivalTimestamp] = useState<string>("");

  // UI state
  const [completedItemIds, setCompletedItemIds] = useState<Set<string>>(new Set());
  const [skippedItemIds, setSkippedItemIds] = useState<Set<string>>(new Set());
  const [showLaterExpanded, setShowLaterExpanded] = useState<boolean>(false);
  const [showProblemSheet, setShowProblemSheet] = useState<boolean>(false);
  const [selectedProblem, setSelectedProblem] = useState<ProblemOption | null>(null);

  // Contextual modal sheets for Compact mode
  const [compactSubSheet, setCompactSubSheet] = useState<"weather" | "budget" | "mobility" | "actions" | null>(null);

  // Local storage persistence key
  const storageKey = `vanvas_im_here_${tripId}`;

  // Body scroll lock management: ensures body scroll is never trapped after unmount or close
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Initialize time on open
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const currentFormatted = `${hh}:${mm}`;
      setArrivalTimestamp(currentFormatted);

      // Load persisted state if any
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.completed) setCompletedItemIds(new Set(parsed.completed));
          if (parsed.skipped) setSkippedItemIds(new Set(parsed.skipped));
          if (parsed.delay) setDelayMinutes(parsed.delay);
          if (parsed.hours) setHoursAvailable(parsed.hours);
        }
      } catch (e) {
        console.warn("Could not load persisted I'M HERE state:", e);
      }
    }
  }, [isOpen, tripId, storageKey]);

  // Acquire & release scroll lock cleanly on mount/unmount
  useEffect(() => {
    if (isOpen) {
      acquireScrollLock();
      return () => {
        releaseScrollLock();
      };
    }
  }, [isOpen]);

  // Persist state changes
  useEffect(() => {
    if (!isOpen) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        completed: Array.from(completedItemIds),
        skipped: Array.from(skippedItemIds),
        delay: delayMinutes,
        hours: hoursAvailable,
      }));
    } catch (e) {
      console.warn("Failed to persist I'M HERE state:", e);
    }
  }, [completedItemIds, skippedItemIds, delayMinutes, hoursAvailable, isOpen, storageKey]);

  // Keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        if (compactSubSheet) {
          setCompactSubSheet(null);
        } else if (showProblemSheet) {
          setShowProblemSheet(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, compactSubSheet, showProblemSheet, onClose]);

  // Request GPS
  const handleRequestGPS = () => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      setGeoStatus("detecting");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoStatus("granted");
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords);
          fetchPlan(coords.lat, coords.lng, hoursAvailable, delayMinutes);
        },
        (err) => {
          console.warn("GPS error:", err.message);
          setGeoStatus("denied");
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      setGeoStatus("unavailable");
    }
  };

  // Fetch plan from backend
  const fetchPlan = useCallback(async (
    lat?: number,
    lng?: number,
    hours: number = hoursAvailable,
    delay: number = delayMinutes
  ) => {
    try {
      setRefreshing(true);
      if (tripId.startsWith("sample-")) {
        throw new Error("Local sample trip offline mode");
      }
      const res = await api.getImHereContext(
        tripId,
        lat,
        lng,
        undefined,
        arrivalTimestamp || undefined,
        hours,
        delay
      );
      setData(res);
    } catch (err) {
      console.warn("Failed to fetch I'M HERE context from server, falling back to local arrival model:", err);
      let cachedTrip: any = null;
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(`vanvas_trip_${tripId}`) || localStorage.getItem(`vanvas_offline_trip_${tripId}`);
          if (raw) cachedTrip = JSON.parse(raw);
        } catch {}
      }

      const destName = destinationName || cachedTrip?.destination?.name || "Sanctuary Hub";
      const fallbackItems: ItineraryItem[] = cachedTrip?.itineraries?.[0]?.items?.length
        ? cachedTrip.itineraries[0].items
        : [
            {
              id: "arrival-step-1",
              itinerary_id: "day-1",
              title: `Arrive & Check In at ${destName}`,
              category: "Stay",
              start_time: "10:00",
              end_time: "11:30",
              duration_mins: 90,
              estimated_cost: 0,
              travel_time_from_prev_mins: 0,
              distance_from_prev_km: 0,
              status: "upcoming",
              is_locked: false,
              notes: "Drop luggage and freshen up."
            },
            {
              id: "arrival-step-2",
              itinerary_id: "day-1",
              title: `Old ${destName} Chai & Mountain Walk`,
              category: "Walk",
              start_time: "11:45",
              end_time: "13:00",
              duration_mins: 75,
              estimated_cost: 200,
              travel_time_from_prev_mins: 15,
              distance_from_prev_km: 1.2,
              status: "upcoming",
              is_locked: false,
              notes: "Gentle acclimatization stroll."
            },
            {
              id: "arrival-step-3",
              itinerary_id: "day-1",
              title: `Riverside Pine Forest Viewpoint`,
              category: "Nature",
              start_time: "13:30",
              end_time: "15:00",
              duration_mins: 90,
              estimated_cost: 0,
              travel_time_from_prev_mins: 20,
              distance_from_prev_km: 2.5,
              status: "upcoming",
              is_locked: false,
              notes: "Panoramic mountain valley views."
            }
          ];

      setData({
        trip_id: tripId,
        destination_name: destName,
        current_location_name: destName,
        activation_time: arrivalTimestamp || "Just Now",
        hours_available: hours,
        next_3_hours_plan: fallbackItems,
        weather_info: {
          temperature_c: 16,
          condition: "Clear Mountain Air",
          is_rain: false,
          high_c: 19,
          low_c: 8
        },
        budget_info: {
          remaining_budget: cachedTrip?.budget_total ? cachedTrip.budget_total - (cachedTrip.budget_spent || 0) : 23800,
          spent_today: 4200,
          total_allocated: cachedTrip?.budget_total || 28000
        },
        local_transport_options: [
          { mode: "Local Auto / Shared Cab", est_fare: "₹120 – ₹180", duration: "10 mins", tip: "Available outside main taxi stand" },
          { mode: "Scooter Rental", est_fare: "₹600 / day", duration: "Full Day", tip: "Helmets mandatory for both rider and pillion" }
        ],
        emergency_contacts: [
          { name: "Local Tourist Helpdesk", phone: "1363" },
          { name: "Emergency Police/Medical", phone: "112" }
        ]
      } as any);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tripId, destinationName, arrivalTimestamp, hoursAvailable, delayMinutes]);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchPlan(userCoords?.lat, userCoords?.lng, hoursAvailable, delayMinutes);
    }
  }, [isOpen, fetchPlan]);

  // Filter items based on user actions (completed & skipped)
  const activePlanItems = useMemo(() => {
    if (!data?.next_3_hours_plan) return [];
    return data.next_3_hours_plan.filter(item => !skippedItemIds.has(item.id));
  }, [data, skippedItemIds]);

  // Now, Next, Later hierarchy
  const nowItem = useMemo(() => {
    return activePlanItems.find(item => !completedItemIds.has(item.id)) || null;
  }, [activePlanItems, completedItemIds]);

  const nextItem = useMemo(() => {
    if (!nowItem) return null;
    const nowIdx = activePlanItems.findIndex(i => i.id === nowItem.id);
    if (nowIdx >= 0 && nowIdx + 1 < activePlanItems.length) {
      return activePlanItems[nowIdx + 1];
    }
    return null;
  }, [activePlanItems, nowItem]);

  const laterItems = useMemo(() => {
    if (!nowItem) return [];
    const nowIdx = activePlanItems.findIndex(i => i.id === nowItem.id);
    if (nowIdx >= 0 && nowIdx + 2 < activePlanItems.length) {
      return activePlanItems.slice(nowIdx + 2);
    }
    return [];
  }, [activePlanItems, nowItem]);

  // Resolve contextual visuals for NOW and NEXT stops
  const nowItemVisual = useMemo(() => {
    if (!nowItem) return null;
    return resolvePlaceArtwork(
      nowItem.title,
      destinationName,
      nowItem.category || "Arrival",
      undefined,
      false,
      undefined
    );
  }, [nowItem, destinationName]);

  const nextItemVisual = useMemo(() => {
    if (!nextItem) return null;
    return resolvePlaceArtwork(
      nextItem.title,
      destinationName,
      nextItem.category || "Arrival",
      undefined,
      false,
      undefined
    );
  }, [nextItem, destinationName]);

  // Mark step done (immediate feedback)
  const handleMarkDone = (itemId: string) => {
    setCompletedItemIds(prev => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });
  };

  // Skip step
  const handleSkipStep = (itemId: string) => {
    setSkippedItemIds(prev => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });
  };

  // Add delay (+30 mins)
  const handleRunningLate = () => {
    const newDelay = delayMinutes + 30;
    setDelayMinutes(newDelay);
    fetchPlan(userCoords?.lat, userCoords?.lng, hoursAvailable, newDelay);
  };

  // Change available hours
  const handleHoursSelect = (hours: number) => {
    setHoursAvailable(hours);
    fetchPlan(userCoords?.lat, userCoords?.lng, hours, delayMinutes);
  };

  // Reset plan
  const handleResetPlan = () => {
    setCompletedItemIds(new Set());
    setSkippedItemIds(new Set());
    setDelayMinutes(0);
    fetchPlan(userCoords?.lat, userCoords?.lng, hoursAvailable, 0);
  };

  // Deep-link to Ask VANVAS for problem solving
  const handleAskVanvasProblem = (problem: ProblemOption) => {
    setShowProblemSheet(false);
    onClose();
    openAskVanvas(
      {
        destinationSlug: destinationSlug || (data?.current_location_name ? data.current_location_name.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined),
        destinationName: destinationName || data?.current_location_name,
        tripId: tripId,
        coordinates: userCoords ? { lat: userCoords.lat, lng: userCoords.lng } : undefined,
      },
      problem.queryText
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#0F2924]/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[92vh] sm:max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-slideUp relative"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "var(--vanvas-safe-area-bottom, 0px)" }}
      >
        {/* ======================================================== */}
        {/* HEADER: COMPACT VS ORIGINAL                             */}
        {/* ======================================================== */}
        <div className="p-4 sm:p-5 bg-[#0F2924] text-[#EFE5D2] flex items-center justify-between border-b border-[#243E36] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#B65E3C] text-[#FAF4E8] flex items-center justify-center shadow-md shrink-0">
              <Navigation className="w-5 h-5 text-[#FAF4E8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <TravelStamp label="I'M HERE" variant="terracotta" />
                <span className="text-[10px] text-[#B49252] font-mono font-bold uppercase tracking-wider">
                  {destinationName}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-serif font-black tracking-tight mt-0.5 text-[#FAF4E8]">
                {isCompact ? "Arrival Mode" : "Arrival Operating Experience"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchPlan(userCoords?.lat, userCoords?.lng, hoursAvailable, delayMinutes)}
              disabled={refreshing}
              title="Refresh Plan"
              aria-label="Refresh Plan"
              className="p-2 rounded-full text-[#D8DED5] hover:bg-[#173B32] transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#B49252]" : ""}`} />
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-2 rounded-full text-[#D8DED5] hover:bg-[#173B32] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* BODY CONTENT                                             */}
        {/* ======================================================== */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-sm flex-1">
          {/* Location & Activation Sensor Status Bar */}
          <div className="p-2.5 sm:p-3 rounded-2xl bg-[#EFE5D2]/70 border border-[#E5D5BA] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="w-4 h-4 text-[#B65E3C] shrink-0" />
              {geoStatus === "granted" && userCoords ? (
                <span className="text-[#173B32] font-bold truncate">
                  Device GPS: {userCoords.lat.toFixed(3)}°N, {userCoords.lng.toFixed(3)}°E
                </span>
              ) : geoStatus === "denied" ? (
                <span className="text-[#7B4D36]">
                  Using Arrival Hub • GPS off
                </span>
              ) : geoStatus === "detecting" ? (
                <span className="text-[#7B4D36] flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Detecting GPS...
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestGPS}
                  className="text-[#173B32] font-bold underline hover:text-[#B65E3C] cursor-pointer"
                >
                  [Detect Exact Location]
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#7B4D36] font-bold">
                Activated: {data?.activation_time || arrivalTimestamp || "Now"}
              </span>
              {delayMinutes > 0 && (
                <span className="text-[10px] font-bold bg-[#B65E3C] text-white px-1.5 py-0.5 rounded">
                  +{delayMinutes}m late
                </span>
              )}
            </div>
          </div>

          {/* Time Window Selector */}
          <div className="p-2.5 sm:p-3 rounded-2xl bg-white border border-[#E5D5BA] flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#173B32] font-mono">
              <Clock className="w-3.5 h-3.5 text-[#B65E3C]" />
              <span className="hidden sm:inline">Time Window:</span>
              <span className="sm:hidden">Window:</span>
            </div>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map(h => (
                <button
                  key={h}
                  onClick={() => handleHoursSelect(h)}
                  className={`px-2.5 sm:px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    hoursAvailable === h
                      ? "bg-[#173B32] text-[#FAF4E8] shadow-xs"
                      : "bg-[#FAF7F0] hover:bg-[#EFE5D2] text-[#173B32] border border-[#E5D5BA]"
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3 text-[#173B32]">
              <div className="w-9 h-9 border-3 border-[#B65E3C] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-serif italic text-[#7B4D36]">
                Calibrating arrival timeline &amp; nearest stops from {arrivalTimestamp || "now"}...
              </p>
            </div>
          ) : data ? (
            <>
              {/* ======================================================== */}
              {/* NOW / NEXT / LATER SECTION                              */}
              {/* ======================================================== */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-sm sm:text-base text-[#173B32] flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[#B65E3C]" />
                    <span>Real-Time Arrival Flow</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRunningLate}
                      className="text-[11px] font-mono text-[#B65E3C] hover:text-[#9E4D2E] font-bold flex items-center gap-1 cursor-pointer bg-[#FAF7F0] px-2 py-0.5 rounded-lg border border-[#E5D5BA]"
                    >
                      <span>Late? (+30m)</span>
                    </button>
                    {(completedItemIds.size > 0 || skippedItemIds.size > 0 || delayMinutes > 0) && (
                      <button
                        onClick={handleResetPlan}
                        title="Reset Timeline"
                        className="text-[10px] font-mono text-[#7B4D36] hover:text-[#173B32] flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 1. NOW CARD (Prominent dominant next step) */}
                {nowItem ? (
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#0F2924] text-[#EFE5D2] border-2 border-[#243E36] shadow-md space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#B65E3C] text-white font-mono font-black text-xs uppercase tracking-wider animate-pulse">
                          NOW
                        </span>
                        <span className="font-mono text-xs text-[#B49252] font-bold">
                          {nowItem.start_time} – {nowItem.end_time}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-[#D8DED5]/80">
                        ~{nowItem.duration_mins} mins
                      </span>
                    </div>

                    {/* Content Row with Contextual Place Thumbnail */}
                    <div className="flex items-start gap-3.5">
                      {nowItemVisual && (
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[#173B32] shrink-0 border border-[#31483D] shadow-xs">
                          <VanvasImage
                            src={nowItemVisual.imageUrl}
                            fallbackSrc={nowItemVisual.fallbackUrl}
                            alt={nowItem.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif font-black text-base sm:text-lg text-[#FAF4E8] leading-tight">
                          {nowItem.title}
                        </h4>
                        <p className="text-xs text-[#D8DED5] mt-1 font-light leading-relaxed line-clamp-2">
                          {nowItem.notes}
                        </p>
                        {nowItem.reason_for_recommendation && (
                          <div className="mt-1.5 text-[11px] text-[#B49252] font-mono flex items-center gap-1">
                            <span>★</span>
                            <span className="truncate">{nowItem.reason_for_recommendation}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Row */}
                    <div className="pt-3 border-t border-[#243E36] flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleMarkDone(nowItem.id)}
                        className="px-5 py-2.5 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Done / Completed</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={handleRunningLate}
                          className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#D8DED5] font-mono text-xs transition-colors cursor-pointer"
                        >
                          Running Late
                        </button>
                        <button
                          onClick={() => handleSkipStep(nowItem.id)}
                          className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-[#D8DED5]/80 font-mono text-xs transition-colors cursor-pointer"
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-bold text-sm">All Arrival Steps Completed!</div>
                      <div className="text-xs text-emerald-700">You are settled in {destinationName}. Ready for your full trip itinerary.</div>
                    </div>
                  </div>
                )}

                {/* 2. NEXT CARD (Following milestone) */}
                {nextItem && (
                  <div className="p-3.5 rounded-2xl bg-white border border-[#E5D5BA] space-y-2 shadow-2xs hover:border-[#173B32] transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#FAF7F0] border border-[#E5D5BA] text-[#173B32] font-mono font-bold text-[11px] uppercase tracking-wider">
                          NEXT
                        </span>
                        <span className="font-mono text-xs text-[#7B4D36]">
                          {nextItem.start_time} – {nextItem.end_time}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-[#7B4D36]">
                        ~{nextItem.duration_mins}m
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      {nextItemVisual && (
                        <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-[#FAF7F0] shrink-0 border border-[#E5D5BA]">
                          <VanvasImage
                            src={nextItemVisual.imageUrl}
                            fallbackSrc={nextItemVisual.fallbackUrl}
                            alt={nextItem.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif font-bold text-sm text-[#173B32]">
                          {nextItem.title}
                        </h4>
                        <p className="text-xs text-[#7B4D36] mt-0.5 font-light leading-relaxed line-clamp-1">
                          {nextItem.notes}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-[#7B4D36] font-mono border-t border-[#E5D5BA]/60">
                      <span>Travel buffer: ~{nextItem.travel_time_from_prev_mins}m</span>
                      <button
                        onClick={() => handleSkipStep(nextItem.id)}
                        className="text-[#7B4D36] hover:text-[#173B32] underline cursor-pointer"
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. LATER SECTION (Collapsible downstream items) */}
                {laterItems.length > 0 && (
                  <div className="rounded-2xl border border-[#E5D5BA] bg-[#FAF7F0] overflow-hidden">
                    <button
                      onClick={() => setShowLaterExpanded(prev => !prev)}
                      className="w-full p-3 flex items-center justify-between text-xs font-mono font-bold text-[#173B32] hover:bg-[#EFE5D2]/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#EFE5D2] text-[10px]">
                          LATER ({laterItems.length})
                        </span>
                        <span>Later today · {laterItems.length} more steps</span>
                      </div>
                      {showLaterExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {showLaterExpanded && (
                      <div className="p-3 pt-0 space-y-2 border-t border-[#E5D5BA]/60 animate-fadeIn">
                        {laterItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-white border border-[#E5D5BA] flex items-start justify-between gap-2 text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] text-[#B65E3C] font-bold">
                                  {item.start_time}
                                </span>
                                <h5 className="font-serif font-bold text-[#173B32]">
                                  {item.title}
                                </h5>
                              </div>
                              <p className="text-[11px] text-[#7B4D36] mt-0.5 line-clamp-1">
                                {item.notes}
                              </p>
                            </div>
                            <span className="text-[10px] font-mono text-[#7B4D36] shrink-0">
                              {item.duration_mins}m
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ======================================================== */}
              {/* COMPACT MODE: CONTEXTUAL ACTION CHIPS                    */}
              {/* ======================================================== */}
              {isCompact ? (
                <div className="pt-2 border-t border-[#E5D5BA] space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7B4D36] block">
                    Contextual Intelligence:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Weather Chip */}
                    {data.weather_info && (
                      <button
                        type="button"
                        onClick={() => setCompactSubSheet("weather")}
                        className="p-2.5 rounded-xl bg-white hover:bg-[#FAF7F0] border border-[#E5D5BA] text-left flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {data.weather_info.is_rain ? (
                            <CloudRain className="w-4 h-4 text-sky-600 shrink-0" />
                          ) : (
                            <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                          )}
                          <div className="truncate">
                            <span className="font-bold text-xs text-[#173B32] block">
                              {Math.round(data.weather_info.temperature_c)}°C · {data.weather_info.condition}
                            </span>
                            <span className="text-[10px] text-[#7B4D36] font-mono">Weather Sheet</span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-[#7B4D36] shrink-0" />
                      </button>
                    )}

                    {/* Budget Chip */}
                    {data.budget_info && (
                      <button
                        type="button"
                        onClick={() => setCompactSubSheet("budget")}
                        className="p-2.5 rounded-xl bg-white hover:bg-[#FAF7F0] border border-[#E5D5BA] text-left flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Wallet className="w-4 h-4 text-[#B65E3C] shrink-0" />
                          <div className="truncate">
                            <span className="font-bold text-xs text-[#173B32] block">
                              ₹{Math.round(data.budget_info.remaining_budget)} Left
                            </span>
                            <span className="text-[10px] text-[#7B4D36] font-mono">Budget Sheet</span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-[#7B4D36] shrink-0" />
                      </button>
                    )}

                    {/* Local Mobility Chip */}
                    {data.local_transport_options && data.local_transport_options.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setCompactSubSheet("mobility")}
                        className="p-2.5 rounded-xl bg-white hover:bg-[#FAF7F0] border border-[#E5D5BA] text-left flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Bike className="w-4 h-4 text-[#173B32] shrink-0" />
                          <div className="truncate">
                            <span className="font-bold text-xs text-[#173B32] block">
                              Local Mobility
                            </span>
                            <span className="text-[10px] text-[#7B4D36] font-mono">Cabs, Autos &amp; Bikes</span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-[#7B4D36] shrink-0" />
                      </button>
                    )}

                    {/* Help Chip */}
                    <button
                      type="button"
                      onClick={() => setShowProblemSheet(true)}
                      className="p-2.5 rounded-xl bg-white hover:bg-[#FAF7F0] border border-[#E5D5BA] text-left flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <AlertTriangle className="w-4 h-4 text-[#B65E3C] shrink-0" />
                        <div className="truncate">
                          <span className="font-bold text-xs text-[#173B32] block">
                            Need Help?
                          </span>
                          <span className="text-[10px] text-[#7B4D36] font-mono">Fix arrival issues</span>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#7B4D36] shrink-0" />
                    </button>
                  </div>
                </div>
              ) : (
                /* ======================================================== */
                /* ORIGINAL MODE: RICH EXPANDED PANELS                     */
                /* ======================================================== */
                <>
                  {/* Hotel & Timing Status Banner */}
                  <div className="p-3.5 rounded-2xl bg-white border-2 border-[#E5D5BA] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                    <div>
                      <div className="text-[10px] text-[#7B4D36] font-bold uppercase tracking-wider font-mono">
                        Arrival Hub &amp; Region
                      </div>
                      <div className="font-serif font-black text-[#173B32] text-base sm:text-lg">
                        {data.current_location_name}
                      </div>
                      <div className="text-xs text-[#7B4D36] mt-0.5 leading-relaxed font-light">
                        {data.timing_guidance}
                      </div>
                    </div>

                    {data.hotel_info && (
                      <div className="bg-[#FAF7F0] p-2.5 rounded-xl border border-[#E5D5BA] flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
                        <Hotel className="w-4 h-4 text-[#B65E3C] shrink-0" />
                        <div className="text-xs font-mono">
                          <div className="font-bold text-[#173B32] truncate max-w-[200px]">{data.hotel_info.name}</div>
                          <div className="text-[#7B4D36] text-[10px]">
                            Check-in: {data.hotel_info.check_in_time} • {data.hotel_info.distance_km}km
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Weather & Budget 2-Column Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Weather Awareness */}
                    {data.weather_info && (
                      <div className="p-3.5 rounded-2xl bg-white border border-[#E5D5BA] space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#173B32] uppercase tracking-wider font-mono">
                            {data.weather_info.is_rain ? (
                              <CloudRain className="w-3.5 h-3.5 text-sky-600" />
                            ) : (
                              <Sun className="w-3.5 h-3.5 text-amber-500" />
                            )}
                            <span>Arrival Weather</span>
                          </div>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#FAF7F0] border border-[#E5D5BA] text-[#7B4D36]">
                            {data.weather_info.freshness}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="font-serif font-black text-xl text-[#173B32]">
                            {Math.round(data.weather_info.temperature_c)}°C
                          </span>
                          <span className="text-xs font-bold text-[#7B4D36]">
                            {data.weather_info.condition}
                          </span>
                          <span className="text-[11px] font-mono text-sky-700 ml-auto">
                            Rain: {data.weather_info.precipitation_probability}%
                          </span>
                        </div>

                        <p className="text-[11px] text-[#7B4D36] font-light leading-relaxed">
                          {data.weather_info.advisory}
                        </p>
                      </div>
                    )}

                    {/* Budget Awareness */}
                    {data.budget_info && (
                      <div className="p-3.5 rounded-2xl bg-white border border-[#E5D5BA] space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#173B32] uppercase tracking-wider font-mono">
                            <Wallet className="w-3.5 h-3.5 text-[#B65E3C]" />
                            <span>Budget Overview</span>
                          </div>
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                            data.budget_info.status === "on_track"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}>
                            {data.budget_info.status.replace("_", " ")}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-1 text-center font-mono">
                          <div className="bg-[#FAF7F0] p-1.5 rounded-lg border border-[#E5D5BA]">
                            <div className="text-[9px] text-[#7B4D36]">SPENT</div>
                            <div className="text-xs font-bold text-[#173B32]">
                              ₹{Math.round(data.budget_info.budget_spent)}
                            </div>
                          </div>
                          <div className="bg-[#FAF7F0] p-1.5 rounded-lg border border-[#E5D5BA]">
                            <div className="text-[9px] text-[#7B4D36]">EST. HERE</div>
                            <div className="text-xs font-bold text-[#B65E3C]">
                              ₹{Math.round(data.budget_info.estimated_arrival_spend)}
                            </div>
                          </div>
                          <div className="bg-[#FAF7F0] p-1.5 rounded-lg border border-[#E5D5BA]">
                            <div className="text-[9px] text-[#7B4D36]">REMAINING</div>
                            <div className="text-xs font-bold text-emerald-800">
                              ₹{Math.round(data.budget_info.remaining_budget)}
                            </div>
                          </div>
                        </div>

                        <p className="text-[10px] text-[#7B4D36] font-mono text-center">
                          Estimated costs are not deducted until actually spent.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Local Mobility Options */}
                  {data.local_transport_options && data.local_transport_options.length > 0 && (
                    <div className="p-4 rounded-2xl bg-white border border-[#E5D5BA] space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-[#173B32] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                          <Bike className="w-3.5 h-3.5 text-[#B65E3C]" />
                          <span>Realistic Transport from Arrival Point</span>
                        </h4>
                        <span className="text-[10px] font-mono text-[#7B4D36]">Verified tariffs</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {data.local_transport_options.map((t, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] flex flex-col justify-between space-y-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between font-bold text-[#173B32]">
                              <span className="truncate">{t.mode}</span>
                              <span className="text-[#B65E3C] font-mono shrink-0">{t.est_fare}</span>
                            </div>

                            {t.duration && (
                              <div className="text-[11px] font-mono text-[#173B32]">
                                Est. travel: {t.duration}
                              </div>
                            )}

                            <div className="text-[10px] text-[#7B4D36] font-light leading-snug">
                              {t.tip || (t.pickup_location ? `Pickup: ${t.pickup_location}` : "Available outside terminal.")}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : null}
        </div>

        {/* ======================================================== */}
        {/* FOOTER ACTION BAR                                        */}
        {/* ======================================================== */}
        <div className="p-3.5 sm:p-4 border-t border-[#E5D5BA] bg-[#FAF7F0] flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => setShowProblemSheet(true)}
            className="px-3.5 py-2.5 rounded-xl bg-[#EFE5D2] hover:bg-[#E5D5BA] text-[#173B32] text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#B65E3C]" />
            <span>Something went wrong?</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#FAF4E8] text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
          >
            Back to Trip
          </button>
        </div>

        {/* ======================================================== */}
        {/* FOCUSED SUB-SHEETS (WEATHER / BUDGET / MOBILITY)         */}
        {/* ======================================================== */}
        {compactSubSheet && data && (
          <div
            className="absolute inset-0 bg-[#0F2924]/85 backdrop-blur-md z-60 flex flex-col justify-end p-0 sm:p-4 animate-fadeIn"
            onClick={() => setCompactSubSheet(null)}
          >
            <div
              className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-t-3xl sm:rounded-3xl max-h-[80vh] overflow-y-auto p-5 space-y-4 shadow-2xl animate-slideUp text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#E5D5BA]">
                <h3 className="font-serif font-black text-lg text-[#173B32] flex items-center gap-2">
                  {compactSubSheet === "weather" && <Sun className="w-5 h-5 text-amber-500" />}
                  {compactSubSheet === "budget" && <Wallet className="w-5 h-5 text-[#B65E3C]" />}
                  {compactSubSheet === "mobility" && <Bike className="w-5 h-5 text-[#173B32]" />}
                  <span>
                    {compactSubSheet === "weather" && "Arrival Weather Intelligence"}
                    {compactSubSheet === "budget" && "Arrival Budget Breakdown"}
                    {compactSubSheet === "mobility" && "Local Transport Options"}
                  </span>
                </h3>
                <button
                  onClick={() => setCompactSubSheet(null)}
                  className="p-1 rounded-full text-[#7B4D36] hover:bg-[#EFE5D2]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {compactSubSheet === "weather" && data.weather_info && (
                <div className="space-y-3">
                  <div className="flex items-baseline gap-3">
                    <span className="font-serif font-black text-3xl text-[#173B32]">
                      {Math.round(data.weather_info.temperature_c)}°C
                    </span>
                    <span className="text-sm font-bold text-[#7B4D36]">
                      {data.weather_info.condition}
                    </span>
                    <span className="text-xs font-mono text-sky-700 ml-auto">
                      Rain Chance: {data.weather_info.precipitation_probability}%
                    </span>
                  </div>
                  <p className="text-xs text-[#7B4D36] leading-relaxed bg-[#FAF4E8] p-3 rounded-xl border border-[#E5D5BA]">
                    {data.weather_info.advisory}
                  </p>
                </div>
              )}

              {compactSubSheet === "budget" && data.budget_info && (
                <div className="space-y-3 font-mono">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-[#FAF7F0] p-2.5 rounded-xl border border-[#E5D5BA]">
                      <div className="text-[10px] text-[#7B4D36]">SPENT</div>
                      <div className="text-sm font-bold text-[#173B32]">
                        ₹{Math.round(data.budget_info.budget_spent)}
                      </div>
                    </div>
                    <div className="bg-[#FAF7F0] p-2.5 rounded-xl border border-[#E5D5BA]">
                      <div className="text-[10px] text-[#7B4D36]">EST. ARRIVAL</div>
                      <div className="text-sm font-bold text-[#B65E3C]">
                        ₹{Math.round(data.budget_info.estimated_arrival_spend)}
                      </div>
                    </div>
                    <div className="bg-[#FAF7F0] p-2.5 rounded-xl border border-[#E5D5BA]">
                      <div className="text-[10px] text-[#7B4D36]">REMAINING</div>
                      <div className="text-sm font-bold text-emerald-800">
                        ₹{Math.round(data.budget_info.remaining_budget)}
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#7B4D36] text-center pt-1 font-sans">
                    Estimated costs are not deducted until actually spent.
                  </p>
                </div>
              )}

              {compactSubSheet === "mobility" && data.local_transport_options && (
                <div className="space-y-2">
                  {data.local_transport_options.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white border border-[#E5D5BA] flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-[#173B32]">{t.mode}</div>
                        <div className="text-[11px] text-[#7B4D36] mt-0.5">
                          {t.tip || (t.pickup_location ? `Pickup: ${t.pickup_location}` : "Available outside gate.")}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-[#B65E3C]">{t.est_fare}</div>
                        {t.duration && <div className="text-[10px] font-mono text-[#7B4D36]">{t.duration}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SOMETHING WENT WRONG ISSUE RESOLUTION SHEET              */}
        {/* ======================================================== */}
        {showProblemSheet && (
          <div
            className="absolute inset-0 bg-[#0F2924]/85 backdrop-blur-md z-60 flex flex-col justify-end p-0 sm:p-4 animate-fadeIn"
            onClick={() => setShowProblemSheet(false)}
          >
            <div
              className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto p-5 space-y-4 shadow-2xl animate-slideUp text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#E5D5BA]">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[#B65E3C]" />
                  <h3 className="font-serif font-black text-lg text-[#173B32]">
                    What Went Wrong?
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowProblemSheet(false);
                    setSelectedProblem(null);
                  }}
                  className="p-1 rounded-full text-[#7B4D36] hover:bg-[#EFE5D2]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-[#7B4D36] font-light">
                Select your immediate issue. VANVAS provides grounded step-by-step guidance and connects to conversational assistance:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {COMMON_PROBLEMS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProblem(p)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedProblem?.id === p.id
                        ? "bg-[#173B32] text-[#FAF4E8] border-[#173B32] shadow-sm"
                        : "bg-white hover:bg-[#FAF7F0] text-[#173B32] border-[#E5D5BA]"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <span>{p.icon}</span>
                      <span>{p.label}</span>
                    </div>
                  </button>
                ))}
              </div>

              {selectedProblem && (
                <div className="p-4 rounded-2xl bg-white border-2 border-[#B65E3C]/40 space-y-3">
                  <div className="font-bold text-xs uppercase tracking-wider text-[#B65E3C] font-mono">
                    Immediate Actionable Advice
                  </div>
                  <p className="text-xs text-[#173B32] leading-relaxed">
                    {selectedProblem.immediateAdvice}
                  </p>

                  <div className="pt-2 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleAskVanvasProblem(selectedProblem)}
                      className="px-4 py-2.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#FAF4E8] font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#B49252]" />
                      <span>Ask VANVAS for Help</span>
                    </button>
                    <span className="text-[10px] font-mono text-[#7B4D36]">
                      Resolves in {destinationName} context
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
