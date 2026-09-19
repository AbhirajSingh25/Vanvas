"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/context/AuthContext";
import { Compass, Calendar, MapPin, Sparkles, Menu, X, SlidersHorizontal, User as UserIcon } from "lucide-react";
import { ProfilePreferencesModal } from "@/components/profile/ProfilePreferencesModal";
import { AskVanvasModal } from "@/components/copilot/AskVanvasModal";
import { FloatingCopilotTrigger } from "@/components/copilot/FloatingCopilotTrigger";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [askVanvasOpen, setAskVanvasOpen] = useState(false);

  const navLinks = [
    { name: "Explore", devanagari: "खोज", href: "/explore", icon: Compass },
    { name: "Trips", devanagari: "यात्रा", href: "/trips", icon: Calendar },
    { name: "Plan", devanagari: "योजना", href: "/plan", icon: Sparkles },
    { name: "Nearby", devanagari: "आस-पास", href: "/nearby", icon: MapPin },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#D8CBB2] bg-[#EFE5D2]/92 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo & Wordmark */}
          <Logo size="md" />

          {/* Desktop Editorial Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? "bg-[#173B32] text-[#EFE5D2] shadow-sm font-bold"
                      : "text-[#20211D]/80 hover:text-[#173B32] hover:bg-[#E5D5BA]/60"
                  }`}
                >
                  <span>{item.name}</span>
                  <span className="font-devanagari text-[10px] opacity-60 font-normal">
                    ({item.devanagari})
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Header Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Ask VANVAS AI Copilot Button */}
            <button
              type="button"
              onClick={() => setAskVanvasOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#B49252]/60 bg-[#173B32] text-xs font-semibold text-[#FAF7F0] hover:bg-[#20453B] hover:shadow-md transition-all group cursor-pointer shadow-xs"
              title="Ask VANVAS Gemini Copilot"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#B49252] group-hover:rotate-12 transition-transform" />
              <span>Ask VANVAS</span>
              <span className="font-devanagari text-[10px] text-[#B49252] font-normal">पूछें</span>
            </button>

            {/* User Profile Pill - Opens Preferences Editor */}
            <button
              type="button"
              onClick={() => setProfileModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#D8CBB2] bg-[#FAF4E8] text-xs text-[#20211D] hover:border-[#173B32] hover:shadow-sm transition-all group cursor-pointer"
              title="Edit Profile & Travel Preferences"
            >
              <div className="w-6 h-6 rounded-full bg-[#173B32] group-hover:bg-[#B65E3C] text-[#EFE5D2] flex items-center justify-center font-serif font-bold text-[10px] transition-colors">
                {user?.full_name?.charAt(0) || "T"}
              </div>
              <span className="font-medium max-w-[110px] truncate">{user?.full_name || "Traveller"}</span>
              <SlidersHorizontal className="w-3 h-3 text-[#B49252] opacity-70 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Primary Terracotta CTA */}
            <Link
              href="/plan"
              className="px-5 py-2.5 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] text-xs font-bold tracking-wider uppercase shadow-md hover:shadow-lg transition-all transform active:scale-95 flex items-center gap-2 border border-[#7B4D36]/20"
            >
              <span>Plan My Trip</span>
              <span className="font-devanagari text-[10px] opacity-80 lowercase">चलो</span>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-[#173B32] hover:bg-[#E5D5BA] transition-colors"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#D8CBB2] bg-[#FAF4E8] px-4 pt-3 pb-6 space-y-2 animate-fadeIn">
            {/* Ask VANVAS in Mobile Drawer */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setAskVanvasOpen(true);
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#173B32] text-[#FAF7F0] font-semibold text-sm shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#B49252]" />
                <span>Ask VANVAS Copilot</span>
              </div>
              <span className="font-devanagari text-xs text-[#B49252]">पूछें</span>
            </button>

            {/* User Profile Pill in Mobile Drawer */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setProfileModalOpen(true);
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#FAF4E8] border border-[#D8CBB2] text-sm font-semibold text-[#173B32] hover:bg-[#E5D5BA]"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#173B32] text-[#EFE5D2] flex items-center justify-center font-serif font-bold text-xs">
                  {user?.full_name?.charAt(0) || "T"}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-[#173B32]">{user?.full_name || "Traveller"}</div>
                  <div className="text-[10px] text-[#20211D]/65">Travel Preferences & Identity</div>
                </div>
              </div>
              <span className="font-devanagari text-xs text-[#B49252] font-semibold">मेरी पसंद</span>
            </button>

            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold ${
                    isActive ? "bg-[#173B32] text-[#EFE5D2]" : "text-[#20211D] hover:bg-[#E5D5BA]"
                  }`}
                >
                  <span>{item.name}</span>
                  <span className="font-devanagari text-xs opacity-70">({item.devanagari})</span>
                </Link>
              );
            })}
            <div className="pt-3">
              <Link
                href="/plan"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#B65E3C] text-[#EFE5D2] font-bold text-xs uppercase tracking-wider shadow-md"
              >
                <span>Plan My Trip</span>
                <span className="font-devanagari text-sm">चलो निकलते हैं</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Floating AI Copilot Trigger */}
      <FloatingCopilotTrigger
        isOpen={askVanvasOpen}
        onClick={() => setAskVanvasOpen(true)}
      />

      {/* Global Profile Preferences Modal */}
      <ProfilePreferencesModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      {/* Global Ask VANVAS AI Copilot Modal */}
      <AskVanvasModal
        isOpen={askVanvasOpen}
        onClose={() => setAskVanvasOpen(false)}
        defaultDestination={pathname.startsWith("/explore/") ? pathname.replace("/explore/", "").split("/")[0].replace(/-/g, " ") : undefined}
      />
    </>
  );
};
