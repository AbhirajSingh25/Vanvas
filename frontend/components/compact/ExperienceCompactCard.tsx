"use client";

import React from "react";
import Link from "next/link";
import { Mountain, Clock, Compass, ArrowRight, Sparkles, MapPin, Shield } from "lucide-react";

export interface ExperienceItem {
  id: string;
  title: string;
  eyebrow: string;
  tagline: string;
  description: string;
  href: string;
  ctaText: string;
  iconName: "mountain" | "clock" | "compass" | "shield";
  theme: "forest" | "terracotta" | "amber" | "slate";
  badge?: string;
}

interface ExperienceCompactCardProps {
  experience: ExperienceItem;
}

export const ExperienceCompactCard: React.FC<ExperienceCompactCardProps> = ({ experience }) => {
  const getIcon = () => {
    switch (experience.iconName) {
      case "mountain":
        return <Mountain className="w-5 h-5 text-[#E05A2B]" />;
      case "clock":
        return <Clock className="w-5 h-5 text-[#B49252]" />;
      case "compass":
        return <Compass className="w-5 h-5 text-emerald-400" />;
      case "shield":
      default:
        return <Shield className="w-5 h-5 text-[#B65E3C]" />;
    }
  };

  const getThemeClasses = () => {
    switch (experience.theme) {
      case "forest":
        return "bg-gradient-to-br from-[#111A16] to-[#172D24] border-[#2C3E35] text-[#FAF7F0]";
      case "terracotta":
        return "bg-gradient-to-br from-[#2D1B14] to-[#422216] border-[#5A3324] text-[#FAF7F0]";
      case "amber":
        return "bg-gradient-to-br from-[#261E14] to-[#3B2C1B] border-[#534127] text-[#FAF7F0]";
      case "slate":
      default:
        return "bg-gradient-to-br from-[#1C2622] to-[#25362E] border-[#364D43] text-[#FAF7F0]";
    }
  };

  return (
    <div
      className={`rounded-2xl sm:rounded-3xl border-2 p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-lg hover:shadow-xl transition-all duration-300 h-full ${getThemeClasses()}`}
    >
      <div className="space-y-3">
        {/* Eyebrow & Badge */}
        <div className="flex items-center justify-between gap-2">
          <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-[10px] font-mono font-bold uppercase tracking-wider text-[#B49252]">
            {experience.eyebrow}
          </span>
          {experience.badge && (
            <span className="text-[10px] font-mono font-bold text-white/70 uppercase">
              {experience.badge}
            </span>
          )}
        </div>

        {/* Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
            {getIcon()}
          </div>
          <div>
            <h4 className="font-serif font-black text-lg sm:text-xl text-white leading-tight">
              {experience.title}
            </h4>
            <p className="text-[11px] font-mono text-[#B49252] truncate">
              {experience.tagline}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-[#FAF7F0]/85 font-sans leading-relaxed line-clamp-3">
          {experience.description}
        </p>
      </div>

      {/* Action CTA */}
      <div className="pt-2">
        <Link
          href={experience.href}
          className="w-full px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-98 border border-white/20 text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <span>{experience.ctaText}</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#B49252]" />
        </Link>
      </div>
    </div>
  );
};

