import os
import re
import json
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
FRONTEND = ROOT / "frontend"
PUBLIC = FRONTEND / "public"
BACKEND = ROOT / "backend"

def check_file_refs():
    results = {}
    
    # 1. VehicleArtwork.tsx
    v_file = FRONTEND / "components" / "ui" / "VehicleArtwork.tsx"
    v_content = v_file.read_text(encoding="utf-8")
    v_paths = re.findall(r'src:\s*["\']([^"\']+)["\']', v_content)
    v_missing = [p for p in set(v_paths) if not (PUBLIC / p.lstrip("/")).exists()]
    results["VehicleArtwork.tsx"] = {
        "total_refs": len(v_paths),
        "unique_refs": len(set(v_paths)),
        "missing_count": len(v_missing),
        "missing": v_missing
    }
    
    # 2. placeVisualResolver.ts
    p_file = FRONTEND / "lib" / "placeVisualResolver.ts"
    p_content = p_file.read_text(encoding="utf-8")
    p_paths = re.findall(r'["\'](/images/[^"\']+)["\']', p_content)
    p_missing = [p for p in set(p_paths) if not (PUBLIC / p.lstrip("/")).exists()]
    results["placeVisualResolver.ts"] = {
        "total_refs": len(p_paths),
        "unique_refs": len(set(p_paths)),
        "missing_count": len(p_missing),
        "missing": p_missing
    }
    
    # 3. trekContentModel.ts
    t_file = FRONTEND / "lib" / "trekContentModel.ts"
    t_content = t_file.read_text(encoding="utf-8")
    t_paths = re.findall(r'["\'](/images/[^"\']+)["\']', t_content)
    t_missing = [p for p in set(t_paths) if not (PUBLIC / p.lstrip("/")).exists()]
    results["trekContentModel.ts"] = {
        "total_refs": len(t_paths),
        "unique_refs": len(set(t_paths)),
        "missing_count": len(t_missing),
        "missing": t_missing
    }
    
    # 4. canonical_dataset.py
    c_file = BACKEND / "app" / "seed" / "canonical_dataset.py"
    c_content = c_file.read_text(encoding="utf-8")
    c_paths = re.findall(r'["\'](/images/[^"\']+|/artworks/[^"\']+)["\']', c_content)
    c_missing = [p for p in set(c_paths) if not (PUBLIC / p.lstrip("/")).exists()]
    results["canonical_dataset.py"] = {
        "total_refs": len(c_paths),
        "unique_refs": len(set(c_paths)),
        "missing_count": len(c_missing),
        "missing": c_missing
    }
    
    # 5. seed_real_rentals.py
    r_file = BACKEND / "app" / "seed" / "seed_real_rentals.py"
    r_content = r_file.read_text(encoding="utf-8")
    r_paths = re.findall(r'["\'](/images/[^"\']+|/artworks/[^"\']+)["\']', r_content)
    r_missing = [p for p in set(r_paths) if not (PUBLIC / p.lstrip("/")).exists()]
    results["seed_real_rentals.py"] = {
        "total_refs": len(r_paths),
        "unique_refs": len(set(r_paths)),
        "missing_count": len(r_missing),
        "missing": r_missing
    }
    
    with open(ROOT / "code_references_audit.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
        
    for k, v in results.items():
        print(f"=== {k} ===")
        print(f"  Total refs: {v['total_refs']}, Unique: {v['unique_refs']}, Missing: {v['missing_count']}")
        if v["missing"]:
            for m in v["missing"][:10]:
                print(f"    MISSING: {m}")

if __name__ == "__main__":
    check_file_refs()
