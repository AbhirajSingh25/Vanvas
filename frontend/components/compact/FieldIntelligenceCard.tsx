"use client";

import React from "react";
import { Sun, Mountain, Navigation, Globe, ChevronRight, CheckCircle2 } from "lucide-react";

export interface FieldIntelligenceItem {
  id: "seasonality" | "clothing" | "transport" | "etiquette";
  title: string;
  hindiTitle?: string;
  points: string[];
  footerKey: string;
  footerValue: string;
  iconName: "sun" | "mountain" | "navigation" | "globe";
}

interface FieldIntelligenceCardProps {
  item: FieldIntelligenceItem;
  onExpand: (id: "seasonality" | "clothing" | "transport" | "etiquette") => void;
}

export const FieldIntelligenceCard: React.FC<FieldIntelligenceCardProps> = ({ item, onExpand }) => {
  const getIcon = () => {
    switch (item.iconName) {
      case "sun":
        return <Sun className="w-4 h-4 text-[#B65E3C]" />;
      case "mountain":
        return <Mountain className="w-4 h-4 text-[#B65E3C]" />;
      case "navigation":
        return <Navigation className="w-4 h-4 text-[#B65E3C]" />;
      case "globe":
      default:
        return <Globe className="w-4 h-4 text-[#B65E3C]" />;
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onExpand(item.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onExpand(item.id);
        }
      }}
      className="p-5 rounded-2xl bg-[#EFE5D2] dark:bg-[#1C2E27] hover:bg-[#EAE0CB] dark:hover:bg-[#253D34] border border-[#E5D5BA] dark:border-[#2C3B34] hover:border-[#173B32] dark:hover:border-[#B49252] transition-all flex flex-col justify-between space-y-4 cursor-pointer group shadow-2xs hover:shadow-md h-full focus:outline-none focus:ring-2 focus:ring-[#173B32]"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#173B32] dark:text-[#FAF7F0]">
            {getIcon()}
            <span>{item.title}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#B65E3C] dark:text-[#E28C68] group-hover:translate-x-0.5 transition-transform" />
        </div>

        <ul className="space-y-1.5 text-xs text-[#20211D]/85 dark:text-[#EAE6DF]/90 font-sans">
          {item.points.slice(0, 3).map((pt, i) => (
            <li key={i} className="flex items-start gap-2 leading-relaxed">
              <span className="text-[#B65E3C] dark:text-[#E28C68] font-bold mt-0.5">•</span>
              <span className="line-clamp-2">{pt}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-2 border-t border-[#E5D5BA]/60 dark:border-[#2C3B34] flex items-center justify-between text-[11px] font-mono text-[#7B4D36] dark:text-[#C5A898]">
        <span>
          {item.footerKey}: <strong className="text-[#173B32] dark:text-[#FAF7F0]">{item.footerValue}</strong>
        </span>
        <span className="text-[#B65E3C] dark:text-[#E28C68] font-bold group-hover:underline">
          Details →
        </span>
      </div>
    </div>
  );
};

