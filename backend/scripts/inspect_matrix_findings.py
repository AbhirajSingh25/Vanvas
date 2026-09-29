import json

path = r'C:\Users\user\.gemini\antigravity-ide\brain\3b90a146-34a5-4fb7-9e5b-1605133f48fc\canonical_391_production_matrix.json'
with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)

all_ents = data['destinations'] + data['places'] + data['hotels'] + data['rentals']
failed = [e for e in all_ents if e.get('http_status') != 200]
print(f"Total Failed HTTP Assets: {len(failed)}")
for f in failed:
    print(f"  [{f['entity_type']}] {f['destination']} - {f['entity_name']} -> {f['rendered_src']} (HTTP {f['http_status']})")

print("\nNear Duplicates (Hamming <= 2):")
for n in data.get('near_duplicates', []):
    e1 = n['entity_1']
    e2 = n['entity_2']
    print(f"  Dist {n['hamming_distance']}: [{e1['entity_type']}] {e1['destination']}: {e1['entity_name']} ({e1['rendered_src']}) VS [{e2['entity_type']}] {e2['destination']}: {e2['entity_name']} ({e2['rendered_src']})")
