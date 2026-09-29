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

rentals = [e for e in inventory if e['entity_type'] == 'rental']
print(f"Total rentals: {len(rentals)}")

by_dest = {}
for r in rentals:
    d = r['destination']
    if d not in by_dest: by_dest[d] = []
    by_dest[d].append(r)

vehicle_registry_entries = []
for d, r_list in sorted(by_dest.items()):
    entry_lines = [f'  // {d.title()}']
    entry_lines.append(f'  "{d}": {{')
    
    scooter_item = None
    motorcycle_item = None
    adventure_item = None
    bicycle_item = None
    car_item = None
    
    for r in r_list:
        v_name = r['entity_name']
        v_model = r.get('vehicle_model') or v_name
        v_path = r['artwork_path']
        
        lower = (v_model + " " + v_name).lower()
        if any(k in lower for k in ["activa", "jupiter", "ather", "access", "scooter", "ntorq"]):
            scooter_item = f'    scooter: {{\n      src: "{v_path}",\n      label: "{v_name}",\n      category: "automatic_scooter",\n    }},'
        elif any(k in lower for k in ["himalayan", "xpulse", "adventure"]):
            adventure_item = f'    adventure: {{\n      src: "{v_path}",\n      label: "{v_name}",\n      category: "adventure_motorcycle",\n    }},'
        elif any(k in lower for k in ["bullet", "classic", "motorcycle", "bike"]):
            motorcycle_item = f'    motorcycle: {{\n      src: "{v_path}",\n      label: "{v_name}",\n      category: "classic_bullet",\n    }},'
        elif any(k in lower for k in ["thar", "innova", "ertiga", "scorpio", "car", "safari", "self-drive"]):
            car_item = f'    car: {{\n      src: "{v_path}",\n      label: "{v_name}",\n      category: "car",\n    }},'
        elif any(k in lower for k in ["marlin", "mtb", "bicycle", "cycle"]):
            bicycle_item = f'    bicycle: {{\n      src: "{v_path}",\n      label: "{v_name}",\n      category: "mountain_bike",\n    }},'
            
    # Assemble entry
    if scooter_item: entry_lines.append(scooter_item)
    if motorcycle_item: entry_lines.append(motorcycle_item)
    if adventure_item: entry_lines.append(adventure_item)
    if bicycle_item: entry_lines.append(bicycle_item)
    if car_item: entry_lines.append(car_item)
    
    # default fallback for destination
    first_r = r_list[0]
    entry_lines.append(f'    default: {{\n      src: "{first_r["artwork_path"]}",\n      label: "{first_r["entity_name"]}",\n      category: "automatic_scooter",\n    }},')
    entry_lines.append('  },')
    
    vehicle_registry_entries.append("\n".join(entry_lines))

print(f"Generated vehicle registry entries for {len(vehicle_registry_entries)} destinations.")

# Update VehicleArtwork.tsx
va_path = FRONTEND_DIR / "components" / "ui" / "VehicleArtwork.tsx"
with open(va_path, "r", encoding="utf-8") as f:
    va_content = f.read()

new_registry_str = "const DESTINATION_VEHICLE_REGISTRY: Record<\n  string,\n  {\n    scooter?: ArtworkResult;\n    motorcycle?: ArtworkResult;\n    adventure?: ArtworkResult;\n    bicycle?: ArtworkResult;\n    car?: ArtworkResult;\n    default: ArtworkResult;\n  }\n> = {\n" + "\n".join(vehicle_registry_entries) + "\n};"

va_content = re.sub(
    r"const DESTINATION_VEHICLE_REGISTRY: Record<.*?\n> = \{.*?\n\};",
    lambda m: new_registry_str,
    va_content,
    flags=re.DOTALL
)

with open(va_path, "w", encoding="utf-8") as f:
    f.write(va_content)
print(f"Successfully synced {va_path}")
