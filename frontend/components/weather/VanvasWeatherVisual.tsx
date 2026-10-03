"use client";

import React from "react";

export type WeatherState =
  | "SUNNY"
  | "PARTLY_CLOUDY"
  | "CLOUDY"
  | "RAIN"
  | "HEAVY_RAIN"
  | "THUNDERSTORM"
  | "SNOW"
  | "FOG"
  | "WIND"
  | "CLEAR_NIGHT";

interface VanvasWeatherVisualProps {
  condition?: string;
  isDay?: boolean;
  weatherCode?: number | null;
  className?: string;
  size?: "sm" | "md" | "lg" | "hero";
}

export function mapConditionToWeatherState(
  condition: string = "",
  isDay: boolean = true,
  weatherCode?: number | null
): WeatherState {
  const c = (condition || "").toLowerCase();
  const code = weatherCode ?? -1;

  if (code === 95 || code === 96 || code === 99 || c.includes("thunder") || c.includes("storm") || c.includes("lightning")) {
    return "THUNDERSTORM";
  }
  if (code === 65 || code === 82 || c.includes("heavy rain") || c.includes("torrential") || c.includes("downpour")) {
    return "HEAVY_RAIN";
  }
  if (
    (code >= 51 && code <= 63) ||
    code === 80 ||
    code === 81 ||
    c.includes("rain") ||
    c.includes("drizzle") ||
    c.includes("shower")
  ) {
    return "RAIN";
  }
  if (
    (code >= 71 && code <= 77) ||
    code === 85 ||
    code === 86 ||
    c.includes("snow") ||
    c.includes("flurr") ||
    c.includes("frost") ||
    c.includes("blizzard")
  ) {
    return "SNOW";
  }
  if (code === 45 || code === 48 || c.includes("fog") || c.includes("mist") || c.includes("haze")) {
    return "FOG";
  }
  if (c.includes("wind") || c.includes("breeze") || c.includes("gale")) {
    return "WIND";
  }
  if (code === 3 || c.includes("overcast") || c.includes("cloudy")) {
    return "CLOUDY";
  }
  if (code === 1 || code === 2 || c.includes("partly") || c.includes("scattered")) {
    return isDay ? "PARTLY_CLOUDY" : "CLEAR_NIGHT";
  }
  if (!isDay) {
    return "CLEAR_NIGHT";
  }
  return "SUNNY";
}

export const VanvasWeatherVisual: React.FC<VanvasWeatherVisualProps> = ({
  condition = "Clear Sky",
  isDay = true,
  weatherCode,
  className = "",
  size = "md",
}) => {
  const state = mapConditionToWeatherState(condition, isDay, weatherCode);

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-36 h-36",
    hero: "w-full h-44 sm:h-56",
  }[size];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl flex items-center justify-center select-none pointer-events-none ${sizeClasses} ${className}`}
      aria-label={`Weather visual: ${state}`}
    >
      {/* 1. SUNNY / CLEAR DAY */}
      {state === "SUNNY" && (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Subtle radiating solar aura */}
          <div className="absolute w-20 h-20 rounded-full bg-[#B49252]/20 blur-xl animate-vanvas-sun-glow" />
          <div className="absolute w-12 h-12 rounded-full bg-gradient-to-tr from-[#B65E3C] via-[#B49252] to-[#FAF4E8] shadow-md animate-vanvas-sun-pulse" />
          {/* Rotating soft sun rays */}
          <svg
            viewBox="0 0 100 100"
            className="absolute w-24 h-24 text-[#B49252]/40 animate-vanvas-sun-rays"
          >
            <circle cx="50" cy="50" r="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 4" />
            <line x1="50" y1="12" x2="50" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="50" y1="80" x2="50" y2="88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="50" x2="20" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="80" y1="50" x2="88" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="23" y1="23" x2="29" y2="29" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="71" y1="71" x2="77" y2="77" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="23" y1="77" x2="29" y2="71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="71" y1="29" x2="77" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* 2. PARTLY CLOUDY */}
      {state === "PARTLY_CLOUDY" && (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute top-2 right-4 w-10 h-10 rounded-full bg-[#B49252]/30 blur-md animate-vanvas-sun-pulse" />
          <div className="absolute top-3 right-5 w-8 h-8 rounded-full bg-gradient-to-tr from-[#B65E3C] to-[#B49252] shadow-sm" />
          {/* Drifting soft clouds */}
          <div className="absolute inset-0 flex items-center justify-center animate-vanvas-cloud-drift">
            <svg viewBox="0 0 100 60" className="w-20 h-12 text-[#EFE5D2]/70 fill-current drop-shadow-sm">
              <path d="M 20 40 A 15 15 0 0 1 45 30 A 18 18 0 0 1 75 32 A 12 12 0 0 1 85 45 A 8 8 0 0 1 80 52 L 20 52 A 10 10 0 0 1 20 40 Z" />
            </svg>
          </div>
        </div>
      )}

      {/* 3. CLOUDY / OVERCAST */}
      {state === "CLOUDY" && (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute w-28 h-20 text-[#A3B8B0]/40 fill-current animate-vanvas-cloud-drift-slow">
            <svg viewBox="0 0 100 60" className="w-full h-full">
              <path d="M 15 42 A 16 16 0 0 1 42 28 A 20 20 0 0 1 78 30 A 14 14 0 0 1 90 44 A 8 8 0 0 1 85 54 L 15 54 A 10 10 0 0 1 15 42 Z" />
            </svg>
          </div>
          <div className="absolute w-24 h-16 text-[#D8DED5]/80 fill-current animate-vanvas-cloud-drift">
            <svg viewBox="0 0 100 60" className="w-full h-full drop-shadow-md">
              <path d="M 20 38 A 14 14 0 0 1 45 26 A 16 16 0 0 1 74 28 A 12 12 0 0 1 84 40 A 8 8 0 0 1 80 50 L 20 50 A 10 10 0 0 1 20 38 Z" />
            </svg>
          </div>
        </div>
      )}

      {/* 4. RAIN */}
      {state === "RAIN" && (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          <div className="w-20 h-10 text-[#A3B8B0]/70 fill-current animate-vanvas-cloud-bob">
            <svg viewBox="0 0 100 50" className="w-full h-full">
              <path d="M 20 30 A 14 14 0 0 1 45 18 A 16 16 0 0 1 74 20 A 12 12 0 0 1 84 32 L 20 32 Z" />
            </svg>
          </div>
          {/* Animated gentle rain streaks */}
          <div className="relative w-16 h-8 flex justify-between px-2 pt-1">
            <span className="w-0.5 h-3 bg-blue-300/80 rounded-full animate-vanvas-rain-drop [animation-delay:0ms]" />
            <span className="w-0.5 h-4 bg-blue-300/90 rounded-full animate-vanvas-rain-drop [animation-delay:150ms]" />
            <span className="w-0.5 h-3 bg-blue-300/70 rounded-full animate-vanvas-rain-drop [animation-delay:300ms]" />
            <span className="w-0.5 h-4 bg-blue-300/85 rounded-full animate-vanvas-rain-drop [animation-delay:200ms]" />
            <span className="w-0.5 h-3 bg-blue-300/75 rounded-full animate-vanvas-rain-drop [animation-delay:400ms]" />
          </div>
        </div>
      )}

      {/* 5. HEAVY RAIN */}
      {state === "HEAVY_RAIN" && (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          <div className="w-22 h-10 text-[#5A6560]/90 fill-current animate-vanvas-cloud-bob">
            <svg viewBox="0 0 100 50" className="w-full h-full drop-shadow-md">
              <path d="M 18 32 A 15 15 0 0 1 45 16 A 18 18 0 0 1 76 18 A 14 14 0 0 1 88 32 L 18 32 Z" />
            </svg>
          </div>
          {/* Dense angled rain streaks */}
          <div className="relative w-20 h-10 flex justify-between px-1.5 pt-1 -rotate-12">
            <span className="w-1 h-5 bg-blue-400/90 rounded-full animate-vanvas-rain-heavy [animation-delay:0ms]" />
            <span className="w-1 h-6 bg-blue-400/95 rounded-full animate-vanvas-rain-heavy [animation-delay:100ms]" />
            <span className="w-1 h-5 bg-blue-400/85 rounded-full animate-vanvas-rain-heavy [animation-delay:220ms]" />
            <span className="w-1 h-6 bg-blue-400/90 rounded-full animate-vanvas-rain-heavy [animation-delay:140ms]" />
            <span className="w-1 h-5 bg-blue-400/80 rounded-full animate-vanvas-rain-heavy [animation-delay:280ms]" />
            <span className="w-1 h-6 bg-blue-400/95 rounded-full animate-vanvas-rain-heavy [animation-delay:180ms]" />
          </div>
        </div>
      )}

      {/* 6. THUNDERSTORM */}
      {state === "THUNDERSTORM" && (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          {/* Thunder storm cloud with subtle flash */}
          <div className="relative w-22 h-12 text-[#2D3E35] fill-current animate-vanvas-storm-cloud">
            <svg viewBox="0 0 100 60" className="w-full h-full drop-shadow-lg">
              <path d="M 15 38 A 16 16 0 0 1 42 22 A 20 20 0 0 1 78 24 A 14 14 0 0 1 90 38 L 15 38 Z" />
            </svg>
            {/* Lightning bolt with soft intermittent flash */}
            <svg
              viewBox="0 0 24 24"
              className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-6 h-6 text-[#B49252] animate-vanvas-lightning drop-shadow-[0_0_8px_rgba(180,146,82,0.8)]"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" />
            </svg>
          </div>
          <div className="relative w-16 h-6 flex justify-between px-2 pt-2 -rotate-6">
            <span className="w-0.5 h-3 bg-blue-400/80 rounded-full animate-vanvas-rain-heavy [animation-delay:0ms]" />
            <span className="w-0.5 h-4 bg-blue-400/90 rounded-full animate-vanvas-rain-heavy [animation-delay:150ms]" />
            <span className="w-0.5 h-3 bg-blue-400/85 rounded-full animate-vanvas-rain-heavy [animation-delay:80ms]" />
          </div>
        </div>
      )}

      {/* 7. SNOW */}
      {state === "SNOW" && (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          <div className="w-20 h-10 text-[#D8DED5]/90 fill-current animate-vanvas-cloud-bob">
            <svg viewBox="0 0 100 50" className="w-full h-full">
              <path d="M 20 30 A 14 14 0 0 1 45 18 A 16 16 0 0 1 74 20 A 12 12 0 0 1 84 32 L 20 32 Z" />
            </svg>
          </div>
          {/* Falling snow particles */}
          <div className="relative w-16 h-8 flex justify-between px-1 pt-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full shadow-xs animate-vanvas-snow-drift [animation-delay:0ms]" />
            <span className="w-2 h-2 bg-white/90 rounded-full shadow-xs animate-vanvas-snow-drift [animation-delay:350ms]" />
            <span className="w-1.5 h-1.5 bg-white/80 rounded-full shadow-xs animate-vanvas-snow-drift [animation-delay:700ms]" />
            <span className="w-2 h-2 bg-white rounded-full shadow-xs animate-vanvas-snow-drift [animation-delay:500ms]" />
          </div>
        </div>
      )}

      {/* 8. FOG / MIST */}
      {state === "FOG" && (
        <div className="relative w-full h-full flex flex-col items-center justify-center space-y-1.5 px-3">
          <div className="w-full h-2 rounded-full bg-gradient-to-r from-transparent via-[#EFE5D2]/70 to-transparent animate-vanvas-fog-layer-1" />
          <div className="w-4/5 h-2 rounded-full bg-gradient-to-r from-transparent via-[#D8DED5]/85 to-transparent animate-vanvas-fog-layer-2" />
          <div className="w-full h-2 rounded-full bg-gradient-to-r from-transparent via-[#EFE5D2]/60 to-transparent animate-vanvas-fog-layer-3" />
        </div>
      )}

      {/* 9. WIND */}
      {state === "WIND" && (
        <div className="relative w-full h-full flex flex-col items-center justify-center space-y-2 px-3">
          <svg viewBox="0 0 80 20" className="w-20 h-5 text-[#B49252]/70 animate-vanvas-wind-gust">
            <path d="M 5 10 Q 35 2, 55 10 T 75 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <svg viewBox="0 0 80 20" className="w-20 h-5 text-[#EFE5D2]/80 animate-vanvas-wind-gust [animation-delay:300ms]">
            <path d="M 10 10 Q 40 18, 60 10 T 75 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* 10. CLEAR NIGHT */}
      {state === "CLEAR_NIGHT" && (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Subtle nocturnal aura */}
          <div className="absolute w-16 h-16 rounded-full bg-[#1B352B]/40 blur-lg" />
          {/* Crescent Moon */}
          <svg viewBox="0 0 40 40" className="w-12 h-12 text-[#FAF4E8] fill-current drop-shadow-md animate-vanvas-moon-glow">
            <path d="M 20 4 A 16 16 0 1 0 36 20 A 13 13 0 1 1 20 4 Z" />
          </svg>
          {/* Twinkling Pine Stars */}
          <span className="absolute top-3 left-4 w-1 h-1 bg-[#B49252] rounded-full animate-vanvas-star-twinkle [animation-delay:0ms]" />
          <span className="absolute top-6 right-5 w-1.5 h-1.5 bg-[#FAF4E8] rounded-full animate-vanvas-star-twinkle [animation-delay:600ms]" />
          <span className="absolute bottom-4 left-6 w-1 h-1 bg-[#FAF4E8]/80 rounded-full animate-vanvas-star-twinkle [animation-delay:1200ms]" />
        </div>
      )}
    </div>
  );
};
