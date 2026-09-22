"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Compass, MapPin, Sparkles, Star, BedDouble, Bike, Clock,
  ExternalLink, ArrowRight, ShieldCheck, Bookmark, Check, Mountain,
  Calendar, Sun, Coffee, Trees, Fuel, AlertCircle, RefreshCw, Layers,
  Phone, Navigation, MessageCircle, Globe, Users, X, Home, Building2, CheckCircle2
} from "lucide-react";

import { api } from "@/lib/api";
import { Destination, Place, Hotel, RentalOption, Offer } from "@/types";
import { PlaceCard } from "@/components/places/PlaceCard";
import { PlaceModal } from "@/components/places/PlaceModal";
import { TravelStamp } from "@/components/ui/TravelStamp";
import { JournalNote } from "@/components/ui/JournalNote";
import { VanvasImage } from "@/components/ui/VanvasImage";
import { VehicleArtwork } from "@/components/ui/VehicleArtwork";
import { resolveDestinationVisualProfile } from "@/lib/visualIntelligence";
import { resolvePlaceArtwork } from "@/lib/placeVisualResolver";

const DISCOVERY_MESSAGES = [
  "VANVAS is gathering live travel information...",
  "Connecting to Himalayan operating layer...",
  "Resolving verified coordinates & topography...",
  "Checking live meteorological forecast...",
  "Gathering verified points of interest...",
  "Reading local trails & sanctuaries..."
];

const TRAVELLER_PROFILES = [
  "All", "Budget", "Couple", "Family", "Friends", "Solo", "Group", "Party/Social"
];

const ACCOMMODATION_TYPES = [
  "All", "Dorm", "Private", "Hostel", "Homestay", "Hotel", "Boutique", "Resort", "Heritage"
];

export default function DestinationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const [mounted, setMounted] = useState(false);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [weather, setWeather] = useState<any[]>([]);
  
  // Independent Section Data & Loading States
  const [destLoading, setDestLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [staysLoading, setStaysLoading] = useState(true);
  const [selectedTravellerProfile, setSelectedTravellerProfile] = useState<string>("All");
  const [selectedStayType, setSelectedStayType] = useState<string>("All");
  const [selectedStayForModal, setSelectedStayForModal] = useState<Hotel | null>(null);
  const [stayModalOpen, setStayModalOpen] = useState(false);
  
  const [rentals, setRentals] = useState<RentalOption[]>([]);
  const [rentalsLoading, setRentalsLoading] = useState(true);
  
  const [stayOffers, setStayOffers] = useState<Offer[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!destLoading) return;
    const msgTimer = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % DISCOVERY_MESSAGES.length);
    }, 1200);
    return () => clearInterval(msgTimer);
  }, [destLoading]);

  const destMetadata: Record<string, { hindi: string; alt: string; quote: string; province: string }> = {
    manali: {
      hindi: "मनाली",
      alt: "2050M",
      quote: "Where pine forests meet the clouds and the high Himalayan highway begins.",
      province: "HIMACHAL PRADESH",
    },
    rishikesh: {
      hindi: "ऋषिकेश",
      alt: "372M",
      quote: "Turquoise Ganga currents, evening bells, and cliffside meditation.",
      province: "UTTARAKHAND",
    },
    kasol: {
      hindi: "कसोल",
      alt: "1580M",
      quote: "Mystic deodar canopies, roaring emerald waters, and bohemian trails.",
      province: "PARVATI VALLEY",
    },
    dharamshala: {
      hindi: "धर्मशाला",
      alt: "1457M",
      quote: "Prayer flags in the mist, Tibetan heritage, and the mighty Dhauladhar ridge.",
      province: "HIMACHAL PRADESH",
    },
    goa: {
      hindi: "गोवा",
      alt: "10M",
      quote: "Golden palms, Portuguese villas, beach shack sunsets, and hidden spice farms.",
      province: "WEST COAST",
    },
    jaipur: {
      hindi: "जयपुर",
      alt: "431M",
      quote: "Terracotta ramparts, historic havelis, rich kachoris, and artisan crafts.",
      province: "RAJASTHAN",
    },
    udaipur: {
      hindi: "उदयपुर",
      alt: "598M",
      quote: "Shimmering lake waters, whitewashed palaces, and romantic rooftop evenings.",
      province: "MEWAR RAJASTHAN",
    },
    mussoorie: {
      hindi: "मसूरी",
      alt: "2005M",
      quote: "Queen of the Hills, colonial bookshops, winterline sunsets, and oak trails in Landour.",
      province: "GARHWAL UTTARAKHAND",
    },
    spiti: {
      hindi: "स्पीति घाटी",
      alt: "3800M",
      quote: "Middle land between Tibet and India, stark moonscapes, thousand-year-old gompas.",
      province: "HIMACHAL PRADESH",
    },
    leh: {
      hindi: "लेह लद्दाख",
      alt: "3500M",
      quote: "High passes, turquoise alpine lakes, prayer wheels, and ancient royal palaces.",
      province: "LADAKH",
    },
    varanasi: {
      hindi: "वाराणसी",
      alt: "80M",
      quote: "Ancient eternal ghats, dawn boat rides, sacred chanting, and narrow silk lanes.",
      province: "UTTAR PRADESH",
    },
    munnar: {
      hindi: "मुन्नार",
      alt: "1600M",
      quote: "Endless rolling emerald tea plantations, misty mountain gaps, and spice air.",
      province: "KERALA",
    }
  };

  const fetchDestination = () => {
    setDestLoading(true);
    setLoadError(null);
    setStaysLoading(true);
    setRentalsLoading(true);

    const abortTimeout = setTimeout(() => {
      setDestLoading(false);
      setLoadError("Connection timed out. The Himalayan intelligence layer took too long to respond. Tap retry to reconnect.");
      setStaysLoading(false);
      setRentalsLoading(false);
    }, 45000);

    api.getDestinationDetail(slug)
      .then((data) => {
        clearTimeout(abortTimeout);
        if (!data || !data.destination) {
          throw new Error("404: Sanctuary not found in index");
        }
        setDestination(data.destination);
        setPlaces(data.places || []);
        setWeather(data.weather || []);
        setDestLoading(false);

        const destId = data.destination.id || slug;
        const lat = data.destination.latitude;
        const lng = data.destination.longitude;

        // Progressive Background Fetches
        // 1. Stays
        if (data.hotels && data.hotels.length > 0) {
          setHotels(data.hotels);
          setStaysLoading(false);
        } else {
          api.getHotels(destId)
            .then((loadedStays) => setHotels(loadedStays || []))
            .catch(() => setHotels([]))
            .finally(() => setStaysLoading(false));
        }

        // 2. Rentals
        if (data.rentals && data.rentals.length > 0) {
          setRentals(data.rentals);
          setRentalsLoading(false);
        } else {
          api.getRentals(destId)
            .then((loadedR) => setRentals(loadedR || []))
            .catch(() => setRentals([]))
            .finally(() => setRentalsLoading(false));
        }

        // 3. Commerce Stay Offers
        api.getOffers(destId, "stay")
          .then((offers) => {
            if (offers && offers.length > 0) {
              setStayOffers(offers.filter(o => o.is_live || o.provider === "amadeus_stays"));
            }
          })
          .catch(() => {});

      })
      .catch((err) => {
        clearTimeout(abortTimeout);
        console.error("Destination fetch error:", err);
        setLoadError(err.message || "Failed to load destination");
        setDestLoading(false);
        setStaysLoading(false);
        setRentalsLoading(false);
      });
  };

  const fetchFilteredStays = (travellerProfile?: string, stayType?: string) => {
    if (!destination) return;
    const destId = destination.id || slug;
    setStaysLoading(true);
    api.getHotels(destId, stayType, travellerProfile)
      .then((loadedStays) => setHotels(loadedStays || []))
      .catch(() => setHotels([]))
      .finally(() => setStaysLoading(false));
  };

  const handleTravellerProfileChange = (profile: string) => {
    setSelectedTravellerProfile(profile);
    fetchFilteredStays(profile, selectedStayType);
  };

  const handleStayTypeChange = (type: string) => {
    setSelectedStayType(type);
    fetchFilteredStays(selectedTravellerProfile, type);
  };

  useEffect(() => {
    fetchDestination();
  }, [slug]);

  const getCategory = (p: Place): string => {
    return typeof p.category === "string" ? p.category.toLowerCase() : "";
  };

  const categories = [
    { id: "all", label: "All Places", count: places.length },
    { id: "must-visit", label: "Must Visit", count: places.filter((p) => Boolean(p.is_must_visit)).length },
    { id: "hidden", label: "Hidden Gems", count: places.filter((p) => Boolean(p.is_hidden_gem)).length },
    { id: "cafes", label: "Cafés & Bakeries", count: places.filter((p) => getCategory(p).includes("café") || getCategory(p).includes("bakery") || getCategory(p).includes("cafe")).length },
    { id: "nature", label: "Trails & Nature", count: places.filter((p) => getCategory(p).includes("nature") || getCategory(p).includes("trail") || getCategory(p).includes("waterfall") || getCategory(p).includes("scenic") || getCategory(p).includes("lake")).length },
    { id: "food", label: "Local Food", count: places.filter((p) => getCategory(p).includes("food") || getCategory(p).includes("dhaba") || getCategory(p).includes("restaurant")).length },
    { id: "culture", label: "Culture & Heritage", count: places.filter((p) => getCategory(p).includes("culture") || getCategory(p).includes("temple") || getCategory(p).includes("heritage") || getCategory(p).includes("monastery") || getCategory(p).includes("ghat") || getCategory(p).includes("spiritual") || getCategory(p).includes("fort")).length },
  ];

  const filteredPlaces = places.filter((p) => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "must-visit") return Boolean(p.is_must_visit);
    if (selectedCategory === "hidden") return Boolean(p.is_hidden_gem);
    const cat = getCategory(p);
    if (selectedCategory === "cafes") return cat.includes("café") || cat.includes("bakery") || cat.includes("cafe");
    if (selectedCategory === "nature") return cat.includes("nature") || cat.includes("trail") || cat.includes("waterfall") || cat.includes("scenic") || cat.includes("lake");
    if (selectedCategory === "food") return cat.includes("food") || cat.includes("dhaba") || cat.includes("restaurant");
    if (selectedCategory === "culture") return cat.includes("culture") || cat.includes("temple") || cat.includes("heritage") || cat.includes("monastery") || cat.includes("ghat") || cat.includes("spiritual") || cat.includes("fort");
    return true;
  });

  const normKey = slug.toLowerCase().replace(/[^a-z]/g, "");
  const matchedMetaKey = Object.keys(destMetadata).find((k) => normKey.includes(k));
  const meta = (matchedMetaKey ? destMetadata[matchedMetaKey] : null) || {
    hindi: destination?.name || "यात्रा",
    alt: `${destination?.altitude_meters || 550}M`,
    quote: destination?.tagline || "Live travel discovery and verified coordinates.",
    province: destination?.state ? destination.state.toUpperCase() : "LIVE DISCOVERY",
  };

  const isCurated = destination ? destination.is_curated !== false : true;

  if (!mounted || destLoading) {
    return (
      <div className="min-h-screen bg-[#EFE5D2] flex flex-col items-center justify-center text-[#173B32] gap-4 px-4 text-center">
        <div className="w-12 h-12 border-3 border-[#B65E3C] border-t-transparent rounded-full animate-spin" />
        <div className="space-y-1.5 max-w-md">
          <p className="font-serif text-lg font-bold text-[#173B32]">
            {mounted ? DISCOVERY_MESSAGES[loadingMsgIdx] : "VANVAS is gathering live travel information..."}
          </p>
          <p className="text-xs font-mono text-[#7B4D36] opacity-80">
            VANVAS Himalayan Intelligence Operating Layer
          </p>
        </div>
      </div>
    );
  }

  if (loadError || !destination) {
    const is404 = loadError && (
      loadError.includes("404") ||
      loadError.toLowerCase().includes("not found")
    );
    const isNetworkError = !is404;

    return (
      <div className="min-h-screen bg-[#EFE5D2] flex flex-col items-center justify-center text-[#173B32] gap-4 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-[#B65E3C]" />
        <div className="space-y-1">
          <span className="text-xs font-mono uppercase tracking-wider text-[#B65E3C] font-semibold">
            {isNetworkError ? "कनेक्शन स्थिति • Server Connection" : "अभयारण्य नहीं मिला • Destination Index"}
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32]">
            {isNetworkError ? "Himalayan Operating Layer Connecting..." : "Destination Not Found"}
          </h2>
        </div>
        <p className="text-xs text-[#7B4D36] max-w-md leading-relaxed">
          {isNetworkError
            ? "VANVAS backend was temporarily dormant or warming up. Tap retry below to establish the connection."
            : (loadError || "Could not resolve live information for this location. Please try exploring another sanctuary.")}
        </p>
        <div className="flex gap-3 pt-2">
          <button
            onClick={fetchDestination}
            className="px-5 py-2.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
          <Link
            href="/explore"
            className="px-5 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] hover:bg-[#E5D5BA] text-[#173B32] text-xs font-bold transition-all"
          >
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  const profile = resolveDestinationVisualProfile(destination.slug || destination.name, destination.state, destination.altitude_meters);
  const regionType = profile.terrainType;

  return (
    <div className="min-h-screen bg-[#EFE5D2] pb-28">
      {/* Hero Banner */}
      <section className="relative h-[52vh] min-h-[380px] max-h-[460px] bg-[#0F2924] text-[#EFE5D2] flex items-end px-4 sm:px-6 lg:px-8 pb-10 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <VanvasImage
            src={destination.hero_image || profile.heroPath || profile.illustrationPath}
            fallbackSrc={profile.fallbackPath}
            regionType={regionType}
            alt={destination.name}
            priority={true}
            className="w-full h-full object-cover opacity-80 scale-102 transition-transform duration-1000"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F2924] via-[#0F2924]/50 to-black/30 pointer-events-none z-1" />

        <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <TravelStamp label={meta.province} variant="terracotta" />
              <TravelStamp label={meta.alt} variant="forest" />
              <TravelStamp label={isCurated ? "VANVAS VERIFIED" : "LIVE DISCOVERY"} variant={isCurated ? "mustard" : "forest"} />
            </div>

            <div className="space-y-1">
              <span className="text-2xl sm:text-3xl font-serif text-[#B49252] font-semibold block">
                {meta.hindi}
              </span>
              <h1 className="text-4xl sm:text-7xl font-serif font-black tracking-tight text-[#EFE5D2]">
                {destination.name}
              </h1>
            </div>

            <p className="text-sm sm:text-base text-[#D8DED5] max-w-xl italic font-serif leading-relaxed">
              &ldquo;{meta.quote}&rdquo;
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link
              href={`/plan?dest=${destination.id}`}
              className="px-7 py-4 rounded-2xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] font-bold text-xs uppercase tracking-wider shadow-2xl flex items-center justify-center gap-2 transition-all transform active:scale-95 border border-[#7B4D36]/30"
            >
              <Sparkles className="w-4 h-4 text-[#B49252]" />
              <span>{isCurated ? `चलो, ${meta.hindi} चलते हैं • Plan Trip` : "Plan Trip to Destination"}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        
        {/* CURATED SANCTUARY DISPATCH (Rendered only for Curated Destinations) */}
        {isCurated && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 p-6 sm:p-10 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-sm space-y-6">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#B65E3C]">
                <Compass className="w-4 h-4" />
                <span>सफ़रनामा • Sanctuary Dispatch</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32]">
                Why wander into {destination.name}?
              </h2>

              <p className="text-sm text-[#20211D]/85 leading-relaxed font-light">
                {destination.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#E5D5BA] text-xs">
                <div className="p-3 rounded-xl bg-[#EFE5D2] space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-[#7B4D36]">Best Season</span>
                  <p className="font-bold text-[#173B32]">{destination.best_time_to_visit || "Year-round"}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#EFE5D2] space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-[#7B4D36]">Climate</span>
                  <p className="font-bold text-[#173B32]">{destination.weather_type}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#EFE5D2] space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-[#7B4D36]">Elevation</span>
                  <p className="font-bold text-[#173B32]">{destination.altitude_meters}m</p>
                </div>
                <div className="p-3 rounded-xl bg-[#EFE5D2] space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-[#7B4D36]">Coordinates</span>
                  <p className="font-bold text-[#173B32] font-mono">{destination.latitude.toFixed(2)}°N, {destination.longitude.toFixed(2)}°E</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <JournalNote
                tag="LOCAL EXPEDITION TIP"
                note={`Early morning walks provide the clearest panoramic light and serene atmosphere before afternoon traffic begins.`}
                date={`${meta.hindi} EXPEDITION DISPATCH`}
                tapeColor="terracotta"
              />
            </div>
          </div>
        )}

        {/* DYNAMIC DESTINATION SUMMARY (For Non-Curated Destinations) */}
        {!isCurated && (
          <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#173B32] text-[#EFE5D2] text-[10px] font-mono font-bold uppercase tracking-wider">
                LIVE DESTINATION DISCOVERY
              </span>
              <span className="text-xs text-[#7B4D36] font-mono">
                {destination.latitude.toFixed(4)}°N, {destination.longitude.toFixed(4)}°E
              </span>
            </div>
            <h2 className="text-2xl font-serif font-black text-[#173B32]">
              Live Travel Intelligence for {destination.name}
            </h2>
            <p className="text-sm text-[#20211D]/80 leading-relaxed max-w-3xl font-light">
              {destination.description}
            </p>
          </div>
        )}

        {/* LIVE WEATHER INTELLIGENCE */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0F2924] text-[#EFE5D2] border-2 border-[#173B32] shadow-xl space-y-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {weather[0]?.data_state === "STALE" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    STALE WEATHER SNAPSHOT
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE OPEN-METEO WEATHER
                  </span>
                )}
                <span className="text-[11px] font-mono text-[#B49252]">
                  {destination.latitude.toFixed(2)}°N, {destination.longitude.toFixed(2)}°E
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#FAF4E8]">
                Current Climate &amp; 5-Day Forecast
              </h3>
            </div>
            <div className="text-xs text-[#D8DED5]/70 font-mono text-right">
              Updated Hourly from Meteorological Station
            </div>
          </div>

          {weather.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-4 flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-4xl sm:text-5xl font-serif font-black text-[#FAF4E8]">
                    {Math.round(weather[0].temp_c)}°<span className="text-lg text-[#B49252]">C</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-[#FAF4E8] block">{weather[0].condition}</span>
                    <span className="text-[11px] text-[#D8DED5]/80 font-mono">
                      Wind: {weather[0].wind_kph} km/h • Humidity: {weather[0].humidity}%
                    </span>
                    {weather[0].is_rain && (
                      <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 font-mono">
                        Rain Advisory Active
                      </span>
                    )}
                  </div>
                </div>

                <div className="md:col-span-8 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                  <Sun className="w-5 h-5 text-[#B49252] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B49252]">
                      METEOROLOGICAL ADVISORY
                    </span>
                    <p className="text-xs text-[#EFE5D2] leading-relaxed mt-0.5">
                      {weather[0].advisory || `Live meteorological forecast for ${destination.name}.`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
                {weather.slice(0, 5).map((w, idx) => {
                  let dayName = idx === 0 ? "Today" : `Day ${idx + 1}`;
                  let dateStr = w.forecast_date || "";
                  try {
                    const parts = (w.forecast_date || "").split("T")[0].split("-");
                    if (parts.length === 3) {
                      const yr = parseInt(parts[0], 10);
                      const mIdx = parseInt(parts[1], 10) - 1;
                      const dy = parseInt(parts[2], 10);
                      const mNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                      const dayOfWeekNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                      const dt = new Date(yr, mIdx, dy);
                      if (idx > 0) dayName = dayOfWeekNames[dt.getDay()] || dayName;
                      dateStr = `${mNames[mIdx] || ""} ${dy}`;
                    }
                  } catch (e) {
                    // keep default
                  }

                  return (
                    <div
                      key={w.id || idx}
                      className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between space-y-2 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#FAF4E8]">{dayName}</span>
                        <span className="text-[10px] font-mono text-[#D8DED5]/70">{dateStr}</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-lg font-serif font-bold text-[#FAF4E8]">
                          {Math.round(w.temp_c)}°C
                        </span>
                        <span className="text-[11px] font-mono text-[#B49252]">
                          {w.is_rain ? "Rain" : "Clear"}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#D8DED5]/80 line-clamp-1">
                        {w.condition}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-white/5 text-xs text-[#D8DED5]/80">
              Fetching meteorological satellite data for {destination.name}...
            </div>
          )}
        </div>

        {/* CURATED PLACES (Shown only for Curated Destinations) */}
        {isCurated && places.length > 0 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5D5BA] pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#B65E3C]">
                  चुनिंदा पड़ाव • Curated Sanctuaries
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32]">
                  Curated Trails, Cafés &amp; Local Landmarks ({filteredPlaces.length})
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? "bg-[#173B32] text-[#EFE5D2] shadow-sm border-2 border-[#173B32]"
                      : "bg-[#FAF7F0] text-[#20211D]/80 border border-[#E5D5BA] hover:bg-[#E5D5BA]"
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedCategory === cat.id ? "bg-[#B49252] text-[#0F2924]" : "bg-[#EFE5D2] text-[#7B4D36]"}`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlaces.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  destinationName={destination.name}
                  onSelect={(p) => {
                    setSelectedPlace(p);
                    setModalOpen(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* STAYS & SANCTUARIES */}
        <div className="space-y-6 pt-6 border-t-2 border-[#E5D5BA]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E5D5BA] pb-4 gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#B65E3C]">
                आशियाना • Verified Stays &amp; Sanctuaries
              </span>
              <h3 className="font-serif font-black text-2xl sm:text-3xl text-[#173B32] flex items-center gap-2 mt-0.5">
                <BedDouble className="w-6 h-6 text-[#B65E3C]" />
                <span>Stays &amp; Sanctuaries {!staysLoading && `(${hotels.length})`}</span>
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Stay Inventory</span>
              </span>
            </div>
          </div>

          {/* TRAVELLER & ACCOMMODATION FILTER BAR */}
          <div className="space-y-3 bg-[#FAF7F0] p-4 rounded-2xl border border-[#E5D5BA]">
            {/* Traveller Profiles */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-[#7B4D36]">
                <span className="font-bold flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <Users className="w-3.5 h-3.5 text-[#B65E3C]" />
                  <span>Traveller Profile</span>
                </span>
                <span className="text-[10px] font-mono opacity-70">
                  {selectedTravellerProfile === "All" ? "All Profiles" : `${selectedTravellerProfile} Verified`}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TRAVELLER_PROFILES.map((profile) => {
                  const isActive = selectedTravellerProfile === profile;
                  return (
                    <button
                      key={profile}
                      onClick={() => handleTravellerProfileChange(profile)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#173B32] text-[#EFE5D2] shadow-xs scale-[1.02]"
                          : "bg-white/80 hover:bg-white text-[#7B4D36] border border-[#E5D5BA]/80"
                      }`}
                    >
                      {profile}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accommodation Preferences */}
            <div className="space-y-1.5 pt-2 border-t border-[#E5D5BA]/60">
              <div className="flex items-center justify-between text-xs text-[#7B4D36]">
                <span className="font-bold flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <Building2 className="w-3.5 h-3.5 text-[#B65E3C]" />
                  <span>Accommodation Style</span>
                </span>
                <span className="text-[10px] font-mono opacity-70">
                  {selectedStayType === "All" ? "All Styles" : selectedStayType}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ACCOMMODATION_TYPES.map((type) => {
                  const isActive = selectedStayType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => handleStayTypeChange(type)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#B65E3C] text-[#FAF4E8] shadow-xs scale-[1.02]"
                          : "bg-white/80 hover:bg-white text-[#7B4D36] border border-[#E5D5BA]/80"
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* STAYS GRID */}
          {staysLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] animate-pulse space-y-4">
                  <div className="h-44 bg-[#E5D5BA]/60 rounded-2xl" />
                  <div className="h-5 bg-[#E5D5BA]/80 rounded w-2/3" />
                  <div className="h-3 bg-[#E5D5BA]/50 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : hotels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map((h) => {
                const isLiveStay = h.is_live !== false;
                const isPriceVerified = h.price_verified !== false && typeof h.price_per_night === "number" && h.price_per_night > 0;
                const stayVisual = resolvePlaceArtwork(h.name, destination.name, "Stays & Sanctuaries", h.image_url, h.is_live, h.source);
                const displayPrice = h.price_formatted || (isPriceVerified ? `₹${h.price_per_night}/night` : "Rate unavailable");
                const availState = h.availability_state || "UNKNOWN";

                return (
                  <div key={h.id} className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] hover:border-[#173B32]/40 shadow-2xs hover:shadow-lg transition-all space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      {/* Visual Header */}
                      <div className="relative h-48 rounded-2xl overflow-hidden bg-[#E5D5BA]">
                        <VanvasImage
                          src={stayVisual.imageUrl}
                          fallbackSrc={stayVisual.fallbackUrl}
                          alt={`${h.name} in ${destination.name}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Top Badges */}
                        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5">
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-xs ${
                            h.provider_source?.includes("airbnb")
                              ? "bg-rose-600 text-white"
                              : h.provider_source?.includes("vrbo")
                              ? "bg-blue-700 text-white"
                              : isLiveStay
                              ? "bg-emerald-700 text-white"
                              : "bg-[#173B32] text-[#EFE5D2]"
                          }`}>
                            {h.badge || (isLiveStay ? "LIVE STAY" : "VERIFIED SANCTUARY")}
                          </span>

                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono uppercase font-bold tracking-wider shadow-xs ${
                            availState === "AVAILABLE"
                              ? "bg-emerald-600 text-white"
                              : availState === "UNAVAILABLE"
                              ? "bg-rose-700 text-white"
                              : "bg-[#0F2924]/80 backdrop-blur-xs text-[#FAF4E8] border border-white/15"
                          }`}>
                            {availState}
                          </span>
                        </div>

                        {/* Bottom Category Tag */}
                        <div className="absolute bottom-2.5 left-2.5">
                          <span className="px-2 py-0.5 rounded-md bg-[#0F2924]/85 backdrop-blur-xs text-[#FAF4E8] text-[10px] font-medium border border-white/10">
                            {h.accommodation_type || h.hotel_style || "Stay Sanctuary"}
                          </span>
                        </div>
                      </div>

                      {/* Content Details */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-serif font-bold text-base text-[#173B32] leading-snug">{h.name}</h4>
                          <span className={`font-bold text-xs shrink-0 ${isPriceVerified ? "text-[#B65E3C]" : "text-[#7B4D36]/80 text-[11px] font-mono"}`}>
                            {displayPrice}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7B4D36] mt-1 line-clamp-1">
                          {h.address}
                          {typeof h.distance_km === "number" && ` • ${h.distance_km} km from center`}
                        </p>

                        {/* Verified Tags */}
                        {h.traveller_tags && h.traveller_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {h.traveller_tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-[#EFE5D2] text-[#7B4D36] border border-[#E5D5BA]">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Toolbar */}
                    <div className="pt-3 border-t border-[#E5D5BA] flex items-center justify-between text-xs text-[#536B52] gap-2">
                      <button
                        onClick={() => {
                          setSelectedStayForModal(h);
                          setStayModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] text-[#173B32] font-semibold text-xs hover:bg-[#EFE5D2] hover:border-[#173B32] transition-colors cursor-pointer"
                      >
                        View Property
                      </button>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {h.latitude && h.longitude && (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${h.latitude},${h.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-[#FAF7F0] border border-[#E5D5BA] text-[#173B32] hover:text-[#B65E3C] hover:border-[#B65E3C] transition-colors"
                            title="Get directions"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {h.phone && (
                          <a
                            href={`tel:${h.phone}`}
                            className="p-1.5 rounded-lg bg-[#FAF7F0] border border-[#E5D5BA] text-[#173B32] hover:text-emerald-700 hover:border-emerald-700 transition-colors"
                            title={`Call ${h.phone}`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {h.website && (
                          <a
                            href={h.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-[#FAF7F0] border border-[#E5D5BA] text-[#173B32] hover:text-[#B65E3C] hover:border-[#B65E3C] transition-colors"
                            title="Official Website"
                          >
                            <Globe className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {(h.booking_url || h.provider_url) ? (
                          <a
                            href={h.booking_url || h.provider_url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-[#173B32] text-[#EFE5D2] rounded-xl font-bold text-xs hover:bg-[#B65E3C] transition-colors flex items-center gap-1 shrink-0"
                          >
                            <span>Book</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] text-center space-y-2">
              <BedDouble className="w-8 h-8 text-[#B65E3C] mx-auto opacity-70" />
              <h4 className="font-serif font-bold text-base text-[#173B32]">No verified stays available for these dates.</h4>
              <p className="text-xs text-[#7B4D36] max-w-md mx-auto">
                No accommodation matching your criteria was verified by live inventory providers for this destination. Try switching traveller profiles or resetting style filters.
              </p>
              <button
                onClick={() => {
                  setSelectedTravellerProfile("All");
                  setSelectedStayType("All");
                  fetchFilteredStays("All", "All");
                }}
                className="mt-2 px-4 py-1.5 rounded-xl bg-[#173B32] text-[#EFE5D2] text-xs font-bold hover:bg-[#B65E3C] transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>

        {/* VALLEY MOBILITY & RENTALS */}
        <div className="space-y-6 pt-6 border-t-2 border-[#E5D5BA]">
          <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#B65E3C]">
                सवारी • Valley Mobility &amp; Rentals
              </span>
              <h3 className="font-serif font-black text-2xl sm:text-3xl text-[#173B32] flex items-center gap-2 mt-0.5">
                <Bike className="w-6 h-6 text-[#B65E3C]" />
                <span>Scooter &amp; Motorcycle Rentals {!rentalsLoading && `(${rentals.length})`}</span>
              </h3>
            </div>
            <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase ${
              isCurated
                ? "bg-[#FAF7F0] border border-[#E5D5BA] text-[#7B4D36]"
                : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-800"
            }`}>
              {isCurated ? "Curated Mobility" : "Live Mobility Directory"}
            </span>
          </div>

          {rentalsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] animate-pulse space-y-4">
                  <div className="h-44 bg-[#E5D5BA]/60 rounded-2xl" />
                  <div className="h-5 bg-[#E5D5BA]/80 rounded w-2/3" />
                  <div className="h-3 bg-[#E5D5BA]/50 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : rentals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rentals.map((r) => {
                const vStatus = r.verification_status || (r.is_live || r.source === "openstreetmap" ? "LIVE_OSM" : (r.source === "vanvas_curated" ? "CURATED" : "UNVERIFIED"));
                const isLiveProvider = vStatus === "LIVE_PROVIDER";
                const isLiveOsm = vStatus === "LIVE_OSM";
                const isCuratedMob = vStatus === "CURATED";
                const hasPrice = typeof r.price_per_day === "number" && r.price_per_day > 0;
                const hasHourly = typeof r.hourly_price === "number" && r.hourly_price > 0;

                // Action links resolution
                const dirLink = r.action_links?.find((l) => l.type === "directions")?.url ||
                  (r.latitude && r.longitude ? `https://www.google.com/maps/dir/?api=1&destination=${r.latitude},${r.longitude}` : null);
                const phoneLink = r.action_links?.find((l) => l.type === "phone")?.url || (r.phone ? `tel:${r.phone}` : null);
                const waLink = r.action_links?.find((l) => l.type === "whatsapp")?.url ||
                  (r.whatsapp ? `https://wa.me/${r.whatsapp.replace(/[^\d]/g, "")}` : null);
                const webLink = r.action_links?.find((l) => l.type === "website" || l.type === "booking")?.url || r.website || null;

                return (
                  <div key={r.id} className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] hover:border-[#173B32]/40 shadow-2xs hover:shadow-lg transition-all space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="relative h-44 rounded-2xl overflow-hidden bg-[#E5D5BA]">
                        <VehicleArtwork
                          type={r.vehicle_type}
                          name={r.vehicle_name}
                          imageUrl={r.image_url}
                          alt={r.vehicle_name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-xs ${
                            isLiveProvider
                              ? "bg-emerald-600 text-white"
                              : isLiveOsm
                              ? "bg-teal-700 text-white"
                              : isCuratedMob
                              ? "bg-[#173B32] text-[#EFE5D2]"
                              : "bg-[#7B4D36] text-[#FAF4E8]"
                          }`}>
                            {isLiveProvider ? "LIVE PROVIDER" : isLiveOsm ? "LIVE OSM" : isCuratedMob ? "CURATED" : "UNVERIFIED"}
                          </span>
                          {r.distance_km != null && (
                            <span className="px-2 py-0.5 rounded-md bg-[#0F2924]/80 backdrop-blur-xs text-[#FAF4E8] text-[9px] font-mono tracking-wider border border-white/10 flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5" />
                              {r.distance_km} km away
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-serif font-bold text-base text-[#173B32] leading-snug">{r.vehicle_name}</h4>
                            <p className="text-[11px] font-medium text-[#7B4D36]">
                              {r.provider_name}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`font-bold text-sm block ${hasPrice ? "text-[#173B32]" : "text-[#7B4D36]/80 text-[11px] font-mono"}`}>
                              {hasPrice ? `₹${r.price_per_day}/day` : "Price not listed"}
                            </span>
                            {hasHourly && (
                              <span className="text-[10px] text-[#7B4D36] font-mono">
                                ₹{r.hourly_price}/hr
                              </span>
                            )}
                          </div>
                        </div>

                        {r.deposit_amount ? (
                          <p className="text-[11px] text-[#7B4D36]">
                            Security Deposit: <span className="font-semibold text-[#173B32]">₹{r.deposit_amount}</span>
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="p-2.5 rounded-xl bg-[#EFE5D2] text-xs font-medium text-[#173B32] flex items-center justify-between gap-2">
                        <span className="line-clamp-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#B65E3C] shrink-0" />
                          <span className="truncate">{r.location || "Location upon contact"}</span>
                        </span>
                        <span className="text-[11px] text-[#7B4D36] shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>{r.opening_hours || "Hours not listed"}</span>
                        </span>
                      </div>

                      {/* Real Action Links */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {dirLink && (
                          <a
                            href={dirLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#173B32] text-[#FAF4E8] text-xs font-bold hover:bg-[#0F2924] transition-colors shadow-2xs"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Directions</span>
                          </a>
                        )}

                        {phoneLink && (
                          <a
                            href={phoneLink}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#173B32]/30 text-[#173B32] text-xs font-bold hover:bg-[#EFE5D2] transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5 text-[#173B32]" />
                            <span>Call</span>
                          </a>
                        )}

                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-2xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        )}

                        {webLink && (
                          <a
                            href={webLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] text-[#7B4D36] text-xs font-medium hover:text-[#173B32] hover:border-[#173B32] transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Website</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] text-center space-y-2">
              <Bike className="w-8 h-8 text-[#B65E3C] mx-auto opacity-70" />
              <h4 className="font-serif font-bold text-base text-[#173B32]">No verified mobility rentals found nearby</h4>
              <p className="text-xs text-[#7B4D36] max-w-md mx-auto">
                Local rentals may operate from nearby taxi/rental hubs or regional transport unions. No speculative or unverified businesses are shown.
              </p>
            </div>
          )}
        </div>

      </main>

      {/* Place Detail Modal */}
      <PlaceModal
        place={selectedPlace}
        destinationName={destination.name}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      {/* Stay Detail Modal */}
      {stayModalOpen && selectedStayForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-4 max-h-[90vh] flex flex-col justify-between">
            {/* Header Visual */}
            <div className="relative h-56 bg-[#E5D5BA] shrink-0">
              {(() => {
                const stayVisual = resolvePlaceArtwork(
                  selectedStayForModal.name,
                  destination.name,
                  "Stays & Sanctuaries",
                  selectedStayForModal.image_url,
                  selectedStayForModal.is_live,
                  selectedStayForModal.source
                );
                return (
                  <VanvasImage
                    src={stayVisual.imageUrl}
                    fallbackSrc={stayVisual.fallbackUrl}
                    alt={selectedStayForModal.name}
                    className="w-full h-full object-cover"
                  />
                );
              })()}

              <button
                onClick={() => setStayModalOpen(false)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-xs transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#173B32] text-[#EFE5D2] shadow-sm">
                  {selectedStayForModal.badge || "Verified Stay"}
                </span>
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider shadow-sm ${
                  selectedStayForModal.availability_state === "AVAILABLE"
                    ? "bg-emerald-600 text-white"
                    : selectedStayForModal.availability_state === "UNAVAILABLE"
                    ? "bg-rose-700 text-white"
                    : "bg-[#0F2924]/85 text-[#FAF4E8]"
                }`}>
                  {selectedStayForModal.availability_state || "UNKNOWN"}
                </span>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#B65E3C] font-semibold">
                  {selectedStayForModal.accommodation_type || "Accommodation"} • {destination.name}
                </span>
                <h3 className="font-serif font-black text-2xl text-[#173B32] leading-tight mt-0.5">
                  {selectedStayForModal.name}
                </h3>
                <p className="text-xs text-[#7B4D36] mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#B65E3C] shrink-0" />
                  <span>
                    {selectedStayForModal.address}
                    {typeof selectedStayForModal.distance_km === "number" && ` (${selectedStayForModal.distance_km} km from destination center)`}
                  </span>
                </p>
              </div>

              {/* Price & Rating Tier */}
              <div className="p-3.5 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#7B4D36] block">Verified Rate</span>
                  <span className="font-serif font-bold text-lg text-[#B65E3C]">
                    {selectedStayForModal.price_formatted || (selectedStayForModal.price_per_night ? `₹${selectedStayForModal.price_per_night}/night` : "Rate unavailable")}
                  </span>
                </div>
                {selectedStayForModal.rating && (
                  <div className="text-right">
                    <span className="text-[10px] font-mono uppercase text-[#7B4D36] block">Guest Score</span>
                    <span className="font-bold text-sm text-[#173B32] flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{selectedStayForModal.rating}</span>
                      {selectedStayForModal.review_count && (
                        <span className="text-xs font-normal text-[#7B4D36]">({selectedStayForModal.review_count})</span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Traveller Matching Tags */}
              {selectedStayForModal.traveller_tags && selectedStayForModal.traveller_tags.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-[#173B32] uppercase tracking-wider block">
                    Matching Traveller Profiles
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStayForModal.traveller_tags.map((tag) => (
                      <span key={tag} className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-[#173B32]/10 text-[#173B32] border border-[#173B32]/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Amenities */}
              {selectedStayForModal.amenities && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-[#173B32] uppercase tracking-wider block">
                    Verified Amenities &amp; Features
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStayForModal.amenities.split(",").map((a, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg text-xs bg-white text-[#7B4D36] border border-[#E5D5BA]">
                        {a.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Timing */}
              <div className="grid grid-cols-2 gap-3 text-xs text-[#7B4D36]">
                <div className="p-2.5 rounded-xl bg-white border border-[#E5D5BA]">
                  <span className="font-mono uppercase text-[10px] text-[#7B4D36]/80 block">Check-in</span>
                  <span className="font-semibold text-[#173B32]">{selectedStayForModal.check_in_time || "12:00 PM"}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#E5D5BA]">
                  <span className="font-mono uppercase text-[10px] text-[#7B4D36]/80 block">Check-out</span>
                  <span className="font-semibold text-[#173B32]">{selectedStayForModal.check_out_time || "10:00 AM"}</span>
                </div>
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="p-4 border-t border-[#E5D5BA] bg-[#FAF7F0] flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                {selectedStayForModal.latitude && selectedStayForModal.longitude && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedStayForModal.latitude},${selectedStayForModal.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-[#EFE5D2] border border-[#E5D5BA] text-[#173B32] hover:text-[#B65E3C] transition-colors"
                    title="Get Directions"
                  >
                    <MapPin className="w-4 h-4" />
                  </a>
                )}
                {selectedStayForModal.phone && (
                  <a
                    href={`tel:${selectedStayForModal.phone}`}
                    className="p-2 rounded-xl bg-[#EFE5D2] border border-[#E5D5BA] text-emerald-800 hover:text-emerald-950 transition-colors"
                    title={`Call ${selectedStayForModal.phone}`}
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
                {selectedStayForModal.website && (
                  <a
                    href={selectedStayForModal.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-[#EFE5D2] border border-[#E5D5BA] text-[#173B32] hover:text-[#B65E3C] transition-colors"
                    title="Official Website"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}
              </div>

              {(selectedStayForModal.booking_url || selectedStayForModal.provider_url) ? (
                <a
                  href={selectedStayForModal.booking_url || selectedStayForModal.provider_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-[#173B32] hover:bg-[#B65E3C] text-[#EFE5D2] rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span>Book with Provider</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <button
                  onClick={() => setStayModalOpen(false)}
                  className="px-5 py-2.5 bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] rounded-xl font-bold text-xs transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
