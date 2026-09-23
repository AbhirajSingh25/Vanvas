import os
from pathlib import Path
from PIL import Image

def process_and_setup_artwork():
    base_dir = Path(r"C:\Users\user\Desktop\Vanvas")
    brain_dir = Path(r"C:\Users\user\.gemini\antigravity-ide\brain\e3ba4f48-dc93-4e15-9ff3-fe520a5c8ca0")
    public_img_dir = base_dir / "frontend" / "public" / "images"

    # Ensure target directories exist
    places_dir = public_img_dir / "places"
    nearby_dir = public_img_dir / "nearby"
    
    (places_dir / "jaipur").mkdir(parents=True, exist_ok=True)
    (places_dir / "varanasi" / "categories").mkdir(parents=True, exist_ok=True)
    (places_dir / "delhi").mkdir(parents=True, exist_ok=True)
    (places_dir / "amritsar").mkdir(parents=True, exist_ok=True)
    nearby_dir.mkdir(parents=True, exist_ok=True)

    def save_dual(src_path: Path, dest_base_path: Path):
        dest_base_path.parent.mkdir(parents=True, exist_ok=True)
        img = Image.open(src_path)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        
        webp_path = dest_base_path.with_suffix(".webp")
        jpg_path = dest_base_path.with_suffix(".jpg")
        
        img.save(webp_path, format="WEBP", quality=90)
        img.save(jpg_path, format="JPEG", quality=90)
        print(f"Saved: {webp_path.name} and {jpg_path.name} in {dest_base_path.parent}")

    # 1. Nahargarh Fort (Jaipur)
    nahargarh_src = list(brain_dir.glob("nahargarh_fort_jaipur_*.jpg"))[0]
    save_dual(nahargarh_src, places_dir / "jaipur" / "nahargarh-fort")

    # 2. BrijRama Palace (Varanasi Stay & Category Stay)
    brijrama_src = list(brain_dir.glob("brijrama_palace_varanasi_*.jpg"))[0]
    save_dual(brijrama_src, places_dir / "varanasi" / "brijrama-palace")
    save_dual(brijrama_src, places_dir / "varanasi" / "categories" / "stay")

    # 3. Delhi Landmarks
    qutub_src = list(brain_dir.glob("qutub_minar_delhi_*.jpg"))[0]
    save_dual(qutub_src, places_dir / "delhi" / "qutub-minar")

    india_gate_src = list(brain_dir.glob("india_gate_delhi_*.jpg"))[0]
    save_dual(india_gate_src, places_dir / "delhi" / "india-gate")

    red_fort_src = list(brain_dir.glob("red_fort_delhi_*.jpg"))[0]
    save_dual(red_fort_src, places_dir / "delhi" / "red-fort")

    chandni_src = list(brain_dir.glob("chandni_chowk_delhi_*.jpg"))[0]
    save_dual(chandni_src, places_dir / "delhi" / "chandni-chowk")

    lotus_src = list(brain_dir.glob("lotus_temple_delhi_*.jpg"))[0]
    save_dual(lotus_src, places_dir / "delhi" / "lotus-temple")

    # 4. Amritsar Golden Temple
    golden_src = list(brain_dir.glob("golden_temple_amritsar_*.jpg"))[0]
    save_dual(golden_src, places_dir / "amritsar" / "golden-temple")

    # 5. Build Dedicated Nearby Category Pack (/images/nearby/<category>/<category>.webp)
    universal_dir = places_dir / "universal"
    
    nearby_category_map = {
        "cafe": universal_dir / "cafe.webp",
        "coffee": universal_dir / "cafe.webp",
        "bakery": universal_dir / "cafe.webp",
        "momo": chandni_src,
        "local_food": universal_dir / "food.webp",
        "market": chandni_src,
        "bazaar": chandni_src,
        "mall": universal_dir / "shopping.webp",
        "temple": universal_dir / "spiritual.webp",
        "monastery": universal_dir / "monastery.webp",
        "mosque": red_fort_src,
        "church": universal_dir / "church.webp",
        "gurudwara": golden_src,
        "fort": nahargarh_src,
        "palace": brijrama_src,
        "monument": qutub_src,
        "museum": universal_dir / "heritage.webp",
        "heritage": universal_dir / "heritage.webp",
        "waterfall": universal_dir / "waterfall.webp",
        "lake": universal_dir / "lake.webp",
        "beach": universal_dir / "beach.webp",
        "viewpoint": universal_dir / "viewpoint.webp",
        "trail": universal_dir / "nature.webp",
        "nature": universal_dir / "nature.webp",
        "cultural": universal_dir / "spiritual.webp",
        "experience": universal_dir / "viewpoint.webp",
        "hidden_gem": universal_dir / "viewpoint.webp",
        "stay": universal_dir / "stay.webp",
        "universal": universal_dir / "nature.webp",
    }

    for cat_name, source_img in nearby_category_map.items():
        cat_dir = nearby_dir / cat_name
        cat_dir.mkdir(parents=True, exist_ok=True)
        save_dual(Path(source_img), cat_dir / cat_name)
        # Also copy as category.webp at nearby root or inside subfolder
        save_dual(Path(source_img), nearby_dir / cat_name)

    print("Successfully built nearby and exact artwork pack.")

if __name__ == "__main__":
    process_and_setup_artwork()
