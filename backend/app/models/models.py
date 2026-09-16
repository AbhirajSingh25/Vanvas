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
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    preferences = relationship("UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    trips = relationship("Trip", back_populates="creator", cascade="all, delete-orphan")
    memberships = relationship("TripMember", back_populates="user", cascade="all, delete-orphan")
    votes = relationship("Vote", back_populates="user", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="user")
    saved_places = relationship("SavedPlace", back_populates="user", cascade="all, delete-orphan")

class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    preferred_travel_style = Column(String(50), default="Balanced")  # Budget, Balanced, Comfort, Premium
    wake_up_preference = Column(String(50), default="Normal")  # Early, Normal, Late
    activity_intensity = Column(String(50), default="Balanced")  # Relaxed, Balanced, Packed
    dietary_preference = Column(String(50), default="All")  # All, Veg, Non-Veg, Vegan, Local Dhabas
    interests = Column(Text, default="Nature,Cafés,Adventure,Food")  # Comma-separated tags
    accommodation_preference = Column(String(100), default="Riverside & Forest Stays")  # Riverside, Boutique, Homestay, etc.
    transport_preference = Column(String(100), default="Volvo Bus")  # Volvo Bus, Self-Drive, Train, Flight, Any
    companion_style = Column(String(50), default="Solo")  # Solo, Couple, Friends, Family
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

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
    price_per_day = Column(Float, nullable=False)
    deposit_amount = Column(Float, default=1000.0)
    location = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    opening_hours = Column(String(100), default="08:00 AM - 08:00 PM")
    rating = Column(Float, default=4.8)
    image_url = Column(String(500), nullable=True)

    destination = relationship("Destination", back_populates="rentals")

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
