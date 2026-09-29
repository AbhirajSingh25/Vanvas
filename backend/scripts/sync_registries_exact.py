import os
import sys
import json
import re
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"

with open(BACKEND_DIR / "authoritative_entity_inventory.json", "r", encoding="utf-8") as f:
    inventory = json.load(f)

places = [e for e in inventory if e['entity_type'] == 'place']
hotels = [e for e in inventory if e['entity_type'] == 'hotel']
rentals = [e for e in inventory if e['entity_type'] == 'rental']

print(f"Places: {len(places)}, Hotels: {len(hotels)}, Rentals: {len(rentals)}")

def slugify(s: str) -> str:
    if not s: return ""
    s = s.lower().strip().replace("&", "and").replace("'", "")
    for d in ["—", "–", "-", "_", "/", "\\"]: s = s.replace(d, "-")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")

# 1. Update placeVisualResolver.ts
place_registry_lines = []
for p in places:
    dest = p['destination']
    p_slug = slugify(p['entity_name'])
    key = f"{dest}:{p_slug}"
    stem = Path(p['artwork_path']).stem
    desc = p.get('description', f"Curated experience at {p['entity_name']}.").replace('"', "'")
    if len(desc) > 140: desc = desc[:137] + "..."
    
    aliases = [p_slug, stem]
    for part in re.split(r"[\(\)&/,\—\–\:]", p['entity_name']):
        part_s = slugify(part)
        if part_s and len(part_s) >= 4 and part_s not in ["hotel", "resort", "cafe", "place", "and", "the"]:
            aliases.append(part_s)
    aliases = sorted(list(set(aliases)))
    
    place_registry_lines.append(f'  "{key}": {{\n    imageUrl: "{p["artwork_path"]}",\n    visualDescription: "{desc}",\n    category: "{p.get("category", "Must Visit")}",\n    semanticTheme: "nature",\n    sourceType: "editorial_artwork",\n    source: "vanvas_curated",\n    aliases: {json.dumps(aliases)}\n  }},')

hotel_registry_lines = []
for h in hotels:
    dest = h['destination']
    h_slug = slugify(h['entity_name'])
    key = f"{dest}:{h_slug}"
    stem = Path(h['artwork_path']).stem
    desc = h.get('description', f"Curated stay at {h['entity_name']}.").replace('"', "'")
    if len(desc) > 140: desc = desc[:137] + "..."
    
    aliases = [h_slug, stem]
    for part in re.split(r"[\(\)&/,\—\–\:]", h['entity_name']):
        part_s = slugify(part)
        if part_s and len(part_s) >= 4 and part_s not in ["hotel", "resort", "cafe", "place", "stay", "and", "the"]:
            aliases.append(part_s)
    aliases = sorted(list(set(aliases)))
    
    hotel_registry_lines.append(f'  "{key}": {{\n    imageUrl: "{h["artwork_path"]}",\n    visualDescription: "{desc}",\n    category: "Stays & Sanctuaries",\n    semanticTheme: "stay",\n    sourceType: "editorial_artwork",\n    source: "vanvas_curated",\n    aliases: {json.dumps(aliases)}\n  }},')

# Now sync placeVisualResolver.ts
pvr_path = FRONTEND_DIR / "lib" / "placeVisualResolver.ts"
with open(pvr_path, "r", encoding="utf-8") as f:
    pvr_content = f.read()

place_reg_str = "export const EXACT_PLACE_REGISTRY: Record<string, ExactPlaceEntry> = {\n" + "\n".join(place_registry_lines) + "\n};"
hotel_reg_str = "export const EXACT_HOTEL_REGISTRY: Record<string, ExactPlaceEntry> = {\n" + "\n".join(hotel_registry_lines) + "\n};"

pvr_content = re.sub(
    r"export const EXACT_PLACE_REGISTRY: Record<string, ExactPlaceEntry> = \{.*?\n\};",
    lambda m: place_reg_str,
    pvr_content,
    flags=re.DOTALL
)

pvr_content = re.sub(
    r"export const EXACT_HOTEL_REGISTRY: Record<string, ExactPlaceEntry> = \{.*?\n\};",
    lambda m: hotel_reg_str,
    pvr_content,
    flags=re.DOTALL
)

with open(pvr_path, "w", encoding="utf-8") as f:
    f.write(pvr_content)
print(f"Successfully synced {pvr_path}")

# 2. Sync backend artwork_provider.py
provider_path = BACKEND_DIR / "app" / "providers" / "artwork_provider.py"
with open(provider_path, "r", encoding="utf-8") as f:
    prov_content = f.read()

prov_places = []
for p in places:
    dest = p['destination']
    p_slug = slugify(p['entity_name'])
    key = f"{dest}:{p_slug}"
    stem = Path(p['artwork_path']).stem
    desc = p.get('description', f"Curated experience at {p['entity_name']}.").replace('"', "'")
    if len(desc) > 140: desc = desc[:137] + "..."
    aliases = sorted(list(set([p_slug, stem])))
    prov_places.append(f'        "{key}": {{\n            "place_name": "{p["entity_name"]}",\n            "image_url": "{p["artwork_path"]}",\n            "visual_description": "{desc}",\n            "category": "{p.get("category", "Must Visit")}",\n            "semantic_theme": "nature",\n            "source_type": "editorial_artwork",\n            "source": "vanvas_curated",\n            "aliases": {json.dumps(aliases)}\n        }},')

prov_hotels = []
for h in hotels:
    dest = h['destination']
    h_slug = slugify(h['entity_name'])
    key = f"{dest}:{h_slug}"
    stem = Path(h['artwork_path']).stem
    desc = h.get('description', f"Curated stay at {h['entity_name']}.").replace('"', "'")
    if len(desc) > 140: desc = desc[:137] + "..."
    aliases = sorted(list(set([h_slug, stem])))
    prov_hotels.append(f'        "{key}": {{\n            "hotel_name": "{h["entity_name"]}",\n            "image_url": "{h["artwork_path"]}",\n            "visual_description": "{desc}",\n            "category": "Stays & Sanctuaries",\n            "semantic_theme": "stay",\n            "source_type": "editorial_artwork",\n            "source": "vanvas_curated",\n            "aliases": {json.dumps(aliases)}\n        }},')

prov_place_str = "    PLACE_ARTWORK_REGISTRY: Dict[str, Dict[str, Any]] = {\n" + "\n".join(prov_places) + "\n    }"
prov_hotel_str = "    HOTEL_ARTWORK_REGISTRY: Dict[str, Dict[str, Any]] = {\n" + "\n".join(prov_hotels) + "\n    }"

prov_content = re.sub(
    r"    PLACE_ARTWORK_REGISTRY: Dict\[str, Dict\[str, Any\]\] = \{.*?\n    \}",
    lambda m: prov_place_str,
    prov_content,
    flags=re.DOTALL
)
prov_content = re.sub(
    r"    HOTEL_ARTWORK_REGISTRY: Dict\[str, Dict\[str, Any\]\] = \{.*?\n    \}",
    lambda m: prov_hotel_str,
    prov_content,
    flags=re.DOTALL
)

with open(provider_path, "w", encoding="utf-8") as f:
    f.write(prov_content)
print(f"Successfully synced {provider_path}")
