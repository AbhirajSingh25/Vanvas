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

/**
 * VanvasWeatherVisual: Live atmospheric weather canvas rendered entirely inside the weather card.
 * Clipped strictly to container bounds with realistic clouds, sun, rain streaks, snow, fog & lightning.
 */
export const VanvasWeatherVisual: React.FC<VanvasWeatherVisualProps> = ({
  condition = "Clear Sky",
  isDay = true,
  weatherCode,
  className = "",
}) => {
  const state = mapConditionToWeatherState(condition, isDay, weatherCode);

  return (
    <div
      className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0 ${className}`}
      aria-label={`Live weather scene: ${state}`}
    >
      {/* 1. THUNDERSTORM SCENE */}
      {state === "THUNDERSTORM" && (
        <div className="relative w-full h-full bg-gradient-to-b from-[#0a1713] via-[#12231c] to-[#1a3328]">
          {/* Ambient Lightning Sheet Flash */}
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-200/35 via-cyan-100/20 to-transparent opacity-0 animate-weather-sheet-flash pointer-events-none" />

          {/* Background Storm Clouds */}
          <div className="absolute top-[-30px] -left-10 w-[140%] h-48 opacity-75 animate-weather-cloud-1">
            <svg viewBox="0 0 500 200" className="w-full h-full fill-[#1c2e27] drop-shadow-2xl">
              <path d="M0,120 Q80,60 160,100 Q240,40 330,80 Q420,30 500,100 L500,0 L0,0 Z" />
            </svg>
          </div>

          {/* Foreground Dark Storm Cloud Canopy */}
          <div className="absolute top-[-20px] -right-10 w-[130%] h-44 opacity-90 animate-weather-cloud-2">
            <svg viewBox="0 0 500 180" className="w-full h-full fill-[#15241f] drop-shadow-xl">
              <path d="M0,90 Q90,30 190,70 Q290,20 380,60 Q440,10 500,80 L500,0 L0,0 Z" />
            </svg>
          </div>

          {/* Embedded Lightning Bolt Branch */}
          <div className="absolute top-10 right-1/4 w-32 h-48 opacity-0 animate-weather-lightning-bolt pointer-events-none">
            <svg viewBox="0 0 100 160" className="w-full h-full drop-shadow-[0_0_16px_rgba(180,220,255,0.95)]">
              <path
                d="M55,0 L42,45 L62,50 L35,100 L52,103 L20,160 L40,105 L26,102 L48,52 L32,48 Z"
                fill="#E8F4F8"
              />
              <path
                d="M42,45 L25,75 M35,100 L18,125"
                stroke="#B8E0F0"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>

          {/* Multi-tier Rain Streaks */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Fast Rain Tier */}
            <div className="absolute inset-0 flex justify-around opacity-75 animate-weather-rain-1">
              {[...Array(14)].map((_, i) => (
                <span
                  key={`r1-${i}`}
                  className="w-[1.5px] h-16 bg-gradient-to-b from-transparent via-blue-200/90 to-cyan-100 rounded-full inline-block"
                  style={{ transform: `translateY(${((i * 37) % 80) - 40}px)` }}
                />
              ))}
            </div>

            {/* Medium Rain Tier */}
            <div className="absolute inset-0 flex justify-around opacity-60 animate-weather-rain-2">
              {[...Array(12)].map((_, i) => (
                <span
                  key={`r2-${i}`}
                  className="w-[1px] h-12 bg-gradient-to-b from-transparent via-blue-300/80 to-blue-100/90 rounded-full inline-block"
                  style={{ transform: `translateY(${((i * 43) % 70) - 30}px)` }}
                />
              ))}
            </div>

            {/* Heavy Mist Base */}
            <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#0a1713]/90 via-[#0a1713]/40 to-transparent" />
          </div>
        </div>
      )}

      {/* 2. SUNNY / CLEAR DAY SCENE */}
      {state === "SUNNY" && (
        <div className="relative w-full h-full bg-gradient-to-br from-[#12382c] via-[#1c4d3b] to-[#7a6435] overflow-hidden">
          {/* Concentric SunGroup: Glow + Rays + SunBody all aligned to identical center */}
          <div className="absolute top-3 right-5 w-36 h-36 flex items-center justify-center">
            {/* Centered Solar Aura Glow */}
            <div className="absolute w-44 h-44 rounded-full bg-[#B49252]/25 blur-2xl animate-weather-sun-radiance pointer-events-none" />
            <div className="absolute w-32 h-32 rounded-full bg-[#E5B869]/30 blur-xl animate-weather-sun-radiance pointer-events-none" />

            {/* Geometrically Concentric Rotating Rays Corona */}
            <div className="absolute inset-0 w-full h-full animate-weather-sun-rays opacity-60 flex items-center justify-center pointer-events-none">
              <svg viewBox="0 0 160 160" className="w-full h-full text-[#FAF4E8]/70">
                <circle cx="80" cy="80" r="32" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" opacity="0.6" />
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                  <line
                    key={deg}
                    x1="80"
                    y1="34"
                    x2="80"
                    y2="18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    transform={`rotate(${deg} 80 80)`}
                  />
                ))}
              </svg>
            </div>

            {/* Concentric Luminous Sun Orb */}
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-[#B65E3C] via-[#E5B869] to-[#FFFDF5] shadow-[0_0_30px_rgba(229,184,105,0.75)]" />
          </div>

          {/* Gentle Mountain Mist Layer */}
          <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#12382c] via-[#12382c]/60 to-transparent" />
        </div>
      )}

      {/* 3. PARTLY CLOUDY SCENE */}
      {state === "PARTLY_CLOUDY" && (
        <div className="relative w-full h-full bg-gradient-to-br from-[#133328] via-[#1d4738] to-[#425e4f] overflow-hidden">
          {/* Concentric SunGroup peeking behind clouds */}
          <div className="absolute top-2 right-8 w-28 h-28 flex items-center justify-center">
            <div className="absolute w-32 h-32 rounded-full bg-[#E5B869]/25 blur-xl animate-weather-sun-radiance pointer-events-none" />
            <div className="absolute inset-0 w-full h-full animate-weather-sun-rays opacity-40 flex items-center justify-center pointer-events-none">
              <svg viewBox="0 0 120 120" className="w-full h-full text-[#FAF4E8]/60">
                {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                  <line
                    key={deg}
                    x1="60"
                    y1="24"
                    x2="60"
                    y2="12"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    transform={`rotate(${deg} 60 60)`}
                  />
                ))}
              </svg>
            </div>
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-[#B65E3C] via-[#E5B869] to-[#FFFDF5] shadow-md" />
          </div>

          {/* Background Soft Cloud Layer */}
          <div className="absolute top-2 -left-12 w-[130%] h-36 opacity-60 animate-weather-cloud-2">
            <svg viewBox="0 0 500 160" className="w-full h-full fill-[#2c4e40]">
              <path d="M0,90 Q90,40 180,75 Q280,30 380,65 Q450,20 500,80 L500,0 L0,0 Z" />
            </svg>
          </div>

          {/* Foreground Drifting Cloud Masses */}
          <div className="absolute top-10 -right-8 w-[120%] h-40 opacity-85 animate-weather-cloud-1">
            <svg viewBox="0 0 500 180" className="w-full h-full fill-[#EFE5D2]/80 drop-shadow-md">
              <path d="M0,100 C70,60 140,50 200,80 C260,40 340,40 400,75 C450,60 480,80 500,100 L500,180 L0,180 Z" />
            </svg>
          </div>

          <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[#133328] to-transparent" />
        </div>
      )}

      {/* 4. CLOUDY / OVERCAST SCENE */}
      {state === "CLOUDY" && (
        <div className="relative w-full h-full bg-gradient-to-b from-[#142820] via-[#1e382d] to-[#274438]">
          {/* Multi-tier Volumetric Clouds */}
          <div className="absolute top-[-20px] -left-10 w-[140%] h-48 opacity-50 animate-weather-cloud-3">
            <svg viewBox="0 0 500 180" className="w-full h-full fill-[#2e473c]">
              <path d="M0,110 Q90,50 190,85 Q290,40 390,75 Q460,35 500,95 L500,0 L0,0 Z" />
            </svg>
          </div>

          <div className="absolute top-4 -right-10 w-[130%] h-44 opacity-75 animate-weather-cloud-1">
            <svg viewBox="0 0 500 180" className="w-full h-full fill-[#3a5649] drop-shadow-lg">
              <path d="M0,80 Q80,30 170,60 Q270,20 360,55 Q440,25 500,70 L500,0 L0,0 Z" />
            </svg>
          </div>

          <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#142820] via-[#142820]/70 to-transparent" />
        </div>
      )}

      {/* 5. RAIN SCENE */}
      {(state === "RAIN" || state === "HEAVY_RAIN") && (
        <div className="relative w-full h-full bg-gradient-to-b from-[#0f211a] via-[#162e24] to-[#1f3b2f]">
          {/* Dark Cloud Ceiling */}
          <div className="absolute top-[-20px] -left-10 w-[140%] h-40 opacity-85 animate-weather-cloud-1">
            <svg viewBox="0 0 500 160" className="w-full h-full fill-[#1c3328] drop-shadow-lg">
              <path d="M0,90 Q90,40 190,75 Q290,30 380,65 Q450,25 500,85 L500,0 L0,0 Z" />
            </svg>
          </div>

          {/* Rain Streaks */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 flex justify-around opacity-80 animate-weather-rain-1">
              {[...Array(state === "HEAVY_RAIN" ? 16 : 10)].map((_, i) => (
                <span
                  key={`rain-${i}`}
                  className="w-[1.5px] h-14 bg-gradient-to-b from-transparent via-blue-300/85 to-cyan-100 rounded-full inline-block"
                  style={{ transform: `translateY(${((i * 31) % 60) - 30}px)` }}
                />
              ))}
            </div>

            <div className="absolute inset-0 flex justify-around opacity-60 animate-weather-rain-2">
              {[...Array(state === "HEAVY_RAIN" ? 14 : 8)].map((_, i) => (
                <span
                  key={`rain-bg-${i}`}
                  className="w-[1px] h-10 bg-gradient-to-b from-transparent via-blue-400/70 to-blue-200 rounded-full inline-block"
                  style={{ transform: `translateY(${((i * 47) % 50) - 25}px)` }}
                />
              ))}
            </div>
          </div>

          <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[#0f211a] to-transparent" />
        </div>
      )}

      {/* 6. SNOW SCENE */}
      {state === "SNOW" && (
        <div className="relative w-full h-full bg-gradient-to-b from-[#11211b] via-[#1a3027] to-[#254236]">
          {/* Pale Winter Cloud Layer */}
          <div className="absolute top-[-20px] -left-10 w-[140%] h-36 opacity-75 animate-weather-cloud-1">
            <svg viewBox="0 0 500 150" className="w-full h-full fill-[#2c473c]">
              <path d="M0,80 Q90,35 180,65 Q280,25 380,55 Q450,20 500,75 L500,0 L0,0 Z" />
            </svg>
          </div>

          {/* Falling Snow Particles in 2 Depth Planes */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 flex justify-around animate-weather-snow-1">
              {[...Array(12)].map((_, i) => (
                <span
                  key={`snow-1-${i}`}
                  className="w-2 h-2 bg-white/90 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] inline-block"
                  style={{ transform: `translateY(${((i * 41) % 70) - 35}px)` }}
                />
              ))}
            </div>

            <div className="absolute inset-0 flex justify-around opacity-75 animate-weather-snow-2">
              {[...Array(14)].map((_, i) => (
                <span
                  key={`snow-2-${i}`}
                  className="w-1.5 h-1.5 bg-white/80 rounded-full inline-block"
                  style={{ transform: `translateY(${((i * 29) % 80) - 40}px)` }}
                />
              ))}
            </div>
          </div>

          <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[#11211b] to-transparent" />
        </div>
      )}

      {/* 7. FOG / MIST SCENE */}
      {(state === "FOG" || state === "WIND") && (
        <div className="relative w-full h-full bg-gradient-to-b from-[#152820] via-[#1e382d] to-[#274438]">
          {/* Layered Horizontal Mist Waves */}
          <div className="absolute top-1/4 -inset-x-12 h-16 bg-gradient-to-r from-transparent via-[#EFE5D2]/35 to-transparent blur-md animate-weather-fog-1" />
          <div className="absolute top-1/2 -inset-x-12 h-20 bg-gradient-to-r from-transparent via-[#D8DED5]/45 to-transparent blur-lg animate-weather-fog-2" />
          <div className="absolute top-2/3 -inset-x-12 h-24 bg-gradient-to-r from-transparent via-[#EFE5D2]/30 to-transparent blur-md animate-weather-fog-1" />
          <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#152820] via-[#152820]/80 to-transparent" />
        </div>
      )}

      {/* 8. CLEAR NIGHT SCENE */}
      {state === "CLEAR_NIGHT" && (
        <div className="relative w-full h-full bg-gradient-to-b from-[#08120e] via-[#0d1c16] to-[#152b21]">
          {/* Luminous Crescent Moon */}
          <div className="absolute top-4 right-10 w-24 h-24 rounded-full bg-[#FAF4E8]/20 blur-xl animate-vanvas-moon-glow" />
          <div className="absolute top-6 right-12 w-14 h-14">
            <svg viewBox="0 0 100 100" className="w-full h-full text-[#FAF4E8] drop-shadow-[0_0_15px_rgba(250,244,232,0.8)]">
              <path
                d="M 50 10 A 40 40 0 1 0 90 50 A 30 30 0 1 1 50 10 Z"
                fill="currentColor"
              />
            </svg>
          </div>

          {/* Field of Twinkling Stars */}
          <div className="absolute inset-0 overflow-hidden">
            {[
              { t: 15, l: 20, s: 2, d: "0ms" },
              { t: 25, l: 45, s: 1.5, d: "600ms" },
              { t: 18, l: 70, s: 2, d: "1200ms" },
              { t: 40, l: 15, s: 1.5, d: "300ms" },
              { t: 50, l: 60, s: 2.5, d: "900ms" },
              { t: 30, l: 85, s: 1.5, d: "1500ms" },
              { t: 65, l: 35, s: 2, d: "750ms" },
            ].map((star, idx) => (
              <span
                key={`star-${idx}`}
                className="absolute bg-white rounded-full animate-vanvas-star-twinkle shadow-xs"
                style={{
                  top: `${star.t}%`,
                  left: `${star.l}%`,
                  width: `${star.s}px`,
                  height: `${star.s}px`,
                  animationDelay: star.d,
                }}
              />
            ))}
          </div>

          {/* Wispy Night Clouds */}
          <div className="absolute top-8 -left-10 w-[130%] h-32 opacity-40 animate-weather-cloud-3">
            <svg viewBox="0 0 500 140" className="w-full h-full fill-[#162a22]">
              <path d="M0,80 Q90,35 190,65 Q290,25 380,55 Q450,20 500,75 L500,0 L0,0 Z" />
            </svg>
          </div>

          <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[#08120e] to-transparent" />
        </div>
      )}
    </div>
  );
};
