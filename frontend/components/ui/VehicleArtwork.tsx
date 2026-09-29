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

interface ArtworkResult {
  src: string;
  label: string;
  category: VehicleCategory;
}

/**
 * Authoritative Canonical Destination Vehicle Registry.
 * Explicit deterministic mapping for all 26 VANVAS canonical destinations.
 */
const DESTINATION_VEHICLE_REGISTRY: Record<
  string,
  {
    scooter?: ArtworkResult;
    motorcycle?: ArtworkResult;
    adventure?: ArtworkResult;
    bicycle?: ArtworkResult;
    car?: ArtworkResult;
    default: ArtworkResult;
  }
> = {
  // Agra
  "agra": {
    scooter: {
      src: "/images/vehicles/agra_taj_scooter.webp",
      label: "Ather 450X Taj Heritage EV",
      category: "automatic_scooter",
    },
    car: {
      src: "/images/vehicles/agra_heritage_car.webp",
      label: "Toyota Innova Crysta Heritage Cab",
      category: "car",
    },
    default: {
      src: "/images/vehicles/agra_taj_scooter.webp",
      label: "Ather 450X Taj Heritage EV",
      category: "automatic_scooter",
    },
  },
  // Alwar-Siliserh
  "alwar-siliserh": {
    scooter: {
      src: "/images/vehicles/alwar_siliserh_scooter.webp",
      label: "TVS Jupiter 125 Palace Cruiser",
      category: "automatic_scooter",
    },
    default: {
      src: "/images/vehicles/alwar_siliserh_scooter.webp",
      label: "TVS Jupiter 125 Palace Cruiser",
      category: "automatic_scooter",
    },
  },
  // Chandigarh
  "chandigarh": {
    scooter: {
      src: "/images/vehicles/chandigarh_boulevard_ev.webp",
      label: "Ather 450X Boulevard Cruiser EV",
      category: "automatic_scooter",
    },
    default: {
      src: "/images/vehicles/chandigarh_boulevard_ev.webp",
      label: "Ather 450X Boulevard Cruiser EV",
      category: "automatic_scooter",
    },
  },
  // Damdama-Sohna
  "damdama-sohna": {
    scooter: {
      src: "/images/vehicles/damdama_lake_scooter.webp",
      label: "Honda Activa 6G Lake Cruiser",
      category: "automatic_scooter",
    },
    default: {
      src: "/images/vehicles/damdama_lake_scooter.webp",
      label: "Honda Activa 6G Lake Cruiser",
      category: "automatic_scooter",
    },
  },
  // Dehradun
  "dehradun": {
    scooter: {
      src: "/images/vehicles/dehradun_rajpur_scooter.webp",
      label: "Honda Activa 6G Foothill Cruiser",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/dehradun_foothills_bike.webp",
      label: "Classic 350 Doon Valley Bullet",
      category: "classic_bullet",
    },
    default: {
      src: "/images/vehicles/dehradun_rajpur_scooter.webp",
      label: "Honda Activa 6G Foothill Cruiser",
      category: "automatic_scooter",
    },
  },
  // Dharamshala
  "dharamshala": {
    scooter: {
      src: "/images/vehicles/dharamshala_mcleod_scooter.webp",
      label: "Honda Activa 6G Cedar Ridge Edition",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/dharamshala_dhauladhar_bullet.webp",
      label: "Classic 350 Dhauladhar Cruiser",
      category: "classic_bullet",
    },
    default: {
      src: "/images/vehicles/dharamshala_mcleod_scooter.webp",
      label: "Honda Activa 6G Cedar Ridge Edition",
      category: "automatic_scooter",
    },
  },
  // Goa
  "goa": {
    scooter: {
      src: "/images/vehicles/goa_beach_scooter.webp",
      label: "Honda Activa 6G Coastal Edition",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/goa_coastal_bullet.webp",
      label: "Classic 350 Coastal Heritage Cruiser",
      category: "classic_bullet",
    },
    car: {
      src: "/images/vehicles/goa_coastal_car.webp",
      label: "Mahindra Thar 4x4 Convertible",
      category: "car",
    },
    default: {
      src: "/images/vehicles/goa_beach_scooter.webp",
      label: "Honda Activa 6G Coastal Edition",
      category: "automatic_scooter",
    },
  },
  // Jaipur
  "jaipur": {
    scooter: {
      src: "/images/vehicles/jaipur_hawa_mahal_scooter.webp",
      label: "TVS Jupiter 125 Pink City Edition",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/jaipur_pinkcity_bullet.webp",
      label: "Classic 350 Reborn Desert Chrome",
      category: "classic_bullet",
    },
    car: {
      src: "/images/vehicles/jaipur_amer_car.webp",
      label: "Toyota Innova Crysta Royal Cruiser",
      category: "car",
    },
    default: {
      src: "/images/vehicles/jaipur_hawa_mahal_scooter.webp",
      label: "TVS Jupiter 125 Pink City Edition",
      category: "automatic_scooter",
    },
  },
  // Jaisalmer
  "jaisalmer": {
    scooter: {
      src: "/images/vehicles/jaisalmer_fort_scooter.webp",
      label: "Honda Activa 6G Desert Edition",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/jaisalmer_thar_bullet.webp",
      label: "Classic 350 Thar Desert Cruiser",
      category: "classic_bullet",
    },
    default: {
      src: "/images/vehicles/jaisalmer_fort_scooter.webp",
      label: "Honda Activa 6G Desert Edition",
      category: "automatic_scooter",
    },
  },
  // Kainchi-Dham
  "kainchi-dham": {
    scooter: {
      src: "/images/vehicles/kainchi_bhowali_scooter.webp",
      label: "Honda Activa 125 Kumaon Edition",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/kainchi_kumaon_bike.webp",
      label: "Classic 350 Kumaon Hill Cruiser",
      category: "classic_bullet",
    },
    default: {
      src: "/images/vehicles/kainchi_bhowali_scooter.webp",
      label: "Honda Activa 125 Kumaon Edition",
      category: "automatic_scooter",
    },
  },
  // Kasol
  "kasol": {
    scooter: {
      src: "/images/vehicles/kasol_valley_scooter.webp",
      label: "TVS Jupiter 125 Parvati Edition",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/kasol_parvati_bullet.webp",
      label: "Classic 350 Parvati Mountain Cruiser",
      category: "classic_bullet",
    },
    default: {
      src: "/images/vehicles/kasol_valley_scooter.webp",
      label: "TVS Jupiter 125 Parvati Edition",
      category: "automatic_scooter",
    },
  },
  // Lansdowne
  "lansdowne": {
    scooter: {
      src: "/images/vehicles/lansdowne_ridge_scooter.webp",
      label: "TVS Jupiter 125 Oak Ridge Edition",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/lansdowne_pine_bullet.webp",
      label: "Classic 350 Pine Ridge Bullet",
      category: "classic_bullet",
    },
    default: {
      src: "/images/vehicles/lansdowne_ridge_scooter.webp",
      label: "TVS Jupiter 125 Oak Ridge Edition",
      category: "automatic_scooter",
    },
  },
  // Leh
  "leh": {
    motorcycle: {
      src: "/images/vehicles/leh_palace_bullet.webp",
      label: "Classic 350 Leh Palace Cruiser",
      category: "classic_bullet",
    },
    adventure: {
      src: "/images/vehicles/leh_high_altitude_motorcycle.webp",
      label: "Royal Enfield Himalayan 450 High-Pass Tourer",
      category: "adventure_motorcycle",
    },
    default: {
      src: "/images/vehicles/leh_high_altitude_motorcycle.webp",
      label: "Royal Enfield Himalayan 450 High-Pass Tourer",
      category: "automatic_scooter",
    },
  },
  // Manali
  "manali": {
    scooter: {
      src: "/images/vehicles/manali_beas_scooter.webp",
      label: "Honda Activa 6G Beas Valley Edition",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/manali_solang_bullet.webp",
      label: "Royal Enfield Classic 350 Solang Tourer",
      category: "classic_bullet",
    },
    adventure: {
      src: "/images/vehicles/manali_himalayan_adv_bike.webp",
      label: "Royal Enfield Himalayan 450 Adventure",
      category: "adventure_motorcycle",
    },
    default: {
      src: "/images/vehicles/manali_beas_scooter.webp",
      label: "Honda Activa 6G Beas Valley Edition",
      category: "automatic_scooter",
    },
  },
  // Mathura-Vrindavan
  "mathura-vrindavan": {
    scooter: {
      src: "/images/vehicles/vrindavan_braj_scooter.webp",
      label: "Ather 450X Braj Dham EV",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/mathura_heritage_bullet.webp",
      label: "Classic 350 Braj Heritage Bullet",
      category: "classic_bullet",
    },
    default: {
      src: "/images/vehicles/vrindavan_braj_scooter.webp",
      label: "Ather 450X Braj Dham EV",
      category: "automatic_scooter",
    },
  },
  // Morni-Hills
  "morni-hills": {
    scooter: {
      src: "/images/vehicles/morni_hills_scooter.webp",
      label: "Honda Activa 6G Shivalik Edition",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/morni_shivalik_bike.webp",
      label: "Classic 350 Shivalik Cruiser",
      category: "classic_bullet",
    },
    default: {
      src: "/images/vehicles/morni_hills_scooter.webp",
      label: "Honda Activa 6G Shivalik Edition",
      category: "automatic_scooter",
    },
  },
  // Munnar
  "munnar": {
    scooter: {
      src: "/images/vehicles/kerala_tea_plantation_scooter.webp",
      label: "TVS Ntorq 125 Tea Plantation Cruiser",
      category: "automatic_scooter",
    },
    adventure: {
      src: "/images/vehicles/kerala_western_ghats_bike.webp",
      label: "Royal Enfield Himalayan 450 Misty Ghats Tourer",
      category: "adventure_motorcycle",
    },
    default: {
      src: "/images/vehicles/kerala_tea_plantation_scooter.webp",
      label: "TVS Ntorq 125 Tea Plantation Cruiser",
      category: "automatic_scooter",
    },
  },
  // Murthal
  "murthal": {
    motorcycle: {
      src: "/images/vehicles/murthal_gt_road_bullet.webp",
      label: "Classic 350 GT Road Highway Cruiser",
      category: "classic_bullet",
    },
    default: {
      src: "/images/vehicles/murthal_gt_road_bullet.webp",
      label: "Classic 350 GT Road Highway Cruiser",
      category: "automatic_scooter",
    },
  },
  // Mussoorie
  "mussoorie": {
    scooter: {
      src: "/images/vehicles/mussoorie_landour_scooter.webp",
      label: "Honda Activa 125 Hill Edition",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/mussoorie_landour_bullet.webp",
      label: "Classic 350 Hill Climber",
      category: "classic_bullet",
    },
    car: {
      src: "/images/vehicles/mussoorie_hill_car.webp",
      label: "Toyota Innova Hill Express",
      category: "car",
    },
    default: {
      src: "/images/vehicles/mussoorie_landour_scooter.webp",
      label: "Honda Activa 125 Hill Edition",
      category: "automatic_scooter",
    },
  },
  // Neemrana
  "neemrana": {
    motorcycle: {
      src: "/images/vehicles/neemrana_fort_bullet.webp",
      label: "Classic 350 Aravalli Fort Tourer",
      category: "classic_bullet",
    },
    car: {
      src: "/images/vehicles/neemrana_highway_car.webp",
      label: "Mahindra Scorpio-N Highway Cruiser",
      category: "car",
    },
    default: {
      src: "/images/vehicles/neemrana_fort_bullet.webp",
      label: "Classic 350 Aravalli Fort Tourer",
      category: "automatic_scooter",
    },
  },
  // Rishikesh
  "rishikesh": {
    scooter: {
      src: "/images/vehicles/rishikesh_tapovan_scooter.webp",
      label: "Honda Activa 6G Riverfront Edition",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/rishikesh_ganga_mtb.webp",
      label: "Trek Marlin Mountain Bike MTB",
      category: "classic_bullet",
    },
    default: {
      src: "/images/vehicles/rishikesh_tapovan_scooter.webp",
      label: "Honda Activa 6G Riverfront Edition",
      category: "automatic_scooter",
    },
  },
  // Sariska-Bhangarh
  "sariska-bhangarh": {
    adventure: {
      src: "/images/vehicles/sariska_safari_adv_bike.webp",
      label: "Royal Enfield Himalayan 450 Safari Tourer",
      category: "adventure_motorcycle",
    },
    default: {
      src: "/images/vehicles/sariska_safari_adv_bike.webp",
      label: "Royal Enfield Himalayan 450 Safari Tourer",
      category: "automatic_scooter",
    },
  },
  // Spiti
  "spiti": {
    adventure: {
      src: "/images/vehicles/spiti_arid_adventure_bike.webp",
      label: "Royal Enfield Himalayan 450 High Pass Tourer",
      category: "adventure_motorcycle",
    },
    default: {
      src: "/images/vehicles/spiti_arid_adventure_bike.webp",
      label: "Royal Enfield Himalayan 450 High Pass Tourer",
      category: "automatic_scooter",
    },
  },
  // Tungnath-Chandrashila
  "tungnath-chandrashila": {
    scooter: {
      src: "/images/vehicles/chopta_foothill_scooter.webp",
      label: "TVS Jupiter 125 Hill Climber",
      category: "automatic_scooter",
    },
    adventure: {
      src: "/images/vehicles/chopta_tungnath_adv_bike.webp",
      label: "Royal Enfield Himalayan 450 Alpine Explorer",
      category: "adventure_motorcycle",
    },
    default: {
      src: "/images/vehicles/chopta_tungnath_adv_bike.webp",
      label: "Royal Enfield Himalayan 450 Alpine Explorer",
      category: "automatic_scooter",
    },
  },
  // Udaipur
  "udaipur": {
    scooter: {
      src: "/images/vehicles/udaipur_pichola_scooter.webp",
      label: "TVS Jupiter 125 Classic Lake Edition",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/udaipur_oldcity_bullet.webp",
      label: "Classic 350 Old City Lake Cruiser",
      category: "classic_bullet",
    },
    car: {
      src: "/images/vehicles/udaipur_lakeside_car.webp",
      label: "Maruti Ertiga Lakeside Cruiser",
      category: "car",
    },
    default: {
      src: "/images/vehicles/udaipur_pichola_scooter.webp",
      label: "TVS Jupiter 125 Classic Lake Edition",
      category: "automatic_scooter",
    },
  },
  // Varanasi
  "varanasi": {
    scooter: {
      src: "/images/vehicles/varanasi_oldcity_scooter.webp",
      label: "Suzuki Access 125 Ghat Approach",
      category: "automatic_scooter",
    },
    default: {
      src: "/images/vehicles/varanasi_ghat_approach_scooter.webp",
      label: "Ather 450X Ghats Cruiser",
      category: "automatic_scooter",
    },
  },
};

/**
 * Known generic / fallback asset filenames that must NEVER override
 * an exact destination-specific artwork.
 */
const GENERIC_VEHICLE_PATTERNS = [
  "automatic_scooter.jpg",
  "universal_mobility.jpg",
  "classic_bullet.jpg",
  "adventure_motorcycle.jpg",
  "mountain_bike.jpg",
  "electric_scooter.jpg",
  "himachal_pine_forest_bike.jpg",
  "himachal_valley_scooter.jpg",
  "uttarakhand_forest_bike.jpg",
  "uttarakhand_valley_scooter.jpg",
  "rajasthan_classic_bullet.jpg",
  "rajasthan_desert_bike.jpg",
  "rajasthan_urban_scooter.jpg",
  "coastal_beach_scooter.jpg",
  "coastal_heritage_bike.jpg",
  "coastal_palm_scooter.jpg",
  "south_tea_scooter.jpg",
  "generic",
  "unsplash.com",
];

export function isGenericArtwork(url?: string | null): boolean {
  if (!url || typeof url !== "string") return true;
  const lower = url.toLowerCase();
  return GENERIC_VEHICLE_PATTERNS.some((p) => lower.includes(p));
}

/**
 * Normalizes destination string into canonical key.
 */
function normalizeDestinationKey(dest?: string): string {
  if (!dest) return "";
  const s = dest.toLowerCase().trim();
  
  if (s.includes("mussoorie") || s.includes("landour")) return "mussoorie";
  if (s.includes("goa") || s.includes("gokarna")) return "goa";
  if (s.includes("jaipur") || s.includes("pink city") || s.includes("amer")) return "jaipur";
  if (s.includes("udaipur") || s.includes("pichola") || s.includes("mewar")) return "udaipur";
  if (s.includes("varanasi") || s.includes("kashi") || s.includes("banaras") || s.includes("benaras")) return "varanasi";
  if (s.includes("leh") || s.includes("ladakh")) return "leh";
  if (s.includes("spiti") || s.includes("kaza")) return "spiti";
  if (s.includes("munnar") || s.includes("kerala")) return "munnar";
  if (s.includes("jaisalmer") || s.includes("thar") || s.includes("sam dunes")) return "jaisalmer";
  if (s.includes("rishikesh") || s.includes("tapovan")) return "rishikesh";
  if (s.includes("manali") || s.includes("solang")) return "manali";
  if (s.includes("dharamshala") || s.includes("mcleod") || s.includes("bhagsu") || s.includes("dharamsala")) return "dharamshala";
  if (s.includes("kasol") || s.includes("parvati")) return "kasol";
  if (s.includes("dehradun") || s.includes("rajpur")) return "dehradun";
  if (s.includes("tungnath") || s.includes("chopta") || s.includes("chandrashila")) return "tungnath-chandrashila";
  if (s.includes("kainchi") || s.includes("bhowali") || s.includes("neem karoli")) return "kainchi-dham";
  if (s.includes("agra") || s.includes("taj")) return "agra";
  if (s.includes("mathura") || s.includes("vrindavan") || s.includes("braj")) return "mathura-vrindavan";
  if (s.includes("neemrana")) return "neemrana";
  if (s.includes("damdama") || s.includes("sohna")) return "damdama-sohna";
  if (s.includes("alwar") || s.includes("siliserh")) return "alwar-siliserh";
  if (s.includes("sariska") || s.includes("bhangarh")) return "sariska-bhangarh";
  if (s.includes("chandigarh")) return "chandigarh";
  if (s.includes("morni")) return "morni-hills";
  if (s.includes("lansdowne")) return "lansdowne";
  if (s.includes("murthal")) return "murthal";

  return s.replace(/[^a-z0-9]/g, "-");
}

/**
 * Deterministically resolves vehicle type/name/model and destination context
 * to the appropriate regional VANVAS editorial mobility artworks.
 */
export function resolveVehicleArtwork(
  typeOrName?: string,
  destinationOrContext?: string | MobilityContext,
  secondaryName?: string
): ArtworkResult {
  const combined = `${typeOrName || ""} ${secondaryName || ""}`.toLowerCase().trim();
  
  let destStr = "";
  if (typeof destinationOrContext === "string") {
    destStr = destinationOrContext;
  } else if (destinationOrContext && typeof destinationOrContext === "object") {
    destStr = destinationOrContext.destination || destinationOrContext.region || destinationOrContext.state || "";
  }

  const destKey = normalizeDestinationKey(destStr);
  const destFleet = DESTINATION_VEHICLE_REGISTRY[destKey];

  // Specific vehicle category detection
  const isElectric =
    combined.includes("electric_scooter") ||
    combined.includes("electric scooter") ||
    combined.includes("electric") ||
    combined.includes("ev") ||
    combined.includes("ather") ||
    combined.includes("ola") ||
    combined.includes("chetak") ||
    combined.includes("iqube");

  const isScooter =
    isElectric ||
    combined.includes("automatic_scooter") ||
    combined.includes("automatic scooter") ||
    combined.includes("activa") ||
    combined.includes("scooter") ||
    combined.includes("automatic") ||
    combined.includes("jupiter") ||
    combined.includes("access") ||
    combined.includes("vespa") ||
    combined.includes("moped") ||
    combined.includes("ntorq") ||
    combined.includes("fascino") ||
    combined.includes("pleasure") ||
    combined.includes("dio") ||
    combined.includes("burgman") ||
    combined.includes("destini") ||
    combined.includes("rayzr") ||
    combined.includes("aerox") ||
    combined.includes("scooty");

  const isAdventure =
    combined.includes("adventure_motorcycle") ||
    combined.includes("adventure motorcycle") ||
    combined.includes("himalayan") ||
    combined.includes("adventure") ||
    combined.includes("adv") ||
    combined.includes("450") ||
    combined.includes("411") ||
    combined.includes("off-road") ||
    combined.includes("offroad") ||
    combined.includes("scrambler") ||
    combined.includes("xpulse") ||
    combined.includes("ktm") ||
    combined.includes("gs") ||
    combined.includes("rally");

  const isClassicBullet =
    combined.includes("classic_bullet") ||
    combined.includes("classic bullet") ||
    combined.includes("bullet") ||
    combined.includes("classic") ||
    combined.includes("enfield") ||
    combined.includes("royal enfield") ||
    combined.includes("350") ||
    combined.includes("cruiser") ||
    combined.includes("standard") ||
    combined.includes("interceptor") ||
    combined.includes("hunter") ||
    combined.includes("meteor") ||
    combined.includes("gt 650") ||
    combined.includes("motorcycle") ||
    combined.includes("bike") ||
    combined.includes("fz") ||
    combined.includes("pulsar") ||
    combined.includes("apache") ||
    combined.includes("avenger");

  const isCar =
    !isClassicBullet &&
    !isAdventure &&
    (combined.includes("car") ||
      combined.includes("self-drive") ||
      combined.includes("self drive") ||
      combined.includes("suv") ||
      combined.includes("sedan") ||
      combined.includes("hatchback") ||
      combined.includes("mahindra thar") ||
      combined.includes("thar 4x4") ||
      combined.includes("creta") ||
      combined.includes("swift") ||
      combined.includes("baleno") ||
      combined.includes("i20") ||
      combined.includes("scorpio") ||
      combined.includes("innova") ||
      combined.includes("ertiga") ||
      combined.includes("seltos"));

  const isBicycle =
    combined.includes("mountain_bike") ||
    combined.includes("mountain bike") ||
    combined.includes("bicycle") ||
    combined.includes("mtb") ||
    combined.includes("pedal") ||
    (combined.includes("cycle") && !combined.includes("motorcycle") && !combined.includes("motor cycle"));

  // 1. Destination-Matched Explicit Resolution (Absolute Destination Priority)
  if (destFleet) {
    if (isScooter && destFleet.scooter) return destFleet.scooter;
    if (isAdventure && destFleet.adventure) return destFleet.adventure;
    if (isBicycle && destFleet.bicycle) return destFleet.bicycle;
    if (isClassicBullet && destFleet.motorcycle) return destFleet.motorcycle;
    if (isCar && destFleet.car) return destFleet.car;
    return destFleet.default;
  }

  // 2. Regional / General Defaults only when destination is unknown
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
  if (isScooter) {
    return {
      src: "/images/vehicles/automatic_scooter.jpg",
      label: "Automatic Hill Scooter",
      category: "automatic_scooter",
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
  const artwork = resolveVehicleArtwork(type, destCtx, name);
  const [hasError, setHasError] = useState(false);

  // Deterministic destination-first artwork:
  // Artwork resolved for the destination has absolute priority over generic/regional fallbacks.
  let finalSrc = artwork.src;
  
  // Custom explicit destination-specific imageUrl from backend only if not a generic fallback
  if (
    imageUrl &&
    typeof imageUrl === "string" &&
    imageUrl.length > 0 &&
    !isGenericArtwork(imageUrl)
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

