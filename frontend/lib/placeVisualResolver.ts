/**
 * VANVAS Central Visual Intelligence & Place / Hotel Artwork Resolver
 * 
 * Strict 10-Level Resolution Hierarchy:
 * LEVEL 1: Verified exact-place real photograph -> [ EXACT PLACE PHOTO ]
 * LEVEL 2: Verified exact-place Wikimedia / trusted photo -> [ EXACT PLACE PHOTO ]
 * LEVEL 3: Verified provider / live place photo -> [ LIVE PLACE PHOTO ]
 * LEVEL 4: Curated exact-place / hotel artwork (unique to landmark/property) -> [ VANVAS PLACE ARTWORK ]
 * LEVEL 5: Place-type / category-specific real photograph -> [ DESTINATION CATEGORY ART ]
 * LEVEL 6: Place-type / category-specific destination artwork -> [ DESTINATION CATEGORY ART ]
 * LEVEL 7: Regional category artwork -> [ REGIONAL ART ]
 * LEVEL 8: Universal category artwork -> [ UNIVERSAL FALLBACK ]
 * LEVEL 9: Generic destination artwork -> [ DESTINATION ART ]
 * LEVEL 10: Guaranteed universal safety fallback -> [ UNIVERSAL FALLBACK ]
 */

import { ImageContract, ProvenanceBadge, ImageProvenanceTier, ImageSourceType, ImageExactness } from "@/types";

export type VisualCategory =
  | "food"
  | "restaurant"
  | "cafe"
  | "bakery"
  | "street_food"
  | "market"
  | "shopping"
  | "hotel"
  | "hostel"
  | "homestay"
  | "guesthouse"
  | "stay"
  | "temple"
  | "church"
  | "mosque"
  | "monastery"
  | "ashram"
  | "heritage"
  | "fort"
  | "palace"
  | "museum"
  | "gallery"
  | "trail"
  | "nature"
  | "waterfall"
  | "lake"
  | "beach"
  | "viewpoint"
  | "adventure"
  | "wildlife"
  | "transport"
  | "scooter"
  | "bike"
  | "mobility"
  | "activity"
  | "wellness"
  | "yoga";

export interface ExactPlaceEntry {
  imageUrl: string;
  visualDescription?: string;
  category?: string;
  semanticTheme?: string;
  sourceType?: string;
  source?: string;
  aliases?: string[];
  hotelStyle?: string;
}

export const EXACT_PLACE_REGISTRY: Record<string, ExactPlaceEntry> = {
  "delhi:qutub-minar": {
    imageUrl: "/images/places/delhi/qutub-minar.jpg",
    visualDescription: "Qutub Minar",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "qutub-minar",
      "qutub",
      "qutb-minar"
    ]
  },
  "delhi:red-fort": {
    imageUrl: "/images/places/delhi/red-fort.jpg",
    visualDescription: "Red Fort",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "red-fort",
      "lal-qila"
    ]
  },
  "delhi:india-gate": {
    imageUrl: "/images/places/delhi/india-gate.jpg",
    visualDescription: "India Gate",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "india-gate"
    ]
  },
  "delhi:lotus-temple": {
    imageUrl: "/images/places/delhi/lotus-temple.jpg",
    visualDescription: "Lotus Temple",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "lotus-temple"
    ]
  },
  "delhi:humayuns-tomb": {
    imageUrl: "/images/places/delhi/humayuns-tomb.webp",
    visualDescription: "Humayun's Tomb",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "humayuns-tomb"
    ]
  },
  "delhi:akshardham": {
    imageUrl: "/images/places/delhi/akshardham.webp",
    visualDescription: "Akshardham Temple",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "akshardham",
      "swaminarayan-akshardham"
    ]
  },
  "delhi:chandni-chowk": {
    imageUrl: "/images/places/delhi/chandni-chowk.jpg",
    visualDescription: "Chandni Chowk",
    category: "Shops & Markets",
    semanticTheme: "shopping",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chandni-chowk"
    ]
  },
  "mumbai:gateway-of-india": {
    imageUrl: "/images/places/mumbai/gateway-of-india.webp",
    visualDescription: "Gateway of India",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "gateway-of-india",
      "gateway"
    ]
  },
  "amritsar:golden-temple": {
    imageUrl: "/images/places/amritsar/golden-temple.jpg",
    visualDescription: "Golden Temple",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "golden-temple",
      "harmandir-sahib"
    ]
  },
  "mussoorie:landour-bakehouse": {
    imageUrl: "/images/places/mussoorie/landour-bakehouse.webp",
    visualDescription: "Landour Bakehouse",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "landour-bakehouse",
      "landour-bakehouse-and-sisters-bazaar",
      "landour"
    ]
  },
  "dharamshala:bhagsunag-waterfall": {
    imageUrl: "/images/places/dharamshala/bhagsunag-waterfall.webp",
    visualDescription: "Bhagsunag Waterfall",
    category: "Nature & Trails",
    semanticTheme: "waterfall",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bhagsunag-waterfall",
      "bhagsu-waterfall",
      "bhagsunag-waterfall-and-shiva-cafe",
      "bhagsu-waterfall-shiva-cafe",
      "bhagsunag"
    ]
  },
  "dharamshala:namgyal-monastery": {
    imageUrl: "/images/places/dharamshala/namgyal-monastery.webp",
    visualDescription: "Namgyal Monastery & Tsuglagkhang Complex",
    category: "Culture & Heritage",
    semanticTheme: "monastery",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "namgyal-monastery",
      "namgyal",
      "namgyal-monastery-and-tsuglagkhang-complex",
      "tsuglagkhang-complex",
      "namgyal-monastery-tsuglagkhang-complex"
    ]
  },
  "dharamshala:triund-trek": {
    imageUrl: "/images/places/dharamshala/triund-trek.webp",
    visualDescription: "Triund High Ridge Himalayan Trek",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "triund-trek",
      "triund",
      "triund-high-ridge-himalayan-trek",
      "triund-trail",
      "triund-trek-base"
    ]
  },
  "agra:taj-mahal": {
    imageUrl: "/images/places/agra/taj-mahal.webp",
    visualDescription: "17th-century UNESCO World Heritage white marble mausoleum built by Shah Jahan on the banks of the Yamuna River.",
    category: "Must Visit",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "agra-taj-mahal-white-marble-monument",
      "taj-mahal",
      "taj-mahal-agra",
      "taj-mahal-white-marble-monument",
      "taj-mahal-white-marble-monument-agra",
      "taj-mahal-white-marble-monument-of-agra"
    ]
  },
  "agra:agra-red-fort": {
    imageUrl: "/images/places/agra/agra-red-fort.webp",
    visualDescription: "Historic red sandstone fortress residence of the Mughal emperors with expansive courtyards and direct vistas of the Taj Mahal.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "agra",
      "agra-agra",
      "agra-agra-red-jahangiri-mahal",
      "agra-red",
      "agra-red-agra",
      "agra-red-fort",
      "agra-red-fort-and-jahangiri-mahal",
      "agra-red-jahangiri-mahal",
      "agra-red-jahangiri-mahal-agra",
      "agra-red-jahangiri-mahal-of-agra",
      "jahangiri-mahal",
      "red-fort"
    ]
  },
  "agra:mehtab-bagh": {
    imageUrl: "/images/places/agra/mehtab-bagh.webp",
    visualDescription: "Charbagh-style Mughal garden complex aligned perfectly across the Yamuna from the Taj Mahal, ideal for peaceful reflection photography.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "agra-mehtab-bagh-moonlight",
      "mehtab",
      "mehtab-agra",
      "mehtab-bagh",
      "mehtab-bagh-agra",
      "mehtab-bagh-moonlight",
      "mehtab-bagh-moonlight-agra",
      "mehtab-bagh-moonlight-of-agra",
      "mehtab-bagh-moonlight-river-gardens",
      "moonlight-river-gardens"
    ]
  },
  "agra:fatehpur-sikri": {
    imageUrl: "/images/places/agra/fatehpur-sikri.webp",
    visualDescription: "Emperor Akbar's 16th-century red sandstone capital featuring the towering 54m Buland Darwaza and the marble tomb of Salim Chishti.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "agra-fatehpur-sikri-imperial-capital",
      "fatehpur",
      "fatehpur-agra",
      "fatehpur-sikri",
      "fatehpur-sikri-agra",
      "fatehpur-sikri-imperial-capital",
      "fatehpur-sikri-imperial-capital-agra",
      "fatehpur-sikri-imperial-capital-city",
      "fatehpur-sikri-imperial-capital-of-agra"
    ]
  },
  "agra:itmad-ud-daulah": {
    imageUrl: "/images/places/agra/itmad-ud-daulah.webp",
    visualDescription: "Exquisite jewel-box mausoleum built in 1628 with fine marble lattice screens and pioneering pietra dura semi-precious stone inlay work.",
    category: "Hidden Gems",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "agra-of-itimad-ud-daulah-baby-taj",
      "baby-taj",
      "itmad-ud-daulah",
      "of-itimad",
      "of-itimad-agra",
      "of-itimad-ud-daulah-baby-taj",
      "of-itimad-ud-daulah-baby-taj-agra",
      "of-itimad-ud-daulah-baby-taj-of-agra",
      "tomb-of-itimad-ud-daulah",
      "tomb-of-itimad-ud-daulah-baby-taj"
    ]
  },
  "agra:shankar-mithai-bedmi": {
    imageUrl: "/images/places/agra/shankar-mithai-bedmi.webp",
    visualDescription: "Historic Agra breakfast spot in the Old City serving hot urad-dal stuffed Bedmi Puris with spicy Hing aloo sabzi and crisp saffron jalebis.",
    category: "Local Food",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "agra-shankar-mithai-bhandar-bedmi-puri-jalebi",
      "bedmi-puri",
      "jalebi",
      "shankar",
      "shankar-agra",
      "shankar-mithai",
      "shankar-mithai-agra",
      "shankar-mithai-bedmi",
      "shankar-mithai-bhandar",
      "shankar-mithai-bhandar-bedmi-puri-and-jalebi",
      "shankar-mithai-bhandar-bedmi-puri-jalebi",
      "shankar-mithai-bhandar-bedmi-puri-jalebi-agra",
      "shankar-mithai-bhandar-bedmi-puri-jalebi-of-agra"
    ]
  },
  "agra:panchhi-petha-store": {
    imageUrl: "/images/places/agra/panchhi-petha-store.webp",
    visualDescription: "The authentic master confectioner of Agra serving Angoori Petha, Kesar Petha, Chocolate Petha, and crunchy Dalmoth namkeen.",
    category: "Local Food",
    semanticTheme: "shopping",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "agra-panchhi-petha-original-sadar",
      "panchhi",
      "panchhi-agra",
      "panchhi-petha",
      "panchhi-petha-agra",
      "panchhi-petha-original-sadar",
      "panchhi-petha-original-sadar-agra",
      "panchhi-petha-original-sadar-bazaar",
      "panchhi-petha-original-sadar-of-agra",
      "panchhi-petha-store"
    ]
  },
  "agra:akbar-tomb-sikandra": {
    imageUrl: "/images/places/agra/akbar-tomb-sikandra.webp",
    visualDescription: "Grand five-tiered red sandstone and white marble tomb set within a vast 119-acre garden where blackbuck deer and peacocks roam freely.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "agra-akbars-great-at-sikandra",
      "akbar-tomb-sikandra",
      "akbars",
      "akbars-agra",
      "akbars-great",
      "akbars-great-agra",
      "akbars-great-at-sikandra",
      "akbars-great-at-sikandra-agra",
      "akbars-great-at-sikandra-of-agra",
      "akbars-great-tomb-at-sikandra"
    ]
  },
  "alwar-siliserh:siliserh-lake-palace": {
    imageUrl: "/images/places/alwar-siliserh/siliserh-lake-palace.webp",
    visualDescription: "1845 royal hunting lodge built by Maharaja Vinay Singh atop a hillock jutting into the peaceful 10.5 sq km Siliserh water reservoir.",
    category: "Must Visit",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "alwar-siliserh-siliserh-boat-club",
      "royal-boat-club",
      "siliserh",
      "siliserh-alwar-siliserh",
      "siliserh-boat",
      "siliserh-boat-alwar-siliserh",
      "siliserh-boat-club",
      "siliserh-boat-club-alwar-siliserh",
      "siliserh-boat-club-of-alwar-siliserh",
      "siliserh-lake-palace",
      "siliserh-lake-palace-and-royal-boat-club"
    ]
  },
  "alwar-siliserh:bala-quila-alwar-fort": {
    imageUrl: "/images/places/alwar-siliserh/bala-quila-alwar-fort.webp",
    visualDescription: "Massive 10th-century fortification standing 300m above the city with 51 large towers, 446 loopholes for musketry, and grand city ramparts.",
    category: "Must Visit",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "alwar-hilltop-fort",
      "alwar-siliserh-bala-quila-alwar-hilltop",
      "bala",
      "bala-alwar-siliserh",
      "bala-quila",
      "bala-quila-alwar-fort",
      "bala-quila-alwar-hilltop",
      "bala-quila-alwar-hilltop-alwar-siliserh",
      "bala-quila-alwar-hilltop-fort",
      "bala-quila-alwar-hilltop-of-alwar-siliserh",
      "bala-quila-alwar-siliserh"
    ]
  },
  "alwar-siliserh:alwar-city-palace": {
    imageUrl: "/images/places/alwar-siliserh/alwar-city-palace.webp",
    visualDescription: "18th-century palace blending Rajput and Mughal architecture featuring stepped open courtyards, marble pavilions, and the royal Sagar tank.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "alwar",
      "alwar-alwar-siliserh",
      "alwar-city-palace",
      "alwar-city-palace-vinay-vilas-mahal",
      "alwar-siliserh-alwar-vinay-vilas-mahal",
      "alwar-vinay",
      "alwar-vinay-alwar-siliserh",
      "alwar-vinay-vilas-mahal",
      "alwar-vinay-vilas-mahal-alwar-siliserh",
      "alwar-vinay-vilas-mahal-of-alwar-siliserh",
      "vinay-vilas-mahal"
    ]
  },
  "alwar-siliserh:moosi-maharani-chhatri": {
    imageUrl: "/images/places/alwar-siliserh/moosi-maharani-chhatri.webp",
    visualDescription: "Double-story cenotaph of red sandstone and pure white marble dedicated to Maharaja Bakhtawar Singh and Rani Moosi, with intricate mythological fres...",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "alwar-siliserh-moosi-maharani-ki-chhatri-cenotaph",
      "moosi",
      "moosi-alwar-siliserh",
      "moosi-maharani",
      "moosi-maharani-alwar-siliserh",
      "moosi-maharani-chhatri",
      "moosi-maharani-ki-chhatri-cenotaph",
      "moosi-maharani-ki-chhatri-cenotaph-alwar-siliserh",
      "moosi-maharani-ki-chhatri-cenotaph-of-alwar-siliserh"
    ]
  },
  "alwar-siliserh:baba-thakur-das-kalakand": {
    imageUrl: "/images/places/alwar-siliserh/baba-thakur-das-kalakand.webp",
    visualDescription: "The historic confectioner operating since 1947 who invented the world-famous Alwar Milk Cake (Kalakand), made from condensed milk and cardamom.",
    category: "Local Food",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "alwar-siliserh-baba-thakur-das-sons-origin-of-alwar-kalakand",
      "baba",
      "baba-alwar-siliserh",
      "baba-thakur",
      "baba-thakur-alwar-siliserh",
      "baba-thakur-das",
      "baba-thakur-das-and-sons-origin-of-alwar-kalakand",
      "baba-thakur-das-kalakand",
      "baba-thakur-das-sons-origin-of-alwar-kalakand",
      "baba-thakur-das-sons-origin-of-alwar-kalakand-alwar-siliserh",
      "baba-thakur-das-sons-origin-of-alwar-kalakand-of-alwar-siliserh",
      "origin-of-alwar-kalakand",
      "sons"
    ]
  },
  "alwar-siliserh:jai-samand-lake-alwar": {
    imageUrl: "/images/places/alwar-siliserh/jai-samand-lake-alwar.webp",
    visualDescription: "Large artificial lake built by Maharaja Jai Singh in 1910, surrounded by green lawns, scenic chhattris, and seasonal flamingo flocks.",
    category: "Nature & Trails",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "alwar-siliserh-jai-samand-oasis",
      "jai-samand",
      "jai-samand-alwar-siliserh",
      "jai-samand-lake-alwar",
      "jai-samand-lake-oasis",
      "jai-samand-oasis",
      "jai-samand-oasis-alwar-siliserh",
      "jai-samand-oasis-of-alwar-siliserh"
    ]
  },
  "alwar-siliserh:government-museum-alwar": {
    imageUrl: "/images/places/alwar-siliserh/government-museum-alwar.webp",
    visualDescription: "Museum housed inside the City Palace top floor containing priceless Mughal miniature paintings, Persian manuscripts, and ancient Rajput swords.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "alwar-siliserh-government-museum-armor-manuscripts",
      "government",
      "government-alwar-siliserh",
      "government-museum",
      "government-museum-alwar",
      "government-museum-alwar-siliserh",
      "government-museum-armor-manuscripts",
      "government-museum-armor-manuscripts-alwar-siliserh",
      "government-museum-armor-manuscripts-of-alwar-siliserh",
      "government-museum-royal-armor-and-manuscripts",
      "manuscripts",
      "royal-armor"
    ]
  },
  "alwar-siliserh:fateh-jung-gumbad": {
    imageUrl: "/images/places/alwar-siliserh/fateh-jung-gumbad.webp",
    visualDescription: "Majestic 5-story 60-foot domed tomb blending Pathan and Rajput architectural styles, set within quiet gardens near Alwar railway station.",
    category: "Hidden Gems",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "1647-tomb",
      "alwar-siliserh-fateh-jung-ka-gumbad-1647",
      "fateh",
      "fateh-alwar-siliserh",
      "fateh-jung",
      "fateh-jung-alwar-siliserh",
      "fateh-jung-gumbad",
      "fateh-jung-ka-gumbad",
      "fateh-jung-ka-gumbad-1647",
      "fateh-jung-ka-gumbad-1647-alwar-siliserh",
      "fateh-jung-ka-gumbad-1647-of-alwar-siliserh",
      "fateh-jung-ka-gumbad-1647-tomb"
    ]
  },
  "chandigarh:rock-garden-chandigarh": {
    imageUrl: "/images/places/chandigarh/rock-garden-chandigarh.webp",
    visualDescription: "A 40-acre sculpture garden built entirely by Nek Chand using industrial, ceramic, and domestic waste, featuring stone courtyards and waterfalls.",
    category: "Must Visit",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chandigarh-of-chandigarh-nek-chands-fantasy",
      "nek-chands-fantasy",
      "of-chandigarh",
      "of-chandigarh-chandigarh",
      "of-chandigarh-nek-chands-fantasy",
      "of-chandigarh-nek-chands-fantasy-chandigarh",
      "of-chandigarh-nek-chands-fantasy-of-chandigarh",
      "rock-garden",
      "rock-garden-chandigarh",
      "rock-garden-of-chandigarh",
      "rock-garden-of-chandigarh-nek-chands-fantasy"
    ]
  },
  "chandigarh:sukhna-lake-promenade": {
    imageUrl: "/images/places/chandigarh/sukhna-lake-promenade.webp",
    visualDescription: "A 3 sq km pristine rain-fed reservoir at the foothills of the Shivalik hills, famous for morning jogging tracks, solar boats, and quiet sunset benc...",
    category: "Must Visit",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chandigarh-sukhna-promenade-shivalik-views",
      "shivalik-views",
      "sukhna",
      "sukhna-chandigarh",
      "sukhna-lake-promenade",
      "sukhna-lake-promenade-and-shivalik-views",
      "sukhna-promenade",
      "sukhna-promenade-chandigarh",
      "sukhna-promenade-shivalik-views",
      "sukhna-promenade-shivalik-views-chandigarh",
      "sukhna-promenade-shivalik-views-of-chandigarh"
    ]
  },
  "chandigarh:capitol-complex-unesco": {
    imageUrl: "/images/places/chandigarh/capitol-complex-unesco.webp",
    visualDescription: "Le Corbusier's modernist masterwork featuring the monumental Open Hand Monument, Secretariat, High Court, and Palace of Assembly.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "capitol-complex-unesco",
      "chandigarh-le-corbusier-capitol-unesco",
      "le-corbusier",
      "le-corbusier-capitol-complex",
      "le-corbusier-capitol-complex-unesco-heritage",
      "le-corbusier-capitol-unesco",
      "le-corbusier-capitol-unesco-chandigarh",
      "le-corbusier-capitol-unesco-of-chandigarh",
      "le-corbusier-chandigarh",
      "unesco-heritage"
    ]
  },
  "chandigarh:rose-garden-chandigarh": {
    imageUrl: "/images/places/chandigarh/rose-garden-chandigarh.webp",
    visualDescription: "Asia's largest botanical rose garden spread over 30 acres, showcasing over 50,000 rose bushes across 1,600 distinct varieties and medicinal trees.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chandigarh-zakir-hussain-rose",
      "rose-garden",
      "rose-garden-chandigarh",
      "zakir",
      "zakir-chandigarh",
      "zakir-hussain",
      "zakir-hussain-chandigarh",
      "zakir-hussain-rose",
      "zakir-hussain-rose-chandigarh",
      "zakir-hussain-rose-garden",
      "zakir-hussain-rose-of-chandigarh"
    ]
  },
  "chandigarh:sector-17-plaza": {
    imageUrl: "/images/places/chandigarh/sector-17-plaza.webp",
    visualDescription: "The pedestrian-only open heart of Chandigarh lined with fountain squares, Phulkari embroidery emporiums, bookstores, and coffee houses.",
    category: "Markets & Craft",
    semanticTheme: "shopping",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chandigarh-sector-17-open-plaza-pedestrian-promenade",
      "pedestrian-promenade",
      "sector",
      "sector-17",
      "sector-17-chandigarh",
      "sector-17-open-plaza",
      "sector-17-open-plaza-and-pedestrian-promenade",
      "sector-17-open-plaza-pedestrian-promenade",
      "sector-17-open-plaza-pedestrian-promenade-chandigarh",
      "sector-17-open-plaza-pedestrian-promenade-of-chandigarh",
      "sector-17-plaza",
      "sector-chandigarh"
    ]
  },
  "chandigarh:indian-coffee-house-sec17": {
    imageUrl: "/images/places/chandigarh/indian-coffee-house-sec17.webp",
    visualDescription: "Iconic vintage institution staffed by turbaned waiters serving filter coffee in white porcelain cups, mutton dosas, and cheese omelettes.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chandigarh-indian-coffee-sector-17-legacy-since-1957",
      "indian",
      "indian-chandigarh",
      "indian-coffee",
      "indian-coffee-chandigarh",
      "indian-coffee-house",
      "indian-coffee-house-sec17",
      "indian-coffee-house-sector-17-legacy-since-1957",
      "indian-coffee-sector-17-legacy-since-1957",
      "indian-coffee-sector-17-legacy-since-1957-chandigarh",
      "indian-coffee-sector-17-legacy-since-1957-of-chandigarh",
      "sector-17-legacy-since-1957"
    ]
  },
  "chandigarh:pal-dhaba-sector28": {
    imageUrl: "/images/places/chandigarh/pal-dhaba-sector28.webp",
    visualDescription: "Chandigarh's most celebrated non-veg dhaba operating since 1968, famous for rich Punjabi Butter Chicken, Mutton Rogan Josh, and garlic naan.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chandigarh-pal-legendary-butter-chicken-keema",
      "keema",
      "legendary-butter-chicken",
      "pal-dhaba",
      "pal-dhaba-legendary-butter-chicken-and-keema",
      "pal-dhaba-sector28",
      "pal-legendary",
      "pal-legendary-butter-chicken-keema",
      "pal-legendary-butter-chicken-keema-chandigarh",
      "pal-legendary-butter-chicken-keema-of-chandigarh",
      "pal-legendary-chandigarh"
    ]
  },
  "chandigarh:boulevard-cycling-trail": {
    imageUrl: "/images/places/chandigarh/boulevard-cycling-trail.webp",
    visualDescription: "Dedicated green cycle track running beneath giant banyan and jacaranda canopies connecting the Government Museum to the Arts College.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "boulevard-cycling-trail",
      "chandigarh-sector-10-tree-lined-boulevard-cycling-route",
      "sector",
      "sector-10",
      "sector-10-chandigarh",
      "sector-10-tree-lined-boulevard-cycling-route",
      "sector-10-tree-lined-boulevard-cycling-route-chandigarh",
      "sector-10-tree-lined-boulevard-cycling-route-of-chandigarh",
      "sector-chandigarh"
    ]
  },
  "damdama-sohna:damdama-lake-boating": {
    imageUrl: "/images/places/damdama-sohna/damdama-lake-boating.webp",
    visualDescription: "Haryana's largest natural lake basin nestled in a scenic hollow of the Aravalli hills, offering row boating, kayaking, and migratory birdwatching.",
    category: "Must Visit",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "damdama",
      "damdama-damdama-sohna",
      "damdama-lake-boating",
      "damdama-lake-natural-boating-basin",
      "damdama-natural",
      "damdama-natural-boating-basin",
      "damdama-natural-boating-basin-damdama-sohna",
      "damdama-natural-boating-basin-of-damdama-sohna",
      "damdama-natural-damdama-sohna",
      "damdama-sohna-damdama-natural-boating-basin"
    ]
  },
  "damdama-sohna:sohna-hot-springs": {
    imageUrl: "/images/places/damdama-sohna/sohna-hot-springs.webp",
    visualDescription: "Natural geothermal sulphur springs bubbling from the Aravalli rock bed since antiquity, known for therapeutic mineral baths and Shiva temple.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "ancient-shiva-kund",
      "damdama-sohna-sohna-sulphur-hot-springs-ancient-shiva-kund",
      "sohna",
      "sohna-damdama-sohna",
      "sohna-hot-springs",
      "sohna-sulphur",
      "sohna-sulphur-damdama-sohna",
      "sohna-sulphur-hot-springs",
      "sohna-sulphur-hot-springs-ancient-shiva-kund",
      "sohna-sulphur-hot-springs-ancient-shiva-kund-damdama-sohna",
      "sohna-sulphur-hot-springs-ancient-shiva-kund-of-damdama-sohna",
      "sohna-sulphur-hot-springs-and-ancient-shiva-kund"
    ]
  },
  "damdama-sohna:aravalli-bio-trails": {
    imageUrl: "/images/places/damdama-sohna/aravalli-bio-trails.webp",
    visualDescription: "Indigenous thorny scrub forest trails across rocky Aravalli ridges featuring leopards, nilgai, peacocks, and over 190 bird species.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "aravalli",
      "aravalli-bio",
      "aravalli-bio-damdama-sohna",
      "aravalli-bio-diversity-nature-trails",
      "aravalli-bio-diversity-nature-trails-damdama-sohna",
      "aravalli-bio-diversity-nature-trails-of-damdama-sohna",
      "aravalli-bio-diversity-ridge-nature-trails",
      "aravalli-bio-trails",
      "aravalli-damdama-sohna",
      "damdama-sohna-aravalli-bio-diversity-nature-trails"
    ]
  },
  "damdama-sohna:botanix-nature-resort-camp": {
    imageUrl: "/images/places/damdama-sohna/botanix-nature-resort-camp.webp",
    visualDescription: "30-acre botanical garden park at the foothills of the Aravallis featuring obstacle courses, rope climbing, pottery, and organic farm meals.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "botanix",
      "botanix-damdama-sohna",
      "botanix-nature",
      "botanix-nature-adventure-organic-farm",
      "botanix-nature-adventure-organic-farm-damdama-sohna",
      "botanix-nature-adventure-organic-farm-of-damdama-sohna",
      "botanix-nature-adventure-park",
      "botanix-nature-adventure-park-and-organic-farm",
      "botanix-nature-damdama-sohna",
      "botanix-nature-resort-camp",
      "damdama-sohna-botanix-nature-adventure-organic-farm",
      "organic-farm"
    ]
  },
  "damdama-sohna:sohna-hilltop-fort-ruins": {
    imageUrl: "/images/places/damdama-sohna/sohna-hilltop-fort-ruins.webp",
    visualDescription: "Historic Bharatpur-era fort ruins standing on the crest of the Sohna ridge offering sweeping panoramas of the Gurgaon plains.",
    category: "Hidden Gems",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "damdama-sohna-sohna-hilltop-ruins-viewpoint",
      "sohna",
      "sohna-damdama-sohna",
      "sohna-hilltop",
      "sohna-hilltop-damdama-sohna",
      "sohna-hilltop-fort-ruins",
      "sohna-hilltop-fort-ruins-and-viewpoint",
      "sohna-hilltop-ruins-viewpoint",
      "sohna-hilltop-ruins-viewpoint-damdama-sohna",
      "sohna-hilltop-ruins-viewpoint-of-damdama-sohna",
      "viewpoint"
    ]
  },
  "damdama-sohna:shiva-tourist-complex": {
    imageUrl: "/images/places/damdama-sohna/shiva-tourist-complex.webp",
    visualDescription: "Haryana Tourism landscaped gardens perched on a ridge top with stone gazebo viewpoints, children's park, and restaurant.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "damdama-sohna-shiva-tourist",
      "shiva",
      "shiva-damdama-sohna",
      "shiva-tourist",
      "shiva-tourist-complex",
      "shiva-tourist-complex-and-gardens",
      "shiva-tourist-damdama-sohna",
      "shiva-tourist-of-damdama-sohna"
    ]
  },
  "damdama-sohna:dawat-aravalli-dhaba": {
    imageUrl: "/images/places/damdama-sohna/dawat-aravalli-dhaba.webp",
    visualDescription: "Rustic open-air highway dhaba on the Sohna-Alwar corridor serving traditional Bajra Khichdi, Sarson ka Saag, and Makki ki Roti with white butter.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "damdama-sohna-dawat-e-khas-aravalli-highway",
      "dawat",
      "dawat-aravalli-dhaba",
      "dawat-damdama-sohna",
      "dawat-e",
      "dawat-e-damdama-sohna",
      "dawat-e-khas-aravalli-highway",
      "dawat-e-khas-aravalli-highway-damdama-sohna",
      "dawat-e-khas-aravalli-highway-dhaba",
      "dawat-e-khas-aravalli-highway-of-damdama-sohna"
    ]
  },
  "damdama-sohna:saras-lake-promenade": {
    imageUrl: "/images/places/damdama-sohna/saras-lake-promenade.webp",
    visualDescription: "Lakeside dining terrace offering hot snacks, tea, and outdoor seating with direct unobstructed views over the Damdama water basin.",
    category: "Cafés & Bakery",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "damdama-sohna-saras-tourist-damdama-promenade",
      "saras",
      "saras-damdama-sohna",
      "saras-lake-promenade",
      "saras-tourist",
      "saras-tourist-damdama-promenade",
      "saras-tourist-damdama-promenade-damdama-sohna",
      "saras-tourist-damdama-promenade-of-damdama-sohna",
      "saras-tourist-damdama-sohna",
      "saras-tourist-resort-damdama-promenade"
    ]
  },
  "dehradun:robbers-cave": {
    imageUrl: "/images/places/dehradun/robbers-cave.webp",
    visualDescription: "A natural 600m limestone cave formation where knee-deep subterranean icy cold water flows through narrow rock canyon walls.",
    category: "Must Visit",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dehradun-robbers-cave-guchhupani-limestone-gorge",
      "guchhupani-limestone-gorge",
      "robbers",
      "robbers-cave",
      "robbers-cave-dehradun",
      "robbers-cave-guchhupani-limestone-gorge",
      "robbers-cave-guchhupani-limestone-gorge-dehradun",
      "robbers-cave-guchhupani-limestone-gorge-of-dehradun",
      "robbers-dehradun"
    ]
  },
  "dehradun:forest-research-institute": {
    imageUrl: "/images/places/dehradun/forest-research-institute.webp",
    visualDescription: "A magnificent 450-hectare Greco-Roman colonial brick heritage complex founded in 1906, housing six specialized forestry museums and botanical gardens.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "colonial-colonnades",
      "dehradun-research-institute-colonial-colonnades",
      "forest-research-institute",
      "forest-research-institute-colonial-colonnades",
      "research",
      "research-dehradun",
      "research-institute",
      "research-institute-colonial-colonnades",
      "research-institute-colonial-colonnades-dehradun",
      "research-institute-colonial-colonnades-of-dehradun",
      "research-institute-dehradun"
    ]
  },
  "dehradun:mindrolling-monastery": {
    imageUrl: "/images/places/dehradun/mindrolling-monastery.webp",
    visualDescription: "One of the largest Tibetan Buddhist centers in India, featuring a 60m Great Stupa, gilded Buddha statues, and serene Japanese gardens.",
    category: "Culture & Heritage",
    semanticTheme: "monastery",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dehradun-mindrolling-great-stupa",
      "great-stupa",
      "mindrolling",
      "mindrolling-dehradun",
      "mindrolling-great",
      "mindrolling-great-dehradun",
      "mindrolling-great-stupa",
      "mindrolling-great-stupa-dehradun",
      "mindrolling-great-stupa-of-dehradun",
      "mindrolling-monastery",
      "mindrolling-monastery-and-great-stupa"
    ]
  },
  "dehradun:sahastradhara-springs": {
    imageUrl: "/images/places/dehradun/sahastradhara-springs.webp",
    visualDescription: "Natural sulphur water spring and stepped travertine limestone cascades along the Baddi river known for medicinal mineral properties.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dehradun-sahastradhara-thousandfold-sulphur-springs",
      "sahastradhara",
      "sahastradhara-dehradun",
      "sahastradhara-springs",
      "sahastradhara-thousandfold",
      "sahastradhara-thousandfold-dehradun",
      "sahastradhara-thousandfold-sulphur-springs",
      "sahastradhara-thousandfold-sulphur-springs-dehradun",
      "sahastradhara-thousandfold-sulphur-springs-of-dehradun"
    ]
  },
  "dehradun:tapkeshwar-temple": {
    imageUrl: "/images/places/dehradun/tapkeshwar-temple.webp",
    visualDescription: "Ancient Shiva shrine situated inside a natural river cave where water droplets continuously drip from the ceiling onto the Shivalinga.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dehradun-tapkeshwar-mahadev-cave",
      "tapkeshwar",
      "tapkeshwar-dehradun",
      "tapkeshwar-mahadev",
      "tapkeshwar-mahadev-cave",
      "tapkeshwar-mahadev-cave-dehradun",
      "tapkeshwar-mahadev-cave-of-dehradun",
      "tapkeshwar-mahadev-cave-temple",
      "tapkeshwar-mahadev-dehradun",
      "tapkeshwar-temple"
    ]
  },
  "dehradun:rajpur-road-cafes": {
    imageUrl: "/images/places/dehradun/rajpur-road-cafes.webp",
    visualDescription: "The heritage colonial stretch leading to Old Rajpur lined with independent bakeries, artisanal espresso bars, and shaded outdoor patios.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "cafés",
      "dehradun-rajpur-artisan-bakeries-cafés",
      "rajpur",
      "rajpur-artisan",
      "rajpur-artisan-bakeries-cafés",
      "rajpur-artisan-bakeries-cafés-dehradun",
      "rajpur-artisan-bakeries-cafés-of-dehradun",
      "rajpur-artisan-dehradun",
      "rajpur-dehradun",
      "rajpur-road-artisan-bakeries",
      "rajpur-road-artisan-bakeries-and-cafés",
      "rajpur-road-cafes"
    ]
  },
  "dehradun:elloras-bakery": {
    imageUrl: "/images/places/dehradun/elloras-bakery.webp",
    visualDescription: "Dehradun's legendary bakery on Rajpur Road renowned for stick jaws toffees, butter rusks, plum cakes, and signature pistachio cookies.",
    category: "Local Food",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dehradun-elloras-melting-moments-since-1953",
      "elloras",
      "elloras-bakery",
      "elloras-dehradun",
      "elloras-melting",
      "elloras-melting-dehradun",
      "elloras-melting-moments",
      "elloras-melting-moments-since-1953",
      "elloras-melting-moments-since-1953-dehradun",
      "elloras-melting-moments-since-1953-of-dehradun",
      "since-1953"
    ]
  },
  "dehradun:malsi-deer-park": {
    imageUrl: "/images/places/dehradun/malsi-deer-park.webp",
    visualDescription: "A tranquil zoological woodland park in the Shivalik foothills featuring spotted deer herds, peacocks, native birds, and walking trails.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dehradun-malsi-deer-dehradun-zoo",
      "dehradun-zoo",
      "malsi",
      "malsi-deer",
      "malsi-deer-dehradun",
      "malsi-deer-dehradun-zoo",
      "malsi-deer-dehradun-zoo-dehradun",
      "malsi-deer-dehradun-zoo-of-dehradun",
      "malsi-deer-park",
      "malsi-deer-park-dehradun-zoo",
      "malsi-dehradun"
    ]
  },
  "dharamshala:tsuglagkhang-temple": {
    imageUrl: "/images/places/dharamshala/tsuglagkhang-temple.webp",
    visualDescription: "The spiritual center of Tibetan Buddhism in exile, housing the main temple, Namgyal Monastery, Tibet Museum, and giant gilded statues.",
    category: "Must Visit",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dalai-lama-temple",
      "dharamshala-tsuglagkhang-dalai-lama",
      "tsuglagkhang",
      "tsuglagkhang-complex",
      "tsuglagkhang-complex-and-dalai-lama-temple",
      "tsuglagkhang-dalai",
      "tsuglagkhang-dalai-dharamshala",
      "tsuglagkhang-dalai-lama",
      "tsuglagkhang-dalai-lama-dharamshala",
      "tsuglagkhang-dalai-lama-of-dharamshala",
      "tsuglagkhang-dharamshala",
      "tsuglagkhang-temple"
    ]
  },
  "dharamshala:bhagsu-waterfall-shiva-cafe": {
    imageUrl: "/images/places/dharamshala/bhagsu-waterfall-shiva-cafe.webp",
    visualDescription: "A 20m mountain cascade above Bhagsu village leading up a stone-stepped mountain trail to the famous bohemian cliffside Shiva Café.",
    category: "Nature & Trails",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bhagsu",
      "bhagsu-dharamshala",
      "bhagsu-waterfall",
      "bhagsu-waterfall-and-shiva-café",
      "bhagsu-waterfall-dharamshala",
      "bhagsu-waterfall-shiva-cafe",
      "bhagsu-waterfall-shiva-café",
      "bhagsu-waterfall-shiva-café-dharamshala",
      "bhagsu-waterfall-shiva-café-of-dharamshala",
      "dharamshala-bhagsu-waterfall-shiva-café",
      "shiva-café"
    ]
  },
  "dharamshala:norbulingka-institute": {
    imageUrl: "/images/places/dharamshala/norbulingka-institute.webp",
    visualDescription: "A Japanese-inspired garden sanctuary dedicated to preserving traditional Tibetan thangka painting, woodcarving, and bronze metalwork.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dharamshala-norbulingka-institute-of-tibetan-arts",
      "norbulingka",
      "norbulingka-dharamshala",
      "norbulingka-institute",
      "norbulingka-institute-dharamshala",
      "norbulingka-institute-of-tibetan-arts",
      "norbulingka-institute-of-tibetan-arts-dharamshala",
      "norbulingka-institute-of-tibetan-arts-of-dharamshala"
    ]
  },
  "dharamshala:triund-trek-base": {
    imageUrl: "/images/places/dharamshala/triund-trek-base.webp",
    visualDescription: "The crown jewel trek of Kangra Valley, climbing through mixed oak and rhododendron forests to a 2,828m ridge under the Dhauladhars.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dharamshala-triund-alpine-trek",
      "triund",
      "triund-alpine",
      "triund-alpine-dharamshala",
      "triund-alpine-trek",
      "triund-alpine-trek-dharamshala",
      "triund-alpine-trek-of-dharamshala",
      "triund-dharamshala",
      "triund-ridge-alpine-trek-trail",
      "triund-trek-base"
    ]
  },
  "dharamshala:illiterati-cafe": {
    imageUrl: "/images/places/dharamshala/illiterati-cafe.webp",
    visualDescription: "Renowned wooden library café with floor-to-ceiling bookshelves, vintage pianos, and open balcony views of the Kangra Valley.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "coffee",
      "dharamshala-illiterati-books-coffee",
      "illiterati",
      "illiterati-books",
      "illiterati-books-and-coffee",
      "illiterati-books-coffee",
      "illiterati-books-coffee-dharamshala",
      "illiterati-books-coffee-of-dharamshala",
      "illiterati-books-dharamshala",
      "illiterati-cafe",
      "illiterati-dharamshala"
    ]
  },
  "dharamshala:st-john-wilderness": {
    imageUrl: "/images/places/dharamshala/st-john-wilderness.webp",
    visualDescription: "Neo-Gothic 1852 stone Anglican church set amidst towering deodar forests, featuring Belgian stained-glass windows and Lord Elgin's memorial.",
    category: "Culture & Heritage",
    semanticTheme: "church",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "1852",
      "dharamshala-st-john-in-wilderness-1852",
      "st-john",
      "st-john-dharamshala",
      "st-john-in-the-wilderness-church",
      "st-john-in-the-wilderness-church-1852",
      "st-john-in-wilderness-1852",
      "st-john-in-wilderness-1852-dharamshala",
      "st-john-in-wilderness-1852-of-dharamshala",
      "st-john-wilderness"
    ]
  },
  "dharamshala:tibet-kitchen": {
    imageUrl: "/images/places/dharamshala/tibet-kitchen.webp",
    visualDescription: "Popular multi-story dining institution in the central square serving authentic Tibetan Tingmo, steaming Thukpa, Shaphaley, and Butter Tea.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dharamshala-tibet-traditional-momos-thukpa",
      "thukpa",
      "tibet",
      "tibet-dharamshala",
      "tibet-kitchen",
      "tibet-kitchen-traditional-momos-and-thukpa",
      "tibet-traditional",
      "tibet-traditional-dharamshala",
      "tibet-traditional-momos-thukpa",
      "tibet-traditional-momos-thukpa-dharamshala",
      "tibet-traditional-momos-thukpa-of-dharamshala",
      "traditional-momos"
    ]
  },
  "dharamshala:dharamkot-village": {
    imageUrl: "/images/places/dharamshala/dharamkot-village.webp",
    visualDescription: "Quiet hilltop hamlet above McLeod Ganj known as the yoga haven of Himachal, featuring silent meditation centers and organic vegan cafés.",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dharamkot",
      "dharamkot-dharamshala",
      "dharamkot-village",
      "dharamkot-yoga",
      "dharamkot-yoga-and-meditation-village",
      "dharamkot-yoga-dharamshala",
      "dharamkot-yoga-meditation",
      "dharamkot-yoga-meditation-dharamshala",
      "dharamkot-yoga-meditation-of-dharamshala",
      "dharamshala-dharamkot-yoga-meditation",
      "meditation-village"
    ]
  },
  "goa:chapora-fort": {
    imageUrl: "/images/places/goa/chapora-fort.webp",
    visualDescription: "Historic red laterite fort overlooking the dramatic confluence of Chapora River and the Arabian Sea with vast ocean vistas.",
    category: "Must Visit",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chapora",
      "chapora-fort",
      "chapora-fort-hilltop-viewpoint",
      "chapora-goa",
      "chapora-hilltop",
      "chapora-hilltop-goa",
      "chapora-hilltop-viewpoint",
      "chapora-hilltop-viewpoint-goa",
      "chapora-hilltop-viewpoint-of-goa",
      "goa-chapora-hilltop-viewpoint"
    ]
  },
  "goa:fontainhas-latin-quarter": {
    imageUrl: "/images/places/goa/fontainhas-latin-quarter.webp",
    visualDescription: "Asia's only preserved Portuguese Latin Quarter featuring pastel-painted heritage villas, azulejo tile work, and quiet bakeries.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "fontainhas",
      "fontainhas-goa",
      "fontainhas-heritage-latin-quarter",
      "fontainhas-latin",
      "fontainhas-latin-goa",
      "fontainhas-latin-quarter",
      "fontainhas-latin-quarter-goa",
      "fontainhas-latin-quarter-of-goa",
      "goa-fontainhas-latin-quarter"
    ]
  },
  "goa:divar-island": {
    imageUrl: "/images/places/goa/divar-island.webp",
    visualDescription: "A tranquil river island reached via a traditional wooden ferry, famous for emerald paddy fields, ancient churches, and serene cycling routes.",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "backwaters",
      "divar",
      "divar-goa",
      "divar-island",
      "divar-island-ferry-backwaters",
      "divar-island-ferry-backwaters-goa",
      "divar-island-ferry-backwaters-of-goa",
      "divar-island-goa",
      "divar-island-village-ferry",
      "divar-island-village-ferry-and-backwaters",
      "goa-divar-island-ferry-backwaters"
    ]
  },
  "goa:ashwem-beach": {
    imageUrl: "/images/places/goa/ashwem-beach.webp",
    visualDescription: "Wide, white sandy beach lined with casuarina groves and calm shallow waters, ideal for quiet swims and tranquil seaside reading.",
    category: "Nature & Trails",
    semanticTheme: "beach",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "ashwem",
      "ashwem-beach",
      "ashwem-beach-casuarina-pines",
      "ashwem-casuarina",
      "ashwem-casuarina-goa",
      "ashwem-casuarina-pines",
      "ashwem-casuarina-pines-goa",
      "ashwem-casuarina-pines-of-goa",
      "ashwem-goa",
      "goa-ashwem-casuarina-pines"
    ]
  },
  "goa:anjuna-flea-market": {
    imageUrl: "/images/places/goa/anjuna-flea-market.webp",
    visualDescription: "Bohemian open-air bazaar beneath the palm trees featuring handcrafted silver jewelry, spice sacks, indie artwork, and live musicians.",
    category: "Markets & Craft",
    semanticTheme: "shopping",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "anjuna",
      "anjuna-flea",
      "anjuna-flea-and-night-art-market",
      "anjuna-flea-goa",
      "anjuna-flea-market",
      "anjuna-flea-night-art",
      "anjuna-flea-night-art-goa",
      "anjuna-flea-night-art-of-goa",
      "anjuna-goa",
      "goa-anjuna-flea-night-art",
      "night-art-market"
    ]
  },
  "goa:dudhsagar-falls": {
    imageUrl: "/images/places/goa/dudhsagar-falls.webp",
    visualDescription: "A magnificent four-tiered 310m milky white waterfall inside Bhagwan Mahavir Wildlife Sanctuary with scenic rail bridge views.",
    category: "Adventure & Treks",
    semanticTheme: "waterfall",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dudhsagar",
      "dudhsagar-falls",
      "dudhsagar-goa",
      "dudhsagar-waterfall",
      "dudhsagar-waterfall-goa",
      "dudhsagar-waterfall-jungle-trek",
      "dudhsagar-waterfall-jungle-trek-goa",
      "dudhsagar-waterfall-jungle-trek-of-goa",
      "goa-dudhsagar-waterfall-jungle-trek"
    ]
  },
  "goa:artjuna-cafe": {
    imageUrl: "/images/places/goa/artjuna-cafe.webp",
    visualDescription: "Open-air garden sanctuary set under mango trees, serving artisanal cold brews, tahini salads, fresh sourdough, and house smoothies.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "artjuna",
      "artjuna-cafe",
      "artjuna-goa",
      "artjuna-lifestyle",
      "artjuna-lifestyle-café",
      "artjuna-lifestyle-café-goa",
      "artjuna-lifestyle-café-of-goa",
      "artjuna-lifestyle-garden-café",
      "artjuna-lifestyle-goa",
      "goa-artjuna-lifestyle-café"
    ]
  },
  "goa:vinayak-family-restaurant": {
    imageUrl: "/images/places/goa/vinayak-family-restaurant.webp",
    visualDescription: "Legendary village restaurant overlooking emerald fields, serving authentic freshly caught kingfish thalis, prawn curry, and sol kadi.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "authentic-goan-fish-thali",
      "goa-vinayak-family-restaurant-authentic-goan-fish-thali",
      "vinayak",
      "vinayak-family",
      "vinayak-family-goa",
      "vinayak-family-restaurant",
      "vinayak-family-restaurant-authentic-goan-fish-thali",
      "vinayak-family-restaurant-authentic-goan-fish-thali-goa",
      "vinayak-family-restaurant-authentic-goan-fish-thali-of-goa",
      "vinayak-goa"
    ]
  },
  "jaipur:amber-fort": {
    imageUrl: "/images/places/jaipur/amber-fort.webp",
    visualDescription: "Majestic hilltop fort built of red sandstone and marble featuring the famous Mirror Palace and expansive courtyard ramparts.",
    category: "Must Visit",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "amber",
      "amber-fort",
      "amber-fort-and-sheesh-mahal",
      "amber-jaipur",
      "amber-sheesh",
      "amber-sheesh-jaipur",
      "amber-sheesh-mahal",
      "amber-sheesh-mahal-jaipur",
      "amber-sheesh-mahal-of-jaipur",
      "jaipur-amber-sheesh-mahal",
      "sheesh-mahal"
    ]
  },
  "jaipur:hawa-mahal": {
    imageUrl: "/images/places/jaipur/hawa-mahal.webp",
    visualDescription: "Iconic five-story pink and red sandstone palace featuring 953 intricately carved jharokhas designed for royal court breezes.",
    category: "Must Visit",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "hawa",
      "hawa-jaipur",
      "hawa-mahal",
      "hawa-mahal-jaipur",
      "hawa-mahal-of-winds",
      "hawa-mahal-of-winds-jaipur",
      "hawa-mahal-of-winds-of-jaipur",
      "hawa-mahal-palace-of-winds",
      "jaipur-hawa-mahal-of-winds",
      "palace-of-winds"
    ]
  },
  "jaipur:nahargarh-fort-sunset": {
    imageUrl: "/images/places/jaipur/nahargarh-fort-sunset.webp",
    visualDescription: "Perched on the edge of the Aravalli hills, offering the most dramatic panoramic sunset viewpoint overlooking the entire Pink City.",
    category: "Nature & Trails",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "nahargarh",
      "nahargarh-fort-sunset",
      "nahargarh-fort-sunset-ridge",
      "nahargarh-jaipur"
    ]
  },
  "jaipur:panna-meena-kund": {
    imageUrl: "/images/places/jaipur/panna-meena-kund.webp",
    visualDescription: "An exquisite 16th-century geometric stepwell with interlocking symmetrical staircases and octagonal gazebos near Amer.",
    category: "Hidden Gems",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jaipur-panna-meena-ka-kund-stepwell",
      "panna",
      "panna-jaipur",
      "panna-meena",
      "panna-meena-jaipur",
      "panna-meena-ka-kund-stepwell",
      "panna-meena-ka-kund-stepwell-jaipur",
      "panna-meena-ka-kund-stepwell-of-jaipur",
      "panna-meena-kund"
    ]
  },
  "jaipur:city-palace-jaipur": {
    imageUrl: "/images/places/jaipur/city-palace-jaipur.webp",
    visualDescription: "The regal heart of Jaipur featuring courtyards, Peacock Gate mosaics, royal textile museums, and royal Rajput heritage.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chandra-mahal",
      "city-palace",
      "city-palace-jaipur",
      "jaipur",
      "jaipur-chandra",
      "jaipur-chandra-jaipur",
      "jaipur-chandra-mahal",
      "jaipur-chandra-mahal-jaipur",
      "jaipur-chandra-mahal-of-jaipur",
      "jaipur-city-palace",
      "jaipur-city-palace-and-chandra-mahal",
      "jaipur-jaipur",
      "jaipur-jaipur-chandra-mahal"
    ]
  },
  "jaipur:lmb-sweets": {
    imageUrl: "/images/places/jaipur/lmb-sweets.webp",
    visualDescription: "Historic Johari Bazaar institution famous for crisp Pyaz Kachoris, Paneer Ghewar, Royal Rajasthani Thalis, and Mawa Kachori.",
    category: "Local Food",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jaipur-laxmi-misthan-bhandar-lmb-1727",
      "laxmi",
      "laxmi-jaipur",
      "laxmi-misthan",
      "laxmi-misthan-bhandar",
      "laxmi-misthan-bhandar-lmb-1727",
      "laxmi-misthan-bhandar-lmb-1727-jaipur",
      "laxmi-misthan-bhandar-lmb-1727-of-jaipur",
      "laxmi-misthan-jaipur",
      "lmb-1727",
      "lmb-sweets"
    ]
  },
  "jaipur:anokhi-museum": {
    imageUrl: "/images/places/jaipur/anokhi-museum.webp",
    visualDescription: "Restored 16th-century stone haveli dedicated to the traditional art of Rajasthani woodblock hand printing with live artisan demos.",
    category: "Markets & Craft",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "anokhi",
      "anokhi-jaipur",
      "anokhi-museum",
      "anokhi-museum-jaipur",
      "anokhi-museum-of-hand-printing",
      "anokhi-museum-of-hand-printing-jaipur",
      "anokhi-museum-of-hand-printing-of-jaipur",
      "jaipur-anokhi-museum-of-hand-printing"
    ]
  },
  "jaipur:tapri-central": {
    imageUrl: "/images/places/jaipur/tapri-central.webp",
    visualDescription: "Beloved rooftop tea salon overlooking Central Park, serving artisanal Masala Chai in clay kulhads, Bun Maska, and hand-rolled snacks.",
    category: "Cafés & Bakery",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jaipur-tapri-central-rooftop-tea",
      "tapri",
      "tapri-central",
      "tapri-central-jaipur",
      "tapri-central-rooftop-tea",
      "tapri-central-rooftop-tea-jaipur",
      "tapri-central-rooftop-tea-lounge",
      "tapri-central-rooftop-tea-of-jaipur",
      "tapri-jaipur"
    ]
  },
  "jaisalmer:jaisalmer-fort": {
    imageUrl: "/images/places/jaisalmer/jaisalmer-fort.webp",
    visualDescription: "One of the world's few living forts, housing over 4,000 residents inside its 12th-century yellow sandstone ramparts, palaces, and Jain temples.",
    category: "Must Visit",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jaisalmer",
      "jaisalmer-fort",
      "jaisalmer-golden",
      "jaisalmer-golden-jaisalmer",
      "jaisalmer-golden-living-fort",
      "jaisalmer-golden-living-fort-sonar-qila",
      "jaisalmer-golden-living-sonar-qila",
      "jaisalmer-golden-living-sonar-qila-jaisalmer",
      "jaisalmer-golden-living-sonar-qila-of-jaisalmer",
      "jaisalmer-jaisalmer",
      "jaisalmer-jaisalmer-golden-living-sonar-qila",
      "sonar-qila"
    ]
  },
  "jaisalmer:patwon-ki-haveli": {
    imageUrl: "/images/places/jaisalmer/patwon-ki-haveli.webp",
    visualDescription: "A cluster of five palatial 19th-century merchant havelis featuring over 60 exquisitely carved sandstone jharokha balconies.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jaisalmer-patwon-ki-haveli-filigree-architecture",
      "patwon",
      "patwon-jaisalmer",
      "patwon-ki",
      "patwon-ki-haveli",
      "patwon-ki-haveli-filigree-architecture",
      "patwon-ki-haveli-filigree-architecture-jaisalmer",
      "patwon-ki-haveli-filigree-architecture-of-jaisalmer",
      "patwon-ki-jaisalmer"
    ]
  },
  "jaisalmer:sam-sand-dunes": {
    imageUrl: "/images/places/jaisalmer/sam-sand-dunes.webp",
    visualDescription: "Expansive golden sand dunes in the Thar Desert offering camel safaris, 4x4 dune bashing, and authentic Rajasthani folk dance under the stars.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jaisalmer-sam-sand-dunes-thar-desert-safari",
      "sam-sand",
      "sam-sand-dunes",
      "sam-sand-dunes-and-thar-desert-safari",
      "sam-sand-dunes-thar-desert-safari",
      "sam-sand-dunes-thar-desert-safari-jaisalmer",
      "sam-sand-dunes-thar-desert-safari-of-jaisalmer",
      "sam-sand-jaisalmer",
      "thar-desert-safari"
    ]
  },
  "jaisalmer:gadisar-lake": {
    imageUrl: "/images/places/jaisalmer/gadisar-lake.webp",
    visualDescription: "Historic 14th-century rainwater reservoir surrounded by ornate sandstone shrines, ghats, and the graceful Tilon Ki Pol gateway.",
    category: "Nature & Trails",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chattris",
      "gadisar",
      "gadisar-ghats",
      "gadisar-ghats-chattris",
      "gadisar-ghats-chattris-jaisalmer",
      "gadisar-ghats-chattris-of-jaisalmer",
      "gadisar-ghats-jaisalmer",
      "gadisar-jaisalmer",
      "gadisar-lake",
      "gadisar-lake-ghats",
      "gadisar-lake-ghats-and-chattris",
      "jaisalmer-gadisar-ghats-chattris"
    ]
  },
  "jaisalmer:kuldhara-abandoned-village": {
    imageUrl: "/images/places/jaisalmer/kuldhara-abandoned-village.webp",
    visualDescription: "An eerie 13th-century Paliwal Brahmin settlement abandoned overnight in the 1800s, preserved in silent sandstone ruin in the Thar.",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jaisalmer-kuldhara-abandoned-ghost",
      "kuldhara",
      "kuldhara-abandoned",
      "kuldhara-abandoned-ghost",
      "kuldhara-abandoned-ghost-jaisalmer",
      "kuldhara-abandoned-ghost-of-jaisalmer",
      "kuldhara-abandoned-ghost-village",
      "kuldhara-abandoned-jaisalmer",
      "kuldhara-abandoned-village",
      "kuldhara-jaisalmer"
    ]
  },
  "jaisalmer:jain-temples-fort": {
    imageUrl: "/images/places/jaisalmer/jain-temples-fort.webp",
    visualDescription: "Interconnected group of 15th-century yellow sandstone Jain shrines renowned for breathtaking marble idols and ornate ceiling carvings.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jain-temples-fort",
      "jaisalmer",
      "jaisalmer-fort-seven-jain-temples",
      "jaisalmer-jaisalmer",
      "jaisalmer-jaisalmer-seven-jain-temples",
      "jaisalmer-seven",
      "jaisalmer-seven-jain-temples",
      "jaisalmer-seven-jain-temples-jaisalmer",
      "jaisalmer-seven-jain-temples-of-jaisalmer",
      "jaisalmer-seven-jaisalmer"
    ]
  },
  "jaisalmer:the-trio-restaurant": {
    imageUrl: "/images/places/jaisalmer/the-trio-restaurant.webp",
    visualDescription: "Celebrated tented rooftop restaurant overlooking Mandi Chowk, famous for authentic slow-cooked Laal Maas, Ker Sangri, and Gatta Curry.",
    category: "Local Food",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "authentic-laal-maas",
      "jaisalmer-trio-rooftop-authentic-laal-maas",
      "the-trio-restaurant",
      "the-trio-rooftop",
      "the-trio-rooftop-authentic-laal-maas",
      "trio",
      "trio-jaisalmer",
      "trio-rooftop",
      "trio-rooftop-authentic-laal-maas",
      "trio-rooftop-authentic-laal-maas-jaisalmer",
      "trio-rooftop-authentic-laal-maas-of-jaisalmer",
      "trio-rooftop-jaisalmer"
    ]
  },
  "jaisalmer:salim-singh-ki-haveli": {
    imageUrl: "/images/places/jaisalmer/salim-singh-ki-haveli.webp",
    visualDescription: "Distinctive 300-year-old mansion with a narrow stone base expanding into a top floor modeled like a dancing peacock with 38 carved balconies.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jaisalmer-salim-singh-ki-haveli-moti-mahal",
      "moti-mahal",
      "salim",
      "salim-jaisalmer",
      "salim-singh",
      "salim-singh-jaisalmer",
      "salim-singh-ki-haveli",
      "salim-singh-ki-haveli-moti-mahal",
      "salim-singh-ki-haveli-moti-mahal-jaisalmer",
      "salim-singh-ki-haveli-moti-mahal-of-jaisalmer"
    ]
  },
  "kainchi-dham:neem-karoli-baba-ashram": {
    imageUrl: "/images/places/kainchi-dham/neem-karoli-baba-ashram.webp",
    visualDescription: "Spiritual hermitage founded in 1962 by Neem Karoli Baba Maharaj-ji, visited by global seekers for meditation, Hanuman chalisa, and prasad.",
    category: "Must Visit",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kainchi-dham-neem-karoli-baba-sacred-ashram",
      "neem",
      "neem-kainchi-dham",
      "neem-karoli",
      "neem-karoli-baba-ashram",
      "neem-karoli-baba-sacred-ashram",
      "neem-karoli-baba-sacred-ashram-and-temple",
      "neem-karoli-baba-sacred-ashram-kainchi-dham",
      "neem-karoli-baba-sacred-ashram-of-kainchi-dham",
      "neem-karoli-kainchi-dham"
    ]
  },
  "kainchi-dham:bhowali-fruit-orchards": {
    imageUrl: "/images/places/kainchi-dham/bhowali-fruit-orchards.webp",
    visualDescription: "The fruit basket of Kumaon famous for juicy Himalayan apples, apricots, plums, hill strawberries, and Shyamkhet tea gardens.",
    category: "Nature & Trails",
    semanticTheme: "shopping",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bhowali",
      "bhowali-fruit",
      "bhowali-fruit-kainchi-dham",
      "bhowali-fruit-market",
      "bhowali-fruit-market-and-tea-terraces",
      "bhowali-fruit-orchards",
      "bhowali-fruit-tea-terraces",
      "bhowali-fruit-tea-terraces-kainchi-dham",
      "bhowali-fruit-tea-terraces-of-kainchi-dham",
      "bhowali-kainchi-dham",
      "kainchi-dham-bhowali-fruit-tea-terraces",
      "tea-terraces"
    ]
  },
  "kainchi-dham:golu-devta-ghorakhal": {
    imageUrl: "/images/places/kainchi-dham/golu-devta-ghorakhal.webp",
    visualDescription: "Historic shrine dedicated to the Kumaoni God of Justice, famous for thousands of brass bells hung by devotees whose prayers were answered.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "golu",
      "golu-devta",
      "golu-devta-ghorakhal",
      "golu-devta-ghorakhal-of-bells",
      "golu-devta-ghorakhal-of-bells-kainchi-dham",
      "golu-devta-ghorakhal-of-bells-of-kainchi-dham",
      "golu-devta-kainchi-dham",
      "golu-devta-temple-ghorakhal",
      "golu-devta-temple-ghorakhal-temple-of-bells",
      "golu-kainchi-dham",
      "kainchi-dham-golu-devta-ghorakhal-of-bells",
      "temple-of-bells"
    ]
  },
  "kainchi-dham:bhimtal-island-lake": {
    imageUrl: "/images/places/kainchi-dham/bhimtal-island-lake.webp",
    visualDescription: "Picturesque C-shaped lake larger than Naini Lake, featuring a central island aquarium accessible via traditional wooden rowing boats.",
    category: "Nature & Trails",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bhimtal",
      "bhimtal-central",
      "bhimtal-central-aquarium-island",
      "bhimtal-central-aquarium-island-kainchi-dham",
      "bhimtal-central-aquarium-island-of-kainchi-dham",
      "bhimtal-central-kainchi-dham",
      "bhimtal-island-lake",
      "bhimtal-kainchi-dham",
      "bhimtal-lake",
      "bhimtal-lake-and-central-aquarium-island",
      "central-aquarium-island",
      "kainchi-dham-bhimtal-central-aquarium-island"
    ]
  },
  "kainchi-dham:sattal-interconnected-lakes": {
    imageUrl: "/images/places/kainchi-dham/sattal-interconnected-lakes.webp",
    visualDescription: "An unspoiled cluster of seven interconnected freshwater lakes nestled in dense oak and pine forests, celebrated for birdwatching and kayaking.",
    category: "Hidden Gems",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kainchi-dham-sattal-seven-interconnected-freshwater-lakes",
      "sattal",
      "sattal-interconnected-lakes",
      "sattal-kainchi-dham",
      "sattal-seven",
      "sattal-seven-interconnected-freshwater-lakes",
      "sattal-seven-interconnected-freshwater-lakes-kainchi-dham",
      "sattal-seven-interconnected-freshwater-lakes-of-kainchi-dham",
      "sattal-seven-kainchi-dham"
    ]
  },
  "kainchi-dham:subhash-dhaba-bhowali": {
    imageUrl: "/images/places/kainchi-dham/subhash-dhaba-bhowali.webp",
    visualDescription: "Famed local roadside eatery serving authentic Bhatt ki Churkani (black bean curry), Aloo ke Gutke, Rai ka Raita, and Kumaoni Singori sweets.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kainchi-dham-subhash-traditional-kumaoni-ras-bhaat",
      "subhash",
      "subhash-dhaba",
      "subhash-dhaba-bhowali",
      "subhash-dhaba-traditional-kumaoni-ras-bhaat",
      "subhash-kainchi-dham",
      "subhash-traditional",
      "subhash-traditional-kainchi-dham",
      "subhash-traditional-kumaoni-ras-bhaat",
      "subhash-traditional-kumaoni-ras-bhaat-kainchi-dham",
      "subhash-traditional-kumaoni-ras-bhaat-of-kainchi-dham",
      "traditional-kumaoni-ras-bhaat"
    ]
  },
  "kainchi-dham:naukuchiatal-lake": {
    imageUrl: "/images/places/kainchi-dham/naukuchiatal-lake.webp",
    visualDescription: "Deep nine-cornered mountain lake famous for paragliding over pine ridges, quiet pedal boating, and tranquil lotus ponds.",
    category: "Adventure & Treks",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kainchi-dham-naukuchiatal-nine-cornered",
      "naukuchiatal",
      "naukuchiatal-kainchi-dham",
      "naukuchiatal-lake",
      "naukuchiatal-nine",
      "naukuchiatal-nine-cornered",
      "naukuchiatal-nine-cornered-kainchi-dham",
      "naukuchiatal-nine-cornered-lake",
      "naukuchiatal-nine-cornered-of-kainchi-dham",
      "naukuchiatal-nine-kainchi-dham",
      "nine-cornered-lake"
    ]
  },
  "kainchi-dham:shyamkhet-tea-estate": {
    imageUrl: "/images/places/kainchi-dham/shyamkhet-tea-estate.webp",
    visualDescription: "Boutique tea plantation producing organic Himalayan orthodox green and black teas, with an open tea tasting lounge overlooking the slopes.",
    category: "Cafés & Bakery",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kainchi-dham-shyamkhet-organic-tea",
      "shyamkhet",
      "shyamkhet-kainchi-dham",
      "shyamkhet-organic",
      "shyamkhet-organic-kainchi-dham",
      "shyamkhet-organic-tea",
      "shyamkhet-organic-tea-garden-walk",
      "shyamkhet-organic-tea-kainchi-dham",
      "shyamkhet-organic-tea-of-kainchi-dham",
      "shyamkhet-tea-estate"
    ]
  },
  "kasol:chalal-pine-trail": {
    imageUrl: "/images/places/kasol/chalal-pine-trail.webp",
    visualDescription: "Scenic 2 km walking trail from Kasol suspension bridge through dense deodar forests alongside the turquoise Parvati River.",
    category: "Must Visit",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chalal",
      "chalal-kasol",
      "chalal-pine",
      "chalal-pine-kasol",
      "chalal-pine-of-kasol",
      "chalal-pine-trail",
      "chalal-riverside-pine-trail",
      "kasol-chalal-pine"
    ]
  },
  "kasol:manikaran-sahib-gurudwara": {
    imageUrl: "/images/places/kasol/manikaran-sahib-gurudwara.webp",
    visualDescription: "Sacred pilgrimage center where boiling geothermal springs power massive community langar kitchens on the banks of Parvati River.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "hot-springs",
      "kasol-manikaran-sahib-gurudwara-hot-springs",
      "manikaran",
      "manikaran-kasol",
      "manikaran-sahib",
      "manikaran-sahib-gurudwara",
      "manikaran-sahib-gurudwara-and-hot-springs",
      "manikaran-sahib-gurudwara-hot-springs",
      "manikaran-sahib-gurudwara-hot-springs-kasol",
      "manikaran-sahib-gurudwara-hot-springs-of-kasol",
      "manikaran-sahib-kasol"
    ]
  },
  "kasol:tosh-village": {
    imageUrl: "/images/places/kasol/tosh-village.webp",
    visualDescription: "Rustic wooden Himalayan village perched at 2,400m overlooking snow-clad peaks, waterfalls, and steep tiered apple orchards.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kasol-tosh-apple-orchard",
      "tosh",
      "tosh-apple",
      "tosh-apple-kasol",
      "tosh-apple-orchard",
      "tosh-apple-orchard-kasol",
      "tosh-apple-orchard-of-kasol",
      "tosh-kasol",
      "tosh-village",
      "tosh-village-apple-orchard-ridge"
    ]
  },
  "kasol:moon-dance-cafe": {
    imageUrl: "/images/places/kasol/moon-dance-cafe.webp",
    visualDescription: "Kasol's iconic culinary hub since the 1990s, famous for cinnamon rolls, fresh hummus platters, shakshuka, and wood-fired pizzas.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "german-bakery",
      "kasol-moon-dance-café-german-bakery",
      "moon",
      "moon-dance",
      "moon-dance-cafe",
      "moon-dance-café",
      "moon-dance-café-and-german-bakery",
      "moon-dance-café-german-bakery",
      "moon-dance-café-german-bakery-kasol",
      "moon-dance-café-german-bakery-of-kasol",
      "moon-dance-kasol",
      "moon-kasol"
    ]
  },
  "kasol:grahan-village-trek": {
    imageUrl: "/images/places/kasol/grahan-village-trek.webp",
    visualDescription: "An offbeat 8 km trek through pine canopies and rushing stream bridges to a traditional Himachali village with no motor road.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "grahan",
      "grahan-kasol",
      "grahan-trek",
      "grahan-trek-kasol",
      "grahan-trek-of-kasol",
      "grahan-village-heritage-trek",
      "grahan-village-trek",
      "kasol-grahan-trek"
    ]
  },
  "kasol:evergreen-cafe": {
    imageUrl: "/images/places/kasol/evergreen-cafe.webp",
    visualDescription: "Bohemian open garden restaurant serving legendary wood-fired laffa wraps, falafel platters, lamb schnitzel, and ginger mint tea.",
    category: "Local Food",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "evergreen",
      "evergreen-cafe",
      "evergreen-café",
      "evergreen-café-and-garden-lounge",
      "evergreen-café-kasol",
      "evergreen-café-of-kasol",
      "evergreen-kasol",
      "garden-lounge",
      "kasol-evergreen-café"
    ]
  },
  "kasol:nature-park-kasol": {
    imageUrl: "/images/places/kasol/nature-park-kasol.webp",
    visualDescription: "Protected riverbank forest park with wooden bridges, large river boulders, and shaded paths directly alongside the gushing Parvati.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kasol",
      "kasol-kasol",
      "kasol-kasol-nature-pine",
      "kasol-nature",
      "kasol-nature-kasol",
      "kasol-nature-park-pine-walk",
      "kasol-nature-pine",
      "kasol-nature-pine-kasol",
      "kasol-nature-pine-of-kasol",
      "nature-park",
      "nature-park-kasol"
    ]
  },
  "kasol:malana-village-gate": {
    imageUrl: "/images/places/kasol/malana-village-gate.webp",
    visualDescription: "Ancient autonomous mountain village known as the oldest surviving democracy in the world, with distinct customs and Kanashi language.",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kasol-malana-ancient-approach",
      "malana",
      "malana-ancient",
      "malana-ancient-approach",
      "malana-ancient-approach-kasol",
      "malana-ancient-approach-of-kasol",
      "malana-ancient-kasol",
      "malana-kasol",
      "malana-village-ancient-approach-trail",
      "malana-village-gate"
    ]
  },
  "lansdowne:tip-in-top-viewpoint": {
    imageUrl: "/images/places/lansdowne/tip-in-top-viewpoint.webp",
    visualDescription: "Scenic hilltop ridge at 1,700m surrounded by oak and pine forests, offering sweeping panoramic views of snow-capped Chaukhamba and Trishul peaks.",
    category: "Must Visit",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "lansdowne-tip-in-top-tiffin-top-snow-crest",
      "snow-crest-ridge",
      "tiffin-top",
      "tip-in",
      "tip-in-lansdowne",
      "tip-in-top",
      "tip-in-top-tiffin-top-snow-crest",
      "tip-in-top-tiffin-top-snow-crest-lansdowne",
      "tip-in-top-tiffin-top-snow-crest-of-lansdowne",
      "tip-in-top-tiffin-top-snow-crest-ridge",
      "tip-in-top-viewpoint"
    ]
  },
  "lansdowne:bhulla-tal-lake": {
    imageUrl: "/images/places/lansdowne/bhulla-tal-lake.webp",
    visualDescription: "Immaculately maintained artificial lake built by the Garhwal Rifles in memory of soldier martyrs, featuring pedal boating and bamboo bridges.",
    category: "Must Visit",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bhulla",
      "bhulla-lansdowne",
      "bhulla-tal",
      "bhulla-tal-lake",
      "bhulla-tal-lake-and-pine-promenade",
      "bhulla-tal-lansdowne",
      "bhulla-tal-pine-promenade",
      "bhulla-tal-pine-promenade-lansdowne",
      "bhulla-tal-pine-promenade-of-lansdowne",
      "lansdowne-bhulla-tal-pine-promenade",
      "pine-promenade"
    ]
  },
  "lansdowne:st-johns-church-1936": {
    imageUrl: "/images/places/lansdowne/st-johns-church-1936.webp",
    visualDescription: "Historic colonial stone church established in 1936 along the Mall Road, surrounded by towering blue pines and colonial walking trails.",
    category: "Culture & Heritage",
    semanticTheme: "church",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "1936",
      "lansdowne-st-johns-catholic-1936",
      "st-johns",
      "st-johns-catholic-1936",
      "st-johns-catholic-1936-lansdowne",
      "st-johns-catholic-1936-of-lansdowne",
      "st-johns-catholic-church",
      "st-johns-catholic-church-1936",
      "st-johns-church-1936",
      "st-johns-lansdowne"
    ]
  },
  "lansdowne:garhwal-rifles-museum": {
    imageUrl: "/images/places/lansdowne/garhwal-rifles-museum.webp",
    visualDescription: "Historical military museum commemorating the valor of the Garhwal Rifles since 1887, exhibiting Victoria Crosses, war trophies, and uniforms.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "darwan",
      "darwan-lansdowne",
      "darwan-singh",
      "darwan-singh-lansdowne",
      "darwan-singh-regimental-museum",
      "darwan-singh-regimental-museum-lansdowne",
      "darwan-singh-regimental-museum-of-lansdowne",
      "garhwal-rifles-museum",
      "lansdowne-darwan-singh-regimental-museum"
    ]
  },
  "lansdowne:bhim-pakora-stones": {
    imageUrl: "/images/places/lansdowne/bhim-pakora-stones.webp",
    visualDescription: "A natural geological curiosity of two massive stone boulders perched on top of each other that can be moved with a single finger without falling.",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bhim",
      "bhim-lansdowne",
      "bhim-pakora",
      "bhim-pakora-balancing-stone-wonder",
      "bhim-pakora-balancing-stone-wonder-lansdowne",
      "bhim-pakora-balancing-stone-wonder-of-lansdowne",
      "bhim-pakora-lansdowne",
      "bhim-pakora-stones",
      "lansdowne-bhim-pakora-balancing-stone-wonder"
    ]
  },
  "lansdowne:hawaghar-pine-walk": {
    imageUrl: "/images/places/lansdowne/hawaghar-pine-walk.webp",
    visualDescription: "A scenic mountain pass overlooking the snow-covered peaks of the northern Garhwal range, ideal for morning walks and birdwatching.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "hawaghar",
      "hawaghar-lansdowne",
      "hawaghar-pine",
      "hawaghar-pine-forest-ridge-promenade",
      "hawaghar-pine-lansdowne",
      "hawaghar-pine-promenade",
      "hawaghar-pine-promenade-lansdowne",
      "hawaghar-pine-promenade-of-lansdowne",
      "hawaghar-pine-walk",
      "lansdowne-hawaghar-pine-promenade"
    ]
  },
  "lansdowne:lansdowne-tripund-cafe": {
    imageUrl: "/images/places/lansdowne/lansdowne-tripund-cafe.webp",
    visualDescription: "Rustic wooden café serving freshly brewed Kumaon filter coffee, apple cinnamon cake, grilled sandwiches, and mountain herbal tea.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bakery",
      "lansdowne",
      "lansdowne-hills",
      "lansdowne-hills-colonial-café",
      "lansdowne-hills-colonial-café-and-bakery",
      "lansdowne-hills-colonial-café-bakery",
      "lansdowne-hills-colonial-café-bakery-lansdowne",
      "lansdowne-hills-colonial-café-bakery-of-lansdowne",
      "lansdowne-hills-lansdowne",
      "lansdowne-lansdowne",
      "lansdowne-lansdowne-hills-colonial-café-bakery",
      "lansdowne-tripund-cafe",
      "tripund-cafe"
    ]
  },
  "lansdowne:kalagarh-tiger-gateway": {
    imageUrl: "/images/places/lansdowne/kalagarh-tiger-gateway.webp",
    visualDescription: "The northern buffer zone of Corbett Tiger Reserve accessible from Lansdowne, featuring dense sal forests, wild Asian elephants, and tigers.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kalagarh",
      "kalagarh-lansdowne",
      "kalagarh-tiger",
      "kalagarh-tiger-gateway",
      "kalagarh-tiger-lansdowne",
      "kalagarh-tiger-reserve-northern",
      "kalagarh-tiger-reserve-northern-gate",
      "kalagarh-tiger-reserve-northern-lansdowne",
      "kalagarh-tiger-reserve-northern-of-lansdowne",
      "lansdowne-kalagarh-tiger-reserve-northern"
    ]
  },
  "leh:leh-palace": {
    imageUrl: "/images/places/leh/leh-palace.webp",
    visualDescription: "Nine-story royal palace built by King Sengge Namgyal overlooking the Old Town of Leh and the snow-capped Stok Kangri range.",
    category: "Must Visit",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "leh-17th",
      "leh-17th-century-fortress",
      "leh-17th-century-fortress-leh",
      "leh-17th-century-fortress-of-leh",
      "leh-17th-leh",
      "leh-leh-17th-century-fortress",
      "leh-palace",
      "leh-palace-17th-century-fortress"
    ]
  },
  "leh:shanti-stupa": {
    imageUrl: "/images/places/leh/shanti-stupa.webp",
    visualDescription: "White-domed Buddhist stupa atop Changspa ridge holding relics of the Buddha, famous for golden hour mountain panoramas.",
    category: "Must Visit",
    semanticTheme: "monastery",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "leh-shanti-stupa-white-peace-pagoda",
      "shanti",
      "shanti-leh",
      "shanti-stupa",
      "shanti-stupa-leh",
      "shanti-stupa-white-peace-pagoda",
      "shanti-stupa-white-peace-pagoda-leh",
      "shanti-stupa-white-peace-pagoda-of-leh"
    ]
  },
  "leh:thiksey-monastery": {
    imageUrl: "/images/places/leh/thiksey-monastery.webp",
    visualDescription: "A twelve-story monastery complex resembling the Potala Palace in Lhasa, housing a magnificent two-story gilded statue of Maitreya Buddha.",
    category: "Culture & Heritage",
    semanticTheme: "monastery",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "15m-maitreya-buddha",
      "leh-thiksey-gompa-15m-maitreya-buddha",
      "thiksey",
      "thiksey-gompa",
      "thiksey-gompa-15m-maitreya-buddha",
      "thiksey-gompa-15m-maitreya-buddha-leh",
      "thiksey-gompa-15m-maitreya-buddha-of-leh",
      "thiksey-gompa-and-15m-maitreya-buddha",
      "thiksey-gompa-leh",
      "thiksey-leh",
      "thiksey-monastery"
    ]
  },
  "leh:pangong-tso": {
    imageUrl: "/images/places/leh/pangong-tso.webp",
    visualDescription: "World-famous endorheic salt lake at 4,225m that changes shades from azure to turquoise to deep emerald under clear high-altitude skies.",
    category: "Nature & Trails",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "leh-pangong-tso-high-altitude-salt",
      "pangong",
      "pangong-leh",
      "pangong-tso",
      "pangong-tso-high-altitude-salt",
      "pangong-tso-high-altitude-salt-lake",
      "pangong-tso-high-altitude-salt-leh",
      "pangong-tso-high-altitude-salt-of-leh",
      "pangong-tso-leh"
    ]
  },
  "leh:sangam-confluence": {
    imageUrl: "/images/places/leh/sangam-confluence.webp",
    visualDescription: "The dramatic meeting point where the emerald green waters of the Indus merge with the muddy ochre currents of the rushing Zanskar.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "confluence",
      "confluence-leh",
      "confluence-of",
      "confluence-of-indus",
      "confluence-of-indus-and-zanskar-rivers-sangam",
      "confluence-of-indus-zanskar-rivers-sangam",
      "confluence-of-indus-zanskar-rivers-sangam-leh",
      "confluence-of-indus-zanskar-rivers-sangam-of-leh",
      "confluence-of-leh",
      "leh-confluence-of-indus-zanskar-rivers-sangam",
      "sangam",
      "sangam-confluence",
      "zanskar-rivers"
    ]
  },
  "leh:lalas-art-cafe": {
    imageUrl: "/images/places/leh/lalas-art-cafe.webp",
    visualDescription: "Historic mud-brick Buddhist temple building in Old Town Leh converted into an intimate art gallery and café serving Ladakhi Khambir bread.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "lalas",
      "lalas-art",
      "lalas-art-cafe",
      "lalas-art-café",
      "lalas-art-café-restored-heritage-labrang",
      "lalas-art-café-restored-labrang",
      "lalas-art-café-restored-labrang-leh",
      "lalas-art-café-restored-labrang-of-leh",
      "lalas-art-leh",
      "lalas-leh",
      "leh-lalas-art-café-restored-labrang",
      "restored-heritage-labrang"
    ]
  },
  "leh:gesmo-restaurant": {
    imageUrl: "/images/places/leh/gesmo-restaurant.webp",
    visualDescription: "Leh's oldest beloved travelers' hub renowned for handmade yak cheese pizza, apricot pies, spicy Thukpa, and cinnamon buns.",
    category: "Local Food",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "german-bakery",
      "gesmo",
      "gesmo-leh",
      "gesmo-restaurant",
      "gesmo-restaurant-and-german-bakery-since-1989",
      "gesmo-restaurant-german-bakery-since-1989",
      "gesmo-restaurant-german-bakery-since-1989-leh",
      "gesmo-restaurant-german-bakery-since-1989-of-leh",
      "gesmo-restaurant-leh",
      "leh-gesmo-restaurant-german-bakery-since-1989",
      "since-1989"
    ]
  },
  "leh:hall-of-fame-leh": {
    imageUrl: "/images/places/leh/hall-of-fame-leh.webp",
    visualDescription: "A comprehensive museum managed by the Indian Army showcasing Ladakh's war history, Siachen Glacier expeditions, and cultural artifacts.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "cultural-museum",
      "hall-of-fame",
      "hall-of-fame-leh",
      "hall-of-fame-military",
      "hall-of-fame-military-and-cultural-museum",
      "leh-of-fame-military-cultural-museum",
      "of-fame",
      "of-fame-leh",
      "of-fame-military-cultural-museum",
      "of-fame-military-cultural-museum-leh",
      "of-fame-military-cultural-museum-of-leh"
    ]
  },
  "manali:hadimba-temple": {
    imageUrl: "/images/places/manali/hadimba-temple.webp",
    visualDescription: "A 16th-century four-tiered pagoda-style wooden temple nestled deep inside towering Dhungri deodar forests.",
    category: "Must Visit",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "hadimba",
      "hadimba-devi",
      "hadimba-devi-cedar",
      "hadimba-devi-cedar-forest-temple",
      "hadimba-devi-cedar-manali",
      "hadimba-devi-cedar-of-manali",
      "hadimba-devi-manali",
      "hadimba-manali",
      "hadimba-temple",
      "manali-hadimba-devi-cedar"
    ]
  },
  "manali:cafe-1947": {
    imageUrl: "/images/places/manali/cafe-1947.webp",
    visualDescription: "Old Manali's iconic stone café sitting directly over the rushing Manalsu river stream, renowned for wood-fired pizza and acoustic indie sets.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "cafe-1947",
      "café",
      "café-1947",
      "café-1947-manali",
      "café-1947-riverside-stone-café",
      "café-1947-stone-café",
      "café-1947-stone-café-manali",
      "café-1947-stone-café-of-manali",
      "café-manali",
      "manali-café-1947-stone-café",
      "riverside-stone-café"
    ]
  },
  "manali:jogini-waterfall": {
    imageUrl: "/images/places/manali/jogini-waterfall.webp",
    visualDescription: "A gentle 3 km hike through apple orchards and pine groves starting from Vashisht village leading to a cascading multi-tier waterfall.",
    category: "Nature & Trails",
    semanticTheme: "waterfall",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jogini",
      "jogini-manali",
      "jogini-waterfall",
      "jogini-waterfall-manali",
      "jogini-waterfall-pine",
      "jogini-waterfall-pine-manali",
      "jogini-waterfall-pine-of-manali",
      "jogini-waterfall-pine-trail",
      "manali-jogini-waterfall-pine"
    ]
  },
  "manali:old-manali-village": {
    imageUrl: "/images/places/manali/old-manali-village.webp",
    visualDescription: "Traditional wooden Himachali architecture surrounded by apple orchards and narrow stone alleys lined with bohemian cafés.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "manali",
      "manali-manali",
      "manali-manali-manu",
      "manali-manu",
      "manali-manu-manali",
      "manali-manu-of-manali",
      "manu-temple",
      "old-manali-village",
      "old-manali-village-and-manu-temple",
      "old-village"
    ]
  },
  "manali:drifters-cafe": {
    imageUrl: "/images/places/manali/drifters-cafe.webp",
    visualDescription: "Warm wooden café offering board games, live acoustic indie sets, cinnamon French toast, and handcrafted espresso.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "acoustic-inn",
      "drifters",
      "drifters-cafe",
      "drifters-café",
      "drifters-café-acoustic",
      "drifters-café-acoustic-manali",
      "drifters-café-acoustic-of-manali",
      "drifters-café-and-acoustic-inn",
      "drifters-café-manali",
      "drifters-manali",
      "manali-drifters-café-acoustic"
    ]
  },
  "manali:solang-valley": {
    imageUrl: "/images/places/manali/solang-valley.webp",
    visualDescription: "High alpine valley famous for paragliding over pine slopes, zorbing, winter ski slopes, and panoramic snow peak vistas.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "manali-solang-valley-alpine-adventure-grounds",
      "solang",
      "solang-manali",
      "solang-valley",
      "solang-valley-alpine-adventure-grounds",
      "solang-valley-alpine-adventure-grounds-manali",
      "solang-valley-alpine-adventure-grounds-of-manali",
      "solang-valley-manali"
    ]
  },
  "manali:vashisht-springs": {
    imageUrl: "/images/places/manali/vashisht-springs.webp",
    visualDescription: "Natural geothermal hot springs with stone bathing tanks attached to a 4,000-year-old wooden temple dedicated to Sage Vashistha.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "ancient-temple",
      "manali-vashisht-hot-sulphur-springs-ancient",
      "vashisht",
      "vashisht-hot",
      "vashisht-hot-manali",
      "vashisht-hot-sulphur-springs",
      "vashisht-hot-sulphur-springs-ancient",
      "vashisht-hot-sulphur-springs-ancient-manali",
      "vashisht-hot-sulphur-springs-ancient-of-manali",
      "vashisht-hot-sulphur-springs-and-ancient-temple",
      "vashisht-manali",
      "vashisht-springs"
    ]
  },
  "manali:johnsons-cafe": {
    imageUrl: "/images/places/manali/johnsons-cafe.webp",
    visualDescription: "Celebrated garden restaurant set in a manicured lawn serving fresh wood-smoked Himalayan river trout and authentic apple cider.",
    category: "Local Food",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "johnsons",
      "johnsons-cafe",
      "johnsons-café",
      "johnsons-café-manali",
      "johnsons-café-trout-bar",
      "johnsons-café-trout-bar-manali",
      "johnsons-café-trout-bar-of-manali",
      "johnsons-manali",
      "manali-johnsons-café-trout-bar",
      "the-johnsons-café",
      "the-johnsons-café-and-trout-bar",
      "trout-bar"
    ]
  },
  "mathura-vrindavan:bankey-bihari-temple": {
    imageUrl: "/images/places/mathura-vrindavan/bankey-bihari-temple.webp",
    visualDescription: "The most revered temple in Vrindavan dedicated to Lord Krishna in the Tribhanga posture, famous for dynamic curtain darshans and kirtans.",
    category: "Must Visit",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bankey",
      "bankey-bihari",
      "bankey-bihari-mathura-vrindavan",
      "bankey-bihari-temple",
      "bankey-bihari-temple-vrindavan",
      "bankey-bihari-vrindavan",
      "bankey-bihari-vrindavan-mathura-vrindavan",
      "bankey-bihari-vrindavan-of-mathura-vrindavan",
      "bankey-mathura-vrindavan",
      "mathura-vrindavan-bankey-bihari-vrindavan"
    ]
  },
  "mathura-vrindavan:shri-krishna-janmabhoomi": {
    imageUrl: "/images/places/mathura-vrindavan/shri-krishna-janmabhoomi.webp",
    visualDescription: "The sacred birthplace of Lord Krishna in Mathura containing the ancient prison cell (Garbha Griha), Keshavdev temple, and sacred kund.",
    category: "Must Visit",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mathura-vrindavan-shri-krishna-janmabhoomi",
      "shri",
      "shri-krishna",
      "shri-krishna-janmabhoomi",
      "shri-krishna-janmabhoomi-mathura-vrindavan",
      "shri-krishna-janmabhoomi-of-mathura-vrindavan",
      "shri-krishna-janmabhoomi-temple-complex",
      "shri-krishna-mathura-vrindavan",
      "shri-mathura-vrindavan"
    ]
  },
  "mathura-vrindavan:prem-mandir-vrindavan": {
    imageUrl: "/images/places/mathura-vrindavan/prem-mandir-vrindavan.webp",
    visualDescription: "Spectacular 54-acre temple carved entirely of pure Italian Carrara marble, illuminated at night with vibrant multi-colored light fountains.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mathura-vrindavan-prem-mandir-italian-carrara-marble",
      "prem",
      "prem-mandir",
      "prem-mandir-italian-carrara-marble",
      "prem-mandir-italian-carrara-marble-mathura-vrindavan",
      "prem-mandir-italian-carrara-marble-of-mathura-vrindavan",
      "prem-mandir-italian-carrara-marble-temple",
      "prem-mandir-mathura-vrindavan",
      "prem-mandir-vrindavan",
      "prem-mathura-vrindavan"
    ]
  },
  "mathura-vrindavan:iskcon-vrindavan": {
    imageUrl: "/images/places/mathura-vrindavan/iskcon-vrindavan.webp",
    visualDescription: "International center of Hare Krishna devotion featuring pure white marble courtyards, Srila Prabhupada's Samadhi, and 24-hour Kirtan.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "iskcon",
      "iskcon-mathura-vrindavan",
      "iskcon-sri",
      "iskcon-sri-krishna-balaram",
      "iskcon-sri-krishna-balaram-mathura-vrindavan",
      "iskcon-sri-krishna-balaram-of-mathura-vrindavan",
      "iskcon-sri-krishna-balaram-temple",
      "iskcon-sri-mathura-vrindavan",
      "iskcon-vrindavan",
      "mathura-vrindavan-iskcon-sri-krishna-balaram"
    ]
  },
  "mathura-vrindavan:vishram-ghat-aarti": {
    imageUrl: "/images/places/mathura-vrindavan/vishram-ghat-aarti.webp",
    visualDescription: "The central sacred ghat of Mathura where Lord Krishna rested after slaying Kansa; features glittering brass evening aarti over the Yamuna.",
    category: "Nature & Trails",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mathura-vrindavan-vishram-evening-yamuna-maha-aarti",
      "vishram",
      "vishram-evening",
      "vishram-evening-mathura-vrindavan",
      "vishram-evening-yamuna-maha-aarti",
      "vishram-evening-yamuna-maha-aarti-mathura-vrindavan",
      "vishram-evening-yamuna-maha-aarti-of-mathura-vrindavan",
      "vishram-ghat-aarti",
      "vishram-ghat-evening-yamuna-maha-aarti",
      "vishram-mathura-vrindavan"
    ]
  },
  "mathura-vrindavan:nidhivan-grove": {
    imageUrl: "/images/places/mathura-vrindavan/nidhivan-grove.webp",
    visualDescription: "Mystical forest of intertwined Tulsi (holy basil) trees where divine Rasleela is believed to take place every night in complete seclusion.",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mathura-vrindavan-nidhivan-sacred-basil-grove",
      "nidhivan",
      "nidhivan-grove",
      "nidhivan-mathura-vrindavan",
      "nidhivan-sacred",
      "nidhivan-sacred-basil-forest-grove",
      "nidhivan-sacred-basil-grove",
      "nidhivan-sacred-basil-grove-mathura-vrindavan",
      "nidhivan-sacred-basil-grove-of-mathura-vrindavan",
      "nidhivan-sacred-mathura-vrindavan"
    ]
  },
  "mathura-vrindavan:brijwasi-mithai-wala": {
    imageUrl: "/images/places/mathura-vrindavan/brijwasi-mithai-wala.webp",
    visualDescription: "Legendary confectioner since the 1920s famous for caramelized golden Mathura Peda made from slow-cooked mawa, cardamom, and pure ghee.",
    category: "Local Food",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "brijwasi",
      "brijwasi-mathura-vrindavan",
      "brijwasi-mithai",
      "brijwasi-mithai-mathura-vrindavan",
      "brijwasi-mithai-wala",
      "brijwasi-mithai-wala-original-mathura-peda",
      "brijwasi-mithai-wala-original-mathura-peda-mathura-vrindavan",
      "brijwasi-mithai-wala-original-mathura-peda-of-mathura-vrindavan",
      "mathura-vrindavan-brijwasi-mithai-wala-original-mathura-peda",
      "original-mathura-peda"
    ]
  },
  "mathura-vrindavan:radha-raman-temple": {
    imageUrl: "/images/places/mathura-vrindavan/radha-raman-temple.webp",
    visualDescription: "500-year-old temple holding the self-manifested Shaligram deity of Lord Krishna, with an eternal sacred cooking fire burning since 1542.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mathura-vrindavan-radha-raman-ancient-self-manifested-deity",
      "radha",
      "radha-mathura-vrindavan",
      "radha-raman",
      "radha-raman-ancient-self-manifested-deity",
      "radha-raman-ancient-self-manifested-deity-mathura-vrindavan",
      "radha-raman-ancient-self-manifested-deity-of-mathura-vrindavan",
      "radha-raman-mathura-vrindavan",
      "radha-raman-temple"
    ]
  },
  "morni-hills:tikkar-taal-lakes": {
    imageUrl: "/images/places/morni-hills/tikkar-taal-lakes.webp",
    visualDescription: "Sacred interconnected twin lakes (Bada Taal and Chhota Taal) separated by a scenic hillock, offering calm pedal boating and camping.",
    category: "Must Visit",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "boating",
      "morni-hills-tikkar-taal-twin-lakes-boating",
      "tikkar",
      "tikkar-morni-hills",
      "tikkar-taal",
      "tikkar-taal-lakes",
      "tikkar-taal-morni-hills",
      "tikkar-taal-twin-lakes",
      "tikkar-taal-twin-lakes-and-boating",
      "tikkar-taal-twin-lakes-boating",
      "tikkar-taal-twin-lakes-boating-morni-hills",
      "tikkar-taal-twin-lakes-boating-of-morni-hills"
    ]
  },
  "morni-hills:morni-fort-heritage": {
    imageUrl: "/images/places/morni-hills/morni-fort-heritage.webp",
    visualDescription: "Historic hill fortress built in the 17th century on a commanding ridge overlooking the entire Morni mountain basin.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "morni",
      "morni-17th",
      "morni-17th-century-ramparts",
      "morni-17th-century-ramparts-morni-hills",
      "morni-17th-century-ramparts-of-morni-hills",
      "morni-17th-morni-hills",
      "morni-fort-17th-century-ramparts",
      "morni-fort-heritage",
      "morni-hills-morni-17th-century-ramparts",
      "morni-morni-hills"
    ]
  },
  "morni-hills:herbal-nature-trail": {
    imageUrl: "/images/places/morni-hills/herbal-nature-trail.webp",
    visualDescription: "Extensive nature trails through pine, oak, and wild medicinal herbs, home to red junglefowl, kalij pheasants, and quails.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bird-trail",
      "herbal-nature-trail",
      "morni",
      "morni-hills-morni-shivalik-herbal-bird",
      "morni-morni-hills",
      "morni-shivalik",
      "morni-shivalik-herbal-bird",
      "morni-shivalik-herbal-bird-morni-hills",
      "morni-shivalik-herbal-bird-of-morni-hills",
      "morni-shivalik-herbal-forest",
      "morni-shivalik-herbal-forest-and-bird-trail",
      "morni-shivalik-morni-hills"
    ]
  },
  "morni-hills:adventure-park-tikkar": {
    imageUrl: "/images/places/morni-hills/adventure-park-tikkar.webp",
    visualDescription: "Lakeside adventure park offering ziplining across hillocks, Burma bridges, rope climbing, and lakeside trekking trails.",
    category: "Adventure & Treks",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "adventure",
      "adventure-morni-hills",
      "adventure-park-tikkar",
      "adventure-park-tikkar-taal",
      "adventure-park-tikkar-taal-zip-and-obstacle-course",
      "adventure-tikkar",
      "adventure-tikkar-morni-hills",
      "adventure-tikkar-taal-zip-obstacle-course",
      "adventure-tikkar-taal-zip-obstacle-course-morni-hills",
      "adventure-tikkar-taal-zip-obstacle-course-of-morni-hills",
      "morni-hills-adventure-tikkar-taal-zip-obstacle-course",
      "obstacle-course"
    ]
  },
  "morni-hills:gurudwara-nada-sahib": {
    imageUrl: "/images/places/morni-hills/gurudwara-nada-sahib.webp",
    visualDescription: "Sacred Sikh shrine situated on the bank of the Ghaggar River where Guru Gobind Singh Ji stayed in 1688 after the Battle of Bhangani.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "gurudwara",
      "gurudwara-morni-hills",
      "gurudwara-nada",
      "gurudwara-nada-morni-hills",
      "gurudwara-nada-sahib",
      "gurudwara-nada-sahib-en-route",
      "gurudwara-nada-sahib-en-route-morni-hills",
      "gurudwara-nada-sahib-en-route-of-morni-hills",
      "morni-hills-gurudwara-nada-sahib-en-route"
    ]
  },
  "morni-hills:berwala-pheasant-breeding": {
    imageUrl: "/images/places/morni-hills/berwala-pheasant-breeding.webp",
    visualDescription: "Asia's premier breeding facility for endangered Red Junglefowl and Cheer Pheasants dedicated to conservation and rewilding.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "berwala-pheasant-breeding",
      "morni-hills-pheasant-breeding-centre-berwala",
      "pheasant",
      "pheasant-breeding",
      "pheasant-breeding-centre-berwala",
      "pheasant-breeding-centre-berwala-morni-hills",
      "pheasant-breeding-centre-berwala-of-morni-hills",
      "pheasant-breeding-morni-hills",
      "pheasant-morni-hills"
    ]
  },
  "morni-hills:mountain-quail-resort-dhaba": {
    imageUrl: "/images/places/morni-hills/mountain-quail-resort-dhaba.webp",
    visualDescription: "Haryana Tourism scenic terrace overlooking the valleys serving hot aloo pyaz parathas, Kadhi Pakora, and spiced ginger tea.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "morni-hills-mountain-quail-terrace",
      "mountain",
      "mountain-morni-hills",
      "mountain-quail",
      "mountain-quail-morni-hills",
      "mountain-quail-resort-dhaba",
      "mountain-quail-terrace",
      "mountain-quail-terrace-dhaba",
      "mountain-quail-terrace-morni-hills",
      "mountain-quail-terrace-of-morni-hills"
    ]
  },
  "morni-hills:shivalik-viewpoint-crest": {
    imageUrl: "/images/places/morni-hills/shivalik-viewpoint-crest.webp",
    visualDescription: "Elevated road crest along the Morni-Tikkar Taal link road offering wide unobstructed views towards the snowlines on clear winter days.",
    category: "Hidden Gems",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "morni-hills-shivalik-viewpoint-crest",
      "shivalik",
      "shivalik-morni-hills",
      "shivalik-viewpoint",
      "shivalik-viewpoint-crest",
      "shivalik-viewpoint-crest-and-sunset-ridge",
      "shivalik-viewpoint-crest-morni-hills",
      "shivalik-viewpoint-crest-of-morni-hills",
      "shivalik-viewpoint-morni-hills",
      "sunset-ridge"
    ]
  },
  "munnar:eravikulam-national-park": {
    imageUrl: "/images/places/munnar/eravikulam-national-park.webp",
    visualDescription: "Sanctuary for the endangered Nilgiri Tahr mountain goat, featuring rolling shola grasslands, Anamudi Peak vistas, and blooming Neelakurinji flowers.",
    category: "Must Visit",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "eravikulam",
      "eravikulam-munnar",
      "eravikulam-national",
      "eravikulam-national-munnar",
      "eravikulam-national-park",
      "eravikulam-national-park-rajamalai",
      "eravikulam-national-rajamalai",
      "eravikulam-national-rajamalai-munnar",
      "eravikulam-national-rajamalai-of-munnar",
      "munnar-eravikulam-national-rajamalai",
      "rajamalai"
    ]
  },
  "munnar:mattupetty-dam-lake": {
    imageUrl: "/images/places/munnar/mattupetty-dam-lake.webp",
    visualDescription: "Concrete gravity storage dam nestled amidst tea hills and dense eucalyptus forests, popular for quiet speedboating and wild elephant sightings.",
    category: "Nature & Trails",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mattupetty",
      "mattupetty-dam",
      "mattupetty-dam-and-speedboating-basin",
      "mattupetty-dam-lake",
      "mattupetty-dam-munnar",
      "mattupetty-dam-speedboating-basin",
      "mattupetty-dam-speedboating-basin-munnar",
      "mattupetty-dam-speedboating-basin-of-munnar",
      "mattupetty-munnar",
      "munnar-mattupetty-dam-speedboating-basin",
      "speedboating-basin"
    ]
  },
  "munnar:tata-tea-museum": {
    imageUrl: "/images/places/munnar/tata-tea-museum.webp",
    visualDescription: "Historic 1880s tea factory showcasing the evolution of Kerala's tea plantations with live orthodox tea plucking and tasting sessions.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "factory-processing",
      "kdhp",
      "kdhp-munnar",
      "kdhp-tea",
      "kdhp-tea-munnar",
      "kdhp-tea-museum",
      "kdhp-tea-museum-and-factory-processing",
      "kdhp-tea-museum-factory-processing",
      "kdhp-tea-museum-factory-processing-munnar",
      "kdhp-tea-museum-factory-processing-of-munnar",
      "munnar-kdhp-tea-museum-factory-processing",
      "tata-tea-museum"
    ]
  },
  "munnar:top-station-viewpoint": {
    imageUrl: "/images/places/munnar/top-station-viewpoint.webp",
    visualDescription: "The highest point on the Munnar-Kodaikanal road (1,880m) on the Kerala-Tamil Nadu border, famous for sweeping views of the Western Ghats and cloud ...",
    category: "Adventure & Treks",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "munnar-top-station-western-ghats-cloud-viewpoint",
      "top-station",
      "top-station-munnar",
      "top-station-viewpoint",
      "top-station-western-ghats-cloud-viewpoint",
      "top-station-western-ghats-cloud-viewpoint-munnar",
      "top-station-western-ghats-cloud-viewpoint-of-munnar"
    ]
  },
  "munnar:attukad-waterfalls": {
    imageUrl: "/images/places/munnar/attukad-waterfalls.webp",
    visualDescription: "A roaring multi-tiered waterfall cascading through deep jungle ravines and lush tea slopes, reachable via a scenic suspension bridge.",
    category: "Nature & Trails",
    semanticTheme: "waterfall",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "attukad",
      "attukad-munnar",
      "attukad-waterfalls",
      "attukad-waterfalls-jungle",
      "attukad-waterfalls-jungle-munnar",
      "attukad-waterfalls-jungle-of-munnar",
      "attukad-waterfalls-jungle-trail",
      "attukad-waterfalls-munnar",
      "munnar-attukad-waterfalls-jungle"
    ]
  },
  "munnar:pothamedu-viewpoint": {
    imageUrl: "/images/places/munnar/pothamedu-viewpoint.webp",
    visualDescription: "A serene elevated viewpoint offering wide vistas of tea, coffee, and cardamom plantations and the winding Muthirapuzha river.",
    category: "Hidden Gems",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "munnar-pothamedu-viewpoint-over-tea-valleys",
      "pothamedu",
      "pothamedu-munnar",
      "pothamedu-viewpoint",
      "pothamedu-viewpoint-munnar",
      "pothamedu-viewpoint-over-tea-valleys",
      "pothamedu-viewpoint-over-tea-valleys-munnar",
      "pothamedu-viewpoint-over-tea-valleys-of-munnar",
      "pothamedu-viewpoint-sunset-over-tea-valleys",
      "sunset-over-tea-valleys"
    ]
  },
  "munnar:rapsy-restaurant": {
    imageUrl: "/images/places/munnar/rapsy-restaurant.webp",
    visualDescription: "Famous town center eatery serving hot layered Malabar parottas, spicy pepper beef roast, chicken biryani, and Spanish omelettes.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "beef-fry",
      "kerala-parotta",
      "munnar-rapsy-restaurant-kerala-parotta-beef-fry",
      "rapsy",
      "rapsy-munnar",
      "rapsy-restaurant",
      "rapsy-restaurant-kerala-parotta-and-beef-fry",
      "rapsy-restaurant-kerala-parotta-beef-fry",
      "rapsy-restaurant-kerala-parotta-beef-fry-munnar",
      "rapsy-restaurant-kerala-parotta-beef-fry-of-munnar",
      "rapsy-restaurant-munnar"
    ]
  },
  "munnar:kundala-lake-dam": {
    imageUrl: "/images/places/munnar/kundala-lake-dam.webp",
    visualDescription: "Asia's first arch dam creating a scenic reservoir fringed by cherry blossom trees, where Kashmiri-style shikara boats glide on still waters.",
    category: "Nature & Trails",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kundala",
      "kundala-lake",
      "kundala-lake-and-shikara-boating",
      "kundala-lake-dam",
      "kundala-munnar",
      "kundala-shikara",
      "kundala-shikara-boating",
      "kundala-shikara-boating-munnar",
      "kundala-shikara-boating-of-munnar",
      "kundala-shikara-munnar",
      "munnar-kundala-shikara-boating",
      "shikara-boating"
    ]
  },
  "murthal:amrik-sukhdev-dhaba": {
    imageUrl: "/images/places/murthal/amrik-sukhdev-dhaba.webp",
    visualDescription: "The undisputed capital of highway gastronomy since 1956, famous for hot tandoori Aloo-Pyaaz and Gobhi parathas loaded with pure white butter.",
    category: "Must Visit",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "7-paratha-dhaba",
      "amrik",
      "amrik-murthal",
      "amrik-sukhdev",
      "amrik-sukhdev-dhaba",
      "amrik-sukhdev-legendary-247-paratha",
      "amrik-sukhdev-legendary-247-paratha-dhaba",
      "amrik-sukhdev-legendary-247-paratha-murthal",
      "amrik-sukhdev-legendary-247-paratha-of-murthal",
      "amrik-sukhdev-murthal",
      "legendary-24",
      "murthal-amrik-sukhdev-legendary-247-paratha"
    ]
  },
  "murthal:haveli-murthal-punjabi": {
    imageUrl: "/images/places/murthal/haveli-murthal-punjabi.webp",
    visualDescription: "A grand Punjabi heritage palace on GT Road featuring traditional village courtyards, folk dancers, camel rides, and authentic clay oven feasts.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "haveli",
      "haveli-murthal",
      "haveli-murthal-murthal",
      "haveli-murthal-punjabi",
      "haveli-murthal-punjabi-cultural-theme",
      "haveli-murthal-punjabi-cultural-theme-murthal",
      "haveli-murthal-punjabi-cultural-theme-of-murthal",
      "haveli-murthal-punjabi-cultural-theme-village",
      "haveli-punjabi",
      "murthal-haveli-murthal-punjabi-cultural-theme",
      "punjabi-cultural-theme-village"
    ]
  },
  "murthal:gulshan-dhaba-traditional": {
    imageUrl: "/images/places/murthal/gulshan-dhaba-traditional.webp",
    visualDescription: "Historic 1950s open highway kitchen serving authentic rustic spiced parathas, Chana Masala, Kadai Paneer, and thick sweet Lassi.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "gulshan",
      "gulshan-dhaba-traditional",
      "gulshan-dhaba-traditional-tandoori-kitchen",
      "gulshan-murthal",
      "gulshan-traditional",
      "gulshan-traditional-murthal",
      "gulshan-traditional-tandoori",
      "gulshan-traditional-tandoori-murthal",
      "gulshan-traditional-tandoori-of-murthal",
      "murthal-gulshan-traditional-tandoori"
    ]
  },
  "murthal:pahalwan-dhaba-murthal": {
    imageUrl: "/images/places/murthal/pahalwan-dhaba-murthal.webp",
    visualDescription: "Traditional wrestler-style dhaba renowned for pure desi ghee parathas, slow-cooked Dal Tadka, and hot Kadhai Doodh with thick malai.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "murthal-pahalwan-pure-desi-ghee-roasters",
      "pahalwan",
      "pahalwan-dhaba",
      "pahalwan-dhaba-murthal",
      "pahalwan-dhaba-pure-desi-ghee-roasters",
      "pahalwan-murthal",
      "pahalwan-pure",
      "pahalwan-pure-desi-ghee-roasters",
      "pahalwan-pure-desi-ghee-roasters-murthal",
      "pahalwan-pure-desi-ghee-roasters-of-murthal",
      "pahalwan-pure-murthal"
    ]
  },
  "murthal:mojoland-adventure-park": {
    imageUrl: "/images/places/murthal/mojoland-adventure-park.webp",
    visualDescription: "Expansive multi-theme amusement park on NH-44 featuring high-rope courses, bungee jumping, water park slides, and ATV off-roading.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mojoland",
      "mojoland-adventure-park",
      "mojoland-multi",
      "mojoland-multi-murthal",
      "mojoland-multi-theme-adventure",
      "mojoland-multi-theme-adventure-murthal",
      "mojoland-multi-theme-adventure-of-murthal",
      "mojoland-multi-theme-adventure-park",
      "mojoland-murthal",
      "murthal-mojoland-multi-theme-adventure"
    ]
  },
  "murthal:mannat-haveli-murthal": {
    imageUrl: "/images/places/murthal/mannat-haveli-murthal.webp",
    visualDescription: "Palatial Rajasthani-Punjabi architectural stop on GT Road featuring carved stone archways, elephant fountains, and luxury dining halls.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mannat",
      "mannat-haveli",
      "mannat-haveli-grand-highway-palace",
      "mannat-haveli-highway",
      "mannat-haveli-highway-murthal",
      "mannat-haveli-highway-of-murthal",
      "mannat-haveli-murthal",
      "mannat-murthal",
      "murthal-mannat-haveli-highway"
    ]
  },
  "murthal:khwaja-khizr-tomb": {
    imageUrl: "/images/places/murthal/khwaja-khizr-tomb.webp",
    visualDescription: "A magnificent 16th-century red sandstone and kankar tomb built during Ibrahim Lodi's reign, surrounded by quiet heritage gardens in Sonipat.",
    category: "Hidden Gems",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "1522-pathan-architecture",
      "khwaja-khizr-tomb",
      "murthal-of-khwaja-khizr-1522-pathan-architecture",
      "of-khwaja",
      "of-khwaja-khizr-1522-pathan-architecture",
      "of-khwaja-khizr-1522-pathan-architecture-murthal",
      "of-khwaja-khizr-1522-pathan-architecture-of-murthal",
      "of-khwaja-murthal",
      "tomb-of-khwaja-khizr",
      "tomb-of-khwaja-khizr-1522-pathan-architecture"
    ]
  },
  "murthal:dhingra-sweets-milk-bar": {
    imageUrl: "/images/places/murthal/dhingra-sweets-milk-bar.webp",
    visualDescription: "Famed dairy stop serving thick saffron rabri, hot jalebis fried in pure ghee, sweet lassi, and traditional pinni sweets.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dhingra",
      "dhingra-murthal",
      "dhingra-sweets",
      "dhingra-sweets-and-pure-milk-kadhai",
      "dhingra-sweets-milk-bar",
      "dhingra-sweets-murthal",
      "dhingra-sweets-pure-milk-kadhai",
      "dhingra-sweets-pure-milk-kadhai-murthal",
      "dhingra-sweets-pure-milk-kadhai-of-murthal",
      "murthal-dhingra-sweets-pure-milk-kadhai",
      "pure-milk-kadhai"
    ]
  },
  "mussoorie:lal-tibba-viewpoint": {
    imageUrl: "/images/places/mussoorie/lal-tibba-viewpoint.webp",
    visualDescription: "The highest point in Landour (2,275m) offering high-powered telescope panoramas of snow-capped Himalayan peaks including Kedarnath and Badrinath.",
    category: "Must Visit",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "lal-tibba",
      "lal-tibba-mussoorie",
      "lal-tibba-scenic-viewpoint",
      "lal-tibba-scenic-viewpoint-mussoorie",
      "lal-tibba-scenic-viewpoint-of-mussoorie",
      "lal-tibba-viewpoint",
      "mussoorie-lal-tibba-scenic-viewpoint"
    ]
  },
  "mussoorie:char-dukan-prakash-store": {
    imageUrl: "/images/places/mussoorie/char-dukan-prakash-store.webp",
    visualDescription: "A quiet cluster of four historic stalls next to the 1839 St. Paul's Anglican Church serving ginger lemon honey tea and cheese omelettes.",
    category: "Hidden Gems",
    semanticTheme: "church",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "char",
      "char-dukan",
      "char-dukan-and-st-pauls-church",
      "char-dukan-mussoorie",
      "char-dukan-prakash-store",
      "char-dukan-st-pauls",
      "char-dukan-st-pauls-mussoorie",
      "char-dukan-st-pauls-of-mussoorie",
      "char-mussoorie",
      "mussoorie-char-dukan-st-pauls",
      "st-pauls-church"
    ]
  },
  "mussoorie:george-everest-peak": {
    imageUrl: "/images/places/mussoorie/george-everest-peak.webp",
    visualDescription: "The 1832 estate and laboratory of Surveyor-General Sir George Everest, offering a scenic ridge hike with views of Aglar Valley and Doon Plains.",
    category: "Nature & Trails",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "george-everest-peak",
      "heritage-house",
      "mussoorie-sir-george-everest-peak",
      "sir-george",
      "sir-george-everest-peak",
      "sir-george-everest-peak-and-heritage-house",
      "sir-george-everest-peak-mussoorie",
      "sir-george-everest-peak-of-mussoorie",
      "sir-george-mussoorie"
    ]
  },
  "mussoorie:camels-back-road": {
    imageUrl: "/images/places/mussoorie/camels-back-road.webp",
    visualDescription: "A peaceful 3 km walking promenade lined with centuries-old deodars and a natural rock formation resembling a resting camel.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "camels",
      "camels-back",
      "camels-back-deodar-promenade",
      "camels-back-deodar-promenade-mussoorie",
      "camels-back-deodar-promenade-of-mussoorie",
      "camels-back-mussoorie",
      "camels-back-road",
      "camels-back-road-deodar-promenade",
      "camels-mussoorie",
      "mussoorie-camels-back-deodar-promenade"
    ]
  },
  "mussoorie:clouds-end-forest": {
    imageUrl: "/images/places/mussoorie/clouds-end-forest.webp",
    visualDescription: "The western boundary of Mussoorie surrounded by dense virgin oak and deodar forests, marking the entrance to the Benog Wildlife Sanctuary.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "clouds",
      "clouds-end",
      "clouds-end-forest",
      "clouds-end-heritage-forest-sanctuary",
      "clouds-end-mussoorie",
      "clouds-end-of-mussoorie",
      "clouds-mussoorie",
      "mussoorie-clouds-end"
    ]
  },
  "mussoorie:gun-hill-ropeway": {
    imageUrl: "/images/places/mussoorie/gun-hill-ropeway.webp",
    visualDescription: "Mussoorie's second-highest peak (2,024m) where a mid-day cannon was fired during colonial times, accessible by a 400m aerial ropeway.",
    category: "Culture & Heritage",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "cable-car",
      "gun-hill-historical-viewpoint",
      "gun-hill-historical-viewpoint-and-cable-car",
      "gun-hill-ropeway",
      "gun-historical",
      "gun-historical-mussoorie",
      "gun-historical-viewpoint-cable-car",
      "gun-historical-viewpoint-cable-car-mussoorie",
      "gun-historical-viewpoint-cable-car-of-mussoorie",
      "mussoorie-gun-historical-viewpoint-cable-car"
    ]
  },
  "mussoorie:kempty-falls-cascades": {
    imageUrl: "/images/places/mussoorie/kempty-falls-cascades.webp",
    visualDescription: "Gigantic mountain waterfall cascading down 40 feet into natural rock plunge pools in a steep mountain valley.",
    category: "Nature & Trails",
    semanticTheme: "waterfall",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kempty",
      "kempty-falls-cascades",
      "kempty-falls-mountain-cascades",
      "kempty-mountain",
      "kempty-mountain-cascades",
      "kempty-mountain-cascades-mussoorie",
      "kempty-mountain-cascades-of-mussoorie",
      "kempty-mountain-mussoorie",
      "kempty-mussoorie",
      "mussoorie-kempty-mountain-cascades"
    ]
  },
  "neemrana:neemrana-fort-palace": {
    imageUrl: "/images/places/neemrana/neemrana-fort-palace.webp",
    visualDescription: "14-tiered medieval fort-palace built into the Aravalli hills in 1464, featuring stepped courtyards, hanging gardens, and grand ramparts.",
    category: "Must Visit",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "fort-palace",
      "neemrana",
      "neemrana-15th",
      "neemrana-15th-century-ramparts",
      "neemrana-15th-century-ramparts-neemrana",
      "neemrana-15th-century-ramparts-of-neemrana",
      "neemrana-15th-neemrana",
      "neemrana-fort-palace",
      "neemrana-fort-palace-15th-century-ramparts",
      "neemrana-neemrana",
      "neemrana-neemrana-15th-century-ramparts"
    ]
  },
  "neemrana:flying-fox-zipline": {
    imageUrl: "/images/places/neemrana/flying-fox-zipline.webp",
    visualDescription: "India's premier 5-stage aerial zipline tour soaring up to 400m across the dramatic rocky gorges and ramparts of Neemrana Fort.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "flying",
      "flying-fox",
      "flying-fox-aerial-zipline-tour",
      "flying-fox-aerial-zipline-tour-neemrana",
      "flying-fox-aerial-zipline-tour-of-neemrana",
      "flying-fox-neemrana",
      "flying-fox-zipline",
      "flying-neemrana",
      "neemrana-flying-fox-aerial-zipline-tour"
    ]
  },
  "neemrana:neemrana-stepwell-baori": {
    imageUrl: "/images/places/neemrana/neemrana-stepwell-baori.webp",
    visualDescription: "Massive 18th-century 9-tiered subterranean stepwell with 170 stone steps leading down to water, built for desert travelers and royal horses.",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "ancient",
      "ancient-9",
      "ancient-9-neemrana",
      "ancient-9-story-stepwell",
      "ancient-9-story-stepwell-neemrana-baori",
      "ancient-9-story-stepwell-neemrana-baori-neemrana",
      "ancient-9-story-stepwell-neemrana-baori-of-neemrana",
      "ancient-neemrana",
      "neemrana-ancient-9-story-stepwell-neemrana-baori",
      "neemrana-baori",
      "neemrana-stepwell-baori",
      "stepwell-baori"
    ]
  },
  "neemrana:kesroli-hill-fort": {
    imageUrl: "/images/places/neemrana/kesroli-hill-fort.webp",
    visualDescription: "Rare 700-year-old fort perched on a lone dark volcanic rock surrounded by yellow mustard fields and tranquil Mewat rural landscapes.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kesroli",
      "kesroli-14th",
      "kesroli-14th-century-en-route",
      "kesroli-14th-century-en-route-neemrana",
      "kesroli-14th-century-en-route-of-neemrana",
      "kesroli-14th-century-hill-fort-en-route",
      "kesroli-14th-neemrana",
      "kesroli-hill-fort",
      "kesroli-neemrana",
      "neemrana-kesroli-14th-century-en-route"
    ]
  },
  "neemrana:japanese-zone-cuisine": {
    imageUrl: "/images/places/neemrana/japanese-zone-cuisine.webp",
    visualDescription: "Unique international pocket housing Japanese hospitality and authentic dining spots serving handmade ramen, sushi, and matcha tea.",
    category: "Local Food",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "japanese-zone-cuisine",
      "neemrana",
      "neemrana-japanese",
      "neemrana-japanese-industrial-zone",
      "neemrana-japanese-industrial-zone-and-ramen-hub",
      "neemrana-japanese-industrial-zone-ramen-hub",
      "neemrana-japanese-industrial-zone-ramen-hub-neemrana",
      "neemrana-japanese-industrial-zone-ramen-hub-of-neemrana",
      "neemrana-japanese-neemrana",
      "neemrana-neemrana",
      "neemrana-neemrana-japanese-industrial-zone-ramen-hub",
      "ramen-hub"
    ]
  },
  "neemrana:highway-king-dhaba": {
    imageUrl: "/images/places/neemrana/highway-king-dhaba.webp",
    visualDescription: "The quintessential highway stop on NH-48 serving tandoori parathas, creamy Dal Makhani, paneer tikka, and masala chai in earthen pots.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "highway",
      "highway-king",
      "highway-king-dhaba",
      "highway-king-neemrana",
      "highway-king-nh-48-express",
      "highway-king-nh-48-express-dhaba",
      "highway-king-nh-48-express-neemrana",
      "highway-king-nh-48-express-of-neemrana",
      "highway-neemrana",
      "neemrana-highway-king-nh-48-express"
    ]
  },
  "neemrana:baba-khetanath-ashram": {
    imageUrl: "/images/places/neemrana/baba-khetanath-ashram.webp",
    visualDescription: "Peaceful hilltop spiritual hermitage atop an Aravalli peak offering panoramic views of the Rajasthan plains and serene meditation walks.",
    category: "Nature & Trails",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "baba",
      "baba-khetanath",
      "baba-khetanath-ashram",
      "baba-khetanath-hilltop-ashram",
      "baba-khetanath-hilltop-ashram-and-ridge",
      "baba-khetanath-hilltop-ashram-neemrana",
      "baba-khetanath-hilltop-ashram-of-neemrana",
      "baba-khetanath-neemrana",
      "baba-neemrana",
      "neemrana-baba-khetanath-hilltop-ashram"
    ]
  },
  "neemrana:siliserh-en-route-neemrana": {
    imageUrl: "/images/places/neemrana/siliserh-en-route-neemrana.webp",
    visualDescription: "Royal 1845 reservoir stop en-route to Alwar with boating, crocodile sightings, and historic heritage palace terraces.",
    category: "Nature & Trails",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "neemrana-siliserh-gateway-en-route",
      "siliserh",
      "siliserh-en-route",
      "siliserh-en-route-neemrana",
      "siliserh-gateway",
      "siliserh-gateway-en-route",
      "siliserh-gateway-en-route-neemrana",
      "siliserh-gateway-en-route-of-neemrana",
      "siliserh-gateway-neemrana",
      "siliserh-lake-gateway-en-route",
      "siliserh-neemrana"
    ]
  },
  "rishikesh:parmarth-niketan-aarti": {
    imageUrl: "/images/places/rishikesh/parmarth-niketan-aarti.webp",
    visualDescription: "The world-famous evening fire ceremony on the sacred banks of the Ganges at sunset, featuring soulful Vedic kirtans and floating lamps.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "parmarth",
      "parmarth-niketan",
      "parmarth-niketan-aarti",
      "parmarth-niketan-ganga-aarti",
      "parmarth-niketan-ganga-aarti-of-rishikesh",
      "parmarth-niketan-ganga-aarti-rishikesh",
      "parmarth-niketan-rishikesh",
      "parmarth-rishikesh",
      "rishikesh-parmarth-niketan-ganga-aarti"
    ]
  },
  "rishikesh:beatles-ashram": {
    imageUrl: "/images/places/rishikesh/beatles-ashram.webp",
    visualDescription: "The historic 1968 Maharishi Mahesh Yogi ashram inside Rajaji Tiger Reserve, covered in graffiti murals, meditation domes, and banyan trees.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "beatles",
      "beatles-ashram",
      "beatles-ashram-chaurasi-kutia",
      "beatles-ashram-chaurasi-kutia-of-rishikesh",
      "beatles-ashram-chaurasi-kutia-rishikesh",
      "beatles-ashram-rishikesh",
      "beatles-rishikesh",
      "chaurasi-kutia",
      "rishikesh-beatles-ashram-chaurasi-kutia"
    ]
  },
  "rishikesh:neer-garh-waterfall": {
    imageUrl: "/images/places/rishikesh/neer-garh-waterfall.webp",
    visualDescription: "A crystal-clear natural limestone waterfall cascading into turquoise plunge pools reachable via a 1.5 km scenic jungle trail.",
    category: "Nature & Trails",
    semanticTheme: "waterfall",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "neer",
      "neer-garh",
      "neer-garh-cascading-waterfall",
      "neer-garh-cascading-waterfall-of-rishikesh",
      "neer-garh-cascading-waterfall-rishikesh",
      "neer-garh-rishikesh",
      "neer-garh-waterfall",
      "neer-rishikesh",
      "rishikesh-neer-garh-cascading-waterfall"
    ]
  },
  "rishikesh:shivpuri-river-rafting": {
    imageUrl: "/images/places/rishikesh/shivpuri-river-rafting.webp",
    visualDescription: "Grade III and IV white water river rafting starting from Shivpuri down to Nim Beach through Roller Coaster and Golf Course rapids.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "rishikesh-shivpuri-white-water-rafting",
      "shivpuri",
      "shivpuri-rishikesh",
      "shivpuri-river-rafting",
      "shivpuri-white",
      "shivpuri-white-rishikesh",
      "shivpuri-white-water-rafting",
      "shivpuri-white-water-rafting-of-rishikesh",
      "shivpuri-white-water-rafting-rishikesh",
      "shivpuri-white-water-river-rafting"
    ]
  },
  "rishikesh:triveni-ghat-aarti": {
    imageUrl: "/images/places/rishikesh/triveni-ghat-aarti.webp",
    visualDescription: "Sacred confluence of three holy rivers featuring massive brass lamp ceremonies, conch shells, and floating leaf diyas.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "rishikesh-triveni-evening-maha-aarti",
      "triveni",
      "triveni-evening",
      "triveni-evening-maha-aarti",
      "triveni-evening-maha-aarti-of-rishikesh",
      "triveni-evening-maha-aarti-rishikesh",
      "triveni-evening-rishikesh",
      "triveni-ghat-aarti",
      "triveni-ghat-evening-maha-aarti",
      "triveni-rishikesh"
    ]
  },
  "rishikesh:vashistha-cave": {
    imageUrl: "/images/places/rishikesh/vashistha-cave.webp",
    visualDescription: "An ancient natural cave on the banks of the Ganges where Sage Vashistha meditated, renowned for deep meditative silence.",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "gufa",
      "rishikesh-vashistha-cave-gufa",
      "vashistha",
      "vashistha-cave",
      "vashistha-cave-gufa",
      "vashistha-cave-gufa-of-rishikesh",
      "vashistha-cave-gufa-rishikesh",
      "vashistha-cave-rishikesh",
      "vashistha-rishikesh"
    ]
  },
  "rishikesh:german-bakery-tapovan": {
    imageUrl: "/images/places/rishikesh/german-bakery-tapovan.webp",
    visualDescription: "Classic hillside bakery at Lakshman Jhula serving fresh apple strudel, yak cheese sandwiches, and organic espresso.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "devraj",
      "devraj-coffee",
      "devraj-coffee-and-german-bakery",
      "devraj-coffee-german-bakery",
      "devraj-coffee-german-bakery-of-rishikesh",
      "devraj-coffee-german-bakery-rishikesh",
      "devraj-coffee-rishikesh",
      "devraj-rishikesh",
      "german-bakery",
      "german-bakery-tapovan",
      "rishikesh-devraj-coffee-german-bakery"
    ]
  },
  "rishikesh:ram-jhula-promenade": {
    imageUrl: "/images/places/rishikesh/ram-jhula-promenade.webp",
    visualDescription: "Historic 230m iron suspension bridge linking Shivananda Ashram to Swarg Ashram across the turquoise waters of the Ganga.",
    category: "Must Visit",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "ram-jhula",
      "ram-jhula-promenade",
      "ram-jhula-rishikesh",
      "ram-jhula-suspension-bridge-promenade",
      "ram-jhula-suspension-bridge-promenade-of-rishikesh",
      "ram-jhula-suspension-bridge-promenade-rishikesh",
      "rishikesh-ram-jhula-suspension-bridge-promenade"
    ]
  },
  "sariska-bhangarh:sariska-tiger-reserve": {
    imageUrl: "/images/places/sariska-bhangarh/sariska-tiger-reserve.webp",
    visualDescription: "An 881 sq km wildlife sanctuary in the Aravallis home to Royal Bengal tigers, leopards, sambar deer, striped hyenas, and rich birdlife.",
    category: "Must Visit",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sariska",
      "sariska-bhangarh-sariska-tiger-reserve-jungle-safari",
      "sariska-sariska-bhangarh",
      "sariska-tiger",
      "sariska-tiger-reserve",
      "sariska-tiger-reserve-jungle-safari",
      "sariska-tiger-reserve-jungle-safari-of-sariska-bhangarh",
      "sariska-tiger-reserve-jungle-safari-sariska-bhangarh",
      "sariska-tiger-sariska-bhangarh"
    ]
  },
  "sariska-bhangarh:bhangarh-fort-ruins": {
    imageUrl: "/images/places/sariska-bhangarh/bhangarh-fort-ruins.webp",
    visualDescription: "17th-century fortified township surrounded by Aravalli hills, featuring preserved royal palaces, bazaar streets, and ancient stone temples.",
    category: "Must Visit",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bhangarh",
      "bhangarh-fort",
      "bhangarh-fort-legendary-medieval-ruins",
      "bhangarh-fort-ruins",
      "bhangarh-legendary",
      "bhangarh-legendary-medieval-ruins",
      "bhangarh-legendary-medieval-ruins-of-sariska-bhangarh",
      "bhangarh-legendary-medieval-ruins-sariska-bhangarh",
      "bhangarh-legendary-sariska-bhangarh",
      "bhangarh-sariska-bhangarh",
      "legendary-medieval-ruins",
      "sariska-bhangarh-bhangarh-legendary-medieval-ruins"
    ]
  },
  "sariska-bhangarh:kankwari-fort": {
    imageUrl: "/images/places/sariska-bhangarh/kankwari-fort.webp",
    visualDescription: "Remote 17th-century fort deep inside the Sariska tiger jungle where Mughal Emperor Aurangzeb imprisoned his elder brother Dara Shikoh.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kankwari",
      "kankwari-fort",
      "kankwari-fort-hilltop-fortress",
      "kankwari-hilltop",
      "kankwari-hilltop-fortress",
      "kankwari-hilltop-fortress-of-sariska-bhangarh",
      "kankwari-hilltop-fortress-sariska-bhangarh",
      "kankwari-hilltop-sariska-bhangarh",
      "kankwari-sariska-bhangarh",
      "sariska-bhangarh-kankwari-hilltop-fortress"
    ]
  },
  "sariska-bhangarh:pandupol-hanuman-temple": {
    imageUrl: "/images/places/sariska-bhangarh/pandupol-hanuman-temple.webp",
    visualDescription: "Sacred shrine inside the sanctuary where strongman Bhima is believed to have cracked open the mountain with his mace to create a pathway.",
    category: "Nature & Trails",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "natural-water-chasm",
      "pandupol",
      "pandupol-hanuman",
      "pandupol-hanuman-natural-water-chasm",
      "pandupol-hanuman-natural-water-chasm-of-sariska-bhangarh",
      "pandupol-hanuman-natural-water-chasm-sariska-bhangarh",
      "pandupol-hanuman-sariska-bhangarh",
      "pandupol-hanuman-temple",
      "pandupol-hanuman-temple-and-natural-water-chasm",
      "pandupol-sariska-bhangarh",
      "sariska-bhangarh-pandupol-hanuman-natural-water-chasm"
    ]
  },
  "sariska-bhangarh:neelkanth-temple-sariska": {
    imageUrl: "/images/places/sariska-bhangarh/neelkanth-temple-sariska.webp",
    visualDescription: "Ruined 6th-to-10th-century stone temple complex deep in the hills featuring detailed erotic and divine carvings resembling Khajuraho.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "6th-century",
      "neelkanth",
      "neelkanth-ancient",
      "neelkanth-ancient-6th-century",
      "neelkanth-ancient-6th-century-of-sariska-bhangarh",
      "neelkanth-ancient-6th-century-sariska-bhangarh",
      "neelkanth-ancient-sariska-bhangarh",
      "neelkanth-ancient-temple-complex",
      "neelkanth-ancient-temple-complex-6th-century",
      "neelkanth-sariska-bhangarh",
      "neelkanth-temple-sariska",
      "sariska-bhangarh-neelkanth-ancient-6th-century"
    ]
  },
  "sariska-bhangarh:bhartrihari-temple-kund": {
    imageUrl: "/images/places/sariska-bhangarh/bhartrihari-temple-kund.webp",
    visualDescription: "Ancient pilgrimage site where King Bhartrihari of Ujjain renounced his throne and performed deep meditation in an Aravalli valley.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bhartrihari",
      "bhartrihari-sacred",
      "bhartrihari-sacred-kund",
      "bhartrihari-sacred-kund-of-sariska-bhangarh",
      "bhartrihari-sacred-kund-sariska-bhangarh",
      "bhartrihari-sacred-sariska-bhangarh",
      "bhartrihari-sariska-bhangarh",
      "bhartrihari-temple",
      "bhartrihari-temple-and-sacred-kund",
      "bhartrihari-temple-kund",
      "sacred-kund",
      "sariska-bhangarh-bhartrihari-sacred-kund"
    ]
  },
  "sariska-bhangarh:sariska-palace-courtyard": {
    imageUrl: "/images/places/sariska-bhangarh/sariska-palace-courtyard.webp",
    visualDescription: "1892 hunting lodge built by Maharaja Sawai Jai Singh of Alwar, blending French and Rajput architecture with sprawling lawns and royal tea service.",
    category: "Cafés & Bakery",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sariska",
      "sariska-bhangarh-sariska-french-courtyards",
      "sariska-french",
      "sariska-french-courtyards",
      "sariska-french-courtyards-of-sariska-bhangarh",
      "sariska-french-courtyards-sariska-bhangarh",
      "sariska-french-sariska-bhangarh",
      "sariska-palace-courtyard",
      "sariska-sariska-bhangarh",
      "the-sariska-palace-royal-french-courtyards"
    ]
  },
  "sariska-bhangarh:gola-ka-baas-dhaba": {
    imageUrl: "/images/places/sariska-bhangarh/gola-ka-baas-dhaba.webp",
    visualDescription: "Authentic rural roadside eatery near Bhangarh serving clay oven Baati, smoked Dal, spicy Lehsun ki Chutney, and fresh buttermilk.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "gola",
      "gola-ka",
      "gola-ka-baas-dhaba",
      "gola-ka-baas-traditional-rajasthani",
      "gola-ka-baas-traditional-rajasthani-dhaba",
      "gola-ka-baas-traditional-rajasthani-of-sariska-bhangarh",
      "gola-ka-baas-traditional-rajasthani-sariska-bhangarh",
      "gola-ka-sariska-bhangarh",
      "gola-sariska-bhangarh",
      "sariska-bhangarh-gola-ka-baas-traditional-rajasthani"
    ]
  },
  "spiti:key-monastery": {
    imageUrl: "/images/places/spiti/key-monastery.webp",
    visualDescription: "Perched at 4,166m atop a conical hill in the Spiti Valley, Key Gompa is a fortress-like Buddhist monastery housing ancient murals and sacred texts.",
    category: "Must Visit",
    semanticTheme: "monastery",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "11th-century-fort-monastery",
      "key-gompa",
      "key-gompa-11th-century",
      "key-gompa-11th-century-fort-monastery",
      "key-gompa-11th-century-of-spiti",
      "key-gompa-11th-century-spiti",
      "key-gompa-spiti",
      "key-monastery",
      "spiti-key-gompa-11th-century"
    ]
  },
  "spiti:dhankar-monastery": {
    imageUrl: "/images/places/spiti/dhankar-monastery.webp",
    visualDescription: "The dramatic ancient capital of Spiti, clinging precariously to a razor-sharp cliff 300m above the confluence of Spiti and Pin rivers.",
    category: "Culture & Heritage",
    semanticTheme: "monastery",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "cliffside-fortress",
      "dhankar",
      "dhankar-gompa",
      "dhankar-gompa-and-cliffside-fortress",
      "dhankar-gompa-cliffside-fortress",
      "dhankar-gompa-cliffside-fortress-of-spiti",
      "dhankar-gompa-cliffside-fortress-spiti",
      "dhankar-gompa-spiti",
      "dhankar-monastery",
      "dhankar-spiti",
      "spiti-dhankar-gompa-cliffside-fortress"
    ]
  },
  "spiti:hikkim-post-office": {
    imageUrl: "/images/places/spiti/hikkim-post-office.webp",
    visualDescription: "Located at 4,400m elevation, sending a handwritten postcard from this whitewashed stone post office is a timeless Himalayan tradition.",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "hikkim",
      "hikkim-post-office",
      "hikkim-spiti",
      "hikkim-worlds",
      "hikkim-worlds-highest-post-office",
      "hikkim-worlds-highest-post-office-of-spiti",
      "hikkim-worlds-highest-post-office-spiti",
      "hikkim-worlds-spiti",
      "spiti-hikkim-worlds-highest-post-office",
      "worlds-highest-post-office"
    ]
  },
  "spiti:chandra-taal": {
    imageUrl: "/images/places/spiti/chandra-taal.webp",
    visualDescription: "A breathtaking high-altitude crescent lake at 4,300m surrounded by scree mountains, reflecting deep azure blues and dramatic cloudscapes.",
    category: "Nature & Trails",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chandra-taal",
      "chandratal",
      "chandratal-crescent",
      "chandratal-crescent-moon",
      "chandratal-crescent-moon-lake",
      "chandratal-crescent-moon-of-spiti",
      "chandratal-crescent-moon-spiti",
      "chandratal-crescent-spiti",
      "chandratal-spiti",
      "crescent-moon-lake",
      "spiti-chandratal-crescent-moon"
    ]
  },
  "spiti:langza-buddha": {
    imageUrl: "/images/places/spiti/langza-buddha.webp",
    visualDescription: "High village guarded by a giant golden Buddha statue facing Chau Chau Kang Nilda peak, famed for prehistoric ammonite sea fossils.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "langza",
      "langza-buddha",
      "langza-giant",
      "langza-giant-buddha",
      "langza-giant-buddha-and-marine-fossil-village",
      "langza-giant-buddha-marine-fossil",
      "langza-giant-buddha-marine-fossil-of-spiti",
      "langza-giant-buddha-marine-fossil-spiti",
      "langza-giant-spiti",
      "langza-spiti",
      "marine-fossil-village",
      "spiti-langza-giant-buddha-marine-fossil"
    ]
  },
  "spiti:komic-village": {
    imageUrl: "/images/places/spiti/komic-village.webp",
    visualDescription: "Sitting at 4,587m, this stark village features the 14th-century Tangyud Gompa and the world's highest eco-café.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "komic",
      "komic-spiti",
      "komic-village",
      "komic-worlds",
      "komic-worlds-highest-motor-connected",
      "komic-worlds-highest-motor-connected-of-spiti",
      "komic-worlds-highest-motor-connected-spiti",
      "komic-worlds-highest-motor-connected-village",
      "komic-worlds-spiti",
      "spiti-komic-worlds-highest-motor-connected",
      "worlds-highest-motor-connected-village"
    ]
  },
  "spiti:pin-valley-park": {
    imageUrl: "/images/places/spiti/pin-valley-park.webp",
    visualDescription: "Glacial mountain valley renowned for rare snow leopards, Siberian ibex, and the endpoint village of Mudh with emerald barley fields.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mudh-village",
      "pin-valley",
      "pin-valley-national-mudh",
      "pin-valley-national-mudh-of-spiti",
      "pin-valley-national-mudh-spiti",
      "pin-valley-national-park",
      "pin-valley-national-park-and-mudh-village",
      "pin-valley-park",
      "pin-valley-spiti",
      "spiti-pin-valley-national-mudh"
    ]
  },
  "spiti:cafe-deyzor": {
    imageUrl: "/images/places/spiti/cafe-deyzor.webp",
    visualDescription: "Beloved cozy dining den in Kaza serving Spitian sea buckthorn drinks, yak cheese pastas, apple crumble, and hot momos.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "cafe-deyzor",
      "café",
      "café-deyzor",
      "café-deyzor-and-travelers-lounge",
      "café-deyzor-spiti",
      "café-deyzor-travelers",
      "café-deyzor-travelers-of-spiti",
      "café-deyzor-travelers-spiti",
      "café-spiti",
      "spiti-café-deyzor-travelers",
      "travelers-lounge"
    ]
  },
  "tungnath-chandrashila:tungnath-temple": {
    imageUrl: "/images/places/tungnath-chandrashila/tungnath-temple.webp",
    visualDescription: "Perched at 3,680m in the Garhwal Himalayas, Tungnath is the highest of the Panch Kedar temples, dedicated to Lord Shiva and built of black stone.",
    category: "Must Visit",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "tungnath",
      "tungnath-chandrashila-tungnath-worlds-highest-shiva-shrine",
      "tungnath-temple",
      "tungnath-tungnath-chandrashila",
      "tungnath-worlds",
      "tungnath-worlds-highest-shiva-shrine",
      "tungnath-worlds-highest-shiva-shrine-of-tungnath-chandrashila",
      "tungnath-worlds-highest-shiva-shrine-tungnath-chandrashila",
      "tungnath-worlds-tungnath-chandrashila",
      "worlds-highest-shiva-shrine"
    ]
  },
  "tungnath-chandrashila:chandrashila-summit": {
    imageUrl: "/images/places/tungnath-chandrashila/chandrashila-summit.webp",
    visualDescription: "The Moon Rock summit (4,000m) 1.5 km above Tungnath, offering an awe-inspiring 360-degree panorama of Nanda Devi, Trishul, and Chaukhamba peaks.",
    category: "Adventure & Treks",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "000m-peak-summit",
      "chandrashila",
      "chandrashila-4",
      "chandrashila-4000m",
      "chandrashila-4000m-peak-summit",
      "chandrashila-4000m-peak-summit-of-tungnath-chandrashila",
      "chandrashila-4000m-peak-summit-tungnath-chandrashila",
      "chandrashila-4000m-tungnath-chandrashila",
      "chandrashila-summit",
      "chandrashila-tungnath-chandrashila",
      "tungnath-chandrashila-chandrashila-4000m-peak-summit"
    ]
  },
  "tungnath-chandrashila:chopta-meadows-bugyal": {
    imageUrl: "/images/places/tungnath-chandrashila/chopta-meadows-bugyal.webp",
    visualDescription: "Lush undulating high-altitude alpine grasslands (bugyals) at 2,700m flanked by dense deodar, pine, and scarlet rhododendron forests.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chopta",
      "chopta-alpine",
      "chopta-alpine-meadows",
      "chopta-alpine-meadows-mini-switzerland",
      "chopta-alpine-meadows-mini-switzerland-of-tungnath-chandrashila",
      "chopta-alpine-meadows-mini-switzerland-tungnath-chandrashila",
      "chopta-alpine-tungnath-chandrashila",
      "chopta-meadows-bugyal",
      "chopta-tungnath-chandrashila",
      "mini-switzerland",
      "tungnath-chandrashila-chopta-alpine-meadows-mini-switzerland"
    ]
  },
  "tungnath-chandrashila:deoria-tal-lake": {
    imageUrl: "/images/places/tungnath-chandrashila/deoria-tal-lake.webp",
    visualDescription: "An emerald high-altitude lake at 2,438m reflecting the four-peaked Chaukhamba mountain massif on its still mirror-like water surface.",
    category: "Nature & Trails",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "deoria",
      "deoria-tal",
      "deoria-tal-lake",
      "deoria-tal-sacred-reflection",
      "deoria-tal-sacred-reflection-lake",
      "deoria-tal-sacred-reflection-of-tungnath-chandrashila",
      "deoria-tal-sacred-reflection-tungnath-chandrashila",
      "deoria-tal-tungnath-chandrashila",
      "deoria-tungnath-chandrashila",
      "tungnath-chandrashila-deoria-tal-sacred-reflection"
    ]
  },
  "tungnath-chandrashila:rohida-forest-trail": {
    imageUrl: "/images/places/tungnath-chandrashila/rohida-forest-trail.webp",
    visualDescription: "Ancient moss-draped evergreen oak trail blooming with crimson rhododendrons in spring, home to rare Himalayan monal pheasants.",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "rhododendron-forest-walk",
      "rohida",
      "rohida-forest-trail",
      "rohida-oak",
      "rohida-oak-and-rhododendron-forest-walk",
      "rohida-oak-rhododendron",
      "rohida-oak-rhododendron-of-tungnath-chandrashila",
      "rohida-oak-rhododendron-tungnath-chandrashila",
      "rohida-oak-tungnath-chandrashila",
      "rohida-tungnath-chandrashila",
      "tungnath-chandrashila-rohida-oak-rhododendron"
    ]
  },
  "tungnath-chandrashila:dugalbitta-eco-glade": {
    imageUrl: "/images/places/tungnath-chandrashila/dugalbitta-eco-glade.webp",
    visualDescription: "Peaceful riverside glade 6 km below Chopta offering traditional wooden tea dhabas, local Garhwali red rice meals, and camp sites.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dugalbitta",
      "dugalbitta-eco",
      "dugalbitta-eco-camp-glade",
      "dugalbitta-eco-camp-glade-of-tungnath-chandrashila",
      "dugalbitta-eco-camp-glade-tungnath-chandrashila",
      "dugalbitta-eco-glade",
      "dugalbitta-eco-tungnath-chandrashila",
      "dugalbitta-tungnath-chandrashila",
      "tungnath-chandrashila-dugalbitta-eco-camp-glade"
    ]
  },
  "tungnath-chandrashila:ukhimath-omkareshwar": {
    imageUrl: "/images/places/tungnath-chandrashila/ukhimath-omkareshwar.webp",
    visualDescription: "The historic 1,200-year-old wooden seat where Lord Kedarnath and Lord Madhyamaheshwar are worshipped during winter snowfall.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "tungnath-chandrashila-ukhimath-omkareshwar-winter",
      "ukhimath",
      "ukhimath-omkareshwar",
      "ukhimath-omkareshwar-tungnath-chandrashila",
      "ukhimath-omkareshwar-winter",
      "ukhimath-omkareshwar-winter-of-tungnath-chandrashila",
      "ukhimath-omkareshwar-winter-temple",
      "ukhimath-omkareshwar-winter-tungnath-chandrashila",
      "ukhimath-tungnath-chandrashila"
    ]
  },
  "tungnath-chandrashila:sari-village-base": {
    imageUrl: "/images/places/tungnath-chandrashila/sari-village-base.webp",
    visualDescription: "Traditional stone-roofed Garhwali hamlet situated amidst terraced apple orchards, famous for authentic Mandua (finger millet) rotis and Jhangora kh...",
    category: "Local Food",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "homestay-walk",
      "sari",
      "sari-apple",
      "sari-apple-terraces-homestay",
      "sari-apple-terraces-homestay-of-tungnath-chandrashila",
      "sari-apple-terraces-homestay-tungnath-chandrashila",
      "sari-apple-tungnath-chandrashila",
      "sari-tungnath-chandrashila",
      "sari-village-apple-terraces",
      "sari-village-apple-terraces-and-homestay-walk",
      "sari-village-base",
      "tungnath-chandrashila-sari-apple-terraces-homestay"
    ]
  },
  "udaipur:city-palace-udaipur": {
    imageUrl: "/images/places/udaipur/city-palace-udaipur.webp",
    visualDescription: "Rajasthan's largest palace complex perched over Lake Pichola with ornate courtyards, mirror work, and marble balconies.",
    category: "Must Visit",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "city-palace",
      "city-palace-complex",
      "city-palace-complex-and-zenana-mahal",
      "city-palace-udaipur",
      "udaipur-zenana-mahal",
      "zenana",
      "zenana-mahal",
      "zenana-mahal-of-udaipur",
      "zenana-mahal-udaipur",
      "zenana-udaipur"
    ]
  },
  "udaipur:lake-pichola-boat-ride": {
    imageUrl: "/images/places/udaipur/lake-pichola-boat-ride.webp",
    visualDescription: "Scenic boat cruise across Lake Pichola offering close views of Jag Mandir Island, Taj Lake Palace, and the Old City ghats.",
    category: "Must Visit",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "island-cruise",
      "lake-pichola-boat-ride",
      "lake-pichola-ghats",
      "lake-pichola-ghats-and-island-cruise",
      "pichola",
      "pichola-ghats",
      "pichola-ghats-island-cruise",
      "pichola-ghats-island-cruise-of-udaipur",
      "pichola-ghats-island-cruise-udaipur",
      "pichola-ghats-udaipur",
      "pichola-udaipur",
      "udaipur-pichola-ghats-island-cruise"
    ]
  },
  "udaipur:bagore-ki-haveli": {
    imageUrl: "/images/places/udaipur/bagore-ki-haveli.webp",
    visualDescription: "18th-century waterfront haveli at Gangaur Ghat hosting the nightly Dharohar cultural folk dance and puppet performance.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bagore",
      "bagore-ki",
      "bagore-ki-haveli",
      "bagore-ki-haveli-and-dharohar-dance",
      "bagore-ki-haveli-dharohar-dance",
      "bagore-ki-haveli-dharohar-dance-of-udaipur",
      "bagore-ki-haveli-dharohar-dance-udaipur",
      "bagore-ki-udaipur",
      "bagore-udaipur",
      "dharohar-dance",
      "udaipur-bagore-ki-haveli-dharohar-dance"
    ]
  },
  "udaipur:ambrai-ghat": {
    imageUrl: "/images/places/udaipur/ambrai-ghat.webp",
    visualDescription: "Peaceful marble ghat located directly across from the City Palace, offering the most poetic unobstructed water views in Udaipur.",
    category: "Hidden Gems",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "ambrai",
      "ambrai-ghat",
      "ambrai-ghat-sunset-promenade",
      "ambrai-ghat-sunset-promenade-manjhi-ghat",
      "ambrai-promenade",
      "ambrai-promenade-manjhi",
      "ambrai-promenade-manjhi-of-udaipur",
      "ambrai-promenade-manjhi-udaipur",
      "ambrai-promenade-udaipur",
      "ambrai-udaipur",
      "manjhi-ghat",
      "udaipur-ambrai-promenade-manjhi"
    ]
  },
  "udaipur:saheliyon-ki-bari": {
    imageUrl: "/images/places/udaipur/saheliyon-ki-bari.webp",
    visualDescription: "Historic royal garden built in the 18th century featuring marble lotus fountains, shaded bougainvillea walkways, and bird pools.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "garden-of-maidens",
      "saheliyon",
      "saheliyon-ki",
      "saheliyon-ki-bari",
      "saheliyon-ki-bari-garden-of-maidens",
      "saheliyon-ki-bari-of-maidens",
      "saheliyon-ki-bari-of-maidens-of-udaipur",
      "saheliyon-ki-bari-of-maidens-udaipur",
      "saheliyon-ki-udaipur",
      "saheliyon-udaipur",
      "udaipur-saheliyon-ki-bari-of-maidens"
    ]
  },
  "udaipur:sajjangarh-monsoon-palace": {
    imageUrl: "/images/places/udaipur/sajjangarh-monsoon-palace.webp",
    visualDescription: "White marble hilltop palace perched 944m high on Bansdara mountain with panoramic views of Udaipur's lakes and Aravalli hills.",
    category: "Adventure & Treks",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sajjangarh",
      "sajjangarh-monsoon",
      "sajjangarh-monsoon-of-udaipur",
      "sajjangarh-monsoon-palace",
      "sajjangarh-monsoon-palace-ridge",
      "sajjangarh-monsoon-udaipur",
      "sajjangarh-udaipur",
      "udaipur-sajjangarh-monsoon"
    ]
  },
  "udaipur:jheels-ginger-coffee": {
    imageUrl: "/images/places/udaipur/jheels-ginger-coffee.webp",
    visualDescription: "Intimate lakeside café with overhanging stone jharokha balconies serving specialty coffees, lemon tarts, and fresh shakes.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bakery",
      "jheels",
      "jheels-ginger",
      "jheels-ginger-coffee",
      "jheels-ginger-coffee-bar",
      "jheels-ginger-coffee-bar-and-bakery",
      "jheels-ginger-coffee-bar-bakery",
      "jheels-ginger-coffee-bar-bakery-of-udaipur",
      "jheels-ginger-coffee-bar-bakery-udaipur",
      "jheels-ginger-udaipur",
      "jheels-udaipur",
      "udaipur-jheels-ginger-coffee-bar-bakery"
    ]
  },
  "udaipur:natraj-dining-hall": {
    imageUrl: "/images/places/udaipur/natraj-dining-hall.webp",
    visualDescription: "Celebrated local dining hall serving authentic unlimited Rajasthani-Gujarati thalis featuring Dal Baati Churma, Gatta Curry, and Kadhai.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "natraj",
      "natraj-dining-hall",
      "natraj-dining-hall-unlimited-mewari-thali",
      "natraj-udaipur",
      "natraj-unlimited",
      "natraj-unlimited-mewari-thali",
      "natraj-unlimited-mewari-thali-of-udaipur",
      "natraj-unlimited-mewari-thali-udaipur",
      "natraj-unlimited-udaipur",
      "udaipur-natraj-unlimited-mewari-thali",
      "unlimited-mewari-thali"
    ]
  },
  "varanasi:dashashwamedh-ghat-aarti": {
    imageUrl: "/images/places/varanasi/dashashwamedh-ghat-aarti.webp",
    visualDescription: "The world-renowned sacred fire ritual performed at twilight by saffron-clad priests with multi-tiered brass lamps and conch shells.",
    category: "Must Visit",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dashashwamedh",
      "dashashwamedh-evening",
      "dashashwamedh-evening-maha-aarti",
      "dashashwamedh-evening-maha-aarti-of-varanasi",
      "dashashwamedh-evening-maha-aarti-varanasi",
      "dashashwamedh-evening-varanasi",
      "dashashwamedh-ghat-aarti",
      "dashashwamedh-ghat-evening-maha-aarti",
      "dashashwamedh-varanasi",
      "varanasi-dashashwamedh-evening-maha-aarti"
    ]
  },
  "varanasi:assi-ghat-subah-e-banaras": {
    imageUrl: "/images/places/varanasi/assi-ghat-subah-e-banaras.webp",
    visualDescription: "Dawn cultural ceremony featuring Vedic chanting, sunrise Yajna, classical Indian raga performances, and group yoga by the river.",
    category: "Must Visit",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "assi",
      "assi-ghat-subah-e-banaras",
      "assi-ghat-subah-e-banaras-morning-ceremony",
      "assi-subah",
      "assi-subah-e-banaras-morning-ceremony",
      "assi-subah-e-banaras-morning-ceremony-of-varanasi",
      "assi-subah-e-banaras-morning-ceremony-varanasi",
      "assi-subah-varanasi",
      "assi-varanasi",
      "varanasi-assi-subah-e-banaras-morning-ceremony"
    ]
  },
  "varanasi:kashi-vishwanath-corridor": {
    imageUrl: "/images/places/varanasi/kashi-vishwanath-corridor.webp",
    visualDescription: "One of the 12 sacred Jyotirlingas, newly restored with an expansive red sandstone corridor connecting directly to the Ganga riverbank.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kashi",
      "kashi-varanasi",
      "kashi-vishwanath",
      "kashi-vishwanath-corridor",
      "kashi-vishwanath-corridor-of-varanasi",
      "kashi-vishwanath-corridor-varanasi",
      "kashi-vishwanath-temple-corridor",
      "kashi-vishwanath-varanasi",
      "varanasi-kashi-vishwanath-corridor"
    ]
  },
  "varanasi:blue-lassi-shop": {
    imageUrl: "/images/places/varanasi/blue-lassi-shop.webp",
    visualDescription: "Celebrated hole-in-the-wall shop serving over 80 varieties of handcrafted hand-churned lassi served in traditional earthen kulhads.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "blue",
      "blue-lassi",
      "blue-lassi-shop",
      "blue-lassi-shop-historic-churn-since-1925",
      "blue-lassi-shop-historic-churn-since-1925-of-varanasi",
      "blue-lassi-shop-historic-churn-since-1925-varanasi",
      "blue-lassi-varanasi",
      "blue-varanasi",
      "historic-churn-since-1925",
      "varanasi-blue-lassi-shop-historic-churn-since-1925"
    ]
  },
  "varanasi:sarnath-deer-park": {
    imageUrl: "/images/places/varanasi/sarnath-deer-park.webp",
    visualDescription: "The sacred site where Lord Buddha delivered his first sermon after enlightenment; features the massive 43m Dhamek Stupa and Ashokan Pillar.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "deer-park",
      "sarnath",
      "sarnath-deer-park",
      "sarnath-dhamek",
      "sarnath-dhamek-stupa",
      "sarnath-dhamek-stupa-and-deer-park",
      "sarnath-dhamek-stupa-deer",
      "sarnath-dhamek-stupa-deer-of-varanasi",
      "sarnath-dhamek-stupa-deer-varanasi",
      "sarnath-dhamek-varanasi",
      "sarnath-varanasi",
      "varanasi-sarnath-dhamek-stupa-deer"
    ]
  },
  "varanasi:manikarnika-ghat": {
    imageUrl: "/images/places/varanasi/manikarnika-ghat.webp",
    visualDescription: "The primary sacred cremation ghat of Varanasi where the sacred funeral pyre has burned continuously for over two millennia.",
    category: "Hidden Gems",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "manikarnika",
      "manikarnika-eternal",
      "manikarnika-eternal-flame",
      "manikarnika-eternal-flame-of-varanasi",
      "manikarnika-eternal-flame-varanasi",
      "manikarnika-eternal-varanasi",
      "manikarnika-ghat",
      "manikarnika-ghat-the-eternal-flame",
      "manikarnika-varanasi",
      "the-eternal-flame",
      "varanasi-manikarnika-eternal-flame"
    ]
  },
  "varanasi:ramnagar-fort": {
    imageUrl: "/images/places/varanasi/ramnagar-fort.webp",
    visualDescription: "18th-century cream-coloured sandstone fortification on the eastern bank of the Ganga, housing royal vintage cars, palanquins, and medieval armories.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "ramnagar",
      "ramnagar-fort",
      "ramnagar-fort-and-vintage-royal-museum",
      "ramnagar-varanasi",
      "ramnagar-vintage",
      "ramnagar-vintage-museum",
      "ramnagar-vintage-museum-of-varanasi",
      "ramnagar-vintage-museum-varanasi",
      "ramnagar-vintage-varanasi",
      "varanasi-ramnagar-vintage-museum",
      "vintage-royal-museum"
    ]
  },
  "varanasi:kashi-tea-stall": {
    imageUrl: "/images/places/varanasi/kashi-tea-stall.webp",
    visualDescription: "Iconic alley tea corner serving spiced lemon tea, rich saffron malai toast, and seasonal winter Malaiyo (foamed milk sweet).",
    category: "Cafés & Bakery",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kashi-tea-stall",
      "laxmi",
      "laxmi-tea",
      "laxmi-tea-stall",
      "laxmi-tea-stall-and-malaiyo-hub",
      "laxmi-tea-stall-malaiyo-hub",
      "laxmi-tea-stall-malaiyo-hub-of-varanasi",
      "laxmi-tea-stall-malaiyo-hub-varanasi",
      "laxmi-tea-varanasi",
      "laxmi-varanasi",
      "malaiyo-hub",
      "varanasi-laxmi-tea-stall-malaiyo-hub"
    ]
  }
};

export const EXACT_HOTEL_REGISTRY: Record<string, ExactPlaceEntry> = {
  "agra:the-oberoi-amarvilas": {
    imageUrl: "/images/places/agra/stays/the-oberoi-amarvilas.webp",
    visualDescription: "Verified property artwork for The Oberoi Amarvilas in Agra.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Ultra-Luxury Taj View Palace",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "agra-oberoi-amarvilas",
      "oberoi",
      "oberoi-agra",
      "oberoi-amarvilas",
      "oberoi-amarvilas-agra",
      "oberoi-amarvilas-of-agra",
      "the-oberoi-amarvilas"
    ]
  },
  "agra:itc-mughal-luxury-collection": {
    imageUrl: "/images/places/agra/stays/itc-mughal-luxury-collection.webp",
    visualDescription: "Verified property artwork for ITC Mughal Luxury Collection in Agra.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Mughal Architecture Luxury Resort",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "agra-itc-mughal-collection",
      "itc-mughal",
      "itc-mughal-agra",
      "itc-mughal-collection",
      "itc-mughal-collection-agra",
      "itc-mughal-collection-of-agra",
      "itc-mughal-luxury-collection"
    ]
  },
  "agra:coral-tree-homestay": {
    imageUrl: "/images/places/agra/stays/coral-tree-homestay.webp",
    visualDescription: "Verified property artwork for Coral Tree Homestay in Agra.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Eco Boutique Garden Homestay",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "agra-coral-tree-homestay",
      "coral",
      "coral-agra",
      "coral-tree",
      "coral-tree-agra",
      "coral-tree-homestay",
      "coral-tree-homestay-agra",
      "coral-tree-homestay-of-agra"
    ]
  },
  "agra:zostel-agra": {
    imageUrl: "/images/places/agra/stays/zostel-agra.webp",
    visualDescription: "Verified property artwork for Zostel Agra in Agra.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Backpacker Monument Hostel",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "agra-zostel-agra",
      "zostel",
      "zostel-agra",
      "zostel-agra-agra",
      "zostel-agra-of-agra"
    ]
  },
  "alwar-siliserh:siliserh-lake-palace-rtdc-heritage": {
    imageUrl: "/images/places/alwar-siliserh/stays/siliserh-lake-palace-rtdc-heritage.webp",
    visualDescription: "Verified property artwork for Siliserh Lake Palace (RTDC Heritage) in Alwar-Siliserh.",
    category: "Stays & Sanctuaries",
    hotelStyle: "1845 Royal Hunting Lodge Palace",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "alwar-siliserh-siliserh-rtdc",
      "rtdc-heritage",
      "siliserh",
      "siliserh-alwar-siliserh",
      "siliserh-lake-palace",
      "siliserh-lake-palace-rtdc-heritage",
      "siliserh-rtdc",
      "siliserh-rtdc-alwar-siliserh",
      "siliserh-rtdc-of-alwar-siliserh"
    ]
  },
  "alwar-siliserh:dadhikar-fort-heritage-hotel": {
    imageUrl: "/images/places/alwar-siliserh/stays/dadhikar-fort-heritage-hotel.webp",
    visualDescription: "Verified property artwork for Dadhikar Fort Heritage Hotel in Alwar-Siliserh.",
    category: "Stays & Sanctuaries",
    hotelStyle: "1,100-Year-Old Aravalli Fortress",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dadhikar",
      "dadhikar-alwar-siliserh",
      "dadhikar-fort-heritage-hotel"
    ]
  },
  "alwar-siliserh:lemon-tree-hotel-alwar": {
    imageUrl: "/images/places/alwar-siliserh/stays/lemon-tree-hotel-alwar.webp",
    visualDescription: "Verified property artwork for Lemon Tree Hotel Alwar in Alwar-Siliserh.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Modern Comfortable City Hotel",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "alwar-siliserh-lemon-tree-alwar",
      "lemon",
      "lemon-alwar-siliserh",
      "lemon-tree",
      "lemon-tree-alwar",
      "lemon-tree-alwar-alwar-siliserh",
      "lemon-tree-alwar-of-alwar-siliserh",
      "lemon-tree-alwar-siliserh",
      "lemon-tree-hotel-alwar"
    ]
  },
  "alwar-siliserh:fort-view-homestay-alwar": {
    imageUrl: "/images/places/alwar-siliserh/stays/fort-view-homestay-alwar.webp",
    visualDescription: "Verified property artwork for Fort View Homestay Alwar in Alwar-Siliserh.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Traditional Rajasthani Town Homestay",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "alwar-siliserh-homestay-alwar",
      "fort-view-homestay-alwar",
      "homestay",
      "homestay-alwar",
      "homestay-alwar-alwar-siliserh",
      "homestay-alwar-of-alwar-siliserh",
      "homestay-alwar-siliserh"
    ]
  },
  "chandigarh:taj-chandigarh-sector-17": {
    imageUrl: "/images/places/chandigarh/stays/taj-chandigarh-sector-17.webp",
    visualDescription: "Verified property artwork for Taj Chandigarh Sector 17 in Chandigarh.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Luxury City Landmark Hotel",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chandigarh-taj-chandigarh-sector-17",
      "taj-chandigarh",
      "taj-chandigarh-chandigarh",
      "taj-chandigarh-sector-17",
      "taj-chandigarh-sector-17-chandigarh",
      "taj-chandigarh-sector-17-of-chandigarh",
      "taj-sector-17"
    ]
  },
  "chandigarh:the-lalit-chandigarh": {
    imageUrl: "/images/places/chandigarh/stays/the-lalit-chandigarh.webp",
    visualDescription: "Verified property artwork for The Lalit Chandigarh in Chandigarh.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Modern Le Corbusier Design Hotel",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chandigarh-lalit-chandigarh",
      "lalit",
      "lalit-chandigarh",
      "lalit-chandigarh-chandigarh",
      "lalit-chandigarh-of-chandigarh",
      "the-lalit",
      "the-lalit-chandigarh"
    ]
  },
  "chandigarh:jw-marriott-hotel-chandigarh": {
    imageUrl: "/images/places/chandigarh/stays/jw-marriott-hotel-chandigarh.webp",
    visualDescription: "Verified property artwork for JW Marriott Hotel Chandigarh in Chandigarh.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Contemporary Luxury Hotel",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chandigarh-jw-marriott-chandigarh",
      "jw-marriott",
      "jw-marriott-chandigarh",
      "jw-marriott-chandigarh-chandigarh",
      "jw-marriott-chandigarh-of-chandigarh",
      "jw-marriott-hotel",
      "jw-marriott-hotel-chandigarh"
    ]
  },
  "chandigarh:backpackers-villa-chandigarh": {
    imageUrl: "/images/places/chandigarh/stays/backpackers-villa-chandigarh.webp",
    visualDescription: "Verified property artwork for Backpackers Villa Chandigarh in Chandigarh.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Backpacker Boutique Hostel",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "backpackers",
      "backpackers-chandigarh",
      "backpackers-chandigarh-chandigarh",
      "backpackers-chandigarh-of-chandigarh",
      "backpackers-villa",
      "backpackers-villa-chandigarh",
      "chandigarh-backpackers-chandigarh"
    ]
  },
  "damdama-sohna:the-gateway-resort-damdama-lake": {
    imageUrl: "/images/places/damdama-sohna/stays/the-gateway-resort-damdama-lake.webp",
    visualDescription: "Verified property artwork for The Gateway Resort Damdama Lake in Damdama-Sohna.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Taj Luxury Nature Sanctuary",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "damdama-sohna-gateway-damdama",
      "gateway",
      "gateway-damdama",
      "gateway-damdama-damdama-sohna",
      "gateway-damdama-of-damdama-sohna",
      "gateway-damdama-sohna",
      "the-gateway-resort-damdama-lake"
    ]
  },
  "damdama-sohna:heritage-village-resort-and-spa": {
    imageUrl: "/images/places/damdama-sohna/stays/heritage-village-resort-spa.webp",
    visualDescription: "Verified property artwork for Heritage Village Resort & Spa in Damdama-Sohna.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Rajasthani Haveli Resort",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "heritage-village-resort",
      "heritage-village-resort-and-spa",
      "heritage-village-resort-spa"
    ]
  },
  "damdama-sohna:botanix-nature-resort-and-eco-camp": {
    imageUrl: "/images/places/damdama-sohna/stays/botanix-nature-resort-eco-camp.webp",
    visualDescription: "Verified property artwork for Botanix Nature Resort & Eco Camp in Damdama-Sohna.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Botanical Adventure Eco-Resort",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "botanix",
      "botanix-damdama-sohna",
      "botanix-nature",
      "botanix-nature-damdama-sohna",
      "botanix-nature-eco-camp",
      "botanix-nature-eco-camp-damdama-sohna",
      "botanix-nature-eco-camp-of-damdama-sohna",
      "botanix-nature-resort",
      "botanix-nature-resort-and-eco-camp",
      "botanix-nature-resort-eco-camp",
      "damdama-sohna-botanix-nature-eco-camp",
      "eco-camp"
    ]
  },
  "damdama-sohna:country-inn-and-suites-sohna-road": {
    imageUrl: "/images/places/damdama-sohna/stays/country-inn-suites-sohna-road.webp",
    visualDescription: "Verified property artwork for Country Inn & Suites Sohna Road in Damdama-Sohna.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Contemporary Country Resort",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "country",
      "country-damdama-sohna",
      "country-inn",
      "country-inn-and-suites-sohna-road",
      "country-inn-suites-sohna-road",
      "country-sohna",
      "country-sohna-damdama-sohna",
      "country-sohna-of-damdama-sohna",
      "damdama-sohna-country-sohna",
      "suites-sohna-road"
    ]
  },
  "dehradun:walterre-resort-boutique-lodge": {
    imageUrl: "/images/places/dehradun/stays/walterre-resort-boutique-lodge.webp",
    visualDescription: "Verified property artwork for Walterre Resort Boutique Lodge in Dehradun.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Colonial Foothill Sanctuary",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dehradun-walterre-lodge",
      "walterre",
      "walterre-dehradun",
      "walterre-lodge",
      "walterre-lodge-dehradun",
      "walterre-lodge-of-dehradun",
      "walterre-resort-boutique-lodge"
    ]
  },
  "dehradun:lemon-tree-hotel-dehradun": {
    imageUrl: "/images/places/dehradun/stays/lemon-tree-hotel-dehradun.webp",
    visualDescription: "Verified property artwork for Lemon Tree Hotel Dehradun in Dehradun.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Contemporary City Hotel",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dehradun-lemon-tree-dehradun",
      "lemon",
      "lemon-dehradun",
      "lemon-tree",
      "lemon-tree-dehradun",
      "lemon-tree-dehradun-dehradun",
      "lemon-tree-dehradun-of-dehradun",
      "lemon-tree-hotel",
      "lemon-tree-hotel-dehradun"
    ]
  },
  "dehradun:saiva-hill-resort-rajpur": {
    imageUrl: "/images/places/dehradun/stays/saiva-hill-resort-rajpur.webp",
    visualDescription: "Verified property artwork for Saiva Hill Resort Rajpur in Dehradun.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Eco-Retreat Foothill Sanctuary",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dehradun-saiva-rajpur",
      "saiva",
      "saiva-dehradun",
      "saiva-hill-resort-rajpur",
      "saiva-rajpur",
      "saiva-rajpur-dehradun",
      "saiva-rajpur-of-dehradun"
    ]
  },
  "dehradun:nomads-hostel-dehradun": {
    imageUrl: "/images/places/dehradun/stays/nomads-hostel-dehradun.webp",
    visualDescription: "Verified property artwork for Nomads Hostel Dehradun in Dehradun.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Backpacker Garden Hostel",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dehradun-nomads-dehradun",
      "nomads",
      "nomads-dehradun",
      "nomads-dehradun-dehradun",
      "nomads-dehradun-of-dehradun",
      "nomads-hostel",
      "nomads-hostel-dehradun"
    ]
  },
  "dharamshala:fortune-park-moksha": {
    imageUrl: "/images/places/dharamshala/stays/fortune-park-moksha.webp",
    visualDescription: "Verified property artwork for Fortune Park Moksha in Dharamshala.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Luxury Mountain Resort & Spa",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dharamshala-fortune-moksha",
      "fortune",
      "fortune-dharamshala",
      "fortune-moksha",
      "fortune-moksha-dharamshala",
      "fortune-moksha-of-dharamshala",
      "fortune-park-moksha"
    ]
  },
  "dharamshala:chonor-house-tibetan-guesthouse": {
    imageUrl: "/images/places/dharamshala/stays/chonor-house-tibetan-guesthouse.webp",
    visualDescription: "Verified property artwork for Chonor House Tibetan Guesthouse in Dharamshala.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Boutique Tibetan Heritage Guesthouse",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chonor",
      "chonor-dharamshala",
      "chonor-house-tibetan-guesthouse",
      "chonor-tibetan",
      "chonor-tibetan-dharamshala",
      "chonor-tibetan-guesthouse",
      "chonor-tibetan-guesthouse-dharamshala",
      "chonor-tibetan-guesthouse-of-dharamshala",
      "dharamshala-chonor-tibetan-guesthouse"
    ]
  },
  "dharamshala:clouds-end-villa-heritage-estate": {
    imageUrl: "/images/places/dharamshala/stays/clouds-end-villa-heritage-estate.webp",
    visualDescription: "Verified property artwork for Clouds End Villa Heritage Estate in Dharamshala.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Colonial Heritage Sanctuary",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "clouds",
      "clouds-dharamshala",
      "clouds-end",
      "clouds-end-dharamshala",
      "clouds-end-estate",
      "clouds-end-estate-dharamshala",
      "clouds-end-estate-of-dharamshala",
      "clouds-end-villa-heritage-estate",
      "dharamshala-clouds-end-estate"
    ]
  },
  "dharamshala:zostel-dharamkot": {
    imageUrl: "/images/places/dharamshala/stays/zostel-dharamkot.webp",
    visualDescription: "Verified property artwork for Zostel Dharamkot in Dharamshala.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Backpacker Forest Hostel",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dharamshala-zostel-dharamkot",
      "zostel",
      "zostel-dharamkot",
      "zostel-dharamkot-dharamshala",
      "zostel-dharamkot-of-dharamshala",
      "zostel-dharamshala"
    ]
  },
  "goa:ahilya-by-the-sea": {
    imageUrl: "/images/places/goa/stays/ahilya-by-the-sea.webp",
    visualDescription: "Verified property artwork for Ahilya by the Sea in Goa.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Heritage Luxury Sanctuary",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "ahilya",
      "ahilya-by",
      "ahilya-by-goa",
      "ahilya-by-sea",
      "ahilya-by-sea-goa",
      "ahilya-by-sea-of-goa",
      "ahilya-by-the-sea",
      "ahilya-goa",
      "goa-ahilya-by-sea"
    ]
  },
  "goa:the-postcard-velha": {
    imageUrl: "/images/places/goa/stays/the-postcard-velha.webp",
    visualDescription: "Verified property artwork for The Postcard Velha in Goa.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Boutique Estate",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "goa-postcard-velha",
      "postcard",
      "postcard-goa",
      "postcard-velha",
      "postcard-velha-goa",
      "postcard-velha-of-goa",
      "the-postcard-velha"
    ]
  },
  "goa:casa-da-graça-heritage-homestay": {
    imageUrl: "/images/places/goa/stays/casa-da-graça-heritage-homestay.webp",
    visualDescription: "Verified property artwork for Casa da Graça Heritage Homestay in Goa.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Portuguese Heritage Homestay",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "casa",
      "casa-da",
      "casa-da-goa",
      "casa-da-graça-heritage-homestay",
      "casa-da-graça-homestay",
      "casa-da-graça-homestay-goa",
      "casa-da-graça-homestay-of-goa",
      "casa-goa",
      "goa-casa-da-graça-homestay"
    ]
  },
  "goa:jungle-by-the-hosteller": {
    imageUrl: "/images/places/goa/stays/jungle-by-the-hosteller.webp",
    visualDescription: "Verified property artwork for Jungle by the Hosteller in Goa.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Backpacker Social Hostel",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "goa-jungle-by-hosteller",
      "jungle",
      "jungle-by",
      "jungle-by-goa",
      "jungle-by-hosteller",
      "jungle-by-hosteller-goa",
      "jungle-by-hosteller-of-goa",
      "jungle-by-the-hosteller",
      "jungle-goa"
    ]
  },
  "jaipur:samode-haveli": {
    imageUrl: "/images/places/jaipur/stays/samode-haveli.webp",
    visualDescription: "Verified property artwork for Samode Haveli in Jaipur.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Royal Heritage Haveli",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jaipur-samode-haveli",
      "samode",
      "samode-haveli",
      "samode-haveli-jaipur",
      "samode-haveli-of-jaipur",
      "samode-jaipur"
    ]
  },
  "jaipur:28-kothi-boutique-guesthouse": {
    imageUrl: "/images/places/jaipur/stays/28-kothi-boutique-guesthouse.webp",
    visualDescription: "Verified property artwork for 28 Kothi Boutique Guesthouse in Jaipur.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Design Boutique Stay",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "28-kothi",
      "28-kothi-boutique-guesthouse",
      "28-kothi-guesthouse",
      "28-kothi-guesthouse-jaipur",
      "28-kothi-guesthouse-of-jaipur",
      "28-kothi-jaipur",
      "jaipur-28-kothi-guesthouse"
    ]
  },
  "jaipur:royal-heritage-haveli-by-khatukar": {
    imageUrl: "/images/places/jaipur/stays/royal-heritage-haveli-by-khatukar.webp",
    visualDescription: "Verified property artwork for Royal Heritage Haveli by Khatukar in Jaipur.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Heritage Palace Sanctuary",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "haveli",
      "haveli-by",
      "haveli-by-jaipur",
      "haveli-by-khatukar",
      "haveli-by-khatukar-jaipur",
      "haveli-by-khatukar-of-jaipur",
      "haveli-jaipur",
      "jaipur-haveli-by-khatukar",
      "royal-heritage-haveli-by-khatukar"
    ]
  },
  "jaipur:moustache-jaipur": {
    imageUrl: "/images/places/jaipur/stays/moustache-jaipur.webp",
    visualDescription: "Verified property artwork for Moustache Jaipur in Jaipur.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Backpacker Cultural Hostel",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jaipur-moustache-jaipur",
      "moustache",
      "moustache-jaipur",
      "moustache-jaipur-jaipur",
      "moustache-jaipur-of-jaipur"
    ]
  },
  "jaisalmer:suryagarh-jaisalmer": {
    imageUrl: "/images/places/jaisalmer/stays/suryagarh-jaisalmer.webp",
    visualDescription: "Verified property artwork for Suryagarh Jaisalmer in Jaisalmer.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Luxury Desert Fortress Palace",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jaisalmer-suryagarh-jaisalmer",
      "suryagarh",
      "suryagarh-jaisalmer",
      "suryagarh-jaisalmer-jaisalmer",
      "suryagarh-jaisalmer-of-jaisalmer"
    ]
  },
  "jaisalmer:killa-bhawan-heritage-stay": {
    imageUrl: "/images/places/jaisalmer/stays/killa-bhawan-heritage-stay.webp",
    visualDescription: "Verified property artwork for Killa Bhawan Heritage Stay in Jaisalmer.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Inside Fort Heritage Boutique",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jaisalmer-killa-bhawan-stay",
      "killa",
      "killa-bhawan",
      "killa-bhawan-heritage-stay",
      "killa-bhawan-jaisalmer",
      "killa-bhawan-stay",
      "killa-bhawan-stay-jaisalmer",
      "killa-bhawan-stay-of-jaisalmer",
      "killa-jaisalmer"
    ]
  },
  "jaisalmer:jaisalmer-marriott-resort-and-spa": {
    imageUrl: "/images/places/jaisalmer/stays/jaisalmer-marriott-resort-spa.webp",
    visualDescription: "Verified property artwork for Jaisalmer Marriott Resort & Spa in Jaisalmer.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Modern Luxury Palace Resort",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jaisalmer",
      "jaisalmer-jaisalmer",
      "jaisalmer-jaisalmer-marriott-spa",
      "jaisalmer-marriott",
      "jaisalmer-marriott-jaisalmer",
      "jaisalmer-marriott-resort",
      "jaisalmer-marriott-resort-and-spa",
      "jaisalmer-marriott-resort-spa",
      "jaisalmer-marriott-spa",
      "jaisalmer-marriott-spa-jaisalmer",
      "jaisalmer-marriott-spa-of-jaisalmer",
      "marriott-resort-spa"
    ]
  },
  "jaisalmer:zostel-jaisalmer": {
    imageUrl: "/images/places/jaisalmer/stays/zostel-jaisalmer.webp",
    visualDescription: "Verified property artwork for Zostel Jaisalmer in Jaisalmer.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Backpacker Fort View Hostel",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jaisalmer-zostel-jaisalmer",
      "zostel",
      "zostel-jaisalmer",
      "zostel-jaisalmer-jaisalmer",
      "zostel-jaisalmer-of-jaisalmer"
    ]
  },
  "kainchi-dham:bara-bungalow-gethia-1898-heritage": {
    imageUrl: "/images/places/kainchi-dham/stays/bara-bungalow-gethia-1898-heritage.webp",
    visualDescription: "Verified property artwork for Bara Bungalow Gethia (1898 Heritage) in Kainchi-Dham.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Historic Kumaon Heritage Estate",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "1898-heritage",
      "bara",
      "bara-bungalow",
      "bara-bungalow-gethia",
      "bara-bungalow-gethia-1898",
      "bara-bungalow-gethia-1898-heritage",
      "bara-bungalow-gethia-1898-kainchi-dham",
      "bara-bungalow-gethia-1898-of-kainchi-dham",
      "bara-bungalow-kainchi-dham",
      "bara-kainchi-dham",
      "kainchi-dham-bara-bungalow-gethia-1898"
    ]
  },
  "kainchi-dham:the-hermitage-bhowali": {
    imageUrl: "/images/places/kainchi-dham/stays/the-hermitage-bhowali.webp",
    visualDescription: "Verified property artwork for The Hermitage Bhowali in Kainchi-Dham.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Boutique Pine Valley Sanctuary",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "hermitage",
      "hermitage-bhowali",
      "hermitage-bhowali-kainchi-dham",
      "hermitage-bhowali-of-kainchi-dham",
      "hermitage-kainchi-dham",
      "kainchi-dham-hermitage-bhowali",
      "the-hermitage-bhowali"
    ]
  },
  "kainchi-dham:kainchi-valley-spiritual-homestay": {
    imageUrl: "/images/places/kainchi-dham/stays/kainchi-valley-spiritual-homestay.webp",
    visualDescription: "Verified property artwork for Kainchi Valley Spiritual Homestay in Kainchi-Dham.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Devotional Valley Homestay",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kainchi",
      "kainchi-dham-kainchi-valley-spiritual-homestay",
      "kainchi-kainchi-dham",
      "kainchi-valley",
      "kainchi-valley-kainchi-dham",
      "kainchi-valley-spiritual-homestay",
      "kainchi-valley-spiritual-homestay-kainchi-dham",
      "kainchi-valley-spiritual-homestay-of-kainchi-dham"
    ]
  },
  "kainchi-dham:the-green-glade-resort-bhimtal": {
    imageUrl: "/images/places/kainchi-dham/stays/the-green-glade-resort-bhimtal.webp",
    visualDescription: "Verified property artwork for The Green Glade Resort Bhimtal in Kainchi-Dham.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Lakeside Valley Resort",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "green",
      "green-glade",
      "green-glade-bhimtal",
      "green-glade-bhimtal-kainchi-dham",
      "green-glade-bhimtal-of-kainchi-dham",
      "green-glade-kainchi-dham",
      "green-kainchi-dham",
      "kainchi-dham-green-glade-bhimtal",
      "the-green-glade-resort-bhimtal"
    ]
  },
  "kasol:the-himalayan-village": {
    imageUrl: "/images/places/kasol/stays/the-himalayan-village.webp",
    visualDescription: "Verified property artwork for The Himalayan Village in Kasol.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Kathkuni Heritage Eco-Resort",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "himalayan",
      "himalayan-kasol",
      "the-himalayan-village"
    ]
  },
  "kasol:parvati-kuteer-riverside-wood-cottages": {
    imageUrl: "/images/places/kasol/stays/parvati-kuteer-riverside-wood-cottages.webp",
    visualDescription: "Verified property artwork for Parvati Kuteer Riverside Wood Cottages in Kasol.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Boutique Riverside Sanctuary",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kasol-parvati-kuteer-wood",
      "parvati",
      "parvati-kasol",
      "parvati-kuteer",
      "parvati-kuteer-kasol",
      "parvati-kuteer-riverside-wood-cottages",
      "parvati-kuteer-wood",
      "parvati-kuteer-wood-kasol",
      "parvati-kuteer-wood-of-kasol"
    ]
  },
  "kasol:kasol-heights-resort": {
    imageUrl: "/images/places/kasol/stays/kasol-heights-resort.webp",
    visualDescription: "Verified property artwork for Kasol Heights Resort in Kasol.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Mountain View Resort",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "heights-resort",
      "kasol",
      "kasol-heights",
      "kasol-heights-kasol",
      "kasol-heights-of-kasol",
      "kasol-heights-resort",
      "kasol-kasol",
      "kasol-kasol-heights"
    ]
  },
  "kasol:the-hosteller-kasol-riverside": {
    imageUrl: "/images/places/kasol/stays/the-hosteller-kasol-riverside.webp",
    visualDescription: "Verified property artwork for The Hosteller Kasol (Riverside) in Kasol.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Backpacker Social River Hostel",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "hosteller",
      "hosteller-kasol",
      "hosteller-kasol-kasol",
      "hosteller-kasol-of-kasol",
      "kasol-hosteller-kasol",
      "the-hosteller-kasol",
      "the-hosteller-kasol-riverside",
      "the-hosteller-riverside"
    ]
  },
  "lansdowne:the-lansdowne-woods-boutique-resort": {
    imageUrl: "/images/places/lansdowne/stays/the-lansdowne-woods-boutique-resort.webp",
    visualDescription: "Verified property artwork for The Lansdowne Woods Boutique Resort in Lansdowne.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Boutique Pine Valley Sanctuary",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "lansdowne",
      "lansdowne-lansdowne",
      "lansdowne-lansdowne-woods",
      "lansdowne-woods",
      "lansdowne-woods-lansdowne",
      "lansdowne-woods-of-lansdowne",
      "the-lansdowne-woods-boutique-resort",
      "the-woods-boutique-resort"
    ]
  },
  "lansdowne:kasang-regency-hill-resort": {
    imageUrl: "/images/places/lansdowne/stays/kasang-regency-hill-resort.webp",
    visualDescription: "Verified property artwork for Kasang Regency Hill Resort in Lansdowne.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Garhwal Hilltop Resort",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kasang",
      "kasang-lansdowne",
      "kasang-regency",
      "kasang-regency-hill-resort",
      "kasang-regency-lansdowne",
      "kasang-regency-of-lansdowne",
      "lansdowne-kasang-regency"
    ]
  },
  "lansdowne:fairydale-resort-colonial-cottage": {
    imageUrl: "/images/places/lansdowne/stays/fairydale-resort-colonial-cottage.webp",
    visualDescription: "Verified property artwork for Fairydale Resort Colonial Cottage in Lansdowne.",
    category: "Stays & Sanctuaries",
    hotelStyle: "1912 Colonial Oak Cottage",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "fairydale",
      "fairydale-colonial",
      "fairydale-colonial-lansdowne",
      "fairydale-colonial-of-lansdowne",
      "fairydale-lansdowne",
      "fairydale-resort-colonial-cottage",
      "lansdowne-fairydale-colonial"
    ]
  },
  "lansdowne:sb-mount-resort-lansdowne": {
    imageUrl: "/images/places/lansdowne/stays/sb-mount-resort-lansdowne.webp",
    visualDescription: "Verified property artwork for SB Mount Resort Lansdowne in Lansdowne.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Mountain View Valley Resort",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "lansdowne-sb-mount-lansdowne",
      "sb-mount",
      "sb-mount-lansdowne",
      "sb-mount-lansdowne-lansdowne",
      "sb-mount-lansdowne-of-lansdowne",
      "sb-mount-resort",
      "sb-mount-resort-lansdowne"
    ]
  },
  "leh:the-grand-dragon-ladakh": {
    imageUrl: "/images/places/leh/stays/the-grand-dragon-ladakh.webp",
    visualDescription: "Verified property artwork for The Grand Dragon Ladakh in Leh.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Luxury High-Altitude Solar Hotel",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dragon",
      "dragon-ladakh",
      "dragon-ladakh-leh",
      "dragon-ladakh-of-leh",
      "dragon-leh",
      "leh-dragon-ladakh",
      "the-grand-dragon-ladakh"
    ]
  },
  "leh:nimmu-house-heritage-eco-resort": {
    imageUrl: "/images/places/leh/stays/nimmu-house-heritage-eco-resort.webp",
    visualDescription: "Verified property artwork for Nimmu House Heritage Eco-Resort in Leh.",
    category: "Stays & Sanctuaries",
    hotelStyle: "1905 Ladakhi Heritage Mansion",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "leh-nimmu-eco",
      "nimmu",
      "nimmu-eco",
      "nimmu-eco-leh",
      "nimmu-eco-of-leh",
      "nimmu-house-heritage-eco-resort",
      "nimmu-leh"
    ]
  },
  "leh:stok-palace-heritage-guesthouse": {
    imageUrl: "/images/places/leh/stays/stok-palace-heritage-guesthouse.webp",
    visualDescription: "Verified property artwork for Stok Palace Heritage Guesthouse in Leh.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Royal Residence Heritage Stay",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "leh-stok-guesthouse",
      "stok",
      "stok-guesthouse",
      "stok-guesthouse-leh",
      "stok-guesthouse-of-leh",
      "stok-leh",
      "stok-palace-heritage-guesthouse"
    ]
  },
  "leh:zostel-leh": {
    imageUrl: "/images/places/leh/stays/zostel-leh.webp",
    visualDescription: "Verified property artwork for Zostel Leh in Leh.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Backpacker High-Pass Hostel",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "leh-zostel-leh",
      "zostel",
      "zostel-leh",
      "zostel-leh-leh",
      "zostel-leh-of-leh"
    ]
  },
  "manali:the-himalayan-castle-and-stone-cottages": {
    imageUrl: "/images/places/manali/stays/the-himalayan-castle-stone-cottages.webp",
    visualDescription: "Verified property artwork for The Himalayan Castle & Stone Cottages in Manali.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Victorian Gothic Mountain Castle",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "himalayan",
      "himalayan-castle",
      "himalayan-castle-manali",
      "himalayan-castle-stone",
      "himalayan-castle-stone-manali",
      "himalayan-castle-stone-of-manali",
      "himalayan-manali",
      "manali-himalayan-castle-stone",
      "stone-cottages",
      "the-himalayan-castle",
      "the-himalayan-castle-and-stone-cottages",
      "the-himalayan-castle-stone-cottages"
    ]
  },
  "manali:larisa-resort-and-apple-orchard": {
    imageUrl: "/images/places/manali/stays/larisa-resort-apple-orchard.webp",
    visualDescription: "Verified property artwork for Larisa Resort & Apple Orchard in Manali.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Luxury Eco-Resort & Spa",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "apple-orchard",
      "larisa",
      "larisa-apple",
      "larisa-apple-manali",
      "larisa-apple-orchard",
      "larisa-apple-orchard-manali",
      "larisa-apple-orchard-of-manali",
      "larisa-manali",
      "larisa-resort",
      "larisa-resort-and-apple-orchard",
      "larisa-resort-apple-orchard",
      "manali-larisa-apple-orchard"
    ]
  },
  "manali:drifters-inn-and-wooden-loft": {
    imageUrl: "/images/places/manali/stays/drifters-inn-wooden-loft.webp",
    visualDescription: "Verified property artwork for Drifters' Inn & Wooden Loft in Manali.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Boutique Mountain Homestay",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "drifters",
      "drifters-inn",
      "drifters-inn-and-wooden-loft",
      "drifters-inn-wooden-loft",
      "drifters-manali",
      "drifters-wooden",
      "drifters-wooden-loft",
      "drifters-wooden-loft-manali",
      "drifters-wooden-loft-of-manali",
      "drifters-wooden-manali",
      "manali-drifters-wooden-loft",
      "wooden-loft"
    ]
  },
  "manali:zostel-manali-old-manali": {
    imageUrl: "/images/places/manali/stays/zostel-manali-old-manali.webp",
    visualDescription: "Verified property artwork for Zostel Manali (Old Manali) in Manali.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Backpacker Pine View Hostel",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "manali-zostel-manali-manali",
      "old-manali",
      "zostel",
      "zostel-manali",
      "zostel-manali-manali",
      "zostel-manali-manali-manali",
      "zostel-manali-manali-of-manali",
      "zostel-manali-old-manali",
      "zostel-old"
    ]
  },
  "mathura-vrindavan:nidhivan-sarovar-portico": {
    imageUrl: "/images/places/mathura-vrindavan/stays/nidhivan-sarovar-portico.webp",
    visualDescription: "Verified property artwork for Nidhivan Sarovar Portico in Mathura-Vrindavan.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Upscale Spiritual Pilgrimage Hotel",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mathura-vrindavan-nidhivan-sarovar-portico",
      "nidhivan",
      "nidhivan-mathura-vrindavan",
      "nidhivan-sarovar",
      "nidhivan-sarovar-mathura-vrindavan",
      "nidhivan-sarovar-portico",
      "nidhivan-sarovar-portico-mathura-vrindavan",
      "nidhivan-sarovar-portico-of-mathura-vrindavan"
    ]
  },
  "mathura-vrindavan:mvt-guesthouse-and-garden-restaurant": {
    imageUrl: "/images/places/mathura-vrindavan/stays/mvt-guesthouse-garden-restaurant.webp",
    visualDescription: "Verified property artwork for MVT Guesthouse & Garden Restaurant in Mathura-Vrindavan.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Boutique Vrindavan Ashram Guesthouse",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "garden-restaurant",
      "mathura-vrindavan-mvt-guesthouse-restaurant",
      "mvt-guesthouse",
      "mvt-guesthouse-and-garden-restaurant",
      "mvt-guesthouse-garden-restaurant",
      "mvt-guesthouse-mathura-vrindavan",
      "mvt-guesthouse-restaurant",
      "mvt-guesthouse-restaurant-mathura-vrindavan",
      "mvt-guesthouse-restaurant-of-mathura-vrindavan"
    ]
  },
  "mathura-vrindavan:brij-view-vrindavan-luxury-suites": {
    imageUrl: "/images/places/mathura-vrindavan/stays/brij-view-vrindavan-luxury-suites.webp",
    visualDescription: "Verified property artwork for Brij View Vrindavan Luxury Suites in Mathura-Vrindavan.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Boutique Temple View Suites",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "brij",
      "brij-mathura-vrindavan",
      "brij-view-vrindavan-luxury-suites",
      "brij-vrindavan",
      "brij-vrindavan-mathura-vrindavan",
      "brij-vrindavan-of-mathura-vrindavan",
      "mathura-vrindavan-brij-vrindavan"
    ]
  },
  "mathura-vrindavan:radha-krishna-kripa-dham-homestay": {
    imageUrl: "/images/places/mathura-vrindavan/stays/radha-krishna-kripa-dham-homestay.webp",
    visualDescription: "Verified property artwork for Radha Krishna Kripa Dham Homestay in Mathura-Vrindavan.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Traditional Braj Pilgrim Homestay",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mathura-vrindavan-radha-krishna-kripa-dham-homestay",
      "radha",
      "radha-krishna",
      "radha-krishna-kripa-dham-homestay",
      "radha-krishna-kripa-dham-homestay-mathura-vrindavan",
      "radha-krishna-kripa-dham-homestay-of-mathura-vrindavan",
      "radha-krishna-mathura-vrindavan",
      "radha-mathura-vrindavan"
    ]
  },
  "morni-hills:royal-morni-resort": {
    imageUrl: "/images/places/morni-hills/stays/royal-morni-resort.webp",
    visualDescription: "Verified property artwork for Royal Morni Resort in Morni-Hills.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Shivalik Mountain View Resort",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "morni",
      "morni-morni-hills",
      "royal-morni-resort"
    ]
  },
  "morni-hills:mountain-quail-tourist-resort-tikkar-taal": {
    imageUrl: "/images/places/morni-hills/stays/mountain-quail-tourist-resort-tikkar-taal.webp",
    visualDescription: "Verified property artwork for Mountain Quail Tourist Resort Tikkar Taal in Morni-Hills.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Lakeside Tourist Eco-Resort",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "morni-hills-mountain-quail-tourist-tikkar-taal",
      "mountain",
      "mountain-morni-hills",
      "mountain-quail",
      "mountain-quail-morni-hills",
      "mountain-quail-tourist-resort-tikkar-taal",
      "mountain-quail-tourist-tikkar-taal",
      "mountain-quail-tourist-tikkar-taal-morni-hills",
      "mountain-quail-tourist-tikkar-taal-of-morni-hills"
    ]
  },
  "morni-hills:shivalik-ridge-village-homestay": {
    imageUrl: "/images/places/morni-hills/stays/shivalik-ridge-village-homestay.webp",
    visualDescription: "Verified property artwork for Shivalik Ridge Village Homestay in Morni-Hills.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Traditional Hill Homestay",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "morni-hills-shivalik-homestay",
      "shivalik",
      "shivalik-homestay",
      "shivalik-homestay-morni-hills",
      "shivalik-homestay-of-morni-hills",
      "shivalik-morni-hills",
      "shivalik-ridge-village-homestay"
    ]
  },
  "morni-hills:hilltop-forest-cottage-morni": {
    imageUrl: "/images/places/morni-hills/stays/hilltop-forest-cottage-morni.webp",
    visualDescription: "Verified property artwork for Hilltop Forest Cottage Morni in Morni-Hills.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Boutique Wood Cottage",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "hilltop",
      "hilltop-forest-cottage-morni",
      "hilltop-morni",
      "hilltop-morni-hills",
      "hilltop-morni-morni-hills",
      "hilltop-morni-of-morni-hills",
      "morni-hills-hilltop-morni"
    ]
  },
  "munnar:windermere-estate": {
    imageUrl: "/images/places/munnar/stays/windermere-estate.webp",
    visualDescription: "Verified property artwork for Windermere Estate in Munnar.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Colonial Tea Plantation Retreat",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "munnar-windermere-estate",
      "windermere",
      "windermere-estate",
      "windermere-estate-munnar",
      "windermere-estate-of-munnar",
      "windermere-munnar"
    ]
  },
  "munnar:blanket-luxury-villa-and-spa": {
    imageUrl: "/images/places/munnar/stays/blanket-luxury-villa-spa.webp",
    visualDescription: "Verified property artwork for Blanket Luxury Villa & Spa in Munnar.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Attukad Waterfall Luxury Resort",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "blanket",
      "blanket-luxury-villa",
      "blanket-luxury-villa-and-spa",
      "blanket-luxury-villa-spa",
      "blanket-munnar",
      "blanket-spa",
      "blanket-spa-munnar",
      "blanket-spa-of-munnar",
      "munnar-blanket-spa"
    ]
  },
  "munnar:olive-brook-plantation-homestay": {
    imageUrl: "/images/places/munnar/stays/olive-brook-plantation-homestay.webp",
    visualDescription: "Verified property artwork for Olive Brook Plantation Homestay in Munnar.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Spice Garden Homestay",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "munnar-olive-brook-plantation-homestay",
      "olive",
      "olive-brook",
      "olive-brook-munnar",
      "olive-brook-plantation-homestay",
      "olive-brook-plantation-homestay-munnar",
      "olive-brook-plantation-homestay-of-munnar",
      "olive-munnar"
    ]
  },
  "munnar:the-hosteller-munnar": {
    imageUrl: "/images/places/munnar/stays/the-hosteller-munnar.webp",
    visualDescription: "Verified property artwork for The Hosteller Munnar in Munnar.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Backpacker Tea Hills Hostel",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "hosteller",
      "hosteller-munnar",
      "hosteller-munnar-munnar",
      "hosteller-munnar-of-munnar",
      "munnar-hosteller-munnar",
      "the-hosteller",
      "the-hosteller-munnar"
    ]
  },
  "murthal:grand-haveli-resort-murthal": {
    imageUrl: "/images/places/murthal/stays/grand-haveli-resort-murthal.webp",
    visualDescription: "Verified property artwork for Grand Haveli Resort Murthal in Murthal.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Royal Punjabi Heritage Resort",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "grand-haveli-resort",
      "grand-haveli-resort-murthal",
      "haveli",
      "haveli-murthal",
      "haveli-murthal-murthal",
      "haveli-murthal-of-murthal",
      "murthal-haveli-murthal"
    ]
  },
  "murthal:tivoli-heritage-grand-nh-44": {
    imageUrl: "/images/places/murthal/stays/tivoli-heritage-grand-nh-44.webp",
    visualDescription: "Verified property artwork for Tivoli Heritage Grand NH-44 in Murthal.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Luxury Highway Resort & Spa",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "murthal-tivoli-nh-44",
      "tivoli",
      "tivoli-heritage-grand-nh-44",
      "tivoli-murthal",
      "tivoli-nh",
      "tivoli-nh-44",
      "tivoli-nh-44-murthal",
      "tivoli-nh-44-of-murthal",
      "tivoli-nh-murthal"
    ]
  },
  "murthal:highway-king-hotel-sonipat": {
    imageUrl: "/images/places/murthal/stays/highway-king-hotel-sonipat.webp",
    visualDescription: "Verified property artwork for Highway King Hotel Sonipat in Murthal.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Comfortable Highway Transit Hotel",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "highway",
      "highway-king",
      "highway-king-hotel-sonipat",
      "highway-king-murthal",
      "highway-king-sonipat",
      "highway-king-sonipat-murthal",
      "highway-king-sonipat-of-murthal",
      "highway-murthal",
      "murthal-highway-king-sonipat"
    ]
  },
  "murthal:star-hotel-and-suites-murthal": {
    imageUrl: "/images/places/murthal/stays/star-hotel-suites-murthal.webp",
    visualDescription: "Verified property artwork for Star Hotel & Suites Murthal in Murthal.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Modern Highway Boutique Stay",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "murthal-star-murthal",
      "star",
      "star-hotel",
      "star-hotel-and-suites-murthal",
      "star-hotel-suites",
      "star-hotel-suites-murthal",
      "star-murthal",
      "star-murthal-murthal",
      "star-murthal-of-murthal",
      "suites-murthal"
    ]
  },
  "mussoorie:rokeby-manor-landour": {
    imageUrl: "/images/places/mussoorie/stays/rokeby-manor-landour.webp",
    visualDescription: "Verified property artwork for Rokeby Manor Landour in Mussoorie.",
    category: "Stays & Sanctuaries",
    hotelStyle: "1840 English Country Manor",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mussoorie-rokeby-manor-landour",
      "rokeby",
      "rokeby-manor",
      "rokeby-manor-landour",
      "rokeby-manor-landour-mussoorie",
      "rokeby-manor-landour-of-mussoorie",
      "rokeby-manor-mussoorie",
      "rokeby-mussoorie"
    ]
  },
  "mussoorie:welcomhotel-the-savoy": {
    imageUrl: "/images/places/mussoorie/stays/welcomhotel-the-savoy.webp",
    visualDescription: "Verified property artwork for Welcomhotel The Savoy in Mussoorie.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Historic Royal Heritage Grand",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mussoorie-welcomhotel-savoy",
      "welcomhotel",
      "welcomhotel-mussoorie",
      "welcomhotel-savoy",
      "welcomhotel-savoy-mussoorie",
      "welcomhotel-savoy-of-mussoorie",
      "welcomhotel-the-savoy"
    ]
  },
  "mussoorie:domas-inn-tibetan-guesthouse": {
    imageUrl: "/images/places/mussoorie/stays/domas-inn-tibetan-guesthouse.webp",
    visualDescription: "Verified property artwork for Doma's Inn Tibetan Guesthouse in Mussoorie.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Boutique Tibetan Homestay",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "domas",
      "domas-inn-tibetan-guesthouse",
      "domas-mussoorie",
      "domas-tibetan",
      "domas-tibetan-guesthouse",
      "domas-tibetan-guesthouse-mussoorie",
      "domas-tibetan-guesthouse-of-mussoorie",
      "domas-tibetan-mussoorie",
      "mussoorie-domas-tibetan-guesthouse"
    ]
  },
  "mussoorie:the-hosteller-mussoorie-mall-road": {
    imageUrl: "/images/places/mussoorie/stays/the-hosteller-mussoorie-mall-road.webp",
    visualDescription: "Verified property artwork for The Hosteller Mussoorie (Mall Road) in Mussoorie.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Backpacker Valley Hostel",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "hosteller",
      "hosteller-mussoorie",
      "hosteller-mussoorie-mall",
      "hosteller-mussoorie-mall-mussoorie",
      "hosteller-mussoorie-mall-of-mussoorie",
      "hosteller-mussoorie-mussoorie",
      "mall-road",
      "mussoorie-hosteller-mussoorie-mall",
      "the-hosteller-mall-road",
      "the-hosteller-mussoorie",
      "the-hosteller-mussoorie-mall-road"
    ]
  },
  "neemrana:neemrana-fort-palace": {
    imageUrl: "/images/places/neemrana/stays/neemrana-fort-palace.webp",
    visualDescription: "Verified property artwork for Neemrana Fort-Palace in Neemrana.",
    category: "Stays & Sanctuaries",
    hotelStyle: "15th-Century Stepped Royal Fortress",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "fort-palace",
      "neemrana",
      "neemrana-fort-palace",
      "neemrana-neemrana"
    ]
  },
  "neemrana:ramada-by-wyndham-neemrana": {
    imageUrl: "/images/places/neemrana/stays/ramada-by-wyndham-neemrana.webp",
    visualDescription: "Verified property artwork for Ramada by Wyndham Neemrana in Neemrana.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Modern Business & Leisure Hotel",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "neemrana-ramada-by-wyndham-neemrana",
      "ramada",
      "ramada-by",
      "ramada-by-neemrana",
      "ramada-by-wyndham",
      "ramada-by-wyndham-neemrana",
      "ramada-by-wyndham-neemrana-neemrana",
      "ramada-by-wyndham-neemrana-of-neemrana",
      "ramada-neemrana"
    ]
  },
  "neemrana:shiva-oasis-resort": {
    imageUrl: "/images/places/neemrana/stays/shiva-oasis-resort.webp",
    visualDescription: "Verified property artwork for Shiva Oasis Resort in Neemrana.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Aravalli Garden Resort",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "neemrana-shiva-oasis",
      "shiva",
      "shiva-neemrana",
      "shiva-oasis",
      "shiva-oasis-neemrana",
      "shiva-oasis-of-neemrana",
      "shiva-oasis-resort"
    ]
  },
  "neemrana:fort-view-heritage-homestay": {
    imageUrl: "/images/places/neemrana/stays/fort-view-heritage-homestay.webp",
    visualDescription: "Verified property artwork for Fort View Heritage Homestay in Neemrana.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Village Heritage Homestay",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "fort-view-heritage-homestay",
      "homestay",
      "homestay-neemrana"
    ]
  },
  "rishikesh:aloha-on-the-ganges": {
    imageUrl: "/images/places/rishikesh/stays/aloha-on-the-ganges.webp",
    visualDescription: "Verified property artwork for Aloha On The Ganges in Rishikesh.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Riverside Resort & Spa",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "aloha",
      "aloha-on",
      "aloha-on-ganges",
      "aloha-on-ganges-of-rishikesh",
      "aloha-on-ganges-rishikesh",
      "aloha-on-rishikesh",
      "aloha-on-the-ganges",
      "aloha-rishikesh",
      "rishikesh-aloha-on-ganges"
    ]
  },
  "rishikesh:glasshouse-on-the-ganges": {
    imageUrl: "/images/places/rishikesh/stays/glasshouse-on-the-ganges.webp",
    visualDescription: "Verified property artwork for Glasshouse on the Ganges in Rishikesh.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Boutique Citrus Orchard Retreat",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "glasshouse",
      "glasshouse-on",
      "glasshouse-on-ganges",
      "glasshouse-on-ganges-of-rishikesh",
      "glasshouse-on-ganges-rishikesh",
      "glasshouse-on-rishikesh",
      "glasshouse-on-the-ganges",
      "glasshouse-rishikesh",
      "rishikesh-glasshouse-on-ganges"
    ]
  },
  "rishikesh:ganga-kinare-riverside-sanctuary": {
    imageUrl: "/images/places/rishikesh/stays/ganga-kinare-riverside-sanctuary.webp",
    visualDescription: "Verified property artwork for Ganga Kinare Riverside Sanctuary in Rishikesh.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Boutique Riverside Hotel",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "ganga",
      "ganga-kinare",
      "ganga-kinare-of-rishikesh",
      "ganga-kinare-rishikesh",
      "ganga-kinare-riverside-sanctuary",
      "ganga-rishikesh",
      "rishikesh-ganga-kinare"
    ]
  },
  "rishikesh:zostel-rishikesh-tapovan": {
    imageUrl: "/images/places/rishikesh/stays/zostel-rishikesh-tapovan.webp",
    visualDescription: "Verified property artwork for Zostel Rishikesh (Tapovan) in Rishikesh.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Backpacker Adventure Hostel",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "rishikesh-zostel-rishikesh-tapovan",
      "tapovan",
      "zostel",
      "zostel-rishikesh",
      "zostel-rishikesh-rishikesh",
      "zostel-rishikesh-tapovan",
      "zostel-rishikesh-tapovan-of-rishikesh",
      "zostel-rishikesh-tapovan-rishikesh",
      "zostel-tapovan"
    ]
  },
  "sariska-bhangarh:the-sariska-palace-heritage-hotel": {
    imageUrl: "/images/places/sariska-bhangarh/stays/the-sariska-palace-heritage-hotel.webp",
    visualDescription: "Verified property artwork for The Sariska Palace Heritage Hotel in Sariska-Bhangarh.",
    category: "Stays & Sanctuaries",
    hotelStyle: "1892 Royal French Hunting Palace",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sariska",
      "sariska-sariska-bhangarh",
      "the-sariska-palace-heritage-hotel"
    ]
  },
  "sariska-bhangarh:amanbagh-luxury-sanctuary": {
    imageUrl: "/images/places/sariska-bhangarh/stays/amanbagh-luxury-sanctuary.webp",
    visualDescription: "Verified property artwork for Amanbagh Luxury Sanctuary in Sariska-Bhangarh.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Ultra-Luxury Mughal Haveli Sanctuary",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "amanbagh",
      "amanbagh-luxury-sanctuary",
      "amanbagh-sariska-bhangarh"
    ]
  },
  "sariska-bhangarh:trees-and-tigers-wildlife-resort": {
    imageUrl: "/images/places/sariska-bhangarh/stays/trees-tigers-wildlife-resort.webp",
    visualDescription: "Verified property artwork for Trees & Tigers Wildlife Resort in Sariska-Bhangarh.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Eco-Wildlife Jungle Lodge",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sariska-bhangarh-trees-tigers-wildlife",
      "tigers-wildlife-resort",
      "trees",
      "trees-and-tigers-wildlife-resort",
      "trees-sariska-bhangarh",
      "trees-tigers",
      "trees-tigers-sariska-bhangarh",
      "trees-tigers-wildlife",
      "trees-tigers-wildlife-of-sariska-bhangarh",
      "trees-tigers-wildlife-resort",
      "trees-tigers-wildlife-sariska-bhangarh"
    ]
  },
  "sariska-bhangarh:vanaashrya-resort-sariska": {
    imageUrl: "/images/places/sariska-bhangarh/stays/vanaashrya-resort-sariska.webp",
    visualDescription: "Verified property artwork for Vanaashrya Resort Sariska in Sariska-Bhangarh.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Luxury Cottages & Glamping",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sariska-bhangarh-vanaashrya-sariska",
      "vanaashrya",
      "vanaashrya-resort-sariska",
      "vanaashrya-sariska",
      "vanaashrya-sariska-bhangarh",
      "vanaashrya-sariska-of-sariska-bhangarh",
      "vanaashrya-sariska-sariska-bhangarh"
    ]
  },
  "spiti:hotel-deyzor-kaza": {
    imageUrl: "/images/places/spiti/stays/hotel-deyzor-kaza.webp",
    visualDescription: "Verified property artwork for Hotel Deyzor Kaza in Spiti.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Boutique High-Altitude Lodge",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "deyzor",
      "deyzor-kaza",
      "deyzor-kaza-of-spiti",
      "deyzor-kaza-spiti",
      "deyzor-spiti",
      "hotel-deyzor-kaza",
      "spiti-deyzor-kaza"
    ]
  },
  "spiti:spiti-valley-eco-lodge": {
    imageUrl: "/images/places/spiti/stays/spiti-valley-eco-lodge.webp",
    visualDescription: "Verified property artwork for Spiti Valley Eco Lodge in Spiti.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Eco-Sustainable Mountain Sanctuary",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "spiti",
      "spiti-spiti",
      "spiti-spiti-valley-eco-lodge",
      "spiti-valley",
      "spiti-valley-eco-lodge",
      "spiti-valley-eco-lodge-of-spiti",
      "spiti-valley-eco-lodge-spiti",
      "spiti-valley-spiti",
      "valley-eco-lodge"
    ]
  },
  "spiti:dekit-norbu-homestay-kaza": {
    imageUrl: "/images/places/spiti/stays/dekit-norbu-homestay-kaza.webp",
    visualDescription: "Verified property artwork for Dekit Norbu Homestay Kaza in Spiti.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Traditional Spitian Mud Homestay",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dekit",
      "dekit-norbu",
      "dekit-norbu-homestay-kaza",
      "dekit-norbu-homestay-kaza-of-spiti",
      "dekit-norbu-homestay-kaza-spiti",
      "dekit-norbu-spiti",
      "dekit-spiti",
      "spiti-dekit-norbu-homestay-kaza"
    ]
  },
  "spiti:zostel-spiti-kaza": {
    imageUrl: "/images/places/spiti/stays/zostel-spiti-kaza.webp",
    visualDescription: "Verified property artwork for Zostel Spiti (Kaza) in Spiti.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Backpacker Trans-Himalayan Hostel",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kaza",
      "spiti-zostel-spiti-kaza",
      "zostel",
      "zostel-kaza",
      "zostel-spiti",
      "zostel-spiti-kaza",
      "zostel-spiti-kaza-of-spiti",
      "zostel-spiti-kaza-spiti",
      "zostel-spiti-spiti"
    ]
  },
  "tungnath-chandrashila:alpine-meadow-eco-lodge-chopta": {
    imageUrl: "/images/places/tungnath-chandrashila/stays/alpine-meadow-eco-lodge-chopta.webp",
    visualDescription: "Verified property artwork for Alpine Meadow Eco Lodge Chopta in Tungnath-Chandrashila.",
    category: "Stays & Sanctuaries",
    hotelStyle: "High Alpine Eco Lodge",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "alpine",
      "alpine-meadow",
      "alpine-meadow-eco-lodge-chopta",
      "alpine-meadow-eco-lodge-chopta-of-tungnath-chandrashila",
      "alpine-meadow-eco-lodge-chopta-tungnath-chandrashila",
      "alpine-meadow-tungnath-chandrashila",
      "alpine-tungnath-chandrashila",
      "tungnath-chandrashila-alpine-meadow-eco-lodge-chopta"
    ]
  },
  "tungnath-chandrashila:magpie-jungle-camp-chopta": {
    imageUrl: "/images/places/tungnath-chandrashila/stays/magpie-jungle-camp-chopta.webp",
    visualDescription: "Verified property artwork for Magpie Jungle Camp Chopta in Tungnath-Chandrashila.",
    category: "Stays & Sanctuaries",
    hotelStyle: "High-Altitude Wilderness Safari Camp",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "magpie",
      "magpie-jungle",
      "magpie-jungle-camp-chopta",
      "magpie-jungle-camp-chopta-of-tungnath-chandrashila",
      "magpie-jungle-camp-chopta-tungnath-chandrashila",
      "magpie-jungle-tungnath-chandrashila",
      "magpie-tungnath-chandrashila",
      "tungnath-chandrashila-magpie-jungle-camp-chopta"
    ]
  },
  "tungnath-chandrashila:chopta-meadows-homestay-sari-base": {
    imageUrl: "/images/places/tungnath-chandrashila/stays/chopta-meadows-homestay-sari-base.webp",
    visualDescription: "Verified property artwork for Chopta Meadows Homestay (Sari Base) in Tungnath-Chandrashila.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Traditional Garhwali Village Homestay",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chopta",
      "chopta-meadows",
      "chopta-meadows-homestay",
      "chopta-meadows-homestay-sari-base",
      "chopta-meadows-homestay-sari-base-of-tungnath-chandrashila",
      "chopta-meadows-homestay-sari-base-tungnath-chandrashila",
      "chopta-meadows-tungnath-chandrashila",
      "chopta-tungnath-chandrashila",
      "sari-base",
      "tungnath-chandrashila-chopta-meadows-homestay-sari-base"
    ]
  },
  "tungnath-chandrashila:monal-himalayan-resort-dugalbitta": {
    imageUrl: "/images/places/tungnath-chandrashila/stays/monal-himalayan-resort-dugalbitta.webp",
    visualDescription: "Verified property artwork for Monal Himalayan Resort Dugalbitta in Tungnath-Chandrashila.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Mountain View Stone Lodge",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "monal",
      "monal-himalayan",
      "monal-himalayan-dugalbitta",
      "monal-himalayan-dugalbitta-of-tungnath-chandrashila",
      "monal-himalayan-dugalbitta-tungnath-chandrashila",
      "monal-himalayan-resort-dugalbitta",
      "monal-himalayan-tungnath-chandrashila",
      "monal-tungnath-chandrashila",
      "tungnath-chandrashila-monal-himalayan-dugalbitta"
    ]
  },
  "udaipur:jagat-niwas-palace-hotel": {
    imageUrl: "/images/places/udaipur/stays/jagat-niwas-palace-hotel.webp",
    visualDescription: "Verified property artwork for Jagat Niwas Palace Hotel in Udaipur.",
    category: "Stays & Sanctuaries",
    hotelStyle: "17th-Century Lakeside Haveli",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jagat",
      "jagat-niwas",
      "jagat-niwas-of-udaipur",
      "jagat-niwas-palace-hotel",
      "jagat-niwas-udaipur",
      "jagat-udaipur",
      "udaipur-jagat-niwas"
    ]
  },
  "udaipur:amet-haveli-heritage-hotel": {
    imageUrl: "/images/places/udaipur/stays/amet-haveli-heritage-hotel.webp",
    visualDescription: "Verified property artwork for Amet Haveli Heritage Hotel in Udaipur.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Waterfront Heritage Sanctuary",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "amet",
      "amet-haveli",
      "amet-haveli-heritage-hotel",
      "amet-haveli-of-udaipur",
      "amet-haveli-udaipur",
      "amet-udaipur",
      "udaipur-amet-haveli"
    ]
  },
  "udaipur:tribute-lakeside-boutique-stay": {
    imageUrl: "/images/places/udaipur/stays/tribute-lakeside-boutique-stay.webp",
    visualDescription: "Verified property artwork for Tribute Lakeside Boutique Stay in Udaipur.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Boutique Lake Retreat",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "tribute",
      "tribute-lakeside-boutique-stay",
      "tribute-stay",
      "tribute-stay-of-udaipur",
      "tribute-stay-udaipur",
      "tribute-udaipur",
      "udaipur-tribute-stay"
    ]
  },
  "udaipur:zostel-udaipur": {
    imageUrl: "/images/places/udaipur/stays/zostel-udaipur.webp",
    visualDescription: "Verified property artwork for Zostel Udaipur in Udaipur.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Backpacker Lakeside Hostel",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "udaipur-zostel-udaipur",
      "zostel",
      "zostel-udaipur",
      "zostel-udaipur-of-udaipur",
      "zostel-udaipur-udaipur"
    ]
  },
  "varanasi:brijrama-palace-heritage-grand": {
    imageUrl: "/images/places/varanasi/stays/brijrama-palace-heritage-grand.webp",
    visualDescription: "Verified property artwork for BrijRama Palace Heritage Grand in Varanasi.",
    category: "Stays & Sanctuaries",
    hotelStyle: "18th-Century Ghat Palace",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "brijrama",
      "brijrama-palace-heritage-grand",
      "brijrama-varanasi"
    ]
  },
  "varanasi:ganges-view-heritage-hotel": {
    imageUrl: "/images/places/varanasi/stays/ganges-view-heritage-hotel.webp",
    visualDescription: "Verified property artwork for Ganges View Heritage Hotel in Varanasi.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Cultural Heritage Sanctuary",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "ganges",
      "ganges-varanasi",
      "ganges-view-heritage-hotel"
    ]
  },
  "varanasi:amritara-suryauday-haveli": {
    imageUrl: "/images/places/varanasi/stays/amritara-suryauday-haveli.webp",
    visualDescription: "Verified property artwork for Amritara Suryauday Haveli in Varanasi.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Boutique Riverfront Haveli",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "amritara",
      "amritara-suryauday",
      "amritara-suryauday-haveli",
      "amritara-suryauday-haveli-of-varanasi",
      "amritara-suryauday-haveli-varanasi",
      "amritara-suryauday-varanasi",
      "amritara-varanasi",
      "varanasi-amritara-suryauday-haveli"
    ]
  },
  "varanasi:stops-hostel-varanasi": {
    imageUrl: "/images/places/varanasi/stays/stops-hostel-varanasi.webp",
    visualDescription: "Verified property artwork for Stops Hostel Varanasi in Varanasi.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Backpacker Social Hostel",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "stops",
      "stops-hostel",
      "stops-hostel-varanasi",
      "stops-varanasi",
      "stops-varanasi-of-varanasi",
      "stops-varanasi-varanasi",
      "varanasi-stops-varanasi"
    ]
  }
};

export const DESTINATION_CATEGORY_REGISTRY: Record<
  string,
  {
    generic: string;
    categories: Partial<Record<string, string>>;
  }
> = {
  "goa": {
    generic: "/images/destinations/goa/hero.jpg",
    categories: {
      stay: "/images/places/goa/categories/stay.webp",
      cafe: "/images/places/goa/categories/cafe.webp",
      food: "/images/places/goa/categories/food.webp",
      nature: "/images/places/goa/categories/nature.webp",
      trail: "/images/places/goa/categories/nature.webp",
      heritage: "/images/places/goa/categories/heritage.webp",
      spiritual: "/images/places/goa/categories/spiritual.webp",
      viewpoint: "/images/places/goa/categories/viewpoint.webp",
      waterfall: "/images/places/goa/categories/waterfall.webp",
      lake: "/images/places/goa/categories/lake.webp",
      monastery: "/images/places/goa/categories/monastery.webp",
      church: "/images/places/goa/categories/church.webp",
      beach: "/images/places/goa/categories/beach.webp",
      shopping: "/images/places/goa/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "jaipur": {
    generic: "/images/destinations/jaipur/hero.jpg",
    categories: {
      stay: "/images/places/jaipur/categories/stay.webp",
      cafe: "/images/places/jaipur/categories/cafe.webp",
      food: "/images/places/jaipur/categories/food.webp",
      nature: "/images/places/jaipur/categories/nature.webp",
      trail: "/images/places/jaipur/categories/nature.webp",
      heritage: "/images/places/jaipur/categories/heritage.webp",
      spiritual: "/images/places/jaipur/categories/spiritual.webp",
      viewpoint: "/images/places/jaipur/categories/viewpoint.webp",
      waterfall: "/images/places/jaipur/categories/waterfall.webp",
      lake: "/images/places/jaipur/categories/lake.webp",
      monastery: "/images/places/jaipur/categories/monastery.webp",
      church: "/images/places/jaipur/categories/church.webp",
      beach: "/images/places/jaipur/categories/beach.webp",
      shopping: "/images/places/jaipur/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "udaipur": {
    generic: "/images/destinations/udaipur/hero.jpg",
    categories: {
      stay: "/images/places/udaipur/categories/stay.webp",
      cafe: "/images/places/udaipur/categories/cafe.webp",
      food: "/images/places/udaipur/categories/food.webp",
      nature: "/images/places/udaipur/categories/nature.webp",
      trail: "/images/places/udaipur/categories/nature.webp",
      heritage: "/images/places/udaipur/categories/heritage.webp",
      spiritual: "/images/places/udaipur/categories/spiritual.webp",
      viewpoint: "/images/places/udaipur/categories/viewpoint.webp",
      waterfall: "/images/places/udaipur/categories/waterfall.webp",
      lake: "/images/places/udaipur/categories/lake.webp",
      monastery: "/images/places/udaipur/categories/monastery.webp",
      church: "/images/places/udaipur/categories/church.webp",
      beach: "/images/places/udaipur/categories/beach.webp",
      shopping: "/images/places/udaipur/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "varanasi": {
    generic: "/images/destinations/varanasi/hero.jpg",
    categories: {
      stay: "/images/places/varanasi/categories/stay.webp",
      cafe: "/images/places/varanasi/categories/cafe.webp",
      food: "/images/places/varanasi/categories/food.webp",
      nature: "/images/places/varanasi/categories/nature.webp",
      trail: "/images/places/varanasi/categories/nature.webp",
      heritage: "/images/places/varanasi/categories/heritage.webp",
      spiritual: "/images/places/varanasi/categories/spiritual.webp",
      viewpoint: "/images/places/varanasi/categories/viewpoint.webp",
      waterfall: "/images/places/varanasi/categories/waterfall.webp",
      lake: "/images/places/varanasi/categories/lake.webp",
      monastery: "/images/places/varanasi/categories/monastery.webp",
      church: "/images/places/varanasi/categories/church.webp",
      beach: "/images/places/varanasi/categories/beach.webp",
      shopping: "/images/places/varanasi/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "mussoorie": {
    generic: "/images/destinations/mussoorie/hero.jpg",
    categories: {
      stay: "/images/places/mussoorie/categories/stay.webp",
      cafe: "/images/places/mussoorie/categories/cafe.webp",
      food: "/images/places/mussoorie/categories/food.webp",
      nature: "/images/places/mussoorie/categories/nature.webp",
      trail: "/images/places/mussoorie/categories/nature.webp",
      heritage: "/images/places/mussoorie/categories/heritage.webp",
      spiritual: "/images/places/mussoorie/categories/spiritual.webp",
      viewpoint: "/images/places/mussoorie/categories/viewpoint.webp",
      waterfall: "/images/places/mussoorie/categories/waterfall.webp",
      lake: "/images/places/mussoorie/categories/lake.webp",
      monastery: "/images/places/mussoorie/categories/monastery.webp",
      church: "/images/places/mussoorie/categories/church.webp",
      beach: "/images/places/mussoorie/categories/beach.webp",
      shopping: "/images/places/mussoorie/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "rishikesh": {
    generic: "/images/destinations/rishikesh/hero.jpg",
    categories: {
      stay: "/images/places/rishikesh/categories/stay.webp",
      cafe: "/images/places/rishikesh/categories/cafe.webp",
      food: "/images/places/rishikesh/categories/food.webp",
      nature: "/images/places/rishikesh/categories/nature.webp",
      trail: "/images/places/rishikesh/categories/nature.webp",
      heritage: "/images/places/rishikesh/categories/heritage.webp",
      spiritual: "/images/places/rishikesh/categories/spiritual.webp",
      viewpoint: "/images/places/rishikesh/categories/viewpoint.webp",
      waterfall: "/images/places/rishikesh/categories/waterfall.webp",
      lake: "/images/places/rishikesh/categories/lake.webp",
      monastery: "/images/places/rishikesh/categories/monastery.webp",
      church: "/images/places/rishikesh/categories/church.webp",
      beach: "/images/places/rishikesh/categories/beach.webp",
      shopping: "/images/places/rishikesh/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "manali": {
    generic: "/images/destinations/manali/hero.jpg",
    categories: {
      stay: "/images/places/manali/categories/stay.webp",
      cafe: "/images/places/manali/categories/cafe.webp",
      food: "/images/places/manali/categories/food.webp",
      nature: "/images/places/manali/categories/nature.webp",
      trail: "/images/places/manali/categories/nature.webp",
      heritage: "/images/places/manali/categories/heritage.webp",
      spiritual: "/images/places/manali/categories/spiritual.webp",
      viewpoint: "/images/places/manali/categories/viewpoint.webp",
      waterfall: "/images/places/manali/categories/waterfall.webp",
      lake: "/images/places/manali/categories/lake.webp",
      monastery: "/images/places/manali/categories/monastery.webp",
      church: "/images/places/manali/categories/church.webp",
      beach: "/images/places/manali/categories/beach.webp",
      shopping: "/images/places/manali/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "dharamshala": {
    generic: "/images/destinations/dharamshala/hero.jpg",
    categories: {
      stay: "/images/places/dharamshala/categories/stay.webp",
      cafe: "/images/places/dharamshala/categories/cafe.webp",
      food: "/images/places/dharamshala/categories/food.webp",
      nature: "/images/places/dharamshala/categories/nature.webp",
      trail: "/images/places/dharamshala/categories/nature.webp",
      heritage: "/images/places/dharamshala/categories/heritage.webp",
      spiritual: "/images/places/dharamshala/categories/spiritual.webp",
      viewpoint: "/images/places/dharamshala/categories/viewpoint.webp",
      waterfall: "/images/places/dharamshala/categories/waterfall.webp",
      lake: "/images/places/dharamshala/categories/lake.webp",
      monastery: "/images/places/dharamshala/categories/monastery.webp",
      church: "/images/places/dharamshala/categories/church.webp",
      beach: "/images/places/dharamshala/categories/beach.webp",
      shopping: "/images/places/dharamshala/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "kasol": {
    generic: "/images/destinations/kasol/hero.jpg",
    categories: {
      stay: "/images/places/kasol/categories/stay.webp",
      cafe: "/images/places/kasol/categories/cafe.webp",
      food: "/images/places/kasol/categories/food.webp",
      nature: "/images/places/kasol/categories/nature.webp",
      trail: "/images/places/kasol/categories/nature.webp",
      heritage: "/images/places/kasol/categories/heritage.webp",
      spiritual: "/images/places/kasol/categories/spiritual.webp",
      viewpoint: "/images/places/kasol/categories/viewpoint.webp",
      waterfall: "/images/places/kasol/categories/waterfall.webp",
      lake: "/images/places/kasol/categories/lake.webp",
      monastery: "/images/places/kasol/categories/monastery.webp",
      church: "/images/places/kasol/categories/church.webp",
      beach: "/images/places/kasol/categories/beach.webp",
      shopping: "/images/places/kasol/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "leh": {
    generic: "/images/destinations/leh/hero.jpg",
    categories: {
      stay: "/images/places/leh/categories/stay.webp",
      cafe: "/images/places/leh/categories/cafe.webp",
      food: "/images/places/leh/categories/food.webp",
      nature: "/images/places/leh/categories/nature.webp",
      trail: "/images/places/leh/categories/nature.webp",
      heritage: "/images/places/leh/categories/heritage.webp",
      spiritual: "/images/places/leh/categories/spiritual.webp",
      viewpoint: "/images/places/leh/categories/viewpoint.webp",
      waterfall: "/images/places/leh/categories/waterfall.webp",
      lake: "/images/places/leh/categories/lake.webp",
      monastery: "/images/places/leh/categories/monastery.webp",
      church: "/images/places/leh/categories/church.webp",
      beach: "/images/places/leh/categories/beach.webp",
      shopping: "/images/places/leh/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "spiti": {
    generic: "/images/destinations/spiti/hero.jpg",
    categories: {
      stay: "/images/places/spiti/categories/stay.webp",
      cafe: "/images/places/spiti/categories/cafe.webp",
      food: "/images/places/spiti/categories/food.webp",
      nature: "/images/places/spiti/categories/nature.webp",
      trail: "/images/places/spiti/categories/nature.webp",
      heritage: "/images/places/spiti/categories/heritage.webp",
      spiritual: "/images/places/spiti/categories/spiritual.webp",
      viewpoint: "/images/places/spiti/categories/viewpoint.webp",
      waterfall: "/images/places/spiti/categories/waterfall.webp",
      lake: "/images/places/spiti/categories/lake.webp",
      monastery: "/images/places/spiti/categories/monastery.webp",
      church: "/images/places/spiti/categories/church.webp",
      beach: "/images/places/spiti/categories/beach.webp",
      shopping: "/images/places/spiti/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "jaisalmer": {
    generic: "/images/destinations/jaisalmer/hero.jpg",
    categories: {
      stay: "/images/places/jaisalmer/categories/stay.webp",
      cafe: "/images/places/jaisalmer/categories/cafe.webp",
      food: "/images/places/jaisalmer/categories/food.webp",
      nature: "/images/places/jaisalmer/categories/nature.webp",
      trail: "/images/places/jaisalmer/categories/nature.webp",
      heritage: "/images/places/jaisalmer/categories/heritage.webp",
      spiritual: "/images/places/jaisalmer/categories/spiritual.webp",
      viewpoint: "/images/places/jaisalmer/categories/viewpoint.webp",
      waterfall: "/images/places/jaisalmer/categories/waterfall.webp",
      lake: "/images/places/jaisalmer/categories/lake.webp",
      monastery: "/images/places/jaisalmer/categories/monastery.webp",
      church: "/images/places/jaisalmer/categories/church.webp",
      beach: "/images/places/jaisalmer/categories/beach.webp",
      shopping: "/images/places/jaisalmer/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "munnar": {
    generic: "/images/destinations/munnar/hero.jpg",
    categories: {
      stay: "/images/places/munnar/categories/stay.webp",
      cafe: "/images/places/munnar/categories/cafe.webp",
      food: "/images/places/munnar/categories/food.webp",
      nature: "/images/places/munnar/categories/nature.webp",
      trail: "/images/places/munnar/categories/nature.webp",
      heritage: "/images/places/munnar/categories/heritage.webp",
      spiritual: "/images/places/munnar/categories/spiritual.webp",
      viewpoint: "/images/places/munnar/categories/viewpoint.webp",
      waterfall: "/images/places/munnar/categories/waterfall.webp",
      lake: "/images/places/munnar/categories/lake.webp",
      monastery: "/images/places/munnar/categories/monastery.webp",
      church: "/images/places/munnar/categories/church.webp",
      beach: "/images/places/munnar/categories/beach.webp",
      shopping: "/images/places/munnar/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "dehradun": {
    generic: "/images/destinations/dehradun/hero.jpg",
    categories: {
      stay: "/images/places/dehradun/categories/stay.webp",
      cafe: "/images/places/dehradun/categories/cafe.webp",
      food: "/images/places/dehradun/categories/food.webp",
      nature: "/images/places/dehradun/categories/nature.webp",
      trail: "/images/places/dehradun/categories/nature.webp",
      heritage: "/images/places/dehradun/categories/heritage.webp",
      spiritual: "/images/places/dehradun/categories/spiritual.webp",
      viewpoint: "/images/places/dehradun/categories/viewpoint.webp",
      waterfall: "/images/places/dehradun/categories/waterfall.webp",
      lake: "/images/places/dehradun/categories/lake.webp",
      monastery: "/images/places/dehradun/categories/monastery.webp",
      church: "/images/places/dehradun/categories/church.webp",
      beach: "/images/places/dehradun/categories/beach.webp",
      shopping: "/images/places/dehradun/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "tungnath-chandrashila": {
    generic: "/images/destinations/tungnath-chandrashila/hero.jpg",
    categories: {
      stay: "/images/places/tungnath-chandrashila/categories/stay.webp",
      cafe: "/images/places/tungnath-chandrashila/categories/cafe.webp",
      food: "/images/places/tungnath-chandrashila/categories/food.webp",
      nature: "/images/places/tungnath-chandrashila/categories/nature.webp",
      trail: "/images/places/tungnath-chandrashila/categories/nature.webp",
      heritage: "/images/places/tungnath-chandrashila/categories/heritage.webp",
      spiritual: "/images/places/tungnath-chandrashila/categories/spiritual.webp",
      viewpoint: "/images/places/tungnath-chandrashila/categories/viewpoint.webp",
      waterfall: "/images/places/tungnath-chandrashila/categories/waterfall.webp",
      lake: "/images/places/tungnath-chandrashila/categories/lake.webp",
      monastery: "/images/places/tungnath-chandrashila/categories/monastery.webp",
      church: "/images/places/tungnath-chandrashila/categories/church.webp",
      beach: "/images/places/tungnath-chandrashila/categories/beach.webp",
      shopping: "/images/places/tungnath-chandrashila/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "kainchi-dham": {
    generic: "/images/destinations/kainchi-dham/hero.jpg",
    categories: {
      stay: "/images/places/kainchi-dham/categories/stay.webp",
      cafe: "/images/places/kainchi-dham/categories/cafe.webp",
      food: "/images/places/kainchi-dham/categories/food.webp",
      nature: "/images/places/kainchi-dham/categories/nature.webp",
      trail: "/images/places/kainchi-dham/categories/nature.webp",
      heritage: "/images/places/kainchi-dham/categories/heritage.webp",
      spiritual: "/images/places/kainchi-dham/categories/spiritual.webp",
      viewpoint: "/images/places/kainchi-dham/categories/viewpoint.webp",
      waterfall: "/images/places/kainchi-dham/categories/waterfall.webp",
      lake: "/images/places/kainchi-dham/categories/lake.webp",
      monastery: "/images/places/kainchi-dham/categories/monastery.webp",
      church: "/images/places/kainchi-dham/categories/church.webp",
      beach: "/images/places/kainchi-dham/categories/beach.webp",
      shopping: "/images/places/kainchi-dham/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "agra": {
    generic: "/images/destinations/agra/hero.jpg",
    categories: {
      stay: "/images/places/agra/categories/stay.webp",
      cafe: "/images/places/agra/categories/cafe.webp",
      food: "/images/places/agra/categories/food.webp",
      nature: "/images/places/agra/categories/nature.webp",
      trail: "/images/places/agra/categories/nature.webp",
      heritage: "/images/places/agra/categories/heritage.webp",
      spiritual: "/images/places/agra/categories/spiritual.webp",
      viewpoint: "/images/places/agra/categories/viewpoint.webp",
      waterfall: "/images/places/agra/categories/waterfall.webp",
      lake: "/images/places/agra/categories/lake.webp",
      monastery: "/images/places/agra/categories/monastery.webp",
      church: "/images/places/agra/categories/church.webp",
      beach: "/images/places/agra/categories/beach.webp",
      shopping: "/images/places/agra/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "mathura-vrindavan": {
    generic: "/images/destinations/mathura-vrindavan/hero.jpg",
    categories: {
      stay: "/images/places/mathura-vrindavan/categories/stay.webp",
      cafe: "/images/places/mathura-vrindavan/categories/cafe.webp",
      food: "/images/places/mathura-vrindavan/categories/food.webp",
      nature: "/images/places/mathura-vrindavan/categories/nature.webp",
      trail: "/images/places/mathura-vrindavan/categories/nature.webp",
      heritage: "/images/places/mathura-vrindavan/categories/heritage.webp",
      spiritual: "/images/places/mathura-vrindavan/categories/spiritual.webp",
      viewpoint: "/images/places/mathura-vrindavan/categories/viewpoint.webp",
      waterfall: "/images/places/mathura-vrindavan/categories/waterfall.webp",
      lake: "/images/places/mathura-vrindavan/categories/lake.webp",
      monastery: "/images/places/mathura-vrindavan/categories/monastery.webp",
      church: "/images/places/mathura-vrindavan/categories/church.webp",
      beach: "/images/places/mathura-vrindavan/categories/beach.webp",
      shopping: "/images/places/mathura-vrindavan/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "neemrana": {
    generic: "/images/destinations/neemrana/hero.jpg",
    categories: {
      stay: "/images/places/neemrana/categories/stay.webp",
      cafe: "/images/places/neemrana/categories/cafe.webp",
      food: "/images/places/neemrana/categories/food.webp",
      nature: "/images/places/neemrana/categories/nature.webp",
      trail: "/images/places/neemrana/categories/nature.webp",
      heritage: "/images/places/neemrana/categories/heritage.webp",
      spiritual: "/images/places/neemrana/categories/spiritual.webp",
      viewpoint: "/images/places/neemrana/categories/viewpoint.webp",
      waterfall: "/images/places/neemrana/categories/waterfall.webp",
      lake: "/images/places/neemrana/categories/lake.webp",
      monastery: "/images/places/neemrana/categories/monastery.webp",
      church: "/images/places/neemrana/categories/church.webp",
      beach: "/images/places/neemrana/categories/beach.webp",
      shopping: "/images/places/neemrana/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "damdama-sohna": {
    generic: "/images/destinations/damdama-sohna/hero.jpg",
    categories: {
      stay: "/images/places/damdama-sohna/categories/stay.webp",
      cafe: "/images/places/damdama-sohna/categories/cafe.webp",
      food: "/images/places/damdama-sohna/categories/food.webp",
      nature: "/images/places/damdama-sohna/categories/nature.webp",
      trail: "/images/places/damdama-sohna/categories/nature.webp",
      heritage: "/images/places/damdama-sohna/categories/heritage.webp",
      spiritual: "/images/places/damdama-sohna/categories/spiritual.webp",
      viewpoint: "/images/places/damdama-sohna/categories/viewpoint.webp",
      waterfall: "/images/places/damdama-sohna/categories/waterfall.webp",
      lake: "/images/places/damdama-sohna/categories/lake.webp",
      monastery: "/images/places/damdama-sohna/categories/monastery.webp",
      church: "/images/places/damdama-sohna/categories/church.webp",
      beach: "/images/places/damdama-sohna/categories/beach.webp",
      shopping: "/images/places/damdama-sohna/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "alwar-siliserh": {
    generic: "/images/destinations/alwar-siliserh/hero.jpg",
    categories: {
      stay: "/images/places/alwar-siliserh/categories/stay.webp",
      cafe: "/images/places/alwar-siliserh/categories/cafe.webp",
      food: "/images/places/alwar-siliserh/categories/food.webp",
      nature: "/images/places/alwar-siliserh/categories/nature.webp",
      trail: "/images/places/alwar-siliserh/categories/nature.webp",
      heritage: "/images/places/alwar-siliserh/categories/heritage.webp",
      spiritual: "/images/places/alwar-siliserh/categories/spiritual.webp",
      viewpoint: "/images/places/alwar-siliserh/categories/viewpoint.webp",
      waterfall: "/images/places/alwar-siliserh/categories/waterfall.webp",
      lake: "/images/places/alwar-siliserh/categories/lake.webp",
      monastery: "/images/places/alwar-siliserh/categories/monastery.webp",
      church: "/images/places/alwar-siliserh/categories/church.webp",
      beach: "/images/places/alwar-siliserh/categories/beach.webp",
      shopping: "/images/places/alwar-siliserh/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "sariska-bhangarh": {
    generic: "/images/destinations/sariska-bhangarh/hero.jpg",
    categories: {
      stay: "/images/places/sariska-bhangarh/categories/stay.webp",
      cafe: "/images/places/sariska-bhangarh/categories/cafe.webp",
      food: "/images/places/sariska-bhangarh/categories/food.webp",
      nature: "/images/places/sariska-bhangarh/categories/nature.webp",
      trail: "/images/places/sariska-bhangarh/categories/nature.webp",
      heritage: "/images/places/sariska-bhangarh/categories/heritage.webp",
      spiritual: "/images/places/sariska-bhangarh/categories/spiritual.webp",
      viewpoint: "/images/places/sariska-bhangarh/categories/viewpoint.webp",
      waterfall: "/images/places/sariska-bhangarh/categories/waterfall.webp",
      lake: "/images/places/sariska-bhangarh/categories/lake.webp",
      monastery: "/images/places/sariska-bhangarh/categories/monastery.webp",
      church: "/images/places/sariska-bhangarh/categories/church.webp",
      beach: "/images/places/sariska-bhangarh/categories/beach.webp",
      shopping: "/images/places/sariska-bhangarh/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "chandigarh": {
    generic: "/images/destinations/chandigarh/hero.jpg",
    categories: {
      stay: "/images/places/chandigarh/categories/stay.webp",
      cafe: "/images/places/chandigarh/categories/cafe.webp",
      food: "/images/places/chandigarh/categories/food.webp",
      nature: "/images/places/chandigarh/categories/nature.webp",
      trail: "/images/places/chandigarh/categories/nature.webp",
      heritage: "/images/places/chandigarh/categories/heritage.webp",
      spiritual: "/images/places/chandigarh/categories/spiritual.webp",
      viewpoint: "/images/places/chandigarh/categories/viewpoint.webp",
      waterfall: "/images/places/chandigarh/categories/waterfall.webp",
      lake: "/images/places/chandigarh/categories/lake.webp",
      monastery: "/images/places/chandigarh/categories/monastery.webp",
      church: "/images/places/chandigarh/categories/church.webp",
      beach: "/images/places/chandigarh/categories/beach.webp",
      shopping: "/images/places/chandigarh/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "morni-hills": {
    generic: "/images/destinations/morni-hills/hero.jpg",
    categories: {
      stay: "/images/places/morni-hills/categories/stay.webp",
      cafe: "/images/places/morni-hills/categories/cafe.webp",
      food: "/images/places/morni-hills/categories/food.webp",
      nature: "/images/places/morni-hills/categories/nature.webp",
      trail: "/images/places/morni-hills/categories/nature.webp",
      heritage: "/images/places/morni-hills/categories/heritage.webp",
      spiritual: "/images/places/morni-hills/categories/spiritual.webp",
      viewpoint: "/images/places/morni-hills/categories/viewpoint.webp",
      waterfall: "/images/places/morni-hills/categories/waterfall.webp",
      lake: "/images/places/morni-hills/categories/lake.webp",
      monastery: "/images/places/morni-hills/categories/monastery.webp",
      church: "/images/places/morni-hills/categories/church.webp",
      beach: "/images/places/morni-hills/categories/beach.webp",
      shopping: "/images/places/morni-hills/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "lansdowne": {
    generic: "/images/destinations/lansdowne/hero.jpg",
    categories: {
      stay: "/images/places/lansdowne/categories/stay.webp",
      cafe: "/images/places/lansdowne/categories/cafe.webp",
      food: "/images/places/lansdowne/categories/food.webp",
      nature: "/images/places/lansdowne/categories/nature.webp",
      trail: "/images/places/lansdowne/categories/nature.webp",
      heritage: "/images/places/lansdowne/categories/heritage.webp",
      spiritual: "/images/places/lansdowne/categories/spiritual.webp",
      viewpoint: "/images/places/lansdowne/categories/viewpoint.webp",
      waterfall: "/images/places/lansdowne/categories/waterfall.webp",
      lake: "/images/places/lansdowne/categories/lake.webp",
      monastery: "/images/places/lansdowne/categories/monastery.webp",
      church: "/images/places/lansdowne/categories/church.webp",
      beach: "/images/places/lansdowne/categories/beach.webp",
      shopping: "/images/places/lansdowne/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  },
  "murthal": {
    generic: "/images/destinations/murthal/hero.jpg",
    categories: {
      stay: "/images/places/murthal/categories/stay.webp",
      cafe: "/images/places/murthal/categories/cafe.webp",
      food: "/images/places/murthal/categories/food.webp",
      nature: "/images/places/murthal/categories/nature.webp",
      trail: "/images/places/murthal/categories/nature.webp",
      heritage: "/images/places/murthal/categories/heritage.webp",
      spiritual: "/images/places/murthal/categories/spiritual.webp",
      viewpoint: "/images/places/murthal/categories/viewpoint.webp",
      waterfall: "/images/places/murthal/categories/waterfall.webp",
      lake: "/images/places/murthal/categories/lake.webp",
      monastery: "/images/places/murthal/categories/monastery.webp",
      church: "/images/places/murthal/categories/church.webp",
      beach: "/images/places/murthal/categories/beach.webp",
      shopping: "/images/places/murthal/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }
  }
};

export const REGIONAL_FALLBACK_REGISTRY: Record<
  "himalayan" | "coastal" | "desert" | "valley",
  Partial<Record<string, string>>
> = {
  himalayan: {
    nature: "/images/destinations/fallbacks/himalayan.jpg",
    trail: "/images/destinations/fallbacks/himalayan.jpg",
    viewpoint: "/images/destinations/fallbacks/himalayan.jpg",
    adventure: "/images/destinations/fallbacks/himalayan.jpg",
    waterfall: "/images/destinations/fallbacks/himalayan.jpg",
    spiritual: "/images/places/universal/spiritual.webp",
    stay: "/images/places/universal/homestay.webp",
    cafe: "/images/places/universal/cafe.webp",
    food: "/images/places/universal/food.webp",
    transport: "/images/places/universal/transport.webp",
  },
  coastal: {
    nature: "/images/destinations/fallbacks/coastal.jpg",
    beach: "/images/destinations/fallbacks/coastal.jpg",
    viewpoint: "/images/destinations/fallbacks/coastal.jpg",
    adventure: "/images/destinations/fallbacks/coastal.jpg",
    spiritual: "/images/places/universal/spiritual.webp",
    stay: "/images/places/universal/resort.webp",
    cafe: "/images/places/universal/cafe.webp",
    food: "/images/places/universal/food.webp",
    transport: "/images/places/universal/transport.webp",
  },
  desert: {
    nature: "/images/destinations/fallbacks/desert.jpg",
    heritage: "/images/destinations/fallbacks/desert.jpg",
    viewpoint: "/images/destinations/fallbacks/desert.jpg",
    spiritual: "/images/places/universal/spiritual.webp",
    stay: "/images/places/universal/heritage.webp",
    cafe: "/images/places/universal/cafe.webp",
    food: "/images/places/universal/food.webp",
    transport: "/images/places/universal/transport.webp",
  },
  valley: {
    nature: "/images/destinations/fallbacks/valley.jpg",
    spiritual: "/images/places/universal/spiritual.webp",
    heritage: "/images/destinations/fallbacks/valley.jpg",
    viewpoint: "/images/destinations/fallbacks/valley.jpg",
    stay: "/images/places/universal/stay.webp",
    cafe: "/images/places/universal/cafe.webp",
    food: "/images/places/universal/food.webp",
    transport: "/images/places/universal/transport.webp",
  },
};

function cleanString(str?: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .trim()
    .replace(/[''’`]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function classifyCategoryTheme(category?: string, placeName?: string): string {
  const cat = (category || "").toLowerCase();
  const name = (placeName || "").toLowerCase();

  if (
    cat.includes("stay") ||
    cat.includes("hotel") ||
    cat.includes("resort") ||
    cat.includes("hostel") ||
    cat.includes("homestay") ||
    cat.includes("retreat") ||
    cat.includes("sanctuary") ||
    name.includes("hotel") ||
    name.includes("resort") ||
    name.includes("homestay") ||
    name.includes("hostel") ||
    name.includes("guesthouse") ||
    name.includes("cottage") ||
    name.includes("palace hotel") ||
    name.includes("inn &") ||
    name.includes("inn and")
  ) {
    return "stay";
  }

  if (
    cat.includes("cafe") ||
    cat.includes("café") ||
    cat.includes("bakery") ||
    cat.includes("coffee") ||
    cat.includes("bistro") ||
    cat.includes("roastery") ||
    name.includes("cafe") ||
    name.includes("café") ||
    name.includes("bakery") ||
    name.includes("coffee") ||
    name.includes("bistro") ||
    name.includes("roastery")
  ) {
    return "cafe";
  }

  if (
    cat.includes("food") ||
    cat.includes("restaurant") ||
    cat.includes("dhaba") ||
    cat.includes("dining") ||
    cat.includes("thali") ||
    cat.includes("sweets") ||
    cat.includes("lassi") ||
    name.includes("dhaba") ||
    name.includes("restaurant") ||
    name.includes("dining") ||
    name.includes("lassi") ||
    name.includes("sweets") ||
    name.includes("food") ||
    name.includes("kitchen") ||
    name.includes("thali") ||
    name.includes("bhojanalaya")
  ) {
    return "food";
  }

  if (cat.includes("waterfall") || cat.includes("falls") || name.includes("waterfall") || name.includes("falls")) {
    return "waterfall";
  }

  if (cat.includes("lake") || cat.includes("taal") || cat.includes("tso") || cat.includes("dam") || name.includes("lake") || name.includes("taal") || name.includes("tso") || name.includes("dam") || name.includes("pichola")) {
    return "lake";
  }

  if (cat.includes("beach") || cat.includes("cove") || cat.includes("coast") || name.includes("beach") || name.includes("cove") || name.includes("coast")) {
    return "beach";
  }

  if (
    cat.includes("viewpoint") ||
    cat.includes("crest") ||
    cat.includes("top") ||
    cat.includes("sunset") ||
    cat.includes("peak") ||
    cat.includes("summit") ||
    cat.includes("pass") ||
    name.includes("viewpoint") ||
    name.includes("crest") ||
    name.includes("top") ||
    name.includes("sunset point") ||
    name.includes("peak") ||
    name.includes("summit") ||
    name.includes("pass")
  ) {
    return "viewpoint";
  }

  if (cat.includes("monastery") || cat.includes("gompa") || cat.includes("stupa") || name.includes("monastery") || name.includes("gompa") || name.includes("stupa")) {
    return "monastery";
  }

  if (cat.includes("church") || cat.includes("cathedral") || cat.includes("basilica") || name.includes("church") || name.includes("cathedral") || name.includes("basilica")) {
    return "church";
  }

  if (
    cat.includes("spiritual") ||
    cat.includes("temple") ||
    cat.includes("ashram") ||
    cat.includes("mandir") ||
    cat.includes("kund") ||
    cat.includes("aarti") ||
    cat.includes("ghat") ||
    cat.includes("dham") ||
    cat.includes("gurudwara") ||
    name.includes("temple") ||
    name.includes("ashram") ||
    name.includes("mandir") ||
    name.includes("kund") ||
    name.includes("aarti") ||
    name.includes("ghat") ||
    name.includes("dham") ||
    name.includes("gurudwara") ||
    name.includes("math")
  ) {
    return "spiritual";
  }

  if (
    cat.includes("heritage") ||
    cat.includes("fort") ||
    cat.includes("palace") ||
    cat.includes("haveli") ||
    cat.includes("museum") ||
    cat.includes("ruins") ||
    cat.includes("memorial") ||
    cat.includes("tomb") ||
    cat.includes("archaeological") ||
    cat.includes("monument") ||
    name.includes("fort") ||
    name.includes("palace") ||
    name.includes("haveli") ||
    name.includes("museum") ||
    name.includes("ruins") ||
    name.includes("memorial") ||
    name.includes("tomb") ||
    name.includes("archaeological")
  ) {
    return "heritage";
  }

  if (
    cat.includes("shopping") ||
    cat.includes("market") ||
    cat.includes("bazaar") ||
    cat.includes("mall") ||
    cat.includes("chowk") ||
    cat.includes("plaza") ||
    cat.includes("shop") ||
    name.includes("market") ||
    name.includes("bazaar") ||
    name.includes("mall") ||
    name.includes("chowk") ||
    name.includes("plaza") ||
    name.includes("shop")
  ) {
    return "shopping";
  }

  if (
    cat.includes("mobility") ||
    cat.includes("rental") ||
    cat.includes("transport") ||
    cat.includes("scooter") ||
    cat.includes("motorcycle") ||
    cat.includes("bike") ||
    cat.includes("vehicle") ||
    name.includes("rentals") ||
    name.includes("rental") ||
    name.includes("scooters") ||
    name.includes("scooter") ||
    name.includes("bike hub") ||
    name.includes("fleet")
  ) {
    return "transport";
  }

  if (
    cat.includes("nature") ||
    cat.includes("trail") ||
    cat.includes("trek") ||
    cat.includes("park") ||
    cat.includes("wildlife") ||
    cat.includes("safari") ||
    cat.includes("sanctuary") ||
    cat.includes("forest") ||
    cat.includes("meadow") ||
    cat.includes("adventure") ||
    name.includes("trail") ||
    name.includes("meadow") ||
    name.includes("forest") ||
    name.includes("park") ||
    name.includes("garden") ||
    name.includes("wildlife") ||
    name.includes("safari") ||
    name.includes("sanctuary") ||
    name.includes("nature")
  ) {
    return "nature";
  }

  return "nature";
}

export function getUniversalFallback(theme: string): string {
  const mapping: Record<string, string> = {
    stay: "/images/places/universal/stay.webp",
    cafe: "/images/places/universal/cafe.webp",
    food: "/images/places/universal/food.webp",
    nature: "/images/places/universal/nature.webp",
    trail: "/images/places/universal/nature.webp",
    heritage: "/images/places/universal/heritage.webp",
    spiritual: "/images/places/universal/spiritual.webp",
    viewpoint: "/images/places/universal/viewpoint.webp",
    waterfall: "/images/places/universal/waterfall.webp",
    lake: "/images/places/universal/lake.webp",
    monastery: "/images/places/universal/monastery.webp",
    church: "/images/places/universal/church.webp",
    beach: "/images/places/universal/beach.webp",
    shopping: "/images/places/universal/cafe.webp",
    transport: "/images/places/universal/transport.webp",
  };
  return mapping[theme] || "/images/places/universal/nature.webp";
}

export function getRegionalFallback(category: string, destinationName: string): string {
  const cat = category.toLowerCase();
  const dest = destinationName.toLowerCase();
  if (
    cat.includes("beach") ||
    cat.includes("sea") ||
    cat.includes("ocean") ||
    cat.includes("coast") ||
    dest.includes("goa") ||
    dest.includes("gokarna") ||
    dest.includes("varkala") ||
    dest.includes("pondicherry") ||
    dest.includes("alappuzha")
  ) {
    return REGIONAL_FALLBACK_REGISTRY.coastal.beach || "/images/destinations/fallbacks/coastal.jpg";
  }
  if (
    cat.includes("desert") ||
    cat.includes("dune") ||
    cat.includes("camel") ||
    dest.includes("jaisalmer") ||
    dest.includes("jodhpur") ||
    dest.includes("bikaner") ||
    dest.includes("pushkar") ||
    dest.includes("jaipur") ||
    dest.includes("udaipur")
  ) {
    return REGIONAL_FALLBACK_REGISTRY.desert.heritage || "/images/destinations/fallbacks/desert.jpg";
  }
  if (
    cat.includes("ghat") ||
    cat.includes("temple") ||
    cat.includes("spiritual") ||
    cat.includes("heritage") ||
    dest.includes("varanasi") ||
    dest.includes("ayodhya") ||
    dest.includes("rishikesh") ||
    dest.includes("haridwar") ||
    dest.includes("delhi") ||
    dest.includes("agra") ||
    dest.includes("amritsar")
  ) {
    return REGIONAL_FALLBACK_REGISTRY.valley.heritage || "/images/destinations/fallbacks/valley.jpg";
  }
  return REGIONAL_FALLBACK_REGISTRY.himalayan.nature || "/images/destinations/fallbacks/himalayan.jpg";
}

// Build precomputed alias map for O(1) matching
const PLACE_ALIAS_MAP: Record<string, string> = {};
for (const [key, item] of Object.entries(EXACT_PLACE_REGISTRY)) {
  const dest = key.split(":")[0];
  if (item.aliases) {
    for (const al of item.aliases) {
      PLACE_ALIAS_MAP[`${dest}:${al}`] = key;
    }
  }
}

const HOTEL_ALIAS_MAP: Record<string, string> = {};
for (const [key, item] of Object.entries(EXACT_HOTEL_REGISTRY)) {
  const dest = key.split(":")[0];
  if (item.aliases) {
    for (const al of item.aliases) {
      HOTEL_ALIAS_MAP[`${dest}:${al}`] = key;
    }
  }
}

function buildContract(data: {
  url: string;
  fallbackUrl?: string;
  source: string;
  sourceType: string;
  provenance: string;
  semanticCategory: string;
  exactness: string;
  attribution?: string;
  altText: string;
  badgeLabel: string;
  visualDescription?: string;
  artworkKey?: string;
  isRealPhoto?: boolean;
}): ImageContract {
  return {
    url: data.url,
    imageUrl: data.url,
    fallback_url: data.fallbackUrl,
    fallbackUrl: data.fallbackUrl,
    source: data.source as any,
    source_type: data.sourceType as any,
    sourceType: data.sourceType as any,
    provenance: data.provenance as any,
    semantic_category: data.semanticCategory,
    semanticCategory: data.semanticCategory,
    exactness: data.exactness as any,
    attribution: data.attribution,
    alt_text: data.altText,
    altText: data.altText,
    badge_label: data.badgeLabel as any,
    badgeLabel: data.badgeLabel as any,
    visual_description: data.visualDescription,
    visualDescription: data.visualDescription,
    artwork_key: data.artworkKey,
    artworkKey: data.artworkKey,
    is_real_photo: data.isRealPhoto ?? false,
    badge: data.badgeLabel,
  };
}

export interface ResolveHotelParams {
  propertyName?: string;
  destinationName?: string;
  hotelStyle?: string;
  existingImageUrl?: string;
  isLive?: boolean;
  source?: string;
}

export function resolveHotelArtwork(
  propertyOrParams: string | ResolveHotelParams,
  destinationNameArg?: string,
  hotelStyleArg?: string,
  existingImageUrlArg?: string,
  isLiveArg?: boolean,
  sourceArg?: string
): ImageContract {
  let propertyName = "";
  let destinationName = "";
  let hotelStyle = "Boutique Sanctuary";
  let existingImageUrl: string | undefined;
  let source: string | undefined;
  let isLive: boolean | undefined;

  if (typeof propertyOrParams === "object" && propertyOrParams !== null) {
    propertyName = propertyOrParams.propertyName || "";
    destinationName = propertyOrParams.destinationName || "";
    hotelStyle = propertyOrParams.hotelStyle || "Boutique Sanctuary";
    existingImageUrl = propertyOrParams.existingImageUrl;
    source = propertyOrParams.source;
    isLive = propertyOrParams.isLive;
  } else {
    const arg1 = propertyOrParams || "";
    const arg2 = destinationNameArg || "";
    if (DESTINATION_CATEGORY_REGISTRY[cleanString(arg1)] && !DESTINATION_CATEGORY_REGISTRY[cleanString(arg2)]) {
      destinationName = arg1;
      propertyName = arg2;
    } else {
      propertyName = arg1;
      destinationName = arg2;
    }
    hotelStyle = hotelStyleArg || "Boutique Sanctuary";
    existingImageUrl = existingImageUrlArg;
    isLive = isLiveArg;
    source = sourceArg;
  }

  const destNorm = cleanString(destinationName);
  const hotelNorm = cleanString(propertyName);
  const universalFallback = "/images/places/universal/stay.webp";

  let matchedDest: string | undefined;
  for (const k of Object.keys(DESTINATION_CATEGORY_REGISTRY)) {
    if (destNorm === k || destNorm.includes(k) || k.includes(destNorm)) {
      matchedDest = k;
      break;
    }
  }

  const destConfig = matchedDest ? DESTINATION_CATEGORY_REGISTRY[matchedDest] : undefined;
  const destStayFallback = destConfig?.categories?.stay || universalFallback;

  // LEVEL 1: Verified Real External Photograph
  if (existingImageUrl && (existingImageUrl.startsWith("http://") || existingImageUrl.startsWith("https://")) && !existingImageUrl.includes("placeholder")) {
    const isWM = existingImageUrl.includes("wikimedia.org") || existingImageUrl.includes("wikidata.org");
    return buildContract({
      url: existingImageUrl,
      fallbackUrl: destStayFallback,
      source: isWM ? "wikimedia" : (source || "live_provider"),
      sourceType: "real_photo",
      provenance: isWM ? "exact_place" : "destination_category",
      semanticCategory: "stay",
      exactness: isWM ? "exact" : "approximate",
      attribution: isWM ? "Wikimedia Commons / Verified Open Source" : "Verified Hotel Photograph",
      altText: `${propertyName} in ${destinationName}`,
      badgeLabel: isWM ? "EXACT PLACE PHOTO" : "LIVE PLACE PHOTO",
      artworkKey: `stay:photo:${hotelNorm}`,
      isRealPhoto: true,
      visualDescription: `Verified photograph of ${propertyName}.`,
    });
  }

  // LEVEL 2: Verified Local Asset on Disk (Direct Exact Property Match)
  if (existingImageUrl && existingImageUrl.startsWith("/images/") && !existingImageUrl.includes("/categories/") && !existingImageUrl.includes("/fallbacks/") && !existingImageUrl.includes("/universal/")) {
    return buildContract({
      url: existingImageUrl,
      fallbackUrl: destStayFallback,
      source: source || "vanvas_curated",
      sourceType: "editorial_artwork",
      provenance: "exact_place",
      semanticCategory: "stay",
      exactness: "exact",
      attribution: "VANVAS Verified Property Asset",
      altText: `${propertyName} in ${destinationName}`,
      badgeLabel: "VANVAS PLACE ARTWORK",
      artworkKey: `stay:exact:${destNorm}:${hotelNorm}`,
      visualDescription: `Verified property artwork for ${propertyName}.`,
    });
  }

  // LEVEL 3: Curated Exact Hotel Registry (Direct Key Lookup & Alias Map)
  const lookupKey = `${destNorm}:${hotelNorm}`;
  let targetKey: string | undefined;

  if (EXACT_HOTEL_REGISTRY[lookupKey]) {
    targetKey = lookupKey;
  } else if (HOTEL_ALIAS_MAP[lookupKey]) {
    targetKey = HOTEL_ALIAS_MAP[lookupKey];
  }

  if (targetKey && EXACT_HOTEL_REGISTRY[targetKey]) {
    const item = EXACT_HOTEL_REGISTRY[targetKey];
    return buildContract({
      url: item.imageUrl,
      fallbackUrl: destStayFallback,
      source: item.source || "vanvas_curated",
      sourceType: item.sourceType || "editorial_artwork",
      provenance: "exact_place",
      semanticCategory: "stay",
      exactness: "exact",
      attribution: "VANVAS Verified Property Asset",
      altText: `${propertyName} in ${destinationName}`,
      badgeLabel: "VANVAS PLACE ARTWORK",
      artworkKey: targetKey,
      visualDescription: item.visualDescription || `Curated stay artwork for ${propertyName}.`,
    });
  }

  // LEVEL 4: Destination-Scoped Alias Matching
  for (const [regKey, item] of Object.entries(EXACT_HOTEL_REGISTRY)) {
    const [regDest, regHotel] = regKey.split(":");
    if (regDest === destNorm || regDest.includes(destNorm) || destNorm.includes(regDest)) {
      const aliases = item.aliases || [regHotel];
      if (hotelNorm === regHotel || aliases.includes(hotelNorm)) {
        return buildContract({
          url: item.imageUrl,
          fallbackUrl: destStayFallback,
          source: item.source || "vanvas_curated",
          sourceType: "editorial_artwork",
          provenance: "exact_place",
          semanticCategory: "stay",
          exactness: "exact",
          attribution: "VANVAS Verified Property Asset",
          altText: `${propertyName} in ${destinationName}`,
          badgeLabel: "VANVAS PLACE ARTWORK",
          artworkKey: regKey,
          visualDescription: item.visualDescription || `Curated stay artwork for ${propertyName}.`,
        });
      }
      for (const al of aliases) {
        if (al.length >= 4 && (hotelNorm.startsWith(`${al}-`) || hotelNorm.endsWith(`-${al}`) || hotelNorm.includes(`-${al}-`))) {
          return buildContract({
            url: item.imageUrl,
            fallbackUrl: destStayFallback,
            source: item.source || "vanvas_curated",
            sourceType: "editorial_artwork",
            provenance: "exact_place",
            semanticCategory: "stay",
            exactness: "exact",
            attribution: "VANVAS Verified Property Asset",
            altText: `${propertyName} in ${destinationName}`,
            badgeLabel: "VANVAS PLACE ARTWORK",
            artworkKey: regKey,
            visualDescription: item.visualDescription || `Curated stay artwork for ${propertyName}.`,
          });
        }
      }
    }
  }

  // LEVEL 5: Destination Stay Fallback
  if (destConfig?.categories?.stay) {
    return buildContract({
      url: destConfig.categories.stay,
      fallbackUrl: universalFallback,
      source: "vanvas_curated",
      sourceType: "category_photo",
      provenance: "destination_category",
      semanticCategory: "stay",
      exactness: "category_matched",
      attribution: `VANVAS Curated ${destinationName} Stay Sanctuary`,
      altText: `${propertyName} in ${destinationName}`,
      badgeLabel: "DESTINATION CATEGORY ART",
      artworkKey: `${matchedDest}:stay`,
      visualDescription: `Authentic ${destinationName} stay sanctuary visual.`,
    });
  }

  // LEVEL 6: Universal Fallback
  return buildContract({
    url: universalFallback,
    fallbackUrl: universalFallback,
    source: "vanvas_universal",
    sourceType: "category_photo",
    provenance: "universal_fallback",
    semanticCategory: "stay",
    exactness: "approximate",
    attribution: "VANVAS Universal Stay Atmosphere",
    altText: `${propertyName} in ${destinationName}`,
    badgeLabel: "UNIVERSAL FALLBACK",
    artworkKey: "universal:stay",
    visualDescription: `Universal accommodation sanctuary visual.`,
  });
}

export interface ResolvePlaceParams {
  placeName?: string;
  destinationName?: string;
  category?: string;
  existingImageUrl?: string;
  source?: string;
  isLive?: boolean;
}

export function resolvePlaceArtwork(
  placeOrParams: string | ResolvePlaceParams,
  destinationNameArg?: string,
  categoryArg?: string,
  existingImageUrlArg?: string,
  isLiveArg?: boolean,
  sourceArg?: string
): ImageContract {
  let placeName = "";
  let destinationName = "";
  let category = "Must Visit";
  let existingImageUrl: string | undefined;
  let source: string | undefined;
  let isLive: boolean | undefined;

  if (typeof placeOrParams === "object" && placeOrParams !== null) {
    placeName = placeOrParams.placeName || "";
    destinationName = placeOrParams.destinationName || "";
    category = placeOrParams.category || "Must Visit";
    existingImageUrl = placeOrParams.existingImageUrl;
    source = placeOrParams.source;
    isLive = placeOrParams.isLive;
  } else {
    const arg1 = placeOrParams || "";
    const arg2 = destinationNameArg || "";
    if (DESTINATION_CATEGORY_REGISTRY[cleanString(arg1)] && !DESTINATION_CATEGORY_REGISTRY[cleanString(arg2)]) {
      destinationName = arg1;
      placeName = arg2;
    } else {
      placeName = arg1;
      destinationName = arg2;
    }
    category = categoryArg || "Must Visit";
    existingImageUrl = existingImageUrlArg;
    isLive = isLiveArg;
    source = sourceArg;
  }

  const destNorm = cleanString(destinationName);
  const placeNorm = cleanString(placeName);
  const theme = classifyCategoryTheme(category, placeName);
  const universalFallback = getUniversalFallback(theme);

  // If this is explicitly a stay property, forward to property-first resolver
  if (theme === "stay") {
    return resolveHotelArtwork({
      propertyName: placeName,
      destinationName,
      hotelStyle: category,
      existingImageUrl,
      source,
    });
  }

  let matchedDest: string | undefined;
  for (const k of Object.keys(DESTINATION_CATEGORY_REGISTRY)) {
    if (destNorm === k || destNorm.includes(k) || k.includes(destNorm)) {
      matchedDest = k;
      break;
    }
  }

  const destConfig = matchedDest ? DESTINATION_CATEGORY_REGISTRY[matchedDest] : undefined;
  const destCategoryFallback = destConfig?.categories?.[theme] || undefined;
  const safeFallback = destCategoryFallback || universalFallback;

  // LEVEL 1: Verified Real External Photograph
  if (existingImageUrl && (existingImageUrl.startsWith("http://") || existingImageUrl.startsWith("https://")) && !existingImageUrl.includes("placeholder")) {
    const isWM = existingImageUrl.includes("wikimedia.org") || existingImageUrl.includes("wikidata.org");
    const badgeLabel: ProvenanceBadge = isWM ? "EXACT PLACE PHOTO" : isLive ? "LIVE PLACE PHOTO" : "VANVAS PLACE ARTWORK";
    return buildContract({
      url: existingImageUrl,
      fallbackUrl: safeFallback,
      source: isWM ? "wikimedia" : (source || "live_provider"),
      sourceType: "real_photo",
      provenance: isWM ? "exact_place" : isLive ? "live_place" : "destination_category",
      semanticCategory: theme,
      exactness: isWM || isLive ? "exact" : "approximate",
      attribution: isWM ? "Wikimedia Commons / Verified Open Source" : "Live Provider Photograph",
      altText: `${placeName} in ${destinationName}`,
      badgeLabel,
      artworkKey: `photo:${placeNorm}`,
      isRealPhoto: true,
      visualDescription: `Verified photograph of ${placeName}.`,
    });
  }

  // LEVEL 2: Verified Local Asset on Disk (Direct Exact Place Match)
  if (existingImageUrl && existingImageUrl.startsWith("/images/") && !existingImageUrl.includes("/categories/") && !existingImageUrl.includes("/fallbacks/") && !existingImageUrl.includes("/universal/")) {
    return buildContract({
      url: existingImageUrl,
      fallbackUrl: safeFallback,
      source: source || "vanvas_curated",
      sourceType: "editorial_artwork",
      provenance: "exact_place",
      semanticCategory: theme,
      exactness: "exact",
      attribution: "VANVAS Verified Editorial Asset",
      altText: `${placeName} in ${destinationName}`,
      badgeLabel: "VANVAS PLACE ARTWORK",
      artworkKey: `exact:${destNorm}:${placeNorm}`,
      visualDescription: `Verified editorial asset for ${placeName}.`,
    });
  }

  // LEVEL 3: Curated Exact Place Match (Direct Key Lookup & Alias Map)
  const lookupKey = `${destNorm}:${placeNorm}`;
  let targetKey: string | undefined;

  if (EXACT_PLACE_REGISTRY[lookupKey]) {
    targetKey = lookupKey;
  } else if (PLACE_ALIAS_MAP[lookupKey]) {
    targetKey = PLACE_ALIAS_MAP[lookupKey];
  }

  if (targetKey && EXACT_PLACE_REGISTRY[targetKey]) {
    const item = EXACT_PLACE_REGISTRY[targetKey];
    return buildContract({
      url: item.imageUrl,
      fallbackUrl: safeFallback,
      source: item.source || "vanvas_curated",
      sourceType: item.sourceType || "editorial_artwork",
      provenance: "exact_place",
      semanticCategory: item.semanticTheme || theme,
      exactness: "exact",
      attribution: "VANVAS Verified Editorial Asset",
      altText: `${placeName} in ${destinationName}`,
      badgeLabel: "VANVAS PLACE ARTWORK",
      artworkKey: targetKey,
      visualDescription: item.visualDescription || `Curated experience at ${placeName}.`,
    });
  }

  // LEVEL 4: Destination-Scoped Alias Matching
  for (const [regKey, item] of Object.entries(EXACT_PLACE_REGISTRY)) {
    const [regDest, regPlace] = regKey.split(":");
    if (regDest === destNorm || regDest.includes(destNorm) || destNorm.includes(regDest)) {
      const aliases = item.aliases || [regPlace];
      if (placeNorm === regPlace || aliases.includes(placeNorm)) {
        return buildContract({
          url: item.imageUrl,
          fallbackUrl: safeFallback,
          source: item.source || "vanvas_curated",
          sourceType: "editorial_artwork",
          provenance: "exact_place",
          semanticCategory: item.semanticTheme || theme,
          exactness: "exact",
          attribution: "VANVAS Verified Editorial Asset",
          altText: `${placeName} in ${destinationName}`,
          badgeLabel: "VANVAS PLACE ARTWORK",
          artworkKey: regKey,
          visualDescription: item.visualDescription || `Curated experience at ${placeName}.`,
        });
      }
      for (const al of aliases) {
        if (al.length >= 4 && (placeNorm.startsWith(`${al}-`) || placeNorm.endsWith(`-${al}`) || placeNorm.includes(`-${al}-`))) {
          return buildContract({
            url: item.imageUrl,
            fallbackUrl: safeFallback,
            source: item.source || "vanvas_curated",
            sourceType: "editorial_artwork",
            provenance: "exact_place",
            semanticCategory: item.semanticTheme || theme,
            exactness: "exact",
            attribution: "VANVAS Verified Editorial Asset",
            altText: `${placeName} in ${destinationName}`,
            badgeLabel: "VANVAS PLACE ARTWORK",
            artworkKey: regKey,
            visualDescription: item.visualDescription || `Curated experience at ${placeName}.`,
          });
        }
      }
    }
  }

  // LEVEL 5: Destination Category Fallback
  if (destCategoryFallback) {
    return buildContract({
      url: destCategoryFallback,
      fallbackUrl: universalFallback,
      source: "vanvas_curated",
      sourceType: "category_photo",
      provenance: "destination_category",
      semanticCategory: theme,
      exactness: "category_matched",
      attribution: `VANVAS Curated ${destinationName} Atmosphere`,
      altText: `${placeName} in ${destinationName}`,
      badgeLabel: "DESTINATION CATEGORY ART",
      artworkKey: `${matchedDest}:${theme}`,
      visualDescription: `Authentic ${destinationName} ${theme} visual.`,
    });
  }

  // LEVEL 6 & 7: Universal Fallback
  return buildContract({
    url: universalFallback,
    fallbackUrl: universalFallback,
    source: "vanvas_universal",
    sourceType: "category_photo",
    provenance: "universal_fallback",
    semanticCategory: theme,
    exactness: "approximate",
    attribution: "VANVAS Universal Travel Atmosphere",
    altText: `${placeName} in ${destinationName}`,
    badgeLabel: "UNIVERSAL FALLBACK",
    artworkKey: `universal:${theme}`,
    visualDescription: `Universal visual for ${category}.`,
  });
}
