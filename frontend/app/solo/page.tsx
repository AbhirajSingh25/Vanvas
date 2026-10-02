"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Compass, ShieldCheck, Heart, Users, MapPin, Coffee,
  Sparkles, ArrowRight, BookOpen, Sun, Moon, AlertTriangle,
  Phone, CheckCircle2, ChevronRight, BedDouble, Navigation,
  Clock, Shield, Star, Mountain, Eye, Footprints, Info,
  Search, Plus, RefreshCw, Layers, ExternalLink, Calendar,
  Trees, Landmark, Flame, Waves, Wind, MessageCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { Destination, Place, Hotel, RentalOption, SoloTravelerCard, TravelCircle, SoloDestinationIntelligence } from "@/types";
import { VanvasImage } from "@/components/ui/VanvasImage";
import { TravelStamp } from "@/components/ui/TravelStamp";
import { PlaceCard } from "@/components/places/PlaceCard";
import { PlaceModal } from "@/components/places/PlaceModal";
import { CANONICAL_DESTINATIONS } from "@/lib/canonicalDestinations";
import { resolvePlaceArtwork } from "@/lib/placeVisualResolver";
import { SoloAtmosphere } from "@/components/solo/SoloAtmosphere";
import { TravelerDetailModal } from "@/components/solo/TravelerDetailModal";
import { CreateCircleModal } from "@/components/circles/CreateCircleModal";
import { CircleDetailModal } from "@/components/circles/CircleDetailModal";
import { DirectChatModal } from "@/components/solo/DirectChatModal";
import { StayDetailModal } from "@/components/solo/StayDetailModal";
import { MobilityDetailModal } from "@/components/solo/MobilityDetailModal";
import { VehicleArtwork } from "@/components/ui/VehicleArtwork";
import { Avatar } from "@/components/ui/Avatar";
import { useDensity } from "@/context/DensityContext";
import { CompactTravelerCard, CompactPlaceCard } from "@/components/compact";

// Available Travel Styles with distinctive motifs
const TRAVEL_STYLES = [
  { id: "slow_travel", label: "Slow Travel", icon: BookOpen, desc: "Walkable lanes, reading cafes & unhurried days" },
  { id: "adventure_trails", label: "Adventure & Trails", icon: Mountain, desc: "High alpine treks, waterfalls & outdoor thrills" },
  { id: "culture_heritage", label: "Culture & Heritage", icon: Landmark, desc: "Ancient forts, temples, museums & old alleys" },
  { id: "cafes_food", label: "Cafes & Food", icon: Coffee, desc: "Artisan bakeries, local thalis & communal dining" },
  { id: "nature_solitude", label: "Nature & Solitude", icon: Trees, desc: "Panoramic viewpoints, quiet rivers & pine mist" },
  { id: "spiritual_ashrams", label: "Spiritual & Ashrams", icon: Sparkles, desc: "Ghat meditation, sunset aartis & yoga centers" },
  { id: "backpacking", label: "Backpacking", icon: Footprints, desc: "Social hostels, budget trails & shared transport" },
];

const PRESET_DESTINATION_CHIPS = [
  { slug: "manali", name: "Manali", state: "Himachal Pradesh" },
  { slug: "rishikesh", name: "Rishikesh", state: "Uttarakhand" },
  { slug: "goa", name: "Goa", state: "Goa" },
  { slug: "jaipur", name: "Jaipur", state: "Rajasthan" },
  { slug: "hampi", name: "Hampi", state: "Karnataka" },
  { slug: "varkala", name: "Varkala", state: "Kerala" },
  { slug: "chopta", name: "Chopta", state: "Uttarakhand" },
  { slug: "dharamshala", name: "Dharamshala", state: "Himachal Pradesh" },
  { slug: "pushkar", name: "Pushkar", state: "Rajasthan" },
  { slug: "udaipur", name: "Udaipur", state: "Rajasthan" },
  { slug: "kasol", name: "Kasol", state: "Himachal Pradesh" },
  { slug: "varanasi", name: "Varanasi", state: "Uttar Pradesh" },
  { slug: "munnar", name: "Munnar", state: "Kerala" },
];

function SoloPageContent() {
  const { isCompact } = useDensity();
  const searchParams = useSearchParams();
  const router = useRouter();
  const destQuery = searchParams.get("dest") || "manali";

  const [activeSlug, setActiveSlug] = useState(destQuery.toLowerCase());
  const [searchInputValue, setSearchInputValue] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [researchStage, setResearchStage] = useState<string>("");
  const [researchError, setResearchError] = useState<string | null>(null);

  // Travel Styles (Multi-select)
  const [selectedStyles, setSelectedStyles] = useState<string[]>(["slow_travel"]);

  // Core Destination Data
  const [destination, setDestination] = useState<any>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [rentals, setRentals] = useState<RentalOption[]>([]);
  const [intelligence, setIntelligence] = useState<SoloDestinationIntelligence | null>(null);
  const [styleCounts, setStyleCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Social Data
  const [travelers, setTravelers] = useState<SoloTravelerCard[]>([]);
  const [circles, setCircles] = useState<TravelCircle[]>([]);

  // Category Filter & Pagination
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [visiblePlacesCount, setVisiblePlacesCount] = useState<number>(18);

  // Modals
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [selectedRental, setSelectedRental] = useState<RentalOption | null>(null);
  const [selectedTraveler, setSelectedTraveler] = useState<SoloTravelerCard | null>(null);
  const [isTravelerModalOpen, setIsTravelerModalOpen] = useState(false);
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);
  const [isCircleModalOpen, setIsCircleModalOpen] = useState(false);
  const [isCreateCircleOpen, setIsCreateCircleOpen] = useState(false);
  const [chatPartner, setChatPartner] = useState<SoloTravelerCard | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Autocomplete debounce ref
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load Destination Data & Recommendations
  const loadDestinationData = async (slug: string, styles: string[] = selectedStyles) => {
    try {
      setLoading(true);
      
      // 1. Fetch recommendations (smartly ranked places, stays, mobility)
      const recRes = await api.getDestinationRecommendations(slug, styles);
      if (recRes) {
        setPlaces(recRes.recommended_places || []);
        setHotels(recRes.recommended_stays || []);
        setRentals(recRes.recommended_mobility || []);
        setStyleCounts(recRes.style_breakdown || {});
      }

      // 2. Fetch solo field intelligence
      const intelRes = await api.getDestinationSoloIntelligence(slug);
      setIntelligence(intelRes);

      // 3. Fetch destination metadata
      const destDetail = await api.getDestinationDetail(slug).catch(() => null);
      if (destDetail && destDetail.destination) {
        setDestination(destDetail.destination);
      } else if (intelRes) {
        setDestination({
          id: intelRes.destination_id,
          name: intelRes.name,
          slug: intelRes.slug,
          state: intelRes.state,
          region: intelRes.region,
          tagline: intelRes.tagline,
          description: `Research-backed solo travel guide and verified local intelligence for ${intelRes.name}.`,
          hero_image: "/images/destinations/fallbacks/himalayan.jpg",
          hero_artwork: "/artworks/fallback_himalayan.jpg",
          altitude_meters: 1500,
          best_time_to_visit: intelRes.best_seasons?.join(", ") || "October to May",
          weather_type: "Pleasant",
        });
      }

      // 4. Fetch social data (travelers & circles)
      const travelersRes = await api.discoverSoloTravelers({ destination_slug: slug, mode: "before_trip" }).catch(() => ({ travelers: [] }));
      setTravelers(travelersRes.travelers || []);

      const circlesRes = await api.discoverCircles({ destination_slug: slug }).catch(() => []);
      setCircles(circlesRes || []);

    } catch (err: any) {
      console.error("Failed to load destination data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDestinationData(activeSlug, selectedStyles);
  }, [activeSlug]);

  // Handle Travel Style Toggle
  const toggleTravelStyle = async (styleId: string) => {
    let nextStyles: string[];
    if (selectedStyles.includes(styleId)) {
      if (selectedStyles.length === 1) return; // Keep at least one
      nextStyles = selectedStyles.filter((s) => s !== styleId);
    } else {
      nextStyles = [...selectedStyles, styleId];
    }
    setSelectedStyles(nextStyles);

    // Refresh recommendations without reloading page
    try {
      const recRes = await api.getDestinationRecommendations(activeSlug, nextStyles);
      if (recRes) {
        setPlaces(recRes.recommended_places || []);
        setHotels(recRes.recommended_stays || []);
        setRentals(recRes.recommended_mobility || []);
        setStyleCounts(recRes.style_breakdown || {});
      }
    } catch (e) {
      console.warn("Could not update recommendations:", e);
    }
  };

  // Autocomplete Search Handler
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchInputValue(val);

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (!val.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const results = await api.searchDestinations(val.trim(), 6);
        setSearchResults(results || []);
      } catch (err) {
        console.warn("Autocomplete search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);
  };

  // Switch to selected destination
  const handleSelectDestination = (slug: string, name?: string) => {
    const clean = slug.toLowerCase().replace(/^(dyn|dest)-/, "");
    setActiveSlug(clean);
    setSearchInputValue("");
    setSearchResults([]);
    router.push(`/solo?dest=${encodeURIComponent(clean)}`, { scroll: false });
  };

  // Trigger Universal Destination Research Pipeline for Any Input
  const handleResearchArbitraryDestination = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchInputValue.trim();
    if (!query) return;

    setResearchError(null);
    try {
      setIsResearching(true);
      setResearchStage("Geocoding & resolving destination...");
      
      const res = await api.researchDestination(query);
      if (res && res.canonical_slug) {
        setResearchStage("Normalizing verified places, stays & local transit...");
        setActiveSlug(res.canonical_slug);
        setSearchInputValue("");
        setSearchResults([]);
        router.push(`/solo?dest=${encodeURIComponent(res.canonical_slug)}`, { scroll: false });
      }
    } catch (err: any) {
      setResearchError(`Could not research '${query}': ${err.message || "Please check spelling and try again."}`);
    } finally {
      setIsResearching(false);
      setResearchStage("");
    }
  };

  const displayName = destination?.name || intelligence?.name || activeSlug.replace(/-/g, " ").toUpperCase();
  const atmosphereType = intelligence?.atmosphere_type || "mountain";
  const mobilityHeading = atmosphereType === "mountain" ? "Valley Mobility & Scooter Fleets" : "Getting Around & Local Mobility";

  // Filter places by category
  const categoriesList: string[] = ["All", ...Array.from(new Set(places.map((p) => p.category || "Place").filter((c): c is string => Boolean(c))))];
  const filteredPlaces = selectedCategory === "All"
    ? places
    : places.filter((p) => (p.category || "").toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#20211D] relative selection:bg-[#E05A2B]/20 selection:text-[#173B32]">
      
      {/* Decorative Atmosphere Line Art Canvas */}
      <SoloAtmosphere atmosphereType={atmosphereType} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 sm:space-y-16 relative z-10">
        
        {/* ========================================================= */}
        {/* 1. HERO & UNIVERSAL DESTINATION SEARCH */}
        {/* ========================================================= */}
        <section className="space-y-6 pt-4 sm:pt-8 text-center sm:text-left max-w-4xl">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="px-3 py-1 rounded-full bg-[#173B32] text-[#FAF4E8] text-[10px] font-mono font-bold uppercase tracking-wider shadow-xs">
              VANVAS SOLO FIELD COMPANION
            </span>
            <span className="text-xs font-mono text-[#B49252] font-bold">
              {intelligence?.atmosphere_type?.toUpperCase() || "HIMALAYAN"} EDITION
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#173B32] tracking-tight leading-[1.1]">
              Go alone. <br className="hidden sm:block" />
              <span className="text-[#E05A2B] italic font-normal">Never feel unprepared.</span>
            </h1>
            <p className="text-sm sm:text-base text-[#20211D]/80 max-w-2xl leading-relaxed">
              A quiet, research-backed field companion for travelling solo across India. Tell VANVAS where you are headed — we research verified places, verified stays, local mobility, and compatible wanderers.
            </p>
          </div>

          {/* Universal Destination Search Input */}
          <div className="relative max-w-2xl pt-2">
            <form onSubmit={handleResearchArbitraryDestination} className="relative flex items-center shadow-lg rounded-3xl overflow-hidden border border-[#D8CBB2] bg-white">
              <div className="pl-5 pr-3 text-[#173B32]">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchInputValue}
                onChange={handleSearchInput}
                placeholder="Where are you going? (e.g. Manali, Varkala, Chopta, Hampi, Goa...)"
                className="w-full py-4 pr-32 text-sm sm:text-base text-[#173B32] placeholder:text-[#20211D]/50 focus:outline-none bg-transparent"
              />
              <button
                type="submit"
                disabled={isResearching || !searchInputValue.trim()}
                className="absolute right-2 px-5 py-2.5 rounded-2xl bg-[#E05A2B] hover:bg-[#C8491D] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                {isResearching ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Researching...</span>
                  </>
                ) : (
                  <>
                    <span>Research</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Autocomplete Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#D8CBB2] rounded-2xl shadow-xl z-30 overflow-hidden divide-y divide-[#D8CBB2]/50 animate-in fade-in zoom-in-95 duration-150">
                {searchResults.map((res: any, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDestination(res.canonical_slug || res.slug || res.name, res.name)}
                    className="w-full px-5 py-3.5 text-left hover:bg-[#FAF7F0] flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div>
                      <span className="font-serif font-bold text-sm text-[#173B32] group-hover:text-[#E05A2B]">
                        {res.name}
                      </span>
                      <span className="text-xs text-[#20211D]/60 ml-2">
                        {res.state || res.region || "India"}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#B49252]" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Researching Progressive Loading State */}
          {isResearching && (
            <div className="p-4 rounded-2xl bg-[#E05A2B]/10 border border-[#E05A2B]/20 text-xs text-[#E05A2B] font-medium flex items-center gap-3 animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
              <span>{researchStage || "Researching this place for your solo trip..."}</span>
            </div>
          )}

          {/* Research Error Notice */}
          {researchError && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{researchError}</span>
            </div>
          )}

          {/* Preset Destination Chips (Quick Shortcuts) */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-mono uppercase text-[#20211D]/60 font-bold block">
              Quick Shortcut Chips
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_DESTINATION_CHIPS.map((chip) => {
                const isActive = activeSlug === chip.slug;
                return (
                  <button
                    key={chip.slug}
                    onClick={() => handleSelectDestination(chip.slug, chip.name)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                      isActive
                        ? "bg-[#173B32] text-white border border-[#173B32]"
                        : "bg-white border border-[#D8CBB2] text-[#173B32] hover:bg-[#E5D5BA]/50"
                    }`}
                  >
                    {chip.name}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. HOW DO YOU WANT TO EXPERIENCE {DESTINATION}? */}
        {/* ========================================================= */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#D8CBB2] pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#E05A2B] font-bold tracking-wider block">
                RECOMMENDATION MODES
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#173B32]">
                How do you want to experience {displayName}?
              </h2>
            </div>
            <p className="text-xs text-[#20211D]/70 font-medium">
              Multi-select active: {selectedStyles.length} {selectedStyles.length === 1 ? "style" : "styles"} selected
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {TRAVEL_STYLES.map((st) => {
              const isSelected = selectedStyles.includes(st.id);
              const count = styleCounts[st.id] ?? places.length;
              const IconComp = st.icon;

              return (
                <button
                  key={st.id}
                  onClick={() => toggleTravelStyle(st.id)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 shadow-2xs ${
                    isSelected
                      ? "bg-white border-[#173B32] ring-1 ring-[#173B32]"
                      : "bg-[#FAF7F0] border-[#D8CBB2] hover:bg-white hover:border-[#173B32]/60"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`p-2 rounded-xl ${isSelected ? "bg-[#173B32] text-white" : "bg-white border border-[#D8CBB2] text-[#173B32]"}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#B49252]">
                      {count} {count === 1 ? "spot" : "spots"}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-serif text-sm font-bold text-[#173B32]">
                      {st.label}
                    </h4>
                    <p className="text-[11px] text-[#20211D]/70 leading-relaxed line-clamp-2">
                      {st.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. FIND YOUR PEOPLE & TRAVEL CIRCLES (ABOVE THE FOLD) */}
        {/* ========================================================= */}
        <section className="space-y-6">
          <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#E05A2B]/10 text-[#E05A2B] text-[10px] font-mono font-bold uppercase tracking-wider">
                    FIND YOUR PEOPLE
                  </span>
                  {travelers.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#173B32]/10 text-[#173B32] text-[10px] font-bold">
                      {travelers.length} Solo {travelers.length === 1 ? "Traveler" : "Travelers"} Around You
                    </span>
                  )}
                </div>

                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#173B32]">
                  Solo Travelers & Circles in {displayName}
                </h3>
                <p className="text-xs sm:text-sm text-[#20211D]/80 leading-relaxed">
                  Discover compatible solo wanderers with overlapping travel dates, connect directly, or join community-organized morning hikes and cafe crawls.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  onClick={() => setIsCreateCircleOpen(true)}
                  className="flex-1 md:flex-initial px-4 py-3 rounded-2xl bg-[#E05A2B] hover:bg-[#C8491D] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create a Circle</span>
                </button>
                <Link
                  href="/profile?tab=solo"
                  className="px-4 py-3 rounded-2xl bg-white border border-[#D8CBB2] hover:bg-[#E5D5BA]/50 text-[#173B32] text-xs font-bold transition-colors shadow-xs whitespace-nowrap"
                >
                  Set Travel Dates
                </Link>
              </div>
            </div>
          </div>

          {/* Social Columns: Matching Travelers + Active Circles */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Solo Traveler Matches */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#173B32] uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-[#E05A2B]" />
                <span>Solo Travelers with Overlapping Plans</span>
              </h4>

              {travelers.length === 0 ? (
                <div className="p-8 rounded-3xl bg-white border border-[#D8CBB2] text-center space-y-2.5">
                  <Users className="w-6 h-6 text-[#B49252] mx-auto" />
                  <h5 className="font-serif font-bold text-[#173B32] text-sm">
                    No solo travellers have joined {displayName} yet.
                  </h5>
                  <p className="text-xs text-[#20211D]/70 max-w-xs mx-auto leading-relaxed">
                    Set your dates in Solo Settings to be discoverable when other travellers arrive.
                  </p>
                </div>
              ) : (
                isCompact ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {travelers.slice(0, 6).map((t) => (
                      <CompactTravelerCard
                        key={t.user_id}
                        traveler={t}
                        onOpenProfile={(traveler) => {
                          setSelectedTraveler(traveler);
                          setIsTravelerModalOpen(true);
                        }}
                        onOpenChat={(traveler) => {
                          setChatPartner(traveler);
                          setIsChatOpen(true);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {travelers.slice(0, 4).map((t) => (
                      <div
                        key={t.user_id}
                        className="p-4 rounded-2xl bg-white border border-[#D8CBB2] hover:border-[#173B32] flex items-center justify-between gap-4 transition-all shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar
                            user={{
                              full_name: t.full_name,
                              avatar_url: t.avatar_url,
                              avatar_type: t.avatar_type,
                              avatar_preset: t.avatar_preset,
                            }}
                            size="md"
                          />
                          <div>
                            <h5 className="font-serif font-bold text-sm text-[#173B32]">
                              {t.full_name}
                            </h5>
                            <p className="text-[11px] text-[#20211D]/70">
                              {t.travel_style || "Solo Explorer"} · {t.overlapping_days || 0} overlapping days
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {t.connection_status === "ACCEPTED" ? (
                            <button
                              onClick={() => {
                                setChatPartner(t);
                                setIsChatOpen(true);
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-[#B49252]" />
                              <span>Chat</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedTraveler(t);
                                setIsTravelerModalOpen(true);
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-[#E05A2B] hover:bg-[#C8491D] text-white text-xs font-bold shadow-xs cursor-pointer"
                            >
                              Connect
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            {/* Active Circles in Destination */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#173B32] uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#B49252]" />
                <span>Forming Travel Circles ({circles.length})</span>
              </h4>

              {circles.length === 0 ? (
                <div className="p-8 rounded-3xl bg-white border border-[#D8CBB2] text-center space-y-2.5">
                  <Flame className="w-6 h-6 text-[#E05A2B] mx-auto" />
                  <h5 className="font-serif font-bold text-[#173B32] text-sm">
                    No active circles in {displayName} right now.
                  </h5>
                  <p className="text-xs text-[#20211D]/70 max-w-xs mx-auto leading-relaxed">
                    Start a sunrise hike, cafe crawl, or temple walk circle and invite nearby travellers.
                  </p>
                  <button
                    onClick={() => setIsCreateCircleOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#173B32] text-white text-xs font-bold hover:bg-[#20453B] transition-colors cursor-pointer"
                  >
                    Start First Circle
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {circles.slice(0, 4).map((c) => (
                    <div
                      key={c.id}
                      className="p-4 rounded-2xl bg-white border border-[#D8CBB2] hover:border-[#173B32] flex items-center justify-between gap-4 transition-all shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="px-2 py-0.5 rounded-md bg-[#173B32]/10 text-[#173B32] text-[9px] font-mono font-bold uppercase">
                            {c.activity_type}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-[#B49252]">
                            {c.members_count}/{c.max_members} Travelers
                          </span>
                        </div>
                        <h5 className="font-serif font-bold text-sm text-[#173B32] line-clamp-1">
                          {c.name}
                        </h5>
                        <p className="text-[11px] text-[#20211D]/70 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#E05A2B]" />
                          <span>{c.meetup_point}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedCircleId(c.id);
                          setIsCircleModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer whitespace-nowrap"
                      >
                        <span>{c.is_member ? "Open Chat" : "Join Circle"}</span>
                        <ArrowRight className="w-3 h-3 text-[#B49252]" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. PLACES WORTH EXPERIENCING ALONE IN {DESTINATION} */}
        {/* ========================================================= */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#D8CBB2] pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#E05A2B] font-bold tracking-wider block">
                CURATED FOR SOLITUDE & CONNECTION
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#173B32]">
                Places Worth Experiencing Alone in {displayName}
              </h2>
            </div>

            <div className="text-xs text-[#20211D]/70 font-mono font-bold">
              Showing {Math.min(visiblePlacesCount, filteredPlaces.length)} of {filteredPlaces.length} places
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? "bg-[#173B32] text-white shadow-xs"
                    : "bg-white border border-[#D8CBB2] text-[#173B32] hover:bg-[#E5D5BA]/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Places Grid */}
          {loading ? (
            <div className="py-16 text-center space-y-2">
              <RefreshCw className="w-6 h-6 text-[#B49252] animate-spin mx-auto" />
              <p className="text-xs text-[#20211D]/60">Compiling verified solo places in {displayName}...</p>
            </div>
          ) : filteredPlaces.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white border border-[#D8CBB2] text-center space-y-3">
              <Mountain className="w-8 h-8 text-[#B49252] mx-auto" />
              <h4 className="font-serif font-bold text-base text-[#173B32]">
                No places found in this category.
              </h4>
              <p className="text-xs text-[#20211D]/70 max-w-sm mx-auto">
                Try switching to &apos;All&apos; categories or researching additional spots with the search bar above.
              </p>
            </div>
          ) : (
            <>
              {isCompact ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {filteredPlaces.slice(0, visiblePlacesCount).map((place) => (
                    <CompactPlaceCard
                      key={place.id}
                      place={place}
                      onSelect={(p: Place) => setSelectedPlace(p)}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {filteredPlaces.slice(0, visiblePlacesCount).map((place) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      destinationName={displayName}
                      onSelect={(p: Place) => setSelectedPlace(p)}
                    />
                  ))}
                </div>
              )}

              {/* Load More Button */}
              {visiblePlacesCount < filteredPlaces.length && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => setVisiblePlacesCount((prev) => prev + 18)}
                    className="px-6 py-3 rounded-2xl bg-white border border-[#D8CBB2] hover:bg-[#FAF7F0] text-[#173B32] text-xs font-bold uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
                  >
                    Load More Places ({filteredPlaces.length - visiblePlacesCount} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* ========================================================= */}
        {/* 5. ESSENTIAL FIELD INTELLIGENCE FOR {DESTINATION} */}
        {/* ========================================================= */}
        {intelligence && (
          <section className="space-y-6">
            <div className="border-b border-[#D8CBB2] pb-4">
              <span className="text-[10px] font-mono uppercase text-[#173B32] font-bold tracking-wider block">
                FIELD PROTOCOLS
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#173B32]">
                Essential Field Intelligence for {displayName}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              
              {/* Safe Areas */}
              <div className="p-6 rounded-3xl bg-white border border-[#D8CBB2] space-y-3 shadow-2xs">
                <h4 className="font-serif text-base font-bold text-[#173B32] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#173B32]" />
                  <span>Safe Zones & Walking Areas</span>
                </h4>
                <ul className="space-y-2 text-xs text-[#20211D]/80">
                  {intelligence.safe_areas.map((area, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#173B32] mt-1.5 shrink-0" />
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Transit & Mobility */}
              <div className="p-6 rounded-3xl bg-white border border-[#D8CBB2] space-y-3 shadow-2xs">
                <h4 className="font-serif text-base font-bold text-[#173B32] flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-[#E05A2B]" />
                  <span>Getting Around & Local Transit</span>
                </h4>
                <ul className="space-y-2 text-xs text-[#20211D]/80">
                  {intelligence.getting_around.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E05A2B] mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Solo Dining & Cafes */}
              <div className="p-6 rounded-3xl bg-white border border-[#D8CBB2] space-y-3 shadow-2xs">
                <h4 className="font-serif text-base font-bold text-[#173B32] flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-[#B49252]" />
                  <span>Solo Dining & Reading Cafes</span>
                </h4>
                <ul className="space-y-2 text-xs text-[#20211D]/80">
                  {intelligence.dining_tips.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B49252] mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Stays Advice */}
              <div className="p-6 rounded-3xl bg-white border border-[#D8CBB2] space-y-3 shadow-2xs">
                <h4 className="font-serif text-base font-bold text-[#173B32] flex items-center gap-2">
                  <BedDouble className="w-4 h-4 text-[#173B32]" />
                  <span>Stay & Sanctuary Advice</span>
                </h4>
                <ul className="space-y-2 text-xs text-[#20211D]/80">
                  {intelligence.stay_tips.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#173B32] mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Etiquette & Customs */}
              <div className="p-6 rounded-3xl bg-white border border-[#D8CBB2] space-y-3 shadow-2xs">
                <h4 className="font-serif text-base font-bold text-[#173B32] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#B49252]" />
                  <span>Local Customs & Etiquette</span>
                </h4>
                <ul className="space-y-2 text-xs text-[#20211D]/80">
                  {intelligence.etiquette.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B49252] mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Emergency Numbers */}
              <div className="p-6 rounded-3xl bg-white border border-[#D8CBB2] space-y-3 shadow-2xs">
                <h4 className="font-serif text-base font-bold text-[#173B32] flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-700" />
                  <span>Verified Emergency Numbers</span>
                </h4>
                <div className="space-y-2 text-xs">
                  {intelligence.emergency_contacts.map((c, idx) => (
                    <a
                      key={idx}
                      href={`tel:${c.number}`}
                      className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#D8CBB2] hover:border-[#173B32] flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="text-[#20211D]/80 font-medium truncate pr-2">{c.label}</span>
                      <span className="font-mono font-bold text-[#173B32]">{c.number}</span>
                    </a>
                  ))}
                </div>
              </div>

            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* 6. STAYS & SANCTUARIES */}
        {/* ========================================================= */}
        {hotels.length > 0 && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#D8CBB2] pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#E05A2B] font-bold tracking-wider block">
                  REST & RETREAT
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#173B32]">
                  Stays & Sanctuaries in {displayName}
                </h2>
              </div>
              <p className="text-xs text-[#20211D]/70 font-medium">
                {hotels.length} verified solo-friendly properties
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {hotels.map((h) => (
                <div
                  key={h.id}
                  className="bg-white border border-[#D8CBB2] hover:border-[#173B32] rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="relative h-44 bg-[#173B32] overflow-hidden">
                    <VanvasImage
                      src={h.image_url || "/images/places/universal/stay.webp"}
                      alt={h.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-mono font-bold">
                      {h.hotel_style || "Sanctuary"}
                    </div>
                  </div>

                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif text-base font-bold text-[#173B32] line-clamp-1">
                          {h.name}
                        </h4>
                        {h.rating && (
                          <span className="flex items-center gap-1 text-xs font-bold text-[#B49252]">
                            <Star className="w-3.5 h-3.5 fill-[#B49252]" />
                            {h.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#20211D]/70 line-clamp-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#E05A2B] shrink-0" />
                        <span>{h.address}</span>
                      </p>
                      <p className="text-sm font-bold text-[#173B32]">
                        ₹{h.price_per_night ? h.price_per_night.toLocaleString() : "—"}{" "}
                        <span className="text-[11px] font-normal text-[#20211D]/60">/ night</span>
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedHotel(h)}
                      className="w-full py-2.5 rounded-xl bg-[#FAF7F0] border border-[#D8CBB2] hover:bg-[#173B32] hover:text-white text-[#173B32] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      View Property & Booking
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* 7. GETTING AROUND & LOCAL MOBILITY */}
        {/* ========================================================= */}
        {rentals.length > 0 && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#D8CBB2] pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#173B32] font-bold tracking-wider block">
                  SELF-DRIVE & TRANSIT
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#173B32]">
                  {mobilityHeading}
                </h2>
              </div>
              <p className="text-xs text-[#20211D]/70 font-medium">
                {rentals.length} verified operators in {displayName}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {rentals.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedRental(r)}
                  className="p-5 rounded-3xl bg-white border border-[#D8CBB2] hover:border-[#173B32] transition-all cursor-pointer shadow-2xs space-y-3 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-[#FAF7F0] border border-[#D8CBB2] flex items-center justify-center p-1 text-[#173B32] overflow-hidden">
                      <VehicleArtwork
                        type={r.vehicle_type}
                        name={r.vehicle_name}
                        destination={displayName}
                        imageUrl={r.image_url}
                        className="w-full h-full object-cover rounded-xl"
                        showBadge={false}
                      />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E05A2B]/10 text-[#E05A2B] text-[10px] font-mono font-bold uppercase">
                      {r.vehicle_type}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-serif font-bold text-base text-[#173B32] group-hover:text-[#E05A2B] transition-colors">
                      {r.provider_name}
                    </h4>
                    <p className="text-xs text-[#20211D]/70">{r.vehicle_name}</p>
                    <p className="text-xs font-bold text-[#173B32] mt-1">
                      {r.price_per_day ? `₹${r.price_per_day.toLocaleString()} / day` : "Inquire at counter"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* ========================================================= */}
      {/* INTERACTIVE MODALS */}
      {/* ========================================================= */}
      <PlaceModal
        place={selectedPlace}
        isOpen={Boolean(selectedPlace)}
        onClose={() => setSelectedPlace(null)}
      />

      <StayDetailModal
        hotel={selectedHotel}
        isOpen={Boolean(selectedHotel)}
        onClose={() => setSelectedHotel(null)}
      />

      <MobilityDetailModal
        rental={selectedRental}
        isOpen={Boolean(selectedRental)}
        onClose={() => setSelectedRental(null)}
      />

      <TravelerDetailModal
        traveler={selectedTraveler}
        isOpen={isTravelerModalOpen}
        onClose={() => setIsTravelerModalOpen(false)}
        destinationName={displayName}
      />

      <DirectChatModal
        partner={chatPartner}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      <CreateCircleModal
        isOpen={isCreateCircleOpen}
        onClose={() => setIsCreateCircleOpen(false)}
        destinationId={destination?.id}
        destinationName={displayName}
        onCircleCreated={(c) => {
          setCircles((prev) => [c, ...prev]);
          setSelectedCircleId(c.id);
          setIsCircleModalOpen(true);
        }}
      />

      <CircleDetailModal
        circleId={selectedCircleId}
        isOpen={isCircleModalOpen}
        onClose={() => setIsCircleModalOpen(false)}
        onCircleLeft={(cId) => setCircles((prev) => prev.filter((c) => c.id !== cId))}
      />

    </div>
  );
}

export default function SoloPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF7F0] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#B49252] animate-spin" />
      </div>
    }>
      <SoloPageContent />
    </Suspense>
  );
}
