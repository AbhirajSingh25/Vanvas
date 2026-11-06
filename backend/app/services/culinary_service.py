import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.models import Destination, Place
from app.seed.canonical_dataset import CANONICAL_26_DESTINATIONS, ADDITIONAL_PLACES_BY_DEST

logger = logging.getLogger("vanvas.culinary")

# Canonical Signature Dishes across India & Himalayas
SIGNATURE_DISHES_BY_DEST: Dict[str, Dict[str, Any]] = {
    "spiti": {
        "food_culture_summary": "High-altitude Tibetan-Himalayan cold-desert cuisine centered on barley, local root vegetables, dry yak cheese (chhurpi), fermented wheat bread, and warming bone/herb broths.",
        "food_etiquette": "Meals are traditionally eaten sitting cross-legged around a wood-fired bukhari stove. Sip butter tea slowly; it is customary for hosts to refill tea cups continuously.",
        "dishes": [
            {
                "dish_name": "Spiti Thukpa",
                "hindi_name": "स्पीति थुकपा",
                "category": "Alpine Comfort Food",
                "dietary": "Vegetarian",
                "flavor_profile": "Hearty, warming noodle soup with shredded mountain vegetables, ginger, garlic, and wild herbs.",
                "origin_story": "Centuries-old high-altitude staple consumed by Spitian families and gompa monks during sub-zero winters.",
                "typical_price_inr": 180,
                "best_places_to_try": [
                    {"name": "Sol Cafe", "address": "Kaza Main Market"},
                    {"name": "The Himalayan Cafe", "address": "Old Kaza"}
                ],
                "image_url": "/images/food/spiti/thukpa.webp"
            },
            {
                "dish_name": "Tingmo with Vegetable Stew",
                "hindi_name": "टिंगमो और सब्जी",
                "category": "Signature Dish",
                "dietary": "Vegetarian",
                "flavor_profile": "Soft steamed flower-shaped yeast bread served with mild vegetable broth and spicy chili dip.",
                "origin_story": "Traditional Tibetan steamed lotus bread baked fresh in clay steamers across Spitian monasteries.",
                "typical_price_inr": 160,
                "best_places_to_try": [
                    {"name": "Cafe Deyzor", "address": "Kaza Heights"},
                    {"name": "Zostel Spiti Cafe", "address": "Kaza"}
                ],
                "image_url": "/images/food/spiti/tingmo.webp"
            },
            {
                "dish_name": "Po Cha (Himalayan Butter Tea)",
                "hindi_name": "पो छा (मक्खन चाय)",
                "category": "Monastic Tea",
                "dietary": "Vegetarian",
                "flavor_profile": "Savory, rich salted tea churned with yak butter and black tea leaves.",
                "origin_story": "Vital alpine drink providing essential salt, fats, and hydration to prevent lips cracking in bone-dry cold desert winds.",
                "typical_price_inr": 80,
                "best_places_to_try": [
                    {"name": "Key Monastery Kitchen", "address": "Key Gompa"},
                    {"name": "Cafe Deyzor", "address": "Kaza Heights"}
                ],
                "image_url": "/images/food/spiti/butter-tea.webp"
            },
            {
                "dish_name": "Seabuckthorn Berry Nectar",
                "hindi_name": "सीबकथॉर्न बेरी रस",
                "category": "Wild Mountain Elixir",
                "dietary": "Vegan",
                "flavor_profile": "Tart, citrusy, naturally sweet elixir packed with Vitamin C and flavonoids.",
                "origin_story": "Harvested from wild thorny seabuckthorn (tsuk) bushes growing along the stony Spiti riverbed.",
                "typical_price_inr": 120,
                "best_places_to_try": [
                    {"name": "Sol Cafe", "address": "Kaza Main Market"}
                ],
                "image_url": "/images/food/spiti/seabuckthorn.webp"
            }
        ]
    },
    "jaipur": {
        "food_culture_summary": "Opulent Mewari and Dhundhari royal cuisine celebrated for rich desi ghee preparations, wood-fired roasting, sundried lentils, and intricate sweetmeats (mithai).",
        "food_etiquette": "Traditional thalis are served on brass plates. Dal baati is eaten by crushing the baatis by hand and soaking them deeply in warm spiced dal and melted ghee.",
        "dishes": [
            {
                "dish_name": "Dal Baati Churma",
                "hindi_name": "दाल बाटी चूरमा",
                "category": "Royal Thali Essential",
                "dietary": "Vegetarian",
                "flavor_profile": "Smoky baked whole wheat balls soaked in desi ghee, paired with spicy mixed lentil dal and sweet powdered jaggery-wheat churma.",
                "origin_story": "War food of the Rajput warriors, buried in desert sand under burning coals during morning campaigns and unearthed baked at sunset.",
                "typical_price_inr": 350,
                "best_places_to_try": [
                    {"name": "Laxmi Mishthan Bhandar (LMB)", "address": "Johari Bazaar"},
                    {"name": "Chokhi Dhani Heritage", "address": "Tonk Road"}
                ],
                "image_url": "/images/food/jaipur/dal-baati.webp"
            },
            {
                "dish_name": "Pyaaz Kachori & Mirchi Vada",
                "hindi_name": "प्याज कचौरी व मिर्ची वड़ा",
                "category": "Street Food Legend",
                "dietary": "Vegetarian",
                "flavor_profile": "Flaky, crisp golden pastry filled with caramelized spiced onions, nigella seeds, and tamarind chutney.",
                "origin_story": "Pioneered in Old Jaipur's Johari Bazaar as an early morning artisan breakfast for gem merchants and metalworkers.",
                "typical_price_inr": 50,
                "best_places_to_try": [
                    {"name": "Rawat Mishthan Bhandar", "address": "Station Road"},
                    {"name": "Samrat Restaurant", "address": "Chaura Rasta"}
                ],
                "image_url": "/images/food/jaipur/pyaaz-kachori.webp"
            },
            {
                "dish_name": "Malai Ghewar",
                "hindi_name": "मलाई घेवर",
                "category": "Heritage Mithai",
                "dietary": "Vegetarian",
                "flavor_profile": "Disc-shaped honeycomb crisp sweet soaked in saffron syrup and capped with thick rabri, pistachios, and silver vark.",
                "origin_story": "Created for the Teej and Raksha Bandhan monsoon festivals to balance humidity through delicate ghee frying.",
                "typical_price_inr": 150,
                "best_places_to_try": [
                    {"name": "LMB Johari Bazaar", "address": "Johari Bazaar"}
                ],
                "image_url": "/images/food/jaipur/ghewar.webp"
            }
        ]
    },
    "varanasi": {
        "food_culture_summary": "Ancient Satvik street food culture without onion or garlic in temple areas, showcasing clay-pot fermented milk sweets, spiced morning kachoris, and evening street chaats along the eternal ghats.",
        "food_etiquette": "Street food is served in eco-friendly dona (dry leaf bowls) and kulhad (clay cups). Dispose of kulhads in traditional earth disposal bins.",
        "dishes": [
            {
                "dish_name": "Banarasi Tamatar Chaat",
                "hindi_name": "बनारसी टमाटर चाट",
                "category": "Signature Street Food",
                "dietary": "Vegetarian",
                "flavor_profile": "Mashed spiced tomatoes, boiled potatoes, hing, ginger, cumin syrup, finished with crunchy namakpara.",
                "origin_story": "Unique to Varanasi, crafted by old Kashi chaat makers to create a sweet, savory, and tangy digestive treat near Dashashwamedh Ghat.",
                "typical_price_inr": 60,
                "best_places_to_try": [
                    {"name": "Kashi Chaat Bhandar", "address": "Godowlia Chowk"},
                    {"name": "Deena Chaat Bhandar", "address": "Golghar"}
                ],
                "image_url": "/images/food/varanasi/tamatar-chaat.webp"
            },
            {
                "dish_name": "Banarasi Malaiyo (Winter Milk Dew)",
                "hindi_name": "बनारसी मलइयो",
                "category": "Heritage Sweet",
                "dietary": "Vegetarian",
                "flavor_profile": "Feather-light frothy milk foam infused with saffron, cardamom, and raw pistachios.",
                "origin_story": "Prepared exclusively during winter months by leaving raw milk on open rooftops overnight to catch morning dew before hand-whipping into cloud-like foam.",
                "typical_price_inr": 70,
                "best_places_to_try": [
                    {"name": "Shriji Sweets", "address": "Chaukhamba Lane"},
                    {"name": "Markandey Sweets", "address": "Thatheri Bazaar"}
                ],
                "image_url": "/images/food/varanasi/malaiyo.webp"
            },
            {
                "dish_name": "Kachori Sabzi & Jalebi Breakfast",
                "hindi_name": "कचौरी सब्जी और जलेबी",
                "category": "Dawn Breakfast",
                "dietary": "Vegetarian",
                "flavor_profile": "Puffed whole-wheat puris stuffed with spiced urad dal paste, served with fiery aloo dum and crispy saffron jalebi.",
                "origin_story": "The quintessential post-dawn river dip breakfast consumed by pilgrims and locals along Vishwanath Gali.",
                "typical_price_inr": 60,
                "best_places_to_try": [
                    {"name": "Ram Bhandar", "address": "Thatheri Bazaar"},
                    {"name": "Madhur Milan", "address": "Dashashwamedh"}
                ],
                "image_url": "/images/food/varanasi/kachori-jalebi.webp"
            }
        ]
    },
    "manali": {
        "food_culture_summary": "Hearty Himachali Pahadi cuisine designed for sub-zero alpine living, characterized by fermented wheat, slow-cooked lentils with curd (Madra), and fresh freshwater Himalayan river trout.",
        "food_etiquette": "Traditionally cooked in heavy brass degchis over mountain oak firewood.",
        "dishes": [
            {
                "dish_name": "Siddu with Desi Ghee & Dal Paste",
                "hindi_name": "सिड्डू (देसी घी के साथ)",
                "category": "Himachali Signature",
                "dietary": "Vegetarian",
                "flavor_profile": "Dense, steamed wheat bun stuffed with spiced poppy seeds (khus khus), walnuts, and crushed lentils, dipped in golden melted ghee.",
                "origin_story": "Traditional mountain feast bread of the Kullu valley providing sustained warmth and energy during winter snowstorms.",
                "typical_price_inr": 120,
                "best_places_to_try": [
                    {"name": "Chopsticks Restaurant", "address": "Mall Road, Manali"},
                    {"name": "Old Manali Dhaba", "address": "Old Manali Bridge"}
                ],
                "image_url": "/images/food/manali/siddu.webp"
            },
            {
                "dish_name": "Himalayan River Trout",
                "hindi_name": "हिमालयी ट्राउट मछली",
                "category": "River Catch",
                "dietary": "Non-Vegetarian",
                "flavor_profile": "Fresh pan-fried freshwater rainbow trout with lemon garlic butter, rosemary, and steamed vegetables.",
                "origin_story": "Introduced to the crystal-clear Beas river currents in the early 20th century, raised in cold glacial water farms at Haripur.",
                "typical_price_inr": 480,
                "best_places_to_try": [
                    {"name": "Johnson's Cafe", "address": "Circuit House Road"},
                    {"name": "Lazy Dog Lounge", "address": "Old Manali"}
                ],
                "image_url": "/images/food/manali/trout.webp"
            }
        ]
    },
    "goa": {
        "food_culture_summary": "Vibrant Indo-Portuguese coastal gastronomy highlighting fresh Arabian Sea catches, coconut milk bases, fiery red Kashmiri/Goan chilis, toddy vinegar, and fragrant Kokum souring agents.",
        "food_etiquette": "Meals are accompanied by freshly baked local Poi bread and a digestive glass of pink Sol Kadi.",
        "dishes": [
            {
                "dish_name": "Goan Fish Curry Thali",
                "hindi_name": "गोवा फिश करी थाली",
                "category": "Coastal Signature",
                "dietary": "Non-Vegetarian",
                "flavor_profile": "Kingfish or Pomfret simmered in ground coconut, teflam pepper berries, and tamarind-kokum gravy, served with red boiled rice.",
                "origin_story": "The eternal soul food of the Konkan coastline, prepared daily in every Goan household and beach shonkin shack.",
                "typical_price_inr": 320,
                "best_places_to_try": [
                    {"name": "Vinayak Family Restaurant", "address": "Assagao"},
                    {"name": "Fisherman's Wharf", "address": "Cavelossim"}
                ],
                "image_url": "/images/food/goa/fish-curry-thali.webp"
            },
            {
                "dish_name": "Bebinca (Seven-Layered Dessert)",
                "hindi_name": "बेबिंका",
                "category": "Heritage Dessert",
                "dietary": "Vegetarian",
                "flavor_profile": "Layer upon layer of slow-baked caramelized coconut milk, egg yolk, flour, and nutmeg pudding.",
                "origin_story": "Created by Sister Bebiana at the Santa Monica convent in Old Goa in the 17th century.",
                "typical_price_inr": 180,
                "best_places_to_try": [
                    {"name": "Viva Panjim", "address": "Fontainhas, Panaji"}
                ],
                "image_url": "/images/food/goa/bebinca.webp"
            }
        ]
    },
    "leh": {
        "food_culture_summary": "Trans-Himalayan Tibetan and Ladakhi sustenance food built around roasted barley flour (Tsampa), sun-dried apricots, hand-rolled pasta shells, and fermented butter teas.",
        "food_etiquette": "Acclimatize for 24-48 hours before consuming heavy meats; drink copious ginger lemon honey tea for altitude adaptation.",
        "dishes": [
            {
                "dish_name": "Ladakhi Skyu",
                "hindi_name": "लद्दाखी स्क्यू",
                "category": "Alpine Heritage",
                "dietary": "Vegetarian",
                "flavor_profile": "Small thumb-pressed wheat dough dumplings slow-cooked in a rich root vegetable and turmeric broth.",
                "origin_story": "Generations-old daily sustenance dish of Ladakhi village homes across Nubra, Zanskar, and Indus valleys.",
                "typical_price_inr": 200,
                "best_places_to_try": [
                    {"name": "The Tibetan Kitchen", "address": "Fort Road, Leh"},
                    {"name": "Alchi Kitchen", "address": "Old Town Leh"}
                ],
                "image_url": "/images/food/leh/skyu.webp"
            },
            {
                "dish_name": "Khambir with Apricot Jam & Butter",
                "hindi_name": "खंबीर और खुबानी जैम",
                "category": "Breakfast Staple",
                "dietary": "Vegetarian",
                "flavor_profile": "Thick, whole-wheat sourdough flatbread baked on iron griddles, smeared with organic Ladakhi apricot preserve.",
                "origin_story": "Baked daily in high-altitude Ladakhi village hearths, keeping fresh for days during pass journeys.",
                "typical_price_inr": 120,
                "best_places_to_try": [
                    {"name": "Bodhi Greens", "address": "Changspa, Leh"},
                    {"name": "Gesmo Restaurant", "address": "Fort Road"}
                ],
                "image_url": "/images/food/leh/khambir.webp"
            }
        ]
    },
    "munnar": {
        "food_culture_summary": "Kerala High Range plantation cuisine featuring fresh Malabar spices (black pepper, cardamom, cinnamon), freshly grated coconut, steamed rice appams, and hill-station cardamom teas.",
        "food_etiquette": "Meals are best eaten traditionally with right hand from clean banana leaves.",
        "dishes": [
            {
                "dish_name": "Appam with Vegetable Ishtu",
                "hindi_name": "अप्पम और वेज स्टू",
                "category": "Plantation Breakfast",
                "dietary": "Vegetarian",
                "flavor_profile": "Bowl-shaped fermented rice pancakes with soft spongy centers and crisp lace edges, bathed in fragrant coconut milk vegetable stew.",
                "origin_story": "Colonial-era plantation bungalow breakfast blending Syrian Christian culinary heritage with estate-fresh spices.",
                "typical_price_inr": 180,
                "best_places_to_try": [
                    {"name": "Rapsy Restaurant", "address": "Main Bazaar, Munnar"},
                    {"name": "Saravana Bhavan", "address": "Munnar Town"}
                ],
                "image_url": "/images/food/munnar/appam-stew.webp"
            },
            {
                "dish_name": "Estate Fresh Cardamom Spiced Tea",
                "hindi_name": "इलायची युक्त मुन्नार चाय",
                "category": "Plantation Brew",
                "dietary": "Vegetarian",
                "flavor_profile": "Strong Nilgiri black tea steeped with freshly crushed green Munnar cardamom pods and fresh milk.",
                "origin_story": "Sourced directly from the high-elevation tea slopes of Lockhart and KDHP tea gardens.",
                "typical_price_inr": 40,
                "best_places_to_try": [
                    {"name": "Tata Tea Museum Cafe", "address": "Nullatanni Estate"}
                ],
                "image_url": "/images/food/munnar/cardamom-tea.webp"
            }
        ]
    }
}


class CulinaryService:
    """
    VANVAS Culinary Intelligence Engine.
    Provides authentic destination food guides, signature dishes, dietary attributes,
    and verified local dining sanctuaries.
    """

    @classmethod
    async def get_destination_culinary_guide(cls, db: Session, destination_slug: str) -> Dict[str, Any]:
        clean_slug = destination_slug.lower().strip()
        if clean_slug.startswith("dest-"):
            clean_slug = clean_slug[5:]

        dest = db.query(Destination).filter(
            (Destination.slug == clean_slug) |
            (Destination.id == f"dest-{clean_slug}") |
            (Destination.id == clean_slug)
        ).first()

        dest_name = dest.name if dest else clean_slug.replace("-", " ").title()

        # Find matching dish registry
        guide_data = SIGNATURE_DISHES_BY_DEST.get(clean_slug)
        if not guide_data:
            # Fallback to similar region or general authentic Indian mountain guide
            guide_data = {
                "food_culture_summary": f"Authentic regional dining in {dest_name}, highlighting local harvest grains, fresh seasonal herbs, roadside dhabas, and heritage recipes.",
                "food_etiquette": "Respect local dining customs, savor fresh seasonal preparations, and prefer clay kulhads for tea.",
                "dishes": [
                    {
                        "dish_name": f"{dest_name} Heritage Thali",
                        "hindi_name": f"{dest_name} पारंपरिक थाली",
                        "category": "Regional Thali",
                        "dietary": "Vegetarian",
                        "flavor_profile": "Balanced plate featuring local seasonal vegetable curries, dal, freshly griddled breads, and digestive chutney.",
                        "origin_story": f"Time-honored family recipe native to the {dest_name} region.",
                        "typical_price_inr": 220,
                        "best_places_to_try": [{"name": f"Local Dhabas of {dest_name}", "address": "Market Center"}],
                        "image_url": "/images/food/generic/thali.webp"
                    }
                ]
            }

        # Query real dining spots from Places database
        dining_places = []
        if dest:
            places_query = db.query(Place).filter(
                (Place.destination_id == dest.id) | (Place.destination_id == f"dest-{dest.slug}")
            ).filter(
                (Place.category.ilike("%food%")) |
                (Place.category.ilike("%cafe%")) |
                (Place.category.ilike("%restaurant%")) |
                (Place.category.ilike("%dhaba%")) |
                (Place.category.ilike("%bakery%")) |
                (Place.tags.ilike("%food%")) |
                (Place.tags.ilike("%dining%")) |
                (Place.tags.ilike("%cafe%"))
            ).limit(8).all()
            dining_places = places_query

        return {
            "destination_slug": clean_slug,
            "destination_name": dest_name,
            "food_culture_summary": guide_data["food_culture_summary"],
            "signature_dishes": guide_data.get("dishes", []),
            "dining_spots": dining_places,
            "food_etiquette": guide_data.get("food_etiquette")
        }

