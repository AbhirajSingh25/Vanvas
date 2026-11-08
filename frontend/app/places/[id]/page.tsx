"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Clock, Star, Sparkles, Navigation, ExternalLink,
  Share2, Check, Bookmark, PlusCircle, Compass, Camera, ShieldAlert,
  Utensils, BedDouble, Phone, Loader2, AlertCircle, ArrowRight
} from "lucide-react";
import { Place } from "@/types";
import { api } from "@/lib/api";
import { VanvasImage } from "@/components/ui/VanvasImage";
import { resolvePlaceArtwork, resolveHotelArtwork } from "@/lib/placeVisualResolver";
import { SingleRowCarousel } from "@/components/ui/SingleRowCarousel";

export default function PlaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const placeId = params?.id as string;

  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  useEffect(() => {
    if (!placeId) return;

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getPlaceDetail(placeId);
        setPlace(res);
        setIsSaved(Boolean(res.is_saved));
      } catch (err: any) {
        console.warn("Could not fetch place detail:", err);
        setError("Unable to load landmark details. Please verify the URL or try searching again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [placeId]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      if (navigator?.share) {
        navigator.share({
          title: place?.name ? `${place.name} — VANVAS Field Dossier` : "VANVAS",
          text: place?.description || "",
          url: window.location.href,
        }).catch(() => {});
      } else if (navigator?.clipboard) {
        navigator.clipboard.writeText(window.location.href);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2500);
      }
    }
  };

  const handleToggleSave = async () => {
    if (!place) return;
    try {
      const res = await api.toggleSavePlace(place.id);
      setIsSaved(res.saved);
    } catch (err) {
      console.warn("Could not save place:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F0] dark:bg-[#0F1A17] flex flex-col items-center justify-center p-6 text-[#173B32] dark:text-[#FAF7F0]">
        <Loader2 className="w-8 h-8 text-[#B65E3C] animate-spin mb-3" />
        <p className="font-serif font-bold text-lg">Loading landmark intelligence...</p>
        <p className="text-xs text-[#7B4D36] dark:text-[#C5A898] font-mono mt-1">VANVAS 20-Point Field Dossier</p>
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="min-h-screen bg-[#FAF7F0] dark:bg-[#0F1A17] flex flex-col items-center justify-center p-6 text-[#173B32] dark:text-[#FAF7F0]">
        <AlertCircle className="w-10 h-10 text-[#B65E3C] mb-3" />
        <h1 className="font-serif font-black text-2xl mb-2">Landmark Not Found</h1>
        <p className="text-xs text-[#7B4D36] dark:text-[#C5A898] max-w-md text-center mb-6">{error || "This place record could not be retrieved."}</p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-[#173B32] text-[#FAF7F0] text-xs font-bold uppercase tracking-wider hover:bg-[#20453B] transition-all"
        >
          Return to Discovery
        </Link>
      </div>
    );
  }

  const destSlug = (place.destination_slug || place.destination_id || "").replace(/^(dyn|dest)-/, "");
  const destName = place.destination_name || "Destination";
  const visualRes = resolvePlaceArtwork(
    place.name,
    destName,
    place.category || "Attractions",
    place.image_url,
    place.is_live,
    place.source
  );

  return (
    <div className="min-h-screen bg-[#FAF7F0] dark:bg-[#0F1A17] text-[#173B32] dark:text-[#FAF7F0] pb-24 selection:bg-[#B49252]/30">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-[#FAF7F0]/95 dark:bg-[#0F1A17]/95 backdrop-blur-md border-b border-[#E5D5BA]/80 dark:border-[#2C3B34] px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full bg-[#EFE5D2] dark:bg-[#1C2E27] text-[#173B32] dark:text-[#FAF7F0] hover:bg-[#E5D5BA] transition-colors"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#B65E3C] dark:text-[#E28C68] font-bold">
              {destName} • Field Dossier
            </span>
            <span className="font-serif font-bold text-sm sm:text-base text-[#173B32] dark:text-[#FAF7F0] truncate max-w-[200px] sm:max-w-xs">
              {place.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-[#EFE5D2] dark:bg-[#1C2E27] text-[#173B32] dark:text-[#FAF7F0] hover:bg-[#E5D5BA] transition-all flex items-center gap-1.5 text-xs font-mono"
            aria-label="Share Landmark"
          >
            {copiedShare ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{copiedShare ? "Copied" : "Share"}</span>
          </button>
          <button
            onClick={handleToggleSave}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              isSaved
                ? "bg-[#B65E3C] border-[#B65E3C] text-white"
                : "bg-[#EFE5D2] dark:bg-[#1C2E27] border-[#E5D5BA] dark:border-[#2C3B34] text-[#173B32] dark:text-[#FAF7F0]"
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-current" : ""}`} />
            <span>{isSaved ? "Saved" : "Save"}</span>
          </button>
          <Link
            href={`/plan?destination=${destSlug}&place=${encodeURIComponent(place.name)}`}
            className="px-4 py-1.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#FAF7F0] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Compass className="w-3.5 h-3.5 text-[#B49252]" />
            <span className="hidden sm:inline">Plan Trip</span>
          </Link>
        </div>
      </nav>

      {/* Main Content Container */}
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Hero Artwork Container */}
        <div className="relative h-72 sm:h-96 w-full rounded-3xl overflow-hidden shadow-xl border-2 border-[#E5D5BA] dark:border-[#2C3B34] bg-[#173B32]">
          <VanvasImage
            src={visualRes.imageUrl}
            fallbackSrc={visualRes.fallbackUrl}
            alt={place.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F2924]/95 via-[#0F2924]/30 to-transparent pointer-events-none" />

          {/* Badges & Place Title */}
          <div className="absolute bottom-6 left-6 right-6 text-[#FAF7F0] space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#173B32] text-[#FAF7F0] text-[10px] font-bold uppercase tracking-wider border border-[#536B52]">
                {place.category || "Attractions"}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#B49252] text-[#0F2924] text-[9px] font-mono font-bold uppercase tracking-wider">
                {visualRes.badgeLabel}
              </span>
              {place.is_open_now === true && (
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Open Now
                </span>
              )}
              {place.is_must_visit && (
                <span className="px-2.5 py-0.5 rounded-md bg-[#B65E3C] text-white text-[10px] font-black uppercase tracking-wider">
                  Must Visit
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight leading-tight">
              {place.name}
            </h1>
            <p className="text-xs text-[#D8DED5] font-mono">
              {destName} • {place.address || `${destName}, India`}
            </p>
          </div>
        </div>

        {/* 20-Point Essential Travel Data Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#EFE5D2] dark:bg-[#15231F] border border-[#E5D5BA] dark:border-[#2C3B34] space-y-1">
            <span className="text-[10px] font-mono uppercase font-bold text-[#7B4D36] dark:text-[#E28C68] block">
              उत्तम समय • Best Time
            </span>
            <p className="text-xs font-semibold text-[#173B32] dark:text-[#FAF7F0]">
              {place.best_time_to_visit || "Early morning (06:30 - 10:00)"}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#EFE5D2] dark:bg-[#15231F] border border-[#E5D5BA] dark:border-[#2C3B34] space-y-1">
            <span className="text-[10px] font-mono uppercase font-bold text-[#7B4D36] dark:text-[#E28C68] block">
              अनुमानित समय • Duration
            </span>
            <p className="text-xs font-semibold text-[#173B32] dark:text-[#FAF7F0]">
              {place.estimated_duration || `${place.recommended_duration_mins || 60} mins`}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#EFE5D2] dark:bg-[#15231F] border border-[#E5D5BA] dark:border-[#2C3B34] space-y-1">
            <span className="text-[10px] font-mono uppercase font-bold text-[#7B4D36] dark:text-[#E28C68] block">
              प्रवेश शुल्क • Entry & Permits
            </span>
            <p className="text-xs font-semibold text-[#173B32] dark:text-[#FAF7F0]">
              {place.entry_fee_details || (place.approx_cost && place.approx_cost > 0 ? `₹${place.approx_cost}` : "Free Admission")}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#EFE5D2] dark:bg-[#15231F] border border-[#E5D5BA] dark:border-[#2C3B34] space-y-1">
            <span className="text-[10px] font-mono uppercase font-bold text-[#7B4D36] dark:text-[#E28C68] block">
              दूरी • Distance & Time
            </span>
            <p className="text-xs font-semibold text-[#173B32] dark:text-[#FAF7F0] font-mono">
              {typeof place.distance_from_center_km === "number"
                ? `${place.distance_from_center_km} km (~${place.travel_time_from_center_mins || 20}m)`
                : typeof place.distance_km === "number"
                ? `${place.distance_km} km away`
                : "Valley Center"}
            </p>
          </div>
        </div>

        {/* GPS Coordinates Bar */}
        {place.latitude && place.longitude && (
          <div className="p-3.5 rounded-2xl bg-[#FAF7F0] dark:bg-[#15231F] border border-[#E5D5BA] dark:border-[#2C3B34] flex items-center justify-between text-xs text-[#173B32] dark:text-[#FAF7F0]">
            <div className="flex items-center gap-2 font-mono">
              <Navigation className="w-4 h-4 text-[#B65E3C]" />
              <span>Coordinates: {place.latitude.toFixed(4)}°N, {place.longitude.toFixed(4)}°E</span>
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-[#173B32] text-[#FAF7F0] font-bold text-[11px] flex items-center gap-1.5 hover:bg-[#20453B] transition-all"
            >
              <MapPin className="w-3 h-3 text-[#B49252]" />
              <span>Get Directions</span>
            </a>
          </div>
        )}

        {/* Spiti Valley Mobility & Gateway Advisory */}
        {(destName.toLowerCase().includes("spiti") || place.destination_id?.toLowerCase().includes("spiti")) && (
          <div className="p-4 rounded-2xl bg-[#FAF4E8] dark:bg-[#1A2C27] border-2 border-[#B49252]/50 flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-[#B65E3C] dark:text-[#E2B79A] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-serif font-black text-[#173B32] dark:text-[#FAF7F0] uppercase tracking-wide">
                Spiti Valley Mobility Logistics — Gateway Required
              </h4>
              <p className="text-xs text-[#7B4D36] dark:text-[#D8DED5] leading-relaxed">
                <strong>No local motorcycle rentals in Kaza:</strong> Kaza has no commercial rental depots. All self-drive motorcycles and 4x4s must be secured at Manali, Shimla, or Chandigarh gateway hubs before ascending into the trans-Himalayan high passes.
              </p>
            </div>
          </div>
        )}

        {/* Description & Field Notes */}
        <div className="p-6 rounded-3xl bg-[#EFE5D2] dark:bg-[#15231F] border border-[#E5D5BA] dark:border-[#2C3B34] space-y-3">
          <h2 className="font-serif font-black text-lg text-[#173B32] dark:text-[#FAF7F0]">
            स्थान परिचय • Field Notes & Significance
          </h2>
          <p className="text-sm text-[#20211D]/85 dark:text-[#FAF7F0]/85 leading-relaxed font-light">
            {place.description || "Authentic verified landmark."}
          </p>

          {place.why_vanvas_recommends && (
            <div className="mt-4 p-4 rounded-2xl bg-[#FAF7F0] dark:bg-[#1A2C27] border-l-4 border-l-[#B65E3C] border border-[#E5D5BA] dark:border-[#2C3B34] space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-[#B65E3C] dark:text-[#E28C68] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#B49252]" />
                <span>VANVAS Editorial Perspective</span>
              </div>
              <p className="text-xs text-[#173B32] dark:text-[#FAF7F0] leading-relaxed italic font-serif">
                &ldquo;{place.why_vanvas_recommends}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Cultural Significance & Photography & Tips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {place.historical_significance && (
            <div className="p-5 rounded-3xl bg-[#FAF7F0] dark:bg-[#15231F] border border-[#E5D5BA] dark:border-[#2C3B34] space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-[#173B32] dark:text-[#FAF7F0] uppercase tracking-wider">
                <Compass className="w-4 h-4 text-[#B49252]" />
                <span>Cultural & Historical Context</span>
              </div>
              <p className="text-xs text-[#20211D]/80 dark:text-[#C5A898] leading-relaxed font-light">
                {place.historical_significance}
              </p>
            </div>
          )}

          {place.photography_spots && (
            <div className="p-5 rounded-3xl bg-[#FAF7F0] dark:bg-[#15231F] border border-[#E5D5BA] dark:border-[#2C3B34] space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-[#7B4D36] dark:text-[#E28C68] uppercase tracking-wider">
                <Camera className="w-4 h-4 text-[#B65E3C]" />
                <span>Photography & Vantage Points</span>
              </div>
              <p className="text-xs text-[#20211D]/80 dark:text-[#C5A898] leading-relaxed font-light">
                {place.photography_spots}
              </p>
            </div>
          )}
        </div>

        {/* Practical & Safety Tips */}
        {place.practical_tips && (
          <div className="p-5 rounded-3xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-amber-900 dark:text-amber-200 uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <span>Visitor Guidelines & Safety Tips</span>
            </div>
            <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed font-light">
              {place.practical_tips}
            </p>
          </div>
        )}

        {/* SINGLE-ROW CAROUSEL: Nearby Attractions */}
        {place.nearby_attractions && place.nearby_attractions.length > 0 && (
          <div className="pt-4 border-t border-[#E5D5BA]/80 dark:border-[#2C3B34]">
            <SingleRowCarousel
              items={place.nearby_attractions}
              title="Nearby Logical Pairings & Attractions"
              subtitle={`Attractions within easy travel distance from ${place.name}`}
              eyebrow="GEOGRAPHIC CLUSTER"
              itemWidthClass="w-[78vw] sm:w-[300px] lg:w-[320px]"
              keyExtractor={(na) => na.id}
              renderItem={(na) => {
                const naVisual = resolvePlaceArtwork(na.name, destName, na.category || "Must Visit");
                return (
                  <Link
                    href={`/places/${na.slug || na.id}`}
                    className="p-3.5 rounded-2xl bg-[#FAF7F0] dark:bg-[#15231F] hover:bg-[#FAF4E8] dark:hover:bg-[#1C2E27] border border-[#E5D5BA] dark:border-[#2C3B34] transition-all flex flex-col justify-between h-full group shadow-2xs hover:shadow-md"
                  >
                    <div className="space-y-2.5">
                      <div className="h-28 w-full rounded-xl overflow-hidden bg-[#0F2924] relative">
                        <VanvasImage
                          src={naVisual.imageUrl}
                          fallbackSrc={naVisual.fallbackUrl}
                          alt={na.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#0F2924]/80 text-[#FAF7F0] backdrop-blur-xs">
                          {na.category}
                        </span>
                      </div>
                      <span className="font-serif font-bold text-sm text-[#173B32] dark:text-[#FAF7F0] line-clamp-1 group-hover:text-[#B65E3C] transition-colors">
                        {na.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#7B4D36] dark:text-[#C5A898] mt-2 font-mono pt-1 border-t border-[#E5D5BA]/50 dark:border-[#2C3B34]/60">
                      <span>{na.distance_km ? `${na.distance_km} km away` : "Nearby"}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#B65E3C] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              }}
            />
          </div>
        )}

        {/* SINGLE-ROW CAROUSEL: Nearby Food & Cafes */}
        {place.nearby_food && place.nearby_food.length > 0 && (
          <div className="pt-4 border-t border-[#E5D5BA]/80 dark:border-[#2C3B34]">
            <SingleRowCarousel
              items={place.nearby_food}
              title="Where to Eat & Drink Nearby"
              subtitle={`Verified cafes and eateries located near ${place.name}`}
              eyebrow="CULINARY SPOTS"
              itemWidthClass="w-[78vw] sm:w-[300px] lg:w-[320px]"
              keyExtractor={(nf) => nf.id}
              renderItem={(nf) => {
                const foodVisual = resolvePlaceArtwork(nf.name, destName, "Cafes & Food");
                return (
                  <Link
                    href={`/places/${nf.slug || nf.id}`}
                    className="p-3.5 rounded-2xl bg-[#FAF7F0] dark:bg-[#15231F] hover:bg-[#FAF4E8] dark:hover:bg-[#1C2E27] border border-[#E5D5BA] dark:border-[#2C3B34] transition-all flex flex-col justify-between h-full group shadow-2xs hover:shadow-md"
                  >
                    <div className="space-y-2.5">
                      <div className="h-28 w-full rounded-xl overflow-hidden bg-[#0F2924] relative">
                        <VanvasImage
                          src={foodVisual.imageUrl}
                          fallbackSrc={foodVisual.fallbackUrl}
                          alt={nf.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#B65E3C]/90 text-white backdrop-blur-xs flex items-center gap-1">
                          <Utensils className="w-2.5 h-2.5" />
                          <span>{nf.category || "Dining"}</span>
                        </span>
                      </div>
                      <span className="font-serif font-bold text-sm text-[#173B32] dark:text-[#FAF7F0] line-clamp-1 group-hover:text-[#B65E3C] transition-colors">
                        {nf.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#7B4D36] dark:text-[#C5A898] mt-2 font-mono pt-1 border-t border-[#E5D5BA]/50 dark:border-[#2C3B34]/60">
                      <span>{nf.distance_km ? `${nf.distance_km} km away` : "Nearby"}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#B65E3C] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              }}
            />
          </div>
        )}

        {/* SINGLE-ROW CAROUSEL: Nearby Stays */}
        {place.nearby_stays && place.nearby_stays.length > 0 && (
          <div className="pt-4 border-t border-[#E5D5BA]/80 dark:border-[#2C3B34]">
            <SingleRowCarousel
              items={place.nearby_stays}
              title="Verified Stays & Retreats Nearby"
              subtitle={`Authentic homestays, hotels, and camps close to ${place.name}`}
              eyebrow="ACCOMMODATION"
              itemWidthClass="w-[78vw] sm:w-[300px] lg:w-[320px]"
              keyExtractor={(ns) => ns.id}
              renderItem={(ns) => {
                const stayVisual = resolveHotelArtwork(ns.name, destName, "Homestay");
                return (
                  <div className="p-3.5 rounded-2xl bg-[#FAF7F0] dark:bg-[#15231F] border border-[#E5D5BA] dark:border-[#2C3B34] flex flex-col justify-between h-full shadow-2xs hover:shadow-md transition-all">
                    <div className="space-y-2.5">
                      <div className="h-28 w-full rounded-xl overflow-hidden bg-[#0F2924] relative">
                        <VanvasImage
                          src={stayVisual.imageUrl}
                          fallbackSrc={stayVisual.fallbackUrl}
                          alt={ns.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#173B32]/90 text-[#FAF7F0] backdrop-blur-xs flex items-center gap-1">
                          <BedDouble className="w-2.5 h-2.5 text-[#B49252]" />
                          <span>Verified Stay</span>
                        </span>
                      </div>
                      <span className="font-serif font-bold text-sm text-[#173B32] dark:text-[#FAF7F0] line-clamp-1">{ns.name}</span>
                      <p className="text-[11px] text-[#7B4D36] dark:text-[#C5A898] truncate">{ns.address}</p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#173B32] dark:text-[#FAF7F0] mt-2 font-mono font-bold pt-1 border-t border-[#E5D5BA]/50 dark:border-[#2C3B34]/60">
                      <span>{ns.price_per_night ? `₹${ns.price_per_night}/night` : "Verified Rate"}</span>
                      {ns.rating && (
                        <span className="flex items-center gap-1 text-[#B49252]">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{ns.rating}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
}
