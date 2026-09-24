"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass, MapPin, Sparkles, ArrowRight, Clock, CloudRain,
  Wallet, Users, Coffee, BedDouble, Navigation, Sun, Check, ExternalLink,
  Mountain, Footprints
} from "lucide-react";
import { MistOverlay } from "@/components/mist/MistOverlay";
import { Logo } from "@/components/brand/Logo";
import { Emblem } from "@/components/brand/Emblem";
import { TravelStamp } from "@/components/ui/TravelStamp";
import { JournalNote } from "@/components/ui/JournalNote";
import { DevanagariHeading } from "@/components/ui/DevanagariHeading";
import { DestinationArtwork } from "@/components/brand/DestinationArtwork";
import { DestinationSearchBar } from "@/components/search/DestinationSearchBar";
import { api } from "@/lib/api";
import { Destination } from "@/types";
import { getCanonicalHindiName } from "@/lib/canonicalDestinations";

export default function HomePage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDestinations(false)
      .then((data) => setDestinations(data))
      .catch(() => {
        // Fallback list
        setDestinations([
          {
            id: "manali",
            name: "Manali",
            slug: "manali",
            state: "Himachal Pradesh",
            region: "Himalayan",
            tagline: "Into the pine and mist.",
            description: "Pine-scented mountain air, riverside stone cafés, and high alpine passes.",
            latitude: 32.2396,
            longitude: 77.1887,
            altitude_meters: 2050,
            is_featured: true,
            places_count: 14,
          },
          {
            id: "rishikesh",
            name: "Rishikesh",
            slug: "rishikesh",
            state: "Uttarakhand",
            region: "Himalayan Foothills",
            tagline: "Where sacred waters meet the rapids.",
            description: "Turquoise Ganga currents, cliffside meditation, and riverside ghat aartis.",
            latitude: 30.0869,
            longitude: 78.2676,
            altitude_meters: 372,
            is_featured: true,
            places_count: 12,
          },
          {
            id: "kasol",
            name: "Kasol",
            slug: "kasol",
            state: "Himachal Pradesh",
            region: "Parvati Valley",
            tagline: "Deodar canopies and bohemian trails.",
            description: "A tranquil haven in Parvati Valley famous for Israeli bakeries and pine forest hikes.",
            latitude: 32.0100,
            longitude: 77.3150,
            altitude_meters: 1580,
            is_featured: true,
            places_count: 10,
          },
          {
            id: "dharamshala",
            name: "Dharamshala",
            slug: "dharamshala",
            state: "Himachal Pradesh",
            region: "Kangra Valley",
            tagline: "Prayer flags in the shadow of Dhauladhar.",
            description: "Home of the Dalai Lama, surrounded by cedar forests and dramatic peaks.",
            latitude: 32.2190,
            longitude: 76.3234,
            altitude_meters: 1457,
            is_featured: true,
            places_count: 11,
          },
          {
            id: "jaipur",
            name: "Jaipur",
            slug: "jaipur",
            state: "Rajasthan",
            region: "Royal Heritage",
            tagline: "Terracotta ramparts and royal havelis.",
            description: "Hill forts overlooking bustling bazaars of blue pottery and rich kachoris.",
            latitude: 26.9124,
            longitude: 75.7873,
            altitude_meters: 431,
            is_featured: true,
            places_count: 10,
          },
          {
            id: "goa",
            name: "Goa",
            slug: "goa",
            state: "Goa",
            region: "Coastal Western Ghats",
            tagline: "Golden palms and sleepy river villages.",
            description: "Beyond crowded strips lie Portuguese villas, spice farms, and cliff sunsets.",
            latitude: 15.2993,
            longitude: 74.1240,
            altitude_meters: 10,
            is_featured: true,
            places_count: 12,
          },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const featuredManali = destinations.find((d) => d.slug === "manali") || destinations[0];
  const remainingDestinations = destinations.filter((d) => d.slug !== featuredManali?.slug);

  return (
    <div className="relative overflow-hidden bg-[#EFE5D2]">
      {/* SECTION 1: LAYERED HERO WITH HIMALAYAN ARTWORK & DEVANAGARI STORYTELLING */}
      <section className="relative min-h-[90vh] flex items-center justify-center bg-[#173B32] text-[#EFE5D2] px-4 sm:px-6 lg:px-8 py-20 overflow-hidden">
        {/* Layer 1: Illustrated Mountain Artwork Canvas */}
        <div className="absolute inset-0 opacity-60 scale-105 transform">
          <DestinationArtwork slug="manali" aspectRatio="hero" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#173B32]/85 via-[#173B32]/70 to-[#173B32]" />

        {/* Ambient Mist Drift Animation */}
        <MistOverlay />

        {/* Layer 2: Hero Editorial Content Panel */}
        <div className="relative z-20 max-w-5xl mx-auto text-center space-y-8">
          {/* Expedition Stamp & Route Header */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <TravelStamp label="VANVAS EXPEDITION" sublabel="DELHI → MANALI" elevation="2050M" variant="mustard" />
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono tracking-widest text-[#D8DED5]/80 uppercase">
              <span>[ 32°14&apos;N, 77°11&apos;E ]</span>
              <span>•</span>
              <span>EST. 2026</span>
            </div>
          </div>

          {/* Hindi Devanagari Lead + English Headline */}
          <div className="space-y-2">
            <span className="font-devanagari text-2xl sm:text-4xl text-[#B49252] font-bold tracking-widest block animate-float">
              चलो निकलते हैं।
            </span>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-black tracking-tight leading-[1.08] text-[#FAF4E8]">
              Travel should feel <span className="text-[#B49252] italic font-normal">spontaneous</span>.
              <br />
              The planning shouldn’t.
            </h1>
          </div>

          {/* Supporting Copy */}
          <p className="max-w-2xl mx-auto text-sm sm:text-lg text-[#D8DED5]/90 leading-relaxed font-light">
            An expedition journal and travel operating layer for people who plan badly, arrive at weird hours,
            and want to experience the mountains freely.
          </p>

          {/* Live Global & Indian Sanctuary Search Bar */}
          <div className="max-w-2xl mx-auto pt-2">
            <DestinationSearchBar
              placeholder="Search any destination: Spiti Valley, Leh, Rishikesh, Goa, Bali..."
              className="shadow-2xl"
            />
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/plan"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] text-sm font-bold tracking-wider uppercase shadow-xl hover:shadow-2xl transition-all transform active:scale-95 flex items-center justify-center gap-2.5 border border-[#7B4D36]/30"
            >
              <Sparkles className="w-4 h-4 text-[#B49252]" />
              <span>PLAN MY TRIP</span>
              <span className="font-devanagari text-xs opacity-75 lowercase">(योजना बनाएं)</span>
            </Link>

            <Link
              href="/explore"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#EFE5D2]/15 hover:bg-[#EFE5D2]/25 backdrop-blur-md border border-[#D8DED5]/30 text-[#EFE5D2] text-sm font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>EXPLORE DESTINATIONS</span>
            </Link>
          </div>

          {/* Editorial Route Annotation Pin */}
          <div className="pt-6">
            <span className="text-[11px] font-mono tracking-widest text-[#B49252] uppercase bg-[#0F2924]/60 px-4 py-1.5 rounded-full border border-[#B49252]/30">
              Leave Delhi at night. Wake up somewhere in the pines.
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 1B: CHOOSE YOUR WAY TO TRAVEL (4 DISTINCT EXPERIENCE MODES) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#D8CBB2] pb-6">
          <DevanagariHeading
            devanagari="अपनी यात्रा चुनें"
            english="Choose Your Way to Travel"
            subtitle="Four dedicated visual environments built for different travel mentalities."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: CORE EXPLORER'S DESK */}
          <Link
            href="/explore"
            className="group bg-[#FAF4E8] rounded-3xl p-6 border-2 border-[#D8CBB2] hover:border-[#173B32] shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-6"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#173B32] text-[#EFE5D2] flex items-center justify-center shadow-md">
                <Compass className="w-6 h-6 text-[#B49252]" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#7B4D36] font-bold">
                  LAYER 01 • EXPLORER&apos;S DESK
                </span>
                <h3 className="text-2xl font-serif font-black text-[#173B32] group-hover:text-[#B65E3C] transition-colors">
                  Explore India
                </h3>
              </div>
              <p className="text-xs text-[#7B4D36] font-serif leading-relaxed">
                Discover curated sanctuaries, river ghats, royal palaces, tea plantations, and hidden mountain valleys across India.
              </p>
            </div>
            <div className="pt-3 border-t border-[#E5D5BA] flex items-center justify-between text-xs font-bold text-[#173B32]">
              <span>Explore Catalogue</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2: TREK EXPEDITION MODE */}
          <Link
            href="/treks"
            className="group bg-[#111A16] text-[#EFE5D2] rounded-3xl p-6 border-2 border-[#2C3E35] hover:border-[#E05A2B] shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-6"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E05A2B] text-white flex items-center justify-center shadow-md">
                <Mountain className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#B49252] font-bold">
                  LAYER 02 • FIELD JOURNAL
                </span>
                <h3 className="text-2xl font-serif font-black text-white group-hover:text-[#E05A2B] transition-colors">
                  Trek Mode
                </h3>
              </div>
              <p className="text-xs text-[#A6BAAE] font-serif leading-relaxed">
                Understand the mountain before you climb it. Elevation graphs, route comparisons, gear checklists & live trail cockpit.
              </p>
            </div>
            <div className="pt-3 border-t border-[#25372D] flex items-center justify-between text-xs font-bold text-[#E05A2B]">
              <span>Find Your Mountain</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 3: ONE-DAY ROUND TRIP */}
          <Link
            href="/one-day"
            className="group bg-[#FFF9F0] rounded-3xl p-6 border-2 border-[#E5D5BA] hover:border-[#B65E3C] shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-6"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#B65E3C] text-white flex items-center justify-center shadow-md">
                <Clock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#B65E3C] font-bold">
                  LAYER 03 • SPONTANEOUS ESCAPE
                </span>
                <h3 className="text-2xl font-serif font-black text-[#173B32] group-hover:text-[#B65E3C] transition-colors">
                  One-Day Trips
                </h3>
              </div>
              <p className="text-xs text-[#7B4D36] font-serif leading-relaxed">
                &ldquo;We have one day. Let&apos;s go.&rdquo; Spontaneous road trips, friend group budget splitting, timeline boards & rental discovery.
              </p>
            </div>
            <div className="pt-3 border-t border-[#E5D5BA] flex items-center justify-between text-xs font-bold text-[#B65E3C]">
              <span>Plan 1-Day Escape</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 4: ASK VANVAS TRAVEL COPILOT */}
          <Link
            href="/copilot"
            onClick={(e) => {
              // If floating copilot trigger exists or opened via modal
            }}
            className="group bg-[#FAF4E8] rounded-3xl p-6 border-2 border-[#D8CBB2] hover:border-[#B49252] shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-6"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#173B32] text-[#FAF4E8] flex items-center justify-center shadow-md">
                <Sparkles className="w-6 h-6 text-[#B49252]" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#B49252] font-bold">
                  LAYER 04 • UNIVERSAL COPILOT
                </span>
                <h3 className="text-2xl font-serif font-black text-[#173B32] group-hover:text-[#B49252] transition-colors">
                  Ask VANVAS
                </h3>
              </div>
              <p className="text-xs text-[#7B4D36] font-serif leading-relaxed">
                Universal travel intelligence for any place in India. Instant budget plans, timing advice, routes & zero-hallucination guidance.
              </p>
            </div>
            <div className="pt-3 border-t border-[#E5D5BA] flex items-center justify-between text-xs font-bold text-[#173B32]">
              <span>Ask Anywhere</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* SECTION 2: WHERE WILL YOU WANDER? (EDITORIAL ASYMMETRICAL MAGAZINE GRID) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#D8CBB2] pb-6">
          <DevanagariHeading
            devanagari="कहाँ चलें?"
            english="Where will you wander?"
            subtitle="Curated Indian sanctuaries & heritage routes presented as vintage illustrated travel posters."
          />
          <Link
            href="/explore"
            className="text-xs font-bold uppercase tracking-widest text-[#B65E3C] hover:text-[#9E4D2E] flex items-center gap-1.5 transition-colors self-start md:self-auto"
          >
            <span>EXPLORE ALL SANCTUARIES (सभी तीर्थ खोजें) →</span>
          </Link>
        </div>

        {/* Asymmetrical Magazine Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Large Featured Hero Card: Manali */}
          {featuredManali && (
            <Link
              href={`/explore/${featuredManali.slug}`}
              className="lg:col-span-7 group journal-card rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
            >
              {/* Illustrated Artwork Poster */}
              <div className="relative h-80 sm:h-96 w-full overflow-hidden">
                <DestinationArtwork slug={featuredManali.slug} aspectRatio="wide" className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700" />
                
                {/* Vintage Poster Header Badges */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  <TravelStamp
                    label={featuredManali.region}
                    elevation={`${featuredManali.altitude_meters}M`}
                    variant="forest"
                  />
                  <span className="px-3 py-1 rounded-full bg-[#173B32]/90 backdrop-blur-md text-[#EFE5D2] text-[10px] font-mono font-bold uppercase">
                    FEATURED EXPEDITION
                  </span>
                </div>

                {/* Devanagari Overlay Watermark */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="flex items-baseline gap-3">
                    <h3 className="text-3xl sm:text-5xl font-serif font-black">{featuredManali.name}</h3>
                    <span className="font-devanagari text-2xl sm:text-3xl text-[#B49252] font-bold">
                      {featuredManali.hindi_name || getCanonicalHindiName(featuredManali.slug || featuredManali.name) || "मनाली"}
                    </span>
                  </div>
                  <p className="text-xs text-[#D8DED5] mt-1 italic font-serif">
                    &ldquo;{featuredManali.tagline}&rdquo;
                  </p>
                </div>
              </div>

              {/* Journal Notes Strip */}
              <div className="p-6 bg-[#FAF4E8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-[#D8CBB2]">
                <p className="text-xs text-[#7B4D36] max-w-md leading-relaxed">
                  {featuredManali.description}
                </p>
                <span className="px-4 py-2 rounded-xl bg-[#173B32] text-[#EFE5D2] text-xs font-bold uppercase tracking-wider group-hover:bg-[#B65E3C] transition-colors shrink-0 flex items-center gap-1">
                  <span>Open Journal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          )}

          {/* Right Column Smaller Curated Cards */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {remainingDestinations.slice(0, 4).map((dest) => (
              <Link
                key={dest.id}
                href={`/explore/${dest.slug}`}
                className="group journal-card rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                {/* Artwork */}
                <div className="relative h-44 w-full overflow-hidden">
                  <DestinationArtwork slug={dest.slug} aspectRatio="square" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-0.5 rounded-md bg-[#173B32]/90 text-[#EFE5D2] text-[9px] font-mono font-bold uppercase">
                      {dest.region}
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 left-3 right-3 text-white">
                    <div className="flex items-baseline justify-between">
                      <h4 className="font-serif font-black text-xl">{dest.name}</h4>
                      <span className="font-devanagari text-sm text-[#B49252] font-semibold">
                        {dest.hindi_name || getCanonicalHindiName(dest.slug || dest.name)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Tagline */}
                <div className="p-3.5 bg-[#FAF4E8] space-y-1 border-t border-[#D8CBB2]">
                  <p className="text-[11px] text-[#7B4D36] line-clamp-2 italic leading-relaxed">
                    &ldquo;{dest.tagline}&rdquo;
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-[#D8CBB2]/60 text-[10px] font-mono text-[#173B32]">
                    <span>{dest.altitude_meters ? `${dest.altitude_meters}M ELEV` : "COASTAL"}</span>
                    <span className="text-[#B65E3C] font-bold group-hover:translate-x-0.5 transition-transform">
                      VIEW →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: REAL TRAVEL MOMENTS & SCENARIOS (REPLACING GENERIC SAAS FEATURE CARDS) */}
      <section className="bg-[#173B32] text-[#EFE5D2] py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#EFE5D2_1px,transparent_0)] bg-[size:16px_16px]" />

        <div className="max-w-7xl mx-auto space-y-16 relative z-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="font-devanagari text-lg text-[#B49252] font-bold tracking-widest block">
              सफ़र के असली पल
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black text-[#FAF4E8]">
              Made for the way you actually travel.
            </h2>
            <p className="text-sm text-[#D8DED5]/80 font-light">
              No generic dashboards. Real scenarios resolved on the spot.
            </p>
          </div>

          {/* 3 Story-Driven Scenario Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Scenario 1: Early Bus Stand Arrival */}
            <div className="p-6 sm:p-7 rounded-3xl bg-[#0F2924] border border-[#D8DED5]/20 shadow-xl space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <TravelStamp label="08:17 AM ARRIVAL" sublabel="MANALI BUS STAND" variant="terracotta" />
                  <span className="text-xs text-[#B49252] font-mono font-bold">I&rsquo;M HERE</span>
                </div>
                <h3 className="text-xl font-serif font-bold text-[#FAF4E8]">
                  Arrived 3 hours before hotel check-in?
                </h3>
                <p className="text-xs text-[#D8DED5]/75 leading-relaxed">
                  Instead of dragging 15kg backpacks across Mall Road waiting for 11:00 AM, VANVAS creates an immediate bridge:
                </p>

                {/* Timeline snippet */}
                <div className="space-y-2 pt-2 border-t border-white/10 text-xs font-mono">
                  <div className="flex items-center gap-2 text-[#B49252]">
                    <span>08:30</span>
                    <span>Hot ginger tea &amp; Siddu nearby</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#EFE5D2]">
                    <span>09:30</span>
                    <span>Drop heavy bags at hotel desk</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#D8DED5]/70">
                    <span>10:15</span>
                    <span>Leisurely stroll in Old Manali</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-[#B49252] italic">
                &ldquo;Your room is ready when you return from lunch.&rdquo;
              </div>
            </div>

            {/* Scenario 2: Sudden Mountain Rain */}
            <div className="p-6 sm:p-7 rounded-3xl bg-[#0F2924] border border-[#D8DED5]/20 shadow-xl space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <TravelStamp label="WEATHER SHIFT" sublabel="ALPINE RAIN" variant="indigo" />
                  <span className="text-xs text-blue-300 font-mono font-bold">REPLANNER</span>
                </div>
                <h3 className="text-xl font-serif font-bold text-[#FAF4E8]">
                  Sudden rain ruined your mountain hike?
                </h3>
                <p className="text-xs text-[#D8DED5]/75 leading-relaxed">
                  One tap on <em>&ldquo;It&rsquo;s Raining&rdquo;</em> transforms your outdoor trek into warm wooden indoor sanctuaries:
                </p>

                <div className="space-y-2 pt-2 border-t border-white/10 text-xs font-mono">
                  <div className="flex items-center gap-2 text-rose-300 line-through">
                    <span>✕ Jogini Waterfall Ridge Trail</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-300">
                    <span>✓ Drifters&rsquo; Wooden Book Café</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-300">
                    <span>✓ Tibetan Art &amp; Monastery Hall</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-emerald-300 italic">
                &ldquo;Completed stops remain safe. Only wet stops get swapped.&rdquo;
              </div>
            </div>

            {/* Scenario 3: Private Group Travel Harmony */}
            <div className="p-6 sm:p-7 rounded-3xl bg-[#0F2924] border border-[#D8DED5]/20 shadow-xl space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <TravelStamp label="4 TRAVELLERS" sublabel="GROUP HARMONY" variant="mustard" />
                  <span className="text-xs text-[#B49252] font-mono font-bold">PRIVATE VOTE</span>
                </div>
                <h3 className="text-xl font-serif font-bold text-[#FAF4E8]">
                  Friends can&rsquo;t agree on where to go?
                </h3>
                <p className="text-xs text-[#D8DED5]/75 leading-relaxed">
                  Share an invite link. Everyone votes privately with NO, LIKE, or LOVE without awkward peer pressure:
                </p>

                <div className="space-y-2 pt-2 border-t border-white/10 text-xs font-mono">
                  <div className="flex items-center justify-between text-[#B49252]">
                    <span>Café 1947 Riverside</span>
                    <span className="font-bold">92% Match (4/4 Love)</span>
                  </div>
                  <div className="flex items-center justify-between text-[#EFE5D2]">
                    <span>Solang Paragliding</span>
                    <span>75% Match (3/4 Like)</span>
                  </div>
                  <div className="flex items-center justify-between text-[#D8DED5]/60">
                    <span>Shopping Bazaar</span>
                    <span>30% Match (Passed)</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-[#B49252] italic">
                &ldquo;Votes stay private. The itinerary picks true group consensus.&rdquo;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: TRAVEL JOURNAL SNIPPETS & ROUTE NOTES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-12">
        <DevanagariHeading
          devanagari="डायरी के पन्नों से"
          english="From the Mountain Journal"
          subtitle="Real field notes, chai stops, and winding roads across India."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <JournalNote
            note="Never take the first taxi outside the bus stand. Walk 300 meters past the bridge; the chai is hotter and the scooters are half the price."
            author="Manali Field Log • Sept 2026"
            location="Old Manali Bridge"
            tapeColor="mustard"
          />

          <JournalNote
            note="If you reach Triveni Ghat by 5:45 PM, sit on the second stone step from the water. The brass lamps reflect right into your eyes as the bells begin."
            author="Rishikesh Field Log • Oct 2026"
            location="Triveni Ghat"
            tapeColor="terracotta"
          />

          <JournalNote
            note="When in Parvati Valley, ignore your watch. The apple crumble at Moon Dance is ready when the pine scent outside turns sweet."
            author="Kasol Field Log • Sept 2026"
            location="Parvati Valley"
            tapeColor="parchment"
          />
        </div>
      </section>

      {/* SECTION 5: FINAL EVOCATIVE INVITATION */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="p-8 sm:p-14 rounded-3xl bg-[#173B32] text-[#EFE5D2] shadow-2xl relative overflow-hidden space-y-6 journal-card-dark">
          <div className="relative z-10 space-y-4">
            <span className="font-devanagari text-2xl text-[#B49252] font-bold tracking-widest block">
              जहाँ मन करे, निकल पड़ो।
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif font-black text-[#FAF4E8]">
              Go somewhere. We&rsquo;ll figure out the rest.
            </h2>
            <p className="text-sm text-[#D8DED5]/90 max-w-lg mx-auto font-light leading-relaxed">
              Tell VANVAS your destination and days. In 30 seconds, your stays, arrival schedule, and valley stops are organized.
            </p>
            <div className="pt-4">
              <Link
                href="/plan"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] font-bold text-sm tracking-wider uppercase shadow-xl transition-all transform active:scale-95 border border-[#7B4D36]/30"
              >
                <Sparkles className="w-4 h-4 text-[#B49252]" />
                <span>Start My Journey Plan</span>
                <span className="font-devanagari text-xs opacity-80">(शुरू करें)</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
