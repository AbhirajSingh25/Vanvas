"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, LucideIcon } from "lucide-react";

interface CompactTravelModeCardProps {
  href: string;
  layer: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  badgeColor?: string;
  accentColor?: string;
}

export const CompactTravelModeCard: React.FC<CompactTravelModeCardProps> = ({
  href,
  layer,
  title,
  subtitle,
  icon: Icon,
  badgeColor = "bg-[#173B32] text-[#B49252]",
  accentColor = "text-[#173B32]",
}) => {
  return (
    <Link
      href={href}
      className="group bg-[#FAF7F0] rounded-2xl p-4 border-2 border-[#D8CBB2] hover:border-[#173B32] shadow-xs hover:shadow-md transition-all flex flex-col justify-between min-h-[130px] sm:min-h-[145px]"
    >
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className={`w-8 h-8 rounded-xl ${badgeColor} flex items-center justify-center shadow-xs`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-[9px] font-mono font-bold tracking-widest text-[#7B4D36] uppercase">
            {layer}
          </span>
        </div>

        <div>
          <h3 className={`text-base sm:text-lg font-serif font-black ${accentColor} group-hover:text-[#B65E3C] transition-colors leading-tight`}>
            {title}
          </h3>
          <p className="text-[11px] text-[#7B4D36] font-medium leading-snug line-clamp-1 mt-0.5">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-[#E5D5BA]/80 flex items-center justify-between text-[11px] font-bold text-[#173B32]">
        <span className="group-hover:text-[#B65E3C] transition-colors">Enter</span>
        <ArrowRight className="w-3.5 h-3.5 text-[#B65E3C] group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
};
