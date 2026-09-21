"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Compass, MapPin, Sparkles, Star, BedDouble, Bike, Clock,
  ExternalLink, ArrowRight, ShieldCheck, Bookmark, Check, Mountain,
  Calendar, Sun, Coffee, Trees, Fuel, AlertCircle, RefreshCw, Layers
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
  
  const [rentals, setRentals] = useState<RentalOption[]>([]);
  const [rentalsLoading, setRentalsLoading] = useState(true);
  
  const [stayOffers, setStayOffers] = useState<Offer[]>([]);
  
  const [livePlaces, setLivePlaces] = useState<Place[]>([]);
  const [liveCategory, setLiveCategory] = useState<string>("all");
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDuplicateOfCurated = (livePlace: Place, curatedPlaces: Place[]): boolean => {
    const normLive = (livePlace.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!normLive) return false;

    for (const cp of curatedPlaces) {
      const normCurated = (cp.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!normCurated) continue;

      if (normLive === normCurated || normLive.includes(normCurated) || normCurated.includes(normLive)) {
        return true;
      }

      if (
        typeof livePlace.latitude === "number" &&
        typeof livePlace.longitude === "number" &&
        typeof cp.latitude === "number" &&
        typeof cp.longitude === "number"
      ) {
        const dLat = Math.abs(livePlace.latitude - cp.latitude);
        const dLng = Math.abs(livePlace.longitude - cp.longitude);
        if (dLat < 0.005 && dLng < 0.005) {
          return true;
        }
      }
    }
    return false;
  };

  const fetchLiveDiscovery = (lat: number, lng: number, cat: string, curPlaces: Place[] = places) => {
    setLiveLoading(true);
    setLiveError(null);
    api.getNearbyPlaces(lat, lng, 15, cat === "all" ? undefined : cat, "recommended", true)
      .then((res) => {
        const raw = res || [];
        const unique = raw.filter((lp) => !isDuplicateOfCurated(lp, curPlaces));
        setLivePlaces(unique);
        if (unique.length === 0) {
          setLiveError(cat === "all" ? "No additional live places discovered in this radius." : `No additional live ${cat} found in this radius.`);
        }
      })
      .catch(() => {
        setLiveError("Live places are temporarily unavailable.");
      })
      .finally(() => setLiveLoading(false));
  };

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

    api.getDestinationDetail(slug)
      .then((data) => {
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

        // 4. Live POIs
        if (lat && lng) {
          fetchLiveDiscovery(lat, lng, liveCategory, data.places || []);
        }
      })
      .catch((err) => {
        console.error("Destination fetch error:", err);
        setLoadError(err.message || "Failed to load destination");
        setDestLoading(false);
        setStaysLoading(false);
        setRentalsLoading(false);
      });
  };

  useEffect(() => {
    fetchDestination();
  }, [slug]);

  useEffect(() => {
    if (destination?.latitude && destination?.longitude) {
      fetchLiveDiscovery(destination.latitude, destination.longitude, liveCategory);
    }
  }, [liveCategory]);

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

        {/* LIVE PLACES NEAR DESTINATION (Real-Time Category Tag Search) */}
        <div className="space-y-6 pt-6 border-t-2 border-[#E5D5BA]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5D5BA] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-[10px] font-mono font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE POI DISCOVERY
                </span>
                <span className="text-xs text-[#7B4D36] font-mono">
                  {destination.latitude.toFixed(2)}°N, {destination.longitude.toFixed(2)}°E
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32]">
                Live Places Near {destination.name}
              </h3>
              <p className="text-xs text-[#7B4D36]">
                Retrieved in real-time from open geographic datasets. Automatically deduplicated against curated editorial landmarks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {[
              { id: "all", label: "All Categories" },
              { id: "food", label: "Food & Dining" },
              { id: "coffee", label: "Coffee & Cafes" },
              { id: "attractions", label: "Things to Do" },
              { id: "shopping", label: "Markets & Shops" },
              { id: "mobility", label: "Mobility & Rentals" },
              { id: "essentials", label: "Essentials & Medical" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setLiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  liveCategory === cat.id
                    ? "bg-[#173B32] text-[#EFE5D2] shadow-sm border-2 border-[#173B32]"
                    : "bg-[#FAF7F0] text-[#20211D]/80 border border-[#E5D5BA] hover:bg-[#E5D5BA]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {liveLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] animate-pulse space-y-4">
                  <div className="h-44 bg-[#E5D5BA]/60 rounded-2xl" />
                  <div className="h-5 bg-[#E5D5BA]/80 rounded w-3/4" />
                  <div className="h-3 bg-[#E5D5BA]/50 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : liveError ? (
            <div className="p-6 rounded-2xl bg-[#FAF7F0] border border-[#E5D5BA] text-center space-y-2">
              <p className="text-sm font-serif font-bold text-[#7B4D36]">{liveError}</p>
              <p className="text-xs text-[#20211D]/70">Explore our curated sanctuary guide above for verified landmarks.</p>
            </div>
          ) : livePlaces.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {livePlaces.map((place) => (
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
          ) : (
            <div className="p-6 rounded-2xl bg-[#FAF7F0] border border-[#E5D5BA] text-center space-y-1">
              <p className="text-xs text-[#7B4D36]">No verified places found in this category yet in open geographic registry.</p>
            </div>
          )}
        </div>

        {/* STAYS & SANCTUARIES */}
        <div className="space-y-6 pt-6 border-t-2 border-[#E5D5BA]">
          <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#B65E3C]">
                आशियाना • Stays &amp; Cottages
              </span>
              <h3 className="font-serif font-black text-2xl sm:text-3xl text-[#173B32] flex items-center gap-2 mt-0.5">
                <BedDouble className="w-6 h-6 text-[#B65E3C]" />
                <span>Stays &amp; Sanctuaries {!staysLoading && `(${hotels.length})`}</span>
              </h3>
            </div>
            <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase ${
              isCurated
                ? "bg-[#FAF7F0] border border-[#E5D5BA] text-[#7B4D36]"
                : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-800"
            }`}>
              {isCurated ? "Verified Stays" : "Live Accommodation"}
            </span>
          </div>

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
                const isLiveStay = h.is_live || h.source === "openstreetmap" || h.source === "google_places";
                const isPriceVerified = h.price_verified !== false && typeof h.price_per_night === "number" && h.price_per_night > 0;
                const stayVisual = resolvePlaceArtwork(h.name, destination.name, "Stays & Sanctuaries", h.image_url, h.is_live, h.source);

                return (
                  <div key={h.id} className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] hover:border-[#173B32]/40 shadow-2xs hover:shadow-lg transition-all space-y-3.5 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="relative h-44 rounded-2xl overflow-hidden bg-[#E5D5BA]">
                        <VanvasImage
                          src={stayVisual.imageUrl}
                          fallbackSrc={stayVisual.fallbackUrl}
                          alt={`${h.name} in ${destination.name}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-xs ${
                            isLiveStay
                              ? "bg-emerald-600 text-white"
                              : "bg-[#173B32] text-[#EFE5D2]"
                          }`}>
                            {isLiveStay ? "LIVE STAY" : (h.badge || "Handpicked")}
                          </span>
                          {!isPriceVerified && (
                            <span className="px-2 py-0.5 rounded-md bg-[#0F2924]/80 backdrop-blur-xs text-[#FAF4E8] text-[9px] font-mono uppercase tracking-wider border border-white/10">
                              Rate Unverified
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-serif font-bold text-base text-[#173B32] leading-snug">{h.name}</h4>
                          <span className={`font-bold text-xs shrink-0 ${isPriceVerified ? "text-[#B65E3C]" : "text-[#7B4D36]/80 text-[11px] font-mono"}`}>
                            {isPriceVerified ? `₹${h.price_per_night}/n` : "Rate on booking"}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7B4D36] mt-1 line-clamp-1">{h.address}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#E5D5BA] flex items-center justify-between text-xs text-[#536B52]">
                      <span className="line-clamp-1">Amenities: {h.amenities?.split(",")[0] || "Scenic Stay"}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        {h.latitude && h.longitude && (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${h.latitude},${h.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#173B32] hover:text-[#B65E3C] p-1"
                            title="Get directions"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {h.booking_url ? (
                          <a
                            href={h.booking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#B65E3C] font-bold hover:underline flex items-center gap-1"
                          >
                            <span>Book</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-[#7B4D36] italic">Contact on arrival</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-[#FAF7F0] border border-[#E5D5BA] text-center space-y-1">
              <p className="text-xs text-[#7B4D36]">Live stays are temporarily unavailable or not registered in this exact coordinate sector.</p>
            </div>
          )}
        </div>

        {/* LIVE PROVIDER OFFERS (AMADEUS GDS / REAL COMMERCE OFFERS) */}
        {stayOffers.length > 0 && (
          <div className="space-y-6 pt-6 border-t-2 border-[#E5D5BA]">
            <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#B65E3C]">
                  लाइव आवास • Verified Stay Offers
                </span>
                <h3 className="font-serif font-black text-2xl sm:text-3xl text-[#173B32] flex items-center gap-2 mt-0.5">
                  <Sparkles className="w-6 h-6 text-[#B65E3C]" />
                  <span>Live Stay Offers ({stayOffers.length})</span>
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-800">
                Live Stay Engine
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stayOffers.map((offer) => {
                const isAvail = offer.availability_state === "AVAILABLE";
                const isPriceVerified = typeof offer.price === "number" && offer.price > 0;

                return (
                  <div key={offer.provider_offer_id} className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] hover:border-[#173B32]/40 shadow-2xs hover:shadow-lg transition-all space-y-3.5 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#173B32] text-[#EFE5D2]">
                          LIVE PROVIDER OFFER
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono uppercase font-bold ${
                          isAvail
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-slate-100 text-slate-700 border border-slate-300"
                        }`}>
                          {offer.availability_state || "UNKNOWN"}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-serif font-bold text-base text-[#173B32] leading-snug">{offer.title}</h4>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs font-mono text-[#7B4D36] uppercase">{offer.provider}</span>
                          <span className="text-xs text-[#7B4D36]">•</span>
                          <span className="text-xs font-mono font-bold text-[#B65E3C]">
                            {isPriceVerified ? `${offer.currency || "INR"} ${offer.price}` : "Price on request"}
                          </span>
                        </div>
                        {offer.cancellation_policy && (
                          <p className="text-[11px] text-emerald-800 mt-1 font-sans bg-emerald-50/80 p-1.5 rounded-md border border-emerald-200/60 line-clamp-2">
                            {offer.cancellation_policy}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#E5D5BA] flex items-center justify-between text-xs text-[#536B52]">
                      <span className="text-[11px] font-mono text-[#7B4D36]">Verified Commerce Tier</span>
                      {offer.booking_capability === "EXTERNAL_CHECKOUT" && offer.deep_link ? (
                        <a
                          href={offer.deep_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-[#173B32] text-[#EFE5D2] rounded-xl font-bold text-xs hover:bg-[#B65E3C] transition-colors flex items-center gap-1 shrink-0"
                        >
                          <span>Continue with Provider</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-[#7B4D36] italic">Discovery Only</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
              {isCurated ? "Curated Mobility" : "Live Rental Hubs"}
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
                const isLiveRent = r.is_live || r.source === "openstreetmap";
                const isPriceVerified = r.inventory_verified !== false && typeof r.price_per_day === "number" && r.price_per_day > 0;

                return (
                  <div key={r.id} className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] hover:border-[#173B32]/40 shadow-2xs hover:shadow-lg transition-all space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="relative h-44 rounded-2xl overflow-hidden bg-[#E5D5BA]">
                        <VehicleArtwork
                          type={r.vehicle_type}
                          name={r.vehicle_name}
                          alt={r.vehicle_name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-xs ${
                            isLiveRent
                              ? "bg-emerald-600 text-white"
                              : "bg-[#173B32] text-[#EFE5D2]"
                          }`}>
                            {isLiveRent ? "LIVE MOBILITY" : "CURATED"}
                          </span>
                          {!isPriceVerified && (
                            <span className="px-2 py-0.5 rounded-md bg-[#0F2924]/80 backdrop-blur-xs text-[#FAF4E8] text-[9px] font-mono uppercase tracking-wider border border-white/10">
                              Inventory Unverified
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-serif font-bold text-base text-[#173B32] leading-snug">{r.vehicle_name}</h4>
                          <span className={`font-bold text-xs shrink-0 ${isPriceVerified ? "text-[#173B32]" : "text-[#7B4D36]/80 text-[11px] font-mono"}`}>
                            {isPriceVerified ? `₹${r.price_per_day}/day` : "Rate upon pickup"}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7B4D36] mt-0.5">
                          Provider: {r.provider_name} {r.deposit_amount ? `• Deposit: ₹${r.deposit_amount}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#EFE5D2] text-xs font-medium text-[#173B32] flex items-center justify-between">
                      <span className="line-clamp-1">{r.location}</span>
                      <span className="text-[11px] text-[#7B4D36] shrink-0">{r.opening_hours || "Hours not listed"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-[#FAF7F0] border border-[#E5D5BA] text-center space-y-1">
              <p className="text-xs text-[#7B4D36]">No verified mobility rentals registered in open geographic datasets for this immediate sector. Taxis and local rentals can typically be hailed at the main taxi union hub.</p>
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
    </div>
  );
}
