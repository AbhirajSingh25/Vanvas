"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Calendar, MapPin, Sparkles } from "lucide-react";

export const MobileNav: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", hindi: "होम", href: "/", icon: Home },
    { label: "Explore", hindi: "खोजो", href: "/explore", icon: Compass },
    { label: "Plan", hindi: "चलो", href: "/plan", icon: Sparkles, isPrimary: true },
    { label: "Trips", hindi: "यात्रा", href: "/trips", icon: Calendar },
    { label: "Nearby", hindi: "आस-पास", href: "/nearby", icon: MapPin },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#EFE5D2]/95 backdrop-blur-md border-t border-[#E5D5BA] px-3 pt-1.5 pb-[max(0.35rem,env(safe-area-inset-bottom,0px))] shadow-2xl">
      <div className="flex items-center justify-around relative max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          if (item.isPrimary) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center -top-4 relative group"
              >
                <div className="w-12 h-12 rounded-full bg-[#B65E3C] text-[#EFE5D2] flex items-center justify-center shadow-lg transform active:scale-95 group-hover:scale-105 transition-all border-2 border-[#EFE5D2]">
                  <Icon className="w-5 h-5 text-[#EFE5D2]" />
                </div>
                <span className="text-[10px] font-bold text-[#B65E3C] mt-0.5 tracking-wider uppercase">
                  {item.hindi}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors ${
                isActive ? "text-[#173B32] font-bold" : "text-[#20211D]/65 hover:text-[#173B32]"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
