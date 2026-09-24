/**
 * VANVAS One-Day Round Trip Intelligence & Generator Model
 * "We have one day. Let's go." — Spontaneous road trips & day escapes across India.
 */

export type OneDayVibe =
  | "Road Trip"
  | "Food"
  | "Mountains"
  | "Rivers"
  | "Water"
  | "Waterfalls"
  | "Forts"
  | "History"
  | "Temples"
  | "Spiritual"
  | "Beach"
  | "Cafes"
  | "Shopping"
  | "Adventure"
  | "Chill"
  | "Nature"
  | "Sunrise"
  | "Sunset"
  | "Photo Trip"
  | "Student Budget"
  | "Random"
  | "Friends";

export type OneDayTransport = "Metro" | "Bus" | "Train" | "Bike" | "Car" | "Rental" | "Any";

export type FeasibilityRating = "COMFORTABLE" | "TIGHT" | "RUSHED" | "NOT RECOMMENDED";

export interface OneDayStop {
  id: string;
  order: number;
  timeSlot: string; // e.g. "06:30 AM – 08:00 AM"
  period: "DAWN" | "MORNING" | "MIDDAY" | "AFTERNOON" | "SUNSET" | "NIGHT";
  name: string;
  hindiName: string;
  category: "scenic" | "food" | "adventure" | "heritage" | "chill" | "chai_break" | "sunset" | "sunrise" | "convenience" | "temple" | "nature" | "cafe";
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
  pricingUnit: "per day" | "per 24 hrs" | "per km";
  verificationStatus: "VERIFIED" | "ESTIMATED" | "CONTACT PROVIDER" | "PRICE NOT VERIFIED";
  contactOrBookingTip: string;
  phone?: string;
  securityDeposit: number;
  includedKmPerDay: number;
  extraKmRate: number;
  fuelPolicy: "Self-fuel" | "Includes Fuel" | "Same-to-Same";
  operatingHours: string;
  requiredDocuments: string[];
  fuelEstimate: number;
  helmetIncluded: boolean;
}

export interface OneDayPoiLayer {
  category: "fuel" | "pharmacy" | "dhaba" | "cafe" | "convenience" | "atm" | "beverage_store" | "hospital" | "repair" | "viewpoint" | "temple" | "food";
  name: string;
  location: string;
  highwayOrLandmark: string;
  note: string;
  lat?: number;
  lng?: number;
  provenance: "VERIFIED" | "DATABASE" | "ESTIMATED";
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
  feasibility: FeasibilityRating;
  feasibilityReason: string;
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
  packingItems?: string[];
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
  { id: "delhi", name: "Delhi NCR", hindiName: "दिल्ली एनसीआर", state: "Delhi", lat: 28.6139, lng: 77.2090, aliases: ["delhi", "new delhi", "noida", "gurugram", "gurgaon", "faridabad", "ghaziabad", "ncr"] },
  { id: "dehradun", name: "Dehradun", hindiName: "देहरादून", state: "Uttarakhand", lat: 30.3165, lng: 78.0322, aliases: ["dehradun", "doon"] },
  { id: "rishikesh", name: "Rishikesh / Haridwar", hindiName: "ऋषिकेश / हरिद्वार", state: "Uttarakhand", lat: 30.0869, lng: 78.2676, aliases: ["rishikesh", "haridwar", "tapovan"] },
  { id: "chandigarh", name: "Chandigarh / Mohali", hindiName: "चंडीगढ़ / मोहाली", state: "Punjab/Haryana", lat: 30.7333, lng: 76.7794, aliases: ["chandigarh", "mohali", "panchkula", "tricity"] },
  { id: "jaipur", name: "Jaipur", hindiName: "जयपुर", state: "Rajasthan", lat: 26.9124, lng: 75.7873, aliases: ["jaipur", "amer", "pink city"] },
  { id: "mumbai", name: "Mumbai / Navi Mumbai", hindiName: "मुंबई", state: "Maharashtra", lat: 19.0760, lng: 72.8777, aliases: ["mumbai", "bombay", "navi mumbai", "thane"] },
  { id: "pune", name: "Pune", hindiName: "पुणे", state: "Maharashtra", lat: 18.5204, lng: 73.8567, aliases: ["pune", "pcmc", "hinjawadi"] },
  { id: "bengaluru", name: "Bengaluru", hindiName: "बेंगलुरु", state: "Karnataka", lat: 12.9716, lng: 77.5946, aliases: ["bengaluru", "bangalore"] },
  { id: "hyderabad", name: "Hyderabad", hindiName: "हैदराबाद", state: "Telangana", lat: 17.3850, lng: 78.4867, aliases: ["hyderabad", "secunderabad", "cyberabad"] },
  { id: "chennai", name: "Chennai", hindiName: "चेन्नई", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707, aliases: ["chennai", "madras"] },
  { id: "kolkata", name: "Kolkata", hindiName: "कोलकाता", state: "West Bengal", lat: 22.5726, lng: 88.3639, aliases: ["kolkata", "calcutta", "howrah"] },
  { id: "ahmedabad", name: "Ahmedabad", hindiName: "अहमदाबाद", state: "Gujarat", lat: 23.0225, lng: 72.5714, aliases: ["ahmedabad", "gandhinagar"] },
  { id: "lucknow", name: "Lucknow", hindiName: "लखनऊ", state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462, aliases: ["lucknow"] },
  { id: "varanasi", name: "Varanasi", hindiName: "वाराणसी", state: "Uttar Pradesh", lat: 25.3176, lng: 82.9739, aliases: ["varanasi", "kashi", "banaras"] },
  { id: "goa", name: "Goa (North/South)", hindiName: "गोवा", state: "Goa", lat: 15.2993, lng: 74.1240, aliases: ["goa", "panaji", "madgaon", "anjuna"] },
  { id: "kochi", name: "Kochi", hindiName: "कोच्चि", state: "Kerala", lat: 9.9312, lng: 76.2673, aliases: ["kochi", "cochin", "ernakulam"] },
  { id: "dharamshala", name: "Dharamshala / Kangra", hindiName: "धर्मशाला / कांगड़ा", state: "Himachal Pradesh", lat: 32.2190, lng: 76.3234, aliases: ["dharamshala", "mcleod ganj", "kangra"] },
  { id: "manali", name: "Manali / Kullu", hindiName: "मनाली / कुल्लू", state: "Himachal Pradesh", lat: 32.2396, lng: 77.1887, aliases: ["manali", "kullu", "naggar"] },
];

export const SEEDED_ONE_DAY_PLANS: OneDayPlan[] = [
  // =========================================================================
  // PLANS FROM DELHI NCR (10+ realistic options classified by feasibility)
  // =========================================================================
  {
    id: "delhi-murthal-haveli",
    title: "Murthal GT Karnal Road Dhaba & Haveli Run",
    hindiTitle: "मुरथल जीटी रोड ढाबा व हवेली राइड",
    tagline: "Dawn sprint on GT Karnal Road, steaming tandoori white-butter parathas, and Punjabi village carnival.",
    originCity: "Delhi NCR",
    destinationArea: "Murthal & GT Road NH-44",
    vibes: ["Food", "Road Trip", "Friends", "Student Budget", "Chill"],
    primaryTransport: "Bike",
    totalDistanceKm: 110,
    totalTravelTime: "2.5 Hours total round-trip driving",
    departureTime: "05:30 AM",
    returnTime: "01:30 PM",
    baseBudgetPerPerson: 550,
    idealGroupSize: "2 – 6 Friends",
    feasibility: "COMFORTABLE",
    feasibilityReason: "Short 55 km stretch on 8-lane NH-44. Beat all Delhi rush hour by rolling at dawn and return comfortably by early afternoon.",
    budgetBreakdown: {
      transportFuel: 200,
      foodSnacks: 300,
      activityTickets: 0,
      parkingTolls: 50,
      miscEmergency: 0,
    },
    studentHacks: [
      "Car pool 4 to a car (fuel + toll ₹150/head) or ride 2-up on motorcycles.",
      "Amrik Sukhdev serves unlimited spicy green chutney and white butter refills with every paratha plate."
    ],
    packingItems: ["Driving License & RC", "Sunglasses", "Water Bottle", "Power Bank", "Light Windbreaker for dawn ride"],
    rentals: [
      {
        providerName: "Royal Brothers Delhi Hub",
        vehicleType: "Scooter (Activa/Jupiter)",
        location: "Karol Bagh & Kashmiri Gate Metro",
        approxRatePerDay: 499,
        pricingUnit: "per day",
        verificationStatus: "VERIFIED",
        contactOrBookingTip: "Book via official app. Aadhaar + DL required.",
        phone: "+91-9019595595",
        securityDeposit: 1000,
        includedKmPerDay: 150,
        extraKmRate: 4,
        fuelPolicy: "Same-to-Same",
        operatingHours: "07:00 AM – 10:00 PM",
        requiredDocuments: ["Valid Driving License", "Aadhaar Card"],
        fuelEstimate: 300,
        helmetIncluded: true,
      },
      {
        providerName: "StoneheadBikes Delhi",
        vehicleType: "Royal Enfield / Cruiser",
        location: "Karol Bagh & Mahipalpur",
        approxRatePerDay: 1100,
        pricingUnit: "per day",
        verificationStatus: "VERIFIED",
        contactOrBookingTip: "Reserve 1 day prior for weekend dawn runs.",
        phone: "+91-8800371553",
        securityDeposit: 3000,
        includedKmPerDay: 200,
        extraKmRate: 6,
        fuelPolicy: "Self-fuel",
        operatingHours: "06:00 AM – 09:00 PM",
        requiredDocuments: ["Original Passport / Voter ID", "Valid 2-Wheeler License"],
        fuelEstimate: 450,
        helmetIncluded: true,
      }
    ],
    poiHighlights: [
      { category: "dhaba", name: "Amrik Sukhdev 24x7 Oasis", location: "Murthal Mile 52", highwayOrLandmark: "NH-44 GT Karnal Road", note: "Signature aloo pyaaz tandoori paratha + kulhad chai.", provenance: "VERIFIED", lat: 29.0280, lng: 77.0700 },
      { category: "fuel", name: "Indian Oil COCO 24x7 Highway Fuel", location: "Kundli Border", highwayOrLandmark: "NH-44 Entry", note: "High speed diesel/petrol + digital tyre air.", provenance: "VERIFIED", lat: 28.8750, lng: 77.1350 },
      { category: "pharmacy", name: "Apollo 24x7 Highway Meds", location: "Sonipat Flyover", highwayOrLandmark: "NH-44", note: "First aid, motion sickness & rehydration.", provenance: "DATABASE", lat: 28.9800, lng: 77.0900 },
      { category: "beverage_store", name: "Haryana State L-2 Wine & Beer Shop", location: "Kundli Border", highwayOrLandmark: "GT Road Border Exit", note: "Authorized state retail store with sealed receipt.", provenance: "VERIFIED", lat: 28.8710, lng: 77.1320 }
    ],
    stops: [
      {
        id: "murt-1",
        order: 1,
        timeSlot: "05:30 AM – 06:45 AM",
        period: "DAWN",
        name: "Dawn GT Road Departure",
        hindiName: "सुबह की खुली सड़क राइड",
        category: "chai_break",
        activityTitle: "Breeze through Mukarba Chowk to Sonipat",
        description: "Roll out while the city sleeps. Catch the crisp morning air as the 8-lane highway opens up past Singhu border.",
        estimatedDuration: "1.25 Hours",
        approxCostPerPerson: 50,
        locationName: "NH-44 Corridor",
        distanceFromPrevKm: 45,
        localTip: "Start before 6:00 AM to enjoy an entirely traffic-free highway sprint.",
        lat: 28.8500,
        lng: 77.1200,
        imageUrl: "/images/nearby/transport/transport.webp"
      },
      {
        id: "murt-2",
        order: 2,
        timeSlot: "07:00 AM – 09:30 AM",
        period: "MORNING",
        name: "Amrik Sukhdev / Mannat Paratha Feast",
        hindiName: "मुरथल मक्खन पराठा नाश्ता",
        category: "food",
        activityTitle: "Tandoori Parathas Smothered in Farm Butter",
        description: "Hot crispy parathas fresh off the tandoor, melting white butter, spicy mixed pickle, and thick sweet creamy lassi.",
        estimatedDuration: "2.5 Hours",
        approxCostPerPerson: 250,
        locationName: "Amrik Sukhdev Complex",
        distanceFromPrevKm: 15,
        localTip: "Try the Gobhi-Paneer mix paratha with sweet kulhad malai lassi.",
        lat: 29.0280,
        lng: 77.0700,
        imageUrl: "/images/places/universal/food.webp"
      },
      {
        id: "murt-3",
        order: 3,
        timeSlot: "10:00 AM – 12:00 PM",
        period: "MIDDAY",
        name: "Haveli Heritage Punjab Experience",
        hindiName: "हवेली सांस्कृतिक पड़ाव",
        category: "chill",
        activityTitle: "Punjabi Village Courtyard & Jutti Stalls",
        description: "Wander through the recreated heritage courtyard, take photos with classic trucks, and grab authentic Kaju jalebi.",
        estimatedDuration: "2.0 Hours",
        approxCostPerPerson: 150,
        locationName: "Haveli Murthal",
        distanceFromPrevKm: 2,
        localTip: "Pick up fresh Mathura style peda and dry fruit cookies from the bazaar.",
        lat: 29.0350,
        lng: 77.0730,
        imageUrl: "/images/places/universal/heritage.webp"
      }
    ]
  },
  {
    id: "delhi-damdama-sohna",
    title: "Damdama Lake & Aravalli Offroad Escape",
    hindiTitle: "दमदमा झील व अरावली सफारी",
    tagline: "Spontaneous lakeside chill, rock ridge trails, natural sulphur spring dip, and rustic dhaba dining.",
    originCity: "Delhi NCR",
    destinationArea: "Sohna & Damdama Valley",
    vibes: ["Nature", "Road Trip", "Chill", "Water", "Friends"],
    primaryTransport: "Car",
    totalDistanceKm: 90,
    totalTravelTime: "2.0 Hours total driving",
    departureTime: "07:00 AM",
    returnTime: "05:30 PM",
    baseBudgetPerPerson: 750,
    idealGroupSize: "3 – 5 Friends",
    feasibility: "COMFORTABLE",
    feasibilityReason: "Just 45 km from South Delhi/Gurgaon via Gurgaon-Sohna elevated expressway. Relaxed full day with zero highway fatigue.",
    budgetBreakdown: {
      transportFuel: 250,
      foodSnacks: 350,
      activityTickets: 100,
      parkingTolls: 50,
      miscEmergency: 0,
    },
    studentHacks: [
      "Carry your own badminton/frisbee and picnic mat to set up free camp on the lakeshore.",
      "Take the new Sohna Elevated Road (NH-248A) to skip Gurgaon city signals completely."
    ],
    packingItems: ["Comfortable Walking Shoes", "Picnic Blanket", "Sunscreen", "Camera", "Cash"],
    rentals: [
      {
        providerName: "Zoomcar Hub Gurgaon Cyber City",
        vehicleType: "Hatchback / Sedan",
        location: "Cyber City & Golf Course Road",
        approxRatePerDay: 1400,
        pricingUnit: "per day",
        verificationStatus: "VERIFIED",
        contactOrBookingTip: "Keyless entry via Zoomcar app.",
        securityDeposit: 0,
        includedKmPerDay: 120,
        extraKmRate: 9,
        fuelPolicy: "Self-fuel",
        operatingHours: "24x7",
        requiredDocuments: ["Driving License (Min 1 yr old)", "Aadhaar Card"],
        fuelEstimate: 600,
        helmetIncluded: false,
      }
    ],
    poiHighlights: [
      { category: "viewpoint", name: "Damdama Lake Ridge Viewpoint", location: "Damdama", highwayOrLandmark: "Sohna Lake Road", note: "Panoramic views of Aravalli hill ranges reflecting in lake.", provenance: "VERIFIED", lat: 28.3100, lng: 77.0600 },
      { category: "dhaba", name: "Sohna Highway King & Dal Bati", location: "Sohna Bypass", highwayOrLandmark: "NH-248A", note: "Crispy tandoori rotis & hot kadhai paneer.", provenance: "DATABASE", lat: 28.2500, lng: 77.0700 },
      { category: "fuel", name: "HP Petrol Pump 24x7", location: "Badshahpur", highwayOrLandmark: "Sohna Road", note: "Clean rest areas & snacks.", provenance: "VERIFIED", lat: 28.3800, lng: 77.0500 }
    ],
    stops: [
      {
        id: "damd-1",
        order: 1,
        timeSlot: "07:00 AM – 08:30 AM",
        period: "MORNING",
        name: "Aravalli Sunrise Cruise",
        hindiName: "अरावली सुबह की ड्राइव",
        category: "scenic",
        activityTitle: "Drive along the Aravalli Valley Ridge",
        description: "Smooth glide along the Sohna elevated corridor overlooking the ancient rocky hill forests.",
        estimatedDuration: "1.5 Hours",
        approxCostPerPerson: 100,
        locationName: "Sohna Elevated Highway",
        distanceFromPrevKm: 35,
        localTip: "Take the Badshahpur bypass exit for scenic village roads.",
        lat: 28.3500,
        lng: 77.0500,
        imageUrl: "/images/nearby/nature/nature.webp"
      },
      {
        id: "damd-2",
        order: 2,
        timeSlot: "09:00 AM – 01:00 PM",
        period: "MIDDAY",
        name: "Damdama Lake & Nature Walks",
        hindiName: "दमदमा झील नौकायन व सैर",
        category: "chill",
        activityTitle: "Boating, Lakeside Picnic & Hill Scramble",
        description: "Relax by Haryana's biggest natural lake, rent pedal boats, and scramble up rocky Aravalli spurs.",
        estimatedDuration: "4.0 Hours",
        approxCostPerPerson: 250,
        locationName: "Damdama Lakefront",
        distanceFromPrevKm: 15,
        localTip: "Boating is best before midday sun; carry shade hats.",
        lat: 28.3100,
        lng: 77.0600,
        imageUrl: "/images/places/universal/nature.webp"
      },
      {
        id: "damd-3",
        order: 3,
        timeSlot: "01:30 PM – 04:00 PM",
        period: "AFTERNOON",
        name: "Sohna Hot Springs & Village Lunch",
        hindiName: "सोहना सल्फर कुंड व ढाबा भोजन",
        category: "food",
        activityTitle: "Ancient Sulphur Springs & Desi Ghee Dhaba",
        description: "Visit the historic natural sulphur spring baths and feast on authentic bajra roti with garlic chutney.",
        estimatedDuration: "2.5 Hours",
        approxCostPerPerson: 300,
        locationName: "Sohna Town & Dhaba Corridor",
        distanceFromPrevKm: 12,
        localTip: "Ask for local white butter and jaggery with bajra roti.",
        lat: 28.2500,
        lng: 77.0700,
        imageUrl: "/images/places/universal/food.webp"
      }
    ]
  },
  {
    id: "delhi-neemrana-fort",
    title: "Sunrise Highway Dhaba + Aravalli Hill Fort",
    hindiTitle: "सूर्योदय ढाबा + नीमराना अरावली किला",
    tagline: "Early morning parathas, breezy highway ride, and sunset atop a 15th-century cliff fort.",
    originCity: "Delhi NCR",
    destinationArea: "NH-48 Corridor & Neemrana",
    vibes: ["Road Trip", "Food", "Forts", "Friends"],
    primaryTransport: "Car",
    totalDistanceKm: 240,
    totalTravelTime: "4.5 Hours total driving",
    departureTime: "06:00 AM",
    returnTime: "08:30 PM",
    baseBudgetPerPerson: 1100,
    idealGroupSize: "3 – 5 Friends",
    feasibility: "COMFORTABLE",
    feasibilityReason: "Early 6 AM departure beats Gurgaon toll traffic. 3.5 hrs leisurely exploration at Neemrana with return by 8:30 PM.",
    budgetBreakdown: {
      transportFuel: 450,
      foodSnacks: 400,
      activityTickets: 150,
      parkingTolls: 100,
      miscEmergency: 0,
    },
    studentHacks: [
      "Pool 4 friends in one hatchback to reduce per-person fuel & toll cost to ₹500.",
      "Explore the 9-storey Neemrana Stepwell (free entry) right beside the fort palace."
    ],
    packingItems: ["Comfortable shoes for 170 stepwell stairs", "Water Bottle", "Sunglasses", "Fastag on vehicle"],
    rentals: [
      {
        providerName: "Zoomcar Cyber Hub Hub",
        vehicleType: "Hatchback / Sedan",
        location: "Gurgaon Cyber Hub & IGI T3 Metro",
        approxRatePerDay: 1600,
        pricingUnit: "per day",
        verificationStatus: "VERIFIED",
        contactOrBookingTip: "Reserve via app; fuel included plans available.",
        securityDeposit: 0,
        includedKmPerDay: 200,
        extraKmRate: 9,
        fuelPolicy: "Same-to-Same",
        operatingHours: "24x7",
        requiredDocuments: ["Driving License", "Aadhaar Card"],
        fuelEstimate: 1200,
        helmetIncluded: false,
      }
    ],
    poiHighlights: [
      { category: "dhaba", name: "Old Rao Hotel & Dhaba", location: "NH-48 Dharuhera", highwayOrLandmark: "Mile 68 Highway", note: "Famous for crispy thali, stuffed parathas, and cold lassi.", provenance: "VERIFIED", lat: 28.2100, lng: 76.7900 },
      { category: "fuel", name: "Indian Oil COCO 24x7 Oasis", location: "Manesar Toll", highwayOrLandmark: "NH-48 KMP Junction", note: "Clean washrooms, air pump & ATM.", provenance: "VERIFIED", lat: 28.3500, lng: 76.9200 },
      { category: "beverage_store", name: "Discovery Premium Retail & Wine Store", location: "Gurgaon Border / NH-48", highwayOrLandmark: "Exit 18 Gurgaon", note: "Authorized state retail store for highway road trips.", provenance: "VERIFIED", lat: 28.4600, lng: 77.0600 },
      { category: "pharmacy", name: "Apollo 24x7 Highway Care", location: "Dharuhera", highwayOrLandmark: "Main Flyover", note: "First aid, motion sickness pills & hydration salts.", provenance: "DATABASE", lat: 28.2050, lng: 76.7850 }
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
        lat: 28.3200,
        lng: 76.8800,
        imageUrl: "/images/nearby/transport/transport.webp"
      },
      {
        id: "del-stop-2",
        order: 2,
        timeSlot: "08:00 AM – 09:30 AM",
        period: "MORNING",
        name: "Old Rao Hotel Highway Feast",
        hindiName: "तंदूरी पराठा नाश्ता",
        category: "food",
        activityTitle: "Tandoori Parathas & Fresh White Makhan",
        description: "Crispy tandoori parathas smothered in fresh farm butter, spicy green chutney, sweet lassi, and pickle.",
        estimatedDuration: "1.5 Hours",
        approxCostPerPerson: 220,
        locationName: "Old Rao Dhaba Dharuhera",
        distanceFromPrevKm: 35,
        localTip: "Order sweet malai lassi to stay refreshed throughout the drive.",
        lat: 28.2100,
        lng: 76.7900,
        imageUrl: "/images/places/universal/food.webp"
      },
      {
        id: "del-stop-3",
        order: 3,
        timeSlot: "11:00 AM – 02:30 PM",
        period: "MIDDAY",
        name: "Neemrana 9-Storey Stepwell (Baori)",
        hindiName: "नीमराना 9-मंज़िला बावड़ी",
        category: "heritage",
        activityTitle: "Explore 9-Storey Subterranean Stepwell",
        description: "Wander down the magnificent 16th-century deep stepwell with 170 stone steps, then take in panoramic desert views from the hill ridge.",
        estimatedDuration: "3.5 Hours",
        approxCostPerPerson: 100,
        locationName: "Neemrana Baori & Fort Ridge",
        distanceFromPrevKm: 60,
        localTip: "Neemrana Baori is open and free to explore; great natural cooling in mid-afternoon.",
        lat: 27.9890,
        lng: 76.3860,
        imageUrl: "/images/places/universal/heritage.webp"
      }
    ]
  },
  {
    id: "delhi-mathura-vrindavan",
    title: "Mathura Yamuna Ghats, Banke Bihari & Peda Run",
    hindiTitle: "मथुरा–वृंदावन घाट आरती व बांके बिहारी",
    tagline: "Smooth Yamuna Expressway sprint, sacred ghats, soul-stirring darshan, and legendary Mathura pedas.",
    originCity: "Delhi NCR",
    destinationArea: "Mathura & Vrindavan",
    vibes: ["Spiritual", "Food", "Temples", "Road Trip", "Friends"],
    primaryTransport: "Car",
    totalDistanceKm: 330,
    totalTravelTime: "5.5 Hours total round-trip driving",
    departureTime: "05:30 AM",
    returnTime: "09:00 PM",
    baseBudgetPerPerson: 950,
    idealGroupSize: "2 – 5 Friends",
    feasibility: "COMFORTABLE",
    feasibilityReason: "Yamuna Expressway allows a steady 100 km/h drive taking only 2.5 hrs to Vrindavan. Ample time for temple darshan and sunset Yamuna boat ride.",
    budgetBreakdown: {
      transportFuel: 400,
      foodSnacks: 350,
      activityTickets: 100,
      parkingTolls: 100,
      miscEmergency: 0,
    },
    studentHacks: [
      "Yamuna Expressway toll is ₹325 one-way; split 4 ways is only ₹80/head.",
      "Visit Banke Bihari temple between 08:30 AM – 11:30 AM or 05:30 PM – 08:30 PM (temple closes midday)."
    ],
    packingItems: ["Shoe Bag for Temples", "Modest Clothes", "Cash for Prashad & Rickshaws", "ID Card"],
    rentals: [
      {
        providerName: "Zoomcar Noida Sector 18",
        vehicleType: "Hatchback / Sedan",
        location: "Noida Botanical Garden Metro",
        approxRatePerDay: 1500,
        pricingUnit: "per day",
        verificationStatus: "VERIFIED",
        contactOrBookingTip: "Direct expressway exit access from Noida.",
        securityDeposit: 0,
        includedKmPerDay: 250,
        extraKmRate: 9,
        fuelPolicy: "Same-to-Same",
        operatingHours: "24x7",
        requiredDocuments: ["Driving License", "Aadhaar Card"],
        fuelEstimate: 1400,
        helmetIncluded: false,
      }
    ],
    poiHighlights: [
      { category: "temple", name: "Banke Bihari Temple", location: "Vrindavan Old Town", highwayOrLandmark: "Banke Bihari Marg", note: "Ancient self-manifested deity of Lord Krishna.", provenance: "VERIFIED", lat: 27.5800, lng: 77.7000 },
      { category: "food", name: "Brijwasi Mithai & Peda Wala", location: "Chhatta Bazaar Mathura", highwayOrLandmark: "Near Vishram Ghat", note: "Authentic roasted khoya Mathura pedas.", provenance: "VERIFIED", lat: 27.4950, lng: 77.6800 },
      { category: "fuel", name: "Indian Oil Swagat 24x7 Oasis", location: "Yamuna Expressway Milestone 65", highwayOrLandmark: "YEW Plaza", note: "Clean washrooms, food court & petrol pump.", provenance: "VERIFIED", lat: 27.8500, lng: 77.6500 }
    ],
    stops: [
      {
        id: "math-1",
        order: 1,
        timeSlot: "05:30 AM – 08:00 AM",
        period: "DAWN",
        name: "Yamuna Expressway Dawn Run",
        hindiName: "यमुना एक्सप्रेसवे प्रातःकालीन प्रस्थान",
        category: "chai_break",
        activityTitle: "Cruise along 6-Lane Expressway to Vrindavan",
        description: "Smooth non-stop cruise over Yamuna expressway with sunrise views over UP farm fields.",
        estimatedDuration: "2.5 Hours",
        approxCostPerPerson: 80,
        locationName: "Yamuna Expressway Milestone 65",
        distanceFromPrevKm: 140,
        localTip: "Take the Vrindavan toll cut to bypass Mathura city traffic completely.",
        lat: 27.7000,
        lng: 77.6800,
        imageUrl: "/images/nearby/transport/transport.webp"
      },
      {
        id: "math-2",
        order: 2,
        timeSlot: "08:30 AM – 11:30 AM",
        period: "MORNING",
        name: "Banke Bihari & Nidhivan Darshan",
        hindiName: "बांके बिहारी व निधिवन दर्शन",
        category: "temple",
        activityTitle: "Temple Darshan, Kheer & Kachori Breakfast",
        description: "Experience the devotional atmosphere of Vrindavan, hot bedmi puri with hing aloo sabzi, and fresh malai lassi.",
        estimatedDuration: "3.0 Hours",
        approxCostPerPerson: 200,
        locationName: "Vrindavan Temple Quarter",
        distanceFromPrevKm: 25,
        localTip: "Beware of mischievous monkeys: store spectacles and phones in bags.",
        lat: 27.5800,
        lng: 77.7000,
        imageUrl: "/images/places/universal/spiritual.webp"
      },
      {
        id: "math-3",
        order: 3,
        timeSlot: "04:30 PM – 07:00 PM",
        period: "SUNSET",
        name: "Vishram Ghat Yamuna Sunset Aarti",
        hindiName: "विश्राम घाट यमुना सूर्यास्त आरती",
        category: "sunset",
        activityTitle: "Evening Boat Ride & Grand Maha Aarti",
        description: "Wooden boat glide along Mathura's 25 sacred ghats, floating diyas on the Yamuna, and evening bell chanting.",
        estimatedDuration: "2.5 Hours",
        approxCostPerPerson: 180,
        locationName: "Vishram Ghat Mathura",
        distanceFromPrevKm: 15,
        localTip: "Take a shared wooden boat for ₹50/head for the best sunset view.",
        lat: 27.4950,
        lng: 77.6800,
        imageUrl: "/images/places/universal/spiritual.webp"
      }
    ]
  },
  {
    id: "delhi-agra-taj-expressway",
    title: "Agra Taj Mahal Sunrise & Mehtab Bagh Sunset",
    hindiTitle: "आगरा ताजमहल व मेहताब बाग़ एक्सप्रेसवे",
    tagline: "3-hour expressway zip, marble monument of love, petha feast, and Yamuna reflection sunset.",
    originCity: "Delhi NCR",
    destinationArea: "Agra Heritage Corridor",
    vibes: ["History", "Forts", "Road Trip", "Photo Trip", "Friends"],
    primaryTransport: "Car",
    totalDistanceKm: 440,
    totalTravelTime: "6.5 Hours total round-trip driving",
    departureTime: "05:00 AM",
    returnTime: "09:30 PM",
    baseBudgetPerPerson: 1350,
    idealGroupSize: "3 – 5 Friends",
    feasibility: "COMFORTABLE",
    feasibilityReason: "Yamuna Expressway connects Delhi to Agra in 3.0 hrs each way. Full day gives 5 hours for Taj Mahal, Agra Fort, and Mehtab Bagh.",
    budgetBreakdown: {
      transportFuel: 600,
      foodSnacks: 450,
      activityTickets: 150,
      parkingTolls: 150,
      miscEmergency: 0,
    },
    studentHacks: [
      "Taj Mahal entry is free for kids under 15; Indian student ID carries ticket concessions.",
      "Visit Mehtab Bagh across the river at sunset for stunning rear views of the Taj with zero crowd."
    ],
    packingItems: ["Valid Govt Photo ID (Mandatory for Taj Entry)", "Shoe Covers", "Sunglasses", "Power Bank"],
    rentals: [
      {
        providerName: "Avis / Zoomcar Delhi NCR",
        vehicleType: "Hatchback / Sedan",
        location: "Delhi Aerocity & South Delhi Hubs",
        approxRatePerDay: 1800,
        pricingUnit: "per day",
        verificationStatus: "VERIFIED",
        contactOrBookingTip: "Unlimited km package recommended for 440 km round trip.",
        securityDeposit: 0,
        includedKmPerDay: 450,
        extraKmRate: 10,
        fuelPolicy: "Same-to-Same",
        operatingHours: "24x7",
        requiredDocuments: ["Driving License", "Aadhaar / Passport"],
        fuelEstimate: 2200,
        helmetIncluded: false,
      }
    ],
    poiHighlights: [
      { category: "viewpoint", name: "Mehtab Bagh Sunset Vantage", location: "Nagla Devjit", highwayOrLandmark: "Across Yamuna River", note: "Famous reflection spot for Taj Mahal at twilight.", provenance: "VERIFIED", lat: 27.1800, lng: 78.0450 },
      { category: "food", name: "Panchi Petha Main Store", location: "Hari Parbat Agra", highwayOrLandmark: "MG Road", note: "Famous authentic Kesar, Angoori, and Pan pethas.", provenance: "VERIFIED", lat: 27.1950, lng: 78.0050 },
      { category: "fuel", name: "Yamuna Expressway Toll Plaza Fuel & Oasis", location: "Milestone 110", highwayOrLandmark: "YEW", note: "Clean bathrooms, Subway, Costa Coffee.", provenance: "VERIFIED", lat: 27.4500, lng: 77.8500 }
    ],
    stops: [
      {
        id: "agra-1",
        order: 1,
        timeSlot: "05:00 AM – 08:30 AM",
        period: "DAWN",
        name: "Expressway Dawn Cruise to Agra",
        hindiName: "सुबह की एक्सप्रेसवे यात्रा",
        category: "chai_break",
        activityTitle: "Direct High-Speed Drive to Taj East Gate",
        description: "Beat Delhi rush and catch the early morning mist rolling over the Chambal and Yamuna plains.",
        estimatedDuration: "3.5 Hours",
        approxCostPerPerson: 100,
        locationName: "Yamuna Expressway & Taj East Gate",
        distanceFromPrevKm: 210,
        localTip: "Park at Taj East Gate parking and take electric golf carts to the monument gate.",
        lat: 27.1750,
        lng: 78.0420,
        imageUrl: "/images/nearby/transport/transport.webp"
      },
      {
        id: "agra-2",
        order: 2,
        timeSlot: "09:00 AM – 01:00 PM",
        period: "MORNING",
        name: "Taj Mahal Marble Wonder Exploration",
        hindiName: "ताजमहल दर्शन व वास्तुकला",
        category: "heritage",
        activityTitle: "Marvel at UNESCO World Heritage Monument",
        description: "Walk past the Charbagh Mughal gardens, examine intricate pietra dura marble inlays, and take classic reflection photos.",
        estimatedDuration: "4.0 Hours",
        approxCostPerPerson: 250,
        locationName: "Taj Mahal Precinct",
        distanceFromPrevKm: 2,
        localTip: "Drone cameras, tripods, and food items are strictly prohibited inside security.",
        lat: 27.1750,
        lng: 78.0420,
        imageUrl: "/images/places/delhi/humayuns-tomb.webp"
      },
      {
        id: "agra-3",
        order: 3,
        timeSlot: "04:30 PM – 06:30 PM",
        period: "SUNSET",
        name: "Mehtab Bagh Sunset Across Yamuna",
        hindiName: "मेहताब बाग़ से सूर्यास्त दर्शन",
        category: "sunset",
        activityTitle: "Sunset Reflection & Panchi Petha Tasting",
        description: "Watch the Taj Mahal glow from golden to soft violet across the tranquil waters of the Yamuna River.",
        estimatedDuration: "2.0 Hours",
        approxCostPerPerson: 150,
        locationName: "Mehtab Bagh",
        distanceFromPrevKm: 12,
        localTip: "Buy authentic sealed Panchi Petha from authorized stores on MG Road before driving back.",
        lat: 27.1800,
        lng: 78.0450,
        imageUrl: "/images/places/universal/heritage.webp"
      }
    ]
  },
  {
    id: "delhi-haridwar-rishikesh",
    title: "Delhi to Haridwar Ganga Aarti & Rishikesh Rapids",
    hindiTitle: "हरिद्वार गंगा आरती व ऋषिकेश एक दिवसीय",
    tagline: "Delhi-Meerut Expressway dash, holy dip at Har Ki Pauri, and sunset breeze at Ram Jhula.",
    originCity: "Delhi NCR",
    destinationArea: "Haridwar & Rishikesh Foothills",
    vibes: ["Spiritual", "Road Trip", "Rivers", "Friends", "Adventure"],
    primaryTransport: "Car",
    totalDistanceKm: 480,
    totalTravelTime: "8.5 Hours total round-trip driving",
    departureTime: "05:00 AM",
    returnTime: "11:00 PM",
    baseBudgetPerPerson: 1450,
    idealGroupSize: "3 – 5 Friends",
    feasibility: "TIGHT",
    feasibilityReason: "Delhi-Meerut Expressway + NH-334 takes 4.0 hrs each way. Requires strict 5 AM departure to comfortably complete holy dip and evening aarti before returning by 11 PM.",
    budgetBreakdown: {
      transportFuel: 700,
      foodSnacks: 450,
      activityTickets: 150,
      parkingTolls: 150,
      miscEmergency: 0,
    },
    studentHacks: [
      "Use the newly opened Delhi-Dehradun Expressway sections to bypass Meerut city congestion.",
      "Eat famous Chotiwala thali or street chole bhature at Haridwar railway bazaar."
    ],
    packingItems: ["Towel & Extra Clothes for Holy Dip", "Slippers", "Water Bottle", "Driving License"],
    rentals: [
      {
        providerName: "Zoomcar Delhi East Hub",
        vehicleType: "Hatchback / Sedan",
        location: "Akshardham Metro & Anand Vihar",
        approxRatePerDay: 1700,
        pricingUnit: "per day",
        verificationStatus: "VERIFIED",
        contactOrBookingTip: "Pick up directly at Akshardham for instant expressway entry.",
        securityDeposit: 0,
        includedKmPerDay: 500,
        extraKmRate: 10,
        fuelPolicy: "Same-to-Same",
        operatingHours: "24x7",
        requiredDocuments: ["Driving License", "Aadhaar Card"],
        fuelEstimate: 2400,
        helmetIncluded: false,
      }
    ],
    poiHighlights: [
      { category: "temple", name: "Har Ki Pauri Ghat", location: "Haridwar", highwayOrLandmark: "Upper Ganga Canal", note: "Most sacred bathing ghat on the Ganges with evening Maha Aarti.", provenance: "VERIFIED", lat: 29.9550, lng: 78.1700 },
      { category: "cafe", name: "Little Buddha Cafe", location: "Lakshman Jhula", highwayOrLandmark: "Tapovan", note: "Treehouse cafe overlooking emerald river.", provenance: "VERIFIED", lat: 30.1250, lng: 78.3250 },
      { category: "fuel", name: "HP Highway Oasis 24x7", location: "Muzaffarnagar Bypass", highwayOrLandmark: "NH-334", note: "Clean restrooms, food court & tyre service.", provenance: "VERIFIED", lat: 29.4700, lng: 77.7000 }
    ],
    stops: [
      {
        id: "hari-1",
        order: 1,
        timeSlot: "05:00 AM – 09:30 AM",
        period: "DAWN",
        name: "Expressway Sprint to Haridwar",
        hindiName: "सुबह की एक्सप्रेसवे ड्राइव",
        category: "chai_break",
        activityTitle: "Delhi-Meerut Expressway to Haridwar Gates",
        description: "Swift morning ride as green sugarcane fields give way to the Shivalik foothills.",
        estimatedDuration: "4.5 Hours",
        approxCostPerPerson: 100,
        locationName: "NH-334 Corridor",
        distanceFromPrevKm: 220,
        localTip: "Stop at Cheetal Grand on Muzaffarnagar bypass for hot filter coffee and paneer pakodas.",
        lat: 29.7000,
        lng: 77.9000,
        imageUrl: "/images/nearby/transport/transport.webp"
      },
      {
        id: "hari-2",
        order: 2,
        timeSlot: "10:00 AM – 01:30 PM",
        period: "MORNING",
        name: "Holy Dip & Brahmakund Darshan",
        hindiName: "हर की पौड़ी पावन स्नान",
        category: "temple",
        activityTitle: "Sacred Ganges Bath & Street Food",
        description: "Take a revitalizing dip in the crystal cold currents of the Ganga at Har Ki Pauri and enjoy hot kachori jalebi.",
        estimatedDuration: "3.5 Hours",
        approxCostPerPerson: 200,
        locationName: "Har Ki Pauri Ghats",
        distanceFromPrevKm: 15,
        localTip: "Use the changing rooms on the island ghats for privacy.",
        lat: 29.9550,
        lng: 78.1700,
        imageUrl: "/images/places/rishikesh/triveni-ghat.webp"
      },
      {
        id: "hari-3",
        order: 3,
        timeSlot: "05:30 PM – 07:00 PM",
        period: "SUNSET",
        name: "Grand Evening Ganga Aarti",
        hindiName: "हर की पौड़ी संध्या महाआरती",
        category: "sunset",
        activityTitle: "Witness Brass Lamps & Chanting Aarti",
        description: "Hundreds of twilight brass fire aarti lamps illuminating the river as thousands chant Vedic hymns.",
        estimatedDuration: "1.5 Hours",
        approxCostPerPerson: 50,
        locationName: "Har Ki Pauri",
        distanceFromPrevKm: 2,
        localTip: "Take your seats opposite the clock tower by 5:15 PM for an unhindered view.",
        lat: 29.9550,
        lng: 78.1700,
        imageUrl: "/images/places/universal/spiritual.webp"
      }
    ]
  },
  {
    id: "delhi-lansdowne-warning",
    title: "Delhi to Lansdowne Pine Hill Station",
    hindiTitle: "दिल्ली से लैंसडाउन पाइन हिल्स",
    tagline: "Colonial cantonment, oak forests, and Himalayan view points.",
    originCity: "Delhi NCR",
    destinationArea: "Lansdowne Cantonment (Pauri Garhwal)",
    vibes: ["Mountains", "Nature", "Chill", "Road Trip"],
    primaryTransport: "Car",
    totalDistanceKm: 510,
    totalTravelTime: "12.5 Hours total driving (Steep Hill Roads)",
    departureTime: "04:30 AM",
    returnTime: "11:30 PM",
    baseBudgetPerPerson: 1600,
    idealGroupSize: "3 – 5 Friends",
    feasibility: "NOT RECOMMENDED",
    feasibilityReason: "510 km round trip with 5 hours of winding mountain roads between Kotdwar and Lansdowne. Attempting in 1 single day results in 12+ hours of exhausted driving and almost zero leisure time. Recommended minimum: 2 Days / 1 Night.",
    budgetBreakdown: {
      transportFuel: 800,
      foodSnacks: 500,
      activityTickets: 100,
      parkingTolls: 200,
      miscEmergency: 0,
    },
    studentHacks: [
      "Convert this trip to a 2-day weekend stay: camp at Sari village or book GMVN tourist rest house for ₹800/night.",
      "If you only have 1 day, choose Neemrana, Damdama Lake, or Murthal instead."
    ],
    packingItems: ["Warm Jacket", "Motion Sickness Medication", "Fastag", "Driving License"],
    rentals: [],
    poiHighlights: [
      { category: "viewpoint", name: "Tip-in-Top Ridge Viewpoint", location: "Lansdowne", highwayOrLandmark: "Cantonment Ridge", note: "Panoramic views of Chaukhamba and Trishul snow summits.", provenance: "VERIFIED", lat: 29.8400, lng: 78.6800 },
      { category: "fuel", name: "Indian Oil Kotdwar Base", location: "Kotdwar", highwayOrLandmark: "NH-119", note: "Last reliable 24x7 fuel station before steep hill ascent.", provenance: "VERIFIED", lat: 29.7500, lng: 78.5300 }
    ],
    stops: [
      {
        id: "lans-1",
        order: 1,
        timeSlot: "04:30 AM – 10:30 AM",
        period: "DAWN",
        name: "Gruelling 6-Hour Uphill Drive",
        hindiName: "६ घंटे की पहाड़ी यात्रा",
        category: "scenic",
        activityTitle: "Drive via Meerut, Kotdwar and Hill Hairpins",
        description: "Continuous driving over plains and narrow mountain switchbacks.",
        estimatedDuration: "6.0 Hours",
        approxCostPerPerson: 200,
        locationName: "Kotdwar to Lansdowne Ghata",
        distanceFromPrevKm: 255,
        localTip: "Heavy fatigue risk if driving both directions in 24 hours.",
        lat: 29.8000,
        lng: 78.6000,
        imageUrl: "/images/nearby/transport/transport.webp"
      },
      {
        id: "lans-2",
        order: 2,
        timeSlot: "11:00 AM – 03:00 PM",
        period: "MIDDAY",
        name: "Bhulla Tal & Tip-in-Top Stroll",
        hindiName: "भुल्ला ताल व टिप-इन-टॉप",
        category: "nature",
        activityTitle: "Brief Lake Stroll & Pine Wood Viewpoint",
        description: "Short 3-4 hours exploring the small military cantonment before being forced to head back.",
        estimatedDuration: "4.0 Hours",
        approxCostPerPerson: 300,
        locationName: "Bhulla Lake & Tip in Top",
        distanceFromPrevKm: 10,
        localTip: "Very short window of stay compared to 12 hours of total driving.",
        lat: 29.8400,
        lng: 78.6800,
        imageUrl: "/images/places/universal/nature.webp"
      }
    ]
  },

  // =========================================================================
  // PLANS FROM MUMBAI / PUNE
  // =========================================================================
  {
    id: "mumbai-lonavala-khandala",
    title: "Mumbai to Lonavala Tiger Point & Ghat Dhaba Run",
    hindiTitle: "मुंबई से लोनावाला टाइगर पॉइंट व घाट ढाबा",
    tagline: "Scenic Mumbai-Pune Expressway climb, Tiger Point gorge mist, hot chikki, and corn pakodas.",
    originCity: "Mumbai / Navi Mumbai",
    destinationArea: "Lonavala & Khandala Ghats",
    vibes: ["Road Trip", "Food", "Mountains", "Friends", "Waterfalls"],
    primaryTransport: "Car",
    totalDistanceKm: 170,
    totalTravelTime: "3.5 Hours total round-trip driving",
    departureTime: "06:30 AM",
    returnTime: "07:30 PM",
    baseBudgetPerPerson: 850,
    idealGroupSize: "3 – 5 Friends",
    feasibility: "COMFORTABLE",
    feasibilityReason: "Mumbai-Pune Expressway provides an effortless 1.5 hr drive to Khandala exit. Perfect 8 hours of exploration and sunset views.",
    budgetBreakdown: {
      transportFuel: 350,
      foodSnacks: 350,
      activityTickets: 50,
      parkingTolls: 100,
      miscEmergency: 0,
    },
    studentHacks: [
      "Car pool 4 to an Uber/Zoomcar or ride local suburban train from CSMT to Lonavala (₹30 ticket!).",
      "Maganlal Chikki factory store near Lonavala station gives fresh warm peanut fudge samples."
    ],
    packingItems: ["Rain Jacket / Windbreaker", "Driving License", "Camera", "Fastag"],
    rentals: [
      {
        providerName: "Royal Brothers Mumbai Hub",
        vehicleType: "Scooter (Activa/Jupiter)",
        location: "Andheri East & Vashi Navi Mumbai",
        approxRatePerDay: 549,
        pricingUnit: "per day",
        verificationStatus: "VERIFIED",
        contactOrBookingTip: "Reserve via app. Instant pickup at Vashi.",
        phone: "+91-9019595595",
        securityDeposit: 1000,
        includedKmPerDay: 150,
        extraKmRate: 4,
        fuelPolicy: "Same-to-Same",
        operatingHours: "07:00 AM – 10:00 PM",
        requiredDocuments: ["Driving License", "Aadhaar Card"],
        fuelEstimate: 400,
        helmetIncluded: true,
      }
    ],
    poiHighlights: [
      { category: "viewpoint", name: "Tiger's Leap / Tiger Point", location: "Khandala Ridge", highwayOrLandmark: "Aamby Valley Road", note: "Sheer 650m drop with panoramic valley mist.", provenance: "VERIFIED", lat: 18.7300, lng: 73.3800 },
      { category: "food", name: "Rama Krishna Restaurant", location: "Lonavala Main Bazaar", highwayOrLandmark: "Old Mumbai-Pune Highway", note: "Famous for hot South Indian filter coffee & Pav Bhaji.", provenance: "VERIFIED", lat: 18.7500, lng: 73.4100 },
      { category: "fuel", name: "Indian Oil 24x7 Express Plaza", location: "Khalapur Toll", highwayOrLandmark: "Mumbai-Pune Expressway", note: "McDonald's, Starbucks, clean washrooms.", provenance: "VERIFIED", lat: 18.8200, lng: 73.2800 }
    ],
    stops: [
      {
        id: "lona-1",
        order: 1,
        timeSlot: "06:30 AM – 08:30 AM",
        period: "MORNING",
        name: "Expressway Bhor Ghat Climb",
        hindiName: "भोर घाट एक्सप्रेसवे चढ़ाई",
        category: "scenic",
        activityTitle: "Drive through Western Ghats Tunnels",
        description: "Smooth climb up the Western Ghats pass through deep mountain tunnels and misty green hillsides.",
        estimatedDuration: "2.0 Hours",
        approxCostPerPerson: 80,
        locationName: "Bhor Ghat Section",
        distanceFromPrevKm: 75,
        localTip: "Take the Khandala bypass exit for the historic Duke's Nose viewpoint.",
        lat: 18.7600,
        lng: 73.3700,
        imageUrl: "/images/nearby/transport/transport.webp"
      },
      {
        id: "lona-2",
        order: 2,
        timeSlot: "09:00 AM – 01:00 PM",
        period: "MIDDAY",
        name: "Tiger Point & Bhushi Dam Rapids",
        hindiName: "टाइगर पॉइंट व भुशी डैम",
        category: "nature",
        activityTitle: "Valley Mist, Corn Fritters & Waterfall Steps",
        description: "Enjoy hot crispy sweet corn bhajiyas, ginger tea in earthen cups, and sweeping 650m cliffside valley views.",
        estimatedDuration: "4.0 Hours",
        approxCostPerPerson: 250,
        locationName: "Tiger Point Cliff",
        distanceFromPrevKm: 15,
        localTip: "Try the freshly roasted bhutta (spicy corn on the cob) at cliffside stalls.",
        lat: 18.7300,
        lng: 73.3800,
        imageUrl: "/images/places/universal/nature.webp"
      },
      {
        id: "lona-3",
        order: 3,
        timeSlot: "03:00 PM – 06:00 PM",
        period: "SUNSET",
        name: "Karla Buddhist Caves & Chikki Shopping",
        hindiName: "कार्ली बौद्ध गुफाएं व चिक्की",
        category: "heritage",
        activityTitle: "2000-year-old Rock-Cut Buddhist Chaitya",
        description: "Climb up 350 stone steps to explore India's largest ancient rock-cut Buddhist prayer hall dating to 160 BC.",
        estimatedDuration: "3.0 Hours",
        approxCostPerPerson: 150,
        locationName: "Karla Caves Complex",
        distanceFromPrevKm: 12,
        localTip: "Entry is just ₹25 for Indian citizens. Magnificent teak wood roof beams still intact.",
        lat: 18.7800,
        lng: 73.4700,
        imageUrl: "/images/places/universal/heritage.webp"
      }
    ]
  },

  // =========================================================================
  // PLANS FROM DEHRADUN / RISHIKESH
  // =========================================================================
  {
    id: "dehradun-mussoorie-landour",
    title: "Mussoorie Ridge & Landour Bakehouse Day Escape",
    hindiTitle: "मसूरी व लैंडौर बेकहाउस एक दिवसीय सफ़र",
    tagline: "Climb from Doon valley to Queen of the Hills, historic Landour oak forest walk, and Himalayan sunset.",
    originCity: "Dehradun",
    destinationArea: "Mussoorie & Landour Cantonment",
    vibes: ["Mountains", "Cafes", "Nature", "Chill", "Friends"],
    primaryTransport: "Bike",
    totalDistanceKm: 70,
    totalTravelTime: "2.5 Hours total round-trip driving",
    departureTime: "07:30 AM",
    returnTime: "07:30 PM",
    baseBudgetPerPerson: 650,
    idealGroupSize: "2 – 4 Friends",
    feasibility: "COMFORTABLE",
    feasibilityReason: "35 km picturesque mountain drive from Dehradun via Rajpur Road. 8 hours of leisurely walking, cafes, and sunset views.",
    budgetBreakdown: {
      transportFuel: 200,
      foodSnacks: 350,
      activityTickets: 50,
      parkingTolls: 50,
      miscEmergency: 0,
    },
    studentHacks: [
      "Rent an Activa at Dehradun ISBT or Clock Tower for ₹450/day — saves ₹1,500 on taxi fares.",
      "Walk the 3.5 km Landour Infinity Loop on foot under pine canopies (completely free and breathtaking)."
    ],
    packingItems: ["Light Jacket for Landour", "Comfortable Walking Shoes", "Camera", "Driving License"],
    rentals: [
      {
        providerName: "BikeRentals Dehradun Clock Tower",
        vehicleType: "Scooter (Activa/Jupiter)",
        location: "Clock Tower & Paltan Bazaar",
        approxRatePerDay: 450,
        pricingUnit: "per day",
        verificationStatus: "VERIFIED",
        contactOrBookingTip: "Walk-in with DL and Aadhaar card.",
        phone: "+91-9897001122",
        securityDeposit: 1000,
        includedKmPerDay: 100,
        extraKmRate: 4,
        fuelPolicy: "Same-to-Same",
        operatingHours: "07:00 AM – 09:00 PM",
        requiredDocuments: ["Driving License", "Aadhaar Card"],
        fuelEstimate: 200,
        helmetIncluded: true,
      }
    ],
    poiHighlights: [
      { category: "cafe", name: "Landour Bakehouse & Chaar Dukaana", location: "Landour Cantonment", highwayOrLandmark: "Near St. Paul's Church", note: "Historic apple pie, lemon cake & cinnamon crepes.", provenance: "VERIFIED", lat: 30.4600, lng: 78.0900 },
      { category: "viewpoint", name: "Lal Tibba Scenic Binoculars Point", location: "Highest Point Mussoorie", highwayOrLandmark: "Landour Ridge", note: "Telescope views of Bandarpoonch, Kedarnath & Badrinath peaks.", provenance: "VERIFIED", lat: 30.4650, lng: 78.1000 },
      { category: "fuel", name: "HP Petrol Pump Mussoorie Entry", location: "Kincraig Junction", highwayOrLandmark: "Dehradun-Mussoorie Road", note: "Last major fuel station before upper Landour.", provenance: "VERIFIED", lat: 30.4450, lng: 78.0700 }
    ],
    stops: [
      {
        id: "muss-1",
        order: 1,
        timeSlot: "07:30 AM – 09:00 AM",
        period: "MORNING",
        name: "Doon to Mussoorie Hill Climb",
        hindiName: "दून घाटी से मसूरी की चढ़ाई",
        category: "scenic",
        activityTitle: "Scenic Ridge Ascent via Kincraig",
        description: "Wind your way up 1,500 vertical meters through oak trees, feeling the temperature drop delightfully.",
        estimatedDuration: "1.5 Hours",
        approxCostPerPerson: 50,
        locationName: "Mussoorie Hill Road",
        distanceFromPrevKm: 32,
        localTip: "Take the bypass directly toward Landour to avoid Mall Road vehicle jam.",
        lat: 30.4500,
        lng: 78.0750,
        imageUrl: "/images/nearby/transport/transport.webp"
      },
      {
        id: "muss-2",
        order: 2,
        timeSlot: "09:30 AM – 01:30 PM",
        period: "MIDDAY",
        name: "Landour Upper Loop & Bakehouse",
        hindiName: "लैंडौर पाइन वन व बेकहाउस",
        category: "cafe",
        activityTitle: "Chaar Dukaana Maggi & Artisanal Pastries",
        description: "Piping hot ginger lemon honey tea at Chaar Dukaana, followed by warm freshly baked berry pies at Landour Bakehouse.",
        estimatedDuration: "4.0 Hours",
        approxCostPerPerson: 350,
        locationName: "Landour Cantonment",
        distanceFromPrevKm: 5,
        localTip: "Take a walk to Sisters Bazaar for local peanut butter and handmade cheese.",
        lat: 30.4600,
        lng: 78.0900,
        imageUrl: "/images/places/mussoorie/landour-bakehouse.webp"
      },
      {
        id: "muss-3",
        order: 3,
        timeSlot: "04:30 PM – 06:30 PM",
        period: "SUNSET",
        name: "Camel's Back Road Winterline Sunset",
        hindiName: "कैमल्स बैक रोड सूर्यास्त",
        category: "sunset",
        activityTitle: "Quiet Sunset Walk with Doon Valley Lights",
        description: "Walk along the 3 km tranquil natural rock formation as the legendary orange winterline illuminates the horizon.",
        estimatedDuration: "2.0 Hours",
        approxCostPerPerson: 50,
        locationName: "Camel's Back Road",
        distanceFromPrevKm: 4,
        localTip: "Zero motorized vehicles allowed on Camel's Back in evenings; peaceful walking.",
        lat: 30.4580,
        lng: 78.0700,
        imageUrl: "/images/places/mussoorie/camels-back.webp"
      }
    ]
  },

  // =========================================================================
  // PLANS FROM BENGALURU
  // =========================================================================
  {
    id: "blr-nandi-hills-sunrise",
    title: "Nandi Hills Cloud Sea Sunrise & Highway Dosa Run",
    hindiTitle: "नंदी हिल्स बादलों का सागर व डोसा राइड",
    tagline: "Dawn bike sprint through mist, sea of clouds breaking over Tipu Drop, and steaming ghee roast dosas.",
    originCity: "Bengaluru",
    destinationArea: "Nandi Hills & Devanahalli",
    vibes: ["Sunrise", "Road Trip", "Food", "Mountains", "Friends"],
    primaryTransport: "Bike",
    totalDistanceKm: 120,
    totalTravelTime: "3.0 Hours total round-trip driving",
    departureTime: "04:30 AM",
    returnTime: "01:00 PM",
    baseBudgetPerPerson: 550,
    idealGroupSize: "2 – 4 Friends",
    feasibility: "COMFORTABLE",
    feasibilityReason: "60 km smooth 6-lane Bellary Road highway. Reach the hilltop gate by 05:45 AM for sunrise above the clouds.",
    budgetBreakdown: {
      transportFuel: 200,
      foodSnacks: 250,
      activityTickets: 50,
      parkingTolls: 50,
      miscEmergency: 0,
    },
    studentHacks: [
      "Entry gate opens at 06:00 AM; arrive by 05:40 AM to beat weekend queue of bike riders.",
      "Stop at Indian Paratha Company or Paakashala on NH-44 on the way back for breakfast."
    ],
    packingItems: ["Warm Jacket for 5 AM Ride", "Driving License", "Helmet", "Water Bottle"],
    rentals: [
      {
        providerName: "Royal Brothers Bangalore Indiranagar",
        vehicleType: "Scooter (Activa/Jupiter)",
        location: "Indiranagar Metro & Koramangala",
        approxRatePerDay: 499,
        pricingUnit: "per day",
        verificationStatus: "VERIFIED",
        contactOrBookingTip: "Reserve evening before for 4:30 AM dawn departure.",
        phone: "+91-9019595595",
        securityDeposit: 1000,
        includedKmPerDay: 150,
        extraKmRate: 4,
        fuelPolicy: "Same-to-Same",
        operatingHours: "06:00 AM – 10:00 PM",
        requiredDocuments: ["Driving License", "Aadhaar Card"],
        fuelEstimate: 300,
        helmetIncluded: true,
      }
    ],
    poiHighlights: [
      { category: "viewpoint", name: "Tipu's Drop Cloud Vantage", location: "Nandi Summit", highwayOrLandmark: "Hilltop Edge", note: "Breathtaking sea of white clouds at dawn.", provenance: "VERIFIED", lat: 13.3700, lng: 77.6800 },
      { category: "food", name: "Paakashala Devanahalli", location: "NH-44 Highway", highwayOrLandmark: "Airport Toll Bypass", note: "Crispy benne masala dosa & hot filter coffee.", provenance: "VERIFIED", lat: 13.2500, lng: 77.7100 },
      { category: "fuel", name: "Shell Petrol Pump 24x7", location: "Hebbal Flyover Exit", highwayOrLandmark: "Airport Road", note: "Premium petrol, air & 24x7 convenience.", provenance: "VERIFIED", lat: 13.0400, lng: 77.5900 }
    ],
    stops: [
      {
        id: "blr-1",
        order: 1,
        timeSlot: "04:30 AM – 06:00 AM",
        period: "DAWN",
        name: "Dawn Highway Sprint to Nandi Foothills",
        hindiName: "सुबह की हाईवे राइड",
        category: "scenic",
        activityTitle: "Breeze past Airport Elevated Corridor",
        description: "Early morning cool breeze along the wide airport expressway up to the 40 hairpin curves of Nandi Hills.",
        estimatedDuration: "1.5 Hours",
        approxCostPerPerson: 50,
        locationName: "NH-44 Airport Corridor",
        distanceFromPrevKm: 60,
        localTip: "Carry windproof gloves; early morning highway wind is chilly.",
        lat: 13.2000,
        lng: 77.6500,
        imageUrl: "/images/nearby/transport/transport.webp"
      },
      {
        id: "blr-2",
        order: 2,
        timeSlot: "06:15 AM – 09:30 AM",
        period: "MORNING",
        name: "Sunrise Cloud Inversion & Yoga Mandir",
        hindiName: "सूर्योदय व बादलों का सागर",
        category: "sunrise",
        activityTitle: "Watch the Sun Rise Over a Sea of Mist",
        description: "Stand atop 1,478m cliffs as sunlight breaks across a blanket of rolling clouds beneath your feet.",
        estimatedDuration: "3.25 Hours",
        approxCostPerPerson: 100,
        locationName: "Nandi Hills Pinnacle",
        distanceFromPrevKm: 12,
        localTip: "Walk to the lesser-crowded Amrit Sarovar lake behind the temple.",
        lat: 13.3700,
        lng: 77.6800,
        imageUrl: "/images/places/universal/nature.webp"
      },
      {
        id: "blr-3",
        order: 3,
        timeSlot: "10:00 AM – 11:45 AM",
        period: "MORNING",
        name: "Ghee Roast Dosa & Filter Coffee Breakfast",
        hindiName: "घी रोस्ट डोसा व फ़िल्टर कॉफ़ी",
        category: "food",
        activityTitle: "Legendary Karnataka Breakfast on NH-44",
        description: "Golden crispy ghee roast dosas with coconut & spicy tomato chutneys, piping hot sambar, and tumbler filter coffee.",
        estimatedDuration: "1.75 Hours",
        approxCostPerPerson: 200,
        locationName: "Highway Paakashala / Nandi Upachar",
        distanceFromPrevKm: 18,
        localTip: "Order the Rava Idli with extra melted ghee.",
        lat: 13.2500,
        lng: 77.7100,
        imageUrl: "/images/places/universal/food.webp"
      }
    ]
  }
];

/**
 * Filter seeded plans by origin city and selected vibes
 */
export function getOneDayPlansForOrigin(
  originQuery: string,
  selectedVibes: OneDayVibe[] = []
): OneDayPlan[] {
  const norm = originQuery.toLowerCase().trim();
  
  // 1. Find matching hub
  const matchedHub = ONE_DAY_HUBS.find(
    (h) => h.id === norm || h.name.toLowerCase().includes(norm) || h.aliases.some((a) => a.includes(norm) || norm.includes(a))
  );

  let plans = SEEDED_ONE_DAY_PLANS.filter((p) => {
    if (!norm) return true;
    if (matchedHub && (p.originCity.toLowerCase().includes(matchedHub.name.toLowerCase()) || p.originCity.toLowerCase().includes(matchedHub.id))) {
      return true;
    }
    return p.originCity.toLowerCase().includes(norm);
  });

  // If no direct hub plans exist for custom city, gracefully fallback to nearest hub or all plans
  if (plans.length === 0) {
    plans = SEEDED_ONE_DAY_PLANS;
  }

  // 2. Filter by vibes if specified
  if (selectedVibes.length > 0) {
    plans = plans.filter((p) =>
      selectedVibes.some((v) => p.vibes.includes(v))
    );
  }

  return plans;
}
