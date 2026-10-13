import os
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "frontend" / "public"

zero_files = []
corrupted_files = []
total_images = 0

for p in PUBLIC.rglob("*"):
    if p.is_file() and p.suffix.lower() in [".jpg", ".jpeg", ".png", ".webp", ".avif"]:
        total_images += 1
        if p.stat().st_size == 0:
            zero_files.append(str(p.relative_to(PUBLIC)))
            continue
        try:
            with Image.open(p) as img:
                img.verify()
        except Exception as e:
            corrupted_files.append((str(p.relative_to(PUBLIC)), str(e)))

print(f"Total image files in frontend/public: {total_images}")
print(f"0-byte files: {len(zero_files)}")
for z in zero_files:
    print(f"  ZERO: {z}")
print(f"Corrupted images: {len(corrupted_files)}")
for c, err in corrupted_files:
    print(f"  CORRUPT: {c} ({err})")
