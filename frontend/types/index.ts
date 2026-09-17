export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url?: string;
  created_at: string;
  preferences?: UserPreferences;
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
}

export interface Destination {
  id: string;
  name: string;
  slug: string;
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

export interface Place {
  id: string;
  destination_id: string;
  category?: string;
  name: string;
  slug: string;
  description: string;
  address?: string;
  latitude: number;
  longitude: number;
  price_level?: string;
  approx_cost?: number;
  rating?: number;
  review_count?: number;
  opening_time?: string;
  closing_time?: string;
  phone?: string;
  website?: string;
  recommended_duration_mins?: number;
  tags: string;
  image_url?: string;
  why_vanvas_recommends?: string;
  booking_url?: string;
  is_must_visit: boolean;
  is_hidden_gem: boolean;
  is_indoor: boolean;
  is_saved?: boolean;
  match_score?: number;
  source?: "google_places" | "openstreetmap" | "vanvas_curated" | "vanvas_fallback" | string;
  source_id?: string;
  is_live?: boolean;
  distance_km?: number;
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
  address: string;
  latitude: number;
  longitude: number;
  price_per_night: number;
  rating: number;
  hotel_style: string;
  amenities: string;
  check_in_time: string;
  check_out_time: string;
  image_url?: string;
  booking_url?: string;
  badge: string;
}

export interface RentalOption {
  id: string;
  destination_id: string;
  provider_name: string;
  vehicle_type: string;
  vehicle_name: string;
  price_per_day: number;
  deposit_amount: number;
  location: string;
  latitude: number;
  longitude: number;
  opening_hours: string;
  rating: number;
  image_url?: string;
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
  booking_url?: string;
  recommendation_badge: string;
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
  status: string;
  invite_code: string;
  hotel?: Hotel;
  rental?: RentalOption;
  itineraries: ItineraryDay[];
  created_at: string;
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
  status: string;
}

export interface Expense {
  id: string;
  trip_id: string;
  user_name: string;
  title: string;
  category: string;
  amount: number;
  payment_method: string;
  date: string;
  notes?: string;
  created_at: string;
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
  id: string;
  destination_id: string;
  forecast_date: string;
  temp_c: number;
  condition: string;
  is_rain: boolean;
  is_snow: boolean;
  humidity: number;
  wind_kph: number;
  advisory: string;
  icon: string;
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
