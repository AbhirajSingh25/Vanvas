"use client";

import React, { useState, useEffect, useRef } from "react";
import { Compass } from "lucide-react";
import { TerrainType, REGIONAL_FALLBACK_ARTWORKS } from "@/lib/visualIntelligence";

export interface VanvasImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  fallbackSrc?: string;
  regionType?: TerrainType;
  aspectRatio?: "square" | "tall" | "wide" | "hero" | "auto";
  priority?: boolean;
  className?: string;
}

const GUARANTEED_UNIVERSAL_FALLBACK = "/images/places/universal/nature.webp";

export const VanvasImage: React.FC<VanvasImageProps> = ({
  src,
  fallbackSrc,
  regionType = "himalayan",
  aspectRatio = "auto",
  priority = false,
  alt = "VANVAS Sanctuary Imagery",
  className = "",
  style,
  ...props
}) => {
  const regionalFallback =
    REGIONAL_FALLBACK_ARTWORKS[regionType] ||
    REGIONAL_FALLBACK_ARTWORKS.general;

  // Build the cascading fallback chain:
  // 1. Primary src
  // 2. Explicit fallbackSrc
  // 3. Regional fallback
  // 4. Guaranteed universal local asset
  const initialChain = React.useMemo(() => {
    const chain: string[] = [];
    if (src) chain.push(src);
    if (fallbackSrc && !chain.includes(fallbackSrc)) chain.push(fallbackSrc);
    if (regionalFallback && !chain.includes(regionalFallback)) chain.push(regionalFallback);
    if (!chain.includes(GUARANTEED_UNIVERSAL_FALLBACK)) chain.push(GUARANTEED_UNIVERSAL_FALLBACK);
    return chain.length > 0 ? chain : [GUARANTEED_UNIVERSAL_FALLBACK];
  }, [src, fallbackSrc, regionalFallback]);

  const [chainIndex, setChainIndex] = useState<number>(0);
  const [currentSrc, setCurrentSrc] = useState<string>(initialChain[0]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const imgRef = useRef<HTMLImageElement>(null);

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
        src={currentSrc}
        alt={alt}
        onError={handleError}
        onLoad={handleLoad}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        style={style}
        {...props}
      />
    </div>
  );
};
