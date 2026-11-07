"use client";

import React from "react";
import { Sun, CloudRain, CloudFog, CloudLightning, Snowflake, Wind, Droplets, AlertTriangle } from "lucide-react";
import { WeatherSnapshot } from "@/types";

interface WeatherCompactCardProps {
  type: "hourly" | "daily" | "condition" | "alert";
  title: string;
  value: string;
  subtitle?: string;
  iconName?: string;
  badge?: string;
  isAlert?: boolean;
}

export const WeatherCompactCard: React.FC<WeatherCompactCardProps> = ({
  type,
  title,
  value,
  subtitle,
  iconName,
  badge,
  isAlert = false,
}) => {
  const renderIcon = () => {
    if (isAlert) return <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />;
    switch (iconName?.toLowerCase()) {
      case "rain":
        return <CloudRain className="w-5 h-5 text-blue-400" />;
      case "snow":
        return <Snowflake className="w-5 h-5 text-sky-200" />;
      case "wind":
        return <Wind className="w-5 h-5 text-amber-300" />;
      case "fog":
        return <CloudFog className="w-5 h-5 text-stone-300" />;
      case "sun":
      case "clear":
      default:
        return <Sun className="w-5 h-5 text-[#B49252]" />;
    }
  };

  return (
    <div
      className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-2 h-full shadow-2xs select-none ${
        isAlert
          ? "bg-amber-950/40 border-amber-500/60 text-amber-100"
          : "bg-[#111A16] dark:bg-[#111A16] border-[#2C3E35] dark:border-[#2C3E35] text-[#FAF7F0]"
      }`}
    >
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B49252] truncate">
          {title}
        </span>
        {badge && (
          <span className="px-1.5 py-0.5 rounded text-[8.5px] font-mono uppercase font-bold bg-white/10 text-white/90">
            {badge}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2.5 py-0.5">
        <div className="p-1.5 rounded-xl bg-white/10 shrink-0 border border-white/10">
          {renderIcon()}
        </div>
        <div className="min-w-0">
          <div className="font-serif font-black text-xl text-white tracking-tight leading-tight">
            {value}
          </div>
          {subtitle && (
            <div className="text-[11px] text-[#A6BAAE] truncate font-sans">
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

