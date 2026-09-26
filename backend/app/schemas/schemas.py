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
    language: Optional[str] = "en"
    region: Optional[str] = "India"
    currency: Optional[str] = "INR"
    theme: Optional[str] = "system"
    location_mode: Optional[str] = "ask_every_time"
    notify_trip_reminders: Optional[bool] = True
    notify_trip_changes: Optional[bool] = True
    notify_booking_updates: Optional[bool] = True
    notify_suggestions: Optional[bool] = True
    notify_copilot_updates: Optional[bool] = False
    notify_announcements: Optional[bool] = False
    ai_copilot_enabled: Optional[bool] = True
    ai_personalized_recommendations: Optional[bool] = True
    ai_use_travel_preferences: Optional[bool] = True
    ai_use_trip_context: Optional[bool] = True

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
    language: Optional[str] = None
    region: Optional[str] = None
    currency: Optional[str] = None
    theme: Optional[str] = None
    location_mode: Optional[str] = None
    notify_trip_reminders: Optional[bool] = None
    notify_trip_changes: Optional[bool] = None
    notify_booking_updates: Optional[bool] = None
    notify_suggestions: Optional[bool] = None
    notify_copilot_updates: Optional[bool] = None
    notify_announcements: Optional[bool] = None
    ai_copilot_enabled: Optional[bool] = None
    ai_personalized_recommendations: Optional[bool] = None
    ai_use_travel_preferences: Optional[bool] = None
    ai_use_trip_context: Optional[bool] = None

class AvatarUploadResponse(BaseModel):
    avatar_url: Optional[str] = None
    avatar_type: Optional[str] = None
    avatar_preset: Optional[str] = None
    message: str

class AvatarPresetSelectRequest(BaseModel):
    preset: str = Field(..., min_length=1, max_length=100)

class PasswordChangeRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)

class AccountDeleteRequest(BaseModel):
    password: Optional[str] = None
    confirmation: Optional[str] = None

class UserStatsResponse(BaseModel):
    saved_places_count: int = 0
    saved_trips_count: int = 0
    upcoming_trips_count: int = 0
    completed_trips_count: int = 0
    reviews_count: int = 0
    bookings_count: int = 0
    member_since: datetime

class UserDataExportResponse(BaseModel):
    user: Dict[str, Any]
    preferences: Optional[Dict[str, Any]] = None
    trips: List[Dict[str, Any]] = []
    saved_places: List[Dict[str, Any]] = []
    reviews: List[Dict[str, Any]] = []
    bookings: List[Dict[str, Any]] = []
    exported_at: datetime

class UserResponse(UserBase):
    id: str
    role: str
    avatar_url: Optional[str] = None
    avatar_type: Optional[str] = None
    avatar_preset: Optional[str] = None
    email_verified_at: Optional[datetime] = None
    is_verified: bool = False
    created_at: datetime
    preferences: Optional[UserPreferenceSchema] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class RegistrationSuccessResponse(BaseModel):
    message: str
    email: str
    email_verified: bool = False
    email_delivery_status: Optional[str] = None

class VerifyEmailRequest(BaseModel):
    email: Optional[EmailStr] = None
    otp: Optional[str] = Field(None, min_length=6, max_length=6, description="6-digit numeric verification code")
    token: Optional[str] = Field(None, min_length=1, description="Legacy verification token")

class VerifyEmailResponse(BaseModel):
    success: bool
    message: str
    email: Optional[str] = None
    already_verified: bool = False

class ResendVerificationRequest(BaseModel):
    email: EmailStr

class ResendVerificationResponse(BaseModel):
    success: bool
    message: str
    cooldown_seconds: int = 60
    email_delivery_status: Optional[str] = None

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
    hindi_name: Optional[str] = None
    name_en: Optional[str] = None
    name_hi: Optional[str] = None
    subtitle_en: Optional[str] = None
    subtitle_hi: Optional[str] = None
    description_en: Optional[str] = None
    description_hi: Optional[str] = None
    hero_artwork: Optional[str] = None
    hero_photo: Optional[str] = None
    one_day_available: Optional[bool] = True
    trek_available: Optional[bool] = False
    nearby_available: Optional[bool] = True
    is_featured: bool = False

class DestinationResponse(DestinationBase):
    id: str
    places_count: Optional[int] = 0
    hotels_count: Optional[int] = 0
    rentals_count: Optional[int] = 0

    class Config:
        from_attributes = True

# ----------------- Trust & Action Link Schemas -----------------
class ActionLink(BaseModel):
    type: str  # "directions", "website", "phone", "booking", "provider"
    label: str
    url: str

# ----------------- Place Schemas -----------------
class PlaceBase(BaseModel):
    destination_id: str
    category: str = "Attractions"
    subcategory: Optional[str] = None
    name: str
    slug: str
    description: str = ""
    address: Optional[str] = None
    latitude: float
    longitude: float
    price_level: Optional[str] = None
    price_range: Optional[str] = None
    approx_cost: Optional[float] = 0.0
    rating: Optional[float] = None
    review_count: Optional[int] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    opening_hours: Optional[str] = None
    hours_available: Optional[bool] = None
    is_open_now: Optional[bool] = None
    open_now: Optional[bool] = None
    business_status: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    google_maps_url: Optional[str] = None
    recommended_duration_mins: Optional[int] = 60
    tags: str = "Scenic,Mountain"
    image_url: Optional[str] = None
    photo_url: Optional[str] = None
    why_vanvas_recommends: Optional[str] = None
    booking_url: Optional[str] = None
    is_must_visit: bool = False
    is_hidden_gem: bool = False
    is_indoor: bool = False
    source: Optional[str] = "vanvas_curated"
    source_provider: Optional[str] = "vanvas_curated"
    source_id: Optional[str] = None
    source_url: Optional[str] = None
    is_live: Optional[bool] = False
    distance_km: Optional[float] = None
    action_links: List[ActionLink] = []
    data_state: Optional[str] = "VERIFIED"
    trust_source: Optional[str] = "VANVAS_CURATED"
    last_verified_at: Optional[str] = None
    menu_url: Optional[str] = None
    menu_source: Optional[str] = None
    menu_available: Optional[bool] = None

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
    property_name: Optional[str] = None
    address: str
    latitude: float
    longitude: float
    price_per_night: Optional[float] = None
    total_price: Optional[float] = None
    price_formatted: Optional[str] = None
    currency: Optional[str] = "INR"
    taxes: Optional[float] = None
    available: Optional[bool] = None
    availability_state: Optional[str] = "UNKNOWN"
    rating: Optional[float] = None
    review_count: Optional[int] = None
    hotel_style: Optional[str] = "Boutique / Mountain Stay"
    accommodation_type: Optional[str] = "Hotel"
    property_type: Optional[str] = None
    room_type: Optional[str] = None
    traveller_tags: List[str] = []
    amenities: Optional[str] = "WiFi,Hot Water"
    check_in_time: Optional[str] = "11:00 AM"
    check_out_time: Optional[str] = "10:00 AM"
    image_url: Optional[str] = None
    photos: List[str] = []
    booking_url: Optional[str] = None
    badge: Optional[str] = "Verified Sanctuary"
    phone: Optional[str] = None
    website: Optional[str] = None
    source: Optional[str] = "vanvas_curated"
    source_provider: Optional[str] = "vanvas_curated"
    source_id: Optional[str] = None
    source_url: Optional[str] = None
    provider_source: Optional[str] = None
    provider_listing_id: Optional[str] = None
    provider_url: Optional[str] = None
    is_live: Optional[bool] = False
    price_verified: Optional[bool] = True
    distance_km: Optional[float] = None
    action_links: List[ActionLink] = []
    data_state: Optional[str] = "VERIFIED"
    trust_source: Optional[str] = "VANVAS_CURATED"
    last_verified_at: Optional[str] = None

    class Config:
        from_attributes = True

class RentalOptionResponse(BaseModel):
    id: str
    destination_id: str
    provider_name: str
    vehicle_type: str
    vehicle_name: str
    brand: Optional[str] = None
    model: Optional[str] = None
    price_per_hour: Optional[float] = None
    price_per_day: Optional[float] = None
    deposit: Optional[float] = None
    deposit_amount: Optional[float] = None
    location: str
    address: Optional[str] = None
    latitude: float
    longitude: float
    opening_hours: Optional[str] = "Hours not listed"
    hours_available: Optional[bool] = False
    is_open_now: Optional[bool] = None
    rating: Optional[float] = None
    image_url: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    website: Optional[str] = None
    google_maps_url: Optional[str] = None
    source: Optional[str] = "vanvas_curated"
    source_provider: Optional[str] = "vanvas_curated"
    source_id: Optional[str] = None
    source_url: Optional[str] = None
    is_live: Optional[bool] = False
    inventory_verified: Optional[bool] = False
    verification_status: Optional[str] = "CURATED"  # LIVE_PROVIDER, LIVE_OSM, CURATED, UNVERIFIED, UNAVAILABLE
    distance_km: Optional[float] = None
    action_links: List[ActionLink] = []
    data_state: Optional[str] = "VERIFIED"
    trust_source: Optional[str] = "VANVAS_CURATED"
    last_verified_at: Optional[str] = None

    class Config:
        from_attributes = True

# ----------------- Mobility Provider & Vehicle Schemas -----------------
class MobilityVehicleBase(BaseModel):
    vehicle_type: str
    brand: Optional[str] = None
    model: Optional[str] = None
    variant: Optional[str] = None
    registration_optional: bool = False
    daily_price: Optional[float] = None
    hourly_price: Optional[float] = None
    deposit: Optional[float] = None
    availability_status: str = "AVAILABLE"
    quantity: int = 1
    image_url: Optional[str] = None
    active: bool = True

class MobilityVehicleCreate(MobilityVehicleBase):
    pass

class MobilityVehicleResponse(MobilityVehicleBase):
    id: str
    provider_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MobilityProviderBase(BaseModel):
    business_name: str
    owner_name: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    latitude: float
    longitude: float
    city: Optional[str] = None
    service_area: Optional[str] = None

class MobilityProviderCreate(MobilityProviderBase):
    verification_status: str = "UNVERIFIED"
    source: str = "provider_direct"
    source_id: Optional[str] = None
    claimed: bool = False

class MobilityProviderClaim(BaseModel):
    owner_name: str
    phone: str
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    business_name: Optional[str] = None
    address: Optional[str] = None
    operating_hours: Optional[str] = None
    daily_price: Optional[float] = None
    deposit: Optional[float] = None
    notes: Optional[str] = None

class MobilityProviderResponse(MobilityProviderBase):
    id: str
    verification_status: str
    source: str
    source_id: Optional[str] = None
    claimed: bool
    verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    vehicles: List[MobilityVehicleResponse] = []

    class Config:
        from_attributes = True

class MobilityListingResponse(BaseModel):
    id: str
    provider: MobilityProviderResponse
    vehicle: Optional[MobilityVehicleResponse] = None
    vehicle_type: str
    vehicle_name: str
    pickup_location: str
    service_area: Optional[str] = None
    hours: Optional[str] = None
    hours_available: bool = False
    is_open_now: Optional[bool] = None
    pricing: Dict[str, Any] = {}
    daily_price: Optional[float] = None
    hourly_price: Optional[float] = None
    deposit: Optional[float] = None
    rating: Optional[float] = None
    image_url: Optional[str] = None
    distance_km: Optional[float] = None
    verification_status: str  # LIVE_PROVIDER, LIVE_OSM, CURATED, UNVERIFIED, UNAVAILABLE
    provenance: str
    trust_source: str
    actions: List[ActionLink] = []
    action_links: List[ActionLink] = []


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
    recommendation_badge: Optional[str] = "Best Arrival Time"
    source: Optional[str] = "vanvas_curated"
    source_id: Optional[str] = None
    is_live: Optional[bool] = False
    schedule_type: Optional[str] = "curated_schedule"
    action_links: List[ActionLink] = []
    data_state: Optional[str] = "VERIFIED"
    trust_source: Optional[str] = "VANVAS_CURATED"

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
    planning_mode: Optional[str] = "multi_day"  # one_day, weekend, multi_day, trek, relaxed, adventure

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
    status: str  # "healthy", "demo_mode", "live", "error", "degraded", "unavailable", "not_configured"
    is_live: bool = True
    latency_ms: float = 0.0
    message: Optional[str] = "Provider operational"
    is_configured: Optional[bool] = True
    last_success_at: Optional[str] = None
    last_failure_at: Optional[str] = None
    last_failure_reason: Optional[str] = None
    consecutive_failures: Optional[int] = 0

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

# ----------------- Community Review & Moderation Schemas -----------------
class ReviewCreate(BaseModel):
    rating: float  # 1.0 to 5.0
    title: Optional[str] = None
    body: Optional[str] = None
    comment: Optional[str] = None
    place_id: Optional[str] = None
    travel_date: Optional[str] = None

class ReviewUpdate(BaseModel):
    rating: Optional[float] = None
    title: Optional[str] = None
    body: Optional[str] = None
    comment: Optional[str] = None

class ReviewResponse(BaseModel):
    id: str
    place_id: str
    user_id: str
    user_name: str
    user_avatar: Optional[str] = None
    rating: float
    title: Optional[str] = None
    body: str
    comment: Optional[str] = None
    status: str
    moderation_note: Optional[str] = None
    reports: List[ReviewReportResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None
    trust_source: str = "VANVAS_COMMUNITY"

    class Config:
        from_attributes = True

class ReviewAggregateResponse(BaseModel):
    place_id: str
    average_rating: Optional[float] = None
    total_reviews: int = 0
    reviews: List[ReviewResponse] = []
    trust_source: str = "VANVAS_COMMUNITY"

class ReviewReportCreate(BaseModel):
    review_id: Optional[str] = None
    reason: str
    details: Optional[str] = None

class ReviewReportResponse(BaseModel):
    id: str
    review_id: str
    reporter_user_id: str
    reason: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ReviewModerateRequest(BaseModel):
    status: str  # published, hidden, removed
    moderation_note: Optional[str] = None


# ----------------- Travel Commerce Foundation Schemas -----------------
class Offer(BaseModel):
    provider: str
    provider_offer_id: Optional[str] = None
    product_type: str  # stay, transport, rental, place, experience
    title: str
    destination: Optional[str] = None
    price: Optional[float] = None  # None if unknown
    currency: Optional[str] = "INR"
    availability_state: str = "UNKNOWN"  # AVAILABLE, LIMITED, UNKNOWN, UNAVAILABLE
    valid_until: Optional[datetime] = None
    cancellation_policy: Optional[str] = None
    deep_link: Optional[str] = None
    booking_capability: str = "DISCOVERY_ONLY"  # DISCOVERY_ONLY, EXTERNAL_CHECKOUT, IN_APP_BOOKING, UNAVAILABLE
    trust_source: str = "VANVAS_VERIFIED"
    source_id: Optional[str] = None
    is_live: bool = False


class BookingItemResponse(BaseModel):
    id: str
    booking_id: str
    provider_offer_id: Optional[str] = None
    product_type: str
    title: str
    destination: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    quantity: int = 1
    unit_price: Optional[float] = None
    total_price: Optional[float] = None

    class Config:
        from_attributes = True


class BookingEventResponse(BaseModel):
    id: str
    booking_id: str
    event_type: str
    previous_status: Optional[str] = None
    new_status: str
    created_at: datetime

    class Config:
        from_attributes = True


class BookingResponse(BaseModel):
    id: str
    user_id: str
    trip_id: Optional[str] = None
    provider: str
    provider_booking_id: Optional[str] = None
    booking_type: str
    status: str
    currency: str = "INR"
    total_amount: Optional[float] = None
    confirmation_reference: Optional[str] = None
    checkout_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[BookingItemResponse] = []
    events: List[BookingEventResponse] = []

    class Config:
        from_attributes = True


class BookingIntentCreateRequest(BaseModel):
    trip_id: Optional[str] = None
    provider: str = "vanvas_curated"
    provider_offer_id: Optional[str] = None
    booking_type: str = "stay"
    title: Optional[str] = "Booking Item"
    destination: Optional[str] = None
    unit_price: Optional[float] = None
    total_amount: Optional[float] = None
    currency: str = "INR"
    quantity: int = 1
    checkout_url: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    items: Optional[List[Dict[str, Any]]] = None
    metadata: Optional[Dict[str, Any]] = None


class BookingTransitionRequest(BaseModel):
    target_status: str
    reason: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

