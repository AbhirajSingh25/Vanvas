"""
VANVAS Official Acceptance Gate: Clean Google Chrome CDP Live Production Visual QA & Content Uniqueness Matrix
Target: https://vanvasai.vercel.app
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
from playwright.sync_api import sync_playwright

BASE_URL = "https://vanvasai.vercel.app"
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
ARTIFACT_DIR = r"C:\Users\user\.gemini\antigravity-ide\brain\3b90a146-34a5-4fb7-9e5b-1605133f48fc"
SCREENSHOTS_DIR = os.path.join(ARTIFACT_DIR, "production_audit_screenshots")
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

# 26 Canonical Destinations
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
    print(f"================================================================================")
    print(f"VANVAS OFFICIAL LIVE PRODUCTION CHROME CDP VISUAL QA AUDIT")
    print(f"Target: {BASE_URL}")
    print(f"Chrome Binary: {CHROME_PATH}")
    print(f"Canonical Destinations: {len(DESTINATIONS)}")
    print(f"================================================================================")

    http_client = httpx.Client()

    results = {
        "destinations": [],
        "places": [],
        "hotels": [],
        "rentals": [],
        "preview_vs_stays": [],
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
            viewport={"width": 1440, "height": 1000},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 VanvasProductionAudit/2.0"
        )
        page = context.new_page()

        for idx, slug in enumerate(DESTINATIONS):
            dest_url = f"{BASE_URL}/explore/{slug}"
            stays_url = f"{BASE_URL}/explore/{slug}/stays"
            print(f"\n[{idx+1:02d}/{len(DESTINATIONS):02d}] Auditing Destination: '{slug}'")

            # ----------------------------------------------------
            # 1. EXPLORE PAGE (Dest Hero, Places, Rentals, Stay Previews)
            # ----------------------------------------------------
            try:
                page.goto(dest_url, wait_until="networkidle", timeout=60000)
                # Progressive scroll down to hydrate all lazy-loaded card images
                for s in range(6):
                    page.evaluate(f"window.scrollTo(0, {s * 600})")
                    page.wait_for_timeout(300)

                # A. Destination Hero
                hero_data = page.evaluate('''() => {
                    const heroImg = document.querySelector('img[alt*="hero" i], img[src*="/artworks/"], img[src*="/destinations/"]') || document.querySelector('img');
                    const title = document.querySelector('h1')?.innerText || '';
                    return {
                        src: heroImg ? (heroImg.currentSrc || heroImg.src) : null,
                        alt: heroImg ? heroImg.alt : '',
                        title: title.split('\\n')[0].trim()
                    };
                }''')

                hero_src = hero_data.get("src") or f"/artworks/{slug}.jpg"
                hero_asset = fetch_asset_binary(hero_src, http_client)
                dest_entry = {
                    "entity_id": f"dest-{slug}",
                    "entity_type": "destination",
                    "destination": slug,
                    "entity_name": hero_data.get("title") or slug.title(),
                    "rendered_src": hero_src,
                    "cdn_final_url": hero_asset["cdn_final_url"],
                    "sha256": hero_asset["sha256"],
                    "dhash": hero_asset["dhash"],
                    "width": hero_asset["width"],
                    "height": hero_asset["height"],
                    "format": hero_asset["format"],
                    "size_bytes": hero_asset["size_bytes"],
                    "http_status": hero_asset["status"]
                }
                results["destinations"].append(dest_entry)

                if idx == 0:
                    results["headers_sample"] = hero_asset["headers"]

                # B. Rendered Places
                places_dom = page.evaluate('''() => {
                    const allPlaceImgs = Array.from(document.querySelectorAll('img')).filter(img => {
                        const s = img.src || '';
                        return s.includes('/places/') && !s.includes('/stays/');
                    });
                    return allPlaceImgs.map((img, i) => {
                        const card = img.closest('div[role="button"], div[class*="PlaceCard"], div[class*="card"], div[class*="rounded"]') || img.parentElement;
                        const nameEl = card ? card.querySelector('h3, h4, [class*="font-semibold"], [class*="font-bold"]') : null;
                        const name = nameEl ? nameEl.innerText : (img.alt || `Place ${i+1}`);
                        const style = window.getComputedStyle(img);
                        return {
                            name: name.split('\\n')[0].trim(),
                            src: img.currentSrc || img.src,
                            alt: img.alt,
                            naturalWidth: img.naturalWidth,
                            naturalHeight: img.naturalHeight,
                            bg_image: style.backgroundImage !== 'none' ? style.backgroundImage : null
                        };
                    });
                }''')

                print(f"  -> Places rendered in DOM: {len(places_dom)}")
                for p_idx, p_data in enumerate(places_dom):
                    p_src = p_data["src"]
                    p_name = p_data["name"]
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
                        "css_bg_mask": p_data["bg_image"]
                    }
                    results["places"].append(place_entry)

                # C. Rendered Rentals
                rentals_dom = page.evaluate('''() => {
                    const rImgs = Array.from(document.querySelectorAll('img')).filter(img => {
                        const s = img.src || '';
                        return s.includes('/vehicles/') || s.includes('/rentals/') || s.includes('/mobility/');
                    });
                    return rImgs.map((img, i) => {
                        const card = img.closest('div[class*="card"], div[class*="border"], div[class*="rounded"]') || img.parentElement;
                        const nameEl = card ? card.querySelector('h3, h4, h5, [class*="font-semibold"], [class*="font-bold"]') : null;
                        const modelEl = card ? card.querySelector('[class*="model"], [class*="specs"], p') : null;
                        return {
                            name: nameEl ? nameEl.innerText.split('\\n')[0].trim() : (img.alt || `Vehicle ${i+1}`),
                            model: modelEl ? modelEl.innerText.trim() : '',
                            src: img.currentSrc || img.src,
                            alt: img.alt
                        };
                    });
                }''')

                print(f"  -> Rentals rendered in DOM: {len(rentals_dom)}")
                for r_idx, r_data in enumerate(rentals_dom):
                    r_src = r_data["src"]
                    r_name = r_data["name"]
                    r_asset = fetch_asset_binary(r_src, http_client)
                    rental_entry = {
                        "entity_id": f"rental-{slug}-{r_idx+1}",
                        "entity_type": "rental",
                        "destination": slug,
                        "entity_name": r_name,
                        "vehicle_model": r_data.get("model", ""),
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

                # D. Preview Stays
                preview_stays = page.evaluate('''() => {
                    const stayImgs = Array.from(document.querySelectorAll('img')).filter(img => {
                        const s = img.src || '';
                        return s.includes('/hotels/') || s.includes('/stays/');
                    });
                    return stayImgs.map((img, i) => {
                        const card = img.closest('div[class*="card"], div[class*="border"], div[class*="rounded"]') || img.parentElement;
                        const nameEl = card ? card.querySelector('h3, h4, p, span') : null;
                        return {
                            name: nameEl ? nameEl.innerText.split('\\n')[0].trim() : (img.alt || `Stay ${i+1}`),
                            src: img.currentSrc || img.src
                        };
                    });
                }''')
                for ps in preview_stays:
                    results["preview_vs_stays"].append({
                        "destination": slug,
                        "name": ps["name"],
                        "src": ps["src"]
                    })

                # Screenshot
                screenshot_path = os.path.join(SCREENSHOTS_DIR, f"{slug}_explore_live.png")
                page.screenshot(path=screenshot_path, full_page=False)

            except Exception as e:
                print(f"  [ERROR] Explore Page failed for {slug}: {e}")
                results["errors"].append({"page": dest_url, "error": str(e)})

            # ----------------------------------------------------
            # 2. STAYS PAGE AUDIT (/explore/[slug]/stays)
            # ----------------------------------------------------
            try:
                page.goto(stays_url, wait_until="networkidle", timeout=60000)
                for s in range(5):
                    page.evaluate(f"window.scrollTo(0, {s * 600})")
                    page.wait_for_timeout(300)

                stays_dom = page.evaluate('''() => {
                    const cards = Array.from(document.querySelectorAll('[data-testid="hotel-card"], [data-testid="stay-card"], [class*="stay-card"], [class*="HotelCard"], [class*="hotel-card"], [class*="rounded-2xl border"]'));
                    const imgs = Array.from(document.querySelectorAll('img')).filter(img => {
                        const s = img.src || '';
                        return s.includes('/hotels/') || s.includes('/stays/');
                    });

                    if (cards.length > 0) {
                        return cards.map(c => {
                            const img = c.querySelector('img');
                            const nameEl = c.querySelector('h3, h4, [class*="font-semibold"], [class*="font-bold"], [class*="title"]');
                            const links = Array.from(c.querySelectorAll('a, button')).map(a => a.href || a.getAttribute('data-href') || '').filter(Boolean);
                            return {
                                name: nameEl ? nameEl.innerText.split('\\n')[0].trim() : '',
                                src: img ? (img.currentSrc || img.src) : null,
                                links: links
                            };
                        }).filter(item => item.src);
                    }

                    return imgs.map((img, i) => {
                        const card = img.closest('div[class*="card"], div[class*="border"], div[class*="rounded"]') || img.parentElement;
                        const nameEl = card ? card.querySelector('h3, h4, p, span') : null;
                        const links = Array.from(card?.querySelectorAll('a') || []).map(a => a.href).filter(Boolean);
                        return {
                            name: nameEl ? nameEl.innerText.split('\\n')[0].trim() : (img.alt || `Stay ${i+1}`),
                            src: img.currentSrc || img.src,
                            links: links
                        };
                    });
                }''')

                print(f"  -> Stays rendered on Stays page: {len(stays_dom)}")
                for h_idx, h_data in enumerate(stays_dom):
                    h_src = h_data["src"]
                    h_name = h_data["name"]
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

                screenshot_path = os.path.join(SCREENSHOTS_DIR, f"{slug}_stays_live.png")
                page.screenshot(path=screenshot_path, full_page=False)

            except Exception as e:
                print(f"  [ERROR] Stays Page failed for {slug}: {e}")
                results["errors"].append({"page": stays_url, "error": str(e)})

        browser.close()

    # Save complete raw output
    raw_output_path = os.path.join(ARTIFACT_DIR, "production_live_audit_raw.json")
    with open(raw_output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"\nSaved raw audit data to: {raw_output_path}")

    # Run Analysis
    run_complete_analysis(results)

def run_complete_analysis(results: Dict[str, Any]):
    print(f"\n================================================================================")
    print(f"PHASE 4: GLOBAL UNIQUENESS & PERCEPTUAL ANALYSIS ACROSS ALL ENTITIES")
    print(f"================================================================================")

    destinations = results["destinations"]
    places = results["places"]
    hotels = results["hotels"]
    rentals = results["rentals"]
    all_entities = destinations + places + hotels + rentals

    print(f"Canonical Inventory Reconciliation:")
    print(f"  Destinations: {len(destinations)} (Target: 26)")
    print(f"  Places:       {len(places)} (Target: 208)")
    print(f"  Hotels:       {len(hotels)} (Target: 104)")
    print(f"  Rentals:      {len(rentals)} (Target: 53)")
    print(f"  TOTAL:        {len(all_entities)} (Target: 391)")

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
                "first": sha_map[sha],
                "duplicate": ent
            })
        else:
            sha_map[sha] = ent

    # 2. dHash Collision Detection (Hamming Distance = 0)
    dhash_map = {}
    dhash_collisions = []
    for ent in all_entities:
        dh = ent.get("dhash")
        if not dh:
            continue
        if dh in dhash_map:
            dhash_collisions.append({
                "dhash": dh,
                "first": dhash_map[dh],
                "duplicate": ent
            })
        else:
            dhash_map[dh] = ent

    # 3. Perceptual Similarity Clustering (Hamming Distance <= 2, different SHA)
    near_duplicates = []
    for i in range(len(all_entities)):
        for j in range(i + 1, len(all_entities)):
            e1 = all_entities[i]
            e2 = all_entities[j]
            if e1.get("dhash") and e2.get("dhash"):
                dist = hamming_dist(e1["dhash"], e2["dhash"])
                if dist <= 2 and e1.get("sha256") != e2.get("sha256"):
                    near_duplicates.append({
                        "hamming_distance": dist,
                        "entity_1": f"[{e1['entity_type']}] {e1['destination']} - {e1['entity_name']} ({e1['rendered_src']})",
                        "entity_2": f"[{e2['entity_type']}] {e2['destination']} - {e2['entity_name']} ({e2['rendered_src']})"
                    })

    # 4. Check for broken links in hotels
    broken_links = []
    for h in hotels:
        for l in h.get("links", []):
            if l.startswith("javascript:") or l == "#" or "undefined" in l:
                broken_links.append({"hotel": h["entity_name"], "dest": h["destination"], "link": l})

    print(f"\n================================================================================")
    print(f"AUDIT RESULTS SUMMARY")
    print(f"================================================================================")
    print(f"Exact Binary SHA-256 Collisions:    {len(sha_collisions)}")
    print(f"Perceptual dHash Exact Collisions:  {len(dhash_collisions)}")
    print(f"Near-Duplicate Perceptual Clusters: {len(near_duplicates)}")
    print(f"Suspicious / Broken Links:          {len(broken_links)}")

    if sha_collisions:
        print("\nSHA-256 Collisions Detail:")
        for c in sha_collisions:
            print(f"  [{c['first']['entity_type']}] {c['first']['entity_name']} ({c['first']['destination']}) == [{c['duplicate']['entity_type']}] {c['duplicate']['entity_name']} ({c['duplicate']['destination']}) | File: {c['first']['rendered_src']}")

    if dhash_collisions:
        print("\ndHash Collisions Detail:")
        for c in dhash_collisions:
            print(f"  [{c['first']['entity_type']}] {c['first']['entity_name']} ({c['first']['destination']}) == [{c['duplicate']['entity_type']}] {c['duplicate']['entity_name']} ({c['duplicate']['destination']}) | File: {c['first']['rendered_src']}")

    report_data = {
        "summary": {
            "destinations_count": len(destinations),
            "places_count": len(places),
            "hotels_count": len(hotels),
            "rentals_count": len(rentals),
            "total_entities_count": len(all_entities),
            "sha256_collisions_count": len(sha_collisions),
            "dhash_collisions_count": len(dhash_collisions),
            "near_duplicates_count": len(near_duplicates),
            "broken_links_count": len(broken_links)
        },
        "sha_collisions": sha_collisions,
        "dhash_collisions": dhash_collisions,
        "near_duplicates": near_duplicates,
        "broken_links": broken_links,
        "headers_sample": results["headers_sample"]
    }

    report_path = os.path.join(ARTIFACT_DIR, "production_audit_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2, ensure_ascii=False)
    print(f"\nDetailed report written to: {report_path}")

if __name__ == '__main__':
    run_audit()
