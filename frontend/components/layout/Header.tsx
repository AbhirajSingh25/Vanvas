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
  SlidersHorizontal, Check
} from "lucide-react";
import { useAskVanvas } from "@/context/AskVanvasContext";
import { Avatar } from "@/components/ui/Avatar";
import { useDensity } from "@/context/DensityContext";
import { DensitySwitcher } from "@/components/ui/DensitySwitcher";
import { ConnectivityBanner } from "@/components/pwa/ConnectivityBanner";
import { motion, AnimatePresence } from "motion/react";
import { popoverVariants } from "@/lib/motion";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { density, setDensity, isCompact } = useDensity();
  const { openAskVanvas } = useAskVanvas();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileAccountOpen, setMobileAccountOpen] = useState(false);
  const [densityMenuOpen, setDensityMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const densityRef = useRef<HTMLDivElement>(null);
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

  // Close menus on outside click or touch
  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setProfileDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setMobileAccountOpen(false);
      }
      if (densityRef.current && !densityRef.current.contains(target)) {
        setDensityMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileDropdownOpen(false);
        setMobileAccountOpen(false);
        setDensityMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Close menus when route changes
  useEffect(() => {
    setProfileDropdownOpen(false);
    setMobileAccountOpen(false);
    setDensityMenuOpen(false);
  }, [pathname]);

  // Support Android Back button dismissing the open popover before route change
  useEffect(() => {
    if (!mobileAccountOpen) return;
    const handlePopState = () => {
      setMobileAccountOpen(false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [mobileAccountOpen]);

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
    if (path === "/") return { title: "", hindi: "", isRoot: true, fallback: "/" };
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
                    ? "bg-[#173B32] text-[#EFE5D2] shadow-xs font-bold"
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
          {/* Global Density Switcher */}
          <DensitySwitcher showLabel={true} />

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
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#D8CBB2] bg-[#FAF4E8] text-xs text-[#20211D] hover:border-[#173B32] hover:shadow-xs interactive-btn group cursor-pointer"
                aria-expanded={profileDropdownOpen}
                aria-haspopup="true"
              >
                <Avatar user={user} size="xs" borderColor="border-[#B49252]/40" />
                <span className="font-medium max-w-[120px] truncate">{user.full_name}</span>
                <ChevronDown className={`w-3 h-3 text-[#173B32]/70 transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Desktop Profile Popover */}
              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    key="desktop-profile-popover"
                    variants={popoverVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    style={{ transformOrigin: "top right" }}
                    className="absolute right-0 mt-2 w-64 bg-[#FAF7F0] border border-[#D8CBB2] rounded-2xl shadow-xl py-2 z-50 divide-y divide-[#D8CBB2]/50"
                  >
                    <div className="px-4 py-3">
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
                        <span>Profile &amp; Travel Journal</span>
                      </Link>

                      <Link
                        href="/profile?tab=saved"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#20211D] hover:bg-[#E5D5BA]/50 hover:text-[#173B32] transition-colors font-medium"
                      >
                        <Bookmark className="w-3.5 h-3.5 text-[#B49252]" />
                        <span>Saved Places &amp; Gems</span>
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
                        <span>Account &amp; Settings</span>
                      </Link>
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#B65E3C] hover:bg-[#B65E3C]/10 transition-colors font-semibold text-left cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-[#B65E3C]" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#D8CBB2] bg-[#FAF4E8] text-xs font-semibold text-[#173B32] hover:bg-[#E5D5BA] hover:shadow-xs transition-all"
            >
              <LogIn className="w-3.5 h-3.5 text-[#B49252]" />
              <span>Sign In</span>
              <span className="font-devanagari text-[10px] text-[#B49252] font-normal">लॉगिन</span>
            </Link>
          )}

          {/* Primary Terracotta CTA */}
          <Link
            href="/plan"
            className="px-5 py-2.5 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] text-xs font-bold tracking-wider uppercase shadow-xs hover:shadow-md transition-all transform active:scale-95 flex items-center gap-2 border border-[#7B4D36]/20"
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

        {/* Center: Contextual Title (displayed on sub-routes, left logo alone on home route) */}
        <div className="flex-1 text-center px-2 min-w-0">
          {currentRouteMeta.title ? (
            <>
              <h1 className="text-xs sm:text-sm font-serif font-bold text-[#173B32] truncate">
                {currentRouteMeta.title}
              </h1>
              {currentRouteMeta.hindi && (
                <p className="text-[10px] font-devanagari text-[#7B4D36] opacity-75 truncate -mt-0.5">
                  {currentRouteMeta.hindi}
                </p>
              )}
            </>
          ) : null}
        </div>

        {/* Right: Mobile Density Control + User Avatar / Sign In */}
        <div className="flex items-center justify-end gap-1.5 min-w-[70px]">
          {/* Compact Mobile Density Popover */}
          <div className="relative" ref={densityRef}>
            <button
              type="button"
              data-testid="header-density-toggle"
              onClick={() => setDensityMenuOpen(!densityMenuOpen)}
              className={`p-1.5 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                densityMenuOpen
                  ? "bg-[#173B32] text-[#FAF7F0] border-[#173B32]"
                  : "border-[#D8CBB2] bg-[#FAF4E8] text-[#173B32] hover:bg-[#E5D5BA]/50"
              }`}
              aria-label="Change layout density (Original or Compact)"
              aria-expanded={densityMenuOpen}
              title="Change layout density"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#173B32]" />
            </button>

            {/* Accessible Density Popover with Unified Motion */}
            <AnimatePresence>
              {densityMenuOpen && (
                <motion.div
                  key="mobile-density-popover"
                  variants={popoverVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  style={{ transformOrigin: "top right" }}
                  role="dialog"
                  aria-label="Layout view options"
                  className="absolute right-0 mt-2 w-56 bg-[#FAF7F0] border border-[#D8CBB2] rounded-2xl shadow-xl p-2.5 z-50 space-y-1.5"
                >
                  <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#7B4D36]">
                    PAGE VIEW DENSITY
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setDensity("original");
                      setDensityMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      !isCompact
                        ? "bg-[#173B32] text-[#FAF4E8] font-bold shadow-xs"
                        : "text-[#20211D] hover:bg-[#E5D5BA]/60"
                    }`}
                  >
                    <div>
                      <div className="font-serif text-xs font-bold">Original</div>
                      <div className={`text-[10px] ${!isCompact ? "text-[#EFE5D2]/80" : "text-[#7B4D36]"}`}>
                        Immersive &amp; spacious
                      </div>
                    </div>
                    {!isCompact && <Check className="w-4 h-4 text-[#B49252]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDensity("compact");
                      setDensityMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      isCompact
                        ? "bg-[#173B32] text-[#FAF4E8] font-bold shadow-xs"
                        : "text-[#20211D] hover:bg-[#E5D5BA]/60"
                    }`}
                  >
                    <div>
                      <div className="font-serif text-xs font-bold">Compact</div>
                      <div className={`text-[10px] ${isCompact ? "text-[#EFE5D2]/80" : "text-[#7B4D36]"}`}>
                        Information-dense cards
                      </div>
                    </div>
                    {isCompact && <Check className="w-4 h-4 text-[#B49252]" />}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Account Popover Trigger & Anchored Menu */}
          {user ? (
            <div className="relative" ref={mobileMenuRef}>
              <button
                type="button"
                onClick={() => setMobileAccountOpen(!mobileAccountOpen)}
                className="flex items-center gap-1 p-1 rounded-full border border-[#D8CBB2] bg-[#FAF4E8] text-[#173B32] active:scale-95 transition-transform cursor-pointer"
                aria-label="Open User Account Menu"
                aria-expanded={mobileAccountOpen}
                aria-haspopup="true"
              >
                <Avatar user={user} size="xs" borderColor="border-[#B49252]/50" />
              </button>

              {/* ANCHORED MOBILE ACCOUNT POPOVER (Compact native app dropdown) */}
              <AnimatePresence>
                {mobileAccountOpen && (
                  <motion.div
                    key="mobile-profile-popover"
                    variants={popoverVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    style={{ transformOrigin: "top right" }}
                    role="menu"
                    aria-label="Account options"
                    className="absolute right-0 mt-2 w-[290px] max-w-[calc(100vw-24px)] max-h-[calc(100dvh-5rem)] overflow-y-auto bg-[#FAF7F0] border border-[#D8CBB2] rounded-2xl shadow-xl py-2 z-50 divide-y divide-[#D8CBB2]/50 overscroll-contain"
                  >
                    {/* Compact Header Summary */}
                    <div className="px-3.5 py-2.5 flex items-center gap-2.5">
                      <Avatar user={user} size="sm" borderColor="border-[#B49252]" />
                      <div className="min-w-0 flex-1 text-left">
                        <div className="font-serif font-bold text-xs text-[#173B32] truncate">
                          {user.full_name}
                        </div>
                        <div className="text-[10px] text-[#7B4D36] truncate">
                          {user.email}
                        </div>
                        <div className="mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-[#173B32]/10 text-[9px] font-bold text-[#173B32] uppercase">
                          <Shield className="w-2.5 h-2.5" />
                          <span>{user.role === "admin" ? "Admin" : "Verified Traveler"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Menu Navigation Rows */}
                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setMobileAccountOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-[#20211D] hover:bg-[#E5D5BA]/50 active:bg-[#E5D5BA]/80 transition-colors font-medium rounded-lg mx-1"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-[#B49252] shrink-0" />
                        <span>Profile &amp; Travel Journal</span>
                      </Link>

                      <Link
                        href="/profile?tab=saved"
                        onClick={() => setMobileAccountOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-[#20211D] hover:bg-[#E5D5BA]/50 active:bg-[#E5D5BA]/80 transition-colors font-medium rounded-lg mx-1"
                      >
                        <Bookmark className="w-3.5 h-3.5 text-[#B49252] shrink-0" />
                        <span>Saved Places &amp; Gems</span>
                      </Link>

                      <Link
                        href="/trips"
                        onClick={() => setMobileAccountOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-[#20211D] hover:bg-[#E5D5BA]/50 active:bg-[#E5D5BA]/80 transition-colors font-medium rounded-lg mx-1"
                      >
                        <Calendar className="w-3.5 h-3.5 text-[#B49252] shrink-0" />
                        <span>My Expeditions</span>
                      </Link>

                      <Link
                        href="/bookings"
                        onClick={() => setMobileAccountOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-[#20211D] hover:bg-[#E5D5BA]/50 active:bg-[#E5D5BA]/80 transition-colors font-medium rounded-lg mx-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-[#B49252] shrink-0" />
                        <span>My Bookings &amp; Vouchers</span>
                      </Link>

                      <Link
                        href="/settings"
                        onClick={() => setMobileAccountOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-[#20211D] hover:bg-[#E5D5BA]/50 active:bg-[#E5D5BA]/80 transition-colors font-medium rounded-lg mx-1"
                      >
                        <Settings className="w-3.5 h-3.5 text-[#B49252] shrink-0" />
                        <span>Account &amp; Settings</span>
                      </Link>
                    </div>

                    {/* Copilot Action inside Popover */}
                    <div className="py-1 px-1">
                      <button
                        type="button"
                        onClick={() => {
                          setMobileAccountOpen(false);
                          openAskVanvas();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#173B32] text-[#FAF7F0] font-semibold text-xs active:bg-[#20453B] transition-colors cursor-pointer shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-[#B49252]" />
                          <span>Ask VANVAS Copilot</span>
                        </div>
                        <span className="font-devanagari text-[10px] text-[#B49252]">पूछें</span>
                      </button>
                    </div>

                    {/* Sign Out Button */}
                    <div className="pt-1 px-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#B65E3C] hover:bg-[#B65E3C]/10 active:bg-[#B65E3C]/20 transition-colors font-semibold text-left rounded-lg cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 shrink-0" />
                        <span>Sign Out of VANVAS</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
    </header>
  );
};
