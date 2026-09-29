import os
import sys
import json
import asyncio
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BACKEND_DIR.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.providers.artwork_provider import CuratedArtworkProvider

async def main():
    provider = CuratedArtworkProvider()
    inv = json.loads((BACKEND_DIR / "authoritative_entity_inventory.json").read_text(encoding="utf-8"))

    exact_match_count = 0
    failed_count = 0
    failures = []

    for item in inv:
        dest = item["destination"]
        name = item["entity_name"]
        cat = item.get("category", "")
        expected_path = item["artwork_path"]
        
        if item["entity_type"] == "place":
            resolved = await provider.resolve_place_artwork(place_name=name, destination_name=dest, category=cat)
        elif item["entity_type"] == "hotel":
            resolved = await provider.resolve_hotel_artwork(property_name=name, destination_name=dest, hotel_style=cat)
        else:
            resolved = await provider.resolve_place_artwork(place_name=name, destination_name=dest, category="transport")
            
        resolved_url = resolved.get("image_url") if isinstance(resolved, dict) else str(resolved)
        
        expected_stem = Path(expected_path).stem
        resolved_stem = Path(resolved_url).stem if resolved_url else ""
        
        if expected_stem in resolved_stem or resolved_stem in expected_stem or resolved_url == expected_path:
            exact_match_count += 1
        else:
            failed_count += 1
            failures.append((item["entity_id"], expected_path, resolved_url, resolved.get("badge_label")))

    print(f"Total: {len(inv)}, Exact matches: {exact_match_count}, Mismatches: {failed_count}")
    if failures:
        for fid, exp, got, badge in failures[:15]:
            print(f"  [MISMATCH] {fid} expected {exp}, got {got} (badge: {badge})")

if __name__ == "__main__":
    asyncio.run(main())
