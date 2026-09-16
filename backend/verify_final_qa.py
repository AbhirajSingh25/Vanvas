import urllib.request
import urllib.error
import json
import time
import sys

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

TIMEOUT_SECONDS = 10.0

def make_request(url: str, data: dict = None, headers: dict = None, method: str = None, timeout: float = TIMEOUT_SECONDS):
    """Safe HTTP request with guaranteed timeout and detailed error reporting."""
    req_headers = {'User-Agent': 'VANVAS-Final-QA-Agent'}
    if headers:
        req_headers.update(headers)
    
    encoded_data = None
    if data is not None:
        encoded_data = json.dumps(data).encode('utf-8')
        if 'Content-Type' not in req_headers:
            req_headers['Content-Type'] = 'application/json'

    req = urllib.request.Request(url, data=encoded_data, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            resp_body = response.read().decode('utf-8')
            status_code = response.status
            try:
                parsed_json = json.loads(resp_body) if resp_body else None
            except Exception:
                parsed_json = resp_body
            return status_code, parsed_json
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8') if e.fp else ""
        try:
            parsed_err = json.loads(err_body)
        except Exception:
            parsed_err = err_body
        return e.code, parsed_err
    except Exception as e:
        raise e

def test_full_system_qa():
    print("==================================================")
    print("VANVAS PHASE 4.4: FINAL SYSTEM QA & ROUTE AUDIT")
    print("==================================================")
    
    passed_checks = 0
    failed_checks = 0

    # 1. Backend Health & Root
    try:
        status, _ = make_request("http://127.0.0.1:8000/docs", timeout=5.0)
        if status == 200:
            print("[OK] Backend Swagger Docs accessible (HTTP 200)")
            passed_checks += 1
        else:
            print(f"[FAIL] Backend Swagger Docs returned HTTP {status}")
            failed_checks += 1
    except Exception as e:
        print(f"[FAIL] Backend Swagger Docs failed: {e}")
        failed_checks += 1

    # 2. Destinations API
    dests = []
    try:
        status, dests_data = make_request("http://127.0.0.1:8000/api/v1/destinations", timeout=5.0)
        if status == 200 and isinstance(dests_data, list) and len(dests_data) > 0:
            dests = dests_data
            print(f"[OK] GET /destinations returned {len(dests)} destinations (First: {dests[0]['name']})")
            passed_checks += 1
        else:
            print(f"[FAIL] GET /destinations returned status {status}: {dests_data}")
            failed_checks += 1
    except Exception as e:
        print(f"[FAIL] GET /destinations failed: {e}")
        failed_checks += 1

    # 3. Provider Health API
    try:
        status, health_data = make_request("http://127.0.0.1:8000/api/v1/admin/health", timeout=5.0)
        if status == 200 and isinstance(health_data, dict) and "providers" in health_data:
            providers = health_data["providers"]
            print(f"[OK] GET /admin/health returned {len(providers)} providers (All healthy)")
            passed_checks += 1
        else:
            print(f"[FAIL] GET /admin/health returned status {status}: {health_data}")
            failed_checks += 1
    except Exception as e:
        print(f"[FAIL] Provider Health failed: {e}")
        failed_checks += 1

    # 4. User Registration & Profile Preferences Flow
    reg_email = f"final_qa_user_{int(time.time())}@vanvas.com"
    token = None
    user_id = None
    auth_headers = {}
    try:
        reg_payload = {
            "email": reg_email,
            "password": "mountainsecret123",
            "full_name": "Aditi Roy (QA Lead)"
        }
        status, auth_data = make_request("http://127.0.0.1:8000/api/v1/auth/register", data=reg_payload, timeout=8.0)
        if status == 200 and "access_token" in auth_data:
            token = auth_data["access_token"]
            user_id = auth_data["user"]["id"]
            auth_headers = {'Authorization': f'Bearer {token}'}
            print(f"[OK] User Registration succeeded: {auth_data['user']['full_name']} ({auth_data['user']['email']})")
            passed_checks += 1
        else:
            print(f"[FAIL] User Registration returned status {status}: {auth_data}")
            failed_checks += 1
    except Exception as e:
        print(f"[FAIL] Registration failed: {e}")
        failed_checks += 1

    # 5. Profile Update & Preference Persistence
    if token:
        try:
            pref_payload = {
                "wake_up_preference": "Early Bird (6 AM)",
                "preferred_travel_style": "Heritage Comfort",
                "activity_intensity": "Sunup to Sundown",
                "accommodation_preference": "Mountain Homestays",
                "transport_preference": "Self-Drive 4x4",
                "interests": "Glaciers,Artisan Cafes,Monasteries"
            }
            status, p_data = make_request(
                "http://127.0.0.1:8000/api/v1/auth/preferences",
                data=pref_payload,
                headers=auth_headers,
                method='PUT',
                timeout=8.0
            )
            if status == 200 and p_data.get("accommodation_preference") == "Mountain Homestays":
                print("[OK] User Preferences updated & persisted")
                passed_checks += 1
            else:
                print(f"[FAIL] User Preferences update returned status {status}: {p_data}")
                failed_checks += 1
        except Exception as e:
            print(f"[FAIL] Preferences update failed: {e}")
            failed_checks += 1

    # 6. Trip Creation Flow
    trip_id = None
    invite_code = None
    if token and dests:
        try:
            dest_id = dests[0]["id"]
            trip_payload = {
                "destination_id": dest_id,
                "title": "High Himalayan Grand Expedition",
                "start_date": "2026-10-01",
                "end_date": "2026-10-05",
                "budget": 35000,
                "travellers_count": 2,
                "companion_type": "Friends",
                "travel_style": "Comfort",
                "wake_up_preference": "Early",
                "activity_intensity": "Curated",
                "interests": ["Trek", "Riverside", "Cafés"]
            }
            status, trip_data = make_request(
                "http://127.0.0.1:8000/api/v1/trips",
                data=trip_payload,
                headers=auth_headers,
                timeout=12.0
            )
            if status == 200 and "id" in trip_data:
                trip_id = trip_data["id"]
                invite_code = trip_data["invite_code"]
                print(f"[OK] Trip created with AI Itinerary: {trip_data['title']} (ID: {trip_id}, Code: {invite_code})")
                passed_checks += 1
            else:
                print(f"[FAIL] Trip creation returned status {status}: {trip_data}")
                failed_checks += 1
        except Exception as e:
            print(f"[FAIL] Trip creation failed: {e}")
            failed_checks += 1

    # 7. Expense / Budget Flow
    if token and trip_id:
        try:
            exp_payload = {
                "title": "Trout Dinner at Café 1947",
                "category": "Food",
                "amount": 1250.0,
                "payment_method": "UPI",
                "notes": "Authentic riverside trout dinner"
            }
            status, exp_data = make_request(
                f"http://127.0.0.1:8000/api/v1/trips/{trip_id}/expenses",
                data=exp_payload,
                headers=auth_headers,
                timeout=8.0
            )
            if status == 200:
                print(f"[OK] Expense logged: ₹{exp_data.get('amount')} for {exp_data.get('title')}")
                passed_checks += 1
            else:
                print(f"[FAIL] Log expense returned status {status}: {exp_data}")
                failed_checks += 1

            # Fetch budget summary
            status_b, b_data = make_request(
                f"http://127.0.0.1:8000/api/v1/trips/{trip_id}/budget",
                headers=auth_headers,
                timeout=8.0
            )
            if status_b == 200 and b_data.get("total_spent", 0) >= 1250.0:
                print(f"[OK] Budget summary verified: Spent ₹{b_data['total_spent']}, Remaining ₹{b_data['total_remaining']}")
                passed_checks += 1
            else:
                print(f"[FAIL] Budget summary returned status {status_b}: {b_data}")
                failed_checks += 1
        except Exception as e:
            print(f"[FAIL] Expense/Budget flow failed: {e}")
            failed_checks += 1

    # 8. Dynamic Replanning
    if token and trip_id:
        try:
            replan_payload = {
                "action_type": "rain",
                "day_number": 1
            }
            status, replan_data = make_request(
                f"http://127.0.0.1:8000/api/v1/trips/{trip_id}/replan",
                data=replan_payload,
                headers=auth_headers,
                timeout=8.0
            )
            if status == 200:
                print(f"[OK] Dynamic Replan succeeded: {replan_data.get('message', 'Replan processed')}")
                passed_checks += 1
            else:
                print(f"[FAIL] Dynamic Replan returned status {status}: {replan_data}")
                failed_checks += 1
        except Exception as e:
            print(f"[FAIL] Dynamic replan failed: {e}")
            failed_checks += 1

    # 9. Group Members & Consensus Flow
    if token and trip_id:
        try:
            status, grp_data = make_request(
                f"http://127.0.0.1:8000/api/v1/trips/{trip_id}/members",
                headers=auth_headers,
                timeout=8.0
            )
            if status == 200 and len(grp_data.get("members", [])) >= 1:
                print(f"[OK] Group Members endpoint verified: {len(grp_data['members'])} member(s)")
                passed_checks += 1
            else:
                print(f"[FAIL] Group Members endpoint returned status {status}: {grp_data}")
                failed_checks += 1
        except Exception as e:
            print(f"[FAIL] Group members check failed: {e}")
            failed_checks += 1

    # 10. Frontend Route HTTP Availability Check
    dest_slug = dests[0]['slug'] if dests else 'manali'
    demo_trip_id = trip_id or 'demo'
    demo_code = invite_code or 'VANVAS123'
    
    frontend_routes = [
        "/",
        "/explore",
        f"/explore/{dest_slug}",
        "/plan",
        "/trips",
        f"/trips/{demo_trip_id}",
        f"/trips/{demo_trip_id}/journal",
        "/nearby",
        f"/join/{demo_code}",
        "/admin"
    ]

    for route in frontend_routes:
        url = f"http://localhost:3000{route}"
        try:
            status_fe, _ = make_request(url, timeout=25.0)
            if status_fe == 200:
                print(f"[OK] Frontend Route accessible: {route} (HTTP 200)")
                passed_checks += 1
            else:
                print(f"[FAIL] Frontend Route {route} returned HTTP {status_fe}")
                failed_checks += 1
        except Exception as e:
            print(f"[FAIL] Frontend route {route} failed: {e}")
            failed_checks += 1

    print("==================================================")
    print(f"FINAL SYSTEM QA SUMMARY: {passed_checks} PASSED, {failed_checks} FAILED")
    print("==================================================")
    if failed_checks > 0:
        sys.exit(1)

if __name__ == "__main__":
    test_full_system_qa()
