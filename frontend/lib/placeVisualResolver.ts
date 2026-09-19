/**
 * VANVAS Place-Level Visual Intelligence & Artwork Resolver
 * 
 * Implements deterministic place-specific artwork resolution, multi-tier fallback,
 * collision protection, and transparent visual provenance classification.
 * 
 * Hierarchy:
 * 1. EXACT PLACE ID / KEY in verified registry -> [ VANVAS PLACE ARTWORK ]
 * 2. EXACT SOURCE / PROVIDER ID (if mapped) -> [ VANVAS PLACE ARTWORK ]
 * 3. NORMALIZED EXACT PLACE NAME + DESTINATION -> [ VANVAS PLACE ARTWORK ]
 * 4. KNOWN ALIASES MATCH -> [ VANVAS PLACE ARTWORK ]
 * 5. DESTINATION + CATEGORY ARTWORK (e.g. Mussoorie Cafe, Manali Nature) -> [ DESTINATION CATEGORY ART ]
 * 6. DESTINATION ARTWORK (Curated Hero / Illustration) -> [ DESTINATION ART ]
 * 7. REGIONAL SEMANTIC ARTWORK (Coastal, Desert, River Ghat, Valley, Himalayan) -> [ REGIONAL ART ]
 * 8. UNIVERSAL CATEGORY / SAFE FALLBACK -> [ UNIVERSAL FALLBACK ]
 * 
 * When a verified live photo is provided by live provider -> [ LIVE PLACE ]
 */

export type ArtworkTier =
  | "exact_place"
  | "destination_category"
  | "destination"
  | "regional_fallback"
  | "universal";

export type ProvenanceBadge =
  | "LIVE PLACE"
  | "VANVAS PLACE ARTWORK"
  | "DESTINATION CATEGORY ART"
  | "DESTINATION ART"
  | "REGIONAL ART"
  | "UNIVERSAL FALLBACK";

export interface PlaceArtworkResult {
  artworkKey: string;
  imageUrl: string;
  fallbackUrl?: string;
  tier: ArtworkTier;
  placeName: string;
  destinationName: string;
  category: string;
  source: "live_photo" | "curated_artwork" | "fallback";
  isRealPhoto: boolean;
  badgeLabel: ProvenanceBadge;
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

export interface CuratedLandmarkEntry {
  imageUrl: string;
  visualDescription: string;
  category: string;
  aliases: string[];
}

// Registry of verified landmark artwork mappings with truthful provenance.
// Contains ONLY verified landmark-specific artwork assets that physically exist on disk.
export const EXACT_PLACE_REGISTRY: Record<string, CuratedLandmarkEntry> = {
  // Mussoorie / Landour Landmarks
  "mussoorie:st-pauls-church": {
    imageUrl: "/images/places/mussoorie/st-pauls-church.webp",
    visualDescription: "Historic 1852 stone Anglican church in Landour with steep gabled wooden roof and lancet windows under deodar pines.",
    category: "Culture & Heritage",
    aliases: ["st-pauls-church-landour", "st-pauls-church", "st-paul-church"]
  },
  "mussoorie:landour-bakehouse": {
    imageUrl: "/images/places/mussoorie/landour-bakehouse.webp",
    visualDescription: "Historic stone and timber hill bakery at Sisters Bazaar with Victorian glass vitrines and deodar canopy.",
    category: "Cafés & Bakery",
    aliases: ["landour-bakehouse", "landour-bakery", "sisters-bazaar-bakehouse"]
  },
  "mussoorie:lal-tibba": {
    imageUrl: "/images/places/mussoorie/lal-tibba.webp",
    visualDescription: "Highest mountain ridge viewpoint in Landour with telescope overlooking distant Garhwal snow peaks.",
    category: "Nature & Trails",
    aliases: ["lal-tibba", "lal-tibba-scenic-viewpoint", "lal-tibba-viewpoint"]
  },
  "mussoorie:kempty-falls": {
    imageUrl: "/images/places/mussoorie/kempty-falls.webp",
    visualDescription: "Steep rocky mountain waterfall cascade plunging into jade mountain pools.",
    category: "Nature & Trails",
    aliases: ["kempty-falls", "kempty-falls-mountain-cascade", "kempty-waterfall"]
  },
  "mussoorie:gun-hill": {
    imageUrl: "/images/places/mussoorie/gun-hill.webp",
    visualDescription: "Elevated colonial peak with ropeway cable car overlooking the vast Doon Valley.",
    category: "Culture & Heritage",
    aliases: ["gun-hill", "gun-hill-historic-viewpoint", "gun-hill-viewpoint"]
  },
  "mussoorie:camel-back-road": {
    imageUrl: "/images/places/mussoorie/camel-back-road.webp",
    visualDescription: "Tranquil oak-shaded walking promenade framing natural camel rock outcrop and winterline sunsets.",
    category: "Nature & Trails",
    aliases: ["camel-back-road", "camels-back-road", "camels-back-road-and-winterline-trail"]
  },
  "mussoorie:mall-road": {
    imageUrl: "/images/places/mussoorie/mall-road.webp",
    visualDescription: "Colonial promenade with glowing vintage iron lampposts, bookshops, and evening strolls.",
    category: "Culture & Heritage",
    aliases: ["mall-road", "mussoorie-mall-road", "mall-road-heritage-promenade"]
  },
  "mussoorie:george-everest": {
    imageUrl: "/images/places/mussoorie/george-everest.webp",
    visualDescription: "White stone colonial observatory estate perched on grassy ridge with panoramic snow peak vistas.",
    category: "Nature & Trails",
    aliases: ["george-everest", "george-everest-peak-and-observatory-house", "sir-george-everest-house"]
  },
  "mussoorie:clouds-end": {
    imageUrl: "/images/places/mussoorie/clouds-end.webp",
    visualDescription: "Secluded historic stone bungalow nestled deep in ancient deodar and pine wilderness.",
    category: "Culture & Heritage",
    aliases: ["clouds-end", "clouds-end-forest-retreat", "clouds-end-estate"]
  },
  "mussoorie:landour": {
    imageUrl: "/images/places/mussoorie/landour.webp",
    visualDescription: "Misty colonial ridge settlement with stone cottages and silent oak paths.",
    category: "Culture & Heritage",
    aliases: ["landour", "landour-cantonment", "landour-heritage-ridge-and-sisters-bazaar"]
  },

  // Manali Landmarks
  "manali:hadimba-temple": {
    imageUrl: "/images/places/manali/hadimba-temple.webp",
    visualDescription: "Four-tiered wooden pagoda temple set inside Dhungri towering deodar pine forest.",
    category: "Culture & Heritage",
    aliases: ["hadimba-temple", "hadimba-devi-cedar-forest-temple", "hidimba-devi-temple", "dhungri-temple"]
  },
  "manali:solang-valley": {
    imageUrl: "/images/places/manali/solang-valley.webp",
    visualDescription: "Expansive green alpine valley surrounded by snow-capped Pir Panjal peaks with paragliders in azure sky.",
    category: "Adventure & Sport",
    aliases: ["solang-valley", "solang-valley-ridge-and-paragliding", "solang-nullah"]
  },
  "manali:old-manali": {
    imageUrl: "/images/places/manali/old-manali.webp",
    visualDescription: "Traditional timber-and-stone Himachali houses, apple orchards, and bohemian riverside verandas.",
    category: "Culture & Heritage",
    aliases: ["old-manali", "old-manali-village-and-manu-temple", "old-manali-village"]
  },

  // Dharamshala / McLeod Ganj Landmarks
  "dharamshala:namgyal-monastery": {
    imageUrl: "/images/places/dharamshala/namgyal-monastery.webp",
    visualDescription: "Dalai Lama monastery complex with prayer wheels surrounded by cedar woods under the Dhauladhar wall.",
    category: "Culture & Heritage",
    aliases: ["namgyal-monastery", "namgyal-monastery-and-tsuglagkhang-complex", "tsuglagkhang"]
  },

  // Goa Landmarks
  "goa:fontainhas-latin-quarter": {
    imageUrl: "/images/places/goa/fontainhas-latin-quarter.webp",
    visualDescription: "Pastel-painted Portuguese heritage houses with wrought-iron balconies and bougainvillea in Panaji.",
    category: "Culture & Heritage",
    aliases: ["fontainhas-latin-quarter", "fontainhas", "fontainhas-latin-heritage-quarter"]
  },
  "goa:aguada-fort": {
    imageUrl: "/images/places/goa/aguada-fort.webp",
    visualDescription: "17th-century Portuguese laterite stone sea fortress and cylindrical lighthouse on the coastal headland.",
    category: "Culture & Heritage",
    aliases: ["aguada-fort", "aguada-fort-and-historic-lighthouse", "fort-aguada"]
  },

  // Rishikesh Landmarks
  "rishikesh:triveni-ghat": {
    imageUrl: "/images/places/rishikesh/triveni-ghat.webp",
    visualDescription: "Sacred stone riverfront steps at the Ganges confluence with twilight brass aarti lamps and floating diyas.",
    category: "Culture & Heritage",
    aliases: ["triveni-ghat", "triveni-ghat-evening-maha-aarti", "triveni-ghat-aarti"]
  },

  // Jaipur Landmarks
  "jaipur:hawa-mahal": {
    imageUrl: "/images/places/jaipur/hawa-mahal.webp",
    visualDescription: "Five-storey pink sandstone honeycomb facade with 953 carved jharokha lattice windows.",
    category: "Culture & Heritage",
    aliases: ["hawa-mahal", "hawa-mahal-palace-of-winds", "palace-of-winds"]
  },

  // Udaipur Landmarks
  "udaipur:city-palace-udaipur": {
    imageUrl: "/images/places/udaipur/city-palace-udaipur.webp",
    visualDescription: "Monumental whitewashed marble palace with mirrored domes rising over the eastern shore of Lake Pichola.",
    category: "Culture & Heritage",
    aliases: ["city-palace-udaipur", "city-palace-of-udaipur", "city-palace"]
  },

  // Varanasi Landmarks
  "varanasi:dashashwamedh-ghat-aarti": {
    imageUrl: "/images/places/varanasi/dashashwamedh-ghat-aarti.webp",
    visualDescription: "Historic stone riverfront steps illuminated by brass oil lamps and evening river reflections.",
    category: "Culture & Heritage",
    aliases: ["dashashwamedh-ghat-aarti", "dashashwamedh-ghat-evening-maha-aarti", "dashashwamedh-ghat"]
  },

  // Leh Ladakh Landmarks
  "leh:thiksey-monastery-gompa": {
    imageUrl: "/images/places/leh/thiksey-monastery-gompa.webp",
    visualDescription: "Layered 12-storey whitewashed and ochre Tibetan monastery rising on a hill above the Indus Valley.",
    category: "Culture & Heritage",
    aliases: ["thiksey-monastery-gompa", "thiksey-monastery", "thiksey-gompa"]
  },

  // Spiti Valley Landmarks
  "spiti:key-monastery": {
    imageUrl: "/images/places/spiti/key-monastery.webp",
    visualDescription: "Thousand-year-old fort-like Tibetan monastery perched atop a rocky hill in the high-altitude cold desert.",
    category: "Culture & Heritage",
    aliases: ["key-monastery", "key-monastery-ki-gompa", "ki-gompa", "kye-gompa"]
  },
};

/**
 * Collision Guard: Detects duplicate asset assignment across unrelated destinations or places.
 */
export function detectArtworkCollisions(): string[] {
  const assetMap: Record<string, string[]> = {};
  const warnings: string[] = [];

  for (const [key, item] of Object.entries(EXACT_PLACE_REGISTRY)) {
    if (!assetMap[item.imageUrl]) {
      assetMap[item.imageUrl] = [];
    }
    assetMap[item.imageUrl].push(key);
  }

  for (const [imageUrl, keys] of Object.entries(assetMap)) {
    if (keys.length > 1) {
      const destinations = new Set(keys.map(k => k.split(":")[0]));
      if (destinations.size > 1) {
        const msg = `ARTWORK COLLISION: asset ${imageUrl} assigned to unrelated places across destinations: ${keys.join(", ")}`;
        console.warn(msg);
        warnings.push(msg);
      }
    }
  }

  return warnings;
}

export const DESTINATION_ASSET_MAP: Record<string, { hero: string; illustration: string; fallback: string }> = {
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

// Controlled semantic category taxonomy mapping
export function classifyCategoryTheme(category: string, placeName: string = ""): "cafe" | "nature" | "spiritual" | "stay" | "viewpoint" {
  const text = `${category || ""} ${placeName || ""}`.toLowerCase();

  if (
    text.includes("cafe") ||
    text.includes("coffee") ||
    text.includes("bakery") ||
    text.includes("food") ||
    text.includes("restaurant") ||
    text.includes("dhaba") ||
    text.includes("momo") ||
    text.includes("tibetan") ||
    text.includes("dining") ||
    text.includes("tea") ||
    text.includes("breakfast")
  ) {
    return "cafe";
  }

  if (
    text.includes("stay") ||
    text.includes("hotel") ||
    text.includes("resort") ||
    text.includes("cottage") ||
    text.includes("homestay") ||
    text.includes("hostel") ||
    text.includes("guesthouse") ||
    text.includes("accommodation")
  ) {
    return "stay";
  }

  if (
    text.includes("temple") ||
    text.includes("shrine") ||
    text.includes("monastery") ||
    text.includes("gompa") ||
    text.includes("church") ||
    text.includes("chapel") ||
    text.includes("spiritual") ||
    text.includes("ashram") ||
    text.includes("ghat") ||
    text.includes("heritage") ||
    text.includes("culture") ||
    text.includes("fort") ||
    text.includes("palace") ||
    text.includes("museum") ||
    text.includes("monument")
  ) {
    return "spiritual";
  }

  if (
    text.includes("trail") ||
    text.includes("waterfall") ||
    text.includes("cascade") ||
    text.includes("lake") ||
    text.includes("river") ||
    text.includes("forest") ||
    text.includes("trek") ||
    text.includes("park") ||
    text.includes("garden") ||
    text.includes("nature")
  ) {
    return "nature";
  }

  return "viewpoint";
}

// Destination-aware semantic fallback resolver
export function resolveSemanticRegionalFallback(destinationName: string, category: string, placeName: string = ""): string {
  const dLower = (destinationName || "").toLowerCase();
  const cLower = (category || "").toLowerCase();
  const pLower = (placeName || "").toLowerCase();
  const combined = `${dLower} ${cLower} ${pLower}`;

  if (
    combined.includes("beach") ||
    combined.includes("coast") ||
    combined.includes("sea") ||
    combined.includes("goa") ||
    combined.includes("kerala") ||
    combined.includes("gokarna") ||
    combined.includes("varkala") ||
    combined.includes("andaman") ||
    combined.includes("alappuzha") ||
    combined.includes("pondicherry")
  ) {
    return "/images/destinations/fallbacks/coastal.jpg";
  }

  if (
    combined.includes("desert") ||
    combined.includes("jaipur") ||
    combined.includes("jodhpur") ||
    combined.includes("jaisalmer") ||
    combined.includes("bikaner") ||
    combined.includes("rajasthan") ||
    combined.includes("thar") ||
    combined.includes("pushkar")
  ) {
    return "/images/destinations/fallbacks/desert.jpg";
  }

  if (
    combined.includes("varanasi") ||
    combined.includes("ganga") ||
    combined.includes("ghat") ||
    combined.includes("munnar") ||
    combined.includes("coorg") ||
    combined.includes("wayanad") ||
    combined.includes("ooty") ||
    combined.includes("meghalaya") ||
    combined.includes("shillong") ||
    combined.includes("tea")
  ) {
    return "/images/destinations/fallbacks/valley.jpg";
  }

  return "/images/destinations/fallbacks/himalayan.jpg";
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

  // Priority 1: Exact direct place key match in registry
  const lookupKey = `${destNorm}:${placeNorm}`;
  if (EXACT_PLACE_REGISTRY[lookupKey]) {
    const entry = EXACT_PLACE_REGISTRY[lookupKey];
    return {
      artworkKey: lookupKey,
      imageUrl: entry.imageUrl,
      fallbackUrl: destFallback,
      tier: "exact_place",
      placeName,
      destinationName,
      category,
      source: "curated_artwork",
      isRealPhoto: false,
      badgeLabel: "VANVAS PLACE ARTWORK",
      visualDescription: entry.visualDescription
    };
  }

  // Priority 2, 3, 4: Exact place matching against aliases and normalized tokens
  let bestExactMatch: { regKey: string; item: CuratedLandmarkEntry } | null = null;
  let bestScore = 0;
  const genericTokens = new Set([
    "aarti", "temple", "trail", "waterfall", "point", "viewpoint",
    "cove", "road", "lake", "palace", "fort", "cafe", "bakery",
    "hill", "ridge", "view", "falls", "market", "bazaar", "shop",
    "village", "quarter", "forest", "park", "shrine", "monastery",
    "gompa", "mountain", "ancient", "heritage", "pine", "scenic", "stream",
    "house", "complex", "center", "centre", "and", "the", "near", "rd", "hall"
  ]);

  for (const [regKey, item] of Object.entries(EXACT_PLACE_REGISTRY)) {
    const [regDest, regPlace] = regKey.split(":");
    if (regDest === destNorm || destNorm.includes(regDest) || regDest.includes(destNorm)) {
      let score = 0;
      const aliases = item.aliases || [regPlace];

      if (regPlace === placeNorm || aliases.includes(placeNorm)) {
        score = 100;
      } else {
        for (const al of aliases) {
          if (al === placeNorm) {
            score = Math.max(score, 100);
          } else if (placeNorm.includes(al)) {
            score = Math.max(score, 80 + al.length);
          } else if (al.includes(placeNorm)) {
            score = Math.max(score, 70 + placeNorm.length);
          }
        }

        if (score < 70) {
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
      }

      if (score > bestScore) {
        bestScore = score;
        bestExactMatch = { regKey, item };
      }
    }
  }

  if (bestExactMatch && bestScore >= 45) {
    return {
      artworkKey: bestExactMatch.regKey,
      imageUrl: bestExactMatch.item.imageUrl,
      fallbackUrl: destFallback,
      tier: "exact_place",
      placeName,
      destinationName,
      category,
      source: "curated_artwork",
      isRealPhoto: false,
      badgeLabel: "VANVAS PLACE ARTWORK",
      visualDescription: bestExactMatch.item.visualDescription
    };
  }

  // Priority 5: Destination Category Artwork (Truthful category fallback e.g. Mussoorie Cafe, Manali Nature)
  const categoryTheme = classifyCategoryTheme(category, placeName);
  if (matchedDestKey) {
    const categoryArtworkPath = `/images/places/${matchedDestKey}/categories/${categoryTheme}.webp`;
    return {
      artworkKey: `${matchedDestKey}:${categoryTheme}`,
      imageUrl: categoryArtworkPath,
      fallbackUrl: destFallback,
      tier: "destination_category",
      placeName,
      destinationName,
      category,
      source: "curated_artwork",
      isRealPhoto: false,
      badgeLabel: isLive ? "LIVE PLACE" : "DESTINATION CATEGORY ART",
      visualDescription: `Authentic ${destinationName} ${categoryTheme} artwork.`
    };
  }

  // Priority 6: Destination Artwork (Authentic, bright high-resolution illustration/hero)
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

  // Priority 7 & 8: Semantic Regional Fallback for unseeded / non-curated destinations (Delhi, Pune, Kolkata, etc.)
  const regionalImg = resolveSemanticRegionalFallback(destinationName, category, placeName);

  return {
    artworkKey: `regional:${destNorm}:${categoryTheme}`,
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

