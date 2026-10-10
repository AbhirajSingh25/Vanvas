"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Star, Clock, MapPin, Sparkles, ExternalLink, Bookmark, X, PlusCircle, 
  Phone, MessageSquare, Flag, Send, AlertTriangle, ShieldCheck, Navigation,
  Compass, Globe
} from "lucide-react";
import { Place, Review, ReviewAggregate } from "@/types";
import { TravelStamp } from "@/components/ui/TravelStamp";
import { VanvasImage } from "@/components/ui/VanvasImage";
import { resolvePlaceArtwork } from "@/lib/placeVisualResolver";
import { api } from "@/lib/api";
import { acquireScrollLock, releaseScrollLock } from "@/lib/scrollLock";

interface PlaceModalProps {
  place: Place | null;
  destinationName?: string;
  destinationSlug?: string;
  isOpen: boolean;
  onClose: () => void;
  onAddToTrip?: (place: Place) => void;
  onBookmarkChange?: (placeId: string, isSaved: boolean) => void;
}

export const PlaceModal: React.FC<PlaceModalProps> = ({ 
  place, 
  destinationName = "", 
  destinationSlug,
  isOpen, 
  onClose, 
  onAddToTrip,
  onBookmarkChange
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [aggregate, setAggregate] = useState<ReviewAggregate | null>(null);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [savingBookmark, setSavingBookmark] = useState<boolean>(false);
  const [bookmarkErrorMsg, setBookmarkErrorMsg] = useState<string>("");
  
  // Review form state
  const [rating, setRating] = useState<number>(5);
  const [reviewTitle, setReviewTitle] = useState<string>("");
  const [reviewComment, setReviewComment] = useState<string>("");
  const [travelDate, setTravelDate] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string>("");
  const [reviewErrorMsg, setReviewErrorMsg] = useState<string>("");

  // Reporting state
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<"inappropriate" | "spam" | "incorrect_info" | "other">("inappropriate");
  const [reportDetails, setReportDetails] = useState<string>("");
  const [submittingReport, setSubmittingReport] = useState<boolean>(false);
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    if (isOpen) {
      acquireScrollLock();
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      if (isOpen) {
        releaseScrollLock();
      }
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Load reviews and saved state on modal open
  useEffect(() => {
    if (isOpen && place) {
      setShowReviewForm(false);
      setReviewSuccessMsg("");
      setReviewErrorMsg("");
      setBookmarkErrorMsg("");
      setReportingReviewId(null);
      setIsSaved(Boolean(place.is_saved));
      
      const fetchReviews = async () => {
        setLoadingReviews(true);
        try {
          const [revList, agg] = await Promise.all([
            api.getPlaceReviews(place.id).catch(() => []),
            api.getPlaceReviewAggregate(place.id).catch(() => null)
          ]);
          setReviews(revList || []);
          setAggregate(agg);
        } catch (err) {
          // Graceful fallback
          setReviews([]);
          setAggregate(null);
        } finally {
          setLoadingReviews(false);
        }
      };

      fetchReviews();
    }
  }, [isOpen, place]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!place || !reviewComment.trim()) return;

    setSubmittingReview(true);
    setReviewErrorMsg("");
    setReviewSuccessMsg("");

    try {
      const newRev = await api.createReview({
        place_id: place.id,
        rating,
        title: reviewTitle.trim() || undefined,
        comment: reviewComment.trim(),
        travel_date: travelDate.trim() || undefined,
      });

      setReviews((prev) => [newRev, ...prev]);
      setReviewSuccessMsg("Thank you! Your verified traveller review has been published.");
      setReviewComment("");
      setReviewTitle("");
      setTravelDate("");
      setShowReviewForm(false);

      // Refresh aggregate
      const updatedAgg = await api.getPlaceReviewAggregate(place.id).catch(() => null);
      if (updatedAgg) setAggregate(updatedAgg);
    } catch (err: any) {
      const msg = err.message || "Failed to submit review. Please ensure you are logged in.";
      setReviewErrorMsg(msg);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReportSubmit = async (reviewId: string) => {
    setSubmittingReport(true);
    try {
      await api.reportReview({
        review_id: reviewId,
        reason: reportReason,
        details: reportDetails.trim() || undefined,
      });
      setReportedIds((prev) => new Set([...Array.from(prev), reviewId]));
      setReportingReviewId(null);
      setReportDetails("");
    } catch (err) {
      // Handled
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (!place || savingBookmark) return;
    setSavingBookmark(true);
    setBookmarkErrorMsg("");
    try {
      const res = await api.toggleSavePlace(place.id);
      setIsSaved(res.saved);
      if (onBookmarkChange) onBookmarkChange(place.id, res.saved);
    } catch (err: any) {
      console.warn("Failed to toggle bookmark:", err);
      setBookmarkErrorMsg(err?.message || "Please sign in to save places to your travel collection.");
      setTimeout(() => setBookmarkErrorMsg(""), 5000);
    } finally {
      setSavingBookmark(false);
    }
  };

  if (!isOpen || !place) return null;

  const safeCategory = typeof place.category === "string" && place.category ? place.category : "Place";
  const visualRes = resolvePlaceArtwork(
    place.name,
    destinationName,
    safeCategory,
    place.image_url,
    place.is_live,
    place.source
  );

  const isLive = place.is_live || place.source === "google_places" || place.source === "openstreetmap";
  const isStale = place.data_state === "STALE";

  const resolvedSlug =
    destinationSlug ||
    destinationName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/^-+|-+$/g, "") ||
    "manali";

  const directionsUrl =
    place.latitude && place.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + " " + (destinationName || ""))}`;

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-label={place.name}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#0F2924]/75 backdrop-blur-sm animate-vanvas-fade"
      onClick={onClose}
    >
      <div 
        className="bg-[#EFE5D2] border-2 border-[#E5D5BA] rounded-t-3xl sm:rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-vanvas-sheet sm:animate-vanvas-scale flex flex-col max-h-[90vh] sm:max-h-[88vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden absolute top-2 inset-x-0 z-20 flex justify-center pointer-events-none">
          <div className="w-10 h-1 rounded-full bg-white/70 shadow-sm" />
        </div>

        {/* Header Artwork */}
        <div className="relative h-60 sm:h-64 w-full bg-[#173B32] overflow-hidden shrink-0">
          <VanvasImage
            src={visualRes.imageUrl}
            fallbackSrc={visualRes.fallbackUrl}
            alt={destinationName ? `${place.name} in ${destinationName}` : place.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F2924]/90 via-[#0F2924]/30 to-transparent pointer-events-none" />

          {/* Header Action Buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              type="button"
              onClick={handleToggleBookmark}
              disabled={savingBookmark}
              aria-label={isSaved ? "Saved to collection" : "Save to travel collection"}
              className={`p-2 rounded-full border transition-all cursor-pointer ${
                isSaved
                  ? "bg-[#B65E3C] text-[#FAF4E8] border-[#B65E3C] shadow-md"
                  : "bg-[#0F2924]/70 text-[#EFE5D2] hover:bg-[#B65E3C] border-white/20"
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Modal"
              className="p-2 rounded-full bg-[#0F2924]/70 text-[#EFE5D2] hover:bg-[#B65E3C] transition-all border border-white/20 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Badges & Title */}
          <div className="absolute bottom-3 left-4 right-4 sm:bottom-4 sm:left-5 sm:right-5 text-[#EFE5D2]">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#173B32] text-[#EFE5D2] text-[10px] font-bold uppercase tracking-wider border border-[#536B52]">
                {safeCategory}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider ${
                  isStale
                    ? "bg-amber-800 text-amber-100 border border-amber-500/40"
                    : visualRes.badgeLabel === "LIVE PLACE PHOTO" || isLive
                    ? "bg-emerald-600 text-white border border-emerald-400/40"
                    : visualRes.badgeLabel === "EXACT PLACE PHOTO"
                    ? "bg-emerald-700 text-emerald-100 border border-emerald-400"
                    : visualRes.badgeLabel === "VANVAS PLACE ARTWORK"
                    ? "bg-[#B49252] text-[#0F2924] border border-[#B49252]"
                    : visualRes.badgeLabel === "DESTINATION CATEGORY ART"
                    ? "bg-[#173B32] text-[#FAF4E8] border border-[#536B52]"
                    : visualRes.badgeLabel === "DESTINATION ART"
                    ? "bg-[#3F4F42] text-[#FAF4E8] border border-[#536B52]"
                    : visualRes.badgeLabel === "REGIONAL ART"
                    ? "bg-[#7B4D36] text-[#FAF4E8] border border-[#7B4D36]"
                    : "bg-neutral-800 text-neutral-200 border border-neutral-600"
                }`}
              >
                {isStale ? "STALE CACHED SNAPSHOT" : visualRes.badgeLabel}
              </span>
              {place.is_open_now === true ? (
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Open Now
                </span>
              ) : place.is_open_now === false ? (
                <span className="px-2.5 py-0.5 rounded-md bg-[#7B4D36] text-[#FAF4E8] text-[10px] font-bold uppercase tracking-wider shadow-sm">
                  Closed Now
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-md bg-[#173B32]/70 text-[#D8DED5] text-[10px] font-mono tracking-wider">
                  Hours Unverified
                </span>
              )}
              {place.is_must_visit && (
                <span className="px-2.5 py-0.5 rounded-md bg-[#B65E3C] text-[#EFE5D2] text-[10px] font-black uppercase tracking-wider">
                  Must Visit
                </span>
              )}
              {place.is_hidden_gem && (
                <span className="px-2.5 py-0.5 rounded-md bg-[#B49252] text-[#0F2924] text-[10px] font-black uppercase tracking-wider">
                  Hidden Gem
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-black">{place.name}</h2>
          </div>
        </div>

        {/* Content Body: Journal Page */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {/* Bookmark Error banner if bookmarking fails */}
          {bookmarkErrorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 flex items-start gap-2.5 text-xs animate-vanvas-fade">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Bookmark Action Notice</p>
                <p className="text-[11px] text-rose-700/90 leading-normal">
                  {bookmarkErrorMsg}
                </p>
              </div>
            </div>
          )}

          {/* Stale data warning banner if applicable */}
          {isStale && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300/80 text-amber-900 flex items-start gap-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Provider Refresh Pending (Cached Snapshot)</p>
                <p className="text-[11px] text-amber-800/90 leading-normal">
                  Live Overpass/Google service is currently experiencing high load. Showing verified cached details.
                </p>
              </div>
            </div>
          )}

          {/* Quick stats strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-[#E5D5BA]/60 border border-[#E5D5BA] text-xs">
            {aggregate && aggregate.total_reviews > 0 ? (
              <div className="flex items-center gap-1.5 font-bold text-[#173B32]">
                <Star className="w-4 h-4 text-[#B49252] fill-current" />
                <span>{aggregate.average_rating} / 5.0</span>
                <span className="text-[#7B4D36] font-normal font-mono">
                  ({aggregate.total_reviews} community review{aggregate.total_reviews > 1 ? "s" : ""})
                </span>
              </div>
            ) : place.rating !== undefined && place.rating !== null ? (
              <div className="flex items-center gap-1.5 font-bold text-[#173B32]">
                <Star className="w-4 h-4 text-[#B49252] fill-current" />
                <span>{place.rating} / 5.0</span>
                {place.review_count !== undefined && place.review_count !== null && (
                  <span className="text-[#7B4D36] font-normal">({place.review_count} web ratings)</span>
                )}
              </div>
            ) : (
              <div className="text-[#7B4D36] italic text-xs flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#536B52]" />
                <span>{isLive ? "Live Open POI" : "Curated Sanctuary Landmark"}</span>
              </div>
            )}

            <div className="flex items-center gap-1 text-[#7B4D36]">
              <Clock className="w-3.5 h-3.5 text-[#B65E3C]" />
              {place.is_open_now === true ? (
                <span className="font-bold text-emerald-700">Open Now {place.opening_time ? `(${place.opening_time} - ${place.closing_time || "Close"})` : ""}</span>
              ) : place.is_open_now === false ? (
                <span className="font-bold text-[#7B4D36]">Closed Now {place.opening_time ? `(Opens ${place.opening_time})` : ""}</span>
              ) : (
                <span>{place.opening_time ? `${place.opening_time} - ${place.closing_time || "Close"}` : "Hours not listed"}</span>
              )}
            </div>

            {typeof place.distance_km === "number" && (
              <div className="flex items-center gap-1 text-[#173B32] font-mono">
                <MapPin className="w-3.5 h-3.5 text-[#B65E3C]" />
                <span>{place.distance_km} km away</span>
              </div>
            )}

            {place.price_level && (
              <div className="font-bold text-[#173B32] font-mono">
                {place.price_level} {(place.approx_cost ?? 0) > 0 ? `• ₹${place.approx_cost}` : ""}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-xs uppercase tracking-widest text-[#7B4D36]">
              स्थान परिचय • Field Notes
            </h4>
            <p className="text-[#20211D]/85 leading-relaxed text-sm font-light">
              {place.description || "Authentic destination landmark."}
            </p>
            {visualRes.visualDescription && (
              <p className="text-xs text-[#536B52] italic pt-1 border-t border-[#E5D5BA]/50">
                Visual Identity: {visualRes.visualDescription}
              </p>
            )}
          </div>

          {/* VANVAS Note */}
          {place.why_vanvas_recommends && (
            <div className="p-4 rounded-2xl bg-[#FAF7F0] border-l-4 border-l-[#B65E3C] border border-[#E5D5BA] space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-1.5 font-bold text-xs text-[#B65E3C] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#B49252]" />
                <span>VANVAS Explorer Note</span>
              </div>
              <p className="text-xs text-[#173B32] leading-relaxed italic font-serif">
                &ldquo;{place.why_vanvas_recommends}&rdquo;
              </p>
            </div>
          )}

          {/* Verified Outbound Actions Row */}
          <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#E5D5BA] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#7B4D36]">
                Verified Outbound Actions
              </span>
              <span className="text-[9px] font-mono text-[#536B52]">
                {place.source_provider ? `Source: ${place.source_provider}` : (isLive ? "Live Provider" : "VANVAS Verified")}
              </span>
            </div>

            {/* Menu Discovery (For Food/Cafe/Restaurant) */}
            {(safeCategory.toLowerCase().includes("food") || safeCategory.toLowerCase().includes("caf") || safeCategory.toLowerCase().includes("restaurant")) && (
              <div className="p-2.5 rounded-xl bg-[#EFE5D2]/70 border border-[#E5D5BA] flex items-center justify-between text-xs">
                {place.menu_available && place.menu_url ? (
                  <a
                    href={place.menu_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5 shadow-2xs transition-all"
                  >
                    <span>📜 View Official Menu</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[#7B4D36] italic text-xs">
                    Menu not published online
                  </span>
                )}
                <span className="text-[10px] font-mono text-[#536B52]">
                  {place.menu_source ? `via ${place.menu_source}` : "Direct Contact"}
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {place.latitude && place.longitude ? (
                <a
                  href={place.google_maps_url || `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#FAF4E8] text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#B49252]" />
                  <span>Get Directions</span>
                </a>
              ) : null}

              {place.website ? (
                <a
                  href={place.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-[#FAF7F0] hover:bg-[#E5D5BA] text-[#173B32] border border-[#E5D5BA] text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#B65E3C]" />
                  <span>Website</span>
                </a>
              ) : null}

              {place.phone ? (
                <a
                  href={`tel:${place.phone.replace(/[^0-9+]/g, "")}`}
                  className="px-3 py-1.5 rounded-xl bg-[#FAF7F0] hover:bg-[#E5D5BA] text-[#173B32] border border-[#E5D5BA] text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Phone className="w-3.5 h-3.5 text-[#B65E3C]" />
                  <span>Call {place.phone}</span>
                </a>
              ) : null}
            </div>
          </div>

          {/* Authentic VANVAS Community Reviews Section */}
          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E5D5BA] space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#B65E3C]" />
                <h4 className="font-bold text-xs uppercase tracking-widest text-[#173B32]">
                  Community Reviews • यात्रि समीक्षा
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-[#173B32]/10 text-[#173B32] text-[9px] font-mono font-bold tracking-wider">
                VANVAS COMMUNITY
              </span>
            </div>

            {/* Success message banner */}
            {reviewSuccessMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-medium">
                {reviewSuccessMsg}
              </div>
            )}

            {/* Error message banner */}
            {reviewErrorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-medium">
                {reviewErrorMsg}
              </div>
            )}

            {/* Reviews List */}
            {loadingReviews ? (
              <p className="text-xs text-[#536B52] italic">Loading verified traveller reviews...</p>
            ) : reviews.length === 0 ? (
              <div className="py-2 text-xs text-[#7B4D36] space-y-1">
                <p className="italic font-light">
                  No community reviews published yet for this landmark.
                </p>
                <p className="text-[11px] text-[#536B52]">
                  VANVAS reviews are 100% authentic and written by verified travellers.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-3 rounded-xl bg-[#EFE5D2]/70 border border-[#E5D5BA] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= rev.rating ? "text-[#B49252] fill-current" : "text-[#D8DED5]"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-bold text-[#173B32]">{rev.user_name}</span>
                        {rev.travel_date && (
                          <span className="text-[10px] text-[#536B52] font-mono">
                            • Visited {rev.travel_date}
                          </span>
                        )}
                      </div>

                      {/* Report button */}
                      {!reportedIds.has(rev.id) ? (
                        <button
                          onClick={() => setReportingReviewId(reportingReviewId === rev.id ? null : rev.id)}
                          className="text-[10px] text-[#7B4D36] hover:text-[#B65E3C] flex items-center gap-0.5 cursor-pointer"
                          title="Report review"
                        >
                          <Flag className="w-2.5 h-2.5" />
                          <span>Report</span>
                        </button>
                      ) : (
                        <span className="text-[9px] text-emerald-700 font-mono">Reported</span>
                      )}
                    </div>

                    {rev.title && (
                      <p className="font-semibold text-[#173B32] text-xs">{rev.title}</p>
                    )}
                    <p className="text-[#20211D]/85 text-xs font-light leading-relaxed">{rev.comment}</p>

                    {/* Inline reporting dialog */}
                    {reportingReviewId === rev.id && (
                      <div className="mt-2 pt-2 border-t border-[#E5D5BA] space-y-2">
                        <p className="text-[10px] font-bold text-[#7B4D36]">Report this review to moderators:</p>
                        <select
                          value={reportReason}
                          onChange={(e: any) => setReportReason(e.target.value)}
                          className="w-full text-xs p-1.5 rounded-lg bg-[#FAF7F0] border border-[#E5D5BA] text-[#173B32]"
                        >
                          <option value="inappropriate">Inappropriate / Offensive</option>
                          <option value="spam">Spam / Advertising</option>
                          <option value="incorrect_info">False / Incorrect Details</option>
                          <option value="other">Other Issue</option>
                        </select>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleReportSubmit(rev.id)}
                            disabled={submittingReport}
                            className="px-2.5 py-1 rounded-lg bg-[#B65E3C] text-white text-[10px] font-bold cursor-pointer"
                          >
                            {submittingReport ? "Reporting..." : "Submit Report"}
                          </button>
                          <button
                            onClick={() => setReportingReviewId(null)}
                            className="text-[10px] text-[#536B52] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Write a review toggle / form */}
            {!showReviewForm ? (
              <button
                onClick={() => setShowReviewForm(true)}
                className="w-full py-2 rounded-xl bg-[#E5D5BA]/50 hover:bg-[#E5D5BA] text-[#173B32] border border-[#E5D5BA] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#B65E3C]" />
                <span>Write a Review</span>
              </button>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-2.5 pt-2 border-t border-[#E5D5BA]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#173B32]">Your Star Rating:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-1 cursor-pointer focus:outline-none"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            star <= rating ? "text-[#B49252] fill-current" : "text-[#D8DED5]"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Review title (optional)"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full p-2 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] text-xs text-[#173B32] focus:outline-none focus:border-[#B65E3C]"
                />

                <textarea
                  rows={3}
                  placeholder="Share your experience (e.g. serenity, mountain view, taste, road quality)..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  required
                  className="w-full p-2 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] text-xs text-[#173B32] focus:outline-none focus:border-[#B65E3C]"
                />

                <input
                  type="text"
                  placeholder="When did you visit? (e.g. October 2026)"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full p-2 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] text-xs text-[#173B32] focus:outline-none focus:border-[#B65E3C]"
                />

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="px-3 py-1.5 rounded-xl text-xs text-[#7B4D36] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-4 py-1.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#FAF4E8] text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  >
                    <Send className="w-3 h-3 text-[#B49252]" />
                    <span>{submittingReview ? "Publishing..." : "Publish Review"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Address, Details, Quick Actions & Tags */}
          <div className="space-y-3 pt-2.5 border-t border-[#E5D5BA] text-xs text-[#536B52]">
            {place.address && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#B65E3C] shrink-0 mt-0.5" />
                <span className="text-[#20211D]/80">{place.address}</span>
              </div>
            )}

            {/* Quick External Actions Strip */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {directionsUrl && (
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF7F0] border border-[#E5D5BA] text-xs text-[#173B32] font-semibold transition-colors cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5 text-[#B65E3C]" />
                  <span>Get Directions</span>
                </a>
              )}
              {place.phone && (
                <a
                  href={`tel:${place.phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF7F0] border border-[#E5D5BA] text-xs text-[#173B32] font-semibold transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[#536B52]" />
                  <span>{place.phone}</span>
                </a>
              )}
              {place.website && (
                <a
                  href={place.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF7F0] border border-[#E5D5BA] text-xs text-[#173B32] font-semibold transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-[#B49252]" />
                  <span>Website</span>
                </a>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {(place.tags || "").split(",").filter(Boolean).map((tag, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-md bg-[#FAF7F0] border border-[#E5D5BA] text-[11px] text-[#173B32] font-mono">
                  #{tag.trim()}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E5D5BA] bg-[#E5D5BA]/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-[#7B4D36] hover:text-[#173B32] uppercase tracking-wider px-2 cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleToggleBookmark}
              disabled={savingBookmark}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isSaved
                  ? "bg-[#B65E3C] text-white border-[#B65E3C]"
                  : "bg-white hover:bg-[#FAF7F0] text-[#173B32] border-[#E5D5BA]"
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-current text-white" : "text-[#B65E3C]"}`} />
              <span>{isSaved ? "Saved" : "Save Place"}</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            {onAddToTrip && (
              <button
                type="button"
                onClick={() => {
                  onAddToTrip(place);
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF7F0] border border-[#B65E3C] text-[#B65E3C] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#B65E3C]" />
                <span>Add to Journey</span>
              </button>
            )}
            <Link
              href={`/plan?dest=${resolvedSlug}&place=${encodeURIComponent(place.name)}`}
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-[#B49252]" />
              <span>Plan Trip Here</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

