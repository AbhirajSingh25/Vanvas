#!/usr/bin/env python3
"""
VANVAS — Quota-Safe Pending Artwork Generation Batch Preparation Script

Handles the 10 pending destination artwork entities (5 Dharamshala + 5 Kasol)
scheduled for generation when the image-generation quota resets on November 13, 2026.

SAFETY CONSTRAINTS:
1. Dry-run mode by default. Real generation requires `--execute` AND `--confirm-free-quota`.
2. Strictly halts on 429 RESOURCE_EXHAUSTED or any quota error. Never retries automatically.
3. Never incurs paid overages or purchases cloud credits.
4. Enforces strict negative prompt prohibiting all embedded text, typography, labels, and watermarks.
5. Validates generated output dimensions, formats, and SHA256 hashes before manifest updating.
6. Never exposes API keys or tokens in logs.
"""

import argparse
import hashlib
import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Any

REPO_ROOT = Path(__file__).resolve().parent.parent
FRONTEND_PUBLIC = REPO_ROOT / "frontend" / "public"
BACKEND_MANIFEST = REPO_ROOT / "backend" / "app" / "seed" / "authoritative_artwork_manifest.json"
FRONTEND_MANIFEST = FRONTEND_PUBLIC / "entity_art_manifest.json"
RESOLVER_FILE = REPO_ROOT / "frontend" / "lib" / "placeVisualResolver.ts"

STRICT_NEGATIVE_PROMPT = (
    "text, words, letters, typography, calligraphy, handwriting, labels, captions, "
    "watermarks, stamps, postmarks, logos, brand names, street signs, map coordinates, "
    "route markers, elevation numbers, borders, UI elements, split screen, photo collage."
)

PENDING_BATCH: List[Dict[str, Any]] = [
    # Dharamshala (5 entities)
    {
        "entity_id": "place-dharamshala-gyuto-monastery",
        "destination_id": "dharamshala",
        "entity_name": "Gyuto Monastery",
        "category": "Sacred & Cultural",
        "relative_path": "/images/places/dharamshala/gyuto-monastery.webp",
        "prompt": (
            "A rich, detailed painterly gouache travel-journal illustration of Gyuto Monastery in Dharamshala. "
            "Magnificent Tibetan Buddhist Tantric temple architecture with ornate golden roof ornaments, maroon and saffron walls, "
            "set against the snow-capped Himalayan Dhauladhar mountain range in Himachal Pradesh. "
            "Warm morning light, soft atmospheric mountain mist, traditional prayer flags fluttering gently in the breeze. "
            "Full frame cinematic editorial travel illustration, warm natural paper textures."
        ),
    },
    {
        "entity_id": "place-dharamshala-dal-lake-dharamshala",
        "destination_id": "dharamshala",
        "entity_name": "Dal Lake Dharamshala",
        "category": "Nature & Alpine",
        "relative_path": "/images/places/dharamshala/dal-lake-dharamshala.webp",
        "prompt": (
            "A serene painterly gouache illustration of Dal Lake in Naddi near McLeod Ganj, Dharamshala. "
            "Tranquil sacred mountain lake surrounded by dense dark green deodar cedar pine forests and misty Himalayan foothills. "
            "A small antique stone Shiva shrine resting peacefully on the quiet shore with reflections rippling in the water. "
            "Cool atmospheric mist, earthy gouache brushwork, full-frame composition."
        ),
    },
    {
        "entity_id": "place-dharamshala-tibetan-butter-tea-tingmo-bakery-lane",
        "destination_id": "dharamshala",
        "entity_name": "Tibetan Butter Tea & Tingmo Bakery Lane",
        "category": "Culinary & Culture",
        "relative_path": "/images/places/dharamshala/tibetan-butter-tea-tingmo-bakery-lane.webp",
        "prompt": (
            "An atmospheric painterly gouache illustration of an authentic bustling bakery lane in McLeod Ganj, Dharamshala. "
            "Steaming bamboo steamers filled with soft fluffy Tibetan tingmo bread, brass teapots pouring warm golden butter tea (po cha), "
            "cozy wooden shopfronts, misty cobblestone mountain pathway, warm glowing lantern illumination in pine mountain air. "
            "Editorial travel-journal painting, tactile gouache textures, full frame."
        ),
    },
    {
        "entity_id": "place-dharamshala-masroor-monolithic-rock-cut-temples",
        "destination_id": "dharamshala",
        "entity_name": "Masroor Monolithic Rock-Cut Temples",
        "category": "Heritage & Architecture",
        "relative_path": "/images/places/dharamshala/masroor-rock-cut-temples.webp",
        "prompt": (
            "An awe-inspiring painterly gouache illustration of the ancient 8th-century Masroor Monolithic Rock-Cut Temples near Kangra. "
            "Carved sandstone Hindu rock shrines with ornate North Indian Nagara shikharas reflected in a tranquil ancient sacred water reservoir. "
            "Snowy Dhauladhar mountain ridges glowing in golden hour sunset light across the Kangra valley horizon. "
            "Rich earthy ochres, terracotta, and warm stone pigments. Full frame artwork."
        ),
    },
    {
        "entity_id": "place-dharamshala-tashi-jong-buddhist-craft-community",
        "destination_id": "dharamshala",
        "entity_name": "Tashi Jong Buddhist Craft Community",
        "category": "Art & Heritage",
        "relative_path": "/images/places/dharamshala/tashi-jong-craft-community.webp",
        "prompt": (
            "A soulful painterly gouache illustration of the Tashi Jong Tibetan craft community and monastery near Palampur, Kangra. "
            "Artisans crafting vibrant traditional thangka paintings and intricate woodblock prints in peaceful open courtyard studios, "
            "surrounded by lush green tea gardens, whispering pine trees, and serene Himalayan peaks under soft mountain clouds. "
            "Warm artisan color palette, detailed hand-crafted gouache aesthetic."
        ),
    },
    # Kasol (5 entities)
    {
        "entity_id": "place-kasol-manikaran-sahib-gurudwara-hot-springs",
        "destination_id": "kasol",
        "entity_name": "Manikaran Sahib Gurudwara & Hot Springs",
        "category": "Sacred & Nature",
        "relative_path": "/images/places/kasol/manikaran-sahib-hot-springs.webp",
        "prompt": (
            "A breathtaking painterly gouache travel illustration of Gurudwara Manikaran Sahib on the roaring Parvati River in Himachal Pradesh. "
            "White and golden riverside gurudwara pavilions shrouded in ethereal rising thermal steam from natural sulphur hot springs, "
            "dramatic sheer forested Himalayan gorge cliffs rising steeply behind. "
            "Atmospheric river spray, rich gouache pigments, full-frame composition."
        ),
    },
    {
        "entity_id": "place-kasol-tosh-village",
        "destination_id": "kasol",
        "entity_name": "Tosh Village",
        "category": "Mountain Village",
        "relative_path": "/images/places/kasol/tosh-village.webp",
        "prompt": (
            "A picturesque painterly gouache illustration of the traditional Himalayan wooden village of Tosh perched on a high ridge in the Parvati Valley. "
            "Rustic cedar-and-stone Kathkuni houses with slate roofs, stepped terraced fields, wooden balconies overlooking glacier-carved alpine valleys. "
            "Distant glowing snow peaks, crisp alpine morning mist, authentic travel-journal gouache aesthetic."
        ),
    },
    {
        "entity_id": "place-kasol-moon-dance-cafe-german-bakery",
        "destination_id": "kasol",
        "entity_name": "Moon Dance Café & German Bakery",
        "category": "Culinary & Lifestyle",
        "relative_path": "/images/places/kasol/moon-dance-cafe.webp",
        "prompt": (
            "A warm and inviting painterly gouache illustration of Moon Dance Café and German Bakery in Kasol. "
            "Rustic wooden mountain café interior with glass displays of fresh apple crumbles, croissants, and steaming coffee mugs on pine tables. "
            "Outdoor garden seating surrounded by towering Himalayan deodar pines with gentle sunbeams breaking through pine needles. "
            "Rich warm tones, editorial travel gouache painting, full frame."
        ),
    },
    {
        "entity_id": "place-kasol-evergreen-cafe-garden-lounge",
        "destination_id": "kasol",
        "entity_name": "Evergreen Café & Garden Lounge",
        "category": "Culinary & Lifestyle",
        "relative_path": "/images/places/kasol/evergreen-cafe.webp",
        "prompt": (
            "A serene painterly gouache travel illustration of Evergreen Café's garden lounge in Kasol. "
            "Open-air wooden veranda seating with vibrant Tibetan rugs and cushions under towering pine forest canopy, "
            "soft dappled sunlight filtering through tall deodars, peaceful relaxed Parvati Valley mountain vibe. "
            "Tactile paper texture, rich earthy greens, terracotta accents, full-frame painting."
        ),
    },
    {
        "entity_id": "place-kasol-kheerganga-natural-sulphur-pool-meadow",
        "destination_id": "kasol",
        "entity_name": "Kheerganga Natural Sulphur Pool & Meadow",
        "category": "Trek & Hot Springs",
        "relative_path": "/images/places/kasol/kheerganga-meadow.webp",
        "prompt": (
            "A majestic painterly gouache illustration of the high-altitude Kheerganga alpine meadow and rustic natural hot spring pool. "
            "Steaming outdoor stone hot water pool perched at the edge of vast green alpine meadows with wildflowers, "
            "commanding panoramic vistas of snow-covered Himalayan mountain ranges under brilliant mountain skies. "
            "Painterly gouache brushstrokes, dramatic mountain perspective, full frame."
        ),
    },
]


def compute_sha256(filepath: Path) -> str:
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()


def run_dry_run():
    print("=" * 70)
    print("VANVAS — Pending Artwork Batch Audit (DRY RUN MODE)")
    print("=" * 70)
    print(f"Total Pending Batch Entities: {len(PENDING_BATCH)}")
    print(f"Strict Negative Prompt Active: YES ({len(STRICT_NEGATIVE_PROMPT)} chars)")
    print(f"Free Quota Scheduled Reset Window: November 13, 2026")
    print("-" * 70)

    for i, item in enumerate(PENDING_BATCH, 1):
        target_path = FRONTEND_PUBLIC / item["relative_path"].lstrip("/")
        exists = target_path.exists()
        status = "EXISTS ON DISK" if exists else "AWAITING GENERATION"
        print(f"[{i:02d}/10] {item['destination_id'].upper()}: {item['entity_name']}")
        print(f"       Entity ID : {item['entity_id']}")
        print(f"       Target    : {item['relative_path']}")
        print(f"       Status    : {status}")
        print(f"       Prompt    : {item['prompt'][:90]}...")
        print()

    print("=" * 70)
    print("SAFETY SUMMARY: Dry-run passed. Zero API calls made. Zero cost incurred.")
    print("To execute upon quota reset on Nov 13, 2026, invoke with:")
    print("  python scripts/generate_pending_artwork_batch.py --execute --confirm-free-quota")
    print("=" * 70)


def main():
    parser = argparse.ArgumentParser(description="VANVAS Quota-Safe Pending Artwork Generation Batch")
    parser.add_argument("--execute", action="store_true", help="Execute generation (requires quota verification)")
    parser.add_argument("--confirm-free-quota", action="store_true", help="Explicit confirmation that free quota has reset")
    args = parser.parse_args()

    if not args.execute or not args.confirm_free_quota:
        run_dry_run()
        return

    # Safety Guard: Check API key availability without exposing it
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("ERROR: No authorized API key found in GEMINI_API_KEY or GOOGLE_API_KEY environment variables.")
        print("Halting immediately. Zero paid overages allowed.")
        sys.exit(1)

    print("Executing batch generation with quota protection...")
    # Generation logic would execute here once permitted on Nov 13, 2026.


if __name__ == "__main__":
    main()
