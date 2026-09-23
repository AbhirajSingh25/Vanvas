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
  containerClassName?: string;
  aspectRatio?: "video" | "square" | "wide" | "fill";
  priority?: boolean;
  showBadge?: boolean;
}

/**
 * Deterministically resolves vehicle type/name/model to the 6 approved VANVAS editorial mobility artworks.
 * Single source of truth across the entire platform.
 */
export function resolveVehicleArtwork(typeOrName?: string): {
  src: string;
  label: string;
  category: VehicleCategory;
} {
  const query = (typeOrName || "").toLowerCase().trim();

  // 1. Mountain Bike / Bicycle
  if (
    query.includes("mountain_bike") ||
    query.includes("mountain bike") ||
    query.includes("bicycle") ||
    query.includes("cycle") ||
    query.includes("mtb") ||
    (query.includes("bike") &&
      !query.includes("motor") &&
      !query.includes("bullet") &&
      !query.includes("enfield") &&
      !query.includes("himalayan") &&
      !query.includes("adventure") &&
      !query.includes("scooter") &&
      !query.includes("xpulse") &&
      !query.includes("ktm"))
  ) {
    return {
      src: "/images/vehicles/mountain_bike.jpg",
      label: "Mountain Trail Cycle",
      category: "mountain_bike",
    };
  }

  // 2. Electric Smart Scooter (EV)
  if (
    query.includes("electric_scooter") ||
    query.includes("electric scooter") ||
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
    query.includes("adventure_motorcycle") ||
    query.includes("adventure motorcycle") ||
    query.includes("himalayan") ||
    query.includes("adventure") ||
    query.includes("adv") ||
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
    query.includes("automatic_scooter") ||
    query.includes("automatic scooter") ||
    query.includes("activa") ||
    query.includes("scooter") ||
    query.includes("automatic") ||
    query.includes("jupiter") ||
    query.includes("access") ||
    query.includes("vespa") ||
    query.includes("moped") ||
    query.includes("ntorq") ||
    query.includes("fascino") ||
    query.includes("pleasure") ||
    query.includes("dio") ||
    query.includes("burgman")
  ) {
    return {
      src: "/images/vehicles/automatic_scooter.jpg",
      label: "Automatic Hill Scooter",
      category: "automatic_scooter",
    };
  }

  // 5. Classic Royal Enfield / Bullet Roadster
  if (
    query.includes("classic_bullet") ||
    query.includes("classic bullet") ||
    query.includes("bullet") ||
    query.includes("classic") ||
    query.includes("enfield") ||
    query.includes("royal enfield") ||
    query.includes("350") ||
    query.includes("motorcycle") ||
    query.includes("hunter") ||
    query.includes("meteor") ||
    query.includes("cruiser") ||
    query.includes("standard") ||
    query.includes("interceptor") ||
    query.includes("gt 650")
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
  containerClassName = "",
  aspectRatio = "fill",
  priority = false,
  showBadge = true,
}) => {
  const artwork = resolveVehicleArtwork(type || name);
  const [hasError, setHasError] = useState(false);

  // Authoritative mobility resolution:
  // If imageUrl is explicitly one of the approved /images/vehicles/*.jpg files, use it.
  // Otherwise, deterministically resolve from type/name to the 6 editorial artworks.
  let finalSrc = artwork.src;
  if (
    imageUrl &&
    imageUrl.startsWith("/images/vehicles/") &&
    imageUrl.endsWith(".jpg")
  ) {
    finalSrc = imageUrl;
  }
  if (hasError) {
    finalSrc = "/images/vehicles/universal_mobility.jpg";
  }

  const aspectClass =
    aspectRatio === "video"
      ? "aspect-[16/10]"
      : aspectRatio === "square"
      ? "aspect-square"
      : aspectRatio === "wide"
      ? "aspect-[21/9]"
      : "w-full h-full";

  return (
    <div
      className={`relative overflow-hidden bg-brand-sand-100 ${aspectClass} ${containerClassName}`}
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
      {showBadge && (
        <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-[#0F2924]/85 backdrop-blur-md text-[#FAF4E8] text-[10px] font-sans tracking-wide uppercase font-medium shadow-sm border border-white/10 pointer-events-none">
          VANVAS Mobility • {artwork.label}
        </div>
      )}
    </div>
  );
};
