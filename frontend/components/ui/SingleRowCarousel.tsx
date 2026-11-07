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
  itemWidthClass = "w-[80vw] sm:w-[320px] lg:w-[360px]",
  ariaLabel = "Single Row Discovery Carousel",
  emptyMessage = "No items available in this category.",
  hideHeader = false,
  showNavigationControls = false,
}: SingleRowCarouselProps<T>) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isExpandedView, setIsExpandedView] = useState(false);

  const carouselId = useId();
  const totalItems = items.length;

  const updateScrollState = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);

    if (clientWidth > 0 && totalItems > 0) {
      const firstItem = el.querySelector<HTMLElement>('[data-carousel-item="true"]');
      const itemWidth = firstItem ? firstItem.offsetWidth + 16 : clientWidth * 0.8;
      const current = Math.round(scrollLeft / itemWidth);
      setActiveIndex(Math.min(totalItems - 1, Math.max(0, current)));
    }
  }, [totalItems]);

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
  }, [updateScrollState, items.length]);

  const scrollByDirection = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const firstItem = el.querySelector<HTMLElement>('[data-carousel-item="true"]');
    const scrollAmount = firstItem ? (firstItem.offsetWidth + 16) * 1.5 : el.clientWidth * 0.85;

    el.scrollBy({
      left: direction === "right" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollByDirection("left");
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollByDirection("right");
    }
  };

  return (
    <div className={`space-y-6 ${className}`} aria-label={ariaLabel}>
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

          {/* Controls: Filter chips & Navigation buttons */}
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

            {/* Navigation Arrows for Single-Row Track */}
            {!isExpandedView && totalItems > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scrollByDirection("left")}
                  disabled={!canScrollLeft}
                  aria-label="Scroll carousel left"
                  className="p-2 rounded-full bg-[#FAF4E8] dark:bg-[#1C2E27] border border-[#E5D5BA] dark:border-[#2C3B34] text-[#173B32] dark:text-[#FAF7F0] hover:border-[#173B32] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollByDirection("right")}
                  disabled={!canScrollRight}
                  aria-label="Scroll carousel right"
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

      {/* Compact Navigation when outer header is used */}
      {hideHeader && showNavigationControls && !isExpandedView && totalItems > 1 && (
        <div className="flex items-center justify-end gap-1.5 -mb-2">
          <button
            type="button"
            onClick={() => scrollByDirection("left")}
            disabled={!canScrollLeft}
            aria-label="Scroll carousel left"
            className="p-1.5 rounded-full bg-[#FAF4E8] dark:bg-[#1C2E27] border border-[#E5D5BA] dark:border-[#2C3B34] text-[#173B32] dark:text-[#FAF7F0] hover:border-[#173B32] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => scrollByDirection("right")}
            disabled={!canScrollRight}
            aria-label="Scroll carousel right"
            className="p-1.5 rounded-full bg-[#FAF4E8] dark:bg-[#1C2E27] border border-[#E5D5BA] dark:border-[#2C3B34] text-[#173B32] dark:text-[#FAF7F0] hover:border-[#173B32] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
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
        /* Single-Row Horizontal Carousel Track */
        <div className="relative group/carousel">
          <div
            ref={scrollContainerRef}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="region"
            aria-label={`${title || "Single Row Carousel"} scroll track`}
            className="flex items-stretch gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth no-scrollbar focus:outline-none focus-visible:ring-2 focus-visible:ring-[#173B32] dark:focus-visible:ring-[#B49252] rounded-2xl"
          >
            {items.map((item, idx) => {
              const itemKey = keyExtractor ? keyExtractor(item, idx) : `single-item-${idx}`;
              return (
                <div
                  key={itemKey}
                  data-carousel-item="true"
                  className={`snap-start shrink-0 flex flex-col ${itemWidthClass}`}
                >
                  {renderItem(item, idx)}
                </div>
              );
            })}
          </div>

          {/* Track Progress and Index Indicator Bar */}
          <div className="flex items-center justify-between pt-2 px-1 text-[11px] font-mono text-[#7B4D36] dark:text-[#C5A898]">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#173B32] dark:text-[#FAF7F0]">
                {activeIndex + 1}
              </span>
              <span>of</span>
              <span>{totalItems}</span>
              <span className="text-[10px] opacity-60">· Single-Row Track</span>
            </div>

            {/* Visual Dot / Progress indicator */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(8, totalItems) }).map((_, i) => {
                const isActive = Math.round((activeIndex / Math.max(1, totalItems - 1)) * Math.min(7, totalItems - 1)) === i;
                return (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isActive
                        ? "w-5 bg-[#B65E3C] dark:bg-[#E28C68]"
                        : "w-1.5 bg-[#E5D5BA] dark:bg-[#2C3B34]"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

