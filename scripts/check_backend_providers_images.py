import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BACKEND = ROOT / "backend"
PUBLIC = ROOT / "frontend" / "public"

files = [
    BACKEND / "app" / "providers" / "live_providers.py",
    BACKEND / "app" / "services" / "mobility_service.py",
    BACKEND / "app" / "providers" / "artwork_provider.py",
]

for f in files:
    content = f.read_text(encoding="utf-8")
    matches = set(re.findall(r'["\'](/images/[^"\']+|/artworks/[^"\']+)["\']', content))
    missing = [m for m in matches if not (PUBLIC / m.lstrip("/")).exists()]
    print(f"{f.name:28}: {len(matches)} refs, {len(missing)} missing")
    for m in missing:
        print(f"   MISSING: {m}")
