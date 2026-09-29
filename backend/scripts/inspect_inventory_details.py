import json
import os
from pathlib import Path
from PIL import Image

def main():
    with open('backend/authoritative_entity_inventory.json', 'r', encoding='utf-8') as f:
        inv = json.load(f)

    print(f"Total inventory items: {len(inv)}")
    
    # Destination summary
    dest_counts = {}
    for e in inv:
        d = e['destination']
        t = e['entity_type']
        if d not in dest_counts:
            dest_counts[d] = {'place': 0, 'hotel': 0, 'rental': 0}
        dest_counts[d][t] += 1
    
    print("\nDestination Breakdown:")
    for d, counts in sorted(dest_counts.items()):
        print(f"  {d:25s}: places={counts['place']}, hotels={counts['hotel']}, rentals={counts['rental']} (total={sum(counts.values())})")

    # Inspect Manali & Rishikesh
    print("\n--- Manali & Rishikesh Entities ---")
    for e in inv:
        if e['destination'] in ['manali', 'rishikesh']:
            p = e['artwork_path']
            local_p = os.path.join('frontend/public', p.lstrip('/'))
            exists = os.path.exists(local_p)
            size = os.path.getsize(local_p) if exists else 0
            print(f"[{e['destination']}] ({e['entity_type']}) {e['entity_id']}: {e['entity_name']} -> {p} (size={size})")

if __name__ == '__main__':
    main()
