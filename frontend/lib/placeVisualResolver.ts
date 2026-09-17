/**
 * VANVAS Place-Level Visual Intelligence & Artwork Resolver
 * 
 * Implements deterministic place-specific artwork resolution, multi-tier fallback,
 * and transparent data source classification.
 * 
 * Hierarchy:
 * 1. EXACT PLACE ARTWORK (Dedicated landmark artwork depicting the specific place)
 * 2. DESTINATION + CATEGORY ARTWORK (Dedicated destination category art, e.g. Mussoorie Cafe, Manali Trail)
 * 3. DESTINATION ARTWORK (Destination Hero/Illustration)
 * 4. REGIONAL ARTWORK (Himalayan, Coastal, Desert, River Ghat, Valley)
 * 5. UNIVERSAL FALLBACK
 */

export interface PlaceArtworkResult {
  artworkKey: string;
  imageUrl: string;
  fallbackUrl?: string;
  tier: "exact_place" | "generated_artwork" | "destination_category" | "destination" | "regional_fallback" | "universal";
  placeName: string;
  destinationName: string;
  category: string;
  source: "live_photo" | "curated_artwork" | "generated_artwork" | "fallback";
  isRealPhoto: boolean;
  badgeLabel: "LIVE PLACE" | "VANVAS PLACE ARTWORK" | "DESTINATION CATEGORY ART" | "DESTINATION ART" | "REGIONAL ART" | "FALLBACK";
  visualDescription?: string;
}

function normalizeKey(str: string): string {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Registry of verified landmark artwork mappings
export const EXACT_PLACE_REGISTRY: Record<string, {
  imageUrl: string;
  visualDescription: string;
  category: string;
}> = {
  // Mussoorie
  "mussoorie:landour-bakehouse": {
    imageUrl: "/images/places/mussoorie/landour-bakehouse.webp",
    visualDescription: "Historic stone and timber hill bakery at Sisters Bazaar with Victorian glass vitrines and deodar canopy.",
    category: "Cafés & Bakery",
  },
  "mussoorie:lal-tibba": {
    imageUrl: "/images/places/mussoorie/lal-tibba.webp",
    visualDescription: "Highest mountain ridge viewpoint in Landour with telescope overlooking distant Garhwal snow peaks.",
    category: "Nature & Trails",
  },
  "mussoorie:kempty-falls": {
    imageUrl: "/images/places/mussoorie/kempty-falls.webp",
    visualDescription: "Steep rocky mountain waterfall cascade plunging into jade mountain pools.",
    category: "Nature & Trails",
  },
  "mussoorie:gun-hill": {
    imageUrl: "/images/places/mussoorie/gun-hill.webp",
    visualDescription: "Elevated colonial peak with ropeway cable car overlooking the vast Doon Valley.",
    category: "Culture & Heritage",
  },
  "mussoorie:camel-back-road": {
    imageUrl: "/images/places/mussoorie/camel-back-road.webp",
    visualDescription: "Tranquil oak-shaded walking promenade framing natural camel rock outcrop and winterline sunsets.",
    category: "Nature & Trails",
  },
  "mussoorie:mall-road": {
    imageUrl: "/images/places/mussoorie/mall-road.webp",
    visualDescription: "Colonial promenade with glowing vintage iron lampposts, bookshops, and evening strolls.",
    category: "Culture & Heritage",
  },
  "mussoorie:george-everest": {
    imageUrl: "/images/places/mussoorie/george-everest.webp",
    visualDescription: "White stone colonial observatory estate perched on grassy ridge with panoramic snow peak vistas.",
    category: "Nature & Trails",
  },
  "mussoorie:clouds-end": {
    imageUrl: "/images/places/mussoorie/clouds-end.webp",
    visualDescription: "Secluded historic stone bungalow nestled deep in ancient deodar and pine wilderness.",
    category: "Culture & Heritage",
  },
  "mussoorie:landour": {
    imageUrl: "/images/places/mussoorie/landour.webp",
    visualDescription: "Misty colonial ridge settlement with St. Paul church, stone cottages, and silent oak paths.",
    category: "Culture & Heritage",
  },

  // Manali
  "manali:hadimba-temple": {
    imageUrl: "/images/places/manali/hadimba-temple.webp",
    visualDescription: "Four-tiered wooden pagoda temple set inside Dhungri towering deodar pine forest.",
    category: "Culture & Heritage",
  },
  "manali:solang-valley": {
    imageUrl: "/images/places/manali/solang-valley.webp",
    visualDescription: "Expansive green alpine valley surrounded by snow-capped Pir Panjal peaks with paragliders in azure sky.",
    category: "Adventure & Sport",
  },
  "manali:old-manali": {
    imageUrl: "/images/places/manali/old-manali.webp",
    visualDescription: "Traditional timber-and-stone Himachali houses, apple orchards, and bohemian riverside verandas.",
    category: "Culture & Heritage",
  },
  "manali:cafe-1947": {
    imageUrl: "/images/places/manali/old-manali.webp",
    visualDescription: "Rustic stone mountain cafe with wooden deck sitting directly over the rushing Manalsu river.",
    category: "Cafés & Bakery",
  },
  "manali:jogini-waterfall": {
    imageUrl: "/images/destinations/manali/illustration.jpg",
    visualDescription: "Gentle cascading multi-tier waterfall surrounded by apple orchards and pine groves.",
    category: "Nature & Trails",
  },

  // Udaipur
  "udaipur:city-palace-udaipur": {
    imageUrl: "/images/destinations/udaipur/hero.jpg",
    visualDescription: "Monumental white marble palace with mirrored domes towering over the east bank of Lake Pichola.",
    category: "Culture & Heritage",
  },
  "udaipur:lake-pichola-boat": {
    imageUrl: "/images/destinations/udaipur/illustration.jpg",
    visualDescription: "Tranquil evening lake waters reflecting whitewashed Mewari palaces and Jag Mandir island.",
    category: "Nature & Trails",
  },
  "udaipur:bagore-ki-haveli": {
    imageUrl: "/images/destinations/udaipur/hero.jpg",
    visualDescription: "18th-century noble mansion at Gangaur Ghat hosting authentic Rajasthani folk dances.",
    category: "Culture & Heritage",
  },

  // Varanasi
  "varanasi:dashashwamedh-ghat-aarti": {
    imageUrl: "/images/destinations/varanasi/hero.jpg",
    visualDescription: "Historic stone riverfront steps illuminated by brass oil lamps and twilight river reflections.",
    category: "Culture & Heritage",
  },
  "varanasi:assi-ghat-subah": {
    imageUrl: "/images/destinations/varanasi/illustration.jpg",
    visualDescription: "Dawn light on the southern ghats with wooden rowboats resting on calm holy waters.",
    category: "Culture & Heritage",
  },
  "varanasi:kashi-vishwanath-temple": {
    imageUrl: "/images/destinations/varanasi/hero.jpg",
    visualDescription: "Ancient gold-spired Jyotirlinga shrine connected to the sacred river corridor.",
    category: "Culture & Heritage",
  },

  // Jaipur
  "jaipur:hawa-mahal": {
    imageUrl: "/images/destinations/jaipur/hero.jpg",
    visualDescription: "Intricately carved pink sandstone honeycomb facade with 953 jharokha windows.",
    category: "Culture & Heritage",
  },
  "jaipur:amber-palace-fort": {
    imageUrl: "/images/destinations/jaipur/illustration.jpg",
    visualDescription: "Hilltop sandstone fortress reflected over Maota Lake with fortified mountain ramparts.",
    category: "Culture & Heritage",
  },

  // Goa
  "goa:palolem-beach-cove": {
    imageUrl: "/images/destinations/goa/hero.jpg",
    visualDescription: "Curved white sand cove framed by coconut palms and calm turquoise waters.",
    category: "Nature & Trails",
  },
  "goa:fontainhas-latin-quarter": {
    imageUrl: "/images/destinations/goa/illustration.jpg",
    visualDescription: "Pastel-painted Portuguese heritage houses with wrought-iron balconies.",
    category: "Culture & Heritage",
  },

  // Leh
  "leh:thiksey-monastery-gompa": {
    imageUrl: "/images/destinations/leh/hero.jpg",
    visualDescription: "Layered whitewashed and ochre Tibetan monastery rising on a hill above the Indus Valley.",
    category: "Culture & Heritage",
  },
  "leh:pangong-tso-lake": {
    imageUrl: "/images/destinations/leh/illustration.jpg",
    visualDescription: "Vast turquoise high-altitude alpine lake set against stark barren Ladakh mountains.",
    category: "Nature & Trails",
  },

  // Kasol
  "kasol:chalal-trail": {
    imageUrl: "/images/destinations/kasol/hero.jpg",
    visualDescription: "Suspended bridge path winding through deep deodar pine forest along the roaring river.",
    category: "Nature & Trails",
  },

  // Dharamshala
  "dharamshala:namgyal-monastery": {
    imageUrl: "/images/destinations/dharamshala/hero.jpg",
    visualDescription: "Dalai Lama monastery complex surrounded by cedar woods and prayer wheels.",
    category: "Culture & Heritage",
  },
  "dharamshala:bhagsunag-waterfall": {
    imageUrl: "/images/destinations/dharamshala/illustration.jpg",
    visualDescription: "Mountain waterfall with bohemian cliffside cafe above Bhagsu village.",
    category: "Nature & Trails",
  },

  // Spiti
  "spiti:key-monastery": {
    imageUrl: "/images/destinations/spiti-valley/hero.jpg",
    visualDescription: "Thousand-year-old fort-like Tibetan monastery in high-altitude cold desert.",
    category: "Culture & Heritage",
  },
  "spiti:chandratal-lake": {
    imageUrl: "/images/destinations/spiti-valley/hero.jpg",
    visualDescription: "Crescent-shaped glacial lake reflecting clear starlit high-altitude skies.",
    category: "Nature & Trails",
  },

  // Munnar
  "munnar:kolukkumalai-tea": {
    imageUrl: "/images/destinations/fallbacks/valley.jpg",
    visualDescription: "World's highest tea plantation with sunrise cloud inversions over rolling green hills.",
    category: "Nature & Trails",
  },
  "munnar:eravikulam-park": {
    imageUrl: "/images/destinations/fallbacks/valley.jpg",
    visualDescription: "Rolling shola grasslands home to the endangered Nilgiri Tahr and Anamudi peak.",
    category: "Nature & Trails",
  }
};

const DESTINATION_ASSET_MAP: Record<string, { hero: string; illustration: string; fallback: string }> = {
  manali: { hero: "/images/destinations/manali/hero.jpg", illustration: "/images/destinations/manali/illustration.jpg", fallback: "/images/destinations/fallbacks/himalayan.jpg" },
  mussoorie: { hero: "/images/destinations/mussoorie/hero.jpg", illustration: "/images/destinations/mussoorie/illustration.jpg", fallback: "/images/destinations/fallbacks/himalayan.jpg" },
  udaipur: { hero: "/images/destinations/udaipur/hero.jpg", illustration: "/images/destinations/udaipur/illustration.jpg", fallback: "/images/destinations/fallbacks/desert.jpg" },
  varanasi: { hero: "/images/destinations/varanasi/hero.jpg", illustration: "/images/destinations/varanasi/illustration.jpg", fallback: "/images/destinations/fallbacks/valley.jpg" },
  jaipur: { hero: "/images/destinations/jaipur/hero.jpg", illustration: "/images/destinations/jaipur/illustration.jpg", fallback: "/images/destinations/fallbacks/desert.jpg" },
  goa: { hero: "/images/destinations/goa/hero.jpg", illustration: "/images/destinations/goa/illustration.jpg", fallback: "/images/destinations/fallbacks/coastal.jpg" },
  leh: { hero: "/images/destinations/leh/hero.jpg", illustration: "/images/destinations/leh/illustration.jpg", fallback: "/images/destinations/fallbacks/desert.jpg" },
  spiti: { hero: "/images/destinations/spiti-valley/hero.jpg", illustration: "/images/destinations/spiti-valley/illustration.jpg", fallback: "/images/destinations/fallbacks/desert.jpg" },
  rishikesh: { hero: "/images/destinations/rishikesh/hero.jpg", illustration: "/images/destinations/rishikesh/illustration.jpg", fallback: "/images/destinations/fallbacks/valley.jpg" },
  kasol: { hero: "/images/destinations/kasol/hero.jpg", illustration: "/images/destinations/kasol/illustration.jpg", fallback: "/images/destinations/fallbacks/himalayan.jpg" },
  dharamshala: { hero: "/images/destinations/dharamshala/hero.jpg", illustration: "/images/destinations/dharamshala/illustration.jpg", fallback: "/images/destinations/fallbacks/himalayan.jpg" },
  munnar: { hero: "/images/destinations/fallbacks/valley.jpg", illustration: "/images/destinations/fallbacks/valley.jpg", fallback: "/images/destinations/fallbacks/valley.jpg" }
};

/**
 * Resolves artwork for any real-world place deterministically.
 */
export function resolvePlaceArtwork(
  placeName: string,
  destinationName: string,
  category: string,
  existingImageUrl?: string | null,
  isLive?: boolean,
  source?: string
): PlaceArtworkResult {
  const destNorm = normalizeKey(destinationName);
  const placeNorm = normalizeKey(placeName);

  // Match destination config
  let matchedDestKey: string | null = null;
  for (const k of Object.keys(DESTINATION_ASSET_MAP)) {
    if (destNorm.includes(k) || k.includes(destNorm)) {
      matchedDestKey = k;
      break;
    }
  }

  const destFallback = matchedDestKey
    ? (DESTINATION_ASSET_MAP[matchedDestKey].illustration || DESTINATION_ASSET_MAP[matchedDestKey].hero)
    : "/images/destinations/fallbacks/himalayan.jpg";

  // If live provider provided a verified real photo URL
  if (isLive && existingImageUrl && (existingImageUrl.startsWith("https://") || existingImageUrl.startsWith("http://")) && !existingImageUrl.includes("unsplash.com")) {
    return {
      artworkKey: `live:${placeNorm}`,
      imageUrl: existingImageUrl,
      fallbackUrl: destFallback,
      tier: "exact_place",
      placeName,
      destinationName,
      category,
      source: "live_photo",
      isRealPhoto: true,
      badgeLabel: "LIVE PLACE",
    };
  }

  // 1. Exact Place Artwork Match (scored by distinctive token matching)
  let bestExactMatch: { regKey: string; item: typeof EXACT_PLACE_REGISTRY[string] } | null = null;
  let bestScore = 0;
  const genericTokens = new Set([
    "aarti", "temple", "trail", "waterfall", "point", "viewpoint",
    "cove", "road", "lake", "palace", "fort", "cafe", "bakery",
    "hill", "ridge", "view", "falls", "market", "bazaar", "shop",
    "village", "quarter", "forest", "park", "shrine", "monastery",
    "gompa", "mountain", "ancient", "heritage", "pine", "scenic", "stream"
  ]);

  for (const [regKey, item] of Object.entries(EXACT_PLACE_REGISTRY)) {
    const [regDest, regPlace] = regKey.split(":");
    if (regDest === destNorm || destNorm.includes(regDest) || regDest.includes(destNorm)) {
      let score = 0;
      if (regPlace === placeNorm) {
        score = 100;
      } else if (regPlace.includes(placeNorm)) {
        score = 80 + placeNorm.length;
      } else if (placeNorm.includes(regPlace)) {
        score = 60 + regPlace.length;
      } else {
        const regToks = new Set(regPlace.split("-").filter(t => t.length > 2));
        const placeToks = new Set(placeNorm.split("-").filter(t => t.length > 2));
        const overlap = [...regToks].filter(t => placeToks.has(t));
        const distinctive = overlap.filter(t => !genericTokens.has(t));
        if (distinctive.length > 0) {
          score = 40 + distinctive.reduce((acc, t) => acc + t.length, 0);
        } else if (overlap.length >= 2) {
          score = 25 + overlap.length;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestExactMatch = { regKey, item };
      }
    }
  }

  if (bestExactMatch && bestScore >= 25) {
    return {
      artworkKey: bestExactMatch.regKey,
      imageUrl: bestExactMatch.item.imageUrl,
      fallbackUrl: destFallback,
      tier: "exact_place",
      placeName,
      destinationName,
      category,
      source: (source === "openstreetmap" ? "generated_artwork" : "curated_artwork"),
      isRealPhoto: false,
      badgeLabel: (isLive ? "LIVE PLACE" : "VANVAS PLACE ARTWORK"),
      visualDescription: bestExactMatch.item.visualDescription
    };
  }

  // 2. Destination + Category Artwork Fallback
  const catLower = (category || "").toLowerCase();
  let catFile = "viewpoint";
  if (catLower.includes("cafe") || catLower.includes("bakery") || catLower.includes("dining") || catLower.includes("food") || catLower.includes("restaurant") || catLower.includes("dhaba")) {
    catFile = "cafe";
  } else if (catLower.includes("temple") || catLower.includes("spiritual") || catLower.includes("shrine") || catLower.includes("ashram") || catLower.includes("monastery") || catLower.includes("ghat") || catLower.includes("culture") || catLower.includes("heritage")) {
    catFile = "spiritual";
  } else if (catLower.includes("waterfall") || catLower.includes("trail") || catLower.includes("nature") || catLower.includes("forest") || catLower.includes("lake") || catLower.includes("river") || placeNorm.includes("waterfall") || placeNorm.includes("trail")) {
    catFile = "nature";
  } else if (catLower.includes("hotel") || catLower.includes("stay") || catLower.includes("resort") || catLower.includes("homestay") || catLower.includes("hostel") || catLower.includes("cottage")) {
    catFile = "stay";
  }

  if (matchedDestKey) {
    const categoryImg = `/images/places/${matchedDestKey}/categories/${catFile}.webp`;

    return {
      artworkKey: `${matchedDestKey}:category-${catFile}`,
      imageUrl: categoryImg,
      fallbackUrl: destFallback,
      tier: "destination_category",
      placeName,
      destinationName,
      category,
      source: "generated_artwork",
      isRealPhoto: false,
      badgeLabel: isLive ? "LIVE PLACE" : "DESTINATION CATEGORY ART",
    };
  }

  // 3. Regional Fallback
  let regionalImg = "/images/destinations/fallbacks/himalayan.jpg";
  if (catLower.includes("beach") || destNorm.includes("goa") || destNorm.includes("kerala") || destNorm.includes("coast")) {
    regionalImg = "/images/destinations/fallbacks/coastal.jpg";
  } else if (destNorm.includes("desert") || destNorm.includes("jaipur") || destNorm.includes("udaipur") || destNorm.includes("jodhpur")) {
    regionalImg = "/images/destinations/fallbacks/desert.jpg";
  } else if (destNorm.includes("varanasi") || destNorm.includes("ganga") || catLower.includes("ghat")) {
    regionalImg = "/images/destinations/fallbacks/valley.jpg";
  } else if (destNorm.includes("munnar") || catLower.includes("tea") || catLower.includes("valley")) {
    regionalImg = "/images/destinations/fallbacks/valley.jpg";
  }

  return {
    artworkKey: `fallback:${destNorm}`,
    imageUrl: regionalImg,
    fallbackUrl: "/images/destinations/fallbacks/himalayan.jpg",
    tier: "regional_fallback",
    placeName,
    destinationName,
    category,
    source: "fallback",
    isRealPhoto: false,
    badgeLabel: isLive ? "LIVE PLACE" : "REGIONAL ART",
  };
}
