import os
import re
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "frontend" / "public"

pattern = re.compile(r'[\'"]((?:/images/|/artworks/)[a-zA-Z0-9_\-\./]+?\.(?:webp|jpg|jpeg|png|svg|avif))[\'"]')

all_refs = set()
file_to_missing = {}
missing_to_files = {}

ignore_dirs = {"node_modules", ".next", ".git", "__pycache__", "audit_contact_sheets", ".pytest_cache", "venv", ".venv"}
ignore_files = {"vanvas_illustration_audit_inventory.json", "audit_contact_sheet.html", "manifest_audit.json", "all_codebase_missing_images.json"}
valid_exts = {".ts", ".tsx", ".js", ".jsx", ".py", ".json", ".mjs"}

for root, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in ignore_dirs]
    for file in files:
        if file in ignore_files:
            continue
        ext = os.path.splitext(file)[1].lower()
        if ext not in valid_exts:
            continue
        p = Path(root) / file
        try:
            content = p.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        matches = pattern.findall(content)
        missing_in_file = set()
        for m in matches:
            all_refs.add(m)
            disk_p = PUBLIC / m.lstrip("/")
            if not disk_p.exists():
                missing_in_file.add(m)
                if m not in missing_to_files:
                    missing_to_files[m] = []
                missing_to_files[m].append(str(p.relative_to(ROOT)))
        if missing_in_file:
            rel = str(p.relative_to(ROOT))
            file_to_missing[rel] = missing_in_file

print(f"Total unique image paths referenced in codebase: {len(all_refs)}")
print(f"Total missing distinct image references: {len(missing_to_files)}")
print(f"Files referencing missing images: {len(file_to_missing)}\n")

for m, f_list in sorted(missing_to_files.items()):
    print(f"MISSING: {m}")
    for f in f_list[:3]:
        print(f"   in {f}")
    if len(f_list) > 3:
        print(f"   ... and {len(f_list) - 3} more files")

with open(ROOT / "all_codebase_missing_images.json", "w", encoding="utf-8") as f:
    json.dump({
        "total_referenced": len(all_refs),
        "total_missing": len(missing_to_files),
        "missing_paths": {k: v for k, v in sorted(missing_to_files.items())}
    }, f, indent=2)
