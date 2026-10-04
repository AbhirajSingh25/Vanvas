"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Compass, Calendar, WifiOff, ArrowRight, ShieldCheck, MapPin, BedDouble, Bus } from "lucide-react";

interface SavedOfflineTrip {
  tripId: string;
  title: string;
  destination?: string;
  dates?: string;
  savedAt?: string;
  hotel?: any;
  transport?: any;
  itineraries?: any[];
}

export default function OfflinePage() {
  const [savedTrips, setSavedTrips] = useState<SavedOfflineTrip[]>([]);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    // Read locally saved offline trips from localStorage
    try {
      const trips: SavedOfflineTrip[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("vanvas_offline_trip_") || key.startsWith("vanvas_trip_"))) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const data = JSON.parse(raw);
              if (data.tripId || data.id) {
                trips.push({
                  tripId: data.tripId || data.id,
                  title: data.title || "Saved Trip",
                  destination: data.destination || data.destination?.name,
                  dates: data.dates || `${data.start_date || ""} to ${data.end_date || ""}`,
                  savedAt: data.savedAt,
                  hotel: data.hotel,
                  transport: data.transport,
                  itineraries: data.itineraries,
                });
              }
            } catch {}
          }
        }
      }
      setSavedTrips(trips);
    } catch {}

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12 text-[#20211D]">
      <div className="w-full max-w-xl mx-auto space-y-6">
        {/* Offline Badge & Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#173B32]/10 border border-[#173B32]/20 text-[#173B32] text-xs font-mono font-bold tracking-widest uppercase">
            <WifiOff className="w-3.5 h-3.5 text-[#B65E3C]" />
            <span>OFFLINE · EXPLORER JOURNAL MODE</span>
          </div>

          <h1 className="font-serif font-black text-2xl sm:text-3xl text-[#173B32]">
            Showing Saved Trip Information
          </h1>

          <p className="text-xs sm:text-sm text-[#7B4D36] max-w-md mx-auto leading-relaxed">
            You are currently offline. Your saved itineraries, offline trip packs, and basecamp references remain accessible on this device.
          </p>
        </div>

        {/* Saved Offline Trips List */}
        <div className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#B65E3C]" />
              <span className="font-serif font-bold text-sm text-[#173B32]">
                Locally Saved Trips ({savedTrips.length})
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase text-[#7B4D36]">Offline Storage</span>
          </div>

          {savedTrips.length > 0 ? (
            <div className="space-y-3">
              {savedTrips.map((t) => (
                <Link
                  key={t.tripId}
                  href={`/trips/${t.tripId}`}
                  className="block p-4 rounded-2xl bg-white border border-[#E5D5BA] hover:border-[#173B32] transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-base text-[#173B32] group-hover:text-[#B65E3C] transition-colors">
                        {t.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-[#7B4D36] mt-1 font-mono">
                        {t.destination && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#B65E3C]" />
                            {t.destination}
                          </span>
                        )}
                        {t.dates && <span>{t.dates}</span>}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#173B32] group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center space-y-2 bg-white rounded-2xl border border-dashed border-[#E5D5BA]">
              <p className="text-xs text-[#7B4D36]">
                No offline trips cached on this device yet.
              </p>
              <p className="text-[11px] text-[#20211D]/60">
                When online, open any trip or tap "Offline Pack" to save it for mountain journeys without signal.
              </p>
            </div>
          )}
        </div>

        {/* Live Features Note */}
        <div className="p-4 rounded-2xl bg-[#EFE5D2]/60 border border-[#E5D5BA] text-xs text-[#7B4D36] space-y-1">
          <div className="font-bold text-[#173B32] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Honest Offline Operation</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Live weather, real-time transport inventory, and Ask VANVAS AI copilot queries will automatically refresh once your internet connection is restored.
          </p>
        </div>

        {/* Navigation Affordances */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/trips"
            className="px-4 py-2.5 rounded-xl bg-[#173B32] text-[#EFE5D2] text-xs font-mono font-bold hover:bg-[#20453B] transition-colors inline-flex items-center gap-2"
          >
            <Calendar className="w-3.5 h-3.5 text-[#B49252]" />
            <span>All Trips</span>
          </Link>
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl bg-white border border-[#E5D5BA] text-[#173B32] text-xs font-mono font-bold hover:bg-[#EFE5D2] transition-colors inline-flex items-center gap-2"
          >
            <Compass className="w-3.5 h-3.5 text-[#B65E3C]" />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
