import os, hashlib
from PIL import Image
import numpy as np

places = [
    ("Kasol Nature Park Pine Walk", "nature-park-kasol.webp"),
    ("Malana Village Ancient Approach Trail", "malana-village-gate.webp"),
    ("Kheerganga Natural Sulphur Pool & Meadow", "kheerganga-trail.webp"),
    ("Pulga Fairy Forest (Ancient Deodar Enclave)", "pulga-fairy-forest.webp"),
    ("Kalga Village & Terraced Apple Orchards", "kalga-village.webp"),
    ("Moon Dance Café & German Bakery", "moon-dance-cafe.webp"),
    ("Grahan Village Heritage Trek", "grahan-village-trek.webp"),
    ("Evergreen Café & Garden Lounge", "evergreen-cafe.webp"),
    ("Tulga Rustic Wooden Hamlet", "tulga-hamlet.webp"),
    ("Rasol High Alpine Village Trail (2,600m)", "rasol-trail.webp"),
    ("Chojh Riverside Pebble Beach & Suspension Bridge", "chojh-bridge.webp"),
    ("Jim Morrison Wooden Terrace & Shakshuka Cafe", "jim-morrison-cafe.webp"),
    ("Waichin Valley (Magic Valley Glacial Meadow)", "waichin-valley.webp"),
    ("Chalal Riverside Pine Trail", "chalal-pine-trail.webp"),
    ("Manikaran Sahib Gurudwara & Hot Springs", "manikaran-sahib-gurudwara.webp"),
    ("Tosh Village Apple Orchard Ridge", "tosh-village.webp")
]

kasol_dir = 'frontend/public/images/places/kasol'
hashes = {}
dims = {}
arrays = {}

print("=== CHECKING ALL 16 KASOL PLACES ===")
for name, filename in places:
    p = os.path.join(kasol_dir, filename)
    if not os.path.exists(p):
        print(f"MISSING FILE: {p}")
        continue
    with open(p, 'rb') as fp:
        h = hashlib.sha256(fp.read()).hexdigest()
    img = Image.open(p).convert('RGB')
    hashes[name] = h
    dims[name] = img.size
    arrays[name] = np.array(img.resize((320, 180))).astype(float)
    print(f"OK: {name:<45s} -> {filename:<30s} (size={img.size}, hash={h[:12]})")

# Check for duplicate hashes
seen_hashes = {}
duplicate_found = False
for name, h in hashes.items():
    if h in seen_hashes:
        print(f"DUPLICATE DETECTED: {name} shares exact hash with {seen_hashes[h]}")
        duplicate_found = True
    seen_hashes[h] = name

if not duplicate_found:
    print("\nSUCCESS: All 16 Kasol places have completely unique SHA-256 hashes!")

# Check pairwise visual difference
min_diff = 999.0
min_pair = ("", "")
for i in range(len(places)):
    for j in range(i + 1, len(places)):
        n1 = places[i][0]
        n2 = places[j][0]
        diff = np.mean(np.abs(arrays[n1] - arrays[n2]))
        if diff < min_diff:
            min_diff = diff
            min_pair = (n1, n2)

print(f"\nMinimum pairwise difference: {min_diff:.2f} between '{min_pair[0]}' and '{min_pair[1]}'")
