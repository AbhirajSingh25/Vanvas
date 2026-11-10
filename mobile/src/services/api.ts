import {
  Destination,
  Trip,
  TripSummary,
  Place,
  Hotel,
  RentalOption,
  BudgetSummary,
  Expense,
  ImHereResponse,
  CopilotChatResponse,
  User,
  RoadTripPlanRequest,
  RoadTripPlanResponse,
  RoadTripCorridor,
} from "@vanvas/shared";
import { secureStorage } from "./storage";
import { offlineDb } from "./db";

const PRODUCTION_API_URL = "https://vanvas-api.onrender.com/api/v1";

export function resolveAvatarUrl(avatarUrl?: string | null): string | undefined {
  if (!avatarUrl) return undefined;
  const trimmed = avatarUrl.trim();
  if (!trimmed) return undefined;

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  if (trimmed.startsWith("users/") || trimmed.startsWith("/users/")) {
    const cleanKey = trimmed.replace(/^\/+/, "");
    return `${PRODUCTION_API_URL}/auth/profile/avatar/file/${cleanKey}`;
  }

  if (trimmed.replace(/^\/+/, "").startsWith("auth/")) {
    const clean = trimmed.replace(/^\/+/, "");
    return `${PRODUCTION_API_URL}/${clean}`;
  }

  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${PRODUCTION_API_URL}${cleanPath}`;
}

export function resolveImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  // Prepend Vercel web domain for static assets
  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `https://vanvasai.vercel.app${cleanPath}`;
}

export interface ApiStatusListener {
  (isWakingUp: boolean, isOffline: boolean): void;
}

let statusListener: ApiStatusListener | null = null;
export function setApiStatusListener(listener: ApiStatusListener | null) {
  statusListener = listener;
}

async function fetchWithRetry<T>(
  endpoint: string,
  options: RequestInit = {},
  isSafeGet = true,
  maxRetries = 2
): Promise<T> {
  const token = await secureStorage.getToken();
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let attempt = 0;
  const allowedRetries = isSafeGet ? maxRetries : 0;

  while (attempt <= allowedRetries) {
    attempt++;
    const controller = new AbortController();
    // Render free-tier cold start can take up to 35 seconds
    const timeoutId = setTimeout(() => controller.abort(), 35000);

    try {
      const url = `${PRODUCTION_API_URL}${endpoint}`;
      const res = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (statusListener) statusListener(false, false);

      if (!res.ok) {
        let errorDetail = "API Error";
        try {
          const errJson = await res.json();
          errorDetail = errJson.detail || JSON.stringify(errJson);
        } catch {
          errorDetail = `${res.status} ${res.statusText}`;
        }
        const err: any = new Error(errorDetail);
        err.status = res.status;
        err.endpoint = endpoint;
        throw err;
      }

      return await res.json();
    } catch (err: any) {
      clearTimeout(timeoutId);

      const isTimeout = err.name === "AbortError" || err.status === 504;
      const isNetwork = err.message === "Failed to fetch" || err.status === 0 || !err.status;

      if ((isTimeout || isNetwork) && statusListener) {
        statusListener(isTimeout, isNetwork);
      }

      if (attempt <= allowedRetries && (isTimeout || isNetwork)) {
        // Exponential backoff with small jitter: 2s, 4s
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      throw err;
    }
  }

  throw new Error("Request failed after retries");
}

export const nativeApi = {
  // --- Auth & Profile ---
  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    const res = await fetchWithRetry<{ access_token: string; user: User }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
      false
    );
    if (res.access_token) {
      await secureStorage.setToken(res.access_token);
      await secureStorage.setUserData(res.user);
    }
    return res;
  },

  async register(email: string, password: string, fullName: string): Promise<{ message: string; email: string }> {
    return fetchWithRetry(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({ email, password, full_name: fullName }),
      },
      false
    );
  },

  async verifyEmail(email: string, otp: string): Promise<{ message: string; access_token?: string; user?: User }> {
    const res = await fetchWithRetry<{ message: string; access_token?: string; user?: User }>(
      "/auth/verify-email/confirm",
      {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      },
      false
    );
    if (res.access_token && res.user) {
      await secureStorage.setToken(res.access_token);
      await secureStorage.setUserData(res.user);
    }
    return res;
  },

  async resendVerification(email: string): Promise<{ message: string }> {
    return fetchWithRetry(
      "/auth/verify-email/request",
      {
        method: "POST",
        body: JSON.stringify({ email }),
      },
      false
    );
  },

  async getMe(): Promise<User> {
    const user = await fetchWithRetry<User>("/auth/me", {}, true);
    await secureStorage.setUserData(user);
    return user;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const updated = await fetchWithRetry<User>(
      "/auth/profile",
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      false
    );
    await secureStorage.setUserData(updated);
    return updated;
  },

  async uploadAvatar(fileUri: string): Promise<{ avatar_url: string; message: string }> {
    const token = await secureStorage.getToken();
    const formData = new FormData();

    const filename = fileUri.split("/").pop() || "avatar.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1].toLowerCase()}` : "image/jpeg";

    formData.append("file", {
      uri: fileUri,
      name: filename,
      type,
    } as any);

    const res = await fetch(`${PRODUCTION_API_URL}/auth/profile/avatar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Avatar upload failed" }));
      throw new Error(err.detail || "Avatar upload failed");
    }

    const json = await res.json();
    // Refresh user profile after upload
    await this.getMe();
    return json;
  },

  async logout(): Promise<void> {
    try {
      await fetchWithRetry("/auth/logout", { method: "POST" }, false);
    } catch {
      // ignore network errors on sign out
    }
    const current = await secureStorage.getUserData<User>();
    await secureStorage.clearSession();
    if (current?.id) {
      await offlineDb.clearUserSessionCache(current.id);
    }
  },

  async changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<{ message: string }> {
    return fetchWithRetry<{ message: string }>(
      "/auth/change-password",
      {
        method: "POST",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      },
      false
    );
  },

  async deleteAccount(password: string): Promise<{ message: string; user_id: string; status: string }> {
    return fetchWithRetry<{ message: string; user_id: string; status: string }>(
      "/auth/account",
      {
        method: "DELETE",
        body: JSON.stringify({ password }),
      },
      false
    );
  },

  // --- Destinations & Offline Cache ---
  async getDestinations(featuredOnly = false, search = ""): Promise<{ destinations: Destination[]; isCached: boolean }> {
    try {
      const qs = new URLSearchParams();
      if (featuredOnly) qs.append("featured_only", "true");
      if (search) qs.append("search", search);
      const query = qs.toString() ? `?${qs.toString()}` : "";

      const live = await fetchWithRetry<Destination[]>(`/destinations${query}`, {}, true, 1);
      if (live && live.length > 0) {
        await offlineDb.cacheDestinations(live);
        return { destinations: live, isCached: false };
      }
    } catch {
      // Fall through to offline cache
    }

    const cached = await offlineDb.getCachedDestinations();
    return { destinations: cached, isCached: true };
  },

  async searchDestinations(query: string, limit = 8): Promise<any[]> {
    const clean = query.trim().toLowerCase();
    if (!clean) return [];
    try {
      return await fetchWithRetry<any[]>(`/destinations/search?q=${encodeURIComponent(clean)}&limit=${limit}`, {}, true, 1);
    } catch {
      const cached = await offlineDb.getCachedDestinations();
      return cached.filter(
        (d) =>
          d.name.toLowerCase().includes(clean) ||
          d.state.toLowerCase().includes(clean) ||
          d.slug.toLowerCase().includes(clean)
      );
    }
  },

  async getDestinationDetail(slugOrId: string): Promise<{ data: any; isCached: boolean }> {
    try {
      const live = await fetchWithRetry<any>(`/destinations/${slugOrId}`, {}, true, 1);
      if (live) {
        await offlineDb.cacheDestinationDetail(slugOrId, live);
        return { data: live, isCached: false };
      }
    } catch {
      // Fall through to offline cache
    }

    const cached = await offlineDb.getCachedDestinationDetail(slugOrId);
    if (cached) {
      return { data: cached, isCached: true };
    }
    throw new Error(`Unable to load destination details for "${slugOrId}". Connect to the internet to load.`);
  },

  async getDestinationPlaces(destId: string, category?: string): Promise<Place[]> {
    const params = new URLSearchParams();
    if (category && category !== "all") params.append("category", category);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return fetchWithRetry<Place[]>(`/destinations/${destId}/places${qs}`, {}, true, 1);
  },

  async getHotels(destId: string): Promise<Hotel[]> {
    return fetchWithRetry<Hotel[]>(`/hotels?destination_id=${encodeURIComponent(destId)}`, {}, true, 1);
  },

  async getRentals(destId: string): Promise<RentalOption[]> {
    return fetchWithRetry<RentalOption[]>(`/rentals?destination_id=${encodeURIComponent(destId)}`, {}, true, 1);
  },

  // --- Trips ---
  async getTrips(): Promise<{ trips: TripSummary[]; isCached: boolean }> {
    const user = await secureStorage.getUserData<User>();
    if (!user?.id) {
      return { trips: [], isCached: false };
    }
    const userId = user.id;

    try {
      const live = await fetchWithRetry<TripSummary[]>("/trips", {}, true, 1);
      if (live) {
        await offlineDb.cacheUserTrips(userId, live);
        return { trips: live, isCached: false };
      }
    } catch {
      // Fallback
    }

    const cached = await offlineDb.getCachedUserTrips(userId);
    return { trips: cached, isCached: true };
  },

  async getTrip(tripId: string): Promise<{ trip: Trip; isCached: boolean }> {
    const user = await secureStorage.getUserData<User>();
    if (!user?.id) {
      const live = await fetchWithRetry<Trip>(`/trips/${tripId}`, {}, true, 1);
      return { trip: live, isCached: false };
    }
    const userId = user.id;

    try {
      const live = await fetchWithRetry<Trip>(`/trips/${tripId}`, {}, true, 1);
      if (live) {
        await offlineDb.cacheTripDetail(userId, live);
        return { trip: live, isCached: false };
      }
    } catch {
      // Fallback
    }

    const cached = await offlineDb.getCachedTripDetail(userId, tripId);
    if (cached) {
      return { trip: cached, isCached: true };
    }
    throw new Error("Unable to load trip details. Connect to the internet to sync.");
  },

  async createTrip(data: {
    destination_id: string;
    start_date: string;
    end_date: string;
    origin_city: string;
    transport_mode: string;
    budget: number;
    travellers_count: number;
    companion_type: string;
    travel_style: string;
    wake_up_preference: string;
    activity_intensity: string;
    interests: string[];
    transport_details?: Record<string, any>;
  }): Promise<Trip> {
    const created = await fetchWithRetry<Trip>(
      "/trips",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      false
    );
    const user = await secureStorage.getUserData<User>();
    if (user?.id) {
      await offlineDb.cacheTripDetail(user.id, created);
    }
    return created;
  },

  async updateItineraryItem(tripId: string, itemId: string, status: "pending" | "completed" | "skipped"): Promise<any> {
    return fetchWithRetry(
      `/trips/${tripId}/items/${itemId}?status=${status}`,
      { method: "PUT" },
      false
    );
  },

  async replanTrip(tripId: string, actionType: string, dayNumber = 1): Promise<{ success: boolean; message: string; trip: Trip }> {
    return fetchWithRetry(
      `/trips/${tripId}/replan`,
      {
        method: "POST",
        body: JSON.stringify({ action_type: actionType, day_number: dayNumber }),
      },
      false
    );
  },

  // --- I'M HERE Arrival Mode ---
  async getImHereContext(
    tripId: string,
    lat?: number,
    lng?: number,
    locName?: string
  ): Promise<ImHereResponse> {
    return fetchWithRetry(
      `/trips/${tripId}/im-here`,
      {
        method: "POST",
        body: JSON.stringify({
          current_lat: lat,
          current_lng: lng,
          current_location_name: locName,
        }),
      },
      false
    );
  },

  // --- Ask VANVAS / Copilot ---
  async copilotChat(params: {
    message: string;
    conversation_id?: string;
    trip_id?: string;
    destination_slug?: string;
  }): Promise<CopilotChatResponse> {
    return fetchWithRetry(
      "/copilot/chat",
      {
        method: "POST",
        body: JSON.stringify(params),
      },
      false
    );
  },

  // --- Road Trip ---
  async getRoadTripCorridors(): Promise<RoadTripCorridor[]> {
    return fetchWithRetry<RoadTripCorridor[]>("/road-trip/corridors", {}, true, 2);
  },

  async planRoadTrip(data: RoadTripPlanRequest): Promise<RoadTripPlanResponse> {
    return fetchWithRetry(
      "/road-trip/plan",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      false
    );
  },

  async saveRoadTrip(data: RoadTripPlanRequest): Promise<Trip> {
    return fetchWithRetry(
      "/road-trip/save",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      false
    );
  },

  // --- Budget & Expenses ---
  async getBudget(tripId: string): Promise<BudgetSummary> {
    return fetchWithRetry<BudgetSummary>(`/trips/${tripId}/budget`, {}, true, 2);
  },

  async getExpenses(tripId: string): Promise<Expense[]> {
    const user = await secureStorage.getUserData<User>();
    if (!user?.id) {
      return [];
    }
    const userId = user.id;
    try {
      const live = await fetchWithRetry<Expense[]>(`/trips/${tripId}/expenses`, {}, true, 1);
      if (live) {
        await offlineDb.cacheTripExpenses(userId, tripId, live);
        return live;
      }
    } catch {
      // Fall through to offline cache
    }
    return offlineDb.getCachedTripExpenses(userId, tripId);
  },

  async addExpense(tripId: string, expense: {
    title: string;
    amount: number;
    category: string;
    date: string;
    notes?: string;
  }): Promise<Expense> {
    const user = await secureStorage.getUserData<User>();
    if (!user?.id) {
      throw new Error("Authentication required to add expenses.");
    }
    const userId = user.id;

    try {
      const created = await fetchWithRetry<Expense>(
        `/trips/${tripId}/expenses`,
        {
          method: "POST",
          body: JSON.stringify(expense),
        },
        false
      );
      await offlineDb.saveOfflineExpense(userId, tripId, created, false);
      return created;
    } catch {
      // When offline in high-altitude zones with no reception, generate local offline expense
      const offlineId = `offline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const offlineExpense: Expense = {
        id: offlineId,
        trip_id: tripId,
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        date: expense.date,
        notes: expense.notes,
      };
      await offlineDb.saveOfflineExpense(userId, tripId, offlineExpense, true);
      await offlineDb.queueOfflineMutation(userId, "add_expense", {
        tripId,
        offlineId,
        expense: {
          ...expense,
          receipt_data_json: JSON.stringify({ offline_client_id: offlineId }),
        },
      });
      return offlineExpense;
    }
  },

  async deleteExpense(tripId: string, expenseId: string): Promise<void> {
    const user = await secureStorage.getUserData<User>();
    if (!user?.id) {
      throw new Error("Authentication required to delete expenses.");
    }
    const userId = user.id;

    try {
      if (!expenseId.startsWith("offline_")) {
        await fetchWithRetry(
          `/trips/${tripId}/expenses/${expenseId}`,
          { method: "DELETE" },
          false
        );
      }
    } catch {
      await offlineDb.queueOfflineMutation(userId, "delete_expense", { tripId, expenseId });
    }
    await offlineDb.deleteOfflineExpense(userId, tripId, expenseId);
  },

  async syncPendingOfflineActions(): Promise<number> {
    const currentUser = await secureStorage.getUserData<User>();
    const currentToken = await secureStorage.getToken();
    if (!currentUser?.id || !currentToken) {
      // Never replay offline mutations without an authenticated user session
      return 0;
    }

    const pending = await offlineDb.getPendingMutations(currentUser.id);
    if (pending.length === 0) return 0;
    let syncedCount = 0;

    for (const item of pending) {
      // Re-verify session before executing each action
      const activeUser = await secureStorage.getUserData<User>();
      const activeToken = await secureStorage.getToken();
      if (!activeUser?.id || activeUser.id !== currentUser.id || !activeToken) {
        // Session changed or logged out during replay, stop immediately
        break;
      }

      // Safety guard: reject mutations not matching the current authenticated user
      if (item.user_id && item.user_id !== currentUser.id) {
        continue;
      }
      try {
        const payload = JSON.parse(item.payload_json);
        if (item.action_type === "add_expense") {
          // Check for existing server expense matching offline_client_id to prevent duplicates on interrupted sync
          let serverExpense: Expense | null = null;
          const offlineId = payload.offlineId;
          try {
            const existingExpenses = await fetchWithRetry<Expense[]>(
              `/trips/${payload.tripId}/expenses`,
              {},
              true,
              1
            );
            if (Array.isArray(existingExpenses)) {
              serverExpense = existingExpenses.find((e: any) => {
                if (offlineId && e.receipt_data_json) {
                  try {
                    const parsed = JSON.parse(e.receipt_data_json);
                    if (parsed.offline_client_id === offlineId) return true;
                  } catch {}
                }
                return (
                  e.title === payload.expense.title &&
                  Number(e.amount) === Number(payload.expense.amount) &&
                  e.date === payload.expense.date
                );
              }) || null;
            }
          } catch {
            // If checking fails, proceed to POST
          }

          if (!serverExpense) {
            serverExpense = await fetchWithRetry<Expense>(
              `/trips/${payload.tripId}/expenses`,
              {
                method: "POST",
                body: JSON.stringify(payload.expense),
              },
              false
            );
          }

          if (serverExpense) {
            if (offlineId) {
              await offlineDb.deleteOfflineExpense(currentUser.id, payload.tripId, offlineId);
            }
            await offlineDb.saveOfflineExpense(currentUser.id, payload.tripId, serverExpense, false);
          }
          syncedCount++;
        } else if (item.action_type === "delete_expense") {
          if (!payload.expenseId.startsWith("offline_")) {
            await fetchWithRetry(
              `/trips/${payload.tripId}/expenses/${payload.expenseId}`,
              { method: "DELETE" },
              false
            );
          }
          syncedCount++;
        }
        await offlineDb.removeMutation(item.id);
      } catch {
        // Stop on first failure to preserve order and retry later
        break;
      }
    }
    return syncedCount;
  },
};
