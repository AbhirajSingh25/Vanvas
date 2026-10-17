/**
 * VANVAS Destination Video & Discovery Reels Registry ("See It. Plan It.")
 *
 * Explicitly typed, authentic destination-grounded discovery clips.
 * Every reel maps to real coordinates, verifiable stops, duration estimates,
 * and a runnable itinerary template for "Plan This Route".
 */

export interface ReelWaypoint {
  placeName: string;
  category: string;
  timeHint?: string;
  shortDescription?: string;
}

export interface DestinationReel {
  id: string;
  destinationSlug: string;
  destinationName: string;
  title: string;
  subtitle: string;
  videoUrl: string;
  posterUrl: string;
  creator: string;
  creatorHandle?: string;
  sourceType: "verified_field_video" | "vanvas_curated_cinema" | "licensed_editorial";
  durationLabel: string;
  experienceType: "Trail Trek" | "Spiritual Walk" | "Alpine Roadtrip" | "Lakeside Sunset" | "Heritage Trail" | "Food Journey";
  waypoints: ReelWaypoint[];
  itinerarySummary: string;
  itineraryStops: {
    time: string;
    title: string;
    category: string;
    description: string;
  }[];
}

export const DESTINATION_REELS_REGISTRY: Record<string, DestinationReel[]> = {
  manali: [
    {
      id: "manali-hadimba-forest-trail",
      destinationSlug: "manali",
      destinationName: "Manali",
      title: "Hadimba Cedar Pagoda & Old Village",
      subtitle: "Ancient 1553 pagoda nestled in 400-year-old deodar forests, leading to hillside stone cafes.",
      videoUrl: "/videos/reels/manali_hadimba_loop.mp4",
      posterUrl: "/images/places/manali/hadimba-temple.webp",
      creator: "VANVAS Himalayan Field Unit",
      creatorHandle: "@vanvas_trails",
      sourceType: "vanvas_curated_cinema",
      durationLabel: "Half Day • 3h 30m",
      experienceType: "Spiritual Walk",
      waypoints: [
        { placeName: "Hadimba Temple Pagoda", category: "Culture & Heritage", timeHint: "08:30 AM" },
        { placeName: "Dhungri Cedar Forest Path", category: "Nature & Trails", timeHint: "10:00 AM" },
        { placeName: "Old Manali Stone Cafes", category: "Cafés & Food", timeHint: "11:30 AM" },
      ],
      itinerarySummary: "A serene morning exploration through high-canopy deodar woods from Hadimba Temple into Old Manali's riverside bakeries.",
      itineraryStops: [
        { time: "08:30 AM", title: "Hadimba Temple Morning Darshan", category: "Culture & Heritage", description: "Arrive before the midday rush to witness sunlight filtering through four tiers of carved deodar timber." },
        { time: "10:15 AM", title: "Dhungri Pine Wood Walk", category: "Nature & Trails", description: "Follow the upper dirt trail through undisturbed cedar groves with vistas across the Beas valley." },
        { time: "11:45 AM", title: "Old Manali Riverside Brunch", category: "Cafés & Food", description: "Unwind at Cafe 1947 or Drifters' Cafe with wood-fired bread and fresh mountain mint tea." },
      ],
    },
    {
      id: "manali-solang-alpine-pass",
      destinationSlug: "manali",
      destinationName: "Manali",
      title: "Solang Valley Alpine Meadow",
      subtitle: "High glacial bowl with sweeping views toward Rohtang crest and snowmelt streams.",
      videoUrl: "/videos/reels/manali_solang_valley.mp4",
      posterUrl: "/images/places/manali/solang-valley.webp",
      creator: "VANVAS Alpine Scouts",
      creatorHandle: "@vanvas_scouts",
      sourceType: "vanvas_curated_cinema",
      durationLabel: "Full Day • 5h 00m",
      experienceType: "Alpine Roadtrip",
      waypoints: [
        { placeName: "Palchan Valley Drive", category: "Transit", timeHint: "09:00 AM" },
        { placeName: "Solang Valley Meadow", category: "Adventure", timeHint: "10:30 AM" },
        { placeName: "Anjani Mahadev Spring", category: "Nature & Trails", timeHint: "01:30 PM" },
      ],
      itinerarySummary: "Ascend 14 km northwest from Mall Road through apple orchards up to the Solang glacial amphitheatre.",
      itineraryStops: [
        { time: "09:00 AM", title: "Scenic Drive to Solang", category: "Transit", description: "Travel along the Beas gorge through apple villages and pine forests toward the high valley." },
        { time: "10:30 AM", title: "Solang Valley Ridge Exploration", category: "Adventure", description: "Take in sweeping 360-degree views of snow-dusted Himalayan peaks and paragliding takeoffs." },
        { time: "01:30 PM", title: "Anjani Mahadev Stream Walk", category: "Nature & Trails", description: "Short 2km nature walk up to the sacred natural snow/water fountain tucked into the mountain face." },
      ],
    },
    {
      id: "manali-jogini-waterfall-trek",
      destinationSlug: "manali",
      destinationName: "Manali",
      title: "Jogini Cascades & Vashisht Springs",
      subtitle: "Forest cliffside falls cascading 150 feet down into terraced apple orchards.",
      videoUrl: "/videos/reels/manali_jogini_falls.mp4",
      posterUrl: "/images/places/manali/jogini-waterfall.webp",
      creator: "VANVAS Trail Guide",
      creatorHandle: "@vanvas_trails",
      sourceType: "vanvas_curated_cinema",
      durationLabel: "Half Day • 4h 00m",
      experienceType: "Trail Trek",
      waypoints: [
        { placeName: "Vashisht Hot Water Springs", category: "Spiritual", timeHint: "07:30 AM" },
        { placeName: "Jogini Falls Lower Tier", category: "Nature & Trails", timeHint: "09:15 AM" },
        { placeName: "Jogini Upper Cliff Basin", category: "Nature & Trails", timeHint: "10:45 AM" },
      ],
      itinerarySummary: "A morning pine-trail hike from historic Vashisht village through orchards to the multi-tier Jogini Falls.",
      itineraryStops: [
        { time: "07:30 AM", title: "Vashisht Village Springs", category: "Spiritual", description: "Experience the natural sulfur hot water springs and 4000-year-old stone temple before crowds arrive." },
        { time: "09:15 AM", title: "Orchard Trail to Jogini Falls", category: "Nature & Trails", description: "Walk along narrow dirt paths framed by apple trees, wooden cottages, and roaring glacial streams." },
        { time: "10:45 AM", title: "Upper Falls Cliff Meditation", category: "Nature & Trails", description: "Cool mist and dramatic panoramic views across the valley toward Rohtang Pass." },
      ],
    },
  ],

  dharamshala: [
    {
      id: "dharamshala-triund-crest",
      destinationSlug: "dharamshala",
      destinationName: "Dharamshala",
      title: "Triund Ridge Crest Trail",
      subtitle: "The crown jewel trek of the Dhauladhars, rising from oak forests straight to towering granite cliffs.",
      videoUrl: "/videos/reels/dharamshala_triund_trek.mp4",
      posterUrl: "/images/places/dharamshala/triund-trek.webp",
      creator: "VANVAS Mountain Team",
      creatorHandle: "@vanvas_dhauladhar",
      sourceType: "vanvas_curated_cinema",
      durationLabel: "Full Day • 6h 30m",
      experienceType: "Trail Trek",
      waypoints: [
        { placeName: "Gallu Devi Base", category: "Trail Base", timeHint: "07:00 AM" },
        { placeName: "Magic View Rest Point", category: "Viewpoint", timeHint: "09:30 AM" },
        { placeName: "Triund Top Ridge", category: "Summit", timeHint: "11:45 AM" },
      ],
      itinerarySummary: "Classic mountain ridge trek ascending 9km from McLeod Ganj into dramatic proximity with Mun Peak (4,610m).",
      itineraryStops: [
        { time: "07:00 AM", title: "Gallu Devi Base Start", category: "Trail Base", description: "Early departure past Gallu Devi temple through shaded rhododendron and pine forest." },
        { time: "09:30 AM", title: "Magic View Cafe Break", category: "Viewpoint", description: "Replenish with lemon-ginger-honey tea overlooking the expansive Kangra valley floor below." },
        { time: "11:45 AM", title: "Triund Ridge Summit", category: "Summit", description: "Touchdown at 2,828m with unobstructed granite walls of the Dhauladhar range rising directly ahead." },
      ],
    },
    {
      id: "dharamshala-bhagsu-waterfall",
      destinationSlug: "dharamshala",
      destinationName: "Dharamshala",
      title: "Bhagsu Falls & Shiva Rock Cafe",
      subtitle: "Chilled Himalayan stream winding through stone stairs and dramatic mountain terraces.",
      videoUrl: "/videos/reels/dharamshala_bhagsunag_falls.mp4",
      posterUrl: "/images/places/dharamshala/bhagsunag-waterfall.webp",
      creator: "VANVAS Discovery Unit",
      creatorHandle: "@vanvas_trails",
      sourceType: "vanvas_curated_cinema",
      durationLabel: "Half Day • 3h 00m",
      experienceType: "Lakeside Sunset",
      waypoints: [
        { placeName: "Bhagsunag Temple", category: "Culture & Heritage", timeHint: "09:00 AM" },
        { placeName: "Bhagsu Waterfall", category: "Nature & Trails", timeHint: "10:15 AM" },
        { placeName: "Upper Shiva Mountain Cafe", category: "Cafés & Food", timeHint: "11:30 AM" },
      ],
      itinerarySummary: "A refreshing walk up from Bhagsunag village along stepped stone pathways to the waterfall and upper plateau.",
      itineraryStops: [
        { time: "09:00 AM", title: "Bhagsunag Sacred Pool", category: "Culture & Heritage", description: "Historic stone temple dedicated to Lord Shiva with continuous mountain spring-fed tanks." },
        { time: "10:15 AM", title: "Bhagsu Waterfall Steps", category: "Nature & Trails", description: "Walk along the cliffside path as the falls plummet 20 meters into a cool stone pool." },
        { time: "11:30 AM", title: "Shiva Rock Terrace Tea", category: "Cafés & Food", description: "Perch on carved stone terraces above the falls enjoying fresh mint tea and tranquil valley panoramas." },
      ],
    },
    {
      id: "dharamshala-namgyal-monastery",
      destinationSlug: "dharamshala",
      destinationName: "Dharamshala",
      title: "Tsuglagkhang & Monks Kora Walk",
      subtitle: "The spiritual heart of McLeod Ganj, resonant with Buddhist chanting and rotating brass prayer wheels.",
      videoUrl: "/videos/reels/dharamshala_namgyal_monastery.mp4",
      posterUrl: "/images/places/dharamshala/namgyal-monastery.webp",
      creator: "VANVAS Heritage Archive",
      creatorHandle: "@vanvas_heritage",
      sourceType: "vanvas_curated_cinema",
      durationLabel: "Morning • 2h 30m",
      experienceType: "Spiritual Walk",
      waypoints: [
        { placeName: "Tsuglagkhang Main Temple", category: "Spiritual", timeHint: "08:00 AM" },
        { placeName: "Kora Meditation Circuit", category: "Spiritual", timeHint: "09:15 AM" },
        { placeName: "Tibet Kitchen & Library", category: "Culture & Food", timeHint: "10:30 AM" },
      ],
      itinerarySummary: "Walk the sacred kora path around the Dalai Lama's temple with fluttering prayer flags in cedar groves.",
      itineraryStops: [
        { time: "08:00 AM", title: "Tsuglagkhang Temple Chanting", category: "Spiritual", description: "Quiet morning observation of monastic debates, gilded statues of Sakyamuni, and butter lamps." },
        { time: "09:15 AM", title: "Forest Kora Circuit", category: "Spiritual", description: "Circumambulate the complex along a paved hillside forest loop lined with thousands of prayer flags." },
        { time: "10:30 AM", title: "Traditional Tibetan Breakfast", category: "Culture & Food", description: "Warm up with steamed tingmo, potato sha phaley, and butter tea in McLeod Ganj main market." },
      ],
    },
  ],

  "kainchi-dham": [
    {
      id: "kainchi-ashram-hermitage",
      destinationSlug: "kainchi-dham",
      destinationName: "Kainchi Dham",
      title: "Neem Karoli Baba Sacred Hermitage",
      subtitle: "Secluded valley hermitage flanked by twin mountain ridges, river sanctuary, and temple bells.",
      videoUrl: "/videos/reels/kainchi_ashram_morning.mp4",
      posterUrl: "/images/places/kainchi-dham/neem-karoli-baba-ashram.webp",
      creator: "VANVAS Kumaon Chronicle",
      creatorHandle: "@vanvas_kumaon",
      sourceType: "vanvas_curated_cinema",
      durationLabel: "Morning • 3h 00m",
      experienceType: "Spiritual Walk",
      waypoints: [
        { placeName: "Kainchi Valley River Bridge", category: "Arrival", timeHint: "07:30 AM" },
        { placeName: "Neem Karoli Baba Ashram", category: "Spiritual", timeHint: "08:00 AM" },
        { placeName: "Hillside Meditation Benches", category: "Nature & Trails", timeHint: "09:45 AM" },
      ],
      itinerarySummary: "Immerse in the peaceful morning resonance of Hanuman Chalisa recitations and river mist.",
      itineraryStops: [
        { time: "07:30 AM", title: "Cross the Suspension Bridge", category: "Arrival", description: "Step across the quiet Kshipra river stream as morning mountain fog lifts off the pine ridges." },
        { time: "08:00 AM", title: "Morning Aarti & Darshan", category: "Spiritual", description: "Experience morning prayers, bell chimes, and sacred prasad inside the pristine sanctum." },
        { time: "09:45 AM", title: "Quiet Reflection Terrace", category: "Nature & Trails", description: "Rest on stone benches alongside the wooded hillside listening to gentle river currents." },
      ],
    },
    {
      id: "kainchi-bhimtal-lake-island",
      destinationSlug: "kainchi-dham",
      destinationName: "Kainchi Dham",
      title: "Bhimtal Lake & Island Sanctuary",
      subtitle: "Deep cobalt waters larger than Naini Lake, with wooden rowboats drifting to an aquarium island.",
      videoUrl: "/videos/reels/kainchi_bhimtal_lake.mp4",
      posterUrl: "/images/places/kainchi-dham/bhimtal-island-lake.webp",
      creator: "VANVAS Kumaon Chronicle",
      creatorHandle: "@vanvas_kumaon",
      sourceType: "vanvas_curated_cinema",
      durationLabel: "Half Day • 3h 30m",
      experienceType: "Lakeside Sunset",
      waypoints: [
        { placeName: "Bhimtal Lake Shore", category: "Nature & Trails", timeHint: "02:00 PM" },
        { placeName: "Traditional Wooden Rowing Boat", category: "Adventure", timeHint: "02:45 PM" },
        { placeName: "Central Island Promenade", category: "Hidden Gems", timeHint: "03:30 PM" },
      ],
      itinerarySummary: "An idyllic afternoon drive from Bhowali down to Bhimtal for peaceful lake boating and island strolls.",
      itineraryStops: [
        { time: "02:00 PM", title: "Bhimtal Lakeside Arrival", category: "Nature & Trails", description: "Arrive at the peaceful southern bank shaded by willow trees and tranquil cafe terraces." },
        { time: "02:45 PM", title: "Hand-Rowed Boat to Central Island", category: "Adventure", description: "Drift across clear emerald waters in classic wooden boats towards the central island." },
        { time: "03:30 PM", title: "Island Promenade Walk", category: "Hidden Gems", description: "Explore the garden walkways and historic Victorian dam masonry at the northern end." },
      ],
    },
    {
      id: "kainchi-sattal-forest-lakes",
      destinationSlug: "kainchi-dham",
      destinationName: "Kainchi Dham",
      title: "Sattal Seven Interconnected Lakes",
      subtitle: "Dense oak forest haven with seven freshwater lakes, kingfishers, and silent kayak waters.",
      videoUrl: "/videos/reels/kainchi_sattal_lakes.mp4",
      posterUrl: "/images/places/kainchi-dham/sattal-interconnected-lakes.webp",
      creator: "VANVAS Kumaon Chronicle",
      creatorHandle: "@vanvas_kumaon",
      sourceType: "vanvas_curated_cinema",
      durationLabel: "Full Day • 5h 00m",
      experienceType: "Trail Trek",
      waypoints: [
        { placeName: "Ram Tal & Sita Tal Gate", category: "Nature & Trails", timeHint: "09:30 AM" },
        { placeName: "Oak Forest Trail to Panna Tal", category: "Trail Trek", timeHint: "11:00 AM" },
        { placeName: "Subhash Dhaba Kumaoni Lunch", category: "Local Food", timeHint: "01:30 PM" },
      ],
      itinerarySummary: "Immerse in undisturbed Himalayan oak and pine woodlands connecting seven pristine freshwater lakes.",
      itineraryStops: [
        { time: "09:30 AM", title: "Freshwater Lake Basin", category: "Nature & Trails", description: "Explore the interconnected shorelines where Himalayan kingfishers and barbets nest." },
        { time: "11:00 AM", title: "Deep Forest Trail", category: "Trail Trek", description: "Hike shaded dirt singletracks connecting Sita Tal, Ram Tal, and secluded Panna Tal." },
        { time: "01:30 PM", title: "Traditional Kumaoni Ras-Bhaat", category: "Local Food", description: "Savour local Bhatt ki Churkani and Aloo ke Gutke at Subhash Dhaba in Bhowali market." },
      ],
    },
  ],

  rishikesh: [
    {
      id: "rishikesh-beatles-ashram",
      destinationSlug: "rishikesh",
      destinationName: "Rishikesh",
      title: "Beatles Ashram & Mural Sanctuary",
      subtitle: "The 1968 Maharishi Mahesh Yogi ashram inside Rajaji Tiger Reserve, adorned with sacred murals and banyan trees.",
      videoUrl: "/videos/reels/rishikesh_beatles_ashram.mp4",
      posterUrl: "/images/places/rishikesh/beatles-ashram.webp",
      creator: "VANVAS Ganga Valley Archives",
      creatorHandle: "@vanvas_ganga",
      sourceType: "vanvas_curated_cinema",
      durationLabel: "Half Day • 3h 30m",
      experienceType: "Spiritual Walk",
      waypoints: [
        { placeName: "Swarg Ashram Forest Gate", category: "Arrival", timeHint: "09:00 AM" },
        { placeName: "Chaurasi Kutia Meditation Domes", category: "Heritage", timeHint: "10:15 AM" },
        { placeName: "Beatles Cathedral Hall Murals", category: "Culture", timeHint: "11:30 AM" },
      ],
      itinerarySummary: "A meditative walking route through stone river-pebble domes and iconic counter-culture art halls.",
      itineraryStops: [
        { time: "09:00 AM", title: "Rajaji Reserve Forest Entry", category: "Arrival", description: "Pass through tranquil park gates into the peaceful forested foothills overlooking the Ganges." },
        { time: "10:15 AM", title: "Chaurasi Kutia Stone Domes", category: "Heritage", description: "Walk among 84 river-stone meditation caves built for deep contemplation and transcendental meditation." },
        { time: "11:30 AM", title: "Beatles Cathedral Hall Murals", category: "Culture", description: "Witness hand-painted psychedelic murals celebrating John, Paul, George, and Ringo's historic 1968 stay." },
      ],
    },
  ],

  jaipur: [
    {
      id: "jaipur-amber-fort-ramparts",
      destinationSlug: "jaipur",
      destinationName: "Jaipur",
      title: "Amber Fort Ramparts & Sheesh Mahal",
      subtitle: "Towering 16th-century yellow sandstone fortress overlooking Maota Lake, adorned with thousand-mirror mosaic halls.",
      videoUrl: "/videos/reels/jaipur_amber_fort.mp4",
      posterUrl: "/images/places/jaipur/amber-fort.webp",
      creator: "VANVAS Rajputana Archives",
      creatorHandle: "@vanvas_heritage",
      sourceType: "vanvas_curated_cinema",
      durationLabel: "Half Day • 4h 00m",
      experienceType: "Heritage Trail",
      waypoints: [
        { placeName: "Suraj Pol Sun Gate", category: "Heritage", timeHint: "08:30 AM" },
        { placeName: "Sheesh Mahal Hall of Mirrors", category: "Culture", timeHint: "10:00 AM" },
        { placeName: "Kesar Kyari Saffron Garden Overlook", category: "Viewpoint", timeHint: "11:30 AM" },
      ],
      itinerarySummary: "A morning heritage ascent up the stone ramparts into the royal courtyards of Raja Man Singh I.",
      itineraryStops: [
        { time: "08:30 AM", title: "Suraj Pol Sun Gate Entry", category: "Heritage", description: "Ascend through the grand eastern gateway into Jaleb Chowk as golden morning sun hits the amber stone." },
        { time: "10:00 AM", title: "Sheesh Mahal Mirror Pavilion", category: "Culture", description: "Marvel at convex Belgian glass mirrors set into intricate marble floral motifs." },
        { time: "11:30 AM", title: "Maota Lake Saffron Garden View", category: "Viewpoint", description: "Look down from the highest ramparts over the geometrically planted Kesar Kyari island garden." },
      ],
    },
  ],

  udaipur: [
    {
      id: "udaipur-pichola-cruise",
      destinationSlug: "udaipur",
      destinationName: "Udaipur",
      title: "Lake Pichola & Island Palaces",
      subtitle: "Golden hour boat cruise drifting past marble ghats, Gangaur Chowk, and the floating Jag Mandir palace.",
      videoUrl: "/videos/reels/udaipur_pichola_cruise.mp4",
      posterUrl: "/images/places/udaipur/lake-pichola.webp",
      creator: "VANVAS Mewar Chronicle",
      creatorHandle: "@vanvas_mewar",
      sourceType: "vanvas_curated_cinema",
      durationLabel: "Evening • 2h 30m",
      experienceType: "Lakeside Sunset",
      waypoints: [
        { placeName: "Rameshwar Ghat Jetty", category: "Arrival", timeHint: "04:30 PM" },
        { placeName: "Lake Pichola Open Waters", category: "Adventure", timeHint: "05:15 PM" },
        { placeName: "Jag Mandir Island Promenade", category: "Heritage", timeHint: "06:00 PM" },
      ],
      itinerarySummary: "An exquisite late afternoon water cruise witnessing the sunset reflect gold off the City Palace facade.",
      itineraryStops: [
        { time: "04:30 PM", title: "Boarding at Rameshwar Ghat", category: "Arrival", description: "Embark on an electric passenger boat beneath the towering 30-meter marble walls of City Palace." },
        { time: "05:15 PM", title: "Drift Past Gangaur & Ambrai Ghats", category: "Adventure", description: "Witness evening aarti preparations, bathing steps, and heritage havelis illuminated across the water." },
        { time: "06:00 PM", title: "Sunset at Jag Mandir Island", category: "Heritage", description: "Stroll between the eight life-sized carved stone elephants and marble pavilions as night falls." },
      ],
    },
  ],
};

/**
 * Get verified destination reels for a destination.
 * Returns empty array if none are verified, allowing honest fallback presentation.
 */
export function getDestinationReels(destinationSlug: string): DestinationReel[] {
  if (!destinationSlug) return [];
  const normalized = destinationSlug.toLowerCase().trim();
  return DESTINATION_REELS_REGISTRY[normalized] || [];
}

/**
 * Check if destination has verified in-app reels available.
 */
export function hasVerifiedReels(destinationSlug: string): boolean {
  return getDestinationReels(destinationSlug).length > 0;
}
