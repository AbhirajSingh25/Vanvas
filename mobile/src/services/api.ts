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
  FriendRequest,
  Friendship,
  FriendLookupResult,
  CrewCircle,
  CrewCircleDetail,
  CrewCircleMember,
  CrewCircleSuggestion,
  CrewCircleActivity,
  SplitPod,
  TripBudgetPlan,
  TripBudgetItem,
  CollaborativeExpense,
  ContextBalances,
  SettlementRecord,
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

let customFetch: typeof fetch | null = null;
export function _setFetchForTesting(fn: typeof fetch | null) {
  customFetch = fn;
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
      const fetchFn = customFetch || fetch;
      const res = await fetchFn(url, {
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
    if (!user?.id || !user.id.trim()) {
      throw new Error("Authentication required to add expenses.");
    }
    const userId = user.id;

    let created: Expense | null = null;
    try {
      created = await fetchWithRetry<Expense>(
        `/trips/${tripId}/expenses`,
        {
          method: "POST",
          body: JSON.stringify(expense),
        },
        false
      );
    } catch {
      // Remote creation genuinely failed or timed out: generate local offline expense & queue mutation
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

    // Remote creation succeeded: cache locally without enqueuing another creation if local write fails
    if (created) {
      try {
        await offlineDb.saveOfflineExpense(userId, tripId, created, false);
      } catch (localErr) {
        console.warn("[api] Failed to cache newly created expense locally:", localErr);
      }
      return created;
    }
    throw new Error("Unexpected error creating expense");
  },

  async deleteExpense(tripId: string, expenseId: string): Promise<void> {
    const user = await secureStorage.getUserData<User>();
    if (!user?.id || !user.id.trim()) {
      throw new Error("Authentication required to delete expenses.");
    }
    const userId = user.id;

    if (expenseId.startsWith("offline_")) {
      // Unsynced offline expense: cancel pending add_expense mutation and remove from local cache.
      // Never enqueue a server delete for an expense that was never created remotely.
      await offlineDb.cancelOfflineExpenseMutation(userId, expenseId);
      await offlineDb.deleteOfflineExpense(userId, tripId, expenseId);
      return;
    }

    // Already synced server expense: attempt DELETE remotely
    try {
      await fetchWithRetry(
        `/trips/${tripId}/expenses/${expenseId}`,
        { method: "DELETE" },
        false
      );
    } catch {
      await offlineDb.queueOfflineMutation(userId, "delete_expense", { tripId, expenseId });
    }
    await offlineDb.deleteOfflineExpense(userId, tripId, expenseId);
  },

  async syncPendingOfflineActions(): Promise<number> {
    const currentUser = await secureStorage.getUserData<User>();
    const currentToken = await secureStorage.getToken();
    if (!currentUser?.id || !currentUser.id.trim() || !currentToken) {
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
      if (!item.user_id || item.user_id !== currentUser.id) {
        continue;
      }

      try {
        const payload = JSON.parse(item.payload_json);
        if (item.action_type === "add_expense") {
          // A successful GET that confirms no matching expense exists may proceed to POST.
          // A successful GET that finds the matching offline client ID must reuse the existing server expense.
          // A failed GET must NOT be treated as proof no expense exists - stop to prevent duplicates!
          let existingExpenses: Expense[];
          try {
            existingExpenses = await fetchWithRetry<Expense[]>(
              `/trips/${payload.tripId}/expenses`,
              {},
              true,
              1
            );
          } catch {
            // Cannot verify server state; preserve mutation in queue and stop sync to avoid duplicates
            break;
          }

          let serverExpense: Expense | null = null;
          const offlineId = payload.offlineId;
          if (Array.isArray(existingExpenses) && offlineId) {
            // Strong identity match: strictly match offline_client_id (never match solely on title/amount/date)
            serverExpense = existingExpenses.find((e: any) => {
              if (e.receipt_data_json) {
                try {
                  const parsed = JSON.parse(e.receipt_data_json);
                  if (parsed.offline_client_id === offlineId) return true;
                } catch {}
              }
              return false;
            }) || null;
          }

          if (!serverExpense) {
            // Safe to POST since GET confirmed no matching offline_client_id exists
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
        await offlineDb.removeMutation(currentUser.id, item.id);
      } catch {
        // Stop on first failure to preserve order and retry later
        break;
      }
    }
    return syncedCount;
  },

  // ----------------- Friends System -----------------
  async lookupFriendByVanvasId(vanvasId: string): Promise<FriendLookupResult> {
    return fetchWithRetry<FriendLookupResult>(`/friends/lookup/${encodeURIComponent(vanvasId.trim().toUpperCase())}`);
  },

  async getFriends(): Promise<Friendship[]> {
    return fetchWithRetry<Friendship[]>("/friends");
  },

  async getFriendRequests(): Promise<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }> {
    return fetchWithRetry<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }>("/friends/requests");
  },

  async sendFriendRequest(addresseeVanvasId: string, note?: string): Promise<FriendRequest> {
    return fetchWithRetry<FriendRequest>(
      "/friends/requests",
      {
        method: "POST",
        body: JSON.stringify({ addressee_vanvas_id: addresseeVanvasId.trim().toUpperCase(), note }),
      },
      false
    );
  },

  async respondFriendRequest(requestId: string, action: "accept" | "decline"): Promise<{ message: string; friendship?: Friendship }> {
    return fetchWithRetry(
      `/friends/requests/${requestId}/respond`,
      {
        method: "POST",
        body: JSON.stringify({ action }),
      },
      false
    );
  },

  async cancelFriendRequest(requestId: string): Promise<{ message: string }> {
    return fetchWithRetry(
      `/friends/requests/${requestId}`,
      { method: "DELETE" },
      false
    );
  },

  async removeFriend(friendshipId: string): Promise<{ message: string }> {
    return fetchWithRetry(
      `/friends/${friendshipId}`,
      { method: "DELETE" },
      false
    );
  },

  async blockUser(targetUserId: string): Promise<{ message: string }> {
    return fetchWithRetry(
      `/friends/block/${targetUserId}`,
      { method: "POST" },
      false
    );
  },

  async unblockUser(targetUserId: string): Promise<{ message: string }> {
    return fetchWithRetry(
      `/friends/block/${targetUserId}`,
      { method: "DELETE" },
      false
    );
  },

  // ----------------- Crew Circles -----------------
  async getCrewCircles(): Promise<CrewCircle[]> {
    return fetchWithRetry<CrewCircle[]>("/crew-circles");
  },

  async getCrewCircleDetail(circleId: string): Promise<CrewCircleDetail> {
    return fetchWithRetry<CrewCircleDetail>(`/crew-circles/${circleId}`);
  },

  async createCrewCircle(data: {
    name: string;
    description?: string;
    destination_hint?: string;
    initial_member_ids?: string[];
  }): Promise<CrewCircle> {
    return fetchWithRetry<CrewCircle>(
      "/crew-circles",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      false
    );
  },

  async addMemberToCrewCircle(circleId: string, vanvasIdOrUserId: string): Promise<CrewCircleMember> {
    return fetchWithRetry<CrewCircleMember>(
      `/crew-circles/${circleId}/members`,
      {
        method: "POST",
        body: JSON.stringify({ vanvas_id_or_user_id: vanvasIdOrUserId }),
      },
      false
    );
  },

  async removeMemberFromCrewCircle(circleId: string, memberId: string): Promise<{ message: string }> {
    return fetchWithRetry(
      `/crew-circles/${circleId}/members/${memberId}`,
      { method: "DELETE" },
      false
    );
  },

  async createCrewCircleSuggestion(circleId: string, data: {
    title: string;
    suggestion_type: string;
    description?: string;
    place_id?: string;
    destination_id?: string;
  }): Promise<CrewCircleSuggestion> {
    return fetchWithRetry<CrewCircleSuggestion>(
      `/crew-circles/${circleId}/suggestions`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      false
    );
  },

  async voteCrewCircleSuggestion(
    circleId: string,
    suggestionId: string,
    voteType: "YES" | "NO" | "HELL_YEAH"
  ): Promise<{ message: string; suggestion: CrewCircleSuggestion }> {
    return fetchWithRetry(
      `/crew-circles/${circleId}/suggestions/${suggestionId}/vote`,
      {
        method: "POST",
        body: JSON.stringify({ vote_type: voteType }),
      },
      false
    );
  },

  async getCrewCircleActivity(circleId: string): Promise<CrewCircleActivity[]> {
    return fetchWithRetry<CrewCircleActivity[]>(`/crew-circles/${circleId}/activity`);
  },

  async postCrewCircleActivity(circleId: string, content: string, activityType = "chat"): Promise<CrewCircleActivity> {
    return fetchWithRetry<CrewCircleActivity>(
      `/crew-circles/${circleId}/activity`,
      {
        method: "POST",
        body: JSON.stringify({ content, activity_type: activityType }),
      },
      false
    );
  },

  async askVanvasForCrewCircle(circleId: string, prompt: string, tripId?: string): Promise<{ reply: string; suggested_places: any[]; suggested_actions: any[] }> {
    return fetchWithRetry(
      `/crew-circles/${circleId}/ask-vanvas`,
      {
        method: "POST",
        body: JSON.stringify({ prompt, trip_id: tripId }),
      },
      false
    );
  },

  // ----------------- Split Pods -----------------
  async getSplitPodsInCircle(circleId: string): Promise<SplitPod[]> {
    return fetchWithRetry<SplitPod[]>(`/split-pods/circle/${circleId}`);
  },

  async createSplitPod(data: {
    circle_id: string;
    trip_id?: string;
    name: string;
    description?: string;
    member_user_ids: string[];
  }): Promise<SplitPod> {
    return fetchWithRetry<SplitPod>(
      "/split-pods",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      false
    );
  },

  // ----------------- 3-Layer Smart Finance -----------------
  async getBudgetPlanByTrip(tripId: string): Promise<TripBudgetPlan> {
    return fetchWithRetry<TripBudgetPlan>(`/finance/budget-plans/trip/${tripId}`);
  },

  async createOrGetBudgetPlan(data: {
    trip_id?: string;
    circle_id?: string;
    name?: string;
    target_budget?: number;
  }): Promise<TripBudgetPlan> {
    return fetchWithRetry<TripBudgetPlan>(
      "/finance/budget-plans",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      false
    );
  },

  async addBudgetItem(planId: string, data: any): Promise<TripBudgetItem> {
    return fetchWithRetry<TripBudgetItem>(
      `/finance/budget-plans/${planId}/items`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      false
    );
  },

  async deleteBudgetItem(itemId: string): Promise<{ message: string }> {
    return fetchWithRetry(
      `/finance/budget-plans/items/${itemId}`,
      { method: "DELETE" },
      false
    );
  },

  async getCollaborativeBalances(params: {
    trip_id?: string;
    circle_id?: string;
    split_pod_id?: string;
  }): Promise<ContextBalances> {
    const q: string[] = [];
    if (params.trip_id) q.push(`trip_id=${params.trip_id}`);
    if (params.circle_id) q.push(`circle_id=${params.circle_id}`);
    if (params.split_pod_id) q.push(`split_pod_id=${params.split_pod_id}`);
    const qs = q.length ? `?${q.join("&")}` : "";
    return fetchWithRetry<ContextBalances>(`/finance/balances${qs}`);
  },

  async createCollaborativeExpense(data: any): Promise<CollaborativeExpense> {
    return fetchWithRetry<CollaborativeExpense>(
      "/finance/expenses",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      false
    );
  },

  async recordCollaborativeSettlement(data: any): Promise<SettlementRecord> {
    return fetchWithRetry<SettlementRecord>(
      "/finance/settlements",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      false
    );
  },

  _setFetchForTesting(fn: typeof fetch | null): void {
    customFetch = fn;
  },
};
