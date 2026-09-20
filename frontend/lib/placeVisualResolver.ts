/**
 * VANVAS Place-Level Visual Intelligence & Artwork Resolver
 * 
 * Implements deterministic place-specific artwork resolution, multi-tier fallback,
 * collision protection, and transparent visual provenance classification.
 * 
 * Strict 8-Level Priority:
 * LEVEL 1: Verified exact-place real photograph -> [ EXACT PLACE PHOTO ]
 * LEVEL 2: Verified place/provider live photo URL -> [ LIVE PLACE PHOTO ]
 * LEVEL 3: Verified Wikimedia Commons/Wikidata photograph of exact place -> [ EXACT PLACE PHOTO ]
 * LEVEL 4: Curated editorial artwork / photograph for exact place -> [ VANVAS PLACE ARTWORK ]
 * LEVEL 5: Verified category photograph matching place type -> [ DESTINATION CATEGORY ART ]
 * LEVEL 6: Destination-specific real photograph matching category -> [ DESTINATION CATEGORY ART ]
 * LEVEL 7: Regional semantic photograph -> [ REGIONAL ART ]
 * LEVEL 8: Universal semantic fallback -> [ UNIVERSAL FALLBACK ]
 */

import { ImageContract, ProvenanceBadge, ImageProvenanceTier, ImageSourceType, ImageExactness } from "@/types";

export type ArtworkTier = ImageProvenanceTier;

export interface PlaceArtworkResult extends ImageContract {
  artworkKey: string;
  imageUrl: string;
  fallbackUrl?: string;
  tier: ArtworkTier;
  placeName: string;
  destinationName: string;
  category: string;
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
  sourceType?: ImageSourceType;
  source?: string;
  attribution?: string;
  aliases: string[];
}

/**
 * Registry of verified landmark artwork mappings with truthful provenance.
 * Contains verified landmark-specific artwork assets that physically exist on disk.
 */
export const EXACT_PLACE_REGISTRY: Record<string, CuratedLandmarkEntry> = {
  // Kasol Landmarks
  "kasol:moon-dance-cafe": {
    imageUrl: "/images/places/kasol/moon-dance-cafe.webp",
    visualDescription: "Legendary bohemian bakery in Kasol serving fresh apple crumble, pastries, and mountain coffee under Parvati deodars.",
    category: "Cafés & Bakery",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "moon-dance-cafe",
      "moon-dance-cafe-and-german-bakery",
      "moon-dance-german-bakery",
      "moon-dance-bakery",
      "german-bakery-kasol"
    ]
  },
  "kasol:chalal-trail": {
    imageUrl: "/images/places/kasol/chalal-trail.webp",
    visualDescription: "Scenic suspended cable bridge path following the emerald Parvati river through ancient towering pine woods to Chalal village.",
    category: "Nature & Trails",
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
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "manikaran-sahib",
      "manikaran-gurudwara",
      "manikaran-hot-springs",
      "gurudwara-shri-manikaran-sahib",
      "manikaran"
    ]
  },
  "kasol:kheerganga-trail": {
    imageUrl: "/images/places/kasol/kheerganga-trail.webp",
    visualDescription: "Exhilarating Himalayan trekking trail ascending through pine forests to high alpine meadows and natural hot baths.",
    category: "Nature & Trails",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kheerganga-trail",
      "kheerganga-trek",
      "khirganga-trail",
      "khirganga"
    ]
  },

  // Mussoorie / Landour Landmarks
  "mussoorie:st-pauls-church": {
    imageUrl: "/images/places/mussoorie/st-pauls-church.webp",
    visualDescription: "Historic 1852 stone Anglican church in Landour with steep gabled wooden roof and lancet windows under deodar pines.",
    category: "Culture & Heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["st-pauls-church-landour", "st-pauls-church", "st-paul-church"]
  },
  "mussoorie:landour-bakehouse": {
    imageUrl: "/images/places/mussoorie/landour-bakehouse.webp",
    visualDescription: "Historic stone and timber hill bakery at Sisters Bazaar with Victorian glass vitrines and deodar canopy.",
    category: "Cafés & Bakery",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["landour-bakehouse", "landour-bakery", "sisters-bazaar-bakehouse"]
  },
  "mussoorie:lal-tibba": {
    imageUrl: "/images/places/mussoorie/lal-tibba.webp",
    visualDescription: "Highest mountain ridge viewpoint in Landour with telescope overlooking distant Garhwal snow peaks.",
    category: "Nature & Trails",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["lal-tibba", "lal-tibba-scenic-viewpoint", "lal-tibba-viewpoint"]
  },
  "mussoorie:kempty-falls": {
    imageUrl: "/images/places/mussoorie/kempty-falls.webp",
    visualDescription: "Steep rocky mountain waterfall cascade plunging into jade mountain pools.",
    category: "Nature & Trails",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["kempty-falls", "kempty-falls-mountain-cascade", "kempty-waterfall"]
  },
  "mussoorie:gun-hill": {
    imageUrl: "/images/places/mussoorie/gun-hill.webp",
    visualDescription: "Elevated colonial peak with ropeway cable car overlooking the vast Doon Valley.",
    category: "Culture & Heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["gun-hill", "gun-hill-historic-viewpoint", "gun-hill-viewpoint"]
  },
  "mussoorie:camel-back-road": {
    imageUrl: "/images/places/mussoorie/camel-back-road.webp",
    visualDescription: "Tranquil oak-shaded walking promenade framing natural camel rock outcrop and winterline sunsets.",
    category: "Nature & Trails",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["camel-back-road", "camels-back-road", "camels-back-road-and-winterline-trail"]
  },
  "mussoorie:mall-road": {
    imageUrl: "/images/places/mussoorie/mall-road.webp",
    visualDescription: "Colonial promenade with glowing vintage iron lampposts, bookshops, and evening strolls.",
    category: "Culture & Heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["mall-road", "mussoorie-mall-road", "mall-road-heritage-promenade"]
  },
  "mussoorie:george-everest": {
    imageUrl: "/images/places/mussoorie/george-everest.webp",
    visualDescription: "White stone colonial observatory estate perched on grassy ridge with panoramic snow peak vistas.",
    category: "Nature & Trails",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["george-everest", "george-everest-peak-and-observatory-house", "sir-george-everest-house"]
  },
  "mussoorie:clouds-end": {
    imageUrl: "/images/places/mussoorie/clouds-end.webp",
    visualDescription: "Secluded historic stone bungalow nestled deep in ancient deodar and pine wilderness.",
    category: "Culture & Heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["clouds-end", "clouds-end-forest-retreat", "clouds-end-estate"]
  },
  "mussoorie:landour": {
    imageUrl: "/images/places/mussoorie/landour.webp",
    visualDescription: "Misty colonial ridge settlement with stone cottages and silent oak paths.",
    category: "Culture & Heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["landour", "landour-cantonment", "landour-heritage-ridge-and-sisters-bazaar"]
  },

  // Manali Landmarks
  "manali:hadimba-temple": {
    imageUrl: "/images/places/manali/hadimba-temple.webp",
    visualDescription: "Four-tiered wooden pagoda temple set inside Dhungri towering deodar pine forest.",
    category: "Culture & Heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["hadimba-temple", "hadimba-devi-cedar-forest-temple", "hidimba-devi-temple", "dhungri-temple", "hidimba-temple"]
  },
  "manali:solang-valley": {
    imageUrl: "/images/places/manali/solang-valley.webp",
    visualDescription: "Expansive green alpine valley surrounded by snow-capped Pir Panjal peaks with paragliders in azure sky.",
    category: "Adventure & Sport",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["solang-valley", "solang-valley-ridge-and-paragliding", "solang-nullah"]
  },
  "manali:old-manali": {
    imageUrl: "/images/places/manali/old-manali.webp",
    visualDescription: "Traditional timber-and-stone Himachali houses, apple orchards, and bohemian riverside verandas.",
    category: "Culture & Heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["old-manali", "old-manali-village-and-manu-temple", "old-manali-village"]
  },
  "manali:mall-road": {
    imageUrl: "/images/places/manali/mall-road.webp",
    visualDescription: "Vibrant pedestrian mountain promenade with wooden balconies, Tibetan woollens, and evening cafes.",
    category: "Culture & Heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["mall-road", "manali-mall-road", "the-mall-manali"]
  },
  "manali:jogini-waterfall": {
    imageUrl: "/images/places/manali/jogini-waterfall.webp",
    visualDescription: "Scenic cascading waterfall plunging down pine-clad cliffs near Vashisht village.",
    category: "Nature & Trails",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["jogini-waterfall", "jogini-falls", "jugni-waterfall"]
  },
  "manali:vashisht-baths": {
    imageUrl: "/images/places/manali/vashisht-baths.webp",
    visualDescription: "Ancient stone temple dedicated to Sage Vashishta featuring natural geothermal hot sulphur baths.",
    category: "Culture & Heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["vashisht-baths", "vashisht-temple", "vashisht-hot-springs"]
  },

  // Dharamshala / McLeod Ganj Landmarks
  "dharamshala:namgyal-monastery": {
    imageUrl: "/images/places/dharamshala/namgyal-monastery.webp",
    visualDescription: "Dalai Lama monastery complex with prayer wheels surrounded by cedar woods under the Dhauladhar wall.",
    category: "Culture & Heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["namgyal-monastery", "namgyal-monastery-and-tsuglagkhang-complex", "tsuglagkhang"]
  },
  "dharamshala:bhagsunag-waterfall": {
    imageUrl: "/images/places/dharamshala/bhagsunag-waterfall.webp",
    visualDescription: "Rocky waterfall cascade set beneath slate cliffs near ancient Bhagsunath Shiva temple.",
    category: "Nature & Trails",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["bhagsunag-waterfall", "bhagsu-falls", "bhagsu-waterfall"]
  },
  "dharamshala:triund-trail": {
    imageUrl: "/images/places/dharamshala/triund-trail.webp",
    visualDescription: "Famous ridge trek offering sweeping vistas of the Kangra Valley and sheer snow wall of Dhauladhar.",
    category: "Nature & Trails",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["triund-trail", "triund-trek", "triund-ridge", "triund"]
  },

  // Goa Landmarks
  "goa:fontainhas-latin-quarter": {
    imageUrl: "/images/places/goa/fontainhas-latin-quarter.webp",
    visualDescription: "Pastel-painted Portuguese heritage houses with wrought-iron balconies and bougainvillea in Panaji.",
    category: "Culture & Heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["fontainhas-latin-quarter", "fontainhas", "fontainhas-latin-heritage-quarter"]
  },
  "goa:aguada-fort": {
    imageUrl: "/images/places/goa/aguada-fort.webp",
    visualDescription: "17th-century Portuguese laterite stone sea fortress and cylindrical lighthouse on coastal headland.",
    category: "Culture & Heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["aguada-fort", "aguada-fort-and-historic-lighthouse", "fort-aguada"]
  },
  "goa:anjuna-beach": {
    imageUrl: "/images/places/goa/anjuna-beach.webp",
    visualDescription: "Curved palm-fringed Arabian sea coastline with rocky laterite outcrops and seaside shacks.",
    category: "Nature & Trails",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["anjuna-beach", "anjuna-flea-market", "anjuna"]
  },
  "goa:dudhsagar-falls": {
    imageUrl: "/images/places/goa/dudhsagar-falls.webp",
    visualDescription: "Four-tiered massive milky white waterfall tumbling through Western Ghats lush jungle.",
    category: "Nature & Trails",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["dudhsagar-falls", "dudhsagar-waterfall", "dudhsagar"]
  },
  "goa:basilica-bom-jesus": {
    imageUrl: "/images/places/goa/basilica-bom-jesus.webp",
    visualDescription: "UNESCO World Heritage 16th-century baroque laterite church in Old Goa.",
    category: "Culture & Heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["basilica-bom-jesus", "basilica-of-bom-jesus", "bom-jesus"]
  },

  // Rishikesh Landmarks
  "rishikesh:triveni-ghat": {
    imageUrl: "/images/places/rishikesh/triveni-ghat.webp",
    visualDescription: "Sacred stone riverfront steps at the Ganges confluence with twilight brass aarti lamps and floating diyas.",
    category: "Culture & Heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["triveni-ghat", "triveni-ghat-evening-maha-aarti", "triveni-ghat-aarti"]
  },
  "rishikesh:laxman-jhula": {
    imageUrl: "/images/places/rishikesh/laxman-jhula.webp",
    visualDescription: "Iconic iron suspension bridge spanning across the turquoise Ganga with multi-storey temple spires.",
    category: "Culture & Heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["laxman-jhula", "lakshman-jhula", "lakshman-suspension-bridge"]
  },
  "rishikesh:ram-jhula": {
    imageUrl: "/images/places/rishikesh/ram-jhula.webp",
    visualDescription: "Historic iron suspension walkway connecting sacred ashrams across the emerald Ganges.",
    category: "Culture & Heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["ram-jhula", "rama-jhula"]
  },
  "rishikesh:beatles-ashram": {
    imageUrl: "/images/places/rishikesh/beatles-ashram.webp",
    visualDescription: "Historic Chaurasi Kutia ashram with dome meditation pods nestled inside Rajaji forest canopy.",
    category: "Culture & Heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["beatles-ashram", "chaurasi-kutia", "maharishi-mahesh-yogi-ashram"]
  },

  // Jaipur Landmarks
  "jaipur:hawa-mahal": {
    imageUrl: "/images/places/jaipur/hawa-mahal.webp",
    visualDescription: "Five-storey pink sandstone honeycomb facade with 953 carved jharokha lattice windows.",
    category: "Culture & Heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["hawa-mahal", "hawa-mahal-palace-of-winds", "palace-of-winds"]
  },
  "jaipur:amber-fort": {
    imageUrl: "/images/places/jaipur/amber-fort.webp",
    visualDescription: "Majestic hilltop fort with pale yellow and pink sandstone ramparts reflected in Maota Lake.",
    category: "Culture & Heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["amber-fort", "amer-fort", "amber-palace", "amer-palace"]
  },
  "jaipur:city-palace": {
    imageUrl: "/images/places/jaipur/city-palace.webp",
    visualDescription: "Royal complex of courtyards, gardens, and ornate pavilions fusing Rajput and Mughal architecture.",
    category: "Culture & Heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["city-palace", "city-palace-jaipur", "jaipur-city-palace"]
  },
  "jaipur:nahargarh-fort": {
    imageUrl: "/images/places/jaipur/nahargarh-fort.webp",
    visualDescription: "Aravalli ridge fortress offering panoramic sunset views across the pink city expanse.",
    category: "Culture & Heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["nahargarh-fort", "nahargarh"]
  },

  // Udaipur Landmarks
  "udaipur:city-palace-udaipur": {
    imageUrl: "/images/places/udaipur/city-palace-udaipur.webp",
    visualDescription: "Monumental whitewashed marble palace with mirrored domes rising over the eastern shore of Lake Pichola.",
    category: "Culture & Heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["city-palace-udaipur", "city-palace-of-udaipur", "city-palace"]
  },
  "udaipur:lake-pichola": {
    imageUrl: "/images/places/udaipur/lake-pichola.webp",
    visualDescription: "Picturesque freshwater lake surrounded by whitewashed havelis, ghats, and hill silhouettes.",
    category: "Nature & Trails",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["lake-pichola", "pichola-lake", "pichola"]
  },
  "udaipur:jagdish-temple": {
    imageUrl: "/images/places/udaipur/jagdish-temple.webp",
    visualDescription: "Intricately carved 1651 Indo-Aryan Vishnu temple rising on a tall plinth in old Udaipur.",
    category: "Culture & Heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["jagdish-temple", "shree-jagdish-temple"]
  },

  // Varanasi Landmarks
  "varanasi:dashashwamedh-ghat-aarti": {
    imageUrl: "/images/places/varanasi/dashashwamedh-ghat-aarti.webp",
    visualDescription: "Historic stone riverfront steps illuminated by brass oil lamps and evening river reflections.",
    category: "Culture & Heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["dashashwamedh-ghat-aarti", "dashashwamedh-ghat-evening-maha-aarti", "dashashwamedh-ghat"]
  },
  "varanasi:kashi-vishwanath": {
    imageUrl: "/images/places/varanasi/kashi-vishwanath.webp",
    visualDescription: "Sacred golden-spired temple of Lord Shiva along the eternal lanes of Kashi.",
    category: "Culture & Heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["kashi-vishwanath", "kashi-vishwanath-temple", "vishwanath-temple"]
  },
  "varanasi:assi-ghat": {
    imageUrl: "/images/places/varanasi/assi-ghat.webp",
    visualDescription: "Southernmost sacred ghat at the Assi-Ganga confluence famous for morning yoga and music.",
    category: "Culture & Heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["assi-ghat", "asi-ghat"]
  },

  // Leh Ladakh Landmarks
  "leh:thiksey-monastery-gompa": {
    imageUrl: "/images/places/leh/thiksey-monastery-gompa.webp",
    visualDescription: "Layered 12-storey whitewashed and ochre Tibetan monastery rising on a hill above the Indus Valley.",
    category: "Culture & Heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["thiksey-monastery-gompa", "thiksey-monastery", "thiksey-gompa"]
  },
  "leh:pangong-tso": {
    imageUrl: "/images/places/leh/pangong-tso.webp",
    visualDescription: "High-altitude saline lake shifting in shades of cobalt and turquoise under barren Himalayan crags.",
    category: "Nature & Trails",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["pangong-tso", "pangong-lake", "pangong"]
  },
  "leh:leh-palace": {
    imageUrl: "/images/places/leh/leh-palace.webp",
    visualDescription: "Historic 17th-century Tibetan royal palace crowning the mountain ridge over Leh old town.",
    category: "Culture & Heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["leh-palace", "palace-of-leh", "leh-chen-spalkhar"]
  },

  // Spiti Valley Landmarks
  "spiti:key-monastery": {
    imageUrl: "/images/places/spiti/key-monastery.webp",
    visualDescription: "Thousand-year-old fort-like Tibetan monastery perched atop a rocky hill in high-altitude cold desert.",
    category: "Culture & Heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["key-monastery", "key-monastery-ki-gompa", "ki-gompa", "kye-gompa"]
  },
  "spiti:chandratal-lake": {
    imageUrl: "/images/places/spiti/chandratal-lake.webp",
    visualDescription: "Crescent-shaped pristine alpine lake situated at 4,300m in the cold desert of Spiti.",
    category: "Nature & Trails",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["chandratal-lake", "chandra-taal", "chandratal"]
  },
  "spiti:dhankar-gompa": {
    imageUrl: "/images/places/spiti/dhankar-gompa.webp",
    visualDescription: "Cliff-hanging ancient Buddhist monastery overlooking the dramatic Spiti and Pin rivers confluence.",
    category: "Culture & Heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: ["dhankar-gompa", "dhankar-monastery", "dankhar"]
  },
};

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

/**
 * Controlled 34 Semantic Categories Taxonomy Classifier with collision safety.
 */
export function classifyCategoryTheme(
  category: string = "",
  placeName: string = "",
  tags: string = ""
): "cafe" | "food" | "nature" | "waterfall" | "beach" | "spiritual" | "monastery" | "church" | "heritage" | "stay" | "shopping" | "transport" | "viewpoint" {
  const text = `${category || ""} ${placeName || ""} ${tags || ""}`.toLowerCase();

  // Strict Cafe & Bakery
  if (
    text.includes("cafe") ||
    text.includes("café") ||
    text.includes("coffee") ||
    text.includes("bakery") ||
    text.includes("bakehouse") ||
    text.includes("tea house") ||
    text.includes("espresso")
  ) {
    return "cafe";
  }

  // Strict Food & Restaurant & Street Food
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
    text.includes("chaat")
  ) {
    return "food";
  }

  // Stays & Accommodation (NEVER temple, NEVER mountain)
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
    text.includes("villa")
  ) {
    return "stay";
  }

  // Church
  if (
    text.includes("church") ||
    text.includes("cathedral") ||
    text.includes("chapel") ||
    text.includes("basilica")
  ) {
    return "church";
  }

  // Monastery / Gompa
  if (
    text.includes("monastery") ||
    text.includes("gompa") ||
    text.includes("stupa") ||
    text.includes("tibetan temple") ||
    text.includes("dzong")
  ) {
    return "monastery";
  }

  // Temple / Ashram / Mosque / Spiritual (NEVER stay, NEVER food)
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
    text.includes("spiritual")
  ) {
    return "spiritual";
  }

  // Waterfall / Cascade
  if (
    text.includes("waterfall") ||
    text.includes("falls") ||
    text.includes("cascade")
  ) {
    return "waterfall";
  }

  // Beach / Coast
  if (
    text.includes("beach") ||
    text.includes("coast") ||
    text.includes("cove") ||
    text.includes("shore") ||
    text.includes("cliff beach")
  ) {
    return "beach";
  }

  // Fort / Palace / Heritage / Museum
  if (
    text.includes("fort") ||
    text.includes("palace") ||
    text.includes("haveli") ||
    text.includes("museum") ||
    text.includes("monument") ||
    text.includes("heritage") ||
    text.includes("ruins") ||
    text.includes("castle")
  ) {
    return "heritage";
  }

  // Shopping / Market / Bazaar
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

  // Mobility / Transport
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

  // Trails / Nature / Trek / River / Lake
  if (
    text.includes("trail") ||
    text.includes("trek") ||
    text.includes("forest") ||
    text.includes("woods") ||
    text.includes("pine") ||
    text.includes("deodar") ||
    text.includes("jungle") ||
    text.includes("river") ||
    text.includes("lake") ||
    text.includes("park") ||
    text.includes("sanctuary") ||
    text.includes("nature")
  ) {
    return "nature";
  }

  return "viewpoint";
}

/**
 * Universal safe semantic fallback URL
 */
export function getUniversalFallback(semanticTheme: string): string {
  const themeMap: Record<string, string> = {
    cafe: "/images/places/universal/cafe.webp",
    food: "/images/places/universal/food.webp",
    nature: "/images/places/universal/nature.webp",
    waterfall: "/images/places/universal/waterfall.webp",
    beach: "/images/places/universal/beach.webp",
    lake: "/images/places/universal/lake.webp",
    spiritual: "/images/places/universal/spiritual.webp",
    monastery: "/images/places/universal/monastery.webp",
    church: "/images/places/universal/church.webp",
    heritage: "/images/places/universal/heritage.webp",
    stay: "/images/places/universal/stay.webp",
    shopping: "/images/places/universal/shopping.webp",
    transport: "/images/places/universal/transport.webp",
    nightlife: "/images/places/universal/nightlife.webp",
    viewpoint: "/images/places/universal/viewpoint.webp",
  };
  return themeMap[semanticTheme] || "/images/places/universal/nature.webp";
}

/**
 * Resolves artwork for any real-world place deterministically adhering to the 8-Level Priority.
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
    if (destNorm === k || destNorm.includes(k) || k.includes(destNorm)) {
      matchedDestKey = k;
      break;
    }
  }

  const destIllustration = matchedDestKey ? DESTINATION_ASSET_MAP[matchedDestKey].illustration : null;
  const destHero = matchedDestKey ? DESTINATION_ASSET_MAP[matchedDestKey].hero : null;
  const semanticTheme = classifyCategoryTheme(category, placeName);
  const universalSafe = getUniversalFallback(semanticTheme);
  const destFallback = destIllustration || destHero || universalSafe;

  // LEVEL 1 & 2: Verified Live Provider Photograph URL (Wikimedia Commons, Google Places, verified OSM photo)
  if (
    isLive &&
    existingImageUrl &&
    (existingImageUrl.startsWith("https://") || existingImageUrl.startsWith("http://") || existingImageUrl.startsWith("/images/places/")) &&
    !existingImageUrl.includes("placeholder")
  ) {
    const isWikimedia = existingImageUrl.includes("wikimedia.org") || existingImageUrl.includes("wikidata.org");
    const sourceLabel = isWikimedia ? "wikimedia" : (source || "live_provider");
    return {
      url: existingImageUrl,
      fallback_url: destFallback,
      source: sourceLabel,
      source_type: "real_photo",
      provenance: "live_place",
      semantic_category: semanticTheme,
      exactness: "exact",
      attribution: isWikimedia ? "Wikimedia Commons / Verified Open Source" : "Live Provider Photo",
      alt_text: `${placeName} in ${destinationName || "India"}`,
      badge_label: "LIVE PLACE PHOTO",
      artworkKey: `live:${placeNorm}`,
      imageUrl: existingImageUrl,
      fallbackUrl: destFallback,
      tier: "live_place",
      placeName,
      destinationName,
      category,
      isRealPhoto: true,
      badgeLabel: "LIVE PLACE PHOTO",
      visualDescription: `Verified live photograph of ${placeName}.`
    };
  }

  // LEVEL 3 & 4: Exact Place Match in Verified Registry
  const lookupKey = `${destNorm}:${placeNorm}`;
  if (EXACT_PLACE_REGISTRY[lookupKey]) {
    const entry = EXACT_PLACE_REGISTRY[lookupKey];
    return {
      url: entry.imageUrl,
      fallback_url: destFallback,
      source: entry.source || "vanvas_curated",
      source_type: entry.sourceType || "editorial_artwork",
      provenance: "exact_place",
      semantic_category: semanticTheme,
      exactness: "exact",
      attribution: entry.attribution || "VANVAS Verified Sanctuary Asset",
      alt_text: `${placeName} in ${destinationName}`,
      badge_label: "VANVAS PLACE ARTWORK",
      artworkKey: lookupKey,
      imageUrl: entry.imageUrl,
      fallbackUrl: destFallback,
      tier: "exact_place",
      placeName,
      destinationName,
      category,
      isRealPhoto: false,
      badgeLabel: "VANVAS PLACE ARTWORK",
      visualDescription: entry.visualDescription
    };
  }

  // Exact place matching against aliases and normalized tokens
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
      url: bestExactMatch.item.imageUrl,
      fallback_url: destFallback,
      source: bestExactMatch.item.source || "vanvas_curated",
      source_type: bestExactMatch.item.sourceType || "editorial_artwork",
      provenance: "exact_place",
      semantic_category: semanticTheme,
      exactness: "exact",
      attribution: bestExactMatch.item.attribution || "VANVAS Verified Sanctuary Asset",
      alt_text: `${placeName} in ${destinationName}`,
      badge_label: "VANVAS PLACE ARTWORK",
      artworkKey: bestExactMatch.regKey,
      imageUrl: bestExactMatch.item.imageUrl,
      fallbackUrl: destFallback,
      tier: "exact_place",
      placeName,
      destinationName,
      category,
      isRealPhoto: false,
      badgeLabel: "VANVAS PLACE ARTWORK",
      visualDescription: bestExactMatch.item.visualDescription
    };
  }

  // LEVEL 5 & 6: Destination-Specific Category Visual
  const mappedCategorySubfolder = ["cafe", "nature", "spiritual", "stay", "viewpoint"].includes(semanticTheme)
    ? semanticTheme
    : (semanticTheme === "food" || semanticTheme === "shopping" ? "cafe" : (semanticTheme === "waterfall" || semanticTheme === "beach" ? "nature" : (semanticTheme === "monastery" || semanticTheme === "church" || semanticTheme === "heritage" ? "spiritual" : "nature")));

  if (matchedDestKey) {
    const categoryArtworkPath = `/images/places/${matchedDestKey}/categories/${mappedCategorySubfolder}.webp`;
    return {
      url: categoryArtworkPath,
      fallback_url: destFallback,
      source: "vanvas_curated",
      source_type: "category_photo",
      provenance: "destination_category",
      semantic_category: semanticTheme,
      exactness: "category_matched",
      alt_text: `${destinationName} ${category} atmosphere`,
      badge_label: "DESTINATION CATEGORY ART",
      artworkKey: `${matchedDestKey}:${semanticTheme}`,
      imageUrl: categoryArtworkPath,
      fallbackUrl: destFallback,
      tier: "destination_category",
      placeName,
      destinationName,
      category,
      isRealPhoto: false,
      badgeLabel: "DESTINATION CATEGORY ART",
      visualDescription: `Authentic ${destinationName} ${semanticTheme} visual.`
    };
  }

  // LEVEL 7: Regional Semantic Fallback
  if (matchedDestKey) {
    const chosenArtwork = destIllustration || destHero || universalSafe;
    return {
      url: chosenArtwork,
      fallback_url: universalSafe,
      source: "vanvas_curated",
      source_type: "editorial_artwork",
      provenance: "destination",
      semantic_category: semanticTheme,
      exactness: "destination_matched",
      alt_text: `${destinationName} travel scenery`,
      badge_label: "DESTINATION ART",
      artworkKey: `${matchedDestKey}:destination-artwork`,
      imageUrl: chosenArtwork,
      fallbackUrl: universalSafe,
      tier: "destination",
      placeName,
      destinationName,
      category,
      isRealPhoto: false,
      badgeLabel: "DESTINATION ART",
    };
  }

  // LEVEL 8: Guaranteed Universal Semantic Fallback
  return {
    url: universalSafe,
    fallback_url: "/images/destinations/fallbacks/himalayan.jpg",
    source: "fallback",
    source_type: "fallback",
    provenance: "universal_fallback",
    semantic_category: semanticTheme,
    exactness: "fallback",
    alt_text: `${category} travel atmosphere`,
    badge_label: "UNIVERSAL FALLBACK",
    artworkKey: `universal:${semanticTheme}`,
    imageUrl: universalSafe,
    fallbackUrl: "/images/destinations/fallbacks/himalayan.jpg",
    tier: "universal_fallback",
    placeName,
    destinationName,
    category,
    isRealPhoto: false,
    badgeLabel: "UNIVERSAL FALLBACK",
  };
}
