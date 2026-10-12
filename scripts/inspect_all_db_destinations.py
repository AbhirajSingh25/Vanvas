import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

for p in [ROOT / "vanvas.db", ROOT / "backend" / "vanvas.db"]:
    if not p.exists():
        continue
    c = sqlite3.connect(p).cursor()
    all_dests = c.execute("SELECT id, name, slug, hero_image, hero_artwork, hero_photo FROM destinations").fetchall()
    print(f"\nDB: {p.relative_to(ROOT)}, total destinations: {len(all_dests)}")
    
    canonical_slugs = {
        "goa", "jaipur", "udaipur", "varanasi", "mussoorie", "rishikesh", "manali",
        "dharamshala", "kasol", "leh", "spiti", "jaisalmer", "munnar", "dehradun",
        "tungnath-chandrashila", "kainchi-dham", "agra", "mathura-vrindavan",
        "neemrana", "damdama-sohna", "alwar-siliserh", "sariska-bhangarh",
        "chandigarh", "morni-hills", "lansdowne", "murthal"
    }
    
    canon_found = 0
    external_found = []
    null_hero = []
    dynamic_dests = []
    
    for r in all_dests:
        did, name, slug, hero_img, hero_art, hero_photo = r
        if slug in canonical_slugs:
            canon_found += 1
        else:
            dynamic_dests.append(r)
        if any("unsplash" in str(x) or "http" in str(x) for x in [hero_img, hero_art, hero_photo]):
            external_found.append(r)
        if hero_img is None:
            null_hero.append(r)
            
    print(f"  Canonical destinations present: {canon_found}/26")
    print(f"  External (Unsplash/http) images: {len(external_found)}")
    for x in external_found:
        print(f"    - {x[0]} ({x[2]}): {x[3]}")
    print(f"  NULL hero_image: {len(null_hero)}")
    print(f"  Dynamic destinations: {len(dynamic_dests)}")
    if dynamic_dests:
        print(f"    Sample dynamic: {dynamic_dests[0]}")
