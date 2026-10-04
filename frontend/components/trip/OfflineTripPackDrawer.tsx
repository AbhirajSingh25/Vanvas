"use client";

import React, { useState, useEffect } from "react";
import {
  X, Download, Printer, CheckCircle2, ShieldCheck, MapPin,
  Clock, Phone, Bus, BedDouble, CheckSquare, Sparkles, Share2
} from "lucide-react";
import { Trip, ChecklistItem } from "@/types";

interface OfflineTripPackDrawerProps {
  trip: Trip;
  checklist?: ChecklistItem[];
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineTripPackDrawer: React.FC<OfflineTripPackDrawerProps> = ({
  trip,
  checklist = [],
  isOpen,
  onClose,
}) => {
  const [offlineSaved, setOfflineSaved] = useState(false);

  useEffect(() => {
    if (isOpen && trip && typeof window !== "undefined") {
      try {
        const packData = {
          tripId: trip.id,
          title: trip.title,
          destination: trip.destination?.name,
          dates: `${trip.start_date} to ${trip.end_date}`,
          itineraries: trip.itineraries,
          hotel: trip.hotel,
          transport: trip.transport,
          rental: trip.rental,
          checklist,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(`vanvas_offline_trip_${trip.id}`, JSON.stringify(packData));
        setOfflineSaved(true);
      } catch (e) {
        console.warn("Could not write offline pack to localStorage:", e);
      }
    }
  }, [isOpen, trip, checklist]);

  if (!isOpen) return null;

  const destName = trip.destination?.name || "Valley";

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F2924]/80 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="w-full max-w-xl bg-[#FAF7F0] h-full shadow-2xl flex flex-col border-l-2 border-[#E5D5BA] overflow-hidden animate-vanvas-slide-left">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-[#173B32] text-[#EFE5D2] flex items-center justify-between border-b border-[#B49252]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B49252]">
                OFFLINE TRIP PACK · VANVAS SAFE PASS
              </span>
            </div>
            <h3 className="font-serif font-black text-xl sm:text-2xl text-[#FAF4E8] mt-0.5">
              {destName} Offline Guide
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-[#EFE5D2] cursor-pointer transition-colors"
              title="Print Offline Sheet"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-[#EFE5D2] cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Offline confirmation badge */}
        <div className="bg-emerald-900 text-emerald-200 px-4 py-2 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Saved to device storage • Accessible if cell service drops</span>
          </div>
          <span className="text-[10px] text-emerald-300">PASS #VAN-{trip.id.slice(0, 6).toUpperCase()}</span>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-[#20211D]">
          {/* Emergency Helplines Strip (Safety First) */}
          <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-950 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-700" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-900">
                CRITICAL EMERGENCY CONTACTS
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono pt-1">
              <a href="tel:112" className="p-2 rounded-xl bg-white border border-rose-200 block font-bold text-center">
                Police / SOS: 112
              </a>
              <a href="tel:108" className="p-2 rounded-xl bg-white border border-rose-200 block font-bold text-center">
                Medical: 108
              </a>
              <a href="tel:1077" className="p-2 rounded-xl bg-white border border-rose-200 block font-bold text-center">
                Disaster: 1077
              </a>
            </div>
          </div>

          {/* Transport & Stays Check-in References */}
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#7B4D36] block">
              TRANSIT &amp; ACCOMMODATION REFERENCES
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-white border border-[#E5D5BA] space-y-1 text-xs">
                <div className="flex items-center gap-2 text-[#173B32] font-bold">
                  <BedDouble className="w-4 h-4 text-[#B65E3C]" />
                  <span>Stay / Basecamp</span>
                </div>
                <div className="font-serif font-black text-sm text-[#173B32]">
                  {trip.hotel?.name || `${destName} Selected Stay`}
                </div>
                <div className="text-[11px] text-[#7B4D36] font-mono">
                  {trip.hotel?.address || "Check-in after 12:00 PM"}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-[#E5D5BA] space-y-1 text-xs">
                <div className="flex items-center gap-2 text-[#173B32] font-bold">
                  <Bus className="w-4 h-4 text-[#B65E3C]" />
                  <span>Transport Mode</span>
                </div>
                <div className="font-serif font-black text-sm text-[#173B32]">
                  {trip.transport?.operator_name || "Express Valley Transit"}
                </div>
                <div className="text-[11px] text-[#7B4D36] font-mono">
                  {trip.transport?.departure_location || "Central Terminal"}
                </div>
              </div>
            </div>
          </div>

          {/* Full Day-by-Day Offline Itinerary */}
          <div className="space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#7B4D36] block">
              DAY-BY-DAY ROUTE SNAPSHOT
            </span>

            {trip.itineraries.map((day) => (
              <div key={day.id || day.day_number} className="p-4 rounded-2xl bg-white border border-[#E5D5BA] space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-2">
                  <span className="font-serif font-black text-base text-[#173B32]">
                    DAY {String(day.day_number).padStart(2, "0")} · {day.date || `Day ${day.day_number}`}
                  </span>
                  <span className="text-[10px] font-mono text-[#7B4D36] uppercase font-bold">
                    {day.items.length} Waypoints
                  </span>
                </div>

                <div className="space-y-2.5 divide-y divide-[#E5D5BA]/60">
                  {day.items.map((it, idx) => (
                    <div key={it.id || idx} className="pt-2 first:pt-0 flex items-start justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-[#EFE5D2] text-[#173B32]">
                            {it.start_time}
                          </span>
                          <strong className="text-[#173B32]">{it.title}</strong>
                        </div>
                        {it.notes && (
                          <p className="text-[11px] text-[#7B4D36] mt-0.5 pl-6">{it.notes}</p>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-[#7B4D36]">
                        {it.duration_mins || 60}m
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Packing Checklist */}
          {checklist.length > 0 && (
            <div className="p-4 rounded-2xl bg-white border border-[#E5D5BA] space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-[#7B4D36]">
                <CheckSquare className="w-4 h-4 text-[#B65E3C]" />
                <span>PACKING CHECKLIST ({checklist.length} ITEMS)</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                {checklist.map((c) => (
                  <div key={c.id} className="flex items-center gap-1.5 truncate">
                    <span className={c.is_checked ? "text-emerald-700" : "text-[#7B4D36]"}>
                      {c.is_checked ? "✓" : "○"}
                    </span>
                    <span className={c.is_checked ? "line-through opacity-60" : "text-[#173B32]"}>
                      {c.item_name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FAF7F0] border-t border-[#E5D5BA] flex items-center justify-between">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] text-xs font-bold font-mono flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-[#B49252]" />
            <span>Print Trip Sheet</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#EFE5D2] border border-[#E5D5BA] text-xs font-bold text-[#173B32] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
