import json
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from sqlalchemy.orm import Session

from app.database.session import SessionLocal, engine, Base
from app.models.models import (
    Destination, PlaceCategory, Place, Hotel,
    RentalOption, TransportOption, WeatherSnapshot
)

def auto_migrate_destinations(db: Session):
    from sqlalchemy import text
    new_cols = [
        ("name_en", "VARCHAR(255)"),
        ("name_hi", "VARCHAR(255)"),
        ("subtitle_en", "VARCHAR(500)"),
        ("subtitle_hi", "VARCHAR(500)"),
        ("description_en", "TEXT"),
        ("description_hi", "TEXT"),
        ("hero_artwork", "VARCHAR(500)"),
        ("hero_photo", "VARCHAR(500)"),
        ("one_day_available", "BOOLEAN DEFAULT 1"),
        ("trek_available", "BOOLEAN DEFAULT 0"),
        ("nearby_available", "BOOLEAN DEFAULT 1"),
    ]
    for col_name, col_type in new_cols:
        try:
            db.execute(text(f"ALTER TABLE destinations ADD COLUMN {col_name} {col_type}"))
            db.commit()
            print(f"Migrated column: destinations.{col_name}")
        except Exception:
            db.rollback()

def seed_all_canonical():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    auto_migrate_destinations(db)

    try:
        # Load canonical json
        json_path = Path(r"C:\Users\user\Desktop\Vanvas\scratch\canonical_destinations.json")
        destinations_list = json.loads(json_path.read_text(encoding="utf-8"))

        print(f"Loaded {len(destinations_list)} canonical destinations from JSON")

        # Upsert all destinations
        dest_objects = {}
        for d in destinations_list:
            slug = d["slug"]
            existing = db.query(Destination).filter(Destination.slug == slug).first()
            if not existing:
                dest = Destination(
                    name=d["name"],
                    slug=slug,
                    hindi_name=d.get("hindi_name"),
                    name_en=d.get("name_en") or d["name"],
                    name_hi=d.get("name_hi") or d.get("hindi_name"),
                    state=d["state"],
                    region=d["region"],
                    tagline=d["tagline"],
                    subtitle_en=d.get("subtitle_en") or d["tagline"],
                    subtitle_hi=d.get("subtitle_hi"),
                    description=d["description"],
                    description_en=d.get("description_en") or d["description"],
                    description_hi=d.get("description_hi"),
                    hero_image=d.get("hero_image"),
                    hero_artwork=d.get("hero_artwork") or d.get("hero_image"),
                    hero_photo=d.get("hero_photo") or d.get("hero_image"),
                    latitude=d["latitude"],
                    longitude=d["longitude"],
                    altitude_meters=d.get("altitude_meters"),
                    best_time_to_visit=d.get("best_time_to_visit"),
                    weather_type=d.get("weather_type") or "Pleasant",
                    one_day_available=d.get("one_day_available", True),
                    trek_available=d.get("trek_available", False),
                    nearby_available=d.get("nearby_available", True),
                    is_featured=True
                )
                db.add(dest)
                db.flush()
                dest_objects[slug] = dest
                print(f"Created destination: {dest.name} ({slug})")
            else:
                existing.name = d["name"]
                existing.hindi_name = d.get("hindi_name")
                existing.name_en = d.get("name_en") or d["name"]
                existing.name_hi = d.get("name_hi") or d.get("hindi_name")
                existing.state = d["state"]
                existing.region = d["region"]
                existing.tagline = d["tagline"]
                existing.subtitle_en = d.get("subtitle_en") or d["tagline"]
                existing.subtitle_hi = d.get("subtitle_hi")
                existing.description = d["description"]
                existing.description_en = d.get("description_en") or d["description"]
                existing.description_hi = d.get("description_hi")
                existing.hero_image = d.get("hero_image")
                existing.hero_artwork = d.get("hero_artwork") or d.get("hero_image")
                existing.hero_photo = d.get("hero_photo") or d.get("hero_image")
                existing.latitude = d["latitude"]
                existing.longitude = d["longitude"]
                existing.altitude_meters = d.get("altitude_meters")
                existing.best_time_to_visit = d.get("best_time_to_visit")
                existing.weather_type = d.get("weather_type") or "Pleasant"
                existing.one_day_available = d.get("one_day_available", True)
                existing.trek_available = d.get("trek_available", False)
                existing.nearby_available = d.get("nearby_available", True)
                existing.is_featured = True
                db.flush()
                dest_objects[slug] = existing
                print(f"Updated destination: {existing.name} ({slug})")

        # Category map
        categories = {c.slug: c for c in db.query(PlaceCategory).all()}

        # Curated places for the additional One-Day and Spiritual destinations
        rich_places = {
            "kainchi-dham": [
                {
                    "name": "Neem Karoli Baba Kainchi Ashram Complex",
                    "slug": "kainchi-ashram-complex",
                    "category": "Culture & Heritage",
                    "description": "The sacred sanctuary established in 1962 by Neem Karoli Baba, where hundreds gather for evening Hanuman Chalisa chanting by the mountain river.",
                    "address": "Kainchi Dham, Bhowali-Almora Road, Nainital District",
                    "latitude": 29.4239,
                    "longitude": 79.5165,
                    "price_level": "Free",
                    "approx_cost": 0.0,
                    "rating": 4.9,
                    "review_count": 1420,
                    "opening_time": "06:00",
                    "closing_time": "20:00",
                    "tags": "Spiritual,Neem Karoli Baba,Hanuman Temple,River Valley",
                    "image_url": "/images/destinations/kainchi-dham/hero.jpg",
                    "why_vanvas_recommends": "World-renowned spiritual retreat where Steve Jobs and Mark Zuckerberg sought clarity and focus.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                },
                {
                    "name": "Kainchi River Stream Meditation Trail",
                    "slug": "kainchi-river-stream-trail",
                    "category": "Nature & Trails",
                    "description": "Tranquil walking path along the clean mountain stream running through ancient boulder rock formations right below the ashram.",
                    "address": "Kainchi Stream Bank, Bhowali Road",
                    "latitude": 29.4245,
                    "longitude": 79.5170,
                    "price_level": "Free",
                    "approx_cost": 0.0,
                    "rating": 4.8,
                    "review_count": 320,
                    "opening_time": "06:00",
                    "closing_time": "18:30",
                    "tags": "River Stream,Pine Forest,Meditation,Serene",
                    "image_url": "/images/places/universal/waterfall.webp",
                    "why_vanvas_recommends": "Perfect spot to sit by large smooth river rocks and listen to the flowing water.",
                    "is_must_visit": True,
                    "is_hidden_gem": True,
                    "is_indoor": False
                },
                {
                    "name": "Gagar Himalayan Sunrise Viewpoint",
                    "slug": "gagar-sunrise-viewpoint",
                    "category": "Nature & Trails",
                    "description": "Perched on the ridge 10 km from Kainchi Dham, offering panoramic views of Trishul and Nanda Devi snow peaks.",
                    "address": "Gagar Pass, Ramgarh Road, Nainital",
                    "latitude": 29.4350,
                    "longitude": 79.5500,
                    "price_level": "Free",
                    "approx_cost": 0.0,
                    "rating": 4.7,
                    "review_count": 210,
                    "opening_time": "05:00",
                    "closing_time": "19:00",
                    "tags": "Panoramic View,Himalayas,Snow Peaks,Photography",
                    "image_url": "/images/places/universal/viewpoint.webp",
                    "why_vanvas_recommends": "Spectacular sunrise over the Kumaon snowline before heading down to the ashram.",
                    "is_must_visit": False,
                    "is_hidden_gem": True,
                    "is_indoor": False
                },
                {
                    "name": "Bhowali Himalayan Fruit & Tea Market",
                    "slug": "bhowali-fruit-market",
                    "category": "Markets & Craft",
                    "description": "Famous hill bazaar for fresh Kumaoni apricots, apples, kafal berries, and herbal Himalayan teas.",
                    "address": "Main Chowk, Bhowali",
                    "latitude": 29.3850,
                    "longitude": 79.5200,
                    "price_level": "₹₹",
                    "approx_cost": 300.0,
                    "rating": 4.6,
                    "review_count": 480,
                    "opening_time": "08:00",
                    "closing_time": "21:00",
                    "tags": "Local Produce,Herbal Tea,Organic Honey,Fresh Fruits",
                    "image_url": "/images/places/universal/food.webp",
                    "why_vanvas_recommends": "Pick up authentic regional honey and freshly plucked orchard fruits.",
                    "is_must_visit": False,
                    "is_hidden_gem": False,
                    "is_indoor": False
                }
            ],
            "murthal": [
                {
                    "name": "Amrik Sukhdev Legendary Dhaba",
                    "slug": "amrik-sukhdev-dhaba",
                    "category": "Local Food",
                    "description": "Iconic multi-generational GT Road highway landmark famous for tandoori aloo-pyaaz parathas served with enormous dollops of white makhan.",
                    "address": "Mile 52.2 Stone, NH-44, Murthal, Sonipat, Haryana 131027",
                    "latitude": 29.0289,
                    "longitude": 77.0707,
                    "price_level": "₹₹",
                    "approx_cost": 250.0,
                    "rating": 4.7,
                    "review_count": 2840,
                    "opening_time": "00:00",
                    "closing_time": "23:59",
                    "tags": "24/7 Dhaba,Tandoori Paratha,White Butter,Kulhad Chai",
                    "image_url": "/images/destinations/murthal/hero.jpg",
                    "why_vanvas_recommends": "The quintessential North Indian midnight and dawn highway pitstop.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": True
                },
                {
                    "name": "Haveli Murthal Heritage Food Village",
                    "slug": "haveli-murthal-village",
                    "category": "Local Food",
                    "description": "Themed Punjabi village reproduction complete with folk music, clay sculptures, lassi bar, and authentic sarson ka saag with makki ki roti.",
                    "address": "NH-44, Murthal, Haryana",
                    "latitude": 29.0310,
                    "longitude": 77.0725,
                    "price_level": "₹₹₹",
                    "approx_cost": 400.0,
                    "rating": 4.6,
                    "review_count": 1920,
                    "opening_time": "07:00",
                    "closing_time": "23:30",
                    "tags": "Punjabi Heritage,Lassi,Cultural,Folk Dance",
                    "image_url": "/images/places/universal/food.webp",
                    "why_vanvas_recommends": "Immersive rustic ambiance with outstanding chole bhature and thick creamy lassi.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": True
                }
            ],
            "agra": [
                {
                    "name": "Taj Mahal",
                    "slug": "taj-mahal",
                    "category": "Culture & Heritage",
                    "description": "The iconic white marble mausoleum commissioned in 1631 by Mughal Emperor Shah Jahan, recognized worldwide as a UNESCO World Heritage wonder.",
                    "address": "Dharmapuri, Forest Colony, Tajganj, Agra, Uttar Pradesh 282001",
                    "latitude": 27.1751,
                    "longitude": 78.0421,
                    "price_level": "₹₹",
                    "approx_cost": 50.0,
                    "rating": 4.9,
                    "review_count": 8900,
                    "opening_time": "06:00",
                    "closing_time": "18:30",
                    "tags": "UNESCO,Mughal Architecture,Marble Poetry,Sunrise",
                    "image_url": "/images/destinations/agra/hero.jpg",
                    "why_vanvas_recommends": "Arrive at dawn gates for mystical mist rising off the Yamuna behind the marble dome.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                },
                {
                    "name": "Agra Red Sandstone Fort",
                    "slug": "agra-fort",
                    "category": "Culture & Heritage",
                    "description": "Vast 16th-century Mughal red sandstone fortress comprising Jahangiri Mahal, Khas Mahal, and Diwan-i-Khas overlooking the river.",
                    "address": "Agra Fort, Rakabganj, Agra",
                    "latitude": 27.1795,
                    "longitude": 78.0211,
                    "price_level": "₹₹",
                    "approx_cost": 50.0,
                    "rating": 4.8,
                    "review_count": 3400,
                    "opening_time": "06:00",
                    "closing_time": "18:00",
                    "tags": "UNESCO,Mughal Fort,Historic,Ramparts",
                    "image_url": "/images/places/universal/heritage.webp",
                    "why_vanvas_recommends": "Incredible riverfront perspective of the Taj Mahal from Shah Jahan's octagonal tower.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                }
            ],
            "mathura-vrindavan": [
                {
                    "name": "Prem Mandir Vrindavan",
                    "slug": "prem-mandir-vrindavan",
                    "category": "Culture & Heritage",
                    "description": "Stunning Italian white marble temple complex illuminated every evening with vibrant multi-colored light shows depicting Krishna lilas.",
                    "address": "Chatikara Road, Raman Reti, Vrindavan, Uttar Pradesh 281121",
                    "latitude": 27.5706,
                    "longitude": 77.6599,
                    "price_level": "Free",
                    "approx_cost": 0.0,
                    "rating": 4.9,
                    "review_count": 4600,
                    "opening_time": "05:30",
                    "closing_time": "20:30",
                    "tags": "White Marble,Musical Fountain,Light Show,Spiritual",
                    "image_url": "/images/destinations/mathura-vrindavan/hero.jpg",
                    "why_vanvas_recommends": "Spectacular evening lighting and peaceful garden promenades.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                },
                {
                    "name": "Banke Bihari Temple Vrindavan",
                    "slug": "banke-bihari-temple",
                    "category": "Culture & Heritage",
                    "description": "Historic Rajasthani style temple housing the beloved black marble image of Lord Krishna, famous for curtain aartis and vibrant devotion.",
                    "address": "Godawari Dham, Vrindavan",
                    "latitude": 27.5815,
                    "longitude": 77.7001,
                    "price_level": "Free",
                    "approx_cost": 0.0,
                    "rating": 4.8,
                    "review_count": 5200,
                    "opening_time": "07:45",
                    "closing_time": "21:30",
                    "tags": "Ancient Temple,Devotion,Braj Heritage",
                    "image_url": "/images/places/universal/spiritual.webp",
                    "why_vanvas_recommends": "The spiritual heartbeat of Vrindavan.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": True
                }
            ],
            "neemrana": [
                {
                    "name": "Neemrana Fort-Palace (15th Century)",
                    "slug": "neemrana-fort-palace",
                    "category": "Culture & Heritage",
                    "description": "14-tiered stepped Rajput heritage fortress carved into the Aravalli hillside along NH-48 with royal ramparts and India's first aerial zipline.",
                    "address": "15th Century, Delhi-Jaipur Highway, Neemrana, Rajasthan 301705",
                    "latitude": 27.9942,
                    "longitude": 76.3869,
                    "price_level": "₹₹₹₹",
                    "approx_cost": 1500.0,
                    "rating": 4.7,
                    "review_count": 2100,
                    "opening_time": "09:00",
                    "closing_time": "18:00",
                    "tags": "Heritage Fort,Aravalli Hill,Zipline,Sunset Ramparts",
                    "image_url": "/images/destinations/neemrana/hero.jpg",
                    "why_vanvas_recommends": "Grand terraced palace architecture with spectacular canyon views.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                }
            ],
            "damdama-sohna": [
                {
                    "name": "Damdama Natural Lake & Boating",
                    "slug": "damdama-lake",
                    "category": "Nature & Trails",
                    "description": "Expansive natural rain-fed lake cradled by the rugged Aravalli rocky ridges, ideal for kayaking, paddle boating, and cliff trail hikes.",
                    "address": "Damdama Lake Road, Sohna, Gurugram, Haryana 122102",
                    "latitude": 28.3075,
                    "longitude": 77.0617,
                    "price_level": "₹₹",
                    "approx_cost": 200.0,
                    "rating": 4.5,
                    "review_count": 1400,
                    "opening_time": "08:00",
                    "closing_time": "18:00",
                    "tags": "Lakeside,Boating,Aravalli Hills,Birdwatching",
                    "image_url": "/images/destinations/damdama-sohna/hero.jpg",
                    "why_vanvas_recommends": "Tranquil water getaway less than an hour from Gurgaon's high-rises.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                }
            ],
            "alwar-siliserh": [
                {
                    "name": "Siliserh Lake Royal Palace",
                    "slug": "siliserh-lake-palace",
                    "category": "Culture & Heritage",
                    "description": "Historic 1845 royal lake hunting lodge built by Maharaja Vinay Singh, offering scenic motorboat rides and lakefront terrace dining.",
                    "address": "Siliserh Lake, Alwar, Rajasthan 301001",
                    "latitude": 27.5342,
                    "longitude": 76.5411,
                    "price_level": "₹₹",
                    "approx_cost": 100.0,
                    "rating": 4.6,
                    "review_count": 1800,
                    "opening_time": "08:00",
                    "closing_time": "18:30",
                    "tags": "Royal Lake,Boat Safari,Aravalli Hills,Water Reflections",
                    "image_url": "/images/destinations/alwar-siliserh/hero.jpg",
                    "why_vanvas_recommends": "Majestic sunset reflections over calm blue lake waters.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                }
            ],
            "sariska-bhangarh": [
                {
                    "name": "Sariska Tiger Reserve Safari",
                    "slug": "sariska-tiger-reserve",
                    "category": "Adventure",
                    "description": "Expansive Aravalli deciduous forest sanctuary home to Royal Bengal tigers, leopards, sambar deer, and ancient medieval ruins.",
                    "address": "Alwar-Thanagazi Road, Sariska, Rajasthan 301022",
                    "latitude": 27.3292,
                    "longitude": 76.4389,
                    "price_level": "₹₹₹",
                    "approx_cost": 900.0,
                    "rating": 4.6,
                    "review_count": 2200,
                    "opening_time": "06:00",
                    "closing_time": "18:00",
                    "tags": "Tiger Safari,Wilderness,Deciduous Forest,4x4 Jeep",
                    "image_url": "/images/destinations/sariska-bhangarh/hero.jpg",
                    "why_vanvas_recommends": "Thrilling open-jeep jungle safari through Aravalli valleys.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                },
                {
                    "name": "Bhangarh 17th-Century Fort Ruins",
                    "slug": "bhangarh-fort",
                    "category": "Culture & Heritage",
                    "description": "Atmospheric 17th-century fortified township ruins with ancient banyan trees, stone temples, and mysterious royal pavilions at sunset.",
                    "address": "Gola ka Baas, Rajgarh Tehsil, Alwar District, Rajasthan 301410",
                    "latitude": 27.0964,
                    "longitude": 76.2864,
                    "price_level": "₹",
                    "approx_cost": 25.0,
                    "rating": 4.5,
                    "review_count": 3100,
                    "opening_time": "06:00",
                    "closing_time": "18:00",
                    "tags": "Historic Ruins,Mystery,Stone Architecture,Banyan Trees",
                    "image_url": "/images/places/universal/heritage.webp",
                    "why_vanvas_recommends": "Fascinating stone carved temples and dramatic mountain backdrop.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                }
            ],
            "dehradun": [
                {
                    "name": "Robber's Cave (Guchhupani)",
                    "slug": "robbers-cave-guchhupani",
                    "category": "Nature & Trails",
                    "description": "Natural narrow limestone gorge where knee-deep cold mountain water flows between 10-meter high rock walls.",
                    "address": "Guchhupani, Malsi, Dehradun, Uttarakhand 248003",
                    "latitude": 30.3756,
                    "longitude": 78.0611,
                    "price_level": "₹",
                    "approx_cost": 35.0,
                    "rating": 4.6,
                    "review_count": 2900,
                    "opening_time": "07:00",
                    "closing_time": "18:00",
                    "tags": "Limestone Gorge,Cold Stream,Cave Trail,Nature",
                    "image_url": "/images/destinations/dehradun/hero.jpg",
                    "why_vanvas_recommends": "Walk through ankle-deep freezing water into hidden subterranean waterfalls.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                },
                {
                    "name": "Rajpur Road Heritage Bakery & Café Strip",
                    "slug": "rajpur-road-cafes",
                    "category": "Cafés & Bakery",
                    "description": "Charming tree-lined street filled with historic bakeries, artisan coffee roasters, and Himalayan craft boutiques.",
                    "address": "Rajpur Road, Dehradun",
                    "latitude": 30.3500,
                    "longitude": 78.0550,
                    "price_level": "₹₹",
                    "approx_cost": 350.0,
                    "rating": 4.7,
                    "review_count": 1600,
                    "opening_time": "08:30",
                    "closing_time": "22:00",
                    "tags": "Café Culture,Artisan Bakery,Coffee,Doon Valley",
                    "image_url": "/images/places/universal/cafe.webp",
                    "why_vanvas_recommends": "Famous for stick jaws, plum cakes, and relaxed mountain coffee.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": True
                }
            ],
            "chandigarh": [
                {
                    "name": "Nek Chand's Rock Garden",
                    "slug": "rock-garden-chandigarh",
                    "category": "Culture & Heritage",
                    "description": "Visionary 40-acre sculpture garden crafted entirely from industrial waste, discarded ceramic tiles, glass bangles, and broken pots.",
                    "address": "Sector 1, Chandigarh 160001",
                    "latitude": 30.7525,
                    "longitude": 76.8073,
                    "price_level": "₹",
                    "approx_cost": 30.0,
                    "rating": 4.8,
                    "review_count": 4900,
                    "opening_time": "09:00",
                    "closing_time": "19:00",
                    "tags": "Eco Art,Sculpture,UNESCO Landmark,Folk Art",
                    "image_url": "/images/destinations/chandigarh/hero.jpg",
                    "why_vanvas_recommends": "World-famous masterpiece of visionary recycled art.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                },
                {
                    "name": "Sukhna Lake Promenade",
                    "slug": "sukhna-lake-chandigarh",
                    "category": "Nature & Trails",
                    "description": "3 km pristine reservoir at the foothills of the Shivalik range, popular for morning jogs, rowing boats, and tranquil sunset reflections.",
                    "address": "Sector 1, Chandigarh",
                    "latitude": 30.7421,
                    "longitude": 76.8188,
                    "price_level": "Free",
                    "approx_cost": 0.0,
                    "rating": 4.7,
                    "review_count": 3800,
                    "opening_time": "05:00",
                    "closing_time": "21:00",
                    "tags": "Lakeside,Shivalik View,Boating,Morning Walk",
                    "image_url": "/images/places/universal/lake.webp",
                    "why_vanvas_recommends": "Unbeatable dawn and sunset vistas with the Shivalik hills reflecting on still waters.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                }
            ],
            "morni-hills": [
                {
                    "name": "Tikkar Taal Sacred Twin Lakes",
                    "slug": "tikkar-taal-lakes",
                    "category": "Nature & Trails",
                    "description": "Twin natural hill lakes separated by a gentle hillock in the Shivalik range, surrounded by dense pine forests and boating docks.",
                    "address": "Tikkar Taal, Morni Hills, Panchkula District, Haryana 134205",
                    "latitude": 30.6908,
                    "longitude": 77.0869,
                    "price_level": "Free",
                    "approx_cost": 50.0,
                    "rating": 4.6,
                    "review_count": 1200,
                    "opening_time": "06:00",
                    "closing_time": "18:30",
                    "tags": "Twin Lakes,Pine Woods,Boating,Quiet Hill Road",
                    "image_url": "/images/destinations/morni-hills/hero.jpg",
                    "why_vanvas_recommends": "Serene pine-scented breeze and calm water away from city crowds.",
                    "is_must_visit": True,
                    "is_hidden_gem": True,
                    "is_indoor": False
                }
            ],
            "lansdowne": [
                {
                    "name": "Tip-in-Top (Tiffin Top) Ridge Walk",
                    "slug": "tip-in-top-lansdowne",
                    "category": "Nature & Trails",
                    "description": "Elevated ridge viewpoint at 1,700m offering breathtaking panoramic views of the Chaukhamba and Trishul Himalayan snow peaks.",
                    "address": "Tip-in-Top, Lansdowne, Pauri Garhwal, Uttarakhand 246155",
                    "latitude": 29.8377,
                    "longitude": 78.6872,
                    "price_level": "₹",
                    "approx_cost": 20.0,
                    "rating": 4.8,
                    "review_count": 1900,
                    "opening_time": "06:00",
                    "closing_time": "18:00",
                    "tags": "Snow Peaks,Pine Ridge,Chaukhamba View,Cantonment",
                    "image_url": "/images/destinations/lansdowne/hero.jpg",
                    "why_vanvas_recommends": "Unobstructed views of the Garhwal Himalayan snow range across deep pine valleys.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                },
                {
                    "name": "Bhulla Tal Lake & Pine Garden",
                    "slug": "bhulla-tal-lansdowne",
                    "category": "Nature & Trails",
                    "description": "Pristine man-made lake maintained by the Garhwal Rifles regiment with paddle boats, wooden bridges, and rabbit enclosures.",
                    "address": "Bhulla Tal, Lansdowne, Uttarakhand",
                    "latitude": 29.8420,
                    "longitude": 78.6820,
                    "price_level": "₹",
                    "approx_cost": 50.0,
                    "rating": 4.6,
                    "review_count": 1400,
                    "opening_time": "08:00",
                    "closing_time": "17:30",
                    "tags": "Lake,Paddle Boat,Pine Forest,Peaceful",
                    "image_url": "/images/places/universal/lake.webp",
                    "why_vanvas_recommends": "Spotless and tranquil army-managed lake nestled under tall pine trees.",
                    "is_must_visit": True,
                    "is_hidden_gem": False,
                    "is_indoor": False
                }
            ]
        }

        # Seed places
        for dest_slug, places_list in rich_places.items():
            dest_obj = dest_objects.get(dest_slug)
            if not dest_obj:
                continue
            for p_info in places_list:
                existing_p = db.query(Place).filter(Place.slug == p_info["slug"], Place.destination_id == dest_obj.id).first()
                if not existing_p:
                    cat_obj = categories.get(p_info.get("category", "").lower().replace(" & ", "-").replace(" ", "-"), None)
                    new_place = Place(
                        destination_id=dest_obj.id,
                        category_id=cat_obj.id if cat_obj else None,
                        category=p_info.get("category", "Attraction"),
                        name=p_info["name"],
                        slug=p_info["slug"],
                        description=p_info["description"],
                        address=p_info.get("address"),
                        latitude=p_info["latitude"],
                        longitude=p_info["longitude"],
                        price_level=p_info.get("price_level", "₹₹"),
                        approx_cost=p_info.get("approx_cost", 0.0),
                        rating=p_info.get("rating", 4.5),
                        review_count=p_info.get("review_count", 100),
                        opening_time=p_info.get("opening_time", "08:00"),
                        closing_time=p_info.get("closing_time", "20:00"),
                        tags=p_info.get("tags", ""),
                        image_url=p_info.get("image_url"),
                        why_vanvas_recommends=p_info.get("why_vanvas_recommends"),
                        is_must_visit=p_info.get("is_must_visit", False),
                        is_hidden_gem=p_info.get("is_hidden_gem", False),
                        is_indoor=p_info.get("is_indoor", False),
                        is_active=True
                    )
                    db.add(new_place)
                    print(f"  + Added place: {new_place.name} for {dest_slug}")

        # Seed Weather Snapshots for next 5 days for each destination
        today = date.today()
        for slug, dest in dest_objects.items():
            for i in range(5):
                f_date = today + timedelta(days=i)
                w_exist = db.query(WeatherSnapshot).filter(
                    WeatherSnapshot.destination_id == dest.id,
                    WeatherSnapshot.forecast_date == f_date
                ).first()
                if not w_exist:
                    w = WeatherSnapshot(
                        destination_id=dest.id,
                        forecast_date=f_date,
                        temp_c=22.0 - (dest.altitude_meters or 300) / 300.0,
                        condition=dest.weather_type or "Pleasant",
                        is_rain=False,
                        is_snow=False,
                        humidity=55,
                        wind_kph=7.5,
                        advisory=f"Ideal travel and sightseeing conditions in {dest.name}.",
                        icon="cloud-sun"
                    )
                    db.add(w)

        db.commit()
        print("Database successfully seeded with all 25 canonical destinations and rich places!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_all_canonical()
