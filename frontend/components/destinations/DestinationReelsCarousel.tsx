"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Play, Pause, Volume2, VolumeX, Sparkles, MapPin, Clock,
  ChevronLeft, ChevronRight, Bookmark, Route, Check, X, ArrowRight,
  Share2, Film, Eye, RotateCcw
} from "lucide-react";
import { DestinationReel, getDestinationReels } from "@/lib/destinationReelsRegistry";
import { VanvasImage } from "@/components/ui/VanvasImage";

interface DestinationReelsCarouselProps {
  destinationSlug: string;
  destinationName: string;
  className?: string;
  onExplorePlace?: (placeName: string) => void;
}

export const DestinationReelsCarousel: React.FC<DestinationReelsCarouselProps> = ({
  destinationSlug,
  destinationName,
  className = "",
  onExplorePlace,
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
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [showTapFeedback, setShowTapFeedback] = useState<"play" | "pause" | null>(null);
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);

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

  const handleShareReel = (reel: DestinationReel, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const shareUrl = typeof window !== "undefined"
      ? `${window.location.origin}/explore/${reel.destinationSlug}#reel-${reel.id}`
      : "";

    if (navigator?.share) {
      navigator.share({
        title: `${reel.title} — VANVAS Reels`,
        text: reel.subtitle,
        url: shareUrl,
      }).catch(() => {});
    } else if (navigator?.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedShareId(reel.id);
      setTimeout(() => setCopiedShareId(null), 2500);
    }
  };

  // Observe section visibility within viewport: pause video if off-screen or tab blurred
  useEffect(() => {
    const section = containerRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsSectionVisible(entry.isIntersecting && entry.intersectionRatio >= 0.25 && document.visibilityState === "visible");
      },
      { threshold: [0, 0.25, 0.5, 1.0] }
    );

    const handleDocVisibility = () => {
      if (document.visibilityState === "hidden") {
        setIsSectionVisible(false);
        videoRefs.current.forEach((v) => v?.pause());
      } else {
        const entry = section.getBoundingClientRect();
        const isInView = entry.top < window.innerHeight && entry.bottom > 0;
        setIsSectionVisible(isInView);
      }
    };

    observer.observe(section);
    document.addEventListener("visibilitychange", handleDocVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleDocVisibility);
      videoRefs.current.forEach((v) => v?.pause());
    };
  }, []);

  // Update playback state whenever activeIndex or isSectionVisible changes
  useEffect(() => {
    if (!reels.length) return;

    setPlaybackProgress(0);

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
        if (idx !== activeIndex) {
          video.currentTime = 0;
        }
      }
    });
  }, [activeIndex, isSectionVisible, isMuted, reels.length]);

  // Track playback time progress for active video
  useEffect(() => {
    const activeVideo = videoRefs.current[activeIndex];
    if (!activeVideo) return;

    const handleTimeUpdate = () => {
      if (activeVideo.duration && !isNaN(activeVideo.duration)) {
        const progress = (activeVideo.currentTime / activeVideo.duration) * 100;
        setPlaybackProgress(progress);
      }
    };

    activeVideo.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      activeVideo.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [activeIndex]);

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
        setShowTapFeedback("play");
        setTimeout(() => setShowTapFeedback(null), 700);
      });
    } else {
      video.pause();
      setIsPlaying(false);
      setShowTapFeedback("pause");
      setTimeout(() => setShowTapFeedback(null), 700);
    }
  };

  const handlePlanRoute = (reel: DestinationReel, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    videoRefs.current.forEach((v) => v?.pause());
    router.push(`/plan?destination=${encodeURIComponent(reel.destinationSlug)}&preset=${encodeURIComponent(reel.id)}`);
  };

  const handleExplorePrimaryPlace = (reel: DestinationReel, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const primaryWaypoint = reel.waypoints && reel.waypoints[0]?.placeName;
    if (onExplorePlace && primaryWaypoint) {
      onExplorePlace(primaryWaypoint);
    } else if (primaryWaypoint) {
      const cleanSlug = primaryWaypoint.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      router.push(`/places/${cleanSlug}`);
    }
  };

  if (!reels.length) {
    return null;
  }

  const hasRealVideos = reels.some((r) => Boolean(r.videoUrl && r.videoUrl.endsWith(".mp4")));

  return (
    <section
      aria-label={hasRealVideos ? "Destination Video Discovery Carousel" : "Destination Editorial Visual Stories"}
      className={`py-8 sm:py-10 border-y border-[#E5D5BA]/80 dark:border-[#2C3B34] bg-[#FAF7F0] dark:bg-[#121E1A] ${className}`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${hasRealVideos ? "bg-[#B65E3C] animate-pulse" : "bg-[#B49252]"}`} />
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#B65E3C] dark:text-[#E28C68] font-black">
                {hasRealVideos ? "See It. Plan It. • Destination Video Reels" : "Field Archives • Editorial Visual Stories"}
              </span>
            </div>
            <h2 className="font-serif font-black text-2xl sm:text-3xl text-[#173B32] dark:text-[#FAF7F0]">
              {hasRealVideos ? "Short Films & Verified Routes" : "Editorial Visual Stories & Route Dispatches"}
            </h2>
            <p className="text-xs sm:text-sm text-[#7B4D36] dark:text-[#C5A898] font-medium mt-1">
              {hasRealVideos
                ? `Vertical 9:16 discovery reels from ${destinationName}, with real waypoints you can turn into a journey.`
                : `Curated photographic journeys and waypoint itineraries from ${destinationName} verified by VANVAS field cartographers.`}
            </p>
          </div>

          {/* Controls: Sound toggle & carousel pagination buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {hasRealVideos ? (
              <button
                type="button"
                onClick={() => setIsMuted((prev) => !prev)}
                aria-label={isMuted ? "Unmute video audio" : "Mute video audio"}
                className="px-3 py-1.5 rounded-full bg-[#FAF4E8] dark:bg-[#1C2E27] border border-[#E5D5BA] dark:border-[#2C3B34] text-[#173B32] dark:text-[#FAF7F0] hover:text-[#B65E3C] hover:border-[#173B32] transition-colors flex items-center gap-1.5 text-xs font-mono font-bold shadow-2xs"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-[#7B4D36]" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                <span>{isMuted ? "Sound Off" : "Sound On"}</span>
              </button>
            ) : (
              <span className="px-3 py-1.5 rounded-full bg-[#FAF4E8] dark:bg-[#1C2E27] border border-[#E5D5BA] dark:border-[#2C3B34] text-[#173B32] dark:text-[#FAF7F0] flex items-center gap-1.5 text-xs font-mono font-bold shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#B65E3C]" />
                <span>Editorial Stories</span>
              </span>
            )}

            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollToCard(Math.max(0, activeIndex - 1))}
                disabled={activeIndex === 0}
                aria-label="Previous destination video"
                className="p-2 rounded-full bg-[#FAF4E8] dark:bg-[#1C2E27] border border-[#E5D5BA] dark:border-[#2C3B34] text-[#173B32] dark:text-[#FAF7F0] hover:border-[#173B32] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollToCard(Math.min(reels.length - 1, activeIndex + 1))}
                disabled={activeIndex === reels.length - 1}
                aria-label="Next destination video"
                className="p-2 rounded-full bg-[#FAF4E8] dark:bg-[#1C2E27] border border-[#E5D5BA] dark:border-[#2C3B34] text-[#173B32] dark:text-[#FAF7F0] hover:border-[#173B32] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs"
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
          className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth no-scrollbar focus:outline-none focus:ring-1 focus:ring-[#173B32]/30 dark:focus:ring-[#B49252]/40 px-[10vw] sm:px-[18vw] lg:px-[25vw]"
        >
          {reels.map((reel, idx) => {
            const isActive = idx === activeIndex;
            const isSaved = Boolean(savedReels[reel.id]);
            const isCopied = copiedShareId === reel.id;
            const isRealVideo = Boolean(reel.videoUrl && reel.videoUrl.endsWith(".mp4"));

            return (
              <div
                key={reel.id}
                id={`reel-${reel.id}`}
                ref={(el) => { cardRefs.current[idx] = el; }}
                onClick={() => handleManualPlay(idx)}
                className={`relative shrink-0 snap-center rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 select-none shadow-md ${
                  isActive
                    ? "w-[270px] sm:w-[310px] h-[480px] sm:h-[550px] scale-100 ring-2 ring-[#B65E3C] shadow-2xl z-10"
                    : "w-[250px] sm:w-[280px] h-[450px] sm:h-[510px] scale-95 opacity-75 hover:opacity-90 hover:scale-[0.97]"
                }`}
              >
                {/* 9:16 Media: Video Player or Rich Visual Story Poster */}
                {isRealVideo ? (
                  <>
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
                    <div className="absolute inset-0 pointer-events-none -z-10">
                      <VanvasImage
                        src={reel.posterUrl}
                        alt={reel.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Continuous Playback Progress Bar on Active Video */}
                    {isActive && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-black/40 z-20 overflow-hidden">
                        <div
                          className="h-full bg-[#B65E3C] transition-all duration-150 ease-linear"
                          style={{ width: `${playbackProgress}%` }}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full relative overflow-hidden bg-[#0F2924]">
                    <VanvasImage
                      src={reel.posterUrl}
                      alt={reel.title}
                      className={`w-full h-full object-cover transition-transform duration-700 ${
                        isActive ? "scale-105" : "hover:scale-105"
                      }`}
                    />
                  </div>
                )}

                {/* Subtle Cinematic Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F2924] via-transparent to-black/35 pointer-events-none" />

                {/* Top Overlay: Media type stamp, Experience tag & Actions */}
                <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 z-10">
                  <div className="flex items-center gap-1.5">
                    {/* Clear Format Badge: Video Reel vs Editorial Visual Story */}
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md flex items-center gap-1 shadow-xs border ${
                      isRealVideo
                        ? "bg-[#B65E3C]/90 text-white border-[#B65E3C]"
                        : "bg-[#0F2924]/85 text-[#EFE5D2] border-white/15"
                    }`}>
                      {isRealVideo ? <Film className="w-2.5 h-2.5" /> : <Sparkles className="w-2.5 h-2.5 text-[#B49252]" />}
                      <span>{isRealVideo ? "Video Reel" : "Visual Story"}</span>
                    </span>

                    <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-black/40 text-[9px] font-mono text-[#EFE5D2]/90 border border-white/10 backdrop-blur-xs">
                      {reel.experienceType}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Share Action Button */}
                    <button
                      type="button"
                      onClick={(e) => handleShareReel(reel, e)}
                      aria-label="Share this reel"
                      className="p-2 rounded-full bg-[#0F2924]/70 hover:bg-[#B65E3C] text-[#FAF7F0] backdrop-blur-md transition-all shadow-xs"
                      title={isCopied ? "Link Copied!" : "Share Reel"}
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                    </button>

                    {/* Bookmark Action */}
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
                </div>

                {/* Tap Feedback Indicator */}
                {isActive && showTapFeedback && (
                  <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                    <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white animate-ping">
                      {showTapFeedback === "play" ? (
                        <Play className="w-8 h-8 fill-current ml-1" />
                      ) : (
                        <Pause className="w-8 h-8 fill-current" />
                      )}
                    </div>
                  </div>
                )}

                {/* Non-active Card Play Indicator */}
                {!isActive && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-[#0F2924]/80 backdrop-blur-md text-[#FAF7F0] flex items-center justify-center border border-white/20 shadow-lg">
                      {isRealVideo ? (
                        <Play className="w-5 h-5 ml-0.5 fill-current opacity-90" />
                      ) : (
                        <Eye className="w-5 h-5 text-[#FAF7F0] opacity-90" />
                      )}
                    </div>
                  </div>
                )}

                {/* Tap to Play Affordance if Autoplay was blocked (video only) */}
                {isActive && isRealVideo && autoplayBlocked && (
                  <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/35 backdrop-blur-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleManualPlay(idx);
                      }}
                      className="px-4 py-2.5 rounded-full bg-[#B65E3C] text-[#FAF7F0] font-serif font-bold text-xs flex items-center gap-2 shadow-xl hover:scale-105 transition-all"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Tap to Play Reel</span>
                    </button>
                  </div>
                )}

                {/* Active Card Bottom Overlay with Actions */}
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
                          <span>View Stops</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleExplorePrimaryPlace(reel, e)}
                          className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-[#FAF7F0] text-[11px] font-mono font-bold text-center border border-white/20 transition-all flex items-center justify-center gap-1.5"
                        >
                          <MapPin className="w-3 h-3 text-[#B49252]" />
                          <span>Explore Place</span>
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
                i === activeIndex ? "w-6 bg-[#B65E3C]" : "w-1.5 bg-[#E5D5BA] dark:bg-[#2C3B34] hover:bg-[#7B4D36]"
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
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setSelectedReelForDrawer(null)}
        >
          <div
            className="w-full max-w-lg bg-[#FAF7F0] dark:bg-[#15231F] rounded-t-3xl sm:rounded-3xl border border-[#E5D5BA] dark:border-[#2C3B34] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#E5D5BA]/80 dark:border-[#2C3B34] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#B65E3C] dark:text-[#E28C68] font-bold">
                  Verified Route Stops
                </span>
                <h3 className="font-serif font-bold text-lg text-[#173B32] dark:text-[#FAF7F0]">
                  {selectedReelForDrawer.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReelForDrawer(null)}
                aria-label="Close itinerary details"
                className="p-1.5 rounded-full bg-[#EFE5D2] dark:bg-[#1C2E27] text-[#173B32] dark:text-[#FAF7F0] hover:bg-[#E5D5BA] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stops Timeline */}
            <div className="p-5 overflow-y-auto space-y-4">
              <p className="text-xs text-[#7B4D36] dark:text-[#C5A898] leading-relaxed">
                {selectedReelForDrawer.itinerarySummary}
              </p>

              <div className="space-y-3 pt-2">
                {selectedReelForDrawer.itineraryStops.map((stop, sIdx) => (
                  <div key={sIdx} className="flex items-start gap-3 relative">
                    {sIdx < selectedReelForDrawer.itineraryStops.length - 1 && (
                      <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-[#E5D5BA] dark:bg-[#2C3B34]" />
                    )}
                    <div className="w-6 h-6 rounded-full bg-[#173B32] dark:bg-[#B49252] text-[#FAF7F0] dark:text-[#0F2924] flex items-center justify-center text-[10px] font-mono font-bold shrink-0 z-10">
                      {sIdx + 1}
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-serif font-bold text-sm text-[#173B32] dark:text-[#FAF7F0]">
                          {stop.title}
                        </span>
                        <span className="text-[10px] font-mono text-[#B65E3C] dark:text-[#E28C68] font-semibold">
                          {stop.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#7B4D36] dark:text-[#C5A898] mt-0.5 leading-relaxed">
                        {stop.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#E5D5BA]/80 dark:border-[#2C3B34] bg-[#FAF4E8] dark:bg-[#172520]">
              <button
                type="button"
                onClick={(e) => {
                  setSelectedReelForDrawer(null);
                  handlePlanRoute(selectedReelForDrawer, e);
                }}
                className="w-full py-2.5 rounded-xl bg-[#B65E3C] hover:bg-[#A35131] text-[#FAF7F0] font-serif font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>Plan This Route Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
