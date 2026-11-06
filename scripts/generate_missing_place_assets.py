"""
VANVAS Dedicated Place Artwork Synthesis Script.
Generates unique, high-resolution editorial travel illustrations for all distinct physical places
adhering strictly to VANVAS_ART_BIBLE.md design standards:
- Evocative gouache and layered screenprint textures
- VANVAS Palette: Deep Forest Green (#173B32), Warm Parchment (#FAF7F0), Antique Brass (#B49252), Muted Terracotta (#B65E3C), Mist Slate (#D8DED5)
- No text, no watermarks, no generic clichés
- Deterministic, unique composition and MD5 hash per physical entity
"""
import os
import math
import hashlib
from PIL import Image, ImageDraw, ImageFilter

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_PLACES = os.path.join(ROOT_DIR, "frontend", "public", "images", "places")

# Color Palettes
FOREST_DARK = (15, 41, 36)
FOREST_MID = (23, 59, 50)
FOREST_LIGHT = (46, 88, 76)
PARCHMENT_LIGHT = (250, 247, 240)
PARCHMENT_WARM = (239, 229, 210)
BRASS_GOLD = (180, 146, 82)
BRASS_DARK = (142, 109, 50)
TERRACOTTA = (182, 94, 60)
TERRACOTTA_DEEP = (148, 70, 39)
MIST_SLATE = (216, 222, 213)
ALPINE_BLUE = (38, 58, 74)
RIVER_TEAL = (28, 78, 80)
DESERT_SAND = (224, 185, 126)

ASSET_DEFINITIONS = [
    # Manali
    {
        "dest": "manali", "slug": "lazy-dog-lounge", "name": "Lazy Dog Lounge Riverside Deck",
        "theme": "cafe", "palette": [PARCHMENT_WARM, FOREST_MID, RIVER_TEAL, BRASS_GOLD],
        "feature": "riverside_patio"
    },
    {
        "dest": "manali", "slug": "atal-tunnel-sissu", "name": "Atal Tunnel North Portal & Sissu Waterfall",
        "theme": "waterfall", "palette": [ALPINE_BLUE, FOREST_DARK, MIST_SLATE, PARCHMENT_LIGHT],
        "feature": "alpine_waterfall"
    },
    {
        "dest": "manali", "slug": "beas-river-park", "name": "Beas River Nature Park & Deodar Walk",
        "theme": "nature", "palette": [FOREST_LIGHT, FOREST_MID, RIVER_TEAL, PARCHMENT_WARM],
        "feature": "forest_river"
    },
    {
        "dest": "manali", "slug": "naggar-castle", "name": "Naggar Castle (Kath-Kuni Royal Palace)",
        "theme": "heritage", "palette": [BRASS_DARK, TERRACOTTA, FOREST_MID, PARCHMENT_WARM],
        "feature": "wooden_castle"
    },
    {
        "dest": "manali", "slug": "dylans-cafe", "name": "Dylan's Toasted & Roasted Coffee House",
        "theme": "cafe", "palette": [TERRACOTTA_DEEP, BRASS_GOLD, PARCHMENT_WARM, FOREST_MID],
        "feature": "cozy_roastery"
    },
    {
        "dest": "manali", "slug": "rohtang-pass", "name": "Rohtang Pass Snow Crest & Alpine Gateway",
        "theme": "pass", "palette": [ALPINE_BLUE, MIST_SLATE, PARCHMENT_LIGHT, FOREST_DARK],
        "feature": "snow_crest"
    },
    {
        "dest": "manali", "slug": "sethan-igloo-village", "name": "Sethan Igloo Village & Hampta Valley Ridge",
        "theme": "village", "palette": [MIST_SLATE, FOREST_DARK, BRASS_GOLD, PARCHMENT_LIGHT],
        "feature": "dome_ridge"
    },
    {
        "dest": "manali", "slug": "gulaba-meadows", "name": "Gulaba Meadows & Alpine Snow Line",
        "theme": "meadow", "palette": [FOREST_LIGHT, MIST_SLATE, PARCHMENT_WARM, BRASS_GOLD],
        "feature": "alpine_meadow"
    },
    {
        "dest": "manali", "slug": "chopsticks-manali", "name": "Chopsticks Tibetan & Asian Kitchen",
        "theme": "food", "palette": [TERRACOTTA, BRASS_DARK, PARCHMENT_WARM, FOREST_MID],
        "feature": "asian_kitchen"
    },

    # Kasol
    {
        "dest": "kasol", "slug": "pulga-fairy-forest", "name": "Pulga Fairy Forest (Ancient Deodar Enclave)",
        "theme": "nature", "palette": [FOREST_DARK, FOREST_LIGHT, MIST_SLATE, BRASS_GOLD],
        "feature": "fairy_forest"
    },
    {
        "dest": "kasol", "slug": "rasol-trail", "name": "Rasol High Alpine Village Trail",
        "theme": "trail", "palette": [FOREST_MID, ALPINE_BLUE, PARCHMENT_LIGHT, TERRACOTTA],
        "feature": "steep_trail"
    },
    {
        "dest": "kasol", "slug": "chojh-bridge", "name": "Chojh Riverside Pebble Beach & Suspension Bridge",
        "theme": "river", "palette": [RIVER_TEAL, PARCHMENT_WARM, FOREST_MID, BRASS_GOLD],
        "feature": "suspension_bridge"
    },
    {
        "dest": "kasol", "slug": "kalga-village", "name": "Kalga Village & Terraced Apple Orchards",
        "theme": "village", "palette": [PARCHMENT_WARM, FOREST_LIGHT, TERRACOTTA, BRASS_GOLD],
        "feature": "apple_orchard"
    },
    {
        "dest": "kasol", "slug": "tulga-hamlet", "name": "Tulga Rustic Wooden Hamlet",
        "theme": "village", "palette": [BRASS_DARK, FOREST_MID, PARCHMENT_WARM, MIST_SLATE],
        "feature": "wooden_hamlet"
    },
    {
        "dest": "kasol", "slug": "jim-morrison-cafe", "name": "Jim Morrison Wooden Terrace & Shakshuka Cafe",
        "theme": "cafe", "palette": [TERRACOTTA_DEEP, BRASS_GOLD, FOREST_DARK, PARCHMENT_WARM],
        "feature": "terrace_cafe"
    },
    {
        "dest": "kasol", "slug": "waichin-valley", "name": "Waichin Valley (Magic Valley Glacial Meadow)",
        "theme": "nature", "palette": [ALPINE_BLUE, MIST_SLATE, FOREST_LIGHT, PARCHMENT_LIGHT],
        "feature": "glacial_valley"
    },

    # Dharamshala
    {
        "dest": "dharamshala", "slug": "gyuto-monastery", "name": "Gyuto Monastery (Tantric Chanting & Karmapa Seat)",
        "theme": "monastery", "palette": [TERRACOTTA, BRASS_GOLD, FOREST_MID, PARCHMENT_LIGHT],
        "feature": "tibetan_monastery"
    },
    {
        "dest": "dharamshala", "slug": "masroor-rock-temples", "name": "Masroor Monolithic Rock-Cut Temples",
        "theme": "heritage", "palette": [BRASS_DARK, PARCHMENT_WARM, FOREST_DARK, TERRACOTTA],
        "feature": "rock_cut_temple"
    },
    {
        "dest": "dharamshala", "slug": "kangra-fort", "name": "Kangra Fort (Ancient 4th Century BCE Citadel)",
        "theme": "heritage", "palette": [TERRACOTTA_DEEP, BRASS_DARK, PARCHMENT_WARM, FOREST_DARK],
        "feature": "fort_citadel"
    },
    {
        "dest": "dharamshala", "slug": "dal-lake-dharamshala", "name": "Dal Lake Dharamshala & Sacred Deodar Groves",
        "theme": "lake", "palette": [RIVER_TEAL, FOREST_MID, MIST_SLATE, PARCHMENT_WARM],
        "feature": "sacred_lake"
    },
    {
        "dest": "dharamshala", "slug": "tibetan-butter-tea", "name": "Tibetan Butter Tea & Tingmo Bakery Lane",
        "theme": "food", "palette": [PARCHMENT_WARM, BRASS_GOLD, TERRACOTTA, FOREST_MID],
        "feature": "butter_tea"
    },
    {
        "dest": "dharamshala", "slug": "tashi-jong-monastery", "name": "Tashi Jong Buddhist Craft Community",
        "theme": "monastery", "palette": [BRASS_GOLD, TERRACOTTA, FOREST_DARK, MIST_SLATE],
        "feature": "stupa_craft"
    },

    # Mussoorie
    {
        "dest": "mussoorie", "slug": "rokeby-manor", "name": "Rokeby Manor & Emily's Tea Room",
        "theme": "cafe", "palette": [PARCHMENT_WARM, BRASS_DARK, FOREST_MID, TERRACOTTA],
        "feature": "stone_estate"
    },
    {
        "dest": "mussoorie", "slug": "prakash-store", "name": "Prakash Store & Handmade Cheese Deli (1928)",
        "theme": "food", "palette": [BRASS_GOLD, TERRACOTTA_DEEP, PARCHMENT_WARM, FOREST_MID],
        "feature": "heritage_deli"
    },

    # Rishikesh
    {
        "dest": "rishikesh", "slug": "swarg-ashram", "name": "Swarg Ashram & Sacred Kutiyas",
        "theme": "spiritual", "palette": [PARCHMENT_LIGHT, BRASS_GOLD, RIVER_TEAL, FOREST_MID],
        "feature": "ashram_ghat"
    },
    {
        "dest": "rishikesh", "slug": "patna-waterfall", "name": "Patna Cascading Waterfall & Limestone Caves",
        "theme": "waterfall", "palette": [RIVER_TEAL, FOREST_MID, MIST_SLATE, PARCHMENT_LIGHT],
        "feature": "limestone_falls"
    },
    {
        "dest": "rishikesh", "slug": "kaudiyala-white-sands", "name": "Kaudiyala White Sand River Bank",
        "theme": "river", "palette": [PARCHMENT_LIGHT, RIVER_TEAL, FOREST_DARK, BRASS_GOLD],
        "feature": "white_sands"
    },
    {
        "dest": "rishikesh", "slug": "sitting-elephant-restaurant", "name": "The Sitting Elephant Rooftop Dining",
        "theme": "food", "palette": [TERRACOTTA, RIVER_TEAL, PARCHMENT_WARM, BRASS_GOLD],
        "feature": "rooftop_dining"
    },

    # Udaipur
    {
        "dest": "udaipur", "slug": "fateh-sagar-lake", "name": "Fateh Sagar Lake & Nehru Island Park",
        "theme": "lake", "palette": [RIVER_TEAL, PARCHMENT_LIGHT, BRASS_GOLD, FOREST_MID],
        "feature": "island_lake"
    },
    {
        "dest": "udaipur", "slug": "shilpgram-crafts", "name": "Shilpgram (Rural Arts & Crafts Complex)",
        "theme": "heritage", "palette": [TERRACOTTA, BRASS_GOLD, PARCHMENT_WARM, FOREST_DARK],
        "feature": "rural_craft"
    },
    {
        "dest": "udaipur", "slug": "doodh-talai-lake", "name": "Doodh Talai Lake & Ropeway to Karni Mata",
        "theme": "lake", "palette": [RIVER_TEAL, BRASS_DARK, TERRACOTTA, PARCHMENT_WARM],
        "feature": "lake_ropeway"
    },
    {
        "dest": "udaipur", "slug": "upre-rooftop-dining", "name": "Upre by 1559 AD (Lake Pichola Rooftop)",
        "theme": "food", "palette": [BRASS_GOLD, RIVER_TEAL, PARCHMENT_LIGHT, TERRACOTTA_DEEP],
        "feature": "pichola_rooftop"
    },
    {
        "dest": "udaipur", "slug": "ahar-cenotaphs", "name": "Ahar Royal Cenotaphs (Mahasatyas of Mewar)",
        "theme": "heritage", "palette": [PARCHMENT_LIGHT, BRASS_DARK, TERRACOTTA, FOREST_DARK],
        "feature": "royal_cenotaphs"
    },
    {
        "dest": "udaipur", "slug": "millets-of-mewar", "name": "Millets of Mewar (Healthy Rajasthani Kitchen)",
        "theme": "cafe", "palette": [FOREST_LIGHT, PARCHMENT_WARM, BRASS_GOLD, TERRACOTTA],
        "feature": "organic_kitchen"
    },
    {
        "dest": "udaipur", "slug": "paliwal-kachori", "name": "Paliwal Kachori Old City Breakfast Stand",
        "theme": "food", "palette": [TERRACOTTA, BRASS_GOLD, PARCHMENT_WARM, FOREST_DARK],
        "feature": "kachori_stall"
    },

    # Jaipur
    {
        "dest": "jaipur", "slug": "jaigarh-fort", "name": "Jaigarh Fort & Jaivana Royal Cannon",
        "theme": "heritage", "palette": [TERRACOTTA_DEEP, BRASS_DARK, DESERT_SAND, FOREST_DARK],
        "feature": "hill_fortress"
    },
    {
        "dest": "jaipur", "slug": "jal-mahal", "name": "Jal Mahal (The Floating Water Palace)",
        "theme": "heritage", "palette": [RIVER_TEAL, TERRACOTTA, BRASS_GOLD, PARCHMENT_LIGHT],
        "feature": "water_palace"
    },
    {
        "dest": "jaipur", "slug": "galta-ji-temple", "name": "Galta Ji (The Sacred Monkey Temple & Kunds)",
        "theme": "spiritual", "palette": [TERRACOTTA, BRASS_GOLD, RIVER_TEAL, PARCHMENT_WARM],
        "feature": "gorge_kund"
    },
    {
        "dest": "jaipur", "slug": "albert-hall-museum", "name": "Albert Hall State Museum (Indo-Saracenic)",
        "theme": "heritage", "palette": [BRASS_GOLD, PARCHMENT_LIGHT, TERRACOTTA, FOREST_MID],
        "feature": "saracenic_palace"
    },
    {
        "dest": "jaipur", "slug": "rawat-mishthan-bhandar", "name": "Rawat Mishthan Bhandar (Original Pyaaz Kachori)",
        "theme": "food", "palette": [TERRACOTTA, BRASS_GOLD, PARCHMENT_WARM, FOREST_MID],
        "feature": "kachori_sweet"
    },
    {
        "dest": "jaipur", "slug": "patrika-gate", "name": "Patrika Gate & Jawahar Circle Garden",
        "theme": "heritage", "palette": [TERRACOTTA, BRASS_GOLD, FOREST_LIGHT, PARCHMENT_LIGHT],
        "feature": "ornate_arch_gate"
    },
    {
        "dest": "jaipur", "slug": "wind-view-cafe", "name": "Wind View Cafe (Hawa Mahal Eye-Level Terrace)",
        "theme": "cafe", "palette": [TERRACOTTA, PARCHMENT_WARM, BRASS_GOLD, RIVER_TEAL],
        "feature": "hawa_mahal_terrace"
    },

    # Goa
    {
        "dest": "goa", "slug": "reis-magos-fort", "name": "Reis Magos Fort & Mandovi Estuary",
        "theme": "heritage", "palette": [TERRACOTTA_DEEP, RIVER_TEAL, FOREST_MID, PARCHMENT_LIGHT],
        "feature": "estuary_fort"
    },
    {
        "dest": "goa", "slug": "arambol-sweet-lake", "name": "Arambol Sweet Water Lagoon & Banyan Tree Trail",
        "theme": "nature", "palette": [RIVER_TEAL, FOREST_LIGHT, PARCHMENT_WARM, BRASS_GOLD],
        "feature": "lagoon_banyan"
    },
    {
        "dest": "goa", "slug": "baba-au-rhum-cafe", "name": "Baba Au Rhum French Bamboo Garden",
        "theme": "cafe", "palette": [FOREST_MID, PARCHMENT_WARM, TERRACOTTA, BRASS_GOLD],
        "feature": "bamboo_bistro"
    },
    {
        "dest": "goa", "slug": "gunpowder-assagao", "name": "Gunpowder Assagao Heritage Peninsular Dining",
        "theme": "food", "palette": [TERRACOTTA, BRASS_GOLD, FOREST_MID, PARCHMENT_WARM],
        "feature": "heritage_veranda"
    },

    # Varanasi
    {
        "dest": "varanasi", "slug": "deena-chaat-bhandar", "name": "Deena Chaat Bhandar (Tamatar Chaat)",
        "theme": "food", "palette": [TERRACOTTA_DEEP, BRASS_GOLD, PARCHMENT_WARM, FOREST_DARK],
        "feature": "chaat_clay_pot"
    },
    {
        "dest": "varanasi", "slug": "harishchandra-ghat", "name": "Harishchandra Ghat & Silent Sacred Pyres",
        "theme": "spiritual", "palette": [TERRACOTTA_DEEP, BRASS_DARK, RIVER_TEAL, PARCHMENT_WARM],
        "feature": "ancient_ghat_steps"
    },
    {
        "dest": "varanasi", "slug": "bharat-kala-bhavan", "name": "Bharat Kala Bhavan Archeological Museum",
        "theme": "heritage", "palette": [BRASS_GOLD, PARCHMENT_LIGHT, TERRACOTTA, FOREST_MID],
        "feature": "museum_pavilion"
    },
    {
        "dest": "varanasi", "slug": "kashi-chat-bhandar", "name": "Kashi Chat Bhandar (Godowlia Chowk)",
        "theme": "food", "palette": [TERRACOTTA, BRASS_GOLD, PARCHMENT_WARM, RIVER_TEAL],
        "feature": "chowk_chaat"
    },
    {
        "dest": "varanasi", "slug": "scindia-ghat-leaning-temple", "name": "Scindia Ghat & The Leaning Shiva Temple",
        "theme": "spiritual", "palette": [RIVER_TEAL, BRASS_DARK, TERRACOTTA, PARCHMENT_LIGHT],
        "feature": "leaning_temple_ghat"
    },

    # Leh
    {
        "dest": "leh", "slug": "alchi-monastery", "name": "Alchi Monastery & 11th-Century Murals",
        "theme": "monastery", "palette": [BRASS_GOLD, TERRACOTTA, DESERT_SAND, FOREST_DARK],
        "feature": "mud_monastery_murals"
    },
    {
        "dest": "leh", "slug": "hemis-monastery", "name": "Hemis Monastery & Sacred Museum",
        "theme": "monastery", "palette": [TERRACOTTA, BRASS_DARK, ALPINE_BLUE, PARCHMENT_LIGHT],
        "feature": "cliff_monastery"
    },
    {
        "dest": "leh", "slug": "zorawar-fort", "name": "General Zorawar Fort & Military Museum",
        "theme": "heritage", "palette": [DESERT_SAND, BRASS_DARK, ALPINE_BLUE, TERRACOTTA],
        "feature": "mud_fortress"
    },
    {
        "dest": "leh", "slug": "lamayuru-moonland", "name": "Lamayuru Moonland & Ancient Monastery",
        "theme": "monastery", "palette": [DESERT_SAND, ALPINE_BLUE, TERRACOTTA_DEEP, PARCHMENT_LIGHT],
        "feature": "moonland_erosion"
    },
    {
        "dest": "leh", "slug": "nubra-hunder-sand-dunes", "name": "Nubra Valley & Hunder Sand Dunes",
        "theme": "nature", "palette": [DESERT_SAND, ALPINE_BLUE, MIST_SLATE, PARCHMENT_LIGHT],
        "feature": "high_altitude_dunes"
    },
    {
        "dest": "leh", "slug": "bon-appetit-leh", "name": "Bon Appetit Organic Garden Dining",
        "theme": "food", "palette": [FOREST_MID, BRASS_GOLD, PARCHMENT_WARM, ALPINE_BLUE],
        "feature": "organic_garden"
    },
    {
        "dest": "leh", "slug": "khardung-la", "name": "Khardung La High Mountain Pass (5,359m)",
        "theme": "pass", "palette": [ALPINE_BLUE, MIST_SLATE, PARCHMENT_LIGHT, FOREST_DARK],
        "feature": "snow_pass_flags"
    },
    {
        "dest": "leh", "slug": "magnetic-hill", "name": "Magnetic Hill Gravity Defying Ridge",
        "theme": "nature", "palette": [DESERT_SAND, ALPINE_BLUE, FOREST_DARK, PARCHMENT_WARM],
        "feature": "highway_ridge"
    },

    # Spiti
    {
        "dest": "spiti", "slug": "chicham-bridge", "name": "Chicham Suspension Bridge (Asia's Highest)",
        "theme": "bridge", "palette": [ALPINE_BLUE, TERRACOTTA_DEEP, MIST_SLATE, PARCHMENT_LIGHT],
        "feature": "canyon_suspension_bridge"
    },
    {
        "dest": "spiti", "slug": "dhankar-lake", "name": "Dhankar Glacial Lake Alpine Tarn",
        "theme": "lake", "palette": [RIVER_TEAL, ALPINE_BLUE, MIST_SLATE, PARCHMENT_LIGHT],
        "feature": "high_tarn"
    },
    {
        "dest": "spiti", "slug": "gue-monastery", "name": "Gue Monastery & 500-Year-Old Natural Mummy",
        "theme": "monastery", "palette": [BRASS_GOLD, TERRACOTTA, DESERT_SAND, FOREST_DARK],
        "feature": "isolated_stupa"
    },
    {
        "dest": "spiti", "slug": "kunzum-pass", "name": "Kunzum Pass (Gateway to Spiti at 4,551m)",
        "theme": "pass", "palette": [ALPINE_BLUE, MIST_SLATE, PARCHMENT_LIGHT, TERRACOTTA],
        "feature": "stupa_flags_pass"
    },
    {
        "dest": "spiti", "slug": "tashigang", "name": "Tashigang (World's Highest Polling Station)",
        "theme": "village", "palette": [DESERT_SAND, ALPINE_BLUE, FOREST_DARK, PARCHMENT_LIGHT],
        "feature": "isolated_high_village"
    },
    {
        "dest": "spiti", "slug": "kibber-village", "name": "Kibber Village & Wildlife Sanctuary",
        "theme": "village", "palette": [MIST_SLATE, FOREST_DARK, BRASS_GOLD, PARCHMENT_LIGHT],
        "feature": "mud_stone_village"
    },
    {
        "dest": "spiti", "slug": "mudh-village", "name": "Mudh Village (Terminal Hamlet of Pin Valley)",
        "theme": "village", "palette": [FOREST_LIGHT, DESERT_SAND, TERRACOTTA, PARCHMENT_WARM],
        "feature": "green_meadow_hamlet"
    },
    {
        "dest": "spiti", "slug": "himalayan-cafe-spiti", "name": "The Himalayan Cafe & Slow Travel Lounge",
        "theme": "cafe", "palette": [TERRACOTTA, BRASS_GOLD, PARCHMENT_WARM, FOREST_DARK],
        "feature": "kaza_rooftop_cafe"
    },

    # Munnar
    {
        "dest": "munnar", "slug": "anamudi-peak-base", "name": "Anamudi Peak Base & Shola Forest Edge",
        "theme": "nature", "palette": [FOREST_DARK, FOREST_LIGHT, MIST_SLATE, PARCHMENT_LIGHT],
        "feature": "peak_shola_forest"
    },
    {
        "dest": "munnar", "slug": "marayoor-sandalwood-forest", "name": "Marayoor Sandalwood Forest & Megalithic Dolmens",
        "theme": "nature", "palette": [BRASS_DARK, FOREST_MID, PARCHMENT_WARM, TERRACOTTA],
        "feature": "sandalwood_dolmens"
    },
    {
        "dest": "munnar", "slug": "eastend-chai-bazaar", "name": "Eastend Chai Bazaar & Plantation Tasting",
        "theme": "food", "palette": [BRASS_GOLD, FOREST_LIGHT, PARCHMENT_WARM, TERRACOTTA],
        "feature": "tea_tasting_room"
    },
    {
        "dest": "munnar", "slug": "chinnar-wildlife-sanctuary", "name": "Chinnar Wildlife Sanctuary & Thorny Scrub",
        "theme": "nature", "palette": [BRASS_DARK, FOREST_MID, DESERT_SAND, PARCHMENT_LIGHT],
        "feature": "scrub_gorge"
    },
    {
        "dest": "munnar", "slug": "lakkom-waterfalls", "name": "Lakkom Cascading Waterfalls",
        "theme": "waterfall", "palette": [RIVER_TEAL, FOREST_DARK, MIST_SLATE, PARCHMENT_LIGHT],
        "feature": "forest_cascade"
    },
    {
        "dest": "munnar", "slug": "lockhart-gap", "name": "Lockhart Gap & Bison Valley Viewpoint",
        "theme": "viewpoint", "palette": [FOREST_MID, MIST_SLATE, BRASS_GOLD, PARCHMENT_LIGHT],
        "feature": "valley_gap_view"
    },
    {
        "dest": "munnar", "slug": "saravana-bhavan-munnar", "name": "Saravana Bhavan Munnar Town",
        "theme": "food", "palette": [TERRACOTTA, BRASS_GOLD, PARCHMENT_WARM, FOREST_MID],
        "feature": "south_indian_thali"
    }
]

def synthesize_illustration(asset: dict) -> Image.Image:
    """
    Renders an editorial gouache-style travel illustration according to the art bible.
    Dimensions: 1200 x 800 (3:2 wide aspect ratio)
    """
    w, h = 1200, 800
    p1, p2, p3, p4 = asset["palette"]
    seed_int = int(hashlib.md5(asset["slug"].encode()).hexdigest()[:8], 16)
    
    img = Image.new("RGB", (w, h), p1)
    draw = ImageDraw.Draw(img)

    # 1. Sky Gradient with atmospheric color shift
    for y in range(int(h * 0.55)):
        ratio = y / (h * 0.55)
        r = int(p1[0] + (p2[0] - p1[0]) * ratio)
        g = int(p1[1] + (p2[1] - p1[1]) * ratio)
        b = int(p1[2] + (p2[2] - p1[2]) * ratio)
        draw.line([(0, y), (w, y)], fill=(r, g, b))

    # 2. Distant mountain/cloud silhouette layer
    distant_pts = [(0, int(h * 0.45))]
    for x in range(0, w + 50, 50):
        wave = math.sin((x + seed_int % 300) / 120.0) * 45 + math.cos(x / 75.0) * 25
        distant_pts.append((x, int(h * 0.35 + wave)))
    distant_pts.append((w, h))
    distant_pts.append((0, h))
    draw.polygon(distant_pts, fill=p3)

    # 3. Midground ridgeline or architectural silhouette
    mid_pts = [(0, int(h * 0.55))]
    for x in range(0, w + 40, 40):
        wave2 = math.cos((x + seed_int % 500) / 90.0) * 35 + math.sin(x / 60.0) * 20
        mid_pts.append((x, int(h * 0.48 + wave2)))
    mid_pts.append((w, h))
    mid_pts.append((0, h))
    draw.polygon(mid_pts, fill=p4)

    # 4. Feature-specific stylized elements
    feat = asset.get("feature", "")
    if "bridge" in feat or "suspension" in feat:
        # High vertical canyon suspension bridge cables & gorge
        gorge_y = int(h * 0.65)
        draw.rectangle([(int(w * 0.1), gorge_y), (int(w * 0.9), gorge_y + 12)], fill=p1)
        # Vertical suspension lines
        for x_line in range(int(w * 0.15), int(w * 0.88), 35):
            draw.line([(x_line, int(h * 0.48)), (x_line, gorge_y)], fill=BRASS_GOLD, width=2)
        # Main suspension arch cables
        for seg_x in range(int(w * 0.1), int(w * 0.9)):
            norm_x = (seg_x - w * 0.1) / (w * 0.8)
            cat_y = int(h * 0.45 + 110 * (4 * (norm_x - 0.5) ** 2))
            draw.point((seg_x, cat_y), fill=BRASS_GOLD)
            draw.point((seg_x, cat_y + 1), fill=BRASS_GOLD)
    elif "waterfall" in feat or "cascade" in feat:
        # Cascading river mist channel
        for i in range(15):
            offset = (seed_int * 7 + i * 23) % 80 - 40
            stream_x = int(w * 0.52 + offset)
            draw.line([(stream_x, int(h * 0.45)), (stream_x + offset // 2, int(h * 0.85))], fill=MIST_SLATE, width=4)
    elif "monastery" in feat or "temple" in feat or "stupa" in feat or "castle" in feat:
        # Tiered architectural silhouette
        base_x = int(w * 0.35 + (seed_int % 100))
        base_y = int(h * 0.52)
        draw.rectangle([(base_x, base_y - 80), (base_x + 140, base_y)], fill=p2)
        draw.rectangle([(base_x + 25, base_y - 130), (base_x + 115, base_y - 80)], fill=BRASS_GOLD)
        draw.polygon([(base_x + 15, base_y - 130), (base_x + 70, base_y - 170), (base_x + 125, base_y - 130)], fill=TERRACOTTA)
    elif "lake" in feat or "lagoon" in feat or "river" in feat:
        # Serene reflective water body at bottom half
        water_y = int(h * 0.62)
        draw.rectangle([(0, water_y), (w, h)], fill=p3)
        for wy in range(water_y + 10, h - 20, 20):
            draw.line([(int(w * 0.15), wy), (int(w * 0.85), wy)], fill=MIST_SLATE, width=1)
    else:
        # Atmospheric valley & tiered terrace contours
        for step in range(3):
            sy = int(h * 0.62 + step * 35)
            draw.polygon([(0, sy), (w, int(sy + 25)), (w, h), (0, h)], fill=p1)

    # 5. Foreground slope & painterly vignette framing
    fore_pts = [(0, int(h * 0.72)), (int(w * 0.35), int(h * 0.82)), (w, int(h * 0.75)), (w, h), (0, h)]
    draw.polygon(fore_pts, fill=FOREST_DARK)

    # 6. Apply subtle blur/texture smoothing
    img = img.filter(ImageFilter.SMOOTH_MORE)
    return img

def main():
    print("Generating dedicated physical place editorial assets...")
    count = 0
    for asset in ASSET_DEFINITIONS:
        dest_dir = os.path.join(PUBLIC_PLACES, asset["dest"])
        os.makedirs(dest_dir, exist_ok=True)

        webp_path = os.path.join(dest_dir, f"{asset['slug']}.webp")
        jpg_path = os.path.join(dest_dir, f"{asset['slug']}.jpg")

        img = synthesize_illustration(asset)
        img.save(webp_path, "WEBP", quality=90)
        img.save(jpg_path, "JPEG", quality=90)
        count += 1
        print(f"[{count}/{len(ASSET_DEFINITIONS)}] Created {asset['dest']}/{asset['slug']}.webp")

    print(f"\nSuccessfully generated {count} dedicated place artwork assets.")

if __name__ == "__main__":
    main()

