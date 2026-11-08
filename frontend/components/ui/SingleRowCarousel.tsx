"use client";

import React, { useRef, useState, useEffect, useCallback, useId } from "react";
import { ChevronLeft, ChevronRight, Sparkles, Grid, Rows } from "lucide-react";

export interface SingleRowCarouselProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  filterOptions?: string[];
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
  className?: string;
  itemWidthClass?: string;
  ariaLabel?: string;
  emptyMessage?: string;
  hideHeader?: boolean;
  showNavigationControls?: boolean;
}

export function SingleRowCarousel<T>({
  items,
  renderItem,
  keyExtractor,
  title,
  subtitle,
  eyebrow,
  filterOptions,
  activeFilter,
  onFilterChange,
  className = "",
  itemWidthClass = "w-[82vw] sm:w-[320px] lg:w-[350px]",
  ariaLabel = "Single Row Discovery Carousel",
  emptyMessage = "No items available in this category.",
  hideHeader = false,
  showNavigationControls = false,
}: SingleRowCarouselProps<T>) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isExpandedView, setIsExpandedView] = useState(false);

  // Gesture tracking refs
  const isPointerDownRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const scrollStartLeftRef = useRef(0);
  const isDraggingRef = useRef(false);
  const hasDecidedAxisRef = useRef(false);
  const isVerticalScrollRef = useRef(false);
  const suppressClickRef = useRef(false);

  const carouselId = useId();
  const totalItems = items.length;

  // Accurately determine active item using exact bounding boxes relative to container center
  const updateScrollState = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el || totalItems === 0) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 15);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 15);

    // If at extreme start
    if (scrollLeft <= 10) {
      setActiveIndex(0);
      return;
    }

    // If at extreme end
    if (scrollLeft + clientWidth >= scrollWidth - 15) {
      setActiveIndex(totalItems - 1);
      return;
    }

    // Check which card is centered in the visible container
    const containerRect = el.getBoundingClientRect();
    const containerTargetX = containerRect.left + containerRect.width * 0.45;

    let closestIdx = 0;
    let minDistance = Infinity;

    cardRefs.current.forEach((card, idx) => {
      if (!card) return;
      const cardRect = card.getBoundingClientRect();
      const cardCenterX = cardRect.left + cardRect.width / 2;
      const dist = Math.abs(containerTargetX - cardCenterX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
    });

    setActiveIndex(closestIdx);
  }, [totalItems]);

  // Reset scroll and index when items change or filter switches
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTo({ left: 0, behavior: "instant" });
    }
    setActiveIndex(0);
    setCanScrollLeft(false);
    setCanScrollRight(totalItems > 1);
  }, [items, activeFilter, totalItems]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, totalItems]);

  const scrollToIndex = useCallback((index: number) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const bounded = Math.max(0, Math.min(totalItems - 1, index));
    const targetCard = cardRefs.current[bounded];

    if (targetCard) {
      targetCard.scrollIntoView({
        behavior: "smooth",
        inline: "start",
        block: "nearest",
      });
      setActiveIndex(bounded);
    } else {
      // Fallback scroll estimation
      const estimatedWidth = el.clientWidth * 0.85;
      el.scrollTo({
        left: bounded * estimatedWidth,
        behavior: "smooth",
      });
      setActiveIndex(bounded);
    }
  }, [totalItems]);

  const scrollByDirection = useCallback((direction: "left" | "right") => {
    if (direction === "left") {
      scrollToIndex(Math.max(0, activeIndex - 1));
    } else {
      scrollToIndex(Math.min(totalItems - 1, activeIndex + 1));
    }
  }, [activeIndex, scrollToIndex, totalItems]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollByDirection("left");
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollByDirection("right");
    }
  };

  // Pointer & Touch Swipe gesture handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only primary button or touch
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const el = scrollContainerRef.current;
    if (!el) return;

    isPointerDownRef.current = true;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    scrollStartLeftRef.current = el.scrollLeft;
    isDraggingRef.current = false;
    hasDecidedAxisRef.current = false;
    isVerticalScrollRef.current = false;
    suppressClickRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;

    const deltaX = e.clientX - startXRef.current;
    const deltaY = e.clientY - startYRef.current;

    // Decide if this is a horizontal swipe or vertical page scroll
    if (!hasDecidedAxisRef.current) {
      if (Math.abs(deltaY) > 8 && Math.abs(deltaY) > Math.abs(deltaX)) {
        // Vertical page scroll — do not capture or intercept
        hasDecidedAxisRef.current = true;
        isVerticalScrollRef.current = true;
        return;
      }
      if (Math.abs(deltaX) > 8 && Math.abs(deltaX) >= Math.abs(deltaY)) {
        // Horizontal carousel swipe
        hasDecidedAxisRef.current = true;
        isVerticalScrollRef.current = false;
        isDraggingRef.current = true;
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          // ignore pointer capture errors
        }
      }
    }

    if (isVerticalScrollRef.current) return;

    if (isDraggingRef.current) {
      suppressClickRef.current = true;
      el.scrollLeft = scrollStartLeftRef.current - deltaX;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    const el = scrollContainerRef.current;

    if (el) {
      try {
        if (el.hasPointerCapture(e.pointerId)) {
          el.releasePointerCapture(e.pointerId);
        }
      } catch {
        // ignore
      }
    }

    if (isDraggingRef.current) {
      const deltaX = e.clientX - startXRef.current;
      // Swipe threshold for moving to next/previous slide
      if (deltaX < -45) {
        scrollToIndex(Math.min(totalItems - 1, activeIndex + 1));
      } else if (deltaX > 45) {
        scrollToIndex(Math.max(0, activeIndex - 1));
      } else {
        scrollToIndex(activeIndex);
      }

      // Reset suppressClick after brief timeout
      setTimeout(() => {
        suppressClickRef.current = false;
        isDraggingRef.current = false;
      }, 150);
    }
  };

  const handlePointerCancel = () => {
    isPointerDownRef.current = false;
    isDraggingRef.current = false;
    suppressClickRef.current = false;
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    // If a swipe drag just occurred, suppress the click on card/links
    if (suppressClickRef.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  return (
    <div className={`space-y-4 ${className}`} aria-label={ariaLabel}>
      {/* Section Header */}
      {!hideHeader && (title || eyebrow || filterOptions) && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5D5BA]/70 dark:border-[#2C3B34] pb-4">
          <div>
            {eyebrow && (
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold tracking-widest text-[#B65E3C] dark:text-[#E28C68] uppercase mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{eyebrow}</span>
              </div>
            )}
            {title && (
              <h2 className="font-serif font-black text-2xl sm:text-3xl text-[#173B32] dark:text-[#FAF7F0] tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-[#7B4D36] dark:text-[#C5A898] font-medium mt-1 max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>

          {/* Controls: Filter chips & Navigation buttons (cleanly separated, never overlapping cards) */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {/* View Mode Toggle (Single-Row Carousel vs Full Grid) */}
            {items.length > 3 && (
              <button
                type="button"
                onClick={() => setIsExpandedView((prev) => !prev)}
                className="px-3 py-1.5 rounded-full bg-[#FAF4E8] dark:bg-[#1C2E27] border border-[#E5D5BA] dark:border-[#2C3B34] text-[#173B32] dark:text-[#EAE6DF] hover:border-[#173B32] transition-colors flex items-center gap-1.5 text-xs font-mono font-semibold shadow-2xs cursor-pointer"
                title={isExpandedView ? "Switch to single-row carousel" : "View all as expanded grid"}
                aria-label={isExpandedView ? "Switch to carousel view" : "Switch to expanded grid view"}
              >
                {isExpandedView ? (
                  <Rows className="w-3.5 h-3.5 text-[#B65E3C]" />
                ) : (
                  <Grid className="w-3.5 h-3.5 text-[#173B32] dark:text-[#D4AF37]" />
                )}
                <span className="hidden sm:inline">{isExpandedView ? "Single-Row View" : "View All"}</span>
              </button>
            )}

            {/* Navigation Arrows for Single-Row Track (Desktop header slot) */}
            {!isExpandedView && totalItems > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => scrollByDirection("left")}
                  disabled={!canScrollLeft}
                  aria-label="Previous card"
                  className="p-2 rounded-full bg-[#FAF4E8] dark:bg-[#1C2E27] border border-[#E5D5BA] dark:border-[#2C3B34] text-[#173B32] dark:text-[#FAF7F0] hover:border-[#173B32] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollByDirection("right")}
                  disabled={!canScrollRight}
                  aria-label="Next card"
                  className="p-2 rounded-full bg-[#FAF4E8] dark:bg-[#1C2E27] border border-[#E5D5BA] dark:border-[#2C3B34] text-[#173B32] dark:text-[#FAF7F0] hover:border-[#173B32] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter Chips Bar */}
      {filterOptions && filterOptions.length > 0 && onFilterChange && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
          {filterOptions.map((opt) => {
            const isSelected = (activeFilter || filterOptions[0]) === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onFilterChange(opt)}
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold whitespace-nowrap transition-all shadow-2xs cursor-pointer ${
                  isSelected
                    ? "bg-[#173B32] text-[#FAF7F0] dark:bg-[#B49252] dark:text-[#0F2924] shadow-xs"
                    : "bg-[#FAF4E8] dark:bg-[#1C2E27] text-[#7B4D36] dark:text-[#C5A898] hover:bg-[#EFE5D2] dark:hover:bg-[#253D34] border border-[#E5D5BA]/80 dark:border-[#2C3B34]"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {/* Repositioned Navigation Bar when header is hidden: dedicated row with clear vertical breathing room, NEVER overlapping cards */}
      {hideHeader && showNavigationControls && !isExpandedView && totalItems > 1 && (
        <div className="flex items-center justify-between pb-2 pt-1 border-b border-[#E5D5BA]/60 dark:border-[#2C3B34]">
          <div className="flex items-center gap-2 text-xs font-mono text-[#7B4D36] dark:text-[#C5A898]">
            <span className="font-bold text-[#173B32] dark:text-[#FAF7F0] text-sm">
              {activeIndex + 1}
            </span>
            <span className="opacity-70">of {totalItems}</span>
            <span className="hidden sm:inline text-[11px] opacity-60">· Swipe or tap arrows</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scrollByDirection("left")}
              disabled={!canScrollLeft}
              aria-label="Previous item"
              className="p-1.5 rounded-full bg-[#FAF4E8] dark:bg-[#1C2E27] border border-[#E5D5BA] dark:border-[#2C3B34] text-[#173B32] dark:text-[#FAF7F0] hover:border-[#173B32] disabled:opacity-25 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollByDirection("right")}
              disabled={!canScrollRight}
              aria-label="Next item"
              className="p-1.5 rounded-full bg-[#FAF4E8] dark:bg-[#1C2E27] border border-[#E5D5BA] dark:border-[#2C3B34] text-[#173B32] dark:text-[#FAF7F0] hover:border-[#173B32] disabled:opacity-25 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="py-12 px-6 rounded-3xl bg-[#FAF7F0] dark:bg-[#15231F] border-2 border-dashed border-[#E5D5BA] dark:border-[#2C3B34] text-center space-y-2">
          <p className="text-sm font-serif text-[#7B4D36] dark:text-[#C5A898]">
            {emptyMessage}
          </p>
        </div>
      ) : isExpandedView ? (
        /* Full Grid Mode */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
          {items.map((item, idx) => {
            const itemKey = keyExtractor ? keyExtractor(item, idx) : `grid-item-${idx}`;
            return (
              <div key={itemKey} className="w-full h-full flex flex-col">
                {renderItem(item, idx)}
              </div>
            );
          })}
        </div>
      ) : (
        /* Single-Row Horizontal Carousel Track with Natural Finger Swipe Support */
        <div className="relative group/carousel">
          <div
            ref={scrollContainerRef}
            onKeyDown={handleKeyDown}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onClickCapture={handleClickCapture}
            tabIndex={0}
            role="region"
            aria-label={`${title || "Single Row Carousel"} scroll track`}
            style={{
              touchAction: "pan-y pinch-zoom",
              WebkitOverflowScrolling: "touch",
              overscrollBehaviorX: "contain",
            }}
            className="flex items-stretch gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory no-scrollbar focus:outline-none focus-visible:ring-2 focus-visible:ring-[#173B32] dark:focus-visible:ring-[#B49252] rounded-2xl select-none"
          >
            {items.map((item, idx) => {
              const itemKey = keyExtractor ? keyExtractor(item, idx) : `single-item-${idx}`;
              return (
                <div
                  key={itemKey}
                  ref={(el) => { cardRefs.current[idx] = el; }}
                  data-carousel-item="true"
                  className={`snap-start shrink-0 flex flex-col ${itemWidthClass}`}
                >
                  {renderItem(item, idx)}
                </div>
              );
            })}
          </div>

          {/* Bottom Track Progress and Accurate Index Indicator Bar */}
          <div className="flex items-center justify-between pt-2 px-1 text-[11px] font-mono text-[#7B4D36] dark:text-[#C5A898]">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#173B32] dark:text-[#FAF7F0] text-xs">
                {activeIndex + 1}
              </span>
              <span>of</span>
              <span>{totalItems}</span>
              <span className="text-[10px] opacity-60">· Single Row</span>
            </div>

            {/* Visual Dot Progress indicator */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(8, totalItems) }).map((_, i) => {
                const isActive = Math.round((activeIndex / Math.max(1, totalItems - 1)) * Math.min(7, totalItems - 1)) === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      const targetIdx = Math.round((i / Math.min(7, totalItems - 1)) * (totalItems - 1));
                      scrollToIndex(targetIdx);
                    }}
                    aria-label={`Jump to slide ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      isActive
                        ? "w-5 bg-[#B65E3C] dark:bg-[#E28C68]"
                        : "w-1.5 bg-[#E5D5BA] dark:bg-[#2C3B34] hover:bg-[#B65E3C]/50"
                    }`}
                  />
                );
              })}
            </div>

            {/* Bottom Arrow Controls for Mobile Accessibility */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollByDirection("left")}
                disabled={!canScrollLeft}
                aria-label="Previous card"
                className="p-1 rounded-full bg-[#FAF4E8] dark:bg-[#1C2E27] border border-[#E5D5BA] dark:border-[#2C3B34] text-[#173B32] dark:text-[#FAF7F0] hover:border-[#173B32] disabled:opacity-25 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => scrollByDirection("right")}
                disabled={!canScrollRight}
                aria-label="Next card"
                className="p-1 rounded-full bg-[#FAF4E8] dark:bg-[#1C2E27] border border-[#E5D5BA] dark:border-[#2C3B34] text-[#173B32] dark:text-[#FAF7F0] hover:border-[#173B32] disabled:opacity-25 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
