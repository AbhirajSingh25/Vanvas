/**
 * VANVAS Canonical Destination Registry & Localization Standard
 * Single authoritative source of truth across Explore, Plan, Trips, Nearby, and Copilot.
 */

export interface CanonicalDestination {
  id: string;
  name: string;
  slug: string;
  hindi_name: string;
  state: string;
  region: string;
  tagline: string;
  description: string;
  hero_image: string;
  latitude: number;
  longitude: number;
  altitude_meters: number;
  best_time_to_visit: string;
  weather_type: string;
  is_featured: boolean;
  is_curated: boolean;
}

export const CANONICAL_DESTINATIONS: CanonicalDestination[] = [
  {
    id: "dest-manali",
    name: "Manali",
    slug: "manali",
    hindi_name: "मनाली",
    state: "Himachal Pradesh",
    region: "Himalayan",
    tagline: "Pine-scented mountain air, riverside stone cafés, and high alpine trails.",
    description: "Nestled in the Beas River Valley, Manali blends rustic Himalayan charm with vibrant café culture and gateway routes to high altitude passes.",
    hero_image: "/images/destinations/manali/hero.jpg",
    latitude: 32.2396,
    longitude: 77.1887,
    altitude_meters: 2050,
    best_time_to_visit: "October to June",
    weather_type: "Alpine Mist / Cool",
    is_featured: true,
    is_curated: true,
  },
  {
    id: "dest-rishikesh",
    name: "Rishikesh",
    slug: "rishikesh",
    hindi_name: "ऋषिकेश",
    state: "Uttarakhand",
    region: "Himalayan Foothills",
    tagline: "Turquoise Ganga currents, cliffside meditation, and rapid adventures.",
    description: "The yoga capital of the world resting on the banks of the sacred Ganges, where jungle serenity meets world-class river rafting and sunset aartis.",
    hero_image: "/images/destinations/rishikesh/hero.jpg",
    latitude: 30.0869,
    longitude: 78.2676,
    altitude_meters: 372,
    best_time_to_visit: "September to May",
    weather_type: "Pleasant / River Breeze",
    is_featured: true,
    is_curated: true,
  },
  {
    id: "dest-kasol",
    name: "Kasol",
    slug: "kasol",
    hindi_name: "कसोल",
    state: "Himachal Pradesh",
    region: "Parvati Valley",
    tagline: "Mystic deodar canopies, roaring emerald waters, and bohemian trails.",
    description: "A tranquil haven in Parvati Valley famous for Israeli bakeries, pine-forested riverside hikes to Chalal and Tosh, and unmatched mountain peace.",
    hero_image: "/images/destinations/kasol/hero.jpg",
    latitude: 32.0100,
    longitude: 77.3150,
    altitude_meters: 1580,
    best_time_to_visit: "March to June & Sept to Nov",
    weather_type: "Crisp Mountain Mist",
    is_featured: true,
    is_curated: true,
  },
  {
    id: "dest-dharamshala",
    name: "Dharamshala",
    slug: "dharamshala",
    hindi_name: "धर्मशाला",
    state: "Himachal Pradesh",
    region: "Kangra Valley",
    tagline: "Prayer flags in the mist, Tibetan heritage, and the mighty Dhauladhar ridge.",
    description: "Home of the Dalai Lama, surrounded by cedar forests and dramatic snow-capped peaks with authentic momos and serene monasteries.",
    hero_image: "/images/destinations/dharamshala/hero.jpg",
    latitude: 32.2190,
    longitude: 76.3234,
    altitude_meters: 1457,
    best_time_to_visit: "September to June",
    weather_type: "Misty Cedar Air",
    is_featured: true,
    is_curated: true,
  },
  {
    id: "dest-goa",
    name: "Goa",
    slug: "goa",
    hindi_name: "गोवा",
    state: "Goa",
    region: "Coastal Western Ghats",
    tagline: "Golden palms, Portuguese villas, beach shack sunsets, and spice farms.",
    description: "Beyond the crowded tourist strips lie sleepy riverside villages, historic Latin quarters, vibrant night flea markets, and tranquil cliff beaches.",
    hero_image: "/images/destinations/goa/hero.jpg",
    latitude: 15.2993,
    longitude: 74.1240,
    altitude_meters: 10,
    best_time_to_visit: "November to April",
    weather_type: "Warm Coastal Breeze",
    is_featured: true,
    is_curated: true,
  },
  {
    id: "dest-jaipur",
    name: "Jaipur",
    slug: "jaipur",
    hindi_name: "जयपुर",
    state: "Rajasthan",
    region: "Royal Heritage",
    tagline: "Terracotta ramparts, historic havelis, rich kachoris, and artisan crafts.",
    description: "The Pink City where regal hill forts overlook bustling bazaars full of blue pottery, block-printed fabrics, and royal Rajasthani delicacies.",
    hero_image: "/images/destinations/jaipur/hero.jpg",
    latitude: 26.9124,
    longitude: 75.7873,
    altitude_meters: 431,
    best_time_to_visit: "October to March",
    weather_type: "Dry Heritage Warmth",
    is_featured: true,
    is_curated: true,
  },
  {
    id: "dest-mussoorie",
    name: "Mussoorie",
    slug: "mussoorie",
    hindi_name: "मसूरी",
    state: "Uttarakhand",
    region: "Garhwal Hills",
    tagline: "Queen of the Hills, colonial bookshops, winterline sunsets, and oak trails.",
    description: "Perched on a horseshoe ridge overlooking the Doon Valley, offering tranquil walks along Camel's Back Road and historic bakeries in Landour.",
    hero_image: "/images/destinations/mussoorie/hero.jpg",
    latitude: 30.4598,
    longitude: 78.0644,
    altitude_meters: 2005,
    best_time_to_visit: "March to June & Sept to Nov",
    weather_type: "Cool Mountain Mist",
    is_featured: true,
    is_curated: true,
  },
  {
    id: "dest-udaipur",
    name: "Udaipur",
    slug: "udaipur",
    hindi_name: "उदयपुर",
    state: "Rajasthan",
    region: "Mewar Lakes",
    tagline: "Shimmering lake waters, whitewashed palaces, and romantic rooftop evenings.",
    description: "The City of Lakes framed by the Aravalli Hills, offering tranquil boat rides on Lake Pichola and authentic Mewari hospitality.",
    hero_image: "/images/destinations/udaipur/hero.jpg",
    latitude: 24.5854,
    longitude: 73.7125,
    altitude_meters: 598,
    best_time_to_visit: "September to March",
    weather_type: "Pleasant Lake Breeze",
    is_featured: true,
    is_curated: true,
  },
  {
    id: "dest-varanasi",
    name: "Varanasi",
    slug: "varanasi",
    hindi_name: "वाराणसी",
    state: "Uttar Pradesh",
    region: "Ganga Riverfront",
    tagline: "Ancient eternal ghats, dawn boat reflections, sacred chanting, and silk lanes.",
    description: "One of the oldest continuously inhabited cities on earth, where life, philosophy, and spiritual devotion revolve around the sacred Ganges.",
    hero_image: "/images/destinations/varanasi/hero.jpg",
    latitude: 25.3176,
    longitude: 82.9739,
    altitude_meters: 80,
    best_time_to_visit: "October to March",
    weather_type: "Ancient River Breeze",
    is_featured: true,
    is_curated: true,
  },
  {
    id: "dest-leh",
    name: "Leh",
    slug: "leh",
    hindi_name: "लेह",
    state: "Ladakh",
    region: "Trans-Himalayan Cold Desert",
    tagline: "Barren moonscapes, thousand-year-old gompas, and world-highest motorable passes.",
    description: "The crown of Ladakh situated in the Indus River Valley, where stark dramatic mountain terrain meets ancient Tibetan Buddhist culture.",
    hero_image: "/images/destinations/leh/hero.jpg",
    latitude: 34.1526,
    longitude: 77.5771,
    altitude_meters: 3500,
    best_time_to_visit: "May to October",
    weather_type: "High Altitude Crisp Air",
    is_featured: true,
    is_curated: true,
  },
  {
    id: "dest-spiti",
    name: "Spiti Valley",
    slug: "spiti",
    hindi_name: "स्पीति घाटी",
    state: "Himachal Pradesh",
    region: "Cold Desert Valley",
    tagline: "The middle land between Tibet and India, cliffside monasteries, and fossil villages.",
    description: "A high-altitude desert wonderland carved by the Spiti River, renowned for century-old gompas like Key and Dhankar, and pristine high-altitude lakes.",
    hero_image: "/images/destinations/spiti-valley/hero.jpg",
    latitude: 32.2461,
    longitude: 78.0349,
    altitude_meters: 3800,
    best_time_to_visit: "June to October",
    weather_type: "Dry Cold Moonscape",
    is_featured: true,
    is_curated: true,
  },
  {
    id: "dest-munnar",
    name: "Munnar",
    slug: "munnar",
    hindi_name: "मुन्नार",
    state: "Kerala",
    region: "Western Ghats Tea Hills",
    tagline: "Rolling emerald tea plantations, misty mountain gaps, and cardamom forests.",
    description: "Perched at the confluence of three mountain streams in the Western Ghats, Munnar offers endless green tea slopes, cool breezes, and colonial bungalows.",
    hero_image: "/images/destinations/fallbacks/valley.jpg",
    latitude: 10.0889,
    longitude: 77.0595,
    altitude_meters: 1600,
    best_time_to_visit: "September to May",
    weather_type: "Misty Green Slopes",
    is_featured: true,
    is_curated: true,
  },
  {
    id: "dest-tungnath-chandrashila",
    name: "Tungnath–Chandrashila Trek",
    slug: "tungnath-chandrashila",
    hindi_name: "तुंगनाथ–चंद्रशिला",
    state: "Uttarakhand",
    region: "Garhwal Himalayas",
    tagline: "World's highest Shiva shrine, alpine rhododendron bugyals, and a 360° summit over Chaukhamba.",
    description: "An iconic Garhwal Himalayan trail ascending from the meadows of Chopta (2,680m) through alpine rhododendrons to the ancient stone Tungnath Temple (3,680m) and continuing 1.5 km to the Chandrashila Summit (4,000m) with sweeping views of Chaukhamba, Trishul, and Nanda Devi.",
    hero_image: "/images/destinations/tungnath-chandrashila/hero.jpg",
    latitude: 30.4886,
    longitude: 79.2173,
    altitude_meters: 4000,
    best_time_to_visit: "April to November",
    weather_type: "High Alpine Crisp Air",
    is_featured: true,
    is_curated: true,
  },
];

export const CANONICAL_HINDI_NAMES: Record<string, string> = {
  manali: "मनाली",
  rishikesh: "ऋषिकेश",
  kasol: "कसोल",
  dharamshala: "धर्मशाला",
  "dharamshala & mcleod ganj": "धर्मशाला",
  mcleodganj: "मैक्लोडगंज",
  goa: "गोवा",
  jaipur: "जयपुर",
  mussoorie: "मसूरी",
  udaipur: "उदयपुर",
  varanasi: "वाराणसी",
  leh: "लेह",
  "leh ladakh": "लेह",
  ladakh: "लद्दाख",
  spiti: "स्पीति घाटी",
  "spiti valley": "स्पीति घाटी",
  "spiti-valley": "स्पीति घाटी",
  munnar: "मुन्नार",
  "tungnath-chandrashila": "तुंगनाथ–चंद्रशिला",
  "tungnath–chandrashila": "तुंगनाथ–चंद्रशिला",
  "tungnath-chandrashila trek": "तुंगनाथ–चंद्रशिला",
  "tungnath–chandrashila trek": "तुंगनाथ–चंद्रशिला",
  tungnath: "तुंगनाथ–चंद्रशिला",
  tunganath: "तुंगनाथ–चंद्रशिला",
  "tungnath temple": "तुंगनाथ–चंद्रशिला",
  chandrashila: "तुंगनाथ–चंद्रशिला",
  "chandrashila peak": "तुंगनाथ–चंद्रशिला",
  "chandrashila summit": "तुंगनाथ–चंद्रशिला",
  "tungnath chandrashila": "तुंगनाथ–चंद्रशिला",
  "chopta tungnath chandrashila": "तुंगनाथ–चंद्रशिला",
  chopta: "तुंगनाथ–चंद्रशिला",
  delhi: "दिल्ली",
  pune: "पुणे",
  kolkata: "कोलकाता",
  ayodhya: "अयोध्या",
  mumbai: "मुंबई",
  bengaluru: "बेंगलुरु",
  chennai: "चेन्नई",
  kochi: "कोच्चि",
  agra: "आगरा",
  amritsar: "अमृतसर",
  lucknow: "लखनऊ",
  gokarna: "गोकर्ण",
};

/**
 * Returns canonical Hindi name for any destination slug or name
 */
export function getCanonicalHindiName(slugOrName?: string | null): string {
  if (!slugOrName) return "";
  const cleaned = slugOrName
    .toLowerCase()
    .replace(/^(dyn|dest)-/, "")
    .trim();
  return CANONICAL_HINDI_NAMES[cleaned] || "";
}

/**
 * Resolves a destination by slug or ID against canonical registry
 */
export function findCanonicalDestination(slugOrId?: string | null): CanonicalDestination | undefined {
  if (!slugOrId) return undefined;
  const cleaned = slugOrId
    .toLowerCase()
    .replace(/^(dyn|dest)-/, "")
    .trim();
  return CANONICAL_DESTINATIONS.find(
    (d) =>
      d.slug.toLowerCase() === cleaned ||
      d.id.toLowerCase() === `dest-${cleaned}` ||
      d.name.toLowerCase() === cleaned
  );
}
