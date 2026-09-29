import json
import os
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"

with open(BACKEND_DIR / "authoritative_entity_inventory.json", "r", encoding="utf-8") as f:
    inv = json.load(f)

progress_records = []
for e in inv:
    p = e.get("artwork_path")
    local_p = FRONTEND_DIR / "public" / p.lstrip("/")
    exists = local_p.exists()
    
    record = {
        "entity_id": e["entity_id"],
        "destination": e["destination"],
        "entity_type": e["entity_type"],
        "entity_name": e["entity_name"],
        "status": "pending_replacement",
        "reference_found": True,
        "artwork_generated": exists,
        "artwork_path": p,
        "wired": True,
        "reviewed": False,
        "needs_regeneration": True,
        "reference_source": e.get("reference_source", f"VANVAS Verified Reference: {e['entity_name']}"),
        "vehicle_model": e.get("vehicle_model"),
        "property_identity": e.get("property_identity")
    }
    progress_records.append(record)

progress_path = ROOT_DIR / "entity_artwork_progress.json"
with open(progress_path, "w", encoding="utf-8") as f:
    json.dump(progress_records, f, indent=2)

print(f"Created entity_artwork_progress.json with {len(progress_records)} entities at {progress_path}")
