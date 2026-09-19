import {
  Trip, TripSummary, Destination, Place, Hotel, RentalOption, TransportOption,
  BudgetSummary, Expense, GroupSummary, ChecklistItem,
  ImHereResponse, ArrivalOptimizerResponse, CopilotResponse, CopilotChatResponse,
  AdminStats, User, UserPreferences, TripInvitePreview, TripMemberItem,
  Review, ReviewAggregate, ReviewCreateInput, ReviewReportInput,
  Booking, Offer, BookingIntentInput
} from "@/types";

function getApiBaseUrl(): string {
  let base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").trim().replace(/\/+$/, "");
  if (!base.endsWith("/api/v1")) {
    base = `${base}/api/v1`;
  }
  return base;
}

const API_BASE_URL = getApiBaseUrl();

// Helper for authenticated requests with timeout
async function fetchApi<T>(endpoint: string, options: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("vanvas_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const timeoutMs = options.timeoutMs ?? 25000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorDetail = "API Error";
      try {
        const errJson = await res.json();
        errorDetail = errJson.detail || JSON.stringify(errJson);
      } catch {
        errorDetail = `${res.status} ${res.statusText}`;
      }
      throw new Error(errorDetail);
    }

    return res.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Request timed out while connecting to VANVAS servers. Please check your network or try again.");
    }
    throw err;
  }
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    return fetchApi("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async register(email: string, password: string, full_name: string): Promise<{ access_token: string; user: User }> {
    return fetchApi("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name }),
    });
  },

  async getMe(): Promise<User> {
    return fetchApi("/auth/me");
  },

  async updateProfile(data: {
    full_name?: string;
    avatar_url?: string;
    preferred_travel_style?: string;
    wake_up_preference?: string;
    activity_intensity?: string;
    dietary_preference?: string;
    interests?: string;
    accommodation_preference?: string;
    transport_preference?: string;
    companion_style?: string;
  }): Promise<User> {
    return fetchApi("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    return fetchApi("/auth/preferences", {
      method: "PUT",
      body: JSON.stringify(preferences),
    });
  },

  // Destinations
  async searchDestinations(query: string, limit = 6): Promise<any[]> {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    return fetchApi(`/destinations/search?${params.toString()}`);
  },

  async resolveDestination(query: string): Promise<any> {
    const params = new URLSearchParams({ query });
    return fetchApi(`/destinations/resolve?${params.toString()}`, { method: "POST" });
  },

  async getDestinations(featuredOnly = false, search = ""): Promise<Destination[]> {
    const params = new URLSearchParams();
    if (featuredOnly) params.append("featured_only", "true");
    if (search) params.append("search", search);
    return fetchApi(`/destinations?${params.toString()}`);
  },

  async getDestinationDetail(slugOrId: string): Promise<{
    destination: Destination;
    places: Place[];
    hotels: Hotel[];
    rentals: RentalOption[];
    weather: any[];
    places_count: number;
  }> {
    return fetchApi(`/destinations/${slugOrId}`);
  },

  async getDestinationPlaces(destId: string, category?: string, search?: string): Promise<Place[]> {
    const params = new URLSearchParams();
    if (category && category !== "all") params.append("category", category);
    if (search) params.append("search", search);
    return fetchApi(`/destinations/${destId}/places?${params.toString()}`);
  },

  // Trips
  async getTrips(): Promise<TripSummary[]> {
    return fetchApi("/trips");
  },

  async getTrip(tripId: string): Promise<Trip> {
    return fetchApi(`/trips/${tripId}`);
  },

  async createTrip(data: {
    destination_id: string;
    start_date: string;
    end_date: string;
    budget: number;
    travellers_count: number;
    companion_type: string;
    travel_style: string;
    wake_up_preference: string;
    activity_intensity: string;
    interests: string[];
    origin_city?: string;
  }): Promise<Trip> {
    return fetchApi("/trips", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async replanTrip(tripId: string, actionType: string, dayNumber = 1, current_time?: string, target_item_id?: string): Promise<{ success: boolean; message: string; trip: Trip }> {
    return fetchApi(`/trips/${tripId}/replan`, {
      method: "POST",
      body: JSON.stringify({
        action_type: actionType,
        day_number: dayNumber,
        current_time,
        target_item_id,
      }),
    });
  },

  async getImHereContext(tripId: string, lat?: number, lng?: number, locationName?: string): Promise<ImHereResponse> {
    return fetchApi(`/trips/${tripId}/im-here`, {
      method: "POST",
      body: JSON.stringify({
        current_lat: lat,
        current_lng: lng,
        current_location_name: locationName,
      }),
    });
  },

  async getQuickPlan(tripId: string, hours: number, lat?: number, lng?: number, variation?: number): Promise<{
    headline: string;
    summary: string;
    duration_hours: number;
    items: any[];
  }> {
    return fetchApi(`/trips/${tripId}/quick-plan`, {
      method: "POST",
      body: JSON.stringify({
        hours_available: hours,
        current_lat: lat,
        current_lng: lng,
        variation: variation ?? 0,
      }),
    });
  },

  async updateItineraryItem(tripId: string, itemId: string, status?: string, isLocked?: boolean): Promise<any> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (isLocked !== undefined) params.append("is_locked", String(isLocked));
    return fetchApi(`/trips/${tripId}/items/${itemId}?${params.toString()}`, {
      method: "PUT",
    });
  },

  // Budget & Expenses
  async getBudget(tripId: string): Promise<BudgetSummary> {
    return fetchApi(`/trips/${tripId}/budget`);
  },

  async addExpense(tripId: string, expense: {
    title: string;
    category: string;
    amount: number;
    payment_method: string;
    notes?: string;
    date?: string;
  }): Promise<Expense> {
    return fetchApi(`/trips/${tripId}/expenses`, {
      method: "POST",
      body: JSON.stringify(expense),
    });
  },

  async deleteExpense(tripId: string, expenseId: string): Promise<{ success: boolean }> {
    return fetchApi(`/trips/${tripId}/expenses/${expenseId}`, {
      method: "DELETE",
    });
  },

  // Group & Voting & Collaboration
  async getGroupDetails(tripId: string): Promise<GroupSummary> {
    return fetchApi(`/trips/${tripId}/members`);
  },

  async submitVote(tripId: string, placeId: string, voteType: "NO" | "LIKE" | "LOVE"): Promise<{ success: boolean; message: string }> {
    return fetchApi(`/trips/${tripId}/vote`, {
      method: "POST",
      body: JSON.stringify({
        place_id: placeId,
        vote_type: voteType,
      }),
    });
  },

  // Collaboration & Invites
  async getInvitePreview(code: string): Promise<TripInvitePreview> {
    return fetchApi(`/trips/invite/${code}`);
  },

  async generateTripInvite(tripId: string): Promise<{ code: string; invite_url: string; expires_at?: string }> {
    return fetchApi(`/trips/${tripId}/invites`, {
      method: "POST",
    });
  },

  async joinTripByCode(code: string): Promise<{ success: boolean; message: string; trip_id: string; already_joined?: boolean }> {
    return fetchApi(`/trips/join/${code}`, {
      method: "POST",
    });
  },

  async removeTripMember(tripId: string, userId: string): Promise<{ success: boolean; message: string }> {
    return fetchApi(`/trips/${tripId}/members/${userId}`, {
      method: "DELETE",
    });
  },

  async leaveTrip(tripId: string): Promise<{ success: boolean; message: string }> {
    return fetchApi(`/trips/${tripId}/leave`, {
      method: "POST",
    });
  },

  // Places & Nearby
  async getNearbyPlaces(lat: number, lng: number, radiusKm = 15, category?: string, sortBy = "recommended"): Promise<Place[]> {
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      radius_km: String(radiusKm),
      sort_by: sortBy,
    });
    if (category && category !== "all") params.append("category", category);
    return fetchApi(`/places/nearby?${params.toString()}`);
  },

  async getPlaceDetail(placeId: string): Promise<Place> {
    return fetchApi(`/places/${placeId}`);
  },

  async getSavedPlaces(): Promise<Place[]> {
    return fetchApi("/places/saved");
  },

  async toggleSavePlace(placeId: string): Promise<{ saved: boolean; message: string }> {
    return fetchApi(`/places/saved/${placeId}`, {
      method: "POST",
    });
  },

  // Transport, Hotels & Rentals
  async getHotels(destId: string, style?: string, maxPrice?: number): Promise<Hotel[]> {
    const params = new URLSearchParams({ destination_id: destId });
    if (style && style !== "All") params.append("style", style);
    if (maxPrice) params.append("max_price", String(maxPrice));
    return fetchApi(`/hotels?${params.toString()}`);
  },

  async getRentals(destId: string, vehicleType?: string): Promise<RentalOption[]> {
    const params = new URLSearchParams({ destination_id: destId });
    if (vehicleType && vehicleType !== "All") params.append("vehicle_type", vehicleType);
    return fetchApi(`/rentals?${params.toString()}`);
  },

  async getTransport(destId: string, originCity = "Delhi", transportType?: string): Promise<TransportOption[]> {
    const params = new URLSearchParams({ destination_id: destId, origin_city: originCity });
    if (transportType && transportType !== "All") params.append("transport_type", transportType);
    return fetchApi(`/transport?${params.toString()}`);
  },

  async optimizeArrival(destId: string, originCity: string, dateStr: string, preferredMode = "All"): Promise<ArrivalOptimizerResponse> {
    return fetchApi("/arrival-optimizer", {
      method: "POST",
      body: JSON.stringify({
        destination_id: destId,
        origin_city: originCity,
        target_date: dateStr,
        preferred_mode: preferredMode,
      }),
    });
  },

  // AI Copilot
  async copilotChat(params: {
    message: string;
    conversation_id?: string;
    trip_id?: string;
    destination_slug?: string;
    action_type?: string;
    current_time?: string;
  }): Promise<CopilotChatResponse> {
    return fetchApi("/copilot/chat", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  async askCopilot(tripId: string, message: string, locName?: string, conversationId?: string): Promise<CopilotChatResponse & CopilotResponse> {
    const res = await fetchApi<CopilotChatResponse>("/copilot/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        trip_id: tripId,
        current_location_name: locName,
      }),
    });
    // Ensure compatibility with older callers expecting reply and relevant_places
    return {
      ...res,
      reply: res.message,
      suggested_actions: res.actions?.map((a) => ({ label: a.title, action: a.action_type })) || [],
      relevant_places: res.places || [],
    };
  },

  // Checklist
  async getChecklist(tripId: string): Promise<ChecklistItem[]> {
    return fetchApi(`/trips/${tripId}/checklist`);
  },

  async addChecklistItem(tripId: string, category: string, itemName: string): Promise<ChecklistItem> {
    return fetchApi(`/trips/${tripId}/checklist`, {
      method: "POST",
      body: JSON.stringify({ category, item_name: itemName }),
    });
  },

  async toggleChecklistItem(tripId: string, itemId: string, isChecked: boolean): Promise<ChecklistItem> {
    return fetchApi(`/trips/${tripId}/checklist/${itemId}`, {
      method: "PUT",
      body: JSON.stringify({ is_checked: isChecked }),
    });
  },

  // Admin & System Diagnostics
  async getAdminStats(): Promise<AdminStats> {
    return fetchApi("/admin/stats");
  },

  async getSystemHealth(): Promise<{ status: string; providers: any[] }> {
    return fetchApi("/admin/health");
  },

  // Live Travel Search & Intent Routing
  async searchIntent(query: string) {
    const params = new URLSearchParams({ q: query });
    return fetchApi(`/search/intent?${params.toString()}`);
  },

  async searchWeb(query: string, dest?: string) {
    const params = new URLSearchParams({ q: query });
    if (dest) params.append("destination", dest);
    return fetchApi(`/search/web?${params.toString()}`);
  },

  async unifiedSearch(query: string, lat?: number, lng?: number) {
    const params = new URLSearchParams({ q: query });
    if (lat !== undefined) params.append("lat", String(lat));
    if (lng !== undefined) params.append("lng", String(lng));
    return fetchApi(`/search/unified?${params.toString()}`);
  },

  // Authentic VANVAS Community Reviews & Moderation
  async getPlaceReviews(placeId: string): Promise<Review[]> {
    try {
      const res = await fetchApi<ReviewAggregate>(`/places/${encodeURIComponent(placeId)}/reviews`);
      return res.reviews || [];
    } catch {
      return [];
    }
  },

  async getPlaceReviewAggregate(placeId: string): Promise<ReviewAggregate> {
    return fetchApi(`/places/${encodeURIComponent(placeId)}/reviews`);
  },

  async createReview(data: ReviewCreateInput): Promise<Review> {
    const placeId = data.place_id;
    return fetchApi(`/places/${encodeURIComponent(placeId)}/reviews`, {
      method: "POST",
      body: JSON.stringify({
        rating: data.rating,
        title: data.title,
        body: data.body || data.comment,
        place_id: data.place_id,
        travel_date: data.travel_date,
      }),
    });
  },

  async updateReview(reviewId: string, data: Partial<ReviewCreateInput>): Promise<Review> {
    return fetchApi(`/reviews/${encodeURIComponent(reviewId)}`, {
      method: "PUT",
      body: JSON.stringify({
        rating: data.rating,
        title: data.title,
        body: data.body || data.comment,
      }),
    });
  },

  async deleteReview(reviewId: string): Promise<{ message: string; id: string }> {
    return fetchApi(`/reviews/${encodeURIComponent(reviewId)}`, {
      method: "DELETE",
    });
  },

  async reportReview(data: ReviewReportInput): Promise<{ id: string; review_id: string; reason: string; status: string; created_at: string }> {
    return fetchApi(`/reviews/${encodeURIComponent(data.review_id)}/report`, {
      method: "POST",
      body: JSON.stringify({
        reason: data.reason,
        details: data.details,
      }),
    });
  },

  async getReportedReviews(): Promise<Review[]> {
    return fetchApi("/admin/reviews/reported");
  },

  async moderateReview(reviewId: string, data: { status: "published" | "hidden" | "removed"; moderation_note?: string }): Promise<Review> {
    return fetchApi(`/admin/reviews/${encodeURIComponent(reviewId)}/moderate`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // ---------------------------------------------------------------------------
  // TRAVEL COMMERCE FOUNDATION
  // ---------------------------------------------------------------------------

  async getBookings(tripId?: string): Promise<Booking[]> {
    const query = tripId ? `?trip_id=${encodeURIComponent(tripId)}` : "";
    return fetchApi(`/bookings${query}`);
  },

  async getBooking(bookingId: string): Promise<Booking> {
    return fetchApi(`/bookings/${encodeURIComponent(bookingId)}`);
  },

  async createBookingIntent(data: BookingIntentInput): Promise<Booking> {
    return fetchApi("/bookings/intent", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async transitionBooking(
    bookingId: string,
    targetStatus: string,
    reason?: string,
    metadata?: Record<string, any>
  ): Promise<Booking> {
    return fetchApi(`/bookings/${encodeURIComponent(bookingId)}/transition`, {
      method: "POST",
      body: JSON.stringify({
        target_status: targetStatus,
        reason,
        metadata,
      }),
    });
  },

  async getOffers(destination: string, productType?: string): Promise<Offer[]> {
    const params = new URLSearchParams({ destination });
    if (productType) params.set("product_type", productType);
    const res = await fetchApi<any>(`/offers?${params.toString()}`);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.offers)) return res.offers;
    return [];
  },

  async checkOfferAvailability(offerId: string): Promise<{ offer_id: string; provider?: string; availability_state: string; is_available?: boolean; valid_until?: string | null; message: string; price?: number | null; currency?: string; cancellation_policy?: string | null }> {
    return fetchApi(`/offers/${encodeURIComponent(offerId)}/availability`);
  }
};
