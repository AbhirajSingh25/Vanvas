import os
import sys
import json
import re
from pathlib import Path
from PIL import Image

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"
PUBLIC_DIR = FRONTEND_DIR / "public"
BRAIN_DIR = Path(r"C:\Users\user\.gemini\antigravity-ide\brain")

with open(BACKEND_DIR / "authoritative_entity_inventory.json", "r", encoding="utf-8") as f:
    inv = json.load(f)

# Find all valid jpg/png images in brain
brain_images = []
for root, dirs, files in os.walk(BRAIN_DIR):
    for f in files:
        if f.lower().endswith(('.jpg', '.jpeg', '.png')) and not f.startswith('.'):
            # Skip full UI screenshots
            if 'explore_live' in f or 'stays_live' in f or 'icon' in f:
                continue
            full_path = Path(root) / f
            try:
                with Image.open(full_path) as im:
                    w, h = im.size
                    if w >= 400 and h >= 300:
                        brain_images.append((f, full_path, w, h))
            except Exception:
                pass

print(f"Valid authentic artwork candidates in brain: {len(brain_images)}")

# Map candidates to inventory items
matches = []
unmatched_inv = []

def normalize_name(s):
    s = s.lower().replace('&', 'and').replace("'", "")
    return re.sub(r'[^a-z0-9]+', '', s)

for e in inv:
    eid = e['entity_id']
    ename = e['entity_name']
    edest = e['destination']
    etype = e['entity_type']
    target_path = e['artwork_path']
    stem = Path(target_path).stem
    
    # Candidate scoring
    best_candidate = None
    best_score = 0
    
    norm_ename = normalize_name(ename)
    norm_stem = normalize_name(stem)
    
    for fname, full_path, w, h in brain_images:
        norm_fname = normalize_name(fname)
        score = 0
        
        # Check stem exact match in filename
        if norm_stem in norm_fname or norm_fname.startswith(norm_stem):
            score += 50
        
        # Check entity name match in filename
        if norm_ename[:8] in norm_fname:
            score += 30
            
        # Destination match
        if edest in norm_fname:
            score += 10
            
        # Type match
        if etype == 'hotel' and ('stay' in norm_fname or 'hotel' in norm_fname or 'resort' in norm_fname or 'palace' in norm_fname):
            score += 5
        elif etype == 'rental' and ('scooter' in norm_fname or 'bullet' in norm_fname or 'bike' in norm_fname or 'car' in norm_fname or 'mobility' in norm_fname):
            score += 5
            
        if score > best_score and score >= 30:
            best_score = score
            best_candidate = (fname, full_path, score)
            
    if best_candidate:
        matches.append((e, best_candidate))
    else:
        unmatched_inv.append(e)

print(f"Matched {len(matches)} entities to brain candidates.")
print(f"Unmatched inventory items: {len(unmatched_inv)}")

print("\n--- Sample Matched Entities ---")
for e, (fname, full_path, score) in matches[:25]:
    print(f"[{e['destination']}] ({e['entity_type']}) {e['entity_name']}\n  Target: {e['artwork_path']}\n  Brain:  {fname} (score={score})\n")

print("\n--- Sample Unmatched Entities ---")
for e in unmatched_inv[:25]:
    print(f"[{e['destination']}] ({e['entity_type']}) {e['entity_name']} -> {e['artwork_path']}")
