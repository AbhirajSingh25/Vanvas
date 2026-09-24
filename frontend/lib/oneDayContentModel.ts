/**
 * VANVAS One-Day Round Trip Intelligence & Generator Model
 * "We have one day. Let's go." — Spontaneous road trips & day escapes across India.
 */

export type OneDayVibe =
  | "Mountains"
  | "Food"
  | "Road Trip"
  | "Water"
  | "History"
  | "Chill"
  | "Adventure"
  | "Nature"
  | "Spiritual"
  | "Random"
  | "Friends";

export type OneDayTransport = "Metro" | "Bus" | "Train" | "Bike" | "Car" | "Rental" | "Any";

export interface OneDayStop {
  id: string;
  order: number;
  timeSlot: string; // e.g. "06:30 AM – 08:00 AM"
  period: "DAWN" | "MORNING" | "MIDDAY" | "AFTERNOON" | "SUNSET" | "NIGHT";
  name: string;
  hindiName: string;
  category: "scenic" | "food" | "adventure" | "heritage" | "chill" | "chai_break" | "sunset" | "convenience";
  activityTitle: string;
  description: string;
  estimatedDuration: string;
  approxCostPerPerson: number;
  locationName: string;
  distanceFromPrevKm: number;
  localTip: string;
  lat?: number;
  lng?: number;
  imageUrl?: string;
}

export interface OneDayRentalDiscovery {
  providerName: string;
  vehicleType: "Scooter (Activa/Jupiter)" | "Royal Enfield / Cruiser" | "Hatchback / Sedan" | "SUV 4x4";
  location: string;
  approxRatePerDay: number;
  contactOrBookingTip: string;
  fuelEstimate: number;
  helmetIncluded: boolean;
}

export interface OneDayPoiLayer {
  category: "fuel" | "pharmacy" | "dhaba" | "cafe" | "convenience" | "atm" | "beverage_store";
  name: string;
  location: string;
  highwayOrLandmark: string;
  note: string;
}

export interface OneDayPlan {
  id: string;
  title: string;
  hindiTitle: string;
  tagline: string;
  originCity: string;
  destinationArea: string;
  vibes: OneDayVibe[];
  primaryTransport: OneDayTransport;
  totalDistanceKm: number;
  totalTravelTime: string;
  departureTime: string;
  returnTime: string;
  baseBudgetPerPerson: number;
  idealGroupSize: string; // e.g. "2 – 5 Friends"
  stops: OneDayStop[];
  rentals: OneDayRentalDiscovery[];
  poiHighlights: OneDayPoiLayer[];
  budgetBreakdown: {
    transportFuel: number;
    foodSnacks: number;
    activityTickets: number;
    parkingTolls: number;
    miscEmergency: number;
  };
  studentHacks: string[];
}

export interface OneDayHub {
  id: string;
  name: string;
  hindiName: string;
  state: string;
  lat: number;
  lng: number;
  aliases: string[];
}

export const ONE_DAY_HUBS: OneDayHub[] = [
  { id: "delhi", name: "Delhi NCR", hindiName: "दिल्ली एनसीआर", state: "Delhi", lat: 28.6139, lng: 77.2090, aliases: ["delhi", "new delhi", "noida", "gurugram", "gurgaon", "faridabad", "ghaziabad"] },
  { id: "dehradun", name: "Dehradun / Rishikesh", hindiName: "देहरादून / ऋषिकेश", state: "Uttarakhand", lat: 30.3165, lng: 78.0322, aliases: ["dehradun", "rishikesh", "haridwar"] },
  { id: "manali", name: "Manali / Kullu", hindiName: "मनाली / कुल्लू", state: "Himachal Pradesh", lat: 32.2396, lng: 77.1887, aliases: ["manali", "kullu", "naggar"] },
  { id: "dharamshala", name: "Dharamshala / Kangra", hindiName: "धर्मशाला / कांगड़ा", state: "Himachal Pradesh", lat: 32.2190, lng: 76.3234, aliases: ["dharamshala", "mcleod ganj", "kangra", "dharamkot"] },
  { id: "jaipur", name: "Jaipur", hindiName: "जयपुर", state: "Rajasthan", lat: 26.9124, lng: 75.7873, aliases: ["jaipur", "amer", "pink city"] },
  { id: "udaipur", name: "Udaipur", hindiName: "उदयपुर", state: "Rajasthan", lat: 24.5854, lng: 73.7125, aliases: ["udaipur", "mewar"] },
  { id: "mumbai", name: "Mumbai / Navi Mumbai", hindiName: "मुंबई", state: "Maharashtra", lat: 19.0760, lng: 72.8777, aliases: ["mumbai", "navi mumbai", "thane"] },
  { id: "pune", name: "Pune", hindiName: "पुणे", state: "Maharashtra", lat: 18.5204, lng: 73.8567, aliases: ["pune", "pcmc", "lonavala"] },
  { id: "bengaluru", name: "Bengaluru", hindiName: "बेंगलुरु", state: "Karnataka", lat: 12.9716, lng: 77.5946, aliases: ["bengaluru", "bangalore"] },
  { id: "kochi", name: "Kochi / Ernakulam", hindiName: "कोच्चि", state: "Kerala", lat: 9.9312, lng: 76.2673, aliases: ["kochi", "cochin", "ernakulam", "munnar"] },
  { id: "varanasi", name: "Varanasi", hindiName: "वाराणसी", state: "Uttar Pradesh", lat: 25.3176, lng: 82.9739, aliases: ["varanasi", "kashi", "banaras", "sarnath"] },
  { id: "goa", name: "Goa (North/South)", hindiName: "गोवा", state: "Goa", lat: 15.2993, lng: 74.1240, aliases: ["goa", "panaji", "anjuna", "madgaon"] },
];

export const SEEDED_ONE_DAY_PLANS: OneDayPlan[] = [
  // Plan 1: From Delhi
  {
    id: "delhi-murthal-neemrana",
    title: "Sunrise Highway Dhaba + Aravalli Hill Fort",
    hindiTitle: "सूर्योदय ढाबा + नीमराना अरावली किला",
    tagline: "Early morning parathas, breezy highway ride, and sunset atop a 15th-century cliff fort.",
    originCity: "Delhi NCR",
    destinationArea: "NH-48 Corridor & Neemrana",
    vibes: ["Road Trip", "Food", "History", "Friends"],
    primaryTransport: "Car",
    totalDistanceKm: 240,
    totalTravelTime: "4.5 Hours total driving",
    departureTime: "06:00 AM",
    returnTime: "08:30 PM",
    baseBudgetPerPerson: 1100,
    idealGroupSize: "3 – 5 Friends",
    budgetBreakdown: {
      transportFuel: 450, // Car fuel split across 4
      foodSnacks: 400,
      activityTickets: 150,
      parkingTolls: 100,
      miscEmergency: 0
    },
    studentHacks: [
      "Pool 4 friends in one hatchback to reduce per-person fuel & toll cost to ₹500.",
      "Skip luxury hotel dining inside the fort and eat authentic Rajasthani Dal Baati at Highway King Dhaba."
    ],
    rentals: [
      {
        providerName: "Delhi Zoomcar / Revv Hubs (Aerocity & Gurgaon)",
        vehicleType: "Hatchback / Sedan",
        location: "Gurgaon Cyber Hub & IGI T3 Metro",
        approxRatePerDay: 1600,
        contactOrBookingTip: "Reserve via app; fuel included plans available.",
        fuelEstimate: 1200,
        helmetIncluded: false
      },
      {
        providerName: "StoneheadBikes Delhi",
        vehicleType: "Royal Enfield / Cruiser",
        location: "Karol Bagh & Mahipalpur",
        approxRatePerDay: 1100,
        contactOrBookingTip: "Carry original Aadhaar + DL + ₹3,000 security deposit.",
        fuelEstimate: 600,
        helmetIncluded: true
      }
    ],
    poiHighlights: [
      { category: "dhaba", name: "Amrik Sukhdev / Mannat Dhaba", location: "NH-44 / NH-48", highwayOrLandmark: "Mile 52 Highway", note: "Hot tandoori white butter parathas & kulhad chai." },
      { category: "fuel", name: "Indian Oil COCO 24x7 Oasis", location: "Manesar Toll", highwayOrLandmark: "NH-48 KMP Junction", note: "Clean washrooms, air pump & ATM." },
      { category: "beverage_store", name: "Discovery Premium Retail & Wine Store", location: "Gurgaon Border / NH-48", highwayOrLandmark: "Exit 18 Gurgaon", note: "Authorized state retail store for highway road trips." },
      { category: "pharmacy", name: "Apollo 24x7 Highway Care", location: "Dharuhera", highwayOrLandmark: "Main Flyover", note: "First aid, motion sickness pills & hydration salts." }
    ],
    stops: [
      {
        id: "del-stop-1",
        order: 1,
        timeSlot: "06:00 AM – 07:30 AM",
        period: "DAWN",
        name: "Dawn Departure & Highway Chai Run",
        hindiName: "सुबह की शुरुआत व चाय पड़ाव",
        category: "chai_break",
        activityTitle: "Beat City Traffic & First Kulhad Chai",
        description: "Roll out before Delhi morning rush hour. Catch the sunrise breaking over the Aravalli horizon with piping hot ginger chai.",
        estimatedDuration: "1.5 Hours",
        approxCostPerPerson: 70,
        locationName: "NH-48 Highway Dhaba",
        distanceFromPrevKm: 45,
        localTip: "Start before 6:30 AM to bypass the Gurgaon toll choke point completely.",
        imageUrl: "/images/places/universal/transport.webp"
      },
      {
        id: "del-stop-2",
        order: 2,
        timeSlot: "08:00 AM – 09:30 AM",
        period: "MORNING",
        name: "Legendary Highway Paratha Feast",
        hindiName: "तंदूरी पराठा नाश्ता",
        category: "food",
        activityTitle: "Tandoori Aloo Pyaaz Parathas & Fresh Makhan",
        description: "Crispy tandoori parathas smothered in fresh farm butter, spicy green chutney, sweet lassi, and pickle.",
        estimatedDuration: "1.5 Hours",
        approxCostPerPerson: 220,
        locationName: "Highway Dhaba Oasis",
        distanceFromPrevKm: 35,
        localTip: "Order sweet malai lassi to stay refreshed throughout the drive.",
        imageUrl: "/images/places/universal/food.webp"
      },
      {
        id: "del-stop-3",
        order: 3,
        timeSlot: "11:00 AM – 02:30 PM",
        period: "MIDDAY",
        name: "Neemrana Stepwell (Baori) & Fort Ramparts",
        hindiName: "नीमराना 9-मंज़िला बावड़ी",
        category: "heritage",
        activityTitle: "Explore 9-Storey Subterranean Stepwell",
        description: "Wander down the magnificent 16th-century deep stepwell with 170 stone steps, then take in panoramic desert views from the hill ridge.",
        estimatedDuration: "3.5 Hours",
        approxCostPerPerson: 100,
        locationName: "Neemrana Baori & Fort Ridge",
        distanceFromPrevKm: 60,
        localTip: "Neemrana Baori is open and free to explore; great natural cooling in mid-afternoon.",
        imageUrl: "/images/places/universal/heritage.webp"
      },
      {
        id: "del-stop-4",
        order: 4,
        timeSlot: "05:00 PM – 06:30 PM",
        period: "SUNSET",
        name: "Aravalli Ridge Sunset Point",
        hindiName: "अरावली सूर्यास्त पॉइंट",
        category: "sunset",
        activityTitle: "Golden Hour Photo Ops with Friends",
        description: "Watch the sun dip behind the ancient rocky hills with breeze, snacks, and road-trip playlists.",
        estimatedDuration: "1.5 Hours",
        approxCostPerPerson: 50,
        locationName: "Damdama / Sohna Ridge View",
        distanceFromPrevKm: 55,
        localTip: "Great spot for group polaroids and golden hour photography.",
        imageUrl: "/images/places/universal/nature.webp"
      },
      {
        id: "del-stop-5",
        order: 5,
        timeSlot: "07:00 PM – 08:30 PM",
        period: "NIGHT",
        name: "Highway Return & Late Evening Chaat",
        hindiName: "वापसी व शाम का नाश्ता",
        category: "food",
        activityTitle: "Breezy Cruise Home to Delhi NCR",
        description: "Final smooth cruise back into Delhi NCR after a full day out in Rajasthan borders.",
        estimatedDuration: "1.5 Hours",
        approxCostPerPerson: 150,
        locationName: "Delhi NCR Entry",
        distanceFromPrevKm: 45,
        localTip: "Re-enter city via Golf Course Extension to avoid bottleneck traffic.",
        imageUrl: "/images/places/universal/transport.webp"
      }
    ]
  },

  // Plan 2: From Dehradun / Rishikesh
  {
    id: "ddn-landour-george-everest",
    title: "Misty Pine Loops + Landour Bakehouse + Everest Peak",
    hindiTitle: "मसूरी लंडौर बेकरी + जॉर्ज एवरेस्ट शिखर",
    tagline: "Winding Himalayan turns, warm apple pie in Landour, and 360° sunset cliff at George Everest.",
    originCity: "Dehradun / Rishikesh",
    destinationArea: "Landour Cantonment & Mussoorie Ridges",
    vibes: ["Mountains", "Road Trip", "Food", "Chill", "Nature"],
    primaryTransport: "Bike",
    totalDistanceKm: 90,
    totalTravelTime: "2.5 Hours scenic mountain ride",
    departureTime: "07:30 AM",
    returnTime: "07:00 PM",
    baseBudgetPerPerson: 750,
    idealGroupSize: "2 – 4 Friends (2 Bikes / 1 Car)",
    budgetBreakdown: {
      transportFuel: 250, // Scooter rental & petrol split
      foodSnacks: 350,
      activityTickets: 50,
      parkingTolls: 50,
      miscEmergency: 50
    },
    studentHacks: [
      "Rent a Scooty Activa in Dehradun Railway Station (₹400/day) and split petrol with a pillion buddy.",
      "Grab fresh bun tikki and ginger tea in Dehradun Paltan Bazaar before heading uphill."
    ],
    rentals: [
      {
        providerName: "Dehradun Bike Rentals (Clock Tower & Station)",
        vehicleType: "Scooter (Activa/Jupiter)",
        location: "Opposite Dehradun Railway Station",
        approxRatePerDay: 400,
        contactOrBookingTip: "Helmet and documents provided; return by 8:00 PM.",
        fuelEstimate: 300,
        helmetIncluded: true
      },
      {
        providerName: "Himalayan Scooters & Bullets Rishikesh",
        vehicleType: "Royal Enfield / Cruiser",
        location: "Tapovan Main Chowk",
        approxRatePerDay: 800,
        contactOrBookingTip: "Valid license and security deposit required.",
        fuelEstimate: 400,
        helmetIncluded: true
      }
    ],
    poiHighlights: [
      { category: "cafe", name: "Landour Bakehouse (Sisters Bazaar)", location: "Landour", highwayOrLandmark: "Near Kellogg Church", note: "Historic Himalayan bakery famous for apple cinnamon pie." },
      { category: "fuel", name: "HPCL Rajpur Road Fuel Hub", location: "Rajpur Road, Dehradun", highwayOrLandmark: "Old Toll Point", note: "Last flat petrol pump before the uphill Mussoorie climb." },
      { category: "convenience", name: "Prakash Stores (Est. 1928)", location: "Sisters Bazaar", highwayOrLandmark: "Landour Cantonment", note: "Handmade peanut butter, cheese, jams & travel snacks." }
    ],
    stops: [
      {
        id: "ddn-stop-1",
        order: 1,
        timeSlot: "07:30 AM – 09:00 AM",
        period: "DAWN",
        name: "Rajpur Road to Mussoorie Ghat Climb",
        hindiName: "राजपुर रोड से मसूरी घाटी चढ़ाई",
        category: "scenic",
        activityTitle: "Breezy Switchbacks & Deodar Pine Air",
        description: "Ascend 1,400 vertical meters through misty hairpin bends with refreshing cool Himalayan breeze.",
        estimatedDuration: "1.5 Hours",
        approxCostPerPerson: 50,
        locationName: "Mussoorie Road Viewpoints",
        distanceFromPrevKm: 25,
        localTip: "Stop at Shiv Mandir Maggi Point halfway up for steaming lemon ginger tea.",
        imageUrl: "/images/places/mussoorie/categories/nature.webp"
      },
      {
        id: "ddn-stop-2",
        order: 2,
        timeSlot: "09:30 AM – 12:00 PM",
        period: "MORNING",
        name: "Landour Upper Loop & Sisters Bazaar",
        hindiName: "लंडौर शांति मार्ग व सिस्टर्स बाज़ार",
        category: "chill",
        activityTitle: "Peaceful Forest Walk Among 150-Year Oaks",
        description: "Wander past Ruskin Bond's favorite quiet trails, Kellogg Memorial Church, and pick up warm bakery treats.",
        estimatedDuration: "2.5 Hours",
        approxCostPerPerson: 250,
        locationName: "Landour Upper Mall Loop",
        distanceFromPrevKm: 12,
        localTip: "Strict quiet zone in cantonment. Park vehicles outside Sisters Bazaar and walk.",
        imageUrl: "/images/places/mussoorie/categories/cafe.webp"
      },
      {
        id: "ddn-stop-3",
        order: 3,
        timeSlot: "01:00 PM – 04:30 PM",
        period: "AFTERNOON",
        name: "Sir George Everest House & Cliff Ridge",
        hindiName: "सर जॉर्ज एवरेस्ट कगार",
        category: "adventure",
        activityTitle: "Hike to the Surveyor General's Peak",
        description: "Walk along the breathtaking narrow ridge overlooking the Doon Valley on the left and the snow-capped Great Himalayas on the right.",
        estimatedDuration: "3.5 Hours",
        approxCostPerPerson: 100,
        locationName: "George Everest Peak (Park Estate)",
        distanceFromPrevKm: 15,
        localTip: "The ridge is windy; carry a light jacket even in summer.",
        imageUrl: "/images/places/mussoorie/categories/viewpoint.webp"
      },
      {
        id: "ddn-stop-4",
        order: 4,
        timeSlot: "05:00 PM – 06:15 PM",
        period: "SUNSET",
        name: "Winterline / Sunset Golden Hour",
        hindiName: "मसूरी विंटरलाइन सूर्यास्त",
        category: "sunset",
        activityTitle: "Witness the World-Famous Mussoorie Horizon",
        description: "Watch the horizon light up in brilliant scarlet and purple layers over the distant Shiwalik foothills.",
        estimatedDuration: "1.2 Hours",
        approxCostPerPerson: 60,
        locationName: "Everest Hill Sunset Point",
        distanceFromPrevKm: 2,
        localTip: "Catch the horizon glow 15 minutes after official sunset.",
        imageUrl: "/images/places/mussoorie/categories/viewpoint.webp"
      },
      {
        id: "ddn-stop-5",
        order: 5,
        timeSlot: "06:30 PM – 07:45 PM",
        period: "NIGHT",
        name: "Smooth Evening Descent to Dehradun",
        hindiName: "देहरादून वापसी व भोजन",
        category: "food",
        activityTitle: "Dinner at Rajpur Road Cafes",
        description: "Coast down the lighted mountain turns and celebrate with Tibetan momos or woodfired pizza in Rajpur.",
        estimatedDuration: "1.2 Hours",
        approxCostPerPerson: 200,
        locationName: "Rajpur Dehradun",
        distanceFromPrevKm: 30,
        localTip: "Ride cautiously during descent; keep low beam on scooters.",
        imageUrl: "/images/places/universal/food.webp"
      }
    ]
  },

  // Plan 3: From Mumbai / Pune
  {
    id: "mumbai-lonavala-kataldhar",
    title: "Sahyadri Canyon Waterfalls + Old Mumbai-Pune Highway",
    hindiTitle: "सह्याद्रि जलप्रपात + पुराना मुंबई-पुणे मार्ग",
    tagline: "Monsoon cascades, piping hot vada pav, and canyon valley viewpoints.",
    originCity: "Mumbai / Navi Mumbai",
    destinationArea: "Lonavala / Khandala Ghats & Rajmachi Escarpment",
    vibes: ["Water", "Road Trip", "Adventure", "Nature", "Food"],
    primaryTransport: "Car",
    totalDistanceKm: 160,
    totalTravelTime: "3.5 Hours total driving",
    departureTime: "06:30 AM",
    returnTime: "07:30 PM",
    baseBudgetPerPerson: 900,
    idealGroupSize: "3 – 5 Friends",
    budgetBreakdown: {
      transportFuel: 350,
      foodSnacks: 300,
      activityTickets: 100,
      parkingTolls: 100,
      miscEmergency: 50
    },
    studentHacks: [
      "Take the Mumbai-Pune Old Highway (NH-48) instead of Expressway for two-wheelers and zero toll fees.",
      "Local train from Mumbai CST to Karjat costs ₹30, followed by shared auto to trailheads."
    ],
    rentals: [
      {
        providerName: "Navi Mumbai & Thane Self-Drive Cars",
        vehicleType: "Hatchback / Sedan",
        location: "Vashi & Panvel Railway Station",
        approxRatePerDay: 1500,
        contactOrBookingTip: "Book advance for weekend monsoon trips.",
        fuelEstimate: 900,
        helmetIncluded: false
      }
    ],
    poiHighlights: [
      { category: "dhaba", name: "Ramakant Vada Pav & Chikki Center", location: "Old Khandala Toll", highwayOrLandmark: "NH-48 Old Highway", note: "Hot garlic chutney vada pav and fresh crushed peanut chikki." },
      { category: "fuel", name: "HP Highway King Panvel", location: "Panvel Expressway Bypass", highwayOrLandmark: "Expressway Entry", note: "Full fuel and tire pressure station." }
    ],
    stops: [
      {
        id: "mum-stop-1",
        order: 1,
        timeSlot: "06:30 AM – 08:30 AM",
        period: "DAWN",
        name: "Bhor Ghat Monsoon Highway Drive",
        hindiName: "भोर घाट मानसूनी सफ़र",
        category: "scenic",
        activityTitle: "Drive through Clouds & Sahyadri Gorges",
        description: "Wind through the dramatic Bhor Ghat with green cliffs draped in hundreds of spontaneous seasonal waterfalls.",
        estimatedDuration: "2 Hours",
        approxCostPerPerson: 100,
        locationName: "Khandala Ghats",
        distanceFromPrevKm: 65,
        localTip: "Take the scenic Amrutanjan Point detour for cliffside views.",
        imageUrl: "/images/places/universal/nature.webp"
      },
      {
        id: "mum-stop-2",
        order: 2,
        timeSlot: "09:00 AM – 10:00 AM",
        period: "MORNING",
        name: "Khandala Chai & Hot Vada Pav Pitstop",
        hindiName: "गरमा-गरम वड़ा पाव व चाय",
        category: "food",
        activityTitle: "Crispy Kanda Bhaji & Spiced Tea",
        description: "Essential Maharashtrian road trip fuel: piping hot onion fritters, thecha, and ginger tea.",
        estimatedDuration: "1 Hour",
        approxCostPerPerson: 120,
        locationName: "Old Highway Stalls",
        distanceFromPrevKm: 15,
        localTip: "Ask for extra dry garlic red chutney (लहसुन चटनी).",
        imageUrl: "/images/places/universal/food.webp"
      },
      {
        id: "mum-stop-3",
        order: 3,
        timeSlot: "10:30 AM – 03:00 PM",
        period: "MIDDAY",
        name: "Kataldhar / Rajmachi Canyon Trail",
        hindiName: "कातलधार जलप्रपात घाटी",
        category: "adventure",
        activityTitle: "Jungle Hike to Massive Eye-Shaped Waterfall",
        description: "Descend into the lush green canyon to witness the thundering 350-ft cascade plunging into a natural emerald pool.",
        estimatedDuration: "4.5 Hours",
        approxCostPerPerson: 150,
        locationName: "Kataldhar Canyon Valley",
        distanceFromPrevKm: 18,
        localTip: "Trail gets slippery in heavy monsoon; wear shoes with rubber tread.",
        imageUrl: "/images/places/universal/waterfall.webp"
      },
      {
        id: "mum-stop-4",
        order: 4,
        timeSlot: "04:30 PM – 06:00 PM",
        period: "SUNSET",
        name: "Pawna / Tiger Point Sunset Chai",
        hindiName: "टाइगर पॉइंट सूर्यास्त",
        category: "sunset",
        activityTitle: "Misty Valley Sunset with Roasted Corn",
        description: "Enjoy roasted spiced butter corn (bhutta) on the cliff edge as the fog rolls across the valley.",
        estimatedDuration: "1.5 Hours",
        approxCostPerPerson: 100,
        locationName: "Tiger Leap Cliff Point",
        distanceFromPrevKm: 20,
        localTip: "Keep food items inside bags to avoid playful macaque monkeys.",
        imageUrl: "/images/places/universal/viewpoint.webp"
      },
      {
        id: "mum-stop-5",
        order: 5,
        timeSlot: "06:30 PM – 08:00 PM",
        period: "NIGHT",
        name: "Smooth Expressway Return to City",
        hindiName: "शहर वापसी",
        category: "food",
        activityTitle: "Final Highway Dhaba Dinner & Cruise",
        description: "End the road trip with Kolhapuri misal or highway tandoori dinner before cruising back into Mumbai.",
        estimatedDuration: "1.5 Hours",
        approxCostPerPerson: 250,
        locationName: "Navi Mumbai Expressway Exit",
        distanceFromPrevKm: 42,
        localTip: "Fastag required on expressway tolls.",
        imageUrl: "/images/places/universal/transport.webp"
      }
    ]
  },

  // Plan 4: From Jaipur
  {
    id: "jaipur-bhangarh-abhaneri",
    title: "Chand Baori Stepwell + Bhangarh Ghost Citadel",
    hindiTitle: "चांद बावड़ी + भानगढ़ का ऐतिहासिक किला",
    tagline: "Geometric 3,500-step architectural wonder and the legends of the Aravali ruins.",
    originCity: "Jaipur",
    destinationArea: "Dausa & Alwar Heritage Corridor",
    vibes: ["History", "Road Trip", "Adventure", "Food"],
    primaryTransport: "Car",
    totalDistanceKm: 180,
    totalTravelTime: "3.5 Hours total driving",
    departureTime: "07:00 AM",
    returnTime: "06:30 PM",
    baseBudgetPerPerson: 850,
    idealGroupSize: "3 – 5 Friends",
    budgetBreakdown: {
      transportFuel: 350,
      foodSnacks: 300,
      activityTickets: 100,
      parkingTolls: 50,
      miscEmergency: 50
    },
    studentHacks: [
      "Show Student ID at ASI monuments (Chand Baori / Bhangarh) for discounted tickets (₹25).",
      "Pack water and fruit snacks from Jaipur walled city to save money on highway tourist shops."
    ],
    rentals: [
      {
        providerName: "Jaipur Self Drive Cars & Royal Enfield Hire",
        vehicleType: "Hatchback / Sedan",
        location: "MI Road & Jaipur Junction",
        approxRatePerDay: 1300,
        contactOrBookingTip: "Original DL + Aadhaar + security deposit.",
        fuelEstimate: 900,
        helmetIncluded: false
      }
    ],
    poiHighlights: [
      { category: "dhaba", name: "Kanha / Rawat Sweets Highway Outlet", location: "Agra Highway Dausa", highwayOrLandmark: "NH-21 Highway", note: "Famous hot Pyaaz Kachori & Mawa Kachori." },
      { category: "pharmacy", name: "Dausa City Medical Store", location: "Dausa Bypass", highwayOrLandmark: "Main Junction", note: "Sunscreen, first aid, hydration." }
    ],
    stops: [
      {
        id: "jpr-stop-1",
        order: 1,
        timeSlot: "07:00 AM – 08:30 AM",
        period: "DAWN",
        name: "Morning Departure & Pyaaz Kachori Breakfast",
        hindiName: "जयपुर से प्रस्थान व प्याज़ कचौरी नाश्ता",
        category: "food",
        activityTitle: "Golden Crispy Kachoris & Masala Chai",
        description: "Kick off the drive on the Jaipur-Agra expressway with steaming spicy onion kachoris and sweet jalebis.",
        estimatedDuration: "1.5 Hours",
        approxCostPerPerson: 100,
        locationName: "NH-21 Highway Stop",
        distanceFromPrevKm: 40,
        localTip: "Get kachoris fresh out of the kadhai at 7:30 AM.",
        imageUrl: "/images/places/jaipur/categories/cafe.webp"
      },
      {
        id: "jpr-stop-2",
        order: 2,
        timeSlot: "09:30 AM – 12:00 PM",
        period: "MORNING",
        name: "Chand Baori, Abhaneri (1,200 Years Old)",
        hindiName: "चांद बावड़ी आभानेरी",
        category: "heritage",
        activityTitle: "Marvel at India's Deepest Stepwell",
        description: "3,500 symmetrical narrow stone steps descending 13 storeys into emerald subterranean waters.",
        estimatedDuration: "2.5 Hours",
        approxCostPerPerson: 80,
        locationName: "Abhaneri Village",
        distanceFromPrevKm: 50,
        localTip: "The optical symmetry in morning light is unmatched for architecture photos.",
        imageUrl: "/images/places/jaipur/categories/heritage.webp"
      },
      {
        id: "jpr-stop-3",
        order: 3,
        timeSlot: "01:00 PM – 04:00 PM",
        period: "AFTERNOON",
        name: "Bhangarh Fort Ruins & Royal Palace",
        hindiName: "भानगढ़ किला व खंडहर",
        category: "adventure",
        activityTitle: "Wander through the 17th-Century Citadel",
        description: "Explore the ancient bazaars, Shiva and Gopinath temples, and the royal palace ruins set against the Aravalli hills.",
        estimatedDuration: "3 Hours",
        approxCostPerPerson: 100,
        locationName: "Bhangarh Sanctuary",
        distanceFromPrevKm: 45,
        localTip: "ASI mandates all visitors exit the fort before official sunset (6:00 PM).",
        imageUrl: "/images/places/jaipur/categories/heritage.webp"
      },
      {
        id: "jpr-stop-4",
        order: 4,
        timeSlot: "05:00 PM – 06:30 PM",
        period: "SUNSET",
        name: "Highway Return & Sunset Over Aravallis",
        hindiName: "जयपुर वापसी व सूर्यास्त",
        category: "sunset",
        activityTitle: "Golden Hour Drive back to the Pink City",
        description: "Wind back along the scenic hills into Jaipur just as the city's terracotta ramparts light up.",
        estimatedDuration: "1.5 Hours",
        approxCostPerPerson: 120,
        locationName: "Jaipur Entry Gate",
        distanceFromPrevKm: 45,
        localTip: "Stop at Jal Mahal promenade for the evening illuminated reflection view.",
        imageUrl: "/images/destinations/jaipur/hero.jpg"
      }
    ]
  }
];

export function findOneDayPlansByOrigin(originQuery: string, vibe?: OneDayVibe, maxBudget?: number): OneDayPlan[] {
  const norm = (originQuery || "").toLowerCase().trim();
  
  let matchingPlans = SEEDED_ONE_DAY_PLANS.filter((plan) => {
    if (!norm) return true;
    const planOrigin = plan.originCity.toLowerCase();
    const planDest = plan.destinationArea.toLowerCase();
    return (
      planOrigin.includes(norm) ||
      norm.includes(planOrigin) ||
      planDest.includes(norm) ||
      norm.includes(planDest)
    );
  });

  // If no direct origin match found, return all plans so user can discover nearby hubs
  if (matchingPlans.length === 0) {
    matchingPlans = SEEDED_ONE_DAY_PLANS;
  }

  if (vibe && vibe !== "Random") {
    const vibeFiltered = matchingPlans.filter((p) => p.vibes.includes(vibe));
    if (vibeFiltered.length > 0) {
      matchingPlans = vibeFiltered;
    }
  }

  if (maxBudget && maxBudget > 0) {
    const budgetFiltered = matchingPlans.filter((p) => p.baseBudgetPerPerson <= maxBudget * 1.3);
    if (budgetFiltered.length > 0) {
      matchingPlans = budgetFiltered;
    }
  }

  return matchingPlans;
}
