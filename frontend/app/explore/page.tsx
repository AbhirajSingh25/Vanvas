"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass, ArrowRight, Sparkles, Mountain, Search, Waves, Castle, RefreshCw, AlertCircle, Trees, Coffee
} from "lucide-react";
import { api } from "@/lib/api";
import { Destination } from "@/types";
import { DestinationArtwork } from "@/components/brand/DestinationArtwork";
import { TravelStamp } from "@/components/ui/TravelStamp";
import { JournalNote } from "@/components/ui/JournalNote";
import { CANONICAL_DESTINATIONS } from "@/lib/canonicalDestinations";
import { useDensity } from "@/context/DensityContext";
import { CompactDestinationCard } from "@/components/compact";

export default function ExploreIndexPage() {
  const { isCompact } = useDensity();
  const [destinations, setDestinations] = useState<Destination[]>(CANONICAL_DESTINATIONS);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [visibleDestCount, setVisibleDestCount] = useState<number>(30);

  const loadDestinations = () => {
    setLoading(true);
    setLoadError(null);
    api.getDestinations(false)
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setDestinations(data);
        } else {
          setDestinations(CANONICAL_DESTINATIONS);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch remote destinations, serving canonical registry:", err);
        setDestinations(CANONICAL_DESTINATIONS);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDestinations();
  }, []);

  const curatedJourneys = [
    { id: "All", label: "All Destinations", hindi: "सभी रास्ते", icon: Compass },
    { id: "Mountains", label: "Mountains", hindi: "पहाड़ी रास्ते", icon: Mountain },
    { id: "Beaches", label: "Beaches", hindi: "समुद्री किनारे", icon: Waves },
    { id: "Heritage", label: "Heritage", hindi: "शाही विरासत", icon: Castle },
    { id: "Spiritual", label: "Spiritual", hindi: "आध्यात्मिक", icon: Compass },
    { id: "Wildlife", label: "Wildlife", hindi: "वन्यजीव", icon: Trees },
    { id: "Slow Travel", label: "Slow Travel", hindi: "सुकून भरा सफ़र", icon: Coffee },
    { id: "Road Trips", label: "Road Trips", hindi: "सड़क यात्रा", icon: Castle },
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
    varanasi: {
      hindi: "वाराणसी",
      alt: "80m",
      coords: "25°18′N",
      quote: "Ancient eternal ghats, dawn boat rides, sacred chanting, and narrow silk lanes.",
      badge: "GANGA RIVERFRONT",
    },
    leh: {
      hindi: "लेह लद्दाख",
      alt: "3500m",
      coords: "34°09′N",
      quote: "High mountain passes, turquoise lakes, prayer wheels, and stark moonscapes.",
      badge: "TRANS-HIMALAYA",
    },
    spiti: {
      hindi: "स्पीति घाटी",
      alt: "3800m",
      coords: "32°14′N",
      quote: "Ancient gompas on rugged cliff edges, high altitude cold desert, and starry nights.",
      badge: "COLD DESERT VALLEY",
    },
    munnar: {
      hindi: "मुन्नार",
      alt: "1600m",
      coords: "10°05′N",
      quote: "Endless rolling emerald tea plantations, misty mountain gaps, and cardamom spice air.",
      badge: "WESTERN GHATS",
    },
    "tungnath-chandrashila": {
      hindi: "तुंगनाथ–चंद्रशिला",
      alt: "4000m",
      coords: "30°29′N",
      quote: "Chopta base camp → World's highest Shiva shrine (3,680m) → 360° Chaukhamba sunrise summit (4,000m).",
      badge: "GARHWAL TREK EXPEDITION",
    },
    "kainchi-dham": {
      hindi: "कैंची धाम",
      alt: "1400m",
      coords: "29°25′N",
      quote: "Neem Karoli Baba's sacred riverside ashram nestled in pine-scented Kumaoni valleys.",
      badge: "KUMAON SANCTUARY",
    },
    murthal: {
      hindi: "मुरथल",
      alt: "224m",
      coords: "29°01′N",
      quote: "Clay tandoor parathas with homemade white butter and legendary GT Road dhaba culture.",
      badge: "GT ROAD CORRIDOR",
    },
    agra: {
      hindi: "आगरा",
      alt: "171m",
      coords: "27°10′N",
      quote: "The timeless white marble poetry of the Taj Mahal and rich Yamuna river sunsets.",
      badge: "MUGHAL HERITAGE",
    },
    "mathura-vrindavan": {
      hindi: "मथुरा और वृन्दावन",
      alt: "178m",
      coords: "27°34′N",
      quote: "Sacred Yamuna aartis, Banke Bihari blessings, and glowing white marble of Prem Mandir.",
      badge: "BRAJ BHOOMI",
    },
    neemrana: {
      hindi: "नीमराना",
      alt: "340m",
      coords: "27°59′N",
      quote: "15th-century stepped fortress palace carved into Aravalli cliffs along the highway.",
      badge: "ARAVALLI FORTRESS",
    },
    "damdama-sohna": {
      hindi: "दमदमा और सोहना",
      alt: "220m",
      coords: "28°18′N",
      quote: "Tranquil lake waters framed by rugged Aravalli rocky ridges, rowing boats, and rustic trails.",
      badge: "ARAVALLI LAKESIDE",
    },
    "alwar-siliserh": {
      hindi: "अलवर और सिलीसेढ़",
      alt: "270m",
      coords: "27°32′N",
      quote: "Historic 19th-century royal lake palace, tranquil waters, and mountain reflections.",
      badge: "MEWAT PALACE",
    },
    "sariska-bhangarh": {
      hindi: "सरिस्का और भानगढ़",
      alt: "420m",
      coords: "27°19′N",
      quote: "Dense dry deciduous forest wildlife, tiger territory, and ancient stone ruins of Bhangarh.",
      badge: "ARAVALLI WILDERNESS",
    },
    dehradun: {
      hindi: "देहरादून",
      alt: "640m",
      coords: "30°19′N",
      quote: "Sal-forested foothills, historic Rajpur Road bakeries, and cool mountain streams.",
      badge: "DOON VALLEY",
    },
    chandigarh: {
      hindi: "चंडीगढ़",
      alt: "321m",
      coords: "30°44′N",
      quote: "Sukhna Lake morning reflections, Rock Garden sculptures, and tree-lined modernist boulevards.",
      badge: "SHIVALIK CITY",
    },
    "morni-hills": {
      hindi: "मोरनी हिल्स",
      alt: "1220m",
      coords: "30°41′N",
      quote: "Pine-covered Shivalik mountain ridges, peaceful Tikkar Taal lake, and quiet hill roads.",
      badge: "HARYANA HIGHLANDS",
    },
    lansdowne: {
      hindi: "लैंसडाउन",
      alt: "1706m",
      coords: "29°50′N",
      quote: "Quiet oak and blue pine ridge walks, colonial stone churches, and snow-peak panoramas.",
      badge: "GARHWAL CANTONMENT",
    },
  };

  // Deduplicate destinations by slug so each appears exactly once
  const uniqueDestinations = destinations.filter(
    (d, index, self) => index === self.findIndex((t) => t.slug === d.slug)
  );

  const filtered = uniqueDestinations.filter((d) => {
    const slug = d.slug.toLowerCase();
    const isMountains = [
      "manali", "rishikesh", "kasol", "dharamshala", "mussoorie",
      "spiti", "spiti-valley", "leh", "tungnath-chandrashila", "kainchi-dham",
      "dehradun", "lansdowne", "morni-hills", "munnar"
    ].includes(slug);
    const isBeaches = ["goa", "alibaug", "gokarna", "varkala", "puri"].includes(slug);
    const isHeritage = ["jaipur", "udaipur", "varanasi", "neemrana", "alwar-siliserh", "agra", "hampi"].includes(slug);
    const isSpiritual = ["rishikesh", "varanasi", "kainchi-dham", "tungnath-chandrashila", "mathura-vrindavan", "amritsar"].includes(slug);
    const isWildlife = ["sariska-bhangarh", "jim-corbett", "kaziranga", "ranthambore", "kabini"].includes(slug);
    const isSlow = ["kasol", "munnar", "lansdowne", "goa", "dharamshala", "udaipur"].includes(slug);
    const isRoadTrips = ["spiti", "leh", "manali", "jaipur", "udaipur", "morni-hills"].includes(slug);

    let matchCat = true;
    if (selectedCategory === "Mountains") matchCat = isMountains;
    else if (selectedCategory === "Beaches") matchCat = isBeaches;
    else if (selectedCategory === "Heritage") matchCat = isHeritage;
    else if (selectedCategory === "Spiritual") matchCat = isSpiritual;
    else if (selectedCategory === "Wildlife") matchCat = isWildlife;
    else if (selectedCategory === "Slow Travel") matchCat = isSlow;
    else if (selectedCategory === "Road Trips") matchCat = isRoadTrips;

    const s = search.toLowerCase().trim();
    if (!s) return matchCat;

    const matchSearch =
      (d.name || "").toLowerCase().includes(s) ||
      (d.state || "").toLowerCase().includes(s) ||
      (d.region || "").toLowerCase().includes(s) ||
      (destDetails[d.slug]?.hindi || (d as any).hindi_name || "").includes(s);

    return matchCat && matchSearch;
  });

  return (
    <div className="relative overflow-hidden bg-[#EFE5D2] min-h-screen">
      {/* DESTINATION CATALOGUE & DISCOVERY VIEWPORT */}
      <section id="catalogue" className={`pt-6 pb-32 ${isCompact ? "sm:py-6" : "sm:py-8"} px-3 sm:px-6 lg:px-8`}>
        <div className={`max-w-7xl mx-auto ${isCompact ? "space-y-4 sm:space-y-6" : "space-y-8"}`}>
          {/* Top Header & Search Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E5D5BA]">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <TravelStamp label="FEATURED DESTINATIONS" sub="CURATED DISCOVERY" variant="terracotta" />
                <TravelStamp label="VANVAS REGISTRY" variant="forest" />
                <span className="text-[10.5px] font-mono font-bold tracking-widest text-[#7B4D36] uppercase bg-[#FAF7F0] px-2.5 py-0.5 rounded-full border border-[#E5D5BA]">
                  {uniqueDestinations.length > 0 ? `${uniqueDestinations.length} SANCTUARIES` : "SANCTUARIES"}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="font-devanagari text-base sm:text-lg text-[#B65E3C] font-semibold block">
                  कहाँ चलें? • अनूठे रास्ते
                </span>
                <h1 className={`${isCompact ? "text-2xl sm:text-3xl lg:text-4xl" : "text-3xl sm:text-4xl lg:text-5xl"} font-serif font-black text-[#173B32] tracking-tight`}>
                  Featured Destinations
                </h1>
              </div>

              <p className="text-xs text-[#7B4D36] font-light leading-relaxed">
                {isCompact
                  ? "Explore all sanctuaries at a glance."
                  : "Curated destinations, local places and experiences worth travelling for. Switch to authentic photography inside each sanctuary."}
              </p>
            </div>

            {/* Search and Action Toolbar */}
            <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="w-full sm:w-72">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7B4D36]/70" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search destinations, states..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#FAF7F0] border-2 border-[#E5D5BA] focus:border-[#173B32] outline-none text-xs text-[#173B32] font-medium placeholder:text-[#7B4D36]/50 shadow-2xs"
                  />
                </div>
              </div>

              <Link
                href={
                  filtered.length > 0 && (search.trim() || selectedCategory !== "All")
                    ? `/plan?dest=${encodeURIComponent(filtered[0].slug)}&category=${encodeURIComponent(selectedCategory)}`
                    : "/plan"
                }
                className="px-4 py-2.5 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] text-xs font-bold tracking-wider uppercase shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-[#B49252]" />
                <span>{selectedCategory !== "All" ? `Plan ${selectedCategory} →` : "Plan Escape →"}</span>
              </Link>
            </div>
          </div>

          {/* Curated Journey Route Category Controls */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {curatedJourneys.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap interactive-pill flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? "bg-[#173B32] text-[#EFE5D2] shadow-xs scale-102 border-2 border-[#173B32]"
                      : "bg-[#FAF7F0] text-[#20211D]/80 border-2 border-[#E5D5BA] hover:bg-[#E5D5BA]"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#B49252]" : "text-[#7B4D36]"}`} />
                  <span>{cat.label}</span>
                  <span className={`text-[10px] ${isActive ? "text-[#B49252]" : "text-[#7B4D36]"}`}>
                    ({cat.hindi})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Destination Showcase Grid */}
          {loading && destinations.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-[#173B32] gap-2">
              <div className="w-8 h-8 border-3 border-[#B65E3C] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-serif italic text-[#7B4D36]">Unrolling illustrated expedition maps...</span>
            </div>
          ) : loadError && destinations.length === 0 ? (
            <div className="py-12 text-center space-y-3 max-w-md mx-auto bg-[#FAF7F0] p-6 rounded-3xl border-2 border-[#E5D5BA] animate-vanvas-scale">
              <AlertCircle className="w-8 h-8 text-[#B65E3C] mx-auto" />
              <h3 className="text-lg font-serif font-black text-[#173B32]">
                VANVAS couldn&rsquo;t load destinations right now.
              </h3>
              <button
                onClick={loadDestinations}
                className="px-5 py-2 rounded-xl bg-[#173B32] text-[#EFE5D2] text-xs font-bold uppercase tracking-wider hover:bg-[#204E43] interactive-btn flex items-center gap-2 mx-auto cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center space-y-3 max-w-md mx-auto bg-[#FAF7F0] p-6 rounded-3xl border-2 border-[#E5D5BA] animate-vanvas-scale">
              <Compass className="w-8 h-8 text-[#7B4D36] mx-auto opacity-60" />
              <h3 className="text-base font-serif font-black text-[#173B32]">
                No sanctuaries match your criteria
              </h3>
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("All");
                }}
                className="px-4 py-2 rounded-xl bg-[#B65E3C] text-[#EFE5D2] text-xs font-bold uppercase tracking-wider hover:bg-[#9E4D2E] interactive-btn cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : isCompact ? (
            /* COMPACT MODE: 2-COLUMN (MOBILE) / 4-COLUMN (DESKTOP) FIELD GUIDE CATALOGUE */
            <div id="all-destinations" className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {filtered.map((dest, idx) => (
                  <div key={dest.id || dest.slug} className={`animate-vanvas-slide-up stagger-${Math.min(idx + 1, 8)}`}>
                    <CompactDestinationCard
                      destination={dest}
                      daysEstimate={dest.slug === "manali" ? 4 : dest.slug === "rishikesh" ? 3 : 3}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ORIGINAL MODE: IMMERSIVE EDITORIAL MAGAZINE POSTERS */
            <div id="all-destinations" className="space-y-12">
              {/* Top Featured Hero Card */}
              {filtered.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch animate-vanvas-fade">
                  <Link
                    href={`/explore/${filtered[0].slug}`}
                    className="lg:col-span-8 group bg-[#FAF7F0] rounded-3xl border-2 border-[#E5D5BA] hover:border-[#173B32] p-4 sm:p-6 shadow-sm hover:shadow-xl interactive-card flex flex-col md:flex-row gap-6 relative overflow-hidden"
                  >
                    <div className="w-full md:w-1/2 h-72 sm:h-96 rounded-2xl overflow-hidden border border-[#E5D5BA] relative">
                      <DestinationArtwork
                        destination={filtered[0].slug}
                        title={filtered[0].name}
                        hindiName={destDetails[filtered[0].slug]?.hindi || (filtered[0] as any).hindi_name || "यात्रा"}
                        subtitle={filtered[0].state}
                        elevation={destDetails[filtered[0].slug]?.alt}
                        coordinates={destDetails[filtered[0].slug]?.coords}
                        className="w-full h-full"
                      />
                    </div>

                    <div className="w-full md:w-1/2 flex flex-col justify-between py-2 space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <TravelStamp
                            label={destDetails[filtered[0].slug]?.badge || "FEATURED EXPEDITION"}
                            variant="terracotta"
                          />
                          <span className="text-xs font-mono text-[#7B4D36]">
                            {destDetails[filtered[0].slug]?.coords || "SANCTUARY"}
                          </span>
                        </div>

                        <h3 className="text-3xl sm:text-4xl font-serif font-black text-[#173B32]">
                          {filtered[0].name}
                        </h3>
                        <div className="text-sm font-serif text-[#B65E3C] font-semibold">
                          {destDetails[filtered[0].slug]?.hindi || (filtered[0] as any).hindi_name} • {filtered[0].state}
                        </div>

                        <p className="text-xs text-[#20211D]/80 leading-relaxed font-light line-clamp-3">
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
                        <span className="px-5 py-2.5 rounded-xl bg-[#B65E3C] group-hover:bg-[#9E4D2E] text-[#EFE5D2] text-xs font-bold tracking-wider uppercase interactive-btn flex items-center gap-1.5 shadow-sm">
                          <span>Step Inside</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>

                  <div className="lg:col-span-4 flex flex-col justify-between space-y-6">
                    <JournalNote
                      tag="VANVAS EXPEDITION PHILOSOPHY"
                      note="We intentionally don't flood you with 500 tourist traps. Each destination contains handpicked pine cafés, ancient stone temples, secret waterfalls and slow stays."
                      date="HIMALAYAN BASE CAMP"
                      tapeColor="mustard"
                    />

                    <div className="p-6 rounded-3xl bg-[#173B32] text-[#EFE5D2] space-y-4 shadow-md interactive-card">
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
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#B49252] hover:bg-[#9E7D3F] interactive-btn text-[#0F2924] font-bold text-xs uppercase tracking-wider shadow-sm"
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
                {filtered.slice(1, visibleDestCount).map((dest, idx) => (
                  <Link
                    key={dest.id || dest.slug}
                    href={`/explore/${dest.slug}`}
                    className={`group bg-[#FAF7F0] rounded-3xl border-2 border-[#E5D5BA] hover:border-[#173B32] shadow-xs hover:shadow-xl interactive-card flex flex-col justify-between p-4 animate-vanvas-slide-up stagger-${Math.min(idx + 1, 8)}`}
                  >
                    <div className="h-72 w-full rounded-2xl overflow-hidden border border-[#E5D5BA] relative">
                      <DestinationArtwork
                        destination={dest.slug}
                        title={dest.name}
                        hindiName={destDetails[dest.slug]?.hindi || (dest as any).hindi_name || "सफ़र"}
                        subtitle={dest.state}
                        elevation={destDetails[dest.slug]?.alt}
                        coordinates={destDetails[dest.slug]?.coords}
                        className="w-full h-full"
                      />
                    </div>

                    <div className="p-3 pt-5 space-y-3 flex-1 flex flex-col justify-between">
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

                        <h3 className="text-2xl font-serif font-black text-[#173B32] group-hover:text-[#B65E3C] transition-colors mt-0.5">
                          {dest.name}
                        </h3>
                        <p className="text-xs text-[#7B4D36] italic font-serif">
                          {destDetails[dest.slug]?.quote || dest.tagline}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#E5D5BA] flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#536B52]">
                          {dest.places_count || 10} Places
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

              {/* Show More */}
              {filtered.length > visibleDestCount && (
                <div className="pt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleDestCount((prev) => prev + 6)}
                    className="px-6 py-3 rounded-2xl bg-[#FAF7F0] hover:bg-[#E5D5BA] border-2 border-[#E5D5BA] hover:border-[#173B32] text-[#173B32] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <Compass className="w-4 h-4 text-[#B65E3C]" />
                    <span>Show More Sanctuaries ({filtered.length - visibleDestCount} Remaining)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
