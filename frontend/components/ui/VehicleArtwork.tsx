"use client";
import React, { useState } from "react";
import Image from "next/image";

export type VehicleCategory =
  | "adventure_motorcycle"
  | "classic_bullet"
  | "automatic_scooter"
  | "car_suv";

interface VehicleArtworkProps {
  type?: string;
  name?: string;
  alt?: string;
  className?: string;
  aspectRatio?: "video" | "square" | "wide";
  priority?: boolean;
}

/**
 * Resolves vehicle title/type to approved VANVAS vector artwork
 */
export function resolveVehicleArtwork(typeOrName?: string): {
  src: string;
  label: string;
  category: VehicleCategory;
} {
  const query = (typeOrName || "").toLowerCase();

  // 1. Himalayan Adventure Motorcycle
  if (
    query.includes("himalayan") ||
    query.includes("adventure") ||
    query.includes("450") ||
    query.includes("off-road") ||
    query.includes("offroad") ||
    query.includes("scrambler") ||
    query.includes("xpulse") ||
    query.includes("ktm") ||
    query.includes("gs") ||
    query.includes("rally")
  ) {
    return {
      src: "/images/vehicles/adventure_motorcycle.svg",
      label: "Himalayan Adventure Motorcycle",
      category: "adventure_motorcycle",
    };
  }

  // 2. Activa-style Automatic Scooter
  if (
    query.includes("activa") ||
    query.includes("scooter") ||
    query.includes("automatic") ||
    query.includes("jupiter") ||
    query.includes("access") ||
    query.includes("vespa") ||
    query.includes("moped") ||
    query.includes("ntorq") ||
    query.includes("ola") ||
    query.includes("ather")
  ) {
    return {
      src: "/images/vehicles/automatic_scooter.svg",
      label: "Automatic Hill Scooter",
      category: "automatic_scooter",
    };
  }

  // 3. Classic Royal Enfield / Bullet Roadster (Default motorcycle)
  return {
    src: "/images/vehicles/classic_bullet.svg",
    label: "Classic Himalayan Roadster",
    category: "classic_bullet",
  };
}

export const VehicleArtwork: React.FC<VehicleArtworkProps> = ({
  type,
  name,
  alt,
  className = "w-full h-full object-cover",
  aspectRatio = "video",
  priority = false,
}) => {
  const artwork = resolveVehicleArtwork(type || name);
  const [hasError, setHasError] = useState(false);

  const aspectClass =
    aspectRatio === "video"
      ? "aspect-[16/10]"
      : aspectRatio === "square"
      ? "aspect-square"
      : "aspect-[21/9]";

  return (
    <div
      className={`relative overflow-hidden bg-brand-sand-100 ${aspectClass} ${
        className.includes("rounded") ? "" : "rounded-xl"
      }`}
    >
      <Image
        src={hasError ? "/images/vehicles/adventure_motorcycle.svg" : artwork.src}
        alt={alt || artwork.label}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority={priority}
        className={`transition-transform duration-700 hover:scale-105 ${className}`}
        onError={() => setHasError(true)}
      />
      {/* Subtle Editorial Texture Badge */}
      <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-md bg-brand-forest-900/80 backdrop-blur-md text-brand-sand-100 text-[11px] font-sans tracking-wide uppercase font-medium shadow-sm border border-brand-sand-200/20">
        VANVAS Mobility • {artwork.label}
      </div>
    </div>
  );
};
