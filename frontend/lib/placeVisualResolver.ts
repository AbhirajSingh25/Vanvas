/**
 * VANVAS Place-Level Visual Intelligence & Artwork Resolver
 * 
 * Implements deterministic place-specific artwork resolution, multi-tier fallback,
 * and transparent visual provenance classification.
 * 
 * Hierarchy:
 * 1. EXACT PLACE ARTWORK (Dedicated landmark artwork depicting the specific place) -> [ VANVAS PLACE ARTWORK ]
 * 2. DESTINATION + CATEGORY ARTWORK (Dedicated destination category art, e.g. Mussoorie Cafe, Manali Trail) -> [ DESTINATION CATEGORY ART ]
 * 3. DESTINATION ARTWORK (Destination Hero/Illustration) -> [ DESTINATION ART ]
 * 4. REGIONAL ARTWORK (Himalayan, Coastal, Desert, River Ghat, Valley) -> [ REGIONAL ART ]
 * 5. UNIVERSAL FALLBACK -> [ FALLBACK ]
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

export function normalizeKey(str: string): string {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Strip diacritics / accents
    .toLowerCase()
    .replace(/['’`]/g, "") // Strip apostrophes cleanly (e.g. st paul's -> st pauls)
    .replace(/&/g, "and") // Replace ampersands
    .replace(/[^a-z0-9]/g, "-") // Replace non-alphanumeric with dash
    .replace(/-+/g, "-") // Collapse consecutive dashes
    .replace(/^-|-$/g, ""); // Trim leading/trailing dash
}

// Registry of verified landmark artwork mappings with truthful provenance
export const EXACT_PLACE_REGISTRY: Record<string, {
  imageUrl: string;
  visualDescription: string;
  category: string;
}> = {
  // Mussoorie / Landour Landmarks
  "mussoorie:st-pauls-church": {
    imageUrl: "/images/places/mussoorie/st-pauls-church.webp",
    visualDescription: "Historic 1852 stone Anglican church in Landour with steep gabled wooden roof and lancet windows under deodar pines.",
    category: "Culture & Heritage",
  },
  "mussoorie:st-pauls-church-landour": {
    imageUrl: "/images/places/mussoorie/st-pauls-church.webp",
    visualDescription: "Historic 1852 stone Anglican church in Landour with steep gabled wooden roof and lancet windows under deodar pines.",
    category: "Culture & Heritage",
  },
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
  "mussoorie:lal-tibba-scenic-viewpoint": {
    imageUrl: "/images/places/mussoorie/lal-tibba.webp",
    visualDescription: "Highest mountain ridge viewpoint in Landour with telescope overlooking distant Garhwal snow peaks.",
    category: "Nature & Trails",
  },
  "mussoorie:kempty-falls": {
    imageUrl: "/images/places/mussoorie/kempty-falls.webp",
    visualDescription: "Steep rocky mountain waterfall cascade plunging into jade mountain pools.",
    category: "Nature & Trails",
  },
  "mussoorie:kempty-falls-mountain-cascade": {
    imageUrl: "/images/places/mussoorie/kempty-falls.webp",
    visualDescription: "Steep rocky mountain waterfall cascade plunging into jade mountain pools.",
    category: "Nature & Trails",
  },
  "mussoorie:gun-hill": {
    imageUrl: "/images/places/mussoorie/gun-hill.webp",
    visualDescription: "Elevated colonial peak with ropeway cable car overlooking the vast Doon Valley.",
    category: "Culture & Heritage",
  },
  "mussoorie:gun-hill-historic-viewpoint": {
    imageUrl: "/images/places/mussoorie/gun-hill.webp",
    visualDescription: "Elevated colonial peak with ropeway cable car overlooking the vast Doon Valley.",
    category: "Culture & Heritage",
  },
  "mussoorie:camel-back-road": {
    imageUrl: "/images/places/mussoorie/camel-back-road.webp",
    visualDescription: "Tranquil oak-shaded walking promenade framing natural camel rock outcrop and winterline sunsets.",
    category: "Nature & Trails",
  },
  "mussoorie:camels-back-road": {
    imageUrl: "/images/places/mussoorie/camel-back-road.webp",
    visualDescription: "Tranquil oak-shaded walking promenade framing natural camel rock outcrop and winterline sunsets.",
    category: "Nature & Trails",
  },
  "mussoorie:camels-back-road-and-winterline-trail": {
    imageUrl: "/images/places/mussoorie/camel-back-road.webp",
    visualDescription: "Tranquil oak-shaded walking promenade framing natural camel rock outcrop and winterline sunsets.",
    category: "Nature & Trails",
  },
  "mussoorie:mall-road": {
    imageUrl: "/images/places/mussoorie/mall-road.webp",
    visualDescription: "Colonial promenade with glowing vintage iron lampposts, bookshops, and evening strolls.",
    category: "Culture & Heritage",
  },
  "mussoorie:mall-road-heritage-promenade": {
    imageUrl: "/images/places/mussoorie/mall-road.webp",
    visualDescription: "Colonial promenade with glowing vintage iron lampposts, bookshops, and evening strolls.",
    category: "Culture & Heritage",
  },
  "mussoorie:george-everest": {
    imageUrl: "/images/places/mussoorie/george-everest.webp",
    visualDescription: "White stone colonial observatory estate perched on grassy ridge with panoramic snow peak vistas.",
    category: "Nature & Trails",
  },
  "mussoorie:george-everest-peak-and-observatory-house": {
    imageUrl: "/images/places/mussoorie/george-everest.webp",
    visualDescription: "White stone colonial observatory estate perched on grassy ridge with panoramic snow peak vistas.",
    category: "Nature & Trails",
  },
  "mussoorie:clouds-end": {
    imageUrl: "/images/places/mussoorie/clouds-end.webp",
    visualDescription: "Secluded historic stone bungalow nestled deep in ancient deodar and pine wilderness.",
    category: "Culture & Heritage",
  },
  "mussoorie:clouds-end-forest-retreat": {
    imageUrl: "/images/places/mussoorie/clouds-end.webp",
    visualDescription: "Secluded historic stone bungalow nestled deep in ancient deodar and pine wilderness.",
    category: "Culture & Heritage",
  },
  "mussoorie:landour": {
    imageUrl: "/images/places/mussoorie/landour.webp",
    visualDescription: "Misty colonial ridge settlement with stone cottages and silent oak paths.",
    category: "Culture & Heritage",
  },
  "mussoorie:landour-heritage-ridge-and-sisters-bazaar": {
    imageUrl: "/images/places/mussoorie/landour.webp",
    visualDescription: "Misty colonial ridge settlement with stone cottages and silent oak paths.",
    category: "Culture & Heritage",
  },

  // Manali Landmarks
  "manali:hadimba-temple": {
    imageUrl: "/images/places/manali/hadimba-temple.webp",
    visualDescription: "Four-tiered wooden pagoda temple set inside Dhungri towering deodar pine forest.",
    category: "Culture & Heritage",
  },
  "manali:hadimba-devi-cedar-forest-temple": {
    imageUrl: "/images/places/manali/hadimba-temple.webp",
    visualDescription: "Four-tiered wooden pagoda temple set inside Dhungri towering deodar pine forest.",
    category: "Culture & Heritage",
  },
  "manali:solang-valley": {
    imageUrl: "/images/places/manali/solang-valley.webp",
    visualDescription: "Expansive green alpine valley surrounded by snow-capped Pir Panjal peaks with paragliders in azure sky.",
    category: "Adventure & Sport",
  },
  "manali:solang-valley-ridge-and-paragliding": {
    imageUrl: "/images/places/manali/solang-valley.webp",
    visualDescription: "Expansive green alpine valley surrounded by snow-capped Pir Panjal peaks with paragliders in azure sky.",
    category: "Adventure & Sport",
  },
  "manali:solang-valley-ridge-paragliding": {
    imageUrl: "/images/places/manali/solang-valley.webp",
    visualDescription: "Expansive green alpine valley surrounded by snow-capped Pir Panjal peaks with paragliders in azure sky.",
    category: "Adventure & Sport",
  },
  "manali:old-manali": {
    imageUrl: "/images/places/manali/old-manali.webp",
    visualDescription: "Traditional timber-and-stone Himachali houses, apple orchards, and bohemian riverside verandas.",
    category: "Culture & Heritage",
  },
  "manali:old-manali-village-and-manu-temple": {
    imageUrl: "/images/places/manali/old-manali.webp",
    visualDescription: "Traditional timber-and-stone Himachali houses, apple orchards, and bohemian riverside verandas.",
    category: "Culture & Heritage",
  },
  "manali:old-manali-village-manu-temple": {
    imageUrl: "/images/places/manali/old-manali.webp",
    visualDescription: "Traditional timber-and-stone Himachali houses, apple orchards, and bohemian riverside verandas.",
    category: "Culture & Heritage",
  },

  // Dharamshala / McLeod Ganj Landmarks
  "dharamshala:namgyal-monastery": {
    imageUrl: "/images/places/dharamshala/namgyal-monastery.webp",
    visualDescription: "Dalai Lama monastery complex with prayer wheels surrounded by cedar woods under the Dhauladhar wall.",
    category: "Culture & Heritage",
  },
  "dharamshala:namgyal-monastery-and-tsuglagkhang-complex": {
    imageUrl: "/images/places/dharamshala/namgyal-monastery.webp",
    visualDescription: "Dalai Lama monastery complex with prayer wheels surrounded by cedar woods under the Dhauladhar wall.",
    category: "Culture & Heritage",
  },
  "dharamshala:tsuglagkhang": {
    imageUrl: "/images/places/dharamshala/namgyal-monastery.webp",
    visualDescription: "Dalai Lama monastery complex with prayer wheels surrounded by cedar woods under the Dhauladhar wall.",
    category: "Culture & Heritage",
  },

  // Goa Landmarks
  "goa:fontainhas": {
    imageUrl: "/images/places/goa/fontainhas-latin-quarter.webp",
    visualDescription: "Pastel-painted Portuguese heritage houses with wrought-iron balconies and bougainvillea in Panaji.",
    category: "Culture & Heritage",
  },
  "goa:fontainhas-latin-quarter": {
    imageUrl: "/images/places/goa/fontainhas-latin-quarter.webp",
    visualDescription: "Pastel-painted Portuguese heritage houses with wrought-iron balconies and bougainvillea in Panaji.",
    category: "Culture & Heritage",
  },
  "goa:fontainhas-latin-heritage-quarter": {
    imageUrl: "/images/places/goa/fontainhas-latin-quarter.webp",
    visualDescription: "Pastel-painted Portuguese heritage houses with wrought-iron balconies and bougainvillea in Panaji.",
    category: "Culture & Heritage",
  },
  "goa:aguada-fort": {
    imageUrl: "/images/places/goa/aguada-fort.webp",
    visualDescription: "17th-century Portuguese laterite stone sea fortress and cylindrical lighthouse on the coastal headland.",
    category: "Culture & Heritage",
  },
  "goa:aguada-fort-and-historic-lighthouse": {
    imageUrl: "/images/places/goa/aguada-fort.webp",
    visualDescription: "17th-century Portuguese laterite stone sea fortress and cylindrical lighthouse on the coastal headland.",
    category: "Culture & Heritage",
  },
  "goa:fort-aguada": {
    imageUrl: "/images/places/goa/aguada-fort.webp",
    visualDescription: "17th-century Portuguese laterite stone sea fortress and cylindrical lighthouse on the coastal headland.",
    category: "Culture & Heritage",
  },

  // Rishikesh Landmarks
  "rishikesh:triveni-ghat": {
    imageUrl: "/images/places/rishikesh/triveni-ghat.webp",
    visualDescription: "Sacred stone riverfront steps at the Ganges confluence with twilight brass aarti lamps and floating diyas.",
    category: "Culture & Heritage",
  },
  "rishikesh:triveni-ghat-evening-maha-aarti": {
    imageUrl: "/images/places/rishikesh/triveni-ghat.webp",
    visualDescription: "Sacred stone riverfront steps at the Ganges confluence with twilight brass aarti lamps and floating diyas.",
    category: "Culture & Heritage",
  },

  // Jaipur Landmarks
  "jaipur:hawa-mahal": {
    imageUrl: "/images/places/jaipur/hawa-mahal.webp",
    visualDescription: "Five-storey pink sandstone honeycomb facade with 953 carved jharokha lattice windows.",
    category: "Culture & Heritage",
  },
  "jaipur:hawa-mahal-palace-of-winds": {
    imageUrl: "/images/places/jaipur/hawa-mahal.webp",
    visualDescription: "Five-storey pink sandstone honeycomb facade with 953 carved jharokha lattice windows.",
    category: "Culture & Heritage",
  },

  // Udaipur Landmarks
  "udaipur:city-palace-udaipur": {
    imageUrl: "/images/places/udaipur/city-palace-udaipur.webp",
    visualDescription: "Monumental whitewashed marble palace with mirrored domes rising over the eastern shore of Lake Pichola.",
    category: "Culture & Heritage",
  },
  "udaipur:city-palace-of-udaipur": {
    imageUrl: "/images/places/udaipur/city-palace-udaipur.webp",
    visualDescription: "Monumental whitewashed marble palace with mirrored domes rising over the eastern shore of Lake Pichola.",
    category: "Culture & Heritage",
  },
  "udaipur:city-palace": {
    imageUrl: "/images/places/udaipur/city-palace-udaipur.webp",
    visualDescription: "Monumental whitewashed marble palace with mirrored domes rising over the eastern shore of Lake Pichola.",
    category: "Culture & Heritage",
  },

  // Varanasi Landmarks
  "varanasi:dashashwamedh-ghat-aarti": {
    imageUrl: "/images/places/varanasi/dashashwamedh-ghat-aarti.webp",
    visualDescription: "Historic stone riverfront steps illuminated by brass oil lamps and evening river reflections.",
    category: "Culture & Heritage",
  },
  "varanasi:dashashwamedh-ghat-evening-maha-aarti": {
    imageUrl: "/images/places/varanasi/dashashwamedh-ghat-aarti.webp",
    visualDescription: "Historic stone riverfront steps illuminated by brass oil lamps and evening river reflections.",
    category: "Culture & Heritage",
  },
  "varanasi:dashashwamedh-ghat": {
    imageUrl: "/images/places/varanasi/dashashwamedh-ghat-aarti.webp",
    visualDescription: "Historic stone riverfront steps illuminated by brass oil lamps and evening river reflections.",
    category: "Culture & Heritage",
  },

  // Leh Ladakh Landmarks
  "leh:thiksey-monastery-gompa": {
    imageUrl: "/images/places/leh/thiksey-monastery-gompa.webp",
    visualDescription: "Layered 12-storey whitewashed and ochre Tibetan monastery rising on a hill above the Indus Valley.",
    category: "Culture & Heritage",
  },
  "leh:thiksey-monastery": {
    imageUrl: "/images/places/leh/thiksey-monastery-gompa.webp",
    visualDescription: "Layered 12-storey whitewashed and ochre Tibetan monastery rising on a hill above the Indus Valley.",
    category: "Culture & Heritage",
  },

  // Spiti Valley Landmarks
  "spiti:key-monastery": {
    imageUrl: "/images/places/spiti/key-monastery.webp",
    visualDescription: "Thousand-year-old fort-like Tibetan monastery perched atop a rocky hill in the high-altitude cold desert.",
    category: "Culture & Heritage",
  },
  "spiti:key-monastery-ki-gompa": {
    imageUrl: "/images/places/spiti/key-monastery.webp",
    visualDescription: "Thousand-year-old fort-like Tibetan monastery perched atop a rocky hill in the high-altitude cold desert.",
    category: "Culture & Heritage",
  },
  "spiti:ki-gompa": {
    imageUrl: "/images/places/spiti/key-monastery.webp",
    visualDescription: "Thousand-year-old fort-like Tibetan monastery perched atop a rocky hill in the high-altitude cold desert.",
    category: "Culture & Heritage",
  },
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

// Map high-level category string to standardized category folder key
function getCategoryFolderKey(category: string): string {
  const cat = (category || "").toLowerCase();
  if (cat.includes("cafe") || cat.includes("bakery") || cat.includes("food") || cat.includes("restaurant") || cat.includes("dhaba")) {
    return "cafe";
  }
  if (cat.includes("trail") || cat.includes("nature") || cat.includes("waterfall") || cat.includes("lake") || cat.includes("trek") || cat.includes("adventure") || cat.includes("park")) {
    return "nature";
  }
  if (cat.includes("temple") || cat.includes("monastery") || cat.includes("church") || cat.includes("shrine") || cat.includes("spiritual") || cat.includes("heritage") || cat.includes("culture") || cat.includes("ashram") || cat.includes("ghat")) {
    return "spiritual";
  }
  if (cat.includes("stay") || cat.includes("hotel") || cat.includes("resort") || cat.includes("cottage") || cat.includes("homestay")) {
    return "stay";
  }
  if (cat.includes("viewpoint") || cat.includes("scenic") || cat.includes("sunset") || cat.includes("sunrise") || cat.includes("peak")) {
    return "viewpoint";
  }
  return "nature";
}

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

  const destIllustration = matchedDestKey ? DESTINATION_ASSET_MAP[matchedDestKey].illustration : null;
  const destHero = matchedDestKey ? DESTINATION_ASSET_MAP[matchedDestKey].hero : null;
  const destFallback = destIllustration || destHero || "/images/destinations/fallbacks/himalayan.jpg";

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

  // 1. Exact Place Artwork Match (scored by distinctive token matching and exact key check)
  let bestExactMatch: { regKey: string; item: typeof EXACT_PLACE_REGISTRY[string] } | null = null;
  let bestScore = 0;
  const genericTokens = new Set([
    "aarti", "temple", "trail", "waterfall", "point", "viewpoint",
    "cove", "road", "lake", "palace", "fort", "cafe", "bakery",
    "hill", "ridge", "view", "falls", "market", "bazaar", "shop",
    "village", "quarter", "forest", "park", "shrine", "monastery",
    "gompa", "mountain", "ancient", "heritage", "pine", "scenic", "stream",
    "house", "complex", "center", "centre", "and", "the", "near", "rd"
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
        score = 70 + regPlace.length;
      } else {
        const regToks = new Set(regPlace.split("-").filter(t => t.length > 2));
        const placeToks = new Set(placeNorm.split("-").filter(t => t.length > 2));
        const overlap = [...regToks].filter(t => placeToks.has(t));
        const distinctive = overlap.filter(t => !genericTokens.has(t));
        if (distinctive.length > 0) {
          score = 50 + distinctive.reduce((acc, t) => acc + t.length, 0);
        } else if (overlap.length >= 2) {
          score = 30 + overlap.length;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestExactMatch = { regKey, item };
      }
    }
  }

  if (bestExactMatch && bestScore >= 40) {
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

  // 2. Destination Category Artwork (Truthful category fallback e.g. Mussoorie Cafe, Manali Nature)
  const categoryFolder = getCategoryFolderKey(category);
  if (matchedDestKey) {
    const categoryArtworkPath = `/images/places/${matchedDestKey}/categories/${categoryFolder}.webp`;
    return {
      artworkKey: `${matchedDestKey}:${categoryFolder}`,
      imageUrl: categoryArtworkPath,
      fallbackUrl: destFallback,
      tier: "destination_category",
      placeName,
      destinationName,
      category,
      source: "curated_artwork",
      isRealPhoto: false,
      badgeLabel: isLive ? "LIVE PLACE" : "DESTINATION CATEGORY ART",
      visualDescription: `Authentic ${destinationName} ${category} artwork.`
    };
  }

  // 3. Destination Artwork (Authentic, bright high-resolution illustration/hero)
  if (matchedDestKey) {
    const chosenArtwork = destIllustration || destHero || "/images/destinations/fallbacks/himalayan.jpg";

    return {
      artworkKey: `${matchedDestKey}:destination-artwork`,
      imageUrl: chosenArtwork,
      fallbackUrl: destFallback,
      tier: "destination",
      placeName,
      destinationName,
      category,
      source: "curated_artwork",
      isRealPhoto: false,
      badgeLabel: isLive ? "LIVE PLACE" : "DESTINATION ART",
    };
  }

  // 4. Regional Fallback for unseeded destinations
  const catLower = (category || "").toLowerCase();
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
