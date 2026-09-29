/**
 * VANVAS Central Visual Intelligence & Place / Hotel Artwork Resolver
 * 
 * Strict Resolution Hierarchy:
 * LEVEL 1: Verified exact-place real photograph -> [ EXACT PLACE PHOTO ]
 * LEVEL 2: Verified exact-place Wikimedia / trusted photo -> [ EXACT PLACE PHOTO ]
 * LEVEL 3: Verified provider / live place photo -> [ LIVE PLACE PHOTO ]
 * LEVEL 4: Curated exact-place / hotel artwork (unique to landmark/property) -> [ VANVAS PLACE ARTWORK ]
 * LEVEL 5: Verified exact local asset on disk
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
  sourceType?: ImageSourceType;
  source_type?: ImageSourceType;
  source?: string;
  aliases?: string[];
  hotelStyle?: string;
}

export const EXACT_PLACE_REGISTRY: Record<string, ExactPlaceEntry> = {
  "agra:taj-mahal-white-marble-monument": {
    imageUrl: "/images/places/agra/taj-mahal.webp",
    visualDescription: "17th-century UNESCO World Heritage white marble mausoleum built by Shah Jahan on the banks of the Yamuna River.",
    category: "Must Visit",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "taj-mahal",
      "taj-mahal-white-marble-monument"
    ]
  },
  "agra:agra-red-fort-and-jahangiri-mahal": {
    imageUrl: "/images/places/agra/agra-red-fort.webp",
    visualDescription: "Historic red sandstone fortress residence of the Mughal emperors with expansive courtyards and direct vistas of the Taj Mahal.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "agra-red-fort",
      "agra-red-fort-and-jahangiri-mahal",
      "jahangiri-mahal",
      "red-fort"
    ]
  },
  "agra:mehtab-bagh-moonlight-river-gardens": {
    imageUrl: "/images/places/agra/mehtab-bagh.webp",
    visualDescription: "Charbagh-style Mughal garden complex aligned perfectly across the Yamuna from the Taj Mahal, ideal for peaceful reflection photography.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mehtab-bagh",
      "mehtab-bagh-moonlight-river-gardens",
      "moonlight-river-gardens"
    ]
  },
  "agra:fatehpur-sikri-imperial-capital-city": {
    imageUrl: "/images/places/agra/fatehpur-sikri.webp",
    visualDescription: "Emperor Akbar's 16th-century red sandstone capital featuring the towering 54m Buland Darwaza and the marble tomb of Salim Chishti.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "fatehpur-sikri",
      "fatehpur-sikri-imperial-capital-city"
    ]
  },
  "agra:tomb-of-itimad-ud-daulah-baby-taj": {
    imageUrl: "/images/places/agra/itmad-ud-daulah.webp",
    visualDescription: "Exquisite jewel-box mausoleum built in 1628 with fine marble lattice screens and pioneering pietra dura semi-precious stone inlay work.",
    category: "Hidden Gems",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "baby-taj",
      "itmad-ud-daulah",
      "tomb-of-itimad-ud-daulah",
      "tomb-of-itimad-ud-daulah-baby-taj"
    ]
  },
  "agra:shankar-mithai-bhandar-bedmi-puri-and-jalebi": {
    imageUrl: "/images/places/agra/shankar-mithai-bedmi.webp",
    visualDescription: "Historic Agra breakfast spot in the Old City serving hot urad-dal stuffed Bedmi Puris with spicy Hing aloo sabzi and crisp saffron jalebis.",
    category: "Local Food",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bedmi-puri",
      "jalebi",
      "shankar-mithai-bedmi",
      "shankar-mithai-bhandar",
      "shankar-mithai-bhandar-bedmi-puri-and-jalebi"
    ]
  },
  "agra:panchhi-petha-original-sadar-bazaar": {
    imageUrl: "/images/places/agra/panchhi-petha-store.webp",
    visualDescription: "The authentic master confectioner of Agra serving Angoori Petha, Kesar Petha, Chocolate Petha, and crunchy Dalmoth namkeen.",
    category: "Local Food",
    semanticTheme: "shopping",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "panchhi-petha-original-sadar-bazaar",
      "panchhi-petha-store"
    ]
  },
  "agra:akbars-great-tomb-at-sikandra": {
    imageUrl: "/images/places/agra/akbar-tomb-sikandra.webp",
    visualDescription: "Grand five-tiered red sandstone and white marble tomb set within a vast 119-acre garden where blackbuck deer and peacocks roam freely.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "akbar-tomb-sikandra",
      "akbars-great-tomb-at-sikandra"
    ]
  },
  "alwar-siliserh:siliserh-lake-palace-and-royal-boat-club": {
    imageUrl: "/images/places/alwar-siliserh/siliserh-lake-palace.webp",
    visualDescription: "1845 royal hunting lodge built by Maharaja Vinay Singh atop a hillock jutting into the peaceful 10.5 sq km Siliserh water reservoir.",
    category: "Must Visit",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "royal-boat-club",
      "siliserh-lake-palace",
      "siliserh-lake-palace-and-royal-boat-club"
    ]
  },
  "alwar-siliserh:bala-quila-alwar-hilltop-fort": {
    imageUrl: "/images/places/alwar-siliserh/bala-quila-alwar-fort.webp",
    visualDescription: "Massive 10th-century fortification standing 300m above the city with 51 large towers, 446 loopholes for musketry, and grand city ramparts.",
    category: "Must Visit",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "alwar-hilltop-fort",
      "bala-quila",
      "bala-quila-alwar-fort",
      "bala-quila-alwar-hilltop-fort"
    ]
  },
  "alwar-siliserh:alwar-city-palace-vinay-vilas-mahal": {
    imageUrl: "/images/places/alwar-siliserh/alwar-city-palace.webp",
    visualDescription: "18th-century palace blending Rajput and Mughal architecture featuring stepped open courtyards, marble pavilions, and the royal Sagar tank.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "alwar-city-palace",
      "alwar-city-palace-vinay-vilas-mahal",
      "alwar-siliserh-city-palace",
      "city-palace",
      "city-palace-alwar-siliserh",
      "city-palace-of-alwar-siliserh",
      "city-palace-of-udaipur",
      "city-palace-udaipur",
      "vinay-vilas-mahal"
    ]
  },
  "alwar-siliserh:moosi-maharani-ki-chhatri-cenotaph": {
    imageUrl: "/images/places/alwar-siliserh/moosi-maharani-chhatri.webp",
    visualDescription: "Double-story cenotaph of red sandstone and pure white marble dedicated to Maharaja Bakhtawar Singh and Rani Moosi, with intricate mythological fres...",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "moosi-maharani-chhatri",
      "moosi-maharani-ki-chhatri-cenotaph"
    ]
  },
  "alwar-siliserh:baba-thakur-das-and-sons-origin-of-alwar-kalakand": {
    imageUrl: "/images/places/alwar-siliserh/baba-thakur-das-kalakand.webp",
    visualDescription: "The historic confectioner operating since 1947 who invented the world-famous Alwar Milk Cake (Kalakand), made from condensed milk and cardamom.",
    category: "Local Food",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "baba-thakur-das",
      "baba-thakur-das-and-sons-origin-of-alwar-kalakand",
      "baba-thakur-das-kalakand",
      "origin-of-alwar-kalakand",
      "sons"
    ]
  },
  "alwar-siliserh:jai-samand-lake-oasis": {
    imageUrl: "/images/places/alwar-siliserh/jai-samand-lake-alwar.webp",
    visualDescription: "Large artificial lake built by Maharaja Jai Singh in 1910, surrounded by green lawns, scenic chhattris, and seasonal flamingo flocks.",
    category: "Nature & Trails",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jai-samand-lake-alwar",
      "jai-samand-lake-oasis"
    ]
  },
  "alwar-siliserh:government-museum-royal-armor-and-manuscripts": {
    imageUrl: "/images/places/alwar-siliserh/government-museum-alwar.webp",
    visualDescription: "Museum housed inside the City Palace top floor containing priceless Mughal miniature paintings, Persian manuscripts, and ancient Rajput swords.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "government-museum",
      "government-museum-alwar",
      "government-museum-royal-armor-and-manuscripts",
      "manuscripts",
      "royal-armor"
    ]
  },
  "alwar-siliserh:fateh-jung-ka-gumbad-1647-tomb": {
    imageUrl: "/images/places/alwar-siliserh/fateh-jung-gumbad.webp",
    visualDescription: "Majestic 5-story 60-foot domed tomb blending Pathan and Rajput architectural styles, set within quiet gardens near Alwar railway station.",
    category: "Hidden Gems",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "1647-tomb",
      "fateh-jung-gumbad",
      "fateh-jung-ka-gumbad",
      "fateh-jung-ka-gumbad-1647-tomb"
    ]
  },
  "chandigarh:rock-garden-of-chandigarh-nek-chands-fantasy": {
    imageUrl: "/images/places/chandigarh/rock-garden-chandigarh.webp",
    visualDescription: "A 40-acre sculpture garden built entirely by Nek Chand using industrial, ceramic, and domestic waste, featuring stone courtyards and waterfalls.",
    category: "Must Visit",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "nek-chands-fantasy",
      "rock-garden",
      "rock-garden-chandigarh",
      "rock-garden-of-chandigarh",
      "rock-garden-of-chandigarh-nek-chands-fantasy"
    ]
  },
  "chandigarh:sukhna-lake-promenade-and-shivalik-views": {
    imageUrl: "/images/places/chandigarh/sukhna-lake-promenade.webp",
    visualDescription: "A 3 sq km pristine rain-fed reservoir at the foothills of the Shivalik hills, famous for morning jogging tracks, solar boats, and quiet sunset benc...",
    category: "Must Visit",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "shivalik-views",
      "sukhna-lake-promenade",
      "sukhna-lake-promenade-and-shivalik-views"
    ]
  },
  "chandigarh:le-corbusier-capitol-complex-unesco-heritage": {
    imageUrl: "/images/places/chandigarh/capitol-complex-unesco.webp",
    visualDescription: "Le Corbusier's modernist masterwork featuring the monumental Open Hand Monument, Secretariat, High Court, and Palace of Assembly.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "capitol-complex-unesco",
      "le-corbusier-capitol-complex",
      "le-corbusier-capitol-complex-unesco-heritage",
      "unesco-heritage"
    ]
  },
  "chandigarh:zakir-hussain-rose-garden": {
    imageUrl: "/images/places/chandigarh/rose-garden-chandigarh.webp",
    visualDescription: "Asia's largest botanical rose garden spread over 30 acres, showcasing over 50,000 rose bushes across 1,600 distinct varieties and medicinal trees.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "rose-garden",
      "rose-garden-chandigarh",
      "zakir-hussain-rose-garden"
    ]
  },
  "chandigarh:sector-17-open-plaza-and-pedestrian-promenade": {
    imageUrl: "/images/places/chandigarh/sector-17-plaza.webp",
    visualDescription: "The pedestrian-only open heart of Chandigarh lined with fountain squares, Phulkari embroidery emporiums, bookstores, and coffee houses.",
    category: "Markets & Craft",
    semanticTheme: "shopping",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "pedestrian-promenade",
      "sector-17-open-plaza",
      "sector-17-open-plaza-and-pedestrian-promenade",
      "sector-17-plaza"
    ]
  },
  "chandigarh:indian-coffee-house-sector-17-legacy-since-1957": {
    imageUrl: "/images/places/chandigarh/indian-coffee-house-sec17.webp",
    visualDescription: "Iconic vintage institution staffed by turbaned waiters serving filter coffee in white porcelain cups, mutton dosas, and cheese omelettes.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "indian-coffee-house",
      "indian-coffee-house-sec17",
      "indian-coffee-house-sector-17-legacy-since-1957",
      "sector-17-legacy-since-1957"
    ]
  },
  "chandigarh:pal-dhaba-legendary-butter-chicken-and-keema": {
    imageUrl: "/images/places/chandigarh/pal-dhaba-sector28.webp",
    visualDescription: "Chandigarh's most celebrated non-veg dhaba operating since 1968, famous for rich Punjabi Butter Chicken, Mutton Rogan Josh, and garlic naan.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "keema",
      "legendary-butter-chicken",
      "pal-dhaba",
      "pal-dhaba-legendary-butter-chicken-and-keema",
      "pal-dhaba-sector28"
    ]
  },
  "chandigarh:sector-10-tree-lined-boulevard-cycling-route": {
    imageUrl: "/images/places/chandigarh/boulevard-cycling-trail.webp",
    visualDescription: "Dedicated green cycle track running beneath giant banyan and jacaranda canopies connecting the Government Museum to the Arts College.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "boulevard-cycling-trail",
      "sector-10-tree-lined-boulevard-cycling-route"
    ]
  },
  "damdama-sohna:damdama-lake-natural-boating-basin": {
    imageUrl: "/images/places/damdama-sohna/damdama-lake-boating.webp",
    visualDescription: "Haryana's largest natural lake basin nestled in a scenic hollow of the Aravalli hills, offering row boating, kayaking, and migratory birdwatching.",
    category: "Must Visit",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "damdama-lake-boating",
      "damdama-lake-natural-boating-basin"
    ]
  },
  "damdama-sohna:sohna-sulphur-hot-springs-and-ancient-shiva-kund": {
    imageUrl: "/images/places/damdama-sohna/sohna-hot-springs.webp",
    visualDescription: "Natural geothermal sulphur springs bubbling from the Aravalli rock bed since antiquity, known for therapeutic mineral baths and Shiva temple.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "ancient-shiva-kund",
      "sohna-hot-springs",
      "sohna-sulphur-hot-springs",
      "sohna-sulphur-hot-springs-and-ancient-shiva-kund"
    ]
  },
  "damdama-sohna:aravalli-bio-diversity-ridge-nature-trails": {
    imageUrl: "/images/places/damdama-sohna/aravalli-bio-trails.webp",
    visualDescription: "Indigenous thorny scrub forest trails across rocky Aravalli ridges featuring leopards, nilgai, peacocks, and over 190 bird species.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "aravalli-bio-diversity-ridge-nature-trails",
      "aravalli-bio-trails"
    ]
  },
  "damdama-sohna:botanix-nature-adventure-park-and-organic-farm": {
    imageUrl: "/images/places/damdama-sohna/botanix-nature-resort-camp.webp",
    visualDescription: "30-acre botanical garden park at the foothills of the Aravallis featuring obstacle courses, rope climbing, pottery, and organic farm meals.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "botanix-nature-adventure-park",
      "botanix-nature-adventure-park-and-organic-farm",
      "botanix-nature-resort-camp",
      "organic-farm"
    ]
  },
  "damdama-sohna:sohna-hilltop-fort-ruins-and-viewpoint": {
    imageUrl: "/images/places/damdama-sohna/sohna-hilltop-fort-ruins.webp",
    visualDescription: "Historic Bharatpur-era fort ruins standing on the crest of the Sohna ridge offering sweeping panoramas of the Gurgaon plains.",
    category: "Hidden Gems",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sohna-hilltop-fort-ruins",
      "sohna-hilltop-fort-ruins-and-viewpoint",
      "viewpoint"
    ]
  },
  "damdama-sohna:shiva-tourist-complex-and-gardens": {
    imageUrl: "/images/places/damdama-sohna/shiva-tourist-complex.webp",
    visualDescription: "Haryana Tourism landscaped gardens perched on a ridge top with stone gazebo viewpoints, children's park, and restaurant.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "shiva-tourist-complex",
      "shiva-tourist-complex-and-gardens"
    ]
  },
  "damdama-sohna:dawat-e-khas-aravalli-highway-dhaba": {
    imageUrl: "/images/places/damdama-sohna/dawat-aravalli-dhaba.webp",
    visualDescription: "Rustic open-air highway dhaba on the Sohna-Alwar corridor serving traditional Bajra Khichdi, Sarson ka Saag, and Makki ki Roti with white butter.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dawat-aravalli-dhaba",
      "dawat-e-khas-aravalli-highway-dhaba"
    ]
  },
  "damdama-sohna:saras-tourist-resort-damdama-promenade": {
    imageUrl: "/images/places/damdama-sohna/saras-lake-promenade.webp",
    visualDescription: "Lakeside dining terrace offering hot snacks, tea, and outdoor seating with direct unobstructed views over the Damdama water basin.",
    category: "Cafés & Bakery",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "saras-lake-promenade",
      "saras-tourist-resort-damdama-promenade"
    ]
  },
  "dehradun:robbers-cave-guchhupani-limestone-gorge": {
    imageUrl: "/images/places/dehradun/robbers-cave.webp",
    visualDescription: "A natural 600m limestone cave formation where knee-deep subterranean icy cold water flows through narrow rock canyon walls.",
    category: "Must Visit",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "guchhupani-limestone-gorge",
      "robbers-cave",
      "robbers-cave-guchhupani-limestone-gorge"
    ]
  },
  "dehradun:forest-research-institute-colonial-colonnades": {
    imageUrl: "/images/places/dehradun/forest-research-institute.webp",
    visualDescription: "A magnificent 450-hectare Greco-Roman colonial brick heritage complex founded in 1906, housing six specialized forestry museums and botanical gardens.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "colonial-colonnades",
      "forest-research-institute",
      "forest-research-institute-colonial-colonnades"
    ]
  },
  "dehradun:mindrolling-monastery-and-great-stupa": {
    imageUrl: "/images/places/dehradun/mindrolling-monastery.webp",
    visualDescription: "One of the largest Tibetan Buddhist centers in India, featuring a 60m Great Stupa, gilded Buddha statues, and serene Japanese gardens.",
    category: "Culture & Heritage",
    semanticTheme: "monastery",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "great-stupa",
      "mindrolling-monastery",
      "mindrolling-monastery-and-great-stupa"
    ]
  },
  "dehradun:sahastradhara-thousandfold-sulphur-springs": {
    imageUrl: "/images/places/dehradun/sahastradhara-springs.webp",
    visualDescription: "Natural sulphur water spring and stepped travertine limestone cascades along the Baddi river known for medicinal mineral properties.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sahastradhara-springs",
      "sahastradhara-thousandfold-sulphur-springs"
    ]
  },
  "dehradun:tapkeshwar-mahadev-cave-temple": {
    imageUrl: "/images/places/dehradun/tapkeshwar-temple.webp",
    visualDescription: "Ancient Shiva shrine situated inside a natural river cave where water droplets continuously drip from the ceiling onto the Shivalinga.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "tapkeshwar-mahadev-cave-temple",
      "tapkeshwar-temple"
    ]
  },
  "dehradun:rajpur-road-artisan-bakeries-and-cafes": {
    imageUrl: "/images/places/dehradun/rajpur-road-cafes.webp",
    visualDescription: "The heritage colonial stretch leading to Old Rajpur lined with independent bakeries, artisanal espresso bars, and shaded outdoor patios.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "rajpur-road-artisan-bakeries",
      "rajpur-road-artisan-bakeries-and-cafes",
      "rajpur-road-cafes"
    ]
  },
  "dehradun:elloras-melting-moments-since-1953": {
    imageUrl: "/images/places/dehradun/elloras-bakery.webp",
    visualDescription: "Dehradun's legendary bakery on Rajpur Road renowned for stick jaws toffees, butter rusks, plum cakes, and signature pistachio cookies.",
    category: "Local Food",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "elloras-bakery",
      "elloras-melting-moments",
      "elloras-melting-moments-since-1953",
      "since-1953"
    ]
  },
  "dehradun:malsi-deer-park-dehradun-zoo": {
    imageUrl: "/images/places/dehradun/malsi-deer-park.webp",
    visualDescription: "A tranquil zoological woodland park in the Shivalik foothills featuring spotted deer herds, peacocks, native birds, and walking trails.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dehradun-zoo",
      "malsi-deer-park",
      "malsi-deer-park-dehradun-zoo"
    ]
  },
  "dharamshala:tsuglagkhang-complex-and-dalai-lama-temple": {
    imageUrl: "/images/places/dharamshala/tsuglagkhang-temple.webp",
    visualDescription: "The spiritual center of Tibetan Buddhism in exile, housing the main temple, Namgyal Monastery, Tibet Museum, and giant gilded statues.",
    category: "Must Visit",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dalai-lama-temple",
      "tsuglagkhang-complex",
      "tsuglagkhang-complex-and-dalai-lama-temple",
      "tsuglagkhang-temple"
    ]
  },
  "dharamshala:bhagsu-waterfall-and-shiva-cafe": {
    imageUrl: "/images/places/dharamshala/bhagsu-waterfall-shiva-cafe.webp",
    visualDescription: "A 20m mountain cascade above Bhagsu village leading up a stone-stepped mountain trail to the famous bohemian cliffside Shiva Café.",
    category: "Nature & Trails",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bhagsu-waterfall",
      "bhagsu-waterfall-and-shiva-cafe",
      "bhagsu-waterfall-shiva-cafe",
      "shiva-cafe"
    ]
  },
  "dharamshala:triund-ridge-alpine-trek-trail": {
    imageUrl: "/images/places/dharamshala/triund-trek-base.webp",
    visualDescription: "The crown jewel trek of Kangra Valley, climbing through mixed oak and rhododendron forests to a 2,828m ridge under the Dhauladhars.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "triund-ridge-alpine-trek-trail",
      "triund-trek-base"
    ]
  },
  "dharamshala:illiterati-books-and-coffee": {
    imageUrl: "/images/places/dharamshala/illiterati-cafe.webp",
    visualDescription: "Renowned wooden library café with floor-to-ceiling bookshelves, vintage pianos, and open balcony views of the Kangra Valley.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "coffee",
      "illiterati-books",
      "illiterati-books-and-coffee",
      "illiterati-cafe"
    ]
  },
  "dharamshala:st-john-in-the-wilderness-church-1852": {
    imageUrl: "/images/places/dharamshala/st-john-wilderness.webp",
    visualDescription: "Neo-Gothic 1852 stone Anglican church set amidst towering deodar forests, featuring Belgian stained-glass windows and Lord Elgin's memorial.",
    category: "Culture & Heritage",
    semanticTheme: "church",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "1852",
      "st-john-in-the-wilderness-church",
      "st-john-in-the-wilderness-church-1852",
      "st-john-wilderness"
    ]
  },
  "dharamshala:tibet-kitchen-traditional-momos-and-thukpa": {
    imageUrl: "/images/places/dharamshala/tibet-kitchen.webp",
    visualDescription: "Popular multi-story dining institution in the central square serving authentic Tibetan Tingmo, steaming Thukpa, Shaphaley, and Butter Tea.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "thukpa",
      "tibet-kitchen",
      "tibet-kitchen-traditional-momos-and-thukpa",
      "traditional-momos"
    ]
  },
  "dharamshala:dharamkot-yoga-and-meditation-village": {
    imageUrl: "/images/places/dharamshala/dharamkot-village.webp",
    visualDescription: "Quiet hilltop hamlet above McLeod Ganj known as the yoga haven of Himachal, featuring silent meditation centers and organic vegan cafés.",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dharamkot-village",
      "dharamkot-yoga",
      "dharamkot-yoga-and-meditation-village",
      "meditation-village"
    ]
  },
  "goa:chapora-fort-hilltop-viewpoint": {
    imageUrl: "/images/places/goa/chapora-fort.webp",
    visualDescription: "Historic red laterite fort overlooking the dramatic confluence of Chapora River and the Arabian Sea with vast ocean vistas.",
    category: "Must Visit",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chapora-fort",
      "chapora-fort-hilltop-viewpoint"
    ]
  },
  "goa:fontainhas-heritage-latin-quarter": {
    imageUrl: "/images/places/goa/fontainhas-latin-quarter.webp",
    visualDescription: "Asia's only preserved Portuguese Latin Quarter featuring pastel-painted heritage villas, azulejo tile work, and quiet bakeries.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "fontainhas-heritage-latin-quarter",
      "fontainhas-latin-quarter"
    ]
  },
  "goa:divar-island-village-ferry-and-backwaters": {
    imageUrl: "/images/places/goa/divar-island.webp",
    visualDescription: "A tranquil river island reached via a traditional wooden ferry, famous for emerald paddy fields, ancient churches, and serene cycling routes.",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "backwaters",
      "divar-island",
      "divar-island-village-ferry",
      "divar-island-village-ferry-and-backwaters"
    ]
  },
  "goa:ashwem-beach-casuarina-pines": {
    imageUrl: "/images/places/goa/ashwem-beach.webp",
    visualDescription: "Wide, white sandy beach lined with casuarina groves and calm shallow waters, ideal for quiet swims and tranquil seaside reading.",
    category: "Nature & Trails",
    semanticTheme: "beach",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "ashwem-beach",
      "ashwem-beach-casuarina-pines"
    ]
  },
  "goa:anjuna-flea-and-night-art-market": {
    imageUrl: "/images/places/goa/anjuna-flea-market.webp",
    visualDescription: "Bohemian open-air bazaar beneath the palm trees featuring handcrafted silver jewelry, spice sacks, indie artwork, and live musicians.",
    category: "Markets & Craft",
    semanticTheme: "shopping",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "anjuna-flea",
      "anjuna-flea-and-night-art-market",
      "anjuna-flea-market",
      "night-art-market"
    ]
  },
  "goa:dudhsagar-waterfall-jungle-trek": {
    imageUrl: "/images/places/goa/dudhsagar-falls.webp",
    visualDescription: "A magnificent four-tiered 310m milky white waterfall inside Bhagwan Mahavir Wildlife Sanctuary with scenic rail bridge views.",
    category: "Adventure & Treks",
    semanticTheme: "waterfall",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dudhsagar-falls",
      "dudhsagar-waterfall-jungle-trek"
    ]
  },
  "goa:artjuna-lifestyle-garden-cafe": {
    imageUrl: "/images/places/goa/artjuna-cafe.webp",
    visualDescription: "Open-air garden sanctuary set under mango trees, serving artisanal cold brews, tahini salads, fresh sourdough, and house smoothies.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "artjuna-cafe",
      "artjuna-lifestyle-garden-cafe"
    ]
  },
  "goa:vinayak-family-restaurant-authentic-goan-fish-thali": {
    imageUrl: "/images/places/goa/vinayak-family-restaurant.webp",
    visualDescription: "Legendary village restaurant overlooking emerald fields, serving authentic freshly caught kingfish thalis, prawn curry, and sol kadi.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "authentic-goan-fish-thali",
      "vinayak-family-restaurant",
      "vinayak-family-restaurant-authentic-goan-fish-thali"
    ]
  },
  "jaipur:nahargarh-fort-sunset-ridge": {
    imageUrl: "/images/places/jaipur/nahargarh-fort-sunset.webp",
    visualDescription: "Perched on the edge of the Aravalli hills, offering the most dramatic panoramic sunset viewpoint overlooking the entire Pink City.",
    category: "Nature & Trails",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "nahargarh-fort-sunset",
      "nahargarh-fort-sunset-ridge"
    ]
  },
  "jaipur:panna-meena-ka-kund-stepwell": {
    imageUrl: "/images/places/jaipur/panna-meena-kund.webp",
    visualDescription: "An exquisite 16th-century geometric stepwell with interlocking symmetrical staircases and octagonal gazebos near Amer.",
    category: "Hidden Gems",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "panna-meena-ka-kund-stepwell",
      "panna-meena-kund"
    ]
  },
  "jaipur:jaipur-city-palace-and-chandra-mahal": {
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
      "city-palace-of-jaipur",
      "city-palace-of-udaipur",
      "city-palace-udaipur",
      "jaipur-city-palace",
      "jaipur-city-palace-and-chandra-mahal"
    ]
  },
  "jaipur:laxmi-misthan-bhandar-lmb-1727": {
    imageUrl: "/images/places/jaipur/lmb-sweets.webp",
    visualDescription: "Historic Johari Bazaar institution famous for crisp Pyaz Kachoris, Paneer Ghewar, Royal Rajasthani Thalis, and Mawa Kachori.",
    category: "Local Food",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "laxmi-misthan-bhandar",
      "laxmi-misthan-bhandar-lmb-1727",
      "lmb-1727",
      "lmb-sweets"
    ]
  },
  "jaipur:anokhi-museum-of-hand-printing": {
    imageUrl: "/images/places/jaipur/anokhi-museum.webp",
    visualDescription: "Restored 16th-century stone haveli dedicated to the traditional art of Rajasthani woodblock hand printing with live artisan demos.",
    category: "Markets & Craft",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "anokhi-museum",
      "anokhi-museum-of-hand-printing"
    ]
  },
  "jaipur:tapri-central-rooftop-tea-lounge": {
    imageUrl: "/images/places/jaipur/tapri-central.webp",
    visualDescription: "Beloved rooftop tea salon overlooking Central Park, serving artisanal Masala Chai in clay kulhads, Bun Maska, and hand-rolled snacks.",
    category: "Cafés & Bakery",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "tapri-central",
      "tapri-central-rooftop-tea-lounge"
    ]
  },
  "jaisalmer:jaisalmer-golden-living-fort-sonar-qila": {
    imageUrl: "/images/places/jaisalmer/jaisalmer-fort.webp",
    visualDescription: "One of the world's few living forts, housing over 4,000 residents inside its 12th-century yellow sandstone ramparts, palaces, and Jain temples.",
    category: "Must Visit",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jaisalmer-fort",
      "jaisalmer-golden-living-fort",
      "jaisalmer-golden-living-fort-sonar-qila",
      "sonar-qila"
    ]
  },
  "jaisalmer:patwon-ki-haveli-filigree-architecture": {
    imageUrl: "/images/places/jaisalmer/patwon-ki-haveli.webp",
    visualDescription: "A cluster of five palatial 19th-century merchant havelis featuring over 60 exquisitely carved sandstone jharokha balconies.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "patwon-ki-haveli",
      "patwon-ki-haveli-filigree-architecture"
    ]
  },
  "jaisalmer:sam-sand-dunes-and-thar-desert-safari": {
    imageUrl: "/images/places/jaisalmer/sam-sand-dunes.webp",
    visualDescription: "Expansive golden sand dunes in the Thar Desert offering camel safaris, 4x4 dune bashing, and authentic Rajasthani folk dance under the stars.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sam-sand-dunes",
      "sam-sand-dunes-and-thar-desert-safari",
      "thar-desert-safari"
    ]
  },
  "jaisalmer:gadisar-lake-ghats-and-chattris": {
    imageUrl: "/images/places/jaisalmer/gadisar-lake.webp",
    visualDescription: "Historic 14th-century rainwater reservoir surrounded by ornate sandstone shrines, ghats, and the graceful Tilon Ki Pol gateway.",
    category: "Nature & Trails",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chattris",
      "gadisar-lake",
      "gadisar-lake-ghats",
      "gadisar-lake-ghats-and-chattris"
    ]
  },
  "jaisalmer:kuldhara-abandoned-ghost-village": {
    imageUrl: "/images/places/jaisalmer/kuldhara-abandoned-village.webp",
    visualDescription: "An eerie 13th-century Paliwal Brahmin settlement abandoned overnight in the 1800s, preserved in silent sandstone ruin in the Thar.",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kuldhara-abandoned-ghost-village",
      "kuldhara-abandoned-village"
    ]
  },
  "jaisalmer:jaisalmer-fort-seven-jain-temples": {
    imageUrl: "/images/places/jaisalmer/jain-temples-fort.webp",
    visualDescription: "Interconnected group of 15th-century yellow sandstone Jain shrines renowned for breathtaking marble idols and ornate ceiling carvings.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jain-temples",
      "jain-temples-fort",
      "jaisalmer-fort-seven-jain-temples",
      "seven-jain-temples"
    ]
  },
  "jaisalmer:the-trio-rooftop-authentic-laal-maas": {
    imageUrl: "/images/places/jaisalmer/the-trio-restaurant.webp",
    visualDescription: "Celebrated tented rooftop restaurant overlooking Mandi Chowk, famous for authentic slow-cooked Laal Maas, Ker Sangri, and Gatta Curry.",
    category: "Local Food",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "authentic-laal-maas",
      "the-trio-restaurant",
      "the-trio-rooftop",
      "the-trio-rooftop-authentic-laal-maas"
    ]
  },
  "jaisalmer:salim-singh-ki-haveli-moti-mahal": {
    imageUrl: "/images/places/jaisalmer/salim-singh-ki-haveli.webp",
    visualDescription: "Distinctive 300-year-old mansion with a narrow stone base expanding into a top floor modeled like a dancing peacock with 38 carved balconies.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "moti-mahal",
      "salim-singh-ki-haveli",
      "salim-singh-ki-haveli-moti-mahal"
    ]
  },
  "kainchi-dham:neem-karoli-baba-sacred-ashram-and-temple": {
    imageUrl: "/images/places/kainchi-dham/neem-karoli-baba-ashram.webp",
    visualDescription: "Spiritual hermitage founded in 1962 by Neem Karoli Baba Maharaj-ji, visited by global seekers for meditation, Hanuman chalisa, and prasad.",
    category: "Must Visit",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "neem-karoli-baba-ashram",
      "neem-karoli-baba-sacred-ashram",
      "neem-karoli-baba-sacred-ashram-and-temple"
    ]
  },
  "kainchi-dham:bhowali-fruit-market-and-tea-terraces": {
    imageUrl: "/images/places/kainchi-dham/bhowali-fruit-orchards.webp",
    visualDescription: "The fruit basket of Kumaon famous for juicy Himalayan apples, apricots, plums, hill strawberries, and Shyamkhet tea gardens.",
    category: "Nature & Trails",
    semanticTheme: "shopping",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bhowali-fruit-market",
      "bhowali-fruit-market-and-tea-terraces",
      "bhowali-fruit-orchards",
      "tea-terraces"
    ]
  },
  "kainchi-dham:golu-devta-temple-ghorakhal-temple-of-bells": {
    imageUrl: "/images/places/kainchi-dham/golu-devta-ghorakhal.webp",
    visualDescription: "Historic shrine dedicated to the Kumaoni God of Justice, famous for thousands of brass bells hung by devotees whose prayers were answered.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "golu-devta-ghorakhal",
      "golu-devta-temple-ghorakhal",
      "golu-devta-temple-ghorakhal-temple-of-bells",
      "temple-of-bells"
    ]
  },
  "kainchi-dham:bhimtal-lake-and-central-aquarium-island": {
    imageUrl: "/images/places/kainchi-dham/bhimtal-island-lake.webp",
    visualDescription: "Picturesque C-shaped lake larger than Naini Lake, featuring a central island aquarium accessible via traditional wooden rowing boats.",
    category: "Nature & Trails",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bhimtal-island-lake",
      "bhimtal-lake",
      "bhimtal-lake-and-central-aquarium-island",
      "central-aquarium-island"
    ]
  },
  "kainchi-dham:sattal-seven-interconnected-freshwater-lakes": {
    imageUrl: "/images/places/kainchi-dham/sattal-interconnected-lakes.webp",
    visualDescription: "An unspoiled cluster of seven interconnected freshwater lakes nestled in dense oak and pine forests, celebrated for birdwatching and kayaking.",
    category: "Hidden Gems",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sattal-interconnected-lakes",
      "sattal-seven-interconnected-freshwater-lakes"
    ]
  },
  "kainchi-dham:subhash-dhaba-traditional-kumaoni-ras-bhaat": {
    imageUrl: "/images/places/kainchi-dham/subhash-dhaba-bhowali.webp",
    visualDescription: "Famed local roadside eatery serving authentic Bhatt ki Churkani (black bean curry), Aloo ke Gutke, Rai ka Raita, and Kumaoni Singori sweets.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "subhash-dhaba",
      "subhash-dhaba-bhowali",
      "subhash-dhaba-traditional-kumaoni-ras-bhaat",
      "traditional-kumaoni-ras-bhaat"
    ]
  },
  "kainchi-dham:naukuchiatal-nine-cornered-lake": {
    imageUrl: "/images/places/kainchi-dham/naukuchiatal-lake.webp",
    visualDescription: "Deep nine-cornered mountain lake famous for paragliding over pine ridges, quiet pedal boating, and tranquil lotus ponds.",
    category: "Adventure & Treks",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "naukuchiatal",
      "naukuchiatal-lake",
      "naukuchiatal-nine-cornered-lake",
      "nine-cornered-lake"
    ]
  },
  "kainchi-dham:shyamkhet-organic-tea-garden-walk": {
    imageUrl: "/images/places/kainchi-dham/shyamkhet-tea-estate.webp",
    visualDescription: "Boutique tea plantation producing organic Himalayan orthodox green and black teas, with an open tea tasting lounge overlooking the slopes.",
    category: "Cafés & Bakery",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "shyamkhet-organic-tea-garden-walk",
      "shyamkhet-tea-estate"
    ]
  },
  "kasol:chalal-riverside-pine-trail": {
    imageUrl: "/images/places/kasol/chalal-pine-trail.webp",
    visualDescription: "Scenic 2 km walking trail from Kasol suspension bridge through dense deodar forests alongside the turquoise Parvati River.",
    category: "Must Visit",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chalal-pine-trail",
      "chalal-riverside-pine-trail"
    ]
  },
  "kasol:manikaran-sahib-gurudwara-and-hot-springs": {
    imageUrl: "/images/places/kasol/manikaran-sahib-gurudwara.webp",
    visualDescription: "Sacred pilgrimage center where boiling geothermal springs power massive community langar kitchens on the banks of Parvati River.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "hot-springs",
      "manikaran-sahib-gurudwara",
      "manikaran-sahib-gurudwara-and-hot-springs"
    ]
  },
  "kasol:tosh-village-apple-orchard-ridge": {
    imageUrl: "/images/places/kasol/tosh-village.webp",
    visualDescription: "Rustic wooden Himalayan village perched at 2,400m overlooking snow-clad peaks, waterfalls, and steep tiered apple orchards.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "tosh-village",
      "tosh-village-apple-orchard-ridge"
    ]
  },
  "kasol:moon-dance-cafe-and-german-bakery": {
    imageUrl: "/images/places/kasol/moon-dance-cafe.webp",
    visualDescription: "Kasol's iconic culinary hub since the 1990s, famous for cinnamon rolls, fresh hummus platters, shakshuka, and wood-fired pizzas.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "devraj-coffee",
      "devraj-coffee-and-german-bakery",
      "devraj-coffee-german-bakery",
      "german-bakery",
      "german-bakery-tapovan",
      "moon-dance-cafe",
      "moon-dance-cafe-and-german-bakery"
    ]
  },
  "kasol:grahan-village-heritage-trek": {
    imageUrl: "/images/places/kasol/grahan-village-trek.webp",
    visualDescription: "An offbeat 8 km trek through pine canopies and rushing stream bridges to a traditional Himachali village with no motor road.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "grahan-village-heritage-trek",
      "grahan-village-trek"
    ]
  },
  "kasol:evergreen-cafe-and-garden-lounge": {
    imageUrl: "/images/places/kasol/evergreen-cafe.webp",
    visualDescription: "Bohemian open garden restaurant serving legendary wood-fired laffa wraps, falafel platters, lamb schnitzel, and ginger mint tea.",
    category: "Local Food",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "evergreen-cafe",
      "evergreen-cafe-and-garden-lounge",
      "garden-lounge"
    ]
  },
  "kasol:kasol-nature-park-pine-walk": {
    imageUrl: "/images/places/kasol/nature-park-kasol.webp",
    visualDescription: "Protected riverbank forest park with wooden bridges, large river boulders, and shaded paths directly alongside the gushing Parvati.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kasol-nature-park-pine-walk",
      "nature-park",
      "nature-park-kasol"
    ]
  },
  "kasol:malana-village-ancient-approach-trail": {
    imageUrl: "/images/places/kasol/malana-village-gate.webp",
    visualDescription: "Ancient autonomous mountain village known as the oldest surviving democracy in the world, with distinct customs and Kanashi language.",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "malana-village-ancient-approach-trail",
      "malana-village-gate"
    ]
  },
  "lansdowne:tip-in-top-tiffin-top-snow-crest-ridge": {
    imageUrl: "/images/places/lansdowne/tip-in-top-viewpoint.webp",
    visualDescription: "Scenic hilltop ridge at 1,700m surrounded by oak and pine forests, offering sweeping panoramic views of snow-capped Chaukhamba and Trishul peaks.",
    category: "Must Visit",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "snow-crest-ridge",
      "tiffin-top",
      "tip-in-top",
      "tip-in-top-tiffin-top-snow-crest-ridge",
      "tip-in-top-viewpoint"
    ]
  },
  "lansdowne:bhulla-tal-lake-and-pine-promenade": {
    imageUrl: "/images/places/lansdowne/bhulla-tal-lake.webp",
    visualDescription: "Immaculately maintained artificial lake built by the Garhwal Rifles in memory of soldier martyrs, featuring pedal boating and bamboo bridges.",
    category: "Must Visit",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bhulla-tal-lake",
      "bhulla-tal-lake-and-pine-promenade",
      "pine-promenade"
    ]
  },
  "lansdowne:st-johns-catholic-church-1936": {
    imageUrl: "/images/places/lansdowne/st-johns-church-1936.webp",
    visualDescription: "Historic colonial stone church established in 1936 along the Mall Road, surrounded by towering blue pines and colonial walking trails.",
    category: "Culture & Heritage",
    semanticTheme: "church",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "1936",
      "st-johns-catholic-church",
      "st-johns-catholic-church-1936",
      "st-johns-church-1936"
    ]
  },
  "lansdowne:darwan-singh-regimental-museum": {
    imageUrl: "/images/places/lansdowne/garhwal-rifles-museum.webp",
    visualDescription: "Historical military museum commemorating the valor of the Garhwal Rifles since 1887, exhibiting Victoria Crosses, war trophies, and uniforms.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "darwan-singh-regimental-museum",
      "garhwal-rifles-museum"
    ]
  },
  "lansdowne:bhim-pakora-balancing-stone-wonder": {
    imageUrl: "/images/places/lansdowne/bhim-pakora-stones.webp",
    visualDescription: "A natural geological curiosity of two massive stone boulders perched on top of each other that can be moved with a single finger without falling.",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bhim-pakora-balancing-stone-wonder",
      "bhim-pakora-stones"
    ]
  },
  "lansdowne:hawaghar-pine-forest-ridge-promenade": {
    imageUrl: "/images/places/lansdowne/hawaghar-pine-walk.webp",
    visualDescription: "A scenic mountain pass overlooking the snow-covered peaks of the northern Garhwal range, ideal for morning walks and birdwatching.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "hawaghar-pine-forest-ridge-promenade",
      "hawaghar-pine-walk"
    ]
  },
  "lansdowne:lansdowne-hills-colonial-cafe-and-bakery": {
    imageUrl: "/images/places/lansdowne/lansdowne-tripund-cafe.webp",
    visualDescription: "Rustic wooden café serving freshly brewed Kumaon filter coffee, apple cinnamon cake, grilled sandwiches, and mountain herbal tea.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bakery",
      "lansdowne-hills-colonial-cafe",
      "lansdowne-hills-colonial-cafe-and-bakery",
      "lansdowne-tripund-cafe",
      "tripund-cafe"
    ]
  },
  "lansdowne:kalagarh-tiger-reserve-northern-gate": {
    imageUrl: "/images/places/lansdowne/kalagarh-tiger-gateway.webp",
    visualDescription: "The northern buffer zone of Corbett Tiger Reserve accessible from Lansdowne, featuring dense sal forests, wild Asian elephants, and tigers.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kalagarh-tiger-gateway",
      "kalagarh-tiger-reserve-northern-gate"
    ]
  },
  "leh:shanti-stupa-white-peace-pagoda": {
    imageUrl: "/images/places/leh/shanti-stupa.webp",
    visualDescription: "White-domed Buddhist stupa atop Changspa ridge holding relics of the Buddha, famous for golden hour mountain panoramas.",
    category: "Must Visit",
    semanticTheme: "monastery",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "shanti-stupa",
      "shanti-stupa-white-peace-pagoda"
    ]
  },
  "leh:thiksey-gompa-and-15m-maitreya-buddha": {
    imageUrl: "/images/places/leh/thiksey-monastery.webp",
    visualDescription: "A twelve-story monastery complex resembling the Potala Palace in Lhasa, housing a magnificent two-story gilded statue of Maitreya Buddha.",
    category: "Culture & Heritage",
    semanticTheme: "monastery",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "15m-maitreya-buddha",
      "thiksey-gompa",
      "thiksey-gompa-and-15m-maitreya-buddha",
      "thiksey-monastery"
    ]
  },
  "leh:confluence-of-indus-and-zanskar-rivers-sangam": {
    imageUrl: "/images/places/leh/sangam-confluence.webp",
    visualDescription: "The dramatic meeting point where the emerald green waters of the Indus merge with the muddy ochre currents of the rushing Zanskar.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "confluence-of-indus",
      "confluence-of-indus-and-zanskar-rivers-sangam",
      "sangam",
      "sangam-confluence",
      "zanskar-rivers"
    ]
  },
  "leh:lalas-art-cafe-restored-heritage-labrang": {
    imageUrl: "/images/places/leh/lalas-art-cafe.webp",
    visualDescription: "Historic mud-brick Buddhist temple building in Old Town Leh converted into an intimate art gallery and café serving Ladakhi Khambir bread.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "lalas-art-cafe",
      "lalas-art-cafe-restored-heritage-labrang",
      "restored-heritage-labrang"
    ]
  },
  "leh:gesmo-restaurant-and-german-bakery-since-1989": {
    imageUrl: "/images/places/leh/gesmo-restaurant.webp",
    visualDescription: "Leh's oldest beloved travelers' hub renowned for handmade yak cheese pizza, apricot pies, spicy Thukpa, and cinnamon buns.",
    category: "Local Food",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "devraj-coffee",
      "devraj-coffee-and-german-bakery",
      "devraj-coffee-german-bakery",
      "german-bakery",
      "german-bakery-tapovan",
      "gesmo-restaurant",
      "gesmo-restaurant-and-german-bakery-since-1989",
      "since-1989"
    ]
  },
  "leh:hall-of-fame-military-and-cultural-museum": {
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
      "hall-of-fame-military-and-cultural-museum"
    ]
  },
  "manali:hadimba-devi-cedar-forest-temple": {
    imageUrl: "/images/places/manali/hadimba-temple.webp",
    visualDescription: "A 16th-century four-tiered pagoda-style wooden temple nestled deep inside towering Dhungri deodar forests.",
    category: "Must Visit",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "hadimba-devi-cedar-forest-temple",
      "hadimba-devi-temple",
      "hadimba-temple"
    ]
  },
  "manali:cafe-1947-riverside-stone-cafe": {
    imageUrl: "/images/places/manali/cafe-1947.webp",
    visualDescription: "Old Manali's iconic stone café sitting directly over the rushing Manalsu river stream, renowned for wood-fired pizza and acoustic indie sets.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "cafe-1947",
      "cafe-1947-riverside",
      "cafe-1947-riverside-stone-cafe",
      "cafe-1947-riverside-stone-café",
      "café-1947",
      "riverside-stone-cafe"
    ]
  },
  "manali:jogini-waterfall-pine-trail": {
    imageUrl: "/images/places/manali/jogini-waterfall.webp",
    visualDescription: "A gentle 3 km hike through apple orchards and pine groves starting from Vashisht village leading to a cascading multi-tier waterfall.",
    category: "Nature & Trails",
    semanticTheme: "waterfall",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jogini-falls",
      "jogini-waterfall",
      "jogini-waterfall-pine-trail"
    ]
  },
  "manali:old-manali-village-and-manu-temple": {
    imageUrl: "/images/places/manali/old-manali-village.webp",
    visualDescription: "Traditional wooden Himachali architecture surrounded by apple orchards and narrow stone alleys lined with bohemian cafés.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "manu-temple",
      "old-manali-village",
      "old-manali-village-and-manu-temple",
      "old-village"
    ]
  },
  "manali:drifters-cafe-and-acoustic-inn": {
    imageUrl: "/images/places/manali/drifters-cafe.webp",
    visualDescription: "Warm wooden café offering board games, live acoustic indie sets, cinnamon French toast, and handcrafted espresso.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "acoustic-inn",
      "drifters-cafe",
      "drifters-cafe-and-acoustic-inn",
      "drifters-inn",
      "drifters-inn-and-wooden-loft",
      "drifters-inn-wooden-loft"
    ]
  },
  "manali:solang-valley-alpine-adventure-grounds": {
    imageUrl: "/images/places/manali/solang-valley.webp",
    visualDescription: "High alpine valley famous for paragliding over pine slopes, zorbing, winter ski slopes, and panoramic snow peak vistas.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "solang-valley",
      "solang-valley-alpine-adventure-grounds"
    ]
  },
  "manali:vashisht-hot-sulphur-springs-and-ancient-temple": {
    imageUrl: "/images/places/manali/vashisht-springs.webp",
    visualDescription: "Natural geothermal hot springs with stone bathing tanks attached to a 4,000-year-old wooden temple dedicated to Sage Vashistha.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "ancient-temple",
      "vashisht-hot-springs",
      "vashisht-hot-sulphur-springs",
      "vashisht-hot-sulphur-springs-and-ancient-temple",
      "vashisht-springs"
    ]
  },
  "manali:the-johnsons-cafe-and-trout-bar": {
    imageUrl: "/images/places/manali/johnsons-cafe.webp",
    visualDescription: "Celebrated garden restaurant set in a manicured lawn serving fresh wood-smoked Himalayan river trout and authentic apple cider.",
    category: "Local Food",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "johnsons-cafe",
      "johnsons-cafe-trout-bar",
      "the-johnsons-cafe",
      "the-johnsons-cafe-and-trout-bar",
      "trout-bar"
    ]
  },
  "mathura-vrindavan:bankey-bihari-temple-vrindavan": {
    imageUrl: "/images/places/mathura-vrindavan/bankey-bihari-temple.webp",
    visualDescription: "The most revered temple in Vrindavan dedicated to Lord Krishna in the Tribhanga posture, famous for dynamic curtain darshans and kirtans.",
    category: "Must Visit",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bankey-bihari-temple",
      "bankey-bihari-temple-vrindavan"
    ]
  },
  "mathura-vrindavan:shri-krishna-janmabhoomi-temple-complex": {
    imageUrl: "/images/places/mathura-vrindavan/shri-krishna-janmabhoomi.webp",
    visualDescription: "The sacred birthplace of Lord Krishna in Mathura containing the ancient prison cell (Garbha Griha), Keshavdev temple, and sacred kund.",
    category: "Must Visit",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "shri-krishna-janmabhoomi",
      "shri-krishna-janmabhoomi-temple-complex"
    ]
  },
  "mathura-vrindavan:prem-mandir-italian-carrara-marble-temple": {
    imageUrl: "/images/places/mathura-vrindavan/prem-mandir-vrindavan.webp",
    visualDescription: "Spectacular 54-acre temple carved entirely of pure Italian Carrara marble, illuminated at night with vibrant multi-colored light fountains.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "prem-mandir-italian-carrara-marble-temple",
      "prem-mandir-vrindavan"
    ]
  },
  "mathura-vrindavan:iskcon-sri-krishna-balaram-temple": {
    imageUrl: "/images/places/mathura-vrindavan/iskcon-vrindavan.webp",
    visualDescription: "International center of Hare Krishna devotion featuring pure white marble courtyards, Srila Prabhupada's Samadhi, and 24-hour Kirtan.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "iskcon-sri-krishna-balaram-temple",
      "iskcon-vrindavan"
    ]
  },
  "mathura-vrindavan:vishram-ghat-evening-yamuna-maha-aarti": {
    imageUrl: "/images/places/mathura-vrindavan/vishram-ghat-aarti.webp",
    visualDescription: "The central sacred ghat of Mathura where Lord Krishna rested after slaying Kansa; features glittering brass evening aarti over the Yamuna.",
    category: "Nature & Trails",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "vishram-ghat-aarti",
      "vishram-ghat-evening-yamuna-maha-aarti"
    ]
  },
  "mathura-vrindavan:nidhivan-sacred-basil-forest-grove": {
    imageUrl: "/images/places/mathura-vrindavan/nidhivan-grove.webp",
    visualDescription: "Mystical forest of intertwined Tulsi (holy basil) trees where divine Rasleela is believed to take place every night in complete seclusion.",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "nidhivan-grove",
      "nidhivan-sacred-basil-forest-grove"
    ]
  },
  "mathura-vrindavan:brijwasi-mithai-wala-original-mathura-peda": {
    imageUrl: "/images/places/mathura-vrindavan/brijwasi-mithai-wala.webp",
    visualDescription: "Legendary confectioner since the 1920s famous for caramelized golden Mathura Peda made from slow-cooked mawa, cardamom, and pure ghee.",
    category: "Local Food",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "brijwasi-mithai-wala",
      "brijwasi-mithai-wala-original-mathura-peda",
      "original-mathura-peda"
    ]
  },
  "mathura-vrindavan:radha-raman-ancient-self-manifested-deity": {
    imageUrl: "/images/places/mathura-vrindavan/radha-raman-temple.webp",
    visualDescription: "500-year-old temple holding the self-manifested Shaligram deity of Lord Krishna, with an eternal sacred cooking fire burning since 1542.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "radha-raman-ancient-self-manifested-deity",
      "radha-raman-temple"
    ]
  },
  "morni-hills:tikkar-taal-twin-lakes-and-boating": {
    imageUrl: "/images/places/morni-hills/tikkar-taal-lakes.webp",
    visualDescription: "Sacred interconnected twin lakes (Bada Taal and Chhota Taal) separated by a scenic hillock, offering calm pedal boating and camping.",
    category: "Must Visit",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "boating",
      "tikkar-taal-lakes",
      "tikkar-taal-twin-lakes",
      "tikkar-taal-twin-lakes-and-boating"
    ]
  },
  "morni-hills:morni-fort-17th-century-ramparts": {
    imageUrl: "/images/places/morni-hills/morni-fort-heritage.webp",
    visualDescription: "Historic hill fortress built in the 17th century on a commanding ridge overlooking the entire Morni mountain basin.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "morni-fort-17th-century-ramparts",
      "morni-fort-heritage"
    ]
  },
  "morni-hills:morni-shivalik-herbal-forest-and-bird-trail": {
    imageUrl: "/images/places/morni-hills/herbal-nature-trail.webp",
    visualDescription: "Extensive nature trails through pine, oak, and wild medicinal herbs, home to red junglefowl, kalij pheasants, and quails.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bird-trail",
      "herbal-nature-trail",
      "morni-shivalik-herbal-forest",
      "morni-shivalik-herbal-forest-and-bird-trail"
    ]
  },
  "morni-hills:adventure-park-tikkar-taal-zip-and-obstacle-course": {
    imageUrl: "/images/places/morni-hills/adventure-park-tikkar.webp",
    visualDescription: "Lakeside adventure park offering ziplining across hillocks, Burma bridges, rope climbing, and lakeside trekking trails.",
    category: "Adventure & Treks",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "adventure-park-tikkar",
      "adventure-park-tikkar-taal",
      "adventure-park-tikkar-taal-zip-and-obstacle-course",
      "obstacle-course",
      "zip"
    ]
  },
  "morni-hills:gurudwara-nada-sahib-en-route": {
    imageUrl: "/images/places/morni-hills/gurudwara-nada-sahib.webp",
    visualDescription: "Sacred Sikh shrine situated on the bank of the Ghaggar River where Guru Gobind Singh Ji stayed in 1688 after the Battle of Bhangani.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "gurudwara-nada-sahib",
      "gurudwara-nada-sahib-en-route"
    ]
  },
  "morni-hills:pheasant-breeding-centre-berwala": {
    imageUrl: "/images/places/morni-hills/berwala-pheasant-breeding.webp",
    visualDescription: "Asia's premier breeding facility for endangered Red Junglefowl and Cheer Pheasants dedicated to conservation and rewilding.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "berwala-pheasant-breeding",
      "pheasant-breeding-centre-berwala"
    ]
  },
  "morni-hills:mountain-quail-terrace-dhaba": {
    imageUrl: "/images/places/morni-hills/mountain-quail-resort-dhaba.webp",
    visualDescription: "Haryana Tourism scenic terrace overlooking the valleys serving hot aloo pyaz parathas, Kadhi Pakora, and spiced ginger tea.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mountain-quail-resort-dhaba",
      "mountain-quail-terrace-dhaba"
    ]
  },
  "morni-hills:shivalik-viewpoint-crest-and-sunset-ridge": {
    imageUrl: "/images/places/morni-hills/shivalik-viewpoint-crest.webp",
    visualDescription: "Elevated road crest along the Morni-Tikkar Taal link road offering wide unobstructed views towards the snowlines on clear winter days.",
    category: "Hidden Gems",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "shivalik-viewpoint-crest",
      "shivalik-viewpoint-crest-and-sunset-ridge",
      "sunset-ridge"
    ]
  },
  "munnar:eravikulam-national-park-rajamalai": {
    imageUrl: "/images/places/munnar/eravikulam-national-park.webp",
    visualDescription: "Sanctuary for the endangered Nilgiri Tahr mountain goat, featuring rolling shola grasslands, Anamudi Peak vistas, and blooming Neelakurinji flowers.",
    category: "Must Visit",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "eravikulam-national-park",
      "eravikulam-national-park-rajamalai",
      "rajamalai"
    ]
  },
  "munnar:mattupetty-dam-and-speedboating-basin": {
    imageUrl: "/images/places/munnar/mattupetty-dam-lake.webp",
    visualDescription: "Concrete gravity storage dam nestled amidst tea hills and dense eucalyptus forests, popular for quiet speedboating and wild elephant sightings.",
    category: "Nature & Trails",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mattupetty-dam",
      "mattupetty-dam-and-speedboating-basin",
      "mattupetty-dam-lake",
      "speedboating-basin"
    ]
  },
  "munnar:kdhp-tea-museum-and-factory-processing": {
    imageUrl: "/images/places/munnar/tata-tea-museum.webp",
    visualDescription: "Historic 1880s tea factory showcasing the evolution of Kerala's tea plantations with live orthodox tea plucking and tasting sessions.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "factory-processing",
      "kdhp-tea-museum",
      "kdhp-tea-museum-and-factory-processing",
      "tata-tea-museum"
    ]
  },
  "munnar:top-station-western-ghats-cloud-viewpoint": {
    imageUrl: "/images/places/munnar/top-station-viewpoint.webp",
    visualDescription: "The highest point on the Munnar-Kodaikanal road (1,880m) on the Kerala-Tamil Nadu border, famous for sweeping views of the Western Ghats and cloud ...",
    category: "Adventure & Treks",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "top-station-viewpoint",
      "top-station-western-ghats-cloud-viewpoint"
    ]
  },
  "munnar:attukad-waterfalls-jungle-trail": {
    imageUrl: "/images/places/munnar/attukad-waterfalls.webp",
    visualDescription: "A roaring multi-tiered waterfall cascading through deep jungle ravines and lush tea slopes, reachable via a scenic suspension bridge.",
    category: "Nature & Trails",
    semanticTheme: "waterfall",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "attukad-waterfalls",
      "attukad-waterfalls-jungle-trail"
    ]
  },
  "munnar:pothamedu-viewpoint-sunset-over-tea-valleys": {
    imageUrl: "/images/places/munnar/pothamedu-viewpoint.webp",
    visualDescription: "A serene elevated viewpoint offering wide vistas of tea, coffee, and cardamom plantations and the winding Muthirapuzha river.",
    category: "Hidden Gems",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "pothamedu-viewpoint",
      "pothamedu-viewpoint-sunset-over-tea-valleys",
      "sunset-over-tea-valleys"
    ]
  },
  "munnar:rapsy-restaurant-kerala-parotta-and-beef-fry": {
    imageUrl: "/images/places/munnar/rapsy-restaurant.webp",
    visualDescription: "Famous town center eatery serving hot layered Malabar parottas, spicy pepper beef roast, chicken biryani, and Spanish omelettes.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "beef-fry",
      "kerala-parotta",
      "rapsy-restaurant",
      "rapsy-restaurant-kerala-parotta-and-beef-fry"
    ]
  },
  "munnar:kundala-lake-and-shikara-boating": {
    imageUrl: "/images/places/munnar/kundala-lake-dam.webp",
    visualDescription: "Asia's first arch dam creating a scenic reservoir fringed by cherry blossom trees, where Kashmiri-style shikara boats glide on still waters.",
    category: "Nature & Trails",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kundala-lake",
      "kundala-lake-and-shikara-boating",
      "kundala-lake-dam",
      "shikara-boating"
    ]
  },
  "murthal:amrik-sukhdev-legendary-24-7-paratha-dhaba": {
    imageUrl: "/images/places/murthal/amrik-sukhdev-dhaba.webp",
    visualDescription: "The undisputed capital of highway gastronomy since 1956, famous for hot tandoori Aloo-Pyaaz and Gobhi parathas loaded with pure white butter.",
    category: "Must Visit",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "7-paratha-dhaba",
      "amrik-sukhdev",
      "amrik-sukhdev-dhaba",
      "amrik-sukhdev-legendary-24-7-paratha-dhaba",
      "legendary-24"
    ]
  },
  "murthal:haveli-murthal-punjabi-cultural-theme-village": {
    imageUrl: "/images/places/murthal/haveli-murthal-punjabi.webp",
    visualDescription: "A grand Punjabi heritage palace on GT Road featuring traditional village courtyards, folk dancers, camel rides, and authentic clay oven feasts.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "haveli-murthal",
      "haveli-murthal-punjabi",
      "haveli-murthal-punjabi-cultural-theme-village",
      "haveli-punjabi",
      "punjabi-cultural-theme-village"
    ]
  },
  "murthal:gulshan-dhaba-traditional-tandoori-kitchen": {
    imageUrl: "/images/places/murthal/gulshan-dhaba-traditional.webp",
    visualDescription: "Historic 1950s open highway kitchen serving authentic rustic spiced parathas, Chana Masala, Kadai Paneer, and thick sweet Lassi.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "gulshan-dhaba-traditional",
      "gulshan-dhaba-traditional-tandoori-kitchen"
    ]
  },
  "murthal:pahalwan-dhaba-pure-desi-ghee-roasters": {
    imageUrl: "/images/places/murthal/pahalwan-dhaba-murthal.webp",
    visualDescription: "Traditional wrestler-style dhaba renowned for pure desi ghee parathas, slow-cooked Dal Tadka, and hot Kadhai Doodh with thick malai.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "pahalwan-dhaba",
      "pahalwan-dhaba-murthal",
      "pahalwan-dhaba-pure-desi-ghee-roasters"
    ]
  },
  "murthal:mojoland-multi-theme-adventure-park": {
    imageUrl: "/images/places/murthal/mojoland-adventure-park.webp",
    visualDescription: "Expansive multi-theme amusement park on NH-44 featuring high-rope courses, bungee jumping, water park slides, and ATV off-roading.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mojoland-adventure-park",
      "mojoland-multi-theme-adventure-park"
    ]
  },
  "murthal:mannat-haveli-grand-highway-palace": {
    imageUrl: "/images/places/murthal/mannat-haveli-murthal.webp",
    visualDescription: "Palatial Rajasthani-Punjabi architectural stop on GT Road featuring carved stone archways, elephant fountains, and luxury dining halls.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mannat-haveli",
      "mannat-haveli-grand-highway-palace",
      "mannat-haveli-murthal"
    ]
  },
  "murthal:tomb-of-khwaja-khizr-1522-pathan-architecture": {
    imageUrl: "/images/places/murthal/khwaja-khizr-tomb.webp",
    visualDescription: "A magnificent 16th-century red sandstone and kankar tomb built during Ibrahim Lodi's reign, surrounded by quiet heritage gardens in Sonipat.",
    category: "Hidden Gems",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "1522-pathan-architecture",
      "khwaja-khizr-tomb",
      "tomb-of-khwaja-khizr",
      "tomb-of-khwaja-khizr-1522-pathan-architecture"
    ]
  },
  "murthal:dhingra-sweets-and-pure-milk-kadhai": {
    imageUrl: "/images/places/murthal/dhingra-sweets-milk-bar.webp",
    visualDescription: "Famed dairy stop serving thick saffron rabri, hot jalebis fried in pure ghee, sweet lassi, and traditional pinni sweets.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dhingra-sweets",
      "dhingra-sweets-and-pure-milk-kadhai",
      "dhingra-sweets-milk-bar",
      "pure-milk-kadhai"
    ]
  },
  "mussoorie:char-dukan-and-st-pauls-church": {
    imageUrl: "/images/places/mussoorie/char-dukan-prakash-store.webp",
    visualDescription: "A quiet cluster of four historic stalls next to the 1839 St. Paul's Anglican Church serving ginger lemon honey tea and cheese omelettes.",
    category: "Hidden Gems",
    semanticTheme: "church",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "char-dukan",
      "char-dukan-and-st-pauls-church",
      "char-dukan-prakash-store",
      "st-pauls-church"
    ]
  },
  "mussoorie:sir-george-everest-peak-and-heritage-house": {
    imageUrl: "/images/places/mussoorie/george-everest-peak.webp",
    visualDescription: "The 1832 estate and laboratory of Surveyor-General Sir George Everest, offering a scenic ridge hike with views of Aglar Valley and Doon Plains.",
    category: "Nature & Trails",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "george-everest-peak",
      "heritage-house",
      "sir-george-everest-peak",
      "sir-george-everest-peak-and-heritage-house"
    ]
  },
  "mussoorie:clouds-end-heritage-forest-sanctuary": {
    imageUrl: "/images/places/mussoorie/clouds-end-forest.webp",
    visualDescription: "The western boundary of Mussoorie surrounded by dense virgin oak and deodar forests, marking the entrance to the Benog Wildlife Sanctuary.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "clouds-end-forest",
      "clouds-end-heritage-forest-sanctuary"
    ]
  },
  "mussoorie:gun-hill-historical-viewpoint-and-cable-car": {
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
      "gun-hill-ropeway"
    ]
  },
  "mussoorie:kempty-falls-mountain-cascades": {
    imageUrl: "/images/places/mussoorie/kempty-falls-cascades.webp",
    visualDescription: "Gigantic mountain waterfall cascading down 40 feet into natural rock plunge pools in a steep mountain valley.",
    category: "Nature & Trails",
    semanticTheme: "waterfall",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kempty-falls-cascades",
      "kempty-falls-mountain-cascades"
    ]
  },
  "neemrana:neemrana-fort-palace-15th-century-ramparts": {
    imageUrl: "/images/places/neemrana/neemrana-fort-palace.webp",
    visualDescription: "14-tiered medieval fort-palace built into the Aravalli hills in 1464, featuring stepped courtyards, hanging gardens, and grand ramparts.",
    category: "Must Visit",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "fort-palace",
      "neemrana-fort-palace",
      "neemrana-fort-palace-15th-century-ramparts"
    ]
  },
  "neemrana:flying-fox-aerial-zipline-tour": {
    imageUrl: "/images/places/neemrana/flying-fox-zipline.webp",
    visualDescription: "India's premier 5-stage aerial zipline tour soaring up to 400m across the dramatic rocky gorges and ramparts of Neemrana Fort.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "flying-fox-aerial-zipline-tour",
      "flying-fox-zipline"
    ]
  },
  "neemrana:ancient-9-story-stepwell-neemrana-baori": {
    imageUrl: "/images/places/neemrana/neemrana-stepwell-baori.webp",
    visualDescription: "Massive 18th-century 9-tiered subterranean stepwell with 170 stone steps leading down to water, built for desert travelers and royal horses.",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "ancient-9-story-stepwell",
      "ancient-9-story-stepwell-neemrana-baori",
      "neemrana-baori",
      "neemrana-stepwell-baori",
      "stepwell-baori"
    ]
  },
  "neemrana:kesroli-14th-century-hill-fort-en-route": {
    imageUrl: "/images/places/neemrana/kesroli-hill-fort.webp",
    visualDescription: "Rare 700-year-old fort perched on a lone dark volcanic rock surrounded by yellow mustard fields and tranquil Mewat rural landscapes.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kesroli-14th-century-hill-fort-en-route",
      "kesroli-hill-fort"
    ]
  },
  "neemrana:neemrana-japanese-industrial-zone-and-ramen-hub": {
    imageUrl: "/images/places/neemrana/japanese-zone-cuisine.webp",
    visualDescription: "Unique international pocket housing Japanese hospitality and authentic dining spots serving handmade ramen, sushi, and matcha tea.",
    category: "Local Food",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "japanese-zone-cuisine",
      "neemrana-japanese-industrial-zone",
      "neemrana-japanese-industrial-zone-and-ramen-hub",
      "ramen-hub"
    ]
  },
  "neemrana:highway-king-nh-48-express-dhaba": {
    imageUrl: "/images/places/neemrana/highway-king-dhaba.webp",
    visualDescription: "The quintessential highway stop on NH-48 serving tandoori parathas, creamy Dal Makhani, paneer tikka, and masala chai in earthen pots.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "highway-king-dhaba",
      "highway-king-nh-48-express-dhaba"
    ]
  },
  "neemrana:baba-khetanath-hilltop-ashram-and-ridge": {
    imageUrl: "/images/places/neemrana/baba-khetanath-ashram.webp",
    visualDescription: "Peaceful hilltop spiritual hermitage atop an Aravalli peak offering panoramic views of the Rajasthan plains and serene meditation walks.",
    category: "Nature & Trails",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "baba-khetanath-ashram",
      "baba-khetanath-hilltop-ashram",
      "baba-khetanath-hilltop-ashram-and-ridge"
    ]
  },
  "neemrana:siliserh-lake-gateway-en-route": {
    imageUrl: "/images/places/neemrana/siliserh-en-route-neemrana.webp",
    visualDescription: "Royal 1845 reservoir stop en-route to Alwar with boating, crocodile sightings, and historic heritage palace terraces.",
    category: "Nature & Trails",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "siliserh-en-route",
      "siliserh-en-route-neemrana",
      "siliserh-lake-gateway-en-route"
    ]
  },
  "rishikesh:parmarth-niketan-ganga-aarti": {
    imageUrl: "/images/places/rishikesh/parmarth-niketan-aarti.webp",
    visualDescription: "The world-famous evening fire ceremony on the sacred banks of the Ganges at sunset, featuring soulful Vedic kirtans and floating lamps.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "parmarth-aarti",
      "parmarth-niketan",
      "parmarth-niketan-aarti",
      "parmarth-niketan-ganga-aarti"
    ]
  },
  "rishikesh:beatles-ashram-chaurasi-kutia": {
    imageUrl: "/images/places/rishikesh/beatles-ashram.webp",
    visualDescription: "The historic 1968 Maharishi Mahesh Yogi ashram inside Rajaji Tiger Reserve, covered in graffiti murals, meditation domes, and banyan trees.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "beatles-ashram",
      "beatles-ashram-chaurasi-kutia",
      "chaurasi-kutia",
      "the-beatles-ashram"
    ]
  },
  "rishikesh:neer-garh-cascading-waterfall": {
    imageUrl: "/images/places/rishikesh/neer-garh-waterfall.webp",
    visualDescription: "A crystal-clear natural limestone waterfall cascading into turquoise plunge pools reachable via a 1.5 km scenic jungle trail.",
    category: "Nature & Trails",
    semanticTheme: "waterfall",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "neer-garh",
      "neer-garh-cascading-waterfall",
      "neer-garh-waterfall",
      "neer-waterfall"
    ]
  },
  "rishikesh:shivpuri-white-water-river-rafting": {
    imageUrl: "/images/places/rishikesh/shivpuri-river-rafting.webp",
    visualDescription: "Grade III and IV white water river rafting starting from Shivpuri down to Nim Beach through Roller Coaster and Golf Course rapids.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "shivpuri-rafting",
      "shivpuri-river-rafting",
      "shivpuri-white-water-river-rafting"
    ]
  },
  "rishikesh:triveni-ghat-evening-maha-aarti": {
    imageUrl: "/images/places/rishikesh/triveni-ghat-aarti.webp",
    visualDescription: "Sacred confluence of three holy rivers featuring massive brass lamp ceremonies, conch shells, and floating leaf diyas.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "triveni-ghat",
      "triveni-ghat-aarti",
      "triveni-ghat-evening-maha-aarti"
    ]
  },
  "rishikesh:vashistha-cave-gufa": {
    imageUrl: "/images/places/rishikesh/vashistha-cave.webp",
    visualDescription: "An ancient natural cave on the banks of the Ganges where Sage Vashistha meditated, renowned for deep meditative silence.",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "gufa",
      "vashistha-cave",
      "vashistha-cave-gufa",
      "vashistha-gufa"
    ]
  },
  "rishikesh:devraj-coffee-and-german-bakery": {
    imageUrl: "/images/places/rishikesh/german-bakery-tapovan.webp",
    visualDescription: "Classic hillside bakery at Lakshman Jhula serving fresh apple strudel, yak cheese sandwiches, and organic espresso.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "devraj-coffee",
      "devraj-coffee-and-german-bakery",
      "devraj-coffee-german-bakery",
      "german-bakery",
      "german-bakery-tapovan"
    ]
  },
  "rishikesh:ram-jhula-suspension-bridge-promenade": {
    imageUrl: "/images/places/rishikesh/ram-jhula-promenade.webp",
    visualDescription: "Historic 230m iron suspension bridge linking Shivananda Ashram to Swarg Ashram across the turquoise waters of the Ganga.",
    category: "Must Visit",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "ram-jhula",
      "ram-jhula-promenade",
      "ram-jhula-suspension-bridge-promenade"
    ]
  },
  "sariska-bhangarh:sariska-tiger-reserve-jungle-safari": {
    imageUrl: "/images/places/sariska-bhangarh/sariska-tiger-reserve.webp",
    visualDescription: "An 881 sq km wildlife sanctuary in the Aravallis home to Royal Bengal tigers, leopards, sambar deer, striped hyenas, and rich birdlife.",
    category: "Must Visit",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sariska-tiger-reserve",
      "sariska-tiger-reserve-jungle-safari"
    ]
  },
  "sariska-bhangarh:bhangarh-fort-legendary-medieval-ruins": {
    imageUrl: "/images/places/sariska-bhangarh/bhangarh-fort-ruins.webp",
    visualDescription: "17th-century fortified township surrounded by Aravalli hills, featuring preserved royal palaces, bazaar streets, and ancient stone temples.",
    category: "Must Visit",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bhangarh-fort",
      "bhangarh-fort-legendary-medieval-ruins",
      "bhangarh-fort-ruins",
      "legendary-medieval-ruins"
    ]
  },
  "sariska-bhangarh:kankwari-fort-hilltop-fortress": {
    imageUrl: "/images/places/sariska-bhangarh/kankwari-fort.webp",
    visualDescription: "Remote 17th-century fort deep inside the Sariska tiger jungle where Mughal Emperor Aurangzeb imprisoned his elder brother Dara Shikoh.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kankwari-fort",
      "kankwari-fort-hilltop-fortress"
    ]
  },
  "sariska-bhangarh:pandupol-hanuman-temple-and-natural-water-chasm": {
    imageUrl: "/images/places/sariska-bhangarh/pandupol-hanuman-temple.webp",
    visualDescription: "Sacred shrine inside the sanctuary where strongman Bhima is believed to have cracked open the mountain with his mace to create a pathway.",
    category: "Nature & Trails",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "natural-water-chasm",
      "pandupol-hanuman-temple",
      "pandupol-hanuman-temple-and-natural-water-chasm"
    ]
  },
  "sariska-bhangarh:neelkanth-ancient-temple-complex-6th-century": {
    imageUrl: "/images/places/sariska-bhangarh/neelkanth-temple-sariska.webp",
    visualDescription: "Ruined 6th-to-10th-century stone temple complex deep in the hills featuring detailed erotic and divine carvings resembling Khajuraho.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "6th-century",
      "neelkanth-ancient-temple-complex",
      "neelkanth-ancient-temple-complex-6th-century",
      "neelkanth-temple-sariska"
    ]
  },
  "sariska-bhangarh:bhartrihari-temple-and-sacred-kund": {
    imageUrl: "/images/places/sariska-bhangarh/bhartrihari-temple-kund.webp",
    visualDescription: "Ancient pilgrimage site where King Bhartrihari of Ujjain renounced his throne and performed deep meditation in an Aravalli valley.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bhartrihari-temple",
      "bhartrihari-temple-and-sacred-kund",
      "bhartrihari-temple-kund",
      "sacred-kund"
    ]
  },
  "sariska-bhangarh:the-sariska-palace-royal-french-courtyards": {
    imageUrl: "/images/places/sariska-bhangarh/sariska-palace-courtyard.webp",
    visualDescription: "1892 hunting lodge built by Maharaja Sawai Jai Singh of Alwar, blending French and Rajput architecture with sprawling lawns and royal tea service.",
    category: "Cafés & Bakery",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sariska-palace-courtyard",
      "the-sariska-palace-royal-french-courtyards"
    ]
  },
  "sariska-bhangarh:gola-ka-baas-traditional-rajasthani-dhaba": {
    imageUrl: "/images/places/sariska-bhangarh/gola-ka-baas-dhaba.webp",
    visualDescription: "Authentic rural roadside eatery near Bhangarh serving clay oven Baati, smoked Dal, spicy Lehsun ki Chutney, and fresh buttermilk.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "gola-ka-baas-dhaba",
      "gola-ka-baas-traditional-rajasthani-dhaba"
    ]
  },
  "spiti:key-gompa-11th-century-fort-monastery": {
    imageUrl: "/images/places/spiti/key-monastery.webp",
    visualDescription: "Perched at 4,166m atop a conical hill in the Spiti Valley, Key Gompa is a fortress-like Buddhist monastery housing ancient murals and sacred texts.",
    category: "Must Visit",
    semanticTheme: "monastery",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "11th-century-fort-monastery",
      "key-gompa",
      "key-gompa-11th-century-fort-monastery",
      "key-monastery"
    ]
  },
  "spiti:dhankar-gompa-and-cliffside-fortress": {
    imageUrl: "/images/places/spiti/dhankar-monastery.webp",
    visualDescription: "The dramatic ancient capital of Spiti, clinging precariously to a razor-sharp cliff 300m above the confluence of Spiti and Pin rivers.",
    category: "Culture & Heritage",
    semanticTheme: "monastery",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "cliffside-fortress",
      "dhankar-gompa",
      "dhankar-gompa-and-cliffside-fortress",
      "dhankar-monastery"
    ]
  },
  "spiti:hikkim-worlds-highest-post-office": {
    imageUrl: "/images/places/spiti/hikkim-post-office.webp",
    visualDescription: "Located at 4,400m elevation, sending a handwritten postcard from this whitewashed stone post office is a timeless Himalayan tradition.",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "hikkim",
      "hikkim-post-office",
      "hikkim-worlds-highest-post-office",
      "worlds-highest-post-office"
    ]
  },
  "spiti:chandratal-crescent-moon-lake": {
    imageUrl: "/images/places/spiti/chandra-taal.webp",
    visualDescription: "A breathtaking high-altitude crescent lake at 4,300m surrounded by scree mountains, reflecting deep azure blues and dramatic cloudscapes.",
    category: "Nature & Trails",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chandra-taal",
      "chandratal",
      "chandratal-crescent-moon-lake",
      "crescent-moon-lake"
    ]
  },
  "spiti:langza-giant-buddha-and-marine-fossil-village": {
    imageUrl: "/images/places/spiti/langza-buddha.webp",
    visualDescription: "High village guarded by a giant golden Buddha statue facing Chau Chau Kang Nilda peak, famed for prehistoric ammonite sea fossils.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "langza-buddha",
      "langza-giant-buddha",
      "langza-giant-buddha-and-marine-fossil-village",
      "marine-fossil-village"
    ]
  },
  "spiti:komic-worlds-highest-motor-connected-village": {
    imageUrl: "/images/places/spiti/komic-village.webp",
    visualDescription: "Sitting at 4,587m, this stark village features the 14th-century Tangyud Gompa and the world's highest eco-café.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "komic",
      "komic-village",
      "komic-worlds-highest-motor-connected-village",
      "worlds-highest-motor-connected-village"
    ]
  },
  "spiti:pin-valley-national-park-and-mudh-village": {
    imageUrl: "/images/places/spiti/pin-valley-park.webp",
    visualDescription: "Glacial mountain valley renowned for rare snow leopards, Siberian ibex, and the endpoint village of Mudh with emerald barley fields.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mudh-village",
      "pin-valley-national-park",
      "pin-valley-national-park-and-mudh-village",
      "pin-valley-park"
    ]
  },
  "spiti:cafe-deyzor-and-travelers-lounge": {
    imageUrl: "/images/places/spiti/cafe-deyzor.webp",
    visualDescription: "Beloved cozy dining den in Kaza serving Spitian sea buckthorn drinks, yak cheese pastas, apple crumble, and hot momos.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "cafe-deyzor",
      "cafe-deyzor-and-travelers-lounge",
      "travelers-lounge"
    ]
  },
  "tungnath-chandrashila:chopta-alpine-meadows-mini-switzerland": {
    imageUrl: "/images/places/tungnath-chandrashila/chopta-meadows-bugyal.webp",
    visualDescription: "Lush undulating high-altitude alpine grasslands (bugyals) at 2,700m flanked by dense deodar, pine, and scarlet rhododendron forests.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chopta-alpine-meadows",
      "chopta-alpine-meadows-mini-switzerland",
      "chopta-meadows-bugyal",
      "mini-switzerland"
    ]
  },
  "tungnath-chandrashila:deoria-tal-sacred-reflection-lake": {
    imageUrl: "/images/places/tungnath-chandrashila/deoria-tal-lake.webp",
    visualDescription: "An emerald high-altitude lake at 2,438m reflecting the four-peaked Chaukhamba mountain massif on its still mirror-like water surface.",
    category: "Nature & Trails",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "deoria-tal-lake",
      "deoria-tal-sacred-reflection-lake"
    ]
  },
  "tungnath-chandrashila:rohida-oak-and-rhododendron-forest-walk": {
    imageUrl: "/images/places/tungnath-chandrashila/rohida-forest-trail.webp",
    visualDescription: "Ancient moss-draped evergreen oak trail blooming with crimson rhododendrons in spring, home to rare Himalayan monal pheasants.",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "rhododendron-forest-walk",
      "rohida-forest-trail",
      "rohida-oak",
      "rohida-oak-and-rhododendron-forest-walk"
    ]
  },
  "tungnath-chandrashila:dugalbitta-eco-camp-glade": {
    imageUrl: "/images/places/tungnath-chandrashila/dugalbitta-eco-glade.webp",
    visualDescription: "Peaceful riverside glade 6 km below Chopta offering traditional wooden tea dhabas, local Garhwali red rice meals, and camp sites.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dugalbitta-eco-camp-glade",
      "dugalbitta-eco-glade"
    ]
  },
  "tungnath-chandrashila:ukhimath-omkareshwar-winter-temple": {
    imageUrl: "/images/places/tungnath-chandrashila/ukhimath-omkareshwar.webp",
    visualDescription: "The historic 1,200-year-old wooden seat where Lord Kedarnath and Lord Madhyamaheshwar are worshipped during winter snowfall.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "ukhimath-omkareshwar",
      "ukhimath-omkareshwar-winter-temple"
    ]
  },
  "tungnath-chandrashila:sari-village-apple-terraces-and-homestay-walk": {
    imageUrl: "/images/places/tungnath-chandrashila/sari-village-base.webp",
    visualDescription: "Traditional stone-roofed Garhwali hamlet situated amidst terraced apple orchards, famous for authentic Mandua (finger millet) rotis and Jhangora kh...",
    category: "Local Food",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "homestay-walk",
      "sari-village-apple-terraces",
      "sari-village-apple-terraces-and-homestay-walk",
      "sari-village-base"
    ]
  },
  "udaipur:city-palace-complex-and-zenana-mahal": {
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
      "city-palace-of-udaipur",
      "city-palace-udaipur",
      "udaipur-city-palace",
      "zenana-mahal"
    ]
  },
  "udaipur:lake-pichola-ghats-and-island-cruise": {
    imageUrl: "/images/places/udaipur/lake-pichola-boat-ride.webp",
    visualDescription: "Scenic boat cruise across Lake Pichola offering close views of Jag Mandir Island, Taj Lake Palace, and the Old City ghats.",
    category: "Must Visit",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "island-cruise",
      "lake-pichola",
      "lake-pichola-boat-ride",
      "lake-pichola-ghats",
      "lake-pichola-ghats-and-island-cruise",
      "lake-pichola-sunset-boat-voyage",
      "pichola-boat-ride",
      "pichola-cruise"
    ]
  },
  "udaipur:bagore-ki-haveli-and-dharohar-dance": {
    imageUrl: "/images/places/udaipur/bagore-ki-haveli.webp",
    visualDescription: "18th-century waterfront haveli at Gangaur Ghat hosting the nightly Dharohar cultural folk dance and puppet performance.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bagore",
      "bagore-haveli",
      "bagore-ki-haveli",
      "bagore-ki-haveli-and-dharohar-dance",
      "dharohar-dance"
    ]
  },
  "udaipur:ambrai-ghat-sunset-promenade-manjhi-ghat": {
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
      "manjhi-ghat"
    ]
  },
  "udaipur:saheliyon-ki-bari-garden-of-maidens": {
    imageUrl: "/images/places/udaipur/saheliyon-ki-bari.webp",
    visualDescription: "Historic royal garden built in the 18th century featuring marble lotus fountains, shaded bougainvillea walkways, and bird pools.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "garden-of-maidens",
      "saheliyon",
      "saheliyon-bari",
      "saheliyon-ki-bari",
      "saheliyon-ki-bari-garden-of-maidens"
    ]
  },
  "udaipur:sajjangarh-monsoon-palace-ridge": {
    imageUrl: "/images/places/udaipur/sajjangarh-monsoon-palace.webp",
    visualDescription: "White marble hilltop palace perched 944m high on Bansdara mountain with panoramic views of Udaipur's lakes and Aravalli hills.",
    category: "Adventure & Treks",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "monsoon-palace",
      "sajjangarh",
      "sajjangarh-monsoon-palace",
      "sajjangarh-monsoon-palace-ridge"
    ]
  },
  "udaipur:jheels-ginger-coffee-bar-and-bakery": {
    imageUrl: "/images/places/udaipur/jheels-ginger-coffee.webp",
    visualDescription: "Intimate lakeside café with overhanging stone jharokha balconies serving specialty coffees, lemon tarts, and fresh shakes.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bakery",
      "jeels-coffee",
      "jeels-ginger-coffee-bar",
      "jheels-coffee",
      "jheels-ginger-coffee",
      "jheels-ginger-coffee-bar",
      "jheels-ginger-coffee-bar-and-bakery"
    ]
  },
  "udaipur:natraj-dining-hall-unlimited-mewari-thali": {
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
      "natraj-thali",
      "unlimited-mewari-thali"
    ]
  },
  "varanasi:dashashwamedh-ghat-evening-maha-aarti": {
    imageUrl: "/images/places/varanasi/dashashwamedh-ghat-aarti.webp",
    visualDescription: "The world-renowned sacred fire ritual performed at twilight by saffron-clad priests with multi-tiered brass lamps and conch shells.",
    category: "Must Visit",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dashashwamedh-ghat-aarti",
      "dashashwamedh-ghat-evening-maha-aarti"
    ]
  },
  "varanasi:assi-ghat-subah-e-banaras-morning-ceremony": {
    imageUrl: "/images/places/varanasi/assi-ghat-subah-e-banaras.webp",
    visualDescription: "Dawn cultural ceremony featuring Vedic chanting, sunrise Yajna, classical Indian raga performances, and group yoga by the river.",
    category: "Must Visit",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "assi-ghat-subah-e-banaras",
      "assi-ghat-subah-e-banaras-morning-ceremony"
    ]
  },
  "varanasi:kashi-vishwanath-temple-corridor": {
    imageUrl: "/images/places/varanasi/kashi-vishwanath-corridor.webp",
    visualDescription: "One of the 12 sacred Jyotirlingas, newly restored with an expansive red sandstone corridor connecting directly to the Ganga riverbank.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kashi-vishwanath-corridor",
      "kashi-vishwanath-temple-corridor"
    ]
  },
  "varanasi:blue-lassi-shop-historic-churn-since-1925": {
    imageUrl: "/images/places/varanasi/blue-lassi-shop.webp",
    visualDescription: "Celebrated hole-in-the-wall shop serving over 80 varieties of handcrafted hand-churned lassi served in traditional earthen kulhads.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "blue-lassi-shop",
      "blue-lassi-shop-historic-churn-since-1925",
      "historic-churn-since-1925"
    ]
  },
  "varanasi:sarnath-dhamek-stupa-and-deer-park": {
    imageUrl: "/images/places/varanasi/sarnath-deer-park.webp",
    visualDescription: "The sacred site where Lord Buddha delivered his first sermon after enlightenment; features the massive 43m Dhamek Stupa and Ashokan Pillar.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "deer-park",
      "sarnath-deer-park",
      "sarnath-dhamek-stupa",
      "sarnath-dhamek-stupa-and-deer-park"
    ]
  },
  "varanasi:manikarnika-ghat-the-eternal-flame": {
    imageUrl: "/images/places/varanasi/manikarnika-ghat.webp",
    visualDescription: "The primary sacred cremation ghat of Varanasi where the sacred funeral pyre has burned continuously for over two millennia.",
    category: "Hidden Gems",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "manikarnika-ghat",
      "manikarnika-ghat-the-eternal-flame",
      "the-eternal-flame"
    ]
  },
  "varanasi:ramnagar-fort-and-vintage-royal-museum": {
    imageUrl: "/images/places/varanasi/ramnagar-fort.webp",
    visualDescription: "18th-century cream-coloured sandstone fortification on the eastern bank of the Ganga, housing royal vintage cars, palanquins, and medieval armories.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "ramnagar-fort",
      "ramnagar-fort-and-vintage-royal-museum",
      "vintage-royal-museum"
    ]
  },
  "varanasi:laxmi-tea-stall-and-malaiyo-hub": {
    imageUrl: "/images/places/varanasi/kashi-tea-stall.webp",
    visualDescription: "Iconic alley tea corner serving spiced lemon tea, rich saffron malai toast, and seasonal winter Malaiyo (foamed milk sweet).",
    category: "Cafés & Bakery",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kashi-tea-stall",
      "laxmi-tea-stall",
      "laxmi-tea-stall-and-malaiyo-hub",
      "malaiyo-hub"
    ]
  },
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
      "landour-bakehouse-sisters-bazaar"
    ]
  },
  "mussoorie:lal-tibba": {
    imageUrl: "/images/places/mussoorie/lal-tibba.webp",
    visualDescription: "Lal Tibba",
    category: "Nature & Trails",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "lal-tibba",
      "lal-tibba-scenic-viewpoint",
      "lal-tibba-viewpoint"
    ]
  },
  "mussoorie:kempty-falls": {
    imageUrl: "/images/places/mussoorie/kempty-falls.webp",
    visualDescription: "Kempty Falls",
    category: "Nature & Trails",
    semanticTheme: "waterfall",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kempty-falls",
      "kempty-falls-cascades",
      "kempty"
    ]
  },
  "mussoorie:gun-hill": {
    imageUrl: "/images/places/mussoorie/gun-hill.webp",
    visualDescription: "Gun Hill",
    category: "Nature & Trails",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "gun-hill",
      "gun-hill-ropeway",
      "gun-hill-viewpoint"
    ]
  },
  "mussoorie:camels-back-road": {
    imageUrl: "/images/places/mussoorie/camels-back-road.webp",
    visualDescription: "Camel's Back Road",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "camels-back-road",
      "camel-back-road",
      "camels-back",
      "camel-back"
    ]
  },
  "mussoorie:mall-road": {
    imageUrl: "/images/places/mussoorie/mall-road.webp",
    visualDescription: "Mussoorie Mall Road",
    category: "Shops & Markets",
    semanticTheme: "shopping",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mall-road",
      "mussoorie-mall-road",
      "the-mall-road"
    ]
  },
  "mussoorie:george-everest": {
    imageUrl: "/images/places/mussoorie/george-everest.webp",
    visualDescription: "Sir George Everest House",
    category: "Nature & Trails",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "george-everest",
      "sir-george-everest-house",
      "george-everest-peak",
      "george-everest-house"
    ]
  },
  "mussoorie:clouds-end": {
    imageUrl: "/images/places/mussoorie/clouds-end.webp",
    visualDescription: "Cloud's End",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "clouds-end",
      "clouds-end-forest",
      "clouds-end-heritage"
    ]
  },
  "mussoorie:landour": {
    imageUrl: "/images/places/mussoorie/landour.webp",
    visualDescription: "Landour Cantonment Ridge",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "landour",
      "landour-cantonment-ridge",
      "landour-ridge"
    ]
  },
  "mussoorie:st-pauls-church": {
    imageUrl: "/images/places/mussoorie/st-pauls-church.webp",
    visualDescription: "St. Paul's Church",
    category: "Culture & Heritage",
    semanticTheme: "church",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "st-pauls-church",
      "st-paul-church",
      "st-pauls-church-landour"
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
  "dharamshala:norbulingka-institute": {
    imageUrl: "/images/places/dharamshala/norbulingka-institute.webp",
    visualDescription: "Norbulingka Tibetan Cultural Institute",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "norbulingka-institute",
      "norbulingka-tibetan-cultural-institute",
      "norbulingka"
    ]
  },
  "jaipur:nahargarh-fort": {
    imageUrl: "/images/places/jaipur/nahargarh-fort.webp",
    visualDescription: "Nahargarh Fort Sunset Bastion",
    category: "Nature & Trails",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "nahargarh-fort",
      "nahargarh-fort-sunset-bastion",
      "nahargarh",
      "nahargarh-fort-sunset",
      "nahargarh-fort-sunset-ridge"
    ]
  },
  "jaipur:amber-fort": {
    imageUrl: "/images/places/jaipur/amber-fort.webp",
    visualDescription: "Amber Fort & Maota Lake",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "amber-fort",
      "amber-fort-and-maota-lake",
      "amber-fort-and-sheesh-mahal",
      "amber",
      "amer-fort"
    ]
  },
  "jaipur:hawa-mahal": {
    imageUrl: "/images/places/jaipur/hawa-mahal.webp",
    visualDescription: "Hawa Mahal (Palace of Winds)",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "hawa-mahal",
      "hawa-mahal-palace-of-winds",
      "hawa-mahal-palace"
    ]
  },
  "leh:leh-palace": {
    imageUrl: "/images/places/leh/leh-palace.webp",
    visualDescription: "Leh Palace",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "leh-palace",
      "leh-palace-17th-century-fortress",
      "lachen-palkhar"
    ]
  },
  "leh:pangong-tso": {
    imageUrl: "/images/places/leh/pangong-tso.webp",
    visualDescription: "Pangong Tso Alpine Lake",
    category: "Nature & Trails",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "pangong-tso",
      "pangong-tso-high-altitude-salt-lake",
      "pangong-lake",
      "pangong-tso-alpine-lake",
      "pangong"
    ]
  },
  "leh:thiksey-monastery-gompa": {
    imageUrl: "/images/places/leh/thiksey-monastery-gompa.webp",
    visualDescription: "Thiksey Monastery (Gompa)",
    category: "Culture & Heritage",
    semanticTheme: "monastery",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "thiksey-monastery-gompa",
      "thiksey-monastery",
      "thiksey",
      "thiksey-gompa"
    ]
  },
  "goa:anjuna-beach": {
    imageUrl: "/images/places/goa/anjuna-beach.webp",
    visualDescription: "Anjuna Beach & Flea Market",
    category: "Nature & Trails",
    semanticTheme: "beach",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "anjuna-beach",
      "anjuna-beach-and-flea-market",
      "anjuna"
    ]
  },
  "varanasi:brijrama-palace": {
    imageUrl: "/images/places/varanasi/brijrama-palace.webp",
    visualDescription: "BrijRama Palace River Heritage",
    category: "Stays & Sanctuaries",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "brijrama-palace",
      "brijrama-palace-river-heritage",
      "brijrama",
      "brijrama-palace-heritage"
    ]
  },
  "kasol:chalal-trail": {
    imageUrl: "/images/places/kasol/chalal-trail.webp",
    visualDescription: "Chalal Pine Riverside Trail",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chalal-trail",
      "chalal-pine-riverside-trail",
      "chalal",
      "chalal-trail-pine-riverside-trail"
    ]
  },
  "rishikesh:shivpuri-rafting": {
    imageUrl: "/images/places/rishikesh/shivpuri-rafting.webp",
    visualDescription: "Shivpuri White Water Rafting",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "shivpuri-rafting",
      "shivpuri-white-water-rafting",
      "shivpuri-river-rafting",
      "shivpuri",
      "shivpuri-white-water-river-rafting"
    ]
  },
  "tungnath-chandrashila:tungnath-temple": {
    imageUrl: "/images/places/tungnath-chandrashila/tungnath-temple.webp",
    visualDescription: "Tungnath Temple",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "tungnath-temple",
      "01-tungnath-temple",
      "tungnath-temple-highest-shiva-shrine",
      "tungnath",
      "01-tungnath"
    ]
  },
  "tungnath-chandrashila:chandrashila-summit": {
    imageUrl: "/images/places/tungnath-chandrashila/chandrashila-summit.webp",
    visualDescription: "Chandrashila Summit",
    category: "Nature & Trails",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chandrashila-summit",
      "02-chandrashila-summit",
      "chandrashila-peak",
      "02-chandrashila-peak",
      "chandrashila-summit-ridge",
      "chandrashila",
      "02-chandrashila"
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
      "coral-tree-homestay"
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
      "zostel",
      "zostel-agra"
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
      "rtdc-heritage",
      "siliserh-lake-palace",
      "siliserh-lake-palace-rtdc-heritage"
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
      "fort-view-homestay-alwar"
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
      "taj-chandigarh-sector-17",
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
      "backpackers-villa",
      "backpackers-villa-chandigarh"
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
      "heritage-village-resort-spa",
      "spa"
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
      "botanix-nature-resort",
      "botanix-nature-resort-and-eco-camp",
      "botanix-nature-resort-eco-camp",
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
      "country-inn",
      "country-inn-and-suites-sohna-road",
      "country-inn-suites-sohna-road",
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
      "saiva-hill-resort-rajpur"
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
      "chonor-house-tibetan-guesthouse"
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
      "clouds-end-villa-heritage-estate"
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
      "zostel-dharamkot"
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
      "ahilya-by-the-sea"
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
      "the-postcard-velha"
    ]
  },
  "goa:casa-da-graca-heritage-homestay": {
    imageUrl: "/images/places/goa/stays/casa-da-graça-heritage-homestay.webp",
    visualDescription: "Verified property artwork for Casa da Graça Heritage Homestay in Goa.",
    category: "Stays & Sanctuaries",
    hotelStyle: "Portuguese Heritage Homestay",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "casa-da-graca-heritage-homestay",
      "casa-da-graça-heritage-homestay"
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
      "jungle-by-the-hosteller"
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
      "samode-haveli"
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
      "28-kothi-boutique-guesthouse"
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
      "moustache",
      "moustache-jaipur"
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
      "suryagarh",
      "suryagarh-jaisalmer"
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
      "killa-bhawan-heritage-stay"
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
      "jaisalmer-marriott-resort",
      "jaisalmer-marriott-resort-and-spa",
      "jaisalmer-marriott-resort-spa",
      "marriott-resort-spa",
      "spa"
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
      "zostel",
      "zostel-jaisalmer"
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
      "bara-bungalow-gethia",
      "bara-bungalow-gethia-1898-heritage"
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
      "kainchi-valley-spiritual-homestay"
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
      "parvati-kuteer-riverside-wood-cottages"
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
      "kasol-heights-resort"
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
      "kasang-regency-hill-resort"
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
      "fairydale-resort-colonial-cottage"
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
      "nimmu-house-heritage-eco-resort"
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
      "zostel",
      "zostel-leh"
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
      "stone-cottages",
      "the-himalayan",
      "the-himalayan-castle",
      "the-himalayan-castle-and-stone-cottages",
      "the-himalayan-castle-stone-cottages",
      "the-himalayan-woods-boutique-retreat"
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
      "larisa-resort",
      "larisa-resort-and-apple-orchard",
      "larisa-resort-apple-orchard"
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
      "drifters-cafe",
      "drifters-cafe-and-acoustic-inn",
      "drifters-inn",
      "drifters-inn-and-wooden-loft",
      "drifters-inn-wooden-loft",
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
      "old-manali",
      "zostel-manali",
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
      "nidhivan-sarovar-portico"
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
      "mvt-guesthouse",
      "mvt-guesthouse-and-garden-restaurant",
      "mvt-guesthouse-garden-restaurant"
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
      "brij-view-vrindavan-luxury-suites"
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
      "radha-krishna-kripa-dham-homestay"
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
      "mountain-quail-tourist-resort-tikkar-taal"
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
      "hilltop-forest-cottage-morni"
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
      "windermere-estate"
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
      "blanket-luxury-villa",
      "blanket-luxury-villa-and-spa",
      "blanket-luxury-villa-spa",
      "spa"
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
      "olive-brook-plantation-homestay"
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
      "grand-haveli-resort-murthal"
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
      "tivoli-heritage-grand-nh-44"
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
      "highway-king-hotel-sonipat"
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
      "star-hotel",
      "star-hotel-and-suites-murthal",
      "star-hotel-suites",
      "star-hotel-suites-murthal",
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
      "rokeby-manor-landour"
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
      "domas-inn-tibetan-guesthouse"
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
      "mall-road",
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
      "neemrana-fort-palace"
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
      "ramada-by-wyndham",
      "ramada-by-wyndham-neemrana"
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
      "fort-view-heritage-homestay"
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
      "aloha-ganges",
      "aloha-on-the-ganges"
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
      "glasshouse-ganges",
      "glasshouse-on-the-ganges"
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
      "ganga-kinare",
      "ganga-kinare-riverside-retreat",
      "ganga-kinare-riverside-sanctuary"
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
      "tapovan",
      "zostel-rishikesh",
      "zostel-rishikesh-tapovan",
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
      "amanbagh-luxury-sanctuary"
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
      "tigers-wildlife-resort",
      "trees",
      "trees-and-tigers-wildlife-resort",
      "trees-tigers-wildlife-resort"
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
      "vanaashrya-resort-sariska"
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
      "hotel-deyzor-kaza"
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
      "spiti-valley-eco-lodge",
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
      "dekit-norbu-homestay-kaza"
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
      "zostel-kaza",
      "zostel-spiti",
      "zostel-spiti-kaza"
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
      "alpine-meadow-eco-lodge-chopta"
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
      "magpie-jungle-camp-chopta"
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
      "chopta-meadows-homestay",
      "chopta-meadows-homestay-sari-base",
      "sari-base"
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
      "monal-himalayan-resort-dugalbitta"
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
      "jagat-niwas-palace-hotel"
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
      "amet-haveli-heritage-hotel"
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
      "tribute-lakeside-boutique-stay"
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
      "zostel",
      "zostel-udaipur"
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
      "brijrama-palace-heritage-grand"
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
      "amritara-suryauday-haveli"
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
      "stops-hostel",
      "stops-hostel-varanasi"
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
    adventure: "/images/destinations/fallbacks/desert.jpg",
    spiritual: "/images/places/universal/spiritual.webp",
    stay: "/images/places/universal/heritage.webp",
    cafe: "/images/places/universal/cafe.webp",
    food: "/images/places/universal/food.webp",
    transport: "/images/places/universal/transport.webp",
  },
  valley: {
    nature: "/images/destinations/fallbacks/valley.jpg",
    trail: "/images/destinations/fallbacks/valley.jpg",
    viewpoint: "/images/destinations/fallbacks/valley.jpg",
    adventure: "/images/destinations/fallbacks/valley.jpg",
    spiritual: "/images/places/universal/spiritual.webp",
    stay: "/images/places/universal/stay.webp",
    cafe: "/images/places/universal/cafe.webp",
    food: "/images/places/universal/food.webp",
    transport: "/images/places/universal/transport.webp",
  },
};

export const UNIVERSAL_CATEGORY_FALLBACKS: Record<string, string> = {
  nature: "/images/places/universal/nature.webp",
  trail: "/images/places/universal/trail.webp",
  waterfall: "/images/places/universal/waterfall.webp",
  lake: "/images/places/universal/lake.webp",
  beach: "/images/places/universal/beach.webp",
  viewpoint: "/images/places/universal/viewpoint.webp",
  spiritual: "/images/places/universal/spiritual.webp",
  temple: "/images/places/universal/spiritual.webp",
  monastery: "/images/places/universal/monastery.webp",
  church: "/images/places/universal/church.webp",
  heritage: "/images/places/universal/heritage.webp",
  cafe: "/images/places/universal/cafe.webp",
  food: "/images/places/universal/food.webp",
  shopping: "/images/places/universal/cafe.webp",
  adventure: "/images/places/universal/nature.webp",
  transport: "/images/places/universal/transport.webp",
  stay: "/images/places/universal/stay.webp",
  hostel: "/images/places/universal/hostel.webp",
  homestay: "/images/places/universal/homestay.webp",
  resort: "/images/places/universal/resort.webp",
  boutique: "/images/places/universal/boutique.webp",
};

export const PLACE_ALIAS_MAP: Record<string, string> = {
  "agra:taj-mahal-white-marble-monument": "agra:taj-mahal-white-marble-monument",
  "agra:taj-mahal": "agra:taj-mahal-white-marble-monument",
  "agra:agra-red-fort-and-jahangiri-mahal": "agra:agra-red-fort-and-jahangiri-mahal",
  "agra:agra-red-fort": "agra:agra-red-fort-and-jahangiri-mahal",
  "agra:jahangiri-mahal": "agra:agra-red-fort-and-jahangiri-mahal",
  "agra:red-fort": "agra:agra-red-fort-and-jahangiri-mahal",
  "agra:mehtab-bagh-moonlight-river-gardens": "agra:mehtab-bagh-moonlight-river-gardens",
  "agra:mehtab-bagh": "agra:mehtab-bagh-moonlight-river-gardens",
  "agra:moonlight-river-gardens": "agra:mehtab-bagh-moonlight-river-gardens",
  "agra:fatehpur-sikri-imperial-capital-city": "agra:fatehpur-sikri-imperial-capital-city",
  "agra:fatehpur-sikri": "agra:fatehpur-sikri-imperial-capital-city",
  "agra:tomb-of-itimad-ud-daulah-baby-taj": "agra:tomb-of-itimad-ud-daulah-baby-taj",
  "agra:itmad-ud-daulah": "agra:tomb-of-itimad-ud-daulah-baby-taj",
  "agra:baby-taj": "agra:tomb-of-itimad-ud-daulah-baby-taj",
  "agra:tomb-of-itimad-ud-daulah": "agra:tomb-of-itimad-ud-daulah-baby-taj",
  "agra:shankar-mithai-bhandar-bedmi-puri-and-jalebi": "agra:shankar-mithai-bhandar-bedmi-puri-and-jalebi",
  "agra:shankar-mithai-bedmi": "agra:shankar-mithai-bhandar-bedmi-puri-and-jalebi",
  "agra:bedmi-puri": "agra:shankar-mithai-bhandar-bedmi-puri-and-jalebi",
  "agra:jalebi": "agra:shankar-mithai-bhandar-bedmi-puri-and-jalebi",
  "agra:shankar-mithai-bhandar": "agra:shankar-mithai-bhandar-bedmi-puri-and-jalebi",
  "agra:panchhi-petha-original-sadar-bazaar": "agra:panchhi-petha-original-sadar-bazaar",
  "agra:panchhi-petha-store": "agra:panchhi-petha-original-sadar-bazaar",
  "agra:akbars-great-tomb-at-sikandra": "agra:akbars-great-tomb-at-sikandra",
  "agra:akbar-tomb-sikandra": "agra:akbars-great-tomb-at-sikandra",
  "alwar-siliserh:siliserh-lake-palace-and-royal-boat-club": "alwar-siliserh:siliserh-lake-palace-and-royal-boat-club",
  "alwar-siliserh:siliserh-lake-palace": "alwar-siliserh:siliserh-lake-palace-and-royal-boat-club",
  "alwar-siliserh:royal-boat-club": "alwar-siliserh:siliserh-lake-palace-and-royal-boat-club",
  "alwar-siliserh:bala-quila-alwar-hilltop-fort": "alwar-siliserh:bala-quila-alwar-hilltop-fort",
  "alwar-siliserh:bala-quila-alwar-fort": "alwar-siliserh:bala-quila-alwar-hilltop-fort",
  "alwar-siliserh:alwar-hilltop-fort": "alwar-siliserh:bala-quila-alwar-hilltop-fort",
  "alwar-siliserh:bala-quila": "alwar-siliserh:bala-quila-alwar-hilltop-fort",
  "alwar-siliserh:alwar-city-palace-vinay-vilas-mahal": "alwar-siliserh:alwar-city-palace-vinay-vilas-mahal",
  "alwar-siliserh:alwar-city-palace": "alwar-siliserh:alwar-city-palace-vinay-vilas-mahal",
  "alwar-siliserh:alwar-siliserh-city-palace": "alwar-siliserh:alwar-city-palace-vinay-vilas-mahal",
  "alwar-siliserh:city-palace": "alwar-siliserh:alwar-city-palace-vinay-vilas-mahal",
  "alwar-siliserh:city-palace-alwar-siliserh": "alwar-siliserh:alwar-city-palace-vinay-vilas-mahal",
  "alwar-siliserh:city-palace-of-alwar-siliserh": "alwar-siliserh:alwar-city-palace-vinay-vilas-mahal",
  "alwar-siliserh:city-palace-of-udaipur": "alwar-siliserh:alwar-city-palace-vinay-vilas-mahal",
  "alwar-siliserh:city-palace-udaipur": "alwar-siliserh:alwar-city-palace-vinay-vilas-mahal",
  "alwar-siliserh:vinay-vilas-mahal": "alwar-siliserh:alwar-city-palace-vinay-vilas-mahal",
  "alwar-siliserh:moosi-maharani-ki-chhatri-cenotaph": "alwar-siliserh:moosi-maharani-ki-chhatri-cenotaph",
  "alwar-siliserh:moosi-maharani-chhatri": "alwar-siliserh:moosi-maharani-ki-chhatri-cenotaph",
  "alwar-siliserh:baba-thakur-das-and-sons-origin-of-alwar-kalakand": "alwar-siliserh:baba-thakur-das-and-sons-origin-of-alwar-kalakand",
  "alwar-siliserh:baba-thakur-das-kalakand": "alwar-siliserh:baba-thakur-das-and-sons-origin-of-alwar-kalakand",
  "alwar-siliserh:baba-thakur-das": "alwar-siliserh:baba-thakur-das-and-sons-origin-of-alwar-kalakand",
  "alwar-siliserh:origin-of-alwar-kalakand": "alwar-siliserh:baba-thakur-das-and-sons-origin-of-alwar-kalakand",
  "alwar-siliserh:sons": "alwar-siliserh:baba-thakur-das-and-sons-origin-of-alwar-kalakand",
  "alwar-siliserh:jai-samand-lake-oasis": "alwar-siliserh:jai-samand-lake-oasis",
  "alwar-siliserh:jai-samand-lake-alwar": "alwar-siliserh:jai-samand-lake-oasis",
  "alwar-siliserh:government-museum-royal-armor-and-manuscripts": "alwar-siliserh:government-museum-royal-armor-and-manuscripts",
  "alwar-siliserh:government-museum-alwar": "alwar-siliserh:government-museum-royal-armor-and-manuscripts",
  "alwar-siliserh:government-museum": "alwar-siliserh:government-museum-royal-armor-and-manuscripts",
  "alwar-siliserh:manuscripts": "alwar-siliserh:government-museum-royal-armor-and-manuscripts",
  "alwar-siliserh:royal-armor": "alwar-siliserh:government-museum-royal-armor-and-manuscripts",
  "alwar-siliserh:fateh-jung-ka-gumbad-1647-tomb": "alwar-siliserh:fateh-jung-ka-gumbad-1647-tomb",
  "alwar-siliserh:fateh-jung-gumbad": "alwar-siliserh:fateh-jung-ka-gumbad-1647-tomb",
  "alwar-siliserh:1647-tomb": "alwar-siliserh:fateh-jung-ka-gumbad-1647-tomb",
  "alwar-siliserh:fateh-jung-ka-gumbad": "alwar-siliserh:fateh-jung-ka-gumbad-1647-tomb",
  "chandigarh:rock-garden-of-chandigarh-nek-chands-fantasy": "chandigarh:rock-garden-of-chandigarh-nek-chands-fantasy",
  "chandigarh:rock-garden-chandigarh": "chandigarh:rock-garden-of-chandigarh-nek-chands-fantasy",
  "chandigarh:nek-chands-fantasy": "chandigarh:rock-garden-of-chandigarh-nek-chands-fantasy",
  "chandigarh:rock-garden": "chandigarh:rock-garden-of-chandigarh-nek-chands-fantasy",
  "chandigarh:rock-garden-of-chandigarh": "chandigarh:rock-garden-of-chandigarh-nek-chands-fantasy",
  "chandigarh:sukhna-lake-promenade-and-shivalik-views": "chandigarh:sukhna-lake-promenade-and-shivalik-views",
  "chandigarh:sukhna-lake-promenade": "chandigarh:sukhna-lake-promenade-and-shivalik-views",
  "chandigarh:shivalik-views": "chandigarh:sukhna-lake-promenade-and-shivalik-views",
  "chandigarh:le-corbusier-capitol-complex-unesco-heritage": "chandigarh:le-corbusier-capitol-complex-unesco-heritage",
  "chandigarh:capitol-complex-unesco": "chandigarh:le-corbusier-capitol-complex-unesco-heritage",
  "chandigarh:le-corbusier-capitol-complex": "chandigarh:le-corbusier-capitol-complex-unesco-heritage",
  "chandigarh:unesco-heritage": "chandigarh:le-corbusier-capitol-complex-unesco-heritage",
  "chandigarh:zakir-hussain-rose-garden": "chandigarh:zakir-hussain-rose-garden",
  "chandigarh:rose-garden-chandigarh": "chandigarh:zakir-hussain-rose-garden",
  "chandigarh:rose-garden": "chandigarh:zakir-hussain-rose-garden",
  "chandigarh:sector-17-open-plaza-and-pedestrian-promenade": "chandigarh:sector-17-open-plaza-and-pedestrian-promenade",
  "chandigarh:sector-17-plaza": "chandigarh:sector-17-open-plaza-and-pedestrian-promenade",
  "chandigarh:pedestrian-promenade": "chandigarh:sector-17-open-plaza-and-pedestrian-promenade",
  "chandigarh:sector-17-open-plaza": "chandigarh:sector-17-open-plaza-and-pedestrian-promenade",
  "chandigarh:indian-coffee-house-sector-17-legacy-since-1957": "chandigarh:indian-coffee-house-sector-17-legacy-since-1957",
  "chandigarh:indian-coffee-house-sec17": "chandigarh:indian-coffee-house-sector-17-legacy-since-1957",
  "chandigarh:indian-coffee-house": "chandigarh:indian-coffee-house-sector-17-legacy-since-1957",
  "chandigarh:sector-17-legacy-since-1957": "chandigarh:indian-coffee-house-sector-17-legacy-since-1957",
  "chandigarh:pal-dhaba-legendary-butter-chicken-and-keema": "chandigarh:pal-dhaba-legendary-butter-chicken-and-keema",
  "chandigarh:pal-dhaba-sector28": "chandigarh:pal-dhaba-legendary-butter-chicken-and-keema",
  "chandigarh:keema": "chandigarh:pal-dhaba-legendary-butter-chicken-and-keema",
  "chandigarh:legendary-butter-chicken": "chandigarh:pal-dhaba-legendary-butter-chicken-and-keema",
  "chandigarh:pal-dhaba": "chandigarh:pal-dhaba-legendary-butter-chicken-and-keema",
  "chandigarh:sector-10-tree-lined-boulevard-cycling-route": "chandigarh:sector-10-tree-lined-boulevard-cycling-route",
  "chandigarh:boulevard-cycling-trail": "chandigarh:sector-10-tree-lined-boulevard-cycling-route",
  "damdama-sohna:damdama-lake-natural-boating-basin": "damdama-sohna:damdama-lake-natural-boating-basin",
  "damdama-sohna:damdama-lake-boating": "damdama-sohna:damdama-lake-natural-boating-basin",
  "damdama-sohna:sohna-sulphur-hot-springs-and-ancient-shiva-kund": "damdama-sohna:sohna-sulphur-hot-springs-and-ancient-shiva-kund",
  "damdama-sohna:sohna-hot-springs": "damdama-sohna:sohna-sulphur-hot-springs-and-ancient-shiva-kund",
  "damdama-sohna:ancient-shiva-kund": "damdama-sohna:sohna-sulphur-hot-springs-and-ancient-shiva-kund",
  "damdama-sohna:sohna-sulphur-hot-springs": "damdama-sohna:sohna-sulphur-hot-springs-and-ancient-shiva-kund",
  "damdama-sohna:aravalli-bio-diversity-ridge-nature-trails": "damdama-sohna:aravalli-bio-diversity-ridge-nature-trails",
  "damdama-sohna:aravalli-bio-trails": "damdama-sohna:aravalli-bio-diversity-ridge-nature-trails",
  "damdama-sohna:botanix-nature-adventure-park-and-organic-farm": "damdama-sohna:botanix-nature-adventure-park-and-organic-farm",
  "damdama-sohna:botanix-nature-resort-camp": "damdama-sohna:botanix-nature-adventure-park-and-organic-farm",
  "damdama-sohna:botanix-nature-adventure-park": "damdama-sohna:botanix-nature-adventure-park-and-organic-farm",
  "damdama-sohna:organic-farm": "damdama-sohna:botanix-nature-adventure-park-and-organic-farm",
  "damdama-sohna:sohna-hilltop-fort-ruins-and-viewpoint": "damdama-sohna:sohna-hilltop-fort-ruins-and-viewpoint",
  "damdama-sohna:sohna-hilltop-fort-ruins": "damdama-sohna:sohna-hilltop-fort-ruins-and-viewpoint",
  "damdama-sohna:viewpoint": "damdama-sohna:sohna-hilltop-fort-ruins-and-viewpoint",
  "damdama-sohna:shiva-tourist-complex-and-gardens": "damdama-sohna:shiva-tourist-complex-and-gardens",
  "damdama-sohna:shiva-tourist-complex": "damdama-sohna:shiva-tourist-complex-and-gardens",
  "damdama-sohna:dawat-e-khas-aravalli-highway-dhaba": "damdama-sohna:dawat-e-khas-aravalli-highway-dhaba",
  "damdama-sohna:dawat-aravalli-dhaba": "damdama-sohna:dawat-e-khas-aravalli-highway-dhaba",
  "damdama-sohna:saras-tourist-resort-damdama-promenade": "damdama-sohna:saras-tourist-resort-damdama-promenade",
  "damdama-sohna:saras-lake-promenade": "damdama-sohna:saras-tourist-resort-damdama-promenade",
  "dehradun:robbers-cave-guchhupani-limestone-gorge": "dehradun:robbers-cave-guchhupani-limestone-gorge",
  "dehradun:robbers-cave": "dehradun:robbers-cave-guchhupani-limestone-gorge",
  "dehradun:guchhupani-limestone-gorge": "dehradun:robbers-cave-guchhupani-limestone-gorge",
  "dehradun:forest-research-institute-colonial-colonnades": "dehradun:forest-research-institute-colonial-colonnades",
  "dehradun:forest-research-institute": "dehradun:forest-research-institute-colonial-colonnades",
  "dehradun:colonial-colonnades": "dehradun:forest-research-institute-colonial-colonnades",
  "dehradun:mindrolling-monastery-and-great-stupa": "dehradun:mindrolling-monastery-and-great-stupa",
  "dehradun:mindrolling-monastery": "dehradun:mindrolling-monastery-and-great-stupa",
  "dehradun:great-stupa": "dehradun:mindrolling-monastery-and-great-stupa",
  "dehradun:sahastradhara-thousandfold-sulphur-springs": "dehradun:sahastradhara-thousandfold-sulphur-springs",
  "dehradun:sahastradhara-springs": "dehradun:sahastradhara-thousandfold-sulphur-springs",
  "dehradun:tapkeshwar-mahadev-cave-temple": "dehradun:tapkeshwar-mahadev-cave-temple",
  "dehradun:tapkeshwar-temple": "dehradun:tapkeshwar-mahadev-cave-temple",
  "dehradun:rajpur-road-artisan-bakeries-and-cafes": "dehradun:rajpur-road-artisan-bakeries-and-cafes",
  "dehradun:rajpur-road-cafes": "dehradun:rajpur-road-artisan-bakeries-and-cafes",
  "dehradun:rajpur-road-artisan-bakeries": "dehradun:rajpur-road-artisan-bakeries-and-cafes",
  "dehradun:elloras-melting-moments-since-1953": "dehradun:elloras-melting-moments-since-1953",
  "dehradun:elloras-bakery": "dehradun:elloras-melting-moments-since-1953",
  "dehradun:elloras-melting-moments": "dehradun:elloras-melting-moments-since-1953",
  "dehradun:since-1953": "dehradun:elloras-melting-moments-since-1953",
  "dehradun:malsi-deer-park-dehradun-zoo": "dehradun:malsi-deer-park-dehradun-zoo",
  "dehradun:malsi-deer-park": "dehradun:malsi-deer-park-dehradun-zoo",
  "dehradun:dehradun-zoo": "dehradun:malsi-deer-park-dehradun-zoo",
  "dharamshala:tsuglagkhang-complex-and-dalai-lama-temple": "dharamshala:tsuglagkhang-complex-and-dalai-lama-temple",
  "dharamshala:tsuglagkhang-temple": "dharamshala:tsuglagkhang-complex-and-dalai-lama-temple",
  "dharamshala:dalai-lama-temple": "dharamshala:tsuglagkhang-complex-and-dalai-lama-temple",
  "dharamshala:tsuglagkhang-complex": "dharamshala:namgyal-monastery",
  "dharamshala:bhagsu-waterfall-and-shiva-cafe": "dharamshala:bhagsu-waterfall-and-shiva-cafe",
  "dharamshala:bhagsu-waterfall-shiva-cafe": "dharamshala:bhagsunag-waterfall",
  "dharamshala:bhagsu-waterfall": "dharamshala:bhagsunag-waterfall",
  "dharamshala:shiva-cafe": "dharamshala:bhagsu-waterfall-and-shiva-cafe",
  "dharamshala:norbulingka-institute-of-tibetan-arts": "dharamshala:norbulingka-institute-of-tibetan-arts",
  "dharamshala:norbulingka-institute": "dharamshala:norbulingka-institute",
  "dharamshala:triund-ridge-alpine-trek-trail": "dharamshala:triund-ridge-alpine-trek-trail",
  "dharamshala:triund-trek-base": "dharamshala:triund-trek",
  "dharamshala:illiterati-books-and-coffee": "dharamshala:illiterati-books-and-coffee",
  "dharamshala:illiterati-cafe": "dharamshala:illiterati-books-and-coffee",
  "dharamshala:coffee": "dharamshala:illiterati-books-and-coffee",
  "dharamshala:illiterati-books": "dharamshala:illiterati-books-and-coffee",
  "dharamshala:st-john-in-the-wilderness-church-1852": "dharamshala:st-john-in-the-wilderness-church-1852",
  "dharamshala:st-john-wilderness": "dharamshala:st-john-in-the-wilderness-church-1852",
  "dharamshala:1852": "dharamshala:st-john-in-the-wilderness-church-1852",
  "dharamshala:st-john-in-the-wilderness-church": "dharamshala:st-john-in-the-wilderness-church-1852",
  "dharamshala:tibet-kitchen-traditional-momos-and-thukpa": "dharamshala:tibet-kitchen-traditional-momos-and-thukpa",
  "dharamshala:tibet-kitchen": "dharamshala:tibet-kitchen-traditional-momos-and-thukpa",
  "dharamshala:thukpa": "dharamshala:tibet-kitchen-traditional-momos-and-thukpa",
  "dharamshala:traditional-momos": "dharamshala:tibet-kitchen-traditional-momos-and-thukpa",
  "dharamshala:dharamkot-yoga-and-meditation-village": "dharamshala:dharamkot-yoga-and-meditation-village",
  "dharamshala:dharamkot-village": "dharamshala:dharamkot-yoga-and-meditation-village",
  "dharamshala:dharamkot-yoga": "dharamshala:dharamkot-yoga-and-meditation-village",
  "dharamshala:meditation-village": "dharamshala:dharamkot-yoga-and-meditation-village",
  "goa:chapora-fort-hilltop-viewpoint": "goa:chapora-fort-hilltop-viewpoint",
  "goa:chapora-fort": "goa:chapora-fort-hilltop-viewpoint",
  "goa:fontainhas-heritage-latin-quarter": "goa:fontainhas-heritage-latin-quarter",
  "goa:fontainhas-latin-quarter": "goa:fontainhas-heritage-latin-quarter",
  "goa:divar-island-village-ferry-and-backwaters": "goa:divar-island-village-ferry-and-backwaters",
  "goa:divar-island": "goa:divar-island-village-ferry-and-backwaters",
  "goa:backwaters": "goa:divar-island-village-ferry-and-backwaters",
  "goa:divar-island-village-ferry": "goa:divar-island-village-ferry-and-backwaters",
  "goa:ashwem-beach-casuarina-pines": "goa:ashwem-beach-casuarina-pines",
  "goa:ashwem-beach": "goa:ashwem-beach-casuarina-pines",
  "goa:anjuna-flea-and-night-art-market": "goa:anjuna-flea-and-night-art-market",
  "goa:anjuna-flea-market": "goa:anjuna-flea-and-night-art-market",
  "goa:anjuna-flea": "goa:anjuna-flea-and-night-art-market",
  "goa:night-art-market": "goa:anjuna-flea-and-night-art-market",
  "goa:dudhsagar-waterfall-jungle-trek": "goa:dudhsagar-waterfall-jungle-trek",
  "goa:dudhsagar-falls": "goa:dudhsagar-waterfall-jungle-trek",
  "goa:artjuna-lifestyle-garden-cafe": "goa:artjuna-lifestyle-garden-cafe",
  "goa:artjuna-cafe": "goa:artjuna-lifestyle-garden-cafe",
  "goa:vinayak-family-restaurant-authentic-goan-fish-thali": "goa:vinayak-family-restaurant-authentic-goan-fish-thali",
  "goa:vinayak-family-restaurant": "goa:vinayak-family-restaurant-authentic-goan-fish-thali",
  "goa:authentic-goan-fish-thali": "goa:vinayak-family-restaurant-authentic-goan-fish-thali",
  "jaipur:amber-fort-and-sheesh-mahal": "jaipur:amber-fort",
  "jaipur:amber-fort": "jaipur:amber-fort",
  "jaipur:sheesh-mahal": "jaipur:amber-fort-and-sheesh-mahal",
  "jaipur:hawa-mahal-palace-of-winds": "jaipur:hawa-mahal",
  "jaipur:hawa-mahal": "jaipur:hawa-mahal",
  "jaipur:palace-of-winds": "jaipur:hawa-mahal-palace-of-winds",
  "jaipur:nahargarh-fort-sunset-ridge": "jaipur:nahargarh-fort",
  "jaipur:nahargarh-fort-sunset": "jaipur:nahargarh-fort",
  "jaipur:panna-meena-ka-kund-stepwell": "jaipur:panna-meena-ka-kund-stepwell",
  "jaipur:panna-meena-kund": "jaipur:panna-meena-ka-kund-stepwell",
  "jaipur:jaipur-city-palace-and-chandra-mahal": "jaipur:jaipur-city-palace-and-chandra-mahal",
  "jaipur:city-palace-jaipur": "jaipur:jaipur-city-palace-and-chandra-mahal",
  "jaipur:chandra-mahal": "jaipur:jaipur-city-palace-and-chandra-mahal",
  "jaipur:city-palace": "jaipur:jaipur-city-palace-and-chandra-mahal",
  "jaipur:city-palace-of-jaipur": "jaipur:jaipur-city-palace-and-chandra-mahal",
  "jaipur:city-palace-of-udaipur": "jaipur:jaipur-city-palace-and-chandra-mahal",
  "jaipur:city-palace-udaipur": "jaipur:jaipur-city-palace-and-chandra-mahal",
  "jaipur:jaipur-city-palace": "jaipur:jaipur-city-palace-and-chandra-mahal",
  "jaipur:laxmi-misthan-bhandar-lmb-1727": "jaipur:laxmi-misthan-bhandar-lmb-1727",
  "jaipur:lmb-sweets": "jaipur:laxmi-misthan-bhandar-lmb-1727",
  "jaipur:laxmi-misthan-bhandar": "jaipur:laxmi-misthan-bhandar-lmb-1727",
  "jaipur:lmb-1727": "jaipur:laxmi-misthan-bhandar-lmb-1727",
  "jaipur:anokhi-museum-of-hand-printing": "jaipur:anokhi-museum-of-hand-printing",
  "jaipur:anokhi-museum": "jaipur:anokhi-museum-of-hand-printing",
  "jaipur:tapri-central-rooftop-tea-lounge": "jaipur:tapri-central-rooftop-tea-lounge",
  "jaipur:tapri-central": "jaipur:tapri-central-rooftop-tea-lounge",
  "jaisalmer:jaisalmer-golden-living-fort-sonar-qila": "jaisalmer:jaisalmer-golden-living-fort-sonar-qila",
  "jaisalmer:jaisalmer-fort": "jaisalmer:jaisalmer-golden-living-fort-sonar-qila",
  "jaisalmer:jaisalmer-golden-living-fort": "jaisalmer:jaisalmer-golden-living-fort-sonar-qila",
  "jaisalmer:sonar-qila": "jaisalmer:jaisalmer-golden-living-fort-sonar-qila",
  "jaisalmer:patwon-ki-haveli-filigree-architecture": "jaisalmer:patwon-ki-haveli-filigree-architecture",
  "jaisalmer:patwon-ki-haveli": "jaisalmer:patwon-ki-haveli-filigree-architecture",
  "jaisalmer:sam-sand-dunes-and-thar-desert-safari": "jaisalmer:sam-sand-dunes-and-thar-desert-safari",
  "jaisalmer:sam-sand-dunes": "jaisalmer:sam-sand-dunes-and-thar-desert-safari",
  "jaisalmer:thar-desert-safari": "jaisalmer:sam-sand-dunes-and-thar-desert-safari",
  "jaisalmer:gadisar-lake-ghats-and-chattris": "jaisalmer:gadisar-lake-ghats-and-chattris",
  "jaisalmer:gadisar-lake": "jaisalmer:gadisar-lake-ghats-and-chattris",
  "jaisalmer:chattris": "jaisalmer:gadisar-lake-ghats-and-chattris",
  "jaisalmer:gadisar-lake-ghats": "jaisalmer:gadisar-lake-ghats-and-chattris",
  "jaisalmer:kuldhara-abandoned-ghost-village": "jaisalmer:kuldhara-abandoned-ghost-village",
  "jaisalmer:kuldhara-abandoned-village": "jaisalmer:kuldhara-abandoned-ghost-village",
  "jaisalmer:jaisalmer-fort-seven-jain-temples": "jaisalmer:jaisalmer-fort-seven-jain-temples",
  "jaisalmer:jain-temples-fort": "jaisalmer:jaisalmer-fort-seven-jain-temples",
  "jaisalmer:jain-temples": "jaisalmer:jaisalmer-fort-seven-jain-temples",
  "jaisalmer:seven-jain-temples": "jaisalmer:jaisalmer-fort-seven-jain-temples",
  "jaisalmer:the-trio-rooftop-authentic-laal-maas": "jaisalmer:the-trio-rooftop-authentic-laal-maas",
  "jaisalmer:the-trio-restaurant": "jaisalmer:the-trio-rooftop-authentic-laal-maas",
  "jaisalmer:authentic-laal-maas": "jaisalmer:the-trio-rooftop-authentic-laal-maas",
  "jaisalmer:the-trio-rooftop": "jaisalmer:the-trio-rooftop-authentic-laal-maas",
  "jaisalmer:salim-singh-ki-haveli-moti-mahal": "jaisalmer:salim-singh-ki-haveli-moti-mahal",
  "jaisalmer:salim-singh-ki-haveli": "jaisalmer:salim-singh-ki-haveli-moti-mahal",
  "jaisalmer:moti-mahal": "jaisalmer:salim-singh-ki-haveli-moti-mahal",
  "kainchi-dham:neem-karoli-baba-sacred-ashram-and-temple": "kainchi-dham:neem-karoli-baba-sacred-ashram-and-temple",
  "kainchi-dham:neem-karoli-baba-ashram": "kainchi-dham:neem-karoli-baba-sacred-ashram-and-temple",
  "kainchi-dham:neem-karoli-baba-sacred-ashram": "kainchi-dham:neem-karoli-baba-sacred-ashram-and-temple",
  "kainchi-dham:bhowali-fruit-market-and-tea-terraces": "kainchi-dham:bhowali-fruit-market-and-tea-terraces",
  "kainchi-dham:bhowali-fruit-orchards": "kainchi-dham:bhowali-fruit-market-and-tea-terraces",
  "kainchi-dham:bhowali-fruit-market": "kainchi-dham:bhowali-fruit-market-and-tea-terraces",
  "kainchi-dham:tea-terraces": "kainchi-dham:bhowali-fruit-market-and-tea-terraces",
  "kainchi-dham:golu-devta-temple-ghorakhal-temple-of-bells": "kainchi-dham:golu-devta-temple-ghorakhal-temple-of-bells",
  "kainchi-dham:golu-devta-ghorakhal": "kainchi-dham:golu-devta-temple-ghorakhal-temple-of-bells",
  "kainchi-dham:golu-devta-temple-ghorakhal": "kainchi-dham:golu-devta-temple-ghorakhal-temple-of-bells",
  "kainchi-dham:temple-of-bells": "kainchi-dham:golu-devta-temple-ghorakhal-temple-of-bells",
  "kainchi-dham:bhimtal-lake-and-central-aquarium-island": "kainchi-dham:bhimtal-lake-and-central-aquarium-island",
  "kainchi-dham:bhimtal-island-lake": "kainchi-dham:bhimtal-lake-and-central-aquarium-island",
  "kainchi-dham:bhimtal-lake": "kainchi-dham:bhimtal-lake-and-central-aquarium-island",
  "kainchi-dham:central-aquarium-island": "kainchi-dham:bhimtal-lake-and-central-aquarium-island",
  "kainchi-dham:sattal-seven-interconnected-freshwater-lakes": "kainchi-dham:sattal-seven-interconnected-freshwater-lakes",
  "kainchi-dham:sattal-interconnected-lakes": "kainchi-dham:sattal-seven-interconnected-freshwater-lakes",
  "kainchi-dham:subhash-dhaba-traditional-kumaoni-ras-bhaat": "kainchi-dham:subhash-dhaba-traditional-kumaoni-ras-bhaat",
  "kainchi-dham:subhash-dhaba-bhowali": "kainchi-dham:subhash-dhaba-traditional-kumaoni-ras-bhaat",
  "kainchi-dham:subhash-dhaba": "kainchi-dham:subhash-dhaba-traditional-kumaoni-ras-bhaat",
  "kainchi-dham:traditional-kumaoni-ras-bhaat": "kainchi-dham:subhash-dhaba-traditional-kumaoni-ras-bhaat",
  "kainchi-dham:naukuchiatal-nine-cornered-lake": "kainchi-dham:naukuchiatal-nine-cornered-lake",
  "kainchi-dham:naukuchiatal-lake": "kainchi-dham:naukuchiatal-nine-cornered-lake",
  "kainchi-dham:naukuchiatal": "kainchi-dham:naukuchiatal-nine-cornered-lake",
  "kainchi-dham:nine-cornered-lake": "kainchi-dham:naukuchiatal-nine-cornered-lake",
  "kainchi-dham:shyamkhet-organic-tea-garden-walk": "kainchi-dham:shyamkhet-organic-tea-garden-walk",
  "kainchi-dham:shyamkhet-tea-estate": "kainchi-dham:shyamkhet-organic-tea-garden-walk",
  "kasol:chalal-riverside-pine-trail": "kasol:chalal-riverside-pine-trail",
  "kasol:chalal-pine-trail": "kasol:chalal-riverside-pine-trail",
  "kasol:manikaran-sahib-gurudwara-and-hot-springs": "kasol:manikaran-sahib-gurudwara-and-hot-springs",
  "kasol:manikaran-sahib-gurudwara": "kasol:manikaran-sahib-gurudwara-and-hot-springs",
  "kasol:hot-springs": "kasol:manikaran-sahib-gurudwara-and-hot-springs",
  "kasol:tosh-village-apple-orchard-ridge": "kasol:tosh-village-apple-orchard-ridge",
  "kasol:tosh-village": "kasol:tosh-village-apple-orchard-ridge",
  "kasol:moon-dance-cafe-and-german-bakery": "kasol:moon-dance-cafe-and-german-bakery",
  "kasol:moon-dance-cafe": "kasol:moon-dance-cafe-and-german-bakery",
  "kasol:devraj-coffee": "kasol:moon-dance-cafe-and-german-bakery",
  "kasol:devraj-coffee-and-german-bakery": "kasol:moon-dance-cafe-and-german-bakery",
  "kasol:devraj-coffee-german-bakery": "kasol:moon-dance-cafe-and-german-bakery",
  "kasol:german-bakery": "kasol:moon-dance-cafe-and-german-bakery",
  "kasol:german-bakery-tapovan": "kasol:moon-dance-cafe-and-german-bakery",
  "kasol:grahan-village-heritage-trek": "kasol:grahan-village-heritage-trek",
  "kasol:grahan-village-trek": "kasol:grahan-village-heritage-trek",
  "kasol:evergreen-cafe-and-garden-lounge": "kasol:evergreen-cafe-and-garden-lounge",
  "kasol:evergreen-cafe": "kasol:evergreen-cafe-and-garden-lounge",
  "kasol:garden-lounge": "kasol:evergreen-cafe-and-garden-lounge",
  "kasol:kasol-nature-park-pine-walk": "kasol:kasol-nature-park-pine-walk",
  "kasol:nature-park-kasol": "kasol:kasol-nature-park-pine-walk",
  "kasol:nature-park": "kasol:kasol-nature-park-pine-walk",
  "kasol:malana-village-ancient-approach-trail": "kasol:malana-village-ancient-approach-trail",
  "kasol:malana-village-gate": "kasol:malana-village-ancient-approach-trail",
  "lansdowne:tip-in-top-tiffin-top-snow-crest-ridge": "lansdowne:tip-in-top-tiffin-top-snow-crest-ridge",
  "lansdowne:tip-in-top-viewpoint": "lansdowne:tip-in-top-tiffin-top-snow-crest-ridge",
  "lansdowne:snow-crest-ridge": "lansdowne:tip-in-top-tiffin-top-snow-crest-ridge",
  "lansdowne:tiffin-top": "lansdowne:tip-in-top-tiffin-top-snow-crest-ridge",
  "lansdowne:tip-in-top": "lansdowne:tip-in-top-tiffin-top-snow-crest-ridge",
  "lansdowne:bhulla-tal-lake-and-pine-promenade": "lansdowne:bhulla-tal-lake-and-pine-promenade",
  "lansdowne:bhulla-tal-lake": "lansdowne:bhulla-tal-lake-and-pine-promenade",
  "lansdowne:pine-promenade": "lansdowne:bhulla-tal-lake-and-pine-promenade",
  "lansdowne:st-johns-catholic-church-1936": "lansdowne:st-johns-catholic-church-1936",
  "lansdowne:st-johns-church-1936": "lansdowne:st-johns-catholic-church-1936",
  "lansdowne:1936": "lansdowne:st-johns-catholic-church-1936",
  "lansdowne:st-johns-catholic-church": "lansdowne:st-johns-catholic-church-1936",
  "lansdowne:darwan-singh-regimental-museum": "lansdowne:darwan-singh-regimental-museum",
  "lansdowne:garhwal-rifles-museum": "lansdowne:darwan-singh-regimental-museum",
  "lansdowne:bhim-pakora-balancing-stone-wonder": "lansdowne:bhim-pakora-balancing-stone-wonder",
  "lansdowne:bhim-pakora-stones": "lansdowne:bhim-pakora-balancing-stone-wonder",
  "lansdowne:hawaghar-pine-forest-ridge-promenade": "lansdowne:hawaghar-pine-forest-ridge-promenade",
  "lansdowne:hawaghar-pine-walk": "lansdowne:hawaghar-pine-forest-ridge-promenade",
  "lansdowne:lansdowne-hills-colonial-cafe-and-bakery": "lansdowne:lansdowne-hills-colonial-cafe-and-bakery",
  "lansdowne:lansdowne-tripund-cafe": "lansdowne:lansdowne-hills-colonial-cafe-and-bakery",
  "lansdowne:bakery": "lansdowne:lansdowne-hills-colonial-cafe-and-bakery",
  "lansdowne:lansdowne-hills-colonial-cafe": "lansdowne:lansdowne-hills-colonial-cafe-and-bakery",
  "lansdowne:tripund-cafe": "lansdowne:lansdowne-hills-colonial-cafe-and-bakery",
  "lansdowne:kalagarh-tiger-reserve-northern-gate": "lansdowne:kalagarh-tiger-reserve-northern-gate",
  "lansdowne:kalagarh-tiger-gateway": "lansdowne:kalagarh-tiger-reserve-northern-gate",
  "leh:leh-palace-17th-century-fortress": "leh:leh-palace",
  "leh:leh-palace": "leh:leh-palace",
  "leh:shanti-stupa-white-peace-pagoda": "leh:shanti-stupa-white-peace-pagoda",
  "leh:shanti-stupa": "leh:shanti-stupa-white-peace-pagoda",
  "leh:thiksey-gompa-and-15m-maitreya-buddha": "leh:thiksey-gompa-and-15m-maitreya-buddha",
  "leh:thiksey-monastery": "leh:thiksey-monastery-gompa",
  "leh:15m-maitreya-buddha": "leh:thiksey-gompa-and-15m-maitreya-buddha",
  "leh:thiksey-gompa": "leh:thiksey-monastery-gompa",
  "leh:pangong-tso-high-altitude-salt-lake": "leh:pangong-tso",
  "leh:pangong-tso": "leh:pangong-tso",
  "leh:confluence-of-indus-and-zanskar-rivers-sangam": "leh:confluence-of-indus-and-zanskar-rivers-sangam",
  "leh:sangam-confluence": "leh:confluence-of-indus-and-zanskar-rivers-sangam",
  "leh:confluence-of-indus": "leh:confluence-of-indus-and-zanskar-rivers-sangam",
  "leh:sangam": "leh:confluence-of-indus-and-zanskar-rivers-sangam",
  "leh:zanskar-rivers": "leh:confluence-of-indus-and-zanskar-rivers-sangam",
  "leh:lalas-art-cafe-restored-heritage-labrang": "leh:lalas-art-cafe-restored-heritage-labrang",
  "leh:lalas-art-cafe": "leh:lalas-art-cafe-restored-heritage-labrang",
  "leh:restored-heritage-labrang": "leh:lalas-art-cafe-restored-heritage-labrang",
  "leh:gesmo-restaurant-and-german-bakery-since-1989": "leh:gesmo-restaurant-and-german-bakery-since-1989",
  "leh:gesmo-restaurant": "leh:gesmo-restaurant-and-german-bakery-since-1989",
  "leh:devraj-coffee": "leh:gesmo-restaurant-and-german-bakery-since-1989",
  "leh:devraj-coffee-and-german-bakery": "leh:gesmo-restaurant-and-german-bakery-since-1989",
  "leh:devraj-coffee-german-bakery": "leh:gesmo-restaurant-and-german-bakery-since-1989",
  "leh:german-bakery": "leh:gesmo-restaurant-and-german-bakery-since-1989",
  "leh:german-bakery-tapovan": "leh:gesmo-restaurant-and-german-bakery-since-1989",
  "leh:since-1989": "leh:gesmo-restaurant-and-german-bakery-since-1989",
  "leh:hall-of-fame-military-and-cultural-museum": "leh:hall-of-fame-military-and-cultural-museum",
  "leh:hall-of-fame-leh": "leh:hall-of-fame-military-and-cultural-museum",
  "leh:cultural-museum": "leh:hall-of-fame-military-and-cultural-museum",
  "leh:hall-of-fame": "leh:hall-of-fame-military-and-cultural-museum",
  "leh:hall-of-fame-military": "leh:hall-of-fame-military-and-cultural-museum",
  "manali:hadimba-devi-cedar-forest-temple": "manali:hadimba-devi-cedar-forest-temple",
  "manali:hadimba-temple": "manali:hadimba-devi-cedar-forest-temple",
  "manali:hadimba-devi-temple": "manali:hadimba-devi-cedar-forest-temple",
  "manali:cafe-1947-riverside-stone-cafe": "manali:cafe-1947-riverside-stone-cafe",
  "manali:cafe-1947": "manali:cafe-1947-riverside-stone-cafe",
  "manali:cafe-1947-riverside": "manali:cafe-1947-riverside-stone-cafe",
  "manali:cafe-1947-riverside-stone-café": "manali:cafe-1947-riverside-stone-cafe",
  "manali:café-1947": "manali:cafe-1947-riverside-stone-cafe",
  "manali:riverside-stone-cafe": "manali:cafe-1947-riverside-stone-cafe",
  "manali:jogini-waterfall-pine-trail": "manali:jogini-waterfall-pine-trail",
  "manali:jogini-waterfall": "manali:jogini-waterfall-pine-trail",
  "manali:jogini-falls": "manali:jogini-waterfall-pine-trail",
  "manali:old-manali-village-and-manu-temple": "manali:old-manali-village-and-manu-temple",
  "manali:old-manali-village": "manali:old-manali-village-and-manu-temple",
  "manali:manu-temple": "manali:old-manali-village-and-manu-temple",
  "manali:old-village": "manali:old-manali-village-and-manu-temple",
  "manali:drifters-cafe-and-acoustic-inn": "manali:drifters-cafe-and-acoustic-inn",
  "manali:drifters-cafe": "manali:drifters-cafe-and-acoustic-inn",
  "manali:acoustic-inn": "manali:drifters-cafe-and-acoustic-inn",
  "manali:drifters-inn": "manali:drifters-cafe-and-acoustic-inn",
  "manali:drifters-inn-and-wooden-loft": "manali:drifters-cafe-and-acoustic-inn",
  "manali:drifters-inn-wooden-loft": "manali:drifters-cafe-and-acoustic-inn",
  "manali:solang-valley-alpine-adventure-grounds": "manali:solang-valley-alpine-adventure-grounds",
  "manali:solang-valley": "manali:solang-valley-alpine-adventure-grounds",
  "manali:vashisht-hot-sulphur-springs-and-ancient-temple": "manali:vashisht-hot-sulphur-springs-and-ancient-temple",
  "manali:vashisht-springs": "manali:vashisht-hot-sulphur-springs-and-ancient-temple",
  "manali:ancient-temple": "manali:vashisht-hot-sulphur-springs-and-ancient-temple",
  "manali:vashisht-hot-springs": "manali:vashisht-hot-sulphur-springs-and-ancient-temple",
  "manali:vashisht-hot-sulphur-springs": "manali:vashisht-hot-sulphur-springs-and-ancient-temple",
  "manali:the-johnsons-cafe-and-trout-bar": "manali:the-johnsons-cafe-and-trout-bar",
  "manali:johnsons-cafe": "manali:the-johnsons-cafe-and-trout-bar",
  "manali:johnsons-cafe-trout-bar": "manali:the-johnsons-cafe-and-trout-bar",
  "manali:the-johnsons-cafe": "manali:the-johnsons-cafe-and-trout-bar",
  "manali:trout-bar": "manali:the-johnsons-cafe-and-trout-bar",
  "mathura-vrindavan:bankey-bihari-temple-vrindavan": "mathura-vrindavan:bankey-bihari-temple-vrindavan",
  "mathura-vrindavan:bankey-bihari-temple": "mathura-vrindavan:bankey-bihari-temple-vrindavan",
  "mathura-vrindavan:shri-krishna-janmabhoomi-temple-complex": "mathura-vrindavan:shri-krishna-janmabhoomi-temple-complex",
  "mathura-vrindavan:shri-krishna-janmabhoomi": "mathura-vrindavan:shri-krishna-janmabhoomi-temple-complex",
  "mathura-vrindavan:prem-mandir-italian-carrara-marble-temple": "mathura-vrindavan:prem-mandir-italian-carrara-marble-temple",
  "mathura-vrindavan:prem-mandir-vrindavan": "mathura-vrindavan:prem-mandir-italian-carrara-marble-temple",
  "mathura-vrindavan:iskcon-sri-krishna-balaram-temple": "mathura-vrindavan:iskcon-sri-krishna-balaram-temple",
  "mathura-vrindavan:iskcon-vrindavan": "mathura-vrindavan:iskcon-sri-krishna-balaram-temple",
  "mathura-vrindavan:vishram-ghat-evening-yamuna-maha-aarti": "mathura-vrindavan:vishram-ghat-evening-yamuna-maha-aarti",
  "mathura-vrindavan:vishram-ghat-aarti": "mathura-vrindavan:vishram-ghat-evening-yamuna-maha-aarti",
  "mathura-vrindavan:nidhivan-sacred-basil-forest-grove": "mathura-vrindavan:nidhivan-sacred-basil-forest-grove",
  "mathura-vrindavan:nidhivan-grove": "mathura-vrindavan:nidhivan-sacred-basil-forest-grove",
  "mathura-vrindavan:brijwasi-mithai-wala-original-mathura-peda": "mathura-vrindavan:brijwasi-mithai-wala-original-mathura-peda",
  "mathura-vrindavan:brijwasi-mithai-wala": "mathura-vrindavan:brijwasi-mithai-wala-original-mathura-peda",
  "mathura-vrindavan:original-mathura-peda": "mathura-vrindavan:brijwasi-mithai-wala-original-mathura-peda",
  "mathura-vrindavan:radha-raman-ancient-self-manifested-deity": "mathura-vrindavan:radha-raman-ancient-self-manifested-deity",
  "mathura-vrindavan:radha-raman-temple": "mathura-vrindavan:radha-raman-ancient-self-manifested-deity",
  "morni-hills:tikkar-taal-twin-lakes-and-boating": "morni-hills:tikkar-taal-twin-lakes-and-boating",
  "morni-hills:tikkar-taal-lakes": "morni-hills:tikkar-taal-twin-lakes-and-boating",
  "morni-hills:boating": "morni-hills:tikkar-taal-twin-lakes-and-boating",
  "morni-hills:tikkar-taal-twin-lakes": "morni-hills:tikkar-taal-twin-lakes-and-boating",
  "morni-hills:morni-fort-17th-century-ramparts": "morni-hills:morni-fort-17th-century-ramparts",
  "morni-hills:morni-fort-heritage": "morni-hills:morni-fort-17th-century-ramparts",
  "morni-hills:morni-shivalik-herbal-forest-and-bird-trail": "morni-hills:morni-shivalik-herbal-forest-and-bird-trail",
  "morni-hills:herbal-nature-trail": "morni-hills:morni-shivalik-herbal-forest-and-bird-trail",
  "morni-hills:bird-trail": "morni-hills:morni-shivalik-herbal-forest-and-bird-trail",
  "morni-hills:morni-shivalik-herbal-forest": "morni-hills:morni-shivalik-herbal-forest-and-bird-trail",
  "morni-hills:adventure-park-tikkar-taal-zip-and-obstacle-course": "morni-hills:adventure-park-tikkar-taal-zip-and-obstacle-course",
  "morni-hills:adventure-park-tikkar": "morni-hills:adventure-park-tikkar-taal-zip-and-obstacle-course",
  "morni-hills:adventure-park-tikkar-taal": "morni-hills:adventure-park-tikkar-taal-zip-and-obstacle-course",
  "morni-hills:obstacle-course": "morni-hills:adventure-park-tikkar-taal-zip-and-obstacle-course",
  "morni-hills:zip": "morni-hills:adventure-park-tikkar-taal-zip-and-obstacle-course",
  "morni-hills:gurudwara-nada-sahib-en-route": "morni-hills:gurudwara-nada-sahib-en-route",
  "morni-hills:gurudwara-nada-sahib": "morni-hills:gurudwara-nada-sahib-en-route",
  "morni-hills:pheasant-breeding-centre-berwala": "morni-hills:pheasant-breeding-centre-berwala",
  "morni-hills:berwala-pheasant-breeding": "morni-hills:pheasant-breeding-centre-berwala",
  "morni-hills:mountain-quail-terrace-dhaba": "morni-hills:mountain-quail-terrace-dhaba",
  "morni-hills:mountain-quail-resort-dhaba": "morni-hills:mountain-quail-terrace-dhaba",
  "morni-hills:shivalik-viewpoint-crest-and-sunset-ridge": "morni-hills:shivalik-viewpoint-crest-and-sunset-ridge",
  "morni-hills:shivalik-viewpoint-crest": "morni-hills:shivalik-viewpoint-crest-and-sunset-ridge",
  "morni-hills:sunset-ridge": "morni-hills:shivalik-viewpoint-crest-and-sunset-ridge",
  "munnar:eravikulam-national-park-rajamalai": "munnar:eravikulam-national-park-rajamalai",
  "munnar:eravikulam-national-park": "munnar:eravikulam-national-park-rajamalai",
  "munnar:rajamalai": "munnar:eravikulam-national-park-rajamalai",
  "munnar:mattupetty-dam-and-speedboating-basin": "munnar:mattupetty-dam-and-speedboating-basin",
  "munnar:mattupetty-dam-lake": "munnar:mattupetty-dam-and-speedboating-basin",
  "munnar:mattupetty-dam": "munnar:mattupetty-dam-and-speedboating-basin",
  "munnar:speedboating-basin": "munnar:mattupetty-dam-and-speedboating-basin",
  "munnar:kdhp-tea-museum-and-factory-processing": "munnar:kdhp-tea-museum-and-factory-processing",
  "munnar:tata-tea-museum": "munnar:kdhp-tea-museum-and-factory-processing",
  "munnar:factory-processing": "munnar:kdhp-tea-museum-and-factory-processing",
  "munnar:kdhp-tea-museum": "munnar:kdhp-tea-museum-and-factory-processing",
  "munnar:top-station-western-ghats-cloud-viewpoint": "munnar:top-station-western-ghats-cloud-viewpoint",
  "munnar:top-station-viewpoint": "munnar:top-station-western-ghats-cloud-viewpoint",
  "munnar:attukad-waterfalls-jungle-trail": "munnar:attukad-waterfalls-jungle-trail",
  "munnar:attukad-waterfalls": "munnar:attukad-waterfalls-jungle-trail",
  "munnar:pothamedu-viewpoint-sunset-over-tea-valleys": "munnar:pothamedu-viewpoint-sunset-over-tea-valleys",
  "munnar:pothamedu-viewpoint": "munnar:pothamedu-viewpoint-sunset-over-tea-valleys",
  "munnar:sunset-over-tea-valleys": "munnar:pothamedu-viewpoint-sunset-over-tea-valleys",
  "munnar:rapsy-restaurant-kerala-parotta-and-beef-fry": "munnar:rapsy-restaurant-kerala-parotta-and-beef-fry",
  "munnar:rapsy-restaurant": "munnar:rapsy-restaurant-kerala-parotta-and-beef-fry",
  "munnar:beef-fry": "munnar:rapsy-restaurant-kerala-parotta-and-beef-fry",
  "munnar:kerala-parotta": "munnar:rapsy-restaurant-kerala-parotta-and-beef-fry",
  "munnar:kundala-lake-and-shikara-boating": "munnar:kundala-lake-and-shikara-boating",
  "munnar:kundala-lake-dam": "munnar:kundala-lake-and-shikara-boating",
  "munnar:kundala-lake": "munnar:kundala-lake-and-shikara-boating",
  "munnar:shikara-boating": "munnar:kundala-lake-and-shikara-boating",
  "murthal:amrik-sukhdev-legendary-24-7-paratha-dhaba": "murthal:amrik-sukhdev-legendary-24-7-paratha-dhaba",
  "murthal:amrik-sukhdev-dhaba": "murthal:amrik-sukhdev-legendary-24-7-paratha-dhaba",
  "murthal:7-paratha-dhaba": "murthal:amrik-sukhdev-legendary-24-7-paratha-dhaba",
  "murthal:amrik-sukhdev": "murthal:amrik-sukhdev-legendary-24-7-paratha-dhaba",
  "murthal:legendary-24": "murthal:amrik-sukhdev-legendary-24-7-paratha-dhaba",
  "murthal:haveli-murthal-punjabi-cultural-theme-village": "murthal:haveli-murthal-punjabi-cultural-theme-village",
  "murthal:haveli-murthal-punjabi": "murthal:haveli-murthal-punjabi-cultural-theme-village",
  "murthal:haveli-murthal": "murthal:haveli-murthal-punjabi-cultural-theme-village",
  "murthal:haveli-punjabi": "murthal:haveli-murthal-punjabi-cultural-theme-village",
  "murthal:punjabi-cultural-theme-village": "murthal:haveli-murthal-punjabi-cultural-theme-village",
  "murthal:gulshan-dhaba-traditional-tandoori-kitchen": "murthal:gulshan-dhaba-traditional-tandoori-kitchen",
  "murthal:gulshan-dhaba-traditional": "murthal:gulshan-dhaba-traditional-tandoori-kitchen",
  "murthal:pahalwan-dhaba-pure-desi-ghee-roasters": "murthal:pahalwan-dhaba-pure-desi-ghee-roasters",
  "murthal:pahalwan-dhaba-murthal": "murthal:pahalwan-dhaba-pure-desi-ghee-roasters",
  "murthal:pahalwan-dhaba": "murthal:pahalwan-dhaba-pure-desi-ghee-roasters",
  "murthal:mojoland-multi-theme-adventure-park": "murthal:mojoland-multi-theme-adventure-park",
  "murthal:mojoland-adventure-park": "murthal:mojoland-multi-theme-adventure-park",
  "murthal:mannat-haveli-grand-highway-palace": "murthal:mannat-haveli-grand-highway-palace",
  "murthal:mannat-haveli-murthal": "murthal:mannat-haveli-grand-highway-palace",
  "murthal:mannat-haveli": "murthal:mannat-haveli-grand-highway-palace",
  "murthal:tomb-of-khwaja-khizr-1522-pathan-architecture": "murthal:tomb-of-khwaja-khizr-1522-pathan-architecture",
  "murthal:khwaja-khizr-tomb": "murthal:tomb-of-khwaja-khizr-1522-pathan-architecture",
  "murthal:1522-pathan-architecture": "murthal:tomb-of-khwaja-khizr-1522-pathan-architecture",
  "murthal:tomb-of-khwaja-khizr": "murthal:tomb-of-khwaja-khizr-1522-pathan-architecture",
  "murthal:dhingra-sweets-and-pure-milk-kadhai": "murthal:dhingra-sweets-and-pure-milk-kadhai",
  "murthal:dhingra-sweets-milk-bar": "murthal:dhingra-sweets-and-pure-milk-kadhai",
  "murthal:dhingra-sweets": "murthal:dhingra-sweets-and-pure-milk-kadhai",
  "murthal:pure-milk-kadhai": "murthal:dhingra-sweets-and-pure-milk-kadhai",
  "mussoorie:landour-bakehouse-and-sisters-bazaar": "mussoorie:landour-bakehouse",
  "mussoorie:landour-bakehouse": "mussoorie:landour-bakehouse",
  "mussoorie:sisters-bazaar": "mussoorie:landour-bakehouse-and-sisters-bazaar",
  "mussoorie:lal-tibba-scenic-viewpoint": "mussoorie:lal-tibba",
  "mussoorie:lal-tibba": "mussoorie:lal-tibba",
  "mussoorie:char-dukan-and-st-pauls-church": "mussoorie:char-dukan-and-st-pauls-church",
  "mussoorie:char-dukan-prakash-store": "mussoorie:char-dukan-and-st-pauls-church",
  "mussoorie:char-dukan": "mussoorie:char-dukan-and-st-pauls-church",
  "mussoorie:st-pauls-church": "mussoorie:st-pauls-church",
  "mussoorie:sir-george-everest-peak-and-heritage-house": "mussoorie:sir-george-everest-peak-and-heritage-house",
  "mussoorie:george-everest-peak": "mussoorie:george-everest",
  "mussoorie:heritage-house": "mussoorie:sir-george-everest-peak-and-heritage-house",
  "mussoorie:sir-george-everest-peak": "mussoorie:sir-george-everest-peak-and-heritage-house",
  "mussoorie:camels-back-road-deodar-promenade": "mussoorie:camels-back-road-deodar-promenade",
  "mussoorie:camels-back-road": "mussoorie:camels-back-road",
  "mussoorie:clouds-end-heritage-forest-sanctuary": "mussoorie:clouds-end-heritage-forest-sanctuary",
  "mussoorie:clouds-end-forest": "mussoorie:clouds-end",
  "mussoorie:gun-hill-historical-viewpoint-and-cable-car": "mussoorie:gun-hill-historical-viewpoint-and-cable-car",
  "mussoorie:gun-hill-ropeway": "mussoorie:gun-hill",
  "mussoorie:cable-car": "mussoorie:gun-hill-historical-viewpoint-and-cable-car",
  "mussoorie:gun-hill-historical-viewpoint": "mussoorie:gun-hill-historical-viewpoint-and-cable-car",
  "mussoorie:kempty-falls-mountain-cascades": "mussoorie:kempty-falls-mountain-cascades",
  "mussoorie:kempty-falls-cascades": "mussoorie:kempty-falls",
  "neemrana:neemrana-fort-palace-15th-century-ramparts": "neemrana:neemrana-fort-palace-15th-century-ramparts",
  "neemrana:neemrana-fort-palace": "neemrana:neemrana-fort-palace-15th-century-ramparts",
  "neemrana:fort-palace": "neemrana:neemrana-fort-palace-15th-century-ramparts",
  "neemrana:flying-fox-aerial-zipline-tour": "neemrana:flying-fox-aerial-zipline-tour",
  "neemrana:flying-fox-zipline": "neemrana:flying-fox-aerial-zipline-tour",
  "neemrana:ancient-9-story-stepwell-neemrana-baori": "neemrana:ancient-9-story-stepwell-neemrana-baori",
  "neemrana:neemrana-stepwell-baori": "neemrana:ancient-9-story-stepwell-neemrana-baori",
  "neemrana:ancient-9-story-stepwell": "neemrana:ancient-9-story-stepwell-neemrana-baori",
  "neemrana:neemrana-baori": "neemrana:ancient-9-story-stepwell-neemrana-baori",
  "neemrana:stepwell-baori": "neemrana:ancient-9-story-stepwell-neemrana-baori",
  "neemrana:kesroli-14th-century-hill-fort-en-route": "neemrana:kesroli-14th-century-hill-fort-en-route",
  "neemrana:kesroli-hill-fort": "neemrana:kesroli-14th-century-hill-fort-en-route",
  "neemrana:neemrana-japanese-industrial-zone-and-ramen-hub": "neemrana:neemrana-japanese-industrial-zone-and-ramen-hub",
  "neemrana:japanese-zone-cuisine": "neemrana:neemrana-japanese-industrial-zone-and-ramen-hub",
  "neemrana:neemrana-japanese-industrial-zone": "neemrana:neemrana-japanese-industrial-zone-and-ramen-hub",
  "neemrana:ramen-hub": "neemrana:neemrana-japanese-industrial-zone-and-ramen-hub",
  "neemrana:highway-king-nh-48-express-dhaba": "neemrana:highway-king-nh-48-express-dhaba",
  "neemrana:highway-king-dhaba": "neemrana:highway-king-nh-48-express-dhaba",
  "neemrana:baba-khetanath-hilltop-ashram-and-ridge": "neemrana:baba-khetanath-hilltop-ashram-and-ridge",
  "neemrana:baba-khetanath-ashram": "neemrana:baba-khetanath-hilltop-ashram-and-ridge",
  "neemrana:baba-khetanath-hilltop-ashram": "neemrana:baba-khetanath-hilltop-ashram-and-ridge",
  "neemrana:siliserh-lake-gateway-en-route": "neemrana:siliserh-lake-gateway-en-route",
  "neemrana:siliserh-en-route-neemrana": "neemrana:siliserh-lake-gateway-en-route",
  "neemrana:siliserh-en-route": "neemrana:siliserh-lake-gateway-en-route",
  "rishikesh:parmarth-niketan-ganga-aarti": "rishikesh:parmarth-niketan-ganga-aarti",
  "rishikesh:parmarth-niketan-aarti": "rishikesh:parmarth-niketan-ganga-aarti",
  "rishikesh:parmarth-aarti": "rishikesh:parmarth-niketan-ganga-aarti",
  "rishikesh:parmarth-niketan": "rishikesh:parmarth-niketan-ganga-aarti",
  "rishikesh:beatles-ashram-chaurasi-kutia": "rishikesh:beatles-ashram-chaurasi-kutia",
  "rishikesh:beatles-ashram": "rishikesh:beatles-ashram-chaurasi-kutia",
  "rishikesh:chaurasi-kutia": "rishikesh:beatles-ashram-chaurasi-kutia",
  "rishikesh:the-beatles-ashram": "rishikesh:beatles-ashram-chaurasi-kutia",
  "rishikesh:neer-garh-cascading-waterfall": "rishikesh:neer-garh-cascading-waterfall",
  "rishikesh:neer-garh-waterfall": "rishikesh:neer-garh-cascading-waterfall",
  "rishikesh:neer-garh": "rishikesh:neer-garh-cascading-waterfall",
  "rishikesh:neer-waterfall": "rishikesh:neer-garh-cascading-waterfall",
  "rishikesh:shivpuri-white-water-river-rafting": "rishikesh:shivpuri-rafting",
  "rishikesh:shivpuri-river-rafting": "rishikesh:shivpuri-rafting",
  "rishikesh:shivpuri-rafting": "rishikesh:shivpuri-rafting",
  "rishikesh:triveni-ghat-evening-maha-aarti": "rishikesh:triveni-ghat-evening-maha-aarti",
  "rishikesh:triveni-ghat-aarti": "rishikesh:triveni-ghat-evening-maha-aarti",
  "rishikesh:triveni-ghat": "rishikesh:triveni-ghat-evening-maha-aarti",
  "rishikesh:vashistha-cave-gufa": "rishikesh:vashistha-cave-gufa",
  "rishikesh:vashistha-cave": "rishikesh:vashistha-cave-gufa",
  "rishikesh:gufa": "rishikesh:vashistha-cave-gufa",
  "rishikesh:vashistha-gufa": "rishikesh:vashistha-cave-gufa",
  "rishikesh:devraj-coffee-and-german-bakery": "rishikesh:devraj-coffee-and-german-bakery",
  "rishikesh:german-bakery-tapovan": "rishikesh:devraj-coffee-and-german-bakery",
  "rishikesh:devraj-coffee": "rishikesh:devraj-coffee-and-german-bakery",
  "rishikesh:devraj-coffee-german-bakery": "rishikesh:devraj-coffee-and-german-bakery",
  "rishikesh:german-bakery": "rishikesh:devraj-coffee-and-german-bakery",
  "rishikesh:ram-jhula-suspension-bridge-promenade": "rishikesh:ram-jhula-suspension-bridge-promenade",
  "rishikesh:ram-jhula-promenade": "rishikesh:ram-jhula-suspension-bridge-promenade",
  "rishikesh:ram-jhula": "rishikesh:ram-jhula-suspension-bridge-promenade",
  "sariska-bhangarh:sariska-tiger-reserve-jungle-safari": "sariska-bhangarh:sariska-tiger-reserve-jungle-safari",
  "sariska-bhangarh:sariska-tiger-reserve": "sariska-bhangarh:sariska-tiger-reserve-jungle-safari",
  "sariska-bhangarh:bhangarh-fort-legendary-medieval-ruins": "sariska-bhangarh:bhangarh-fort-legendary-medieval-ruins",
  "sariska-bhangarh:bhangarh-fort-ruins": "sariska-bhangarh:bhangarh-fort-legendary-medieval-ruins",
  "sariska-bhangarh:bhangarh-fort": "sariska-bhangarh:bhangarh-fort-legendary-medieval-ruins",
  "sariska-bhangarh:legendary-medieval-ruins": "sariska-bhangarh:bhangarh-fort-legendary-medieval-ruins",
  "sariska-bhangarh:kankwari-fort-hilltop-fortress": "sariska-bhangarh:kankwari-fort-hilltop-fortress",
  "sariska-bhangarh:kankwari-fort": "sariska-bhangarh:kankwari-fort-hilltop-fortress",
  "sariska-bhangarh:pandupol-hanuman-temple-and-natural-water-chasm": "sariska-bhangarh:pandupol-hanuman-temple-and-natural-water-chasm",
  "sariska-bhangarh:pandupol-hanuman-temple": "sariska-bhangarh:pandupol-hanuman-temple-and-natural-water-chasm",
  "sariska-bhangarh:natural-water-chasm": "sariska-bhangarh:pandupol-hanuman-temple-and-natural-water-chasm",
  "sariska-bhangarh:neelkanth-ancient-temple-complex-6th-century": "sariska-bhangarh:neelkanth-ancient-temple-complex-6th-century",
  "sariska-bhangarh:neelkanth-temple-sariska": "sariska-bhangarh:neelkanth-ancient-temple-complex-6th-century",
  "sariska-bhangarh:6th-century": "sariska-bhangarh:neelkanth-ancient-temple-complex-6th-century",
  "sariska-bhangarh:neelkanth-ancient-temple-complex": "sariska-bhangarh:neelkanth-ancient-temple-complex-6th-century",
  "sariska-bhangarh:bhartrihari-temple-and-sacred-kund": "sariska-bhangarh:bhartrihari-temple-and-sacred-kund",
  "sariska-bhangarh:bhartrihari-temple-kund": "sariska-bhangarh:bhartrihari-temple-and-sacred-kund",
  "sariska-bhangarh:bhartrihari-temple": "sariska-bhangarh:bhartrihari-temple-and-sacred-kund",
  "sariska-bhangarh:sacred-kund": "sariska-bhangarh:bhartrihari-temple-and-sacred-kund",
  "sariska-bhangarh:the-sariska-palace-royal-french-courtyards": "sariska-bhangarh:the-sariska-palace-royal-french-courtyards",
  "sariska-bhangarh:sariska-palace-courtyard": "sariska-bhangarh:the-sariska-palace-royal-french-courtyards",
  "sariska-bhangarh:gola-ka-baas-traditional-rajasthani-dhaba": "sariska-bhangarh:gola-ka-baas-traditional-rajasthani-dhaba",
  "sariska-bhangarh:gola-ka-baas-dhaba": "sariska-bhangarh:gola-ka-baas-traditional-rajasthani-dhaba",
  "spiti:key-gompa-11th-century-fort-monastery": "spiti:key-gompa-11th-century-fort-monastery",
  "spiti:key-monastery": "spiti:key-gompa-11th-century-fort-monastery",
  "spiti:11th-century-fort-monastery": "spiti:key-gompa-11th-century-fort-monastery",
  "spiti:key-gompa": "spiti:key-gompa-11th-century-fort-monastery",
  "spiti:dhankar-gompa-and-cliffside-fortress": "spiti:dhankar-gompa-and-cliffside-fortress",
  "spiti:dhankar-monastery": "spiti:dhankar-gompa-and-cliffside-fortress",
  "spiti:cliffside-fortress": "spiti:dhankar-gompa-and-cliffside-fortress",
  "spiti:dhankar-gompa": "spiti:dhankar-gompa-and-cliffside-fortress",
  "spiti:hikkim-worlds-highest-post-office": "spiti:hikkim-worlds-highest-post-office",
  "spiti:hikkim-post-office": "spiti:hikkim-worlds-highest-post-office",
  "spiti:hikkim": "spiti:hikkim-worlds-highest-post-office",
  "spiti:worlds-highest-post-office": "spiti:hikkim-worlds-highest-post-office",
  "spiti:chandratal-crescent-moon-lake": "spiti:chandratal-crescent-moon-lake",
  "spiti:chandra-taal": "spiti:chandratal-crescent-moon-lake",
  "spiti:chandratal": "spiti:chandratal-crescent-moon-lake",
  "spiti:crescent-moon-lake": "spiti:chandratal-crescent-moon-lake",
  "spiti:langza-giant-buddha-and-marine-fossil-village": "spiti:langza-giant-buddha-and-marine-fossil-village",
  "spiti:langza-buddha": "spiti:langza-giant-buddha-and-marine-fossil-village",
  "spiti:langza-giant-buddha": "spiti:langza-giant-buddha-and-marine-fossil-village",
  "spiti:marine-fossil-village": "spiti:langza-giant-buddha-and-marine-fossil-village",
  "spiti:komic-worlds-highest-motor-connected-village": "spiti:komic-worlds-highest-motor-connected-village",
  "spiti:komic-village": "spiti:komic-worlds-highest-motor-connected-village",
  "spiti:komic": "spiti:komic-worlds-highest-motor-connected-village",
  "spiti:worlds-highest-motor-connected-village": "spiti:komic-worlds-highest-motor-connected-village",
  "spiti:pin-valley-national-park-and-mudh-village": "spiti:pin-valley-national-park-and-mudh-village",
  "spiti:pin-valley-park": "spiti:pin-valley-national-park-and-mudh-village",
  "spiti:mudh-village": "spiti:pin-valley-national-park-and-mudh-village",
  "spiti:pin-valley-national-park": "spiti:pin-valley-national-park-and-mudh-village",
  "spiti:cafe-deyzor-and-travelers-lounge": "spiti:cafe-deyzor-and-travelers-lounge",
  "spiti:cafe-deyzor": "spiti:cafe-deyzor-and-travelers-lounge",
  "spiti:travelers-lounge": "spiti:cafe-deyzor-and-travelers-lounge",
  "tungnath-chandrashila:tungnath-worlds-highest-shiva-shrine": "tungnath-chandrashila:tungnath-worlds-highest-shiva-shrine",
  "tungnath-chandrashila:tungnath-temple": "tungnath-chandrashila:tungnath-temple",
  "tungnath-chandrashila:tungnath": "tungnath-chandrashila:tungnath-temple",
  "tungnath-chandrashila:worlds-highest-shiva-shrine": "tungnath-chandrashila:tungnath-worlds-highest-shiva-shrine",
  "tungnath-chandrashila:chandrashila-4-000m-peak-summit": "tungnath-chandrashila:chandrashila-4-000m-peak-summit",
  "tungnath-chandrashila:chandrashila-summit": "tungnath-chandrashila:chandrashila-summit",
  "tungnath-chandrashila:000m-peak-summit": "tungnath-chandrashila:chandrashila-4-000m-peak-summit",
  "tungnath-chandrashila:chandrashila-4": "tungnath-chandrashila:chandrashila-4-000m-peak-summit",
  "tungnath-chandrashila:chopta-alpine-meadows-mini-switzerland": "tungnath-chandrashila:chopta-alpine-meadows-mini-switzerland",
  "tungnath-chandrashila:chopta-meadows-bugyal": "tungnath-chandrashila:chopta-alpine-meadows-mini-switzerland",
  "tungnath-chandrashila:chopta-alpine-meadows": "tungnath-chandrashila:chopta-alpine-meadows-mini-switzerland",
  "tungnath-chandrashila:mini-switzerland": "tungnath-chandrashila:chopta-alpine-meadows-mini-switzerland",
  "tungnath-chandrashila:deoria-tal-sacred-reflection-lake": "tungnath-chandrashila:deoria-tal-sacred-reflection-lake",
  "tungnath-chandrashila:deoria-tal-lake": "tungnath-chandrashila:deoria-tal-sacred-reflection-lake",
  "tungnath-chandrashila:rohida-oak-and-rhododendron-forest-walk": "tungnath-chandrashila:rohida-oak-and-rhododendron-forest-walk",
  "tungnath-chandrashila:rohida-forest-trail": "tungnath-chandrashila:rohida-oak-and-rhododendron-forest-walk",
  "tungnath-chandrashila:rhododendron-forest-walk": "tungnath-chandrashila:rohida-oak-and-rhododendron-forest-walk",
  "tungnath-chandrashila:rohida-oak": "tungnath-chandrashila:rohida-oak-and-rhododendron-forest-walk",
  "tungnath-chandrashila:dugalbitta-eco-camp-glade": "tungnath-chandrashila:dugalbitta-eco-camp-glade",
  "tungnath-chandrashila:dugalbitta-eco-glade": "tungnath-chandrashila:dugalbitta-eco-camp-glade",
  "tungnath-chandrashila:ukhimath-omkareshwar-winter-temple": "tungnath-chandrashila:ukhimath-omkareshwar-winter-temple",
  "tungnath-chandrashila:ukhimath-omkareshwar": "tungnath-chandrashila:ukhimath-omkareshwar-winter-temple",
  "tungnath-chandrashila:sari-village-apple-terraces-and-homestay-walk": "tungnath-chandrashila:sari-village-apple-terraces-and-homestay-walk",
  "tungnath-chandrashila:sari-village-base": "tungnath-chandrashila:sari-village-apple-terraces-and-homestay-walk",
  "tungnath-chandrashila:homestay-walk": "tungnath-chandrashila:sari-village-apple-terraces-and-homestay-walk",
  "tungnath-chandrashila:sari-village-apple-terraces": "tungnath-chandrashila:sari-village-apple-terraces-and-homestay-walk",
  "udaipur:city-palace-complex-and-zenana-mahal": "udaipur:city-palace-complex-and-zenana-mahal",
  "udaipur:city-palace-udaipur": "udaipur:city-palace-complex-and-zenana-mahal",
  "udaipur:city-palace": "udaipur:city-palace-complex-and-zenana-mahal",
  "udaipur:city-palace-complex": "udaipur:city-palace-complex-and-zenana-mahal",
  "udaipur:city-palace-of-udaipur": "udaipur:city-palace-complex-and-zenana-mahal",
  "udaipur:udaipur-city-palace": "udaipur:city-palace-complex-and-zenana-mahal",
  "udaipur:zenana-mahal": "udaipur:city-palace-complex-and-zenana-mahal",
  "udaipur:lake-pichola-ghats-and-island-cruise": "udaipur:lake-pichola-ghats-and-island-cruise",
  "udaipur:lake-pichola-boat-ride": "udaipur:lake-pichola-ghats-and-island-cruise",
  "udaipur:island-cruise": "udaipur:lake-pichola-ghats-and-island-cruise",
  "udaipur:lake-pichola": "udaipur:lake-pichola-ghats-and-island-cruise",
  "udaipur:lake-pichola-ghats": "udaipur:lake-pichola-ghats-and-island-cruise",
  "udaipur:lake-pichola-sunset-boat-voyage": "udaipur:lake-pichola-ghats-and-island-cruise",
  "udaipur:pichola-boat-ride": "udaipur:lake-pichola-ghats-and-island-cruise",
  "udaipur:pichola-cruise": "udaipur:lake-pichola-ghats-and-island-cruise",
  "udaipur:bagore-ki-haveli-and-dharohar-dance": "udaipur:bagore-ki-haveli-and-dharohar-dance",
  "udaipur:bagore-ki-haveli": "udaipur:bagore-ki-haveli-and-dharohar-dance",
  "udaipur:bagore": "udaipur:bagore-ki-haveli-and-dharohar-dance",
  "udaipur:bagore-haveli": "udaipur:bagore-ki-haveli-and-dharohar-dance",
  "udaipur:dharohar-dance": "udaipur:bagore-ki-haveli-and-dharohar-dance",
  "udaipur:ambrai-ghat-sunset-promenade-manjhi-ghat": "udaipur:ambrai-ghat-sunset-promenade-manjhi-ghat",
  "udaipur:ambrai-ghat": "udaipur:ambrai-ghat-sunset-promenade-manjhi-ghat",
  "udaipur:ambrai": "udaipur:ambrai-ghat-sunset-promenade-manjhi-ghat",
  "udaipur:ambrai-ghat-sunset-promenade": "udaipur:ambrai-ghat-sunset-promenade-manjhi-ghat",
  "udaipur:manjhi-ghat": "udaipur:ambrai-ghat-sunset-promenade-manjhi-ghat",
  "udaipur:saheliyon-ki-bari-garden-of-maidens": "udaipur:saheliyon-ki-bari-garden-of-maidens",
  "udaipur:saheliyon-ki-bari": "udaipur:saheliyon-ki-bari-garden-of-maidens",
  "udaipur:garden-of-maidens": "udaipur:saheliyon-ki-bari-garden-of-maidens",
  "udaipur:saheliyon": "udaipur:saheliyon-ki-bari-garden-of-maidens",
  "udaipur:saheliyon-bari": "udaipur:saheliyon-ki-bari-garden-of-maidens",
  "udaipur:sajjangarh-monsoon-palace-ridge": "udaipur:sajjangarh-monsoon-palace-ridge",
  "udaipur:sajjangarh-monsoon-palace": "udaipur:sajjangarh-monsoon-palace-ridge",
  "udaipur:monsoon-palace": "udaipur:sajjangarh-monsoon-palace-ridge",
  "udaipur:sajjangarh": "udaipur:sajjangarh-monsoon-palace-ridge",
  "udaipur:jheels-ginger-coffee-bar-and-bakery": "udaipur:jheels-ginger-coffee-bar-and-bakery",
  "udaipur:jheels-ginger-coffee": "udaipur:jheels-ginger-coffee-bar-and-bakery",
  "udaipur:bakery": "udaipur:jheels-ginger-coffee-bar-and-bakery",
  "udaipur:jeels-coffee": "udaipur:jheels-ginger-coffee-bar-and-bakery",
  "udaipur:jeels-ginger-coffee-bar": "udaipur:jheels-ginger-coffee-bar-and-bakery",
  "udaipur:jheels-coffee": "udaipur:jheels-ginger-coffee-bar-and-bakery",
  "udaipur:jheels-ginger-coffee-bar": "udaipur:jheels-ginger-coffee-bar-and-bakery",
  "udaipur:natraj-dining-hall-unlimited-mewari-thali": "udaipur:natraj-dining-hall-unlimited-mewari-thali",
  "udaipur:natraj-dining-hall": "udaipur:natraj-dining-hall-unlimited-mewari-thali",
  "udaipur:natraj": "udaipur:natraj-dining-hall-unlimited-mewari-thali",
  "udaipur:natraj-thali": "udaipur:natraj-dining-hall-unlimited-mewari-thali",
  "udaipur:unlimited-mewari-thali": "udaipur:natraj-dining-hall-unlimited-mewari-thali",
  "varanasi:dashashwamedh-ghat-evening-maha-aarti": "varanasi:dashashwamedh-ghat-evening-maha-aarti",
  "varanasi:dashashwamedh-ghat-aarti": "varanasi:dashashwamedh-ghat-evening-maha-aarti",
  "varanasi:assi-ghat-subah-e-banaras-morning-ceremony": "varanasi:assi-ghat-subah-e-banaras-morning-ceremony",
  "varanasi:assi-ghat-subah-e-banaras": "varanasi:assi-ghat-subah-e-banaras-morning-ceremony",
  "varanasi:kashi-vishwanath-temple-corridor": "varanasi:kashi-vishwanath-temple-corridor",
  "varanasi:kashi-vishwanath-corridor": "varanasi:kashi-vishwanath-temple-corridor",
  "varanasi:blue-lassi-shop-historic-churn-since-1925": "varanasi:blue-lassi-shop-historic-churn-since-1925",
  "varanasi:blue-lassi-shop": "varanasi:blue-lassi-shop-historic-churn-since-1925",
  "varanasi:historic-churn-since-1925": "varanasi:blue-lassi-shop-historic-churn-since-1925",
  "varanasi:sarnath-dhamek-stupa-and-deer-park": "varanasi:sarnath-dhamek-stupa-and-deer-park",
  "varanasi:sarnath-deer-park": "varanasi:sarnath-dhamek-stupa-and-deer-park",
  "varanasi:deer-park": "varanasi:sarnath-dhamek-stupa-and-deer-park",
  "varanasi:sarnath-dhamek-stupa": "varanasi:sarnath-dhamek-stupa-and-deer-park",
  "varanasi:manikarnika-ghat-the-eternal-flame": "varanasi:manikarnika-ghat-the-eternal-flame",
  "varanasi:manikarnika-ghat": "varanasi:manikarnika-ghat-the-eternal-flame",
  "varanasi:the-eternal-flame": "varanasi:manikarnika-ghat-the-eternal-flame",
  "varanasi:ramnagar-fort-and-vintage-royal-museum": "varanasi:ramnagar-fort-and-vintage-royal-museum",
  "varanasi:ramnagar-fort": "varanasi:ramnagar-fort-and-vintage-royal-museum",
  "varanasi:vintage-royal-museum": "varanasi:ramnagar-fort-and-vintage-royal-museum",
  "varanasi:laxmi-tea-stall-and-malaiyo-hub": "varanasi:laxmi-tea-stall-and-malaiyo-hub",
  "varanasi:kashi-tea-stall": "varanasi:laxmi-tea-stall-and-malaiyo-hub",
  "varanasi:laxmi-tea-stall": "varanasi:laxmi-tea-stall-and-malaiyo-hub",
  "varanasi:malaiyo-hub": "varanasi:laxmi-tea-stall-and-malaiyo-hub",
  "delhi:qutub-minar": "delhi:qutub-minar",
  "delhi:qutub": "delhi:qutub-minar",
  "delhi:qutb-minar": "delhi:qutub-minar",
  "delhi:red-fort": "delhi:red-fort",
  "delhi:lal-qila": "delhi:red-fort",
  "delhi:india-gate": "delhi:india-gate",
  "delhi:lotus-temple": "delhi:lotus-temple",
  "delhi:humayuns-tomb": "delhi:humayuns-tomb",
  "delhi:akshardham": "delhi:akshardham",
  "delhi:swaminarayan-akshardham": "delhi:akshardham",
  "delhi:chandni-chowk": "delhi:chandni-chowk",
  "mumbai:gateway-of-india": "mumbai:gateway-of-india",
  "mumbai:gateway": "mumbai:gateway-of-india",
  "amritsar:golden-temple": "amritsar:golden-temple",
  "amritsar:harmandir-sahib": "amritsar:golden-temple",
  "mussoorie:landour-bakehouse-sisters-bazaar": "mussoorie:landour-bakehouse",
  "mussoorie:lal-tibba-viewpoint": "mussoorie:lal-tibba",
  "mussoorie:kempty-falls": "mussoorie:kempty-falls",
  "mussoorie:kempty": "mussoorie:kempty-falls",
  "mussoorie:gun-hill": "mussoorie:gun-hill",
  "mussoorie:gun-hill-viewpoint": "mussoorie:gun-hill",
  "mussoorie:camel-back-road": "mussoorie:camels-back-road",
  "mussoorie:camels-back": "mussoorie:camels-back-road",
  "mussoorie:camel-back": "mussoorie:camels-back-road",
  "mussoorie:mall-road": "mussoorie:mall-road",
  "mussoorie:mussoorie-mall-road": "mussoorie:mall-road",
  "mussoorie:the-mall-road": "mussoorie:mall-road",
  "mussoorie:george-everest": "mussoorie:george-everest",
  "mussoorie:sir-george-everest-house": "mussoorie:george-everest",
  "mussoorie:george-everest-house": "mussoorie:george-everest",
  "mussoorie:clouds-end": "mussoorie:clouds-end",
  "mussoorie:clouds-end-heritage": "mussoorie:clouds-end",
  "mussoorie:landour": "mussoorie:landour",
  "mussoorie:landour-cantonment-ridge": "mussoorie:landour",
  "mussoorie:landour-ridge": "mussoorie:landour",
  "mussoorie:st-paul-church": "mussoorie:st-pauls-church",
  "mussoorie:st-pauls-church-landour": "mussoorie:st-pauls-church",
  "dharamshala:bhagsunag-waterfall": "dharamshala:bhagsunag-waterfall",
  "dharamshala:bhagsunag-waterfall-and-shiva-cafe": "dharamshala:bhagsunag-waterfall",
  "dharamshala:bhagsunag": "dharamshala:bhagsunag-waterfall",
  "dharamshala:namgyal-monastery": "dharamshala:namgyal-monastery",
  "dharamshala:namgyal": "dharamshala:namgyal-monastery",
  "dharamshala:namgyal-monastery-and-tsuglagkhang-complex": "dharamshala:namgyal-monastery",
  "dharamshala:namgyal-monastery-tsuglagkhang-complex": "dharamshala:namgyal-monastery",
  "dharamshala:triund-trek": "dharamshala:triund-trek",
  "dharamshala:triund": "dharamshala:triund-trek",
  "dharamshala:triund-high-ridge-himalayan-trek": "dharamshala:triund-trek",
  "dharamshala:triund-trail": "dharamshala:triund-trek",
  "dharamshala:norbulingka-tibetan-cultural-institute": "dharamshala:norbulingka-institute",
  "dharamshala:norbulingka": "dharamshala:norbulingka-institute",
  "jaipur:nahargarh-fort": "jaipur:nahargarh-fort",
  "jaipur:nahargarh-fort-sunset-bastion": "jaipur:nahargarh-fort",
  "jaipur:nahargarh": "jaipur:nahargarh-fort",
  "jaipur:amber-fort-and-maota-lake": "jaipur:amber-fort",
  "jaipur:amber": "jaipur:amber-fort",
  "jaipur:amer-fort": "jaipur:amber-fort",
  "jaipur:hawa-mahal-palace": "jaipur:hawa-mahal",
  "leh:lachen-palkhar": "leh:leh-palace",
  "leh:pangong-lake": "leh:pangong-tso",
  "leh:pangong-tso-alpine-lake": "leh:pangong-tso",
  "leh:pangong": "leh:pangong-tso",
  "leh:thiksey-monastery-gompa": "leh:thiksey-monastery-gompa",
  "leh:thiksey": "leh:thiksey-monastery-gompa",
  "goa:anjuna-beach": "goa:anjuna-beach",
  "goa:anjuna-beach-and-flea-market": "goa:anjuna-beach",
  "goa:anjuna": "goa:anjuna-beach",
  "varanasi:brijrama-palace": "varanasi:brijrama-palace",
  "varanasi:brijrama-palace-river-heritage": "varanasi:brijrama-palace",
  "varanasi:brijrama": "varanasi:brijrama-palace",
  "varanasi:brijrama-palace-heritage": "varanasi:brijrama-palace",
  "kasol:chalal-trail": "kasol:chalal-trail",
  "kasol:chalal-pine-riverside-trail": "kasol:chalal-trail",
  "kasol:chalal": "kasol:chalal-trail",
  "kasol:chalal-trail-pine-riverside-trail": "kasol:chalal-trail",
  "rishikesh:shivpuri-white-water-rafting": "rishikesh:shivpuri-rafting",
  "rishikesh:shivpuri": "rishikesh:shivpuri-rafting",
  "tungnath-chandrashila:01-tungnath-temple": "tungnath-chandrashila:tungnath-temple",
  "tungnath-chandrashila:tungnath-temple-highest-shiva-shrine": "tungnath-chandrashila:tungnath-temple",
  "tungnath-chandrashila:01-tungnath": "tungnath-chandrashila:tungnath-temple",
  "tungnath-chandrashila:02-chandrashila-summit": "tungnath-chandrashila:chandrashila-summit",
  "tungnath-chandrashila:chandrashila-peak": "tungnath-chandrashila:chandrashila-summit",
  "tungnath-chandrashila:02-chandrashila-peak": "tungnath-chandrashila:chandrashila-summit",
  "tungnath-chandrashila:chandrashila-summit-ridge": "tungnath-chandrashila:chandrashila-summit",
  "tungnath-chandrashila:chandrashila": "tungnath-chandrashila:chandrashila-summit",
  "tungnath-chandrashila:02-chandrashila": "tungnath-chandrashila:chandrashila-summit",
};

export const HOTEL_ALIAS_MAP: Record<string, string> = {
  "agra:the-oberoi-amarvilas": "agra:the-oberoi-amarvilas",
  "agra:itc-mughal-luxury-collection": "agra:itc-mughal-luxury-collection",
  "agra:coral-tree-homestay": "agra:coral-tree-homestay",
  "agra:zostel-agra": "agra:zostel-agra",
  "agra:zostel": "agra:zostel-agra",
  "alwar-siliserh:siliserh-lake-palace-rtdc-heritage": "alwar-siliserh:siliserh-lake-palace-rtdc-heritage",
  "alwar-siliserh:rtdc-heritage": "alwar-siliserh:siliserh-lake-palace-rtdc-heritage",
  "alwar-siliserh:siliserh-lake-palace": "alwar-siliserh:siliserh-lake-palace-rtdc-heritage",
  "alwar-siliserh:dadhikar-fort-heritage-hotel": "alwar-siliserh:dadhikar-fort-heritage-hotel",
  "alwar-siliserh:lemon-tree-hotel-alwar": "alwar-siliserh:lemon-tree-hotel-alwar",
  "alwar-siliserh:fort-view-homestay-alwar": "alwar-siliserh:fort-view-homestay-alwar",
  "chandigarh:taj-chandigarh-sector-17": "chandigarh:taj-chandigarh-sector-17",
  "chandigarh:taj-sector-17": "chandigarh:taj-chandigarh-sector-17",
  "chandigarh:the-lalit-chandigarh": "chandigarh:the-lalit-chandigarh",
  "chandigarh:the-lalit": "chandigarh:the-lalit-chandigarh",
  "chandigarh:jw-marriott-hotel-chandigarh": "chandigarh:jw-marriott-hotel-chandigarh",
  "chandigarh:jw-marriott-hotel": "chandigarh:jw-marriott-hotel-chandigarh",
  "chandigarh:backpackers-villa-chandigarh": "chandigarh:backpackers-villa-chandigarh",
  "chandigarh:backpackers-villa": "chandigarh:backpackers-villa-chandigarh",
  "damdama-sohna:the-gateway-resort-damdama-lake": "damdama-sohna:the-gateway-resort-damdama-lake",
  "damdama-sohna:heritage-village-resort-and-spa": "damdama-sohna:heritage-village-resort-and-spa",
  "damdama-sohna:heritage-village-resort-spa": "damdama-sohna:heritage-village-resort-and-spa",
  "damdama-sohna:heritage-village-resort": "damdama-sohna:heritage-village-resort-and-spa",
  "damdama-sohna:spa": "damdama-sohna:heritage-village-resort-and-spa",
  "damdama-sohna:botanix-nature-resort-and-eco-camp": "damdama-sohna:botanix-nature-resort-and-eco-camp",
  "damdama-sohna:botanix-nature-resort-eco-camp": "damdama-sohna:botanix-nature-resort-and-eco-camp",
  "damdama-sohna:botanix-nature-resort": "damdama-sohna:botanix-nature-resort-and-eco-camp",
  "damdama-sohna:eco-camp": "damdama-sohna:botanix-nature-resort-and-eco-camp",
  "damdama-sohna:country-inn-and-suites-sohna-road": "damdama-sohna:country-inn-and-suites-sohna-road",
  "damdama-sohna:country-inn-suites-sohna-road": "damdama-sohna:country-inn-and-suites-sohna-road",
  "damdama-sohna:country-inn": "damdama-sohna:country-inn-and-suites-sohna-road",
  "damdama-sohna:suites-sohna-road": "damdama-sohna:country-inn-and-suites-sohna-road",
  "dehradun:walterre-resort-boutique-lodge": "dehradun:walterre-resort-boutique-lodge",
  "dehradun:lemon-tree-hotel-dehradun": "dehradun:lemon-tree-hotel-dehradun",
  "dehradun:lemon-tree-hotel": "dehradun:lemon-tree-hotel-dehradun",
  "dehradun:saiva-hill-resort-rajpur": "dehradun:saiva-hill-resort-rajpur",
  "dehradun:nomads-hostel-dehradun": "dehradun:nomads-hostel-dehradun",
  "dehradun:nomads-hostel": "dehradun:nomads-hostel-dehradun",
  "dharamshala:fortune-park-moksha": "dharamshala:fortune-park-moksha",
  "dharamshala:chonor-house-tibetan-guesthouse": "dharamshala:chonor-house-tibetan-guesthouse",
  "dharamshala:clouds-end-villa-heritage-estate": "dharamshala:clouds-end-villa-heritage-estate",
  "dharamshala:zostel-dharamkot": "dharamshala:zostel-dharamkot",
  "goa:ahilya-by-the-sea": "goa:ahilya-by-the-sea",
  "goa:the-postcard-velha": "goa:the-postcard-velha",
  "goa:casa-da-graca-heritage-homestay": "goa:casa-da-graca-heritage-homestay",
  "goa:casa-da-graça-heritage-homestay": "goa:casa-da-graca-heritage-homestay",
  "goa:jungle-by-the-hosteller": "goa:jungle-by-the-hosteller",
  "jaipur:samode-haveli": "jaipur:samode-haveli",
  "jaipur:28-kothi-boutique-guesthouse": "jaipur:28-kothi-boutique-guesthouse",
  "jaipur:royal-heritage-haveli-by-khatukar": "jaipur:royal-heritage-haveli-by-khatukar",
  "jaipur:moustache-jaipur": "jaipur:moustache-jaipur",
  "jaipur:moustache": "jaipur:moustache-jaipur",
  "jaisalmer:suryagarh-jaisalmer": "jaisalmer:suryagarh-jaisalmer",
  "jaisalmer:suryagarh": "jaisalmer:suryagarh-jaisalmer",
  "jaisalmer:killa-bhawan-heritage-stay": "jaisalmer:killa-bhawan-heritage-stay",
  "jaisalmer:jaisalmer-marriott-resort-and-spa": "jaisalmer:jaisalmer-marriott-resort-and-spa",
  "jaisalmer:jaisalmer-marriott-resort-spa": "jaisalmer:jaisalmer-marriott-resort-and-spa",
  "jaisalmer:jaisalmer-marriott-resort": "jaisalmer:jaisalmer-marriott-resort-and-spa",
  "jaisalmer:marriott-resort-spa": "jaisalmer:jaisalmer-marriott-resort-and-spa",
  "jaisalmer:spa": "jaisalmer:jaisalmer-marriott-resort-and-spa",
  "jaisalmer:zostel-jaisalmer": "jaisalmer:zostel-jaisalmer",
  "jaisalmer:zostel": "jaisalmer:zostel-jaisalmer",
  "kainchi-dham:bara-bungalow-gethia-1898-heritage": "kainchi-dham:bara-bungalow-gethia-1898-heritage",
  "kainchi-dham:1898-heritage": "kainchi-dham:bara-bungalow-gethia-1898-heritage",
  "kainchi-dham:bara-bungalow-gethia": "kainchi-dham:bara-bungalow-gethia-1898-heritage",
  "kainchi-dham:the-hermitage-bhowali": "kainchi-dham:the-hermitage-bhowali",
  "kainchi-dham:kainchi-valley-spiritual-homestay": "kainchi-dham:kainchi-valley-spiritual-homestay",
  "kainchi-dham:the-green-glade-resort-bhimtal": "kainchi-dham:the-green-glade-resort-bhimtal",
  "kasol:the-himalayan-village": "kasol:the-himalayan-village",
  "kasol:parvati-kuteer-riverside-wood-cottages": "kasol:parvati-kuteer-riverside-wood-cottages",
  "kasol:kasol-heights-resort": "kasol:kasol-heights-resort",
  "kasol:heights-resort": "kasol:kasol-heights-resort",
  "kasol:the-hosteller-kasol-riverside": "kasol:the-hosteller-kasol-riverside",
  "kasol:the-hosteller-kasol": "kasol:the-hosteller-kasol-riverside",
  "kasol:the-hosteller-riverside": "kasol:the-hosteller-kasol-riverside",
  "lansdowne:the-lansdowne-woods-boutique-resort": "lansdowne:the-lansdowne-woods-boutique-resort",
  "lansdowne:the-woods-boutique-resort": "lansdowne:the-lansdowne-woods-boutique-resort",
  "lansdowne:kasang-regency-hill-resort": "lansdowne:kasang-regency-hill-resort",
  "lansdowne:fairydale-resort-colonial-cottage": "lansdowne:fairydale-resort-colonial-cottage",
  "lansdowne:sb-mount-resort-lansdowne": "lansdowne:sb-mount-resort-lansdowne",
  "lansdowne:sb-mount-resort": "lansdowne:sb-mount-resort-lansdowne",
  "leh:the-grand-dragon-ladakh": "leh:the-grand-dragon-ladakh",
  "leh:nimmu-house-heritage-eco-resort": "leh:nimmu-house-heritage-eco-resort",
  "leh:stok-palace-heritage-guesthouse": "leh:stok-palace-heritage-guesthouse",
  "leh:zostel-leh": "leh:zostel-leh",
  "leh:zostel": "leh:zostel-leh",
  "manali:the-himalayan-castle-and-stone-cottages": "manali:the-himalayan-castle-and-stone-cottages",
  "manali:the-himalayan-castle-stone-cottages": "manali:the-himalayan-castle-and-stone-cottages",
  "manali:stone-cottages": "manali:the-himalayan-castle-and-stone-cottages",
  "manali:the-himalayan": "manali:the-himalayan-castle-and-stone-cottages",
  "manali:the-himalayan-castle": "manali:the-himalayan-castle-and-stone-cottages",
  "manali:the-himalayan-woods-boutique-retreat": "manali:the-himalayan-castle-and-stone-cottages",
  "manali:larisa-resort-and-apple-orchard": "manali:larisa-resort-and-apple-orchard",
  "manali:larisa-resort-apple-orchard": "manali:larisa-resort-and-apple-orchard",
  "manali:apple-orchard": "manali:larisa-resort-and-apple-orchard",
  "manali:larisa": "manali:larisa-resort-and-apple-orchard",
  "manali:larisa-resort": "manali:larisa-resort-and-apple-orchard",
  "manali:drifters-inn-and-wooden-loft": "manali:drifters-inn-and-wooden-loft",
  "manali:drifters-inn-wooden-loft": "manali:drifters-inn-and-wooden-loft",
  "manali:drifters-cafe": "manali:drifters-inn-and-wooden-loft",
  "manali:drifters-cafe-and-acoustic-inn": "manali:drifters-inn-and-wooden-loft",
  "manali:drifters-inn": "manali:drifters-inn-and-wooden-loft",
  "manali:wooden-loft": "manali:drifters-inn-and-wooden-loft",
  "manali:zostel-manali-old-manali": "manali:zostel-manali-old-manali",
  "manali:old-manali": "manali:zostel-manali-old-manali",
  "manali:zostel-manali": "manali:zostel-manali-old-manali",
  "manali:zostel-old": "manali:zostel-manali-old-manali",
  "mathura-vrindavan:nidhivan-sarovar-portico": "mathura-vrindavan:nidhivan-sarovar-portico",
  "mathura-vrindavan:mvt-guesthouse-and-garden-restaurant": "mathura-vrindavan:mvt-guesthouse-and-garden-restaurant",
  "mathura-vrindavan:mvt-guesthouse-garden-restaurant": "mathura-vrindavan:mvt-guesthouse-and-garden-restaurant",
  "mathura-vrindavan:garden-restaurant": "mathura-vrindavan:mvt-guesthouse-and-garden-restaurant",
  "mathura-vrindavan:mvt-guesthouse": "mathura-vrindavan:mvt-guesthouse-and-garden-restaurant",
  "mathura-vrindavan:brij-view-vrindavan-luxury-suites": "mathura-vrindavan:brij-view-vrindavan-luxury-suites",
  "mathura-vrindavan:radha-krishna-kripa-dham-homestay": "mathura-vrindavan:radha-krishna-kripa-dham-homestay",
  "morni-hills:royal-morni-resort": "morni-hills:royal-morni-resort",
  "morni-hills:mountain-quail-tourist-resort-tikkar-taal": "morni-hills:mountain-quail-tourist-resort-tikkar-taal",
  "morni-hills:shivalik-ridge-village-homestay": "morni-hills:shivalik-ridge-village-homestay",
  "morni-hills:hilltop-forest-cottage-morni": "morni-hills:hilltop-forest-cottage-morni",
  "munnar:windermere-estate": "munnar:windermere-estate",
  "munnar:blanket-luxury-villa-and-spa": "munnar:blanket-luxury-villa-and-spa",
  "munnar:blanket-luxury-villa-spa": "munnar:blanket-luxury-villa-and-spa",
  "munnar:blanket-luxury-villa": "munnar:blanket-luxury-villa-and-spa",
  "munnar:spa": "munnar:blanket-luxury-villa-and-spa",
  "munnar:olive-brook-plantation-homestay": "munnar:olive-brook-plantation-homestay",
  "munnar:the-hosteller-munnar": "munnar:the-hosteller-munnar",
  "munnar:the-hosteller": "munnar:the-hosteller-munnar",
  "murthal:grand-haveli-resort-murthal": "murthal:grand-haveli-resort-murthal",
  "murthal:grand-haveli-resort": "murthal:grand-haveli-resort-murthal",
  "murthal:tivoli-heritage-grand-nh-44": "murthal:tivoli-heritage-grand-nh-44",
  "murthal:highway-king-hotel-sonipat": "murthal:highway-king-hotel-sonipat",
  "murthal:star-hotel-and-suites-murthal": "murthal:star-hotel-and-suites-murthal",
  "murthal:star-hotel-suites-murthal": "murthal:star-hotel-and-suites-murthal",
  "murthal:star-hotel": "murthal:star-hotel-and-suites-murthal",
  "murthal:star-hotel-suites": "murthal:star-hotel-and-suites-murthal",
  "murthal:suites-murthal": "murthal:star-hotel-and-suites-murthal",
  "mussoorie:rokeby-manor-landour": "mussoorie:rokeby-manor-landour",
  "mussoorie:welcomhotel-the-savoy": "mussoorie:welcomhotel-the-savoy",
  "mussoorie:domas-inn-tibetan-guesthouse": "mussoorie:domas-inn-tibetan-guesthouse",
  "mussoorie:the-hosteller-mussoorie-mall-road": "mussoorie:the-hosteller-mussoorie-mall-road",
  "mussoorie:mall-road": "mussoorie:the-hosteller-mussoorie-mall-road",
  "mussoorie:the-hosteller-mall-road": "mussoorie:the-hosteller-mussoorie-mall-road",
  "mussoorie:the-hosteller-mussoorie": "mussoorie:the-hosteller-mussoorie-mall-road",
  "neemrana:neemrana-fort-palace": "neemrana:neemrana-fort-palace",
  "neemrana:fort-palace": "neemrana:neemrana-fort-palace",
  "neemrana:ramada-by-wyndham-neemrana": "neemrana:ramada-by-wyndham-neemrana",
  "neemrana:ramada-by-wyndham": "neemrana:ramada-by-wyndham-neemrana",
  "neemrana:shiva-oasis-resort": "neemrana:shiva-oasis-resort",
  "neemrana:fort-view-heritage-homestay": "neemrana:fort-view-heritage-homestay",
  "rishikesh:aloha-on-the-ganges": "rishikesh:aloha-on-the-ganges",
  "rishikesh:aloha": "rishikesh:aloha-on-the-ganges",
  "rishikesh:aloha-ganges": "rishikesh:aloha-on-the-ganges",
  "rishikesh:glasshouse-on-the-ganges": "rishikesh:glasshouse-on-the-ganges",
  "rishikesh:glasshouse": "rishikesh:glasshouse-on-the-ganges",
  "rishikesh:glasshouse-ganges": "rishikesh:glasshouse-on-the-ganges",
  "rishikesh:ganga-kinare-riverside-sanctuary": "rishikesh:ganga-kinare-riverside-sanctuary",
  "rishikesh:ganga-kinare": "rishikesh:ganga-kinare-riverside-sanctuary",
  "rishikesh:ganga-kinare-riverside-retreat": "rishikesh:ganga-kinare-riverside-sanctuary",
  "rishikesh:zostel-rishikesh-tapovan": "rishikesh:zostel-rishikesh-tapovan",
  "rishikesh:tapovan": "rishikesh:zostel-rishikesh-tapovan",
  "rishikesh:zostel-rishikesh": "rishikesh:zostel-rishikesh-tapovan",
  "rishikesh:zostel-tapovan": "rishikesh:zostel-rishikesh-tapovan",
  "sariska-bhangarh:the-sariska-palace-heritage-hotel": "sariska-bhangarh:the-sariska-palace-heritage-hotel",
  "sariska-bhangarh:amanbagh-luxury-sanctuary": "sariska-bhangarh:amanbagh-luxury-sanctuary",
  "sariska-bhangarh:trees-and-tigers-wildlife-resort": "sariska-bhangarh:trees-and-tigers-wildlife-resort",
  "sariska-bhangarh:trees-tigers-wildlife-resort": "sariska-bhangarh:trees-and-tigers-wildlife-resort",
  "sariska-bhangarh:tigers-wildlife-resort": "sariska-bhangarh:trees-and-tigers-wildlife-resort",
  "sariska-bhangarh:trees": "sariska-bhangarh:trees-and-tigers-wildlife-resort",
  "sariska-bhangarh:vanaashrya-resort-sariska": "sariska-bhangarh:vanaashrya-resort-sariska",
  "spiti:hotel-deyzor-kaza": "spiti:hotel-deyzor-kaza",
  "spiti:spiti-valley-eco-lodge": "spiti:spiti-valley-eco-lodge",
  "spiti:valley-eco-lodge": "spiti:spiti-valley-eco-lodge",
  "spiti:dekit-norbu-homestay-kaza": "spiti:dekit-norbu-homestay-kaza",
  "spiti:zostel-spiti-kaza": "spiti:zostel-spiti-kaza",
  "spiti:kaza": "spiti:zostel-spiti-kaza",
  "spiti:zostel-kaza": "spiti:zostel-spiti-kaza",
  "spiti:zostel-spiti": "spiti:zostel-spiti-kaza",
  "tungnath-chandrashila:alpine-meadow-eco-lodge-chopta": "tungnath-chandrashila:alpine-meadow-eco-lodge-chopta",
  "tungnath-chandrashila:magpie-jungle-camp-chopta": "tungnath-chandrashila:magpie-jungle-camp-chopta",
  "tungnath-chandrashila:chopta-meadows-homestay-sari-base": "tungnath-chandrashila:chopta-meadows-homestay-sari-base",
  "tungnath-chandrashila:chopta-meadows-homestay": "tungnath-chandrashila:chopta-meadows-homestay-sari-base",
  "tungnath-chandrashila:sari-base": "tungnath-chandrashila:chopta-meadows-homestay-sari-base",
  "tungnath-chandrashila:monal-himalayan-resort-dugalbitta": "tungnath-chandrashila:monal-himalayan-resort-dugalbitta",
  "udaipur:jagat-niwas-palace-hotel": "udaipur:jagat-niwas-palace-hotel",
  "udaipur:amet-haveli-heritage-hotel": "udaipur:amet-haveli-heritage-hotel",
  "udaipur:tribute-lakeside-boutique-stay": "udaipur:tribute-lakeside-boutique-stay",
  "udaipur:zostel-udaipur": "udaipur:zostel-udaipur",
  "udaipur:zostel": "udaipur:zostel-udaipur",
  "varanasi:brijrama-palace-heritage-grand": "varanasi:brijrama-palace-heritage-grand",
  "varanasi:ganges-view-heritage-hotel": "varanasi:ganges-view-heritage-hotel",
  "varanasi:amritara-suryauday-haveli": "varanasi:amritara-suryauday-haveli",
  "varanasi:stops-hostel-varanasi": "varanasi:stops-hostel-varanasi",
  "varanasi:stops-hostel": "varanasi:stops-hostel-varanasi",
};

const GENERIC_WORDS_SET = new Set([
  "hotel", "resort", "homestay", "hostel", "guesthouse", "guest-house", "cottage", "palace", "haveli",
  "cafe", "cafes", "restaurant", "dhaba", "dining", "retreat", "sanctuary", "temple", "monastery",
  "ashram", "waterfall", "falls", "lake", "viewpoint", "point", "sunset", "trail", "trek", "park",
  "garden", "gardens", "bazaar", "market", "chowk", "ghat", "dham", "mandir", "wood", "woods", "stone",
  "himalayan", "apple", "orchard", "loft", "lodge", "camp", "camps", "villa", "villas", "inn", "house",
  "hub", "fleet", "rentals", "rental", "scooters", "scooter", "bike", "bikes", "motorcycle", "self-drive",
  "drift", "acoustic", "hill", "hills", "view", "views", "pine", "cedar", "beach", "coast", "coastline",
  "cove", "ridge", "estate", "residency", "stay", "stays", "traveler", "circle", "square"
]);

// Deprecated artwork filter: reject placeholder and vector SVG assets
export function isDeprecatedArtwork(url?: string): boolean {
  if (!url || typeof url !== "string") return true;
  const u = url.toLowerCase();
  return u.includes("placeholder") || u.includes("vector") || u.includes(".svg") || u.includes("geometric-moon") || u.includes("simple-moon-mountain");
}

export function isApprovedAsset(url?: string): boolean {
  return !isDeprecatedArtwork(url);
}

export function cleanString(s: string): string {
  if (!s) return "";
  let clean = s.toLowerCase().trim().replace(/&/g, "and").replace(/['’`\u2019\ufffd]/g, "");
  for (const dash of ["—", "–", "‐", "‑", "‒", "–", "—", "―", "−", "－", "_", "/", "\\"]) {
    clean = clean.split(dash).join("-");
  }
  return clean
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function classifyCategoryTheme(category: string, placeName: string = ""): string {
  const cat = (category || "").toLowerCase();
  const name = (placeName || "").toLowerCase();

  if (cat.includes("mobility") || cat.includes("rental") || cat.includes("transport") || cat.includes("scooter") || cat.includes("bike") || cat.includes("vehicle")) {
    return "transport";
  }
  if (name.includes("rentals") || name.includes("rental") || name.includes("scooters") || name.includes("scooter") || name.includes("motorcycle") || name.includes("bike hub") || name.includes("fleet") || name.includes("self-drive")) {
    return "transport";
  }
  if (cat.includes("stay") || cat.includes("hotel") || cat.includes("resort") || cat.includes("hostel") || cat.includes("homestay") || cat.includes("sanctuary")) {
    return "stay";
  }
  if (name.includes("hotel") || name.includes("resort") || name.includes("homestay") || name.includes("hostel") || name.includes("guesthouse") || name.includes("guest house") || name.includes("cottage") || name.includes("palace hotel") || name.includes("inn &") || name.includes("inn and")) {
    return "stay";
  }
  if (name.includes("temple") || name.includes("ashram") || name.includes("mandir") || name.includes("kund") || name.includes("aarti") || name.includes("ghat") || name.includes("dham") || name.includes("gurudwara") || name.includes("math")) {
    return "spiritual";
  }
  if (cat.includes("spiritual") || cat.includes("temple") || cat.includes("ashram") || cat.includes("pilgrim")) {
    return "spiritual";
  }
  if (name.includes("monastery") || name.includes("gompa") || name.includes("stupa") || cat.includes("monastery")) {
    return "monastery";
  }
  if (name.includes("church") || name.includes("cathedral") || name.includes("basilica") || cat.includes("church")) {
    return "church";
  }
  if (cat.includes("caf") || cat.includes("bakery") || cat.includes("coffee") || name.includes("cafe") || name.includes("café") || name.includes("bakery") || name.includes("coffee") || name.includes("bistro") || name.includes("roastery")) {
    return "cafe";
  }
  if (cat.includes("food") || cat.includes("dining") || cat.includes("restaurant") || cat.includes("street") || name.includes("dhaba") || name.includes("restaurant") || name.includes("dining") || name.includes("lassi") || name.includes("sweets") || name.includes("food") || name.includes("kitchen") || name.includes("thali") || name.includes("bhojanalaya")) {
    return "food";
  }
  if (cat.includes("heritage") || cat.includes("culture") || cat.includes("monument") || cat.includes("historic") || cat.includes("fort") || cat.includes("palace") || cat.includes("museum") || name.includes("fort") || name.includes("palace") || name.includes("haveli") || name.includes("museum") || name.includes("ruins") || name.includes("memorial") || name.includes("tomb") || name.includes("archaeological")) {
    return "heritage";
  }
  if (cat.includes("waterfall") || cat.includes("falls") || name.includes("waterfall") || name.includes("falls")) {
    return "waterfall";
  }
  if (cat.includes("lake") || cat.includes("dam") || name.includes("lake") || name.includes("taal") || name.includes("tso") || name.includes("dam") || name.includes("pichola")) {
    return "lake";
  }
  if (cat.includes("beach") || cat.includes("coast") || name.includes("beach") || name.includes("cove") || name.includes("coast")) {
    return "beach";
  }
  if (cat.includes("viewpoint") || cat.includes("scenic") || name.includes("viewpoint") || name.includes("crest") || name.includes("top") || name.includes("sunset point") || name.includes("peak") || name.includes("summit") || name.includes("pass")) {
    return "viewpoint";
  }
  if (cat.includes("nature") || cat.includes("trail") || cat.includes("wildlife") || cat.includes("forest") || cat.includes("park") || cat.includes("garden") || cat.includes("trek") || cat.includes("adventure") || name.includes("trail") || name.includes("meadow") || name.includes("forest") || name.includes("park") || name.includes("garden") || name.includes("wildlife") || name.includes("safari") || name.includes("sanctuary")) {
    return "nature";
  }
  if (cat.includes("market") || cat.includes("shopping") || cat.includes("craft") || cat.includes("shop") || name.includes("market") || name.includes("bazaar") || name.includes("mall") || name.includes("chowk") || name.includes("plaza") || name.includes("shop")) {
    return "shopping";
  }

  return "nature";
}

function getUniversalFallback(theme: string): string {
  return UNIVERSAL_CATEGORY_FALLBACKS[theme] || UNIVERSAL_CATEGORY_FALLBACKS.nature;
}

function buildContract(data: {
  url: string;
  fallbackUrl: string;
  source: string;
  sourceType: ImageSourceType;
  provenance: ImageProvenanceTier;
  semanticCategory: string;
  exactness: ImageExactness;
  attribution: string;
  altText: string;
  badgeLabel: ProvenanceBadge;
  artworkKey?: string;
  visualDescription?: string;
  isRealPhoto?: boolean;
}): ImageContract {
  return {
    url: data.url,
    imageUrl: data.url,
    fallback_url: data.fallbackUrl,
    fallbackUrl: data.fallbackUrl,
    source: data.source,
    source_type: data.sourceType,
    sourceType: data.sourceType,
    provenance: data.provenance,
    semantic_category: data.semanticCategory,
    semanticCategory: data.semanticCategory,
    exactness: data.exactness,
    attribution: data.attribution,
    alt_text: data.altText,
    altText: data.altText,
    badge_label: data.badgeLabel,
    badgeLabel: data.badgeLabel,
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

  // PRIORITY 1: Verified Real External Photograph (Live / Wikimedia photo)
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

  // PRIORITY 2: Curated Exact Hotel Registry (Direct Key Lookup & Alias Map)
  const lookupKey = `${destNorm}:${hotelNorm}`;
  const matchedKey = matchedDest ? `${matchedDest}:${hotelNorm}` : lookupKey;
  let targetKey: string | undefined;

  if (EXACT_HOTEL_REGISTRY[lookupKey]) {
    targetKey = lookupKey;
  } else if (HOTEL_ALIAS_MAP[lookupKey]) {
    targetKey = HOTEL_ALIAS_MAP[lookupKey];
  } else if (EXACT_HOTEL_REGISTRY[matchedKey]) {
    targetKey = matchedKey;
  } else if (HOTEL_ALIAS_MAP[matchedKey]) {
    targetKey = HOTEL_ALIAS_MAP[matchedKey];
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

  // PRIORITY 3: Destination-Scoped Alias Matching against EXACT_HOTEL_REGISTRY
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
        if (al.length >= 3 && !GENERIC_WORDS_SET.has(al) && (hotelNorm.startsWith(`${al}-`) || hotelNorm.endsWith(`-${al}`) || hotelNorm.includes(`-${al}-`))) {
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

  // PRIORITY 4: Verified Local Property Asset on Disk (Explicit Stays Path)
  if (existingImageUrl && existingImageUrl.startsWith("/images/places/") && existingImageUrl.includes("/stays/") && !existingImageUrl.includes("/categories/") && !existingImageUrl.includes("/fallbacks/") && !existingImageUrl.includes("/universal/")) {
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

  // PRIORITY 5: Destination Stay Category Fallback
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

  // PRIORITY 6: Universal Fallback
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

  // PRIORITY 1: Verified Real External Photograph (Live / Wikimedia photo)
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

  // PRIORITY 2: Curated Exact Place Match (Direct Key Lookup & Alias Map)
  const lookupKey = `${destNorm}:${placeNorm}`;
  const matchedKey = matchedDest ? `${matchedDest}:${placeNorm}` : lookupKey;
  let targetKey: string | undefined;

  if (EXACT_PLACE_REGISTRY[lookupKey]) {
    targetKey = lookupKey;
  } else if (PLACE_ALIAS_MAP[lookupKey]) {
    targetKey = PLACE_ALIAS_MAP[lookupKey];
  } else if (EXACT_PLACE_REGISTRY[matchedKey]) {
    targetKey = matchedKey;
  } else if (PLACE_ALIAS_MAP[matchedKey]) {
    targetKey = PLACE_ALIAS_MAP[matchedKey];
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

  // PRIORITY 3: Destination-Scoped Alias Matching against EXACT_PLACE_REGISTRY
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
        if (al.length >= 3 && !GENERIC_WORDS_SET.has(al) && (placeNorm.startsWith(`${al}-`) || placeNorm.endsWith(`-${al}`) || placeNorm.includes(`-${al}-`))) {
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

  // PRIORITY 4: Verified Local Asset on Disk (Exact Place Path)
  if (existingImageUrl && existingImageUrl.startsWith("/images/places/") && !existingImageUrl.includes("/categories/") && !existingImageUrl.includes("/fallbacks/") && !existingImageUrl.includes("/universal/")) {
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

  // PRIORITY 5: Destination Category Fallback
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

  // PRIORITY 6 & 7: Universal Fallback
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
