import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "frontend" / "public"

for db_p in [ROOT / "vanvas.db", ROOT / "backend" / "vanvas.db"]:
    if not db_p.exists():
        print(f"Skipping {db_p} (not found)")
        continue
    print(f"\n=======================================================")
    print(f"AUDITING DATABASE: {db_p.relative_to(ROOT)} (size: {db_p.stat().st_size} bytes)")
    print(f"=======================================================")
    conn = sqlite3.connect(db_p)
    c = conn.cursor()
    
    # 1. Destinations
    rows = c.execute("SELECT id, name, slug, hero_image, hero_artwork, hero_photo FROM destinations").fetchall()
    print(f"Total destinations: {len(rows)}")
    for r in rows:
        dest_id, name, slug, hero_img, hero_art, hero_photo = r
        img_ok = hero_img.startswith("http") or (PUBLIC / hero_img.lstrip("/")).exists() if hero_img else False
        art_ok = hero_art.startswith("http") or (PUBLIC / hero_art.lstrip("/")).exists() if hero_art else False
        is_external = any("unsplash" in str(x) or "http" in str(x) for x in [hero_img, hero_art, hero_photo])
        if not (img_ok and art_ok) or is_external:
            print(f"  [FLAG] {dest_id} ({slug}): hero_img={hero_img} (ok={img_ok}), hero_art={hero_art} (ok={art_ok}) external={is_external}")
            
    # 2. Check places, hotels, rental_options for missing or external paths
    for table, col in [("places", "image_url"), ("hotels", "image_url"), ("rental_options", "image_url")]:
        c.execute(f"SELECT COUNT(*) FROM {table}")
        tot = c.fetchone()[0]
        c.execute(f"SELECT id, {col} FROM {table}")
        bad_count = 0
        ext_count = 0
        for ent_id, url in c.fetchall():
            if not url:
                bad_count += 1
            elif url.startswith("http"):
                ext_count += 1
            elif not (PUBLIC / url.lstrip("/")).exists():
                bad_count += 1
        print(f"{table:15}: total={tot}, missing_or_broken={bad_count}, external={ext_count}")
        
    conn.close()
