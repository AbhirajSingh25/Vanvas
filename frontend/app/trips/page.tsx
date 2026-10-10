"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Calendar, Bookmark, Plus, MapPin, ArrowRight, Sparkles, Compass } from "lucide-react";
import { api } from "@/lib/api";
import { TripSummary, Place } from "@/types";
import { PlaceCard } from "@/components/places/PlaceCard";
import { PlaceModal } from "@/components/places/PlaceModal";
import { TravelStamp } from "@/components/ui/TravelStamp";
import { DevanagariHeading } from "@/components/ui/DevanagariHeading";
import { useDensity } from "@/context/DensityContext";
import { useAuth } from "@/context/AuthContext";
import { CompactTripCard, CompactPlaceCard } from "@/components/compact";
import { TripCardSkeleton, CardSkeleton } from "@/components/ui/ParchmentSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";

function TripsDashboardInner() {
  const { user, isLoading: authLoading } = useAuth();
  const { isCompact } = useDensity();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab");
  const [activeTab, setActiveTab] = useState<"trips" | "saved">(() => (tabParam === "saved" ? "saved" : "trips"));
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  const handleTabChange = (tabId: "trips" | "saved") => {
    setActiveTab(tabId);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tabId);
      window.history.replaceState({}, "", url.toString());
    }
  };

  const handleBookmarkToggle = (pId: string, isSaved: boolean) => {
    if (!isSaved) {
      setSavedPlaces((prev) => {
        const next = prev.filter((p) => p.id !== pId);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("vanvas_cached_saved_places", JSON.stringify(next));
          } catch {}
        }
        return next;
      });
    }
  };

  useEffect(() => {
    const currentTabParam = searchParams?.get("tab");
    if (currentTabParam === "saved" && activeTab !== "saved") {
      setActiveTab("saved");
    } else if (currentTabParam === "trips" && activeTab !== "trips") {
      setActiveTab("trips");
    }
  }, [searchParams]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Check for offline cached trips
      if (typeof window !== "undefined") {
        try {
          const cachedTrips = localStorage.getItem("vanvas_cached_trips");
          if (cachedTrips) {
            const parsed = JSON.parse(cachedTrips);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setTrips(parsed);
            }
          }
          const cachedSaved = localStorage.getItem("vanvas_cached_saved_places");
          if (cachedSaved) {
            const parsedSaved = JSON.parse(cachedSaved);
            if (Array.isArray(parsedSaved)) {
              setSavedPlaces(parsedSaved);
            }
          }
        } catch {}
      }
      setLoading(false);
      return;
    }

    Promise.all([api.getTrips(), api.getSavedPlaces()])
      .then(([tList, sList]) => {
        setTrips(tList);
        setSavedPlaces(sList);
        setIsOffline(false);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("vanvas_cached_trips", JSON.stringify(tList));
            localStorage.setItem("vanvas_cached_saved_places", JSON.stringify(sList));
          } catch {}
        }
      })
      .catch((err) => {
        console.warn("Failed to load online trips, checking offline fallback:", err);
        const isNetworkProblem =
          (typeof navigator !== "undefined" && !navigator.onLine) ||
          err?.isNetworkError ||
          err?.isTimeout ||
          err?.status === 0 ||
          err?.status === 504;

        if (isNetworkProblem) {
          setIsOffline(true);
        }

        if (typeof window !== "undefined") {
          try {
            let loadedFromCache = false;
            const cachedTrips = localStorage.getItem("vanvas_cached_trips");
            if (cachedTrips) {
              try {
                const parsed = JSON.parse(cachedTrips);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setTrips(parsed);
                  loadedFromCache = true;
                }
              } catch {}
            }

            if (!loadedFromCache) {
              // Reconstruct from any offline trip packs in storage
              const reconstructed: TripSummary[] = [];
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith("vanvas_offline_trip_") || key.startsWith("vanvas_trip_"))) {
                  const raw = localStorage.getItem(key);
                  if (raw) {
                    try {
                      const data = JSON.parse(raw);
                      const destName = data.destination || data.destination?.name || "Himalayan Sanctuary";
                      const destSlug = data.destination?.slug || destName.toLowerCase().replace(/\s+/g, "-");
                      reconstructed.push({
                        id: data.tripId || data.id,
                        title: data.title || "Saved Expedition",
                        destination_name: destName,
                        destination_slug: destSlug,
                        start_date: data.start_date || data.dates?.split(" to ")[0] || "",
                        end_date: data.end_date || data.dates?.split(" to ")[1] || "",
                        num_days: data.num_days || data.itineraries?.length || 3,
                        companion_type: data.companion_type || "Explorer",
                        travel_style: data.travel_style || "Spontaneous",
                        budget_total: data.budget_total || data.budget || 10000,
                        budget_spent: data.budget_spent || 0,
                        status: "offline_cached",
                        hero_image: data.hero_image,
                      });
                    } catch {}
                  }
                }
              }
              if (reconstructed.length > 0) {
                setTrips(reconstructed);
              }
            }

            const cachedSaved = localStorage.getItem("vanvas_cached_saved_places");
            if (cachedSaved) {
              try {
                const parsedSaved = JSON.parse(cachedSaved);
                if (Array.isArray(parsedSaved)) {
                  setSavedPlaces(parsedSaved);
                }
              } catch {}
            }
          } catch {}
        }
      })
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  return (
    <div className={`min-h-screen bg-[#EFE5D2] ${isCompact ? "py-6 sm:py-8" : "py-12"} px-4 sm:px-6 lg:px-8`}>
      <div className={`max-w-7xl mx-auto ${isCompact ? "space-y-6" : "space-y-10"}`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#E5D5BA]">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TravelStamp label="तुम्हारी यात्रा" sub="JOURNAL LOG" variant="terracotta" />
              <TravelStamp label="ACTIVE HUB" variant="forest" />
            </div>

            <DevanagariHeading
              hindi="रास्ते में फिर मिलेंगे"
              english="My Journeys & Saved Sanctuaries"
              subtitle={isCompact ? "Review spontaneous trips & bookmarked spots." : "Review your spontaneous trips, active trail itineraries, and bookmarked pine spots."}
              size="md"
            />
          </div>

          <Link
            href="/plan"
            className="px-5 py-2.5 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-[#B49252]" />
            <span>Plan New Journey</span>
          </Link>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-[#E5D5BA] pb-2">
          <button
            onClick={() => handleTabChange("trips")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "trips"
                ? "bg-[#173B32] text-[#EFE5D2] shadow-xs border border-[#173B32]"
                : "text-[#20211D]/75 hover:bg-[#E5D5BA]"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#B49252]" />
            <span>My Journeys ({trips.length})</span>
          </button>

          <button
            onClick={() => handleTabChange("saved")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "saved"
                ? "bg-[#173B32] text-[#EFE5D2] shadow-xs border border-[#173B32]"
                : "text-[#20211D]/75 hover:bg-[#E5D5BA]"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-[#B65E3C]" />
            <span>Saved Places ({savedPlaces.length})</span>
          </button>
        </div>

        {/* Content */}
        {loading ? (
          activeTab === "trips" ? (
            <div className={`grid ${isCompact ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"}`}>
              {[1, 2, 3].map((i) => (
                <TripCardSkeleton key={i} isCompact={isCompact} />
              ))}
            </div>
          ) : (
            <div className={`grid ${isCompact ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"}`}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <CardSkeleton key={i} variant={isCompact ? "compact" : "standard"} />
              ))}
            </div>
          )
        ) : activeTab === "trips" ? (
          trips.length === 0 ? (
            !user ? (
              <EmptyState
                icon={Calendar}
                stampText="सफ़रनामा • SIGN IN"
                hindiTitle="अपनी यात्रा देखने के लिए लॉगिन करें"
                title="Sign In to View Your Expeditions"
                description="Sign in with your traveler account to view active trip cockpits, saved sanctuaries, and synchronized offline itineraries."
                actionLabel="Sign In"
                actionHref="/login?redirect=/trips"
              />
            ) : (
              <EmptyState
                icon={Calendar}
                stampText="सफ़रनामा • EXPEDITIONS"
                hindiTitle="कोई यात्रा डायरी दर्ज नहीं है"
                title="No Expeditions Planned Yet"
                description="Start your first spontaneous or planned Himalayan expedition. Select an origin, duration, and companions to generate an adaptive itinerary."
                actionLabel="Plan My Trip"
                actionHref="/plan"
              />
            )
          ) : isCompact ? (
            /* COMPACT TRIPS GRID */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {trips.map((t) => (
                <CompactTripCard key={t.id} trip={t} />
              ))}
            </div>
          ) : (
            /* ORIGINAL TRIPS GRID */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((t) => (
                <Link
                  key={t.id}
                  href={`/trips/${t.id}`}
                  className="group bg-[#FAF7F0] rounded-3xl border-2 border-[#E5D5BA] hover:border-[#173B32] overflow-hidden shadow-xs hover:shadow-xl interactive-card touch-press flex flex-col justify-between"
                >
                  <div className="relative h-48 w-full bg-[#173B32] overflow-hidden">
                    {t.hero_image && (
                      <img
                        src={t.hero_image}
                        alt={t.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F2924] via-[#0F2924]/40 to-black/20" />

                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-md bg-[#173B32]/90 text-[#EFE5D2] text-[10px] font-bold uppercase tracking-wider border border-[#536B52]">
                      {t.status}
                    </span>

                    <div className="absolute bottom-3 left-3 right-3 text-[#EFE5D2]">
                      <h3 className="font-serif font-black text-xl leading-snug">{t.title}</h3>
                      <p className="text-xs text-[#D8DED5] font-mono mt-0.5">{t.start_date} → {t.end_date}</p>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between text-xs text-[#7B4D36]">
                      <span>{t.num_days} Days • {t.companion_type}</span>
                      <span className="font-bold text-[#173B32] font-mono">₹{t.budget_total.toLocaleString()} Budget</span>
                    </div>

                    <div className="pt-3 border-t border-[#E5D5BA] flex items-center justify-between text-xs font-bold text-[#B65E3C]">
                      <span className="uppercase tracking-wider">Open Operating Hub</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : savedPlaces.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            stampText="पसंदीदा • SAVED GEMS"
            hindiTitle="कोई पसंदीदा स्थान सहेजा नहीं गया है"
            title="No Saved Gems Yet"
            description="Bookmark riverside cafés, dhabas, trails, and quiet mountain viewpoints while exploring destinations to access them quickly here."
            actionLabel="Explore Sanctuaries"
            actionHref="/explore"
          />
        ) : isCompact ? (
          /* COMPACT SAVED PLACES */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {savedPlaces.map((place) => (
              <CompactPlaceCard
                key={place.id}
                place={place}
                onSelect={(p) => {
                  setSelectedPlace(p);
                  setModalOpen(true);
                }}
                onBookmarkChange={handleBookmarkToggle}
              />
            ))}
          </div>
        ) : (
          /* ORIGINAL SAVED PLACES */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedPlaces.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                onSelect={(p) => {
                  setSelectedPlace(p);
                  setModalOpen(true);
                }}
                onBookmarkChange={handleBookmarkToggle}
              />
            ))}
          </div>
        )}
      </div>

      <PlaceModal
        place={selectedPlace}
        destinationName={selectedPlace?.name ? "Travel Sanctuary" : ""}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onBookmarkChange={handleBookmarkToggle}
      />
    </div>
  );
}

export default function TripsDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#EFE5D2] py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-[#173B32] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <TripsDashboardInner />
    </Suspense>
  );
}
