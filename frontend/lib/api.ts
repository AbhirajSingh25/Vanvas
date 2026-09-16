import {
  Trip, TripSummary, Destination, Place, Hotel, RentalOption,
  BudgetSummary, Expense, GroupSummary, ChecklistItem,
  ImHereResponse, ArrivalOptimizerResponse, CopilotResponse,
  AdminStats, User, UserPreferences, TripInvitePreview, TripMemberItem
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Helper for authenticated requests
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("vanvas_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

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

  async getQuickPlan(tripId: string, hours: number, lat?: number, lng?: number): Promise<{
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

  async getSavedPlaces(): Promise<Place[]> {
    return fetchApi("/places/saved");
  },

  async toggleSavePlace(placeId: string): Promise<{ saved: boolean; message: string }> {
    return fetchApi(`/places/saved/${placeId}`, {
      method: "POST",
    });
  },

  // Transport & Arrival Optimizer
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
  async askCopilot(tripId: string, message: string, locName?: string): Promise<CopilotResponse> {
    return fetchApi(`/trips/${tripId}/assistant`, {
      method: "POST",
      body: JSON.stringify({
        message,
        current_location_name: locName,
      }),
    });
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
  }
};
