"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
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
}

export function SpotlightCarousel<T>({
  items,
  renderItem,
  keyExtractor,
  className = "",
  itemClassName = "",
  ariaLabel = "Featured carousel",
}: SpotlightCarouselProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const shouldReduceMotion = useReducedMotion();
  const rafId = useRef<number | null>(null);

  const calculateActiveCard = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;

    const children = Array.from(container.children) as HTMLElement[];
    if (children.length === 0) return;

    let closestIdx = 0;
    let minDistance = Infinity;

    children.forEach((child, index) => {
      const childRect = child.getBoundingClientRect();
      const childCenter = childRect.left + childRect.width / 2;
      const distance = Math.abs(containerCenter - childCenter);

      if (distance < minDistance) {
        minDistance = distance;
        closestIdx = index;
      }
    });

    setActiveIndex((prev) => (prev !== closestIdx ? closestIdx : prev));
  }, []);

  const handleScroll = useCallback(() => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
    }
    rafId.current = requestAnimationFrame(() => {
      calculateActiveCard();
    });
  }, [calculateActiveCard]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    calculateActiveCard();
    container.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", calculateActiveCard, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", calculateActiveCard);
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [calculateActiveCard, handleScroll, items.length]);

  return (
    <div className={`relative w-full ${className}`}>
      {/* Scrollable track with native touch scrolling & snap */}
      <div
        ref={containerRef}
        role="region"
        aria-label={ariaLabel}
        className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory touch-manipulation py-2 px-1 -mx-1"
        style={{
          scrollPaddingLeft: "1rem",
          scrollPaddingRight: "1rem",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {items.map((item, idx) => {
          const isActive = idx === activeIndex;
          const isNeighbor = Math.abs(idx - activeIndex) === 1;

          return (
            <motion.div
              key={keyExtractor(item, idx)}
              className={`shrink-0 snap-center ${itemClassName}`}
              initial={false}
              animate={
                shouldReduceMotion
                  ? { scale: 1, opacity: 1 }
                  : {
                      scale: isActive ? 1.0 : isNeighbor ? 0.95 : 0.92,
                      opacity: isActive ? 1.0 : isNeighbor ? 0.8 : 0.65,
                    }
              }
              transition={{
                duration: 0.26,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {renderItem(item, { isActive, index: idx, isNeighbor })}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
