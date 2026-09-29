"""
Generate Full 391-Entity Matrix and Visual QA Evidence Report for Acceptance Gate
"""

import os
import sys
import json
import hashlib
import urllib.parse
from io import BytesIO

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

import httpx
from PIL import Image
import imagehash

BASE_URL = "https://vanvasai.vercel.app"
ARTIFACT_DIR = r"C:\Users\user\.gemini\antigravity-ide\brain\3b90a146-34a5-4fb7-9e5b-1605133f48fc"

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.seed.canonical_dataset import (
    CANONICAL_26_DESTINATIONS,
    ADDITIONAL_PLACES_BY_DEST,
    ADDITIONAL_HOTELS_BY_DEST,
    ADDITIONAL_RENTALS_BY_DEST
)

def calc_dhash(img: Image.Image, hash_size=8) -> str:
    resized = img.convert('L').resize((hash_size + 1, hash_size), Image.Resampling.LANCZOS)
    pixels = list(resized.getdata())
    diff = []
    for row in range(hash_size):
        for col in range(hash_size):
            diff.append(pixels[row * (hash_size + 1) + col] > pixels[row * (hash_size + 1) + col + 1])
    
    decimal_val = 0
    hex_str = []
    for index, value in enumerate(diff):
        if value:
            decimal_val += 2**(index % 4)
        if index % 4 == 3:
            hex_str.append(hex(decimal_val)[2:])
            decimal_val = 0
    return ''.join(hex_str)

def hamming_dist(hex1: str, hex2: str) -> int:
    val1 = int(hex1, 16)
    val2 = int(hex2, 16)
    return bin(val1 ^ val2).count('1')

def fetch_binary(url: str, client: httpx.Client):
    full_url = url if url.startswith("http") else urllib.parse.urljoin(BASE_URL, url)
    try:
        resp = client.get(full_url, timeout=20.0, follow_redirects=True)
        if resp.status_code == 200:
            content = resp.content
            sha256 = hashlib.sha256(content).hexdigest()
            with Image.open(BytesIO(content)) as img:
                w, h = img.size
                fmt = img.format or "UNKNOWN"
                dh = calc_dhash(img)
            return {
                "status": 200,
                "url": str(resp.url),
                "sha256": sha256,
                "dhash": dh,
                "width": w,
                "height": h,
                "format": fmt,
                "size_bytes": len(content),
                "headers": dict(resp.headers)
            }
        else:
            return {"status": resp.status_code, "url": str(resp.url), "sha256": None, "dhash": None, "width": 0, "height": 0, "format": None, "size_bytes": 0, "headers": dict(resp.headers)}
    except Exception as e:
        return {"status": 0, "url": full_url, "sha256": None, "dhash": None, "width": 0, "height": 0, "format": None, "size_bytes": 0, "headers": {}, "error": str(e)}

def build_full_matrix():
    print("Building full 391-entity matrix directly against live production...")
    client = httpx.Client()
    
    dest_records = []
    place_records = []
    hotel_records = []
    rental_records = []
    
    # 1. 26 Destinations
    for d in CANONICAL_26_DESTINATIONS:
        slug = d["slug"]
        img_url = d.get("hero_artwork") or d.get("hero_image") or f"/artworks/{slug}.jpg"
        bin_info = fetch_binary(img_url, client)
        dest_records.append({
            "entity_id": f"dest-{slug}",
            "entity_type": "destination",
            "destination": slug,
            "entity_name": d["name"],
            "model_or_property": None,
            "rendered_src": img_url,
            "cdn_final_url": bin_info["url"],
            "sha256": bin_info["sha256"],
            "dhash": bin_info["dhash"],
            "dimensions": f"{bin_info['width']}x{bin_info['height']}",
            "file_type": bin_info["format"],
            "size_bytes": bin_info["size_bytes"],
            "http_status": bin_info["status"]
        })

    # 2. 208 Places (8 per destination)
    for slug, places in ADDITIONAL_PLACES_BY_DEST.items():
        for i, p in enumerate(places):
            p_img = p.get("image_url") or p.get("image")
            bin_info = fetch_binary(p_img, client)
            place_records.append({
                "entity_id": f"place-{slug}-{i+1}",
                "entity_type": "place",
                "destination": slug,
                "entity_name": p["name"],
                "model_or_property": p.get("category", ""),
                "rendered_src": p_img,
                "cdn_final_url": bin_info["url"],
                "sha256": bin_info["sha256"],
                "dhash": bin_info["dhash"],
                "dimensions": f"{bin_info['width']}x{bin_info['height']}",
                "file_type": bin_info["format"],
                "size_bytes": bin_info["size_bytes"],
                "http_status": bin_info["status"]
            })

    # 3. 104 Hotels (4 per destination)
    for slug, hotels in ADDITIONAL_HOTELS_BY_DEST.items():
        for i, h in enumerate(hotels):
            h_img = h.get("image_url") or h.get("image")
            bin_info = fetch_binary(h_img, client)
            hotel_records.append({
                "entity_id": f"hotel-{slug}-{i+1}",
                "entity_type": "hotel",
                "destination": slug,
                "entity_name": h["name"],
                "model_or_property": h.get("property_type") or h.get("style", ""),
                "rendered_src": h_img,
                "cdn_final_url": bin_info["url"],
                "sha256": bin_info["sha256"],
                "dhash": bin_info["dhash"],
                "dimensions": f"{bin_info['width']}x{bin_info['height']}",
                "file_type": bin_info["format"],
                "size_bytes": bin_info["size_bytes"],
                "http_status": bin_info["status"],
                "booking_url": h.get("booking_url", "")
            })

    # 4. 53 Rentals
    for slug, rentals in ADDITIONAL_RENTALS_BY_DEST.items():
        for i, r in enumerate(rentals):
            r_img = r.get("image_url") or r.get("image")
            bin_info = fetch_binary(r_img, client)
            rental_records.append({
                "entity_id": f"rental-{slug}-{i+1}",
                "entity_type": "rental",
                "destination": slug,
                "entity_name": r.get("vehicle_name", f"Rental {i+1}"),
                "model_or_property": r.get("vehicle_type", ""),
                "provider_name": r.get("provider_name", ""),
                "rendered_src": r_img,
                "cdn_final_url": bin_info["url"],
                "sha256": bin_info["sha256"],
                "dhash": bin_info["dhash"],
                "dimensions": f"{bin_info['width']}x{bin_info['height']}",
                "file_type": bin_info["format"],
                "size_bytes": bin_info["size_bytes"],
                "http_status": bin_info["status"]
            })

    all_entities = dest_records + place_records + hotel_records + rental_records
    print(f"Total entities processed: {len(all_entities)}")
    print(f"  Destinations: {len(dest_records)}")
    print(f"  Places:       {len(place_records)}")
    print(f"  Hotels:       {len(hotel_records)}")
    print(f"  Rentals:      {len(rental_records)}")

    # Collision Analyses
    # A. SHA256 Exact Duplicates
    sha_map = {}
    sha_collisions = []
    for e in all_entities:
        s = e["sha256"]
        if not s:
            continue
        if s in sha_map:
            sha_collisions.append({
                "sha256": s,
                "first": sha_map[s],
                "duplicate": e
            })
        else:
            sha_map[s] = e

    # B. dHash Exact Duplicates
    dhash_map = {}
    dhash_collisions = []
    for e in all_entities:
        dh = e["dhash"]
        if not dh:
            continue
        if dh in dhash_map:
            dhash_collisions.append({
                "dhash": dh,
                "first": dhash_map[dh],
                "duplicate": e
            })
        else:
            dhash_map[dh] = e

    # C. Perceptual Clustering (Hamming Distance <= 2)
    near_dupes = []
    for i in range(len(all_entities)):
        for j in range(i + 1, len(all_entities)):
            e1 = all_entities[i]
            e2 = all_entities[j]
            if e1.get("dhash") and e2.get("dhash"):
                dist = hamming_dist(e1["dhash"], e2["dhash"])
                if dist <= 2 and e1["sha256"] != e2["sha256"]:
                    near_dupes.append({
                        "hamming_distance": dist,
                        "entity_1": e1,
                        "entity_2": e2
                    })

    # Save complete JSON matrix
    matrix_data = {
        "summary": {
            "destinations_count": len(dest_records),
            "places_count": len(place_records),
            "hotels_count": len(hotel_records),
            "rentals_count": len(rental_records),
            "total_canonical_entities": len(all_entities),
            "sha256_collisions_count": len(sha_collisions),
            "dhash_collisions_count": len(dhash_collisions),
            "near_duplicates_count": len(near_dupes),
            "http_200_count": sum(1 for e in all_entities if e["http_status"] == 200),
            "http_failed_count": sum(1 for e in all_entities if e["http_status"] != 200)
        },
        "sha_collisions": sha_collisions,
        "dhash_collisions": dhash_collisions,
        "near_duplicates": near_dupes,
        "destinations": dest_records,
        "places": place_records,
        "hotels": hotel_records,
        "rentals": rental_records
    }

    out_file = os.path.join(ARTIFACT_DIR, "canonical_391_production_matrix.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(matrix_data, f, indent=2, ensure_ascii=False)
    print(f"Full matrix saved to: {out_file}")

    print("\nSummary Results:")
    print(f"  Total Entities:     {len(all_entities)} / 391")
    print(f"  HTTP 200 Served:    {matrix_data['summary']['http_200_count']}")
    print(f"  HTTP Failed:        {matrix_data['summary']['http_failed_count']}")
    print(f"  SHA-256 Collisions: {len(sha_collisions)}")
    print(f"  dHash Collisions:   {len(dhash_collisions)}")
    print(f"  Near Duplicates:    {len(near_dupes)}")

if __name__ == '__main__':
    build_full_matrix()
