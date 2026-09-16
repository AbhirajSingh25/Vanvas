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
  const defaultFallback =
    fallbackSrc ||
    REGIONAL_FALLBACK_ARTWORKS[regionType] ||
    REGIONAL_FALLBACK_ARTWORKS.general;

  const targetSrc = src || defaultFallback;
  const [currentSrc, setCurrentSrc] = useState<string>(targetSrc);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const imgRef = useRef<HTMLImageElement>(null);

  // Sync state when src changes
  useEffect(() => {
    const newTarget = src || defaultFallback;
    setCurrentSrc(newTarget);
    setHasError(false);
    
    // Check if the image is already cached / completed in browser
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    // Safety timeout: Never stay in loading state forever (max 2 seconds)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [src, defaultFallback]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    if (!hasError && currentSrc !== defaultFallback) {
      setHasError(true);
      setCurrentSrc(defaultFallback);
      // If fallback is also loaded or complete
      if (imgRef.current && imgRef.current.complete) {
        setIsLoading(false);
      }
    } else {
      // Fallback failed or already applied
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
