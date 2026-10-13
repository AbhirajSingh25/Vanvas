import os
import re
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FRONTEND = ROOT / "frontend"
PUBLIC = FRONTEND / "public"

EXCLUDED_DIRS = {".git", "node_modules", ".next", "__pycache__", ".pytest_cache", "scratch", ".system_generated"}

image_pattern = re.compile(r'(/images/[a-zA-Z0-9_\-\./]+\.(?:jpg|jpeg|webp|png|svg|avif)|/artworks/[a-zA-Z0-9_\-\./]+\.(?:jpg|jpeg|webp|png|svg|avif))')

all_refs = set()
file_to_refs = {}

for root, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]
    for f in files:
        if f.endswith((".ts", ".tsx", ".js", ".mjs", ".py", ".json", ".sql", ".html", ".md")):
            # Don't inspect auto-generated inventory jsons or git logs
            if f in ["disk_images_inventory.json", "vanvas_illustration_audit_inventory.json", "db_entities_inventory.json", "code_references_audit.json"]:
                continue
            p = Path(root) / f
            try:
                content = p.read_text(encoding="utf-8")
                matches = image_pattern.findall(content)
                if matches:
                    file_to_refs[str(p.relative_to(ROOT))] = matches
                    all_refs.update(matches)
            except Exception:
                pass

print(f"Total files with image references: {len(file_to_refs)}")
print(f"Total unique referenced image paths: {len(all_refs)}")

broken_paths = {}
for path in sorted(all_refs):
    disk_path = PUBLIC / path.lstrip("/")
    if not disk_path.exists():
        refs_in = [f for f, r in file_to_refs.items() if path in r]
        broken_paths[path] = refs_in

print(f"\nTotal broken image paths found: {len(broken_paths)}")
for p, files in broken_paths.items():
    print(f"\nBROKEN: {p}")
    for fl in files:
        print(f"  Referenced in: {fl}")
