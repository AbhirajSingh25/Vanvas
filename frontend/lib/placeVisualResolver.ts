/**
 * VANVAS Central Visual Intelligence & Place Artwork Resolver
 * 
 * Strict 10-Level Resolution Hierarchy:
 * LEVEL 1: Verified exact-place real photograph -> [ EXACT PLACE PHOTO ]
 * LEVEL 2: Verified exact-place Wikimedia / trusted photo -> [ EXACT PLACE PHOTO ]
 * LEVEL 3: Verified provider / live place photo -> [ LIVE PLACE PHOTO ]
 * LEVEL 4: Curated exact-place artwork (unique to landmark) -> [ VANVAS PLACE ARTWORK ]
 * LEVEL 5: Place-type / category-specific real photograph -> [ DESTINATION CATEGORY ART ]
 * LEVEL 6: Place-type / category-specific destination artwork -> [ DESTINATION CATEGORY ART ]
 * LEVEL 7: Regional category artwork -> [ REGIONAL ART ]
 * LEVEL 8: Universal category artwork -> [ UNIVERSAL FALLBACK ]
 * LEVEL 9: Generic destination artwork (ONLY IF semantically safe; NEVER for stays/cafes/monasteries) -> [ DESTINATION ART ]
 * LEVEL 10: Guaranteed universal safety fallback -> [ UNIVERSAL FALLBACK ]
 */

import { ImageContract, ProvenanceBadge, ImageProvenanceTier, ImageSourceType, ImageExactness } from "@/types";

export type VisualCategory =
  | "food"
  | "restaurant"
  | "cafe"
  | "bakery"
  | "street_food"
  | "market"
  | "shopping"
  | "hotel"
  | "hostel"
  | "homestay"
  | "guesthouse"
  | "stay"
  | "temple"
  | "church"
  | "mosque"
  | "monastery"
  | "ashram"
  | "heritage"
  | "fort"
  | "palace"
  | "museum"
  | "gallery"
  | "trail"
  | "nature"
  | "waterfall"
  | "lake"
  | "river"
  | "beach"
  | "viewpoint"
  | "park"
  | "garden"
  | "village"
  | "nightlife"
  | "activity"
  | "transport"
  | "rental"
  | "service"
  | "medical";

export type SemanticTheme =
  | "cafe"
  | "food"
  | "stay"
  | "monastery"
  | "church"
  | "spiritual"
  | "heritage"
  | "trail"
  | "nature"
  | "waterfall"
  | "lake"
  | "beach"
  | "viewpoint"
  | "shopping"
  | "nightlife"
  | "activity"
  | "transport"
  | "medical"
  | "service";

export type ArtworkTier = ImageProvenanceTier;

export type AssetQualityStatus = "APPROVED" | "DEPRECATED" | "REVIEW_REQUIRED";

/**
 * Validates whether an image asset meets strict VANVAS visual quality standards.
 * Rejects flat vectors, geometric illustrations, generic placeholders, and broken paths.
 */
export function getAssetQualityStatus(url?: string | null): AssetQualityStatus {
  if (!url || typeof url !== "string") return "DEPRECATED";
  const trimmed = url.trim().toLowerCase();
  if (trimmed.length === 0 || trimmed === "null" || trimmed === "undefined") return "DEPRECATED";

  const deprecatedSubstrings = [
    "placeholder",
    "via.placeholder",
    "default-",
    "default_",
    "vector",
    "clipart",
    ".svg",
    "cartoon",
    "geometric",
    "icon-",
    "simple-moon",
    "generic-house",
    "flat-art",
    "dummy"
  ];

  for (const pat of deprecatedSubstrings) {
    if (trimmed.includes(pat)) {
      return "DEPRECATED";
    }
  }

  if (
    trimmed.startsWith("/images/") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://")
  ) {
    if (
      trimmed.endsWith(".webp") ||
      trimmed.endsWith(".jpg") ||
      trimmed.endsWith(".jpeg") ||
      trimmed.endsWith(".png") ||
      trimmed.includes("unsplash.com") ||
      trimmed.includes("wikimedia.org") ||
      trimmed.includes("openstreetmap.org")
    ) {
      return "APPROVED";
    }
  }

  return "DEPRECATED";
}

export function isApprovedAsset(url?: string | null): boolean {
  return getAssetQualityStatus(url) === "APPROVED";
}

export interface PlaceArtworkResult extends ImageContract {
  artworkKey: string;
  imageUrl: string;
  fallbackUrl?: string;
  tier: ArtworkTier;
  placeName: string;
  destinationName: string;
  category: string;
  semanticTheme: SemanticTheme;
  isRealPhoto: boolean;
  badgeLabel: ProvenanceBadge;
  visualDescription?: string;
}

export function normalizeKey(str: string): string {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Strip diacritics / accents
    .toLowerCase()
    .replace(/['’`]/g, "") // Strip apostrophes cleanly
    .replace(/&/g, "and") // Replace ampersands
    .replace(/[^a-z0-9]/g, "-") // Replace non-alphanumeric with dash
    .replace(/-+/g, "-") // Collapse consecutive dashes
    .replace(/^-|-$/g, ""); // Trim leading/trailing dash
}

export interface CuratedLandmarkEntry {
  imageUrl: string;
  visualDescription: string;
  category: string;
  semanticTheme: SemanticTheme;
  sourceType?: ImageSourceType;
  source?: string;
  attribution?: string;
  aliases: string[];
}

/**
 * Authoritative Registry of Curated Exact Landmark Artwork Mappings.
 * Every curated landmark has a dedicated, verified editorial WebP asset on disk.
 */
export const EXACT_PLACE_REGISTRY: Record<string, CuratedLandmarkEntry> = {
  // ==========================================
  // --- JAIPUR LANDMARKS ---
  // ==========================================
  "jaipur:hawa-mahal": {
    imageUrl: "/images/places/jaipur/hawa-mahal.webp",
    visualDescription: "Five-storey pink sandstone honeycomb facade with 953 carved jharokha lattice windows.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "hawa-mahal",
      "hawa-mahal-palace-of-winds",
      "palace-of-winds",
      "hawa-mahal-jaipur",
      "hawa"
    ]
  },
  "jaipur:amber-fort": {
    imageUrl: "/images/places/jaipur/amber-fort.webp",
    visualDescription: "Majestic hilltop fort with pale yellow and pink sandstone ramparts reflected in Maota Lake.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "amber-fort",
      "amber-fort-and-maota-lake",
      "amber-palace-fort",
      "amer-fort",
      "amber-palace",
      "amer-palace",
      "amber-fort-maota-lake",
      "amber",
      "amer"
    ]
  },
  "jaipur:nahargarh-fort": {
    imageUrl: "/images/places/jaipur/nahargarh-fort.webp",
    visualDescription: "Aravalli ridge fortress offering panoramic sunset views across the pink city expanse.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "nahargarh-fort",
      "nahargarh-fort-sunset",
      "nahargarh-fort-sunset-bastion",
      "nahargarh"
    ]
  },
  "jaipur:city-palace": {
    imageUrl: "/images/places/jaipur/city-palace.webp",
    visualDescription: "Royal complex of courtyards, gardens, and ornate pavilions fusing Rajput and Mughal architecture.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "city-palace",
      "city-palace-jaipur",
      "jaipur-city-palace",
      "city-palace-complex-jaipur"
    ]
  },
  "jaipur:jantar-mantar": {
    imageUrl: "/images/places/jaipur/jantar-mantar.webp",
    visualDescription: "UNESCO World Heritage 18th-century astronomical observatory with stone sundials and geometric instruments.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jantar-mantar",
      "jantar-mantar-jaipur",
      "jantar-mantar-observatory"
    ]
  },

  // ==========================================
  // --- LEH LADAKH LANDMARKS ---
  // ==========================================
  "leh:leh-palace": {
    imageUrl: "/images/places/leh/leh-palace.webp",
    visualDescription: "Historic 17th-century Tibetan royal palace crowning the mountain ridge over Leh old town.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "leh-palace",
      "palace-of-leh",
      "leh-chen-spalkhar",
      "leh-royal-palace",
      "royal-leh-palace"
    ]
  },
  "leh:pangong-tso": {
    imageUrl: "/images/places/leh/pangong-tso.webp",
    visualDescription: "High-altitude saline lake shifting in shades of cobalt and turquoise under barren Himalayan crags.",
    category: "Nature & Trails",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "pangong-tso",
      "pangong-tso-lake",
      "pangong-tso-alpine-lake",
      "pangong-lake",
      "pangong"
    ]
  },
  "leh:thiksey-monastery-gompa": {
    imageUrl: "/images/places/leh/thiksey-monastery-gompa.webp",
    visualDescription: "Layered 12-storey whitewashed and ochre Tibetan monastery rising on a hill above the Indus Valley.",
    category: "Culture & Heritage",
    semanticTheme: "monastery",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "thiksey-monastery-gompa",
      "thiksey-monastery",
      "thiksey-gompa",
      "thiksay",
      "thiksey"
    ]
  },
  "leh:himalayan-450-expedition": {
    imageUrl: "/images/places/universal/transport.webp",
    visualDescription: "Himalayan adventure motorcycle expedition traversing high mountain passes.",
    category: "Mobility & Transport",
    semanticTheme: "transport",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "himalayan-450-expedition",
      "himalayan-450",
      "scooter-and-motorcycle-rentals",
      "motorcycle-rental",
      "scooter-rental",
      "leh-bike-rental"
    ]
  },

  // ==========================================
  // --- UDAIPUR LANDMARKS ---
  // ==========================================
  "udaipur:bagore-ki-haveli": {
    imageUrl: "/images/places/udaipur/bagore-ki-haveli.webp",
    visualDescription: "Historic 18th-century noble mansion at Gangaur Ghat with ornate stone jharokhas and evening Dharohar folk dance.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bagore-ki-haveli",
      "bagore-ki-haveli-and-evening-folk-dance",
      "bagore-ki-haveli-evening-folk-dance",
      "bagore-haveli",
      "dharohar-folk-dance",
      "bagore"
    ]
  },
  "udaipur:city-palace-udaipur": {
    imageUrl: "/images/places/udaipur/city-palace-udaipur.webp",
    visualDescription: "Monumental whitewashed marble palace with mirrored domes rising over the eastern shore of Lake Pichola.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "city-palace-udaipur",
      "city-palace-of-udaipur",
      "city-palace",
      "udaipur-city-palace"
    ]
  },
  "udaipur:lake-pichola": {
    imageUrl: "/images/places/udaipur/lake-pichola.webp",
    visualDescription: "Picturesque freshwater lake surrounded by whitewashed havelis, ghats, and hill silhouettes.",
    category: "Nature & Trails",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "lake-pichola",
      "lake-pichola-boat",
      "lake-pichola-sunset-boat-voyage",
      "pichola-lake",
      "pichola"
    ]
  },
  "udaipur:jagdish-temple": {
    imageUrl: "/images/places/udaipur/jagdish-temple.webp",
    visualDescription: "Indo-Aryan carved stone temple dedicated to Lord Vishnu in the heart of Udaipur.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jagdish-temple",
      "jagdish-mandir",
      "shri-jagdish-temple",
      "jagdish"
    ]
  },
  "udaipur:saheliyon-ki-bari": {
    imageUrl: "/images/places/udaipur/saheliyon-ki-bari.webp",
    visualDescription: "Historic royal garden with marble pavilions, lotus pools, and natural rain fountains.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "saheliyon-ki-bari",
      "saheliyon-ki-bari-garden-of-the-maids",
      "garden-of-the-maids",
      "saheliyon-bari"
    ]
  },

  // ==========================================
  // --- DHARAMSHALA / MCLEOD GANJ LANDMARKS ---
  // ==========================================
  "dharamshala:namgyal-monastery": {
    imageUrl: "/images/places/dharamshala/namgyal-monastery.webp",
    visualDescription: "Dalai Lama monastery complex with prayer wheels surrounded by cedar woods under the Dhauladhar wall.",
    category: "Culture & Heritage",
    semanticTheme: "monastery",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "namgyal-monastery",
      "namgyal-monastery-and-tsuglagkhang-complex",
      "tsuglagkhang-complex",
      "namgyal-gompa",
      "namgyal"
    ]
  },
  "dharamshala:bhagsunag-waterfall": {
    imageUrl: "/images/places/dharamshala/bhagsunag-waterfall.webp",
    visualDescription: "Fresh mountain waterfall tumbling down rocky cliffs with bohemian Shiva Café above.",
    category: "Nature & Trails",
    semanticTheme: "waterfall",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bhagsunag-waterfall",
      "bhagsunag-waterfall-and-shiva-cafe",
      "bhagsu-waterfall",
      "bhagsu-falls",
      "bhagsunag"
    ]
  },
  "dharamshala:triund-trek": {
    imageUrl: "/images/places/dharamshala/triund-trek.webp",
    visualDescription: "High-altitude ridge trail opening to views of the sheer Dhauladhar granite wall and Kangra valley.",
    category: "Adventure",
    semanticTheme: "trail",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "triund-trek",
      "triund-high-ridge-himalayan-trek",
      "triund-trail",
      "triund"
    ]
  },

  // ==========================================
  // --- VARANASI LANDMARKS ---
  // ==========================================
  "varanasi:dashashwamedh-ghat-aarti": {
    imageUrl: "/images/places/varanasi/dashashwamedh-ghat-aarti.webp",
    visualDescription: "Historic stone riverfront steps illuminated by brass oil lamps and evening river reflections.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dashashwamedh-ghat-aarti",
      "dashashwamedh-ghat-evening-maha-aarti",
      "dashashwamedh-ghat",
      "dashashwamedh"
    ]
  },
  "varanasi:assi-ghat": {
    imageUrl: "/images/places/varanasi/assi-ghat.webp",
    visualDescription: "Southernmost sacred ghat at the Assi-Ganga confluence famous for morning yoga, Vedic chants, and sunrise mist.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "assi-ghat",
      "assi-ghat-subah",
      "assi-ghat-and-subah-e-banaras-dawn-chants",
      "asi-ghat",
      "assi"
    ]
  },
  "varanasi:kashi-vishwanath": {
    imageUrl: "/images/places/varanasi/kashi-vishwanath.webp",
    visualDescription: "Sacred golden-spired temple of Lord Shiva along the eternal sandstone corridor of Kashi.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kashi-vishwanath",
      "kashi-vishwanath-golden-temple-corridor",
      "kashi-vishwanath-temple",
      "vishwanath-temple",
      "kashi-vishwanath-golden-temple"
    ]
  },
  "varanasi:blue-lassi-shop": {
    imageUrl: "/images/places/varanasi/blue-lassi-shop.webp",
    visualDescription: "Historic alley shop serving thick hand-churned curd lassi in clay kulhad with fresh fruit and rabri.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "blue-lassi-shop",
      "blue-lassi",
      "blue-lassi-traditional-shop"
    ]
  },
  "varanasi:sarnath": {
    imageUrl: "/images/places/varanasi/sarnath.webp",
    visualDescription: "Sacred deer park and monumental Dhamek Stupa where Lord Buddha gave his first sermon.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sarnath",
      "sarnath-stupa",
      "sarnath-sacred-deer-park-and-dhamek-stupa",
      "dhamek-stupa"
    ]
  },

  // ==========================================
  // --- MANALI LANDMARKS ---
  // ==========================================
  "manali:hadimba-temple": {
    imageUrl: "/images/places/manali/hadimba-temple.webp",
    visualDescription: "Four-tiered wooden pagoda temple set inside Dhungri towering deodar pine forest.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "hadimba-temple",
      "hadimba-devi-cedar-forest-temple",
      "hidimba-devi-temple",
      "dhungri-temple",
      "hidimba-temple",
      "hadimba"
    ]
  },
  "manali:solang-valley": {
    imageUrl: "/images/places/manali/solang-valley.webp",
    visualDescription: "Expansive green alpine valley surrounded by snow-capped Pir Panjal peaks with paragliders in azure sky.",
    category: "Adventure & Sport",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "solang-valley",
      "solang-valley-alpine-meadow",
      "solang-valley-ridge-and-paragliding",
      "solang-nullah",
      "solang"
    ]
  },
  "manali:old-manali": {
    imageUrl: "/images/places/manali/old-manali.webp",
    visualDescription: "Traditional timber-and-stone Himachali houses, apple orchards, and bohemian riverside verandas.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "old-manali",
      "old-manali-village-and-manu-temple",
      "old-manali-village",
      "old-manali-village-and-cafes"
    ]
  },
  "manali:jogini-waterfall": {
    imageUrl: "/images/places/manali/jogini-waterfall.webp",
    visualDescription: "Scenic cascading waterfall plunging down pine-clad cliffs near Vashisht village.",
    category: "Nature & Trails",
    semanticTheme: "waterfall",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jogini-waterfall",
      "jogini-waterfall-pine-trail",
      "jogini-falls",
      "jugni-waterfall",
      "jogini"
    ]
  },
  "manali:mall-road": {
    imageUrl: "/images/places/manali/mall-road.webp",
    visualDescription: "Bustling Himalayan pedestrian promenade with wooden shops, local woolen shawls, and mountain views.",
    category: "Markets & Craft",
    semanticTheme: "shopping",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mall-road",
      "manali-mall-road",
      "the-mall-road-manali"
    ]
  },
  "manali:manu-temple": {
    imageUrl: "/images/places/manali/manu-temple.webp",
    visualDescription: "Ancient stone and wood pagoda temple dedicated to Sage Manu above Old Manali.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "manu-temple",
      "sage-manu-temple",
      "manu-mandir"
    ]
  },
  "manali:vashisht-baths": {
    imageUrl: "/images/places/manali/vashisht-baths.webp",
    visualDescription: "Natural sacred hot sulphur springs and ancient carved stone temple in Vashisht village.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "vashisht-baths",
      "vashisht-hot-water-springs",
      "vashisht-temple-and-springs",
      "vashisht"
    ]
  },

  // ==========================================
  // --- KASOL / PARVATI VALLEY LANDMARKS ---
  // ==========================================
  "kasol:moon-dance-cafe": {
    imageUrl: "/images/places/kasol/moon-dance-cafe.webp",
    visualDescription: "Legendary bohemian bakery in Kasol serving fresh apple crumble, pastries, and mountain coffee under Parvati deodars.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "moon-dance-cafe",
      "moon-dance-cafe-and-german-bakery",
      "moon-dance-german-bakery",
      "moon-dance-bakery",
      "german-bakery-kasol",
      "moon-dance"
    ]
  },
  "kasol:chalal-trail": {
    imageUrl: "/images/places/kasol/chalal-trail.webp",
    visualDescription: "Scenic suspended cable bridge path following the emerald Parvati river through ancient towering pine woods to Chalal village.",
    category: "Nature & Trails",
    semanticTheme: "trail",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chalal-trail",
      "chalal-pine-riverside-trail",
      "chalal-pine-trail",
      "chalal-riverside-walk",
      "chalal-village-trail",
      "chalal"
    ]
  },
  "kasol:manikaran-sahib": {
    imageUrl: "/images/places/kasol/manikaran-sahib.webp",
    visualDescription: "Historic sacred hot sulphur springs and Gurudwara complex nestled along the roaring Parvati River gorge.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "manikaran-sahib",
      "manikaran-gurudwara",
      "manikaran-hot-springs",
      "gurudwara-shri-manikaran-sahib",
      "gurudwara-shri-manikaran-sahib-and-hot-springs",
      "manikaran"
    ]
  },
  "kasol:kheerganga-trail": {
    imageUrl: "/images/places/kasol/kheerganga-trail.webp",
    visualDescription: "Exhilarating Himalayan trekking trail ascending through pine forests to high alpine meadows and natural hot baths.",
    category: "Nature & Trails",
    semanticTheme: "trail",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kheerganga-trail",
      "kheerganga-trek",
      "kheerganga-alpine-meadow-trail",
      "khirganga-trail",
      "khirganga",
      "kheerganga"
    ]
  },
  "kasol:tosh-village": {
    imageUrl: "/images/places/kasol/tosh-village.webp",
    visualDescription: "Traditional wooden Himachali village at 2,400m perched at the edge of Tosh Glacier with panoramic snow peak vistas.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "tosh-village",
      "tosh-traditional-wooden-village",
      "tosh-glacier-view",
      "tosh-village-and-waterfall-trail",
      "tosh"
    ]
  },
  "kasol:evergreen-cafe": {
    imageUrl: "/images/places/kasol/evergreen-cafe.webp",
    visualDescription: "Beloved garden café shaded by deodar pines famous for fresh Israeli platters, wood-fired pizza, and mountain teas.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "evergreen-cafe",
      "evergreen-cafe-and-garden-patio",
      "evergreen-cafe-and-garden",
      "evergreen-kasol",
      "evergreen"
    ]
  },

  // ==========================================
  // --- MUSSOORIE / LANDOUR LANDMARKS ---
  // ==========================================
  "mussoorie:st-pauls-church": {
    imageUrl: "/images/places/mussoorie/st-pauls-church.webp",
    visualDescription: "Historic 1852 stone Anglican church in Landour with steep gabled wooden roof and lancet windows under deodar pines.",
    category: "Culture & Heritage",
    semanticTheme: "church",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "st-pauls-church-landour",
      "st-pauls-church",
      "st-paul-church"
    ]
  },
  "mussoorie:landour-bakehouse": {
    imageUrl: "/images/places/mussoorie/landour-bakehouse.webp",
    visualDescription: "Historic stone and timber hill bakery at Sisters Bazaar with Victorian glass vitrines and deodar canopy.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "landour-bakehouse",
      "landour-bakery",
      "sisters-bazaar-bakehouse"
    ]
  },
  "mussoorie:lal-tibba": {
    imageUrl: "/images/places/mussoorie/lal-tibba.webp",
    visualDescription: "Highest mountain ridge viewpoint in Landour with telescope overlooking distant Garhwal snow peaks.",
    category: "Nature & Trails",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "lal-tibba",
      "lal-tibba-scenic-viewpoint",
      "lal-tibba-viewpoint"
    ]
  },
  "mussoorie:kempty-falls": {
    imageUrl: "/images/places/mussoorie/kempty-falls.webp",
    visualDescription: "Steep rocky mountain waterfall cascade plunging into jade mountain pools.",
    category: "Nature & Trails",
    semanticTheme: "waterfall",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kempty-falls",
      "kempty-falls-mountain-cascade",
      "kempty-waterfall",
      "kempty"
    ]
  },
  "mussoorie:gun-hill": {
    imageUrl: "/images/places/mussoorie/gun-hill.webp",
    visualDescription: "Elevated colonial peak with ropeway cable car overlooking the vast Doon Valley.",
    category: "Culture & Heritage",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "gun-hill",
      "gun-hill-historic-viewpoint",
      "gun-hill-viewpoint"
    ]
  },
  "mussoorie:camel-back-road": {
    imageUrl: "/images/places/mussoorie/camel-back-road.webp",
    visualDescription: "Tranquil oak-shaded walking promenade framing natural camel rock outcrop and winterline sunsets.",
    category: "Nature & Trails",
    semanticTheme: "trail",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "camel-back-road",
      "camels-back-road",
      "camels-back-road-and-winterline-trail",
      "camels-back-road-promenade"
    ]
  },
  "mussoorie:clouds-end": {
    imageUrl: "/images/places/mussoorie/clouds-end.webp",
    visualDescription: "Dense oak and deodar wilderness marking the geographical end of the Mussoorie hill ridge.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "clouds-end",
      "clouds-end-forest-retreat",
      "clouds-end-heritage"
    ]
  },
  "mussoorie:george-everest": {
    imageUrl: "/images/places/mussoorie/george-everest.webp",
    visualDescription: "Historic estate and ridge viewpoint of the Surveyor General of India offering panoramic vistas.",
    category: "Culture & Heritage",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "george-everest",
      "george-everest-peak",
      "george-everest-house",
      "sir-george-everest"
    ]
  },
  "mussoorie:landour": {
    imageUrl: "/images/places/mussoorie/landour.webp",
    visualDescription: "Peaceful colonial cantonment hill settlement with pine trails and red-roofed cottages.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "landour",
      "landour-cantonment",
      "landour-hill"
    ]
  },
  "mussoorie:mall-road": {
    imageUrl: "/images/places/mussoorie/mall-road.webp",
    visualDescription: "Colonial-era hilltop promenade with street lamps, heritage bookshops, and Doon valley views.",
    category: "Markets & Craft",
    semanticTheme: "shopping",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mall-road",
      "mussoorie-mall-road",
      "the-mall-road-mussoorie"
    ]
  },

  // ==========================================
  // --- GOA LANDMARKS ---
  // ==========================================
  "goa:fontainhas-latin-quarter": {
    imageUrl: "/images/places/goa/fontainhas-latin-quarter.webp",
    visualDescription: "Pastel-painted Portuguese heritage houses with wrought-iron balconies and bougainvillea in Panaji.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "fontainhas-latin-quarter",
      "fontainhas",
      "fontainhas-latin-heritage-quarter"
    ]
  },
  "goa:aguada-fort": {
    imageUrl: "/images/places/goa/aguada-fort.webp",
    visualDescription: "17th-century Portuguese laterite stone sea fortress and cylindrical lighthouse on coastal headland.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "aguada-fort",
      "aguada-fort-and-historic-lighthouse",
      "fort-aguada",
      "aguada"
    ]
  },
  "goa:anjuna-beach": {
    imageUrl: "/images/places/goa/anjuna-beach.webp",
    visualDescription: "Curved palm-fringed Arabian sea coastline with rocky laterite outcrops and seaside shacks.",
    category: "Nature & Trails",
    semanticTheme: "beach",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "anjuna-beach",
      "anjuna-flea-market",
      "anjuna"
    ]
  },
  "goa:basilica-bom-jesus": {
    imageUrl: "/images/places/goa/basilica-bom-jesus.webp",
    visualDescription: "UNESCO World Heritage 16th-century baroque laterite basilica holding the mortal remains of St. Francis Xavier.",
    category: "Culture & Heritage",
    semanticTheme: "church",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "basilica-bom-jesus",
      "basilica-of-bom-jesus",
      "bom-jesus-basilica",
      "bom-jesus"
    ]
  },
  "goa:dudhsagar-falls": {
    imageUrl: "/images/places/goa/dudhsagar-falls.webp",
    visualDescription: "Four-tiered massive milky white waterfall cascading down Western Ghats cliffs with railway viaduct.",
    category: "Nature & Trails",
    semanticTheme: "waterfall",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dudhsagar-falls",
      "dudhsagar-waterfalls",
      "dudhsagar"
    ]
  },

  // ==========================================
  // --- MUNNAR LANDMARKS ---
  // ==========================================
  "munnar:kolukkumalai-tea": {
    imageUrl: "/images/places/munnar/kolukkumalai-tea.webp",
    visualDescription: "World's highest organic tea plantation perched at 2,160m with sunrise cloud inversions.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kolukkumalai-tea",
      "kolukkumalai-highest-tea-estate",
      "kolukkumalai-tea-estate",
      "kolukkumalai"
    ]
  },
  "munnar:eravikulam-park": {
    imageUrl: "/images/places/munnar/eravikulam-park.webp",
    visualDescription: "High-altitude rolling grassland sanctuary home to the Nilgiri Tahr and Anamudi peak.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "eravikulam-park",
      "eravikulam-national-park-and-anamudi-ridge",
      "eravikulam-national-park",
      "eravikulam"
    ]
  },
  "munnar:mattupetty-dam": {
    imageUrl: "/images/places/munnar/mattupetty-dam.webp",
    visualDescription: "Tranquil concrete gravity dam surrounded by emerald tea plantation slopes reflecting in the lake.",
    category: "Nature & Trails",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mattupetty-dam",
      "mattupetty-dam-and-reflection-lake",
      "mattupetty-lake",
      "mattupetty"
    ]
  },

  // ==========================================
  // --- RISHIKESH LANDMARKS ---
  // ==========================================
  "rishikesh:triveni-ghat": {
    imageUrl: "/images/places/rishikesh/triveni-ghat.webp",
    visualDescription: "Sacred stone riverfront steps at the Ganges confluence with twilight brass aarti lamps and floating diyas.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "triveni-ghat",
      "triveni-ghat-evening-maha-aarti",
      "triveni-ghat-aarti",
      "triveni"
    ]
  },
  "rishikesh:little-buddha-cafe": {
    imageUrl: "/images/places/rishikesh/little-buddha-cafe.webp",
    visualDescription: "Treehouse café overlooking the emerald Ganga and Lakshman Jhula with sunset mountain views.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "little-buddha-cafe",
      "the-little-buddha-cafe",
      "little-buddha"
    ]
  },
  "rishikesh:beatles-ashram": {
    imageUrl: "/images/places/rishikesh/beatles-ashram.webp",
    visualDescription: "Transcendental meditation ashram tucked inside Rajaji Tiger Reserve with stone meditation domes and murals.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "beatles-ashram",
      "the-beatles-ashram-chaurasi-kutia",
      "chaurasi-kutia",
      "beatles-ashram-rishikesh"
    ]
  },
  "rishikesh:neer-garh-waterfall": {
    imageUrl: "/images/places/rishikesh/neer-garh-waterfall.webp",
    visualDescription: "Tiered jade-colored natural spring waterfall cascading into jungle limestone pools.",
    category: "Nature & Trails",
    semanticTheme: "waterfall",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "neer-garh-waterfall",
      "neer-garh-multi-tier-waterfall",
      "neer-garh",
      "neer-waterfall"
    ]
  },
  "rishikesh:laxman-jhula": {
    imageUrl: "/images/places/rishikesh/laxman-jhula.webp",
    visualDescription: "Historic iron suspension bridge spanning the sacred turquoise Ganga between Tapovan and Jonk.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "laxman-jhula",
      "lakshman-jhula",
      "laxman-suspension-bridge"
    ]
  },
  "rishikesh:ram-jhula": {
    imageUrl: "/images/places/rishikesh/ram-jhula.webp",
    visualDescription: "Graceful pedestrian suspension bridge connecting vibrant ashrams across the holy Ganga.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "ram-jhula",
      "ram-suspension-bridge"
    ]
  },
  "rishikesh:parmarth-niketan": {
    imageUrl: "/images/places/rishikesh/parmarth-niketan.webp",
    visualDescription: "Expansive spiritual ashram on the Ganga banks famous for Vedic chanting and Lord Shiva statue reflections.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "parmarth-niketan",
      "parmarth-niketan-ganga-aarti",
      "parmarth-ashram",
      "parmarth-niketan-ashram",
      "parmarth"
    ]
  },
  "rishikesh:shivpuri-rafting": {
    imageUrl: "/images/places/rishikesh/shivpuri-rafting.webp",
    visualDescription: "Thrilling white water rafting expedition through emerald Himalayan Ganga rapids.",
    category: "Adventure",
    semanticTheme: "activity",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "shivpuri-rafting",
      "shivpuri-white-water-rafting",
      "shivpuri-river-rafting",
      "rishikesh-rafting",
      "shivpuri"
    ]
  },

  // ==========================================
  // --- SPITI VALLEY LANDMARKS ---
  // ==========================================
  "spiti:key-monastery": {
    imageUrl: "/images/places/spiti/key-monastery.webp",
    visualDescription: "Thousand-year-old fort-like Tibetan monastery perched atop a rocky hill at 4,166m overlooking the Spiti River.",
    category: "Culture & Heritage",
    semanticTheme: "monastery",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "key-monastery",
      "key-monastery-ki-gompa",
      "key-monastery-kye-gompa",
      "ki-gompa",
      "kye-gompa",
      "key-gompa"
    ]
  },
  "spiti:chandratal-lake": {
    imageUrl: "/images/places/spiti/chandratal-lake.webp",
    visualDescription: "Crescent-shaped pristine alpine lake situated at 4,300m in the cold desert of Spiti.",
    category: "Nature & Trails",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chandratal-lake",
      "chandratal",
      "chandra-taal",
      "chandratal-moon-lake-glacial-sanctuary",
      "moon-lake"
    ]
  },
  "spiti:dhankar-gompa": {
    imageUrl: "/images/places/spiti/dhankar-gompa.webp",
    visualDescription: "Cliff-hanging ancient Buddhist monastery overlooking the dramatic Spiti and Pin rivers confluence.",
    category: "Culture & Heritage",
    semanticTheme: "monastery",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dhankar-gompa",
      "dhankar-monastery",
      "dankhar"
    ]
  },
  "spiti:tabo-monastery": {
    imageUrl: "/images/places/spiti/tabo-monastery.webp",
    visualDescription: "Thousand-year-old mud-brick Tibetan Buddhist monastic complex with ancient stupas and mural halls.",
    category: "Culture & Heritage",
    semanticTheme: "monastery",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "tabo-monastery",
      "tabo-gompa",
      "tabo",
      "tabo-monastery-ajanta-of-the-himalayas"
    ]
  },
  "spiti:kaza": {
    imageUrl: "/images/places/spiti/kaza.webp",
    visualDescription: "High-altitude administrative capital town with whitewashed mud homes and local handicraft bazaar.",
    category: "Shops & Markets",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kaza",
      "kaza-town",
      "kaza-market",
      "kaza-high-town-and-local-bazaar"
    ]
  }
};

/**
 * Category-aware destination artwork registry.
 * Maps destination keys to dedicated category assets.
 */
export const DESTINATION_CATEGORY_REGISTRY: Record<
  string,
  {
    generic: string;
    categories: Partial<Record<SemanticTheme, string>>;
  }
> = {
  jaipur: {
    generic: "/images/destinations/jaipur/hero.jpg",
    categories: {
      stay: "/images/places/jaipur/categories/stay.webp",
      cafe: "/images/places/jaipur/categories/cafe.webp",
      food: "/images/places/jaipur/categories/cafe.webp",
      nature: "/images/places/jaipur/categories/nature.webp",
      trail: "/images/places/jaipur/categories/nature.webp",
      heritage: "/images/places/jaipur/categories/heritage.webp",
      spiritual: "/images/places/jaipur/categories/spiritual.webp",
      viewpoint: "/images/places/jaipur/categories/viewpoint.webp",
      waterfall: "/images/places/jaipur/categories/waterfall.webp",
      lake: "/images/places/jaipur/categories/lake.webp",
      monastery: "/images/places/jaipur/categories/monastery.webp",
      church: "/images/places/jaipur/categories/church.webp",
      beach: "/images/places/jaipur/categories/beach.webp",
      shopping: "/images/places/jaipur/categories/cafe.webp",
      transport: "/images/places/universal/transport.webp"
    }
  },
  leh: {
    generic: "/images/destinations/leh/hero.jpg",
    categories: {
      stay: "/images/places/leh/categories/stay.webp",
      cafe: "/images/places/leh/categories/cafe.webp",
      food: "/images/places/leh/categories/cafe.webp",
      nature: "/images/places/leh/categories/nature.webp",
      trail: "/images/places/leh/categories/nature.webp",
      lake: "/images/places/leh/categories/lake.webp",
      monastery: "/images/places/leh/categories/monastery.webp",
      heritage: "/images/places/leh/categories/heritage.webp",
      spiritual: "/images/places/leh/categories/spiritual.webp",
      viewpoint: "/images/places/leh/categories/viewpoint.webp",
      waterfall: "/images/places/leh/categories/waterfall.webp",
      church: "/images/places/leh/categories/church.webp",
      beach: "/images/places/leh/categories/beach.webp",
      shopping: "/images/places/leh/categories/cafe.webp",
      transport: "/images/places/universal/transport.webp"
    }
  },
  udaipur: {
    generic: "/images/destinations/udaipur/hero.jpg",
    categories: {
      stay: "/images/places/udaipur/categories/stay.webp",
      cafe: "/images/places/udaipur/categories/cafe.webp",
      food: "/images/places/udaipur/categories/cafe.webp",
      nature: "/images/places/udaipur/categories/nature.webp",
      trail: "/images/places/udaipur/categories/nature.webp",
      lake: "/images/places/udaipur/categories/lake.webp",
      heritage: "/images/places/udaipur/categories/heritage.webp",
      spiritual: "/images/places/udaipur/categories/spiritual.webp",
      viewpoint: "/images/places/udaipur/categories/viewpoint.webp",
      waterfall: "/images/places/udaipur/categories/waterfall.webp",
      monastery: "/images/places/udaipur/categories/monastery.webp",
      church: "/images/places/udaipur/categories/church.webp",
      beach: "/images/places/udaipur/categories/beach.webp",
      shopping: "/images/places/udaipur/categories/cafe.webp",
      transport: "/images/places/universal/transport.webp"
    }
  },
  dharamshala: {
    generic: "/images/destinations/dharamshala/hero.jpg",
    categories: {
      stay: "/images/places/dharamshala/categories/stay.webp",
      cafe: "/images/places/dharamshala/categories/cafe.webp",
      food: "/images/places/dharamshala/categories/cafe.webp",
      nature: "/images/places/dharamshala/categories/nature.webp",
      trail: "/images/places/dharamshala/categories/nature.webp",
      waterfall: "/images/places/dharamshala/categories/waterfall.webp",
      monastery: "/images/places/dharamshala/categories/monastery.webp",
      spiritual: "/images/places/dharamshala/categories/spiritual.webp",
      heritage: "/images/places/dharamshala/categories/heritage.webp",
      viewpoint: "/images/places/dharamshala/categories/viewpoint.webp",
      lake: "/images/places/dharamshala/categories/lake.webp",
      church: "/images/places/dharamshala/categories/church.webp",
      beach: "/images/places/dharamshala/categories/beach.webp",
      shopping: "/images/places/dharamshala/categories/cafe.webp",
      transport: "/images/places/universal/transport.webp"
    }
  },
  varanasi: {
    generic: "/images/destinations/varanasi/hero.jpg",
    categories: {
      stay: "/images/places/varanasi/categories/stay.webp",
      cafe: "/images/places/varanasi/categories/cafe.webp",
      food: "/images/places/varanasi/categories/cafe.webp",
      nature: "/images/places/varanasi/categories/nature.webp",
      trail: "/images/places/varanasi/categories/nature.webp",
      spiritual: "/images/places/varanasi/categories/spiritual.webp",
      heritage: "/images/places/varanasi/categories/heritage.webp",
      viewpoint: "/images/places/varanasi/categories/viewpoint.webp",
      lake: "/images/places/varanasi/categories/lake.webp",
      waterfall: "/images/places/varanasi/categories/waterfall.webp",
      monastery: "/images/places/varanasi/categories/monastery.webp",
      church: "/images/places/varanasi/categories/church.webp",
      beach: "/images/places/varanasi/categories/beach.webp",
      shopping: "/images/places/varanasi/categories/cafe.webp",
      transport: "/images/places/universal/transport.webp"
    }
  },
  manali: {
    generic: "/images/destinations/manali/hero.jpg",
    categories: {
      stay: "/images/places/manali/categories/stay.webp",
      cafe: "/images/places/manali/categories/cafe.webp",
      food: "/images/places/manali/categories/cafe.webp",
      nature: "/images/places/manali/categories/nature.webp",
      trail: "/images/places/manali/categories/nature.webp",
      waterfall: "/images/places/manali/categories/waterfall.webp",
      spiritual: "/images/places/manali/categories/spiritual.webp",
      heritage: "/images/places/manali/categories/heritage.webp",
      viewpoint: "/images/places/manali/categories/viewpoint.webp",
      lake: "/images/places/manali/categories/lake.webp",
      monastery: "/images/places/manali/categories/monastery.webp",
      church: "/images/places/manali/categories/church.webp",
      beach: "/images/places/manali/categories/beach.webp",
      shopping: "/images/places/manali/categories/cafe.webp",
      transport: "/images/places/universal/transport.webp"
    }
  },
  kasol: {
    generic: "/images/destinations/kasol/hero.jpg",
    categories: {
      stay: "/images/places/kasol/categories/stay.webp",
      cafe: "/images/places/kasol/categories/cafe.webp",
      food: "/images/places/kasol/categories/food.webp",
      nature: "/images/places/kasol/categories/nature.webp",
      trail: "/images/places/kasol/categories/nature.webp",
      spiritual: "/images/places/kasol/categories/spiritual.webp",
      heritage: "/images/places/kasol/categories/heritage.webp",
      viewpoint: "/images/places/kasol/categories/viewpoint.webp",
      waterfall: "/images/places/kasol/categories/waterfall.webp",
      lake: "/images/places/kasol/categories/lake.webp",
      monastery: "/images/places/kasol/categories/monastery.webp",
      church: "/images/places/kasol/categories/church.webp",
      beach: "/images/places/kasol/categories/beach.webp",
      shopping: "/images/places/kasol/categories/cafe.webp",
      transport: "/images/places/universal/transport.webp"
    }
  },
  mussoorie: {
    generic: "/images/destinations/mussoorie/hero.jpg",
    categories: {
      stay: "/images/places/mussoorie/categories/stay.webp",
      cafe: "/images/places/mussoorie/categories/cafe.webp",
      food: "/images/places/mussoorie/categories/cafe.webp",
      nature: "/images/places/mussoorie/categories/nature.webp",
      trail: "/images/places/mussoorie/categories/nature.webp",
      waterfall: "/images/places/mussoorie/categories/waterfall.webp",
      church: "/images/places/mussoorie/categories/church.webp",
      spiritual: "/images/places/mussoorie/categories/spiritual.webp",
      heritage: "/images/places/mussoorie/categories/heritage.webp",
      viewpoint: "/images/places/mussoorie/categories/viewpoint.webp",
      lake: "/images/places/mussoorie/categories/lake.webp",
      monastery: "/images/places/mussoorie/categories/monastery.webp",
      beach: "/images/places/mussoorie/categories/beach.webp",
      shopping: "/images/places/mussoorie/categories/cafe.webp",
      transport: "/images/places/universal/transport.webp"
    }
  },
  goa: {
    generic: "/images/destinations/goa/hero.jpg",
    categories: {
      stay: "/images/places/goa/categories/stay.webp",
      cafe: "/images/places/goa/categories/cafe.webp",
      food: "/images/places/goa/categories/cafe.webp",
      nature: "/images/places/goa/categories/nature.webp",
      trail: "/images/places/goa/categories/nature.webp",
      beach: "/images/places/goa/categories/beach.webp",
      heritage: "/images/places/goa/categories/heritage.webp",
      spiritual: "/images/places/goa/categories/spiritual.webp",
      church: "/images/places/goa/categories/church.webp",
      waterfall: "/images/places/goa/categories/waterfall.webp",
      viewpoint: "/images/places/goa/categories/viewpoint.webp",
      lake: "/images/places/goa/categories/lake.webp",
      monastery: "/images/places/goa/categories/monastery.webp",
      shopping: "/images/places/goa/categories/cafe.webp",
      transport: "/images/places/universal/transport.webp"
    }
  },
  munnar: {
    generic: "/images/destinations/fallbacks/valley.jpg",
    categories: {
      stay: "/images/places/munnar/categories/stay.webp",
      cafe: "/images/places/munnar/categories/cafe.webp",
      food: "/images/places/munnar/categories/cafe.webp",
      nature: "/images/places/munnar/categories/nature.webp",
      trail: "/images/places/munnar/categories/nature.webp",
      waterfall: "/images/places/munnar/categories/waterfall.webp",
      lake: "/images/places/munnar/categories/lake.webp",
      heritage: "/images/places/munnar/categories/heritage.webp",
      spiritual: "/images/places/munnar/categories/spiritual.webp",
      viewpoint: "/images/places/munnar/categories/viewpoint.webp",
      monastery: "/images/places/munnar/categories/monastery.webp",
      church: "/images/places/munnar/categories/church.webp",
      beach: "/images/places/munnar/categories/beach.webp",
      shopping: "/images/places/munnar/categories/cafe.webp",
      transport: "/images/places/universal/transport.webp"
    }
  },
  rishikesh: {
    generic: "/images/destinations/rishikesh/hero.jpg",
    categories: {
      stay: "/images/places/rishikesh/categories/stay.webp",
      cafe: "/images/places/rishikesh/categories/cafe.webp",
      food: "/images/places/rishikesh/categories/cafe.webp",
      nature: "/images/places/rishikesh/categories/nature.webp",
      trail: "/images/places/rishikesh/categories/nature.webp",
      spiritual: "/images/places/rishikesh/categories/spiritual.webp",
      heritage: "/images/places/rishikesh/categories/heritage.webp",
      waterfall: "/images/places/rishikesh/categories/waterfall.webp",
      viewpoint: "/images/places/rishikesh/categories/viewpoint.webp",
      lake: "/images/places/rishikesh/categories/lake.webp",
      monastery: "/images/places/rishikesh/categories/monastery.webp",
      church: "/images/places/rishikesh/categories/church.webp",
      beach: "/images/places/rishikesh/categories/beach.webp",
      shopping: "/images/places/rishikesh/categories/cafe.webp",
      transport: "/images/places/universal/transport.webp"
    }
  },
  spiti: {
    generic: "/images/destinations/spiti-valley/hero.jpg",
    categories: {
      stay: "/images/places/spiti/categories/stay.webp",
      cafe: "/images/places/spiti/categories/cafe.webp",
      food: "/images/places/spiti/categories/food.webp",
      nature: "/images/places/spiti/categories/nature.webp",
      trail: "/images/places/spiti/categories/nature.webp",
      lake: "/images/places/spiti/categories/lake.webp",
      monastery: "/images/places/spiti/categories/monastery.webp",
      spiritual: "/images/places/spiti/categories/spiritual.webp",
      heritage: "/images/places/spiti/categories/heritage.webp",
      viewpoint: "/images/places/spiti/categories/viewpoint.webp",
      waterfall: "/images/places/spiti/categories/waterfall.webp",
      church: "/images/places/spiti/categories/church.webp",
      beach: "/images/places/spiti/categories/beach.webp",
      shopping: "/images/places/spiti/categories/cafe.webp",
      transport: "/images/places/universal/transport.webp"
    }
  }
};

/**
 * Controlled Semantic Categories Taxonomy Classifier.
 * Deterministic mapping to prevent theme collisions.
 */
export function classifyCategoryTheme(
  category: string = "",
  placeName: string = "",
  tags: string = ""
): SemanticTheme {
  const text = `${category || ""} ${placeName || ""} ${tags || ""}`.toLowerCase();

  // 1. Stays & Accommodation (NEVER temple, NEVER mountain, NEVER food)
  if (
    text.includes("hotel") ||
    text.includes("resort") ||
    text.includes("cottage") ||
    text.includes("homestay") ||
    text.includes("hostel") ||
    text.includes("guesthouse") ||
    text.includes("guest house") ||
    text.includes("lodge") ||
    text.includes("stay") ||
    text.includes("accommodation") ||
    text.includes("villa") ||
    text.includes("inn") ||
    text.includes("mudhouse") ||
    text.includes("sanctuary retreat") ||
    text.includes("boutique retreat") ||
    text.includes("retreat") ||
    text.includes("niwas") ||
    text.includes("manor") ||
    text.includes("camp") ||
    text.includes("tent") ||
    text.includes("bed & breakfast") ||
    text.includes("b&b") ||
    text.includes("residency") ||
    (text.includes("haveli") && (text.includes("stay") || text.includes("hotel") || text.includes("sanctuary") || text.includes("heritage") || text.includes("jagat"))) ||
    (text.includes("palace") && (text.includes("hotel") || text.includes("retreat") || text.includes("stay") || text.includes("lakeside") || text.includes("niwas") || text.includes("brijrama")))
  ) {
    return "stay";
  }

  // 2. Strict Cafe & Bakery
  if (
    text.includes("cafe") ||
    text.includes("café") ||
    text.includes("coffee") ||
    text.includes("bakery") ||
    text.includes("bakehouse") ||
    text.includes("tea house") ||
    text.includes("espresso") ||
    text.includes("german bakery") ||
    text.includes("patisserie")
  ) {
    return "cafe";
  }

  // 3. Strict Food & Restaurant & Street Food
  if (
    text.includes("food") ||
    text.includes("restaurant") ||
    text.includes("dhaba") ||
    text.includes("momo") ||
    text.includes("tibetan food") ||
    text.includes("dining") ||
    text.includes("kitchen") ||
    text.includes("eatery") ||
    text.includes("street food") ||
    text.includes("bhojanalaya") ||
    text.includes("sweet") ||
    text.includes("chaat") ||
    text.includes("thukpa") ||
    text.includes("lassi") ||
    text.includes("rasoi") ||
    text.includes("thali")
  ) {
    return "food";
  }

  // 4. Church
  if (
    text.includes("church") ||
    text.includes("cathedral") ||
    text.includes("chapel") ||
    text.includes("basilica")
  ) {
    return "church";
  }

  // 5. Monastery / Gompa
  if (
    text.includes("monastery") ||
    text.includes("gompa") ||
    text.includes("stupa") ||
    text.includes("tibetan temple") ||
    text.includes("dzong") ||
    text.includes("kye gompa") ||
    text.includes("ki gompa")
  ) {
    return "monastery";
  }

  // 6. Waterfall / Cascade
  if (
    text.includes("waterfall") ||
    text.includes("falls") ||
    text.includes("cascade")
  ) {
    return "waterfall";
  }

  // 7. Lake / River / Water Body
  if (
    text.includes("lake") ||
    text.includes("tso") ||
    text.includes("taal") ||
    text.includes("tal") ||
    text.includes("river") ||
    text.includes("stream") ||
    text.includes("pond") ||
    text.includes("dam")
  ) {
    return "lake";
  }

  // 8. Beach / Coastal
  if (
    text.includes("beach") ||
    text.includes("coast") ||
    text.includes("cove") ||
    text.includes("shore") ||
    text.includes("cliff beach")
  ) {
    return "beach";
  }

  // 9. Trails & Trekking
  if (
    text.includes("trail") ||
    text.includes("trek") ||
    text.includes("walk") ||
    text.includes("hike") ||
    text.includes("promenade") ||
    text.includes("climb") ||
    text.includes("pass")
  ) {
    return "trail";
  }

  // 10. Temple / Ashram / Mosque / Spiritual
  if (
    text.includes("temple") ||
    text.includes("mandir") ||
    text.includes("shrine") ||
    text.includes("ashram") ||
    text.includes("gurudwara") ||
    text.includes("mosque") ||
    text.includes("masjid") ||
    text.includes("ghat") ||
    text.includes("aarti") ||
    text.includes("spiritual") ||
    text.includes("jyotirlinga")
  ) {
    return "spiritual";
  }

  // 11. Fort / Palace / Heritage / Haveli
  if (
    text.includes("fort") ||
    text.includes("palace") ||
    text.includes("haveli") ||
    text.includes("museum") ||
    text.includes("monument") ||
    text.includes("heritage") ||
    text.includes("ruins") ||
    text.includes("castle") ||
    text.includes("latin quarter")
  ) {
    return "heritage";
  }

  // 12. Shopping / Market / Bazaar
  if (
    text.includes("market") ||
    text.includes("bazaar") ||
    text.includes("shop") ||
    text.includes("store") ||
    text.includes("boutique") ||
    text.includes("souvenir") ||
    text.includes("craft")
  ) {
    return "shopping";
  }

  // 13. Mobility / Transport / Rentals
  if (
    text.includes("rental") ||
    text.includes("scooter") ||
    text.includes("motorcycle") ||
    text.includes("bike") ||
    text.includes("taxi") ||
    text.includes("transport") ||
    text.includes("bus stand") ||
    text.includes("railway") ||
    text.includes("mobility")
  ) {
    return "transport";
  }

  // 14. Medical / Essentials
  if (
    text.includes("hospital") ||
    text.includes("clinic") ||
    text.includes("pharmacy") ||
    text.includes("doctor") ||
    text.includes("medical") ||
    text.includes("police") ||
    text.includes("atm") ||
    text.includes("essential")
  ) {
    return "medical";
  }

  // 15. Viewpoint / Scenic Ridge
  if (
    text.includes("viewpoint") ||
    text.includes("view point") ||
    text.includes("ridge") ||
    text.includes("peak") ||
    text.includes("tibba") ||
    text.includes("top") ||
    text.includes("scenic point")
  ) {
    return "viewpoint";
  }

  // 16. Nature / Forest / Sanctuary / Tea Estate
  if (
    text.includes("forest") ||
    text.includes("woods") ||
    text.includes("pine") ||
    text.includes("deodar") ||
    text.includes("jungle") ||
    text.includes("park") ||
    text.includes("garden") ||
    text.includes("sanctuary") ||
    text.includes("tea") ||
    text.includes("plantation") ||
    text.includes("nature")
  ) {
    return "nature";
  }

  return "nature";
}

/**
 * Universal safe semantic fallback URL.
 * Guarantees zero broken images while strictly preserving category truthfulness.
 */
export function getUniversalFallback(semanticTheme: SemanticTheme): string {
  const themeMap: Record<SemanticTheme, string> = {
    cafe: "/images/places/universal/cafe.webp",
    food: "/images/places/universal/food.webp",
    stay: "/images/places/universal/stay.webp",
    monastery: "/images/places/universal/monastery.webp",
    church: "/images/places/universal/church.webp",
    spiritual: "/images/places/universal/spiritual.webp",
    heritage: "/images/places/universal/heritage.webp",
    trail: "/images/places/universal/nature.webp",
    nature: "/images/places/universal/nature.webp",
    waterfall: "/images/places/universal/waterfall.webp",
    lake: "/images/places/universal/lake.webp",
    beach: "/images/places/universal/beach.webp",
    viewpoint: "/images/places/universal/viewpoint.webp",
    shopping: "/images/places/universal/shopping.webp",
    nightlife: "/images/places/universal/nightlife.webp",
    activity: "/images/places/universal/viewpoint.webp",
    transport: "/images/places/universal/transport.webp",
    medical: "/images/places/universal/medical.webp",
    service: "/images/places/universal/service.webp"
  };
  return themeMap[semanticTheme] || "/images/places/universal/nature.webp";
}

export function areThemesCompatible(t1: SemanticTheme, t2: SemanticTheme): boolean {
  if (t1 === t2) return true;
  // Stays are completely isolated
  if (t1 === "stay" || t2 === "stay") return false;
  // Food & Cafe isolated from spiritual/temples
  const foodGroup = new Set<SemanticTheme>(["cafe", "food"]);
  const spiritGroup = new Set<SemanticTheme>(["spiritual", "monastery", "church"]);
  if ((foodGroup.has(t1) && spiritGroup.has(t2)) || (spiritGroup.has(t1) && foodGroup.has(t2))) {
    return false;
  }
  return true;
}

/**
 * Resolves artwork for any real-world place deterministically adhering to the 10-Level Hierarchy.
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
  const semanticTheme = classifyCategoryTheme(category, placeName);
  const universalSafe = getUniversalFallback(semanticTheme);

  // Match destination config
  let matchedDestKey: string | null = null;
  for (const k of Object.keys(DESTINATION_CATEGORY_REGISTRY)) {
    if (destNorm === k || destNorm.includes(k) || k.includes(destNorm)) {
      matchedDestKey = k;
      break;
    }
  }

  const destConfig = matchedDestKey ? DESTINATION_CATEGORY_REGISTRY[matchedDestKey] : null;
  const destCategoryFallback = destConfig?.categories[semanticTheme] || null;
  const safeFallback = destCategoryFallback || universalSafe;

  // --- LEVEL 1 & 2 & 3: Verified Real Photograph URL (Live Provider, Wikimedia Commons, OpenStreetMap) ---
  if (
    existingImageUrl &&
    isApprovedAsset(existingImageUrl) &&
    (existingImageUrl.startsWith("https://") || existingImageUrl.startsWith("http://"))
  ) {
    const isWikimedia = existingImageUrl.includes("wikimedia.org") || existingImageUrl.includes("wikidata.org");
    const isRealExact = isWikimedia || isLive === true || source === "google_places" || source === "wikimedia";
    const badgeLabel: ProvenanceBadge = isRealExact ? (isWikimedia ? "EXACT PLACE PHOTO" : "LIVE PLACE PHOTO") : "DESTINATION CATEGORY ART";

    return {
      url: existingImageUrl,
      fallback_url: safeFallback,
      source: isWikimedia ? "wikimedia" : (source || "live_provider"),
      source_type: "real_photo",
      provenance: isRealExact ? (isWikimedia ? "exact_place" : "live_place") : "destination_category",
      semantic_category: semanticTheme,
      exactness: isRealExact ? "exact" : "approximate",
      attribution: isWikimedia ? "Wikimedia Commons / Verified Open Source" : "Live Provider Photograph",
      alt_text: `${placeName} in ${destinationName || "India"}`,
      badge_label: badgeLabel,
      artworkKey: `photo:${placeNorm}`,
      imageUrl: existingImageUrl,
      fallbackUrl: safeFallback,
      tier: isRealExact ? (isWikimedia ? "exact_place" : "live_place") : "destination_category",
      placeName,
      destinationName,
      category,
      semanticTheme,
      isRealPhoto: true,
      badgeLabel,
      visualDescription: `Verified photograph of ${placeName}.`
    };
  }

  // --- HARD ISOLATION FOR STAYS: Never inherit landmark artwork ---
  if (semanticTheme === "stay") {
    const stayAsset = destConfig?.categories.stay || universalSafe;
    return {
      url: stayAsset,
      fallback_url: universalSafe,
      source: "vanvas_curated",
      source_type: "category_photo",
      provenance: "destination_category",
      semantic_category: "stay",
      exactness: "category_matched",
      attribution: `VANVAS Curated ${destinationName} Stay Sanctuary`,
      alt_text: `${placeName} accommodation in ${destinationName}`,
      badge_label: "DESTINATION CATEGORY ART",
      artworkKey: `${matchedDestKey || "universal"}:stay`,
      imageUrl: stayAsset,
      fallbackUrl: universalSafe,
      tier: "destination_category",
      placeName,
      destinationName,
      category,
      semanticTheme: "stay",
      isRealPhoto: false,
      badgeLabel: "DESTINATION CATEGORY ART",
      visualDescription: `Serene stay and hospitality sanctuary in ${destinationName}.`
    };
  }

  // --- LEVEL 4: Curated Exact-Place Artwork (Direct Key Lookup) ---
  const lookupKey = `${destNorm}:${placeNorm}`;
  if (EXACT_PLACE_REGISTRY[lookupKey]) {
    const entry = EXACT_PLACE_REGISTRY[lookupKey];
    if (isApprovedAsset(entry.imageUrl)) {
      return {
        url: entry.imageUrl,
        fallback_url: safeFallback,
        source: entry.source || "vanvas_curated",
        source_type: entry.sourceType || "editorial_artwork",
        provenance: "exact_place",
        semantic_category: entry.semanticTheme,
        exactness: "exact",
        attribution: entry.attribution || "VANVAS Verified Editorial Asset",
        alt_text: `${placeName} in ${destinationName}`,
        badge_label: "VANVAS PLACE ARTWORK",
        artworkKey: lookupKey,
        imageUrl: entry.imageUrl,
        fallbackUrl: safeFallback,
        tier: "exact_place",
        placeName,
        destinationName,
        category,
        semanticTheme: entry.semanticTheme,
        isRealPhoto: false,
        badgeLabel: "VANVAS PLACE ARTWORK",
        visualDescription: entry.visualDescription
      };
    }
  }

  // --- LEVEL 4B: Curated Exact-Place Artwork (Explicit Alias Matching with Semantic Safety) ---
  let bestExactMatch: { regKey: string; item: CuratedLandmarkEntry } | null = null;

  for (const [regKey, item] of Object.entries(EXACT_PLACE_REGISTRY)) {
    if (!isApprovedAsset(item.imageUrl)) {
      continue;
    }
    const [regDest, regPlace] = regKey.split(":");
    if (regDest === destNorm || destNorm.includes(regDest) || regDest.includes(destNorm)) {
      // Hard check: ensure semantic theme compatibility before assigning exact landmark asset
      if (!areThemesCompatible(semanticTheme, item.semanticTheme)) {
        continue;
      }

      const aliases = item.aliases || [regPlace];
      let matched = false;

      if (regPlace === placeNorm || aliases.includes(placeNorm)) {
        matched = true;
      } else {
        // High confidence containment: must match full canonical alias of significant length
        for (const al of aliases) {
          if (al.length >= 6) {
            if (placeNorm === al || placeNorm.startsWith(`${al}-`) || placeNorm.endsWith(`-${al}`) || placeNorm.includes(`-${al}-`)) {
              matched = true;
              break;
            }
          }
        }
      }

      if (matched) {
        bestExactMatch = { regKey, item };
        break;
      }
    }
  }

  if (bestExactMatch && isApprovedAsset(bestExactMatch.item.imageUrl)) {
    return {
      url: bestExactMatch.item.imageUrl,
      fallback_url: safeFallback,
      source: bestExactMatch.item.source || "vanvas_curated",
      source_type: bestExactMatch.item.sourceType || "editorial_artwork",
      provenance: "exact_place",
      semantic_category: bestExactMatch.item.semanticTheme,
      exactness: "exact",
      attribution: bestExactMatch.item.attribution || "VANVAS Verified Editorial Asset",
      alt_text: `${placeName} in ${destinationName}`,
      badge_label: "VANVAS PLACE ARTWORK",
      artworkKey: bestExactMatch.regKey,
      imageUrl: bestExactMatch.item.imageUrl,
      fallbackUrl: safeFallback,
      tier: "exact_place",
      placeName,
      destinationName,
      category,
      semanticTheme: bestExactMatch.item.semanticTheme,
      isRealPhoto: false,
      badgeLabel: "VANVAS PLACE ARTWORK",
      visualDescription: bestExactMatch.item.visualDescription
    };
  }

  // --- LEVEL 6: Place-Type / Category-Specific Destination Artwork ---
  if (destConfig && destConfig.categories[semanticTheme] && isApprovedAsset(destConfig.categories[semanticTheme])) {
    const categoryUrl = destConfig.categories[semanticTheme]!;
    return {
      url: categoryUrl,
      fallback_url: universalSafe,
      source: "vanvas_curated",
      source_type: "category_photo",
      provenance: "destination_category",
      semantic_category: semanticTheme,
      exactness: "category_matched",
      attribution: `VANVAS Curated ${destinationName} Atmosphere`,
      alt_text: `${destinationName} ${category} visual atmosphere`,
      badge_label: "DESTINATION CATEGORY ART",
      artworkKey: `${matchedDestKey}:${semanticTheme}`,
      imageUrl: categoryUrl,
      fallbackUrl: universalSafe,
      tier: "destination_category",
      placeName,
      destinationName,
      category,
      semanticTheme,
      isRealPhoto: false,
      badgeLabel: "DESTINATION CATEGORY ART",
      visualDescription: `Authentic ${destinationName} ${semanticTheme} visual.`
    };
  }

  // --- LEVEL 7 & 8: Universal Semantic Category Artwork ---
  return {
    url: universalSafe,
    fallback_url: "/images/destinations/fallbacks/himalayan.jpg",
    source: "fallback",
    source_type: "fallback",
    provenance: "universal_fallback",
    semantic_category: semanticTheme,
    exactness: "fallback",
    attribution: "VANVAS Universal Semantic Category Visual",
    alt_text: `${category} travel atmosphere`,
    badge_label: "UNIVERSAL FALLBACK",
    artworkKey: `universal:${semanticTheme}`,
    imageUrl: universalSafe,
    fallbackUrl: "/images/destinations/fallbacks/himalayan.jpg",
    tier: "universal_fallback",
    placeName,
    destinationName,
    category,
    semanticTheme,
    isRealPhoto: false,
    badgeLabel: "UNIVERSAL FALLBACK",
    visualDescription: `Universal semantic category asset for ${semanticTheme}.`
  };
}

/**
 * Deterministic Reverse-Index Collision Detector.
 * Fails if two unrelated curated places in a destination receive the same asset,
 * or if stays/food receive mountain/fort/monastery artwork.
 */
export function detectVisualCollisions(
  places: Array<{
    id?: string;
    name: string;
    destinationName: string;
    category: string;
    imageUrl?: string | null;
  }>
): { valid: boolean; violations: string[]; reverseIndex: Record<string, string[]> } {
  const reverseIndex: Record<string, string[]> = {};
  const violations: string[] = [];

  for (const p of places) {
    const res = resolvePlaceArtwork(p.name, p.destinationName, p.category, p.imageUrl);
    const asset = res.imageUrl;
    const placeId = `${p.destinationName}:${p.name}`;

    if (!reverseIndex[asset]) {
      reverseIndex[asset] = [];
    }
    reverseIndex[asset].push(placeId);

    // Rule 1: Stays must NEVER receive landmark or non-stay visual
    if (res.semanticTheme === "stay") {
      if (
        asset.includes("monastery") ||
        asset.includes("temple") ||
        asset.includes("fort") ||
        asset.includes("hero.jpg") ||
        asset.includes("illustration.jpg")
      ) {
        violations.push(`STAY MISMATCH: ${placeId} resolved to non-stay asset ${asset}`);
      }
    }

    // Rule 2: Food & Cafes must NEVER receive trail or monastery visuals
    if (res.semanticTheme === "cafe" || res.semanticTheme === "food") {
      if (
        asset.includes("trail") ||
        asset.includes("monastery") ||
        asset.includes("waterfall") ||
        asset.includes("hero.jpg")
      ) {
        violations.push(`FOOD MISMATCH: ${placeId} resolved to non-food asset ${asset}`);
      }
    }
  }

  // Rule 3: Destination-specific assets must not be shared across unrelated place types
  for (const [asset, placeList] of Object.entries(reverseIndex)) {
    if (placeList.length > 1) {
      if (asset.includes("/places/universal/")) {
        // Universal fallbacks allowed to be shared only among same semantic category
        continue;
      }
      if (asset.includes("/categories/")) {
        // Destination categories allowed only among same destination & category
        continue;
      }
      // Exact place assets MUST NOT be shared across multiple different places
      violations.push(`EXACT ASSET COLLISION: ${asset} shared across ${placeList.join(", ")}`);
    }
  }

  return {
    valid: violations.length === 0,
    violations,
    reverseIndex
  };
}
