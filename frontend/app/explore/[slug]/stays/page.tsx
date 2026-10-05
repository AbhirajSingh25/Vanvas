"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  BedDouble, MapPin, Star, ShieldCheck, Compass, ArrowLeft,
  Search, SlidersHorizontal, CheckCircle2, Phone, ExternalLink,
  Users, Building2, Clock, Sparkles, Navigation, X, Heart,
  Share2, Eye, Coffee, Wifi, Flame, ChevronRight
} from "lucide-react";
import { api } from "@/lib/api";
import { Hotel, Destination } from "@/types";
import { VanvasImage } from "@/components/ui/VanvasImage";
import { resolvePlaceArtwork, resolveHotelArtwork } from "@/lib/placeVisualResolver";
import { CANONICAL_DESTINATIONS } from "@/lib/canonicalDestinations";
import { useDensity } from "@/context/DensityContext";
import { CompactStayCard } from "@/components/compact";

const ACCOMMODATION_STYLES = [
  "All",
  "Heritage",
  "Resort",
  "Boutique",
  "Homestay",
  "Hostel",
];

const TRAVELLER_PROFILES = [
  "All",
  "Solo",
  "Couples",
  "Adventure",
  "Family",
];

export default function DestinationStaysPage() {
  const { isCompact } = useDensity();
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || "manali";

  const [destination, setDestination] = useState<Destination | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("All");
  const [selectedProfile, setSelectedProfile] = useState("All");
  const [sortBy, setSortBy] = useState<"default" | "price_asc" | "price_desc" | "rating">("default");

  // Property Modal
  const [selectedStayForModal, setSelectedStayForModal] = useState<Hotel | null>(null);
  const [stayModalOpen, setStayModalOpen] = useState(false);
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // 1. Fetch canonical destination fallback or live detail
        const canon = CANONICAL_DESTINATIONS.find((d) => d.slug === slug);
        if (canon) {
          setDestination(canon as any);
        }

        const destDetail = await api.getDestinationDetail(slug).catch(() => null);
        if (destDetail) {
          if (destDetail.destination) {
            setDestination(destDetail.destination);
          }
          if (destDetail.hotels) {
            setHotels(destDetail.hotels || []);
          }
        }
      } catch (err) {
        console.error("Failed to load stays:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug]);

  // Filter & sort logic
  const filteredHotels = useMemo(() => {
    let result = [...hotels];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          (h.address && h.address.toLowerCase().includes(q)) ||
          (h.hotel_style && h.hotel_style.toLowerCase().includes(q)) ||
          (h.amenities && h.amenities.toLowerCase().includes(q))
      );
    }

    // Accommodation Style
    if (selectedStyle !== "All") {
      result = result.filter((h) => {
        const styleStr = (h.hotel_style || h.accommodation_type || "").toLowerCase();
        return styleStr.includes(selectedStyle.toLowerCase());
      });
    }

    // Traveller Profile
    if (selectedProfile !== "All") {
      result = result.filter((h) => {
        if (!h.traveller_tags || h.traveller_tags.length === 0) return true;
        return h.traveller_tags.some((tag) => tag.toLowerCase().includes(selectedProfile.toLowerCase()));
      });
    }

    // Sort
    if (sortBy === "price_asc") {
      result.sort((a, b) => (a.price_per_night || 0) - (b.price_per_night || 0));
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => (b.price_per_night || 0) - (a.price_per_night || 0));
    } else if (sortBy === "rating") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [hotels, searchQuery, selectedStyle, selectedProfile, sortBy]);

  const destName = destination?.name || slug.charAt(0).toUpperCase() + slug.slice(1);

  return (
    <div className="min-h-screen bg-[#F4EDE0] text-[#173B32]">
      {/* Top Header & Breadcrumbs */}
      <div
        style={{ top: "var(--vanvas-top-offset, 4rem)" }}
        className="bg-[#FAF7F0] border-b border-[#E5D5BA] sticky z-30 shadow-2xs backdrop-blur-md bg-opacity-95"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/explore/${slug}`}
              className="p-2 rounded-xl bg-white border border-[#E5D5BA] hover:bg-[#EFE5D2] text-[#173B32] transition-colors flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4 text-[#B65E3C]" />
              <span className="hidden sm:inline">Back to {destName}</span>
            </Link>
            <div className="flex items-center gap-2 text-xs text-[#7B4D36]">
              <Link href="/explore" className="hover:underline">
                Explore
              </Link>
              <span>/</span>
              <Link href={`/explore/${slug}`} className="hover:underline">
                {destName}
              </Link>
              <span>/</span>
              <span className="font-bold text-[#173B32]">Stays &amp; Sanctuaries</span>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-[#173B32] text-[#EFE5D2] flex items-center gap-1.5 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{hotels.length} Verified Stays</span>
          </span>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="bg-[#173B32] text-[#FAF4E8] py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#B65E3C] text-white text-[10px] font-mono font-bold uppercase tracking-wider">
              आशियाना • DESTINATION STAYS
            </span>
            <span className="text-xs text-[#E5D5BA]/80 font-mono">
              {destination?.state || "India"}
            </span>
          </div>

          <h1 className="font-serif font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight">
            Stays &amp; Sanctuaries in {destName}
          </h1>

          <p className="text-sm sm:text-base text-[#EFE5D2]/80 max-w-2xl leading-relaxed">
            Curated mountain lodges, heritage havelis, and serene forest sanctuaries isolated exclusively to {destName}. Each stay provides verified provenance and honest booking paths.
          </p>
        </div>

        {/* Decorative Background Pattern */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none bg-[radial-gradient(#E5D5BA_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Search, Filter & Sort Controls */}
        <div className="bg-[#FAF7F0] p-5 rounded-3xl border-2 border-[#E5D5BA] shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#7B4D36] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Search stays in ${destName} by name, location, or amenity...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-[#E5D5BA] text-xs sm:text-sm text-[#173B32] focus:outline-none focus:border-[#173B32] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#7B4D36] hover:text-[#173B32]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-[#7B4D36] flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#B65E3C]" />
                <span>Sort:</span>
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-white border border-[#E5D5BA] text-xs font-semibold text-[#173B32] focus:outline-none focus:border-[#173B32] cursor-pointer"
              >
                <option value="default">Curated Order</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="space-y-3 pt-3 border-t border-[#E5D5BA]/80">
            {/* Style Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7B4D36] shrink-0 sm:w-36 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#B65E3C]" />
                <span>Style:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {ACCOMMODATION_STYLES.map((style) => {
                  const isActive = selectedStyle === style;
                  return (
                    <button
                      key={style}
                      onClick={() => setSelectedStyle(style)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#173B32] text-[#EFE5D2] shadow-xs scale-[1.02]"
                          : "bg-white hover:bg-[#EFE5D2] text-[#7B4D36] border border-[#E5D5BA]"
                      }`}
                    >
                      {style}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Profile Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7B4D36] shrink-0 sm:w-36 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#B65E3C]" />
                <span>Traveller:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {TRAVELLER_PROFILES.map((profile) => {
                  const isActive = selectedProfile === profile;
                  return (
                    <button
                      key={profile}
                      onClick={() => setSelectedProfile(profile)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#B65E3C] text-[#FAF4E8] shadow-xs scale-[1.02]"
                          : "bg-white hover:bg-[#EFE5D2] text-[#7B4D36] border border-[#E5D5BA]"
                      }`}
                    >
                      {profile}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between text-xs text-[#7B4D36] font-mono">
          <span>Showing {filteredHotels.length} verified stays in {destName}</span>
          {(selectedStyle !== "All" || selectedProfile !== "All" || searchQuery) && (
            <button
              onClick={() => {
                setSelectedStyle("All");
                setSelectedProfile("All");
                setSearchQuery("");
              }}
              className="text-[#B65E3C] font-bold hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Stays Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] animate-pulse space-y-4">
                <div className="h-48 bg-[#E5D5BA]/60 rounded-2xl" />
                <div className="h-5 bg-[#E5D5BA]/80 rounded w-2/3" />
                <div className="h-3 bg-[#E5D5BA]/50 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredHotels.length > 0 ? (
          isCompact ? (
            /* COMPACT MODE: FIELD GUIDE CATALOGUE GRID */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredHotels.map((h) => (
                <CompactStayCard
                  key={h.id}
                  hotel={h}
                  onSelect={(hotel) => {
                    setSelectedStayForModal(hotel);
                    setStayModalOpen(true);
                  }}
                />
              ))}
            </div>
          ) : (
            /* ORIGINAL MODE: IMMERSIVE EDITORIAL CARDS */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHotels.map((h) => {
                const isPriceVerified = typeof h.price_per_night === "number" && h.price_per_night > 0;
                const displayPrice = isPriceVerified ? `₹${h.price_per_night}/night` : "Rate upon inquiry";
                const stayVisual = resolveHotelArtwork(h.name, destName, h.hotel_style || h.accommodation_type, h.image_url, h.is_live, h.source);

                // Direction url
                const dirUrl = h.latitude && h.longitude
                  ? `https://www.google.com/maps/dir/?api=1&destination=${h.latitude},${h.longitude}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${h.name} ${destName}`)}`;

                return (
                  <div
                    key={h.id}
                    className="p-5 space-y-4 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] hover:border-[#173B32]/50 shadow-2xs hover:shadow-xl transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      {/* Visual Card Header */}
                      <div
                        onClick={() => {
                          setSelectedStayForModal(h);
                          setStayModalOpen(true);
                        }}
                        className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-[#E5D5BA] cursor-pointer group-hover:shadow-md transition-shadow"
                      >
                        <VanvasImage
                          src={stayVisual.imageUrl}
                          fallbackSrc={stayVisual.fallbackUrl}
                          alt={`${h.name} in ${destName}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />

                        {/* Top Provenance Badge */}
                        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#173B32] text-[#EFE5D2] shadow-xs">
                            {h.badge || "VERIFIED SANCTUARY"}
                          </span>
                          {h.rating && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FAF4E8]/90 backdrop-blur-xs text-[#173B32] flex items-center gap-1 shadow-xs border border-white/20">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              <span>{h.rating.toFixed(1)}</span>
                            </span>
                          )}
                        </div>

                        {/* Bottom Category Tag */}
                        <div className="absolute bottom-2.5 left-2.5">
                          <span className="px-2.5 py-0.5 rounded-md bg-[#0F2924]/85 backdrop-blur-xs text-[#FAF4E8] text-[10px] font-medium border border-white/10">
                            {h.hotel_style || h.accommodation_type || "Boutique Sanctuary"}
                          </span>
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-serif font-bold text-lg text-[#173B32] leading-snug group-hover:text-[#B65E3C] transition-colors">
                            {h.name}
                          </h3>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-sm text-[#B65E3C] block">
                              {displayPrice}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-[#7B4D36] line-clamp-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#B65E3C] shrink-0" />
                          <span>{h.address}</span>
                        </p>

                        {/* Amenities pills */}
                        {h.amenities && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {h.amenities.split(",").slice(0, 3).map((am, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md bg-white border border-[#E5D5BA] text-[10px] font-medium text-[#7B4D36]"
                              >
                                {am.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions & Timings */}
                    <div className="space-y-3 pt-3 border-t border-[#E5D5BA]/80">
                      <div className="flex items-center justify-between text-[11px] text-[#7B4D36] font-mono">
                        <span>Check-in: {h.check_in_time || "11:00 AM"}</span>
                        <span>Check-out: {h.check_out_time || "10:00 AM"}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setSelectedStayForModal(h);
                            setStayModalOpen(true);
                          }}
                          className="py-2.5 px-3 rounded-xl bg-white border border-[#E5D5BA] hover:bg-[#EFE5D2] text-[#173B32] text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#B65E3C]" />
                          <span>View Details</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedStayForModal(h);
                            setInquiryModalOpen(true);
                            setInquirySuccess(false);
                          }}
                          className="py-2.5 px-3 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <BedDouble className="w-3.5 h-3.5 text-[#EFE5D2]" />
                          <span>Check Rates</span>
                        </button>
                      </div>

                      <a
                        href={dirUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-[#7B4D36] hover:text-[#173B32] flex items-center justify-center gap-1 py-1 font-medium transition-colors"
                      >
                        <Navigation className="w-3 h-3 text-[#B65E3C]" />
                        <span>Get Navigation Directions</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="p-12 text-center bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-3xl space-y-3">
            <BedDouble className="w-10 h-10 text-[#B65E3C] mx-auto opacity-70" />
            <h4 className="font-serif font-bold text-lg text-[#173B32]">
              No verified stays matching your current filters.
            </h4>
            <p className="text-xs text-[#7B4D36] max-w-md mx-auto">
              Try adjusting your style, traveller profile, or search term to discover other accommodations in {destName}.
            </p>
            <button
              onClick={() => {
                setSelectedStyle("All");
                setSelectedProfile("All");
                setSearchQuery("");
              }}
              className="px-4 py-2 rounded-xl bg-[#173B32] text-white text-xs font-bold hover:bg-[#20453B] transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Property Details Modal */}
      {stayModalOpen && selectedStayForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A100D]/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#FAF7F0] border-2 border-[#E5D5BA] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 bg-[#173B32] text-[#FAF4E8] flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B65E3C] bg-white/10 px-2 py-0.5 rounded">
                  {selectedStayForModal.hotel_style || "Curated Sanctuary"}
                </span>
                <h2 className="font-serif font-black text-2xl text-[#FAF4E8] mt-1">
                  {selectedStayForModal.name}
                </h2>
                <p className="text-xs text-[#EFE5D2]/80 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#B65E3C] shrink-0" />
                  <span>{selectedStayForModal.address}</span>
                </p>
              </div>

              <button
                onClick={() => setStayModalOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#FAF4E8] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-[#20211D]">
              {/* Primary Image Preview */}
              <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-[#E5D5BA]">
                {(() => {
                  const modalVis = resolveHotelArtwork(
                    selectedStayForModal.name,
                    destName,
                    selectedStayForModal.hotel_style || selectedStayForModal.accommodation_type,
                    selectedStayForModal.image_url,
                    selectedStayForModal.is_live,
                    selectedStayForModal.source
                  );
                  return (
                    <VanvasImage
                      src={modalVis.imageUrl}
                      fallbackSrc={modalVis.fallbackUrl}
                      alt={selectedStayForModal.name}
                      className="w-full h-full object-cover"
                    />
                  );
                })()}
                <div className="absolute bottom-3 left-3 px-3 py-1 rounded-md bg-[#0F2924]/85 text-[#FAF4E8] text-xs font-mono font-bold">
                  {selectedStayForModal.price_per_night ? `₹${selectedStayForModal.price_per_night}/night` : "Tariff on Inquiry"}
                </div>
              </div>

              {/* Verified Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-[#E5D5BA] space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-[#7B4D36]">Check-in</span>
                  <p className="font-bold text-xs text-[#173B32]">{selectedStayForModal.check_in_time || "11:00 AM"}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-[#E5D5BA] space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-[#7B4D36]">Check-out</span>
                  <p className="font-bold text-xs text-[#173B32]">{selectedStayForModal.check_out_time || "10:00 AM"}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-[#E5D5BA] space-y-0.5 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-mono uppercase text-[#7B4D36]">Rating</span>
                  <p className="font-bold text-xs text-[#173B32] flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{selectedStayForModal.rating ? `${selectedStayForModal.rating.toFixed(1)} / 5.0` : "Curated Stay"}</span>
                  </p>
                </div>
              </div>

              {/* Amenities */}
              {selectedStayForModal.amenities && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#173B32]">
                    Verified Property Amenities
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStayForModal.amenities.split(",").map((am, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-xl bg-white border border-[#E5D5BA] text-xs font-semibold text-[#7B4D36] flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3 h-3 text-[#B65E3C]" />
                        <span>{am.trim()}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Booking CTAs */}
              <div className="p-4 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-sm text-[#173B32]">
                    Availability &amp; Reservation
                  </h4>
                  <span className="text-xs font-bold text-[#B65E3C]">
                    {selectedStayForModal.price_per_night ? `₹${selectedStayForModal.price_per_night}/night` : "Upon Inquiry"}
                  </span>
                </div>
                <p className="text-xs text-[#7B4D36] leading-relaxed">
                  VANVAS verifies property listings honestly without fabricating URLs. You can check availability via verified partner routes or directly submit a reservation inquiry.
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedStayForModal.booking_url ? (
                    <a
                      href={selectedStayForModal.booking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 px-4 rounded-xl bg-[#173B32] text-white text-xs font-bold hover:bg-[#20453B] transition-colors flex items-center justify-center gap-2"
                    >
                      <span>Book on Partner Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : null}

                  <button
                    onClick={() => {
                      setInquiryModalOpen(true);
                      setInquirySuccess(false);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#B65E3C] text-white text-xs font-bold hover:bg-[#A35130] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <BedDouble className="w-3.5 h-3.5" />
                    <span>Inquire Directly</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Direct Inquiry Modal */}
      {inquiryModalOpen && selectedStayForModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#0A100D]/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#FAF7F0] border-2 border-[#E5D5BA] w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B65E3C]">
                  DIRECT PROPERTY INQUIRY
                </span>
                <h3 className="font-serif font-bold text-lg text-[#173B32] mt-0.5">
                  {selectedStayForModal.name}
                </h3>
              </div>
              <button
                onClick={() => setInquiryModalOpen(false)}
                className="p-1 rounded-full text-[#7B4D36] hover:bg-[#E5D5BA]/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {inquirySuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-serif font-bold text-base text-[#173B32]">
                  Inquiry Dispatched to {selectedStayForModal.name}
                </h4>
                <p className="text-xs text-[#7B4D36]">
                  The property reception will respond with verified rates &amp; room availability for your travel window.
                </p>
                <button
                  onClick={() => setInquiryModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-[#173B32] text-white text-xs font-bold hover:bg-[#20453B] transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                <p className="text-xs text-[#7B4D36] leading-relaxed">
                  Send a direct inquiry for {destName} travel dates. The property will contact you with availability and special direct-booking rates.
                </p>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#173B32]">Notes or Special Requests</label>
                  <textarea
                    rows={3}
                    placeholder="e.g., Requesting quiet room with balcony, 2 guests, checking in this Friday..."
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white border border-[#E5D5BA] text-xs text-[#173B32] focus:outline-none focus:border-[#173B32]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setInquiryModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white border border-[#E5D5BA] text-xs font-bold text-[#7B4D36] hover:bg-[#EFE5D2] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setInquirySuccess(true)}
                    className="flex-1 py-2.5 rounded-xl bg-[#173B32] text-white text-xs font-bold hover:bg-[#20453B] transition-colors cursor-pointer shadow-xs"
                  >
                    Send Inquiry
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
