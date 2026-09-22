"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Bookmark, Plus, MapPin, ArrowRight, Sparkles, Compass } from "lucide-react";
import { api } from "@/lib/api";
import { TripSummary, Place } from "@/types";
import { PlaceCard } from "@/components/places/PlaceCard";
import { PlaceModal } from "@/components/places/PlaceModal";
import { TravelStamp } from "@/components/ui/TravelStamp";
import { DevanagariHeading } from "@/components/ui/DevanagariHeading";

export default function TripsDashboardPage() {
  const [activeTab, setActiveTab] = useState<"trips" | "saved">("trips");
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getTrips(), api.getSavedPlaces()])
      .then(([tList, sList]) => {
        setTrips(tList);
        setSavedPlaces(sList);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#EFE5D2] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-[#E5D5BA]">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TravelStamp label="तुम्हारी यात्रा" sub="JOURNAL LOG" variant="terracotta" />
              <TravelStamp label="ACTIVE HUB" variant="forest" />
            </div>

            <DevanagariHeading
              hindi="रास्ते में फिर मिलेंगे"
              english="My Journeys & Saved Sanctuaries"
              subtitle="Review your spontaneous trips, active trail itineraries, and bookmarked pine spots."
              size="md"
            />
          </div>

          <Link
            href="/plan"
            className="px-6 py-3.5 rounded-2xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] text-xs font-bold uppercase tracking-wider shadow-lg hover:shadow-xl transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-[#B49252]" />
            <span>Plan New Journey</span>
          </Link>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-3 border-b border-[#E5D5BA] pb-3">
          <button
            onClick={() => setActiveTab("trips")}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "trips"
                ? "bg-[#173B32] text-[#EFE5D2] shadow-sm border border-[#173B32]"
                : "text-[#20211D]/75 hover:bg-[#E5D5BA]"
            }`}
          >
            <Calendar className="w-4 h-4 text-[#B49252]" />
            <span>My Journeys ({trips.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("saved")}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "saved"
                ? "bg-[#173B32] text-[#EFE5D2] shadow-sm border border-[#173B32]"
                : "text-[#20211D]/75 hover:bg-[#E5D5BA]"
            }`}
          >
            <Bookmark className="w-4 h-4 text-[#B65E3C]" />
            <span>Saved Places ({savedPlaces.length})</span>
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-[#173B32] gap-3">
            <div className="w-10 h-10 border-3 border-[#B65E3C] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-serif italic text-[#7B4D36]">Loading travel journal entries...</span>
          </div>
        ) : activeTab === "trips" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((t) => (
              <Link
                key={t.id}
                href={`/trips/${t.id}`}
                className="group bg-[#FAF7F0] rounded-3xl border-2 border-[#E5D5BA] hover:border-[#173B32] overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedPlaces.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                onSelect={(p) => {
                  setSelectedPlace(p);
                  setModalOpen(true);
                }}
                onBookmarkChange={(pId, isSaved) => {
                  if (!isSaved) setSavedPlaces((prev) => prev.filter((p) => p.id !== pId));
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
