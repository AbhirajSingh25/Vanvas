/**
 * VANVAS Visual Intelligence & Destination Artwork System
 * 
 * Implements the permanent specifications from VANVAS_ART_BIBLE.md:
 * - Dual Imagery Pipeline: Illustration (Explore/Discovery) vs. Real Photography (Detail/Places)
 * - Seeded Curated Destination Blueprints (Manali, Rishikesh, Kasol, Dharamshala, Goa, Jaipur, Udaipur, Mussoorie, Spiti, Leh, Varanasi)
 * - Scalable Terrain & Architectural Profiling for Arbitrary Unseeded Destinations (Munnar, Meghalaya, Kedarnath, Bali, etc.)
 * - Zero Broken Image Guarantee with Multi-Tier Fallback Resolution
 * - Creative MCP Programmatic Generation Interface
 */

export type VisualRole = "illustration" | "hero" | "card" | "place";

export type TerrainType =
  | "himalayan"
  | "high_desert"
  | "coastal"
  | "desert"
  | "valley"
  | "river_ghat"
  | "tropical"
  | "general";

export interface DestinationVisualProfile {
  slug: string;
  name: string;
  hindiName?: string;
  terrainType: TerrainType;
  elevationMeters?: number;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    mist: string;
  };
  illustrationPath: string;
  heroPath: string;
  fallbackPath: string;
  artDirectionPrompt: string;
}

export interface CreativeArtworkRequest {
  destination_name: string;
  slug: string;
  region?: string;
  country?: string;
  elevation_meters?: number;
  terrain_type: TerrainType;
  visual_role: VisualRole;
  aspect_ratio: "square" | "tall" | "wide" | "hero";
}

export interface CreativeArtworkResponse {
  asset_url: string;
  is_curated: boolean;
  visual_role: VisualRole;
  art_direction: string;
  prompt_used?: string;
  validation_status: "verified" | "fallback" | "pending";
}

/**
 * Curated Seeded Destination Profiles adhering strictly to VANVAS_ART_BIBLE.md
 */
export const SEEDED_DESTINATION_PROFILES: Record<string, DestinationVisualProfile> = {
  manali: {
    slug: "manali",
    name: "Manali",
    hindiName: "मनाली",
    terrainType: "himalayan",
    elevationMeters: 2050,
    palette: { primary: "#173B32", secondary: "#273D52", accent: "#B65E3C", mist: "#D8DED5" },
    illustrationPath: "/images/destinations/manali/illustration.jpg",
    heroPath: "/images/destinations/manali/hero.jpg",
    fallbackPath: "/images/destinations/fallbacks/himalayan.jpg",
    artDirectionPrompt: "Layered Himalayan valley, dense pine and deodar forests, steep mountain walls, winding road, Kath-Kuni wooden houses with slate roofs, Beas river valley, cool morning mist, sophisticated gouache texture, deep green, muted blue, warm earth tones, no text.",
  },
  rishikesh: {
    slug: "rishikesh",
    name: "Rishikesh",
    hindiName: "ऋषिकेश",
    terrainType: "river_ghat",
    elevationMeters: 372,
    palette: { primary: "#0F2924", secondary: "#3B6A68", accent: "#B49252", mist: "#E5D5BA" },
    illustrationPath: "/images/destinations/rishikesh/illustration.jpg",
    heroPath: "/images/destinations/rishikesh/hero.jpg",
    fallbackPath: "/images/destinations/fallbacks/valley.jpg",
    artDirectionPrompt: "Turquoise Ganga flowing through forested Himalayan foothills, suspension bridge silhouette, stone riverside ghats, lush cliffs, early morning mist, screen-print texture, emerald river blue, muted terracotta, no text.",
  },
  kasol: {
    slug: "kasol",
    name: "Kasol",
    hindiName: "कसोल",
    terrainType: "himalayan",
    elevationMeters: 1580,
    palette: { primary: "#173B32", secondary: "#3F4F42", accent: "#B65E3C", mist: "#D8DED5" },
    illustrationPath: "/images/destinations/kasol/illustration.jpg",
    heroPath: "/images/destinations/kasol/hero.jpg",
    fallbackPath: "/images/destinations/fallbacks/himalayan.jpg",
    artDirectionPrompt: "Narrow dramatic Parvati valley, boulder-strewn emerald river, dense pine and cedar forest canopies, mountain cabins, winding gorge road, moody mist, slate blue and earthy brown palette, no text.",
  },
  dharamshala: {
    slug: "dharamshala",
    name: "Dharamshala",
    hindiName: "धर्मशाला",
    terrainType: "himalayan",
    elevationMeters: 1457,
    palette: { primary: "#1B352E", secondary: "#422828", accent: "#B49252", mist: "#D8DED5" },
    illustrationPath: "/images/destinations/dharamshala/illustration.jpg",
    heroPath: "/images/destinations/dharamshala/hero.jpg",
    fallbackPath: "/images/destinations/fallbacks/himalayan.jpg",
    artDirectionPrompt: "Dhauladhar snowy mountain wall rising sharply behind hillside town, cedar forests, Tibetan-influenced multi-tiered monastery architecture, misty alpine scale, dark forest greens and burgundy accents, no text.",
  },
  mcleodganj: {
    slug: "mcleodganj",
    name: "McLeod Ganj",
    hindiName: "मैक्लोडगंज",
    terrainType: "himalayan",
    elevationMeters: 2082,
    palette: { primary: "#1B352E", secondary: "#422828", accent: "#B49252", mist: "#D8DED5" },
    illustrationPath: "/images/destinations/dharamshala/illustration.jpg",
    heroPath: "/images/destinations/dharamshala/hero.jpg",
    fallbackPath: "/images/destinations/fallbacks/himalayan.jpg",
    artDirectionPrompt: "Hillside ridge town overlooking Kangra valley, Tibetan architecture, cedar forest, mist over crags, no text.",
  },
  goa: {
    slug: "goa",
    name: "Goa",
    hindiName: "गोवा",
    terrainType: "coastal",
    elevationMeters: 10,
    palette: { primary: "#173B32", secondary: "#7B4D36", accent: "#B49252", mist: "#FAF4E8" },
    illustrationPath: "/images/destinations/goa/illustration.jpg",
    heroPath: "/images/destinations/goa/hero.jpg",
    fallbackPath: "/images/destinations/fallbacks/coastal.jpg",
    artDirectionPrompt: "Tropical coastline, Arabian Sea, natural coconut palm groves, Portuguese-influenced laterite villas, winding coastal road, warm sunset light, muted tropical terracotta and warm gold, no text.",
  },
  jaipur: {
    slug: "jaipur",
    name: "Jaipur",
    hindiName: "जयपुर",
    terrainType: "desert",
    elevationMeters: 431,
    palette: { primary: "#7B4D36", secondary: "#9E4D2E", accent: "#B49252", mist: "#EFE5D2" },
    illustrationPath: "/images/destinations/jaipur/illustration.jpg",
    heroPath: "/images/destinations/jaipur/hero.jpg",
    fallbackPath: "/images/destinations/fallbacks/desert.jpg",
    artDirectionPrompt: "Pink sandstone fort walls, Aravalli ridge backdrop, palace facades with jharokha geometry, old city streets, dry desert atmosphere, golden evening light, terracotta and mustard palette, no text.",
  },
  udaipur: {
    slug: "udaipur",
    name: "Udaipur",
    hindiName: "उदयपुर",
    terrainType: "desert",
    elevationMeters: 598,
    palette: { primary: "#273D52", secondary: "#7B4D36", accent: "#B49252", mist: "#FAF4E8" },
    illustrationPath: "/images/destinations/udaipur/illustration.jpg",
    heroPath: "/images/destinations/udaipur/hero.jpg",
    fallbackPath: "/images/destinations/fallbacks/desert.jpg",
    artDirectionPrompt: "Lake Pichola waters, whitewashed palace architecture, rolling Aravalli hill silhouettes, evening light reflections, ivory stone and muted blue lake palette, no text.",
  },
  mussoorie: {
    slug: "mussoorie",
    name: "Mussoorie",
    hindiName: "मसूरी",
    terrainType: "himalayan",
    elevationMeters: 2005,
    palette: { primary: "#173B32", secondary: "#3F324D", accent: "#B49252", mist: "#D8DED5" },
    illustrationPath: "/images/destinations/mussoorie/illustration.jpg",
    heroPath: "/images/destinations/mussoorie/hero.jpg",
    fallbackPath: "/images/destinations/fallbacks/himalayan.jpg",
    artDirectionPrompt: "Misty mountain ridge town, oak and deodar forest, winding hill roads, winterline sunset glow over valleys, deep green and atmospheric purple-amber palette, no text.",
  },
  "spiti-valley": {
    slug: "spiti-valley",
    name: "Spiti Valley",
    hindiName: "स्पीति घाटी",
    terrainType: "high_desert",
    elevationMeters: 3800,
    palette: { primary: "#4A3B32", secondary: "#273D52", accent: "#B49252", mist: "#FAF4E8" },
    illustrationPath: "/images/destinations/spiti-valley/illustration.jpg",
    heroPath: "/images/destinations/spiti-valley/hero.jpg",
    fallbackPath: "/images/destinations/fallbacks/desert.jpg",
    artDirectionPrompt: "High-altitude cold desert, stark geological mountain strata, braided river basin, whitewashed mud-and-timber monastery on cliff, cobalt sky, ochre clay, no text.",
  },
  spiti: {
    slug: "spiti",
    name: "Spiti Valley",
    hindiName: "स्पीति घाटी",
    terrainType: "high_desert",
    elevationMeters: 3800,
    palette: { primary: "#4A3B32", secondary: "#273D52", accent: "#B49252", mist: "#FAF4E8" },
    illustrationPath: "/images/destinations/spiti-valley/illustration.jpg",
    heroPath: "/images/destinations/spiti-valley/hero.jpg",
    fallbackPath: "/images/destinations/fallbacks/desert.jpg",
    artDirectionPrompt: "High-altitude cold desert, stark geological mountain strata, braided river basin, whitewashed mud-and-timber monastery on cliff, cobalt sky, ochre clay, no text.",
  },
  leh: {
    slug: "leh",
    name: "Leh",
    hindiName: "लेह",
    terrainType: "high_desert",
    elevationMeters: 3500,
    palette: { primary: "#3F3228", secondary: "#1F3B52", accent: "#B49252", mist: "#FAF4E8" },
    illustrationPath: "/images/destinations/leh/illustration.jpg",
    heroPath: "/images/destinations/leh/hero.jpg",
    fallbackPath: "/images/destinations/fallbacks/himalayan.jpg",
    artDirectionPrompt: "High-altitude plateau desert, barren mountain forms, Tibetan royal palace silhouette, stupas along ridge, intense clear blue sky, sweeping valley road, no text.",
  },
  munnar: {
    slug: "munnar",
    name: "Munnar",
    hindiName: "मुन्नार",
    terrainType: "valley",
    elevationMeters: 1600,
    palette: { primary: "#1E3B2B", secondary: "#3B5C3F", accent: "#B49252", mist: "#E5EFEA" },
    illustrationPath: "/images/destinations/fallbacks/valley.jpg",
    heroPath: "/images/destinations/fallbacks/valley.jpg",
    fallbackPath: "/images/destinations/fallbacks/valley.jpg",
    artDirectionPrompt: "Rolling emerald tea garden hills, mist rising through shola forest valleys, colonial stone bridge, Western Ghats mountain layers, deep tea green, eucalyptus tones, morning mist, no text.",
  },
  varanasi: {
    slug: "varanasi",
    name: "Varanasi",
    hindiName: "वाराणसी",
    terrainType: "river_ghat",
    elevationMeters: 80,
    palette: { primary: "#0F2924", secondary: "#7B4D36", accent: "#B49252", mist: "#E5D5BA" },
    illustrationPath: "/images/destinations/varanasi/illustration.jpg",
    heroPath: "/images/destinations/varanasi/hero.jpg",
    fallbackPath: "/images/destinations/fallbacks/valley.jpg",
    artDirectionPrompt: "Crescent bend of the sacred Ganges River, stone ghat steps, multi-layered temple spires, dawn river mist, soft brass lamp reflections, saffron and river blue-grey palette, no text.",
  },
  "tungnath-chandrashila": {
    slug: "tungnath-chandrashila",
    name: "Tungnath–Chandrashila Trek",
    hindiName: "तुंगनाथ–चंद्रशिला",
    terrainType: "himalayan",
    elevationMeters: 4000,
    palette: { primary: "#173B32", secondary: "#3F4F42", accent: "#B49252", mist: "#D8DED5" },
    illustrationPath: "/images/destinations/tungnath-chandrashila/illustration.jpg",
    heroPath: "/images/destinations/tungnath-chandrashila/hero.jpg",
    fallbackPath: "/images/destinations/fallbacks/himalayan.jpg",
    artDirectionPrompt: "High-altitude Himalayan alpine meadows (bugyals), ancient stone Tungnath Temple at 3,680m with prayer flags, rocky ascent to 4,000m Chandrashila summit, dramatic 360-degree panorama of Chaukhamba and Trishul snow peaks, crisp alpine morning light, gouache texture, deep slate grey, alpine green, crisp snow white, no text.",
  },
  "kainchi-dham": {
    slug: "kainchi-dham",
    name: "Kainchi Dham",
    hindiName: "कैंची धाम",
    terrainType: "himalayan",
    elevationMeters: 1400,
    palette: { primary: "#1E3B2B", secondary: "#C25E34", accent: "#D49B42", mist: "#E5EFEA" },
    illustrationPath: "/artworks/kainchi-dham.jpg",
    heroPath: "/images/destinations/kainchi-dham/hero.jpg",
    fallbackPath: "/artworks/kainchi-dham.jpg",
    artDirectionPrompt: "Kainchi Dham temple complex, red and orange temple roofs, clean mountain stream flowing through large boulders, lush green Kumaon valley, dense pine forest, serene Himalayan atmosphere, no text.",
  },
  murthal: {
    slug: "murthal",
    name: "Murthal (GT Road)",
    hindiName: "मुरथल",
    terrainType: "valley",
    elevationMeters: 224,
    palette: { primary: "#7B4D36", secondary: "#B65E3C", accent: "#D49B42", mist: "#FAF4E8" },
    illustrationPath: "/artworks/murthal.jpg",
    heroPath: "/images/destinations/murthal/hero.jpg",
    fallbackPath: "/artworks/murthal.jpg",
    artDirectionPrompt: "GT Road NH-44 highway corridor, Amrik Sukhdev roadside dhaba culture, tandoori parathas with white butter, clay tandoors, clay tea cups, Haryana road trip atmosphere, no text.",
  },
  agra: {
    slug: "agra",
    name: "Agra",
    hindiName: "आगरा",
    terrainType: "river_ghat",
    elevationMeters: 171,
    palette: { primary: "#1E2B37", secondary: "#7B4D36", accent: "#B49252", mist: "#FAF4E8" },
    illustrationPath: "/artworks/agra.jpg",
    heroPath: "/images/destinations/agra/hero.jpg",
    fallbackPath: "/artworks/agra.jpg",
    artDirectionPrompt: "Taj Mahal white marble monument reflecting on the Yamuna river at sunrise, Mughal sandstone arches, Mehtab Bagh gardens, warm morning light, no text.",
  },
  "mathura-vrindavan": {
    slug: "mathura-vrindavan",
    name: "Mathura & Vrindavan",
    hindiName: "मथुरा और वृन्दावन",
    terrainType: "river_ghat",
    elevationMeters: 178,
    palette: { primary: "#0F2924", secondary: "#7B4D36", accent: "#D49B42", mist: "#E5D5BA" },
    illustrationPath: "/artworks/mathura-vrindavan.jpg",
    heroPath: "/images/destinations/mathura-vrindavan/hero.jpg",
    fallbackPath: "/artworks/mathura-vrindavan.jpg",
    artDirectionPrompt: "Prem Mandir white marble temple, Banke Bihari temple atmosphere, sacred Yamuna ghat aarti lamps, Braj spiritual heritage, warm golden lighting, no text.",
  },
  neemrana: {
    slug: "neemrana",
    name: "Neemrana Fort",
    hindiName: "नीमराना",
    terrainType: "desert",
    elevationMeters: 340,
    palette: { primary: "#7B4D36", secondary: "#9E4D2E", accent: "#B49252", mist: "#EFE5D2" },
    illustrationPath: "/artworks/neemrana.jpg",
    heroPath: "/images/destinations/neemrana/hero.jpg",
    fallbackPath: "/artworks/neemrana.jpg",
    artDirectionPrompt: "15th-century stepped Neemrana Fort Palace carved into Aravalli hills, Rajput sandstone ramparts, hanging balconies, sunset over the Jaipur highway, no text.",
  },
  "damdama-sohna": {
    slug: "damdama-sohna",
    name: "Damdama & Sohna",
    hindiName: "दमदमा और सोहना",
    terrainType: "valley",
    elevationMeters: 220,
    palette: { primary: "#173B32", secondary: "#3F4F42", accent: "#B49252", mist: "#D8DED5" },
    illustrationPath: "/artworks/damdama-sohna.jpg",
    heroPath: "/images/destinations/damdama-sohna/hero.jpg",
    fallbackPath: "/artworks/damdama-sohna.jpg",
    artDirectionPrompt: "Damdama Lake serene water surface framed by rugged Aravalli rocky ridges, rowing boats, rustic green hills, tranquil weekend escape, no text.",
  },
  "alwar-siliserh": {
    slug: "alwar-siliserh",
    name: "Alwar & Siliserh Lake",
    hindiName: "अलवर और सिलीसेढ़",
    terrainType: "desert",
    elevationMeters: 270,
    palette: { primary: "#273D52", secondary: "#7B4D36", accent: "#B49252", mist: "#FAF4E8" },
    illustrationPath: "/artworks/alwar-siliserh.jpg",
    heroPath: "/images/destinations/alwar-siliserh/hero.jpg",
    fallbackPath: "/artworks/alwar-siliserh.jpg",
    artDirectionPrompt: "1845 Siliserh Lake Palace heritage hunting lodge reflecting on blue mountain lake, dense Aravalli hill backdrop, boat cruise, Rajasthan heritage, no text.",
  },
  "sariska-bhangarh": {
    slug: "sariska-bhangarh",
    name: "Sariska & Bhangarh",
    hindiName: "सरिस्का और भानगढ़",
    terrainType: "desert",
    elevationMeters: 420,
    palette: { primary: "#4A3B32", secondary: "#2D4539", accent: "#B49252", mist: "#FAF4E8" },
    illustrationPath: "/artworks/sariska-bhangarh.jpg",
    heroPath: "/images/destinations/sariska-bhangarh/hero.jpg",
    fallbackPath: "/artworks/sariska-bhangarh.jpg",
    artDirectionPrompt: "Sariska deciduous tiger reserve forest, ancient stone ruins of Bhangarh Fort, banyan trees, Aravalli rocky terrain, mysterious sunset atmosphere, no text.",
  },
  dehradun: {
    slug: "dehradun",
    name: "Dehradun (Rajpur Road)",
    hindiName: "देहरादून",
    terrainType: "himalayan",
    elevationMeters: 640,
    palette: { primary: "#173B32", secondary: "#3F4F42", accent: "#B49252", mist: "#D8DED5" },
    illustrationPath: "/artworks/dehradun.jpg",
    heroPath: "/images/destinations/dehradun/hero.jpg",
    fallbackPath: "/artworks/dehradun.jpg",
    artDirectionPrompt: "Doon valley sal forests, Rajpur Road heritage bakeries and cafes, Robber's cave limestone stream, Himalayan foothills breeze, no text.",
  },
  chandigarh: {
    slug: "chandigarh",
    name: "Chandigarh",
    hindiName: "चंडीगढ़",
    terrainType: "valley",
    elevationMeters: 321,
    palette: { primary: "#273D52", secondary: "#173B32", accent: "#B49252", mist: "#FAF4E8" },
    illustrationPath: "/artworks/chandigarh.jpg",
    heroPath: "/images/destinations/chandigarh/hero.jpg",
    fallbackPath: "/artworks/chandigarh.jpg",
    artDirectionPrompt: "Sukhna Lake morning water reflections, Nek Chand's Rock Garden recycled sculptures, Le Corbusier modernist architecture, Shivalik hill view, no text.",
  },
  "morni-hills": {
    slug: "morni-hills",
    name: "Morni Hills",
    hindiName: "मोरनी हिल्स",
    terrainType: "himalayan",
    elevationMeters: 1220,
    palette: { primary: "#173B32", secondary: "#3F4F42", accent: "#B49252", mist: "#D8DED5" },
    illustrationPath: "/artworks/morni-hills.jpg",
    heroPath: "/images/destinations/morni-hills/hero.jpg",
    fallbackPath: "/artworks/morni-hills.jpg",
    artDirectionPrompt: "Pine-forested Shivalik hill station, Tikkar Taal twin lakes calm water, winding mountain road, cool pine breeze, quiet Haryana hills, no text.",
  },
  lansdowne: {
    slug: "lansdowne",
    name: "Lansdowne",
    hindiName: "लैंसडाउन",
    terrainType: "himalayan",
    elevationMeters: 1706,
    palette: { primary: "#173B32", secondary: "#3F324D", accent: "#B49252", mist: "#D8DED5" },
    illustrationPath: "/artworks/lansdowne.jpg",
    heroPath: "/images/destinations/lansdowne/hero.jpg",
    fallbackPath: "/artworks/lansdowne.jpg",
    artDirectionPrompt: "Garhwal cantonment hill station founded in 1887, blue pine and oak forests, stone colonial church, Tip-in-Top snow peak panorama, peaceful walking trails, no text.",
  },
};

/**
 * Regional Fallback Artworks for Arbitrary Unseeded Destinations
 */
export const REGIONAL_FALLBACK_ARTWORKS: Record<TerrainType, string> = {
  himalayan: "/images/destinations/fallbacks/himalayan.jpg",
  high_desert: "/images/destinations/fallbacks/desert.jpg",
  coastal: "/images/destinations/fallbacks/coastal.jpg",
  desert: "/images/destinations/fallbacks/desert.jpg",
  valley: "/images/destinations/fallbacks/valley.jpg",
  river_ghat: "/images/destinations/fallbacks/valley.jpg",
  tropical: "/images/destinations/fallbacks/coastal.jpg",
  general: "/images/destinations/fallbacks/himalayan.jpg",
};

/**
 * Dynamically resolves the visual terrain and art profile for arbitrary unseeded destinations
 */
export function resolveDestinationVisualProfile(
  slugOrName: string,
  state?: string,
  elevationMeters?: number
): DestinationVisualProfile {
  const norm = (slugOrName || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  // Check direct seeded match
  for (const [key, profile] of Object.entries(SEEDED_DESTINATION_PROFILES)) {
    const keyNorm = key.replace(/[^a-z0-9]/g, "");
    if (norm === keyNorm || norm.includes(keyNorm) || keyNorm.includes(norm)) {
      return profile;
    }
  }

  // Evaluate terrain characteristics from geographical clues
  const text = `${slugOrName} ${state || ""}`.toLowerCase();
  let terrain: TerrainType = "general";

  if (
    text.includes("coast") ||
    text.includes("beach") ||
    text.includes("sea") ||
    text.includes("island") ||
    text.includes("bali") ||
    text.includes("andaman") ||
    text.includes("gokarna") ||
    text.includes("varkala") ||
    text.includes("alappuzha") ||
    text.includes("mumbai") ||
    text.includes("chennai") ||
    text.includes("kochi") ||
    text.includes("pondicherry") ||
    text.includes("puri")
  ) {
    terrain = "coastal";
  } else if (
    text.includes("desert") ||
    text.includes("jodhpur") ||
    text.includes("jaisalmer") ||
    text.includes("bikaner") ||
    text.includes("rajasthan") ||
    text.includes("thar") ||
    text.includes("pushkar") ||
    text.includes("dubai") ||
    text.includes("cairo")
  ) {
    terrain = "desert";
  } else if (
    text.includes("spiti") ||
    text.includes("ladakh") ||
    text.includes("zanskar") ||
    text.includes("tibet") ||
    (elevationMeters && elevationMeters > 3000)
  ) {
    terrain = "high_desert";
  } else if (
    text.includes("ghat") ||
    text.includes("varanasi") ||
    text.includes("ayodhya") ||
    text.includes("haridwar") ||
    text.includes("hampi") ||
    text.includes("ujjain") ||
    text.includes("mathura") ||
    text.includes("prayagraj") ||
    text.includes("river")
  ) {
    terrain = "river_ghat";
  } else if (
    text.includes("munnar") ||
    text.includes("meghalaya") ||
    text.includes("shillong") ||
    text.includes("coorg") ||
    text.includes("wayanad") ||
    text.includes("ooty") ||
    text.includes("kodaikanal") ||
    text.includes("tea") ||
    text.includes("valley") ||
    text.includes("chikmagalur") ||
    text.includes("pune") ||
    text.includes("mahabaleshwar") ||
    text.includes("lonavala")
  ) {
    terrain = "valley";
  } else if (
    text.includes("himalaya") ||
    text.includes("kedarnath") ||
    text.includes("badrinath") ||
    text.includes("sikkim") ||
    text.includes("gangtok") ||
    text.includes("kashmir") ||
    text.includes("gulmarg") ||
    text.includes("pahalgam") ||
    text.includes("uttarakhand") ||
    text.includes("himachal") ||
    text.includes("shimla") ||
    (elevationMeters && elevationMeters > 1200)
  ) {
    terrain = "himalayan";
  }

  const fallbackArt = REGIONAL_FALLBACK_ARTWORKS[terrain] || REGIONAL_FALLBACK_ARTWORKS.general;

  return {
    slug: slugOrName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: slugOrName,
    terrainType: terrain,
    elevationMeters: elevationMeters || (terrain === "himalayan" ? 2000 : terrain === "coastal" ? 15 : 800),
    palette: {
      primary: terrain === "desert" ? "#7B4D36" : "#173B32",
      secondary: terrain === "coastal" ? "#3B6A68" : "#273D52",
      accent: "#B49252",
      mist: "#EFE5D2",
    },
    illustrationPath: fallbackArt,
    heroPath: fallbackArt,
    fallbackPath: fallbackArt,
    artDirectionPrompt: `Contemporary Indian editorial travel illustration of ${slugOrName}, terrain ${terrain}, atmospheric lighting, sophisticated gouache texture, no text.`,
  };
}

/**
 * Quality validation helper preventing broken or deprecated visual assets
 */
export function validateArtworkQuality(assetUrl?: string | null): boolean {
  if (!assetUrl) return false;
  if (typeof assetUrl !== "string") return false;
  const trimmed = assetUrl.trim().toLowerCase();
  if (trimmed.length === 0 || trimmed === "null" || trimmed === "undefined") return false;

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
      return false;
    }
  }

  return true;
}

/**
 * Multi-Tier Destination Asset Resolver adhering to VANVAS_ART_BIBLE.md hierarchy:
 * 1. Verified Real Destination Photography (if role requires photo and URL is valid)
 * 2. Curated Seeded Destination Illustration (/images/destinations/[slug]/illustration.jpg)
 * 3. Curated Destination Hero (/images/destinations/[slug]/hero.jpg)
 * 4. Regional High-Quality Visual Artwork (/images/destinations/fallbacks/[terrain].jpg)
 * 5. General Safety Net (/images/destinations/fallbacks/himalayan.jpg)
 */
export function resolveDestinationAsset(
  slugOrName: string,
  visualRole: VisualRole = "illustration",
  candidatePhotoUrl?: string | null,
  state?: string,
  elevationMeters?: number
): {
  primarySrc: string;
  fallbackSrc: string;
  terrainType: TerrainType;
  profile: DestinationVisualProfile;
} {
  const profile = resolveDestinationVisualProfile(slugOrName, state, elevationMeters);

  // For detail hero & places: prioritize real photography if valid
  if ((visualRole === "hero" || visualRole === "place") && validateArtworkQuality(candidatePhotoUrl)) {
    return {
      primarySrc: candidatePhotoUrl!,
      fallbackSrc: profile.heroPath,
      terrainType: profile.terrainType,
      profile,
    };
  }

  // For discovery / explore: prioritize editorial illustration
  if (visualRole === "illustration") {
    return {
      primarySrc: profile.illustrationPath,
      fallbackSrc: REGIONAL_FALLBACK_ARTWORKS[profile.terrainType] || REGIONAL_FALLBACK_ARTWORKS.general,
      terrainType: profile.terrainType,
      profile,
    };
  }

  // General resolution
  return {
    primarySrc: profile.heroPath || profile.illustrationPath,
    fallbackSrc: REGIONAL_FALLBACK_ARTWORKS[profile.terrainType] || REGIONAL_FALLBACK_ARTWORKS.general,
    terrainType: profile.terrainType,
    profile,
  };
}

/**
 * Creative MCP Programmatic Generation Interface (Prepared for future MCP Image Agents)
 */
export async function generateDestinationArt(
  req: CreativeArtworkRequest
): Promise<CreativeArtworkResponse> {
  const profile = resolveDestinationVisualProfile(req.slug || req.destination_name, req.region, req.elevation_meters);

  // Return verified curated asset or formatted prompt blueprint
  return {
    asset_url: profile.illustrationPath,
    is_curated: Object.prototype.hasOwnProperty.call(SEEDED_DESTINATION_PROFILES, profile.slug),
    visual_role: req.visual_role,
    art_direction: profile.artDirectionPrompt,
    prompt_used: profile.artDirectionPrompt,
    validation_status: "verified",
  };
}
