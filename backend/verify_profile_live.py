import json
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models.models import User, UserPreference

client = TestClient(app)

def test_live_profile_flow():
    print("--- 1. Testing Registration with Default Preferences ---")
    user_payload = {
        "email": "himalayan_nomad_live@vanvas.com",
        "password": "mountainsecret123",
        "full_name": "Devrat Sen"
    }
    
    # Try register or login if already exists
    reg_res = client.post("/api/v1/auth/register", json=user_payload)
    if reg_res.status_code == 200:
        auth_data = reg_res.json()
        print("[SUCCESS] User registered successfully!")
    else:
        print("[INFO] User already registered, logging in...")
        login_res = client.post("/api/v1/auth/login", json={
            "email": user_payload["email"],
            "password": user_payload["password"]
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        auth_data = login_res.json()
        print("[SUCCESS] Logged in successfully!")

    token = auth_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    print("\n--- 2. Fetching Authenticated Profile (/auth/me) ---")
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200, f"Get me failed: {me_res.text}"
    user_info = me_res.json()
    print(f"[SUCCESS] User profile retrieved: {user_info['full_name']} ({user_info['email']})")
    print(f"Current Preferences: {json.dumps(user_info.get('preferences'), indent=2)}")

    print("\n--- 3. Updating Preferences Directly (/auth/preferences) ---")
    pref_update = {
        "preferred_travel_style": "Comfort",
        "wake_up_preference": "Early",
        "activity_intensity": "Packed",
        "dietary_preference": "Veg",
        "interests": "Nature,Cafés,Photography,Treks",
        "accommodation_preference": "Boutique Heritage & Stone Havelis",
        "transport_preference": "Self-Drive SUV / 4x4",
        "companion_style": "Solo"
    }
    pref_res = client.put("/api/v1/auth/preferences", json=pref_update, headers=headers)
    assert pref_res.status_code == 200, f"Update preferences failed: {pref_res.text}"
    updated_pref = pref_res.json()
    assert updated_pref["preferred_travel_style"] == "Comfort"
    assert updated_pref["wake_up_preference"] == "Early"
    assert updated_pref["accommodation_preference"] == "Boutique Heritage & Stone Havelis"
    print(f"[SUCCESS] Preferences updated directly: {updated_pref}")

    print("\n--- 4. Updating Full Profile (/auth/profile) ---")
    profile_update = {
        "full_name": "Devrat Sen (Himalayan Wanderer)",
        "preferred_travel_style": "Premium",
        "wake_up_preference": "Late",
        "activity_intensity": "Relaxed",
        "interests": "Glaciers,Bonfires,Stargazing",
        "companion_style": "Couple"
    }
    profile_res = client.put("/api/v1/auth/profile", json=profile_update, headers=headers)
    assert profile_res.status_code == 200, f"Update profile failed: {profile_res.text}"
    updated_user = profile_res.json()
    assert updated_user["full_name"] == "Devrat Sen (Himalayan Wanderer)"
    assert updated_user["preferences"]["preferred_travel_style"] == "Premium"
    assert updated_user["preferences"]["wake_up_preference"] == "Late"
    assert updated_user["preferences"]["activity_intensity"] == "Relaxed"
    assert updated_user["preferences"]["companion_style"] == "Couple"
    # Preserved previously set fields
    assert updated_user["preferences"]["accommodation_preference"] == "Boutique Heritage & Stone Havelis"
    assert updated_user["preferences"]["transport_preference"] == "Self-Drive SUV / 4x4"
    print(f"[SUCCESS] Full profile and preserved preferences verified: {updated_user['full_name']}")

    print("\n--- 5. Verify Persistence on Fresh /auth/me Request ---")
    fresh_me_res = client.get("/api/v1/auth/me", headers=headers)
    assert fresh_me_res.status_code == 200
    fresh_data = fresh_me_res.json()
    assert fresh_data["full_name"] == "Devrat Sen (Himalayan Wanderer)"
    assert fresh_data["preferences"]["preferred_travel_style"] == "Premium"
    assert fresh_data["preferences"]["accommodation_preference"] == "Boutique Heritage & Stone Havelis"
    print("[SUCCESS] Verified persistence on fresh request!")

    print("\n==========================================")
    print("ALL LIVE PROFILE & PREFERENCE CHECKS PASSED!")
    print("==========================================")

if __name__ == "__main__":
    test_live_profile_flow()
