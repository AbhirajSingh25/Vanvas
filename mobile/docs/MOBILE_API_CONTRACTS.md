# VANVAS Mobile API Contracts & Backend Integration

**Backend Host:** `https://vanvas-api.onrender.com`  
**Authentication Scheme:** Bearer JWT in `Authorization` header  
**Offline Cache Layer:** SQLite (`mobile/src/services/db.ts`)

---

## 1. Authentication Endpoints

### POST `/auth/login`
- **Request:** `{ email: string, password_hash: string }`
- **Response:** `{ access_token: string, refresh_token: string, user: User }`
- **Native Handling:** Stores JWT and User in `expo-secure-store`.

### POST `/auth/register`
- **Request:** `{ email: string, password: string, full_name: string }`
- **Response:** `{ message: string, user: User }`

### GET `/auth/me`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `User` object (name, email, preferences, theme, density).

### PUT `/auth/profile`
- **Request:** Partial `User` object (name, style, preferences, theme, density).
- **Response:** Updated `User` object.

### POST `/auth/profile/avatar`
- **Body:** `multipart/form-data` with `file` (image).
- **Response:** `{ avatar_url: string, message: string }`

---

## 2. Destinations & Catalog Endpoints

### GET `/destinations`
- **Query Params:** `featured_only=true|false`, `search=string`
- **Response:** `Destination[]`
- **Offline Behavior:** Saved in SQLite table `destinations_cache`. If offline, reads from SQLite.

### GET `/destinations/search?q={query}&limit={limit}`
- **Response:** `Destination[]`
- **Offline Behavior:** Falls back to case-insensitive SQL query or SQLite filtered scan.

### GET `/destinations/{slug_or_id}`
- **Response:** Deep destination object (highlights, season, places, stays, rentals).
- **Offline Behavior:** Cached in `destination_details_cache`.

### GET `/destinations/{destination_id}/places?category={category}`
- **Response:** `Place[]`

### GET `/hotels?destination_id={destination_id}`
- **Response:** `Hotel[]`

### GET `/rentals?destination_id={destination_id}`
- **Response:** `RentalOption[]`

---

## 3. Trips & Expedition Management

### GET `/trips`
- **Response:** `TripSummary[]`
- **Offline Behavior:** Cached in `user_trips_cache`.

### GET `/trips/{trip_id}`
- **Response:** Deep `Trip` object with `itinerary_days: ItineraryDay[]`.
- **Offline Behavior:** Cached in `trip_details_cache`.

### POST `/trips`
- **Request:**
  ```json
  {
    "destination_id": "spiti",
    "start_date": "2026-06-10",
    "end_date": "2026-06-18",
    "origin_city": "Chandigarh",
    "transport_mode": "motorcycle",
    "budget": 35000,
    "travellers_count": 2,
    "companion_type": "friends",
    "travel_style": "adventure",
    "wake_up_preference": "early",
    "activity_intensity": "high",
    "interests": ["Treks", "Monasteries", "High Passes"],
    "transport_details": {
      "model": "Royal Enfield Himalayan 450",
      "gateway": "Chandigarh",
      "kaza_commercial_warning_acknowledged": true
    }
  }
  ```
- **Response:** Full `Trip` object with generated multi-day itinerary.

### PUT `/trips/{trip_id}/items/{item_id}?status={pending|completed|skipped}`
- **Response:** Updated item status.
- **Native Handling:** Optimistic update in UI, rollback on rejection.

### POST `/trips/{trip_id}/replan`
- **Request:** `{ action_type: string, day_number: number }`
- **Action Types:** `delay_1h`, `weather_delay`, `rest_break`, `skip_current`
- **Response:** `{ success: boolean, message: string, trip: Trip }`

---

## 4. Arrival Mode & Context

### POST `/trips/{trip_id}/im-here`
- **Request:**
  ```json
  {
    "current_lat": 32.2276,
    "current_lng": 78.0710,
    "current_location_name": "Kaza, Spiti Valley"
  }
  ```
- **Response:**
  ```json
  {
    "trip_id": "...",
    "current_time": "14:30",
    "now_item": { "title": "Key Gompa Exploration", "time": "14:30 - 16:30", "category": "Sacred" },
    "next_item": { "title": "Kibber Village Wildlife Trail", "time": "17:00 - 18:30" },
    "later_items": [],
    "hotel_checkin_guidance": {
      "status": "ready",
      "message": "Homestay ready for check-in after 14:00."
    }
  }
  ```

---

## 5. Travel Ledger & Expenses

### GET `/trips/{trip_id}/expenses`
- **Response:** `Expense[]`
- **Offline Behavior:** Synced with SQLite `expenses_cache`.

### POST `/trips/{trip_id}/expenses`
- **Request:** `{ title: string, amount: number, category: string, date: string, notes?: string }`
- **Response:** `Expense` object.
- **Offline Behavior:** If offline, saved to `expenses_cache` with `sync_status = 'pending'`, queued in `offline_mutation_queue`, and auto-synced upon reconnection.

### DELETE `/trips/{trip_id}/expenses/{expense_id}`
- **Response:** `204 No Content` / `{ success: true }`

---

## 6. AI Copilot (`/copilot/chat`)

### POST `/copilot/chat`
- **Request:** `{ message: string, conversation_id?: string, trip_id?: string, destination_slug?: string }`
- **Response:** `{ response: string, conversation_id: string }`
- **Handling:** Fallback response provided if network connection times out.

