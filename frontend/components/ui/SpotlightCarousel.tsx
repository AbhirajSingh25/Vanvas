"use client";

import React, { useRef, useState, useEffect, useCallback, useId } from "react";
import { motion, useReducedMotion } from "motion/react";

interface SpotlightCarouselProps<T> {
  items: T[];
  renderItem: (
    item: T,
    state: { isActive: boolean; index: number; isNeighbor: boolean }
  ) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  className?: string;
  itemClassName?: string;
  ariaLabel?: string;
  onActiveIndexChange?: (index: number) => void;
}

export function SpotlightCarousel<T>({
  items,
  renderItem,
  keyExtractor,
  className = "",
  itemClassName = "",
  ariaLabel = "Featured carousel",
  onActiveIndexChange,
}: SpotlightCarouselProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [edgeGutter, setEdgeGutter] = useState<number>(0);
  const shouldReduceMotion = useReducedMotion();
  const rafId = useRef<number | null>(null);
  const carouselId = useId();
  const initialCenteredRef = useRef<boolean>(false);

  // Measure card width and available scroll container width to compute edge gutter
  const updateEdgeGutter = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth;
    if (containerWidth <= 0) return;

    // Measure the actual rendered card width using the first carousel card
    const firstCard = container.querySelector<HTMLElement>('[data-carousel-card="true"]');
    if (!firstCard) return;

    const cardWidth = firstCard.offsetWidth;
    if (cardWidth <= 0) return;

    const gutter = Math.max(0, Math.floor((containerWidth - cardWidth) / 2));
    setEdgeGutter(gutter);
  }, []);

  // Detect card closest to visible container center (excluding spacers)
  const calculateActiveCard = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;

    // Query ONLY actual carousel cards, never spacers
    const cards = Array.from(
      container.querySelectorAll<HTMLElement>('[data-carousel-card="true"]')
    );
    if (cards.length === 0) return;

    let closestIdx = 0;
    let minDistance = Infinity;

    cards.forEach((card) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const distance = Math.abs(containerCenter - cardCenter);
      const idxStr = card.getAttribute("data-card-index");
      const idx = idxStr !== null ? parseInt(idxStr, 10) : 0;

      if (distance < minDistance) {
        minDistance = distance;
        closestIdx = idx;
      }
    });

    setActiveIndex((prev) => {
      if (prev !== closestIdx) {
        if (onActiveIndexChange) {
          onActiveIndexChange(closestIdx);
        }
        return closestIdx;
      }
      return prev;
    });
  }, [onActiveIndexChange]);

  const handleScroll = useCallback(() => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
    }
    rafId.current = requestAnimationFrame(() => {
      calculateActiveCard();
    });
  }, [calculateActiveCard]);

  // Recalculate gutter and active card on resize or layout changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    updateEdgeGutter();
    calculateActiveCard();

    // ResizeObserver to track container dimension and card dimension changes
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        updateEdgeGutter();
        calculateActiveCard();
      });
      ro.observe(container);
      const firstCard = container.querySelector<HTMLElement>('[data-carousel-card="true"]');
      if (firstCard) {
        ro.observe(firstCard);
      }
    }

    container.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateEdgeGutter, { passive: true });

    return () => {
      if (ro) ro.disconnect();
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateEdgeGutter);
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [calculateActiveCard, handleScroll, updateEdgeGutter, items.length, itemClassName]);

  // Ensure first card is centered intentionally on initial load
  useEffect(() => {
    if (initialCenteredRef.current) return;
    const container = containerRef.current;
    if (!container) return;

    // When gutters have settled, ensure container is scrolled to 0 so card 0 is centered
    if (edgeGutter > 0) {
      initialCenteredRef.current = true;
      container.scrollLeft = 0;
      calculateActiveCard();
    }
  }, [edgeGutter, calculateActiveCard]);

  return (
    <div className={`relative w-full ${className}`} data-testid="spotlight-carousel-root">
      {/* Scrollable track with native touch scrolling & snap */}
      <div
        ref={containerRef}
        role="region"
        aria-label={ariaLabel}
        data-testid="spotlight-carousel-track"
        data-carousel-container="true"
        className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory touch-manipulation py-2 px-0"
        style={{
          scrollPaddingLeft: `${edgeGutter}px`,
          scrollPaddingRight: `${edgeGutter}px`,
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Leading Spacer element for dynamic centering of first card */}
        <div
          data-carousel-spacer="true"
          aria-hidden="true"
          style={{ width: `${edgeGutter}px`, flexShrink: 0 }}
        />

        {items.map((item, idx) => {
          const isActive = idx === activeIndex;
          const isNeighbor = Math.abs(idx - activeIndex) === 1;
          const key = keyExtractor(item, idx);

          return (
            <div
              key={key}
              data-carousel-card="true"
              data-card-index={idx}
              data-card-key={key}
              className={`shrink-0 snap-center ${itemClassName}`}
              style={{
                // Prevent layout oscillation: outer dimension remains completely rigid
                boxSizing: "border-box",
              }}
            >
              <motion.div
                className="w-full h-full"
                initial={false}
                animate={
                  shouldReduceMotion
                    ? { scale: 1, opacity: 1 }
                    : {
                        scale: isActive ? 1.0 : isNeighbor ? 0.96 : 0.92,
                        opacity: isActive ? 1.0 : isNeighbor ? 0.85 : 0.65,
                      }
                }
                transition={{
                  duration: 0.26,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {renderItem(item, { isActive, index: idx, isNeighbor })}
              </motion.div>
            </div>
          );
        })}

        {/* Trailing Spacer element for dynamic centering of last card */}
        <div
          data-carousel-spacer="true"
          aria-hidden="true"
          style={{ width: `${edgeGutter}px`, flexShrink: 0 }}
        />
      </div>
    </div>
  );
}
