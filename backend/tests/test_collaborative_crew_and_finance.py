"""
VANVAS Test Suite: Crew Circles, Collaborative Travel & Smart Expense Ecosystem
Comprehensive validation of:
- Permanent VANVAS ID and Friend Lifecycle
- Crew Circles & Collaborative Trip Workspace
- Split Pods & Strict Financial Isolation
- Smart Finance 3-Layer Architecture (Forecast, Main Ledger, Subgroup Pods)
- Multi-payer support, split calculations in paise, audit logging, optimistic locking
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
import json

from app.main import app
from app.models.models import User, generate_uuid, generate_vanvas_id, TripBudgetPlan, TripBudgetItem, Expense, ExpenseShare, SettlementPayment
from app.core.security import create_access_token, get_password_hash
from app.database.session import SessionLocal

client = TestClient(app)


def create_test_user(db: Session, email: str, name: str) -> tuple[User, str]:
    user = User(
        id=generate_uuid(),
        email=email,
        full_name=name,
        hashed_password=get_password_hash("testpassword123"),
        vanvas_id=generate_vanvas_id()
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(subject=user.id)
    return user, token


@pytest.fixture
def test_users():
    db = SessionLocal()
    u1, t1 = create_test_user(db, f"user1_{generate_uuid()[:8]}@example.com", "Aarav Sharma")
    u2, t2 = create_test_user(db, f"user2_{generate_uuid()[:8]}@example.com", "Diya Patel")
    u3, t3 = create_test_user(db, f"user3_{generate_uuid()[:8]}@example.com", "Kabir Mehta")
    u4, t4 = create_test_user(db, f"user4_{generate_uuid()[:8]}@example.com", "Isha Verma")
    u5, t5 = create_test_user(db, f"user5_{generate_uuid()[:8]}@example.com", "Rohan Joshi")
    yield {"u1": u1, "t1": t1, "u2": u2, "t2": t2, "u3": u3, "t3": t3, "u4": u4, "t4": t4, "u5": u5, "t5": t5}
    db.close()


def test_vanvas_id_and_friend_request_lifecycle(test_users):
    u1, t1 = test_users["u1"], test_users["t1"]
    u2, t2 = test_users["u2"], test_users["t2"]

    # 1. Fetch own VANVAS ID
    r = client.get("/api/v1/friends/me/vanvas-id", headers={"Authorization": f"Bearer {t1}"})
    assert r.status_code == 200
    vnv_id_1 = r.json()["vanvas_id"]
    assert vnv_id_1.startswith("VNV-")

    # 2. Lookup user by VANVAS ID
    r = client.get(f"/api/v1/friends/lookup/{vnv_id_1}", headers={"Authorization": f"Bearer {t2}"})
    assert r.status_code == 200
    profile = r.json()
    assert profile["id"] == u1.id
    assert profile["full_name"] == u1.full_name
    assert profile["friendship_status"] == "none"

    # 3. Cannot send friend request to self
    r = client.post("/api/v1/friends/requests", json={"target_user_id": u1.id}, headers={"Authorization": f"Bearer {t1}"})
    assert r.status_code == 400

    # 4. User 2 sends friend request to User 1
    r = client.post("/api/v1/friends/requests", json={"target_user_id": u1.id}, headers={"Authorization": f"Bearer {t2}"})
    assert r.status_code == 200
    req_id = r.json()["id"]

    # 5. User 1 checks incoming requests
    r = client.get("/api/v1/friends/requests/incoming", headers={"Authorization": f"Bearer {t1}"})
    assert r.status_code == 200
    incoming = r.json()
    assert len(incoming) >= 1
    assert any(x["id"] == req_id for x in incoming)

    # 6. User 1 accepts the request
    r = client.post(f"/api/v1/friends/requests/{req_id}/accept", headers={"Authorization": f"Bearer {t1}"})
    assert r.status_code == 200

    # 7. Verify both are friends
    r1 = client.get("/api/v1/friends", headers={"Authorization": f"Bearer {t1}"})
    assert r1.status_code == 200
    assert any(f["friend_id"] == u2.id for f in r1.json())

    r2 = client.get("/api/v1/friends", headers={"Authorization": f"Bearer {t2}"})
    assert r2.status_code == 200
    assert any(f["friend_id"] == u1.id for f in r2.json())


def test_crew_circles_crud_and_suggestions(test_users):
    u1, t1 = test_users["u1"], test_users["t1"]
    u2, t2 = test_users["u2"], test_users["t2"]
    u3, t3 = test_users["u3"], test_users["t3"]

    # Create Circle
    r = client.post("/api/v1/crew-circles", json={
        "name": "Himalayan Explorers",
        "description": "Annual mountain expedition crew",
        "initial_member_user_ids": [u2.id]
    }, headers={"Authorization": f"Bearer {t1}"})
    assert r.status_code == 200
    circle = r.json()
    circle_id = circle["id"]
    assert circle["name"] == "Himalayan Explorers"
    assert circle["member_count"] == 2

    # Add 3rd member
    r = client.post(f"/api/v1/crew-circles/{circle_id}/members", json={
        "user_id": u3.id,
        "role": "member"
    }, headers={"Authorization": f"Bearer {t1}"})
    assert r.status_code == 200

    # Add Suggestion
    r = client.post(f"/api/v1/crew-circles/{circle_id}/suggestions", json={
        "title": "Camp at Chandratal Lake",
        "suggestion_type": "place",
        "description": "Stargazing and lakeside campsite",
        "destination_slug": "spiti-valley"
    }, headers={"Authorization": f"Bearer {t2}"})
    assert r.status_code == 200
    sugg_id = r.json()["id"]

    # Vote on suggestion
    r = client.post(f"/api/v1/crew-circles/suggestions/{sugg_id}/vote", json={
        "vote_type": "UP"
    }, headers={"Authorization": f"Bearer {t3}"})
    assert r.status_code == 200
    assert r.json()["upvotes_count"] == 2


def test_layer1_budget_plan_forecast_zero_debts(test_users):
    u1, t1 = test_users["u1"], test_users["t1"]
    u2, t2 = test_users["u2"], test_users["t2"]

    # Create Circle
    r = client.post("/api/v1/crew-circles", json={
        "name": "Budget Test Circle",
        "initial_member_user_ids": [u2.id]
    }, headers={"Authorization": f"Bearer {t1}"})
    circle_id = r.json()["id"]

    # Create Budget Plan (Layer 1)
    r = client.post("/api/v1/finance/budget-plans", json={
        "circle_id": circle_id,
        "name": "Spiti 7-Day Plan Budget",
        "target_budget": 50000.0,
        "items": [
            {
                "name": "Tempo Traveller Rental",
                "category": "Transport",
                "amount": 28000.0,
                "calculation_basis": "FIXED",
                "split_scope": "EVERYONE"
            },
            {
                "name": "Homestay Dinners",
                "category": "Food",
                "amount": 7000.0,
                "calculation_basis": "PER_PERSON",
                "split_scope": "EVERYONE"
            }
        ]
    }, headers={"Authorization": f"Bearer {t1}"})
    assert r.status_code == 200
    plan = r.json()
    assert plan["total_planned_amount"] == 35000.0
    assert len(plan["items"]) == 2

    # Check Balances for Circle — MUST BE 0.0 because Plan Budget does not create debts!
    r = client.get(f"/api/v1/finance/balances?circle_id={circle_id}", headers={"Authorization": f"Bearer {t1}"})
    assert r.status_code == 200
    balances = r.json()
    assert balances["total_shared_expenses"] == 0.0
    assert balances["simplified_debts"] == []


def test_layer2_group_collaborative_expenses_paise_and_audit(test_users):
    u1, t1 = test_users["u1"], test_users["t1"]
    u2, t2 = test_users["u2"], test_users["t2"]
    u3, t3 = test_users["u3"], test_users["t3"]

    # Create Circle
    r = client.post("/api/v1/crew-circles", json={
        "name": "Ledger Circle",
        "initial_member_user_ids": [u2.id, u3.id]
    }, headers={"Authorization": f"Bearer {t1}"})
    circle_id = r.json()["id"]

    # User 1 pays ₹100.00 split equally among u1, u2, u3 (₹33.34, ₹33.33, ₹33.33)
    r = client.post("/api/v1/finance/expenses", json={
        "title": "Chai & Maggi",
        "amount": 100.0,
        "category": "Food",
        "circle_id": circle_id,
        "paid_by_user_id": u1.id,
        "split_method": "EQUAL",
        "participant_user_ids": [u1.id, u2.id, u3.id]
    }, headers={"Authorization": f"Bearer {t1}"})
    assert r.status_code == 200
    exp = r.json()
    assert exp["version"] == 1
    assert len(exp["shares"]) == 3
    # Check sum of shares equals 100.00 exactly down to the paise
    shares_sum = round(sum(s["owed_amount"] for s in exp["shares"]), 2)
    assert shares_sum == 100.0
    exp_id = exp["id"]

    # Test Optimistic Concurrency Conflict (client passes stale version 99)
    r = client.put(f"/api/v1/finance/expenses/{exp_id}", json={
        "title": "Chai & Maggi & Paratha",
        "amount": 150.0,
        "version": 99
    }, headers={"Authorization": f"Bearer {t1}"})
    assert r.status_code == 409

    # Update with correct version 1 -> should succeed and increment to version 2
    r = client.put(f"/api/v1/finance/expenses/{exp_id}", json={
        "title": "Chai & Maggi & Paratha",
        "amount": 150.0,
        "version": 1,
        "change_reason": "Added butter parathas"
    }, headers={"Authorization": f"Bearer {t1}"})
    assert r.status_code == 200
    updated = r.json()
    assert updated["version"] == 2
    assert updated["amount"] == 150.0
    assert len(updated["audit_logs"]) >= 2
    assert any(log["action"] == "UPDATED" for log in updated["audit_logs"])


def test_layer3_split_pods_and_strict_zero_leakage(test_users):
    """
    Verified Prompt Specification:
    5 members in group: A, B, C, D, E.
    A, B, C are in a 'Smokers Pod'.
    A pays ₹900 for cigarettes.
    Split: ₹300 each for A, B, C.
    D and E owe ₹0.00.
    In Main Group Ledger: ZERO debt, ₹0.00 leakage.
    In Pod Ledger: B owes A ₹300, C owes A ₹300.
    """
    u1, t1 = test_users["u1"], test_users["t1"]  # A
    u2, t2 = test_users["u2"], test_users["t2"]  # B
    u3, t3 = test_users["u3"], test_users["t3"]  # C
    u4, t4 = test_users["u4"], test_users["t4"]  # D
    u5, t5 = test_users["u5"], test_users["t5"]  # E

    # 1. Create Crew Circle with all 5 members
    r = client.post("/api/v1/crew-circles", json={
        "name": "Manali Crew 5",
        "initial_member_user_ids": [u2.id, u3.id, u4.id, u5.id]
    }, headers={"Authorization": f"Bearer {t1}"})
    assert r.status_code == 200
    circle_id = r.json()["id"]

    # 2. Create Split Pod for A, B, C
    r = client.post("/api/v1/split-pods", json={
        "circle_id": circle_id,
        "name": "Smokers Pod",
        "description": "Subgroup for cigarettes and late snacks",
        "initial_member_user_ids": [u2.id, u3.id]  # u1 is creator, automatically included
    }, headers={"Authorization": f"Bearer {t1}"})
    assert r.status_code == 200
    pod = r.json()
    pod_id = pod["id"]
    assert pod["member_count"] == 3

    # 3. Non-pod member (u4 / D) cannot view pod expenses or balances
    r = client.get(f"/api/v1/finance/balances?split_pod_id={pod_id}", headers={"Authorization": f"Bearer {t4}"})
    assert r.status_code == 403

    # 4. User 1 (A) logs ₹900 expense inside Smokers Pod
    r = client.post("/api/v1/finance/expenses", json={
        "title": "Cigarettes Pack",
        "amount": 900.0,
        "category": "Other",
        "circle_id": circle_id,
        "split_pod_id": pod_id,
        "paid_by_user_id": u1.id,
        "split_method": "EQUAL",
        "participant_user_ids": [u1.id, u2.id, u3.id]
    }, headers={"Authorization": f"Bearer {t1}"})
    assert r.status_code == 200
    exp = r.json()
    assert exp["amount"] == 900.0
    for s in exp["shares"]:
        assert s["owed_amount"] == 300.0

    # 5. Check Main Group Circle Balances -> STRICT ZERO LEAKAGE
    # Main group must have 0 shared expenses and 0 debts!
    r = client.get(f"/api/v1/finance/balances?circle_id={circle_id}", headers={"Authorization": f"Bearer {t1}"})
    assert r.status_code == 200
    circle_balances = r.json()
    assert circle_balances["total_shared_expenses"] == 0.0
    assert circle_balances["simplified_debts"] == []
    for m in circle_balances["members"]:
        assert m["net_balance"] == 0.0

    # 6. Check Split Pod Balances -> B owes A ₹300, C owes A ₹300
    r = client.get(f"/api/v1/finance/balances?split_pod_id={pod_id}", headers={"Authorization": f"Bearer {t1}"})
    assert r.status_code == 200
    pod_balances = r.json()
    assert pod_balances["total_shared_expenses"] == 900.0
    debts = pod_balances["simplified_debts"]
    assert len(debts) == 2
    for d in debts:
        assert d["creditor_user_id"] == u1.id
        assert d["amount"] == 300.0
        assert d["debtor_user_id"] in [u2.id, u3.id]

    # 7. Settle payment inside the Pod: B pays A ₹300
    r = client.post("/api/v1/finance/settlements", json={
        "split_pod_id": pod_id,
        "payer_user_id": u2.id,
        "receiver_user_id": u1.id,
        "amount": 300.0,
        "payment_method": "UPI"
    }, headers={"Authorization": f"Bearer {t2}"})
    assert r.status_code == 200

    # 8. Re-check Pod Balances -> Only C owes A ₹300 now; B is settled!
    r = client.get(f"/api/v1/finance/balances?split_pod_id={pod_id}", headers={"Authorization": f"Bearer {t1}"})
    assert r.status_code == 200
    updated_pod_balances = r.json()
    updated_debts = updated_pod_balances["simplified_debts"]
    assert len(updated_debts) == 1
    assert updated_debts[0]["debtor_user_id"] == u3.id
    assert updated_debts[0]["creditor_user_id"] == u1.id
    assert updated_debts[0]["amount"] == 300.0
