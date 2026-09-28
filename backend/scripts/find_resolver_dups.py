import re
import collections
from pathlib import Path

resolver_file = Path("frontend/lib/placeVisualResolver.ts")
code = resolver_file.read_text(encoding="utf-8")

mappings = re.findall(r'\"([a-z0-9\-]+:[a-z0-9\-]+)\":\s*\{\s*imageUrl:\s*\"([^\"]+)\"', code)
print(f"Total mappings found: {len(mappings)}")

seen = collections.defaultdict(list)
for k, img in mappings:
    seen[img].append(k)

dups = {img: ks for img, ks in seen.items() if len(ks) > 1}
print(f"Duplicate images count: {len(dups)}")
for img, ks in dups.items():
    print(f"  {img} -> {ks}")
