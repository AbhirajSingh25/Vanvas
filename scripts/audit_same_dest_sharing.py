import json
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
with open(ROOT / "vanvas_illustration_audit_inventory.json", "r", encoding="utf-8") as f:
    items = json.load(f)

path_to_entities = defaultdict(list)
for it in items:
    path_to_entities[it["resolved_image_path"]].append(it)

print("=== ENTITIES SHARING SAME RESOLVED IMAGE PATH WITHIN SAME DESTINATION ===")
same_dest_shared = []
for p, ents in path_to_entities.items():
    if len(ents) > 1:
        print(f"\nPath: {p} (Count: {len(ents)})")
        for e in ents:
            print(f"   [{e['entity_type']}] {e['destination_slug']}: {e['entity_name']} (cat: {e['category']})")
        same_dest_shared.append((p, ents))

print(f"\nTotal shared image paths: {len(same_dest_shared)}")
