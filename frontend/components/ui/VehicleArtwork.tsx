"use client";
import React, { useState } from "react";
import Image from "next/image";

export type VehicleCategory =
  | "adventure_motorcycle"
  | "classic_bullet"
  | "automatic_scooter"
  | "electric_scooter"
  | "mountain_bike"
  | "car"
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

  const isVaranasi =
    destStr.includes("varanasi") ||
    destStr.includes("kashi") ||
    destStr.includes("banaras") ||
    regionStr.includes("varanasi");

  const isGoa =
    destStr.includes("goa") ||
    destStr.includes("gokarna") ||
    stateStr.includes("goa");

  const isJaipur =
    destStr.includes("jaipur") ||
    destStr.includes("pink city") ||
    destStr.includes("amer");

  const isUdaipur =
    destStr.includes("udaipur") ||
    destStr.includes("pichola") ||
    destStr.includes("mewar");

  const isJaisalmer =
    destStr.includes("jaisalmer") ||
    destStr.includes("thar") ||
    destStr.includes("sam dunes");

  const isRajasthan =
    isJaipur ||
    isUdaipur ||
    isJaisalmer ||
    destStr.includes("jodhpur") ||
    stateStr.includes("rajasthan") ||
    regionStr.includes("rajasthan") ||
    regionStr.includes("rajputana") ||
    regionStr.includes("royal");

  const isKerala =
    destStr.includes("munnar") ||
    destStr.includes("kochi") ||
    destStr.includes("kerala") ||
    destStr.includes("alleppey") ||
    destStr.includes("wayanad") ||
    destStr.includes("varkala") ||
    stateStr.includes("kerala");

  const isLeh =
    destStr.includes("leh") ||
    destStr.includes("ladakh") ||
    regionStr.includes("ladakh");

  const isSpiti =
    destStr.includes("spiti") ||
    destStr.includes("kaza") ||
    regionStr.includes("spiti");

  const isHimachal =
    destStr.includes("manali") ||
    destStr.includes("kasol") ||
    destStr.includes("shimla") ||
    destStr.includes("dharamshala") ||
    destStr.includes("mcleod") ||
    destStr.includes("bhagsu") ||
    destStr.includes("bir") ||
    destStr.includes("jibhi") ||
    stateStr.includes("himachal");

  const isUttarakhand =
    destStr.includes("rishikesh") ||
    destStr.includes("mussoorie") ||
    destStr.includes("landour") ||
    destStr.includes("dehradun") ||
    destStr.includes("tungnath") ||
    destStr.includes("chopta") ||
    destStr.includes("chandrashila") ||
    stateStr.includes("uttarakhand") ||
    regionStr.includes("garhwal");

  const isCar =
    query.includes("car") ||
    query.includes("self-drive") ||
    query.includes("self drive") ||
    query.includes("suv") ||
    query.includes("sedan") ||
    query.includes("hatchback") ||
    query.includes("thar") ||
    query.includes("creta") ||
    query.includes("swift") ||
    query.includes("baleno") ||
    query.includes("i20") ||
    query.includes("scorpio") ||
    query.includes("seltos");

  const isBicycle =
    query.includes("mountain_bike") ||
    query.includes("mountain bike") ||
    query.includes("bicycle") ||
    query.includes("mtb") ||
    query.includes("pedal") ||
    (query.includes("cycle") && !query.includes("motorcycle") && !query.includes("motor cycle"));

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
    query.includes("411") ||
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
    query.includes("hunter") ||
    query.includes("meteor") ||
    query.includes("gt 650") ||
    query.includes("motorcycle") ||
    query.includes("bike") ||
    query.includes("fz") ||
    query.includes("pulsar") ||
    query.includes("apache") ||
    query.includes("avenger");

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
    query.includes("burgman") ||
    query.includes("destini") ||
    query.includes("rayzr") ||
    query.includes("aerox") ||
    query.includes("scooty");

  // 1. Goa Coastal & Heritage
  if (isGoa) {
    if (isCar) {
      return {
        src: "/images/vehicles/goa_coastal_car.jpg",
        label: "Goa Coastal Self-Drive Car",
        category: "car",
      };
    }
    if (isBicycle) {
      return {
        src: "/images/vehicles/mountain_bike.jpg",
        label: "Coastal Trail Bicycle",
        category: "mountain_bike",
      };
    }
    if (isElectric || isScooter) {
      return {
        src: "/images/vehicles/goa_beach_scooter.jpg",
        label: "Anjuna Beach Palm Scooter",
        category: "automatic_scooter",
      };
    }
    if (isClassicBullet || isAdventure) {
      return {
        src: "/images/vehicles/goa_coastal_bullet.jpg",
        label: "Goa Coastal Heritage Cruiser",
        category: "classic_bullet",
      };
    }
    return {
      src: "/images/vehicles/goa_beach_scooter.jpg",
      label: "Goan Coastal Mobility",
      category: "automatic_scooter",
    };
  }

  // 2. Jaipur Pink City & Amer
  if (isJaipur) {
    if (isCar) {
      return {
        src: "/images/vehicles/jaipur_amer_car.jpg",
        label: "Pink City Amer Heritage Car",
        category: "car",
      };
    }
    if (isScooter || isElectric) {
      return {
        src: "/images/vehicles/jaipur_hawa_mahal_scooter.jpg",
        label: "Hawa Mahal Pink City Scooter",
        category: "automatic_scooter",
      };
    }
    if (isClassicBullet || isAdventure) {
      return {
        src: "/images/vehicles/jaipur_pinkcity_bullet.jpg",
        label: "Pink City Bazaar Cruiser",
        category: "classic_bullet",
      };
    }
    return {
      src: "/images/vehicles/jaipur_hawa_mahal_scooter.jpg",
      label: "Jaipur Heritage Mobility",
      category: "automatic_scooter",
    };
  }

  // 3. Udaipur Lake Pichola & Old City
  if (isUdaipur) {
    if (isCar) {
      return {
        src: "/images/vehicles/udaipur_lakeside_car.jpg",
        label: "Lake Pichola Aravalli Car",
        category: "car",
      };
    }
    if (isScooter || isElectric) {
      return {
        src: "/images/vehicles/udaipur_pichola_scooter.jpg",
        label: "Lake Pichola Waterfront Scooter",
        category: "automatic_scooter",
      };
    }
    if (isClassicBullet || isAdventure) {
      return {
        src: "/images/vehicles/udaipur_oldcity_bullet.jpg",
        label: "Old City Mewar Heritage Cruiser",
        category: "classic_bullet",
      };
    }
    return {
      src: "/images/vehicles/udaipur_pichola_scooter.jpg",
      label: "Udaipur Lakeside Mobility",
      category: "automatic_scooter",
    };
  }

  // 4. Jaisalmer Thar Desert & Fort
  if (isJaisalmer) {
    if (isAdventure) {
      return {
        src: "/images/vehicles/rajasthan_desert_bike.jpg",
        label: "Thar Desert Safari Tourer",
        category: "adventure_motorcycle",
      };
    }
    if (isClassicBullet) {
      return {
        src: "/images/vehicles/rajasthan_classic_bullet.jpg",
        label: "Thar Sandstone Cruiser",
        category: "classic_bullet",
      };
    }
    if (isScooter || isElectric) {
      return {
        src: "/images/vehicles/rajasthan_urban_scooter.jpg",
        label: "Golden Fort City Scooter",
        category: "automatic_scooter",
      };
    }
    return {
      src: "/images/vehicles/rajasthan_classic_bullet.jpg",
      label: "Jaisalmer Desert Mobility",
      category: "classic_bullet",
    };
  }

  // 5. General Rajasthan
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
      src: "/images/vehicles/rajasthan_urban_scooter.jpg",
      label: "Rajputana Mobility Fleet",
      category: "automatic_scooter",
    };
  }

  // 6. Varanasi Old City & Riverfront Mobility
  if (isVaranasi) {
    if (isCar) {
      return {
        src: "/images/vehicles/varanasi_ghat_car.jpg",
        label: "Kashi Ghat Approach Car",
        category: "car",
      };
    }
    if (isBicycle) {
      return {
        src: "/images/vehicles/varanasi_city_cycle.jpg",
        label: "Ghat Approach Heritage Cycle",
        category: "mountain_bike",
      };
    }
    if (isClassicBullet || isAdventure) {
      return {
        src: "/images/vehicles/varanasi_bhu_bullet.jpg",
        label: "BHU Campus Heritage Cruiser",
        category: "classic_bullet",
      };
    }
    if (isScooter || isElectric) {
      return {
        src: "/images/vehicles/varanasi_assi_scooter.jpg",
        label: "Assi Ghat Morning Scooter",
        category: "automatic_scooter",
      };
    }
    return {
      src: "/images/vehicles/varanasi_oldcity_scooter.jpg",
      label: "Varanasi Ghat Approach Fleet",
      category: "automatic_scooter",
    };
  }

  // 7. Leh & Ladakh High-Altitude
  if (isLeh) {
    if (isAdventure) {
      return {
        src: "/images/vehicles/leh_high_altitude_motorcycle.jpg",
        label: "Ladakh High-Altitude Adventure Tourer",
        category: "adventure_motorcycle",
      };
    }
    return {
      src: "/images/vehicles/leh_palace_bullet.jpg",
      label: "Leh Palace High-Altitude Bullet",
      category: "classic_bullet",
    };
  }

  // 8. Spiti Valley / Kaza Arid High-Altitude
  if (isSpiti) {
    return {
      src: "/images/vehicles/spiti_arid_adventure_bike.jpg",
      label: "Spiti Valley Arid Tourer",
      category: "adventure_motorcycle",
    };
  }

  // 9. Kerala & Munnar Tea Plantation & Western Ghats
  if (isKerala) {
    if (isBicycle) {
      return {
        src: "/images/vehicles/mountain_bike.jpg",
        label: "Tea Estate Trail Cycle",
        category: "mountain_bike",
      };
    }
    if (isScooter || isElectric) {
      return {
        src: "/images/vehicles/kerala_tea_plantation_scooter.jpg",
        label: "Tea Estate Cruiser Scooter",
        category: "automatic_scooter",
      };
    }
    if (isClassicBullet || isAdventure) {
      return {
        src: "/images/vehicles/kerala_western_ghats_bike.jpg",
        label: "Western Ghats Misty Tourer",
        category: "adventure_motorcycle",
      };
    }
    return {
      src: "/images/vehicles/kerala_tea_plantation_scooter.jpg",
      label: "Munnar Plantation Mobility",
      category: "automatic_scooter",
    };
  }

  // 10. Himachal Valleys (Manali, Kasol, Dharamshala, etc.)
  if (isHimachal) {
    if (isBicycle) {
      return {
        src: "/images/vehicles/mountain_bike.jpg",
        label: "Mountain Downhill Trail Cycle",
        category: "mountain_bike",
      };
    }
    if (isAdventure || isClassicBullet) {
      return {
        src: "/images/vehicles/himachal_pine_forest_bike.jpg",
        label: "Himachal Pine Pass Tourer",
        category: "adventure_motorcycle",
      };
    }
    if (isScooter || isElectric) {
      return {
        src: "/images/vehicles/himachal_valley_scooter.jpg",
        label: "Himachal Valley Scooter",
        category: "automatic_scooter",
      };
    }
    return {
      src: "/images/vehicles/himachal_valley_scooter.jpg",
      label: "Himachal Valley Two-Wheeler",
      category: "automatic_scooter",
    };
  }

  // 11. Uttarakhand Foothills (Rishikesh, Mussoorie, Dehradun, etc.)
  if (isUttarakhand) {
    if (isBicycle) {
      return {
        src: "/images/vehicles/mountain_bike.jpg",
        label: "Garhwal Foothill Trail Cycle",
        category: "mountain_bike",
      };
    }
    if (isAdventure || isClassicBullet) {
      return {
        src: "/images/vehicles/uttarakhand_forest_bike.jpg",
        label: "Tapovan Foothill Cruiser",
        category: "adventure_motorcycle",
      };
    }
    if (isScooter || isElectric) {
      return {
        src: "/images/vehicles/uttarakhand_valley_scooter.jpg",
        label: "Ganga Foothill Scooter",
        category: "automatic_scooter",
      };
    }
    return {
      src: "/images/vehicles/uttarakhand_valley_scooter.jpg",
      label: "Uttarakhand Foothill Two-Wheeler",
      category: "automatic_scooter",
    };
  }

  // 12. General Defaults
  if (isBicycle) {
    return {
      src: "/images/vehicles/mountain_bike.jpg",
      label: "Mountain Trail Cycle",
      category: "mountain_bike",
    };
  }
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

  return {
    src: "/images/vehicles/automatic_scooter.jpg",
    label: "Valley Mobility Fleet",
    category: "automatic_scooter",
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
