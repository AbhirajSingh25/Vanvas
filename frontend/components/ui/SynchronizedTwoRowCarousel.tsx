"use client";

import React, { useRef, useState, useEffect, useCallback, useId } from "react";
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, Grid, Columns } from "lucide-react";

export interface SynchronizedTwoRowCarouselProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  featuredItem?: T | null;
  renderFeatured?: (item: T) => React.ReactNode;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  filterOptions?: string[];
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
  className?: string;
  columnWidthClass?: string;
  ariaLabel?: string;
  emptyMessage?: string;
  hideHeader?: boolean;
  showNavigationControls?: boolean;
}

export function SynchronizedTwoRowCarousel<T>({
  items,
  renderItem,
  keyExtractor,
  featuredItem,
  renderFeatured,
  title,
  subtitle,
  eyebrow,
  filterOptions,
  activeFilter,
  onFilterChange,
  className = "",
  columnWidthClass = "w-[82vw] sm:w-[350px] lg:w-[380px]",
  ariaLabel = "Synchronized Discovery Carousel",
  emptyMessage = "No items available in this category.",
  hideHeader = false,
  showNavigationControls = false,
}: SynchronizedTwoRowCarouselProps<T>) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeColumnIndex, setActiveColumnIndex] = useState(0);
  const [isExpandedView, setIsExpandedView] = useState(false);

  const carouselId = useId();

  // Total columns = ceil(items.length / 2)
  const totalColumns = Math.ceil(items.length / 2);

  const updateScrollState = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);

    if (clientWidth > 0) {
      // Calculate active column based on scroll position
      const firstCol = el.querySelector<HTMLElement>('[data-carousel-col="true"]');
      const colWidth = firstCol ? firstCol.offsetWidth + 16 : clientWidth * 0.8;
      const currentCol = Math.round(scrollLeft / colWidth);
      setActiveColumnIndex(Math.min(totalColumns - 1, Math.max(0, currentCol)));
    }
  }, [totalColumns]);

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

  const scrollByColumns = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const firstCol = el.querySelector<HTMLElement>('[data-carousel-col="true"]');
    const scrollAmount = firstCol ? (firstCol.offsetWidth + 16) * 1.5 : el.clientWidth * 0.85;

    el.scrollBy({
      left: direction === "right" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollByColumns("left");
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollByColumns("right");
    }
  };

  // Group items into pairs of 2 for strict column pairing
  // This guarantees Row 1 and Row 2 are grouped within the same column DOM node,
  // making desynchronization physically impossible on any browser or screen size!
  const pairedColumns: { top: T; bottom?: T; topIdx: number; bottomIdx?: number }[] = [];
  for (let i = 0; i < items.length; i += 2) {
    pairedColumns.push({
      top: items[i],
      topIdx: i,
      bottom: items[i + 1] !== undefined ? items[i + 1] : undefined,
      bottomIdx: items[i + 1] !== undefined ? i + 1 : undefined,
    });
  }

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
            {/* View Mode Toggle (Two-Row Carousel vs Full Grid) */}
            {items.length > 4 && (
              <button
                type="button"
                onClick={() => setIsExpandedView((prev) => !prev)}
                className="px-3 py-1.5 rounded-full bg-[#FAF4E8] dark:bg-[#1C2E27] border border-[#E5D5BA] dark:border-[#2C3B34] text-[#173B32] dark:text-[#EAE6DF] hover:border-[#173B32] transition-colors flex items-center gap-1.5 text-xs font-mono font-semibold shadow-2xs"
                title={isExpandedView ? "Switch to synchronized 2-row carousel" : "View all as expanded grid"}
                aria-label={isExpandedView ? "Switch to carousel view" : "Switch to expanded grid view"}
              >
                {isExpandedView ? <Columns className="w-3.5 h-3.5 text-[#B65E3C]" /> : <Grid className="w-3.5 h-3.5 text-[#173B32] dark:text-[#D4AF37]" />}
                <span className="hidden sm:inline">{isExpandedView ? "Two-Row View" : "View All"}</span>
              </button>
            )}

            {/* Navigation Arrows for Two-Row Track */}
            {!isExpandedView && totalColumns > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scrollByColumns("left")}
                  disabled={!canScrollLeft}
                  aria-label="Scroll carousel left"
                  className="p-2 rounded-full bg-[#FAF4E8] dark:bg-[#1C2E27] border border-[#E5D5BA] dark:border-[#2C3B34] text-[#173B32] dark:text-[#FAF7F0] hover:border-[#173B32] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollByColumns("right")}
                  disabled={!canScrollRight}
                  aria-label="Scroll carousel right"
                  className="p-2 rounded-full bg-[#FAF4E8] dark:bg-[#1C2E27] border border-[#E5D5BA] dark:border-[#2C3B34] text-[#173B32] dark:text-[#FAF7F0] hover:border-[#173B32] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs"
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
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold whitespace-nowrap transition-all shadow-2xs ${
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

      {/* Prominent Featured Item Section (if provided) */}
      {featuredItem && renderFeatured && (
        <div className="w-full">
          {renderFeatured(featuredItem)}
        </div>
      )}

      {/* Compact Navigation when outer header is used */}
      {hideHeader && showNavigationControls && !isExpandedView && totalColumns > 1 && (
        <div className="flex items-center justify-end gap-1.5 -mb-2">
          <button
            type="button"
            onClick={() => scrollByColumns("left")}
            disabled={!canScrollLeft}
            aria-label="Scroll carousel left"
            className="p-1.5 rounded-full bg-[#FAF4E8] dark:bg-[#1C2E27] border border-[#E5D5BA] dark:border-[#2C3B34] text-[#173B32] dark:text-[#FAF7F0] hover:border-[#173B32] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => scrollByColumns("right")}
            disabled={!canScrollRight}
            aria-label="Scroll carousel right"
            className="p-1.5 rounded-full bg-[#FAF4E8] dark:bg-[#1C2E27] border border-[#E5D5BA] dark:border-[#2C3B34] text-[#173B32] dark:text-[#FAF7F0] hover:border-[#173B32] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Two-Row Synchronized Track OR Expanded Grid */}
      {items.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-[#FAF4E8]/60 dark:bg-[#172520]/60 border border-dashed border-[#E5D5BA] dark:border-[#2C3B34] text-xs text-[#7B4D36] dark:text-[#A89284] font-medium">
          {emptyMessage}
        </div>
      ) : isExpandedView ? (
        /* Full Expanded Grid Mode */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pt-2">
          {items.map((item, idx) => (
            <div key={keyExtractor ? keyExtractor(item, idx) : idx}>
              {renderItem(item, idx)}
            </div>
          ))}
        </div>
      ) : (
        /* Synchronized Two-Row Column Carousel */
        <div className="relative">
          <div
            ref={scrollContainerRef}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth no-scrollbar focus:outline-none focus:ring-1 focus:ring-[#173B32]/30 dark:focus:ring-[#B49252]/40"
          >
            {pairedColumns.map((col, colIdx) => (
              <div
                key={`col-${colIdx}`}
                data-carousel-col="true"
                className={`shrink-0 snap-start flex flex-col gap-4 sm:gap-5 ${columnWidthClass}`}
              >
                {/* Row 1 (Top Card) */}
                <div className="flex-1 flex flex-col">
                  {renderItem(col.top, col.topIdx)}
                </div>

                {/* Row 2 (Bottom Card) */}
                {col.bottom !== undefined && col.bottomIdx !== undefined ? (
                  <div className="flex-1 flex flex-col">
                    {renderItem(col.bottom, col.bottomIdx)}
                  </div>
                ) : (
                  /* Spacer if odd number of items */
                  <div className="flex-1 hidden sm:block" />
                )}
              </div>
            ))}
          </div>

          {/* Carousel Progress Bar & Indicator */}
          {totalColumns > 1 && (
            <div className="flex items-center justify-between text-[11px] font-mono text-[#7B4D36] dark:text-[#A89284] mt-2 px-1">
              <span>
                Column {activeColumnIndex + 1} of {totalColumns} ({items.length} options)
              </span>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalColumns, 8) }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === Math.min(activeColumnIndex, 7)
                        ? "w-5 bg-[#B65E3C] dark:bg-[#E28C68]"
                        : "w-1.5 bg-[#E5D5BA] dark:bg-[#2C3B34]"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
