"use client";

import React, { useState, useEffect } from "react";
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

  const [currentSrc, setCurrentSrc] = useState<string>(src || defaultFallback);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setCurrentSrc(src || defaultFallback);
    setHasError(false);
    setIsLoading(true);
  }, [src, defaultFallback]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      if (currentSrc !== defaultFallback) {
        setCurrentSrc(defaultFallback);
      }
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
        <div className="absolute inset-0 bg-[#E5D5BA]/40 animate-pulse z-0 flex items-center justify-center">
          <Compass className="w-6 h-6 text-[#173B32]/30 animate-spin" style={{ animationDuration: "3s" }} />
        </div>
      )}

      {/* Render Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={currentSrc}
        alt={alt}
        onError={handleError}
        onLoad={() => setIsLoading(false)}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        style={style}
        {...props}
      />
    </div>
  );
};
