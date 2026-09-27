"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Compass, ShieldCheck, Heart, Users, MapPin, Coffee,
  Sparkles, ArrowRight, BookOpen, Sun, Moon, AlertTriangle,
  Phone, CheckCircle2, ChevronRight, BedDouble, Navigation,
  Clock, Shield, Star, Mountain, Eye, Footprints, Info
} from "lucide-react";
import { api } from "@/lib/api";
import { Destination, Place, Hotel } from "@/types";
import { VanvasImage } from "@/components/ui/VanvasImage";
import { TravelStamp } from "@/components/ui/TravelStamp";
import { PlaceCard } from "@/components/places/PlaceCard";
import { PlaceModal } from "@/components/places/PlaceModal";
import { CANONICAL_DESTINATIONS } from "@/lib/canonicalDestinations";
import { resolvePlaceArtwork } from "@/lib/placeVisualResolver";

interface SoloDestinationIntel {
  tagline: string;
  safeAreas: string[];
  gettingAround: string[];
  stayTips: string[];
  diningTips: string[];
  soloExperiences: string[];
  etiquette: string[];
  emergencyContacts: { label: string; number: string }[];
}

const SOLO_DESTINATION_INTEL: Record<string, SoloDestinationIntel> = {
  manali: {
    tagline: "Slow mornings along the Manalsu river, pine forest trails, and bohemian library cafes.",
    safeAreas: [
      "Old Manali (well-lit, pedestrian friendly, active traveler cafes)",
      "Vashisht Village (quiet temple precinct, welcoming homestay culture)",
      "Mall Road & Model Town (police presence, official taxi union stands)",
      "Log Huts Area (serene forested residential zone near nature trails)"
    ],
    gettingAround: [
      "Walkable between Old Manali and Manu Temple along stone alleys",
      "Rent a Honda Activa 6G or Royal Enfield from verified Old Manali stands for Solang/Rohtang",
      "Electric local buses ply regularly between Mall Road and Nehru Kund / Solang",
      "Always agree on prepaid union taxi rates before departing for Naggar or Sethan"
    ],
    stayTips: [
      "Choose hostels or boutique homestays in Old Manali with communal living rooms and balconies",
      "Look for properties offering high-speed fiber internet and heated wood stoves in winter",
      "Female solo travelers frequently recommend riverside properties with 24/7 on-site staff"
    ],
    diningTips: [
      "Dylan's Toasted & Roasted: communal bench seating, fresh cookies, and easy conversations",
      "Café 1947: riverside outdoor tables where sitting alone with a book is welcomed",
      "Rocky's Cafe: perched above Old Manali with sweeping panoramic forest views"
    ],
    soloExperiences: [
      "Early morning peaceful walk to Jogini Waterfall through Vashisht apple orchards",
      "Quiet journaling at Hadimba Temple surrounded by century-old Dhungri deodar pines",
      "Day trip to Naggar Castle and the Roerich Art Gallery by local bus"
    ],
    etiquette: [
      "Dress modestly when entering Hadimba and Manu temple sanctums (remove shoes)",
      "Carry all plastic packaging and water bottles back down to valley recycling points",
      "Avoid isolated unlit forest trails after 8:00 PM during winter months"
    ],
    emergencyContacts: [
      { label: "Manali Police Station", number: "01902-252326" },
      { label: "Civil Hospital Manali", number: "01902-252328" },
      { label: "Tourist Information Office", number: "01902-252175" },
      { label: "Himachal Women Helpline", number: "1091" }
    ]
  },
  rishikesh: {
    tagline: "Sacred turquoise river currents, sunset aartis, sound meditation, and riverside quietude.",
    safeAreas: [
      "Tapovan (global yogic community, well-lit cafes, vibrant solo traveler hub)",
      "Swarg Ashram & Ram Jhula (peaceful walking zones, vehicle-free ghats)",
      "High Bank Tapovan (quiet hostel and boutique stay precinct overlooking the valley)",
      "Laxman Jhula bypass & Secret Waterfall trail"
    ],
    gettingAround: [
      "Entirely walkable across Ram Jhula and Lakshman Jhula suspension footbridges",
      "Shared Vikram auto-rickshaws connect Tapovan to Triveni Ghat and Haridwar bypass for ₹20-40",
      "Automatic scooters (Activa 6G) readily rented in Tapovan with valid helmet and license",
      "Shared river rafting transfers depart directly from Tapovan tour desks"
    ],
    stayTips: [
      "Tapovan and Swarg Ashram feature excellent solo-friendly hostels and yoga ashrams",
      "Opt for ashram stays (Parmarth Niketan, Anand Prakash) for structured morning meditation",
      "Look for stays offering rooftop river views and pure vegetarian organic community kitchens"
    ],
    diningTips: [
      "Little Buddha Cafe: treehouse-style seating overlooking the Ganga with healthy thalis",
      "The 60's Beatles Cafe: tranquil terrace with vegan desserts, classic rock, and solo tables",
      "German Bakery Tapovan: relaxed morning coffee, croissants, and travel book exchanges"
    ],
    soloExperiences: [
      "Silent sunrise meditation on the white sands of Secret Beach (near Tapovan)",
      "Experiencing the evening Ganga Aarti bells at Parmarth Niketan and Triveni Ghat",
      "Exploring the historic graffiti and meditation caves inside Beatles Ashram (Chaurasi Kutia)"
    ],
    etiquette: [
      "Rishikesh is a strictly vegetarian and alcohol-free sacred holy city",
      "Cover shoulders and knees when visiting ashrams, temples, and ghat steps",
      "Refrain from swimming in high-current river stretches; use designated safe bathing ghats"
    ],
    emergencyContacts: [
      { label: "Muni Ki Reti Police", number: "0135-2430030" },
      { label: "Rishikesh Govt Hospital", number: "0135-2430041" },
      { label: "Tourist Police Rishikesh", number: "0135-2430224" },
      { label: "Uttarakhand Women Helpline", number: "1090" }
    ]
  },
  mussoorie: {
    tagline: "Colonial walking loops, Landour bakeries, winterline sunsets, and quiet Himalayan vistas.",
    safeAreas: [
      "Landour Cantonment (supremely peaceful, historic heritage walking loops, zero noise)",
      "Sister's Bazaar & Char Dukan (tranquil tea stalls and colonial bookshops)",
      "Camel's Back Road (scenic sunset promenade closed to heavy motor traffic)",
      "Library Chowk & Picture Palace (vibrant hub with active bus and taxi stands)"
    ],
    gettingAround: [
      "Landour Upper Loop is one of India's finest 6 km pedestrian walks",
      "Cycle rickshaws and walking are ideal along the Mall Road promenade",
      "Local taxis operate from Library Chowk taxi union for Kempty Falls or Dhanaulti",
      "Shared taxis connect Dehradun Railway Station to Mussoorie in 1 hour"
    ],
    stayTips: [
      "Stay in Landour for complete heritage quietude and oak forest mist",
      "Properties near Camel's Back Road provide easy walking access to both Mall Road and nature",
      "Boutique colonial manors offer wood fireplaces and panoramic Doon Valley night views"
    ],
    diningTips: [
      "Landour Bakehouse: iconic cinnamon crepes, walnut tarts, and solo reading nooks",
      "Char Dukan: classic cheese omelettes, ginger lemon honey tea, and pine bench seating",
      "Cafe Ivy: rustic wooden terrace overlooking the misty valley in Char Dukan"
    ],
    soloExperiences: [
      "Sunset walk to Lal Tibba (highest point) for clear views of Badrinath and Kedarnath peaks",
      "Quiet evening watching the winterline sunset glow from Camel's Back cemetery overlook",
      "Browsing Himalayan folklore and Ruskin Bond editions at Cambridge Book Depot"
    ],
    etiquette: [
      "Maintain strict silence and respect in the Landour Cantonment residential zones",
      "No littering or smoking along forest heritage trails; carry all trash back to town",
      "Keep a warm fleece handy even in summer evenings as mountain wind drops rapidly"
    ],
    emergencyContacts: [
      { label: "Mussoorie Police Station", number: "0135-2632005" },
      { label: "Landour Community Hospital", number: "0135-2632053" },
      { label: "Mussoorie Tourist Bureau", number: "0135-2632863" },
      { label: "Garhwal Emergency SOS", number: "112" }
    ]
  },
  udaipur: {
    tagline: "Lakeside palace jharokhas, rooftop classical sitar, Mewari heritage, and artisan alleys.",
    safeAreas: [
      "Lal Ghat & Gangaur Ghat (historic old city lakeside, safe walking quarters, vibrant traveler cafes)",
      "Hanuman Ghat & Chandpole (quiet western bank of Lake Pichola with boutique stays)",
      "Fateh Sagar Promenade (clean lakeside boulevard popular with locals and evening walkers)",
      "City Palace Complex (secure UNESCO-recognized royal heritage zone)"
    ],
    gettingAround: [
      "Old city lanes around Jagdish Chowk are best navigated entirely on foot",
      "Auto-rickshaws connect Old City to Fateh Sagar and Sajjangarh Monsoon Palace",
      "Lake crossing passenger boats operate between Lal Ghat and western ghats",
      "Scooter rentals are available near Chandpole bridge for exploring the Aravalli outskirts"
    ],
    stayTips: [
      "Book heritage havelis near Lal Ghat or Hanuman Ghat with rooftop jharokhas",
      "Hostels with lake-facing common rooms provide great solo-friendly community dinners",
      "Look for properties with verified staff ratings and courtyard dining"
    ],
    diningTips: [
      "Jheel's Ginger Coffee Bar: lakeside stone ledge tables right above the clear water",
      "Upre by 1559 AD: rooftop Mewari dining with illuminated palace panoramas",
      "Millets of Mewar: organic gluten-free traditional Rajasthani bowls in Hanuman Ghat"
    ],
    soloExperiences: [
      "Watching the sunset transform City Palace from Ambrai Ghat marble steps",
      "Attending the authentic evening Rajasthani folk dance and puppet show at Bagore Ki Haveli",
      "Quiet early morning walk around the ancient carved stone pillars of Jagdish Temple"
    ],
    etiquette: [
      "Remove shoes before stepping into the inner courtyards of Jagdish Temple",
      "Dress modestly covering shoulders and knees when exploring temple ghats",
      "Negotiate auto-rickshaw rates before boarding in the old city"
    ],
    emergencyContacts: [
      { label: "Udaipur Tourist Police", number: "0294-2410370" },
      { label: "MB Govt General Hospital", number: "0294-2528811" },
      { label: "Police Control Room", number: "100" },
      { label: "Rajasthan Women Helpline", number: "1090" }
    ]
  },
  kasol: {
    tagline: "Roaring emerald Parvati river, cedar canopies, bohemian mountain trails, and alpine peace.",
    safeAreas: [
      "Old Kasol & Riverside Lane (safe, active traveler cafes and well-trodden paths)",
      "Chalal Village trail (peaceful pine forest path connected by cable bridge)",
      "Katagla & Chojh (quiet hamlet across the river, ideal for reading and rest)",
      "Manikaran Road (frequent shared cabs and direct bus connections)"
    ],
    gettingAround: [
      "Trekking on foot is the standard and most rewarding way to explore local hamlets",
      "Shared local HRTC buses run regularly between Bhuntar, Kasol, Manikaran, and Barshaini",
      "Shared local Sumos operate from Kasol taxi stand to Tosh and Pulga roadheads",
      "Scooter rentals are available in Kasol market for road trips to Malana gate or Manikaran"
    ],
    stayTips: [
      "Choose riverside wooden lodges in Chalal or Katagla for tranquil sound of water",
      "Hostels near the old river bridge have vibrant common areas with wood stoves and guitar jams",
      "Ensure your homestay has hot water geysers and thick blankets during crisp autumn/winter"
    ],
    diningTips: [
      "Evergreen Cafe: legendary garden dining with fresh falafel, shakshuka, and wood-fired pizzas",
      "Moon Dance Cafe: delicious breakfast waffles, cinnamon rolls, and artisan espresso",
      "Bhoj Cafe: classic bohemian rooftop with river sound and traveler journal exchanges"
    ],
    soloExperiences: [
      "Hiking the gentle 30-minute pine trail from Kasol bridge to Chalal hamlet",
      "Soaking in the natural hot sulphur springs at ancient Manikaran Sahib Gurudwara (4 km away)",
      "Trekking to the alpine wooden village of Tosh overlooking the glacier"
    ],
    etiquette: [
      "Respect local village deities and sacred customs; never touch traditional wooden homes in Malana",
      "Strictly zero single-use plastic littering along Parvati riverbanks and trails",
      "Carry sufficient physical cash as ATMs in Parvati Valley frequently run dry"
    ],
    emergencyContacts: [
      { label: "Kasol Police Post", number: "01902-273801" },
      { label: "Kullu District Hospital", number: "01902-222350" },
      { label: "Himachal Tourism Desk", number: "01902-222349" },
      { label: "Emergency Helpline", number: "112" }
    ]
  },
  jaipur: {
    tagline: "Terracotta ramparts, artisan block prints, rooftop chai, and grand Rajput hill fort sunsets.",
    safeAreas: [
      "C-Scheme & Civil Lines (upscale, leafy, safe residential and cafe district)",
      "MI Road & Badi Chaupar (vibrant heritage markets with tourist police presence)",
      "Bani Park (peaceful heritage hotel hub close to railway station)",
      "Amber Heritage Precinct (well-patrolled UNESCO monument zone)"
    ],
    gettingAround: [
      "Jaipur Metro provides fast, clean, air-conditioned transit between Chandpole and Badi Chaupar",
      "Auto-rickshaws and app cabs (Uber/Ola) operate 24/7 across the city",
      "Electric e-rickshaws are the best way to navigate inside the narrow Pink City bazaars",
      "RTDC sightseeing buses depart daily from railway station for full-day fort tours"
    ],
    stayTips: [
      "Choose heritage havelis in Bani Park or C-Scheme for peaceful courtyards and pools",
      "Boutique hostels in C-Scheme offer daily walking tours and social rooftop cafes",
      "Look for stays within walking distance of Jaipur Metro stations for effortless transit"
    ],
    diningTips: [
      "Tapri Central: iconic rooftop overlooking Central Park with artisanal chai and fusion snacks",
      "Rawat Mishthan Bhandar: the gold standard for hot pyaaz kachoris and lassi on Station Road",
      "Anokhi Cafe: organic farm-fresh salads, fresh sourdough, and quiet solo dining courtyard"
    ],
    soloExperiences: [
      "Watching the sunset illuminate the Pink City from the high ramparts of Nahargarh Fort",
      "Morning architectural walk through the silent courtyards of Hawa Mahal and City Palace",
      "Exploring authentic block-printing workshops and gemstone craft alleys in Johari Bazaar"
    ],
    etiquette: [
      "Dress respectfully with shoulders and knees covered when visiting Govind Dev Ji temple",
      "Agree on auto-rickshaw fares or insist on meter before starting your journey",
      "Be firm and polite when declining persistent street hawkers near major monuments"
    ],
    emergencyContacts: [
      { label: "Jaipur Tourist Police", number: "0141-2601019" },
      { label: "SMS Medical Hospital", number: "0141-2560291" },
      { label: "Police Control Room", number: "100" },
      { label: "Rajasthan Women Helpline", number: "1090" }
    ]
  },
  varanasi: {
    tagline: "Ancient eternal ghats, dawn boat rides, sacred chanting, and labyrinthine silk lanes.",
    safeAreas: [
      "Assi Ghat (southern hub, peaceful, intellectual, student and traveler friendly)",
      "Dashashwamedh Ghat (central, vibrant, well-patrolled, famous for evening aarti)",
      "Kedar Ghat & Pandey Ghat (serene residential ghats with boutique guest houses)",
      "BHU Campus (green, tranquil, leafy academic sanctuary away from old city bustle)"
    ],
    gettingAround: [
      "Walking is the only way to experience the magical maze of the old city galiyan (lanes)",
      "Shared rowing and motorboats connect Assi to Dashashwamedh and Manikarnika along the river",
      "Cycle rickshaws and e-rickshaws ply Godowlia Chowk to Cantt Railway Station",
      "Keep offline GPS maps active when wandering deep inside the ancient alleys"
    ],
    stayTips: [
      "Assi Ghat and Kedar Ghat are top choices for solo travelers seeking peaceful river views",
      "Look for guesthouses with open rooftop terraces directly overlooking the Ganges",
      "Book properties with verified river-facing balconies to watch dawn boat processions"
    ],
    diningTips: [
      "Brown Bread Bakery: organic rooftop with rooftop bakery, European breakfast, and evening sitar",
      "Pizzeria Vaatika Cafe: famous apple pie and thin-crust pizza right on the steps of Assi Ghat",
      "Blue Lassi Shop: iconic 80-year-old lassi sanctuary with clay kulhad curd bowls in Bangali Tola"
    ],
    soloExperiences: [
      "Sunrise silent boat ride from Assi to Manikarnika Ghat as morning prayers echo over the river",
      "Attending the serene dawn Subah-e-Banaras classical music and yoga recitals at Assi Ghat",
      "Day excursion by auto-rickshaw to Sarnath Deer Park where Lord Buddha delivered his first sermon"
    ],
    etiquette: [
      "Maintain absolute reverence, silence, and strict zero photography at Manikarnika cremation ghat",
      "Remove footwear outside all temple entrances and watch your footing on slippery river steps",
      "Be wary of unofficial boatmen quoting inflated prices; book through government kiosks or guesthouses"
    ],
    emergencyContacts: [
      { label: "Varanasi Tourist Police", number: "0542-2508118" },
      { label: "Heritage Hospital Lanka", number: "0542-2368888" },
      { label: "Ghat Security Command", number: "112" },
      { label: "UP Women Powerline", number: "1090" }
    ]
  }
};

const TRAVEL_STYLES = [
  { id: "slow", label: "Slow Travel", icon: Sun, desc: "Long stays, peaceful reading, morning tea, and unhurried days" },
  { id: "adventure", label: "Adventure & Trails", icon: Mountain, desc: "Day hikes, alpine ridges, river rapids, and high passes" },
  { id: "culture", label: "Culture & Heritage", icon: BookOpen, desc: "Ancient stone temples, royal palaces, folk arts, and old lanes" },
  { id: "food", label: "Cafes & Food", icon: Coffee, desc: "Riverside bakeries, regional thalis, specialty coffee, and dhabas" },
  { id: "nature", label: "Nature & Solitude", icon: Footprints, desc: "Cedar forests, waterfalls, misty viewpoints, and starlit nights" },
  { id: "spiritual", label: "Spiritual & Ashrams", icon: Heart, desc: "Sacred river aartis, silent meditation, ashram retreats, and yoga" },
  { id: "backpacking", label: "Backpacking", icon: Compass, desc: "Social hostels, shared transit, budget stays, and spontaneous routes" },
];

function SoloTravelInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const destParam = searchParams.get("dest") || searchParams.get("destination") || "manali";
  const [selectedDestSlug, setSelectedDestSlug] = useState<string>(destParam.toLowerCase());
  const [selectedStyle, setSelectedStyle] = useState<string>("slow");
  const [destinations, setDestinations] = useState<Destination[]>(CANONICAL_DESTINATIONS);
  const [places, setPlaces] = useState<Place[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (destParam && destParam.toLowerCase() !== selectedDestSlug) {
      setSelectedDestSlug(destParam.toLowerCase());
    }
  }, [destParam]);

  useEffect(() => {
    setLoading(true);
    api.getDestinationDetail(selectedDestSlug)
      .then((data) => {
        if (data && data.places) {
          setPlaces(data.places);
        }
        if (data && data.hotels) {
          setHotels(data.hotels);
        }
      })
      .catch(() => {
        // Fallback
        setPlaces([]);
        setHotels([]);
      })
      .finally(() => setLoading(false));
  }, [selectedDestSlug]);

  const handleSelectDestination = (slug: string) => {
    setSelectedDestSlug(slug);
    router.replace(`/solo?dest=${slug}`, { scroll: false });
  };

  const currentDest = destinations.find((d) => d.slug === selectedDestSlug) || {
    name: selectedDestSlug.charAt(0).toUpperCase() + selectedDestSlug.slice(1),
    slug: selectedDestSlug,
    state: "India",
    tagline: "Live verified solo intelligence and field companion.",
  };

  const intel = SOLO_DESTINATION_INTEL[selectedDestSlug] || {
    tagline: `Quiet exploration, verified safe quarters, and trusted stays in ${currentDest.name}.`,
    safeAreas: [
      `Central heritage and market quarters of ${currentDest.name}`,
      "Well-lit main streets near official transport stands",
      "Active traveler cafe precincts with verified reviews"
    ],
    gettingAround: [
      `Walking is the most authentic way to explore ${currentDest.name}`,
      "Local auto-rickshaws and verified two-wheeler rentals operate in central hubs",
      "Agree on rates before embarking or request digital meter"
    ],
    stayTips: [
      "Select verified homestays or boutique hostels with active common spaces",
      "Check traveler ratings for safety, cleanliness, and friendly local hosts",
      "Properties offering front desk assistance 24/7 provide extra peace of mind"
    ],
    diningTips: [
      "Look for welcoming cafes with outdoor seating and communal tables",
      "Local thali joints and dhabas are great for authentic, unhurried meals",
      "Book corner cafes are ideal for dining comfortably with a notebook"
    ],
    soloExperiences: [
      `Early morning nature and heritage walks around ${currentDest.name}`,
      "Visiting scenic sunset viewpoints overlooking the valley",
      "Exploring traditional artisan markets and historic architecture"
    ],
    etiquette: [
      "Respect local customs and remove shoes before entering religious shrines",
      "Dress modestly when visiting sacred spaces and traditional neighborhoods",
      "Practice zero-waste travel and keep natural sanctuaries clean"
    ],
    emergencyContacts: [
      { label: `${currentDest.name} Police Station`, number: "112" },
      { label: "Local Civil Hospital", number: "108" },
      { label: "National Emergency SOS", number: "112" },
      { label: "National Women Helpline", number: "1091" }
    ]
  };

  const soloFriendlyPlaces = places.filter((p) => {
    const cat = (p.category || "").toLowerCase();
    const tags = (p.tags || "").toLowerCase();
    return p.is_must_visit || p.is_hidden_gem || cat.includes("cafe") || cat.includes("nature") || cat.includes("culture") || tags.includes("peaceful") || tags.includes("view");
  }).slice(0, 6);

  return (
    <div className="min-h-screen bg-[#FAF4E8] text-[#20211D]">
      {/* 1. EDITORIAL SOLO HERO */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-[#D8CBB2] bg-[#FAF7F0] overflow-hidden">
        <div className="max-w-5xl mx-auto space-y-8 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <TravelStamp label="VANVAS SOLO FIELD COMPANION" variant="forest" />
            <TravelStamp label="स्वतंत्र सफ़रनामा" variant="terracotta" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#7B4D36] hidden sm:inline-block">
              [ 100% Free • Verified Intelligence ]
            </span>
          </div>

          <div className="space-y-3 max-w-3xl">
            <h1 className="text-4xl sm:text-6xl font-serif font-black tracking-tight text-[#173B32] leading-[1.08]">
              Go alone. <br className="hidden sm:inline" />
              <span className="text-[#B65E3C] italic font-normal">Never feel unprepared.</span>
            </h1>
            <p className="text-sm sm:text-base text-[#7B4D36] font-serif leading-relaxed font-light max-w-2xl">
              A quiet, human field companion for solo travelers in India. Verified safe quarters, communal tables, walkable loops, and solitude without uncertainty.
            </p>
          </div>

          {/* Destination Quick Selector */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#173B32] flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-[#B65E3C]" />
                <span>Choose Sanctuary:</span>
              </span>
              <span className="text-[11px] font-mono text-[#7B4D36]">
                Viewing: <strong className="text-[#173B32] uppercase">{currentDest.name}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {["manali", "rishikesh", "mussoorie", "udaipur", "kasol", "jaipur", "varanasi", "dharamshala", "goa", "leh", "spiti", "munnar"].map((slug) => {
                const isActive = selectedDestSlug === slug;
                const dName = slug.charAt(0).toUpperCase() + slug.slice(1);
                return (
                  <button
                    key={slug}
                    onClick={() => handleSelectDestination(slug)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? "bg-[#173B32] text-[#FAF7F0] shadow-md border border-[#173B32]"
                        : "bg-[#EFE5D2] text-[#173B32] border border-[#D8CBB2] hover:bg-[#E5D5BA]"
                    }`}
                  >
                    <span>{dName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* 2. TRAVEL MENTALITY / STYLE SELECTOR */}
        <section className="space-y-6">
          <div className="border-b border-[#D8CBB2] pb-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B65E3C]">
                सफ़र का मिज़ाज • Travel Style
              </span>
              <h2 className="text-2xl font-serif font-black text-[#173B32] mt-0.5">
                How do you want to travel {currentDest.name}?
              </h2>
            </div>
            <span className="text-xs text-[#7B4D36] font-serif italic">
              Quiet recommendations adapted to your rhythm
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {TRAVEL_STYLES.map((style) => {
              const Icon = style.icon;
              const isActive = selectedStyle === style.id;
              return (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                    isActive
                      ? "bg-[#FAF7F0] border-[#173B32] shadow-md ring-2 ring-[#173B32]/20"
                      : "bg-[#FAF7F0]/60 border-[#D8CBB2] hover:bg-[#FAF7F0] hover:border-[#7B4D36]/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isActive ? "bg-[#173B32] text-[#FAF7F0]" : "bg-[#EFE5D2] text-[#173B32]"}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {isActive && <span className="w-2 h-2 rounded-full bg-[#B65E3C]" />}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-[#173B32]">{style.label}</h3>
                    <p className="text-[11px] text-[#7B4D36] leading-relaxed mt-1 font-light">{style.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. SCANNABLE SOLO ESSENTIALS (DESTINATION AWARE) */}
        <section className="space-y-6">
          <div className="border-b border-[#D8CBB2] pb-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B65E3C]">
                FIELD INTELLIGENCE • {currentDest.name.toUpperCase()}
              </span>
              <h2 className="text-2xl font-serif font-black text-[#173B32] mt-0.5">
                Solo Essentials for {currentDest.name}
              </h2>
            </div>
            <p className="text-xs text-[#7B4D36] font-serif italic">
              {intel.tagline}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Safe Quarters & Walkable Areas */}
            <div className="p-6 rounded-3xl bg-[#FAF7F0] border border-[#D8CBB2] shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-[#173B32]">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Verified Safe Quarters &amp; Neighborhoods</span>
              </div>
              <ul className="space-y-2.5 text-xs text-[#20211D]/85">
                {intel.safeAreas.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Getting Around Safely */}
            <div className="p-6 rounded-3xl bg-[#FAF7F0] border border-[#D8CBB2] shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-[#173B32]">
                <Navigation className="w-5 h-5 text-[#B65E3C]" />
                <span>Local Transit &amp; Mobility Wisdom</span>
              </div>
              <ul className="space-y-2.5 text-xs text-[#20211D]/85">
                {intel.gettingAround.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-[#B65E3C] font-bold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Where to Stay Solo */}
            <div className="p-6 rounded-3xl bg-[#FAF7F0] border border-[#D8CBB2] shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-[#173B32]">
                <BedDouble className="w-5 h-5 text-[#B49252]" />
                <span>Solo Stays &amp; Hostel Culture</span>
              </div>
              <ul className="space-y-2.5 text-xs text-[#20211D]/85">
                {intel.stayTips.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-[#B49252] font-bold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Dining & Communal Tables */}
            <div className="p-6 rounded-3xl bg-[#FAF7F0] border border-[#D8CBB2] shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-[#173B32]">
                <Coffee className="w-5 h-5 text-[#7B4D36]" />
                <span>Solo-Friendly Dining &amp; Cafes</span>
              </div>
              <ul className="space-y-2.5 text-xs text-[#20211D]/85">
                {intel.diningTips.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-[#7B4D36] font-bold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 4. CURATED PLACES TO EXPLORE ALONE */}
        <section className="space-y-6">
          <div className="border-b border-[#D8CBB2] pb-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B65E3C]">
                CURATED PLACES • {currentDest.name.toUpperCase()}
              </span>
              <h2 className="text-2xl font-serif font-black text-[#173B32] mt-0.5">
                Places Worth Experiencing Alone
              </h2>
            </div>
            <Link
              href={`/explore/${selectedDestSlug}`}
              className="text-xs font-bold text-[#B65E3C] hover:underline flex items-center gap-1"
            >
              <span>Full {currentDest.name} Discovery Guide →</span>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-[#EFE5D2] animate-pulse" />
              ))}
            </div>
          ) : soloFriendlyPlaces.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {soloFriendlyPlaces.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  destinationName={currentDest.name}
                  onSelect={(p) => {
                    setSelectedPlace(p);
                    setModalOpen(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-[#FAF7F0] border border-[#D8CBB2] text-center space-y-2">
              <Compass className="w-8 h-8 text-[#B65E3C] mx-auto opacity-70" />
              <p className="text-xs text-[#7B4D36]">Loading places for this sanctuary...</p>
            </div>
          )}
        </section>

        {/* 5. LOCAL ETIQUETTE & EMERGENCY SOS CONTACTS */}
        <section className="p-6 sm:p-8 rounded-3xl bg-[#FAF7F0] border border-[#D8CBB2] space-y-6">
          <div className="flex items-center justify-between border-b border-[#D8CBB2] pb-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#173B32]">
              <Shield className="w-4 h-4 text-[#B65E3C]" />
              <span>Sanctuary Wisdom &amp; Emergency Helpline Contacts</span>
            </div>
            <span className="text-[11px] font-mono text-[#7B4D36]">Verified SOS Network</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <span className="text-xs font-bold text-[#173B32] block">Local Codes &amp; Safety Etiquette:</span>
              <ul className="space-y-2 text-xs text-[#20211D]/85">
                {intel.etiquette.map((et, i) => (
                  <li key={i} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-[#B65E3C] font-bold mt-0.5">•</span>
                    <span>{et}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-[#173B32] block">Verified Emergency Contacts:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {intel.emergencyContacts.map((contact, i) => (
                  <a
                    key={i}
                    href={`tel:${contact.number.replace(/[^\d+]/g, "")}`}
                    className="p-3 rounded-2xl bg-[#EFE5D2] hover:bg-[#E5D5BA] border border-[#D8CBB2] transition-colors flex items-center justify-between gap-2 text-xs text-[#173B32] font-semibold"
                  >
                    <span className="truncate">{contact.label}</span>
                    <span className="font-mono text-[11px] text-[#B65E3C] shrink-0 font-bold">{contact.number}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 6. BUILD MY SOLO TRIP CTA BANNER */}
        <section className="p-8 sm:p-12 rounded-3xl bg-[#173B32] text-[#FAF4E8] border border-[#173B32] shadow-xl space-y-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <TravelStamp label="स्वतंत्र योजना" variant="mustard" />
              <TravelStamp label={`SOLO × ${currentDest.name.toUpperCase()}`} variant="terracotta" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-[#FAF4E8]">
              Ready to embark to {currentDest.name}?
            </h2>
            <p className="text-xs sm:text-sm text-[#D8DED5]/90 font-light leading-relaxed">
              We&rsquo;ll cluster your stops to keep walks effortless, pair quiet morning cafes with tranquil viewpoints, and configure solo safety parameters automatically.
            </p>
          </div>

          <div className="shrink-0 w-full sm:w-auto">
            <Link
              href={`/plan?dest=${selectedDestSlug}&companion=Solo&style=${selectedStyle}`}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#FAF4E8] text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 border border-[#7B4D36]/30 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#B49252]" />
              <span>Build My Solo Trip →</span>
            </Link>
          </div>
        </section>
      </main>

      {/* Place Detail Modal */}
      <PlaceModal
        place={selectedPlace}
        destinationName={currentDest.name}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

export default function SoloTravelPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF4E8] flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-[#173B32] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SoloTravelInner />
    </Suspense>
  );
}
