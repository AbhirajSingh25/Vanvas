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
  "agra:chini-ka-rauza-persian-glazed-tile-tomb": {
    imageUrl: "/images/places/agra/hero.webp",
    visualDescription: "A 1635 Persian architectural masterpiece dedicated to Afzal Khan Shirazi, famous for vibrant turquoise and lapis-lazuli glazed tilework.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chini-ka-rauza",
      "chini-ka-rauza-persian-glazed-tile-tomb",
      "persian-glazed-tile-tomb"
    ]
  },
  "agra:mariam-uz-zamani-tomb-empress-jodha-bai": {
    imageUrl: "/images/places/agra/mariams-tomb-sikandra.webp",
    visualDescription: "The peaceful red sandstone garden tomb of Emperor Akbar’s Rajput queen Mariam-uz-Zamani, originally built by Sikandar Lodi in 1495.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "empress-jodha-bai",
      "mariam-uz-zamani-tomb",
      "mariam-uz-zamani-tomb-empress-jodha-bai",
      "mariams-tomb-sikandra"
    ]
  },
  "agra:kinari-bazaar-heritage-zardozi-and-spice-market": {
    imageUrl: "/images/places/agra/kinari-bazaar-crafts.webp",
    visualDescription: "A vibrant maze of medieval alleys behind Jama Masjid packed with artisan marble inlay carvers, gold zardozi embroiderers, and spice merchants.",
    category: "Local Food & Street Eats",
    semanticTheme: "shopping",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kinari-bazaar-crafts",
      "kinari-bazaar-heritage-zardozi",
      "kinari-bazaar-heritage-zardozi-and-spice-market",
      "spice-market"
    ]
  },
  "agra:soor-sarovar-bird-sanctuary-and-keetham-lake": {
    imageUrl: "/images/places/agra/soor-sarovar-lake.webp",
    visualDescription: "A 4 sq km wetland bird sanctuary and Keetham Lake housing over 165 species of migratory waterfowl and the Wildlife SOS sloth bear conservation centre.",
    category: "Nature & Viewpoints",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "keetham-lake",
      "soor-sarovar-bird-sanctuary",
      "soor-sarovar-bird-sanctuary-and-keetham-lake",
      "soor-sarovar-lake"
    ]
  },
  "agra:taj-nature-walk-forest-ridge-trail": {
    imageUrl: "/images/places/agra/taj-nature-walk-ridge.webp",
    visualDescription: "A 70-hectare woodland reserve with elevated timber watchtowers offering secluded vistas of the Taj Mahal dome through native dhau trees.",
    category: "Nature & Viewpoints",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "taj-nature-walk-forest-ridge-trail",
      "taj-nature-walk-ridge"
    ]
  },
  "agra:aram-bagh-babur-1528-charbagh-garden": {
    imageUrl: "/images/places/agra/ram-bagh-gardens.webp",
    visualDescription: "The oldest surviving Mughal garden in India built by first emperor Babur in 1528, using three stepped water terraces fed by the Yamuna.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "aram-bagh",
      "aram-bagh-babur-1528-charbagh-garden",
      "babur-1528-charbagh-garden",
      "ram-bagh-gardens"
    ]
  },
  "agra:dasaprakash-heritage-south-indian-dining": {
    imageUrl: "/images/places/agra/dasaprakash-agra-cantt.webp",
    visualDescription: "A historic cantonment restaurant operating since the 1950s famous for crisp ghee roast dosas, idlis, and signature fresh ice cream sundaes.",
    category: "Local Food & Street Eats",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dasaprakash-agra-cantt",
      "dasaprakash-cantt",
      "dasaprakash-heritage-south-indian-dining"
    ]
  },
  "agra:korai-tribal-craft-village-en-route-fatehpur": {
    imageUrl: "/images/places/agra/korai-rural-village.webp",
    visualDescription: "A rural settlement of the Qalandar community showcasing traditional mud huts, folk songs, and rustic craft life away from the highway.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "korai-rural-village",
      "korai-tribal-craft-village-en-route-fatehpur"
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
      "city-palace-alwar",
      "city-palace-alwar-siliserh",
      "city-palace-of-alwar",
      "city-palace-of-alwar-siliserh",
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
  "alwar-siliserh:sagar-water-kund-and-royal-bathing-stepped-ghats": {
    imageUrl: "/images/places/alwar-siliserh/sagar-water-reservoir.webp",
    visualDescription: "An 1813 sacred step-reservoir behind the City Palace enclosed by twelve arched chhatris reflecting in emerald water beneath Bala Quila.",
    category: "Nature & Viewpoints",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "royal-bathing-stepped-ghats",
      "sagar-water-kund",
      "sagar-water-kund-and-royal-bathing-stepped-ghats",
      "sagar-water-reservoir"
    ]
  },
  "alwar-siliserh:purjan-vihar-company-garden-british-oasis": {
    imageUrl: "/images/places/alwar-siliserh/hero.webp",
    visualDescription: "A historic garden laid out in 1868 by Maharaja Sheodan Singh with lush fern houses, grand fountains, and a unique summer cooling palace (Shimla).",
    category: "Nature & Viewpoints",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "company-garden-british-oasis",
      "purjan-vihar",
      "purjan-vihar-company-garden-british-oasis"
    ]
  },
  "alwar-siliserh:tijara-atishaya-kshetra-jain-tirtha": {
    imageUrl: "/images/places/alwar-siliserh/tijara-jain-temple.webp",
    visualDescription: "A revered Jain pilgrimage shrine established in 1956 following the miraculous subterranean discovery of the idol of Bhagwan Chandraprabhu.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "tijara-atishaya-kshetra-jain-tirtha",
      "tijara-jain-temple"
    ]
  },
  "alwar-siliserh:talvriksha-sacred-springs-and-mandavya-hermitage": {
    imageUrl: "/images/places/alwar-siliserh/talvriksha-hot-springs.webp",
    visualDescription: "A scenic pilgrimage spot nestled between rocky hills where hot and cold natural sulphur water springs flow side-by-side under ancient palm trees.",
    category: "Nature & Viewpoints",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mandavya-hermitage",
      "talvriksha-hot-springs",
      "talvriksha-sacred-springs",
      "talvriksha-sacred-springs-and-mandavya-hermitage"
    ]
  },
  "alwar-siliserh:vijay-mandir-palace-and-sita-ram-temple": {
    imageUrl: "/images/places/alwar-siliserh/vijay-mandir-palace.webp",
    visualDescription: "A sprawling 105-room royal palace built in 1918 by Maharaja Jai Singh designed in the silhouette of a grand ship overlooking a scenic lake reservoir.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sita-ram-temple",
      "vijay-mandir-palace",
      "vijay-mandir-palace-and-sita-ram-temple"
    ]
  },
  "alwar-siliserh:neelkanth-mahadev-ancient-hilltop-sanctuary": {
    imageUrl: "/images/places/alwar-siliserh/neelkanth-mahadev-alwar.webp",
    visualDescription: "An ancient stone temple located high in the Rajgarh hill range boasting ornate pillars, carved apsaras, and natural mountain breezes.",
    category: "Culture & Heritage",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "neelkanth-mahadev-alwar",
      "neelkanth-mahadev-ancient-hilltop-sanctuary"
    ]
  },
  "alwar-siliserh:hope-circus-heritage-market-and-clock-tower": {
    imageUrl: "/images/places/alwar-siliserh/hope-circus-bazaar.webp",
    visualDescription: "The historic circular roundabout pavilion built in 1937 to commemorate Lady Hope, surrounded by traditional bangle makers, silversmiths, and sweet ...",
    category: "Local Food & Street Eats",
    semanticTheme: "shopping",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "clock-tower",
      "hope-circus-bazaar",
      "hope-circus-heritage-market",
      "hope-circus-heritage-market-and-clock-tower"
    ]
  },
  "alwar-siliserh:kalakand-gali-mawa-artisans-street": {
    imageUrl: "/images/places/alwar-siliserh/kalakand-gali-food.webp",
    visualDescription: "A narrow alley near Sarafa Bazaar lined with copper pans bubbling with fresh buffalo milk being turned into Alwar’s world-renowned fudge.",
    category: "Local Food & Street Eats",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kalakand-gali",
      "kalakand-gali-food",
      "kalakand-gali-mawa-artisans-street",
      "mawa-artisans-street"
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
  "chandigarh:japanese-garden-sector-31-zen-sanctuary": {
    imageUrl: "/images/places/chandigarh/japanese-garden-sec31.webp",
    visualDescription: "A 13-acre themed Japanese garden featuring traditional pagodas, Zen rock gardens, koi ponds, a meditation hut, and an illuminated underground tunnel.",
    category: "Nature & Viewpoints",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "japanese-garden-sec31",
      "japanese-garden-sector-31-zen-sanctuary"
    ]
  },
  "chandigarh:terraced-garden-and-musical-water-cascade": {
    imageUrl: "/images/places/chandigarh/terraced-garden-sec33.webp",
    visualDescription: "A 10-acre landscaped park in Sector 33 famous for illuminated musical fountains, annual chrysanthemum shows, and stepped flower terraces.",
    category: "Nature & Viewpoints",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "musical-water-cascade",
      "terraced-garden",
      "terraced-garden-and-musical-water-cascade",
      "terraced-garden-sec33"
    ]
  },
  "chandigarh:government-museum-and-art-gallery-sector-10": {
    imageUrl: "/images/places/chandigarh/government-museum-sec10.webp",
    visualDescription: "Designed by Le Corbusier, housing an exceptional collection of ancient Gandhara sculptures, Pahari miniature paintings, and modern Indian art.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "art-gallery-sector-10",
      "government-museum",
      "government-museum-and-art-gallery-sector-10",
      "government-museum-sec10"
    ]
  },
  "chandigarh:national-cactus-and-succulent-botanical-garden": {
    imageUrl: "/images/places/chandigarh/cactus-garden-panchkula.webp",
    visualDescription: "A 7-acre botanical conservatory holding over 3,500 species of rare, endangered desert cacti and succulents from across four continents.",
    category: "Nature & Viewpoints",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "cactus-garden-panchkula",
      "national-cactus-and-succulent-botanical-garden"
    ]
  },
  "chandigarh:open-hand-monument-symbol-of-peace-and-giving": {
    imageUrl: "/images/places/chandigarh/open-hand-monument.webp",
    visualDescription: "A 28-meter tall rotating metal hand sculpture designed by Le Corbusier as the official symbol of Chandigarh: open to give and open to receive.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "giving",
      "open-hand-monument",
      "open-hand-monument-symbol-of-peace-and-giving",
      "symbol-of-peace"
    ]
  },
  "chandigarh:yadavindra-gardens-pinjore-17th-century-mughal-terraces": {
    imageUrl: "/images/places/chandigarh/pinjore-yadavindra-gardens.webp",
    visualDescription: "A 100-acre 17th-century stepped terraced Mughal garden with central water canals, illuminated fountains, and Sheesh Mahal water pavilions.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "17th-century-mughal-terraces",
      "pinjore-yadavindra-gardens",
      "yadavindra-gardens-pinjore",
      "yadavindra-gardens-pinjore-17th-century-mughal-terraces"
    ]
  },
  "chandigarh:sindhi-sweets-sector-17-chole-bhature-hub": {
    imageUrl: "/images/places/chandigarh/sindhi-sweets-sec17.webp",
    visualDescription: "An iconic Chandigarh culinary institution operating since 1976 famed for puffed bhatures, pindi chole, and fresh rasmalai in rose syrup.",
    category: "Local Food & Street Eats",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sindhi-sweets-sec17",
      "sindhi-sweets-sector-17-chole-bhature-hub"
    ]
  },
  "chandigarh:timber-trail-mountain-cable-car-shivalik-gorge": {
    imageUrl: "/images/places/chandigarh/timber-trail-ropeway-base.webp",
    visualDescription: "A thrilling 1.8 km cable car ropeway soaring 1,500 feet across a dramatic Shivalik mountain canyon connecting two mountain peaks.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "shivalik-gorge",
      "timber-trail-mountain-cable-car",
      "timber-trail-mountain-cable-car-shivalik-gorge",
      "timber-trail-ropeway-base"
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
  "damdama-sohna:camp-mustang-aravalli-obstacle-base": {
    imageUrl: "/images/places/damdama-sohna/camp-mustang-adventure.webp",
    visualDescription: "An outdoor adventure enclave set in the Aravalli valleys offering rock climbing, commando nets, obstacle trails, and night star-gazing.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "camp-mustang-adventure",
      "camp-mustang-aravalli-obstacle-base"
    ]
  },
  "damdama-sohna:badkhal-aravalli-ridge-mountain-drive": {
    imageUrl: "/images/places/damdama-sohna/badkhal-ridge-lake-drive.webp",
    visualDescription: "A winding, elevated country drive along the rocky spine of the Aravallis passing rustic stone quarry pools and acacia scrub ridges.",
    category: "Nature & Viewpoints",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "badkhal-aravalli-ridge-mountain-drive",
      "badkhal-ridge-lake-drive"
    ]
  },
  "damdama-sohna:lost-lake-hidden-aravalli-water-reservoir": {
    imageUrl: "/images/places/damdama-sohna/lost-lake-damdama-trail.webp",
    visualDescription: "A secluded blue-water stone quarry lake tucked behind the ridge, reached via a 3 km scrubland trek popular with adventure hikers.",
    category: "Adventure & Treks",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "hidden-aravalli-water-reservoir",
      "lost-lake",
      "lost-lake-damdama-trail",
      "lost-lake-hidden-aravalli-water-reservoir"
    ]
  },
  "damdama-sohna:bhondsi-nature-park-and-bhuvneshwari-devi-grove": {
    imageUrl: "/images/places/damdama-sohna/bhondsi-eco-park.webp",
    visualDescription: "A 450-acre protected ecological park on the Aravalli range featuring herbal trails, bird hides, natural lakes, and serene meditation rocks.",
    category: "Nature & Viewpoints",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bhondsi-eco-park",
      "bhondsi-nature-park",
      "bhondsi-nature-park-and-bhuvneshwari-devi-grove",
      "bhuvneshwari-devi-grove"
    ]
  },
  "damdama-sohna:aravalli-hills-footprint-and-golf-glades": {
    imageUrl: "/images/places/damdama-sohna/aravalli-golf-greens.webp",
    visualDescription: "Expansive undulating green fairways framed by the jagged rocky slopes of the Aravallis, offering morning fresh air walks.",
    category: "Nature & Viewpoints",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "aravalli-golf-greens",
      "aravalli-hills-footprint",
      "aravalli-hills-footprint-and-golf-glades",
      "golf-glades"
    ]
  },
  "damdama-sohna:historic-sohna-vintage-car-circuit-trail": {
    imageUrl: "/images/places/damdama-sohna/sohna-car-rally-trail.webp",
    visualDescription: "The legendary trail of the annual Vintage Car Rally that has traversed these hill roads since 1964, terminating at the hot springs plateau.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "historic-sohna-vintage-car-circuit-trail",
      "sohna-car-rally-trail"
    ]
  },
  "damdama-sohna:mangar-bani-sacred-forest-and-wildlife-corridor": {
    imageUrl: "/images/places/damdama-sohna/leopold-aravalli-sanctuary.webp",
    visualDescription: "A virgin sacred grove protected for centuries by local Gujjar clans, representing the last surviving patch of original primary Aravalli forest.",
    category: "Nature & Viewpoints",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "leopold-aravalli-sanctuary",
      "mangar-bani-sacred-forest",
      "mangar-bani-sacred-forest-and-wildlife-corridor",
      "wildlife-corridor"
    ]
  },
  "damdama-sohna:tau-devi-lal-botanical-park-and-butterfly-garden": {
    imageUrl: "/images/places/damdama-sohna/tau-devi-lal-bio-park.webp",
    visualDescription: "A 22-acre botanical sanctuary featuring blooming medicinal herb collections, jogging tracks, and specialized butterfly habitats.",
    category: "Nature & Viewpoints",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "butterfly-garden",
      "tau-devi-lal-bio-park",
      "tau-devi-lal-botanical-park",
      "tau-devi-lal-botanical-park-and-butterfly-garden"
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
  "dehradun:paltan-bazaar-and-1953-ghanta-ghar-clock-tower": {
    imageUrl: "/images/places/dehradun/hero.webp",
    visualDescription: "The historic hex-faced stone clock tower and pedestrian bazaar famous for Basmati rice stalls, pahadi spices, woolen shawls, and street food.",
    category: "Local Food & Street Eats",
    semanticTheme: "shopping",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "1953-ghanta-ghar-clock-tower",
      "paltan-bazaar",
      "paltan-bazaar-and-1953-ghanta-ghar-clock-tower"
    ]
  },
  "dehradun:khalanga-war-memorial-british-tribute-to-gurkha-bravery": {
    imageUrl: "/images/places/dehradun/khalanga-war-memorial.webp",
    visualDescription: "The unique 1814 war memorial erected by the British East India Company to honour their enemy Balbhadra Thapa and his brave Gurkha defenders.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "british-tribute-to-gurkha-bravery",
      "khalanga-war-memorial",
      "khalanga-war-memorial-british-tribute-to-gurkha-bravery"
    ]
  },
  "dehradun:shikhar-fall-woodland-cascade-and-stream": {
    imageUrl: "/images/places/dehradun/shikhar-fall-trail.webp",
    visualDescription: "A secluded natural waterfall hidden in the hills near Kairwaan village reached by a rocky stream bed walk through dense oak and ferns.",
    category: "Nature & Viewpoints",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "shikhar-fall-trail",
      "shikhar-fall-woodland-cascade",
      "shikhar-fall-woodland-cascade-and-stream",
      "stream"
    ]
  },
  "dehradun:lachhiwala-nature-park-and-stream-pools": {
    imageUrl: "/images/places/dehradun/lachhiwala-nature-park.webp",
    visualDescription: "A forest reserve on the banks of the Song River featuring natural stream-fed swimming pools shaded by magnificent virgin sal tree forests.",
    category: "Nature & Viewpoints",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "lachhiwala-nature-park",
      "lachhiwala-nature-park-and-stream-pools",
      "stream-pools"
    ]
  },
  "dehradun:maldevta-pebble-riverbed-and-camping-meadows": {
    imageUrl: "/images/places/dehradun/maldevta-riverside-meadows.webp",
    visualDescription: "A picturesque mountain river valley flanked by limestone cliffs and rolling fields, ideal for river wading, birding, and paragliding flights.",
    category: "Nature & Viewpoints",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "camping-meadows",
      "maldevta-pebble-riverbed",
      "maldevta-pebble-riverbed-and-camping-meadows",
      "maldevta-riverside-meadows"
    ]
  },
  "dehradun:kumar-sweets-and-confectioners-kumaoni-bal-mithai": {
    imageUrl: "/images/places/dehradun/kumar-sweets-legend.webp",
    visualDescription: "Dehradun’s celebrated heritage sweet maker since 1950 famous for brown roasted mawa bal mithai coated with sugar balls, singori, and rasgullas.",
    category: "Local Food & Street Eats",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "confectioners",
      "kumaoni-bal-mithai",
      "kumar-sweets",
      "kumar-sweets-and-confectioners-kumaoni-bal-mithai",
      "kumar-sweets-legend"
    ]
  },
  "dehradun:kalsi-ashokan-rock-edict-3rd-century-bce": {
    imageUrl: "/images/places/dehradun/kalsi-ashoka-rock-edict.webp",
    visualDescription: "A monumental quartz rock inscribed in Brahmi script in Prakrit by Emperor Ashoka in 250 BCE outlining his edicts of non-violence and ethical conduct.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "3rd-century-bce",
      "kalsi-ashoka-rock-edict",
      "kalsi-ashokan-rock-edict",
      "kalsi-ashokan-rock-edict-3rd-century-bce"
    ]
  },
  "dehradun:asan-barrage-bird-sanctuary-and-wetland-reserve": {
    imageUrl: "/images/places/dehradun/asani-barrage-wetland.webp",
    visualDescription: "A scenic reservoir at the confluence of the Asan and Yamuna rivers, hosting over 53 species of migratory waterfowl including Brahminy ducks and poc...",
    category: "Nature & Viewpoints",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "asan-barrage-bird-sanctuary",
      "asan-barrage-bird-sanctuary-and-wetland-reserve",
      "asani-barrage-wetland",
      "wetland-reserve"
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
  "dharamshala:kangra-fort-ancient-4th-century-bce-citadel": {
    imageUrl: "/images/places/dharamshala/kangra-fort.webp",
    visualDescription: "The oldest surviving fort in the Himalayas built by the Katoch dynasty, featuring massive multi-tiered stone gateways, Jain shrines, and river gorg...",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "ancient-4th-century-bce-citadel",
      "kangra-fort",
      "kangra-fort-ancient-4th-century-bce-citadel"
    ]
  },
  "dharamshala:gyuto-monastery-tantric-chanting-and-karmapa-seat": {
    imageUrl: "/images/places/dharamshala/gyuto-monastery.webp",
    visualDescription: "A renowned Tibetan monastery specializing in Tantric Buddhist meditation and deep throat-singing choral chanting, backed by the snowy Dhauladhar cr...",
    category: "Culture & Heritage",
    semanticTheme: "monastery",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "gyuto-monastery",
      "gyuto-monastery-tantric-chanting-and-karmapa-seat",
      "karmapa-seat",
      "tantric-chanting"
    ]
  },
  "dharamshala:dal-lake-dharamshala-and-sacred-deodar-groves": {
    imageUrl: "/images/places/dharamshala/dal-lake-dharamshala.webp",
    visualDescription: "A sacred small high-altitude lake ringed by ancient Himalayan deodar trees, revered for an annual September fair dedicated to Lord Shiva.",
    category: "Nature & Viewpoints",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dal-lake",
      "dal-lake-dharamshala",
      "dal-lake-dharamshala-and-sacred-deodar-groves",
      "sacred-deodar-groves"
    ]
  },
  "dharamshala:tibetan-butter-tea-and-tingmo-bakery-lane": {
    imageUrl: "/images/places/dharamshala/tibetan-butter-tea.webp",
    visualDescription: "A charming row of traditional morning Tibetan kitchens near the monastery preparing warm salted po cha (yak butter tea), steamed tingmo bread, and ...",
    category: "Local Food & Street Eats",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "tibetan-butter-tea",
      "tibetan-butter-tea-and-tingmo-bakery-lane",
      "tingmo-bakery-lane"
    ]
  },
  "dharamshala:masroor-monolithic-rock-cut-temples-8th-century": {
    imageUrl: "/images/places/dharamshala/masroor-rock-temples.webp",
    visualDescription: "The Himalayan Ellora: a complex of 15 monolithic rock-hewn temples carved out of a single sandstone outcrop with reflecting water pools.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "8th-century",
      "masroor-monolithic-rock-cut-temples",
      "masroor-monolithic-rock-cut-temples-8th-century",
      "masroor-rock-temples"
    ]
  },
  "dharamshala:tashi-jong-buddhist-craft-community-and-stupas": {
    imageUrl: "/images/places/dharamshala/tashi-jong-monastery.webp",
    visualDescription: "A peaceful Tibetan refugee settlement and Drukpa Kagyu monastery renowned for intricate carpet weaving, woodblock printing, and sacred cham dances.",
    category: "Culture & Heritage",
    semanticTheme: "monastery",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "stupas",
      "tashi-jong-buddhist-craft-community",
      "tashi-jong-buddhist-craft-community-and-stupas",
      "tashi-jong-monastery"
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
  "goa:basilica-of-bom-jesus-unesco-world-heritage": {
    imageUrl: "/images/places/goa/basilica-bom-jesus.webp",
    visualDescription: "Consecrated in 1605, this masterpiece of Baroque architecture holds the mortal remains of St. Francis Xavier inside a silver casket atop an ornate ...",
    category: "Culture & Heritage",
    semanticTheme: "church",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "basilica-bom-jesus",
      "basilica-of-bom-jesus",
      "basilica-of-bom-jesus-unesco-world-heritage",
      "unesco-world-heritage"
    ]
  },
  "goa:arambol-sweet-water-lagoon-and-banyan-tree-trail": {
    imageUrl: "/images/places/goa/arambol-sweet-lake.webp",
    visualDescription: "A fresh spring-water lagoon tucked just meters from the crashing waves of Kalacha Beach, fed by natural mountain streams with gentle jungle walking...",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "arambol-sweet-lake",
      "arambol-sweet-water-lagoon",
      "arambol-sweet-water-lagoon-and-banyan-tree-trail",
      "banyan-tree-trail"
    ]
  },
  "goa:reis-magos-fort-and-mandovi-estuary": {
    imageUrl: "/images/places/goa/reis-magos-fort.webp",
    visualDescription: "Restored 1551 CE Portuguese bastion perched atop the Mandovi river mouth offering panoramic views of Panaji and the Arabian Sea.preserved from mode...",
    category: "Hidden Gems",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mandovi-estuary",
      "reis-magos-fort",
      "reis-magos-fort-and-mandovi-estuary"
    ]
  },
  "goa:palolem-crescent-beach-and-butterfly-island": {
    imageUrl: "/images/places/goa/palolem-beach.webp",
    visualDescription: "A tranquil 1.6 km semi-circular crescent bay lined with coconut palms and gentle shallow waters, with wooden boats taking travelers to secluded But...",
    category: "Must Visit",
    semanticTheme: "beach",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "butterfly-island",
      "palolem-beach",
      "palolem-crescent-beach",
      "palolem-crescent-beach-and-butterfly-island"
    ]
  },
  "goa:baba-au-rhum-french-bamboo-garden": {
    imageUrl: "/images/places/goa/baba-au-rhum-cafe.webp",
    visualDescription: "Open-air bamboo dining terrace nestled in Anjuna paddies, celebrated for wood-fired artisan sourdough pizzas and espresso.serves Mediterranean tahi...",
    category: "Cafés & Bakery",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "baba-au-rhum-cafe",
      "baba-au-rhum-french-bamboo-garden"
    ]
  },
  "goa:gunpowder-assagao-heritage-peninsular-dining": {
    imageUrl: "/images/places/goa/gunpowder-assagao.webp",
    visualDescription: "Restored Portuguese heritage courtyard in Assagao serving authentic peninsular and coastal specialties.among locals for authentic Goan fish thalis,...",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "gunpowder-assagao",
      "gunpowder-assagao-heritage-peninsular-dining"
    ]
  },
  "goa:fort-aguada-and-1864-portuguese-lighthouse": {
    imageUrl: "/images/places/goa/aguada-fort.webp",
    visualDescription: "A 17th-century Portuguese fortress commanding the mouth of the Mandovi River, housing a 4-tiered freshwater cistern and ancient oil lighthouse.",
    category: "Must Visit",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "1864-portuguese-lighthouse",
      "aguada-fort",
      "fort-aguada",
      "fort-aguada-and-1864-portuguese-lighthouse"
    ]
  },
  "goa:anjuna-rocky-beach-cove-and-curlies-point": {
    imageUrl: "/images/places/goa/anjuna-beach-cove.webp",
    visualDescription: "A dramatic red-laterite rocky cove fringed by coconut palms, renowned since the 1960s for bohemian sunset gatherings and psychedelic trance heritage.",
    category: "Nature & Viewpoints",
    semanticTheme: "beach",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "anjuna-beach-cove",
      "anjuna-rocky-beach-cove",
      "anjuna-rocky-beach-cove-and-curlies-point",
      "curlies-point"
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
  "jaipur:jantar-mantar-unesco-astronomical-observatory": {
    imageUrl: "/images/places/jaipur/jantar-mantar.webp",
    visualDescription: "Completed in 1734 by Maharaja Sawai Jai Singh II, this UNESCO World Heritage site features nineteen architectural astronomical instruments, includi...",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jantar-mantar",
      "jantar-mantar-unesco-astronomical-observatory"
    ]
  },
  "jaipur:jaigarh-fort-and-jaivana-royal-cannon": {
    imageUrl: "/images/places/jaipur/jaigarh-fort.webp",
    visualDescription: "Built in 1726 by Jai Singh II to protect the Amber Fort complex, this rugged military fortress houses 'Jaivana', once the world's largest cannon on...",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jaigarh-fort",
      "jaigarh-fort-and-jaivana-royal-cannon",
      "jaivana-royal-cannon"
    ]
  },
  "jaipur:jal-mahal-the-floating-water-palace": {
    imageUrl: "/images/places/jaipur/jal-mahal.webp",
    visualDescription: "A stunning 18th-century Rajput-style palace made of red sandstone, floating in the center of Man Sagar Lake with four submerged lower levels and a ...",
    category: "Must Visit",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jal-mahal",
      "jal-mahal-the-floating-water-palace",
      "the-floating-water-palace"
    ]
  },
  "jaipur:galta-ji-the-sacred-monkey-temple-and-kunds": {
    imageUrl: "/images/places/jaipur/galta-ji-temple.webp",
    visualDescription: "An ancient prehistoric Hindu pilgrimage complex tucked inside a narrow mountain gorge, featuring natural freshwater springs feeding seven sacred st...",
    category: "Hidden Gems",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "galta-ji",
      "galta-ji-temple",
      "galta-ji-the-sacred-monkey-temple-and-kunds",
      "kunds",
      "the-sacred-monkey-temple"
    ]
  },
  "jaipur:albert-hall-state-museum-indo-saracenic": {
    imageUrl: "/images/places/jaipur/albert-hall-museum.webp",
    visualDescription: "The oldest museum in Rajasthan, housed in a breathtaking Indo-Saracenic building designed by Sir Samuel Swinton Jacob, exhibiting rare miniature pa...",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "albert-hall-museum",
      "albert-hall-state-museum",
      "albert-hall-state-museum-indo-saracenic",
      "indo-saracenic"
    ]
  },
  "jaipur:patrika-gate-and-jawahar-circle-garden": {
    imageUrl: "/images/places/jaipur/patrika-gate.webp",
    visualDescription: "A magnificent hand-painted monumental gateway celebrating the art, architectural history, and culture of every region of Rajasthan through vibrant ...",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jawahar-circle-garden",
      "patrika-gate",
      "patrika-gate-and-jawahar-circle-garden"
    ]
  },
  "jaipur:rawat-mishthan-bhandar-original-pyaaz-kachori": {
    imageUrl: "/images/places/jaipur/rawat-mishthan-bhandar.webp",
    visualDescription: "The undisputed home of Rajasthan's most famous Pyaaz Kachori (spiced onion pastry), fried crisp and served with sweet tamarind and spicy mint chutn...",
    category: "Local Food",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "original-pyaaz-kachori",
      "rawat-mishthan-bhandar",
      "rawat-mishthan-bhandar-original-pyaaz-kachori"
    ]
  },
  "jaipur:wind-view-cafe-hawa-mahal-eye-level-terrace": {
    imageUrl: "/images/places/jaipur/wind-view-cafe.webp",
    visualDescription: "A rooftop terrace cafe directly facing the intricate pink sandstone facade of Hawa Mahal, offering eye-level views of the 953 jharokha honeycomb wi...",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "hawa-mahal-eye-level-terrace",
      "wind-view-cafe",
      "wind-view-cafe-hawa-mahal-eye-level-terrace"
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
  "jaisalmer:bada-bagh-royal-cenotaphs-and-desert-windmills": {
    imageUrl: "/images/places/jaisalmer/bada-bagh-chhatris.webp",
    visualDescription: "A striking desert ridge populated by carved golden sandstone cenotaphs of the Maharawals of Jaisalmer, framed against modern wind turbines.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bada-bagh",
      "bada-bagh-chhatris",
      "bada-bagh-royal-cenotaphs-and-desert-windmills",
      "desert-windmills",
      "royal-cenotaphs"
    ]
  },
  "jaisalmer:khuri-village-quiet-sand-dunes-and-mud-homestays": {
    imageUrl: "/images/places/jaisalmer/khuri-desert-sand-dunes.webp",
    visualDescription: "A peaceful desert village 45 km south of Jaisalmer with pristine sand dunes untouched by commercial noise, mud huts, and traditional folk campfires.",
    category: "Nature & Viewpoints",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "khuri-desert-sand-dunes",
      "khuri-village",
      "khuri-village-quiet-sand-dunes-and-mud-homestays",
      "mud-homestays",
      "quiet-sand-dunes"
    ]
  },
  "jaisalmer:tanot-mata-temple-the-miraculous-indo-pak-border-shrine": {
    imageUrl: "/images/places/jaisalmer/tanot-mata-temple.webp",
    visualDescription: "A sacred desert temple 120 km northwest of Jaisalmer near the Pakistan border, celebrated for surviving hundreds of unexploded enemy bombs in 1965.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "tanot-mata-temple",
      "tanot-mata-temple-the-miraculous-indo-pak-border-shrine",
      "the-miraculous-indo-pak-border-shrine"
    ]
  },
  "jaisalmer:desert-national-park-great-indian-bustard-safari": {
    imageUrl: "/images/places/jaisalmer/desert-national-park-safari.webp",
    visualDescription: "A 3,162 sq km fragile desert ecosystem sanctuary conserving the critically endangered Great Indian Bustard, desert foxes, and chinkara gazelles.",
    category: "Nature & Viewpoints",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "desert-national-park",
      "desert-national-park-great-indian-bustard-safari",
      "desert-national-park-safari",
      "great-indian-bustard-safari"
    ]
  },
  "jaisalmer:lodurva-ancient-capital-and-kalpavriksha-wish-tree": {
    imageUrl: "/images/places/jaisalmer/lodurva-jain-temple.webp",
    visualDescription: "The 10th-century medieval capital of the Bhati Rajputs featuring yellow sandstone temples, ornate Torana arches, and a copper wish-fulfilling tree.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kalpavriksha-wish-tree",
      "lodurva-ancient-capital",
      "lodurva-ancient-capital-and-kalpavriksha-wish-tree",
      "lodurva-jain-temple"
    ]
  },
  "jaisalmer:vyas-chhatri-sage-vyas-sandstone-cenotaph": {
    imageUrl: "/images/places/jaisalmer/vyas-chhatri-sunset-point.webp",
    visualDescription: "A cluster of golden sandstone cenotaphs dedicated to Sage Vyas (author of the Mahabharata) situated atop a hillock catching sunset over the fort.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sage-vyas-sandstone-cenotaph",
      "vyas-chhatri",
      "vyas-chhatri-sage-vyas-sandstone-cenotaph",
      "vyas-chhatri-sunset-point"
    ]
  },
  "jaisalmer:surya-kishore-authentic-dal-baati-churma": {
    imageUrl: "/images/places/jaisalmer/surya-kishore-rooftop.webp",
    visualDescription: "A family-run heritage rooftop within the fort ramparts serving wood-fired baatis crushed in pure desi ghee, panchkuta, and ker sangri.",
    category: "Local Food & Street Eats",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "surya-kishore-authentic-dal-baati-churma",
      "surya-kishore-rooftop"
    ]
  },
  "jaisalmer:desert-cultural-centre-and-folk-puppetry-museum": {
    imageUrl: "/images/places/jaisalmer/desert-cultural-centre-museum.webp",
    visualDescription: "A treasure trove of Thar desert heritage housing ancient textiles, folk musical instruments, coins, and live evening Rajasthani puppet shows.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "desert-cultural-centre",
      "desert-cultural-centre-and-folk-puppetry-museum",
      "desert-cultural-centre-museum",
      "folk-puppetry-museum"
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
  "kainchi-dham:pangot-oak-forest-and-himalayan-birding-sanctuary": {
    imageUrl: "/images/places/kainchi-dham/pangot-birding-sanctuary.webp",
    visualDescription: "A tranquil mountain village enveloped by dense ban-oak and rhododendron forests, globally renowned for sightings of cheer pheasants and minivets.",
    category: "Nature & Viewpoints",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "himalayan-birding-sanctuary",
      "pangot-birding-sanctuary",
      "pangot-oak-forest",
      "pangot-oak-forest-and-himalayan-birding-sanctuary"
    ]
  },
  "kainchi-dham:mukteshwar-dham-350-year-hilltop-shiva-temple": {
    imageUrl: "/images/places/kainchi-dham/mukteshwar-dham-shiva-temple.webp",
    visualDescription: "A 350-year-old stone temple perched at 2,286m on the highest ridge in Kumaon, offering a sweeping 180-degree view of Trishul and Nanda Devi.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mukteshwar-dham-350-year-hilltop-shiva-temple",
      "mukteshwar-dham-shiva-temple"
    ]
  },
  "kainchi-dham:chauli-ki-jali-vertical-mountain-ridge-and-sunset-crag": {
    imageUrl: "/images/places/kainchi-dham/chauli-ki-jali-cliffs.webp",
    visualDescription: "A dramatic vertical rocky cliff behind Mukteshwar temple overlooking the valleys of Kumaon, renowned for rock climbing, zipline, and sunsets.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chauli-ki-jali",
      "chauli-ki-jali-cliffs",
      "chauli-ki-jali-vertical-mountain-ridge-and-sunset-crag",
      "sunset-crag",
      "vertical-mountain-ridge"
    ]
  },
  "kainchi-dham:hidimba-parvat-pine-forest-trail": {
    imageUrl: "/images/places/kainchi-dham/hidimba-parvat-trek.webp",
    visualDescription: "A gentle forested hike leading up to a serene monk hermitage through fragrant Himalayan pine woods, offering aerial views of Sattal lakes.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "hidimba-parvat-pine-forest-trail",
      "hidimba-parvat-trek"
    ]
  },
  "kainchi-dham:chaubatia-apple-and-apricot-research-orchards": {
    imageUrl: "/images/places/kainchi-dham/ranikhet-chaubatia-orchards.webp",
    visualDescription: "A 265-acre sprawling government horticultural research garden cultivating over 30 varieties of apples, plums, and walnuts with views of Nanda Devi.",
    category: "Nature & Viewpoints",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "apricot-research-orchards",
      "chaubatia-apple",
      "chaubatia-apple-and-apricot-research-orchards",
      "ranikhet-chaubatia-orchards"
    ]
  },
  "kainchi-dham:karkotak-nag-mandir-hilltop-crest": {
    imageUrl: "/images/places/kainchi-dham/karkotak-nag-mandir.webp",
    visualDescription: "An ancient snake deity shrine situated atop Karkotak hill, offering an aerial 360-degree bird’s-eye perspective over Bhimtal lake and surrounding r...",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "karkotak-nag-mandir",
      "karkotak-nag-mandir-hilltop-crest"
    ]
  },
  "kainchi-dham:kamal-tal-the-secluded-lotus-lake-of-naukuchiatal": {
    imageUrl: "/images/places/kainchi-dham/kamal-tal-lotus-lake.webp",
    visualDescription: "A tranquil freshwater cove adjoined to Naukuchiatal that bursts into thousands of vibrant pink water lilies and lotus blooms during warmer months.",
    category: "Nature & Viewpoints",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kamal-tal",
      "kamal-tal-lotus-lake",
      "kamal-tal-the-secluded-lotus-lake-of-naukuchiatal",
      "the-secluded-lotus-lake-of-naukuchiatal"
    ]
  },
  "kainchi-dham:kumaoni-heritage-tea-room-and-mountain-jams": {
    imageUrl: "/images/places/kainchi-dham/kumaoni-heritage-cafe-bhowali.webp",
    visualDescription: "A rustic wooden tea room on the Kainchi highway serving organic ginger green tea, apricot preserves, mountain honey pancakes, and bal mithai.",
    category: "Cafés & Bakery",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kumaoni-heritage-cafe-bhowali",
      "kumaoni-heritage-tea-room",
      "kumaoni-heritage-tea-room-and-mountain-jams",
      "mountain-jams"
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
  "kasol:kheerganga-natural-sulphur-pool-and-meadow": {
    imageUrl: "/images/places/kasol/kheerganga-trail.webp",
    visualDescription: "A high alpine clearing at 2,960m at the end of a 12 km trek through Parvati valley, famous for natural hot thermal baths overlooking snow ridges.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kheerganga-natural-sulphur-pool",
      "kheerganga-natural-sulphur-pool-and-meadow",
      "kheerganga-trail",
      "meadow"
    ]
  },
  "kasol:pulga-fairy-forest-ancient-deodar-enclave": {
    imageUrl: "/images/places/kasol/pulga-fairy-forest.webp",
    visualDescription: "An ancient moss-covered deodar forest behind the traditional wooden village of Pulga, filled with fallen tree bridges, wild mushrooms, and wooden h...",
    category: "Nature & Viewpoints",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "ancient-deodar-enclave",
      "pulga-fairy-forest",
      "pulga-fairy-forest-ancient-deodar-enclave"
    ]
  },
  "kasol:kalga-village-and-terraced-apple-orchards": {
    imageUrl: "/images/places/kasol/kalga-village.webp",
    visualDescription: "A vehicle-free mountain settlement situated on a sunny plateau surrounded by apple orchards, rustic wooden chalets, and views of Tosh river.",
    category: "Nature & Viewpoints",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kalga-village",
      "kalga-village-and-terraced-apple-orchards",
      "terraced-apple-orchards"
    ]
  },
  "kasol:tulga-rustic-wooden-hamlet": {
    imageUrl: "/images/places/kasol/tulga-hamlet.webp",
    visualDescription: "The quietest of the trio of villages (Kalga, Pulga, Tulga) preserving classical Kathkuni dry-stone and timber architecture and slow pastoral life.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "tulga-hamlet",
      "tulga-rustic-wooden-hamlet"
    ]
  },
  "kasol:rasol-high-alpine-village-trail-2-600m": {
    imageUrl: "/images/places/kasol/rasol-trail.webp",
    visualDescription: "A steep 4-hour mountain trek from Chalal winding up 1,000 vertical meters through pine woods to an ancient isolated wooden village.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "600m",
      "rasol-high-alpine-village-trail",
      "rasol-high-alpine-village-trail-2-600m",
      "rasol-trail"
    ]
  },
  "kasol:chojh-riverside-pebble-beach-and-suspension-bridge": {
    imageUrl: "/images/places/kasol/chojh-bridge.webp",
    visualDescription: "A hidden village just across the Parvati River from Kasol accessed by a swaying iron suspension bridge, with sandy river banks and quiet cafes.",
    category: "Nature & Viewpoints",
    semanticTheme: "beach",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chojh-bridge",
      "chojh-riverside-pebble-beach",
      "chojh-riverside-pebble-beach-and-suspension-bridge",
      "suspension-bridge"
    ]
  },
  "kasol:jim-morrison-wooden-terrace-and-shakshuka-cafe": {
    imageUrl: "/images/places/kasol/jim-morrison-cafe.webp",
    visualDescription: "A legendary hilltop wooden cafe in Kasol requiring a short forest climb, known for floor seating, rock vinyl playlists, and Middle Eastern platters.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "jim-morrison-cafe",
      "jim-morrison-wooden-terrace",
      "jim-morrison-wooden-terrace-and-shakshuka-cafe",
      "shakshuka-cafe"
    ]
  },
  "kasol:waichin-valley-magic-valley-glacial-meadow": {
    imageUrl: "/images/places/kasol/waichin-valley.webp",
    visualDescription: "An alpine valley situated high above the Malana dam at 2,700m offering uninterrupted, jaw-dropping vistas of the Animal Pass and glacier peaks.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "magic-valley-glacial-meadow",
      "waichin-valley",
      "waichin-valley-magic-valley-glacial-meadow"
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
  "lansdowne:tarkeshwar-mahadev-giant-deodar-sanctuary": {
    imageUrl: "/images/places/lansdowne/tarkeshwar-mahadev-temple.webp",
    visualDescription: "An ancient Shiva shrine 38 km from Lansdowne nestled within a dense virgin forest of thousand-year-old towering deodars and brass bells.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "tarkeshwar-mahadev-giant-deodar-sanctuary",
      "tarkeshwar-mahadev-temple"
    ]
  },
  "lansdowne:st-marys-anglican-church-1896-heritage-archive": {
    imageUrl: "/images/places/lansdowne/st-marys-church-1896.webp",
    visualDescription: "A Victorian stone chapel built in 1896 by Colonel A.H.B. Hume, beautifully preserved as an audio-visual museum documenting Lansdowne’s cantonment o...",
    category: "Culture & Heritage",
    semanticTheme: "church",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "1896-heritage-archive",
      "st-marys-anglican-church",
      "st-marys-anglican-church-1896-heritage-archive",
      "st-marys-church-1896"
    ]
  },
  "lansdowne:kaleshwar-mahadev-500-year-sage-meditation-cave": {
    imageUrl: "/images/places/lansdowne/kaleshwar-mahadev-temple.webp",
    visualDescription: "The oldest temple in Lansdowne where local shepherds once worshipped Shiva, serving as a peaceful meditation sanctuary for centuries of ascetics.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kaleshwar-mahadev-500-year-sage-meditation-cave",
      "kaleshwar-mahadev-temple"
    ]
  },
  "lansdowne:santoshi-mata-temple-sunset-peak-crest": {
    imageUrl: "/images/places/lansdowne/santoshi-mata-temple-sunset.webp",
    visualDescription: "A small hilltop shrine located past Tip-in-Top offering an unobstructed vantage point to watch sunsets dissolve into the lower Shivalik and plains.",
    category: "Nature & Viewpoints",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "santoshi-mata-temple",
      "santoshi-mata-temple-sunset",
      "santoshi-mata-temple-sunset-peak-crest",
      "sunset-peak-crest"
    ]
  },
  "lansdowne:deriyakhal-oak-and-rhododendron-birding-trail": {
    imageUrl: "/images/places/lansdowne/deriyakhal-oak-forest-trail.webp",
    visualDescription: "A serene woodland hiking path through moss-covered oak trees where blue whistling thrushes, woodpeckers, and barking deer are frequently seen.",
    category: "Nature & Viewpoints",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "deriyakhal-oak",
      "deriyakhal-oak-and-rhododendron-birding-trail",
      "deriyakhal-oak-forest-trail",
      "rhododendron-birding-trail"
    ]
  },
  "lansdowne:kanvashram-historic-sanctuary-on-malini-river": {
    imageUrl: "/images/places/lansdowne/kanvashram-historic-sanctuary.webp",
    visualDescription: "The ancient Vedic hermitage on the river Malini where sage Kanva raised Shakuntala and where Emperor Bharata (namesake of India) spent his childhood.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kanvashram-historic-sanctuary",
      "kanvashram-historic-sanctuary-on-malini-river"
    ]
  },
  "lansdowne:mayur-cafe-steaming-momos-and-ginger-tea": {
    imageUrl: "/images/places/lansdowne/mayur-cafe-mall-road.webp",
    visualDescription: "A cozy wooden eatery on Mall Road loved by generations of travellers for juicy steamed chicken and vegetable momos, thukpa, and adrak chai.",
    category: "Local Food & Street Eats",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "ginger-tea",
      "mayur-cafe-mall-road",
      "mayur-cafe-steaming-momos",
      "mayur-cafe-steaming-momos-and-ginger-tea"
    ]
  },
  "lansdowne:sadar-bazaar-cantonment-heritage-lane": {
    imageUrl: "/images/places/lansdowne/sadar-bazaar-wooden-curios.webp",
    visualDescription: "A quaint 19th-century hill cantonment lane featuring wooden general stores, locally hand-knitted woolen caps, pine crafts, and bakeries.",
    category: "Local Food & Street Eats",
    semanticTheme: "shopping",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sadar-bazaar-cantonment-heritage-lane",
      "sadar-bazaar-wooden-curios"
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
  "leh:khardung-la-high-mountain-pass-5-359m": {
    imageUrl: "/images/places/leh/khardung-la.webp",
    visualDescription: "The world-famous gateway mountain pass connecting Leh to the Nubra and Shyok valleys, situated at an altitude of 5,359m (17,582 ft) amidst snow cor...",
    category: "Must Visit",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "359m",
      "khardung-la",
      "khardung-la-high-mountain-pass",
      "khardung-la-high-mountain-pass-5-359m"
    ]
  },
  "leh:nubra-valley-and-hunder-sand-dunes": {
    imageUrl: "/images/places/leh/nubra-hunder-sand-dunes.webp",
    visualDescription: "A surreal cold desert valley of white sand dunes surrounded by barren snow peaks, famous for the double-humped Bactrian camels of the ancient Silk ...",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "hunder-sand-dunes",
      "nubra-hunder-sand-dunes",
      "nubra-valley",
      "nubra-valley-and-hunder-sand-dunes"
    ]
  },
  "leh:hemis-monastery-and-sacred-museum": {
    imageUrl: "/images/places/leh/hemis-monastery.webp",
    visualDescription: "The largest, wealthiest, and most culturally prominent Drukpa Kagyu monastery in Ladakh, home to a world-class underground museum of ancient tantri...",
    category: "Culture & Heritage",
    semanticTheme: "monastery",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "hemis-monastery",
      "hemis-monastery-and-sacred-museum",
      "sacred-museum"
    ]
  },
  "leh:magnetic-hill-gravity-defying-ridge": {
    imageUrl: "/images/places/leh/magnetic-hill.webp",
    visualDescription: "Famous optical illusion hill on the Leh-Kargil highway where stationary vehicles appear to roll uphill.rushing mud-tinted Zanskar, carving through ...",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "magnetic-hill",
      "magnetic-hill-gravity-defying-ridge"
    ]
  },
  "leh:general-zorawar-fort-and-military-museum": {
    imageUrl: "/images/places/leh/zorawar-fort.webp",
    visualDescription: "Historic mud and stone fortress built by General Zorawar Singh in 1836, overlooking Old Leh town.promote world peace, perched atop a steep hill ove...",
    category: "Must Visit",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "general-zorawar-fort",
      "general-zorawar-fort-and-military-museum",
      "military-museum",
      "zorawar-fort"
    ]
  },
  "leh:lamayuru-moonland-and-ancient-monastery": {
    imageUrl: "/images/places/leh/lamayuru-moonland.webp",
    visualDescription: "Leh's oldest bakery and traveler restaurant operating since 1989, legendary for hearty yak cheese pizzas, freshly baked apple crumble, and ginger l...",
    category: "Cafés & Bakery",
    semanticTheme: "monastery",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "ancient-monastery",
      "lamayuru-moonland",
      "lamayuru-moonland-and-ancient-monastery"
    ]
  },
  "leh:lalas-art-cafe-in-old-town-leh": {
    imageUrl: "/images/places/leh/alchi-monastery.webp",
    visualDescription: "UNESCO-recognized ancient monastic complex on the banks of the Indus, celebrated for preserved Kashmiri-style Buddhist wall frescoes.this artistic ...",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "alchi-monastery",
      "lalas-art-cafe-in-old-town-leh"
    ]
  },
  "leh:bon-appetit-organic-garden-dining": {
    imageUrl: "/images/places/leh/bon-appetit-leh.webp",
    visualDescription: "Designed by French architects using raw rammed-earth and black slate, this fine-dining sanctuary sits in a quiet apple garden with floor-to-ceiling...",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bon-appetit",
      "bon-appetit-leh",
      "bon-appetit-organic-garden-dining"
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
  "manali:naggar-castle-kath-kuni-royal-palace": {
    imageUrl: "/images/places/manali/naggar-castle.webp",
    visualDescription: "A magnificent 15th-century wood-and-stone castle built by Raja Sidh Singh, showcasing earthquake-resistant Kath-Kuni architecture with sweeping vie...",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kath-kuni-royal-palace",
      "naggar-castle",
      "naggar-castle-kath-kuni-royal-palace"
    ]
  },
  "manali:rohtang-pass-snow-crest-and-alpine-gateway": {
    imageUrl: "/images/places/manali/rohtang-pass.webp",
    visualDescription: "At an elevation of 3,978m (13,050 ft), Rohtang Pass connects the lush Kullu Valley to the stark arid mountains of Lahaul and Spiti, offering breath...",
    category: "Must Visit",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "alpine-gateway",
      "rohtang-pass",
      "rohtang-pass-snow-crest",
      "rohtang-pass-snow-crest-and-alpine-gateway"
    ]
  },
  "manali:atal-tunnel-north-portal-and-sissu-waterfall": {
    imageUrl: "/images/places/manali/atal-tunnel-sissu.webp",
    visualDescription: "Passing through the 9.02 km Atal Tunnel brings you into the dramatic high-desert valley of Lahaul, where the spectacular Sissu Waterfall drops 50 m...",
    category: "Nature & Trails",
    semanticTheme: "waterfall",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "atal-tunnel-north-portal",
      "atal-tunnel-north-portal-and-sissu-waterfall",
      "atal-tunnel-sissu",
      "sissu-waterfall"
    ]
  },
  "manali:manu-temple-historic-shrine-of-sage-manu": {
    imageUrl: "/images/places/manali/manu-temple.webp",
    visualDescription: "Perched on the top ridge of Old Manali, this ancient pagoda-style temple is believed to be the only temple dedicated to Sage Manu, who saved humani...",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "historic-shrine-of-sage-manu",
      "manu-temple",
      "manu-temple-historic-shrine-of-sage-manu"
    ]
  },
  "manali:sethan-igloo-village-and-hampta-valley-ridge": {
    imageUrl: "/images/places/manali/sethan-igloo-village.webp",
    visualDescription: "A quiet Buddhist village perched at 2,700m inhabited by the Khampa tribe, famous for winter igloo stays, bouldering, and the gateway to Hampta Pass.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "hampta-valley-ridge",
      "sethan-igloo-village",
      "sethan-igloo-village-and-hampta-valley-ridge"
    ]
  },
  "manali:beas-river-nature-park-and-deodar-walk": {
    imageUrl: "/images/places/manali/beas-river-park.webp",
    visualDescription: "A protected forested sanctuary along the rushing waters of the Manalsu and Beas rivers, with towering centuries-old deodars and natural pebble ston...",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "beas-river-nature-park",
      "beas-river-nature-park-and-deodar-walk",
      "beas-river-park",
      "deodar-walk"
    ]
  },
  "manali:lazy-dog-lounge-riverside-deck": {
    imageUrl: "/images/places/manali/lazy-dog-lounge.webp",
    visualDescription: "Old Manali's iconic riverside lounge featuring a sunlit wooden deck over the rushing Manalsu river, craft beverages, grilled trout, and acoustic mu...",
    category: "Cafés & Bakery",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "lazy-dog-lounge",
      "lazy-dog-lounge-riverside-deck"
    ]
  },
  "manali:dylans-toasted-and-roasted-coffee-house": {
    imageUrl: "/images/places/manali/dylans-cafe.webp",
    visualDescription: "Serving travelers since 2005, Dylan's is famous for fresh-roasted Arabica coffee, gooey homemade cinnamon rolls, and chocolate chip cookies.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dylans-cafe",
      "dylans-toasted",
      "dylans-toasted-and-roasted-coffee-house",
      "roasted-coffee-house"
    ]
  },
  "manali:gulaba-meadows-and-alpine-snow-line": {
    imageUrl: "/images/places/manali/gulaba-meadows.webp",
    visualDescription: "Picturesque high alpine meadows situated along the Rohtang road, surrounded by cascading streams and blooming rhododendron wildflowers in summer.",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "alpine-snow-line",
      "gulaba-meadows",
      "gulaba-meadows-and-alpine-snow-line"
    ]
  },
  "manali:chopsticks-tibetan-and-asian-kitchen": {
    imageUrl: "/images/places/manali/chopsticks-manali.webp",
    visualDescription: "A beloved Mall Road establishment serving steaming Tibetan thukpa, hand-folded momos, gyathuk, and local fruit wines for over three decades.",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "asian-kitchen",
      "chopsticks",
      "chopsticks-manali",
      "chopsticks-tibetan",
      "chopsticks-tibetan-and-asian-kitchen"
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
  "mathura-vrindavan:kusum-sarovar-18th-century-sandstone-reservoir": {
    imageUrl: "/images/places/mathura-vrindavan/kusum-sarovar-govardhan.webp",
    visualDescription: "A magnificent 450-foot long carved sandstone water palace and tiered ghats built in 1764 by Maharaja Jawahar Singh in memory of Raja Suraj Mal.",
    category: "Must Visit",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kusum-sarovar-18th-century-sandstone-reservoir",
      "kusum-sarovar-govardhan"
    ]
  },
  "mathura-vrindavan:govardhan-hill-giriraj-sacred-parikrama-path": {
    imageUrl: "/images/places/mathura-vrindavan/govardhan-hill-parikrama.webp",
    visualDescription: "The sacred 21 km circumambulation route around Mount Govardhan, which Lord Krishna lifted on his little finger to shelter the villagers from Indra’...",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "giriraj-sacred-parikrama-path",
      "govardhan-hill",
      "govardhan-hill-giriraj-sacred-parikrama-path",
      "govardhan-hill-parikrama"
    ]
  },
  "mathura-vrindavan:barsana-shri-radha-rani-temple-ladli-ji-palace": {
    imageUrl: "/images/places/mathura-vrindavan/barsana-shri-radha-rani-temple.webp",
    visualDescription: "A grand hilltop fortress-palace dedicated to Shri Radha perched atop Bhanugarh peak, world-famous as the home of the exuberant Lathmar Holi.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "barsana-shri-radha-rani-temple",
      "barsana-shri-radha-rani-temple-ladli-ji-palace",
      "ladli-ji-palace"
    ]
  },
  "mathura-vrindavan:radha-kund-and-shyam-kund-sacred-twin-lakes": {
    imageUrl: "/images/places/mathura-vrindavan/radha-kund-shyam-kund.webp",
    visualDescription: "Two adjoining holy lakes considered the most sacred bathing water in the Vaishnava tradition, created by Radha and Krishna during the slaying of Ar...",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "radha-kund",
      "radha-kund-and-shyam-kund-sacred-twin-lakes",
      "radha-kund-shyam-kund",
      "shyam-kund-sacred-twin-lakes"
    ]
  },
  "mathura-vrindavan:potra-kund-sacred-stepped-stepwell": {
    imageUrl: "/images/places/mathura-vrindavan/potra-kund-mathura.webp",
    visualDescription: "A massive red sandstone stepped water reservoir near Janmabhoomi where Mother Devaki washed the baby garments of infant Krishna.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "potra-kund-mathura",
      "potra-kund-sacred-stepped-stepwell"
    ]
  },
  "mathura-vrindavan:keshi-ghat-stone-palace-and-riverfront-sunset": {
    imageUrl: "/images/places/mathura-vrindavan/keshi-ghat-yamuna-sunset.webp",
    visualDescription: "The most imposing ghat in Vrindavan featuring continuous arched stone jharokhas and towers where Krishna bathed after subduing the horse demon Keshi.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "keshi-ghat-stone-palace",
      "keshi-ghat-stone-palace-and-riverfront-sunset",
      "keshi-ghat-yamuna-sunset",
      "riverfront-sunset"
    ]
  },
  "mathura-vrindavan:vrindavan-chandrodaya-mandir-cultural-park": {
    imageUrl: "/images/places/mathura-vrindavan/chandrodaya-mandir-lookout.webp",
    visualDescription: "The monumental spiritual and architectural park featuring heritage gardens, laser presentations, and traditional Braj heritage pavilions.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chandrodaya-mandir-lookout",
      "vrindavan-chandrodaya-mandir-cultural-park"
    ]
  },
  "mathura-vrindavan:chappan-bhog-malai-rabri-and-khurchan-store": {
    imageUrl: "/images/places/mathura-vrindavan/brij-chappan-bhog-sweets.webp",
    visualDescription: "A renowned traditional confectioner in Mathura preparing rich buffalo milk khurchan, layered malai rabri, crisp kachoris, and badam milk.",
    category: "Local Food & Street Eats",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "brij-chappan-bhog-sweets",
      "chappan-bhog-malai-rabri",
      "chappan-bhog-malai-rabri-and-khurchan-store",
      "khurchan-store"
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
  "morni-hills:kalesar-wildlife-sanctuary-and-sal-canopy": {
    imageUrl: "/images/places/morni-hills/kalesar-national-park-border.webp",
    visualDescription: "A 13,000-acre dense sal forest reserve bordering the Shivaliks where wild leopards, barking deer, sambar, and grey hornbills roam freely.",
    category: "Nature & Viewpoints",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kalesar-national-park-border",
      "kalesar-wildlife-sanctuary",
      "kalesar-wildlife-sanctuary-and-sal-canopy",
      "sal-canopy"
    ]
  },
  "morni-hills:mandhana-high-pine-crest-trail": {
    imageUrl: "/images/places/morni-hills/mandhana-pine-ridge-trail.webp",
    visualDescription: "A breezy walking trail along the narrow ridge connecting Morni to Mandhana village, offering views down into Himachal valleys on both sides.",
    category: "Adventure & Treks",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mandhana-high-pine-crest-trail",
      "mandhana-pine-ridge-trail"
    ]
  },
  "morni-hills:bada-taal-the-greater-sacred-wetland-lake": {
    imageUrl: "/images/places/morni-hills/bada-taal-lotus-wetland.webp",
    visualDescription: "The larger of the twin Tikkar lakes revered as a sacred body of water, flanked by lush green reeds, water lilies, and wandering egrets.",
    category: "Nature & Viewpoints",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bada-taal",
      "bada-taal-lotus-wetland",
      "bada-taal-the-greater-sacred-wetland-lake",
      "the-greater-sacred-wetland-lake"
    ]
  },
  "morni-hills:bhuru-singh-deota-cliff-sanctuary": {
    imageUrl: "/images/places/morni-hills/bhurusingh-deota-temple.webp",
    visualDescription: "A historic tribal hill shrine dedicated to the legendary protector deity of the Morni hills, overlooking the seasonal river ravine.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bhuru-singh-deota-cliff-sanctuary",
      "bhurusingh-deota-temple"
    ]
  },
  "morni-hills:saketi-shivalik-prehistoric-fossil-park": {
    imageUrl: "/images/places/morni-hills/shivalik-fossil-park-saketi.webp",
    visualDescription: "A 2.5-million-year-old prehistoric mammalian fossil park showcasing life-size fiberglass reconstructions of sabre-toothed tigers and giant elephants.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "saketi-shivalik-prehistoric-fossil-park",
      "shivalik-fossil-park-saketi"
    ]
  },
  "morni-hills:morni-pine-canopy-treehouse-platform": {
    imageUrl: "/images/places/morni-hills/morni-tree-house-lookout.webp",
    visualDescription: "An elevated wooden timber watchtower built among chir pine treetops offering aerial binoculars views over the Shivalik bird corridors.",
    category: "Nature & Viewpoints",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "morni-pine-canopy-treehouse-platform",
      "morni-tree-house-lookout"
    ]
  },
  "morni-hills:morni-forest-wild-multifloral-honey-apiary": {
    imageUrl: "/images/places/morni-hills/haryana-agro-honey-center.webp",
    visualDescription: "An eco-apiary and processing outlet producing raw, unprocessed wild floral honey gathered from Shivalik acacia and eucalyptus blossoms.",
    category: "Local Food & Street Eats",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "haryana-agro-honey-center",
      "morni-forest-wild-multifloral-honey-apiary"
    ]
  },
  "morni-hills:ghaggar-river-pebble-banks-and-shallows": {
    imageUrl: "/images/places/morni-hills/ghaggar-river-pebble-banks.webp",
    visualDescription: "Clean, broad stone riverbeds where the Ghaggar emerges from the hills, perfect for water wading, skipping stones, and quiet family picnics.",
    category: "Nature & Viewpoints",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "ghaggar-river-pebble-banks",
      "ghaggar-river-pebble-banks-and-shallows",
      "shallows"
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
  "munnar:kolukkumalai-tea-estate-worlds-highest": {
    imageUrl: "/images/places/munnar/kolukkumalai-tea.webp",
    visualDescription: "Perched at an altitude of 7,900 ft (2,400m), Kolukkumalai is the highest organic orthodox tea plantation in the world, reached via a thrilling 4x4 ...",
    category: "Must Visit",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kolukkumalai-tea",
      "kolukkumalai-tea-estate",
      "kolukkumalai-tea-estate-worlds-highest",
      "worlds-highest"
    ]
  },
  "munnar:lockhart-gap-and-bison-valley-viewpoint": {
    imageUrl: "/images/places/munnar/lockhart-gap.webp",
    visualDescription: "A natural heart-shaped gap between two mist-shrouded mountain ridges offering sweeping aerial views of lush green tea slopes and the fertile Bison ...",
    category: "Nature & Trails",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bison-valley-viewpoint",
      "lockhart-gap",
      "lockhart-gap-and-bison-valley-viewpoint"
    ]
  },
  "munnar:anamudi-peak-base-and-shola-forest-edge": {
    imageUrl: "/images/places/munnar/anamudi-peak-base.webp",
    visualDescription: "Rising to 2,695m (8,842 ft), Anamudi is the highest peak in South India and the Western Ghats, resembling an elephant's forehead amidst montane sho...",
    category: "Nature & Trails",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "anamudi-peak-base",
      "anamudi-peak-base-and-shola-forest-edge",
      "shola-forest-edge"
    ]
  },
  "munnar:marayoor-sandalwood-forest-and-megalithic-dolmens": {
    imageUrl: "/images/places/munnar/marayoor-sandalwood-forest.webp",
    visualDescription: "The only natural sandalwood forest in Kerala, surrounded by ancient Neolithic burial dolmens (Muniyaras) dating back thousands of years and traditi...",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "marayoor-sandalwood-forest",
      "marayoor-sandalwood-forest-and-megalithic-dolmens",
      "megalithic-dolmens"
    ]
  },
  "munnar:chinnar-wildlife-sanctuary-and-thorny-scrub-trail": {
    imageUrl: "/images/places/munnar/chinnar-wildlife-sanctuary.webp",
    visualDescription: "A rain-shadow wildlife sanctuary in the Western Ghats known for the endangered Grizzled Giant Squirrel, wild elephants, Indian star tortoises, and ...",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chinnar-wildlife-sanctuary",
      "chinnar-wildlife-sanctuary-and-thorny-scrub-trail",
      "thorny-scrub-trail"
    ]
  },
  "munnar:lakkom-cascading-waterfalls": {
    imageUrl: "/images/places/munnar/lakkom-waterfalls.webp",
    visualDescription: "Originating from the Eravikulam plateau, this crystal-clear stream tumbles down granite boulders into a serene emerald pool framed by dense bamboo ...",
    category: "Nature & Trails",
    semanticTheme: "waterfall",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "lakkom-cascading-waterfalls",
      "lakkom-waterfalls"
    ]
  },
  "munnar:saravana-bhavan-munnar-town": {
    imageUrl: "/images/places/munnar/saravana-bhavan-munnar.webp",
    visualDescription: "The bustling morning hub of Munnar town serving crispy golden ghee roast dosas, fluffy idlis, piping hot sambar, and authentic South Indian filter ...",
    category: "Local Food",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "saravana-bhavan",
      "saravana-bhavan-munnar",
      "saravana-bhavan-munnar-town"
    ]
  },
  "munnar:eastend-chai-bazaar-and-plantation-tasting": {
    imageUrl: "/images/places/munnar/eastend-chai-bazaar.webp",
    visualDescription: "An artisanal tea tasting lounge showcasing single-estate orthodox teas, green tea infusions, fresh cardamom cookies, and banana fritters.",
    category: "Cafés & Bakery",
    semanticTheme: "shopping",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "eastend-chai-bazaar",
      "eastend-chai-bazaar-and-plantation-tasting",
      "plantation-tasting"
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
  "murthal:shiva-tourist-dhaba-pure-desi-ghee-tandoor": {
    imageUrl: "/images/places/murthal/shiva-dhaba-pure-desi-ghee.webp",
    visualDescription: "A favourite local highway stop operating traditional earthen ovens that use 100% pure desi ghee for their crispy stuffed gobi and paneer parathas.",
    category: "Local Food & Street Eats",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "pure-desi-ghee-tandoor",
      "shiva-dhaba-pure-desi-ghee",
      "shiva-tourist-dhaba",
      "shiva-tourist-dhaba-pure-desi-ghee-tandoor"
    ]
  },
  "murthal:chokhi-dhani-sonepat-heritage-cultural-fair": {
    imageUrl: "/images/places/murthal/chokhi-dhani-sonipat-village.webp",
    visualDescription: "An evening cultural destination showcasing Rajasthani folk dance, puppet shows, camel rides, pottery wheels, and authentic chaupal dining.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chokhi-dhani-sonepat-heritage-cultural-fair",
      "chokhi-dhani-sonipat-village"
    ]
  },
  "murthal:badkhalsa-memorial-and-sikh-heritage-museum": {
    imageUrl: "/images/places/murthal/badkhalsa-memorial-museum.webp",
    visualDescription: "A commemorative national memorial dedicated to Bhai Kushal Singh (Bhai Jaita Ji) who carried the severed sacred head of Guru Tegh Bahadur from Delhi.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "badkhalsa-memorial",
      "badkhalsa-memorial-and-sikh-heritage-museum",
      "badkhalsa-memorial-museum",
      "sikh-heritage-museum"
    ]
  },
  "murthal:haryana-tourism-ethnic-craft-village-and-loom": {
    imageUrl: "/images/places/murthal/haryana-tourism-ethnic-hub.webp",
    visualDescription: "A state craft emporium showcasing traditional Haryanvi durrie weaving, terracotta pottery wheels, folk wooden toys, and brass artefacts.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "haryana-tourism-ethnic-craft-village",
      "haryana-tourism-ethnic-craft-village-and-loom",
      "haryana-tourism-ethnic-hub",
      "loom"
    ]
  },
  "murthal:murthal-rural-canal-lanes-and-yellow-mustard-fields": {
    imageUrl: "/images/places/murthal/hero.webp",
    visualDescription: "Rustic farm lanes branching off the highway along irrigation canals, lined with eucalyptus trees and endless blooming yellow mustard fields in winter.",
    category: "Nature & Viewpoints",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "murthal-rural-canal-lanes",
      "murthal-rural-canal-lanes-and-yellow-mustard-fields",
      "yellow-mustard-fields"
    ]
  },
  "murthal:farm-fresh-kadhai-milk-and-rabri-counter": {
    imageUrl: "/images/places/murthal/sukhdev-farm-fresh-milk-counter.webp",
    visualDescription: "Giant wide iron cauldrons continuously simmering saffron-spiced milk with almonds and pistachios, served boiling hot in earthenware kulhads.",
    category: "Local Food & Street Eats",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "farm-fresh-kadhai-milk",
      "farm-fresh-kadhai-milk-and-rabri-counter",
      "rabri-counter",
      "sukhdev-farm-fresh-milk-counter"
    ]
  },
  "murthal:sonipat-yamuna-riverfront-sand-banks": {
    imageUrl: "/images/places/murthal/yamuna-river-ghats-sonipat.webp",
    visualDescription: "A wide expanse of quiet sandy riverbeds 12 km east of Murthal where local wooden boats operate and watermelon farmers tend seasonal fields.",
    category: "Nature & Viewpoints",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sonipat-yamuna-riverfront-sand-banks",
      "yamuna-river-ghats-sonipat"
    ]
  },
  "murthal:pahalwan-khasta-dal-kachori-and-heeng-aloo": {
    imageUrl: "/images/places/murthal/pehalwan-kachori-subzi-corner.webp",
    visualDescription: "Flaky, deep-fried urad dal kachoris crushed into bowls of hot, spicy asafoetida potato curry with sweet tamarind and green coriander chutneys.",
    category: "Local Food & Street Eats",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "heeng-aloo",
      "pahalwan-khasta-dal-kachori",
      "pahalwan-khasta-dal-kachori-and-heeng-aloo",
      "pehalwan-kachori-subzi-corner"
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
  "mussoorie:char-dukan-heritage-cafe-lane-landour": {
    imageUrl: "/images/places/mussoorie/char-dukan-prakash-store.webp",
    visualDescription: "A historic cluster of four quaint wooden shops in Landour operating since colonial times, famous for ginger lemon honey tea, cheese omelettes, and ...",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "char-dukan-heritage-cafe-lane",
      "char-dukan-heritage-cafe-lane-landour",
      "char-dukan-prakash-store",
      "landour"
    ]
  },
  "mussoorie:pari-tibba-witches-hill-pine-ridge-trail": {
    imageUrl: "/images/places/mussoorie/pari-tibba-fairies-hill.webp",
    visualDescription: "An enchanting, secluded pine-and-oak hill trail made famous in Ruskin Bond's ghost stories, prone to lightning strikes and rich in rare Himalayan b...",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "pari-tibba",
      "pari-tibba-fairies-hill",
      "pari-tibba-witches-hill-pine-ridge-trail",
      "pine-ridge-trail",
      "witches-hill"
    ]
  },
  "mussoorie:rokeby-manor-and-emilys-tea-room": {
    imageUrl: "/images/places/mussoorie/rokeby-manor.webp",
    visualDescription: "An 1840 stone manor with wooden beams, rustic stone fireplaces, and an elegant dining room serving colonial stews, mustard chicken, and herbal teas.",
    category: "Cafés & Bakery",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "emilys-tea-room",
      "rokeby-manor",
      "rokeby-manor-and-emilys-tea-room"
    ]
  },
  "mussoorie:prakash-store-and-handmade-cheese-deli-1928": {
    imageUrl: "/images/places/mussoorie/prakash-store.webp",
    visualDescription: "A legendary family-run store operating since 1928, famous for authentic homemade peanut butter, cheddar cheese, gooseberry jams, and apricot preser...",
    category: "Markets & Craft",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "1928",
      "handmade-cheese-deli",
      "prakash-store",
      "prakash-store-and-handmade-cheese-deli-1928"
    ]
  },
  "mussoorie:company-garden-and-artificial-falls": {
    imageUrl: "/images/places/mussoorie/company-garden.webp",
    visualDescription: "A historic municipal botanical garden laid out in the 19th century with vibrant dahlias, an amusement lake, and a cascading artificial rock waterfall.",
    category: "Nature & Viewpoints",
    semanticTheme: "waterfall",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "artificial-falls",
      "company-garden",
      "company-garden-and-artificial-falls"
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
  "neemrana:tijara-fort-palace-19th-century-hilltop-citadel": {
    imageUrl: "/images/places/neemrana/tijara-fort-palace-heritage.webp",
    visualDescription: "A dramatic 19th-century Rajput palace fortress perched atop an Aravalli crest with sunken sunken amphitheatre gardens and royal pavilions.",
    category: "Must Visit",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "19th-century-hilltop-citadel",
      "tijara-fort-palace",
      "tijara-fort-palace-19th-century-hilltop-citadel",
      "tijara-fort-palace-heritage"
    ]
  },
  "neemrana:aravalli-quartzite-canyon-and-scrub-trail": {
    imageUrl: "/images/places/neemrana/aravalli-hidden-gorge-trek.webp",
    visualDescription: "A rugged dry-canyon hike behind Neemrana village winding through red quartzite boulders and thorny dhau trees inhabited by peacocks and neelgai.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "aravalli-hidden-gorge-trek",
      "aravalli-quartzite-canyon",
      "aravalli-quartzite-canyon-and-scrub-trail",
      "scrub-trail"
    ]
  },
  "neemrana:mothooka-ancient-copper-archaeology-site": {
    imageUrl: "/images/places/neemrana/mothooka-ancient-copper-mines.webp",
    visualDescription: "An ancient proto-historic copper smelting and mining archaeological site dating back to the Ganeshwar-Jodhpura cultural complex.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mothooka-ancient-copper-archaeology-site",
      "mothooka-ancient-copper-mines"
    ]
  },
  "neemrana:kotputli-traditional-terracotta-pottery-street": {
    imageUrl: "/images/places/neemrana/kotputli-earthen-pottery-lane.webp",
    visualDescription: "A lively artisan hamlet on the highway where hundreds of traditional potter families craft unglazed terracotta urns, planters, and wind chimes.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kotputli-earthen-pottery-lane",
      "kotputli-traditional-terracotta-pottery-street"
    ]
  },
  "neemrana:nazara-open-air-medieval-amphitheatre": {
    imageUrl: "/images/places/neemrana/neemrana-rooftop-amphitheatre.webp",
    visualDescription: "A tiered stone open-air theatre carved into the upper fortress battlements hosting evening Rajasthani Kalbelia dances and folk sufi music.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "nazara-open-air-medieval-amphitheatre",
      "neemrana-rooftop-amphitheatre",
      "rooftop-amphitheatre"
    ]
  },
  "neemrana:shyam-sarovar-subterranean-baori-oasis": {
    imageUrl: "/images/places/neemrana/shyam-sarovar-kund.webp",
    visualDescription: "A historic water stepwell and shaded stone colonnade near the village bazaar built to catch monsoon runoff from the surrounding rocky ridges.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "shyam-sarovar-kund",
      "shyam-sarovar-subterranean-baori-oasis"
    ]
  },
  "neemrana:karni-mata-hilltop-staircase-shrine": {
    imageUrl: "/images/places/neemrana/karni-mata-shrine-neemrana.webp",
    visualDescription: "A revered shrine perched on a rocky crag reached by 250 white stone steps, commanding 360-degree vistas of the Neemrana valley and highway corridor.",
    category: "Culture & Heritage",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "karni-mata-hilltop-staircase-shrine",
      "karni-mata-shrine",
      "karni-mata-shrine-neemrana"
    ]
  },
  "neemrana:old-alwar-byroad-blooming-mustard-lane": {
    imageUrl: "/images/places/neemrana/old-alwar-road-sarson-fields.webp",
    visualDescription: "A quiet country road winding between ancient Aravalli hillocks through blooming yellow mustard fields and traditional camel cart trails.",
    category: "Nature & Viewpoints",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "old-alwar-byroad-blooming-mustard-lane",
      "old-alwar-road-sarson-fields"
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
  "rishikesh:swarg-ashram-and-sacred-kutiyas": {
    imageUrl: "/images/places/rishikesh/swarg-ashram.webp",
    visualDescription: "Historic spiritual enclave on the eastern bank of the Ganga, established by Swami Vishudhanand, renowned for tranquil meditation kutiyas and evenin...",
    category: "Must Visit",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sacred-kutiyas",
      "swarg-ashram",
      "swarg-ashram-and-sacred-kutiyas"
    ]
  },
  "rishikesh:kunjapuri-devi-sunrise-temple-ridge-1-645m": {
    imageUrl: "/images/places/rishikesh/triveni-ghat.webp",
    visualDescription: "Perched on a high Himalayan foothill crest, this sacred Shaktipeeth offers a 360-degree sunrise spectacle of Chaukhamba, Swargarohini, and Bandarpo...",
    category: "Must Visit",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "645m",
      "kunjapuri-devi-sunrise-temple-ridge",
      "kunjapuri-devi-sunrise-temple-ridge-1-645m",
      "triveni-ghat"
    ]
  },
  "rishikesh:kaudiyala-white-sand-river-bank": {
    imageUrl: "/images/places/rishikesh/kaudiyala-white-sands.webp",
    visualDescription: "Pristine white sand beach corridor along the jade-green waters of the upper Ganga, flanked by steep Himalayan ridges.of the Ganga, where Sage Vashi...",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kaudiyala-white-sand-river-bank",
      "kaudiyala-white-sands"
    ]
  },
  "rishikesh:patna-cascading-waterfall-and-limestone-caves": {
    imageUrl: "/images/places/rishikesh/patna-waterfall.webp",
    visualDescription: "A secluded limestone waterfall hidden inside deep Rajaji foothill forest, featuring natural calcified dripstone caves behind the cascading curtains...",
    category: "Nature & Trails",
    semanticTheme: "waterfall",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "limestone-caves",
      "patna-cascading-waterfall",
      "patna-cascading-waterfall-and-limestone-caves",
      "patna-waterfall"
    ]
  },
  "rishikesh:little-buddha-cafe-treehouse-lounge": {
    imageUrl: "/images/places/rishikesh/little-buddha-cafe.webp",
    visualDescription: "A treehouse-style bamboo cafe overlooking the turquoise waters of the Ganga, famous for Israeli shakshuka, fresh fruit lassis, momos, and acoustic ...",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "little-buddha-cafe",
      "little-buddha-cafe-treehouse-lounge"
    ]
  },
  "rishikesh:the-sitting-elephant-rooftop-dining": {
    imageUrl: "/images/places/rishikesh/sitting-elephant-restaurant.webp",
    visualDescription: "Panoramic rooftop restaurant overlooking the river bend at Swarg Ashram, serving regional Indian delicacies.freshly baked apple strudel, yak cheese...",
    category: "Cafés & Bakery",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "sitting-elephant-restaurant",
      "the-sitting-elephant-rooftop-dining"
    ]
  },
  "rishikesh:kunjapuri-devi-sunrise-temple-crest-1-665m": {
    imageUrl: "/images/places/rishikesh/kunjapuri-devi-sunrise-crest.webp",
    visualDescription: "A sacred Shakti Peeth temple perched atop a mountain ridge 25 km north of Rishikesh offering sunrise panoramas of Bandarpoonch, Swargarohini, and C...",
    category: "Nature & Viewpoints",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "665m",
      "kunjapuri-devi-sunrise-crest",
      "kunjapuri-devi-sunrise-temple-crest",
      "kunjapuri-devi-sunrise-temple-crest-1-665m"
    ]
  },
  "rishikesh:rajaji-national-park-chilla-elephant-safari-gate": {
    imageUrl: "/images/places/rishikesh/rajaji-national-park-chilla.webp",
    visualDescription: "An 820 sq km tiger and elephant reserve spanning the Shivalik foothills on the southern banks of the Ganga, famous for wild elephant herds and leop...",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chilla-elephant-safari-gate",
      "rajaji-national-park",
      "rajaji-national-park-chilla",
      "rajaji-national-park-chilla-elephant-safari-gate"
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
  "sariska-bhangarh:ajabgarh-fort-and-reservoir-the-twin-of-bhangarh": {
    imageUrl: "/images/places/sariska-bhangarh/ajabgarh-fort-and-dam.webp",
    visualDescription: "Built in 1635 by Ajab Singh Rajawat, this dramatic fortified hill citadel overlooks a scenic green water dam surrounded by mythological tales.",
    category: "Must Visit",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "ajabgarh-fort",
      "ajabgarh-fort-and-dam",
      "ajabgarh-fort-and-reservoir-the-twin-of-bhangarh",
      "reservoir",
      "the-twin-of-bhangarh"
    ]
  },
  "sariska-bhangarh:natni-ka-bara-stone-weir-and-forest-oasis": {
    imageUrl: "/images/places/sariska-bhangarh/natni-ka-bara-weir.webp",
    visualDescription: "A historic water weir on the Ruparel river flanked by dense jungle, attracting spotted chital, wild boars, and colourful pied kingfishers.",
    category: "Nature & Viewpoints",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "forest-oasis",
      "natni-ka-bara-stone-weir",
      "natni-ka-bara-stone-weir-and-forest-oasis",
      "natni-ka-bara-weir"
    ]
  },
  "sariska-bhangarh:narayani-mata-natural-spring-sanctuary": {
    imageUrl: "/images/places/sariska-bhangarh/narayani-mata-sacred-spring.webp",
    visualDescription: "A sacred shrine on the edge of Sariska National Park where hot natural spring water emerges from under the temple, holy to the Sain community.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "narayani-mata-natural-spring-sanctuary",
      "narayani-mata-sacred-spring"
    ]
  },
  "sariska-bhangarh:talvriksha-arjuna-tree-and-thermal-kunds": {
    imageUrl: "/images/places/sariska-bhangarh/talvriksha-holy-springs-sanctuary.webp",
    visualDescription: "An ancient spring hermitage where Arjuna of the Mahabharata took shelter, celebrated for twin hot and cold natural sulphur water reservoirs.",
    category: "Nature & Viewpoints",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "talvriksha-arjuna-tree",
      "talvriksha-arjuna-tree-and-thermal-kunds",
      "talvriksha-holy-springs-sanctuary",
      "thermal-kunds"
    ]
  },
  "sariska-bhangarh:kushalgarh-colonial-teak-forest-bungalow": {
    imageUrl: "/images/places/sariska-bhangarh/kushalgarh-forest-rest-house.webp",
    visualDescription: "A historic 19th-century British hunting lodge situated on the primary tiger movement corridor within Sariska, shaded by massive teak trees.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kushalgarh-colonial-teak-forest-bungalow",
      "kushalgarh-forest-rest-house"
    ]
  },
  "sariska-bhangarh:mansa-devi-hilltop-cliff-lookout": {
    imageUrl: "/images/places/sariska-bhangarh/mansa-devi-hill-climb.webp",
    visualDescription: "A steep stone-stairway ascent up an isolated mountain spur near Sariska gate offering breathtaking views of the surrounding tiger reserve ravines.",
    category: "Adventure & Treks",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mansa-devi-hill-climb",
      "mansa-devi-hilltop-cliff-lookout"
    ]
  },
  "sariska-bhangarh:deoli-lake-and-tiger-watering-hole": {
    imageUrl: "/images/places/sariska-bhangarh/deoli-lake-waterhole.webp",
    visualDescription: "A natural waterhole in the southern reaches of Sariska that serves as the premier drinking station for Bengal tigers, leopards, and herds of sambar.",
    category: "Nature & Viewpoints",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "deoli-lake",
      "deoli-lake-and-tiger-watering-hole",
      "deoli-lake-waterhole",
      "tiger-watering-hole"
    ]
  },
  "sariska-bhangarh:rajgarh-hill-fort-ancient-bargujar-citadel": {
    imageUrl: "/images/places/sariska-bhangarh/rajgarh-fort-palace-ruins.webp",
    visualDescription: "A crumbling 18th-century palace fortification built atop a granite crag guarding the southern mountain pass connecting Alwar to Dausa.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "ancient-bargujar-citadel",
      "rajgarh-fort-palace-ruins",
      "rajgarh-hill-fort",
      "rajgarh-hill-fort-ancient-bargujar-citadel"
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
  "spiti:chicham-suspension-bridge-asias-highest": {
    imageUrl: "/images/places/spiti/chicham-bridge.webp",
    visualDescription: "Perched at an astonishing 4,145m (13,596 ft), Chicham Bridge spans a dramatic 1,000-foot deep vertical canyon, connecting Kibber to the remote high...",
    category: "Must Visit",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "asias-highest",
      "chicham-bridge",
      "chicham-suspension-bridge",
      "chicham-suspension-bridge-asias-highest"
    ]
  },
  "spiti:kibber-village-and-wildlife-sanctuary": {
    imageUrl: "/images/places/spiti/kibber-village.webp",
    visualDescription: "One of the highest continuously inhabited settlements in the world at 4,270m, Kibber features traditional whitewashed stone houses and serves as th...",
    category: "Nature & Trails",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kibber-village",
      "kibber-village-and-wildlife-sanctuary",
      "wildlife-sanctuary"
    ]
  },
  "spiti:tabo-monastery-the-ajanta-of-the-himalayas": {
    imageUrl: "/images/places/spiti/tabo-monastery.webp",
    visualDescription: "Founded in 996 CE, Tabo is a UNESCO World Heritage tentative site housing priceless thousand-year-old Buddhist clay statues, thangkas, and pristine...",
    category: "Culture & Heritage",
    semanticTheme: "monastery",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "tabo-monastery",
      "tabo-monastery-the-ajanta-of-the-himalayas",
      "the-ajanta-of-the-himalayas"
    ]
  },
  "spiti:dhankar-glacial-lake-alpine-tarn": {
    imageUrl: "/images/places/spiti/dhankar-lake.webp",
    visualDescription: "A high-altitude glacial tarn at 4,270m reached via a steep 1.5-hour scree trail from Dhankar Monastery, offering crystal reflections of surrounding...",
    category: "Adventure & Treks",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "dhankar-glacial-lake-alpine-tarn",
      "dhankar-lake"
    ]
  },
  "spiti:tashigang-worlds-highest-polling-station": {
    imageUrl: "/images/places/spiti/tashigang.webp",
    visualDescription: "At an elevation of 4,650m (15,256 ft), Tashigang is officially recognized as the world's highest voting station, offering staggering panoramic vist...",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "tashigang",
      "tashigang-worlds-highest-polling-station",
      "worlds-highest-polling-station"
    ]
  },
  "spiti:gue-monastery-and-500-year-old-natural-mummy": {
    imageUrl: "/images/places/spiti/gue-monastery.webp",
    visualDescription: "Preserved inside a climate-controlled glass chamber sits the remarkably intact 500-year-old natural mummy of Tibetan Buddhist monk Sangha Tenzin, p...",
    category: "Culture & Heritage",
    semanticTheme: "monastery",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "500-year-old-natural-mummy",
      "gue-monastery",
      "gue-monastery-and-500-year-old-natural-mummy"
    ]
  },
  "spiti:kaza-old-town-and-central-himalayan-bazaar": {
    imageUrl: "/images/places/spiti/kaza.webp",
    visualDescription: "The administrative and social hub of Spiti, where travelers and locals gather to purchase warm yak wool shawls, sea buckthorn concentrates, and han...",
    category: "Markets & Craft",
    semanticTheme: "shopping",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "central-himalayan-bazaar",
      "kaza",
      "kaza-old-town",
      "kaza-old-town-and-central-himalayan-bazaar"
    ]
  },
  "spiti:kunzum-pass-gateway-to-spiti-at-4-551m": {
    imageUrl: "/images/places/spiti/kunzum-pass.webp",
    visualDescription: "The dramatic high mountain pass connecting Lahaul and Spiti at 4,551m (14,931 ft), marked by 15 colorful Buddhist stupas and sweeping vistas of the...",
    category: "Must Visit",
    semanticTheme: "viewpoint",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "551m",
      "gateway-to-spiti-at-4",
      "kunzum-pass",
      "kunzum-pass-gateway-to-spiti-at-4-551m"
    ]
  },
  "spiti:mudh-village-terminal-hamlet-of-pin-valley": {
    imageUrl: "/images/places/spiti/mudh-village.webp",
    visualDescription: "Situated at 3,810m, Mudh is the last motorable settlement in Pin Valley, flanked by vertical red-and-ochre geological formations and barley fields.",
    category: "Hidden Gems",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "mudh-village",
      "mudh-village-terminal-hamlet-of-pin-valley",
      "terminal-hamlet-of-pin-valley"
    ]
  },
  "spiti:the-himalayan-cafe-and-slow-travel-lounge": {
    imageUrl: "/images/places/spiti/himalayan-cafe-spiti.webp",
    visualDescription: "A cozy wood-clad travelers retreat in central Kaza serving freshly brewed espresso, authentic woodfired crust pizzas, and organic sea buckthorn tea.",
    category: "Cafés & Bakery",
    semanticTheme: "cafe",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "himalayan-cafe",
      "himalayan-cafe-spiti",
      "slow-travel-lounge",
      "the-himalayan-cafe",
      "the-himalayan-cafe-and-slow-travel-lounge"
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
  "tungnath-chandrashila:kanchula-korak-musk-deer-sanctuary": {
    imageUrl: "/images/places/tungnath-chandrashila/kanchula-korak-musk-deer-sanctuary.webp",
    visualDescription: "A 9.6 sq km high-altitude sanctuary at 2,600m dedicated to breeding the endangered Himalayan musk deer amidst dense oak and rhododendron forest.",
    category: "Nature & Viewpoints",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kanchula-korak-musk-deer-sanctuary"
    ]
  },
  "tungnath-chandrashila:makkumath-temple-winter-abode-of-lord-tungnath": {
    imageUrl: "/images/places/tungnath-chandrashila/makku-math-winter-tungnath.webp",
    visualDescription: "The historic wooden and stone village temple where the symbolic deity of Lord Tungnath is brought down in a grand procession when high cliffs are s...",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "makku-math-winter-tungnath",
      "makkumath-temple",
      "makkumath-temple-winter-abode-of-lord-tungnath",
      "winter-abode-of-lord-tungnath"
    ]
  },
  "tungnath-chandrashila:baniyakund-high-alpine-meadows-and-eco-camps": {
    imageUrl: "/images/places/tungnath-chandrashila/baniyakund-high-meadows.webp",
    visualDescription: "A sweeping grassy alpine basin 4 km before Chopta surrounded by deodar forest, popular for luxury eco-camps and unobstructed star-gazing.",
    category: "Nature & Viewpoints",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "baniyakund-high-alpine-meadows",
      "baniyakund-high-alpine-meadows-and-eco-camps",
      "baniyakund-high-meadows",
      "eco-camps"
    ]
  },
  "tungnath-chandrashila:ravan-shila-the-cliff-of-penance-at-3-800m": {
    imageUrl: "/images/places/tungnath-chandrashila/ravan-shila-cliff.webp",
    visualDescription: "A sheer rocky ledge above Tungnath where King Ravana performed rigorous penance to please Lord Shiva, commanding dizzying vertical drops.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "800m",
      "ravan-shila",
      "ravan-shila-cliff",
      "ravan-shila-the-cliff-of-penance-at-3-800m",
      "the-cliff-of-penance-at-3"
    ]
  },
  "tungnath-chandrashila:kalpeshwar-fifth-kedar-sacred-hair-temple": {
    imageUrl: "/images/places/tungnath-chandrashila/kalpeshwar-cave-temple.webp",
    visualDescription: "The fifth and only Panch Kedar shrine open throughout all twelve months, situated inside a natural cave where Shiva’s matted locks (Jata) are worsh...",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "kalpeshwar-cave-temple",
      "kalpeshwar-fifth-kedar",
      "kalpeshwar-fifth-kedar-sacred-hair-temple",
      "sacred-hair-temple"
    ]
  },
  "tungnath-chandrashila:madhyamaheshwar-valley-circuit-base": {
    imageUrl: "/images/places/tungnath-chandrashila/madhyamaheshwar-base-circuit.webp",
    visualDescription: "The second Panch Kedar trail base in Ransi village where the holy naval (nabhi) of Lord Shiva is worshipped in a high alpine bowl beneath Chaukhamba.",
    category: "Adventure & Treks",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "madhyamaheshwar-base-circuit",
      "madhyamaheshwar-valley-circuit-base"
    ]
  },
  "tungnath-chandrashila:ansuya-devi-jungle-waterfall-and-hermitage-trail": {
    imageUrl: "/images/places/tungnath-chandrashila/ansuya-devi-waterfall-trail.webp",
    visualDescription: "A 5 km forest trek through dense oak woods to the cave shrine of Devi Ansuya, featuring a majestic 30-meter waterfall tumbling over limestone cliffs.",
    category: "Adventure & Treks",
    semanticTheme: "waterfall",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "ansuya-devi-jungle-waterfall",
      "ansuya-devi-jungle-waterfall-and-hermitage-trail",
      "ansuya-devi-waterfall-trail",
      "hermitage-trail"
    ]
  },
  "tungnath-chandrashila:chopta-alpine-shepherd-encampments": {
    imageUrl: "/images/places/tungnath-chandrashila/chopta-shepherds-stone-huts.webp",
    visualDescription: "Traditional summer dry-stone and slate-roof huts (chhani) built by Garhwali shepherds who graze their sheep and goats on the high bugyals.",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chopta-alpine-shepherd-encampments",
      "chopta-shepherds-stone-huts"
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
  "udaipur:jagdish-temple-1651-ce-indo-aryan-shrine": {
    imageUrl: "/images/places/udaipur/jagdish-temple.webp",
    visualDescription: "Constructed by Maharana Jagat Singh in 1651, this three-tiered stone temple rises 79 feet on carved pillars, showcasing extraordinary sculptures of...",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "1651-ce-indo-aryan-shrine",
      "jagdish-temple",
      "jagdish-temple-1651-ce-indo-aryan-shrine"
    ]
  },
  "udaipur:fateh-sagar-lake-and-nehru-island-park": {
    imageUrl: "/images/places/udaipur/fateh-sagar-lake.webp",
    visualDescription: "An artificial freshwater lake framed by the rolling Aravalli mountains on three sides, featuring three scenic islands including Nehru Park with its...",
    category: "Nature & Trails",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "fateh-sagar-lake",
      "fateh-sagar-lake-and-nehru-island-park",
      "nehru-island-park"
    ]
  },
  "udaipur:ahar-royal-cenotaphs-mahasatyas-of-mewar": {
    imageUrl: "/images/places/udaipur/ahar-cenotaphs.webp",
    visualDescription: "A hauntingly serene archaeological field containing over 250 carved marble and white sandstone chhatris (cenotaphs) built over 400 years to honor t...",
    category: "Culture & Heritage",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "ahar-cenotaphs",
      "ahar-royal-cenotaphs",
      "ahar-royal-cenotaphs-mahasatyas-of-mewar",
      "mahasatyas-of-mewar"
    ]
  },
  "udaipur:shilpgram-rural-arts-and-crafts-complex": {
    imageUrl: "/images/places/udaipur/shilpgram-crafts.webp",
    visualDescription: "A 70-acre living ethnographic museum featuring 26 authentic regional village huts from Rajasthan, Gujarat, Goa, and Maharashtra, with master artisa...",
    category: "Markets & Craft",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "crafts-complex",
      "rural-arts",
      "shilpgram",
      "shilpgram-crafts",
      "shilpgram-rural-arts-and-crafts-complex"
    ]
  },
  "udaipur:doodh-talai-lake-and-ropeway-to-karni-mata": {
    imageUrl: "/images/places/udaipur/doodh-talai-lake.webp",
    visualDescription: "A small picturesque lake adjacent to Lake Pichola with rock gardens, musical fountains, and an aerial ropeway gondola leading up to the Machla Magr...",
    category: "Nature & Trails",
    semanticTheme: "lake",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "doodh-talai-lake",
      "doodh-talai-lake-and-ropeway-to-karni-mata",
      "ropeway-to-karni-mata"
    ]
  },
  "udaipur:upre-by-1559-ad-lake-pichola-rooftop-dining": {
    imageUrl: "/images/places/udaipur/upre-rooftop-dining.webp",
    visualDescription: "An open-air terrace restaurant right on the edge of Lake Pichola, offering private white-draped cabanas with unmatched panoramic vistas of the illu...",
    category: "Local Food",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "lake-pichola",
      "lake-pichola-boat-ride",
      "lake-pichola-ghats",
      "lake-pichola-ghats-and-island-cruise",
      "lake-pichola-rooftop-dining",
      "lake-pichola-sunset-boat-voyage",
      "pichola-boat-ride",
      "pichola-cruise",
      "upre-by-1559-ad",
      "upre-by-1559-ad-lake-pichola-rooftop-dining",
      "upre-rooftop-dining"
    ]
  },
  "udaipur:millets-of-mewar-pioneering-healthy-rajasthani-kitchen": {
    imageUrl: "/images/places/udaipur/millets-of-mewar.webp",
    visualDescription: "Udaipur's pioneering dedicated health cafe reviving ancient Indian super-grains: bajra, ragi, and jowar thalis, gluten-free rotis, raw salads, and ...",
    category: "Cafés & Bakery",
    semanticTheme: "food",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "millets-of-mewar",
      "millets-of-mewar-pioneering-healthy-rajasthani-kitchen",
      "pioneering-healthy-rajasthani-kitchen"
    ]
  },
  "udaipur:paliwal-kachori-old-city-breakfast-stand": {
    imageUrl: "/images/places/udaipur/paliwal-kachori.webp",
    visualDescription: "A legendary old city standing counter that has served golden, piping hot dal kachoris and crisp jalebis to morning templegoers and travelers since ...",
    category: "Local Food",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "paliwal-kachori",
      "paliwal-kachori-old-city-breakfast-stand"
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
  "varanasi:harishchandra-ghat-and-silent-sacred-pyres": {
    imageUrl: "/images/places/varanasi/harishchandra-ghat.webp",
    visualDescription: "One of the two historic cremation ghats on the sacred Ganga, named after King Harishchandra who served here.without interruption for thousands of y...",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "harishchandra-ghat",
      "harishchandra-ghat-and-silent-sacred-pyres",
      "silent-sacred-pyres"
    ]
  },
  "varanasi:scindia-ghat-and-the-leaning-shiva-temple": {
    imageUrl: "/images/places/varanasi/scindia-ghat-leaning-temple.webp",
    visualDescription: "A quiet, architecturally fascinating ghat featuring the Ratneshwar Mahadev Temple, which tilted dramatically 9 degrees into the Ganga during constr...",
    category: "Hidden Gems",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "scindia-ghat",
      "scindia-ghat-and-the-leaning-shiva-temple",
      "scindia-ghat-leaning-temple",
      "the-leaning-shiva-temple"
    ]
  },
  "varanasi:bharat-kala-bhavan-archeological-museum": {
    imageUrl: "/images/places/varanasi/bharat-kala-bhavan.webp",
    visualDescription: "Prestigious museum inside Banaras Hindu University campus housing rare 12th-century sculptures and miniature paintings.Naresh (Maharaja of Banaras)...",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "bharat-kala-bhavan",
      "bharat-kala-bhavan-archeological-museum"
    ]
  },
  "varanasi:deena-chaat-bhandar-tamatar-chaat-and-gulab-jamun": {
    imageUrl: "/images/places/varanasi/deena-chaat-bhandar.webp",
    visualDescription: "Legendary street food stall in Godowlia known for authentic Banarasi Tamatar Chaat served in clay purwas.varieties of thick creamy curd lassi toppe...",
    category: "Local Food",
    semanticTheme: "nature",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "deena-chaat-bhandar",
      "deena-chaat-bhandar-tamatar-chaat-and-gulab-jamun",
      "gulab-jamun",
      "tamatar-chaat"
    ]
  },
  "varanasi:kashi-chat-bhandar-godowlia-chowk": {
    imageUrl: "/images/places/varanasi/kashi-chat-bhandar.webp",
    visualDescription: "Varanasi's most celebrated chaat house, famous for its signature Tamatar Chaat (pureed spiced tomatoes and mawa served bubbling hot in kulhad), pal...",
    category: "Local Food",
    semanticTheme: "shopping",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "godowlia-chowk",
      "kashi-chat-bhandar",
      "kashi-chat-bhandar-godowlia-chowk"
    ]
  },
  "varanasi:tulsi-manas-white-marble-temple": {
    imageUrl: "/images/places/varanasi/tulsi-manas-temple.webp",
    visualDescription: "A pristine white marble temple built at the site where Goswami Tulsidas composed the Ramcharitmanas, with the entire epic engraved upon marble walls.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "tulsi-manas-temple",
      "tulsi-manas-white-marble-temple"
    ]
  },
  "varanasi:sankat-mochan-hanuman-temple-and-besan-laddoos": {
    imageUrl: "/images/places/varanasi/sankat-mochan-temple.webp",
    visualDescription: "A sacred shrine founded by Tulsidas in the 16th century dedicated to Lord Hanuman, world-famous for pure desi ghee besan laddoos and peaceful gardens.",
    category: "Culture & Heritage",
    semanticTheme: "spiritual",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "besan-laddoos",
      "sankat-mochan-hanuman-temple",
      "sankat-mochan-hanuman-temple-and-besan-laddoos",
      "sankat-mochan-temple"
    ]
  },
  "varanasi:chet-singh-fort-and-river-ramparts": {
    imageUrl: "/images/places/varanasi/chet-singh-fort-ghat.webp",
    visualDescription: "A fortified 18th-century palace built by Maharaja Chet Singh overlooking the Ganga where the historic battle against Warren Hastings took place.",
    category: "Culture & Heritage",
    semanticTheme: "heritage",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "chet-singh-fort",
      "chet-singh-fort-and-river-ramparts",
      "chet-singh-fort-ghat",
      "river-ramparts"
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
    imageUrl: "/images/places/varanasi/stays/brijrama-palace.webp",
    visualDescription: "Verified property artwork for BrijRama Palace Heritage Grand in Varanasi.",
    category: "Stays & Sanctuaries",
    hotelStyle: "18th-Century Ghat Palace",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      "brijrama-palace",
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
  "agra:chini-ka-rauza-persian-glazed-tile-tomb": "agra:chini-ka-rauza-persian-glazed-tile-tomb",
  "agra:hero": "agra:chini-ka-rauza-persian-glazed-tile-tomb",
  "agra:chini-ka-rauza": "agra:chini-ka-rauza-persian-glazed-tile-tomb",
  "agra:persian-glazed-tile-tomb": "agra:chini-ka-rauza-persian-glazed-tile-tomb",
  "agra:mariam-uz-zamani-tomb-empress-jodha-bai": "agra:mariam-uz-zamani-tomb-empress-jodha-bai",
  "agra:mariams-tomb-sikandra": "agra:mariam-uz-zamani-tomb-empress-jodha-bai",
  "agra:empress-jodha-bai": "agra:mariam-uz-zamani-tomb-empress-jodha-bai",
  "agra:mariam-uz-zamani-tomb": "agra:mariam-uz-zamani-tomb-empress-jodha-bai",
  "agra:kinari-bazaar-heritage-zardozi-and-spice-market": "agra:kinari-bazaar-heritage-zardozi-and-spice-market",
  "agra:kinari-bazaar-crafts": "agra:kinari-bazaar-heritage-zardozi-and-spice-market",
  "agra:kinari-bazaar-heritage-zardozi": "agra:kinari-bazaar-heritage-zardozi-and-spice-market",
  "agra:spice-market": "agra:kinari-bazaar-heritage-zardozi-and-spice-market",
  "agra:soor-sarovar-bird-sanctuary-and-keetham-lake": "agra:soor-sarovar-bird-sanctuary-and-keetham-lake",
  "agra:soor-sarovar-lake": "agra:soor-sarovar-bird-sanctuary-and-keetham-lake",
  "agra:keetham-lake": "agra:soor-sarovar-bird-sanctuary-and-keetham-lake",
  "agra:soor-sarovar-bird-sanctuary": "agra:soor-sarovar-bird-sanctuary-and-keetham-lake",
  "agra:taj-nature-walk-forest-ridge-trail": "agra:taj-nature-walk-forest-ridge-trail",
  "agra:taj-nature-walk-ridge": "agra:taj-nature-walk-forest-ridge-trail",
  "agra:aram-bagh-babur-1528-charbagh-garden": "agra:aram-bagh-babur-1528-charbagh-garden",
  "agra:ram-bagh-gardens": "agra:aram-bagh-babur-1528-charbagh-garden",
  "agra:aram-bagh": "agra:aram-bagh-babur-1528-charbagh-garden",
  "agra:babur-1528-charbagh-garden": "agra:aram-bagh-babur-1528-charbagh-garden",
  "agra:dasaprakash-heritage-south-indian-dining": "agra:dasaprakash-heritage-south-indian-dining",
  "agra:dasaprakash-agra-cantt": "agra:dasaprakash-heritage-south-indian-dining",
  "agra:dasaprakash-cantt": "agra:dasaprakash-heritage-south-indian-dining",
  "agra:korai-tribal-craft-village-en-route-fatehpur": "agra:korai-tribal-craft-village-en-route-fatehpur",
  "agra:korai-rural-village": "agra:korai-tribal-craft-village-en-route-fatehpur",
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
  "alwar-siliserh:city-palace-alwar": "alwar-siliserh:alwar-city-palace-vinay-vilas-mahal",
  "alwar-siliserh:city-palace-alwar-siliserh": "alwar-siliserh:alwar-city-palace-vinay-vilas-mahal",
  "alwar-siliserh:city-palace-of-alwar": "alwar-siliserh:alwar-city-palace-vinay-vilas-mahal",
  "alwar-siliserh:city-palace-of-alwar-siliserh": "alwar-siliserh:alwar-city-palace-vinay-vilas-mahal",
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
  "alwar-siliserh:sagar-water-kund-and-royal-bathing-stepped-ghats": "alwar-siliserh:sagar-water-kund-and-royal-bathing-stepped-ghats",
  "alwar-siliserh:sagar-water-reservoir": "alwar-siliserh:sagar-water-kund-and-royal-bathing-stepped-ghats",
  "alwar-siliserh:royal-bathing-stepped-ghats": "alwar-siliserh:sagar-water-kund-and-royal-bathing-stepped-ghats",
  "alwar-siliserh:sagar-water-kund": "alwar-siliserh:sagar-water-kund-and-royal-bathing-stepped-ghats",
  "alwar-siliserh:purjan-vihar-company-garden-british-oasis": "alwar-siliserh:purjan-vihar-company-garden-british-oasis",
  "alwar-siliserh:hero": "alwar-siliserh:purjan-vihar-company-garden-british-oasis",
  "alwar-siliserh:company-garden-british-oasis": "alwar-siliserh:purjan-vihar-company-garden-british-oasis",
  "alwar-siliserh:purjan-vihar": "alwar-siliserh:purjan-vihar-company-garden-british-oasis",
  "alwar-siliserh:tijara-atishaya-kshetra-jain-tirtha": "alwar-siliserh:tijara-atishaya-kshetra-jain-tirtha",
  "alwar-siliserh:tijara-jain-temple": "alwar-siliserh:tijara-atishaya-kshetra-jain-tirtha",
  "alwar-siliserh:talvriksha-sacred-springs-and-mandavya-hermitage": "alwar-siliserh:talvriksha-sacred-springs-and-mandavya-hermitage",
  "alwar-siliserh:talvriksha-hot-springs": "alwar-siliserh:talvriksha-sacred-springs-and-mandavya-hermitage",
  "alwar-siliserh:mandavya-hermitage": "alwar-siliserh:talvriksha-sacred-springs-and-mandavya-hermitage",
  "alwar-siliserh:talvriksha-sacred-springs": "alwar-siliserh:talvriksha-sacred-springs-and-mandavya-hermitage",
  "alwar-siliserh:vijay-mandir-palace-and-sita-ram-temple": "alwar-siliserh:vijay-mandir-palace-and-sita-ram-temple",
  "alwar-siliserh:vijay-mandir-palace": "alwar-siliserh:vijay-mandir-palace-and-sita-ram-temple",
  "alwar-siliserh:sita-ram-temple": "alwar-siliserh:vijay-mandir-palace-and-sita-ram-temple",
  "alwar-siliserh:neelkanth-mahadev-ancient-hilltop-sanctuary": "alwar-siliserh:neelkanth-mahadev-ancient-hilltop-sanctuary",
  "alwar-siliserh:neelkanth-mahadev-alwar": "alwar-siliserh:neelkanth-mahadev-ancient-hilltop-sanctuary",
  "alwar-siliserh:hope-circus-heritage-market-and-clock-tower": "alwar-siliserh:hope-circus-heritage-market-and-clock-tower",
  "alwar-siliserh:hope-circus-bazaar": "alwar-siliserh:hope-circus-heritage-market-and-clock-tower",
  "alwar-siliserh:clock-tower": "alwar-siliserh:hope-circus-heritage-market-and-clock-tower",
  "alwar-siliserh:hope-circus-heritage-market": "alwar-siliserh:hope-circus-heritage-market-and-clock-tower",
  "alwar-siliserh:kalakand-gali-mawa-artisans-street": "alwar-siliserh:kalakand-gali-mawa-artisans-street",
  "alwar-siliserh:kalakand-gali-food": "alwar-siliserh:kalakand-gali-mawa-artisans-street",
  "alwar-siliserh:kalakand-gali": "alwar-siliserh:kalakand-gali-mawa-artisans-street",
  "alwar-siliserh:mawa-artisans-street": "alwar-siliserh:kalakand-gali-mawa-artisans-street",
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
  "chandigarh:japanese-garden-sector-31-zen-sanctuary": "chandigarh:japanese-garden-sector-31-zen-sanctuary",
  "chandigarh:japanese-garden-sec31": "chandigarh:japanese-garden-sector-31-zen-sanctuary",
  "chandigarh:terraced-garden-and-musical-water-cascade": "chandigarh:terraced-garden-and-musical-water-cascade",
  "chandigarh:terraced-garden-sec33": "chandigarh:terraced-garden-and-musical-water-cascade",
  "chandigarh:musical-water-cascade": "chandigarh:terraced-garden-and-musical-water-cascade",
  "chandigarh:terraced-garden": "chandigarh:terraced-garden-and-musical-water-cascade",
  "chandigarh:government-museum-and-art-gallery-sector-10": "chandigarh:government-museum-and-art-gallery-sector-10",
  "chandigarh:government-museum-sec10": "chandigarh:government-museum-and-art-gallery-sector-10",
  "chandigarh:art-gallery-sector-10": "chandigarh:government-museum-and-art-gallery-sector-10",
  "chandigarh:government-museum": "chandigarh:government-museum-and-art-gallery-sector-10",
  "chandigarh:national-cactus-and-succulent-botanical-garden": "chandigarh:national-cactus-and-succulent-botanical-garden",
  "chandigarh:cactus-garden-panchkula": "chandigarh:national-cactus-and-succulent-botanical-garden",
  "chandigarh:open-hand-monument-symbol-of-peace-and-giving": "chandigarh:open-hand-monument-symbol-of-peace-and-giving",
  "chandigarh:open-hand-monument": "chandigarh:open-hand-monument-symbol-of-peace-and-giving",
  "chandigarh:giving": "chandigarh:open-hand-monument-symbol-of-peace-and-giving",
  "chandigarh:symbol-of-peace": "chandigarh:open-hand-monument-symbol-of-peace-and-giving",
  "chandigarh:yadavindra-gardens-pinjore-17th-century-mughal-terraces": "chandigarh:yadavindra-gardens-pinjore-17th-century-mughal-terraces",
  "chandigarh:pinjore-yadavindra-gardens": "chandigarh:yadavindra-gardens-pinjore-17th-century-mughal-terraces",
  "chandigarh:17th-century-mughal-terraces": "chandigarh:yadavindra-gardens-pinjore-17th-century-mughal-terraces",
  "chandigarh:yadavindra-gardens-pinjore": "chandigarh:yadavindra-gardens-pinjore-17th-century-mughal-terraces",
  "chandigarh:sindhi-sweets-sector-17-chole-bhature-hub": "chandigarh:sindhi-sweets-sector-17-chole-bhature-hub",
  "chandigarh:sindhi-sweets-sec17": "chandigarh:sindhi-sweets-sector-17-chole-bhature-hub",
  "chandigarh:timber-trail-mountain-cable-car-shivalik-gorge": "chandigarh:timber-trail-mountain-cable-car-shivalik-gorge",
  "chandigarh:timber-trail-ropeway-base": "chandigarh:timber-trail-mountain-cable-car-shivalik-gorge",
  "chandigarh:shivalik-gorge": "chandigarh:timber-trail-mountain-cable-car-shivalik-gorge",
  "chandigarh:timber-trail-mountain-cable-car": "chandigarh:timber-trail-mountain-cable-car-shivalik-gorge",
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
  "damdama-sohna:camp-mustang-aravalli-obstacle-base": "damdama-sohna:camp-mustang-aravalli-obstacle-base",
  "damdama-sohna:camp-mustang-adventure": "damdama-sohna:camp-mustang-aravalli-obstacle-base",
  "damdama-sohna:badkhal-aravalli-ridge-mountain-drive": "damdama-sohna:badkhal-aravalli-ridge-mountain-drive",
  "damdama-sohna:badkhal-ridge-lake-drive": "damdama-sohna:badkhal-aravalli-ridge-mountain-drive",
  "damdama-sohna:lost-lake-hidden-aravalli-water-reservoir": "damdama-sohna:lost-lake-hidden-aravalli-water-reservoir",
  "damdama-sohna:lost-lake-damdama-trail": "damdama-sohna:lost-lake-hidden-aravalli-water-reservoir",
  "damdama-sohna:hidden-aravalli-water-reservoir": "damdama-sohna:lost-lake-hidden-aravalli-water-reservoir",
  "damdama-sohna:lost-lake": "damdama-sohna:lost-lake-hidden-aravalli-water-reservoir",
  "damdama-sohna:bhondsi-nature-park-and-bhuvneshwari-devi-grove": "damdama-sohna:bhondsi-nature-park-and-bhuvneshwari-devi-grove",
  "damdama-sohna:bhondsi-eco-park": "damdama-sohna:bhondsi-nature-park-and-bhuvneshwari-devi-grove",
  "damdama-sohna:bhondsi-nature-park": "damdama-sohna:bhondsi-nature-park-and-bhuvneshwari-devi-grove",
  "damdama-sohna:bhuvneshwari-devi-grove": "damdama-sohna:bhondsi-nature-park-and-bhuvneshwari-devi-grove",
  "damdama-sohna:aravalli-hills-footprint-and-golf-glades": "damdama-sohna:aravalli-hills-footprint-and-golf-glades",
  "damdama-sohna:aravalli-golf-greens": "damdama-sohna:aravalli-hills-footprint-and-golf-glades",
  "damdama-sohna:aravalli-hills-footprint": "damdama-sohna:aravalli-hills-footprint-and-golf-glades",
  "damdama-sohna:golf-glades": "damdama-sohna:aravalli-hills-footprint-and-golf-glades",
  "damdama-sohna:historic-sohna-vintage-car-circuit-trail": "damdama-sohna:historic-sohna-vintage-car-circuit-trail",
  "damdama-sohna:sohna-car-rally-trail": "damdama-sohna:historic-sohna-vintage-car-circuit-trail",
  "damdama-sohna:mangar-bani-sacred-forest-and-wildlife-corridor": "damdama-sohna:mangar-bani-sacred-forest-and-wildlife-corridor",
  "damdama-sohna:leopold-aravalli-sanctuary": "damdama-sohna:mangar-bani-sacred-forest-and-wildlife-corridor",
  "damdama-sohna:mangar-bani-sacred-forest": "damdama-sohna:mangar-bani-sacred-forest-and-wildlife-corridor",
  "damdama-sohna:wildlife-corridor": "damdama-sohna:mangar-bani-sacred-forest-and-wildlife-corridor",
  "damdama-sohna:tau-devi-lal-botanical-park-and-butterfly-garden": "damdama-sohna:tau-devi-lal-botanical-park-and-butterfly-garden",
  "damdama-sohna:tau-devi-lal-bio-park": "damdama-sohna:tau-devi-lal-botanical-park-and-butterfly-garden",
  "damdama-sohna:butterfly-garden": "damdama-sohna:tau-devi-lal-botanical-park-and-butterfly-garden",
  "damdama-sohna:tau-devi-lal-botanical-park": "damdama-sohna:tau-devi-lal-botanical-park-and-butterfly-garden",
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
  "dehradun:paltan-bazaar-and-1953-ghanta-ghar-clock-tower": "dehradun:paltan-bazaar-and-1953-ghanta-ghar-clock-tower",
  "dehradun:hero": "dehradun:paltan-bazaar-and-1953-ghanta-ghar-clock-tower",
  "dehradun:1953-ghanta-ghar-clock-tower": "dehradun:paltan-bazaar-and-1953-ghanta-ghar-clock-tower",
  "dehradun:paltan-bazaar": "dehradun:paltan-bazaar-and-1953-ghanta-ghar-clock-tower",
  "dehradun:khalanga-war-memorial-british-tribute-to-gurkha-bravery": "dehradun:khalanga-war-memorial-british-tribute-to-gurkha-bravery",
  "dehradun:khalanga-war-memorial": "dehradun:khalanga-war-memorial-british-tribute-to-gurkha-bravery",
  "dehradun:british-tribute-to-gurkha-bravery": "dehradun:khalanga-war-memorial-british-tribute-to-gurkha-bravery",
  "dehradun:shikhar-fall-woodland-cascade-and-stream": "dehradun:shikhar-fall-woodland-cascade-and-stream",
  "dehradun:shikhar-fall-trail": "dehradun:shikhar-fall-woodland-cascade-and-stream",
  "dehradun:shikhar-fall-woodland-cascade": "dehradun:shikhar-fall-woodland-cascade-and-stream",
  "dehradun:stream": "dehradun:shikhar-fall-woodland-cascade-and-stream",
  "dehradun:lachhiwala-nature-park-and-stream-pools": "dehradun:lachhiwala-nature-park-and-stream-pools",
  "dehradun:lachhiwala-nature-park": "dehradun:lachhiwala-nature-park-and-stream-pools",
  "dehradun:stream-pools": "dehradun:lachhiwala-nature-park-and-stream-pools",
  "dehradun:maldevta-pebble-riverbed-and-camping-meadows": "dehradun:maldevta-pebble-riverbed-and-camping-meadows",
  "dehradun:maldevta-riverside-meadows": "dehradun:maldevta-pebble-riverbed-and-camping-meadows",
  "dehradun:camping-meadows": "dehradun:maldevta-pebble-riverbed-and-camping-meadows",
  "dehradun:maldevta-pebble-riverbed": "dehradun:maldevta-pebble-riverbed-and-camping-meadows",
  "dehradun:kumar-sweets-and-confectioners-kumaoni-bal-mithai": "dehradun:kumar-sweets-and-confectioners-kumaoni-bal-mithai",
  "dehradun:kumar-sweets-legend": "dehradun:kumar-sweets-and-confectioners-kumaoni-bal-mithai",
  "dehradun:confectioners": "dehradun:kumar-sweets-and-confectioners-kumaoni-bal-mithai",
  "dehradun:kumaoni-bal-mithai": "dehradun:kumar-sweets-and-confectioners-kumaoni-bal-mithai",
  "dehradun:kumar-sweets": "dehradun:kumar-sweets-and-confectioners-kumaoni-bal-mithai",
  "dehradun:kalsi-ashokan-rock-edict-3rd-century-bce": "dehradun:kalsi-ashokan-rock-edict-3rd-century-bce",
  "dehradun:kalsi-ashoka-rock-edict": "dehradun:kalsi-ashokan-rock-edict-3rd-century-bce",
  "dehradun:3rd-century-bce": "dehradun:kalsi-ashokan-rock-edict-3rd-century-bce",
  "dehradun:kalsi-ashokan-rock-edict": "dehradun:kalsi-ashokan-rock-edict-3rd-century-bce",
  "dehradun:asan-barrage-bird-sanctuary-and-wetland-reserve": "dehradun:asan-barrage-bird-sanctuary-and-wetland-reserve",
  "dehradun:asani-barrage-wetland": "dehradun:asan-barrage-bird-sanctuary-and-wetland-reserve",
  "dehradun:asan-barrage-bird-sanctuary": "dehradun:asan-barrage-bird-sanctuary-and-wetland-reserve",
  "dehradun:wetland-reserve": "dehradun:asan-barrage-bird-sanctuary-and-wetland-reserve",
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
  "dharamshala:kangra-fort-ancient-4th-century-bce-citadel": "dharamshala:kangra-fort-ancient-4th-century-bce-citadel",
  "dharamshala:kangra-fort": "dharamshala:kangra-fort-ancient-4th-century-bce-citadel",
  "dharamshala:ancient-4th-century-bce-citadel": "dharamshala:kangra-fort-ancient-4th-century-bce-citadel",
  "dharamshala:gyuto-monastery-tantric-chanting-and-karmapa-seat": "dharamshala:gyuto-monastery-tantric-chanting-and-karmapa-seat",
  "dharamshala:gyuto-monastery": "dharamshala:gyuto-monastery-tantric-chanting-and-karmapa-seat",
  "dharamshala:karmapa-seat": "dharamshala:gyuto-monastery-tantric-chanting-and-karmapa-seat",
  "dharamshala:tantric-chanting": "dharamshala:gyuto-monastery-tantric-chanting-and-karmapa-seat",
  "dharamshala:naddi-village-dhauladhar-sunset-crest": "dharamshala:naddi-village-dhauladhar-sunset-crest",
  "dharamshala:triund-trek": "dharamshala:triund-trek",
  "dharamshala:kareri-glacial-lake-trailhead-ghera-base": "dharamshala:kareri-glacial-lake-trailhead-ghera-base",
  "dharamshala:bhagsunag-waterfall": "dharamshala:bhagsunag-waterfall",
  "dharamshala:ghera-base": "dharamshala:kareri-glacial-lake-trailhead-ghera-base",
  "dharamshala:kareri-glacial-lake-trailhead": "dharamshala:kareri-glacial-lake-trailhead-ghera-base",
  "dharamshala:dal-lake-dharamshala-and-sacred-deodar-groves": "dharamshala:dal-lake-dharamshala-and-sacred-deodar-groves",
  "dharamshala:dal-lake-dharamshala": "dharamshala:dal-lake-dharamshala-and-sacred-deodar-groves",
  "dharamshala:dal-lake": "dharamshala:dal-lake-dharamshala-and-sacred-deodar-groves",
  "dharamshala:sacred-deodar-groves": "dharamshala:dal-lake-dharamshala-and-sacred-deodar-groves",
  "dharamshala:tibetan-butter-tea-and-tingmo-bakery-lane": "dharamshala:tibetan-butter-tea-and-tingmo-bakery-lane",
  "dharamshala:tibetan-butter-tea": "dharamshala:tibetan-butter-tea-and-tingmo-bakery-lane",
  "dharamshala:tingmo-bakery-lane": "dharamshala:tibetan-butter-tea-and-tingmo-bakery-lane",
  "dharamshala:masroor-monolithic-rock-cut-temples-8th-century": "dharamshala:masroor-monolithic-rock-cut-temples-8th-century",
  "dharamshala:masroor-rock-temples": "dharamshala:masroor-monolithic-rock-cut-temples-8th-century",
  "dharamshala:8th-century": "dharamshala:masroor-monolithic-rock-cut-temples-8th-century",
  "dharamshala:masroor-monolithic-rock-cut-temples": "dharamshala:masroor-monolithic-rock-cut-temples-8th-century",
  "dharamshala:tashi-jong-buddhist-craft-community-and-stupas": "dharamshala:tashi-jong-buddhist-craft-community-and-stupas",
  "dharamshala:tashi-jong-monastery": "dharamshala:tashi-jong-buddhist-craft-community-and-stupas",
  "dharamshala:stupas": "dharamshala:tashi-jong-buddhist-craft-community-and-stupas",
  "dharamshala:tashi-jong-buddhist-craft-community": "dharamshala:tashi-jong-buddhist-craft-community-and-stupas",
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
  "goa:basilica-of-bom-jesus-unesco-world-heritage": "goa:basilica-of-bom-jesus-unesco-world-heritage",
  "goa:basilica-bom-jesus": "goa:basilica-of-bom-jesus-unesco-world-heritage",
  "goa:basilica-of-bom-jesus": "goa:basilica-of-bom-jesus-unesco-world-heritage",
  "goa:unesco-world-heritage": "goa:basilica-of-bom-jesus-unesco-world-heritage",
  "goa:arambol-sweet-water-lagoon-and-banyan-tree-trail": "goa:arambol-sweet-water-lagoon-and-banyan-tree-trail",
  "goa:arambol-sweet-lake": "goa:arambol-sweet-water-lagoon-and-banyan-tree-trail",
  "goa:arambol-sweet-water-lagoon": "goa:arambol-sweet-water-lagoon-and-banyan-tree-trail",
  "goa:banyan-tree-trail": "goa:arambol-sweet-water-lagoon-and-banyan-tree-trail",
  "goa:reis-magos-fort-and-mandovi-estuary": "goa:reis-magos-fort-and-mandovi-estuary",
  "goa:reis-magos-fort": "goa:reis-magos-fort-and-mandovi-estuary",
  "goa:mandovi-estuary": "goa:reis-magos-fort-and-mandovi-estuary",
  "goa:palolem-crescent-beach-and-butterfly-island": "goa:palolem-crescent-beach-and-butterfly-island",
  "goa:palolem-beach": "goa:palolem-crescent-beach-and-butterfly-island",
  "goa:butterfly-island": "goa:palolem-crescent-beach-and-butterfly-island",
  "goa:palolem-crescent-beach": "goa:palolem-crescent-beach-and-butterfly-island",
  "goa:baba-au-rhum-french-bamboo-garden": "goa:baba-au-rhum-french-bamboo-garden",
  "goa:baba-au-rhum-cafe": "goa:baba-au-rhum-french-bamboo-garden",
  "goa:gunpowder-assagao-heritage-peninsular-dining": "goa:gunpowder-assagao-heritage-peninsular-dining",
  "goa:gunpowder-assagao": "goa:gunpowder-assagao-heritage-peninsular-dining",
  "goa:fort-aguada-and-1864-portuguese-lighthouse": "goa:fort-aguada-and-1864-portuguese-lighthouse",
  "goa:aguada-fort": "goa:fort-aguada-and-1864-portuguese-lighthouse",
  "goa:1864-portuguese-lighthouse": "goa:fort-aguada-and-1864-portuguese-lighthouse",
  "goa:fort-aguada": "goa:fort-aguada-and-1864-portuguese-lighthouse",
  "goa:anjuna-rocky-beach-cove-and-curlies-point": "goa:anjuna-rocky-beach-cove-and-curlies-point",
  "goa:anjuna-beach-cove": "goa:anjuna-rocky-beach-cove-and-curlies-point",
  "goa:anjuna-rocky-beach-cove": "goa:anjuna-rocky-beach-cove-and-curlies-point",
  "goa:curlies-point": "goa:anjuna-rocky-beach-cove-and-curlies-point",
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
  "jaipur:jaipur-city-palace": "jaipur:jaipur-city-palace-and-chandra-mahal",
  "jaipur:laxmi-misthan-bhandar-lmb-1727": "jaipur:laxmi-misthan-bhandar-lmb-1727",
  "jaipur:lmb-sweets": "jaipur:laxmi-misthan-bhandar-lmb-1727",
  "jaipur:laxmi-misthan-bhandar": "jaipur:laxmi-misthan-bhandar-lmb-1727",
  "jaipur:lmb-1727": "jaipur:laxmi-misthan-bhandar-lmb-1727",
  "jaipur:anokhi-museum-of-hand-printing": "jaipur:anokhi-museum-of-hand-printing",
  "jaipur:anokhi-museum": "jaipur:anokhi-museum-of-hand-printing",
  "jaipur:tapri-central-rooftop-tea-lounge": "jaipur:tapri-central-rooftop-tea-lounge",
  "jaipur:tapri-central": "jaipur:tapri-central-rooftop-tea-lounge",
  "jaipur:jantar-mantar-unesco-astronomical-observatory": "jaipur:jantar-mantar-unesco-astronomical-observatory",
  "jaipur:jantar-mantar": "jaipur:jantar-mantar-unesco-astronomical-observatory",
  "jaipur:jaigarh-fort-and-jaivana-royal-cannon": "jaipur:jaigarh-fort-and-jaivana-royal-cannon",
  "jaipur:jaigarh-fort": "jaipur:jaigarh-fort-and-jaivana-royal-cannon",
  "jaipur:jaivana-royal-cannon": "jaipur:jaigarh-fort-and-jaivana-royal-cannon",
  "jaipur:jal-mahal-the-floating-water-palace": "jaipur:jal-mahal-the-floating-water-palace",
  "jaipur:jal-mahal": "jaipur:jal-mahal-the-floating-water-palace",
  "jaipur:the-floating-water-palace": "jaipur:jal-mahal-the-floating-water-palace",
  "jaipur:galta-ji-the-sacred-monkey-temple-and-kunds": "jaipur:galta-ji-the-sacred-monkey-temple-and-kunds",
  "jaipur:galta-ji-temple": "jaipur:galta-ji-the-sacred-monkey-temple-and-kunds",
  "jaipur:galta-ji": "jaipur:galta-ji-the-sacred-monkey-temple-and-kunds",
  "jaipur:kunds": "jaipur:galta-ji-the-sacred-monkey-temple-and-kunds",
  "jaipur:the-sacred-monkey-temple": "jaipur:galta-ji-the-sacred-monkey-temple-and-kunds",
  "jaipur:albert-hall-state-museum-indo-saracenic": "jaipur:albert-hall-state-museum-indo-saracenic",
  "jaipur:albert-hall-museum": "jaipur:albert-hall-state-museum-indo-saracenic",
  "jaipur:albert-hall-state-museum": "jaipur:albert-hall-state-museum-indo-saracenic",
  "jaipur:indo-saracenic": "jaipur:albert-hall-state-museum-indo-saracenic",
  "jaipur:patrika-gate-and-jawahar-circle-garden": "jaipur:patrika-gate-and-jawahar-circle-garden",
  "jaipur:patrika-gate": "jaipur:patrika-gate-and-jawahar-circle-garden",
  "jaipur:jawahar-circle-garden": "jaipur:patrika-gate-and-jawahar-circle-garden",
  "jaipur:rawat-mishthan-bhandar-original-pyaaz-kachori": "jaipur:rawat-mishthan-bhandar-original-pyaaz-kachori",
  "jaipur:rawat-mishthan-bhandar": "jaipur:rawat-mishthan-bhandar-original-pyaaz-kachori",
  "jaipur:original-pyaaz-kachori": "jaipur:rawat-mishthan-bhandar-original-pyaaz-kachori",
  "jaipur:wind-view-cafe-hawa-mahal-eye-level-terrace": "jaipur:wind-view-cafe-hawa-mahal-eye-level-terrace",
  "jaipur:wind-view-cafe": "jaipur:wind-view-cafe-hawa-mahal-eye-level-terrace",
  "jaipur:hawa-mahal-eye-level-terrace": "jaipur:wind-view-cafe-hawa-mahal-eye-level-terrace",
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
  "jaisalmer:bada-bagh-royal-cenotaphs-and-desert-windmills": "jaisalmer:bada-bagh-royal-cenotaphs-and-desert-windmills",
  "jaisalmer:bada-bagh-chhatris": "jaisalmer:bada-bagh-royal-cenotaphs-and-desert-windmills",
  "jaisalmer:bada-bagh": "jaisalmer:bada-bagh-royal-cenotaphs-and-desert-windmills",
  "jaisalmer:desert-windmills": "jaisalmer:bada-bagh-royal-cenotaphs-and-desert-windmills",
  "jaisalmer:royal-cenotaphs": "jaisalmer:bada-bagh-royal-cenotaphs-and-desert-windmills",
  "jaisalmer:khuri-village-quiet-sand-dunes-and-mud-homestays": "jaisalmer:khuri-village-quiet-sand-dunes-and-mud-homestays",
  "jaisalmer:khuri-desert-sand-dunes": "jaisalmer:khuri-village-quiet-sand-dunes-and-mud-homestays",
  "jaisalmer:khuri-village": "jaisalmer:khuri-village-quiet-sand-dunes-and-mud-homestays",
  "jaisalmer:mud-homestays": "jaisalmer:khuri-village-quiet-sand-dunes-and-mud-homestays",
  "jaisalmer:quiet-sand-dunes": "jaisalmer:khuri-village-quiet-sand-dunes-and-mud-homestays",
  "jaisalmer:tanot-mata-temple-the-miraculous-indo-pak-border-shrine": "jaisalmer:tanot-mata-temple-the-miraculous-indo-pak-border-shrine",
  "jaisalmer:tanot-mata-temple": "jaisalmer:tanot-mata-temple-the-miraculous-indo-pak-border-shrine",
  "jaisalmer:the-miraculous-indo-pak-border-shrine": "jaisalmer:tanot-mata-temple-the-miraculous-indo-pak-border-shrine",
  "jaisalmer:desert-national-park-great-indian-bustard-safari": "jaisalmer:desert-national-park-great-indian-bustard-safari",
  "jaisalmer:desert-national-park-safari": "jaisalmer:desert-national-park-great-indian-bustard-safari",
  "jaisalmer:desert-national-park": "jaisalmer:desert-national-park-great-indian-bustard-safari",
  "jaisalmer:great-indian-bustard-safari": "jaisalmer:desert-national-park-great-indian-bustard-safari",
  "jaisalmer:lodurva-ancient-capital-and-kalpavriksha-wish-tree": "jaisalmer:lodurva-ancient-capital-and-kalpavriksha-wish-tree",
  "jaisalmer:lodurva-jain-temple": "jaisalmer:lodurva-ancient-capital-and-kalpavriksha-wish-tree",
  "jaisalmer:kalpavriksha-wish-tree": "jaisalmer:lodurva-ancient-capital-and-kalpavriksha-wish-tree",
  "jaisalmer:lodurva-ancient-capital": "jaisalmer:lodurva-ancient-capital-and-kalpavriksha-wish-tree",
  "jaisalmer:vyas-chhatri-sage-vyas-sandstone-cenotaph": "jaisalmer:vyas-chhatri-sage-vyas-sandstone-cenotaph",
  "jaisalmer:vyas-chhatri-sunset-point": "jaisalmer:vyas-chhatri-sage-vyas-sandstone-cenotaph",
  "jaisalmer:sage-vyas-sandstone-cenotaph": "jaisalmer:vyas-chhatri-sage-vyas-sandstone-cenotaph",
  "jaisalmer:vyas-chhatri": "jaisalmer:vyas-chhatri-sage-vyas-sandstone-cenotaph",
  "jaisalmer:surya-kishore-authentic-dal-baati-churma": "jaisalmer:surya-kishore-authentic-dal-baati-churma",
  "jaisalmer:surya-kishore-rooftop": "jaisalmer:surya-kishore-authentic-dal-baati-churma",
  "jaisalmer:desert-cultural-centre-and-folk-puppetry-museum": "jaisalmer:desert-cultural-centre-and-folk-puppetry-museum",
  "jaisalmer:desert-cultural-centre-museum": "jaisalmer:desert-cultural-centre-and-folk-puppetry-museum",
  "jaisalmer:desert-cultural-centre": "jaisalmer:desert-cultural-centre-and-folk-puppetry-museum",
  "jaisalmer:folk-puppetry-museum": "jaisalmer:desert-cultural-centre-and-folk-puppetry-museum",
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
  "kainchi-dham:pangot-oak-forest-and-himalayan-birding-sanctuary": "kainchi-dham:pangot-oak-forest-and-himalayan-birding-sanctuary",
  "kainchi-dham:pangot-birding-sanctuary": "kainchi-dham:pangot-oak-forest-and-himalayan-birding-sanctuary",
  "kainchi-dham:himalayan-birding-sanctuary": "kainchi-dham:pangot-oak-forest-and-himalayan-birding-sanctuary",
  "kainchi-dham:pangot-oak-forest": "kainchi-dham:pangot-oak-forest-and-himalayan-birding-sanctuary",
  "kainchi-dham:mukteshwar-dham-350-year-hilltop-shiva-temple": "kainchi-dham:mukteshwar-dham-350-year-hilltop-shiva-temple",
  "kainchi-dham:mukteshwar-dham-shiva-temple": "kainchi-dham:mukteshwar-dham-350-year-hilltop-shiva-temple",
  "kainchi-dham:chauli-ki-jali-vertical-mountain-ridge-and-sunset-crag": "kainchi-dham:chauli-ki-jali-vertical-mountain-ridge-and-sunset-crag",
  "kainchi-dham:chauli-ki-jali-cliffs": "kainchi-dham:chauli-ki-jali-vertical-mountain-ridge-and-sunset-crag",
  "kainchi-dham:chauli-ki-jali": "kainchi-dham:chauli-ki-jali-vertical-mountain-ridge-and-sunset-crag",
  "kainchi-dham:sunset-crag": "kainchi-dham:chauli-ki-jali-vertical-mountain-ridge-and-sunset-crag",
  "kainchi-dham:vertical-mountain-ridge": "kainchi-dham:chauli-ki-jali-vertical-mountain-ridge-and-sunset-crag",
  "kainchi-dham:hidimba-parvat-pine-forest-trail": "kainchi-dham:hidimba-parvat-pine-forest-trail",
  "kainchi-dham:hidimba-parvat-trek": "kainchi-dham:hidimba-parvat-pine-forest-trail",
  "kainchi-dham:chaubatia-apple-and-apricot-research-orchards": "kainchi-dham:chaubatia-apple-and-apricot-research-orchards",
  "kainchi-dham:ranikhet-chaubatia-orchards": "kainchi-dham:chaubatia-apple-and-apricot-research-orchards",
  "kainchi-dham:apricot-research-orchards": "kainchi-dham:chaubatia-apple-and-apricot-research-orchards",
  "kainchi-dham:chaubatia-apple": "kainchi-dham:chaubatia-apple-and-apricot-research-orchards",
  "kainchi-dham:karkotak-nag-mandir-hilltop-crest": "kainchi-dham:karkotak-nag-mandir-hilltop-crest",
  "kainchi-dham:karkotak-nag-mandir": "kainchi-dham:karkotak-nag-mandir-hilltop-crest",
  "kainchi-dham:kamal-tal-the-secluded-lotus-lake-of-naukuchiatal": "kainchi-dham:kamal-tal-the-secluded-lotus-lake-of-naukuchiatal",
  "kainchi-dham:kamal-tal-lotus-lake": "kainchi-dham:kamal-tal-the-secluded-lotus-lake-of-naukuchiatal",
  "kainchi-dham:kamal-tal": "kainchi-dham:kamal-tal-the-secluded-lotus-lake-of-naukuchiatal",
  "kainchi-dham:the-secluded-lotus-lake-of-naukuchiatal": "kainchi-dham:kamal-tal-the-secluded-lotus-lake-of-naukuchiatal",
  "kainchi-dham:kumaoni-heritage-tea-room-and-mountain-jams": "kainchi-dham:kumaoni-heritage-tea-room-and-mountain-jams",
  "kainchi-dham:kumaoni-heritage-cafe-bhowali": "kainchi-dham:kumaoni-heritage-tea-room-and-mountain-jams",
  "kainchi-dham:kumaoni-heritage-tea-room": "kainchi-dham:kumaoni-heritage-tea-room-and-mountain-jams",
  "kainchi-dham:mountain-jams": "kainchi-dham:kumaoni-heritage-tea-room-and-mountain-jams",
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
  "kasol:kheerganga-natural-sulphur-pool-and-meadow": "kasol:kheerganga-natural-sulphur-pool-and-meadow",
  "kasol:kheerganga-trail": "kasol:kheerganga-natural-sulphur-pool-and-meadow",
  "kasol:kheerganga-natural-sulphur-pool": "kasol:kheerganga-natural-sulphur-pool-and-meadow",
  "kasol:meadow": "kasol:kheerganga-natural-sulphur-pool-and-meadow",
  "kasol:pulga-fairy-forest-ancient-deodar-enclave": "kasol:pulga-fairy-forest-ancient-deodar-enclave",
  "kasol:pulga-fairy-forest": "kasol:pulga-fairy-forest-ancient-deodar-enclave",
  "kasol:ancient-deodar-enclave": "kasol:pulga-fairy-forest-ancient-deodar-enclave",
  "kasol:kalga-village-and-terraced-apple-orchards": "kasol:kalga-village-and-terraced-apple-orchards",
  "kasol:kalga-village": "kasol:kalga-village-and-terraced-apple-orchards",
  "kasol:terraced-apple-orchards": "kasol:kalga-village-and-terraced-apple-orchards",
  "kasol:tulga-rustic-wooden-hamlet": "kasol:tulga-rustic-wooden-hamlet",
  "kasol:tulga-hamlet": "kasol:tulga-rustic-wooden-hamlet",
  "kasol:rasol-high-alpine-village-trail-2-600m": "kasol:rasol-high-alpine-village-trail-2-600m",
  "kasol:rasol-trail": "kasol:rasol-high-alpine-village-trail-2-600m",
  "kasol:600m": "kasol:rasol-high-alpine-village-trail-2-600m",
  "kasol:rasol-high-alpine-village-trail": "kasol:rasol-high-alpine-village-trail-2-600m",
  "kasol:chojh-riverside-pebble-beach-and-suspension-bridge": "kasol:chojh-riverside-pebble-beach-and-suspension-bridge",
  "kasol:chojh-bridge": "kasol:chojh-riverside-pebble-beach-and-suspension-bridge",
  "kasol:chojh-riverside-pebble-beach": "kasol:chojh-riverside-pebble-beach-and-suspension-bridge",
  "kasol:suspension-bridge": "kasol:chojh-riverside-pebble-beach-and-suspension-bridge",
  "kasol:jim-morrison-wooden-terrace-and-shakshuka-cafe": "kasol:jim-morrison-wooden-terrace-and-shakshuka-cafe",
  "kasol:jim-morrison-cafe": "kasol:jim-morrison-wooden-terrace-and-shakshuka-cafe",
  "kasol:jim-morrison-wooden-terrace": "kasol:jim-morrison-wooden-terrace-and-shakshuka-cafe",
  "kasol:shakshuka-cafe": "kasol:jim-morrison-wooden-terrace-and-shakshuka-cafe",
  "kasol:waichin-valley-magic-valley-glacial-meadow": "kasol:waichin-valley-magic-valley-glacial-meadow",
  "kasol:waichin-valley": "kasol:waichin-valley-magic-valley-glacial-meadow",
  "kasol:magic-valley-glacial-meadow": "kasol:waichin-valley-magic-valley-glacial-meadow",
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
  "lansdowne:tarkeshwar-mahadev-giant-deodar-sanctuary": "lansdowne:tarkeshwar-mahadev-giant-deodar-sanctuary",
  "lansdowne:tarkeshwar-mahadev-temple": "lansdowne:tarkeshwar-mahadev-giant-deodar-sanctuary",
  "lansdowne:st-marys-anglican-church-1896-heritage-archive": "lansdowne:st-marys-anglican-church-1896-heritage-archive",
  "lansdowne:st-marys-church-1896": "lansdowne:st-marys-anglican-church-1896-heritage-archive",
  "lansdowne:1896-heritage-archive": "lansdowne:st-marys-anglican-church-1896-heritage-archive",
  "lansdowne:st-marys-anglican-church": "lansdowne:st-marys-anglican-church-1896-heritage-archive",
  "lansdowne:kaleshwar-mahadev-500-year-sage-meditation-cave": "lansdowne:kaleshwar-mahadev-500-year-sage-meditation-cave",
  "lansdowne:kaleshwar-mahadev-temple": "lansdowne:kaleshwar-mahadev-500-year-sage-meditation-cave",
  "lansdowne:santoshi-mata-temple-sunset-peak-crest": "lansdowne:santoshi-mata-temple-sunset-peak-crest",
  "lansdowne:santoshi-mata-temple-sunset": "lansdowne:santoshi-mata-temple-sunset-peak-crest",
  "lansdowne:santoshi-mata-temple": "lansdowne:santoshi-mata-temple-sunset-peak-crest",
  "lansdowne:sunset-peak-crest": "lansdowne:santoshi-mata-temple-sunset-peak-crest",
  "lansdowne:deriyakhal-oak-and-rhododendron-birding-trail": "lansdowne:deriyakhal-oak-and-rhododendron-birding-trail",
  "lansdowne:deriyakhal-oak-forest-trail": "lansdowne:deriyakhal-oak-and-rhododendron-birding-trail",
  "lansdowne:deriyakhal-oak": "lansdowne:deriyakhal-oak-and-rhododendron-birding-trail",
  "lansdowne:rhododendron-birding-trail": "lansdowne:deriyakhal-oak-and-rhododendron-birding-trail",
  "lansdowne:kanvashram-historic-sanctuary-on-malini-river": "lansdowne:kanvashram-historic-sanctuary-on-malini-river",
  "lansdowne:kanvashram-historic-sanctuary": "lansdowne:kanvashram-historic-sanctuary-on-malini-river",
  "lansdowne:mayur-cafe-steaming-momos-and-ginger-tea": "lansdowne:mayur-cafe-steaming-momos-and-ginger-tea",
  "lansdowne:mayur-cafe-mall-road": "lansdowne:mayur-cafe-steaming-momos-and-ginger-tea",
  "lansdowne:ginger-tea": "lansdowne:mayur-cafe-steaming-momos-and-ginger-tea",
  "lansdowne:mayur-cafe-steaming-momos": "lansdowne:mayur-cafe-steaming-momos-and-ginger-tea",
  "lansdowne:sadar-bazaar-cantonment-heritage-lane": "lansdowne:sadar-bazaar-cantonment-heritage-lane",
  "lansdowne:sadar-bazaar-wooden-curios": "lansdowne:sadar-bazaar-cantonment-heritage-lane",
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
  "leh:khardung-la-high-mountain-pass-5-359m": "leh:khardung-la-high-mountain-pass-5-359m",
  "leh:khardung-la": "leh:khardung-la-high-mountain-pass-5-359m",
  "leh:359m": "leh:khardung-la-high-mountain-pass-5-359m",
  "leh:khardung-la-high-mountain-pass": "leh:khardung-la-high-mountain-pass-5-359m",
  "leh:nubra-valley-and-hunder-sand-dunes": "leh:nubra-valley-and-hunder-sand-dunes",
  "leh:nubra-hunder-sand-dunes": "leh:nubra-valley-and-hunder-sand-dunes",
  "leh:hunder-sand-dunes": "leh:nubra-valley-and-hunder-sand-dunes",
  "leh:nubra-valley": "leh:nubra-valley-and-hunder-sand-dunes",
  "leh:hemis-monastery-and-sacred-museum": "leh:hemis-monastery-and-sacred-museum",
  "leh:hemis-monastery": "leh:hemis-monastery-and-sacred-museum",
  "leh:sacred-museum": "leh:hemis-monastery-and-sacred-museum",
  "leh:magnetic-hill-gravity-defying-ridge": "leh:magnetic-hill-gravity-defying-ridge",
  "leh:magnetic-hill": "leh:magnetic-hill-gravity-defying-ridge",
  "leh:general-zorawar-fort-and-military-museum": "leh:general-zorawar-fort-and-military-museum",
  "leh:zorawar-fort": "leh:general-zorawar-fort-and-military-museum",
  "leh:general-zorawar-fort": "leh:general-zorawar-fort-and-military-museum",
  "leh:military-museum": "leh:general-zorawar-fort-and-military-museum",
  "leh:lamayuru-moonland-and-ancient-monastery": "leh:lamayuru-moonland-and-ancient-monastery",
  "leh:lamayuru-moonland": "leh:lamayuru-moonland-and-ancient-monastery",
  "leh:ancient-monastery": "leh:lamayuru-moonland-and-ancient-monastery",
  "leh:lalas-art-cafe-in-old-town-leh": "leh:lalas-art-cafe-in-old-town-leh",
  "leh:alchi-monastery": "leh:lalas-art-cafe-in-old-town-leh",
  "leh:bon-appetit-organic-garden-dining": "leh:bon-appetit-organic-garden-dining",
  "leh:bon-appetit-leh": "leh:bon-appetit-organic-garden-dining",
  "leh:bon-appetit": "leh:bon-appetit-organic-garden-dining",
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
  "manali:manu-temple": "manali:manu-temple-historic-shrine-of-sage-manu",
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
  "manali:naggar-castle-kath-kuni-royal-palace": "manali:naggar-castle-kath-kuni-royal-palace",
  "manali:naggar-castle": "manali:naggar-castle-kath-kuni-royal-palace",
  "manali:kath-kuni-royal-palace": "manali:naggar-castle-kath-kuni-royal-palace",
  "manali:rohtang-pass-snow-crest-and-alpine-gateway": "manali:rohtang-pass-snow-crest-and-alpine-gateway",
  "manali:rohtang-pass": "manali:rohtang-pass-snow-crest-and-alpine-gateway",
  "manali:alpine-gateway": "manali:rohtang-pass-snow-crest-and-alpine-gateway",
  "manali:rohtang-pass-snow-crest": "manali:rohtang-pass-snow-crest-and-alpine-gateway",
  "manali:atal-tunnel-north-portal-and-sissu-waterfall": "manali:atal-tunnel-north-portal-and-sissu-waterfall",
  "manali:atal-tunnel-sissu": "manali:atal-tunnel-north-portal-and-sissu-waterfall",
  "manali:atal-tunnel-north-portal": "manali:atal-tunnel-north-portal-and-sissu-waterfall",
  "manali:sissu-waterfall": "manali:atal-tunnel-north-portal-and-sissu-waterfall",
  "manali:manu-temple-historic-shrine-of-sage-manu": "manali:manu-temple-historic-shrine-of-sage-manu",
  "manali:historic-shrine-of-sage-manu": "manali:manu-temple-historic-shrine-of-sage-manu",
  "manali:sethan-igloo-village-and-hampta-valley-ridge": "manali:sethan-igloo-village-and-hampta-valley-ridge",
  "manali:sethan-igloo-village": "manali:sethan-igloo-village-and-hampta-valley-ridge",
  "manali:hampta-valley-ridge": "manali:sethan-igloo-village-and-hampta-valley-ridge",
  "manali:beas-river-nature-park-and-deodar-walk": "manali:beas-river-nature-park-and-deodar-walk",
  "manali:beas-river-park": "manali:beas-river-nature-park-and-deodar-walk",
  "manali:beas-river-nature-park": "manali:beas-river-nature-park-and-deodar-walk",
  "manali:deodar-walk": "manali:beas-river-nature-park-and-deodar-walk",
  "manali:lazy-dog-lounge-riverside-deck": "manali:lazy-dog-lounge-riverside-deck",
  "manali:lazy-dog-lounge": "manali:lazy-dog-lounge-riverside-deck",
  "manali:dylans-toasted-and-roasted-coffee-house": "manali:dylans-toasted-and-roasted-coffee-house",
  "manali:dylans-cafe": "manali:dylans-toasted-and-roasted-coffee-house",
  "manali:dylans-toasted": "manali:dylans-toasted-and-roasted-coffee-house",
  "manali:roasted-coffee-house": "manali:dylans-toasted-and-roasted-coffee-house",
  "manali:gulaba-meadows-and-alpine-snow-line": "manali:gulaba-meadows-and-alpine-snow-line",
  "manali:gulaba-meadows": "manali:gulaba-meadows-and-alpine-snow-line",
  "manali:alpine-snow-line": "manali:gulaba-meadows-and-alpine-snow-line",
  "manali:chopsticks-tibetan-and-asian-kitchen": "manali:chopsticks-tibetan-and-asian-kitchen",
  "manali:chopsticks-manali": "manali:chopsticks-tibetan-and-asian-kitchen",
  "manali:asian-kitchen": "manali:chopsticks-tibetan-and-asian-kitchen",
  "manali:chopsticks": "manali:chopsticks-tibetan-and-asian-kitchen",
  "manali:chopsticks-tibetan": "manali:chopsticks-tibetan-and-asian-kitchen",
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
  "mathura-vrindavan:kusum-sarovar-18th-century-sandstone-reservoir": "mathura-vrindavan:kusum-sarovar-18th-century-sandstone-reservoir",
  "mathura-vrindavan:kusum-sarovar-govardhan": "mathura-vrindavan:kusum-sarovar-18th-century-sandstone-reservoir",
  "mathura-vrindavan:govardhan-hill-giriraj-sacred-parikrama-path": "mathura-vrindavan:govardhan-hill-giriraj-sacred-parikrama-path",
  "mathura-vrindavan:govardhan-hill-parikrama": "mathura-vrindavan:govardhan-hill-giriraj-sacred-parikrama-path",
  "mathura-vrindavan:giriraj-sacred-parikrama-path": "mathura-vrindavan:govardhan-hill-giriraj-sacred-parikrama-path",
  "mathura-vrindavan:govardhan-hill": "mathura-vrindavan:govardhan-hill-giriraj-sacred-parikrama-path",
  "mathura-vrindavan:barsana-shri-radha-rani-temple-ladli-ji-palace": "mathura-vrindavan:barsana-shri-radha-rani-temple-ladli-ji-palace",
  "mathura-vrindavan:barsana-shri-radha-rani-temple": "mathura-vrindavan:barsana-shri-radha-rani-temple-ladli-ji-palace",
  "mathura-vrindavan:ladli-ji-palace": "mathura-vrindavan:barsana-shri-radha-rani-temple-ladli-ji-palace",
  "mathura-vrindavan:radha-kund-and-shyam-kund-sacred-twin-lakes": "mathura-vrindavan:radha-kund-and-shyam-kund-sacred-twin-lakes",
  "mathura-vrindavan:radha-kund-shyam-kund": "mathura-vrindavan:radha-kund-and-shyam-kund-sacred-twin-lakes",
  "mathura-vrindavan:radha-kund": "mathura-vrindavan:radha-kund-and-shyam-kund-sacred-twin-lakes",
  "mathura-vrindavan:shyam-kund-sacred-twin-lakes": "mathura-vrindavan:radha-kund-and-shyam-kund-sacred-twin-lakes",
  "mathura-vrindavan:potra-kund-sacred-stepped-stepwell": "mathura-vrindavan:potra-kund-sacred-stepped-stepwell",
  "mathura-vrindavan:potra-kund-mathura": "mathura-vrindavan:potra-kund-sacred-stepped-stepwell",
  "mathura-vrindavan:keshi-ghat-stone-palace-and-riverfront-sunset": "mathura-vrindavan:keshi-ghat-stone-palace-and-riverfront-sunset",
  "mathura-vrindavan:keshi-ghat-yamuna-sunset": "mathura-vrindavan:keshi-ghat-stone-palace-and-riverfront-sunset",
  "mathura-vrindavan:keshi-ghat-stone-palace": "mathura-vrindavan:keshi-ghat-stone-palace-and-riverfront-sunset",
  "mathura-vrindavan:riverfront-sunset": "mathura-vrindavan:keshi-ghat-stone-palace-and-riverfront-sunset",
  "mathura-vrindavan:vrindavan-chandrodaya-mandir-cultural-park": "mathura-vrindavan:vrindavan-chandrodaya-mandir-cultural-park",
  "mathura-vrindavan:chandrodaya-mandir-lookout": "mathura-vrindavan:vrindavan-chandrodaya-mandir-cultural-park",
  "mathura-vrindavan:chappan-bhog-malai-rabri-and-khurchan-store": "mathura-vrindavan:chappan-bhog-malai-rabri-and-khurchan-store",
  "mathura-vrindavan:brij-chappan-bhog-sweets": "mathura-vrindavan:chappan-bhog-malai-rabri-and-khurchan-store",
  "mathura-vrindavan:chappan-bhog-malai-rabri": "mathura-vrindavan:chappan-bhog-malai-rabri-and-khurchan-store",
  "mathura-vrindavan:khurchan-store": "mathura-vrindavan:chappan-bhog-malai-rabri-and-khurchan-store",
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
  "morni-hills:kalesar-wildlife-sanctuary-and-sal-canopy": "morni-hills:kalesar-wildlife-sanctuary-and-sal-canopy",
  "morni-hills:kalesar-national-park-border": "morni-hills:kalesar-wildlife-sanctuary-and-sal-canopy",
  "morni-hills:kalesar-wildlife-sanctuary": "morni-hills:kalesar-wildlife-sanctuary-and-sal-canopy",
  "morni-hills:sal-canopy": "morni-hills:kalesar-wildlife-sanctuary-and-sal-canopy",
  "morni-hills:mandhana-high-pine-crest-trail": "morni-hills:mandhana-high-pine-crest-trail",
  "morni-hills:mandhana-pine-ridge-trail": "morni-hills:mandhana-high-pine-crest-trail",
  "morni-hills:bada-taal-the-greater-sacred-wetland-lake": "morni-hills:bada-taal-the-greater-sacred-wetland-lake",
  "morni-hills:bada-taal-lotus-wetland": "morni-hills:bada-taal-the-greater-sacred-wetland-lake",
  "morni-hills:bada-taal": "morni-hills:bada-taal-the-greater-sacred-wetland-lake",
  "morni-hills:the-greater-sacred-wetland-lake": "morni-hills:bada-taal-the-greater-sacred-wetland-lake",
  "morni-hills:bhuru-singh-deota-cliff-sanctuary": "morni-hills:bhuru-singh-deota-cliff-sanctuary",
  "morni-hills:bhurusingh-deota-temple": "morni-hills:bhuru-singh-deota-cliff-sanctuary",
  "morni-hills:saketi-shivalik-prehistoric-fossil-park": "morni-hills:saketi-shivalik-prehistoric-fossil-park",
  "morni-hills:shivalik-fossil-park-saketi": "morni-hills:saketi-shivalik-prehistoric-fossil-park",
  "morni-hills:morni-pine-canopy-treehouse-platform": "morni-hills:morni-pine-canopy-treehouse-platform",
  "morni-hills:morni-tree-house-lookout": "morni-hills:morni-pine-canopy-treehouse-platform",
  "morni-hills:morni-forest-wild-multifloral-honey-apiary": "morni-hills:morni-forest-wild-multifloral-honey-apiary",
  "morni-hills:haryana-agro-honey-center": "morni-hills:morni-forest-wild-multifloral-honey-apiary",
  "morni-hills:ghaggar-river-pebble-banks-and-shallows": "morni-hills:ghaggar-river-pebble-banks-and-shallows",
  "morni-hills:ghaggar-river-pebble-banks": "morni-hills:ghaggar-river-pebble-banks-and-shallows",
  "morni-hills:shallows": "morni-hills:ghaggar-river-pebble-banks-and-shallows",
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
  "munnar:kolukkumalai-tea-estate-worlds-highest": "munnar:kolukkumalai-tea-estate-worlds-highest",
  "munnar:kolukkumalai-tea": "munnar:kolukkumalai-tea-estate-worlds-highest",
  "munnar:kolukkumalai-tea-estate": "munnar:kolukkumalai-tea-estate-worlds-highest",
  "munnar:worlds-highest": "munnar:kolukkumalai-tea-estate-worlds-highest",
  "munnar:lockhart-gap-and-bison-valley-viewpoint": "munnar:lockhart-gap-and-bison-valley-viewpoint",
  "munnar:lockhart-gap": "munnar:lockhart-gap-and-bison-valley-viewpoint",
  "munnar:bison-valley-viewpoint": "munnar:lockhart-gap-and-bison-valley-viewpoint",
  "munnar:anamudi-peak-base-and-shola-forest-edge": "munnar:anamudi-peak-base-and-shola-forest-edge",
  "munnar:anamudi-peak-base": "munnar:anamudi-peak-base-and-shola-forest-edge",
  "munnar:shola-forest-edge": "munnar:anamudi-peak-base-and-shola-forest-edge",
  "munnar:marayoor-sandalwood-forest-and-megalithic-dolmens": "munnar:marayoor-sandalwood-forest-and-megalithic-dolmens",
  "munnar:marayoor-sandalwood-forest": "munnar:marayoor-sandalwood-forest-and-megalithic-dolmens",
  "munnar:megalithic-dolmens": "munnar:marayoor-sandalwood-forest-and-megalithic-dolmens",
  "munnar:chinnar-wildlife-sanctuary-and-thorny-scrub-trail": "munnar:chinnar-wildlife-sanctuary-and-thorny-scrub-trail",
  "munnar:chinnar-wildlife-sanctuary": "munnar:chinnar-wildlife-sanctuary-and-thorny-scrub-trail",
  "munnar:thorny-scrub-trail": "munnar:chinnar-wildlife-sanctuary-and-thorny-scrub-trail",
  "munnar:lakkom-cascading-waterfalls": "munnar:lakkom-cascading-waterfalls",
  "munnar:lakkom-waterfalls": "munnar:lakkom-cascading-waterfalls",
  "munnar:saravana-bhavan-munnar-town": "munnar:saravana-bhavan-munnar-town",
  "munnar:saravana-bhavan-munnar": "munnar:saravana-bhavan-munnar-town",
  "munnar:saravana-bhavan": "munnar:saravana-bhavan-munnar-town",
  "munnar:eastend-chai-bazaar-and-plantation-tasting": "munnar:eastend-chai-bazaar-and-plantation-tasting",
  "munnar:eastend-chai-bazaar": "munnar:eastend-chai-bazaar-and-plantation-tasting",
  "munnar:plantation-tasting": "munnar:eastend-chai-bazaar-and-plantation-tasting",
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
  "murthal:shiva-tourist-dhaba-pure-desi-ghee-tandoor": "murthal:shiva-tourist-dhaba-pure-desi-ghee-tandoor",
  "murthal:shiva-dhaba-pure-desi-ghee": "murthal:shiva-tourist-dhaba-pure-desi-ghee-tandoor",
  "murthal:pure-desi-ghee-tandoor": "murthal:shiva-tourist-dhaba-pure-desi-ghee-tandoor",
  "murthal:shiva-tourist-dhaba": "murthal:shiva-tourist-dhaba-pure-desi-ghee-tandoor",
  "murthal:chokhi-dhani-sonepat-heritage-cultural-fair": "murthal:chokhi-dhani-sonepat-heritage-cultural-fair",
  "murthal:chokhi-dhani-sonipat-village": "murthal:chokhi-dhani-sonepat-heritage-cultural-fair",
  "murthal:badkhalsa-memorial-and-sikh-heritage-museum": "murthal:badkhalsa-memorial-and-sikh-heritage-museum",
  "murthal:badkhalsa-memorial-museum": "murthal:badkhalsa-memorial-and-sikh-heritage-museum",
  "murthal:badkhalsa-memorial": "murthal:badkhalsa-memorial-and-sikh-heritage-museum",
  "murthal:sikh-heritage-museum": "murthal:badkhalsa-memorial-and-sikh-heritage-museum",
  "murthal:haryana-tourism-ethnic-craft-village-and-loom": "murthal:haryana-tourism-ethnic-craft-village-and-loom",
  "murthal:haryana-tourism-ethnic-hub": "murthal:haryana-tourism-ethnic-craft-village-and-loom",
  "murthal:haryana-tourism-ethnic-craft-village": "murthal:haryana-tourism-ethnic-craft-village-and-loom",
  "murthal:loom": "murthal:haryana-tourism-ethnic-craft-village-and-loom",
  "murthal:murthal-rural-canal-lanes-and-yellow-mustard-fields": "murthal:murthal-rural-canal-lanes-and-yellow-mustard-fields",
  "murthal:hero": "murthal:murthal-rural-canal-lanes-and-yellow-mustard-fields",
  "murthal:murthal-rural-canal-lanes": "murthal:murthal-rural-canal-lanes-and-yellow-mustard-fields",
  "murthal:yellow-mustard-fields": "murthal:murthal-rural-canal-lanes-and-yellow-mustard-fields",
  "murthal:farm-fresh-kadhai-milk-and-rabri-counter": "murthal:farm-fresh-kadhai-milk-and-rabri-counter",
  "murthal:sukhdev-farm-fresh-milk-counter": "murthal:farm-fresh-kadhai-milk-and-rabri-counter",
  "murthal:farm-fresh-kadhai-milk": "murthal:farm-fresh-kadhai-milk-and-rabri-counter",
  "murthal:rabri-counter": "murthal:farm-fresh-kadhai-milk-and-rabri-counter",
  "murthal:sonipat-yamuna-riverfront-sand-banks": "murthal:sonipat-yamuna-riverfront-sand-banks",
  "murthal:yamuna-river-ghats-sonipat": "murthal:sonipat-yamuna-riverfront-sand-banks",
  "murthal:pahalwan-khasta-dal-kachori-and-heeng-aloo": "murthal:pahalwan-khasta-dal-kachori-and-heeng-aloo",
  "murthal:pehalwan-kachori-subzi-corner": "murthal:pahalwan-khasta-dal-kachori-and-heeng-aloo",
  "murthal:heeng-aloo": "murthal:pahalwan-khasta-dal-kachori-and-heeng-aloo",
  "murthal:pahalwan-khasta-dal-kachori": "murthal:pahalwan-khasta-dal-kachori-and-heeng-aloo",
  "mussoorie:landour-bakehouse-and-sisters-bazaar": "mussoorie:landour-bakehouse",
  "mussoorie:landour-bakehouse": "mussoorie:landour-bakehouse",
  "mussoorie:sisters-bazaar": "mussoorie:landour-bakehouse-and-sisters-bazaar",
  "mussoorie:lal-tibba-scenic-viewpoint": "mussoorie:lal-tibba",
  "mussoorie:lal-tibba": "mussoorie:lal-tibba",
  "mussoorie:char-dukan-and-st-pauls-church": "mussoorie:char-dukan-and-st-pauls-church",
  "mussoorie:st-pauls-church": "mussoorie:st-pauls-church",
  "mussoorie:char-dukan": "mussoorie:char-dukan-and-st-pauls-church",
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
  "mussoorie:char-dukan-heritage-cafe-lane-landour": "mussoorie:char-dukan-heritage-cafe-lane-landour",
  "mussoorie:char-dukan-prakash-store": "mussoorie:char-dukan-heritage-cafe-lane-landour",
  "mussoorie:char-dukan-heritage-cafe-lane": "mussoorie:char-dukan-heritage-cafe-lane-landour",
  "mussoorie:landour": "mussoorie:landour",
  "mussoorie:pari-tibba-witches-hill-pine-ridge-trail": "mussoorie:pari-tibba-witches-hill-pine-ridge-trail",
  "mussoorie:pari-tibba-fairies-hill": "mussoorie:pari-tibba-witches-hill-pine-ridge-trail",
  "mussoorie:pari-tibba": "mussoorie:pari-tibba-witches-hill-pine-ridge-trail",
  "mussoorie:pine-ridge-trail": "mussoorie:pari-tibba-witches-hill-pine-ridge-trail",
  "mussoorie:witches-hill": "mussoorie:pari-tibba-witches-hill-pine-ridge-trail",
  "mussoorie:clouds-end-virgin-oak-sanctuary": "mussoorie:clouds-end-virgin-oak-sanctuary",
  "mussoorie:clouds-end": "mussoorie:clouds-end",
  "mussoorie:rokeby-manor-and-emilys-tea-room": "mussoorie:rokeby-manor-and-emilys-tea-room",
  "mussoorie:rokeby-manor": "mussoorie:rokeby-manor-and-emilys-tea-room",
  "mussoorie:emilys-tea-room": "mussoorie:rokeby-manor-and-emilys-tea-room",
  "mussoorie:jharipani-cascading-waterfall-trail": "mussoorie:jharipani-cascading-waterfall-trail",
  "mussoorie:kempty-falls": "mussoorie:kempty-falls",
  "mussoorie:prakash-store-and-handmade-cheese-deli-1928": "mussoorie:prakash-store-and-handmade-cheese-deli-1928",
  "mussoorie:prakash-store": "mussoorie:prakash-store-and-handmade-cheese-deli-1928",
  "mussoorie:1928": "mussoorie:prakash-store-and-handmade-cheese-deli-1928",
  "mussoorie:handmade-cheese-deli": "mussoorie:prakash-store-and-handmade-cheese-deli-1928",
  "mussoorie:company-garden-and-artificial-falls": "mussoorie:company-garden-and-artificial-falls",
  "mussoorie:company-garden": "mussoorie:company-garden-and-artificial-falls",
  "mussoorie:artificial-falls": "mussoorie:company-garden-and-artificial-falls",
  "mussoorie:the-mall-road-mussoorie-and-kulri-bazaar": "mussoorie:the-mall-road-mussoorie-and-kulri-bazaar",
  "mussoorie:mall-road": "mussoorie:mall-road",
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
  "neemrana:tijara-fort-palace-19th-century-hilltop-citadel": "neemrana:tijara-fort-palace-19th-century-hilltop-citadel",
  "neemrana:tijara-fort-palace-heritage": "neemrana:tijara-fort-palace-19th-century-hilltop-citadel",
  "neemrana:19th-century-hilltop-citadel": "neemrana:tijara-fort-palace-19th-century-hilltop-citadel",
  "neemrana:tijara-fort-palace": "neemrana:tijara-fort-palace-19th-century-hilltop-citadel",
  "neemrana:aravalli-quartzite-canyon-and-scrub-trail": "neemrana:aravalli-quartzite-canyon-and-scrub-trail",
  "neemrana:aravalli-hidden-gorge-trek": "neemrana:aravalli-quartzite-canyon-and-scrub-trail",
  "neemrana:aravalli-quartzite-canyon": "neemrana:aravalli-quartzite-canyon-and-scrub-trail",
  "neemrana:scrub-trail": "neemrana:aravalli-quartzite-canyon-and-scrub-trail",
  "neemrana:mothooka-ancient-copper-archaeology-site": "neemrana:mothooka-ancient-copper-archaeology-site",
  "neemrana:mothooka-ancient-copper-mines": "neemrana:mothooka-ancient-copper-archaeology-site",
  "neemrana:kotputli-traditional-terracotta-pottery-street": "neemrana:kotputli-traditional-terracotta-pottery-street",
  "neemrana:kotputli-earthen-pottery-lane": "neemrana:kotputli-traditional-terracotta-pottery-street",
  "neemrana:nazara-open-air-medieval-amphitheatre": "neemrana:nazara-open-air-medieval-amphitheatre",
  "neemrana:neemrana-rooftop-amphitheatre": "neemrana:nazara-open-air-medieval-amphitheatre",
  "neemrana:rooftop-amphitheatre": "neemrana:nazara-open-air-medieval-amphitheatre",
  "neemrana:shyam-sarovar-subterranean-baori-oasis": "neemrana:shyam-sarovar-subterranean-baori-oasis",
  "neemrana:shyam-sarovar-kund": "neemrana:shyam-sarovar-subterranean-baori-oasis",
  "neemrana:karni-mata-hilltop-staircase-shrine": "neemrana:karni-mata-hilltop-staircase-shrine",
  "neemrana:karni-mata-shrine-neemrana": "neemrana:karni-mata-hilltop-staircase-shrine",
  "neemrana:karni-mata-shrine": "neemrana:karni-mata-hilltop-staircase-shrine",
  "neemrana:old-alwar-byroad-blooming-mustard-lane": "neemrana:old-alwar-byroad-blooming-mustard-lane",
  "neemrana:old-alwar-road-sarson-fields": "neemrana:old-alwar-byroad-blooming-mustard-lane",
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
  "rishikesh:triveni-ghat": "rishikesh:kunjapuri-devi-sunrise-temple-ridge-1-645m",
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
  "rishikesh:swarg-ashram-and-sacred-kutiyas": "rishikesh:swarg-ashram-and-sacred-kutiyas",
  "rishikesh:swarg-ashram": "rishikesh:swarg-ashram-and-sacred-kutiyas",
  "rishikesh:sacred-kutiyas": "rishikesh:swarg-ashram-and-sacred-kutiyas",
  "rishikesh:kunjapuri-devi-sunrise-temple-ridge-1-645m": "rishikesh:kunjapuri-devi-sunrise-temple-ridge-1-645m",
  "rishikesh:645m": "rishikesh:kunjapuri-devi-sunrise-temple-ridge-1-645m",
  "rishikesh:kunjapuri-devi-sunrise-temple-ridge": "rishikesh:kunjapuri-devi-sunrise-temple-ridge-1-645m",
  "rishikesh:kaudiyala-white-sand-river-bank": "rishikesh:kaudiyala-white-sand-river-bank",
  "rishikesh:kaudiyala-white-sands": "rishikesh:kaudiyala-white-sand-river-bank",
  "rishikesh:patna-cascading-waterfall-and-limestone-caves": "rishikesh:patna-cascading-waterfall-and-limestone-caves",
  "rishikesh:patna-waterfall": "rishikesh:patna-cascading-waterfall-and-limestone-caves",
  "rishikesh:limestone-caves": "rishikesh:patna-cascading-waterfall-and-limestone-caves",
  "rishikesh:patna-cascading-waterfall": "rishikesh:patna-cascading-waterfall-and-limestone-caves",
  "rishikesh:little-buddha-cafe-treehouse-lounge": "rishikesh:little-buddha-cafe-treehouse-lounge",
  "rishikesh:little-buddha-cafe": "rishikesh:little-buddha-cafe-treehouse-lounge",
  "rishikesh:the-sitting-elephant-rooftop-dining": "rishikesh:the-sitting-elephant-rooftop-dining",
  "rishikesh:sitting-elephant-restaurant": "rishikesh:the-sitting-elephant-rooftop-dining",
  "rishikesh:kunjapuri-devi-sunrise-temple-crest-1-665m": "rishikesh:kunjapuri-devi-sunrise-temple-crest-1-665m",
  "rishikesh:kunjapuri-devi-sunrise-crest": "rishikesh:kunjapuri-devi-sunrise-temple-crest-1-665m",
  "rishikesh:665m": "rishikesh:kunjapuri-devi-sunrise-temple-crest-1-665m",
  "rishikesh:kunjapuri-devi-sunrise-temple-crest": "rishikesh:kunjapuri-devi-sunrise-temple-crest-1-665m",
  "rishikesh:rajaji-national-park-chilla-elephant-safari-gate": "rishikesh:rajaji-national-park-chilla-elephant-safari-gate",
  "rishikesh:rajaji-national-park-chilla": "rishikesh:rajaji-national-park-chilla-elephant-safari-gate",
  "rishikesh:chilla-elephant-safari-gate": "rishikesh:rajaji-national-park-chilla-elephant-safari-gate",
  "rishikesh:rajaji-national-park": "rishikesh:rajaji-national-park-chilla-elephant-safari-gate",
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
  "sariska-bhangarh:ajabgarh-fort-and-reservoir-the-twin-of-bhangarh": "sariska-bhangarh:ajabgarh-fort-and-reservoir-the-twin-of-bhangarh",
  "sariska-bhangarh:ajabgarh-fort-and-dam": "sariska-bhangarh:ajabgarh-fort-and-reservoir-the-twin-of-bhangarh",
  "sariska-bhangarh:ajabgarh-fort": "sariska-bhangarh:ajabgarh-fort-and-reservoir-the-twin-of-bhangarh",
  "sariska-bhangarh:reservoir": "sariska-bhangarh:ajabgarh-fort-and-reservoir-the-twin-of-bhangarh",
  "sariska-bhangarh:the-twin-of-bhangarh": "sariska-bhangarh:ajabgarh-fort-and-reservoir-the-twin-of-bhangarh",
  "sariska-bhangarh:natni-ka-bara-stone-weir-and-forest-oasis": "sariska-bhangarh:natni-ka-bara-stone-weir-and-forest-oasis",
  "sariska-bhangarh:natni-ka-bara-weir": "sariska-bhangarh:natni-ka-bara-stone-weir-and-forest-oasis",
  "sariska-bhangarh:forest-oasis": "sariska-bhangarh:natni-ka-bara-stone-weir-and-forest-oasis",
  "sariska-bhangarh:natni-ka-bara-stone-weir": "sariska-bhangarh:natni-ka-bara-stone-weir-and-forest-oasis",
  "sariska-bhangarh:narayani-mata-natural-spring-sanctuary": "sariska-bhangarh:narayani-mata-natural-spring-sanctuary",
  "sariska-bhangarh:narayani-mata-sacred-spring": "sariska-bhangarh:narayani-mata-natural-spring-sanctuary",
  "sariska-bhangarh:talvriksha-arjuna-tree-and-thermal-kunds": "sariska-bhangarh:talvriksha-arjuna-tree-and-thermal-kunds",
  "sariska-bhangarh:talvriksha-holy-springs-sanctuary": "sariska-bhangarh:talvriksha-arjuna-tree-and-thermal-kunds",
  "sariska-bhangarh:talvriksha-arjuna-tree": "sariska-bhangarh:talvriksha-arjuna-tree-and-thermal-kunds",
  "sariska-bhangarh:thermal-kunds": "sariska-bhangarh:talvriksha-arjuna-tree-and-thermal-kunds",
  "sariska-bhangarh:kushalgarh-colonial-teak-forest-bungalow": "sariska-bhangarh:kushalgarh-colonial-teak-forest-bungalow",
  "sariska-bhangarh:kushalgarh-forest-rest-house": "sariska-bhangarh:kushalgarh-colonial-teak-forest-bungalow",
  "sariska-bhangarh:mansa-devi-hilltop-cliff-lookout": "sariska-bhangarh:mansa-devi-hilltop-cliff-lookout",
  "sariska-bhangarh:mansa-devi-hill-climb": "sariska-bhangarh:mansa-devi-hilltop-cliff-lookout",
  "sariska-bhangarh:deoli-lake-and-tiger-watering-hole": "sariska-bhangarh:deoli-lake-and-tiger-watering-hole",
  "sariska-bhangarh:deoli-lake-waterhole": "sariska-bhangarh:deoli-lake-and-tiger-watering-hole",
  "sariska-bhangarh:deoli-lake": "sariska-bhangarh:deoli-lake-and-tiger-watering-hole",
  "sariska-bhangarh:tiger-watering-hole": "sariska-bhangarh:deoli-lake-and-tiger-watering-hole",
  "sariska-bhangarh:rajgarh-hill-fort-ancient-bargujar-citadel": "sariska-bhangarh:rajgarh-hill-fort-ancient-bargujar-citadel",
  "sariska-bhangarh:rajgarh-fort-palace-ruins": "sariska-bhangarh:rajgarh-hill-fort-ancient-bargujar-citadel",
  "sariska-bhangarh:ancient-bargujar-citadel": "sariska-bhangarh:rajgarh-hill-fort-ancient-bargujar-citadel",
  "sariska-bhangarh:rajgarh-hill-fort": "sariska-bhangarh:rajgarh-hill-fort-ancient-bargujar-citadel",
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
  "spiti:mudh-village": "spiti:mudh-village-terminal-hamlet-of-pin-valley",
  "spiti:pin-valley-national-park": "spiti:pin-valley-national-park-and-mudh-village",
  "spiti:cafe-deyzor-and-travelers-lounge": "spiti:cafe-deyzor-and-travelers-lounge",
  "spiti:cafe-deyzor": "spiti:cafe-deyzor-and-travelers-lounge",
  "spiti:travelers-lounge": "spiti:cafe-deyzor-and-travelers-lounge",
  "spiti:chicham-suspension-bridge-asias-highest": "spiti:chicham-suspension-bridge-asias-highest",
  "spiti:chicham-bridge": "spiti:chicham-suspension-bridge-asias-highest",
  "spiti:asias-highest": "spiti:chicham-suspension-bridge-asias-highest",
  "spiti:chicham-suspension-bridge": "spiti:chicham-suspension-bridge-asias-highest",
  "spiti:kibber-village-and-wildlife-sanctuary": "spiti:kibber-village-and-wildlife-sanctuary",
  "spiti:kibber-village": "spiti:kibber-village-and-wildlife-sanctuary",
  "spiti:wildlife-sanctuary": "spiti:kibber-village-and-wildlife-sanctuary",
  "spiti:tabo-monastery-the-ajanta-of-the-himalayas": "spiti:tabo-monastery-the-ajanta-of-the-himalayas",
  "spiti:tabo-monastery": "spiti:tabo-monastery-the-ajanta-of-the-himalayas",
  "spiti:the-ajanta-of-the-himalayas": "spiti:tabo-monastery-the-ajanta-of-the-himalayas",
  "spiti:dhankar-glacial-lake-alpine-tarn": "spiti:dhankar-glacial-lake-alpine-tarn",
  "spiti:dhankar-lake": "spiti:dhankar-glacial-lake-alpine-tarn",
  "spiti:tashigang-worlds-highest-polling-station": "spiti:tashigang-worlds-highest-polling-station",
  "spiti:tashigang": "spiti:tashigang-worlds-highest-polling-station",
  "spiti:worlds-highest-polling-station": "spiti:tashigang-worlds-highest-polling-station",
  "spiti:gue-monastery-and-500-year-old-natural-mummy": "spiti:gue-monastery-and-500-year-old-natural-mummy",
  "spiti:gue-monastery": "spiti:gue-monastery-and-500-year-old-natural-mummy",
  "spiti:500-year-old-natural-mummy": "spiti:gue-monastery-and-500-year-old-natural-mummy",
  "spiti:kaza-old-town-and-central-himalayan-bazaar": "spiti:kaza-old-town-and-central-himalayan-bazaar",
  "spiti:kaza": "spiti:kaza-old-town-and-central-himalayan-bazaar",
  "spiti:central-himalayan-bazaar": "spiti:kaza-old-town-and-central-himalayan-bazaar",
  "spiti:kaza-old-town": "spiti:kaza-old-town-and-central-himalayan-bazaar",
  "spiti:kunzum-pass-gateway-to-spiti-at-4-551m": "spiti:kunzum-pass-gateway-to-spiti-at-4-551m",
  "spiti:kunzum-pass": "spiti:kunzum-pass-gateway-to-spiti-at-4-551m",
  "spiti:551m": "spiti:kunzum-pass-gateway-to-spiti-at-4-551m",
  "spiti:gateway-to-spiti-at-4": "spiti:kunzum-pass-gateway-to-spiti-at-4-551m",
  "spiti:mudh-village-terminal-hamlet-of-pin-valley": "spiti:mudh-village-terminal-hamlet-of-pin-valley",
  "spiti:terminal-hamlet-of-pin-valley": "spiti:mudh-village-terminal-hamlet-of-pin-valley",
  "spiti:the-himalayan-cafe-and-slow-travel-lounge": "spiti:the-himalayan-cafe-and-slow-travel-lounge",
  "spiti:himalayan-cafe-spiti": "spiti:the-himalayan-cafe-and-slow-travel-lounge",
  "spiti:himalayan-cafe": "spiti:the-himalayan-cafe-and-slow-travel-lounge",
  "spiti:slow-travel-lounge": "spiti:the-himalayan-cafe-and-slow-travel-lounge",
  "spiti:the-himalayan-cafe": "spiti:the-himalayan-cafe-and-slow-travel-lounge",
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
  "tungnath-chandrashila:kanchula-korak-musk-deer-sanctuary": "tungnath-chandrashila:kanchula-korak-musk-deer-sanctuary",
  "tungnath-chandrashila:makkumath-temple-winter-abode-of-lord-tungnath": "tungnath-chandrashila:makkumath-temple-winter-abode-of-lord-tungnath",
  "tungnath-chandrashila:makku-math-winter-tungnath": "tungnath-chandrashila:makkumath-temple-winter-abode-of-lord-tungnath",
  "tungnath-chandrashila:makkumath-temple": "tungnath-chandrashila:makkumath-temple-winter-abode-of-lord-tungnath",
  "tungnath-chandrashila:winter-abode-of-lord-tungnath": "tungnath-chandrashila:makkumath-temple-winter-abode-of-lord-tungnath",
  "tungnath-chandrashila:baniyakund-high-alpine-meadows-and-eco-camps": "tungnath-chandrashila:baniyakund-high-alpine-meadows-and-eco-camps",
  "tungnath-chandrashila:baniyakund-high-meadows": "tungnath-chandrashila:baniyakund-high-alpine-meadows-and-eco-camps",
  "tungnath-chandrashila:baniyakund-high-alpine-meadows": "tungnath-chandrashila:baniyakund-high-alpine-meadows-and-eco-camps",
  "tungnath-chandrashila:eco-camps": "tungnath-chandrashila:baniyakund-high-alpine-meadows-and-eco-camps",
  "tungnath-chandrashila:ravan-shila-the-cliff-of-penance-at-3-800m": "tungnath-chandrashila:ravan-shila-the-cliff-of-penance-at-3-800m",
  "tungnath-chandrashila:ravan-shila-cliff": "tungnath-chandrashila:ravan-shila-the-cliff-of-penance-at-3-800m",
  "tungnath-chandrashila:800m": "tungnath-chandrashila:ravan-shila-the-cliff-of-penance-at-3-800m",
  "tungnath-chandrashila:ravan-shila": "tungnath-chandrashila:ravan-shila-the-cliff-of-penance-at-3-800m",
  "tungnath-chandrashila:the-cliff-of-penance-at-3": "tungnath-chandrashila:ravan-shila-the-cliff-of-penance-at-3-800m",
  "tungnath-chandrashila:kalpeshwar-fifth-kedar-sacred-hair-temple": "tungnath-chandrashila:kalpeshwar-fifth-kedar-sacred-hair-temple",
  "tungnath-chandrashila:kalpeshwar-cave-temple": "tungnath-chandrashila:kalpeshwar-fifth-kedar-sacred-hair-temple",
  "tungnath-chandrashila:kalpeshwar-fifth-kedar": "tungnath-chandrashila:kalpeshwar-fifth-kedar-sacred-hair-temple",
  "tungnath-chandrashila:sacred-hair-temple": "tungnath-chandrashila:kalpeshwar-fifth-kedar-sacred-hair-temple",
  "tungnath-chandrashila:madhyamaheshwar-valley-circuit-base": "tungnath-chandrashila:madhyamaheshwar-valley-circuit-base",
  "tungnath-chandrashila:madhyamaheshwar-base-circuit": "tungnath-chandrashila:madhyamaheshwar-valley-circuit-base",
  "tungnath-chandrashila:ansuya-devi-jungle-waterfall-and-hermitage-trail": "tungnath-chandrashila:ansuya-devi-jungle-waterfall-and-hermitage-trail",
  "tungnath-chandrashila:ansuya-devi-waterfall-trail": "tungnath-chandrashila:ansuya-devi-jungle-waterfall-and-hermitage-trail",
  "tungnath-chandrashila:ansuya-devi-jungle-waterfall": "tungnath-chandrashila:ansuya-devi-jungle-waterfall-and-hermitage-trail",
  "tungnath-chandrashila:hermitage-trail": "tungnath-chandrashila:ansuya-devi-jungle-waterfall-and-hermitage-trail",
  "tungnath-chandrashila:chopta-alpine-shepherd-encampments": "tungnath-chandrashila:chopta-alpine-shepherd-encampments",
  "tungnath-chandrashila:chopta-shepherds-stone-huts": "tungnath-chandrashila:chopta-alpine-shepherd-encampments",
  "udaipur:city-palace-complex-and-zenana-mahal": "udaipur:city-palace-complex-and-zenana-mahal",
  "udaipur:city-palace-udaipur": "udaipur:city-palace-complex-and-zenana-mahal",
  "udaipur:city-palace": "udaipur:city-palace-complex-and-zenana-mahal",
  "udaipur:city-palace-complex": "udaipur:city-palace-complex-and-zenana-mahal",
  "udaipur:city-palace-of-udaipur": "udaipur:city-palace-complex-and-zenana-mahal",
  "udaipur:udaipur-city-palace": "udaipur:city-palace-complex-and-zenana-mahal",
  "udaipur:zenana-mahal": "udaipur:city-palace-complex-and-zenana-mahal",
  "udaipur:lake-pichola-ghats-and-island-cruise": "udaipur:upre-by-1559-ad-lake-pichola-rooftop-dining",
  "udaipur:lake-pichola-boat-ride": "udaipur:upre-by-1559-ad-lake-pichola-rooftop-dining",
  "udaipur:island-cruise": "udaipur:lake-pichola-ghats-and-island-cruise",
  "udaipur:lake-pichola": "udaipur:upre-by-1559-ad-lake-pichola-rooftop-dining",
  "udaipur:lake-pichola-ghats": "udaipur:upre-by-1559-ad-lake-pichola-rooftop-dining",
  "udaipur:lake-pichola-sunset-boat-voyage": "udaipur:upre-by-1559-ad-lake-pichola-rooftop-dining",
  "udaipur:pichola-boat-ride": "udaipur:upre-by-1559-ad-lake-pichola-rooftop-dining",
  "udaipur:pichola-cruise": "udaipur:upre-by-1559-ad-lake-pichola-rooftop-dining",
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
  "udaipur:jagdish-temple-1651-ce-indo-aryan-shrine": "udaipur:jagdish-temple-1651-ce-indo-aryan-shrine",
  "udaipur:jagdish-temple": "udaipur:jagdish-temple-1651-ce-indo-aryan-shrine",
  "udaipur:1651-ce-indo-aryan-shrine": "udaipur:jagdish-temple-1651-ce-indo-aryan-shrine",
  "udaipur:fateh-sagar-lake-and-nehru-island-park": "udaipur:fateh-sagar-lake-and-nehru-island-park",
  "udaipur:fateh-sagar-lake": "udaipur:fateh-sagar-lake-and-nehru-island-park",
  "udaipur:nehru-island-park": "udaipur:fateh-sagar-lake-and-nehru-island-park",
  "udaipur:ahar-royal-cenotaphs-mahasatyas-of-mewar": "udaipur:ahar-royal-cenotaphs-mahasatyas-of-mewar",
  "udaipur:ahar-cenotaphs": "udaipur:ahar-royal-cenotaphs-mahasatyas-of-mewar",
  "udaipur:ahar-royal-cenotaphs": "udaipur:ahar-royal-cenotaphs-mahasatyas-of-mewar",
  "udaipur:mahasatyas-of-mewar": "udaipur:ahar-royal-cenotaphs-mahasatyas-of-mewar",
  "udaipur:shilpgram-rural-arts-and-crafts-complex": "udaipur:shilpgram-rural-arts-and-crafts-complex",
  "udaipur:shilpgram-crafts": "udaipur:shilpgram-rural-arts-and-crafts-complex",
  "udaipur:crafts-complex": "udaipur:shilpgram-rural-arts-and-crafts-complex",
  "udaipur:rural-arts": "udaipur:shilpgram-rural-arts-and-crafts-complex",
  "udaipur:shilpgram": "udaipur:shilpgram-rural-arts-and-crafts-complex",
  "udaipur:doodh-talai-lake-and-ropeway-to-karni-mata": "udaipur:doodh-talai-lake-and-ropeway-to-karni-mata",
  "udaipur:doodh-talai-lake": "udaipur:doodh-talai-lake-and-ropeway-to-karni-mata",
  "udaipur:ropeway-to-karni-mata": "udaipur:doodh-talai-lake-and-ropeway-to-karni-mata",
  "udaipur:upre-by-1559-ad-lake-pichola-rooftop-dining": "udaipur:upre-by-1559-ad-lake-pichola-rooftop-dining",
  "udaipur:upre-rooftop-dining": "udaipur:upre-by-1559-ad-lake-pichola-rooftop-dining",
  "udaipur:lake-pichola-rooftop-dining": "udaipur:upre-by-1559-ad-lake-pichola-rooftop-dining",
  "udaipur:upre-by-1559-ad": "udaipur:upre-by-1559-ad-lake-pichola-rooftop-dining",
  "udaipur:millets-of-mewar-pioneering-healthy-rajasthani-kitchen": "udaipur:millets-of-mewar-pioneering-healthy-rajasthani-kitchen",
  "udaipur:millets-of-mewar": "udaipur:millets-of-mewar-pioneering-healthy-rajasthani-kitchen",
  "udaipur:pioneering-healthy-rajasthani-kitchen": "udaipur:millets-of-mewar-pioneering-healthy-rajasthani-kitchen",
  "udaipur:paliwal-kachori-old-city-breakfast-stand": "udaipur:paliwal-kachori-old-city-breakfast-stand",
  "udaipur:paliwal-kachori": "udaipur:paliwal-kachori-old-city-breakfast-stand",
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
  "varanasi:harishchandra-ghat-and-silent-sacred-pyres": "varanasi:harishchandra-ghat-and-silent-sacred-pyres",
  "varanasi:harishchandra-ghat": "varanasi:harishchandra-ghat-and-silent-sacred-pyres",
  "varanasi:silent-sacred-pyres": "varanasi:harishchandra-ghat-and-silent-sacred-pyres",
  "varanasi:scindia-ghat-and-the-leaning-shiva-temple": "varanasi:scindia-ghat-and-the-leaning-shiva-temple",
  "varanasi:scindia-ghat-leaning-temple": "varanasi:scindia-ghat-and-the-leaning-shiva-temple",
  "varanasi:scindia-ghat": "varanasi:scindia-ghat-and-the-leaning-shiva-temple",
  "varanasi:the-leaning-shiva-temple": "varanasi:scindia-ghat-and-the-leaning-shiva-temple",
  "varanasi:bharat-kala-bhavan-archeological-museum": "varanasi:bharat-kala-bhavan-archeological-museum",
  "varanasi:bharat-kala-bhavan": "varanasi:bharat-kala-bhavan-archeological-museum",
  "varanasi:deena-chaat-bhandar-tamatar-chaat-and-gulab-jamun": "varanasi:deena-chaat-bhandar-tamatar-chaat-and-gulab-jamun",
  "varanasi:deena-chaat-bhandar": "varanasi:deena-chaat-bhandar-tamatar-chaat-and-gulab-jamun",
  "varanasi:gulab-jamun": "varanasi:deena-chaat-bhandar-tamatar-chaat-and-gulab-jamun",
  "varanasi:tamatar-chaat": "varanasi:deena-chaat-bhandar-tamatar-chaat-and-gulab-jamun",
  "varanasi:kashi-chat-bhandar-godowlia-chowk": "varanasi:kashi-chat-bhandar-godowlia-chowk",
  "varanasi:kashi-chat-bhandar": "varanasi:kashi-chat-bhandar-godowlia-chowk",
  "varanasi:godowlia-chowk": "varanasi:kashi-chat-bhandar-godowlia-chowk",
  "varanasi:tulsi-manas-white-marble-temple": "varanasi:tulsi-manas-white-marble-temple",
  "varanasi:tulsi-manas-temple": "varanasi:tulsi-manas-white-marble-temple",
  "varanasi:sankat-mochan-hanuman-temple-and-besan-laddoos": "varanasi:sankat-mochan-hanuman-temple-and-besan-laddoos",
  "varanasi:sankat-mochan-temple": "varanasi:sankat-mochan-hanuman-temple-and-besan-laddoos",
  "varanasi:besan-laddoos": "varanasi:sankat-mochan-hanuman-temple-and-besan-laddoos",
  "varanasi:sankat-mochan-hanuman-temple": "varanasi:sankat-mochan-hanuman-temple-and-besan-laddoos",
  "varanasi:chet-singh-fort-and-river-ramparts": "varanasi:chet-singh-fort-and-river-ramparts",
  "varanasi:chet-singh-fort-ghat": "varanasi:chet-singh-fort-and-river-ramparts",
  "varanasi:chet-singh-fort": "varanasi:chet-singh-fort-and-river-ramparts",
  "varanasi:river-ramparts": "varanasi:chet-singh-fort-and-river-ramparts",
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
  "mussoorie:kempty": "mussoorie:kempty-falls",
  "mussoorie:gun-hill": "mussoorie:gun-hill",
  "mussoorie:gun-hill-viewpoint": "mussoorie:gun-hill",
  "mussoorie:camel-back-road": "mussoorie:camels-back-road",
  "mussoorie:camels-back": "mussoorie:camels-back-road",
  "mussoorie:camel-back": "mussoorie:camels-back-road",
  "mussoorie:mussoorie-mall-road": "mussoorie:mall-road",
  "mussoorie:the-mall-road": "mussoorie:mall-road",
  "mussoorie:george-everest": "mussoorie:george-everest",
  "mussoorie:sir-george-everest-house": "mussoorie:george-everest",
  "mussoorie:george-everest-house": "mussoorie:george-everest",
  "mussoorie:clouds-end-heritage": "mussoorie:clouds-end",
  "mussoorie:landour-cantonment-ridge": "mussoorie:landour",
  "mussoorie:landour-ridge": "mussoorie:landour",
  "mussoorie:st-paul-church": "mussoorie:st-pauls-church",
  "mussoorie:st-pauls-church-landour": "mussoorie:st-pauls-church",
  "dharamshala:bhagsunag-waterfall-and-shiva-cafe": "dharamshala:bhagsunag-waterfall",
  "dharamshala:bhagsunag": "dharamshala:bhagsunag-waterfall",
  "dharamshala:namgyal-monastery": "dharamshala:namgyal-monastery",
  "dharamshala:namgyal": "dharamshala:namgyal-monastery",
  "dharamshala:namgyal-monastery-and-tsuglagkhang-complex": "dharamshala:namgyal-monastery",
  "dharamshala:namgyal-monastery-tsuglagkhang-complex": "dharamshala:namgyal-monastery",
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
  "varanasi:brijrama-palace": "varanasi:brijrama-palace-heritage-grand",
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
