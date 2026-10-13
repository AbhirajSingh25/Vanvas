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
  Trees, Landmark, Flame, Waves, Wind, MessageCircle, Lock, Bookmark
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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
import { VanvasTabBar } from "@/components/ui/VanvasTabBar";
import { useDensity } from "@/context/DensityContext";
import { tabIndicatorTransition, routeScreenVariants } from "@/lib/motion";

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

type SoloTabType = "discover" | "travellers" | "circles" | "safety_saved";

function SoloPageContent() {
  const { isCompact } = useDensity();
  const searchParams = useSearchParams();
  const router = useRouter();
  const destQuery = searchParams.get("dest") || "manali";

  const [activeTab, setActiveTab] = useState<SoloTabType>("discover");
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
  const [visiblePlacesCount, setVisiblePlacesCount] = useState<number>(12);

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
  const [showAiAtmosphere, setShowAiAtmosphere] = useState(false);

  // Privacy setting
  const [isProfileVisible, setIsProfileVisible] = useState(true);

  // Autocomplete debounce ref
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load Destination Data & Recommendations
  const loadDestinationData = async (slug: string, styles: string[] = selectedStyles) => {
    try {
      setLoading(true);

      const recRes = await api.getDestinationRecommendations(slug, styles).catch(() => null);
      if (recRes) {
        setPlaces(recRes.recommended_places || []);
        setHotels(recRes.recommended_stays || []);
        setRentals(recRes.recommended_mobility || []);
        setStyleCounts(recRes.style_breakdown || {});
      }

      const intelRes = await api.getDestinationSoloIntelligence(slug).catch(() => null);
      setIntelligence(intelRes);

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

  const toggleTravelStyle = async (styleId: string) => {
    let nextStyles: string[];
    if (selectedStyles.includes(styleId)) {
      if (selectedStyles.length === 1) return;
      nextStyles = selectedStyles.filter((s) => s !== styleId);
    } else {
      nextStyles = [...selectedStyles, styleId];
    }
    setSelectedStyles(nextStyles);

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

  const handleSelectDestination = (slug: string, name?: string) => {
    const clean = slug.toLowerCase().replace(/^(dyn|dest)-/, "");
    setActiveSlug(clean);
    setSearchInputValue("");
    setSearchResults([]);
    setIsSearching(false);
    setResearchError(null);
    router.replace(`/solo?dest=${clean}`, { scroll: false });
  };

  const handleTriggerResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInputValue.trim() || isResearching) return;

    try {
      setIsResearching(true);
      setResearchError(null);
      setResearchStage("Connecting to Indian geographic intelligence...");

      const res = await api.researchDestination(searchInputValue.trim());
      if (res && res.slug) {
        setResearchStage("Compiling verified stays and local trails...");
        handleSelectDestination(res.slug, res.name);
      } else {
        setResearchError("Could not resolve destination. Showing closest verified destination.");
      }
    } catch (err: any) {
      setResearchError(err?.message || "Research request timed out. Please select a preset destination.");
    } finally {
      setIsResearching(false);
      setResearchStage("");
    }
  };

  const displayName = destination?.name || activeSlug.charAt(0).toUpperCase() + activeSlug.slice(1);
  const categoriesList = ["All", ...Array.from(new Set(places.map((p) => p.category).filter(Boolean)))];

  const filteredPlaces = places.filter((p) => {
    if (selectedCategory === "All") return true;
    return p.category?.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-[#FAF4E8] text-[#20211D] pb-32">
      {/* 1. COMPACT EDITORIAL HEADER */}
      <section className="bg-[#173B32] text-[#EFE5D2] px-4 sm:px-6 lg:px-8 pt-8 pb-6 border-b-2 border-[#E5D5BA]/30 relative overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B49252]">
                SOLO SANCTUARY • एकल यात्रा
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-black text-[#FAF7F0] tracking-tight">
              Solo Travel: {displayName}
            </h1>
            <p className="text-xs text-[#D8DED5]/80 font-sans mt-0.5">
              Curated for solitude, safety, and spontaneous companionship.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <TravelStamp label={displayName.toUpperCase()} variant="terracotta" />
            <Link
              href={`/plan?dest=${activeSlug}`}
              className="px-4 py-2 rounded-xl bg-[#B65E3C] hover:bg-[#9F4F30] text-[#FAF4E8] text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#B49252]" />
              <span>Plan This Trip</span>
            </Link>
          </div>
        </div>

        {/* 2. TOP SEGMENTED TAB CONTROL */}
        <div className="max-w-6xl mx-auto mt-6">
          <VanvasTabBar<SoloTabType>
            tabs={[
              { id: "discover", label: "Discover", icon: Compass },
              { id: "travellers", label: "Travellers", icon: Users, count: travelers.length },
              { id: "circles", label: "Circles", icon: Flame, count: circles.length },
              { id: "safety_saved", label: "Safety", icon: ShieldCheck },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            layoutId="soloTabActivePill"
            variant="dark"
            className="max-w-xl"
          />
        </div>
      </section>

      {/* 3. MAIN CONTENT CONTAINER WITH ANIMATED TAB PANELS */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          {/* TAB 1: DISCOVER */}
          {activeTab === "discover" && (
            <motion.div
              key="tab-discover"
              variants={routeScreenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-8"
            >
              {/* Destination Selector & Shortcuts */}
              <div className="bg-[#EFE5D2] p-4.5 rounded-3xl border-2 border-[#E5D5BA] space-y-3">
                <form onSubmit={handleTriggerResearch} className="relative flex items-center">
                  <Search className="w-4 h-4 text-[#7B4D36] absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchInputValue}
                    onChange={handleSearchInput}
                    placeholder="Switch destination (e.g. Manali, Chopta, Hampi, Varkala, Goa)..."
                    className="w-full pl-10 pr-24 py-2.5 bg-[#FAF7F0] border border-[#E5D5BA] rounded-2xl text-xs font-semibold text-[#173B32] focus:outline-none focus:border-[#173B32]"
                  />
                  <button
                    type="submit"
                    disabled={isResearching || !searchInputValue.trim()}
                    className="absolute right-1.5 px-3 py-1.5 rounded-xl bg-[#B65E3C] hover:bg-[#9F4F30] text-[#FAF4E8] text-xs font-bold uppercase transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isResearching ? "..." : "Go"}
                  </button>
                </form>

                {/* Autocomplete Dropdown */}
                {searchResults.length > 0 && (
                  <div className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-2xl shadow-xl overflow-hidden divide-y divide-[#E5D5BA]">
                    {searchResults.map((res: any, idx: number) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectDestination(res.canonical_slug || res.slug || res.name, res.name)}
                        className="w-full px-4 py-2.5 text-left hover:bg-[#EFE5D2] flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span className="font-bold text-xs text-[#173B32]">{res.name}</span>
                        <span className="text-[10px] text-[#7B4D36]">{res.state || "India"}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {PRESET_DESTINATION_CHIPS.map((chip) => {
                    const isActive = activeSlug === chip.slug;
                    return (
                      <button
                        key={chip.slug}
                        onClick={() => handleSelectDestination(chip.slug, chip.name)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? "bg-[#173B32] text-[#EFE5D2] shadow-xs"
                            : "bg-[#FAF7F0] text-[#173B32] border border-[#E5D5BA] hover:bg-[#FAF4E8]"
                        }`}
                      >
                        {chip.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Travel Style Selection Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B65E3C]">
                      CURATED FILTERS
                    </span>
                    <h3 className="font-serif font-black text-xl text-[#173B32]">
                      Choose Your Travel Style
                    </h3>
                  </div>
                  <span className="text-xs text-[#7B4D36] font-mono">
                    {selectedStyles.length} active
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {TRAVEL_STYLES.map((st) => {
                    const isSelected = selectedStyles.includes(st.id);
                    const IconComp = st.icon;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => toggleTravelStyle(st.id)}
                        className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                          isSelected
                            ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-sm"
                            : "bg-[#FAF7F0] text-[#173B32] border-[#E5D5BA] hover:bg-[#EFE5D2]"
                        }`}
                      >
                        <IconComp className={`w-4 h-4 ${isSelected ? "text-[#B49252]" : "text-[#B65E3C]"}`} />
                        <div>
                          <span className="font-serif font-bold text-xs block leading-tight">
                            {st.label}
                          </span>
                          <span className={`text-[10px] block mt-0.5 ${isSelected ? "text-[#D8DED5]/70" : "text-[#7B4D36]"}`}>
                            {styleCounts[st.id] || places.length} spots
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Curated Places */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B65E3C]">
                      VERIFIED PLACES
                    </span>
                    <h3 className="font-serif font-black text-xl text-[#173B32]">
                      Places for Solitude & Connection in {displayName}
                    </h3>
                  </div>
                  <span className="text-xs text-[#7B4D36] font-mono">
                    Showing {Math.min(visiblePlacesCount, filteredPlaces.length)} of {filteredPlaces.length}
                  </span>
                </div>

                {loading ? (
                  <div className="py-16 text-center space-y-2">
                    <RefreshCw className="w-6 h-6 text-[#B49252] animate-spin mx-auto" />
                    <p className="text-xs text-[#7B4D36]">Loading places in {displayName}...</p>
                  </div>
                ) : filteredPlaces.length === 0 ? (
                  <div className="p-8 text-center bg-[#FAF7F0] rounded-3xl border border-[#E5D5BA]">
                    <Compass className="w-8 h-8 text-[#B49252] mx-auto mb-2" />
                    <p className="text-sm font-serif font-bold text-[#173B32]">No places match the active style filter.</p>
                    <p className="text-xs text-[#7B4D36] mt-1">Try selecting an additional travel style above.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPlaces.slice(0, visiblePlacesCount).map((p) => (
                      <PlaceCard
                        key={p.id}
                        place={p}
                        onSelect={() => setSelectedPlace(p)}
                      />
                    ))}
                  </div>
                )}

                {filteredPlaces.length > visiblePlacesCount && (
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setVisiblePlacesCount((prev) => prev + 12)}
                      className="px-6 py-2.5 rounded-xl bg-[#FAF7F0] hover:bg-[#EFE5D2] text-[#173B32] border-2 border-[#E5D5BA] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Show More Places (+12)
                    </button>
                  </div>
                )}
              </div>

              {/* Verified Solo Stays & Hostels */}
              {hotels.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-[#E5D5BA]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B65E3C]">
                        HOSTELS & BOUTIQUE STAYS
                      </span>
                      <h3 className="font-serif font-black text-xl text-[#173B32]">
                        Where to Stay Solo in {displayName}
                      </h3>
                    </div>
                    <span className="text-xs text-[#7B4D36] font-mono">
                      {hotels.length} verified stays
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {hotels.slice(0, 6).map((h) => (
                      <div
                        key={h.id}
                        onClick={() => setSelectedHotel(h)}
                        className="p-4 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] hover:border-[#173B32] transition-all cursor-pointer shadow-xs space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-[#173B32]/10 text-[#173B32]">
                            {h.property_type || "Boutique Stay"}
                          </span>
                          <span className="text-xs font-mono font-bold text-[#B49252]">
                            ★ {h.rating || "4.8"}
                          </span>
                        </div>
                        <h4 className="font-serif font-bold text-base text-[#173B32] group-hover:text-[#B65E3C] transition-colors leading-snug">
                          {h.name}
                        </h4>
                        <p className="text-xs text-[#7B4D36] line-clamp-2">
                          {h.address || h.hotel_style || "Verified boutique stay"}
                        </p>
                        <div className="pt-1 flex items-center justify-between text-xs font-bold text-[#173B32]">
                          <span>{h.price_per_night ? `₹${h.price_per_night.toLocaleString()} / night` : "Check tariff"}</span>
                          <span className="text-[#B65E3C] group-hover:translate-x-0.5 transition-transform">Details →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional Field Intelligence Drawer */}
              <div className="pt-4 border-t border-[#E5D5BA]">
                <button
                  type="button"
                  onClick={() => setShowAiAtmosphere(!showAiAtmosphere)}
                  className="w-full p-4 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] flex items-center justify-between cursor-pointer hover:bg-[#E5D5BA]/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#B49252]" />
                    <span className="text-xs font-bold text-[#173B32]">
                      {showAiAtmosphere ? "Hide Field Intelligence & Weather" : `View ${displayName} Solo Atmosphere & Weather Guide`}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-[#7B4D36]">
                    {showAiAtmosphere ? "Collapse ▲" : "Expand ▼"}
                  </span>
                </button>

                {showAiAtmosphere && intelligence && (
                  <div className="mt-4 p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] relative overflow-hidden space-y-4">
                    <SoloAtmosphere
                      atmosphereType={intelligence.atmosphere_type || "mountain"}
                      className="opacity-20"
                    />
                    <div className="relative z-10 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif font-bold text-base text-[#173B32]">
                          {intelligence.tagline || `${displayName} Solo Travel Field Note`}
                        </h4>
                        <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#173B32] text-[#FAF4E8] font-bold">
                          ★ {intelligence.solo_friendliness_score || 8.5}/10 Friendliness Score
                        </span>
                      </div>
                      {intelligence.weather_summary && (
                        <p className="text-xs text-[#7B4D36] font-medium leading-relaxed">
                          ⛅ <strong>Atmosphere & Weather:</strong> {intelligence.weather_summary}
                        </p>
                      )}
                      {intelligence.safe_areas && intelligence.safe_areas.length > 0 && (
                        <div className="text-xs text-[#20211D]">
                          <strong className="text-[#173B32]">Recommended Localities:</strong> {intelligence.safe_areas.join(" • ")}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: TRAVELLERS */}
          {activeTab === "travellers" && (
            <motion.div
              key="tab-travellers"
              variants={routeScreenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5D5BA] pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B65E3C]">
                    VERIFIED COMMUNITY
                  </span>
                  <h3 className="font-serif font-black text-2xl text-[#173B32]">
                    Solo Explorers in {displayName}
                  </h3>
                  <p className="text-xs text-[#7B4D36] mt-0.5">
                    Connect for cafe work, trail walks, or sunset views. Profiles protected by mutual consent.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-[#173B32] bg-[#EFE5D2] px-3 py-1 rounded-full border border-[#E5D5BA]">
                  {travelers.length} active travellers
                </span>
              </div>

              {travelers.length === 0 ? (
                <div className="p-12 text-center bg-[#FAF7F0] rounded-3xl border-2 border-[#E5D5BA] space-y-3">
                  <Users className="w-10 h-10 text-[#B49252] mx-auto" />
                  <h4 className="font-serif font-bold text-lg text-[#173B32]">
                    No other travellers registered for {displayName} this week.
                  </h4>
                  <p className="text-xs text-[#7B4D36] max-w-md mx-auto">
                    You can start a Travel Circle in the next tab to invite other wanderers when they arrive.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("circles")}
                    className="px-5 py-2.5 rounded-xl bg-[#173B32] text-[#FAF4E8] text-xs font-bold uppercase transition-colors"
                  >
                    Open Circles Tab
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {travelers.map((t) => (
                    <div
                      key={t.user_id}
                      className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] hover:border-[#173B32] transition-all shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar
                            user={{ full_name: t.full_name, avatar_url: t.avatar_url, avatar_type: t.avatar_type, avatar_preset: t.avatar_preset }}
                            size="md"
                            borderColor="border-[#B49252]"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-serif font-bold text-base text-[#173B32] leading-tight">
                                {t.full_name}
                              </h4>
                              {t.connection_status === "ACCEPTED" && (
                                <span title="Connected Traveller">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-[#7B4D36] uppercase font-bold">
                              {t.travel_style || "Solo Explorer"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {t.bio && (
                        <p className="text-xs text-[#20211D]/80 italic line-clamp-2">
                          &ldquo;{t.bio}&rdquo;
                        </p>
                      )}

                      <div className="pt-2 border-t border-[#E5D5BA]/60 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-[#7B4D36]">
                          {t.overlapping_days ? `${t.overlapping_days} overlapping days` : "In destination now"}
                        </span>
                        {t.connection_status === "ACCEPTED" ? (
                          <button
                            type="button"
                            onClick={() => {
                              setChatPartner(t);
                              setIsChatOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#173B32] text-[#FAF4E8] text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-[#B49252]" />
                            <span>Chat</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTraveler(t);
                              setIsTravelerModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-[#B65E3C] hover:bg-[#9F4F30] text-[#FAF4E8] text-xs font-bold cursor-pointer transition-colors"
                          >
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: CIRCLES */}
          {activeTab === "circles" && (
            <motion.div
              key="tab-circles"
              variants={routeScreenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5D5BA] pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B65E3C]">
                    SHARED ACTIVITIES
                  </span>
                  <h3 className="font-serif font-black text-2xl text-[#173B32]">
                    Travel Circles in {displayName}
                  </h3>
                  <p className="text-xs text-[#7B4D36] mt-0.5">
                    Spontaneous group hikes, sunrise walks, and dinner tables. Zero commitment.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateCircleOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#FAF4E8] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#B49252]" />
                  <span>Create Circle</span>
                </button>
              </div>

              {circles.length === 0 ? (
                <div className="p-12 text-center bg-[#FAF7F0] rounded-3xl border-2 border-[#E5D5BA] space-y-3">
                  <Flame className="w-10 h-10 text-[#B65E3C] mx-auto" />
                  <h4 className="font-serif font-bold text-lg text-[#173B32]">
                    No active circles in {displayName} yet.
                  </h4>
                  <p className="text-xs text-[#7B4D36] max-w-sm mx-auto">
                    Start a sunrise hike to a scenic viewpoint or a cafe co-working table and invite other solo travelers.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCreateCircleOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-[#B65E3C] hover:bg-[#9F4F30] text-[#FAF4E8] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Start First Circle
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {circles.map((c) => (
                    <div
                      key={c.id}
                      className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] hover:border-[#173B32] transition-all shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#173B32]/10 text-[#173B32] text-[10px] font-mono font-bold uppercase">
                          {c.activity_type}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#B49252]">
                          {c.members_count} / {c.max_members} Travelers
                        </span>
                      </div>

                      <div>
                        <h4 className="font-serif font-bold text-lg text-[#173B32]">
                          {c.name}
                        </h4>
                        <p className="text-xs text-[#7B4D36] flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-[#B65E3C] shrink-0" />
                          <span>Meetup: {c.meetup_point}</span>
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#E5D5BA]/60 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-[#7B4D36]">
                          {c.is_member ? "You are a member" : "Open to join"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCircleId(c.id);
                            setIsCircleModalOpen(true);
                          }}
                          className="px-4 py-2 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#FAF4E8] text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                        >
                          <span>{c.is_member ? "Open Chat" : "Join Circle"}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#B49252]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 4: SAFETY & SAVED */}
          {activeTab === "safety_saved" && (
            <motion.div
              key="tab-safety"
              variants={routeScreenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div className="border-b border-[#E5D5BA] pb-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B65E3C]">
                  FIELD PROTOCOLS & PRIVACY
                </span>
                <h3 className="font-serif font-black text-2xl text-[#173B32]">
                  Solo Safety & Ground Rules
                </h3>
                <p className="text-xs text-[#7B4D36] mt-0.5">
                  Verified emergency infrastructure and privacy settings for {displayName}.
                </p>
              </div>

              {/* Emergency Helplines Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] space-y-1">
                  <span className="text-[10px] font-mono font-bold text-[#B65E3C] uppercase">
                    WOMEN TRAVEL SAFETY
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-base text-[#173B32]">1091</span>
                    <a
                      href="tel:1091"
                      className="px-2.5 py-1 rounded-lg bg-[#173B32] text-white text-[11px] font-bold"
                    >
                      Call
                    </a>
                  </div>
                  <p className="text-[10px] text-[#7B4D36]">National 24/7 dedicated helpline</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] space-y-1">
                  <span className="text-[10px] font-mono font-bold text-[#B65E3C] uppercase">
                    ALL-INDIA EMERGENCY
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-base text-[#173B32]">112</span>
                    <a
                      href="tel:112"
                      className="px-2.5 py-1 rounded-lg bg-[#173B32] text-white text-[11px] font-bold"
                    >
                      Call
                    </a>
                  </div>
                  <p className="text-[10px] text-[#7B4D36]">Police, Fire, Ambulance unified</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] space-y-1">
                  <span className="text-[10px] font-mono font-bold text-[#B65E3C] uppercase">
                    MOUNTAIN & TOURIST RESCUE
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-base text-[#173B32]">1364</span>
                    <a
                      href="tel:1364"
                      className="px-2.5 py-1 rounded-lg bg-[#173B32] text-white text-[11px] font-bold"
                    >
                      Call
                    </a>
                  </div>
                  <p className="text-[10px] text-[#7B4D36]">Tourist Police & Trail Assistance</p>
                </div>
              </div>

              {/* Safety Checklist */}
              <div className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-3">
                <h4 className="font-serif font-bold text-base text-[#173B32] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Ground Rules for Traveling Solo</span>
                </h4>
                <ul className="space-y-2 text-xs text-[#20211D]/85">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-700 font-bold shrink-0">✓</span>
                    <span><strong>Share Live Location:</strong> Always share your location link with at least one trusted friend or family member before heading onto unpaved trails.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-700 font-bold shrink-0">✓</span>
                    <span><strong>Verified Hostels & Stays:</strong> Stays listed on VANVAS are pre-screened for 24/7 reception and lockable storage.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-700 font-bold shrink-0">✓</span>
                    <span><strong>Sunset Rule in Hills:</strong> Avoid walking back from remote waterfalls or viewpoints alone after dusk. Mountain temperatures drop rapidly.</span>
                  </li>
                </ul>
              </div>

              {/* Privacy Control */}
              <div className="p-5 rounded-3xl bg-[#EFE5D2] border border-[#E5D5BA] flex items-center justify-between">
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#173B32]">
                    Profile Visibility in {displayName}
                  </h4>
                  <p className="text-xs text-[#7B4D36] mt-0.5">
                    When enabled, verified travelers visiting {displayName} during your dates can discover you.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProfileVisible(!isProfileVisible)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isProfileVisible
                      ? "bg-[#173B32] text-[#FAF4E8]"
                      : "bg-[#FAF7F0] text-[#7B4D36] border border-[#E5D5BA]"
                  }`}
                >
                  {isProfileVisible ? "Visible" : "Incognito"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* MODALS */}
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
