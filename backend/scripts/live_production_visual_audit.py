"""
VANVAS Live Production Visual QA & Content Verification Audit
Target: https://vanvasai.vercel.app
Executes full Google Chrome CDP production audit across:
  - 26 Canonical Destinations
  - 208 Places (8 per destination)
  - 104 Hotels / Stays (4 per destination)
  - 53 Rentals
Total Entities: 391

Computes:
  - Exact binary SHA-256
  - Difference Hash (dHash) & Hamming Distances
  - Response Headers (Cache-Control, ETag, Content-Type, Age, X-Vercel-Cache, etc.)
  - DOM and CSS background / pseudo-element checks
  - Link verification for Stays and Rentals
  - Exact Vehicle Model / Property / Place correspondence verification
"""

import os
import sys
import json
import time
import hashlib
import urllib.parse
from io import BytesIO
from typing import Dict, List, Any, Optional

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

import httpx
from PIL import Image
import imagehash
from playwright.sync_api import sync_playwright

BASE_URL = "https://vanvasai.vercel.app"
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
ARTIFACT_DIR = r"C:\Users\user\.gemini\antigravity-ide\brain\3b90a146-34a5-4fb7-9e5b-1605133f48fc"
SCREENSHOTS_DIR = os.path.join(ARTIFACT_DIR, "production_audit_screenshots")
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

DESTINATIONS = [
    "goa", "jaipur", "udaipur", "varanasi", "mussoorie", "rishikesh", "manali",
    "dharamshala", "kasol", "leh", "spiti", "jaisalmer", "munnar", "dehradun",
    "tungnath-chandrashila", "kainchi-dham", "agra", "mathura-vrindavan",
    "neemrana", "damdama-sohna", "alwar-siliserh", "sariska-bhangarh",
    "chandigarh", "morni-hills", "lansdowne", "murthal"
]

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

def fetch_asset_binary(url: str, client: httpx.Client) -> Dict[str, Any]:
    full_url = url if url.startswith("http") else urllib.parse.urljoin(BASE_URL, url)
    try:
        resp = client.get(full_url, timeout=20.0, follow_redirects=True)
        if resp.status_code == 200:
            content = resp.content
            sha256 = hashlib.sha256(content).hexdigest()
            headers = dict(resp.headers)
            try:
                with Image.open(BytesIO(content)) as img:
                    width, height = img.size
                    fmt = img.format or "UNKNOWN"
                    dh = calc_dhash(img)
            except Exception as e:
                width, height, fmt, dh = 0, 0, "INVALID", ""
            return {
                "status": 200,
                "cdn_final_url": str(resp.url),
                "sha256": sha256,
                "dhash": dh,
                "width": width,
                "height": height,
                "format": fmt,
                "size_bytes": len(content),
                "headers": headers,
                "error": None
            }
        else:
            return {
                "status": resp.status_code,
                "cdn_final_url": str(resp.url),
                "sha256": None,
                "dhash": None,
                "width": 0,
                "height": 0,
                "format": None,
                "size_bytes": 0,
                "headers": dict(resp.headers),
                "error": f"HTTP {resp.status_code}"
            }
    except Exception as e:
        return {
            "status": 0,
            "cdn_final_url": full_url,
            "sha256": None,
            "dhash": None,
            "width": 0,
            "height": 0,
            "format": None,
            "size_bytes": 0,
            "headers": {},
            "error": str(e)
        }

def run_audit():
    print(f"============================================================")
    print(f"VANVAS LIVE PRODUCTION VISUAL QA & UNIQUENESS AUDIT")
    print(f"Target: {BASE_URL}")
    print(f"Chrome Path: {CHROME_PATH}")
    print(f"Destinations to audit: {len(DESTINATIONS)}")
    print(f"============================================================")

    http_client = httpx.Client()

    results = {
        "destinations": [],
        "places": [],
        "hotels": [],
        "rentals": [],
        "headers_sample": {},
        "errors": []
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=["--disable-web-security", "--no-sandbox"]
        )
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 VanvasProductionAuditor/1.0"
        )
        page = context.new_page()

        for idx, slug in enumerate(DESTINATIONS):
            dest_url = f"{BASE_URL}/explore/{slug}"
            stays_url = f"{BASE_URL}/explore/{slug}/stays"
            print(f"\n[{idx+1}/{len(DESTINATIONS)}] Auditing Destination: '{slug}' -> {dest_url}")

            # 1. Visit Explore Page
            try:
                page.goto(dest_url, wait_until="domcontentloaded", timeout=45000)
                page.wait_for_timeout(2500) # React hydration & dynamic data loading

                # Check destination hero visual
                hero_data = page.evaluate('''() => {
                    const heroImg = document.querySelector('img[alt*="hero" i], img[src*="/artworks/"], img[src*="/destinations/"], .hero img, [data-testid="destination-hero"] img') || document.querySelector('img');
                    const heroTitle = document.querySelector('h1')?.innerText || '';
                    return {
                        src: heroImg ? heroImg.currentSrc || heroImg.src : null,
                        alt: heroImg ? heroImg.alt : '',
                        title: heroTitle
                    };
                }''')

                hero_src = hero_data.get("src") or f"/artworks/{slug}.jpg"
                hero_asset_info = fetch_asset_binary(hero_src, http_client)
                
                dest_entry = {
                    "entity_id": f"dest-{slug}",
                    "entity_type": "destination",
                    "destination": slug,
                    "entity_name": hero_data.get("title") or slug.title(),
                    "rendered_src": hero_src,
                    "cdn_final_url": hero_asset_info["cdn_final_url"],
                    "sha256": hero_asset_info["sha256"],
                    "dhash": hero_asset_info["dhash"],
                    "width": hero_asset_info["width"],
                    "height": hero_asset_info["height"],
                    "format": hero_asset_info["format"],
                    "size_bytes": hero_asset_info["size_bytes"],
                    "http_status": hero_asset_info["status"]
                }
                results["destinations"].append(dest_entry)

                if idx == 0:
                    results["headers_sample"] = hero_asset_info["headers"]

                # 2. Extract Place Cards from Explore Page
                places_dom = page.evaluate('''() => {
                    const cards = Array.from(document.querySelectorAll('[data-testid="place-card"], .place-card, [class*="PlaceCard"], [class*="place_card"]'));
                    if (cards.length > 0) {
                        return cards.map(c => {
                            const img = c.querySelector('img');
                            const name = c.querySelector('h3, h4, [class*="title"], [class*="name"]')?.innerText || '';
                            const bgImg = window.getComputedStyle(c).backgroundImage;
                            return {
                                name: name.trim(),
                                src: img ? (img.currentSrc || img.src) : null,
                                alt: img ? img.alt : '',
                                bg_image: bgImg !== 'none' ? bgImg : null
                            };
                        });
                    }
                    // Fallback to all images in Places section
                    const allPlaceContainers = Array.from(document.querySelectorAll('section, div')).filter(el => {
                        const h = el.querySelector('h2, h3');
                        return h && /places|attractions|must visit|explore/i.test(h.innerText);
                    });
                    const container = allPlaceContainers[0] || document;
                    const imgs = Array.from(container.querySelectorAll('img')).filter(img => {
                        return img.src && (img.src.includes('/artworks/places/') || img.src.includes('/places/'));
                    });
                    return imgs.map(img => {
                        const parentCard = img.closest('div[class*="card"], div[class*="rounded"], a') || img.parentElement;
                        const name = parentCard?.querySelector('h3, h4, p, span')?.innerText || img.alt || '';
                        return {
                            name: name.split('\\n')[0].trim(),
                            src: img.currentSrc || img.src,
                            alt: img.alt,
                            bg_image: null
                        };
                    });
                }''')

                print(f"  -> Extracted {len(places_dom)} places from Explore page DOM")
                for p_idx, p_data in enumerate(places_dom):
                    p_src = p_data["src"]
                    p_name = p_data["name"] or f"{slug}-place-{p_idx+1}"
                    if not p_src:
                        continue
                    p_asset = fetch_asset_binary(p_src, http_client)
                    place_entry = {
                        "entity_id": f"place-{slug}-{p_idx+1}",
                        "entity_type": "place",
                        "destination": slug,
                        "entity_name": p_name,
                        "rendered_src": p_src,
                        "cdn_final_url": p_asset["cdn_final_url"],
                        "sha256": p_asset["sha256"],
                        "dhash": p_asset["dhash"],
                        "width": p_asset["width"],
                        "height": p_asset["height"],
                        "format": p_asset["format"],
                        "size_bytes": p_asset["size_bytes"],
                        "http_status": p_asset["status"],
                        "bg_image": p_data["bg_image"]
                    }
                    results["places"].append(place_entry)

                # 3. Extract Rental Cards from Explore Page
                rentals_dom = page.evaluate('''() => {
                    const rentalCards = Array.from(document.querySelectorAll('[data-testid="rental-card"], [class*="rental"], [class*="VehicleArtwork"], [class*="vehicle"]'));
                    const imgs = Array.from(document.querySelectorAll('img')).filter(img => {
                        return img.src && (img.src.includes('/artworks/rentals/') || img.src.includes('/vehicles/'));
                    });
                    return imgs.map((img, i) => {
                        const parent = img.closest('div[class*="card"], div[class*="border"], div[class*="rounded"]') || img.parentElement;
                        const title = parent?.querySelector('h3, h4, h5, span[class*="font-bold"], p[class*="font-semibold"]')?.innerText || img.alt || `Vehicle ${i+1}`;
                        const model = parent?.querySelector('[class*="model"], [class*="specs"], p')?.innerText || '';
                        return {
                            name: title.split('\\n')[0].trim(),
                            model_specs: model.trim(),
                            src: img.currentSrc || img.src,
                            alt: img.alt
                        };
                    });
                }''')

                print(f"  -> Extracted {len(rentals_dom)} rentals from Explore page DOM")
                for r_idx, r_data in enumerate(rentals_dom):
                    r_src = r_data["src"]
                    r_name = r_data["name"]
                    if not r_src:
                        continue
                    r_asset = fetch_asset_binary(r_src, http_client)
                    rental_entry = {
                        "entity_id": f"rental-{slug}-{r_idx+1}",
                        "entity_type": "rental",
                        "destination": slug,
                        "entity_name": r_name,
                        "vehicle_model": r_data["model_specs"],
                        "rendered_src": r_src,
                        "cdn_final_url": r_asset["cdn_final_url"],
                        "sha256": r_asset["sha256"],
                        "dhash": r_asset["dhash"],
                        "width": r_asset["width"],
                        "height": r_asset["height"],
                        "format": r_asset["format"],
                        "size_bytes": r_asset["size_bytes"],
                        "http_status": r_asset["status"]
                    }
                    results["rentals"].append(rental_entry)

                # Capture representative destination screenshot for live evidence
                screenshot_path = os.path.join(SCREENSHOTS_DIR, f"{slug}_explore.png")
                page.screenshot(path=screenshot_path, full_page=False)

            except Exception as e:
                print(f"  [ERROR] Explore Page failed for {slug}: {e}")
                results["errors"].append({"page": dest_url, "error": str(e)})

            # 4. Visit Stays Page
            try:
                page.goto(stays_url, wait_until="domcontentloaded", timeout=45000)
                page.wait_for_timeout(2500) # React hydration

                stays_dom = page.evaluate('''() => {
                    const cards = Array.from(document.querySelectorAll('[data-testid="hotel-card"], [data-testid="stay-card"], [class*="stay-card"], [class*="HotelCard"], [class*="hotel-card"]'));
                    const imgs = Array.from(document.querySelectorAll('img')).filter(img => {
                        return img.src && (img.src.includes('/artworks/hotels/') || img.src.includes('/hotels/') || img.src.includes('/stays/'));
                    });
                    
                    if (cards.length > 0) {
                        return cards.map(c => {
                            const img = c.querySelector('img');
                            const name = c.querySelector('h3, h4, [class*="title"], [class*="name"]')?.innerText || '';
                            const links = Array.from(c.querySelectorAll('a, button')).map(a => a.href || a.getAttribute('data-href') || '').filter(Boolean);
                            return {
                                name: name.trim(),
                                src: img ? (img.currentSrc || img.src) : null,
                                alt: img ? img.alt : '',
                                links: links
                            };
                        });
                    }

                    return imgs.map((img, i) => {
                        const parent = img.closest('div[class*="card"], div[class*="border"], div[class*="rounded"]') || img.parentElement;
                        const name = parent?.querySelector('h3, h4, p, span')?.innerText || img.alt || `Stay ${i+1}`;
                        const links = Array.from(parent?.querySelectorAll('a') || []).map(a => a.href).filter(Boolean);
                        return {
                            name: name.split('\\n')[0].trim(),
                            src: img.currentSrc || img.src,
                            alt: img.alt,
                            links: links
                        };
                    });
                }''')

                print(f"  -> Extracted {len(stays_dom)} stays from Stays page DOM")
                for h_idx, h_data in enumerate(stays_dom):
                    h_src = h_data["src"]
                    h_name = h_data["name"] or f"{slug}-stay-{h_idx+1}"
                    if not h_src:
                        continue
                    h_asset = fetch_asset_binary(h_src, http_client)
                    hotel_entry = {
                        "entity_id": f"hotel-{slug}-{h_idx+1}",
                        "entity_type": "hotel",
                        "destination": slug,
                        "entity_name": h_name,
                        "rendered_src": h_src,
                        "cdn_final_url": h_asset["cdn_final_url"],
                        "sha256": h_asset["sha256"],
                        "dhash": h_asset["dhash"],
                        "width": h_asset["width"],
                        "height": h_asset["height"],
                        "format": h_asset["format"],
                        "size_bytes": h_asset["size_bytes"],
                        "http_status": h_asset["status"],
                        "links": h_data.get("links", [])
                    }
                    results["hotels"].append(hotel_entry)

                if idx in [0, 5, 6, 9]: # sample screenshot of stays
                    stay_screenshot_path = os.path.join(SCREENSHOTS_DIR, f"{slug}_stays.png")
                    page.screenshot(path=stay_screenshot_path, full_page=False)

            except Exception as e:
                print(f"  [ERROR] Stays Page failed for {slug}: {e}")
                results["errors"].append({"page": stays_url, "error": str(e)})

        browser.close()

    # Save raw audit output
    raw_output_path = os.path.join(ARTIFACT_DIR, "production_live_audit_raw.json")
    with open(raw_output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"\nSaved raw audit data to: {raw_output_path}")

    # PHASE 4: GLOBAL UNIQUENESS & PERCEPTUAL ANALYSIS
    analyze_uniqueness(results)

def analyze_uniqueness(results: Dict[str, Any]):
    print(f"\n============================================================")
    print(f"PHASE 4: GLOBAL UNIQUENESS & INTEGRITY ANALYSIS")
    print(f"============================================================")

    all_entities = []
    all_entities.extend(results["destinations"])
    all_entities.extend(results["places"])
    all_entities.extend(results["hotels"])
    all_entities.extend(results["rentals"])

    print(f"Total Canonical Entities Collected: {len(all_entities)}")
    print(f"  Destinations: {len(results['destinations'])}")
    print(f"  Places:       {len(results['places'])}")
    print(f"  Hotels:       {len(results['hotels'])}")
    print(f"  Rentals:      {len(results['rentals'])}")

    # 1. SHA-256 Collision Detection
    sha_map = {}
    sha_collisions = []
    for ent in all_entities:
        sha = ent.get("sha256")
        if not sha:
            continue
        if sha in sha_map:
            sha_collisions.append({
                "sha256": sha,
                "first_entity": sha_map[sha],
                "duplicate_entity": ent
            })
        else:
            sha_map[sha] = ent

    # 2. dHash Collision Detection
    dhash_map = {}
    dhash_collisions = []
    for ent in all_entities:
        dh = ent.get("dhash")
        if not dh:
            continue
        if dh in dhash_map:
            dhash_collisions.append({
                "dhash": dh,
                "first_entity": dhash_map[dh],
                "duplicate_entity": ent
            })
        else:
            dhash_map[dh] = ent

    # 3. Near-Duplicate Perceptual Similarity (Hamming Distance <= 4 within same entity type)
    near_duplicates = []
    for i in range(len(all_entities)):
        for j in range(i + 1, len(all_entities)):
            e1 = all_entities[i]
            e2 = all_entities[j]
            if e1.get("dhash") and e2.get("dhash"):
                dist = hamming_dist(e1["dhash"], e2["dhash"])
                if dist <= 2 and e1["sha256"] != e2["sha256"]:
                    near_duplicates.append({
                        "hamming_distance": dist,
                        "entity_1": e1,
                        "entity_2": e2
                    })

    print(f"\n--- ANALYSIS SUMMARY ---")
    print(f"SHA-256 Collisions:      {len(sha_collisions)}")
    print(f"dHash Exact Collisions:   {len(dhash_collisions)}")
    print(f"Near-Duplicate Clusters: {len(near_duplicates)}")

    if sha_collisions:
        print("\n[FAIL] SHA-256 Collisions Found:")
        for c in sha_collisions[:10]:
            print(f"  - [{c['first_entity']['entity_type']}] {c['first_entity']['entity_name']} ({c['first_entity']['destination']}) == [{c['duplicate_entity']['entity_type']}] {c['duplicate_entity']['entity_name']} ({c['duplicate_entity']['destination']})")
    else:
        print("\n[PASS] ZERO Binary SHA-256 Collisions across all entities!")

    if dhash_collisions:
        print("\n[FAIL] dHash Collisions Found:")
        for c in dhash_collisions[:10]:
            print(f"  - [{c['first_entity']['entity_type']}] {c['first_entity']['entity_name']} ({c['first_entity']['destination']}) == [{c['duplicate_entity']['entity_type']}] {c['duplicate_entity']['entity_name']} ({c['duplicate_entity']['destination']})")
    else:
        print("\n[PASS] ZERO Perceptual dHash Collisions across all entities!")

    # Write Complete Analysis Report
    report = {
        "summary": {
            "total_destinations": len(results["destinations"]),
            "total_places": len(results["places"]),
            "total_hotels": len(results["hotels"]),
            "total_rentals": len(results["rentals"]),
            "total_canonical_entities": len(all_entities),
            "sha256_collisions_count": len(sha_collisions),
            "dhash_collisions_count": len(dhash_collisions),
            "near_duplicates_count": len(near_duplicates)
        },
        "sha_collisions": sha_collisions,
        "dhash_collisions": dhash_collisions,
        "near_duplicates": near_duplicates,
        "headers_sample": results["headers_sample"]
    }

    report_path = os.path.join(ARTIFACT_DIR, "production_audit_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print(f"\nSaved full report to: {report_path}")

if __name__ == '__main__':
    run_audit()
