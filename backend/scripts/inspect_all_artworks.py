import json
import os
from pathlib import Path
from PIL import Image

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"
PUBLIC_DIR = FRONTEND_DIR / "public"

inv_file = BACKEND_DIR / "authoritative_entity_inventory.json"
inventory = json.loads(inv_file.read_text(encoding="utf-8"))

print(f"Total inventory items: {len(inventory)}")

places = [x for x in inventory if x["entity_type"] == "place"]
hotels = [x for x in inventory if x["entity_type"] == "hotel"]
rentals = [x for x in inventory if x["entity_type"] == "rental"]

print("\n=== RENTALS (53) ===")
for r in rentals:
    art = r["artwork_path"].lstrip("/")
    p = PUBLIC_DIR / art
    exists = p.exists()
    size = p.stat().st_size if exists else 0
    img_dim = ""
    if exists:
        try:
            with Image.open(p) as im:
                img_dim = f"{im.size[0]}x{im.size[1]}"
        except Exception as e:
            img_dim = f"ERR: {e}"
    print(f"[{r['destination']}] {r['entity_name']} -> {r['artwork_path']} (Exists: {exists}, {size}B, {img_dim})")

print("\n=== PLACES PER DESTINATION (208) ===")
by_dest = {}
for p in places:
    by_dest.setdefault(p["destination"], []).append(p)

for d, p_list in sorted(by_dest.items()):
    print(f"\n--- {d.upper()} ({len(p_list)} places) ---")
    for pl in p_list:
        art = pl["artwork_path"].lstrip("/")
        p = PUBLIC_DIR / art
        exists = p.exists()
        size = p.stat().st_size if exists else 0
        img_dim = ""
        if exists:
            try:
                with Image.open(p) as im:
                    img_dim = f"{im.size[0]}x{im.size[1]}"
            except Exception as e:
                img_dim = f"ERR: {e}"
        print(f"  {pl['entity_name']} -> {pl['artwork_path']} ({exists}, {size}B, {img_dim})")

print("\n=== HOTELS PER DESTINATION (104) ===")
h_by_dest = {}
for h in hotels:
    h_by_dest.setdefault(h["destination"], []).append(h)

for d, h_list in sorted(h_by_dest.items()):
    print(f"\n--- {d.upper()} ({len(h_list)} hotels) ---")
    for hl in h_list:
        art = hl["artwork_path"].lstrip("/")
        p = PUBLIC_DIR / art
        exists = p.exists()
        size = p.stat().st_size if exists else 0
        img_dim = ""
        if exists:
            try:
                with Image.open(p) as im:
                    img_dim = f"{im.size[0]}x{im.size[1]}"
            except Exception as e:
                img_dim = f"ERR: {e}"
        print(f"  {hl['entity_name']} -> {hl['artwork_path']} ({exists}, {size}B, {img_dim})")
