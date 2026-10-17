"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Play, Pause, Volume2, VolumeX, Sparkles, MapPin, Clock,
  ChevronLeft, ChevronRight, Bookmark, Route, Check, X, ArrowRight
} from "lucide-react";
import { DestinationReel, getDestinationReels } from "@/lib/destinationReelsRegistry";
import { VanvasImage } from "@/components/ui/VanvasImage";

interface DestinationReelsCarouselProps {
  destinationSlug: string;
  destinationName: string;
  className?: string;
}

export const DestinationReelsCarousel: React.FC<DestinationReelsCarouselProps> = ({
  destinationSlug,
  destinationName,
  className = "",
}) => {
  const router = useRouter();
  const reels = getDestinationReels(destinationSlug);

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [isSectionVisible, setIsSectionVisible] = useState(false);
  const [savedReels, setSavedReels] = useState<Record<string, boolean>>({});
  const [selectedReelForDrawer, setSelectedReelForDrawer] = useState<DestinationReel | null>(null);

  // Load saved state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("vanvas_saved_reels");
      if (stored) {
        setSavedReels(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleToggleSave = (reelId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSavedReels((prev) => {
      const next = { ...prev, [reelId]: !prev[reelId] };
      try {
        localStorage.setItem("vanvas_saved_reels", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Observe section visibility within viewport: pause video if off-screen
  useEffect(() => {
    const section = containerRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsSectionVisible(entry.isIntersecting && entry.intersectionRatio >= 0.25);
      },
      { threshold: [0, 0.25, 0.5, 1.0] }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Update playback state whenever activeIndex or isSectionVisible changes
  useEffect(() => {
    if (!reels.length) return;

    videoRefs.current.forEach((video, idx) => {
      if (!video) return;

      if (idx === activeIndex && isSectionVisible) {
        video.muted = isMuted;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setAutoplayBlocked(false);
            })
            .catch(() => {
              // Autoplay rejected by browser security policy
              setIsPlaying(false);
              setAutoplayBlocked(true);
            });
        }
      } else {
        video.pause();
        // If not active, reset currentTime to 0 so when returning it starts cleanly
        if (idx !== activeIndex) {
          video.currentTime = 0;
        }
      }
    });
  }, [activeIndex, isSectionVisible, isMuted, reels.length]);

  // Handle active card centering via scroll detection
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || !cardRefs.current.length) return;

    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;

    let closestIdx = 0;
    let minDiff = Infinity;

    cardRefs.current.forEach((card, idx) => {
      if (!card) return;
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const diff = Math.abs(containerCenter - cardCenter);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });

    if (closestIdx !== activeIndex) {
      setActiveIndex(closestIdx);
    }
  }, [activeIndex]);

  const scrollToCard = (index: number) => {
    const card = cardRefs.current[index];
    if (card) {
      card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      setActiveIndex(index);
    }
  };

  const handleManualPlay = (idx: number) => {
    if (idx !== activeIndex) {
      scrollToCard(idx);
      return;
    }

    const video = videoRefs.current[idx];
    if (!video) return;

    if (video.paused) {
      video.muted = isMuted;
      video.play().then(() => {
        setIsPlaying(true);
        setAutoplayBlocked(false);
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handlePlanRoute = (reel: DestinationReel, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Pause playback before navigating
    videoRefs.current.forEach((v) => v?.pause());
    router.push(`/plan?destination=${encodeURIComponent(reel.destinationSlug)}&preset=${encodeURIComponent(reel.id)}`);
  };

  if (!reels.length) {
    // Honest, truthful presentation when no verified playable clips exist for destination
    return (
      <section className={`py-6 sm:py-8 border-y border-[#E5D5BA]/60 bg-[#FAF7F0]/60 ${className}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#B65E3C] font-bold block mb-1">
                Visual Discovery
              </span>
              <h2 className="font-serif font-black text-2xl sm:text-3xl text-[#173B32]">
                See It. Plan It.
              </h2>
              <p className="text-xs sm:text-sm text-[#7B4D36] font-medium mt-1">
                Short films from {destinationName}, with routes you can turn into a trip.
              </p>
            </div>
            <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-[#E5D5BA]/50 text-[#7B4D36] text-[11px] font-mono font-bold">
              Field footage in production
            </span>
          </div>

          <div className="p-6 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="w-14 h-14 rounded-2xl bg-[#E5D5BA] flex items-center justify-center shrink-0 text-[#173B32]">
              <Play className="w-6 h-6 opacity-60" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-base text-[#173B32]">
                Verified Discovery Clips Coming Soon for {destinationName}
              </h3>
              <p className="text-xs text-[#7B4D36] max-w-xl leading-relaxed">
                We only show authentic, license-cleared 9:16 field video captured directly on location. Explore our verified trails, stays, and mobility options below while our camera crew captures this valley.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Destination Video Discovery Carousel"
      className={`py-8 sm:py-10 border-y border-[#E5D5BA]/80 bg-[#FAF7F0] ${className}`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#B65E3C] animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#B65E3C] font-black">
                See It. Plan It.
              </span>
            </div>
            <h2 className="font-serif font-black text-2xl sm:text-3xl text-[#173B32]">
              Short Films &amp; Verified Routes
            </h2>
            <p className="text-xs sm:text-sm text-[#7B4D36] font-medium mt-1">
              Short films from {destinationName}, with routes you can turn into a trip.
            </p>
          </div>

          {/* Controls: Sound toggle & carousel pagination buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsMuted((prev) => !prev)}
              aria-label={isMuted ? "Unmute video audio" : "Mute video audio"}
              className="px-3 py-1.5 rounded-full bg-[#FAF4E8] border border-[#E5D5BA] text-[#173B32] hover:text-[#B65E3C] hover:border-[#173B32] transition-colors flex items-center gap-1.5 text-xs font-mono font-bold shadow-2xs"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-[#7B4D36]" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-700" />}
              <span>{isMuted ? "Sound Off" : "Sound On"}</span>
            </button>

            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollToCard(Math.max(0, activeIndex - 1))}
                disabled={activeIndex === 0}
                aria-label="Previous destination video"
                className="p-2 rounded-full bg-[#FAF4E8] border border-[#E5D5BA] text-[#173B32] hover:border-[#173B32] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollToCard(Math.min(reels.length - 1, activeIndex + 1))}
                disabled={activeIndex === reels.length - 1}
                aria-label="Next destination video"
                className="p-2 rounded-full bg-[#FAF4E8] border border-[#E5D5BA] text-[#173B32] hover:border-[#173B32] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 9:16 Centered Focus Carousel */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              scrollToCard(Math.max(0, activeIndex - 1));
            } else if (e.key === "ArrowRight") {
              e.preventDefault();
              scrollToCard(Math.min(reels.length - 1, activeIndex + 1));
            }
          }}
          className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth no-scrollbar focus:outline-none focus:ring-1 focus:ring-[#173B32]/30 px-[10vw] sm:px-[18vw] lg:px-[25vw]"
        >
          {reels.map((reel, idx) => {
            const isActive = idx === activeIndex;
            const isSaved = Boolean(savedReels[reel.id]);

            return (
              <div
                key={reel.id}
                ref={(el) => { cardRefs.current[idx] = el; }}
                onClick={() => handleManualPlay(idx)}
                className={`relative shrink-0 snap-center rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 select-none shadow-md ${
                  isActive
                    ? "w-[270px] sm:w-[310px] h-[480px] sm:h-[550px] scale-100 ring-2 ring-[#B65E3C] shadow-2xl z-10"
                    : "w-[250px] sm:w-[280px] h-[450px] sm:h-[510px] scale-95 opacity-75 hover:opacity-90 hover:scale-[0.97]"
                }`}
              >
                {/* 9:16 Video Player */}
                <video
                  ref={(el) => { videoRefs.current[idx] = el; }}
                  src={reel.videoUrl}
                  poster={reel.posterUrl}
                  playsInline
                  muted={isMuted}
                  loop
                  preload="metadata"
                  className="w-full h-full object-cover bg-[#0F2924]"
                />

                {/* Poster fallback image if video hasn't loaded */}
                <div className="absolute inset-0 pointer-events-none -z-10">
                  <VanvasImage
                    src={reel.posterUrl}
                    alt={reel.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Subtle Cinematic Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F2924] via-transparent to-black/30 pointer-events-none" />

                {/* Top Overlay: Experience tag & Save bookmark */}
                <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 z-10">
                  <span className="px-2.5 py-1 rounded-full bg-[#0F2924]/80 backdrop-blur-md text-[#EFE5D2] text-[10px] font-mono font-bold uppercase tracking-wider border border-white/10">
                    {reel.experienceType}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => handleToggleSave(reel.id, e)}
                    aria-label={isSaved ? "Remove from saved ideas" : "Save this route idea"}
                    className={`p-2 rounded-full backdrop-blur-md transition-all ${
                      isSaved
                        ? "bg-[#B65E3C] text-[#FAF7F0] shadow-md scale-105"
                        : "bg-[#0F2924]/70 text-[#FAF7F0] hover:bg-[#B65E3C]"
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-current" : ""}`} />
                  </button>
                </div>

                {/* Non-active Card Play Indicator */}
                {!isActive && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-[#0F2924]/80 backdrop-blur-md text-[#FAF7F0] flex items-center justify-center border border-white/20 shadow-lg">
                      <Play className="w-5 h-5 ml-0.5 fill-current opacity-90" />
                    </div>
                  </div>
                )}

                {/* Tap to Play Affordance if Autoplay was blocked */}
                {isActive && autoplayBlocked && (
                  <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/30 backdrop-blur-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleManualPlay(idx);
                      }}
                      className="px-4 py-2.5 rounded-full bg-[#B65E3C] text-[#FAF7F0] font-serif font-bold text-xs flex items-center gap-2 shadow-xl hover:scale-105 transition-all"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Tap to Play Video</span>
                    </button>
                  </div>
                )}

                {/* Active Card Bottom Overlay with 3 Actions */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 text-[#FAF7F0] space-y-3 z-10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#D8DED5]/80">
                      <Clock className="w-3 h-3 text-[#B49252]" />
                      <span>{reel.durationLabel}</span>
                      <span>•</span>
                      <span className="truncate">{reel.creator}</span>
                    </div>

                    <h3 className="font-serif font-black text-lg sm:text-xl text-[#FAF7F0] leading-snug drop-shadow-sm">
                      {reel.title}
                    </h3>

                    {isActive && (
                      <p className="text-[11px] text-[#D8DED5]/90 line-clamp-2 leading-relaxed font-medium">
                        {reel.subtitle}
                      </p>
                    )}
                  </div>

                  {/* 3 Working Actions on Active Card */}
                  {isActive && (
                    <div className="space-y-2 pt-1 border-t border-white/15">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReelForDrawer(reel);
                          }}
                          className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-[#FAF7F0] text-[11px] font-mono font-bold text-center border border-white/20 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Route className="w-3 h-3 text-[#B49252]" />
                          <span>View Itinerary</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleToggleSave(reel.id, e)}
                          className={`px-3 py-2 rounded-xl text-[11px] font-mono font-bold text-center border transition-all flex items-center justify-center gap-1.5 ${
                            isSaved
                              ? "bg-[#B65E3C] border-[#B65E3C] text-[#FAF7F0]"
                              : "bg-white/15 hover:bg-white/25 backdrop-blur-md border-white/20 text-[#FAF7F0]"
                          }`}
                        >
                          <Bookmark className={`w-3 h-3 ${isSaved ? "fill-current" : ""}`} />
                          <span>{isSaved ? "Saved Idea" : "Save Idea"}</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handlePlanRoute(reel, e)}
                        className="w-full py-2.5 rounded-xl bg-[#B65E3C] hover:bg-[#A35131] text-[#FAF7F0] font-serif font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 active:scale-[0.99]"
                      >
                        <span>Plan This Route</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel Pagination Dots */}
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {reels.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollToCard(i)}
              aria-label={`Jump to video ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === activeIndex ? "w-6 bg-[#B65E3C]" : "w-1.5 bg-[#E5D5BA] hover:bg-[#7B4D36]"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Itinerary Details Drawer / Modal */}
      {selectedReelForDrawer && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fade-in"
          onClick={() => setSelectedReelForDrawer(null)}
        >
          <div
            className="w-full sm:max-w-xl max-h-[85vh] bg-[#FAF7F0] rounded-t-3xl sm:rounded-3xl border-2 border-[#E5D5BA] overflow-hidden flex flex-col shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#E5D5BA] bg-[#FAF4E8] flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B65E3C] block mb-1">
                  Verified Route Itinerary • {selectedReelForDrawer.durationLabel}
                </span>
                <h3 className="font-serif font-black text-xl text-[#173B32] leading-tight">
                  {selectedReelForDrawer.title}
                </h3>
                <p className="text-xs text-[#7B4D36] mt-1 font-medium">
                  {selectedReelForDrawer.itinerarySummary}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReelForDrawer(null)}
                aria-label="Close itinerary details"
                className="p-1.5 rounded-full bg-[#E5D5BA]/60 hover:bg-[#E5D5BA] text-[#173B32] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Timeline stops */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
              <div className="space-y-3">
                {selectedReelForDrawer.itineraryStops.map((stop, sIdx) => (
                  <div key={sIdx} className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-[#E5D5BA]">
                    <span className="px-2 py-1 rounded-md bg-[#FAF4E8] border border-[#E5D5BA] font-mono font-bold text-[11px] text-[#173B32] shrink-0">
                      {stop.time}
                    </span>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif font-bold text-sm text-[#173B32] truncate">
                          {stop.title}
                        </h4>
                        <span className="text-[9px] font-mono font-bold text-[#7B4D36] uppercase bg-[#FAF4E8] px-1.5 py-0.2 rounded">
                          {stop.category}
                        </span>
                      </div>
                      <p className="text-xs text-[#7B4D36] leading-relaxed">
                        {stop.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer actions */}
            <div className="p-4 sm:p-5 border-t border-[#E5D5BA] bg-[#FAF4E8] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleToggleSave(selectedReelForDrawer.id)}
                className={`px-4 py-2.5 rounded-xl border text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                  savedReels[selectedReelForDrawer.id]
                    ? "bg-[#B65E3C] border-[#B65E3C] text-white"
                    : "bg-[#FAF7F0] border-[#E5D5BA] text-[#173B32] hover:border-[#173B32]"
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${savedReels[selectedReelForDrawer.id] ? "fill-current" : ""}`} />
                <span>{savedReels[selectedReelForDrawer.id] ? "Saved in VANVAS" : "Save This Route"}</span>
              </button>

              <button
                type="button"
                onClick={() => handlePlanRoute(selectedReelForDrawer)}
                className="px-5 py-2.5 rounded-xl bg-[#173B32] hover:bg-[#0F2924] text-[#EFE5D2] font-serif font-bold text-xs flex items-center gap-2 shadow-md transition-all"
              >
                <span>Plan This Route</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#B49252]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
