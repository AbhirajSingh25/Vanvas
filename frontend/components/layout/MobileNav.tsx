"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Calendar, MapPin, Sparkles } from "lucide-react";
import { useDensity } from "@/context/DensityContext";
import { useAskVanvas } from "@/context/AskVanvasContext";
import { ChaloLauncherModal } from "@/components/layout/ChaloLauncherModal";

export const MobileNav: React.FC = () => {
  const pathname = usePathname();
  const { isCompact } = useDensity();
  const { openAskVanvas } = useAskVanvas();
  const [chaloLauncherOpen, setChaloLauncherOpen] = useState(false);

  const navItems = [
    { label: "Home", hindi: "होम", href: "/", icon: Home },
    { label: "Explore", hindi: "खोजो", href: "/explore", icon: Compass },
    { label: "Chalo", hindi: "चलो", href: "#chalo", icon: Sparkles, isPrimary: true },
    { label: "Trips", hindi: "यात्रा", href: "/trips", icon: Calendar },
    { label: "Nearby", hindi: "आस-पास", href: "/nearby", icon: MapPin },
  ];

  return (
    <>
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#EFE5D2]/95 backdrop-blur-md border-t border-[#E5D5BA] px-3 pb-[max(0.35rem,env(safe-area-inset-bottom,0px))] shadow-2xl transition-all ${
          isCompact ? "pt-1" : "pt-1.5"
        }`}
      >
        <div className="flex items-center justify-around relative max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive =
              item.isPrimary
                ? chaloLauncherOpen
                : pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            if (item.isPrimary) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setChaloLauncherOpen(true)}
                  className={`flex flex-col items-center relative group cursor-pointer ${
                    isCompact ? "-top-3" : "-top-4"
                  }`}
                  aria-label="Open Chalo Action Center"
                >
                  <div
                    className={`rounded-full bg-[#B65E3C] text-[#EFE5D2] flex items-center justify-center shadow-lg transform active:scale-95 group-hover:scale-105 transition-all border-2 border-[#EFE5D2] ${
                      isCompact ? "w-11 h-11" : "w-12 h-12"
                    }`}
                  >
                    <Icon className={`${isCompact ? "w-4 h-4" : "w-5 h-5"} text-[#EFE5D2]`} />
                  </div>
                  <span className="text-[10px] font-bold text-[#B65E3C] mt-0.5 tracking-wider uppercase">
                    {item.hindi}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all duration-180 active:scale-95 relative ${
                  isActive
                    ? "text-[#173B32] font-bold bg-[#E5D5BA]/40"
                    : "text-[#20211D]/65 hover:text-[#173B32] hover:bg-[#E5D5BA]/20"
                }`}
              >
                <Icon className={`${isCompact ? "w-4 h-4" : "w-5 h-5"} transition-transform duration-180 ${isActive ? "stroke-[2.5] scale-105" : ""}`} />
                <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
                {isActive && (
                  <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[#173B32] animate-vanvas-scale" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <ChaloLauncherModal
        isOpen={chaloLauncherOpen}
        onClose={() => setChaloLauncherOpen(false)}
        onOpenAskVanvas={() => openAskVanvas()}
      />
    </>
  );
};

