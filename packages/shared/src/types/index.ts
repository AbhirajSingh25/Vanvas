export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  avatar_preset?: string | null;
  vanvas_id?: string;
  allow_friend_requests_via_id?: boolean;
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
  allow_friend_requests_via_id?: boolean;
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

// ----------------- Friend & Identity -----------------
export interface VanvasIdResponse {
  vanvas_id: string;
}

export interface UserPublicProfile {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  avatar_preset?: string | null;
  vanvas_id?: string | null;
  preferred_travel_style?: string | null;
  interests?: string | null;
  companion_style?: string | null;
  mutual_friends_count?: number;
  friendship_status?: "none" | "pending_incoming" | "pending_outgoing" | "friends" | "blocked" | "self";
}

export interface FriendLookupResult extends UserPublicProfile {
  vanvas_id: string;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_user_id: string;
  created_at: string;
  friend?: {
    id: string;
    full_name: string;
    vanvas_id?: string | null;
    avatar_url?: string | null;
  };
  friend_id?: string;
  friend_name?: string;
  friend_vanvas_id?: string;
  friend_avatar_url?: string | null;
}

export interface FriendRequest {
  id: string;
  sender_user_id?: string;
  receiver_user_id?: string;
  sender_id?: string;
  receiver_id?: string;
  sender_name?: string;
  sender_vanvas_id?: string;
  sender_avatar?: string | null;
  sender_avatar_url?: string | null;
  receiver_name?: string;
  receiver_vanvas_id?: string;
  receiver_avatar?: string | null;
  receiver_avatar_url?: string | null;
  note?: string | null;
  status: "pending" | "accepted" | "declined" | "canceled";
  created_at: string;
  sender?: {
    id?: string;
    full_name: string;
    vanvas_id?: string;
    avatar_url?: string | null;
  };
  receiver?: {
    id?: string;
    full_name: string;
    vanvas_id?: string;
    avatar_url?: string | null;
  };
}

export interface Friend {
  friendship_id: string;
  user_id: string;
  full_name: string;
  avatar_url?: string | null;
  avatar_preset?: string | null;
  vanvas_id?: string | null;
  preferred_travel_style?: string | null;
  connected_since: string;
}

// ----------------- Crew Circles & Pods -----------------
export interface CrewCircleMember {
  id: string;
  circle_id: string;
  user_id: string;
  full_name?: string;
  user_name?: string;
  avatar_url?: string | null;
  avatar_preset?: string | null;
  vanvas_id?: string | null;
  role: "owner" | "admin" | "member" | string;
  joined_at: string;
  user?: {
    id: string;
    full_name: string;
    vanvas_id?: string | null;
    avatar_url?: string | null;
  };
}

export interface CrewCircleTrip {
  id: string;
  circle_id: string;
  trip_id: string;
  title?: string;
  destination_name?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string;
  budget_total?: number;
  budget_spent?: number;
  created_at?: string;
}

export interface CrewCircleSuggestion {
  id: string;
  circle_id: string;
  user_id: string;
  creator_name?: string;
  user_name?: string;
  title: string;
  suggestion_type: string;
  description?: string | null;
  destination_slug?: string | null;
  external_url?: string | null;
  data_json?: string | null;
  upvotes_count?: number;
  downvotes_count?: number;
  votes_count?: number;
  hell_yeah_count?: number;
  yes_count?: number;
  no_count?: number;
  has_voted?: boolean;
  user_vote?: "UP" | "DOWN" | "YES" | "NO" | "HELL_YEAH" | null;
  created_at: string;
}

export interface CrewCircleActivity {
  id: string;
  circle_id: string;
  user_id?: string | null;
  actor_name?: string;
  user_name?: string;
  user_avatar_url?: string | null;
  activity_type: string;
  message?: string;
  content?: string;
  metadata_json?: string | null;
  data_json?: string | null;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string | null;
  };
}

export interface CrewCircle {
  id: string;
  name: string;
  description?: string | null;
  cover_image?: string | null;
  icon_or_cover?: string | null;
  created_by_user_id: string;
  member_count: number;
  trip_count?: number;
  activity_count?: number;
  destination_hint?: string | null;
  is_archived?: boolean;
  my_role?: "owner" | "admin" | "member" | string;
  created_at: string;
  members?: CrewCircleMember[];
  trips?: CrewCircleTrip[];
}

export interface CrewCircleDetail extends CrewCircle {
  members: CrewCircleMember[];
  trips: CrewCircleTrip[];
  suggestions?: CrewCircleSuggestion[];
  active_pods_count?: number;
  recent_activity_count?: number;
}

export interface SplitPodMember {
  id: string;
  split_pod_id: string;
  user_id: string;
  full_name: string;
  joined_at: string;
}

export interface SplitPod {
  id: string;
  circle_id: string;
  trip_id?: string | null;
  name: string;
  description?: string | null;
  created_by_user_id: string;
  member_count: number;
  created_at: string;
  members?: SplitPodMember[];
}

// ----------------- Smart Finance System (3 Layers) -----------------
export interface TripBudgetItem {
  id: string;
  plan_id: string;
  name: string;
  category: string;
  amount: number;
  calculation_basis: "FIXED" | "PER_PERSON" | "QTY_UNIT";
  unit_price?: number | null;
  quantity?: number | null;
  split_scope: "EVERYONE" | "SELECTED" | "SPLIT_POD" | "PERSONAL";
  split_pod_id?: string | null;
  split_method: "EQUAL" | "EXACT" | "PERCENTAGE" | "SHARES" | "ITEMIZED";
  participants_json?: string | null;
  notes?: string | null;
  estimated_per_person: number;
  participant_count: number;
  created_at: string;
}

export interface TripBudgetPlan {
  id: string;
  trip_id?: string | null;
  circle_id?: string | null;
  user_id: string;
  name: string;
  target_budget: number;
  total_planned_amount: number;
  items: TripBudgetItem[];
  created_at: string;
}

export interface ExpenseShareDetail {
  id?: string;
  user_id: string;
  user_name: string;
  owed_amount: number;
  paid_amount?: number;
  settled?: boolean;
}

export interface ExpenseAuditLog {
  id: string;
  expense_id: string;
  action: "CREATED" | "UPDATED" | "DELETED";
  actor_user_id?: string | null;
  actor_name?: string | null;
  previous_snapshot_json?: string | null;
  new_snapshot_json?: string | null;
  reason?: string | null;
  created_at: string;
}

export interface CollaborativeExpense {
  id: string;
  trip_id?: string | null;
  circle_id?: string | null;
  split_pod_id?: string | null;
  user_id: string;
  payer_name: string;
  created_by_user_id?: string | null;
  created_by_name?: string | null;
  last_edited_by_user_id?: string | null;
  last_edited_by_name?: string | null;
  title: string;
  category: string;
  amount: number;
  payment_method: string;
  date: string;
  notes?: string | null;
  split_method: string;
  receipt_url?: string | null;
  receipt_data_json?: string | null;
  payers_json?: string | null;
  version: number;
  is_deleted: boolean;
  shares: ExpenseShareDetail[];
  created_at: string;
  audit_logs?: ExpenseAuditLog[];
}

export interface SettlementRecord {
  id: string;
  trip_id?: string | null;
  circle_id?: string | null;
  split_pod_id?: string | null;
  payer_user_id: string;
  payer_name: string;
  receiver_user_id: string;
  receiver_name: string;
  amount: number;
  payment_method: string;
  notes?: string | null;
  settled_at: string;
  created_at: string;
}

export interface DebtorCreditorSummary {
  debtor_user_id: string;
  debtor_name: string;
  creditor_user_id: string;
  creditor_name: string;
  amount: number;
}

export interface MemberBalanceSummary {
  user_id: string;
  user_name: string;
  total_paid: number;
  total_share: number;
  settled_paid: number;
  settled_received: number;
  net_balance: number;
  status: "settled" | "owes" | "owed";
}

export interface ContextBalances {
  total_shared_expenses: number;
  total_settled: number;
  members: MemberBalanceSummary[];
  simplified_debts: DebtorCreditorSummary[];
}

