"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Clock, Star, Sparkles, Navigation, ExternalLink,
  Share2, Check, Bookmark, PlusCircle, Compass, Camera, ShieldAlert,
  Utensils, BedDouble, Phone, Loader2, AlertCircle
} from "lucide-react";
import { Place } from "@/types";
import { api } from "@/lib/api";
import { VanvasImage } from "@/components/ui/VanvasImage";
import { resolvePlaceArtwork } from "@/lib/placeVisualResolver";

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
    if (typeof window !== "undefined" && navigator?.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
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
      <div className="min-h-screen bg-[#FAF7F0] flex flex-col items-center justify-center p-6 text-[#173B32]">
        <Loader2 className="w-8 h-8 text-[#B65E3C] animate-spin mb-3" />
        <p className="font-serif font-bold text-lg">Loading landmark intelligence...</p>
        <p className="text-xs text-[#7B4D36] font-mono mt-1">VANVAS 20-Point Field Dossier</p>
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="min-h-screen bg-[#FAF7F0] flex flex-col items-center justify-center p-6 text-[#173B32]">
        <AlertCircle className="w-10 h-10 text-[#B65E3C] mb-3" />
        <h1 className="font-serif font-black text-2xl mb-2">Landmark Not Found</h1>
        <p className="text-xs text-[#7B4D36] max-w-md text-center mb-6">{error || "This place record could not be retrieved."}</p>
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
    <div className="min-h-screen bg-[#FAF7F0] text-[#20211D] flex flex-col selection:bg-[#B49252]/30">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-[#FAF7F0]/95 backdrop-blur-md border-b border-[#E5D5BA] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            type="button"
            className="p-2 rounded-xl border border-[#E5D5BA] hover:bg-[#EFE5D2] text-[#173B32] transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-xs font-mono text-[#7B4D36]">
            <Link href="/" className="hover:text-[#173B32] font-semibold">Home</Link>
            <span>/</span>
            <Link href={`/explore/${destSlug}`} className="hover:text-[#173B32] font-semibold">{destName}</Link>
            <span>/</span>
            <span className="text-[#173B32] font-bold truncate max-w-[150px] sm:max-w-xs">{place.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="px-3 py-1.5 rounded-xl border border-[#E5D5BA] hover:bg-[#EFE5D2] text-[#173B32] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedShare ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Link Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-[#7B4D36]" />
                <span className="hidden sm:inline">Share</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleToggleSave}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isSaved
                ? "bg-[#B65E3C] text-white border-[#B65E3C]"
                : "border-[#E5D5BA] hover:bg-[#EFE5D2] text-[#173B32]"
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-current" : ""}`} />
            <span>{isSaved ? "Saved" : "Save"}</span>
          </button>
          <Link
            href={`/plan?dest=${destSlug}&place=${encodeURIComponent(place.name)}`}
            className="px-4 py-1.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#FAF7F0] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Compass className="w-3.5 h-3.5 text-[#B49252]" />
            <span className="hidden sm:inline">Plan Trip</span>
          </Link>
        </div>
      </nav>

      {/* Main Content Container */}
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Hero Artwork Container */}
        <div className="relative h-72 sm:h-96 w-full rounded-3xl overflow-hidden shadow-xl border-2 border-[#E5D5BA] bg-[#173B32]">
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
          <div className="p-3.5 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] space-y-1">
            <span className="text-[10px] font-mono uppercase font-bold text-[#7B4D36] block">
              उत्तम समय • Best Time
            </span>
            <p className="text-xs font-semibold text-[#173B32]">
              {place.best_time_to_visit || "Early morning (06:30 - 10:00)"}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] space-y-1">
            <span className="text-[10px] font-mono uppercase font-bold text-[#7B4D36] block">
              अनुमानित समय • Duration
            </span>
            <p className="text-xs font-semibold text-[#173B32]">
              {place.estimated_duration || `${place.recommended_duration_mins || 60} mins`}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] space-y-1">
            <span className="text-[10px] font-mono uppercase font-bold text-[#7B4D36] block">
              प्रवेश शुल्क • Entry & Permits
            </span>
            <p className="text-xs font-semibold text-[#173B32]">
              {place.entry_fee_details || (place.approx_cost && place.approx_cost > 0 ? `₹${place.approx_cost}` : "Free Admission")}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] space-y-1">
            <span className="text-[10px] font-mono uppercase font-bold text-[#7B4D36] block">
              दूरी • Distance & Time
            </span>
            <p className="text-xs font-semibold text-[#173B32] font-mono">
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
          <div className="p-3 rounded-2xl bg-[#FAF7F0] border border-[#E5D5BA] flex items-center justify-between text-xs text-[#173B32]">
            <div className="flex items-center gap-2 font-mono">
              <Navigation className="w-4 h-4 text-[#B65E3C]" />
              <span>Coordinates: {place.latitude.toFixed(4)}°N, {place.longitude.toFixed(4)}°E</span>
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 rounded-xl bg-[#173B32] text-[#FAF7F0] font-bold text-[11px] flex items-center gap-1.5 hover:bg-[#20453B] transition-all"
            >
              <MapPin className="w-3 h-3 text-[#B49252]" />
              <span>Get Directions</span>
            </a>
          </div>
        )}

        {/* Description & Field Notes */}
        <div className="p-6 rounded-3xl bg-[#EFE5D2] border border-[#E5D5BA] space-y-3">
          <h2 className="font-serif font-black text-lg text-[#173B32]">
            स्थान परिचय • Field Notes & Significance
          </h2>
          <p className="text-sm text-[#20211D]/85 leading-relaxed font-light">
            {place.description || "Authentic verified landmark."}
          </p>

          {place.why_vanvas_recommends && (
            <div className="mt-4 p-4 rounded-2xl bg-[#FAF7F0] border-l-4 border-l-[#B65E3C] border border-[#E5D5BA] space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-[#B65E3C] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#B49252]" />
                <span>VANVAS Editorial Perspective</span>
              </div>
              <p className="text-xs text-[#173B32] leading-relaxed italic font-serif">
                &ldquo;{place.why_vanvas_recommends}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Cultural Significance & Photography & Tips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {place.historical_significance && (
            <div className="p-5 rounded-3xl bg-[#FAF7F0] border border-[#E5D5BA] space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-[#173B32] uppercase tracking-wider">
                <Compass className="w-4 h-4 text-[#B49252]" />
                <span>Cultural & Historical Context</span>
              </div>
              <p className="text-xs text-[#20211D]/80 leading-relaxed font-light">
                {place.historical_significance}
              </p>
            </div>
          )}

          {place.photography_spots && (
            <div className="p-5 rounded-3xl bg-[#FAF7F0] border border-[#E5D5BA] space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-[#7B4D36] uppercase tracking-wider">
                <Camera className="w-4 h-4 text-[#B65E3C]" />
                <span>Photography & Vantage Points</span>
              </div>
              <p className="text-xs text-[#20211D]/80 leading-relaxed font-light">
                {place.photography_spots}
              </p>
            </div>
          )}
        </div>

        {/* Practical & Safety Tips */}
        {place.practical_tips && (
          <div className="p-5 rounded-3xl bg-amber-50/70 border border-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-amber-900 uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span>Visitor Guidelines & Safety Tips</span>
            </div>
            <p className="text-xs text-amber-900/90 leading-relaxed font-light">
              {place.practical_tips}
            </p>
          </div>
        )}

        {/* Nearby Attractions */}
        {place.nearby_attractions && place.nearby_attractions.length > 0 && (
          <div className="p-6 rounded-3xl bg-[#EFE5D2] border border-[#E5D5BA] space-y-3">
            <h3 className="font-serif font-black text-base text-[#173B32]">
              Nearby Logical Pairings & Attractions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {place.nearby_attractions.map((na) => (
                <Link
                  key={na.id}
                  href={`/places/${na.slug || na.id}`}
                  className="p-3.5 rounded-2xl bg-[#FAF7F0] hover:bg-[#FAF4E8] border border-[#E5D5BA] transition-all flex flex-col justify-between"
                >
                  <span className="font-serif font-bold text-sm text-[#173B32] line-clamp-1">{na.name}</span>
                  <div className="flex items-center justify-between text-xs text-[#7B4D36] mt-2 font-mono">
                    <span>{na.category}</span>
                    <span>{na.distance_km ? `${na.distance_km} km` : ""}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Nearby Food & Cafes */}
        {place.nearby_food && place.nearby_food.length > 0 && (
          <div className="p-6 rounded-3xl bg-[#FAF7F0] border border-[#E5D5BA] space-y-3">
            <div className="flex items-center gap-2 font-serif font-black text-base text-[#7B4D36]">
              <Utensils className="w-4 h-4 text-[#B65E3C]" />
              <span>Where to Eat Nearby</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {place.nearby_food.map((nf) => (
                <Link
                  key={nf.id}
                  href={`/places/${nf.slug || nf.id}`}
                  className="p-3.5 rounded-2xl bg-[#EFE5D2] hover:bg-[#E5D5BA] border border-[#E5D5BA] transition-all flex flex-col justify-between"
                >
                  <span className="font-serif font-bold text-sm text-[#173B32] line-clamp-1">{nf.name}</span>
                  <div className="flex items-center justify-between text-xs text-[#7B4D36] mt-2 font-mono">
                    <span>{nf.category}</span>
                    <span>{nf.distance_km ? `${nf.distance_km} km` : ""}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Nearby Stays */}
        {place.nearby_stays && place.nearby_stays.length > 0 && (
          <div className="p-6 rounded-3xl bg-[#FAF7F0] border border-[#E5D5BA] space-y-3">
            <div className="flex items-center gap-2 font-serif font-black text-base text-[#173B32]">
              <BedDouble className="w-4 h-4 text-[#B49252]" />
              <span>Verified Stays & Homestays Nearby</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {place.nearby_stays.map((ns) => (
                <div
                  key={ns.id}
                  className="p-3.5 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] flex flex-col justify-between"
                >
                  <span className="font-serif font-bold text-sm text-[#173B32] line-clamp-1">{ns.name}</span>
                  <p className="text-[11px] text-[#7B4D36] truncate mt-0.5">{ns.address}</p>
                  <div className="flex items-center justify-between text-xs text-[#173B32] mt-2 font-mono font-bold">
                    <span>{ns.price_per_night ? `₹${ns.price_per_night}/night` : "Verified Property"}</span>
                    <span>{ns.rating ? `★ ${ns.rating}` : ""}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

