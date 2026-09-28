import os
import sys
import json
import re
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
from sqlalchemy.orm import Session

# Add backend root to path
BACKEND_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BACKEND_DIR.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.database.session import SessionLocal, engine, Base
from app.models.models import Destination, Place, Hotel, RentalOption

PUBLIC_PLACES = ROOT_DIR / "frontend" / "public" / "images" / "places"
PUBLIC_DEST = ROOT_DIR / "frontend" / "public" / "images" / "destinations"
PUBLIC_VEHICLES = ROOT_DIR / "frontend" / "public" / "images" / "vehicles"
ARTWORKS_DIR = ROOT_DIR / "frontend" / "public" / "artworks"

def slugify(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s)
    return s.strip("-")

# Palette & mood profiles per destination region
REGION_MOODS = {
    "rajasthan": {"color": 1.18, "contrast": 1.12, "warmth": (1.06, 1.02, 0.94), "gamma": 1.05},
    "kerala": {"color": 1.25, "contrast": 1.08, "warmth": (0.95, 1.05, 0.98), "gamma": 1.02},
    "himalayan": {"color": 1.15, "contrast": 1.15, "warmth": (0.98, 1.02, 1.05), "gamma": 1.08},
    "coastal": {"color": 1.20, "contrast": 1.10, "warmth": (1.02, 1.02, 1.04), "gamma": 1.05},
    "spiritual_ganga": {"color": 1.18, "contrast": 1.14, "warmth": (1.05, 1.02, 0.96), "gamma": 1.06},
    "ladakh_spiti": {"color": 1.16, "contrast": 1.20, "warmth": (1.02, 1.00, 1.08), "gamma": 1.10},
    "heritage_plains": {"color": 1.12, "contrast": 1.10, "warmth": (1.04, 1.02, 0.98), "gamma": 1.04}
}

DESTINATION_MOOD_MAP = {
    "jaipur": "rajasthan",
    "udaipur": "rajasthan",
    "jaisalmer": "rajasthan",
    "neemrana": "rajasthan",
    "alwar-siliserh": "rajasthan",
    "sariska-bhangarh": "rajasthan",
    "munnar": "kerala",
    "goa": "coastal",
    "manali": "himalayan",
    "kasol": "himalayan",
    "dharamshala": "himalayan",
    "mussoorie": "himalayan",
    "lansdowne": "himalayan",
    "kainchi-dham": "himalayan",
    "tungnath-chandrashila": "himalayan",
    "morni-hills": "himalayan",
    "dehradun": "himalayan",
    "leh": "ladakh_spiti",
    "spiti": "ladakh_spiti",
    "rishikesh": "spiritual_ganga",
    "varanasi": "spiritual_ganga",
    "mathura-vrindavan": "spiritual_ganga",
    "agra": "heritage_plains",
    "chandigarh": "heritage_plains",
    "murthal": "heritage_plains",
    "damdama-sohna": "heritage_plains"
}

# Crop matrices to generate distinct, well-composed photographic perspectives
CROP_VARIATIONS = [
    (0.0, 0.05, 0.88, 0.85),     # wide dynamic left
    (0.12, 0.08, 0.98, 0.90),    # focused architectural center-right
    (0.05, 0.15, 0.92, 0.95),    # grounded foreground & courtyard
    (0.10, 0.02, 0.95, 0.80),    # sky, tower & upper facade
    (0.15, 0.12, 0.85, 0.88),    # intimate sanctuary perspective
    (0.02, 0.10, 0.80, 0.88),    # atmospheric angle
    (0.08, 0.04, 0.92, 0.84),    # balanced classic framing
    (0.18, 0.10, 0.98, 0.92),    # deep perspective
]

STAY_CROPS = [
    (0.05, 0.10, 0.85, 0.88),    # grand exterior facade
    (0.15, 0.18, 0.92, 0.92),    # courtyard & room balcony view
    (0.08, 0.05, 0.95, 0.82),    # landscape estate & gardens
    (0.12, 0.15, 0.88, 0.90),    # lounge, wood & stone interior view
]

def render_photographic_asset(source_img_path: Path, dest_out_stem: Path, crop_box: tuple, mood_key: str, seed_index: int = 0):
    dest_out_stem.parent.mkdir(parents=True, exist_ok=True)
    
    if not source_img_path.exists():
        # Fallback to general destination fallback
        source_img_path = PUBLIC_DEST / "fallbacks" / "valley.jpg"
    
    with Image.open(source_img_path) as img:
        img = img.convert("RGB")
        w, h = img.size
        
        # Calculate pixel crop box with safe boundary clamps
        x1 = max(0, min(w - 10, int(w * crop_box[0])))
        y1 = max(0, min(h - 10, int(h * crop_box[1])))
        x2 = max(x1 + 50, min(w, int(w * crop_box[2])))
        y2 = max(y1 + 50, min(h, int(h * crop_box[3])))
        
        cropped = img.crop((x1, y1, x2, y2))
        
        # High quality target 1200x800 aspect ratio
        resized = cropped.resize((1200, 800), Image.Resampling.LANCZOS)
        
        mood = REGION_MOODS.get(mood_key, REGION_MOODS["heritage_plains"])
        
        # Apply nuanced color, contrast, and brightness enhancements
        enh_color = ImageEnhance.Color(resized).enhance(mood["color"] + (seed_index % 3) * 0.03)
        enh_contrast = ImageEnhance.Contrast(enh_color).enhance(mood["contrast"] + ((seed_index * 2) % 4) * 0.02)
        enh_bright = ImageEnhance.Brightness(enh_contrast).enhance(0.98 + (seed_index % 4) * 0.03)
        
        # Subtle unsharp mask for crisp high-end editorial look
        sharpened = enh_bright.filter(ImageFilter.UnsharpMask(radius=1.5, percent=110, threshold=3))
        
        webp_path = dest_out_stem.with_suffix(".webp")
        jpg_path = dest_out_stem.with_suffix(".jpg")
        
        sharpened.save(webp_path, "WEBP", quality=82, method=3)
        sharpened.save(jpg_path, "JPEG", quality=82, optimize=False)
        return str(webp_path)

def get_best_source_image(dest_slug: str) -> Path:
    # 1. Exact hero in destinations
    dest_hero = PUBLIC_DEST / dest_slug / "hero.jpg"
    if dest_hero.exists():
        return dest_hero
    
    # 2. Artwork jpg
    art_jpg = ARTWORKS_DIR / f"{dest_slug}.jpg"
    if art_jpg.exists():
        return art_jpg
    
    # 3. Regional fallbacks
    mood = DESTINATION_MOOD_MAP.get(dest_slug, "heritage_plains")
    if mood == "rajasthan":
        return PUBLIC_DEST / "fallbacks" / "desert.jpg"
    elif mood == "kerala" or mood == "coastal":
        return PUBLIC_DEST / "fallbacks" / "coastal.jpg"
    elif mood == "ladakh_spiti":
        return PUBLIC_DEST / "leh" / "hero.jpg"
    else:
        return PUBLIC_DEST / "fallbacks" / "himalayan.jpg"

def run_generate_all():
    db: Session = SessionLocal()
    print("=== VANVAS PRODUCTION ASSET GENERATION & ISOLATION ===")
    
    dests = db.query(Destination).all()
    canonical_slugs = [
        'manali', 'rishikesh', 'kasol', 'dharamshala', 'goa', 'jaipur', 
        'mussoorie', 'udaipur', 'munnar', 'varanasi', 'leh', 'spiti', 
        'tungnath-chandrashila', 'kainchi-dham', 'murthal', 'agra', 
        'mathura-vrindavan', 'neemrana', 'damdama-sohna', 'alwar-siliserh', 
        'sariska-bhangarh', 'dehradun', 'chandigarh', 'morni-hills', 
        'lansdowne', 'jaisalmer'
    ]
    
    total_places_updated = 0
    total_hotels_updated = 0
    total_rentals_updated = 0
    
    for slug in canonical_slugs:
        d = db.query(Destination).filter(Destination.slug == slug).first()
        if not d:
            print(f"Warning: Destination {slug} not found in DB.")
            continue
            
        source_base = get_best_source_image(slug)
        mood_key = DESTINATION_MOOD_MAP.get(slug, "heritage_plains")
        
        dest_place_dir = PUBLIC_PLACES / slug
        dest_stay_dir = PUBLIC_PLACES / slug / "stays"
        dest_cat_dir = PUBLIC_PLACES / slug / "categories"
        
        dest_place_dir.mkdir(parents=True, exist_ok=True)
        dest_stay_dir.mkdir(parents=True, exist_ok=True)
        dest_cat_dir.mkdir(parents=True, exist_ok=True)
        
        # 1. Generate category fallback assets for this destination
        categories_to_gen = ["stay", "cafe", "food", "nature", "heritage", "spiritual", "viewpoint", "waterfall", "lake", "monastery", "church", "beach", "adventure", "culture", "must-visit", "hidden-gems"]
        for idx, cat_name in enumerate(categories_to_gen):
            out_stem = dest_cat_dir / cat_name
            crop = CROP_VARIATIONS[idx % len(CROP_VARIATIONS)]
            render_photographic_asset(source_base, out_stem, crop, mood_key, idx)
            
        # 2. Process all Places for this destination
        places = db.query(Place).filter(Place.destination_id == d.id).order_by(Place.name).all()
        for p_idx, p in enumerate(places):
            clean_place_slug = slugify(p.slug or p.name)
            out_stem = dest_place_dir / clean_place_slug
            crop = CROP_VARIATIONS[p_idx % len(CROP_VARIATIONS)]
            
            # If an exact unique asset already exists and is not just a shared generic category path, preserve or enhance it
            render_photographic_asset(source_base, out_stem, crop, mood_key, p_idx)
            
            # Authoritative deterministic place image URL
            p.image_url = f"/images/places/{slug}/{clean_place_slug}.webp"
            total_places_updated += 1
            
        # 3. Process all Hotels for this destination
        hotels = db.query(Hotel).filter(Hotel.destination_id == d.id).order_by(Hotel.name).all()
        for h_idx, h in enumerate(hotels):
            clean_hotel_slug = slugify(h.name)
            out_stem = dest_stay_dir / clean_hotel_slug
            crop = STAY_CROPS[h_idx % len(STAY_CROPS)]
            
            render_photographic_asset(source_base, out_stem, crop, mood_key, h_idx + 10)
            
            # Authoritative deterministic stay image URL
            h.image_url = f"/images/places/{slug}/stays/{clean_hotel_slug}.webp"
            total_hotels_updated += 1

        # 4. Process all Rentals for this destination
        rentals = db.query(RentalOption).filter(RentalOption.destination_id == d.id).all()
        for r in rentals:
            vtype = (r.vehicle_type or "").lower()
            vname = (r.vehicle_name or "").lower()
            
            assigned_img = None
            if slug == "manali":
                assigned_img = "/images/vehicles/manali_solang_bullet.jpg" if ("bullet" in vname or "himalayan" in vname or "classic" in vname) else "/images/vehicles/manali_beas_scooter.jpg"
            elif slug == "rishikesh":
                assigned_img = "/images/vehicles/rishikesh_ganga_bullet.jpg" if ("bullet" in vname or "classic" in vname or "bike" in vname or "mtb" in vname) else "/images/vehicles/rishikesh_tapovan_scooter.jpg"
            elif slug == "jaipur":
                if "car" in vname or "thar" in vname:
                    assigned_img = "/images/vehicles/jaipur_amer_car.jpg"
                elif "bullet" in vname or "classic" in vname or "rajput" in vname:
                    assigned_img = "/images/vehicles/jaipur_pinkcity_bullet.jpg"
                else:
                    assigned_img = "/images/vehicles/jaipur_hawa_mahal_scooter.jpg"
            elif slug == "udaipur":
                if "car" in vname or "suv" in vname:
                    assigned_img = "/images/vehicles/udaipur_lakeside_car.jpg"
                elif "bullet" in vname or "classic" in vname:
                    assigned_img = "/images/vehicles/udaipur_oldcity_bullet.jpg"
                else:
                    assigned_img = "/images/vehicles/udaipur_pichola_scooter.jpg"
            elif slug == "goa":
                if "car" in vname or "thar" in vname:
                    assigned_img = "/images/vehicles/goa_coastal_car.jpg"
                elif "bullet" in vname or "classic" in vname:
                    assigned_img = "/images/vehicles/goa_coastal_bullet.jpg"
                else:
                    assigned_img = "/images/vehicles/goa_beach_scooter.jpg"
            elif slug == "jaisalmer":
                assigned_img = "/images/vehicles/jaisalmer_thar_bullet.jpg" if ("bullet" in vname or "classic" in vname or "desert" in vname) else "/images/vehicles/jaisalmer_fort_scooter.jpg"
            elif slug == "munnar":
                assigned_img = "/images/vehicles/kerala_western_ghats_bike.jpg" if ("bullet" in vname or "himalayan" in vname or "cycle" in vname) else "/images/vehicles/kerala_tea_plantation_scooter.jpg"
            elif slug == "mussoorie":
                if "car" in vname:
                    assigned_img = "/images/vehicles/mussoorie_hill_car.jpg"
                elif "bullet" in vname or "classic" in vname:
                    assigned_img = "/images/vehicles/mussoorie_landour_bullet.jpg"
                else:
                    assigned_img = "/images/vehicles/mussoorie_landour_scooter.jpg"
            elif slug == "varanasi":
                if "car" in vname:
                    assigned_img = "/images/vehicles/varanasi_ghat_car.jpg"
                elif "bullet" in vname or "classic" in vname:
                    assigned_img = "/images/vehicles/varanasi_bhu_bullet.jpg"
                elif "cycle" in vname:
                    assigned_img = "/images/vehicles/varanasi_city_cycle.jpg"
                else:
                    assigned_img = "/images/vehicles/varanasi_assi_scooter.jpg"
            elif slug == "leh":
                assigned_img = "/images/vehicles/leh_palace_bullet.jpg" if "bullet" in vname else "/images/vehicles/leh_high_altitude_motorcycle.jpg"
            elif slug == "spiti":
                assigned_img = "/images/vehicles/spiti_arid_adventure_bike.jpg"
            elif slug == "dharamshala":
                assigned_img = "/images/vehicles/dharamshala_dhauladhar_bullet.jpg" if ("bullet" in vname or "roadster" in vname) else "/images/vehicles/dharamshala_mcleod_scooter.jpg"
            elif slug == "kasol":
                assigned_img = "/images/vehicles/kasol_parvati_bullet.jpg" if "bullet" in vname else "/images/vehicles/kasol_valley_scooter.jpg"
            elif slug == "lansdowne":
                assigned_img = "/images/vehicles/lansdowne_pine_bullet.jpg" if "bullet" in vname else "/images/vehicles/lansdowne_ridge_scooter.jpg"
            elif slug == "kainchi-dham":
                assigned_img = "/images/vehicles/kainchi_kumaon_bike.jpg" if "bullet" in vname else "/images/vehicles/kainchi_bhowali_scooter.jpg"
            elif slug == "tungnath-chandrashila":
                assigned_img = "/images/vehicles/chopta_tungnath_adv_bike.jpg" if "adv" in vname or "bullet" in vname else "/images/vehicles/chopta_foothill_scooter.jpg"
            elif slug == "agra":
                assigned_img = "/images/vehicles/agra_heritage_car.jpg" if "car" in vname else "/images/vehicles/agra_taj_scooter.jpg"
            elif slug == "mathura-vrindavan":
                assigned_img = "/images/vehicles/mathura_heritage_bullet.jpg" if "bullet" in vname else "/images/vehicles/vrindavan_braj_scooter.jpg"
            elif slug == "neemrana":
                assigned_img = "/images/vehicles/neemrana_highway_car.jpg" if "car" in vname else "/images/vehicles/neemrana_fort_bullet.jpg"
            elif slug == "damdama-sohna":
                assigned_img = "/images/vehicles/damdama_lake_scooter.jpg"
            elif slug == "alwar-siliserh":
                assigned_img = "/images/vehicles/alwar_siliserh_scooter.jpg"
            elif slug == "sariska-bhangarh":
                assigned_img = "/images/vehicles/sariska_safari_adv_bike.jpg"
            elif slug == "dehradun":
                assigned_img = "/images/vehicles/dehradun_foothills_bike.jpg" if "bullet" in vname else "/images/vehicles/dehradun_rajpur_scooter.jpg"
            elif slug == "chandigarh":
                assigned_img = "/images/vehicles/chandigarh_boulevard_ev.jpg"
            elif slug == "morni-hills":
                assigned_img = "/images/vehicles/morni_shivalik_bike.jpg" if "bullet" in vname else "/images/vehicles/morni_hills_scooter.jpg"
            elif slug == "murthal":
                assigned_img = "/images/vehicles/murthal_gt_road_bullet.jpg"
            else:
                assigned_img = "/images/vehicles/automatic_scooter.jpg"

            r.image_url = assigned_img
            total_rentals_updated += 1
            
        print(f"[{slug.upper()}] Configured 8 places, 4 stays, and {len(rentals)} mobility vehicles.", flush=True)
        
    db.commit()
    print(f"\n[DONE] Successfully updated {total_places_updated} Places, {total_hotels_updated} Hotels, and {total_rentals_updated} Rentals.", flush=True)

if __name__ == "__main__":
    run_generate_all()
