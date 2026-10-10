"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { Emblem } from "@/components/brand/Emblem";
import { useAuth } from "@/context/AuthContext";
import {
  Compass, Calendar, MapPin, Sparkles, ChevronLeft,
  User as UserIcon, Bookmark, Settings, LogOut, LogIn, ChevronDown, Shield, ShieldCheck,
  X, MessageSquare
} from "lucide-react";
import { useAskVanvas } from "@/context/AskVanvasContext";
import { Avatar } from "@/components/ui/Avatar";
import { useDensity } from "@/context/DensityContext";
import { ConnectivityBanner } from "@/components/pwa/ConnectivityBanner";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isCompact } = useDensity();
  const { openAskVanvas } = useAskVanvas();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileAccountOpen, setMobileAccountOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileSheetRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // Measure and synchronize dynamic top sticky header offset for child pages (e.g. sticky tabs)
  useEffect(() => {
    if (typeof window === "undefined" || !headerRef.current) return;
    const updateOffset = () => {
      if (headerRef.current) {
        const rect = headerRef.current.getBoundingClientRect();
        document.documentElement.style.setProperty("--vanvas-top-offset", `${rect.height}px`);
      }
    };
    updateOffset();
    const resizeObserver = new ResizeObserver(updateOffset);
    resizeObserver.observe(headerRef.current);
    window.addEventListener("resize", updateOffset);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateOffset);
    };
  }, []);

  // Close profile dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (mobileSheetRef.current && !mobileSheetRef.current.contains(event.target as Node)) {
        setMobileAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setProfileDropdownOpen(false);
    setMobileAccountOpen(false);
    logout();
    router.push("/login");
  };

  const navLinks = [
    { name: "Explore", devanagari: "खोज", href: "/explore", icon: Compass },
    { name: "Plan a Trip", devanagari: "योजना", href: "/plan", icon: Sparkles },
    { name: "Road Trip", devanagari: "सड़क यात्रा", href: "/road-trip", icon: Compass },
    { name: "Day Escape", devanagari: "एक दिवसीय", href: "/one-day", icon: Compass },
    { name: "Trips", devanagari: "यात्रा", href: "/trips", icon: Calendar },
    { name: "Nearby", devanagari: "आस-पास", href: "/nearby", icon: MapPin },
  ];

  // Route metadata resolver for the Mobile App Bar
  const getRouteMeta = (path: string) => {
    if (path === "/") return { title: "VANVAS", hindi: "चलो निकलते हैं", isRoot: true, fallback: "/" };
    if (path === "/explore") return { title: "Explore", hindi: "खोज", isRoot: true, fallback: "/" };
    if (path === "/trips") return { title: "My Expeditions", hindi: "यात्रा डायरी", isRoot: true, fallback: "/" };
    if (path === "/nearby") return { title: "Nearby Radar", hindi: "आस-पास", isRoot: true, fallback: "/" };
    if (path === "/plan") return { title: "Plan Expedition", hindi: "योजना", isRoot: false, fallback: "/" };
    if (path === "/road-trip") return { title: "Road Trip", hindi: "सड़क यात्रा", isRoot: false, fallback: "/" };
    if (path === "/one-day") return { title: "Day Escape", hindi: "एक दिवसीय", isRoot: false, fallback: "/" };
    if (path === "/bookings") return { title: "My Bookings", hindi: "बुकिंग", isRoot: false, fallback: "/trips" };
    if (path === "/profile") return { title: "Travel Journal", hindi: "प्रोफ़ाइल", isRoot: false, fallback: "/" };
    if (path === "/settings") return { title: "Settings", hindi: "सेटिंग्स", isRoot: false, fallback: "/profile" };
    if (path === "/solo") return { title: "Solo Circles", hindi: "अकेले", isRoot: false, fallback: "/trips" };
    if (path === "/treks") return { title: "Himalayan Treks", hindi: "ट्रेक", isRoot: false, fallback: "/explore" };
    if (path === "/login") return { title: "Sign In", hindi: "लॉगिन", isRoot: false, fallback: "/" };
    if (path === "/register" || path === "/join") return { title: "Join VANVAS", hindi: "साइन अप", isRoot: false, fallback: "/login" };
    if (path === "/support") return { title: "Support", hindi: "सहायता", isRoot: false, fallback: "/" };
    if (path === "/terms") return { title: "Terms", hindi: "नियम", isRoot: false, fallback: "/" };
    if (path === "/privacy") return { title: "Privacy", hindi: "गोपनीयता", isRoot: false, fallback: "/" };
    if (path === "/admin") return { title: "Admin Console", hindi: "एडमिन", isRoot: false, fallback: "/" };

    if (path.startsWith("/explore/")) {
      const slug = path.split("/")[2]?.split("?")[0] || "";
      const cleanName = slug ? slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ") : "Destination";
      return { title: cleanName, hindi: "गंतव्य", isRoot: false, fallback: "/explore" };
    }
    if (path.startsWith("/trips/")) {
      return { title: "Expedition Cockpit", hindi: "यात्रा", isRoot: false, fallback: "/trips" };
    }
    if (path.startsWith("/treks/")) {
      const slug = path.split("/")[2]?.split("?")[0] || "";
      const cleanName = slug ? slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ") : "Trek";
      return { title: `${cleanName} Trek`, hindi: "ट्रेक", isRoot: false, fallback: "/treks" };
    }

    return { title: "VANVAS", hindi: "यात्रा", isRoot: false, fallback: "/" };
  };

  const currentRouteMeta = getRouteMeta(pathname);

  const handleBack = (fallback: string) => {
    if (typeof window !== "undefined" && window.history.length > 2) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-40 w-full border-b border-[#D8CBB2] bg-[#EFE5D2]/92 backdrop-blur-md transition-all pt-[env(safe-area-inset-top,0px)]"
      >
        <ConnectivityBanner />

        {/* ======================================================== */}
        {/* DESKTOP HEADER (>= xl)                                   */}
        {/* ======================================================== */}
        <div className={`hidden xl:flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 items-center justify-between transition-all ${
          isCompact ? "h-14 sm:h-16" : "h-16 sm:h-20"
        }`}>
          {/* Brand Logo & Wordmark */}
          <Logo size={isCompact ? "sm" : "md"} />

          {/* Desktop Editorial Navigation */}
          <nav className="flex items-center gap-1 xl:gap-2">
            {navLinks.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide interactive-pill flex items-center gap-1.5 ${
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

          {/* Desktop Header Right Actions */}
          <div className="flex items-center gap-3">
            {/* Ask VANVAS AI Copilot Button */}
            <button
              type="button"
              onClick={() => openAskVanvas()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#B49252]/60 bg-[#173B32] text-xs font-semibold text-[#FAF7F0] hover:bg-[#20453B] hover:shadow-md interactive-btn group cursor-pointer shadow-xs"
              title="Ask VANVAS Travel Assistant"
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
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#D8CBB2] bg-[#FAF4E8] text-xs text-[#20211D] hover:border-[#173B32] hover:shadow-sm interactive-btn group cursor-pointer"
                  aria-expanded={profileDropdownOpen}
                  aria-haspopup="true"
                >
                  <Avatar user={user} size="xs" borderColor="border-[#B49252]/40" />
                  <span className="font-medium max-w-[120px] truncate">{user.full_name}</span>
                  <ChevronDown className={`w-3 h-3 text-[#173B32]/70 transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#FAF7F0] border border-[#D8CBB2] rounded-2xl shadow-xl py-2 z-50 animate-vanvas-scale">
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
                        href="/bookings"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#20211D] hover:bg-[#E5D5BA]/50 hover:text-[#173B32] transition-colors font-medium"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-[#B49252]" />
                        <span>My Bookings &amp; Vouchers</span>
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
        </div>

        {/* ======================================================== */}
        {/* MOBILE APP HEADER (< xl)                                 */}
        {/* ======================================================== */}
        <div className="xl:hidden h-14 px-3 flex items-center justify-between max-w-lg mx-auto">
          {/* Left: Root Logo OR Sub-route Back Button */}
          <div className="flex items-center gap-1 min-w-[70px]">
            {currentRouteMeta.isRoot ? (
              <Link href="/" className="flex items-center gap-1.5 group cursor-pointer" aria-label="VANVAS Home">
                <Emblem size={28} variant="forest" />
                <span className="font-serif font-black text-sm tracking-wide text-[#173B32]">
                  VANVAS
                </span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => handleBack(currentRouteMeta.fallback)}
                className="flex items-center gap-1 py-1.5 px-2 -ml-1 rounded-xl text-[#173B32] hover:bg-[#E5D5BA]/50 active:scale-95 transition-all cursor-pointer"
                aria-label="Go Back"
              >
                <ChevronLeft className="w-5 h-5 text-[#173B32] stroke-[2.5]" />
                <Emblem size={22} variant="forest" />
              </button>
            )}
          </div>

          {/* Center: Contextual Title */}
          <div className="flex-1 text-center px-2 min-w-0">
            <h1 className="text-xs sm:text-sm font-serif font-bold text-[#173B32] truncate">
              {currentRouteMeta.title}
            </h1>
            {currentRouteMeta.hindi && (
              <p className="text-[10px] font-devanagari text-[#7B4D36] opacity-75 truncate -mt-0.5">
                {currentRouteMeta.hindi}
              </p>
            )}
          </div>

          {/* Right: User Avatar / Account Sheet OR Sign In */}
          <div className="flex items-center justify-end min-w-[70px]">
            {user ? (
              <button
                type="button"
                onClick={() => setMobileAccountOpen(true)}
                className="flex items-center gap-1 p-1 rounded-full border border-[#D8CBB2] bg-[#FAF4E8] text-[#173B32] active:scale-95 transition-transform cursor-pointer"
                aria-label="Open User Account Menu"
              >
                <Avatar user={user} size="xs" borderColor="border-[#B49252]/50" />
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#D8CBB2] bg-[#FAF4E8] text-[11px] font-semibold text-[#173B32] active:scale-95 transition-transform"
              >
                <LogIn className="w-3 h-3 text-[#B49252]" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* MOBILE ACCOUNT SLIDE-OVER SHEET                          */}
        {/* ======================================================== */}
        {mobileAccountOpen && user && (
          <div
            className="xl:hidden fixed inset-0 z-50 bg-[#0F2924]/70 backdrop-blur-xs flex items-end justify-center animate-vanvas-fade"
            onClick={() => setMobileAccountOpen(false)}
          >
            <div
              ref={mobileSheetRef}
              className="bg-[#FAF7F0] border-t-2 border-[#E5D5BA] rounded-t-3xl w-full max-w-md shadow-2xl p-5 space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] animate-vanvas-sheet"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sheet Drag Indicator & Header */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-1 rounded-full bg-[#D8CBB2]" />
                <div className="w-full flex items-center justify-between pt-1">
                  <div className="flex items-center gap-3">
                    <Avatar user={user} size="md" borderColor="border-[#B49252]" />
                    <div className="text-left min-w-0">
                      <div className="font-serif font-bold text-sm text-[#173B32] truncate">
                        {user.full_name}
                      </div>
                      <div className="text-xs text-[#7B4D36] truncate">
                        {user.email}
                      </div>
                      <span className="inline-block mt-0.5 px-2 py-0.2 rounded-full bg-[#173B32]/10 text-[9px] font-bold text-[#173B32] uppercase tracking-wider">
                        {user.role === "admin" ? "Admin" : "Verified Traveler"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileAccountOpen(false)}
                    className="p-2 rounded-full text-[#173B32] hover:bg-[#E5D5BA]/60 cursor-pointer"
                    aria-label="Close Profile Menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Sheet Navigation Items */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E5D5BA]">
                <Link
                  href="/profile"
                  onClick={() => setMobileAccountOpen(false)}
                  className="p-3 rounded-2xl bg-white border border-[#E5D5BA] flex items-center gap-2.5 active:scale-95 transition-transform"
                >
                  <UserIcon className="w-4 h-4 text-[#B49252]" />
                  <div className="text-left">
                    <div className="text-xs font-bold text-[#173B32]">Journal</div>
                    <div className="text-[10px] text-[#7B4D36]">Profile & Memories</div>
                  </div>
                </Link>

                <Link
                  href="/bookings"
                  onClick={() => setMobileAccountOpen(false)}
                  className="p-3 rounded-2xl bg-white border border-[#E5D5BA] flex items-center gap-2.5 active:scale-95 transition-transform"
                >
                  <ShieldCheck className="w-4 h-4 text-[#B49252]" />
                  <div className="text-left">
                    <div className="text-xs font-bold text-[#173B32]">Bookings</div>
                    <div className="text-[10px] text-[#7B4D36]">Vouchers & Passes</div>
                  </div>
                </Link>

                <Link
                  href="/profile?tab=saved"
                  onClick={() => setMobileAccountOpen(false)}
                  className="p-3 rounded-2xl bg-white border border-[#E5D5BA] flex items-center gap-2.5 active:scale-95 transition-transform"
                >
                  <Bookmark className="w-4 h-4 text-[#B49252]" />
                  <div className="text-left">
                    <div className="text-xs font-bold text-[#173B32]">Saved Gems</div>
                    <div className="text-[10px] text-[#7B4D36]">Favorites</div>
                  </div>
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setMobileAccountOpen(false)}
                  className="p-3 rounded-2xl bg-white border border-[#E5D5BA] flex items-center gap-2.5 active:scale-95 transition-transform"
                >
                  <Settings className="w-4 h-4 text-[#B49252]" />
                  <div className="text-left">
                    <div className="text-xs font-bold text-[#173B32]">Settings</div>
                    <div className="text-[10px] text-[#7B4D36]">Preferences</div>
                  </div>
                </Link>
              </div>

              {/* Copilot Action inside Sheet */}
              <button
                type="button"
                onClick={() => {
                  setMobileAccountOpen(false);
                  openAskVanvas();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#173B32] text-[#FAF7F0] font-semibold text-xs flex items-center justify-between shadow-xs cursor-pointer active:scale-95 transition-transform"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#B49252]" />
                  <span>Ask VANVAS Travel Copilot</span>
                </div>
                <span className="font-devanagari text-[11px] text-[#B49252]">पूछें</span>
              </button>

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2 px-4 rounded-xl border border-[#B65E3C]/40 text-[#B65E3C] hover:bg-[#B65E3C]/10 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out of VANVAS</span>
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
