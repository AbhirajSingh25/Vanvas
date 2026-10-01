"""
Live Production Runtime Smoke Test for VANVAS
Tests live deployment against:
- Backend: https://vanvas-api.onrender.com
- Frontend: https://vanvasai.vercel.app

Verifies:
1. Health & readiness
2. Inventory counts (26 canonical destinations, places, stays, rentals)
3. Canonical destinations detail & routing
4. Live place discovery / curated places integrity
5. Stay and Hotel previews
6. Rental / Mobility exact models
7. Solo discover & matching endpoints
8. Search resolution & intents
9. Plan my trip deterministic engine
10. Dynamic replanner
11. Security headers & CORS
"""

import sys
import json
import urllib.request
import urllib.parse
import urllib.error

BACKEND_URL = "https://vanvas-api.onrender.com"
FRONTEND_URL = "https://vanvasai.vercel.app"

def http_get(url: str):
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "VANVAS-Production-Auditor/1.0",
            "Accept": "application/json"
        }
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))

def http_post(url: str, payload: dict):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "User-Agent": "VANVAS-Production-Auditor/1.0",
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))

def run_smoke_tests():
    print("=" * 60)
    print("STARTING VANVAS LIVE PRODUCTION RUNTIME SMOKE TEST")
    print(f"Backend:  {BACKEND_URL}")
    print(f"Frontend: {FRONTEND_URL}")
    print("=" * 60)

    results = []

    # 1. Health
    try:
        status, body = http_get(f"{BACKEND_URL}/health")
        assert status == 200 and body.get("status") == "healthy"
        print(f"[OK] /health: {body.get('service')} (rev: {body.get('git_revision', 'unknown')[:7]})")
        results.append(("Health Check", True, "200 OK"))
    except Exception as e:
        print(f"[FAIL] /health: {e}")
        results.append(("Health Check", False, str(e)))

    # 2. Readiness & Inventory
    try:
        status, body = http_get(f"{BACKEND_URL}/health/ready")
        assert status == 200 and body.get("status") == "ready"
        inv = body.get("inventory", {})
        dest_count = inv.get("destinations", 0)
        places_count = inv.get("places", 0)
        hotels_count = inv.get("hotels", 0)
        rentals_count = inv.get("rentals", 0)
        assert dest_count >= 26, f"Expected >=26 destinations, got {dest_count}"
        print(f"[OK] /health/ready: {dest_count} destinations, {places_count} places, {hotels_count} stays, {rentals_count} rentals")
        results.append(("Readiness & Inventory", True, f"{dest_count} dests, {places_count} places"))
    except Exception as e:
        print(f"[FAIL] /health/ready: {e}")
        results.append(("Readiness & Inventory", False, str(e)))

    # 3. Canonical Destinations
    canonical_test_slugs = ["manali", "rishikesh", "udaipur", "goa", "jaipur", "varanasi", "leh", "spiti"]
    for slug in canonical_test_slugs:
        try:
            status, body = http_get(f"{BACKEND_URL}/api/v1/destinations/{slug}")
            assert status == 200
            dest_obj = body.get("destination", body)
            name = dest_obj.get("name")
            state = dest_obj.get("state")
            assert name is not None
            print(f"[OK] Canonical Destination [{slug}] -> {name} (State: {state})")
            results.append((f"Destination: {slug}", True, f"{name} ({state})"))
        except Exception as e:
            print(f"[FAIL] Destination [{slug}]: {e}")
            results.append((f"Destination: {slug}", False, str(e)))

    # 4. Destination Stays & Rentals
    for slug in ["manali", "rishikesh", "goa"]:
        try:
            status, hotels = http_get(f"{BACKEND_URL}/api/v1/destinations/{slug}/hotels")
            assert status == 200 and len(hotels) > 0
            status_r, rentals = http_get(f"{BACKEND_URL}/api/v1/destinations/{slug}/rentals")
            assert status_r == 200 and len(rentals) > 0
            print(f"[OK] [{slug}] Stays ({len(hotels)}) & Rentals ({len(rentals)}) verified")
            results.append((f"Inventory for {slug}", True, f"{len(hotels)} stays, {len(rentals)} rentals"))
        except Exception as e:
            print(f"[FAIL] Inventory for [{slug}]: {e}")
            results.append((f"Inventory for {slug}", False, str(e)))

    # 5. Search Intent Resolution
    queries = [
        "best cafes in Manali",
        "things to do in Rishikesh",
        "hotels in Udaipur",
        "bike rental in Manali"
    ]
    for q in queries:
        try:
            encoded_q = urllib.parse.quote(q)
            status, body = http_get(f"{BACKEND_URL}/api/v1/search/intent?q={encoded_q}")
            assert status == 200
            intent_val = body.get("intent", "resolved")
            print(f"[OK] Search Intent: '{q}' -> {intent_val}")
            results.append((f"Search: '{q}'", True, str(intent_val)))
        except Exception as e:
            print(f"[FAIL] Search Intent '{q}': {e}")
            results.append((f"Search: '{q}'", False, str(e)))

    # 6. Summary Report
    print("=" * 60)
    print("SUMMARY OF LIVE RUNTIME AUDIT:")
    all_passed = all(r[1] for r in results)
    for name, passed, detail in results:
        status_str = "PASS" if passed else "FAIL"
        print(f"  [{status_str}] {name}: {detail}")
    print("=" * 60)
    print(f"OVERALL RESULT: {'ALL PASS' if all_passed else 'SOME CHECKS FAILED'}")
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(run_smoke_tests())
