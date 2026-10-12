import os
from pathlib import Path
from PIL import Image

pub = Path("frontend/public/images/vehicles")
for f in sorted(pub.glob("*")):
    if f.suffix.lower() in [".jpg", ".jpeg", ".webp", ".png"]:
        try:
            with Image.open(f) as img:
                is_anim = getattr(img, "is_animated", False)
                print(f"{f.name:45} | {img.format:5} | {img.size} | mode={img.mode} | anim={is_anim}")
        except Exception as e:
            print(f"{f.name}: ERR {e}")
