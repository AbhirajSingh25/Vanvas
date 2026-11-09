export const API_ENDPOINTS = {
  BASE_URL_PRODUCTION: "https://vanvas-api.onrender.com/api/v1",
  BASE_URL_LOCAL: "http://127.0.0.1:8000/api/v1",
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    VERIFY_EMAIL: "/auth/verify-email/confirm",
    RESEND_OTP: "/auth/verify-email/request",
    ME: "/auth/me",
    PROFILE: "/auth/profile",
    AVATAR: "/auth/profile/avatar",
    AVATAR_PRESET: "/auth/profile/avatar/preset",
    LOGOUT: "/auth/logout",
    CHANGE_PASSWORD: "/auth/change-password",
  },
  DESTINATIONS: {
    LIST: "/destinations",
    DETAIL: (slugOrId: string) => `/destinations/${slugOrId}`,
    PLACES: (id: string) => `/destinations/${id}/places`,
    WEATHER: (id: string) => `/destinations/${id}/weather`,
    SEARCH: "/destinations/search",
  },
  TRIPS: {
    LIST: "/trips",
    CREATE: "/trips",
    DETAIL: (id: string) => `/trips/${id}`,
    REPLAN: (id: string) => `/trips/${id}/replan`,
    IM_HERE: (id: string) => `/trips/${id}/im-here`,
    UPDATE_ITEM: (tripId: string, itemId: string) => `/trips/${tripId}/items/${itemId}`,
    BUDGET: (id: string) => `/trips/${id}/budget`,
    EXPENSES: (id: string) => `/trips/${id}/expenses`,
    EXPENSE_DETAIL: (tripId: string, expenseId: string) => `/trips/${tripId}/expenses/${expenseId}`,
    MEMBERS: (id: string) => `/trips/${id}/members`,
  },
  ROAD_TRIP: {
    CORRIDORS: "/road-trip/corridors",
    PLAN: "/road-trip/plan",
    SAVE: "/road-trip/save",
  },
  COPILOT: {
    CHAT: "/copilot/chat",
    UPLOAD_IMAGE: "/copilot/upload-image",
  },
  HOTELS: "/hotels",
  RENTALS: "/rentals",
  PLACES: {
    NEARBY: "/places/nearby",
    DETAIL: (id: string) => `/places/${id}`,
  },
} as const;

export interface CanonicalTrekSummary {
  id: string;
  slug: string;
  title: string;
  hindiTitle: string;
  region: string;
  state: string;
  baseCamp: string;
  peakAltitudeMeters: number;
  peakAltitudeFormatted: string;
  totalDistanceKm: number;
  durationDays: number;
  durationHours: string;
  difficulty: "Easy" | "Moderate" | "Challenging" | "Difficult";
  bestSeason: string;
  approxBudgetPerPerson: number;
  altitudeRiskIndicator: string;
  heroImage: string;
  tagline: string;
  expeditionOverview: string;
  acclimatizationGuidance: string;
  safetyAdvisories: string[];
  keyWaypoints: {
    name: string;
    elevation: string;
    type: string;
    notes: string;
  }[];
}

export const CANONICAL_HIMALAYAN_TREKS: CanonicalTrekSummary[] = [
  {
    id: "tungnath-chandrashila",
    slug: "tungnath-chandrashila",
    title: "Tungnath – Chandrashila Summit",
    hindiTitle: "तुंगनाथ – चंद्रशिला शिखर अभियान",
    region: "Garhwal Himalayas",
    state: "Uttarakhand",
    baseCamp: "Chopta Bugyal (2,680 m)",
    peakAltitudeMeters: 4000,
    peakAltitudeFormatted: "4,000 m (13,123 ft)",
    totalDistanceKm: 10,
    durationDays: 1,
    durationHours: "5 – 7 Hours",
    difficulty: "Moderate",
    bestSeason: "Apr–Nov (Shrine Open) & Dec–Feb (Snow Summit)",
    approxBudgetPerPerson: 1800,
    altitudeRiskIndicator: "Moderate (Acclimatization Recommended)",
    heroImage: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80",
    tagline: "Ascend to the highest Shiva temple on Earth and touch the 360° moon rock summit.",
    expeditionOverview: "A legendary high-altitude ridge hike rising from the rhododendron meadows of Chopta to the 1,000-year-old Nagara stone temple of Tungnath (3,680m), culminating at the 4,000m Chandrashila summit with panoramic views of Chaukhamba, Nanda Devi, and Trishul.",
    acclimatizationGuidance: "Spend one night at Chopta (2,680 m) or Sari before summit push. Climb high, sleep low. Maintain 3-4 liters of hydration.",
    safetyAdvisories: [
      "No permanent medical facility past Chopta roadhead.",
      "Weather shifts rapidly after 1:00 PM; start summit ascent by 5:00 AM.",
      "Microspikes and trekking poles mandatory during December–March snow.",
      "Strict zero-litter policy in Kedarnath Wildlife Sanctuary zone.",
    ],
    keyWaypoints: [
      { name: "Chopta Meadows", elevation: "2,680 m", type: "Basecamp Trailhead", notes: "Forest checkpost, registration, water points" },
      { name: "Forest Trail", elevation: "3,050 m", type: "Buransh Woods", notes: "Rhododendron canopy and stone switchbacks" },
      { name: "Bhringi Tung", elevation: "3,390 m", type: "Meadow Ridge", notes: "Tree line ends, alpine wind exposure begins" },
      { name: "Tungnath Temple", elevation: "3,680 m", type: "Sacred Shrine", notes: "Highest Shiva temple, ancient stone courtyard" },
      { name: "Chandrashila Peak", elevation: "4,000 m", type: "Summit", notes: "360-degree Chaukhamba, Trishul, Nanda Devi panoramic vista" },
    ],
  },
  {
    id: "kedarkantha",
    slug: "kedarkantha",
    title: "Kedarkantha Summit Trail",
    hindiTitle: "केदारकंठ शिखर अभियान",
    region: "Govind Pashu Vihar",
    state: "Uttarakhand",
    baseCamp: "Sankri (1,920 m)",
    peakAltitudeMeters: 3800,
    peakAltitudeFormatted: "3,800 m (12,467 ft)",
    totalDistanceKm: 20,
    durationDays: 4,
    durationHours: "4 Days (Camped)",
    difficulty: "Moderate",
    bestSeason: "Dec–Apr (Winter Snow) & May–Oct (Pine Green)",
    approxBudgetPerPerson: 7500,
    altitudeRiskIndicator: "Moderate (Proper Campsite Acclimatization)",
    heroImage: "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80",
    tagline: "India's premier winter ridge trek through ancient pine forests to a 3,800m summit.",
    expeditionOverview: "Ascend through dense pine and oak forests of Govind Pashu Vihar National Park, camp beside the frozen Juda Ka Talab, and push along the ridge to Kedarkantha's rocky pyramid peak for a sunrise view across the Swargarohini, Bandarpoonch, and Black Peak ranges.",
    acclimatizationGuidance: "Acclimatize at Sankri base camp on Day 1. Camp at Juda Ka Talab (2,780 m) on Day 2 before proceeding to Kedarkantha Base (3,400 m).",
    safetyAdvisories: [
      "Sub-zero temperatures (-5°C to -10°C) during winter nights.",
      "Gaiters and microspikes essential above Juda Ka Talab in snow months.",
      "Register at Govind Wildlife Sanctuary checkpost in Sankri.",
      "Forest department permits required for drone operations.",
    ],
    keyWaypoints: [
      { name: "Sankri Village", elevation: "1,920 m", type: "Base Camp", notes: "Gear rental, homestays, forest permits" },
      { name: "Juda Ka Talab", elevation: "2,780 m", type: "Alpine Lake Camp", notes: "Serene natural lake surrounded by pine slopes" },
      { name: "Kedarkantha Base Camp", elevation: "3,400 m", type: "Summit Base Camp", notes: "Expansive snow meadows beneath the summit pyramid" },
      { name: "Kedarkantha Summit", elevation: "3,800 m", type: "Summit Ridge", notes: "Trishul cairn, 360-degree Swargarohini panorama" },
    ],
  },
  {
    id: "triund",
    slug: "triund",
    title: "Triund Ridge & Snowline",
    hindiTitle: "त्रियुंड रिज एवं स्नोलाइन",
    region: "Kangra Valley & Dhauladhar",
    state: "Himachal Pradesh",
    baseCamp: "McLeod Ganj / Dharamkot (2,082 m)",
    peakAltitudeMeters: 2850,
    peakAltitudeFormatted: "2,850 m (9,350 ft)",
    totalDistanceKm: 9,
    durationDays: 1,
    durationHours: "4 – 6 Hours",
    difficulty: "Easy",
    bestSeason: "Mar–Jun & Sep–Dec",
    approxBudgetPerPerson: 1500,
    altitudeRiskIndicator: "Low",
    heroImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80",
    tagline: "The crown jewel of Dharamshala: a tranquil ridge beneath towering granite walls.",
    expeditionOverview: "A classic day trek beginning from Dharamkot/Galoo temple, tracing mixed oak and rhododendron paths to the famous Triund grassy ridge, with direct close-up views of the sheer Dhauladhar rock faces on one side and the expansive Kangra valley on the other.",
    acclimatizationGuidance: "Standard fitness sufficient. Acclimatization at Dharamkot or McLeod Ganj (2,000 m) is natural.",
    safetyAdvisories: [
      "Last 1 km (22 curves) is steep with loose scree.",
      "No overnight camping permitted without certified local forest permit.",
      "Carry water; commercial water stalls on ridge are expensive.",
      "Descend before dusk to avoid encountering wild Himalayan bears.",
    ],
    keyWaypoints: [
      { name: "Galoo Temple", elevation: "2,130 m", type: "Trailhead", notes: "Forest checkpoint, water bottles tagged" },
      { name: "Magic View Cafe", elevation: "2,500 m", type: "Rest Stop", notes: "Historic resting spot established in 1984" },
      { name: "Triund Ridge", elevation: "2,850 m", type: "Summit Ridge", notes: "Grassy plateau directly under Dhauladhar granite" },
      { name: "Snowline Cafe", elevation: "3,200 m", type: "Optional Extension", notes: "Extended 3km push towards Ilaqa Got" },
    ],
  },
  {
    id: "hampta-pass",
    slug: "hampta-pass",
    title: "Hampta Pass & Chandratal Traverse",
    hindiTitle: "हम्प्टा पास एवं चंद्रताल क्रॉसओवर",
    region: "Pir Panjal to Spiti Crossover",
    state: "Himachal Pradesh",
    baseCamp: "Jobra / Manali (2,900 m)",
    peakAltitudeMeters: 4270,
    peakAltitudeFormatted: "4,270 m (14,009 ft)",
    totalDistanceKm: 35,
    durationDays: 5,
    durationHours: "5 Days (Cross-Valley)",
    difficulty: "Challenging",
    bestSeason: "Mid-Jun to Mid-Oct",
    approxBudgetPerPerson: 9500,
    altitudeRiskIndicator: "High (High Altitude Pass Crossing)",
    heroImage: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    tagline: "A dramatic crossover from the lush green Kullu valley into the stark arid moonscapes of Spiti.",
    expeditionOverview: "One of the most contrasting Himalayan traverses: start in the vibrant alpine river valleys and birch forests of Kullu, climb over the 4,270m Hampta Pass across snow bridges, and descend into the cold desert landscape of Chatru and the mystical crescent waters of Chandratal.",
    acclimatizationGuidance: "Stay at Manali (2,050 m) 24 hours prior. Acclimatization walk at Balu Ka Ghera (3,700 m) before pass day.",
    safetyAdvisories: [
      "River crossing at Shea Goru can be icy and chest-deep during early morning snowmelt.",
      "High altitude sickness possible; carry Diamox and pulse oximeter.",
      "Snow bridges require careful step-cutting in early June/July.",
      "Road from Chatru to Chandratal is prone to seasonal landslides.",
    ],
    keyWaypoints: [
      { name: "Jobra", elevation: "2,900 m", type: "Trailhead", notes: "Hydropower project roadhead, Rani river trail" },
      { name: "Chika", elevation: "3,150 m", type: "Campsite", notes: "Boulder field, clear spring water" },
      { name: "Balu Ka Ghera", elevation: "3,700 m", type: "Pass Base Camp", notes: "Flat sandy riverbed beneath snow ridges" },
      { name: "Hampta Pass Summit", elevation: "4,270 m", type: "Mountain Pass", notes: "Dramatic contrast between green Kullu and barren Spiti" },
      { name: "Shea Goru", elevation: "3,900 m", type: "River Camp", notes: "Cold stream campsite with Indrasan view" },
      { name: "Chatru & Chandratal", elevation: "4,300 m", type: "Spiti Desert Lake", notes: "Sacred moon lake surrounded by barren peaks" },
    ],
  },
];

export * from "./artworkManifest";

