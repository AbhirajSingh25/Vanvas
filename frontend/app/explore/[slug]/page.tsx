"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Compass, MapPin, Sparkles, Star, BedDouble, Bike, Clock,
  ExternalLink, ArrowRight, ShieldCheck, Bookmark, Check, Mountain,
  Calendar, Sun, Coffee, Trees, Fuel, AlertCircle, RefreshCw, Layers,
  Phone, Navigation, MessageCircle, Globe, Users, X, Home, Building2, CheckCircle2,
  Utensils, Info, Footprints, Flame, Camera, Sunrise, Map as MapIcon, ChevronRight
} from "lucide-react";

import { api } from "@/lib/api";
import { Destination, Place, Hotel, RentalOption, Offer } from "@/types";
import { PlaceCard } from "@/components/places/PlaceCard";
import { PlaceModal } from "@/components/places/PlaceModal";
import { TravelStamp } from "@/components/ui/TravelStamp";
import { JournalNote } from "@/components/ui/JournalNote";
import { VanvasImage } from "@/components/ui/VanvasImage";
import { VehicleArtwork } from "@/components/ui/VehicleArtwork";
import { resolveDestinationVisualProfile } from "@/lib/visualIntelligence";
import { resolvePlaceArtwork } from "@/lib/placeVisualResolver";
import { getCanonicalHindiName, findCanonicalDestination } from "@/lib/canonicalDestinations";

const DISCOVERY_MESSAGES = [
  "VANVAS is gathering live travel information...",
  "Connecting to Himalayan operating layer...",
  "Resolving verified coordinates & topography...",
  "Checking live meteorological forecast...",
  "Gathering verified points of interest...",
  "Reading local trails & sanctuaries..."
];

const TRAVELLER_PROFILES = [
  "All", "Budget", "Couple", "Family", "Friends", "Solo", "Group", "Party/Social"
];

const ACCOMMODATION_TYPES = [
  "All", "Homestay", "Hostel", "Hotel", "Camp", "Boutique", "Resort", "Heritage", "Dorm", "Private"
];

interface DestinationTravelGuide {
  seasonality: string;
  clothing: string;
  transport: string;
  etiquette: string;
}

const DESTINATION_TRAVEL_GUIDES: Record<string, DestinationTravelGuide> = {
  varanasi: {
    seasonality: "Best October to March when riverside mornings and evening aartis are pleasant. Summer (April–June) is intensely hot (38–44°C); monsoon (July–September) submerges lower ghat steps.",
    clothing: "Light, breathable cotton fabrics, modest attire covering shoulders and knees for temple visits, slip-on sandals or walking shoes easily removed at temples and ghats.",
    transport: "Walking is essential along the labyrinthine old-city galiyan (lanes). Cycle rickshaws and e-rickshaws connect Godowlia Chowk to main roads; shared morning/sunset boats ply Dashashwamedh to Assi.",
    etiquette: "Maintain silence and absolute photography prohibition at Manikarnika and Harishchandra burning cremation ghats. Remove footwear outside temples and take care around ghat steps.",
  },
  jaipur: {
    seasonality: "October to March is ideal with clear, sunny skies and cool evenings (10–18°C). May–June sees scorching desert heat above 40°C.",
    clothing: "Cotton shirts/kurtas, sunhat, UV sunglasses, and supportive cushioned walking shoes for extensive stone cobblestone ramps at Amber, Nahargarh, and Jaigarh forts.",
    transport: "Auto-rickshaws, Jaipur Metro (Chandpole to Badi Chaupar), and self-ride heritage scooters are the best ways to navigate the Pink City walled markets.",
    etiquette: "Dress respectfully when visiting City Palace courtyards, Govind Dev Ji temple, and Galtaji. Agree on rickshaw and street market prices beforehand.",
  },
  udaipur: {
    seasonality: "September to March provides sparkling lake views, migratory birds, and crisp mountain breeze from the Aravalli hills.",
    clothing: "Comfortable breathable clothing for exploring palace corridors, lakeside steps, and sunset walking; carry a light shawl or sweater for breezy boat cruises and rooftop dining.",
    transport: "Narrow heritage old-city lanes around Jagdish Chowk and Lal Ghat are best traversed on foot, auto-rickshaw, or rented two-wheelers. Lake crossing ferries operate between ghats.",
    etiquette: "Footwear is strictly removed before entering Jagdish Temple. Maintain water sanctuary cleanliness around Lake Pichola and Fateh Sagar shores.",
  },
  goa: {
    seasonality: "November to February offers dry, breezy beach weather. Monsoon (June–September) brings dramatic greenery and waterfalls like Dudhsagar but swimming in the sea is prohibited.",
    clothing: "Breathable linen, swimwear for beaches, sun protection, flip-flops/sandals. Carry a light rain jacket during early or late monsoon months.",
    transport: "Rented automatic scooters and motorcycles are the standard mode of transport across coastal roads and Latin Quarter streets. Helmets are strictly mandatory by Goa Police.",
    etiquette: "Respect church dress codes at Old Goa's Basilica of Bom Jesus and Se Cathedral (cover shoulders/knees). Maintain silence in residential Fontainhas lanes.",
  },
  manali: {
    seasonality: "Summer (April–June) offers cool mountain respite (15–25°C); winter (December–February) brings heavy snowfall and sub-zero temperatures.",
    clothing: "Layered clothing: thermal inners, warm fleece, windproof down jacket in winter, and sturdy hiking shoes with tread for Solang Valley and Jogini Waterfall trails.",
    transport: "Local taxis operate via the Manali Taxi Union; electric buses connect Mall Road to Solang. Rohtang Pass requires advance green-tax eco permits.",
    etiquette: "Remove shoes and leather goods before entering Hadimba Pagoda Temple and Vashisht hot water temple complex. Avoid single-use plastic bottles along trails.",
  },
  kasol: {
    seasonality: "March to June and September to November offer clear mountain air and pleasant trail conditions in Parvati Valley. Winters are chilly with icy patches.",
    clothing: "Layered fleece, windcheater jacket, ankle-support walking shoes for uneven rocky riverside trails, and woollen beanies for crisp evenings.",
    transport: "Local HRTC buses and shared cabs run along Bhuntar-Kasol-Manikaran-Barshaini route. Trekking on foot is the only way to reach higher hamlets like Tosh, Chalal, and Grahan.",
    etiquette: "Respect traditional village customs in Malana and Kasol; strictly do not touch sacred village houses or temple boundaries without permission.",
  },
  dharamshala: {
    seasonality: "March to June and September to November provide crisp views of the Dhauladhar snow ridges. Dharamshala receives India's second-highest monsoon rainfall in July–August.",
    clothing: "Modest casual layers, sturdy walking shoes for steep McLeod Ganj uphill lanes, rain poncho/umbrella during monsoon season.",
    transport: "Dharamshala Skyway cable car connects Lower Dharamshala to McLeod Ganj in 5 minutes; shared taxis and auto-rickshaws connect to Bhagsu, Dharamkot, and Kangra.",
    etiquette: "Circumambulate the Tsuglagkhang monastery and prayer wheels clockwise only; silence mobile phones during teachings and meditation sessions.",
  },
  mussoorie: {
    seasonality: "April to June for pleasant summer walks; October to January for the famous winterline sunset glow and clear views of the Bandarpoonch peak.",
    clothing: "Smart casuals with light fleece in summer; heavy overcoats, gloves, and woollens for winter. Walking shoes are essential for steep Landour loops.",
    transport: "Mall Road is pedestrian-only during peak evening hours (no private vehicular traffic). Cycle rickshaws and taxis operate from Library Chowk and Picture Palace.",
    etiquette: "Preserve heritage tranquility in Landour Cantonment; observe quiet zones around Sisters Bazaar and Kellogg Memorial Church.",
  },
  leh: {
    seasonality: "May to September is the primary travel window when mountain passes (Rohtang, Baralacha, Chang La, Khardung La) are snow-cleared and open.",
    clothing: "Multi-layered alpine clothing: thermal base layers, fleece mid-layer, windproof/down parka, UV-blocking polarized sunglasses, high SPF sunblock, and lip balm.",
    transport: "Ladakh Taxi Union vehicles are required for Nubra Valley, Pangong Tso, and Tso Moriri sightseeing. Royal Enfield motorcycles are popular for seasoned pass riders.",
    etiquette: "Mandatory 48-hour acclimatization rest upon flying into Leh (3,500m) to prevent Acute Mountain Sickness (AMS). Drink plenty of water and carry Diamox upon medical consultation.",
  },
  spiti: {
    seasonality: "Mid-June to October provides access via Manali-Kaza road. Winter expedition (January–March) is accessible only via Shimla-Kinnaur route for snow leopard tracking.",
    clothing: "Extreme cold weather gear: thermal inners, windproof expedition pants, down jacket (-10°C to -25°C rated for winter), insulated trekking boots, thermal gloves.",
    transport: "High ground-clearance 4x4 vehicles or adventure motorcycles are required for crossing rough river beds (nullahs) along the Kunzum Pass and Malling Nullah stretches.",
    etiquette: "Spiti is an ecologically fragile cold desert. Carry all non-biodegradable waste back to base. Remove footwear and walk clockwise inside ancient gompas like Key and Tabo.",
  },
  munnar: {
    seasonality: "September to May is excellent with cool mountain mist and clear plantation vistas. June to August receives lush, heavy South-West monsoon rains.",
    clothing: "Light cottons with a sweater/light jacket for cool mornings and evenings; waterproof windcheater/raincoat, comfortable walking shoes for tea trail hikes.",
    transport: "Winding Ghat roads require cautious driving; local auto-rickshaws and jeeps are available from Munnar town center to Top Station, Eravikulam, and Mattupetty.",
    etiquette: "Do not pluck tea leaves or walk through private plantation bushes without permission. Avoid disturbing endemic Nilgiri Tahr wildlife in national parks.",
  },
  "tungnath-chandrashila": {
    seasonality: "Tungnath Temple shrine opens annually from April/May to November (Akshaya Tritiya to Kartik Purnima). Winter snow trekking up to Chandrashila is accessible with microspikes/gaiters.",
    clothing: "High-altitude alpine trek clothing: thermal base layers, fleece jacket, windproof & waterproof shell jacket, woollen cap, sturdy trekking boots with ankle support and grip, gloves.",
    transport: "Chopta base camp is reached by road from Rishikesh/Haridwar via Rudraprayag and Ukhimath. Beyond Chopta roadhead, no vehicular traffic exists: the 5 km trail to Tungnath (3.5 km) and Chandrashila (1.5 km) is trekking-only (ponies available up to the temple).",
    etiquette: "Tungnath is the 3rd Panch Kedar and world's highest Shiva shrine (3,680m). Remove shoes before temple precincts. Maintain silence on summit, carry your trash back down, and carry cash as ATMs end at Ukhimath.",
  },
};

interface DestinationExperience {
  id: string;
  title: string;
  hindiTitle: string;
  category: string;
  elevation?: string;
  duration?: string;
  distance?: string;
  difficulty?: string;
  bestTime?: string;
  location: string;
  latitude: number;
  longitude: number;
  description: string;
  imageUrl: string;
  tags: string[];
}

export default function DestinationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const [mounted, setMounted] = useState(false);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [weather, setWeather] = useState<any[]>([]);
  
  // Independent Section Data & Loading States
  const [destLoading, setDestLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [staysLoading, setStaysLoading] = useState(true);
  const [selectedTravellerProfile, setSelectedTravellerProfile] = useState<string>("All");
  const [selectedStayType, setSelectedStayType] = useState<string>("All");
  const [selectedStayForModal, setSelectedStayForModal] = useState<Hotel | null>(null);
  const [stayModalOpen, setStayModalOpen] = useState(false);
  
  const [rentals, setRentals] = useState<RentalOption[]>([]);
  const [rentalsLoading, setRentalsLoading] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [savedExperiences, setSavedExperiences] = useState<Record<string, boolean>>({});
  const [activeWaypointIdx, setActiveWaypointIdx] = useState<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!destLoading) return;
    const msgTimer = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % DISCOVERY_MESSAGES.length);
    }, 1200);
    return () => clearInterval(msgTimer);
  }, [destLoading]);

  const destMetadata: Record<string, { hindi: string; alt: string; quote: string; province: string }> = {
    manali: {
      hindi: "मनाली",
      alt: "2050M",
      quote: "Where pine forests meet the clouds and the high Himalayan highway begins.",
      province: "HIMACHAL PRADESH",
    },
    rishikesh: {
      hindi: "ऋषिकेश",
      alt: "372M",
      quote: "Turquoise Ganga currents, evening bells, and cliffside meditation.",
      province: "UTTARAKHAND",
    },
    kasol: {
      hindi: "कसोल",
      alt: "1580M",
      quote: "Mystic deodar canopies, roaring emerald waters, and bohemian trails.",
      province: "PARVATI VALLEY",
    },
    dharamshala: {
      hindi: "धर्मशाला",
      alt: "1457M",
      quote: "Prayer flags in the mist, Tibetan heritage, and the mighty Dhauladhar ridge.",
      province: "HIMACHAL PRADESH",
    },
    goa: {
      hindi: "गोवा",
      alt: "10M",
      quote: "Golden palms, Portuguese villas, beach shack sunsets, and hidden spice farms.",
      province: "WEST COAST",
    },
    jaipur: {
      hindi: "जयपुर",
      alt: "431M",
      quote: "Terracotta ramparts, historic havelis, rich kachoris, and artisan crafts.",
      province: "RAJASTHAN",
    },
    udaipur: {
      hindi: "उदयपुर",
      alt: "598M",
      quote: "Shimmering lake waters, whitewashed palaces, and romantic rooftop evenings.",
      province: "MEWAR RAJASTHAN",
    },
    mussoorie: {
      hindi: "मसूरी",
      alt: "2005M",
      quote: "Queen of the Hills, colonial bookshops, winterline sunsets, and oak trails in Landour.",
      province: "GARHWAL UTTARAKHAND",
    },
    spiti: {
      hindi: "स्पीति घाटी",
      alt: "3800M",
      quote: "Middle land between Tibet and India, stark moonscapes, thousand-year-old gompas.",
      province: "HIMACHAL PRADESH",
    },
    leh: {
      hindi: "लेह लद्दाख",
      alt: "3500M",
      quote: "High passes, turquoise alpine lakes, prayer wheels, and ancient royal palaces.",
      province: "LADAKH",
    },
    varanasi: {
      hindi: "वाराणसी",
      alt: "80M",
      quote: "Ancient eternal ghats, dawn boat rides, sacred chanting, and narrow silk lanes.",
      province: "UTTAR PRADESH",
    },
    munnar: {
      hindi: "मुन्नार",
      alt: "1600M",
      quote: "Endless rolling emerald tea plantations, misty mountain gaps, and spice air.",
      province: "KERALA",
    },
    "tungnath-chandrashila": {
      hindi: "तुंगनाथ–चंद्रशिला",
      alt: "4000M",
      quote: "Chopta base camp → World's highest Shiva shrine (3,680m) → 360° Chaukhamba sunrise summit (4,000m).",
      province: "GARHWAL UTTARAKHAND",
    }
  };

  const fetchDestination = () => {
    setDestLoading(true);
    setLoadError(null);
    setStaysLoading(true);
    setRentalsLoading(true);

    const abortTimeout = setTimeout(() => {
      setDestLoading(false);
      setLoadError("Connection timed out. The Himalayan intelligence layer took too long to respond. Tap retry to reconnect.");
      setStaysLoading(false);
      setRentalsLoading(false);
    }, 45000);

    api.getDestinationDetail(slug)
      .then((data) => {
        clearTimeout(abortTimeout);
        if (!data || !data.destination) {
          throw new Error("404: Sanctuary not found in index");
        }
        setDestination(data.destination);
        setPlaces(data.places || []);
        setWeather(data.weather || []);
        setDestLoading(false);

        const destId = data.destination.id || slug;

        // Progressive Background Fetches
        // 1. Stays
        if (data.hotels && data.hotels.length > 0) {
          setHotels(data.hotels);
          setStaysLoading(false);
        } else {
          api.getHotels(destId)
            .then((loadedStays) => setHotels(loadedStays || []))
            .catch(() => setHotels([]))
            .finally(() => setStaysLoading(false));
        }

        // 2. Rentals
        if (data.rentals && data.rentals.length > 0) {
          setRentals(data.rentals);
          setRentalsLoading(false);
        } else {
          api.getRentals(destId)
            .then((loadedR) => setRentals(loadedR || []))
            .catch(() => setRentals([]))
            .finally(() => setRentalsLoading(false));
        }
      })
      .catch((err) => {
        clearTimeout(abortTimeout);
        console.error("Destination fetch error:", err);
        setLoadError(err.message || "Failed to load destination");
        setDestLoading(false);
        setStaysLoading(false);
        setRentalsLoading(false);
      });
  };

  const fetchFilteredStays = (travellerProfile?: string, stayType?: string) => {
    if (!destination) return;
    const destId = destination.id || slug;
    setStaysLoading(true);
    api.getHotels(destId, stayType, travellerProfile)
      .then((loadedStays) => setHotels(loadedStays || []))
      .catch(() => setHotels([]))
      .finally(() => setStaysLoading(false));
  };

  const handleTravellerProfileChange = (profile: string) => {
    setSelectedTravellerProfile(profile);
    fetchFilteredStays(profile, selectedStayType);
  };

  const handleStayTypeChange = (type: string) => {
    setSelectedStayType(type);
    fetchFilteredStays(selectedTravellerProfile, type);
  };

  useEffect(() => {
    fetchDestination();
  }, [slug]);

  const toggleSaveExperience = (id: string) => {
    setSavedExperiences((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getCategory = (p: Place): string => {
    return typeof p.category === "string" ? p.category.toLowerCase() : "";
  };

  const categories = [
    { id: "all", label: "All Places", count: places.length },
    { id: "must-visit", label: "Must Visit", count: places.filter((p) => Boolean(p.is_must_visit)).length },
    { id: "hidden", label: "Hidden Gems", count: places.filter((p) => Boolean(p.is_hidden_gem)).length },
    { id: "cafes", label: "Cafés & Bakeries", count: places.filter((p) => getCategory(p).includes("café") || getCategory(p).includes("bakery") || getCategory(p).includes("cafe")).length },
    { id: "nature", label: "Trails & Nature", count: places.filter((p) => getCategory(p).includes("nature") || getCategory(p).includes("trail") || getCategory(p).includes("waterfall") || getCategory(p).includes("scenic") || getCategory(p).includes("lake")).length },
    { id: "food", label: "Local Food", count: places.filter((p) => getCategory(p).includes("food") || getCategory(p).includes("dhaba") || getCategory(p).includes("restaurant")).length },
    { id: "culture", label: "Culture & Heritage", count: places.filter((p) => getCategory(p).includes("culture") || getCategory(p).includes("temple") || getCategory(p).includes("heritage") || getCategory(p).includes("monastery") || getCategory(p).includes("ghat") || getCategory(p).includes("spiritual") || getCategory(p).includes("fort")).length },
  ];

  const filteredPlaces = places.filter((p) => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "must-visit") return Boolean(p.is_must_visit);
    if (selectedCategory === "hidden") return Boolean(p.is_hidden_gem);
    const cat = getCategory(p);
    if (selectedCategory === "cafes") return cat.includes("café") || cat.includes("bakery") || cat.includes("cafe");
    if (selectedCategory === "nature") return cat.includes("nature") || cat.includes("trail") || cat.includes("waterfall") || cat.includes("scenic") || cat.includes("lake");
    if (selectedCategory === "food") return cat.includes("food") || cat.includes("dhaba") || cat.includes("restaurant");
    if (selectedCategory === "culture") return cat.includes("culture") || cat.includes("temple") || cat.includes("heritage") || cat.includes("monastery") || cat.includes("ghat") || cat.includes("spiritual") || cat.includes("fort");
    return true;
  });

  // Tungnath-Chandrashila Dedicated Waypoints & Experiences Data
  const tungnathWaypoints = [
    {
      id: "chopta",
      name: "Chopta Meadows (Base Camp)",
      hindiName: "चोपता बुग्याल (आधार शिविर)",
      elevation: "2,680 m",
      distance: "0 km (Starting point)",
      timeFromPrev: "Start",
      difficulty: "Easy / Base Area",
      latitude: 30.4850,
      longitude: 79.1790,
      description: "Lush alpine meadows (bugyals) framed by dense deodar, oak and rhododendron forests. Gateway to the trek with rustic tea stalls and eco campsites.",
      imageUrl: "/images/places/tungnath-chandrashila/chopta-meadows.jpg",
    },
    {
      id: "tungnath",
      name: "Tungnath Temple (Panch Kedar)",
      hindiName: "तुंगनाथ मंदिर (तृतीय केदार)",
      elevation: "3,680 m",
      distance: "3.5 km from Chopta",
      timeFromPrev: "2.5 – 3.5 hrs ascent",
      difficulty: "Moderate uphill stone paved trail",
      latitude: 30.4886,
      longitude: 79.2173,
      description: "World's highest Shiva temple and the 3rd Panch Kedar. Ancient North Indian Nagara stone architecture standing on an alpine ridge for over a millennium.",
      imageUrl: "/images/places/tungnath-chandrashila/tungnath-temple.jpg",
    },
    {
      id: "chandrashila",
      name: "Chandrashila Summit (Moon Rock)",
      hindiName: "चंद्रशिला शिखर (4,000 मी)",
      elevation: "4,000 m",
      distance: "1.5 km beyond Temple",
      timeFromPrev: "1 – 1.5 hrs from Temple",
      difficulty: "Steep rocky crag ascent",
      latitude: 30.4930,
      longitude: 79.2185,
      description: "Unrivalled 360-degree panoramic sunrise vista towering in front of the colossal Chaukhamba massif, Nanda Devi, Trishul, and Kedarnath peaks.",
      imageUrl: "/images/places/tungnath-chandrashila/chandrashila-summit.jpg",
    },
  ];

  const tungnathExperiences: DestinationExperience[] = [
    {
      id: "exp-tungnath-trek",
      title: "Tungnath Temple Pilgrimage Ascent",
      hindiTitle: "तुंगनाथ मंदिर तीर्थ पदयात्रा",
      category: "Spiritual & Heritage Trek",
      elevation: "3,680 m",
      duration: "3 – 4 Hours",
      distance: "3.5 km from Chopta",
      difficulty: "Moderate",
      bestTime: "Morning (06:00 – 11:00)",
      location: "Chopta to Tungnath Ridge",
      latitude: 30.4886,
      longitude: 79.2173,
      description: "Ascend the ancient stone-paved trail through alpine bugyals to reach the sacred thousand-year-old stone temple of Lord Shiva.",
      imageUrl: "/images/places/tungnath-chandrashila/tungnath-temple.jpg",
      tags: ["Highest Shiva Shrine", "Stone Architecture", "Panch Kedar", "Alpine Ridge"]
    },
    {
      id: "exp-chandrashila-sunrise",
      title: "Chandrashila 360° Chaukhamba Sunrise Summit",
      hindiTitle: "चंद्रशिला 360° सूर्योदय शिखर",
      category: "Sunrise & Alpine Summit",
      elevation: "4,000 m",
      duration: "2 Hours from Temple",
      distance: "1.5 km beyond Temple",
      difficulty: "Steep / Moderate",
      bestTime: "Dawn (04:30 – 06:30 AM)",
      location: "Chandrashila Crag Peak",
      latitude: 30.4930,
      longitude: 79.2185,
      description: "Reach the 4,000m summit at first light to witness the golden sun illuminate Chaukhamba, Trishul, and Nanda Devi in a dramatic 360-degree panorama.",
      imageUrl: "/images/places/tungnath-chandrashila/chandrashila-summit.jpg",
      tags: ["360° Panorama", "Chaukhamba Sunrise", "High Altitude", "Garhwal Giants"]
    },
    {
      id: "exp-chopta-bugyals",
      title: "Chopta Meadows & Oak Forest Walks",
      hindiTitle: "चोपता बुग्याल एवं बाँज वन",
      category: "Nature & Slow Travel",
      elevation: "2,680 m",
      duration: "Flexible (1 – 3 Hours)",
      distance: "Base Camp Area",
      difficulty: "Easy",
      bestTime: "Late Afternoon & Sunset",
      location: "Chopta Base Valley",
      latitude: 30.4850,
      longitude: 79.1790,
      description: "Stroll across rolling alpine pastures (bugyals) bordered by dense deodar and oak canopies with birdsong and serene mountain silence.",
      imageUrl: "/images/places/tungnath-chandrashila/chopta-meadows.jpg",
      tags: ["Alpine Bugyals", "Deodar Forest", "Birdwatching", "Slow Travel"]
    },
    {
      id: "exp-rhododendron-trail",
      title: "Garhwal Rhododendron & Pine Forest Trail",
      hindiTitle: "बुरांश एवं चीड़ वन मार्ग",
      category: "Forest & Flora Trail",
      elevation: "2,800 m – 3,200 m",
      duration: "2 Hours",
      distance: "Trail Corridor",
      difficulty: "Moderate",
      bestTime: "March – May (Bloom season)",
      location: "Lower Tungnath Forest Trail",
      latitude: 30.4865,
      longitude: 79.1980,
      description: "Walk under canopies of vibrant red and pink Buransh (Rhododendron) blooms lining the mountain trail against crisp Himalayan breezes.",
      imageUrl: "/images/places/tungnath-chandrashila/forest-trail.jpg",
      tags: ["Buransh Bloom", "Forest Trail", "Floral Canopy", "Seasonal"]
    },
    {
      id: "exp-himalayan-chai",
      title: "Chopta Mountain Chai & Local Garhwali Dhabas",
      hindiTitle: "चोपता पहाड़ी चाय एवं स्थानीय ढाबा",
      category: "Chai & Local Food",
      elevation: "2,680 m",
      duration: "1 Hour",
      distance: "Chopta Trailhead",
      difficulty: "Easy",
      bestTime: "Post-Trek Warmth",
      location: "Chopta Base Market",
      latitude: 30.4855,
      longitude: 79.1810,
      description: "Warm up with piping hot ginger-cardamom tea, mountain Maggi, and fresh local Garhwali mandua roti with dal at trailside wooden dhabas.",
      imageUrl: "/images/places/tungnath-chandrashila/local-cafe.jpg",
      tags: ["Mountain Chai", "Hot Maggi", "Garhwali Food", "Trailside Dhaba"]
    }
  ];

  const normKey = slug.toLowerCase().replace(/[^a-z]/g, "");
  const matchedMetaKey = Object.keys(destMetadata).find((k) => normKey.includes(k));
  const canonicalDest = findCanonicalDestination(slug);
  const canonicalHindi = destination?.hindi_name || getCanonicalHindiName(slug) || canonicalDest?.hindi_name || "";
  const meta = {
    hindi: canonicalHindi || (matchedMetaKey ? destMetadata[matchedMetaKey]?.hindi : null) || destination?.name || "यात्रा",
    alt: `${destination?.altitude_meters || canonicalDest?.altitude_meters || 550}M`,
    quote: destination?.tagline || canonicalDest?.tagline || "Live travel discovery and verified coordinates.",
    province: destination?.state ? destination.state.toUpperCase() : (canonicalDest?.state ? canonicalDest.state.toUpperCase() : "LIVE DISCOVERY"),
  };

  const isCurated = destination ? destination.is_curated !== false : true;

  if (!mounted || destLoading) {
    return (
      <div className="min-h-screen bg-[#EFE5D2] flex flex-col items-center justify-center text-[#173B32] gap-4 px-4 text-center">
        <div className="w-12 h-12 border-3 border-[#B65E3C] border-t-transparent rounded-full animate-spin" />
        <div className="space-y-1.5 max-w-md">
          <p className="font-serif text-lg font-bold text-[#173B32]">
            {mounted ? DISCOVERY_MESSAGES[loadingMsgIdx] : "VANVAS is gathering live travel information..."}
          </p>
          <p className="text-xs font-mono text-[#7B4D36] opacity-80">
            VANVAS Himalayan Intelligence Operating Layer
          </p>
        </div>
      </div>
    );
  }

  if (loadError || !destination) {
    const is404 = loadError && (
      loadError.includes("404") ||
      loadError.toLowerCase().includes("not found")
    );
    const isNetworkError = !is404;

    return (
      <div className="min-h-screen bg-[#EFE5D2] flex flex-col items-center justify-center text-[#173B32] gap-4 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-[#B65E3C]" />
        <div className="space-y-1">
          <span className="text-xs font-mono uppercase tracking-wider text-[#B65E3C] font-semibold">
            {isNetworkError ? "कनेक्शन स्थिति • Server Connection" : "अभयारण्य नहीं मिला • Destination Index"}
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32]">
            {isNetworkError ? "Himalayan Operating Layer Connecting..." : "Destination Not Found"}
          </h2>
        </div>
        <p className="text-xs text-[#7B4D36] max-w-md leading-relaxed">
          {isNetworkError
            ? "VANVAS backend was temporarily warming up. Tap retry below to establish the connection."
            : (loadError || "Could not resolve live information for this location. Please try exploring another sanctuary.")}
        </p>
        <div className="flex gap-3 pt-2">
          <button
            onClick={fetchDestination}
            className="px-5 py-2.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
          <Link
            href="/explore"
            className="px-5 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] hover:bg-[#E5D5BA] text-[#173B32] text-xs font-bold transition-all"
          >
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  const profile = resolveDestinationVisualProfile(destination.slug || destination.name, destination.state, destination.altitude_meters);
  const regionType = profile.terrainType;

  return (
    <div className="min-h-screen bg-[#EFE5D2] pb-28">
      {/* 1. HERO BANNER: Depicts Recognizable Landmark / Tungnath Temple Architecture */}
      <section className="relative h-[56vh] min-h-[420px] max-h-[500px] bg-[#0F2924] text-[#EFE5D2] flex items-end px-4 sm:px-6 lg:px-8 pb-10 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <VanvasImage
            src={destination.hero_image || profile.heroPath || profile.illustrationPath}
            fallbackSrc={profile.fallbackPath}
            regionType={regionType}
            alt={`${destination.name} - ${meta.hindi}`}
            priority={true}
            className="w-full h-full object-cover opacity-85 scale-102 transition-transform duration-1000"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F2924] via-[#0F2924]/60 to-black/30 pointer-events-none z-1" />

        <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <TravelStamp label={meta.province} variant="terracotta" />
              <TravelStamp label={meta.alt} variant="forest" />
              <TravelStamp label={isCurated ? "VANVAS VERIFIED" : "LIVE DISCOVERY"} variant={isCurated ? "mustard" : "forest"} />
            </div>

            <div className="space-y-1">
              <span className="text-2xl sm:text-3xl font-serif text-[#B49252] font-semibold block">
                {meta.hindi}
              </span>
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-black tracking-tight text-[#EFE5D2]">
                {destination.name}
              </h1>
            </div>

            <p className="text-sm sm:text-base text-[#D8DED5] max-w-xl italic font-serif leading-relaxed">
              &ldquo;{meta.quote}&rdquo;
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-4 rounded-2xl bg-[#EFE5D2]/15 hover:bg-[#EFE5D2]/25 backdrop-blur-md border border-[#D8DED5]/30 text-[#EFE5D2] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Navigation className="w-4 h-4 text-[#B49252]" />
              <span>Get Directions</span>
            </a>

            <Link
              href={`/plan?dest=${destination.id}`}
              className="px-7 py-4 rounded-2xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] font-bold text-xs uppercase tracking-wider shadow-2xl flex items-center justify-center gap-2 transition-all transform active:scale-95 border border-[#7B4D36]/30"
            >
              <Sparkles className="w-4 h-4 text-[#B49252]" />
              <span>Plan This Trip</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        
        {/* 2. OVERVIEW: SANCTUARY DISPATCH */}
        {isCurated && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 p-6 sm:p-10 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-sm space-y-6">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#B65E3C]">
                <Compass className="w-4 h-4" />
                <span>सफ़रनामा • Sanctuary Dispatch</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32]">
                Why wander into {destination.name}?
              </h2>

              <p className="text-sm text-[#20211D]/85 leading-relaxed font-light">
                {destination.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#E5D5BA] text-xs">
                <div className="p-3 rounded-xl bg-[#EFE5D2] space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-[#7B4D36]">Best Season</span>
                  <p className="font-bold text-[#173B32]">{destination.best_time_to_visit || "Year-round"}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#EFE5D2] space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-[#7B4D36]">Climate</span>
                  <p className="font-bold text-[#173B32]">{destination.weather_type}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#EFE5D2] space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-[#7B4D36]">Elevation</span>
                  <p className="font-bold text-[#173B32]">{destination.altitude_meters}m</p>
                </div>
                <div className="p-3 rounded-xl bg-[#EFE5D2] space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-[#7B4D36]">Coordinates</span>
                  <p className="font-bold text-[#173B32] font-mono">{destination.latitude.toFixed(2)}°N, {destination.longitude.toFixed(2)}°E</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <JournalNote
                tag="EXPEDITION ADVISORY"
                note={destination.slug === "tungnath-chandrashila"
                  ? "Start the Chandrashila ascent from Chopta before 05:00 AM to reach the summit for the 360° golden Chaukhamba sunrise."
                  : "Early morning walks provide the clearest panoramic light and serene atmosphere before afternoon traffic begins."}
                date={`${meta.hindi} FIELD NOTE`}
                tapeColor="terracotta"
              />
            </div>
          </div>
        )}

        {/* 3. THE JOURNEY & INTERACTIVE ROUTE MAP */}
        {destination.slug === "tungnath-chandrashila" && (
          <div className="space-y-6">
            <div className="p-6 sm:p-10 rounded-3xl bg-[#173B32] text-[#EFE5D2] border-2 border-[#173B32] shadow-2xl space-y-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-[#B49252] font-bold">
                    THE EXPEDITION JOURNEY • उत्तराखंड पर्यटन मार्ग
                  </span>
                  <h3 className="text-2xl sm:text-4xl font-serif font-black text-[#FAF4E8]">
                    Chopta → Tungnath Temple → Chandrashila
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <TravelStamp label="5.0 KM ASCENT" elevation="4000M" variant="mustard" />
                  <TravelStamp label="MODERATE TREK" variant="terracotta" />
                </div>
              </div>

              {/* Waypoints Sequence Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tungnathWaypoints.map((wp, idx) => {
                  const isSelected = activeWaypointIdx === idx;
                  return (
                    <div
                      key={wp.id}
                      onClick={() => setActiveWaypointIdx(idx)}
                      className={`p-5 rounded-2xl transition-all cursor-pointer flex flex-col justify-between space-y-4 border ${
                        isSelected
                          ? "bg-[#0F2924] border-[#B49252] shadow-xl scale-102"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="relative h-36 rounded-xl overflow-hidden bg-black/30">
                          <img
                            src={wp.imageUrl}
                            alt={wp.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[#FAF4E8] text-[10px] font-mono font-bold">
                            STEP 0{idx + 1} • {wp.elevation}
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-mono uppercase text-[#B49252] font-bold block">
                            {wp.distance}
                          </span>
                          <h4 className="text-lg font-serif font-bold text-[#FAF4E8] mt-0.5">
                            {wp.name}
                          </h4>
                          <span className="text-xs font-devanagari text-[#D8DED5]/80 block">
                            {wp.hindiName}
                          </span>
                        </div>

                        <p className="text-xs text-[#D8DED5]/80 font-light leading-relaxed">
                          {wp.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                        <span className="text-[10px] font-mono text-[#B49252]">
                          {wp.timeFromPrev}
                        </span>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${wp.latitude},${wp.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1 rounded-lg bg-[#B65E3C] hover:bg-[#9E4D2E] text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <Navigation className="w-3 h-3" />
                          <span>Directions</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Verified Route Matrix Bar */}
              <div className="p-4 rounded-2xl bg-black/30 text-xs text-[#D8DED5]/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-white/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#B49252]">Verified Route:</span>
                    <span>CHOPTA (2,680m) &rarr; TUNGNATH TEMPLE (3,680m, ~3.5 km) &rarr; CHANDRASHILA (4,000m, ~1.5 km)</span>
                  </div>
                  <p className="text-[11px] text-[#D8DED5]/70 font-mono">
                    Total Trek Distance: 5.0 km one-way | Total Elevation Gain: 1,320m | Difficulty: Moderate | Permits: Not required for Indian nationals
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <a
                    href="https://www.google.com/maps/dir/?api=1&destination=30.4930,79.2185"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-[#B49252] hover:bg-[#9E7D3F] text-[#0F2924] font-bold text-xs flex items-center gap-1.5 transition-all"
                  >
                    <MapIcon className="w-3.5 h-3.5" />
                    <span>View Full Route</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. LIVE OPEN-METEO WEATHER INTELLIGENCE */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0F2924] text-[#EFE5D2] border-2 border-[#173B32] shadow-xl space-y-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE OPEN-METEO WEATHER
                </span>
                <span className="text-[11px] font-mono text-[#B49252]">
                  {destination.latitude.toFixed(2)}°N, {destination.longitude.toFixed(2)}°E
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#FAF4E8]">
                Current Climate &amp; 5-Day Forecast for {destination.name}
              </h3>
            </div>
            <div className="text-xs text-[#D8DED5]/70 font-mono text-right">
              Updated Hourly from Open-Meteo Meteorological Satellite
            </div>
          </div>

          {weather.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-4 flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-4xl sm:text-5xl font-serif font-black text-[#FAF4E8]">
                    {Math.round(weather[0].temp_c)}°<span className="text-lg text-[#B49252]">C</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-[#FAF4E8] block">{weather[0].condition}</span>
                    <span className="text-[11px] text-[#D8DED5]/80 font-mono">
                      Wind: {weather[0].wind_kph} km/h • Humidity: {weather[0].humidity}%
                    </span>
                    {weather[0].is_rain && (
                      <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 font-mono">
                        Rain Advisory Active
                      </span>
                    )}
                  </div>
                </div>

                <div className="md:col-span-8 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                  <Sun className="w-5 h-5 text-[#B49252] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B49252]">
                      METEOROLOGICAL ADVISORY
                    </span>
                    <p className="text-xs text-[#EFE5D2] leading-relaxed mt-0.5">
                      {weather[0].advisory || `Live meteorological conditions for ${destination.name}. High altitude mountain conditions can change rapidly.`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
                {weather.slice(0, 5).map((w, idx) => {
                  let dayName = idx === 0 ? "Today" : `Day ${idx + 1}`;
                  let dateStr = w.forecast_date || "";
                  try {
                    const parts = (w.forecast_date || "").split("T")[0].split("-");
                    if (parts.length === 3) {
                      const yr = parseInt(parts[0], 10);
                      const mIdx = parseInt(parts[1], 10) - 1;
                      const dy = parseInt(parts[2], 10);
                      const mNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                      const dayOfWeekNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                      const dt = new Date(yr, mIdx, dy);
                      if (idx > 0) dayName = dayOfWeekNames[dt.getDay()] || dayName;
                      dateStr = `${mNames[mIdx] || ""} ${dy}`;
                    }
                  } catch (e) {
                    // keep default
                  }

                  return (
                    <div
                      key={w.id || idx}
                      className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between space-y-2 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#FAF4E8]">{dayName}</span>
                        <span className="text-[10px] font-mono text-[#D8DED5]/70">{dateStr}</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-lg font-serif font-bold text-[#FAF4E8]">
                          {Math.round(w.temp_c)}°C
                        </span>
                        <span className="text-[11px] font-mono text-[#B49252]">
                          {w.is_rain ? "Rain" : "Clear"}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#D8DED5]/80 line-clamp-1">
                        {w.condition}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-white/5 text-xs text-[#D8DED5]/80">
              Fetching meteorological satellite data for {destination.name}...
            </div>
          )}
        </div>

        {/* 5. EXPERIENCES: REUSABLE CATEGORY CARDS */}
        {destination.slug === "tungnath-chandrashila" && (
          <div className="space-y-6 pt-4 border-t-2 border-[#E5D5BA]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E5D5BA] pb-4 gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#B65E3C]">
                  अनुभव • Curated Himalayan Experiences
                </span>
                <h3 className="font-serif font-black text-2xl sm:text-3xl text-[#173B32] flex items-center gap-2 mt-0.5">
                  <Footprints className="w-6 h-6 text-[#B65E3C]" />
                  <span>Tungnath–Chandrashila Experiences ({tungnathExperiences.length})</span>
                </h3>
              </div>
              <span className="text-xs font-mono text-[#7B4D36]">
                All experiences mapped with verified coordinates
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tungnathExperiences.map((exp) => {
                const isSaved = Boolean(savedExperiences[exp.id]);
                return (
                  <div
                    key={exp.id}
                    className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] hover:border-[#173B32]/50 shadow-xs hover:shadow-xl transition-all space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="relative h-48 rounded-2xl overflow-hidden bg-[#E5D5BA]">
                        <img
                          src={exp.imageUrl}
                          alt={exp.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-[#0F2924]/85 backdrop-blur-xs text-[#FAF4E8] text-[10px] font-bold uppercase tracking-wider">
                          {exp.category}
                        </div>
                        {exp.elevation && (
                          <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono">
                            {exp.elevation}
                          </div>
                        )}
                        <button
                          onClick={() => toggleSaveExperience(exp.id)}
                          className="absolute top-2.5 right-2.5 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-xs transition-colors cursor-pointer"
                          title={isSaved ? "Saved" : "Save Experience"}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-[#B49252] text-[#B49252]" : ""}`} />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-[#B65E3C] font-semibold block uppercase">
                          {exp.location}
                        </span>
                        <h4 className="font-serif font-bold text-lg text-[#173B32] leading-snug">
                          {exp.title}
                        </h4>
                        <span className="text-xs font-devanagari text-[#7B4D36] block">
                          {exp.hindiTitle}
                        </span>
                        <p className="text-xs text-[#20211D]/80 leading-relaxed font-light mt-1">
                          {exp.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {exp.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded text-[9px] font-mono bg-[#EFE5D2] text-[#7B4D36] border border-[#E5D5BA]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#E5D5BA] flex items-center justify-between text-xs gap-2">
                      <div className="text-[10px] font-mono text-[#7B4D36]">
                        {exp.duration} • {exp.difficulty}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${exp.latitude},${exp.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-[#173B32] text-[#FAF4E8] text-xs font-bold hover:bg-[#0F2924] transition-colors flex items-center gap-1"
                        >
                          <Navigation className="w-3 h-3" />
                          <span>Directions</span>
                        </a>

                        <Link
                          href={`/plan?dest=${destination.id}&exp=${exp.id}`}
                          className="px-3 py-1.5 rounded-xl bg-[#B65E3C] text-[#FAF4E8] text-xs font-bold hover:bg-[#9E4D2E] transition-colors flex items-center gap-1"
                        >
                          <span>Add to Trip</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. CURATED LANDMARKS & PLACES */}
        {isCurated && places.length > 0 && (
          <div className="space-y-6 pt-4 border-t-2 border-[#E5D5BA]">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5D5BA] pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#B65E3C]">
                  {destination.slug === "tungnath-chandrashila" ? "मुख्य पड़ाव • Verified Trek Landmarks" : "चुनिंदा पड़ाव • Curated Sanctuaries"}
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32]">
                  {destination.slug === "tungnath-chandrashila"
                    ? "Tungnath–Chandrashila Verified Landmarks"
                    : `Curated Trails, Cafés & Local Landmarks (${filteredPlaces.length})`}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedCategory === cat.id
                      ? "bg-[#173B32] text-[#EFE5D2] shadow-sm border-2 border-[#173B32]"
                      : "bg-[#FAF7F0] text-[#20211D]/80 border border-[#E5D5BA] hover:bg-[#E5D5BA]"
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedCategory === cat.id ? "bg-[#B49252] text-[#0F2924]" : "bg-[#EFE5D2] text-[#7B4D36]"}`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlaces.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  destinationName={destination.name}
                  onSelect={(p) => {
                    setSelectedPlace(p);
                    setModalOpen(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}
        {/* 7. STAYS & HOMESTAYS */}
        <div className="space-y-6 pt-6 border-t-2 border-[#E5D5BA]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E5D5BA] pb-4 gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#B65E3C]">
                आशियाना • Verified Stays &amp; Sanctuaries
              </span>
              <h3 className="font-serif font-black text-2xl sm:text-3xl text-[#173B32] flex items-center gap-2 mt-0.5">
                <BedDouble className="w-6 h-6 text-[#B65E3C]" />
                <span>
                  {destination.slug === "tungnath-chandrashila" ? "Chopta Base Stays & Camps" : "Stays & Sanctuaries"} {!staysLoading && `(${hotels.length})`}
                </span>
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase bg-[#FAF7F0] border border-[#E5D5BA] text-[#7B4D36] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>Sanctuary Accommodations</span>
              </span>
            </div>
          </div>

          {/* Traveller & Accommodation Style Filter Bar */}
          <div className="space-y-3 bg-[#FAF7F0] p-4 rounded-2xl border border-[#E5D5BA]">
            {/* Traveller Profiles */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-[#7B4D36]">
                <span className="font-bold flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <Users className="w-3.5 h-3.5 text-[#B65E3C]" />
                  <span>Traveller Profile</span>
                </span>
                <span className="text-[10px] font-mono opacity-70">
                  {selectedTravellerProfile === "All" ? "All Profiles" : `${selectedTravellerProfile} Verified`}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TRAVELLER_PROFILES.map((profile) => {
                  const isActive = selectedTravellerProfile === profile;
                  return (
                    <button
                      key={profile}
                      onClick={() => handleTravellerProfileChange(profile)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#173B32] text-[#EFE5D2] shadow-xs scale-[1.02]"
                          : "bg-white/80 hover:bg-white text-[#7B4D36] border border-[#E5D5BA]/80"
                      }`}
                    >
                      {profile}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accommodation Preferences */}
            <div className="space-y-1.5 pt-2 border-t border-[#E5D5BA]/60">
              <div className="flex items-center justify-between text-xs text-[#7B4D36]">
                <span className="font-bold flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <Building2 className="w-3.5 h-3.5 text-[#B65E3C]" />
                  <span>Accommodation Style</span>
                </span>
                <span className="text-[10px] font-mono opacity-70">
                  {selectedStayType === "All" ? "All Styles" : selectedStayType}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ACCOMMODATION_TYPES.map((type) => {
                  const isActive = selectedStayType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => handleStayTypeChange(type)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#B65E3C] text-[#FAF4E8] shadow-xs scale-[1.02]"
                          : "bg-white/80 hover:bg-white text-[#7B4D36] border border-[#E5D5BA]/80"
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Stays Grid */}
          {staysLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] animate-pulse space-y-4">
                  <div className="h-44 bg-[#E5D5BA]/60 rounded-2xl" />
                  <div className="h-5 bg-[#E5D5BA]/80 rounded w-2/3" />
                  <div className="h-3 bg-[#E5D5BA]/50 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : hotels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map((h) => {
                const isLiveStay = Boolean(h.is_live && h.source !== "vanvas_curated" && h.trust_source !== "VANVAS_CURATED");
                const isPriceVerified = h.price_verified !== false && typeof h.price_per_night === "number" && h.price_per_night > 0;
                const stayVisual = resolvePlaceArtwork(h.name, destination.name, "Stays & Sanctuaries", h.image_url, h.is_live, h.source);
                const displayPrice = h.price_formatted || (isPriceVerified ? `₹${h.price_per_night}/night` : "Rate upon inquiry");
                const badgeLabel = isLiveStay ? (h.badge || "VERIFIED LIVE STAY") : "CURATED STAY";
                const availState = isLiveStay ? (h.availability_state || "AVAILABLE") : (h.availability_state === "AVAILABLE" ? "UPON INQUIRY" : (h.availability_state || "UPON INQUIRY"));

                return (
                  <div key={h.id} className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] hover:border-[#173B32]/40 shadow-2xs hover:shadow-lg transition-all space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      {/* Visual Header */}
                      <div className="relative h-48 rounded-2xl overflow-hidden bg-[#E5D5BA]">
                        <VanvasImage
                          src={stayVisual.imageUrl}
                          fallbackSrc={stayVisual.fallbackUrl}
                          alt={`${h.name} in ${destination.name}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Top Badges */}
                        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#173B32] text-[#EFE5D2] shadow-xs">
                            {badgeLabel}
                          </span>

                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono uppercase font-bold tracking-wider shadow-xs ${
                            availState === "AVAILABLE"
                              ? "bg-emerald-600 text-white"
                              : "bg-[#0F2924]/80 backdrop-blur-xs text-[#FAF4E8] border border-white/15"
                          }`}>
                            {availState}
                          </span>
                        </div>

                        {/* Bottom Category Tag */}
                        <div className="absolute bottom-2.5 left-2.5">
                          <span className="px-2 py-0.5 rounded-md bg-[#0F2924]/85 backdrop-blur-xs text-[#FAF4E8] text-[10px] font-medium border border-white/10">
                            {h.accommodation_type || h.hotel_style || "Stay Sanctuary"}
                          </span>
                        </div>
                      </div>

                      {/* Content Details */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-serif font-bold text-base text-[#173B32] leading-snug">{h.name}</h4>
                          <span className={`font-bold text-xs shrink-0 ${isPriceVerified ? "text-[#B65E3C]" : "text-[#7B4D36]/80 text-[11px] font-mono"}`}>
                            {displayPrice}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7B4D36] mt-1 line-clamp-1">
                          {h.address}
                          {typeof h.distance_km === "number" && ` • ${h.distance_km} km away`}
                        </p>

                        {/* Verified Tags */}
                        {h.traveller_tags && h.traveller_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {h.traveller_tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-[#EFE5D2] text-[#7B4D36] border border-[#E5D5BA]">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Toolbar */}
                    <div className="pt-3 border-t border-[#E5D5BA] flex items-center justify-between text-xs text-[#536B52] gap-2">
                      <button
                        onClick={() => {
                          setSelectedStayForModal(h);
                          setStayModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] text-[#173B32] font-semibold text-xs hover:bg-[#EFE5D2] hover:border-[#173B32] transition-colors cursor-pointer"
                      >
                        View Property
                      </button>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {h.latitude && h.longitude && (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${h.latitude},${h.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-[#FAF7F0] border border-[#E5D5BA] text-[#173B32] hover:text-[#B65E3C] hover:border-[#B65E3C] transition-colors"
                            title="Get directions"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {h.phone && (
                          <a
                            href={`tel:${h.phone}`}
                            className="p-1.5 rounded-lg bg-[#FAF7F0] border border-[#E5D5BA] text-[#173B32] hover:text-emerald-700 hover:border-emerald-700 transition-colors"
                            title={`Call ${h.phone}`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {(h.booking_url || h.provider_url) ? (
                          <a
                            href={h.booking_url || h.provider_url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-[#173B32] text-[#EFE5D2] rounded-xl font-bold text-xs hover:bg-[#B65E3C] transition-colors flex items-center gap-1 shrink-0"
                          >
                            <span>Book</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] text-center space-y-2">
              <BedDouble className="w-8 h-8 text-[#B65E3C] mx-auto opacity-70" />
              <h4 className="font-serif font-bold text-base text-[#173B32]">No verified stays available matching these filters.</h4>
              <p className="text-xs text-[#7B4D36] max-w-md mx-auto">
                No accommodation matching your criteria was returned by live inventory providers for this destination. Try resetting style filters or selecting All Profiles.
              </p>
              <button
                onClick={() => {
                  setSelectedTravellerProfile("All");
                  setSelectedStayType("All");
                  fetchFilteredStays("All", "All");
                }}
                className="mt-2 px-4 py-1.5 rounded-xl bg-[#173B32] text-[#EFE5D2] text-xs font-bold hover:bg-[#B65E3C] transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>

        {/* 8. VALLEY MOBILITY & RENTALS */}
        <div className="space-y-6 pt-6 border-t-2 border-[#E5D5BA]">
          <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#B65E3C]">
                सवारी • Valley Mobility &amp; Rentals
              </span>
              <h3 className="font-serif font-black text-2xl sm:text-3xl text-[#173B32] flex items-center gap-2 mt-0.5">
                <Bike className="w-6 h-6 text-[#B65E3C]" />
                <span>
                  {destination.slug === "tungnath-chandrashila" ? "Approach Transit & Trailhead Mobility" : "Scooter & Motorcycle Rentals"} {!rentalsLoading && `(${rentals.length})`}
                </span>
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase bg-[#FAF7F0] border border-[#E5D5BA] text-[#7B4D36]">
              {destination.slug === "tungnath-chandrashila" ? "Trek Sanctuary Route" : (isCurated ? "Verified Regional Fleet" : "Live Mobility Directory")}
            </span>
          </div>

          {rentalsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] animate-pulse space-y-4">
                  <div className="h-44 bg-[#E5D5BA]/60 rounded-2xl" />
                  <div className="h-5 bg-[#E5D5BA]/80 rounded w-2/3" />
                  <div className="h-3 bg-[#E5D5BA]/50 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : rentals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rentals.map((r) => {
                const vStatus = r.verification_status || "VERIFIED";
                const isLiveProvider = vStatus === "LIVE_PROVIDER";
                const hasPrice = typeof r.price_per_day === "number" && r.price_per_day > 0;

                const dirLink = r.action_links?.find((l) => l.type === "directions")?.url ||
                  (r.latitude && r.longitude ? `https://www.google.com/maps/dir/?api=1&destination=${r.latitude},${r.longitude}` : null);
                const phoneLink = r.action_links?.find((l) => l.type === "phone")?.url || (r.phone ? `tel:${r.phone}` : null);
                const waLink = r.action_links?.find((l) => l.type === "whatsapp")?.url ||
                  (r.whatsapp ? `https://wa.me/${r.whatsapp.replace(/[^\d]/g, "")}` : null);

                return (
                  <div key={r.id} className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] hover:border-[#173B32]/40 shadow-2xs hover:shadow-lg transition-all space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="relative h-44 rounded-2xl overflow-hidden bg-[#E5D5BA]">
                        <VehicleArtwork
                          type={r.vehicle_type}
                          name={r.vehicle_name}
                          destination={destination.name}
                          context={{
                            destination: destination.name,
                            state: destination.state,
                            region: destination.region,
                          }}
                          imageUrl={r.image_url}
                          alt={r.vehicle_name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#173B32] text-[#EFE5D2] shadow-xs">
                            {isLiveProvider ? "LIVE PROVIDER" : "VERIFIED MOBILITY"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-serif font-bold text-base text-[#173B32] leading-snug">{r.vehicle_name}</h4>
                            <p className="text-[11px] font-medium text-[#7B4D36]">
                              {r.provider_name}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`font-bold text-sm block ${hasPrice ? "text-[#173B32]" : "text-[#7B4D36]/80 text-[11px] font-mono"}`}>
                              {hasPrice ? `₹${r.price_per_day}/day` : "Price upon inquiry"}
                            </span>
                          </div>
                        </div>

                        {r.deposit_amount ? (
                          <p className="text-[11px] text-[#7B4D36]">
                            Deposit: <span className="font-semibold text-[#173B32]">₹{r.deposit_amount}</span>
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="p-2.5 rounded-xl bg-[#EFE5D2] text-xs font-medium text-[#173B32] flex items-center justify-between gap-2">
                        <span className="line-clamp-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#B65E3C] shrink-0" />
                          <span className="truncate">{r.location || "Regional Hub"}</span>
                        </span>
                        <span className="text-[11px] text-[#7B4D36] shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>{r.opening_hours || "08:00 AM - 08:00 PM"}</span>
                        </span>
                      </div>

                      {/* Action Links */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {dirLink ? (
                          <a
                            href={dirLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#173B32] text-[#FAF4E8] text-xs font-bold hover:bg-[#0F2924] transition-colors shadow-2xs"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Directions</span>
                          </a>
                        ) : (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#173B32] text-[#FAF4E8] text-xs font-bold hover:bg-[#0F2924] transition-colors shadow-2xs"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Directions</span>
                          </a>
                        )}

                        {phoneLink ? (
                          <a
                            href={phoneLink}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#173B32]/30 text-[#173B32] text-xs font-bold hover:bg-[#EFE5D2] transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5 text-[#173B32]" />
                            <span>Call</span>
                          </a>
                        ) : waLink ? (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-2xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        ) : (
                          <Link
                            href={`/plan?dest=${destination.id}`}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] text-[#7B4D36] text-xs font-medium hover:text-[#173B32] transition-colors"
                          >
                            <span>Reserve Fleet</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : destination.slug === "tungnath-chandrashila" ? (
            <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#B65E3C]">
                <Footprints className="w-4 h-4" />
                <span>पैदल तीर्थ मार्ग • Pilgrimage Approach &amp; Base Roadhead</span>
              </div>
              <h4 className="font-serif font-black text-xl sm:text-2xl text-[#173B32]">
                Tungnath–Chandrashila Approach Transport &amp; Trail Mobility
              </h4>
              <p className="text-xs text-[#20211D]/85 leading-relaxed font-light">
                Tungnath Temple and Chandrashila Summit are located within the sacred Kedarnath Wildlife Sanctuary and are strictly pedestrian trekking sanctuaries. No motorbikes, scooters, or private vehicles are permitted on the walking trail beyond the Chopta roadhead base camp (2,680m).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
                <div className="p-4 rounded-2xl bg-[#EFE5D2] space-y-1.5 border border-[#E5D5BA]">
                  <span className="font-bold text-[#173B32] block text-sm">Approach Hubs &amp; Fleet</span>
                  <p className="text-[#7B4D36] font-light leading-relaxed">
                    Motorcycle/scooter rentals and private taxis are hired from gateway valley hubs: Rishikesh (210 km), Haridwar (230 km), or Dehradun via Rudraprayag and Ukhimath.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#EFE5D2] space-y-1.5 border border-[#E5D5BA]">
                  <span className="font-bold text-[#173B32] block text-sm">Chopta Base Roadhead Parking</span>
                  <p className="text-[#7B4D36] font-light leading-relaxed">
                    Vehicles are parked securely at Chopta roadhead parking lot. Local taxi unions operate regular return transfers to Ukhimath, Guptkashi, and Gopeshwar.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#EFE5D2] space-y-1.5 border border-[#E5D5BA]">
                  <span className="font-bold text-[#173B32] block text-sm">Trailhead Horse &amp; Porter Service</span>
                  <p className="text-[#7B4D36] font-light leading-relaxed">
                    For pilgrims requiring ascent assistance, registered horse and pony operators are available at the Chopta trailhead up to Tungnath Temple shrine.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] text-center space-y-2">
              <Bike className="w-8 h-8 text-[#B65E3C] mx-auto opacity-70" />
              <h4 className="font-serif font-bold text-base text-[#173B32]">Mobility rentals operate from regional hubs</h4>
              <p className="text-xs text-[#7B4D36] max-w-md mx-auto">
                Scooter and bike rentals are available from regional hubs and local operator stands. Check back shortly for updated local listings.
              </p>
            </div>
          )}
        </div>

        {/* 9. EXPEDITION GUIDE & LOGISTICS (DESTINATION ISOLATED) */}
        {(() => {
          const guide = DESTINATION_TRAVEL_GUIDES[destination.slug] || DESTINATION_TRAVEL_GUIDES[destination.slug.toLowerCase()] || {
            seasonality: `Best visited during ${destination.best_time_to_visit || "spring and autumn months"} with clear skies and comfortable regional weather.`,
            clothing: "Comfortable, climate-appropriate clothing, sun protection, and sturdy walking shoes suitable for exploring local streets and regional terrain.",
            transport: `Local transport, walking, and regional taxis provide convenient access to major attractions in ${destination.name}.`,
            etiquette: `Respect local customs and traditions at sacred and heritage sites throughout ${destination.name}. Remove footwear where required.`
          };

          return (
            <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#B65E3C]">
                <Info className="w-4 h-4" />
                <span>मार्गदर्शन • Practical Expedition Guide</span>
              </div>
              <h3 className="text-2xl font-serif font-black text-[#173B32]">
                Essential Travel Information for {destination.name}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 text-xs text-[#20211D]/85">
                <div className="p-4 rounded-2xl bg-[#EFE5D2] space-y-1.5 border border-[#E5D5BA]">
                  <span className="font-bold text-[#173B32] flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-[#B65E3C]" />
                    <span>Seasonality &amp; Timing</span>
                  </span>
                  <p className="font-light leading-relaxed">
                    {guide.seasonality}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#EFE5D2] space-y-1.5 border border-[#E5D5BA]">
                  <span className="font-bold text-[#173B32] flex items-center gap-1">
                    <Mountain className="w-3.5 h-3.5 text-[#B65E3C]" />
                    <span>Packing &amp; Clothing</span>
                  </span>
                  <p className="font-light leading-relaxed">
                    {guide.clothing}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#EFE5D2] space-y-1.5 border border-[#E5D5BA]">
                  <span className="font-bold text-[#173B32] flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5 text-[#B65E3C]" />
                    <span>Transport &amp; Transit</span>
                  </span>
                  <p className="font-light leading-relaxed">
                    {guide.transport}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#EFE5D2] space-y-1.5 border border-[#E5D5BA]">
                  <span className="font-bold text-[#173B32] flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-[#B65E3C]" />
                    <span>Etiquette &amp; Tips</span>
                  </span>
                  <p className="font-light leading-relaxed">
                    {guide.etiquette}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

      </main>

      {/* Place Detail Modal */}
      <PlaceModal
        place={selectedPlace}
        destinationName={destination.name}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      {/* Stay Detail Modal */}
      {stayModalOpen && selectedStayForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-4 max-h-[90vh] flex flex-col justify-between">
            {/* Header Visual */}
            <div className="relative h-56 bg-[#E5D5BA] shrink-0">
              {(() => {
                const stayVisual = resolvePlaceArtwork(
                  selectedStayForModal.name,
                  destination.name,
                  "Stays & Sanctuaries",
                  selectedStayForModal.image_url,
                  selectedStayForModal.is_live,
                  selectedStayForModal.source
                );
                return (
                  <VanvasImage
                    src={stayVisual.imageUrl}
                    fallbackSrc={stayVisual.fallbackUrl}
                    alt={selectedStayForModal.name}
                    className="w-full h-full object-cover"
                  />
                );
              })()}

              <button
                onClick={() => setStayModalOpen(false)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-xs transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#173B32] text-[#EFE5D2] shadow-sm">
                  {selectedStayForModal.badge || "Verified Stay"}
                </span>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-600 text-white shadow-sm">
                  {selectedStayForModal.availability_state || "AVAILABLE"}
                </span>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#B65E3C] font-semibold">
                  {selectedStayForModal.accommodation_type || "Accommodation"} • {destination.name}
                </span>
                <h3 className="font-serif font-black text-2xl text-[#173B32] leading-tight mt-0.5">
                  {selectedStayForModal.name}
                </h3>
                <p className="text-xs text-[#7B4D36] mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#B65E3C] shrink-0" />
                  <span>
                    {selectedStayForModal.address}
                    {typeof selectedStayForModal.distance_km === "number" && ` (${selectedStayForModal.distance_km} km away)`}
                  </span>
                </p>
              </div>

              {/* Price & Rating Tier */}
              <div className="p-3.5 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#7B4D36] block">Verified Rate</span>
                  <span className="font-serif font-bold text-lg text-[#B65E3C]">
                    {selectedStayForModal.price_formatted || (selectedStayForModal.price_per_night ? `₹${selectedStayForModal.price_per_night}/night` : "Rate upon inquiry")}
                  </span>
                </div>
                {selectedStayForModal.rating && (
                  <div className="text-right">
                    <span className="text-[10px] font-mono uppercase text-[#7B4D36] block">Guest Score</span>
                    <span className="font-bold text-sm text-[#173B32] flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{selectedStayForModal.rating}</span>
                      {selectedStayForModal.review_count && (
                        <span className="text-xs font-normal text-[#7B4D36]">({selectedStayForModal.review_count})</span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Amenities */}
              {selectedStayForModal.amenities && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-[#173B32] uppercase tracking-wider block">
                    Verified Amenities &amp; Features
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStayForModal.amenities.split(",").map((a, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg text-xs bg-white text-[#7B4D36] border border-[#E5D5BA]">
                        {a.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Timing */}
              <div className="grid grid-cols-2 gap-3 text-xs text-[#7B4D36]">
                <div className="p-2.5 rounded-xl bg-white border border-[#E5D5BA]">
                  <span className="font-mono uppercase text-[10px] text-[#7B4D36]/80 block">Check-in</span>
                  <span className="font-semibold text-[#173B32]">{selectedStayForModal.check_in_time || "12:00 PM"}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#E5D5BA]">
                  <span className="font-mono uppercase text-[10px] text-[#7B4D36]/80 block">Check-out</span>
                  <span className="font-semibold text-[#173B32]">{selectedStayForModal.check_out_time || "10:00 AM"}</span>
                </div>
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="p-4 border-t border-[#E5D5BA] bg-[#FAF7F0] flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                {selectedStayForModal.latitude && selectedStayForModal.longitude && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedStayForModal.latitude},${selectedStayForModal.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-[#EFE5D2] border border-[#E5D5BA] text-[#173B32] hover:text-[#B65E3C] transition-colors"
                    title="Get Directions"
                  >
                    <MapPin className="w-4 h-4" />
                  </a>
                )}
                {selectedStayForModal.phone && (
                  <a
                    href={`tel:${selectedStayForModal.phone}`}
                    className="p-2 rounded-xl bg-[#EFE5D2] border border-[#E5D5BA] text-emerald-800 hover:text-emerald-950 transition-colors"
                    title={`Call ${selectedStayForModal.phone}`}
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
              </div>

              {(selectedStayForModal.booking_url || selectedStayForModal.provider_url) ? (
                <a
                  href={selectedStayForModal.booking_url || selectedStayForModal.provider_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-[#173B32] hover:bg-[#B65E3C] text-[#EFE5D2] rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span>Book Stay</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <button
                  onClick={() => setStayModalOpen(false)}
                  className="px-5 py-2.5 bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
