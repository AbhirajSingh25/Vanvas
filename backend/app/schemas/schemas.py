from datetime import date, datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# ----------------- User & Auth Schemas -----------------
class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserPreferenceSchema(BaseModel):
    preferred_travel_style: Optional[str] = "Balanced"
    wake_up_preference: Optional[str] = "Normal"
    activity_intensity: Optional[str] = "Balanced"
    dietary_preference: Optional[str] = "All"
    interests: Optional[str] = "Nature,Cafés,Adventure,Food"
    accommodation_preference: Optional[str] = "Riverside & Forest Stays"
    transport_preference: Optional[str] = "Volvo Bus"
    companion_style: Optional[str] = "Solo"

    class Config:
        from_attributes = True

class UserProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    preferred_travel_style: Optional[str] = None
    wake_up_preference: Optional[str] = None
    activity_intensity: Optional[str] = None
    dietary_preference: Optional[str] = None
    interests: Optional[str] = None
    accommodation_preference: Optional[str] = None
    transport_preference: Optional[str] = None
    companion_style: Optional[str] = None

class UserResponse(UserBase):
    id: str
    role: str
    avatar_url: Optional[str] = None
    created_at: datetime
    preferences: Optional[UserPreferenceSchema] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# ----------------- Destination Schemas -----------------
class DestinationBase(BaseModel):
    name: str
    slug: str
    state: str
    region: str
    tagline: str
    description: str
    hero_image: Optional[str] = None
    latitude: float
    longitude: float
    altitude_meters: Optional[int] = None
    best_time_to_visit: Optional[str] = None
    weather_type: Optional[str] = "Cool / Mountain"
    is_featured: bool = False

class DestinationResponse(DestinationBase):
    id: str
    places_count: Optional[int] = 0
    hotels_count: Optional[int] = 0
    rentals_count: Optional[int] = 0

    class Config:
        from_attributes = True

# ----------------- Place Schemas -----------------
class PlaceBase(BaseModel):
    destination_id: str
    category: str = "Attractions"
    name: str
    slug: str
    description: str = ""
    address: Optional[str] = None
    latitude: float
    longitude: float
    price_level: Optional[str] = "₹₹"
    approx_cost: Optional[float] = 0.0
    rating: Optional[float] = None
    review_count: Optional[int] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    recommended_duration_mins: Optional[int] = 60
    tags: str = "Scenic,Mountain"
    image_url: Optional[str] = None
    why_vanvas_recommends: Optional[str] = None
    booking_url: Optional[str] = None
    is_must_visit: bool = False
    is_hidden_gem: bool = False
    is_indoor: bool = False
    source: Optional[str] = "vanvas_curated"
    source_id: Optional[str] = None
    is_live: Optional[bool] = False
    distance_km: Optional[float] = None

class PlaceResponse(PlaceBase):
    id: str
    is_saved: Optional[bool] = False
    match_score: Optional[float] = None

    class Config:
        from_attributes = True

# ----------------- Hotel & Rental & Transport Schemas -----------------
class HotelResponse(BaseModel):
    id: str
    destination_id: str
    name: str
    address: str
    latitude: float
    longitude: float
    price_per_night: float
    rating: float
    hotel_style: str
    amenities: str
    check_in_time: str
    check_out_time: str
    image_url: Optional[str] = None
    booking_url: Optional[str] = None
    badge: str

    class Config:
        from_attributes = True

class RentalOptionResponse(BaseModel):
    id: str
    destination_id: str
    provider_name: str
    vehicle_type: str
    vehicle_name: str
    price_per_day: float
    deposit_amount: float
    location: str
    latitude: float
    longitude: float
    opening_hours: str
    rating: float
    image_url: Optional[str] = None

    class Config:
        from_attributes = True

class TransportOptionResponse(BaseModel):
    id: str
    origin_city: str
    destination_id: str
    transport_type: str
    operator_name: str
    departure_time: str
    arrival_time: str
    duration_hours: float
    price: float
    departure_location: str
    arrival_location: str
    booking_url: Optional[str] = None
    recommendation_badge: str

    class Config:
        from_attributes = True

# ----------------- Itinerary Item Schemas -----------------
class ItineraryItemResponse(BaseModel):
    id: str
    itinerary_id: str
    place_id: Optional[str] = None
    title: str
    category: str
    start_time: str
    end_time: str
    duration_mins: int
    estimated_cost: float
    travel_time_from_prev_mins: int
    distance_from_prev_km: float
    notes: Optional[str] = None
    reason_for_recommendation: Optional[str] = None
    map_lat: Optional[float] = None
    map_lng: Optional[float] = None
    booking_url: Optional[str] = None
    opening_hours: Optional[str] = None
    status: str
    is_locked: bool

    class Config:
        from_attributes = True

class ItineraryDayResponse(BaseModel):
    id: str
    trip_id: str
    day_number: int
    date: date
    title: str
    theme: str
    status: str
    items: List[ItineraryItemResponse] = []

    class Config:
        from_attributes = True

# ----------------- Trip Schemas -----------------
class TripCreateRequest(BaseModel):
    destination_id: str
    start_date: date
    end_date: date
    budget: float = 10000.0
    travellers_count: int = 1
    companion_type: str = "Solo"  # Solo, Couple, Friends, Family
    travel_style: str = "Balanced"  # Budget, Balanced, Comfort, Premium
    wake_up_preference: str = "Normal"  # Early, Normal, Late
    activity_intensity: str = "Balanced"  # Relaxed, Balanced, Packed
    interests: List[str] = ["Nature", "Cafés", "Adventure", "Food"]
    origin_city: Optional[str] = "Delhi"

class TripSummaryResponse(BaseModel):
    id: str
    title: str
    destination_name: str
    destination_slug: str
    hero_image: Optional[str] = None
    start_date: date
    end_date: date
    num_days: int
    budget_total: float
    budget_spent: float
    companion_type: str
    travel_style: str
    status: str

    class Config:
        from_attributes = True

class TripDetailResponse(BaseModel):
    id: str
    user_id: str
    destination_id: str
    destination: DestinationResponse
    title: str
    start_date: date
    end_date: date
    num_days: int
    budget_total: float
    budget_spent: float
    travellers_count: int
    companion_type: str
    travel_style: str
    wake_up_preference: str
    activity_intensity: str
    interests: str
    status: str
    invite_code: str
    hotel: Optional[HotelResponse] = None
    rental: Optional[RentalOptionResponse] = None
    itineraries: List[ItineraryDayResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Dynamic Replanning & Actions -----------------
class DynamicReplanRequest(BaseModel):
    action_type: str  # "late", "tired", "rain", "less_money", "more_adventure", "relax", "skip", "add"
    target_item_id: Optional[str] = None
    current_time: Optional[str] = None  # e.g., "14:30"
    day_number: Optional[int] = 1
    custom_note: Optional[str] = None

class QuickPlanRequest(BaseModel):
    hours_available: float = 3.0  # 1, 2, 3, 4, etc.
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    current_location_name: Optional[str] = None
    variation: Optional[int] = 0

class QuickPlanResponse(BaseModel):
    headline: str
    summary: str
    duration_hours: float
    items: List[ItineraryItemResponse]

class ImHereRequest(BaseModel):
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    current_location_name: Optional[str] = None

class ImHereResponse(BaseModel):
    current_location_name: str
    hotel_info: Optional[Dict[str, Any]] = None
    timing_guidance: str
    next_3_hours_plan: List[ItineraryItemResponse]
    nearby_food: List[PlaceResponse]
    nearby_attractions: List[PlaceResponse]
    local_transport_options: List[Dict[str, Any]]

# ----------------- Arrival Optimizer -----------------
class ArrivalOptimizerRequest(BaseModel):
    destination_id: str
    origin_city: str
    target_date: date
    preferred_mode: Optional[str] = "All"  # Bus, Train, Flight, All

class ArrivalRecommendation(BaseModel):
    transport_option: TransportOptionResponse
    expected_arrival: str
    hotel_check_in_time: str
    breakfast_window: str
    luggage_drop_plan: str
    first_activity_time: str
    overall_verdict: str
    recommendation_score: float

class ArrivalOptimizerResponse(BaseModel):
    destination_name: str
    best_option: ArrivalRecommendation
    alternative_options: List[ArrivalRecommendation]
    traveller_tip: str

# ----------------- Group Travel & Voting -----------------
class SubmitVoteRequest(BaseModel):
    place_id: str
    vote_type: str  # NO, LIKE, LOVE

class GroupCompatibilityResponse(BaseModel):
    place_id: str
    place_name: str
    category: str
    love_count: int
    like_count: int
    no_count: int
    total_votes: int
    compatibility_score: float  # 0.0 to 100.0%
    is_consensus_favorite: bool

class GroupSummaryResponse(BaseModel):
    trip_id: str
    members_count: int
    members: List[Dict[str, Any]]
    compatibility_ranking: List[GroupCompatibilityResponse]

# ----------------- Trip Collaboration & Invite Schemas -----------------
class TripMemberResponse(BaseModel):
    id: str
    user_id: str
    full_name: str
    role: str  # owner, member
    avatar_url: Optional[str] = None
    joined_at: datetime

    class Config:
        from_attributes = True

class TripInvitePreviewResponse(BaseModel):
    trip_id: str
    title: str
    destination_name: str
    destination_slug: str
    destination_hero_image: Optional[str] = None
    state: str
    region: str
    start_date: date
    end_date: date
    num_days: int
    companion_type: str
    travel_style: str
    owner_name: str
    members_count: int
    is_member: bool = False
    invite_code: str

class TripInviteCreateResponse(BaseModel):
    code: str
    invite_url: str
    expires_at: Optional[datetime] = None

class TripMemberActionResponse(BaseModel):
    success: bool
    message: str
    trip_id: Optional[str] = None
    already_joined: Optional[bool] = None

# ----------------- Budget & Expense Schemas -----------------
class ExpenseCreateRequest(BaseModel):
    title: str
    category: str  # Transport, Hotel, Food, Local transport, Scooter/rental, Activities, Shopping, Misc
    amount: float
    payment_method: str = "UPI"
    notes: Optional[str] = None
    date: Optional[date] = None

class ExpenseResponse(BaseModel):
    id: str
    trip_id: str
    user_name: str
    title: str
    category: str
    amount: float
    payment_method: str
    date: date
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class BudgetBreakdownCategory(BaseModel):
    category: str
    estimated: float
    spent: float
    remaining: float

class BudgetSummaryResponse(BaseModel):
    total_budget: float
    total_spent: float
    total_remaining: float
    daily_average_budget: float
    daily_average_spent: float
    categories: List[BudgetBreakdownCategory]
    recent_expenses: List[ExpenseResponse]

# ----------------- Checklist Schemas -----------------
class ChecklistItemResponse(BaseModel):
    id: str
    trip_id: str
    category: str
    item_name: str
    is_checked: bool
    is_custom: bool

    class Config:
        from_attributes = True

class ChecklistItemCreateRequest(BaseModel):
    category: str = "Essentials"
    item_name: str

class ChecklistItemToggleRequest(BaseModel):
    is_checked: bool

# ----------------- AI Copilot Schemas -----------------
class CopilotMessageRequest(BaseModel):
    message: str
    current_location_name: Optional[str] = None
    current_time: Optional[str] = None

class CopilotMessageResponse(BaseModel):
    reply: str
    suggested_actions: List[Dict[str, str]] = []  # e.g., [{"label": "Adjust Evening", "action": "late"}]
    relevant_places: List[PlaceResponse] = []

# ----------------- Admin Schemas -----------------
class ProviderHealthStatus(BaseModel):
    provider_name: str
    status: str  # "healthy", "demo_mode", "live", "error"
    is_live: bool
    latency_ms: int
    message: str

class AdminDashboardStats(BaseModel):
    total_users: int
    total_trips: int
    total_destinations: int
    total_places: int
    active_trips_count: int
    provider_health: List[ProviderHealthStatus]

# ----------------- Creative Art Schemas -----------------
class CreativeArtGenerateRequest(BaseModel):
    destination_name: str
    slug: str
    terrain_type: str = "general"
    visual_role: str = "illustration"
    aspect_ratio: str = "wide"
    state: Optional[str] = None
    elevation_meters: Optional[int] = None
    auto_promote: bool = False

class CreativeArtGenerateResponse(BaseModel):
    success: bool
    provider: str
    model: Optional[str] = None
    destination: str
    slug: str
    visual_role: str
    terrain_type: str
    output_path: Optional[str] = None
    public_url: Optional[str] = None
    asset_url: str
    metadata_path: Optional[str] = None
    prompt_used: Optional[str] = None
    prompt_blueprint: Optional[str] = None
    validation_status: str
    is_curated: bool
    aspect_ratio: Optional[str] = None
    error: Optional[str] = None

# ----------------- Conversation Persistence Schemas -----------------
class ConversationMessageSchema(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    tool_calls: Optional[str] = None
    tool_results: Optional[str] = None
    metadata_json: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationSchema(BaseModel):
    id: str
    user_id: str
    trip_id: Optional[str] = None
    destination_slug: Optional[str] = None
    title: str
    summary: Optional[str] = None
    context_state: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
