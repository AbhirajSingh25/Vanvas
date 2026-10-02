"use client";

import React, { useState, useEffect } from "react";
import {
  Navigation, Clock, Hotel, Utensils, Compass, Bike, X,
  CheckCircle, ArrowRight, MapPin, AlertCircle, Sun, Loader2
} from "lucide-react";
import { api } from "@/lib/api";
import { ImHereResponse } from "@/types";
import { TravelStamp } from "@/components/ui/TravelStamp";

interface ImHereDrawerProps {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
  destinationId?: string;
}

export const ImHereDrawer: React.FC<ImHereDrawerProps> = ({ tripId, isOpen, onClose }) => {
  const [data, setData] = useState<ImHereResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [geoStatus, setGeoStatus] = useState<"detecting" | "granted" | "denied" | "unavailable">("detecting");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      // Attempt browser geolocation
      if (typeof window !== "undefined" && "geolocation" in navigator) {
        setGeoStatus("detecting");
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setGeoStatus("granted");
            setUserCoords({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (error) => {
            console.warn("Geolocation permission:", error.message);
            setGeoStatus("denied");
          },
          { timeout: 8000, enableHighAccuracy: true }
        );
      } else {
        setGeoStatus("unavailable");
      }

      api.getImHereContext(tripId)
        .then((res) => setData(res))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, tripId]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#0F2924]/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="p-5 sm:p-6 bg-[#0F2924] text-[#EFE5D2] flex items-center justify-between border-b border-[#243E36]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#B65E3C] text-[#EFE5D2] flex items-center justify-center shadow-lg shrink-0">
              <Navigation className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <TravelStamp label="पहुँच गए • I'M HERE" variant="terracotta" />
                <span className="text-[10px] text-[#B49252] font-mono font-bold uppercase">
                  LIVE CONTEXT
                </span>
              </div>
              <h2 className="text-xl font-serif font-black tracking-tight mt-1 text-[#FAF4E8]">
                You Just Arrived At Your Destination
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-full text-[#D8DED5] hover:bg-[#173B32] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {/* Geolocation Status Bar */}
          <div className="p-3 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#B65E3C]" />
              {geoStatus === "granted" && userCoords ? (
                <span className="text-[#173B32] font-bold">
                  GPS LIVE: {userCoords.lat.toFixed(3)}°N, {userCoords.lng.toFixed(3)}°E
                </span>
              ) : geoStatus === "denied" ? (
                <span className="text-[#7B4D36]">
                  GPS permission denied • Using destination center
                </span>
              ) : (
                <span className="text-[#7B4D36] flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Detecting your coordinates...
                </span>
              )}
            </div>

            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 uppercase">
              LOCAL SENSING
            </span>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3 text-[#173B32]">
              <div className="w-9 h-9 border-3 border-[#B65E3C] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-serif italic text-[#7B4D36]">
                Analyzing arrival time, hotel check-in &amp; nearest local food spots...
              </p>
            </div>
          ) : data ? (
            <>
              {/* Timing & Destination Status Pill */}
              <div className="p-4 rounded-2xl bg-white border-2 border-[#E5D5BA] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div>
                  <div className="text-[10px] text-[#7B4D36] font-bold uppercase tracking-wider font-mono">
                    Current Destination Hub
                  </div>
                  <div className="font-serif font-black text-[#173B32] text-lg">
                    {data.current_location_name}
                  </div>
                </div>
                {data.hotel_info && (
                  <div className="bg-[#FAF7F0] px-3.5 py-2 rounded-xl border border-[#E5D5BA] flex items-center gap-2">
                    <Hotel className="w-4 h-4 text-[#B65E3C]" />
                    <div className="text-xs font-mono">
                      <div className="font-bold text-[#173B32]">{data.hotel_info.name}</div>
                      <div className="text-[#7B4D36] text-[10px]">Check-in: {data.hotel_info.check_in_time}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Next 3 Hours Micro-Plan */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-base text-[#173B32] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#B65E3C]" />
                    <span>Next 3 Hours Sequence</span>
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-[#7B4D36] uppercase bg-[#EFE5D2] px-2 py-0.5 rounded">
                    Zero Zigzag
                  </span>
                </div>

                <div className="space-y-2.5">
                  {data.next_3_hours_plan.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-white border border-[#E5D5BA] flex items-start gap-3 hover:border-[#173B32] transition-colors shadow-2xs"
                    >
                      <span className="px-2 py-1 rounded-lg bg-[#173B32] text-[#EFE5D2] font-bold text-xs font-mono shrink-0">
                        {item.start_time}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-serif font-bold text-sm text-[#173B32] truncate">
                            {item.title}
                          </h4>
                          <span className="text-xs font-mono text-[#7B4D36] shrink-0">
                            {item.duration_mins}m
                          </span>
                        </div>
                        <p className="text-xs text-[#7B4D36] mt-0.5 font-light leading-relaxed">
                          {item.notes}
                        </p>
                        {item.reason_for_recommendation && (
                          <div className="mt-1 text-[11px] text-[#B65E3C] font-mono flex items-center gap-1">
                            <span>★</span>
                            <span>{item.reason_for_recommendation}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nearest Food & Local Transport */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nearby Food */}
                <div className="p-4 rounded-2xl bg-white border border-[#E5D5BA] space-y-2">
                  <h4 className="font-bold text-xs text-[#173B32] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <Utensils className="w-3.5 h-3.5 text-[#B65E3C]" />
                    <span>Nearest Local Food</span>
                  </h4>
                  <div className="space-y-1.5">
                    {data.nearby_food.slice(0, 2).map((food) => (
                      <div key={food.id} className="p-2 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] text-xs">
                        <div className="font-serif font-bold text-[#173B32]">{food.name}</div>
                        <div className="text-[10px] font-mono text-[#7B4D36]">{food.category} • ~₹{food.approx_cost}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Local Mobility */}
                <div className="p-4 rounded-2xl bg-white border border-[#E5D5BA] space-y-2">
                  <h4 className="font-bold text-xs text-[#173B32] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <Bike className="w-3.5 h-3.5 text-[#B65E3C]" />
                    <span>Local Transport</span>
                  </h4>
                  <div className="space-y-1.5">
                    {data.local_transport_options.slice(0, 2).map((t, idx) => (
                      <div key={idx} className="p-2 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] text-xs">
                        <div className="flex items-center justify-between font-bold text-[#173B32]">
                          <span>{t.mode}</span>
                          <span className="text-[#B65E3C] font-mono">{t.est_fare}</span>
                        </div>
                        <div className="text-[10px] text-[#7B4D36] mt-0.5">{t.tip}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E5D5BA] bg-[#FAF7F0] flex items-center justify-between">
          <span className="text-xs font-mono text-[#7B4D36]">VANVAS is guiding your day in real-time.</span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
