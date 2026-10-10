"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Calendar, User, Sparkles } from "lucide-react";
import { useDensity } from "@/context/DensityContext";
import { useAskVanvas } from "@/context/AskVanvasContext";
import { ChaloLauncherModal } from "@/components/layout/ChaloLauncherModal";

export const MobileNav: React.FC = () => {
  const pathname = usePathname();
  const { isCompact } = useDensity();
  const { openAskVanvas } = useAskVanvas();
  const [chaloLauncherOpen, setChaloLauncherOpen] = useState(false);

  const isHomeActive = pathname === "/";
  const isExploreActive = pathname.startsWith("/explore") || pathname.startsWith("/treks") || pathname.startsWith("/nearby");
  const isTripsActive =
    pathname.startsWith("/trips") ||
    pathname.startsWith("/bookings") ||
    pathname.startsWith("/plan") ||
    pathname.startsWith("/road-trip") ||
    pathname.startsWith("/one-day");
  const isProfileActive = pathname.startsWith("/profile") || pathname.startsWith("/settings") || pathname.startsWith("/login") || pathname.startsWith("/register");

  const navItems = [
    { label: "Home", hindi: "होम", href: "/", icon: Home, isActive: isHomeActive },
    { label: "Explore", hindi: "खोजो", href: "/explore", icon: Compass, isActive: isExploreActive },
    { label: "Chalo", hindi: "चलो", href: "#chalo", icon: Sparkles, isPrimary: true, isActive: chaloLauncherOpen },
    { label: "Trips", hindi: "यात्रा", href: "/trips", icon: Calendar, isActive: isTripsActive },
    { label: "Journal", hindi: "डायरी", href: "/profile", icon: User, isActive: isProfileActive },
  ];

  return (
    <>
      <nav
        aria-label="Mobile Navigation"
        className={`xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#EFE5D2]/95 backdrop-blur-md border-t border-[#E5D5BA] px-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] shadow-2xl transition-all ${
          isCompact ? "pt-1" : "pt-1.5"
        }`}
      >
        <div className="flex items-center justify-around relative max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;

            if (item.isPrimary) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setChaloLauncherOpen(true)}
                  className={`flex flex-col items-center justify-center relative group cursor-pointer select-none touch-manipulation min-w-[52px] min-h-[48px] ${
                    isCompact ? "-top-3" : "-top-3.5"
                  }`}
                  aria-label="Open Chalo Action Center"
                >
                  <div
                    className={`rounded-full bg-[#B65E3C] text-[#EFE5D2] flex items-center justify-center shadow-lg active:scale-95 group-hover:scale-105 transition-all border-2 border-[#EFE5D2] ${
                      isCompact ? "w-11 h-11" : "w-12 h-12"
                    }`}
                  >
                    <Icon className={`${isCompact ? "w-4 h-4" : "w-5 h-5"} text-[#EFE5D2] stroke-[2.2]`} />
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
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-180 active:scale-95 relative select-none touch-manipulation min-w-[54px] min-h-[48px] ${
                  item.isActive
                    ? "text-[#173B32] font-bold bg-[#E5D5BA]/45"
                    : "text-[#20211D]/65 hover:text-[#173B32] hover:bg-[#E5D5BA]/20"
                }`}
              >
                <Icon
                  className={`${isCompact ? "w-4 h-4" : "w-5 h-5"} transition-transform duration-180 ${
                    item.isActive ? "stroke-[2.5] scale-105" : "stroke-[1.8]"
                  }`}
                />
                <span className="text-[10px] mt-0.5 font-medium leading-none">{item.label}</span>
                {item.isActive && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#173B32] animate-vanvas-scale" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <ChaloLauncherModal
        isOpen={chaloLauncherOpen}
        onClose={() => setChaloLauncherOpen(false)}
        onOpenAskVanvas={() => openAskVanvas()}
      />
    </>
  );
};

