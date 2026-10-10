"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Compass, MapPin, Sparkles, Star, BedDouble, Bike, Clock,
  ExternalLink, ArrowRight, ShieldCheck, Bookmark, Check, Mountain,
  Calendar, Sun, Coffee, Trees, Fuel, AlertCircle, RefreshCw, Layers,
  Phone, Navigation, MessageCircle, Globe, Users, X, Home, Building2, CheckCircle2,
  Utensils, Info, Footprints, Flame, Camera, Sunrise, Map as MapIcon, ChevronRight,
  Route, Shield, ArrowDown
} from "lucide-react";

import { api } from "@/lib/api";
import { Destination, Place, Hotel, RentalOption, Offer, StructuredWeather, WeatherSnapshot } from "@/types";
import { VanvasWeatherCard, VanvasWeatherVisual } from "@/components/weather";
import { PlaceCard } from "@/components/places/PlaceCard";
import { PlaceModal } from "@/components/places/PlaceModal";
import { TravelStamp } from "@/components/ui/TravelStamp";
import { JournalNote } from "@/components/ui/JournalNote";
import { VanvasImage } from "@/components/ui/VanvasImage";
import { VanvasMap, VanvasMapMarker } from "@/components/ui/VanvasMap";
import { VehicleArtwork } from "@/components/ui/VehicleArtwork";
import { TravelingSoloSection } from "@/components/solo/TravelingSoloSection";
import { resolveDestinationVisualProfile } from "@/lib/visualIntelligence";
import { resolvePlaceArtwork, resolveHotelArtwork } from "@/lib/placeVisualResolver";
import { getCanonicalHindiName, findCanonicalDestination } from "@/lib/canonicalDestinations";
import {
  DESTINATION_TREK_REGISTRY,
  DEFAULT_NON_TREK_NOTICE,
  DESTINATION_DAY_TRIPS,
  DestinationTrekInfo,
  DestinationDayTrip
} from "@/lib/destinationContentModel";
import { useDensity } from "@/context/DensityContext";
import { useAskVanvas } from "@/context/AskVanvasContext";
import { CompactPlaceCard, CompactStayCard, CompactRentalCard, CompactTrekStrip } from "@/components/compact";
import { CheckoutModal } from "@/components/booking/CheckoutModal";
import { BookingConfirmationModal } from "@/components/booking/BookingConfirmationModal";
import { DestinationDetailSkeleton, CardSkeleton } from "@/components/ui/ParchmentSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Booking } from "@/types";

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
  rishikesh: {
    seasonality: "September to May is ideal with pleasant temperatures (15–28°C) for yoga, rafting, and evening aartis. June to August monsoon swells the Ganga and rafting is suspended, but ashrams and spiritual energy remain vibrant.",
    clothing: "Light breathable cotton clothing; modest attire covering shoulders and knees for ashrams and temples. Carry quick-dry clothes for rafting days at Shivpuri and Marine Drive launch points.",
    transport: "Ram Jhula and Lakshman Jhula are best explored on foot. Shared autos connect the Haridwar bypass to Swarg Ashram. Rafting launch points at Shivpuri require a taxi or rented scooter.",
    etiquette: "Rishikesh is a holy city: alcohol and non-vegetarian food are strictly prohibited within city limits. Maintain complete silence during the evening Ganga Aarti at Triveni Ghat and Parmarth Niketan. Dress modestly near ashrams.",
  },
  "kainchi-dham": {
    seasonality: "Open year-round with ideal weather from March to June and September to November (14–26°C). June 15th marks the grand annual Kainchi Bhandara (Pratishtha Divas) attracting thousands of devotees. Winters (Dec–Feb) are crisp and cold (2–12°C).",
    clothing: "Modest and respectful attire covering shoulders and knees for the sacred ashram. Light woollens or shawl for evenings and mornings throughout the year; warm jackets and thermal layers required in winter.",
    transport: "Located on the Nainital-Almora National Highway (NH-109), 17 km from Nainital and 9 km from Bhowali. Kathgodam is the nearest railway station (37 km / 1.5 hrs by taxi/bus). Pantnagar is the nearest airport (70 km). Shared sumos and local buses ply continuously between Kathgodam, Haldwani, Bhowali, and Kainchi.",
    etiquette: "Maintain absolute reverence, silence, and peace inside Neem Karoli Baba's ashram precincts. Photography is strictly prohibited inside the inner sanctum and Baba's room. Footwear must be deposited at the cloakroom before crossing the wooden bridge over the river.",
  },
  delhi: {
    seasonality: "October to March offers pleasant, cool weather for exploring heritage monuments and open-air bazaars. May–June experiences extreme heat (40–45°C).",
    clothing: "Comfortable cottons in summer; warm jackets and sweaters for chilly winter mornings/nights. Modest attire covering shoulders and knees for religious sites.",
    transport: "Delhi Metro provides the fastest, most reliable transit across the National Capital Region. Auto-rickshaws and cabs connect metro gates to local monuments.",
    etiquette: "Remove footwear and cover your head before entering Gurudwaras (e.g. Bangla Sahib) and Mosques (e.g. Jama Masjid).",
  },
};

import { useParams, useSearchParams, useRouter } from "next/navigation";

type OperationalMode = "overview" | "places" | "stays" | "mobility" | "solo";

export default function DestinationDetailPage() {
  const routeParams = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = (Array.isArray(routeParams?.slug) ? routeParams.slug[0] : (routeParams?.slug as string)) || "";
  const { isCompact } = useDensity();
  const { openAskVanvas, setTravelContext } = useAskVanvas();

  const [mounted, setMounted] = useState(false);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [weather, setWeather] = useState<WeatherSnapshot[]>([]);
  const [currentWeather, setCurrentWeather] = useState<StructuredWeather | null>(null);

  // Sync Destination context to Ask VANVAS
  useEffect(() => {
    if (destination) {
      setTravelContext({
        type: "destination",
        destinationName: destination.name,
        destinationSlug: destination.slug || slug,
        title: `ASK VANVAS · ${destination.name.toUpperCase()}`,
        subtitle: `Curated places, food & stays in ${destination.name}`,
        coordinates: destination.latitude && destination.longitude ? {
          lat: destination.latitude,
          lng: destination.longitude,
          label: destination.name,
        } : undefined,
      });
    } else if (slug) {
      const formattedName = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      setTravelContext({
        type: "destination",
        destinationName: formattedName,
        destinationSlug: slug,
        title: `ASK VANVAS · ${formattedName.toUpperCase()}`,
        subtitle: `Curated places, food & stays in ${formattedName}`,
      });
    }
  }, [destination, slug, setTravelContext]);
  
  // Independent Section Data & Loading States
  const [destLoading, setDestLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [staysLoading, setStaysLoading] = useState(true);
  const [selectedTravellerProfile, setSelectedTravellerProfile] = useState<string>("All");
  const [selectedStayType, setSelectedStayType] = useState<string>("All");
  const [selectedStayForModal, setSelectedStayForModal] = useState<Hotel | null>(null);
  const [stayModalOpen, setStayModalOpen] = useState(false);
  
  // Real Transaction & Checkout Modals
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedOfferForCheckout, setSelectedOfferForCheckout] = useState<Offer | null>(null);
  const [activeConfirmedBooking, setActiveConfirmedBooking] = useState<Booking | null>(null);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);

  const handleStartBooking = (hotel: Hotel) => {
    const base = hotel.price_per_night && hotel.price_per_night > 0 ? hotel.price_per_night : 2500;
    const taxes = Math.round(base * 0.12);
    const offer: Offer = {
      id: `offer_stay_${hotel.id}`,
      provider: hotel.source && hotel.source !== "vanvas_curated" ? hotel.source : "vanvas_sandbox_stay_adapter",
      offer_type: "stay",
      title: hotel.name,
      room_type: hotel.accommodation_type || "Deluxe Mountain View Sanctuary",
      currency: "INR",
      base_amount: base,
      taxes: taxes,
      fees: 0,
      total_amount: base + taxes,
      refundable: true,
      cancellation_policy: "Free cancellation up to 48 hours prior to check-in. Instant refund to source.",
      valid_until: new Date(Date.now() + 86400000).toISOString(),
      metadata: {
        destination: destination?.name || slug,
        address: hotel.address,
        rating: hotel.rating,
        hotel_id: hotel.id,
      },
    };
    setSelectedOfferForCheckout(offer);
    setCheckoutModalOpen(true);
  };

  const [rentals, setRentals] = useState<RentalOption[]>([]);
  const [rentalsLoading, setRentalsLoading] = useState(true);
  const [selectedRentalForModal, setSelectedRentalForModal] = useState<RentalOption | null>(null);
  const [rentalModalOpen, setRentalModalOpen] = useState(false);
  
  // Operational Modes
  const [activeMode, setActiveMode] = useState<OperationalMode>("overview");
  
  // Places Filtering & Progressive Discovery
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [placesVisibleCount, setPlacesVisibleCount] = useState<number>(24);
  
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [savedExperiences, setSavedExperiences] = useState<Record<string, boolean>>({});
  const [activeWaypointIdx, setActiveWaypointIdx] = useState<number>(0);
  const [expandedGuide, setExpandedGuide] = useState<"seasonality" | "clothing" | "transport" | "etiquette" | null>(null);

  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setModalOpen(false);
        setStayModalOpen(false);
        setRentalModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleModeChange = (mode: OperationalMode) => {
    setActiveMode(mode);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", mode);
      window.history.replaceState({}, "", url.toString());
    }
  };

  // Sync tab/mode from searchParams on mount or URL change
  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (tabParam) {
      if (tabParam === "stays" || tabParam === "hotels") setActiveMode("stays");
      else if (tabParam === "mobility" || tabParam === "rentals") setActiveMode("mobility");
      else if (tabParam === "places") setActiveMode("places");
      else if (tabParam === "solo") setActiveMode("solo");
      else if (tabParam === "overview") setActiveMode("overview");
    }
  }, [searchParams]);

  // Auto-open place modal if searchParams contains place query
  useEffect(() => {
    const placeParam = searchParams?.get("place");
    if (placeParam && places.length > 0 && !selectedPlace) {
      const target = placeParam.toLowerCase().trim();
      const match = places.find(
        (p) =>
          p.id.toLowerCase() === target ||
          (p.slug && p.slug.toLowerCase() === target) ||
          p.name.toLowerCase() === target ||
          p.name.toLowerCase().replace(/[^a-z0-9]/g, "-") === target.replace(/[^a-z0-9]/g, "-")
      );
      if (match) {
        setSelectedPlace(match);
        setModalOpen(true);
      }
    }
  }, [searchParams, places, selectedPlace]);

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
    },
    "kainchi-dham": {
      hindi: "कैंची धाम",
      alt: "1400M",
      quote: "Neem Karoli Baba's sacred riverside ashram nestled in pine-scented Kumaoni valleys.",
      province: "KUMAON UTTARAKHAND",
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
        const canon = findCanonicalDestination(slug);
        const resolvedDest = canon ? {
          ...data.destination,
          name: canon.name || data.destination.name,
          hindi_name: canon.hindi_name || data.destination.hindi_name,
          state: canon.state || data.destination.state,
          tagline: canon.tagline || data.destination.tagline,
          description: data.destination.description || canon.description,
          altitude_meters: canon.altitude_meters || data.destination.altitude_meters,
          best_time_to_visit: canon.best_time_to_visit || data.destination.best_time_to_visit,
        } : data.destination;
        setDestination(resolvedDest);
        setPlaces(data.places || []);
        setWeather(data.weather || []);
        if (data.current_weather) {
          setCurrentWeather(data.current_weather);
        } else {
          api.getDestinationWeather(slug)
            .then((w) => {
              if (w) {
                setCurrentWeather(w);
                if (w.daily && w.daily.length > 0) setWeather(w.daily);
              }
            })
            .catch(() => {});
        }
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
        console.warn("Destination API remote fetch failed, falling back to canonical sanctuary registry:", err);
        const canon = findCanonicalDestination(slug);
        if (canon) {
          setDestination({
            id: canon.id,
            name: canon.name,
            slug: canon.slug,
            state: canon.state,
            region: canon.region,
            tagline: canon.tagline,
            description: canon.description,
            latitude: canon.latitude,
            longitude: canon.longitude,
            altitude_meters: canon.altitude_meters,
            best_time_to_visit: canon.best_time_to_visit,
            weather_type: canon.weather_type,
            is_featured: canon.is_featured,
            is_curated: canon.is_curated,
            places_count: 8,
          });

          // Seed verified canonical places for Kainchi Dham and others
          if (canon.slug === "kainchi-dham") {
            setPlaces([
              {
                id: "kainchi-ashram",
                destination_id: canon.id,
                slug: "neem-karoli-baba-kainchi-ashram",
                name: "Neem Karoli Baba Kainchi Ashram",
                category: "Spiritual",
                rating: 4.9,
                review_count: 4820,
                description: "Sacred sanctuary established by Neem Karoli Baba in 1962 along the sparkling mountain stream. World-renowned for peace, selfless service, and continuous Hanuman Chalisa chanting.",
                latitude: 29.4239,
                longitude: 79.5165,
                address: "NH-109, Kainchi, Nainital District, Uttarakhand",
                is_must_visit: true,
                is_hidden_gem: false,
                is_indoor: false,
                tags: "Spiritual, Ashram, Neem Karoli Baba, Meditation, Temple",
                why_vanvas_recommends: "Sacred riverside chanting and immense spiritual calm in morning mountain mist.",
                recommended_duration_mins: 180,
                price_level: "Free Entry",
                source: "vanvas_curated",
              },
              {
                id: "kainchi-riverbed",
                destination_id: canon.id,
                slug: "kshipra-mountain-stream",
                name: "Kshipra Mountain Stream & Meditation Ghat",
                category: "Nature",
                rating: 4.8,
                review_count: 1420,
                description: "Pristine clear mountain river flowing alongside the ashram beneath towering Kumaoni deodar and pine hills.",
                latitude: 29.4245,
                longitude: 79.5170,
                address: "Behind Kainchi Ashram, NH-109",
                is_must_visit: true,
                is_hidden_gem: false,
                is_indoor: false,
                tags: "River, Nature, Meditation, Peaceful",
                why_vanvas_recommends: "Sit on the stone steps beside the rushing stream to meditate in silence.",
                recommended_duration_mins: 90,
                price_level: "Free",
                source: "vanvas_curated",
              },
              {
                id: "bhowali-fruit-market",
                destination_id: canon.id,
                slug: "bhowali-orchards",
                name: "Bhowali Apple & Apricot Orchards",
                category: "Markets",
                rating: 4.7,
                review_count: 2150,
                description: "Famed fruit basket of Kumaon located 9 km from Kainchi, with rolling orchards of apples, plums, apricots, and wild buransh squash.",
                latitude: 29.3800,
                longitude: 79.5200,
                address: "Bhowali-Almora Junction, Bhowali",
                is_must_visit: false,
                is_hidden_gem: true,
                is_indoor: false,
                tags: "Fruit Market, Orchards, Kumaoni Produce, Shopping",
                why_vanvas_recommends: "Farm-fresh mountain fruit and organic buransh squash straight from local farmers.",
                recommended_duration_mins: 90,
                price_level: "₹₹",
                source: "vanvas_curated",
              },
              {
                id: "golu-devta-ghorakhal-place",
                destination_id: canon.id,
                slug: "golu-devta-temple-ghorakhal",
                name: "Golu Devta Temple (Temple of 10,000 Bells)",
                category: "Culture",
                rating: 4.9,
                review_count: 3600,
                description: "Ancient shrine of the God of Justice adorned with thousands of solid brass bells and handwritten petitions overlooking the Bhimtal valley.",
                latitude: 29.3950,
                longitude: 79.4880,
                address: "Ghorakhal, Near Bhowali, Nainital",
                is_must_visit: true,
                is_hidden_gem: false,
                is_indoor: false,
                tags: "Temple, Brass Bells, Heritage, Kumaoni Culture",
                why_vanvas_recommends: "The acoustic chime of thousands of temple bells overlooking the pine valley is unforgettable.",
                recommended_duration_mins: 90,
                price_level: "Free",
                source: "vanvas_curated",
              }
            ]);
          } else {
            setPlaces([]);
          }

          setDestLoading(false);
          setStaysLoading(false);
          setRentalsLoading(false);
        } else {
          setLoadError(err.message || "Failed to load destination");
          setDestLoading(false);
          setStaysLoading(false);
          setRentalsLoading(false);
        }
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

  const allCategories = [
    { id: "all", label: "All Places", count: places.length },
    { id: "must-visit", label: "Must Visit", count: places.filter((p) => Boolean(p.is_must_visit)).length },
    { id: "hidden", label: "Hidden Gems", count: places.filter((p) => Boolean(p.is_hidden_gem)).length },
    { id: "cafes", label: "Cafés & Bakeries", count: places.filter((p) => getCategory(p).includes("café") || getCategory(p).includes("bakery") || getCategory(p).includes("cafe") || getCategory(p).includes("coffee")).length },
    { id: "food", label: "Local Food & Dhabas", count: places.filter((p) => getCategory(p).includes("food") || getCategory(p).includes("dhaba") || getCategory(p).includes("restaurant") || getCategory(p).includes("dining")).length },
    { id: "nature", label: "Trails & Nature", count: places.filter((p) => getCategory(p).includes("nature") || getCategory(p).includes("trail") || getCategory(p).includes("waterfall") || getCategory(p).includes("scenic") || getCategory(p).includes("lake") || getCategory(p).includes("viewpoint")).length },
    { id: "culture", label: "Culture & Temples", count: places.filter((p) => getCategory(p).includes("culture") || getCategory(p).includes("temple") || getCategory(p).includes("heritage") || getCategory(p).includes("monastery") || getCategory(p).includes("ghat") || getCategory(p).includes("spiritual") || getCategory(p).includes("fort") || getCategory(p).includes("palace") || getCategory(p).includes("ashram")).length },
    { id: "adventure", label: "Adventure & Treks", count: places.filter((p) => getCategory(p).includes("adventure") || getCategory(p).includes("trek") || getCategory(p).includes("rafting") || getCategory(p).includes("paragliding") || getCategory(p).includes("skiing")).length },
    { id: "markets", label: "Shops & Bazaars", count: places.filter((p) => getCategory(p).includes("market") || getCategory(p).includes("shop") || getCategory(p).includes("bazaar") || getCategory(p).includes("craft") || getCategory(p).includes("souvenir")).length },
  ];

  // Automatically hide empty categories
  const categories = allCategories.filter((c) => c.id === "all" || c.count > 0);

  const filteredPlaces = places.filter((p) => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "must-visit") return Boolean(p.is_must_visit);
    if (selectedCategory === "hidden") return Boolean(p.is_hidden_gem);
    const cat = getCategory(p);
    if (selectedCategory === "cafes") return cat.includes("café") || cat.includes("bakery") || cat.includes("cafe") || cat.includes("coffee");
    if (selectedCategory === "food") return cat.includes("food") || cat.includes("dhaba") || cat.includes("restaurant") || cat.includes("dining");
    if (selectedCategory === "nature") return cat.includes("nature") || cat.includes("trail") || cat.includes("waterfall") || cat.includes("scenic") || cat.includes("lake") || cat.includes("viewpoint");
    if (selectedCategory === "culture") return cat.includes("culture") || cat.includes("temple") || cat.includes("heritage") || cat.includes("monastery") || cat.includes("ghat") || cat.includes("spiritual") || cat.includes("fort") || cat.includes("palace") || cat.includes("ashram");
    if (selectedCategory === "adventure") return cat.includes("adventure") || cat.includes("trek") || cat.includes("rafting") || cat.includes("paragliding") || cat.includes("skiing");
    if (selectedCategory === "markets") return cat.includes("market") || cat.includes("shop") || cat.includes("bazaar") || cat.includes("craft") || cat.includes("souvenir");
    return true;
  });

  const normKey = slug.toLowerCase().replace(/[^a-z0-9]/g, "");
  const matchedMetaKey = Object.keys(destMetadata).find((k) => normKey.includes(k.replace(/[^a-z0-9]/g, "")));
  const canonicalDest = findCanonicalDestination(slug);
  const canonicalHindi = destination?.hindi_name || getCanonicalHindiName(slug) || canonicalDest?.hindi_name || "";
  const meta = {
    hindi: canonicalHindi || (matchedMetaKey ? destMetadata[matchedMetaKey]?.hindi : null) || destination?.name || "यात्रा",
    alt: `${destination?.altitude_meters || canonicalDest?.altitude_meters || 550}M`,
    quote: destination?.tagline || canonicalDest?.tagline || "Live travel discovery and verified coordinates.",
    province: destination?.state ? destination.state.toUpperCase() : (canonicalDest?.state ? canonicalDest.state.toUpperCase() : "LIVE DISCOVERY"),
  };

  const isCurated = destination ? destination.is_curated !== false : true;

  // Resolve Trek Information for destination
  const trekInfo: DestinationTrekInfo =
    DESTINATION_TREK_REGISTRY[slug] ||
    DESTINATION_TREK_REGISTRY[slug.toLowerCase()] ||
    DEFAULT_NON_TREK_NOTICE[slug] ||
    DEFAULT_NON_TREK_NOTICE[slug.toLowerCase()] || {
      hasTrek: false,
      title: `Trekking Not Applicable in ${destination?.name || slug}`,
      hindiTitle: `${meta.hindi} में पदयात्रा मार्ग लागू नहीं`,
      trailSummary: `${destination?.name || slug} is a cultural and heritage sanctuary best explored through local discovery rather than wilderness mountain trekking.`,
      baseCamp: destination?.name || slug,
      elevationGain: "N/A",
      peakAltitude: meta.alt,
      distance: "N/A",
      duration: "N/A",
      difficulty: "Easy",
      bestSeason: destination?.best_time_to_visit || "All Seasons",
      approachTransport: "Local transport and heritage walks.",
      packingChecklist: [],
      waypoints: [],
      nonTrekNotice: {
        heading: "Heritage Sanctuary — Wilderness Trek Unavailable",
        explanation: `${destination?.name || slug} is best experienced via walking heritage quarters, local food trails, and cultural landmarks. Use our 1-Day Same-Day Journey for a complete itinerary.`,
        alternativeMode: "oneday",
      },
    };

  // Resolve 1-Day Round Trip Information for destination
  const dayTrip: DestinationDayTrip | undefined =
    DESTINATION_DAY_TRIPS[slug] ||
    DESTINATION_DAY_TRIPS[slug.toLowerCase()];

  if (!mounted || destLoading || !destination) {
    if (loadError) {
      const is404 = loadError.includes("404") || loadError.toLowerCase().includes("not found");
      return (
        <div className="min-h-screen bg-[#EFE5D2] flex items-center justify-center p-4">
          <EmptyState
            icon={AlertCircle}
            stampText={is404 ? "अभयारण्य • 404 INDEX" : "कनेक्शन • TIMEOUT"}
            hindiTitle={is404 ? "अभयारण्य नहीं मिला" : "कनेक्शन स्थिति"}
            title={is404 ? "Destination Not Found" : "Himalayan Operating Layer Reconnecting..."}
            description={
              is404
                ? "Could not resolve live information for this location. Please try exploring another sanctuary from our curated registry."
                : "VANVAS backend was temporarily warming up or network was interrupted. Tap retry below to establish the connection."
            }
            actionLabel="Retry Connection"
            onActionClick={fetchDestination}
            secondaryActionLabel="Back to Explore"
            onSecondaryActionClick={() => window.location.href = "/explore"}
          />
        </div>
      );
    }
    return <DestinationDetailSkeleton />;
  }

  const profile = resolveDestinationVisualProfile(destination.slug || destination.name, destination.state, destination.altitude_meters);
  const regionType = profile.terrainType;

  return (
    <div className="min-h-screen bg-[#EFE5D2] pb-28">
      {isCompact ? (
        /* ======================================================== */
        /* COMPACT MODE: FIELD GUIDE / EXPLORER'S HANDBOOK LAYOUT    */
        /* ======================================================== */
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-6">
          {/* Top Field Guide Header */}
          <div className="bg-[#FAF7F0] rounded-3xl border-2 border-[#E5D5BA] p-4 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-[#173B32] text-[#EFE5D2] text-[9.5px] font-mono font-bold uppercase tracking-wider">
                    FIELD GUIDE
                  </span>
                  <span className="text-xs font-mono text-[#7B4D36] font-bold">
                    {meta.province}
                  </span>
                </div>

                <div className="flex items-baseline gap-2.5">
                  <h1 className="text-2xl sm:text-4xl font-serif font-black text-[#173B32]">
                    {destination.name}
                  </h1>
                  <span className="font-devanagari text-lg sm:text-2xl text-[#B49252] font-bold">
                    {meta.hindi}
                  </span>
                </div>

                <p className="text-xs font-mono text-[#536B52]">
                  {destination.state} · {meta.alt} · 4 days suggested
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Link
                  href={`/plan?dest=${destination.id || slug}`}
                  className="px-4 py-2.5 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] font-bold text-xs uppercase tracking-wider shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#B49252]" />
                  <span>Plan Trip</span>
                </Link>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2.5 rounded-xl bg-[#EFE5D2] hover:bg-[#E5D5BA] border border-[#E5D5BA] text-[#173B32] text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5 text-[#B49252]" />
                  <span>Map</span>
                </a>
              </div>
            </div>

            {/* Compact Stats Navigation Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-[#E5D5BA] text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveMode("places")}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-colors ${
                  activeMode === "places" ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32]" : "bg-[#EFE5D2] text-[#173B32] border-[#E5D5BA] hover:bg-[#E5D5BA]"
                }`}
              >
                <span>Places</span>
                <span className="font-bold">{places.length}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode("stays")}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-colors ${
                  activeMode === "stays" ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32]" : "bg-[#EFE5D2] text-[#173B32] border-[#E5D5BA] hover:bg-[#E5D5BA]"
                }`}
              >
                <span>Stays</span>
                <span className="font-bold">{hotels.length}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode("mobility")}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-colors ${
                  activeMode === "mobility" ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32]" : "bg-[#EFE5D2] text-[#173B32] border-[#E5D5BA] hover:bg-[#E5D5BA]"
                }`}
              >
                <span>Rentals</span>
                <span className="font-bold">{rentals.length}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode("solo")}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-colors ${
                  activeMode === "solo" ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32]" : "bg-[#EFE5D2] text-[#173B32] border-[#E5D5BA] hover:bg-[#E5D5BA]"
                }`}
              >
                <span>Solo Mode</span>
                <span className="font-bold">Active</span>
              </button>
            </div>
          </div>

          {/* Compact Weather Summary Module */}
          <VanvasWeatherCard
            destinationName={destination.name}
            structuredWeather={currentWeather}
            weatherSnapshots={weather}
            isCompact={true}
          />

          {/* PLACES SECTION (COMPACT 2-COLUMN GRID) */}
          {(activeMode === "overview" || activeMode === "places") && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-black text-lg text-[#173B32] uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#B65E3C]" />
                  <span>Curated Places ({places.length})</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                {places.map((place) => (
                  <CompactPlaceCard
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

          {/* STAYS SECTION (COMPACT 2-COLUMN GRID) */}
          {(activeMode === "overview" || activeMode === "stays") && hotels.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-black text-lg text-[#173B32] uppercase tracking-wider flex items-center gap-2">
                  <BedDouble className="w-4 h-4 text-[#B65E3C]" />
                  <span>Stays &amp; Sanctuaries ({hotels.length})</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                {hotels.map((hotel) => (
                  <CompactStayCard
                    key={hotel.id}
                    hotel={hotel}
                    onSelect={(h) => {
                      setSelectedStayForModal(h);
                      setStayModalOpen(true);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* GET AROUND / RENTALS SECTION (COMPACT 2-COLUMN GRID) */}
          {(activeMode === "overview" || activeMode === "mobility") && rentals.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-black text-lg text-[#173B32] uppercase tracking-wider flex items-center gap-2">
                  <Bike className="w-4 h-4 text-[#B65E3C]" />
                  <span>Get Around / Rentals ({rentals.length})</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                {rentals.map((rental) => (
                  <CompactRentalCard
                    key={rental.id}
                    rental={rental}
                    onSelect={(r) => {
                      setSelectedRentalForModal(r);
                      setRentalModalOpen(true);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* SOLO SECTION */}
          {activeMode === "solo" && (
            <div className="space-y-4 pt-2">
              <TravelingSoloSection
                destinationId={destination.id}
                destinationSlug={destination.slug || slug}
                destinationName={destination.name}
              />
            </div>
          )}
        </div>
      ) : (
        /* ======================================================== */
        /* ORIGINAL MODE: IMMERSIVE EDITORIAL MAGAZINE LAYOUT       */
        /* ======================================================== */
        <>
          {/* 1. HERO BANNER */}
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
                  href={`/plan?dest=${destination.id || slug}`}
                  className="px-7 py-4 rounded-2xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] font-bold text-xs uppercase tracking-wider shadow-2xl flex items-center justify-center gap-2 transition-all transform active:scale-95 border border-[#7B4D36]/30"
                >
                  <Sparkles className="w-4 h-4 text-[#B49252]" />
                  <span>Plan This Trip</span>
                </Link>
              </div>
            </div>
          </section>

          {/* 2. DESTINATION OPERATIONAL MODES TAB BAR */}
          <div
            style={{ top: "var(--vanvas-top-offset, 4rem)" }}
            className="sticky z-30 bg-[#FAF7F0]/95 backdrop-blur-md border-y border-[#E5D5BA] py-3 shadow-xs"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
              {(() => {
                const isMountainValley = (destination?.region || "").toLowerCase().includes("himalay") || (destination?.region || "").toLowerCase().includes("valley") || (destination?.altitude_meters || 0) > 1200;
                const mobilityLabel = isMountainValley ? "Valley Mobility" : "Local Mobility";
                return [
                  { id: "overview", label: "Overview", devanagari: "सफ़रनामा", icon: Compass },
                  { id: "solo", label: "Traveling Solo?", devanagari: "अकेले यात्री", icon: Users },
                  { id: "places", label: "Curated Places", devanagari: "पड़ाव", icon: Sparkles, count: places.length },
                  { id: "stays", label: "Stays & Sanctuaries", devanagari: "आशियाना", icon: BedDouble, count: hotels.length },
                  { id: "mobility", label: mobilityLabel, devanagari: "सवारी", icon: Bike, count: rentals.length },
                ];
              })().map((mode) => {
                const Icon = mode.icon;
                const isActive = activeMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      handleModeChange(mode.id as OperationalMode);
                      window.scrollTo({ top: 400, behavior: "smooth" });
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? "bg-[#173B32] text-[#EFE5D2] shadow-sm border-2 border-[#173B32] scale-[1.02]"
                        : "bg-[#EFE5D2] hover:bg-[#E5D5BA] text-[#173B32] border border-[#E5D5BA]"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#B49252]" : "text-[#B65E3C]"}`} />
                    <span>{mode.label}</span>
                    <span className={`text-[10px] ${isActive ? "text-[#B49252]" : "text-[#7B4D36]"} opacity-80`}>
                      ({mode.devanagari})
                    </span>
                    {mode.count !== undefined && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? "bg-[#B49252] text-[#0F2924]" : "bg-[#FAF7F0] text-[#7B4D36]"}`}>
                        {mode.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

      {/* Main Content Sections */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
        
        {/* MODE: SOLO DIRECT VIEW */}
        {activeMode === "solo" && (
          <div className="space-y-6 animate-fadeIn">
            <TravelingSoloSection
              destinationId={destination.id}
              destinationSlug={destination.slug || slug}
              destinationName={destination.name}
            />
          </div>
        )}

        {/* MODE: OVERVIEW */}
        {activeMode === "overview" && (
          <div className="space-y-12 animate-fadeIn">
            {/* Sanctuary Dispatch Overview */}
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

                  {/* Contextual Experience Bridges */}
                  <div className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-3 text-xs">
                    <span className="font-bold uppercase tracking-wider text-[#173B32] block">
                      Dedicated Expeditions
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/treks?destination=${destination.slug}`}
                        className="p-2.5 rounded-xl bg-[#EFE5D2] hover:bg-[#173B32] hover:text-[#FAF7F0] text-[#173B32] font-bold text-left flex items-center justify-between transition-all group cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <Footprints className="w-3.5 h-3.5 text-[#B65E3C] group-hover:text-[#B49252]" />
                          <span>Trek Mode</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </Link>
                      <Link
                        href={`/one-day?from=${destination.slug}`}
                        className="p-2.5 rounded-xl bg-[#EFE5D2] hover:bg-[#173B32] hover:text-[#FAF7F0] text-[#173B32] font-bold text-left flex items-center justify-between transition-all group cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#B65E3C] group-hover:text-[#B49252]" />
                          <span>1-Day Escape</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2.5 TRAVELING SOLO & CIRCLES SECTION (In Overview Flow) */}
            <div className="pt-2">
              <TravelingSoloSection
                destinationId={destination.id}
                destinationSlug={destination.slug || slug}
                destinationName={destination.name}
              />
            </div>

            {/* VANVAS Interactive Sanctuary Map */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#E5D5BA] pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B65E3C]">
                    सफ़र का नक्शा • VANVAS CARTOGRAPHY
                  </span>
                  <h3 className="text-xl sm:text-2xl font-serif font-black text-[#173B32]">
                    Sanctuary Geography &amp; Coordinates
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#7B4D36]">
                  Topographic map layer with verified places and terrain coordinates
                </span>
              </div>

              {(() => {
                const mapMarkers: VanvasMapMarker[] = [
                  {
                    id: `dest-${destination.id || slug}`,
                    title: destination.name,
                    hindiTitle: meta.hindi,
                    type: "destination",
                    lat: destination.latitude,
                    lng: destination.longitude,
                    elevationMeters: destination.altitude_meters,
                    description: destination.tagline || destination.description,
                    categoryLabel: "Sanctuary Hub",
                    provenance: "VERIFIED"
                  },
                  ...places.slice(0, 10).map((p): VanvasMapMarker => {
                    const cat = getCategory(p);
                    let mType: VanvasMapMarker["type"] = "waypoint";
                    if (cat.includes("temple") || cat.includes("spiritual") || cat.includes("monastery")) mType = "temple";
                    else if (cat.includes("cafe") || cat.includes("bakery")) mType = "cafe";
                    else if (cat.includes("food") || cat.includes("dhaba")) mType = "food";
                    else if (cat.includes("viewpoint") || cat.includes("scenic")) mType = "viewpoint";
                    else if (cat.includes("trail") || cat.includes("waterfall")) mType = "waypoint";
                    else if (cat.includes("shop") || cat.includes("bazaar")) mType = "shop";

                    return {
                      id: p.id,
                      title: p.name,
                      type: mType,
                      lat: p.latitude || destination.latitude + (Math.sin(p.name.length) * 0.04),
                      lng: p.longitude || destination.longitude + (Math.cos(p.name.length) * 0.04),
                      elevationMeters: destination.altitude_meters,
                      description: p.description,
                      categoryLabel: p.category,
                      provenance: "DATABASE",
                      actionLabel: "View Place Dossier"
                    };
                  })
                ];

                return (
                  <VanvasMap
                    mode="core"
                    title={`${destination.name} Sanctuary Map`}
                    subtitle={`${meta.hindi} • Coordinates ${destination.latitude.toFixed(2)}°N, ${destination.longitude.toFixed(2)}°E • ${destination.altitude_meters}m`}
                    center={{ lat: destination.latitude, lng: destination.longitude }}
                    markers={mapMarkers}
                    height={400}
                    onSelectMarker={(m) => {
                      if (m && m.type !== "destination") {
                        const foundP = places.find((p) => p.id === m.id);
                        if (foundP) {
                          setSelectedPlace(foundP);
                          setModalOpen(true);
                        }
                      }
                    }}
                  />
                );
              })()}
            </div>

            {/* VANVAS METEOROLOGICAL COCKPIT */}
            <VanvasWeatherCard
              destinationName={destination.name}
              structuredWeather={currentWeather}
              weatherSnapshots={weather}
              isCompact={false}
            />
            {/* Contextual Experience Bridges: Trek Mode & One-Day Escape */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Contextual Trek CTA */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#111A16] text-[#EFE5D2] border-2 border-[#2C3E35] flex flex-col justify-between space-y-6 shadow-xl">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#E05A2B] text-white text-[10px] font-mono font-bold uppercase">
                      HIGH ALTITUDE TRAILS
                    </span>
                    <span className="text-[11px] font-mono text-[#B49252]">TOP-LEVEL EXPEDITION DESK</span>
                  </div>
                  <h3 className="text-2xl font-serif font-black text-white">
                    Trek This Region
                  </h3>
                  <p className="text-xs text-[#A6BAAE] font-serif leading-relaxed">
                    Access dedicated topographic route comparisons, elevation graphs, gear planners, and live trail cockpit for trails around {destination.name}.
                  </p>
                </div>
                <Link
                  href={`/treks?destination=${destination.slug || slug}`}
                  className="px-6 py-3.5 rounded-2xl bg-[#E05A2B] hover:bg-[#C8491D] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                >
                  <Mountain className="w-4 h-4" />
                  <span>Launch Trek Mode →</span>
                </Link>
              </div>

              {/* Contextual One-Day Escape CTA */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF4E8] border-2 border-[#E5D5BA] flex flex-col justify-between space-y-6 shadow-md">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#B65E3C] text-white text-[10px] font-mono font-bold uppercase">
                      SPONTANEOUS ROAD TRIP
                    </span>
                    <span className="text-[11px] font-mono text-[#7B4D36]">WE HAVE 1 DAY. LET&apos;S GO.</span>
                  </div>
                  <h3 className="text-2xl font-serif font-black text-[#173B32]">
                    Plan a 1-Day Escape
                  </h3>
                  <p className="text-xs text-[#7B4D36] font-serif leading-relaxed">
                    Generate instant group road trips, split fuel & meal costs with friends, discover vehicle rentals, and view timeline boards starting from {destination.name}.
                  </p>
                </div>
                <Link
                  href={`/one-day?from=${destination.slug || slug}`}
                  className="px-6 py-3.5 rounded-2xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                >
                  <Clock className="w-4 h-4 text-[#B49252]" />
                  <span>Plan 1-Day Road Trip →</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* MODE: CURATED PLACES (Progressive Discovery) */}
        {(activeMode === "places" || activeMode === "overview") && isCurated && places.length > 0 && (
          <div className="space-y-6 pt-4 border-t-2 border-[#E5D5BA] animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5D5BA] pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#B65E3C]">
                  चुनिंदा पड़ाव • Curated Sanctuaries
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif font-black text-[#173B32]">
                  Curated Trails, Cafés &amp; Local Landmarks ({filteredPlaces.length})
                </h3>
              </div>
              <span className="text-xs font-mono text-[#7B4D36]">
                Showing {Math.min(placesVisibleCount, filteredPlaces.length)} of {filteredPlaces.length} places
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setPlacesVisibleCount(24);
                  }}
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

            {/* Places Grid with Normalized Frames */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlaces.slice(0, placesVisibleCount).map((place) => (
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

            {/* Progressive Discovery: Load More Button */}
            {filteredPlaces.length > placesVisibleCount && (
              <div className="pt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => setPlacesVisibleCount((prev) => prev + 6)}
                  className="px-6 py-3 rounded-2xl bg-[#FAF7F0] hover:bg-[#E5D5BA] border-2 border-[#E5D5BA] hover:border-[#173B32] text-[#173B32] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <ArrowDown className="w-4 h-4 text-[#B65E3C]" />
                  <span>Show More Places ({filteredPlaces.length - placesVisibleCount} Remaining)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* MODE: STAYS & SANCTUARIES */}
        {(activeMode === "stays" || activeMode === "overview") && (
          <div className="space-y-6 pt-6 border-t-2 border-[#E5D5BA] animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E5D5BA] pb-4 gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#B65E3C]">
                  आशियाना • Verified Stays &amp; Sanctuaries
                </span>
                <h3 className="font-serif font-black text-2xl sm:text-3xl text-[#173B32] flex items-center gap-2 mt-0.5">
                  <BedDouble className="w-6 h-6 text-[#B65E3C]" />
                  <span>
                    Stays &amp; Sanctuaries {!staysLoading && `(${hotels.length})`}
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

            {/* Stays Grid with Normalized Image Frame & Preview Limitation */}
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
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {hotels.slice(0, 3).map((h) => {
                    const isLiveStay = Boolean(h.is_live && h.source !== "vanvas_curated" && h.trust_source !== "VANVAS_CURATED");
                    const isPriceVerified = h.price_verified !== false && typeof h.price_per_night === "number" && h.price_per_night > 0;
                    const stayVisual = resolveHotelArtwork(h.name, destination.name, h.hotel_style || h.accommodation_type, h.image_url, h.is_live, h.source);
                    const displayPrice = h.price_formatted || (isPriceVerified ? `₹${h.price_per_night}/night` : "Rate upon inquiry");
                    const badgeLabel = isLiveStay ? (h.badge || "VERIFIED LIVE STAY") : "CURATED STAY";
                    const availState = isLiveStay ? (h.availability_state || "AVAILABLE") : (h.availability_state === "AVAILABLE" ? "UPON INQUIRY" : (h.availability_state || "UPON INQUIRY"));

                    return (
                      <div key={h.id} className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] hover:border-[#173B32]/40 shadow-2xs hover:shadow-lg transition-all space-y-4 flex flex-col justify-between">
                        <div className="space-y-3">
                          {/* Visual Header with Normalized Aspect Ratio */}
                          <div
                            onClick={() => {
                              setSelectedStayForModal(h);
                              setStayModalOpen(true);
                            }}
                            className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-[#E5D5BA] cursor-pointer group"
                          >
                            <VanvasImage
                              src={stayVisual.imageUrl}
                              fallbackSrc={stayVisual.fallbackUrl}
                              alt={`${h.name} in ${destination.name}`}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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

                            {h.availability_state === "UNAVAILABLE" ? (
                              <span className="px-3 py-1.5 bg-neutral-200 text-neutral-600 rounded-xl font-bold text-[11px] uppercase tracking-wider">
                                Unavailable
                              </span>
                            ) : (
                              <button
                                onClick={() => handleStartBooking(h)}
                                className="px-3 py-1.5 bg-[#173B32] hover:bg-[#B65E3C] text-[#EFE5D2] rounded-xl font-bold text-xs transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                              >
                                <span>Book Stay</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explore All Stays CTA */}
                <div className="p-5 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-0.5 text-center sm:text-left">
                    <h4 className="font-serif font-bold text-base text-[#173B32]">
                      Discover All Stays in {destination.name}
                    </h4>
                    <p className="text-xs text-[#7B4D36]">
                      View all {hotels.length} verified sanctuaries, filter by style or traveller profile, and compare direct booking rates.
                    </p>
                  </div>
                  <Link
                    href={`/explore/${destination.slug || slug}/stays`}
                    className="px-5 py-3 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shrink-0 cursor-pointer"
                  >
                    <BedDouble className="w-4 h-4 text-[#EFE5D2]" />
                    <span>See All {hotels.length} Stays</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] text-center space-y-2">
                <BedDouble className="w-8 h-8 text-[#B65E3C] mx-auto opacity-70" />
                <h4 className="font-serif font-bold text-base text-[#173B32]">No verified stays available matching these filters.</h4>
                <p className="text-xs text-[#7B4D36] max-w-md mx-auto">
                  Try resetting style filters or selecting All Profiles.
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
        )}

        {/* MODE: MOBILITY & APPROACH RENTALS */}
        {(activeMode === "mobility" || activeMode === "overview") && (
          <div className="space-y-6 pt-6 border-t-2 border-[#E5D5BA] animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#B65E3C]">
                  {((destination?.region || "").toLowerCase().includes("himalay") || (destination?.altitude_meters || 0) > 1200) ? "सवारी • Valley Mobility & Rentals" : "सवारी • Local Mobility & Transport"}
                </span>
                <h3 className="font-serif font-black text-2xl sm:text-3xl text-[#173B32] flex items-center gap-2 mt-0.5">
                  <Bike className="w-6 h-6 text-[#B65E3C]" />
                  <span>
                    Approach Transit &amp; Fleet {!rentalsLoading && `(${rentals.length})`}
                  </span>
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase bg-[#FAF7F0] border border-[#E5D5BA] text-[#7B4D36]">
                Verified Mobility Fleet
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
                  const vStatus = r.data_state || r.verification_status || "VERIFIED";
                  const isLiveProvider = vStatus === "LIVE" || vStatus === "LIVE_PROVIDER";
                  const isVerified = vStatus === "VERIFIED";
                  const hasPrice = typeof r.price_per_day === "number" && r.price_per_day > 0;

                  const dirLink = r.action_links?.find((l) => l.type === "directions")?.url ||
                    (r.latitude && r.longitude ? `https://www.google.com/maps/dir/?api=1&destination=${r.latitude},${r.longitude}` : null);
                  const phoneLink = r.action_links?.find((l) => l.type === "phone")?.url || (r.phone ? `tel:${r.phone}` : null);
                  const waLink = r.action_links?.find((l) => l.type === "whatsapp")?.url ||
                    (r.whatsapp ? `https://wa.me/${r.whatsapp.replace(/[^\d]/g, "")}` : null);
                  const webLink = r.website || r.source_url || (r.action_links?.find((l) => l.type === "website")?.url);

                  return (
                    <div key={r.id} className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] hover:border-[#173B32]/40 shadow-2xs hover:shadow-lg transition-all space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div
                          onClick={() => {
                            setSelectedRentalForModal(r);
                            setRentalModalOpen(true);
                          }}
                          className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-[#E5D5BA] cursor-pointer group"
                        >
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
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-xs ${
                              isLiveProvider 
                                ? "bg-emerald-700 text-white" 
                                : isVerified 
                                ? "bg-[#173B32] text-[#EFE5D2]"
                                : "bg-[#7B4D36] text-[#FAF7F0]"
                            }`}>
                              {isLiveProvider ? "LIVE PROVIDER" : isVerified ? "VERIFIED FLEET" : "CURATED"}
                            </span>
                            {r.source_provider && (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-medium bg-[#20211D]/80 text-[#FAF7F0] backdrop-blur-xs">
                                {r.source_provider}
                              </span>
                            )}
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
                                {hasPrice ? `₹${r.price_per_day}/day` : "Price on enquiry"}
                              </span>
                              {r.price_per_hour ? (
                                <span className="text-[10px] font-mono text-[#7B4D36] block">
                                  ₹{r.price_per_hour}/hr
                                </span>
                              ) : null}
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

                        <button
                          onClick={() => {
                            setSelectedRentalForModal(r);
                            setRentalModalOpen(true);
                          }}
                          className="w-full py-1.5 px-3 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] hover:bg-[#EFE5D2] hover:border-[#173B32]/40 text-[#173B32] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Info className="w-3.5 h-3.5 text-[#B65E3C]" />
                          <span>Rental Terms &amp; Verified Details</span>
                        </button>

                        {/* Action Links */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                          {phoneLink ? (
                            <a
                              href={phoneLink}
                              className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-[#FAF7F0] border border-[#173B32]/30 text-[#173B32] text-xs font-bold hover:bg-[#EFE5D2] transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5 text-[#173B32]" />
                              <span>Call</span>
                            </a>
                          ) : null}

                          {waLink ? (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-2xs"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          ) : null}

                          {webLink ? (
                            <a
                              href={webLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-[#FAF7F0] border border-[#173B32]/30 text-[#173B32] text-xs font-bold hover:bg-[#EFE5D2] transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-[#173B32]" />
                              <span>Website</span>
                            </a>
                          ) : null}

                          {dirLink ? (
                            <a
                              href={dirLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-[#173B32] text-[#FAF4E8] text-xs font-bold hover:bg-[#0F2924] transition-colors shadow-2xs"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                              <span>Directions</span>
                            </a>
                          ) : (
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-[#173B32] text-[#FAF4E8] text-xs font-bold hover:bg-[#0F2924] transition-colors shadow-2xs"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                              <span>Directions</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] text-center space-y-2">
                <Bike className="w-8 h-8 text-[#B65E3C] mx-auto opacity-70" />
                <h4 className="font-serif font-bold text-base text-[#173B32]">Mobility fleet operates from regional hubs</h4>
                <p className="text-xs text-[#7B4D36] max-w-md mx-auto">
                  Scooter and motorcycle rentals operate out of central valley hubs and local provider stands.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 9. PRACTICAL EXPEDITION GUIDE (STRUCTURED SCANNABLE MODULES) */}
        {(() => {
          const rawGuide = DESTINATION_TRAVEL_GUIDES[destination.slug] || DESTINATION_TRAVEL_GUIDES[destination.slug.toLowerCase()];

          const seasonalityPoints = rawGuide
            ? rawGuide.seasonality.split(". ").filter(Boolean).map((s) => s.trim().endsWith(".") ? s.trim() : `${s.trim()}.`)
            : [`Best visited during ${destination.best_time_to_visit || "spring & autumn"} with clear skies.`, "Winter and monsoon seasons require checking local weather advisories."];

          const clothingPoints = rawGuide
            ? rawGuide.clothing.split(". ").filter(Boolean).map((s) => s.trim().endsWith(".") ? s.trim() : `${s.trim()}.`)
            : ["Light breathable cottons for daytime exploration.", "Sturdy walking shoes with rubber grip for stone streets.", "Modest clothing covering knees and shoulders for temple visits."];

          const transportPoints = rawGuide
            ? rawGuide.transport.split(". ").filter(Boolean).map((s) => s.trim().endsWith(".") ? s.trim() : `${s.trim()}.`)
            : [`Walking and local auto-rickshaws are ideal in ${destination.name}.`, "Agree on taxi or auto rates before boarding.", "Rent two-wheelers with valid driving license and helmets."];

          const etiquettePoints = rawGuide
            ? rawGuide.etiquette.split(". ").filter(Boolean).map((s) => s.trim().endsWith(".") ? s.trim() : `${s.trim()}.`)
            : [`Remove footwear outside temples and sanctums in ${destination.name}.`, "Respect local cultural privacy; ask before taking portraits.", "Strictly zero plastic littering in nature sanctuaries."];

          return (
            <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5D5BA] pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#B65E3C]">
                    <Info className="w-4 h-4" />
                    <span>मार्गदर्शन • Practical Expedition Guide</span>
                  </div>
                  <h3 className="text-2xl font-serif font-black text-[#173B32]">
                    Essential Field Intelligence for {destination.name}
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-[#7B4D36]">
                  Scan → Understand → Expand
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Module 1: Seasonality & Timing */}
                <div
                  onClick={() => setExpandedGuide("seasonality")}
                  className="p-5 rounded-2xl bg-[#EFE5D2] hover:bg-[#EAE0CB] border border-[#E5D5BA] hover:border-[#173B32] transition-all flex flex-col justify-between space-y-4 cursor-pointer group shadow-2xs hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#173B32]">
                        <Sun className="w-4 h-4 text-[#B65E3C]" />
                        <span>Seasonality &amp; Timing</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#B65E3C] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <ul className="space-y-2 text-xs text-[#20211D]/85">
                      {seasonalityPoints.slice(0, 3).map((pt, i) => (
                        <li key={i} className="flex items-start gap-2 leading-relaxed">
                          <span className="text-[#B65E3C] font-bold mt-0.5">•</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-2 border-t border-[#E5D5BA]/60 flex items-center justify-between text-[10px] font-mono text-[#7B4D36]">
                    <span>Peak: <strong>{destination.best_time_to_visit || "Year-Round"}</strong></span>
                    <span className="text-[#B65E3C] font-bold group-hover:underline">Expand Guide →</span>
                  </div>
                </div>

                {/* Module 2: Packing & Clothing */}
                <div
                  onClick={() => setExpandedGuide("clothing")}
                  className="p-5 rounded-2xl bg-[#EFE5D2] hover:bg-[#EAE0CB] border border-[#E5D5BA] hover:border-[#173B32] transition-all flex flex-col justify-between space-y-4 cursor-pointer group shadow-2xs hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#173B32]">
                        <Mountain className="w-4 h-4 text-[#B65E3C]" />
                        <span>Packing &amp; Clothing</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#B65E3C] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <ul className="space-y-2 text-xs text-[#20211D]/85">
                      {clothingPoints.slice(0, 3).map((pt, i) => (
                        <li key={i} className="flex items-start gap-2 leading-relaxed">
                          <span className="text-[#B65E3C] font-bold mt-0.5">•</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-2 border-t border-[#E5D5BA]/60 flex items-center justify-between text-[10px] font-mono text-[#7B4D36]">
                    <span>Layers: <strong>Seasonal Pack</strong></span>
                    <span className="text-[#B65E3C] font-bold group-hover:underline">Expand Guide →</span>
                  </div>
                </div>

                {/* Module 3: Transport & Transit */}
                <div
                  onClick={() => setExpandedGuide("transport")}
                  className="p-5 rounded-2xl bg-[#EFE5D2] hover:bg-[#EAE0CB] border border-[#E5D5BA] hover:border-[#173B32] transition-all flex flex-col justify-between space-y-4 cursor-pointer group shadow-2xs hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#173B32]">
                        <Navigation className="w-4 h-4 text-[#B65E3C]" />
                        <span>Transport &amp; Transit</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#B65E3C] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <ul className="space-y-2 text-xs text-[#20211D]/85">
                      {transportPoints.slice(0, 3).map((pt, i) => (
                        <li key={i} className="flex items-start gap-2 leading-relaxed">
                          <span className="text-[#B65E3C] font-bold mt-0.5">•</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-2 border-t border-[#E5D5BA]/60 flex items-center justify-between text-[10px] font-mono text-[#7B4D36]">
                    <span>Mobility: <strong>Walk &amp; Local Transit</strong></span>
                    <span className="text-[#B65E3C] font-bold group-hover:underline">Expand Guide →</span>
                  </div>
                </div>

                {/* Module 4: Etiquette & Local Tips */}
                <div
                  onClick={() => setExpandedGuide("etiquette")}
                  className="p-5 rounded-2xl bg-[#EFE5D2] hover:bg-[#EAE0CB] border border-[#E5D5BA] hover:border-[#173B32] transition-all flex flex-col justify-between space-y-4 cursor-pointer group shadow-2xs hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#173B32]">
                        <Globe className="w-4 h-4 text-[#B65E3C]" />
                        <span>Etiquette &amp; Tips</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#B65E3C] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <ul className="space-y-2 text-xs text-[#20211D]/85">
                      {etiquettePoints.slice(0, 3).map((pt, i) => (
                        <li key={i} className="flex items-start gap-2 leading-relaxed">
                          <span className="text-[#B65E3C] font-bold mt-0.5">•</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-2 border-t border-[#E5D5BA]/60 flex items-center justify-between text-[10px] font-mono text-[#7B4D36]">
                    <span>Sanctuary: <strong>Zero Plastic</strong></span>
                    <span className="text-[#B65E3C] font-bold group-hover:underline">Expand Guide →</span>
                  </div>
                </div>
              </div>

              {/* Detailed Expanded Field Guide Modal */}
              {expandedGuide && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
                    <div className="flex items-start justify-between gap-4 border-b border-[#E5D5BA] pb-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B65E3C]">
                          {destination.name} • COMPREHENSIVE FIELD INTELLIGENCE
                        </span>
                        <h4 className="text-2xl font-serif font-black text-[#173B32] capitalize">
                          {expandedGuide === "seasonality" && "Seasonality, Climate & Crowds"}
                          {expandedGuide === "clothing" && "Packing, Clothing & Footwear"}
                          {expandedGuide === "transport" && "Transport, Transit & Mobility"}
                          {expandedGuide === "etiquette" && "Sanctuary Etiquette & Local Wisdom"}
                        </h4>
                      </div>
                      <button
                        onClick={() => setExpandedGuide(null)}
                        className="p-2 rounded-full hover:bg-black/10 text-[#7B4D36] transition-colors cursor-pointer"
                        aria-label="Close modal"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 text-xs sm:text-sm text-[#20211D]/90 font-serif leading-relaxed">
                      {expandedGuide === "seasonality" && (
                        <div className="space-y-4">
                          <div className="p-4 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] space-y-2">
                            <span className="font-mono font-bold uppercase text-[10px] text-[#B65E3C] block">Peak Windows &amp; Best Timing</span>
                            <p>{rawGuide?.seasonality || destination.best_time_to_visit}</p>
                          </div>
                          <div className="space-y-2 text-xs font-sans text-[#20211D]">
                            <p className="font-bold text-[#173B32]">Key Seasonal Observations:</p>
                            {seasonalityPoints.map((pt, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{pt}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {expandedGuide === "clothing" && (
                        <div className="space-y-4">
                          <div className="p-4 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] space-y-2">
                            <span className="font-mono font-bold uppercase text-[10px] text-[#B65E3C] block">Clothing Strategy &amp; Footwear</span>
                            <p>{rawGuide?.clothing || "Layered clothing recommended for changing mountain and valley temperatures."}</p>
                          </div>
                          <div className="space-y-2 text-xs font-sans text-[#20211D]">
                            <p className="font-bold text-[#173B32]">Recommended Attire &amp; Gear Checklist:</p>
                            {clothingPoints.map((pt, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{pt}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {expandedGuide === "transport" && (
                        <div className="space-y-4">
                          <div className="p-4 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] space-y-2">
                            <span className="font-mono font-bold uppercase text-[10px] text-[#B65E3C] block">Getting There &amp; Moving Around</span>
                            <p>{rawGuide?.transport || "Local transit, shared taxis, and walking trails."}</p>
                          </div>
                          <div className="space-y-2 text-xs font-sans text-[#20211D]">
                            <p className="font-bold text-[#173B32]">Transit Insights &amp; Mobility Guidelines:</p>
                            {transportPoints.map((pt, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{pt}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {expandedGuide === "etiquette" && (
                        <div className="space-y-4">
                          <div className="p-4 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] space-y-2">
                            <span className="font-mono font-bold uppercase text-[10px] text-[#B65E3C] block">Cultural Respect &amp; Environmental Care</span>
                            <p>{rawGuide?.etiquette || "Preserve cultural sanctity, remove footwear at sacred spaces, and adhere to zero plastic waste."}</p>
                          </div>
                          <div className="space-y-2 text-xs font-sans text-[#20211D]">
                            <p className="font-bold text-[#173B32]">Local Sanctuary Codes of Conduct:</p>
                            {etiquettePoints.map((pt, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{pt}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-[#E5D5BA] flex justify-end">
                      <button
                        onClick={() => setExpandedGuide(null)}
                        className="px-6 py-2.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Done Reading
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* 10. EXPEDITION PLANNING ENTRY POINT */}
        <div className="p-8 sm:p-12 rounded-3xl bg-[#173B32] text-[#EFE5D2] border-2 border-[#173B32] shadow-2xl space-y-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <TravelStamp label="सफ़र का अगला पड़ाव" sub="EXPEDITION BLUEPRINT" variant="mustard" />
              <TravelStamp label={meta.hindi} variant="terracotta" />
            </div>
            <h3 className="text-3xl sm:text-4xl font-serif font-black text-[#FAF4E8]">
              Ready to explore {destination.name}?
            </h3>
            <p className="text-xs sm:text-sm text-[#D8DED5]/85 leading-relaxed font-light">
              We&rsquo;ll cluster your stops to eliminate hill driving, match verified cafés with sunset viewpoints, and balance your budget across stays and local dhabas.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
            <Link
              href={`/plan?dest=${destination.id || slug}`}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] font-bold text-xs uppercase tracking-wider shadow-2xl flex items-center justify-center gap-2 transition-all transform active:scale-95 border border-[#7B4D36]/30 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#B49252]" />
              <span>Plan {destination.name} Trip →</span>
            </Link>
          </div>
        </div>

      </main>
        </>
      )}

      {/* Place Detail Modal */}
      <PlaceModal
        place={selectedPlace}
        destinationName={destination?.name || slug}
        destinationSlug={destination?.slug || slug}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            if (url.searchParams.has("place")) {
              url.searchParams.delete("place");
              window.history.replaceState({}, "", url.toString());
            }
          }
        }}
        onBookmarkChange={(placeId, isSaved) => {
          setPlaces((prev) =>
            prev.map((p) => (p.id === placeId ? { ...p, is_saved: isSaved } : p))
          );
        }}
      />

      {/* Stay Detail Modal */}
      {stayModalOpen && selectedStayForModal && (
        <div
          onClick={() => setStayModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-4 max-h-[90vh] flex flex-col justify-between"
          >
            {/* Header Visual with Normalized Aspect Ratio */}
            <div className="relative aspect-[16/10] w-full bg-[#E5D5BA] shrink-0">
              {(() => {
                const stayVisual = resolveHotelArtwork(
                  selectedStayForModal.name,
                  destination.name,
                  selectedStayForModal.hotel_style || selectedStayForModal.accommodation_type,
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

              {selectedStayForModal.availability_state === "UNAVAILABLE" ? (
                <span className="px-5 py-2.5 bg-neutral-200 text-neutral-600 rounded-xl font-bold text-xs uppercase tracking-wider">
                  Currently Unavailable
                </span>
              ) : (
                <button
                  onClick={() => {
                    const currentStay = selectedStayForModal;
                    setStayModalOpen(false);
                    handleStartBooking(currentStay);
                  }}
                  className="px-5 py-2.5 bg-[#173B32] hover:bg-[#B65E3C] text-[#EFE5D2] rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>Book This Sanctuary</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EXPANDED MOBILITY / RENTAL TERMS MODAL */}
      {rentalModalOpen && selectedRentalForModal && destination && (
        <div
          onClick={() => setRentalModalOpen(false)}
          className="fixed inset-0 z-50 bg-[#0F2924]/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col justify-between"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E5D5BA] flex items-center justify-between gap-3 sticky top-0 bg-[#FAF7F0] z-10">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B65E3C] block">
                  VANVAS Mobility • Verified Provider Terms
                </span>
                <h3 className="font-serif font-bold text-lg sm:text-xl text-[#173B32]">
                  {selectedRentalForModal.vehicle_name}
                </h3>
              </div>
              <button
                onClick={() => setRentalModalOpen(false)}
                className="p-2 rounded-full hover:bg-[#EFE5D2] text-[#7B4D36] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Artwork Header */}
              <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-[#E5D5BA]">
                <VehicleArtwork
                  type={selectedRentalForModal.vehicle_type}
                  name={selectedRentalForModal.vehicle_name}
                  destination={destination.name}
                  context={{
                    destination: destination.name,
                    state: destination.state,
                    region: destination.region,
                  }}
                  imageUrl={selectedRentalForModal.image_url}
                  alt={selectedRentalForModal.vehicle_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#173B32] text-[#EFE5D2] shadow-xs">
                    {selectedRentalForModal.provider_name}
                  </span>
                </div>
              </div>

              {/* Pricing & Deposit Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-[#7B4D36]">
                <div className="p-3 rounded-2xl bg-white border border-[#E5D5BA] space-y-0.5">
                  <span className="font-mono uppercase text-[10px] text-[#7B4D36]/80 block">Daily Tariff</span>
                  <span className="font-bold text-sm text-[#173B32]">
                    {selectedRentalForModal.price_per_day ? `₹${selectedRentalForModal.price_per_day}/day` : "On Enquiry"}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-[#E5D5BA] space-y-0.5">
                  <span className="font-mono uppercase text-[10px] text-[#7B4D36]/80 block">Security Deposit</span>
                  <span className="font-bold text-sm text-[#173B32]">
                    {selectedRentalForModal.deposit_amount ? `₹${selectedRentalForModal.deposit_amount}` : "Standard/None"}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-[#E5D5BA] space-y-0.5 col-span-2 sm:col-span-1">
                  <span className="font-mono uppercase text-[10px] text-[#7B4D36]/80 block">Operating Hours</span>
                  <span className="font-bold text-xs text-[#173B32] truncate block">
                    {selectedRentalForModal.opening_hours || "08:00 AM - 08:00 PM"}
                  </span>
                </div>
              </div>

              {/* Pickup Address */}
              <div className="p-3.5 rounded-2xl bg-white border border-[#E5D5BA] space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C] flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>Pickup Hub &amp; Operating Base</span>
                </span>
                <p className="text-xs font-semibold text-[#173B32]">
                  {selectedRentalForModal.address || selectedRentalForModal.location || "Central Destination Stand"}
                </p>
                {selectedRentalForModal.distance_km && (
                  <p className="text-[11px] text-[#7B4D36]">
                    Approximately {selectedRentalForModal.distance_km} km from current waypoint
                  </p>
                )}
              </div>

              {/* Verified Rental Terms & Standard Policies */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7B4D36]">
                  Verified Operating Guidelines
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#173B32]">
                  <div className="p-2.5 rounded-xl bg-[#FAF4E8] border border-[#E5D5BA] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B65E3C] shrink-0" />
                    <span><strong>Documents:</strong> Driving License + Govt ID</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF4E8] border border-[#E5D5BA] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B65E3C] shrink-0" />
                    <span><strong>Helmets:</strong> 1-2 ISI Certified Included</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF4E8] border border-[#E5D5BA] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B65E3C] shrink-0" />
                    <span><strong>Fuel:</strong> Return at same fuel level</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF4E8] border border-[#E5D5BA] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B65E3C] shrink-0" />
                    <span><strong>Permit:</strong> Registered Commercial Tourist Fleet</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-[#E5D5BA] bg-[#FAF7F0] flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                {selectedRentalForModal.latitude && selectedRentalForModal.longitude && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedRentalForModal.latitude},${selectedRentalForModal.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-[#EFE5D2] border border-[#E5D5BA] text-[#173B32] hover:text-[#B65E3C] transition-colors"
                    title="Get Directions on Google Maps"
                  >
                    <Navigation className="w-4 h-4" />
                  </a>
                )}
                {selectedRentalForModal.website && (
                  <a
                    href={selectedRentalForModal.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-[#EFE5D2] border border-[#E5D5BA] text-[#173B32] hover:text-[#B65E3C] transition-colors"
                    title="Visit Official Operator Website"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedRentalForModal.whatsapp && (
                  <a
                    href={`https://wa.me/${selectedRentalForModal.whatsapp.replace(/[^\d]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}
                {selectedRentalForModal.phone ? (
                  <a
                    href={`tel:${selectedRentalForModal.phone}`}
                    className="px-4 py-2.5 bg-[#173B32] hover:bg-[#B65E3C] text-[#EFE5D2] rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Provider</span>
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real Transaction Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        offer={selectedOfferForCheckout}
        onBookingSuccess={(booking) => {
          setActiveConfirmedBooking(booking);
          setConfirmationModalOpen(true);
        }}
      />

      {/* Persistent Booking Confirmation & Voucher Modal */}
      <BookingConfirmationModal
        isOpen={confirmationModalOpen}
        onClose={() => setConfirmationModalOpen(false)}
        booking={activeConfirmedBooking}
        onBookingCancelled={(cancelled) => {
          setActiveConfirmedBooking(cancelled);
        }}
      />
    </div>
  );
}
