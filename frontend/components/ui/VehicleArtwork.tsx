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

export interface MobilityContext {
  destination?: string;
  state?: string;
  region?: string;
  terrain?: string;
}

interface VehicleArtworkProps {
  type?: string;
  name?: string;
  destination?: string;
  context?: MobilityContext;
  imageUrl?: string | null;
  alt?: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: "video" | "square" | "wide" | "fill";
  priority?: boolean;
  showBadge?: boolean;
}

/**
 * Deterministically resolves vehicle type/name/model and destination context
 * to the appropriate regional VANVAS editorial mobility artworks with collision prevention.
 */
export function resolveVehicleArtwork(
  typeOrName?: string,
  destinationOrContext?: string | MobilityContext
): {
  src: string;
  label: string;
  category: VehicleCategory;
} {
  const query = (typeOrName || "").toLowerCase().trim();
  
  let destStr = "";
  let regionStr = "";
  let stateStr = "";
  
  if (typeof destinationOrContext === "string") {
    destStr = destinationOrContext.toLowerCase().trim();
  } else if (destinationOrContext && typeof destinationOrContext === "object") {
    destStr = (destinationOrContext.destination || "").toLowerCase().trim();
    regionStr = (destinationOrContext.region || "").toLowerCase().trim();
    stateStr = (destinationOrContext.state || "").toLowerCase().trim();
  }

  const isRajasthan =
    destStr.includes("jaipur") ||
    destStr.includes("udaipur") ||
    destStr.includes("jodhpur") ||
    destStr.includes("jaisalmer") ||
    stateStr.includes("rajasthan") ||
    regionStr.includes("rajasthan") ||
    regionStr.includes("mewar") ||
    regionStr.includes("rajputana") ||
    regionStr.includes("royal");

  const isCoastal =
    destStr.includes("goa") ||
    destStr.includes("gokarna") ||
    destStr.includes("munnar") ||
    destStr.includes("kochi") ||
    destStr.includes("kerala") ||
    destStr.includes("alleppey") ||
    destStr.includes("varkala") ||
    stateStr.includes("goa") ||
    stateStr.includes("kerala") ||
    regionStr.includes("coastal") ||
    regionStr.includes("ghats");

  const isUttarakhand =
    destStr.includes("rishikesh") ||
    destStr.includes("mussoorie") ||
    destStr.includes("dehradun") ||
    destStr.includes("tungnath") ||
    destStr.includes("chopta") ||
    destStr.includes("chandrashila") ||
    stateStr.includes("uttarakhand") ||
    regionStr.includes("garhwal");

  const isBicycle =
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
      !query.includes("ktm"));

  const isElectric =
    query.includes("electric_scooter") ||
    query.includes("electric scooter") ||
    query.includes("electric") ||
    query.includes("ev") ||
    query.includes("ather") ||
    query.includes("ola") ||
    query.includes("chetak") ||
    query.includes("iqube");

  const isAdventure =
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
    query.includes("rally");

  const isClassicBullet =
    query.includes("classic_bullet") ||
    query.includes("classic bullet") ||
    query.includes("bullet") ||
    query.includes("classic") ||
    query.includes("enfield") ||
    query.includes("royal enfield") ||
    query.includes("350") ||
    query.includes("cruiser") ||
    query.includes("standard") ||
    query.includes("interceptor") ||
    query.includes("gt 650");

  const isScooter =
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
    query.includes("burgman");

  // 1. Mountain Bike
  if (isBicycle) {
    return {
      src: "/images/vehicles/mountain_bike.jpg",
      label: "Mountain Trail Cycle",
      category: "mountain_bike",
    };
  }

  // 2. Rajasthan Visual Family
  if (isRajasthan) {
    if (isClassicBullet) {
      return {
        src: "/images/vehicles/rajasthan_classic_bullet.jpg",
        label: "Aravalli Classic Cruiser",
        category: "classic_bullet",
      };
    }
    if (isScooter || isElectric) {
      return {
        src: "/images/vehicles/rajasthan_urban_scooter.jpg",
        label: "Heritage City Scooter",
        category: "automatic_scooter",
      };
    }
    if (isAdventure) {
      return {
        src: "/images/vehicles/rajasthan_desert_bike.jpg",
        label: "Desert Highway Tourer",
        category: "adventure_motorcycle",
      };
    }
    return {
      src: "/images/vehicles/rajasthan_classic_bullet.jpg",
      label: "Rajputana Mobility Fleet",
      category: "classic_bullet",
    };
  }

  // 3. Coastal / Goa Visual Family
  if (isCoastal) {
    if (isElectric || isScooter) {
      return {
        src: "/images/vehicles/coastal_beach_scooter.jpg",
        label: "Coastal Palm Scooter",
        category: "automatic_scooter",
      };
    }
    if (isClassicBullet || isAdventure) {
      return {
        src: "/images/vehicles/coastal_heritage_bike.jpg",
        label: "Western Ghats Tourer",
        category: "adventure_motorcycle",
      };
    }
    return {
      src: "/images/vehicles/coastal_beach_scooter.jpg",
      label: "Coastal Mobility Fleet",
      category: "automatic_scooter",
    };
  }

  // 4. Uttarakhand Foothills Family
  if (isUttarakhand) {
    if (isAdventure || isClassicBullet) {
      return {
        src: "/images/vehicles/uttarakhand_forest_bike.jpg",
        label: "Garhwal Valley Tourer",
        category: "adventure_motorcycle",
      };
    }
    if (isScooter || isElectric) {
      return {
        src: "/images/vehicles/uttarakhand_valley_scooter.jpg",
        label: "Mountain Foothill Scooter",
        category: "automatic_scooter",
      };
    }
  }

  // 5. Himalayan / Alpine Defaults
  if (isElectric) {
    return {
      src: "/images/vehicles/electric_scooter.jpg",
      label: "Smart Mountain EV",
      category: "electric_scooter",
    };
  }
  if (isAdventure) {
    return {
      src: "/images/vehicles/adventure_motorcycle.jpg",
      label: "Himalayan Adventure Tourer",
      category: "adventure_motorcycle",
    };
  }
  if (isClassicBullet) {
    return {
      src: "/images/vehicles/classic_bullet.jpg",
      label: "Classic Himalayan Bullet",
      category: "classic_bullet",
    };
  }
  if (isScooter) {
    return {
      src: "/images/vehicles/automatic_scooter.jpg",
      label: "Automatic Hill Scooter",
      category: "automatic_scooter",
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
  destination,
  context,
  imageUrl,
  alt,
  className = "w-full h-full object-cover",
  containerClassName = "",
  aspectRatio = "fill",
  priority = false,
  showBadge = true,
}) => {
  const destCtx = context || (destination ? { destination } : undefined);
  const artwork = resolveVehicleArtwork(type || name, destCtx);
  const [hasError, setHasError] = useState(false);

  let finalSrc = artwork.src;
  if (
    imageUrl &&
    !imageUrl.startsWith("/images/vehicles/universal_mobility") &&
    !imageUrl.startsWith("/images/vehicles/adventure_motorcycle") &&
    !imageUrl.startsWith("/images/vehicles/classic_bullet") &&
    !imageUrl.startsWith("/images/vehicles/automatic_scooter") &&
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
