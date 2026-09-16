"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin, Utensils, Coffee, Compass, Bike, Fuel, Cross,
  Building2, ShoppingBag, ShieldAlert, ArrowUpDown, Star, Clock, Sparkles
} from "lucide-react";
import { api } from "@/lib/api";
import { Place } from "@/types";
import { PlaceCard } from "@/components/places/PlaceCard";
import { PlaceModal } from "@/components/places/PlaceModal";
import { TravelStamp } from "@/components/ui/TravelStamp";
import { DevanagariHeading } from "@/components/ui/DevanagariHeading";

export default function NearbyPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [category, setCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recommended");
  const [selectedHub, setSelectedHub] = useState<{ name: string; hindi: string; lat: number; lng: number }>({
    name: "Manali (Mall Road Hub)",
    hindi: "मनाली मॉल रोड",
    lat: 32.2396,
    lng: 77.1887,
  });
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const hubs = [
    { name: "Manali (Mall Road Hub)", hindi: "मनाली मॉल रोड", lat: 32.2396, lng: 77.1887 },
    { name: "Old Manali (Bridge)", hindi: "ओल्ड मनाली पुल", lat: 32.2532, lng: 77.1750 },
    { name: "Rishikesh (Lakshman Jhula)", hindi: "ऋषिकेश लक्ष्मण झूला", lat: 30.1280, lng: 78.3270 },
    { name: "Kasol (Main Market)", hindi: "कसोल बाज़ार", lat: 32.0100, lng: 77.3150 },
    { name: "Dharamshala (Square)", hindi: "धर्मशाला चौक", lat: 32.2190, lng: 76.3234 },
    { name: "Jaipur (Old City)", hindi: "जयपुर परकोटा", lat: 26.9124, lng: 75.7873 },
    { name: "Udaipur (Lake Pichola)", hindi: "उदयपुर पिछोला", lat: 24.5854, lng: 73.7125 },
    { name: "Indore (Rajwada)", hindi: "इंदौर राजवाड़ा", lat: 22.7196, lng: 75.8577 },
  ];

  const categories = [
    { id: "all", label: "All Nearby", hindi: "सभी", icon: MapPin },
    { id: "food", label: "Food", hindi: "भोजन", icon: Utensils },
    { id: "coffee", label: "Coffee", hindi: "कॉफ़ी", icon: Coffee },
    { id: "attractions", label: "Attractions", hindi: "आकर्षण", icon: Compass },
    { id: "shopping", label: "Shopping", hindi: "बाज़ार", icon: ShoppingBag },
    { id: "mobility", label: "Mobility", hindi: "वाहन/किराया", icon: Bike },
    { id: "essentials", label: "Essentials", hindi: "ज़रूरी सेवाएँ", icon: ShieldAlert },
  ];

  const handleUseCurrentLocation = () => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setSelectedHub({
            name: `My GPS Location (${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)})`,
            hindi: "वर्तमान स्थान",
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.warn("Geolocation denied or error:", err);
          alert("Location access was denied or unavailable. Using selected expedition base.");
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const loadNearby = async () => {
    setLoading(true);
    try {
      const data = await api.getNearbyPlaces(
        selectedHub.lat,
        selectedHub.lng,
        15,
        category === "all" ? undefined : category,
        sortBy
      );
      setPlaces(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNearby();
  }, [category, sortBy, selectedHub]);

  return (
    <div className="min-h-screen bg-[#EFE5D2] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#E5D5BA]">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TravelStamp label="आस-पास क्या है?" sub="NEARBY DISCOVERY" variant="terracotta" />
              <TravelStamp label="LIVE & CURATED" variant="forest" />
            </div>

            <DevanagariHeading
              hindi="आस-पास क्या है?"
              english="Live Nearby Places & Essentials"
              subtitle="Location-aware discovery combining verified OpenStreetMap/Google Places coordinates with VANVAS judgment."
              size="md"
            />
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F0] border-2 border-[#E5D5BA] flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-xs">
            {/* GPS Trigger */}
            <button
              onClick={handleUseCurrentLocation}
              className="px-3.5 py-2 rounded-xl bg-[#173B32] hover:bg-[#0F2924] text-[#EFE5D2] text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
            >
              <MapPin className="w-3.5 h-3.5 text-[#B49252]" />
              <span>Use My GPS</span>
            </button>

            {/* Hub Dropdown */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#7B4D36] uppercase tracking-wider block">
                Expedition Base:
              </span>
              <select
                value={selectedHub.name}
                onChange={(e) => {
                  const found = hubs.find((h) => h.name === e.target.value);
                  if (found) setSelectedHub(found);
                }}
                className="px-3 py-2 bg-[#EFE5D2] border border-[#E5D5BA] rounded-xl text-xs font-bold text-[#173B32] focus:outline-none focus:border-[#173B32]"
              >
                {hubs.map((h) => (
                  <option key={h.name} value={h.name}>
                    {h.name} ({h.hindi})
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Control */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#7B4D36] uppercase tracking-wider block">
                Sort By:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-[#EFE5D2] border border-[#E5D5BA] rounded-xl text-xs font-semibold text-[#173B32] focus:outline-none"
              >
                <option value="recommended">Recommended</option>
                <option value="distance">Nearest Distance</option>
                <option value="rating">Highest Rating</option>
                <option value="price">Lowest Cost</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
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

        {/* Places Grid */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-[#173B32] gap-3">
            <div className="w-10 h-10 border-3 border-[#B65E3C] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-serif italic text-[#7B4D36]">Locating nearby pine cafés and trails...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {places.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                onSelect={(p) => {
                  setSelectedPlace(p);
                  setModalOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <PlaceModal
        place={selectedPlace}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
