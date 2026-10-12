import json
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
with open(ROOT / "vanvas_illustration_audit_inventory.json", "r", encoding="utf-8") as f:
    items = json.load(f)

# Group by resolved image path
path_to_entities = defaultdict(list)
for it in items:
    path_to_entities[it["resolved_image_path"]].append(it)

print("=== ENTITIES SHARING SAME RESOLVED IMAGE PATH ===")
shared_cross_dest = []
for p, ents in path_to_entities.items():
    if len(ents) > 1:
        dests = {e["destination_slug"] for e in ents}
        types = {e["entity_type"] for e in ents}
        if len(dests) > 1:
            print(f"Path: {p} shared across {len(dests)} destinations: {dests} (Types: {types})")
            for e in ents:
                print(f"   [{e['entity_type']}] {e['destination_slug']}: {e['entity_name']} (cat: {e['category']})")
            shared_cross_dest.append((p, ents))

print(f"\nTotal cross-destination shared image paths: {len(shared_cross_dest)}")
