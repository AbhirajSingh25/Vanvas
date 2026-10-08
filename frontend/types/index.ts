export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url?: string;
  avatar_type?: string;
  avatar_preset?: string;
  email_verified_at?: string | null;
  is_verified?: boolean;
  created_at: string;
  preferences?: UserPreferences;
}

export interface RegistrationResult {
  message: string;
  email: string;
  email_verified: boolean;
  email_delivery_status?: string;
}

export interface VerifyEmailResult {
  success: boolean;
  message: string;
  email?: string;
  already_verified?: boolean;
}

export interface ResendVerificationResult {
  success: boolean;
  message: string;
  cooldown_seconds: number;
  email_delivery_status?: string;
}

export interface UserPreferences {
  preferred_travel_style?: string;
  wake_up_preference?: string;
  activity_intensity?: string;
  dietary_preference?: string;
  interests?: string;
  accommodation_preference?: string;
  transport_preference?: string;
  companion_style?: string;
  language?: string;
  region?: string;
  currency?: string;
  theme?: string;
  layout_density?: "original" | "compact";
  location_mode?: string;
  notify_trip_reminders?: boolean;
  notify_trip_changes?: boolean;
  notify_booking_updates?: boolean;
  notify_suggestions?: boolean;
  notify_copilot_updates?: boolean;
  notify_announcements?: boolean;
  ai_copilot_enabled?: boolean;
  ai_personalized_recommendations?: boolean;
  ai_use_travel_preferences?: boolean;
  ai_use_trip_context?: boolean;
}

export interface UserStats {
  saved_places_count: number;
  saved_trips_count: number;
  upcoming_trips_count: number;
  completed_trips_count: number;
  reviews_count: number;
  bookings_count: number;
  member_since: string;
}

export interface PasswordChangePayload {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface UserDataExport {
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    avatar_url?: string;
    created_at?: string;
  };
  preferences?: Record<string, any>;
  trips: any[];
  saved_places: any[];
  reviews: any[];
  bookings: any[];
  exported_at: string;
}

export interface Destination {
  id: string;
  name: string;
  slug: string;
  hindi_name?: string;
  state: string;
  region: string;
  tagline: string;
  description: string;
  hero_image?: string;
  latitude: number;
  longitude: number;
  altitude_meters?: number;
  best_time_to_visit?: string;
  weather_type?: string;
  is_featured: boolean;
  is_curated?: boolean;
  is_dynamic?: boolean;
  places_count?: number;
  hotels_count?: number;
  rentals_count?: number;
}

export interface ActionLink {
  type: "directions" | "website" | "phone" | "booking" | "provider" | string;
  label: string;
  url: string;
}

export interface Place {
  id: string;
  destination_id: string;
  category?: string;
  subcategory?: string;
  name: string;
  slug: string;
  description: string;
  address?: string;
  latitude: number;
  longitude: number;
  price_level?: string;
  price_range?: string;
  approx_cost?: number;
  rating?: number;
  review_count?: number;
  opening_time?: string;
  closing_time?: string;
  opening_hours?: string;
  phone?: string;
  website?: string;
  google_maps_url?: string;
  recommended_duration_mins?: number;
  tags: string;
  image_url?: string;
  photo_url?: string;
  why_vanvas_recommends?: string;
  booking_url?: string;
  is_must_visit: boolean;
  is_hidden_gem: boolean;
  is_indoor: boolean;
  is_saved?: boolean;
  match_score?: number;
  source?: "google_places" | "openstreetmap" | "vanvas_curated" | "vanvas_fallback" | string;
  source_provider?: string;
  source_id?: string;
  source_url?: string;
  is_live?: boolean;
  distance_km?: number;
  hours_available?: boolean;
  is_open_now?: boolean | null;
  open_now?: boolean | null;
  business_status?: string;
  action_links?: ActionLink[];
  data_state?: "LIVE" | "VERIFIED" | "CURATED" | "STALE" | "UNAVAILABLE" | string;
  trust_source?: string;
  last_verified_at?: string;
  menu_url?: string | null;
  menu_source?: string | null;
  menu_available?: boolean | null;
}

export interface DestinationSearchResult {
  name: string;
  city?: string;
  state?: string;
  country?: string;
  latitude: number;
  longitude: number;
  place_type?: string;
  display_name?: string;
  slug?: string;
  source: string;
  source_id?: string;
}

export interface SearchIntentResult {
  intent: "destination" | "place" | "weather" | "web_info";
  query: string;
  confidence: number;
  extracted_destination?: string;
  extracted_category?: string;
  suggested_action: string;
}

export interface WebSearchResult {
  title: string;
  snippet: string;
  url?: string;
  source?: string;
  published_date?: string;
}

export interface WebSearchResponse {
  query: string;
  results: WebSearchResult[];
  summary?: string;
  is_available: boolean;
  provider: string;
}

export interface Hotel {
  id: string;
  destination_id: string;
  name: string;
  property_name?: string;
  address: string;
  latitude: number;
  longitude: number;
  price_per_night?: number | null;
  total_price?: number | null;
  price_formatted?: string | null;
  currency?: string;
  taxes?: number | null;
  available?: boolean | null;
  availability_state?: "AVAILABLE" | "UNAVAILABLE" | "UNKNOWN" | string;
  rating?: number | null;
  review_count?: number | null;
  hotel_style?: string;
  accommodation_type?: string;
  property_type?: string;
  room_type?: string;
  traveller_tags?: string[];
  amenities?: string;
  check_in_time?: string;
  check_out_time?: string;
  image_url?: string;
  photos?: string[];
  booking_url?: string;
  badge?: string;
  phone?: string;
  website?: string;
  source?: "vanvas_curated" | "openstreetmap" | "google_places" | string;
  source_provider?: string;
  source_id?: string;
  source_url?: string;
  provider_source?: string | null;
  provider_listing_id?: string | null;
  provider_url?: string | null;
  is_live?: boolean;
  price_verified?: boolean;
  distance_km?: number;
  action_links?: ActionLink[];
  data_state?: "LIVE" | "VERIFIED" | "CURATED" | "STALE" | "UNAVAILABLE" | string;
  trust_source?: string;
  last_verified_at?: string;
}

export interface RentalOption {
  id: string;
  destination_id: string;
  provider_name: string;
  vehicle_type: string;
  vehicle_name: string;
  brand?: string;
  model?: string;
  price_per_hour?: number | null;
  price_per_day?: number | null;
  deposit?: number | null;
  deposit_amount?: number | null;
  location: string;
  address?: string;
  latitude: number;
  longitude: number;
  opening_hours?: string;
  hours_available?: boolean;
  is_open_now?: boolean | null;
  rating?: number | null;
  image_url?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  google_maps_url?: string;
  source?: "vanvas_curated" | "openstreetmap" | "google_places" | "provider_direct" | string;
  source_provider?: string;
  source_id?: string;
  source_url?: string;
  is_live?: boolean;
  inventory_verified?: boolean;
  verification_status?: "LIVE_PROVIDER" | "LIVE_OSM" | "CURATED" | "UNVERIFIED" | "UNAVAILABLE" | string;
  distance_km?: number;
  action_links?: ActionLink[];
  data_state?: "LIVE" | "VERIFIED" | "CURATED" | "STALE" | "UNAVAILABLE" | string;
  trust_source?: string;
  last_verified_at?: string;
}


export interface TransportOption {
  id: string;
  origin_city: string;
  destination_id: string;
  transport_type: string;
  operator_name: string;
  departure_time: string;
  arrival_time: string;
  duration_hours: number;
  price: number;
  departure_location: string;
  arrival_location: string;
  booking_url?: string | null;
  booking_label?: string;
  recommendation_badge?: string | null;
  source?: "vanvas_curated" | "openstreetmap" | string;
  source_id?: string;
  is_live?: boolean;
  schedule_type?: "curated_schedule" | "live_realtime" | "calculated_route" | "estimated_transfer" | string;
  availability_state?: "INDICATIVE" | "AVAILABLE" | "ESTIMATED" | "UNAVAILABLE" | string;
  data_state?: "CURATED" | "LIVE" | "ESTIMATED" | "UNAVAILABLE" | string;
  trust_source?: string;
  disclaimer?: string;
  action_links?: ActionLink[];
}

export interface ItineraryItem {
  id: string;
  itinerary_id: string;
  place_id?: string;
  title: string;
  category: string;
  start_time: string;
  end_time: string;
  duration_mins: number;
  estimated_cost: number;
  travel_time_from_prev_mins: number;
  distance_from_prev_km: number;
  notes?: string;
  reason_for_recommendation?: string;
  map_lat?: number;
  map_lng?: number;
  booking_url?: string;
  opening_hours?: string;
  status: string; // upcoming, in_progress, completed, skipped
  is_locked: boolean;
}

export interface ItineraryDay {
  id: string;
  trip_id: string;
  day_number: number;
  date: string;
  title: string;
  theme: string;
  status: string;
  items: ItineraryItem[];
}

export interface Trip {
  id: string;
  user_id: string;
  destination_id: string;
  destination: Destination;
  title: string;
  start_date: string;
  end_date: string;
  num_days: number;
  budget_total: number;
  budget_spent: number;
  travellers_count: number;
  companion_type: string;
  travel_style: string;
  wake_up_preference: string;
  activity_intensity: string;
  interests: string;
  origin_city?: string;
  trip_mode?: string;
  transport_mode?: string;
  transport_details_json?: string;
  status: string;
  invite_code: string;
  hotel?: Hotel;
  transport?: TransportOption;
  rental?: RentalOption;
  itineraries: ItineraryDay[];
  revisions?: TripRevision[];
  vehicle_type?: string;
  vehicle_mileage_kpl?: number;
  fuel_price_per_litre?: number;
  route_geometry_json?: string;
  road_trip_stops_json?: string;
  budget_breakdown_json?: string;
  created_at: string;
}

export interface TripRevision {
  id: string;
  trip_id: string;
  user_id?: string | null;
  revision_number: number;
  action_type: string;
  reason: string;
  changes: {
    action_type?: string;
    target_day?: number;
    reason?: string;
    items_count?: number;
    travellers_count?: number;
    moved_to_day?: number;
    applied_at?: string;
    [key: string]: any;
  };
  created_at: string;
}

export interface ActionImpactSummary {
  time_impact_mins: number;
  cost_impact_inr: number;
  items_added: Array<{ title: string; time?: string; cost?: number; [key: string]: any }>;
  items_removed: Array<{ title: string; time?: string; cost?: number; reason?: string; [key: string]: any }>;
  items_moved: Array<{ title: string; old_time?: string; new_time?: string; [key: string]: any }>;
  items_kept: Array<{ title: string; time?: string; [key: string]: any }>;
  weather_note?: string | null;
  budget_note?: string | null;
  safety_note?: string | null;
}

export interface ActionPreviewRequest {
  action_type: string;
  target_item_id?: string | null;
  target_day_number?: number;
  parameters?: Record<string, any>;
  current_time?: string | null;
  current_lat?: number | null;
  current_lng?: number | null;
}

export interface ActionPreviewResponse {
  action_type: string;
  target_day_number: number;
  headline: string;
  summary: string;
  requires_confirmation: boolean;
  impact: ActionImpactSummary;
  proposed_items: ItineraryItem[];
  payload_for_apply: Record<string, any>;
}

export interface ActionApplyRequest {
  action_type: string;
  target_day_number?: number;
  reason: string;
  target_item_id?: string | null;
  parameters?: Record<string, any>;
  payload_for_apply?: Record<string, any>;
}

export interface ActionApplyResponse {
  success: boolean;
  message: string;
  revision: TripRevision;
  trip: Trip;
}

export interface CurrentStateResponse {
  trip_id: string;
  active_day_number: number;
  current_time_str: string;
  current_location_name?: string | null;
  current_weather?: Record<string, any> | null;
  budget_spent: number;
  budget_total: number;
  budget_projected: number;
  budget_remaining: number;
  completed_count: number;
  missed_count: number;
  pending_count: number;
  total_items_count: number;
  upcoming_item?: ItineraryItem | null;
  safety_alerts: string[];
  recent_revisions: TripRevision[];
}

export interface TripSummary {
  id: string;
  title: string;
  destination_name: string;
  destination_slug: string;
  hero_image?: string;
  start_date: string;
  end_date: string;
  num_days: number;
  budget_total: number;
  budget_spent: number;
  companion_type: string;
  travel_style: string;
  origin_city?: string;
  destination?: { name: string; slug: string } | null;
  trip_mode?: string;
  transport_mode?: string;
  status: string;
}

export interface ExpenseShare {
  id: string;
  expense_id: string;
  user_id: string;
  user_name?: string;
  owed_amount: number;
  percentage?: number | null;
  shares_count?: number | null;
  item_details_json?: string | null;
  created_at?: string;
}

export interface Expense {
  id: string;
  trip_id: string;
  user_id?: string;
  user_name: string;
  payer_name?: string;
  title: string;
  category: string;
  amount: number;
  payment_method: string;
  date: string;
  notes?: string;
  split_method?: "EQUAL" | "EXACT" | "PERCENTAGE" | "SHARES" | "CUSTOM" | "ITEMIZED" | string;
  tax_amount?: number;
  tip_amount?: number;
  discount_amount?: number;
  is_recurring?: boolean;
  recurring_frequency?: string | null;
  receipt_url?: string | null;
  receipt_data_json?: string | null;
  created_at: string;
  shares?: ExpenseShare[];
}

export interface SettlementPayment {
  id: string;
  trip_id: string;
  payer_user_id: string;
  payer_name: string;
  receiver_user_id: string;
  receiver_name: string;
  amount: number;
  payment_method: "Cash" | "UPI" | "Bank Transfer" | "Other" | string;
  notes?: string;
  settled_at: string;
  created_at: string;
}

export interface DebtSimplificationItem {
  debtor_user_id: string;
  debtor_name: string;
  creditor_user_id: string;
  creditor_name: string;
  amount: number;
}

export interface UserBalanceItem {
  user_id: string;
  user_name: string;
  avatar_url?: string;
  total_paid: number;
  total_share: number;
  net_balance: number;
}

export interface TripLedgerBalancesResponse {
  trip_id: string;
  total_spent: number;
  per_person_average: number;
  current_user_id: string;
  user_net_balance: number;
  user_you_owe: number;
  user_you_are_owed: number;
  balances: UserBalanceItem[];
  direct_debts: DebtSimplificationItem[];
  simplified_debts: DebtSimplificationItem[];
  settlement_history: SettlementPayment[];
}

export interface ReceiptOcrItem {
  title: string;
  amount: number;
  category?: string;
}

export interface ReceiptOcrResponse {
  merchant?: string;
  date?: string;
  total_amount: number;
  tax_amount: number;
  items: ReceiptOcrItem[];
  confidence: number;
  raw_text?: string;
}

// ----------------- Road Trip Mode Types -----------------
export interface RoadTripLeg {
  origin: string;
  destination: string;
  origin_lat: number;
  origin_lng: number;
  dest_lat: number;
  dest_lng: number;
  distance_km: number;
  duration_minutes: number;
  geometry: Array<[number, number]>;
  departure_time: string;
  arrival_time: string;
  route_source: string;
  is_live: boolean;
  warning?: string;
}

export interface RoadTripStop {
  id: string;
  name: string;
  type: string;
  category?: string;
  distance_off_route_km: number;
  route_offset_km?: number;
  detour_km?: number;
  detour_time_mins?: number;
  time_needed_mins: number;
  approx_cost: number;
  cost_label?: string;
  why_stop: string;
  opening_hours?: string;
  opening_status?: string;
  lat: number;
  lng: number;
  image_url?: string;
  action_label: string;
  action_type: string;
  data_state?: "CURATED" | "LIVE" | "ESTIMATED" | "USER ENTERED" | string;
  next_leg_info?: string;
}

export interface RoadTripFoodOption {
  meal?: string;
  name: string;
  type: string;
  price_band?: string;
  price?: string;
  route_detour?: string;
  why?: string;
  specialty?: string;
  timing?: string;
  action?: string;
}

export interface RoadTripDay {
  day_number: number;
  title: string;
  theme: string;
  origin: string;
  destination: string;
  driving_distance_km: number;
  driving_time_hours: number;
  route_source?: string;
  geometry?: Array<[number, number]>;
  legs?: RoadTripLeg[];
  timeline: ItineraryItem[];
  stops: RoadTripStop[];
  food_options: RoadTripFoodOption[];
  stay_options: Hotel[];
  fuel_estimated_inr: number;
}

export interface CustomExpenseItem {
  id: string;
  name: string;
  category: "Food" | "Fuel" | "Stay" | "Transport" | "Activity" | "Other" | string;
  amount: number;
  basis: "trip_total" | "per_person";
  notes?: string;
}

export interface RoadTripFuelBreakdown {
  total_distance_km: number;
  vehicle_type: string;
  fuel_type?: "Petrol" | "Diesel" | "CNG" | "Electric" | "Custom" | string;
  fuel_unit?: string;
  assumed_mileage_kpl: number;
  assumed_fuel_rate_per_litre: number;
  estimated_fuel_cost_inr: number;
  data_state: string;
  calculation_text: string;
}

export interface RoadTripBudgetEstimate {
  fuel_estimated: number;
  tolls_estimated: number;
  stay_estimated: number;
  food_estimated: number;
  activities_estimated: number;
  parking_other_estimated: number;
  total_estimated: number;
  per_person_estimated: number;
  travellers_count: number;
  is_custom_budget: boolean;
  fuel_type?: string;
  fuel_unit?: string;
  fuel_efficiency?: number;
  fuel_rate?: number;
  stay_nights?: number;
  stay_rate_per_night?: number;
  stay_rooms?: number;
  food_per_person_per_day?: number;
  food_total_override?: number;
  include_fuel?: boolean;
  include_tolls?: boolean;
  include_parking?: boolean;
  include_food?: boolean;
  include_stay?: boolean;
  include_activities?: boolean;
  custom_expenses?: CustomExpenseItem[];
}

export interface RoadTripPlanRequest {
  origin: string;
  destination: string;
  travellers_count: number;
  vehicle_type: "Car" | "Bike" | "SUV" | "Rental" | string;
  trip_style: "Fast" | "Balanced" | "Explore" | string;
  budget_inr?: number;
  start_date: string;
  end_date?: string;
  overnight_mode?: "auto" | "manual";
  manual_overnights?: string[];
  preferences?: string[];
  fuel_type?: string;
  fuel_unit?: string;
  fuel_efficiency?: number;
  fuel_rate?: number;
  stay_nights?: number;
  stay_rate_per_night?: number;
  stay_rooms?: number;
  food_per_person_per_day?: number;
  food_total_override?: number;
  include_fuel?: boolean;
  include_tolls?: boolean;
  tolls_amount?: number;
  include_parking?: boolean;
  parking_amount?: number;
  include_food?: boolean;
  include_stay?: boolean;
  include_activities?: boolean;
  activities_amount?: number;
  custom_expenses?: CustomExpenseItem[];
}

export interface RoadTripPlanResponse {
  id: string;
  title: string;
  origin: string;
  destination: string;
  start_date: string;
  end_date: string;
  num_days: number;
  total_distance_km: number;
  total_driving_time_hours: number;
  vehicle_type: string;
  trip_style: string;
  route_geometry: Array<[number, number]>;
  route_source?: string;
  is_live_route?: boolean;
  routing_warning?: string;
  corridor_name: string;
  legs?: RoadTripLeg[];
  days: RoadTripDay[];
  fuel_breakdown: RoadTripFuelBreakdown;
  budget_estimate: RoadTripBudgetEstimate;
  recommended_stops: RoadTripStop[];
  travel_tips: string[];
  created_trip_id?: string;
  timing_breakdown?: Record<string, number>;
}

export interface RoadTripCorridor {
  id: string;
  title: string;
  origin: string;
  destination: string;
  distance_km: number;
  days_suggested: number;
  highlights: string[];
  image: string;
}


export interface BudgetCategory {
  category: string;
  estimated: number;
  spent: number;
  remaining: number;
}

export interface BudgetSummary {
  total_budget: number;
  total_spent: number;
  total_remaining: number;
  daily_average_budget: number;
  daily_average_spent: number;
  per_person_estimated?: number;
  per_person_spent?: number;
  categories: BudgetCategory[];
  recent_expenses: Expense[];
}

export interface GroupCompatibility {
  place_id: string;
  place_name: string;
  category: string;
  love_count: number;
  like_count: number;
  no_count: number;
  total_votes: number;
  compatibility_score: number;
  is_consensus_favorite: boolean;
}

export interface TripMemberItem {
  id: string;
  user_id: string;
  full_name: string;
  role: string; // 'owner' | 'member'
  avatar_url?: string;
  joined_at?: string;
}

export interface TripInvitePreview {
  trip_id: string;
  title: string;
  destination_name: string;
  destination_slug: string;
  destination_hero_image?: string;
  state: string;
  region: string;
  start_date: string;
  end_date: string;
  num_days: number;
  companion_type: string;
  travel_style: string;
  owner_name: string;
  members_count: number;
  is_member: boolean;
  invite_code: string;
}

export interface GroupSummary {
  trip_id: string;
  members_count: number;
  members: TripMemberItem[];
  compatibility_ranking: GroupCompatibility[];
}

export interface ChecklistItem {
  id: string;
  trip_id: string;
  category: string;
  item_name: string;
  is_checked: boolean;
  is_custom: boolean;
}

export interface WeatherSnapshot {
  id?: string;
  destination_id?: string;
  forecast_date?: string;
  date?: string;
  temp_c: number;
  temperature_max?: number;
  temperature_min?: number;
  condition: string;
  weatherCode?: number;
  is_rain: boolean;
  is_snow?: boolean;
  humidity: number;
  wind_kph: number;
  precipitation_prob?: number;
  advisory?: string;
  icon?: string;
  data_state?: string;
  trust_source?: string;
}

export interface StructuredWeather {
  temperature: number | null;
  apparentTemperature?: number | null;
  weatherCode?: number | null;
  condition: string;
  isDay?: boolean;
  windSpeed?: number | null;
  precipitation?: number | null;
  humidity?: number | null;
  updatedAt?: string;
  location?: string;
  is_available: boolean;
  advisory?: string;
  icon?: string;
  daily: WeatherSnapshot[];
  data_state?: string;
  trust_source?: string;
}

export interface ImHereResponse {
  current_location_name: string;
  hotel_info?: {
    name: string;
    address: string;
    check_in_time: string;
    distance_km: number;
  };
  timing_guidance: string;
  next_3_hours_plan: ItineraryItem[];
  nearby_food: Place[];
  nearby_attractions: Place[];
  local_transport_options: Array<{
    mode: string;
    est_fare: string;
    tip: string;
  }>;
}

export interface ArrivalRecommendation {
  transport_option: TransportOption;
  expected_arrival: string;
  hotel_check_in_time: string;
  breakfast_window: string;
  luggage_drop_plan: string;
  first_activity_time: string;
  overall_verdict: string;
  recommendation_score: number;
}

export interface ArrivalOptimizerResponse {
  destination_name: string;
  best_option: ArrivalRecommendation;
  alternative_options: ArrivalRecommendation[];
  traveller_tip: string;
}

export interface CopilotResponse {
  reply: string;
  suggested_actions?: Array<{ label: string; action: string }>;
  relevant_places?: Place[];
}

export interface CopilotAction {
  action_type: string;
  title: string;
  payload?: any;
}

export interface CopilotChatResponse {
  conversation_id?: string;
  message: string;
  actions: CopilotAction[];
  places: Place[];
  plan?: {
    headline: string;
    summary: string;
    duration_hours: number;
    items: any[];
  } | null;
  metadata?: {
    provider: string;
    model: string;
    is_enabled: boolean;
    tools_executed_count: number;
    latency_ms: number;
  };
  error?: string | null;
}

export interface AdminStats {
  total_users: number;
  total_trips: number;
  canonical_destinations?: number;
  dynamic_destinations?: number;
  total_destinations: number;
  total_places: number;
  active_trips_count: number;
  provider_health: Array<{
    provider_name: string;
    status: string;
    is_live: boolean;
    latency_ms: number;
    message: string;
  }>;
}

export interface ReviewReportItem {
  id: string;
  review_id: string;
  reporter_user_id: string;
  reason: string;
  status: string;
  created_at: string;
}

export interface Review {
  id: string;
  place_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string | null;
  rating: number;
  title?: string | null;
  body?: string;
  comment: string;
  travel_date?: string | null;
  status: "published" | "pending" | "hidden" | "reported" | "removed";
  moderation_note?: string | null;
  reports?: ReviewReportItem[];
  created_at: string;
  updated_at?: string | null;
  trust_source: "VANVAS_COMMUNITY";
}

export interface ReviewAggregate {
  place_id: string;
  total_reviews: number;
  average_rating: number | null;
  rating_distribution?: Record<string, number>;
  reviews?: Review[];
  trust_source: "VANVAS_COMMUNITY";
}

export interface ReviewCreateInput {
  place_id: string;
  rating: number;
  title?: string;
  comment?: string;
  body?: string;
  travel_date?: string;
}

export interface ReviewReportInput {
  review_id: string;
  reason: "inappropriate" | "spam" | "incorrect_info" | "other" | string;
  details?: string;
}

// ---------------------------------------------------------------------------
// TRAVEL COMMERCE FOUNDATION TYPES
// ---------------------------------------------------------------------------

export type BookingCapability =
  | "DISCOVERY_ONLY"
  | "EXTERNAL_CHECKOUT"
  | "IN_APP_BOOKING"
  | "UNAVAILABLE";

export type BookingStatus =
  | "DRAFT"
  | "CHECKING_AVAILABILITY"
  | "AVAILABLE"
  | "PAYMENT_REQUIRED"
  | "PAYMENT_PROCESSING"
  | "CONFIRMING"
  | "CONFIRMED"
  | "PROVIDER_HANDOFF"
  | "UNAVAILABLE"
  | "PAYMENT_FAILED"
  | "CONFIRMATION_FAILED"
  | "CANCELLED"
  | "REFUND_PENDING"
  | "REFUNDED"
  | "DISCOVERED"
  | "SELECTED"
  | "CHECKOUT_READY"
  | "PENDING"
  | "FAILED"
  | string;

export interface Offer {
  id?: string;
  provider: string;
  provider_offer_id?: string | null;
  product_type?: "stay" | "transport" | "rental" | "activity" | "place" | string;
  offer_type?: string;
  title: string;
  destination?: string;
  room_type?: string;
  price?: number | null;
  base_amount?: number | null;
  taxes?: number | null;
  fees?: number | null;
  total_amount?: number | null;
  currency?: string | null;
  availability_state?: "AVAILABLE" | "LIMITED" | "UNAVAILABLE" | "UNKNOWN" | string;
  valid_until?: string | null;
  cancellation_policy?: string | null;
  refundable?: boolean;
  deep_link?: string | null;
  booking_capability?: BookingCapability;
  trust_source?: string;
  source_id?: string | null;
  is_live?: boolean;
  unit_price?: number;
  price_formatted?: string;
  check_in?: string;
  check_out?: string;
  metadata?: Record<string, any>;
}

export interface BookingItem {
  id: string;
  booking_id: string;
  provider_offer_id?: string | null;
  product_type: string;
  title: string;
  destination?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  quantity: number;
  unit_price?: number | null;
  total_price?: number | null;
  metadata?: Record<string, any>;
  metadata_json?: string | null;
}

export interface BookingEvent {
  id: string;
  booking_id: string;
  event_type: string;
  previous_status?: string | null;
  new_status: string;
  metadata?: Record<string, any>;
  metadata_json?: string | null;
  created_at: string;
}

export interface PaymentTransaction {
  id: string;
  booking_id: string;
  user_id: string;
  payment_gateway: string;
  gateway_order_id?: string | null;
  gateway_payment_id?: string | null;
  amount: number;
  currency: string;
  status: string;
  idempotency_key?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface Booking {
  id: string;
  public_booking_reference?: string | null;
  user_id: string;
  trip_id?: string | null;
  provider: string;
  provider_booking_id?: string | null;
  booking_type: string;
  status: BookingStatus;
  payment_status: string;
  currency: string;
  total_amount?: number | null;
  base_amount?: number | null;
  taxes?: number | null;
  fees?: number | null;
  cancellation_amount?: number | null;
  refundable: boolean;
  confirmation_reference?: string | null;
  checkout_url?: string | null;
  booking_snapshot?: any;
  idempotency_key?: string | null;
  metadata?: Record<string, any>;
  metadata_json?: string | null;
  created_at: string;
  updated_at?: string | null;
  confirmed_at?: string | null;
  cancelled_at?: string | null;
  items?: BookingItem[];
  events?: BookingEvent[];
  payments?: PaymentTransaction[];
}

export interface BookingIntentInput {
  trip_id?: string;
  provider: string;
  booking_type: string;
  currency?: string;
  total_amount?: number;
  items: Array<{
    provider_offer_id?: string;
    product_type: string;
    title: string;
    destination: string;
    quantity?: number;
    unit_price?: number;
    total_price?: number;
    start_at?: string;
    end_at?: string;
    metadata?: Record<string, any>;
  }>;
}

export type ProvenanceBadge =
  | "VANVAS PLACE ARTWORK"
  | "EXACT PLACE PHOTO"
  | "LIVE PLACE PHOTO"
  | "DESTINATION CATEGORY ART"
  | "DESTINATION ART"
  | "REGIONAL ART"
  | "UNIVERSAL FALLBACK";

export type ImageSourceType =
  | "real_photo"
  | "editorial_artwork"
  | "category_photo"
  | "fallback";

export type ImageProvenanceTier =
  | "exact_place"
  | "live_place"
  | "destination_category"
  | "destination"
  | "regional_fallback"
  | "universal_fallback";

export type ImageExactness =
  | "exact"
  | "approximate"
  | "category_matched"
  | "destination_matched"
  | "regional_matched"
  | "fallback";

export interface ImageContract {
  url: string;
  imageUrl?: string;
  fallback_url?: string;
  fallbackUrl?: string;
  source: "wikimedia" | "osm" | "vanvas_curated" | "live_provider" | "fallback" | string;
  source_type?: ImageSourceType;
  sourceType?: ImageSourceType;
  provenance: ImageProvenanceTier;
  semantic_category?: string;
  semanticCategory?: string;
  exactness: ImageExactness;
  attribution?: string;
  license?: string;
  alt_text?: string;
  altText?: string;
  badge_label?: ProvenanceBadge;
  badgeLabel?: ProvenanceBadge;
  visual_description?: string;
  visualDescription?: string;
  artwork_key?: string;
  artworkKey?: string;
  is_real_photo?: boolean;
  badge?: string;
}

// ----------------- Solo Traveler Circles Types -----------------

export interface SoloTravelerProfile {
  id: string;
  user_id: string;
  travel_mode: "SOLO" | "GROUP" | "COUPLE";
  is_enabled: boolean;
  discover_before_trip: boolean;
  discover_when_here: boolean;
  preferred_group_size: number;
  interests: string;
  travel_style: string;
  trek_pace: string;
  bio: string;
  created_at: string;
  updated_at?: string;
}

export interface SoloTripIntent {
  id: string;
  user_id: string;
  destination_id?: string;
  destination_name?: string;
  trek_slug?: string;
  trip_id?: string;
  intent_type: "PLANNING" | "CURRENTLY_THERE" | "BOTH";
  start_date: string;
  end_date: string;
  arrival_window: string;
  departure_window: string;
  interests?: string;
  preferred_group_size: number;
  travel_style: string;
  trek_pace: string;
  status: string;
  created_at: string;
}

export interface SoloTravelerCard {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  avatar_type?: string;
  avatar_preset?: string;
  travel_mode: string;
  travel_style: string;
  trek_pace: string;
  interests: string[];
  bio: string;
  proximity_label: string;
  overlapping_days: number;
  overlap_dates_label?: string;
  connection_status: "NONE" | "PENDING_OUTGOING" | "PENDING_INCOMING" | "ACCEPTED" | "DECLINED" | "BLOCKED";
  match_id?: string;
  destination_name?: string;
  trek_slug?: string;
}

export interface SoloDiscoverySummary {
  destination_id?: string;
  destination_name?: string;
  trek_slug?: string;
  total_matches: number;
  travelers: SoloTravelerCard[];
  user_solo_enabled: boolean;
}

export interface SoloMatch {
  id: string;
  sender_user_id: string;
  receiver_user_id: string;
  sender_name: string;
  sender_avatar_url?: string;
  receiver_name: string;
  receiver_avatar_url?: string;
  destination_id?: string;
  trek_slug?: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "BLOCKED";
  message?: string;
  created_at: string;
}

export interface CircleMember {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  avatar_type?: string;
  avatar_preset?: string;
  role: "creator" | "member" | "admin";
  joined_at: string;
  travel_style?: string;
  interests?: string;
}

export interface CircleActivity {
  id: string;
  circle_id: string;
  place_id?: string;
  place_name?: string;
  place_category?: string;
  custom_title?: string;
  category: string;
  meetup_time?: string;
  suggested_by_user_id: string;
  suggested_by_name: string;
  status: string;
  love_count: number;
  like_count: number;
  no_count: number;
  total_votes: number;
  compatibility_score: number;
  is_consensus_favorite: boolean;
  my_vote?: "LOVE" | "LIKE" | "NO" | null;
  created_at: string;
}

export interface TravelCircle {
  id: string;
  creator_user_id: string;
  creator_name: string;
  destination_id?: string;
  destination_name?: string;
  trip_id?: string;
  trek_slug?: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  max_members: number;
  members_count: number;
  activity_type: string;
  meetup_point: string;
  meetup_lat?: number;
  meetup_lng?: number;
  meetup_time?: string;
  status: "DISCOVERABLE" | "FORMING" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  is_member: boolean;
  is_creator: boolean;
  created_at: string;
  members: CircleMember[];
  activities: CircleActivity[];
}

export interface CircleMessage {
  id: string;
  circle_id: string;
  user_id?: string;
  sender_name?: string;
  sender_avatar?: string;
  message_type: "user" | "system" | "ask_vanvas";
  content: string;
  metadata_json?: string;
  created_at: string;
}

export interface UserNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  category: string;
  entity_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface AskVanvasCircleResponse {
  plan_title: string;
  narrative: string;
  suggested_activities: Array<{
    place_id?: string;
    place_name?: string;
    category?: string;
    timing?: string;
    approx_cost?: number;
    highlight?: string;
    is_must_visit?: boolean;
  }>;
  weather_summary?: string;
  safety_advisories: string[];
  estimated_cost_per_person?: number;
}

export interface SoloDirectMessage {
  id: string;
  match_id: string;
  sender_user_id: string;
  receiver_user_id: string;
  sender_name: string;
  sender_avatar_url?: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface EmergencyContactItem {
  label: string;
  number: string;
}

export interface SoloDestinationIntelligence {
  destination_id: string;
  slug: string;
  name: string;
  state: string;
  region: string;
  tagline: string;
  atmosphere_type: "mountain" | "coastal" | "desert" | "heritage" | "spiritual" | "forest" | "urban";
  safe_areas: string[];
  getting_around: string[];
  stay_tips: string[];
  dining_tips: string[];
  solo_experiences: string[];
  etiquette: string[];
  emergency_contacts: EmergencyContactItem[];
  best_seasons: string[];
  weather_summary?: string;
  solo_friendliness_score: number;
  packing_essentials: string[];
  money_connectivity: string[];
  source_metadata?: Record<string, any>;
}

export interface DestinationRecommendation {
  destination_id: string;
  destination_name: string;
  destination_slug: string;
  selected_styles: string[];
  total_places_matched: number;
  recommended_places: Place[];
  recommended_stays: Hotel[];
  recommended_mobility: RentalOption[];
  field_note?: string;
  style_breakdown?: Record<string, number>;
}

export interface DestinationResearchResult {
  job_id: string;
  query: string;
  canonical_slug: string;
  destination_name: string;
  status: string;
  stage: string;
  destination: Destination;
  places_count: number;
  hotels_count: number;
  rentals_count: number;
  intelligence: SoloDestinationIntelligence;
  source_trail?: Array<{
    step: string;
    source: string;
    count?: number;
    timestamp: string;
  }>;
}

export interface BookingCheckoutPayload {
  trip_id?: string | null;
  provider?: string;
  provider_offer_id?: string | null;
  booking_type?: string;
  title: string;
  destination: string;
  check_in?: string;
  check_out?: string;
  guests: number;
  rooms?: number;
  traveller_name: string;
  traveller_email: string;
  traveller_phone?: string;
  special_requests?: string;
  unit_price: number;
  idempotency_key?: string;
  metadata?: Record<string, any>;
}

export interface PaymentInitiateResponse {
  booking_id: string;
  payment_transaction_id: string;
  payment_gateway: string;
  order_id: string;
  amount: number;
  currency: string;
  key_id?: string | null;
  status: string;
  expires_at?: string | null;
  checkout_payload: Record<string, any>;
}

export interface PaymentVerifyResponse {
  success: boolean;
  booking: Booking;
  message: string;
  public_booking_reference: string;
}

export interface BookingCancellationResponse {
  success: boolean;
  booking_id: string;
  status: string;
  payment_status: string;
  cancellation_amount: number;
  refund_amount: number;
  message: string;
}

export interface BookingReconcileResponse {
  booking: Booking;
  payment_status: string;
  is_terminal: boolean;
  message: string;
}

// ----------------- Travel Intelligence & Live Operations (Phase 4) -----------------

export interface TravelSignal {
  id: string;
  trip_id: string;
  signal_type: string;
  source: string;
  source_reference?: string;
  observed_at: string;
  valid_until?: string;
  freshness: "LIVE" | "CURATED" | "ESTIMATED" | "UNKNOWN" | "STALE";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  raw_state?: Record<string, any>;
  normalized_state?: Record<string, any>;
  fingerprint: string;
  created_at: string;
  updated_at?: string;
}

export interface ReplanProposal {
  id: string;
  trip_id: string;
  insight_id?: string;
  action_id?: string;
  trigger: string;
  affected_items: Array<{
    item_id?: string;
    title: string;
    category?: string;
    start_time: string;
    end_time: string;
    status?: string;
    place_id?: string;
  }>;
  original_schedule: Array<{
    item_id?: string;
    title: string;
    category?: string;
    start_time: string;
    end_time: string;
    status?: string;
    place_id?: string;
  }>;
  proposed_schedule: Array<{
    item_id?: string;
    title: string;
    category?: string;
    start_time: string;
    end_time: string;
    status?: string;
    place_id?: string;
    notes?: string;
  }>;
  reason: string;
  estimated_travel_impact?: Record<string, any>;
  budget_impact?: Record<string, any>;
  booking_impact?: Record<string, any>;
  confidence: number;
  status: "PROPOSED" | "ACCEPTED" | "REJECTED" | "APPLIED" | "EXPIRED" | "DISMISSED";
  created_at: string;
  updated_at?: string;
}

export interface TravelInsight {
  id: string;
  trip_id: string;
  signal_id?: string;
  category: "WEATHER" | "TRANSPORT" | "ROAD_TRAFFIC" | "BOOKING" | "CHECK_IN" | "OPENING_HOURS" | "ITINERARY_TIMING" | "BUDGET" | "LOCATION" | "GROUP_ACTIVITY";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  explanation: string;
  impact?: Record<string, any>;
  recommendation: string;
  confidence: number;
  status: "DETECTED" | "ANALYZING" | "ACTIONABLE" | "PROPOSED" | "ACCEPTED" | "APPLIED" | "DISMISSED" | "EXPIRED" | "RESOLVED" | "FAILED";
  fingerprint: string;
  metadata?: Record<string, any>;
  created_at: string;
  expires_at?: string;
  resolved_at?: string;
  proposals: ReplanProposal[];
  actions?: any[];
}

export interface TripIntelligenceSummary {
  trip_id: string;
  destination_name: string;
  is_live_evaluation: boolean;
  last_evaluated_at: string;
  freshness: "LIVE" | "CURATED" | "ESTIMATED" | "UNKNOWN" | "STALE";
  live_status_headline: string;
  active_insights: TravelInsight[];
  resolved_insights: TravelInsight[];
  pending_proposals: ReplanProposal[];
  recent_signals: TravelSignal[];
  recent_revisions: TripRevision[];
  cadence_mode: "underway" | "imminent" | "near_term" | "planned" | "active";
}
