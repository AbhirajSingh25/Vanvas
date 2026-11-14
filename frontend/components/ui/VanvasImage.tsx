"use client";

import React, { useState, useEffect, useRef } from "react";
import { Compass } from "lucide-react";
import { TerrainType, REGIONAL_FALLBACK_ARTWORKS } from "@/lib/visualIntelligence";

export type ImageSemanticCategory = "attraction" | "stay" | "food" | "vehicle" | "destination";

export interface VanvasImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  fallbackSrc?: string;
  category?: ImageSemanticCategory;
  regionType?: TerrainType;
  aspectRatio?: "square" | "tall" | "wide" | "hero" | "auto";
  priority?: boolean;
  className?: string;
}

const CATEGORY_FALLBACKS: Record<ImageSemanticCategory, string> = {
  attraction: "/images/places/universal/nature.webp",
  destination: "/images/places/universal/nature.webp",
  stay: "/images/places/universal/stay.webp",
  food: "/images/places/universal/food.webp",
  vehicle: "/images/places/universal/transport.webp",
};

export const VanvasImage: React.FC<VanvasImageProps> = ({
  src,
  fallbackSrc,
  category,
  regionType = "himalayan",
  aspectRatio = "auto",
  priority = false,
  alt = "VANVAS Sanctuary Imagery",
  className = "",
  style,
  ...props
}) => {
  // Infer category from URL path if not explicitly provided
  const effectiveCategory: ImageSemanticCategory = React.useMemo(() => {
    if (category) return category;
    const lower = (src || "").toLowerCase();
    if (lower.includes("/stays/") || lower.includes("hotel") || lower.includes("homestay") || lower.includes("resort") || lower.includes("hostel")) {
      return "stay";
    }
    if (lower.includes("/vehicles/") || lower.includes("vehicle") || lower.includes("bike") || lower.includes("scooter") || lower.includes("motorcycle")) {
      return "vehicle";
    }
    if (lower.includes("/food/") || lower.includes("/cafe") || lower.includes("culinary") || lower.includes("dish")) {
      return "food";
    }
    if (lower.includes("/destinations/")) {
      return "destination";
    }
    return "attraction";
  }, [category, src]);

  const guaranteedCategoryFallback = CATEGORY_FALLBACKS[effectiveCategory] || CATEGORY_FALLBACKS.attraction;

  const regionalFallback =
    effectiveCategory === "attraction" || effectiveCategory === "destination"
      ? (REGIONAL_FALLBACK_ARTWORKS[regionType] || REGIONAL_FALLBACK_ARTWORKS.general)
      : undefined;

  // Build the strict category-segregated fallback chain:
  // 1. Primary src
  // 2. Explicit fallbackSrc (only if not cross-category)
  // 3. Regional fallback (attractions/destinations ONLY)
  // 4. Guaranteed category-appropriate universal asset
  const initialChain = React.useMemo(() => {
    const chain: string[] = [];
    if (src) chain.push(src);
    if (fallbackSrc && !chain.includes(fallbackSrc)) {
      // Validate that fallbackSrc does not cross categories (e.g. landscape for a hotel/vehicle)
      const fallbackLower = fallbackSrc.toLowerCase();
      const isLandscapeFallback = fallbackLower.includes("hero") || fallbackLower.includes("nature") || fallbackLower.includes("monastery") || fallbackLower.includes("valley");
      if ((effectiveCategory === "stay" || effectiveCategory === "vehicle" || effectiveCategory === "food") && isLandscapeFallback) {
        // Reject cross-category fallback
      } else {
        chain.push(fallbackSrc);
      }
    }
    if (regionalFallback && !chain.includes(regionalFallback)) {
      chain.push(regionalFallback);
    }
    if (!chain.includes(guaranteedCategoryFallback)) {
      chain.push(guaranteedCategoryFallback);
    }
    return chain.length > 0 ? chain : [guaranteedCategoryFallback];
  }, [src, fallbackSrc, regionalFallback, guaranteedCategoryFallback, effectiveCategory]);

  const [chainIndex, setChainIndex] = useState<number>(0);
  const [currentSrc, setCurrentSrc] = useState<string>(initialChain[0]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const imgRef = useRef<HTMLImageElement>(null);

  // Bust stale browser disk, CDN, and Service Worker caches for editorial place & stay assets
  const normalizedSrc = React.useMemo(() => {
    if (!currentSrc) return currentSrc;
    if (currentSrc.startsWith("/images/") && !currentSrc.includes("?")) {
      return `${currentSrc}?v=v6`;
    }
    return currentSrc;
  }, [currentSrc]);

  useEffect(() => {
    setChainIndex(0);
    setCurrentSrc(initialChain[0]);
    
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, [initialChain]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    const nextIdx = chainIndex + 1;
    if (process.env.NODE_ENV === "development") {
      console.warn(`[VanvasImage] Failed to load "${currentSrc}" (category: ${effectiveCategory}). Falling back to: "${initialChain[nextIdx] || 'none'}"`);
    }
    if (nextIdx < initialChain.length) {
      setChainIndex(nextIdx);
      setCurrentSrc(initialChain[nextIdx]);
      if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
        setIsLoading(false);
      }
    } else {
      // Reached end of chain
      setIsLoading(false);
    }
  };

  const aspectClass = {
    square: "aspect-square",
    tall: "aspect-[3/4]",
    wide: "aspect-[16/10]",
    hero: "aspect-[21/9]",
    auto: "",
  }[aspectRatio];

  return (
    <div className={`relative overflow-hidden bg-[#173B32]/10 ${aspectClass} ${className}`}>
      {/* Loading shimmer background */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#E5D5BA]/50 animate-pulse z-0 flex items-center justify-center pointer-events-none">
          <Compass className="w-5 h-5 text-[#173B32]/40 animate-spin" style={{ animationDuration: "3s" }} />
        </div>
      )}

      {/* Render Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={normalizedSrc}
        alt={alt}
        onError={handleError}
        onLoad={handleLoad}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        draggable={false}
        className={`w-full h-full object-cover transition-opacity duration-300 select-none pointer-events-none ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        style={style}
        {...props}
      />
    </div>
  );
};
