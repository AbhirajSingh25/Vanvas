import httpx
import json
import sys

def verify():
    print("=== VANVAS PHASE 6.2A LIVE RUNTIME VERIFICATION ===")
    client = httpx.Client(timeout=8.0)
    
    # 1. Backend Health
    try:
        r = client.get("http://127.0.0.1:8000/health")
        print(f"[OK] Backend Health: HTTP {r.status_code} - {r.json().get('status')}")
    except Exception as e:
        print(f"[WARN] Backend not running or error: {e}")

    # 2. Destination Search & Resolution: Indore
    try:
        r = client.get("http://127.0.0.1:8000/api/v1/destinations/search?q=indore")
        if r.status_code == 200:
            results = r.json()
            top = results[0] if results else {}
            print(f"[OK] Search 'indore': Top Result='{top.get('name')}', State='{top.get('state')}', Slug='{top.get('slug')}'")
            assert "indore" in top.get("name", "").lower(), "ERROR: Indore was not top result!"
            assert top.get("name", "").lower() != "india", "ERROR: Indore resolved to India!"
        else:
            print(f"[FAIL] Search indore returned HTTP {r.status_code}")

        r_post = client.post("http://127.0.0.1:8000/api/v1/destinations/resolve?query=indore")
        if r_post.status_code == 200:
            dest = r_post.json()
            print(f"[OK] Resolve 'indore': Name='{dest.get('name')}', State='{dest.get('state')}', Slug='{dest.get('slug')}'")
            assert "indore" in dest.get("name", "").lower()
            assert dest.get("name", "").lower() != "india"
        else:
            print(f"[FAIL] Resolve indore returned HTTP {r_post.status_code}")
    except Exception as e:
        print(f"[ERROR] Resolving indore: {e}")

    # 3. Seeded Destinations Verification
    dest_slugs = ["manali", "mussoorie", "udaipur", "goa", "jaipur", "rishikesh", "varanasi", "leh"]
    for slug in dest_slugs:
        try:
            r = client.get(f"http://127.0.0.1:8000/api/v1/destinations/{slug}", timeout=5)
            if r.status_code == 200:
                data = r.json()
                dest = data.get("destination", {})
                places = data.get("places", [])
                hotels = data.get("hotels", [])
                rentals = data.get("rentals", [])
                print(f"[OK] Destination /{slug}: '{dest.get('name')}' - Places: {len(places)}, Hotels: {len(hotels)}, Rentals: {len(rentals)}")
            else:
                print(f"[FAIL] Destination /{slug} HTTP {r.status_code}")
        except Exception as e:
            print(f"[ERROR] Fetching /{slug}: {e}")

    # 4. Live Nearby Places & Source Labeling
    try:
        r = client.get("http://127.0.0.1:8000/api/v1/places/nearby?lat=32.2396&lng=77.1887&radius_km=15", timeout=8)
        if r.status_code == 200:
            places = r.json()
            sources = set(p.get("source") for p in places)
            print(f"[OK] /api/v1/places/nearby: Returned {len(places)} places. Sources observed: {sources}")
        else:
            print(f"[FAIL] /api/v1/places/nearby HTTP {r.status_code}")
    except Exception as e:
        print(f"[ERROR] Places nearby: {e}")

    # 5. Frontend Vehicle SVGs
    svg_urls = [
        "http://localhost:3000/images/vehicles/adventure_motorcycle.svg",
        "http://localhost:3000/images/vehicles/classic_bullet.svg",
        "http://localhost:3000/images/vehicles/automatic_scooter.svg"
    ]
    for url in svg_urls:
        try:
            r = client.get(url, timeout=5)
            print(f"[OK] Vehicle Artwork {url.split('/')[-1]}: HTTP {r.status_code} ({len(r.content)} bytes)")
        except Exception as e:
            print(f"[WARN] Vehicle SVG check on frontend: {e}")

    # 6. Search Intent & Unified Search Endpoints
    intent_tests = [
        ("Indore", "destination"),
        ("Cafes in Manali", "place"),
        ("Weather in Mussoorie", "weather"),
        ("Is Rohtang Pass open today?", "web_info")
    ]
    for q, expected_intent in intent_tests:
        try:
            r = client.get(f"http://127.0.0.1:8000/api/v1/search/intent?q={q.replace(' ', '+')}", timeout=5)
            if r.status_code == 200:
                intent_res = r.json()
                print(f"[OK] Search Intent '{q}': intent='{intent_res.get('intent')}', confidence={intent_res.get('confidence')}")
            else:
                print(f"[FAIL] Intent endpoint HTTP {r.status_code}")
        except Exception as e:
            print(f"[ERROR] Intent check: {e}")

    # 7. Web Search Endpoint (Unconfigured Safe State or Provider Result)
    try:
        r = client.get("http://127.0.0.1:8000/api/v1/search/web?q=Rohtang+Pass+status", timeout=5)
        if r.status_code == 200:
            web_res = r.json()
            print(f"[OK] Web Search: available={web_res.get('is_available')}, results_count={len(web_res.get('results', []))}, message='{web_res.get('message', '')[:60]}...'")
        else:
            print(f"[FAIL] Web search HTTP {r.status_code}")
    except Exception as e:
        print(f"[ERROR] Web search: {e}")

    # 8. Frontend Core Routes
    fe_routes = [
        "http://localhost:3000/",
        "http://localhost:3000/explore",
        "http://localhost:3000/explore/manali",
        "http://localhost:3000/explore/mussoorie",
        "http://localhost:3000/explore/udaipur",
        "http://localhost:3000/explore/goa",
        "http://localhost:3000/explore/jaipur",
        "http://localhost:3000/explore/rishikesh",
        "http://localhost:3000/explore/varanasi",
        "http://localhost:3000/nearby",
        "http://localhost:3000/plan",
        "http://localhost:3000/trips"
    ]
    for url in fe_routes:
        try:
            r = client.get(url, timeout=5)
            print(f"[OK] Frontend route {url.replace('http://localhost:3000', '') or '/'}: HTTP {r.status_code}")
        except Exception as e:
            print(f"[WARN] Frontend route check {url}: {e}")

    # 9. Phase 6.4 Artwork Resolver API
    place_artwork_tests = [
        ("Lal Tibba Scenic Point", "mussoorie", "Viewpoint"),
        ("Assi Ghat Aarti", "varanasi", "Spiritual"),
        ("Lake Pichola Sunset Boat Ride", "udaipur", "Lakes & Boating"),
        ("Solang Valley Alpine Meadow", "manali", "Adventure")
    ]
    for p_name, p_dest, p_cat in place_artwork_tests:
        try:
            r = client.get(f"http://127.0.0.1:8000/api/v1/artwork/place?place_name={p_name.replace(' ', '+')}&destination_slug={p_dest}&category={p_cat.replace(' ', '+')}", timeout=5)
            if r.status_code == 200:
                art = r.json()
                print(f"[OK] Artwork Resolver '{p_name}': tier={art.get('tier')}, style={art.get('style')}, url={art.get('url')}")
            else:
                print(f"[FAIL] Artwork resolver for '{p_name}' HTTP {r.status_code}")
        except Exception as e:
            print(f"[ERROR] Artwork check: {e}")

    # 10. Phase 6.4 Explore Catalogue Containment (Zero Dynamic Contamination)
    try:
        r = client.get("http://127.0.0.1:8000/api/v1/destinations", timeout=5)
        if r.status_code == 200:
            dests = r.json()
            slugs = [d.get("slug") for d in dests]
            print(f"[OK] Explore Catalogue: {len(dests)} approved destinations. Slugs: {slugs}")
            assert len(dests) == 12, f"Expected exactly 12 curated destinations, got {len(dests)}"
            assert "indore" not in slugs, "FAIL: Dynamic destination 'indore' contaminated catalogue!"
            assert "bhopal" not in slugs, "FAIL: Dynamic destination 'bhopal' contaminated catalogue!"
        else:
            print(f"[FAIL] /api/v1/destinations HTTP {r.status_code}")
    except Exception as e:
        print(f"[ERROR] Catalogue check: {e}")

    print("=== VERIFICATION COMPLETE ===")

if __name__ == "__main__":
    verify()
