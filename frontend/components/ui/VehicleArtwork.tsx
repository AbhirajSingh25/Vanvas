"use client";
import React, { useState } from "react";
import Image from "next/image";

export type VehicleCategory =
  | "adventure_motorcycle"
  | "classic_bullet"
  | "automatic_scooter"
  | "electric_scooter"
  | "mountain_bike"
  | "universal_mobility";

interface VehicleArtworkProps {
  type?: string;
  name?: string;
  imageUrl?: string | null;
  alt?: string;
  className?: string;
  aspectRatio?: "video" | "square" | "wide";
  priority?: boolean;
}

/**
 * Resolves vehicle title/type to approved VANVAS editorial mobility artwork
 */
export function resolveVehicleArtwork(typeOrName?: string): {
  src: string;
  label: string;
  category: VehicleCategory;
} {
  const query = (typeOrName || "").toLowerCase();

  // 1. Mountain Bike / Bicycle
  if (
    query.includes("bicycle") ||
    query.includes("cycle") ||
    query.includes("mtb") ||
    query.includes("mountain bike") ||
    (query.includes("bike") && !query.includes("motor") && !query.includes("bullet") && !query.includes("enfield") && !query.includes("himalayan"))
  ) {
    return {
      src: "/images/vehicles/mountain_bike.jpg",
      label: "Mountain Trail Cycle",
      category: "mountain_bike",
    };
  }

  // 2. Electric Smart Scooter (EV)
  if (
    query.includes("electric") ||
    query.includes("ev") ||
    query.includes("ather") ||
    query.includes("ola") ||
    query.includes("chetak") ||
    query.includes("iqube")
  ) {
    return {
      src: "/images/vehicles/electric_scooter.jpg",
      label: "Smart Electric Scooter",
      category: "electric_scooter",
    };
  }

  // 3. Himalayan Adventure Motorcycle
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
      src: "/images/vehicles/adventure_motorcycle.jpg",
      label: "Himalayan Adventure Tourer",
      category: "adventure_motorcycle",
    };
  }

  // 4. Activa-style Automatic Hill Scooter
  if (
    query.includes("activa") ||
    query.includes("scooter") ||
    query.includes("automatic") ||
    query.includes("jupiter") ||
    query.includes("access") ||
    query.includes("vespa") ||
    query.includes("moped") ||
    query.includes("ntorq")
  ) {
    return {
      src: "/images/vehicles/automatic_scooter.jpg",
      label: "Automatic Hill Scooter",
      category: "automatic_scooter",
    };
  }

  // 5. Classic Royal Enfield / Bullet Roadster
  if (
    query.includes("bullet") ||
    query.includes("classic") ||
    query.includes("enfield") ||
    query.includes("350") ||
    query.includes("motorcycle") ||
    query.includes("hunter") ||
    query.includes("meteor")
  ) {
    return {
      src: "/images/vehicles/classic_bullet.jpg",
      label: "Classic Himalayan Bullet",
      category: "classic_bullet",
    };
  }

  // 6. Universal Valley Mobility
  return {
    src: "/images/vehicles/universal_mobility.jpg",
    label: "Valley Mobility Fleet",
    category: "universal_mobility",
  };
}

export const VehicleArtwork: React.FC<VehicleArtworkProps> = ({
  type,
  name,
  imageUrl,
  alt,
  className = "w-full h-full object-cover",
  aspectRatio = "video",
  priority = false,
}) => {
  const artwork = resolveVehicleArtwork(type || name);
  const [hasError, setHasError] = useState(false);

  const finalSrc = (!hasError && imageUrl && (imageUrl.startsWith("http") || imageUrl.startsWith("/")))
    ? imageUrl
    : (hasError ? "/images/vehicles/universal_mobility.jpg" : artwork.src);

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
        src={finalSrc}
        alt={alt || artwork.label}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority={priority}
        className={`transition-transform duration-700 hover:scale-105 ${className}`}
        onError={() => setHasError(true)}
      />
      {/* Subtle Editorial Texture Badge */}
      <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-md bg-[#0F2924]/85 backdrop-blur-md text-[#FAF4E8] text-[11px] font-sans tracking-wide uppercase font-medium shadow-sm border border-white/10">
        VANVAS Mobility • {artwork.label}
      </div>
    </div>
  );
};

