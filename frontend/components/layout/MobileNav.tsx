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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#EFE5D2]/95 backdrop-blur-md border-t border-[#E5D5BA] px-3 py-2 shadow-2xl safe-area-bottom">
      <div className="flex items-center justify-around relative">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          if (item.isPrimary) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center -top-5 relative group"
              >
                <div className="w-13 h-13 rounded-full bg-[#B65E3C] text-[#EFE5D2] flex items-center justify-center shadow-xl transform active:scale-95 group-hover:scale-105 transition-all border-3 border-[#EFE5D2]">
                  <Icon className="w-6 h-6 text-[#EFE5D2]" />
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
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
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
