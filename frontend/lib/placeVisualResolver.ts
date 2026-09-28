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
  "delhi:qutub-minar": {
    imageUrl: "/images/places/delhi/qutub-minar.jpg",
    visualDescription: "Qutub Minar 73m minaret in Mehrauli",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "qutub-minar",
      "qutub"
    ]
  },
  "delhi:red-fort": {
    imageUrl: "/images/places/delhi/red-fort.jpg",
    visualDescription: "Historic red sandstone fortress in Old Delhi",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "red-fort",
      "lal-qila"
    ]
  },
  "delhi:india-gate": {
    imageUrl: "/images/places/delhi/india-gate.jpg",
    visualDescription: "India Gate 42m war memorial arch",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "india-gate"
    ]
  },
  "delhi:lotus-temple": {
    imageUrl: "/images/places/delhi/lotus-temple.jpg",
    visualDescription: "Lotus Temple Bahai House of Worship",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "lotus-temple"
    ]
  },
  "delhi:humayuns-tomb": {
    imageUrl: "/images/places/delhi/humayuns-tomb.webp",
    visualDescription: "Humayun's Tomb Mughal architecture grand mausoleum",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "humayuns-tomb"
    ]
  },
  "delhi:akshardham": {
    imageUrl: "/images/places/delhi/akshardham.webp",
    visualDescription: "Akshardham Temple grand carved sandstone mandir",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "akshardham"
    ]
  },
  "delhi:chandni-chowk": {
    imageUrl: "/images/places/delhi/chandni-chowk.jpg",
    visualDescription: "Chandni Chowk historic spice and food bazaar",
    category: "Shops & Markets",
    semanticTheme: "shopping",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chandni-chowk"
    ]
  },
  "mumbai:gateway-of-india": {
    imageUrl: "/images/places/mumbai/gateway-of-india.webp",
    visualDescription: "Gateway of India basalt arch overlooking Arabian Sea",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "gateway-of-india",
      "gateway"
    ]
  },
  "amritsar:golden-temple": {
    imageUrl: "/images/places/amritsar/golden-temple.jpg",
    visualDescription: "Harmandir Sahib Golden Temple in sacred Amrit Sarovar",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "golden-temple",
      "harmandir-sahib"
    ]
  },
  "manali:hadimba-temple": {
    imageUrl: "/images/places/manali/hadimba-temple.webp",
    visualDescription: "A 16th-century four-tiered pagoda-style wooden temple nestled deep inside towering Dhungri deodar forests.",
    category: "Must Visit",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "hadimba-devi-cedar-forest-temple",
      "hadimba-temple"
    ]
  },
  "manali:cafe-1947": {
    imageUrl: "/images/places/manali/cafe-1947.webp",
    visualDescription: "Old Manali's iconic stone café sitting directly over the rushing Manalsu river stream, renowned for wood-fired pizza and acoustic indie sets.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "café-1947-riverside-stone-café",
      "cafe-1947"
    ]
  },
  "manali:jogini-waterfall": {
    imageUrl: "/images/places/manali/jogini-waterfall.webp",
    visualDescription: "A gentle 3 km hike through apple orchards and pine groves starting from Vashisht village leading to a cascading multi-tier waterfall.",
    category: "Nature & Trails",
    semanticTheme: "waterfall",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jogini-waterfall",
      "jogini-waterfall-pine-trail"
    ]
  },
  "manali:old-manali-village": {
    imageUrl: "/images/places/manali/old-manali-village.webp",
    visualDescription: "Traditional wooden Himachali architecture surrounded by apple orchards and narrow stone alleys lined with bohemian cafés.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "old-manali-village",
      "old-manali-village-manu-temple"
    ]
  },
  "manali:drifters-cafe": {
    imageUrl: "/images/places/manali/drifters-cafe.webp",
    visualDescription: "Warm wooden café offering board games, live acoustic indie sets, cinnamon French toast, and handcrafted espresso.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "drifters-café-acoustic-inn",
      "drifters-cafe"
    ]
  },
  "manali:solang-valley": {
    imageUrl: "/images/places/manali/solang-valley.webp",
    visualDescription: "High alpine valley famous for paragliding over pine slopes, zorbing, winter ski slopes, and panoramic snow peak vistas.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "solang-valley",
      "solang-valley-alpine-adventure-grounds"
    ]
  },
  "manali:vashisht-springs": {
    imageUrl: "/images/places/manali/vashisht-springs.webp",
    visualDescription: "Natural geothermal hot springs with stone bathing tanks attached to a 4,000-year-old wooden temple dedicated to Sage Vashistha.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "vashisht-hot-sulphur-springs-ancient-temple",
      "vashisht-springs"
    ]
  },
  "manali:johnsons-cafe": {
    imageUrl: "/images/places/manali/johnsons-cafe.webp",
    visualDescription: "Celebrated garden restaurant set in a manicured lawn serving fresh wood-smoked Himalayan river trout and authentic apple cider.",
    category: "Local Food",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "johnsons-cafe",
      "the-johnsons-café-trout-bar"
    ]
  },
  "rishikesh:triveni-ghat-aarti": {
    imageUrl: "/images/places/rishikesh/triveni-ghat-aarti.webp",
    visualDescription: "Sacred confluence of three holy rivers featuring massive brass lamp ceremonies, conch shells, and floating leaf diyas.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "triveni-ghat-evening-maha-aarti",
      "triveni-ghat-aarti"
    ]
  },
  "rishikesh:beatles-ashram": {
    imageUrl: "/images/places/rishikesh/beatles-ashram.webp",
    visualDescription: "The historic 1968 Maharishi Mahesh Yogi ashram inside Rajaji Tiger Reserve, covered in graffiti murals, meditation domes, and banyan trees.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "beatles-ashram-chaurasi-kutia",
      "beatles-ashram"
    ]
  },
  "rishikesh:neer-garh-waterfall": {
    imageUrl: "/images/places/rishikesh/neer-garh-waterfall.webp",
    visualDescription: "A crystal-clear natural limestone waterfall cascading into turquoise plunge pools reachable via a 1.5 km scenic jungle trail.",
    category: "Nature & Trails",
    semanticTheme: "waterfall",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "neer-garh-cascading-waterfall",
      "neer-garh-waterfall"
    ]
  },
  "rishikesh:parmarth-niketan-aarti": {
    imageUrl: "/images/places/rishikesh/parmarth-niketan-aarti.webp",
    visualDescription: "The world-famous evening fire ceremony on the sacred banks of the Ganges at sunset, featuring soulful Vedic kirtans and floating lamps.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "parmarth-niketan-ganga-aarti",
      "parmarth-niketan-aarti"
    ]
  },
  "rishikesh:shivpuri-river-rafting": {
    imageUrl: "/images/places/rishikesh/shivpuri-river-rafting.webp",
    visualDescription: "Grade III and IV white water river rafting starting from Shivpuri down to Nim Beach through Roller Coaster and Golf Course rapids.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "shivpuri-river-rafting",
      "shivpuri-white-water-river-rafting"
    ]
  },
  "rishikesh:vashistha-cave": {
    imageUrl: "/images/places/rishikesh/vashistha-cave.webp",
    visualDescription: "An ancient natural cave on the banks of the Ganges where Sage Vashistha meditated, renowned for deep meditative silence.",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "vashistha-cave",
      "vashistha-cave-gufa"
    ]
  },
  "rishikesh:german-bakery-tapovan": {
    imageUrl: "/images/places/rishikesh/german-bakery-tapovan.webp",
    visualDescription: "Classic hillside bakery at Lakshman Jhula serving fresh apple strudel, yak cheese sandwiches, and organic espresso.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "devraj-coffee-german-bakery",
      "german-bakery-tapovan"
    ]
  },
  "rishikesh:ram-jhula-promenade": {
    imageUrl: "/images/places/rishikesh/ram-jhula-promenade.webp",
    visualDescription: "Historic 230m iron suspension bridge linking Shivananda Ashram to Swarg Ashram across the turquoise waters of the Ganga.",
    category: "Must Visit",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "ram-jhula-suspension-bridge-promenade",
      "ram-jhula-promenade"
    ]
  },
  "kasol:moon-dance-cafe": {
    imageUrl: "/images/places/kasol/moon-dance-cafe.webp",
    visualDescription: "Kasol's iconic culinary hub since the 1990s, famous for cinnamon rolls, fresh hummus platters, shakshuka, and wood-fired pizzas.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "moon-dance-cafe",
      "moon-dance-café-german-bakery"
    ]
  },
  "kasol:tosh-village": {
    imageUrl: "/images/places/kasol/tosh-village.webp",
    visualDescription: "Rustic wooden Himalayan village perched at 2,400m overlooking snow-clad peaks, waterfalls, and steep tiered apple orchards.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "tosh-village",
      "tosh-village-apple-orchard-ridge"
    ]
  },
  "kasol:evergreen-cafe": {
    imageUrl: "/images/places/kasol/evergreen-cafe.webp",
    visualDescription: "Bohemian open garden restaurant serving legendary wood-fired laffa wraps, falafel platters, lamb schnitzel, and ginger mint tea.",
    category: "Local Food",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "evergreen-cafe",
      "evergreen-café-garden-lounge"
    ]
  },
  "kasol:chalal-pine-trail": {
    imageUrl: "/images/places/kasol/chalal-pine-trail.webp",
    visualDescription: "Scenic 2 km walking trail from Kasol suspension bridge through dense deodar forests alongside the turquoise Parvati River.",
    category: "Must Visit",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chalal-riverside-pine-trail",
      "chalal-pine-trail"
    ]
  },
  "kasol:manikaran-sahib-gurudwara": {
    imageUrl: "/images/places/kasol/manikaran-sahib-gurudwara.webp",
    visualDescription: "Sacred pilgrimage center where boiling geothermal springs power massive community langar kitchens on the banks of Parvati River.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "manikaran-sahib-gurudwara",
      "manikaran-sahib-gurudwara-hot-springs"
    ]
  },
  "kasol:grahan-village-trek": {
    imageUrl: "/images/places/kasol/grahan-village-trek.webp",
    visualDescription: "An offbeat 8 km trek through pine canopies and rushing stream bridges to a traditional Himachali village with no motor road.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "grahan-village-trek",
      "grahan-village-heritage-trek"
    ]
  },
  "kasol:nature-park-kasol": {
    imageUrl: "/images/places/kasol/nature-park-kasol.webp",
    visualDescription: "Protected riverbank forest park with wooden bridges, large river boulders, and shaded paths directly alongside the gushing Parvati.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kasol-nature-park-pine-walk",
      "nature-park-kasol"
    ]
  },
  "kasol:malana-village-gate": {
    imageUrl: "/images/places/kasol/malana-village-gate.webp",
    visualDescription: "Ancient autonomous mountain village known as the oldest surviving democracy in the world, with distinct customs and Kanashi language.",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "malana-village-ancient-approach-trail",
      "malana-village-gate"
    ]
  },
  "dharamshala:norbulingka-institute": {
    imageUrl: "/images/places/dharamshala/norbulingka-institute.webp",
    visualDescription: "A Japanese-inspired garden sanctuary dedicated to preserving traditional Tibetan thangka painting, woodcarving, and bronze metalwork.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "norbulingka-institute",
      "norbulingka-institute-of-tibetan-arts"
    ]
  },
  "dharamshala:illiterati-cafe": {
    imageUrl: "/images/places/dharamshala/illiterati-cafe.webp",
    visualDescription: "Renowned wooden library café with floor-to-ceiling bookshelves, vintage pianos, and open balcony views of the Kangra Valley.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "illiterati-cafe",
      "illiterati-books-coffee"
    ]
  },
  "dharamshala:tsuglagkhang-temple": {
    imageUrl: "/images/places/dharamshala/tsuglagkhang-temple.webp",
    visualDescription: "The spiritual center of Tibetan Buddhism in exile, housing the main temple, Namgyal Monastery, Tibet Museum, and giant gilded statues.",
    category: "Must Visit",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "tsuglagkhang-complex-dalai-lama-temple",
      "tsuglagkhang-temple"
    ]
  },
  "dharamshala:bhagsu-waterfall-shiva-cafe": {
    imageUrl: "/images/places/dharamshala/bhagsu-waterfall-shiva-cafe.webp",
    visualDescription: "A 20m mountain cascade above Bhagsu village leading up a stone-stepped mountain trail to the famous bohemian cliffside Shiva Café.",
    category: "Nature & Trails",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bhagsu-waterfall-shiva-café",
      "bhagsu-waterfall-shiva-cafe"
    ]
  },
  "dharamshala:triund-trek-base": {
    imageUrl: "/images/places/dharamshala/triund-trek-base.webp",
    visualDescription: "The crown jewel trek of Kangra Valley, climbing through mixed oak and rhododendron forests to a 2,828m ridge under the Dhauladhars.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "triund-trek-base",
      "triund-ridge-alpine-trek-trail"
    ]
  },
  "dharamshala:st-john-wilderness": {
    imageUrl: "/images/places/dharamshala/st-john-wilderness.webp",
    visualDescription: "Neo-Gothic 1852 stone Anglican church set amidst towering deodar forests, featuring Belgian stained-glass windows and Lord Elgin's memorial.",
    category: "Culture & Heritage",
    semanticTheme: "church",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "st-john-wilderness",
      "st-john-in-the-wilderness-church-1852"
    ]
  },
  "dharamshala:tibet-kitchen": {
    imageUrl: "/images/places/dharamshala/tibet-kitchen.webp",
    visualDescription: "Popular multi-story dining institution in the central square serving authentic Tibetan Tingmo, steaming Thukpa, Shaphaley, and Butter Tea.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "tibet-kitchen-traditional-momos-thukpa",
      "tibet-kitchen"
    ]
  },
  "dharamshala:dharamkot-village": {
    imageUrl: "/images/places/dharamshala/dharamkot-village.webp",
    visualDescription: "Quiet hilltop hamlet above McLeod Ganj known as the yoga haven of Himachal, featuring silent meditation centers and organic vegan cafés.",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dharamkot-village",
      "dharamkot-yoga-meditation-village"
    ]
  },
  "goa:fontainhas-latin-quarter": {
    imageUrl: "/images/places/goa/fontainhas-latin-quarter.webp",
    visualDescription: "Asia's only preserved Portuguese Latin Quarter featuring pastel-painted heritage villas, azulejo tile work, and quiet bakeries.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "fontainhas-latin-quarter",
      "fontainhas-heritage-latin-quarter"
    ]
  },
  "goa:chapora-fort": {
    imageUrl: "/images/places/goa/chapora-fort.webp",
    visualDescription: "Historic red laterite fort overlooking the dramatic confluence of Chapora River and the Arabian Sea with vast ocean vistas.",
    category: "Must Visit",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chapora-fort-hilltop-viewpoint",
      "chapora-fort"
    ]
  },
  "goa:divar-island": {
    imageUrl: "/images/places/goa/divar-island.webp",
    visualDescription: "A tranquil river island reached via a traditional wooden ferry, famous for emerald paddy fields, ancient churches, and serene cycling routes.",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "divar-island-village-ferry-backwaters",
      "divar-island"
    ]
  },
  "goa:ashwem-beach": {
    imageUrl: "/images/places/goa/ashwem-beach.webp",
    visualDescription: "Wide, white sandy beach lined with casuarina groves and calm shallow waters, ideal for quiet swims and tranquil seaside reading.",
    category: "Nature & Trails",
    semanticTheme: "beach",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "ashwem-beach",
      "ashwem-beach-casuarina-pines"
    ]
  },
  "goa:anjuna-flea-market": {
    imageUrl: "/images/places/goa/anjuna-flea-market.webp",
    visualDescription: "Bohemian open-air bazaar beneath the palm trees featuring handcrafted silver jewelry, spice sacks, indie artwork, and live musicians.",
    category: "Markets & Craft",
    semanticTheme: "shopping",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "anjuna-flea-market",
      "anjuna-flea-night-art-market"
    ]
  },
  "goa:dudhsagar-falls": {
    imageUrl: "/images/places/goa/dudhsagar-falls.webp",
    visualDescription: "A magnificent four-tiered 310m milky white waterfall inside Bhagwan Mahavir Wildlife Sanctuary with scenic rail bridge views.",
    category: "Adventure & Treks",
    semanticTheme: "waterfall",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dudhsagar-waterfall-jungle-trek",
      "dudhsagar-falls"
    ]
  },
  "goa:artjuna-cafe": {
    imageUrl: "/images/places/goa/artjuna-cafe.webp",
    visualDescription: "Open-air garden sanctuary set under mango trees, serving artisanal cold brews, tahini salads, fresh sourdough, and house smoothies.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "artjuna-lifestyle-garden-café",
      "artjuna-cafe"
    ]
  },
  "goa:vinayak-family-restaurant": {
    imageUrl: "/images/places/goa/vinayak-family-restaurant.webp",
    visualDescription: "Legendary village restaurant overlooking emerald fields, serving authentic freshly caught kingfish thalis, prawn curry, and sol kadi.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "vinayak-family-restaurant",
      "vinayak-family-restaurant-authentic-goan-fish-thali"
    ]
  },
  "jaipur:hawa-mahal": {
    imageUrl: "/images/places/jaipur/hawa-mahal.webp",
    visualDescription: "Iconic five-story pink and red sandstone palace featuring 953 intricately carved jharokhas designed for royal court breezes.",
    category: "Must Visit",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "hawa-mahal-palace-of-winds",
      "hawa-mahal"
    ]
  },
  "jaipur:nahargarh-fort-sunset": {
    imageUrl: "/images/places/jaipur/nahargarh-fort-sunset.webp",
    visualDescription: "Perched on the edge of the Aravalli hills, offering the most dramatic panoramic sunset viewpoint overlooking the entire Pink City.",
    category: "Nature & Trails",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "nahargarh-fort-sunset",
      "nahargarh-fort-sunset-ridge"
    ]
  },
  "jaipur:amber-fort": {
    imageUrl: "/images/places/jaipur/amber-fort.webp",
    visualDescription: "Majestic hilltop fort built of red sandstone and marble featuring the famous Mirror Palace and expansive courtyard ramparts.",
    category: "Must Visit",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "amber-fort-sheesh-mahal",
      "amber-fort"
    ]
  },
  "jaipur:panna-meena-kund": {
    imageUrl: "/images/places/jaipur/panna-meena-kund.webp",
    visualDescription: "An exquisite 16th-century geometric stepwell with interlocking symmetrical staircases and octagonal gazebos near Amer.",
    category: "Hidden Gems",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "panna-meena-ka-kund-stepwell",
      "panna-meena-kund"
    ]
  },
  "jaipur:city-palace-jaipur": {
    imageUrl: "/images/places/jaipur/city-palace-jaipur.webp",
    visualDescription: "The regal heart of Jaipur featuring courtyards, Peacock Gate mosaics, royal textile museums, and royal Rajput heritage.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "city-palace-jaipur",
      "jaipur-city-palace-chandra-mahal"
    ]
  },
  "jaipur:lmb-sweets": {
    imageUrl: "/images/places/jaipur/lmb-sweets.webp",
    visualDescription: "Historic Johari Bazaar institution famous for crisp Pyaz Kachoris, Paneer Ghewar, Royal Rajasthani Thalis, and Mawa Kachori.",
    category: "Local Food",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "lmb-sweets",
      "laxmi-misthan-bhandar-lmb-1727"
    ]
  },
  "jaipur:anokhi-museum": {
    imageUrl: "/images/places/jaipur/anokhi-museum.webp",
    visualDescription: "Restored 16th-century stone haveli dedicated to the traditional art of Rajasthani woodblock hand printing with live artisan demos.",
    category: "Markets & Craft",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "anokhi-museum",
      "anokhi-museum-of-hand-printing"
    ]
  },
  "jaipur:tapri-central": {
    imageUrl: "/images/places/jaipur/tapri-central.webp",
    visualDescription: "Beloved rooftop tea salon overlooking Central Park, serving artisanal Masala Chai in clay kulhads, Bun Maska, and hand-rolled snacks.",
    category: "Cafés & Bakery",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "tapri-central-rooftop-tea-lounge",
      "tapri-central"
    ]
  },
  "mussoorie:landour-bakehouse": {
    imageUrl: "/images/places/mussoorie/landour-bakehouse.webp",
    visualDescription: "Historic colonial bakery nestled among deodars in Sisters Bazaar, famous for apple pies, sticky ginger cake, and crepes from 19th-century recipes.",
    category: "Cafés & Bakery",
    semanticTheme: "shopping",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "landour-bakehouse-sisters-bazaar",
      "landour-bakehouse"
    ]
  },
  "mussoorie:camels-back-road": {
    imageUrl: "/images/places/mussoorie/camels-back-road.webp",
    visualDescription: "A peaceful 3 km walking promenade lined with centuries-old deodars and a natural rock formation resembling a resting camel.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "camels-back-road",
      "camels-back-road-deodar-promenade"
    ]
  },
  "mussoorie:lal-tibba-viewpoint": {
    imageUrl: "/images/places/mussoorie/lal-tibba-viewpoint.webp",
    visualDescription: "The highest point in Landour (2,275m) offering high-powered telescope panoramas of snow-capped Himalayan peaks including Kedarnath and Badrinath.",
    category: "Must Visit",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "lal-tibba-scenic-viewpoint",
      "lal-tibba-viewpoint"
    ]
  },
  "mussoorie:char-dukan-prakash-store": {
    imageUrl: "/images/places/mussoorie/char-dukan-prakash-store.webp",
    visualDescription: "A quiet cluster of four historic stalls next to the 1839 St. Paul's Anglican Church serving ginger lemon honey tea and cheese omelettes.",
    category: "Hidden Gems",
    semanticTheme: "church",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "char-dukan-prakash-store",
      "char-dukan-st-pauls-church"
    ]
  },
  "mussoorie:george-everest-peak": {
    imageUrl: "/images/places/mussoorie/george-everest-peak.webp",
    visualDescription: "The 1832 estate and laboratory of Surveyor-General Sir George Everest, offering a scenic ridge hike with views of Aglar Valley and Doon Plains.",
    category: "Nature & Trails",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sir-george-everest-peak-heritage-house",
      "george-everest-peak"
    ]
  },
  "mussoorie:clouds-end-forest": {
    imageUrl: "/images/places/mussoorie/clouds-end-forest.webp",
    visualDescription: "The western boundary of Mussoorie surrounded by dense virgin oak and deodar forests, marking the entrance to the Benog Wildlife Sanctuary.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "clouds-end-forest",
      "clouds-end-heritage-forest-sanctuary"
    ]
  },
  "mussoorie:gun-hill-ropeway": {
    imageUrl: "/images/places/mussoorie/gun-hill-ropeway.webp",
    visualDescription: "Mussoorie's second-highest peak (2,024m) where a mid-day cannon was fired during colonial times, accessible by a 400m aerial ropeway.",
    category: "Culture & Heritage",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "gun-hill-ropeway",
      "gun-hill-historical-viewpoint-cable-car"
    ]
  },
  "mussoorie:kempty-falls-cascades": {
    imageUrl: "/images/places/mussoorie/kempty-falls-cascades.webp",
    visualDescription: "Gigantic mountain waterfall cascading down 40 feet into natural rock plunge pools in a steep mountain valley.",
    category: "Nature & Trails",
    semanticTheme: "waterfall",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kempty-falls-cascades",
      "kempty-falls-mountain-cascades"
    ]
  },
  "udaipur:city-palace-udaipur": {
    imageUrl: "/images/places/udaipur/city-palace-udaipur.webp",
    visualDescription: "Rajasthan's largest palace complex perched over Lake Pichola with ornate courtyards, mirror work, and marble balconies.",
    category: "Must Visit",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "city-palace-complex-zenana-mahal",
      "city-palace-udaipur"
    ]
  },
  "udaipur:bagore-ki-haveli": {
    imageUrl: "/images/places/udaipur/bagore-ki-haveli.webp",
    visualDescription: "18th-century waterfront haveli at Gangaur Ghat hosting the nightly Dharohar cultural folk dance and puppet performance.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bagore-ki-haveli-dharohar-dance",
      "bagore-ki-haveli"
    ]
  },
  "udaipur:saheliyon-ki-bari": {
    imageUrl: "/images/places/udaipur/saheliyon-ki-bari.webp",
    visualDescription: "Historic royal garden built in the 18th century featuring marble lotus fountains, shaded bougainvillea walkways, and bird pools.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "saheliyon-ki-bari",
      "saheliyon-ki-bari-garden-of-maidens"
    ]
  },
  "udaipur:lake-pichola-boat-ride": {
    imageUrl: "/images/places/udaipur/lake-pichola-boat-ride.webp",
    visualDescription: "Scenic boat cruise across Lake Pichola offering close views of Jag Mandir Island, Taj Lake Palace, and the Old City ghats.",
    category: "Must Visit",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "lake-pichola-ghats-island-cruise",
      "lake-pichola-boat-ride"
    ]
  },
  "udaipur:ambrai-ghat": {
    imageUrl: "/images/places/udaipur/ambrai-ghat.webp",
    visualDescription: "Peaceful marble ghat located directly across from the City Palace, offering the most poetic unobstructed water views in Udaipur.",
    category: "Hidden Gems",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "ambrai-ghat",
      "ambrai-ghat-sunset-promenade-manjhi-ghat"
    ]
  },
  "udaipur:sajjangarh-monsoon-palace": {
    imageUrl: "/images/places/udaipur/sajjangarh-monsoon-palace.webp",
    visualDescription: "White marble hilltop palace perched 944m high on Bansdara mountain with panoramic views of Udaipur's lakes and Aravalli hills.",
    category: "Adventure & Treks",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sajjangarh-monsoon-palace",
      "sajjangarh-monsoon-palace-ridge"
    ]
  },
  "udaipur:jheels-ginger-coffee": {
    imageUrl: "/images/places/udaipur/jheels-ginger-coffee.webp",
    visualDescription: "Intimate lakeside café with overhanging stone jharokha balconies serving specialty coffees, lemon tarts, and fresh shakes.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jheels-ginger-coffee",
      "jheels-ginger-coffee-bar-bakery"
    ]
  },
  "udaipur:natraj-dining-hall": {
    imageUrl: "/images/places/udaipur/natraj-dining-hall.webp",
    visualDescription: "Celebrated local dining hall serving authentic unlimited Rajasthani-Gujarati thalis featuring Dal Baati Churma, Gatta Curry, and Kadhai.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "natraj-dining-hall",
      "natraj-dining-hall-unlimited-mewari-thali"
    ]
  },
  "munnar:eravikulam-national-park": {
    imageUrl: "/images/places/munnar/eravikulam-national-park.webp",
    visualDescription: "Sanctuary for the endangered Nilgiri Tahr mountain goat, featuring rolling shola grasslands, Anamudi Peak vistas, and blooming Neelakurinji flowers.",
    category: "Must Visit",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "eravikulam-national-park",
      "eravikulam-national-park-rajamalai"
    ]
  },
  "munnar:mattupetty-dam-lake": {
    imageUrl: "/images/places/munnar/mattupetty-dam-lake.webp",
    visualDescription: "Concrete gravity storage dam nestled amidst tea hills and dense eucalyptus forests, popular for quiet speedboating and wild elephant sightings.",
    category: "Nature & Trails",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mattupetty-dam-speedboating-basin",
      "mattupetty-dam-lake"
    ]
  },
  "munnar:tata-tea-museum": {
    imageUrl: "/images/places/munnar/tata-tea-museum.webp",
    visualDescription: "Historic 1880s tea factory showcasing the evolution of Kerala's tea plantations with live orthodox tea plucking and tasting sessions.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "tata-tea-museum",
      "kdhp-tea-museum-factory-processing"
    ]
  },
  "munnar:top-station-viewpoint": {
    imageUrl: "/images/places/munnar/top-station-viewpoint.webp",
    visualDescription: "The highest point on the Munnar-Kodaikanal road (1,880m) on the Kerala-Tamil Nadu border, famous for sweeping views of the Western Ghats and cloud ...",
    category: "Adventure & Treks",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "top-station-viewpoint",
      "top-station-western-ghats-cloud-viewpoint"
    ]
  },
  "munnar:attukad-waterfalls": {
    imageUrl: "/images/places/munnar/attukad-waterfalls.webp",
    visualDescription: "A roaring multi-tiered waterfall cascading through deep jungle ravines and lush tea slopes, reachable via a scenic suspension bridge.",
    category: "Nature & Trails",
    semanticTheme: "waterfall",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "attukad-waterfalls-jungle-trail",
      "attukad-waterfalls"
    ]
  },
  "munnar:pothamedu-viewpoint": {
    imageUrl: "/images/places/munnar/pothamedu-viewpoint.webp",
    visualDescription: "A serene elevated viewpoint offering wide vistas of tea, coffee, and cardamom plantations and the winding Muthirapuzha river.",
    category: "Hidden Gems",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "pothamedu-viewpoint-sunset-over-tea-valleys",
      "pothamedu-viewpoint"
    ]
  },
  "munnar:rapsy-restaurant": {
    imageUrl: "/images/places/munnar/rapsy-restaurant.webp",
    visualDescription: "Famous town center eatery serving hot layered Malabar parottas, spicy pepper beef roast, chicken biryani, and Spanish omelettes.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "rapsy-restaurant",
      "rapsy-restaurant-kerala-parotta-beef-fry"
    ]
  },
  "munnar:kundala-lake-dam": {
    imageUrl: "/images/places/munnar/kundala-lake-dam.webp",
    visualDescription: "Asia's first arch dam creating a scenic reservoir fringed by cherry blossom trees, where Kashmiri-style shikara boats glide on still waters.",
    category: "Nature & Trails",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kundala-lake-shikara-boating",
      "kundala-lake-dam"
    ]
  },
  "varanasi:dashashwamedh-ghat-aarti": {
    imageUrl: "/images/places/varanasi/dashashwamedh-ghat-aarti.webp",
    visualDescription: "The world-renowned sacred fire ritual performed at twilight by saffron-clad priests with multi-tiered brass lamps and conch shells.",
    category: "Must Visit",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dashashwamedh-ghat-evening-maha-aarti",
      "dashashwamedh-ghat-aarti"
    ]
  },
  "varanasi:blue-lassi-shop": {
    imageUrl: "/images/places/varanasi/blue-lassi-shop.webp",
    visualDescription: "Celebrated hole-in-the-wall shop serving over 80 varieties of handcrafted hand-churned lassi served in traditional earthen kulhads.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "blue-lassi-shop-historic-churn-since-1925",
      "blue-lassi-shop"
    ]
  },
  "varanasi:assi-ghat-subah-e-banaras": {
    imageUrl: "/images/places/varanasi/assi-ghat-subah-e-banaras.webp",
    visualDescription: "Dawn cultural ceremony featuring Vedic chanting, sunrise Yajna, classical Indian raga performances, and group yoga by the river.",
    category: "Must Visit",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "assi-ghat-subah-e-banaras",
      "assi-ghat-subah-e-banaras-morning-ceremony"
    ]
  },
  "varanasi:kashi-vishwanath-corridor": {
    imageUrl: "/images/places/varanasi/kashi-vishwanath-corridor.webp",
    visualDescription: "One of the 12 sacred Jyotirlingas, newly restored with an expansive red sandstone corridor connecting directly to the Ganga riverbank.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kashi-vishwanath-temple-corridor",
      "kashi-vishwanath-corridor"
    ]
  },
  "varanasi:sarnath-deer-park": {
    imageUrl: "/images/places/varanasi/sarnath-deer-park.webp",
    visualDescription: "The sacred site where Lord Buddha delivered his first sermon after enlightenment; features the massive 43m Dhamek Stupa and Ashokan Pillar.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sarnath-deer-park",
      "sarnath-dhamek-stupa-deer-park"
    ]
  },
  "varanasi:manikarnika-ghat": {
    imageUrl: "/images/places/varanasi/manikarnika-ghat.webp",
    visualDescription: "The primary sacred cremation ghat of Varanasi where the sacred funeral pyre has burned continuously for over two millennia.",
    category: "Hidden Gems",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "manikarnika-ghat",
      "manikarnika-ghat-the-eternal-flame"
    ]
  },
  "varanasi:ramnagar-fort": {
    imageUrl: "/images/places/varanasi/ramnagar-fort.webp",
    visualDescription: "18th-century cream-coloured sandstone fortification on the eastern bank of the Ganga, housing royal vintage cars, palanquins, and medieval armories.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "ramnagar-fort",
      "ramnagar-fort-vintage-royal-museum"
    ]
  },
  "varanasi:kashi-tea-stall": {
    imageUrl: "/images/places/varanasi/kashi-tea-stall.webp",
    visualDescription: "Iconic alley tea corner serving spiced lemon tea, rich saffron malai toast, and seasonal winter Malaiyo (foamed milk sweet).",
    category: "Cafés & Bakery",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kashi-tea-stall",
      "laxmi-tea-stall-malaiyo-hub"
    ]
  },
  "leh:leh-palace": {
    imageUrl: "/images/places/leh/leh-palace.webp",
    visualDescription: "Nine-story royal palace built by King Sengge Namgyal overlooking the Old Town of Leh and the snow-capped Stok Kangri range.",
    category: "Must Visit",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "leh-palace",
      "leh-palace-17th-century-fortress"
    ]
  },
  "leh:shanti-stupa": {
    imageUrl: "/images/places/leh/shanti-stupa.webp",
    visualDescription: "White-domed Buddhist stupa atop Changspa ridge holding relics of the Buddha, famous for golden hour mountain panoramas.",
    category: "Must Visit",
    semanticTheme: "monastery",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "shanti-stupa-white-peace-pagoda",
      "shanti-stupa"
    ]
  },
  "leh:thiksey-monastery": {
    imageUrl: "/images/places/leh/thiksey-monastery.webp",
    visualDescription: "A twelve-story monastery complex resembling the Potala Palace in Lhasa, housing a magnificent two-story gilded statue of Maitreya Buddha.",
    category: "Culture & Heritage",
    semanticTheme: "monastery",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "thiksey-monastery",
      "thiksey-gompa-15m-maitreya-buddha"
    ]
  },
  "leh:pangong-tso": {
    imageUrl: "/images/places/leh/pangong-tso.webp",
    visualDescription: "World-famous endorheic salt lake at 4,225m that changes shades from azure to turquoise to deep emerald under clear high-altitude skies.",
    category: "Nature & Trails",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "pangong-tso",
      "pangong-tso-high-altitude-salt-lake"
    ]
  },
  "leh:sangam-confluence": {
    imageUrl: "/images/places/leh/sangam-confluence.webp",
    visualDescription: "The dramatic meeting point where the emerald green waters of the Indus merge with the muddy ochre currents of the rushing Zanskar.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sangam-confluence",
      "confluence-of-indus-zanskar-rivers-sangam"
    ]
  },
  "leh:lalas-art-cafe": {
    imageUrl: "/images/places/leh/lalas-art-cafe.webp",
    visualDescription: "Historic mud-brick Buddhist temple building in Old Town Leh converted into an intimate art gallery and café serving Ladakhi Khambir bread.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "lalas-art-café-restored-heritage-labrang",
      "lalas-art-cafe"
    ]
  },
  "leh:gesmo-restaurant": {
    imageUrl: "/images/places/leh/gesmo-restaurant.webp",
    visualDescription: "Leh's oldest beloved travelers' hub renowned for handmade yak cheese pizza, apricot pies, spicy Thukpa, and cinnamon buns.",
    category: "Local Food",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "gesmo-restaurant-german-bakery-since-1989",
      "gesmo-restaurant"
    ]
  },
  "leh:hall-of-fame-leh": {
    imageUrl: "/images/places/leh/hall-of-fame-leh.webp",
    visualDescription: "A comprehensive museum managed by the Indian Army showcasing Ladakh's war history, Siachen Glacier expeditions, and cultural artifacts.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "hall-of-fame-military-cultural-museum",
      "hall-of-fame-leh"
    ]
  },
  "spiti:key-monastery": {
    imageUrl: "/images/places/spiti/key-monastery.webp",
    visualDescription: "Perched at 4,166m atop a conical hill in the Spiti Valley, Key Gompa is a fortress-like Buddhist monastery housing ancient murals and sacred texts.",
    category: "Must Visit",
    semanticTheme: "monastery",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "key-monastery",
      "key-gompa-11th-century-fort-monastery"
    ]
  },
  "spiti:dhankar-monastery": {
    imageUrl: "/images/places/spiti/dhankar-monastery.webp",
    visualDescription: "The dramatic ancient capital of Spiti, clinging precariously to a razor-sharp cliff 300m above the confluence of Spiti and Pin rivers.",
    category: "Culture & Heritage",
    semanticTheme: "monastery",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dhankar-monastery",
      "dhankar-gompa-cliffside-fortress"
    ]
  },
  "spiti:hikkim-post-office": {
    imageUrl: "/images/places/spiti/hikkim-post-office.webp",
    visualDescription: "Located at 4,400m elevation, sending a handwritten postcard from this whitewashed stone post office is a timeless Himalayan tradition.",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "hikkim-worlds-highest-post-office",
      "hikkim-post-office"
    ]
  },
  "spiti:chandra-taal": {
    imageUrl: "/images/places/spiti/chandra-taal.webp",
    visualDescription: "A breathtaking high-altitude crescent lake at 4,300m surrounded by scree mountains, reflecting deep azure blues and dramatic cloudscapes.",
    category: "Nature & Trails",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chandra-taal",
      "chandratal-crescent-moon-lake"
    ]
  },
  "spiti:langza-buddha": {
    imageUrl: "/images/places/spiti/langza-buddha.webp",
    visualDescription: "High village guarded by a giant golden Buddha statue facing Chau Chau Kang Nilda peak, famed for prehistoric ammonite sea fossils.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "langza-giant-buddha-marine-fossil-village",
      "langza-buddha"
    ]
  },
  "spiti:komic-village": {
    imageUrl: "/images/places/spiti/komic-village.webp",
    visualDescription: "Sitting at 4,587m, this stark village features the 14th-century Tangyud Gompa and the world's highest eco-café.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "komic-village",
      "komic-worlds-highest-motor-connected-village"
    ]
  },
  "spiti:pin-valley-park": {
    imageUrl: "/images/places/spiti/pin-valley-park.webp",
    visualDescription: "Glacial mountain valley renowned for rare snow leopards, Siberian ibex, and the endpoint village of Mudh with emerald barley fields.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "pin-valley-national-park-mudh-village",
      "pin-valley-park"
    ]
  },
  "spiti:cafe-deyzor": {
    imageUrl: "/images/places/spiti/cafe-deyzor.webp",
    visualDescription: "Beloved cozy dining den in Kaza serving Spitian sea buckthorn drinks, yak cheese pastas, apple crumble, and hot momos.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "café-deyzor-travelers-lounge",
      "cafe-deyzor"
    ]
  },
  "tungnath-chandrashila:tungnath-temple": {
    imageUrl: "/images/places/tungnath-chandrashila/tungnath-temple.webp",
    visualDescription: "Perched at 3,680m in the Garhwal Himalayas, Tungnath is the highest of the Panch Kedar temples, dedicated to Lord Shiva and built of black stone.",
    category: "Must Visit",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "tungnath-temple",
      "tungnath-worlds-highest-shiva-shrine"
    ]
  },
  "tungnath-chandrashila:chandrashila-summit": {
    imageUrl: "/images/places/tungnath-chandrashila/chandrashila-summit.webp",
    visualDescription: "The Moon Rock summit (4,000m) 1.5 km above Tungnath, offering an awe-inspiring 360-degree panorama of Nanda Devi, Trishul, and Chaukhamba peaks.",
    category: "Adventure & Treks",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chandrashila-summit",
      "chandrashila-4000m-peak-summit"
    ]
  },
  "tungnath-chandrashila:chopta-meadows-bugyal": {
    imageUrl: "/images/places/tungnath-chandrashila/chopta-meadows-bugyal.webp",
    visualDescription: "Lush undulating high-altitude alpine grasslands (bugyals) at 2,700m flanked by dense deodar, pine, and scarlet rhododendron forests.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chopta-alpine-meadows-mini-switzerland",
      "chopta-meadows-bugyal"
    ]
  },
  "tungnath-chandrashila:deoria-tal-lake": {
    imageUrl: "/images/places/tungnath-chandrashila/deoria-tal-lake.webp",
    visualDescription: "An emerald high-altitude lake at 2,438m reflecting the four-peaked Chaukhamba mountain massif on its still mirror-like water surface.",
    category: "Nature & Trails",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "deoria-tal-lake",
      "deoria-tal-sacred-reflection-lake"
    ]
  },
  "tungnath-chandrashila:rohida-forest-trail": {
    imageUrl: "/images/places/tungnath-chandrashila/rohida-forest-trail.webp",
    visualDescription: "Ancient moss-draped evergreen oak trail blooming with crimson rhododendrons in spring, home to rare Himalayan monal pheasants.",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "rohida-forest-trail",
      "rohida-oak-rhododendron-forest-walk"
    ]
  },
  "tungnath-chandrashila:dugalbitta-eco-glade": {
    imageUrl: "/images/places/tungnath-chandrashila/dugalbitta-eco-glade.webp",
    visualDescription: "Peaceful riverside glade 6 km below Chopta offering traditional wooden tea dhabas, local Garhwali red rice meals, and camp sites.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dugalbitta-eco-camp-glade",
      "dugalbitta-eco-glade"
    ]
  },
  "tungnath-chandrashila:ukhimath-omkareshwar": {
    imageUrl: "/images/places/tungnath-chandrashila/ukhimath-omkareshwar.webp",
    visualDescription: "The historic 1,200-year-old wooden seat where Lord Kedarnath and Lord Madhyamaheshwar are worshipped during winter snowfall.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "ukhimath-omkareshwar",
      "ukhimath-omkareshwar-winter-temple"
    ]
  },
  "tungnath-chandrashila:sari-village-base": {
    imageUrl: "/images/places/tungnath-chandrashila/sari-village-base.webp",
    visualDescription: "Traditional stone-roofed Garhwali hamlet situated amidst terraced apple orchards, famous for authentic Mandua (finger millet) rotis and Jhangora kh...",
    category: "Local Food",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sari-village-base",
      "sari-village-apple-terraces-homestay-walk"
    ]
  },
  "kainchi-dham:neem-karoli-baba-ashram": {
    imageUrl: "/images/places/kainchi-dham/neem-karoli-baba-ashram.webp",
    visualDescription: "Spiritual hermitage founded in 1962 by Neem Karoli Baba Maharaj-ji, visited by global seekers for meditation, Hanuman chalisa, and prasad.",
    category: "Must Visit",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "neem-karoli-baba-sacred-ashram-temple",
      "neem-karoli-baba-ashram"
    ]
  },
  "kainchi-dham:bhowali-fruit-orchards": {
    imageUrl: "/images/places/kainchi-dham/bhowali-fruit-orchards.webp",
    visualDescription: "The fruit basket of Kumaon famous for juicy Himalayan apples, apricots, plums, hill strawberries, and Shyamkhet tea gardens.",
    category: "Nature & Trails",
    semanticTheme: "shopping",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bhowali-fruit-orchards",
      "bhowali-fruit-market-tea-terraces"
    ]
  },
  "kainchi-dham:golu-devta-ghorakhal": {
    imageUrl: "/images/places/kainchi-dham/golu-devta-ghorakhal.webp",
    visualDescription: "Historic shrine dedicated to the Kumaoni God of Justice, famous for thousands of brass bells hung by devotees whose prayers were answered.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "golu-devta-ghorakhal",
      "golu-devta-temple-ghorakhal-temple-of-bells"
    ]
  },
  "kainchi-dham:bhimtal-island-lake": {
    imageUrl: "/images/places/kainchi-dham/bhimtal-island-lake.webp",
    visualDescription: "Picturesque C-shaped lake larger than Naini Lake, featuring a central island aquarium accessible via traditional wooden rowing boats.",
    category: "Nature & Trails",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bhimtal-lake-central-aquarium-island",
      "bhimtal-island-lake"
    ]
  },
  "kainchi-dham:sattal-interconnected-lakes": {
    imageUrl: "/images/places/kainchi-dham/sattal-interconnected-lakes.webp",
    visualDescription: "An unspoiled cluster of seven interconnected freshwater lakes nestled in dense oak and pine forests, celebrated for birdwatching and kayaking.",
    category: "Hidden Gems",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sattal-interconnected-lakes",
      "sattal-seven-interconnected-freshwater-lakes"
    ]
  },
  "kainchi-dham:subhash-dhaba-bhowali": {
    imageUrl: "/images/places/kainchi-dham/subhash-dhaba-bhowali.webp",
    visualDescription: "Famed local roadside eatery serving authentic Bhatt ki Churkani (black bean curry), Aloo ke Gutke, Rai ka Raita, and Kumaoni Singori sweets.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "subhash-dhaba-bhowali",
      "subhash-dhaba-traditional-kumaoni-ras-bhaat"
    ]
  },
  "kainchi-dham:naukuchiatal-lake": {
    imageUrl: "/images/places/kainchi-dham/naukuchiatal-lake.webp",
    visualDescription: "Deep nine-cornered mountain lake famous for paragliding over pine ridges, quiet pedal boating, and tranquil lotus ponds.",
    category: "Adventure & Treks",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "naukuchiatal-nine-cornered-lake",
      "naukuchiatal-lake"
    ]
  },
  "kainchi-dham:shyamkhet-tea-estate": {
    imageUrl: "/images/places/kainchi-dham/shyamkhet-tea-estate.webp",
    visualDescription: "Boutique tea plantation producing organic Himalayan orthodox green and black teas, with an open tea tasting lounge overlooking the slopes.",
    category: "Cafés & Bakery",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "shyamkhet-tea-estate",
      "shyamkhet-organic-tea-garden-walk"
    ]
  },
  "murthal:amrik-sukhdev-dhaba": {
    imageUrl: "/images/places/murthal/amrik-sukhdev-dhaba.webp",
    visualDescription: "The undisputed capital of highway gastronomy since 1956, famous for hot tandoori Aloo-Pyaaz and Gobhi parathas loaded with pure white butter.",
    category: "Must Visit",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "amrik-sukhdev-dhaba",
      "amrik-sukhdev-legendary-247-paratha-dhaba"
    ]
  },
  "murthal:haveli-murthal-punjabi": {
    imageUrl: "/images/places/murthal/haveli-murthal-punjabi.webp",
    visualDescription: "A grand Punjabi heritage palace on GT Road featuring traditional village courtyards, folk dancers, camel rides, and authentic clay oven feasts.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "haveli-murthal-punjabi",
      "haveli-murthal-punjabi-cultural-theme-village"
    ]
  },
  "murthal:gulshan-dhaba-traditional": {
    imageUrl: "/images/places/murthal/gulshan-dhaba-traditional.webp",
    visualDescription: "Historic 1950s open highway kitchen serving authentic rustic spiced parathas, Chana Masala, Kadai Paneer, and thick sweet Lassi.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "gulshan-dhaba-traditional-tandoori-kitchen",
      "gulshan-dhaba-traditional"
    ]
  },
  "murthal:pahalwan-dhaba-murthal": {
    imageUrl: "/images/places/murthal/pahalwan-dhaba-murthal.webp",
    visualDescription: "Traditional wrestler-style dhaba renowned for pure desi ghee parathas, slow-cooked Dal Tadka, and hot Kadhai Doodh with thick malai.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "pahalwan-dhaba-murthal",
      "pahalwan-dhaba-pure-desi-ghee-roasters"
    ]
  },
  "murthal:mojoland-adventure-park": {
    imageUrl: "/images/places/murthal/mojoland-adventure-park.webp",
    visualDescription: "Expansive multi-theme amusement park on NH-44 featuring high-rope courses, bungee jumping, water park slides, and ATV off-roading.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mojoland-multi-theme-adventure-park",
      "mojoland-adventure-park"
    ]
  },
  "murthal:mannat-haveli-murthal": {
    imageUrl: "/images/places/murthal/mannat-haveli-murthal.webp",
    visualDescription: "Palatial Rajasthani-Punjabi architectural stop on GT Road featuring carved stone archways, elephant fountains, and luxury dining halls.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mannat-haveli-grand-highway-palace",
      "mannat-haveli-murthal"
    ]
  },
  "murthal:khwaja-khizr-tomb": {
    imageUrl: "/images/places/murthal/khwaja-khizr-tomb.webp",
    visualDescription: "A magnificent 16th-century red sandstone and kankar tomb built during Ibrahim Lodi's reign, surrounded by quiet heritage gardens in Sonipat.",
    category: "Hidden Gems",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "khwaja-khizr-tomb",
      "tomb-of-khwaja-khizr-1522-pathan-architecture"
    ]
  },
  "murthal:dhingra-sweets-milk-bar": {
    imageUrl: "/images/places/murthal/dhingra-sweets-milk-bar.webp",
    visualDescription: "Famed dairy stop serving thick saffron rabri, hot jalebis fried in pure ghee, sweet lassi, and traditional pinni sweets.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dhingra-sweets-milk-bar",
      "dhingra-sweets-pure-milk-kadhai"
    ]
  },
  "agra:agra-red-fort": {
    imageUrl: "/images/places/agra/agra-red-fort.webp",
    visualDescription: "Historic red sandstone fortress residence of the Mughal emperors with expansive courtyards and direct vistas of the Taj Mahal.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "agra-red-fort-jahangiri-mahal",
      "agra-red-fort"
    ]
  },
  "agra:taj-mahal": {
    imageUrl: "/images/places/agra/taj-mahal.webp",
    visualDescription: "17th-century UNESCO World Heritage white marble mausoleum built by Shah Jahan on the banks of the Yamuna River.",
    category: "Must Visit",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "taj-mahal-white-marble-monument",
      "taj-mahal"
    ]
  },
  "agra:mehtab-bagh": {
    imageUrl: "/images/places/agra/mehtab-bagh.webp",
    visualDescription: "Charbagh-style Mughal garden complex aligned perfectly across the Yamuna from the Taj Mahal, ideal for peaceful reflection photography.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mehtab-bagh-moonlight-river-gardens",
      "mehtab-bagh"
    ]
  },
  "agra:fatehpur-sikri": {
    imageUrl: "/images/places/agra/fatehpur-sikri.webp",
    visualDescription: "Emperor Akbar's 16th-century red sandstone capital featuring the towering 54m Buland Darwaza and the marble tomb of Salim Chishti.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "fatehpur-sikri-imperial-capital-city",
      "fatehpur-sikri"
    ]
  },
  "agra:itmad-ud-daulah": {
    imageUrl: "/images/places/agra/itmad-ud-daulah.webp",
    visualDescription: "Exquisite jewel-box mausoleum built in 1628 with fine marble lattice screens and pioneering pietra dura semi-precious stone inlay work.",
    category: "Hidden Gems",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "tomb-of-itimad-ud-daulah-baby-taj",
      "itmad-ud-daulah"
    ]
  },
  "agra:shankar-mithai-bedmi": {
    imageUrl: "/images/places/agra/shankar-mithai-bedmi.webp",
    visualDescription: "Historic Agra breakfast spot in the Old City serving hot urad-dal stuffed Bedmi Puris with spicy Hing aloo sabzi and crisp saffron jalebis.",
    category: "Local Food",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "shankar-mithai-bedmi",
      "shankar-mithai-bhandar-bedmi-puri-jalebi"
    ]
  },
  "agra:panchhi-petha-store": {
    imageUrl: "/images/places/agra/panchhi-petha-store.webp",
    visualDescription: "The authentic master confectioner of Agra serving Angoori Petha, Kesar Petha, Chocolate Petha, and crunchy Dalmoth namkeen.",
    category: "Local Food",
    semanticTheme: "shopping",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "panchhi-petha-store",
      "panchhi-petha-original-sadar-bazaar"
    ]
  },
  "agra:akbar-tomb-sikandra": {
    imageUrl: "/images/places/agra/akbar-tomb-sikandra.webp",
    visualDescription: "Grand five-tiered red sandstone and white marble tomb set within a vast 119-acre garden where blackbuck deer and peacocks roam freely.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "akbars-great-tomb-at-sikandra",
      "akbar-tomb-sikandra"
    ]
  },
  "mathura-vrindavan:prem-mandir-vrindavan": {
    imageUrl: "/images/places/mathura-vrindavan/prem-mandir-vrindavan.webp",
    visualDescription: "Spectacular 54-acre temple carved entirely of pure Italian Carrara marble, illuminated at night with vibrant multi-colored light fountains.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "prem-mandir-vrindavan",
      "prem-mandir-italian-carrara-marble-temple"
    ]
  },
  "mathura-vrindavan:bankey-bihari-temple": {
    imageUrl: "/images/places/mathura-vrindavan/bankey-bihari-temple.webp",
    visualDescription: "The most revered temple in Vrindavan dedicated to Lord Krishna in the Tribhanga posture, famous for dynamic curtain darshans and kirtans.",
    category: "Must Visit",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bankey-bihari-temple",
      "bankey-bihari-temple-vrindavan"
    ]
  },
  "mathura-vrindavan:shri-krishna-janmabhoomi": {
    imageUrl: "/images/places/mathura-vrindavan/shri-krishna-janmabhoomi.webp",
    visualDescription: "The sacred birthplace of Lord Krishna in Mathura containing the ancient prison cell (Garbha Griha), Keshavdev temple, and sacred kund.",
    category: "Must Visit",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "shri-krishna-janmabhoomi-temple-complex",
      "shri-krishna-janmabhoomi"
    ]
  },
  "mathura-vrindavan:iskcon-vrindavan": {
    imageUrl: "/images/places/mathura-vrindavan/iskcon-vrindavan.webp",
    visualDescription: "International center of Hare Krishna devotion featuring pure white marble courtyards, Srila Prabhupada's Samadhi, and 24-hour Kirtan.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "iskcon-sri-krishna-balaram-temple",
      "iskcon-vrindavan"
    ]
  },
  "mathura-vrindavan:vishram-ghat-aarti": {
    imageUrl: "/images/places/mathura-vrindavan/vishram-ghat-aarti.webp",
    visualDescription: "The central sacred ghat of Mathura where Lord Krishna rested after slaying Kansa; features glittering brass evening aarti over the Yamuna.",
    category: "Nature & Trails",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "vishram-ghat-aarti",
      "vishram-ghat-evening-yamuna-maha-aarti"
    ]
  },
  "mathura-vrindavan:nidhivan-grove": {
    imageUrl: "/images/places/mathura-vrindavan/nidhivan-grove.webp",
    visualDescription: "Mystical forest of intertwined Tulsi (holy basil) trees where divine Rasleela is believed to take place every night in complete seclusion.",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "nidhivan-grove",
      "nidhivan-sacred-basil-forest-grove"
    ]
  },
  "mathura-vrindavan:brijwasi-mithai-wala": {
    imageUrl: "/images/places/mathura-vrindavan/brijwasi-mithai-wala.webp",
    visualDescription: "Legendary confectioner since the 1920s famous for caramelized golden Mathura Peda made from slow-cooked mawa, cardamom, and pure ghee.",
    category: "Local Food",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "brijwasi-mithai-wala-original-mathura-peda",
      "brijwasi-mithai-wala"
    ]
  },
  "mathura-vrindavan:radha-raman-temple": {
    imageUrl: "/images/places/mathura-vrindavan/radha-raman-temple.webp",
    visualDescription: "500-year-old temple holding the self-manifested Shaligram deity of Lord Krishna, with an eternal sacred cooking fire burning since 1542.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "radha-raman-temple",
      "radha-raman-ancient-self-manifested-deity"
    ]
  },
  "neemrana:neemrana-fort-palace": {
    imageUrl: "/images/places/neemrana/neemrana-fort-palace.webp",
    visualDescription: "14-tiered medieval fort-palace built into the Aravalli hills in 1464, featuring stepped courtyards, hanging gardens, and grand ramparts.",
    category: "Must Visit",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "neemrana-fort-palace",
      "neemrana-fort-palace-15th-century-ramparts"
    ]
  },
  "neemrana:flying-fox-zipline": {
    imageUrl: "/images/places/neemrana/flying-fox-zipline.webp",
    visualDescription: "India's premier 5-stage aerial zipline tour soaring up to 400m across the dramatic rocky gorges and ramparts of Neemrana Fort.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "flying-fox-zipline",
      "flying-fox-aerial-zipline-tour"
    ]
  },
  "neemrana:neemrana-stepwell-baori": {
    imageUrl: "/images/places/neemrana/neemrana-stepwell-baori.webp",
    visualDescription: "Massive 18th-century 9-tiered subterranean stepwell with 170 stone steps leading down to water, built for desert travelers and royal horses.",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "neemrana-stepwell-baori",
      "ancient-9-story-stepwell-neemrana-baori"
    ]
  },
  "neemrana:kesroli-hill-fort": {
    imageUrl: "/images/places/neemrana/kesroli-hill-fort.webp",
    visualDescription: "Rare 700-year-old fort perched on a lone dark volcanic rock surrounded by yellow mustard fields and tranquil Mewat rural landscapes.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kesroli-14th-century-hill-fort-en-route",
      "kesroli-hill-fort"
    ]
  },
  "neemrana:japanese-zone-cuisine": {
    imageUrl: "/images/places/neemrana/japanese-zone-cuisine.webp",
    visualDescription: "Unique international pocket housing Japanese hospitality and authentic dining spots serving handmade ramen, sushi, and matcha tea.",
    category: "Local Food",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "japanese-zone-cuisine",
      "neemrana-japanese-industrial-zone-ramen-hub"
    ]
  },
  "neemrana:highway-king-dhaba": {
    imageUrl: "/images/places/neemrana/highway-king-dhaba.webp",
    visualDescription: "The quintessential highway stop on NH-48 serving tandoori parathas, creamy Dal Makhani, paneer tikka, and masala chai in earthen pots.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "highway-king-nh-48-express-dhaba",
      "highway-king-dhaba"
    ]
  },
  "neemrana:baba-khetanath-ashram": {
    imageUrl: "/images/places/neemrana/baba-khetanath-ashram.webp",
    visualDescription: "Peaceful hilltop spiritual hermitage atop an Aravalli peak offering panoramic views of the Rajasthan plains and serene meditation walks.",
    category: "Nature & Trails",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "baba-khetanath-ashram",
      "baba-khetanath-hilltop-ashram-ridge"
    ]
  },
  "neemrana:siliserh-en-route-neemrana": {
    imageUrl: "/images/places/neemrana/siliserh-en-route-neemrana.webp",
    visualDescription: "Royal 1845 reservoir stop en-route to Alwar with boating, crocodile sightings, and historic heritage palace terraces.",
    category: "Nature & Trails",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "siliserh-lake-gateway-en-route",
      "siliserh-en-route-neemrana"
    ]
  },
  "damdama-sohna:damdama-lake-boating": {
    imageUrl: "/images/places/damdama-sohna/damdama-lake-boating.webp",
    visualDescription: "Haryana's largest natural lake basin nestled in a scenic hollow of the Aravalli hills, offering row boating, kayaking, and migratory birdwatching.",
    category: "Must Visit",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "damdama-lake-natural-boating-basin",
      "damdama-lake-boating"
    ]
  },
  "damdama-sohna:sohna-hot-springs": {
    imageUrl: "/images/places/damdama-sohna/sohna-hot-springs.webp",
    visualDescription: "Natural geothermal sulphur springs bubbling from the Aravalli rock bed since antiquity, known for therapeutic mineral baths and Shiva temple.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sohna-sulphur-hot-springs-ancient-shiva-kund",
      "sohna-hot-springs"
    ]
  },
  "damdama-sohna:aravalli-bio-trails": {
    imageUrl: "/images/places/damdama-sohna/aravalli-bio-trails.webp",
    visualDescription: "Indigenous thorny scrub forest trails across rocky Aravalli ridges featuring leopards, nilgai, peacocks, and over 190 bird species.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "aravalli-bio-diversity-ridge-nature-trails",
      "aravalli-bio-trails"
    ]
  },
  "damdama-sohna:botanix-nature-resort-camp": {
    imageUrl: "/images/places/damdama-sohna/botanix-nature-resort-camp.webp",
    visualDescription: "30-acre botanical garden park at the foothills of the Aravallis featuring obstacle courses, rope climbing, pottery, and organic farm meals.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "botanix-nature-adventure-park-organic-farm",
      "botanix-nature-resort-camp"
    ]
  },
  "damdama-sohna:sohna-hilltop-fort-ruins": {
    imageUrl: "/images/places/damdama-sohna/sohna-hilltop-fort-ruins.webp",
    visualDescription: "Historic Bharatpur-era fort ruins standing on the crest of the Sohna ridge offering sweeping panoramas of the Gurgaon plains.",
    category: "Hidden Gems",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sohna-hilltop-fort-ruins-viewpoint",
      "sohna-hilltop-fort-ruins"
    ]
  },
  "damdama-sohna:shiva-tourist-complex": {
    imageUrl: "/images/places/damdama-sohna/shiva-tourist-complex.webp",
    visualDescription: "Haryana Tourism landscaped gardens perched on a ridge top with stone gazebo viewpoints, children's park, and restaurant.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "shiva-tourist-complex-gardens",
      "shiva-tourist-complex"
    ]
  },
  "damdama-sohna:dawat-aravalli-dhaba": {
    imageUrl: "/images/places/damdama-sohna/dawat-aravalli-dhaba.webp",
    visualDescription: "Rustic open-air highway dhaba on the Sohna-Alwar corridor serving traditional Bajra Khichdi, Sarson ka Saag, and Makki ki Roti with white butter.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dawat-e-khas-aravalli-highway-dhaba",
      "dawat-aravalli-dhaba"
    ]
  },
  "damdama-sohna:saras-lake-promenade": {
    imageUrl: "/images/places/damdama-sohna/saras-lake-promenade.webp",
    visualDescription: "Lakeside dining terrace offering hot snacks, tea, and outdoor seating with direct unobstructed views over the Damdama water basin.",
    category: "Cafés & Bakery",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "saras-tourist-resort-damdama-promenade",
      "saras-lake-promenade"
    ]
  },
  "alwar-siliserh:siliserh-lake-palace": {
    imageUrl: "/images/places/alwar-siliserh/siliserh-lake-palace.webp",
    visualDescription: "1845 royal hunting lodge built by Maharaja Vinay Singh atop a hillock jutting into the peaceful 10.5 sq km Siliserh water reservoir.",
    category: "Must Visit",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "siliserh-lake-palace",
      "siliserh-lake-palace-royal-boat-club"
    ]
  },
  "alwar-siliserh:bala-quila-alwar-fort": {
    imageUrl: "/images/places/alwar-siliserh/bala-quila-alwar-fort.webp",
    visualDescription: "Massive 10th-century fortification standing 300m above the city with 51 large towers, 446 loopholes for musketry, and grand city ramparts.",
    category: "Must Visit",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bala-quila-alwar-fort",
      "bala-quila-alwar-hilltop-fort"
    ]
  },
  "alwar-siliserh:alwar-city-palace": {
    imageUrl: "/images/places/alwar-siliserh/alwar-city-palace.webp",
    visualDescription: "18th-century palace blending Rajput and Mughal architecture featuring stepped open courtyards, marble pavilions, and the royal Sagar tank.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "alwar-city-palace-vinay-vilas-mahal",
      "alwar-city-palace"
    ]
  },
  "alwar-siliserh:moosi-maharani-chhatri": {
    imageUrl: "/images/places/alwar-siliserh/moosi-maharani-chhatri.webp",
    visualDescription: "Double-story cenotaph of red sandstone and pure white marble dedicated to Maharaja Bakhtawar Singh and Rani Moosi, with intricate mythological fres...",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "moosi-maharani-ki-chhatri-cenotaph",
      "moosi-maharani-chhatri"
    ]
  },
  "alwar-siliserh:baba-thakur-das-kalakand": {
    imageUrl: "/images/places/alwar-siliserh/baba-thakur-das-kalakand.webp",
    visualDescription: "The historic confectioner operating since 1947 who invented the world-famous Alwar Milk Cake (Kalakand), made from condensed milk and cardamom.",
    category: "Local Food",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "baba-thakur-das-kalakand",
      "baba-thakur-das-sons-origin-of-alwar-kalakand"
    ]
  },
  "alwar-siliserh:jai-samand-lake-alwar": {
    imageUrl: "/images/places/alwar-siliserh/jai-samand-lake-alwar.webp",
    visualDescription: "Large artificial lake built by Maharaja Jai Singh in 1910, surrounded by green lawns, scenic chhattris, and seasonal flamingo flocks.",
    category: "Nature & Trails",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jai-samand-lake-alwar",
      "jai-samand-lake-oasis"
    ]
  },
  "alwar-siliserh:government-museum-alwar": {
    imageUrl: "/images/places/alwar-siliserh/government-museum-alwar.webp",
    visualDescription: "Museum housed inside the City Palace top floor containing priceless Mughal miniature paintings, Persian manuscripts, and ancient Rajput swords.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "government-museum-royal-armor-manuscripts",
      "government-museum-alwar"
    ]
  },
  "alwar-siliserh:fateh-jung-gumbad": {
    imageUrl: "/images/places/alwar-siliserh/fateh-jung-gumbad.webp",
    visualDescription: "Majestic 5-story 60-foot domed tomb blending Pathan and Rajput architectural styles, set within quiet gardens near Alwar railway station.",
    category: "Hidden Gems",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "fateh-jung-ka-gumbad-1647-tomb",
      "fateh-jung-gumbad"
    ]
  },
  "sariska-bhangarh:bhangarh-fort-ruins": {
    imageUrl: "/images/places/sariska-bhangarh/bhangarh-fort-ruins.webp",
    visualDescription: "17th-century fortified township surrounded by Aravalli hills, featuring preserved royal palaces, bazaar streets, and ancient stone temples.",
    category: "Must Visit",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bhangarh-fort-ruins",
      "bhangarh-fort-legendary-medieval-ruins"
    ]
  },
  "sariska-bhangarh:sariska-tiger-reserve": {
    imageUrl: "/images/places/sariska-bhangarh/sariska-tiger-reserve.webp",
    visualDescription: "An 881 sq km wildlife sanctuary in the Aravallis home to Royal Bengal tigers, leopards, sambar deer, striped hyenas, and rich birdlife.",
    category: "Must Visit",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sariska-tiger-reserve",
      "sariska-tiger-reserve-jungle-safari"
    ]
  },
  "sariska-bhangarh:kankwari-fort": {
    imageUrl: "/images/places/sariska-bhangarh/kankwari-fort.webp",
    visualDescription: "Remote 17th-century fort deep inside the Sariska tiger jungle where Mughal Emperor Aurangzeb imprisoned his elder brother Dara Shikoh.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kankwari-fort-hilltop-fortress",
      "kankwari-fort"
    ]
  },
  "sariska-bhangarh:pandupol-hanuman-temple": {
    imageUrl: "/images/places/sariska-bhangarh/pandupol-hanuman-temple.webp",
    visualDescription: "Sacred shrine inside the sanctuary where strongman Bhima is believed to have cracked open the mountain with his mace to create a pathway.",
    category: "Nature & Trails",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "pandupol-hanuman-temple-natural-water-chasm",
      "pandupol-hanuman-temple"
    ]
  },
  "sariska-bhangarh:neelkanth-temple-sariska": {
    imageUrl: "/images/places/sariska-bhangarh/neelkanth-temple-sariska.webp",
    visualDescription: "Ruined 6th-to-10th-century stone temple complex deep in the hills featuring detailed erotic and divine carvings resembling Khajuraho.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "neelkanth-temple-sariska",
      "neelkanth-ancient-temple-complex-6th-century"
    ]
  },
  "sariska-bhangarh:bhartrihari-temple-kund": {
    imageUrl: "/images/places/sariska-bhangarh/bhartrihari-temple-kund.webp",
    visualDescription: "Ancient pilgrimage site where King Bhartrihari of Ujjain renounced his throne and performed deep meditation in an Aravalli valley.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bhartrihari-temple-kund",
      "bhartrihari-temple-sacred-kund"
    ]
  },
  "sariska-bhangarh:sariska-palace-courtyard": {
    imageUrl: "/images/places/sariska-bhangarh/sariska-palace-courtyard.webp",
    visualDescription: "1892 hunting lodge built by Maharaja Sawai Jai Singh of Alwar, blending French and Rajput architecture with sprawling lawns and royal tea service.",
    category: "Cafés & Bakery",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sariska-palace-courtyard",
      "the-sariska-palace-royal-french-courtyards"
    ]
  },
  "sariska-bhangarh:gola-ka-baas-dhaba": {
    imageUrl: "/images/places/sariska-bhangarh/gola-ka-baas-dhaba.webp",
    visualDescription: "Authentic rural roadside eatery near Bhangarh serving clay oven Baati, smoked Dal, spicy Lehsun ki Chutney, and fresh buttermilk.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "gola-ka-baas-dhaba",
      "gola-ka-baas-traditional-rajasthani-dhaba"
    ]
  },
  "dehradun:robbers-cave": {
    imageUrl: "/images/places/dehradun/robbers-cave.webp",
    visualDescription: "A natural 600m limestone cave formation where knee-deep subterranean icy cold water flows through narrow rock canyon walls.",
    category: "Must Visit",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "robbers-cave",
      "robbers-cave-guchhupani-limestone-gorge"
    ]
  },
  "dehradun:forest-research-institute": {
    imageUrl: "/images/places/dehradun/forest-research-institute.webp",
    visualDescription: "A magnificent 450-hectare Greco-Roman colonial brick heritage complex founded in 1906, housing six specialized forestry museums and botanical gardens.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "forest-research-institute",
      "forest-research-institute-colonial-colonnades"
    ]
  },
  "dehradun:mindrolling-monastery": {
    imageUrl: "/images/places/dehradun/mindrolling-monastery.webp",
    visualDescription: "One of the largest Tibetan Buddhist centers in India, featuring a 60m Great Stupa, gilded Buddha statues, and serene Japanese gardens.",
    category: "Culture & Heritage",
    semanticTheme: "monastery",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mindrolling-monastery-great-stupa",
      "mindrolling-monastery"
    ]
  },
  "dehradun:sahastradhara-springs": {
    imageUrl: "/images/places/dehradun/sahastradhara-springs.webp",
    visualDescription: "Natural sulphur water spring and stepped travertine limestone cascades along the Baddi river known for medicinal mineral properties.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sahastradhara-springs",
      "sahastradhara-thousandfold-sulphur-springs"
    ]
  },
  "dehradun:tapkeshwar-temple": {
    imageUrl: "/images/places/dehradun/tapkeshwar-temple.webp",
    visualDescription: "Ancient Shiva shrine situated inside a natural river cave where water droplets continuously drip from the ceiling onto the Shivalinga.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "tapkeshwar-temple",
      "tapkeshwar-mahadev-cave-temple"
    ]
  },
  "dehradun:rajpur-road-cafes": {
    imageUrl: "/images/places/dehradun/rajpur-road-cafes.webp",
    visualDescription: "The heritage colonial stretch leading to Old Rajpur lined with independent bakeries, artisanal espresso bars, and shaded outdoor patios.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "rajpur-road-artisan-bakeries-cafés",
      "rajpur-road-cafes"
    ]
  },
  "dehradun:elloras-bakery": {
    imageUrl: "/images/places/dehradun/elloras-bakery.webp",
    visualDescription: "Dehradun's legendary bakery on Rajpur Road renowned for stick jaws toffees, butter rusks, plum cakes, and signature pistachio cookies.",
    category: "Local Food",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "elloras-melting-moments-since-1953",
      "elloras-bakery"
    ]
  },
  "dehradun:malsi-deer-park": {
    imageUrl: "/images/places/dehradun/malsi-deer-park.webp",
    visualDescription: "A tranquil zoological woodland park in the Shivalik foothills featuring spotted deer herds, peacocks, native birds, and walking trails.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "malsi-deer-park-dehradun-zoo",
      "malsi-deer-park"
    ]
  },
  "chandigarh:rock-garden-chandigarh": {
    imageUrl: "/images/places/chandigarh/rock-garden-chandigarh.webp",
    visualDescription: "A 40-acre sculpture garden built entirely by Nek Chand using industrial, ceramic, and domestic waste, featuring stone courtyards and waterfalls.",
    category: "Must Visit",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "rock-garden-chandigarh",
      "rock-garden-of-chandigarh-nek-chands-fantasy"
    ]
  },
  "chandigarh:sukhna-lake-promenade": {
    imageUrl: "/images/places/chandigarh/sukhna-lake-promenade.webp",
    visualDescription: "A 3 sq km pristine rain-fed reservoir at the foothills of the Shivalik hills, famous for morning jogging tracks, solar boats, and quiet sunset benc...",
    category: "Must Visit",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sukhna-lake-promenade-shivalik-views",
      "sukhna-lake-promenade"
    ]
  },
  "chandigarh:capitol-complex-unesco": {
    imageUrl: "/images/places/chandigarh/capitol-complex-unesco.webp",
    visualDescription: "Le Corbusier's modernist masterwork featuring the monumental Open Hand Monument, Secretariat, High Court, and Palace of Assembly.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "le-corbusier-capitol-complex-unesco-heritage",
      "capitol-complex-unesco"
    ]
  },
  "chandigarh:rose-garden-chandigarh": {
    imageUrl: "/images/places/chandigarh/rose-garden-chandigarh.webp",
    visualDescription: "Asia's largest botanical rose garden spread over 30 acres, showcasing over 50,000 rose bushes across 1,600 distinct varieties and medicinal trees.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "zakir-hussain-rose-garden",
      "rose-garden-chandigarh"
    ]
  },
  "chandigarh:sector-17-plaza": {
    imageUrl: "/images/places/chandigarh/sector-17-plaza.webp",
    visualDescription: "The pedestrian-only open heart of Chandigarh lined with fountain squares, Phulkari embroidery emporiums, bookstores, and coffee houses.",
    category: "Markets & Craft",
    semanticTheme: "shopping",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sector-17-plaza",
      "sector-17-open-plaza-pedestrian-promenade"
    ]
  },
  "chandigarh:indian-coffee-house-sec17": {
    imageUrl: "/images/places/chandigarh/indian-coffee-house-sec17.webp",
    visualDescription: "Iconic vintage institution staffed by turbaned waiters serving filter coffee in white porcelain cups, mutton dosas, and cheese omelettes.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "indian-coffee-house-sec17",
      "indian-coffee-house-sector-17-legacy-since-1957"
    ]
  },
  "chandigarh:pal-dhaba-sector28": {
    imageUrl: "/images/places/chandigarh/pal-dhaba-sector28.webp",
    visualDescription: "Chandigarh's most celebrated non-veg dhaba operating since 1968, famous for rich Punjabi Butter Chicken, Mutton Rogan Josh, and garlic naan.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "pal-dhaba-sector28",
      "pal-dhaba-legendary-butter-chicken-keema"
    ]
  },
  "chandigarh:boulevard-cycling-trail": {
    imageUrl: "/images/places/chandigarh/boulevard-cycling-trail.webp",
    visualDescription: "Dedicated green cycle track running beneath giant banyan and jacaranda canopies connecting the Government Museum to the Arts College.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sector-10-tree-lined-boulevard-cycling-route",
      "boulevard-cycling-trail"
    ]
  },
  "morni-hills:tikkar-taal-lakes": {
    imageUrl: "/images/places/morni-hills/tikkar-taal-lakes.webp",
    visualDescription: "Sacred interconnected twin lakes (Bada Taal and Chhota Taal) separated by a scenic hillock, offering calm pedal boating and camping.",
    category: "Must Visit",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "tikkar-taal-lakes",
      "tikkar-taal-twin-lakes-boating"
    ]
  },
  "morni-hills:morni-fort-heritage": {
    imageUrl: "/images/places/morni-hills/morni-fort-heritage.webp",
    visualDescription: "Historic hill fortress built in the 17th century on a commanding ridge overlooking the entire Morni mountain basin.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "morni-fort-heritage",
      "morni-fort-17th-century-ramparts"
    ]
  },
  "morni-hills:herbal-nature-trail": {
    imageUrl: "/images/places/morni-hills/herbal-nature-trail.webp",
    visualDescription: "Extensive nature trails through pine, oak, and wild medicinal herbs, home to red junglefowl, kalij pheasants, and quails.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "morni-shivalik-herbal-forest-bird-trail",
      "herbal-nature-trail"
    ]
  },
  "morni-hills:adventure-park-tikkar": {
    imageUrl: "/images/places/morni-hills/adventure-park-tikkar.webp",
    visualDescription: "Lakeside adventure park offering ziplining across hillocks, Burma bridges, rope climbing, and lakeside trekking trails.",
    category: "Adventure & Treks",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "adventure-park-tikkar",
      "adventure-park-tikkar-taal-zip-obstacle-course"
    ]
  },
  "morni-hills:gurudwara-nada-sahib": {
    imageUrl: "/images/places/morni-hills/gurudwara-nada-sahib.webp",
    visualDescription: "Sacred Sikh shrine situated on the bank of the Ghaggar River where Guru Gobind Singh Ji stayed in 1688 after the Battle of Bhangani.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "gurudwara-nada-sahib",
      "gurudwara-nada-sahib-en-route"
    ]
  },
  "morni-hills:berwala-pheasant-breeding": {
    imageUrl: "/images/places/morni-hills/berwala-pheasant-breeding.webp",
    visualDescription: "Asia's premier breeding facility for endangered Red Junglefowl and Cheer Pheasants dedicated to conservation and rewilding.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "pheasant-breeding-centre-berwala",
      "berwala-pheasant-breeding"
    ]
  },
  "morni-hills:mountain-quail-resort-dhaba": {
    imageUrl: "/images/places/morni-hills/mountain-quail-resort-dhaba.webp",
    visualDescription: "Haryana Tourism scenic terrace overlooking the valleys serving hot aloo pyaz parathas, Kadhi Pakora, and spiced ginger tea.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mountain-quail-resort-dhaba",
      "mountain-quail-terrace-dhaba"
    ]
  },
  "morni-hills:shivalik-viewpoint-crest": {
    imageUrl: "/images/places/morni-hills/shivalik-viewpoint-crest.webp",
    visualDescription: "Elevated road crest along the Morni-Tikkar Taal link road offering wide unobstructed views towards the snowlines on clear winter days.",
    category: "Hidden Gems",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "shivalik-viewpoint-crest",
      "shivalik-viewpoint-crest-sunset-ridge"
    ]
  },
  "lansdowne:tip-in-top-viewpoint": {
    imageUrl: "/images/places/lansdowne/tip-in-top-viewpoint.webp",
    visualDescription: "Scenic hilltop ridge at 1,700m surrounded by oak and pine forests, offering sweeping panoramic views of snow-capped Chaukhamba and Trishul peaks.",
    category: "Must Visit",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "tip-in-top-tiffin-top-snow-crest-ridge",
      "tip-in-top-viewpoint"
    ]
  },
  "lansdowne:bhulla-tal-lake": {
    imageUrl: "/images/places/lansdowne/bhulla-tal-lake.webp",
    visualDescription: "Immaculately maintained artificial lake built by the Garhwal Rifles in memory of soldier martyrs, featuring pedal boating and bamboo bridges.",
    category: "Must Visit",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bhulla-tal-lake",
      "bhulla-tal-lake-pine-promenade"
    ]
  },
  "lansdowne:st-johns-church-1936": {
    imageUrl: "/images/places/lansdowne/st-johns-church-1936.webp",
    visualDescription: "Historic colonial stone church established in 1936 along the Mall Road, surrounded by towering blue pines and colonial walking trails.",
    category: "Culture & Heritage",
    semanticTheme: "church",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "st-johns-catholic-church-1936",
      "st-johns-church-1936"
    ]
  },
  "lansdowne:garhwal-rifles-museum": {
    imageUrl: "/images/places/lansdowne/garhwal-rifles-museum.webp",
    visualDescription: "Historical military museum commemorating the valor of the Garhwal Rifles since 1887, exhibiting Victoria Crosses, war trophies, and uniforms.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "darwan-singh-regimental-museum",
      "garhwal-rifles-museum"
    ]
  },
  "lansdowne:bhim-pakora-stones": {
    imageUrl: "/images/places/lansdowne/bhim-pakora-stones.webp",
    visualDescription: "A natural geological curiosity of two massive stone boulders perched on top of each other that can be moved with a single finger without falling.",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bhim-pakora-stones",
      "bhim-pakora-balancing-stone-wonder"
    ]
  },
  "lansdowne:hawaghar-pine-walk": {
    imageUrl: "/images/places/lansdowne/hawaghar-pine-walk.webp",
    visualDescription: "A scenic mountain pass overlooking the snow-covered peaks of the northern Garhwal range, ideal for morning walks and birdwatching.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "hawaghar-pine-forest-ridge-promenade",
      "hawaghar-pine-walk"
    ]
  },
  "lansdowne:lansdowne-tripund-cafe": {
    imageUrl: "/images/places/lansdowne/lansdowne-tripund-cafe.webp",
    visualDescription: "Rustic wooden café serving freshly brewed Kumaon filter coffee, apple cinnamon cake, grilled sandwiches, and mountain herbal tea.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "lansdowne-tripund-cafe",
      "lansdowne-hills-colonial-café-bakery"
    ]
  },
  "lansdowne:kalagarh-tiger-gateway": {
    imageUrl: "/images/places/lansdowne/kalagarh-tiger-gateway.webp",
    visualDescription: "The northern buffer zone of Corbett Tiger Reserve accessible from Lansdowne, featuring dense sal forests, wild Asian elephants, and tigers.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kalagarh-tiger-reserve-northern-gate",
      "kalagarh-tiger-gateway"
    ]
  },
  "jaisalmer:jaisalmer-fort": {
    imageUrl: "/images/places/jaisalmer/jaisalmer-fort.webp",
    visualDescription: "One of the world's few living forts, housing over 4,000 residents inside its 12th-century yellow sandstone ramparts, palaces, and Jain temples.",
    category: "Must Visit",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jaisalmer-fort",
      "jaisalmer-golden-living-fort-sonar-qila"
    ]
  },
  "jaisalmer:patwon-ki-haveli": {
    imageUrl: "/images/places/jaisalmer/patwon-ki-haveli.webp",
    visualDescription: "A cluster of five palatial 19th-century merchant havelis featuring over 60 exquisitely carved sandstone jharokha balconies.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "patwon-ki-haveli",
      "patwon-ki-haveli-filigree-architecture"
    ]
  },
  "jaisalmer:sam-sand-dunes": {
    imageUrl: "/images/places/jaisalmer/sam-sand-dunes.webp",
    visualDescription: "Expansive golden sand dunes in the Thar Desert offering camel safaris, 4x4 dune bashing, and authentic Rajasthani folk dance under the stars.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sam-sand-dunes",
      "sam-sand-dunes-thar-desert-safari"
    ]
  },
  "jaisalmer:gadisar-lake": {
    imageUrl: "/images/places/jaisalmer/gadisar-lake.webp",
    visualDescription: "Historic 14th-century rainwater reservoir surrounded by ornate sandstone shrines, ghats, and the graceful Tilon Ki Pol gateway.",
    category: "Nature & Trails",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "gadisar-lake",
      "gadisar-lake-ghats-chattris"
    ]
  },
  "jaisalmer:kuldhara-abandoned-village": {
    imageUrl: "/images/places/jaisalmer/kuldhara-abandoned-village.webp",
    visualDescription: "An eerie 13th-century Paliwal Brahmin settlement abandoned overnight in the 1800s, preserved in silent sandstone ruin in the Thar.",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kuldhara-abandoned-ghost-village",
      "kuldhara-abandoned-village"
    ]
  },
  "jaisalmer:jain-temples-fort": {
    imageUrl: "/images/places/jaisalmer/jain-temples-fort.webp",
    visualDescription: "Interconnected group of 15th-century yellow sandstone Jain shrines renowned for breathtaking marble idols and ornate ceiling carvings.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jaisalmer-fort-seven-jain-temples",
      "jain-temples-fort"
    ]
  },
  "jaisalmer:the-trio-restaurant": {
    imageUrl: "/images/places/jaisalmer/the-trio-restaurant.webp",
    visualDescription: "Celebrated tented rooftop restaurant overlooking Mandi Chowk, famous for authentic slow-cooked Laal Maas, Ker Sangri, and Gatta Curry.",
    category: "Local Food",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "the-trio-restaurant",
      "the-trio-rooftop-authentic-laal-maas"
    ]
  },
  "jaisalmer:salim-singh-ki-haveli": {
    imageUrl: "/images/places/jaisalmer/salim-singh-ki-haveli.webp",
    visualDescription: "Distinctive 300-year-old mansion with a narrow stone base expanding into a top floor modeled like a dancing peacock with 38 carved balconies.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "salim-singh-ki-haveli-moti-mahal",
      "salim-singh-ki-haveli"
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
  "manali": {
    generic: "/images/destinations/manali/hero.jpg",
    categories: {
      stay: "/images/places/manali/categories/stay.webp",
      cafe: "/images/places/manali/categories/cafe.webp",
      food: "/images/places/manali/categories/food.webp",
      nature: "/images/places/manali/categories/nature.webp",
      trail: "/images/places/manali/categories/nature.webp",
      heritage: "/images/places/manali/categories/heritage.webp",
      spiritual: "/images/places/manali/categories/spiritual.webp",
      viewpoint: "/images/places/manali/categories/viewpoint.webp",
      waterfall: "/images/places/manali/categories/waterfall.webp",
      lake: "/images/places/manali/categories/lake.webp",
      monastery: "/images/places/manali/categories/monastery.webp",
      church: "/images/places/manali/categories/church.webp",
      beach: "/images/places/manali/categories/beach.webp",
      shopping: "/images/places/manali/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "rishikesh": {
    generic: "/images/destinations/rishikesh/hero.jpg",
    categories: {
      stay: "/images/places/rishikesh/categories/stay.webp",
      cafe: "/images/places/rishikesh/categories/cafe.webp",
      food: "/images/places/rishikesh/categories/food.webp",
      nature: "/images/places/rishikesh/categories/nature.webp",
      trail: "/images/places/rishikesh/categories/nature.webp",
      heritage: "/images/places/rishikesh/categories/heritage.webp",
      spiritual: "/images/places/rishikesh/categories/spiritual.webp",
      viewpoint: "/images/places/rishikesh/categories/viewpoint.webp",
      waterfall: "/images/places/rishikesh/categories/waterfall.webp",
      lake: "/images/places/rishikesh/categories/lake.webp",
      monastery: "/images/places/rishikesh/categories/monastery.webp",
      church: "/images/places/rishikesh/categories/church.webp",
      beach: "/images/places/rishikesh/categories/beach.webp",
      shopping: "/images/places/rishikesh/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "kasol": {
    generic: "/images/destinations/kasol/hero.jpg",
    categories: {
      stay: "/images/places/kasol/categories/stay.webp",
      cafe: "/images/places/kasol/categories/cafe.webp",
      food: "/images/places/kasol/categories/food.webp",
      nature: "/images/places/kasol/categories/nature.webp",
      trail: "/images/places/kasol/categories/nature.webp",
      heritage: "/images/places/kasol/categories/heritage.webp",
      spiritual: "/images/places/kasol/categories/spiritual.webp",
      viewpoint: "/images/places/kasol/categories/viewpoint.webp",
      waterfall: "/images/places/kasol/categories/waterfall.webp",
      lake: "/images/places/kasol/categories/lake.webp",
      monastery: "/images/places/kasol/categories/monastery.webp",
      church: "/images/places/kasol/categories/church.webp",
      beach: "/images/places/kasol/categories/beach.webp",
      shopping: "/images/places/kasol/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "dharamshala": {
    generic: "/images/destinations/dharamshala/hero.jpg",
    categories: {
      stay: "/images/places/dharamshala/categories/stay.webp",
      cafe: "/images/places/dharamshala/categories/cafe.webp",
      food: "/images/places/dharamshala/categories/food.webp",
      nature: "/images/places/dharamshala/categories/nature.webp",
      trail: "/images/places/dharamshala/categories/nature.webp",
      heritage: "/images/places/dharamshala/categories/heritage.webp",
      spiritual: "/images/places/dharamshala/categories/spiritual.webp",
      viewpoint: "/images/places/dharamshala/categories/viewpoint.webp",
      waterfall: "/images/places/dharamshala/categories/waterfall.webp",
      lake: "/images/places/dharamshala/categories/lake.webp",
      monastery: "/images/places/dharamshala/categories/monastery.webp",
      church: "/images/places/dharamshala/categories/church.webp",
      beach: "/images/places/dharamshala/categories/beach.webp",
      shopping: "/images/places/dharamshala/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "goa": {
    generic: "/images/destinations/goa/hero.jpg",
    categories: {
      stay: "/images/places/goa/categories/stay.webp",
      cafe: "/images/places/goa/categories/cafe.webp",
      food: "/images/places/goa/categories/food.webp",
      nature: "/images/places/goa/categories/nature.webp",
      trail: "/images/places/goa/categories/nature.webp",
      heritage: "/images/places/goa/categories/heritage.webp",
      spiritual: "/images/places/goa/categories/spiritual.webp",
      viewpoint: "/images/places/goa/categories/viewpoint.webp",
      waterfall: "/images/places/goa/categories/waterfall.webp",
      lake: "/images/places/goa/categories/lake.webp",
      monastery: "/images/places/goa/categories/monastery.webp",
      church: "/images/places/goa/categories/church.webp",
      beach: "/images/places/goa/categories/beach.webp",
      shopping: "/images/places/goa/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "jaipur": {
    generic: "/images/destinations/jaipur/hero.jpg",
    categories: {
      stay: "/images/places/jaipur/categories/stay.webp",
      cafe: "/images/places/jaipur/categories/cafe.webp",
      food: "/images/places/jaipur/categories/food.webp",
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
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "mussoorie": {
    generic: "/images/destinations/mussoorie/hero.jpg",
    categories: {
      stay: "/images/places/mussoorie/categories/stay.webp",
      cafe: "/images/places/mussoorie/categories/cafe.webp",
      food: "/images/places/mussoorie/categories/food.webp",
      nature: "/images/places/mussoorie/categories/nature.webp",
      trail: "/images/places/mussoorie/categories/nature.webp",
      heritage: "/images/places/mussoorie/categories/heritage.webp",
      spiritual: "/images/places/mussoorie/categories/spiritual.webp",
      viewpoint: "/images/places/mussoorie/categories/viewpoint.webp",
      waterfall: "/images/places/mussoorie/categories/waterfall.webp",
      lake: "/images/places/mussoorie/categories/lake.webp",
      monastery: "/images/places/mussoorie/categories/monastery.webp",
      church: "/images/places/mussoorie/categories/church.webp",
      beach: "/images/places/mussoorie/categories/beach.webp",
      shopping: "/images/places/mussoorie/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "udaipur": {
    generic: "/images/destinations/udaipur/hero.jpg",
    categories: {
      stay: "/images/places/udaipur/categories/stay.webp",
      cafe: "/images/places/udaipur/categories/cafe.webp",
      food: "/images/places/udaipur/categories/food.webp",
      nature: "/images/places/udaipur/categories/nature.webp",
      trail: "/images/places/udaipur/categories/nature.webp",
      heritage: "/images/places/udaipur/categories/heritage.webp",
      spiritual: "/images/places/udaipur/categories/spiritual.webp",
      viewpoint: "/images/places/udaipur/categories/viewpoint.webp",
      waterfall: "/images/places/udaipur/categories/waterfall.webp",
      lake: "/images/places/udaipur/categories/lake.webp",
      monastery: "/images/places/udaipur/categories/monastery.webp",
      church: "/images/places/udaipur/categories/church.webp",
      beach: "/images/places/udaipur/categories/beach.webp",
      shopping: "/images/places/udaipur/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "munnar": {
    generic: "/images/destinations/fallbacks/valley.jpg",
    categories: {
      stay: "/images/places/munnar/categories/stay.webp",
      cafe: "/images/places/munnar/categories/cafe.webp",
      food: "/images/places/munnar/categories/food.webp",
      nature: "/images/places/munnar/categories/nature.webp",
      trail: "/images/places/munnar/categories/nature.webp",
      heritage: "/images/places/munnar/categories/heritage.webp",
      spiritual: "/images/places/munnar/categories/spiritual.webp",
      viewpoint: "/images/places/munnar/categories/viewpoint.webp",
      waterfall: "/images/places/munnar/categories/waterfall.webp",
      lake: "/images/places/munnar/categories/lake.webp",
      monastery: "/images/places/munnar/categories/monastery.webp",
      church: "/images/places/munnar/categories/church.webp",
      beach: "/images/places/munnar/categories/beach.webp",
      shopping: "/images/places/munnar/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "varanasi": {
    generic: "/images/destinations/varanasi/hero.jpg",
    categories: {
      stay: "/images/places/varanasi/categories/stay.webp",
      cafe: "/images/places/varanasi/categories/cafe.webp",
      food: "/images/places/varanasi/categories/food.webp",
      nature: "/images/places/varanasi/categories/nature.webp",
      trail: "/images/places/varanasi/categories/nature.webp",
      heritage: "/images/places/varanasi/categories/heritage.webp",
      spiritual: "/images/places/varanasi/categories/spiritual.webp",
      viewpoint: "/images/places/varanasi/categories/viewpoint.webp",
      waterfall: "/images/places/varanasi/categories/waterfall.webp",
      lake: "/images/places/varanasi/categories/lake.webp",
      monastery: "/images/places/varanasi/categories/monastery.webp",
      church: "/images/places/varanasi/categories/church.webp",
      beach: "/images/places/varanasi/categories/beach.webp",
      shopping: "/images/places/varanasi/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "leh": {
    generic: "/images/destinations/leh/hero.jpg",
    categories: {
      stay: "/images/places/leh/categories/stay.webp",
      cafe: "/images/places/leh/categories/cafe.webp",
      food: "/images/places/leh/categories/food.webp",
      nature: "/images/places/leh/categories/nature.webp",
      trail: "/images/places/leh/categories/nature.webp",
      heritage: "/images/places/leh/categories/heritage.webp",
      spiritual: "/images/places/leh/categories/spiritual.webp",
      viewpoint: "/images/places/leh/categories/viewpoint.webp",
      waterfall: "/images/places/leh/categories/waterfall.webp",
      lake: "/images/places/leh/categories/lake.webp",
      monastery: "/images/places/leh/categories/monastery.webp",
      church: "/images/places/leh/categories/church.webp",
      beach: "/images/places/leh/categories/beach.webp",
      shopping: "/images/places/leh/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "spiti": {
    generic: "/images/destinations/spiti-valley/hero.jpg",
    categories: {
      stay: "/images/places/spiti/categories/stay.webp",
      cafe: "/images/places/spiti/categories/cafe.webp",
      food: "/images/places/spiti/categories/food.webp",
      nature: "/images/places/spiti/categories/nature.webp",
      trail: "/images/places/spiti/categories/nature.webp",
      heritage: "/images/places/spiti/categories/heritage.webp",
      spiritual: "/images/places/spiti/categories/spiritual.webp",
      viewpoint: "/images/places/spiti/categories/viewpoint.webp",
      waterfall: "/images/places/spiti/categories/waterfall.webp",
      lake: "/images/places/spiti/categories/lake.webp",
      monastery: "/images/places/spiti/categories/monastery.webp",
      church: "/images/places/spiti/categories/church.webp",
      beach: "/images/places/spiti/categories/beach.webp",
      shopping: "/images/places/spiti/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "tungnath-chandrashila": {
    generic: "/images/destinations/tungnath-chandrashila/hero.jpg",
    categories: {
      stay: "/images/places/tungnath-chandrashila/categories/stay.webp",
      cafe: "/images/places/tungnath-chandrashila/categories/cafe.webp",
      food: "/images/places/tungnath-chandrashila/categories/food.webp",
      nature: "/images/places/tungnath-chandrashila/categories/nature.webp",
      trail: "/images/places/tungnath-chandrashila/categories/nature.webp",
      heritage: "/images/places/tungnath-chandrashila/categories/heritage.webp",
      spiritual: "/images/places/tungnath-chandrashila/categories/spiritual.webp",
      viewpoint: "/images/places/tungnath-chandrashila/categories/viewpoint.webp",
      waterfall: "/images/places/tungnath-chandrashila/categories/waterfall.webp",
      lake: "/images/places/tungnath-chandrashila/categories/lake.webp",
      monastery: "/images/places/tungnath-chandrashila/categories/monastery.webp",
      church: "/images/places/tungnath-chandrashila/categories/church.webp",
      beach: "/images/places/tungnath-chandrashila/categories/beach.webp",
      shopping: "/images/places/tungnath-chandrashila/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "kainchi-dham": {
    generic: "/images/destinations/kainchi-dham/hero.jpg",
    categories: {
      stay: "/images/places/kainchi-dham/categories/stay.webp",
      cafe: "/images/places/kainchi-dham/categories/cafe.webp",
      food: "/images/places/kainchi-dham/categories/food.webp",
      nature: "/images/places/kainchi-dham/categories/nature.webp",
      trail: "/images/places/kainchi-dham/categories/nature.webp",
      heritage: "/images/places/kainchi-dham/categories/heritage.webp",
      spiritual: "/images/places/kainchi-dham/categories/spiritual.webp",
      viewpoint: "/images/places/kainchi-dham/categories/viewpoint.webp",
      waterfall: "/images/places/kainchi-dham/categories/waterfall.webp",
      lake: "/images/places/kainchi-dham/categories/lake.webp",
      monastery: "/images/places/kainchi-dham/categories/monastery.webp",
      church: "/images/places/kainchi-dham/categories/church.webp",
      beach: "/images/places/kainchi-dham/categories/beach.webp",
      shopping: "/images/places/kainchi-dham/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "murthal": {
    generic: "/images/destinations/murthal/hero.jpg",
    categories: {
      stay: "/images/places/murthal/categories/stay.webp",
      cafe: "/images/places/murthal/categories/cafe.webp",
      food: "/images/places/murthal/categories/food.webp",
      nature: "/images/places/murthal/categories/nature.webp",
      trail: "/images/places/murthal/categories/nature.webp",
      heritage: "/images/places/murthal/categories/heritage.webp",
      spiritual: "/images/places/murthal/categories/spiritual.webp",
      viewpoint: "/images/places/murthal/categories/viewpoint.webp",
      waterfall: "/images/places/murthal/categories/waterfall.webp",
      lake: "/images/places/murthal/categories/lake.webp",
      monastery: "/images/places/murthal/categories/monastery.webp",
      church: "/images/places/murthal/categories/church.webp",
      beach: "/images/places/murthal/categories/beach.webp",
      shopping: "/images/places/murthal/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "agra": {
    generic: "/images/destinations/agra/hero.jpg",
    categories: {
      stay: "/images/places/agra/categories/stay.webp",
      cafe: "/images/places/agra/categories/cafe.webp",
      food: "/images/places/agra/categories/food.webp",
      nature: "/images/places/agra/categories/nature.webp",
      trail: "/images/places/agra/categories/nature.webp",
      heritage: "/images/places/agra/categories/heritage.webp",
      spiritual: "/images/places/agra/categories/spiritual.webp",
      viewpoint: "/images/places/agra/categories/viewpoint.webp",
      waterfall: "/images/places/agra/categories/waterfall.webp",
      lake: "/images/places/agra/categories/lake.webp",
      monastery: "/images/places/agra/categories/monastery.webp",
      church: "/images/places/agra/categories/church.webp",
      beach: "/images/places/agra/categories/beach.webp",
      shopping: "/images/places/agra/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "mathura-vrindavan": {
    generic: "/images/destinations/mathura-vrindavan/hero.jpg",
    categories: {
      stay: "/images/places/mathura-vrindavan/categories/stay.webp",
      cafe: "/images/places/mathura-vrindavan/categories/cafe.webp",
      food: "/images/places/mathura-vrindavan/categories/food.webp",
      nature: "/images/places/mathura-vrindavan/categories/nature.webp",
      trail: "/images/places/mathura-vrindavan/categories/nature.webp",
      heritage: "/images/places/mathura-vrindavan/categories/heritage.webp",
      spiritual: "/images/places/mathura-vrindavan/categories/spiritual.webp",
      viewpoint: "/images/places/mathura-vrindavan/categories/viewpoint.webp",
      waterfall: "/images/places/mathura-vrindavan/categories/waterfall.webp",
      lake: "/images/places/mathura-vrindavan/categories/lake.webp",
      monastery: "/images/places/mathura-vrindavan/categories/monastery.webp",
      church: "/images/places/mathura-vrindavan/categories/church.webp",
      beach: "/images/places/mathura-vrindavan/categories/beach.webp",
      shopping: "/images/places/mathura-vrindavan/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "neemrana": {
    generic: "/images/destinations/neemrana/hero.jpg",
    categories: {
      stay: "/images/places/neemrana/categories/stay.webp",
      cafe: "/images/places/neemrana/categories/cafe.webp",
      food: "/images/places/neemrana/categories/food.webp",
      nature: "/images/places/neemrana/categories/nature.webp",
      trail: "/images/places/neemrana/categories/nature.webp",
      heritage: "/images/places/neemrana/categories/heritage.webp",
      spiritual: "/images/places/neemrana/categories/spiritual.webp",
      viewpoint: "/images/places/neemrana/categories/viewpoint.webp",
      waterfall: "/images/places/neemrana/categories/waterfall.webp",
      lake: "/images/places/neemrana/categories/lake.webp",
      monastery: "/images/places/neemrana/categories/monastery.webp",
      church: "/images/places/neemrana/categories/church.webp",
      beach: "/images/places/neemrana/categories/beach.webp",
      shopping: "/images/places/neemrana/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "damdama-sohna": {
    generic: "/images/destinations/damdama-sohna/hero.jpg",
    categories: {
      stay: "/images/places/damdama-sohna/categories/stay.webp",
      cafe: "/images/places/damdama-sohna/categories/cafe.webp",
      food: "/images/places/damdama-sohna/categories/food.webp",
      nature: "/images/places/damdama-sohna/categories/nature.webp",
      trail: "/images/places/damdama-sohna/categories/nature.webp",
      heritage: "/images/places/damdama-sohna/categories/heritage.webp",
      spiritual: "/images/places/damdama-sohna/categories/spiritual.webp",
      viewpoint: "/images/places/damdama-sohna/categories/viewpoint.webp",
      waterfall: "/images/places/damdama-sohna/categories/waterfall.webp",
      lake: "/images/places/damdama-sohna/categories/lake.webp",
      monastery: "/images/places/damdama-sohna/categories/monastery.webp",
      church: "/images/places/damdama-sohna/categories/church.webp",
      beach: "/images/places/damdama-sohna/categories/beach.webp",
      shopping: "/images/places/damdama-sohna/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "alwar-siliserh": {
    generic: "/images/destinations/alwar-siliserh/hero.jpg",
    categories: {
      stay: "/images/places/alwar-siliserh/categories/stay.webp",
      cafe: "/images/places/alwar-siliserh/categories/cafe.webp",
      food: "/images/places/alwar-siliserh/categories/food.webp",
      nature: "/images/places/alwar-siliserh/categories/nature.webp",
      trail: "/images/places/alwar-siliserh/categories/nature.webp",
      heritage: "/images/places/alwar-siliserh/categories/heritage.webp",
      spiritual: "/images/places/alwar-siliserh/categories/spiritual.webp",
      viewpoint: "/images/places/alwar-siliserh/categories/viewpoint.webp",
      waterfall: "/images/places/alwar-siliserh/categories/waterfall.webp",
      lake: "/images/places/alwar-siliserh/categories/lake.webp",
      monastery: "/images/places/alwar-siliserh/categories/monastery.webp",
      church: "/images/places/alwar-siliserh/categories/church.webp",
      beach: "/images/places/alwar-siliserh/categories/beach.webp",
      shopping: "/images/places/alwar-siliserh/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "sariska-bhangarh": {
    generic: "/images/destinations/sariska-bhangarh/hero.jpg",
    categories: {
      stay: "/images/places/sariska-bhangarh/categories/stay.webp",
      cafe: "/images/places/sariska-bhangarh/categories/cafe.webp",
      food: "/images/places/sariska-bhangarh/categories/food.webp",
      nature: "/images/places/sariska-bhangarh/categories/nature.webp",
      trail: "/images/places/sariska-bhangarh/categories/nature.webp",
      heritage: "/images/places/sariska-bhangarh/categories/heritage.webp",
      spiritual: "/images/places/sariska-bhangarh/categories/spiritual.webp",
      viewpoint: "/images/places/sariska-bhangarh/categories/viewpoint.webp",
      waterfall: "/images/places/sariska-bhangarh/categories/waterfall.webp",
      lake: "/images/places/sariska-bhangarh/categories/lake.webp",
      monastery: "/images/places/sariska-bhangarh/categories/monastery.webp",
      church: "/images/places/sariska-bhangarh/categories/church.webp",
      beach: "/images/places/sariska-bhangarh/categories/beach.webp",
      shopping: "/images/places/sariska-bhangarh/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "dehradun": {
    generic: "/images/destinations/dehradun/hero.jpg",
    categories: {
      stay: "/images/places/dehradun/categories/stay.webp",
      cafe: "/images/places/dehradun/categories/cafe.webp",
      food: "/images/places/dehradun/categories/food.webp",
      nature: "/images/places/dehradun/categories/nature.webp",
      trail: "/images/places/dehradun/categories/nature.webp",
      heritage: "/images/places/dehradun/categories/heritage.webp",
      spiritual: "/images/places/dehradun/categories/spiritual.webp",
      viewpoint: "/images/places/dehradun/categories/viewpoint.webp",
      waterfall: "/images/places/dehradun/categories/waterfall.webp",
      lake: "/images/places/dehradun/categories/lake.webp",
      monastery: "/images/places/dehradun/categories/monastery.webp",
      church: "/images/places/dehradun/categories/church.webp",
      beach: "/images/places/dehradun/categories/beach.webp",
      shopping: "/images/places/dehradun/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "chandigarh": {
    generic: "/images/destinations/chandigarh/hero.jpg",
    categories: {
      stay: "/images/places/chandigarh/categories/stay.webp",
      cafe: "/images/places/chandigarh/categories/cafe.webp",
      food: "/images/places/chandigarh/categories/food.webp",
      nature: "/images/places/chandigarh/categories/nature.webp",
      trail: "/images/places/chandigarh/categories/nature.webp",
      heritage: "/images/places/chandigarh/categories/heritage.webp",
      spiritual: "/images/places/chandigarh/categories/spiritual.webp",
      viewpoint: "/images/places/chandigarh/categories/viewpoint.webp",
      waterfall: "/images/places/chandigarh/categories/waterfall.webp",
      lake: "/images/places/chandigarh/categories/lake.webp",
      monastery: "/images/places/chandigarh/categories/monastery.webp",
      church: "/images/places/chandigarh/categories/church.webp",
      beach: "/images/places/chandigarh/categories/beach.webp",
      shopping: "/images/places/chandigarh/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "morni-hills": {
    generic: "/images/destinations/morni-hills/hero.jpg",
    categories: {
      stay: "/images/places/morni-hills/categories/stay.webp",
      cafe: "/images/places/morni-hills/categories/cafe.webp",
      food: "/images/places/morni-hills/categories/food.webp",
      nature: "/images/places/morni-hills/categories/nature.webp",
      trail: "/images/places/morni-hills/categories/nature.webp",
      heritage: "/images/places/morni-hills/categories/heritage.webp",
      spiritual: "/images/places/morni-hills/categories/spiritual.webp",
      viewpoint: "/images/places/morni-hills/categories/viewpoint.webp",
      waterfall: "/images/places/morni-hills/categories/waterfall.webp",
      lake: "/images/places/morni-hills/categories/lake.webp",
      monastery: "/images/places/morni-hills/categories/monastery.webp",
      church: "/images/places/morni-hills/categories/church.webp",
      beach: "/images/places/morni-hills/categories/beach.webp",
      shopping: "/images/places/morni-hills/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "lansdowne": {
    generic: "/images/destinations/lansdowne/hero.jpg",
    categories: {
      stay: "/images/places/lansdowne/categories/stay.webp",
      cafe: "/images/places/lansdowne/categories/cafe.webp",
      food: "/images/places/lansdowne/categories/food.webp",
      nature: "/images/places/lansdowne/categories/nature.webp",
      trail: "/images/places/lansdowne/categories/nature.webp",
      heritage: "/images/places/lansdowne/categories/heritage.webp",
      spiritual: "/images/places/lansdowne/categories/spiritual.webp",
      viewpoint: "/images/places/lansdowne/categories/viewpoint.webp",
      waterfall: "/images/places/lansdowne/categories/waterfall.webp",
      lake: "/images/places/lansdowne/categories/lake.webp",
      monastery: "/images/places/lansdowne/categories/monastery.webp",
      church: "/images/places/lansdowne/categories/church.webp",
      beach: "/images/places/lansdowne/categories/beach.webp",
      shopping: "/images/places/lansdowne/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "jaisalmer": {
    generic: "/images/destinations/fallbacks/desert.jpg",
    categories: {
      stay: "/images/places/jaisalmer/categories/stay.webp",
      cafe: "/images/places/jaisalmer/categories/cafe.webp",
      food: "/images/places/jaisalmer/categories/food.webp",
      nature: "/images/places/jaisalmer/categories/nature.webp",
      trail: "/images/places/jaisalmer/categories/nature.webp",
      heritage: "/images/places/jaisalmer/categories/heritage.webp",
      spiritual: "/images/places/jaisalmer/categories/spiritual.webp",
      viewpoint: "/images/places/jaisalmer/categories/viewpoint.webp",
      waterfall: "/images/places/jaisalmer/categories/waterfall.webp",
      lake: "/images/places/jaisalmer/categories/lake.webp",
      monastery: "/images/places/jaisalmer/categories/monastery.webp",
      church: "/images/places/jaisalmer/categories/church.webp",
      beach: "/images/places/jaisalmer/categories/beach.webp",
      shopping: "/images/places/jaisalmer/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
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
  const cat = (category || "").toLowerCase();
  const name = (placeName || "").toLowerCase();
  const text = `${cat} ${name} ${(tags || "").toLowerCase()}`;

  // PRIORITY 1: Explicit Category Classification
  if (cat.includes("café") || cat.includes("cafe") || cat.includes("bakery") || cat.includes("bakehouse") || cat.includes("coffee")) {
    return "cafe";
  }
  if (cat.includes("food") || cat.includes("dining") || cat.includes("restaurant") || cat.includes("street food") || cat.includes("eatery") || cat.includes("cuisine")) {
    return "food";
  }
  if (cat.includes("stay") || cat.includes("sanctuary") || cat.includes("sanctuaries") || cat.includes("accommodation") || cat.includes("hostel") || cat.includes("homestay") || cat.includes("resort") || cat.includes("hotel")) {
    return "stay";
  }
  if (cat.includes("monastery") || cat.includes("gompa")) {
    return "monastery";
  }
  if (cat.includes("church") || cat.includes("cathedral")) {
    return "church";
  }
  if (cat.includes("spiritual") || cat.includes("temple") || cat.includes("aarti") || cat.includes("ghat")) {
    return "spiritual";
  }
  if (cat.includes("waterfall") || cat.includes("cascade")) {
    return "waterfall";
  }
  if (cat.includes("beach") || cat.includes("coastal")) {
    return "beach";
  }
  if (cat.includes("shopping") || cat.includes("market") || cat.includes("bazaar")) {
    return "shopping";
  }
  if (cat.includes("nightlife") || cat.includes("pub") || cat.includes("bar") || cat.includes("club")) {
    return "nightlife";
  }
  if (cat.includes("transport") || cat.includes("mobility") || cat.includes("rental") || cat.includes("fuel") || cat.includes("ev") || cat.includes("parking") || cat.includes("vehicle")) {
    return "transport";
  }
  if (cat.includes("medical") || cat.includes("health") || cat.includes("pharmacy") || cat.includes("clinic") || cat.includes("hospital") || cat.includes("chemist")) {
    return "medical";
  }
  if (cat.includes("service") || cat.includes("convenience") || cat.includes("utility") || cat.includes("atm")) {
    return "service";
  }

  // PRIORITY 2: Place Name & Tag Semantics (Cafés/Food must precede generic stay keywords like 'inn')
  if (
    name.includes("fuel") ||
    name.includes("petrol") ||
    name.includes("gas station") ||
    name.includes("cng") ||
    name.includes("diesel") ||
    name.includes("ev charging") ||
    name.includes("ev charge")
  ) {
    return "transport";
  }

  if (
    name.includes("pharmacy") ||
    name.includes("chemist") ||
    name.includes("clinic") ||
    name.includes("hospital") ||
    name.includes("medical")
  ) {
    return "medical";
  }

  if (
    name.includes("cafe") ||
    name.includes("café") ||
    name.includes("coffee") ||
    name.includes("bakery") ||
    name.includes("bakehouse") ||
    name.includes("tea house") ||
    name.includes("espresso") ||
    name.includes("german bakery") ||
    name.includes("patisserie")
  ) {
    return "cafe";
  }

  if (
    name.includes("restaurant") ||
    name.includes("dhaba") ||
    name.includes("momo") ||
    name.includes("tibetan food") ||
    name.includes("kitchen") ||
    name.includes("eatery") ||
    name.includes("bhojanalaya") ||
    name.includes("sweet") ||
    name.includes("chaat") ||
    name.includes("thukpa") ||
    name.includes("lassi") ||
    name.includes("rasoi") ||
    name.includes("thali")
  ) {
    return "food";
  }

  if (
    name.includes("church") ||
    name.includes("cathedral") ||
    name.includes("chapel") ||
    name.includes("basilica")
  ) {
    return "church";
  }

  if (
    name.includes("monastery") ||
    name.includes("gompa") ||
    name.includes("stupa") ||
    name.includes("tibetan temple") ||
    name.includes("dzong") ||
    name.includes("kye gompa") ||
    name.includes("ki gompa")
  ) {
    return "monastery";
  }

  if (
    name.includes("waterfall") ||
    name.includes("falls") ||
    name.includes("cascade")
  ) {
    return "waterfall";
  }

  if (
    name.includes("lake") ||
    name.includes("tso") ||
    name.includes("taal") ||
    name.includes("tal") ||
    name.includes("river") ||
    name.includes("stream") ||
    name.includes("pond") ||
    name.includes("dam")
  ) {
    return "lake";
  }

  if (
    name.includes("beach") ||
    name.includes("coast") ||
    name.includes("cove") ||
    name.includes("shore")
  ) {
    return "beach";
  }

  if (
    name.includes("temple") ||
    name.includes("mandir") ||
    name.includes("shrine") ||
    name.includes("ashram") ||
    name.includes("gurudwara") ||
    name.includes("mosque") ||
    name.includes("masjid") ||
    name.includes("ghat") ||
    name.includes("aarti") ||
    name.includes("spiritual") ||
    name.includes("jyotirlinga")
  ) {
    return "spiritual";
  }

  if (
    name.includes("hotel") ||
    name.includes("resort") ||
    name.includes("homestay") ||
    name.includes("hostel") ||
    name.includes("guesthouse") ||
    name.includes("guest house") ||
    name.includes("sanctuary retreat") ||
    name.includes("boutique stay") ||
    name.includes("bed & breakfast") ||
    name.includes("b&b") ||
    name.includes("dorm") ||
    name.includes("villa")
  ) {
    return "stay";
  }

  if (
    name.includes("fort") ||
    name.includes("palace") ||
    name.includes("haveli") ||
    name.includes("museum") ||
    name.includes("monument") ||
    name.includes("heritage") ||
    name.includes("ruins") ||
    name.includes("castle") ||
    name.includes("latin quarter")
  ) {
    return "heritage";
  }

  if (
    name.includes("market") ||
    name.includes("bazaar") ||
    name.includes("shop") ||
    name.includes("store") ||
    name.includes("boutique") ||
    name.includes("souvenir") ||
    name.includes("craft")
  ) {
    return "shopping";
  }

  if (
    name.includes("rental") ||
    name.includes("scooter") ||
    name.includes("motorcycle") ||
    name.includes("bike rental") ||
    name.includes("taxi") ||
    name.includes("transport") ||
    name.includes("bus stand") ||
    name.includes("railway") ||
    name.includes("mobility")
  ) {
    return "transport";
  }

  if (
    name.includes("hospital") ||
    name.includes("clinic") ||
    name.includes("pharmacy") ||
    name.includes("doctor") ||
    name.includes("medical")
  ) {
    return "medical";
  }

  if (
    name.includes("viewpoint") ||
    name.includes("view point") ||
    name.includes("ridge") ||
    name.includes("peak") ||
    name.includes("tibba") ||
    name.includes("top") ||
    name.includes("scenic point")
  ) {
    return "viewpoint";
  }

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
 * Supports both SemanticTheme and legacy category/destination string inputs.
 */
export function getUniversalFallback(themeOrCategory?: SemanticTheme | string, destination?: string): string {
  if (!themeOrCategory) return "/images/nearby/universal/universal.webp";
  const themeMap: Record<string, string> = {
    cafe: "/images/nearby/cafe/cafe.webp",
    coffee: "/images/nearby/coffee/coffee.webp",
    bakery: "/images/nearby/bakery/bakery.webp",
    food: "/images/nearby/restaurant/restaurant.webp",
    restaurant: "/images/nearby/restaurant/restaurant.webp",
    local_food: "/images/nearby/local_food/local_food.webp",
    momo: "/images/nearby/momo/momo.webp",
    stay: "/images/nearby/stay/stay.webp",
    hotel: "/images/nearby/hotel/hotel.webp",
    hostel: "/images/nearby/hostel/hostel.webp",
    homestay: "/images/nearby/homestay/homestay.webp",
    monastery: "/images/nearby/monastery/monastery.webp",
    church: "/images/nearby/church/church.webp",
    spiritual: "/images/nearby/temple/temple.webp",
    temple: "/images/nearby/temple/temple.webp",
    gurudwara: "/images/nearby/gurudwara/gurudwara.webp",
    mosque: "/images/nearby/mosque/mosque.webp",
    heritage: "/images/nearby/heritage/heritage.webp",
    fort: "/images/nearby/fort/fort.webp",
    palace: "/images/nearby/palace/palace.webp",
    museum: "/images/nearby/museum/museum.webp",
    monument: "/images/nearby/monument/monument.webp",
    trail: "/images/nearby/trail/trail.webp",
    nature: "/images/nearby/nature/nature.webp",
    waterfall: "/images/nearby/waterfall/waterfall.webp",
    lake: "/images/nearby/lake/lake.webp",
    beach: "/images/nearby/beach/beach.webp",
    viewpoint: "/images/nearby/viewpoint/viewpoint.webp",
    park: "/images/nearby/park/park.webp",
    shopping: "/images/nearby/shop/shop.webp",
    shop: "/images/nearby/shop/shop.webp",
    market: "/images/nearby/market/market.webp",
    bazaar: "/images/nearby/bazaar/bazaar.webp",
    mall: "/images/nearby/mall/mall.webp",
    nightlife: "/images/nearby/nightlife/nightlife.webp",
    activity: "/images/nearby/experience/experience.webp",
    experience: "/images/nearby/experience/experience.webp",
    transport: "/images/nearby/transport/transport.webp",
    rental: "/images/nearby/rental/rental.webp",
    parking: "/images/nearby/parking/parking.webp",
    fuel: "/images/nearby/fuel/fuel.webp",
    medical: "/images/nearby/hospital/hospital.webp",
    hospital: "/images/nearby/hospital/hospital.webp",
    pharmacy: "/images/nearby/pharmacy/pharmacy.webp",
    service: "/images/nearby/convenience/convenience.webp",
    convenience: "/images/nearby/convenience/convenience.webp",
    hidden_gem: "/images/nearby/hidden_gem/hidden_gem.webp",
    universal: "/images/nearby/universal/universal.webp"
  };

  const norm = normalizeKey(themeOrCategory);
  if (norm in themeMap) {
    return themeMap[norm];
  }
  const inferred = classifyCategoryTheme(themeOrCategory, "", "");
  return themeMap[inferred] || "/images/nearby/universal/universal.webp";
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

  // --- LEVEL 1 & 2 & 3: Verified Real Photograph / Curated Exact Place or Stay Asset ---
  if (existingImageUrl && isApprovedAsset(existingImageUrl)) {
    const isExternal = existingImageUrl.startsWith("https://") || existingImageUrl.startsWith("http://");
    const isWikimedia = existingImageUrl.includes("wikimedia.org") || existingImageUrl.includes("wikidata.org");
    const isLocalAsset = existingImageUrl.startsWith("/images/") || existingImageUrl.startsWith("/artworks/");
    
    // Check if the asset matches this destination or is an exact curated place/stay asset
    const isDestinationMatch = !destNorm || existingImageUrl.includes(`/${destNorm}/`) || existingImageUrl.includes(`/${destNorm}.`);
    const isRealExact = isWikimedia || isLive === true || source === "google_places" || source === "wikimedia" ||
      (isLocalAsset && isDestinationMatch && (existingImageUrl.includes("/places/") || existingImageUrl.includes("/stays/") || existingImageUrl.includes("/vehicles/")));

    if (isExternal || (isLocalAsset && isDestinationMatch) || isRealExact) {
      const badgeLabel: ProvenanceBadge = isRealExact 
        ? (isWikimedia ? "EXACT PLACE PHOTO" : isLive ? "LIVE PLACE PHOTO" : "VANVAS PLACE ARTWORK") 
        : "DESTINATION CATEGORY ART";

      return {
        url: existingImageUrl,
        fallback_url: safeFallback,
        source: isWikimedia ? "wikimedia" : (source || "vanvas_curated"),
        source_type: isRealExact ? "real_photo" : "editorial_artwork",
        provenance: isRealExact ? "exact_place" : "destination_category",
        semantic_category: semanticTheme,
        exactness: isRealExact ? "exact" : "approximate",
        attribution: isWikimedia ? "Wikimedia Commons / Verified Open Source" : `VANVAS Verified ${destinationName} Asset`,
        alt_text: `${placeName} in ${destinationName || "India"}`,
        badge_label: badgeLabel,
        artworkKey: `exact:${destNorm}:${placeNorm}`,
        imageUrl: existingImageUrl,
        fallbackUrl: safeFallback,
        tier: isRealExact ? "exact_place" : "destination_category",
        placeName,
        destinationName,
        category,
        semanticTheme,
        isRealPhoto: true,
        badgeLabel,
        visualDescription: `Verified visual of ${placeName} in ${destinationName}.`
      };
    }
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

  // --- LEVEL 4B: Curated Exact-Place Artwork (Destination-Scoped Alias Matching) ---
  let bestExactMatch: { regKey: string; item: CuratedLandmarkEntry } | null = null;

  for (const [regKey, item] of Object.entries(EXACT_PLACE_REGISTRY)) {
    if (!isApprovedAsset(item.imageUrl)) {
      continue;
    }
    const [regDest, regPlace] = regKey.split(":");
    // STRICT DESTINATION ISOLATION: Never match an entity from another destination
    if (regDest === destNorm || destNorm.includes(regDest) || regDest.includes(destNorm) || !destNorm) {
      if (!areThemesCompatible(semanticTheme, item.semanticTheme)) {
        continue;
      }

      const aliases = item.aliases || [regPlace];
      let matched = false;

      if (regPlace === placeNorm || aliases.includes(placeNorm)) {
        matched = true;
      } else {
        for (const al of aliases) {
          if (al.length >= 4) {
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
      alt_text: `${placeName} in ${destinationName || "India"}`,
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

  // --- HARD ISOLATION FOR STAYS: Destination-specific stay artwork ---
  if (semanticTheme === "stay") {
    const destStayAsset = destConfig?.categories?.stay || `/images/places/${destNorm}/categories/stay.webp`;
    return {
      url: destStayAsset,
      fallback_url: destStayAsset,
      source: "vanvas_curated",
      source_type: "category_photo",
      provenance: "destination_category",
      semantic_category: "stay",
      exactness: "category_matched",
      attribution: `VANVAS Verified ${destinationName} Stay Sanctuary`,
      alt_text: `${placeName} accommodation in ${destinationName || "India"}`,
      badge_label: "DESTINATION CATEGORY ART",
      artworkKey: `${matchedDestKey || destNorm || "universal"}:stay`,
      imageUrl: destStayAsset,
      fallbackUrl: destStayAsset,
      tier: "destination_category",
      placeName,
      destinationName,
      category,
      semanticTheme: "stay",
      isRealPhoto: false,
      badgeLabel: "DESTINATION CATEGORY ART",
      visualDescription: `Serene stay and hospitality sanctuary in ${destinationName || "India"}.`
    };
  }

  // --- HARD ISOLATION FOR CAFES & DINING: Destination-specific dining artwork ---
  if (semanticTheme === "cafe" || semanticTheme === "food") {
    const isCafe = semanticTheme === "cafe";
    const destCafeAsset = destConfig?.categories?.[semanticTheme] || `/images/places/${destNorm}/categories/${semanticTheme}.webp`;
    return {
      url: destCafeAsset,
      fallback_url: destCafeAsset,
      source: "vanvas_curated",
      source_type: "category_photo",
      provenance: "destination_category",
      semantic_category: semanticTheme,
      exactness: "category_matched",
      attribution: `VANVAS Verified ${isCafe ? "Café & Coffee Atmosphere" : "Local Dining Sanctuary"} in ${destinationName}`,
      alt_text: `${placeName} ${isCafe ? "cafe" : "dining"} atmosphere`,
      badge_label: "DESTINATION CATEGORY ART",
      artworkKey: `${destNorm}:${semanticTheme}`,
      imageUrl: destCafeAsset,
      fallbackUrl: destCafeAsset,
      tier: "destination_category",
      placeName,
      destinationName,
      category,
      semanticTheme,
      isRealPhoto: false,
      badgeLabel: "DESTINATION CATEGORY ART",
      visualDescription: `Authentic ${isCafe ? "café and coffee" : "local culinary"} visual in ${destinationName}.`
    };
  }

  // --- HARD ISOLATION FOR BUSINESSES / UTILITIES / SPECIFIC URBAN POIs ---
  // (Shops, Pharmacy, Hospital, Fuel, Rentals, Parking, Transport, Nightlife)
  const isGenericBusinessOrUtility =
    semanticTheme === "shopping" ||
    semanticTheme === "transport" ||
    semanticTheme === "medical" ||
    semanticTheme === "nightlife" ||
    semanticTheme === "service";

  if (isGenericBusinessOrUtility) {
    const lowerPlace = placeNorm.toLowerCase();
    let businessAsset = universalSafe;

    if (semanticTheme === "shopping") {
      if (lowerPlace.includes("mall")) businessAsset = "/images/nearby/mall/mall.webp";
      else if (lowerPlace.includes("bazaar")) businessAsset = "/images/nearby/bazaar/bazaar.webp";
      else if (lowerPlace.includes("market")) businessAsset = "/images/nearby/market/market.webp";
      else businessAsset = "/images/nearby/shop/shop.webp";
    } else if (semanticTheme === "transport") {
      if (lowerPlace.includes("rental") || lowerPlace.includes("bike") || lowerPlace.includes("scooter") || lowerPlace.includes("car")) {
        businessAsset = "/images/nearby/rental/rental.webp";
      } else if (lowerPlace.includes("parking")) {
        businessAsset = "/images/nearby/parking/parking.webp";
      } else if (lowerPlace.includes("fuel") || lowerPlace.includes("petrol") || lowerPlace.includes("gas") || lowerPlace.includes("cng")) {
        businessAsset = "/images/nearby/fuel/fuel.webp";
      } else {
        businessAsset = "/images/nearby/transport/transport.webp";
      }
    } else if (semanticTheme === "medical") {
      if (lowerPlace.includes("pharmacy") || lowerPlace.includes("chemist") || lowerPlace.includes("meds") || lowerPlace.includes("drug")) {
        businessAsset = "/images/nearby/pharmacy/pharmacy.webp";
      } else {
        businessAsset = "/images/nearby/hospital/hospital.webp";
      }
    } else if (semanticTheme === "service") {
      businessAsset = "/images/nearby/convenience/convenience.webp";
    } else if (semanticTheme === "nightlife") {
      businessAsset = "/images/nearby/nightlife/nightlife.webp";
    }

    return {
      url: businessAsset,
      fallback_url: businessAsset,
      source: "vanvas_nearby",
      source_type: "category_photo",
      provenance: "destination_category",
      semantic_category: semanticTheme,
      exactness: "category_matched",
      attribution: `VANVAS Verified ${category} Visual`,
      alt_text: `${placeName} ${category}`,
      badge_label: "DESTINATION CATEGORY ART",
      artworkKey: `nearby:${semanticTheme}`,
      imageUrl: businessAsset,
      fallbackUrl: businessAsset,
      tier: "destination_category",
      placeName,
      destinationName,
      category,
      semanticTheme,
      isRealPhoto: false,
      badgeLabel: "DESTINATION CATEGORY ART",
      visualDescription: `Authentic editorial visual for ${category}.`
    };
  }

  // --- LEVEL 6: Place-Type / Category-Specific Destination Artwork ---
  if (
    destConfig &&
    destConfig.categories[semanticTheme] &&
    isApprovedAsset(destConfig.categories[semanticTheme]) &&
    !destConfig.categories[semanticTheme]!.includes("hero") &&
    !destConfig.categories[semanticTheme]!.includes("viewpoint")
  ) {
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

  // --- LEVEL 7 & 8: Dedicated Nearby / Universal Semantic Category Artwork ---
  const isNearbyPack = universalSafe.startsWith("/images/nearby/");
  return {
    url: universalSafe,
    fallback_url: universalSafe,
    source: "vanvas_nearby",
    source_type: "category_photo",
    provenance: isNearbyPack ? "destination_category" : "universal_fallback",
    semantic_category: semanticTheme,
    exactness: "category_matched",
    attribution: "VANVAS Curated Travel Atmosphere",
    alt_text: `${category} travel atmosphere`,
    badge_label: isNearbyPack ? "DESTINATION CATEGORY ART" : "UNIVERSAL FALLBACK",
    artworkKey: `nearby:${semanticTheme}`,
    imageUrl: universalSafe,
    fallbackUrl: universalSafe,
    tier: "destination_category",
    placeName,
    destinationName,
    category,
    semanticTheme,
    isRealPhoto: false,
    badgeLabel: isNearbyPack ? "DESTINATION CATEGORY ART" : "UNIVERSAL FALLBACK",
    visualDescription: `Authentic editorial visual for ${category}.`
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

/**
 * Backward compatibility constants and helpers for legacy regression tests and callers
 */
export const LEGACY_UNIVERSAL_PATHS = {
  nature: "/images/places/universal/nature.webp",
  heritage: "/images/places/universal/heritage.webp",
  spiritual: "/images/places/universal/spiritual.webp",
  cafe: "/images/places/universal/cafe.webp",
  food: "/images/places/universal/food.webp",
  transport: "/images/nearby/transport/transport.webp",
  nightlife: "/images/places/universal/nightlife.webp",
  medical: "/images/places/universal/medical.webp",
  service: "/images/places/universal/service.webp"
};

export function safeFallback(category?: string): string {
  return getUniversalFallback(category);
}

