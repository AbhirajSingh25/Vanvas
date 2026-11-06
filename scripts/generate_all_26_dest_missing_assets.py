"""
Generate dedicated WebP illustrations for all places in ADDITIONAL_PLACES_BY_DEST
that currently share image URLs, eliminating all collisions across all 26 destinations.
Adheres strictly to VANVAS_ART_BIBLE.md.
"""
import os
import sys
import math
import hashlib
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.seed.canonical_dataset import ADDITIONAL_PLACES_BY_DEST

PUBLIC_PLACES = ROOT_DIR / "frontend" / "public" / "images" / "places"

# Palettes adhering to Vanvas Art Bible
PALETTES = {
    "spiritual": [(15, 41, 36), (180, 146, 82), (182, 94, 60), (250, 247, 240)],
    "heritage": [(23, 59, 50), (142, 109, 50), (148, 70, 39), (239, 229, 210)],
    "nature": [(46, 88, 76), (23, 59, 50), (216, 222, 213), (250, 247, 240)],
    "viewpoint": [(38, 58, 74), (28, 78, 80), (216, 222, 213), (250, 247, 240)],
    "lake": [(28, 78, 80), (38, 58, 74), (216, 222, 213), (250, 247, 240)],
    "waterfall": [(38, 58, 74), (46, 88, 76), (216, 222, 213), (250, 247, 240)],
    "food": [(148, 70, 39), (180, 146, 82), (239, 229, 210), (23, 59, 50)],
    "cafe": [(182, 94, 60), (180, 146, 82), (250, 247, 240), (15, 41, 36)],
    "shopping": [(180, 146, 82), (182, 94, 60), (23, 59, 50), (250, 247, 240)],
    "adventure": [(38, 58, 74), (182, 94, 60), (46, 88, 76), (250, 247, 240)],
    "monastery": [(148, 70, 39), (180, 146, 82), (23, 59, 50), (239, 229, 210)],
    "default": [(15, 41, 36), (46, 88, 76), (180, 146, 82), (250, 247, 240)],
}

def get_theme(category: str, name: str) -> str:
    c = (category or "").lower()
    n = (name or "").lower()
    if any(k in n for k in ["temple", "ashram", "mandir", "kund", "shrine", "kedar", "dham", "gurudwara"]):
        return "spiritual"
    if any(k in n for k in ["fort", "palace", "haveli", "museum", "tomb", "stepwell", "baori", "memorial", "cenotaph"]):
        return "heritage"
    if any(k in n for k in ["lake", "taal", "sarovar", "wetland", "reservoir"]):
        return "lake"
    if any(k in n for k in ["waterfall", "falls", "springs", "chasm"]):
        return "waterfall"
    if any(k in n for k in ["peak", "summit", "crest", "viewpoint", "ridge", "pass", "shila"]):
        return "viewpoint"
    if any(k in n for k in ["dhaba", "food", "sweets", "mithai", "restaurant", "dining", "paratha", "petha", "kalakand", "kachori", "milk"]):
        return "food"
    if any(k in n for k in ["cafe", "bakery", "coffee", "bistro"]):
        return "cafe"
    if any(k in n for k in ["market", "bazaar", "craft", "street", "gali"]):
        return "shopping"
    if any(k in n for k in ["park", "trail", "meadow", "bugyal", "forest", "glade", "sanctuary", "garden", "reserve"]):
        return "nature"
    if any(k in n for k in ["camp", "zipline", "adventure", "safari"]):
        return "adventure"
    return "nature"

def render_artwork(width: int, height: int, name: str, dest: str, theme: str) -> Image.Image:
    palette = PALETTES.get(theme, PALETTES["default"])
    c_primary, c_secondary, c_accent, c_bg = palette
    
    # Deterministic seed from name and dest
    h = int(hashlib.md5(f"{dest}:{name}".encode("utf-8")).hexdigest()[:8], 16)
    
    img = Image.new("RGB", (width, height), c_bg)
    draw = ImageDraw.Draw(img)
    
    # Sky / background gradient bands
    steps = 40
    for i in range(steps):
        t = i / float(steps)
        r = int(c_bg[0] * (1 - t) + c_accent[0] * t * 0.4 + c_primary[0] * t * 0.6)
        g = int(c_bg[1] * (1 - t) + c_accent[1] * t * 0.4 + c_primary[1] * t * 0.6)
        b = int(c_bg[2] * (1 - t) + c_accent[2] * t * 0.4 + c_primary[2] * t * 0.6)
        draw.rectangle([0, int(i * height / steps), width, int((i + 1) * height / steps)], fill=(r, g, b))
    
    # Sun / Moon disc
    disc_x = width * (0.2 + (h % 60) / 100.0)
    disc_y = height * (0.2 + ((h >> 6) % 30) / 100.0)
    disc_r = 70 + (h % 40)
    disc_color = (
        min(255, int(c_accent[0] * 1.1)),
        min(255, int(c_accent[1] * 1.1)),
        min(255, int(c_accent[2] * 1.1))
    )
    draw.ellipse([disc_x - disc_r, disc_y - disc_r, disc_x + disc_r, disc_y + disc_r], fill=disc_color)
    
    # Distant mountain silhouettes or architectural silhouette layers
    num_ridges = 3
    for r_idx in range(num_ridges):
        ridge_t = (r_idx + 1) / (num_ridges + 1)
        r_color = (
            int(c_secondary[0] * (1 - ridge_t) + c_primary[0] * ridge_t),
            int(c_secondary[1] * (1 - ridge_t) + c_primary[1] * ridge_t),
            int(c_secondary[2] * (1 - ridge_t) + c_primary[2] * ridge_t),
        )
        points = [(0, height)]
        base_y = height * (0.45 + r_idx * 0.15)
        num_pts = 16
        for p_idx in range(num_pts + 1):
            px = p_idx * width / num_pts
            freq = 0.005 + (r_idx * 0.003)
            phase = (h >> (r_idx * 4)) % 50
            py = base_y - math.sin(px * freq + phase) * (60 + r_idx * 35) - math.cos(px * 0.01 + phase) * 25
            points.append((px, py))
        points.append((width, height))
        draw.polygon(points, fill=r_color)
    
    # Foreground landmark / architectural / natural motif
    fg_color = c_primary
    if theme in ["spiritual", "monastery", "heritage"]:
        # Classical temple / fort / chhatri silhouette in foreground
        cx = width * 0.5
        cy = height * 0.72
        # Base terrace
        draw.polygon([(cx - 240, height), (cx + 240, height), (cx + 200, cy + 80), (cx - 200, cy + 80)], fill=fg_color)
        # Pillars / colonnade
        for col_i in range(-3, 4):
            col_x = cx + col_i * 45
            draw.rectangle([col_x - 8, cy + 10, col_x + 8, cy + 80], fill=fg_color)
        # Main dome / shikhara / turret
        shikhara_pts = [
            (cx - 90, cy + 10),
            (cx - 50, cy - 80),
            (cx, cy - 170),
            (cx + 50, cy - 80),
            (cx + 90, cy + 10)
        ]
        draw.polygon(shikhara_pts, fill=fg_color)
        # Kalasha / spire pinnacle
        draw.line([(cx, cy - 170), (cx, cy - 210)], fill=c_accent, width=4)
        draw.ellipse([cx - 8, cy - 220, cx + 8, cy - 204], fill=c_accent)
    elif theme in ["lake", "waterfall"]:
        # Water body reflections and pine banks
        water_y = height * 0.72
        draw.rectangle([0, water_y, width, height], fill=c_secondary)
        # Ripple lines
        for rip_i in range(12):
            ry = water_y + (rip_i + 1) * (height - water_y) / 14
            rx_start = width * (0.1 + ((h + rip_i * 17) % 30) / 100.0)
            rx_end = rx_start + width * (0.3 + ((h + rip_i * 23) % 40) / 100.0)
            draw.line([(rx_start, ry), (rx_end, ry)], fill=c_accent, width=2)
    elif theme in ["food", "cafe", "shopping"]:
        # Artisan bazaar awning / doorway silhouette
        bx = width * 0.5
        by = height * 0.7
        draw.rectangle([bx - 260, by, bx + 260, height], fill=fg_color)
        # Archway
        draw.ellipse([bx - 120, by - 60, bx + 120, by + 180], fill=c_secondary)
        draw.rectangle([bx - 120, by + 60, bx + 120, height], fill=c_secondary)
        # Lanterns
        for lan_x in [bx - 180, bx + 180]:
            draw.line([(lan_x, by - 40), (lan_x, by)], fill=c_accent, width=3)
            draw.ellipse([lan_x - 14, by, lan_x + 14, by + 28], fill=c_accent)
    else:
        # Alpine / forest pine silhouette grove
        for tree_i in range(9):
            tx = width * (0.1 + tree_i * 0.1) + ((h + tree_i * 13) % 40) - 20
            th = 160 + ((h + tree_i * 31) % 100)
            ty = height * 0.85
            # Pine layers
            for lyr in range(3):
                lyr_y = ty - th * (lyr / 3.0)
                w_half = 40 - lyr * 8
                draw.polygon([(tx - w_half, lyr_y), (tx, lyr_y - 45), (tx + w_half, lyr_y)], fill=fg_color)
            draw.rectangle([tx - 4, ty - 10, tx + 4, height], fill=fg_color)
            
    # Soft grain / subtle vignette filter
    img = img.filter(ImageFilter.SMOOTH_MORE)
    return img

def main():
    print("=== SYNTHESIZING DEDICATED ASSETS FOR ALL 26 DESTINATIONS ===")
    
    seen_images = {}
    places_to_update = []
    
    for dest_slug, places in ADDITIONAL_PLACES_BY_DEST.items():
        for p in places:
            img = p["image_url"]
            if img in seen_images:
                places_to_update.append((dest_slug, p, seen_images[img]))
            else:
                seen_images[img] = (dest_slug, p["name"])
                
    print(f"Found {len(places_to_update)} places that collide with existing images.")
    
    dest_dirs = set()
    replacements = {}
    
    for dest_slug, p, original_owner in places_to_update:
        dest_dir = PUBLIC_PLACES / dest_slug
        dest_dir.mkdir(parents=True, exist_ok=True)
        
        new_asset_name = f"{p['slug']}.webp"
        new_img_url = f"/images/places/{dest_slug}/{new_asset_name}"
        asset_path = dest_dir / new_asset_name
        
        theme = get_theme(p.get("category", ""), p["name"])
        img = render_artwork(1200, 800, p["name"], dest_slug, theme)
        img.save(str(asset_path), "WEBP", quality=88)
        
        replacements[(dest_slug, p["slug"])] = new_img_url
        p["image_url"] = new_img_url
        print(f"[GENERATED] {dest_slug}: {p['name']} -> {new_img_url}")
        
    print(f"\nGenerated {len(replacements)} dedicated assets.")
    
    # Now rewrite canonical_dataset.py with the updated image URLs
    canonical_file = BACKEND_DIR / "app" / "seed" / "canonical_dataset.py"
    with open(canonical_file, "r", encoding="utf-8") as f:
        content = f.read()
        
    for (dest_slug, p_slug), new_url in replacements.items():
        # Match "slug": "...", ..., "image_url": "..."
        # Replace the specific place's image_url
        pattern = rf'({re.escape(p_slug)}"[^}}]*?"image_url":\s*")[^"]+(")'
        content = re.sub(pattern, rf'\g<1>{new_url}\g<2>', content)
        
    with open(canonical_file, "w", encoding="utf-8") as f:
        f.write(content)
        
    print(f"Updated {canonical_file} with unique image URLs.")

if __name__ == "__main__":
    import re
    main()

