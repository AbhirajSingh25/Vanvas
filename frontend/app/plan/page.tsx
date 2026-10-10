"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles, MapPin, Calendar, Wallet, Users, Compass, Check,
  ArrowRight, ArrowLeft, Search, Loader2, RefreshCw, AlertCircle,
  Bus, Train, Plane, Car, CarTaxiFront, ExternalLink, Navigation,
  ShieldCheck, Clock, Moon, Sun, ArrowUpRight, Lock, User as UserIcon
} from "lucide-react";
import { api } from "@/lib/api";
import { Destination, TransportOption } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useDensity } from "@/context/DensityContext";
import confetti from "canvas-confetti";
import { TravelStamp } from "@/components/ui/TravelStamp";
import { getCurrentGPSPosition } from "@/lib/locationService";
import {
  CANONICAL_DESTINATIONS,
  CANONICAL_HINDI_NAMES,
} from "@/lib/canonicalDestinations";

const POPULAR_ORIGIN_HUBS = [
  { name: "Delhi NCR", slug: "delhi", label: "Delhi" },
  { name: "Chandigarh", slug: "chandigarh", label: "Chandigarh" },
  { name: "Mumbai", slug: "mumbai", label: "Mumbai" },
  { name: "Bengaluru", slug: "bengaluru", label: "Bengaluru" },
  { name: "Jaipur", slug: "jaipur", label: "Jaipur" },
  { name: "Dehradun", slug: "dehradun", label: "Dehradun" },
  { name: "Kolkata", slug: "kolkata", label: "Kolkata" },
  { name: "Pune", slug: "pune", label: "Pune" },
  { name: "Hyderabad", slug: "hyderabad", label: "Hyderabad" },
  { name: "Ahmedabad", slug: "ahmedabad", label: "Ahmedabad" },
];

function PlanWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawInitial = searchParams?.get("dest") || searchParams?.get("destination") || "manali";
  const initialDest = rawInitial.replace(/^(dyn|dest)-/, "").trim() || "manali";
  const hasExplicitDest = Boolean(searchParams?.get("dest") || searchParams?.get("destination"));
  const urlPlace = searchParams?.get("place") || searchParams?.get("place_name") || "";
  const urlOrigin = searchParams?.get("origin") || "";
  const urlBudget = searchParams?.get("budget") || "";
  const urlDays = searchParams?.get("days") || "";
  const urlCompanion = searchParams?.get("companion") || "";
  const urlTransport = searchParams?.get("transport") || "";

  const [anchorPlace, setAnchorPlace] = useState<string>(urlPlace);

  const { user, login, register } = useAuth();
  const { isCompact } = useDensity();

  // Progressive Step State: 1 to 6 (Mandatory flow), plus 7 (Review)
  // Step 1: WHERE ARE YOU STARTING FROM?
  // Step 2: WHERE ARE YOU GOING?
  // Step 3: WHEN?
  // Step 4: WHO IS TRAVELLING?
  // Step 5: WHAT IS YOUR BUDGET?
  // Step 6: HOW ARE YOU GETTING THERE?
  // Step 7: REVIEW & GENERATE
  const initialStep = urlOrigin ? (hasExplicitDest ? 3 : 2) : 1;
  const [currentStep, setCurrentStep] = useState<number>(() => initialStep);
  const [stepDirection, setStepDirection] = useState<"next" | "prev">("next");

  // Keep browser back button in sync with wizard step state
  useEffect(() => {
    // Initialize current history entry if vanvasStep is missing, preserving router state
    if (typeof window !== "undefined") {
      const existingStep = window.history.state?.vanvasStep;
      if (typeof existingStep !== "number") {
        window.history.replaceState({ ...(window.history.state || {}), vanvasStep: initialStep }, "", window.location.href);
      }
    }

    const handlePopState = (e: PopStateEvent) => {
      if (e.state && typeof e.state.vanvasStep === "number") {
        setStepDirection(e.state.vanvasStep < currentStep ? "prev" : "next");
        setCurrentStep(e.state.vanvasStep);
      } else {
        // Popped back to initial entry before wizard progression
        setStepDirection("prev");
        setCurrentStep(initialStep);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [initialStep, currentStep]);

  const goToStep = (stepNumber: number, direction: "next" | "prev" = "next") => {
    setStepDirection(direction);
    setCurrentStep(stepNumber);
    if (typeof window !== "undefined") {
      window.history.pushState({ ...(window.history.state || {}), vanvasStep: stepNumber }, "", window.location.href);
    }
  };

  // Step 1: Origin State
  const [originCity, setOriginCity] = useState<string>(urlOrigin || "");
  const [originSearch, setOriginSearch] = useState<string>("");
  const [isLocatingGPS, setIsLocatingGPS] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Step 2: Destination Resolution State
  const [destinations, setDestinations] = useState<Destination[]>(CANONICAL_DESTINATIONS);
  const [loadingDestinations, setLoadingDestinations] = useState(true);
  const [selectedDestId, setSelectedDestId] = useState<string>(initialDest);
  const [selectedDestObject, setSelectedDestObject] = useState<Destination | any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  // Step 3: Dates & Duration State
  const [dateSelectionType, setDateSelectionType] = useState<"this_weekend" | "next_week" | "next_month" | "custom">("this_weekend");
  const [startDate, setStartDate] = useState<string>(() => {
    const today = new Date();
    const day = today.getDay();
    const daysUntilSat = (6 - day + 7) % 7 || 7;
    const sat = new Date();
    sat.setDate(today.getDate() + daysUntilSat);
    return sat.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    const addDays = urlDays ? Math.max(1, parseInt(urlDays, 10)) - 1 : 3;
    d.setDate(d.getDate() + (isNaN(addDays) ? 3 : addDays));
    return d.toISOString().split("T")[0];
  });
  const [daysCount, setDaysCount] = useState<number>(() => (urlDays ? parseInt(urlDays, 10) || 4 : 4));

  // Step 4: Companions State
  const [companionType, setCompanionType] = useState<string>(() => {
    if (urlCompanion) {
      const match = ["Solo", "Couple", "Friends", "Family"].find(
        (c) => c.toLowerCase() === urlCompanion.toLowerCase()
      );
      if (match) return match;
    }
    return "Couple";
  });
  const [travellersCount, setTravellersCount] = useState<number>(() => {
    if (urlCompanion?.toLowerCase() === "solo" || urlCompanion?.toLowerCase() === "just me") return 1;
    if (urlCompanion?.toLowerCase() === "friends") return 3;
    if (urlCompanion?.toLowerCase() === "family") return 4;
    return 2;
  });

  // Step 5: Travel Style & Budget Tier
  const [travelStyle, setTravelStyle] = useState<string>("Balanced");
  const [budgetEstimate, setBudgetEstimate] = useState<number>(25000);
  const [selectedVibes, setSelectedVibes] = useState<string[]>(["Nature", "Food", "Slow"]);

  // Step 6: Transport Intelligence State
  const [selectedTransportMode, setSelectedTransportMode] = useState<string>(urlTransport || "Bus");
  const [selectedTransportOption, setSelectedTransportOption] = useState<TransportOption | null>(null);
  const [transportOptions, setTransportOptions] = useState<TransportOption[]>([]);
  const [loadingTransport, setLoadingTransport] = useState<boolean>(false);

  // Step 7: Auth Modal / Inline Auth State (for guests)
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authFullName, setAuthFullName] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState("Drafting your itinerary...");
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Calculate estimated budget when days, travellers, and style change
  useEffect(() => {
    const perDayPerPerson =
      travelStyle === "Budget" ? 2200 : travelStyle === "Comfort" ? 6500 : 3800;
    const est = daysCount * travellersCount * perDayPerPerson;
    setBudgetEstimate(urlBudget ? parseFloat(urlBudget) : est);
  }, [daysCount, travellersCount, travelStyle, urlBudget]);

  // Load initial destinations
  useEffect(() => {
    api.getDestinations(false)
      .then((data) => {
        const loaded = data && data.length > 0 ? data : CANONICAL_DESTINATIONS;
        setDestinations(loaded);
        const match = loaded.find(
          (d) =>
            d.id === initialDest ||
            d.slug.toLowerCase() === initialDest.toLowerCase() ||
            d.id === `dest-${initialDest.toLowerCase()}`
        );
        if (match) {
          setSelectedDestId(match.id);
          setSelectedDestObject(match);
        } else {
          api.resolveDestination(initialDest).then((res) => {
            if (res) {
              setSelectedDestId(res.id || res.slug);
              setSelectedDestObject(res);
            }
          }).catch(() => {});
        }
      })
      .catch(() => {
        setDestinations(CANONICAL_DESTINATIONS);
      })
      .finally(() => setLoadingDestinations(false));
  }, [initialDest]);

  // Debounced search for destination input
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    const abortController = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.searchDestinations(searchQuery, 6, abortController.signal);
        setSearchResults(res || []);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Destination search error:", err);
        }
      } finally {
        setIsSearching(false);
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [searchQuery]);

  // Load transport options when reaching Step 6 or when origin/dest/mode changes
  useEffect(() => {
    if ((currentStep === 6 || currentStep === 7) && originCity) {
      const destTarget = selectedDestObject?.slug || selectedDestId || "manali";
      setLoadingTransport(true);
      api.getTransportOptions(destTarget, originCity.trim(), selectedTransportMode)
        .then((opts) => {
          setTransportOptions(opts || []);
          if (opts && opts.length > 0) {
            setSelectedTransportOption(opts[0]);
          }
        })
        .catch(() => setTransportOptions([]))
        .finally(() => setLoadingTransport(false));
    }
  }, [currentStep, originCity, selectedDestId, selectedDestObject, selectedTransportMode]);

  // Step 1: Handle GPS Location Button (EXPLICIT USER ACTION ONLY)
  const handleRequestGPS = async () => {
    setIsLocatingGPS(true);
    setGpsError(null);
    try {
      const res = await getCurrentGPSPosition();
      if (res.status === "GRANTED" && res.coords) {
        setOriginCity(`Detected Location (${res.coords.latitude.toFixed(2)}°N, ${res.coords.longitude.toFixed(2)}°E)`);
        const nextStep = hasExplicitDest ? 3 : 2;
        setTimeout(() => goToStep(nextStep, "next"), 200);
      } else {
        setGpsError(res.errorMessage || "Location permission was not granted. Please pick or type your starting city.");
      }
    } catch {
      setGpsError("Could not access location. Please type or select your starting city.");
    } finally {
      setIsLocatingGPS(false);
    }
  };

  const handleSelectOrigin = (city: string) => {
    setOriginCity(city.trim());
    setOriginSearch("");
    setGpsError(null);
    const nextStep = hasExplicitDest ? 3 : 2;
    setTimeout(() => goToStep(nextStep, "next"), 150);
  };

  // Step 2: Handle Destination selection
  const handleSelectDestination = async (destItem: any, autoAdvance = true) => {
    setResolveError(null);
    setSearchQuery("");
    setSearchResults([]);
    setIsResolving(true);
    try {
      const rawQ =
        typeof destItem === "string"
          ? destItem
          : destItem.canonical_slug || destItem.name || destItem.slug;
      const q = String(rawQ).replace(/^(dyn|dest)-/, "").trim();
      const res = await api.resolveDestination(q);
      if (res) {
        setSelectedDestId(res.id || res.slug);
        setSelectedDestObject(res);
        if (autoAdvance) {
          setTimeout(() => goToStep(3, "next"), 150);
        }
      } else {
        setResolveError(`Could not resolve '${q}'. Try another location.`);
      }
    } catch (err: any) {
      setResolveError(err.message || "Failed to resolve destination");
    } finally {
      setIsResolving(false);
    }
  };

  // Step 3: Handle Dates selection
  const handleDatePresetSelect = (preset: "this_weekend" | "next_week" | "next_month") => {
    setDateSelectionType(preset);
    const today = new Date();
    const start = new Date();
    if (preset === "this_weekend") {
      const day = today.getDay();
      const daysUntilSat = (6 - day + 7) % 7 || 7;
      start.setDate(today.getDate() + daysUntilSat);
    } else if (preset === "next_week") {
      start.setDate(today.getDate() + 7);
    } else if (preset === "next_month") {
      start.setDate(today.getDate() + 30);
    }
    const end = new Date(start);
    end.setDate(start.getDate() + (daysCount - 1));

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
    setTimeout(() => goToStep(4, "next"), 150);
  };

  const handleDaysSelect = (days: number) => {
    setDaysCount(days);
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + (days - 1));
    setEndDate(end.toISOString().split("T")[0]);
    setTimeout(() => goToStep(4, "next"), 150);
  };

  // Step 4: Handle Companion selection
  const handleCompanionSelect = (type: string, count: number) => {
    setCompanionType(type);
    setTravellersCount(count);
    setTimeout(() => goToStep(5, "next"), 150);
  };

  // Step 5: Handle Budget / Style selection
  const handleStyleSelect = (style: string) => {
    setTravelStyle(style);
    setTimeout(() => goToStep(6, "next"), 150);
  };

  // Step 6: Handle Transport Mode selection (Explicit user choice, no auto-advance)
  const handleTransportSelect = (mode: string) => {
    if (mode !== selectedTransportMode) {
      setSelectedTransportMode(mode);
      setSelectedTransportOption(null);
    }
  };

  // Step 7: Handle Guest Inline Auth
  const handleInlineAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword) {
      setAuthError("Please provide both email and password.");
      return;
    }
    setAuthSubmitting(true);
    setAuthError(null);
    try {
      if (authMode === "register") {
        if (!authFullName.trim()) {
          setAuthError("Please provide your full name.");
          setAuthSubmitting(false);
          return;
        }
        await register(authEmail.trim(), authPassword, authFullName.trim());
        await login(authEmail.trim(), authPassword);
      } else {
        await login(authEmail.trim(), authPassword);
      }
      setAuthError(null);
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed. Please try again.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Step 7: Handle Trip Creation Execution
  const handleBuildTrip = async () => {
    if (isGenerating) return;

    if (!originCity || !originCity.trim()) {
      setGenerationError("Starting city is required. Please choose where you are starting.");
      goToStep(1, "prev");
      return;
    }
    if (!selectedTransportMode) {
      setGenerationError("Transport mode is required. Please choose how you want to travel.");
      goToStep(6, "prev");
      return;
    }

    setIsGenerating(true);
    const msgs = [
      "Securing route transit details...",
      "Clustering scenic stops & local trails...",
      "Matching verified stays & mountain dhabas...",
      "Calculating realistic day timing...",
      "Binding your personalized VANVAS journal...",
    ];
    let idx = 0;
    const timer = setInterval(() => {
      idx = (idx + 1) % msgs.length;
      setGenMessage(msgs[idx]);
    }, 700);

    setGenerationError(null);
    try {
      const targetSlug =
        selectedDestObject?.canonical_slug ||
        selectedDestObject?.slug ||
        selectedDestId;
      const cleanTarget = String(targetSlug).replace(/^(dyn|dest)-/, "").trim();
      const targetId =
        selectedDestObject?.id ||
        (selectedDestObject?.is_curated !== false
          ? `dest-${cleanTarget}`
          : `dyn-${cleanTarget}`);

      const tripInterests =
        anchorPlace && !selectedVibes.some((v) => v.toLowerCase().includes(anchorPlace.toLowerCase()))
          ? [...selectedVibes, `Anchor: ${anchorPlace}`]
          : selectedVibes;

      const trip = await api.createTrip({
        destination_id: targetId,
        start_date: startDate,
        end_date: endDate,
        budget: budgetEstimate,
        travellers_count: travellersCount,
        companion_type: companionType,
        travel_style: travelStyle,
        wake_up_preference: "Normal",
        activity_intensity: "Balanced",
        interests: tripInterests,
        origin_city: originCity.trim(),
        transport_mode: selectedTransportMode.toLowerCase().replace(" ", "_"),
        transport_details: selectedTransportOption ? {
          id: selectedTransportOption.id,
          operator_name: selectedTransportOption.operator_name,
          transport_type: selectedTransportOption.transport_type,
          departure_time: selectedTransportOption.departure_time,
          arrival_time: selectedTransportOption.arrival_time,
          duration_hours: selectedTransportOption.duration_hours,
          price: selectedTransportOption.price,
          departure_location: selectedTransportOption.departure_location,
          arrival_location: selectedTransportOption.arrival_location,
          booking_url: selectedTransportOption.booking_url,
          booking_label: selectedTransportOption.booking_label,
          recommendation_badge: selectedTransportOption.recommendation_badge,
          data_state: selectedTransportOption.data_state,
          disclaimer: selectedTransportOption.disclaimer,
        } : undefined,
        planning_mode: daysCount === 1 ? "one_day" : daysCount === 2 ? "weekend" : "multi_day",
      });

      clearInterval(timer);

      // Pre-cache trip into local storage for immediate visibility in /trips & offline
      if (typeof window !== "undefined" && trip?.id) {
        try {
          localStorage.setItem(`vanvas_trip_${trip.id}`, JSON.stringify(trip));
          localStorage.setItem(`vanvas_offline_trip_${trip.id}`, JSON.stringify(trip));
          let existingList: any[] = [];
          try {
            const existingRaw = localStorage.getItem("vanvas_cached_trips");
            if (existingRaw) {
              const parsed = JSON.parse(existingRaw);
              if (Array.isArray(parsed)) existingList = parsed;
            }
          } catch {
            existingList = [];
          }
          const newSummary = {
            id: trip.id,
            title: trip.title || `Expedition to ${selectedDestObject?.name || cleanTarget}`,
            destination_name: selectedDestObject?.name || cleanTarget,
            destination_slug: cleanTarget,
            start_date: trip.start_date,
            end_date: trip.end_date,
            num_days: trip.num_days || daysCount,
            companion_type: trip.companion_type || companionType,
            travel_style: trip.travel_style || travelStyle,
            budget_total: trip.budget_total || budgetEstimate,
            budget_spent: 0,
            status: "active",
            hero_image: selectedDestObject?.image_url,
          };
          const filtered = existingList.filter((item: any) => item && item.id !== trip.id);
          localStorage.setItem("vanvas_cached_trips", JSON.stringify([newSummary, ...filtered]));
        } catch {}
      }

      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch {}

      if (selectedTransportMode.toLowerCase().includes("road")) {
        router.push(`/road-trip?origin=${encodeURIComponent(originCity.trim())}&dest=${encodeURIComponent(cleanTarget)}&tripId=${trip.id}&travellers=${travellersCount}&budget=${budgetEstimate}`);
      } else {
        router.push(`/trips/${trip.id}`);
      }
    } catch (err: any) {
      clearInterval(timer);
      setIsGenerating(false);
      setGenerationError(err.message || "Failed to generate trip. Please try again.");
    }
  };

  const currentDestName = selectedDestObject?.name || selectedDestId.charAt(0).toUpperCase() + selectedDestId.slice(1);
  const currentOriginName = originCity || "Your Starting Location";

  // Compute Best Travel Time recommendation dynamically based on geography, selected mode, and option
  const isHimalayan = ["manali", "kasol", "rishikesh", "chopta", "spiti", "dharamshala", "leh", "jibhi", "shimla", "mussoorie", "mcleodganj", "nainital"].some(
    (h) => currentDestName.toLowerCase().includes(h)
  );

  const getModeSpecificRecommendation = () => {
    const modeKey = selectedTransportMode.toLowerCase().replace(/\s+/g, "");
    if (modeKey.includes("bus")) {
      if (selectedTransportOption) {
        return {
          badge: selectedTransportOption.recommendation_badge || "RECOMMENDED BUS",
          mode: "Bus",
          headline: `🚌 ${selectedTransportOption.operator_name || "Volvo Semi-Sleeper"}`,
          timing: `${selectedTransportOption.departure_time} → ${selectedTransportOption.arrival_time} (~${selectedTransportOption.duration_hours}h)`,
          rationale: isHimalayan
            ? `Arrives around ${selectedTransportOption.arrival_time}, leaving the morning free for hotel check-in, breakfast, and mountain exploration without daylight fatigue.`
            : `Direct coach connection with comfortable overnight transit.`,
        };
      }
      return {
        badge: "BEST FOR YOU",
        mode: "Overnight Bus",
        headline: "🚌 Volvo AC Semi-Sleeper / Sleeper",
        timing: isHimalayan ? "20:00 → 08:30 (~12.5 hrs)" : "Scheduled Intercity Coach",
        rationale: isHimalayan
          ? "Saves a hotel night and reaches the valley early in the morning so Day 1 is fully usable."
          : "Direct budget-friendly transit with predictable arrival.",
      };
    }

    if (modeKey.includes("train")) {
      if (isHimalayan) {
        return {
          badge: "RAILHEAD + TRANSFER",
          mode: "Train",
          headline: "🚆 Train to Railhead + Onward Hill Transfer",
          timing: "Express to Chandigarh/Kalka (~4h) + Onward Hill Cab/Bus (~7.5h)",
          rationale: "No direct rail track reaches high mountain valleys. Disembark at Chandigarh/Kalka railhead and continue via NH3/NH205 scenic hill road.",
        };
      }
      if (selectedTransportOption) {
        return {
          badge: "RECOMMENDED TRAIN",
          mode: "Train",
          headline: `🚆 ${selectedTransportOption.operator_name || "Vande Bharat / Superfast Express"}`,
          timing: `${selectedTransportOption.departure_time} → ${selectedTransportOption.arrival_time} (~${selectedTransportOption.duration_hours}h)`,
          rationale: "Punctual rail transit with scenic daytime corridor views and high passenger comfort.",
        };
      }
      return {
        badge: "EXPRESS RAIL",
        mode: "Train",
        headline: "🚆 Vande Bharat / Superfast Express",
        timing: "Morning departure with fast arrival",
        rationale: "Fastest ground transit with onboard dining and zero road congestion.",
      };
    }

    if (modeKey.includes("flight")) {
      if (selectedTransportOption) {
        return {
          badge: isHimalayan ? "AIR TRANSIT (WEATHER DEPENDENT)" : "FASTEST TRANSIT",
          mode: "Flight",
          headline: `✈ ${selectedTransportOption.operator_name || "Commercial Airline"}`,
          timing: `${selectedTransportOption.departure_location} (${selectedTransportOption.departure_time}) → ${selectedTransportOption.arrival_location} (${selectedTransportOption.arrival_time})`,
          rationale: isHimalayan
            ? "Fastest transit to nearby valley airport (e.g. Bhuntar/Kullu). Requires ~1.5h onward road transfer to stay. Morning departures are recommended for calmer mountain winds."
            : "Direct airport-to-airport transit maximizing active trip time.",
        };
      }
      return {
        badge: "AIR TRAVEL",
        mode: "Flight",
        headline: "✈ Morning Flight + Local Transfer",
        timing: isHimalayan ? "DEL → KUU (Bhuntar) + ~1.5h cab to valley" : "Direct Flight Connection",
        rationale: isHimalayan
          ? "Short flight duration followed by scenic valley road transfer. Ideal when time is limited."
          : "Quickest transit between major transit hubs.",
      };
    }

    if (modeKey.includes("road")) {
      return {
        badge: "RECOMMENDED DEPARTURE WINDOW",
        mode: "Road Trip",
        headline: "🚗 05:30 – 06:30 Early Departure Window",
        timing: isHimalayan ? "Depart 05:30 → Arrive ~17:30 (~530 km, ~11h45m with halts)" : "Flexible expressway transit at your own pace",
        rationale: isHimalayan
          ? "WHY: Cleaner city exit avoiding metro traffic, smooth plains cruising before midday, and maximum daylight for hill switchbacks."
          : "Complete freedom for spontaneous dhabas, viewpoint breaks, and scenic detours.",
      };
    }

    // Cab / Transfer
    return {
      badge: "PRIVATE DOOR-TO-DOOR",
      mode: "Cab",
      headline: "🚕 Dedicated Outstation Cab Transfer",
      timing: isHimalayan ? "06:00 Recommended Departure (~11.5h door-to-door)" : "Doorstep pickup to destination stay",
      rationale: "Private air-conditioned ride with doorstep pickup and verified driver experienced in highway and hill driving.",
    };
  };

  const bestTravelRecommendation = getModeSpecificRecommendation();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#EFE5D2] flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="max-w-xl mx-auto w-full">
        {/* Loading Overlay */}
        {isGenerating && (
          <div className="fixed inset-0 z-50 bg-[#0F2924]/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-[#EFE5D2] animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-[#B65E3C] flex items-center justify-center shadow-2xl mb-4">
              <Sparkles className="w-7 h-7 text-[#FAF4E8] animate-spin" />
            </div>
            <h3 className="font-serif font-black text-2xl text-[#FAF4E8] mb-2">
              Building Your Trip from {currentOriginName} to {currentDestName}
            </h3>
            <p className="text-xs sm:text-sm font-mono text-[#D8DED5] animate-pulse">
              {genMessage}
            </p>
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
                  onClick={() => {
                    if (typeof window !== "undefined" && window.history.state?.vanvasStep > 1) {
                      window.history.back();
                    } else {
                      goToStep(Math.max(1, currentStep - 1), "prev");
                    }
                  }}
                  className="p-1.5 rounded-xl hover:bg-[#EFE5D2] interactive-btn text-[#173B32] cursor-pointer flex items-center gap-1 text-xs font-bold"
                  aria-label="Previous question"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              )}
              {currentStep === 1 && (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B65E3C]">
                  VANVAS PLANNER
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#173B32]">
                {currentStep <= 7 ? `0${currentStep} / 07` : "07 / 07"}
              </span>
              <div className="w-16 sm:w-24 bg-[#E5D5BA] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#173B32] h-full transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${(Math.min(currentStep, 7) / 7) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* STEP 1: WHERE ARE YOU STARTING FROM?                      */}
          {/* ======================================================== */}
          {currentStep === 1 && (
            <div className={`space-y-5 ${stepDirection === "prev" ? "animate-vanvas-slide-right" : "animate-vanvas-slide-left"}`}>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C] tracking-wider block">
                  STEP 01
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32] mt-1">
                  Where are you starting from?
                </h2>
                <p className="text-xs text-[#7B4D36] mt-0.5">
                  Pick your departure city or share your current location.
                </p>
              </div>

              {/* Explicit GPS Request Button (User action only) */}
              <button
                type="button"
                onClick={handleRequestGPS}
                disabled={isLocatingGPS}
                className="w-full p-3.5 rounded-2xl bg-white hover:bg-[#EFE5D2] border-2 border-[#173B32]/30 hover:border-[#173B32] text-left flex items-center justify-between cursor-pointer transition-all shadow-xs group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#173B32] text-[#EFE5D2] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {isLocatingGPS ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#B49252]" />
                    ) : (
                      <Navigation className="w-4 h-4 text-[#B49252]" />
                    )}
                  </div>
                  <div>
                    <span className="font-serif font-bold text-sm text-[#173B32] block">
                      Use my location
                    </span>
                    <span className="text-[10px] text-[#7B4D36]">
                      Explicit GPS check (never auto-requested)
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-[#B65E3C] group-hover:translate-x-0.5 transition-transform">
                  Detect →
                </span>
              </button>

              {gpsError && (
                <p className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                  {gpsError}
                </p>
              )}

              {/* Popular Hubs Grid */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-mono font-bold uppercase text-[#7B4D36] tracking-wider block">
                  Popular Departure Hubs:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {POPULAR_ORIGIN_HUBS.map((hub) => {
                    const isSelected = originCity.toLowerCase() === hub.label.toLowerCase();
                    return (
                      <button
                        key={hub.slug}
                        type="button"
                        onClick={() => handleSelectOrigin(hub.label)}
                        className={`p-3 rounded-2xl text-xs font-bold text-center interactive-pill cursor-pointer border-2 ${
                          isSelected
                            ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-md scale-102"
                            : "bg-white text-[#173B32] border-[#E5D5BA] hover:bg-[#EFE5D2] hover:border-[#173B32]"
                        }`}
                      >
                        {hub.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search / Type Origin City */}
              <div className="pt-2 border-t border-[#E5D5BA]">
                <label className="block text-[10px] font-mono font-bold uppercase text-[#7B4D36] mb-1.5">
                  Or type any city/town in India:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={originSearch}
                    onChange={(e) => setOriginSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && originSearch.trim()) {
                        e.preventDefault();
                        handleSelectOrigin(originSearch.trim());
                      }
                    }}
                    placeholder="e.g. Chandigarh, Lucknow, Indore..."
                    className="flex-1 p-2.5 bg-white border-2 border-[#E5D5BA] rounded-xl text-xs font-bold text-[#173B32] focus:outline-none focus:border-[#173B32]"
                  />
                  <button
                    type="button"
                    disabled={!originSearch.trim()}
                    onClick={() => handleSelectOrigin(originSearch.trim())}
                    className="px-4 py-2.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] disabled:opacity-40 text-[#EFE5D2] font-bold text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Set Origin →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: WHERE ARE YOU GOING?                              */}
          {/* ======================================================== */}
          {currentStep === 2 && (
            <div className={`space-y-5 ${stepDirection === "prev" ? "animate-vanvas-slide-right" : "animate-vanvas-slide-left"}`}>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C] tracking-wider block">
                  STEP 02
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32] mt-1">
                  Where are you going?
                </h2>
                <p className="text-xs text-[#7B4D36] mt-0.5">
                  Departing from <strong className="text-[#173B32]">{originCity || "Delhi"}</strong>.
                </p>
              </div>

              {/* Quick Choice Buttons (Single tap -> Auto-advance) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { name: "Manali", slug: "manali" },
                  { name: "Goa", slug: "goa" },
                  { name: "Jaipur", slug: "jaipur" },
                  { name: "Udaipur", slug: "udaipur" },
                  { name: "Rishikesh", slug: "rishikesh" },
                  { name: "Spiti", slug: "spiti" },
                  { name: "Kasol", slug: "kasol" },
                  { name: "Varanasi", slug: "varanasi" },
                ].map((d) => {
                  const isSelected = selectedDestId.toLowerCase().includes(d.slug);
                  return (
                    <button
                      key={d.slug}
                      type="button"
                      onClick={() => handleSelectDestination(d)}
                      className={`p-3 rounded-2xl text-xs font-bold text-center interactive-pill cursor-pointer border-2 ${
                        isSelected
                          ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-md scale-102"
                          : "bg-white text-[#173B32] border-[#E5D5BA] hover:bg-[#EFE5D2] hover:border-[#173B32]"
                      }`}
                    >
                      {d.name}
                    </button>
                  );
                })}
              </div>

              {/* Search Bar with Autocomplete */}
              <div className="relative pt-2">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && searchQuery.trim()) {
                        e.preventDefault();
                        handleSelectDestination(searchQuery.trim());
                      }
                    }}
                    placeholder="Or search any destination: Munnar, Leh, Ooty, Hampi..."
                    className="w-full pl-9 pr-9 py-2.5 bg-white border-2 border-[#E5D5BA] rounded-2xl text-xs font-medium text-[#20211D] placeholder:text-[#7B4D36]/60 focus:outline-none focus:border-[#173B32] transition-colors"
                  />
                  <Search className="w-4 h-4 text-[#7B4D36] absolute left-3 pointer-events-none" />
                  {(isSearching || isResolving) && (
                    <Loader2 className="w-4 h-4 text-[#B65E3C] animate-spin absolute right-3 pointer-events-none" />
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border-2 border-[#E5D5BA] rounded-2xl shadow-xl overflow-hidden divide-y divide-[#E5D5BA] max-h-52 overflow-y-auto animate-vanvas-scale">
                    {searchResults.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectDestination(item)}
                        className="w-full text-left p-3 flex items-center justify-between hover:bg-[#EFE5D2] text-[#173B32] text-xs font-bold transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#B65E3C]" />
                          <span>{item.name}</span>
                          <span className="text-[10px] text-[#7B4D36] font-normal">
                            {[item.state, item.country].filter(Boolean).join(", ")}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#B65E3C]">Select →</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {resolveError && (
                <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl animate-vanvas-fade">
                  {resolveError}
                </p>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: WHEN ARE YOU GOING?                               */}
          {/* ======================================================== */}
          {currentStep === 3 && (
            <div className={`space-y-5 ${stepDirection === "prev" ? "animate-vanvas-slide-right" : "animate-vanvas-slide-left"}`}>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C] tracking-wider block">
                  STEP 03
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32] mt-1">
                  When are you travelling?
                </h2>
                <p className="text-xs text-[#7B4D36] mt-0.5">
                  Heading from {currentOriginName} to <strong className="text-[#173B32]">{currentDestName}</strong>.
                </p>
              </div>

              {/* Quick Timing Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: "this_weekend", label: "This Weekend", desc: "Upcoming Sat–Sun" },
                  { id: "next_week", label: "Next Week", desc: "In 7 days" },
                  { id: "next_month", label: "Next Month", desc: "In ~30 days" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleDatePresetSelect(opt.id as any)}
                    className="p-4 rounded-2xl bg-white hover:bg-[#EFE5D2] border-2 border-[#E5D5BA] hover:border-[#173B32] interactive-card text-left cursor-pointer shadow-xs"
                  >
                    <div className="font-serif font-bold text-sm text-[#173B32]">{opt.label}</div>
                    <div className="text-[10px] text-[#7B4D36] mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>

              {/* Days duration selector */}
              <div className="pt-2 border-t border-[#E5D5BA]">
                <span className="block text-xs font-mono font-bold uppercase text-[#7B4D36] mb-2">
                  Trip Duration (Days):
                </span>
                <div className="grid grid-cols-5 gap-2">
                  {[2, 3, 4, 5, 6].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleDaysSelect(d)}
                      className={`py-3 rounded-2xl font-serif font-black text-center interactive-pill cursor-pointer border-2 ${
                        daysCount === d
                          ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-md scale-102"
                          : "bg-white text-[#173B32] border-[#E5D5BA] hover:bg-[#EFE5D2]"
                      }`}
                    >
                      <span className="text-base block">{d === 6 ? "6+" : d}</span>
                      <span className="text-[9px] font-mono font-normal uppercase text-[#7B4D36]">
                        {d === 1 ? "Day" : "Days"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Exact start date */}
              <div className="pt-2 border-t border-[#E5D5BA]">
                <label className="block text-xs font-mono font-bold uppercase text-[#7B4D36] mb-1.5">
                  Or pick exact start date:
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={startDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      const s = new Date(e.target.value);
                      const end = new Date(s);
                      end.setDate(s.getDate() + (daysCount - 1));
                      setEndDate(end.toISOString().split("T")[0]);
                    }}
                    className="flex-1 p-2.5 bg-white border-2 border-[#E5D5BA] rounded-xl text-xs font-bold text-[#173B32] focus:outline-none focus:border-[#173B32]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setStepDirection("next");
                      setCurrentStep(4);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] interactive-btn text-[#EFE5D2] font-bold text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 4: WHO IS TRAVELLING?                                */}
          {/* ======================================================== */}
          {currentStep === 4 && (
            <div className={`space-y-5 ${stepDirection === "prev" ? "animate-vanvas-slide-right" : "animate-vanvas-slide-left"}`}>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C] tracking-wider block">
                  STEP 04
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32] mt-1">
                  Who is travelling?
                </h2>
                <p className="text-xs text-[#7B4D36] mt-0.5">
                  Tailors stay curation, pace, and split settings.
                </p>
              </div>

              {/* Companions Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { type: "Solo", label: "Solo", count: 1, desc: "Solo adventure & flexible pace" },
                  { type: "Couple", label: "Couple", count: 2, desc: "Scenic cafes & slow evenings" },
                  { type: "Friends", label: "Friends", count: 3, desc: "Adventure, dhabas & shared stays" },
                  { type: "Family", label: "Family", count: 4, desc: "Comfort, verified food & gentle timing" },
                ].map((c) => (
                  <button
                    key={c.type}
                    type="button"
                    onClick={() => handleCompanionSelect(c.type, c.count)}
                    className={`p-4 rounded-2xl text-left interactive-card cursor-pointer border-2 ${
                      companionType === c.type
                        ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-md scale-102"
                        : "bg-white text-[#173B32] border-[#E5D5BA] hover:bg-[#EFE5D2] hover:border-[#173B32]"
                    }`}
                  >
                    <div className="font-serif font-bold text-base">{c.label}</div>
                    <div className="text-[10px] opacity-80 mt-0.5">{c.desc}</div>
                  </button>
                ))}
              </div>

              {/* Custom Count Adjuster */}
              <div className="pt-2 border-t border-[#E5D5BA] flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-[#7B4D36]">
                  Exact number of travellers:
                </span>
                <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-[#E5D5BA]">
                  <button
                    type="button"
                    onClick={() => setTravellersCount((prev) => Math.max(1, prev - 1))}
                    className="w-7 h-7 rounded-lg bg-[#EFE5D2] hover:bg-[#E5D5BA] text-[#173B32] font-bold text-sm flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-mono font-black text-sm text-[#173B32] min-w-[20px] text-center">
                    {travellersCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTravellersCount((prev) => Math.min(20, prev + 1))}
                    className="w-7 h-7 rounded-lg bg-[#EFE5D2] hover:bg-[#E5D5BA] text-[#173B32] font-bold text-sm flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 5: WHAT IS YOUR BUDGET?                              */}
          {/* ======================================================== */}
          {currentStep === 5 && (
            <div className={`space-y-5 ${stepDirection === "prev" ? "animate-vanvas-slide-right" : "animate-vanvas-slide-left"}`}>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C] tracking-wider block">
                  STEP 05
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32] mt-1">
                  What is your budget?
                </h2>
                <p className="text-xs text-[#7B4D36] mt-0.5">
                  Pick your comfort &amp; budget preference. Estimates clearly marked.
                </p>
              </div>

              {/* Travel Style options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { style: "Budget", label: "Backpacker", desc: "Clean hostels, dhabas & shared rides", perPerson: "~₹2,200/day", totalEst: `~₹${(daysCount * travellersCount * 2200).toLocaleString()}` },
                  { style: "Balanced", label: "Moderate", desc: "Boutique stays, local cafes & cabs", perPerson: "~₹3,800/day", totalEst: `~₹${(daysCount * travellersCount * 3800).toLocaleString()}` },
                  { style: "Comfort", label: "Luxury", desc: "Heritage resorts, private cabs & fine dining", perPerson: "~₹6,500/day", totalEst: `~₹${(daysCount * travellersCount * 6500).toLocaleString()}` },
                ].map((s) => (
                  <button
                    key={s.style}
                    type="button"
                    onClick={() => handleStyleSelect(s.style)}
                    className={`p-4 rounded-2xl text-left interactive-card cursor-pointer border-2 ${
                      travelStyle === s.style
                        ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-md scale-102"
                        : "bg-white text-[#173B32] border-[#E5D5BA] hover:bg-[#EFE5D2] hover:border-[#173B32]"
                    }`}
                  >
                    <div className="font-serif font-bold text-base">{s.label}</div>
                    <div className="text-[10px] opacity-80 mt-0.5">{s.desc}</div>
                    <div className="mt-2 pt-2 border-t border-current/20 flex items-center justify-between text-xs font-mono">
                      <span className="text-[10px] opacity-75">{s.perPerson}</span>
                      <span className="font-bold text-[#B49252]">{s.totalEst}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 6: HOW ARE YOU GETTING THERE? (Transport Intel)      */}
          {/* ======================================================== */}
          {currentStep === 6 && (
            <div className={`space-y-5 ${stepDirection === "prev" ? "animate-vanvas-slide-right" : "animate-vanvas-slide-left"}`}>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C] tracking-wider block">
                  STEP 06 · TRANSPORT INTELLIGENCE
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32] mt-1">
                  How are you getting there?
                </h2>
                <p className="text-xs text-[#7B4D36] mt-0.5">
                  Route: <strong className="text-[#173B32]">{currentOriginName} → {currentDestName}</strong>
                </p>
              </div>

              {/* Best For You Intelligent Comparison Card */}
              <div className="p-4 rounded-2xl bg-[#173B32] text-[#EFE5D2] border-2 border-[#B49252] space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-[#B49252] text-[#173B32] text-[9px] font-mono font-black uppercase tracking-wider">
                    {bestTravelRecommendation.badge}
                  </span>
                  <span className="text-[10px] font-mono text-[#E5D5BA]">Mode-Specific Timing</span>
                </div>
                <div className="font-serif font-bold text-base text-[#FAF4E8]">
                  {bestTravelRecommendation.headline}
                </div>
                <div className="text-xs font-mono text-[#B49252]">
                  {bestTravelRecommendation.timing}
                </div>
                <p className="text-xs text-[#D8DED5] leading-relaxed">
                  {bestTravelRecommendation.rationale}
                </p>
              </div>

              {/* Transport Mode Options Grid */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-[#7B4D36] tracking-wider block">
                  Choose Primary Transport:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { mode: "Bus", label: "BUS", icon: Bus, desc: "Volvo / State Sleeper" },
                    { mode: "Train", label: "TRAIN", icon: Train, desc: "Express / Shatabdi / VB" },
                    { mode: "Flight", label: "FLIGHT", icon: Plane, desc: "Direct / Connecting" },
                    { mode: "Road Trip", label: "ROAD TRIP", icon: Car, desc: "Self-drive / Scenic stops" },
                    { mode: "Cab", label: "CAB / TRANSFER", icon: CarTaxiFront, desc: "Private door-to-door" },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = selectedTransportMode.toLowerCase().replace(" ", "") === m.mode.toLowerCase().replace(" ", "");
                    return (
                      <button
                        key={m.mode}
                        type="button"
                        onClick={() => handleTransportSelect(m.mode)}
                        className={`p-3 rounded-2xl text-left interactive-card cursor-pointer border-2 transition-all ${
                          isSelected
                            ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-md scale-102"
                            : "bg-white text-[#173B32] border-[#E5D5BA] hover:bg-[#EFE5D2] hover:border-[#173B32]"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`w-4 h-4 ${isSelected ? "text-[#B49252]" : "text-[#B65E3C]"}`} />
                          <span className="font-serif font-black text-xs">{m.label}</span>
                        </div>
                        <div className="text-[10px] opacity-80">{m.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Road Trip Specific Departure Guidance Card */}
              {selectedTransportMode.toLowerCase().includes("road") ? (
                <div className="p-4 bg-white border-2 border-[#173B32]/30 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-serif font-black text-[#173B32]">
                      🚗 SELF-DRIVE / ROAD TRIP PLAN
                    </span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                      ESTIMATED ROUTE
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-[#173B32]">
                    <div className="bg-[#FAF7F0] p-2.5 rounded-xl border border-[#E5D5BA]">
                      <span className="text-[10px] text-[#7B4D36] block">RECOMMENDED DEPARTURE</span>
                      <strong>05:30 – 06:30 AM</strong>
                    </div>
                    <div className="bg-[#FAF7F0] p-2.5 rounded-xl border border-[#E5D5BA]">
                      <span className="text-[10px] text-[#7B4D36] block">EST. DRIVE TIME</span>
                      <strong>~11.5 – 12.5 hrs</strong>
                    </div>
                  </div>
                  <div className="text-[11px] text-[#7B4D36] bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60 leading-relaxed">
                    <strong>Why early departure?</strong> Exits city before morning gridlock, crosses highway toll plazas smoothly, and ensures you navigate mountain ascent roads in full daylight.
                  </div>
                </div>
              ) : loadingTransport ? (
                <div className="p-4 bg-white border border-[#E5D5BA] rounded-2xl flex items-center justify-center gap-2 text-xs text-[#7B4D36]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#B65E3C]" />
                  <span>Fetching route options for {selectedTransportMode}...</span>
                </div>
              ) : transportOptions.length > 0 ? (
                <div className="space-y-2 pt-2 border-t border-[#E5D5BA]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase text-[#7B4D36] tracking-wider block">
                      Select Your Preferred Option ({transportOptions[0]?.data_state === "ESTIMATED" ? "ESTIMATED" : "CURATED"}):
                    </span>
                    <span className="text-[9px] font-mono text-[#7B4D36] bg-[#EFE5D2] px-2 py-0.5 rounded">
                      Click an option to select
                    </span>
                  </div>
                  <div className="divide-y divide-[#E5D5BA] bg-white border-2 border-[#E5D5BA] rounded-2xl overflow-hidden shadow-xs">
                    {transportOptions.slice(0, 4).map((opt) => {
                      const isOptionSelected = selectedTransportOption?.id === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => setSelectedTransportOption(opt)}
                          className={`p-3.5 space-y-2 text-xs cursor-pointer transition-colors ${
                            isOptionSelected
                              ? "bg-[#173B32]/5 border-l-4 border-l-[#173B32]"
                              : "hover:bg-[#FAF7F0]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className="font-bold text-[#173B32] flex items-center gap-1.5 flex-wrap">
                                <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                  isOptionSelected ? "border-[#173B32] bg-[#173B32]" : "border-[#B65E3C]"
                                }`}>
                                  {isOptionSelected && <span className="w-1.5 h-1.5 bg-[#FAF4E8] rounded-full" />}
                                </div>
                                <span>{opt.operator_name}</span>
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#173B32] text-[#EFE5D2] uppercase font-bold">
                                  {opt.data_state || "CURATED"}
                                </span>
                                {opt.recommendation_badge && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#B49252]/20 text-[#85611B] font-bold">
                                    {opt.recommendation_badge}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#7B4D36] pl-5">
                                {opt.departure_location} → {opt.arrival_location}
                              </div>
                              <div className="text-[10px] font-mono text-[#B65E3C] pl-5">
                                {opt.departure_time} → {opt.arrival_time} ({opt.duration_hours}h duration)
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-mono font-black text-sm text-[#173B32] block">
                                ₹{opt.price.toLocaleString()}
                              </span>
                              {opt.booking_url ? (
                                <a
                                  href={opt.booking_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-1 text-[10px] font-mono font-bold text-[#B65E3C] hover:underline inline-flex items-center gap-0.5"
                                >
                                  <span>{opt.booking_label || "Book with operator"}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ) : (
                                <span className="mt-1 text-[9px] font-mono text-[#7B4D36] block">
                                  {opt.booking_label || "Route Guidance"}
                                </span>
                              )}
                            </div>
                          </div>
                          {opt.disclaimer && (
                            <div className="text-[10px] text-[#7B4D36]/90 italic bg-[#FAF7F0] p-1.5 rounded-lg border border-[#E5D5BA]/60 ml-5">
                              ⓘ {opt.disclaimer}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                  Direct transport schedules unavailable for this corridor. Calculated route guidance and buffer estimates will be applied.
                </div>
              )}

              {/* Explicit Continue Button */}
              <button
                type="button"
                onClick={() => goToStep(7, "next")}
                className="w-full py-3.5 rounded-2xl bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md interactive-btn transition-all mt-4"
              >
                <span>Continue to Review</span>
                <ArrowRight className="w-4 h-4 text-[#B49252]" />
              </button>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 7: REVIEW SUMMARY & BUILD TRIP                       */}
          {/* ======================================================== */}
          {currentStep === 7 && (
            <div className={`space-y-6 ${stepDirection === "prev" ? "animate-vanvas-slide-right" : "animate-vanvas-slide-left"}`}>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C] tracking-wider block">
                  STEP 07 · JOURNEY REVIEW
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32] mt-1">
                  Ready to travel to {currentDestName}?
                </h2>
              </div>

              {/* Compact Travel Leg Ticket Card */}
              <div className="p-5 rounded-2xl bg-[#FAF7F0] border-2 border-[#173B32] space-y-3.5 shadow-md animate-vanvas-scale relative">
                <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-3">
                  <div>
                    <span className="text-[9px] font-mono uppercase text-[#7B4D36] font-bold tracking-wider">YOUR TRAVEL LEG</span>
                    <h3 className="font-serif font-black text-xl text-[#173B32]">
                      {currentOriginName} → {currentDestName}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 uppercase">
                    {selectedTransportMode}
                  </span>
                </div>

                {/* Specific Option Details or Road Guidance */}
                <div className="p-3 bg-[#EFE5D2]/70 rounded-xl border border-[#E5D5BA] space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between font-bold text-[#173B32]">
                    <span>
                      {selectedTransportOption?.operator_name || (
                        selectedTransportMode.toLowerCase().includes("road")
                          ? "Self-Drive Highway Route"
                          : `${selectedTransportMode} Route Guidance`
                      )}
                    </span>
                    <span className="text-sm font-black">
                      {selectedTransportOption ? `₹${selectedTransportOption.price.toLocaleString()} / traveller` : "Est. Route"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[#7B4D36] text-[11px]">
                    <span>
                      ⏱ {selectedTransportOption ? `${selectedTransportOption.departure_time} → ${selectedTransportOption.arrival_time} (~${selectedTransportOption.duration_hours} hrs)` : "05:30 Departure Window (~11.5h)"}
                    </span>
                    <span className="text-[9px] bg-white px-1.5 py-0.5 rounded border border-[#E5D5BA] font-bold text-[#173B32]">
                      {selectedTransportOption?.data_state || "CURATED"} · VERIFY BEFORE TRAVEL
                    </span>
                  </div>

                  {selectedTransportOption?.departure_location && (
                    <div className="text-[10px] text-[#7B4D36] pt-1 border-t border-[#E5D5BA]/60 flex justify-between">
                      <span><strong>DEPART:</strong> {selectedTransportOption.departure_location}</span>
                      <span><strong>ARRIVE:</strong> {selectedTransportOption.arrival_location}</span>
                    </div>
                  )}
                </div>

                {anchorPlace && (
                  <div className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#B49252]/60 flex items-center justify-between text-xs font-mono">
                    <span className="text-[#173B32] font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#B49252]" />
                      <span>Expedition Anchor: {anchorPlace}</span>
                    </span>
                    <span className="text-[10px] text-[#0F2924] bg-[#B49252]/20 border border-[#B49252]/40 px-2 py-0.5 rounded font-bold uppercase">
                      Target Landmark
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="bg-white p-2 rounded-xl border border-[#E5D5BA]">
                    <span className="text-[#7B4D36] block text-[10px]">DURATION</span>
                    <strong className="text-[#173B32]">{daysCount} Days</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-[#E5D5BA]">
                    <span className="text-[#7B4D36] block text-[10px]">TRAVELLERS</span>
                    <strong className="text-[#173B32]">{travellersCount} ({companionType})</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-[#E5D5BA]">
                    <span className="text-[#7B4D36] block text-[10px]">EST. BUDGET</span>
                    <strong className="text-[#173B32]">₹{(budgetEstimate / 1000).toFixed(0)}K ({travelStyle})</strong>
                  </div>
                </div>

                <div className="pt-1 text-[11px] text-[#7B4D36] flex items-center justify-between">
                  <span><strong>Dates:</strong> {startDate} → {endDate}</span>
                  <button
                    type="button"
                    onClick={() => goToStep(6, "prev")}
                    className="text-[#B65E3C] font-bold text-xs underline cursor-pointer hover:text-[#173B32]"
                  >
                    ← Change Transport
                  </button>
                </div>
              </div>

              {/* Guest Authentication Check */}
              {!user && (
                <div className="p-4 rounded-2xl bg-white border-2 border-[#B49252] space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#B65E3C]" />
                      <span className="font-serif font-bold text-sm text-[#173B32]">
                        {authMode === "login" ? "Sign in to save trip" : "Create account to save trip"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode(authMode === "login" ? "register" : "login");
                        setAuthError(null);
                      }}
                      className="text-xs font-mono font-bold text-[#B65E3C] underline cursor-pointer"
                    >
                      {authMode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
                    </button>
                  </div>

                  <form onSubmit={handleInlineAuth} className="space-y-2.5">
                    {authMode === "register" && (
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={authFullName}
                        onChange={(e) => setAuthFullName(e.target.value)}
                        required
                        className="w-full p-2.5 bg-[#FAF7F0] border border-[#E5D5BA] rounded-xl text-xs font-medium text-[#173B32] focus:outline-none focus:border-[#173B32]"
                      />
                    )}
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      required
                      className="w-full p-2.5 bg-[#FAF7F0] border border-[#E5D5BA] rounded-xl text-xs font-medium text-[#173B32] focus:outline-none focus:border-[#173B32]"
                    />
                    <input
                      type="password"
                      placeholder="Password (min 6 characters)"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      required
                      className="w-full p-2.5 bg-[#FAF7F0] border border-[#E5D5BA] rounded-xl text-xs font-medium text-[#173B32] focus:outline-none focus:border-[#173B32]"
                    />

                    {authError && (
                      <p className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                        {authError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={authSubmitting}
                      className="w-full py-2.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {authSubmitting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#B49252]" />
                      ) : (
                        <UserIcon className="w-3.5 h-3.5 text-[#B49252]" />
                      )}
                      <span>{authMode === "login" ? "Sign In & Continue" : "Create Account & Continue"}</span>
                    </button>
                  </form>
                </div>
              )}

              {generationError && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2.5 shadow-sm animate-vanvas-fade">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <div className="flex-1">
                    <span>{generationError}</span>
                  </div>
                </div>
              )}

              {/* Build My Trip Button */}
              <button
                type="button"
                onClick={handleBuildTrip}
                disabled={isGenerating || !user}
                className="w-full py-4 rounded-2xl bg-[#B65E3C] hover:bg-[#9E4D2E] disabled:opacity-50 interactive-btn text-[#EFE5D2] font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-xl cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#B49252]" />
                <span>
                  {!user
                    ? "Sign In Above to Build Trip"
                    : selectedTransportMode.toLowerCase().includes("road")
                    ? "Launch Map Road Trip →"
                    : "Build My Trip →"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => goToStep(1, "prev")}
                className="w-full text-center text-xs font-mono text-[#7B4D36] hover:text-[#173B32] underline cursor-pointer"
              >
                Edit all preferences
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PlanTripPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#EFE5D2] flex items-center justify-center text-[#173B32]">
          <Loader2 className="w-8 h-8 animate-spin text-[#B65E3C]" />
        </div>
      }
    >
      <PlanWizard />
    </Suspense>
  );
}
