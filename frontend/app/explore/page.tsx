"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Compass, MapPin, ArrowRight, Sparkles, Mountain, Search, Trees, Waves, Castle } from "lucide-react";
import { api } from "@/lib/api";
import { Destination } from "@/types";
import { MistOverlay } from "@/components/mist/MistOverlay";
import { DestinationArtwork } from "@/components/brand/DestinationArtwork";
import { DestinationSearchBar } from "@/components/search/DestinationSearchBar";
import { TravelStamp } from "@/components/ui/TravelStamp";
import { DevanagariHeading } from "@/components/ui/DevanagariHeading";
import { JournalNote } from "@/components/ui/JournalNote";

export default function ExploreIndexPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDestinations(false)
      .then((data) => setDestinations(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const curatedJourneys = [
    { id: "All", label: "All Destinations", hindi: "सभी रास्ते", icon: Compass },
    { id: "Himalayan", label: "Himalayan Escapes", hindi: "पहाड़ी रास्ते", icon: Mountain },
    { id: "Royal", label: "Desert & Heritage", hindi: "शाही राजस्थान", icon: Castle },
    { id: "Coastal", label: "Coastal & Ghats", hindi: "समुद्री किनारे", icon: Waves },
  ];

  // Destination Metadata Enhancements for rich editorial storytelling
  const destDetails: Record<string, { hindi: string; alt: string; coords: string; quote: string; badge: string }> = {
    manali: {
      hindi: "मनाली",
      alt: "2050m",
      coords: "32°14′N",
      quote: "Where cedar scent meets glacier mist and the highway to Ladakh begins.",
      badge: "HIMACHAL VALLEY",
    },
    rishikesh: {
      hindi: "ऋषिकेश",
      alt: "372m",
      coords: "30°06′N",
      quote: "Emerald Ganga currents, suspension bridge chants, and cliffside silence.",
      badge: "GANGA FOOTHILLS",
    },
    kasol: {
      hindi: "कसोल",
      alt: "1580m",
      coords: "32°00′N",
      quote: "Whispering deodar canopies, roaring Parvati river, and timeless mountain cafes.",
      badge: "PARVATI EXPEDITION",
    },
    dharamshala: {
      hindi: "धर्मशाला",
      alt: "1457m",
      coords: "32°13′N",
      quote: "Prayer flags dancing against Dhauladhar snow ridges and pine-shaded monasteries.",
      badge: "KANGRA RIDGE",
    },
    goa: {
      hindi: "गोवा",
      alt: "10m",
      coords: "15°29′N",
      quote: "Golden palm trails, Portuguese havelis, warm sea breeze, and hidden backwaters.",
      badge: "WESTERN GHATS COAST",
    },
    jaipur: {
      hindi: "जयपुर",
      alt: "431m",
      coords: "26°55′N",
      quote: "Terracotta ramparts, royal wind palaces, bustling bazaars, and starry desert nights.",
      badge: "RAJPUTANA HERITAGE",
    },
    udaipur: {
      hindi: "उदयपुर",
      alt: "598m",
      coords: "24°35′N",
      quote: "Shimmering lake waters, whitewashed marble ghats, and sunset rooftop chai.",
      badge: "MEWAR LAKES",
    },
    mussoorie: {
      hindi: "मसूरी",
      alt: "2005m",
      coords: "30°27′N",
      quote: "The winterline glow, colonial bookshops, oak forests, and misty ridge walks.",
      badge: "GARHWAL HILLS",
    },
    "tungnath-chandrashila": {
      hindi: "तुंगनाथ–चंद्रशिला",
      alt: "4000m",
      coords: "30°29′N",
      quote: "Chopta base camp → World's highest Shiva shrine (3,680m) → 360° Chaukhamba sunrise summit (4,000m).",
      badge: "GARHWAL TREK EXPEDITION",
    },
  };

  const filtered = destinations.filter((d) => {
    const isHim = ["manali", "rishikesh", "kasol", "dharamshala", "mussoorie", "spiti", "spiti-valley", "leh", "tungnath-chandrashila"].includes(d.slug);
    const isDes = ["jaipur", "udaipur"].includes(d.slug);
    const isCoast = ["goa", "munnar"].includes(d.slug);

    let matchCat = true;
    if (selectedCategory === "Himalayan") matchCat = isHim;
    else if (selectedCategory === "Royal") matchCat = isDes;
    else if (selectedCategory === "Coastal") matchCat = isCoast;

    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.state.toLowerCase().includes(search.toLowerCase()) ||
      (destDetails[d.slug]?.hindi || "").includes(search);

    return matchCat && matchSearch;
  });

  return (
    <div className="relative overflow-hidden bg-[#EFE5D2]">
      {/* SECTION 1: DEDICATED EXPLORE DISCOVERY HERO */}
      <section className="relative bg-[#173B32] text-[#EFE5D2] px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:py-20 overflow-hidden border-b border-[#E5D5BA]/20">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F2924] via-[#173B32] to-[#173B32]" />
        
        {/* Subtle Ambient Mist */}
        <MistOverlay />

        {/* Discovery Hero Editorial Panel */}
        <div className="relative z-20 max-w-5xl mx-auto text-center space-y-6">
          {/* Editorial Eyebrow Stamp */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-[11px] font-mono font-bold tracking-widest text-[#B49252] uppercase bg-[#0F2924]/80 px-4 py-1.5 rounded-full border border-[#B49252]/40 shadow-sm">
              EXPLORE • WHERE WILL YOU WANDER?
            </span>
          </div>

          {/* Devanagari Sub-heading + Main Headline */}
          <div className="space-y-2">
            <span className="font-devanagari text-xl sm:text-2xl text-[#B49252] font-semibold tracking-wider block">
              भारत के अनूठे रास्ते
            </span>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-black tracking-tight leading-[1.08] text-[#FAF4E8]">
              Explore India
            </h1>
          </div>

          {/* Supporting Copy */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-[#D8DED5]/90 leading-relaxed font-light">
            Curated destinations, local places and experiences worth travelling for.
          </p>

          {/* Live Destination, Place & Experience Search Bar */}
          <div className="max-w-2xl mx-auto pt-2">
            <DestinationSearchBar
              placeholder="Search destinations, places & experiences (e.g. Tungnath, Jaipur, Goa)..."
              className="shadow-2xl"
            />
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <a
              href="#catalogue"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] text-xs font-bold tracking-wider uppercase shadow-xl hover:shadow-2xl transition-all transform active:scale-95 flex items-center justify-center gap-2 border border-[#7B4D36]/30 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-[#B49252]" />
              <span>EXPLORE ALL DESTINATIONS →</span>
            </a>

            <Link
              href="/plan"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#EFE5D2]/15 hover:bg-[#EFE5D2]/25 backdrop-blur-md border border-[#D8DED5]/30 text-[#EFE5D2] text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#B49252]" />
              <span>PLAN A TRIP</span>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 2: DESTINATION CATALOGUE & DISCOVERY GRID */}
      <section id="catalogue" className="min-h-screen bg-[#EFE5D2] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Editorial Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-[#E5D5BA]">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2">
                <TravelStamp label="FEATURED DESTINATIONS" sub="CURATED DISCOVERY" variant="terracotta" />
                <TravelStamp label="VANVAS REGISTRY" variant="forest" />
              </div>

              <DevanagariHeading
                hindi="कहाँ चलें?"
                english="Featured Destinations"
                subtitle="Illustrated destination artwork for discovery. Switch to authentic photography when you step inside each destination."
                size="lg"
              />
            </div>

            <div className="w-full md:w-96 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7B4D36] block">
                खोजें • Filter Sanctuary Catalog
              </span>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7B4D36]/70" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter by name or state..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F0] border-2 border-[#E5D5BA] focus:border-[#173B32] outline-none text-xs text-[#173B32] font-medium placeholder:text-[#7B4D36]/50 shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Curated Journey Route Category Controls */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
            {curatedJourneys.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-5 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2.5 cursor-pointer ${
                    isActive
                      ? "bg-[#173B32] text-[#EFE5D2] shadow-md scale-102 border-2 border-[#173B32]"
                      : "bg-[#FAF7F0] text-[#20211D]/80 border-2 border-[#E5D5BA] hover:bg-[#E5D5BA]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#B49252]" : "text-[#7B4D36]"}`} />
                  <span>{cat.label}</span>
                  <span className={`text-[10px] ${isActive ? "text-[#B49252]" : "text-[#7B4D36]"}`}>
                    ({cat.hindi})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Destination Editorial Showcase Grid */}
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-[#173B32] gap-3">
              <div className="w-10 h-10 border-3 border-[#B65E3C] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-serif italic text-[#7B4D36]">Unrolling illustrated expedition maps...</span>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Top Featured Hero Card (First item) */}
              {filtered.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                  <Link
                    href={`/explore/${filtered[0].slug}`}
                    className="lg:col-span-8 group bg-[#FAF7F0] rounded-3xl border-2 border-[#E5D5BA] hover:border-[#173B32] p-4 sm:p-6 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col md:flex-row gap-6 relative overflow-hidden"
                  >
                    {/* Left Illustrated Poster */}
                    <div className="w-full md:w-1/2 h-72 sm:h-96 rounded-2xl overflow-hidden border border-[#E5D5BA] relative">
                      <DestinationArtwork
                        destination={filtered[0].slug}
                        title={filtered[0].name}
                        hindiName={destDetails[filtered[0].slug]?.hindi || "यात्रा"}
                        subtitle={filtered[0].state}
                        elevation={destDetails[filtered[0].slug]?.alt}
                        coordinates={destDetails[filtered[0].slug]?.coords}
                        className="w-full h-full"
                      />
                    </div>

                    {/* Right Editorial Story */}
                    <div className="w-full md:w-1/2 flex flex-col justify-between py-2 space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <TravelStamp
                            label={destDetails[filtered[0].slug]?.badge || "FEATURED EXPEDITION"}
                            variant="terracotta"
                          />
                          <span className="text-xs font-mono text-[#7B4D36]">
                            {destDetails[filtered[0].slug]?.coords}
                          </span>
                        </div>

                        <h3 className="text-3xl sm:text-4xl font-serif font-black text-[#173B32]">
                          {filtered[0].name}
                        </h3>
                        <div className="text-sm font-serif text-[#B65E3C] font-semibold">
                          {destDetails[filtered[0].slug]?.hindi} • {filtered[0].state}
                        </div>

                        <p className="text-xs text-[#20211D]/80 leading-relaxed font-light">
                          {filtered[0].description}
                        </p>

                        <div className="p-3.5 rounded-xl bg-[#EFE5D2] border border-[#E5D5BA] text-xs text-[#7B4D36] italic font-serif leading-relaxed">
                          &ldquo;{destDetails[filtered[0].slug]?.quote || filtered[0].tagline}&rdquo;
                        </div>
                      </div>

                      <div className="pt-4 border-t border-[#E5D5BA] flex items-center justify-between">
                        <span className="text-xs font-bold text-[#173B32]">
                          {filtered[0].places_count || 12} Curated Places
                        </span>
                        <span className="px-5 py-2.5 rounded-xl bg-[#B65E3C] group-hover:bg-[#9E4D2E] text-[#EFE5D2] text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 shadow-sm">
                          <span>Step Inside</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Right Column: Travel Journal Dispatch */}
                  <div className="lg:col-span-4 flex flex-col justify-between space-y-6">
                    <JournalNote
                      tag="VANVAS EXPEDITION PHILOSOPHY"
                      note="We intentionally don't flood you with 500 tourist traps. Each destination contains handpicked pine cafés, ancient stone temples, secret waterfalls and slow stays."
                      date="HIMALAYAN BASE CAMP"
                      tapeColor="mustard"
                    />

                    <div className="p-6 rounded-3xl bg-[#173B32] text-[#EFE5D2] space-y-4 shadow-md">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#B49252]">
                        SPONTANEOUS EXPLORER
                      </span>
                      <h4 className="text-xl font-serif font-black">
                        Not sure which trail to take?
                      </h4>
                      <p className="text-xs text-[#D8DED5]/80 leading-relaxed font-light">
                        Tell our travel journal your budget, vibes, and dates. We&rsquo;ll tailor an adaptive route.
                      </p>
                      <Link
                        href="/plan"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#B49252] hover:bg-[#9E7D3F] text-[#0F2924] font-bold text-xs uppercase tracking-wider transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Plan My Journey</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Asymmetrical Destination Posters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filtered.slice(1).map((dest) => (
                  <Link
                    key={dest.id}
                    href={`/explore/${dest.slug}`}
                    className="group bg-[#FAF7F0] rounded-3xl border-2 border-[#E5D5BA] hover:border-[#173B32] p-4 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    {/* Poster Art */}
                    <div className="h-72 w-full rounded-2xl overflow-hidden border border-[#E5D5BA] relative">
                      <DestinationArtwork
                        destination={dest.slug}
                        title={dest.name}
                        hindiName={destDetails[dest.slug]?.hindi || "सफ़र"}
                        subtitle={dest.state}
                        elevation={destDetails[dest.slug]?.alt}
                        coordinates={destDetails[dest.slug]?.coords}
                        className="w-full h-full"
                      />
                    </div>

                    {/* Card Content */}
                    <div className="p-3 pt-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B4D36]">
                            {dest.region}
                          </span>
                          {destDetails[dest.slug]?.alt && (
                            <span className="text-[10px] font-mono text-[#536B52] font-semibold">
                              {destDetails[dest.slug].alt}
                            </span>
                          )}
                        </div>

                        <h3 className="text-2xl font-serif font-black text-[#173B32] group-hover:text-[#B65E3C] transition-colors mt-1">
                          {dest.name}
                        </h3>
                        <p className="text-xs text-[#7B4D36] italic font-serif">
                          {destDetails[dest.slug]?.quote || dest.tagline}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[#E5D5BA] flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#536B52]">
                          {dest.places_count || 10} Verified Places
                        </span>
                        <span className="text-[#B65E3C] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                          <span>Explore</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
