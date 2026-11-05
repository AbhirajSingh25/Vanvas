export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  avatar_preset?: string | null;
  is_verified?: boolean;
  role?: string;
  preferred_travel_style?: string;
  wake_up_preference?: string;
  activity_intensity?: string;
  dietary_preference?: string;
  interests?: string;
  companion_style?: string;
  created_at?: string;
  theme?: string;
  layout_density?: "standard" | "compact";
}

export interface UserPreferences {
  preferred_travel_style?: string;
  wake_up_preference?: string;
  activity_intensity?: string;
  dietary_preference?: string;
  interests?: string[];
  theme?: string;
  layout_density?: "standard" | "compact";
  location_mode?: string;
}

export interface Destination {
  id: string;
  name: string;
  slug: string;
  state: string;
  tagline?: string;
  description?: string;
  cover_image?: string;
  image_url?: string;
  hero_image?: string;
  badge?: string;
  ideal_duration_days?: number;
  average_daily_budget?: number;
  recommended_season?: string;
  lat?: number;
  lng?: number;
  places_count?: number;
  is_curated?: boolean;
}

export interface Place {
  id: string;
  destination_id: string;
  name: string;
  category: string;
  short_description?: string;
  description?: string;
  image_url?: string;
  rating?: number;
  reviews_count?: number;
  estimated_cost?: number;
  duration_minutes?: number;
  lat?: number;
  lng?: number;
  opening_time?: string;
  closing_time?: string;
  address?: string;
  tags?: string[];
  is_must_visit?: boolean;
  time_of_day?: string;
  distance_km?: number;
  is_live?: boolean;
  source?: string;
  why_vanvas_recommends?: string;
  cluster?: string;
  zone?: string;
}

export interface Hotel {
  id: string;
  destination_id: string;
  name: string;
  style?: string;
  price_tier?: string;
  price_per_night?: number;
  rating?: number;
  image_url?: string;
  address?: string;
  booking_url?: string;
  amenities?: string[];
}

export interface RentalOption {
  id: string;
  destination_id: string;
  vehicle_type: string;
  vendor_name: string;
  daily_rate: number;
  deposit_amount?: number;
  image_url?: string;
  contact_number?: string;
}

export interface TransportOption {
  id: string;
  origin_city: string;
  destination_id: string;
  transport_type: string;
  operator_name?: string;
  departure_time?: string;
  arrival_time?: string;
  estimated_cost: number;
  duration_minutes?: number;
}

export interface ItineraryItem {
  id: string;
  itinerary_day_id?: string;
  place_id?: string;
  place?: Place;
  item_type?: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  duration_minutes?: number;
  cost?: number;
  status?: "pending" | "completed" | "skipped";
  is_locked?: boolean;
  sort_order?: number;
}

export interface ItineraryDay {
  id: string;
  trip_id: string;
  day_number: number;
  date: string;
  theme?: string;
  items: ItineraryItem[];
}

export interface TripSummary {
  id: string;
  destination_id: string;
  destination_name?: string;
  destination_slug?: string;
  cover_image?: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  total_budget: number;
  spent_amount?: number;
  travellers_count: number;
  companion_type?: string;
  status: "active" | "planned" | "completed" | "cancelled";
  created_at?: string;
}

export interface Trip extends TripSummary {
  origin_city: string;
  transport_mode?: string;
  travel_style?: string;
  wake_up_preference?: string;
  activity_intensity?: string;
  interests?: string[];
  itinerary_days: ItineraryDay[];
  notes?: string;
}

export interface BudgetSummary {
  total_budget: number;
  spent_amount: number;
  remaining_amount: number;
  currency: string;
  categories: {
    name: string;
    allocated: number;
    spent: number;
  }[];
}

export interface Expense {
  id: string;
  trip_id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  payment_method?: string;
  notes?: string;
  payer_user_id?: string;
}

export interface ImHereScheduleCard {
  title: string;
  time: string;
  category: string;
  description: string;
  action_label?: string;
  action_type?: string;
  duration_hint?: string;
}

export interface ImHereResponse {
  trip_id: string;
  current_location_name?: string;
  current_time?: string;
  hours_available?: number;
  arrival_hub?: string;
  now_item: ImHereScheduleCard;
  next_item: ImHereScheduleCard;
  later_items: ImHereScheduleCard[];
  hotel_checkin_guidance?: {
    hotel_name?: string;
    check_in_time?: string;
    status: "ready" | "early" | "late";
    message: string;
    luggage_drop_possible?: boolean;
  };
  transport_guidance?: {
    recommended_mode: string;
    estimated_fare: string;
    tip: string;
  };
  nearby_food?: Place[];
  weather_summary?: string;
  replan_actions?: {
    label: string;
    action_type: string;
  }[];
}

export interface CopilotAction {
  title: string;
  action_type: string;
  params?: Record<string, any>;
}

export interface CopilotPlace {
  id: string;
  name: string;
  category: string;
  rating?: number;
  estimated_cost?: number;
  short_description?: string;
  image_url?: string;
}

export interface CopilotChatResponse {
  message: string;
  conversation_id: string;
  actions?: CopilotAction[];
  places?: CopilotPlace[];
  trip_context_applied?: boolean;
}

export interface RoadTripCorridor {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distance_km: number;
  drive_time_hours: number;
  scenic_rating: number;
  description: string;
  cover_image?: string;
  suggested_days: number;
  highlights: string[];
}

export interface RoadTripStop {
  name: string;
  stop_type: "scenic" | "food" | "fuel" | "cultural" | "night_stay";
  location_name: string;
  lat: number;
  lng: number;
  suggested_duration_minutes: number;
  description: string;
}

export interface RoadTripPlanRequest {
  origin: string;
  destination: string;
  duration_days: number;
  travellers_count: number;
  budget_preference?: "budget" | "moderate" | "premium";
  corridor_id?: string;
  vehicle_type?: string;
}

export interface RoadTripPlanResponse {
  corridor_name: string;
  total_distance_km: number;
  total_driving_hours: number;
  days: {
    day_number: number;
    from_city: string;
    to_city: string;
    distance_km: number;
    driving_time_hours: number;
    stops: RoadTripStop[];
    overnight_stay: string;
  }[];
  itemized_budget: {
    fuel_estimate: number;
    tolls_estimate: number;
    food_estimate: number;
    stays_estimate: number;
    total_estimate: number;
  };
  recommended_vehicle_types: string[];
  safety_notes: string[];
}

export interface TrekRoute {
  id: string;
  name: string;
  slug: string;
  region: string;
  base_camp: string;
  duration_days: number;
  max_altitude_meters: number;
  difficulty: "Easy" | "Moderate" | "Challenging" | "Difficult";
  best_months: string[];
  distance_km: number;
  hero_image: string;
  overview: string;
  acclimatization_guide: string;
  safety_advisory: string[];
  itinerary: {
    day: number;
    title: string;
    altitude_m: number;
    trek_distance_km: number;
    duration_hours: number;
    highlights: string;
  }[];
}

export interface ReelWaypoint {
  placeName: string;
  category: string;
  timeHint?: string;
  shortDescription?: string;
}

export interface DestinationReel {
  id: string;
  destinationSlug: string;
  destinationName: string;
  title: string;
  subtitle: string;
  videoUrl: string;
  posterUrl: string;
  creator: string;
  creatorHandle?: string;
  durationLabel: string;
  experienceType: string;
  waypoints: ReelWaypoint[];
}
