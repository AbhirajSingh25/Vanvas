"""
Real Gemini End-to-End Test for Phase 7 Copilot Actions.
Validates:
- Real Gemini (gemini-3.5-flash-lite) API call
- Model invokes save_place / add_place_to_itinerary tool
- CopilotActionService executes mutation
- Database record is created
- No OpenAI request occurs
- Clean teardown of disposable records
"""
import pytest
import os
from datetime import date, timedelta, datetime, timezone
from fastapi.testclient import TestClient

from app.main import app
from app.database.session import SessionLocal
from app.models.models import (
    User, Destination, Place, Trip, TripMember, Itinerary, ItineraryItem, SavedPlace, Conversation, ConversationMessage
)
from app.core.security import create_access_token, get_password_hash
from app.core.config import settings
from app.providers.ai.factory import AIFactory
from app.providers.ai.gemini_provider import GeminiProvider

client = TestClient(app)


def test_real_gemini_action_execution():
    api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
    if not api_key:
        pytest.skip("GEMINI_API_KEY not configured in settings or environment.")


    session = SessionLocal()
    try:
        # 1. Setup disposable user, destination, place, trip
        user = session.query(User).filter(User.email == "e2e_gemini_action@vanvas.com").first()
        if not user:
            user = User(
                id="usr-e2e-action",
                email="e2e_gemini_action@vanvas.com",
                hashed_password=get_password_hash("GeminiAction123!"),
                full_name="E2E Gemini Action Traveller",
                role="traveller",
                email_verified_at=datetime.now(timezone.utc),
            )
            session.add(user)
            session.commit()
            session.refresh(user)

        dest = session.query(Destination).filter(Destination.slug == "mussoorie").first()
        if not dest:
            dest = Destination(
                id="dest-mussoorie-e2e",
                name="Mussoorie",
                slug="mussoorie",
                state="Uttarakhand",
                region="Garhwal",
                tagline="Queen of the Hills",
                description="Hill station in the Garhwal Himalayas",
                latitude=30.4598,
                longitude=78.0644,
            )
            session.add(dest)
            session.commit()
            session.refresh(dest)

        place = session.query(Place).filter(Place.id == "mussoorie_landour_bakehouse").first()
        if not place:
            place = Place(
                id="mussoorie_landour_bakehouse",
                destination_id=dest.id,
                name="Landour Bakehouse",
                slug="landour-bakehouse",
                category="Café",
                description="Historic bakery in Landour serving authentic fresh pastries and mountain coffee",
                latitude=30.4590,
                longitude=78.0860,
                approx_cost=400.0,
                recommended_duration_mins=60,
                why_vanvas_recommends="Fresh cinnamon rolls and calm heritage charm.",
            )
            session.add(place)
            session.commit()
            session.refresh(place)

        trip = session.query(Trip).filter(Trip.id == "trip-e2e-gemini-1").first()
        if not trip:
            trip = Trip(
                id="trip-e2e-gemini-1",
                user_id=user.id,
                destination_id=dest.id,
                title="E2E Action Trip to Mussoorie",
                start_date=date.today(),
                end_date=date.today() + timedelta(days=2),
                num_days=3,
                budget_total=15000.0,
                budget_spent=0.0,
            )
            session.add(trip)
            session.flush()

            it1 = Itinerary(id="it-e2e-1", trip_id=trip.id, day_number=1, date=date.today(), title="Day 1: Arrival")
            it2 = Itinerary(id="it-e2e-2", trip_id=trip.id, day_number=2, date=date.today() + timedelta(days=1), title="Day 2: Exploration")
            session.add(it1)
            session.add(it2)
            session.commit()
            session.refresh(trip)

        token = create_access_token(subject=user.id)
        headers = {"Authorization": f"Bearer {token}"}

        # Verify AI provider is Gemini
        provider = AIFactory.get_provider()
        assert isinstance(provider, GeminiProvider)
        assert "gemini" in provider.name.lower()

        # Clean prior saved place if present
        session.query(SavedPlace).filter(SavedPlace.user_id == user.id, SavedPlace.place_id == place.id).delete()
        session.commit()

        # Test A: "Save this place" natural language request
        res_save = client.post(
            "/api/v1/copilot/chat",
            headers=headers,
            json={
                "message": f"Save {place.name} (place ID: {place.id}) to my saved places collection.",
                "trip_id": trip.id,
            }
        )
        assert res_save.status_code == 200
        save_data = res_save.json()
        assert "message" in save_data
        assert save_data.get("metadata", {}).get("provider") == "gemini"

        # Verify SavedPlace exists in DB
        saved_entry = session.query(SavedPlace).filter(
            SavedPlace.user_id == user.id,
            SavedPlace.place_id == place.id
        ).first()
        assert saved_entry is not None, "SavedPlace record must exist in DB after save action"

        # Test B: "Add to day 2 of my trip" natural language request
        res_add = client.post(
            "/api/v1/copilot/chat",
            headers=headers,
            json={
                "message": f"Add {place.name} (place ID: {place.id}) to day 2 of my trip {trip.id}.",
                "trip_id": trip.id,
                "conversation_id": save_data.get("conversation_id"),
            }
        )
        assert res_add.status_code == 200
        add_data = res_add.json()
        assert "message" in add_data
        assert add_data.get("metadata", {}).get("provider") == "gemini"

        # Verify ItineraryItem exists on Day 2 in DB
        it_day_2 = session.query(Itinerary).filter(Itinerary.trip_id == trip.id, Itinerary.day_number == 2).first()
        assert it_day_2 is not None
        added_item = session.query(ItineraryItem).filter(
            ItineraryItem.itinerary_id == it_day_2.id,
            ItineraryItem.place_id == place.id
        ).first()
        assert added_item is not None, "ItineraryItem must exist on Day 2 after add action"

        # Verify conversation message persisted
        conv_id = add_data.get("conversation_id")
        conv_msgs = session.query(ConversationMessage).filter(ConversationMessage.conversation_id == conv_id).all()
        assert len(conv_msgs) >= 4  # 2 user + 2 assistant messages

    finally:
        # Cleanup disposable records
        try:
            if 'trip' in locals() and trip:
                session.query(ItineraryItem).filter(ItineraryItem.itinerary_id.in_([it.id for it in trip.itineraries])).delete(synchronize_session=False)
                session.query(Itinerary).filter(Itinerary.trip_id == trip.id).delete(synchronize_session=False)
                session.query(ConversationMessage).filter(ConversationMessage.conversation_id.in_([c.id for c in trip.conversations])).delete(synchronize_session=False)
                session.query(Conversation).filter(Conversation.trip_id == trip.id).delete(synchronize_session=False)
                session.query(TripMember).filter(TripMember.trip_id == trip.id).delete(synchronize_session=False)
                session.query(Trip).filter(Trip.id == trip.id).delete(synchronize_session=False)
            if 'user' in locals() and user:
                session.query(SavedPlace).filter(SavedPlace.user_id == user.id).delete(synchronize_session=False)
                session.query(ConversationMessage).filter(ConversationMessage.conversation_id.in_(
                    session.query(Conversation.id).filter(Conversation.user_id == user.id)
                )).delete(synchronize_session=False)
                session.query(Conversation).filter(Conversation.user_id == user.id).delete(synchronize_session=False)
                session.query(User).filter(User.id == user.id).delete(synchronize_session=False)
            session.commit()
        except Exception as e:
            session.rollback()
        finally:
            session.close()
