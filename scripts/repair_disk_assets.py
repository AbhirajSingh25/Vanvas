import shutil
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
FRONTEND = ROOT / "frontend"
PUBLIC = FRONTEND / "public"

def repair_assets():
    print("=== REPAIRING DISK ARTWORK ASSETS ===")
    
    # 1. Artworks folder copies from verified destination editorial illustrations
    copies = [
        (PUBLIC / "images/destinations/varanasi/illustration.jpg", PUBLIC / "artworks/varanasi.jpg"),
        (PUBLIC / "images/destinations/leh/illustration.jpg", PUBLIC / "artworks/leh.jpg"),
        (PUBLIC / "images/destinations/spiti/hero.jpg", PUBLIC / "artworks/spiti.jpg"),
        (PUBLIC / "images/destinations/jaisalmer/illustration.jpg", PUBLIC / "artworks/jaisalmer.jpg"),
        (PUBLIC / "images/destinations/munnar/hero.jpg", PUBLIC / "artworks/munnar.jpg"),
        (PUBLIC / "images/destinations/tungnath-chandrashila/illustration.jpg", PUBLIC / "artworks/tungnath-chandrashila.jpg"),
    ]
    
    for src, dst in copies:
        if src.exists() and not dst.exists():
            shutil.copy2(src, dst)
            print(f"Copied {src.name} -> {dst.relative_to(PUBLIC)}")
        elif dst.exists():
            print(f"Already exists: {dst.relative_to(PUBLIC)}")
        else:
            print(f"WARNING: Source missing: {src}")

    # Also create webp versions of these in artworks if needed
    artworks_dir = PUBLIC / "artworks"
    for slug in ["varanasi", "leh", "spiti", "jaisalmer", "munnar", "tungnath-chandrashila", "dharamshala", "goa", "kasol", "manali", "mussoorie", "rishikesh", "udaipur"]:
        jpg_p = artworks_dir / f"{slug}.jpg"
        webp_p = artworks_dir / f"{slug}.webp"
        if jpg_p.exists() and not webp_p.exists():
            try:
                with Image.open(jpg_p) as img:
                    img.save(webp_p, "WEBP", quality=90)
                print(f"Created {webp_p.relative_to(PUBLIC)}")
            except Exception as e:
                print(f"Failed webp for {jpg_p}: {e}")

    # 2. Destination webp illustrations for audit compatibility
    dest_dir = PUBLIC / "images/destinations"
    for slug in ["dharamshala", "goa", "kasol", "leh", "manali", "munnar", "mussoorie", "rishikesh", "spiti", "udaipur", "varanasi"]:
        d = dest_dir / slug
        if not d.exists():
            continue
        jpg_art = d / "illustration.jpg"
        if not jpg_art.exists():
            jpg_art = d / "hero.jpg"
        webp_art = d / "illustration.webp"
        if jpg_art.exists() and not webp_art.exists():
            try:
                with Image.open(jpg_art) as img:
                    img.save(webp_art, "WEBP", quality=90)
                print(f"Created {webp_art.relative_to(PUBLIC)}")
            except Exception as e:
                print(f"Failed to create {webp_art}: {e}")

    # 3. Universal trail and adventure fallbacks
    univ = PUBLIC / "images/places/universal"
    nature_webp = univ / "nature.webp"
    trail_webp = univ / "trail.webp"
    adventure_webp = univ / "adventure.webp"
    
    if nature_webp.exists() and not trail_webp.exists():
        shutil.copy2(nature_webp, trail_webp)
        print(f"Created {trail_webp.relative_to(PUBLIC)} from nature.webp")
        
    if nature_webp.exists() and not adventure_webp.exists():
        shutil.copy2(nature_webp, adventure_webp)
        print(f"Created {adventure_webp.relative_to(PUBLIC)} from nature.webp")

    # Also universal trail.jpg / adventure.jpg
    nature_jpg = univ / "nature.jpg"
    trail_jpg = univ / "trail.jpg"
    adventure_jpg = univ / "adventure.jpg"
    if nature_jpg.exists() and not trail_jpg.exists():
        shutil.copy2(nature_jpg, trail_jpg)
    if nature_jpg.exists() and not adventure_jpg.exists():
        shutil.copy2(nature_jpg, adventure_jpg)

    print("Disk asset repair complete.")

if __name__ == "__main__":
    repair_assets()
