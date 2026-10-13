import json

with open('vanvas_illustration_audit_inventory.json', 'r', encoding='utf-8') as f:
    inv = json.load(f)

stay_paths = [
    '/images/places/alwar-siliserh/stays/siliserh-lake-palace-rtdc-heritage.webp',
    '/images/places/alwar-siliserh/stays/dadhikar-fort-heritage-hotel.webp',
    '/images/places/alwar-siliserh/stays/fort-view-homestay-alwar.webp',
    '/images/places/damdama-sohna/stays/the-gateway-resort-damdama-lake.webp',
    '/images/places/dharamshala/stays/fortune-park-moksha.webp',
    '/images/places/neemrana/stays/neemrana-fort-palace.webp',
    '/images/places/neemrana/stays/fort-view-heritage-homestay.webp',
    '/images/places/udaipur/stays/tribute-lakeside-boutique-stay.webp'
]

by_path = {x.get('resolved_image_path'): x for x in inv}
by_sha = {}
for x in inv:
    sha = x.get('sha256')
    if sha:
        by_sha.setdefault(sha, []).append(x)

for sp in stay_paths:
    item = by_path.get(sp)
    if item:
        sha = item.get('sha256')
        sharing = by_sha.get(sha, [])
        names = [f"{e['entity_type']}:{e['entity_name']} ({e['resolved_image_path']})" for e in sharing if e['resolved_image_path'] != sp]
        print(f"Stay: {item['entity_name']} ({sp})")
        print(f"   Sharing sha with: {names}\n")

print("\n--- VEHICLE MISMATCHES ---")
for x in inv:
    if x['entity_type'] in ['scooter', 'motorbike']:
        name = x['entity_name']
        t = x['entity_type']
        cat = x.get('category', '')
        img = x.get('resolved_image_path', '')
        # Check mismatch
        if 'scooter' in t and ('bullet' in name.lower() or 'classic 350' in name.lower() or 'himalayan' in name.lower()):
            print(f"Scooter labeled vehicle with motorbike name: {t} | {name} | {cat} | {img}")
        if 'motorbike' in t and ('jupiter' in name.lower() or 'activa' in name.lower() or 'scooter' in name.lower()):
            print(f"Motorbike labeled vehicle with scooter name: {t} | {name} | {cat} | {img}")
