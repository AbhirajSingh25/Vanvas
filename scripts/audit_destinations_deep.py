import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))
from app.seed.canonical_dataset import CANONICAL_26_DESTINATIONS
PUBLIC = ROOT / "frontend" / "public"

print(f"Total Canonical Destinations: {len(CANONICAL_26_DESTINATIONS)}")
missing_any = 0
for d in CANONICAL_26_DESTINATIONS:
    slug = d['slug']
    art = d.get('hero_artwork')
    img = d.get('hero_image')
    photo = d.get('hero_photo')
    art_ok = (PUBLIC / art.lstrip('/')).exists() if art else False
    img_ok = (PUBLIC / img.lstrip('/')).exists() if img else False
    photo_ok = (PUBLIC / photo.lstrip('/')).exists() if photo else False
    if not (art_ok and img_ok and photo_ok):
        missing_any += 1
    print(f"{slug:24} | art: {art_ok} ({art}) | img: {img_ok} ({img}) | photo: {photo_ok}")

print(f"\nDestinations with any missing field: {missing_any}")
