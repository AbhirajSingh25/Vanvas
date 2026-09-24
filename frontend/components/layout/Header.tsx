"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/context/AuthContext";
import {
  Compass, Calendar, MapPin, Sparkles, Menu, X, SlidersHorizontal,
  User as UserIcon, Bookmark, Settings, LogOut, LogIn, ChevronDown, Shield
} from "lucide-react";
import { AskVanvasModal } from "@/components/copilot/AskVanvasModal";
import { FloatingCopilotTrigger } from "@/components/copilot/FloatingCopilotTrigger";
import { resolveAvatarUrl } from "@/lib/api";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [askVanvasOpen, setAskVanvasOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
    logout();
    router.push("/login");
  };

  const navLinks = [
    { name: "Explore", devanagari: "खोज", href: "/explore", icon: Compass },
    { name: "Trips", devanagari: "यात्रा", href: "/trips", icon: Calendar },
    { name: "Plan", devanagari: "योजना", href: "/plan", icon: Sparkles },
    { name: "Nearby", devanagari: "आस-पास", href: "/nearby", icon: MapPin },
  ];

  const getInitials = (name?: string) => {
    if (!name) return "V";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const resolvedAvatar = resolveAvatarUrl(user?.avatar_url);

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

            {/* Authenticated User Menu vs Guest Login Button */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#D8CBB2] bg-[#FAF4E8] text-xs text-[#20211D] hover:border-[#173B32] hover:shadow-sm transition-all group cursor-pointer"
                  aria-expanded={profileDropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="w-6 h-6 rounded-full bg-[#173B32] group-hover:bg-[#B65E3C] text-[#EFE5D2] flex items-center justify-center font-serif font-bold text-[10px] transition-colors border border-[#B49252]/40 overflow-hidden">
                    {resolvedAvatar ? (
                      <img
                        src={resolvedAvatar}
                        alt={user.full_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      getInitials(user.full_name)
                    )}
                  </div>
                  <span className="font-medium max-w-[120px] truncate">{user.full_name}</span>
                  <ChevronDown className={`w-3 h-3 text-[#173B32]/70 transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#FAF7F0] border border-[#D8CBB2] rounded-2xl shadow-xl py-2 z-50 animate-fadeIn">
                    {/* User Header */}
                    <div className="px-4 py-3 border-b border-[#D8CBB2]/60">
                      <div className="font-serif font-bold text-sm text-[#173B32] truncate">
                        {user.full_name}
                      </div>
                      <div className="text-[11px] text-[#20211D]/60 truncate mt-0.5">
                        {user.email}
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#173B32]/10 text-[10px] font-bold text-[#173B32] uppercase tracking-wider">
                        <Shield className="w-2.5 h-2.5" />
                        <span>{user.role === "admin" ? "Admin" : "Verified Traveler"}</span>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#20211D] hover:bg-[#E5D5BA]/50 hover:text-[#173B32] transition-colors font-medium"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-[#B49252]" />
                        <span>Profile & Travel Journal</span>
                      </Link>

                      <Link
                        href="/profile?tab=saved"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#20211D] hover:bg-[#E5D5BA]/50 hover:text-[#173B32] transition-colors font-medium"
                      >
                        <Bookmark className="w-3.5 h-3.5 text-[#B49252]" />
                        <span>Saved Places & Gems</span>
                      </Link>

                      <Link
                        href="/trips"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#20211D] hover:bg-[#E5D5BA]/50 hover:text-[#173B32] transition-colors font-medium"
                      >
                        <Calendar className="w-3.5 h-3.5 text-[#B49252]" />
                        <span>My Expeditions</span>
                      </Link>

                      <Link
                        href="/settings"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#20211D] hover:bg-[#E5D5BA]/50 hover:text-[#173B32] transition-colors font-medium"
                      >
                        <Settings className="w-3.5 h-3.5 text-[#B49252]" />
                        <span>Account & Settings</span>
                      </Link>
                    </div>

                    {/* Logout Footer */}
                    <div className="pt-1 border-t border-[#D8CBB2]/60">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#B65E3C] hover:bg-[#B65E3C]/10 transition-colors font-semibold text-left cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-[#B65E3C]" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#D8CBB2] bg-[#FAF4E8] text-xs font-semibold text-[#173B32] hover:bg-[#E5D5BA] hover:shadow-sm transition-all"
              >
                <LogIn className="w-3.5 h-3.5 text-[#B49252]" />
                <span>Sign In</span>
                <span className="font-devanagari text-[10px] text-[#B49252] font-normal">लॉगिन</span>
              </Link>
            )}

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
          <div className="md:hidden border-b border-[#D8CBB2] bg-[#FAF4E8] px-4 pt-3 pb-6 space-y-3 animate-fadeIn">
            {/* Ask VANVAS in Mobile Drawer */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setAskVanvasOpen(true);
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#173B32] text-[#FAF7F0] font-semibold text-sm shadow-sm cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#B49252]" />
                <span>Ask VANVAS Copilot</span>
              </div>
              <span className="font-devanagari text-xs text-[#B49252]">पूछें</span>
            </button>

            {/* Mobile User Identity Card */}
            {user ? (
              <div className="p-3 bg-[#FAF7F0] rounded-2xl border border-[#D8CBB2] space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#173B32] text-[#EFE5D2] flex items-center justify-center font-serif font-bold text-xs overflow-hidden border border-[#B49252]/40">
                    {resolvedAvatar ? (
                      <img
                        src={resolvedAvatar}
                        alt={user.full_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      getInitials(user.full_name)
                    )}
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <div className="text-xs font-bold text-[#173B32] truncate">{user.full_name}</div>
                    <div className="text-[10px] text-[#20211D]/65 truncate">{user.email}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#D8CBB2]/50 text-xs">
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white border border-[#D8CBB2] font-semibold text-[#173B32]"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-[#B49252]" />
                    <span>Profile</span>
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white border border-[#D8CBB2] font-semibold text-[#173B32]"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#B49252]" />
                    <span>Settings</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white border border-[#D8CBB2] text-xs font-bold text-[#173B32]"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#B49252]" />
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#173B32] text-xs font-bold text-[#EFE5D2]"
                >
                  <span>Join VANVAS</span>
                </Link>
              </div>
            )}

            {/* Navigation Links */}
            <div className="space-y-1">
              {navLinks.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold ${
                      isActive ? "bg-[#173B32] text-[#EFE5D2]" : "text-[#20211D] hover:bg-[#E5D5BA]"
                    }`}
                  >
                    <span>{item.name}</span>
                    <span className="font-devanagari text-[11px] opacity-70">({item.devanagari})</span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile Plan Button */}
            <div className="pt-2">
              <Link
                href="/plan"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#B65E3C] text-[#EFE5D2] font-bold text-xs uppercase tracking-wider shadow-md"
              >
                <span>Plan My Trip</span>
                <span className="font-devanagari text-xs">चलो निकलते हैं</span>
              </Link>
            </div>

            {/* Mobile Logout if authenticated */}
            {user && (
              <div className="pt-2 border-t border-[#D8CBB2]/60">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-[#B65E3C] hover:bg-[#B65E3C]/10 rounded-xl"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out of VANVAS</span>
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Mobile Floating AI Copilot Trigger */}
      <FloatingCopilotTrigger
        isOpen={askVanvasOpen}
        onClick={() => setAskVanvasOpen(true)}
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
