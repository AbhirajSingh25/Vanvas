import json
import os
from pathlib import Path
from PIL import Image

def find_images(base_dir):
    results = []
    for root, dirs, files in os.walk(base_dir):
        for f in files:
            if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')) and not f.startswith('.'):
                results.append((os.path.join(root, f), f))
    return results

def main():
    brain_dir = r"C:\Users\user\.gemini\antigravity-ide\brain"
    brain_imgs = find_images(brain_dir)
    print(f"Total brain images found: {len(brain_imgs)}")

    with open('backend/authoritative_entity_inventory.json', 'r', encoding='utf-8') as f:
        inv = json.load(f)

    # Let's map brain images by keyword / slug / entity
    # Print distinct image names
    by_conv = {}
    for full_path, fname in brain_imgs:
        conv = os.path.basename(os.path.dirname(full_path))
        if conv not in by_conv:
            by_conv[conv] = []
        by_conv[conv].append((fname, full_path))

    print(f"\nFound {len(by_conv)} conversation folders in brain.")
    for conv, imgs in sorted(by_conv.items()):
        # Filter out UI screenshots (.png) or tiny assets
        real_arts = [fname for fname, p in imgs if not fname.endswith('.png') and not fname.startswith('icon')]
        if real_arts:
            print(f"Conv {conv[:8]} ({len(real_arts)} art images):")
            for fname in sorted(real_arts)[:15]:
                print(f"   {fname}")

if __name__ == '__main__':
    main()
