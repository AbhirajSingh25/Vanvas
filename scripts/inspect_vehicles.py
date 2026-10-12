import sys
from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))
from app.seed.canonical_dataset import ADDITIONAL_RENTALS_BY_DEST

print("=== INSPECT ALL RENTALS IN CANONICAL_DATASET ===")
total = 0
for d, r_list in ADDITIONAL_RENTALS_BY_DEST.items():
    for r in r_list:
        total += 1
        v_name = r.get("vehicle_name", "")
        v_type = r.get("vehicle_type", "")
        img = r.get("image_url", "")
        print(f"{d:22} | {v_type:25} | {v_name:38} | {img}")
print(f"Total rentals: {total}")
