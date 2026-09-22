"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MapPin, Utensils, Coffee, Compass, Bike, Fuel, Cross,
  Building2, ShoppingBag, ShieldAlert, ArrowUpDown, Star, Clock, Sparkles,
  Search, Navigation, RefreshCw, AlertCircle, CheckCircle2, SlidersHorizontal,
  Landmark, Trees, BedDouble, ChevronDown, X
} from "lucide-react";
import { api } from "@/lib/api";
import { Place } from "@/types";
import { PlaceCard } from "@/components/places/PlaceCard";
import { PlaceModal } from "@/components/places/PlaceModal";
import { TravelStamp } from "@/components/ui/TravelStamp";
import { DevanagariHeading } from "@/components/ui/DevanagariHeading";

type LocationStatus = "idle" | "locating" | "located" | "denied" | "error" | "unsupported";

interface SearchCenter {
  name: string;
  hindi?: string;
  lat: number;
  lng: number;
  isGps?: boolean;
}

const PRESET_HUBS: SearchCenter[] = [
  { name: "Manali (Mall Road)", hindi: "मनाली मॉल रोड", lat: 32.2396, lng: 77.1887 },
  { name: "Connaught Place, Delhi", hindi: "कनॉट प्लेस दिल्ली", lat: 28.6315, lng: 77.2167 },
  { name: "Old Manali (Bridge)", hindi: "ओल्ड मनाली पुल", lat: 32.2532, lng: 77.1750 },
  { name: "Rishikesh (Lakshman Jhula)", hindi: "ऋषिकेश लक्ष्मण झूला", lat: 30.1280, lng: 78.3270 },
  { name: "Kasol (Parvati Valley)", hindi: "कसोल बाज़ार", lat: 32.0100, lng: 77.3150 },
  { name: "Leh (Main Bazaar)", hindi: "लेह मुख्य बाज़ार", lat: 34.1642, lng: 77.5848 },
  { name: "Dharamshala (McLeod Ganj)", hindi: "मैकलोडगंज चौक", lat: 32.2426, lng: 76.3213 },
  { name: "Udaipur (Lake Pichola)", hindi: "उदयपुर पिछोला", lat: 24.5854, lng: 73.7125 },
  { name: "Jaipur (Old City)", hindi: "जयपुर परकोटा", lat: 26.9124, lng: 75.7873 },
  { name: "Varanasi (Dashashwamedh Ghat)", hindi: "दशाश्वमेध घाट", lat: 25.3076, lng: 83.0104 },
  { name: "Goa (Anjuna Headland)", hindi: "अंजुना तट", lat: 15.5833, lng: 73.7439 },
  { name: "Dehradun (Clock Tower)", hindi: "देहरादून घंटाघर", lat: 30.3256, lng: 78.0437 },
];

const CATEGORIES = [
  { id: "all", label: "All Nearby", hindi: "सभी", icon: MapPin },
  { id: "food", label: "Food & Dining", hindi: "भोजन", icon: Utensils },
  { id: "coffee", label: "Cafés & Coffee", hindi: "कॉफ़ी", icon: Coffee },
  { id: "attractions", label: "Attractions", hindi: "आकर्षण", icon: Compass },
  { id: "spiritual", label: "Temples & Faith", hindi: "मंदिर व तीर्थ", icon: Landmark },
  { id: "nature", label: "Nature & Trails", hindi: "प्रकृति", icon: Trees },
  { id: "shopping", label: "Shopping & Crafts", hindi: "बाज़ार", icon: ShoppingBag },
  { id: "mobility", label: "Bikes & Rentals", hindi: "वाहन/किराया", icon: Bike },
  { id: "stay", label: "Stays & Hostels", hindi: "ठहरने के स्थान", icon: BedDouble },
  { id: "essentials", label: "Essentials & Medical", hindi: "ज़रूरी सेवाएँ", icon: ShieldAlert },
];

const RADII = [
  { value: 1, label: "1 km" },
  { value: 3, label: "3 km" },
  { value: 5, label: "5 km" },
  { value: 10, label: "10 km" },
  { value: 25, label: "25 km" },
];

export default function NearbyPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [category, setCategory] = useState<string>("all");
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [sortBy, setSortBy] = useState<string>("distance");
  const [searchCenter, setSearchCenter] = useState<SearchCenter>(PRESET_HUBS[0]);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [locationError, setLocationError] = useState<string>("");
  
  // Manual location search state
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ name: string; display_name: string; lat: number; lng: number }>>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Modal & Loading state
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Browser Geolocation
  const requestCurrentLocation = useCallback(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setLocationStatus("unsupported");
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setLocationStatus("locating");
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracyM = Math.round(pos.coords.accuracy);
        
        setLocationStatus("located");
        setSortBy("distance");
        setSearchCenter({
          name: `Current Location (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`,
          hindi: `सटीकता ±${accuracyM}m`,
          lat,
          lng,
          isGps: true,
        });
      },
      (err) => {
        console.warn("Geolocation error code:", err.code, err.message);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationStatus("denied");
          setLocationError("Location permission is off. Please choose an expedition base or type a location manually.");
        } else if (err.code === err.TIMEOUT) {
          setLocationStatus("error");
          setLocationError("GPS location request timed out. Please select or search your location.");
        } else {
          setLocationStatus("error");
          setLocationError("Unable to determine GPS location. Using manual search center.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  // Fetch Nearby Places
  const loadNearby = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const data = await api.getNearbyPlaces(
        searchCenter.lat,
        searchCenter.lng,
        radiusKm,
        category === "all" ? undefined : category,
        sortBy
      );
      setPlaces(data || []);
    } catch (err: any) {
      console.error("Failed to load nearby places:", err);
      setPlaces([]);
      setApiError(err?.message || "Live place data is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }, [searchCenter, radiusKm, category, sortBy]);

  useEffect(() => {
    loadNearby();
  }, [loadNearby]);

  // Autocomplete debounced lookup
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const list = await api.searchLocationAutocomplete(searchQuery.trim());
        setSuggestions(list);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSuggestion = (sug: { name: string; display_name: string; lat: number; lng: number }) => {
    setSearchCenter({
      name: sug.name,
      hindi: sug.display_name.split(",")[0],
      lat: sug.lat,
      lng: sug.lng,
      isGps: false,
    });
    setSearchQuery("");
    setShowSuggestions(false);
    setLocationStatus("idle");
  };

  const handleManualSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearchingLocation(true);
    try {
      const resolved = await api.geocodeLocation(searchQuery.trim());
      if (resolved) {
        setSearchCenter({
          name: resolved.name,
          hindi: resolved.display_name?.split(",")[0],
          lat: resolved.lat,
          lng: resolved.lng,
          isGps: false,
        });
        setSearchQuery("");
        setShowSuggestions(false);
        setLocationStatus("idle");
      } else {
        alert(`Could not find coordinates for "${searchQuery}". Please check the spelling or select a suggested base.`);
      }
    } catch {
      alert(`Location lookup failed for "${searchQuery}".`);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EFE5D2] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Strip */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#E5D5BA]">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TravelStamp label="आस-पास क्या है?" sub="NEARBY DISCOVERY" variant="terracotta" />
              <TravelStamp label={searchCenter.isGps ? "LIVE GPS" : "LOCATION AWARE"} variant="forest" />
            </div>

            <DevanagariHeading
              hindi="आस-पास क्या है?"
              english="Live Nearby Places & Essentials"
              subtitle="Location-aware discovery combining verified OpenStreetMap and Google Places coordinates with VANVAS travel intelligence."
              size="md"
            />
          </div>

          {/* Location Action Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={requestCurrentLocation}
              disabled={locationStatus === "locating"}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer ${
                searchCenter.isGps
                  ? "bg-[#173B32] text-[#EFE5D2] border border-[#536B52]"
                  : "bg-[#FAF7F0] hover:bg-[#E5D5BA] text-[#173B32] border border-[#E5D5BA]"
              }`}
            >
              <Navigation className={`w-4 h-4 ${locationStatus === "locating" ? "animate-spin text-[#B49252]" : "text-[#B65E3C]"}`} />
              <span>{locationStatus === "locating" ? "Locating You..." : searchCenter.isGps ? "Using My GPS" : "Use My Current GPS"}</span>
            </button>

            <button
              onClick={loadNearby}
              className="p-2.5 rounded-xl bg-[#FAF7F0] hover:bg-[#E5D5BA] text-[#173B32] border border-[#E5D5BA] shadow-2xs transition-all cursor-pointer"
              title="Refresh Nearby Search"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#B65E3C]" : "text-[#173B32]"}`} />
            </button>
          </div>
        </div>

        {/* Location & Search Controls Card */}
        <div className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-xs space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            
            {/* Manual Location Search Input */}
            <div className="lg:col-span-5 relative">
              <form onSubmit={handleManualSearchSubmit} className="relative flex items-center">
                <Search className="w-4 h-4 text-[#7B4D36] absolute left-3.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Enter any city or place (e.g. Connaught Place Delhi, Mall Road Manali)..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full pl-10 pr-20 py-2.5 bg-[#EFE5D2] border border-[#E5D5BA] rounded-2xl text-xs font-semibold text-[#173B32] placeholder:text-[#7B4D36]/60 focus:outline-none focus:border-[#173B32] focus:ring-1 focus:ring-[#173B32]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSuggestions([]);
                    }}
                    className="absolute right-12 text-[#7B4D36] hover:text-[#173B32] p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSearchingLocation || !searchQuery.trim()}
                  className="absolute right-1.5 px-2.5 py-1.5 bg-[#173B32] text-[#FAF4E8] rounded-xl text-[11px] font-bold hover:bg-[#20453B] transition-colors cursor-pointer"
                >
                  {isSearchingLocation ? "..." : "Go"}
                </button>
              </form>

              {/* Autocomplete Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-2xl shadow-xl z-30 overflow-hidden divide-y divide-[#E5D5BA]">
                  {suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSuggestion(sug)}
                      className="w-full px-4 py-2.5 text-left text-xs hover:bg-[#EFE5D2] flex items-center justify-between text-[#173B32] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#B65E3C] shrink-0" />
                        <span className="font-bold">{sug.name}</span>
                        <span className="text-[11px] text-[#7B4D36] font-normal">{sug.display_name}</span>
                      </div>
                      <span className="text-[10px] text-[#536B52] font-mono">
                        {sug.lat.toFixed(2)}°, {sug.lng.toFixed(2)}°
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Expedition Base Dropdown */}
            <div className="lg:col-span-3 space-y-1">
              <label className="text-[10px] font-bold text-[#7B4D36] uppercase tracking-wider block">
                Quick Base:
              </label>
              <select
                value={searchCenter.name}
                onChange={(e) => {
                  const found = PRESET_HUBS.find((h) => h.name === e.target.value);
                  if (found) {
                    setSearchCenter(found);
                    setLocationStatus("idle");
                  }
                }}
                className="w-full px-3 py-2 bg-[#EFE5D2] border border-[#E5D5BA] rounded-xl text-xs font-bold text-[#173B32] focus:outline-none focus:border-[#173B32]"
              >
                {searchCenter.isGps && (
                  <option value={searchCenter.name}>📍 {searchCenter.name}</option>
                )}
                {PRESET_HUBS.map((h) => (
                  <option key={h.name} value={h.name}>
                    {h.name} ({h.hindi})
                  </option>
                ))}
              </select>
            </div>

            {/* Radius Selector */}
            <div className="lg:col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-[#7B4D36] uppercase tracking-wider block">
                Search Radius:
              </label>
              <div className="flex items-center gap-1 bg-[#EFE5D2] p-1 rounded-xl border border-[#E5D5BA]">
                {RADII.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRadiusKm(r.value)}
                    className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      radiusKm === r.value
                        ? "bg-[#173B32] text-[#EFE5D2] shadow-2xs"
                        : "text-[#173B32]/70 hover:bg-[#E5D5BA]"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="lg:col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-[#7B4D36] uppercase tracking-wider block">
                Sort By:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-[#EFE5D2] border border-[#E5D5BA] rounded-xl text-xs font-semibold text-[#173B32] focus:outline-none"
              >
                <option value="distance">Nearest Distance</option>
                <option value="recommended">Recommended</option>
                <option value="rating">Highest Rating</option>
                <option value="price">Lowest Cost</option>
              </select>
            </div>

          </div>

          {/* Active Center Info Strip & Geolocation State Notice */}
          <div className="pt-3 border-t border-[#E5D5BA] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-[#173B32]">
              <MapPin className="w-3.5 h-3.5 text-[#B65E3C]" />
              <span className="font-bold">Search Center:</span>
              <span className="font-serif italic text-[#7B4D36]">{searchCenter.name}</span>
              <span className="text-[10px] text-[#536B52] font-mono">
                ({searchCenter.lat.toFixed(4)}° N, {searchCenter.lng.toFixed(4)}° E)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E5D5BA] text-[#173B32] font-bold">
                Radius {radiusKm} km
              </span>
            </div>

            {locationStatus === "denied" && (
              <div className="text-amber-800 text-xs flex items-center gap-1 font-medium bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-300">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{locationError}</span>
              </div>
            )}

            {locationStatus === "located" && searchCenter.isGps && (
              <div className="text-emerald-800 text-xs flex items-center gap-1 font-medium bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>GPS Location Active</span>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#173B32] text-[#EFE5D2] shadow-xs border-2 border-[#173B32]"
                    : "bg-[#FAF7F0] text-[#20211D]/80 border-2 border-[#E5D5BA] hover:bg-[#E5D5BA]"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#B49252]" : "text-[#B65E3C]"}`} />
                <span>{cat.label}</span>
                <span className={`text-[10px] ${isActive ? "text-[#B49252]" : "text-[#7B4D36]"}`}>
                  ({cat.hindi})
                </span>
              </button>
            );
          })}
        </div>

        {/* Results Stream */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-[#173B32] gap-3">
            <div className="w-10 h-10 border-3 border-[#B65E3C] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-serif italic text-[#7B4D36]">
              Querying OpenStreetMap and live local places around {searchCenter.name}...
            </span>
          </div>
        ) : apiError ? (
          <div className="py-16 px-6 text-center rounded-3xl bg-[#FAF7F0] border-2 border-red-200 space-y-4 max-w-xl mx-auto">
            <AlertCircle className="w-12 h-12 text-amber-700 mx-auto opacity-80" />
            <div className="space-y-1">
              <h3 className="text-lg font-serif font-black text-[#173B32]">
                Live place data is temporarily unavailable
              </h3>
              <p className="text-xs text-[#7B4D36] font-light leading-relaxed">
                We encountered an issue querying live OpenStreetMap servers. Please retry or adjust your search radius.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                onClick={loadNearby}
                className="px-4 py-2 rounded-xl bg-[#173B32] text-[#FAF4E8] text-xs font-bold hover:bg-[#20453B] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Search</span>
              </button>
              <button
                onClick={() => setRadiusKm(10)}
                className="px-4 py-2 rounded-xl bg-[#FAF7F0] text-[#173B32] border border-[#E5D5BA] text-xs font-bold hover:bg-[#E5D5BA] transition-all cursor-pointer"
              >
                Try 10 km Radius
              </button>
            </div>
          </div>
        ) : places.length === 0 ? (
          <div className="py-16 px-6 text-center rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-4 max-w-xl mx-auto">
            <Compass className="w-12 h-12 text-[#B65E3C] mx-auto opacity-70" />
            <div className="space-y-1">
              <h3 className="text-lg font-serif font-black text-[#173B32]">
                No verified places found within {radiusKm} km
              </h3>
              <p className="text-xs text-[#7B4D36] font-light leading-relaxed">
                We did not find verified {category !== "all" ? category : "live"} places in this immediate perimeter.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setRadiusKm(25)}
                className="px-4 py-2 rounded-xl bg-[#173B32] text-[#FAF4E8] text-xs font-bold hover:bg-[#20453B] transition-all cursor-pointer"
              >
                Expand Radius to 25 km
              </button>
              {category !== "all" && (
                <button
                  onClick={() => setCategory("all")}
                  className="px-4 py-2 rounded-xl bg-[#FAF7F0] text-[#173B32] border border-[#E5D5BA] text-xs font-bold hover:bg-[#E5D5BA] transition-all cursor-pointer"
                >
                  Show All Categories
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-[#7B4D36]">
              <span>
                Showing <strong className="text-[#173B32]">{places.length}</strong> location-aware landmarks & venues
              </span>
              <span className="font-mono text-[11px] text-[#536B52]">
                Sorted by {sortBy.replace("_", " ")}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {places.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  destinationName={searchCenter.name}
                  onSelect={(p) => {
                    setSelectedPlace(p);
                    setModalOpen(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reusable Unified PlaceModal */}
      <PlaceModal
        place={selectedPlace}
        destinationName={searchCenter.name}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

