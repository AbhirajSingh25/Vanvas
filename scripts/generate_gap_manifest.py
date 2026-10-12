"""
Generate Artwork Gap & Provenance Manifest
Analyzes the entire inventory and database entities:
- Classifies each entity into:
  1. EXACT_ARTWORK (Unique dedicated editorial artwork)
  2. DESTINATION_CATEGORY_ARTWORK (Authentic destination-specific category visual)
  3. UNIVERSAL_FALLBACK (Honest generic fallback when no dedicated asset exists)
- For every entity on a universal fallback, builds a prioritized artwork-generation manifest
  with authentic art-direction prompts matching VANVAS_ART_BIBLE.md.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INV_FILE = ROOT / "vanvas_illustration_audit_inventory.json"

def main():
    print("=== VANVAS PHASE D: ARTWORK PROVENANCE & GAP MANIFEST GENERATION ===")
    
    with open(INV_FILE, "r", encoding="utf-8") as f:
        inventory = json.load(f)
        
    exact_count = 0
    dest_cat_count = 0
    universal_fallback_count = 0
    
    gaps = []
    
    for item in inventory:
        img = item.get("resolved_image_path", "")
        ent_type = item.get("entity_type", "")
        ent_name = item.get("entity_name", "")
        dest_slug = item.get("destination_slug", "")
        dest_name = item.get("destination_name", "")
        cat = item.get("category", "")
        
        is_universal = "/universal/" in img or "/universal_" in img
        is_dest_cat = "/categories/" in img
        
        if is_universal:
            universal_fallback_count += 1
            provenance = "UNIVERSAL_FALLBACK"
            # Build art direction prompt matching VANVAS_ART_BIBLE.md
            prompt = (
                f"A handcrafted editorial travel journal illustration of {ent_name} in {dest_name}, India. "
                f"Gouache, linocut, and screen-print aesthetic with authentic regional architecture and natural landscape. "
                f"Muted earth tones, terracotta, deep forest greens, subtle paper texture, hand-drawn linework. "
                f"No baked-in text, no labels, no logos, no watermarks, no generic CGI rendering."
            )
            gaps.append({
                "priority": "HIGH" if ent_type in ["place", "destination"] else "MEDIUM",
                "entity_id": item.get("entity_id"),
                "entity_name": ent_name,
                "entity_type": ent_type,
                "destination": dest_slug,
                "category": cat,
                "current_resolved_path": img,
                "fallback_status": "HONEST_UNIVERSAL_FALLBACK",
                "art_bible_prompt": prompt
            })
        elif is_dest_cat:
            dest_cat_count += 1
            provenance = "DESTINATION_CATEGORY_ARTWORK"
        else:
            exact_count += 1
            provenance = "EXACT_DEDICATED_ARTWORK"
            
    # Sort gaps by priority
    gaps.sort(key=lambda g: 0 if g["priority"] == "HIGH" else 1)
    
    manifest = {
        "summary": {
            "total_entities_audited": len(inventory),
            "exact_dedicated_artwork_count": exact_count,
            "destination_category_artwork_count": dest_cat_count,
            "universal_fallback_count": universal_fallback_count,
            "exact_artwork_percentage": round(exact_count / len(inventory) * 100, 2),
            "total_generation_manifest_items": len(gaps)
        },
        "generation_manifest": gaps
    }
    
    out_file = ROOT / "artwork_gap_manifest.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
        
    print(f"Total entities: {len(inventory)}")
    print(f"  Exact Dedicated Artwork: {exact_count} ({manifest['summary']['exact_artwork_percentage']}%)")
    print(f"  Destination Category Art: {dest_cat_count}")
    print(f"  Universal Fallback (Gaps): {universal_fallback_count}")
    print(f"Manifest written to: {out_file}")

if __name__ == "__main__":
    main()
