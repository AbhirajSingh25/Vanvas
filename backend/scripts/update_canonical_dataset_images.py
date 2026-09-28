import re
import sys
import pprint
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BACKEND_DIR.parent
sys.path.insert(0, str(BACKEND_DIR))

import app.seed.canonical_dataset as ds

def slugify(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s)
    return s.strip("-")

# 1. Update Places
for dest_slug, places in ds.ADDITIONAL_PLACES_BY_DEST.items():
    for p in places:
        pslug = slugify(p.get("slug") or p.get("name", ""))
        p["image_url"] = f"/images/places/{dest_slug}/{pslug}.webp"

# 2. Update Hotels
for dest_slug, hotels in ds.ADDITIONAL_HOTELS_BY_DEST.items():
    for h in hotels:
        hslug = slugify(h.get("name", ""))
        h["image_url"] = f"/images/places/{dest_slug}/stays/{hslug}.webp"

# 3. Update Rentals
for dest_slug, rentals in ds.ADDITIONAL_RENTALS_BY_DEST.items():
    for r in rentals:
        vname = (r.get("vehicle_name") or "").lower()
        if dest_slug == "manali":
            assigned_img = "/images/vehicles/manali_solang_bullet.jpg" if ("bullet" in vname or "himalayan" in vname or "classic" in vname) else "/images/vehicles/manali_beas_scooter.jpg"
        elif dest_slug == "rishikesh":
            assigned_img = "/images/vehicles/rishikesh_ganga_bullet.jpg" if ("bullet" in vname or "classic" in vname or "bike" in vname or "mtb" in vname) else "/images/vehicles/rishikesh_tapovan_scooter.jpg"
        elif dest_slug == "jaipur":
            if "car" in vname or "thar" in vname:
                assigned_img = "/images/vehicles/jaipur_amer_car.jpg"
            elif "bullet" in vname or "classic" in vname or "rajput" in vname:
                assigned_img = "/images/vehicles/jaipur_pinkcity_bullet.jpg"
            else:
                assigned_img = "/images/vehicles/jaipur_hawa_mahal_scooter.jpg"
        elif dest_slug == "udaipur":
            if "car" in vname or "suv" in vname:
                assigned_img = "/images/vehicles/udaipur_lakeside_car.jpg"
            elif "bullet" in vname or "classic" in vname:
                assigned_img = "/images/vehicles/udaipur_oldcity_bullet.jpg"
            else:
                assigned_img = "/images/vehicles/udaipur_pichola_scooter.jpg"
        elif dest_slug == "goa":
            if "car" in vname or "thar" in vname:
                assigned_img = "/images/vehicles/goa_coastal_car.jpg"
            elif "bullet" in vname or "classic" in vname:
                assigned_img = "/images/vehicles/goa_coastal_bullet.jpg"
            else:
                assigned_img = "/images/vehicles/goa_beach_scooter.jpg"
        elif dest_slug == "jaisalmer":
            assigned_img = "/images/vehicles/jaisalmer_thar_bullet.jpg" if ("bullet" in vname or "classic" in vname or "desert" in vname) else "/images/vehicles/jaisalmer_fort_scooter.jpg"
        elif dest_slug == "agra":
            assigned_img = "/images/vehicles/agra_taj_scooter.jpg"
        elif dest_slug == "mussoorie":
            assigned_img = "/images/vehicles/mussoorie_landour_scooter.jpg"
        elif dest_slug == "varanasi":
            assigned_img = "/images/vehicles/varanasi_ghat_scooter.jpg"
        elif dest_slug == "dharamshala":
            assigned_img = "/images/vehicles/dharamshala_kangra_scooter.jpg"
        elif dest_slug == "kasol":
            assigned_img = "/images/vehicles/kasol_parvati_bullet.jpg"
        elif dest_slug == "leh":
            assigned_img = "/images/vehicles/leh_ladakh_bullet.jpg"
        elif dest_slug == "spiti":
            assigned_img = "/images/vehicles/spiti_bullet.jpg"
        elif dest_slug == "munnar":
            assigned_img = "/images/vehicles/munnar_tea_scooter.jpg"
        elif dest_slug == "dehradun":
            assigned_img = "/images/vehicles/dehradun_scooter.jpg"
        elif dest_slug == "chandigarh":
            assigned_img = "/images/vehicles/chandigarh_bullet.jpg"
        else:
            assigned_img = f"/images/vehicles/{dest_slug}_scooter.jpg"
            if not (ROOT_DIR / "frontend" / "public" / assigned_img.lstrip("/")).exists():
                assigned_img = "/images/vehicles/manali_beas_scooter.jpg"
        r["image_url"] = assigned_img

# Write back to canonical_dataset.py
canonical_file = BACKEND_DIR / "app" / "seed" / "canonical_dataset.py"
dest_var = getattr(ds, "CANONICAL_26_DESTINATIONS", ds.CANONICAL_25_DESTINATIONS)
content = f'''"""
VANVAS Canonical Dataset for Seeding and Testing
Defines all 26 Curated Canonical Destinations, Verified Places, Hotels, and Rentals.
Self-contained, production-ready dataset.
"""

CANONICAL_25_DESTINATIONS = {pprint.pformat(ds.CANONICAL_25_DESTINATIONS, indent=4, width=120)}

CANONICAL_26_DESTINATIONS = {pprint.pformat(dest_var, indent=4, width=120)}

ADDITIONAL_PLACES_BY_DEST = {pprint.pformat(ds.ADDITIONAL_PLACES_BY_DEST, indent=4, width=120)}

ADDITIONAL_HOTELS_BY_DEST = {pprint.pformat(ds.ADDITIONAL_HOTELS_BY_DEST, indent=4, width=120)}

ADDITIONAL_RENTALS_BY_DEST = {pprint.pformat(ds.ADDITIONAL_RENTALS_BY_DEST, indent=4, width=120)}
'''

with open(canonical_file, "w", encoding="utf-8") as f:
    f.write(content)

print("[SUCCESS] Updated canonical_dataset.py with unique place, hotel, and rental image paths.")
