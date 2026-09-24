/**
 * VANVAS Trek Expedition Content & Intelligence Model
 * Authoritative, verified schema for Himalayan and Indian mountain trails.
 */

export type TrekDifficulty = "Easy" | "Moderate" | "Challenging" | "Alpine / Demanding";
export type SceneryCategory = "PANORAMIC" | "HIGH" | "MODERATE" | "VALLEY";
export type GearPriority = "ESSENTIAL" | "CONDITIONAL" | "OPTIONAL";
export type GearMode = "STUDENT" | "BUDGET" | "STANDARD" | "PREMIUM";

export interface TrekWaypoint {
  id: string;
  name: string;
  hindiName: string;
  elevationMeters: number;
  elevationFormatted: string;
  distanceFromStartKm: number;
  timeFromPrev: string;
  terrainType: string;
  waterAvailable: boolean;
  shelterAvailable: boolean;
  foodAvailable: boolean;
  medicalHelp: boolean;
  latitude: number;
  longitude: number;
  fieldNotes: string;
  isSummit?: boolean;
  isBaseCamp?: boolean;
  imageUrl?: string;
}

export interface TrekRouteOption {
  id: string;
  name: string;
  trailhead: string;
  distanceKm: number;
  elevationGainMeters: number;
  estimatedTime: string;
  difficulty: TrekDifficulty;
  sceneryScore: SceneryCategory;
  sceneryDescription: string;
  crowdLevel: "Low" | "Moderate" | "Popular";
  waterPointsCount: number;
  teaStallsCount: number;
  technicalExposure: "None" | "Mild Scramble" | "Ridge Walk" | "Snow/Scree" | "Cables/Chains";
  summary: string;
  recommendedFor: string;
}

export interface TrekGearItem {
  id: string;
  name: string;
  category: "footwear" | "clothing" | "hardware" | "navigation" | "medical" | "comfort";
  priority: GearPriority;
  condition?: string; // e.g. "If winter/snow"
  studentAlternative: string;
  buyApproxCost: number;
  rentApproxCostPerDay: number;
  canBorrow: boolean;
  canSkip: boolean;
  skipCondition?: string;
  packWeightGrams: number;
}

export interface TrekBudgetBreakdown {
  baseTransportCost: number; // e.g. shared sumo / bus from railhead
  foodPerDayCost: number;
  campStayCostPerNight: number;
  guideOptionalCostPerDay: number;
  permitCost: number;
  gearRentalEstimate: number;
  emergencyBuffer: number;
  studentHacks: string[];
}

export interface TrekDifficultyFactors {
  fitnessDemand: number; // 1-10
  altitudeRisk: number; // 1-10
  terrainTechnicality: number; // 1-10
  steepnessGrade: number; // 1-10
  exposureRisk: number; // 1-10
  weatherVolatility: number; // 1-10
  explanation: string[];
}

export interface TrekFieldIntelligence {
  idealSeasonMonths: string;
  winterAccess: string;
  monsoonRisk: string;
  mobileNetwork: string; // e.g. "Jio/Airtel at base, No signal beyond 3,200m"
  nearestHospital: string;
  nearestAtm: string;
  lastMotorablePoint: string;
  permitsRequired: string;
  localGuideRule: string;
  trailEtiquette: string[];
  leaveNoTraceRules: string[];
}

export interface TrekItem {
  id: string;
  slug: string;
  title: string;
  hindiTitle: string;
  region: string;
  state: string;
  mountainRange: string;
  baseCamp: string;
  peakAltitudeMeters: number;
  peakAltitudeFormatted: string;
  totalDistanceKm: number;
  durationDays: number;
  durationHours: string;
  difficulty: TrekDifficulty;
  bestSeason: string;
  viewScore: SceneryCategory;
  approxBudgetPerPerson: number;
  altitudeRiskIndicator: "Low" | "Moderate (Acclimatization Recommended)" | "High (AMS Risk)";
  heroImage: string;
  tagline: string;
  expeditionOverview: string;
  routes: TrekRouteOption[];
  waypoints: TrekWaypoint[];
  difficultyFactors: TrekDifficultyFactors;
  gearChecklist: TrekGearItem[];
  budget: TrekBudgetBreakdown;
  fieldIntelligence: TrekFieldIntelligence;
  destinationSlug?: string;
}

export const TREK_REGISTRY: Record<string, TrekItem> = {
  "tungnath-chandrashila": {
    id: "tungnath-chandrashila",
    slug: "tungnath-chandrashila",
    title: "Tungnath – Chandrashila Summit",
    hindiTitle: "तुंगनाथ – चंद्रशिला शिखर अभियान",
    region: "Garhwal Himalayas",
    state: "Uttarakhand",
    mountainRange: "Kedar Dome & Chaukhamba Massif",
    baseCamp: "Chopta Bugyal (2,680 m)",
    peakAltitudeMeters: 4000,
    peakAltitudeFormatted: "4,000 m (13,123 ft)",
    totalDistanceKm: 10,
    durationDays: 1,
    durationHours: "5 – 7 Hours",
    difficulty: "Moderate",
    bestSeason: "Apr–Nov (Shrine Open) & Dec–Feb (Snow Summit)",
    viewScore: "PANORAMIC",
    approxBudgetPerPerson: 1800,
    altitudeRiskIndicator: "Moderate (Acclimatization Recommended)",
    heroImage: "/images/destinations/tungnath-chandrashila/hero.jpg",
    tagline: "Ascend to the highest Shiva temple on Earth and touch the 360° moon rock summit.",
    expeditionOverview: "A legendary high-altitude ridge hike rising from the rhododendron meadows of Chopta to the 1,000-year-old Nagara stone temple of Tungnath (3,680m), culminating at the 4,000m Chandrashila summit with jaw-dropping views of Chaukhamba, Nanda Devi, and Trishul.",
    destinationSlug: "tungnath-chandrashila",
    routes: [
      {
        id: "route-chopta-classic",
        name: "Route A: Chopta Main Trail (Paved Stone)",
        trailhead: "Chopta Forest Checkpost",
        distanceKm: 5.0,
        elevationGainMeters: 1320,
        estimatedTime: "3.5 – 4.5 hrs ascent",
        difficulty: "Moderate",
        sceneryScore: "PANORAMIC",
        sceneryDescription: "Opens into alpine meadows (Bugyals) with direct Chaukhamba views after the tree line.",
        crowdLevel: "Moderate",
        waterPointsCount: 3,
        teaStallsCount: 4,
        technicalExposure: "Mild Scramble",
        summary: "The canonical stone-paved pilgrimage path. Sturdy switchbacks through rhododendron woods before hitting open alpine ridges.",
        recommendedFor: "First-timers, sunrise chasers, and photographers wanting reliable trail markers."
      },
      {
        id: "route-deoriatal-ridge",
        name: "Route B: Deoria Tal to Chopta Ridge Traverse",
        trailhead: "Sari Village",
        distanceKm: 16.0,
        elevationGainMeters: 1650,
        estimatedTime: "2 Days (Camp at Rohini Bugyal)",
        difficulty: "Challenging",
        sceneryScore: "PANORAMIC",
        sceneryDescription: "Deep virgin oak forests, sacred alpine reflection lake, and wild ridge walking.",
        crowdLevel: "Low",
        waterPointsCount: 2,
        teaStallsCount: 1,
        technicalExposure: "Ridge Walk",
        summary: "An extended multi-day wilderness traverse starting from the emerald waters of Deoria Tal through Rohini Bugyal to Chopta.",
        recommendedFor: "Campers and trekkers seeking pure wilderness away from the day-tripper trail."
      }
    ],
    waypoints: [
      {
        id: "wp-chopta",
        name: "Chopta Meadows Trailhead",
        hindiName: "चोपता बुग्याल",
        elevationMeters: 2680,
        elevationFormatted: "2,680 m",
        distanceFromStartKm: 0,
        timeFromPrev: "Start",
        terrainType: "Meadows & Deodar Forest",
        waterAvailable: true,
        shelterAvailable: true,
        foodAvailable: true,
        medicalHelp: true,
        latitude: 30.4850,
        longitude: 79.1790,
        isBaseCamp: true,
        fieldNotes: "Base roadhead. Stock water, cash, and high-energy snacks here. No ATMs ahead.",
        imageUrl: "/images/places/tungnath-chandrashila/chopta-meadows.jpg"
      },
      {
        id: "wp-bhringi",
        name: "Bhringi Nala / Mid Meadow",
        hindiName: "भृंगी नाला पड़ाव",
        elevationMeters: 3100,
        elevationFormatted: "3,100 m",
        distanceFromStartKm: 1.8,
        timeFromPrev: "1 hr",
        terrainType: "Rhododendron Canopy & Flagstones",
        waterAvailable: true,
        shelterAvailable: true,
        foodAvailable: true,
        medicalHelp: false,
        latitude: 30.4868,
        longitude: 79.1980,
        fieldNotes: "Tree line boundary. Rhododendrons bloom red and pink from March to May.",
        imageUrl: "/images/places/tungnath-chandrashila/chopta-meadows.jpg"
      },
      {
        id: "wp-tungnath",
        name: "Tungnath Mahadev Temple",
        hindiName: "तृतीय केदार तुंगनाथ मंदिर",
        elevationMeters: 3680,
        elevationFormatted: "3,680 m",
        distanceFromStartKm: 3.5,
        timeFromPrev: "1.5 hrs",
        terrainType: "Alpine Tundra & Ancient Stone",
        waterAvailable: true,
        shelterAvailable: true,
        foodAvailable: true,
        medicalHelp: false,
        latitude: 30.4886,
        longitude: 79.2173,
        fieldNotes: "Highest Shiva shrine on earth. Rest for 20 mins to acclimatize before final summit pitch.",
        imageUrl: "/images/places/tungnath-chandrashila/tungnath-temple.jpg"
      },
      {
        id: "wp-chandrashila",
        name: "Chandrashila Summit (Moon Rock)",
        hindiName: "चंद्रशिला शिखर",
        elevationMeters: 4000,
        elevationFormatted: "4,000 m",
        distanceFromStartKm: 5.0,
        timeFromPrev: "1 – 1.2 hrs",
        terrainType: "Rocky Crag & Exposed Ridge",
        waterAvailable: false,
        shelterAvailable: false,
        foodAvailable: false,
        medicalHelp: false,
        latitude: 30.4930,
        longitude: 79.2185,
        isSummit: true,
        fieldNotes: "360-degree panorama: Chaukhamba 1 to 4, Nanda Devi, Trishul, Kedar Dome, Dunagiri.",
        imageUrl: "/images/places/tungnath-chandrashila/chandrashila-summit.jpg"
      }
    ],
    difficultyFactors: {
      fitnessDemand: 6,
      altitudeRisk: 6,
      terrainTechnicality: 4,
      steepnessGrade: 7,
      exposureRisk: 5,
      weatherVolatility: 7,
      explanation: [
        "Steep continuous gradient (+1,320m over 5km) tests cardiovascular endurance.",
        "Crossing the 3,500m barrier may cause mild mountain headache if rushing.",
        "Chandrashila final ridge is exposed to high wind gusts and sudden temperature drops.",
        "Winter ascents require microspikes and gaiters due to hard black ice on stone pavers."
      ]
    },
    gearChecklist: [
      {
        id: "gear-boots",
        name: "Ankle-support Hiking Boots with Lugged Sole",
        category: "footwear",
        priority: "ESSENTIAL",
        studentAlternative: "Sturdy sports shoes with deep rubber tread (avoid flat-sole sneakers)",
        buyApproxCost: 2800,
        rentApproxCostPerDay: 150,
        canBorrow: true,
        canSkip: false,
        packWeightGrams: 950
      },
      {
        id: "gear-poles",
        name: "Trekking Pole (Adjustable)",
        category: "hardware",
        priority: "ESSENTIAL",
        studentAlternative: "Locally sourced sturdy wooden walking stick at Chopta (₹40-50)",
        buyApproxCost: 800,
        rentApproxCostPerDay: 50,
        canBorrow: true,
        canSkip: false,
        packWeightGrams: 280
      },
      {
        id: "gear-shell",
        name: "Windproof & Waterproof Shell Jacket",
        category: "clothing",
        priority: "ESSENTIAL",
        studentAlternative: "Heavy nylon windcheater + compact rain poncho",
        buyApproxCost: 2200,
        rentApproxCostPerDay: 120,
        canBorrow: true,
        canSkip: false,
        packWeightGrams: 420
      },
      {
        id: "gear-fleece",
        name: "Thermal Fleece Mid-layer",
        category: "clothing",
        priority: "ESSENTIAL",
        studentAlternative: "Thick woollen sweater + cotton pullover",
        buyApproxCost: 1100,
        rentApproxCostPerDay: 80,
        canBorrow: true,
        canSkip: false,
        packWeightGrams: 350
      },
      {
        id: "gear-microspikes",
        name: "Microspikes / Crampons",
        category: "hardware",
        priority: "CONDITIONAL",
        condition: "Mandatory from Dec to Mar for hard snow & ice",
        studentAlternative: "Rent at Chopta base bazaar (₹100–150/day)",
        buyApproxCost: 1400,
        rentApproxCostPerDay: 100,
        canBorrow: true,
        canSkip: true,
        skipCondition: "Skip if trekking between May and October with zero snow cover",
        packWeightGrams: 380
      },
      {
        id: "gear-headlamp",
        name: "Headlamp / High-lumen Torch",
        category: "navigation",
        priority: "ESSENTIAL",
        studentAlternative: "Fully charged smartphone + 10,000 mAh power bank",
        buyApproxCost: 650,
        rentApproxCostPerDay: 40,
        canBorrow: true,
        canSkip: false,
        packWeightGrams: 110
      },
      {
        id: "gear-water",
        name: "2 Litre Reusable Thermos / Flask",
        category: "comfort",
        priority: "ESSENTIAL",
        studentAlternative: "Two 1L reusable water bottles filled at tea stalls",
        buyApproxCost: 700,
        rentApproxCostPerDay: 0,
        canBorrow: true,
        canSkip: false,
        packWeightGrams: 300
      }
    ],
    budget: {
      baseTransportCost: 450, // Shared taxi Rishikesh -> Ukhimath -> Chopta
      foodPerDayCost: 400, // Maggi, Paratha, Chai at stalls
      campStayCostPerNight: 650, // Dome tent at Chopta meadow
      guideOptionalCostPerDay: 1000,
      permitCost: 150, // Eco-trail fee
      gearRentalEstimate: 200,
      emergencyBuffer: 400,
      studentHacks: [
        "Take the 5:30 AM HRTC bus from Rishikesh to Rudraprayag (₹160), then shared Sumo to Ukhimath (₹80).",
        "Camp in Sari village or Chopta base instead of luxury swiss tents to save ₹1,500/night.",
        "Refill natural mountain spring water at Bhringi Nala instead of buying packaged plastic bottles."
      ]
    },
    fieldIntelligence: {
      idealSeasonMonths: "April to June (Spring floral bloom) & October to November (Crystal clear Chaukhamba views)",
      winterAccess: "Chopta receives heavy snow (1–4 ft) in Jan–Feb. Route open on foot with gaiters and microspikes.",
      monsoonRisk: "July–Aug sees heavy cloudbursts in Rudraprayag district. Leeches and slippery stone slabs.",
      mobileNetwork: "BSNL has spotty 2G/3G at Chopta. Zero cellular signal above Tungnath temple.",
      nearestHospital: "Community Health Centre (CHC) Ukhimath (28 km) / AIIMS Rishikesh (200 km)",
      nearestAtm: "Ukhimath (28 km) or Kund. No cash machines in Chopta.",
      lastMotorablePoint: "Chopta Roadhead (NH-107A)",
      permitsRequired: "Kedarnath Wildlife Sanctuary forest permit issued at Chopta checkpost (₹150 Indian / ₹600 Foreigner).",
      localGuideRule: "Self-navigable trail in summer. Local guide recommended for winter snow summits.",
      trailEtiquette: [
        "Strictly zero plastic litter. Pack out all energy bar wrappers and bottles.",
        "Maintain sanctity at Tungnath temple complex; leather belts and shoes removed before inner sanctum.",
        "Give right of way to ascending trekkers and pack mules on narrow switchbacks."
      ],
      leaveNoTraceRules: [
        "Do not pitch tents directly on fragile alpine bugyal grass without designated campsite permits.",
        "Use eco-friendly pit toilets at established dhabas."
      ]
    }
  },

  "kedarkantha": {
    id: "kedarkantha",
    slug: "kedarkantha",
    title: "Kedarkantha Winter Summit",
    hindiTitle: "केदारकांठा शिखर अभियान",
    region: "Govind Pashu Vihar National Park",
    state: "Uttarakhand",
    mountainRange: "Swargarohini & Bandarpoonch Range",
    baseCamp: "Sankri Village (1,950 m)",
    peakAltitudeMeters: 3810,
    peakAltitudeFormatted: "3,810 m (12,500 ft)",
    totalDistanceKm: 20,
    durationDays: 4,
    durationHours: "4 Days / 3 Nights",
    difficulty: "Moderate",
    bestSeason: "Dec–Apr (Finest Winter Snow Trek) & Oct–Nov (Autumn)",
    viewScore: "PANORAMIC",
    approxBudgetPerPerson: 4200,
    altitudeRiskIndicator: "Moderate (Acclimatization Recommended)",
    heroImage: "/images/destinations/manali/hero.jpg",
    tagline: "India's undisputed winter wonderland summit rising through magical pine clearings.",
    expeditionOverview: "Famous for pristine snow-covered pine forests, frozen alpine lakes (Juda Ka Talab), and an unforgettable 360-degree summit pyramid witnessing Swargarohini, Black Peak (Kalanag), and Bandarpoonch.",
    destinationSlug: "mussoorie",
    routes: [
      {
        id: "route-sankri-juda",
        name: "Route A: Sankri → Juda Ka Talab → Base → Summit",
        trailhead: "Sankri Village (Govind Pashu Vihar)",
        distanceKm: 20.0,
        elevationGainMeters: 1860,
        estimatedTime: "4 Days",
        difficulty: "Moderate",
        sceneryScore: "PANORAMIC",
        sceneryDescription: "Dense pine forests, frozen lake camping, and dramatic sunrise ridge.",
        crowdLevel: "Popular",
        waterPointsCount: 4,
        teaStallsCount: 3,
        technicalExposure: "Snow/Scree",
        summary: "The classic winter route ascending smoothly from Sankri through dense cedar woods to the enchanted clearing of Juda Ka Talab.",
        recommendedFor: "Anyone wanting their first alpine snow summit experience."
      },
      {
        id: "route-gaichawan-gaon",
        name: "Route B: Gaichawan Gaon Alternate Ascent",
        trailhead: "Gaichawan Gaon",
        distanceKm: 22.0,
        elevationGainMeters: 1900,
        estimatedTime: "4 Days",
        difficulty: "Moderate",
        sceneryScore: "HIGH",
        sceneryDescription: "Ancient wooden villages, quiet apple orchards, and isolated snow clearings.",
        crowdLevel: "Low",
        waterPointsCount: 2,
        teaStallsCount: 0,
        technicalExposure: "Snow/Scree",
        summary: "A peaceful alternative entering from Gaichawan Gaon through old Himalayan oak forests away from peak tourist crowds.",
        recommendedFor: "Trekkers who prefer secluded campsites."
      }
    ],
    waypoints: [
      {
        id: "wp-sankri",
        name: "Sankri Base Village",
        hindiName: "सांकरी आधार गाँव",
        elevationMeters: 1950,
        elevationFormatted: "1,950 m",
        distanceFromStartKm: 0,
        timeFromPrev: "Start",
        terrainType: "Himalayan Village & Apple Orchards",
        waterAvailable: true,
        shelterAvailable: true,
        foodAvailable: true,
        medicalHelp: true,
        latitude: 31.0772,
        longitude: 78.1814,
        isBaseCamp: true,
        fieldNotes: "Last motorable town from Dehradun. Rent heavy winter gear, crampons, and thermals.",
        imageUrl: "/images/places/mussoorie/categories/nature.webp"
      },
      {
        id: "wp-juda-talab",
        name: "Juda Ka Talab (Frozen Lake)",
        hindiName: "जुदा का तालाब",
        elevationMeters: 2775,
        elevationFormatted: "2,775 m",
        distanceFromStartKm: 4.5,
        timeFromPrev: "4 hrs",
        terrainType: "Giant Pine & Oak Clearings",
        waterAvailable: true,
        shelterAvailable: true,
        foodAvailable: true,
        medicalHelp: false,
        latitude: 31.0920,
        longitude: 78.2010,
        fieldNotes: "Legendary high-altitude lake surrounded by towering pines. Completely freezes in January.",
        imageUrl: "/images/places/universal/nature.webp"
      },
      {
        id: "wp-kk-base",
        name: "Kedarkantha Base Camp",
        hindiName: "केदारकांठा बेस कैंप",
        elevationMeters: 3430,
        elevationFormatted: "3,430 m",
        distanceFromStartKm: 8.5,
        timeFromPrev: "3 hrs",
        terrainType: "Open Snowfields & Snow Ridges",
        waterAvailable: true,
        shelterAvailable: true,
        foodAvailable: true,
        medicalHelp: false,
        latitude: 31.0250,
        longitude: 78.2250,
        fieldNotes: "Camp under the open Milky Way. 3:00 AM wake up call for sunrise summit push.",
        imageUrl: "/images/destinations/manali/hero.jpg"
      },
      {
        id: "wp-kk-summit",
        name: "Kedarkantha Summit (Trishul Shrine)",
        hindiName: "केदारकांठा शिखर (3,810 मी)",
        elevationMeters: 3810,
        elevationFormatted: "3,810 m",
        distanceFromStartKm: 11.0,
        timeFromPrev: "3.5 hrs from Base",
        terrainType: "Steep Snow Ridge & Exposed Peak",
        waterAvailable: false,
        shelterAvailable: false,
        foodAvailable: false,
        medicalHelp: false,
        latitude: 31.0234,
        longitude: 78.2320,
        isSummit: true,
        fieldNotes: "Golden sunrise over Swargarohini 1, 2, 3, Bandarpoonch, Black Peak, and Rupin range.",
        imageUrl: "/images/destinations/manali/hero.jpg"
      }
    ],
    difficultyFactors: {
      fitnessDemand: 6,
      altitudeRisk: 6,
      terrainTechnicality: 5,
      steepnessGrade: 6,
      exposureRisk: 5,
      weatherVolatility: 7,
      explanation: [
        "Sub-zero temperatures down to -10°C at night in peak winter.",
        "Summit push involves climbing steep 45-degree snow slopes before dawn.",
        "Trekking in ankle-deep snow requires 30% more energy than dry terrain."
      ]
    },
    gearChecklist: [
      {
        id: "gear-kk-boots",
        name: "Waterproof Winter Hiking Boots",
        category: "footwear",
        priority: "ESSENTIAL",
        studentAlternative: "Sturdy boots with waterproofing wax + double woollen socks",
        buyApproxCost: 3500,
        rentApproxCostPerDay: 200,
        canBorrow: true,
        canSkip: false,
        packWeightGrams: 1100
      },
      {
        id: "gear-gaiters",
        name: "Waterproof Gaiters",
        category: "hardware",
        priority: "ESSENTIAL",
        studentAlternative: "Rent at Sankri base for ₹50/day",
        buyApproxCost: 800,
        rentApproxCostPerDay: 50,
        canBorrow: true,
        canSkip: false,
        packWeightGrams: 200
      },
      {
        id: "gear-down-jacket",
        name: "-10°C Rated Feather Down Parka",
        category: "clothing",
        priority: "ESSENTIAL",
        studentAlternative: "3-layer system: Thermal Inner + Heavy Fleece + Windcheater",
        buyApproxCost: 4500,
        rentApproxCostPerDay: 180,
        canBorrow: true,
        canSkip: false,
        packWeightGrams: 650
      }
    ],
    budget: {
      baseTransportCost: 750, // Dehradun to Sankri shared Sumo
      foodPerDayCost: 500,
      campStayCostPerNight: 500,
      guideOptionalCostPerDay: 1200,
      permitCost: 200,
      gearRentalEstimate: 450,
      emergencyBuffer: 600,
      studentHacks: [
        "Direct HRTC bus from Dehradun Railway Station to Sankri leaves at 5:30 AM (₹350).",
        "Form a group of 4 to split a shared local mountain guide (₹1,200/day total = ₹300/person)."
      ]
    },
    fieldIntelligence: {
      idealSeasonMonths: "December to April for snow; October & November for clear autumn views.",
      winterAccess: "Accessible throughout winter. Sankri road occasionally blocked for a few hours after heavy snowfall.",
      monsoonRisk: "Landslides along the Mussoorie-Purola-Mori corridor. Avoid July and August.",
      mobileNetwork: "BSNL has weak signal in Sankri. No connectivity at Juda Ka Talab or Summit.",
      nearestHospital: "Primary Health Centre (PHC) Mori (22 km) / CHC Purola (55 km)",
      nearestAtm: "Mori / Purola. Carry all cash from Dehradun.",
      lastMotorablePoint: "Sankri Village",
      permitsRequired: "Govind Pashu Vihar National Park entry permit (issued at Netwar checkpost).",
      localGuideRule: "Mandatory forest guide rule in national park area.",
      trailEtiquette: [
        "Do not walk on frozen Juda Ka Talab surface if ice is thin.",
        "Strictly carry back all plastic wrappers, wet wipes, and battery cells."
      ],
      leaveNoTraceRules: [
        "Do not burn plastic or trash in campfires.",
        "Keep 100 meters away from water streams when attending to nature."
      ]
    }
  },

  "triund-snowline": {
    id: "triund-snowline",
    slug: "triund-snowline",
    title: "Triund & Snowline Ridge",
    hindiTitle: "त्रियुंड व स्नोलाइन कगार",
    region: "Dhauladhar Himalayas",
    state: "Himachal Pradesh",
    mountainRange: "Dhauladhar Range (White Ranges)",
    baseCamp: "McLeod Ganj / Dharamkot (1,850 m)",
    peakAltitudeMeters: 3200,
    peakAltitudeFormatted: "3,200 m (10,498 ft)",
    totalDistanceKm: 14,
    durationDays: 1,
    durationHours: "5 – 7 Hours round trip",
    difficulty: "Moderate",
    bestSeason: "March to June & September to December",
    viewScore: "HIGH",
    approxBudgetPerPerson: 1200,
    altitudeRiskIndicator: "Low",
    heroImage: "/images/destinations/dharamshala/hero.jpg",
    tagline: "The crown jewel of Dharamshala gazing right into the colossal Dhauladhar wall.",
    expeditionOverview: "A legendary ridge day-trek climbing from the bohemian cedar forests of Dharamkot past Magic View Cafe to the panoramic Triund ridge, with an optional push to the Snowline Cafe overlooking the Moon Peak.",
    destinationSlug: "dharamshala",
    routes: [
      {
        id: "route-triund-gallu",
        name: "Route A: Gallu Devi Temple → Triund Ridge",
        trailhead: "Gallu Devi Temple (Dharamkot)",
        distanceKm: 7.0,
        elevationGainMeters: 980,
        estimatedTime: "3 – 4 hrs ascent",
        difficulty: "Moderate",
        sceneryScore: "HIGH",
        sceneryDescription: "Towering granite Dhauladhar walls on one side, shimmering Kangra Valley on the other.",
        crowdLevel: "Popular",
        waterPointsCount: 4,
        teaStallsCount: 5,
        technicalExposure: "None",
        summary: "The classic day-trail with well-maintained paths and plenty of historic mountain chai stops.",
        recommendedFor: "Beginners, weekend travelers from Delhi/Chandigarh, and mountain photographers."
      },
      {
        id: "route-triund-bhagsu",
        name: "Route B: Bhagsu Waterfall Steep Scramble",
        trailhead: "Bhagsu Nag Village",
        distanceKm: 6.0,
        elevationGainMeters: 1050,
        estimatedTime: "3.5 hrs ascent",
        difficulty: "Challenging",
        sceneryScore: "HIGH",
        sceneryDescription: "Steep waterfall gorge climbing directly onto the rocky ridge.",
        crowdLevel: "Low",
        waterPointsCount: 1,
        teaStallsCount: 1,
        technicalExposure: "Mild Scramble",
        summary: "A steep, direct scramble avoiding the Gallu roadhead, cutting straight through rocky goat trails.",
        recommendedFor: "Experienced hikers looking for a solid cardio climb."
      }
    ],
    waypoints: [
      {
        id: "wp-gallu",
        name: "Gallu Devi Temple Trailhead",
        hindiName: "गल्लू देवी मंदिर",
        elevationMeters: 2100,
        elevationFormatted: "2,100 m",
        distanceFromStartKm: 0,
        timeFromPrev: "Start",
        terrainType: "Oak & Rhododendron Forest",
        waterAvailable: true,
        shelterAvailable: true,
        foodAvailable: true,
        medicalHelp: true,
        latitude: 32.2512,
        longitude: 76.3275,
        isBaseCamp: true,
        fieldNotes: "Forest police registration post. Show ID card and declare plastic bottles.",
        imageUrl: "/images/places/dharamshala/categories/nature.webp"
      },
      {
        id: "wp-magic-view",
        name: "Magic View Cafe (Est. 1984)",
        hindiName: "मैजिक व्यू कैफे",
        elevationMeters: 2500,
        elevationFormatted: "2,500 m",
        distanceFromStartKm: 3.5,
        timeFromPrev: "1.5 hrs",
        terrainType: "Rocky Forest Trail",
        waterAvailable: true,
        shelterAvailable: true,
        foodAvailable: true,
        medicalHelp: false,
        latitude: 32.2570,
        longitude: 76.3350,
        fieldNotes: "One of the oldest chai stalls on the trail. Superb tea with Kangra valley below.",
        imageUrl: "/images/places/dharamshala/categories/cafe.webp"
      },
      {
        id: "wp-triund-ridge",
        name: "Triund Ridge (22 Curves End)",
        hindiName: "त्रियुंड रिज टॉप",
        elevationMeters: 2850,
        elevationFormatted: "2,850 m",
        distanceFromStartKm: 6.5,
        timeFromPrev: "1.5 hrs",
        terrainType: "Alpine Meadow & Granite Boulders",
        waterAvailable: true,
        shelterAvailable: true,
        foodAvailable: true,
        medicalHelp: false,
        latitude: 32.2612,
        longitude: 76.3533,
        fieldNotes: "Dramatic edge standing beneath the vertical Dhauladhar cliff face.",
        imageUrl: "/images/destinations/dharamshala/hero.jpg"
      },
      {
        id: "wp-snowline",
        name: "Snowline Cafe / Laka Glacier Base",
        hindiName: "स्नोलाइन कैफे",
        elevationMeters: 3200,
        elevationFormatted: "3,200 m",
        distanceFromStartKm: 9.0,
        timeFromPrev: "1.5 hrs beyond Triund",
        terrainType: "Alpine Scree & Snow Patches",
        waterAvailable: true,
        shelterAvailable: true,
        foodAvailable: true,
        medicalHelp: false,
        latitude: 32.2740,
        longitude: 76.3620,
        isSummit: true,
        fieldNotes: "Glacial gateway toward Indrahar Pass. Far fewer crowds and pristine silence.",
        imageUrl: "/images/destinations/dharamshala/hero.jpg"
      }
    ],
    difficultyFactors: {
      fitnessDemand: 5,
      altitudeRisk: 3,
      terrainTechnicality: 3,
      steepnessGrade: 6,
      exposureRisk: 3,
      weatherVolatility: 6,
      explanation: [
        "The infamous '22 Curves' (बाइस मोड़) is a steep 45-minute switchback section.",
        "Sudden mountain squalls and thick fog can reduce visibility within 15 minutes.",
        "Easily achievable in a single day for anyone with baseline active fitness."
      ]
    },
    gearChecklist: [
      {
        id: "gear-tr-shoes",
        name: "Grippy Trail Running or Hiking Shoes",
        category: "footwear",
        priority: "ESSENTIAL",
        studentAlternative: "Good sport sneakers with intact rubber tread",
        buyApproxCost: 2200,
        rentApproxCostPerDay: 100,
        canBorrow: true,
        canSkip: false,
        packWeightGrams: 800
      },
      {
        id: "gear-tr-wind",
        name: "Lightweight Windbreaker",
        category: "clothing",
        priority: "ESSENTIAL",
        studentAlternative: "Zip-up hoodie or track jacket",
        buyApproxCost: 1200,
        rentApproxCostPerDay: 60,
        canBorrow: true,
        canSkip: false,
        packWeightGrams: 280
      }
    ],
    budget: {
      baseTransportCost: 150, // Shared cab or walking from Dharamkot to Gallu
      foodPerDayCost: 400,
      campStayCostPerNight: 500,
      guideOptionalCostPerDay: 800,
      permitCost: 0,
      gearRentalEstimate: 100,
      emergencyBuffer: 300,
      studentHacks: [
        "Walk from Dharamkot main chowk to Gallu (30 min warm up) instead of paying ₹400 taxi fare.",
        "Start by 7:00 AM to complete round trip in day light and save overnight camping costs."
      ]
    },
    fieldIntelligence: {
      idealSeasonMonths: "March to June & September to December. Stunning sunsets across Kangra.",
      winterAccess: "Snow from late December to February. Snowline Cafe accessible with trekking poles.",
      monsoonRisk: "Heavy rain in July–August. Trail can become a muddy stream; check weather forecast.",
      mobileNetwork: "Airtel and Jio work consistently along most of the ridge.",
      nearestHospital: "Zonal Hospital Dharamshala (12 km)",
      nearestAtm: "McLeod Ganj Main Square. Carry cash for chai stalls.",
      lastMotorablePoint: "Gallu Devi Temple",
      permitsRequired: "Free forest entry registration at Gallu checkpost.",
      localGuideRule: "Not mandatory. Trail is very well marked.",
      trailEtiquette: [
        "Strict ban on loud bluetooth speakers on the ridge.",
        "Plastic security deposit collected at Gallu checkpost and refunded when you bring waste down."
      ],
      leaveNoTraceRules: [
        "No open bonfires on the grassy ridge.",
        "Deposit plastic waste in designated forest bins."
      ]
    }
  },

  "kheerganga": {
    id: "kheerganga",
    slug: "kheerganga",
    title: "Kheerganga Natural Hot Springs Trail",
    hindiTitle: "खीरगंगा गर्म जलधारा पदयात्रा",
    region: "Parvati Valley",
    state: "Himachal Pradesh",
    mountainRange: "Pir Panjal & Parvati Range",
    baseCamp: "Barshaini Village (2,195 m)",
    peakAltitudeMeters: 2960,
    peakAltitudeFormatted: "2,960 m (9,711 ft)",
    totalDistanceKm: 24,
    durationDays: 2,
    durationHours: "5 – 6 Hours one-way",
    difficulty: "Moderate",
    bestSeason: "April to June & September to November",
    viewScore: "HIGH",
    approxBudgetPerPerson: 1600,
    altitudeRiskIndicator: "Low",
    heroImage: "/images/destinations/kasol/hero.jpg",
    tagline: "Hike through mystical deodar forests to soak in sacred natural hot sulphur springs.",
    expeditionOverview: "A legendary Parvati Valley backpacker trail originating at the Barshaini river bridge, climbing past traditional Himachali hamlets (Nakthan and Kalga) and roaring waterfalls to the high meadow of Kheerganga.",
    destinationSlug: "kasol",
    routes: [
      {
        id: "route-nakthan",
        name: "Route A: Barshaini via Nakthan Village (Classic Trail)",
        trailhead: "Barshaini Dam Bridge",
        distanceKm: 12.0,
        elevationGainMeters: 765,
        estimatedTime: "5 – 6 hrs ascent",
        difficulty: "Moderate",
        sceneryScore: "HIGH",
        sceneryDescription: "Riverside gorges, apple orchards, traditional wood-and-stone houses, and pine forests.",
        crowdLevel: "Popular",
        waterPointsCount: 5,
        teaStallsCount: 6,
        technicalExposure: "None",
        summary: "The main trail following the right bank of the Parvati River through Nakthan village and Rudranag waterfall.",
        recommendedFor: "First-time backpackers wanting scenic cafes and reliable paths."
      },
      {
        id: "route-kalga",
        name: "Route B: Barshaini via Kalga Village (Forest Route)",
        trailhead: "Barshaini Dam Steps → Kalga",
        distanceKm: 13.0,
        elevationGainMeters: 800,
        estimatedTime: "5.5 – 6.5 hrs ascent",
        difficulty: "Moderate",
        sceneryScore: "HIGH",
        sceneryDescription: "Enchanted apple tree clearings, dense mossy deodar canopies, and fewer crowds.",
        crowdLevel: "Low",
        waterPointsCount: 3,
        teaStallsCount: 3,
        technicalExposure: "None",
        summary: "Ascends directly into the fairy-tale village of Kalga and merges with the main trail before the final uphill push.",
        recommendedFor: "Trekkers staying overnight in Kalga."
      }
    ],
    waypoints: [
      {
        id: "wp-barshaini",
        name: "Barshaini Trailhead",
        hindiName: "बरशैणी आधार",
        elevationMeters: 2195,
        elevationFormatted: "2,195 m",
        distanceFromStartKm: 0,
        timeFromPrev: "Start",
        terrainType: "Hydro Dam & Roadhead",
        waterAvailable: true,
        shelterAvailable: true,
        foodAvailable: true,
        medicalHelp: true,
        latitude: 32.0010,
        longitude: 77.4420,
        isBaseCamp: true,
        fieldNotes: "Last motorable point from Kasol/Manikaran. Bus stop and local shared taxis.",
        imageUrl: "/images/destinations/kasol/hero.jpg"
      },
      {
        id: "wp-rudranag",
        name: "Rudranag Waterfall & Temple",
        hindiName: "रुद्रनाग जलप्रपात",
        elevationMeters: 2500,
        elevationFormatted: "2,500 m",
        distanceFromStartKm: 6.0,
        timeFromPrev: "2.5 hrs",
        terrainType: "Pine Woods & Serpent Springs",
        waterAvailable: true,
        shelterAvailable: true,
        foodAvailable: true,
        medicalHelp: false,
        latitude: 31.9890,
        longitude: 77.4720,
        fieldNotes: "Sacred serpent waterfall. Perfect resting spot for fresh mountain water and lemon ginger tea.",
        imageUrl: "/images/places/kasol/categories/waterfall.webp"
      },
      {
        id: "wp-kheerganga-top",
        name: "Kheerganga Hot Spring Kund",
        hindiName: "खीरगंगा गर्म कुंड",
        elevationMeters: 2960,
        elevationFormatted: "2,960 m",
        distanceFromStartKm: 12.0,
        timeFromPrev: "3 hrs from Rudranag",
        terrainType: "Open Alpine Meadow",
        waterAvailable: true,
        shelterAvailable: true,
        foodAvailable: true,
        medicalHelp: false,
        latitude: 31.9810,
        longitude: 77.5110,
        isSummit: true,
        fieldNotes: "Natural hot sulphur pool overlooking snow-dusted peaks. Separate bathing sections for men and women.",
        imageUrl: "/images/destinations/kasol/hero.jpg"
      }
    ],
    difficultyFactors: {
      fitnessDemand: 5,
      altitudeRisk: 2,
      terrainTechnicality: 3,
      steepnessGrade: 5,
      exposureRisk: 2,
      weatherVolatility: 5,
      explanation: [
        "Gentle slope for first 6 km, followed by steep uphill from Rudranag bridge to meadow.",
        "Trail can be muddy and slippery during pre-monsoon or late autumn rains."
      ]
    },
    gearChecklist: [
      {
        id: "gear-kg-shoes",
        name: "Hiking Shoes or Sturdy Sneakers with Rubber Grip",
        category: "footwear",
        priority: "ESSENTIAL",
        studentAlternative: "Good traction sports shoes",
        buyApproxCost: 2000,
        rentApproxCostPerDay: 100,
        canBorrow: true,
        canSkip: false,
        packWeightGrams: 850
      },
      {
        id: "gear-kg-towel",
        name: "Quick-dry Microfibre Towel & Swimwear",
        category: "comfort",
        priority: "ESSENTIAL",
        studentAlternative: "Light cotton towel for hot spring bath",
        buyApproxCost: 400,
        rentApproxCostPerDay: 0,
        canBorrow: true,
        canSkip: false,
        packWeightGrams: 150
      }
    ],
    budget: {
      baseTransportCost: 100, // HRTC bus Kasol to Barshaini (₹50 each way)
      foodPerDayCost: 450,
      campStayCostPerNight: 500, // Dorm bed or tent at top
      guideOptionalCostPerDay: 0,
      permitCost: 0,
      gearRentalEstimate: 0,
      emergencyBuffer: 300,
      studentHacks: [
        "Take the local green HRTC bus from Kasol market to Barshaini (₹50) instead of a ₹1,200 cab.",
        "Book shared wooden dorm tents at the meadow (₹300–400/bed) to keep trip under ₹1,500 total."
      ]
    },
    fieldIntelligence: {
      idealSeasonMonths: "April to June (Spring green) & September to November (Crisp autumn air).",
      winterAccess: "Meadow covered in snow from Jan–Feb; hot springs remain naturally warm.",
      monsoonRisk: "Landslides possible on the Kasol-Barshaini road in July–August.",
      mobileNetwork: "BSNL has weak coverage; Jio/Airtel patchy around Rudranag.",
      nearestHospital: "Community Health Centre Jari (30 km) / Kullu District Hospital (50 km)",
      nearestAtm: "Kasol / Manikaran. Zero ATMs in Barshaini or Kheerganga.",
      lastMotorablePoint: "Barshaini Dam",
      permitsRequired: "None required.",
      localGuideRule: "Self-navigable trail.",
      trailEtiquette: [
        "Respect the sacred natural spring (Parvati Kund). Use soap only outside the natural kund.",
        "Strictly no alcohol or loud parties near the temple area."
      ],
      leaveNoTraceRules: [
        "Carry all plastic packaging and bottles back down to Barshaini."
      ]
    }
  },

  "valley-of-flowers": {
    id: "valley-of-flowers",
    slug: "valley-of-flowers",
    title: "Valley of Flowers & Hemkund Sahib",
    hindiTitle: "फूलों की घाटी व हेमकुंड साहिब",
    region: "Nanda Devi Biosphere Reserve",
    state: "Uttarakhand",
    mountainRange: "Zanskar & Great Himalayan Range",
    baseCamp: "Govindghat / Ghangaria (3,048 m)",
    peakAltitudeMeters: 4329,
    peakAltitudeFormatted: "3,858 m (Valley) / 4,329 m (Hemkund)",
    totalDistanceKm: 34,
    durationDays: 4,
    durationHours: "4 Days / 3 Nights",
    difficulty: "Moderate",
    bestSeason: "July to September (Floral Monsoon Bloom)",
    viewScore: "PANORAMIC",
    approxBudgetPerPerson: 3800,
    altitudeRiskIndicator: "Moderate (Acclimatization Recommended)",
    heroImage: "/images/places/universal/nature.webp",
    tagline: "UNESCO World Heritage wonderland blooming with over 500 wild alpine flower species.",
    expeditionOverview: "A world-renowned botanical and spiritual trail in Chamoli Uttarakhand. Trekkers traverse from the Alaknanda river at Govindghat to Ghangaria, opening into the vibrant floral carpet of the Valley of Flowers and the crystal glacial waters of Hemkund Sahib.",
    destinationSlug: "tungnath-chandrashila",
    routes: [
      {
        id: "route-govindghat-vof",
        name: "Route A: Govindghat → Ghangaria → Valley Core",
        trailhead: "Pulna Village (Govindghat)",
        distanceKm: 14.0,
        elevationGainMeters: 1800,
        estimatedTime: "2 Days to Base",
        difficulty: "Moderate",
        sceneryScore: "PANORAMIC",
        sceneryDescription: "Cascading Pushpawati river, blooming orchids, blue poppies, and snow cliffs.",
        crowdLevel: "Moderate",
        waterPointsCount: 6,
        teaStallsCount: 8,
        technicalExposure: "None",
        summary: "The official UNESCO trail well-paved up to Ghangaria, followed by natural earthen paths inside the valley.",
        recommendedFor: "Nature lovers, botanists, and family backpackers."
      }
    ],
    waypoints: [
      {
        id: "wp-govindghat",
        name: "Govindghat / Pulna Trailhead",
        hindiName: "गोविंदघाट पुलना",
        elevationMeters: 1920,
        elevationFormatted: "1,920 m",
        distanceFromStartKm: 0,
        timeFromPrev: "Start",
        terrainType: "Riverbed & Paved Stone",
        waterAvailable: true,
        shelterAvailable: true,
        foodAvailable: true,
        medicalHelp: true,
        latitude: 30.6240,
        longitude: 79.5630,
        isBaseCamp: true,
        fieldNotes: "Helipad and shared taxi point from Joshimath/Rishikesh.",
        imageUrl: "/images/places/universal/nature.webp"
      },
      {
        id: "wp-ghangaria",
        name: "Ghangaria Base Village",
        hindiName: "घांघरिया बेस",
        elevationMeters: 3048,
        elevationFormatted: "3,048 m",
        distanceFromStartKm: 10.0,
        timeFromPrev: "5 hrs",
        terrainType: "Dense Birch & Pine Forest",
        waterAvailable: true,
        shelterAvailable: true,
        foodAvailable: true,
        medicalHelp: true,
        latitude: 30.7010,
        longitude: 79.5850,
        fieldNotes: "Last settlement where overnight stay is permitted. Valley opens 3 km ahead.",
        imageUrl: "/images/places/universal/nature.webp"
      },
      {
        id: "wp-vof-core",
        name: "Valley of Flowers UNESCO Core",
        hindiName: "फूलों की घाटी",
        elevationMeters: 3858,
        elevationFormatted: "3,858 m",
        distanceFromStartKm: 14.0,
        timeFromPrev: "2.5 hrs from Ghangaria",
        terrainType: "Alpine Floral River Basin",
        waterAvailable: true,
        shelterAvailable: false,
        foodAvailable: false,
        medicalHelp: false,
        latitude: 30.7280,
        longitude: 79.6050,
        isSummit: true,
        fieldNotes: "Home to the rare Blue Poppy, Brahma Kamal, and snow leopards. Must exit before 5 PM.",
        imageUrl: "/images/places/universal/nature.webp"
      }
    ],
    difficultyFactors: {
      fitnessDemand: 6,
      altitudeRisk: 6,
      terrainTechnicality: 3,
      steepnessGrade: 6,
      exposureRisk: 3,
      weatherVolatility: 8,
      explanation: [
        "Monsoon trek with constant rain, slippery stone slabs, and high humidity.",
        "Hemkund Sahib day extension is very steep (+1,280m gain in 6 km)."
      ]
    },
    gearChecklist: [
      {
        id: "gear-vof-poncho",
        name: "Heavy-duty Waterproof Rain Poncho & Rain Pants",
        category: "clothing",
        priority: "ESSENTIAL",
        studentAlternative: "Good quality thick vinyl rain suit",
        buyApproxCost: 900,
        rentApproxCostPerDay: 50,
        canBorrow: true,
        canSkip: false,
        packWeightGrams: 350
      },
      {
        id: "gear-vof-boots",
        name: "Waterproof Trekking Shoes with Ankle Support",
        category: "footwear",
        priority: "ESSENTIAL",
        studentAlternative: "Trekking boots coated with water repellent spray",
        buyApproxCost: 3200,
        rentApproxCostPerDay: 150,
        canBorrow: true,
        canSkip: false,
        packWeightGrams: 900
      }
    ],
    budget: {
      baseTransportCost: 900, // Rishikesh to Govindghat bus/sumo
      foodPerDayCost: 500,
      campStayCostPerNight: 600, // Ghangaria lodge/gurudwara
      guideOptionalCostPerDay: 1000,
      permitCost: 200, // Forest permit
      gearRentalEstimate: 200,
      emergencyBuffer: 600,
      studentHacks: [
        "Stay at Ghangaria Gurudwara Sahib for affordable stay and free community langar meals.",
        "Take the direct Uttarakhand Transport bus from Haridwar/Rishikesh to Joshimath (₹450)."
      ]
    },
    fieldIntelligence: {
      idealSeasonMonths: "July to early September. Mid-August offers the dense floral peak.",
      winterAccess: "Strictly closed from November to May due to heavy snow and avalanche risk.",
      monsoonRisk: "Active monsoon zone. Monitor Chamoli landslide advisories.",
      mobileNetwork: "BSNL has reliable coverage in Ghangaria; Jio/Airtel limited.",
      nearestHospital: "Army Medical Post Ghangaria / Community Hospital Joshimath (25 km)",
      nearestAtm: "Joshimath (25 km). No ATMs in Govindghat or Ghangaria.",
      lastMotorablePoint: "Pulna Village",
      permitsRequired: "Forest Department entry permit (₹200 for 3 days). Night stay inside Valley is illegal.",
      localGuideRule: "Recommended for plant and rare flower identification.",
      trailEtiquette: [
        "Do not pluck any flowers or medicinal plants. Heavy legal penalties apply.",
        "Trek on established pathways to protect fragile wildflower root systems."
      ],
      leaveNoTraceRules: [
        "Zero single-use plastic zone. Strictly pack out all garbage."
      ]
    }
  },

  "rajmachi-kondane": {
    id: "rajmachi-kondane",
    slug: "rajmachi-kondane",
    title: "Rajmachi Fort & Kondane Caves",
    hindiTitle: "राजमाची किला व कोंडाणे गुफाएँ",
    region: "Sahyadri Western Ghats",
    state: "Maharashtra",
    mountainRange: "Sahyadri Mountain Range",
    baseCamp: "Udhewadi / Karjat (Kondivade)",
    peakAltitudeMeters: 830,
    peakAltitudeFormatted: "830 m (2,723 ft)",
    totalDistanceKm: 16,
    durationDays: 1,
    durationHours: "4 – 6 Hours",
    difficulty: "Easy",
    bestSeason: "June to October (Monsoon Waterfalls) & Nov–Feb (Cool Greens)",
    viewScore: "HIGH",
    approxBudgetPerPerson: 800,
    altitudeRiskIndicator: "Low",
    heroImage: "/images/places/universal/heritage.webp",
    tagline: "Twin Maratha forts overlooking misty Sahyadri valleys and 1st-century Buddhist caves.",
    expeditionOverview: "A premier Sahyadri adventure linking the ancient Buddhist rock-cut caves of Kondane with the historical twin citadels of Shrivardhan and Manaranjan at Rajmachi, surrounded by hundreds of monsoon waterfalls and fireflies.",
    destinationSlug: "goa",
    routes: [
      {
        id: "route-karjat-scramble",
        name: "Route A: Kondivade (Karjat) via Kondane Caves Scramble",
        trailhead: "Kondivade Village (Karjat)",
        distanceKm: 8.0,
        elevationGainMeters: 650,
        estimatedTime: "3.5 hrs ascent",
        difficulty: "Moderate",
        sceneryScore: "HIGH",
        sceneryDescription: "Lush jungle trails, roaring canyon waterfalls, and ancient rock caves.",
        crowdLevel: "Moderate",
        waterPointsCount: 4,
        teaStallsCount: 3,
        technicalExposure: "Mild Scramble",
        summary: "A thrilling monsoon hike climbing directly up the Sahyadri escarpment from the Karjat valley.",
        recommendedFor: "Mumbai & Pune trekkers looking for a raw Western Ghats jungle climb."
      },
      {
        id: "route-lonavala-plateau",
        name: "Route B: Lonavala Plateau Trail (Gradual Walk)",
        trailhead: "Della Adventure / Tungarli Lake (Lonavala)",
        distanceKm: 15.0,
        elevationGainMeters: 250,
        estimatedTime: "4 hrs walk",
        difficulty: "Easy",
        sceneryScore: "MODERATE",
        sceneryDescription: "Broad plateau mud roads through dense forest with gentle gradient.",
        crowdLevel: "Popular",
        waterPointsCount: 3,
        teaStallsCount: 4,
        technicalExposure: "None",
        summary: "A gentle flat trail suitable for beginner walkers and off-road bikes.",
        recommendedFor: "Beginners, night trek groups, and trail runners."
      }
    ],
    waypoints: [
      {
        id: "wp-kondivade",
        name: "Kondivade Village Trailhead",
        hindiName: "कोंडीवडे गाँव",
        elevationMeters: 180,
        elevationFormatted: "180 m",
        distanceFromStartKm: 0,
        timeFromPrev: "Start",
        terrainType: "Rural Paddy Fields & Forest",
        waterAvailable: true,
        shelterAvailable: true,
        foodAvailable: true,
        medicalHelp: true,
        latitude: 18.8160,
        longitude: 73.3850,
        isBaseCamp: true,
        fieldNotes: "Auto-rickshaw stand from Karjat Railway Station (14 km).",
        imageUrl: "/images/places/universal/nature.webp"
      },
      {
        id: "wp-kondane-caves",
        name: "Kondane Buddhist Caves & Waterfall",
        hindiName: "कोंडाणे बौद्ध गुफाएँ",
        elevationMeters: 350,
        elevationFormatted: "350 m",
        distanceFromStartKm: 2.5,
        timeFromPrev: "1 hr",
        terrainType: "Rock Steps & Waterfall Pool",
        waterAvailable: true,
        shelterAvailable: true,
        foodAvailable: true,
        medicalHelp: false,
        latitude: 18.8190,
        longitude: 73.3990,
        fieldNotes: "16 rock-cut stupas and chaitya dating back to 1st century BCE.",
        imageUrl: "/images/places/universal/heritage.webp"
      },
      {
        id: "wp-udhewadi",
        name: "Udhewadi Base Village",
        hindiName: "उधेवाडी आधार गाँव",
        elevationMeters: 750,
        elevationFormatted: "750 m",
        distanceFromStartKm: 6.5,
        timeFromPrev: "2 hrs from Caves",
        terrainType: "Plateau Clearing & Rustic Village",
        waterAvailable: true,
        shelterAvailable: true,
        foodAvailable: true,
        medicalHelp: false,
        latitude: 18.8280,
        longitude: 73.4020,
        fieldNotes: "Traditional Maharashtrian village serving hot pitla bhakri and kanda bhaji.",
        imageUrl: "/images/places/universal/nature.webp"
      },
      {
        id: "wp-shrivardhan-fort",
        name: "Shrivardhan Fort Citadel",
        hindiName: "श्रीवर्धन बालेकिल्ला (830 मी)",
        elevationMeters: 830,
        elevationFormatted: "830 m",
        distanceFromStartKm: 8.0,
        timeFromPrev: "45 mins from Udhewadi",
        terrainType: "Stone Bastions & Rock Cut Steps",
        waterAvailable: true,
        shelterAvailable: false,
        foodAvailable: false,
        medicalHelp: false,
        latitude: 18.8310,
        longitude: 73.4040,
        isSummit: true,
        fieldNotes: "Historic watchtower overlooking Ulhas valley and Kataldhar waterfall canyon.",
        imageUrl: "/images/places/universal/heritage.webp"
      }
    ],
    difficultyFactors: {
      fitnessDemand: 4,
      altitudeRisk: 1,
      terrainTechnicality: 3,
      steepnessGrade: 5,
      exposureRisk: 3,
      weatherVolatility: 5,
      explanation: [
        "Low altitude trek with zero mountain sickness risk.",
        "Monsoon mud and wet rock steps require proper grip footwear to prevent slipping."
      ]
    },
    gearChecklist: [
      {
        id: "gear-raj-shoes",
        name: "Running Shoes with Good Rubber Tread",
        category: "footwear",
        priority: "ESSENTIAL",
        studentAlternative: "Any sports shoes with grip (avoid flat canvas sneakers)",
        buyApproxCost: 1500,
        rentApproxCostPerDay: 0,
        canBorrow: true,
        canSkip: false,
        packWeightGrams: 750
      },
      {
        id: "gear-raj-rain",
        name: "Light Rain Jacket / Windcheater",
        category: "clothing",
        priority: "ESSENTIAL",
        studentAlternative: "Compact umbrella or ₹50 disposable raincoat",
        buyApproxCost: 700,
        rentApproxCostPerDay: 0,
        canBorrow: true,
        canSkip: false,
        packWeightGrams: 200
      }
    ],
    budget: {
      baseTransportCost: 120, // Local train Mumbai/Pune to Karjat + shared auto
      foodPerDayCost: 300, // Pitla bhakri at village
      campStayCostPerNight: 350, // Village homestay or tent
      guideOptionalCostPerDay: 500,
      permitCost: 50,
      gearRentalEstimate: 0,
      emergencyBuffer: 200,
      studentHacks: [
        "Take the Mumbai CST to Karjat local train (₹30 ticket) or Pune to Lonavala local (₹20).",
        "Eat authentic rustic village lunch in Udhewadi (₹120–150 unlimited Thali) supporting local villagers."
      ]
    },
    fieldIntelligence: {
      idealSeasonMonths: "June to October for waterfalls; May to June for magical pre-monsoon firefly festival.",
      winterAccess: "Clear dry skies with pleasant night temperatures.",
      monsoonRisk: "Strong waterfall currents near Kondane. Do not cross swollen river torrents without caution.",
      mobileNetwork: "Jio and Airtel work at the fort summit; spotty in dense forest patches.",
      nearestHospital: "Karjat Sub-District Hospital (15 km) / Lonavala Municipal Hospital (16 km)",
      nearestAtm: "Karjat / Lonavala.",
      lastMotorablePoint: "Udhewadi (4x4 only) or Kondivade (paved road)",
      permitsRequired: "Local village development fee (₹50).",
      localGuideRule: "Not mandatory.",
      trailEtiquette: [
        "No littering inside the 2,000-year-old Kondane Caves.",
        "Respect village silence at Udhewadi during night treks."
      ],
      leaveNoTraceRules: [
        "Carry all empty water bottles and snack packets back to Karjat station."
      ]
    }
  },

  "hampta-pass": {
    id: "hampta-pass",
    slug: "hampta-pass",
    title: "Hampta Pass & Chandratal Crossover",
    hindiTitle: "हम्प्टा पास व चंद्रताल दर्रा अभियान",
    region: "Pir Panjal to Spiti Crossover",
    state: "Himachal Pradesh",
    mountainRange: "Pir Panjal & Zanskar Range",
    baseCamp: "Jobra (2,900 m) / Manali",
    peakAltitudeMeters: 4287,
    peakAltitudeFormatted: "4,287 m (14,065 ft)",
    totalDistanceKm: 35,
    durationDays: 5,
    durationHours: "5 Days / 4 Nights",
    difficulty: "Challenging",
    bestSeason: "Mid-June to Mid-October (Summer Crossover)",
    viewScore: "PANORAMIC",
    approxBudgetPerPerson: 5500,
    altitudeRiskIndicator: "High (AMS Risk)",
    heroImage: "/images/destinations/manali/hero.jpg",
    tagline: "The dramatic dramatic corridor from the lush green Kullu valley into the stark cold desert of Spiti.",
    expeditionOverview: "A legendary Himalayan crossover trek transitioning from lush pine forests and hanging glaciers of Jobra and Balu Ka Ghera across the 4,287m Hampta Pass to the arid, moonscape landscape of Shea Goru and the emerald waters of Chandratal.",
    destinationSlug: "manali",
    routes: [
      {
        id: "route-jobra-chhatru",
        name: "Route A: Jobra → Hampta Pass → Chhatru → Chandratal",
        trailhead: "Jobra Dam Roadhead",
        distanceKm: 35.0,
        elevationGainMeters: 1400,
        estimatedTime: "5 Days",
        difficulty: "Challenging",
        sceneryScore: "PANORAMIC",
        sceneryDescription: "Glacial river crossings, hanging ice walls, jagged Spiti peaks, and blue glacial lake.",
        crowdLevel: "Moderate",
        waterPointsCount: 6,
        teaStallsCount: 1,
        technicalExposure: "Snow/Scree",
        summary: "The full crossover traversing snow bridges, rocky boulders, and descending into the Chandra river valley.",
        recommendedFor: "Fit trekkers seeking a classic dramatic terrain shift."
      }
    ],
    waypoints: [
      {
        id: "wp-jobra",
        name: "Jobra Hydro Trailhead",
        hindiName: "जोबरा हाइड्रो आधार",
        elevationMeters: 2900,
        elevationFormatted: "2,900 m",
        distanceFromStartKm: 0,
        timeFromPrev: "Start",
        terrainType: "Pine Woods & Riverbank",
        waterAvailable: true,
        shelterAvailable: true,
        foodAvailable: true,
        medicalHelp: true,
        latitude: 32.2530,
        longitude: 77.2510,
        isBaseCamp: true,
        fieldNotes: "1-hour drive from Manali via 40 hairpin bends of the Allain Duhangan road.",
        imageUrl: "/images/places/universal/nature.webp"
      },
      {
        id: "wp-balu-ka-ghera",
        name: "Balu Ka Ghera (Sand Bed Camp)",
        hindiName: "बालू का घेरा",
        elevationMeters: 3600,
        elevationFormatted: "3,600 m",
        distanceFromStartKm: 12.0,
        timeFromPrev: "5 hrs",
        terrainType: "Flat Glacial Sand & Streams",
        waterAvailable: true,
        shelterAvailable: true,
        foodAvailable: true,
        medicalHelp: false,
        latitude: 32.2710,
        longitude: 77.3120,
        fieldNotes: "Final base before pass push. Acclimatization walk essential to prevent AMS.",
        imageUrl: "/images/places/universal/nature.webp"
      },
      {
        id: "wp-hampta-summit",
        name: "Hampta Pass Ridge",
        hindiName: "हम्प्टा पास दर्रा (4,287 मी)",
        elevationMeters: 4287,
        elevationFormatted: "4,287 m",
        distanceFromStartKm: 19.0,
        timeFromPrev: "4.5 hrs from Balu",
        terrainType: "Steep Snowfield & Scree Col",
        waterAvailable: false,
        shelterAvailable: false,
        foodAvailable: false,
        medicalHelp: false,
        latitude: 32.2850,
        longitude: 77.3620,
        isSummit: true,
        fieldNotes: "The iconic viewpoint dividing green Kullu and barren Lahaul-Spiti.",
        imageUrl: "/images/places/universal/nature.webp"
      }
    ],
    difficultyFactors: {
      fitnessDemand: 7,
      altitudeRisk: 8,
      terrainTechnicality: 6,
      steepnessGrade: 7,
      exposureRisk: 6,
      weatherVolatility: 8,
      explanation: [
        "Rapid elevation gain from 2,000m to over 4,200m in 48 hours.",
        "Frigid, knee-deep glacial stream crossings at Shea Goru.",
        "Steep loose scree descent into Lahaul."
      ]
    },
    gearChecklist: [
      {
        id: "gear-hp-crampons",
        name: "Microspikes & Trekking Poles",
        category: "hardware",
        priority: "ESSENTIAL",
        studentAlternative: "Rent in Manali for ₹100/day",
        buyApproxCost: 1600,
        rentApproxCostPerDay: 100,
        canBorrow: true,
        canSkip: false,
        packWeightGrams: 450
      },
      {
        id: "gear-hp-thermals",
        name: "Merino Wool Thermal Inners (Top + Bottom)",
        category: "clothing",
        priority: "ESSENTIAL",
        studentAlternative: "Double synthetic thermal layers",
        buyApproxCost: 1800,
        rentApproxCostPerDay: 0,
        canBorrow: true,
        canSkip: false,
        packWeightGrams: 300
      }
    ],
    budget: {
      baseTransportCost: 1200, // Manali to Jobra + Chhatru back to Manali via Atal Tunnel
      foodPerDayCost: 550,
      campStayCostPerNight: 600,
      guideOptionalCostPerDay: 1500,
      permitCost: 250,
      gearRentalEstimate: 400,
      emergencyBuffer: 800,
      studentHacks: [
        "Pool with 4-5 trekkers for the Chhatru to Manali 4x4 return cab.",
        "Buy high-calorie dry fruits and energy bars in Old Manali market."
      ]
    },
    fieldIntelligence: {
      idealSeasonMonths: "July to September (when Chandratal road is open).",
      winterAccess: "Closed November to May due to heavy avalanche snow on the pass.",
      monsoonRisk: "Heavy rain on Manali side; completely rain-shadowed once crossing into Spiti.",
      mobileNetwork: "Zero signal from Jobra until returning to Atal Tunnel south portal.",
      nearestHospital: "Civil Hospital Manali (30 km) / Keylong District Hospital",
      nearestAtm: "Manali Mall Road. Zero ATMs on trail.",
      lastMotorablePoint: "Jobra Dam",
      permitsRequired: "Forest Department entry permit.",
      localGuideRule: "Mandatory licensed mountain guide.",
      trailEtiquette: [
        "Follow strict pack-in pack-out rule. Do not dump cans or wet wipes at Shea Goru.",
        "Stay clipped into safety line during fast current river crossings."
      ],
      leaveNoTraceRules: [
        "No open fires; use multi-fuel stoves only."
      ]
    }
  },

  "nag-tibba": {
    id: "nag-tibba",
    slug: "nag-tibba",
    title: "Nag Tibba Weekend Summit",
    hindiTitle: "नाग टिब्बा शिखर (सर्प देवता कगार)",
    region: "Lesser Himalayas / Garhwal",
    state: "Uttarakhand",
    mountainRange: "Nag Tibba Range",
    baseCamp: "Pantwari Village (1,400 m)",
    peakAltitudeMeters: 3022,
    peakAltitudeFormatted: "3,022 m (9,915 ft)",
    totalDistanceKm: 16,
    durationDays: 2,
    durationHours: "Weekend (2 Days / 1 Night)",
    difficulty: "Easy",
    bestSeason: "October to April (Autumn to Snow Summit)",
    viewScore: "HIGH",
    approxBudgetPerPerson: 1400,
    altitudeRiskIndicator: "Low",
    heroImage: "/images/destinations/mussoorie/hero.jpg",
    tagline: "The highest peak in the lesser Himalayas and North India's favorite weekend summit.",
    expeditionOverview: "A rewarding 2-day trek through dense oak and rhododendron forests leading to the sacred Nag Devta temple and the 3,022m summit ridge with panoramic vistas of Bandarpoonch, Swargarohini, and Gangotri peaks.",
    destinationSlug: "mussoorie",
    routes: [
      {
        id: "route-pantwari",
        name: "Route A: Pantwari Village Classic Ascent",
        trailhead: "Pantwari Village (Mussoorie Corridor)",
        distanceKm: 8.0,
        elevationGainMeters: 1622,
        estimatedTime: "5 hrs ascent",
        difficulty: "Easy",
        sceneryScore: "HIGH",
        sceneryDescription: "Terraced mountain fields, oak woods, and high snow ridge.",
        crowdLevel: "Popular",
        waterPointsCount: 3,
        teaStallsCount: 3,
        technicalExposure: "None",
        summary: "The most popular trail climbing steadily from Pantwari village past the goat village to Nag Tibba base camp.",
        recommendedFor: "Beginners, college students, and weekenders from Delhi/NCR."
      }
    ],
    waypoints: [
      {
        id: "wp-pantwari",
        name: "Pantwari Base Trailhead",
        hindiName: "पंतवाड़ी आधार",
        elevationMeters: 1400,
        elevationFormatted: "1,400 m",
        distanceFromStartKm: 0,
        timeFromPrev: "Start",
        terrainType: "Terraced Fields & Earthen Path",
        waterAvailable: true,
        shelterAvailable: true,
        foodAvailable: true,
        medicalHelp: true,
        latitude: 30.5870,
        longitude: 78.1150,
        isBaseCamp: true,
        fieldNotes: "3-hour drive from Dehradun Railway Station via Nainbagh.",
        imageUrl: "/images/places/mussoorie/categories/nature.webp"
      },
      {
        id: "wp-nag-base",
        name: "Nag Tibba Base Camp (Khatian)",
        hindiName: "नाग टिब्बा बेस कैंप",
        elevationMeters: 2600,
        elevationFormatted: "2,600 m",
        distanceFromStartKm: 5.5,
        timeFromPrev: "3.5 hrs",
        terrainType: "Oak Meadow Clearing",
        waterAvailable: true,
        shelterAvailable: true,
        foodAvailable: true,
        medicalHelp: false,
        latitude: 30.5950,
        longitude: 78.1320,
        fieldNotes: "Popular camping spot. Bonfire and stargazing under crisp mountain sky.",
        imageUrl: "/images/places/mussoorie/categories/nature.webp"
      },
      {
        id: "wp-nag-summit",
        name: "Nag Tibba Jhandi Summit",
        hindiName: "नाग टिब्बा झंडी शिखर (3,022 मी)",
        elevationMeters: 3022,
        elevationFormatted: "3,022 m",
        distanceFromStartKm: 8.0,
        timeFromPrev: "1.5 hrs from Base",
        terrainType: "Open High Ridge & Flag Post",
        waterAvailable: false,
        shelterAvailable: false,
        foodAvailable: false,
        medicalHelp: false,
        latitude: 30.6010,
        longitude: 78.1510,
        isSummit: true,
        fieldNotes: "180-degree view of Bandarpoonch (6,316m), Kalanag, and Gangotri ranges.",
        imageUrl: "/images/destinations/mussoorie/hero.jpg"
      }
    ],
    difficultyFactors: {
      fitnessDemand: 4,
      altitudeRisk: 2,
      terrainTechnicality: 2,
      steepnessGrade: 5,
      exposureRisk: 2,
      weatherVolatility: 4,
      explanation: [
        "Short duration with moderate gradient suitable for first-time backpackers.",
        "Winter snow adds a fun, safe mountaineering element in Jan–Feb."
      ]
    },
    gearChecklist: [
      {
        id: "gear-nt-shoes",
        name: "Trekking Shoes with Good Grip",
        category: "footwear",
        priority: "ESSENTIAL",
        studentAlternative: "Any sports shoe with intact rubber tread",
        buyApproxCost: 1800,
        rentApproxCostPerDay: 80,
        canBorrow: true,
        canSkip: false,
        packWeightGrams: 800
      }
    ],
    budget: {
      baseTransportCost: 350, // Dehradun to Pantwari shared Sumo (₹150 each way)
      foodPerDayCost: 350,
      campStayCostPerNight: 400,
      guideOptionalCostPerDay: 600,
      permitCost: 0,
      gearRentalEstimate: 100,
      emergencyBuffer: 250,
      studentHacks: [
        "Take the 6:00 AM shared Jeep from Dehradun Hill Bus Station to Nainbagh (₹120), then local auto to Pantwari (₹30).",
        "Total weekend cost can easily be kept under ₹1,500 all inclusive."
      ]
    },
    fieldIntelligence: {
      idealSeasonMonths: "October to April. Jan–Feb for snow walking.",
      winterAccess: "Trail open year round.",
      monsoonRisk: "Moderate rain in July–August. Trail can be slick.",
      mobileNetwork: "Airtel and Jio work at the summit ridge; spotty at base.",
      nearestHospital: "Primary Health Centre Nainbagh (12 km) / Dehradun Hospital (80 km)",
      nearestAtm: "Nainbagh. Carry cash from Dehradun.",
      lastMotorablePoint: "Pantwari Village",
      permitsRequired: "None.",
      localGuideRule: "Self-navigable.",
      trailEtiquette: ["Do not litter around Nag Devta temple."],
      leaveNoTraceRules: ["Pack out all trash."]
    }
  },

  "brahmatal": {
    id: "brahmatal",
    slug: "brahmatal",
    title: "Brahmatal Alpine Lake & Trishul Summit",
    hindiTitle: "ब्रह्मताल अल्पाइन झील व त्रिशूल दर्शन",
    region: "Garhwal Himalayas",
    state: "Uttarakhand",
    mountainRange: "Trishul & Nanda Ghunti Massif",
    baseCamp: "Lohajung Village (2,300 m)",
    peakAltitudeMeters: 3734,
    peakAltitudeFormatted: "3,734 m (12,250 ft)",
    totalDistanceKm: 22,
    durationDays: 4,
    durationHours: "4 Days / 3 Nights",
    difficulty: "Moderate",
    bestSeason: "December to March (Winter Snow & Frozen Lake)",
    viewScore: "PANORAMIC",
    approxBudgetPerPerson: 4500,
    altitudeRiskIndicator: "Moderate (Acclimatization Recommended)",
    heroImage: "/images/destinations/rishikesh/hero.jpg",
    tagline: "Gaze right into the towering snow face of Mt. Trishul and Mt. Nanda Ghunti across frozen lake beds.",
    expeditionOverview: "One of the most scenic winter treks in India, winding through centuries-old rhododendron and oak forests to the mythological frozen lake of Brahmatal with unmatched frontal views of Mt. Trishul (7,120m).",
    destinationSlug: "tungnath-chandrashila",
    routes: [
      {
        id: "route-lohajung-brahmatal",
        name: "Route A: Lohajung → Bekaltal → Brahmatal → Summit Pass",
        trailhead: "Lohajung Village Base",
        distanceKm: 22.0,
        elevationGainMeters: 1434,
        estimatedTime: "4 Days",
        difficulty: "Moderate",
        sceneryScore: "PANORAMIC",
        sceneryDescription: "Two alpine lakes (Bekaltal & Brahmatal), snow-covered meadows, and direct Himalayan mountain walls.",
        crowdLevel: "Moderate",
        waterPointsCount: 4,
        teaStallsCount: 2,
        technicalExposure: "Snow/Scree",
        summary: "Gradual climb from Lohajung with night camping beside ancient alpine lakes.",
        recommendedFor: "Trekkers looking for incredible mountain photography and winter camping."
      }
    ],
    waypoints: [
      {
        id: "wp-lohajung",
        name: "Lohajung Base Village",
        hindiName: "लोहाजंग आधार",
        elevationMeters: 2300,
        elevationFormatted: "2,300 m",
        distanceFromStartKm: 0,
        timeFromPrev: "Start",
        terrainType: "Himalayan Village Hub",
        waterAvailable: true,
        shelterAvailable: true,
        foodAvailable: true,
        medicalHelp: true,
        latitude: 30.1240,
        longitude: 79.5890,
        isBaseCamp: true,
        fieldNotes: "Base for both Brahmatal and Roopkund treks. Homestays and gear rental available.",
        imageUrl: "/images/places/universal/nature.webp"
      },
      {
        id: "wp-brahmatal-lake",
        name: "Brahmatal Frozen Lake",
        hindiName: "ब्रह्मताल झील",
        elevationMeters: 3400,
        elevationFormatted: "3,400 m",
        distanceFromStartKm: 14.0,
        timeFromPrev: "5 hrs from Bekaltal",
        terrainType: "Alpine Snow Basin",
        waterAvailable: true,
        shelterAvailable: true,
        foodAvailable: true,
        medicalHelp: false,
        latitude: 30.1520,
        longitude: 79.6210,
        fieldNotes: "Sacred lake where Lord Brahma is said to have meditated. Beautiful reflection of snow peaks.",
        imageUrl: "/images/places/universal/nature.webp"
      },
      {
        id: "wp-brahmatal-summit",
        name: "Brahmatal Pass Summit Ridge",
        hindiName: "ब्रह्मताल दर्रा (3,734 मी)",
        elevationMeters: 3734,
        elevationFormatted: "3,734 m",
        distanceFromStartKm: 18.0,
        timeFromPrev: "2.5 hrs",
        terrainType: "Snow Ridge Col",
        waterAvailable: false,
        shelterAvailable: false,
        foodAvailable: false,
        medicalHelp: false,
        latitude: 30.1650,
        longitude: 79.6350,
        isSummit: true,
        fieldNotes: "Incredible closeup of Mt. Trishul (7,120m) and Nanda Ghunti (6,309m).",
        imageUrl: "/images/places/universal/nature.webp"
      }
    ],
    difficultyFactors: {
      fitnessDemand: 6,
      altitudeRisk: 6,
      terrainTechnicality: 5,
      steepnessGrade: 6,
      exposureRisk: 5,
      weatherVolatility: 7,
      explanation: [
        "Cold winter winds and temperatures dropping to -8°C at night.",
        "Walking in snow requires steady cadence and gaiters."
      ]
    },
    gearChecklist: [
      {
        id: "gear-bt-boots",
        name: "Winter Waterproof Hiking Boots",
        category: "footwear",
        priority: "ESSENTIAL",
        studentAlternative: "Trekking boots + gaiters",
        buyApproxCost: 3200,
        rentApproxCostPerDay: 150,
        canBorrow: true,
        canSkip: false,
        packWeightGrams: 980
      }
    ],
    budget: {
      baseTransportCost: 900, // Rishikesh/Kathgodam to Lohajung shared Sumo
      foodPerDayCost: 500,
      campStayCostPerNight: 550,
      guideOptionalCostPerDay: 1200,
      permitCost: 200,
      gearRentalEstimate: 300,
      emergencyBuffer: 600,
      studentHacks: [
        "Take the direct morning bus from Kathgodam Railway Station or Rishikesh to Deval/Lohajung."
      ]
    },
    fieldIntelligence: {
      idealSeasonMonths: "December to March for snow; April–May for blooming rhododendrons.",
      winterAccess: "Fully accessible with microspikes.",
      monsoonRisk: "Landslides in Chamoli district in July–August. Avoid monsoon.",
      mobileNetwork: "BSNL works at Lohajung; no connectivity at Brahmatal lake.",
      nearestHospital: "CHC Tharali (35 km) / District Hospital Gopeshwar",
      nearestAtm: "Tharali or Dewal. Carry cash from Haldwani/Rishikesh.",
      lastMotorablePoint: "Lohajung",
      permitsRequired: "Forest entry permit issued at Lohajung.",
      localGuideRule: "Mandatory forest guide.",
      trailEtiquette: ["Do not step onto thin lake ice.", "No loud music."],
      leaveNoTraceRules: ["Pack out all non-biodegradable waste."]
    }
  },

  "dayara-bugyal": {
    id: "dayara-bugyal",
    slug: "dayara-bugyal",
    title: "Dayara Bugyal High Alpine Meadow",
    hindiTitle: "दयारा बुग्याल अल्पाइन मखमली घास के मैदान",
    region: "Uttarkashi / Garhwal",
    state: "Uttarakhand",
    mountainRange: "Gangotri & Bandarpoonch Massif",
    baseCamp: "Barsu / Raithal Village (2,200 m)",
    peakAltitudeMeters: 3675,
    peakAltitudeFormatted: "3,675 m (12,057 ft)",
    totalDistanceKm: 18,
    durationDays: 3,
    durationHours: "3 Days / 2 Nights",
    difficulty: "Easy",
    bestSeason: "May to Nov (Emerald Green) & Dec to Mar (Snow Skiing Slopes)",
    viewScore: "PANORAMIC",
    approxBudgetPerPerson: 3200,
    altitudeRiskIndicator: "Low",
    heroImage: "/images/destinations/manali/hero.jpg",
    tagline: "India's most breathtaking alpine highland meadow stretching across 28 square kilometers.",
    expeditionOverview: "A gentle, picture-perfect trek through oak and maple canopies opening onto the colossal rolling green (or snow-blanketed) meadows of Dayara Bugyal, with sweeping panoramic sights of Bandarpoonch (6,316m), Draupadi Ka Danda, and Srikanth peaks.",
    destinationSlug: "mussoorie",
    routes: [
      {
        id: "route-raithal-dayara",
        name: "Route A: Raithal Village → Gui → Dayara Top",
        trailhead: "Raithal Village (Uttarkashi)",
        distanceKm: 9.0,
        elevationGainMeters: 1475,
        estimatedTime: "3 Days",
        difficulty: "Easy",
        sceneryScore: "PANORAMIC",
        sceneryDescription: "Ancient shepherd stone huts at Gui and vast undulating meadows.",
        crowdLevel: "Low",
        waterPointsCount: 4,
        teaStallsCount: 2,
        technicalExposure: "None",
        summary: "The most scenic and gentle approach passing traditional village homestays and quiet oak clearings.",
        recommendedFor: "Beginners, families, and mountain photographers."
      }
    ],
    waypoints: [
      {
        id: "wp-raithal",
        name: "Raithal Heritage Village",
        hindiName: "रैथल धरोहर गाँव",
        elevationMeters: 2200,
        elevationFormatted: "2,200 m",
        distanceFromStartKm: 0,
        timeFromPrev: "Start",
        terrainType: "Ancient Wooden Village",
        waterAvailable: true,
        shelterAvailable: true,
        foodAvailable: true,
        medicalHelp: true,
        latitude: 30.8240,
        longitude: 78.5910,
        isBaseCamp: true,
        fieldNotes: "Famous for the 500-year-old 4-storey wooden Sunhara castle house.",
        imageUrl: "/images/places/universal/nature.webp"
      },
      {
        id: "wp-gui",
        name: "Gui Campsite (Shepherd Huts)",
        hindiName: "गुई बुग्याल कैंप",
        elevationMeters: 2950,
        elevationFormatted: "2,950 m",
        distanceFromStartKm: 4.5,
        timeFromPrev: "3.5 hrs",
        terrainType: "Oak Clearing with Forest Pond",
        waterAvailable: true,
        shelterAvailable: true,
        foodAvailable: true,
        medicalHelp: false,
        latitude: 30.8410,
        longitude: 78.6120,
        fieldNotes: "Charming stone gujjar huts with direct sunrise views of Bandarpoonch.",
        imageUrl: "/images/places/universal/nature.webp"
      },
      {
        id: "wp-dayara-top",
        name: "Dayara Bugyal Bakaria Top",
        hindiName: "दयारा बकारिया टॉप (3,675 मी)",
        elevationMeters: 3675,
        elevationFormatted: "3,675 m",
        distanceFromStartKm: 9.0,
        timeFromPrev: "2.5 hrs from Gui",
        terrainType: "Infinite Rolling Alpine Meadow",
        waterAvailable: true,
        shelterAvailable: false,
        foodAvailable: false,
        medicalHelp: false,
        latitude: 30.8620,
        longitude: 78.6350,
        isSummit: true,
        fieldNotes: "360-degree panorama of Gangotri 1, 2, 3, Bandarpoonch, and Black Peak.",
        imageUrl: "/images/destinations/manali/hero.jpg"
      }
    ],
    difficultyFactors: {
      fitnessDemand: 4,
      altitudeRisk: 3,
      terrainTechnicality: 2,
      steepnessGrade: 4,
      exposureRisk: 2,
      weatherVolatility: 5,
      explanation: [
        "Well-graded gentle gradient with virtually zero technical difficulty.",
        "Perfect introduction to high-altitude Himalayan camping."
      ]
    },
    gearChecklist: [
      {
        id: "gear-db-shoes",
        name: "Comfortable Hiking Shoes with Ankle Support",
        category: "footwear",
        priority: "ESSENTIAL",
        studentAlternative: "Good traction running sneakers",
        buyApproxCost: 2000,
        rentApproxCostPerDay: 80,
        canBorrow: true,
        canSkip: false,
        packWeightGrams: 850
      }
    ],
    budget: {
      baseTransportCost: 650, // Dehradun to Uttarkashi to Raithal
      foodPerDayCost: 450,
      campStayCostPerNight: 450,
      guideOptionalCostPerDay: 800,
      permitCost: 150,
      gearRentalEstimate: 150,
      emergencyBuffer: 400,
      studentHacks: [
        "Take the direct Uttarkashi bus from Dehradun (₹220), then local shared Jeep to Raithal (₹70)."
      ]
    },
    fieldIntelligence: {
      idealSeasonMonths: "May to November for green meadows; December to March for snow skiing.",
      winterAccess: "Open and accessible in winter.",
      monsoonRisk: "Heavy rain in July–August; but meadow turns vibrant with wildflowers.",
      mobileNetwork: "Jio and Airtel work in Raithal village; spotty at Gui.",
      nearestHospital: "District Hospital Uttarkashi (38 km)",
      nearestAtm: "Bhatwari (12 km) or Uttarkashi.",
      lastMotorablePoint: "Raithal Village",
      permitsRequired: "Forest permit issued at Raithal checkpost.",
      localGuideRule: "Recommended.",
      trailEtiquette: ["Do not pluck meadow grass or wildflowers."],
      leaveNoTraceRules: ["Pack out all trash."]
    }
  },

  "beas-kund": {
    id: "beas-kund",
    slug: "beas-kund",
    title: "Beas Kund Glacial Origin Trail",
    hindiTitle: "ब्यास कुंड हिमानी उद्गम पदयात्रा",
    region: "Kullu Valley",
    state: "Himachal Pradesh",
    mountainRange: "Dhauladhar & Pir Panjal Massif",
    baseCamp: "Solang Valley / Dhundi (2,840 m)",
    peakAltitudeMeters: 3810,
    peakAltitudeFormatted: "3,810 m (12,500 ft)",
    totalDistanceKm: 16,
    durationDays: 2,
    durationHours: "2 Days / 1 Night",
    difficulty: "Moderate",
    bestSeason: "May to October",
    viewScore: "HIGH",
    approxBudgetPerPerson: 1800,
    altitudeRiskIndicator: "Low",
    heroImage: "/images/destinations/manali/hero.jpg",
    tagline: "Hike to the sacred glacial pond where sage Vyas meditated beneath Hanuman Tibba and Friendship Peak.",
    expeditionOverview: "A high alpine day-and-weekend trail tracing the bubbling glacial birth of the mighty Beas River at 3,810m, surrounded by towering pyramid peaks including Mt. Hanuman Tibba (5,930m), Friendship Peak, and Ladakhi Peak.",
    destinationSlug: "manali",
    routes: [
      {
        id: "route-dhundi-beaskund",
        name: "Route A: Dhundi → Bakarthach → Beas Kund",
        trailhead: "Dhundi Bridge (Solang Valley)",
        distanceKm: 8.0,
        elevationGainMeters: 970,
        estimatedTime: "5 hrs ascent",
        difficulty: "Moderate",
        sceneryScore: "HIGH",
        sceneryDescription: "Glacial river valley, birch groves, boulder moraines, and sheer amphitheatre cliffs.",
        crowdLevel: "Moderate",
        waterPointsCount: 4,
        teaStallsCount: 1,
        technicalExposure: "Mild Scramble",
        summary: "Climbs past the Atal Tunnel south portal and winds through Bakarthach meadow to the emerald glacial lake.",
        recommendedFor: "Weekend adventurers and aspiring mountaineers based in Manali."
      }
    ],
    waypoints: [
      {
        id: "wp-dhundi",
        name: "Dhundi Trailhead",
        hindiName: "धुंडी आधार",
        elevationMeters: 2840,
        elevationFormatted: "2,840 m",
        distanceFromStartKm: 0,
        timeFromPrev: "Start",
        terrainType: "Riverbed & Birch Forest",
        waterAvailable: true,
        shelterAvailable: true,
        foodAvailable: true,
        medicalHelp: true,
        latitude: 32.3350,
        longitude: 77.1210,
        isBaseCamp: true,
        fieldNotes: "30-minute taxi drive from Manali Mall Road past Solang Valley.",
        imageUrl: "/images/destinations/manali/hero.jpg"
      },
      {
        id: "wp-bakarthach",
        name: "Bakarthach Shepherd Meadow",
        hindiName: "बाकरथाच बुग्याल",
        elevationMeters: 3300,
        elevationFormatted: "3,300 m",
        distanceFromStartKm: 4.5,
        timeFromPrev: "2.5 hrs",
        terrainType: "Alpine Grassland & Boulder Ridge",
        waterAvailable: true,
        shelterAvailable: true,
        foodAvailable: true,
        medicalHelp: false,
        latitude: 32.3510,
        longitude: 77.1020,
        fieldNotes: "Stunning campsite overlooking the seven glaciers of Hanuman Tibba.",
        imageUrl: "/images/places/universal/nature.webp"
      },
      {
        id: "wp-beas-kund",
        name: "Beas Kund Glacial Pool",
        hindiName: "ब्यास कुंड (3,810 मी)",
        elevationMeters: 3810,
        elevationFormatted: "3,810 m",
        distanceFromStartKm: 8.0,
        timeFromPrev: "2.5 hrs from Bakarthach",
        terrainType: "Glacial Moraine & Alpine Lake",
        waterAvailable: true,
        shelterAvailable: false,
        foodAvailable: false,
        medicalHelp: false,
        latitude: 32.3680,
        longitude: 77.0850,
        isSummit: true,
        fieldNotes: "Pristine emerald lake fed by hanging glaciers. Sacred birthplace of River Beas.",
        imageUrl: "/images/destinations/manali/hero.jpg"
      }
    ],
    difficultyFactors: {
      fitnessDemand: 5,
      altitudeRisk: 4,
      terrainTechnicality: 4,
      steepnessGrade: 5,
      exposureRisk: 3,
      weatherVolatility: 6,
      explanation: [
        "Moderate boulder-hopping section before the final lake basin.",
        "Rapid weather shifts around the Solang ridge in afternoon."
      ]
    },
    gearChecklist: [
      {
        id: "gear-bk-shoes",
        name: "Sturdy Hiking Shoes with Ankle Support",
        category: "footwear",
        priority: "ESSENTIAL",
        studentAlternative: "Good trail running sneakers with grip",
        buyApproxCost: 2200,
        rentApproxCostPerDay: 100,
        canBorrow: true,
        canSkip: false,
        packWeightGrams: 850
      }
    ],
    budget: {
      baseTransportCost: 400, // Manali to Dhundi auto/cab
      foodPerDayCost: 400,
      campStayCostPerNight: 500,
      guideOptionalCostPerDay: 800,
      permitCost: 100,
      gearRentalEstimate: 100,
      emergencyBuffer: 300,
      studentHacks: [
        "Take the electric local bus from Manali to Solang (₹25), then walk or share taxi to Dhundi."
      ]
    },
    fieldIntelligence: {
      idealSeasonMonths: "Mid-May to October. July offers lush green valley; October offers golden autumn.",
      winterAccess: "Closed December to March due to deep avalanche snow in Dhundi gorge.",
      monsoonRisk: "Stream crossing near Dhundi can swell during heavy rain.",
      mobileNetwork: "Jio/Airtel work at Dhundi; zero signal at Beas Kund.",
      nearestHospital: "Civil Hospital Manali (18 km)",
      nearestAtm: "Solang Valley or Manali.",
      lastMotorablePoint: "Dhundi",
      permitsRequired: "Forest registration at Dhundi barrier.",
      localGuideRule: "Self-navigable for experienced hikers.",
      trailEtiquette: ["Do not swim in or pollute sacred Beas Kund pool."],
      leaveNoTraceRules: ["Carry all trash back to Manali."]
    }
  }
};

export const ALL_TREKS_LIST: TrekItem[] = Object.values(TREK_REGISTRY);

export function getTrekBySlug(slug: string): TrekItem | undefined {
  if (!slug) return undefined;
  const clean = slug.toLowerCase().trim();
  return TREK_REGISTRY[clean] || ALL_TREKS_LIST.find((t) => t.slug === clean || t.id === clean || t.title.toLowerCase().includes(clean));
}
