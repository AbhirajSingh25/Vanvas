import json
from datetime import date, datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.database.session import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.models import (
    User, UserPreference, Destination, PlaceCategory, Place, Hotel,
    RentalOption, TransportOption, Trip, TripMember, Itinerary, ItineraryItem,
    Vote, Expense, SavedPlace, ChecklistItem, WeatherSnapshot
)
from app.itinerary.generator import ItineraryEngine

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Users
        if not db.query(User).filter(User.email == "admin@vanvas.com").first():
            admin_user = User(
                email="admin@vanvas.com",
                hashed_password=get_password_hash("vanvas123"),
                full_name="VANVAS Admin Team",
                role="admin",
                avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
            )
            db.add(admin_user)

        demo_user = db.query(User).filter(User.email == "traveller@vanvas.com").first()
        if not demo_user:
            demo_user = User(
                email="traveller@vanvas.com",
                hashed_password=get_password_hash("vanvas123"),
                full_name="Aarav Sharma",
                role="traveller",
                avatar_url="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150"
            )
            db.add(demo_user)
            db.flush()

            # User Preferences
            user_pref = UserPreference(
                user_id=demo_user.id,
                preferred_travel_style="Balanced",
                wake_up_preference="Normal",
                activity_intensity="Balanced",
                dietary_preference="All",
                interests="Nature,Cafés,Adventure,Food,Hidden places"
            )
            db.add(user_pref)

        # 2. Categories
        categories_data = [
            ("Must Visit", "must-visit", "sparkles", "Iconic landmarks and valley staples"),
            ("Hidden Gems", "hidden-gems", "eye", "Off-beat tranquil retreats away from crowds"),
            ("Cafés & Bakery", "cafes", "coffee", "Riverside patios, artisan bakes, and mountain views"),
            ("Local Food", "food", "utensils", "Traditional Himachali Dham, thukpa, and local dhabas"),
            ("Nature & Trails", "nature", "tree", "Pine forests, waterfalls, and alpine meadows"),
            ("Adventure", "adventure", "compass", "River rafting, paragliding, high passes, and treks"),
            ("Culture & Heritage", "culture", "landmark", "Centuries-old wooden temples and monasteries"),
            ("Markets & Craft", "markets", "shopping-bag", "Handwoven shawls, wooden crafts, and spice bazaars"),
            ("Essentials & Medical", "essentials", "shield-alert", "Hospitals, 24/7 pharmacies, ATMs, and police")
        ]
        
        category_map = {}
        for name, slug, icon, desc in categories_data:
            cat = db.query(PlaceCategory).filter(PlaceCategory.slug == slug).first()
            if not cat:
                cat = PlaceCategory(name=name, slug=slug, icon=icon, description=desc)
                db.add(cat)
                db.flush()
            category_map[slug] = cat

        # 3. 12 Approved Curated Destinations
        destinations_data = [
            {
                "name": "Manali",
                "slug": "manali",
                "state": "Himachal Pradesh",
                "region": "Himalayan",
                "tagline": "Pine-scented mountain air, riverside stone cafés, and high alpine trails.",
                "description": "Nestled in the Beas River Valley, Manali blends rustic Himalayan charm with vibrant café culture and gateway routes to high altitude passes.",
                "hero_image": "/images/destinations/manali/hero.jpg",
                "latitude": 32.2396,
                "longitude": 77.1887,
                "altitude_meters": 2050,
                "best_time_to_visit": "October to June",
                "weather_type": "Alpine Mist / Cool",
                "is_featured": True
            },
            {
                "name": "Rishikesh",
                "slug": "rishikesh",
                "state": "Uttarakhand",
                "region": "Himalayan Foothills",
                "tagline": "Turquoise Ganga currents, cliffside meditation, and rapid adventures.",
                "description": "The yoga capital of the world resting on the banks of the sacred Ganges, where jungle serenity meets world-class river rafting and sunset aartis.",
                "hero_image": "/images/destinations/rishikesh/hero.jpg",
                "latitude": 30.0869,
                "longitude": 78.2676,
                "altitude_meters": 372,
                "best_time_to_visit": "September to May",
                "weather_type": "Pleasant / River Breeze",
                "is_featured": True
            },
            {
                "name": "Kasol",
                "slug": "kasol",
                "state": "Himachal Pradesh",
                "region": "Parvati Valley",
                "tagline": "Mystic deodar canopies, roaring emerald waters, and bohemian trails.",
                "description": "A tranquil haven in Parvati Valley famous for Israeli bakeries, pine-forested riverside hikes to Chalal and Tosh, and unmatched mountain peace.",
                "hero_image": "/images/destinations/kasol/hero.jpg",
                "latitude": 32.0100,
                "longitude": 77.3150,
                "altitude_meters": 1580,
                "best_time_to_visit": "March to June & Sept to Nov",
                "weather_type": "Crisp Mountain Mist",
                "is_featured": True
            },
            {
                "name": "Dharamshala & McLeod Ganj",
                "slug": "dharamshala",
                "state": "Himachal Pradesh",
                "region": "Kangra Valley",
                "tagline": "Prayer flags in the mist, Tibetan heritage, and the mighty Dhauladhar ridge.",
                "description": "Home of the Dalai Lama, surrounded by cedar forests and dramatic snow-capped peaks with authentic momos and serene monasteries.",
                "hero_image": "/images/destinations/dharamshala/hero.jpg",
                "latitude": 32.2190,
                "longitude": 76.3234,
                "altitude_meters": 1457,
                "best_time_to_visit": "September to June",
                "weather_type": "Misty Cedar Air",
                "is_featured": True
            },
            {
                "name": "Goa",
                "slug": "goa",
                "state": "Goa",
                "region": "Coastal Western Ghats",
                "tagline": "Golden palms, Portuguese villas, beach shack sunsets, and spice farms.",
                "description": "Beyond the crowded tourist strips lie sleepy riverside villages, historic Latin quarters, vibrant night flea markets, and tranquil cliff beaches.",
                "hero_image": "/images/destinations/goa/hero.jpg",
                "latitude": 15.2993,
                "longitude": 74.1240,
                "altitude_meters": 10,
                "best_time_to_visit": "November to April",
                "weather_type": "Warm Coastal Breeze",
                "is_featured": True
            },
            {
                "name": "Jaipur",
                "slug": "jaipur",
                "state": "Rajasthan",
                "region": "Royal Heritage",
                "tagline": "Terracotta ramparts, historic havelis, rich kachoris, and artisan crafts.",
                "description": "The Pink City where regal hill forts overlook bustling bazaars full of blue pottery, block-printed fabrics, and royal Rajasthani delicacies.",
                "hero_image": "/images/destinations/jaipur/hero.jpg",
                "latitude": 26.9124,
                "longitude": 75.7873,
                "altitude_meters": 431,
                "best_time_to_visit": "October to March",
                "weather_type": "Dry Heritage Warmth",
                "is_featured": True
            },
            {
                "name": "Mussoorie",
                "slug": "mussoorie",
                "state": "Uttarakhand",
                "region": "Garhwal Hills",
                "tagline": "Queen of the Hills, colonial bookshops, winterline sunsets, and oak trails.",
                "description": "Perched on a horseshoe ridge overlooking the Doon Valley, offering tranquil walks along Camel's Back Road and historic bakeries in Landour.",
                "hero_image": "/images/destinations/mussoorie/hero.jpg",
                "latitude": 30.4598,
                "longitude": 78.0644,
                "altitude_meters": 2005,
                "best_time_to_visit": "March to June & Sept to Nov",
                "weather_type": "Cool Mountain Mist",
                "is_featured": True
            },
            {
                "name": "Udaipur",
                "slug": "udaipur",
                "state": "Rajasthan",
                "region": "Mewar Lakes",
                "tagline": "Shimmering lake waters, whitewashed palaces, and romantic rooftop evenings.",
                "description": "The City of Lakes framed by the Aravalli Hills, offering tranquil boat rides on Lake Pichola and authentic Mewari hospitality.",
                "hero_image": "/images/destinations/udaipur/hero.jpg",
                "latitude": 24.5854,
                "longitude": 73.7125,
                "altitude_meters": 598,
                "best_time_to_visit": "September to March",
                "weather_type": "Pleasant Lake Breeze",
                "is_featured": True
            },
            {
                "name": "Varanasi",
                "slug": "varanasi",
                "state": "Uttar Pradesh",
                "region": "Ganga Riverfront",
                "tagline": "Ancient eternal ghats, dawn boat reflections, sacred chanting, and silk lanes.",
                "description": "One of the oldest continuously inhabited cities on earth, where life, philosophy, and spiritual devotion revolve around the sacred Ganges.",
                "hero_image": "/images/destinations/varanasi/hero.jpg",
                "latitude": 25.3176,
                "longitude": 82.9739,
                "altitude_meters": 80,
                "best_time_to_visit": "October to March",
                "weather_type": "Ancient River Breeze",
                "is_featured": True
            },
            {
                "name": "Leh",
                "slug": "leh",
                "state": "Ladakh",
                "region": "Trans-Himalayan Cold Desert",
                "tagline": "Barren moonscapes, thousand-year-old gompas, and world-highest motorable passes.",
                "description": "The crown of Ladakh situated in the Indus River Valley, where stark dramatic mountain terrain meets ancient Tibetan Buddhist culture.",
                "hero_image": "/images/destinations/leh/hero.jpg",
                "latitude": 34.1526,
                "longitude": 77.5771,
                "altitude_meters": 3500,
                "best_time_to_visit": "May to October",
                "weather_type": "High Altitude Crisp Air",
                "is_featured": True
            },
            {
                "name": "Spiti Valley",
                "slug": "spiti",
                "state": "Himachal Pradesh",
                "region": "Cold Desert Valley",
                "tagline": "The middle land between Tibet and India, cliffside monasteries, and fossil villages.",
                "description": "A high-altitude desert wonderland carved by the Spiti River, renowned for century-old gompas like Key and Dhankar, and pristine high-altitude lakes.",
                "hero_image": "/images/destinations/spiti-valley/hero.jpg",
                "latitude": 32.2461,
                "longitude": 78.0349,
                "altitude_meters": 3800,
                "best_time_to_visit": "June to October",
                "weather_type": "Dry Cold Moonscape",
                "is_featured": True
            },
            {
                "name": "Munnar",
                "slug": "munnar",
                "state": "Kerala",
                "region": "Western Ghats Tea Hills",
                "tagline": "Rolling emerald tea plantations, misty mountain gaps, and cardamom forests.",
                "description": "Perched at the confluence of three mountain streams in the Western Ghats, Munnar offers endless green tea slopes, cool breezes, and colonial bungalows.",
                "hero_image": "/images/destinations/fallbacks/valley.jpg",
                "latitude": 10.0889,
                "longitude": 77.0595,
                "altitude_meters": 1600,
                "best_time_to_visit": "September to May",
                "weather_type": "Misty Green Slopes",
                "is_featured": True
            }
        ]

        dest_objects = {}
        for d_info in destinations_data:
            existing = db.query(Destination).filter(Destination.slug == d_info["slug"]).first()
            if not existing:
                dest = Destination(**d_info)
                db.add(dest)
                db.flush()
                dest_objects[dest.slug] = dest
            else:
                for k, v in d_info.items():
                    setattr(existing, k, v)
                db.flush()
                dest_objects[existing.slug] = existing

        # 4. Authentic Verified Places per Destination (Strict Isolation)
        curated_places_by_dest = {
            "manali": [
                {
                    "name": "Hadimba Devi Cedar Forest Temple",
                    "slug": "hadimba-temple",
                    "category": "Culture & Heritage",
                    "description": "A 16th-century four-tiered pagoda-style wooden temple nestled deep inside towering Dhungri deodar forests.",
                    "address": "Hadimba Temple Rd, Manali",
                    "latitude": 32.2483,
                    "longitude": 77.1802,
                    "price_level": "Free",
                    "approx_cost": 50.0,
                    "rating": 4.8,
                    "review_count": 890,
                    "opening_time": "08:00",
                    "closing_time": "18:00",
                    "tags": "Historic,Pine Forest,Spiritual,Photography",
                    "image_url": "/images/places/manali/hadimba-temple.webp",
                    "why_vanvas_recommends": "Incredible centuries-old wooden carvings and peaceful deodar woodland walks.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                },
                {
                    "name": "Café 1947 (Riverside Stone Café)",
                    "slug": "cafe-1947",
                    "category": "Cafés & Bakery",
                    "description": "Old Manali's iconic stone café sitting directly over the rushing Manalsu river stream, renowned for wood-fired pizza and acoustic indie sets.",
                    "address": "Near Nehru Bridge, Old Manali",
                    "latitude": 32.2545,
                    "longitude": 77.1738,
                    "price_level": "₹₹",
                    "approx_cost": 450.0,
                    "rating": 4.9,
                    "review_count": 520,
                    "opening_time": "12:00",
                    "closing_time": "23:00",
                    "tags": "Café,Riverside,Live Music,Italian,Views",
                    "image_url": "/images/places/manali/categories/cafe.webp",
                    "why_vanvas_recommends": "Best evening ambience in the valley with the sound of gushing mountain water.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": True
                },
                {
                    "name": "Jogini Waterfall Pine Trail",
                    "slug": "jogini-waterfall",
                    "category": "Nature & Trails",
                    "description": "A gentle 3 km hike through apple orchards and pine groves starting from Vashisht village leading to a cascading multi-tier waterfall.",
                    "address": "Vashisht Village, Manali",
                    "latitude": 32.2650,
                    "longitude": 77.1920,
                    "price_level": "Free",
                    "approx_cost": 0.0,
                    "rating": 4.9,
                    "review_count": 410,
                    "opening_time": "07:00",
                    "closing_time": "18:30",
                    "tags": "Waterfall,Trek,Nature,Scenic,Apple Orchards",
                    "image_url": "/images/places/manali/jogini-waterfall.webp",
                    "why_vanvas_recommends": "High reward, low difficulty trail with panoramic valley vistas and refreshing mountain spray.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                },
                {
                    "name": "Old Manali Village & Manu Temple",
                    "slug": "old-manali-village",
                    "category": "Culture & Heritage",
                    "description": "Traditional wooden Himachali architecture surrounded by apple orchards and narrow stone alleys lined with bohemian cafés.",
                    "address": "Old Manali, Manali, HP",
                    "latitude": 32.2532,
                    "longitude": 77.1750,
                    "price_level": "Free",
                    "approx_cost": 0.0,
                    "rating": 4.8,
                    "review_count": 340,
                    "opening_time": "06:00",
                    "closing_time": "20:00",
                    "tags": "Culture,Heritage,Scenic,Walking",
                    "image_url": "/images/places/manali/old-manali.webp",
                    "why_vanvas_recommends": "Unmissable authentic Himalayan village vibe away from the commercial noise of Mall Road.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                },
                {
                    "name": "Drifters' Café & Acoustic Inn",
                    "slug": "drifters-cafe",
                    "category": "Cafés & Bakery",
                    "description": "Warm wooden café offering board games, live acoustic indie sets, cinnamon French toast, and handcrafted espresso.",
                    "address": "Manu Temple Rd, Old Manali",
                    "latitude": 32.2538,
                    "longitude": 77.1745,
                    "price_level": "₹₹",
                    "approx_cost": 350.0,
                    "rating": 4.7,
                    "review_count": 290,
                    "opening_time": "08:30",
                    "closing_time": "22:30",
                    "tags": "Café,Breakfast,Books,Board Games,Cozy",
                    "image_url": "/images/places/manali/categories/cafe.webp",
                    "why_vanvas_recommends": "The coziest refuge on a rainy afternoon in Old Manali.",
                    "is_must_visit": False,
                    "is_hidden_gem": True,
                    "is_indoor": True
                }
            ],
            "mussoorie": [
                {
                    "name": "Landour Bakehouse",
                    "slug": "landour-bakehouse",
                    "category": "Cafés & Bakery",
                    "description": "Legendary colonial-style hill bakery at Sisters Bazaar serving apple pie, lemon drizzle cake, and artisan mountain coffee with valley views.",
                    "address": "Sisters Bazaar, Landour, Mussoorie",
                    "latitude": 30.4610,
                    "longitude": 78.0920,
                    "price_level": "₹₹",
                    "approx_cost": 400.0,
                    "rating": 4.9,
                    "review_count": 680,
                    "opening_time": "08:00",
                    "closing_time": "20:00",
                    "tags": "Bakery,Landour,Heritage,Coffee,Views",
                    "image_url": "/images/places/mussoorie/landour-bakehouse.webp",
                    "why_vanvas_recommends": "The definitive hill bakery experience with Victorian baking recipes dating back to the 1800s.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": True
                },
                {
                    "name": "Lal Tibba Scenic Viewpoint",
                    "slug": "lal-tibba",
                    "category": "Nature & Trails",
                    "description": "Highest point in Mussoorie situated in Landour, offering high-powered telescopes overlooking snow-capped Garhwal Himalayan peaks like Badrinath and Kedarnath.",
                    "address": "Upper Landour, Mussoorie",
                    "latitude": 30.4660,
                    "longitude": 78.0970,
                    "price_level": "₹",
                    "approx_cost": 50.0,
                    "rating": 4.8,
                    "review_count": 920,
                    "opening_time": "06:00",
                    "closing_time": "19:00",
                    "tags": "Viewpoint,Himalayan Peaks,Landour,Sunrise,Sunset",
                    "image_url": "/images/places/mussoorie/lal-tibba.webp",
                    "why_vanvas_recommends": "Breathtaking panoramic view of the greater Himalayan ranges during clear morning hours.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                },
                {
                    "name": "Kempty Falls Mountain Cascade",
                    "slug": "kempty-falls",
                    "category": "Nature & Trails",
                    "description": "A dramatic 40-foot waterfall cascading into natural rock pools surrounded by high mountain cliffs.",
                    "address": "Ram Gaon, 13 km from Mussoorie",
                    "latitude": 30.4850,
                    "longitude": 78.0320,
                    "price_level": "Free",
                    "approx_cost": 0.0,
                    "rating": 4.5,
                    "review_count": 1200,
                    "opening_time": "08:00",
                    "closing_time": "17:00",
                    "tags": "Waterfall,Nature,Photography,Hills",
                    "image_url": "/images/places/mussoorie/kempty-falls.webp",
                    "why_vanvas_recommends": "Iconic British-era mountain cascade ideal for an early morning visit.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                },
                {
                    "name": "Camel's Back Road & Winterline Trail",
                    "slug": "camels-back-road",
                    "category": "Nature & Trails",
                    "description": "A peaceful 3 km promenade framed by oak and deodar canopies with unique camel rock formations and magnificent winterline sunsets.",
                    "address": "Near Kulri Bazaar, Mussoorie",
                    "latitude": 30.4570,
                    "longitude": 78.0780,
                    "price_level": "Free",
                    "approx_cost": 0.0,
                    "rating": 4.7,
                    "review_count": 430,
                    "opening_time": "06:00",
                    "closing_time": "21:00",
                    "tags": "Walking,Scenic,Sunset,Oak Forests",
                    "image_url": "/images/places/mussoorie/camel-back-road.webp",
                    "why_vanvas_recommends": "The best pedestrian walk in Mussoorie away from motor vehicles.",
                    "is_must_visit": False,
                    "is_hidden_gem": True,
                    "is_indoor": False
                },
                {
                    "name": "Gun Hill Historic Viewpoint",
                    "slug": "gun-hill",
                    "category": "Culture & Heritage",
                    "description": "Second highest peak in Mussoorie offering a historical cable car ropeway and sweeping 360-degree vistas of the Doon Valley and Himalayan peaks.",
                    "address": "Mall Road, Mussoorie",
                    "latitude": 30.4590,
                    "longitude": 78.0730,
                    "price_level": "₹₹",
                    "approx_cost": 150.0,
                    "rating": 4.6,
                    "review_count": 810,
                    "opening_time": "09:00",
                    "closing_time": "19:00",
                    "tags": "Viewpoint,Ropeway,Historic,Doon Valley",
                    "image_url": "/images/places/mussoorie/gun-hill.webp",
                    "why_vanvas_recommends": "Historic site where a mid-day gun was fired in colonial times to help townsfolk set their watches.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                }
            ],
            "udaipur": [
                {
                    "name": "City Palace of Udaipur",
                    "slug": "city-palace-udaipur",
                    "category": "Culture & Heritage",
                    "description": "A monumental complex of 11 palaces built over 400 years on the eastern banks of Lake Pichola, blending Rajasthani and Mughal architectural styles.",
                    "address": "Old City, Udaipur, Rajasthan",
                    "latitude": 24.5764,
                    "longitude": 73.6835,
                    "price_level": "₹₹₹",
                    "approx_cost": 300.0,
                    "rating": 4.9,
                    "review_count": 1850,
                    "opening_time": "09:00",
                    "closing_time": "17:30",
                    "tags": "Palace,Heritage,Architecture,Museum,Lake Views",
                    "image_url": "/images/places/udaipur/city-palace-udaipur.webp",
                    "why_vanvas_recommends": "The crowning jewel of Mewar with intricately mirrored courtyards and unmatched lake vistas.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                },
                {
                    "name": "Lake Pichola Sunset Boat Voyage",
                    "slug": "lake-pichola-boat",
                    "category": "Nature & Trails",
                    "description": "An unforgettable boat ride across the tranquil waters of Lake Pichola, gliding past Jag Mandir Island and the shimmering white City Palace.",
                    "address": "Rameshwar Ghat, City Palace Jetty",
                    "latitude": 24.5780,
                    "longitude": 73.6800,
                    "price_level": "₹₹₹",
                    "approx_cost": 450.0,
                    "rating": 4.9,
                    "review_count": 1420,
                    "opening_time": "10:00",
                    "closing_time": "18:00",
                    "tags": "Lake,Boat Ride,Sunset,Romantic,Architecture",
                    "image_url": "/images/places/udaipur/lake-pichola.webp",
                    "why_vanvas_recommends": "Catch the twilight hour when the palaces illuminate and cast golden reflections across the water.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                },
                {
                    "name": "Bagore Ki Haveli & Evening Folk Dance",
                    "slug": "bagore-ki-haveli",
                    "category": "Culture & Heritage",
                    "description": "An 18th-century noble mansion at Gangaur Ghat with over 100 rooms, hosting the world-renowned Dharohar Rajasthani puppet and folk dance performance.",
                    "address": "Gangaur Ghat Marg, Udaipur",
                    "latitude": 24.5800,
                    "longitude": 73.6820,
                    "price_level": "₹₹",
                    "approx_cost": 150.0,
                    "rating": 4.8,
                    "review_count": 940,
                    "opening_time": "10:00",
                    "closing_time": "20:00",
                    "tags": "Haveli,Folk Dance,Culture,Puppets,Ghat",
                    "image_url": "/images/places/udaipur/bagore-ki-haveli.webp",
                    "why_vanvas_recommends": "The most authentic cultural evening performance in Rajasthan.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": True
                },
                {
                    "name": "Saheliyon Ki Bari (Garden of the Maids)",
                    "slug": "saheliyon-ki-bari",
                    "category": "Nature & Trails",
                    "description": "A historic royal garden designed with marble pavilions, lotus pools, and rain fountains powered entirely by natural water pressure.",
                    "address": "Saheli Marg, Udaipur",
                    "latitude": 24.6030,
                    "longitude": 73.6880,
                    "price_level": "₹",
                    "approx_cost": 50.0,
                    "rating": 4.7,
                    "review_count": 760,
                    "opening_time": "09:00",
                    "closing_time": "19:00",
                    "tags": "Garden,Fountains,Lotus,Heritage,Peaceful",
                    "image_url": "/images/places/udaipur/saheliyon-ki-bari.webp",
                    "why_vanvas_recommends": "A cool tranquil oasis of 18th-century hydraulic engineering and lush bougainvillea.",
                    "is_must_visit": False,
                    "is_hidden_gem": True,
                    "is_indoor": False
                }
            ],
            "varanasi": [
                {
                    "name": "Dashashwamedh Ghat Evening Maha Aarti",
                    "slug": "dashashwamedh-ghat-aarti",
                    "category": "Culture & Heritage",
                    "description": "The spiritual epicentre of Varanasi where rhythmic Sanskrit chants, conch shells, and multi-tiered brass oil lamps create an unforgettable twilight ceremony.",
                    "address": "Dashashwamedh Ghat, Varanasi",
                    "latitude": 25.3075,
                    "longitude": 83.0104,
                    "price_level": "Free",
                    "approx_cost": 0.0,
                    "rating": 4.9,
                    "review_count": 2400,
                    "opening_time": "18:00",
                    "closing_time": "20:30",
                    "tags": "Ghat,Aarti,Spiritual,Ganga,Culture",
                    "image_url": "/images/places/varanasi/dashashwamedh-ghat-aarti.webp",
                    "why_vanvas_recommends": "The quintessential Varanasi spiritual experience, best watched from a wooden rowboat on the river.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                },
                {
                    "name": "Assi Ghat & Subah-e-Banaras Dawn Chants",
                    "slug": "assi-ghat-subah",
                    "category": "Culture & Heritage",
                    "description": "Southernmost major ghat renowned for early dawn classical music, Vedic recitations, yoga sessions, and traditional lemon-ginger chai.",
                    "address": "Assi Ghat, Varanasi",
                    "latitude": 25.2890,
                    "longitude": 83.0060,
                    "price_level": "Free",
                    "approx_cost": 0.0,
                    "rating": 4.8,
                    "review_count": 1120,
                    "opening_time": "05:00",
                    "closing_time": "22:00",
                    "tags": "Ghat,Dawn,Music,Yoga,Chai,Peaceful",
                    "image_url": "/images/places/varanasi/assi-ghat.webp",
                    "why_vanvas_recommends": "Magical morning atmosphere where the city slowly awakens to flute melodies and sacred river mist.",
                    "is_must_visit": True,
                    "is_hidden_gem": True,
                    "is_indoor": False
                },
                {
                    "name": "Kashi Vishwanath Golden Temple Corridor",
                    "slug": "kashi-vishwanath-temple",
                    "category": "Culture & Heritage",
                    "description": "One of the twelve sacred Jyotirlingas of Lord Shiva, crowned with golden spires and connected by a grand stone corridor to the holy river.",
                    "address": "Vishwanath Gali, Varanasi",
                    "latitude": 25.3108,
                    "longitude": 83.0107,
                    "price_level": "Free",
                    "approx_cost": 0.0,
                    "rating": 4.9,
                    "review_count": 3100,
                    "opening_time": "04:00",
                    "closing_time": "23:00",
                    "tags": "Temple,Spiritual,Jyotirlinga,Heritage,Golden Spire",
                    "image_url": "/images/places/varanasi/kashi-vishwanath.webp",
                    "why_vanvas_recommends": "Ancient spiritual core of Varanasi with millennia of devotional history.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": True
                },
                {
                    "name": "Blue Lassi Traditional Shop",
                    "slug": "blue-lassi-shop",
                    "category": "Local Food",
                    "description": "Century-old alley shop serving hand-churned thick curd lassis in clay pots (kulhad) topped with rabri, pomegranate, pistachios, and mango.",
                    "address": "Bangali Tola, Near Manikarnika Ghat",
                    "latitude": 25.3115,
                    "longitude": 83.0125,
                    "price_level": "₹",
                    "approx_cost": 100.0,
                    "rating": 4.7,
                    "review_count": 890,
                    "opening_time": "09:00",
                    "closing_time": "22:00",
                    "tags": "Local Food,Lassi,Traditional,Kulhad,Street Food",
                    "image_url": "/images/places/varanasi/blue-lassi-shop.webp",
                    "why_vanvas_recommends": "Famous artisanal lassi spot decorated with traveller passport photos from around the world.",
                    "is_must_visit": False,
                    "is_hidden_gem": True,
                    "is_indoor": True
                }
            ],
            "jaipur": [
                {
                    "name": "Hawa Mahal (Palace of Winds)",
                    "slug": "hawa-mahal",
                    "category": "Culture & Heritage",
                    "description": "Five-storey pink sandstone honeycomb facade with 953 carved jharokha windows built in 1799 to let royal women observe street festivals without being seen.",
                    "address": "Hawa Mahal Rd, Badi Choupad, Jaipur",
                    "latitude": 26.9239,
                    "longitude": 75.8267,
                    "price_level": "₹₹",
                    "approx_cost": 200.0,
                    "rating": 4.8,
                    "review_count": 2100,
                    "opening_time": "09:00",
                    "closing_time": "17:00",
                    "tags": "Palace,Pink Sandstone,Architecture,Heritage,Photography",
                    "image_url": "/images/places/jaipur/hawa-mahal.webp",
                    "why_vanvas_recommends": "Best viewed at sunrise from the rooftop cafes directly across the road.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                },
                {
                    "name": "Amber Fort & Maota Lake",
                    "slug": "amber-palace-fort",
                    "category": "Culture & Heritage",
                    "description": "Majestic hilltop fort built of red sandstone and marble, featuring the breathtaking Sheesh Mahal (Mirror Palace) reflecting over Maota Lake.",
                    "address": "Devisinghpura, Amer, Jaipur",
                    "latitude": 26.9855,
                    "longitude": 75.8513,
                    "price_level": "₹₹₹",
                    "approx_cost": 500.0,
                    "rating": 4.9,
                    "review_count": 2800,
                    "opening_time": "08:00",
                    "closing_time": "17:30",
                    "tags": "Fort,Sheesh Mahal,Heritage,Rajput,Views",
                    "image_url": "/images/places/jaipur/amber-fort.webp",
                    "why_vanvas_recommends": "Monumental fortress complex showcasing the pinnacle of Rajput military architecture and royal luxury.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                },
                {
                    "name": "Nahargarh Fort Sunset Bastion",
                    "slug": "nahargarh-fort-sunset",
                    "category": "Nature & Trails",
                    "description": "Perched on the rugged Aravalli ridge, offering the most dramatic sunset panoramas overlooking the entire Pink City sprawl below.",
                    "address": "Krishna Nagar, Brahampuri, Jaipur",
                    "latitude": 26.9370,
                    "longitude": 75.8150,
                    "price_level": "₹₹",
                    "approx_cost": 100.0,
                    "rating": 4.8,
                    "review_count": 1300,
                    "opening_time": "10:00",
                    "closing_time": "21:00",
                    "tags": "Sunset,Fort,Aravalli Hills,Panoramas,Rooftop",
                    "image_url": "/images/places/jaipur/nahargarh-fort.webp",
                    "why_vanvas_recommends": "The premier twilight gathering spot in Jaipur for sweeping city light vistas.",
                    "is_must_visit": True,
                    "is_hidden_gem": True,
                    "is_indoor": False
                }
            ],
            "goa": [
                {
                    "name": "Palolem Beach Crescent Cove",
                    "slug": "palolem-beach-cove",
                    "category": "Nature & Trails",
                    "description": "A tranquil 1.6 km semi-circular beach cove lined with leaning coconut palms, calm turquoise waters, and colorful wooden beach shacks.",
                    "address": "Canacona, South Goa",
                    "latitude": 15.0100,
                    "longitude": 74.0230,
                    "price_level": "Free",
                    "approx_cost": 0.0,
                    "rating": 4.8,
                    "review_count": 1600,
                    "opening_time": "06:00",
                    "closing_time": "23:00",
                    "tags": "Beach,Kayaking,Sunset,Palms,South Goa",
                    "image_url": "/images/places/goa/categories/nature.webp",
                    "why_vanvas_recommends": "The ideal gentle swimming beach in Goa with serene dolphin spotting kayak trails.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                },
                {
                    "name": "Fontainhas Latin Heritage Quarter",
                    "slug": "fontainhas-latin-quarter",
                    "category": "Culture & Heritage",
                    "description": "Asia's only preserved Latin Quarter with pastel-painted Portuguese villas, wrought iron balconies, tiled street signs, and artisan bakeries.",
                    "address": "Altinho, Panaji, Goa",
                    "latitude": 15.4980,
                    "longitude": 73.8310,
                    "price_level": "Free",
                    "approx_cost": 0.0,
                    "rating": 4.7,
                    "review_count": 920,
                    "opening_time": "07:00",
                    "closing_time": "21:00",
                    "tags": "Heritage,Portuguese,Architecture,Artisan Bakery,Walking",
                    "image_url": "/images/places/goa/fontainhas-latin-quarter.webp",
                    "why_vanvas_recommends": "A picturesque walking promenade steeped in colonial Indo-Portuguese history.",
                    "is_must_visit": True,
                    "is_hidden_gem": True,
                    "is_indoor": False
                },
                {
                    "name": "Chapora Fort Cliff Sunset",
                    "slug": "chapora-fort-sunset",
                    "category": "Culture & Heritage",
                    "description": "Historic 1717 red laterite fort ramparts perched on high cliffs offering sweeping 360-degree ocean views over Vagator and Morjim beaches.",
                    "address": "Chapora, North Goa",
                    "latitude": 15.6060,
                    "longitude": 73.7360,
                    "price_level": "Free",
                    "approx_cost": 0.0,
                    "rating": 4.7,
                    "review_count": 1400,
                    "opening_time": "08:00",
                    "closing_time": "18:30",
                    "tags": "Fort,Laterite,Sunset,Ocean Views,Cliffs",
                    "image_url": "/images/places/goa/categories/viewpoint.webp",
                    "why_vanvas_recommends": "Famous sunset cliff viewpoint overlooking the confluence of Chapora River and Arabian Sea.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                }
            ],
            "leh": [
                {
                    "name": "Thiksey Monastery (Gompa)",
                    "slug": "thiksey-monastery-gompa",
                    "category": "Culture & Heritage",
                    "description": "A twelve-storey monastery complex resembling the Potala Palace of Lhasa, housing a 49-foot statue of Maitreya Buddha overlooking the Indus Valley.",
                    "address": "Thiksey, 19 km from Leh",
                    "latitude": 34.0560,
                    "longitude": 77.6667,
                    "price_level": "₹",
                    "approx_cost": 50.0,
                    "rating": 4.9,
                    "review_count": 1500,
                    "opening_time": "06:00",
                    "closing_time": "18:00",
                    "tags": "Monastery,Gompa,Maitreya Buddha,Indus Valley,Spiritual",
                    "image_url": "/images/places/leh/thiksey-monastery-gompa.webp",
                    "why_vanvas_recommends": "Experience the early morning monk prayer ceremony resonating with giant horns and bells.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": True
                },
                {
                    "name": "Pangong Tso Alpine Lake",
                    "slug": "pangong-tso-lake",
                    "category": "Nature & Trails",
                    "description": "An endorheic high-altitude saltwater lake at 4,225m spanning from India into Tibet, famed for its changing turquoise shades against barren mountain ranges.",
                    "address": "Changthang Region, Ladakh",
                    "latitude": 33.7595,
                    "longitude": 78.6674,
                    "price_level": "Free",
                    "approx_cost": 0.0,
                    "rating": 4.9,
                    "review_count": 2100,
                    "opening_time": "06:00",
                    "closing_time": "18:00",
                    "tags": "Lake,High Altitude,Turquoise,Himalayas,Saltwater",
                    "image_url": "/images/places/leh/pangong-tso.webp",
                    "why_vanvas_recommends": "One of the most surreal natural vistas on earth under vast Himalayan skies.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                },
                {
                    "name": "Shanti Stupa Sunrise Dome",
                    "slug": "shanti-stupa-sunrise",
                    "category": "Culture & Heritage",
                    "description": "A white-domed Buddhist stupa on a hilltop in Chanspa built by Japanese monks, holding relics of the Buddha and providing 360-degree panoramas of Leh town and Namgyal Tsemo.",
                    "address": "Chanspa, Leh, Ladakh",
                    "latitude": 34.1670,
                    "longitude": 77.5680,
                    "price_level": "Free",
                    "approx_cost": 0.0,
                    "rating": 4.8,
                    "review_count": 1200,
                    "opening_time": "05:00",
                    "closing_time": "21:00",
                    "tags": "Stupa,Peace,Sunrise,Sunset,Panoramas",
                    "image_url": "/images/places/leh/categories/viewpoint.webp",
                    "why_vanvas_recommends": "Unbeatable dawn and dusk views of the entire Leh valley and Stok Kangri mountain wall.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                }
            ],
            "rishikesh": [
                {
                    "name": "The Little Buddha Café",
                    "slug": "little-buddha-cafe",
                    "category": "Cafés & Bakery",
                    "description": "Treehouse café overlooking the emerald Ganga and Lakshman Jhula.",
                    "address": "Lakshman Jhula, Rishikesh",
                    "latitude": 30.1280,
                    "longitude": 78.3270,
                    "price_level": "₹₹",
                    "approx_cost": 300.0,
                    "rating": 4.8,
                    "review_count": 450,
                    "opening_time": "08:00",
                    "closing_time": "23:00",
                    "tags": "Café,Ganga View,Healthy,Sunset",
                    "image_url": "/images/places/rishikesh/little-buddha-cafe.webp",
                    "why_vanvas_recommends": "Unbeatable cliffside sunset views over the river.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": True
                },
                {
                    "name": "Triveni Ghat Evening Maha Aarti",
                    "slug": "triveni-ghat-aarti",
                    "category": "Culture & Heritage",
                    "description": "Spiritual confluence where rhythmic chants, bells, and floating brass oil lamps illuminate the sacred river.",
                    "address": "Triveni Ghat, Rishikesh",
                    "latitude": 30.1030,
                    "longitude": 78.2930,
                    "price_level": "Free",
                    "approx_cost": 0.0,
                    "rating": 4.9,
                    "review_count": 1200,
                    "opening_time": "18:00",
                    "closing_time": "20:00",
                    "tags": "Aarti,Spiritual,Evening,Culture",
                    "image_url": "/images/places/rishikesh/triveni-ghat.webp",
                    "why_vanvas_recommends": "Hypnotic spiritual energy at dusk.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                },
                {
                    "name": "Shivpuri White Water Rafting",
                    "slug": "shivpuri-rafting",
                    "category": "Adventure",
                    "description": "Grade III+ rapids (Roller Coaster & Golf Course) down the roaring Ganga.",
                    "address": "Shivpuri Base, Rishikesh",
                    "latitude": 30.1370,
                    "longitude": 78.3880,
                    "price_level": "₹₹₹",
                    "approx_cost": 1200.0,
                    "rating": 4.9,
                    "review_count": 980,
                    "opening_time": "07:00",
                    "closing_time": "17:00",
                    "tags": "Rafting,Adventure,River,Thrill",
                    "image_url": "/images/places/rishikesh/shivpuri-rafting.webp",
                    "why_vanvas_recommends": "The quintessential adventure benchmark in Northern India.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                },
                {
                    "name": "The Beatles Ashram (Chaurasi Kutia)",
                    "slug": "beatles-ashram",
                    "category": "Culture & Heritage",
                    "description": "Transcendental meditation ashram tucked inside Rajaji Tiger Reserve, adorned with murals and stone meditation domes.",
                    "address": "Swarg Ashram, Rishikesh",
                    "latitude": 30.1170,
                    "longitude": 78.3120,
                    "price_level": "₹₹",
                    "approx_cost": 150.0,
                    "rating": 4.7,
                    "review_count": 820,
                    "opening_time": "09:00",
                    "closing_time": "16:30",
                    "tags": "Heritage,Beatles,Murals,Meditation,Forest",
                    "image_url": "/images/places/rishikesh/beatles-ashram.webp",
                    "why_vanvas_recommends": "Serene forest retreat where 1960s musical history meets ancient meditation caves.",
                    "is_must_visit": True,
                    "is_hidden_gem": True,
                    "is_indoor": False
                },
                {
                    "name": "Parmarth Niketan Ganga Aarti",
                    "slug": "parmarth-niketan",
                    "category": "Culture & Heritage",
                    "description": "Expansive spiritual ashram on the Ganga banks famous for Vedic chanting and magnificent Lord Shiva statue reflections.",
                    "address": "Main Road, Swarg Ashram, Rishikesh",
                    "latitude": 30.1185,
                    "longitude": 78.3150,
                    "price_level": "Free",
                    "approx_cost": 0.0,
                    "rating": 4.8,
                    "review_count": 990,
                    "opening_time": "06:00",
                    "closing_time": "21:00",
                    "tags": "Ashram,Spiritual,Aarti,Ganga,Yoga",
                    "image_url": "/images/places/rishikesh/parmarth-niketan.webp",
                    "why_vanvas_recommends": "Soulful riverside sunset aarti led by young gurukul students.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                },
                {
                    "name": "Neer Garh Multi-Tier Waterfall",
                    "slug": "neer-garh-waterfall",
                    "category": "Nature & Trails",
                    "description": "Tiered jade-colored natural spring waterfall cascading into jungle limestone pools.",
                    "address": "Neer Waterfall Trek, Rishikesh",
                    "latitude": 30.1410,
                    "longitude": 78.3390,
                    "price_level": "₹",
                    "approx_cost": 50.0,
                    "rating": 4.6,
                    "review_count": 760,
                    "opening_time": "08:00",
                    "closing_time": "18:00",
                    "tags": "Waterfall,Trek,Nature,Pools,Jungle",
                    "image_url": "/images/places/rishikesh/neer-garh-waterfall.webp",
                    "why_vanvas_recommends": "Crisp mountain water pools perfect for a refreshing dip after a jungle walk.",
                    "is_must_visit": False,
                    "is_hidden_gem": True,
                    "is_indoor": False
                }
            ],
            "kasol": [
                {
                    "name": "Moon Dance Café & German Bakery",
                    "slug": "moon-dance-cafe",
                    "category": "Cafés & Bakery",
                    "description": "Legendary bakery serving freshly baked apple crumble, shakshuka, and cinnamon rolls under towering Parvati pines.",
                    "address": "Main Market, Kasol",
                    "latitude": 32.0102,
                    "longitude": 77.3155,
                    "price_level": "₹₹",
                    "approx_cost": 320.0,
                    "rating": 4.7,
                    "review_count": 560,
                    "opening_time": "08:30",
                    "closing_time": "23:00",
                    "tags": "Bakery,Israeli,Café,Breakfast",
                    "image_url": "/images/places/kasol/moon-dance-cafe.webp",
                    "why_vanvas_recommends": "Finest morning bakery and warm mountain coffee in Parvati Valley.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": True
                },
                {
                    "name": "Chalal Pine Riverside Trail",
                    "slug": "chalal-trail",
                    "category": "Nature & Trails",
                    "description": "A quiet suspended cable-bridge walk crossing the emerald Parvati River into ancient deodar forests to Chalal village.",
                    "address": "Across Cable Bridge, Kasol",
                    "latitude": 32.0130,
                    "longitude": 77.3210,
                    "price_level": "Free",
                    "approx_cost": 0.0,
                    "rating": 4.8,
                    "review_count": 390,
                    "opening_time": "06:00",
                    "closing_time": "19:00",
                    "tags": "Nature,Pine Forest,River,Peaceful",
                    "image_url": "/images/places/kasol/chalal-trail.webp",
                    "why_vanvas_recommends": "Effortless scenic nature stroll with quiet riverside hammocks.",
                    "is_must_visit": True,
                    "is_hidden_gem": True,
                    "is_indoor": False
                },
                {
                    "name": "Gurudwara Shri Manikaran Sahib & Hot Springs",
                    "slug": "manikaran-sahib",
                    "category": "Culture & Heritage",
                    "description": "Historic sacred sulphur hot springs and Gurudwara complex nestled along the roaring Parvati River gorge.",
                    "address": "Manikaran, 4.5 km from Kasol",
                    "latitude": 32.0270,
                    "longitude": 77.3480,
                    "price_level": "Free",
                    "approx_cost": 0.0,
                    "rating": 4.9,
                    "review_count": 1400,
                    "opening_time": "05:00",
                    "closing_time": "22:00",
                    "tags": "Gurudwara,Hot Springs,Spiritual,Parvati Gorge,Langar",
                    "image_url": "/images/places/kasol/manikaran-sahib.webp",
                    "why_vanvas_recommends": "Ancient spiritual landmark with natural healing sulphur pools and 24/7 community langar.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                },
                {
                    "name": "Kheerganga Alpine Meadow Trail",
                    "slug": "kheerganga-trail",
                    "category": "Nature & Trails",
                    "description": "Exhilarating Himalayan trekking trail ascending through pine forests to high alpine meadows and natural hot baths at 2,960m.",
                    "address": "Barshaini Trailhead, Parvati Valley",
                    "latitude": 31.9920,
                    "longitude": 77.4520,
                    "price_level": "Free",
                    "approx_cost": 0.0,
                    "rating": 4.8,
                    "review_count": 980,
                    "opening_time": "06:00",
                    "closing_time": "18:00",
                    "tags": "Trek,Alpine Meadow,Hot Springs,Mountains,Views",
                    "image_url": "/images/places/kasol/kheerganga-trail.webp",
                    "why_vanvas_recommends": "Soak in hot natural spring waters surrounded by towering snow-clad peaks.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                },
                {
                    "name": "Tosh Traditional Wooden Village",
                    "slug": "tosh-village",
                    "category": "Culture & Heritage",
                    "description": "Traditional wooden Himachali village at 2,400m perched at the edge of Tosh Glacier with panoramic valley views.",
                    "address": "Tosh Village, Parvati Valley",
                    "latitude": 32.0160,
                    "longitude": 77.4530,
                    "price_level": "Free",
                    "approx_cost": 0.0,
                    "rating": 4.7,
                    "review_count": 720,
                    "opening_time": "07:00",
                    "closing_time": "21:00",
                    "tags": "Village,Glacier,Wooden Architecture,Views",
                    "image_url": "/images/places/kasol/tosh-village.webp",
                    "why_vanvas_recommends": "Authentic mountain village vibe with front-row seats to snow peaks.",
                    "is_must_visit": True,
                    "is_hidden_gem": True,
                    "is_indoor": False
                },
                {
                    "name": "Evergreen Café & Garden Patio",
                    "slug": "evergreen-cafe",
                    "category": "Cafés & Bakery",
                    "description": "Beloved garden café famous for Israeli platters, wood-fired pizza, hummus bowls, and chill pine canopy ambiance.",
                    "address": "Near Old Bridge, Kasol",
                    "latitude": 32.0108,
                    "longitude": 77.3162,
                    "price_level": "₹₹",
                    "approx_cost": 400.0,
                    "rating": 4.7,
                    "review_count": 640,
                    "opening_time": "10:00",
                    "closing_time": "23:30",
                    "tags": "Café,Israeli,Garden,Pizza,Mountain",
                    "image_url": "/images/places/kasol/evergreen-cafe.webp",
                    "why_vanvas_recommends": "The heart of Kasol's bohemian culinary culture since over two decades.",
                    "is_must_visit": False,
                    "is_hidden_gem": True,
                    "is_indoor": True
                }
            ],
            "dharamshala": [
                {
                    "name": "Namgyal Monastery & Tsuglagkhang Complex",
                    "slug": "namgyal-monastery",
                    "category": "Culture & Heritage",
                    "description": "Personal monastery of the 14th Dalai Lama, featuring prayer wheels, serene courtyards, and golden Buddha statues.",
                    "address": "Temple Rd, McLeod Ganj",
                    "latitude": 32.2350,
                    "longitude": 76.3260,
                    "price_level": "Free",
                    "approx_cost": 0.0,
                    "rating": 4.9,
                    "review_count": 1450,
                    "opening_time": "06:00",
                    "closing_time": "19:00",
                    "tags": "Monastery,Dalai Lama,Tibetan,Spiritual",
                    "image_url": "/images/places/dharamshala/namgyal-monastery.webp",
                    "why_vanvas_recommends": "Spiritual core of the Tibetan exile community with quiet meditative ambiance.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": True
                },
                {
                    "name": "Bhagsunag Waterfall & Shiva Café",
                    "slug": "bhagsunag-waterfall",
                    "category": "Nature & Trails",
                    "description": "Fresh mountain waterfall tumbling down rocky cliffs with the legendary bohemian Shiva Café perched at the top.",
                    "address": "Bhagsu Village, McLeod Ganj",
                    "latitude": 32.2470,
                    "longitude": 76.3350,
                    "price_level": "Free",
                    "approx_cost": 0.0,
                    "rating": 4.7,
                    "review_count": 870,
                    "opening_time": "07:00",
                    "closing_time": "18:30",
                    "tags": "Waterfall,Café,Hike,Mountains",
                    "image_url": "/images/places/dharamshala/bhagsunag-waterfall.webp",
                    "why_vanvas_recommends": "Refreshing cool mountain spray and indie cafe vibes above the village.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                },
                {
                    "name": "Triund High Ridge Himalayan Trek",
                    "slug": "triund-trek",
                    "category": "Adventure",
                    "description": "Spectacular 9 km ridge trail ascending through rhododendron and oak forests to the foot of the snow-clad Dhauladhar range.",
                    "address": "Dharamkot Trailhead, McLeod Ganj",
                    "latitude": 32.2570,
                    "longitude": 76.3530,
                    "price_level": "Free",
                    "approx_cost": 0.0,
                    "rating": 4.9,
                    "review_count": 1600,
                    "opening_time": "06:00",
                    "closing_time": "17:00",
                    "tags": "Trek,Dhauladhar,Ridge,Kangra Valley,Views",
                    "image_url": "/images/places/dharamshala/triund-trek.webp",
                    "why_vanvas_recommends": "Dramatic contrast between the Kangra valley on one side and towering Dhauladhar granite cliffs on the other.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                },
                {
                    "name": "Norbulingka Tibetan Cultural Institute",
                    "slug": "norbulingka-institute",
                    "category": "Culture & Heritage",
                    "description": "Traditional Tibetan architectural estate with koi ponds, wooden bridges, and artisan workshops preserving thangka painting and statue carving.",
                    "address": "Sidhpura, Dharamshala",
                    "latitude": 32.1850,
                    "longitude": 76.3520,
                    "price_level": "₹",
                    "approx_cost": 100.0,
                    "rating": 4.8,
                    "review_count": 920,
                    "opening_time": "09:00",
                    "closing_time": "17:30",
                    "tags": "Tibetan Culture,Artisan,Thangka,Gardens,Architecture",
                    "image_url": "/images/places/dharamshala/categories/heritage.webp",
                    "why_vanvas_recommends": "Meticulously maintained Japanese-Tibetan gardens showcasing living Himalayan arts.",
                    "is_must_visit": True,
                    "is_hidden_gem": True,
                    "is_indoor": False
                },
                {
                    "name": "Illiterati Books & Artisan Coffee",
                    "slug": "illiterati-cafe",
                    "category": "Cafés & Bakery",
                    "description": "Wooden library café with towering bookshelves, piano, artisan Italian espresso, and wooden balcony views of the Dhauladhar valley.",
                    "address": "Jogibara Rd, McLeod Ganj",
                    "latitude": 32.2305,
                    "longitude": 76.3245,
                    "price_level": "₹₹",
                    "approx_cost": 400.0,
                    "rating": 4.8,
                    "review_count": 710,
                    "opening_time": "09:30",
                    "closing_time": "21:00",
                    "tags": "Books,Café,Coffee,Views,Cozy",
                    "image_url": "/images/places/dharamshala/categories/cafe.webp",
                    "why_vanvas_recommends": "The finest mountain library and reading space in the Western Himalayas.",
                    "is_must_visit": False,
                    "is_hidden_gem": True,
                    "is_indoor": True
                }
            ],
            "spiti": [
                {
                    "name": "Key Monastery (Kye Gompa)",
                    "slug": "key-monastery",
                    "category": "Culture & Heritage",
                    "description": "Spectacular 1000-year-old Tibetan Buddhist monastery perched fort-like on a hill at 4,166m overlooking the Spiti River.",
                    "address": "Key Village, Spiti Valley",
                    "latitude": 32.2980,
                    "longitude": 78.0120,
                    "price_level": "Free",
                    "approx_cost": 0.0,
                    "rating": 4.9,
                    "review_count": 1100,
                    "opening_time": "06:00",
                    "closing_time": "18:00",
                    "tags": "Gompa,Monastery,High Altitude,Spiritual,Ancient",
                    "image_url": "/images/places/spiti/key-monastery.webp",
                    "why_vanvas_recommends": "Incredible monastic architecture surviving one thousand years in extreme cold desert terrain.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": True
                },
                {
                    "name": "Chandratal (Moon Lake) Glacial Sanctuary",
                    "slug": "chandratal-lake",
                    "category": "Nature & Trails",
                    "description": "Crescent-shaped high altitude glacial lake at 4,300m surrounded by scree mountain slopes in the Samudra Tapu plateau.",
                    "address": "Near Kunzum Pass, Spiti",
                    "latitude": 32.4820,
                    "longitude": 77.6180,
                    "price_level": "Free",
                    "approx_cost": 0.0,
                    "rating": 4.9,
                    "review_count": 920,
                    "opening_time": "06:00",
                    "closing_time": "18:00",
                    "tags": "Lake,Glacial,High Altitude,Moon Lake,Trek",
                    "image_url": "/images/places/spiti/chandratal-lake.webp",
                    "why_vanvas_recommends": "One of the most pristine alpine lakes in Asia under clear starlit night skies.",
                    "is_must_visit": True,
                    "is_hidden_gem": True,
                    "is_indoor": False
                },
                {
                    "name": "Dhankar Gompa Cliffside Monastery",
                    "slug": "dhankar-gompa",
                    "category": "Culture & Heritage",
                    "description": "Cliff-hanging ancient Buddhist monastery overlooking the dramatic confluence of the Spiti and Pin rivers.",
                    "address": "Dhankar Village, Spiti Valley",
                    "latitude": 32.0210,
                    "longitude": 78.2230,
                    "price_level": "Free",
                    "approx_cost": 0.0,
                    "rating": 4.9,
                    "review_count": 680,
                    "opening_time": "06:30",
                    "closing_time": "17:30",
                    "tags": "Gompa,Cliff,Monastery,Spiti River,Heritage",
                    "image_url": "/images/places/spiti/dhankar-gompa.webp",
                    "why_vanvas_recommends": "Jaw-dropping cliffside mud architecture dating back to the 12th century.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": True
                },
                {
                    "name": "Tabo Monastery (Ajanta of the Himalayas)",
                    "slug": "tabo-monastery",
                    "category": "Culture & Heritage",
                    "description": "Thousand-year-old mud-brick Tibetan Buddhist monastic complex with ancient stupas, clay statues, and preserved mural halls.",
                    "address": "Tabo Village, Spiti Valley",
                    "latitude": 31.9960,
                    "longitude": 78.3810,
                    "price_level": "Free",
                    "approx_cost": 0.0,
                    "rating": 4.9,
                    "review_count": 790,
                    "opening_time": "06:00",
                    "closing_time": "18:00",
                    "tags": "Monastery,UNESCO,Ancient Murals,Mudbrick,Heritage",
                    "image_url": "/images/places/spiti/tabo-monastery.webp",
                    "why_vanvas_recommends": "Founded in 996 AD with remarkably preserved Buddhist frescos that rival Ajanta.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": True
                },
                {
                    "name": "Kaza High Town & Local Bazaar",
                    "slug": "kaza-town",
                    "category": "Shops & Markets",
                    "description": "High-altitude administrative capital town with whitewashed mud homes, sea-buckthorn juice stalls, and woolen handicraft shops.",
                    "address": "Main Market, Kaza, Spiti",
                    "latitude": 32.2270,
                    "longitude": 78.0720,
                    "price_level": "₹",
                    "approx_cost": 100.0,
                    "rating": 4.6,
                    "review_count": 510,
                    "opening_time": "08:00",
                    "closing_time": "20:00",
                    "tags": "Market,Town,Crafts,Tibetan Food,Bazaar",
                    "image_url": "/images/places/spiti/kaza.webp",
                    "why_vanvas_recommends": "The central pulse of Spiti Valley life with local momo joints and herbal tea shops.",
                    "is_must_visit": False,
                    "is_hidden_gem": False,
                    "is_indoor": False
                }
            ],
            "munnar": [
                {
                    "name": "Kolukkumalai Highest Tea Estate",
                    "slug": "kolukkumalai-tea",
                    "category": "Nature & Trails",
                    "description": "The world's highest organic orthodox tea plantation perched at 2,160m with breathtaking sunrise cloud inversions.",
                    "address": "Kolukkumalai, Munnar",
                    "latitude": 10.0820,
                    "longitude": 77.1650,
                    "price_level": "₹₹",
                    "approx_cost": 250.0,
                    "rating": 4.9,
                    "review_count": 880,
                    "opening_time": "05:00",
                    "closing_time": "18:00",
                    "tags": "Tea Estate,Sunrise,Clouds,Western Ghats",
                    "image_url": "/images/places/munnar/kolukkumalai-tea.webp",
                    "why_vanvas_recommends": "Watch dawn break over a sea of white clouds from century-old tea trails.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                },
                {
                    "name": "Eravikulam National Park & Anamudi Ridge",
                    "slug": "eravikulam-park",
                    "category": "Nature & Trails",
                    "description": "High-altitude rolling grassland sanctuary home to the endangered Nilgiri Tahr and views of South India's highest peak Anamudi.",
                    "address": "Kannan Devan Hills, Munnar",
                    "latitude": 10.1500,
                    "longitude": 77.0600,
                    "price_level": "₹₹",
                    "approx_cost": 200.0,
                    "rating": 4.7,
                    "review_count": 1400,
                    "opening_time": "07:30",
                    "closing_time": "16:00",
                    "tags": "National Park,Nilgiri Tahr,Anamudi,Shola Grasslands",
                    "image_url": "/images/places/munnar/eravikulam-park.webp",
                    "why_vanvas_recommends": "Iconic mist-draped shola forest ecosystem unique to the Western Ghats.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                },
                {
                    "name": "Mattupetty Dam & Reflection Lake",
                    "slug": "mattupetty-dam",
                    "category": "Nature & Trails",
                    "description": "Concrete gravity dam surrounded by tea estates and cardamom groves where wild elephants occasionally gather at dusk.",
                    "address": "Mattupetty, 13 km from Munnar",
                    "latitude": 10.1060,
                    "longitude": 77.1240,
                    "price_level": "₹",
                    "approx_cost": 50.0,
                    "rating": 4.5,
                    "review_count": 1100,
                    "opening_time": "08:30",
                    "closing_time": "17:00",
                    "tags": "Lake,Dam,Boating,Tea Hills,Elephants",
                    "image_url": "/images/places/munnar/mattupetty-dam.webp",
                    "why_vanvas_recommends": "Tranquil speed-boating surrounded by mirror reflections of emerald tea hills.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                },
                {
                    "name": "Attukal Cascading Waterfalls",
                    "slug": "attukal-waterfalls",
                    "category": "Nature & Trails",
                    "description": "Dramatic multi-tier jungle waterfall rolling over black granite boulders between Munnar and Pallivasal.",
                    "address": "Attukal Waterfall Rd, Munnar",
                    "latitude": 10.0570,
                    "longitude": 77.0390,
                    "price_level": "Free",
                    "approx_cost": 0.0,
                    "rating": 4.6,
                    "review_count": 890,
                    "opening_time": "07:00",
                    "closing_time": "18:30",
                    "tags": "Waterfall,Jungle,Granite,Trek,Scenic",
                    "image_url": "/images/places/munnar/categories/waterfall.webp",
                    "why_vanvas_recommends": "Spectacular rushing cascade framed by lush jungle flora.",
                    "is_must_visit": False,
                    "is_hidden_gem": True,
                    "is_indoor": False
                }
            ]
        }

        # Seed places for all destinations
        curated_place_keys = set()
        for dest_slug, places_list in curated_places_by_dest.items():
            if dest_slug in dest_objects:
                dest_obj = dest_objects[dest_slug]
                for p_data in places_list:
                    curated_place_keys.add((dest_obj.id, p_data["slug"]))
                    existing_p = db.query(Place).filter(Place.destination_id == dest_obj.id, Place.slug == p_data["slug"]).first()
                    if not existing_p:
                        p = Place(destination_id=dest_obj.id, **p_data)
                        db.add(p)
                    else:
                        for k, v in p_data.items():
                            setattr(existing_p, k, v)

        # Clean up legacy / orphan / duplicate places
        seen_dest_slug = set()
        for old_p in db.query(Place).all():
            key = (old_p.destination_id, old_p.slug)
            if key not in curated_place_keys or key in seen_dest_slug:
                db.query(ItineraryItem).filter(ItineraryItem.place_id == old_p.id).delete()
                db.query(SavedPlace).filter(SavedPlace.place_id == old_p.id).delete()
                db.delete(old_p)
            else:
                seen_dest_slug.add(key)
        db.flush()

        # 5. Seed Curated Stays (Hotels) for all 12 destinations
        curated_hotels_by_dest = {
            "manali": [
                {
                    "name": "The Himalayan Woods Boutique Retreat",
                    "address": "Log Huts Area, Old Manali, HP",
                    "latitude": 32.2510,
                    "longitude": 77.1775,
                    "price_per_night": 2400.0,
                    "rating": 4.8,
                    "hotel_style": "Boutique / Mountain View",
                    "amenities": "High-Speed WiFi,Valley Balcony,Wood Stoves,Bonfire,Café",
                    "check_in_time": "11:00 AM",
                    "check_out_time": "10:00 AM",
                    "image_url": "/images/places/manali/categories/stay.webp",
                    "booking_url": "https://booking.vanvas.com/himalayan-woods",
                    "badge": "Best for your trip"
                }
            ],
            "mussoorie": [
                {
                    "name": "Rokeby Manor Heritage Sanctuary",
                    "address": "Landour Cantt, Mussoorie, UK",
                    "latitude": 30.4615,
                    "longitude": 78.0930,
                    "price_per_night": 6500.0,
                    "rating": 4.9,
                    "hotel_style": "Heritage / Victorian Manor",
                    "amenities": "Stone Fireplaces,Tea Garden,Spa,Himalayan Balconies,Library",
                    "check_in_time": "02:00 PM",
                    "check_out_time": "11:00 AM",
                    "image_url": "/images/places/mussoorie/categories/stay.webp",
                    "booking_url": "https://rokebymanor.com",
                    "badge": "Heritage Sanctuary"
                }
            ],
            "udaipur": [
                {
                    "name": "Jagat Niwas Palace Lakeside Heritage",
                    "address": "23-25 Lal Ghat, Lake Pichola, Udaipur",
                    "latitude": 24.5775,
                    "longitude": 73.6815,
                    "price_per_night": 5200.0,
                    "rating": 4.9,
                    "hotel_style": "Heritage / Lakefront Haveli",
                    "amenities": "Jharokha Lake Seating,Rooftop Dining,Heritage Courtyard,Boating",
                    "check_in_time": "01:00 PM",
                    "check_out_time": "11:00 AM",
                    "image_url": "/images/places/udaipur/categories/stay.webp",
                    "booking_url": "https://jagatniwaspalace.com",
                    "badge": "Best Lake Views"
                }
            ],
            "varanasi": [
                {
                    "name": "BrijRama Palace River Heritage",
                    "address": "Darbhanga Ghat, Varanasi, UP",
                    "latitude": 25.3050,
                    "longitude": 83.0110,
                    "price_per_night": 9500.0,
                    "rating": 4.9,
                    "hotel_style": "Heritage / 18th Century River Palace",
                    "amenities": "River Terrace,Classical Sitar Evenings,Private Boat,Fine Dining",
                    "check_in_time": "02:00 PM",
                    "check_out_time": "12:00 PM",
                    "image_url": "/images/places/varanasi/categories/stay.webp",
                    "booking_url": "https://brijrama.com",
                    "badge": "Iconic Riverfront Sanctuary"
                }
            ],
            "leh": [
                {
                    "name": "The Grand Dragon Ladakh Heritage",
                    "address": "Old Road Sheynam, Leh, Ladakh",
                    "latitude": 34.1610,
                    "longitude": 77.5810,
                    "price_per_night": 7800.0,
                    "rating": 4.9,
                    "hotel_style": "Heritage / Solar Eco Luxury",
                    "amenities": "Central Heating,Oxygen Supply,Stok Kangri Balcony,Ladakhi Dining",
                    "check_in_time": "12:00 PM",
                    "check_out_time": "10:00 AM",
                    "image_url": "/images/places/leh/categories/stay.webp",
                    "booking_url": "https://thegranddragonladakh.com",
                    "badge": "Luxury Alpine Sanctuary"
                }
            ],
            "spiti": [
                {
                    "name": "Spiti Valley Homestay Sanctuary",
                    "address": "Kaza Main Village, Spiti, HP",
                    "latitude": 32.2250,
                    "longitude": 78.0720,
                    "price_per_night": 1800.0,
                    "rating": 4.8,
                    "hotel_style": "Homestay / Traditional Mudhouse",
                    "amenities": "Traditional Tandoor Room,Himalayan Herbal Tea,Mountain Views",
                    "check_in_time": "12:00 PM",
                    "check_out_time": "10:00 AM",
                    "image_url": "/images/places/spiti/categories/stay.webp",
                    "booking_url": "https://booking.vanvas.com/spiti-homestay",
                    "badge": "Authentic Mudhouse"
                }
            ],
            "kasol": [
                {
                    "name": "Parvati Woods Bohemian Alpine Lodge",
                    "address": "Near Old Bridge, Kasol, HP",
                    "latitude": 32.0115,
                    "longitude": 77.3160,
                    "price_per_night": 2200.0,
                    "rating": 4.8,
                    "hotel_style": "Alpine Lodge / Pine Balcony",
                    "amenities": "Riverside Cafe,High-Speed WiFi,Bonfire Lounge,Hammocks",
                    "check_in_time": "12:00 PM",
                    "check_out_time": "11:00 AM",
                    "image_url": "/images/places/kasol/categories/stay.webp",
                    "booking_url": "https://booking.vanvas.com/parvati-woods",
                    "badge": "Riverside Alpine Lodge"
                }
            ],
            "goa": [
                {
                    "name": "Fontainhas Heritage Boutique Villa",
                    "address": "31st January Road, Panaji, Goa",
                    "latitude": 15.4975,
                    "longitude": 73.8320,
                    "price_per_night": 4500.0,
                    "rating": 4.9,
                    "hotel_style": "Portuguese Heritage / Latin Quarter",
                    "amenities": "Courtyard Garden,Portuguese Balcony,Artisan Breakfast",
                    "check_in_time": "02:00 PM",
                    "check_out_time": "11:00 AM",
                    "image_url": "/images/places/goa/categories/stay.webp",
                    "booking_url": "https://booking.vanvas.com/fontainhas-villa",
                    "badge": "Latin Heritage Villa"
                }
            ],
            "jaipur": [
                {
                    "name": "Samode Haveli Royal Residence",
                    "address": "Gangapole, Jaipur, Rajasthan",
                    "latitude": 26.9290,
                    "longitude": 75.8350,
                    "price_per_night": 8500.0,
                    "rating": 4.9,
                    "hotel_style": "Royal Haveli / Heritage Courtyard",
                    "amenities": "Moorish Pool,Sheesh Mahal Dining,Frescoed Courtyards,Spa",
                    "check_in_time": "02:00 PM",
                    "check_out_time": "12:00 PM",
                    "image_url": "/images/places/jaipur/categories/stay.webp",
                    "booking_url": "https://booking.vanvas.com/samode-haveli",
                    "badge": "Royal Haveli"
                }
            ],
            "dharamshala": [
                {
                    "name": "Chonor House Tibetan Heritage Lodge",
                    "address": "Near The Dalai Lama Temple, McLeod Ganj, HP",
                    "latitude": 32.2360,
                    "longitude": 76.3255,
                    "price_per_night": 3800.0,
                    "rating": 4.9,
                    "hotel_style": "Tibetan Art / Cedar Forest View",
                    "amenities": "Hand-painted Murals,Organic Bakery,Dhauladhar Terrace",
                    "check_in_time": "01:00 PM",
                    "check_out_time": "11:00 AM",
                    "image_url": "/images/places/dharamshala/categories/stay.webp",
                    "booking_url": "https://booking.vanvas.com/chonor-house",
                    "badge": "Tibetan Cultural Sanctuary"
                }
            ],
            "rishikesh": [
                {
                    "name": "Ganga Kinare Riverside Retreat",
                    "address": "23 Barrage Road, Rishikesh, UK",
                    "latitude": 30.0980,
                    "longitude": 78.2910,
                    "price_per_night": 5400.0,
                    "rating": 4.8,
                    "hotel_style": "Riverside Retreat / Yoga & Spa",
                    "amenities": "Private Ganga Ghat,Sunrise Yoga,Ayurvedic Spa,Organic Dining",
                    "check_in_time": "02:00 PM",
                    "check_out_time": "11:00 AM",
                    "image_url": "/images/places/rishikesh/categories/stay.webp",
                    "booking_url": "https://booking.vanvas.com/ganga-kinare",
                    "badge": "Private Ganga Ghat"
                }
            ],
            "munnar": [
                {
                    "name": "Windermere Estate Tea Plantation Sanctuary",
                    "address": "Pothamedu, Munnar, Kerala",
                    "latitude": 10.0550,
                    "longitude": 77.0580,
                    "price_per_night": 6200.0,
                    "rating": 4.9,
                    "hotel_style": "Colonial Planter Bungalow",
                    "amenities": "Tea Garden Trails,Cardamom Forest Walk,Fireplace Dining",
                    "check_in_time": "01:00 PM",
                    "check_out_time": "11:00 AM",
                    "image_url": "/images/places/munnar/categories/stay.webp",
                    "booking_url": "https://booking.vanvas.com/windermere-estate",
                    "badge": "Tea Planter Sanctuary"
                }
            ]
        }

        for dest_slug, hotel_list in curated_hotels_by_dest.items():
            if dest_slug in dest_objects:
                dest_obj = dest_objects[dest_slug]
                for h_data in hotel_list:
                    existing_h = db.query(Hotel).filter(Hotel.destination_id == dest_obj.id, Hotel.name == h_data["name"]).first()
                    if not existing_h:
                        h = Hotel(destination_id=dest_obj.id, **h_data)
                        db.add(h)
                    else:
                        for k, v in h_data.items():
                            setattr(existing_h, k, v)

        # Clean up legacy / orphan hotels
        curated_hotel_names = {h["name"] for hotel_list in curated_hotels_by_dest.values() for h in hotel_list}
        for old_h in db.query(Hotel).all():
            if old_h.name not in curated_hotel_names:
                db.delete(old_h)
        db.flush()

        # 6. Seed Curated Rentals for all destinations
        curated_rentals_by_dest = {
            "manali": [
                {
                    "provider_name": "Himalayan Riders Mobility",
                    "vehicle_type": "Royal Enfield Himalayan 450",
                    "vehicle_name": "Himalayan 450 Adventure",
                    "price_per_day": 1400.0,
                    "deposit_amount": 2000.0,
                    "location": "Near Mall Road Taxi Stand, Manali",
                    "latitude": 32.2410,
                    "longitude": 77.1880,
                    "opening_hours": "07:30 AM - 09:00 PM",
                    "rating": 4.9,
                    "image_url": "/images/vehicles/adventure_motorcycle.svg"
                },
                {
                    "provider_name": "Valley Scooters Hub",
                    "vehicle_type": "Scooter",
                    "vehicle_name": "Honda Activa 6G (Hill Tuned)",
                    "price_per_day": 550.0,
                    "deposit_amount": 1000.0,
                    "location": "Old Manali Bridge Junction",
                    "latitude": 32.2515,
                    "longitude": 77.1760,
                    "opening_hours": "08:00 AM - 08:30 PM",
                    "rating": 4.8,
                    "image_url": "/images/vehicles/automatic_scooter.svg"
                }
            ],
            "mussoorie": [
                {
                    "provider_name": "Landour Moto Wheels",
                    "vehicle_type": "Royal Enfield Classic 350",
                    "vehicle_name": "Classic 350 Bullet (Reborn)",
                    "price_per_day": 1100.0,
                    "deposit_amount": 1500.0,
                    "location": "Picture Palace Bus Stand, Mussoorie",
                    "latitude": 30.4575,
                    "longitude": 78.0790,
                    "opening_hours": "08:00 AM - 08:00 PM",
                    "rating": 4.8,
                    "image_url": "/images/vehicles/classic_bullet.svg"
                }
            ],
            "udaipur": [
                {
                    "provider_name": "Lakeside Royal Cruisers",
                    "vehicle_type": "Scooter",
                    "vehicle_name": "TVS Jupiter 125 Classic",
                    "price_per_day": 450.0,
                    "deposit_amount": 1000.0,
                    "location": "Rang Sagar, Old City, Udaipur",
                    "latitude": 24.5820,
                    "longitude": 73.6790,
                    "opening_hours": "08:00 AM - 09:00 PM",
                    "rating": 4.8,
                    "image_url": "/images/vehicles/automatic_scooter.svg"
                }
            ],
            "leh": [
                {
                    "provider_name": "Ladakh High Altitude Expeditions",
                    "vehicle_type": "Royal Enfield Himalayan 450",
                    "vehicle_name": "Himalayan 450 Expedition",
                    "price_per_day": 1600.0,
                    "deposit_amount": 3000.0,
                    "location": "Fort Road, Leh",
                    "latitude": 34.1620,
                    "longitude": 77.5840,
                    "opening_hours": "07:00 AM - 09:00 PM",
                    "rating": 4.9,
                    "image_url": "/images/vehicles/adventure_motorcycle.svg"
                }
            ]
        }

        for dest_slug, rental_list in curated_rentals_by_dest.items():
            if dest_slug in dest_objects:
                dest_obj = dest_objects[dest_slug]
                for r_data in rental_list:
                    existing_r = db.query(RentalOption).filter(RentalOption.destination_id == dest_obj.id, RentalOption.vehicle_name == r_data["vehicle_name"]).first()
                    if not existing_r:
                        r = RentalOption(destination_id=dest_obj.id, **r_data)
                        db.add(r)
        db.flush()

        db.commit()
        print("VANVAS curated travel database successfully seeded with 12 isolated destinations.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
