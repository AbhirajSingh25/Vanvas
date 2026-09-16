"use client";

import React from "react";
import { VanvasImage } from "@/components/ui/VanvasImage";
import {
  resolveDestinationAsset,
  resolveDestinationVisualProfile,
  TerrainType,
} from "@/lib/visualIntelligence";

export interface DestinationArtworkProps {
  slug?: string;
  destination?: string;
  title?: string;
  hindiName?: string;
  subtitle?: string;
  elevation?: string;
  coordinates?: string;
  state?: string;
  className?: string;
  aspectRatio?: "square" | "tall" | "wide" | "hero" | "auto";
  showVignette?: boolean;
  priority?: boolean;
}

export { resolveDestinationVisualProfile as getDestinationArtworkPath };

export const DestinationArtwork: React.FC<DestinationArtworkProps> = ({
  slug,
  destination,
  title,
  hindiName,
  subtitle,
  elevation,
  coordinates,
  state,
  className = "",
  aspectRatio = "wide",
  showVignette = true,
  priority = false,
}) => {
  const target = destination || slug || "manali";
  const { primarySrc, fallbackSrc, terrainType, profile } = resolveDestinationAsset(
    target,
    "illustration",
    null,
    state || subtitle
  );

  return (
    <div className={`relative overflow-hidden w-full ${className}`}>
      <VanvasImage
        src={primarySrc}
        fallbackSrc={fallbackSrc}
        regionType={terrainType}
        aspectRatio={aspectRatio}
        priority={priority}
        alt={`${title || profile.name} editorial travel artwork`}
        className="w-full h-full object-cover"
      />

      {/* Atmospheric Editorial Vignette Overlay */}
      {showVignette && (
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F2924]/70 via-transparent to-black/20 pointer-events-none" />
      )}
    </div>
  );
};
