"use client";

import React, { useState } from "react";
import {
  Sun, CloudRain, CloudFog, CloudLightning, Snowflake,
  Wind, Droplets, Compass, Clock, AlertCircle, Sparkles, ChevronDown, ChevronUp
} from "lucide-react";
import { StructuredWeather, WeatherSnapshot } from "@/types";
import { VanvasWeatherVisual } from "./VanvasWeatherVisual";
import { useOnlineStatus } from "../pwa/useOnlineStatus";

function formatFreshness(updatedAt?: string, onlineOverride?: boolean): string {
  const isOnline =
    onlineOverride !== undefined
      ? onlineOverride
      : typeof navigator !== "undefined"
      ? navigator.onLine
      : true;

  if (!updatedAt) {
    return isOnline ? "Forecast Feed" : "Offline • Cached Snapshot";
  }

  try {
    const d = new Date(updatedAt);
    if (isNaN(d.getTime())) return isOnline ? "Forecast Feed" : "Offline • Cached Snapshot";

    const now = Date.now();
    const diffMs = now - d.getTime();

    // If timestamp is in the future by more than 1 minute (e.g., future forecast date rather than a past fetch timestamp)
    if (diffMs < -60000) {
      return isOnline ? "Forecast Projected" : "Offline Forecast";
    }

    const diffMinutes = Math.floor(Math.max(0, diffMs) / 60000);

    if (!isOnline) {
      if (diffMinutes <= 1) return "Offline • Cached just now";
      if (diffMinutes < 60) return `Offline • Cached ${diffMinutes}m ago`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `Offline • Cached ${diffHours}h ago`;
      return `Offline • Cached ${d.toLocaleDateString()}`;
    }

    if (diffMinutes <= 1) return "Live • Updated just now";
    if (diffMinutes < 60) return `Live • Updated ${diffMinutes}m ago`;
    const hours = d.getHours().toString().padStart(2, "0");
    const mins = d.getMinutes().toString().padStart(2, "0");
    return `Live • Updated at ${hours}:${mins}`;
  } catch {
    return isOnline ? "Forecast Feed" : "Offline • Cached Snapshot";
  }
}

interface VanvasWeatherCardProps {
  destinationName: string;
  structuredWeather?: StructuredWeather | null;
  weatherSnapshots?: WeatherSnapshot[];
  isCompact?: boolean;
  className?: string;
}

export const VanvasWeatherCard: React.FC<VanvasWeatherCardProps> = ({
  destinationName,
  structuredWeather,
  weatherSnapshots = [],
  isCompact = false,
  className = "",
}) => {
  const { isOnline } = useOnlineStatus();
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  // Extract primary current values from structuredWeather or fallback to first snapshot
  const daily = (structuredWeather?.daily && structuredWeather.daily.length > 0)
    ? structuredWeather.daily
    : weatherSnapshots;

  const firstDay = daily[0];
  const isAvailable = structuredWeather ? structuredWeather.is_available : daily.length > 0;
  
  const currentTemp = structuredWeather?.temperature ?? (firstDay ? Math.round(firstDay.temp_c) : null);
  const apparentTemp = structuredWeather?.apparentTemperature ?? (currentTemp !== null ? Math.round(currentTemp + (firstDay?.is_rain ? -1.5 : 0.5)) : null);
  const condition = structuredWeather?.condition || firstDay?.condition || "Pleasant";
  const weatherCode = structuredWeather?.weatherCode ?? firstDay?.weatherCode ?? null;
  const isDay = structuredWeather?.isDay ?? true;
  const windSpeed = structuredWeather?.windSpeed ?? firstDay?.wind_kph ?? 8.0;
  const humidity = structuredWeather?.humidity ?? firstDay?.humidity ?? 55;
  const precipitation = structuredWeather?.precipitation ?? (firstDay?.is_rain ? 2.5 : 0.0);
  const advisory = structuredWeather?.advisory || firstDay?.advisory || `Mountain weather advisory for ${destinationName}. High altitude conditions can shift quickly.`;
  const freshnessText = formatFreshness(structuredWeather?.updatedAt, isOnline);
  const sourceLabel = structuredWeather?.trust_source === "WTTR" ? "Global Radar" : "Open-Meteo Satellite";

  // Honest unavailable fallback
  if (!isAvailable || currentTemp === null) {
    return (
      <div className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#173B32] text-[#EFE5D2] border border-[#2D5A43] shadow-md flex items-center gap-3.5 ${className}`}>
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <AlertCircle className="w-5 h-5 text-[#B49252]" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-serif font-bold text-[#FAF4E8] truncate">Weather for {destinationName}</h4>
          <p className="text-xs text-[#D8DED5]/80 mt-0.5 font-mono">
            Forecast data currently unavailable. Cached data will display when connected.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // COMPACT DENSITY MODE
  // =========================================================================
  if (isCompact) {
    return (
      <div className={`relative rounded-2xl sm:rounded-3xl border border-[#2D5A43] dark:border-[rgba(216,222,213,0.18)] shadow-lg overflow-hidden text-[#EFE5D2] p-4 sm:p-5 ${className}`}>
        {/* Live Weather Canvas Background */}
        <VanvasWeatherVisual condition={condition} isDay={isDay} weatherCode={weatherCode} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A1713]/95 via-[#0A1713]/60 to-[#0A1713]/35 pointer-events-none z-1" />

        <div className="relative z-10 space-y-3.5">
          {/* Top Row: Destination + Freshness Badge */}
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#B49252] font-bold truncate">
              {destinationName} Climate
            </span>
            <span className="text-[9px] font-mono bg-black/50 px-2 py-0.5 rounded-full text-[#D8DED5] border border-white/10 shrink-0">
              {freshnessText}
            </span>
          </div>

          {/* Temperature & Condition Block (Non-overlapping Flex Row) */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-1.5 shrink-0">
              <span className="text-4xl sm:text-5xl font-serif font-black text-[#FAF4E8] tracking-tight">
                {Math.round(currentTemp)}°
              </span>
              <span className="text-sm font-mono text-[#B49252] font-bold">C</span>
            </div>

            <div className="text-right min-w-0 flex-1">
              <span className="text-sm sm:text-base font-bold text-[#FAF4E8] block truncate">
                {condition}
              </span>
              <span className="text-[11px] text-[#D8DED5]/90 font-mono block">
                Feels like {Math.round(apparentTemp || currentTemp)}°C
              </span>
            </div>
          </div>

          {/* Advisory Snippet */}
          <p className="text-[11px] text-[#EFE5D2]/90 leading-relaxed font-sans line-clamp-2 bg-black/30 p-2 rounded-xl border border-white/10">
            {advisory}
          </p>

          {/* 5-Day Forecast Strip (Clean scrollable row with guaranteed cell sizing) */}
          {daily.length > 0 && (
            <div className="pt-1 border-t border-white/10">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {daily.slice(0, 5).map((w, idx) => (
                  <div
                    key={w.id || idx}
                    className="flex flex-col items-center justify-between min-w-[62px] sm:min-w-[70px] shrink-0 bg-black/40 backdrop-blur-md px-2 py-1.5 rounded-xl border border-white/10 text-center"
                  >
                    <span className="text-[9.5px] font-mono font-bold text-[#D8DED5]/90 uppercase">
                      {idx === 0 ? "Today" : `D${idx + 1}`}
                    </span>
                    <span className="text-xs font-serif font-bold text-[#FAF4E8] my-0.5">
                      {Math.round(w.temp_c)}°C
                    </span>
                    <span className="text-[9px] font-mono text-[#B49252] truncate w-full">
                      {w.is_rain ? "Rain" : (w.is_snow ? "Snow" : "Clear")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // ORIGINAL FULL-FEATURED MODE
  // =========================================================================
  return (
    <div className={`relative rounded-3xl p-5 sm:p-7 border-2 border-[#2D5A43] dark:border-[rgba(216,222,213,0.18)] shadow-2xl overflow-hidden text-[#EFE5D2] ${className}`}>
      {/* Live Canvas Background */}
      <VanvasWeatherVisual condition={condition} isDay={isDay} weatherCode={weatherCode} />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A1713]/95 via-[#0A1713]/60 to-[#0A1713]/30 pointer-events-none z-1" />

      <div className="relative z-10 space-y-5">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/15 pb-3.5">
          <div className="min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#B49252] font-bold block">
              METEOROLOGICAL INTELLIGENCE
            </span>
            <h3 className="text-lg sm:text-xl font-serif font-bold text-[#FAF4E8] mt-0.5 truncate">
              {destinationName} Climate &amp; Forecast
            </h3>
          </div>
          <div className="text-[10.5px] text-[#D8DED5]/90 font-mono flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 w-fit shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{sourceLabel} • {freshnessText}</span>
          </div>
        </div>

        {/* Current Conditions Spotlight (Two non-colliding panels) */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-stretch">
          {/* Main Temperature Hero */}
          <div className="sm:col-span-5 p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/15 shadow-inner flex flex-col justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-serif font-black text-[#FAF4E8] tracking-tight">
                {Math.round(currentTemp)}°
              </span>
              <span className="text-lg text-[#B49252] font-mono font-bold">C</span>
            </div>
            <div className="mt-2 space-y-0.5">
              <span className="text-base font-bold text-[#FAF4E8] block truncate leading-tight">
                {condition}
              </span>
              <span className="text-xs text-[#D8DED5]/90 font-mono block">
                Feels like {Math.round(apparentTemp || currentTemp)}°C
              </span>
            </div>
          </div>

          {/* Atmosphere Stats & Quick Advisory */}
          <div className="sm:col-span-7 p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/15 shadow-inner flex flex-col justify-between space-y-3">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-[#B49252] shrink-0 mt-0.5" />
              <p className="text-xs text-[#EFE5D2] leading-relaxed line-clamp-3">
                {advisory}
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-[#D8DED5]/90 pt-2 border-t border-white/10 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-[#B49252]" />
                <span>{windSpeed} km/h</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-cyan-300" />
                <span>{humidity}%</span>
              </div>
              {precipitation > 0 && (
                <div className="flex items-center gap-1.5">
                  <CloudRain className="w-3.5 h-3.5 text-blue-300" />
                  <span>{precipitation} mm</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 5-Day Forecast Grid */}
        {daily.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-[#B49252]">
              <span>5-DAY ROLLING FORECAST</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5">
              {daily.slice(0, 5).map((w, idx) => {
                let dayName = idx === 0 ? "Today" : `Day ${idx + 1}`;
                let dateStr = w.forecast_date || w.date || "";
                try {
                  const parts = (w.forecast_date || w.date || "").split("T")[0].split("-");
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
                } catch {}

                return (
                  <div
                    key={w.id || idx}
                    className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-black/40 backdrop-blur-md border border-white/15 flex flex-col justify-between space-y-1.5 text-left"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#FAF4E8] truncate">{dayName}</span>
                      <span className="text-[9.5px] font-mono text-[#D8DED5]/70 shrink-0">{dateStr}</span>
                    </div>
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="text-base sm:text-lg font-serif font-bold text-[#FAF4E8]">
                        {Math.round(w.temp_c)}°C
                      </span>
                      <span className="text-[10px] font-mono text-[#B49252] font-semibold truncate">
                        {w.is_rain ? "Rain" : (w.is_snow ? "Snow" : "Clear")}
                      </span>
                    </div>
                    <p className="text-[9.5px] text-[#D8DED5]/80 truncate">
                      {w.condition}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
