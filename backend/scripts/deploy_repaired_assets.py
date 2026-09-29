import os
import json
import hashlib
from pathlib import Path
from PIL import Image

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"
PUBLIC_DIR = FRONTEND_DIR / "public"
BRAIN_DIR = Path(r"C:\Users\user\.gemini\antigravity-ide\brain")

# Mapping of authentic generated files to target destinations
REPAIRS = [
    # 1. Manali Places
    ("9935f763-197b-430e-ba3d-c3fe27147ddd/hadimba_temple_test_1790679925601.jpg", "images/places/manali/hadimba-temple.webp"),
    ("9935f763-197b-430e-ba3d-c3fe27147ddd/jogini_waterfall_manali_1790680278031.jpg", "images/places/manali/jogini-waterfall.webp"),
    ("9935f763-197b-430e-ba3d-c3fe27147ddd/solang_valley_manali_1790680340848.jpg", "images/places/manali/solang-valley.webp"),
    ("9935f763-197b-430e-ba3d-c3fe27147ddd/vashisht_temple_manali_1790680407244.jpg", "images/places/manali/vashisht-springs.webp"),
    ("9935f763-197b-430e-ba3d-c3fe27147ddd/old_manali_manu_temple_1790680461969.jpg", "images/places/manali/old-manali-village.webp"),
    
    # 2. Manali Stays
    ("9935f763-197b-430e-ba3d-c3fe27147ddd/the_himalayan_castle_manali_1790680516336.jpg", "images/places/manali/stays/the-himalayan-castle-stone-cottages.webp"),
    ("9935f763-197b-430e-ba3d-c3fe27147ddd/larisa_resort_manali_1790680562512.jpg", "images/places/manali/stays/larisa-resort-apple-orchard.webp"),
    ("9935f763-197b-430e-ba3d-c3fe27147ddd/drifters_inn_manali_1790680621107.jpg", "images/places/manali/stays/drifters-inn-wooden-loft.webp"),
    ("9935f763-197b-430e-ba3d-c3fe27147ddd/zostel_manali_stay_1790680687784.jpg", "images/places/manali/stays/zostel-manali-old-manali.webp"),
    
    # 3. Manali Rentals
    ("9935f763-197b-430e-ba3d-c3fe27147ddd/manali_beas_activa_1790680772882.jpg", "images/vehicles/manali_beas_scooter.webp"),
    ("9935f763-197b-430e-ba3d-c3fe27147ddd/manali_solang_bullet_1790680850983.jpg", "images/vehicles/manali_solang_bullet.webp"),
    
    # 4. Munnar Stays & Rentals & Places
    ("9935f763-197b-430e-ba3d-c3fe27147ddd/windermere_munnar_test_1790680068920.jpg", "images/places/munnar/stays/windermere-estate.webp"),
    ("9935f763-197b-430e-ba3d-c3fe27147ddd/munnar_himalayan_test_1790679982225.jpg", "images/vehicles/kerala_western_ghats_bike.webp"),
    ("fe33de26-202e-4c5b-9ab5-8b5df48b52be/attukal_waterfalls_1790101311305.jpg", "images/places/munnar/attukad-waterfalls.webp"),
    ("fe33de26-202e-4c5b-9ab5-8b5df48b52be/eravikulam_national_park_1790101292404.jpg", "images/places/munnar/eravikulam-national-park.webp"),
    ("fe33de26-202e-4c5b-9ab5-8b5df48b52be/kolukkumalai_tea_estate_1790101226677.jpg", "images/places/munnar/tata-tea-museum.webp"),
    ("99de6974-f064-4207-8537-92e7c7bc3cf5/munnar_mattupetty_dam_1790005704791.jpg", "images/places/munnar/mattupetty-dam-lake.webp"),
    
    # 5. Dharamshala & Kasol & Varanasi & Jaipur & Tungnath Places & Stays
    ("99de6974-f064-4207-8537-92e7c7bc3cf5/dharamshala_triund_trek_1790005667915.jpg", "images/places/dharamshala/triund-trek-base.webp"),
    ("99de6974-f064-4207-8537-92e7c7bc3cf5/kasol_tosh_village_1790005466903.jpg", "images/places/kasol/tosh-village.webp"),
    ("99de6974-f064-4207-8537-92e7c7bc3cf5/kasol_evergreen_cafe_1790005503740.jpg", "images/places/kasol/evergreen-cafe.webp"),
    ("e3ba4f48-dc93-4e15-9ff3-fe520a5c8ca0/brijrama_palace_varanasi_1790165783584.jpg", "images/places/varanasi/stays/brijrama-palace-heritage-grand.webp"),
    ("e3ba4f48-dc93-4e15-9ff3-fe520a5c8ca0/nahargarh_fort_jaipur_1790165761592.jpg", "images/places/jaipur/nahargarh-fort-sunset.webp"),
    ("d0da514e-77f6-4399-9acd-d38d9ec069d0/tungnath_forest_trail_1790589887337.jpg", "images/places/tungnath-chandrashila/rohida-forest-trail.webp"),
    ("b0e6a200-96d9-4fbd-9057-c3a87cd6fa11/kainchi_dham_hero_1790265491286.jpg", "images/places/kainchi-dham/neem-karoli-baba-ashram.webp"),
]

repaired_count = 0
for src_rel, dst_rel in REPAIRS:
    src_full = BRAIN_DIR / src_rel
    if not src_full.exists():
        print(f"Warning: source file not found: {src_full}")
        continue
    dst_full = PUBLIC_DIR / dst_rel
    dst_full.parent.mkdir(parents=True, exist_ok=True)
    
    with Image.open(src_full) as im:
        im = im.convert("RGB")
        w, h = im.size
        # Trim white border if any
        if w > 1600 or h > 1000:
            im.thumbnail((1600, 1000), Image.Resampling.LANCZOS)
        im.save(dst_full, "WEBP", quality=90, method=6)
        
        # Also sync jpg if it exists
        jpg_p = dst_full.with_suffix(".jpg")
        if jpg_p.exists() and jpg_p != dst_full:
            im.save(jpg_p, "JPEG", quality=90)
            
    repaired_count += 1
    print(f"Repaired & Deployed: {dst_rel} ({dst_full.stat().st_size} bytes)")

print(f"\nSuccessfully deployed {repaired_count} repaired artworks.")

# Now update inventory & manifest hashes
import subprocess
subprocess.run(["python", str(BACKEND_DIR / "scripts" / "enumerate_authoritative_inventory.py")], check=True)
