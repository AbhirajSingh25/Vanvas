import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime, Date, ForeignKey, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from app.database.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="traveller")  # 'traveller' or 'admin'
    avatar_url = Column(String(500), nullable=True)
    avatar_type = Column(String(50), default="preset", nullable=True)  # 'uploaded', 'preset'
    avatar_preset = Column(String(100), default="himalayan-explorer", nullable=True)
    avatar_storage_key = Column(String(255), nullable=True)
    email_verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    preferences = relationship("UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    solo_profile = relationship("SoloTravelerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    verification_tokens = relationship("EmailVerificationToken", back_populates="user", cascade="all, delete-orphan")
    verification_otps = relationship("EmailVerificationOTP", back_populates="user", cascade="all, delete-orphan")
    trips = relationship("Trip", back_populates="creator", cascade="all, delete-orphan")
    memberships = relationship("TripMember", back_populates="user", cascade="all, delete-orphan")
    votes = relationship("Vote", back_populates="user", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="user")
    saved_places = relationship("SavedPlace", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")
    solo_intents = relationship("SoloTripIntent", back_populates="user", cascade="all, delete-orphan")
    circle_memberships = relationship("CircleMember", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("UserNotification", back_populates="user", cascade="all, delete-orphan")

    @property
    def is_verified(self) -> bool:
        return self.email_verified_at is not None

class EmailVerificationToken(Base):
    __tablename__ = "email_verification_tokens"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), index=True, nullable=False)
    token_hash = Column(String(64), index=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="verification_tokens")

class EmailVerificationOTP(Base):
    __tablename__ = "email_verification_otps"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), index=True, nullable=False)
    otp_hash = Column(String(64), index=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    attempt_count = Column(Integer, default=0, nullable=False)

    user = relationship("User", back_populates="verification_otps")

class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    preferred_travel_style = Column(String(50), default="Balanced")  # Budget, Balanced, Premium / Relaxed, Balanced, Packed
    wake_up_preference = Column(String(50), default="Normal")  # Early, Normal, Late
    activity_intensity = Column(String(50), default="Balanced")  # Relaxed, Balanced, Packed / Slow, Moderate, Fast
    dietary_preference = Column(String(50), default="All")  # All, Veg, Non-Veg, Vegan, Local Dhabas
    interests = Column(Text, default="Nature,Cafés,Adventure,Food")  # Comma-separated tags
    accommodation_preference = Column(String(100), default="Riverside & Forest Stays")  # Riverside, Boutique, Homestay, etc.
    transport_preference = Column(String(100), default="Volvo Bus")  # Walking, Public transport, Cab, Rental, Volvo Bus, Self-Drive 4x4, Train, Flight, Mixed
    companion_style = Column(String(50), default="Solo")  # Solo, Couple, Friends, Family, Mixed
    
    # Regional & Localization
    language = Column(String(20), default="en")  # en, hi
    region = Column(String(50), default="India")  # India
    currency = Column(String(10), default="INR")  # INR, USD, EUR, GBP
    
    # Theme & Appearance
    theme = Column(String(20), default="system")  # light, dark, system
    
    # Location & Privacy Preferences
    location_mode = Column(String(50), default="ask_every_time")  # ask_every_time, while_using, never
    
    # Notification Preferences
    notify_trip_reminders = Column(Boolean, default=True)
    notify_trip_changes = Column(Boolean, default=True)
    notify_booking_updates = Column(Boolean, default=True)
    notify_suggestions = Column(Boolean, default=True)
    notify_copilot_updates = Column(Boolean, default=False)
    notify_announcements = Column(Boolean, default=False)
    
    # AI & Copilot Preferences
    ai_copilot_enabled = Column(Boolean, default=True)
    ai_personalized_recommendations = Column(Boolean, default=True)
    ai_use_travel_preferences = Column(Boolean, default=True)
    ai_use_trip_context = Column(Boolean, default=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="preferences")

class Destination(Base):
    __tablename__ = "destinations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), index=True, nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    state = Column(String(255), nullable=False)
    region = Column(String(255), nullable=False)  # Himalayan, Coastal, Royal Heritage, etc.
    tagline = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    hero_image = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    altitude_meters = Column(Integer, nullable=True)
    best_time_to_visit = Column(String(255), nullable=True)
    weather_type = Column(String(100), default="Cool / Mountain")
    hindi_name = Column(String(255), nullable=True)
    name_en = Column(String(255), nullable=True)
    name_hi = Column(String(255), nullable=True)
    subtitle_en = Column(String(500), nullable=True)
    subtitle_hi = Column(String(500), nullable=True)
    description_en = Column(Text, nullable=True)
    description_hi = Column(Text, nullable=True)
    hero_artwork = Column(String(500), nullable=True)
    hero_photo = Column(String(500), nullable=True)
    one_day_available = Column(Boolean, default=True)
    trek_available = Column(Boolean, default=False)
    nearby_available = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    places = relationship("Place", back_populates="destination", cascade="all, delete-orphan")
    hotels = relationship("Hotel", back_populates="destination", cascade="all, delete-orphan")
    rentals = relationship("RentalOption", back_populates="destination", cascade="all, delete-orphan")
    trips = relationship("Trip", back_populates="destination")

class PlaceCategory(Base):
    __tablename__ = "place_categories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    icon = Column(String(50), default="mountain")
    description = Column(String(255), nullable=True)

    places = relationship("Place", back_populates="category_rel")

class Place(Base):
    __tablename__ = "places"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    destination_id = Column(String(36), ForeignKey("destinations.id"), nullable=False, index=True)
    category_id = Column(String(36), ForeignKey("place_categories.id"), nullable=True)
    category = Column(String(100), nullable=False, default="Attraction")  # Attraction, Café, Restaurant, Nature, Adventure, Market, Nightlife, Culture, Essential
    name = Column(String(255), index=True, nullable=False)
    slug = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    address = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    price_level = Column(String(20), default="₹₹")  # ₹, ₹₹, ₹₹₹, ₹₹₹₹, Free
    approx_cost = Column(Float, default=0.0)
    rating = Column(Float, default=4.5)
    review_count = Column(Integer, default=120)
    opening_time = Column(String(20), default="08:00")
    closing_time = Column(String(20), default="20:00")
    recommended_duration_mins = Column(Integer, default=90)
    tags = Column(String(500), default="Scenic,Mountain,Café")  # Comma-separated
    image_url = Column(String(500), nullable=True)
    why_vanvas_recommends = Column(Text, nullable=True)
    booking_url = Column(String(500), nullable=True)
    is_must_visit = Column(Boolean, default=False)
    is_hidden_gem = Column(Boolean, default=False)
    is_indoor = Column(Boolean, default=False)  # Crucial for rainy weather fallback
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    destination = relationship("Destination", back_populates="places")
    category_rel = relationship("PlaceCategory", back_populates="places")
    votes = relationship("Vote", back_populates="place")
    saved_by = relationship("SavedPlace", back_populates="place")

class Hotel(Base):
    __tablename__ = "hotels"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    destination_id = Column(String(36), ForeignKey("destinations.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    address = Column(String(500), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    price_per_night = Column(Float, nullable=False)
    rating = Column(Float, default=4.5)
    hotel_style = Column(String(100), default="Boutique / Mountain Stay")  # Hostel, Budget, Boutique, Heritage, Luxury, Riverside
    amenities = Column(String(500), default="WiFi,Mountain View,Café,Bonfire,Hot Water")
    check_in_time = Column(String(20), default="11:00 AM")
    check_out_time = Column(String(20), default="10:00 AM")
    image_url = Column(String(500), nullable=True)
    booking_url = Column(String(500), nullable=True)
    badge = Column(String(100), default="Best for your trip")  # "Best budget option", "Best location", "Best couple stay", "Best value"

    destination = relationship("Destination", back_populates="hotels")

class RentalOption(Base):
    __tablename__ = "rental_options"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    destination_id = Column(String(36), ForeignKey("destinations.id"), nullable=False, index=True)
    provider_name = Column(String(255), nullable=False)
    vehicle_type = Column(String(50), nullable=False)  # Scooter, Royal Enfield, Himalayan Bike, EV Scooter, Car
    vehicle_name = Column(String(255), nullable=False)
    price_per_day = Column(Float, nullable=True)
    deposit_amount = Column(Float, nullable=True, default=1000.0)
    location = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    opening_hours = Column(String(100), default="08:00 AM - 08:00 PM")
    rating = Column(Float, default=4.8)
    image_url = Column(String(500), nullable=True)

    destination = relationship("Destination", back_populates="rentals")

class MobilityProvider(Base):
    __tablename__ = "mobility_providers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_name = Column(String(255), nullable=False, index=True)
    owner_name = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    whatsapp = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    website = Column(String(500), nullable=True)
    address = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    city = Column(String(100), nullable=True, index=True)
    service_area = Column(String(255), nullable=True)
    verification_status = Column(String(50), default="UNVERIFIED", index=True)  # LIVE_PROVIDER, LIVE_OSM, CURATED, UNVERIFIED, UNAVAILABLE
    source = Column(String(100), default="vanvas_curated")  # provider_direct, openstreetmap, vanvas_curated
    source_id = Column(String(255), nullable=True, index=True)
    claimed = Column(Boolean, default=False)
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    vehicles = relationship("MobilityVehicle", back_populates="provider", cascade="all, delete-orphan")

class MobilityVehicle(Base):
    __tablename__ = "mobility_vehicles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    provider_id = Column(String(36), ForeignKey("mobility_providers.id"), nullable=False, index=True)
    vehicle_type = Column(String(50), nullable=False)  # Scooter, Motorcycle, Touring Motorcycle, Electric Scooter, Mountain Bike
    brand = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)
    variant = Column(String(100), nullable=True)
    registration_optional = Column(Boolean, default=False)
    daily_price = Column(Float, nullable=True)
    hourly_price = Column(Float, nullable=True)
    deposit = Column(Float, nullable=True)
    availability_status = Column(String(50), default="AVAILABLE")  # AVAILABLE, LIMITED, UNAVAILABLE
    quantity = Column(Integer, default=1)
    image_url = Column(String(500), nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    provider = relationship("MobilityProvider", back_populates="vehicles")


class TransportOption(Base):
    __tablename__ = "transport_options"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    origin_city = Column(String(255), nullable=False, index=True)
    destination_id = Column(String(36), ForeignKey("destinations.id"), nullable=False, index=True)
    transport_type = Column(String(50), nullable=False)  # Bus, Train, Flight, Taxi
    operator_name = Column(String(255), nullable=False)
    departure_time = Column(String(20), nullable=False)
    arrival_time = Column(String(20), nullable=False)
    duration_hours = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    departure_location = Column(String(255), nullable=False)
    arrival_location = Column(String(255), nullable=False)
    booking_url = Column(String(500), nullable=True)
    recommendation_badge = Column(String(100), default="Best Arrival Time")  # "Fastest", "Cheapest", "Best for your itinerary"

class Trip(Base):
    __tablename__ = "trips"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    destination_id = Column(String(36), ForeignKey("destinations.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    num_days = Column(Integer, default=3)
    budget_total = Column(Float, default=10000.0)
    budget_spent = Column(Float, default=0.0)
    travellers_count = Column(Integer, default=1)
    companion_type = Column(String(50), default="Solo")  # Solo, Couple, Friends, Family
    travel_style = Column(String(50), default="Balanced")  # Budget, Balanced, Comfort, Premium
    wake_up_preference = Column(String(50), default="Normal")  # Early, Normal, Late
    activity_intensity = Column(String(50), default="Balanced")  # Relaxed, Balanced, Packed
    interests = Column(String(500), default="Nature,Cafés,Adventure,Food")
    hotel_id = Column(String(36), ForeignKey("hotels.id"), nullable=True)
    rental_id = Column(String(36), ForeignKey("rental_options.id"), nullable=True)
    status = Column(String(50), default="active")  # planned, active, completed, archived
    invite_code = Column(String(20), unique=True, default=lambda: generate_uuid()[:8].upper())
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    creator = relationship("User", back_populates="trips")
    destination = relationship("Destination", back_populates="trips")
    hotel = relationship("Hotel")
    rental = relationship("RentalOption")
    members = relationship("TripMember", back_populates="trip", cascade="all, delete-orphan")
    invites = relationship("TripInvite", back_populates="trip", cascade="all, delete-orphan")
    itineraries = relationship("Itinerary", back_populates="trip", cascade="all, delete-orphan", order_by="Itinerary.day_number")
    votes = relationship("Vote", back_populates="trip", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="trip", cascade="all, delete-orphan")
    checklist_items = relationship("ChecklistItem", back_populates="trip", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="trip")
    bookings = relationship("Booking", back_populates="trip", cascade="all, delete-orphan")

class TripMember(Base):
    __tablename__ = "trip_members"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    trip_id = Column(String(36), ForeignKey("trips.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String(50), default="member")  # owner, member
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    trip = relationship("Trip", back_populates="members")
    user = relationship("User", back_populates="memberships")

class TripInvite(Base):
    __tablename__ = "trip_invites"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    trip_id = Column(String(36), ForeignKey("trips.id"), nullable=False, index=True)
    code = Column(String(32), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=True)
    revoked = Column(Boolean, default=False)

    trip = relationship("Trip", back_populates="invites")

class Itinerary(Base):
    __tablename__ = "itineraries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    trip_id = Column(String(36), ForeignKey("trips.id"), nullable=False, index=True)
    day_number = Column(Integer, nullable=False)
    date = Column(Date, nullable=False)
    title = Column(String(255), default="Mountain Exploration & Riverside Trails")
    theme = Column(String(255), default="Scenic & Cafes")
    status = Column(String(50), default="pending")  # pending, in_progress, completed

    trip = relationship("Trip", back_populates="itineraries")
    items = relationship("ItineraryItem", back_populates="itinerary", cascade="all, delete-orphan", order_by="ItineraryItem.start_time")

class ItineraryItem(Base):
    __tablename__ = "itinerary_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    itinerary_id = Column(String(36), ForeignKey("itineraries.id"), nullable=False, index=True)
    place_id = Column(String(36), ForeignKey("places.id"), nullable=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), default="Attraction")
    start_time = Column(String(20), nullable=False)  # "08:30"
    end_time = Column(String(20), nullable=False)    # "10:00"
    duration_mins = Column(Integer, default=90)
    estimated_cost = Column(Float, default=0.0)
    travel_time_from_prev_mins = Column(Integer, default=15)
    distance_from_prev_km = Column(Float, default=2.5)
    notes = Column(Text, nullable=True)
    reason_for_recommendation = Column(Text, nullable=True)
    map_lat = Column(Float, nullable=True)
    map_lng = Column(Float, nullable=True)
    booking_url = Column(String(500), nullable=True)
    opening_hours = Column(String(100), nullable=True)
    status = Column(String(50), default="upcoming")  # upcoming, in_progress, completed, skipped
    is_locked = Column(Boolean, default=False)

    itinerary = relationship("Itinerary", back_populates="items")
    place = relationship("Place")

class Vote(Base):
    __tablename__ = "votes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    trip_id = Column(String(36), ForeignKey("trips.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    place_id = Column(String(36), ForeignKey("places.id"), nullable=False, index=True)
    vote_type = Column(String(20), nullable=False)  # NO, LIKE, LOVE
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    trip = relationship("Trip", back_populates="votes")
    user = relationship("User", back_populates="votes")
    place = relationship("Place", back_populates="votes")

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    trip_id = Column(String(36), ForeignKey("trips.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(100), default="Food")  # Transport, Hotel, Food, Local transport, Scooter/rental, Activities, Shopping, Misc
    amount = Column(Float, nullable=False)
    payment_method = Column(String(50), default="UPI")  # UPI, Cash, Card
    date = Column(Date, default=lambda: datetime.now(timezone.utc).date())
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    trip = relationship("Trip", back_populates="expenses")
    user = relationship("User", back_populates="expenses")

class SavedPlace(Base):
    __tablename__ = "saved_places"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    place_id = Column(String(36), ForeignKey("places.id"), nullable=False, index=True)
    destination_id = Column(String(36), ForeignKey("destinations.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="saved_places")
    place = relationship("Place", back_populates="saved_by")

class ChecklistItem(Base):
    __tablename__ = "checklist_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    trip_id = Column(String(36), ForeignKey("trips.id"), nullable=False, index=True)
    category = Column(String(100), default="Essentials")  # Essentials, Clothing, Mountain Gear, Documents, Electronics, Toiletries, Medicine
    item_name = Column(String(255), nullable=False)
    is_checked = Column(Boolean, default=False)
    is_custom = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    trip = relationship("Trip", back_populates="checklist_items")

class WeatherSnapshot(Base):
    __tablename__ = "weather_snapshots"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    destination_id = Column(String(36), ForeignKey("destinations.id"), nullable=False, index=True)
    forecast_date = Column(Date, nullable=False)
    temp_c = Column(Float, default=18.0)
    condition = Column(String(100), default="Misty & Sunny")
    is_rain = Column(Boolean, default=False)
    is_snow = Column(Boolean, default=False)
    humidity = Column(Integer, default=65)
    wind_kph = Column(Float, default=8.0)
    advisory = Column(String(500), default="Ideal morning trekking conditions. Light mist expected by evening.")
    icon = Column(String(50), default="cloud-sun")

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    trip_id = Column(String(36), ForeignKey("trips.id"), nullable=True, index=True)
    destination_slug = Column(String(100), nullable=True)
    title = Column(String(255), default="Mountain Expedition Session")
    summary = Column(Text, nullable=True)
    context_state = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="conversations")
    trip = relationship("Trip", back_populates="conversations")
    messages = relationship(
        "ConversationMessage",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="ConversationMessage.created_at"
    )

class ConversationMessage(Base):
    __tablename__ = "conversation_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("conversations.id"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # 'user', 'assistant', 'system', 'tool'
    content = Column(Text, nullable=False)
    tool_calls = Column(Text, nullable=True)
    tool_results = Column(Text, nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    place_id = Column(String(255), nullable=False, index=True)
    rating = Column(Float, nullable=False)  # 1.0 to 5.0
    title = Column(String(255), nullable=True)
    body = Column(Text, nullable=False)
    status = Column(String(50), default="published", index=True)  # 'published', 'pending', 'hidden', 'reported', 'removed'
    moderation_note = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="reviews")
    reports = relationship("ReviewReport", back_populates="review", cascade="all, delete-orphan")


class ReviewReport(Base):
    __tablename__ = "review_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    review_id = Column(String(36), ForeignKey("reviews.id"), nullable=False, index=True)
    reporter_user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    reason = Column(String(500), nullable=False)
    status = Column(String(50), default="pending", index=True)  # 'pending', 'reviewed', 'dismissed'
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    review = relationship("Review", back_populates="reports")
    reporter = relationship("User")


# ----------------- Travel Commerce Foundation Models -----------------
class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    trip_id = Column(String(36), ForeignKey("trips.id"), nullable=True, index=True)
    provider = Column(String(100), nullable=False)  # e.g., "vanvas_curated", "openstreetmap", "partner_direct"
    provider_booking_id = Column(String(255), nullable=True)
    booking_type = Column(String(50), nullable=False)  # stay, transport, rental, place, experience
    status = Column(String(50), default="DISCOVERED", index=True)
    currency = Column(String(10), default="INR")
    total_amount = Column(Float, nullable=True)
    confirmation_reference = Column(String(100), nullable=True)
    checkout_url = Column(String(1000), nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="bookings")
    trip = relationship("Trip", back_populates="bookings")
    items = relationship("BookingItem", back_populates="booking", cascade="all, delete-orphan")
    events = relationship("BookingEvent", back_populates="booking", cascade="all, delete-orphan", order_by="BookingEvent.created_at")


class BookingItem(Base):
    __tablename__ = "booking_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    booking_id = Column(String(36), ForeignKey("bookings.id"), nullable=False, index=True)
    provider_offer_id = Column(String(255), nullable=True)
    product_type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    destination = Column(String(255), nullable=True)
    start_at = Column(DateTime, nullable=True)
    end_at = Column(DateTime, nullable=True)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=True)
    total_price = Column(Float, nullable=True)
    metadata_json = Column(Text, nullable=True)

    # Relationships
    booking = relationship("Booking", back_populates="items")


class BookingEvent(Base):
    __tablename__ = "booking_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    booking_id = Column(String(36), ForeignKey("bookings.id"), nullable=False, index=True)
    event_type = Column(String(100), nullable=False)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    booking = relationship("Booking", back_populates="events")


# ----------------- Solo Traveler Circles Models -----------------

class SoloTravelerProfile(Base):
    __tablename__ = "solo_traveler_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False, index=True)
    travel_mode = Column(String(50), default="SOLO", nullable=False)  # SOLO, GROUP, COUPLE
    is_enabled = Column(Boolean, default=True, nullable=False)
    discover_before_trip = Column(Boolean, default=True, nullable=False)
    discover_when_here = Column(Boolean, default=True, nullable=False)
    preferred_group_size = Column(Integer, default=4, nullable=False)
    interests = Column(Text, default="Trekking,Cafés,Photography,Local Culture", nullable=False)
    travel_style = Column(String(50), default="Balanced", nullable=False)  # Budget, Balanced, Comfort, Adventure, Slow Travel
    trek_pace = Column(String(50), default="Moderate", nullable=False)  # Leisurely, Moderate, Fast
    bio = Column(Text, default="", nullable=False)
    
    # Transient approximate client check-in coordinates (never exact live tracker, non-persistent historical log)
    last_approx_lat = Column(Float, nullable=True)
    last_approx_lng = Column(Float, nullable=True)
    last_location_updated_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="solo_profile")


class SoloTripIntent(Base):
    __tablename__ = "solo_trip_intents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    destination_id = Column(String(36), ForeignKey("destinations.id"), nullable=True, index=True)
    destination_name = Column(String(255), nullable=True)
    trek_slug = Column(String(100), nullable=True, index=True)
    trip_id = Column(String(36), ForeignKey("trips.id"), nullable=True, index=True)
    intent_type = Column(String(50), default="BOTH", index=True, nullable=False)  # PLANNING, CURRENTLY_THERE, BOTH
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=False, index=True)
    arrival_window = Column(String(50), default="Flexible", nullable=False)
    departure_window = Column(String(50), default="Flexible", nullable=False)
    interests = Column(Text, nullable=True)
    preferred_group_size = Column(Integer, default=4, nullable=False)
    travel_style = Column(String(50), default="Balanced", nullable=False)
    trek_pace = Column(String(50), default="Moderate", nullable=False)
    status = Column(String(50), default="active", index=True, nullable=False)  # active, completed, cancelled
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="solo_intents")
    destination = relationship("Destination")
    trip = relationship("Trip")


class SoloMatch(Base):
    __tablename__ = "solo_matches"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    sender_user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    receiver_user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    destination_id = Column(String(36), ForeignKey("destinations.id"), nullable=True, index=True)
    trek_slug = Column(String(100), nullable=True, index=True)
    trip_intent_id = Column(String(36), ForeignKey("solo_trip_intents.id"), nullable=True)
    status = Column(String(50), default="PENDING", index=True, nullable=False)  # PENDING, ACCEPTED, DECLINED, BLOCKED
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    sender = relationship("User", foreign_keys=[sender_user_id])
    receiver = relationship("User", foreign_keys=[receiver_user_id])
    destination = relationship("Destination")
    trip_intent = relationship("SoloTripIntent")

    @property
    def sender_name(self) -> str:
        return self.sender.full_name if self.sender else "Traveler"

    @property
    def sender_avatar_url(self) -> Optional[str]:
        return self.sender.avatar_url if self.sender else None

    @property
    def receiver_name(self) -> str:
        return self.receiver.full_name if self.receiver else "Traveler"

    @property
    def receiver_avatar_url(self) -> Optional[str]:
        return self.receiver.avatar_url if self.receiver else None


class TravelCircle(Base):
    __tablename__ = "travel_circles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    creator_user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    destination_id = Column(String(36), ForeignKey("destinations.id"), nullable=True, index=True)
    destination_name = Column(String(255), nullable=True)
    trip_id = Column(String(36), ForeignKey("trips.id"), nullable=True, index=True)
    trek_slug = Column(String(100), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=False, index=True)
    max_members = Column(Integer, default=6, nullable=False)
    activity_type = Column(String(100), default="Exploration", nullable=False)  # Trek, Exploration, Café Hopping, Sightseeing, Photography, Cultural
    meetup_point = Column(String(255), default="Town Center", nullable=False)
    meetup_lat = Column(Float, nullable=True)
    meetup_lng = Column(Float, nullable=True)
    meetup_time = Column(String(50), default="10:00 AM", nullable=True)
    status = Column(String(50), default="FORMING", index=True, nullable=False)  # DISCOVERABLE, FORMING, ACTIVE, COMPLETED, ARCHIVED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    creator = relationship("User", foreign_keys=[creator_user_id])
    destination = relationship("Destination")
    trip = relationship("Trip")
    members = relationship("CircleMember", back_populates="circle", cascade="all, delete-orphan")
    messages = relationship("CircleMessage", back_populates="circle", cascade="all, delete-orphan", order_by="CircleMessage.created_at")
    activities = relationship("CircleActivity", back_populates="circle", cascade="all, delete-orphan", order_by="CircleActivity.created_at")


class CircleMember(Base):
    __tablename__ = "circle_members"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    circle_id = Column(String(36), ForeignKey("travel_circles.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String(50), default="member", nullable=False)  # creator, member, admin
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    circle = relationship("TravelCircle", back_populates="members")
    user = relationship("User", back_populates="circle_memberships")


class CircleMessage(Base):
    __tablename__ = "circle_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    circle_id = Column(String(36), ForeignKey("travel_circles.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    sender_name = Column(String(255), nullable=True)
    sender_avatar = Column(String(500), nullable=True)
    message_type = Column(String(50), default="user", nullable=False)  # user, system, ask_vanvas
    content = Column(Text, nullable=False)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    circle = relationship("TravelCircle", back_populates="messages")
    user = relationship("User")


class CircleActivity(Base):
    __tablename__ = "circle_activities"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    circle_id = Column(String(36), ForeignKey("travel_circles.id"), nullable=False, index=True)
    place_id = Column(String(36), ForeignKey("places.id"), nullable=True, index=True)
    custom_title = Column(String(255), nullable=True)
    category = Column(String(100), default="attraction", nullable=False)  # destination, restaurant, attraction, activity, meetup_time
    meetup_time = Column(String(50), nullable=True)
    suggested_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    status = Column(String(50), default="proposed", nullable=False)  # proposed, decided, completed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    circle = relationship("TravelCircle", back_populates="activities")
    place = relationship("Place")
    suggested_by = relationship("User")
    votes = relationship("CircleActivityVote", back_populates="activity", cascade="all, delete-orphan")


class CircleActivityVote(Base):
    __tablename__ = "circle_activity_votes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    activity_id = Column(String(36), ForeignKey("circle_activities.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    vote_type = Column(String(20), nullable=False)  # LOVE, LIKE, NO
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    activity = relationship("CircleActivity", back_populates="votes")
    user = relationship("User")


class TravelerBlock(Base):
    __tablename__ = "traveler_blocks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    blocker_user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    blocked_user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    reason = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    blocker = relationship("User", foreign_keys=[blocker_user_id])
    blocked = relationship("User", foreign_keys=[blocked_user_id])


class TravelerReport(Base):
    __tablename__ = "traveler_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    reporter_user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    reported_user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    circle_id = Column(String(36), nullable=True)
    reason = Column(Text, nullable=False)
    status = Column(String(50), default="pending", index=True, nullable=False)  # pending, reviewed, dismissed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    reporter = relationship("User", foreign_keys=[reporter_user_id])
    reported = relationship("User", foreign_keys=[reported_user_id])


class UserNotification(Base):
    __tablename__ = "user_notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    category = Column(String(100), default="circle", nullable=False)  # connection_request, connection_accepted, circle_invitation, circle_member_joined, circle_message, circle_vote, meetup_reminder
    entity_id = Column(String(36), nullable=True)
    is_read = Column(Boolean, default=False, index=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    user = relationship("User", back_populates="notifications")

