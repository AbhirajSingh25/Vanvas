import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FRONTEND = ROOT / "frontend"
PUBLIC = FRONTEND / "public"

files = [
    FRONTEND / "lib" / "destinationContentModel.ts",
    FRONTEND / "lib" / "oneDayContentModel.ts",
    FRONTEND / "lib" / "trekContentModel.ts",
    FRONTEND / "lib" / "visualIntelligence.ts",
    FRONTEND / "lib" / "placeVisualResolver.ts",
]

for f in files:
    content = f.read_text(encoding="utf-8")
    matches = set(re.findall(r'["\'](/images/[^"\']+|/artworks/[^"\']+)["\']', content))
    missing = [m for m in matches if not (PUBLIC / m.lstrip("/")).exists()]
    print(f"{f.name:28}: {len(matches)} refs, {len(missing)} missing")
    for m in missing:
        print(f"   MISSING: {m}")
