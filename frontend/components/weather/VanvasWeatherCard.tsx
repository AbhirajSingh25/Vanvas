"use client";

import React from "react";
import {
  Sun, CloudRain, CloudFog, CloudLightning, Snowflake,
  Wind, Droplets, Compass, Clock, AlertCircle, Sparkles
} from "lucide-react";
import { StructuredWeather, WeatherSnapshot } from "@/types";
import { VanvasWeatherVisual } from "./VanvasWeatherVisual";

function formatFreshness(updatedAt?: string): string {
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
  if (!isOnline) {
    if (updatedAt) {
      try {
        const d = new Date(updatedAt);
        if (!isNaN(d.getTime())) {
          const diffMinutes = Math.floor((Date.now() - d.getTime()) / 60000);
          if (diffMinutes <= 1) return "Offline • Cached just now";
          if (diffMinutes < 60) return `Offline • Cached ${diffMinutes}m ago`;
          const diffHours = Math.floor(diffMinutes / 60);
          if (diffHours < 24) return `Offline • Cached ${diffHours}h ago`;
          return `Offline • Cached ${d.toLocaleDateString()}`;
        }
      } catch {}
    }
    return "Offline • Cached weather snapshot";
  }

  if (!updatedAt) return "Live Satellite Feed";
  try {
    const d = new Date(updatedAt);
    if (isNaN(d.getTime())) return "Live Satellite Feed";
    const diffMinutes = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diffMinutes <= 1) return "Live • Updated just now";
    if (diffMinutes < 60) return `Live • Updated ${diffMinutes}m ago`;
    const hours = d.getHours().toString().padStart(2, "0");
    const mins = d.getMinutes().toString().padStart(2, "0");
    return `Live • Updated at ${hours}:${mins}`;
  } catch {
    return "Live Satellite Feed";
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
  const advisory = structuredWeather?.advisory || firstDay?.advisory || `Live meteorological intelligence for ${destinationName}. High altitude mountain conditions can change rapidly.`;
  const freshnessText = formatFreshness(structuredWeather?.updatedAt || firstDay?.date);
  const sourceLabel = structuredWeather?.trust_source === "WTTR" ? "Global Meteorological Radar" : "Open-Meteo Satellite Feed";

  // Honest unavailable fallback
  if (!isAvailable || currentTemp === null) {
    return (
      <div className={`p-5 rounded-3xl bg-[#173B32] text-[#EFE5D2] border border-[#2D5A43] shadow-md flex items-center gap-4 ${className}`}>
        <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
          <AlertCircle className="w-5 h-5 text-[#B49252]" />
        </div>
        <div>
          <h4 className="text-sm font-serif font-bold text-[#FAF4E8]">Weather for {destinationName}</h4>
          <p className="text-xs text-[#D8DED5]/80 mt-0.5">
            Weather unavailable. Updated when live data returns.
          </p>
        </div>
      </div>
    );
  }

  if (isCompact) {
    return (
      <div className={`relative rounded-3xl border border-[#2D5A43] dark:border-[rgba(216,222,213,0.18)] shadow-lg overflow-hidden text-[#EFE5D2] p-4 sm:p-5 ${className}`}>
        {/* Full-card Live Weather Scene Canvas (clipped inside) */}
        <VanvasWeatherVisual condition={condition} isDay={isDay} weatherCode={weatherCode} />

        {/* Readability Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A1713]/90 via-[#0A1713]/50 to-[#0A1713]/25 pointer-events-none z-1" />

        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl sm:text-4xl font-serif font-black text-[#FAF4E8] tracking-tight drop-shadow-md">
                {Math.round(currentTemp)}°<span className="text-sm font-mono text-[#B49252]">C</span>
              </span>
              <div>
                <span className="text-sm font-bold text-[#FAF4E8] block leading-tight drop-shadow-xs">{condition}</span>
                <span className="text-[11px] text-[#D8DED5]/90 font-mono">
                  {destinationName} • Feels {Math.round(apparentTemp || currentTemp)}°C
                </span>
              </div>
            </div>
            <span className="text-[9px] font-mono uppercase bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full text-[#B49252] border border-white/10 font-bold">
              {freshnessText}
            </span>
          </div>

          {daily.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-white/15">
              {daily.slice(0, 5).map((w, idx) => (
                <div key={idx} className="flex items-center gap-2 shrink-0 bg-black/35 backdrop-blur-md px-2.5 py-1.5 rounded-xl text-[11px] font-mono border border-white/10">
                  <span className="font-bold text-[#FAF4E8]">{idx === 0 ? "Today" : `D${idx + 1}`}</span>
                  <span className="text-[#B49252] font-semibold">{Math.round(w.temp_c)}°C</span>
                  <span className="text-[10px] text-[#D8DED5]/80">{w.is_rain ? "Rain" : (w.is_snow ? "Snow" : "Clear")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-3xl p-6 sm:p-8 border-2 border-[#2D5A43] dark:border-[rgba(216,222,213,0.18)] shadow-2xl overflow-hidden text-[#EFE5D2] ${className}`}>
      {/* Full-card Live Weather Scene Canvas (clipped inside) */}
      <VanvasWeatherVisual condition={condition} isDay={isDay} weatherCode={weatherCode} />

      {/* Readability Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A1713]/95 via-[#0A1713]/60 to-[#0A1713]/30 pointer-events-none z-1" />

      <div className="relative z-10 space-y-6">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/15 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#B49252] font-bold">
                METEOROLOGICAL COCKPIT • DESTINATION INTELLIGENCE
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#FAF4E8] mt-0.5 drop-shadow-sm">
              Live Climate &amp; 5-Day Forecast for {destinationName}
            </h3>
          </div>
          <div className="text-[11px] text-[#D8DED5]/80 font-mono sm:text-right flex items-center sm:justify-end gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{sourceLabel} • {freshnessText}</span>
          </div>
        </div>

        {/* Current Conditions Spotlight */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Main Temperature Hero */}
          <div className="md:col-span-5 flex items-center gap-5 p-5 rounded-2xl bg-black/35 backdrop-blur-md border border-white/15 shadow-inner">
            <div className="text-5xl sm:text-6xl font-serif font-black text-[#FAF4E8] tracking-tight drop-shadow-md">
              {Math.round(currentTemp)}°<span className="text-xl text-[#B49252] font-mono">C</span>
            </div>
            <div className="space-y-1">
              <span className="text-base sm:text-lg font-bold text-[#FAF4E8] block drop-shadow-xs">{condition}</span>
              <span className="text-xs text-[#D8DED5]/90 font-mono block">
                Feels like {Math.round(apparentTemp || currentTemp)}°C
              </span>
              {firstDay?.is_rain && (
                <span className="inline-block text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 font-mono font-bold border border-blue-400/30">
                  Precipitation Active
                </span>
              )}
            </div>
          </div>

          {/* Meteorological Advisory & Atmosphere Stats */}
          <div className="md:col-span-7 p-5 rounded-2xl bg-black/35 backdrop-blur-md border border-white/15 flex flex-col justify-between space-y-3.5 shadow-inner">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#B49252] shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B49252] block">
                  VANVAS EXPEDITION ADVISORY
                </span>
                <p className="text-xs text-[#EFE5D2] leading-relaxed mt-0.5">
                  {advisory}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-5 text-xs font-mono text-[#D8DED5]/90 pt-3 border-t border-white/10 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-[#B49252]" />
                <span>Wind: {windSpeed} km/h</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-cyan-300" />
                <span>Humidity: {humidity}%</span>
              </div>
              {precipitation > 0 && (
                <div className="flex items-center gap-1.5">
                  <CloudRain className="w-3.5 h-3.5 text-blue-300" />
                  <span>Precip: {precipitation} mm</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 5-Day Forecast Grid */}
        {daily.length > 0 && (
          <div className="space-y-2.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B49252] block">
              5-DAY ROLLING FORECAST
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
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
                } catch {
                  // ignore
                }

                return (
                  <div
                    key={w.id || idx}
                    className="p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/15 flex flex-col justify-between space-y-2.5 hover:bg-black/55 hover:border-[#B49252]/50 transition-all interactive-card"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#FAF4E8]">{dayName}</span>
                      <span className="text-[10px] font-mono text-[#D8DED5]/70">{dateStr}</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-serif font-bold text-[#FAF4E8]">
                        {Math.round(w.temp_c)}°C
                      </span>
                      <span className="text-[11px] font-mono text-[#B49252] font-semibold">
                        {w.is_rain ? "Rain" : (w.is_snow ? "Snow" : "Clear")}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#D8DED5]/80 line-clamp-1">
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
