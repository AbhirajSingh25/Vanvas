"use client";

import React from "react";
import { motion } from "motion/react";
import { tabIndicatorTransition } from "@/lib/motion";

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number | string;
  badge?: string;
}

export interface VanvasTabBarProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onTabChange: (tabId: T) => void;
  layoutId?: string;
  variant?: "dark" | "parchment";
  className?: string;
  size?: "sm" | "md";
}

export function VanvasTabBar<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  layoutId = "vanvasActiveTabPill",
  variant = "dark",
  className = "",
  size = "md",
}: VanvasTabBarProps<T>) {
  const isDark = variant === "dark";

  return (
    <div
      role="tablist"
      aria-label="Navigation Tabs"
      className={`flex items-center p-1 rounded-2xl overflow-x-auto no-scrollbar transition-all ${
        isDark
          ? "bg-[#0F2924] border border-[#B49252]/30 shadow-inner"
          : "bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-xs"
      } ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const IconComp = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 min-w-max py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 relative cursor-pointer select-none active:scale-[0.98] ${
              size === "sm" ? "py-1.5 px-2.5 text-[11px]" : "py-2 px-3.5 text-xs"
            } ${
              isActive
                ? isDark
                  ? "text-[#173B32]"
                  : "text-[#FAF4E8]"
                : isDark
                ? "text-[#D8DED5]/70 hover:text-white"
                : "text-[#7B4D36] hover:text-[#173B32]"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                transition={tabIndicatorTransition}
                className={`absolute inset-0 rounded-xl z-0 shadow-xs ${
                  isDark ? "bg-[#EFE5D2]" : "bg-[#173B32]"
                }`}
              />
            )}

            {IconComp && (
              <IconComp
                className={`w-3.5 h-3.5 relative z-10 shrink-0 ${
                  isActive
                    ? isDark
                      ? "text-[#173B32]"
                      : "text-[#B49252]"
                    : isDark
                    ? "text-[#B49252]"
                    : "text-[#B65E3C]"
                }`}
              />
            )}

            <span className="relative z-10 truncate">{tab.label}</span>

            {tab.count !== undefined && (
              <span
                className={`relative z-10 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ml-0.5 ${
                  isActive
                    ? isDark
                      ? "bg-[#173B32]/15 text-[#173B32]"
                      : "bg-white/20 text-white"
                    : isDark
                    ? "bg-white/10 text-[#D8DED5]"
                    : "bg-[#E5D5BA]/60 text-[#7B4D36]"
                }`}
              >
                {tab.count}
              </span>
            )}

            {tab.badge && (
              <span className="relative z-10 text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-[#B65E3C] text-white font-bold ml-1">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
