# VANVAS Native Android App Architecture

**Version:** 0.3.0 (`versionCode 3`)  
**Package Name:** `ai.vanvas.app`  
**Platform Framework:** React Native 0.76.9 + Expo SDK 52 + Expo Router 4.0.17 (New Architecture enabled)

---

## 1. Architectural Philosophy

VANVAS Mobile is a **100% native Android and iOS mobile application**, engineered from the ground up using React Native, Expo Router, and native device primitives. It is **not** a website wrapped in a WebView.

### Dual-Platform Separation & Parity
- **Web Application (`frontend/`):** Next.js 14 responsive web platform hosted at `https://vanvasai.vercel.app`.
- **Native Mobile Application (`mobile/`):** React Native Expo application built for Google Play Store and physical device installation.
- **Shared Contracts (`packages/shared/`):** Shared domain models, TypeScript interfaces, and design tokens (Himalayan color palette, typography).
- **Backend (`vanvas-api.onrender.com`):** Unified FastAPI backend providing authentication, itineraries, destinations, copilot, and travel ledgers.

---

## 2. Navigation & Routing Architecture

Navigation is governed by **Expo Router 4** using file-based routing with native transitions:

```
mobile/app/
├── _layout.tsx                     # Root Stack layout, ThemeProvider, ConnectionBanner, Session Guard
├── (tabs)/
│   ├── _layout.tsx                 # Native bottom tab bar (Forest Dark / Parchment)
│   ├── index.tsx                   # Home: Active expedition card, quick modes, curated sanctuaries
│   ├── explore.tsx                 # Explore: Search bar, region filters, reels carousel, destination cards
│   ├── plan.tsx                    # 10-step Expedition Wizard (Spiti Motorcycle mode, gateways, rates)
│   ├── trips.tsx                   # Trips: User expedition dossiers with offline fallback
│   └── profile.tsx                 # Profile: Avatar picker, Dark/Light/Auto theme, Layout density
├── destination/
│   └── [slug].tsx                  # Destination detail: Places, Stays, Fleet single-row carousels
├── trip/
│   ├── [id].tsx                    # Itinerary timeline, Travel Ledger, Dynamic Replan, Group Circle
│   └── [id]/im-here.tsx            # I'M HERE arrival mode: real-time location, check-in, next stops
├── nearby.tsx                      # Nearby Radar: GPS proximity, mountain waypoints, fuel pumps
├── ask-vanvas.tsx                  # Ask VANVAS AI Copilot: Contextual Himalayan assistant
├── road-trip/
│   └── index.tsx                   # Scenic driving corridors
├── treks/
│   └── index.tsx                   # Himalayan trailhead guides, altitudes & difficulty
└── auth/
    ├── login.tsx                   # Native auth login
    ├── register.tsx                # Account creation
    └── verify-email.tsx            # Verification loop
```

---

## 3. State Management & Storage Strategy

### Persistent Secure Authentication
- **Engine:** `expo-secure-store`
- **Stored Data:** JWT access tokens, refresh tokens, user identity snapshot.
- **Hardware Encryption:** KeyStore on Android, Keychain on iOS.

### Local SQLite Database (`vanvas_offline.db`)
- **Engine:** `expo-sqlite` (WAL journal mode)
- **Tables & Account Isolation Contract:**
  - `destinations_cache`: Full destination catalog snapshot for zero-connectivity discovery (Global public read/write).
  - `destination_details_cache`: Places, stays, and rental fleets cached per slug (Global public read/write).
  - `user_trips_cache`: Trip summaries for instant home & trips rendering (`PRIMARY KEY (trip_id, user_id)`).
  - `trip_details_cache`: Deep itinerary days, schedule items, and waypoint notes (`PRIMARY KEY (trip_id, user_id)`).
  - `expenses_cache`: Travel ledger receipts, amounts, categories, sync flags, and mandatory `user_id TEXT NOT NULL`.
  - `offline_mutation_queue`: FIFO queue of offline operations strictly tagged with `user_id TEXT NOT NULL`.
  - `schema_migrations`: Versioned migration journal (`version INTEGER PRIMARY KEY`, `migrated_at TEXT`).
  - `legacy_quarantine_user_trips_cache` & `legacy_quarantine_trip_details_cache`: Quarantined unowned legacy rows.
- **Performance Indexes:**
  - `idx_expenses_user_trip`: `expenses_cache(user_id, trip_id)`
  - `idx_mutations_user_created`: `offline_mutation_queue(user_id, created_at)`
  - `idx_trip_details_user_trip`: `trip_details_cache(user_id, trip_id)`
  - `idx_user_trips_user_updated`: `user_trips_cache(user_id, updated_at)`
- **Privacy & Legacy Data Governance:**
  - **Zero NULL user_id Leakage:** All private queries use exact `WHERE user_id = ?`. Queries never include `OR user_id IS NULL`. `validateUserId(userId, methodName)` strictly rejects missing, empty, or whitespace-only user IDs.
  - **Existing-Install Composite Key Migration:** `migrateTableToCompositePrimaryKey(db, tableName)` inspects `PRAGMA table_info` for composite primary key `(trip_id, user_id)`. Unowned legacy rows (`user_id IS NULL OR TRIM(user_id) = ''`) are copied to `legacy_quarantine_*` tables. Valid rows are copied into replacement tables with `PRIMARY KEY (trip_id, user_id)` and indexes are recreated atomically. Version tracked in `schema_migrations`.
  - **Fail-Safe Migration Guard:** Additive schema migrations run on database initialization with post-migration verification. If migration fails, private cache queries fail-safely throw and block access to prevent unauthenticated data leaks.
  - **Scoped Mutation Removal & Cancellation:** `removeMutation(userId, id)` requires `userId` and deletes strictly with `WHERE id = ? AND user_id = ?`. `cancelOfflineExpenseMutation(userId, offlineId)` safely removes pending `add_expense` mutations for unsynced local expenses.
  - **In-Memory Fallback Parity:** In web or fallback mode, keys are strictly scoped by account (`trip_detail_${userId}_${tripId}`, `expenses_${userId}_${tripId}`, `user_trips_${userId}`).
  - **Replay Deduplication Guard:** Offline expenses embed `offline_client_id` inside `receipt_data_json`. During reconnection replay, mutations check existing server expenses before re-POSTing. Failed reconciliation GET preserves mutations and halts replay.
  - **Decoupled Expense Creation:** Remote server POST and local SQLite persistence are decoupled. Local cache write failure does not enqueue a duplicate offline mutation. Offline expense deletion before sync cancels pending mutations without enqueuing server DELETE.
  - **Single-Owner Account Deletion Teardown:** Centralized `executeAccountDeletionTeardown` in `mobile/src/services/authTeardown.ts` guarantees session and SecureStore clearance even if local SQLite purge fails.

---

## 4. Visual Identity & Brand Execution

- **Palette:**
  - Forest Dark: `#17352C`
  - Pine Green: `#2D5A4C`
  - Terracotta: `#C45C3B`
  - Brass / Ochre: `#C5A059`
  - Mountain Mist: `#9BB0A6`
  - Parchment: `#FAF6F0`
- **Image Resolution:** 
  - Verified painterly gouache travel-journal artwork.
  - Bundled local assets with fallback to production CDN.
  - Edge-to-edge layout with Android translucent status bar and immersive navigation.

